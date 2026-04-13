# Design des Icones - Raid Party

> Style : **silhouettes plates et bold sur pastilles colorees** (style Root/Wingspan).
> Principe : le contraste entre icones FLAT et illustrations PEINTES = lisibilite maximale.

---

## Principes generaux

- **Style** : silhouettes blanches ou noires sur pastilles de couleur unie — PAS de texture, PAS de grain, PAS de gouache
- **Forme** : contours epais et simplifies — chaque icone doit etre reconnaissable en 0.5 seconde
- **Lisibilite** : DOIT fonctionner a **1cm x 1cm** sur carte imprimee (63x88mm)
- **Contraste** : icone flat/geometrique vs illustration painterly — le contraste de style EST la lisibilite
- **Pastille** : cercle ou rectangle arrondi de couleur unie avec fin contour sombre (2px)
- **Pas de detail** : si un element necessite plus de 5 traits pour etre dessine, il est trop complexe
- **Reference** : Root (Kyle Ferrin), Wingspan, Sleeping Gods — icones simples, bold, instantanement lisibles

---

## Style recommande : pourquoi FLAT sur fond peint

| Option | Lisibilite | Coherence | Verdict |
|---|---|---|---|
| Icones gouache/peintes | Faible — se perdent dans l'illus | Haute | NON — illisible a petite taille |
| Icones riso/grain | Moyenne — le grain brouille | Haute | NON — grain + petite taille = bouillie |
| **Icones flat/silhouette** | **Maximale** — contraste total | Moyenne | **OUI — standard industrie** |
| Icones 3D/embossees | Bonne | Faible | NON — clash avec gouache |

Le flat fonctionne PARCE QUE ca contraste avec les illustrations. C'est un langage visuel different qui dit "ceci est de l'information de jeu, pas de l'art".

---

## Systeme de couleurs des pastilles

### Par hero (competences et cartes associees)

| Hero | Couleur pastille | Hex | Silhouette |
|---|---|---|---|
| Nawel (armure) | Bleu acier | `#2B4F6E` | Blanc |
| Daraa (magie) | Rouge cramoisi | `#8B2020` | Blanc |
| Aslan (diplomatie) | Sienna chaud | `#7A5B3A` | Blanc |
| Isonash (distance) | Vert emeraude | `#2A5E3A` | Blanc |
| Gao (soin) | Ambre dore | `#9B7B2F` | Blanc |

### Universelles (stats, types, gameplay)

| Usage | Couleur pastille | Hex | Silhouette |
|---|---|---|---|
| Vie/PV | Rouge vif | `#C0392B` | Blanc |
| Blessure/degats | Noir | `#1A1A1A` | Rouge `#C0392B` |
| Boss/danger | Rouge sombre | `#6B1515` | Blanc |
| Neutre/gameplay | Brun fonce | `#3A2E22` | Blanc ou creme |

---

## Inventaire des icones + prompts

### Prompt template (prefixer a TOUS les prompts d'icone)

```
Flat vector game icon for a board game. Bold simple silhouette,
{{SILHOUETTE_COLOR}} on {{PASTILLE_COLOR}} solid circle background.
EXTREMELY SIMPLE — maximum 5 shapes/strokes. Must be instantly
readable at 1cm x 1cm. Thick lines, no thin details.
NO texture, NO grain, NO gradient, NO shadow, NO 3D effect,
NO halftone, NO painterly style. Pure flat graphic design.
Clean edges, geometric, modern. Think: Root board game icons or
universal pictograms.
Square format, 1:1 ratio, PNG with transparent background
outside the circle.
```

---

### A. Icones de statut (universelles)

#### Vie / PV
- **Concept** : Coeur simple
- **Pastille** : Rouge vif `#C0392B`
- **Silhouette** : Blanc

```
[TEMPLATE] +
A simple heart shape, symmetrical, slightly rounded.
Classic playing card heart — NOT anatomical. Bold and chunky.
White heart on solid red (#C0392B) circle.
```

