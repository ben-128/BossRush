# Fonds de cartes - Raid Party

> Fond coloré par type de héros, texture cuir/pierre marbrée style MTG.

## Principe

Chaque carte a un fond coloré qui dépend du héros requis (comme les terrains dans Magic).
Le fond est **très subtil** : parchemin vieilli avec un lavis d'encre colorée, filigrane gravé à peine visible.
Il ne doit PAS concurrencer l'illustration ni les éléments d'UI.

## Format

- Ratio **2:3** portrait (1024x1536 natif DALL-E)
- Découper/adapter selon le layout final de carte

## Prompt template

### Prompt positif

```
Aged parchment texture with subtle dark ink engraving pattern.
Abstract background fill: very faint crosshatched filigree border
ornaments fading into a smooth center. Heavy paper grain visible.
Monochrome {{COULEUR}} tint over aged sepia parchment base.
The color is a SUBTLE WASH, like diluted ink soaked into old paper,
NOT a solid digital fill. Darker at edges (vignette), lighter at center.
Very faint decorative engraved linework: intertwining vines, runes,
or geometric knotwork, barely visible, like a watermark pressed into
the paper. NO characters, NO objects, NO focal point — pure texture.
Printmaking aesthetic, hand-carved woodblock feel.
Style of antique book endpaper or medieval manuscript margin decoration.
Portrait orientation, 2:3 aspect ratio.
```

### Prompt négatif

```
character, figure, face, object, weapon, text, logo, bright, saturated,
digital, clean, smooth, gradient, modern, photorealistic, sharp details,
busy, cluttered, illustration, scene
```

## Couleurs par héros

| Hero | Couleur prompt | Fichier |
|---|---|---|
| Guerrier | `deep muted crimson red` | `bg_guerrier.png` |
| Mage | `deep muted sapphire blue` | `bg_mage.png` |
| Diplomate | `warm muted sienna brown` | `bg_diplomate.png` |
| Rodeur | `deep muted forest green` | `bg_rodeur.png` |
| Soigneur | `warm muted amber gold` | `bg_soigneur.png` |

## Palette de reference (extraite du Guerrier)

| Zone | Hex | Usage |
|---|---|---|
| **Fond parchemin base** | `#D8C2A3` | Couleur principale du fond |
| **Parchemin clair** | `#E6D3B8` | Zones claires, centre, rehauts |
| **Parchemin fonce** | `#BFA07A` | Zones foncees, bords, vignettage |
| **Encre noire** | `#1A1A1A` | Contours, hachures principales |
| **Ombres hachures** | `#3A3228` | Hachures denses, ombres profondes |
| **Hachures moyennes** | `#6B5E50` | Armure, sol, details mi-tons |
| **Ciel/fond lointain** | `#8A7D6F` | Arriere-plan, gris chaud |
| **Blanc casse** | `#E8DDD0` | Bouclier, zones les plus claires |

## Prompt de changement de couleur

Pour recoloriser un fond de carte d'une couleur de hero a une autre, utiliser ce prompt :
```
Take this card background texture and shift its color tone from
{{COULEUR_ACTUELLE}} to {{COULEUR_CIBLE}}. Keep the exact same
texture, grain, mottled pattern, and tonal variation. Only change
the hue/tint. The result should look like the same leather/stone
surface but dyed in a different color. Keep it muted and desaturated.
```

## Notes

- Le fond doit être **très désaturé** pour ne pas concurrencer l'illustration
- Style "endpaper de vieux livre" / "parchemin avec filigrane" cohérent avec la gravure Doré
- Si trop chargé, retirer le filigrane et garder juste le lavis coloré + grain papier
- Vignettage naturel : bords plus sombres, centre plus clair
