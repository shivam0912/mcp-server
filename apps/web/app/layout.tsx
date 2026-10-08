import type { Metadata } from "next";
import Link from "next/link";
import { Braces, Github, MoonStar } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ContextBridge AI", template: "%s · ContextBridge AI" },
  description: "An evidence-grounded knowledge assistant powered by a genuine MCP server."
};

const links = [["/chat", "Workspace"], ["/knowledge", "Knowledge"], ["/evaluations", "Evaluations"], ["/docs", "Docs"]] as const;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>
    <header className="site-header">
      <Link href="/" className="brand" aria-label="ContextBridge AI home"><span className="brand-mark"><Braces size={19}/></span><span>ContextBridge <em>AI</em></span></Link>
      <nav aria-label="Primary navigation">{links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}</nav>
      <div className="header-actions"><Link href="/admin" className="quiet-link">Admin</Link><button className="icon-button" aria-label="Theme follows system preference" title="Theme follows system preference"><MoonStar size={17}/></button><a className="button small" href="https://github.com" target="_blank" rel="noreferrer"><Github size={15}/> Repository</a></div>
    </header>
    {children}
    <footer><div className="brand"><span className="brand-mark"><Braces size={17}/></span><span>ContextBridge AI</span></div><p>Built to demonstrate real MCP interoperability, retrieval, and honest evaluation.</p><span>Apache-2.0 / MIT dependencies</span></footer>
  </body></html>;
}
