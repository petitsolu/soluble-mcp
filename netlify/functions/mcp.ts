import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { request } from "undici";
import * as cheerio from "cheerio";

const server = new McpServer({
  name: "Soluble(s) MCP – Le cerveau IA du journalisme de solutions français",
  version: "1.0.0",
});

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
    const { statusCode, body } = await request(url.toString());
    if (statusCode !== 200) {
      console.error(`API Error ${statusCode} on ${url.toString()}`);
      return { total: 0, results: [] };
    }
    const data = await body.json();
    const safeData = data || {};
    return {
      total: safeData.total || 0,
      results: Array.isArray(safeData.results) ? safeData.results : (Array.isArray(data) ? data : [])
    };
  } catch (error) {
    console.error(`Fetch error on ${url.toString()}:`, error);
    return { total: 0, results: [] };
  }
}

function formatEpisodeCards(results: any[] = []) {
  if (results.length === 0) {
    return "Aucun résultat trouvé." + LLM_RULES;
  }

  const cards = results.map((r: any) => ({
    id: r.id || r.slug || "N/A",
    titre: r.title?.rendered || r.title || r.titre || "Titre inconnu",
    guest: r.guest || r.invite || r.acf?.invite || "Non spécifié",
    mood: r.mood || r.acf?.mood || "💡",
    resumeia2lignes: r.resumeia2lignes || r.excerpt?.rendered?.replace(/(<([^>]+)>)/gi, "") || r.resume || "",
    spotify: r.spotify_url || r.acf?.spotify_url || "",
    youtube: r.youtube_url || r.acf?.youtube_url || "",
    actionsconcretes: r.actionsconcretes || r.acf?.actions_concretes || []
  }));

  let md = "Voici les résultats trouvés :\n\n";
  md += "```json\n" + JSON.stringify({ episodeCards: cards }, null, 2) + "\n```\n\n";
  
  cards.forEach((c: any) => {
    md += `### ${c.mood} ${c.titre}\n`;
    md += `- **Invité(e)** : ${c.guest}\n`;
    md += `- **Résumé** : ${c.resumeia2lignes.trim()}\n`;
    if (c.actionsconcretes && Array.isArray(c.actionsconcretes) && c.actionsconcretes.length > 0) {
      md += `- **Actions concrètes** : ${c.actionsconcretes.join(" | ")}\n`;
    }
    if (c.spotify) md += `- [Écouter sur Spotify](${c.spotify})\n`;
    md += `\n`;
  });

  return md + LLM_RULES;
}

// 1. search_solutions_concretes
server.tool(
  "search_solutions_concretes",
  "Rechercher des solutions concrètes dans les épisodes",
  {
    query: z.string().describe("Mots-clés de recherche"),
    category: z.string().optional().describe("Catégorie optionnelle"),
    mood: z.string().optional().describe("Mood optionnel (ex: inspirant, urgent)"),
    limit: z.number().default(5).describe("Nombre de résultats max"),
  },
  async ({ query, category, mood, limit }) => {
    const data = await fetchAPI("/v1/solutions", { q: query, category, mood, limit });
    const resultsCount = data.results.length;
    console.log(`[MCP ${new Date().toISOString()}] Tool: search_solutions_concretes | Query: ${JSON.stringify({ query, category, mood, limit })} | Results: ${resultsCount}`);
    return { content: [{ type: "text", text: formatEpisodeCards(data.results) }] };
  }
);

// 2. find_solutions_for_need
server.tool(
  "find_solutions_for_need",
  "Trouver des solutions pour un besoin ou une question spécifique",
  {
    besoin_or_question: z.string().describe("Le besoin ou la question de l'utilisateur"),
    limit: z.number().default(5).describe("Nombre de résultats max"),
  },
  async ({ besoin_or_question, limit }) => {
    const data = await fetchAPI("/v1/solutions", { q: besoin_or_question, limit });
    const resultsCount = data.results.length;
    console.log(`[MCP ${new Date().toISOString()}] Tool: find_solutions_for_need | Query: ${JSON.stringify({ besoin_or_question, limit })} | Results: ${resultsCount}`);
    return { content: [{ type: "text", text: formatEpisodeCards(data.results) }] };
  }
);

