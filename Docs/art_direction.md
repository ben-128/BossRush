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

Narrative gouache painting on textured illustration board. Thick opaque brushstrokes clearly visible — loose, confident, varied in direction and pressure. NOT uniform, NOT smooth, NOT digital. Matte finish. Paint applied with palette knife in some areas for thick impasto texture. Visible paper grain in thin wash areas. Drips and paint splatter in margins. Style of classic hand-painted fantasy book cover illustration from the 1980s-90s. Raw, expressive, energetic brushwork. NOT digital painting, NOT airbrushed, NOT photorealistic, NOT concept art, NOT smooth gradients.

COLOR DIRECTION: The dominant color theme is deep steel blue. 70% deep steel blue tones, 30% warm golden accents. Deep steel blue armor, shadows, background. Warm golden fur highlights provide contrast.

SUBJECT: Anthropomorphic jaguar warrior — massive, powerful feline musculature. Spotted black-on-tawny fur. Heroic proportions (7-8 heads tall), tall, lean, powerful. NOT stocky, NOT chibi. Mapuche tribal warrior: wrought iron, leather and bone armor. Massive round shield with blue geometric solar motifs held forward. Blue war paint on muzzle and cheeks. Natural amber/golden iris eyes, NOT glowing.

POSE: Dynamic aerial shield-bash lunge, weight shifting dramatically, strong diagonal composition. Body twisting with the force of the charge. One foot off the ground.

MOVEMENT: Fine dust kicked up from feet. Leather straps and loincloth whipping in wind. A few dry leaves carried in the air. Movement comes from the BODY torsion and diagonal lean. NO rocks, NO debris, NO floating boulders.

ENVIRONMENT: Wide shot, full body visible head to toe. Stormy mountain landscape tinted deep steel blue. Atmospheric, suggested, not detailed. Character ~60-70% of frame. Strong directional warm golden light from one side, cool blue shadows on the other.

Portrait orientation, 2:3 aspect ratio.
```

### Daraa (Flamme) — 2:3

```
Generate this image with DALL-E. Portrait vertical 2:3 format. High resolution PNG.

Narrative gouache painting on textured illustration board. Thick opaque brushstrokes clearly visible — loose, confident, varied in direction and pressure. NOT uniform, NOT smooth, NOT digital. Matte finish. Paint applied with palette knife in some areas for thick impasto texture. Visible paper grain in thin wash areas. Drips and paint splatter in margins. Style of classic hand-painted fantasy book cover illustration from the 1980s-90s. Raw, expressive, energetic brushwork. NOT digital painting, NOT airbrushed, NOT photorealistic, NOT concept art, NOT smooth gradients.

COLOR DIRECTION: Crimson red and ember orange are the WARM accent colors (30%). The DOMINANT tones (70%) are deep cool shadows — dark indigo blue, charcoal black, deep violet in the shadows and background. The crimson/ember appears ONLY on: the fire magic, the feather headdress, rune glow, and robe accents. The overall image should read as DARK with RED ACCENTS, not as an all-red image.

SUBJECT: Anthropomorphic FEMALE hyena sorceress — lean, elegant, graceful. Distinctly feminine silhouette: narrow waist, longer limbs, sleek refined frame. NOT bulky, NOT brutish, NOT masculine. Short brown-grey fur, ember-colored mane flowing long and swept back like wild hair. Pointed expressive ears. Heroic proportions (7-8 heads tall), tall and slender. NOT stocky, NOT chibi. Afar tribal mage: lightweight layered robes with flowing translucent fabric that shows her silhouette, headdress with ember-colored feathers. NO staff, NO rod, NO weapon — her hands ARE the weapon. Natural dark brown eyes with warm ember reflections, NOT glowing, NOT red.

POSE: Mid-leap or levitating — both feet off the ground, body suspended in the air. Arms spread wide, palms open and facing down. Between her two hands, a sweeping HALF-CIRCLE ARC OF FIRE traces through the air — bright crimson and orange flames forming a crescent shape connecting her palms. Her body arches gracefully, back slightly curved, head tilted with fierce concentration. Three-quarter view. Strong diagonal composition from one hand through the fire arc to the other. This is raw elemental power channeled with dancer-like grace.

MOVEMENT: Robes and long mane streaming upward from the levitation and heat. Translucent fabric layers billowing dramatically around her legs. Fire arc between her hands crackles with ember sparks trailing behind the motion. Fine ash and sand pushed outward below her floating body. The movement is AERIAL and GRACEFUL — like a dancer mid-pirouette, not a brute smashing. NO debris, NO boulders.

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

