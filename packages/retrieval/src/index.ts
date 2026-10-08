import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { COLLECTION_ID, type SearchInput, type SearchResult } from "@contextbridge/shared";
import { documents as seedDocuments, records as seedRecords } from "@contextbridge/retrieval/data";

const normalize = (value: string) => value.toLowerCase().normalize("NFKC").replaceAll(/[^a-z0-9\s]/g, " ").replaceAll(/\s+/g, " ").trim();
const stopwords = new Set(["a","an","and","are","as","at","be","by","do","does","for","from","how","i","in","is","it","me","of","on","or","that","the","this","to","use","uses","using","what","where","which","who","with"]);
const stem = (term: string) => term.replace(/(ations|ation|ating|ated)$/," ").trim().replace(/(ing|ed|es|s)$/," ").trim() || term;
const terms = (value: string) => [...new Set(normalize(value).split(" ").filter((term) => term.length > 1 && !stopwords.has(term)).map(stem))];
const tokensMatch = (left: string, right: string) => left === right || (left.length >= 3 && right.length >= 3 && (left.startsWith(right) || right.startsWith(left)));
export const defaultDataDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "../../../data");

export function chunkText(text: string, size = 600, overlap = 100) {
  const words = text.replaceAll(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (!words.length) return [];
  const chunks: Array<{ content: string; tokenCount: number }> = [];
  const step = Math.max(1, size - overlap);
  for (let start = 0; start < words.length; start += step) {
    const slice = words.slice(start, start + size);
    if (!slice.length) break;
    chunks.push({ content: slice.join(" "), tokenCount: slice.length });
    if (start + size >= words.length) break;
  }
  return chunks;
}

type RepositoryOptions = { databasePath?: string };
type DocumentRow = { id:string; collection_id:string; title:string; description:string; file_path:string|null; mime_type:string; checksum:string; source:"seed"|"upload"; ingestion_status:string; ingestion_error:string|null; created_at:string; updated_at:string };
type ChunkRow = { id:string; document_id:string; chunk_index:number; content:string; page_number:number|null; section_title:string|null; token_count:number };
type RecordRow = { id:string; collection_id:string; record_type:"project"|"course"|"research"; record_key:string; title:string; data_json:string };

export class KnowledgeRepository {
  readonly collectionId = COLLECTION_ID;
  readonly databasePath: string;
  private readonly database: Database.Database;

  constructor(options: RepositoryOptions = {}) {
    this.databasePath = options.databasePath ?? process.env.CONTEXTBRIDGE_DATABASE_PATH ?? resolve(defaultDataDirectory, "contextbridge.sqlite");
    if (this.databasePath !== ":memory:") mkdirSync(dirname(this.databasePath), { recursive: true });
    this.database = new Database(this.databasePath);
    this.database.pragma("foreign_keys = ON");
    if (this.databasePath !== ":memory:") this.database.pragma("journal_mode = WAL");
    this.migrate();
    this.seed();
  }

  search(input: SearchInput): { results: SearchResult[]; search_mode_used: "keyword"; notice?: string } {
    this.assertCollection(input.collection_id);
    const queryTerms = terms(input.query);
    const normalizedQuery = normalize(input.query);
    const rows = this.database.prepare(`select d.id as document_id,d.title as document_title,c.id as chunk_id,c.content,c.page_number,c.section_title from document_chunks c join documents d on d.id=c.document_id where d.collection_id=? and d.ingestion_status='ready'`).all(COLLECTION_ID) as Array<{document_id:string;document_title:string;chunk_id:string;content:string;page_number:number|null;section_title:string|null}>;
    const ranked = rows.map((row) => {
      const haystack = terms(`${row.document_title} ${row.section_title ?? ""} ${row.content}`);
      const matched = queryTerms.filter((term) => haystack.some((token) => tokensMatch(term, token)));
      const titleTerms = terms(row.document_title);
      const titleMatches = queryTerms.filter((term) => titleTerms.some((token) => tokensMatch(term, token)));
      const coverage = queryTerms.length ? matched.length / queryTerms.length : 0;
      const titleCoverage = queryTerms.length ? titleMatches.length / queryTerms.length : 0;
      const phrase = normalizedQuery.length > 3 && normalize(`${row.document_title} ${row.section_title ?? ""} ${row.content}`).includes(normalizedQuery) ? 0.35 : 0;
      return { row, score: Math.min(1, coverage * 0.65 + titleCoverage * 0.25 + phrase) };
    }).filter(({ score }) => score >= 0.2).sort((a,b) => b.score-a.score || a.row.chunk_id.localeCompare(b.row.chunk_id)).slice(0,input.limit);
    const results = ranked.map(({row,score}) => ({ document_id:row.document_id, document_title:row.document_title, chunk_id:row.chunk_id, excerpt:row.content.slice(0,420), relevance_score:Number(score.toFixed(4)), page:row.page_number ?? 1, section:row.section_title ?? "Imported content", citation_id:`${row.document_id}#${row.chunk_id}` }));
    return { results, search_mode_used:"keyword", ...(input.search_mode!=="keyword"?{notice:"Embeddings are not configured in local mode; deterministic keyword retrieval was used."}:{}) };
  }

  getDocument(documentId:string, sectionId?:string, chunkId?:string) {
    const document=this.database.prepare("select * from documents where id=? and collection_id=? and ingestion_status='ready'").get(documentId,COLLECTION_ID) as DocumentRow|undefined;
    if(!document)return undefined;
    let chunks=this.database.prepare("select * from document_chunks where document_id=? order by chunk_index").all(documentId) as ChunkRow[];
    if(chunkId)chunks=chunks.filter(chunk=>chunk.id===chunkId);
    if(sectionId)chunks=chunks.filter(chunk=>normalize(chunk.section_title??"")===normalize(sectionId));
    if((chunkId||sectionId)&&chunks.length===0)return undefined;
    return {document:{id:document.id,title:document.title,description:document.description,mime_type:document.mime_type,updated_at:document.updated_at},sections:chunks.map(chunk=>({chunk_id:chunk.id,section:chunk.section_title??"Imported content",page:chunk.page_number??1,content:chunk.content,citation_id:`${document.id}#${chunk.id}`})),truncated:false};
  }

  lookupRecord(type:"project"|"course"|"research",id:string) {
    const needle=normalize(id);const rows=this.database.prepare("select * from knowledge_records where collection_id=? and record_type=?").all(COLLECTION_ID,type) as RecordRow[];
    const row=rows.find(record=>[record.id,record.record_key,record.title].some(value=>normalize(value)===needle));
    return row?{id:row.id,collectionId:row.collection_id,type:row.record_type,key:row.record_key,title:row.title,fields:JSON.parse(row.data_json) as Record<string,string|number|string[]>}:undefined;
  }

  overview(){const summary=this.database.prepare("select count(*) as count,max(updated_at) as updated from documents where collection_id=? and ingestion_status='ready'").get(COLLECTION_ID) as {count:number;updated:string|null};return{id:COLLECTION_ID,name:"Computer Science Research Lab",description:"A local-first collection backed by SQLite. Seeded content is fictional; uploaded content stays on this computer.",document_count:summary.count,supported_record_types:["project","course","research"],topics:["MCP","information retrieval","NLP","application security","SQLite","LLM evaluation"],last_successful_ingestion:summary.updated};}

  listDocuments(){return this.database.prepare(`select d.id,d.collection_id as collectionId,d.title,d.description,d.mime_type as mimeType,d.checksum,d.source,d.ingestion_status as ingestionStatus,d.ingestion_error as ingestionError,d.created_at as createdAt,d.updated_at as updatedAt,count(c.id) as chunkCount from documents d left join document_chunks c on c.document_id=d.id where d.collection_id=? group by d.id order by d.source desc,d.updated_at desc,d.title`).all(COLLECTION_ID) as Array<{id:string;collectionId:string;title:string;description:string;mimeType:string;checksum:string;source:string;ingestionStatus:string;ingestionError:string|null;createdAt:string;updatedAt:string;chunkCount:number}>;}
  findByChecksum(checksum:string){return this.database.prepare("select id,title from documents where collection_id=? and checksum=?").get(COLLECTION_ID,checksum) as {id:string;title:string}|undefined;}

  ingestDocument(input:{id:string;title:string;description:string;filePath:string;mimeType:string;checksum:string;text:string}){
    const chunks=chunkText(input.text);if(!chunks.length)throw new Error("EMPTY_DOCUMENT");const now=new Date().toISOString();
    this.database.transaction(()=>{this.database.prepare(`insert into documents(id,collection_id,title,description,file_path,mime_type,checksum,source,ingestion_status,created_at,updated_at) values(?,?,?,?,?,?,?,?,?,?,?)`).run(input.id,COLLECTION_ID,input.title,input.description,input.filePath,input.mimeType,input.checksum,"upload","ready",now,now);const insert=this.database.prepare(`insert into document_chunks(id,document_id,chunk_index,content,page_number,section_title,token_count) values(?,?,?,?,?,?,?)`);chunks.forEach((chunk,index)=>insert.run(`${input.id}-c${index+1}`,input.id,index,chunk.content,index+1,"Imported content",chunk.tokenCount));})();
    return this.listDocuments().find(document=>document.id===input.id);
  }

  replaceDocumentText(documentId:string,text:string){const chunks=chunkText(text);if(!chunks.length)throw new Error("EMPTY_DOCUMENT");const now=new Date().toISOString();this.database.transaction(()=>{this.database.prepare("delete from document_chunks where document_id=?").run(documentId);const insert=this.database.prepare(`insert into document_chunks(id,document_id,chunk_index,content,page_number,section_title,token_count) values(?,?,?,?,?,?,?)`);chunks.forEach((chunk,index)=>insert.run(`${documentId}-c${index+1}`,documentId,index,chunk.content,index+1,"Imported content",chunk.tokenCount));this.database.prepare("update documents set ingestion_status='ready',ingestion_error=null,updated_at=? where id=? and source='upload'").run(now,documentId);})();return this.listDocuments().find(document=>document.id===documentId);}
  getStoredDocument(documentId:string){return this.database.prepare("select * from documents where id=? and source='upload'").get(documentId) as DocumentRow|undefined;}
  deleteUploadedDocument(documentId:string){const row=this.getStoredDocument(documentId);if(!row)return undefined;this.database.prepare("delete from documents where id=? and source='upload'").run(documentId);return row;}
  recordToolCall(toolName:string,success:boolean,durationMs:number,errorCode?:string){this.database.prepare("insert into tool_calls(id,tool_name,success,duration_ms,error_code,created_at) values(?,?,?,?,?,?)").run(crypto.randomUUID(),toolName,success?1:0,Math.max(0,Math.round(durationMs)),errorCode??null,new Date().toISOString());}
  activity(){const aggregate=this.database.prepare("select count(*) as total,coalesce(sum(success),0) as successful,coalesce(avg(duration_ms),0) as average from tool_calls").get() as {total:number;successful:number;average:number};const latencies=(this.database.prepare("select duration_ms from tool_calls order by duration_ms").all() as Array<{duration_ms:number}>).map(row=>row.duration_ms);const p95=latencies[Math.max(0,Math.ceil(latencies.length*.95)-1)]??0;return{total_tool_calls:aggregate.total,success_rate:aggregate.total?aggregate.successful/aggregate.total:0,average_latency_ms:Number(aggregate.average.toFixed(2)),p95_latency_ms:p95};}
  close(){this.database.close();}

  private migrate(){this.database.exec(`
    create table if not exists documents(id text primary key,collection_id text not null,title text not null,description text not null default '',file_path text,mime_type text not null,checksum text not null,source text not null check(source in('seed','upload')),ingestion_status text not null check(ingestion_status in('processing','ready','failed')),ingestion_error text,created_at text not null,updated_at text not null,unique(collection_id,checksum));
    create table if not exists document_chunks(id text primary key,document_id text not null references documents(id) on delete cascade,chunk_index integer not null,content text not null,page_number integer,section_title text,token_count integer not null,unique(document_id,chunk_index));
    create table if not exists knowledge_records(id text primary key,collection_id text not null,record_type text not null,record_key text not null,title text not null,data_json text not null,unique(collection_id,record_type,record_key));
    create table if not exists chat_sessions(id text primary key,collection_id text not null,created_at text not null);
    create table if not exists chat_messages(id text primary key,session_id text not null references chat_sessions(id) on delete cascade,role text not null,content text not null,citations_json text not null default '[]',created_at text not null);
    create table if not exists tool_calls(id text primary key,tool_name text not null,success integer not null,duration_ms integer not null,error_code text,created_at text not null);
    create index if not exists chunks_document_idx on document_chunks(document_id,chunk_index);create index if not exists documents_collection_idx on documents(collection_id,ingestion_status);create index if not exists records_type_idx on knowledge_records(collection_id,record_type);
  `);}

  private seed(){const insertDocument=this.database.prepare(`insert or ignore into documents(id,collection_id,title,description,file_path,mime_type,checksum,source,ingestion_status,created_at,updated_at) values(?,?,?,?,?,?,?,?,?,?,?)`);const insertChunk=this.database.prepare(`insert or ignore into document_chunks(id,document_id,chunk_index,content,page_number,section_title,token_count) values(?,?,?,?,?,?,?)`);const insertRecord=this.database.prepare(`insert or ignore into knowledge_records(id,collection_id,record_type,record_key,title,data_json) values(?,?,?,?,?,?)`);this.database.transaction(()=>{for(const document of seedDocuments){insertDocument.run(document.id,document.collectionId,document.title,document.description,null,document.mimeType,`seed-${document.id}`,"seed","ready",document.updatedAt,document.updatedAt);document.chunks.forEach((chunk,index)=>insertChunk.run(chunk.id,document.id,index,chunk.content,chunk.pageNumber,chunk.sectionTitle,chunk.content.split(/\s+/).length));}for(const record of seedRecords)insertRecord.run(record.id,record.collectionId,record.type,record.key,record.title,JSON.stringify(record.fields));})();}
  private assertCollection(collectionId?:string){if(collectionId&&collectionId!==COLLECTION_ID)throw new Error("FORBIDDEN_COLLECTION");}
}

export { seedDocuments as documents, seedRecords as records };
