# Mira

**Une IA qui code pour toi, entièrement dans ton navigateur.** Pas de compte, pas d'abonnement : tes conversations et ton code restent sur ton ordinateur.

👉 **Essayer : https://natxmans.github.io/mira/** (Chrome ou Edge à jour, sur ordinateur)

## Deux pages : les visiteurs et le panneau admin

- **`index.html`, la page des visiteurs** : la vitrine des créations publiées (on peut y jouer, voir leur code, et demander à Mira de les modifier), Mira qui code pour eux, et une discussion avec son petit cerveau entraîné. Pas de réglages : tout ce qu'ils font reste dans leur propre navigateur.
- **`admin.html`, le panneau admin** : tout ce qui est décrit plus bas (Atelier, Laboratoire), plus l'onglet **Publication**. Il est protégé par un code secret, dont seule une empreinte est publiée (PBKDF2-SHA256, 600 000 tours, sel au hasard). Le panneau ne reste ouvert que dans l'onglet où le code a été tapé, se reverrouille après 20 minutes sans activité, fait attendre de plus en plus longtemps après 5 codes faux, demande le code actuel avant d'en changer, et refuse de s'ouvrir dans une iframe. <kbd>Ctrl</kbd> + <kbd>Maj</kbd> + <kbd>Q</kbd> verrouille le panneau, et y mène depuis la page des visiteurs. Honnêtement, ce n'est pas une vraie serrure (un site sans serveur ne peut pas cacher une page) : la vraie protection, c'est que seul le compte GitHub du dépôt peut publier.
- **La publication** : le panneau prépare `mira-public.json` (nom, message d'accueil, vitrine, réussites partagées comme exemples, petit cerveau entraîné, réglages). Il suffit de déposer ce fichier dans le dépôt pour que les visiteurs voient la nouvelle version. « Voir l'aperçu visiteurs » montre le résultat avant de publier (`index.html?apercu`).

## Les espaces du panneau

### L'Atelier : elle code

Tu lui demandes un jeu, un site ou un outil ; elle écrit le code et tu vois le résultat tourner tout de suite à côté.

- Son « grand cerveau » est un vrai modèle de langage open source spécialisé en programmation, **Qwen2.5-Coder** (équipe Qwen d'Alibaba). Il tourne sur ta carte graphique grâce à **WebGPU** et à la bibliothèque **[WebLLM](https://github.com/mlc-ai/web-llm)**.
- Il se télécharge une seule fois (0,9 Go, 1,7 Go ou 4,3 Go selon la taille choisie), puis il reste dans le cache du navigateur.
- **Sa bibliothèque** (`savoirs.js`) : 42 exemples de code testés (serpent, morpion, quiz, calculatrice, casse-briques, Flappy, Pong, plateforme, pendu, memory, roue de tirage au sort, tableau de tournoi, formulaire, page du festival, Tetris, 2048, Puissance 4, démineur, Simon, labyrinthe, défense spatiale, course de voitures, pixel art, feu d'artifice, générateur d'équipes, sondage, programme d'un événement, tables de multiplication, météo…) et 30 fiches (boucle de jeu, collisions, écran titre et niveaux, manette, images et sprites, canvas adapté à tous les écrans, grilles, adversaire contrôlé par l'ordinateur, particules, fichiers JSON, formulaires, accessibilité, classes, thème sombre, code sûr, même vitesse partout, manipuler la page, fetch, erreurs fréquentes, mise en page, sons, Python…). À chaque demande, elle cherche ce qui ressemble et le relit avant d'écrire : un petit modèle fait beaucoup moins d'erreurs quand il s'inspire d'un code qui marche. Elle te dit de quoi elle s'est aidée.
- **La recherche sur des sites fiables** (`recherche.js`) : quand tu poses une question ou que son code plante, elle cherche sur Vikidia, Wikipédia, le Wiktionnaire, MDN Web Docs (177 pages repérées et vérifiées, presque toutes en français) ou Stack Overflow, lit ce qu'elle trouve et te donne ses sources. Aucun autre site n'est consulté, et seuls les mots de ta question sont envoyés. La case « Elle cherche sur des sites fiables » permet de l'arrêter.
- Le code s'exécute dans un cadre isolé (`iframe` sandbox) : il ne peut pas lire les données de la page. S'il plante dès le lancement, elle essaie une fois de le corriger toute seule ; sinon, un bouton propose de lui demander de corriger l'erreur.
- **L'aperçu** a trois vues : le résultat, le code (que tu peux modifier toi-même avant de cliquer sur « Relancer ») et la console (les `console.log` et les erreurs du programme).
- **Mes créations** : tout ce qu'elle crée est gardé sur l'ordinateur. Tu peux rouvrir, renommer, télécharger ou supprimer chaque création, et « Garder comme exemple » lui apprend à s'inspirer de tes réussites.
- **La voix** : elle peut lire ses réponses à voix haute, et tu peux lui dicter tes demandes (avec la reconnaissance vocale du navigateur).
- **Pratique** : thème clair ou sombre, guide rapide, gestion de l'espace disque (voir et supprimer son grand cerveau), et installation comme une application (`manifest.webmanifest`, `sw.js`) qui marche aussi sans internet une fois le grand cerveau téléchargé.
- Elle connaît le festival gaming **2K27** quand tu lui en parles : programme, structures, jeux et PEGI, tournois, cinéma, matériel, contact et style visuel (`festival-resume.js`, informations publiques seulement).

### Le Laboratoire : son petit cerveau fait maison

Un **Transformer** (la même famille que les grandes IA) écrit **de zéro**, sans aucune bibliothèque, dans `cerveau.js`, commenté en français.

- Tu l'entraînes toi-même dans la page et tu le vois passer du charabia à de vraies phrases en quelques minutes.
- Courbe d'erreur, journal de ce qu'elle écrit au fil de l'entraînement, probabilités de la lettre suivante en direct, leçons pour corriger ses réponses.
- **Ses textes** (`textes.js`) : discussions, connaissances (animaux, corps humain, espace, Terre, sciences, géographie, histoire, arts, français, anglais, maths, informatique, sécurité sur internet), apprendre à coder, festival 2K27 et histoires, soit 772 questions-réponses. « Tout lire » les rassemble.
- **Sa bibliothèque** (`bibliotheque/`) : 14 vrais livres du domaine public, près de 5 millions de caractères (fables de La Fontaine, contes de Perrault, d'Andersen et de Grimm, Alice au pays des merveilles, le Roman de Renart, les Malheurs de Sophie, Poil de Carotte, Lettres de mon moulin, Contes du lundi, et quatre romans de Jules Verne). On coche ceux qu'elle lit en plus de ses textes, et un réglage de mélange garde une bonne place à ses discussions.
- Tu peux aussi ajouter des livres de Wikisource ou des articles de Vikidia et Wikipédia en les cherchant.
- Il est bien trop petit pour coder : c'est un cerveau pour apprendre comment marche une IA.

### Le cerveau entraîné par Claude

Pour qu'elle ressemble à Claude (l'IA d'Anthropic), Claude a écrit **825 discussions** dans sa façon de parler (`textes-claude.js`) : honnête, claire, gentille, qui explique étape par étape, qui reconnaît ses erreurs, qui dit quand elle ne sait pas, et qui refuse poliment ce qui est dangereux en proposant autre chose. Il a ensuite entraîné un cerveau de taille **Grande** (496 000 paramètres, 4 couches, 256 lettres de mémoire) **pendant des heures sur un ordinateur**, avec la même architecture que `cerveau.js`. Il a lu ces discussions (tapées de plusieurs façons, comme au clavier), les autres textes de Mira et les 14 livres.

- Ensuite, comme pour les grandes IA, il y a eu deux étapes de plus :
  - **un affinage supervisé** : chaque exemple est une vraie conversation (0 à 2 échanges d'avant, la question, la réponse), et il n'apprend que la réponse, à partir de la question entière ;
  - **des retours sur ses erreurs** : toutes les 250 étapes, on vérifie chacune des 1 328 questions (celles de Claude et les autres textes de Mira, festival compris), et il revoit 5 fois plus souvent celles qu'il rate.
- Il a fallu 20 000 étapes en tout. Il réécrit exactement **99,8 %** des réponses apprises (99,3 % quand la question est tapée en minuscules sans ponctuation), contre 4,6 % avant l'affinage.
- Le résultat est dans `cerveau-claude.json` (1,3 Mo, nombres rangés sur 16 bits).
- Dans le Laboratoire, onglet Sauvegarde : « Charger le cerveau de Claude ». Son cerveau actuel est d'abord téléchargé, pour qu'on puisse le reprendre.
- Sur la page des visiteurs, c'est lui qui répond tant que tu n'as pas publié ton propre petit cerveau.
- Le bouton « Comme Claude » de « Ce qu'elle lit » donne ces discussions (plus tous les autres textes) à n'importe quelle taille de cerveau.
- Pour écrire vite, le petit cerveau garde en mémoire ce qu'il a déjà calculé pour les lettres précédentes : une nouvelle lettre coûte environ 2 millisecondes au lieu de 35.
- Le grand cerveau de l'Atelier (Qwen) reçoit aussi « sa façon d'être » dans ses consignes : direct, honnête, pédagogue, une seule question quand c'est flou, refus gentil de ce qui est dangereux, et les bons numéros (119, 3018, 112) quand quelqu'un va mal.

C'est une imitation de son style, pas une copie de Claude : Claude a des milliards de paramètres, ce petit cerveau quelques centaines de milliers. Il répond juste aux questions qu'il a apprises, même tapées un peu autrement. Pour une question vraiment nouvelle, il peut encore donner une réponse qui ne va pas.

## Les fichiers

| Fichier | Rôle |
| --- | --- |
| `index.html`, `visiteur.js` | La page des visiteurs |
| `admin.html`, `admin.js` | Le panneau admin : verrou par code secret et publication |
| `style.css` | Le style commun aux deux pages |
| `mira-public.json` | Ce que tu publies pour les visiteurs (créé depuis le panneau) |
| `atelier.js` | L'Atelier : grand cerveau, recherche dans la bibliothèque, conversation, aperçu du code |
| `savoirs.js` | Sa bibliothèque : exemples de code testés et fiches |
| `recherche.js` | La recherche sur des sites fiables (et les livres de Wikisource pour le Laboratoire) |
| `outils.js` | Thème, guide rapide et installation comme application |
| `sw.js`, `manifest.webmanifest`, `icone-*.png` | L'application installable qui marche sans internet |
| `cerveau.js` | Le petit cerveau : Transformer, rétropropagation et optimiseur Adam écrits à la main |
| `app.js` | Le Laboratoire : entraînement, courbe, journal, sauvegardes |
| `textes.js` | Ce que lit le petit cerveau (discussions, connaissances, apprendre à coder, festival 2K27, histoires) |
| `textes-claude.js` | Les 825 discussions écrites par Claude dans sa façon de parler |
| `cerveau-claude.json` | Le petit cerveau entraîné par Claude (taille Grande) |
| `bibliotheque/` | Les 14 livres du domaine public du petit cerveau (`index.json` + un fichier texte par livre) |
| `festival-resume.js` | Ce que le grand cerveau sait du festival 2K27, par sujet |

## Crédits

- Grand cerveau : Qwen2.5-Coder par l'équipe Qwen (Alibaba), convertis pour le navigateur par MLC. Chaque modèle a sa licence, à voir sur Hugging Face.
- Moteur dans le navigateur : WebLLM (MLC AI, licence Apache 2.0).
- Coloration du code : highlight.js (licence BSD).
- Recherche : API de Vikidia, Wikipédia, Wiktionnaire et Wikisource (MediaWiki), documentation MDN Web Docs (dépôts GitHub de Mozilla, CC-BY-SA), API Stack Exchange.
- Livres de la bibliothèque : œuvres du domaine public, transcrites par les bénévoles de [Wikisource](https://fr.wikisource.org/) (le lien de chaque livre est dans `bibliotheque/index.json`).
- Météo de l'exemple : [Open-Meteo](https://open-meteo.com/) (gratuit, sans clé).
- Petit cerveau, interface et textes : écrits pour ce projet. Les discussions « comme Claude » et le cerveau entraîné ont été écrits et entraînés par Claude (Anthropic), avec PyTorch.
