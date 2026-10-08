import fs from "node:fs";
import path from "node:path";
const ignored=new Set(["node_modules",".git",".next","dist"]);const patterns=[/sk-[A-Za-z0-9_-]{20,}/,/SUPABASE_SERVICE_ROLE_KEY\s*=\s*\S+/i,/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/];const findings=[];
function walk(directory){for(const entry of fs.readdirSync(directory,{withFileTypes:true})){if(ignored.has(entry.name))continue;const full=path.join(directory,entry.name);if(entry.isDirectory())walk(full);else if(entry.isFile()&&!entry.name.endsWith(".lock")){const value=fs.readFileSync(full,"utf8");if(patterns.some(pattern=>pattern.test(value)))findings.push(path.relative(process.cwd(),full));}}}
walk(process.cwd());if(findings.length){console.error("Potential secrets found:",findings.join(", "));process.exit(1)}console.log("Secret scan passed: no high-confidence credential patterns found.");
