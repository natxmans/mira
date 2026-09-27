/*
 * cerveau.js — le cerveau de ton IA, écrit de zéro (aucune bibliothèque).
 *
 * C'est un « Transformer », la même famille de réseaux de neurones que les
 * grandes IA comme Claude ou ChatGPT, mais en tout petit :
 *   1. elle lit le texte lettre par lettre ;
 *   2. elle transforme chaque lettre en une liste de nombres (un « plongement ») ;
 *   3. grâce à l'« attention », chaque lettre regarde les lettres d'avant ;
 *   4. à la fin, elle donne une probabilité pour chaque lettre qui pourrait venir ensuite.
 *
 * Pour apprendre, on lui montre un morceau de texte et elle devine chaque lettre
 * suivante. On mesure son erreur (la « perte »), puis on calcule dans quel sens
 * tourner chacun de ses petits boutons (les « paramètres ») pour qu'elle se trompe
 * un peu moins : c'est la rétropropagation. On recommence des milliers de fois.
 *
 * Tout est rangé dans la fonction installerCerveau() pour pouvoir l'envoyer telle
 * quelle dans un « Worker » : un ouvrier qui calcule en arrière-plan sans bloquer la page.
 */
function installerCerveau() {
  'use strict';

  // Type de tableau pour tous les nombres : Float32 est rapide, Float64 est précis (pour les tests).
  let Tableau = Float32Array;

  // ---------------------------------------------------------------------------
  // L'alphabet : toutes les lettres que l'IA connaît. Chaque lettre a un numéro.
  // ---------------------------------------------------------------------------
  const ALPHABET = '\n !"#%&\'()*+,-./0123456789:;<=>?@' +
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz' +
    'àâäçéèêëîïôöùûüÿœæÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŒÆ«»€';
  const NUMERO = new Map();
  for (let i = 0; i < ALPHABET.length; i++) NUMERO.set(ALPHABET[i], i);

  // Remplace les caractères « bizarres » par des équivalents connus, et enlève les autres.
  function nettoyer(texte) {
    const t = String(texte)
      .replace(/\r\n?/g, '\n')
      .replace(/[‘’ʼ´`]/g, "'")
      .replace(/[“”„]/g, '"')
      .replace(/[–—−]/g, '-')
      .replace(/…/g, '...')
      .replace(/ſ/g, 's') // le « s long » des vieux livres
      .replace(/[\t   ]/g, ' ');
    let sortie = '';
    for (const c of t) {
      if (NUMERO.has(c)) { sortie += c; continue; }
      const sansAccent = c.normalize('NFD').replace(/[̀-ͯ]/g, '');
      if (sansAccent.length === 1 && NUMERO.has(sansAccent)) sortie += sansAccent;
    }
    return sortie;
  }

  // Texte -> liste de numéros (ce que l'IA lit vraiment).
  function encoder(texte) {
    const propre = nettoyer(texte);
    const ids = new Uint8Array(propre.length);
    for (let i = 0; i < propre.length; i++) ids[i] = NUMERO.get(propre[i]);
    return ids;
  }

  function decoder(ids) {
    let s = '';
    for (const i of ids) s += ALPHABET[i];
    return s;
  }

  // ---------------------------------------------------------------------------
  // Le hasard. On le fabrique nous-mêmes pour pouvoir le « rejouer » avec une graine.
  // ---------------------------------------------------------------------------
  function creerHasard(graine) {
    let a = graine >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Un nombre au hasard qui suit une « courbe en cloche » (la plupart proches de 0).
  function gauss(hasard) {
    let u = 0;
    while (u === 0) u = hasard();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * hasard());
  }

  // ---------------------------------------------------------------------------
  // Les briques de calcul. Chacune a un « aller » (calculer) et un « retour »
  // (dire comment l'erreur change si on bouge un peu ses entrées et ses paramètres).
  // ---------------------------------------------------------------------------

  // Le calcul qui prend presque tout le temps : S[r][c] += somme sur k de A[r][k] × B[c][k].
  // A a R lignes de K nombres, B a C lignes de K nombres. On calcule 4 lignes × 4 colonnes
  // à la fois : l'ordinateur garde ainsi les nombres « sous la main » et va 5 fois plus vite.
  function multiplier(A, R, K, B, C, S) {
    let r = 0;
    for (; r + 3 < R; r += 4) {
      const a0 = r * K, a1 = a0 + K, a2 = a1 + K, a3 = a2 + K;
      let c = 0;
      for (; c + 3 < C; c += 4) {
        const b0 = c * K, b1 = b0 + K, b2 = b1 + K, b3 = b2 + K;
        let s00 = 0, s01 = 0, s02 = 0, s03 = 0, s10 = 0, s11 = 0, s12 = 0, s13 = 0;
        let s20 = 0, s21 = 0, s22 = 0, s23 = 0, s30 = 0, s31 = 0, s32 = 0, s33 = 0;
        for (let k = 0; k < K; k++) {
          const p0 = A[a0 + k], p1 = A[a1 + k], p2 = A[a2 + k], p3 = A[a3 + k];
          const q0 = B[b0 + k], q1 = B[b1 + k], q2 = B[b2 + k], q3 = B[b3 + k];
          s00 += p0 * q0; s01 += p0 * q1; s02 += p0 * q2; s03 += p0 * q3;
          s10 += p1 * q0; s11 += p1 * q1; s12 += p1 * q2; s13 += p1 * q3;
          s20 += p2 * q0; s21 += p2 * q1; s22 += p2 * q2; s23 += p2 * q3;
          s30 += p3 * q0; s31 += p3 * q1; s32 += p3 * q2; s33 += p3 * q3;
        }
        let s = r * C + c;
        S[s] += s00; S[s + 1] += s01; S[s + 2] += s02; S[s + 3] += s03; s += C;
        S[s] += s10; S[s + 1] += s11; S[s + 2] += s12; S[s + 3] += s13; s += C;
        S[s] += s20; S[s + 1] += s21; S[s + 2] += s22; S[s + 3] += s23; s += C;
        S[s] += s30; S[s + 1] += s31; S[s + 2] += s32; S[s + 3] += s33;
      }
      for (; c < C; c++) {
        const b0 = c * K;
        let s0 = 0, s1 = 0, s2 = 0, s3 = 0;
        for (let k = 0; k < K; k++) {
          const q = B[b0 + k];
          s0 += A[a0 + k] * q; s1 += A[a1 + k] * q; s2 += A[a2 + k] * q; s3 += A[a3 + k] * q;
        }
        S[r * C + c] += s0; S[(r + 1) * C + c] += s1; S[(r + 2) * C + c] += s2; S[(r + 3) * C + c] += s3;
      }
    }
    for (; r < R; r++) {
      const a0 = r * K;
      for (let c = 0; c < C; c++) {
        const b0 = c * K;
        let s = 0;
        for (let k = 0; k < K; k++) s += A[a0 + k] * B[b0 + k];
        S[r * C + c] += s;
      }
    }
  }

  // Retourne un tableau de R lignes × C colonnes : les lignes deviennent des colonnes.
  function transposer(A, R, C) {
    const t = new Tableau(R * C);
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) t[c * R + r] = A[r * C + c];
    return t;
  }

  // Couche linéaire : chaque neurone de sortie fait une somme pondérée des entrées, plus un biais.
  // x a N lignes de `entree` nombres ; W a une ligne de poids par neurone de sortie.
  function lineaire(x, N, entree, sortie, W, b) {
    const y = new Tableau(N * sortie);
    for (let n = 0; n < N; n++) y.set(b, n * sortie);
    multiplier(x, N, entree, W, sortie, y);
    return y;
  }

  // Retour de la couche linéaire : ajoute les gradients de W et b, renvoie le gradient de x.
  function lineaireRetour(x, dy, N, entree, sortie, W, dW, db) {
    for (let n = 0; n < N; n++) for (let o = 0; o < sortie; o++) db[o] += dy[n * sortie + o];
    multiplier(transposer(dy, N, sortie), sortie, N, transposer(x, N, entree), entree, dW);
    const dx = new Tableau(N * entree);
    multiplier(dy, N, sortie, transposer(W, sortie, entree), entree, dx);
    return dx;
  }

  // Normalisation : remet chaque ligne à une moyenne de 0 et un écart de 1, puis applique gain et biais.
  function normaliser(x, N, d, gain, biais) {
    const y = new Tableau(N * d), xh = new Tableau(N * d), inv = new Tableau(N);
    for (let n = 0; n < N; n++) {
      const o = n * d;
      let moy = 0;
      for (let i = 0; i < d; i++) moy += x[o + i];
      moy /= d;
      let vari = 0;
      for (let i = 0; i < d; i++) { const e = x[o + i] - moy; vari += e * e; }
      const r = 1 / Math.sqrt(vari / d + 1e-5);
      inv[n] = r;
      for (let i = 0; i < d; i++) {
        const h = (x[o + i] - moy) * r;
        xh[o + i] = h;
        y[o + i] = h * gain[i] + biais[i];
      }
    }
    return { y, xh, inv };
  }

  function normaliserRetour(dy, cache, N, d, gain, dGain, dBiais) {
    const { xh, inv } = cache;
    const dx = new Tableau(N * d);
    for (let n = 0; n < N; n++) {
      const o = n * d;
      let s1 = 0, s2 = 0;
      for (let i = 0; i < d; i++) {
        const g = dy[o + i], h = xh[o + i], dh = g * gain[i];
        dGain[i] += g * h;
        dBiais[i] += g;
        s1 += dh;
        s2 += dh * h;
      }
      s1 /= d; s2 /= d;
      for (let i = 0; i < d; i++) dx[o + i] = inv[n] * (dy[o + i] * gain[i] - s1 - xh[o + i] * s2);
    }
    return dx;
  }

  // L'attention : chaque lettre pose une « question » (q), chaque lettre d'avant montre une
  // « étiquette » (k) et une « valeur » (v). Plus la question ressemble à l'étiquette, plus
  // la lettre prend de la valeur de l'autre. Elle ne peut regarder que vers le passé.
  // qkv contient q, k et v côte à côte : N lignes de 3·d nombres. H têtes regardent en parallèle.
  function attention(qkv, B, T, d, H) {
    const hs = d / H, echelle = 1 / Math.sqrt(hs), d3 = 3 * d;
    const sortie = new Tableau(B * T * d);
    const poids = new Tableau(B * H * T * T);
    for (let b = 0; b < B; b++) {
      for (let h = 0; h < H; h++) {
        for (let t = 0; t < T; t++) {
          const qo = (b * T + t) * d3 + h * hs;
          const ao = ((b * H + h) * T + t) * T;
          let max = -Infinity;
          for (let t2 = 0; t2 <= t; t2++) {
            const ko = (b * T + t2) * d3 + d + h * hs;
            let s = 0;
            for (let k = 0; k < hs; k++) s += qkv[qo + k] * qkv[ko + k];
            s *= echelle;
            poids[ao + t2] = s;
            if (s > max) max = s;
          }
          let somme = 0;
          for (let t2 = 0; t2 <= t; t2++) {
            const e = Math.exp(poids[ao + t2] - max);
            poids[ao + t2] = e;
            somme += e;
          }
          const oo = (b * T + t) * d + h * hs;
          for (let t2 = 0; t2 <= t; t2++) {
            const a = poids[ao + t2] / somme;
            poids[ao + t2] = a;
            const vo = (b * T + t2) * d3 + 2 * d + h * hs;
            for (let k = 0; k < hs; k++) sortie[oo + k] += a * qkv[vo + k];
          }
        }
      }
    }
    return { sortie, poids };
  }

  function attentionRetour(dSortie, qkv, poids, B, T, d, H) {
    const hs = d / H, echelle = 1 / Math.sqrt(hs), d3 = 3 * d;
    const dqkv = new Tableau(B * T * d3);
    const dPoids = new Float64Array(T);
    for (let b = 0; b < B; b++) {
      for (let h = 0; h < H; h++) {
        for (let t = 0; t < T; t++) {
          const qo = (b * T + t) * d3 + h * hs;
          const ao = ((b * H + h) * T + t) * T;
          const oo = (b * T + t) * d + h * hs;
          for (let t2 = 0; t2 <= t; t2++) {
            const vo = (b * T + t2) * d3 + 2 * d + h * hs;
            const a = poids[ao + t2];
            let s = 0;
            for (let k = 0; k < hs; k++) {
              s += dSortie[oo + k] * qkv[vo + k];
              dqkv[vo + k] += a * dSortie[oo + k];
            }
            dPoids[t2] = s;
          }
          let somme = 0;
          for (let t2 = 0; t2 <= t; t2++) somme += poids[ao + t2] * dPoids[t2];
          for (let t2 = 0; t2 <= t; t2++) {
            const ds = poids[ao + t2] * (dPoids[t2] - somme) * echelle;
            if (ds === 0) continue;
            const ko = (b * T + t2) * d3 + d + h * hs;
            for (let k = 0; k < hs; k++) {
              dqkv[qo + k] += ds * qkv[ko + k];
              dqkv[ko + k] += ds * qkv[qo + k];
            }
          }
        }
      }
    }
    return dqkv;
  }

  // ---------------------------------------------------------------------------
  // Un paramètre = un paquet de petits boutons à régler, avec la mémoire de l'optimiseur Adam.
  // ---------------------------------------------------------------------------
  function Parametre(nom, taille, ecartType, hasard, valeur) {
    this.nom = nom;
    this.w = new Tableau(taille); // les valeurs
    this.g = new Tableau(taille); // le gradient : dans quel sens tourner chaque bouton
    this.m = new Tableau(taille); // mémoire d'Adam (la direction moyenne)
    this.v = new Tableau(taille); // mémoire d'Adam (la force moyenne)
    if (valeur !== undefined) this.w.fill(valeur);
    else for (let i = 0; i < taille; i++) this.w[i] = gauss(hasard) * ecartType;
  }

  // ---------------------------------------------------------------------------
  // Le cerveau complet.
  //   V = nombre de lettres de l'alphabet, d = taille des plongements,
  //   L = nombre de couches, H = têtes d'attention, T = combien de lettres elle voit à la fois.
  // ---------------------------------------------------------------------------
  class Cerveau {
    constructor(cfg, graine) {
      const { d, L, H, T } = cfg;
      if (d % H !== 0) throw new Error('d doit être divisible par H');
      const V = ALPHABET.length;
      this.cfg = { V, d, L, H, T };
      this.etape = 0;
      this.lettresLues = 0;
      this.tAdam = 0;
      this.params = [];
      const hasard = creerHasard(graine || 1);
      const P = (nom, taille, ecartType, valeur) => {
        const p = new Parametre(nom, taille, ecartType, hasard, valeur);
        this.params.push(p);
        return p;
      };
      const petit = 1 / Math.sqrt(2 * L); // les sorties des couches démarrent petites

      this.wte = P('plongement des lettres', V * d, 0.3);
      this.wpe = P('plongement des positions', T * d, 0.1);
      this.couches = [];
      for (let l = 0; l < L; l++) {
        this.couches.push({
          n1g: P(`couche ${l + 1} norme 1 gain`, d, 0, 1),
          n1b: P(`couche ${l + 1} norme 1 biais`, d, 0, 0),
          wqkv: P(`couche ${l + 1} attention qkv`, d * 3 * d, 1 / Math.sqrt(d)),
          bqkv: P(`couche ${l + 1} attention qkv biais`, 3 * d, 0, 0),
          wo: P(`couche ${l + 1} attention sortie`, d * d, petit / Math.sqrt(d)),
          bo: P(`couche ${l + 1} attention sortie biais`, d, 0, 0),
          n2g: P(`couche ${l + 1} norme 2 gain`, d, 0, 1),
          n2b: P(`couche ${l + 1} norme 2 biais`, d, 0, 0),
          w1: P(`couche ${l + 1} réflexion 1`, d * 4 * d, 1 / Math.sqrt(d)),
          b1: P(`couche ${l + 1} réflexion 1 biais`, 4 * d, 0, 0),
          w2: P(`couche ${l + 1} réflexion 2`, 4 * d * d, petit / Math.sqrt(4 * d)),
          b2: P(`couche ${l + 1} réflexion 2 biais`, d, 0, 0),
        });
      }
      this.nfg = P('norme finale gain', d, 0, 1);
      this.nfb = P('norme finale biais', d, 0, 0);
      this.wout = P('sortie', d * V, 0.02);
      this.bout = P('sortie biais', V, 0, 0);
    }

    get nbParametres() {
      let n = 0;
      for (const p of this.params) n += p.w.length;
      return n;
    }

    // L'aller : B morceaux de texte de T lettres -> une prédiction pour chaque position.
    // Si on donne les « cibles » (les vraies lettres suivantes), on calcule aussi l'erreur.
    avant(idx, B, T, cibles, seulementDerniere) {
      const { V, d, H } = this.cfg;
      const N = B * T;
      const cache = { B, T, N, idx, couches: [] };

      // 1. Chaque lettre devient une liste de d nombres (+ un bonus selon sa position).
      let x = new Tableau(N * d);
      const wte = this.wte.w, wpe = this.wpe.w;
      for (let n = 0; n < N; n++) {
        const lo = idx[n] * d, po = (n % T) * d, xo = n * d;
        for (let i = 0; i < d; i++) x[xo + i] = wte[lo + i] + wpe[po + i];
      }

      // 2. Les couches : attention (regarder le passé) puis réflexion (un petit réseau pour chaque lettre).
      for (const c of this.couches) {
        const k = {};
        k.n1 = normaliser(x, N, d, c.n1g.w, c.n1b.w);
        k.qkv = lineaire(k.n1.y, N, d, 3 * d, c.wqkv.w, c.bqkv.w);
        k.att = attention(k.qkv, B, T, d, H);
        const a = lineaire(k.att.sortie, N, d, d, c.wo.w, c.bo.w);
        const milieu = new Tableau(N * d);
        for (let i = 0; i < milieu.length; i++) milieu[i] = x[i] + a[i];

        k.n2 = normaliser(milieu, N, d, c.n2g.w, c.n2b.w);
        k.avantRelu = lineaire(k.n2.y, N, d, 4 * d, c.w1.w, c.b1.w);
        k.h = new Tableau(k.avantRelu.length);
        for (let i = 0; i < k.h.length; i++) k.h[i] = k.avantRelu[i] > 0 ? k.avantRelu[i] : 0;
        const m = lineaire(k.h, N, 4 * d, d, c.w2.w, c.b2.w);
        x = new Tableau(N * d);
        for (let i = 0; i < x.length; i++) x[i] = milieu[i] + m[i];
        cache.couches.push(k);
      }

      // 3. Un score pour chaque lettre possible de l'alphabet.
      cache.nf = normaliser(x, N, d, this.nfg.w, this.nfb.w);
      if (seulementDerniere) {
        return lineaire(cache.nf.y.subarray((N - 1) * d), 1, d, V, this.wout.w, this.bout.w);
      }
      const scores = lineaire(cache.nf.y, N, d, V, this.wout.w, this.bout.w);
      cache.scores = scores;

      // 4. L'erreur : plus elle donnait une petite probabilité à la bonne lettre, plus l'erreur est grande.
      if (cibles) {
        const dScores = new Tableau(N * V);
        let perte = 0, bonnes = 0;
        for (let n = 0; n < N; n++) {
          const o = n * V;
          let max = -Infinity, meilleure = 0;
          for (let v = 0; v < V; v++) if (scores[o + v] > max) { max = scores[o + v]; meilleure = v; }
          let somme = 0;
          for (let v = 0; v < V; v++) somme += Math.exp(scores[o + v] - max);
          const cible = cibles[n];
          for (let v = 0; v < V; v++) dScores[o + v] = Math.exp(scores[o + v] - max) / somme / N;
          dScores[o + cible] -= 1 / N;
          perte -= scores[o + cible] - max - Math.log(somme);
          if (meilleure === cible) bonnes++;
        }
        cache.perte = perte / N;
        cache.reussite = bonnes / N;
        cache.dScores = dScores;
      }
      return cache;
    }

    // Le retour (rétropropagation) : on remonte le calcul à l'envers pour trouver le gradient
    // de chaque paramètre, c'est-à-dire comment l'erreur change si on le bouge un tout petit peu.
    retour(cache) {
      const { V, d, L, H } = this.cfg;
      const { B, T, N, idx } = cache;
      let dx = lineaireRetour(cache.nf.y, cache.dScores, N, d, V, this.wout.w, this.wout.g, this.bout.g);
      dx = normaliserRetour(dx, cache.nf, N, d, this.nfg.w, this.nfg.g, this.nfb.g);

      for (let l = L - 1; l >= 0; l--) {
        const c = this.couches[l], k = cache.couches[l];
        // x = milieu + réflexion(norme2(milieu))
        const dh = lineaireRetour(k.h, dx, N, 4 * d, d, c.w2.w, c.w2.g, c.b2.g);
        for (let i = 0; i < dh.length; i++) if (k.avantRelu[i] <= 0) dh[i] = 0;
        const dn2 = lineaireRetour(k.n2.y, dh, N, d, 4 * d, c.w1.w, c.w1.g, c.b1.g);
        const dMilieu = normaliserRetour(dn2, k.n2, N, d, c.n2g.w, c.n2g.g, c.n2b.g);
        for (let i = 0; i < dMilieu.length; i++) dMilieu[i] += dx[i];
        // milieu = x + attention(norme1(x))
        const dAtt = lineaireRetour(k.att.sortie, dMilieu, N, d, d, c.wo.w, c.wo.g, c.bo.g);
        const dqkv = attentionRetour(dAtt, k.qkv, k.att.poids, B, T, d, H);
        const dn1 = lineaireRetour(k.n1.y, dqkv, N, d, 3 * d, c.wqkv.w, c.wqkv.g, c.bqkv.g);
        dx = normaliserRetour(dn1, k.n1, N, d, c.n1g.w, c.n1g.g, c.n1b.g);
        for (let i = 0; i < dx.length; i++) dx[i] += dMilieu[i];
      }

      const gte = this.wte.g, gpe = this.wpe.g;
      for (let n = 0; n < N; n++) {
        const lo = idx[n] * d, po = (n % T) * d, xo = n * d;
        for (let i = 0; i < d; i++) {
          gte[lo + i] += dx[xo + i];
          gpe[po + i] += dx[xo + i];
        }
      }
    }

    // Adam : on tourne chaque bouton un tout petit peu dans le bon sens.
    pas(vitesse) {
      let carre = 0;
      for (const p of this.params) for (let i = 0; i < p.g.length; i++) carre += p.g[i] * p.g[i];
      const norme = Math.sqrt(carre);
      const k = norme > 1 ? 1 / norme : 1; // on évite les pas trop brusques
      this.tAdam++;
      const b1 = 0.9, b2 = 0.99;
      const c1 = 1 - Math.pow(b1, this.tAdam), c2 = 1 - Math.pow(b2, this.tAdam);
      for (const p of this.params) {
        const w = p.w, g = p.g, m = p.m, v = p.v;
        for (let i = 0; i < w.length; i++) {
          const gi = g[i] * k;
          m[i] = b1 * m[i] + (1 - b1) * gi;
          v[i] = b2 * v[i] + (1 - b2) * gi * gi;
          w[i] -= vitesse * (m[i] / c1) / (Math.sqrt(v[i] / c2) + 1e-8);
          g[i] = 0;
        }
      }
      return norme;
    }

    // Une étape d'entraînement : B morceaux de texte pris au hasard, aller, retour, ajustement.
    entrainer(donnees, B, vitesse, hasard, lecons) {
      const T = this.cfg.T;
      const idx = new Int32Array(B * T), cibles = new Int32Array(B * T);
      for (let b = 0; b < B; b++) {
        const source = lecons && hasard() < 0.25 ? lecons : donnees;
        const debut = Math.floor(hasard() * (source.length - T - 1));
        for (let t = 0; t < T; t++) {
          idx[b * T + t] = source[debut + t];
          cibles[b * T + t] = source[debut + t + 1];
        }
      }
      const cache = this.avant(idx, B, T, cibles);
      this.retour(cache);
      this.pas(vitesse);
      this.etape++;
      this.lettresLues += B * T;
      return { perte: cache.perte, reussite: cache.reussite };
    }

    // Les scores de la lettre suivante, après une suite de lettres.
    scoresSuivants(ids) {
      const T = Math.min(ids.length, this.cfg.T);
      const idx = Int32Array.from(ids.slice(ids.length - T));
      return this.avant(idx, 1, T, null, true);
    }

    sauvegarder() {
      const tout = new Float32Array(this.nbParametres);
      let o = 0;
      for (const p of this.params) { tout.set(p.w, o); o += p.w.length; }
      return {
        format: 'mon-ia/1', alphabet: ALPHABET, cfg: this.cfg,
        etape: this.etape, lettresLues: this.lettresLues,
        poids: versBase64(new Uint8Array(tout.buffer)),
      };
    }

    static charger(s) {
      if (!s || s.format !== 'mon-ia/1') throw new Error("Ce fichier n'est pas un cerveau de Mira.");
      if (s.alphabet !== ALPHABET) throw new Error("Ce cerveau utilise un autre alphabet.");
      const c = new Cerveau(s.cfg, 1);
      const octets = depuisBase64(s.poids);
      const tout = new Float32Array(octets.buffer, 0, octets.byteLength / 4);
      if (tout.length !== c.nbParametres) throw new Error('Le cerveau sauvegardé est abîmé.');
      let o = 0;
      for (const p of c.params) { p.w.set(tout.subarray(o, o + p.w.length)); o += p.w.length; }
      c.etape = s.etape || 0;
      c.lettresLues = s.lettresLues || 0;
      return c;
    }
  }

  function versBase64(octets) {
    let s = '';
    for (let i = 0; i < octets.length; i += 0x8000) s += String.fromCharCode.apply(null, octets.subarray(i, i + 0x8000));
    return btoa(s);
  }

  function depuisBase64(b64) {
    const s = atob(b64);
    const o = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) o[i] = s.charCodeAt(i);
    return o;
  }

  // Scores -> probabilités (elles sont toutes positives et leur somme fait 1).
  // La « température » règle l'imagination : basse = prudente, haute = farfelue.
  function probabilites(scores, temperature) {
    const t = Math.max(temperature || 1, 0.05);
    let max = -Infinity;
    for (let v = 0; v < scores.length; v++) if (scores[v] > max) max = scores[v];
    const p = new Float64Array(scores.length);
    let somme = 0;
    for (let v = 0; v < scores.length; v++) { p[v] = Math.exp((scores[v] - max) / t); somme += p[v]; }
    for (let v = 0; v < scores.length; v++) p[v] /= somme;
    return p;
  }

  // Tire une lettre au hasard, en suivant les probabilités (comme un dé truqué).
  function choisir(scores, temperature, hasard) {
    const p = probabilites(scores, temperature);
    let r = hasard();
    for (let v = 0; v < p.length; v++) { r -= p[v]; if (r <= 0) return v; }
    return p.length - 1;
  }

  // Pour les tests : passer tous les calculs en haute précision.
  function precision(haute) { Tableau = haute ? Float64Array : Float32Array; }

  return { ALPHABET, nettoyer, encoder, decoder, creerHasard, Cerveau, probabilites, choisir, precision };
}

/*
 * L'ouvrier : il garde le cerveau, l'entraîne en boucle et répond aux demandes de la page
 * (écrire une réponse, montrer ses probabilités, faire une sauvegarde...).
 */
function ouvrier(port, IA) {
  'use strict';
  let cerveau = null, donnees = null, lecons = null;
  let paquet = 8, enCours = false, amorce = '\n', discussion = true;
  let cumulPerte = 0, cumulReussite = 0, nbCumul = 0, dernierEnvoi = 0;
  const hasard = IA.creerHasard((Date.now() ^ 0x5bd1e995) >>> 0);
  const VITESSE_MAX = 0.003;
  const JALONS = [0, 20, 50, 100, 200, 350, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000];

  const envoyer = (m) => port.postMessage(m);

  // Au début on accélère doucement, puis on ralentit un peu pour peaufiner.
  function vitesse(e) {
    return VITESSE_MAX * Math.min(1, (e + 1) / 100) * Math.max(0.3, 1 - e / 15000);
  }

  function estJalon(e) {
    return JALONS.includes(e) || (e > 5000 && e % 1000 === 0);
  }

  // Un texte trop court est répété pour qu'on puisse toujours y piocher des morceaux.
  function etirer(ids) {
    if (!ids.length) return null;
    let r = ids;
    while (r.length < 400) {
      const plus = new Uint8Array(r.length * 2);
      plus.set(r); plus.set(r, r.length);
      r = plus;
    }
    return r;
  }

  function ecrire(texteAmorce, max, temperature, arret, surLettre) {
    const ids = Array.from(IA.encoder(texteAmorce));
    if (!ids.length) ids.push(0);
    let sortie = '';
    for (let i = 0; i < max; i++) {
      const c = IA.choisir(cerveau.scoresSuivants(ids), temperature, hasard);
      const lettre = IA.ALPHABET[c];
      if (arret && lettre === arret) break;
      ids.push(c);
      sortie += lettre;
      if (surLettre) surLettre(lettre);
    }
    return sortie;
  }

  function journal(perte) {
    const texte = discussion ? ecrire(amorce, 140, 0.7, '\n') : ecrire(amorce, 180, 0.8, null);
    envoyer({ type: 'journal', etape: cerveau.etape, perte, texte });
  }

  function infos() {
    envoyer({ type: 'infos', cfg: cerveau.cfg, nbParametres: cerveau.nbParametres, etape: cerveau.etape, lettresLues: cerveau.lettresLues });
  }

  function boucle() {
    if (!enCours) return;
    if (!cerveau || !donnees) { enCours = false; envoyer({ type: 'etat', enCours }); return; }
    const debut = Date.now();
    do {
      const r = cerveau.entrainer(donnees, paquet, vitesse(cerveau.etape), hasard, lecons);
      cumulPerte += r.perte; cumulReussite += r.reussite; nbCumul++;
      if (estJalon(cerveau.etape)) journal(r.perte);
    } while (Date.now() - debut < 60);
    const maintenant = Date.now();
    if (maintenant - dernierEnvoi > 250) {
      envoyer({
        type: 'progres', etape: cerveau.etape, lettresLues: cerveau.lettresLues,
        perte: cumulPerte / nbCumul, reussite: cumulReussite / nbCumul,
        vitesse: nbCumul / ((maintenant - dernierEnvoi) / 1000),
      });
      cumulPerte = 0; cumulReussite = 0; nbCumul = 0; dernierEnvoi = maintenant;
    }
    setTimeout(boucle, 0);
  }

  port.onmessage = (e) => {
    const m = e.data;
    try {
      switch (m.type) {
        case 'creer':
          cerveau = new IA.Cerveau(m.cfg, m.graine);
          paquet = m.paquet || paquet;
          infos();
          if (donnees) journal(null);
          break;
        case 'charger':
          cerveau = IA.Cerveau.charger(m.sauvegarde);
          paquet = m.paquet || paquet;
          infos();
          break;
        case 'textes':
          donnees = etirer(IA.encoder(m.base));
          lecons = m.lecons ? etirer(IA.encoder(m.lecons)) : null;
          amorce = m.amorce || '\n';
          discussion = !!m.discussion;
          break;
        case 'demarrer':
          if (!enCours) {
            enCours = true;
            dernierEnvoi = Date.now(); cumulPerte = 0; cumulReussite = 0; nbCumul = 0;
            envoyer({ type: 'etat', enCours });
            boucle();
          }
          break;
        case 'pause':
          enCours = false;
          envoyer({ type: 'etat', enCours });
          break;
        case 'generer':
          ecrire(m.amorce, m.max || 200, m.temperature, m.arret, (lettre) => envoyer({ type: 'lettre', id: m.id, lettre }));
          envoyer({ type: 'fini', id: m.id });
          break;
        case 'probas': {
          const ids = Array.from(IA.encoder(m.texte));
          if (!ids.length) ids.push(0);
          const p = IA.probabilites(cerveau.scoresSuivants(ids), 1);
          const liste = Array.from(p, (valeur, i) => ({ lettre: IA.ALPHABET[i], valeur }))
            .sort((a, b) => b.valeur - a.valeur).slice(0, m.combien || 10);
          envoyer({ type: 'probas', id: m.id, liste });
          break;
        }
        case 'exporter':
          envoyer({ type: 'sauvegarde', id: m.id, sauvegarde: cerveau.sauvegarder() });
          break;
      }
    } catch (err) {
      envoyer({ type: 'erreur', id: m.id, message: err.message });
    }
  };
  envoyer({ type: 'bonjour' });
}
