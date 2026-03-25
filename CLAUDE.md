# Instructions pour Claude — Projet PorteFin

## Règle n°1 : Comprendre avant d'agir

Avant toute implémentation, Claude doit **d'abord expliquer ce qu'il a compris** de la demande, puis **décrire son plan d'action**.

### Format attendu

**Étape 1 — Reformulation**
Résumer la demande en 2-3 phrases : ce que l'utilisateur veut, quel problème ça résout, ce qui est concerné (PC / mobile / les deux).

**Étape 2 — Plan d'action**
Lister les fichiers touchés et les changements prévus, par exemple :
- `MAQUETTE_COMPLETE.html` : [ce qui change]
- `maquette-app/index.html` : [ce qui change]
- Supabase : [table ou requête si concerné]

**Étape 3 — Validation**
Terminer par une question courte : *"C'est bien ça ?"* ou *"Je valide et j'implémente ?"*

Sauf si l'utilisateur dit explicitement **"implémente"** ou **"vas-y"** — dans ce cas, passer directement à l'action sans redemander.

---

## Règle n°2 : Toujours valider l'architecture avant de toucher au code

Ce projet a deux applications distinctes :

| App | Fichier principal | Supabase client |
|-----|-------------------|-----------------|
| PC (bureau) | `MAQUETTE_COMPLETE.html` | `_supabase` |
| Mobile (PWA) | `maquette-app/index.html` | `sb` |

Toute modification touchant l'une **doit être évaluée** pour l'autre.

---

## Règle n°3 : Pas de surprise

- Ne jamais modifier un fichier sans l'avoir lu au préalable
- Ne jamais supposer la structure du code — toujours vérifier
- Si une modification risque de casser quelque chose, le signaler avant de l'appliquer
- Toujours committer et pusher après chaque feature complète

---

## Contexte technique du projet

- **Stack** : HTML/CSS/JS vanilla + Tailwind CDN + Supabase (PostgreSQL)
- **Déploiement** : Netlify (branche `main` → production automatique)
- **Architecture PC** : `SCREENS` object (template literals injectés via `loadScreen()`) + `CONFIG` object + `switchModule()`
- **Architecture mobile** : fonctions `viewXxx()` appelées par `navTo()`, écrans fullscreen via `display:flex/none`
- **Icônes** : Material Symbols Outlined (Google Fonts CDN)

---

## Style de réponse attendu

- Réponses courtes et directes
- Pas de récapitulatif après chaque action ("voilà ce que j'ai fait…") — l'utilisateur voit le diff
- Utiliser des tableaux ou listes pour les plans d'action
- En cas de doute sur l'intention, poser une seule question précise