#### Blessure
- **Concept** : 3 griffures diagonales
- **Pastille** : Noir `#1A1A1A`
- **Silhouette** : Rouge `#C0392B`

```
[TEMPLATE] +
Three diagonal parallel scratch marks (claw scratches).
Bold thick lines, slightly curved like animal claws.
Red (#C0392B) scratches on solid black circle.
```

#### Capacite speciale (disponible)
- **Concept** : Etoile/eclat a 4 branches
- **Pastille** : Couleur du hero
- **Silhouette** : Blanc

```
[TEMPLATE] +
A four-pointed star burst / spark shape. Bold, symmetrical.
Like a compass rose or magic spark. Simple geometric.
White star on solid {{COULEUR_HERO}} circle.
```

#### Capacite speciale (utilisee / tournee)
- **Concept** : Fleche courbe 90°
- **Pastille** : Gris `#666666`
- **Silhouette** : Blanc

```
[TEMPLATE] +
A curved arrow rotating 90 degrees clockwise.
Bold thick arrow, simple curve. Indicates "tapped/used".
White arrow on solid grey (#666666) circle.
```

---

### B. Icones de competence hero (prerequis cartes)

#### Armure (Nawel)
- **Concept** : Bouclier rond
- **Pastille** : Bleu acier `#2B4F6E`

```
[TEMPLATE] +
A simple round shield seen from the front.
Bold circular shape with a small cross or diamond motif in the
center. Very simple — just the shield outline + one center mark.
White shield on solid deep steel blue (#2B4F6E) circle.
```

#### Magie / Elementaire (Daraa)
- **Concept** : Flamme a 3 langues
- **Pastille** : Rouge cramoisi `#8B2020`

```
[TEMPLATE] +
A simple stylized flame with 3 tongues/tips pointing upward.
Bold silhouette, organic but simple. Classic fire symbol.
White flame on solid crimson red (#8B2020) circle.
```

#### Diplomatie (Aslan)
- **Concept** : Parchemin scelle
- **Pastille** : Sienna `#7A5B3A`

```
[TEMPLATE] +
A simple scroll / rolled parchment with a small seal or ribbon
at the bottom. Bold silhouette, minimal detail.
White scroll on solid warm sienna (#7A5B3A) circle.
```

#### Distance (Isonash)
- **Concept** : Fleche en vol
- **Pastille** : Vert emeraude `#2A5E3A`

```
[TEMPLATE] +
A single arrow in flight, pointing diagonally upper-right.
Bold simple shape — triangular arrowhead + straight shaft +
small fletching at the tail. One clean diagonal line.
White arrow on solid deep emerald green (#2A5E3A) circle.
```

#### Soin (Gao)
- **Concept** : Main ouverte + halo
- **Pastille** : Ambre `#9B7B2F`

```
[TEMPLATE] +
A simple open hand/paw, palm facing viewer, with a small
starburst or glow above the palm. Very simple — hand is just
a basic mitten shape (NOT detailed fingers), glow is 4-6 small
lines radiating from above the palm.
White hand on solid golden amber (#9B7B2F) circle.
```

---

### C. Icones de type de carte

#### Action
- **Concept** : Eclair angulaire
- **Pastille** : Brun fonce `#3A2E22`

```
[TEMPLATE] +
A simple lightning bolt / zigzag shape. Classic comic-style
lightning. Bold, angular, 3 segments. Indicates immediacy.
White lightning bolt on solid dark brown (#3A2E22) circle.
```

#### Objet
- **Concept** : Sac/sacoche
- **Pastille** : Brun fonce `#3A2E22`

```
[TEMPLATE] +
A simple drawstring pouch/bag, tied at the top. Rounded bottom,
cinched neck. Very basic shape — like a coin purse silhouette.
White pouch on solid dark brown (#3A2E22) circle.
```

