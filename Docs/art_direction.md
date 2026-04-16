# Direction Artistique - Raid Party

> Document de reference unique pour la generation et le post-traitement de toutes les illustrations du jeu.

## Style retenu : Gouache narrative

**Decision :** avril 2026, apres exploration de plusieurs pistes (gravure encre, impasto, risograph 2-3 couleurs, gouache).

**Justification :**
- Rendu "peint a la main" chaleureux et heroique — effet "wow" immediat
- Les coups de pinceau visibles et la texture de peinture epaisse masquent les artefacts IA
- Parfait pour les animaux anthropomorphes — la fourrure pardonne les imperfections IA
- Style proche de l'illustration JdS classique (Root, Everdell, Mice & Mystics) sans copier
- Les eclaboussures, bavures et empâtements sont des imperfections VOULUES
- Avec post-traitement (overlay texture toile/papier + grain + displacement), le masquage IA est efficace

**Principe :** Toutes les illustrations (heros, monstres, epreuves) partagent ce style pour assurer la coherence visuelle du jeu.

---

## 1. Prompt template

### Bloc style (a prefixer a TOUT prompt de generation)

```
Narrative gouache painting on textured illustration board.
Thick opaque brushstrokes clearly visible — loose, confident,
varied in direction and pressure. NOT uniform, NOT smooth, NOT digital.
Matte finish. Paint applied with palette knife in some areas for
thick impasto texture. Visible paper grain in thin wash areas.
Drips and paint splatter in margins.
Style of classic hand-painted fantasy book cover illustration
from the 1980s-90s. Raw, expressive, energetic brushwork.
Warm and cool contrast.
NOT digital painting, NOT airbrushed, NOT photorealistic,
NOT concept art, NOT smooth gradients.
The painting should feel like it was made by a human illustrator
with real paint on real paper.
{{FORMAT}}
```

### Variables

