# Design des Icones - Raid Party

> Reference principale : **Sleeping Gods** (Ryan Laukat) — icones geometriques simples dans cercles colores sur fond peint.

---

## Principes generaux

- **Style** : silhouettes noires ou bicolores (noir + couleur hero) sur pastille claire/papier
- **Coherence riso** : grain halftone visible, bords legerement fuzzy, pas de degrade lisse
- **Lisibilite** : chaque icone doit fonctionner a **1cm x 1cm** sur carte imprimee
- **Contraste** : icone simple/flat vs illustration complexe — le contraste de style EST la lisibilite
- **Pastille** : cercle ou forme geometrique de couleur unie (papier off-white ou couleur hero) avec contour noir epais

---

## Inventaire complet des icones necessaires

### Icones de statut (universelles)

| Icone | Concept visuel | Description |
|---|---|---|
| **Vie (PV)** | Coeur stylise | Coeur plein avec grain riso. Noir sur fond papier. Forme simple, pas anatomique — un coeur de carte a jouer simplifie avec texture halftone |
| **Blessure** | Griffure / entaille | 3 traits diagonaux paralleles (griffes), rouges sur fond papier. Evoque une laceration. Alternatif : goutte de sang stylisee avec eclats |
| **Capacite speciale (utilisee)** | Rotation 90° | Fleche courbe a 90° dans un cercle. Indique la carte tournee. Sobre, noir |
| **Capacite speciale (disponible)** | Eclat / etincelle | Etoile a 4 branches dans un cercle. Symbolise le pouvoir pret a etre utilise. Couleur du hero |

### Icones de competence (prerequis hero)

Chaque hero a une competence qui sert de prerequis pour ses cartes Arsenal. L'icone apparait en haut a droite de chaque carte.

| Competence | Hero | Concept visuel | Description |
|---|---|---|---|
| **Armure** | Nawel (Rempart) | Bouclier | Bouclier rond vu de face, motif geometrique simple au centre (soleil mapuche). Bleu acier + noir |
| **Elementaire / Magie** | Daraa (Flamme) | Flamme | Flamme stylisee a 3 langues, montante. Rouge cramoisi + noir. Forme simple, pas de detail — juste la silhouette de feu |
| **Soin** | Gao (Gardien) | Main ouverte + lumiere | Main ouverte paume vers le haut avec halo lumineux (points halftone dorés). Or/jaune + noir |
| **Distance** | Isonash (Piste) | Fleche / cible | Fleche en vol (diagonale, pointe vers le haut-droit) OU cible (cercles concentriques). Vert emeraude + noir |
| **Diplomatie** | Aslan (Porte-Voix) | Parchemin scelle | Rouleau de parchemin avec sceau en bas. Brun dore + noir. Alternatif : deux mains serrees |

### Icones de type de carte Arsenal

| Type | Concept visuel | Description |
|---|---|---|
| **Action** | Eclair / flash | Eclair angulaire simple (zigzag). Noir sur pastille. Indique l'immédiateté |
| **Objet** | Sac / sacoche | Petit sac noue en haut. Noir sur pastille. Evoque l'equipement portable |
| **Attaque (melee)** | Epee / hache | Lame simple croisee ou toki mapuche. Noir. Indique le contact |
| **Attaque (distance)** | Arc + fleche | Arc bande avec fleche. Noir. Distingue clairement de la melee |

### Icones de boss / epreuves

| Icone | Concept visuel | Description |
|---|---|---|
| **Invocation (boss)** | Portail / fissure | Cercle brise avec eclats sortants — comme un portail qui craque. Rouge + noir. Des silhouettes de monstres emergent de la fissure. Tres reconnaissable |
| **Degats boss** | Poing / impact | Poing ferme ou onde de choc (cercles concentriques d'impact). Rouge + noir |
| **Action speciale boss** | Oeil / symbole de danger | Oeil ouvert avec pupille fendue (reptilien) dans un triangle. Rouge + noir. Evoque la menace intelligente |
| **Passif boss** | Aura / halo permanent | Cercle avec rayons courts autour (comme un soleil sombre). Rouge + noir. Indique un effet toujours actif |
| **Soin boss** | Coeur + fleche montante | Coeur avec fleche vers le haut. Vert sombre + noir. Le boss se regenere |

### Icones de monstre

| Icone | Concept visuel | Description |
|---|---|---|
| **PV monstre** | Petit coeur | Version reduite du coeur PV, en rouge + noir |
| **Degats monstre** | Griffe | Griffe unique (1 trait courbe acere). Rouge + noir |
| **Capacite monstre** | Point d'exclamation | "!" dans un losange. Rouge + noir. Alerte : lire le texte |

### Icones speciales de gameplay

| Icone | Concept visuel | Description |
|---|---|---|
| **Pioche** | Pile de cartes + main | Main qui tire une carte d'une pile. Noir |
| **Echange** | Deux fleches croisees | Fleches en sens inverse, croisees en X. Noir |
| **Defausse** | Carte + fleche descendante | Carte avec fleche vers le bas. Noir |
| **Melee (cible)** | Tete de file | Fleche pointant vers la gauche (vers la tete de file). Noir |
| **Distance (cible)** | Fleche libre | Fleche pointant dans toutes les directions (choix). Noir |

---

## Regles de placement sur carte

### Carte Hero
- **Haut gauche** : icone Vie + nombre PV
- **Haut droite** : icone(s) Competence
- **Bas** : texte capacite speciale + icone "eclat" si disponible

### Carte Arsenal (Action/Objet)
- **Haut gauche** : icone Type (Action ou Objet)
- **Haut droite** : icone Prerequis competence (armure, magie, soin, distance, diplomatie)
- **Centre** : illustration
- **Bas** : zone texte effet + valeurs (degats, soin, etc.)

### Carte Monstre
- **Haut gauche** : PV (coeur + nombre)
- **Haut droite** : Degats (griffe + nombre)
- **Centre** : illustration
- **Bas** : capacite speciale si applicable (icone "!" + texte)

### Carte Epreuve
- **Haut** : type (Assaut / Evenement) + icone correspondante
- **Centre** : illustration ou texte d'evenement
- **Bas** : effet mecanique avec references aux stats boss ("?" = voir fiche)

### Fiche Boss
- **4 zones** alignees, chacune avec son icone :
  - Degats (poing) + valeur
  - Invocations (portail) + valeur
  - Action speciale (oeil) + texte
  - Passif (aura) + texte

---

## Implementation riso

Chaque icone suit le template du `art_direction.md` :

```
Risograph-style game icon.
2 colors: charcoal black + {{COULEUR}}.
Clean silhouette on off-white background.
Halftone grain texture visible.
MUST be instantly readable at 1cm x 1cm print size.
Bold, simple, graphic.
```

Les icones universelles (vie, blessure, pioche, etc.) utilisent **noir seul** sur papier.
Les icones liees a un hero utilisent **noir + couleur du hero**.
Les icones boss/monstre utilisent **noir + rouge cramoisi**.
