/*
 * admin.js — le panneau admin de Mira (admin.html) :
 *   - le verrou : un code secret, dont on ne garde qu'une empreinte brouillée
 *     (PBKDF2-SHA256, 600 000 tours, avec un sel tiré au hasard) ;
 *   - la publication : le fichier mira-public.json que lit la page des visiteurs.
 *
 * Le verrou :
 *   - le panneau ne reste ouvert que dans l'onglet où tu as tapé le code (sessionStorage),
 *     et il se reverrouille tout seul après 20 minutes sans rien toucher ;
 *   - après 5 codes faux de suite, il faut attendre (30 s, puis 1 min, 2 min… jusqu'à 15 min) ;
 *   - pour changer le code, il faut d'abord taper le code actuel ;
 *   - il refuse de s'ouvrir à l'intérieur d'une autre page (iframe).
 *
 * Attention, honnêtement : un site sans serveur ne peut pas vraiment cacher une page.
 * Le verrou protège ton panneau sur un ordinateur partagé. La vraie protection, c'est que
 * seul ton compte GitHub peut publier ce que voient les visiteurs.
 */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const lireJSON = (cle, defaut) => { try { const v = localStorage.getItem(cle); return v === null ? defaut : JSON.parse(v); } catch (e) { return defaut; } };
  const ecrireJSON = (cle, v) => { try { localStorage.setItem(cle, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const effacer = (cle) => { try { localStorage.removeItem(cle); } catch (e) { /* rien */ } };
  const session = {
    lire(cle) { try { return sessionStorage.getItem(cle); } catch (e) { return null; } },
    ecrire(cle, v) { try { sessionStorage.setItem(cle, v); } catch (e) { /* rien */ } },
    effacer(cle) { try { sessionStorage.removeItem(cle); } catch (e) { /* rien */ } },
  };
  const nomIA = () => ($('#nom').value || 'Mira').trim() || 'Mira';
  const ACCUEIL_PAR_DEFAUT = "Bienvenue ! Je suis {nom}, une IA qui tourne entièrement dans ton navigateur. Joue avec les créations de la vitrine, demande-moi de coder un jeu ou une page, ou viens parler à mon petit cerveau fait maison.";

  const CLE_CODE = 'mira.admin.code';
  const CLE_OUVERT = 'mira.admin.ouvert';
  const CLE_ESSAIS = 'mira.admin.essais';
  const TOURS = 600000;
  const INACTIVITE = 20 * 60 * 1000;

  let publie = null; // le mira-public.json actuellement en ligne
  let reference = null; // { algo, tours, sel, empreinte, date } du code secret
  let mode = 'saisie'; // 'saisie', 'creation', 'ancien' (avant de changer) ou 'changement'
  let occupe = false;
  let derniereActivite = Date.now();
  const encadre = (() => { try { return window.top !== window.self; } catch (e) { return true; } })();

  function toast(texte) {
    const t = $('#toast');
    t.textContent = texte;
    t.classList.add('visible');
    clearTimeout(toast.minuteur);
    toast.minuteur = setTimeout(() => t.classList.remove('visible'), 4000);
  }

  // --- Le code secret ---
  const enHexa = (octets) => Array.from(new Uint8Array(octets), (b) => b.toString(16).padStart(2, '0')).join('');
  const nouveauSel = () => enHexa(crypto.getRandomValues(new Uint8Array(16)));

  async function empreinte(ref, code) {
    const t = new TextEncoder();
    if (ref.algo === 'pbkdf2-sha256') {
      const cle = await crypto.subtle.importKey('raw', t.encode(code), 'PBKDF2', false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: t.encode(ref.sel), iterations: ref.tours }, cle, 256);
      return enHexa(bits);
    }
    // L'ancienne empreinte (un seul SHA-256) : acceptée une dernière fois, puis remplacée.
    return enHexa(await crypto.subtle.digest('SHA-256', t.encode(ref.sel + ':' + code)));
  }

  async function nouvelleReference(code) {
    const ref = { algo: 'pbkdf2-sha256', tours: TOURS, sel: nouveauSel(), date: Date.now() };
    ref.empreinte = await empreinte(ref, code);
    return ref;
  }

  // Une empreinte publiée ou gardée doit avoir la bonne forme, sinon on l'ignore.
  function valide(ref) {
    if (!ref || typeof ref !== 'object' || !/^[0-9a-f]{16,64}$/.test(ref.sel) || !/^[0-9a-f]{64}$/.test(ref.empreinte)) return null;
    if (ref.algo === undefined) return ref;
    if (ref.algo === 'pbkdf2-sha256' && Number.isInteger(ref.tours) && ref.tours >= 100000 && ref.tours <= 10000000) return ref;
    return null;
  }

  const estOuvert = () => !!reference && session.lire(CLE_OUVERT) === reference.empreinte;

  // --- Les codes faux : 5 essais, puis il faut attendre de plus en plus longtemps ---
  function attente() {
    const e = lireJSON(CLE_ESSAIS, null);
    return e && e.jusqua > Date.now() ? e.jusqua - Date.now() : 0;
  }
  function essaiRate() {
    const e = lireJSON(CLE_ESSAIS, null) || {};
    e.rates = (e.rates || 0) + 1;
    e.jusqua = e.rates >= 5 ? Date.now() + Math.min(15 * 60000, 30000 * 2 ** (e.rates - 5)) : 0;
    ecrireJSON(CLE_ESSAIS, e);
  }
  let minuteurAttente = null;
  function montrerAttente() {
    clearInterval(minuteurAttente);
    const maj = () => {
      const reste = attente();
      $('#verrou-valider').disabled = occupe || reste > 0;
      if (reste > 0) {
        const s = Math.ceil(reste / 1000);
        $('#verrou-erreur').textContent = `Trop de codes faux. Réessaie dans ${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s.`;
      } else {
        clearInterval(minuteurAttente);
        if ($('#verrou-erreur').textContent.startsWith('Trop de codes')) $('#verrou-erreur').textContent = '';
      }
    };
    maj();
    if (attente() > 0) minuteurAttente = setInterval(maj, 1000);
  }

  // --- L'écran du verrou ---
  const TEXTES_VERROU = {
    creation: 'Bienvenue ! Choisis un code secret pour protéger ton panneau (au moins 4 caractères). Garde-le bien : il sera demandé sur chaque ordinateur.',
    saisie: 'Entre ton code secret pour ouvrir ton panneau.',
    ancien: "Pour changer ton code, tape d'abord ton code actuel.",
    changement: 'Choisis ton nouveau code secret (au moins 4 caractères).',
  };
  const libelle = () => (mode === 'creation' || mode === 'changement' ? 'Enregistrer mon code' : mode === 'ancien' ? 'Continuer' : 'Entrer');

  function viderChamps() {
    $('#verrou-code').value = '';
    $('#verrou-confirmation').value = '';
  }

  function occuper(oui) {
    occupe = oui;
    $('#verrou-valider').textContent = oui ? 'Vérification…' : libelle();
    $('#verrou-valider').disabled = oui || attente() > 0;
  }

  function afficherVerrou(nouveauMode, note) {
    mode = nouveauMode;
    document.body.classList.add('verrouille');
    $('.page').inert = true;
    $('#verrou').hidden = false;
    $('#verrou-confirmation').hidden = !(mode === 'creation' || mode === 'changement');
    if ($('#verrou-annuler')) $('#verrou-annuler').hidden = !(mode === 'ancien' || mode === 'changement');
    $('#verrou-texte').textContent = (note ? note + ' ' : '') + TEXTES_VERROU[mode];
    $('#verrou-valider').textContent = libelle();
    $('#verrou-erreur').textContent = '';
    viderChamps();
    montrerAttente();
    setTimeout(() => $('#verrou-code').focus(), 50);
  }

  function ouvrir() {
    viderChamps();
    $('#verrou-erreur').textContent = '';
    document.body.classList.remove('verrouille');
    $('.page').inert = false;
    $('#verrou').hidden = true;
    derniereActivite = Date.now();
  }

  function verrouiller(note) {
    session.effacer(CLE_OUVERT);
    afficherVerrou(reference ? 'saisie' : 'creation', note);
  }

  $('#verrou-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (occupe || encadre) return;
    const code = $('#verrou-code').value;
    const erreur = $('#verrou-erreur');
    if (!window.crypto || !crypto.subtle) { erreur.textContent = 'Ton navigateur ne permet pas de vérifier le code ici.'; return; }

    if (mode === 'saisie' || mode === 'ancien') {
      if (!reference || attente() > 0) { montrerAttente(); return; }
      occuper(true);
      const bon = (await empreinte(reference, code)) === reference.empreinte;
      if (bon && !reference.algo) {
        // Ancienne empreinte : on la remplace tout de suite par une plus solide.
        reference = await nouvelleReference(code);
        ecrireJSON(CLE_CODE, reference);
      }
      occuper(false);
      if (!bon) {
        essaiRate();
        erreur.textContent = 'Code incorrect.';
        $('#verrou-code').select();
        montrerAttente();
        return;
      }
      effacer(CLE_ESSAIS);
      if (mode === 'ancien') { afficherVerrou('changement'); return; }
      session.ecrire(CLE_OUVERT, reference.empreinte);
      ouvrir();
      return;
    }

    if (code.length < 4) { erreur.textContent = 'Il faut au moins 4 caractères.'; return; }
    if (code !== $('#verrou-confirmation').value) { erreur.textContent = 'Les deux codes ne sont pas pareils.'; return; }
    occuper(true);
    reference = await nouvelleReference(code);
    occuper(false);
    ecrireJSON(CLE_CODE, reference);
    session.ecrire(CLE_OUVERT, reference.empreinte);
    effacer(CLE_ESSAIS);
    const changement = mode === 'changement';
    ouvrir();
    majEtatPublication();
    toast(changement
      ? 'Code changé. Sur tes autres ordinateurs, il s\'appliquera après ta prochaine publication.'
      : 'Code enregistré ! Pense à publier pour qu\'il soit demandé aussi sur tes autres ordinateurs.');
  });

  // (vérifié : une ancienne copie d'admin.html, gardée par le navigateur, n'a pas ce bouton)
  if ($('#verrou-annuler')) $('#verrou-annuler').addEventListener('click', () => { if (estOuvert()) ouvrir(); else verrouiller(); });

  // Ctrl + Maj + Q (attrapé par outils.js, même quand une création a le clavier).
  window.addEventListener('mira-raccourci', () => {
    if ($('#verrou').hidden) verrouiller();
    else $('#verrou-code').focus();
  });
  $('#verrouiller').addEventListener('click', () => verrouiller());

  // --- Il se reverrouille tout seul après 20 minutes sans activité ---
  for (const type of ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart', 'scroll']) {
    window.addEventListener(type, () => { derniereActivite = Date.now(); }, { capture: true, passive: true });
  }
  function surveiller() {
    if ($('#verrou').hidden && Date.now() - derniereActivite > INACTIVITE) verrouiller('Verrouillé après 20 minutes sans activité.');
  }
  setInterval(surveiller, 15000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) surveiller(); });

  // --- La publication ---
  // Les textes du panneau contiennent « {nom} » : on le remplace par le nom de ton IA.
  let noeudsNom = null;
  function remplacerNom() {
    if (!noeudsNom) {
      noeudsNom = [];
      const marcheur = document.createTreeWalker($('#vue-publication'), NodeFilter.SHOW_TEXT);
      while (marcheur.nextNode()) {
        const n = marcheur.currentNode;
        if (n.nodeValue.includes('{nom}')) noeudsNom.push({ noeud: n, modele: n.nodeValue });
      }
    }
    for (const n of noeudsNom) n.noeud.nodeValue = n.modele.split('{nom}').join(nomIA());
  }

  const creations = () => lireJSON('mira.atelier.creations', []);
  function selectionVitrine() {
    const enregistree = lireJSON('mira.admin.vitrine', null);
    if (enregistree) return new Set(enregistree);
    return new Set(publie && Array.isArray(publie.creations) ? publie.creations.filter((c) => c.vitrine).map((c) => c.id) : []);
  }

  function afficherPublication() {
    remplacerNom();
    const liste = $('#pub-vitrine');
    liste.textContent = '';
    const choisies = selectionVitrine();
    for (const c of creations()) {
      const li = document.createElement('li');
      const label = document.createElement('label');
      const caseC = document.createElement('input');
      caseC.type = 'checkbox';
      caseC.checked = choisies.has(c.id);
      caseC.disabled = !c.page;
      caseC.addEventListener('change', () => {
        const s = selectionVitrine();
        if (caseC.checked) s.add(c.id); else s.delete(c.id);
        ecrireJSON('mira.admin.vitrine', Array.from(s));
      });
      const texte = document.createElement('span');
      const titre = document.createElement('b');
      titre.textContent = c.titre;
      const petit = document.createElement('small');
      petit.textContent = new Date(c.date).toLocaleDateString('fr-FR') + (c.page ? '' : ' · pas une page web, ne peut pas aller en vitrine') + (c.exemple ? ' · ⭐ exemple' : '');
      texte.append(titre, petit);
      label.append(caseC, texte);
      li.append(label);
      liste.append(li);
    }
    $('#pub-nb-exemples').textContent = creations().filter((c) => c.exemple && c.page).length;
    const cerveau = lireJSON('monia.cerveau', null);
    const caseCerveau = $('#pub-cerveau');
    if (cerveau && cerveau.poids) {
      const ko = Math.round(cerveau.poids.length * 0.75 / 1024);
      $('#pub-cerveau-infos').textContent = `(dernière sauvegarde : étape ${Number(cerveau.etape || 0).toLocaleString('fr-FR')}, ${ko} Ko)`;
      caseCerveau.disabled = false;
      caseCerveau.checked = lireJSON('mira.admin.publier-cerveau', true) !== false;
    } else {
      $('#pub-cerveau-infos').textContent = "(pas encore de petit cerveau entraîné : entraîne-le d'abord dans le Laboratoire)";
      caseCerveau.checked = false;
      caseCerveau.disabled = true;
    }
  }

  function majEtatPublication() {
    const ligne = $('#pub-etat');
    if (!publie) {
      ligne.textContent = "Rien n'est encore publié : les visiteurs voient une Mira toute neuve, sans vitrine ni petit cerveau.";
      return;
    }
    const date = new Date(publie.publie).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });
    const vitrine = (publie.creations || []).filter((c) => c.vitrine).length;
    const codeAJour = reference && publie.codeAdmin && publie.codeAdmin.empreinte === reference.empreinte;
    ligne.textContent = `En ligne : publication du ${date} · ${vitrine} création${vitrine > 1 ? 's' : ''} en vitrine · petit cerveau ${publie.petitCerveau ? 'publié' : 'non publié'}`
      + (codeAJour ? '.' : ' · ton code secret actuel n\'est pas encore publié.');
  }

  function reglages() {
    return {
      festival: $('#pub-festival').checked,
      recherche: $('#pub-recherche').checked,
      autoCorrection: $('#pub-correction').checked,
    };
  }

  function construireFichier() {
    const vitrine = selectionVitrine();
    const partager = $('#pub-exemples').checked;
    const choisies = creations()
      .filter((c) => c.page && (vitrine.has(c.id) || (partager && c.exemple)))
      .map((c) => ({
        id: c.id, titre: c.titre, demande: c.demande || '', langage: c.langage || 'html', page: true,
        contenu: c.contenu, date: c.date, vitrine: vitrine.has(c.id), exemple: partager && !!c.exemple,
      }));
    const cerveau = $('#pub-cerveau').checked ? lireJSON('monia.cerveau', null) : null;
    return {
      format: 'mira-public/1',
      publie: new Date().toISOString(),
      nom: nomIA(),
      accueil: $('#pub-accueil').value.trim(),
      creations: choisies,
      petitCerveau: cerveau && cerveau.poids ? { sauvegarde: cerveau, taille: lireJSON('monia.taille', 'petite') } : null,
      reglages: reglages(),
      codeAdmin: reference,
    };
  }

  function preparerPublication() {
    const accueil = $('#pub-accueil');
    accueil.value = lireJSON('mira.admin.accueil', null) ?? (publie && typeof publie.accueil === 'string' ? publie.accueil : ACCUEIL_PAR_DEFAUT);
    accueil.addEventListener('input', () => ecrireJSON('mira.admin.accueil', accueil.value));
    const r = lireJSON('mira.admin.reglages', null) || (publie && publie.reglages) || {};
    const cases = { festival: '#pub-festival', recherche: '#pub-recherche', autoCorrection: '#pub-correction' };
    for (const [cle, id] of Object.entries(cases)) {
      $(id).checked = r[cle] !== false;
      $(id).addEventListener('change', () => ecrireJSON('mira.admin.reglages', reglages()));
    }
    const exemples = lireJSON('mira.admin.partager-exemples', null);
    $('#pub-exemples').checked = exemples !== false;
    $('#pub-exemples').addEventListener('change', () => ecrireJSON('mira.admin.partager-exemples', $('#pub-exemples').checked));

    $('#pub-cerveau').addEventListener('change', () => ecrireJSON('mira.admin.publier-cerveau', $('#pub-cerveau').checked));
    $('#changer-code').addEventListener('click', () => afficherVerrou('ancien'));
    $('#pub-apercu').addEventListener('click', () => {
      if (!ecrireJSON('mira.public.brouillon', construireFichier())) {
        toast("L'aperçu est trop gros pour la mémoire du navigateur. Retire quelques créations de la vitrine.");
        return;
      }
      window.open('./?apercu', '_blank', 'noopener');
    });
    $('#pub-telecharger').addEventListener('click', () => {
      const fichier = construireFichier();
      const lien = document.createElement('a');
      lien.href = URL.createObjectURL(new Blob([JSON.stringify(fichier)], { type: 'application/json' }));
      lien.download = 'mira-public.json';
      document.body.append(lien);
      lien.click();
      lien.remove();
      setTimeout(() => URL.revokeObjectURL(lien.href), 5000);
      toast('Fichier prêt ! Dépose mira-public.json sur la page d\'envoi de ton dépôt GitHub, puis « Commit changes ».');
    });
    window.addEventListener('mira-vue', (e) => { if (e.detail === 'publication') afficherPublication(); });
    $('#nom').addEventListener('change', remplacerNom);
    if (!$('#vue-publication').hidden) afficherPublication();
  }

  // --- Mise en route : verrouillé tant qu'on ne sait pas ---
  document.body.classList.add('verrouille');
  $('.page').inert = true;
  // Avant, le panneau restait ouvert pour toujours sur l'ordinateur : maintenant, seulement dans l'onglet.
  effacer(CLE_OUVERT);
  if (encadre) {
    afficherVerrou('saisie');
    $('#verrou-texte').textContent = "Ce panneau ne s'ouvre que dans son propre onglet, pas à l'intérieur d'une autre page.";
    for (const el of $('#verrou-form').elements) el.disabled = true;
    return;
  }
  (async () => {
    try {
      const r = await fetch('mira-public.json', { cache: 'no-store' });
      if (r.ok) publie = await r.json();
    } catch (e) { /* pas encore publié, ou pas de connexion */ }
    // Le code le plus récent l'emporte : celui publié (changé sur un autre ordinateur),
    // ou celui de cet ordinateur (changé ici mais pas encore publié).
    const enLigne = valide(publie && publie.codeAdmin);
    const ici = valide(lireJSON(CLE_CODE, null));
    reference = !enLigne ? ici : !ici ? enLigne : ((ici.date || 0) >= (enLigne.date || 0) ? ici : enLigne);
    if (estOuvert()) ouvrir();
    else afficherVerrou(reference ? 'saisie' : 'creation');
    preparerPublication();
    majEtatPublication();
  })();
})();
