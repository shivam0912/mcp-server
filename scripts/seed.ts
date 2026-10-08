import { KnowledgeRepository, records } from "@contextbridge/retrieval";
const repository = new KnowledgeRepository();
console.log(`Local SQLite database ready at ${repository.databasePath}`);
console.log(`Seed data ready: ${repository.listDocuments().filter(document=>document.source==="seed").length} documents, ${records.length} records.`);
repository.close();
