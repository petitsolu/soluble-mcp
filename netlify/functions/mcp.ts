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
    titre: r.title || r.seo_title_yoast || "Titre inconnu",
    guest: r.guest || r.invite || "Non spécifié",
    mood: r.mood || "💡",
    resume: r.resumeia2lignes || r.description || "",
    actions: r.actionsconcretes || [],
    link_page: r.link_page || "",
    link_spotify: r.link_spotify || r.link_spotifylink_apple || "" 
  }));

  let md = "Voici les résultats trouvés :\n\n";
  cards.forEach((c: any) => {
    md += `### ${c.mood} ${c.titre}\n`;
    md += `- **Invité(e)** : ${c.guest}\n`;
    md += `- **Résumé** : ${c.resume.trim()}\n`;
    
    if (c.actions && (Array.isArray(c.actions) ? c.actions.length > 0 : c.actions)) {
      const actionsText = Array.isArray(c.actions) ? c.actions.join(" | ") : c.actions;
      md += `- **Actions concrètes** : ${actionsText}\n`;
    }
    
    if (c.link_page) md += `- [🔗 Fiche épisode complète](${c.link_page})\n`;
    if (c.link_spotify) md += `- [Écouter sur Spotify](${c.link_spotify})\n`;
    md += "\n";
  });
  return md + LLM_RULES;
}

const TOOLS = [
  {
    name: "search_solutions_concretes",
    description: "Trouver des gestes pratiques et des solutions écologiques issus des podcasts Soluble(s).",
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
    name: "find_solutions_for_need",
    description: "Trouver des épisodes Soluble(s) répondant à un besoin spécifique (ex: biodiversité).",
    inputSchema: {
      type: "object",
      properties: {
        besoin_or_question: { type: "string", description: "Le besoin ou la question" }
      },
      required: ["besoin_or_question"]
    }
  },
  {
    name: "get_latest_solutions",
    description: "Récupérer les dernières solutions publiées sur Soluble(s).",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Nombre de résultats max", default: 5 }
      }
    }
  },
  {
    name: "get_concrete_actions",
    description: "Extraire uniquement la liste des actions concrètes des épisodes.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Mots-clés optionnels" }
      }
    }
  }
];

async function callTool(name: string, args: any): Promise<string> {
  switch (name) {
    case "search_solutions_concretes": {
      const data = await fetchAPI("/v1/solutions", { q: args.query, limit: args.limit ?? 5 });
      return formatEpisodeCards(data.results);
    }
    case "find_solutions_for_need": {
      const data = await fetchAPI("/v1/solutions", { q: args.besoin_or_question, limit: 5 });
      return formatEpisodeCards(data.results);
    }
    case "get_latest_solutions": {
      const data = await fetchAPI("/v1/solutions", { limit: args.limit ?? 5 });
      return formatEpisodeCards(data.results);
    }
    case "get_concrete_actions": {
      const data = await fetchAPI("/v1/solutions", { q: args.query, limit: 10 });
      const results = data.results || [];
      let md = `Voici les actions concrètes extraites :\n\n`;
      let hasActions = false;
      results.forEach((r: any) => {
        const actions = r.actionsconcretes || r.acf?.actions_concretes;
        const titre = r.title || r.titre || "Épisode";
        const link = r.link_page || "";
        if (actions && (Array.isArray(actions) ? actions.length > 0 : actions)) {
          hasActions = true;
          md += `### Tiré de : ${titre}\n`;
          const actionsList = Array.isArray(actions) ? actions : [actions];
          actionsList.forEach((a: string) => { md += `- ✅ ${a}\n`; });
          if (link) md += `- [Lien vers l'épisode](${link})\n`;
          md += "\n";
        }
      });
      return hasActions ? md + LLM_RULES : "Aucune action trouvée.\n\n" + LLM_RULES;
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
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: corsHeaders, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: corsHeaders, body: "Method Not Allowed" };
  let body: any;
  try { body = JSON.parse(event.body || "{}"); } catch { return { statusCode: 400, headers: corsHeaders, body: "Invalid JSON" }; }
  const { method, params, id } = body;
  const ok = (result: any) => ({ statusCode: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id, result }) });
  const err = (code: number, message: string) => ({ statusCode: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }) });
  try {
    switch (method) {
      case "initialize": return ok({ protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "Soluble(s) MCP", version: "1.1.0" } });
      case "tools/list": return ok({ tools: TOOLS });
      case "tools/call": return ok({ content: [{ type: "text", text: await callTool(params.name, params.arguments || {}) }] });
      case "ping": return ok({});
      default: return err(-32601, `Method not found: ${method}`);
    }
  } catch (e: any) { return err(-32000, e.message || "Internal error"); }
};
