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
Landscape orientation, 3:2 aspect ratio.
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

### Visages
- Le visage doit rester PRINCIPALEMENT rendu en hachures noires, comme le reste du corps
- Les tons chair sont un LAVIS SUBTIL visible entre les hachures, PAS un aplat de couleur peau realiste
- Le visage ne doit PAS etre plus "realiste" ou "peint" que le reste de l'illustration
- Penser "gravure ancienne legerement teintee a la main" PAS "portrait realiste colle sur gravure"
- Les hachures du visage doivent etre aussi visibles et dominantes que partout ailleurs
- Reference : le Guerrier est le bon dosage — tons chair a peine perceptibles sous les hachures

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
| **Rodeuse** | Vert emeraude | A female Native American ranger crouched on a fallen tree trunk in a primeval forest, holding a bow vertically, quiver on back, green-lined cloak | crystal arrowhead glow, cloak interior lining, leaves in hair | Sharp detailed face of a young Native American woman with high cheekbones, aquiline nose, warm bronze/olive skin, long straight black hair, wide-set dark eyes, proud calm predatory expression |
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

---

## 6. NOUVEAU STYLE EN TEST : Impasto / Huile epaisse

> **Statut :** En exploration (avril 2026). Pourrait remplacer le style gravure.

### Pourquoi ce changement

- Le style gravure noir + couleur selective est beau mais limite l'identite visuelle (pas de couleur, pas de wow en rayon)
- L'univers evolue vers un cadre tribal/heroic fantasy colore (voir `Docs/univers.md`)
- L'impasto est un territoire **vierge en JdS** — aucun jeu connu ne l'utilise
- Les coups de couteau/pinceau epais masquent les artefacts IA
- Les imperfections du style (textures rugueuses, formes pas lisses) sont voulues = pas de "uncanny valley"

### Principe du style

- Peinture a l'huile epaisse au couteau/pinceau large
- Coups de pinceau visibles et sculpturaux, texture en relief
- Formes solides et lisibles, PAS d'impressionnisme flou
- Palette riche et saturee mais controlee : 5-6 couleurs dominantes
- Visages rugueux, imparfaits, PAS lisses ni "beaux" — des guerriers, pas des mannequins
- Fond/decor visible et atmospherique (paysages, ruines, jungle, montagnes)

### Palette de reference (par heros)

| Hero | Couleur dominante | Elements portant la couleur | Palette |
|---|---|---|---|
| **Nawel (Rempart)** | Bleu acier | Plumes, bouclier, peinture de guerre | deep steel blue, burnt sienna, warm ochre, charcoal, dark brown, cream |
| **Killa (Flamme)** | Rouge/cramoisi | Feu, runes, plumes | deep crimson, amber orange, molten gold, charcoal, dark brown, cream |
| **Karai (Porte-Voix)** | Brun/or | a definir | a definir |
| **Liwen (Piste)** | Vert emeraude | a definir | a definir |
| **Amaru (Gardien)** | Or/jaune | a definir | a definir |

### Prompt template impasto

```
Full body character portrait, square format, wide shot showing full environment.
{{DESCRIPTION_PERSONNAGE}}

Behind him/her: {{DECOR}}

Style: thick impasto oil painting with visible palette knife strokes and paint texture,
but NOT impressionism. Keep forms solid and readable. Chunky paint application with
visible ridges but maintain clear shapes and defined silhouette. Colors are rich and
saturated, not broken into dots or dabs: {{PALETTE}}.
The texture is in the surface of the paint, not in dissolving the image.
Think thick paint on a solid drawing. Face must be painted with the SAME thick rough strokes as the rest of the painting.
No fine detail on the face. Features suggested by bold paint slabs, not rendered smoothly.
The face should NOT be more detailed than the armor or background.
No smooth digital look, no photorealism, but also no abstract impressionist blur.

Character takes up about 60% of the frame, full body visible head to toe,
environment clearly visible around and behind him/her.
```

### Prompt negatif impasto

```
smooth, digital, photorealistic, airbrushed, impressionism, pointillism,
broken brushstrokes dissolving form, abstract, blurry face, beautiful face,
model face, symmetrical perfect features, studio lighting, white skin
```

### Points de vigilance

- **Visages** : doivent rester rugueux, asymetriques, imparfaits. Si trop beau/lisse = re-generer
- **Peau** : doit correspondre a l'ethnie du personnage. PAS de peau blanche par defaut
- **Pose** : dynamique, pas statique. Chaque heros dans une action liee a son role
- **Lisibilite carte** : les zones de texte/icones devront etre sur fond plus clean (pas impasto)
- **Consistance** : a tester sur les 5 heros avant de valider le style

