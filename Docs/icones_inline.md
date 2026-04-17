# Icones inline (dans le texte des cartes)

> Icones inserees via la balise `<ico:tag>` au milieu du texte de carte —
> "piochez <ico:chasse>", "infligez <ico:degat><ico:degat>", "<ico:attaque> le monstre...".
> Balises definies dans [editeur_cartes.py](../BossRush/Assets/Data/editeur/editeur_cartes.py) L30-40.

---

## Pourquoi un doc separe

Les icones decrites dans [icon_design.md](icon_design.md) sont pensees pour les **emplacements fixes** (bas-gauche = degats, bas-droite = PV, haut-gauche = type, etc.). Quand la meme icone est incrustee au milieu d'une phrase, les contraintes changent :

- **Taille** : doit tenir sur une hauteur de capitale (~14-18 pt sur carte 63×88 mm)
- **Silhouette first** : l'icone doit rester lisible en monochrome, sans relief, sans gradient
- **Poids visuel** : meme "densite" que les lettres autour, sinon ca accroche l'oeil a contretemps
- **Pas de detail interne** : a 16 px de haut, tout trait fin est noye

Certaines icones (degat, capacite) sont deja OK telles quelles. D'autres (chasse, destin) n'existent pas encore ou doivent etre simplifiees pour l'inline.

---

## Conventions observees dans d'autres jeux (reference)

| Jeu | Usage | Leçon |
|---|---|---|
| **Frosthaven / Gloomhaven** | "Move <ico:move>, attack <ico:attack>" | Icone = **pure silhouette monochrome**, pas de couleur. Lisibilite max. |
| **Sleeping Gods** | Competences et objets inline | Sepia/brun, **chaque icone = 1 forme iconique**, aucun detail interne |
| **Magic: The Gathering** | Symboles de mana | **Cercle + une seule forme au centre**. Gabarit reutilisable. |
| **Root** | Factions, biens | **1 couleur plate, contour un peu plus epais** que le texte |
| **Arkham Horror LCG** | Degats, horreur, actions | **Monochrome sombre**, forme simple, lisible en N&B |
| **Slay the Spire** | Effets (strength, block) | **Icone = metaphore directe** (bouclier, poing) ; jamais de mot redondant |

**Trois regles qui en ressortent :**
1. Une icone inline, c'est **une silhouette**, pas un mini-tableau.
2. Quand l'icone represente **un type de carte**, on dessine **une carte (rectangle) avec UN signe dedans**. Ca distingue l'icone du signe seul (ex: "carte Action" vs "Actif boss" qui sont tous les deux des eclairs si on fait pas gaffe).
3. La couleur sert a **trier les familles** (boss vs heros vs neutre), pas a decorer.

---

## Palette inline

| Famille | Couleur | Usage |
|---|---|---|
| **Action/gameplay neutre** (chasse, action, destin, pioche...) | Brun fonce `#3A2E22` | Type de carte, action generique |
| **Danger / boss** (menace, invocation, attaque, actif_boss) | Rouge sombre `#6B1515` | Tout ce qui vient du Colosse |
| **Heros** (capacite) | Or `#D4A830` | Capacite speciale heros |
| **Degats** | Cramoisi `#8B2020` | Goutte de sang |

Logique : un lecteur doit **voir la couleur avant la forme** et savoir si c'est "moi qui fais", "le boss qui fait", ou "info neutre". Le rouge sombre groupe tout ce que le colosse declenche.

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

## Inventaire des 9 balises

### 1. `<ico:degat>` — Degat / blessure 🩸

- **Represente** : 1 point de degat, ou 1 blessure existante
- **Forme** : **Goutte de sang arrondie, compacte** (presque circulaire, petite pointe en haut)
- **Couleur** : Cramoisi `#8B2020`
- **Alternative** : Deja definie dans `icon_design.md` section A — version inline = meme forme, aplat pur sans gradient
- **Note** : le chiffre **n'est PAS** dans la goutte en inline (contrairement au bas-droite de carte). On repete la goutte : `<ico:degat><ico:degat>` = 2 degats.

```
Pure silhouette of a fat rounded blood drop, almost circular
with a tiny pointed tip at the top. Solid crimson red #8B2020,
transparent background. NO gradient, NO highlight, NO outline.
Chunky and compact — NOT elongated, NOT thin, NOT elegant.
Think: a round dot with a tiny peak on top.
```

---

### 2. `<ico:capacite>` — Capacite speciale heros 💠

- **Represente** : "activez votre capacite speciale"
- **Forme** : **Etoile a 4 branches (compass rose)**, branches triangulaires epaisses
- **Couleur** : Or `#D4A830`
- **Note** : meme forme que dans `icon_design.md`, version inline = aplat pur

```
Pure silhouette of a 4-pointed star burst, compass-rose style.
Solid warm golden yellow #D4A830, transparent background.
NO gradient, NO outline. Each point is wide triangular, NOT thin,
NOT spiky. Symmetrical, chunky, slightly taller than wide.
```

---

### 3. `<ico:actif_boss>` — Actif du boss ⚡