| Variable | Description | Exemples |
|---|---|---|
| `{{COULEUR_DOMINANTE}}` | Couleur thematique du heros (~70% de l'image) | `deep steel blue`, `crimson red` |
| `{{COULEUR_ACCENT}}` | Couleur de contraste chaud/froid (~30%) | `warm golden`, `cool blue` |
| `{{SUJET}}` | Description du personnage/scene, pose, equipement, decor | voir section 3 |
| `{{FORMAT}}` | Ratio de l'image | `Portrait orientation, 2:3 aspect ratio.` |

### Bloc couleur (a inserer apres le bloc style)

```
COLOR DIRECTION: The dominant color theme is {{COULEUR_DOMINANTE}}.
The painting should read as a {{COULEUR_DOMINANTE}}-toned image overall.
{{COULEUR_DOMINANTE}} armor, {{COULEUR_DOMINANTE}} shadows,
{{COULEUR_DOMINANTE}} background tones.
{{COULEUR_ACCENT}} accents (fur highlights, lighting) provide contrast
but {{COULEUR_DOMINANTE}} DOMINATES.
Think 70% {{COULEUR_DOMINANTE}} tones, 30% warm accents.
```

### Prompt negatif (a ajouter si ChatGPT/DALL-E lisse trop)

```
smooth, airbrushed, digital painting, photorealistic, soft focus,
blurry, concept art, artstation trending, 3D render, CGI, anime,
cartoon, comic book coloring, uniform brushstrokes, perfect rendering
```

---

## 2. Regles visuelles

### Palette par illustration

- **Couleur dominante du heros** (~70% de l'image) : donne le ton general (bleu, rouge, vert, etc.)
- **Couleur d'accent** (~30%) : contraste chaud/froid pour la profondeur (fourrure doree, lumiere chaude, etc.)
- **Fond :** teinte dans la couleur dominante, atmospherique, pas neutre
- **Interdit :** palette trop large (arc-en-ciel), couleurs criardes non thematiques

### Texture et brushwork

- Coups de pinceau VISIBLES — varies en direction, pression et taille
- Empâtements de peinture epaisse (palette knife) sur les highlights et bords d'armure
- Eclaboussures et bavures de peinture sur les marges — imperfections voulues
- Texture de papier/toile visible dans les zones fines (lavis)
- Rendu MAT, PAS brillant ou lisse
- **En post-prod (Unity) :** overlay texture toile + grain + leger displacement UV pour casser la regularite IA

### Trait et formes

- Pas de contours nets — les formes emergent des masses de couleur et des coups de pinceau
- Silhouettes fortes et lisibles a petite taille
- Details concentres sur le visage/museau et l'equipement iconique
- Fond plus lache et suggestif que le personnage

### Composition

- Le personnage/sujet occupe ~60-70% du cadre
- **Composition asymetrique** — personnage decentre, diagonales dynamiques
- Silhouette forte et reconnaissable — doit fonctionner en 2cm de large
- Contraste figure/fond : contraste chaud/froid entre le sujet et l'arriere-plan

### Museaux et visages animaux

- Expressifs et lisibles — la gueule ouverte, les yeux, les oreilles portent l'emotion
- Peinture de guerre / marques tribales sur le museau = trait distinctif de chaque heros
- La fourrure masque naturellement les artefacts IA — c'est un avantage majeur des animaux anthropomorphes
- Chaque heros a 1-2 traits faciaux uniques (couleur des yeux, forme des oreilles, criniere, etc.)

### Mains et pattes

- **PROBLEME MAJEUR IA** : les mains/pattes tenant des objets sont souvent deformees
- **Solution : minimiser les objets tenus.** Un seul objet en main max (bouclier OU arme, pas les deux)
- Privilegier les poings fermes, gantelets, griffes — PAS de doigts detailles
- Si un objet est tenu, le cadrer de maniere a cacher partiellement la main/patte

### Lisibilite carte (63x88mm)

- Tester chaque illustration reduite a 6cm de large
- La silhouette du personnage doit rester identifiable en thumbnail
- Les details fins (motifs d'armure, textures) doivent rester lisibles ou etre simplifies

---

## 3. Heroes — Palette et couleurs par personnage

Chaque heros a sa couleur dominante qui teinte ~70% de l'image (fond, ombres, armure, atmosphere). Les 30% restants sont des accents chauds/froids de contraste.

| Hero | Nom | Titre | Couleur dominante | Accent contraste | Ambiance |
|---|---|---|---|---|---|
| **Rempart** | Nawel | Le Rempart | Deep steel blue | Warm golden (fourrure jaguar) | Froid/heroique, montagnes orageuses |
| **Flamme** | Daraa | La Flamme | Crimson red / orange braise | Cool dark shadows | Chaud/volcanique, desert ardent |
| **Porte-Voix** | Aslan | Le Porte-Voix | Warm sienna brown / gold | Cool blue-grey shadows | Noble/majestueux, architecture ancienne |
| **Piste** | Isonash | La Piste | Deep emerald green | Warm amber light | Mystique/forestier, foret dense |
| **Gardien** | Gao | Le Gardien | Warm golden yellow | Cool green/earth tones | Lumineux/apaisant, savane du Kalahari |

### Elements portant la couleur (par heros)

| Hero | Elements en couleur | Elements en noir |
|---|---|---|
| **Nawel** | Plumes, bouclier (motifs geometriques), peinture de guerre, ciel | Armure, corps, sol, details |
| **Daraa** | Feu, runes, plumes de coiffe, eclairs magiques | Corps, robes, sol, staff |
| **Aslan** | Cape, sceau du parchemin, emblemes, torches | Armure legere, corps, architecture |
| **Isonash** | Plumes de fleche, broderies, feuillage, doublure capuche | Arc, corps, troncs, sol |
| **Gao** | Lumiere de soin, symboles sacres, herbes, soleil | Corps, ruines, sol, outils |

### Description physique (source de verite pour chaque heros)

> Ces descriptions sont les references definitives. Elles correspondent aux fichiers `hero_*.md` individuels.

> **IMPORTANT : Les heros sont des animaux anthropomorphes.** Voir `Docs/univers.md` pour le contexte. L'animal de chaque heros est lie a la culture de sa tribu. Les inspirations culturelles (noms, tribus, couleurs, equipements) restent identiques.

| Hero | Animal | Lien culturel |
|---|---|---|
| Nawel | Jaguar | Nom signifie "jaguar" en mapuche, animal sacre |
| Daraa | Hyene | Animal emblematique des terres arides Afar, lie aux esprits |
| Aslan | Lion | Nom signifie "lion" en circassien, autorite naturelle |
| Isonash | Ours brun | Kimun kamuy (esprit de l'ours) sacre chez les Ainou |
| Gao | Suricate | Animal du Kalahari, vie communautaire, petit et agile |

**Nawel (Rempart)** — Jaguar anthropomorphe, tribu Mapuche. Guerrier massif, musculature feline puissante. Fourrure tachee de noir sur fond fauve. Armure fer forge + cuir + os. Bouclier rond massif avec motifs geometriques solaires bleus. Toki (hache de guerre mapuche). Peinture de guerre bleue sur le museau et les joues.

**Daraa (Flamme)** — Hyene anthropomorphe, tribu Afar. Mage. Pelage court brun-gris, criniere herissee couleur braise. Oreilles pointues expressives. Coiffe avec plumes couleur braise. Robes legeres. Baton/staff avec cristal. Runes de feu.

**Aslan (Porte-Voix)** — Lion anthropomorphe, tribu Circassienne. Diplomate. Criniere epaisse et majestueuse, pelage dore. Cape en cuir riche. Parchemin scelle. Dague cachee.

**Isonash (Piste)** — Ourse brune anthropomorphe, tribu Ainou. Rodeuse. Fourrure brun fonce, museau fin et attentif. Capuche verte. Arc en bois. Fleches avec pointes cristal. Camouflage ecorce/feuilles.

**Gao (Gardien)** — Suricate anthropomorphe, tribu San. Soigneur, petit et mince, posture alerte. Fourrure courte beige-fauve, grands yeux expressifs. Mains luminescentes. Sacoche d'herbes. Vetements simples en peau/tissu.

---

## 4. Layout des cartes

### Approche : Illustration plein cadre + overlay parchemin (style Everdell/Flesh and Blood)

**Decision avril 2026** : apres etude des JdS modernes (Everdell, Flesh and Blood, MTG full-art, Oath), le layout "split dur" (image en haut / texte en bas) est abandonne au profit d'un layout overlay.

**Principe** : L'illustration occupe TOUTE la carte. La zone texte est un panneau parchemin semi-opaque pose PAR-DESSUS l'illustration en bas.

- Illustration plein cadre (couvre 100% de la carte)
- Bandeau titre en haut (couleur du heros, texte blanc)
- Panneau parchemin overlay en bas (~35-40% de la hauteur) — bords irreguliers, vignettage chaud, style Everdell
- Barre stats en bas du parchemin
- Le parchemin laisse deviner l'illustration en-dessous sur ses bords (bords irreguliers + legere transparence optionnelle)

**Avantages vs split dur** :
- Illustration plus immersive (toute la carte = wow factor)
- Plus proche des standards JdS modernes
- Le parchemin donne du caractere (vs un aplat creme)
- Meilleure utilisation de l'espace

**Zone texte parchemin** : voir `Docs/prompt_bottom_texture.md` — parchemin avec bords irreguliers, vignettage burnt sienna, taches organiques style Everdell.

**Elements a generer par IA** : parchemin overlay (prompt_bottom_texture.md), icones
**Elements a creer en code** : cadre, bandeau titre, barre stats

---

## 5. Formats d'illustration

### Bloc mouvement (a ajouter a TOUT prompt de heros)

> Le mouvement vient du CORPS, pas d'effets speciaux cheap.

```
MOVEMENT EFFECTS: Fine dust and dirt kicked up from feet. Leather
straps, loincloth or cape whipping in the wind of the action. A few
dry leaves or grass blades carried in the air. The movement comes
from the BODY — torsion, legs, diagonal lean.
NO rocks, NO debris, NO floating boulders, NO shockwaves.
```

### Format unique : 2:3 (portrait vertical)

Toutes les illustrations de cartes (heros, boss, monstres) sont en **portrait 2:3**. L'illustration couvre TOUTE la carte. La zone texte est un panneau parchemin overlay en bas.

```
[BLOC STYLE] + [BLOC COULEUR] + [BLOC MOUVEMENT] +
Full body character portrait, portrait vertical 2:3 format.
Heroic proportions — tall, lean, powerful (7-8 heads tall).
NOT stocky, NOT chibi, NOT cute.
Wide shot showing full environment.
Character ~60-70% of frame, full body visible head to toe.
Character offset slightly from center, creating dynamic asymmetry.
Strong readable silhouette, must work at thumbnail size.
Dynamic narrative pose with strong diagonal composition.
Atmospheric background with depth, tinted in dominant color.
Dramatic lighting — warm golden light from one side, cool shadows
on the other. Strong warm/cold contrast.
IMPORTANT: The bottom 35% of the image will be partially covered
by a text overlay. Keep the character's key features (head, torso,
weapon) in the upper 65%. Legs/feet can extend into the lower zone.
```

### Sous-titre lore

En bas de l'illustration, une phrase courte FR + EN :
- Nawel : *« Tant qu'il tient debout, ils tiennent. »* / *« While he stands, they stand. »*
- Daraa : *« Le feu obeit a ceux qu'il a brules. »* / *« Fire obeys those it has burned. »*
- Aslan : *« Cinq tribus parlent par sa bouche. »* / *« Five tribes speak through his mouth. »*
- Isonash : *« Elle voit ce que le vent oublie. »* / *« She sees what the wind forgets. »*
- Gao : *« Il ramene les vivants chez les vivants. »* / *« He brings the living back to the living. »*

---

## 5b. Prompts complets prets-a-coller (2:3)

> Copier-coller directement dans ChatGPT. Un seul bloc par heros.

### Nawel (Rempart) — 2:3

```
Generate this image with DALL-E. Portrait vertical 2:3 format. High resolution PNG.

Narrative gouache painting on textured illustration board. Thick opaque brushstrokes clearly visible — loose, confident, varied in direction and pressure. NOT uniform, NOT smooth, NOT digital. Matte finish. Paint applied with palette knife in some areas for thick impasto texture. Visible paper grain in thin wash areas. Drips and paint splatter in margins. Style of classic hand-painted fantasy book cover illustration from the 1980s-90s. Raw, expressive, energetic brushwork. NOT digital painting, NOT airbrushed, NOT photorealistic, NOT concept art, NOT smooth gradients. The face is painted with the same loose impasto brushwork as the rest of the body — NOT smoother, NOT more polished, NOT more refined than the limbs or background.

COLOR DIRECTION: The dominant color theme is deep steel blue. 70% deep steel blue tones, 30% warm golden accents. Deep steel blue armor, shadows, background. Warm golden fur highlights provide contrast.

SUBJECT: Anthropomorphic jaguar warrior — massive, powerful feline musculature. Spotted black-on-tawny fur. Heroic proportions (7-8 heads tall), tall, lean, powerful. NOT stocky, NOT chibi. Mapuche tribal warrior: wrought iron, leather and bone armor. Massive round shield with blue geometric solar motifs held forward in his RIGHT hand, covering most of his torso. In his LEFT hand, a short FANG DAGGER — a curved blade carved from a giant predator's tooth, bone-white with a wrapped leather grip. The dagger is held low and back, trailing behind the shield in a reverse grip (blade pointing down from the fist). The left arm is partially visible behind the shield edge. Blue war paint on muzzle and cheeks. Natural amber/golden iris eyes, NOT glowing.

EXPRESSION: Low jaguar warning growl — mouth half-open showing canines, a quiet snarl not a roar. Predator announcing what's about to happen, almost casual about it.

POSE: Mid-leap charge — launching off a rocky ledge, body fully airborne, head facing forward, eyes locked on the target, jaw clenched. His RIGHT arm thrusts the shield forward, strapped tight to his forearm with leather bindings (NOT gripped with fingers — the shield is BOUND to the arm). His LEFT arm trails behind the shield, hand gripping a short FANG DAGGER in reverse grip (blade down from the fist) — a curved bone-white blade carved from a predator's tooth. Strong diagonal from bottom-left (where he leapt) to upper-right (where he flies). Full body stretched out in the air, legs extended behind, maximum sense of forward momentum.

MOVEMENT: Maximum motion energy. Fine dust cloud where he launched from the ledge. Cape and jaguar pelt streaming violently behind him, wide and dramatic. Leather straps and loincloth whipping upward from the leap. Dry leaves and grit caught in the rush of air, trailing behind his body in streaks. SPEED LINES implied through long directional brushstrokes in the background — loose parallel paint strokes following the diagonal of his leap, suggesting violent forward motion. Wind distortion: fur on his arms and mane pressed flat against the direction of travel, edges of the cape FRAYING into ragged paint strokes that dissolve into the background. The air itself is visible — thin streaks of lighter paint around his leading edge (shield and head) suggesting a shockwave of displaced air. Movement comes from EVERYTHING — the body, the background strokes, the dissolving edges.

ENVIRONMENT & COMPOSITION: HIGH CHARACTER FRAMING. Nawel's HEAD sits in the TOP 15-20% of the frame, almost touching the upper edge. The BOTTOM 40% of the frame is rocky mountain foreground in cool blue shadow — the ledge he launched from, jagged stones, dust cloud. Nawel is positioned ENTIRELY in the UPPER HALF of the frame, airborne against the stormy sky. NO part of Nawel's body extends below the 45% line. Stormy mountain landscape tinted deep steel blue. Atmospheric, suggested, not detailed. Character ~60-70% of frame. Strong directional warm golden light from one side, cool blue shadows on the other.

FINAL COMPOSITION RULE — re-emphasized: Nawel's HEAD must be in the TOP 20% of the frame. NO part of Nawel's body below the 45% line of the frame. The BOTTOM 40% must contain ONLY the rocky ledge, dust, and mountain foreground. Nawel soars ABOVE the landscape, framed against stormy sky. This is NOT a centered portrait.

Portrait orientation, 2:3 aspect ratio.
```

### Daraa (Flamme) — 2:3

```
Generate this image with DALL-E. Portrait vertical 2:3 format. High resolution PNG.

Narrative gouache painting on textured illustration board. Thick opaque brushstrokes clearly visible — loose, confident, varied in direction and pressure. NOT uniform, NOT smooth, NOT digital. Matte finish. Paint applied with palette knife in some areas for thick impasto texture. Visible paper grain in thin wash areas. Drips and paint splatter in margins. Style of classic hand-painted fantasy book cover illustration from the 1980s-90s. Raw, expressive, energetic brushwork. NOT digital painting, NOT airbrushed, NOT photorealistic, NOT concept art, NOT smooth gradients. The face is painted with the same loose impasto brushwork as the rest of the body — NOT smoother, NOT more polished, NOT more refined than the limbs or background.

COLOR DIRECTION: Crimson red and ember orange are the WARM accent colors (30%). The DOMINANT tones (70%) are deep cool shadows — dark indigo blue, charcoal black, deep violet in the shadows and background. The crimson/ember appears ONLY on: the fire magic, the feather headdress, rune glow, and robe accents. The overall image should read as DARK with RED ACCENTS, not as an all-red image.

SUBJECT: Anthropomorphic FEMALE hyena sorceress — lean, elegant, graceful. Distinctly feminine silhouette: narrow waist, longer limbs, sleek refined frame. NOT bulky, NOT brutish, NOT masculine. Short brown-grey fur, ember-colored mane flowing long and swept back like wild hair. Pointed expressive ears. Heroic proportions (7-8 heads tall), tall and slender. NOT stocky, NOT chibi. Afar tribal mage: lightweight layered robes with flowing translucent fabric that shows her silhouette, headdress with ember-colored feathers. NO staff, NO rod, NO weapon — her hands ARE the weapon. Natural dark brown eyes with warm ember reflections, NOT glowing, NOT red.

EXPRESSION: Hyena cackle — wild grin, sharp teeth showing, drunk on her own power. She just set the world on fire and finds it hilarious. Head tilted back, manic joy.

POSE: Mid-leap or levitating — both feet off the ground, body suspended in the air. Arms spread wide, palms open and facing down. Between her two hands, a sweeping HALF-CIRCLE ARC OF FIRE traces through the air — bright crimson and orange flames forming a crescent shape connecting her palms. Her body arches gracefully, back slightly curved, head tilted back with exhilarated abandon. Three-quarter view. Strong diagonal composition from one hand through the fire arc to the other. This is raw elemental power channeled with dancer-like grace.

MOVEMENT: Maximum motion energy. Robes and long mane streaming upward from the levitation and heat, edges of fabric FRAYING into ragged brushstrokes that dissolve into the dark background. Translucent fabric layers billowing dramatically around her legs. Fire arc between her hands crackles with ember sparks trailing behind the motion in long crimson streaks. Fine ash and sand pushed outward below her floating body in swirling patterns. HEAT DISTORTION: the air around her shimmers — background behind her body is warped and rippled, painted with wavy loose strokes suggesting scorching heat radiating outward. Long directional brushstrokes in the background radiate outward from her body like a heat blast. Her silhouette edges blur into embers and smoke — she is DISSOLVING into fire at the extremities. The movement is AERIAL and GRACEFUL — like a dancer mid-pirouette, not a brute smashing. NO debris, NO boulders.

ENVIRONMENT: Wide shot, full body visible. Scorched desert at twilight — dark indigo sky with crimson horizon line. Cracked earth. Volcanic silhouettes far away. Atmospheric, suggested, not detailed. Character ~60-70% of frame. Warm crimson glow from below (runes), cool indigo light from above (sky).

Portrait orientation, 2:3 aspect ratio.
```

### Aslan (Porte-Voix) — 2:3

```
Generate this image with DALL-E. Portrait vertical 2:3 format. High resolution PNG.

Narrative gouache painting on textured illustration board. Thick opaque brushstrokes clearly visible — loose, confident, varied in direction and pressure. NOT uniform, NOT smooth, NOT digital. Matte finish. Paint applied with palette knife in some areas for thick impasto texture. Visible paper grain in thin wash areas. Drips and paint splatter in margins. Style of classic hand-painted fantasy book cover illustration from the 1980s-90s. Raw, expressive, energetic brushwork. NOT digital painting, NOT airbrushed, NOT photorealistic, NOT concept art, NOT smooth gradients.

COLOR DIRECTION: The dominant color theme is warm sienna brown and gold. 70% sienna/gold tones, 30% cool blue-grey shadow accents. Golden mane, sienna cape, warm-toned architecture. Cool blue-grey shadows provide depth.

SUBJECT: Anthropomorphic lion diplomat — majestic, commanding presence. Thick luxurious golden mane, tawny fur. Heroic proportions (7-8 heads tall), tall, proud bearing. NOT stocky, NOT chibi. Circassian-inspired noble: rich leather cape with ornate clasps, light ceremonial armor underneath. Sealed scroll/parchment held forward in one hand. Hidden dagger at belt. Natural warm amber iris eyes, NOT glowing.

POSE: Striding forward with authority, one hand raised holding the sealed scroll as if presenting terms. Cape billowing behind. Strong posture — shoulders back, chin slightly raised. Diagonal composition from trailing cape to outstretched scroll.

MOVEMENT: Cape sweeping dramatically in wind. Mane flowing. Fine dust from his confident stride. A few parchment fragments or leaves caught in the wind. Movement from the STRIDE and the cape, not from effects. NO debris, NO shockwaves.

ENVIRONMENT: Wide shot, full body visible head to toe. Ancient stone architecture (columns, arches) tinted in warm sienna. Torch light. Atmospheric, suggested, not detailed. Character ~60-70% of frame. Strong warm golden torchlight from one side, cool blue-grey shadows on the other.

Portrait orientation, 2:3 aspect ratio.
```

### Isonash (Piste) — 2:3

```
Generate this image with DALL-E. Portrait vertical 2:3 format. High resolution PNG.

Narrative gouache painting on textured illustration board. Thick opaque brushstrokes clearly visible — loose, confident, varied in direction and pressure. NOT uniform, NOT smooth, NOT digital. Matte finish. Paint applied with palette knife in some areas for thick impasto texture. Visible paper grain in thin wash areas. Drips and paint splatter in margins. Style of classic hand-painted fantasy book cover illustration from the 1980s-90s. Raw, expressive, energetic brushwork. NOT digital painting, NOT airbrushed, NOT photorealistic, NOT concept art, NOT smooth gradients. The face is painted with the same loose impasto brushwork as the rest of the body — NOT smoother, NOT more polished, NOT more refined than the limbs or background.

COLOR DIRECTION: The dominant color theme is deep emerald green. The background is a BRIGHT OPEN forest — warm golden-green canopy light, soft amber haze between the trunks, visible sky gaps of warm cream-gold. NOT a dark cave, NOT near-black. Think sunlit old-growth forest with shafts of warm light. The trunk she slides on is PALE — light grey birch-like bark, almost white. Against this bright warm background, Isonash's dark brown fur and deep emerald attush robe stand out clearly. Strong warm amber rim light from a canopy gap behind her outlines her silhouette. 40% warm bright forest background, 30% emerald green on character, 20% pale trunk, 10% amber rim light.

SUBJECT: Anthropomorphic brown bear — clearly FEMALE, unmistakably feminine. Narrow waist cinched by a woven belt, wider hips, long elegant limbs, leaner and more slender than a male bear. Graceful S-curve posture even while sliding down the trunk — spine arched, one hip slightly cocked. Think female gymnast or dancer, not wrestler. Dark brown fur, REFINED NARROW MUZZLE with softer rounder features than a male bear — smaller nose, larger expressive eyes, more delicate jaw line. Long eyelashes visible. Heroic proportions (7-8 heads tall), tall and lean. NOT stocky, NOT chibi, NOT cute, NOT masculine, NOT bulky, NOT square-jawed. AINU TRADITIONAL CLOTHING (NOT generic fantasy): an ATTUSH robe — woven elm-bark textile with a rough organic weave texture, dyed deep forest green, open at the front for movement. Bold geometric Ainu embroidery along all edges and hems — protective spiral patterns, S-curves, lozenges, and angular "thorned" designs in cream and dark teal thread. A MATANPUSHI (embroidered headband) across her forehead with dense geometric needlework, partially hidden under her hood. A TAMASAY (long beaded necklace) with large glass beads hanging to her chest, swinging from the leap. Large brass NINKARI hoop earrings catching the light. Crystal-tipped arrows in a quiver on her back. Natural dark amber iris eyes, NOT glowing.

EXPRESSION: Confident hunter's smirk — a visible SMILE, one corner of her mouth lifted higher than the other. Eyes open, looking DOWN at prey below. She's enjoying this. The hunt is her element and she knows she's the best at it. NOT serious, NOT angry — AMUSED. Think Aloy spotting a machine she's about to take down.

POSE: SLIDING DOWN a massive vertical tree trunk — body in strong diagonal, feet bracing against the bark, ONE hand clawing into the trunk to control the descent, the other arm trailing free behind her. NO bow visible — only the quiver of arrows on her back. Her body follows the trunk's vertical line, angled slightly outward, weight committed to the slide. Strong top-to-bottom diagonal composition. She is DESCENDING — gravity pulls her DOWN. NOT standing, NOT posing, NOT static.

MOVEMENT: Everything in the image screams DOWNWARD MOTION. Her claws have left long VERTICAL SCRATCH MARKS gouged into the bark ABOVE her — four parallel lines showing her descent path like speed lines. A cloud of BARK DUST and wood chips sprays outward from her gripping hand. Her cape and attush robe are BLOWN STRAIGHT UP above her head — fabric stretched vertical by the rush of air, flapping violently upward. Tamasay necklace lifted upward, beads floating. Ninkari earrings pulled up. ALL her fur is blown upward against gravity — every strand points UP. Dozens of loose LEAVES and moss chunks ripped from the trunk are swirling ABOVE her in a debris trail, fanning outward. Fine dust and bark particles fill the air around her in a haze. The forest floor below her is still FAR — she has a long way to fall. The movement is SILENT BUT FAST — a predator dropping on prey, no warning.

ENVIRONMENT & COMPOSITION: HIGH CHARACTER FRAMING. Isonash's HEAD sits in the TOP 15-20% of the frame. She is sliding down the trunk from the UPPER portion of the image — her gripping hand is near the top of the frame, her feet are around the 50% line. The BOTTOM 40% shows the trunk continuing downward into dark forest floor — roots, ferns, deep shadow. The trunk she slides on runs from upper-right to lower-left, dominating the frame. Dense ancient forest tinted deep emerald green. Amber light filtering through canopy above. Atmospheric, suggested, not detailed. Character ~60-70% of frame.

FINAL COMPOSITION RULE: Isonash's HEAD in the TOP 20%. Her body occupies the UPPER HALF of the frame. The BOTTOM 40% is empty trunk and dark forest floor. She is HIGH on the tree, not near the ground. This is NOT a centered portrait.

Portrait orientation, 2:3 aspect ratio.
```

### Gao (Gardien) — 2:3

```
Generate this image with DALL-E. Portrait vertical 2:3 format. High resolution PNG.

Narrative gouache painting on textured illustration board. Thick opaque brushstrokes clearly visible — loose, confident, varied in direction and pressure. NOT uniform, NOT smooth, NOT digital. Matte finish. Paint applied with palette knife in some areas for thick impasto texture. Visible paper grain in thin wash areas. Drips and paint splatter in margins. Style of classic hand-painted fantasy book cover illustration from the 1980s-90s. Raw, expressive, energetic brushwork. NOT digital painting, NOT airbrushed, NOT photorealistic, NOT concept art, NOT smooth gradients. The face is painted with the same loose impasto brushwork as the rest of the body — NOT smoother, NOT more polished, NOT more refined than the limbs or background.

COLOR DIRECTION: A balanced 50/50 split between WARM and COOL. The WARM half (50%): Gao's golden-lit beige-tawny fur with strong rim light along his upper edges, the medicinal plant in his trailing hand catching golden rim-light, the soft golden glow pooling in his upturned palm, AND a wide bloom of warm sunrise glow concentrated in a horizontal band ABOVE the high horizon line in the upper-middle of the frame (visible just above the lower foreground). The COOL half (50%): the upper sky in cool indigo-teal at the top of the frame, cool blue-violet shadows on the rocky foreground, cool blue-grey acacia silhouettes in contre-jour. Sunrise is actively unfolding from a horizon that sits high in the frame — the warmest most saturated colors are clustered just above the horizon line, NOT at the bottom of the image. The image reads as a sunrise — warm AND cool in equal measure, NOT all-yellow, NOT all-cool.

SUBJECT: Anthropomorphic meerkat healer — small, lean and wiry. Short beige-tawny fur, large dark eyes. Heroic proportions (7-8 heads tall) despite small frame. NOT stocky, NOT chibi, NOT cute-mascot. San tribal healer: simple leather and cloth garments, herb pouch at hip, bandolier of small medicine bottles. Natural large dark eyes with warm golden reflections, NOT glowing unnaturally. SAN HEALER FACE MARKINGS (important for icon visibility): a BOLD horizontal stripe of warm YELLOW OCHRE pigment painted across his forehead just above the brow line, plus two smaller yellow ochre dots high on the cheekbones below each eye. The yellow ochre markings are saturated, opaque, clearly readable against his beige-tawny fur, and large enough to be visible at small thumbnail size. These ritual markings identify him as the Warden / healer of his tribe.

EXPRESSION: Alert meerkat focus — a healer rushing to save someone. Calm inside the urgency, NOT angry, NOT serene. Ears forward, eyes locked ahead.

POSE: Mid-leap diagonal bound across a rocky ridge, body stretched out at a slight upward diagonal in three-quarter profile view. His LEFT arm is raised forward and upward, palm OPEN AND TURNED TO FACE THE SKY in a receiving cup gesture (palm-up bowl, fingers naturally cupped together, NOT splayed, NOT counting individual fingers) — as if cradling the dawn light itself. A soft warm golden glow naturally pools in the cup of his upturned palm, fed by the surrounding sunrise ambience, NOT by any directional beam from above. There is NO ray of light descending from the sky into his palm. The healing is conveyed by the rim lighting, the warmth bathing him from the horizon, and the dawn glow he carries in his palm — the sunrise itself is the source. His RIGHT arm trails behind him, hand clearly gripping a single small bundle of dried medicinal herbs — a compact sprig of grey-green sage-like leaves bound at the base with simple twine cord. The leaves rise above his closed fist, catching warm golden rim light, NOT scattering, NOT crushed, NOT burning. CLOSED FIST around the plant stem, fingers bunched tight together, NOT splayed, NOT counting individual fingers. Rear foot still in contact with the back edge of the rocky outcrop, pushing off; front foot already in the air. Head oriented forward toward where he is rushing, eyes locked on his unseen goal. Strong horizontal/diagonal body stretch from the upturned palm forward to the trailing plant hand at the rear. Single character — ONE subject in the frame, no second figure, no ally visible.

MOVEMENT: Strong directional rim light from the rising sun (off-frame to the right at horizon level) glows golden along the upper and right edges of Gao's body — the top of his head, his shoulders, his outstretched arm, the leaves of the plant, the cloth garments. Backlit and silhouetted slightly against the sky behind him. A soft warm golden glow pools in his upturned palm, like the dawn itself collecting there — diffuse, particle-laden at the edges, fading outward into nothing. NO directional beam, NO ray from the sky, NO shaft of light, NO vertical light element connecting sky to palm. The trailing plant in the back hand stays intact — only a few loose dried leaves shaken free by the leap drift behind in the slipstream. Loose cloth garments whip behind the body from the leap, the bandolier of medicine bottles pressed against his chest from the forward rush. Fine cool-toned dust kicked up from the rear foot where it pushes off the rock. The motion comes from the BODY — the diagonal leap, the upward-reaching arm, the forward stretch. Movement is URGENT and PURPOSEFUL — a rescuer rushing. NO shockwaves, NO debris, NO floating boulders, NO energy beams of any kind.

ENVIRONMENT & COMPOSITION: HIGH HORIZON LANDSCAPE FRAMING. The HORIZON LINE sits HIGH in the frame, at approximately 55-60% from the top. The UPPER 55-60% of the image is dawn sky: cool indigo-teal at the very top of the frame, warming downward into a wide blooming GOLDEN SUNRISE BAND of saturated warm color clustered just above the horizon line (at roughly the 45-55% line of the frame). The warmest, most beautiful color transition is here, in the upper-middle of the image, NOT at the bottom. ACACIA SILHOUETTES in contre-jour stand far in the distance on the horizon, against the warm sky band. The LOWER 40-45% of the image is darker rocky foreground terrain — a jagged stone ridge, scrub, dust, scattered savanna foliage in cool blue-violet shadow. Gao is leaping ACROSS the high ridge and is positioned ENTIRELY in the UPPER HALF of the frame, silhouetted and rim-lit against the warm sunrise sky behind him, NOT against the ground. His HEAD sits in the TOP 15-20% of the frame, almost touching the upper edge. His upturned palm is in the upper portion of the frame. His pushing-off rear foot is just clearing the ridge near the 45-50% line. NO part of Gao's body extends below the 50% line. Strong directional rim light from the rising sun (off-frame to the right at horizon level) glows golden along the upper and right edges of his body, the plant in his trailing hand, and his cloth garments. Backlit. Kalahari savanna at active sunrise. Atmospheric, suggested, not detailed. Character ~60-70% of frame size, ENTIRELY in the upper half. The composition reads HEROIC and AERIAL — Gao soars above the world, the dawn behind him.

FINAL COMPOSITION RULE — re-emphasized: Gao's HEAD must be in the TOP 20% of the frame. NO part of Gao's body below the 50% line of the frame. The BOTTOM 45% of the frame must contain ONLY the rocky ridge and ground foreground, with NO character in it. The warm golden sunrise color transition must sit in the UPPER-MIDDLE of the frame (around the 45-55% line), NOT at the bottom of the image. Gao is centered horizontally but pushed HIGH vertically. NO descending vertical light ray, NO shaft of light from the sky into his palm — the sun and its glow are at horizon level off-frame to the right, not above. This is NOT a centered eye-level portrait.

Portrait orientation, 2:3 aspect ratio.
```

---

## 5. Autres types d'assets

### Monstres

```
[BLOC STYLE] +
Creature in natural habitat, mid-action threatening pose.
Dominant color: crimson red + charcoal black shadows.
Red on: eyes, claws, blood, hostile magic, corruption marks.
Emphasis on menacing silhouette over anatomical detail.
Fantasy adventure tone, not survival horror.
Must feel dangerous but defeatable.
Loose, aggressive brushwork — more chaotic than hero illustrations.
```

### Epreuves (scenes/lieux)

```
[BLOC STYLE] +
Environmental wide shot, NO prominent characters.
Dominant tones: dark, moody, desaturated with one color accent.
Red accent on: danger element (trap, glow, blood, hostile magic).
Strong mood lighting from a single dominant light source.
Invites the viewer into the scene, suggests narrative and danger.
Loose rendering in periphery, detail concentrated on focal point.
```

### Icones (symboles de gameplay)

> **Les icones ne sont PAS en style gouache.** Elles utilisent un style clean/stylise distinct des illustrations. Voir `icon_design.md` pour les prompts complets.

```
Clean stylized game icon, smooth surface, NO brushstrokes,
NO texture, NO grain. Soft gradients for volume, subtle
highlights, slightly glossy finish. Bold simple shapes,
highly readable at small size. Centered composition,
transparent background. Consistent modern UI icon style.
```

---

## 6. Post-traitement obligatoire

Apres chaque generation, verifier dans l'ordre :

1. **Proportions** — Le personnage doit avoir des proportions heroiques (7-8 tetes). Si trop trapu/chibi, re-generer.

2. **Couleur dominante** — La couleur du heros doit dominer l'image (~70%). Si absente ou trop faible, re-generer.

3. **Mains/pattes** — Verifier que les mains tenant des objets ne sont pas deformees. Si probleme, re-generer avec moins d'objets tenus.

4. **Pose** — Doit etre dynamique, asymetrique, avec du mouvement. Rejeter les poses statiques frontales.

5. **Contraste figure/fond** — Le personnage doit se detacher clairement. Assombrir le fond ou augmenter le contraste si necessaire.

6. **Test taille carte** — Reduire l'image a 6cm de large. La silhouette et le personnage doivent rester identifiables.

### Post-traitement anti-IA (via shader Unity)

Un shader UI/Sprite applique sur toutes les illustrations pour uniformiser le rendu et masquer l'origine IA :

1. **Overlay texture toile** :
   - Texture de toile/papier epais en mode Multiply, opacite ~10-15%
   - Simule un support physique sous la peinture

2. **Grain/bruit** :
   - Noise Perlin ou film grain, opacite ~5-10%
   - Casse la regularite "trop parfaite" des surfaces IA

3. **Displacement UV subtil** :
   - Displacement map basee sur une texture de brushstrokes
   - Decalage de 1-3px — tord legerement les pixels comme si la peinture etait sur une surface irreguliere
   - Effet le plus efficace pour casser le rendu IA

4. **Color grading** :
   - Legere desaturation globale (~10%) pour un rendu plus "pigment reel"
   - Pousser la teinte vers la couleur dominante du heros

---

## 7. Points de vigilance ChatGPT / DALL-E

### Problemes recurrents et solutions

- **Proportions trapues/chibi** : DALL-E tend a faire des personnages courts et larges. Toujours specifier "heroic proportions, 7-8 heads tall, tall lean powerful, NOT stocky NOT chibi NOT cute".
- **Poses statiques** : DALL-E genere souvent des poses frontales plates. Decrire une action precise avec transfert de poids, diagonales, mouvement ("lunging forward", "weight shifting", "swinging in a wide arc").
- **Couleur dominante absente** : DALL-E peut ignorer la direction couleur. Ajouter un bloc COLOR DIRECTION explicite avec des pourcentages ("70% blue tones, 30% warm accents").
- **Mains/pattes deformees** : Probleme majeur quand le personnage tient des objets. **Solution : un seul objet en main max.** Privilegier le bouclier seul (l'objet le plus iconique). Cacher l'arme ou la mettre dans le dos/ceinture.
- **Armes deformees** : Les armes tenues sont souvent bizarres (lame tordue, manche deforme). Mieux vaut ne pas montrer l'arme ou la montrer rangee/dans le dos.
- **Brushstrokes trop uniformes** : Insister sur "varied in direction and pressure", "palette knife in some areas", "drips and paint splatter". Ajouter "NOT uniform" explicitement.
- **Format** : DALL-E genere en 1024x1024, 1024x1792, ou 1792x1024. Pour le portrait 2:3 on obtient ~1024x1792.
- **Ne JAMAIS nommer** de jeu (MTG, Hearthstone, Root) ou d'artiste protege dans le prompt.
- **Anti-IA** : le post-traitement Unity (overlay toile + grain + displacement) est le meilleur outil. Toujours l'appliquer.

### Checklist avant validation d'une illustration

- [ ] Proportions heroiques (pas trapu/chibi)
- [ ] Pose dynamique et interessante
- [ ] Couleur dominante du heros bien presente (~70%)
- [ ] Mains/pattes correctes (pas de deformation)
- [ ] Objet(s) tenu(s) non deforme(s) — sinon re-generer sans
- [ ] Silhouette lisible a 6cm de large
- [ ] Brushstrokes varies et expressifs

---

## 8. Historique des decisions

| Date | Decision |
|---|---|
| 2026-04-09 | Style gravure retenu apres test sur le Guerrier generique. |
| 2026-04-10 | Fond gris-beige plat. Ajout fonds de carte colores et cadres woodcut. |
| 2026-04-11 | Test impasto/huile epaisse suite au changement d'univers tribal. Premier test Nawel concluant. |
| 2026-04-12 | Adoption 2 formats : verso 2:3 + recto 3:2. Sous-titres lore FR/EN. (abandonne le 14/04 — format unique 2:3) |
| 2026-04-12 | Refonte bloc style impasto (Afremov, Van Gogh references). |
| 2026-04-13 | Test risograph sur Nawel jaguar : trop cartoon/blocky, detectablement IA. |
| 2026-04-13 | Test gouache narrative sur Nawel jaguar : bien meilleur rendu, style "peint a la main". Problemes : proportions trapues, pose statique, couleur bleue absente, arme/mains deformees. |
| 2026-04-13 | **Abandon risograph.** Adoption style **Gouache narrative**. Raisons : plus beau, meilleur "wow factor", fonctionne bien avec animaux anthropomorphes, masquage IA correct avec post-traitement. |
| 2026-04-13 | Lecons IA : specifier proportions heroiques, decrire des poses dynamiques precises, forcer la couleur dominante avec un bloc COLOR DIRECTION explicite, limiter a 1 objet en main (bouclier OU arme, pas les deux). |
| 2026-04-13 | Nawel (recto) valide apres 8 iterations : jaguar en shield-bash aerien, bouclier Mapuche en avant, style gouache, composition diagonale. Prompt final conserve comme reference. |
| 2026-04-13 | Lecons supplementaires : PAS de debris/rochers pour suggerer le mouvement (fait cheap). Preferer des elements legers : poussiere fine, feuilles/herbes emportees, cape/lanieres qui fouettent. Le mouvement doit venir du CORPS (jambes, torsion, diagonal) pas d'effets. Les yeux glowing jaunes sont un tell IA recurrent — specifier "natural amber/golden iris, NOT glowing". |
| 2026-04-13 | **Abandon layout split dur.** Adoption layout **overlay** (style Everdell/Flesh and Blood). L'illustration couvre toute la carte, le parchemin texte est pose par-dessus en bas. Raisons : plus immersif, plus moderne, meilleur wow factor. Etude des JdS (Everdell, Flesh and Blood, MTG full-art, Oath) confirme que c'est le standard actuel. |
| 2026-04-13 | Texture zone texte : apres tests, la texture de toile/canvas est inutile — les JdS utilisent un fond propre. Le parchemin Everdell extrait du PSD officiel confirme : fond creme plat + bords irreguliers + vignettage chaud burnt sienna. Pas de texture de fibre visible. |
| 2026-04-13 | Prompts complets prets-a-coller ecrits pour les 5 heros (verso 2:3). Incluent : bloc style gouache, bloc couleur, bloc mouvement (poussiere, lanieres, feuilles — pas de debris), description physique, pose specifique, environnement. |
| 2026-04-14 | **Format unique 2:3 portrait** pour toutes les illustrations (heros, boss, monstres). Abandon du recto 3:2 et du 1:1. |
