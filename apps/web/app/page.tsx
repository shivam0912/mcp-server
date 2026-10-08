import Link from "next/link";
import { ArrowRight, BookOpenCheck, Braces, CheckCircle2, Database, FileSearch, Gauge, LockKeyhole, MessagesSquare, Network, ShieldCheck, type LucideIcon } from "lucide-react";

const architectureSteps:Array<[LucideIcon,string,string]>=[
  [MessagesSquare,"AI client","Web chat or VS Code receives a question."],
  [Network,"MCP protocol","The client discovers tools and invokes one with validated input."],
  [ShieldCheck,"ContextBridge","The server enforces its narrow read-only boundary."],
  [Database,"Local knowledge","SQLite searches seeded records and explicitly imported files."],
  [BookOpenCheck,"Evidence","The client receives bounded results with real citations."]
];
const features:Array<[LucideIcon,string,string,string]>=[
  [FileSearch,"Controlled retrieval","Search only the documents selected for this collection.","search_documents"],
  [LockKeyhole,"Scoped access","MCP tools expose defined capabilities—not unrestricted computer access.","Bearer · policy · Zod"],
  [Gauge,"Measured, not made up","Evaluation and latency metrics come from real runs.","40 labeled scenarios"],
  [Braces,"True MCP surface","Tools, resources, prompts, Streamable HTTP, and stdio use the official SDK.","HTTP · stdio"],
  [BookOpenCheck,"Verified citations","Only source identifiers returned by tools appear as evidence.","document#chunk"],
  [ShieldCheck,"Untrusted documents","Retrieved text is evidence, not authority, and cannot rewrite policy.","prompt injection boundary"]
];

export default function Home(){return <main>
  <section className="hero"><div className="hero-copy"><div className="eyebrow">Model Context Protocol · Local Knowledge</div><h1>Connect AI to <span>selected context.</span></h1><p>ContextBridge is the controlled bridge between an AI client and your local knowledge base. Import the files you choose, then query the same MCP tools from this web workspace or VS Code.</p><div className="hero-actions"><Link className="button coral" href="/chat">Try the workspace <ArrowRight size={17}/></Link><Link className="button secondary" href="/docs"><Braces size={17}/> Connect another client</Link></div><div className="trust-row"><span><i/>Real MCP tool calls</span><span><i/>Read-only selected files</span><span><i/>No fabricated metrics</span></div></div><div className="console" aria-label="Example MCP tool trace"><div className="console-top"><i/><i/><i/><span>mcp-tool-trace.json</span></div><div className="console-body"><div><span className="dim">01</span> client.<span className="accent">listTools</span>()</div><div><span className="dim">02</span> → <span className="orange">search_documents</span></div><div><span className="dim">03</span> {`{ query: "authentication mechanism",`}</div><div><span className="dim">04</span> {`  search_mode: "hybrid" }`}</div><div className="trace-card"><b><CheckCircle2 size={15}/> Evidence received · 42 ms</b><p>Authentication Design · Public demo<br/>citation: authentication-design#…</p></div></div></div></section>
  <section className="section architecture"><div className="inner"><div className="section-heading"><div><span className="eyebrow">What MCP connects</span><h2>One server.<br/>Multiple AI clients.</h2></div><p>MCP standardizes how clients discover and invoke capabilities. ContextBridge exposes only four controlled knowledge tools; it never hands an AI unrestricted filesystem or database access.</p></div><div className="flow">{architectureSteps.map(([Icon,title,text],index)=><div className="flow-card" key={title}><span className="number">0{index+1}</span><Icon size={22}/><h3>{title}</h3><p>{text}</p></div>)}</div></div></section>
  <section className="section"><div className="section-heading"><div><span className="eyebrow">Built for inspection</span><h2>Useful to users.<br/>Credible to engineers.</h2></div></div><div className="features">{features.map(([Icon,title,text,code])=><article className="feature" key={title}><span className="feature-icon"><Icon size={20}/></span><h3>{title}</h3><p>{text}</p><code>{code}</code></article>)}</div></section>
  <section className="cta"><div><h2>One server, multiple AI clients.</h2><p>Use the web workspace now, or connect VS Code to the same local MCP endpoint.</p></div><Link href="/docs" className="button coral">Connect VS Code <ArrowRight size={17}/></Link></section>
</main>}
