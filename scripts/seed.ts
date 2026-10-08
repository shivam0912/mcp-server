import { documents, records } from "@contextbridge/retrieval";
console.log(`Seed data is source-controlled and ready: ${documents.length} documents, ${records.length} records.`);
console.log("For Supabase, apply migrations first, then adapt this deterministic dataset through the repository adapter.");