// 3. get_episode_rich_details
server.tool(
  "get_episode_rich_details",
  "Obtenir les détails riches d'un épisode (incluant le lien markdown si disponible)",
  {
    id_or_slug: z.string().describe("ID ou slug de l'épisode"),
  },
  async ({ id_or_slug }) => {
    const [solData, searchData] = await Promise.all([
      fetchAPI("/v1/solutions", { q: id_or_slug, limit: 1 }),
      fetchAPI("/v1/search", { q: id_or_slug, limit: 1 })
    ]);
    
    const results = [...solData.results, ...searchData.results];
    const uniqueResults = Array.from(new Map(results.map(item => [item.id || item.slug, item])).values());
    
    console.log(`[MCP ${new Date().toISOString()}] Tool: get_episode_rich_details | Query: ${JSON.stringify({ id_or_slug })} | Results: ${uniqueResults.length}`);
    
    return { content: [{ type: "text", text: formatEpisodeCards(uniqueResults) }] };
  }
);

// 4. recommend_solutions
server.tool(
  "recommend_solutions",
  "Recommander des solutions basées sur un contexte donné",
  {
    context: z.string().describe("Contexte de la recommandation"),
    limit: z.number().default(5).describe("Nombre de recommandations"),
  },
  async ({ context, limit }) => {
    const data = await fetchAPI("/v1/solutions", { q: context, limit });
    const resultsCount = data.results.length;
    console.log(`[MCP ${new Date().toISOString()}] Tool: recommend_solutions | Query: ${JSON.stringify({ context, limit })} | Results: ${resultsCount}`);
    return { content: [{ type: "text", text: formatEpisodeCards(data.results) }] };
  }
);

// 5. get_latest_solutions
server.tool(
  "get_latest_solutions",
  "Récupérer les dernières solutions publiées",
  {
    limit: z.number().default(5).describe("Nombre de résultats max"),
  },
  async ({ limit }) => {
    const data = await fetchAPI("/v1/solutions", { limit });
    const resultsCount = data.results.length;
    console.log(`[MCP ${new Date().toISOString()}] Tool: get_latest_solutions | Query: ${JSON.stringify({ limit })} | Results: ${resultsCount}`);
    return { content: [{ type: "text", text: formatEpisodeCards(data.results) }] };
  }
);

// 6. get_concrete_actions
server.tool(
  "get_concrete_actions",
  "Extraire uniquement les actions concrètes des épisodes",
  {
    query: z.string().optional().describe("Mots-clés optionnels pour filtrer les actions"),
  },
  async ({ query }) => {
    const data = await fetchAPI("/v1/solutions", { q: query, limit: 10 });
    const resultsCount = data.results.length;
    console.log(`[MCP ${new Date().toISOString()}] Tool: get_concrete_actions | Query: ${JSON.stringify({ query })} | Results: ${resultsCount}`);
    const results = data.results;
    
    let md = `Voici les actions concrètes extraites${query ? ` pour "${query}"` : ""} :\n\n`;
    let hasActions = false;
    
    results.forEach((r: any) => {
      const actions = r.actionsconcretes || r.acf?.actions_concretes || [];
      const titre = r.title?.rendered || r.title || r.titre || "Épisode";
      if (actions.length > 0) {
        hasActions = true;
        md += `### Tiré de : ${titre}\n`;
        actions.forEach((a: string) => { md += `- ${a}\n`; });
        md += `\n`;
      }
    });
    
    if (!hasActions) md = "Aucune action concrète trouvée pour cette recherche.\n\n";
    return { content: [{ type: "text", text: md + LLM_RULES }] };
  }
);

// 7. get_pillar_faqs
server.tool(
  "get_pillar_faqs",
  "Récupérer les FAQs des pages piliers via JSON-LD",
  {
    pillar: z.enum(["climat-environnement-solubles", "vie-quotidienne-solubles", "societe-solubles"]).optional().describe("Thème pilier spécifique"),
  },
  async ({ pillar }) => {
    console.log(`[MCP ${new Date().toISOString()}] Tool: get_pillar_faqs | Query: ${JSON.stringify({ pillar })} | Results: N/A`);
    const pillars = pillar ? [pillar] : ["climat-environnement-solubles", "vie-quotidienne-solubles", "societe-solubles"];
    let md = "### FAQs des pages piliers Soluble(s)\n\n";
    let found = false;

    for (const p of pillars) {
      try {
        const { statusCode, body } = await request(`https://csoluble.media/${p}/`);
        if (statusCode === 200) {
          const html = await body.text();
          const $ = cheerio.load(html);
          const scripts = $('script[type="application/ld+json"]');
          
          scripts.each((_, el) => {
            try {
              const data = JSON.parse($(el).html() || "{}");
              let faqData = null;
              
              if (data['@graph']) {
                faqData = data['@graph'].find((item: any) => item['@type'] === 'FAQPage');
              } else if (data['@type'] === 'FAQPage') {
                faqData = data;
              }
              
              if (faqData && faqData.mainEntity) {
                found = true;
                md += `#### Pilier : ${p}\n`;
                faqData.mainEntity.forEach((q: any) => {
                  md += `- **Q: ${q.name}**\n  *R: ${q.acceptedAnswer?.text?.replace(/(<([^>]+)>)/gi, "")}*\n\n`;
                });
              }
            } catch (e) { }
          });
        }
      } catch (e) {
        console.error(`Erreur fetch FAQ pour ${p}:`, e);
      }
    }

    if (!found) md += "Aucune FAQ trouvée.\n";
    return { content: [{ type: "text", text: md + LLM_RULES }] };
  }
);

