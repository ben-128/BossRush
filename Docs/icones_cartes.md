# Icones du jeu — Prompts de generation

> Toutes les icones du jeu partagent un style coherent : gouache epaisse sur fond neutre, lisibles a petite taille (icone de carte ~1cm), formes simples et audacieuses.

## Style commun (prefixer a chaque prompt)

```
Flat icon, gouache paint style on cream paper. Thick visible brushstrokes, opaque paint, matte finish. Simple bold shape, high contrast. No background detail, no shadow, no 3D effect. The icon must read clearly at 64×64 pixels. Raw hand-painted look — NOT digital, NOT vector, NOT smooth gradient. Square format, 1:1 aspect ratio. High resolution PNG with transparent background.
```

---

## 🩸 Blessure / Degats

```
[style commun]
A single thick DROP OF BLOOD — deep crimson red, painted with 2-3 bold gouache strokes. Teardrop shape, pointed at the top, round at the bottom. One small white highlight dot near the top. The drop is slightly asymmetric — hand-painted, not perfectly geometric. Visible brush texture in the paint. Color: deep crimson red (#8B0000 to #DC143C range).
```

## ❤ Vie

```
[style commun]
A single bold HEART shape — warm rose red, painted with thick opaque gouache. Classic stylized heart, slightly asymmetric. One brushstroke for each lobe, meeting at a point at the bottom. Small white highlight on the upper-left lobe. Visible brush texture. Color: warm rose red (#CD5C5C to #E74C3C range). NOT anatomical, NOT cute — sturdy and bold.
```

## 👤 Joueur

```
[style commun]
A simple PERSON SILHOUETTE — head and shoulders, like a universal "user" icon. Painted in warm ochre brown with thick gouache. Round head, triangular shoulders tapering down. No facial features, just the shape. Bold, minimal, immediately readable. Color: warm ochre brown (#8B6914 to #CD9B1D range).
```

## 🃏 Menace (piocher une carte Menace)

```
[style commun]
A single CARD shape with a CLAW SCRATCH across it — the card is a simple rectangle in dark grey/charcoal, slightly tilted. Three diagonal scratch marks in bright red-orange rake across the card face, like an animal clawed through it. The scratches are rough thick paint strokes. The card represents danger/threat. Colors: charcoal card (#333333), red-orange scratches (#FF4500).
```

## 🐾 Invocation (piocher un monstre)

```
[style commun]
A single ANIMAL PAW PRINT — four toe pads and one large heel pad, like a wolf or large cat. Painted in dark forest green with thick gouache. Bold, simple, immediately recognizable as a paw print. Slightly asymmetric, hand-painted feel. The print suggests something emerging/arriving. Color: dark forest green (#2E4E2E to #3B6B3B range).
```

## ⚔ Ordre d'attaque (le monstre attaque)

```
[style commun]
TWO CROSSED SHORT SWORDS or daggers — forming an X shape. Painted in steel grey-blue with thick gouache. Simple blade shapes crossing at the center, with small round pommels at the handles. Bold silhouette, no ornate detail. The icon reads as "combat" or "attack" instantly. Color: steel grey-blue (#4682B4 to #708090 range), handles in dark brown.
```

## ⚡ Actif du Colosse (pouvoir special du boss)

```
[style commun]
A single LIGHTNING BOLT — classic zigzag shape, three segments. Painted in bright amber-gold with thick impasto gouache — visible ridges of paint. High contrast against the transparent background. Bold, angular, aggressive. One small white highlight at the top bend. Color: bright amber-gold (#FFB300 to #FFC107 range) with darker orange edge (#E65100).
```

---

## Notes de production

- Generer chaque icone en 1024×1024 puis reduire a 256×256 et 64×64 pour tester la lisibilite
- Les icones doivent rester lisibles en NOIR ET BLANC (pour impression N&B) — tester en desaturant
- Le fond doit etre transparent (PNG) pour integration sur les cartes
- Chaque icone sera placee dans le meme emplacement fixe sur toutes les cartes qui l'utilisent :
  - 🩸 : bas-gauche (degats infliges)
  - ❤ : bas-droite (points de vie)
  - 🃏🐾⚔⚡ : dans le corps du texte des cartes Menace et sur la fiche boss
