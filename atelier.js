/*
 * atelier.js — l'Atelier : Mira qui code avec son « grand cerveau ».
 *
 * Le petit cerveau (cerveau.js) est écrit de zéro, mais il est des millions de fois
 * trop petit pour savoir coder. Pour coder, Mira utilise un vrai modèle de langage
 * open source déjà entraîné, Qwen2.5-Coder (créé par l'équipe Qwen d'Alibaba), qui
 * tourne entièrement sur ta carte graphique grâce à WebGPU et à la bibliothèque WebLLM.
 * Il se télécharge une seule fois, puis il reste dans le cache du navigateur.
 *
 * Le code qu'elle écrit s'exécute dans un cadre isolé (iframe « sandbox ») : il ne peut
 * pas lire les données de cette page. S'il plante, l'erreur remonte ici et tu peux lui
 * demander de corriger en un clic.
 */
(function () {
  'use strict';

  const WEBLLM = 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.85/+esm';
  const HLJS = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js';
  const CONTEXTE_VOULU = 8192; // taille de sa mémoire de travail, en morceaux de mots (tokens)
  const LETTRES_PAR_TOKEN = 3; // estimation prudente pour du code et du français

  // Temps mesurés sur un ordinateur portable avec carte graphique intégrée (AMD Radeon).
  const MODELES = {
    rapide: { nom: 'Rapide', id: 'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC', taille: '0,9 Go', detail: 'Un petit jeu en 2 à 3 minutes sur un portable. Conseillée pour commencer.' },
    conseille: { nom: 'Plus douée', id: 'Qwen2.5-Coder-3B-Instruct-q4f16_1-MLC', taille: '1,7 Go', detail: 'Fait moins d\'erreurs, mais environ deux fois plus lente.' },
    puissant: { nom: 'La plus douée', id: 'Qwen2.5-Coder-7B-Instruct-q4f16_1-MLC', taille: '4,3 Go', detail: 'Pour les ordinateurs avec une vraie carte graphique de jeu.' },
  };

  // Modèle minuscule pour vérifier que tout marche sans gros téléchargement : index.html?mini
  if (/[?&]mini\b/.test(location.search)) {
    MODELES.mini = { nom: 'Test', id: 'Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC', taille: '0,3 Go', detail: 'Pour les tests seulement.' };
  }

  const IDEES = [
    'Un jeu du serpent avec un score',
    'Une calculatrice colorée',
    'Un quiz de 5 questions sur les planètes',
    "Une page d'accueil pour le festival 2K27",
    "Un compte à rebours jusqu'au 20 octobre 2026",
    "Un morpion contre l'ordinateur",
  ];

  const $ = (s) => document.querySelector(s);
  const stock = {
    lire(cle, defaut) {
      try { const v = localStorage.getItem('mira.atelier.' + cle); return v === null ? defaut : JSON.parse(v); } catch (e) { return defaut; }
    },
    ecrire(cle, valeur) {
      try { localStorage.setItem('mira.atelier.' + cle, JSON.stringify(valeur)); return true; } catch (e) { return false; }
    },
  };

  const etat = {
    modele: stock.lire('modele', 'rapide'),
    festival: stock.lire('festival', true),
    recherche: stock.lire('recherche', true),
    messages: stock.lire('conversation', []), // [{ role: 'user' | 'assistant', content }]
    code: stock.lire('code', null), // { langage, contenu, page }
    webllm: null,
    moteur: null,
    idModele: null,
    reveilEnCours: null,
    enCours: false,
    contexte: 4096,
    vue: 'apercu',
    creations: stock.lire('creations', []), // Mes créations
    creationActuelle: null,
    autoCorrection: stock.lire('autoCorrection', true),
    lectureAuto: stock.lire('lectureAuto', false),
    attenteErreur: null, // moment où sa dernière page a été lancée (pour la correction automatique)
    derniereDemande: '',
    erreurMontree: false,
  };
  if (!MODELES[etat.modele]) etat.modele = 'rapide';

  const nomIA = () => ($('#nom').value || 'Mira').trim() || 'Mira';

  // ---------------------------------------------------------------------------
  // Ce qu'on lui explique avant chaque conversation
  // ---------------------------------------------------------------------------
  function consignes(savoirs) {
    const nom = nomIA();
    let texte = `Tu t'appelles ${nom}. Tu es une IA qui aide à programmer, et tu parles avec la jeune personne qui t'a créée.
Tu tournes entièrement sur son ordinateur, dans son navigateur : ton petit cerveau a été écrit de zéro, et pour coder tu utilises un grand modèle open source, Qwen2.5-Coder.
Règles :
- Réponds toujours en français, simplement et gentiment. Tutoie.
- Quand on te demande un site, une page, un jeu, une animation ou un outil : écris UN SEUL fichier HTML complet dans un bloc \`\`\`html, avec le CSS dans <style> et le JavaScript dans <script>. Aucune image externe : utilise du CSS, des emojis, du SVG ou un <canvas>. Les polices Google Fonts sont permises.
- Le code doit être complet et marcher tout de suite : jamais de « ... » ni de partie à compléter.
- Avant d'écrire le code, prévois ses étapes. Déclare chaque variable et chaque fonction avant de t'en servir, et vérifie que tous les noms que tu utilises existent vraiment.
- Soigne le design : couleurs harmonieuses, coins arrondis, texte lisible, adapté au téléphone.
- Pour un jeu : contrôles au clavier ET boutons à l'écran, un score et un bouton Rejouer.
- Si on te demande de modifier ton code, renvoie le fichier complet modifié.
- Pour Python ou un autre langage, mets le code dans un bloc avec le bon langage et explique comment le lancer.
- Après le code, explique en 2 ou 3 phrases courtes ce que tu as fait.
- Si tu ne sais pas, dis-le honnêtement.`;
    if (savoirs && savoirs.exemple) {
      texte += `\n\nVoici un exemple de code qui fonctionne (« ${savoirs.exemple.titre} »), écrit pour une demande proche. Inspire-t'en fortement : garde ce qui marche, adapte-le exactement à la demande (textes, couleurs, règles), et renvoie un fichier complet.\n\`\`\`html\n${savoirs.exemple.code}\n\`\`\``;
    }
    for (const f of (savoirs && savoirs.fiches) || []) {
      texte += `\n\nFiche utile (« ${f.titre} ») :\n\`\`\`\n${f.code}\n\`\`\``;
    }
    if (savoirs && savoirs.festival.length) {
      texte += '\n\nCe que tu sais du festival gaming 2K27 (programme encore provisoire) :\n' + savoirs.festival.map((s) => `${s.titre} : ${s.texte}`).join('\n');
    }
    if (savoirs && savoirs.recherche && savoirs.recherche.length) {
      texte += "\n\nVoici ce que tu viens de trouver en cherchant sur des sites fiables. Appuie-toi dessus pour répondre, dis de quel site vient l'information, et si ça ne répond pas à la question, dis-le honnêtement au lieu d'inventer :\n"
        + savoirs.recherche.map((r) => `[${r.source} — ${r.titre}]\n${r.texte}`).join('\n\n');
    }
    return texte;
  }

  // ---------------------------------------------------------------------------
  // La recherche sur des sites fiables (recherche.js) : seulement quand c'est utile.
  // ---------------------------------------------------------------------------
  const MOTS_ERREUR = /(uncaught|typeerror|referenceerror|syntaxerror|rangeerror|is not defined|is not a function|cannot read|unexpected token)/i;
  const PAPOTAGE = /^(salut|bonjour|coucou|bonsoir|merci|ok|d'accord|ca va|tu vas bien|comment tu vas|comment ca va|qui es-tu|tu es qui|comment tu t'appelles|tu fais quoi|au revoir)/;

  function planDeRecherche(texte, savoirs) {
    if (!etat.recherche || typeof RECHERCHE === 'undefined') return null;
    const t = sansAccents(texte).trim();
    const explicite = /\b(cherche|recherche|sur internet|sur le web|wikipedia|vikidia|wiktionnaire|mdn|stack overflow)\b/.test(t);
    if (MOTS_ERREUR.test(texte)) return { erreur: true, mdn: RECHERCHE.pagesMDN(texte).length > 0 };
    const mdn = RECHERCHE.pagesMDN(texte).length > 0;
    const question = /\?\s*$/.test(t) || /^(qui|que|qu'|quoi|quel|quelle|quels|quelles|quand|ou |comment|pourquoi|combien|c'est quoi|c est quoi|explique|definition|definis|donne-moi la definition|que veut dire|que signifie|raconte|parle-moi|dis-moi)/.test(t);
    const surElle = /\b(tu|toi|ton|ta|tes|mira)\b/.test(t) && !explicite;
    const creation = !!savoirs.exemple || (VERBES_CREATION.test(t) && !question);
    const plan = { wiki: false, definition: false, mdn: false, erreur: false };
    if (mdn && (question || explicite)) plan.mdn = true;
    if (!mdn && !MOTS_FESTIVAL.test(texte) && !PAPOTAGE.test(t) && !surElle && (explicite || (question && !creation))) plan.wiki = true;
    if (plan.wiki && /(definition|definis|que veut dire|que signifie|sens du mot)/.test(t)) plan.definition = true;
    return plan.wiki || plan.mdn ? plan : null;
  }

  async function lancerRecherche(plan, texte) {
    const requete = RECHERCHE.motsCles(texte);
    const taches = [];
    if (plan.wiki) {
      taches.push(RECHERCHE.chercherWiki('vikidia', requete, { intro: false, caracteres: 1400 }));
      taches.push(RECHERCHE.chercherWiki('wikipedia', requete, { caracteres: 1200 }));
      if (plan.definition) taches.push(RECHERCHE.chercherWiki('wiktionnaire', requete, { intro: false, caracteres: 900 }));
    }
    if (plan.mdn) taches.push(RECHERCHE.chercherMDN(texte, 2500));
    if (plan.erreur) taches.push(RECHERCHE.chercherStackOverflow(texte, 1800));
    const resultats = await Promise.allSettled(taches);
    return {
      trouves: resultats.flatMap((r) => (r.status === 'fulfilled' ? r.value : [])),
      echecs: resultats.filter((r) => r.status === 'rejected').length,
    };
  }

  function sitesDuPlan(plan) {
    const sites = [];
    if (plan.wiki) sites.push('Vikidia', 'Wikipédia');
    if (plan.definition) sites.push('Wiktionnaire');
    if (plan.mdn) sites.push('MDN');
    if (plan.erreur) sites.push('Stack Overflow');
    return sites.join(', ');
  }

  function afficherSources(div, sources) {
    const valides = (sources || []).filter((s) => /^https:\/\//.test(s.lien));
    if (!valides.length) return;
    const p = document.createElement('p');
    p.className = 'note sources';
    p.append('🔎 Sources : ');
    valides.forEach((s, i) => {
      if (i) p.append(' · ');
      const a = document.createElement('a');
      a.href = s.lien;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = `${s.source} — ${s.titre}`;
      p.append(a);
    });
    div.append(p);
  }

  // On ne lui donne le programme du festival que si la conversation en parle :
  // ça lui laisse plus de mémoire de travail et elle répond plus vite le reste du temps.
  const MOTS_FESTIVAL = /festival|2k27|gaming|tournoi|saj\b|cestas|halle|pegi|toussaint|interco|structures? invit/i;
  function parleDuFestival() {
    return etat.messages.slice(-6).some((m) => m.role === 'user' && MOTS_FESTIVAL.test(m.content));
  }

  // ---------------------------------------------------------------------------
  // Sa bibliothèque (savoirs.js et festival-resume.js) : on cherche ce qui correspond
  // à la demande, comme un moteur de recherche, pour le lui faire lire avant de répondre.
  // ---------------------------------------------------------------------------
  const sansAccents = (t) => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const VERBES_CREATION = /\b(fais|fait|faire|cree|creer|ecris|ecrire|code|coder|programme|programmer|invente|genere|construis|je veux|j'aimerais|je voudrais)\b|\bun jeu\b|\bune page\b|\bun site\b|\bune appli|\bun outil\b/;

  // Un mot compte seulement s'il est entier : « liste » ne doit pas trouver « listener ».
  const motEntier = (texte, mot) => {
    if (!/^[a-z0-9' -]+$/.test(mot)) return texte.includes(mot);
    let i = texte.indexOf(mot);
    while (i >= 0) {
      const avant = texte[i - 1], apres = texte[i + mot.length];
      if (!(avant && /[a-z0-9]/.test(avant)) && !(apres && /[a-z0-9]/.test(apres))) return true;
      i = texte.indexOf(mot, i + 1);
    }
    return false;
  };

  function pertinence(mots, texte) {
    let n = 0;
    for (const m of mots) {
      const mot = sansAccents(m).trim();
      if (mot && motEntier(texte, mot)) n += mot.length >= 6 ? 2 : 1;
    }
    return n;
  }

  // Tes créations marquées « Garder comme exemple » deviennent des exemples pour elle.
  const MOTS_VIDES = new Set(['avec', 'pour', 'dans', 'fais', 'faire', 'fait', 'une', 'des', 'les', 'qui', 'que', 'plus', 'tres', 'cette', 'mais', 'aussi', 'veux', 'voudrais', 'aimerais', 'peux', 'peut', 'code', 'modifie', 'main', 'ajoute', 'moi', 'toi', 'sont', 'etre', 'avoir']);
  function exemplesPerso() {
    return (etat.creations || []).filter((c) => c.exemple && c.page).map((c) => ({
      id: c.id, type: 'exemple', perso: true, titre: `${c.titre} (une de tes réussites)`, code: c.contenu,
      mots: Array.from(new Set(sansAccents(c.titre + ' ' + c.demande).split(/[^a-z0-9]+/).filter((m) => m.length >= 4 && !MOTS_VIDES.has(m)))),
    }));
  }

  function choisirSavoirs(demande) {
    const texte = sansAccents(demande);
    const choix = { exemple: null, fiches: [], festival: [] };
    if (typeof SAVOIRS !== 'undefined') {
      // Pour une simple modification (« rends-le plus rapide »), son dernier code suffit.
      const codeRecent = etat.messages.slice(-3, -1).some((m) => m.role === 'assistant' && m.content.includes('```'));
      // Pour corriger une erreur, elle repart de son propre code : pas d'exemple.
      if (!MOTS_ERREUR.test(demande) && (!codeRecent || VERBES_CREATION.test(texte))) {
        const exemples = SAVOIRS.filter((s) => s.type === 'exemple').concat(exemplesPerso())
          .map((s) => { const n = pertinence(s.mots, texte); return [s, n > 0 && s.perso ? n + 1 : n]; })
          .filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1]);
        if (exemples.length) choix.exemple = exemples[0][0];
      }
      const seuil = choix.exemple ? 2 : 1;
      choix.fiches = SAVOIRS.filter((s) => s.type === 'fiche')
        .map((s) => [s, pertinence(s.mots, texte)]).filter((x) => x[1] >= seuil)
        .sort((a, b) => b[1] - a[1]).slice(0, choix.exemple ? 1 : 2).map((x) => x[0]);
    }
    if (etat.festival && typeof FESTIVAL_SECTIONS !== 'undefined' && parleDuFestival()) {
      choix.festival = FESTIVAL_SECTIONS
        .map((s) => [s, s.id === 'general' ? 1000 : pertinence(s.mots, texte)])
        .sort((a, b) => b[1] - a[1]).map((x) => x[0]);
    }
    return choix;
  }

  function nomsDesSavoirs(s) {
    const noms = [];
    if (s.exemple) noms.push(`l'exemple « ${s.exemple.titre} »`);
    for (const f of s.fiches) noms.push(`la fiche « ${f.titre} »`);
    if (s.festival.length) noms.push(s.festival.length === FESTIVAL_SECTIONS.length ? 'tout ce qu\'elle sait du festival 2K27' : 'le festival 2K27 (' + s.festival.map((x) => x.titre.toLowerCase()).join(', ') + ')');
    if (s.recherche && s.recherche.length) noms.push('sa recherche sur ' + Array.from(new Set(s.recherche.map((r) => r.source))).join(', '));
    return noms;
  }

  const maxReponse = () => (etat.contexte >= 8192 ? 3072 : 1536);

  // Garde les savoirs et les derniers messages qui tiennent dans sa mémoire de travail.
  function construireMessages(savoirs) {
    const limite = (etat.contexte - maxReponse() - 64) * LETTRES_PAR_TOKEN;
    const derniere = etat.messages.length ? etat.messages[etat.messages.length - 1].content.length : 0;
    const s = { exemple: savoirs.exemple, fiches: savoirs.fiches.slice(), festival: savoirs.festival.slice(), recherche: (savoirs.recherche || []).slice() };
    let systeme = consignes(s);
    // Si c'est trop long, on retire d'abord les fiches, puis les sujets du festival les moins utiles,
    // puis les résultats de recherche en trop, puis l'exemple.
    while (systeme.length + derniere + 1500 > limite) {
      if (s.fiches.length) s.fiches.pop();
      else if (s.festival.length > 1) s.festival.pop();
      else if (s.recherche.length > 1) s.recherche.pop();
      else if (s.exemple) s.exemple = null;
      else if (s.recherche.length) s.recherche.pop();
      else if (s.festival.length) s.festival.pop();
      else break;
      systeme = consignes(s);
    }
    const budget = limite - systeme.length;
    const garde = [];
    let total = 0;
    for (let i = etat.messages.length - 1; i >= 0; i--) {
      let contenu = etat.messages[i].content;
      if (total + contenu.length > budget) {
        if (garde.length) break;
        contenu = contenu.slice(-Math.max(200, budget));
      }
      garde.unshift({ role: etat.messages[i].role, content: contenu });
      total += contenu.length;
    }
    while (garde.length && garde[0].role !== 'user') garde.shift();
    return { messages: [{ role: 'system', content: systeme }, ...garde], utilises: s };
  }

  // ---------------------------------------------------------------------------
  // Le réveil du grand cerveau
  // ---------------------------------------------------------------------------
  async function verifierGPU() {
    if (!('gpu' in navigator)) {
      return { ok: false, message: 'Ton navigateur ne sait pas utiliser ta carte graphique (WebGPU). Ouvre cette page avec Chrome ou Edge à jour, sur ordinateur.' };
    }
    let adaptateur = null;
    try { adaptateur = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' }); } catch (e) { /* rien */ }
    if (!adaptateur) {
      return { ok: false, message: "WebGPU est là, mais aucune carte graphique n'est disponible. Vérifie que l'accélération matérielle est activée dans les paramètres du navigateur." };
    }
    return { ok: true, f16: adaptateur.features.has('shader-f16') };
  }

  function idPour(cle, f16) {
    const id = MODELES[cle].id;
    return f16 ? id : id.replace('q4f16_1', 'q4f32_1');
  }

  const dejaTelecharge = (cle) => stock.lire('telecharge.' + idPour(cle, true), false) || stock.lire('telecharge.' + idPour(cle, false), false);

  function traduire(texte, progres) {
    const t = String(texte || '');
    const pc = Math.round((progres || 0) * 100);
    let m = t.match(/Fetching param cache\[\d+\/\d+\]: ([\d.]+)MB/);
    if (m) return `Téléchargement du grand cerveau : ${Math.round(+m[1])} Mo (${pc} %). Seulement la première fois !`;
    m = t.match(/Loading model from cache\[\d+\/\d+\]: ([\d.]+)MB/);
    if (m) return `Chargement depuis ton ordinateur : ${Math.round(+m[1])} Mo (${pc} %)`;
    if (/shader/i.test(t)) return 'Préparation de la carte graphique…';
    if (/Finish loading/i.test(t)) return 'Elle est réveillée !';
    return `Préparation… (${pc} %)`;
  }

  function progression(valeur, texte) {
    const barre = $('#progression'), ligne = $('#progression-texte');
    if (valeur === null) { barre.hidden = true; ligne.hidden = true; return; }
    barre.hidden = false;
    ligne.hidden = false;
    barre.querySelector('i').style.width = Math.round(Math.max(0, Math.min(1, valeur)) * 100) + '%';
    ligne.textContent = texte;
  }

  function messageErreur(e) {
    const t = String((e && e.message) || e);
    if (/WebGPU|carte graphique/.test(t) && /[éà]/.test(t)) return t;
    if (/memory|OOM|allocat|device.?lost|DeviceLost/i.test(t)) return "Ta carte graphique n'a pas assez de mémoire pour ce cerveau. Choisis une taille plus petite, ferme les autres onglets et réessaie.";
    if (/quota|storage/i.test(t)) return "Il n'y a pas assez de place pour le télécharger. Libère de l'espace sur ton ordinateur ou choisis une taille plus petite.";
    if (/fetch|network/i.test(t)) return `Le téléchargement a échoué plusieurs fois. Vérifie ta connexion internet et réessaie : ce qui est déjà téléchargé est gardé. (Détail : ${t.slice(0, 160)})`;
    return "Oups, elle n'a pas pu se réveiller : " + t;
  }

  // Hugging Face coupe parfois un téléchargement : on réessaie tout seul, sans perdre
  // les morceaux déjà enregistrés.
  async function creerAvecEssais(id, suivi, options) {
    for (let essai = 1; ; essai++) {
      try {
        return await creerMoteur(id, suivi, options);
      } catch (e) {
        if (essai >= 4 || !/network|fetch|Cache\.add/i.test(String((e && e.message) || e))) throw e;
        progression(0, `Petite coupure de connexion, je reprends le téléchargement (essai ${essai + 1} sur 4)…`);
        await new Promise((r) => setTimeout(r, 2000 * 2 ** (essai - 1)));
      }
    }
  }

  // Le modèle tourne dans un « Worker » pour ne pas figer la page. Si le navigateur
  // refuse de créer ce Worker, il tourne directement dans la page.
  // Le grand cerveau est rangé dans IndexedDB : le cache classique du navigateur
  // refuse parfois les téléchargements de Hugging Face (« Cache.add() network error »).
  const configuration = () => Object.assign({}, etat.webllm.prebuiltAppConfig, { cacheBackend: 'indexeddb' });

  async function creerMoteur(id, suivi, options) {
    const webllm = etat.webllm;
    const reglages = { initProgressCallback: suivi, appConfig: configuration() };
    let travail = null;
    try {
      const source = `import { WebWorkerMLCEngineHandler } from '${WEBLLM}';\nconst gestion = new WebWorkerMLCEngineHandler();\nself.onmessage = (m) => gestion.onmessage(m);`;
      travail = new Worker(URL.createObjectURL(new Blob([source], { type: 'text/javascript' })), { type: 'module' });
    } catch (e) {
      travail = null;
    }
    if (travail) {
      const panne = new Promise((_, rejeter) => {
        travail.addEventListener('error', () => rejeter(Object.assign(new Error('Worker indisponible'), { ouvrier: true })), { once: true });
      });
      panne.catch(() => {});
      try {
        return await Promise.race([webllm.CreateWebWorkerMLCEngine(travail, id, reglages, options), panne]);
      } catch (e) {
        travail.terminate();
        if (!e.ouvrier) throw e;
      }
    }
    return webllm.CreateMLCEngine(id, reglages, options);
  }

  function reveiller() {
    if (etat.moteur) return Promise.resolve(etat.moteur);
    if (etat.reveilEnCours) return etat.reveilEnCours;
    etat.reveilEnCours = (async () => {
      $('#alerte-gpu').hidden = true;
      $('#reveiller').disabled = true;
      bloquerChoix(true);
      majEtat('Réveil en cours…');
      progression(0, 'Préparation…');
      try {
        const gpu = await verifierGPU();
        if (!gpu.ok) throw new Error(gpu.message);
        if (!etat.webllm) {
          progression(0, 'Chargement de la bibliothèque WebLLM…');
          etat.webllm = await import(WEBLLM);
        }
        const id = idPour(etat.modele, gpu.f16);
        // On demande au navigateur de ne pas effacer son grand cerveau quand il manque de place.
        try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) { /* rien */ }
        let efface = false;
        const suivi = (p) => {
          let texte = traduire(p.text, p.progress);
          // Elle croyait l'avoir déjà, mais il faut le retélécharger : le navigateur l'avait effacé.
          if (/Fetching param cache/.test(p.text) && stock.lire('telecharge.' + id, false)) {
            efface = true;
            stock.ecrire('telecharge.' + id, false);
          }
          if (efface) texte = 'Ton navigateur avait effacé mon grand cerveau pour faire de la place, je le retélécharge. ' + texte;
          progression(p.progress, texte);
        };
        let moteur;
        try {
          moteur = await creerAvecEssais(id, suivi, { context_window_size: CONTEXTE_VOULU });
          etat.contexte = CONTEXTE_VOULU;
        } catch (e) {
          // Si la grande mémoire de travail ne passe pas, on réessaie avec celle par défaut.
          if (!/context|window|memory|buffer|size|limit/i.test(String(e && e.message))) throw e;
          moteur = await creerAvecEssais(id, suivi, {});
          etat.contexte = 4096;
        }
        stock.ecrire('telecharge.' + id, true);
        etat.moteur = moteur;
        etat.idModele = id;
        progression(null);
        $('#reveil').hidden = true;
        $('#changer-cerveau').hidden = false;
        majEtat();
        afficherModeles();
        return moteur;
      } catch (e) {
        progression(null);
        const alerte = $('#alerte-gpu');
        alerte.textContent = messageErreur(e);
        alerte.hidden = false;
        majEtat('Grand cerveau endormi');
        throw e;
      } finally {
        etat.reveilEnCours = null;
        $('#reveiller').disabled = false;
        bloquerChoix(false);
      }
    })();
    return etat.reveilEnCours;
  }

  async function endormir() {
    if (etat.enCours) return;
    const m = etat.moteur;
    etat.moteur = null;
    etat.idModele = null;
    if (m) { try { await m.unload(); } catch (e) { /* rien */ } }
    $('#reveil').hidden = false;
    $('#changer-cerveau').hidden = true;
    afficherModeles();
    majEtat('Grand cerveau endormi');
  }

  function bloquerChoix(oui) {
    for (const r of document.querySelectorAll('#modeles input')) r.disabled = oui;
  }

  function afficherModeles() {
    const box = $('#modeles');
    box.textContent = '';
    for (const [cle, m] of Object.entries(MODELES)) {
      const l = document.createElement('label');
      l.className = 'modele';
      const r = document.createElement('input');
      r.type = 'radio';
      r.name = 'modele';
      r.value = cle;
      r.checked = cle === etat.modele;
      r.addEventListener('change', () => { etat.modele = cle; stock.ecrire('modele', cle); majBoutonReveil(); });
      const b = document.createElement('b');
      b.textContent = m.nom;
      const s = document.createElement('span');
      s.textContent = `${m.taille} à télécharger. ${m.detail}`;
      l.append(r, b, s);
      if (dejaTelecharge(cle)) {
        const e = document.createElement('em');
        e.textContent = 'Déjà sur ton ordinateur';
        l.append(e);
      }
      box.append(l);
    }
    majBoutonReveil();
  }

  function majBoutonReveil() {
    const m = MODELES[etat.modele];
    $('#reveiller').textContent = dejaTelecharge(etat.modele) ? `Réveiller ${nomIA()}` : `Télécharger (${m.taille}) et réveiller ${nomIA()}`;
  }

  function majEtat(texte) {
    if (texte) { $('#etat-grand-cerveau').textContent = texte; return; }
    if (!etat.moteur) { $('#etat-grand-cerveau').textContent = 'Grand cerveau endormi'; return; }
    const taille = (etat.idModele.match(/-(\d+(?:\.\d+)?B)-/) || [])[1] || '';
    $('#etat-grand-cerveau').textContent = `Grand cerveau : Qwen2.5-Coder ${taille} · prêt`;
  }

  // ---------------------------------------------------------------------------
  // Afficher ses réponses : texte simple + blocs de code
  // ---------------------------------------------------------------------------
  function decouper(texte) {
    const parties = [];
    const re = /```([\w+#.-]*)[^\n]*\n([\s\S]*?)(```|$)/g;
    let dernier = 0, m;
    while ((m = re.exec(texte))) {
      if (m.index > dernier) parties.push({ type: 'texte', contenu: texte.slice(dernier, m.index) });
      parties.push({ type: 'code', langage: (m[1] || '').toLowerCase(), contenu: m[2].replace(/\n$/, ''), ferme: m[3] === '```' });
      dernier = re.lastIndex;
    }
    if (dernier < texte.length) parties.push({ type: 'texte', contenu: texte.slice(dernier).replace(/`{1,3}[\w-]*$/, '') });
    return parties;
  }

  const echapper = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const enLigne = (s) => echapper(s)
    .replace(/`([^`]+)`/g, '<code class="enligne">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  function rendreTexte(conteneur, texte) {
    let liste = null, para = [];
    const viderPara = () => {
      if (!para.length) return;
      const p = document.createElement('p');
      p.innerHTML = para.map(enLigne).join('<br>');
      conteneur.append(p);
      para = [];
    };
    for (const ligne of texte.replace(/\r/g, '').split('\n')) {
      const puce = ligne.match(/^\s*[-*•]\s+(.*)/), num = ligne.match(/^\s*\d+[.)]\s+(.*)/), titre = ligne.match(/^\s*#{1,6}\s+(.*)/);
      if (puce || num) {
        viderPara();
        const type = puce ? 'UL' : 'OL';
        if (!liste || liste.tagName !== type) { liste = document.createElement(type); conteneur.append(liste); }
        const li = document.createElement('li');
        li.innerHTML = enLigne((puce || num)[1]);
        liste.append(li);
        continue;
      }
      liste = null;
      if (titre) {
        viderPara();
        const h = document.createElement('h4');
        h.innerHTML = enLigne(titre[1]);
        conteneur.append(h);
      } else if (!ligne.trim()) viderPara();
      else para.push(ligne);
    }
    viderPara();
  }

  const estPage = (p) => p.langage === 'html' || p.langage === 'svg' || (!p.langage && /^\s*<(!doctype|html|head|body)/i.test(p.contenu));

  function bouton(texte, action) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'bouton petit';
    b.textContent = texte;
    b.addEventListener('click', action);
    return b;
  }

  function blocCode(partie, fini) {
    const bloc = document.createElement('div');
    bloc.className = 'bloc-code';
    const entete = document.createElement('div');
    entete.className = 'bloc-entete';
    const nom = document.createElement('span');
    nom.textContent = partie.langage || 'code';
    entete.append(nom);
    if (fini) {
      if (estPage(partie)) entete.append(bouton('Voir le résultat', () => montrer({ langage: 'html', contenu: partie.contenu, page: true }, true)));
      entete.append(bouton('Copier', () => copier(partie.contenu)));
    }
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = partie.contenu;
    if (partie.langage) code.className = 'language-' + partie.langage;
    pre.append(code);
    bloc.append(entete, pre);
    if (fini) colorer(code);
    return bloc;
  }

  function rendre(corps, texte, fini) {
    corps.textContent = '';
    for (const p of decouper(texte)) {
      if (p.type === 'texte') rendreTexte(corps, p.contenu);
      else corps.append(blocCode(p, fini && p.ferme));
    }
    if (!fini) {
      let dernier = corps.lastElementChild;
      if (dernier && dernier.classList.contains('bloc-code')) dernier = dernier.querySelector('code');
      if (!dernier) { dernier = document.createElement('p'); corps.append(dernier); }
      dernier.classList.add('curseur');
    }
  }

  let hljsPromesse = null;
  function colorer(el) {
    if (!hljsPromesse) {
      hljsPromesse = new Promise((ok) => {
        const s = document.createElement('script');
        s.src = HLJS;
        s.onload = () => { try { window.hljs.configure({ ignoreUnescapedHTML: true }); } catch (e) { /* rien */ } ok(window.hljs); };
        s.onerror = () => ok(null);
        document.head.append(s);
      });
    }
    hljsPromesse.then((h) => {
      if (!h || !el.isConnected || el.textContent.length > 60000) return;
      try { delete el.dataset.highlighted; h.highlightElement(el); } catch (e) { /* rien */ }
    });
  }

  // ---------------------------------------------------------------------------
  // Le fil de la conversation
  // ---------------------------------------------------------------------------
  const presDuBas = () => { const f = $('#fil'); return f.scrollHeight - f.scrollTop - f.clientHeight < 80; };
  const defiler = () => { const f = $('#fil'); f.scrollTop = f.scrollHeight; };

  function bulleMira(texte, fini) {
    const div = document.createElement('div');
    div.className = 'msg mira';
    const qui = document.createElement('div');
    qui.className = 'qui';
    const nom = document.createElement('span');
    nom.className = 'nom-ia';
    nom.textContent = nomIA();
    const lireBouton = document.createElement('button');
    lireBouton.type = 'button';
    lireBouton.className = 'lire';
    lireBouton.textContent = '🔊';
    lireBouton.title = 'Lire à voix haute (clique encore pour arrêter)';
    lireBouton.setAttribute('aria-label', 'Lire cette réponse à voix haute');
    qui.append(document.createElement('i'), nom, lireBouton);
    const corps = document.createElement('div');
    corps.className = 'corps';
    lireBouton.addEventListener('click', () => lire(corps.dataset.texte || corps.textContent));
    corps.dataset.texte = texte;
    div.append(qui, corps);
    rendre(corps, texte, fini);
    $('#fil').append(div);
    return { div, corps };
  }

  function bulleToi(texte, auto) {
    const div = document.createElement('div');
    div.className = 'msg toi';
    div.textContent = (auto ? '🔧 Correction automatique : ' : '') + texte;
    $('#fil').append(div);
    return div;
  }

  function afficherFil() {
    $('#fil').textContent = '';
    if (!etat.messages.length) {
      const nb = typeof SAVOIRS !== 'undefined' ? SAVOIRS.filter((s) => s.type === 'exemple').length : 0;
      bulleMira(`Salut ! Je suis ${nomIA()}. Dis-moi ce que tu veux créer : un jeu, une page, un outil pour le festival… J'écris le code et tu le vois tourner à droite.${nb ? ` J'ai une bibliothèque de ${nb} exemples de code qui marchent : je m'en inspire pour faire moins d'erreurs.` : ''} Je peux quand même me tromper : si quelque chose ne marche pas, dis-le-moi et je corrige.`, true);
    }
    for (const m of etat.messages) {
      if (m.discret) {
        if (m.role === 'user') {
          const n = document.createElement('p');
          n.className = 'note';
          n.style.alignSelf = 'center';
          n.textContent = '✏️ Tu as modifié le code : elle repartira de ta version.';
          $('#fil').append(n);
        }
      } else if (m.role === 'user') bulleToi(m.content, m.auto);
      else {
        const { div } = bulleMira(m.content, true);
        if (m.aides && m.aides.length) {
          const n = document.createElement('p');
          n.className = 'note';
          n.textContent = '📚 Elle s\'est aidée de ' + m.aides.join(', ') + '.';
          div.append(n);
        }
        afficherSources(div, m.sources);
      }
    }
    $('#idees').hidden = etat.messages.length > 0;
    defiler();
  }

  function afficherSavoirs() {
    if (typeof SAVOIRS === 'undefined') { $('#savoirs').hidden = true; return; }
    const exemples = SAVOIRS.filter((s) => s.type === 'exemple').concat(exemplesPerso());
    const fiches = SAVOIRS.filter((s) => s.type === 'fiche');
    const sujets = typeof FESTIVAL_SECTIONS !== 'undefined' ? FESTIVAL_SECTIONS.length : 0;
    const perso = exemplesPerso().length;
    $('#savoirs-titre').textContent = `Ce qu'elle sait : ${exemples.length} exemples de code${perso ? ` (dont ${perso} de tes réussites)` : ''}, ${fiches.length} fiches` + (sujets ? `, le festival 2K27 (${sujets} sujets)` : '');
    const box = $('#savoirs-exemples');
    box.textContent = '';
    for (const e of exemples) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = e.titre;
      b.title = 'Voir cet exemple tourner';
      b.addEventListener('click', () => montrer({ langage: 'html', contenu: e.code, page: true }, true));
      box.append(b);
    }
    $('#savoirs-fiches').textContent = 'Fiches : ' + fiches.map((f) => f.titre).join(' · ') + '.';
  }

  function afficherIdees() {
    const box = $('#idees');
    box.textContent = '';
    for (const i of IDEES) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = i;
      b.addEventListener('click', () => envoyer(i));
      box.append(b);
    }
  }

  async function envoyer(brut, options) {
    const texte = String(brut || '').trim();
    const auto = !!(options && options.auto);
    if (!texte || etat.enCours) return;
    const zone = $('#texte-demande');
    if (!auto) zone.value = '';
    ajusterZone();
    etat.enCours = true;
    etat.attenteErreur = null;
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    majBoutons();
    if (!etat.messages.length) $('#fil').textContent = '';
    $('#idees').hidden = true;
    // La demande « d'origine » donne son nom à la création (pas les messages de correction).
    if (!auto && !MOTS_ERREUR.test(texte)) etat.derniereDemande = texte;
    const maBulle = bulleToi(texte, auto);
    const { div, corps } = bulleMira('', false);
    defiler();
    if (!etat.moteur) {
      corps.textContent = '';
      const p = document.createElement('p');
      p.className = 'curseur';
      p.textContent = dejaTelecharge(etat.modele)
        ? 'Je me réveille…'
        : 'Je me réveille… La première fois, je dois télécharger mon grand cerveau : regarde la barre de progression en haut.';
      corps.append(p);
      try {
        await reveiller();
      } catch (e) {
        maBulle.remove();
        div.remove();
        if (!etat.messages.length) afficherFil();
        zone.value = texte;
        ajusterZone();
        etat.enCours = false;
        majBoutons();
        return;
      }
    }
    etat.messages.push(auto ? { role: 'user', content: texte, auto: true } : { role: 'user', content: texte });
    // L'ancien aperçu s'arrête pendant qu'elle écrit : ça lui laisse toute la puissance.
    enleverErreur();
    etat.erreurMontree = true;
    $('#cadre').srcdoc = '';

    let reponse = '', fin = null, vitesse = null, prevu = false, termine = false;
    let cachee = document.hidden;
    const surCache = () => { if (document.hidden) cachee = true; };
    document.addEventListener('visibilitychange', surCache);
    const debut = performance.now();
    majEtat(`${nomIA()} réfléchit…`);
    const dessiner = () => {
      prevu = false;
      // Un dernier dessin prévu pendant l'écriture ne doit pas effacer l'affichage final.
      if (termine) return;
      const suivre = presDuBas();
      rendre(corps, reponse, false);
      if (suivre) defiler();
      codeEnDirect(reponse);
    };
    const savoirs = choisirSavoirs(texte);
    const plan = planDeRecherche(texte, savoirs);
    let rechercheRatee = false;
    if (plan) {
      const sites = sitesDuPlan(plan);
      majEtat(`${nomIA()} cherche sur ${sites}…`);
      corps.textContent = '';
      const p = document.createElement('p');
      p.className = 'curseur';
      p.textContent = `🔎 Je cherche sur ${sites}…`;
      corps.append(p);
      const trouve = await lancerRecherche(plan, texte);
      savoirs.recherche = trouve.trouves;
      rechercheRatee = !trouve.trouves.length;
    }
    const preparation = construireMessages(savoirs);
    const sources = preparation.utilises.recherche.map((r) => ({ source: r.source, titre: r.titre, lien: r.lien }));
    const aides = nomsDesSavoirs(preparation.utilises);
    if (aides.length) majEtat(`${nomIA()} lit ${aides.join(', ')}…`);
    try {
      const flux = await etat.moteur.chat.completions.create({
        messages: preparation.messages,
        stream: true,
        stream_options: { include_usage: true },
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: maxReponse(),
      });
      let morceaux = 0;
      for await (const m of flux) {
        const choix = m.choices && m.choices[0];
        if (choix && choix.delta && choix.delta.content) {
          reponse += choix.delta.content;
          morceaux++;
          if (morceaux % 8 === 0) majEtat(`${nomIA()} écrit… ${Math.round((performance.now() - debut) / 1000)} s · ${morceaux} mots`);
          if (!prevu) { prevu = true; requestAnimationFrame(dessiner); }
        }
        if (choix && choix.finish_reason) fin = choix.finish_reason;
        if (m.usage && m.usage.extra) vitesse = m.usage.extra.decode_tokens_per_s;
      }
    } catch (e) {
      if (!reponse) reponse = "Oups, j'ai eu un problème : " + ((e && e.message) || e);
    }
    termine = true;
    const propre = reponse.trim() || '(elle n\'a rien répondu)';
    etat.messages.push({ role: 'assistant', content: propre, aides, sources });
    stock.ecrire('conversation', etat.messages.slice(-40));
    corps.dataset.texte = propre;
    rendre(corps, propre, true);
    document.removeEventListener('visibilitychange', surCache);
    const note = (texte) => {
      const n = document.createElement('p');
      n.className = 'note';
      n.textContent = texte;
      div.append(n);
    };
    if (aides.length) note('📚 Elle s\'est aidée de ' + aides.join(', ') + '.');
    afficherSources(div, sources);
    if (plan && rechercheRatee) note('🔎 Sa recherche n\'a rien donné (pas de résultat ou pas de connexion) : elle a répondu avec ce qu\'elle sait déjà.');
    if (fin === 'length') note('Sa réponse était trop longue et a été coupée. Demande-lui une version plus courte, ou de continuer.');
    if (cachee) note('Astuce : laisse cet onglet au premier plan pendant qu\'elle écrit. Quand il est caché, le navigateur la ralentit beaucoup.');
    const duree = Math.round((performance.now() - debut) / 1000);
    majEtat();
    if (vitesse) $('#etat-grand-cerveau').textContent += ` · ${duree} s, ${Math.round(vitesse)} mots/s`;
    etat.enCours = false;
    majBoutons();
    const nouveau = montrerDepuis(propre);
    if (nouveau) {
      // Une correction remplace la version cassée ; une nouvelle demande crée une nouvelle création.
      const actuelle = etat.creations.find((c) => c.id === etat.creationActuelle);
      if ((auto || MOTS_ERREUR.test(texte)) && actuelle) {
        Object.assign(actuelle, { contenu: nouveau.contenu, langage: nouveau.langage, page: !!nouveau.page, date: Date.now() });
        sauverCreations();
        afficherCreations();
      } else enregistrerCreation(nouveau, etat.derniereDemande || texte);
      // Correction automatique : si sa page plante dès le lancement, elle réessaie une fois.
      if (nouveau.page && !auto) etat.attenteErreur = Date.now();
    }
    if (etat.lectureAuto) lire(propre);
    defiler();
    $('#texte-demande').focus();
  }

  async function arreter() {
    if (!etat.enCours || !etat.moteur) return;
    try { await etat.moteur.interruptGenerate(); } catch (e) { /* rien */ }
  }

  function majBoutons() {
    $('#envoyer').hidden = etat.enCours;
    $('#arreter').hidden = !etat.enCours;
    $('#nouvelle-conversation').disabled = etat.enCours;
    $('#changer-cerveau').disabled = etat.enCours;
  }

  function ajusterZone() {
    const z = $('#texte-demande');
    z.style.height = 'auto';
    z.style.height = Math.min(180, z.scrollHeight + 2) + 'px';
  }

  // ---------------------------------------------------------------------------
  // L'aperçu : on exécute sa page dans un cadre isolé
  // ---------------------------------------------------------------------------
  // Petit script ajouté au début de sa page (sur la même ligne, pour ne pas décaler les
  // numéros de ligne des erreurs) : il remplace localStorage (interdit dans le cadre
  // isolé), recopie la console et nous signale les erreurs pour qu'elle les corrige.
  const AIDE_CADRE = '<script>(function(){try{window.localStorage.getItem("x")}catch(e){var m={},f={getItem:function(k){return Object.prototype.hasOwnProperty.call(m,k)?m[k]:null},setItem:function(k,v){m[k]=String(v)},removeItem:function(k){delete m[k]},clear:function(){m={}},key:function(i){return Object.keys(m)[i]||null},get length(){return Object.keys(m).length}};try{Object.defineProperty(window,"localStorage",{value:f,configurable:true});Object.defineProperty(window,"sessionStorage",{value:f,configurable:true})}catch(e2){}}function p(d){try{parent.postMessage(d,"*")}catch(e3){}}function txt(a){if(a instanceof Error)return a.name+": "+a.message;if(typeof a==="object"&&a!==null){try{return JSON.stringify(a)}catch(e4){}}return String(a)}["log","info","warn","error"].forEach(function(n){var o=console[n];console[n]=function(){p({mira:"console",niveau:n,texte:Array.prototype.map.call(arguments,txt).join(" ")});return o.apply(console,arguments)}});window.addEventListener("error",function(e){p({mira:"erreur",message:String(e.message)});p({mira:"console",niveau:"error",texte:e.message+(e.lineno?" (ligne "+e.lineno+")":"")})});window.addEventListener("unhandledrejection",function(e){var r=e.reason&&e.reason.message||e.reason;p({mira:"erreur",message:String(r)});p({mira:"console",niveau:"error",texte:String(r)})})})();<\/script>';

  function avecAide(page) {
    const m = page.match(/<head[^>]*>/i) || page.match(/<html[^>]*>/i);
    if (m) return page.slice(0, m.index + m[0].length) + AIDE_CADRE + page.slice(m.index + m[0].length);
    const d = page.match(/^\s*<!doctype[^>]*>/i);
    return d ? d[0] + AIDE_CADRE + page.slice(d[0].length) : AIDE_CADRE + page;
  }

  function injecter(page, bout, avant) {
    const i = page.toLowerCase().lastIndexOf(avant);
    return i >= 0 ? page.slice(0, i) + bout + '\n' + page.slice(i) : page + '\n' + bout;
  }

  // Les petits modèles écrivent parfois le HTML, le CSS et le JS dans des blocs séparés :
  // on les rassemble en une seule page.
  function assembler(parties) {
    const codes = parties.filter((p) => p.type === 'code' && p.ferme);
    if (!codes.length) return null;
    const html = codes.slice().reverse().find(estPage);
    const css = codes.filter((p) => p.langage === 'css').map((p) => p.contenu).join('\n');
    const js = codes.filter((p) => p.langage === 'js' || p.langage === 'javascript').map((p) => p.contenu).join('\n');
    if (html) {
      let page = html.contenu;
      if (css && !page.includes(css.trim().slice(0, 60))) page = injecter(page, `<style>\n${css}\n</style>`, '</head>');
      if (js && !page.includes(js.trim().slice(0, 60))) page = injecter(page, `<script>\n${js}\n<\/script>`, '</body>');
      return { langage: 'html', contenu: page, page: true };
    }
    if (js && /document|canvas|window|alert|console/.test(js)) {
      const page = `<!DOCTYPE html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<style>body{font-family:system-ui,sans-serif;margin:16px}#console{background:#111;color:#9f9;padding:12px;border-radius:8px;white-space:pre-wrap}</style>\n</head>\n<body>\n<pre id="console"></pre>\n<script>\nconst sortie = document.getElementById('console');\nconst log = console.log;\nconsole.log = (...a) => { sortie.textContent += a.join(' ') + '\\n'; log(...a); };\n<\/script>\n<script>\n${js}\n<\/script>\n</body>\n</html>`;
      return { langage: 'html', contenu: page, page: true };
    }
    const dernier = codes[codes.length - 1];
    return { langage: dernier.langage || 'texte', contenu: dernier.contenu, page: false };
  }

  // Pendant qu'elle écrit, le panneau de droite montre son code qui avance.
  function codeEnDirect(texte) {
    const codes = decouper(texte).filter((p) => p.type === 'code');
    if (!codes.length) return;
    const el = $('#code-brut code');
    el.textContent = codes[codes.length - 1].contenu;
    el.className = '';
    for (const id of ['#apercu-vide', '#cadre', '#console', '#aide-code']) $(id).hidden = true;
    const pre = $('#code-brut');
    pre.hidden = false;
    pre.scrollTop = pre.scrollHeight;
    $('#voir-apercu').setAttribute('aria-pressed', 'false');
    $('#voir-console').setAttribute('aria-pressed', 'false');
    $('#voir-code').setAttribute('aria-pressed', 'true');
  }

  // Montre le code de sa réponse ; renvoie ce code (ou null s'il n'y en a pas).
  function montrerDepuis(texte) {
    const code = assembler(decouper(texte));
    if (code) montrer(code, code.page);
    else if (etat.code) montrer(etat.code, etat.vue !== 'code');
    else choisirVue('apercu');
    return code;
  }

  function montrer(code, apercu) {
    etat.code = code;
    stock.ecrire('code', code);
    etat.erreurMontree = false;
    enleverErreur();
    viderConsole();
    const el = $('#code-brut code');
    el.textContent = code.contenu;
    el.className = code.langage ? 'language-' + code.langage : '';
    colorer(el);
    for (const id of ['#copier', '#telecharger-code', '#recharger']) $(id).disabled = false;
    $('#plein-ecran').disabled = !code.page;
    $('#voir-apercu').disabled = !code.page;
    if (code.page) $('#cadre').srcdoc = avecAide(code.contenu);
    choisirVue(code.page && apercu ? 'apercu' : 'code');
  }

  function choisirVue(vue) {
    etat.vue = vue;
    let v = vue;
    if (!etat.code && v !== 'console') v = 'vide';
    else if (v === 'apercu' && !etat.code.page) v = 'code';
    $('#voir-apercu').setAttribute('aria-pressed', String(v === 'apercu'));
    $('#voir-code').setAttribute('aria-pressed', String(v === 'code'));
    $('#voir-console').setAttribute('aria-pressed', String(v === 'console'));
    $('#apercu-vide').hidden = v !== 'vide';
    $('#cadre').hidden = v !== 'apercu';
    $('#code-brut').hidden = v !== 'code';
    $('#console').hidden = v !== 'console';
    $('#aide-code').hidden = v !== 'code';
  }

  function enleverErreur() {
    const e = document.querySelector('.erreur-code');
    if (e) e.remove();
  }

  // --- La console du programme ---
  let erreursConsole = 0;
  function viderConsole() {
    $('#console').textContent = '';
    erreursConsole = 0;
    $('#compte-console').textContent = '';
  }

  function ajouterConsole(niveau, texte) {
    const box = $('#console');
    if (box.childElementCount >= 500) box.firstElementChild.remove();
    const ligne = document.createElement('span');
    ligne.className = 'ligne ' + (['warn', 'error', 'info'].includes(niveau) ? niveau : 'log');
    ligne.textContent = (niveau === 'error' ? '✖ ' : niveau === 'warn' ? '⚠ ' : '› ') + String(texte).slice(0, 2000);
    box.append(ligne);
    box.scrollTop = box.scrollHeight;
    if (niveau === 'error') {
      erreursConsole++;
      $('#compte-console').textContent = String(erreursConsole);
    }
  }

  window.addEventListener('message', (ev) => {
    if (ev.source !== $('#cadre').contentWindow || !ev.data) return;
    if (ev.data.mira === 'console') return ajouterConsole(ev.data.niveau, ev.data.texte);
    if (ev.data.mira !== 'erreur' || etat.erreurMontree) return;
    etat.erreurMontree = true;
    const message = String(ev.data.message).slice(0, 300);
    const demandeCorrection = `Ton code affiche cette erreur : « ${message} ». Trouve le problème, corrige-le et renvoie le fichier complet.`;
    // Correction automatique : une seule fois, et seulement pour une erreur au lancement.
    const attente = etat.attenteErreur;
    etat.attenteErreur = null;
    if (etat.autoCorrection && attente && Date.now() - attente < 6000 && !etat.enCours && etat.moteur) {
      toast('Son code a une erreur : elle la corrige toute seule…');
      envoyer(demandeCorrection, { auto: true });
      return;
    }
    const box = document.createElement('div');
    box.className = 'erreur-code';
    const t = document.createElement('span');
    t.textContent = 'Son code a une erreur : ' + message;
    box.append(t, bouton('Lui demander de corriger', () => {
      enleverErreur();
      envoyer(demandeCorrection);
    }), bouton('Voir la console', () => choisirVue('console')), bouton('Fermer', enleverErreur));
    $('.apercu-corps').append(box);
  });

  // Relancer : si tu as modifié le code, c'est ta version qui est lancée et gardée.
  function relancer() {
    if (!etat.code) return;
    const edite = $('#code-brut code').textContent;
    if (edite === etat.code.contenu) {
      montrer(etat.code, true);
      return;
    }
    const code = Object.assign({}, etat.code, { contenu: edite });
    montrer(code, true);
    const c = etat.creations.find((x) => x.id === etat.creationActuelle);
    if (c) {
      c.contenu = edite;
      c.date = Date.now();
      sauverCreations();
      afficherCreations();
    } else {
      enregistrerCreation(code, 'Modifié à la main');
    }
    // Elle doit savoir que tu as changé son code, pour repartir de ta version.
    etat.messages.push(
      { role: 'user', content: `J'ai modifié le code moi-même. Voici la nouvelle version, repars d'elle pour la suite :\n\`\`\`${code.langage || ''}\n${edite}\n\`\`\``, discret: true },
      { role: 'assistant', content: "D'accord, je repars de ta version.", discret: true },
    );
    stock.ecrire('conversation', etat.messages.slice(-40));
    ajouterNoteFil('✏️ Tu as modifié le code : elle repartira de ta version.');
    toast('Tes modifications sont lancées et gardées dans « Mes créations ».');
  }

  function ajouterNoteFil(texte) {
    const n = document.createElement('p');
    n.className = 'note';
    n.style.alignSelf = 'center';
    n.textContent = texte;
    $('#fil').append(n);
    defiler();
  }

  async function copier(texte) {
    try {
      await navigator.clipboard.writeText(texte);
    } catch (e) {
      const z = document.createElement('textarea');
      z.value = texte;
      document.body.append(z);
      z.select();
      try { document.execCommand('copy'); } catch (e2) { /* rien */ }
      z.remove();
    }
    toast('Code copié !');
  }

  function telecharger(c) {
    if (!c) return;
    const ext = { html: 'html', svg: 'svg', css: 'css', js: 'js', javascript: 'js', python: 'py', py: 'py', json: 'json', java: 'java', c: 'c', cpp: 'cpp', bash: 'sh', sh: 'sh' }[c.langage] || 'txt';
    let nom = c.titre || 'creation-de-' + nomIA().toLowerCase();
    const titre = !c.titre && c.page && c.contenu.match(/<title>([^<]{1,60})<\/title>/i);
    if (titre) nom = titre[1];
    nom = nom.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'creation';
    const lien = document.createElement('a');
    lien.href = URL.createObjectURL(new Blob([c.contenu], { type: 'text/plain;charset=utf-8' }));
    lien.download = `${nom}.${ext}`;
    document.body.append(lien);
    lien.click();
    lien.remove();
    setTimeout(() => URL.revokeObjectURL(lien.href), 5000);
  }

  function toast(texte) {
    const t = $('#toast');
    t.textContent = texte;
    t.classList.add('visible');
    clearTimeout(toast.minuteur);
    toast.minuteur = setTimeout(() => t.classList.remove('visible'), 3000);
  }

  // ---------------------------------------------------------------------------
  // Mes créations : tout ce qu'elle a créé est gardé sur l'ordinateur
  // ---------------------------------------------------------------------------
  function sauverCreations() {
    // Si la mémoire du navigateur est pleine, on retire les plus anciennes (sauf les exemples).
    while (!stock.ecrire('creations', etat.creations)) {
      let i = -1;
      etat.creations.forEach((c, j) => { if (!c.exemple) i = j; });
      if (i < 0) break;
      etat.creations.splice(i, 1);
    }
  }

  function titreDe(code, demande) {
    const t = code.page && code.contenu.match(/<title>([^<]{1,60})<\/title>/i);
    const propre = (t ? t[1] : '').replace(/\s+/g, ' ').trim();
    return propre || String(demande || 'Création').replace(/\s+/g, ' ').slice(0, 50);
  }

  function enregistrerCreation(code, demande) {
    const existe = etat.creations.find((c) => c.contenu === code.contenu);
    if (existe) {
      etat.creationActuelle = existe.id;
      afficherCreations();
      return existe;
    }
    const c = {
      id: 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      titre: titreDe(code, demande), demande: String(demande || ''), langage: code.langage, page: !!code.page,
      contenu: code.contenu, date: Date.now(), exemple: false,
    };
    etat.creations.unshift(c);
    while (etat.creations.length > 60) {
      const i = etat.creations.map((x) => x.exemple).lastIndexOf(false);
      if (i < 0) break;
      etat.creations.splice(i, 1);
    }
    etat.creationActuelle = c.id;
    sauverCreations();
    afficherCreations();
    return c;
  }

  function afficherCreations() {
    const box = $('#liste-creations');
    box.textContent = '';
    for (const c of etat.creations) {
      const carte = document.createElement('article');
      carte.className = 'creation' + (c.id === etat.creationActuelle ? ' active' : '');
      const h = document.createElement('h3');
      h.textContent = c.titre;
      const date = document.createElement('span');
      date.className = 'date';
      date.textContent = new Date(c.date).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) + (c.page ? '' : ' · ' + (c.langage || 'code'));
      carte.append(h, date);
      if (c.exemple) {
        const e = document.createElement('span');
        e.className = 'etiquette';
        e.textContent = '⭐ Exemple pour ' + nomIA();
        carte.append(e);
      }
      if (c.demande) {
        const d = document.createElement('p');
        d.className = 'demande-origine';
        d.textContent = '« ' + c.demande + ' »';
        carte.append(d);
      }
      const actions = document.createElement('div');
      actions.className = 'actions';
      actions.append(
        bouton('Ouvrir', () => {
          etat.creationActuelle = c.id;
          montrer({ langage: c.langage, contenu: c.contenu, page: c.page }, true);
          afficherCreations();
          document.querySelector('.apercu').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }),
        bouton('Renommer', () => {
          const nom = prompt('Nouveau nom pour cette création :', c.titre);
          if (nom && nom.trim()) { c.titre = nom.trim().slice(0, 60); sauverCreations(); afficherCreations(); afficherSavoirs(); }
        }),
        bouton('Télécharger', () => telecharger(c)),
      );
      if (c.page) {
        actions.append(bouton(c.exemple ? 'Retirer des exemples' : '⭐ Garder comme exemple', () => {
          c.exemple = !c.exemple;
          sauverCreations();
          afficherCreations();
          afficherSavoirs();
          toast(c.exemple ? `${nomIA()} s'inspirera de « ${c.titre} » pour les demandes qui y ressemblent.` : 'Retiré de ses exemples.');
        }));
      }
      actions.append(bouton('Supprimer', () => {
        if (!confirm(`Supprimer « ${c.titre} » ?`)) return;
        etat.creations = etat.creations.filter((x) => x.id !== c.id);
        sauverCreations();
        afficherCreations();
        afficherSavoirs();
      }));
      carte.append(actions);
      box.append(carte);
    }
  }

  // ---------------------------------------------------------------------------
  // La voix : elle lit ses réponses, et tu peux lui dicter
  // ---------------------------------------------------------------------------
  function texteAParler(texte) {
    return String(texte)
      .replace(/```[\s\S]*?(```|$)/g, ' Voici le code. ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*#>_]/g, '')
      .replace(/https?:\/\/\S+/g, 'un lien')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function lire(texte) {
    if (!('speechSynthesis' in window)) { toast('Ton navigateur ne sait pas lire à voix haute.'); return; }
    if (speechSynthesis.speaking) { speechSynthesis.cancel(); return; }
    const u = new SpeechSynthesisUtterance(texteAParler(texte));
    u.lang = 'fr-FR';
    const voix = speechSynthesis.getVoices().find((v) => /^fr(-|_|$)/i.test(v.lang));
    if (voix) u.voice = voix;
    speechSynthesis.speak(u);
  }

  function preparerDictee() {
    const Reconnaissance = window.SpeechRecognition || window.webkitSpeechRecognition;
    const b = $('#dicter');
    if (!Reconnaissance) return;
    b.hidden = false;
    let ecoute = null;
    b.addEventListener('click', () => {
      if (ecoute) { ecoute.stop(); return; }
      if (!stock.lire('dictee-expliquee', false)) {
        toast('La dictée passe par le service de reconnaissance vocale de ton navigateur.');
        stock.ecrire('dictee-expliquee', true);
      }
      const zone = $('#texte-demande');
      const debut = zone.value ? zone.value.replace(/\s*$/, ' ') : '';
      ecoute = new Reconnaissance();
      ecoute.lang = 'fr-FR';
      ecoute.interimResults = true;
      ecoute.onresult = (e) => {
        let texte = '';
        for (const r of e.results) texte += r[0].transcript;
        zone.value = debut + texte;
        ajusterZone();
      };
      ecoute.onerror = (e) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') toast('Autorise le micro dans ton navigateur pour dicter.');
        else if (e.error === 'no-speech') toast("Je n'ai rien entendu.");
      };
      ecoute.onend = () => {
        ecoute = null;
        b.classList.remove('ecoute');
        zone.focus();
      };
      b.classList.add('ecoute');
      ecoute.start();
    });
  }

  // ---------------------------------------------------------------------------
  // Espace disque : combien de place prend son grand cerveau, et le supprimer
  // ---------------------------------------------------------------------------
  async function afficherEspace() {
    const infos = $('#espace-infos');
    const box = $('#espace-modeles');
    box.textContent = '';
    try {
      const e = await navigator.storage.estimate();
      const protege = navigator.storage.persisted ? await navigator.storage.persisted() : false;
      infos.textContent = `${nomIA()} utilise ${(e.usage / 1e9).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} Go sur cet ordinateur. `
        + (protege ? 'Ton navigateur a promis de ne pas l\'effacer tout seul.' : 'Ton navigateur peut l\'effacer s\'il manque de place.');
    } catch (err) {
      infos.textContent = "Impossible de savoir la place utilisée.";
    }
    if (!etat.webllm) {
      try { etat.webllm = await import(WEBLLM); } catch (err) { return; }
    }
    for (const [cle, m] of Object.entries(MODELES)) {
      for (const id of [idPour(cle, true), idPour(cle, false)]) {
        let present = false;
        try { present = await etat.webllm.hasModelInCache(id, configuration()); } catch (err) { /* rien */ }
        if (!present) continue;
        box.append(bouton(`Supprimer « ${m.nom} » (${m.taille})`, async () => {
          if (!confirm(`Supprimer le grand cerveau « ${m.nom} » de cet ordinateur ? Il faudra le retélécharger (${m.taille}) pour s'en resservir.`)) return;
          if (etat.idModele === id) await endormir();
          try { await etat.webllm.deleteModelAllInfoInCache(id, configuration()); } catch (err) { /* rien */ }
          stock.ecrire('telecharge.' + id, false);
          afficherModeles();
          afficherEspace();
          toast('Supprimé. La place est libérée.');
        }));
      }
    }
    if (!box.childElementCount) box.append(document.createTextNode('Aucun grand cerveau téléchargé pour l\'instant.'));
  }

  // ---------------------------------------------------------------------------
  // Les deux espaces de la page : Atelier et Laboratoire
  // ---------------------------------------------------------------------------
  function ouvrirVue(nom) {
    for (const [onglet, vue] of [['#onglet-atelier', '#vue-atelier'], ['#onglet-labo', '#vue-labo']]) {
      const actif = vue === '#vue-' + nom;
      $(onglet).setAttribute('aria-selected', String(actif));
      $(onglet).tabIndex = actif ? 0 : -1;
      $(vue).hidden = !actif;
    }
    try { localStorage.setItem('mira.vue', nom); } catch (e) { /* rien */ }
  }

  // ---------------------------------------------------------------------------
  // Mise en route
  // ---------------------------------------------------------------------------
  function majNom() {
    $('#nom-reveil').textContent = nomIA();
    majBoutonReveil();
    for (const q of document.querySelectorAll('.msg.mira .qui .nom-ia')) q.textContent = nomIA();
    afficherCreations();
  }

  // Pour vérifier la recherche dans sa bibliothèque sans carte graphique : index.html?test
  if (/[?&]test\b/.test(location.search)) {
    window.miraTest = { etat, choisirSavoirs, construireMessages, nomsDesSavoirs, planDeRecherche, lancerRecherche, montrer, enregistrerCreation, relancer, choisirVue, texteAParler };
  }

  function caseACocher(id, cle) {
    const c = $(id);
    c.checked = !!etat[cle];
    c.addEventListener('change', () => { etat[cle] = c.checked; stock.ecrire(cle, etat[cle]); });
  }

  function demarrer() {
    let vue = 'atelier';
    try { vue = localStorage.getItem('mira.vue') || 'atelier'; } catch (e) { /* rien */ }
    ouvrirVue(vue === 'labo' ? 'labo' : 'atelier');
    $('#onglet-atelier').addEventListener('click', () => ouvrirVue('atelier'));
    $('#onglet-labo').addEventListener('click', () => ouvrirVue('labo'));
    for (const o of ['#onglet-atelier', '#onglet-labo']) {
      $(o).addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const autre = o === '#onglet-atelier' ? 'labo' : 'atelier';
        ouvrirVue(autre);
        $('#onglet-' + autre).focus();
      });
    }

    afficherModeles();
    majNom();
    $('#nom').addEventListener('change', majNom);
    $('#reveiller').addEventListener('click', () => { reveiller().catch(() => {}); });
    $('#changer-cerveau').addEventListener('click', endormir);

    caseACocher('#avec-festival', 'festival');
    caseACocher('#avec-recherche', 'recherche');
    caseACocher('#auto-correction', 'autoCorrection');
    caseACocher('#lecture-auto', 'lectureAuto');
    $('#espace').addEventListener('toggle', () => { if ($('#espace').open) afficherEspace(); });

    afficherSavoirs();
    afficherIdees();
    afficherFil();
    afficherCreations();
    preparerDictee();
    const zone = $('#texte-demande');
    zone.addEventListener('input', ajusterZone);
    zone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); envoyer(zone.value); }
    });
    $('#demande').addEventListener('submit', (e) => { e.preventDefault(); envoyer(zone.value); });
    $('#arreter').addEventListener('click', arreter);
    $('#nouvelle-conversation').addEventListener('click', () => {
      if (etat.messages.length && !confirm('Commencer une nouvelle conversation ? Ses créations restent gardées dans « Mes créations ».')) return;
      etat.messages = [];
      stock.ecrire('conversation', []);
      etat.code = null;
      etat.creationActuelle = null;
      stock.ecrire('code', null);
      enleverErreur();
      viderConsole();
      $('#cadre').srcdoc = '';
      $('#code-brut code').textContent = '';
      for (const id of ['#recharger', '#copier', '#telecharger-code', '#plein-ecran']) $(id).disabled = true;
      choisirVue('apercu');
      afficherFil();
      afficherCreations();
      zone.focus();
    });

    $('#voir-apercu').addEventListener('click', () => choisirVue('apercu'));
    $('#voir-code').addEventListener('click', () => choisirVue('code'));
    $('#voir-console').addEventListener('click', () => choisirVue('console'));
    $('#recharger').addEventListener('click', relancer);
    $('#copier').addEventListener('click', () => { if (etat.code) copier($('#code-brut code').textContent || etat.code.contenu); });
    $('#telecharger-code').addEventListener('click', () => {
      if (!etat.code) return;
      const c = etat.creations.find((x) => x.id === etat.creationActuelle);
      telecharger(Object.assign({}, etat.code, { contenu: $('#code-brut code').textContent || etat.code.contenu, titre: c ? c.titre : '' }));
    });
    $('#plein-ecran').addEventListener('click', () => {
      const c = $('#cadre');
      if (c.requestFullscreen) c.requestFullscreen().catch(() => {});
    });

    if (etat.code) {
      const c = etat.creations.find((x) => x.contenu === etat.code.contenu);
      if (c) etat.creationActuelle = c.id;
      montrer(etat.code, true);
      afficherCreations();
    } else choisirVue('apercu');
  }

  demarrer();
})();
