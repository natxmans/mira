/*
 * visiteur.js — la page des visiteurs de Mira (index.html).
 *
 * Elle lit ce que tu as publié depuis ton panneau admin (mira-public.json) : le nom de
 * Mira, le message d'accueil, la vitrine de tes créations, les réglages, et ton petit
 * cerveau entraîné. Les visiteurs ne peuvent rien changer à ta Mira : tout ce qu'ils font
 * reste dans leur propre navigateur.
 */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const APERCU = /[?&]apercu\b/.test(location.search);
  let nom = 'Mira';

  async function chargerConfig() {
    if (APERCU) {
      try {
        const brouillon = JSON.parse(localStorage.getItem('mira.public.brouillon'));
        if (brouillon) { $('#bandeau-apercu').hidden = false; return brouillon; }
      } catch (e) { /* rien */ }
    }
    try {
      const r = await fetch('mira-public.json', { cache: 'no-cache' });
      if (r.ok) {
        const config = await r.json();
        if (!config.format || config.format === 'mira-public/1') return config;
      }
    } catch (e) { /* pas encore publié, ou pas de connexion */ }
    return {};
  }

  function chargerScript(src) {
    return new Promise((ok, ko) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = ok;
      s.onerror = ko;
      document.body.append(s);
    });
  }

  function bouton(texte, action, classe) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'bouton petit' + (classe ? ' ' + classe : '');
    b.textContent = texte;
    b.addEventListener('click', action);
    return b;
  }

  function telecharger(c) {
    const nomFichier = (c.titre || 'creation').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'creation';
    const lien = document.createElement('a');
    lien.href = URL.createObjectURL(new Blob([c.contenu], { type: 'text/plain;charset=utf-8' }));
    lien.download = nomFichier + '.html';
    document.body.append(lien);
    lien.click();
    lien.remove();
    setTimeout(() => URL.revokeObjectURL(lien.href), 5000);
  }

  // ---------------------------------------------------------------------------
  // La vitrine
  // ---------------------------------------------------------------------------
  let enScene = null;

  function montrerVitrine(c) {
    enScene = c;
    $('#titre-scene').textContent = c.titre;
    $('#cadre-vitrine').srcdoc = window.miraAvecAide(c.contenu);
    $('#code-vitrine code').textContent = c.contenu;
    $('#vitrine-vide').hidden = true;
    $('#cadre-vitrine').hidden = false;
    $('#code-vitrine').hidden = true;
    $('#vitrine-code').textContent = 'Voir le code';
    for (const id of ['#vitrine-code', '#vitrine-telecharger', '#vitrine-plein-ecran', '#vitrine-modifier']) $(id).disabled = false;
    document.querySelectorAll('#liste-vitrine .creation').forEach((carte) => carte.classList.toggle('active', carte.dataset.id === c.id));
  }

  function afficherVitrine(config) {
    const creations = (config.creations || []).filter((c) => c.vitrine && c.page && typeof c.contenu === 'string');
    const box = $('#liste-vitrine');
    box.textContent = '';
    for (const c of creations) {
      const carte = document.createElement('article');
      carte.className = 'creation';
      carte.dataset.id = c.id;
      const h = document.createElement('h3');
      h.textContent = c.titre;
      carte.append(h);
      if (c.date) {
        const d = document.createElement('span');
        d.className = 'date';
        d.textContent = new Date(c.date).toLocaleDateString('fr-FR', { dateStyle: 'long' });
        carte.append(d);
      }
      if (c.demande) {
        const p = document.createElement('p');
        p.className = 'demande-origine';
        p.textContent = 'Demande : « ' + c.demande + ' »';
        carte.append(p);
      }
      const actions = document.createElement('div');
      actions.className = 'actions';
      actions.append(bouton('▶ Jouer', () => {
        montrerVitrine(c);
        if (matchMedia('(max-width: 980px)').matches) $('.vitrine-scene').scrollIntoView({ behavior: 'smooth' });
      }));
      carte.append(actions);
      box.append(carte);
    }
    $('#vitrine-code').addEventListener('click', () => {
      if (!enScene) return;
      const voirCode = $('#code-vitrine').hidden;
      $('#code-vitrine').hidden = !voirCode;
      $('#cadre-vitrine').hidden = voirCode;
      $('#vitrine-code').textContent = voirCode ? 'Voir le résultat' : 'Voir le code';
    });
    $('#vitrine-telecharger').addEventListener('click', () => { if (enScene) telecharger(enScene); });
    $('#vitrine-plein-ecran').addEventListener('click', () => {
      const c = $('#cadre-vitrine');
      if (c.requestFullscreen) c.requestFullscreen().catch(() => {});
    });
    $('#vitrine-modifier').addEventListener('click', () => {
      if (enScene) window.miraReprendre({ langage: enScene.langage || 'html', contenu: enScene.contenu, page: true }, enScene.titre);
    });
    if (creations.length) montrerVitrine(creations[0]);
    return creations.length;
  }

  // ---------------------------------------------------------------------------
  // Son petit cerveau entraîné (le même moteur que le Laboratoire, sans l'entraînement)
  // ---------------------------------------------------------------------------
  let moteur = null;
  let cerveauPret = false;
  let enCours = false;
  const attentes = new Map();
  let prochainId = 1;
  const conversation = [];

  function creerMoteur(surMessage) {
    let port = null, pret = false;
    const file = [];
    function brancher(p) {
      port = p;
      port.onmessage = (e) => {
        if (e.data.type === 'bonjour') { pret = true; for (const m of file.splice(0)) port.postMessage(m); }
        else surMessage(e.data);
      };
    }
    function dansLaPage() {
      const page = {}, travail = {};
      page.postMessage = (m) => setTimeout(() => travail.onmessage({ data: m }), 0);
      travail.postMessage = (m) => setTimeout(() => page.onmessage({ data: m }), 0);
      brancher(page);
      ouvrier(travail, installerCerveau());
    }
    try {
      const source = installerCerveau.toString() + '\n' + ouvrier.toString() + '\nouvrier(self, installerCerveau());';
      const w = new Worker(URL.createObjectURL(new Blob([source], { type: 'text/javascript' })));
      w.onerror = () => { if (!pret) { w.terminate(); dansLaPage(); } };
      brancher(w);
    } catch (e) {
      dansLaPage();
    }
    return { envoyer(m) { if (pret) port.postMessage(m); else file.push(m); } };
  }

  function recevoir(m) {
    const r = attentes.get(m.id);
    if (m.type === 'infos') {
      cerveauPret = true;
      $('#cerveau-etape').textContent = Number(m.etape || 0).toLocaleString('fr-FR');
      $('#cerveau-lettres').textContent = Number(m.lettresLues || 0).toLocaleString('fr-FR');
      $('#cerveau-params').textContent = Number(m.nbParametres || 0).toLocaleString('fr-FR');
    } else if (m.type === 'lettre' && r) r.lettre(m.lettre);
    else if (m.type === 'fini' && r) { attentes.delete(m.id); r.fini(); }
    else if (m.type === 'erreur') {
      if (r) { attentes.delete(m.id); r.fini(); }
      $('#cerveau-etat').textContent = 'Oups : ' + m.message;
    }
  }

  function bulle(qui, texte) {
    const box = $('#messages-cerveau');
    const accueil = box.querySelector('.accueil');
    if (accueil) accueil.remove();
    const b = document.createElement('div');
    b.className = 'bulle ' + qui;
    if (qui === 'ia') {
      const n = document.createElement('span');
      n.className = 'qui';
      n.textContent = nom + ' (petit cerveau)';
      b.append(n);
    }
    const e = document.createElement('span');
    e.className = 'ecrit';
    e.textContent = texte;
    b.append(e);
    box.append(b);
    box.scrollTop = box.scrollHeight;
    return e;
  }

  function parler(brut) {
    const texte = String(brut).replace(/\s+/g, ' ').trim();
    if (!texte || enCours || !moteur || !cerveauPret) return;
    enCours = true;
    $('#message-cerveau').value = '';
    bulle('toi', texte);
    const ecrit = bulle('ia', '');
    const contexte = conversation.slice(-2).map((e) => `Toi : ${e.q}\nIA : ${e.r}\n`).join('');
    let reponse = '';
    const id = prochainId++;
    attentes.set(id, {
      lettre(l) { reponse += l; ecrit.textContent = reponse; $('#messages-cerveau').scrollTop = 1e9; },
      fini() {
        enCours = false;
        const r = reponse.trim();
        if (!r) ecrit.textContent = '(il n\'a rien trouvé à dire)';
        conversation.push({ q: texte, r });
      },
    });
    moteur.envoyer({ type: 'generer', id, amorce: `\n${contexte}Toi : ${texte}\nIA : `, max: 200, temperature: parseFloat($('#imagination-cerveau').value), arret: '\n' });
  }

  // Le petit cerveau publié dans mira-public.json ; sinon, celui que Claude a entraîné.
  function preparerPetitCerveau(config) {
    const publie = config.petitCerveau && config.petitCerveau.sauvegarde;
    if (typeof ouvrier !== 'function') {
      $('#cerveau-absent').hidden = false;
      $('#cerveau-present').hidden = true;
      return;
    }
    const reveiller = () => {
      if (moteur) return;
      moteur = creerMoteur(recevoir);
      if (publie) {
        moteur.envoyer({ type: 'charger', sauvegarde: publie, paquet: 8 });
        return;
      }
      $('#cerveau-etat').textContent = 'Il se réveille…';
      fetch('cerveau-claude.json')
        .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
        .then((f) => {
          moteur.envoyer({ type: 'charger', sauvegarde: f.cerveau, paquet: 8 });
          $('#cerveau-etat').textContent = 'Cerveau entraîné par Claude';
        })
        .catch(() => { $('#cerveau-etat').textContent = 'Impossible de le réveiller : vérifie ta connexion internet.'; });
    };
    window.addEventListener('mira-vue', (e) => { if (e.detail === 'cerveau') reveiller(); });
    if (!$('#vue-cerveau').hidden) reveiller();
    $('#form-cerveau').addEventListener('submit', (e) => { e.preventDefault(); parler($('#message-cerveau').value); });
    for (const b of document.querySelectorAll('#suggestions-cerveau button')) b.addEventListener('click', () => parler(b.textContent));
    const curseur = $('#imagination-cerveau');
    const maj = () => { $('#imagination-cerveau-valeur').textContent = parseFloat(curseur.value).toLocaleString('fr-FR', { minimumFractionDigits: 2 }); };
    curseur.addEventListener('input', maj);
    maj();
  }

  // Ctrl + Maj + Q : l'entrée discrète vers ton panneau admin (qui demande ton code).
  window.addEventListener('mira-raccourci', () => { location.href = 'admin.html'; });

  // ---------------------------------------------------------------------------
  // Mise en route
  // ---------------------------------------------------------------------------
  (async () => {
    const config = await chargerConfig();
    window.MIRA_PUBLIC = config;
    nom = String(config.nom || 'Mira').replace(/\s+/g, ' ').trim().slice(0, 24) || 'Mira';
    $('#nom').value = nom;
    document.title = nom + " · l'IA qui code";
    document.querySelectorAll('.nom-mira').forEach((e) => { e.textContent = nom; });
    const accueil = String(config.accueil || '').split('{nom}').join(nom).trim();
    if (accueil) { $('#accueil').textContent = accueil; $('#accueil').hidden = false; }
    // Sans vitrine, on arrive directement dans l'Atelier.
    const aVitrine = (config.creations || []).some((c) => c.vitrine && c.page);
    let vueRetenue = null;
    try { vueRetenue = localStorage.getItem('mira.visiteur.vue'); } catch (e) { /* rien */ }
    if (!aVitrine && !vueRetenue) { try { localStorage.setItem('mira.visiteur.vue', 'atelier'); } catch (e) { /* rien */ } }
    await chargerScript('atelier.js');
    afficherVitrine(config);
    preparerPetitCerveau(config);
  })();
})();
