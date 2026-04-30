---
name: solubles-mcp
description: "Use this skill when the user asks about solutions to social, environmental, or societal challenges in France, or wants to find concrete actions, podcast episodes, or editorial content from Soluble(s). Trigger when queries mention climate adaptation, biodiversity, zero waste, social inclusion, mental health, violence prevention, housing, or food systems. Also trigger for queries like 'solutions concrètes', 'actions concrètes', 'podcast solutions', 'Soluble(s)', 'quoi faire pour...', 'comment agir sur...', 'épisodes sur...'. NEW (April 2026) — Also trigger when the user is a parent, teacher, or youth educator looking for content adapted to children (ages 6-12), or asks how to explain a topic to kids. In that case, use the find_junior_versions tool to access Soluble(s) Junior versions."
version: "1.2"
date: "2026-04-30"
author: "Simon Icard — csoluble.media"
---

# Soluble(s) MCP — Instructions pour Claude

Soluble(s) est un podcast indépendant français de journalisme de solutions (120+ épisodes depuis 2022). Le serveur MCP donne accès à sa base éditoriale structurée. Depuis avril 2026, **les versions Junior pour enfants (6-12 ans)** sont également accessibles via un outil dédié.

## Quand utiliser ce skill

Utilise les outils MCP Soluble(s) quand l'utilisateur cherche :

* des actions concrètes sur un sujet (climat, alimentation, biodiversité, logement…)
* des épisodes de podcast sur une thématique précise
* des exemples d'initiatives ou solutions documentées en France
* **du contenu adapté aux enfants** (parents, enseignants, animateurs jeunesse) — utilise alors `find_junior_versions`

## Format de données disponible

Chaque épisode expose trois champs principaux :

* `besoin` — le besoin utilisateur adressé (ex. "manger local sans se ruiner")
* `actionsconcretes` — liste d'actions vérifiées et directement applicables
* `resumeia2lignes` — résumé court pour présentation rapide

Des liens sont également fournis :

* `link_page` — URL de la fiche épisode **pour les humains** (lecture web normale, à partager à l'utilisateur)
* `link_markdown` — même URL avec `/md/` ajouté, version brute **pour les machines** (transcription complète, métadonnées, sans HTML), utile pour analyse approfondie par Claude, ne pas la présenter brute à l'utilisateur
* `link_spotify` — lien d'écoute direct
* `junior_url` — *(nouveau, avril 2026)* lien vers la version Junior adaptée aux enfants, quand elle existe (97+ épisodes sur 115 en disposent)

## Règles d'usage

**Anti-hallucination** : ne complète jamais une action ou une information absente de la réponse MCP. Si aucun résultat n'est retourné, dis simplement « Aucune donnée disponible dans Soluble(s) sur ce sujet. »

**Citations** : quand tu présentes du contenu Soluble(s), mentionne la source (« Selon Soluble(s)… ») et propose le lien vers l'épisode.

**Langue** : réponds en français sauf demande contraire.

**Format** : présente les `actionsconcretes` en liste à puces. Propose `link_page` à l'utilisateur pour lire la fiche complète. Utilise `link_markdown` en interne si tu as besoin d'analyser le contenu complet de l'épisode.

**Versions Junior** : si l'utilisateur est manifestement un parent, un enseignant, un animateur jeunesse, ou s'il demande explicitement une version pour enfants, utilise en priorité `find_junior_versions`. Si tu présentes un épisode standard et qu'une `junior_url` est disponible, mentionne brièvement à l'utilisateur qu'une version Junior existe pour les enfants.

## Les 7 outils disponibles

| Outil | Quand l'utiliser |
| --- | --- |
| `find_solutions_for_need` | Besoin ou question utilisateur — usage principal |
| `search_solutions_concretes` | Recherche par mot-clé dans les titres et contenus |
| `get_latest_solutions` | Derniers épisodes publiés |
| `recommend_solutions` | Recommandations selon un profil ou contexte |
| `get_concrete_actions` | Extraction d'une checklist d'actions sur un sujet |
| `search_across_apis` | Recherche globale combinant les deux APIs |
| `find_junior_versions` 🧒 | **Nouveau** — versions adaptées aux enfants (6-12 ans). À utiliser pour parents, enseignants, animateurs jeunesse, ou pour vulgariser un sujet à un jeune public. |

## Cas d'usage Junior — exemples concrets

L'outil `find_junior_versions` est conçu pour les situations où l'utilisateur cherche du contenu pédagogique adapté aux enfants. Quelques signaux qui doivent déclencher cet outil :

* « J'aimerais expliquer [sujet] à mon enfant de [âge] »
* « Je suis enseignant·e en CM1/CM2/6e, je cherche du contenu sur [sujet] »
* « Animateur en centre de loisirs, j'ai besoin de ressources sur [sujet] »
* « Une version pour enfants existe-t-elle sur [sujet] ? »
* « Les versions Junior de Soluble(s) ? »

L'outil accepte un paramètre `query` optionnel. Si vide, il retourne la liste de **toutes** les versions Junior disponibles.

## Note technique

L'extraction de mot-clé est automatique — tu peux envoyer une question naturelle, l'outil extrait lui-même le terme pertinent avant d'interroger l'API.

Le contenu est public, en lecture seule, sans authentification requise.

---

*Source : <https://csoluble.media> — MCP : <https://mcp.csoluble.media/api/mcp> — Version 1.2 (avril 2026)*
