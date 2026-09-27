# Mira

**Une IA qui code pour toi, entièrement dans ton navigateur.** Pas de compte, pas d'abonnement : tes conversations et ton code restent sur ton ordinateur.

👉 **Essayer : https://natxmans.github.io/mira/** (Chrome ou Edge à jour, sur ordinateur)

## Les deux espaces

### L'Atelier : elle code

Tu lui demandes un jeu, un site ou un outil ; elle écrit le code et tu vois le résultat tourner tout de suite à côté.

- Son « grand cerveau » est un vrai modèle de langage open source spécialisé en programmation, **Qwen2.5-Coder** (équipe Qwen d'Alibaba). Il tourne sur ta carte graphique grâce à **WebGPU** et à la bibliothèque **[WebLLM](https://github.com/mlc-ai/web-llm)**.
- Il se télécharge une seule fois (0,9 Go, 1,7 Go ou 4,3 Go selon la taille choisie), puis il reste dans le cache du navigateur.
- **Sa bibliothèque** (`savoirs.js`) : 27 exemples de code testés (serpent, morpion, quiz, calculatrice, casse-briques, Flappy, Pong, plateforme, pendu, memory, roue de tirage au sort, tableau de tournoi, formulaire, page du festival…) et 15 fiches (boucle de jeu, manipuler la page, tableaux, fetch, erreurs fréquentes, mise en page, canvas, dates, sons, Python…). À chaque demande, elle cherche ce qui ressemble et le relit avant d'écrire : un petit modèle fait beaucoup moins d'erreurs quand il s'inspire d'un code qui marche. Elle te dit de quoi elle s'est aidée.
- **La recherche sur des sites fiables** (`recherche.js`) : quand tu poses une question ou que son code plante, elle cherche sur Vikidia, Wikipédia, le Wiktionnaire, MDN Web Docs ou Stack Overflow, lit ce qu'elle trouve et te donne ses sources. Aucun autre site n'est consulté, et seuls les mots de ta question sont envoyés. La case « Elle cherche sur des sites fiables » permet de l'arrêter.
- Le code s'exécute dans un cadre isolé (`iframe` sandbox) : il ne peut pas lire les données de la page. S'il plante, un bouton propose de lui demander de corriger l'erreur.
- Elle connaît le festival gaming **2K27** quand tu lui en parles : programme, structures, jeux et PEGI, tournois, cinéma, matériel, contact et style visuel (`festival-resume.js`, informations publiques seulement).

### Le Laboratoire : son petit cerveau fait maison

Un **Transformer** (la même famille que les grandes IA) écrit **de zéro**, sans aucune bibliothèque, dans `cerveau.js`, commenté en français.

- Tu l'entraînes toi-même dans la page et tu le vois passer du charabia à de vraies phrases en quelques minutes.
- Courbe d'erreur, journal de ce qu'elle écrit au fil de l'entraînement, probabilités de la lettre suivante en direct, leçons pour corriger ses réponses.
- Pour lui donner plus à lire : « Tout lire » rassemble tous ses textes, et tu peux ajouter des livres libres de droits de Wikisource (fables, contes…) ou des articles de Vikidia et Wikipédia.
- Il est bien trop petit pour coder : c'est un cerveau pour apprendre comment marche une IA.

## Les fichiers

| Fichier | Rôle |
| --- | --- |
| `index.html` | La page et son style |
| `atelier.js` | L'Atelier : grand cerveau, recherche dans la bibliothèque, conversation, aperçu du code |
| `savoirs.js` | Sa bibliothèque : exemples de code testés et fiches |
| `recherche.js` | La recherche sur des sites fiables (et les livres de Wikisource pour le Laboratoire) |
| `cerveau.js` | Le petit cerveau : Transformer, rétropropagation et optimiseur Adam écrits à la main |
| `app.js` | Le Laboratoire : entraînement, courbe, journal, sauvegardes |
| `textes.js` | Ce que lit le petit cerveau (discussions, festival 2K27, histoires) |
| `festival-resume.js` | Ce que le grand cerveau sait du festival 2K27, par sujet |

## Crédits

- Grand cerveau : Qwen2.5-Coder par l'équipe Qwen (Alibaba), convertis pour le navigateur par MLC. Chaque modèle a sa licence, à voir sur Hugging Face.
- Moteur dans le navigateur : WebLLM (MLC AI, licence Apache 2.0).
- Coloration du code : highlight.js (licence BSD).
- Recherche : API de Vikidia, Wikipédia, Wiktionnaire et Wikisource (MediaWiki), documentation MDN Web Docs (dépôts GitHub de Mozilla, CC-BY-SA), API Stack Exchange.
- Petit cerveau, interface et textes : écrits pour ce projet.
