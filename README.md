# 🎙️ Soluble(s) MCP Server

> **Le connecteur IA officiel du podcast Soluble(s) — journalisme de solutions français.**
> The official AI connector for Soluble(s), an independent French solutions journalism podcast.

[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-7C3AED?style=flat-square)](https://modelcontextprotocol.io)
[![Deployed on Netlify](https://img.shields.io/badge/Deployed-Netlify-00C7B7?style=flat-square)](https://netlify.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
[![No Auth Required](https://img.shields.io/badge/Auth-None-green?style=flat-square)]()
[![Read Only](https://img.shields.io/badge/Operations-Read--only-blue?style=flat-square)]()
[![Junior versions](https://img.shields.io/badge/Junior%20versions-97%2B%20episodes-FF6B9D?style=flat-square)]()

**Créé par [Simon Icard](https://simonicard.fr)** — journaliste transmedia indépendant, basé à Paris et Marseille.  
🌐 [csoluble.media](https://csoluble.media) · 🤖 [mcp.csoluble.media](https://mcp.csoluble.media) · 📄 [Répertoire Anthropic MCP](https://csoluble.media/ai)

---

## 🇫🇷 À propos / 🇬🇧 About

**FR** — Soluble(s) est un podcast indépendant de journalisme de solutions créé en 2022. Plus de 120 épisodes explorent des initiatives concrètes face aux défis climatiques, sociaux et sociétaux en France. Ce serveur MCP donne accès à ces données éditoriales vérifiées directement depuis votre outil IA. **Nouveauté avril 2026** : les **versions Junior pour enfants (6-12 ans)** sont désormais accessibles via un outil dédié — idéal pour parents, enseignants et animateurs jeunesse.

**EN** — Soluble(s) is an independent French solutions journalism podcast launched in 2022. Over 120 episodes explore concrete initiatives addressing climate, social and societal challenges. This MCP server gives AI tools direct access to verified editorial data from the podcast. **New April 2026**: **Junior versions for children (ages 6-12)** are now accessible through a dedicated tool — perfect for parents, teachers and youth educators.

**Target audience:** General public, podcast listeners, journalists, researchers, climate & social change practitioners, **parents and teachers** (Junior versions).

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
https://csoluble.media/wp-json/solubles/v1/search?q=climat&limit=5
```
The `search` endpoint now returns a `junior_url` field for episodes available in a children's version.

---

## ✨ What it does

| Feature | Description |
|---|---|
| 🔍 **Solutions search** | Find practical actions across 120+ verified episodes |
| 🧒 **Junior versions** | Access 97+ episodes adapted for children (ages 6-12) — climate, biodiversity, citizenship, daily life |
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
| 🧒 `find_junior_versions` | Find episodes with a children's version (ages 6-12) — for parents, teachers, youth educators | Trouve les épisodes en version Junior adaptée aux enfants — pour parents, enseignants, animateurs jeunesse | `query` (optional) |

### Security annotations (all tools)

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

---

## 🧒 Junior versions — Use case

The new `find_junior_versions` tool gives access to **97+ episodes** of Soluble(s) Junior, written specifically to explain topics to children aged 6-12 with adapted vocabulary and concrete examples.

### Real query examples

```
"Quels épisodes existent en version Junior sur le climat ?"
"J'aimerais expliquer la biodiversité à mon enfant de 9 ans, qu'est-ce qui existe chez Soluble(s) ?"
"Tous les épisodes adaptés aux enfants sur les violences scolaires ?"
"What Soluble(s) episodes exist in a kids' version about oceans?"
```

When called, the tool returns enriched cards with the dedicated **🧒 Junior link** alongside the adult version, so AI assistants can recommend either depending on the user's context.

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
Key fields: `link_markdown`, `resume_ia`, **`junior_url`** *(new — April 2026)*

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
| Protocol | MCP (Model Context Protocol) v2024-11-05 |
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
"Quels épisodes Junior existent sur le climat pour ma classe de CM2 ?"
"Explique-moi la biodiversité comme à un enfant de 8 ans avec Soluble(s)."
```

---

## 📜 Changelog

| Version | Date | Changes |
|---|---|---|
| **1.2.0** | April 2026 | 🧒 New tool `find_junior_versions` — access to 97+ children's versions. Field `junior_url` added to `/search` (backward-compatible). |
| 1.1.5 | March 2026 | Performance optimizations and anti-hallucination guardrails. |
| 1.1.0 | February 2026 | Initial public release. |

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