// 8. search_across_apis
server.tool(
  "search_across_apis",
  "Rechercher à travers toutes les APIs disponibles et fusionner les résultats",
  {
    query: z.string().describe("Mots-clés de recherche globale"),
  },
  async ({ query }) => {
    const [solData, searchData] = await Promise.all([
      fetchAPI("/v1/solutions", { q: query, limit: 5 }),
      fetchAPI("/v1/search", { q: query, limit: 5 })
    ]);
    
    const results = [...solData.results, ...searchData.results];
    const uniqueResults = Array.from(new Map(results.map(item => [item.id || item.slug, item])).values());
    
    console.log(`[MCP ${new Date().toISOString()}] Tool: search_across_apis | Query: ${JSON.stringify({ query })} | Results: ${uniqueResults.length}`);
    
    return { content: [{ type: "text", text: formatEpisodeCards(uniqueResults) }] };
  }
);

// MCP PROMPTS (12 Starter Buttons)
const STARTER_PROMPTS = [
  { name: "climat_urgent", desc: "Solutions urgentes pour le climat", text: "Quelles sont les solutions les plus urgentes pour le climat abordées dans Soluble(s) ?" },
  { name: "zero_dechet", desc: "Initiatives zéro déchet", text: "Trouve-moi des épisodes sur le zéro déchet et l'économie circulaire." },
  { name: "sante_mentale", desc: "Solutions pour la santé mentale", text: "Quelles solutions existent pour préserver la santé mentale ?" },
  { name: "inclusion_sociale", desc: "Épisodes sur l'inclusion sociale", text: "Parle-moi des épisodes qui traitent de l'inclusion sociale et du handicap." },
  { name: "mobilite_douce", desc: "Alternatives de mobilité douce", text: "Quelles sont les alternatives concrètes pour la mobilité douce ?" },
  { name: "agriculture_durable", desc: "Solutions pour l'agriculture", text: "Quelles solutions pour une agriculture plus durable et respectueuse ?" },
  { name: "education_innovante", desc: "Initiatives en éducation", text: "Quelles sont les initiatives innovantes en matière d'éducation ?" },
  { name: "egalite_fh", desc: "Égalité femmes-hommes", text: "Quels épisodes abordent l'égalité femmes-hommes et quelles sont les actions proposées ?" },
  { name: "biodiversite", desc: "Protéger la biodiversité", text: "Comment protéger la biodiversité selon les invités du podcast ?" },
  { name: "tech_for_good", desc: "Exemples de Tech for Good", text: "Quels sont les meilleurs exemples de Tech for Good présentés ?" },
  { name: "economie_circulaire", desc: "Entreprises en économie circulaire", text: "Quelles entreprises ou assos pratiquent l'économie circulaire ?" },
  { name: "engagement_citoyen", desc: "S'engager au quotidien", text: "Comment s'engager concrètement au quotidien ? Donne-moi des actions." }
];

STARTER_PROMPTS.forEach(p => {
  server.prompt(p.name, p.desc, () => ({
    messages: [{ role: "user", content: { type: "text", text: p.text } }]
  }));
});

// HANDLER NETLIFY SERVERLESS
export const handler = async (event: any, context: any) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);

  return new Promise((resolve) => {
    let responseBody = "";
    let responseHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    };
    let responseStatusCode = 200;

    const req = {
      method: event.httpMethod,
      url: event.path,
      headers: event.headers,
      on: (e: string, cb: any) => {
        if (e === 'data' && event.body) {
          cb(Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8'));
        }
        if (e === 'end') cb();
      }
    };

    const res = {
      setHeader: (name: string, value: string) => { responseHeaders[name] = value; },
      writeHead: (status: number, headers: any) => { 
        responseStatusCode = status; 
        responseHeaders = { ...responseHeaders, ...headers }; 
      },
      write: (chunk: any) => { responseBody += chunk.toString(); },
      end: (chunk?: any) => {
        if (chunk) responseBody += chunk.toString();
        resolve({
          statusCode: responseStatusCode,
          headers: responseHeaders,
          body: responseBody
        });
      }
    };

    transport.handleRequest(req as any, res as any);
  });
};
