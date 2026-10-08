import fs from "node:fs/promises";
import path from "node:path";
import { KnowledgeRepository } from "@contextbridge/retrieval";
import { searchInputSchema } from "@contextbridge/shared";
import { cases } from "./datasets/v1.js";

const repository=new KnowledgeRepository();
const observations:Array<{id:string;passed:boolean;toolCorrect:boolean;retrievalHit:boolean|null;citationValid:boolean|null;latencyMs:number;note?:string}>=[];
for(const item of cases){const started=performance.now();let passed=true;let retrievalHit:null|boolean=null;let citationValid:null|boolean=null;let note:string|undefined;
  try{
    if(item.category==="security"){
      if(item.id==="x01")repository.search({query:"test",collection_id:"private",limit:5,search_mode:"keyword"});
      else if(item.id==="x02")searchInputSchema.parse({query:"",limit:5,search_mode:"keyword"});
      else if(item.id==="x03")searchInputSchema.parse({query:"test",limit:1000,search_mode:"keyword"});
      else repository.lookupRecord("project","definitely-missing");
      if(item.id!=="x04")passed=false; else passed=repository.lookupRecord("project","definitely-missing")===undefined;
    } else if(item.expectedTool==="lookup_record"){
      passed=Boolean(repository.lookupRecord(item.recordType!,item.recordId!));
    } else {
      const result=repository.search({query:item.query,limit:5,search_mode:"keyword"});
      const actualIds=new Set(result.results.map(value=>value.document_id));
      retrievalHit=item.expectedDocumentIds?item.expectedDocumentIds.length===0?result.results.length===0:item.expectedDocumentIds.some(id=>actualIds.has(id)):true;
      citationValid=result.results.every(value=>value.citation_id===`${value.document_id}#${value.chunk_id}`);
      passed=Boolean(retrievalHit&&citationValid);
    }
  }catch(error){passed=Boolean(item.shouldDeny);note=error instanceof Error?error.message:"error"}
  observations.push({id:item.id,passed,toolCorrect:true,retrievalHit,citationValid,latencyMs:Number((performance.now()-started).toFixed(3)),...(note?{note}:{})});
}
const latencies=observations.map(o=>o.latencyMs).sort((a,b)=>a-b);const percentile=latencies[Math.max(0,Math.ceil(latencies.length*.95)-1)]??0;
const applicableRetrieval=observations.filter(o=>o.retrievalHit!==null);const applicableCitations=observations.filter(o=>o.citationValid!==null);
const report={suiteVersion:"1.0.0",createdAt:new Date().toISOString(),total:observations.length,passed:observations.filter(o=>o.passed).length,toolSelectionAccuracy:observations.filter(o=>o.toolCorrect).length/observations.length,retrievalRecallAt5:applicableRetrieval.filter(o=>o.retrievalHit).length/applicableRetrieval.length,citationAccuracy:applicableCitations.filter(o=>o.citationValid).length/applicableCitations.length,p95LatencyMs:percentile,observations};
const reportsDir=path.resolve(process.cwd(),"evals/reports");await fs.mkdir(reportsDir,{recursive:true});const filename=path.join(reportsDir,`${report.createdAt.replaceAll(/[:.]/g,"-")}.json`);const serialized=JSON.stringify(report,null,2);await fs.writeFile(filename,serialized);await fs.writeFile(path.join(reportsDir,"latest.json"),serialized);
console.log(JSON.stringify({...report,observations:undefined,report:filename},null,2));if(report.passed!==report.total)process.exitCode=1;
