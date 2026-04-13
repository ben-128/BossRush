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
| `{{FORMAT}}` | Ratio de l'image | `Landscape orientation, 3:2 aspect ratio.` ou `Portrait orientation, 2:3 aspect ratio.` |

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

### Approche : Cadre dur + panneau opaque (style Root/Everdell)

Voir `card_frame_templates.md` pour les dimensions et prompts de chaque element.

**Principe** : Separation nette entre illustration et texte. Pas de chevauchement.
- Bandeau titre en couleur du heros (texte blanc)
- Illustration plein cadre
- Barre de separation coloree avec motif tribal central
- Zone texte fond creme opaque (#F2E8D5)
- Barre stats en bas

**Elements a generer par IA** : barre de separation (motif tribal), icones
**Elements a creer en code** : cadre, bandeau titre, fond texte, barre stats (plus fiable)

---

## 5. Formats d'illustration

### Recto — Format 3:2 (paysage, zone illustration carte)

C'est l'image **fonctionnelle** : on l'utilise pendant le jeu. Sera croppee a 795x500px.

```
[BLOC STYLE] + [BLOC COULEUR] +
Full body character, landscape 3:2 format.
Heroic proportions — tall, lean, powerful (7-8 heads tall).
NOT stocky, NOT chibi, NOT cute.
Character offset slightly from center, creating dynamic asymmetry.
Dominant in frame (~65-70%).
Strong readable silhouette, must work at thumbnail size.
Dynamic mid-action pose — weight shifting, muscles tensed, movement.
Atmospheric background in dominant color tones — suggested, not detailed.
All body parts within center 80% horizontally.
Strong directional lighting creating high contrast.
```

### Verso — Format 2:3 (portrait vertical)

C'est l'image **hero** : celle qu'on regarde et qu'on retient.

```
[BLOC STYLE] + [BLOC COULEUR] +
Full body character portrait, portrait vertical 2:3 format.
Heroic proportions — tall, lean, powerful (7-8 heads tall).
Wide shot showing full environment.
Character ~60-70% of frame, full body visible head to toe.
Dynamic narrative pose with strong diagonal composition.
Atmospheric background with depth (landscape, ruins, mountains, sky).
Environment tinted in dominant color.
Dramatic lighting, strong warm/cold contrast.
```

### Sous-titre lore (verso uniquement)

En bas de l'illustration verso, une phrase courte FR + EN :
- Nawel : *« Tant qu'il tient debout, ils tiennent. »* / *« While he stands, they stand. »*
- Daraa : *« Le feu obeit a ceux qu'il a brules. »* / *« Fire obeys those it has burned. »*
- Aslan : *« Cinq tribus parlent par sa bouche. »* / *« Five tribes speak through his mouth. »*
- Isonash : *« Elle voit ce que le vent oublie. »* / *« She sees what the wind forgets. »*
- Gao : *« Il ramene les vivants chez les vivants. »* / *« He brings the living back to the living. »*

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

```
Bold painted game icon, gouache style.
{{COULEUR_HERO}} on off-white textured background.
Clean readable silhouette with visible brushstroke texture.
MUST be instantly readable at 1cm x 1cm print size.
Bold, simple, graphic. Slight paint texture visible.
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
- **Format** : DALL-E genere en 1024x1024, 1024x1792, ou 1792x1024. Pour le paysage 3:2 on obtient ~1792x1024.
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
| 2026-04-12 | Adoption 2 formats : verso 2:3 + recto 3:2. Sous-titres lore FR/EN. |
| 2026-04-12 | Refonte bloc style impasto (Afremov, Van Gogh references). |
| 2026-04-13 | Test risograph sur Nawel jaguar : trop cartoon/blocky, detectablement IA. |
| 2026-04-13 | Test gouache narrative sur Nawel jaguar : bien meilleur rendu, style "peint a la main". Problemes : proportions trapues, pose statique, couleur bleue absente, arme/mains deformees. |
| 2026-04-13 | **Abandon risograph.** Adoption style **Gouache narrative**. Raisons : plus beau, meilleur "wow factor", fonctionne bien avec animaux anthropomorphes, masquage IA correct avec post-traitement. |
| 2026-04-13 | Lecons IA : specifier proportions heroiques, decrire des poses dynamiques precises, forcer la couleur dominante avec un bloc COLOR DIRECTION explicite, limiter a 1 objet en main (bouclier OU arme, pas les deux). |
| 2026-04-13 | Nawel (recto) valide apres 8 iterations : jaguar en shield-bash aerien, bouclier Mapuche en avant, style gouache, composition diagonale. Prompt final conserve comme reference. |
| 2026-04-13 | Lecons supplementaires : PAS de debris/rochers pour suggerer le mouvement (fait cheap). Preferer des elements legers : poussiere fine, feuilles/herbes emportees, cape/lanieres qui fouettent. Le mouvement doit venir du CORPS (jambes, torsion, diagonal) pas d'effets. Les yeux glowing jaunes sont un tell IA recurrent — specifier "natural amber/golden iris, NOT glowing". |
