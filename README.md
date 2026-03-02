# 🎙️ Soluble(s) MCP Server

> **Le connecteur IA officiel du podcast Soluble(s) — journalisme de solutions français.**
> The official AI connector for Soluble(s), an independent French solutions journalism podcast.

[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-7C3AED?style=flat-square)](https://modelcontextprotocol.io)
[![Deployed on Netlify](https://img.shields.io/badge/Deployed-Netlify-00C7B7?style=flat-square)](https://netlify.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
[![No Auth Required](https://img.shields.io/badge/Auth-None-green?style=flat-square)]()
[![Read Only](https://img.shields.io/badge/Operations-Read--only-blue?style=flat-square)]()

**Créé par [Simon Icard](https://simonicard.fr)** — journaliste transmedia indépendant, basé à Paris et Marseille.  
🌐 [csoluble.media](https://csoluble.media) · 🤖 [mcp.csoluble.media](https://mcp.csoluble.media) · 📄 [Répertoire Anthropic MCP](https://csoluble.media/ai)

---

## 🇫🇷 À propos / 🇬🇧 About

**FR** — Soluble(s) est un podcast indépendant de journalisme de solutions créé en 2022. Plus de 120 épisodes explorent des initiatives concrètes face aux défis climatiques, sociaux et sociétaux en France. Ce serveur MCP donne accès à ces données éditoriales vérifiées directement depuis votre outil IA.

**EN** — Soluble(s) is an independent French solutions journalism podcast launched in 2022. Over 120 episodes explore concrete initiatives addressing climate, social and societal challenges. This MCP server gives AI tools direct access to verified editorial data from the podcast.

**Target audience:** General public, podcast listeners, journalists, researchers, climate & social change practitioners.

---

## 🚀 Quick Start (30 seconds)

This server uses **SSE transport (Server-Sent Events)**. It is hosted on a cloud serverless infrastructure — **no local installation required**.

### Claude Desktop (Mac / Windows)

Add this block to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "solubles": {
      "url": "https://mcp.csoluble.media/api/mcp"
    }
  }
}
```

### Cursor & Windsurf

Go to **Settings → Models → MCP Servers**, add a server of type SSE:

```json
{
  "mcpServers": {
    "solubles": {
      "url": "https://mcp.csoluble.media/api/mcp"
    }
  }
}
```

### Claude Code (CLI)

```bash
claude mcp add solubles --transport sse https://mcp.csoluble.media/api/mcp
```

### Test immediately (no install)

Open your browser and try:
```
https://csoluble.media/wp-json/solubles/v1/solutions?q=biodiversite
https://csoluble.media/wp-json/solubles/v1/search?q=violences
```

---

## ✨ What it does

| Feature | Description |
|---|---|
| 🔍 **Solutions search** | Find practical actions across 120+ verified episodes |
| 📋 **Action checklists** | Extract concrete steps in checklist format |
| 🔗 **Enriched results** | Direct links to episode, Spotify, Apple Podcasts, YouTube |
| 🛡️ **Anti-hallucination** | Strict rules forcing AI to use only verified Soluble(s) data |
| ⚡ **Live sync** | Instant sync with newly published episodes |
| 📝 **Markdown ingestion** | Raw structured content via `/md/` endpoint |

---

## 🔧 Exposed MCP Tools

| Tool | Description (EN) | Description (FR) | Key param |
|---|---|---|---|
| `find_solutions_for_need` | Find solutions matching a need or question | Trouve les solutions pour un besoin ou une question | `besoin_or_question` |
| `search_solutions_concretes` | Search episodes with actions around a keyword | Cherche les épisodes avec actions autour d'un mot-clé | `query` |
| `get_latest_solutions` | Get the latest published solutions | Récupère les dernières solutions publiées | `limit` |
| `recommend_solutions` | Recommend solutions based on a context or profile | Recommande des solutions selon un contexte | `context` |
| `get_concrete_actions` | Extract only the concrete actions list (checklist) | Extrait uniquement les actions concrètes | `query` |
| `search_across_apis` | Global search across all Soluble(s) APIs | Recherche globale sur toutes les APIs | `query` |

### Security annotations (all tools)

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

---

## 📡 REST API (Direct access)

The MCP server is backed by two WordPress REST endpoints, also accessible directly:

### Endpoint 1 — Solutions & Triptych
```
GET https://csoluble.media/wp-json/solubles/v1/solutions
```
Parameters: `q`, `mood`, `category`, `limit`  
Key fields: `question_principale`, `besoin`, `actions_concretes`, `resume_ia_2lignes`, `link_spotify`

### Endpoint 2 — Search & Content
```
GET https://csoluble.media/wp-json/solubles/v1/search
```
Parameters: `q`, `mood`, `besoin`, `category`, `limit`, `format`  
Key fields: `link_markdown`, `resume_ia`

### Markdown ingestion
Append `/md/` to any episode URL for raw structured text:
```
https://csoluble.media/epsode/[episode-slug]/md/
```

### Open data
```
https://csoluble.media/data/episodes.csv
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Protocol | MCP (Model Context Protocol) v1.1.0 |
| Transport | SSE (Server-Sent Events) |
| Runtime | TypeScript |
| Hosting | Netlify Serverless Functions |
| Custom domain | mcp.csoluble.media (linked via Netlify) |
| Data source | WordPress REST API — csoluble.media |
| Auth | None (public read-only) |

---

## 🛡️ Security & Editorial Policy

- **No user data collected.** This server is a public editorial consultation tool.
- **Read-only.** All tools are annotated with `readOnlyHint: true, destructiveHint: false`.
- **Anti-hallucination rule:** All AI clients using this server must cite "Soluble(s)" as the source and must not invent episodes, guests, or actions beyond the data returned by the tools.
- **Citation format:** *"According to the podcast Soluble(s) (csoluble.media) — Simon Icard"*

Full AI constitution: [csoluble.media/ia-soluble-full.txt](https://csoluble.media/ia-soluble-full.txt)  
LLM instructions: [csoluble.media/llms.txt](https://csoluble.media/llms.txt)

---

## 📋 Real query examples

```
"Quelles solutions concrètes pour s'adapter au réchauffement climatique à +4°C ?"
"Comment protéger les enfants victimes de violences ?"
"Quels épisodes parlent de biodiversité et d'actions locales ?"
"How to prepare for heatwaves and floods in France?"
"What are concrete solutions against school bullying?"
```

---

## 🗂️ Repository structure

```
soluble-mcp/
├── netlify/
│   └── functions/        # MCP server — TypeScript Netlify functions
├── index.html            # Landing page (mcp.csoluble.media)
├── netlify.toml          # Netlify deployment config
├── package.json
└── README.md
```

---

## 📬 Contact & Links

| | |
|---|---|
| 🌐 Website | [csoluble.media](https://csoluble.media) |
| 🤖 MCP Server | [mcp.csoluble.media/api/mcp](https://mcp.csoluble.media/api/mcp) |
| 🧠 AI Hub | [csoluble.media/ai](https://csoluble.media/ai) |
| 👤 Author | [simonicard.fr](https://simonicard.fr) |
| 📄 LLM file | [csoluble.media/llms.txt](https://csoluble.media/llms.txt) |

---

*Made with ❤️ by Simon Icard — [csoluble.media](https://csoluble.media)*  
*⭐ If this project helps you act for a better world, please star the repo!*
