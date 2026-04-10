# Templates de cadres de carte - Raid Party

> Cadres UI pour composer les cartes. Style gravure/encre noire, traits epais, tres lisibles.
> Format carte classique : 825x1125px (ratio 63x88mm)

## Style commun

Tous les cadres partagent ce style :
- **Encre noire** sur fond transparent (PNG avec alpha)
- **Traits TRES EPAIS** : bordures larges, pas de hachures fines, pas de petits details
- **Lisibilite** : doit rester net imprime a 63x88mm
- **Style** : gravure sur bois (woodcut), ornements fantasy simples (pas de filigrane fin)
- **Pas de texte**, pas de couleur, juste noir + transparence

---

## 1. Cadre de titre (bg_titre)

**Dimensions** : 825 x 120px (horizontal, fin bandeau en haut de carte)

### Prompt
```
Black ink ornamental title banner frame on transparent background.
Horizontal rectangular shape, very wide and short (ratio ~7:1).
THICK bold black border lines, woodcut engraving style.
Small decorative corner flourishes, very simple and bold.
The INTERIOR is filled with a very light warm cream/parchment color,
smooth and almost solid — designed to have readable text on top.
NO hatching, NO crosshatching, NO fine lines inside the frame.
Interior must be clean, smooth, and light for text legibility.
Dark fantasy style, hand-carved woodblock aesthetic.
PNG with transparency OUTSIDE the frame.
Landscape orientation.
```

**Post-traitement** : recadrer a 825x120, verifier que l'interieur est bien clair et lisse.

---

## 2. Cadre d'image (bg_image)

**Dimensions** : 825 x 560px (~50% de la hauteur carte, horizontal)

### Prompt
```
Black ink ornamental picture frame on transparent background.
Horizontal rectangular shape (ratio ~3:2).
THICK bold black border lines, woodcut engraving style.
Simple bold corner ornaments — fantasy knotwork or angular flourishes.
The border is THIN relative to the frame size (about 3-5% of width).
The INTERIOR is COMPLETELY TRANSPARENT / EMPTY — pure alpha zero.
Only the border frame itself is visible, everything inside is cut out.
NO fill, NO hatching, NO texture inside the frame.
Dark fantasy style, hand-carved woodblock aesthetic.
PNG with transparency both OUTSIDE and INSIDE the frame.
Landscape orientation.
```

**Post-traitement** : recadrer a 825x560, decoupe alpha interieur dans Photoshop/GIMP si l'IA n'a pas fait un vrai transparent.

---

## 3. Cadre de texte (bg_texte)

**Dimensions** : 825 x 450px (~40% de la hauteur carte, horizontal)

### Prompt
```
Black ink ornamental text box frame on transparent background.
Horizontal rectangular shape (ratio ~2:1).
THICK bold black border lines, woodcut engraving style.
Simple bold corner ornaments — small angular fantasy flourishes.
The INTERIOR is filled with a very light warm cream/parchment color,
smooth and almost solid — designed to have readable text on top.
NO hatching, NO crosshatching, NO fine lines inside the frame.
Interior must be clean, smooth, and light for maximum text legibility.
Dark fantasy style, hand-carved woodblock aesthetic.
PNG with transparency OUTSIDE the frame.
Landscape orientation.
```

**Post-traitement** : recadrer a 825x450, verifier que l'interieur est uniforme et clair.

---

## 4. Cercle receptacle a icones (bg_icone)

**Dimensions** : 120 x 120px (carre, petit)

### Prompt
```
Black ink ornamental circular frame on transparent background.
Perfect circle shape with THICK bold black border ring.
Woodcut engraving style, bold linework.
Very simple decoration: small notches or angular marks on the ring,
like a carved stone medallion holder. Keep it very simple and bold.
The INTERIOR is COMPLETELY TRANSPARENT / EMPTY — pure alpha zero.
Only the circular border ring is visible, everything inside is cut out.
NO fill, NO hatching, NO texture inside the circle.
Dark fantasy style, hand-carved woodblock aesthetic.
PNG with transparency both OUTSIDE and INSIDE the circle.
Square format, 1:1 ratio.
```

**Post-traitement** : recadrer a 120x120, decoupe alpha interieur si necessaire.

---

## Palette de reference (extraite du Guerrier)

| Zone | Hex | Usage |
|---|---|---|
| **Fond parchemin base** | `#D8C2A3` | Couleur principale du fond |
| **Parchemin clair** | `#E6D3B8` | Zones claires, centre, rehauts |
| **Parchemin fonce** | `#BFA07A` | Zones foncees, bords, vignettage |
| **Encre noire** | `#1A1A1A` | Contours, hachures principales |
| **Ombres hachures** | `#3A3228` | Hachures denses, ombres profondes |
| **Hachures moyennes** | `#6B5E50` | Armure, sol, details mi-tons |
| **Ciel/fond lointain** | `#8A7D6F` | Arriere-plan, gris chaud |
| **Blanc casse** | `#E8DDD0` | Bouclier, zones les plus claires |

## Prompt de changement de couleur

Pour recoloriser un element d'une couleur a une autre :
```
Take this image and shift its color tone from {{COULEUR_ACTUELLE}}
to {{COULEUR_CIBLE}}. Keep the exact same texture, grain, pattern,
and tonal variation. Only change the hue/tint. Keep it muted and
desaturated. Do not change the black ink lines or the overall
contrast.
```

## Notes generales

- DALL-E a du mal avec la transparence selective (interieur opaque + exterieur transparent) — generer sans transparence (fond blanc) et retirer le blanc en post si necessaire
- Les coins/ornements doivent etre GROS et SIMPLES — pas de filigrane fin qui disparait a l'impression
- Tester la lisibilite en superposant sur les fonds colores (rouge, bleu, vert, marron, or, gris)
