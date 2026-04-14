# Dos de Cartes - Raid Party

> Fond commun + declinaison par type de carte, avec emplacement central pour icone de type.

---

## Concept

Un dos de carte unique et reconnaissable pour Raid Party, decline en 6 variantes (une par type de carte). Le design evoque un **objet rituel tribal** : peau tannee, os grave, pigment mineral. Pas du heroic fantasy generique — c'est primitif, tactile, organique.

**Structure commune :**
- Bordure exterieure : motif geometrique tribal (knotwork primitif, pas celtique)
- Zone centrale : espace vide circulaire/ovale pour l'icone de type
- Texture de fond : peau/cuir tanné avec pigments mineraux
- Pas de titre / nom du jeu sur le dos

**Variations par type :**
- Couleur dominante du pigment
- Motif de bordure legerement different (mais meme structure)
- Icone centrale differente

---

## Les 6 types de cartes

| Type | Couleur pigment | Motif bordure | Icone centrale |
|------|----------------|---------------|----------------|
| **Heros** | Ocre dore | Empreintes de pattes entrelacees | Masque tribal (ovale + 2 yeux vides) |
| **Menace** | Rouge sang seche | Lignes brisees / zigzag | Nuage d'orage (nuage + eclair) |
| **Chasse** | Vert mousse | Feuilles et branches stylisees | Pierre taillee / silex |
| **Monstre** | Violet cendre | Griffures paralleles | Croc / dent isolee |
| **Colosse** | Noir charbon | Motif de fissures / craquelures | Crane massif de bete |
| **Destin** | Bleu nuit | Spirales concentriques | Spirale / tourbillon |

---

## Prompt — Fond commun (template de base)

> Ce prompt genere le dos SANS l'icone centrale. L'icone sera superposee en Unity.

```
Generate this image with DALL-E. Portrait vertical 2:3 format. High resolution PNG.

STYLE: Flat lay photograph of a piece of treated animal hide,
viewed from directly above. The hide is thick, slightly uneven,
with visible grain and natural imperfections — small scars,
variations in thickness, subtle wrinkles.
The surface has been prepared with mineral pigments in {{COULEUR}},
rubbed and burnished into the hide. The color is uneven and organic —
darker where the pigment has settled into creases, lighter where the
hide is smoother. NOT a solid fill, NOT digital, NOT uniform.

BORDER: A continuous band of tribal pattern runs along all four edges,
SCRATCHED and BRANDED into the hide with a sharp tool, then rubbed
with dark ash pigment. The carving is ROUGH, IRREGULAR, HAND-MADE —
uneven depth, wobbly lines, imperfect spacing. Like a hunter carved
it by firelight with a bone awl, NOT a craftsman in a workshop.
The pattern is {{MOTIF}}.
The motifs OVERLAP, INTERLOCK, and ROTATE at different angles —
like real tracks in mud, NOT stamped in a regular grid. They form
a dense continuous band, not isolated shapes with gaps between them.
The band is framed by TWO THIN CARVED LINES running
parallel — one on the inner edge, one on the outer edge — like
borders scratched with a blade to contain the pattern.
NOT sculpted, NOT ornamental, NOT symmetrical, NOT Celtic,
NOT Art Nouveau, NOT Renaissance frame. Think: scratched into
leather with a knife, cave painting geometry, scarification marks.
The border band is ~12% of the card width on each side.
The hide fills the ENTIRE image edge to edge — the outer carved line
sits a few millimeters from the image edge, with hide still visible
beyond it. NO dark vignette, NO margin, NO frame effect.

CENTER: The EXACT VERTICAL AND HORIZONTAL center of the card has a circular area
(~30% of card height diameter) where the hide has been RUBBED
SMOOTH and LIGHTER — like a worn spot from repeated touching,
or a deliberate burnishing with a smooth stone. The texture inside
the circle is visibly different from the surrounding hide: smoother,
slightly shinier, paler. A faint carved ring marks the edge of the
circle. The circle is EMPTY — no symbol, no icon, no marking inside.
An icon will be overlaid later in the game engine.

ATMOSPHERE: Warm, earthy, tactile. This should look and feel like
a real physical object — something a tribal hunter would carry.
Lit from above with soft even light. NO dark vignette at the edges,
NO dramatic shadows, NO frame effect.

NO characters, NO creatures, NO weapons, NO scene, NO text, NO title.
Portrait orientation, 2:3 aspect ratio.
```

### Retours tests

**v1 Heros :**
- OK : texture cuir credible, cercle central bien place, teinte ocre bonne
- Corrige v2 : bordure trop sculptee/ornementale → plus brute, irreguliere
- Corrige v2 : vignettage exterieur trop sombre → cuir bord a bord
- Corrige v2 : cercle central trop subtil → difference de texture ajoutee

**v2 Heros :**
- OK : cuir bord a bord, empreintes plus brutes, cercle mieux marque
- Corrige v3 : empreintes trop "tamponnees" en grille reguliere → doivent se chevaucher, tourner, s'entrelacer
- Corrige v3 : bords de la bande de bordure s'arretent de maniere abrupte → ajout de deux lignes gravees paralleles pour encadrer le motif
- Corrige v3 : cercle un poil trop bas → forcer le centrage exact

---

## Variables par type

### Heros — Ocre dore
```
{{COULEUR}} = warm golden ochre, like raw sienna pigment rubbed into leather
{{MOTIF}} = interlocking animal paw prints forming a continuous chain — each print slightly different in size, suggesting different species walking together
```

