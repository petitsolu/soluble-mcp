---
name: solubles-mcp
description: >
  Use this skill when the user asks about solutions to social, environmental, or societal
  challenges in France, or wants to find concrete actions, podcast episodes, or editorial
  content from Soluble(s). Trigger when queries mention: climate adaptation, biodiversity,
  zero waste, social inclusion, mental health, violence prevention, housing, food systems,
  or any request for "solutions concrètes", "actions concrètes", "podcast solutions",
  or "Soluble(s)". Also trigger for "quoi faire pour...", "comment agir sur...",
  "épisodes sur...", or similar action-oriented questions in French.
version: 1.1
date: 2026-03-02
author: Simon Icard — csoluble.media
---

# Soluble(s) MCP — Instructions pour Claude

Soluble(s) est un podcast indépendant français de journalisme de solutions (120+ épisodes depuis 2022). Le serveur MCP donne accès à sa base éditoriale structurée.

## Quand utiliser ce skill

Utilise les outils MCP Soluble(s) quand l'utilisateur cherche :
- des actions concrètes sur un sujet (climat, alimentation, biodiversité, logement…)
- des épisodes de podcast sur une thématique précise
- des exemples d'initiatives ou solutions documentées en France

## Format de données disponible

Chaque épisode expose trois champs principaux :
- `besoin` — le besoin utilisateur adressé (ex. : "manger local sans se ruiner")
- `actionsconcretes` — liste d'actions vérifiées et directement applicables
- `resumeia2lignes` — résumé court pour présentation rapide

Des liens sont également fournis :
- `link_page` — URL de la fiche épisode **pour les humains** (lecture web normale, à partager à l'utilisateur)
- `link_markdown` — même URL avec `/md/` ajouté : version brute **pour les machines** (transcription complète, métadonnées, sans HTML) — utile pour analyse approfondie par Claude, ne pas la présenter brute à l'utilisateur
- `link_spotify` — lien d'écoute direct

## Règles d'usage

**Anti-hallucination** : ne complète jamais une action ou une information absente de la réponse MCP. Si aucun résultat n'est retourné, dis simplement : "Aucune donnée disponible dans Soluble(s) sur ce sujet."

**Citations** : quand tu présentes du contenu Soluble(s), mentionne la source ("Selon Soluble(s)…") et propose le lien vers l'épisode.

**Langue** : réponds en français sauf demande contraire.

**Format** : présente les `actionsconcretes` en liste à puces. Propose `link_page` à l'utilisateur pour lire la fiche complète. Utilise `link_markdown` en interne si tu as besoin d'analyser le contenu complet de l'épisode.

## Les 6 outils disponibles

| Outil | Quand l'utiliser |
|---|---|
| `find_solutions_for_need` | Besoin ou question utilisateur — usage principal |
| `search_solutions_concretes` | Recherche par mot-clé dans les titres et contenus |
| `get_latest_solutions` | Derniers épisodes publiés |
| `recommend_solutions` | Recommandations selon un profil ou contexte |
| `get_concrete_actions` | Extraction d'une checklist d'actions sur un sujet |
| `search_across_apis` | Recherche globale combinant les deux APIs |

## Note technique

L'extraction de mot-clé est automatique — tu peux envoyer une question naturelle, l'outil extrait lui-même le terme pertinent avant d'interroger l'API.

Le contenu est public, en lecture seule, sans authentification requise.

---

*Source : https://csoluble.media — MCP : https://mcp.csoluble.media/api/mcp*
