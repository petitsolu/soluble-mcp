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
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.append(key, String(value));
    }
  });

  try {
    const { statusCode, body } = await request(url.toString());
    if (statusCode !== 200) {
      console.error(`API Error ${statusCode} on ${url}`);
      return { total: 0, results: [] };
    }
    const raw = await body.json();

    // Sécurité TypeScript : on normalise TOUJOURS
    const data = raw && typeof raw === 'object' ? raw : {};
    const results = Array.isArray(data.results) ? data.results : (Array.isArray(raw) ? raw : []);

    return {
      total: typeof data.total === 'number' ? data.total : results.length,
      results
    };
  } catch (error) {
    console.error(`Fetch error on ${url}:`, error);
    return { total: 0, results: [] };
  }
}

function formatEpisodeCards(results: any[] = []) {
  if (results.length === 0) {
    return "Aucun résultat trouvé." + LLM_RULES;
  }

  const cards = results.map(r => ({
    id: r.id || r.slug || "N/A",
    titre: r.title?.rendered || r.title || r.titre || "Titre inconnu",
    guest: r.guest || r.invite || r.acf?.invite || "Non spécifié",
    mood: r.mood || r.acf?.mood || "💡",
    resumeia2lignes: r.resumeia2lignes || r.excerpt?.rendered?.replace(/(<[^>]+>)/gi, "") || r.resume || "",
    spotify: r.spotify_url || r.acf?.spotify_url || "",
    youtube: r.youtube_url || r.acf?.youtube_url || "",
    actionsconcretes: r.actionsconcretes || r.acf?.actions_concretes || []
  }));

  let md = "Voici les résultats trouvés :\n\n";
  md += "```json\n" + JSON.stringify({ episodeCards: cards }, null, 2) + "\n```\n\n";

  cards.forEach(c => {
    md += `### ${c.mood} ${c.titre}\n`;
    md += `- **Invité(e)** : ${c.guest}\n`;
    md += `- **Résumé** : ${c.resumeia2lignes.trim()}\n`;
    if (c.actionsconcretes.length > 0) {
      md += `- **Actions concrètes** : ${c.actionsconcretes.join(" | ")}\n`;
    }
    if (c.spotify) md += `- [Écouter sur Spotify](${c.spotify})\n`;
    md += `\n`;
  });

  return md + LLM_RULES;
}

// TOOLS
server.tool(
  "search_solutions_concretes",
  "Rechercher des solutions concrètes dans les épisodes",
  {
    query: z.string(),
    category: z.string().optional(),
    mood: z.string().optional(),
    limit: z.number().default(5)
  },
  async ({ query, category, mood, limit }) => {
    const data = await fetchAPI("/v1/solutions", { q: query, category, mood, limit });
    console.log(`[MCP ${new Date().toISOString()}] Tool: search_solutions_concretes | Query: ${JSON.stringify({ query, category, mood, limit })} | Results: ${data.results.length}`);
    return { content: [{ type: "text", text: formatEpisodeCards(data.results) }] };
  }
);

server.tool(
  "find_solutions_for_need",
  "Trouver des solutions pour un besoin ou une question spécifique",
  {
    besoin_or_question: z.string(),
    limit: z.number().default(5)
  },
  async ({ besoin_or_question, limit }) => {
    const data = await fetchAPI("/v1/solutions", { q: besoin_or_question, limit });
    console.log(`[MCP ${new Date().toISOString()}] Tool: find_solutions_for_need | Query: ${JSON.stringify({ besoin_or_question, limit })} | Results: ${data.results.length}`);
    return { content: [{ type: "text", text: formatEpisodeCards(data.results) }] };
  }
);

server.tool(
  "get_episode_rich_details",
  "Obtenir les détails riches d'un épisode",
  {
    id_or_slug: z.string()
  },
  async ({ id_or_slug }) => {
    const [solData, searchData] = await Promise.all([
      fetchAPI("/v1/solutions", { q: id_or_slug, limit: 1 }),
      fetchAPI("/v1/search", { q: id_or_slug, limit: 1 })
    ]);
    const results = [...solData.results, ...searchData.results];
    const unique = Array.from(new Map(results.map(item => [item.id || item.slug, item])).values());
    console.log(`[MCP ${new Date().toISOString()}] Tool: get_episode_rich_details | Query: ${id_or_slug} | Results: ${unique.length}`);
    return { content: [{ type: "text", text: formatEpisodeCards(unique) }] };
  }
);

server.tool(
  "recommend_solutions",
  "Recommander des solutions basées sur un contexte",
  {
    context: z.string(),
    limit: z.number().default(5)
  },
  async ({ context, limit }) => {
    const data = await fetchAPI("/v1/solutions", { q: context, limit });
    console.log(`[MCP ${new Date().toISOString()}] Tool: recommend_solutions | Query: ${context} | Results: ${data.results.length}`);
    return { content: [{ type: "text", text: formatEpisodeCards(data.results) }] };
  }
);

server.tool(
  "get_latest_solutions",
  "Récupérer les dernières solutions publiées",
  {
    limit: z.number().default(5)
  },
  async ({ limit }) => {
    const data = await fetchAPI("/v1/solutions", { limit });
    console.log(`[MCP ${new Date().toISOString()}] Tool: get_latest_solutions | Limit: ${limit} | Results: ${data.results.length}`);
    return { content: [{ type: "text", text: formatEpisodeCards(data.results) }] };
  }
);

