# Icones inline (dans le texte des cartes)

> Icones inserees via la balise `<ico:tag>` au milieu du texte de carte —
> "piochez <ico:chasse>", "infligez <ico:degat><ico:degat>", "<ico:attaque> le monstre...".
> Balises definies dans [editeur_cartes.py](../BossRush/Assets/Data/editeur/editeur_cartes.py) L30-40.

---

## Philosophie — monochrome + 2 exceptions

Raid Party suit la norme des jeux adultes sobres (**Frosthaven**, **Marvel Champions**, **Gloomhaven**) : les icones inline de type de carte et d'actions sont **monochromes**. La differenciation se fait par **la forme**, pas par la couleur.

Cela colle aussi avec le dos de carte (noir peinture + silhouette blanche) — voir [card_backs.md](card_backs.md). Le meme signe graphique apparait sur le dos et dans le texte, avec juste une inversion de couleur (blanc sur noir → noir sur blanc).

**Deux exceptions justifiees** :
- `<ico:degat>` = **cramoisi** (le rouge sang est un code universel accepte — cf. goutte de sang de Slay the Spire, Hearthstone, etc.)
- `<ico:capacite>` = **or** (marqueur "action heros unique", contraste fort avec le reste)

Le reste (menace, invocation, attaque, actif_boss, action, destin, chasse) est en **noir texture** `#1A1A1A` — pas pitch black digital, un noir qui respire sur papier blanc.

---

## Conventions observees dans d'autres jeux (reference)

| Jeu | Traitement inline | Lecon |
|---|---|---|
| **Frosthaven / Gloomhaven** | Silhouettes monochromes, forme seule | **Norme du jeu sobre moderne** |
| **Marvel Champions** | Types de carte (Ally/Event/Support) en monochrome, shape only | Meme approche |
| **Arkham Horror LCG** | Pas d'icones de type (references textuelles) | Alternative plus radicale |
| **MTG** | Mana colore, mais ce n'est pas un type de carte | Cas particulier |
| **Slay the Spire** | Degats = rouge sang, tout le reste neutre | Inspiration directe pour nos exceptions |

**Regles qui en ressortent :**
1. Une icone inline, c'est **une silhouette**, pas un mini-tableau.
2. Les types de carte partagent un gabarit (rectangle carte + signe dedans) — **la forme** differencie, pas la couleur.
3. Les exceptions colorees doivent etre **rares et justifiees universellement** (sang = rouge).

---

## Palette inline

| Famille | Couleur | Usage |
|---|---|---|
| **Neutre (defaut)** | Noir chaud `#1A1A1A` | Tout sauf les 2 exceptions |
| **Degats** | Cramoisi `#8B2020` | Goutte de sang |
| **Capacite heros** | Or `#D4A830` | Etoile 4 branches |

---

## Coherence dos / inline — meme signe, couleurs inversees

Pour les 4 tags qui referencent un **type de paquet**, la silhouette inline reprend exactement la silhouette du dos correspondant :

| Dos (blanc sur noir) | Inline (noir sur blanc) | Forme partagee |
|---|---|---|
| Dos Menace | `<ico:menace>` | Gueule de bete a crocs |
| Dos Chasse | `<ico:chasse>` | Silex taille |
| Dos Destin | `<ico:destin>` | Spirale |
| Dos Monstre | `<ico:invocation>` | Creature trapue |

Le joueur apprend la forme une fois, la reconnait dans les deux contextes.

---

## Prompt template (inline)

```
Clean stylized inline game icon. Pure silhouette of {{FORME}}.
Solid single color {{COULEUR}} on transparent background.
NO gradients, NO highlights, NO texture, NO outline.
NO internal detail lines — just the filled shape.
Must read clearly at 16 pixels tall as a solid blob.
Chunky proportions, slightly taller than wide, centered.
PNG, transparent background, 256x256px, 1:1 ratio.
```

> **Difference cle** avec `icon_design.md` : ici PAS de soft gradient, PAS de glossy.
> L'inline est en aplat pur — un logogramme qui vit au milieu du texte.

---

## Pipeline de composition

Les inlines sont generees en deux etapes via `IconCompositor` (voir [IconCompositionConfig.cs](../BossRush/Assets/Scripts/IconCompositionConfig.cs) et [DefaultIconConfigCreator.cs](../BossRush/Assets/Scripts/Editor/DefaultIconConfigCreator.cs)) :

1. **Sources blanches** generees via IA : chaque symbole en pur blanc sur transparent, 512×512
2. **Composition** : le compositor applique la couleur de famille et, pour les types de carte, decoupe le symbole dans un cadre carte (mode Cutout)

Les symboles sont donc generes UNE fois en blanc. La couleur est appliquee au moment de la composition, pilotee par la config.

---

## Inventaire des 9 balises

### 1. `<ico:degat>` — Degat / blessure 🩸

- **Represente** : 1 point de degat, ou 1 blessure existante
- **Forme** : goutte de sang arrondie compacte (presque circulaire, petite pointe en haut)
- **Couleur** : **Cramoisi `#8B2020` (exception)**
- **Mode compo** : SymbolOnly
- **Note** : on repete la goutte : `<ico:degat><ico:degat>` = 2 degats.

