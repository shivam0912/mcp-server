import type { Metadata } from "next";
import { ChatWorkspace } from "./workspace";
export const metadata: Metadata = { title: "AI Workspace" };
export default function ChatPage(){return <main className="page-shell chat-page"><div className="page-head"><div><span className="eyebrow">AI Workspace · MCP client</span><h1>Ask your knowledge base.</h1></div><p>Web chat or VS Code → ContextBridge MCP server → selected SQLite records and imported documents. The server never receives unrestricted computer access.</p></div><ChatWorkspace/></main>}
