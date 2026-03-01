import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { Request, Response } from "@netlify/functions";

// 1. Initialisation du serveur officiel
const server = new McpServer({
  name: "Soluble(s) Connect",
  version: "1.1.0",
});

// 2. Ajout de ton outil principal (adapté de ta logique WordPress)
server.tool(
  "search_solutions_concretes",
  { query: { type: "string", description: "Mots-clés de recherche" } },
  async ({ query }) => {
    const res = await fetch(`https://csoluble.media/wp-json/solubles/v1/solutions?q=${encodeURIComponent(query)}`);
    const data = await res.json() as any[];
    
    const text = data.map(ep => 
      `### ${ep.title?.rendered || ep.title}\n- Invité : ${ep.acf?.invite || "Inconnu"}\n- Actions : ${ep.actionsconcretes || "N/A"}`
    ).join("\n\n");

    return { content: [{ type: "text", text: text || "Aucun résultat." }] };
  }
);

// Variable pour stocker le transport (nécessaire pour la route POST)
let transport: SSEServerTransport;

export const handler = async (req: Request) => {
  // Route GET : Établit la connexion SSE
  if (req.method === "GET") {
    transport = new SSEServerTransport("/api/mcp", {
      // Netlify a besoin d'envoyer la réponse immédiatement
    } as any);
    
    await server.connect(transport);
    
    return new Response(null, {
      status: 202, // On accepte la connexion
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" }
    });
  }

  // Route POST : Reçoit les commandes JSON-RPC
  if (req.method === "POST" && transport) {
    await transport.handlePostMessage(req as any, {} as any);
    return new Response("OK", { status: 200 });
  }

  return new Response("Method Not Allowed", { status: 405 });
};
