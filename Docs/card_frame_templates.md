# Templates de cadres de carte - Raid Party

> Approche 1 : cadre dur + panneau opaque (style Root/Everdell/MTG).
> Separation nette entre illustration et texte. Maximum de lisibilite.
> Format carte classique : 825x1125px (ratio 63x88mm)

## Philosophie

- **Illustration et texte sont dans des zones SEPAREES** — pas de chevauchement
- **Fond texte opaque** creme/parchemin tres clair — pas de transparence, pas de texture lourde
- **Barre de separation** coloree (couleur du heros) entre illustration et texte
- **Cadre exterieur** fin et discret — ne pas voler l'attention a l'illustration
- **Style** : clean, moderne, avec une touche de motifs tribaux/geometriques dans la barre de separation
- **Reference** : Root (clean, colore), Everdell (elegance organique), Lorcana (cadres nets)

---

## Structure d'une carte (de haut en bas)

```
+------------------------------------------+
|  [CADRE EXTERIEUR - fin, couleur heros]  |
|  +--------------------------------------+|
|  |  BANDEAU TITRE (bg_titre)            ||
|  |  Fond: couleur heros saturee         ||
|  |  Texte: blanc ou creme, gros, bold   ||
|  +--------------------------------------+|
|  |                                      ||
|  |  ILLUSTRATION (bg_image)             ||
|  |  Pas de cadre interne               ||
|  |  L'image remplit toute la zone       ||
|  |                                      ||
|  +--------------------------------------+|
|  |  BARRE SEPARATION (bg_separator)     ||
|  |  Fine bande couleur heros            ||
|  |  Motif geometrique tribal au centre  ||
|  +--------------------------------------+|
|  |                                      ||
|  |  ZONE TEXTE (bg_texte)              ||
|  |  Fond: creme opaque tres clair       ||
|  |  Texte: brun fonce, lisible          ||
|  |                                      ||
|  +--------------------------------------+|
|  |  BARRE STATS (bg_stats)             ||
|  |  Icones PV/degats/competence         ||
|  +--------------------------------------+|
+------------------------------------------+
```

---

## 1. Cadre exterieur (bg_cadre)

**Dimensions** : 825 x 1125px (carte entiere)
**Role** : Entoure toute la carte, donne l'identite couleur du heros.

### Prompt
```
Clean flat colored card border frame on transparent background.
A thin elegant border (~15px wide) in {{COULEUR_HERO}} color.
Slightly rounded corners (radius ~20px).
The INTERIOR is COMPLETELY TRANSPARENT — pure alpha zero.
Only the border frame itself is visible.
Very subtle inner shadow/bevel for depth — almost imperceptible.
NO ornaments, NO flourishes, NO textures.
Modern, clean, minimal.
Portrait orientation, 3:4 ratio.
PNG with transparency inside and outside.
```

**Variables** : `{{COULEUR_HERO}}` = deep steel blue / crimson red / emerald green / warm sienna / golden amber

**Post-traitement** : Recadrer a 825x1125. Si DALL-E ne fait pas un bon cadre, creer en code (rectangle arrondi en Unity/Photoshop, plus fiable).

**Alternative recommandee** : Creer ce cadre en code (Unity UI Image avec border) plutot que de le generer par IA. Plus propre et parametrable.

---

## 2. Bandeau titre (bg_titre)

**Dimensions** : 795 x 100px (largeur carte moins marges)
**Role** : Affiche le nom du heros/carte. Premier element visible.

### Prompt
```
Clean flat colored title banner for a fantasy board game card.
Horizontal rectangular shape, very wide and short (ratio ~8:1).
Solid fill in {{COULEUR_HERO}} color — deep, rich, saturated.
Very subtle texture — like thick matte paint on paper. Not smooth
digital color, slightly tactile. Think gouache paint swatch.
Edges are CLEAN and STRAIGHT — no torn edges, no ornaments.
Very subtle darker shade at the top and bottom edges (1-2px) for
depth — like a printed band with slight ink variation.
NO text, NO symbols, NO borders.
PNG format, landscape orientation.
```

**Post-traitement** : Recadrer a 795x100. Le texte du titre sera superpose en Unity (blanc/creme, bold, avec leger drop shadow).

---

## 3. Zone illustration (bg_image)

**Dimensions** : 795 x 500px
**Role** : Contient l'illustration du heros/monstre. PAS de cadre propre — l'image remplit la zone bord a bord.

**Pas de prompt necessaire** — c'est l'illustration generee par ChatGPT (voir art_direction.md). Elle est simplement croppee/redimensionnee pour remplir cette zone.

**Post-traitement** : Cropper l'illustration generee a 795x500 en gardant le personnage centre.

---

## 4. Barre de separation (bg_separator)

**Dimensions** : 795 x 40px
**Role** : Separe l'illustration de la zone texte. C'est le seul element decoratif — il porte l'identite visuelle tribale.

### Prompt (6 variantes : 1 par heros + neutre)
```
A thin decorative horizontal divider bar floating in empty white
space. The bar is centered vertically. ABOVE and BELOW the bar
there is NOTHING — just plain white / transparent. No background
image, no gradient, no shadow, no glow, no reflection. ONLY the
bar itself exists.

The bar: a narrow solid band in {{COULEUR_BAR}} color. Clean
straight top and bottom edges. Thin gold/cream (#D4B87A) pinstripe
lines along the very top and bottom edges for definition.

In the exact CENTER: a small geometric tribal ornament — a simple
diamond/rhombus shape with small radiating lines, like a stylized
compass or sun. Bold, angular, symmetrical. Rendered in GOLD/CREAM
(#D4B87A). About 80px wide. Very simple, must be readable at 1cm.

The rest of the bar: plain solid {{COULEUR_BAR}}. NO repeating
pattern, NO gradient, NO texture.

NO text, NO other elements. ONLY the bar on a white background.
PNG format, extreme landscape ratio 20:1.
```