```
Pure silhouette of a fat rounded blood drop, almost circular
with a tiny pointed tip at the top. Solid pure white #FFFFFF
on transparent background. NO gradient, NO highlight, NO outline.
Chunky and compact — NOT elongated, NOT thin, NOT elegant.
```

---

### 2. `<ico:capacite>` — Capacite speciale heros 💠

- **Represente** : "activez votre capacite speciale"
- **Forme** : etoile a 4 branches, compass-rose, branches triangulaires epaisses
- **Couleur** : **Or `#D4A830` (exception)**
- **Mode compo** : SymbolOnly

```
Pure silhouette of a 4-pointed star burst, compass-rose style.
Solid pure white #FFFFFF on transparent background.
NO gradient, NO outline. Each point is wide triangular, NOT thin,
NOT spiky. Symmetrical, chunky, slightly taller than wide.
```

---

### 3. `<ico:actif_boss>` — Actif du boss ⚡

- **Represente** : "declenchez l'actif du Colosse (voir fiche)"
- **Forme** : eclair zigzag a 3 segments, angulaire
- **Couleur** : **Noir `#1A1A1A`**
- **Mode compo** : SymbolOnly
- **Collision evitee** : `<ico:action>` est aussi un eclair, mais il est **dans un cadre carte** (Cutout). L'actif_boss est **seul** (SymbolOnly). Contexte different, shape identique — ok.

```
Pure silhouette of a bold zigzag lightning bolt, 3 segments,
angular. Solid pure white #FFFFFF on transparent background.
NO gradient, NO outline. Aggressive and taller than wide.
Top segment slightly larger than bottom.
```

---

### 4. `<ico:menace>` — Piocher carte Menace 🃏

