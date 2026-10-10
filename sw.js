/*
 * sw.js — le « service worker » de Mira : il garde une copie de la page et des
 * bibliothèques pour qu'elle marche aussi sans internet.
 *   - Les fichiers de Mira : on demande d'abord la version en ligne, toujours revérifiée
 *     (pour avoir les mises à jour tout de suite), et on se sert de la copie seulement si
 *     internet ne répond pas.
 *   - Les bibliothèques (WebLLM, highlight.js, polices) : leur adresse contient un numéro
 *     de version qui ne change jamais, donc on utilise directement la copie.
 *   - Le grand cerveau n'est pas géré ici : WebLLM le range lui-même dans IndexedDB.
 *   - La recherche sur les sites fiables n'est jamais gardée en copie.
 */
const VERSION = 'mira-v7';
// cerveau-claude.json (1,3 Mo) n'est pas dans la liste : il est gardé en copie la première fois qu'on le lit.
const FICHIERS = [
  './', 'index.html', 'admin.html', 'style.css', 'cerveau.js', 'textes.js', 'textes-claude.js', 'festival-resume.js', 'savoirs.js',
  'recherche.js', 'app.js', 'atelier.js', 'outils.js', 'admin.js', 'visiteur.js', 'manifest.webmanifest',
  'icone-192.png', 'icone-512.png',
];
// mira-public.json (ce que tu publies pour les visiteurs) passe par la règle « en ligne d'abord » :
// il est gardé en copie dès qu'il a été lu une fois.
const BIBLIOTHEQUES = ['https://cdn.jsdelivr.net/', 'https://cdnjs.cloudflare.com/', 'https://fonts.googleapis.com/', 'https://fonts.gstatic.com/'];

// GitHub Pages dit aux navigateurs de garder chaque fichier 10 minutes : juste après une mise à
// jour, une page pourrait mélanger d'anciens et de nouveaux fichiers. On revérifie donc toujours
// auprès de GitHub (« no-cache » : la réponse est minuscule quand rien n'a changé).
function frais(requete) {
  try { return fetch(new Request(requete, { cache: 'no-cache' })); } catch (e) { return fetch(requete); }
}

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FICHIERS.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((noms) => Promise.all(noms.filter((n) => n.startsWith('mira-') && n !== VERSION && n !== VERSION + '-bibliotheques').map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const requete = e.request;
  if (requete.method !== 'GET') return;
  const url = new URL(requete.url);

  if (url.origin === self.location.origin) {
    e.respondWith(
      frais(requete)
        .then((reponse) => {
          if (reponse.ok) {
            const copie = reponse.clone();
            caches.open(VERSION).then((c) => c.put(requete, copie));
          }
          return reponse;
        })
        .catch(() => caches.match(requete, { ignoreSearch: true }).then((r) => r || caches.match('index.html'))),
    );
    return;
  }

  if (BIBLIOTHEQUES.some((debut) => requete.url.startsWith(debut))) {
    e.respondWith(
      caches.match(requete).then((trouve) => trouve || fetch(requete).then((reponse) => {
        if (reponse.ok || reponse.type === 'opaque') {
          const copie = reponse.clone();
          caches.open(VERSION + '-bibliotheques').then((c) => c.put(requete, copie));
        }
        return reponse;
      })),
    );
  }
  // Tout le reste (Hugging Face, recherche sur les sites fiables…) passe normalement.
});