### Menace — Rouge sang
```
{{COULEUR}} = dried blood red, like iron oxide pigment — dark, matte, unsettling
{{MOTIF}} = jagged broken lines and sharp angles, like cracks in dried earth or fractured bone — aggressive, irregular, threatening
```

### Chasse — Vert mousse
```
{{COULEUR}} = deep moss green, like crushed plant pigment pressed into the hide — earthy, natural, alive
{{MOTIF}} = simplified leaf and branch shapes arranged in a flowing pattern — organic curves, NOT botanical illustration, more like quick charcoal sketches of foliage
```

### Monstre — Violet cendre
```
{{COULEUR}} = ashen purple-grey, like crushed mineral pigment mixed with charcoal — cold, unnatural, sickly
{{MOTIF}} = parallel claw scratches carved deep into the hide, in groups of three — raw, violent, like something tried to tear through the border
```

### Colosse — Noir charbon
```
{{COULEUR}} = charcoal black mixed with deep brown, like soot and burnt bone ground into the leather — the darkest, most imposing variant
{{MOTIF}} = deep cracks and fracture patterns, like dried mud or crumbling stone — suggests immense weight and ancient power, geological not biological
```

### Destin — Bleu nuit
```
{{COULEUR}} = deep indigo blue, like woad pigment — rich, mysterious, rare
{{MOTIF}} = concentric spirals and circles, like ripples in water or growth rings in ancient wood — hypnotic, cyclical, inevitable
```

---

## Icones centrales

> Les icones centrales suivent le style **clean stylized** defini dans `icon_design.md`.
> Elles sont superposees en Unity sur la zone vide du dos de carte.
> Couleur des icones : blanc casse / creme `#E8DDD0` pour contraster avec le fond colore.

Les icones de type sont aussi utilisees **inline dans le texte des cartes** et dans le **livret de regles** pour referencer un type de carte sans ecrire le mot.

Exemple : "Piochez 2 [icone Chasse]" au lieu de "Piochez 2 cartes Chasse"

### Prompts icones de type

Template commun :
```
Clean stylized game icon. Bold simple shape. Cream white (#E8DDD0).
Smooth surface, NO brushstrokes, NO texture, NO grain.
Soft gradients for volume, subtle highlights, slightly glossy finish.
Centered composition, transparent background.
Must be readable at 1cm x 1cm on a printed card.
PNG, transparent background, 512x512px, 1:1 ratio.
```

#### Heros — Masque tribal
```
+ Tribal mask viewed from the front. Oval shape with two
empty eye holes — dark, hollow, haunting. A simple vertical
line for the nose. NO mouth, NO decoration, NO horns.
Like a ritual hunting mask carved from wood or bone.
Immediately reads as "character" / "person". 3 shapes max.
```

#### Menace — Nuage d'orage
```
+ Storm cloud with a single lightning bolt below it.
The cloud is a simple rounded mass at the top, the bolt
is a sharp zigzag dropping down from it. Suggests danger,
bad weather, something bad is coming. 2 shapes max.
```

#### Chasse — Pierre taillee / silex
```
+ Knapped flint stone — a rough triangular shape with
chipped edges, like a primitive tool or arrowhead carved
from stone. Asymmetrical, raw, angular. The universal
oldest human tool. NOT a polished gem, NOT a diamond.
```

#### Monstre — Croc / dent
```
+ Single large curved fang or tooth. Pointed at the tip,
wider at the root. Slightly curved like a canine tooth.
A trophy taken from a beast. Simple crescent with a point.
```

#### Colosse — Crane massif de bete
```
+ Massive stylized beast skull viewed from the front. Broad,
heavy, with two dark eye sockets and no lower jaw. NOT human —
more like a bull or beast skull. Suggests ancient bones,
something enormous that once lived. Simple silhouette.
```

#### Destin — Spirale
```
+ Single spiral curving inward from the outside, like a
nautilus shell or a whirlpool. 2-3 rotations. Suggests fate,
cycles, the inevitable. Simple continuous curved line
thickening toward the center.
```

---

## Usage inline dans le texte

Quand les icones de type apparaissent dans le texte des cartes ou du livret :
- Taille : hauteur de ligne du texte (~meme hauteur qu'une majuscule)
- Couleur : la couleur du type (pas blanc casse — le blanc est pour le dos de carte)
  - Heros : `#9B7B2F` (ocre)
  - Menace : `#8B2020` (rouge)
  - Chasse : `#2A5E3A` (vert)
  - Monstre : `#6B4080` (violet)
  - Colosse : `#1A1A1A` (noir)
  - Destin : `#2B3A6E` (bleu nuit)
- Padding lateral : ~2px de chaque cote pour ne pas coller au texte

### Convention dans les textes de cartes

```
Piochez 2 [chasse].           → icone arc tendu x2
Infligez 1 a chaque [monstre]. → icone griffures
Le [colosse] gagne +1 DGT.    → icone crane
```

Le livret de regles inclut un **lexique des icones** (1 page) avec chaque icone + nom + description.

---

## Notes techniques

- Les dos de carte sont generes en 1024x1536 (2:3 natif DALL-E)
- L'icone centrale est superposee en Unity (pas dans le prompt DALL-E)
- Le cercle central vide dans le prompt sert de guide de placement
- En impression, le dos doit supporter un leger decalage de decoupe (bleed) — la bordure tribale aide a masquer ca
- Tester le rendu a taille carte reelle (63x88mm) avant validation
