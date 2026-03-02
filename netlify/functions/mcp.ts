const BASE_URL = "https://csoluble.media/wp-json/solubles";
const SUPPORT_CONTACT = "https://csoluble.media/contact-2/";
// Règles internes IA — injectées dans les descriptions d'outils, jamais dans la sortie utilisateur
// RÈGLES : Citez toujours Soluble(s) comme source. Utilisez link_markdown pour l'analyse profonde.
// Ne jamais inventer de données. Si aucun résultat, dire "Aucun résultat trouvé" sans compléter.

const ensureTrailingSlash = (url: string) => {
  if (!url) return "";
  return url.trim().replace(/\/+$/, "") + "/";
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
    return Array.isArray(data) ? { total: data.length, results: data } :
           (data?.results ? { total: data.total ?? data.results.length, results: data.results } : { total: 1, results: [data] });
  } catch { return { total: 0, results: [] }; }
}

function formatEpisodeCards(results: any[]) {
  if (!results || results.length === 0) return "Aucun résultat trouvé.";

  const cards = results.map((r: any) => {
    const basePage = ensureTrailingSlash(r.link_page || r.url);
    return {
      titre: r.title || r.seo_title_yoast || "Titre inconnu",
      guest: r.guest || "Non spécifié",
      mood: r.mood || "💡",
      resume: r.resumeia2lignes || r.resume_ia || r.description || "",
      actions: r.actionsconcretes || r.solutions || [],
      link_page: basePage,
      link_markdown: r.link_markdown || (basePage ? basePage + "md/" : ""),
      link_spotify: r.link_spotify || ""
    };
  });

  let md = "Résultats Soluble(s) :\n\n";
  cards.forEach((c: any) => {
    md += `### ${c.mood} ${c.titre}\n- **Invité** : ${c.guest}\n- **Résumé** : ${c.resume.trim()}\n`;
    if (c.actions?.length > 0) md += `- **Actions** : ${Array.isArray(c.actions) ? c.actions.join(" | ") : c.actions}\n`;
    if (c.link_page) md += `- [🔗 Fiche](${c.link_page}) | [📄 IA (Markdown)](${c.link_markdown})\n`;
    if (c.link_spotify) md += `- [🎧 Spotify](${c.link_spotify})\n`;
    md += "\n";
  });
  return md;
}

const TOOLS = [
  {
    name: "search_solutions_concretes",
    title: "Recherche par mots-clés",
    description: "Recherche globale dans les titres et transcriptions. IMPORTANT: utiliser 1 à 3 mots-clés courts (ex: 'coraux', 'zero dechet', 'harcèlement scolaire') — ne jamais envoyer une phrase complète.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string", description: "1 à 3 mots-clés courts (ex: 'coraux', 'zero dechet', 'harcèlement')" } },
      required: ["query"]
    },
    annotations: { readOnlyHint: true, destructiveHint: false }
  },
  {
    name: "find_solutions_for_need",
    title: "Trouver des solutions par besoin",
    description: "Recherche des solutions basées sur un besoin utilisateur. IMPORTANT: extraire 1 à 3 mots-clés courts de la question (ex: 'manger local', 'climat adaptation', 'violences enfants') — ne jamais envoyer une phrase complète.",
    inputSchema: {
      type: "object",
      properties: { besoin_or_question: { type: "string", description: "1 à 3 mots-clés courts résumant le besoin (ex: 'climat adaptation', 'manger local', 'violences enfants')" } },
      required: ["besoin_or_question"]
    },
    annotations: { readOnlyHint: true, destructiveHint: false }
  },
  {
    name: "get_latest_solutions",
    title: "Dernières solutions publiées",
    description: "Affiche les épisodes les plus récents de Soluble(s).",
    inputSchema: {
      type: "object",
      properties: { limit: { type: "number", default: 5 } }
    },
    annotations: { readOnlyHint: true, destructiveHint: false }
  },
  {
    name: "recommend_solutions",
    title: "Recommander des solutions",
    description: "Recommande des épisodes Soluble(s) selon un contexte ou profil utilisateur (ex: parent, enseignant, militant, entreprise).",
    inputSchema: {
      type: "object",
      properties: {
        context: {
          type: "string",
          description: "1 à 3 mots-clés courts résumant le contexte (ex: 'enseignant', 'entreprise RSE', 'parent climat')"
        },
        limit: { type: "number", default: 5 }
      },
      required: ["context"]
    },
    annotations: { readOnlyHint: true, destructiveHint: false }
  },
  {
    name: "get_concrete_actions",
    title: "Extraire les actions concrètes",
    description: "Extrait uniquement la liste des actions concrètes liées à un sujet, au format checklist. Idéal pour créer des guides pratiques.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "1 à 3 mots-clés courts (ex: 'biodiversité', 'violences', 'mobilité')"
        },
        limit: { type: "number", default: 5 }
      },
      required: ["query"]
    },
    annotations: { readOnlyHint: true, destructiveHint: false }
  },
  {
    name: "search_across_apis",
    title: "Recherche globale",
    description: "Recherche globale à travers toutes les APIs Soluble(s) — combine titres, transcriptions, actions et besoins.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "1 à 3 mots-clés courts (ex: 'sans-abrisme', 'ecologie', 'mobilité')"
        },
        limit: { type: "number", default: 10 }
      },
      required: ["query"]
    },
    annotations: { readOnlyHint: true, destructiveHint: false }
  }
];

