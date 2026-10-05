/*
 * savoirs.js — la bibliothèque de Mira pour l'Atelier.
 *
 * Son grand cerveau est petit (1,5 à 7 milliards de paramètres) : il code bien mieux
 * quand il a sous les yeux un exemple qui marche déjà. À chaque demande, l'Atelier
 * cherche ici l'exemple et les fiches qui correspondent (grâce aux « mots ») et les
 * ajoute à ce qu'elle lit avant de répondre. C'est ce qu'on appelle la « récupération ».
 *
 * Chaque exemple a été testé : il s'ouvre sans erreur dans l'aperçu.
 *   type 'exemple' : un fichier HTML complet, en français, avec un bon design ;
 *   type 'fiche'   : une astuce courte qu'elle peut réutiliser.
 */
const SAVOIRS = [];

SAVOIRS.push({
  id: 'serpent', type: 'exemple', titre: 'Jeu du serpent',
  mots: ['serpent', 'snake', 'python le jeu', 'mange des pommes'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Serpent</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #101828; color: #f2f4f7; font-family: system-ui, sans-serif; }
  .jeu { text-align: center; padding: 16px; }
  h1 { margin: 0 0 8px; }
  .infos { display: flex; justify-content: space-between; margin-bottom: 8px; font-weight: 700; }
  canvas { background: #1d2939; border-radius: 12px; display: block; width: min(400px, 90vw); }
  .fleches { display: grid; grid-template-columns: repeat(3, 56px); gap: 6px; justify-content: center; margin-top: 12px; }
  button { font: inherit; font-size: 20px; border: 0; border-radius: 12px; padding: 10px; background: #344054; color: #fff; cursor: pointer; }
  #rejouer { margin-top: 12px; background: #12b76a; font-weight: 700; padding: 10px 24px; }
</style>
</head>
<body>
<div class="jeu">
  <h1>🐍 Serpent</h1>
  <div class="infos"><span>Score : <b id="score">0</b></span><span>Record : <b id="record">0</b></span></div>
  <canvas id="terrain" width="400" height="400"></canvas>
  <div class="fleches">
    <span></span><button data-dir="haut">⬆️</button><span></span>
    <button data-dir="gauche">⬅️</button><button data-dir="bas">⬇️</button><button data-dir="droite">➡️</button>
  </div>
  <button id="rejouer">Rejouer</button>
</div>
<script>
const canvas = document.getElementById('terrain');
const ctx = canvas.getContext('2d');
const TAILLE = 20;
const CASE = canvas.width / TAILLE;
const DIRECTIONS = { haut: { x: 0, y: -1 }, bas: { x: 0, y: 1 }, gauche: { x: -1, y: 0 }, droite: { x: 1, y: 0 } };
let serpent, direction, prochaine, pomme, score, minuteur;
let record = Number(localStorage.getItem('serpent-record')) || 0;
document.getElementById('record').textContent = record;

function nouvellePomme() {
  let p;
  do {
    p = { x: Math.floor(Math.random() * TAILLE), y: Math.floor(Math.random() * TAILLE) };
  } while (serpent.some(s => s.x === p.x && s.y === p.y));
  return p;
}

function demarrer() {
  serpent = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  direction = DIRECTIONS.droite;
  prochaine = direction;
  pomme = nouvellePomme();
  score = 0;
  document.getElementById('score').textContent = score;
  clearInterval(minuteur);
  minuteur = setInterval(avancer, 120);
  dessiner();
}

function changerDirection(nom) {
  const d = DIRECTIONS[nom];
  if (d && !(d.x === -direction.x && d.y === -direction.y)) prochaine = d;
}

function avancer() {
  direction = prochaine;
  const tete = { x: serpent[0].x + direction.x, y: serpent[0].y + direction.y };
  const dehors = tete.x < 0 || tete.y < 0 || tete.x >= TAILLE || tete.y >= TAILLE;
  if (dehors || serpent.some(s => s.x === tete.x && s.y === tete.y)) return perdu();
  serpent.unshift(tete);
  if (tete.x === pomme.x && tete.y === pomme.y) {
    score++;
    document.getElementById('score').textContent = score;
    pomme = nouvellePomme();
  } else {
    serpent.pop();
  }
  dessiner();
}

function perdu() {
  clearInterval(minuteur);
  if (score > record) {
    record = score;
    localStorage.setItem('serpent-record', record);
    document.getElementById('record').textContent = record;
  }
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 30px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('Perdu ! Score : ' + score, canvas.width / 2, canvas.height / 2);
}

function dessiner() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#f04438';
  ctx.beginPath();
  ctx.arc(pomme.x * CASE + CASE / 2, pomme.y * CASE + CASE / 2, CASE / 2.4, 0, Math.PI * 2);
  ctx.fill();
  serpent.forEach((s, i) => {
    ctx.fillStyle = i === 0 ? '#32d583' : '#12b76a';
    ctx.fillRect(s.x * CASE + 1, s.y * CASE + 1, CASE - 2, CASE - 2);
  });
}

const TOUCHES = { ArrowUp: 'haut', ArrowDown: 'bas', ArrowLeft: 'gauche', ArrowRight: 'droite', z: 'haut', s: 'bas', q: 'gauche', d: 'droite' };
document.addEventListener('keydown', e => {
  if (TOUCHES[e.key]) { e.preventDefault(); changerDirection(TOUCHES[e.key]); }
});
document.querySelectorAll('[data-dir]').forEach(b => b.addEventListener('click', () => changerDirection(b.dataset.dir)));
document.getElementById('rejouer').addEventListener('click', demarrer);
demarrer();
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'morpion', type: 'exemple', titre: "Morpion contre l'ordinateur",
  mots: ['morpion', 'tic tac toe', 'tic-tac-toe', 'croix et rond', 'x et o'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Morpion</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f4f3ff; color: #1d1b29; font-family: system-ui, sans-serif; }
  .jeu { text-align: center; padding: 16px; }
  h1 { margin: 0 0 6px; }
  #message { min-height: 28px; font-weight: 700; margin-bottom: 10px; }
  .grille { display: grid; grid-template-columns: repeat(3, 90px); gap: 8px; justify-content: center; }
  .case { width: 90px; height: 90px; font-size: 48px; font-weight: 800; border: 0; border-radius: 16px; background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,.08); cursor: pointer; }
  .case.x { color: #6a4cff; }
  .case.o { color: #f04438; }
  .case.gagnante { background: #d1fadf; }
  .scores { display: flex; gap: 16px; justify-content: center; margin: 14px 0; font-weight: 700; }
  #rejouer { font: inherit; font-size: 17px; font-weight: 700; border: 0; border-radius: 12px; padding: 10px 22px; background: #6a4cff; color: #fff; cursor: pointer; }
</style>
</head>
<body>
<div class="jeu">
  <h1>Morpion</h1>
  <div id="message"></div>
  <div class="grille" id="grille"></div>
  <div class="scores"><span>Toi : <b id="s-toi">0</b></span><span>Nuls : <b id="s-nul">0</b></span><span>Ordi : <b id="s-ordi">0</b></span></div>
  <button id="rejouer">Rejouer</button>
</div>
<script>
const LIGNES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
const grille = document.getElementById('grille');
const message = document.getElementById('message');
const scores = { toi: 0, nul: 0, ordi: 0 };
let plateau, fini;

function ligneGagnante(p) {
  return LIGNES.find(l => p[l[0]] && p[l[0]] === p[l[1]] && p[l[0]] === p[l[2]]) || null;
}

function afficher() {
  grille.innerHTML = '';
  plateau.forEach((valeur, i) => {
    const b = document.createElement('button');
    b.className = 'case' + (valeur ? ' ' + valeur.toLowerCase() : '');
    b.textContent = valeur || '';
    b.addEventListener('click', () => jouer(i));
    grille.appendChild(b);
  });
}

function terminer(texte, qui, ligne) {
  fini = true;
  afficher();
  message.textContent = texte;
  scores[qui]++;
  document.getElementById('s-' + qui).textContent = scores[qui];
  if (ligne) ligne.forEach(i => grille.children[i].classList.add('gagnante'));
}

function verifier() {
  const ligne = ligneGagnante(plateau);
  if (ligne) {
    const moi = plateau[ligne[0]] === 'X';
    terminer(moi ? 'Bravo, tu as gagné ! 🎉' : "L'ordinateur a gagné !", moi ? 'toi' : 'ordi', ligne);
    return true;
  }
  if (plateau.every(v => v)) {
    terminer('Match nul !', 'nul', null);
    return true;
  }
  return false;
}

function coupOrdi() {
  const libres = [];
  plateau.forEach((v, i) => { if (!v) libres.push(i); });
  // 1. gagner si possible, 2. bloquer le joueur, 3. le centre, 4. au hasard
  for (const signe of ['O', 'X']) {
    for (const i of libres) {
      const essai = plateau.slice();
      essai[i] = signe;
      if (ligneGagnante(essai)) return i;
    }
  }
  if (libres.includes(4)) return 4;
  return libres[Math.floor(Math.random() * libres.length)];
}

function jouer(i) {
  if (fini || plateau[i]) return;
  plateau[i] = 'X';
  if (verifier()) return;
  plateau[coupOrdi()] = 'O';
  if (verifier()) return;
  afficher();
}

function nouvellePartie() {
  plateau = Array(9).fill(null);
  fini = false;
  message.textContent = 'À toi de jouer (tu es X)';
  afficher();
}

document.getElementById('rejouer').addEventListener('click', nouvellePartie);
nouvellePartie();
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'quiz', type: 'exemple', titre: 'Quiz à choix multiples',
  mots: ['quiz', 'qcm', 'questionnaire', 'questions', 'devinettes', 'revision', 'reviser', 'culture generale', 'planetes'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Quiz des planètes</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: linear-gradient(135deg, #1e1b4b, #4c1d95); color: #fff; font-family: system-ui, sans-serif; }
  .carte { width: min(520px, 92vw); background: rgba(255,255,255,.1); border-radius: 20px; padding: 24px; box-shadow: 0 20px 50px rgba(0,0,0,.3); }
  .progression { font-size: 14px; opacity: .8; margin-bottom: 8px; }
  h1 { font-size: 22px; margin: 0 0 18px; }
  .choix { display: grid; gap: 10px; }
  .choix button { font: inherit; font-size: 17px; text-align: left; padding: 14px 16px; border: 2px solid transparent; border-radius: 14px; background: #fff; color: #1e1b4b; cursor: pointer; }
  .choix button:hover:not(:disabled) { border-color: #a78bfa; }
  .choix button.bonne { background: #d1fadf; border-color: #12b76a; }
  .choix button.fausse { background: #fee4e2; border-color: #f04438; }
  #suivant, #rejouer { margin-top: 18px; font: inherit; font-weight: 700; font-size: 17px; padding: 12px 22px; border: 0; border-radius: 12px; background: #fbbf24; color: #1e1b4b; cursor: pointer; }
  .cache { display: none; }
  .resultat { text-align: center; font-size: 20px; }
  .resultat b { display: block; font-size: 56px; margin: 10px 0; }
</style>
</head>
<body>
<div class="carte">
  <div id="zone-question">
    <div class="progression" id="progression"></div>
    <h1 id="question"></h1>
    <div class="choix" id="choix"></div>
    <button id="suivant" class="cache">Question suivante</button>
  </div>
  <div id="zone-resultat" class="resultat cache">
    Ton score :<b id="score"></b><div id="bravo"></div>
    <button id="rejouer">Rejouer</button>
  </div>
</div>
<script>
const QUESTIONS = [
  { question: 'Quelle est la plus grande planète du système solaire ?', choix: ['Mars', 'Jupiter', 'Saturne', 'La Terre'], bonne: 1 },
  { question: 'Quelle planète est la plus proche du Soleil ?', choix: ['Mercure', 'Vénus', 'Mars', 'Neptune'], bonne: 0 },
  { question: 'Combien y a-t-il de planètes dans le système solaire ?', choix: ['7', '8', '9', '10'], bonne: 1 },
  { question: 'Quelle planète est surnommée la planète rouge ?', choix: ['Jupiter', 'Vénus', 'Mars', 'Uranus'], bonne: 2 },
  { question: 'Quelle planète a les anneaux les plus visibles ?', choix: ['Saturne', 'Mercure', 'La Terre', 'Mars'], bonne: 0 }
];
let numero, score;

function afficherQuestion() {
  const q = QUESTIONS[numero];
  document.getElementById('progression').textContent = 'Question ' + (numero + 1) + ' sur ' + QUESTIONS.length;
  document.getElementById('question').textContent = q.question;
  const zone = document.getElementById('choix');
  zone.innerHTML = '';
  q.choix.forEach((texte, i) => {
    const b = document.createElement('button');
    b.textContent = texte;
    b.addEventListener('click', () => repondre(i));
    zone.appendChild(b);
  });
  document.getElementById('suivant').classList.add('cache');
}

function repondre(i) {
  const q = QUESTIONS[numero];
  const boutons = document.querySelectorAll('#choix button');
  boutons.forEach(b => { b.disabled = true; });
  boutons[q.bonne].classList.add('bonne');
  if (i === q.bonne) score++;
  else boutons[i].classList.add('fausse');
  document.getElementById('suivant').classList.remove('cache');
}

function suivant() {
  numero++;
  if (numero < QUESTIONS.length) return afficherQuestion();
  document.getElementById('zone-question').classList.add('cache');
  document.getElementById('zone-resultat').classList.remove('cache');
  document.getElementById('score').textContent = score + ' / ' + QUESTIONS.length;
  document.getElementById('bravo').textContent = score === QUESTIONS.length ? 'Parfait ! 🚀' : score >= 3 ? 'Bien joué ! 👏' : 'Tu feras mieux la prochaine fois 💪';
}

function commencer() {
  numero = 0;
  score = 0;
  document.getElementById('zone-question').classList.remove('cache');
  document.getElementById('zone-resultat').classList.add('cache');
  afficherQuestion();
}

document.getElementById('suivant').addEventListener('click', suivant);
document.getElementById('rejouer').addEventListener('click', commencer);
commencer();
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'calculatrice', type: 'exemple', titre: 'Calculatrice',
  mots: ['calculatrice', 'calculette', 'calculer', 'calcul', 'operations'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Calculatrice</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0f172a; font-family: system-ui, sans-serif; }
  .calc { width: 300px; padding: 18px; border-radius: 24px; background: #1e293b; box-shadow: 0 20px 40px rgba(0,0,0,.4); }
  .ecran { height: 70px; margin-bottom: 14px; padding: 0 14px; border-radius: 14px; background: #0b1220; color: #f8fafc; font-size: 34px; display: flex; align-items: center; justify-content: flex-end; overflow: hidden; }
  .touches { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  button { height: 58px; font: inherit; font-size: 22px; font-weight: 600; border: 0; border-radius: 14px; background: #334155; color: #f8fafc; cursor: pointer; }
  button:active { transform: scale(.96); }
  .op { background: #f59e0b; color: #1e293b; }
  .efface { background: #ef4444; }
  .egal { background: #22c55e; color: #0f172a; }
  .zero { grid-column: span 2; }
</style>
</head>
<body>
<div class="calc">
  <div class="ecran" id="ecran">0</div>
  <div class="touches">
    <button class="efface" data-t="C">C</button><button data-t="⌫">⌫</button><button class="op" data-t="%">%</button><button class="op" data-t="÷">÷</button>
    <button data-t="7">7</button><button data-t="8">8</button><button data-t="9">9</button><button class="op" data-t="×">×</button>
    <button data-t="4">4</button><button data-t="5">5</button><button data-t="6">6</button><button class="op" data-t="−">−</button>
    <button data-t="1">1</button><button data-t="2">2</button><button data-t="3">3</button><button class="op" data-t="+">+</button>
    <button class="zero" data-t="0">0</button><button data-t=".">.</button><button class="egal" data-t="=">=</button>
  </div>
</div>
<script>
const ecran = document.getElementById('ecran');
let expression = '';

function afficher() {
  ecran.textContent = expression || '0';
}

function calculer() {
  const propre = expression.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/%/g, '/100');
  if (!/^[0-9+\\-*/.() ]+$/.test(propre)) return;
  try {
    const resultat = Function('"use strict"; return (' + propre + ')')();
    expression = Number.isFinite(resultat) ? String(Math.round(resultat * 1e10) / 1e10) : '';
    ecran.textContent = expression || 'Erreur';
  } catch (e) {
    ecran.textContent = 'Erreur';
    expression = '';
  }
}

function appuyer(t) {
  if (t === 'C') expression = '';
  else if (t === '⌫') expression = expression.slice(0, -1);
  else if (t === '=') return calculer();
  else expression += t;
  afficher();
}

document.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => appuyer(b.dataset.t)));
document.addEventListener('keydown', e => {
  const touches = { '*': '×', '/': '÷', '-': '−', '+': '+', Enter: '=', '=': '=', Backspace: '⌫', Escape: 'C', '.': '.', ',': '.', '%': '%' };
  if (/^[0-9]$/.test(e.key)) appuyer(e.key);
  else if (touches[e.key]) { e.preventDefault(); appuyer(touches[e.key]); }
});
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'compte-a-rebours', type: 'exemple', titre: 'Compte à rebours (style festival 2K27)',
  mots: ['compte a rebours', 'rebours', 'countdown', 'decompte', 'combien de jours', 'jours restants', 'avant le festival'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Compte à rebours</title>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@500;700&display=swap" rel="stylesheet">
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: radial-gradient(circle at 50% 0%, #1b1036, #0a0a14 70%); color: #e8e8f5; font-family: 'Rajdhani', sans-serif; text-align: center; }
  main { padding: 16px; }
  h1 { font-family: 'Orbitron', sans-serif; font-size: clamp(28px, 7vw, 56px); margin: 0; background: linear-gradient(90deg, #22e8ff, #b026ff, #ff2e88); -webkit-background-clip: text; background-clip: text; color: transparent; }
  p { color: #9494b0; font-size: 20px; margin: 8px 0 28px; }
  .compteur { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
  .bloc { width: 110px; padding: 16px 0; border-radius: 16px; background: rgba(255,255,255,.04); border: 1px solid rgba(176,38,255,.5); box-shadow: 0 0 24px rgba(176,38,255,.25); }
  .bloc b { display: block; font-family: 'Orbitron', sans-serif; font-size: 44px; color: #22e8ff; text-shadow: 0 0 12px rgba(34,232,255,.6); }
  .bloc span { text-transform: uppercase; letter-spacing: .1em; }
  #fin { display: none; font-family: 'Orbitron', sans-serif; font-size: 32px; color: #ff2e88; }
</style>
</head>
<body>
<main>
  <h1>GAMING TOUSSAINT</h1>
  <p>Mardi 20 et mercredi 21 octobre 2026 · Halle du Centre Culturel de Cestas</p>
  <div class="compteur" id="compteur">
    <div class="bloc"><b id="jours">00</b><span>jours</span></div>
    <div class="bloc"><b id="heures">00</b><span>heures</span></div>
    <div class="bloc"><b id="minutes">00</b><span>minutes</span></div>
    <div class="bloc"><b id="secondes">00</b><span>secondes</span></div>
  </div>
  <div id="fin">C'est parti ! 🎮</div>
</main>
<script>
const CIBLE = new Date('2026-10-20T10:00:00');
const deux = n => String(n).padStart(2, '0');

function mettreAJour() {
  const reste = CIBLE - new Date();
  if (reste <= 0) {
    document.getElementById('compteur').style.display = 'none';
    document.getElementById('fin').style.display = 'block';
    clearInterval(minuteur);
    return;
  }
  document.getElementById('jours').textContent = deux(Math.floor(reste / 86400000));
  document.getElementById('heures').textContent = deux(Math.floor(reste / 3600000) % 24);
  document.getElementById('minutes').textContent = deux(Math.floor(reste / 60000) % 60);
  document.getElementById('secondes').textContent = deux(Math.floor(reste / 1000) % 60);
}

const minuteur = setInterval(mettreAJour, 1000);
mettreAJour();
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'chronometre', type: 'exemple', titre: 'Chronomètre avec tours',
  mots: ['chronometre', 'chrono', 'stopwatch', 'minuteur', 'temps de jeu', 'mesurer le temps', 'tours'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Chronomètre</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #111827; color: #f9fafb; font-family: system-ui, sans-serif; }
  .chrono { text-align: center; padding: 16px; }
  #temps { font-size: clamp(48px, 14vw, 96px); font-weight: 800; font-variant-numeric: tabular-nums; margin-bottom: 20px; }
  .boutons { display: flex; gap: 12px; justify-content: center; }
  button { font: inherit; font-size: 18px; font-weight: 700; padding: 12px 22px; border: 0; border-radius: 999px; cursor: pointer; }
  #lancer { background: #22c55e; color: #052e16; min-width: 120px; }
  #lancer.pause { background: #f59e0b; }
  #tour { background: #3b82f6; color: #fff; }
  #zero { background: #374151; color: #fff; }
  ol { list-style: none; padding: 0; margin: 20px auto 0; max-width: 280px; max-height: 240px; overflow: auto; font-variant-numeric: tabular-nums; }
  li { display: flex; justify-content: space-between; padding: 8px 4px; border-bottom: 1px solid #374151; }
</style>
</head>
<body>
<div class="chrono">
  <div id="temps">00:00.00</div>
  <div class="boutons">
    <button id="lancer">Démarrer</button>
    <button id="tour">Tour</button>
    <button id="zero">Remise à zéro</button>
  </div>
  <ol id="tours"></ol>
</div>
<script>
let depart = 0;
let accumule = 0;
let enMarche = false;
let minuteur = null;
const deux = n => String(n).padStart(2, '0');

function format(ms) {
  const minutes = Math.floor(ms / 60000);
  const secondes = Math.floor(ms / 1000) % 60;
  const centiemes = Math.floor(ms / 10) % 100;
  return deux(minutes) + ':' + deux(secondes) + '.' + deux(centiemes);
}

function tempsActuel() {
  return accumule + (enMarche ? Date.now() - depart : 0);
}

function afficher() {
  document.getElementById('temps').textContent = format(tempsActuel());
}

function lancerOuPause() {
  const bouton = document.getElementById('lancer');
  if (enMarche) {
    accumule += Date.now() - depart;
    enMarche = false;
    clearInterval(minuteur);
    bouton.textContent = 'Reprendre';
    bouton.classList.remove('pause');
  } else {
    depart = Date.now();
    enMarche = true;
    minuteur = setInterval(afficher, 30);
    bouton.textContent = 'Pause';
    bouton.classList.add('pause');
  }
  afficher();
}

function ajouterTour() {
  if (!enMarche) return;
  const liste = document.getElementById('tours');
  const li = document.createElement('li');
  li.innerHTML = '<span>Tour ' + (liste.children.length + 1) + '</span><b>' + format(tempsActuel()) + '</b>';
  liste.prepend(li);
}

function remettreAZero() {
  clearInterval(minuteur);
  enMarche = false;
  accumule = 0;
  document.getElementById('tours').innerHTML = '';
  const bouton = document.getElementById('lancer');
  bouton.textContent = 'Démarrer';
  bouton.classList.remove('pause');
  afficher();
}

document.getElementById('lancer').addEventListener('click', lancerOuPause);
document.getElementById('tour').addEventListener('click', ajouterTour);
document.getElementById('zero').addEventListener('click', remettreAZero);
document.addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); lancerOuPause(); } });
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'memory', type: 'exemple', titre: 'Jeu de memory (paires)',
  mots: ['memory', 'memoire', 'paires', 'cartes retournees', 'retourner les cartes', 'jeu de cartes'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Memory</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #fdf2f8; color: #500724; font-family: system-ui, sans-serif; }
  .jeu { text-align: center; padding: 16px; }
  h1 { margin: 0 0 6px; }
  .infos { margin-bottom: 12px; font-weight: 700; }
  .grille { display: grid; grid-template-columns: repeat(4, 76px); gap: 10px; justify-content: center; }
  .carte { width: 76px; height: 76px; font-size: 38px; border: 0; border-radius: 14px; background: #db2777; color: transparent; cursor: pointer; transition: transform .2s, background .2s; }
  .carte.visible, .carte.trouvee { background: #fff; color: inherit; transform: rotateY(180deg); box-shadow: 0 4px 12px rgba(0,0,0,.1); }
  .carte.trouvee { background: #dcfce7; }
  #message { min-height: 28px; margin-top: 12px; font-weight: 700; }
  #rejouer { font: inherit; font-weight: 700; font-size: 17px; margin-top: 8px; padding: 10px 22px; border: 0; border-radius: 12px; background: #500724; color: #fff; cursor: pointer; }
</style>
</head>
<body>
<div class="jeu">
  <h1>Memory</h1>
  <div class="infos">Coups : <span id="coups">0</span></div>
  <div class="grille" id="grille"></div>
  <div id="message"></div>
  <button id="rejouer">Rejouer</button>
</div>
<script>
const EMOJIS = ['🍕', '🎮', '🚀', '🐱', '⚽', '🎸', '🌈', '🍩'];
let cartes, retournees, trouvees, coups, bloque;

function melanger(tableau) {
  for (let i = tableau.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tableau[i], tableau[j]] = [tableau[j], tableau[i]];
  }
  return tableau;
}

function nouvellePartie() {
  cartes = melanger(EMOJIS.concat(EMOJIS));
  retournees = [];
  trouvees = 0;
  coups = 0;
  bloque = false;
  document.getElementById('coups').textContent = coups;
  document.getElementById('message').textContent = '';
  const grille = document.getElementById('grille');
  grille.innerHTML = '';
  cartes.forEach((emoji, i) => {
    const b = document.createElement('button');
    b.className = 'carte';
    b.textContent = emoji;
    b.addEventListener('click', () => retourner(i, b));
    grille.appendChild(b);
  });
}

function retourner(i, bouton) {
  if (bloque || bouton.classList.contains('visible') || bouton.classList.contains('trouvee')) return;
  bouton.classList.add('visible');
  retournees.push({ i, bouton });
  if (retournees.length < 2) return;
  coups++;
  document.getElementById('coups').textContent = coups;
  const [a, b] = retournees;
  if (cartes[a.i] === cartes[b.i]) {
    a.bouton.classList.add('trouvee');
    b.bouton.classList.add('trouvee');
    retournees = [];
    trouvees++;
    if (trouvees === EMOJIS.length) document.getElementById('message').textContent = 'Bravo ! Gagné en ' + coups + ' coups 🎉';
  } else {
    bloque = true;
    setTimeout(() => {
      a.bouton.classList.remove('visible');
      b.bouton.classList.remove('visible');
      retournees = [];
      bloque = false;
    }, 800);
  }
}

document.getElementById('rejouer').addEventListener('click', nouvellePartie);
nouvellePartie();
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'casse-briques', type: 'exemple', titre: 'Casse-briques',
  mots: ['casse-briques', 'casse briques', 'casse-brique', 'breakout', 'briques', 'raquette', 'balle', 'pong', 'arkanoid'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Casse-briques</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0c0a1d; color: #fff; font-family: system-ui, sans-serif; }
  .jeu { text-align: center; padding: 12px; }
  canvas { background: #17153b; border-radius: 12px; width: min(480px, 94vw); touch-action: none; display: block; }
  .aide { opacity: .7; margin: 8px 0; }
  button { font: inherit; font-weight: 700; font-size: 17px; padding: 10px 22px; border: 0; border-radius: 12px; background: #7c3aed; color: #fff; cursor: pointer; }
</style>
</head>
<body>
<div class="jeu">
  <canvas id="jeu" width="480" height="320"></canvas>
  <p class="aide">Souris, doigt ou flèches ⬅️ ➡️ pour bouger la raquette</p>
  <button id="rejouer">Rejouer</button>
</div>
<script>
const canvas = document.getElementById('jeu');
const ctx = canvas.getContext('2d');
const LIGNES = 4, COLONNES = 7, LB = 58, HB = 18, ESPACE = 8, HAUT = 40;
const GAUCHE = (canvas.width - (COLONNES * (LB + ESPACE) - ESPACE)) / 2;
const COULEURS = ['#f43f5e', '#f59e0b', '#22c55e', '#38bdf8'];
const raquette = { l: 80, h: 10, x: 200 };
const touches = {};
let balle, briques, score, vies, etat;

function nouvelleBalle() {
  balle = { x: canvas.width / 2, y: canvas.height - 40, r: 7, dx: 3 * (Math.random() < 0.5 ? -1 : 1), dy: -3 };
}

function nouvellePartie() {
  briques = [];
  for (let l = 0; l < LIGNES; l++) {
    for (let c = 0; c < COLONNES; c++) {
      briques.push({ x: GAUCHE + c * (LB + ESPACE), y: HAUT + l * (HB + ESPACE), couleur: COULEURS[l], vivante: true });
    }
  }
  score = 0;
  vies = 3;
  etat = 'jeu';
  raquette.x = (canvas.width - raquette.l) / 2;
  nouvelleBalle();
}

function mettreAJour() {
  if (touches.ArrowLeft) raquette.x -= 7;
  if (touches.ArrowRight) raquette.x += 7;
  raquette.x = Math.max(0, Math.min(canvas.width - raquette.l, raquette.x));
  if (etat !== 'jeu') return;
  balle.x += balle.dx;
  balle.y += balle.dy;
  if (balle.x < balle.r || balle.x > canvas.width - balle.r) balle.dx = -balle.dx;
  if (balle.y < balle.r) balle.dy = -balle.dy;
  const yRaquette = canvas.height - 20;
  if (balle.dy > 0 && balle.y + balle.r >= yRaquette && balle.y < yRaquette + raquette.h && balle.x > raquette.x && balle.x < raquette.x + raquette.l) {
    const impact = (balle.x - (raquette.x + raquette.l / 2)) / (raquette.l / 2);
    balle.dx = impact * 5;
    balle.dy = -Math.abs(balle.dy);
  }
  for (const b of briques) {
    if (b.vivante && balle.x > b.x && balle.x < b.x + LB && balle.y - balle.r < b.y + HB && balle.y + balle.r > b.y) {
      b.vivante = false;
      balle.dy = -balle.dy;
      score += 10;
      break;
    }
  }
  if (briques.every(b => !b.vivante)) etat = 'gagne';
  if (balle.y > canvas.height + balle.r) {
    vies--;
    if (vies <= 0) etat = 'perdu';
    else nouvelleBalle();
  }
}

function dessiner() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const b of briques) {
    if (!b.vivante) continue;
    ctx.fillStyle = b.couleur;
    ctx.fillRect(b.x, b.y, LB, HB);
  }
  ctx.fillStyle = '#a78bfa';
  ctx.fillRect(raquette.x, canvas.height - 20, raquette.l, raquette.h);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(balle.x, balle.y, balle.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = 'bold 16px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText('Score : ' + score, 10, 22);
  ctx.textAlign = 'right';
  ctx.fillText('Vies : ' + '❤️'.repeat(vies), canvas.width - 10, 22);
  if (etat !== 'jeu') {
    ctx.fillStyle = 'rgba(0,0,0,.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 32px system-ui';
    ctx.fillText(etat === 'gagne' ? 'Gagné ! 🎉' : 'Perdu !', canvas.width / 2, canvas.height / 2);
  }
}

function boucle() {
  mettreAJour();
  dessiner();
  requestAnimationFrame(boucle);
}

function suivreDoigt(clientX) {
  const rect = canvas.getBoundingClientRect();
  raquette.x = (clientX - rect.left) * (canvas.width / rect.width) - raquette.l / 2;
}

canvas.addEventListener('mousemove', e => suivreDoigt(e.clientX));
canvas.addEventListener('touchmove', e => { e.preventDefault(); suivreDoigt(e.touches[0].clientX); }, { passive: false });
document.addEventListener('keydown', e => { touches[e.key] = true; });
document.addEventListener('keyup', e => { touches[e.key] = false; });
document.getElementById('rejouer').addEventListener('click', nouvellePartie);
nouvellePartie();
boucle();
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'clicker', type: 'exemple', titre: 'Jeu clicker avec améliorations',
  mots: ['clicker', 'cookie', 'clique', 'cliquer', 'idle', 'ameliorations', 'amelioration'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cookie Clicker</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #fff7ed; color: #431407; font-family: system-ui, sans-serif; text-align: center; }
  .jeu { padding: 16px; }
  #total { font-size: 42px; font-weight: 800; }
  #rythme { opacity: .7; margin-bottom: 14px; }
  #cookie { font-size: 120px; background: none; border: 0; cursor: pointer; transition: transform .08s; }
  #cookie:active { transform: scale(.9); }
  .boutique { display: grid; gap: 10px; margin-top: 12px; }
  .boutique button { font: inherit; font-size: 16px; padding: 12px 16px; border: 0; border-radius: 14px; background: #fb923c; color: #fff; font-weight: 700; cursor: pointer; }
  .boutique button:disabled { background: #fed7aa; color: #9a3412; cursor: default; }
  #recommencer { margin-top: 16px; font: inherit; border: 0; background: none; color: #9a3412; text-decoration: underline; cursor: pointer; }
</style>
</head>
<body>
<div class="jeu">
  <div id="total">0 🍪</div>
  <div id="rythme">0 par seconde</div>
  <button id="cookie" aria-label="Cliquer sur le cookie">🍪</button>
  <div class="boutique">
    <button id="acheter-clic"></button>
    <button id="acheter-robot"></button>
  </div>
  <button id="recommencer">Tout recommencer</button>
</div>
<script>
const DEPART = { cookies: 0, parClic: 1, parSeconde: 0, prixClic: 10, prixRobot: 25 };
let jeu;
try { jeu = JSON.parse(localStorage.getItem('clicker')) || { ...DEPART }; } catch (e) { jeu = { ...DEPART }; }

function sauver() {
  localStorage.setItem('clicker', JSON.stringify(jeu));
}

function afficher() {
  document.getElementById('total').textContent = Math.floor(jeu.cookies) + ' 🍪';
  document.getElementById('rythme').textContent = jeu.parSeconde + ' par seconde · ' + jeu.parClic + ' par clic';
  const clic = document.getElementById('acheter-clic');
  clic.textContent = 'Clic doré (+1 par clic) · ' + jeu.prixClic + ' 🍪';
  clic.disabled = jeu.cookies < jeu.prixClic;
  const robot = document.getElementById('acheter-robot');
  robot.textContent = 'Mini-robot (+1 par seconde) · ' + jeu.prixRobot + ' 🍪';
  robot.disabled = jeu.cookies < jeu.prixRobot;
}

document.getElementById('cookie').addEventListener('click', () => {
  jeu.cookies += jeu.parClic;
  afficher();
});
document.getElementById('acheter-clic').addEventListener('click', () => {
  if (jeu.cookies < jeu.prixClic) return;
  jeu.cookies -= jeu.prixClic;
  jeu.parClic++;
  jeu.prixClic = Math.ceil(jeu.prixClic * 1.5);
  afficher();
  sauver();
});
document.getElementById('acheter-robot').addEventListener('click', () => {
  if (jeu.cookies < jeu.prixRobot) return;
  jeu.cookies -= jeu.prixRobot;
  jeu.parSeconde++;
  jeu.prixRobot = Math.ceil(jeu.prixRobot * 1.6);
  afficher();
  sauver();
});
document.getElementById('recommencer').addEventListener('click', () => {
  if (!confirm('Tout recommencer ?')) return;
  jeu = { ...DEPART };
  afficher();
  sauver();
});
setInterval(() => {
  jeu.cookies += jeu.parSeconde;
  afficher();
  sauver();
}, 1000);
afficher();
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'taches', type: 'exemple', titre: 'Liste de tâches sauvegardée',
  mots: ['liste de taches', 'taches', 'todo', 'to-do', 'to do', 'liste de choses', 'devoirs a faire', 'pense-bete', 'liste de courses'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mes tâches</title>
<style>
  body { margin: 0; min-height: 100vh; background: #eef2ff; color: #1e1b4b; font-family: system-ui, sans-serif; display: flex; justify-content: center; }
  .carte { width: min(460px, 92vw); margin-top: 40px; align-self: flex-start; background: #fff; border-radius: 20px; padding: 22px; box-shadow: 0 16px 40px rgba(30,27,75,.12); }
  h1 { margin: 0 0 14px; }
  form { display: flex; gap: 8px; }
  input { flex: 1; font: inherit; padding: 12px 14px; border: 2px solid #c7d2fe; border-radius: 12px; }
  input:focus { outline: none; border-color: #6366f1; }
  button { font: inherit; font-weight: 700; border: 0; border-radius: 12px; cursor: pointer; }
  form button { padding: 0 18px; background: #6366f1; color: #fff; }
  ul { list-style: none; padding: 0; margin: 16px 0 0; }
  li { display: flex; align-items: center; gap: 10px; padding: 10px 4px; border-bottom: 1px solid #e0e7ff; }
  li span { flex: 1; overflow-wrap: anywhere; }
  li.faite span { text-decoration: line-through; opacity: .5; }
  li input { flex: none; width: 20px; height: 20px; accent-color: #6366f1; }
  .suppr { background: none; font-size: 18px; }
  .bas { margin-top: 12px; font-size: 14px; opacity: .7; }
</style>
</head>
<body>
<div class="carte">
  <h1>📝 Mes tâches</h1>
  <form id="formulaire">
    <input id="nouvelle" placeholder="Ajouter une tâche…" autocomplete="off">
    <button type="submit">Ajouter</button>
  </form>
  <ul id="liste"></ul>
  <div class="bas" id="compte"></div>
</div>
<script>
let taches;
try { taches = JSON.parse(localStorage.getItem('taches')) || []; } catch (e) { taches = []; }

function sauver() {
  localStorage.setItem('taches', JSON.stringify(taches));
}

function afficher() {
  const liste = document.getElementById('liste');
  liste.innerHTML = '';
  taches.forEach((t, i) => {
    const li = document.createElement('li');
    if (t.faite) li.className = 'faite';
    const coche = document.createElement('input');
    coche.type = 'checkbox';
    coche.checked = t.faite;
    coche.addEventListener('change', () => { t.faite = coche.checked; sauver(); afficher(); });
    const texte = document.createElement('span');
    texte.textContent = t.texte;
    const suppr = document.createElement('button');
    suppr.className = 'suppr';
    suppr.textContent = '🗑️';
    suppr.setAttribute('aria-label', 'Supprimer');
    suppr.addEventListener('click', () => { taches.splice(i, 1); sauver(); afficher(); });
    li.append(coche, texte, suppr);
    liste.appendChild(li);
  });
  const restantes = taches.filter(t => !t.faite).length;
  document.getElementById('compte').textContent = restantes + ' tâche' + (restantes > 1 ? 's' : '') + ' à faire';
}

document.getElementById('formulaire').addEventListener('submit', e => {
  e.preventDefault();
  const champ = document.getElementById('nouvelle');
  const texte = champ.value.trim();
  if (!texte) return;
  taches.push({ texte, faite: false });
  champ.value = '';
  sauver();
  afficher();
});
afficher();
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'pierre-feuille-ciseaux', type: 'exemple', titre: 'Pierre, feuille, ciseaux',
  mots: ['pierre feuille ciseaux', 'pierre-feuille-ciseaux', 'chifoumi', 'shifumi', 'pierre, feuille'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Chifoumi</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #ecfeff; color: #164e63; font-family: system-ui, sans-serif; text-align: center; }
  .jeu { padding: 16px; }
  .choix { display: flex; gap: 12px; justify-content: center; margin: 16px 0; }
  .choix button { font-size: 52px; width: 96px; height: 96px; border: 0; border-radius: 22px; background: #fff; box-shadow: 0 6px 16px rgba(0,0,0,.1); cursor: pointer; transition: transform .1s; }
  .choix button:hover { transform: translateY(-4px); }
  #duel { font-size: 60px; min-height: 76px; }
  #resultat { font-size: 22px; font-weight: 800; min-height: 32px; }
  .scores { display: flex; gap: 24px; justify-content: center; font-weight: 700; margin-top: 12px; }
</style>
</head>
<body>
<div class="jeu">
  <h1>Pierre, feuille, ciseaux</h1>
  <div class="choix">
    <button data-coup="pierre" aria-label="Pierre">✊</button>
    <button data-coup="feuille" aria-label="Feuille">✋</button>
    <button data-coup="ciseaux" aria-label="Ciseaux">✌️</button>
  </div>
  <div id="duel">❔</div>
  <div id="resultat">Choisis ton coup !</div>
  <div class="scores"><span>Toi : <b id="s-toi">0</b></span><span>Ordi : <b id="s-ordi">0</b></span></div>
</div>
<script>
const EMOJI = { pierre: '✊', feuille: '✋', ciseaux: '✌️' };
const BAT = { pierre: 'ciseaux', feuille: 'pierre', ciseaux: 'feuille' };
const scores = { toi: 0, ordi: 0 };

function jouer(moi) {
  const coups = Object.keys(EMOJI);
  const ordi = coups[Math.floor(Math.random() * coups.length)];
  document.getElementById('duel').textContent = EMOJI[moi] + ' contre ' + EMOJI[ordi];
  let texte;
  if (moi === ordi) texte = 'Égalité !';
  else if (BAT[moi] === ordi) { texte = 'Gagné ! 🎉'; scores.toi++; }
  else { texte = 'Perdu…'; scores.ordi++; }
  document.getElementById('resultat').textContent = texte;
  document.getElementById('s-toi').textContent = scores.toi;
  document.getElementById('s-ordi').textContent = scores.ordi;
}

document.querySelectorAll('[data-coup]').forEach(b => b.addEventListener('click', () => jouer(b.dataset.coup)));
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'devine-nombre', type: 'exemple', titre: 'Devine le nombre',
  mots: ['devine le nombre', 'deviner un nombre', 'nombre mystere', 'plus ou moins', 'juste prix', 'devinette nombre'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Devine le nombre</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: linear-gradient(135deg, #0f766e, #1e3a8a); color: #fff; font-family: system-ui, sans-serif; text-align: center; }
  .carte { width: min(420px, 92vw); padding: 26px; border-radius: 22px; background: rgba(255,255,255,.12); }
  form { display: flex; gap: 8px; justify-content: center; margin: 16px 0; }
  input { width: 110px; font: inherit; font-size: 24px; text-align: center; padding: 10px; border: 0; border-radius: 12px; }
  button { font: inherit; font-weight: 700; font-size: 18px; padding: 10px 18px; border: 0; border-radius: 12px; background: #fbbf24; color: #1e3a8a; cursor: pointer; }
  #indice { font-size: 22px; font-weight: 800; min-height: 32px; }
  #essais { opacity: .8; margin-top: 6px; }
  #rejouer { display: none; margin-top: 14px; }
</style>
</head>
<body>
<div class="carte">
  <h1>🔢 Devine le nombre</h1>
  <p>J'ai choisi un nombre entre 1 et 100.</p>
  <form id="formulaire">
    <input id="proposition" type="number" min="1" max="100" required>
    <button type="submit">Essayer</button>
  </form>
  <div id="indice"></div>
  <div id="essais"></div>
  <button id="rejouer">Rejouer</button>
</div>
<script>
let secret, essais;

function nouvellePartie() {
  secret = Math.floor(Math.random() * 100) + 1;
  essais = 0;
  document.getElementById('indice').textContent = '';
  document.getElementById('essais').textContent = '';
  document.getElementById('rejouer').style.display = 'none';
  document.getElementById('proposition').value = '';
  document.getElementById('proposition').focus();
}

document.getElementById('formulaire').addEventListener('submit', e => {
  e.preventDefault();
  const champ = document.getElementById('proposition');
  const nombre = Number(champ.value);
  if (!Number.isInteger(nombre) || nombre < 1 || nombre > 100) return;
  essais++;
  const indice = document.getElementById('indice');
  if (nombre < secret) indice.textContent = "C'est plus ! ⬆️";
  else if (nombre > secret) indice.textContent = "C'est moins ! ⬇️";
  else {
    indice.textContent = 'Bravo, c\\'était ' + secret + ' ! 🎉';
    document.getElementById('rejouer').style.display = 'inline-block';
  }
  document.getElementById('essais').textContent = 'Essais : ' + essais;
  champ.value = '';
  champ.focus();
});
document.getElementById('rejouer').addEventListener('click', nouvellePartie);
nouvellePartie();
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'page-festival', type: 'exemple', titre: "Page d'accueil du festival 2K27",
  mots: ['page du festival', "page d'accueil", 'site du festival', 'site pour le festival', 'page pour le festival', 'affiche du festival', 'presentation du festival', 'landing'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Gaming Toussaint · 2K27</title>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@500;600;700&display=swap" rel="stylesheet">
<style>
  :root { --fond: #0a0a14; --fond2: #10101c; --violet: #b026ff; --cyan: #22e8ff; --rose: #ff2e88; --texte: #e8e8f5; --doux: #9494b0; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--fond); color: var(--texte); font-family: 'Rajdhani', sans-serif; font-size: 18px; }
  header { text-align: center; padding: 70px 16px 50px; background: radial-gradient(circle at 50% 0%, rgba(176,38,255,.35), transparent 60%); }
  h1 { font-family: 'Orbitron', sans-serif; font-size: clamp(40px, 10vw, 84px); margin: 0; background: linear-gradient(90deg, var(--cyan), var(--violet), var(--rose)); -webkit-background-clip: text; background-clip: text; color: transparent; }
  header p { color: var(--doux); font-size: 22px; margin: 10px 0 24px; }
  .badge { display: inline-block; padding: 8px 18px; border: 1px solid var(--cyan); border-radius: 999px; color: var(--cyan); font-weight: 700; box-shadow: 0 0 18px rgba(34,232,255,.3); }
  section { max-width: 980px; margin: 0 auto; padding: 36px 16px; }
  h2 { font-family: 'Orbitron', sans-serif; font-size: 26px; color: var(--cyan); margin: 0 0 18px; }
  .grille { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
  .carte { background: var(--fond2); border: 1px solid rgba(255,255,255,.1); border-radius: 16px; padding: 18px; }
  .carte h3 { margin: 0 0 6px; font-size: 20px; }
  .carte p { margin: 0; color: var(--doux); }
  .pegi { display: inline-block; margin-top: 10px; padding: 2px 10px; border-radius: 8px; font-weight: 700; color: #0a0a14; }
  .p3 { background: #2dbe4e; } .p7 { background: #ffd21f; } .p12 { background: #ff8a1c; } .p16 { background: #ff3b3b; }
  .horaires { list-style: none; margin: 0; padding: 0; }
  .horaires li { display: flex; gap: 14px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,.08); }
  .horaires b { color: var(--rose); min-width: 58px; }
  footer { text-align: center; color: var(--doux); padding: 30px 16px 50px; }
  footer a { color: var(--cyan); }
</style>
</head>
<body>
<header>
  <h1>GAMING TOUSSAINT</h1>
  <p>Mardi 20 et mercredi 21 octobre 2026 · Halle du Centre Culturel de Cestas</p>
  <span class="badge">Gratuit · 10h – 16h · Goûter offert</span>
</header>
<section>
  <h2>Les jeux</h2>
  <div class="grille">
    <div class="carte"><h3>🏁 Tournoi Mario Kart</h3><p>Sélections le matin, finale sur l'écran géant du cinéma.</p><span class="pegi p3">PEGI 3</span></div>
    <div class="carte"><h3>🖥️ PC en réseau</h3><p>Fortnite sur 10 postes reliés en local.</p><span class="pegi p12">PEGI 12</span></div>
    <div class="carte"><h3>🥊 Smash Bros</h3><p>Super Smash Bros. Ultimate sur TV.</p><span class="pegi p12">PEGI 12</span></div>
    <div class="carte"><h3>💃 Scène Just Dance</h3><p>Danse, Kahoot géant et remise des prix.</p><span class="pegi p3">PEGI 3</span></div>
    <div class="carte"><h3>⚽ FIFA</h3><p>Sur PS4, projeté en grand.</p><span class="pegi p3">PEGI 3</span></div>
    <div class="carte"><h3>🎯 Espace Valorant</h3><p>Espace fermé réservé aux 16 ans et plus.</p><span class="pegi p16">PEGI 16</span></div>
  </div>
</section>
<section>
  <h2>Le programme</h2>
  <div class="grille">
    <div class="carte"><h3>Mardi 20</h3><ul class="horaires">
      <li><b>10h00</b>Accueil et badges PEGI</li><li><b>10h15</b>Mot du Maire</li><li><b>10h30</b>Sélections Mario</li>
      <li><b>12h40</b>Finale Mario au cinéma</li><li><b>14h15</b>Rotations dans les espaces</li><li><b>15h40</b>Goûter et Kahoot géant</li></ul></div>
    <div class="carte"><h3>Mercredi 21</h3><ul class="horaires">
      <li><b>10h00</b>Accueil et badges PEGI</li><li><b>10h30</b>Sélections Mario</li><li><b>12h40</b>Finale Mario au cinéma</li>
      <li><b>15h05</b>Finales des tournois découverte</li><li><b>15h40</b>Goûter et remise des prix</li><li><b>20h30</b>Ready Player One en 3D</li></ul></div>
  </div>
</section>
<footer>
  Organisé par les jeunes de l'ATEC Gaming Interco 2K27 et le SAJ de Cestas<br>
  Contact : 06 81 39 63 67 · <a href="mailto:saj@mairie-cestas.fr">saj@mairie-cestas.fr</a>
</footer>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'tableau-scores', type: 'exemple', titre: 'Tableau des scores de tournoi',
  mots: ['tableau des scores', 'classement', 'scores', 'tournoi', 'leaderboard', 'points', 'joueurs', 'podium', 'compteur de points'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Classement du tournoi</title>
<style>
  body { margin: 0; min-height: 100vh; background: #0a0a14; color: #e8e8f5; font-family: system-ui, sans-serif; display: flex; justify-content: center; }
  .carte { width: min(560px, 94vw); margin-top: 36px; align-self: flex-start; }
  h1 { color: #22e8ff; margin: 0 0 14px; }
  form { display: flex; gap: 8px; margin-bottom: 16px; }
  input { flex: 1; font: inherit; padding: 12px 14px; border-radius: 12px; border: 1px solid #3a3a55; background: #15152a; color: inherit; }
  button { font: inherit; font-weight: 700; border: 0; border-radius: 10px; cursor: pointer; }
  form button { padding: 0 18px; background: #b026ff; color: #fff; }
  ol { list-style: none; padding: 0; margin: 0; }
  li { display: flex; align-items: center; gap: 10px; padding: 12px; margin-bottom: 8px; border-radius: 14px; background: #15152a; }
  .rang { width: 34px; font-size: 22px; text-align: center; }
  .nom { flex: 1; font-weight: 700; overflow-wrap: anywhere; }
  .points { min-width: 56px; text-align: right; font-size: 22px; font-weight: 800; color: #ff2e88; }
  .actions button { width: 38px; height: 34px; margin-left: 4px; background: #2a2a45; color: #fff; }
  #vider { margin-top: 12px; padding: 8px 14px; background: none; color: #9494b0; text-decoration: underline; }
</style>
</head>
<body>
<div class="carte">
  <h1>🏆 Classement du tournoi</h1>
  <form id="formulaire">
    <input id="pseudo" placeholder="Pseudo du joueur" maxlength="30" autocomplete="off">
    <button type="submit">Ajouter</button>
  </form>
  <ol id="classement"></ol>
  <button id="vider">Effacer le classement</button>
</div>
<script>
let joueurs;
try { joueurs = JSON.parse(localStorage.getItem('classement')) || []; } catch (e) { joueurs = []; }
const MEDAILLES = ['🥇', '🥈', '🥉'];

function sauver() {
  localStorage.setItem('classement', JSON.stringify(joueurs));
}

function changerPoints(nom, n) {
  const j = joueurs.find(x => x.nom === nom);
  if (!j) return;
  j.points = Math.max(0, j.points + n);
  sauver();
  afficher();
}

function afficher() {
  const liste = document.getElementById('classement');
  liste.innerHTML = '';
  joueurs.slice().sort((a, b) => b.points - a.points).forEach((j, i) => {
    const li = document.createElement('li');
    const rang = document.createElement('span');
    rang.className = 'rang';
    rang.textContent = MEDAILLES[i] || String(i + 1);
    const nom = document.createElement('span');
    nom.className = 'nom';
    nom.textContent = j.nom;
    const points = document.createElement('span');
    points.className = 'points';
    points.textContent = j.points;
    const actions = document.createElement('span');
    actions.className = 'actions';
    [['−1', -1], ['+1', 1], ['+3', 3]].forEach(([texte, n]) => {
      const b = document.createElement('button');
      b.textContent = texte;
      b.addEventListener('click', () => changerPoints(j.nom, n));
      actions.appendChild(b);
    });
    li.append(rang, nom, points, actions);
    liste.appendChild(li);
  });
}

document.getElementById('formulaire').addEventListener('submit', e => {
  e.preventDefault();
  const champ = document.getElementById('pseudo');
  const nom = champ.value.trim();
  if (!nom || joueurs.some(j => j.nom === nom)) return;
  joueurs.push({ nom, points: 0 });
  champ.value = '';
  sauver();
  afficher();
});
document.getElementById('vider').addEventListener('click', () => {
  if (!confirm('Effacer tout le classement ?')) return;
  joueurs = [];
  sauver();
  afficher();
});
afficher();
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'dessin', type: 'exemple', titre: 'Application de dessin',
  mots: ['dessin', 'dessiner', 'paint', 'peinture', 'tableau blanc', 'ardoise', 'crayon', 'coloriage'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mon atelier de dessin</title>
<style>
  body { margin: 0; min-height: 100vh; background: #f5f5f4; font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; }
  .outils { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: center; padding: 12px; }
  .couleur { width: 34px; height: 34px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 0 1px #d6d3d1; cursor: pointer; }
  .couleur.active { box-shadow: 0 0 0 3px #1c1917; }
  button { font: inherit; font-weight: 700; padding: 8px 14px; border: 0; border-radius: 10px; background: #1c1917; color: #fff; cursor: pointer; }
  label { display: flex; align-items: center; gap: 6px; }
  canvas { background: #fff; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,.08); touch-action: none; cursor: crosshair; width: min(760px, 96vw); }
</style>
</head>
<body>
<div class="outils" id="outils">
  <label>Taille <input type="range" id="taille" min="2" max="40" value="6"></label>
  <button id="gomme">Gomme</button>
  <button id="effacer">Tout effacer</button>
  <button id="telecharger">Télécharger</button>
</div>
<canvas id="toile" width="760" height="480"></canvas>
<script>
const COULEURS = ['#1c1917', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
const toile = document.getElementById('toile');
const ctx = toile.getContext('2d');
let couleur = COULEURS[0];
let dessine = false;
let dernier = null;

COULEURS.forEach((c, i) => {
  const pastille = document.createElement('button');
  pastille.className = 'couleur' + (i === 0 ? ' active' : '');
  pastille.style.background = c;
  pastille.setAttribute('aria-label', 'Couleur ' + c);
  pastille.addEventListener('click', () => {
    couleur = c;
    document.querySelectorAll('.couleur').forEach(p => p.classList.remove('active'));
    pastille.classList.add('active');
  });
  document.getElementById('outils').prepend(pastille);
});

function position(e) {
  const r = toile.getBoundingClientRect();
  return { x: (e.clientX - r.left) * (toile.width / r.width), y: (e.clientY - r.top) * (toile.height / r.height) };
}

toile.addEventListener('pointerdown', e => {
  dessine = true;
  dernier = position(e);
  toile.setPointerCapture(e.pointerId);
});
toile.addEventListener('pointermove', e => {
  if (!dessine) return;
  const p = position(e);
  ctx.strokeStyle = couleur;
  ctx.lineWidth = Number(document.getElementById('taille').value);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(dernier.x, dernier.y);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  dernier = p;
});
toile.addEventListener('pointerup', () => { dessine = false; });
toile.addEventListener('pointerleave', () => { dessine = false; });

document.getElementById('gomme').addEventListener('click', () => { couleur = '#ffffff'; });
document.getElementById('effacer').addEventListener('click', () => ctx.clearRect(0, 0, toile.width, toile.height));
document.getElementById('telecharger').addEventListener('click', () => {
  const lien = document.createElement('a');
  lien.download = 'mon-dessin.png';
  lien.href = toile.toDataURL('image/png');
  lien.click();
});
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'esquive', type: 'exemple', titre: "Jeu d'esquive (objets qui tombent)",
  mots: ['esquive', 'esquiver', 'eviter', 'tombent', 'meteorites', 'asteroides', 'obstacles', 'vaisseau', 'jeu d\'arcade', 'course', 'survivre'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pluie de météorites</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #020617; color: #e2e8f0; font-family: system-ui, sans-serif; text-align: center; }
  canvas { background: linear-gradient(#0f172a, #1e1b4b); border-radius: 12px; width: min(420px, 94vw); display: block; margin: 0 auto; }
  .commandes { display: flex; gap: 10px; justify-content: center; margin-top: 10px; }
  button { font: inherit; font-size: 20px; font-weight: 700; padding: 10px 20px; border: 0; border-radius: 12px; background: #334155; color: #fff; cursor: pointer; user-select: none; }
  #rejouer { background: #f97316; font-size: 17px; }
</style>
</head>
<body>
<div>
  <canvas id="jeu" width="420" height="560"></canvas>
  <div class="commandes">
    <button id="gauche">⬅️</button>
    <button id="rejouer">Rejouer</button>
    <button id="droite">➡️</button>
  </div>
</div>
<script>
const canvas = document.getElementById('jeu');
const ctx = canvas.getContext('2d');
const touches = {};
let joueur, meteorites, score, record = 0, enJeu, prochaine;

function nouvellePartie() {
  joueur = { x: canvas.width / 2, y: canvas.height - 50, r: 18 };
  meteorites = [];
  score = 0;
  prochaine = 0;
  enJeu = true;
}

function mettreAJour() {
  if (!enJeu) return;
  if (touches.gauche) joueur.x -= 6;
  if (touches.droite) joueur.x += 6;
  joueur.x = Math.max(joueur.r, Math.min(canvas.width - joueur.r, joueur.x));
  score++;
  prochaine--;
  if (prochaine <= 0) {
    const vitesse = 3 + score / 400;
    meteorites.push({ x: Math.random() * canvas.width, y: -20, r: 10 + Math.random() * 16, v: vitesse + Math.random() * 2 });
    prochaine = Math.max(8, 40 - score / 60);
  }
  for (const m of meteorites) {
    m.y += m.v;
    if (Math.hypot(m.x - joueur.x, m.y - joueur.y) < m.r + joueur.r - 4) {
      enJeu = false;
      record = Math.max(record, Math.floor(score / 10));
    }
  }
  meteorites = meteorites.filter(m => m.y < canvas.height + 40);
}

function dessiner() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = '36px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🚀', joueur.x, joueur.y);
  for (const m of meteorites) {
    ctx.font = (m.r * 2) + 'px system-ui';
    ctx.fillText('☄️', m.x, m.y);
  }
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText('Score : ' + Math.floor(score / 10), 12, 24);
  ctx.textAlign = 'right';
  ctx.fillText('Record : ' + record, canvas.width - 12, 24);
  if (!enJeu) {
    ctx.fillStyle = 'rgba(0,0,0,.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 32px system-ui';
    ctx.fillText('Touché !', canvas.width / 2, canvas.height / 2);
  }
}

function boucle() {
  mettreAJour();
  dessiner();
  requestAnimationFrame(boucle);
}

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft' || e.key === 'q') touches.gauche = true;
  if (e.key === 'ArrowRight' || e.key === 'd') touches.droite = true;
});
document.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft' || e.key === 'q') touches.gauche = false;
  if (e.key === 'ArrowRight' || e.key === 'd') touches.droite = false;
});
['gauche', 'droite'].forEach(sens => {
  const b = document.getElementById(sens);
  b.addEventListener('pointerdown', () => { touches[sens] = true; });
  b.addEventListener('pointerup', () => { touches[sens] = false; });
  b.addEventListener('pointerleave', () => { touches[sens] = false; });
});
document.getElementById('rejouer').addEventListener('click', nouvellePartie);
nouvellePartie();
boucle();
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'formulaire', type: 'exemple', titre: "Formulaire d'inscription avec liste des réponses",
  mots: ['formulaire', 'inscription', 'inscrire', 'reservation', 'reserver', 'questionnaire d\'inscription', 'pre-selection', 'preselection'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Réservation cinéma</title>
<style>
  body { margin: 0; min-height: 100vh; background: #0a0a14; color: #e8e8f5; font-family: system-ui, sans-serif; display: flex; justify-content: center; }
  .carte { width: min(520px, 94vw); margin: 32px 0; align-self: flex-start; background: #12121f; border: 1px solid rgba(255,255,255,.1); border-radius: 20px; padding: 24px; }
  h1 { margin: 0 0 4px; color: #22e8ff; }
  .sous { color: #9494b0; margin: 0 0 18px; }
  label { display: block; font-weight: 700; margin: 12px 0 6px; }
  input, select { width: 100%; box-sizing: border-box; font: inherit; padding: 11px 12px; border-radius: 10px; border: 1px solid #34344f; background: #1a1a2e; color: inherit; }
  .case { display: flex; gap: 8px; align-items: center; font-weight: 400; }
  .case input { width: auto; }
  .erreur { color: #ff6b81; min-height: 22px; margin-top: 10px; }
  button { width: 100%; margin-top: 14px; font: inherit; font-weight: 800; font-size: 17px; padding: 13px; border: 0; border-radius: 12px; background: linear-gradient(90deg, #b026ff, #ff2e88); color: #fff; cursor: pointer; }
  .merci { display: none; text-align: center; font-size: 20px; }
  table { width: 100%; border-collapse: collapse; margin-top: 18px; font-size: 14px; }
  th, td { text-align: left; padding: 6px; border-bottom: 1px solid #2a2a40; }
</style>
</head>
<body>
<div class="carte">
  <h1>🎬 Réserve ta séance</h1>
  <p class="sous">Super Mario Galaxy à 11h · 4,20 € · réservations jusqu'au 9 octobre</p>
  <form id="formulaire" novalidate>
    <label for="prenom">Prénom</label>
    <input id="prenom" autocomplete="given-name" required>
    <label for="structure">Structure</label>
    <select id="structure" required>
      <option value="">Choisis…</option>
      <option>SAJ Cestas</option><option>Parempuyre</option><option>Lanton</option><option>Lège-Cap-Ferret</option><option>Léognan</option>
      <option>Gradignan</option><option>Mios</option><option>ABCS Blanquefort</option><option>Saint-Jean-d'Illac</option><option>Marcheprime</option>
    </select>
    <label for="jour">Jour</label>
    <select id="jour" required>
      <option value="">Choisis…</option>
      <option>Mardi 20 octobre</option>
      <option>Mercredi 21 octobre</option>
    </select>
    <label class="case"><input type="checkbox" id="accord"> Mon responsable légal est d'accord</label>
    <div class="erreur" id="erreur"></div>
    <button type="submit">Réserver</button>
  </form>
  <div class="merci" id="merci">C'est noté, merci ! 🎉</div>
  <table>
    <thead><tr><th>Prénom</th><th>Structure</th><th>Jour</th></tr></thead>
    <tbody id="reponses"></tbody>
  </table>
</div>
<script>
let reponses;
try { reponses = JSON.parse(localStorage.getItem('reservations')) || []; } catch (e) { reponses = []; }

function afficherReponses() {
  const corps = document.getElementById('reponses');
  corps.innerHTML = '';
  reponses.forEach(r => {
    const tr = document.createElement('tr');
    [r.prenom, r.structure, r.jour].forEach(v => {
      const td = document.createElement('td');
      td.textContent = v;
      tr.appendChild(td);
    });
    corps.appendChild(tr);
  });
}

document.getElementById('formulaire').addEventListener('submit', e => {
  e.preventDefault();
  const prenom = document.getElementById('prenom').value.trim();
  const structure = document.getElementById('structure').value;
  const jour = document.getElementById('jour').value;
  const accord = document.getElementById('accord').checked;
  const erreur = document.getElementById('erreur');
  if (!prenom || !structure || !jour) return (erreur.textContent = 'Remplis tous les champs, s\\'il te plaît.');
  if (!accord) return (erreur.textContent = "Il faut l'accord de ton responsable légal.");
  erreur.textContent = '';
  reponses.push({ prenom, structure, jour });
  localStorage.setItem('reservations', JSON.stringify(reponses));
  e.target.reset();
  document.getElementById('merci').style.display = 'block';
  afficherReponses();
});
afficherReponses();
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'flappy', type: 'exemple', titre: "Oiseau volant (façon Flappy Bird)",
  mots: ['flappy', 'oiseau', 'voler', 'tuyaux', 'battre des ailes', 'sauter entre'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Oiseau volant</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0c4a6e; font-family: system-ui, sans-serif; color: #fff; text-align: center; }
  canvas { width: min(360px, 92vw); border-radius: 14px; display: block; touch-action: none; cursor: pointer; }
  p { opacity: .8; }
</style>
</head>
<body>
<div>
  <canvas id="jeu" width="360" height="540"></canvas>
  <p>Espace, flèche du haut, clic ou doigt pour battre des ailes</p>
</div>
<script>
const canvas = document.getElementById('jeu');
const ctx = canvas.getContext('2d');
const LARGEUR_TUYAU = 60, TROU = 150, VITESSE = 2.5;
let oiseau, tuyaux, score, record = 0, etat, images, finA;

function nouvellePartie() {
  oiseau = { x: 90, y: 250, vy: 0, r: 16 };
  tuyaux = [];
  score = 0;
  images = 0;
  etat = 'pret';
}

function battre() {
  if (etat === 'perdu') {
    if (Date.now() - finA > 500) nouvellePartie();
    return;
  }
  etat = 'jeu';
  oiseau.vy = -7.5;
}

function mettreAJour() {
  if (etat !== 'jeu') return;
  images++;
  oiseau.vy += 0.45;
  oiseau.y += oiseau.vy;
  if (images % 90 === 0) {
    tuyaux.push({ x: canvas.width, haut: 60 + Math.random() * (canvas.height - TROU - 160), compte: false });
  }
  for (const t of tuyaux) {
    t.x -= VITESSE;
    if (!t.compte && t.x + LARGEUR_TUYAU < oiseau.x) { t.compte = true; score++; }
    const dansColonne = oiseau.x + oiseau.r > t.x && oiseau.x - oiseau.r < t.x + LARGEUR_TUYAU;
    const horsDuTrou = oiseau.y - oiseau.r < t.haut || oiseau.y + oiseau.r > t.haut + TROU;
    if (dansColonne && horsDuTrou) perdre();
  }
  tuyaux = tuyaux.filter(t => t.x > -LARGEUR_TUYAU);
  if (oiseau.y + oiseau.r > canvas.height - 40 || oiseau.y < 0) perdre();
}

function perdre() {
  if (etat === 'perdu') return;
  etat = 'perdu';
  finA = Date.now();
  record = Math.max(record, score);
}

function dessiner() {
  ctx.fillStyle = '#7dd3fc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#22c55e';
  for (const t of tuyaux) {
    ctx.fillRect(t.x, 0, LARGEUR_TUYAU, t.haut);
    ctx.fillRect(t.x, t.haut + TROU, LARGEUR_TUYAU, canvas.height);
  }
  ctx.fillStyle = '#a16207';
  ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
  ctx.font = '34px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🐤', oiseau.x, oiseau.y);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 40px system-ui';
  ctx.fillText(score, canvas.width / 2, 60);
  ctx.font = 'bold 22px system-ui';
  if (etat === 'pret') ctx.fillText('Touche pour commencer', canvas.width / 2, canvas.height / 2 + 60);
  if (etat === 'perdu') {
    ctx.fillText('Perdu ! Record : ' + record, canvas.width / 2, canvas.height / 2);
    ctx.fillText('Touche pour rejouer', canvas.width / 2, canvas.height / 2 + 34);
  }
}

function boucle() {
  mettreAJour();
  dessiner();
  requestAnimationFrame(boucle);
}

document.addEventListener('keydown', e => {
  if (e.code === 'Space' || e.key === 'ArrowUp') { e.preventDefault(); battre(); }
});
canvas.addEventListener('pointerdown', battre);
nouvellePartie();
boucle();
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'pong', type: 'exemple', titre: 'Pong (contre l\'ordinateur ou à deux)',
  mots: ['pong', 'ping-pong', 'ping pong', 'tennis', 'deux joueurs', '2 joueurs', 'raquettes'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pong</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #111; color: #fff; font-family: system-ui, sans-serif; text-align: center; }
  canvas { background: #000; width: min(640px, 96vw); border-radius: 10px; display: block; margin: 0 auto; touch-action: none; }
  .barre { margin-top: 10px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
  button { font: inherit; font-weight: 700; padding: 8px 16px; border: 0; border-radius: 10px; background: #fff; color: #111; cursor: pointer; }
  p { opacity: .7; }
</style>
</head>
<body>
<div>
  <canvas id="jeu" width="640" height="380"></canvas>
  <div class="barre">
    <button id="mode">Mode : contre l'ordinateur</button>
    <button id="rejouer">Rejouer</button>
  </div>
  <p>Joueur de gauche : Z / S ou le doigt · Joueur de droite : flèches ⬆️ ⬇️ · Premier à 7 points</p>
</div>
<script>
const canvas = document.getElementById('jeu');
const ctx = canvas.getContext('2d');
const HAUTEUR = 80, LARGEUR = 12, GAGNANT = 7;
const touches = {};
let deuxJoueurs = false, gauche, droite, balle, scores, fini;

function servir(vers) {
  balle = { x: canvas.width / 2, y: canvas.height / 2, r: 8, dx: 5 * vers, dy: (Math.random() * 4) - 2 };
}

function nouvellePartie() {
  gauche = { y: canvas.height / 2 - HAUTEUR / 2 };
  droite = { y: canvas.height / 2 - HAUTEUR / 2 };
  scores = [0, 0];
  fini = false;
  servir(Math.random() < 0.5 ? -1 : 1);
}

function limiter(r) {
  r.y = Math.max(0, Math.min(canvas.height - HAUTEUR, r.y));
}

function mettreAJour() {
  if (fini) return;
  if (touches.z) gauche.y -= 7;
  if (touches.s) gauche.y += 7;
  if (deuxJoueurs) {
    if (touches.ArrowUp) droite.y -= 7;
    if (touches.ArrowDown) droite.y += 7;
  } else {
    const cible = balle.y - HAUTEUR / 2;
    droite.y += Math.max(-4.5, Math.min(4.5, cible - droite.y));
  }
  limiter(gauche);
  limiter(droite);
  balle.x += balle.dx;
  balle.y += balle.dy;
  if (balle.y < balle.r || balle.y > canvas.height - balle.r) balle.dy = -balle.dy;
  const toucheRaquette = (r, x) => balle.y > r.y && balle.y < r.y + HAUTEUR && Math.abs(balle.x - x) < balle.r + LARGEUR / 2;
  if (balle.dx < 0 && toucheRaquette(gauche, 20)) {
    balle.dx = -balle.dx * 1.05;
    balle.dy = (balle.y - (gauche.y + HAUTEUR / 2)) / 8;
  }
  if (balle.dx > 0 && toucheRaquette(droite, canvas.width - 20)) {
    balle.dx = -balle.dx * 1.05;
    balle.dy = (balle.y - (droite.y + HAUTEUR / 2)) / 8;
  }
  if (balle.x < 0 || balle.x > canvas.width) {
    const point = balle.x < 0 ? 1 : 0;
    scores[point]++;
    if (scores[point] >= GAGNANT) fini = true;
    else servir(point === 0 ? 1 : -1);
  }
}

function dessiner() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#333';
  for (let y = 0; y < canvas.height; y += 24) ctx.fillRect(canvas.width / 2 - 2, y, 4, 12);
  ctx.fillStyle = '#fff';
  ctx.fillRect(20 - LARGEUR / 2, gauche.y, LARGEUR, HAUTEUR);
  ctx.fillRect(canvas.width - 20 - LARGEUR / 2, droite.y, LARGEUR, HAUTEUR);
  ctx.beginPath();
  ctx.arc(balle.x, balle.y, balle.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = 'bold 40px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(scores[0], canvas.width / 4, 50);
  ctx.fillText(scores[1], canvas.width * 3 / 4, 50);
  if (fini) {
    ctx.font = 'bold 30px system-ui';
    ctx.fillText((scores[0] > scores[1] ? 'Gauche' : 'Droite') + ' gagne ! 🏆', canvas.width / 2, canvas.height / 2);
  }
}

function boucle() {
  mettreAJour();
  dessiner();
  requestAnimationFrame(boucle);
}

document.addEventListener('keydown', e => {
  touches[e.key] = true;
  if (e.key.startsWith('Arrow')) e.preventDefault();
});
document.addEventListener('keyup', e => { touches[e.key] = false; });
canvas.addEventListener('pointermove', e => {
  const r = canvas.getBoundingClientRect();
  gauche.y = (e.clientY - r.top) * (canvas.height / r.height) - HAUTEUR / 2;
});
document.getElementById('mode').addEventListener('click', e => {
  deuxJoueurs = !deuxJoueurs;
  e.target.textContent = deuxJoueurs ? 'Mode : 2 joueurs' : "Mode : contre l'ordinateur";
  nouvellePartie();
});
document.getElementById('rejouer').addEventListener('click', nouvellePartie);
nouvellePartie();
boucle();
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'plateforme', type: 'exemple', titre: 'Jeu de plateforme (sauter et ramasser des pièces)',
  mots: ['plateforme', 'plateformes', 'sauter', 'saut', 'mario', 'pieces', 'ramasser', 'personnage qui saute', 'niveau'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Saute !</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #1e1b4b; color: #fff; font-family: system-ui, sans-serif; text-align: center; }
  canvas { width: min(640px, 96vw); border-radius: 12px; display: block; margin: 0 auto; }
  .commandes { display: flex; gap: 10px; justify-content: center; margin-top: 10px; }
  button { font: inherit; font-size: 20px; font-weight: 700; padding: 10px 18px; border: 0; border-radius: 12px; background: #4338ca; color: #fff; cursor: pointer; user-select: none; touch-action: none; }
</style>
</head>
<body>
<div>
  <canvas id="jeu" width="640" height="360"></canvas>
  <div class="commandes">
    <button data-touche="gauche">⬅️</button>
    <button data-touche="saut">⤴️ Saut</button>
    <button data-touche="droite">➡️</button>
  </div>
</div>
<script>
const canvas = document.getElementById('jeu');
const ctx = canvas.getContext('2d');
const PLATEFORMES = [
  { x: 0, y: 330, l: 640, h: 30 },
  { x: 90, y: 260, l: 120, h: 14 },
  { x: 270, y: 200, l: 110, h: 14 },
  { x: 440, y: 150, l: 130, h: 14 },
  { x: 230, y: 100, l: 90, h: 14 },
  { x: 40, y: 150, l: 90, h: 14 }
];
const commandes = { gauche: false, droite: false, saut: false };
let joueur, pieces, gagne;

function nouvellePartie() {
  joueur = { x: 30, y: 290, l: 26, h: 34, vx: 0, vy: 0, auSol: false };
  pieces = [{ x: 150, y: 230 }, { x: 325, y: 170 }, { x: 505, y: 120 }, { x: 275, y: 70 }, { x: 85, y: 120 }, { x: 600, y: 300 }];
  gagne = false;
}

function mettreAJour() {
  joueur.vx = (commandes.droite ? 4 : 0) - (commandes.gauche ? 4 : 0);
  if (commandes.saut && joueur.auSol) joueur.vy = -11;
  joueur.vy = Math.min(joueur.vy + 0.55, 12);
  joueur.x = Math.max(0, Math.min(canvas.width - joueur.l, joueur.x + joueur.vx));
  const ancienBas = joueur.y + joueur.h;
  joueur.y += joueur.vy;
  joueur.auSol = false;
  for (const p of PLATEFORMES) {
    const auDessus = joueur.x + joueur.l > p.x && joueur.x < p.x + p.l;
    if (auDessus && joueur.vy >= 0 && ancienBas <= p.y && joueur.y + joueur.h >= p.y) {
      joueur.y = p.y - joueur.h;
      joueur.vy = 0;
      joueur.auSol = true;
    }
  }
  pieces = pieces.filter(c => Math.hypot(c.x - (joueur.x + joueur.l / 2), c.y - (joueur.y + joueur.h / 2)) > 24);
  if (!pieces.length) gagne = true;
}

function dessiner() {
  ctx.fillStyle = '#93c5fd';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#65a30d';
  for (const p of PLATEFORMES) ctx.fillRect(p.x, p.y, p.l, p.h);
  ctx.font = '22px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const c of pieces) ctx.fillText('🪙', c.x, c.y);
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(joueur.x, joueur.y, joueur.l, joueur.h);
  ctx.fillStyle = '#fff';
  ctx.fillRect(joueur.x + 6, joueur.y + 8, 5, 5);
  ctx.fillRect(joueur.x + 16, joueur.y + 8, 5, 5);
  ctx.fillStyle = '#1e1b4b';
  ctx.font = 'bold 18px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText('Pièces restantes : ' + pieces.length, 12, 22);
  if (gagne) {
    ctx.textAlign = 'center';
    ctx.font = 'bold 34px system-ui';
    ctx.fillText('Bravo, tout ramassé ! 🎉', canvas.width / 2, canvas.height / 2);
  }
}

function boucle() {
  if (!gagne) mettreAJour();
  dessiner();
  requestAnimationFrame(boucle);
}

const CLAVIER = { ArrowLeft: 'gauche', q: 'gauche', ArrowRight: 'droite', d: 'droite', ArrowUp: 'saut', z: 'saut', ' ': 'saut' };
document.addEventListener('keydown', e => {
  if (CLAVIER[e.key]) { e.preventDefault(); commandes[CLAVIER[e.key]] = true; }
  if (gagne && e.key === 'Enter') nouvellePartie();
});
document.addEventListener('keyup', e => { if (CLAVIER[e.key]) commandes[CLAVIER[e.key]] = false; });
document.querySelectorAll('[data-touche]').forEach(b => {
  b.addEventListener('pointerdown', () => { commandes[b.dataset.touche] = true; if (gagne) nouvellePartie(); });
  b.addEventListener('pointerup', () => { commandes[b.dataset.touche] = false; });
  b.addEventListener('pointerleave', () => { commandes[b.dataset.touche] = false; });
});
nouvellePartie();
boucle();
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'roue', type: 'exemple', titre: 'Roue de tirage au sort',
  mots: ['roue', 'tirage au sort', 'tirer au sort', 'tirage', 'hasard un nom', 'choisir au hasard', 'loterie', 'qui commence'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Roue du tirage au sort</title>
<style>
  body { margin: 0; min-height: 100vh; background: #faf5ff; color: #3b0764; font-family: system-ui, sans-serif; display: flex; flex-wrap: wrap; gap: 24px; justify-content: center; align-items: center; padding: 20px; box-sizing: border-box; }
  .roue { position: relative; width: min(360px, 88vw); }
  canvas { width: 100%; display: block; }
  .fleche { position: absolute; top: -6px; left: 50%; transform: translateX(-50%); font-size: 34px; }
  .panneau { width: min(300px, 88vw); }
  textarea { width: 100%; box-sizing: border-box; height: 170px; font: inherit; padding: 10px; border: 2px solid #d8b4fe; border-radius: 12px; }
  button { font: inherit; font-weight: 800; font-size: 18px; width: 100%; margin-top: 10px; padding: 12px; border: 0; border-radius: 12px; background: #9333ea; color: #fff; cursor: pointer; }
  button:disabled { opacity: .5; }
  #gagnant { font-size: 24px; font-weight: 800; min-height: 34px; margin-top: 12px; text-align: center; }
  label { display: flex; gap: 8px; margin-top: 8px; }
</style>
</head>
<body>
<div class="roue"><div class="fleche">🔻</div><canvas id="roue" width="400" height="400"></canvas></div>
<div class="panneau">
  <textarea id="noms">Léa
Tom
Inès
Hugo
Emma
Sacha</textarea>
  <label><input type="checkbox" id="retirer"> Retirer le gagnant ensuite</label>
  <button id="tourner">Tourner la roue</button>
  <div id="gagnant"></div>
</div>
<script>
const canvas = document.getElementById('roue');
const ctx = canvas.getContext('2d');
const COULEURS = ['#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#eab308'];
let angle = 0, enRotation = false;

function lireNoms() {
  return document.getElementById('noms').value.split('\\n').map(n => n.trim()).filter(Boolean);
}

function dessiner() {
  const noms = lireNoms();
  const c = canvas.width / 2;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!noms.length) return;
  const part = (Math.PI * 2) / noms.length;
  noms.forEach((nom, i) => {
    const debut = angle + i * part;
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.arc(c, c, c - 4, debut, debut + part);
    ctx.fillStyle = COULEURS[i % COULEURS.length];
    ctx.fill();
    ctx.save();
    ctx.translate(c, c);
    ctx.rotate(debut + part / 2);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText(nom.slice(0, 14), c - 18, 7);
    ctx.restore();
  });
}

function gagnantActuel() {
  const noms = lireNoms();
  const part = (Math.PI * 2) / noms.length;
  // La flèche est en haut, c'est-à-dire à l'angle -90°.
  const sousLaFleche = ((-Math.PI / 2 - angle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  return noms[Math.floor(sousLaFleche / part)];
}

function tourner() {
  const noms = lireNoms();
  if (enRotation || noms.length < 2) return;
  enRotation = true;
  document.getElementById('tourner').disabled = true;
  document.getElementById('gagnant').textContent = '';
  const depart = angle;
  const tours = Math.PI * 2 * (5 + Math.random() * 3);
  const duree = 4000;
  const t0 = performance.now();
  function etape(maintenant) {
    const t = Math.min(1, (maintenant - t0) / duree);
    angle = depart + tours * (1 - Math.pow(1 - t, 3));
    dessiner();
    if (t < 1) return requestAnimationFrame(etape);
    enRotation = false;
    document.getElementById('tourner').disabled = false;
    const gagnant = gagnantActuel();
    document.getElementById('gagnant').textContent = '🎉 ' + gagnant + ' !';
    if (document.getElementById('retirer').checked) {
      const zone = document.getElementById('noms');
      const restants = lireNoms();
      restants.splice(restants.indexOf(gagnant), 1);
      zone.value = restants.join('\\n');
      dessiner();
    }
  }
  requestAnimationFrame(etape);
}

document.getElementById('noms').addEventListener('input', dessiner);
document.getElementById('tourner').addEventListener('click', tourner);
dessiner();
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'tableau-tournoi', type: 'exemple', titre: 'Tableau de tournoi à élimination',
  mots: ['arbre du tournoi', 'tableau du tournoi', 'bracket', 'elimination', 'eliminatoire', 'demi-finale', 'quart de finale', 'matchs', 'phases finales'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tableau du tournoi</title>
<style>
  body { margin: 0; min-height: 100vh; background: #0a0a14; color: #e8e8f5; font-family: system-ui, sans-serif; padding: 20px; box-sizing: border-box; }
  h1 { margin: 0 0 12px; color: #22e8ff; }
  .saisie { display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-start; margin-bottom: 18px; }
  textarea { width: 260px; height: 150px; font: inherit; padding: 10px; border-radius: 12px; border: 1px solid #34344f; background: #15152a; color: inherit; }
  button { font: inherit; font-weight: 700; padding: 10px 16px; border: 0; border-radius: 10px; background: #b026ff; color: #fff; cursor: pointer; }
  .tableau { display: flex; gap: 24px; overflow-x: auto; padding-bottom: 10px; }
  .tour { display: flex; flex-direction: column; justify-content: space-around; gap: 12px; min-width: 170px; }
  .tour h2 { font-size: 14px; color: #9494b0; margin: 0 0 4px; text-transform: uppercase; }
  .match { background: #15152a; border: 1px solid #2a2a45; border-radius: 12px; overflow: hidden; }
  .joueur { display: block; width: 100%; text-align: left; background: none; border-radius: 0; padding: 9px 12px; color: inherit; font-weight: 600; }
  .joueur + .joueur { border-top: 1px solid #2a2a45; }
  .joueur:hover:not(:disabled) { background: #22223a; }
  .joueur.gagne { background: #ff2e88; color: #fff; }
  .joueur:disabled { cursor: default; opacity: .6; }
  #champion { font-size: 26px; font-weight: 800; margin-top: 16px; color: #ff2e88; }
</style>
</head>
<body>
<h1>🏆 Tableau du tournoi</h1>
<div class="saisie">
  <textarea id="noms">Mario
Luigi
Peach
Yoshi
Bowser
Toad
Daisy
Wario</textarea>
  <div>
    <button id="creer">Créer le tableau</button>
    <p style="max-width:260px;color:#9494b0">Un pseudo par ligne (4, 8 ou 16). Clique sur le gagnant de chaque match pour le faire avancer.</p>
  </div>
</div>
<div class="tableau" id="tableau"></div>
<div id="champion"></div>
<script>
let tours = [];
const NOMS_TOURS = { 1: 'Finale', 2: 'Demi-finales', 4: 'Quarts de finale', 8: 'Huitièmes de finale' };

function melanger(t) {
  for (let i = t.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [t[i], t[j]] = [t[j], t[i]];
  }
  return t;
}

function creer() {
  let noms = document.getElementById('noms').value.split('\\n').map(n => n.trim()).filter(Boolean);
  let taille = 2;
  while (taille < noms.length && taille < 16) taille *= 2;
  noms = melanger(noms.slice(0, taille));
  while (noms.length < taille) noms.push('(qualifié d\\'office)');
  tours = [];
  let matchs = [];
  for (let i = 0; i < noms.length; i += 2) matchs.push({ a: noms[i], b: noms[i + 1], gagnant: null });
  tours.push(matchs);
  while (matchs.length > 1) {
    matchs = Array.from({ length: matchs.length / 2 }, () => ({ a: null, b: null, gagnant: null }));
    tours.push(matchs);
  }
  afficher();
}

function choisir(t, m, qui) {
  const match = tours[t][m];
  if (!match.a || !match.b) return;
  match.gagnant = qui;
  // On efface la suite si un résultat change.
  for (let s = t + 1; s < tours.length; s++) tours[s].forEach(x => { x.gagnant = null; });
  for (let s = t; s < tours.length - 1; s++) {
    tours[s].forEach((x, i) => {
      const suivant = tours[s + 1][Math.floor(i / 2)];
      suivant[i % 2 === 0 ? 'a' : 'b'] = x.gagnant ? x[x.gagnant] : null;
    });
  }
  afficher();
}

function afficher() {
  const zone = document.getElementById('tableau');
  zone.innerHTML = '';
  tours.forEach((matchs, t) => {
    const colonne = document.createElement('div');
    colonne.className = 'tour';
    const titre = document.createElement('h2');
    titre.textContent = NOMS_TOURS[matchs.length] || 'Tour ' + (t + 1);
    colonne.appendChild(titre);
    matchs.forEach((match, m) => {
      const boite = document.createElement('div');
      boite.className = 'match';
      ['a', 'b'].forEach(qui => {
        const b = document.createElement('button');
        b.className = 'joueur' + (match.gagnant === qui ? ' gagne' : '');
        b.textContent = match[qui] || '…';
        b.disabled = !match.a || !match.b;
        b.addEventListener('click', () => choisir(t, m, qui));
        boite.appendChild(b);
      });
      colonne.appendChild(boite);
    });
    zone.appendChild(colonne);
  });
  const finale = tours[tours.length - 1][0];
  document.getElementById('champion').textContent = finale.gagnant ? '👑 Champion : ' + finale[finale.gagnant] : '';
}

document.getElementById('creer').addEventListener('click', creer);
creer();
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'piano', type: 'exemple', titre: 'Piano qui joue des notes',
  mots: ['piano', 'clavier musical', 'notes de musique', 'jouer de la musique', 'instrument', 'synthetiseur', 'boite a sons'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mon piano</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #1c1917; color: #fafaf9; font-family: system-ui, sans-serif; text-align: center; }
  .piano { display: flex; justify-content: center; margin-top: 16px; }
  .touche { width: 58px; height: 200px; margin: 0 2px; border: 0; border-radius: 0 0 10px 10px; background: #fff; color: #444; font-weight: 700; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; padding-bottom: 10px; cursor: pointer; user-select: none; touch-action: none; }
  .touche small { color: #999; }
  .touche.active { background: #fcd34d; transform: translateY(3px); }
  select { font: inherit; padding: 6px 10px; border-radius: 8px; }
</style>
</head>
<body>
<div>
  <h1>🎹 Mon piano</h1>
  <label>Son : <select id="son"><option value="triangle">Doux</option><option value="square">Jeu vidéo</option><option value="sawtooth">Robot</option><option value="sine">Flûte</option></select></label>
  <div class="piano" id="piano"></div>
  <p>Clique sur les touches ou tape Q S D F G H J K</p>
</div>
<script>
const NOTES = [
  { nom: 'Do', frequence: 261.63, clavier: 'q' },
  { nom: 'Ré', frequence: 293.66, clavier: 's' },
  { nom: 'Mi', frequence: 329.63, clavier: 'd' },
  { nom: 'Fa', frequence: 349.23, clavier: 'f' },
  { nom: 'Sol', frequence: 392.0, clavier: 'g' },
  { nom: 'La', frequence: 440.0, clavier: 'h' },
  { nom: 'Si', frequence: 493.88, clavier: 'j' },
  { nom: 'Do', frequence: 523.25, clavier: 'k' }
];
let audio = null;

function jouer(note, bouton) {
  if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audio.createOscillator();
  const volume = audio.createGain();
  osc.type = document.getElementById('son').value;
  osc.frequency.value = note.frequence;
  volume.gain.setValueAtTime(0.3, audio.currentTime);
  volume.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.8);
  osc.connect(volume).connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + 0.8);
  bouton.classList.add('active');
  setTimeout(() => bouton.classList.remove('active'), 150);
}

const piano = document.getElementById('piano');
NOTES.forEach(note => {
  const b = document.createElement('button');
  b.className = 'touche';
  b.innerHTML = note.nom + '<small>' + note.clavier.toUpperCase() + '</small>';
  b.addEventListener('pointerdown', () => jouer(note, b));
  note.bouton = b;
  piano.appendChild(b);
});
document.addEventListener('keydown', e => {
  if (e.repeat) return;
  const note = NOTES.find(n => n.clavier === e.key.toLowerCase());
  if (note) jouer(note, note.bouton);
});
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'pendu', type: 'exemple', titre: 'Jeu du pendu',
  mots: ['pendu', 'deviner un mot', 'mot mystere', 'mot cache', 'lettres a deviner', 'hangman'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Le pendu</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #fefce8; color: #422006; font-family: system-ui, sans-serif; text-align: center; }
  .jeu { width: min(560px, 94vw); padding: 16px; }
  svg { width: 180px; height: 180px; }
  svg .partie { stroke: #422006; stroke-width: 4; fill: none; stroke-linecap: round; visibility: hidden; }
  #mot { font-size: 34px; font-weight: 800; letter-spacing: 8px; margin: 12px 0; }
  .lettres { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
  .lettres button { width: 38px; height: 42px; font: inherit; font-weight: 700; border: 0; border-radius: 8px; background: #facc15; cursor: pointer; }
  .lettres button:disabled { background: #e7e5e4; color: #a8a29e; cursor: default; }
  #message { font-size: 22px; font-weight: 800; min-height: 32px; margin: 12px 0; }
  #rejouer { font: inherit; font-weight: 700; padding: 10px 20px; border: 0; border-radius: 10px; background: #422006; color: #fff; cursor: pointer; }
</style>
</head>
<body>
<div class="jeu">
  <h1>Le pendu</h1>
  <svg viewBox="0 0 180 180" aria-hidden="true">
    <line class="partie" x1="20" y1="170" x2="120" y2="170"/>
    <line class="partie" x1="50" y1="170" x2="50" y2="20"/>
    <line class="partie" x1="50" y1="20" x2="130" y2="20"/>
    <line class="partie" x1="130" y1="20" x2="130" y2="45"/>
    <circle class="partie" cx="130" cy="60" r="15"/>
    <line class="partie" x1="130" y1="75" x2="130" y2="120"/>
    <line class="partie" x1="130" y1="90" x2="110" y2="105"/>
    <line class="partie" x1="130" y1="90" x2="150" y2="105"/>
    <line class="partie" x1="130" y1="120" x2="115" y2="150"/>
    <line class="partie" x1="130" y1="120" x2="145" y2="150"/>
  </svg>
  <div id="mot"></div>
  <div id="message"></div>
  <div class="lettres" id="lettres"></div>
  <p><button id="rejouer">Nouveau mot</button></p>
</div>
<script>
const MOTS = ['ORDINATEUR', 'MANETTE', 'FESTIVAL', 'PLANETE', 'CHOCOLAT', 'DRAGON', 'TOURNOI', 'PIXEL', 'CLAVIER', 'CINEMA', 'GIRAFE', 'VACANCES'];
const ERREURS_MAX = 10;
let mot, trouvees, erreurs, fini;

function nouvellePartie() {
  mot = MOTS[Math.floor(Math.random() * MOTS.length)];
  trouvees = new Set();
  erreurs = 0;
  fini = false;
  document.getElementById('message').textContent = '';
  document.querySelectorAll('.partie').forEach(p => { p.style.visibility = 'hidden'; });
  const zone = document.getElementById('lettres');
  zone.innerHTML = '';
  for (const lettre of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    const b = document.createElement('button');
    b.textContent = lettre;
    b.addEventListener('click', () => proposer(lettre, b));
    zone.appendChild(b);
  }
  afficherMot();
}

function afficherMot() {
  document.getElementById('mot').textContent = mot.split('').map(l => trouvees.has(l) ? l : '_').join('');
}

function proposer(lettre, bouton) {
  if (fini) return;
  bouton.disabled = true;
  if (mot.includes(lettre)) {
    trouvees.add(lettre);
    afficherMot();
    if (mot.split('').every(l => trouvees.has(l))) terminer('Bravo, tu as trouvé ! 🎉');
  } else {
    document.querySelectorAll('.partie')[erreurs].style.visibility = 'visible';
    erreurs++;
    if (erreurs >= ERREURS_MAX) terminer('Perdu ! Le mot était ' + mot);
  }
}

function terminer(texte) {
  fini = true;
  document.getElementById('message').textContent = texte;
  document.querySelectorAll('#lettres button').forEach(b => { b.disabled = true; });
}

document.addEventListener('keydown', e => {
  const lettre = e.key.toUpperCase();
  const bouton = [...document.querySelectorAll('#lettres button')].find(b => b.textContent === lettre);
  if (bouton && !bouton.disabled) proposer(lettre, bouton);
});
document.getElementById('rejouer').addEventListener('click', nouvellePartie);
nouvellePartie();
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'taupe', type: 'exemple', titre: 'Tape-taupe (jeu de réflexes)',
  mots: ['taupe', 'tape-taupe', 'reflexes', 'reflexe', 'cliquer vite', 'cibles', 'whack', 'rapidite'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tape-taupe</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #3f6212; color: #fff; font-family: system-ui, sans-serif; text-align: center; }
  .infos { display: flex; gap: 24px; justify-content: center; font-size: 20px; font-weight: 800; margin-bottom: 14px; }
  .terrain { display: grid; grid-template-columns: repeat(3, 100px); gap: 14px; justify-content: center; }
  .trou { width: 100px; height: 100px; border: 0; border-radius: 50%; background: #422006; font-size: 52px; cursor: pointer; box-shadow: inset 0 8px 0 rgba(0,0,0,.3); }
  #lancer { margin-top: 18px; font: inherit; font-weight: 800; font-size: 18px; padding: 12px 24px; border: 0; border-radius: 12px; background: #facc15; color: #3f6212; cursor: pointer; }
</style>
</head>
<body>
<div>
  <h1>🔨 Tape-taupe</h1>
  <div class="infos"><span>Score : <span id="score">0</span></span><span>Temps : <span id="temps">30</span> s</span></div>
  <div class="terrain" id="terrain"></div>
  <button id="lancer">Jouer</button>
</div>
<script>
const terrain = document.getElementById('terrain');
const trous = [];
let score = 0, temps = 30, active = -1, horloge = null, apparition = null;

for (let i = 0; i < 9; i++) {
  const b = document.createElement('button');
  b.className = 'trou';
  b.setAttribute('aria-label', 'Trou ' + (i + 1));
  b.addEventListener('pointerdown', () => taper(i));
  terrain.appendChild(b);
  trous.push(b);
}

function montrerTaupe() {
  if (active >= 0) trous[active].textContent = '';
  let i;
  do { i = Math.floor(Math.random() * 9); } while (i === active);
  active = i;
  trous[i].textContent = '🐹';
}

function taper(i) {
  if (i !== active || !horloge) return;
  score++;
  document.getElementById('score').textContent = score;
  trous[i].textContent = '💥';
  active = -1;
  clearInterval(apparition);
  apparition = setInterval(montrerTaupe, Math.max(400, 900 - score * 15));
}

function fin() {
  clearInterval(horloge);
  clearInterval(apparition);
  horloge = null;
  trous.forEach(t => { t.textContent = ''; });
  document.getElementById('lancer').textContent = 'Rejouer (score : ' + score + ')';
}

document.getElementById('lancer').addEventListener('click', () => {
  score = 0;
  temps = 30;
  document.getElementById('score').textContent = score;
  document.getElementById('temps').textContent = temps;
  clearInterval(horloge);
  clearInterval(apparition);
  horloge = setInterval(() => {
    temps--;
    document.getElementById('temps').textContent = temps;
    if (temps <= 0) fin();
  }, 1000);
  apparition = setInterval(montrerTaupe, 900);
  montrerTaupe();
});
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'mot-de-passe', type: 'exemple', titre: 'Générateur de mots de passe',
  mots: ['mot de passe', 'mots de passe', 'password', 'generateur', 'securite'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Générateur de mots de passe</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0f172a; color: #e2e8f0; font-family: system-ui, sans-serif; }
  .carte { width: min(460px, 92vw); padding: 24px; border-radius: 20px; background: #1e293b; }
  h1 { margin: 0 0 16px; font-size: 24px; }
  #resultat { font-family: ui-monospace, Consolas, monospace; font-size: 22px; padding: 14px; border-radius: 12px; background: #0b1220; overflow-wrap: anywhere; min-height: 30px; }
  .force { height: 8px; border-radius: 4px; background: #334155; margin: 10px 0 16px; overflow: hidden; }
  .force i { display: block; height: 100%; width: 0; transition: width .3s, background .3s; }
  label { display: flex; align-items: center; gap: 8px; margin: 8px 0; }
  input[type=range] { flex: 1; }
  .boutons { display: flex; gap: 8px; margin-top: 14px; }
  button { flex: 1; font: inherit; font-weight: 700; padding: 12px; border: 0; border-radius: 12px; cursor: pointer; background: #22c55e; color: #052e16; }
  #copier { background: #334155; color: #fff; }
</style>
</head>
<body>
<div class="carte">
  <h1>🔐 Générateur de mots de passe</h1>
  <div id="resultat"></div>
  <div class="force"><i id="jauge"></i></div>
  <label>Longueur : <input type="range" id="longueur" min="6" max="32" value="14"> <b id="valeur">14</b></label>
  <label><input type="checkbox" id="majuscules" checked> Majuscules</label>
  <label><input type="checkbox" id="chiffres" checked> Chiffres</label>
  <label><input type="checkbox" id="symboles"> Symboles</label>
  <div class="boutons"><button id="generer">Générer</button><button id="copier">Copier</button></div>
</div>
<script>
function hasard(max) {
  const tableau = new Uint32Array(1);
  crypto.getRandomValues(tableau);
  return tableau[0] % max;
}

function generer() {
  const longueur = Number(document.getElementById('longueur').value);
  let lettres = 'abcdefghijkmnopqrstuvwxyz';
  if (document.getElementById('majuscules').checked) lettres += 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  if (document.getElementById('chiffres').checked) lettres += '23456789';
  if (document.getElementById('symboles').checked) lettres += '!@#$%&*?-_+=';
  let mdp = '';
  for (let i = 0; i < longueur; i++) mdp += lettres[hasard(lettres.length)];
  document.getElementById('resultat').textContent = mdp;
  const bits = longueur * Math.log2(lettres.length);
  const jauge = document.getElementById('jauge');
  jauge.style.width = Math.min(100, bits) + '%';
  jauge.style.background = bits < 50 ? '#ef4444' : bits < 75 ? '#f59e0b' : '#22c55e';
}

document.getElementById('longueur').addEventListener('input', e => {
  document.getElementById('valeur').textContent = e.target.value;
  generer();
});
document.querySelectorAll('input[type=checkbox]').forEach(c => c.addEventListener('change', generer));
document.getElementById('generer').addEventListener('click', generer);
document.getElementById('copier').addEventListener('click', () => {
  navigator.clipboard.writeText(document.getElementById('resultat').textContent).then(() => {
    document.getElementById('copier').textContent = 'Copié !';
    setTimeout(() => { document.getElementById('copier').textContent = 'Copier'; }, 1200);
  }).catch(() => {});
});
generer();
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'des', type: 'exemple', titre: 'Lancer de dés',
  mots: ['lancer de des', 'lancer les des', 'lancer un de', 'des a jouer', 'de a six faces', 'jeu de des', 'yams'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lancer de dés</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #064e3b; color: #ecfdf5; font-family: system-ui, sans-serif; text-align: center; }
  .des { display: flex; gap: 16px; justify-content: center; margin: 20px 0; min-height: 100px; }
  .de { width: 90px; height: 90px; border-radius: 18px; background: #fff; color: #064e3b; font-size: 64px; line-height: 90px; box-shadow: 0 8px 20px rgba(0,0,0,.3); }
  .de.roule { animation: rouler .5s ease-out; }
  @keyframes rouler { from { transform: rotate(-360deg) scale(.5); } to { transform: none; } }
  select, button { font: inherit; font-weight: 700; padding: 10px 16px; border: 0; border-radius: 12px; }
  button { background: #facc15; color: #064e3b; cursor: pointer; font-size: 18px; }
  #total { font-size: 26px; font-weight: 800; }
  #historique { opacity: .8; margin-top: 10px; }
</style>
</head>
<body>
<div>
  <h1>🎲 Lancer de dés</h1>
  <label>Nombre de dés : <select id="nombre"><option>1</option><option selected>2</option><option>3</option><option>4</option></select></label>
  <div class="des" id="des"></div>
  <div id="total"></div>
  <p><button id="lancer">Lancer !</button></p>
  <div id="historique"></div>
</div>
<script>
const FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const historique = [];

function lancer() {
  const nombre = Number(document.getElementById('nombre').value);
  const zone = document.getElementById('des');
  zone.innerHTML = '';
  let total = 0;
  for (let i = 0; i < nombre; i++) {
    const valeur = Math.floor(Math.random() * 6) + 1;
    total += valeur;
    const de = document.createElement('div');
    de.className = 'de roule';
    de.textContent = FACES[valeur - 1];
    de.title = String(valeur);
    zone.appendChild(de);
  }
  document.getElementById('total').textContent = 'Total : ' + total;
  historique.unshift(total);
  document.getElementById('historique').textContent = 'Derniers lancers : ' + historique.slice(0, 8).join(', ');
}

document.getElementById('lancer').addEventListener('click', lancer);
document.addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); lancer(); } });
</script>
</body>
</html>`,
});

// ---------------------------------------------------------------------------
// Exemples ajoutés le 2026-10-05.
// ---------------------------------------------------------------------------
SAVOIRS.push({
  id: 'tetris', type: 'exemple', titre: 'Tetris (blocs qui tombent)',
  mots: ['tetris', 'blocs qui tombent', 'pieces qui tombent', 'tetromino', 'lignes a completer'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tetris</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0b1020; color: #e6e9f2; font-family: system-ui, sans-serif; }
  .jeu { display: flex; gap: 20px; align-items: flex-start; padding: 16px; flex-wrap: wrap; justify-content: center; }
  #plateau { background: #141a33; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,.4); width: min(240px, 60vw); }
  .cote { min-width: 140px; }
  .cote h1 { margin: 0 0 10px; font-size: 26px; }
  .stat { background: #141a33; border-radius: 12px; padding: 10px 12px; margin-bottom: 8px; }
  .stat b { display: block; font-size: 22px; }
  button { font: inherit; font-weight: 700; border: 0; border-radius: 12px; padding: 10px 14px; background: #2b3566; color: #fff; cursor: pointer; touch-action: manipulation; }
  #rejouer { background: #12b76a; width: 100%; margin-top: 6px; }
  .tactile { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 10px; }
  #message { min-height: 24px; font-weight: 700; color: #fdb022; }
</style>
</head>
<body>
<div class="jeu">
  <canvas id="plateau" width="240" height="480"></canvas>
  <div class="cote">
    <h1>🧱 Tetris</h1>
    <div class="stat">Score <b id="score">0</b></div>
    <div class="stat">Lignes <b id="lignes">0</b></div>
    <div class="stat">Niveau <b id="niveau">1</b></div>
    <div class="stat">Record <b id="record">0</b></div>
    <div class="stat">Suivante<canvas id="suivante" width="80" height="80"></canvas></div>
    <p id="message"></p>
    <button id="rejouer">Nouvelle partie</button>
    <div class="tactile">
      <button data-action="gauche" aria-label="Gauche">⬅️</button>
      <button data-action="tourner" aria-label="Tourner">🔄</button>
      <button data-action="droite" aria-label="Droite">➡️</button>
      <button data-action="bas" aria-label="Descendre">⬇️</button>
    </div>
  </div>
</div>
<script>
const COLONNES = 10, LIGNES = 20, CASE = 24;
const ctx = document.getElementById('plateau').getContext('2d');
const ctxSuivante = document.getElementById('suivante').getContext('2d');
const PIECES = [
  { forme: [[1, 1, 1, 1]], couleur: '#22d3ee' },
  { forme: [[1, 1], [1, 1]], couleur: '#facc15' },
  { forme: [[0, 1, 0], [1, 1, 1]], couleur: '#a855f7' },
  { forme: [[0, 1, 1], [1, 1, 0]], couleur: '#22c55e' },
  { forme: [[1, 1, 0], [0, 1, 1]], couleur: '#ef4444' },
  { forme: [[1, 0, 0], [1, 1, 1]], couleur: '#3b82f6' },
  { forme: [[0, 0, 1], [1, 1, 1]], couleur: '#f97316' },
];
let grille, piece, suivante, score, lignes, niveau, finie, avant, cumul = 0;
let record = Number(localStorage.getItem('tetris-record')) || 0;

function nouvellePiece() {
  const p = PIECES[Math.floor(Math.random() * PIECES.length)];
  return { forme: p.forme.map(l => l.slice()), couleur: p.couleur, x: 0, y: 0 };
}
function enHaut(p) { p.x = Math.floor((COLONNES - p.forme[0].length) / 2); p.y = 0; return p; }

// La pièce p, décalée de (dx, dy), touche-t-elle un bord ou un bloc ?
function collision(p, dx, dy, forme) {
  forme = forme || p.forme;
  for (let l = 0; l < forme.length; l++) {
    for (let c = 0; c < forme[l].length; c++) {
      if (!forme[l][c]) continue;
      const x = p.x + c + dx, y = p.y + l + dy;
      if (x < 0 || x >= COLONNES || y >= LIGNES) return true;
      if (y >= 0 && grille[y][x]) return true;
    }
  }
  return false;
}
const tourner = forme => forme[0].map((_, c) => forme.map(ligne => ligne[c]).reverse());

function fixer() {
  piece.forme.forEach((ligne, l) => ligne.forEach((v, c) => { if (v) grille[piece.y + l][piece.x + c] = piece.couleur; }));
  let effacees = 0;
  for (let l = LIGNES - 1; l >= 0; l--) {
    if (grille[l].every(v => v)) {          // ligne pleine : on l'enlève et on en ajoute une vide en haut
      grille.splice(l, 1);
      grille.unshift(Array(COLONNES).fill(null));
      effacees++;
      l++;
    }
  }
  if (effacees) {
    score += [0, 100, 300, 500, 800][effacees] * niveau;
    lignes += effacees;
    niveau = 1 + Math.floor(lignes / 10);
  }
  piece = enHaut(suivante);
  suivante = nouvellePiece();
  if (collision(piece, 0, 0)) {
    finie = true;
    if (score > record) { record = score; localStorage.setItem('tetris-record', record); }
    message('Perdu ! Score : ' + score);
  }
  majInfos();
}
function bouger(dx) { if (!finie && !collision(piece, dx, 0)) piece.x += dx; dessiner(); }
function descendre() {
  if (finie) return;
  if (!collision(piece, 0, 1)) piece.y++;
  else fixer();
  dessiner();
}
function chuteLibre() {
  if (finie) return;
  while (!collision(piece, 0, 1)) { piece.y++; score += 2; }
  fixer();
  dessiner();
}
function pivoter() {
  if (finie) return;
  const f = tourner(piece.forme);
  for (const decalage of [0, -1, 1, -2, 2]) {    // on décale un peu si la pièce touche un mur
    if (!collision(piece, decalage, 0, f)) { piece.forme = f; piece.x += decalage; break; }
  }
  dessiner();
}
function carre(c, x, y, couleur, taille) {
  c.fillStyle = couleur;
  c.fillRect(x * taille + 1, y * taille + 1, taille - 2, taille - 2);
  c.fillStyle = 'rgba(255, 255, 255, 0.2)';
  c.fillRect(x * taille + 1, y * taille + 1, taille - 2, 4);
}
function dessiner() {
  ctx.clearRect(0, 0, COLONNES * CASE, LIGNES * CASE);
  grille.forEach((ligne, y) => ligne.forEach((couleur, x) => { if (couleur) carre(ctx, x, y, couleur, CASE); }));
  let ombre = 0;                                 // où la pièce va tomber
  while (!collision(piece, 0, ombre + 1)) ombre++;
  ctx.globalAlpha = 0.25;
  piece.forme.forEach((ligne, l) => ligne.forEach((v, c) => { if (v) carre(ctx, piece.x + c, piece.y + l + ombre, piece.couleur, CASE); }));
  ctx.globalAlpha = 1;
  piece.forme.forEach((ligne, l) => ligne.forEach((v, c) => { if (v) carre(ctx, piece.x + c, piece.y + l, piece.couleur, CASE); }));
  ctxSuivante.clearRect(0, 0, 80, 80);
  const t = 18, ox = (80 / t - suivante.forme[0].length) / 2, oy = (80 / t - suivante.forme.length) / 2;
  suivante.forme.forEach((ligne, l) => ligne.forEach((v, c) => { if (v) carre(ctxSuivante, c + ox, l + oy, suivante.couleur, t); }));
}
function majInfos() {
  document.getElementById('score').textContent = score;
  document.getElementById('lignes').textContent = lignes;
  document.getElementById('niveau').textContent = niveau;
  document.getElementById('record').textContent = record;
}
function message(t) { document.getElementById('message').textContent = t; }
function nouvellePartie() {
  grille = Array.from({ length: LIGNES }, () => Array(COLONNES).fill(null));
  score = 0; lignes = 0; niveau = 1; finie = false; cumul = 0;
  piece = enHaut(nouvellePiece());
  suivante = nouvellePiece();
  message('');
  majInfos();
  dessiner();
}
function boucle(temps) {
  cumul += temps - (avant || temps);
  avant = temps;
  if (cumul > Math.max(100, 800 - (niveau - 1) * 70)) { cumul = 0; descendre(); }   // plus rapide à chaque niveau
  requestAnimationFrame(boucle);
}
document.addEventListener('keydown', e => {
  const actions = { ArrowLeft: () => bouger(-1), ArrowRight: () => bouger(1), ArrowDown: descendre, ArrowUp: pivoter, ' ': chuteLibre };
  if (actions[e.key]) { e.preventDefault(); actions[e.key](); }
});
const ACTIONS = { gauche: () => bouger(-1), droite: () => bouger(1), bas: descendre, tourner: pivoter };
document.querySelectorAll('[data-action]').forEach(b => b.addEventListener('click', () => ACTIONS[b.dataset.action]()));
document.getElementById('rejouer').addEventListener('click', nouvellePartie);
nouvellePartie();
requestAnimationFrame(boucle);
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: '2048', type: 'exemple', titre: 'Jeu 2048 (fusionner les tuiles)',
  mots: ['2048', 'fusionner', 'fusionnent', 'tuiles', 'glisser les tuiles'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>2048</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #faf8ef; color: #776e65; font-family: system-ui, sans-serif; }
  .jeu { width: min(400px, 92vw); }
  .haut { display: flex; justify-content: space-between; align-items: center; }
  h1 { margin: 0; font-size: 48px; }
  .scores { display: flex; gap: 8px; }
  .score { background: #bbada0; color: #fff; border-radius: 8px; padding: 6px 12px; text-align: center; font-size: 12px; font-weight: 700; }
  .score b { display: block; font-size: 20px; }
  .plateau { background: #bbada0; border-radius: 10px; padding: 10px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; touch-action: none; }
  .case { aspect-ratio: 1; border-radius: 8px; background: #cdc1b4; display: grid; place-items: center; font-weight: 800; font-size: clamp(20px, 7vw, 36px); }
  .case.nouvelle { animation: apparait .15s ease-out; }
  @keyframes apparait { from { transform: scale(0); } }
  button { font: inherit; font-weight: 700; border: 0; border-radius: 8px; padding: 10px 16px; background: #8f7a66; color: #fff; cursor: pointer; }
  #message { text-align: center; font-weight: 700; min-height: 24px; }
</style>
</head>
<body>
<div class="jeu">
  <div class="haut"><h1>2048</h1><div class="scores"><div class="score">SCORE<b id="score">0</b></div><div class="score">RECORD<b id="record">0</b></div></div></div>
  <p>Fais glisser les tuiles avec les flèches ou le doigt : deux tuiles pareilles fusionnent !</p>
  <div class="plateau" id="plateau"></div>
  <p id="message"></p>
  <p style="text-align:center"><button id="rejouer">Nouvelle partie</button></p>
</div>
<script>
const TAILLE = 4;
const COULEURS = { 2: ['#eee4da', '#776e65'], 4: ['#ede0c8', '#776e65'], 8: ['#f2b179', '#fff'], 16: ['#f59563', '#fff'], 32: ['#f67c5f', '#fff'], 64: ['#f65e3b', '#fff'], 128: ['#edcf72', '#fff'], 256: ['#edcc61', '#fff'], 512: ['#edc850', '#fff'], 1024: ['#edc53f', '#fff'], 2048: ['#edc22e', '#fff'] };
let grille, score, gagne, nouvelle;
let record = Number(localStorage.getItem('2048-record')) || 0;

function tuileAuHasard() {
  const vides = [];
  grille.forEach((ligne, l) => ligne.forEach((v, c) => { if (!v) vides.push([l, c]); }));
  if (!vides.length) return;
  const [l, c] = vides[Math.floor(Math.random() * vides.length)];
  grille[l][c] = Math.random() < 0.9 ? 2 : 4;
  nouvelle = l * TAILLE + c;
}
// Fait glisser une ligne vers la gauche et fusionne les tuiles égales.
function glisserLigne(ligne) {
  const nombres = ligne.filter(v => v);
  const resultat = [];
  for (let i = 0; i < nombres.length; i++) {
    if (nombres[i] === nombres[i + 1]) {
      const fusion = nombres[i] * 2;
      resultat.push(fusion);
      score += fusion;
      if (fusion === 2048) gagne = true;
      i++;
    } else resultat.push(nombres[i]);
  }
  while (resultat.length < TAILLE) resultat.push(0);
  return resultat;
}
const transposer = g => g[0].map((_, c) => g.map(ligne => ligne[c]));
const inverser = g => g.map(ligne => ligne.slice().reverse());

// Pour les 4 directions, on se ramène à « glisser vers la gauche ».
function jouer(direction) {
  if (bloque()) return;
  const avant = JSON.stringify(grille);
  let g = grille;
  if (direction === 'haut' || direction === 'bas') g = transposer(g);
  if (direction === 'droite' || direction === 'bas') g = inverser(g);
  g = g.map(glisserLigne);
  if (direction === 'droite' || direction === 'bas') g = inverser(g);
  if (direction === 'haut' || direction === 'bas') g = transposer(g);
  grille = g;
  if (JSON.stringify(grille) !== avant) { tuileAuHasard(); afficher(); }   // seulement si quelque chose a bougé
}
function bloque() {
  for (let l = 0; l < TAILLE; l++) for (let c = 0; c < TAILLE; c++) {
    const v = grille[l][c];
    if (!v) return false;
    if (c < TAILLE - 1 && grille[l][c + 1] === v) return false;
    if (l < TAILLE - 1 && grille[l + 1][c] === v) return false;
  }
  return true;
}
function afficher() {
  const plateau = document.getElementById('plateau');
  plateau.innerHTML = '';
  grille.flat().forEach((v, i) => {
    const d = document.createElement('div');
    d.className = 'case' + (i === nouvelle ? ' nouvelle' : '');
    if (v) {
      const [fond, texte] = COULEURS[v] || ['#3c3a32', '#fff'];
      d.style.background = fond;
      d.style.color = texte;
      d.textContent = v;
      if (v >= 1024) d.style.fontSize = 'clamp(16px, 5vw, 28px)';
    }
    plateau.appendChild(d);
  });
  if (score > record) { record = score; localStorage.setItem('2048-record', record); }
  document.getElementById('score').textContent = score;
  document.getElementById('record').textContent = record;
  document.getElementById('message').textContent = bloque() ? 'Plus aucun coup possible ! Score : ' + score : gagne ? 'Bravo, tu as fait 2048 ! Tu peux continuer.' : '';
}
function nouvellePartie() {
  grille = Array.from({ length: TAILLE }, () => Array(TAILLE).fill(0));
  score = 0; gagne = false;
  tuileAuHasard(); tuileAuHasard();
  afficher();
}
document.addEventListener('keydown', e => {
  const dirs = { ArrowLeft: 'gauche', ArrowRight: 'droite', ArrowUp: 'haut', ArrowDown: 'bas' };
  if (dirs[e.key]) { e.preventDefault(); jouer(dirs[e.key]); }
});
let depart = null;                               // glisser du doigt ou de la souris
const zone = document.getElementById('plateau');
zone.addEventListener('pointerdown', e => { depart = { x: e.clientX, y: e.clientY }; });
zone.addEventListener('pointerup', e => {
  if (!depart) return;
  const dx = e.clientX - depart.x, dy = e.clientY - depart.y;
  depart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
  if (Math.abs(dx) > Math.abs(dy)) jouer(dx > 0 ? 'droite' : 'gauche');
  else jouer(dy > 0 ? 'bas' : 'haut');
});
document.getElementById('rejouer').addEventListener('click', nouvellePartie);
nouvellePartie();
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'puissance-4', type: 'exemple', titre: "Puissance 4 (contre l'ordinateur ou à deux)",
  mots: ['puissance 4', 'puissance quatre', 'aligner 4', 'aligner quatre', 'jetons', 'connect 4'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Puissance 4</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: linear-gradient(160deg, #1e3a8a, #0f172a); color: #fff; font-family: system-ui, sans-serif; text-align: center; }
  .plateau { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; background: #2563eb; padding: 12px; border-radius: 18px; width: min(460px, 94vw); box-sizing: border-box; box-shadow: 0 16px 40px rgba(0,0,0,.4); margin: 0 auto; }
  .trou { aspect-ratio: 1; border-radius: 50%; background: #0f172a; border: 0; padding: 0; cursor: pointer; }
  .trou.rouge { background: radial-gradient(circle at 35% 35%, #fca5a5, #dc2626); }
  .trou.jaune { background: radial-gradient(circle at 35% 35%, #fef08a, #eab308); }
  .trou.gagnant { outline: 4px solid #fff; }
  .options { margin: 12px 0; display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
  select, button.bouton { font: inherit; font-weight: 700; border: 0; border-radius: 12px; padding: 10px 14px; }
  button.bouton { background: #facc15; color: #1e3a8a; cursor: pointer; }
  #tour { font-size: 20px; font-weight: 800; min-height: 28px; }
</style>
</head>
<body>
<div>
  <h1>🔴 Puissance 4 🟡</h1>
  <div class="options">
    <select id="mode"><option value="ordi">Contre l'ordinateur</option><option value="deux">À deux joueurs</option></select>
    <button class="bouton" id="rejouer">Nouvelle partie</button>
  </div>
  <p id="tour"></p>
  <div class="plateau" id="plateau"></div>
</div>
<script>
const LIGNES = 6, COLONNES = 7;
const NOMS = { rouge: 'Rouge', jaune: 'Jaune' };
let grille, joueur, finie;

function creerPlateau() {
  const plateau = document.getElementById('plateau');
  for (let l = 0; l < LIGNES; l++) for (let c = 0; c < COLONNES; c++) {
    const b = document.createElement('button');
    b.className = 'trou';
    b.dataset.l = l;
    b.dataset.c = c;
    b.setAttribute('aria-label', 'Colonne ' + (c + 1));
    b.addEventListener('click', () => jouerHumain(c));
    plateau.appendChild(b);
  }
}
// La ligne où tombe un jeton dans la colonne c (-1 si elle est pleine).
function ligneLibre(c) { for (let l = LIGNES - 1; l >= 0; l--) if (!grille[l][c]) return l; return -1; }
// Si le jeton en (l, c) fait une ligne de 4, renvoie les cases gagnantes.
function alignement(l, c) {
  const qui = grille[l][c];
  for (const [dl, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
    const cases = [[l, c]];
    for (const sens of [1, -1]) {
      let x = l + dl * sens, y = c + dc * sens;
      while (x >= 0 && x < LIGNES && y >= 0 && y < COLONNES && grille[x][y] === qui) {
        cases.push([x, y]);
        x += dl * sens;
        y += dc * sens;
      }
    }
    if (cases.length >= 4) return cases;
  }
  return null;
}
function poser(c) {
  const l = ligneLibre(c);
  if (l < 0 || finie) return false;
  grille[l][c] = joueur;
  const gagnant = alignement(l, c);
  afficher(gagnant);
  if (gagnant) { finie = true; texte(NOMS[joueur] + ' a gagné ! 🎉'); return true; }
  if (grille[0].every(v => v)) { finie = true; texte('Match nul !'); return true; }
  joueur = joueur === 'rouge' ? 'jaune' : 'rouge';
  texte('Au tour de ' + NOMS[joueur]);
  return true;
}
const contreOrdi = () => document.getElementById('mode').value === 'ordi';
function jouerHumain(c) {
  if (finie || (contreOrdi() && joueur === 'jaune')) return;
  if (poser(c) && !finie && contreOrdi()) setTimeout(jouerOrdi, 400);
}
// L'ordinateur (jaune) : gagner si possible, sinon bloquer, sinon jouer plutôt au centre.
function jouerOrdi() {
  const libres = [];
  for (let c = 0; c < COLONNES; c++) if (ligneLibre(c) >= 0) libres.push(c);
  for (const qui of ['jaune', 'rouge']) {
    for (const c of libres) {
      const l = ligneLibre(c);
      grille[l][c] = qui;
      const aligne = alignement(l, c);
      grille[l][c] = null;
      if (aligne) { poser(c); return; }
    }
  }
  // Ne pas poser un jeton qui permettrait au rouge de gagner juste au-dessus.
  const surs = libres.filter(c => {
    const l = ligneLibre(c);
    if (l === 0) return true;
    grille[l][c] = 'jaune';
    grille[l - 1][c] = 'rouge';
    const danger = alignement(l - 1, c);
    grille[l][c] = null;
    grille[l - 1][c] = null;
    return !danger;
  });
  const choix = (surs.length ? surs : libres).sort((a, b) => Math.abs(a - 3) - Math.abs(b - 3));
  const meilleurs = choix.filter(c => Math.abs(c - 3) === Math.abs(choix[0] - 3));
  poser(meilleurs[Math.floor(Math.random() * meilleurs.length)]);
}
function afficher(gagnant) {
  document.querySelectorAll('.trou').forEach(b => {
    const v = grille[b.dataset.l][b.dataset.c];
    b.className = 'trou' + (v ? ' ' + v : '');
  });
  if (gagnant) gagnant.forEach(([l, c]) => document.querySelector('.trou[data-l="' + l + '"][data-c="' + c + '"]').classList.add('gagnant'));
}
function texte(t) { document.getElementById('tour').textContent = t; }
function nouvellePartie() {
  grille = Array.from({ length: LIGNES }, () => Array(COLONNES).fill(null));
  joueur = 'rouge';
  finie = false;
  afficher();
  texte('Au tour de Rouge : clique sur une colonne');
}
document.getElementById('rejouer').addEventListener('click', nouvellePartie);
document.getElementById('mode').addEventListener('change', nouvellePartie);
creerPlateau();
nouvellePartie();
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'demineur', type: 'exemple', titre: 'Démineur',
  mots: ['demineur', 'mines', 'minesweeper', 'bombes cachees', 'trouver les bombes'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Démineur</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #e0f2fe; color: #0c4a6e; font-family: system-ui, sans-serif; text-align: center; }
  .barre { display: flex; gap: 10px; justify-content: center; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
  .compteur { background: #0c4a6e; color: #fff; border-radius: 10px; padding: 6px 12px; font-weight: 800; min-width: 60px; }
  .grille { display: grid; gap: 3px; margin: 0 auto; width: min(420px, 94vw); }
  .case { aspect-ratio: 1; border: 0; border-radius: 6px; background: #38bdf8; font: inherit; font-weight: 800; font-size: clamp(12px, 3.5vw, 18px); cursor: pointer; padding: 0; color: #0c4a6e; }
  .case.ouverte { background: #f0f9ff; cursor: default; }
  .case.mine { background: #f87171; }
  select, button.bouton { font: inherit; font-weight: 700; border: 0; border-radius: 10px; padding: 8px 12px; }
  button.bouton { background: #0c4a6e; color: #fff; cursor: pointer; }
  #message { min-height: 24px; font-weight: 800; }
  .aide { font-size: 14px; opacity: .8; }
</style>
</head>
<body>
<div>
  <h1>💣 Démineur</h1>
  <div class="barre">
    <select id="niveau"><option value="9,10">Facile (9 × 9)</option><option value="12,22">Moyen (12 × 12)</option><option value="14,35">Difficile (14 × 14)</option></select>
    <span class="compteur">🚩 <span id="drapeaux">0</span></span>
    <span class="compteur">⏱️ <span id="temps">0</span></span>
    <button class="bouton" id="rejouer">😊 Rejouer</button>
  </div>
  <div class="grille" id="grille"></div>
  <p id="message"></p>
  <p class="aide">Clic : ouvrir · Clic droit ou appui long : drapeau 🚩</p>
</div>
<script>
let taille, nbMines, cases, premierClic, finie, drapeaux, secondes, minuteur;
const COULEURS = ['', '#2563eb', '#16a34a', '#dc2626', '#7c3aed', '#b45309', '#0891b2', '#000', '#6b7280'];

function nouvellePartie() {
  [taille, nbMines] = document.getElementById('niveau').value.split(',').map(Number);
  cases = [];
  premierClic = true; finie = false; drapeaux = 0; secondes = 0;
  clearInterval(minuteur);
  const grille = document.getElementById('grille');
  grille.innerHTML = '';
  grille.style.gridTemplateColumns = 'repeat(' + taille + ', 1fr)';
  for (let l = 0; l < taille; l++) for (let c = 0; c < taille; c++) {
    const b = document.createElement('button');
    b.className = 'case';
    const cc = { l, c, mine: false, ouverte: false, drapeau: false, autour: 0, bouton: b };
    cases.push(cc);
    b.addEventListener('click', () => ouvrir(cc));
    b.addEventListener('contextmenu', e => { e.preventDefault(); basculerDrapeau(cc); });
    let appui = null;                            // appui long sur téléphone = drapeau
    b.addEventListener('touchstart', () => { appui = setTimeout(() => { appui = null; basculerDrapeau(cc); }, 450); }, { passive: true });
    b.addEventListener('touchend', e => { if (appui) clearTimeout(appui); else e.preventDefault(); });
    grille.appendChild(b);
  }
  document.getElementById('message').textContent = '';
  document.getElementById('rejouer').textContent = '😊 Rejouer';
  majCompteurs();
}
const voisines = cc => cases.filter(x => x !== cc && Math.abs(x.l - cc.l) <= 1 && Math.abs(x.c - cc.c) <= 1);

// Les mines sont placées au premier clic, jamais sur cette case ni autour.
function placerMines(depart) {
  const interdites = new Set([depart, ...voisines(depart)]);
  const possibles = cases.filter(x => !interdites.has(x));
  for (let i = 0; i < nbMines; i++) possibles.splice(Math.floor(Math.random() * possibles.length), 1)[0].mine = true;
  cases.forEach(x => { x.autour = voisines(x).filter(v => v.mine).length; });
}
function ouvrir(cc) {
  if (finie || cc.ouverte || cc.drapeau) return;
  if (premierClic) {
    premierClic = false;
    placerMines(cc);
    minuteur = setInterval(() => { secondes++; majCompteurs(); }, 1000);
  }
  if (cc.mine) { perdre(cc); return; }
  const pile = [cc];                             // une case à 0 ouvre aussi toutes ses voisines
  while (pile.length) {
    const x = pile.pop();
    if (x.ouverte || x.drapeau) continue;
    x.ouverte = true;
    afficherCase(x);
    if (x.autour === 0) voisines(x).forEach(v => { if (!v.ouverte && !v.mine) pile.push(v); });
  }
  if (cases.every(x => x.mine || x.ouverte)) gagner();
}
function afficherCase(x) {
  const b = x.bouton;
  b.classList.toggle('ouverte', x.ouverte);
  if (x.ouverte) {
    b.textContent = x.mine ? '💣' : x.autour || '';
    b.style.color = COULEURS[x.autour] || '';
  } else b.textContent = x.drapeau ? '🚩' : '';
}
function basculerDrapeau(x) {
  if (finie || x.ouverte) return;
  x.drapeau = !x.drapeau;
  drapeaux += x.drapeau ? 1 : -1;
  afficherCase(x);
  majCompteurs();
}
function perdre(x) {
  finie = true;
  clearInterval(minuteur);
  cases.forEach(c => { if (c.mine) { c.ouverte = true; afficherCase(c); } });
  x.bouton.classList.add('mine');
  document.getElementById('message').textContent = 'Boum ! Tu as touché une mine.';
  document.getElementById('rejouer').textContent = '😵 Rejouer';
}
function gagner() {
  finie = true;
  clearInterval(minuteur);
  document.getElementById('message').textContent = 'Bravo, toutes les mines sont trouvées en ' + secondes + ' s ! 🎉';
  document.getElementById('rejouer').textContent = '😎 Rejouer';
}
function majCompteurs() {
  document.getElementById('drapeaux').textContent = nbMines - drapeaux;
  document.getElementById('temps').textContent = secondes;
}
document.getElementById('rejouer').addEventListener('click', nouvellePartie);
document.getElementById('niveau').addEventListener('change', nouvellePartie);
nouvellePartie();
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'simon', type: 'exemple', titre: 'Simon (retenir une suite de couleurs)',
  mots: ['simon', 'suite de couleurs', 'sequence de couleurs', 'memoire des couleurs', "couleurs qui s'allument", 'repeter la suite'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Simon</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #111827; color: #f9fafb; font-family: system-ui, sans-serif; text-align: center; }
  .simon { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; width: min(340px, 86vw); margin: 16px auto; }
  .pad { aspect-ratio: 1; border: 0; border-radius: 24px; opacity: .45; cursor: pointer; transition: opacity .1s, transform .1s; }
  .pad.allume { opacity: 1; transform: scale(1.04); box-shadow: 0 0 30px currentColor; }
  #vert { background: #22c55e; color: #22c55e; border-top-left-radius: 120px; }
  #rouge { background: #ef4444; color: #ef4444; border-top-right-radius: 120px; }
  #jaune { background: #eab308; color: #eab308; border-bottom-left-radius: 120px; }
  #bleu { background: #3b82f6; color: #3b82f6; border-bottom-right-radius: 120px; }
  button.bouton { font: inherit; font-weight: 800; border: 0; border-radius: 12px; padding: 12px 22px; background: #f9fafb; color: #111827; cursor: pointer; }
  #info { min-height: 26px; font-weight: 700; }
</style>
</head>
<body>
<div>
  <h1>🎵 Simon</h1>
  <p>Regarde la suite de couleurs, puis répète-la. Elle s'allonge à chaque tour !</p>
  <div class="simon">
    <button class="pad" id="vert" aria-label="Vert"></button>
    <button class="pad" id="rouge" aria-label="Rouge"></button>
    <button class="pad" id="jaune" aria-label="Jaune"></button>
    <button class="pad" id="bleu" aria-label="Bleu"></button>
  </div>
  <p id="info">Clique sur Jouer pour commencer.</p>
  <p>Record : <b id="record">0</b></p>
  <button class="bouton" id="jouer">▶ Jouer</button>
</div>
<script>
const COULEURS = ['vert', 'rouge', 'jaune', 'bleu'];
const NOTES = { vert: 392, rouge: 330, jaune: 262, bleu: 196 };   // fréquences en hertz
let suite = [], position = 0, aMoi = false, audio = null;
let record = Number(localStorage.getItem('simon-record')) || 0;
document.getElementById('record').textContent = record;

function son(frequence, duree) {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audio.createOscillator();
    const volume = audio.createGain();
    osc.type = 'triangle';
    osc.frequency.value = frequence;
    volume.gain.setValueAtTime(0.2, audio.currentTime);
    volume.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duree);
    osc.connect(volume).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + duree);
  } catch (e) { /* pas de son : le jeu marche quand même */ }
}
const attendre = ms => new Promise(r => setTimeout(r, ms));
async function allumer(couleur, duree) {
  const pad = document.getElementById(couleur);
  pad.classList.add('allume');
  son(NOTES[couleur], duree / 1000);
  await attendre(duree);
  pad.classList.remove('allume');
}
async function montrerSuite() {
  aMoi = false;
  info('Regarde bien…');
  await attendre(600);
  const vitesse = Math.max(250, 600 - suite.length * 25);   // de plus en plus vite
  for (const c of suite) { await allumer(c, vitesse); await attendre(120); }
  aMoi = true;
  position = 0;
  info('À toi ! (' + suite.length + ' couleur' + (suite.length > 1 ? 's' : '') + ')');
}
function tourSuivant() {
  suite.push(COULEURS[Math.floor(Math.random() * COULEURS.length)]);
  montrerSuite();
}
async function appui(couleur) {
  if (!aMoi) return;
  allumer(couleur, 250);
  if (couleur !== suite[position]) {
    aMoi = false;
    son(110, 0.6);
    const score = suite.length - 1;
    if (score > record) { record = score; localStorage.setItem('simon-record', record); }
    document.getElementById('record').textContent = record;
    info('Raté ! Score : ' + score);
    document.getElementById('jouer').textContent = '↻ Rejouer';
    return;
  }
  position++;
  if (position === suite.length) {
    aMoi = false;
    info('Bravo ! Score : ' + suite.length);
    await attendre(700);
    tourSuivant();
  }
}
function info(t) { document.getElementById('info').textContent = t; }
COULEURS.forEach(c => document.getElementById(c).addEventListener('click', () => appui(c)));
document.addEventListener('keydown', e => {
  const touches = { 1: 'vert', 2: 'rouge', 3: 'jaune', 4: 'bleu' };
  if (touches[e.key]) appui(touches[e.key]);
});
document.getElementById('jouer').addEventListener('click', () => { suite = []; tourSuivant(); });
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'labyrinthe', type: 'exemple', titre: 'Labyrinthe (généré au hasard, de plus en plus grand)',
  mots: ['labyrinthe', 'labyrinthes', 'maze', 'dedale', 'trouver la sortie'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Labyrinthe</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #1c1917; color: #fafaf9; font-family: system-ui, sans-serif; text-align: center; }
  canvas { background: #292524; border-radius: 12px; width: min(440px, 92vw); touch-action: none; }
  .barre { display: flex; gap: 14px; justify-content: center; align-items: center; margin: 8px 0; flex-wrap: wrap; font-weight: 700; }
  button { font: inherit; font-weight: 700; border: 0; border-radius: 10px; padding: 10px 14px; background: #44403c; color: #fff; cursor: pointer; touch-action: manipulation; }
  .fleches { display: grid; grid-template-columns: repeat(3, 56px); gap: 6px; justify-content: center; margin-top: 10px; }
</style>
</head>
<body>
<div>
  <h1>🧭 Labyrinthe</h1>
  <div class="barre"><span id="info">Niveau 1</span><span>⏱️ <span id="temps">0</span> s</span><button id="nouveau">Recommencer</button></div>
  <canvas id="jeu" width="440" height="440"></canvas>
  <div class="fleches">
    <span></span><button data-d="haut" aria-label="Haut">⬆️</button><span></span>
    <button data-d="gauche" aria-label="Gauche">⬅️</button><button data-d="bas" aria-label="Bas">⬇️</button><button data-d="droite" aria-label="Droite">➡️</button>
  </div>
  <p>Guide la souris 🐭 jusqu'au fromage 🧀 avec les flèches.</p>
</div>
<script>
const canvas = document.getElementById('jeu');
const ctx = canvas.getContext('2d');
const DIRS = { haut: [0, -1, 0], droite: [1, 0, 1], bas: [0, 1, 2], gauche: [-1, 0, 3] };   // dx, dy, numéro du mur
let niveau = 1, taille, murs, joueur, secondes, minuteur, gagne;

// Chaque case a 4 murs [haut, droite, bas, gauche]. On creuse les passages en partant
// de la case 0 et en avançant au hasard, en revenant en arrière quand on est coincé.
function generer(n) {
  murs = Array.from({ length: n * n }, () => [true, true, true, true]);
  const vu = new Array(n * n).fill(false);
  const pile = [0];
  vu[0] = true;
  while (pile.length) {
    const i = pile[pile.length - 1];
    const x = i % n, y = Math.floor(i / n);
    const choix = Object.values(DIRS).filter(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      return nx >= 0 && nx < n && ny >= 0 && ny < n && !vu[ny * n + nx];
    });
    if (!choix.length) { pile.pop(); continue; }
    const [dx, dy, m] = choix[Math.floor(Math.random() * choix.length)];
    const j = (y + dy) * n + (x + dx);
    murs[i][m] = false;                          // on casse le mur des deux côtés
    murs[j][(m + 2) % 4] = false;
    vu[j] = true;
    pile.push(j);
  }
}
function nouveau() {
  taille = Math.min(30, 6 + niveau * 2);
  generer(taille);
  joueur = { x: 0, y: 0 };
  secondes = 0;
  gagne = false;
  clearInterval(minuteur);
  minuteur = setInterval(() => { secondes++; document.getElementById('temps').textContent = secondes; }, 1000);
  document.getElementById('info').textContent = 'Niveau ' + niveau;
  document.getElementById('temps').textContent = 0;
  dessiner();
}
function dessiner() {
  const c = canvas.width / taille;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#16a34a';
  ctx.fillRect((taille - 1) * c + 3, (taille - 1) * c + 3, c - 6, c - 6);   // la sortie
  ctx.strokeStyle = '#fafaf9';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  murs.forEach(([h, d, b, g], i) => {
    const x = (i % taille) * c, y = Math.floor(i / taille) * c;
    if (h) { ctx.moveTo(x, y); ctx.lineTo(x + c, y); }
    if (d) { ctx.moveTo(x + c, y); ctx.lineTo(x + c, y + c); }
    if (b) { ctx.moveTo(x, y + c); ctx.lineTo(x + c, y + c); }
    if (g) { ctx.moveTo(x, y); ctx.lineTo(x, y + c); }
  });
  ctx.stroke();
  ctx.font = Math.floor(c * 0.7) + 'px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (!gagne) ctx.fillText('🧀', (taille - 1) * c + c / 2, (taille - 1) * c + c / 2 + 1);
  ctx.fillText('🐭', joueur.x * c + c / 2, joueur.y * c + c / 2 + 1);
}
function bouger(nom) {
  if (gagne) return;
  const [dx, dy, m] = DIRS[nom];
  if (murs[joueur.y * taille + joueur.x][m]) return;   // un mur bloque le passage
  joueur.x += dx;
  joueur.y += dy;
  if (joueur.x === taille - 1 && joueur.y === taille - 1) {
    gagne = true;
    clearInterval(minuteur);
    document.getElementById('info').textContent = 'Bravo ! Sortie trouvée en ' + secondes + ' s 🎉';
    niveau++;
    setTimeout(nouveau, 1500);
  }
  dessiner();
}
document.addEventListener('keydown', e => {
  const t = { ArrowUp: 'haut', ArrowDown: 'bas', ArrowLeft: 'gauche', ArrowRight: 'droite' };
  if (t[e.key]) { e.preventDefault(); bouger(t[e.key]); }
});
document.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => bouger(b.dataset.d)));
document.getElementById('nouveau').addEventListener('click', () => { niveau = 1; nouveau(); });
nouveau();
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'tir-spatial', type: 'exemple', titre: 'Défense spatiale (vaisseau qui tire sur des aliens)',
  mots: ['space invaders', 'vaisseau qui tire', 'vaisseau spatial', 'tirer sur', 'tire sur', 'aliens', 'extraterrestres', 'envahisseurs', 'jeu de tir', 'shooter', 'shoot', 'defense spatiale'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Défense spatiale</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #020617; color: #e2e8f0; font-family: system-ui, sans-serif; text-align: center; }
  canvas { background: radial-gradient(ellipse at top, #1e1b4b, #020617); border-radius: 12px; width: min(480px, 94vw); touch-action: none; display: block; margin: 0 auto; }
  .infos { display: flex; justify-content: space-between; font-weight: 700; width: min(480px, 94vw); margin: 0 auto 6px; }
  .tactile { display: flex; gap: 8px; justify-content: center; margin-top: 10px; }
  button { font: inherit; font-weight: 700; border: 0; border-radius: 12px; padding: 12px 18px; background: #334155; color: #fff; touch-action: manipulation; user-select: none; }
  #feu { background: #e11d48; }
</style>
</head>
<body>
<div>
  <h1>🚀 Défense spatiale</h1>
  <div class="infos"><span>Score : <b id="score">0</b></span><span>Vies : <b id="vies">❤️❤️❤️</b></span><span>Record : <b id="record">0</b></span></div>
  <canvas id="jeu" width="480" height="560"></canvas>
  <div class="tactile"><button id="g" aria-label="Gauche">⬅️</button><button id="feu">🔥 Tirer</button><button id="d" aria-label="Droite">➡️</button></div>
  <p>Flèches pour bouger, Espace pour tirer, Entrée pour commencer.</p>
</div>
<script>
const canvas = document.getElementById('jeu');
const ctx = canvas.getContext('2d');
const L = canvas.width, H = canvas.height;
const touches = {};
let joueur = { x: L / 2, y: H - 50 }, tirs = [], ennemis = [], particules = [];
let score = 0, vies = 3, etat = 'menu', dernierTir = 0, apparition = 0, avant;
let record = Number(localStorage.getItem('spatial-record')) || 0;
document.getElementById('record').textContent = record;
const etoiles = Array.from({ length: 60 }, () => ({ x: Math.random() * L, y: Math.random() * H, v: 0.5 + Math.random() * 2 }));

function commencer() {
  joueur = { x: L / 2, y: H - 50 };
  tirs = []; ennemis = []; particules = [];
  score = 0; vies = 3; etat = 'jeu'; apparition = 0;
  majInfos();
}
function tirer(t) {
  if (etat !== 'jeu' || t - dernierTir < 250) return;   // un tir tous les quarts de seconde au plus
  dernierTir = t;
  tirs.push({ x: joueur.x, y: joueur.y - 20 });
}
function exploser(x, y, couleur) {
  for (let i = 0; i < 20; i++) {
    const a = Math.random() * Math.PI * 2, v = 1 + Math.random() * 3;
    particules.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vie: 1, couleur });
  }
}
// dt vaut 1 pour une image à 60 images par seconde : le jeu a la même vitesse partout.
function mettreAJour(t, dt) {
  for (const e of etoiles) { e.y += e.v * dt; if (e.y > H) { e.y = 0; e.x = Math.random() * L; } }
  for (const p of particules) { p.x += p.vx * dt; p.y += p.vy * dt; p.vie -= 0.03 * dt; }
  particules = particules.filter(p => p.vie > 0);
  if (etat !== 'jeu') return;
  if (touches.ArrowLeft) joueur.x -= 6 * dt;
  if (touches.ArrowRight) joueur.x += 6 * dt;
  joueur.x = Math.max(20, Math.min(L - 20, joueur.x));
  if (touches[' ']) tirer(t);
  for (const tir of tirs) tir.y -= 9 * dt;
  tirs = tirs.filter(tir => tir.y > -10);
  apparition -= dt;
  if (apparition <= 0) {                          // de plus en plus d'ennemis avec le score
    const soucoupe = Math.random() < 0.15;
    ennemis.push({ x: 20 + Math.random() * (L - 40), y: -20, v: 1.2 + Math.random() * 1.2 + score / 400, emoji: soucoupe ? '🛸' : '👾', points: soucoupe ? 30 : 10 });
    apparition = Math.max(18, 60 - score / 20);
  }
  for (const e of ennemis) {
    e.y += e.v * dt;
    for (const tir of tirs) {
      if (!e.touche && Math.abs(tir.x - e.x) < 18 && Math.abs(tir.y - e.y) < 18) {
        e.touche = true;
        tir.y = -100;
        score += e.points;
        exploser(e.x, e.y, e.points > 10 ? '#22d3ee' : '#a3e635');
      }
    }
    const surLeJoueur = Math.abs(e.x - joueur.x) < 26 && Math.abs(e.y - joueur.y) < 26;
    if (!e.touche && (e.y > H + 10 || surLeJoueur)) {
      e.touche = true;
      vies--;
      exploser(joueur.x, joueur.y, '#f43f5e');
      if (vies <= 0) finPartie();
    }
  }
  ennemis = ennemis.filter(e => !e.touche);
  majInfos();
}
function finPartie() {
  etat = 'fin';
  if (score > record) { record = score; localStorage.setItem('spatial-record', record); }
  document.getElementById('record').textContent = record;
}
function majInfos() {
  document.getElementById('score').textContent = score;
  document.getElementById('vies').textContent = vies > 0 ? '❤️'.repeat(vies) : '💀';
}
function dessiner() {
  ctx.clearRect(0, 0, L, H);
  ctx.fillStyle = '#fff';
  for (const e of etoiles) ctx.fillRect(e.x, e.y, e.v, e.v);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (etat === 'jeu') { ctx.font = '36px serif'; ctx.fillText('🚀', joueur.x, joueur.y); }
  ctx.fillStyle = '#fde047';
  for (const tir of tirs) ctx.fillRect(tir.x - 2, tir.y - 8, 4, 14);
  ctx.font = '30px serif';
  for (const e of ennemis) ctx.fillText(e.emoji, e.x, e.y);
  for (const p of particules) { ctx.globalAlpha = Math.max(0, p.vie); ctx.fillStyle = p.couleur; ctx.fillRect(p.x, p.y, 3, 3); }
  ctx.globalAlpha = 1;
  if (etat !== 'jeu') {
    ctx.fillStyle = 'rgba(2, 6, 23, 0.6)';
    ctx.fillRect(0, 0, L, H);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px system-ui';
    ctx.fillText(etat === 'menu' ? 'Défends la Terre !' : 'Partie terminée : ' + score + ' points', L / 2, H / 2 - 20);
    ctx.font = '18px system-ui';
    ctx.fillText('Entrée ou 🔥 pour jouer', L / 2, H / 2 + 20);
  }
}
function boucle(t) {
  const dt = Math.min(3, (t - (avant || t)) / 16.67);
  avant = t;
  mettreAJour(t, dt);
  dessiner();
  requestAnimationFrame(boucle);
}
document.addEventListener('keydown', e => {
  touches[e.key] = true;
  if ([' ', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
  if (e.key === 'Enter' && etat !== 'jeu') commencer();
});
document.addEventListener('keyup', e => { touches[e.key] = false; });
// Boutons à l'écran : la touche reste enfoncée tant que le doigt appuie.
function maintenir(id, touche) {
  const b = document.getElementById(id);
  b.addEventListener('pointerdown', e => { e.preventDefault(); touches[touche] = true; if (id === 'feu' && etat !== 'jeu') commencer(); });
  for (const fin of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(fin, () => { touches[touche] = false; });
}
maintenir('g', 'ArrowLeft');
maintenir('d', 'ArrowRight');
maintenir('feu', ' ');
requestAnimationFrame(boucle);
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'course', type: 'exemple', titre: 'Course de voitures sur l’autoroute',
  mots: ['course de voitures', 'course de voiture', 'voiture', 'voitures', 'jeu de voiture', 'autoroute', 'circuit', 'conduire', 'karting', 'route'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Course sur l'autoroute</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #14532d; color: #fff; font-family: system-ui, sans-serif; text-align: center; }
  canvas { border-radius: 12px; width: min(360px, 90vw); touch-action: none; display: block; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,.4); }
  .infos { display: flex; justify-content: space-between; width: min(360px, 90vw); margin: 0 auto 6px; font-weight: 700; }
  .tactile { display: flex; gap: 10px; justify-content: center; margin-top: 10px; }
  button { font: inherit; font-weight: 800; border: 0; border-radius: 12px; padding: 12px 20px; background: #fff; color: #14532d; touch-action: manipulation; cursor: pointer; }
</style>
</head>
<body>
<div>
  <h1>🏎️ Course sur l'autoroute</h1>
  <div class="infos"><span>Distance : <b id="distance">0</b> m</span><span>Record : <b id="record">0</b> m</span></div>
  <canvas id="route" width="360" height="560"></canvas>
  <div class="tactile"><button id="gauche" aria-label="Voie de gauche">⬅️</button><button id="go">▶ Jouer</button><button id="droite" aria-label="Voie de droite">➡️</button></div>
  <p>Change de voie avec les flèches et évite les voitures !</p>
</div>
<script>
const canvas = document.getElementById('route');
const ctx = canvas.getContext('2d');
const L = canvas.width, H = canvas.height, Y_JOUEUR = H - 80;
const VOIES = [L / 6, L / 2, L * 5 / 6];
const COULEURS = ['#3b82f6', '#facc15', '#a855f7', '#f97316', '#e5e7eb'];
let voie = 1, xJoueur = VOIES[1], obstacles = [], distance = 0, vitesse = 4, marquage = 0, prochain = 40;
let partie = 'menu', avant;                       // 'menu', 'jeu', 'pause' ou 'accident'
let record = Number(localStorage.getItem('course-record')) || 0;
document.getElementById('record').textContent = record;

function commencer() {
  voie = 1; xJoueur = VOIES[1];
  obstacles = []; distance = 0; vitesse = 4; prochain = 40;
  partie = 'jeu';
  document.getElementById('go').textContent = '⏸ Pause';
}
function boutonGo() {
  if (partie === 'jeu') { partie = 'pause'; document.getElementById('go').textContent = '▶ Reprendre'; }
  else if (partie === 'pause') { partie = 'jeu'; document.getElementById('go').textContent = '⏸ Pause'; }
  else commencer();
}
function changerVoie(d) { if (partie === 'jeu') voie = Math.max(0, Math.min(2, voie + d)); }

function mettreAJour(dt) {
  if (partie !== 'jeu') return;
  vitesse = 4 + distance / 600;                   // ça accélère petit à petit
  distance += vitesse * dt / 3;
  marquage = (marquage + vitesse * dt) % 40;
  xJoueur += (VOIES[voie] - xJoueur) * Math.min(1, 0.25 * dt);   // la voiture glisse vers sa voie
  prochain -= dt;
  if (prochain <= 0) {
    const libre = Math.floor(Math.random() * 3);   // toujours au moins une voie libre
    for (let v = 0; v < 3; v++) {
      if (v !== libre && Math.random() < 0.55) obstacles.push({ x: VOIES[v], y: -40, couleur: COULEURS[Math.floor(Math.random() * COULEURS.length)] });
    }
    prochain = Math.max(28, 70 - distance / 60);
  }
  for (const o of obstacles) o.y += vitesse * 0.8 * dt;
  obstacles = obstacles.filter(o => o.y < H + 40);
  if (obstacles.some(o => Math.abs(o.x - xJoueur) < 34 && Math.abs(o.y - Y_JOUEUR) < 58)) {
    partie = 'accident';
    const d = Math.floor(distance);
    if (d > record) { record = d; localStorage.setItem('course-record', record); }
    document.getElementById('record').textContent = record;
    document.getElementById('go').textContent = '↻ Rejouer';
  }
  document.getElementById('distance').textContent = Math.floor(distance);
}
function voiture(x, y, couleur) {
  ctx.fillStyle = '#111';
  ctx.fillRect(x - 21, y - 22, 4, 12); ctx.fillRect(x + 17, y - 22, 4, 12);   // roues
  ctx.fillRect(x - 21, y + 10, 4, 12); ctx.fillRect(x + 17, y + 10, 4, 12);
  ctx.fillStyle = couleur;
  ctx.beginPath();
  ctx.roundRect(x - 18, y - 30, 36, 60, 8);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.fillRect(x - 13, y - 18, 26, 12);           // pare-brise
}
function dessiner() {
  ctx.fillStyle = '#374151';
  ctx.fillRect(0, 0, L, H);
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(0, 0, 8, H);
  ctx.fillRect(L - 8, 0, 8, H);
  ctx.fillStyle = '#f9fafb';
  for (const x of [L / 3, L * 2 / 3]) for (let y = marquage - 40; y < H; y += 40) ctx.fillRect(x - 2, y, 4, 22);
  for (const o of obstacles) voiture(o.x, o.y, o.couleur);
  voiture(xJoueur, Y_JOUEUR, '#ef4444');
  if (partie !== 'jeu') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, L, H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 26px system-ui';
    const titres = { menu: 'Prêt à rouler ?', pause: 'Pause', accident: 'Accident ! ' + Math.floor(distance) + ' m' };
    ctx.fillText(titres[partie], L / 2, H / 2 - 10);
    ctx.font = '17px system-ui';
    ctx.fillText(partie === 'pause' ? 'Espace pour reprendre' : 'Espace ou ▶ pour jouer', L / 2, H / 2 + 24);
  }
}
function boucle(t) {
  const dt = Math.min(3, (t - (avant || t)) / 16.67);
  avant = t;
  mettreAJour(dt);
  dessiner();
  requestAnimationFrame(boucle);
}
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') { e.preventDefault(); changerVoie(-1); }
  if (e.key === 'ArrowRight') { e.preventDefault(); changerVoie(1); }
  if (e.key === ' ') { e.preventDefault(); boutonGo(); }
});
document.getElementById('gauche').addEventListener('click', () => changerVoie(-1));
document.getElementById('droite').addEventListener('click', () => changerVoie(1));
document.getElementById('go').addEventListener('click', boutonGo);
requestAnimationFrame(boucle);
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'pixel-art', type: 'exemple', titre: 'Éditeur de pixel art',
  mots: ['pixel art', 'pixel', 'pixels', 'dessin en pixels', 'dessiner en pixels', 'editeur de sprite', 'sprite'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pixel art</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #fdf4ff; color: #4a044e; font-family: system-ui, sans-serif; text-align: center; }
  .atelier { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; align-items: flex-start; padding: 16px; }
  .grille { display: grid; grid-template-columns: repeat(16, 1fr); width: min(416px, 92vw); aspect-ratio: 1; background: #e9d5ff; gap: 1px; border: 1px solid #e9d5ff; touch-action: none; user-select: none; cursor: crosshair; }
  .pixel { background: #fff; }
  .outils { display: flex; flex-direction: column; gap: 8px; }
  .palette { display: grid; grid-template-columns: repeat(4, 36px); gap: 6px; }
  .couleur { width: 36px; height: 36px; border-radius: 8px; border: 3px solid #f5d0fe; cursor: pointer; padding: 0; }
  .couleur.choisie { border-color: #4a044e; transform: scale(1.1); }
  button.outil { font: inherit; font-weight: 700; border: 0; border-radius: 10px; padding: 9px 12px; background: #a21caf; color: #fff; cursor: pointer; }
  button.outil.actif { background: #4a044e; }
  label { font-size: 14px; }
</style>
</head>
<body>
<div>
  <h1>🎨 Pixel art</h1>
  <div class="atelier">
    <div class="grille" id="grille"></div>
    <div class="outils">
      <div class="palette" id="palette"></div>
      <label>Autre couleur <input type="color" id="perso" value="#22c55e"></label>
      <button class="outil actif" id="crayon">✏️ Crayon</button>
      <button class="outil" id="gomme">🧽 Gomme</button>
      <button class="outil" id="pot">🪣 Remplir</button>
      <button class="outil" id="effacer">🗑️ Tout effacer</button>
      <button class="outil" id="png">💾 Télécharger en PNG</button>
    </div>
  </div>
</div>
<script>
const N = 16, BLANC = '#ffffff';
const PALETTE = ['#000000', '#ffffff', '#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#78350f', '#6b7280', '#0ea5e9'];
let couleur = PALETTE[0], outil = 'crayon', dessine = false;
let pixels;
try { pixels = JSON.parse(localStorage.getItem('pixel-art')); } catch (e) { pixels = null; }
if (!Array.isArray(pixels) || pixels.length !== N * N) pixels = Array(N * N).fill(BLANC);

const grille = document.getElementById('grille');
for (let i = 0; i < N * N; i++) {
  const d = document.createElement('div');
  d.className = 'pixel';
  d.dataset.i = i;
  grille.appendChild(d);
}
function afficher() { grille.querySelectorAll('.pixel').forEach((d, i) => { d.style.background = pixels[i]; }); }
function sauver() { localStorage.setItem('pixel-art', JSON.stringify(pixels)); }
// Le pot de peinture remplit toute la zone de la même couleur (on avance de voisin en voisin).
function remplir(depart, ancienne, nouvelle) {
  if (ancienne === nouvelle) return;
  const pile = [depart];
  while (pile.length) {
    const i = pile.pop();
    if (pixels[i] !== ancienne) continue;
    pixels[i] = nouvelle;
    const x = i % N, y = Math.floor(i / N);
    if (x > 0) pile.push(i - 1);
    if (x < N - 1) pile.push(i + 1);
    if (y > 0) pile.push(i - N);
    if (y < N - 1) pile.push(i + N);
  }
}
function peindre(i) {
  if (outil === 'pot') remplir(i, pixels[i], couleur);
  else pixels[i] = outil === 'gomme' ? BLANC : couleur;
  afficher();
}
function pixelSous(e) {
  const el = document.elementFromPoint(e.clientX, e.clientY);
  return el && el.classList.contains('pixel') ? Number(el.dataset.i) : -1;
}
grille.addEventListener('pointerdown', e => { dessine = true; const i = pixelSous(e); if (i >= 0) peindre(i); });
grille.addEventListener('pointermove', e => { if (!dessine || outil === 'pot') return; const i = pixelSous(e); if (i >= 0) peindre(i); });
window.addEventListener('pointerup', () => { if (dessine) { dessine = false; sauver(); } });

const palette = document.getElementById('palette');
PALETTE.forEach(c => {
  const b = document.createElement('button');
  b.className = 'couleur' + (c === couleur ? ' choisie' : '');
  b.style.background = c;
  b.setAttribute('aria-label', 'Couleur ' + c);
  b.addEventListener('click', () => choisirCouleur(c, b));
  palette.appendChild(b);
});
function choisirCouleur(c, bouton) {
  couleur = c;
  palette.querySelectorAll('.couleur').forEach(x => x.classList.toggle('choisie', x === bouton));
  if (outil === 'gomme') choisirOutil('crayon');
}
document.getElementById('perso').addEventListener('input', e => choisirCouleur(e.target.value, null));
function choisirOutil(o) {
  outil = o;
  ['crayon', 'gomme', 'pot'].forEach(id => document.getElementById(id).classList.toggle('actif', id === o));
}
['crayon', 'gomme', 'pot'].forEach(id => document.getElementById(id).addEventListener('click', () => choisirOutil(id)));
document.getElementById('effacer').addEventListener('click', () => {
  if (!confirm('Effacer tout le dessin ?')) return;
  pixels.fill(BLANC);
  afficher();
  sauver();
});
document.getElementById('png').addEventListener('click', () => {
  const c = document.createElement('canvas');
  const z = 20;                                   // chaque pixel devient un carré de 20 x 20
  c.width = c.height = N * z;
  const x = c.getContext('2d');
  pixels.forEach((p, i) => { x.fillStyle = p; x.fillRect((i % N) * z, Math.floor(i / N) * z, z, z); });
  const lien = document.createElement('a');
  lien.href = c.toDataURL('image/png');
  lien.download = 'pixel-art.png';
  lien.click();
});
afficher();
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'feu-artifice', type: 'exemple', titre: "Feu d'artifice interactif",
  mots: ["feu d'artifice", "feux d'artifice", 'fusee', 'fusees', 'celebration', 'artifice'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Feu d'artifice</title>
<style>
  html, body { margin: 0; height: 100%; background: #000; overflow: hidden; font-family: system-ui, sans-serif; }
  canvas { display: block; width: 100%; height: 100%; touch-action: none; }
  .titre { position: fixed; top: 12px; left: 0; right: 0; text-align: center; color: #fff; pointer-events: none; text-shadow: 0 2px 8px #000; }
  .titre h1 { margin: 0; font-size: clamp(22px, 5vw, 40px); }
  button { position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); font: inherit; font-weight: 800; border: 0; border-radius: 999px; padding: 12px 22px; background: #fff; color: #000; cursor: pointer; }
</style>
</head>
<body>
<canvas id="ciel"></canvas>
<div class="titre"><h1>🎆 Feu d'artifice 🎆</h1><p>Clique ou touche le ciel pour lancer une fusée</p></div>
<button id="auto">Spectacle automatique : oui</button>
<script>
const canvas = document.getElementById('ciel');
const ctx = canvas.getContext('2d');
let L, H, fusees = [], etincelles = [], auto = true, prochaine = 0;
function adapter() { L = canvas.width = innerWidth; H = canvas.height = innerHeight; }
addEventListener('resize', adapter);
adapter();

function lancer(xCible, yCible) {
  const x = L / 2 + (Math.random() - 0.5) * L * 0.3;
  fusees.push({ depart: { x, y: H }, x, y: H, xCible, yCible, t: 0, vitesse: 0.035 + Math.random() * 0.015, teinte: Math.floor(Math.random() * 360) });
}
function exploser(f) {
  const n = 80;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, v = 2 + Math.random() * 3;
    etincelles.push({ x: f.x, y: f.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vie: 1, teinte: f.teinte + Math.random() * 40 - 20 });
  }
}
function image() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';           // on efface à moitié : ça laisse des traînées
  ctx.fillRect(0, 0, L, H);
  if (auto && --prochaine <= 0) {
    lancer(L * (0.15 + Math.random() * 0.7), H * (0.15 + Math.random() * 0.35));
    prochaine = 25 + Math.random() * 40;
  }
  for (const f of fusees) {
    f.t = Math.min(1, f.t + f.vitesse);
    const e = 1 - Math.pow(1 - f.t, 2);            // la fusée ralentit en montant
    f.x = f.depart.x + (f.xCible - f.depart.x) * e;
    f.y = f.depart.y + (f.yCible - f.depart.y) * e;
    ctx.fillStyle = 'hsl(' + f.teinte + ', 100%, 75%)';
    ctx.fillRect(f.x - 2, f.y - 2, 4, 4);
    if (f.t >= 1) { exploser(f); f.finie = true; }
  }
  fusees = fusees.filter(f => !f.finie);
  for (const p of etincelles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05;                                  // gravité
    p.vx *= 0.985;
    p.vy *= 0.985;
    p.vie -= 0.012;
    ctx.globalAlpha = Math.max(0, p.vie);
    ctx.fillStyle = 'hsl(' + p.teinte + ', 100%, 60%)';
    ctx.fillRect(p.x, p.y, 3, 3);
  }
  ctx.globalAlpha = 1;
  etincelles = etincelles.filter(p => p.vie > 0);
  requestAnimationFrame(image);
}
canvas.addEventListener('pointerdown', e => lancer(e.clientX, e.clientY));
document.getElementById('auto').addEventListener('click', e => {
  auto = !auto;
  e.target.textContent = 'Spectacle automatique : ' + (auto ? 'oui' : 'non');
});
image();
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'equipes', type: 'exemple', titre: "Générateur d'équipes au hasard",
  mots: ['equipes', 'faire des equipes', "generateur d'equipes", 'former des equipes', 'repartir les joueurs', 'composer des equipes'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Générateur d'équipes</title>
<style>
  body { margin: 0; min-height: 100vh; background: #f0fdf4; color: #14532d; font-family: system-ui, sans-serif; }
  main { max-width: 760px; margin: 0 auto; padding: 20px 16px; }
  textarea { width: 100%; min-height: 160px; font: inherit; padding: 12px; border-radius: 12px; border: 2px solid #bbf7d0; box-sizing: border-box; }
  .reglages { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin: 12px 0; }
  input[type=number] { font: inherit; padding: 8px; border-radius: 10px; border: 2px solid #bbf7d0; width: 70px; }
  button { font: inherit; font-weight: 800; border: 0; border-radius: 12px; padding: 10px 16px; background: #16a34a; color: #fff; cursor: pointer; }
  button.secondaire { background: #dcfce7; color: #14532d; }
  .equipes { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-top: 16px; }
  .equipe { background: #fff; border-radius: 16px; padding: 14px; box-shadow: 0 4px 14px rgba(20,83,45,.1); animation: arrive .3s ease-out both; }
  .equipe h2 { margin: 0 0 8px; font-size: 18px; }
  .equipe ul { margin: 0; padding-left: 20px; }
  @keyframes arrive { from { opacity: 0; transform: translateY(10px); } }
  #info { font-weight: 700; min-height: 22px; }
</style>
</head>
<body>
<main>
  <h1>🎲 Générateur d'équipes</h1>
  <p>Écris un prénom ou un pseudo par ligne, choisis le nombre d'équipes, et le hasard fait le reste !</p>
  <textarea id="noms" placeholder="Un nom par ligne" aria-label="Les joueurs, un par ligne"></textarea>
  <div class="reglages">
    <label>Nombre d'équipes <input type="number" id="nombre" min="2" max="20" value="4"></label>
    <button id="faire">Faire les équipes</button>
    <button class="secondaire" id="exemple">Exemple</button>
    <button class="secondaire" id="copier">📋 Copier</button>
  </div>
  <p id="info" role="status"></p>
  <div class="equipes" id="equipes"></div>
</main>
<script>
const NOMS_EQUIPES = ['🔴 Les Dragons', '🔵 Les Requins', '🟢 Les Cactus', '🟡 Les Éclairs', '🟣 Les Licornes', '🟠 Les Tigres', '⚫ Les Ninjas', '⚪ Les Fantômes'];
const zone = document.getElementById('noms');
zone.value = localStorage.getItem('equipes-noms') || '';
zone.addEventListener('input', () => localStorage.setItem('equipes-noms', zone.value));
let dernieres = [];
const nomEquipe = i => NOMS_EQUIPES[i] || 'Équipe ' + (i + 1);

// Mélange de Fisher-Yates : chaque ordre a exactement la même chance.
function melanger(liste) {
  const t = liste.slice();
  for (let i = t.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [t[i], t[j]] = [t[j], t[i]];
  }
  return t;
}
function faireEquipes() {
  const noms = zone.value.split(/\\r?\\n/).map(n => n.trim()).filter(n => n);
  const nombre = Math.max(2, Math.min(20, Number(document.getElementById('nombre').value) || 2));
  if (noms.length < nombre) { info('Il faut au moins ' + nombre + ' noms pour faire ' + nombre + ' équipes.'); return; }
  const doublons = noms.filter((n, i) => noms.indexOf(n) !== i);
  const equipes = Array.from({ length: nombre }, () => []);
  melanger(noms).forEach((nom, i) => equipes[i % nombre].push(nom));   // on distribue comme des cartes
  dernieres = equipes;
  afficher(equipes);
  info(noms.length + ' joueurs répartis en ' + nombre + ' équipes' + (doublons.length ? ' (attention, en double : ' + doublons.join(', ') + ')' : '') + '.');
}
function afficher(equipes) {
  const box = document.getElementById('equipes');
  box.innerHTML = '';
  equipes.forEach((membres, i) => {
    const carte = document.createElement('section');
    carte.className = 'equipe';
    carte.style.animationDelay = (i * 0.08) + 's';
    const h = document.createElement('h2');
    h.textContent = nomEquipe(i) + ' (' + membres.length + ')';
    const ul = document.createElement('ul');
    membres.forEach(m => { const li = document.createElement('li'); li.textContent = m; ul.appendChild(li); });
    carte.append(h, ul);
    box.appendChild(carte);
  });
}
function info(t) { document.getElementById('info').textContent = t; }
document.getElementById('faire').addEventListener('click', faireEquipes);
document.getElementById('exemple').addEventListener('click', () => {
  zone.value = ['Léa', 'Tom', 'Inès', 'Hugo', 'Emma', 'Adam', 'Jade', 'Louis', 'Chloé', 'Nina', 'Sacha', 'Lucas'].join('\\n');
  localStorage.setItem('equipes-noms', zone.value);
  faireEquipes();
});
document.getElementById('copier').addEventListener('click', async () => {
  if (!dernieres.length) { info("Fais d'abord les équipes !"); return; }
  const texte = dernieres.map((m, i) => nomEquipe(i) + ' : ' + m.join(', ')).join('\\n');
  try { await navigator.clipboard.writeText(texte); info('Équipes copiées !'); }
  catch (e) { info('Copie impossible ici : sélectionne le texte à la main.'); }
});
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'sondage', type: 'exemple', titre: 'Sondage avec résultats en direct',
  mots: ['sondage', 'vote', 'voter', 'votes', 'election', 'elire', 'resultats du vote', 'avis des joueurs'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sondage</title>
<style>
  body { margin: 0; min-height: 100vh; background: #eef2ff; color: #1e1b4b; font-family: system-ui, sans-serif; }
  main { max-width: 640px; margin: 0 auto; padding: 20px 16px; }
  .carte { background: #fff; border-radius: 18px; padding: 18px; box-shadow: 0 8px 24px rgba(30,27,75,.08); margin-bottom: 14px; }
  .choix { display: flex; align-items: center; gap: 10px; margin: 10px 0; }
  .choix button { flex: none; width: 44px; height: 44px; border: 0; border-radius: 12px; background: #4f46e5; color: #fff; font-size: 20px; cursor: pointer; }
  .choix button.retirer { background: #e0e7ff; color: #1e1b4b; font-size: 16px; }
  .barre { flex: 1; background: #e0e7ff; border-radius: 10px; overflow: hidden; position: relative; height: 44px; }
  .barre i { position: absolute; top: 0; bottom: 0; left: 0; background: #a5b4fc; transition: width .4s; }
  .barre span { position: relative; display: flex; justify-content: space-between; align-items: center; height: 100%; padding: 0 12px; font-weight: 700; gap: 8px; }
  .ajout { display: flex; gap: 8px; }
  input { font: inherit; padding: 10px; border-radius: 10px; border: 2px solid #c7d2fe; flex: 1; min-width: 0; }
  button.action { font: inherit; font-weight: 700; border: 0; border-radius: 10px; padding: 10px 14px; background: #1e1b4b; color: #fff; cursor: pointer; }
  #total { font-weight: 700; }
</style>
</head>
<body>
<main>
  <h1>🗳️ Sondage</h1>
  <div class="carte">
    <h2 id="question"></h2>
    <div id="choix"></div>
    <p id="total"></p>
  </div>
  <div class="carte">
    <form class="ajout" id="form-ajout"><input id="nouveau" placeholder="Ajouter un choix" maxlength="40" aria-label="Nouveau choix"><button class="action">Ajouter</button></form>
    <p><button class="action" id="raz">Remettre les votes à zéro</button> <button class="action" id="changer">Changer la question</button></p>
  </div>
</main>
<script>
const DEFAUT = { question: 'Quel jeu pour le prochain tournoi ?', choix: [{ nom: 'Mario Kart', votes: 0 }, { nom: 'Super Smash Bros', votes: 0 }, { nom: 'Rocket League', votes: 0 }, { nom: 'Just Dance', votes: 0 }] };
let sondage;
try { sondage = JSON.parse(localStorage.getItem('sondage')); } catch (e) { sondage = null; }
if (!sondage || !Array.isArray(sondage.choix)) sondage = JSON.parse(JSON.stringify(DEFAUT));
function sauver() { localStorage.setItem('sondage', JSON.stringify(sondage)); }

function afficher() {
  document.getElementById('question').textContent = sondage.question;
  const total = sondage.choix.reduce((n, c) => n + c.votes, 0);
  const max = Math.max(0, ...sondage.choix.map(c => c.votes));
  const box = document.getElementById('choix');
  box.innerHTML = '';
  sondage.choix.forEach((c, i) => {
    const enTete = c.votes > 0 && c.votes === max;
    const pourcent = total ? Math.round(c.votes * 100 / total) : 0;
    const ligne = document.createElement('div');
    ligne.className = 'choix';
    const plus = document.createElement('button');
    plus.textContent = '+';
    plus.setAttribute('aria-label', 'Voter pour ' + c.nom);
    plus.addEventListener('click', () => { c.votes++; sauver(); afficher(); });
    const barre = document.createElement('div');
    barre.className = 'barre';
    const remplissage = document.createElement('i');
    remplissage.style.width = pourcent + '%';
    if (enTete) remplissage.style.background = '#818cf8';
    const texte = document.createElement('span');
    const nom = document.createElement('b');
    nom.textContent = (enTete ? '👑 ' : '') + c.nom;
    const chiffres = document.createElement('small');
    chiffres.textContent = c.votes + ' vote' + (c.votes > 1 ? 's' : '') + ' · ' + pourcent + ' %';
    texte.append(nom, chiffres);
    barre.append(remplissage, texte);
    const retirer = document.createElement('button');
    retirer.className = 'retirer';
    retirer.textContent = '✕';
    retirer.setAttribute('aria-label', 'Retirer ' + c.nom);
    retirer.addEventListener('click', () => {
      if (!confirm('Retirer « ' + c.nom + ' » ?')) return;
      sondage.choix.splice(i, 1);
      sauver();
      afficher();
    });
    ligne.append(plus, barre, retirer);
    box.appendChild(ligne);
  });
  document.getElementById('total').textContent = total + ' vote' + (total > 1 ? 's' : '') + ' au total';
}
document.getElementById('form-ajout').addEventListener('submit', e => {
  e.preventDefault();
  const nom = document.getElementById('nouveau').value.trim();
  if (!nom) return;
  sondage.choix.push({ nom, votes: 0 });
  document.getElementById('nouveau').value = '';
  sauver();
  afficher();
});
document.getElementById('raz').addEventListener('click', () => {
  if (!confirm('Remettre tous les votes à zéro ?')) return;
  sondage.choix.forEach(c => { c.votes = 0; });
  sauver();
  afficher();
});
document.getElementById('changer').addEventListener('click', () => {
  const q = prompt('Nouvelle question :', sondage.question);
  if (q && q.trim()) { sondage.question = q.trim(); sauver(); afficher(); }
});
afficher();
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'programme', type: 'exemple', titre: 'Programme d’un événement (jours, filtres, favoris)',
  mots: ['programme du festival', 'programme des activites', 'planning', 'emploi du temps', 'horaires', 'agenda', 'activites du festival', 'les activites'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Programme du festival</title>
<style>
  :root { --fond: #0f0a1e; --carte: #1c1433; --accent: #ff2e88; --accent2: #00e5ff; --texte: #f5f3ff; --doux: #b8b0d6; }
  body { margin: 0; background: var(--fond); color: var(--texte); font-family: system-ui, sans-serif; }
  header { padding: 24px 16px 8px; text-align: center; background: linear-gradient(180deg, #2a1052, transparent); }
  h1 { margin: 0; font-size: clamp(26px, 6vw, 42px); }
  h1 span { color: var(--accent2); }
  main { max-width: 820px; margin: 0 auto; padding: 0 16px 30px; }
  .filtres { display: flex; gap: 8px; flex-wrap: wrap; margin: 14px 0; }
  .filtres button { font: inherit; font-weight: 700; border: 2px solid #3a2d63; background: transparent; color: var(--texte); border-radius: 999px; padding: 8px 14px; cursor: pointer; }
  .filtres button.actif { background: var(--accent); border-color: var(--accent); }
  input[type=search] { width: 100%; box-sizing: border-box; font: inherit; padding: 12px 14px; border-radius: 12px; border: 2px solid #3a2d63; background: var(--carte); color: var(--texte); }
  .creneau { display: flex; gap: 14px; background: var(--carte); border-radius: 16px; padding: 14px; margin: 10px 0; align-items: center; border-left: 5px solid var(--c, var(--accent2)); }
  .heure { font-weight: 800; font-size: 18px; min-width: 58px; color: var(--accent2); }
  .creneau h3 { margin: 0 0 4px; font-size: 17px; }
  .creneau p { margin: 0; color: var(--doux); font-size: 14px; }
  .etoile { margin-left: auto; background: none; border: 0; font-size: 24px; cursor: pointer; filter: grayscale(1); opacity: .5; }
  .etoile.oui { filter: none; opacity: 1; }
  .vide { color: var(--doux); text-align: center; padding: 30px; }
</style>
</head>
<body>
<header><h1>Programme du <span>festival</span></h1><p>Choisis un jour, filtre par type, et mets tes activités préférées en ⭐</p></header>
<main>
  <div class="filtres" id="jours"></div>
  <div class="filtres" id="types"></div>
  <input type="search" id="recherche" placeholder="🔎 Chercher un jeu, une salle…" aria-label="Chercher une activité">
  <div id="liste"></div>
</main>
<script>
// Remplace ces activités par le vrai programme de ton événement.
const PROGRAMME = [
  { jour: 'Jour 1', debut: '10:00', fin: '12:00', titre: 'Accueil et jeux libres', type: 'Jeu libre', lieu: 'Grande salle' },
  { jour: 'Jour 1', debut: '14:00', fin: '17:00', titre: 'Tournoi Mario Kart', type: 'Tournoi', lieu: 'Scène' },
  { jour: 'Jour 1', debut: '14:00', fin: '16:00', titre: 'Atelier : crée ton jeu vidéo', type: 'Atelier', lieu: 'Salle informatique' },
  { jour: 'Jour 2', debut: '10:00', fin: '12:00', titre: 'Course de drones', type: 'Atelier', lieu: 'Gymnase' },
  { jour: 'Jour 2', debut: '14:00', fin: '18:00', titre: 'Tournoi Super Smash Bros', type: 'Tournoi', lieu: 'Scène' },
  { jour: 'Jour 2', debut: '20:00', fin: '22:00', titre: 'Soirée cinéma', type: 'Cinéma', lieu: 'Salle de projection' },
  { jour: 'Jour 3', debut: '10:00', fin: '12:00', titre: 'Réalité virtuelle', type: 'Jeu libre', lieu: 'Espace VR' },
  { jour: 'Jour 3', debut: '14:00', fin: '16:00', titre: 'Finales des tournois', type: 'Tournoi', lieu: 'Scène' },
  { jour: 'Jour 3', debut: '16:30', fin: '17:30', titre: 'Remise des prix', type: 'Cérémonie', lieu: 'Scène' },
];
const COULEURS = { Tournoi: '#ff2e88', 'Jeu libre': '#00e5ff', Atelier: '#ffd60a', Cinéma: '#a78bfa', Cérémonie: '#34d399' };
const FAVORIS = '⭐ Favoris';
const jours = [...new Set(PROGRAMME.map(a => a.jour))];
const types = ['Tout', ...new Set(PROGRAMME.map(a => a.type))];
let jourChoisi = jours[0], typeChoisi = 'Tout';
let favoris;
try { favoris = new Set(JSON.parse(localStorage.getItem('programme-favoris')) || []); } catch (e) { favoris = new Set(); }
const cle = a => a.jour + ' ' + a.debut + ' ' + a.titre;

function boutons(id, valeurs, actuel, choisir) {
  const box = document.getElementById(id);
  box.innerHTML = '';
  for (const v of valeurs) {
    const b = document.createElement('button');
    b.textContent = v;
    if (v === actuel) b.className = 'actif';
    b.addEventListener('click', () => { choisir(v); afficher(); });
    box.appendChild(b);
  }
}
function afficher() {
  boutons('jours', [...jours, FAVORIS], jourChoisi, v => { jourChoisi = v; });
  boutons('types', types, typeChoisi, v => { typeChoisi = v; });
  const mot = document.getElementById('recherche').value.trim().toLowerCase();
  const liste = PROGRAMME
    .filter(a => (jourChoisi === FAVORIS ? favoris.has(cle(a)) : a.jour === jourChoisi))
    .filter(a => typeChoisi === 'Tout' || a.type === typeChoisi)
    .filter(a => !mot || (a.titre + ' ' + a.lieu + ' ' + a.type).toLowerCase().includes(mot))
    .sort((a, b) => (a.jour + a.debut).localeCompare(b.jour + b.debut));
  const box = document.getElementById('liste');
  box.innerHTML = '';
  if (!liste.length) {
    const p = document.createElement('p');
    p.className = 'vide';
    p.textContent = jourChoisi === FAVORIS && !favoris.size ? 'Pas encore de favoris : clique sur ⭐ à côté d’une activité.' : 'Aucune activité ne correspond.';
    box.appendChild(p);
    return;
  }
  for (const a of liste) {
    const carte = document.createElement('article');
    carte.className = 'creneau';
    carte.style.setProperty('--c', COULEURS[a.type] || '#00e5ff');
    const heure = document.createElement('div');
    heure.className = 'heure';
    heure.textContent = a.debut;
    const texte = document.createElement('div');
    const h = document.createElement('h3');
    h.textContent = a.titre;
    const p = document.createElement('p');
    p.textContent = (jourChoisi === FAVORIS ? a.jour + ' · ' : '') + a.debut + ' - ' + a.fin + ' · ' + a.lieu + ' · ' + a.type;
    texte.append(h, p);
    const etoile = document.createElement('button');
    etoile.className = 'etoile' + (favoris.has(cle(a)) ? ' oui' : '');
    etoile.textContent = '⭐';
    etoile.setAttribute('aria-label', (favoris.has(cle(a)) ? 'Retirer des favoris : ' : 'Ajouter aux favoris : ') + a.titre);
    etoile.addEventListener('click', () => {
      if (favoris.has(cle(a))) favoris.delete(cle(a)); else favoris.add(cle(a));
      localStorage.setItem('programme-favoris', JSON.stringify([...favoris]));
      afficher();
    });
    carte.append(heure, texte, etoile);
    box.appendChild(carte);
  }
}
document.getElementById('recherche').addEventListener('input', afficher);
afficher();
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'tables', type: 'exemple', titre: 'Entraînement aux tables de multiplication',
  mots: ['tables de multiplication', 'table de multiplication', 'multiplication', 'multiplications', 'calcul mental', 'reviser les tables'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Les tables en folie</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #fff7ed; color: #7c2d12; font-family: system-ui, sans-serif; text-align: center; }
  .carte { background: #fff; border-radius: 24px; padding: 24px; width: min(420px, 92vw); box-sizing: border-box; box-shadow: 0 12px 30px rgba(124,45,18,.12); }
  .tables { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin: 10px 0; }
  .tables label { background: #ffedd5; border-radius: 10px; padding: 6px 10px; font-weight: 700; cursor: pointer; }
  .tables input { accent-color: #ea580c; }
  #calcul { font-size: 48px; font-weight: 800; margin: 16px 0; }
  #reponse { font: inherit; font-size: 32px; width: 140px; text-align: center; padding: 8px; border-radius: 14px; border: 3px solid #fdba74; }
  button { font: inherit; font-weight: 800; border: 0; border-radius: 14px; padding: 12px 20px; background: #ea580c; color: #fff; cursor: pointer; }
  .barre { height: 10px; background: #ffedd5; border-radius: 6px; overflow: hidden; margin: 12px 0; }
  .barre i { display: block; height: 100%; width: 100%; background: #ea580c; }
  #retour { min-height: 28px; font-weight: 800; font-size: 20px; }
  .bon { color: #16a34a; }
  .faux { color: #dc2626; }
</style>
</head>
<body>
<div class="carte">
  <h1>✖️ Les tables en folie</h1>
  <div class="tables" id="tables"></div>
  <div id="calcul">Prêt ?</div>
  <form id="form"><input id="reponse" type="number" inputmode="numeric" autocomplete="off" aria-label="Ta réponse" disabled> <button id="valider">Commencer</button></form>
  <div class="barre"><i id="temps"></i></div>
  <p id="retour" role="status"></p>
  <p>Score : <b id="score">0</b> · Série : <b id="serie">0</b> · Record : <b id="record">0</b></p>
</div>
<script>
const DUREE = 60;                                 // secondes pour une partie
let a = 0, b = 0, score = 0, serie = 0, reste = 0, enCours = false, minuteur;
let record = Number(localStorage.getItem('tables-record')) || 0;
document.getElementById('record').textContent = record;
const boite = document.getElementById('tables');
for (let t = 2; t <= 10; t++) {
  const label = document.createElement('label');
  const caseT = document.createElement('input');
  caseT.type = 'checkbox';
  caseT.value = t;
  caseT.checked = true;
  label.append(caseT, ' ' + t);
  boite.appendChild(label);
}
function tablesChoisies() {
  const t = [...boite.querySelectorAll('input:checked')].map(i => Number(i.value));
  return t.length ? t : [2, 3, 4, 5, 6, 7, 8, 9, 10];
}
function nouvelleQuestion() {
  const t = tablesChoisies();
  a = t[Math.floor(Math.random() * t.length)];
  b = 1 + Math.floor(Math.random() * 10);
  if (Math.random() < 0.5) [a, b] = [b, a];
  document.getElementById('calcul').textContent = a + ' × ' + b + ' = ?';
  const champ = document.getElementById('reponse');
  champ.value = '';
  champ.focus();
}
function commencer() {
  score = 0; serie = 0; reste = DUREE; enCours = true;
  majScore();
  document.getElementById('reponse').disabled = false;
  document.getElementById('valider').textContent = 'Valider';
  retour('', '');
  nouvelleQuestion();
  clearInterval(minuteur);
  minuteur = setInterval(() => {
    reste -= 0.1;
    document.getElementById('temps').style.width = Math.max(0, reste / DUREE * 100) + '%';
    if (reste <= 0) terminer();
  }, 100);
}
function terminer() {
  clearInterval(minuteur);
  enCours = false;
  document.getElementById('reponse').disabled = true;
  document.getElementById('valider').textContent = 'Rejouer';
  document.getElementById('calcul').textContent = 'Temps écoulé !';
  if (score > record) {
    record = score;
    localStorage.setItem('tables-record', record);
    document.getElementById('record').textContent = record;
    retour('Nouveau record : ' + score + ' ! 🏆', 'bon');
  } else retour('Score final : ' + score, '');
}
function retour(texte, classe) {
  const r = document.getElementById('retour');
  r.textContent = texte;
  r.className = classe;
}
function majScore() {
  document.getElementById('score').textContent = score;
  document.getElementById('serie').textContent = serie;
}
document.getElementById('form').addEventListener('submit', e => {
  e.preventDefault();
  if (!enCours) { commencer(); return; }
  const champ = document.getElementById('reponse');
  if (champ.value === '') return;
  if (Number(champ.value) === a * b) {
    score++;
    serie++;
    retour(serie >= 5 ? 'Bravo ! Série de ' + serie + ' 🔥' : 'Bravo !', 'bon');
  } else {
    serie = 0;
    retour('Non : ' + a + ' × ' + b + ' = ' + a * b, 'faux');
  }
  majScore();
  nouvelleQuestion();
});
</script>
</body>
</html>`,
});

SAVOIRS.push({
  id: 'meteo', type: 'exemple', titre: 'Météo d’une ville (données sur internet, sans clé)',
  mots: ['meteo', 'temperature', "temps qu'il fait", 'previsions', 'api meteo', 'open-meteo'],
  code: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>La météo</title>
<style>
  body { margin: 0; min-height: 100vh; background: linear-gradient(160deg, #38bdf8, #1e3a8a); color: #fff; font-family: system-ui, sans-serif; }
  main { max-width: 560px; margin: 0 auto; padding: 24px 16px; text-align: center; }
  form { display: flex; gap: 8px; }
  input { flex: 1; min-width: 0; font: inherit; padding: 12px 14px; border-radius: 14px; border: 0; }
  button { font: inherit; font-weight: 800; border: 0; border-radius: 14px; padding: 12px 16px; background: #facc15; color: #1e3a8a; cursor: pointer; }
  .actuel { margin: 20px 0; }
  .icone { font-size: 80px; }
  .temp { font-size: 56px; font-weight: 800; }
  .jours { display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); gap: 8px; }
  .jour { background: rgba(255,255,255,.15); border-radius: 14px; padding: 10px; }
  .jour b { display: block; text-transform: capitalize; }
  #etat { min-height: 22px; }
  small { opacity: .8; }
</style>
</head>
<body>
<main>
  <h1>🌤️ La météo</h1>
  <form id="form"><input id="ville" value="Bordeaux" aria-label="Ville" placeholder="Une ville, ex : Bordeaux"><button>Voir</button></form>
  <p id="etat" role="status"></p>
  <div class="actuel" id="actuel"></div>
  <div class="jours" id="jours"></div>
  <p><small>Données : Open-Meteo.com (gratuit, sans clé)</small></p>
</main>
<script>
// Les codes météo d'Open-Meteo, traduits en emoji et en mots.
const TEMPS = { 0: ['☀️', 'Ciel dégagé'], 1: ['🌤️', 'Plutôt dégagé'], 2: ['⛅', 'Partiellement nuageux'], 3: ['☁️', 'Couvert'], 45: ['🌫️', 'Brouillard'], 48: ['🌫️', 'Brouillard givrant'], 51: ['🌦️', 'Bruine légère'], 53: ['🌦️', 'Bruine'], 55: ['🌧️', 'Forte bruine'], 61: ['🌧️', 'Pluie faible'], 63: ['🌧️', 'Pluie'], 65: ['🌧️', 'Forte pluie'], 71: ['🌨️', 'Neige faible'], 73: ['🌨️', 'Neige'], 75: ['❄️', 'Forte neige'], 80: ['🌦️', 'Averses'], 81: ['🌧️', 'Averses'], 82: ['⛈️', 'Fortes averses'], 95: ['⛈️', 'Orage'], 96: ['⛈️', 'Orage et grêle'], 99: ['⛈️', 'Orage et grêle'] };
const decrire = code => TEMPS[code] || ['🌡️', 'Temps inconnu'];

async function meteo(ville) {
  etat('Recherche de « ' + ville + ' »…');
  try {
    // 1. Trouver la latitude et la longitude de la ville
    const g = await fetch('https://geocoding-api.open-meteo.com/v1/search?count=1&language=fr&name=' + encodeURIComponent(ville)).then(r => r.json());
    if (!g.results || !g.results.length) { etat('Ville introuvable. Vérifie l’orthographe.'); return; }
    const lieu = g.results[0];
    // 2. Demander la météo de cet endroit
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lieu.latitude + '&longitude=' + lieu.longitude +
      '&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5';
    const m = await fetch(url).then(r => r.json());
    afficher(lieu, m);
    etat('');
    localStorage.setItem('meteo-ville', ville);
  } catch (e) {
    etat('Impossible de joindre le service météo. Vérifie ta connexion internet.');
  }
}
function afficher(lieu, m) {
  const [icone, mots] = decrire(m.current.weather_code);
  const actuel = document.getElementById('actuel');
  actuel.innerHTML = '';
  const titre = document.createElement('h2');
  titre.textContent = lieu.name + (lieu.country ? ', ' + lieu.country : '');
  const i = document.createElement('div');
  i.className = 'icone';
  i.textContent = icone;
  const t = document.createElement('div');
  t.className = 'temp';
  t.textContent = Math.round(m.current.temperature_2m) + ' °C';
  const d = document.createElement('div');
  d.textContent = mots + ' · vent ' + Math.round(m.current.wind_speed_10m) + ' km/h';
  actuel.append(titre, i, t, d);
  const jours = document.getElementById('jours');
  jours.innerHTML = '';
  m.daily.time.forEach((date, k) => {
    const carte = document.createElement('div');
    carte.className = 'jour';
    const nom = document.createElement('b');
    nom.textContent = k === 0 ? "Aujourd'hui" : new Date(date + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'long' });
    const temp = document.createElement('div');
    temp.textContent = decrire(m.daily.weather_code[k])[0] + ' ' + Math.round(m.daily.temperature_2m_min[k]) + '° / ' + Math.round(m.daily.temperature_2m_max[k]) + '°';
    carte.append(nom, temp);
    jours.appendChild(carte);
  });
}
function etat(t) { document.getElementById('etat').textContent = t; }
document.getElementById('form').addEventListener('submit', e => {
  e.preventDefault();
  const v = document.getElementById('ville').value.trim();
  if (v) meteo(v);
});
const memo = localStorage.getItem('meteo-ville');
if (memo) document.getElementById('ville').value = memo;
meteo(document.getElementById('ville').value);
</script>
</body>
</html>`,
});

// ---------------------------------------------------------------------------
// Les fiches : des astuces courtes qu'elle peut réutiliser.
// ---------------------------------------------------------------------------
SAVOIRS.push({
  id: 'boucle-jeu', type: 'fiche', titre: 'Boucle de jeu sur canvas',
  mots: ['jeu', 'canvas', 'animation', 'bouger', 'personnage', 'plateforme', 'mario', 'sauter', 'gravite', 'flappy', 'tirer'],
  code: `// Squelette d'un jeu sur <canvas id="jeu" width="480" height="320">
const canvas = document.getElementById('jeu');
const ctx = canvas.getContext('2d');
const touches = {};                       // touches enfoncées en ce moment
document.addEventListener('keydown', e => { touches[e.key] = true; });
document.addEventListener('keyup', e => { touches[e.key] = false; });
const joueur = { x: 50, y: 250, l: 30, h: 30, vy: 0 };
function mettreAJour() {
  if (touches.ArrowLeft) joueur.x -= 4;
  if (touches.ArrowRight) joueur.x += 4;
  joueur.vy += 0.5;                       // gravité
  joueur.y = Math.min(joueur.y + joueur.vy, canvas.height - joueur.h);
  if (touches[' '] && joueur.y >= canvas.height - joueur.h) joueur.vy = -10;   // saut
}
function dessiner() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#6a4cff';
  ctx.fillRect(joueur.x, joueur.y, joueur.l, joueur.h);
}
function boucle() { mettreAJour(); dessiner(); requestAnimationFrame(boucle); }
boucle();
// Collision entre deux rectangles a et b :
// a.x < b.x + b.l && a.x + a.l > b.x && a.y < b.y + b.h && a.y + a.h > b.y`,
});

SAVOIRS.push({
  id: 'tactile', type: 'fiche', titre: 'Commandes tactiles et glisser du doigt',
  mots: ['tactile', 'telephone', 'portable', 'mobile', 'tablette', 'doigt', 'swipe', 'glisser'],
  code: `// Boutons à l'écran qui restent enfoncés : <button id="gauche">⬅️</button>
const b = document.getElementById('gauche');
b.addEventListener('pointerdown', () => { touches.ArrowLeft = true; });
b.addEventListener('pointerup', () => { touches.ArrowLeft = false; });
b.addEventListener('pointerleave', () => { touches.ArrowLeft = false; });
// Glisser du doigt (swipe) :
let depart = null;
document.addEventListener('touchstart', e => { depart = e.touches[0]; });
document.addEventListener('touchend', e => {
  if (!depart) return;
  const dx = e.changedTouches[0].clientX - depart.clientX;
  const dy = e.changedTouches[0].clientY - depart.clientY;
  if (Math.abs(dx) > Math.abs(dy)) console.log(dx > 0 ? 'droite' : 'gauche');
  else console.log(dy > 0 ? 'bas' : 'haut');
  depart = null;
});
// Sur le canvas, ajoute en CSS : touch-action: none;`,
});

SAVOIRS.push({
  id: 'sauvegarde', type: 'fiche', titre: 'Sauvegarder des données (localStorage)',
  mots: ['sauvegarder', 'sauvegarde', 'garder', 'retenir', 'record', 'meilleur score', 'localstorage', 'memoriser'],
  code: `// Sauvegarder un objet ou un tableau
function sauver(cle, valeur) { localStorage.setItem(cle, JSON.stringify(valeur)); }
// Relire (avec une valeur par défaut si rien n'est encore sauvé ou si c'est abîmé)
function lire(cle, defaut) {
  try { const v = localStorage.getItem(cle); return v === null ? defaut : JSON.parse(v); }
  catch (e) { return defaut; }
}
let record = lire('record', 0);
if (score > record) { record = score; sauver('record', record); }`,
});

SAVOIRS.push({
  id: 'design', type: 'fiche', titre: 'Base de design moderne en CSS',
  mots: ['joli', 'beau', 'design', 'style', 'couleurs', 'moderne', 'site', 'page', 'bouton', 'carte'],
  code: `:root { --fond: #f5f4fa; --carte: #ffffff; --texte: #1d1b29; --doux: #676380; --accent: #6a4cff; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--fond); color: var(--texte); font-family: system-ui, sans-serif; line-height: 1.5; }
.conteneur { max-width: 960px; margin: 0 auto; padding: 24px 16px; }
.grille { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
.carte { background: var(--carte); border-radius: 16px; padding: 20px; box-shadow: 0 8px 24px rgba(0,0,0,.08); }
.bouton { display: inline-block; padding: 12px 20px; border: 0; border-radius: 12px; background: var(--accent); color: #fff; font: inherit; font-weight: 700; cursor: pointer; transition: transform .1s; }
.bouton:hover { transform: translateY(-2px); }
h1 { font-size: clamp(28px, 6vw, 48px); margin: 0 0 12px; }
/* Pour centrer un élément au milieu de l'écran : */
.centre { min-height: 100vh; display: grid; place-items: center; }`,
});

SAVOIRS.push({
  id: 'son', type: 'fiche', titre: 'Faire des sons sans fichier',
  mots: ['son', 'sons', 'bruit', 'bip', 'musique', 'audio', 'note'],
  code: `// Joue une note (fréquence en Hz, durée en secondes), sans aucun fichier son
const audio = new (window.AudioContext || window.webkitAudioContext)();
function bip(frequence = 440, duree = 0.15, type = 'square') {
  const osc = audio.createOscillator();
  const volume = audio.createGain();
  osc.type = type;                         // 'sine', 'square', 'triangle', 'sawtooth'
  osc.frequency.value = frequence;
  volume.gain.setValueAtTime(0.2, audio.currentTime);
  volume.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duree);
  osc.connect(volume).connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + duree);
}
// Exemples : bip(880) quand on gagne un point, bip(150, 0.4, 'sawtooth') quand on perd.
// Le navigateur n'autorise le son qu'après un premier clic ou une touche.`,
});

SAVOIRS.push({
  id: 'aleatoire', type: 'fiche', titre: 'Le hasard en JavaScript',
  mots: ['hasard', 'aleatoire', 'random', 'melanger', 'tirage', 'loterie', 'lancer un de', 'lancer de de'],
  code: `// Nombre entier entre min et max (inclus)
const entre = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
// Un élément au hasard dans un tableau
const auHasard = tableau => tableau[Math.floor(Math.random() * tableau.length)];
// Mélanger un tableau (mélange de Fisher-Yates)
function melanger(t) {
  for (let i = t.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [t[i], t[j]] = [t[j], t[i]];
  }
  return t;
}
// Lancer un dé : entre(1, 6)`,
});

SAVOIRS.push({
  id: 'animations', type: 'fiche', titre: 'Animations en CSS',
  mots: ['animation', 'animer', 'anime', 'bouge', 'tourne', 'clignote', 'effet', 'transition', 'rebond'],
  code: `/* Un élément qui flotte doucement */
@keyframes flotter { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
.flotte { animation: flotter 2s ease-in-out infinite; }
/* Un élément qui tourne */
@keyframes tourner { to { transform: rotate(360deg); } }
.tourne { animation: tourner 3s linear infinite; }
/* Apparition en fondu */
@keyframes apparaitre { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
.apparait { animation: apparaitre .6s ease-out both; }
/* Effet au survol */
.bouton { transition: transform .15s, box-shadow .15s; }
.bouton:hover { transform: scale(1.05); box-shadow: 0 8px 20px rgba(0,0,0,.2); }
/* Respecter les personnes qui n'aiment pas les animations */
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }`,
});

SAVOIRS.push({
  id: 'dom', type: 'fiche', titre: 'Manipuler la page en JavaScript',
  mots: ['bouton', 'clic', 'cliquer', 'afficher', 'changer le texte', 'element', 'queryselector', 'getelementbyid', 'addeventlistener', 'page web'],
  code: `const titre = document.querySelector('h1');          // le premier <h1>
const bouton = document.getElementById('mon-bouton');   // l'élément id="mon-bouton"
titre.textContent = 'Nouveau titre';                    // changer le texte (sûr)
titre.style.color = 'tomato';                           // changer le style
titre.classList.add('actif');                           // ajouter une classe CSS
titre.classList.toggle('cache');                        // l'enlever ou la remettre
bouton.addEventListener('click', () => { alert('Clic !'); });
// Créer un élément et l'ajouter à la page
const li = document.createElement('li');
li.textContent = 'Nouvelle ligne';
document.querySelector('ul').appendChild(li);
// Lire un champ de formulaire
const valeur = document.querySelector('input').value;
// Attention : un script placé dans <head> doit attendre la page :
document.addEventListener('DOMContentLoaded', () => { /* ton code ici */ });`,
});

SAVOIRS.push({
  id: 'tableaux', type: 'fiche', titre: 'Les tableaux (listes) en JavaScript',
  mots: ['tableau', 'liste', 'array', 'trier', 'filtrer', 'chercher dans', 'parcourir', 'foreach', 'map', 'filter', 'push'],
  code: `const fruits = ['pomme', 'banane'];
fruits.push('kiwi');                         // ajouter à la fin
fruits.length;                               // 3 éléments
fruits[0];                                   // 'pomme' (on compte à partir de 0)
fruits.includes('kiwi');                     // true
fruits.indexOf('banane');                    // 1
fruits.splice(1, 1);                         // retirer 1 élément à la position 1
fruits.forEach((f, i) => console.log(i, f)); // parcourir
const majuscules = fruits.map(f => f.toUpperCase());       // transformer
const longs = fruits.filter(f => f.length > 4);            // garder certains
const joueur = joueurs.find(j => j.nom === 'Léa');         // trouver le premier
joueurs.sort((a, b) => b.points - a.points);               // trier du plus grand au plus petit
const total = [3, 5, 2].reduce((somme, x) => somme + x, 0); // additionner : 10`,
});

SAVOIRS.push({
  id: 'fetch-api', type: 'fiche', titre: 'Aller chercher des données sur internet (fetch)',
  mots: ['api', 'fetch', 'donnees depuis internet', 'donnees en ligne', 'meteo', 'charger des donnees', 'requete http'],
  code: `// fetch demande une page ou des données à un site. C'est « asynchrone » : on attend avec await.
async function chercherWikipedia(mot) {
  const url = 'https://fr.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(mot);
  try {
    const reponse = await fetch(url);
    if (!reponse.ok) throw new Error('Page introuvable');
    const donnees = await reponse.json();
    return donnees.extract;                    // le résumé de l'article
  } catch (erreur) {
    return 'Oups : ' + erreur.message;
  }
}
chercherWikipedia('Jupiter (planète)').then(texte => {
  document.querySelector('#resultat').textContent = texte;
});
// Un site n'accepte d'être appelé depuis une autre page que s'il l'autorise (CORS).
// Wikipédia l'autorise. Beaucoup d'API demandent aussi une clé : ne la mets jamais dans une page publique.`,
});

SAVOIRS.push({
  id: 'erreurs', type: 'fiche', titre: 'Corriger les erreurs fréquentes',
  mots: ['erreur', 'bug', 'marche pas', 'fonctionne pas', 'undefined', 'null', 'is not defined', 'is not a function', 'cannot read', 'typeerror', 'referenceerror', 'syntaxerror', 'corrige'],
  code: `// « X is not defined » : la variable ou fonction X n'existe pas. Faute de frappe ? Déclarée plus bas ou dans une autre fonction ?
// « Cannot read properties of null (reading 'addEventListener') » : querySelector/getElementById n'a rien trouvé.
//    Vérifie que l'id existe dans le HTML et que le <script> est placé APRÈS l'élément (à la fin de <body>).
// « Cannot read properties of undefined (reading 'x') » : l'objet n'existe pas encore.
//    Ex. tableau[i].x avec i trop grand, ou un objet utilisé avant d'être créé.
// « X is not a function » : X n'est pas une fonction (mauvais nom, ou tu as écrasé la variable).
// « Unexpected token » / SyntaxError : parenthèse, accolade ou guillemet oublié.
// Le jeu ne réagit pas au clavier : écoute sur document (document.addEventListener('keydown', ...)).
// Le jeu va trop vite : utilise requestAnimationFrame ou setInterval, pas une boucle while.
// Déboguer : console.log('ici', variable) pour voir ce qui se passe.`,
});

SAVOIRS.push({
  id: 'mise-en-page', type: 'fiche', titre: 'Mise en page avec flexbox et grid',
  mots: ['centrer', 'aligner', 'colonnes', 'mise en page', 'flexbox', 'flex', 'grid', 'grille', 'responsive', 'telephone', 'a cote'],
  code: `/* Centrer au milieu de l'écran */
body { min-height: 100vh; display: grid; place-items: center; margin: 0; }
/* Des éléments côte à côte, avec un espace, qui passent à la ligne si besoin */
.rangee { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; justify-content: center; }
/* Une grille de cartes qui s'adapte à la largeur */
.grille { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
/* Une grille fixe de 3 colonnes (ex. morpion) */
.plateau { display: grid; grid-template-columns: repeat(3, 90px); gap: 8px; }
/* Sur téléphone (écran étroit) */
@media (max-width: 600px) { .rangee { flex-direction: column; } }
/* Ne jamais dépasser l'écran */
img, canvas { max-width: 100%; height: auto; }`,
});

SAVOIRS.push({
  id: 'canvas-dessin', type: 'fiche', titre: 'Dessiner sur un canvas',
  mots: ['canvas', 'dessiner', 'rectangle', 'cercle', 'ligne', 'texte sur', 'image', 'couleur de fond'],
  code: `const ctx = document.getElementById('jeu').getContext('2d');
ctx.clearRect(0, 0, 400, 300);                  // tout effacer
ctx.fillStyle = '#3b82f6';                      // couleur de remplissage
ctx.fillRect(20, 20, 100, 60);                  // rectangle plein (x, y, largeur, hauteur)
ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
ctx.strokeRect(150, 20, 100, 60);               // contour de rectangle
ctx.beginPath(); ctx.arc(80, 180, 40, 0, Math.PI * 2); ctx.fill();   // cercle (x, y, rayon)
ctx.beginPath(); ctx.moveTo(150, 150); ctx.lineTo(300, 250); ctx.stroke();   // ligne
ctx.font = 'bold 24px system-ui'; ctx.textAlign = 'center';
ctx.fillText('Score : 10', 200, 40);            // texte
ctx.font = '40px system-ui'; ctx.fillText('🚀', 300, 150);   // un emoji comme personnage
// Pour une image : const img = new Image(); img.onload = () => ctx.drawImage(img, x, y, l, h); img.src = '...';`,
});

SAVOIRS.push({
  id: 'dates', type: 'fiche', titre: 'Dates et heures',
  mots: ['date', 'heure', 'horloge', 'aujourd', 'calendrier', 'jours avant', 'anniversaire', 'temps restant'],
  code: `const maintenant = new Date();
maintenant.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
// → « dimanche 27 septembre 2026 »
maintenant.toLocaleTimeString('fr-FR');          // → « 14:05:32 »
const cible = new Date('2026-10-20T10:00:00');  // une date précise (année-mois-jour T heure)
const ms = cible - maintenant;                   // différence en millisecondes
const jours = Math.floor(ms / 86400000);
const heures = Math.floor(ms / 3600000) % 24;
const minutes = Math.floor(ms / 60000) % 60;
const secondes = Math.floor(ms / 1000) % 60;
const deux = n => String(n).padStart(2, '0');   // 5 → « 05 »
setInterval(() => { /* mettre à jour l'affichage */ }, 1000);   // chaque seconde`,
});

SAVOIRS.push({
  id: 'python', type: 'fiche', titre: 'Bases de Python',
  mots: ['python', '.py', 'programme python', 'script python', 'console', 'terminal'],
  code: `# Pour lancer : enregistre le fichier (ex. jeu.py), puis dans un terminal : python jeu.py
import random

nom = input("Comment tu t'appelles ? ")        # demander quelque chose
print("Salut", nom, "!")                       # afficher

secret = random.randint(1, 100)                # nombre au hasard entre 1 et 100
essais = 0
while True:                                    # boucle
    reponse = int(input("Ton nombre : "))      # int() transforme le texte en nombre
    essais += 1
    if reponse < secret:
        print("C'est plus !")
    elif reponse > secret:
        print("C'est moins !")
    else:
        print("Bravo, trouvé en", essais, "essais !")
        break

def carre(x):                                  # une fonction
    return x * x

for i in range(1, 6):                          # répéter 5 fois (i = 1, 2, 3, 4, 5)
    print(i, "au carré =", carre(i))

fruits = ["pomme", "banane", "kiwi"]           # une liste
fruits.append("fraise")
print(len(fruits), "fruits :", ", ".join(fruits))`,
});

// ---------------------------------------------------------------------------
// Fiches ajoutées le 2026-10-05.
// ---------------------------------------------------------------------------
SAVOIRS.push({
  id: 'collisions', type: 'fiche', titre: 'Détecter les collisions',
  mots: ['collision', 'collisions', 'toucher', 'touche', 'se cogne', 'rebondir', 'rebond', 'contact', 'hitbox'],
  code: `// Deux rectangles { x, y, l, h } se touchent-ils ?
function rectanglesSeTouchent(a, b) {
  return a.x < b.x + b.l && a.x + a.l > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
// Deux cercles { x, y, r } (x, y = centre) :
function cerclesSeTouchent(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r;
}
// Un point (la souris, un doigt) dans un rectangle :
function pointDans(px, py, r) {
  return px >= r.x && px <= r.x + r.l && py >= r.y && py <= r.y + r.h;
}
// Une balle qui rebondit sur les bords du canvas :
if (balle.x - balle.r < 0 || balle.x + balle.r > canvas.width) balle.vx = -balle.vx;
if (balle.y - balle.r < 0 || balle.y + balle.r > canvas.height) balle.vy = -balle.vy;
// Parcourir une liste en enlevant ce qui est touché : on part de la fin.
for (let i = ennemis.length - 1; i >= 0; i--) {
  if (rectanglesSeTouchent(tir, ennemis[i])) { ennemis.splice(i, 1); score++; }
}`,
});

SAVOIRS.push({
  id: 'etats-jeu', type: 'fiche', titre: 'Écran titre, pause, fin de partie et niveaux',
  mots: ['menu', 'ecran titre', 'pause', 'game over', 'fin de partie', 'perdu', 'gagne', 'niveau', 'niveaux', 'rejouer', 'vies'],
  code: `// Un seul état à la fois : 'menu', 'jeu', 'pause' ou 'fin'
let etat = 'menu', niveau = 1, vies = 3, score = 0;
function commencer() { niveau = 1; vies = 3; score = 0; preparerNiveau(niveau); etat = 'jeu'; }
function preparerNiveau(n) { /* placer les ennemis : plus nombreux et plus rapides quand n grandit */ }
function perdreUneVie() { vies--; if (vies <= 0) etat = 'fin'; }
function niveauSuivant() { niveau++; preparerNiveau(niveau); }
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && (etat === 'menu' || etat === 'fin')) commencer();
  if (e.key === 'p' || e.key === 'Escape') etat = etat === 'jeu' ? 'pause' : etat === 'pause' ? 'jeu' : etat;
});
function boucle() {
  if (etat === 'jeu') mettreAJour();          // le jeu n'avance que pendant 'jeu'
  dessiner();
  if (etat === 'menu') ecrireAuCentre('Appuie sur Entrée pour jouer');
  if (etat === 'pause') ecrireAuCentre('Pause');
  if (etat === 'fin') ecrireAuCentre('Perdu ! Score : ' + score + '. Entrée pour rejouer');
  requestAnimationFrame(boucle);
}
function ecrireAuCentre(texte) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(texte, canvas.width / 2, canvas.height / 2);
}
// Mets aussi le jeu en pause quand on change d'onglet :
document.addEventListener('visibilitychange', () => { if (document.hidden && etat === 'jeu') etat = 'pause'; });`,
});

SAVOIRS.push({
  id: 'manette', type: 'fiche', titre: 'Jouer à la manette (et au clavier)',
  mots: ['manette', 'gamepad', 'xbox', 'playstation', 'joystick', 'controleur', 'deux joueurs', 'multijoueur'],
  code: `// Le navigateur voit la manette dès qu'on appuie sur un bouton.
window.addEventListener('gamepadconnected', e => console.log('Manette branchée : ' + e.gamepad.id));
// À appeler dans la boucle de jeu : renvoie les commandes du joueur.
function commandes() {
  const c = { gauche: touches.ArrowLeft, droite: touches.ArrowRight, haut: touches.ArrowUp, bas: touches.ArrowDown, saut: touches[' '] };
  const m = navigator.getGamepads ? navigator.getGamepads()[0] : null;   // la première manette
  if (m) {
    const x = m.axes[0], y = m.axes[1];          // joystick gauche : de -1 à 1
    if (x < -0.4) c.gauche = true;
    if (x > 0.4) c.droite = true;
    if (y < -0.4) c.haut = true;
    if (y > 0.4) c.bas = true;
    if (m.buttons[0] && m.buttons[0].pressed) c.saut = true;   // bouton A (Xbox) ou croix (PlayStation)
    if (m.buttons[14] && m.buttons[14].pressed) c.gauche = true;   // croix directionnelle
    if (m.buttons[15] && m.buttons[15].pressed) c.droite = true;
  }
  return c;
}
// Deux joueurs sur le même clavier : flèches pour l'un, Z Q S D pour l'autre.
const joueur2 = { gauche: 'q', droite: 'd', haut: 'z', bas: 's' };`,
});

SAVOIRS.push({
  id: 'sprites-images', type: 'fiche', titre: 'Images, emojis et sprites sur un canvas',
  mots: ['sprite', 'sprites', 'emoji', 'emojis', 'personnage', 'dessin du joueur', 'image du joueur', 'dessiner une image', 'png', 'avatar'],
  code: `// Sans fichier : un emoji fait un très bon personnage.
ctx.font = '40px serif';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('🚀', joueur.x, joueur.y);
// Avec une image : on attend qu'elle soit chargée avant de lancer le jeu.
const img = new Image();
img.onload = () => boucle();
img.onerror = () => console.log("L'image n'a pas pu être chargée");
img.src = 'https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png';
// Dans la boucle : ctx.drawImage(img, x, y, largeur, hauteur);
// Une planche de sprites (plusieurs images côte à côte de 32 x 32) :
// ctx.drawImage(planche, numero * 32, 0, 32, 32, x, y, 64, 64);   // morceau source puis destination
// Retourner le personnage quand il va à gauche :
ctx.save();
ctx.translate(joueur.x, joueur.y);
ctx.scale(joueur.vx < 0 ? -1 : 1, 1);
ctx.fillText('🦊', 0, 0);
ctx.restore();
// Pour un style pixel art net quand on agrandit : ctx.imageSmoothingEnabled = false;`,
});

SAVOIRS.push({
  id: 'canvas-adaptable', type: 'fiche', titre: 'Canvas net et adapté à tous les écrans',
  mots: ['plein ecran', 'responsive', 'taille de l\'ecran', 'canvas flou', 'pixelise', 'redimensionner', 'tous les ecrans'],
  code: `// Le jeu garde ses coordonnées (480 x 320) ; le canvas s'adapte à l'écran et reste net.
const LARGEUR = 480, HAUTEUR = 320;
const canvas = document.getElementById('jeu');
const ctx = canvas.getContext('2d');
function adapter() {
  const echelle = Math.min(window.innerWidth / LARGEUR, (window.innerHeight - 120) / HAUTEUR, 2);
  const ratio = window.devicePixelRatio || 1;
  canvas.style.width = LARGEUR * echelle + 'px';
  canvas.style.height = HAUTEUR * echelle + 'px';
  canvas.width = Math.round(LARGEUR * echelle * ratio);
  canvas.height = Math.round(HAUTEUR * echelle * ratio);
  ctx.setTransform(echelle * ratio, 0, 0, echelle * ratio, 0, 0);   // on dessine toujours en 480 x 320
}
window.addEventListener('resize', adapter);
adapter();
// La position du doigt ou de la souris dans les coordonnées du jeu :
function positionDansLeJeu(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) * LARGEUR / r.width, y: (e.clientY - r.top) * HAUTEUR / r.height };
}
// Plein écran (à lancer depuis un clic) :
document.getElementById('plein-ecran').addEventListener('click', () => {
  if (canvas.requestFullscreen) canvas.requestFullscreen().catch(() => {});
});`,
});

SAVOIRS.push({
  id: 'grille-2d', type: 'fiche', titre: 'Plateaux et grilles (tableaux à deux dimensions)',
  mots: ['grille', 'plateau', 'cases', 'damier', 'lignes et colonnes', 'tetris', '2048', 'demineur', 'puissance 4', 'echecs', 'dames', 'sudoku', 'labyrinthe'],
  code: `// Une grille de LIGNES x COLONNES remplie de 0
const LIGNES = 6, COLONNES = 7;
const grille = Array.from({ length: LIGNES }, () => Array(COLONNES).fill(0));
grille[2][3] = 1;                              // ligne 2, colonne 3
// Parcourir toutes les cases :
for (let l = 0; l < LIGNES; l++) {
  for (let c = 0; c < COLONNES; c++) {
    if (grille[l][c] === 1) ctx.fillRect(c * TAILLE, l * TAILLE, TAILLE, TAILLE);
  }
}
// Vérifier qu'une case existe avant de la lire :
const dansGrille = (l, c) => l >= 0 && l < LIGNES && c >= 0 && c < COLONNES;
// Les 8 voisins d'une case (démineur, jeu de la vie) :
function voisins(l, c) {
  const liste = [];
  for (let dl = -1; dl <= 1; dl++) for (let dc = -1; dc <= 1; dc++) {
    if ((dl || dc) && dansGrille(l + dl, c + dc)) liste.push([l + dl, c + dc]);
  }
  return liste;
}
// Copier une grille (sinon on modifie l'originale) :
const copie = grille.map(ligne => ligne.slice());
// Tourner une pièce de 90 degrés (Tetris) :
const tourner = piece => piece[0].map((_, c) => piece.map(ligne => ligne[c]).reverse());
// Grille HTML avec CSS : .plateau { display: grid; grid-template-columns: repeat(7, 48px); gap: 4px; }`,
});

SAVOIRS.push({
  id: 'ia-jeu', type: 'fiche', titre: "Un adversaire contrôlé par l'ordinateur",
  mots: ['contre l\'ordinateur', 'ordinateur joue', 'adversaire', 'bot', 'ennemi intelligent', 'ia du jeu', 'difficulte', 'solo'],
  code: `// 1. Suivre une cible avec une vitesse limitée (raquette de Pong, ennemi qui poursuit) :
const vitesseMax = 3.5;                         // plus petit = plus facile
const ecart = cible.y - ennemi.y;
ennemi.y += Math.max(-vitesseMax, Math.min(vitesseMax, ecart));
// 2. Aller vers le joueur dans toutes les directions :
const angle = Math.atan2(joueur.y - ennemi.y, joueur.x - ennemi.x);
ennemi.x += Math.cos(angle) * 2;
ennemi.y += Math.sin(angle) * 2;
// 3. Jeu de plateau : gagner si possible, sinon bloquer, sinon jouer au hasard.
function coupOrdinateur(cases, moi, adversaire) {
  const libres = cases.map((v, i) => (v ? null : i)).filter(i => i !== null);
  for (const qui of [moi, adversaire]) {
    for (const i of libres) {
      const essai = cases.slice();
      essai[i] = qui;
      if (gagnant(essai) === qui) return i;     // gagner, ou bloquer l'adversaire
    }
  }
  if (libres.includes(4)) return 4;             // morpion : le centre est une bonne case
  return libres[Math.floor(Math.random() * libres.length)];
}
// 4. Niveau de difficulté : l'ordinateur se trompe parfois exprès.
const difficulte = 0.8;                         // 1 = parfait, 0 = toujours au hasard
// if (Math.random() > difficulte) jouerAuHasard(); else jouerLeMeilleurCoup();`,
});

SAVOIRS.push({
  id: 'particules', type: 'fiche', titre: 'Effets de particules (explosions, étincelles, confettis)',
  mots: ['particules', 'explosion', 'explosions', 'exploser', 'etincelles', 'confettis', 'feu d\'artifice', 'feux d\'artifice', 'effets speciaux', 'poussiere'],
  code: `const particules = [];
function exploser(x, y, couleur, nombre = 30) {
  for (let i = 0; i < nombre; i++) {
    const angle = Math.random() * Math.PI * 2;
    const vitesse = 1 + Math.random() * 4;
    particules.push({ x, y, vx: Math.cos(angle) * vitesse, vy: Math.sin(angle) * vitesse, vie: 1, couleur, taille: 2 + Math.random() * 3 });
  }
}
function majParticules() {
  for (let i = particules.length - 1; i >= 0; i--) {
    const p = particules[i];
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.08;                               // un peu de gravité
    p.vx *= 0.98;                               // frottement de l'air
    p.vie -= 0.02;
    if (p.vie <= 0) particules.splice(i, 1);
  }
}
function dessinerParticules() {
  for (const p of particules) {
    ctx.globalAlpha = Math.max(0, p.vie);       // elles s'effacent doucement
    ctx.fillStyle = p.couleur;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.taille, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
// Couleur au hasard : 'hsl(' + Math.floor(Math.random() * 360) + ', 90%, 60%)'
// Exemple : canvas.addEventListener('click', e => exploser(e.offsetX, e.offsetY, '#ffd60a'));`,
});

SAVOIRS.push({
  id: 'fichiers-json', type: 'fiche', titre: 'Exporter et importer un fichier (JSON)',
  mots: ['exporter', 'importer', 'fichier json', 'json', 'sauvegarde dans un fichier', 'charger un fichier', 'ouvrir un fichier', 'telecharger les donnees'],
  code: `// Télécharger des données dans un fichier .json
function telechargerJSON(donnees, nomFichier) {
  const blob = new Blob([JSON.stringify(donnees, null, 2)], { type: 'application/json' });
  const lien = document.createElement('a');
  lien.href = URL.createObjectURL(blob);
  lien.download = nomFichier;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  setTimeout(() => URL.revokeObjectURL(lien.href), 1000);
}
// Ouvrir un fichier choisi par l'utilisateur : <input type="file" id="ouvrir" accept=".json">
document.getElementById('ouvrir').addEventListener('change', async e => {
  const fichier = e.target.files[0];
  if (!fichier) return;
  try {
    const donnees = JSON.parse(await fichier.text());
    console.log('Fichier chargé :', donnees);
  } catch (err) {
    alert("Ce fichier n'est pas un JSON valide.");
  }
});
// Télécharger du texte simple : même chose avec { type: 'text/plain' } et un nom en .txt`,
});

SAVOIRS.push({
  id: 'formulaire-validation', type: 'fiche', titre: 'Vérifier un formulaire avant de l’envoyer',
  mots: ['formulaire', 'inscription', 'champ obligatoire', 'champs obligatoires', 'validation', 'adresse mail', 'email', 'formulaire de contact'],
  code: `<!-- Le navigateur vérifie déjà beaucoup de choses tout seul : -->
<form id="inscription" novalidate>
  <label>Pseudo <input name="pseudo" required minlength="3" maxlength="20"></label>
  <label>Âge <input name="age" type="number" min="7" max="99" required></label>
  <label>Email <input name="email" type="email"></label>
  <button>S'inscrire</button>
  <p id="message" role="status"></p>
</form>
<script>
const form = document.getElementById('inscription');
form.addEventListener('submit', e => {
  e.preventDefault();                          // on reste sur la page
  if (!form.checkValidity()) {                 // un champ ne respecte pas ses règles
    form.reportValidity();                     // le navigateur montre le problème
    return;
  }
  const donnees = Object.fromEntries(new FormData(form));   // { pseudo: '...', age: '12', email: '...' }
  document.getElementById('message').textContent = 'Merci ' + donnees.pseudo + ', inscription enregistrée !';
  form.reset();
});
</script>
<!-- CSS : input:invalid { border-color: #f04438; } -->`,
});

SAVOIRS.push({
  id: 'accessibilite', type: 'fiche', titre: 'Une page utilisable par tout le monde (accessibilité)',
  mots: ['accessible', 'accessibilite', 'malvoyant', 'daltonien', 'lecteur d\'ecran', 'clavier seulement', 'contraste', 'lisible'],
  code: `<!-- 1. De vrais boutons (pas des div cliquables) : ils marchent au clavier tout seuls. -->
<button type="button" id="jouer">Jouer</button>
<!-- 2. Un bouton avec seulement un emoji a besoin d'un nom : -->
<button type="button" aria-label="Couper le son">🔇</button>
<!-- 3. Chaque champ a une étiquette : -->
<label for="pseudo">Ton pseudo</label> <input id="pseudo">
<!-- 4. Les images ont un texte alternatif : -->
<img src="logo.png" alt="Logo du festival 2K27">
<!-- 5. Les messages qui changent sont annoncés par les lecteurs d'écran : -->
<p id="score" aria-live="polite">Score : 0</p>
<style>
  /* 6. Un contour visible quand on navigue au clavier (touche Tab) : */
  :focus-visible { outline: 3px solid #ffd60a; outline-offset: 2px; }
  /* 7. Assez de contraste : texte clair sur fond foncé, ou l'inverse. */
  /* 8. Moins d'animations pour ceux qui le demandent : */
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
</style>
<!-- 9. Ne jamais donner une information seulement par la couleur : ajoute un mot ou un symbole (✔ ✘). -->`,
});

SAVOIRS.push({
  id: 'classes-js', type: 'fiche', titre: 'Les classes : plein d’ennemis avec le même code',
  mots: ['classe javascript', 'class', 'classes', 'plusieurs ennemis', 'beaucoup d\'ennemis', 'constructeur', 'constructor', 'programmation objet'],
  code: `class Ennemi {
  constructor(x, y, vitesse) {                 // appelé à chaque « new Ennemi(...) »
    this.x = x;
    this.y = y;
    this.vitesse = vitesse;
    this.taille = 24;
    this.vivant = true;
  }
  bouger() {
    this.y += this.vitesse;
    if (this.y > canvas.height) this.vivant = false;
  }
  dessiner(ctx) {
    ctx.font = this.taille + 'px serif';
    ctx.fillText('👾', this.x, this.y);
  }
}
let ennemis = [];
setInterval(() => ennemis.push(new Ennemi(Math.random() * 440, 0, 1 + Math.random() * 2)), 800);
function boucle() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const e of ennemis) { e.bouger(); e.dessiner(ctx); }
  ennemis = ennemis.filter(e => e.vivant);     // on enlève ceux qui sont sortis
  requestAnimationFrame(boucle);
}
// Une classe qui en prolonge une autre :
class Boss extends Ennemi {
  constructor(x, y) { super(x, y, 0.5); this.taille = 64; this.vies = 10; }
}`,
});

SAVOIRS.push({
  id: 'theme-sombre', type: 'fiche', titre: 'Thème clair et sombre avec des variables CSS',
  mots: ['theme', 'mode sombre', 'mode nuit', 'dark mode', 'theme sombre', 'theme clair', 'changer de theme', 'variables css'],
  code: `<style>
  :root { --fond: #ffffff; --texte: #101828; --accent: #6a4cff; --carte: #f2f4f7; }
  /* Si l'ordinateur est réglé en mode sombre : */
  @media (prefers-color-scheme: dark) { :root { --fond: #0f1117; --texte: #f2f4f7; --carte: #1d2939; } }
  /* Si l'utilisateur a choisi avec le bouton (plus fort que le réglage de l'ordinateur) : */
  :root[data-theme="clair"] { --fond: #ffffff; --texte: #101828; --carte: #f2f4f7; }
  :root[data-theme="sombre"] { --fond: #0f1117; --texte: #f2f4f7; --carte: #1d2939; }
  body { background: var(--fond); color: var(--texte); transition: background .3s, color .3s; }
  .carte { background: var(--carte); border-radius: 16px; padding: 16px; }
  button { background: var(--accent); color: #fff; }
</style>
<button id="theme">🌓 Changer de thème</button>
<script>
const racine = document.documentElement;
const memorise = localStorage.getItem('theme');
if (memorise) racine.dataset.theme = memorise;
document.getElementById('theme').addEventListener('click', () => {
  const sombreMaintenant = racine.dataset.theme ? racine.dataset.theme === 'sombre' : matchMedia('(prefers-color-scheme: dark)').matches;
  racine.dataset.theme = sombreMaintenant ? 'clair' : 'sombre';
  localStorage.setItem('theme', racine.dataset.theme);
});
</script>`,
});

SAVOIRS.push({
  id: 'securite-code', type: 'fiche', titre: 'Écrire du code sûr',
  mots: ['securite', 'securise', 'pirate', 'hacker', 'mot de passe', 'cle api', 'innerhtml', 'xss', 'donnees personnelles'],
  code: `// 1. Pour afficher un texte tapé par quelqu'un, utilise textContent, jamais innerHTML :
message.textContent = saisie.value;            // sûr : le texte reste du texte
// message.innerHTML = saisie.value;           // dangereux : du code HTML pourrait s'exécuter
// 2. Pour construire des éléments, crée-les un par un :
const li = document.createElement('li');
li.textContent = pseudo;
liste.appendChild(li);
// 3. Ne mets jamais de mot de passe ni de clé secrète dans le code d'une page :
//    tout le monde peut lire le code d'une page web (clic droit, « Afficher le code source »).
// 4. Un « mot de passe » vérifié dans la page ne protège rien de vraiment secret :
//    pour ça, il faut un serveur.
// 5. Ne demande pas d'informations personnelles (adresse, téléphone) si tu n'en as pas besoin.
// 6. Les données venues d'ailleurs (fichier, internet) peuvent être abîmées : vérifie-les.
let donnees;
try { donnees = JSON.parse(texte); } catch (e) { donnees = null; }
if (!Array.isArray(donnees)) donnees = [];`,
});

SAVOIRS.push({
  id: 'vitesse-temps', type: 'fiche', titre: 'Même vitesse de jeu sur tous les ordinateurs',
  mots: ['trop rapide', 'trop vite', 'trop lent', 'trop lentement', 'vitesse', 'ralentir', 'accelerer', 'fps', 'saccade', 'lag', 'fluide', 'delta', 'images par seconde'],
  code: `// requestAnimationFrame va à 60 images par seconde sur un écran, 144 sur un autre.
// Pour que le jeu ait la même vitesse partout, on multiplie par le temps écoulé.
let avant = performance.now();
function boucle(maintenant) {
  const dt = Math.min((maintenant - avant) / 1000, 0.05);   // en secondes, limité si l'onglet était caché
  avant = maintenant;
  joueur.x += joueur.vitesse * dt;              // vitesse en pixels par seconde (ex. 200)
  joueur.vy += GRAVITE * dt;                    // GRAVITE en pixels par seconde², ex. 1200
  joueur.y += joueur.vy * dt;
  dessiner();
  requestAnimationFrame(boucle);
}
requestAnimationFrame(boucle);
// Un chronomètre de jeu qui ne dépend pas des images :
let tempsRestant = 60;
// dans la boucle : tempsRestant -= dt; if (tempsRestant <= 0) finDePartie();
// Pour accélérer petit à petit : vitesseEnnemis = 100 + score * 5;`,
});
