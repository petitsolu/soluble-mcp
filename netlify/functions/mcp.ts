const BASE_URL = "https://csoluble.media/wp-json/solubles";
const LLM_RULES = "\n\n> **RÈGLES DE RÉPONSE** : Citez Soluble(s). Pour approfondir, proposez TOUJOURS les versions Markdown (IA) en utilisant les liens dédiés. Ne jamais inventer de données.";

// Fonction pour garantir une URL propre finissant par /
const ensureTrailingSlash = (url: string) => {
  if (!url) return "";
  return url.replace(/\/$/, "") + "/";
};

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
  
  const cards = results.map((r: any) => {
    const basePage = ensureTrailingSlash(r.link_page);
    return {
      titre: r.title || r.seo_title_yoast || "Titre inconnu",
      guest: r.guest || r.invite || "Non spécifié",
      mood: r.mood || "💡",
      resume: r.resumeia2lignes || r.description || "",
      actions: r.actionsconcretes || [],
      // Utilisation de tes colonnes CSV avec gestion des slashs
      link_page: basePage,
      link_markdown: basePage ? basePage + "md/" : "",
      link_transcription: r.link_transcription ? ensureTrailingSlash(r.link_transcription) + "md/" : "",
      link_summary: r.link_summary ? ensureTrailingSlash(r.link_summary) + "md/" : "",
      link_spotify: r.link_spotify || ""
    };
  });

  let md = "Voici les résultats trouvés :\n\n";
  cards.forEach((c: any) => {
    md += `### ${c.mood} ${c.titre}\n`;
    md += `- **Invité(e)** : ${c.guest}\n`;
    md += `- **Résumé** : ${c.resume.trim()}\n`;
    
    if (c.actions && (Array.isArray(c.actions) ? c.actions.length > 0 : c.actions)) {
      const actionsText = Array.isArray(c.actions) ? c.actions.join(" | ") : c.actions;
      md += `- **Actions concrètes** : ${actionsText}\n`;
    }
    
    if (c.link_page) md += `- [🔗 Fiche épisode](${c.link_page})\n`;
    if (c.link_markdown) md += `- [📄 Version Markdown (Analyse IA)](${c.link_markdown})\n`;
    
    // Ajout des liens spécifiques si présents dans tes colonnes
    if (c.link_transcription) md += `- [📝 Transcription complète (IA)](${c.link_transcription})\n`;
    if (c.link_summary) md += `- [📋 Synthèse détaillée (IA)](${c.link_summary})\n`;
    if (c.link_spotify) md += `- [Écouter sur Spotify](${c.link_spotify})\n`;
    md += "\n";
  });
  return md + LLM_RULES;
}

const TOOLS = [
  {
    name: "find_solutions_for_need",
    description: "Trouver des solutions par besoin. Note : utilisez les liens /md/ pour une analyse textuelle profonde.",
    inputSchema: {
      type: "object",
      properties: {
        besoin_or_question: { type: "string", description: "Le besoin" }
      },
      required: ["besoin_or_question"]
    }
  },
  {
    name: "get_latest_solutions",
    description: "Récupérer les dernières solutions publiées.",
    inputSchema: {
      type: "object",
      properties: { limit: { type: "number", default: 5 } }
    }
  },
  {
    name: "get_concrete_actions",
    description: "Extraire la liste des actions concrètes uniquement.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" } }
    }
  }
];

async function callTool(name: string, args: any): Promise<string> {
  switch (name) {
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
        const actions = r.actionsconcretes;
        const titre = r.title || "Épisode";
        const linkMd = r.link_page ? ensureTrailingSlash(r.link_page) + "md/" : "";
        if (actions && (Array.isArray(actions) ? actions.length > 0 : actions)) {
          hasActions = true;
          md += `### ${titre}\n`;
          const list = Array.isArray(actions) ? actions : [actions];
          list.forEach((a: string) => { md += `- ✅ ${a}\n`; });
          if (linkMd) md += `- [Lire la source Markdown](${linkMd})\n`;
          md += "\n";
        }
      });
      return hasActions ? md + LLM_RULES : "Aucune action trouvée." + LLM_RULES;
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
      case "initialize": return ok({ protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "Soluble(s) MCP", version: "1.1.2" } });
      case "tools/list": return ok({ tools: TOOLS });
      case "tools/call": return ok({ content: [{ type: "text", text: await callTool(params.name, params.arguments || {}) }] });
      case "ping": return ok({});
      default: return err(-32601, `Method not found: ${method}`);
    }
  } catch (e: any) { return err(-32000, e.message || "Internal error"); }
};
