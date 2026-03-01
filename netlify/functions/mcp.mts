import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

// 1. On garde ton serveur propre
const server = new McpServer({
  name: "Soluble(s) Connect",
  version: "1.2.0",
});

// 2. On garde ton outil de recherche WordPress
server.tool(
  "search_solutions",
  { query: { type: "string" } },
  async ({ query }) => {
    const res = await fetch(`https://csoluble.media/wp-json/solubles/v1/solutions?q=${encodeURIComponent(query)}`);
    const data = await res.json() as any[];
    const text = data.map(ep => `### ${ep.title?.rendered}\n- Actions : ${ep.actionsconcretes}`).join("\n\n");
    return { content: [{ type: "text", text: text || "Aucun résultat trouvé." }] };
  }
);

export const handler = async (event: any) => {
  // CONFIGURATION CRUCIALE POUR NETLIFY
  // On crée un faux objet "response" pour empêcher le SDK de crasher
  const mockRes = {
    writeHead: () => {},
    write: () => {},
    end: () => {},
    on: () => {},
  };

  if (event.httpMethod === "GET") {
    const transport = new SSEServerTransport("/api/mcp", mockRes as any);
    await server.connect(transport);
    
    // On répond directement à Netlify au lieu de laisser le SDK le faire
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
      body: `event: endpoint\ndata: /api/mcp\n\n` 
    };
  }

  if (event.httpMethod === "POST") {
    const transport = new SSEServerTransport("/api/mcp", mockRes as any);
    await server.connect(transport);
    
    // On transmet le message de l'IA au SDK
    try {
      const body = JSON.parse(event.body);
      await transport.handlePostMessage(event as any, mockRes as any);
      return { statusCode: 200, body: "Accepted" };
    } catch (e) {
      return { statusCode: 400, body: "Invalid JSON" };
    }
  }

  return { statusCode: 405, body: "Method Not Allowed" };
};
