"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, LoaderCircle, Search } from "lucide-react";

type Turn={role:"user"|"assistant";content:string;citations?:string[]};
type Trace={tool:string;durationMs:number;arguments:Record<string,unknown>;success:boolean};

export function ChatWorkspace(){
  const [turns,setTurns]=useState<Turn[]>([{role:"assistant",content:"I’m connected through MCP to your local Computer Science Research Lab collection. I can use only the documents you imported and the seeded demo records—not arbitrary files on your computer. Ask what documents are available, query their content, or inspect the tool trace."}]);
  const [trace,setTrace]=useState<Trace[]>([]);
  const [input,setInput]=useState("");
  const [busy,setBusy]=useState(false);
  const messagesRef=useRef<HTMLDivElement>(null);

  useEffect(()=>{const container=messagesRef.current;if(container)container.scrollTo({top:container.scrollHeight,behavior:"smooth"})},[turns,busy]);

  async function submit(){
    const question=input.trim();if(!question||busy)return;
    setInput("");setBusy(true);setTurns(value=>[...value,{role:"user",content:question}]);
    try{
      const response=await fetch("/api/chat",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({question})});
      const data=await response.json() as {answer?:string;citations?:string[];trace?:Trace[];error?:string};
      if(!response.ok)throw new Error(data.error??"Request failed");
      setTurns(value=>[...value,{role:"assistant",content:data.answer??"No answer was returned.",...(data.citations?{citations:data.citations}:{})}]);setTrace(data.trace??[]);
    }catch(error){setTurns(value=>[...value,{role:"assistant",content:error instanceof Error?`I couldn’t complete that request: ${error.message}`:"The request failed."}])}
    finally{setBusy(false)}
  }

  return <div className="chat-grid"><section className="panel chat-panel"><div className="chat-toolbar"><div className="status"><i/> Web MCP client → local server → SQLite</div><span className="eyebrow">Selected documents · read only</span></div><div className="messages" ref={messagesRef} aria-live="polite">{turns.map((turn,index)=><div className={`message ${turn.role}`} key={index}>{turn.content}{turn.citations?.length?<div className="citations">{turn.citations.map(citation=><span className="citation" key={citation}>{citation}</span>)}</div>:null}</div>)}{busy?<div className="message assistant"><LoaderCircle className="spin" size={16}/> Searching authorized evidence…</div>:null}</div><div className="composer"><textarea aria-label="Ask a question" value={input} onChange={event=>setInput(event.target.value)} onKeyDown={event=>{if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();void submit()}}} placeholder="What documents are available?"/><button className="button" onClick={()=>void submit()} disabled={busy} aria-label="Send question"><ArrowUp size={18}/></button></div></section><aside className="panel trace"><h2>MCP activity</h2>{trace.length===0?<div className="notice"><Search size={16}/><br/>A real MCP tool trace will appear after your first question.</div>:trace.map((item,index)=><div className="trace-step" key={`${item.tool}-${index}`}><strong>{item.tool}</strong><br/><small>{item.success?"Succeeded":"Failed"} · {item.durationMs} ms</small><p>{JSON.stringify(item.arguments,null,2)}</p></div>)}</aside></div>;
}
