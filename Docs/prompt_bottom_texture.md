# Prompt — Parchemin zone texte (4 bords visibles, style Everdell/Res Arcana)

> Morceau de parchemin flottant avec transparence, a placer par-dessus l'illustration.
> Inspire des cartes Everdell (blotches bruns sur les bords) et Res Arcana (vignettage chaud).

## Prompt

```
A single piece of aged parchment paper, seen from directly above, 
floating on a transparent background (RGBA, alpha channel).

FORMAT: PNG with transparency. The parchment piece occupies roughly 
85-90% of the image. Everything outside the parchment edges is 
fully transparent.

SHAPE: rectangular piece of old parchment/vellum, roughly landscape 
ratio (~2:1). ALL FOUR EDGES are visible and IRREGULAR — not cut 
straight, but torn, worn, and slightly wavy like real old paper. 
Each edge is different:
- Top edge: the most irregular — torn and wavy, with a few small 
  notches and one slightly larger bite taken out
- Bottom edge: less torn but still uneven, slightly curled
- Left and right edges: wavy, worn, with subtle fiber fraying

The parchment is NOT a perfect rectangle. It looks like a real 
piece of old document that was handled, folded, and aged.

SURFACE — inspired by Everdell / Res Arcana card text panels:

CENTER (text zone, ~60% of area):
- Warm cream/ivory base (#F0E4D0), the lightest area
- Visible but subtle gouache brushstrokes — thick, horizontal, 
  matte. The paint is opaque cream over the parchment.
- Clean enough for dark text to be perfectly readable
- Very slight tonal variation — not perfectly uniform, some 
  patches marginally warmer or cooler

EDGES AND BORDERS (the key character):
- ALL four edges darken significantly — burnt sienna / raw umber 
  tones (#6B4226 to #3D2211), 30-40% darker than center
- The darkening is ORGANIC and UNEVEN — like water stains, age 
  foxing, and handling marks accumulated over centuries
- Some edges have darker BLOTCHES — 2-3 larger stain-like areas 
  where the brown is more concentrated, like tea stains or old 
  ink spills. These are the signature Everdell look.
- The transition from dark edges to light center is GRADUAL — 
  a soft 15-20% of the width on each side, not a hard line
- CORNERS: darkest areas (~40-45% darker than center), each 
  corner slightly different in shape and darkness

TEXTURE DETAILS:
- Visible paper/vellum fiber texture throughout, more apparent 
  where the paint is thinner (near edges)
- Very faint crackle pattern in a few spots — like old dried 
  paint on paper, not dramatic
- 1-2 tiny foxing dots (age spots) scattered naturally
- The overall feel is WARM — sienna, umber, ochre tones. 
  Never grey, never cold.

SHADOW:
- A very soft, warm drop shadow around the entire parchment piece 
  (as if it's slightly lifted off the surface below)
- Shadow is subtle — just enough to give depth, ~3-5px blur, 
  dark brown, 20-30% opacity

STYLE: photorealistic aged parchment with painted gouache surface. 
The feeling of a 300-year-old manuscript page that a painter used 
as a palette — warm, tactile, full of character.

IMPORTANT:
- NO text, NO symbols, NO writing, NO drawings on the surface
- NO perfectly straight edges anywhere
- NO uniform color — every area has subtle variation
- The dark edge stains are the MOST IMPORTANT visual feature — 
  they give the parchment its character and depth
- Must work as a text panel overlay on a dark/colorful background
```

## References visuelles

- **Everdell** : `Docs/everdell_textures/parchment_clean.png` — forme et bords
- **Everdell** : `Docs/everdell_textures/full_composite.png` — carte complete avec parchemin en contexte
- **Res Arcana** : vignettage chaud, transition sombre sous l'illustration

## Post-traitement

1. Recadrer/resize pour correspondre a la zone texte de la carte
2. Verifier lisibilite : texte brun fonce (#2A1F14) en 10pt et 8pt doit etre parfaitement lisible dans la zone centrale (60%)
3. Si le vignettage est trop fort sur les bords : calque creme #F0E4D0 a 15% sur les bords
4. Si pas assez de texture : augmenter contraste local (clarity +10)
5. Le centre doit rester CLAIR — tout le caractere est sur les bords
