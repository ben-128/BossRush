# Direction Artistique - Boss Rush

> Document de reference unique pour la generation et le post-traitement de toutes les illustrations du jeu.

## Style retenu : Gravure / Encre noire + couleur selective

**Decision :** avril 2026, apres comparaison de l'original (peinture numerique IA) avec un test en style gravure sur le Guerrier.

**Justification :** Le rendu "IA" de l'illustration originale etait trop visible (flou, textures lisses, fond generique). Le style gravure masque efficacement l'origine IA et donne une identite visuelle distinctive, reconnaissable en rayon JdS.

**Principe :** Toutes les illustrations (heros, monstres, epreuves) partagent ce style pour assurer la coherence visuelle du jeu.

---

## 1. Prompt template (img2img)

Uploader l'illustration existante, puis utiliser le prompt ci-dessous en adaptant les variables entre `{{ }}`.

### Prompt positif

```
Dark fantasy ink engraving illustration of {{SUJET}}.
Style of Gustave Dore woodcut engraving with heavy crosshatching,
dramatic chiaroscuro, black ink on aged parchment.
Bold confident linework, visible hatching strokes for shading, no smooth gradients.
High contrast, limited palette: black ink with selective {{COULEUR}} accent on {{ELEMENTS_COULEUR}} only.
Printmaking aesthetic, hand-carved feel.
{{PROMPT_VISAGE}}
```

### Variables par type d'asset

| Variable | Description | Exemples |
|---|---|---|
| `{{SUJET}}` | Description du personnage/scene, pose, equipement, decor | voir section 3 |
| `{{COULEUR}}` | Couleur d'accent unique du hero | `red`, `electric blue`, `emerald green` |
| `{{ELEMENTS_COULEUR}}` | Element(s) portant l'accent colore | `cape and shield emblem`, `glowing runes`, `crystal arrowhead` |
| `{{PROMPT_VISAGE}}` | Description du visage : traits uniques, imperfections, expression | voir section 3 |

### Prompt negatif

```
smooth, airbrushed, digital painting, photorealistic, soft focus, blurry, generic,
stock art, midjourney style, artstation trending, watercolor, pastel, gradient,
multiple colors, colorful, saturated
```

### Reglages img2img

| Parametre | Valeur |
|---|---|
| Denoising strength | 0.55 - 0.70 |
| CFG scale | 7 - 9 |
| Sampler | DPM++ 2M Karras |
| Format | Portrait ~2:3 (cartes) ou 1:1 (icones) |

---

## 2. Regles visuelles

### Palette
- **Dominante :** Noir encre (hachures, contours, ombres). Quasi-totalite de l'image est en noir et blanc.
- **Accent :** UNE SEULE couleur selective par hero, appliquee sur 1-2 elements forts maximum
- **Fond :** Tons sombres, parcheminee / sepia tres desature
- **Interdit :** Pas de melange de couleurs. Une illustration = noir + une couleur. Le reste est en niveaux de gris/encre.

### Trait
- Hachures visibles, croisees pour les ombres
- Contours nets et affirmes
- Pas de degrade lisse ni de flou artistique
- Rendu "grave dans le bois" (woodcut)

### Composition
- Le personnage/sujet occupe ~70% du cadre
- Fond suggestif, pas trop detaille (risque de bruit a petite taille)
- Contraste figure/fond : le sujet doit se detacher clairement

### Lisibilite a taille carte (63x88mm)
- Eviter les hachures trop denses qui deviennent un aplat sombre
- Eclaircir legerement la zone du personnage
- Les details importants (visage, arme, embleme) doivent rester lisibles

---

## 3. Sujets par hero

Chaque hero a **une couleur d'accent unique**. L'illustration est quasi entierement noire/encre, avec cette couleur appliquee sur 1-2 elements forts seulement.

Le **visage** est l'element le plus important de chaque illustration. Il doit etre net, detaille, avec une forte personnalite. Chaque hero a un visage unique, memorable, avec des imperfections, de l'asymetrie et du caractere. Pas de "beau visage generique IA".

