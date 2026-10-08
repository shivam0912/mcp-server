import { rm } from "node:fs/promises";
import { resolve } from "node:path";

if (!process.argv.includes("--yes")) {
  console.error("This deletes local uploads and rebuilds the demo database. Run: npm run reset -- --yes");
  process.exitCode = 1;
} else {
  const dataDirectory=resolve(process.cwd(),"data");
  for(const target of ["contextbridge.sqlite","contextbridge.sqlite-shm","contextbridge.sqlite-wal"]){await rm(resolve(dataDirectory,target),{force:true});}
  await rm(resolve(dataDirectory,"files"),{recursive:true,force:true});
  const { KnowledgeRepository }=await import("@contextbridge/retrieval");
  const repository=new KnowledgeRepository({databasePath:resolve(dataDirectory,"contextbridge.sqlite")});
  console.log(`Reset complete: ${repository.listDocuments().length} seeded documents in ${repository.databasePath}`);
  repository.close();
}
