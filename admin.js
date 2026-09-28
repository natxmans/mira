/*
 * admin.js — le panneau admin de Mira (admin.html) :
 *   - le verrou : un code secret, dont on ne garde qu'une empreinte brouillée (SHA-256) ;
 *   - la publication : le fichier mira-public.json que lit la page des visiteurs.
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
  const nomIA = () => ($('#nom').value || 'Mira').trim() || 'Mira';
  const ACCUEIL_PAR_DEFAUT = "Bienvenue ! Je suis {nom}, une IA qui tourne entièrement dans ton navigateur. Joue avec les créations de la vitrine, demande-moi de coder un jeu ou une page, ou viens parler à mon petit cerveau fait maison.";

  let publie = null; // le mira-public.json actuellement en ligne
  let reference = null; // { sel, empreinte } du code secret
  let mode = 'saisie'; // 'saisie', 'creation' ou 'changement'

  function toast(texte) {
    const t = $('#toast');
    t.textContent = texte;
    t.classList.add('visible');
    clearTimeout(toast.minuteur);
    toast.minuteur = setTimeout(() => t.classList.remove('visible'), 4000);
  }

  // --- Le code secret ---
  async function empreinte(sel, code) {
    const octets = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sel + ':' + code));
    return Array.from(new Uint8Array(octets), (b) => b.toString(16).padStart(2, '0')).join('');
  }
  const nouveauSel = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
  const estOuvert = () => !!reference && lireJSON('mira.admin.ouvert', '') === reference.empreinte;

  function afficherVerrou(nouveauMode) {
    mode = nouveauMode;
    document.body.classList.add('verrouille');
    $('.page').inert = true;
    $('#verrou').hidden = false;
    const creer = mode !== 'saisie';
    $('#verrou-confirmation').hidden = !creer;
    $('#verrou-texte').textContent = mode === 'creation'
      ? 'Bienvenue ! Choisis un code secret pour protéger ton panneau (au moins 4 caractères). Garde-le bien : il sera demandé sur chaque ordinateur.'
      : mode === 'changement' ? 'Choisis ton nouveau code secret (au moins 4 caractères).' : 'Entre ton code secret pour ouvrir ton panneau.';
    $('#verrou-valider').textContent = creer ? 'Enregistrer mon code' : 'Entrer';
    $('#verrou-erreur').textContent = '';
    $('#verrou-code').value = '';
    $('#verrou-confirmation').value = '';
    setTimeout(() => $('#verrou-code').focus(), 50);
  }

  function ouvrir() {
    document.body.classList.remove('verrouille');
    $('.page').inert = false;
    $('#verrou').hidden = true;
  }

  function verrouiller() {
    try { localStorage.removeItem('mira.admin.ouvert'); } catch (e) { /* rien */ }
    afficherVerrou(reference ? 'saisie' : 'creation');
  }

  $('#verrou-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = $('#verrou-code').value;
    const erreur = $('#verrou-erreur');
    if (!window.crypto || !crypto.subtle) { erreur.textContent = 'Ton navigateur ne permet pas de vérifier le code ici.'; return; }
    if (mode === 'saisie') {
      if (reference && await empreinte(reference.sel, code) === reference.empreinte) {
        ecrireJSON('mira.admin.ouvert', reference.empreinte);
        ouvrir();
      } else {
        await new Promise((r) => setTimeout(r, 700)); // on ralentit un peu ceux qui essaient au hasard
        erreur.textContent = 'Code incorrect.';
        $('#verrou-code').select();
      }
      return;
    }
    if (code.length < 4) { erreur.textContent = 'Il faut au moins 4 caractères.'; return; }
    if (code !== $('#verrou-confirmation').value) { erreur.textContent = 'Les deux codes ne sont pas pareils.'; return; }
    const sel = nouveauSel();
    reference = { sel, empreinte: await empreinte(sel, code), date: Date.now() };
    ecrireJSON('mira.admin.code', reference);
    ecrireJSON('mira.admin.ouvert', reference.empreinte);
    const changement = mode === 'changement';
    ouvrir();
    majEtatPublication();
    toast(changement
      ? 'Code changé. Sur tes autres ordinateurs, il s\'appliquera après ta prochaine publication.'
      : 'Code enregistré ! Pense à publier pour qu\'il soit demandé aussi sur tes autres ordinateurs.');
  });

  document.addEventListener('keydown', (e) => {
    if (!(e.ctrlKey && e.shiftKey && (e.key === 'Q' || e.key === 'q'))) return;
    e.preventDefault();
    if ($('#verrou').hidden) verrouiller();
    else $('#verrou-code').focus();
  });
  $('#verrouiller').addEventListener('click', verrouiller);

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
    ligne.textContent = `En ligne : publication du ${date} · ${vitrine} création${vitrine > 1 ? 's' : ''} en vitrine · petit cerveau ${publie.petitCerveau ? 'publié' : 'non publié'}.`;
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
    $('#changer-code').addEventListener('click', () => afficherVerrou('changement'));
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
  (async () => {
    try {
      const r = await fetch('mira-public.json', { cache: 'no-store' });
      if (r.ok) publie = await r.json();
    } catch (e) { /* pas encore publié, ou pas de connexion */ }
    // Le code le plus récent l'emporte : celui publié (changé sur un autre ordinateur),
    // ou celui de cet ordinateur (changé ici mais pas encore publié).
    const enLigne = publie && publie.codeAdmin && publie.codeAdmin.sel && publie.codeAdmin.empreinte ? publie.codeAdmin : null;
    const ici = lireJSON('mira.admin.code', null);
    reference = !enLigne ? ici : !ici ? enLigne : ((ici.date || 0) > (enLigne.date || 0) ? ici : enLigne);
    if (estOuvert()) ouvrir();
    else afficherVerrou(reference ? 'saisie' : 'creation');
    preparerPublication();
    majEtatPublication();
  })();
})();