- **Represente** : "declenchez l'actif du Colosse (voir fiche)"
- **Forme** : **Eclair zigzag a 3 segments**, angulaire
- **Couleur** : Rouge sombre `#6B1515`
- **Pourquoi eclair et pas etoile** : on veut marquer la differenciation visuelle avec `<ico:capacite>` (etoile or heros) — le boss frappe vite et brutalement, l'eclair lit mieux que l'etoile pour "le Colosse agit".
- **Alternative** : 4-pointed star rouge sombre (comme actuellement dans icon_design.md). Choisir l'UN des deux pour tout le jeu — ma reco est l'**eclair** pour eviter la confusion heros/boss quand un joueur debute.

```
Pure silhouette of a bold zigzag lightning bolt, 3 segments,
angular. Solid dark red #6B1515, transparent background.
NO gradient, NO outline. Aggressive and taller than wide.
Top segment slightly larger than bottom.
```

---

### 4. `<ico:menace>` — Piocher carte Menace 🃏

- **Represente** : "piochez 1 carte Menace et resolvez-la"
- **Forme** : **Rectangle de carte (vertical) avec une griffure diagonale**
- **Couleur** : Rouge sombre `#6B1515` (famille boss)
- **Pourquoi** : la carte Menace = quelque chose que **le boss envoie au joueur**. Le motif "carte griffee" dit immediatement "mauvaise nouvelle que tu vas devoir subir". Lisible en 1 coup d'oeil meme a 16 px.
- **Alternatives testables** :
  - Carte + oeil corrompu au centre (plus narratif, moins lisible)
  - Crane seul (trop violent, redondant avec iconographie boss)
  - Carte + rune cassee (trop abstrait)

```
Pure silhouette of a small vertical playing card with a single
bold diagonal claw scratch crossing it from upper-left to
lower-right. Solid dark red #6B1515, transparent background.
The scratch is cut OUT of the card shape (negative space),
so the card has 3 parallel gashes showing transparency through it.
NO gradient, NO outline. Chunky card proportions (taller than wide).
```

---

### 5. `<ico:invocation>` — Piocher un monstre 🐾

- **Represente** : "placez 1 monstre dans la file du heros actif"
- **Forme** : **Empreinte de patte stylisee** (1 coussin principal + 3-4 orteils)
- **Couleur** : Rouge sombre `#6B1515`
- **Pourquoi** : universellement compris, deja utilise par l'emoji 🐾 dans la doc. Zero friction cognitive.
- **Alternatives** :
  - Oeuf fissure (narratif : "la corruption eclot") — joli mais moins immediat
  - Portail brise (deja reserve a "invocation boss" dans icon_design.md pour la fiche boss — **collision** a eviter ici)
  - Oeil ouvert (trop generique)
- **Reco** : garder l'empreinte pour l'inline (plus lisible), reserver le portail brise a la fiche boss (grand format).

```
Pure silhouette of a single animal paw print — one large rounded
heel pad at the bottom, three smaller oval toe pads above.
Solid dark red #6B1515, transparent background.
NO gradient, NO outline, NO claw marks. Bold simple shape.
Compact and nearly square.
```

---

### 6. `<ico:attaque>` — Ordre d'attaque ⚔

- **Represente** : "le monstre en tete de file attaque le heros actif"
- **Forme** : **Deux epees croisees en X**, lames simples + pommeaux ronds
- **Couleur** : Rouge sombre `#6B1515`
- **Pourquoi** : lecture instantanee "combat". L'emoji ⚔ utilise deja ce code.
- **Alternative** : griffe unique avec traînee de mouvement (plus coherent avec le theme bete corrompue) — mais moins immediat que l'epee croisee pour "attaque" dans un contexte de jeu.
- **Reco** : epees croisees. Thematiquement ca marche aussi (les heros affrontent la creature → l'icone represente l'action "combat" generique).

```
Pure silhouette of two short crossed swords forming an X.
Solid dark red #6B1515, transparent background.
Simple blade shapes meeting at the center, small round pommels
at the handle ends. Slightly taller than wide (swords point
upper-left and upper-right, handles down). NO gradient, NO
outline, NO ornate detail, NO crossguard decoration.
```

---

### 7. `<ico:action>` — Carte Action 🎴

- **Represente** : "defaussez 1 Action de votre main", "jouez 1 <ico:action>"
- **Forme** : **Rectangle de carte (vertical) avec un eclair au centre**
- **Couleur** : Brun fonce `#3A2E22` (famille gameplay neutre)
- **Pourquoi PAS l'eclair seul** : `<ico:actif_boss>` est deja un eclair. Si `<ico:action>` est aussi un eclair seul, ils deviennent indiscernables malgre la couleur. On englobe donc l'eclair dans une silhouette de carte — meme logique pour `<ico:destin>` et `<ico:chasse>`. Les trois types de carte partagent le gabarit "rectangle + signe interieur".

