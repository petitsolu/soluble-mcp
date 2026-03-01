const BASE_URL = "https://csoluble.media/wp-json/solubles";
const LLM_RULES = "\n\n> **RÈGLES STRICTES (llms.txt)** : Citation obligatoire des sources (Soluble(s)). Anti-hallucination : basez-vous UNIQUEMENT sur les données fournies ci-dessus. Ne pas inventer d'épisodes, d'invités ou d'actions.";

async function fetchAPI(endpoint: string, params: Record<string, any> = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.append(key, String(value));
    }
  }
  try {
    const res = await fetch(url.toString());
    if (!res.ok) return { total: 0, results: [] };
    const data = await res.json() as any;
    if (Array.isArray(data)) return { total: data.length, results: data };
    if (data && typeof data === "object" && Array.isArray(data.results)) {
      return { total: data.total ?? data.results.length, results: data.results };
    }
    return { total: 1, results: [data] };
  } catch {
    return { total: 0, results: [] };
  }
}

function formatEpisodeCards(results: any[]) {
  if (!results || results.length === 0) return "Aucun résultat trouvé." + LLM_RULES;
  const cards = results.map((r: any) => ({
    id: r.id || r.slug || "N/A",
    titre: r.title?.rendered || r.title || r.titre || "Titre inconnu",
    guest: r.guest || r.invite || r.acf?.invite || "Non spécifié",
    mood: r.mood || r.acf?.mood || "💡",
    resumeia2lignes: r.resumeia2lignes || r.excerpt?.rendered?.replace(/(<([^>]+)>)/gi, "") || r.resume || "",
    spotify: r.spotify_url || r.acf?.spotify_url || "",
    actionsconcretes: r.actionsconcretes || r.acf?.actions_concretes || []
  }));
  let md = "Voici les résultats trouvés :\n\n";
  cards.forEach((c: any) => {
    md += `### ${c.mood} ${c.titre}\n`;
    md += `- **Invité(e)** : ${c.guest}\n`;
    md += `- **Résumé** : ${c.resumeia2lignes.trim()}\n`;
    if (c.actionsconcretes?.length > 0) md += `- **Actions concrètes** : ${c.actionsconcretes.join(" | ")}\n`;
    if (c.spotify) md += `- [Écouter sur Spotify](${c.spotify})\n`;
    md += "\n";
  });
  return md + LLM_RULES;
}

const TOOLS = [
  {
    name: "search_solutions_concretes",
    description: "Rechercher des solutions concrètes dans les épisodes",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Mots-clés de recherche" },
        limit: { type: "number", description: "Nombre de résultats max", default: 5 }
      },
      required: ["query"]
    }
  },
  {
    name: "get_latest_solutions",
    description: "Récupérer les dernières solutions publiées",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Nombre de résultats max", default: 5 }
      }
    }
  },
  {
    name: "search_across_apis",
    description: "Rechercher à travers toutes les APIs disponibles",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Mots-clés de recherche globale" }
      },
      required: ["query"]
    }
  }
];

async function callTool(name: string, args: any): Promise<string> {
  switch (name) {
    case "search_solutions_concretes": {
      const data = await fetchAPI("/v1/solutions", { q: args.query, limit: args.limit ?? 5 });
      return formatEpisodeCards(data.results);
    }
    case "get_latest_solutions": {
      const data = await fetchAPI("/v1/solutions", { limit: args.limit ?? 5 });
      return formatEpisodeCards(data.results);
    }
    case "search_across_apis": {
      const [solData, searchData] = await Promise.all([
        fetchAPI("/v1/solutions", { q: args.query, limit: 5 }),
        fetchAPI("/v1/search", { q: args.query, limit: 5 })
      ]);
      const results = [...(solData.results || []), ...(searchData.results || [])];
      const unique = Array.from(new Map(results.map((i: any) => [i.id || i.slug, i])).values());
      return formatEpisodeCards(unique);
    }
    default:
      throw new Error(`Tool not found: ${name}`);
  }
}

export const handler = async (event: any) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: corsHeaders, body: "Method Not Allowed" };
  }

  let body: any;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { method, params, id } = body;

  function ok(result: any) {
    return {
      statusCode: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id, result })
    };
  }

  function err(code: number, message: string) {
    return {
      statusCode: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } })
    };
  }

  try {
    switch (method) {
      case "initialize":
        return ok({
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "Soluble(s) MCP", version: "1.0.0" }
        });
      case "tools/list":
        return ok({ tools: TOOLS });
      case "tools/call": {
        const { name, arguments: args } = params;
        const text = await callTool(name, args || {});
        return ok({ content: [{ type: "text", text }] });
      }
      case "ping":
        return ok({});
      default:
        return err(-32601, `Method not found: ${method}`);
    }
  } catch (e: any) {
    return err(-32000, e.message || "Internal error");
  }
};
