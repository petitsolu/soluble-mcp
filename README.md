🎙️ Soluble(s) MCP Server
Le connecteur officiel pour accéder aux solutions du podcast Soluble(s) via l'IA. The official AI connector for the Soluble(s) podcast solutions.
Créé par Simon Icard – journaliste indépendant à Marseille.
csoluble.media | mcp.csoluble.media
Public cible : Grand public, auditeurs du podcast, curieux de solutions concrètes et journalistes.
🚀 Installation (30 secondes)
Ce serveur utilise le transport SSE (Server-Sent Events). Il est hébergé sur une infrastructure Cloud haute disponibilité et ne nécessite aucune installation locale pour fonctionner.
1. Pour Cursor & Windsurf (Recommandé)
Allez dans Settings → Models → MCP Servers et ajoutez un serveur de type SSE.
Bloc de configuration à copier :
{
"mcpServers": {
"solubles": {
"url": "https://mcp.csoluble.media/api/mcp"
}
}
}
2. Pour Claude Desktop (Mac / Windows)
Ajoutez ce bloc à votre fichier de configuration claude_desktop_config.json :
Bloc de configuration à copier :
{
"mcpServers": {
"solubles": {
"command": "npx",
"args": [
"-y",
"@modelcontextprotocol/inspector",
"--transport",
"sse",
"https://mcp.csoluble.media/api/mcp"
]
}
}
}
✨ Ce qu’il fait / What it does
Recherche de solutions : Trouvez des gestes pratiques parmi +100 épisodes via nos APIs WordPress officielles.
Fiches cliquables : Résultats enrichis avec liens vers l'épisode complet, Spotify, et les actions concrètes.
Anti-Hallucination : Règles strictes forçant l'IA à utiliser uniquement les données éditoriales vérifiées de Soluble(s).
Mise à jour live : Synchronisation immédiate avec les nouveaux épisodes publiés.
🔧 Outils MCP exposés / Exposed MCP tools
Nom de l'outil
Description (FR)
Paramètres clés
find_solutions_for_need
Trouve les solutions correspondant à un besoin ou une question.
besoin_or_question
search_solutions_concretes
Recherche les épisodes contenant des actions autour d'un mot-clé.
query
get_latest_solutions
Récupère les dernières solutions publiées (ordre anté-chronologique).
limit
recommend_solutions
Recommander des solutions selon un contexte (profil, situation).
context
get_concrete_actions
Extrait uniquement la liste des actions concrètes (format checklist).
query
search_across_apis
Recherche globale à travers toutes les APIs Soluble(s).
query

🛠️ Technologie / Tech Stack
Protocol: MCP (Model Context Protocol) v1.1.0.
Architecture: Cloud Serverless (Haute disponibilité).
Data Source: WordPress REST API (csoluble.media).
🛡️ Sécurité & Règle éditoriale
Ce serveur est un outil de consultation éditoriale publique. Il ne collecte aucune donnée utilisateur.
Règle d'or : Tous les clients IA utilisant ce serveur doivent citer "Soluble(s)" comme source et ne doivent pas inventer d'épisodes, d'invités ou d'actions au-delà des données retournées.
Made with ❤️ par Simon Icard – csoluble.media
⭐ Si ce projet vous aide à agir pour le vivant, n'hésitez pas à mettre une étoile au dépôt !