```
Pure silhouette of a small vertical playing card with a bold
zigzag lightning bolt cut out of its center (the bolt shape is
negative space revealing the transparent background through the card).
Solid dark brown #3A2E22 on transparent background.
NO gradient, NO outline. Card proportions: taller than wide.
Bolt occupies ~60% of the card height, centered.
```

---

### 8. `<ico:destin>` — Carte Destin 🔮

- **Represente** : "piochez 1 carte Destin"
- **Forme** : **Rectangle de carte (vertical) avec une etoile a 4 branches au centre**
- **Couleur** : Brun fonce `#3A2E22`
- **Pourquoi etoile et pas oeil/spirale/sablier** :
  - **Oeil** → connote la surveillance (plus proche de menace)
  - **Sablier** → connote le temps, pas le hasard
  - **Spirale** → trop complique a 16 px
  - **Etoile** → le "destin stellaire" + forme simple en aplat
- **Attention collision** : `<ico:capacite>` est aussi une etoile 4 branches, mais elle est **sans carte autour** + **or**. Ici l'etoile est **dans une carte** + **brun**. Les deux signes sont distinguables.

```
Pure silhouette of a small vertical playing card with a bold
4-pointed star cut out of its center (the star is negative space
revealing transparent background through the card).
Solid dark brown #3A2E22, transparent background.
NO gradient, NO outline. Card proportions: taller than wide.
Star points are wide triangles, not thin spikes. Star fills ~60%
of the card height, centered.
```

---

### 9. `<ico:chasse>` — Carte Chasse 🏹

- **Represente** : "defaussez 1 <ico:chasse> de votre main"
- **Forme** : **Rectangle de carte (vertical) avec une pointe de fleche au centre**
- **Couleur** : Brun fonce `#3A2E22`
- **Pourquoi pointe de fleche** :
  - Cor de chasse → trop de detail a 16 px
  - Fleche complete (tige + pointe + empennage) → trop longue, se tasse dans la carte
  - Pointe seule (triangle + petit trait) → lisible, evoque la chasse, coherent avec le motif fleche d'Isonash
- **Collision avec Isonash (distance)** : Isonash a une fleche **en vol diagonale** vert emeraude. Ici on a une pointe **frontale** dans une carte, en brun. Pas de confusion a l'oeil.

```
Pure silhouette of a small vertical playing card with a bold
upward-pointing arrowhead cut out of its center (arrowhead is
negative space revealing transparent background).
Solid dark brown #3A2E22, transparent background.
NO gradient, NO outline. Card proportions: taller than wide.
The arrowhead is a simple triangle with a short shaft stub below,
fills ~60% of the card height, centered.
```

---

## Recapitulatif gabarit "carte + signe"

Les 3 types de cartes jouables (`action`, `destin`, `chasse`) partagent le **meme gabarit** : rectangle vertical brun `#3A2E22`, signe en negatif au centre.

| Balise | Signe interieur | Rappel visuel |
|---|---|---|
| `<ico:action>` | Eclair zigzag | Action rapide/decisive |
| `<ico:destin>` | Etoile 4 branches | Hasard narratif |
| `<ico:chasse>` | Pointe de fleche | Paquet d'outils du heros |

Avantage : **coherence** (le lecteur apprend "rectangle = carte"), et **scalabilite** (si un type de carte est ajoute plus tard, on reutilise le gabarit avec un autre signe).

---

## Checklist lisibilite inline

Avant de valider une icone generee :

- [ ] Rendu **aplat pur** : pas de gradient, pas de highlight, pas d'outline
- [ ] **Silhouette seule** lisible en noir sur fond blanc (desaturer pour verifier)
- [ ] **A 16 px de haut** sur ecran : la forme reste reconnaissable
- [ ] **Fond transparent** : l'icone s'insere proprement dans une ligne de texte
- [ ] **Hauteur = hauteur de capitale du texte** + 10% max (plus grand = perturbe le flux de lecture)
- [ ] **Pas de confusion** avec une autre icone du jeu (verifier contre les 8 autres)

---

## Mapping de production

| Tag | Generation | Fichier cible | Utilise dans |
|---|---|---|---|
| `<ico:degat>` | Cramoisi | `Icons/inline/degat.png` | Chasse (attaques), Menaces, Monstres |
| `<ico:capacite>` | Or | `Icons/inline/capacite.png` | Heros, Chasse (regenerer) |
| `<ico:actif_boss>` | Rouge sombre | `Icons/inline/actif_boss.png` | Boss, Menaces |
| `<ico:menace>` | Rouge sombre | `Icons/inline/menace.png` | Boss, Chasse (effets sur pioche Menace) |
| `<ico:invocation>` | Rouge sombre | `Icons/inline/invocation.png` | Boss, Menaces |
| `<ico:attaque>` | Rouge sombre | `Icons/inline/attaque.png` | Boss, Menaces |
| `<ico:action>` | Brun | `Icons/inline/action.png` | Menaces (rare), Destins |
| `<ico:destin>` | Brun | `Icons/inline/destin.png` | Boss (Invunche), Menaces, Chasse |
| `<ico:chasse>` | Brun | `Icons/inline/chasse.png` | Menaces (defausser une Chasse), Destins |