---

### D. Icones boss / monstre

#### Degats boss
- **Concept** : Poing / impact
- **Pastille** : Rouge sombre `#6B1515`

```
[TEMPLATE] +
A clenched fist seen from the front, punching toward the viewer.
Bold simple silhouette — no finger detail, just the chunky fist shape.
White fist on solid dark red (#6B1515) circle.
```

#### Invocation boss
- **Concept** : Portail brise
- **Pastille** : Rouge sombre `#6B1515`

```
[TEMPLATE] +
A broken circle / cracked portal with small triangular shards
flying outward. Like a ring that shattered. Simple geometric.
White broken circle on solid dark red (#6B1515) circle.
```

#### PV monstre
- **Concept** : Petit coeur
- **Pastille** : Rouge sombre `#6B1515`

```
[TEMPLATE] +
Same heart as PV icon but smaller scale. Simple bold heart.
White heart on solid dark red (#6B1515) circle.
```

#### Degats monstre
- **Concept** : Griffe unique
- **Pastille** : Rouge sombre `#6B1515`

```
[TEMPLATE] +
A single curved claw / talon shape. Bold, sharp, like one
animal claw swiping. Simple crescent with pointed tip.
White claw on solid dark red (#6B1515) circle.
```

---

### E. Icones de gameplay

#### Pioche
- **Concept** : Carte + fleche montante

```
[TEMPLATE] +
A card shape (small rectangle) with an upward arrow emerging
from it. Simple: rectangle + arrow pointing up.
White on solid dark brown (#3A2E22) circle.
```

#### Defausse
- **Concept** : Carte + fleche descendante

```
[TEMPLATE] +
A card shape (small rectangle) with a downward arrow.
Simple: rectangle + arrow pointing down.
White on solid dark brown (#3A2E22) circle.
```

#### Echange
- **Concept** : Deux fleches croisees

```
[TEMPLATE] +
Two arrows crossing in opposite directions (left-right swap).
Simple X shape made of two bold arrows.
White on solid dark brown (#3A2E22) circle.
```

#### Cible melee
- **Concept** : Fleche vers la gauche

```
[TEMPLATE] +
A bold arrow pointing LEFT. Simple triangular arrowhead +
thick shaft. Indicates "target the front of the monster queue".
White on solid dark brown (#3A2E22) circle.
```

---

## Regles de placement sur carte

### Carte Hero
- **Haut gauche** : pastille PV (coeur rouge + nombre blanc en overlay)
- **Haut droite** : pastille competence (couleur hero)
- **Bas** : texte capacite speciale

### Carte Arsenal (Action/Objet)
- **Haut gauche** : pastille type (eclair ou sac, brun)
- **Haut droite** : pastille prerequis competence (couleur hero)
- **Zone texte** : icones de degats/soin inline si applicable

### Carte Monstre
- **Haut gauche** : pastille PV monstre (coeur, rouge sombre)
- **Haut droite** : pastille degats monstre (griffe, rouge sombre)
- **Bas** : texte capacite si applicable

---

## Generation et post-traitement

### Methode recommandee : creation en code

Pour les icones flat/silhouette, la **generation par code** (SVG ou Unity UI) est PLUS FIABLE que l'IA :
- Les formes sont geometriques et simples
- L'IA a tendance a ajouter du detail, des ombres, de la texture
- Un SVG ou un sprite Unity avec les bonnes couleurs sera pixel-perfect

**Utiliser l'IA uniquement si** la forme est trop complexe pour du code (ex: la flamme, la main, le parchemin).

### Si generation IA

1. Generer en 512x512 minimum
2. Verifier que c'est VRAIMENT flat — pas d'ombre, pas de gradient sneaky
3. Supprimer le fond (transparence hors pastille)
4. Redimensionner a 120x120 pour usage carte
5. Tester a 1cm x 1cm — si un detail disparait, simplifier
