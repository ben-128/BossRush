# Design des Icones - Raid Party

> Style : **clean stylized UI icons** — formes bold, surface lisse, soft gradients pour le volume, finition legerement glossy.
> Principe : les icones sont un langage visuel DISTINCT des illustrations gouache. Le contraste de style EST la lisibilite.

---

## Principes generaux

- **Style** : icones clean et stylisees — surface lisse, soft gradients pour le volume, highlights subtils, finition legerement glossy
- **Rendu** : moderne, propre, bold — PAS de texture, PAS de grain, PAS de brushstrokes, PAS de gouache
- **Forme** : contours epais et simplifies — chaque icone doit etre reconnaissable en 0.5 seconde
- **Lisibilite** : DOIT fonctionner a **1cm x 1cm** sur carte imprimee (63x88mm)
- **Fond** : transparent — l'icone est la forme seule, centree
- **Pas de detail** : si un element necessite plus de 5 traits pour etre dessine, il est trop complexe
- **Coherence** : toutes les icones partagent le meme style clean/stylise pour former un systeme visuel unifie

---

## Style retenu : pourquoi CLEAN STYLIZED

| Option | Lisibilite | Coherence systeme | Verdict |
|---|---|---|---|
| Icones flat vector pur (Root) | Maximale | Haute | Trop plat, manque de volume |
| Icones gouache peintes | Bonne | Faible — se perd dans les illus | NON |
| Icones tampon/block print | Haute | Moyenne — IA ajoute trop de details | NON |
| Icones riso/grain | Moyenne | Moyenne | NON — bouillie a petite taille |
| **Icones clean stylisees** | **Maximale** | **Haute** | **OUI** |

Les icones clean fonctionnent PARCE QUE ca contraste avec les illustrations gouache. C'est un langage visuel qui dit "ceci est de l'information de jeu, pas de l'art". Le soft gradient et le glossy ajoutent juste assez de volume pour ne pas faire "flat UI mobile".

**Decision :** avril 2026. Flat vector = trop plat. Gouache = se perd. Tampon = l'IA ajoute trop de details. Clean stylized = le bon compromis entre lisibilite et qualite.

---

## Systeme de couleurs

Les icones n'ont PAS de pastille/cercle de fond. La couleur est celle de la forme peinte elle-meme.

### Par hero (competences et cartes associees)

| Hero | Couleur icone | Hex |
|---|---|---|
| Nawel (armure) | Bleu acier | `#2B4F6E` |
| Daraa (magie) | Rouge cramoisi | `#8B2020` |
| Aslan (diplomatie) | Sienna chaud | `#7A5B3A` |
| Isonash (distance) | Vert emeraude | `#2A5E3A` |
| Gao (soin) | Ambre dore | `#9B7B2F` |

### Universelles

| Usage | Couleur | Hex |
|---|---|---|
| Vie/PV | Cramoisi | `#8B2020` |
| Capacite speciale (heros) | Or/jaune | `#D4A830` |
| Capacite speciale (boss) | Rouge sombre | `#6B1515` |
| Boss/danger | Rouge sombre | `#6B1515` |

---

## Inventaire des icones + prompts

### Prompt template (prefixer a TOUS les prompts d'icone)

```
Clean stylized game icon. Bold simple {{FORME}}. {{COULEUR}}.
Smooth surface, NO brushstrokes, NO texture, NO grain.
Soft gradients for volume, subtle highlights, slightly glossy
finish. Bold simple shapes, highly readable at small size.
Centered composition, transparent background.
Consistent modern UI icon style.
Must be readable at 1cm x 1cm on a printed card.
PNG, transparent background, 512x512px, 1:1 ratio.
```

---

### A. Icones de statut (universelles)

#### Vie / PV
- **Concept** : Goutte de sang arrondie (presque circulaire, petit bout pointu en haut)
- **Couleur** : Cramoisi `#8B2020`
- **Le chiffre de PV est superpose en Unity** (blanc/creme bold + drop shadow)