**6 variantes a generer** :

| Variante | COULEUR_BAR | Hex | Usage |
|---|---|---|---|
| Neutre | Warm dark brown | `#3A2E22` | Cartes sans heros, monstres, epreuves |
| Nawel | Deep steel blue | `#2B4F6E` | Cartes Nawel / armure |
| Daraa | Crimson red | `#8B2020` | Cartes Daraa / magie |
| Aslan | Warm sienna | `#7A5B3A` | Cartes Aslan / diplomatie |
| Isonash | Deep emerald | `#2A5E3A` | Cartes Isonash / distance |
| Gao | Golden amber | `#9B7B2F` | Cartes Gao / soin |

**Post-traitement** : Cropper la barre seule (retirer le blanc au-dessus et en-dessous). Redimensionner a 795x40.

---

## 5. Zone texte (bg_texte)

**Dimensions** : 795 x 380px
**Role** : Fond pour le texte de description/effets. DOIT etre ultra-lisible.

### Prompt
```
Clean flat cream/parchment panel for a board game card text zone.
Solid warm cream color (#F2E8D5) — almost flat but with very
subtle paint texture. Like one thick coat of cream gouache paint
on illustration board — barely visible brushstroke direction.
The texture must be SO SUBTLE that text printed on top remains
perfectly readable. If in doubt, make it MORE flat, LESS textured.
NO borders, NO frames, NO ornaments, NO shadows, NO gradients,
NO torn edges, NO vignetting, NO dark spots, NO stains.
Just a clean, warm, cream-colored rectangle.
Edges are straight and clean.
PNG format, landscape orientation, ratio ~2:1.
```

**Post-traitement** : Recadrer a 795x380. Verifier que le fond est VRAIMENT uniforme — aucune zone sombre qui generait le texte. Si trop texture, ajouter un calque creme semi-transparent par-dessus pour attenuer.

**Alternative recommandee** : Utiliser une simple couleur unie #F2E8D5 en Unity (UI Image, pas de texture). Plus propre, plus leger, zero risque de lisibilite. Ajouter la canvas_texture.png en overlay tres leger (5%) si on veut un soupcon de grain.

---

## 6. Barre stats (bg_stats)

**Dimensions** : 795 x 80px
**Role** : Bande en bas de carte avec les icones de stats (PV, degats, competence).

### Prompt
```
Thin colored stats bar for a fantasy board game card bottom.
Same color as title banner: {{COULEUR_HERO}}, solid fill.
Slightly DARKER than the title banner — like a footer.
Very subtle texture (matte gouache paint feel).
Straight edges, clean, minimal.
NO text, NO symbols, NO ornaments.
PNG format, extreme landscape orientation.
```

**Post-traitement** : Recadrer a 795x80. Les icones seront superposees en Unity.

**Alternative** : Meme couleur que le bandeau titre, cree en code.

---

## 7. Cercle icone (bg_icone)

**Dimensions** : 100 x 100px
**Role** : Receptacle pour les icones de competence/type.

### Prompt
```
Small circular icon holder for a board game card.
A perfect circle with a THIN border ring (~4px) in {{COULEUR_HERO}}.
Interior filled with cream/off-white (#F2E8D5) — flat, clean.
Very subtle drop shadow behind the circle for depth.
NO ornaments, NO text. Just a clean colored circle.
PNG with transparency outside the circle.
Square format, 1:1 ratio.
```

**Post-traitement** : Recadrer a 100x100.

**Alternative** : Creer en code (Unity UI, cercle colore). Beaucoup plus propre.

---

## Palette de reference

| Zone | Hex | Usage |
|---|---|---|
| **Fond texte creme** | `#F2E8D5` | Zone texte, interieur icones |
| **Texte principal** | `#2A1F14` | Brun fonce, pas noir pur |
| **Texte titre** | `#FFFFFF` ou `#F5ECD8` | Blanc ou creme sur fond colore |
| **Ombre texte** | `#1A1A1A` a 30% | Drop shadow discret |

### Couleurs par heros (pour cadre, titre, separator, stats)

| Heros | Hex principal | Hex fonce (stats) | Hex clair (motif separator) |
|---|---|---|---|
| Nawel | `#2B4F6E` | `#1E3A52` | `#5B8AAF` |
| Daraa | `#8B2020` | `#6B1515` | `#C45050` |
| Aslan | `#7A5B3A` | `#5C4228` | `#A8855E` |
| Isonash | `#2A5E3A` | `#1B4228` | `#4E8F62` |
| Gao | `#9B7B2F` | `#7A5F20` | `#C9A84E` |

---

## Notes

- **Privilegier la creation en code** pour cadre, titre, fond texte et stats — c'est plus propre, parametrable, et evite les aleas de generation IA
- **Generer par IA uniquement** : la barre de separation (motif tribal central) et eventuellement les icones
- **L'illustration** est l'element hero — tout le reste du layout doit etre au service de sa lisibilite, pas en competition
- Le style "cadre dur" est utilise par Root, Everdell, MTG, Arkham Horror — c'est le standard pour une bonne raison : ca marche
