/*
 * outils.js — les petits outils de toute la page : le thème (clair, sombre ou comme
 * l'ordinateur), le guide rapide, et l'installation de Mira comme une application
 * (qui marche aussi sans internet une fois son grand cerveau téléchargé).
 */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const lire = (cle, defaut) => { try { return localStorage.getItem(cle) || defaut; } catch (e) { return defaut; } };
  const ecrire = (cle, valeur) => { try { localStorage.setItem(cle, valeur); } catch (e) { /* rien */ } };

  // --- Thème ---
  const THEMES = ['auto', 'light', 'dark'];
  const NOMS = { auto: 'auto', light: 'clair', dark: 'sombre' };
  function appliquerTheme(theme) {
    if (theme === 'auto') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
    $('#bouton-theme').textContent = 'Thème : ' + NOMS[theme];
    window.dispatchEvent(new Event('mira-theme'));
  }
  let theme = lire('mira.theme', 'auto');
  if (!THEMES.includes(theme)) theme = 'auto';
  appliquerTheme(theme);
  $('#bouton-theme').addEventListener('click', () => {
    theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    ecrire('mira.theme', theme);
    appliquerTheme(theme);
  });

  // --- Guide rapide ---
  const guide = $('#guide');
  $('#bouton-guide').addEventListener('click', () => {
    if (typeof guide.showModal === 'function') guide.showModal();
    else guide.setAttribute('open', '');
  });
  $('#fermer-guide').addEventListener('click', () => guide.close());
  guide.addEventListener('click', (e) => { if (e.target === guide) guide.close(); });
  // La première fois, on propose le guide.
  if (!lire('mira.guide-vu', '')) {
    ecrire('mira.guide-vu', 'oui');
    setTimeout(() => { if (typeof guide.showModal === 'function' && !document.querySelector('dialog[open]')) guide.showModal(); }, 800);
  }

  // --- Le raccourci Ctrl + Maj + Q ---
  // Sur le panneau admin, il verrouille ; sur la page des visiteurs, il mène au panneau.
  // On l'attrape avant tout le reste de la page (phase de capture), et les cadres des
  // créations nous le renvoient quand ce sont eux qui ont le clavier (voir AIDE_CADRE).
  window.addEventListener('keydown', (e) => {
    if (!(e.ctrlKey && e.shiftKey && !e.altKey && !e.metaKey && String(e.key).toLowerCase() === 'q') || e.repeat) return;
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(new Event('mira-raccourci'));
  }, true);

  // --- Installer comme une application ---
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => { /* pas grave : le site marche quand même */ });
  }
  let invitation = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    invitation = e;
    $('#installer').hidden = false;
  });
  $('#installer').addEventListener('click', async () => {
    if (!invitation) return;
    invitation.prompt();
    try { await invitation.userChoice; } catch (e) { /* rien */ }
    invitation = null;
    $('#installer').hidden = true;
  });
  window.addEventListener('appinstalled', () => { $('#installer').hidden = true; });
})();