Narrative gouache painting on textured illustration board. Thick opaque brushstrokes clearly visible — loose, confident, varied in direction and pressure. NOT uniform, NOT smooth, NOT digital. Matte finish. Paint applied with palette knife in some areas for thick impasto texture. Visible paper grain in thin wash areas. Drips and paint splatter in margins. Style of classic hand-painted fantasy book cover illustration from the 1980s-90s. Raw, expressive, energetic brushwork. NOT digital painting, NOT airbrushed, NOT photorealistic, NOT concept art, NOT smooth gradients.

COLOR DIRECTION: The dominant color theme is deep emerald green. 70% emerald green tones, 30% warm amber light accents. Green hood, green foliage, green-toned shadows. Warm amber light filtering through canopy provides contrast.

SUBJECT: Anthropomorphic brown bear ranger (female) — strong but agile, alert posture. Dark brown fur, attentive refined muzzle. Heroic proportions (7-8 heads tall), tall and lean. NOT stocky, NOT chibi, NOT cute. Ainu-inspired ranger: green hooded cloak with bark and leaf camouflage. Wooden longbow in one hand, arrow nocked but not drawn. Crystal-tipped arrows in quiver. Embroidered patterns on cloak edges. Natural dark amber iris eyes, NOT glowing.

POSE: Mid-stalk — crouching slightly, moving through dense forest. One foot forward, weight low. Bow held ready at her side. Head turned, ears perked, scanning. Strong diagonal from the bow line to her gaze direction. Tension and readiness, not action.

MOVEMENT: Cloak trailing and catching on branches. Leaves disturbed by her passage floating in the air. Ferns bending where she steps. Subtle forest atmosphere — mist, dappled light. Movement is QUIET — suggested by displaced foliage, not explosive. NO debris, NO shockwaves.

ENVIRONMENT: Wide shot, full body visible head to toe. Dense ancient forest tinted deep emerald green. Massive tree trunks, filtered amber light from above. Atmospheric, suggested, not detailed. Character ~60-70% of frame. Warm amber light from canopy gaps, cool green shadows.

Portrait orientation, 2:3 aspect ratio.
```

### Gao (Gardien) — 2:3

```
Generate this image with DALL-E. Portrait vertical 2:3 format. High resolution PNG.

Narrative gouache painting on textured illustration board. Thick opaque brushstrokes clearly visible — loose, confident, varied in direction and pressure. NOT uniform, NOT smooth, NOT digital. Matte finish. Paint applied with palette knife in some areas for thick impasto texture. Visible paper grain in thin wash areas. Drips and paint splatter in margins. Style of classic hand-painted fantasy book cover illustration from the 1980s-90s. Raw, expressive, energetic brushwork. NOT digital painting, NOT airbrushed, NOT photorealistic, NOT concept art, NOT smooth gradients.

COLOR DIRECTION: The dominant color theme is warm golden yellow. 70% golden yellow tones, 30% cool green/earth accent tones. Golden light, golden savanna, warm-toned everything. Cool earth and green tones in shadows provide grounding.

SUBJECT: Anthropomorphic meerkat healer — small, thin, alert upright posture. Short beige-tawny fur, very large expressive dark eyes. Heroic proportions (7-8 heads tall), lean and wiry despite small frame. NOT stocky, NOT chibi, NOT cute-mascot. San tribal healer: simple leather and cloth garments, herb pouch at hip, bandolier of small medicine bottles. Hands luminescent with warm golden healing light. Natural large dark eyes with golden reflections, NOT glowing unnaturally.

POSE: Standing alert on a rocky outcrop, hands raised and emanating warm healing light. One foot on higher ground, the other on lower — dynamic level difference. Body slightly twisted, looking over shoulder as if protecting someone behind him. Sacred symbols float faintly in the healing glow.

MOVEMENT: Healing light radiating softly from open palms. Herb pouch swaying. Simple cloth garments ruffling in warm savanna breeze. Dry grass bending around his feet. The energy is GENTLE — warm, protective, not explosive. NO shockwaves, NO debris.

ENVIRONMENT: Wide shot, full body visible head to toe. Kalahari savanna at golden hour, tinted warm golden yellow. Flat horizon, scattered acacia trees, vast sky. Atmospheric, suggested, not detailed. Character ~60-70% of frame. Strong warm golden sunlight, cool earth-toned shadows.

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
