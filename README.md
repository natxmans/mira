# Mira

**Une IA qui code pour toi, entièrement dans ton navigateur.** Pas de compte, pas d'abonnement : tes conversations et ton code restent sur ton ordinateur.

👉 **Essayer : https://natxmans.github.io/mira/** (Chrome ou Edge à jour, sur ordinateur)

## Les deux espaces

### L'Atelier : elle code

Tu lui demandes un jeu, un site ou un outil ; elle écrit le code et tu vois le résultat tourner tout de suite à côté.

- Son « grand cerveau » est un vrai modèle de langage open source spécialisé en programmation, **Qwen2.5-Coder** (équipe Qwen d'Alibaba). Il tourne sur ta carte graphique grâce à **WebGPU** et à la bibliothèque **[WebLLM](https://github.com/mlc-ai/web-llm)**.
- Il se télécharge une seule fois (0,9 Go, 1,7 Go ou 4,3 Go selon la taille choisie), puis il reste dans le cache du navigateur.
- Le code s'exécute dans un cadre isolé (`iframe` sandbox) : il ne peut pas lire les données de la page. S'il plante, un bouton propose de lui demander de corriger l'erreur.
- Elle connaît le programme du festival gaming **2K27** quand tu lui en parles (`festival-resume.js`).

### Le Laboratoire : son petit cerveau fait maison

Un **Transformer** (la même famille que les grandes IA) écrit **de zéro**, sans aucune bibliothèque, dans `cerveau.js`, commenté en français.

- Tu l'entraînes toi-même dans la page et tu le vois passer du charabia à de vraies phrases en quelques minutes.
- Courbe d'erreur, journal de ce qu'elle écrit au fil de l'entraînement, probabilités de la lettre suivante en direct, leçons pour corriger ses réponses.
- Il est bien trop petit pour coder : c'est un cerveau pour apprendre comment marche une IA.

## Les fichiers

| Fichier | Rôle |
| --- | --- |
| `index.html` | La page et son style |
| `atelier.js` | L'Atelier : grand cerveau, conversation, aperçu du code |
| `cerveau.js` | Le petit cerveau : Transformer, rétropropagation et optimiseur Adam écrits à la main |
| `app.js` | Le Laboratoire : entraînement, courbe, journal, sauvegardes |
| `textes.js` | Ce que lit le petit cerveau (discussions, festival 2K27, histoires) |
| `festival-resume.js` | Ce que le grand cerveau sait du festival 2K27 |

## Crédits

- Grand cerveau : Qwen2.5-Coder par l'équipe Qwen (Alibaba), convertis pour le navigateur par MLC. Chaque modèle a sa licence, à voir sur Hugging Face.
- Moteur dans le navigateur : WebLLM (MLC AI, licence Apache 2.0).
- Coloration du code : highlight.js (licence BSD).
- Petit cerveau, interface et textes : écrits pour ce projet.
