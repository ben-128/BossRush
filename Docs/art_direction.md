# Direction Artistique - Raid Party

> Document de reference unique pour la generation et le post-traitement de toutes les illustrations du jeu.

## Style retenu : Risograph / Serigraphie 2-3 couleurs

**Decision :** avril 2026, apres exploration de plusieurs pistes (gravure encre, impasto, gouache). Le risograph est retenu pour son equilibre entre beaute, faisabilite IA et originalite sur le marche JdS.

**Justification :**
- Le grain halftone, le decalage de couleurs et les textures d'impression masquent efficacement l'origine IA
- Les aplats de couleur et l'absence de degradés empechent les artefacts IA typiques (lissage, uncanny valley)
- Style unique en JdS — aucun concurrent direct ne l'utilise
- Palette ultra-limitee (2-3 couleurs) = coherence naturelle entre les 180 cartes
- Les imperfections d'impression (bavures, grain, decalage) SONT le style

**Principe :** Toutes les illustrations (heros, monstres, epreuves) partagent ce style pour assurer la coherence visuelle du jeu.

---

## 1. Prompt template

### Bloc style (a prefixer a TOUT prompt de generation)

```
Risograph art print, {{NB_COULEURS}}-color overprint ({{COULEURS}}) on
off-white textured paper. Visible halftone dot grain throughout.
Slight color misregistration between printed layers — colors do not
align perfectly, creating visible offset at edges.
Bold graphic style with strong readable silhouette.
Flat color areas, NO smooth gradients. Shadows rendered as hatched
lines or halftone dots in the black layer. Color areas printed as
solid or halftone fills in the color layer(s).
Textured risograph grain visible on every surface.
Slight ink bleed at shape edges. Paper texture shows through in
light areas.
Looks like a hand-pulled screen print on craft paper.
NOT digital, NOT photorealistic, NOT smooth, NOT painted.
Raw, tactile, graphic, powerful.
Think indie zine art meets dark fantasy illustration.
{{FORMAT}}
```

### Variables

| Variable | Description | Exemples |
|---|---|---|
| `{{NB_COULEURS}}` | Nombre de couches d'impression | `2` ou `3` |
| `{{COULEURS}}` | Couleurs des couches riso | `deep steel blue + charcoal black`, `crimson red + charcoal black + warm ochre` |
| `{{SUJET}}` | Description du personnage/scene, pose, equipement, decor | voir section 3 |
| `{{FORMAT}}` | Ratio de l'image | `Landscape orientation, 3:2 aspect ratio.` ou `Portrait orientation, 2:3 aspect ratio.` |

### Prompt negatif (a ajouter si ChatGPT/DALL-E lisse trop)

```
smooth, airbrushed, digital painting, photorealistic, soft focus,
blurry, oil painting, watercolor, pencil drawing, concept art,
artstation trending, multiple colors, full color, gradient,
3D render, CGI, anime, cartoon, comic book coloring
```

---

## 2. Regles visuelles

### Palette par illustration

- **Maximum 3 couleurs** par illustration : noir (toujours present) + 1-2 couleurs thematiques
- **Fond :** papier off-white / craft naturel — PAS blanc pur, PAS gris fonce
- **Noir :** contours, hachures, ombres, details fins — c'est la couche structurelle
- **Couleur(s)** : aplats ou halftone sur les elements thematiques — c'est la couche emotionnelle
- **Interdit :** degradés lisses, plus de 3 couleurs, melange de couleurs en fondu

### Grain et texture

- Grain halftone visible — simuler les points d'impression riso
- Decalage de couleur (misregistration) — les couches de couleur ne s'alignent pas parfaitement
- Bavure d'encre aux bords des formes — bords PAS nets, legerement fuzzy
- Texture papier visible dans les zones claires
- **En post-prod :** appliquer un overlay de grain halftone + texture papier pour uniformiser le rendu si l'IA ne le fait pas assez

### Trait et formes

- Contours noirs epais et affirmes
- Formes simplifiees, graphiques — pas de hyper-detail anatomique
- Ombres en hachures ou halftone, PAS en degrade
- Silhouettes fortes et lisibles a petite taille
- Style "affiche serigraphiee" — lecture instantanee