server.tool(
  "get_concrete_actions",
  "Extraire les actions concrètes",
  {
    query: z.string().optional()
  },
  async ({ query }) => {
    const data = await fetchAPI("/v1/solutions", { q: query, limit: 10 });
    console.log(`[MCP ${new Date().toISOString()}] Tool: get_concrete_actions | Query: ${query || 'all'} | Results: ${data.results.length}`);
    let md = `Actions concrètes${query ? ` pour "${query}"` : ""} :\n\n`;
    let has = false;
    data.results.forEach(r => {
      const actions = r.actionsconcretes || r.acf?.actions_concretes || [];
      const titre = r.title?.rendered || r.title || "Épisode";
      if (actions.length > 0) {
        has = true;
        md += `### ${titre}\n`;
        actions.forEach(a => md += `- ${a}\n`);
        md += "\n";
      }
    });
    if (!has) md += "Aucune action trouvée.\n";
    return { content: [{ type: "text", text: md + LLM_RULES }] };
  }
);

server.tool(
  "get_pillar_faqs",
  "Récupérer les FAQs des pages piliers",
  {
    pillar: z.enum(["climat-environnement-solubles", "vie-quotidienne-solubles", "societe-solubles"]).optional()
  },
  async ({ pillar }) => {
    console.log(`[MCP ${new Date().toISOString()}] Tool: get_pillar_faqs | Pillar: ${pillar || 'all'}`);
    const pillars = pillar ? [pillar] : ["climat-environnement-solubles", "vie-quotidienne-solubles", "societe-solubles"];
    let md = "### FAQs des pages piliers\n\n";
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
              const json = JSON.parse($(el).html() || "{}");
              const faq = json['@graph'] ? json['@graph'].find(i => i['@type'] === 'FAQPage') : (json['@type'] === 'FAQPage' ? json : null);
              if (faq && faq.mainEntity) {
                found = true;
                md += `#### ${p}\n`;
                faq.mainEntity.forEach(q => {
                  md += `- **Q: ${q.name}**\n  *R: ${q.acceptedAnswer?.text?.replace(/(<[^>]+>)/gi, "") || ""}*\n\n`;
                });
              }
            } catch {}
          });
        }
      } catch (e) {
        console.error(`FAQ error ${p}:`, e);
      }
    }

    if (!found) md += "Aucune FAQ trouvée.\n";
    return { content: [{ type: "text", text: md + LLM_RULES }] };
  }
);

server.tool(
  "search_across_apis",
  "Recherche globale sur les deux APIs",
  {
    query: z.string()
  },
  async ({ query }) => {
    const [sol, search] = await Promise.all([
      fetchAPI("/v1/solutions", { q: query, limit: 5 }),
      fetchAPI("/v1/search", { q: query, limit: 5 })
    ]);
    const results = [...sol.results, ...search.results];
    const unique = Array.from(new Map(results.map(i => [i.id || i.slug, i])).values());
    console.log(`[MCP ${new Date().toISOString()}] Tool: search_across_apis | Query: ${query} | Results: ${unique.length}`);
    return { content: [{ type: "text", text: formatEpisodeCards(unique) }] };
  }
);

// Starter Buttons (12 prompts)
const STARTER_PROMPTS = [
  { name: "climat_urgent", desc: "Solutions urgentes pour le climat", text: "Quelles sont les solutions les plus urgentes pour le climat abordées dans Soluble(s) ?" },
  { name: "zero_dechet", desc: "Initiatives zéro déchet", text: "Trouve-moi des épisodes sur le zéro déchet et l'économie circulaire." },
  { name: "sante_mentale", desc: "Solutions pour la santé mentale", text: "Quelles solutions existent pour préserver la santé mentale ?" },
  { name: "inclusion_sociale", desc: "Inclusion sociale", text: "Parle-moi des épisodes sur l'inclusion sociale et le handicap." },
  { name: "mobilite_douce", desc: "Mobilité douce", text: "Quelles sont les alternatives concrètes pour la mobilité douce ?" },
  { name: "agriculture_durable", desc: "Agriculture durable", text: "Quelles solutions pour une agriculture plus durable ?" },
  { name: "education_innovante", desc: "Éducation innovante", text: "Quelles initiatives innovantes en éducation ?" },
  { name: "egalite_fh", desc: "Égalité femmes-hommes", text: "Quels épisodes sur l'égalité femmes-hommes et actions ?" },
  { name: "biodiversite", desc: "Biodiversité", text: "Comment protéger la biodiversité selon les invités ?" },
  { name: "tech_for_good", desc: "Tech for Good", text: "Meilleurs exemples de Tech for Good ?" },
  { name: "economie_circulaire", desc: "Économie circulaire", text: "Entreprises ou assos en économie circulaire ?" },
  { name: "engagement_citoyen", desc: "Engagement quotidien", text: "Comment s'engager concrètement au quotidien ?" }
];

STARTER_PROMPTS.forEach(p => {
  server.prompt(p.name, p.desc, () => ({
    messages: [{ role: "user", content: { type: "text", text: p.text } }]
  }));
});

// Handler Netlify
export const handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);

  return new Promise(resolve => {
    let body = "";
    let headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
    let status = 200;

    const req = {
      method: event.httpMethod,
      url: event.path,
      headers: event.headers,
      on: (ev, cb) => {
        if (ev === 'data' && event.body) cb(Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8'));
        if (ev === 'end') cb();
      }
    };

    const res = {
      setHeader: (k, v) => headers[k] = v,
      writeHead: (s, h) => { status = s; headers = { ...headers, ...h }; },
      write: chunk => body += chunk.toString(),
      end: chunk => {
        if (chunk) body += chunk.toString();
        resolve({ statusCode: status, headers, body });
      }
    };

    transport.handleRequest(req, res);
  });
};