```
[TEMPLATE] {{FORME}} = fat blood drop, {{COULEUR}} = Deep crimson red (#8B2020)
+
Very rounded, almost circular — like a fat teardrop with just
a small pointed tip at the top. Chunky and compact, NOT elongated,
NOT thin, NOT elegant. Think: a round dot with a tiny peak.
The center is EMPTY — no number, no symbol inside.
A number will be overlaid later in the game engine.
```

#### Capacite speciale (icone inline texte — heros ET boss)
- **Concept** : Etoile/eclat a 4 branches
- **Couleur heros** : Or `#D4A830`
- **Couleur boss** : Rouge sombre `#6B1515`
- **Meme forme, la couleur differencie heros/boss**

```
[TEMPLATE] {{FORME}} = four-pointed star burst, {{COULEUR}} = Warm golden yellow (#D4A830) [ou #6B1515 pour boss]
+
Bold, symmetrical, like a compass rose or magic spark.
Simple geometric — 4 points, chunky, NOT thin, NOT spiky,
NOT decorative. Each point is wide and triangular, NOT needle-like.
```

---

### B. Icones de competence hero (prerequis cartes)

**IMPORTANT** : les icones de competence heros reprennent le **motif iconique** de chaque heros tel qu'il apparait dans son illustration. Uploader l'image du heros en meme temps que le prompt pour que l'IA reproduise le bon motif.

#### Armure (Nawel)
- **Concept** : Motif solaire du bouclier de Nawel
- **Couleur** : Bleu acier `#2B4F6E`
- **Methode** : uploader l'image de Nawel en reference

```
[TEMPLATE] {{FORME}} = round shield with sun/star pattern, {{COULEUR}} = Deep steel blue (#2B4F6E)
+ Upload image de Nawel en reference.
+
Look at the round shield in the attached image.
Reproduce its geometric sun/star pattern as a simple icon.
A circle with triangular rays pointing outward from a round
center — same pattern as the shield. Maximum 2 shapes.
```

#### Magie / Elementaire (Daraa)
- **Concept** : Flamme a 3 langues
- **Couleur** : Rouge cramoisi `#8B2020`

```
[TEMPLATE] {{FORME}} = stylized flame with 3 tongues, {{COULEUR}} = Crimson red (#8B2020)
+
Flame with 3 tips pointing upward. Bold, organic, simple.
Maximum 3 shapes.
```

#### Diplomatie (Aslan)
- **Concept** : Parchemin scelle
- **Couleur** : Sienna `#7A5B3A`

```
[TEMPLATE] {{FORME}} = scroll with seal, {{COULEUR}} = Warm sienna (#7A5B3A)
+
A rolled parchment with a small seal at the bottom.
Maximum 2 shapes.
```

#### Distance (Isonash)
- **Concept** : Fleche en vol
- **Couleur** : Vert emeraude `#2A5E3A`

```
[TEMPLATE] {{FORME}} = arrow in flight, {{COULEUR}} = Deep emerald green (#2A5E3A)
+
Single arrow pointing diagonally upper-right.
Arrowhead + shaft + small fletching. One diagonal line.
```

#### Soin (Gao)
- **Concept** : Main ouverte + halo
- **Couleur** : Ambre `#9B7B2F`

```
[TEMPLATE] {{FORME}} = open paw with glow, {{COULEUR}} = Golden amber (#9B7B2F)
+
Simple open paw/mitten shape, palm facing viewer.
Small starburst above the palm (4-6 short lines).
```

---

### C. Icones de type de carte

#### Action
- **Concept** : Eclair angulaire
- **Couleur** : Brun fonce `#3A2E22`

```
[TEMPLATE] {{FORME}} = lightning bolt, {{COULEUR}} = Dark brown (#3A2E22)
+
Zigzag lightning bolt, 3 segments. Bold, angular.
```

#### Objet
- **Concept** : Sac/sacoche
- **Couleur** : Brun fonce `#3A2E22`

```
[TEMPLATE] {{FORME}} = drawstring pouch, {{COULEUR}} = Dark brown (#3A2E22)
+
Drawstring pouch tied at the top. Rounded bottom, cinched neck.
Maximum 2 shapes.
```

