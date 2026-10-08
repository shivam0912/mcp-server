import type { Metadata } from "next";
import { ChatWorkspace } from "./workspace";
export const metadata: Metadata = { title: "AI Workspace" };
export default function ChatPage(){return <main className="page-shell"><div className="page-head"><div><span className="eyebrow">AI Workspace</span><h1>Ask the lab.</h1></div><p>Each response travels through an MCP client. Expand the activity rail to verify which tools and sources were used.</p></div><ChatWorkspace/></main>}
