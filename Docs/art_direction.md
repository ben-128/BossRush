# Direction Artistique - Raid Party

> Document de reference unique pour la generation et le post-traitement de toutes les illustrations du jeu.

## Style retenu : Gravure / Encre noire + couleur selective

**Decision :** avril 2026, apres comparaison de l'original (peinture numerique IA) avec un test en style gravure sur le Guerrier.

**Justification :** Le rendu "IA" de l'illustration originale etait trop visible (flou, textures lisses, fond generique). Le style gravure masque efficacement l'origine IA et donne une identite visuelle distinctive, reconnaissable en rayon JdS.

**Principe :** Toutes les illustrations (heros, monstres, epreuves) partagent ce style pour assurer la coherence visuelle du jeu.

---

## 1. Prompt template

### Generation nouvelle illustration

```
Dark fantasy ink engraving illustration of {{SUJET}}.
Style of Gustave Dore woodcut engraving with heavy crosshatching,
dramatic chiaroscuro.
Black ink on a flat smooth light grey-beige background.
No paper grain, no fiber texture, no paper tooth.
Plain smooth flat light background color.
Bold confident linework, THICK SPACED OUT hatching strokes for shading,
no smooth gradients. NOT fine dense hatching - big bold woodcut strokes.
Overall ink coverage should be around 50%, with plenty of open light
areas in sky and ground for the image to breathe.
High contrast, limited palette: black ink with selective {{COULEUR}} accent on {{ELEMENTS_COULEUR}} only.
Printmaking aesthetic, hand-carved feel.
{{PROMPT_VISAGE}}
Landscape orientation.
```

### Correction illustration existante (img2img)

Uploader l'illustration originale, puis utiliser ce prompt :

```
This is an existing ink engraving illustration. Recreate it as a
PIXEL-PERFECT copy. Same character, same pose, same equipment.
Same background, same smoke, same clouds, same sky covering the
ENTIRE top portion, same distant elements, same foreground debris.
Every single element must be in the same position.
The ONLY change allowed: shift the base paper color from warm beige
to flat smooth light grey-beige. No texture change, no composition
change, no removal of any sky or background element. The sky must
remain fully detailed with ink hatching and clouds exactly as the
original.
Also make the hatching strokes BOLDER and more SPACED OUT, like
woodcut style. Currently the hatching is too fine and dense. Open
up more light areas in the sky and ground to let the background
breathe. The overall image should be lighter and airier, closer
to 50% ink coverage, not 80%.
```

### Variables par type d'asset

| Variable | Description | Exemples |
|---|---|---|
| `{{SUJET}}` | Description du personnage/scene, pose, equipement, decor | voir section 3 |
| `{{COULEUR}}` | Couleur d'accent unique du hero | `red`, `electric blue`, `emerald green` |
| `{{ELEMENTS_COULEUR}}` | Element(s) portant l'accent colore | `cape and shield emblem`, `glowing runes`, `crystal arrowhead` |
| `{{PROMPT_VISAGE}}` | Description du visage : traits uniques, imperfections, expression | voir section 3 |

### Prompt negatif

```
smooth, airbrushed, digital painting, photorealistic, soft focus, blurry, generic,
stock art, midjourney style, artstation trending, watercolor, pastel, gradient,
multiple colors, colorful, saturated, paper texture, paper grain, fiber texture,
fine hatching, dense crosshatching, dark heavy image, mostly black
```

---

## 2. Regles visuelles

### Palette
- **Dominante :** Noir encre (hachures, contours, ombres). Quasi-totalite de l'image est en noir et blanc.
- **Accent :** UNE SEULE couleur selective par hero, appliquee sur 1-2 elements forts maximum
- **Fond :** Gris-beige clair, lisse, plat, uniforme. PAS de parchemin chaud/sepia.
- **Interdit :** Pas de melange de couleurs. Une illustration = noir + une couleur. Le reste est en niveaux de gris/encre. Pas de jaune, pas d'orange, pas de sepia chaud.

### Palette de reference

| Zone | Hex | Description |
|---|---|---|
| **Fond base** | `#D8C2A3` | Gris-beige neutre (cible apres correction) |
| **Fond clair** | `#E6D3B8` | Zones les plus claires |
| **Fond fonce** | `#BFA07A` | Zones plus sombres, bords |
| **Encre noire** | `#1A1A1A` | Contours, hachures principales |
| **Ombres hachures** | `#3A3228` | Hachures denses, ombres profondes |
| **Hachures moyennes** | `#6B5E50` | Armure, sol, details mi-tons |
| **Ciel/fond lointain** | `#8A7D6F` | Arriere-plan, gris chaud |
| **Blanc casse** | `#E8DDD0` | Zones les plus claires (bouclier, etc.) |

### Trait
- Hachures visibles, croisees pour les ombres
- Hachures EPAISSES et ESPACEES, style gravure sur bois. PAS de hachures fines et serrees (trop digital, illisible a petite taille)
- Contours nets et affirmes
- Pas de degrade lisse ni de flou artistique
- Rendu "grave dans le bois" (woodcut)

### Densite d'encre
- Cible : environ **50% de couverture encre** sur l'image totale
- Il FAUT des zones de respiration : ciel ouvert, sol degage, zones claires visibles
- PAS de hachures denses partout (sinon aplat noir a taille carte)
- Le personnage doit se DETACHER clairement du fond grace au contraste
- Reference : le Guerrier corrige est le bon ratio de densite

### Composition
- Le personnage/sujet occupe ~70% du cadre
- Fond suggestif, pas trop detaille (risque de bruit a petite taille)
- Contraste figure/fond : le sujet doit se detacher clairement

