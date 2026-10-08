import { NextResponse } from "next/server";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){try{const response=await fetch(`${process.env.MCP_BACKEND_URL??"http://127.0.0.1:8787"}/documents`,{cache:"no-store"});return new NextResponse(await response.text(),{status:response.status,headers:{"content-type":"application/json"}})}catch{return NextResponse.json({error:{message:"The local MCP server is not running."}},{status:503})}}
