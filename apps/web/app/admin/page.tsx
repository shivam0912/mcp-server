import type { Metadata } from "next";
import { AdminWorkspace } from "./admin-workspace";
export const metadata:Metadata={title:"Admin"};
export default function AdminPage(){return <main className="page-shell"><div className="page-head"><div><span className="eyebrow">Local operations</span><h1>Collection admin.</h1></div><p>Add your own material without a hosted database. Uploaded documents become available to MCP clients immediately.</p></div><AdminWorkspace/></main>}