---

## 7. Deux formats par héros et boss

Chaque **héros** et chaque **boss** a **deux illustrations distinctes**, générées séparément mais cohérentes entre elles.

### Verso de carte — Format 2:3 (portrait vertical)

- **Plein cadre** : illustration immersive sur tout le verso
- C'est l'**image héro** : celle qu'on regarde, qu'on apprécie, qu'on retient
- Composition portrait verticale avec décor riche
- Le personnage occupe ~60-70% du cadre, environnement étendu visible
- Pose dynamique et narrative
- En bas : un **sous-titre** lore (1 phrase courte FR + EN)

**Caractéristiques du prompt 2:3 :**
```
- Format: portrait vertical 2:3
- Wide shot showing full environment
- Character full body visible
- Dramatic narrative pose
- Atmospheric background with depth
- Environment takes a significant role in the composition
```

### Recto de carte — Format 1:1 (vignette carrée en haut)

- **Vignette carrée** en haut de la carte (le bas contient stats / effets)
- C'est l'**image fonctionnelle** : on l'utilise pendant le jeu, doit être claire à petite taille
- Composition centrée, sujet dominant, lecture rapide
- Le personnage occupe ~80% du cadre, fond plus simple ou flou
- Pose plus iconique/statique (buste ou portrait américain)
- Doit rester lisible imprimé en petit format (~5cm)

**Caractéristiques du prompt 1:1 :**
```
- Format: square 1:1
- Medium close-up shot, bust to upper body
- Character centered, dominant in frame (~80%)
- Simpler less detailed background
- Iconic identifying pose (not action shot)
- Strong silhouette readable at small size
- Same character description as the 2:3 version (consistency)
```

### Stratégie de cohérence visuelle entre 2:3 et 1:1

L'IA ne garantit pas que le 2:3 et le 1:1 montrent **le même** personnage. Pour assurer la cohérence :

**Option A — Description identique (recommandée pour démarrer)**
1. Écrire d'abord le 2:3 avec une description physique très précise (ethnie, traits, cheveux, peinture de guerre, vêtements, accessoires colorés)
2. Reprendre **mot pour mot** la description physique dans le 1:1
3. Seul le cadrage et la pose changent

**Option B — Image-to-image (plus précis)**
1. Générer le 2:3 d'abord
2. Cropper une zone carrée du visage/buste depuis le 2:3
3. Utiliser ce crop comme **image de référence** dans DALL-E pour générer le 1:1
4. Avantage : visage et tenue identiques garantis

**Option C — Référence visuelle externe**
1. Générer le 2:3
2. L'utiliser comme reference image dans le prompt 1:1 (`reference image of the same character`)

**Recommandation :** commencer par l'option A (descriptions identiques). Si la cohérence n'est pas suffisante, passer à l'option B.

### Sous-titre lore (verso 2:3 uniquement)

Chaque carte verso porte un **sous-titre court** en bas de l'illustration, en italique, qui suggère du lore sans tout expliquer.

- **Longueur** : 1 phrase, 8 mots max idéalement
- **Bilingue** : version FR + version EN
- **Ton** : sobre, suggestif, jamais explicatif
- **Style** : *« Phrase courte. »* en italique avec guillemets français

Exemples :
- Nawel : *« Tant qu'il tient debout, ils tiennent. »* / *« While he stands, they stand. »*
- Hobab : *« Il était la pluie. Il est devenu la cendre. »* / *« He was the rain. He became the ash. »*

---

## Historique des decisions

| Date | Decision |
|---|---|
| 2026-04-09 | Style gravure retenu apres test sur le Guerrier. Abandon du style "MTG painterly" initial. |
| 2026-04-10 | Fond des illustrations change de parchemin chaud/sepia vers gris-beige plat lisse. Raison : uniformite entre illustrations et meilleure integration avec les fonds de carte colores. |
| 2026-04-10 | Ajout des fonds de carte colores par type de hero (style MTG). |
| 2026-04-10 | Ajout des cadres de carte (titre, image, texte, icone) en style woodcut traits epais. |
| 2026-04-11 | Test style impasto/huile epaisse suite au changement d'univers (tribal/colosses). Premier test sur Nawel (Rempart) concluant — pose dynamique, defensif, peau amerindienne, decor ruines/jungle. |
| 2026-04-12 | Adoption de 2 formats par hero/boss : verso 2:3 (image hero immersive) + recto 1:1 (vignette en haut de carte). Sous-titre lore FR/EN sur le verso. |