### Lisibilite a taille carte (63x88mm)
- Eviter les hachures trop denses qui deviennent un aplat sombre
- Eclaircir legerement la zone du personnage
- Les details importants (visage, arme, embleme) doivent rester lisibles

---

## 3. Sujets par hero

Chaque hero a **une couleur d'accent unique**. L'illustration est quasi entierement noire/encre, avec cette couleur appliquee sur 1-2 elements forts seulement.

Le **visage** est l'element le plus important de chaque illustration. Il doit etre net, detaille, avec une forte personnalite. Chaque hero a un visage unique, memorable, avec des imperfections, de l'asymetrie et du caractere. Pas de "beau visage generique IA".

| Hero | Couleur | Sujet | Elements couleur | Visage |
|---|---|---|---|---|
| **Guerrier** | Rouge | An armored warrior in defensive stance holding a large shield with a phoenix emblem, cape flowing, battlefield background at dusk | cape and shield emblem | Sharp detailed face of a weathered black male soldier, broken nose, deep scar across left cheek, intense determined gaze, square jaw clenched, short cropped hair, asymmetric brow ridge |
| **Mage** | Bleu electrique | A female mage channeling lightning through a sapphire crystal staff, arcane circle glowing beneath her, storm clouds background | arcane runes and lightning arcs | Sharp detailed face of a gaunt woman with hollow cheekbones, piercing asymmetric eyes one slightly larger, thin severe lips, silver-streaked hair pulled tight, burn mark on temple, unsettling knowing expression |
| **Diplomate** | Brun/sepia chaud | A diplomat in leather cape holding a sealed scroll, grand hall with banners background | wax seal and banner crests | Sharp detailed face of a middle-aged man with a crooked aristocratic nose, laugh lines deeply etched, shrewd narrow eyes, neatly trimmed greying beard, receding hairline, confident half-smile |
| **Rodeur** | Vert emeraude | A female ranger drawing a bow with a crystal-tipped arrow, cathedral forest background, quiver on back | crystal arrowhead and bowstring glow | Sharp detailed face of a young woman with freckled sun-weathered skin, alert wide-set eyes, small scar on upper lip, wild windswept braided hair, angular jaw, focused hunting expression |
| **Soigneur** | Or/jaune dore | A male healer channeling light from open palms, ruined temple background, sacred symbols floating | healing light and sacred symbols | Sharp detailed face of an older man with deep-set compassionate eyes, prominent crow's feet, aquiline nose slightly bent, thin white beard, age spots on forehead, serene but weary expression |

---

## 4. Post-traitement obligatoire

Apres chaque generation, appliquer dans l'ordre :

1. **Correction fond (PRIORITE #0)** — Si le fond est trop chaud/sepia/jaune, uploader dans ChatGPT avec le prompt de correction (section 1). Le fond doit etre gris-beige plat et lisse, PAS parchemin chaud.

2. **Visage (inpainting - PRIORITE #1)** — Le visage fait ou defait l'illustration. Toujours regenerer en zoom avec le prompt visage de la section 3. Criteres :
   - **Nettete** : le visage doit etre la zone la plus nette de l'image
   - **Identite** : traits uniques et memorables, pas un visage generique
   - **Imperfections** : cicatrices, asymetrie, rides, nez casse, marques — ce qui rend le personnage humain et credible
   - **Expression** : emotion lisible, coherente avec le personnage
   - **Lisibilite** : doit rester lisible imprime a 63x88mm
   - Si le visage est "trop beau" ou "trop lisse" apres generation, c'est rate — recommencer.

3. **Details equipement (inpainting)** — Retoucher les zones d'armure, armes, emblemes si les textures sont trop "fondues". Ajouter nettete et bords durs.

4. **Contraste figure/fond** — Si le personnage se perd dans le decor, assombrir le fond. Eventuellement ajouter un vignettage leger.

5. **Verification palette** — S'assurer qu'aucune couleur parasite n'est apparue. Seuls le noir, le gris-beige et la couleur d'accent du hero sont autorises. PAS de jaune, PAS d'orange, PAS de sepia chaud.

6. **Finitions optionnelles** :
   - Sharpening selectif sur le personnage
   - Bruit chromatique subtil (2-3%)

---

## 5. Application aux autres types d'assets

### Monstres
Meme prompt template. La couleur selective est le rouge pour les elements menacants (yeux, griffes sanglantes, magie hostile).

### Epreuves (scenes)
Meme prompt template. Le sujet est un lieu ou une situation. La couleur selective est le rouge pour l'element de danger ou d'interet (piege, lueur, sang).

### Icones
- Format 1:1 au lieu de paysage
- Le rouge selectif est l'element central de l'icone
- Fond blanc ou gris-beige uni

### Cadres de carte (frames)
- Style encre noire woodcut, traits TRES EPAIS
- Pas de hachures fines, pas de filigrane
- Interieur des zones texte : creme clair lisse opaque
- Voir `Docs/card_frame_templates.md` pour les prompts

### Fonds de carte colores
- Texture marbrée/cuir par couleur de hero (rouge, bleu, vert, marron, or, gris neutre)
- Voir `Docs/card_backgrounds.md` pour les prompts

---

## Historique des decisions

| Date | Decision |
|---|---|
| 2026-04-09 | Style gravure retenu apres test sur le Guerrier. Abandon du style "MTG painterly" initial. |
| 2026-04-10 | Fond des illustrations change de parchemin chaud/sepia vers gris-beige plat lisse. Raison : uniformite entre illustrations et meilleure integration avec les fonds de carte colores. |
| 2026-04-10 | Ajout des fonds de carte colores par type de hero (style MTG). |
| 2026-04-10 | Ajout des cadres de carte (titre, image, texte, icone) en style woodcut traits epais. |
