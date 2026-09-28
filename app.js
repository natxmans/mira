/*
 * app.js — la page : les boutons, la discussion, la courbe et les sauvegardes.
 * Le cerveau lui-même est dans cerveau.js ; ici on ne fait que lui parler.
 */
(function () {
  'use strict';

  const IA = installerCerveau();
  const $ = (s) => document.querySelector(s);
  const nombre = new Intl.NumberFormat('fr-FR');
  const decimal = (x, n) => x.toLocaleString('fr-FR', { minimumFractionDigits: n, maximumFractionDigits: n });

  const TAILLES = {
    mini:    { nom: 'Mini',    detail: 'la plus rapide',        cfg: { d: 32, L: 2, H: 4, T: 64 } },
    petite:  { nom: 'Petite',  detail: 'conseillée',            cfg: { d: 48, L: 2, H: 4, T: 64 } },
    moyenne: { nom: 'Moyenne', detail: 'plus lente, plus douée', cfg: { d: 64, L: 3, H: 4, T: 96 } },
  };
  const PAQUET = 8; // nombre de morceaux de texte lus à chaque étape
  const PAGE = 1500; // lettres dans une page de livre, environ

  // ---------------------------------------------------------------------------
  // Mémoire du navigateur (peut être indisponible : on ne compte jamais dessus).
  // ---------------------------------------------------------------------------
  const stock = {
    lire(cle, defaut) {
      try { const v = localStorage.getItem('monia.' + cle); return v === null ? defaut : JSON.parse(v); } catch (e) { return defaut; }
    },
    ecrire(cle, valeur) {
      try { localStorage.setItem('monia.' + cle, JSON.stringify(valeur)); return true; } catch (e) { return false; }
    },
    effacer(cle) {
      try { localStorage.removeItem('monia.' + cle); } catch (e) { /* rien */ }
    },
  };

  const etat = {
    nom: ((n) => (n === 'Mon IA' ? 'Mira' : n))(stock.lire('nom', 'Mira')),
    taille: stock.lire('taille', 'petite'),
    textes: stock.lire('textes', null) ?? TEXTES.discussions,
    lecons: stock.lire('lecons', []),
    historique: stock.lire('historique', []), // [étape, erreur]
    journal: stock.lire('journal', []),
    enCours: false,
    etape: 0, lettresLues: 0, nbParametres: 0, cfg: null,
    perte: null, reussite: null, vitesse: null,
    discussion: true,
    mode: 'discuter',
    temperature: 0.6,
    derniereSauvegarde: null,
  };
  if (!TAILLES[etat.taille]) etat.taille = 'petite';

  // ---------------------------------------------------------------------------
  // Le moteur : le cerveau tourne dans un « Worker » (en arrière-plan).
  // Si le navigateur refuse, il tourne directement dans la page.
  // ---------------------------------------------------------------------------
  const attentes = new Map();
  let prochainId = 1;

  const moteur = (function () {
    let port = null, pret = false;
    const file = [];
    function brancher(p) {
      port = p;
      port.onmessage = (e) => {
        if (e.data.type === 'bonjour') {
          pret = true;
          for (const m of file.splice(0)) port.postMessage(m);
        } else recevoir(e.data);
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
    return {
      envoyer(m) { if (pret) port.postMessage(m); else file.push(m); },
    };
  })();

  function demander(message, rappels) {
    const id = prochainId++;
    attentes.set(id, rappels);
    moteur.envoyer(Object.assign({ id }, message));
    return id;
  }

  function recevoir(m) {
    const r = m.id !== undefined ? attentes.get(m.id) : null;
    switch (m.type) {
      case 'infos':
        etat.cfg = m.cfg;
        etat.nbParametres = m.nbParametres;
        etat.etape = m.etape;
        etat.lettresLues = m.lettresLues;
        afficherChiffres();
        afficherTete();
        break;
      case 'etat':
        etat.enCours = m.enCours;
        afficherBouton();
        if (!m.enCours) sauvegarder();
        break;
      case 'progres':
        etat.etape = m.etape;
        etat.lettresLues = m.lettresLues;
        etat.perte = m.perte;
        etat.reussite = etat.reussite === null ? m.reussite : etat.reussite * 0.8 + m.reussite * 0.2;
        etat.vitesse = etat.vitesse === null ? m.vitesse : etat.vitesse * 0.7 + m.vitesse * 0.3;
        ajouterPoint(m.etape, m.perte);
        afficherChiffres();
        break;
      case 'journal':
        ajouterAuJournal({ etape: m.etape, perte: m.perte, texte: m.texte });
        break;
      case 'lettre':
        if (r && r.lettre) r.lettre(m.lettre);
        break;
      case 'fini':
        attentes.delete(m.id);
        if (r && r.fini) r.fini();
        break;
      case 'probas':
      case 'sauvegarde':
        attentes.delete(m.id);
        if (r && r.reponse) r.reponse(m);
        break;
      case 'erreur':
        attentes.delete(m.id);
        if (r && r.erreur) r.erreur(m.message);
        else afficherToast('Oups : ' + m.message);
        break;
    }
  }

  // ---------------------------------------------------------------------------
  // Textes et cerveau
  // ---------------------------------------------------------------------------
  const avecNom = (t) => t.split('{nom}').join(etat.nom);

  function envoyerTextes() {
    const base = avecNom(etat.textes);
    etat.discussion = /(^|\n)Toi ?:/.test(base) && /(^|\n)IA ?:/.test(base);
    const lecons = etat.lecons.map((l) => `Toi : ${l.q}\nIA : ${avecNom(l.r)}\n`).join('');
    let amorce = "\nToi : Salut ! Tu t'appelles comment ?\nIA : ";
    if (!etat.discussion) amorce = /Il était une fois/.test(base) ? 'Il était une fois' : base.trim().split(/\s+/).slice(0, 3).join(' ');
    moteur.envoyer({ type: 'textes', base, lecons: lecons ? '\n' + lecons : '', discussion: etat.discussion, amorce });
    afficherDiscussion();
  }

  function nouveauCerveau() {
    etat.historique = [];
    etat.journal = [];
    etat.perte = null; etat.reussite = null; etat.vitesse = null;
    stock.effacer('cerveau');
    stock.ecrire('historique', []);
    stock.ecrire('journal', []);
    afficherJournal();
    dessinerCourbe();
    moteur.envoyer({ type: 'creer', cfg: TAILLES[etat.taille].cfg, paquet: PAQUET, graine: (Math.random() * 2 ** 31) | 0 });
  }

  function basculerEntrainement(demarrer) {
    const veut = demarrer === undefined ? !etat.enCours : demarrer;
    moteur.envoyer({ type: veut ? 'demarrer' : 'pause' });
  }

  function sauvegarder(quandFini) {
    demander({ type: 'exporter' }, {
      reponse(m) {
        const ok = stock.ecrire('cerveau', m.sauvegarde);
        stock.ecrire('historique', etat.historique);
        stock.ecrire('journal', etat.journal);
        etat.derniereSauvegarde = ok ? new Date() : null;
        $('#etat-sauvegarde').textContent = ok
          ? `Dernière sauvegarde automatique à ${etat.derniereSauvegarde.toLocaleTimeString('fr-FR')} (étape ${nombre.format(m.sauvegarde.etape)}).`
          : "La sauvegarde automatique ne marche pas ici (navigateur privé ou mémoire pleine). Pense à télécharger son cerveau !";
        if (quandFini) quandFini(m.sauvegarde);
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Affichage : chiffres, bouton, journal, courbe
  // ---------------------------------------------------------------------------
  function court(n) {
    if (n >= 1e6) return decimal(n / 1e6, 1) + ' M';
    if (n >= 1e4) return decimal(n / 1e3, 0) + ' k';
    return nombre.format(n);
  }

  function afficherChiffres() {
    $('#c-etape').textContent = nombre.format(etat.etape);
    $('#c-lettres').textContent = court(etat.lettresLues);
    const pages = Math.round(etat.lettresLues / PAGE);
    $('#c-pages').textContent = `≈ ${nombre.format(pages)} page${pages > 1 ? 's' : ''} de livre`;
    $('#c-reussite').textContent = etat.reussite === null ? '–' : Math.round(etat.reussite * 100) + ' %';
    $('#c-perte').textContent = etat.perte === null ? '–' : decimal(etat.perte, 2);
    $('#c-vitesse').textContent = etat.enCours && etat.vitesse !== null ? decimal(etat.vitesse, etat.vitesse < 10 ? 1 : 0) : '–';
    if (etat.cfg) {
      $('#c-params').textContent = court(etat.nbParametres);
      const t = TAILLES[etat.taille];
      $('#c-cerveau').textContent = `paramètres · ${t ? t.nom.toLowerCase() : 'perso'}, ${etat.cfg.L} couches`;
      $('#schema-couches').textContent = `× ${etat.cfg.L} couches`;
    }
    $('#conseil-debut').hidden = etat.etape > 0;
  }

  function afficherBouton() {
    const b = $('#bouton-entrainer');
    b.querySelector('span').textContent = etat.enCours ? 'Pause' : (etat.etape > 0 ? 'Continuer' : 'Entraîner');
    b.querySelector('path').setAttribute('d', etat.enCours ? 'M4 2.5h3v11H4zM9 2.5h3v11H9z' : 'M4 2.5v11l9-5.5z');
    const p = $('#pastille');
    p.classList.toggle('active', etat.enCours);
    p.querySelector('span').textContent = etat.enCours ? 'En train d\'apprendre' : 'En pause';
    afficherChiffres();
  }

  function ajouterAuJournal(entree) {
    const j = etat.journal;
    if (j.length && j[j.length - 1].etape === entree.etape) j.pop();
    j.push(entree);
    if (j.length > 40) j.splice(1, j.length - 40); // on garde toujours la toute première
    afficherJournal();
  }

  function afficherJournal() {
    const ol = $('#journal');
    ol.textContent = '';
    for (const e of etat.journal.slice().reverse()) {
      const li = document.createElement('li');
      const meta = document.createElement('div');
      meta.className = 'meta';
      const a = document.createElement('span');
      a.textContent = e.etape === 0 ? 'Étape 0 · avant tout entraînement' : `Étape ${nombre.format(e.etape)}`;
      const b = document.createElement('span');
      b.textContent = e.perte == null ? '' : `erreur ${decimal(e.perte, 2)}`;
      meta.append(a, b);
      const ecrit = document.createElement('div');
      ecrit.className = 'ecrit';
      if (etat.discussion) {
        const q = document.createElement('span');
        q.className = 'question';
        q.textContent = 'Tu t\'appelles comment ? → ';
        ecrit.append(q, document.createTextNode(e.texte || '(rien)'));
      } else {
        ecrit.textContent = e.texte;
      }
      li.append(meta, ecrit);
      ol.append(li);
    }
  }

  function ajouterPoint(etape, perte) {
    const h = etat.historique;
    if (h.length && etape <= h[h.length - 1][0]) return;
    h.push([etape, perte]);
    if (h.length > 1200) {
      // on garde la courbe légère : on fusionne les points deux par deux
      const moins = [];
      for (let i = 0; i + 1 < h.length; i += 2) moins.push([h[i + 1][0], (h[i][1] + h[i + 1][1]) / 2]);
      if (h.length % 2) moins.push(h[h.length - 1]);
      etat.historique = moins;
    }
    dessinerCourbe();
  }

  let dessinPrevu = false;
  function dessinerCourbe() {
    $('#courbe-vide').hidden = etat.historique.length > 1;
    if (dessinPrevu) return;
    dessinPrevu = true;
    requestAnimationFrame(() => { dessinPrevu = false; dessiner(); });
  }

  function dessiner() {
    const canvas = $('#canvas-courbe');
    const h = etat.historique;
    const boite = canvas.getBoundingClientRect();
    const r = window.devicePixelRatio || 1;
    canvas.width = Math.round(boite.width * r);
    canvas.height = Math.round(boite.height * r);
    const ctx = canvas.getContext('2d');
    ctx.scale(r, r);
    const W = boite.width, H = boite.height;
    ctx.clearRect(0, 0, W, H);
    if (h.length < 2) return;

    const style = getComputedStyle(document.documentElement);
    const couleur = style.getPropertyValue('--courbe').trim();
    const grille = style.getPropertyValue('--grille').trim();
    const doux = style.getPropertyValue('--doux').trim();
    const g = 34, dr = 12, ht = 12, bas = 24;
    const maxE = h[h.length - 1][0], minE = h[0][0];
    let maxP = 0;
    for (const p of h) if (p[1] > maxP) maxP = p[1];
    maxP = Math.max(1, Math.ceil(maxP));
    const X = (e) => g + (W - g - dr) * (maxE === minE ? 1 : (e - minE) / (maxE - minE));
    const Y = (p) => ht + (H - ht - bas) * (1 - p / maxP);

    ctx.font = '11px ' + style.getPropertyValue('--police');
    ctx.fillStyle = doux;
    ctx.strokeStyle = grille;
    ctx.lineWidth = 1;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let p = 0; p <= maxP; p++) {
      const y = Math.round(Y(p)) + 0.5;
      ctx.beginPath(); ctx.moveTo(g, y); ctx.lineTo(W - dr, y); ctx.stroke();
      ctx.fillText(String(p), g - 8, y);
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(nombre.format(minE), g + 10, H - bas + 7);
    ctx.textAlign = 'right';
    ctx.fillText(nombre.format(maxE), W - dr, H - bas + 7);

    // lissage pour une courbe lisible
    const lisse = [];
    let m = h[0][1];
    for (const p of h) { m = m * 0.85 + p[1] * 0.15; lisse.push([p[0], m]); }

    const fond = ctx.createLinearGradient(0, ht, 0, H - bas);
    fond.addColorStop(0, couleur + '55');
    fond.addColorStop(1, couleur + '00');
    ctx.beginPath();
    ctx.moveTo(X(lisse[0][0]), Y(0));
    for (const p of lisse) ctx.lineTo(X(p[0]), Y(p[1]));
    ctx.lineTo(X(lisse[lisse.length - 1][0]), Y(0));
    ctx.closePath();
    ctx.fillStyle = fond;
    ctx.fill();

    ctx.beginPath();
    lisse.forEach((p, i) => (i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1]))));
    ctx.strokeStyle = couleur;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    const dernier = lisse[lisse.length - 1];
    ctx.beginPath();
    ctx.arc(X(dernier[0]), Y(dernier[1]), 4, 0, Math.PI * 2);
    ctx.fillStyle = couleur;
    ctx.fill();
  }

  // ---------------------------------------------------------------------------
  // Discussion
  // ---------------------------------------------------------------------------
  const conversation = []; // derniers échanges, pour le contexte
  let occupee = false;

  function afficherDiscussion() {
    document.title = `${etat.nom} · panneau admin`;
    $('#titre-discussion').textContent = `Parler avec ${etat.nom}`;
    $('#message').placeholder = etat.mode === 'ecrire' ? 'Écris le début d\'un texte…' : `Écris quelque chose à ${etat.nom}…`;
    $('#sous-discussion').textContent = etat.mode === 'ecrire'
      ? 'Tu écris le début, elle invente la suite, une lettre après l\'autre.'
      : 'Elle répond en devinant une lettre après l\'autre, avec ce qu\'elle a appris.';
    for (const q of document.querySelectorAll('.bulle.ia .qui')) q.textContent = etat.nom;
    if (!$('#messages').children.length || $('#messages .accueil')) afficherAccueil();
  }

  function afficherAccueil() {
    const box = $('#messages');
    box.textContent = '';
    const a = document.createElement('div');
    a.className = 'accueil';
    const titre = document.createElement('strong');
    const texte = document.createElement('span');
    const idees = etat.mode === 'ecrire'
      ? ['Il était une fois', 'Le chat', 'Bonjour']
      : ['Salut !', "Comment tu t'appelles ?", 'Raconte une blague', "Je m'appelle Sam", 'Qui t\'a créée ?'];
    titre.textContent = etat.mode === 'ecrire' ? 'Commence une histoire' : `Dis bonjour à ${etat.nom}`;
    texte.textContent = etat.etape < 300
      ? 'Elle n\'a presque rien appris : ses réponses seront du charabia. Lance l\'entraînement et reviens la voir dans quelques minutes !'
      : 'Essaie une de ces idées :';
    const s = document.createElement('div');
    s.className = 'suggestions';
    for (const i of idees) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = i;
      b.addEventListener('click', () => envoyerMessage(i));
      s.append(b);
    }
    a.append(titre, texte, s);
    box.append(a);
  }

  function nouvelleBulle(qui, texte) {
    const box = $('#messages');
    const accueil = box.querySelector('.accueil');
    if (accueil) accueil.remove();
    const b = document.createElement('div');
    b.className = 'bulle ' + qui;
    if (qui === 'ia') {
      const nom = document.createElement('span');
      nom.className = 'qui';
      nom.textContent = etat.nom;
      b.append(nom);
    }
    const ecrit = document.createElement('span');
    ecrit.className = 'ecrit';
    ecrit.textContent = texte;
    b.append(ecrit);
    box.append(b);
    box.scrollTop = box.scrollHeight;
    return { bulle: b, ecrit };
  }

  function envoyerMessage(brut) {
    const texte = String(brut).replace(/\s+/g, ' ').trim();
    if (!texte || occupee) return;
    occupee = true;
    $('#message').value = '';
    const box = $('#messages');

    if (etat.mode === 'ecrire') {
      const { bulle, ecrit } = nouvelleBulle('ia', '');
      const debut = document.createElement('b');
      debut.textContent = texte;
      bulle.insertBefore(debut, ecrit);
      let suite = '';
      demander({ type: 'generer', amorce: texte, max: 280, temperature: etat.temperature, arret: null }, {
        lettre(l) { suite += l; ecrit.textContent = suite; box.scrollTop = box.scrollHeight; },
        fini() { occupee = false; },
        erreur(msg) { ecrit.textContent = '(' + msg + ')'; occupee = false; },
      });
      return;
    }

    nouvelleBulle('toi', texte);
    const { bulle, ecrit } = nouvelleBulle('ia', '');
    const contexte = conversation.slice(-2).map((e) => `Toi : ${e.q}\nIA : ${e.r}\n`).join('');
    let reponse = '';
    demander({ type: 'generer', amorce: `\n${contexte}Toi : ${texte}\nIA : `, max: 200, temperature: etat.temperature, arret: '\n' }, {
      lettre(l) { reponse += l; ecrit.textContent = reponse; box.scrollTop = box.scrollHeight; },
      fini() {
        occupee = false;
        const r = reponse.trim();
        if (!r) ecrit.textContent = '(elle n\'a rien trouvé à dire)';
        conversation.push({ q: texte, r });
        proposerLecon(bulle, texte);
        box.scrollTop = box.scrollHeight;
      },
      erreur(msg) { ecrit.textContent = '(' + msg + ')'; occupee = false; },
    });
  }

  function proposerLecon(bulle, question) {
    const lien = document.createElement('button');
    lien.type = 'button';
    lien.className = 'apprendre';
    lien.textContent = 'Lui apprendre une meilleure réponse';
    lien.addEventListener('click', () => {
      lien.remove();
      const f = document.createElement('form');
      f.className = 'lecon';
      const champ = document.createElement('input');
      champ.maxLength = 160;
      champ.placeholder = 'Ce qu\'elle aurait dû répondre';
      champ.setAttribute('aria-label', 'La bonne réponse');
      const ok = document.createElement('button');
      ok.className = 'bouton petit';
      ok.type = 'submit';
      ok.textContent = 'Apprendre';
      f.append(champ, ok);
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        const r = champ.value.replace(/\s+/g, ' ').trim();
        if (!r) return;
        etat.lecons.push({ q: question, r });
        stock.ecrire('lecons', etat.lecons);
        envoyerTextes();
        afficherLecons();
        f.remove();
        const note = document.createElement('span');
        note.className = 'apprendre';
        note.style.textDecoration = 'none';
        note.textContent = 'Leçon notée : elle va la réviser en s\'entraînant.';
        bulle.append(note);
        if (!etat.enCours) basculerEntrainement(true);
        afficherToast('Leçon ajoutée ! Laisse-la s\'entraîner un peu, puis repose ta question.');
      });
      bulle.append(f);
      champ.focus();
    });
    bulle.append(lien);
  }

  // ---------------------------------------------------------------------------
  // Onglet « Ce qu'elle lit »
  // ---------------------------------------------------------------------------
  function compter() {
    const t = avecNom($('#textes').value);
    const propre = IA.nettoyer(t);
    const pages = propre.length / PAGE;
    let msg = `${nombre.format(propre.length)} caractères, soit environ ${decimal(pages, pages < 10 ? 1 : 0)} page${pages >= 2 ? 's' : ''}.`;
    if (propre.length < 1000) msg += ' C\'est très peu : elle va surtout apprendre par cœur.';
    const oublies = t.replace(/\r/g, '').length - propre.length;
    if (oublies > 0 && !/[…‘’“”]/.test(t)) msg += ` (${nombre.format(oublies)} caractère${oublies > 1 ? 's' : ''} qu'elle ne connaît pas seront ignorés.)`;
    $('#compteur').textContent = msg;
    const change = $('#textes').value !== etat.textes;
    $('#utiliser').disabled = !change || propre.length < 200;
    $('#annuler-textes').disabled = !change;
  }

  function afficherLecons() {
    const ul = $('#lecons');
    ul.textContent = '';
    etat.lecons.forEach((l, i) => {
      const li = document.createElement('li');
      const s = document.createElement('span');
      const q = document.createElement('em');
      q.textContent = l.q + ' → ';
      s.append(q, document.createTextNode(l.r));
      const x = document.createElement('button');
      x.type = 'button';
      x.className = 'bouton petit';
      x.textContent = 'Retirer';
      x.setAttribute('aria-label', 'Retirer la leçon ' + l.q);
      x.addEventListener('click', () => {
        etat.lecons.splice(i, 1);
        stock.ecrire('lecons', etat.lecons);
        envoyerTextes();
        afficherLecons();
      });
      li.append(s, x);
      ul.append(li);
    });
  }

  // Lui donner encore plus à lire : livres libres de droits (Wikisource) et articles.
  async function chercherLivres(source, requete) {
    const ligne = $('#etat-livres');
    ligne.textContent = 'Recherche…';
    $('#resultats-livres').textContent = '';
    try {
      const resultats = await RECHERCHE.listerTextes(source, requete, 8);
      ligne.textContent = resultats.length
        ? `${resultats.length} résultat${resultats.length > 1 ? 's' : ''} sur ${RECHERCHE.WIKIS[source].nom} :`
        : "Rien trouvé. Essaie avec d'autres mots.";
      afficherLivres(source, resultats.map((r) => ({ titre: r.titre, detail: r.extrait })));
    } catch (e) {
      ligne.textContent = "La recherche n'a pas marché. Vérifie ta connexion internet.";
    }
  }

  function afficherLivres(source, elements) {
    const liste = $('#resultats-livres');
    liste.textContent = '';
    for (const el of elements) {
      const li = document.createElement('li');
      const s = document.createElement('span');
      s.textContent = el.titre;
      if (el.detail) {
        const petit = document.createElement('small');
        petit.textContent = el.detail.slice(0, 150) + '…';
        s.append(petit);
      }
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'bouton petit';
      b.textContent = 'Ajouter';
      b.addEventListener('click', () => ajouterLivre(source, el.titre, b));
      li.append(s, b);
      liste.append(li);
    }
  }

  async function ajouterLivre(source, titre, bouton) {
    bouton.disabled = true;
    bouton.textContent = '…';
    try {
      const t = await RECHERCHE.texteComplet(source, titre, 40000);
      if (t.liens.length) {
        $('#etat-livres').textContent = `« ${t.titre} » est un sommaire : choisis la version à ajouter.`;
        afficherLivres(source, t.liens.map((l) => ({ titre: l })));
        return;
      }
      const zone = $('#textes');
      zone.value = zone.value.replace(/\s*$/, '') + `\n\n${t.titre.split('/').pop()}\n\n${t.texte}\n`;
      compter();
      bouton.textContent = 'Ajouté ✓';
      afficherToast(`« ${t.titre} » ajouté (${nombre.format(t.texte.length)} caractères). Clique sur « Utiliser ce texte » pour qu'elle le lise.`);
    } catch (e) {
      bouton.disabled = false;
      bouton.textContent = 'Réessayer';
      afficherToast('Impossible de récupérer ce texte.');
    }
  }

  // ---------------------------------------------------------------------------
  // Onglet « Dans sa tête »
  // ---------------------------------------------------------------------------
  let teteMinuteur = null;
  const lettreVisible = (c) => (c === '\n' ? '↵' : c === ' ' ? '␣' : c);

  function afficherTete() {
    if ($('#p-tete').hidden || !etat.cfg) return;
    clearTimeout(teteMinuteur);
    teteMinuteur = setTimeout(() => {
      demander({ type: 'probas', texte: $('#tete-texte').value, combien: 10 }, {
        reponse(m) {
          const box = $('#barres');
          box.textContent = '';
          for (const { lettre, valeur } of m.liste) {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'barre';
            b.title = 'Ajouter « ' + lettreVisible(lettre) + ' »';
            const l = document.createElement('span');
            l.className = 'lettre';
            l.textContent = lettreVisible(lettre);
            const j = document.createElement('span');
            j.className = 'jauge';
            const i = document.createElement('i');
            i.style.width = Math.max(0.5, valeur * 100) + '%';
            j.append(i);
            const pc = document.createElement('span');
            pc.className = 'pc';
            pc.textContent = valeur >= 0.1 ? Math.round(valeur * 100) + ' %' : decimal(valeur * 100, 1) + ' %';
            b.append(l, j, pc);
            b.addEventListener('click', () => { $('#tete-texte').value += lettre; afficherTete(); });
            box.append(b);
          }
        },
      });
    }, 120);
  }

  // ---------------------------------------------------------------------------
  // Sauvegarde par fichier
  // ---------------------------------------------------------------------------
  function telecharger() {
    sauvegarder((cerveau) => {
      const fichier = {
        app: 'mon-ia', version: 1, nom: etat.nom, taille: etat.taille,
        textes: etat.textes, lecons: etat.lecons, historique: etat.historique, journal: etat.journal, cerveau,
      };
      const lien = document.createElement('a');
      lien.href = URL.createObjectURL(new Blob([JSON.stringify(fichier)], { type: 'application/json' }));
      const propre = etat.nom.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '') || 'mon-ia';
      lien.download = `${propre}-etape-${cerveau.etape}.json`;
      document.body.append(lien);
      lien.click();
      lien.remove();
      setTimeout(() => URL.revokeObjectURL(lien.href), 5000);
    });
  }

  function chargerFichier(fichier) {
    const lecteur = new FileReader();
    lecteur.onload = () => {
      let f;
      try { f = JSON.parse(lecteur.result); } catch (e) { afficherToast('Ce fichier n\'est pas un cerveau de Mira.'); return; }
      if (!f || f.app !== 'mon-ia' || !f.cerveau) { afficherToast('Ce fichier n\'est pas un cerveau de Mira.'); return; }
      basculerEntrainement(false);
      demander({ type: 'charger', sauvegarde: f.cerveau, paquet: PAQUET }, {
        erreur(msg) { afficherToast('Impossible de le charger : ' + msg); },
      });
      etat.nom = f.nom || etat.nom;
      etat.taille = TAILLES[f.taille] ? f.taille : trouverTaille(f.cerveau.cfg);
      if (typeof f.textes === 'string') etat.textes = f.textes;
      if (Array.isArray(f.lecons)) etat.lecons = f.lecons;
      etat.historique = Array.isArray(f.historique) ? f.historique : [];
      etat.journal = Array.isArray(f.journal) ? f.journal : [];
      etat.perte = etat.historique.length ? etat.historique[etat.historique.length - 1][1] : null;
      etat.reussite = null;
      stock.ecrire('nom', etat.nom);
      stock.ecrire('taille', etat.taille);
      stock.ecrire('textes', etat.textes);
      stock.ecrire('lecons', etat.lecons);
      $('#nom').value = etat.nom;
      $('#taille').value = etat.taille;
      $('#textes').value = etat.textes;
      compter();
      afficherLecons();
      afficherJournal();
      envoyerTextes();
      dessinerCourbe();
      setTimeout(() => sauvegarder(), 300);
      afficherToast(`${etat.nom} est de retour !`);
    };
    lecteur.readAsText(fichier);
  }

  function trouverTaille(cfg) {
    for (const [cle, t] of Object.entries(TAILLES)) {
      if (t.cfg.d === cfg.d && t.cfg.L === cfg.L && t.cfg.H === cfg.H && t.cfg.T === cfg.T) return cle;
    }
    return 'perso';
  }

  // ---------------------------------------------------------------------------
  // Petits outils
  // ---------------------------------------------------------------------------
  let toastMinuteur = null;
  function afficherToast(texte) {
    const t = $('#toast');
    t.textContent = texte;
    t.classList.add('visible');
    clearTimeout(toastMinuteur);
    toastMinuteur = setTimeout(() => t.classList.remove('visible'), 3200);
  }

  // ---------------------------------------------------------------------------
  // Mise en route
  // ---------------------------------------------------------------------------
  function demarrerPage() {
    // nom
    const champNom = $('#nom');
    champNom.value = etat.nom;
    champNom.addEventListener('change', () => {
      etat.nom = champNom.value.replace(/\s+/g, ' ').trim().slice(0, 24) || 'Mira';
      champNom.value = etat.nom;
      stock.ecrire('nom', etat.nom);
      envoyerTextes();
      afficherToast(`Elle s'appelle maintenant ${etat.nom}. Il faut un peu d'entraînement pour qu'elle le retienne !`);
    });
    champNom.addEventListener('keydown', (e) => { if (e.key === 'Enter') champNom.blur(); });

    // tailles
    const choix = $('#taille');
    for (const [cle, t] of Object.entries(TAILLES)) {
      const c = new IA.Cerveau(t.cfg, 1);
      const o = document.createElement('option');
      o.value = cle;
      o.textContent = `${t.nom} · ${court(c.nbParametres)} paramètres (${t.detail})`;
      choix.append(o);
    }
    choix.value = etat.taille;
    choix.addEventListener('change', () => {
      if (etat.etape > 0 && !confirm('Changer de taille lui fait tout oublier : elle repart de zéro. Continuer ?')) {
        choix.value = etat.taille;
        return;
      }
      basculerEntrainement(false);
      etat.taille = choix.value;
      stock.ecrire('taille', etat.taille);
      nouveauCerveau();
    });

    $('#bouton-entrainer').addEventListener('click', () => basculerEntrainement());
    $('#recommencer').addEventListener('click', () => {
      if (!confirm('Elle va tout oublier et repartir de zéro. Ses textes et ses leçons sont gardés. Continuer ?')) return;
      basculerEntrainement(false);
      nouveauCerveau();
      afficherAccueil();
    });

    // discussion
    for (const b of document.querySelectorAll('.modes button')) {
      b.addEventListener('click', () => {
        etat.mode = b.dataset.mode;
        for (const x of document.querySelectorAll('.modes button')) x.setAttribute('aria-pressed', String(x === b));
        $('#messages').textContent = '';
        afficherDiscussion();
        $('#message').focus();
      });
    }
    $('#formulaire').addEventListener('submit', (e) => { e.preventDefault(); envoyerMessage($('#message').value); });
    const imagination = $('#imagination');
    const majImagination = () => {
      etat.temperature = parseFloat(imagination.value);
      const mot = etat.temperature < 0.45 ? 'sage' : etat.temperature < 0.85 ? 'normale' : etat.temperature < 1.15 ? 'créative' : 'farfelue';
      $('#imagination-valeur').textContent = `${decimal(etat.temperature, 2)} · ${mot}`;
    };
    imagination.addEventListener('input', majImagination);
    majImagination();

    // onglets
    const onglets = Array.from(document.querySelectorAll('[role="tab"]'));
    const ouvrir = (t) => {
      for (const o of onglets) {
        const actif = o === t;
        o.setAttribute('aria-selected', String(actif));
        o.tabIndex = actif ? 0 : -1;
        $('#' + o.getAttribute('aria-controls')).hidden = !actif;
      }
      if (t.id === 't-tete') afficherTete();
    };
    onglets.forEach((t, i) => {
      t.addEventListener('click', () => ouvrir(t));
      t.addEventListener('keydown', (e) => {
        const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        const n = onglets[(i + d + onglets.length) % onglets.length];
        ouvrir(n);
        n.focus();
      });
    });

    // textes
    const zone = $('#textes');
    zone.value = etat.textes;
    zone.addEventListener('input', compter);
    for (const b of document.querySelectorAll('[data-modele]')) {
      b.addEventListener('click', () => {
        zone.value = b.dataset.modele === 'vide' ? '' : TEXTES[b.dataset.modele];
        compter();
        zone.focus();
      });
    }
    $('#utiliser').addEventListener('click', () => {
      etat.textes = zone.value;
      if (!stock.ecrire('textes', etat.textes)) afficherToast('Texte utilisé, mais il n\'a pas pu être gardé dans le navigateur.');
      else afficherToast('C\'est noté ! Elle lira ce texte à partir de maintenant.');
      envoyerTextes();
      afficherJournal();
      compter();
    });
    $('#annuler-textes').addEventListener('click', () => { zone.value = etat.textes; compter(); });
    compter();
    afficherLecons();
    if (typeof RECHERCHE === 'undefined') $('#form-livres').hidden = true;
    $('#form-livres').addEventListener('submit', (e) => {
      e.preventDefault();
      const requete = $('#recherche-livres').value.trim();
      if (requete) chercherLivres($('#source-livres').value, requete);
    });

    // dans sa tête
    $('#tete-texte').value = "Toi : Comment tu t'appelles ?\nIA : Je m'appelle ";
    $('#tete-texte').addEventListener('input', afficherTete);
    $('#tete-effacer').addEventListener('click', () => {
      const t = $('#tete-texte');
      t.value = Array.from(t.value).slice(0, -1).join('');
      afficherTete();
    });
    $('#tete-hasard').addEventListener('click', () => {
      demander({ type: 'generer', amorce: $('#tete-texte').value, max: 1, temperature: etat.temperature, arret: null }, {
        lettre(l) { $('#tete-texte').value += l; },
        fini() { afficherTete(); },
      });
    });
    setInterval(() => { if (etat.enCours) afficherTete(); }, 1500);

    // sauvegarde
    $('#telecharger').addEventListener('click', telecharger);
    $('#charger').addEventListener('click', () => $('#fichier').click());
    $('#fichier').addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      if (f) chargerFichier(f);
      e.target.value = '';
    });
    $('#tout-effacer').addEventListener('click', () => {
      if (!confirm('Tout effacer : son cerveau, ses textes, ses leçons et son nom ? Tu ne pourras pas revenir en arrière.')) return;
      for (const cle of ['nom', 'taille', 'textes', 'lecons', 'historique', 'journal', 'cerveau']) stock.effacer(cle);
      location.reload();
    });
    setInterval(() => { if (etat.enCours) sauvegarder(); }, 20000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && etat.enCours) sauvegarder(); });

    // le schéma montre les vrais numéros des lettres
    $('.schema div:nth-child(3) code').textContent = Array.from(IA.encoder("Je m'")).join(' ') + ' …';

    if ('ResizeObserver' in window) new ResizeObserver(dessinerCourbe).observe($('#courbe'));
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', dessinerCourbe);
    window.addEventListener('mira-theme', dessinerCourbe);

    // le cerveau
    envoyerTextes();
    const sauvee = stock.lire('cerveau', null);
    if (sauvee) {
      demander({ type: 'charger', sauvegarde: sauvee, paquet: PAQUET }, {
        erreur() { afficherToast('Sa sauvegarde était abîmée : elle repart de zéro.'); nouveauCerveau(); },
      });
      if (etat.historique.length) etat.perte = etat.historique[etat.historique.length - 1][1];
      $('#etat-sauvegarde').textContent = 'Cerveau retrouvé dans ce navigateur.';
    } else {
      nouveauCerveau();
    }
    afficherJournal();
    afficherBouton();
    dessinerCourbe();
  }

  demarrerPage();
})();