### Composition

- Le personnage/sujet occupe ~60-70% du cadre
- Silhouette forte et reconnaissable — doit fonctionner en 2cm de large
- Fond suggestif, pas trop detaille (risque de bruit a petite taille)
- Contraste figure/fond : le sujet doit se detacher clairement grace au contraste noir/couleur

### Visages

- Stylises, PAS realistes — traits reduits a l'essentiel (forme du visage, expression, marques distinctives)
- L'expression doit etre lisible meme en simplifie
- Chaque heros a 1-2 traits faciaux uniques et memorables (cicatrice, peinture de guerre, tatouage, etc.)
- Pas de "beau visage IA" — rugueux, imparfait, stylise par le medium riso
- Le grain halftone sur le visage masque naturellement les artefacts IA

### Mains

- Cachees ou simplifiees : gantelets, gants, lumiere, arme qui cache les doigts
- Si visibles, rendues en silhouette noire simple — pas de detail de doigts

### Lisibilite carte (63x88mm)

- Tester chaque illustration reduite a 6cm de large
- Les hachures trop fines deviennent du bruit — privilegier des traits epais
- La silhouette du personnage doit rester identifiable en thumbnail

---

## 3. Heroes — Palette et couleurs par personnage

Chaque heros a sa propre combinaison de couleurs riso. Le noir est toujours present comme couche structurelle.

| Hero | Nom | Titre | Couleur riso | Couches d'impression | Palette |
|---|---|---|---|---|---|
| **Rempart** | Nawel | Le Rempart | Deep steel blue | noir + bleu acier | charcoal black, deep steel blue, off-white paper |
| **Flamme** | Daraa | La Flamme | Crimson red | noir + rouge cramoisi | charcoal black, deep crimson red, off-white paper |
| **Porte-Voix** | Aslan | Le Porte-Voix | Warm brown/gold | noir + brun dore | charcoal black, warm sienna brown, off-white paper |
| **Piste** | Isonash | La Piste | Emerald green | noir + vert emeraude | charcoal black, deep emerald green, off-white paper |
| **Gardien** | Gao | Le Gardien | Golden yellow | noir + or/jaune | charcoal black, warm golden yellow, off-white paper |

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

## 4. Formats de carte

### Recto — Format 3:2 (paysage, vignette en haut de carte)

C'est l'image **fonctionnelle** : on l'utilise pendant le jeu.

```
[BLOC STYLE] +
Full body character, landscape 3:2 format.
Character centered, dominant in frame (~70%).
Strong readable silhouette, must work at thumbnail size.
Dynamic pose related to the character's role.
Simple atmospheric background — suggested, not detailed.
All body parts within center 75% horizontally.
Dramatic asymmetric lighting from one side.
```

### Verso — Format 2:3 (portrait vertical)

C'est l'image **hero** : celle qu'on regarde et qu'on retient.

```
[BLOC STYLE] +
Full body character portrait, portrait vertical 2:3 format.
Wide shot showing full environment.
Character ~60-70% of frame, full body visible head to toe.
Dynamic narrative pose.
Atmospheric background with depth (landscape, ruins, mountains, sky).
Environment takes a significant role in the composition.
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
2-color overprint: charcoal black + crimson red.
Red on: eyes, claws, blood, hostile magic, corruption marks.
Emphasis on menacing silhouette over anatomical detail.
Fantasy adventure tone, not survival horror.
Must feel dangerous but defeatable.
```

### Epreuves (scenes/lieux)

```
[BLOC STYLE] +
Environmental wide shot, NO prominent characters.
2-color overprint: charcoal black + crimson red.
Red on: danger element (trap, glow, blood, hostile magic).
Strong mood lighting from a single dominant light source.
Invites the viewer into the scene, suggests narrative and danger.
Loose rendering in periphery, detail concentrated on focal point.
```

### Icones (symboles de gameplay)

