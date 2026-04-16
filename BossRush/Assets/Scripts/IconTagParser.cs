using System.Text.RegularExpressions;

/// <summary>
/// Remplace les balises <ico:tag> dans le texte JSON par des balises TMP
/// <sprite name="tag"> pour afficher les icones inline.
///
/// Utilisation :
///   string parsed = IconTagParser.Parse("Inflige <ico:degat> degat");
///   // → "Inflige <sprite name=\"degat\"> degat"
///
/// Le TMP_SpriteAsset "GameIcons" doit contenir un sprite par tag :
///   menace, invocation, attaque, actif_boss, degat,
///   action, capacite, destin, chasse, ord_monstre
///
/// Assigner ce SpriteAsset dans TMP Settings → Default Sprite Asset,
/// ou sur chaque TextMeshPro component → Extra Settings → Sprite Asset.
/// </summary>
public static class IconTagParser
{
    // Regex: capture <ico:xxx>
    private static readonly Regex IcoRegex = new Regex(
        @"<ico:(\w+)>",
        RegexOptions.Compiled
    );

    /// <summary>
    /// Remplace toutes les balises <ico:tag> par <sprite name="tag">.
    /// Retourne le texte inchange si null/vide ou sans balise.
    /// </summary>
    public static string Parse(string text)
    {
        if (string.IsNullOrEmpty(text))
            return text ?? "";

        return IcoRegex.Replace(text, m => $"<sprite name=\"{m.Groups[1].Value}\">");
    }
}
