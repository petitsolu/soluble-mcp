import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

const server = new McpServer({
  name: "Soluble(s) Connect",
  version: "1.1.0",
});

server.tool(
  "search_solutions",
  { query: { type: "string" } },
  async ({ query }) => {
    const res = await fetch(`https://csoluble.media/wp-json/solubles/v1/solutions?q=${encodeURIComponent(query)}`);
    const data = await res.json() as any[];
    const text = data.map(ep => `${ep.title?.rendered}`).join("\n");
    return { content: [{ type: "text", text }] };
  }
);

let transport: any;

export const handler = async (event: any) => {
  if (event.httpMethod === "GET") {
    // On crée la connexion SSE pour le transport distant
    transport = new SSEServerTransport("/api/mcp", { writeHead: () => {}, end: () => {} } as any);
    await server.connect(transport);
    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive" 
      },
      body: ""
    };
  }

  if (event.httpMethod === "POST" && transport) {
    // On traite les messages entrants de l'IA
    await transport.handlePostMessage(event, { writeHead: () => {}, end: () => {} } as any);
    return { statusCode: 200, body: "Accepted" };
  }

  return { statusCode: 405, body: "Method Not Allowed" };
};