- **Represente** : "piochez 1 carte Menace et resolvez-la"
- **Forme** : **gueule de bete a crocs** dans un cadre carte
- **Couleur** : **Noir `#1A1A1A`**
- **Mode compo** : Cutout (la gueule est decoupee dans le cadre carte)
- **Coherence dos** : meme gueule que le dos Menace (blanc sur noir pour le dos, noir pour l'inline).
- **Fallback** : si la gueule se lit mal a 16 px sur carte imprimee (trop de crocs = bouillie), fallback sur **une seule dent/croc courbe au centre**. Tester avant de valider.

```
Pure silhouette of a small vertical playing card with a bold
frontal beast maw (upper and lower rows of fangs meeting in the
middle) cut out of its center — the maw is negative space
revealing transparent background through the card.
Solid pure white #FFFFFF on transparent background.
NO gradient, NO outline. Card proportions: taller than wide.
Maw fills ~60% of the card height, centered.
```

---

### 5. `<ico:invocation>` — Placer un monstre 🐾

- **Represente** : "placez 1 monstre dans la file du heros actif"
- **Forme** : **petite creature trapue quadrupede de profil** (dos bossu, cornes/oreilles courtes)
- **Couleur** : **Noir `#1A1A1A`**
- **Mode compo** : SymbolOnly (pas de cadre carte — l'invocation est une action, pas un type de carte)
- **Coherence dos** : meme silhouette que le dos Monstre, meme silhouette que la creature trapue pour l'inline. Un signe, trois usages.

```
Pure silhouette of a small hunched monster creature viewed from
the side: compact quadrupedal body, arched spine, four short legs,
two small pointed horns/ears on the head. Chunky and beastly,
roughly square proportions. Solid pure white #FFFFFF on transparent
background. NO gradient, NO outline, NO eyes, NO teeth.
Just a bold readable silhouette that instantly reads as "monster".
```

---

### 6. `<ico:attaque>` — Ordre d'attaque ⚔

- **Represente** : "le monstre en tete de file attaque le heros actif"
- **Forme** : deux epees croisees en X, lames simples + pommeaux ronds
- **Couleur** : **Noir `#1A1A1A`**
- **Mode compo** : SymbolOnly

```
Pure silhouette of two short crossed swords forming an X.
Solid pure white #FFFFFF on transparent background.
Simple blade shapes meeting at the center, small round pommels
at the handle ends. Slightly taller than wide (swords point
upper-left and upper-right, handles down). NO gradient, NO
outline, NO ornate detail.
```

---

### 7. `<ico:action>` — Carte Action 🎴

- **Represente** : "defaussez 1 Action de votre main", "jouez 1 <ico:action>"
- **Forme** : rectangle de carte avec un **eclair** au centre (Cutout)
- **Couleur** : **Noir `#1A1A1A`**
- **Mode compo** : Cutout

```
Pure silhouette of a small vertical playing card with a bold
zigzag lightning bolt cut out of its center (the bolt shape is
negative space revealing the transparent background through the card).
Solid pure white #FFFFFF on transparent background.
NO gradient, NO outline. Card proportions: taller than wide.
Bolt occupies ~60% of the card height, centered.
```

---

### 8. `<ico:destin>` — Carte Destin 🔮

- **Represente** : "piochez 1 carte Destin"
- **Forme** : rectangle de carte avec une **spirale** au centre (Cutout)
- **Couleur** : **Noir `#1A1A1A`**
- **Mode compo** : Cutout
- **Coherence dos** : meme spirale que le dos Destin.
- **Collision evitee** : precedemment une etoile 4 branches, qui entrait en collision avec `<ico:capacite>`. La spirale resout le probleme et colle au dos.

```
Pure silhouette of a small vertical playing card with a bold
spiral (2-3 rotations, curving inward, thickening toward the
center) cut out of its center — negative space revealing
transparent background through the card.
Solid pure white #FFFFFF on transparent background.
NO gradient, NO outline. Card proportions: taller than wide.
Spiral fills ~60% of the card height, centered.
```

---

### 9. `<ico:chasse>` — Carte Chasse 🏹

- **Represente** : "defaussez 1 <ico:chasse> de votre main", "piochez <ico:chasse>"
- **Forme** : rectangle de carte avec un **silex taille** au centre (Cutout)
- **Couleur** : **Noir `#1A1A1A`**
- **Mode compo** : Cutout
- **Coherence dos** : meme silex que le dos Chasse.
- **Precedent** : etait une pointe de fleche. Le silex est plus distinctif et evite toute confusion avec l'icone de competence Distance d'Isonash.

```
Pure silhouette of a small vertical playing card with a bold
knapped flint arrowhead (rough triangular shape with chipped
edges, primitive and asymmetrical, point at the top) cut out of
its center — negative space revealing transparent background
through the card.
Solid pure white #FFFFFF on transparent background.
NO gradient, NO outline. Card proportions: taller than wide.
Flint fills ~60% of the card height, centered.
```

---

## Recapitulatif gabarit "carte + signe"

Les 3 types de cartes jouables (`action`, `destin`, `chasse`) + `menace` partagent le **meme gabarit Cutout** : rectangle vertical noir, signe en negatif au centre.

| Balise | Signe interieur | Coherence dos |
|---|---|---|
| `<ico:menace>` | Gueule de bete | ✅ Dos Menace |
| `<ico:action>` | Eclair zigzag | — (pas de dos Action independant) |
| `<ico:destin>` | Spirale | ✅ Dos Destin |
| `<ico:chasse>` | Silex taille | ✅ Dos Chasse |

---

## Checklist lisibilite inline

Avant de valider une icone generee :

- [ ] Rendu **aplat pur** : pas de gradient, pas de highlight, pas d'outline
- [ ] **Silhouette seule** lisible en noir sur fond blanc
- [ ] **A 16 px de haut** sur ecran : la forme reste reconnaissable
- [ ] **Fond transparent** : l'icone s'insere proprement dans une ligne de texte
- [ ] **Hauteur = hauteur de capitale du texte** + 10% max
- [ ] **Pas de confusion** avec une autre icone du jeu (verifier contre les 8 autres)
- [ ] **Pour les 4 tags "type de paquet"** : la silhouette correspond au dos

---

## Mapping de production

| Tag | Couleur compo | Mode | Fichier source (blanc) | Fichier cible |
|---|---|---|---|---|
| `<ico:degat>` | Cramoisi `#8B2020` | SymbolOnly | `Sources/Degat.png` | `Icons/Inline/Degat.png` |
| `<ico:capacite>` | Or `#D4A830` | SymbolOnly | `Sources/Capacite.png` | `Icons/Inline/Capacite.png` |
| `<ico:actif_boss>` | Noir `#1A1A1A` | SymbolOnly | `Sources/Actif_boss.png` (copie de Action) | `Icons/Inline/Actif_boss.png` |
| `<ico:menace>` | Noir `#1A1A1A` | Cutout | `Sources/Menace.png` | `Icons/Inline/Menace.png` |
| `<ico:invocation>` | Noir `#1A1A1A` | SymbolOnly | `Sources/Invocation.png` | `Icons/Inline/Invocation.png` |
| `<ico:attaque>` | Noir `#1A1A1A` | SymbolOnly | `Sources/Attaque.png` | `Icons/Inline/Attaque.png` |
| `<ico:action>` | Noir `#1A1A1A` | Cutout | `Sources/Action.png` | `Icons/Inline/Action.png` |
| `<ico:destin>` | Noir `#1A1A1A` | Cutout | `Sources/Destin.png` | `Icons/Inline/Destin.png` |
| `<ico:chasse>` | Noir `#1A1A1A` | Cutout | `Sources/Chasse.png` | `Icons/Inline/Chasse.png` |

---

## Changements vs version precedente

- Suppression de la famille "rouge sombre" (boss) : fusionnee dans le noir, differenciation par forme
- Suppression de la famille "brun" (gameplay) : fusionnee dans le noir
- **2 exceptions gardees** : degat cramoisi, capacite or
- **Shape changes** (coherence avec dos) :
  - `<ico:menace>` griffure → **gueule a crocs**
  - `<ico:destin>` etoile 4 branches → **spirale** (resout aussi la collision avec capacite)
  - `<ico:chasse>` pointe de fleche → **silex taille**
  - `<ico:invocation>` patte → **creature trapue** (partage shape avec dos Monstre)
