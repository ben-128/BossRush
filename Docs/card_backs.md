# Dos de Cartes - Raid Party

> Fond commun noir peinture + silhouette blanche centrale, une par type de carte.

---

## Concept

Un dos sobre, imposant, uniforme pour toutes les cartes : **fond noir texturé peinture** (pas d'aplat digital — du pigment réel sur support). La seule variation entre types est **une silhouette blanche au centre**, forme iconique par type.

**Pourquoi ce parti pris :**
- Identité visuelle forte et immédiate — un dos noir devient un logo reconnaissable à distance
- Les faces gouache narrative ressortent mieux sur un dos sobre que sur un dos déjà riche
- Production divisée : un seul asset de fond réutilisé, puis 6 silhouettes
- Cohérence thématique avec le lore ("une racine noire montée des profondeurs" = la corruption est le dos)
- Impression plus indulgente sur bleed/découpe que les bordures tribales complexes

**Références dans l'édition moderne :** Arkham Horror LCG, Gloomhaven/Frosthaven, Nemesis, This War of Mine, Darkest Dungeon — tous en dos sombre minimaliste.

**Structure commune :**
- Fond : peinture noire mate, texture organique visible (variations tonales, fines craquelures, légères nuances brunes qui percent par endroits)
- Icône centrale : silhouette blanche pleine, ~40% de la hauteur de carte, parfaitement centrée
- Pas de bordure, pas de motif, pas de titre

**Variations par type :**
- **Rien d'autre que la silhouette centrale.** Le fond est strictement identique pour les 6 types.

---

## Les 6 types de cartes

| Type | Silhouette centrale | Lecture visuelle |
|------|--------------------|--------------------|
| **Héros** | Masque tribal (ovale + 2 yeux vides) | "Personne / identité" |
| **Menace** | Gueule ouverte de bête (crocs hauts et bas) | "Danger / morsure" |
| **Chasse** | Pointe de silex / flèche taillée | "Outil du chasseur" |
| **Monstre** | Petite créature trapue de profil (quadrupède bossu) | "Bête / mob" |
| **Colosse** | Crâne massif de bête (frontal, cornu ou sans mâchoire) | "Géant / ancien" |
| **Destin** | Spirale concentrique (2-3 rotations) | "Hasard / cycle" |

La silhouette Monstre est **partagée** avec l'icône inline `<ico:invocation>` (même forme, usages différents — voir `icones_inline.md`).

---

## Prompt — Fond commun (noir peinture)

> Ce prompt génère le dos **sans** la silhouette centrale. La silhouette est ajoutée soit dans le même prompt (remplacer la ligne CENTER), soit superposée en Unity.

```
Portrait vertical 2:3 format, high resolution PNG.

STYLE: Close-up of a surface painted entirely in charcoal black
pigment, as if thickly brushed with ink or bone-ash paste and
allowed to dry. The surface is rich and dense black, NOT pure
digital #000 — there are subtle tonal shifts where the paint
pooled or thinned, faint brush directions, tiny cracks where
the pigment dried. Viewed from directly above, flat lay.

TEXTURE: Organic, matte, slightly tactile — like painted leather
or primed canvas. Occasional lighter scuffs reveal a hint of warm
brown underneath, as if the hide shows through in places. NO gloss,
NO shine, NO digital gradient, NO noise overlay. Just real-feeling
applied paint.

EDGES: The painted surface fills the entire frame edge to edge.
NO vignette, NO border pattern, NO frame effect, NO margin.
The card is the paint itself.

CENTER: At the exact center of the card, a bold white silhouette:
{{SILHOUETTE}}.
Solid white fill, no outline, no shading, no gradient — pure paper
white on top of the black paint, as if stenciled or cut from cloth
and laid on the surface. The silhouette fills ~40% of the card height,
perfectly centered both horizontally and vertically.

ATMOSPHERE: Severe, quiet, imposing. Lit from above with soft even
light. The black should feel DEEP, not dead — alive through its
texture.

NO text, NO title, NO border, NO pattern beyond the central silhouette.
Portrait orientation, 2:3 aspect ratio.
```

---

## Variables par type — silhouette centrale

### Héros — Masque tribal
```
{{SILHOUETTE}} = a frontal tribal mask shape, vertical oval with two
empty eye holes and a single vertical nose line. NO mouth, NO horns,
NO ornament. Like a ritual hunting mask carved from bone. 3 shapes
total (oval, two eye cutouts, nose line).
```

### Menace — Gueule de bête
```
{{SILHOUETTE}} = a frontal open beast maw: upper and lower rows of
sharp fangs meeting in the middle, curved like a predator's jaw.
NO lips, NO face around it — just the teeth arrangement forming
a menacing mouth shape. Chunky and aggressive.
```

### Chasse — Pointe de silex
```
{{SILHOUETTE}} = a knapped flint arrowhead, rough triangular shape
with chipped/notched edges suggesting stone that was flaked by hand.
Asymmetrical, primitive, raw. Point at the top. NOT a polished gem,
NOT a geometric triangle.
```

### Monstre — Petite créature trapue
```
{{SILHOUETTE}} = a small hunched quadrupedal monster viewed from the
side: compact body, arched/humpbacked spine, four short stubby legs,
two small pointed horns or ears on the head, head tilted slightly
down. Chunky, beastly, roughly square proportions. NO eyes, NO teeth
detail visible — silhouette only.
```

### Colosse — Crâne de bête
```
{{SILHOUETTE}} = a massive frontal beast skull, broad and heavy, with
two dark eye sockets cut out of the white shape (appearing black).
Two curved horns or bony ridges sweeping outward. NO lower jaw —
upper skull only. NOT human. Suggests something ancient and enormous.
```

### Destin — Spirale
```
{{SILHOUETTE}} = a single spiral curving inward from the outside,
2-3 complete rotations, like a nautilus shell or a whirlpool. The
line thickens slightly toward the center. Continuous curve, clean
geometric proportions. Suggests fate, cycles, the inevitable.
```

---

## Workflow

### Option A — Génération complète (prompt unique)
Pour chaque type, un seul appel DALL-E / Midjourney avec le fond noir + silhouette incluse dans le prompt. C'est la méthode utilisée pour les 2 dos existants (`Menace[dos,1].png`, `monstre[dos,1].png`).

**Avantage** : rendu naturel, la silhouette est « intégrée » à la peinture (même grain que le fond, bords légèrement usés).
**Inconvénient** : chaque silhouette est unique, pas réutilisable ailleurs.

### Option B — Fond + overlay Unity
Générer un seul dos noir vide (avec cercle central à peine visible pour guide de placement), puis superposer en Unity les 6 silhouettes en blanc cassé.

**Avantage** : une seule validation du fond, les silhouettes sont aussi réutilisables inline (cohérence totale entre dos et inline).
**Inconvénient** : rendu un peu plus « collé », moins intégré.

**Recommandation** : rester en Option A (génération complète) comme pour les 2 premiers dos validés — le rendu est meilleur.

---

## Retours tests

**Menace[dos,1].png** ✅ validé
- Fond noir peinture : texture vivante, variations tonales subtiles, on sent le pigment appliqué
- Silhouette gueule + crocs : lit « danger / morsure » en 0.3 s, bord légèrement usé qui s'intègre au fond
- Taille ~40% hauteur : bon équilibre, reconnaissable de loin sans être écrasant

**monstre[dos,1].png** ✅ validé
- Même qualité de fond, silhouette créature trapue parfaitement lisible
- Réutilisable en icône inline `<ico:invocation>` (même forme, version tinted en rouge sombre)

**À générer (4 restants) :** Héros, Chasse, Colosse, Destin.

---

## Notes techniques

- Génération native **1024×1536** (ratio 2:3) puis downsample à la résolution d'impression
- Résolution d'impression cible : **63×88 mm à 300 dpi = 744×1039 px** (plus bleed)
- Le noir imprimé : demander **rich black** (C60 M40 Y40 K100) au lieu du K100 seul — le K seul sort grisâtre sur carton
- La silhouette blanche doit rester à **>4 mm du bord** pour tolérer un décalage de découpe
- Tester le rendu physique AVANT de générer les 4 dos restants pour valider la direction

---

## Liens

- Silhouettes inline (version tintée en couleur) : [icones_inline.md](icones_inline.md)
- Illustrations de faces : [art_direction.md](art_direction.md)
- Cadres et overlays de face : [card_frame_templates.md](card_frame_templates.md)