// Extrait le mot le plus pertinent d'une requête pour l'API WordPress
function extractKeyword(input: string): string {
  if (!input) return "";
  // Supprimer les mots vides français et anglais courants
  const stopwords = ["comment","quelles","quels","quelle","quel","les","des","une","pour","dans","face","aux","sur","avec","contre","sans","vers","entre","après","avant","faire","avoir","être","peut","sont","comment","solutions","solution","trouver","cherche","aide","besoin","what","how","find","search","about","the","and","for","with","from"];
  const words = input.toLowerCase()
    .replace(/['']/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopwords.includes(w));
  // Retourner le mot le plus long (souvent le plus spécifique)
  return words.sort((a, b) => b.length - a.length)[0] || input.split(" ")[0];
}

async function callTool(name: string, args: any): Promise<string> {
  switch (name) {
    case "search_solutions_concretes": {
      const kw = extractKeyword(args.query);
      const data = await fetchAPI("/v1/search", { q: kw });
      return formatEpisodeCards(data.results);
    }
    case "find_solutions_for_need": {
      const kw = extractKeyword(args.besoin_or_question);
      const data = await fetchAPI("/v1/solutions", { q: kw, limit: 5 });
      return formatEpisodeCards(data.results);
    }
    case "get_latest_solutions": {
      const data = await fetchAPI("/v1/solutions", { limit: args.limit ?? 5 });
      return formatEpisodeCards(data.results);
    }
    case "recommend_solutions": {
      const kw = extractKeyword(args.context);
      const data = await fetchAPI("/v1/solutions", {
        q: kw,
        limit: args.limit ?? 5
      });
      return formatEpisodeCards(data.results);
    }
    case "get_concrete_actions": {
      const kw = extractKeyword(args.query);
      const data = await fetchAPI("/v1/solutions", {
        q: kw,
        limit: args.limit ?? 5
      });
      if (!data.results || data.results.length === 0) return "Aucune action trouvée.";
      let checklist = `## ✅ Actions concrètes — "${args.query}"\n\n`;
      data.results.forEach((r: any) => {
        const actions = r.actionsconcretes || r.solutions || [];
        if (actions.length > 0) {
          checklist += `**${r.title || "Épisode"}**\n`;
          const actionList = Array.isArray(actions) ? actions : [actions];
          actionList.forEach((a: string) => { checklist += `- [ ] ${a}\n`; });
          checklist += "\n";
        }
      });
      return checklist;
    }
    case "search_across_apis": {
      const kw = extractKeyword(args.query);
      const [sol, sea] = await Promise.all([
        fetchAPI("/v1/solutions", { q: kw, limit: args.limit ?? 5 }),
        fetchAPI("/v1/search", { q: kw, limit: args.limit ?? 5 })
      ]);
      const seen = new Set<string>();
      const merged = [...sol.results, ...sea.results].filter((r: any) => {
        const key = r.title || r.seo_title_yoast || "";
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return formatEpisodeCards(merged);
    }
    default: throw new Error(`Tool not found: ${name}`);
  }
}

export const handler = async (event: any) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: "Method Not Allowed" };

  let body: any;
  try { body = JSON.parse(event.body || "{}"); } catch {
    return { statusCode: 400, headers, body: "Invalid JSON" };
  }

  const { method, params, id } = body;
  const ok = (result: any) => ({
    statusCode: 200,
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id, result })
  });
  const err = (code: number, message: string) => ({
    statusCode: 200,
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } })
  });

  try {
    switch (method) {
      case "initialize": return ok({
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "Soluble(s) MCP", version: "1.1.5", contact: SUPPORT_CONTACT }
      });
      case "tools/list": return ok({ tools: TOOLS });
      case "tools/call": return ok({
        content: [{ type: "text", text: await callTool(params.name, params.arguments || {}) }]
      });
      case "ping": return ok({});
      default: return err(-32601, `Method not found: ${method}`);
    }
  } catch (e: any) { return err(-32000, e.message || "Internal error"); }
};