| Hero | Couleur | Sujet | Elements couleur | Visage |
|---|---|---|---|---|
| **Guerrier** | Rouge | An armored warrior in defensive stance holding a large shield with a phoenix emblem, cape flowing, battlefield background at dusk | cape and shield emblem | Sharp detailed face of a weathered black male soldier, broken nose, deep scar across left cheek, intense determined gaze, square jaw clenched, short cropped hair, asymmetric brow ridge |
| **Mage** | Bleu electrique | A female mage channeling lightning through a sapphire crystal staff, arcane circle glowing beneath her, storm clouds background | arcane runes and lightning arcs | Sharp detailed face of a gaunt woman with hollow cheekbones, piercing asymmetric eyes one slightly larger, thin severe lips, silver-streaked hair pulled tight, burn mark on temple, unsettling knowing expression |
| **Diplomate** | Brun/sepia chaud | A diplomat in leather cape holding a sealed scroll, grand hall with banners background | wax seal and banner crests | Sharp detailed face of a middle-aged man with a crooked aristocratic nose, laugh lines deeply etched, shrewd narrow eyes, neatly trimmed greying beard, receding hairline, confident half-smile |
| **Rodeur** | Vert emeraude | A female ranger drawing a bow with a crystal-tipped arrow, cathedral forest background, quiver on back | crystal arrowhead and bowstring glow | Sharp detailed face of a young woman with freckled sun-weathered skin, alert wide-set eyes, small scar on upper lip, wild windswept braided hair, angular jaw, focused hunting expression |
| **Soigneur** | Or/jaune dore | A male healer channeling light from open palms, ruined temple background, sacred symbols floating | healing light and sacred symbols | Sharp detailed face of an older man with deep-set compassionate eyes, prominent crow's feet, aquiline nose slightly bent, thin white beard, age spots on forehead, serene but weary expression |

---

## 4. Post-traitement obligatoire

Apres chaque generation, appliquer dans l'ordre :

1. **Visage (inpainting - PRIORITE #1)** — Le visage fait ou defait l'illustration. Toujours regenerer en zoom avec le prompt visage de la section 3. Criteres :
   - **Nettete** : le visage doit etre la zone la plus nette de l'image
   - **Identite** : traits uniques et memorables, pas un visage generique
   - **Imperfections** : cicatrices, asymetrie, rides, nez casse, marques — ce qui rend le personnage humain et credible
   - **Expression** : emotion lisible, coherente avec le personnage
   - **Lisibilite** : doit rester lisible imprime a 63x88mm
   - Si le visage est "trop beau" ou "trop lisse" apres generation, c'est rate — recommencer.

2. **Details equipement (inpainting)** — Retoucher les zones d'armure, armes, emblemes si les textures sont trop "fondues". Ajouter nettete et bords durs.

3. **Contraste figure/fond** — Si le personnage se perd dans le decor, assombrir le fond. Eventuellement ajouter un vignettage leger.

4. **Verification palette** — S'assurer qu'aucune couleur parasite n'est apparue. Seuls le noir, le sepia desature et la couleur d'accent du hero sont autorises.

5. **Finitions optionnelles** :
   - Texture grain/papier en mode Multiply
   - Sharpening selectif sur le personnage
   - Bruit chromatique subtil (2-3%)

---

## 5. Application aux autres types d'assets

### Monstres
Meme prompt template. Le rouge selectif est utilise pour les elements menacants (yeux, griffes sanglantes, magie hostile).

### Epreuves (scenes)
Meme prompt template. Le sujet est un lieu ou une situation. Le rouge selectif est utilise pour l'element de danger ou d'interet (piege, lueur, sang).

### Icones
- Format 1:1 au lieu de 2:3
- Denoising plus eleve (0.65-0.75) car on veut un rendu plus graphique/simplifie
- Le rouge selectif est l'element central de l'icone
- Fond transparent ou noir uni

---

## Historique des decisions

| Date | Decision |
|---|---|
| 2026-04-09 | Style gravure retenu apres test sur le Guerrier. Abandon du style "MTG painterly" initial. |
