import { NextResponse } from "next/server";
export const runtime="nodejs";export const dynamic="force-dynamic";
const endpoint=()=>`${process.env.MCP_BACKEND_URL??"http://127.0.0.1:8787"}/admin/documents`;
const headers=()=>process.env.ADMIN_API_KEY?{Authorization:`Bearer ${process.env.ADMIN_API_KEY}`}:{ };
export async function GET(){try{const response=await fetch(endpoint(),{headers:headers(),cache:"no-store"});return new NextResponse(await response.text(),{status:response.status,headers:{"content-type":"application/json"}})}catch{return NextResponse.json({error:{message:"The local MCP server is not running."}},{status:503})}}
export async function POST(request:Request){try{const form=await request.formData();const response=await fetch(endpoint(),{method:"POST",headers:headers(),body:form});return new NextResponse(await response.text(),{status:response.status,headers:{"content-type":"application/json"}})}catch{return NextResponse.json({error:{message:"The local MCP server is not running."}},{status:503})}}