```
Risograph-style game icon.
2 colors: charcoal black + {{COULEUR_HERO}}.
Clean silhouette on off-white background.
Halftone grain texture visible.
MUST be instantly readable at 1cm x 1cm print size.
Bold, simple, graphic.
```

---

## 6. Post-traitement obligatoire

Apres chaque generation, appliquer dans l'ordre :

1. **Verification grain riso** — Si l'image est trop lisse/digitale, appliquer un overlay de :
   - Grain halftone (dots pattern) a ~15-20% opacite
   - Texture papier craft (off-white, grain visible) en mode Multiply ~10%
   - Leger decalage de la couche couleur (2-5px shift) pour simuler la misregistration

2. **Verification palette** — Maximum 3 couleurs : noir + couleur(s) hero + papier. Aucune couleur parasite (pas de rose, pas d'orange non voulu, pas de bleu sur un hero rouge, etc.)

3. **Visage** — Doit rester stylise et lisible. Si trop realiste ou trop lisse, re-generer ou appliquer le grain plus fortement sur le visage.

4. **Contraste figure/fond** — Le personnage doit se detacher clairement. Assombrir le fond ou augmenter le contraste si necessaire.

5. **Test taille carte** — Reduire l'image a 6cm de large. La silhouette et le personnage doivent rester identifiables.

### Overlay riso (recette Photoshop/GIMP)

Pour garantir le look riso meme si DALL-E ne le fait pas assez :

1. Creer une couche "halftone dots" :
   - Nouveau calque gris 50%
   - Filtre > Pixeliser > Demi-teintes couleur (rayon 4-6px)
   - Mode de fusion : Multiply, opacite 15-25%

2. Creer une couche "paper texture" :
   - Importer une texture papier craft (off-white, grain visible)
   - Mode de fusion : Multiply, opacite 8-12%

3. Creer une couche "misregistration" :
   - Dupliquer la couche couleur uniquement
   - Decaler de 3-5px en horizontal et 1-2px en vertical
   - Opacite 60-80%

---

## 7. Points de vigilance ChatGPT / DALL-E

- **Risograph pas assez marque** : DALL-E tend a lisser le rendu. Insister sur "visible halftone dot pattern", "ink bleed at edges", "hand-pulled screen print". Ajouter "NOT digital, NOT smooth" explicitement.
- **Trop de couleurs** : DALL-E ajoute des couleurs non demandees. Etre tres explicite : "ONLY {{COULEUR}} and black. No other colors."
- **Visages trop realistes** : ajouter "stylized face, graphic simplified features, NOT photorealistic face"
- **Mains** : toujours specifier comment les cacher (gantelets, arme, lumiere, cadrage)
- **Format** : DALL-E genere en 1024x1024, 1024x1792, ou 1792x1024. Pour le paysage 3:2 on obtient 1536x1024. Cropper en post a 1536x922 (5:3) pour la zone illustration carte.
- **Ne JAMAIS nommer** de jeu (MTG, Hearthstone) ou d'artiste protege dans le prompt
- **Anti-IA** : le grain riso + misregistration + texture papier en post-prod sont les meilleurs outils anti-detection IA. Toujours les appliquer.

---

## 8. Historique des decisions

| Date | Decision |
|---|---|
| 2026-04-09 | Style gravure retenu apres test sur le Guerrier generique. |
| 2026-04-10 | Fond gris-beige plat. Ajout fonds de carte colores et cadres woodcut. |
| 2026-04-11 | Test impasto/huile epaisse suite au changement d'univers tribal. Premier test Nawel concluant. |
| 2026-04-12 | Adoption 2 formats : verso 2:3 + recto 3:2. Sous-titres lore FR/EN. |
| 2026-04-12 | Refonte bloc style impasto (Afremov, Van Gogh references). |
| 2026-04-13 | **Abandon impasto/gravure/gouache.** Adoption style **Risograph / serigraphie 2-3 couleurs**. Raisons : meilleur masquage IA, originalite marche JdS, coherence palette naturelle, imperfections voulues. Correction des noms de heros (Nawel/Daraa/Aslan/Isonash/Gao) et couleurs (Nawel = bleu acier, pas rouge). |
