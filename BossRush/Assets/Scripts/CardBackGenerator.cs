using System;
using UnityEngine;

public class CardBackGenerator : MonoBehaviour
{
    [Serializable]
    public class CardBackEntry
    {
        public string nom;
        public Sprite sprite;
        public Vector2 offset = Vector2.zero;
        public float scale = 1f;

        [Tooltip("Si coché, export 5 versions de cette carte (une par couleur de compétence dans heroPalette). Ex : le dos Héros et le dos Chasse.")]
        public bool variantsParCompetence = false;

        [Tooltip("Si coché, remplace le sprite commun par l'icône spécifique du héros (depuis heroPalette). Cocher pour Héros, décocher pour Chasse.")]
        public bool useHeroIcon = false;

        [Tooltip("Si coché, tous les pixels non transparents de l'icône sont remplacés par la couleur du héros (flat fill via SpriteSilhouette shader). Sinon, la couleur teinte le sprite en multiply (white→color, dark→darker). Cocher pour Héros (icône blanche pleine), décocher pour Chasse (illustration qui doit garder ses détails).")]
        public bool silhouetteFill = false;
    }

    [Header("Export")]
    public string outputFolder;

    [Header("Visuels")]
    public SpriteRenderer backgroundRenderer;
    public SpriteRenderer iconRenderer;

    [Tooltip("Liste des fonds de dos (1 par entrée, dans le même ordre). Si un slot est vide, le background n'est pas changé.")]
    public Sprite[] backgrounds;

    [Header("Palette héros (partagée)")]
    [Tooltip("Palette partagée avec HeroCardGenerator. Nécessaire pour exporter les variantes par compétence (dos Héros).")]
    public CompetenceColorPalette heroPalette;

    [Header("Dos de cartes")]
    public CardBackEntry[] entries;

    public int Count => entries?.Length ?? 0;

    public string GetCardName(int index) => entries[index].nom;

    /// <summary>
    /// Nombre de variantes d'une entrée donnée. 1 si pas de variantes, sinon
    /// le nombre de couleurs dans heroPalette.
    /// </summary>
    public int GetVariantCount(int index)
    {
        if (entries == null || index < 0 || index >= entries.Length) return 1;
        var entry = entries[index];
        if (!entry.variantsParCompetence) return 1;
        if (heroPalette == null || heroPalette.heroes == null || heroPalette.heroes.Length == 0) return 1;
        return heroPalette.heroes.Length;
    }

    /// <summary>
    /// Nom de l'export pour une variante donnée.
    /// Ex : "Heros_Nawel", "Heros_Daraa", ...
    /// </summary>
    public string GetVariantName(int index, int variantIndex)
    {
        if (entries == null || index < 0 || index >= entries.Length) return "";
        var entry = entries[index];
        if (!entry.variantsParCompetence || heroPalette == null) return entry.nom;
        if (variantIndex < 0 || variantIndex >= heroPalette.heroes.Length) return entry.nom;
        return $"{entry.nom}_{heroPalette.heroes[variantIndex].heroName}";
    }

    public void GenerateCard(int index) => GenerateCard(index, 0);

    // Cache pour éviter de recréer le material silhouette à chaque génération
    private Material _silhouetteMatCache;
    private Material _originalIconMaterial;

    private Material GetOrCreateSilhouetteMaterial()
    {
        if (_silhouetteMatCache == null)
        {
            var shader = Shader.Find("Custom/SpriteSilhouette");
            if (shader == null)
            {
                Debug.LogError("[CardBackGenerator] Shader 'Custom/SpriteSilhouette' introuvable.");
                return null;
            }
            _silhouetteMatCache = new Material(shader) { name = "GameIconsSilhouette_Runtime" };
        }
        return _silhouetteMatCache;
    }

    public void GenerateCard(int index, int variantIndex)
    {
        var entry = entries[index];

        // Background
        if (backgroundRenderer != null && backgrounds != null && index < backgrounds.Length && backgrounds[index] != null)
        {
            backgroundRenderer.sprite = backgrounds[index];
        }

        // Icône
        if (iconRenderer != null)
        {
            if (_originalIconMaterial == null) _originalIconMaterial = iconRenderer.sharedMaterial;

            bool useVariant = entry.variantsParCompetence && heroPalette != null
                              && heroPalette.heroes != null
                              && variantIndex >= 0 && variantIndex < heroPalette.heroes.Length;

            // Sprite : icône héros si useHeroIcon + variante valide, sinon sprite commun de l'entry
            Sprite finalSprite = entry.sprite;
            Color tint = Color.white;

            if (useVariant)
            {
                var heroEntry = heroPalette.heroes[variantIndex];
                tint = heroEntry.color;
                if (entry.useHeroIcon && heroEntry.icon != null)
                    finalSprite = heroEntry.icon;
            }

            iconRenderer.sprite = finalSprite;

            if (useVariant && entry.silhouetteFill)
            {
                // Mode silhouette : replace tous les pixels non-transparents par tint
                var silMat = GetOrCreateSilhouetteMaterial();
                if (silMat != null)
                {
                    iconRenderer.sharedMaterial = silMat;
                    silMat.SetColor("_Color", tint);
                }
                iconRenderer.color = Color.white; // inutilisé par le shader silhouette
            }
            else
            {
                // Mode standard : material d'origine, couleur multipliée (blanc = neutre)
                iconRenderer.sharedMaterial = _originalIconMaterial;
                iconRenderer.color = tint;
            }

            if (iconRenderer.sprite != null)
            {
                iconRenderer.transform.localPosition = (Vector3)entry.offset + Vector3.forward * -0.01f;
                iconRenderer.transform.localScale = new Vector3(entry.scale, entry.scale, 1f);
            }
        }
    }
}
