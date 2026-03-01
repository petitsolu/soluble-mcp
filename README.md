# 🎙️ Soluble(s) MCP Server
**Le connecteur officiel pour accéder aux solutions du podcast Soluble(s) via l'IA.** **The official AI connector for the Soluble(s) podcast solutions.**

[![Status](https://img.shields.io/badge/Status-Op%C3%A9rationnel-00E676?style=for-the-badge)](https://mcp.csoluble.media)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](https://opensource.org/licenses/MIT)

Créé par **Simon Icard** – journaliste indépendant à Marseille.  
[csoluble.media](https://csoluble.media) | [mcp.csoluble.media](https://mcp.csoluble.media)

---

### 🚀 Installation (30 secondes)

Ce serveur utilise le transport **SSE (Server-Sent Events)**. Il est hébergé sur une infrastructure Cloud haute disponibilité et ne nécessite aucune installation locale pour fonctionner dans vos outils d'IA.

#### 1. Pour Cursor & Windsurf (Recommandé)
Ces éditeurs gèrent le protocole nativement.  
1. Allez dans `Settings` → `Models` → `MCP Servers`.
2. Cliquez sur **Add New MCP Server**.
3. Choisissez le type **SSE**.
4. URL : `https://mcp.csoluble.media/api/mcp`

*Ou copiez ce bloc JSON dans vos réglages :*
```json
{
  "mcpServers": {
    "solubles": {
      "url": "[https://mcp.csoluble.media/api/mcp](https://mcp.csoluble.media/api/mcp)"
    }
  }
}

```

#### 2. Pour Claude Desktop (Avancé)

Ajoutez ce bloc à votre fichier de configuration `claude_desktop_config.json` :

```json
"mcpServers": {
  "solubles": {
    "command": "npx",
    "args": [
      "-y", 
      "@modelcontextprotocol/inspector", 
      "--transport", 
      "sse", 
      "[https://mcp.csoluble.media/api/mcp](https://mcp.csoluble.media/api/mcp)"
    ]
  }
}

```

---

### ✨ Ce qu’il fait / What it does

**Français**

* **Recherche de solutions** : Trouvez des gestes pratiques parmi +100 épisodes via nos APIs WordPress officielles.
* **Fiches cliquables** : Résultats enrichis avec liens vers **l'épisode complet**, **Spotify**, et les actions concrètes.
* **Anti-Hallucination** : Règles strictes forçant l'IA à utiliser uniquement les données éditoriales vérifiées de Soluble(s).
* **Mise à jour live** : Synchronisation immédiate avec les nouveaux épisodes publiés.

**English**

* **Augmented Search**: Find practical actions among +100 episodes via our official WordPress APIs.
* **Clickable Cards**: Enriched results with links to the **full episode**, **Spotify**, and concrete actions.
* **Anti-Hallucination**: Strict rules forcing the AI to use only verified editorial data.
* **Live Updates**: Immediate synchronization with newly published episodes.

---

### 🛠️ Technologie / Tech Stack

* **Protocol**: MCP (Model Context Protocol) v1.1.0.
* **Architecture**: Cloud Serverless (Haute disponibilité).
* **Runtime**: TypeScript / Node.js.
* **Data Source**: WordPress REST API (csoluble.media).

---

### 🛡️ Sécurité & Éthique / Security & Ethics

Ce serveur est un outil de consultation éditoriale publique. Il ne collecte aucune donnée utilisateur et n'accède à aucune information privée.

**Règle d'usage** : L'IA doit systématiquement citer "Soluble(s)" comme source des informations fournies.

---

Made with ❤️ par Simon Icard – [csoluble.media](https://csoluble.media)

⭐ *Si ce projet vous aide à agir pour le vivant, n'hésitez pas à mettre une étoile au dépôt !*

```
