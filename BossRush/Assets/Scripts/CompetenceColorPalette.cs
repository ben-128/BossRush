using UnityEngine;

/// <summary>
/// Palette des 5 couleurs de compétence (une par héros), partageable entre
/// HeroCardGenerator et CardBackGenerator.
///
/// Création : Assets > Create > Boss Rush > Competence Color Palette
/// À référencer dans les deux générateurs pour garder le code couleur cohérent.
/// </summary>
[CreateAssetMenu(fileName = "CompetenceColorPalette", menuName = "Boss Rush/Competence Color Palette")]
public class CompetenceColorPalette : ScriptableObject
{
    [System.Serializable]
    public class HeroColor
    {
        [Tooltip("Nom du héros (utilisé comme suffixe dans les noms de fichiers exportés)")]
        public string heroName;

        [Tooltip("Compétence (armure, magie, diplomatie, distance, soin)")]
        public string competence;

        [Tooltip("Couleur de teinte pour cette compétence")]
        public Color color;

        [Tooltip("Icône associée au héros (ex: Icone_Guerrier pour Nawel). Utilisée par CardBackGenerator et HeroCardGenerator.")]
        public Sprite icon;

        [Tooltip("Échelle de l'icône sur la carte héros.")]
        public float iconScale = 1f;

        [Tooltip("Offset de positionnement de l'icône sur la carte héros.")]
        public Vector2 iconOffset = Vector2.zero;
    }

    [Header("Entrées par héros (ordre = ordre d'export des variantes)")]
    public HeroColor[] heroes = new[]
    {
        new HeroColor { heroName = "Nawel",   competence = "armure",     color = new Color(0.169f, 0.310f, 0.431f, 1f) }, // Bleu acier
        new HeroColor { heroName = "Daraa",   competence = "magie",      color = new Color(0.545f, 0.125f, 0.125f, 1f) }, // Cramoisi
        new HeroColor { heroName = "Aslan",   competence = "diplomatie", color = new Color(0.478f, 0.357f, 0.227f, 1f) }, // Sienna
        new HeroColor { heroName = "Isonash", competence = "distance",   color = new Color(0.165f, 0.369f, 0.227f, 1f) }, // Vert
        new HeroColor { heroName = "Gao",     competence = "soin",       color = new Color(0.608f, 0.482f, 0.184f, 1f) }, // Ambre
    };

    [Tooltip("Couleur fallback pour une compétence inconnue / neutre.")]
    public Color neutre = new Color(0.227f, 0.180f, 0.133f, 1f);

    public Color GetColorByCompetence(string competence)
    {
        if (string.IsNullOrEmpty(competence) || heroes == null) return neutre;
        foreach (var h in heroes)
            if (string.Equals(h.competence, competence, System.StringComparison.OrdinalIgnoreCase))
                return h.color;
        return neutre;
    }

    public Color GetColorByHero(string heroName)
    {
        if (string.IsNullOrEmpty(heroName) || heroes == null) return neutre;
        foreach (var h in heroes)
            if (string.Equals(h.heroName, heroName, System.StringComparison.OrdinalIgnoreCase))
                return h.color;
        return neutre;
    }

    /// <summary>Retourne l'entrée héros correspondant à une compétence, ou null.</summary>
    public HeroColor GetByCompetence(string competence)
    {
        if (string.IsNullOrEmpty(competence) || heroes == null) return null;
        foreach (var h in heroes)
            if (string.Equals(h.competence, competence, System.StringComparison.OrdinalIgnoreCase))
                return h;
        return null;
    }
}
