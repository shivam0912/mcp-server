import type { Metadata } from "next";
import { KnowledgeLibrary } from "./knowledge-library";
export const metadata:Metadata={title:"Knowledge Base"};
export default function KnowledgePage(){return <main className="page-shell"><div className="page-head"><div><span className="eyebrow">Local collection</span><h1>Knowledge base.</h1></div><p>Seeded learning material and documents you upload are indexed in SQLite on this computer. Nothing is sent to a cloud database.</p></div><KnowledgeLibrary/></main>}