---

### D. Icones boss / monstre

#### Degats boss
- **Concept** : Poing / impact
- **Couleur** : Rouge sombre `#6B1515`

```
[TEMPLATE] {{FORME}} = clenched fist, {{COULEUR}} = Dark red (#6B1515)
+
Clenched fist from the front. Chunky shape, no finger detail.
```

#### Invocation boss
- **Concept** : Portail brise
- **Couleur** : Rouge sombre `#6B1515`

```
[TEMPLATE] {{FORME}} = broken circle, {{COULEUR}} = Dark red (#6B1515)
+
Broken circle with small triangular shards flying outward.
Like a shattered ring.
```

#### PV monstre
- **Concept** : Goutte de sang (meme que PV heros)
- **Couleur** : Rouge sombre `#6B1515`

```
Meme forme que PV heros (goutte arrondie) mais en rouge sombre.
```

#### Degats monstre
- **Concept** : Griffe unique
- **Couleur** : Rouge sombre `#6B1515`

```
[TEMPLATE] {{FORME}} = single claw, {{COULEUR}} = Dark red (#6B1515)
+
Single curved claw/talon. Sharp crescent with pointed tip.
```

---

### E. Icones de gameplay

#### Pioche
- **Couleur** : Brun fonce `#3A2E22`

```
[TEMPLATE] {{FORME}} = card with upward arrow, {{COULEUR}} = Dark brown (#3A2E22)
+
Small rectangle + arrow pointing up. 2 shapes max.
```

#### Defausse
- **Couleur** : Brun fonce `#3A2E22`

```
[TEMPLATE] {{FORME}} = card with downward arrow, {{COULEUR}} = Dark brown (#3A2E22)
+
Small rectangle + arrow pointing down. 2 shapes max.
```

#### Echange
- **Couleur** : Brun fonce `#3A2E22`

```
[TEMPLATE] {{FORME}} = two crossing arrows, {{COULEUR}} = Dark brown (#3A2E22)
+
Two arrows crossing in opposite directions. Simple X.
```

#### Cible melee
- **Couleur** : Brun fonce `#3A2E22`

```
[TEMPLATE] {{FORME}} = arrow pointing left, {{COULEUR}} = Dark brown (#3A2E22)
+
Bold arrow pointing LEFT. Triangular head + thick shaft.
```

---

## Regles de placement sur carte

### Carte Hero
- **Haut gauche** : icone competence hero (forme gouache couleur hero)
- **Bas droite** : goutte de sang PV (cramoisi + chiffre blanc en overlay Unity)
- **Zone texte** : etoile or a gauche du texte de capacite speciale

### Carte Arsenal (Action/Objet)
- **Haut gauche** : icone type (eclair ou sac, gouache)
- **Haut droite** : icone prerequis competence (couleur hero)
- **Zone texte** : icones de degats/soin inline si applicable

### Carte Monstre
- **Haut gauche** : goutte de sang PV monstre (rouge sombre + chiffre)
- **Haut droite** : icone degats monstre (griffe, rouge sombre)
- **Bas** : etoile rouge sombre a gauche du texte capacite si applicable

---

## Generation et post-traitement

### Methode

1. Generer en 512x512 minimum avec le template + description specifique
2. Pour les icones de competence heros : **uploader l'image du heros** en reference pour que l'IA reproduise le bon motif
3. Verifier le rendu clean — surface lisse, soft gradients, PAS de texture/grain/brushstrokes
4. Verifier qu'il n'y a PAS de fond — juste la forme sur transparent
5. Supprimer le fond si necessaire (transparence)
6. Redimensionner a 120x120 pour usage carte
7. Tester a 1cm x 1cm — si un detail disparait, simplifier

### Import Unity (pour TOUTES les icones)

- `filterMode` : 2 (Trilinear)
- `textureCompression` : 0 (None)
- `textureFormat` : 4 (RGBA32)
- `aniso` : 1
- `alphaIsTransparency` : 1
