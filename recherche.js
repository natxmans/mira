/*
 * recherche.js — la recherche de Mira sur des sites fiables, et seulement eux :
 *   - Vikidia (l'encyclopédie des 8-13 ans), Wikipédia et Wiktionnaire : les connaissances ;
 *   - MDN Web Docs (la documentation de référence du web, par Mozilla) : HTML, CSS, JavaScript ;
 *   - Stack Overflow (questions-réponses de programmeurs) : les messages d'erreur ;
 *   - Wikisource (livres libres de droits) : des textes pour le petit cerveau.
 *
 * Seuls les mots de ta recherche sont envoyés à ces sites. Ce qu'ils renvoient n'est
 * jamais exécuté : on n'en garde que le texte.
 */
function installerRecherche() {
  'use strict';

  const WIKIS = {
    vikidia: { nom: 'Vikidia', api: 'https://fr.vikidia.org/w/api.php', page: 'https://fr.vikidia.org/wiki/' },
    wikipedia: { nom: 'Wikipédia', api: 'https://fr.wikipedia.org/w/api.php', page: 'https://fr.wikipedia.org/wiki/' },
    wiktionnaire: { nom: 'Wiktionnaire', api: 'https://fr.wiktionary.org/w/api.php', page: 'https://fr.wiktionary.org/wiki/' },
    wikisource: { nom: 'Wikisource', api: 'https://fr.wikisource.org/w/api.php', page: 'https://fr.wikisource.org/wiki/' },
  };

  // Pages de MDN Web Docs vérifiées (mots-clés, chemin, langue de la page).
  const MDN = [
    [['addeventlistener', "ecouteur d'evenement"], 'web/api/eventtarget/addeventlistener', 'fr'],
    [['queryselector'], 'web/api/document/queryselector', 'fr'],
    [['queryselectorall'], 'web/api/document/queryselectorall', 'fr'],
    [['getelementbyid'], 'web/api/document/getelementbyid', 'fr'],
    [['createelement'], 'web/api/document/createelement', 'fr'],
    [['appendchild'], 'web/api/node/appendchild', 'fr'],
    [['textcontent'], 'web/api/node/textcontent', 'fr'],
    [['innerhtml'], 'web/api/element/innerhtml', 'fr'],
    [['classlist'], 'web/api/element/classlist', 'fr'],
    [['settimeout'], 'web/api/window/settimeout', 'fr'],
    [['setinterval', 'clearinterval'], 'web/api/window/setinterval', 'en'],
    [['requestanimationframe'], 'web/api/window/requestanimationframe', 'fr'],
    [['fetch', 'requete http', 'appeler une api'], 'web/api/fetch_api/using_fetch', 'fr'],
    [['localstorage'], 'web/api/window/localstorage', 'fr'],
    [['json.parse'], 'web/javascript/reference/global_objects/json/parse', 'fr'],
    [['json.stringify'], 'web/javascript/reference/global_objects/json/stringify', 'fr'],
    [['math.random'], 'web/javascript/reference/global_objects/math/random', 'fr'],
    [['math.floor', 'arrondir'], 'web/javascript/reference/global_objects/math/floor', 'fr'],
    [['.map('], 'web/javascript/reference/global_objects/array/map', 'fr'],
    [['.filter('], 'web/javascript/reference/global_objects/array/filter', 'fr'],
    [['foreach'], 'web/javascript/reference/global_objects/array/foreach', 'fr'],
    [['.push('], 'web/javascript/reference/global_objects/array/push', 'fr'],
    [['splice'], 'web/javascript/reference/global_objects/array/splice', 'fr'],
    [['.find('], 'web/javascript/reference/global_objects/array/find', 'fr'],
    [['.sort(', 'trier un tableau'], 'web/javascript/reference/global_objects/array/sort', 'fr'],
    [['tableau javascript', 'array', 'tableau en javascript'], 'web/javascript/reference/global_objects/array', 'fr'],
    [['split('], 'web/javascript/reference/global_objects/string/split', 'fr'],
    [['.replace('], 'web/javascript/reference/global_objects/string/replace', 'fr'],
    [['padstart'], 'web/javascript/reference/global_objects/string/padstart', 'fr'],
    [['new date', 'objet date'], 'web/javascript/reference/global_objects/date', 'fr'],
    [['promise', 'promesse javascript'], 'web/javascript/reference/global_objects/promise', 'fr'],
    [['async', 'await'], 'web/javascript/reference/statements/async_function', 'fr'],
    [['boucle for'], 'web/javascript/reference/statements/for', 'fr'],
    [['boucle while'], 'web/javascript/reference/statements/while', 'fr'],
    [['if else', 'condition en javascript'], 'web/javascript/reference/statements/if...else', 'fr'],
    [['switch case', 'instruction switch'], 'web/javascript/reference/statements/switch', 'fr'],
    [['fonction flechee', 'arrow function'], 'web/javascript/reference/functions/arrow_functions', 'fr'],
    [['classe javascript', 'class '], 'web/javascript/reference/classes', 'fr'],
    [['template literal', 'litteraux de gabarits', 'backtick'], 'web/javascript/reference/template_literals', 'fr'],
    [['canvas'], 'web/api/canvas_api/tutorial/drawing_shapes', 'fr'],
    [['fillrect'], 'web/api/canvasrenderingcontext2d/fillrect', 'fr'],
    [['ctx.arc', 'dessiner un cercle'], 'web/api/canvasrenderingcontext2d/arc', 'fr'],
    [['drawimage'], 'web/api/canvasrenderingcontext2d/drawimage', 'fr'],
    [['filltext'], 'web/api/canvasrenderingcontext2d/filltext', 'fr'],
    [['keyboardevent', 'e.key', 'touche du clavier'], 'web/api/keyboardevent/key', 'fr'],
    [['pointer events', 'pointerdown'], 'web/api/pointer_events', 'fr'],
    [['web audio', 'audiocontext'], 'web/api/web_audio_api', 'fr'],
    [['balise audio', 'htmlaudioelement'], 'web/api/htmlaudioelement', 'fr'],
    [['<input', 'balise input'], 'web/html/reference/elements/input', 'fr'],
    [['<button', 'balise button'], 'web/html/reference/elements/button', 'fr'],
    [['<form', 'balise form'], 'web/html/reference/elements/form', 'fr'],
    [['<select', 'liste deroulante'], 'web/html/reference/elements/select', 'fr'],
    [['<canvas', 'balise canvas'], 'web/html/reference/elements/canvas', 'fr'],
    [['<img', 'balise img'], 'web/html/reference/elements/img', 'fr'],
    [['<table', 'tableau html'], 'web/html/reference/elements/table', 'fr'],
    [['flexbox', 'display: flex', 'display flex'], 'web/css/guides/flexible_box_layout/basic_concepts', 'fr'],
    [['css grid', 'display: grid', 'grille css'], 'web/css/guides/grid_layout/basic_concepts', 'fr'],
    [['position absolute', 'position: absolute', 'position relative'], 'web/css/reference/properties/position', 'fr'],
    [['transform:', 'propriete transform', 'css transform'], 'web/css/reference/properties/transform', 'fr'],
    [['transition:', 'transition css', 'propriete transition'], 'web/css/reference/properties/transition', 'fr'],
    [['keyframes', 'animation css'], 'web/css/reference/at-rules/@keyframes', 'fr'],
    [['media query', 'media queries', '@media'], 'web/css/guides/media_queries/using', 'fr'],
    [['box-shadow'], 'web/css/reference/properties/box-shadow', 'fr'],
    [['border-radius'], 'web/css/reference/properties/border-radius', 'fr'],
    [['linear-gradient', 'degrade css'], 'web/css/reference/values/gradient/linear-gradient', 'fr'],
    [['z-index'], 'web/css/reference/properties/z-index', 'fr'],
    // Ajoutées le 2026-10-05 (chemins vérifiés un par un).
    [['gamepad', 'manette de jeu', 'manette javascript'], 'web/api/gamepad_api/using_the_gamepad_api', 'fr'],
    [['requestfullscreen', 'plein ecran javascript', 'mettre en plein ecran'], 'web/api/element/requestfullscreen', 'fr'],
    [['touchstart', 'touchmove', 'touchend', 'evenements tactiles'], 'web/api/touch_events', 'fr'],
    [['devicepixelratio', 'canvas flou'], 'web/api/window/devicepixelratio', 'fr'],
    [['getcontext'], 'web/api/htmlcanvaselement/getcontext', 'fr'],
    [['strokerect'], 'web/api/canvasrenderingcontext2d/strokerect', 'fr'],
    [['beginpath'], 'web/api/canvasrenderingcontext2d/beginpath', 'fr'],
    [['clearrect'], 'web/api/canvasrenderingcontext2d/clearrect', 'fr'],
    [['globalalpha'], 'web/api/canvasrenderingcontext2d/globalalpha', 'fr'],
    [['ctx.save', 'ctx.restore'], 'web/api/canvasrenderingcontext2d/save', 'fr'],
    [['ctx.rotate', 'tourner une image sur un canvas'], 'web/api/canvasrenderingcontext2d/rotate', 'fr'],
    [['animation canvas', 'animer un canvas'], 'web/api/canvas_api/tutorial/basic_animations', 'fr'],
    [['image dans un canvas', 'image sur un canvas'], 'web/api/canvas_api/tutorial/using_images', 'fr'],
    [['collision', 'collisions', 'detection de collision'], 'games/techniques/2d_collision_detection', 'fr'],
    [['boucle de jeu', 'game loop'], 'games/anatomy', 'fr'],
    [['speechsynthesis', 'synthese vocale', 'faire parler la page'], 'web/api/speechsynthesis', 'en'],
    [['clipboard', 'presse-papiers'], 'web/api/clipboard_api', 'fr'],
    [['formdata'], 'web/api/formdata', 'fr'],
    [['dataset', 'attribut data-'], 'web/api/htmlelement/dataset', 'fr'],
    [['closest('], 'web/api/element/closest', 'fr'],
    [['scrollintoview'], 'web/api/element/scrollintoview', 'fr'],
    [['getboundingclientrect'], 'web/api/element/getboundingclientrect', 'fr'],
    [['intersectionobserver'], 'web/api/intersection_observer_api', 'fr'],
    [['createobjecturl', 'telecharger un fichier en javascript'], 'web/api/url/createobjecturl_static', 'fr'],
    [['filereader', 'lire un fichier en javascript'], 'web/api/filereader', 'fr'],
    [['navigator.vibrate', 'faire vibrer le telephone'], 'web/api/navigator/vibrate', 'fr'],
    [['geolocation', 'geolocalisation'], 'web/api/geolocation_api', 'fr'],
    [['sessionstorage'], 'web/api/window/sessionstorage', 'fr'],
    [['performance.now'], 'web/api/performance/now', 'fr'],
    [['.play()', 'audio.play'], 'web/api/htmlmediaelement/play', 'fr'],
    [['.remove()'], 'web/api/element/remove', 'fr'],
    [['setattribute'], 'web/api/element/setattribute', 'fr'],
    [['.style.'], 'web/api/htmlelement/style', 'fr'],
    [['prompt('], 'web/api/window/prompt', 'fr'],
    [['alert('], 'web/api/window/alert', 'fr'],
    [['array.from'], 'web/javascript/reference/global_objects/array/from', 'fr'],
    [['.reduce('], 'web/javascript/reference/global_objects/array/reduce', 'fr'],
    [['.includes('], 'web/javascript/reference/global_objects/array/includes', 'fr'],
    [['.some('], 'web/javascript/reference/global_objects/array/some', 'fr'],
    [['.every('], 'web/javascript/reference/global_objects/array/every', 'fr'],
    [['.join('], 'web/javascript/reference/global_objects/array/join', 'fr'],
    [['.slice('], 'web/javascript/reference/global_objects/array/slice', 'fr'],
    [['indexof'], 'web/javascript/reference/global_objects/array/indexof', 'fr'],
    [['findindex'], 'web/javascript/reference/global_objects/array/findindex', 'fr'],
    [['.fill('], 'web/javascript/reference/global_objects/array/fill', 'fr'],
    [['tolowercase', 'touppercase'], 'web/javascript/reference/global_objects/string/tolowercase', 'fr'],
    [['.trim('], 'web/javascript/reference/global_objects/string/trim', 'fr'],
    [['.repeat('], 'web/javascript/reference/global_objects/string/repeat', 'fr'],
    [["longueur d'une chaine"], 'web/javascript/reference/global_objects/string/length', 'fr'],
    [['parseint', 'parsefloat', 'convertir en nombre'], 'web/javascript/reference/global_objects/parseint', 'fr'],
    [['tofixed', 'chiffres apres la virgule'], 'web/javascript/reference/global_objects/number/tofixed', 'fr'],
    [['math.max', 'math.min'], 'web/javascript/reference/global_objects/math/max', 'fr'],
    [['math.abs', 'valeur absolue'], 'web/javascript/reference/global_objects/math/abs', 'fr'],
    [['math.sqrt', 'racine carree'], 'web/javascript/reference/global_objects/math/sqrt', 'fr'],
    [['math.sin', 'math.cos', 'trigonometrie'], 'web/javascript/reference/global_objects/math/sin', 'fr'],
    [['math.atan2', 'angle entre deux points'], 'web/javascript/reference/global_objects/math/atan2', 'fr'],
    [['math.hypot', 'distance entre deux points'], 'web/javascript/reference/global_objects/math/hypot', 'fr'],
    [['math.round'], 'web/javascript/reference/global_objects/math/round', 'fr'],
    [['new set', 'objet set'], 'web/javascript/reference/global_objects/set', 'fr'],
    [['new map', 'objet map'], 'web/javascript/reference/global_objects/map', 'fr'],
    [['object.keys', 'object.entries'], 'web/javascript/reference/global_objects/object/keys', 'fr'],
    [['tolocaledatestring', 'tolocaletimestring', 'date en francais'], 'web/javascript/reference/global_objects/date/tolocaledatestring', 'fr'],
    [['try catch', 'try...catch', 'attraper une erreur'], 'web/javascript/reference/statements/try...catch', 'fr'],
    [['let et const', 'mot cle let'], 'web/javascript/reference/statements/let', 'fr'],
    [['mot cle const', 'constante javascript'], 'web/javascript/reference/statements/const', 'fr'],
    [['ternaire', 'operateur ternaire'], 'web/javascript/reference/operators/conditional_operator', 'fr'],
    [['destructuration', 'affecter par decomposition'], 'web/javascript/reference/operators/destructuring', 'fr'],
    [['spread', 'syntaxe de decomposition'], 'web/javascript/reference/operators/spread_syntax', 'fr'],
    [['===', 'triple egal', 'egalite stricte'], 'web/javascript/reference/operators/strict_equality', 'fr'],
    [['modulo', 'reste de la division'], 'web/javascript/reference/operators/remainder', 'fr'],
    [['expression reguliere', 'expressions regulieres', 'regex', 'regexp'], 'web/javascript/guide/regular_expressions', 'fr'],
    [['for...of', 'boucle for of'], 'web/javascript/reference/statements/for...of', 'fr'],
    [['json'], 'web/javascript/reference/global_objects/json', 'fr'],
    [['variables css', 'var(--', 'proprietes personnalisees'], 'web/css/guides/cascading_variables/using_custom_properties', 'fr'],
    [['opacity', 'transparence css'], 'web/css/reference/properties/opacity', 'fr'],
    [['cursor:', 'curseur css'], 'web/css/reference/properties/cursor', 'fr'],
    [['font-family', 'police css', 'changer la police'], 'web/css/reference/properties/font-family', 'fr'],
    [['overflow'], 'web/css/reference/properties/overflow', 'fr'],
    [['clamp('], 'web/css/reference/values/clamp', 'fr'],
    [['aspect-ratio'], 'web/css/reference/properties/aspect-ratio', 'fr'],
    [['object-fit'], 'web/css/reference/properties/object-fit', 'fr'],
    [['gap:', 'propriete gap'], 'web/css/reference/properties/gap', 'fr'],
    [['prefers-color-scheme', 'mode sombre css', 'theme sombre css'], 'web/css/reference/at-rules/@media/prefers-color-scheme', 'fr'],
    [['animation:', 'propriete animation'], 'web/css/reference/properties/animation', 'fr'],
    [['background:', 'couleur de fond', 'image de fond'], 'web/css/reference/properties/background', 'fr'],
    [['margin', 'marge exterieure'], 'web/css/reference/properties/margin', 'fr'],
    [['padding', 'marge interieure'], 'web/css/reference/properties/padding', 'fr'],
    [['font-size', 'taille du texte'], 'web/css/reference/properties/font-size', 'fr'],
    [['text-align', 'centrer du texte', 'centrer le texte'], 'web/css/reference/properties/text-align', 'fr'],
    [['couleurs css', 'code couleur', 'rgb(', 'hsl('], 'web/css/reference/values/color_value', 'fr'],
    [['<a ', 'balise a', 'faire un lien'], 'web/html/reference/elements/a', 'fr'],
    [['<dialog', 'fenetre modale'], 'web/html/reference/elements/dialog', 'fr'],
    [['<details', 'balise details'], 'web/html/reference/elements/details', 'fr'],
    [['<label', 'balise label'], 'web/html/reference/elements/label', 'fr'],
    [['<textarea'], 'web/html/reference/elements/textarea', 'fr'],
    [['<video', 'balise video', 'mettre une video'], 'web/html/reference/elements/video', 'fr'],
    [['type="range"', 'type=range', 'curseur html'], 'web/html/reference/elements/input/range', 'fr'],
    [['type="color"', 'selecteur de couleur'], 'web/html/reference/elements/input/color', 'fr'],
    [['type="number"', 'type=number'], 'web/html/reference/elements/input/number', 'fr'],
    [['checkbox', 'case a cocher', 'cases a cocher'], 'web/html/reference/elements/input/checkbox', 'fr'],
    [['<ul', 'liste a puces'], 'web/html/reference/elements/ul', 'fr'],
    [['svg'], 'web/svg/tutorials/svg_from_scratch/getting_started', 'fr'],
    [['aria-label', 'aria'], 'web/accessibility/aria/reference/attributes/aria-label', 'fr'],
    [['accessibilite'], 'web/accessibility', 'fr'],
    [['validation de formulaire', 'valider un formulaire', 'verifier un formulaire'], 'learn_web_development/extensions/forms/form_validation', 'fr'],
    [['champ obligatoire', 'attribut required'], 'web/html/reference/attributes/required', 'fr'],
    [['is not defined'], 'web/javascript/reference/errors/not_defined', 'fr'],
    [['is not a function'], 'web/javascript/reference/errors/not_a_function', 'fr'],
    [['unexpected token'], 'web/javascript/reference/errors/unexpected_token', 'fr'],
    [['missing ] after element list'], 'web/javascript/reference/errors/missing_bracket_after_list', 'fr'],
    [['mon code ne marche pas', 'deboguer', 'debugger'], 'learn_web_development/core/scripting/what_went_wrong', 'fr'],
  ];
  const MDN_BRUT = {
    fr: 'https://raw.githubusercontent.com/mdn/translated-content/main/files/fr/',
    en: 'https://raw.githubusercontent.com/mdn/content/main/files/en-us/',
  };

  const sansAccents = (t) => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const enc = encodeURIComponent;

  async function lire(url, format, ms) {
    const arret = new AbortController();
    const minuteur = setTimeout(() => arret.abort(), ms || 9000);
    try {
      const r = await fetch(url, { signal: arret.signal, credentials: 'omit' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return format === 'texte' ? await r.text() : await r.json();
    } finally {
      clearTimeout(minuteur);
    }
  }

  // Lit du HTML venu d'internet sans jamais l'exécuter (ni scripts, ni images).
  function texteDuHTML(html, garderCode) {
    const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
    doc.querySelectorAll('script, style, table, sup, .mw-editsection, .noprint, .ws-noexport, .reference').forEach((e) => e.remove());
    if (garderCode) doc.querySelectorAll('pre').forEach((p) => { p.textContent = '\n```\n' + p.textContent.trim() + '\n```\n'; });
    doc.querySelectorAll('br').forEach((b) => b.replaceWith('\n'));
    doc.querySelectorAll('p, div, li, h1, h2, h3, h4, h5, h6, blockquote, pre, dd, dt').forEach((b) => b.append('\n'));
    return (doc.body.textContent || '').replace(/[ \t ]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  const lienWiki = (w, titre) => w.page + enc(String(titre).replace(/ /g, '_'));

  // Les mots importants d'une question : « C'est quoi un trou noir ? » → « trou noir ».
  function motsCles(question) {
    let t = String(question).replace(/[?!.;:«»"]/g, ' ').replace(/\s+/g, ' ').trim();
    const debuts = /^(peux-tu |tu peux |est-ce que tu peux )?(cherche(r)?( sur internet| sur le web)?( des infos| des informations)?( sur)?|recherche( sur)?|dis-moi|explique(-moi)?|raconte(-moi)?|parle(-moi)? (de|du|des)|donne(-moi)? (la )?definition (de|du|d')|c'est quoi|c est quoi|qu'est-ce que c'est( que)?|qu'est-ce qu(e|')|qu est ce que|qui (est|etait|était|a (invente|inventé|cree|créé|decouvert|découvert))|que (veut dire|signifie)|quel(le)?s? (est|sont|etait|était)|comment (fonctionne|marche)|pourquoi|combien|quand|où|ou est)\s*/i;
    for (let i = 0; i < 3; i++) t = t.replace(debuts, '').trim();
    t = t.replace(/^(le |la |les )?mots? /i, '').trim();
    t = t.replace(/\b(stp|s'il te pla[iî]t|sur internet|sur le web|sur wikip[ée]dia|sur vikidia)\b/gi, '').trim();
    t = t.replace(/^(le |la |les |l'|un |une |des |du |de |d')/i, '').trim();
    return t || String(question).trim();
  }

  async function chercherWiki(cle, requete, options) {
    const w = WIKIS[cle];
    const o = Object.assign({ n: 1, caracteres: 1200, intro: true }, options);
    const s = await lire(`${w.api}?action=query&list=search&srsearch=${enc(requete)}&srlimit=${o.n}&srprop=&format=json&origin=*`);
    const titres = ((s.query && s.query.search) || []).map((r) => r.title);
    if (!titres.length) return [];
    const e = await lire(`${w.api}?action=query&prop=extracts${o.intro ? '&exintro=1' : ''}&explaintext=1&exchars=${o.caracteres}&exlimit=${o.n}&redirects=1&titles=${enc(titres.join('|'))}&format=json&origin=*`);
    const pages = Object.values((e.query && e.query.pages) || {}).filter((p) => p.extract && p.extract.trim());
    // « == Étymologie == » → « Étymologie : »
    const propre = (t) => t.replace(/^\s*=+\s*([^=\n]+?)\s*=+\s*$/gm, '$1 :').replace(/\n{3,}/g, '\n\n').trim();
    return pages.map((p) => ({ source: w.nom, titre: p.title, texte: propre(p.extract), lien: lienWiki(w, p.title) }));
  }

  // Un mot compte seulement s'il est entier (« transformer » ne doit pas trouver « transform »).
  function motEntier(texte, mot) {
    if (!/^[a-z0-9' -]+$/.test(mot)) return texte.includes(mot);
    let i = texte.indexOf(mot);
    while (i >= 0) {
      const avant = texte[i - 1], apres = texte[i + mot.length];
      if (!(avant && /[a-z0-9]/.test(avant)) && !(apres && /[a-z0-9]/.test(apres))) return true;
      i = texte.indexOf(mot, i + 1);
    }
    return false;
  }

  function pagesMDN(texte) {
    const t = sansAccents(texte);
    return MDN.map((e) => [e, e[0].reduce((n, m) => n + (motEntier(t, m) ? m.length : 0), 0)])
      .filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1]).map((x) => x[0]);
  }

  function nettoyerMDN(md, max) {
    let t = md.replace(/^---[\s\S]*?---\s*/, '');
    const fin = t.search(/\n## (Spécifications|Specifications|Compatibilité|Browser compatibility|Voir aussi|See also)/);
    if (fin > 0) t = t.slice(0, fin);
    t = t.replace(/\{\{\s*(?:domxref|jsxref|cssxref|htmlelement|glossary|httpheader|svgelement|domxref)\(\s*"([^"]+)"[^}]*\)\s*\}\}/gi, '$1')
      .replace(/\{\{[^}]*\}\}/g, '')
      .replace(/^> \[!\w+\]\s*$/gim, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/```js[-\w ]*/g, '```js')
      .replace(/\n{3,}/g, '\n\n').trim();
    return t.length > max ? t.slice(0, max) + '…' : t;
  }

  async function chercherMDN(texte, max) {
    const e = pagesMDN(texte)[0];
    if (!e) return [];
    const md = await lire(MDN_BRUT[e[2]] + e[1] + '/index.md', 'texte');
    const titre = ((md.match(/^title:\s*"?(.+?)"?\s*$/m) || [])[1] || e[1]).replace(/\\"/g, '"');
    const slug = (md.match(/^slug:\s*(.+)$/m) || [])[1] || '';
    return [{
      source: 'MDN Web Docs', titre, texte: nettoyerMDN(md, max || 2500),
      lien: 'https://developer.mozilla.org/' + (e[2] === 'fr' ? 'fr' : 'en-US') + '/docs/' + slug.trim(),
    }];
  }

  async function chercherStackOverflow(erreur, max) {
    const q = String(erreur).replace(/^.*?«\s*/, '').replace(/\s*».*$/, '').replace(/^Uncaught\s+/i, '').slice(0, 140);
    const s = await lire(`https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&accepted=True&q=${enc(q)}&site=stackoverflow&pagesize=3`);
    const question = (s.items || []).find((i) => i.accepted_answer_id && /^https:\/\/stackoverflow\.com\//.test(i.link));
    if (!question) return [];
    const a = await lire(`https://api.stackexchange.com/2.3/answers/${question.accepted_answer_id}?site=stackoverflow&filter=withbody`);
    const corps = a.items && a.items[0] && a.items[0].body;
    if (!corps) return [];
    const texte = texteDuHTML(corps, true);
    return [{
      source: 'Stack Overflow', titre: texteDuHTML(question.title), lien: question.link,
      texte: texte.length > (max || 1800) ? texte.slice(0, max || 1800) + '…' : texte,
    }];
  }

  // --- Pour le Laboratoire : trouver des textes entiers à faire lire au petit cerveau ---
  async function listerTextes(cle, requete, n) {
    const w = WIKIS[cle];
    const s = await lire(`${w.api}?action=query&list=search&srsearch=${enc(requete)}&srlimit=${n || 8}&srprop=snippet&format=json&origin=*`);
    return ((s.query && s.query.search) || []).map((r) => ({ titre: r.title, extrait: texteDuHTML(r.snippet) }));
  }

  async function texteComplet(cle, titre, max) {
    const w = WIKIS[cle];
    const limite = max || 40000;
    if (cle === 'wikisource') {
      const r = await lire(`${w.api}?action=parse&page=${enc(titre)}&prop=text&formatversion=2&redirects=1&format=json&origin=*`);
      if (r.error) throw new Error(r.error.info || r.error.code);
      const doc = new DOMParser().parseFromString(r.parse.text, 'text/html');
      doc.querySelectorAll('script, style, table, sup, .mw-editsection, .noprint, .ws-noexport, .reference').forEach((e) => e.remove());
      const texte = texteDuHTML(r.parse.text);
      // Une page faite surtout de liens est un sommaire (plusieurs œuvres ou éditions) :
      // on propose ses liens au lieu d'ajouter la liste elle-même.
      const ancres = Array.from(doc.querySelectorAll('a[href^="/wiki/"]')).filter((a) => !a.getAttribute('href').includes(':'));
      const texteDesLiens = ancres.reduce((n, a) => n + a.textContent.trim().length, 0);
      const sommaire = ancres.length >= 2 && texteDesLiens / Math.max(1, texte.length) >= 0.25;
      const liens = sommaire
        ? Array.from(new Set(ancres
          .map((a) => decodeURIComponent(a.getAttribute('href').slice(6).split('#')[0]).replace(/_/g, ' '))
          .filter((t) => t && t !== r.parse.title && t !== titre))).slice(0, 15)
        : [];
      return { titre: r.parse.title, texte: texte.slice(0, limite), liens, lien: lienWiki(w, r.parse.title) };
    }
    const e = await lire(`${w.api}?action=query&prop=extracts&explaintext=1&redirects=1&titles=${enc(titre)}&format=json&origin=*`);
    const page = Object.values((e.query && e.query.pages) || {})[0];
    if (!page || !page.extract) throw new Error('Texte introuvable');
    const propre = page.extract.replace(/\n=+ [^=\n]+ =+\n/g, '\n\n').replace(/\n{3,}/g, '\n\n').trim();
    return { titre: page.title, texte: propre.slice(0, limite), liens: [], lien: lienWiki(w, page.title) };
  }

  return { WIKIS, motsCles, chercherWiki, chercherMDN, pagesMDN, chercherStackOverflow, listerTextes, texteComplet, sansAccents };
}

const RECHERCHE = installerRecherche();
