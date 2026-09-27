/*
 * festival-resume.js — ce que Mira sait du festival 2K27 (Atelier).
 *
 * Seulement des informations publiques (déjà sur le site du festival ou destinées aux
 * familles), découpées par sujet. Quand on lui parle du festival, l'Atelier lui donne
 * les sections qui correspondent à la demande (ou toutes, si elles tiennent).
 * Source : Projet 2K27/Festival 2K27/donnees-festival.js, mis à jour le 27/09/2026.
 * Le programme est encore provisoire : il est validé par les jeunes le 30 septembre 2026.
 */
const FESTIVAL_SECTIONS = [
  {
    id: 'general', titre: 'Le festival',
    mots: [],
    texte: `Festival gaming 2K27, organisé par des jeunes : l'ATEC Gaming Interco 2K27 (association temporaire d'enfants citoyens, accompagnée par les Francas de la Gironde) avec le SAJ (Service Animation Jeunesse) de Cestas, soutenu par la Ville de Cestas.
Phase 1, « Gaming Toussaint » : mardi 20 et mercredi 21 octobre 2026, de 10h à 16h (les jeunes du SAJ restent jusqu'à 17h), à la Halle du Centre Culturel de Cestas (on entre par le préau). Gratuit, pique-nique à apporter, goûter offert. 98 jeunes le mardi (5 groupes), 104 le mercredi (6 groupes), 36 places par jour pour les jeunes du SAJ de Cestas. 12 espaces de jeu.
Phase 2 : grande édition en février 2027 (jour pas encore fixé), 100 places, tournoi World of Padman.`,
  },
  {
    id: 'structures', titre: 'Les structures invitées',
    mots: ['structure', 'structures', 'ville', 'villes', 'maison des jeunes', 'qui vient', 'participants', 'groupes', 'parempuyre', 'lanton', 'lege', 'leognan', 'gradignan', 'mios', 'abcs', 'blanquefort', 'illac', 'marcheprime'],
    texte: `Mardi 20 octobre : SAJ Cestas (36 jeunes, 10h-17h), Maison des Jeunes de Parempuyre (14, 10h15-15h45), Maison des Jeunes de Lanton (8, 10h-16h), Maison des Jeunes de Lège-Cap-Ferret (16, 10h-16h), Maison des Jeunes de Léognan (8, 10h-16h, stand Switch), Animation 11-17 ans de Gradignan (16, 12h30-16h30).
Mercredi 21 octobre : SAJ Cestas (36, 10h-17h), Lège-Cap-Ferret (8, 10h-16h), Léognan (8, 10h-16h, stand Switch), Espace Jeunes de Mios (16, 10h-16h, stand rétro), ABCS Blanquefort (12, 11h-16h, PS5 et Switch), Espace Jeunes de Saint-Jean-d'Illac (8, l'après-midi), JAM Marcheprime (16, 13h-16h).
Les groupes mélangent les structures (on ne reste pas entre jeunes de la même ville) ; les binômes d'amis restent possibles.`,
  },
  {
    id: 'programme', titre: 'Le programme heure par heure',
    mots: ['programme', 'horaires', 'heure', 'deroule', 'planning', 'mardi', 'mercredi', 'journee', 'emploi du temps', 'quand'],
    texte: `Mardi 20 : 10h00 accueil (pointage, badges PEGI, dépôt des affaires, règles) ; 10h15 mot du Maire sur la scène ; 10h30 sélections Mario (groupes D et E), groupes A, B, C au cinéma à 11h00 ; 12h30 pique-nique 1er service ; 12h40-13h30 finale Mario sur grand écran au cinéma ; 13h30 pique-nique 2e service ; 14h15 rotation 1 dans les espaces ; 15h10 rotation 2 ; 15h40 goûter en bord de scène puis Kahoot géant « Promeneurs du Net » ; 16h00 départs (jeunes du SAJ : jeu libre jusqu'à 17h).
Mercredi 21 : 10h00 accueil et résultats de la finale du mardi ; 10h30 sélections Mario (groupes D, E, F), groupes A, B, C au cinéma ; 12h30 pique-nique ; 12h40-13h30 finale Mario au cinéma ; 13h30 2e service ; 14h15 rotation dans les espaces ; 15h05 finales des tournois découverte sur la scène ; 15h40 goûter, remise des prix et clôture ; 16h00 départs ; 20h30 soirée cinéma Ready Player One en 3D.`,
  },
  {
    id: 'jeux', titre: 'Les espaces de jeu et le PEGI',
    mots: ['jeu', 'jeux', 'espace', 'espaces', 'pegi', 'age', 'mario', 'fortnite', 'valorant', 'fifa', 'smash', 'just dance', 'brawl', 'console', 'switch', 'pc', 'badge', 'bracelet'],
    texte: `Espaces (jeu, PEGI, places) : Mario Kart 8 Deluxe sur Switch et vidéoprojecteur (PEGI 3, 24 places) ; FIFA / EA Sports FC sur PS4 (PEGI 3, 8) ; scène Just Dance, aussi pour le mot du Maire, le Kahoot et la remise des prix (PEGI 3, 20) ; Super Smash Bros. Ultimate sur TV (PEGI 12, 12) ; PC en réseau local avec Fortnite sur 5 PC gamer loués et jeux tout public sur 5 PC du SAJ, écran spectateur (PEGI 12, 26) ; espace Valorant fermé au fond de la réserve, sur 4 PC, filtré par un adulte (PEGI 16, 8) ; Brawl Stars sur smartphone dans un coin chill avec poufs (PEGI 7, 10) ; stands des structures : Léognan (Gang Beasts, Boomerang Fu), ABCS le mercredi (PS5, Switch, FIFA, Mario Party), Mios le mercredi (bornes rétro fabriquées par les jeunes), jeux coop et de société le mardi.
PEGI : à l'accueil, chaque jeune reçoit un badge ou bracelet de couleur selon son âge : PEGI 3 vert (#2DBE4E), 7 jaune (#FFD21F), 12 orange (#FF8A1C), 16 rouge (#FF3B3B). Les animateurs le vérifient avant de laisser jouer. Aucun jeu PEGI 18.`,
  },
  {
    id: 'tournois', titre: 'Les tournois',
    mots: ['tournoi', 'tournois', 'finale', 'selection', 'selections', 'qualifie', 'pre-selection', 'preselection', 'recompense', 'prix', 'classement'],
    texte: `Tournoi Mario (Mario Kart 8 Deluxe, 24 places) : sélections par groupe à 10h30, finale sur l'écran géant du cinéma de 12h40 à 13h30, les deux jours ; résultats de la finale du mardi annoncés le mercredi à l'accueil. Les résultats des pré-sélections sont attendus le lundi 19 octobre.
Tournois découverte l'après-midi (jeux choisis par les jeunes), finales le mercredi à 15h05 sur la scène, remise des prix à 15h40.`,
  },
  {
    id: 'cinema', titre: 'Le cinéma',
    mots: ['cinema', 'film', 'seance', 'seances', 'reservation', 'reserver', 'ready player one', 'chihiro', 'galaxy', 'places'],
    texte: `Cinéma au niveau -1 de la Halle (sortie par le préau, cage d'escalier ; départ groupé à 10h25).
Super Mario Galaxy de 11h00 à 12h40, puis finale Mario sur grand écran jusqu'à 13h30 : 48 places le mardi, 45 le mercredi, 4,20 € par jeune.
Ready Player One en français et en 3D, mercredi 21 à 20h30 (fin vers 22h50) : 5,70 € avec les lunettes 3D, inscription à part avec autorisation parentale.
Avant-première Le Voyage de Chihiro, samedi 17 octobre à 14h30, avec une animation sur l'écologie et les jeux vidéo.
Pré-réservations jusqu'au vendredi 9 octobre, liste d'attente ensuite. Une seule séance par jeune.`,
  },
  {
    id: 'materiel', titre: 'Le matériel',
    mots: ['materiel', 'equipement', 'ordinateurs', 'pc', 'console', 'consoles', 'videoprojecteur', 'ecran', 'installation'],
    texte: `Au SAJ : 10 PC, 2 Switch et 10 manettes, 1 PS4 et 4 manettes, 5 vidéoprojecteurs, 2 TV, 1 écran valise, 2 sonos, 2 micros HF, 14 casques. Loués : 5 PC gamer pour Fortnite. Apportés par les structures : Switch, PS5, bornes rétro. Installation de la Halle le lundi 19 octobre.`,
  },
  {
    id: 'contact', titre: 'Contact, site et style visuel',
    mots: ['contact', 'telephone', 'mail', 'email', 'site', 'page', 'couleurs', 'style', 'design', 'logo', 'affiche', 'neon'],
    texte: `Contact : SAJ de Cestas, 06 81 39 63 67, saj@mairie-cestas.fr. Site du festival : https://natxmans.github.io/site-2K27/
Style visuel du festival (néon gaming) : fond #0a0a14 (et #10101c), violet néon #b026ff, cyan néon #22e8ff, rose néon #ff2e88, texte #e8e8f5, texte doux #9494b0. Polices Google Fonts : Orbitron pour les titres, Rajdhani pour le texte. Ne jamais afficher de nom ou prénom de jeune organisateur sur une page publique.`,
  },
];
