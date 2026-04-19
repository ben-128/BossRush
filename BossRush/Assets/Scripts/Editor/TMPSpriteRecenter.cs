using System.Collections.Generic;
using UnityEditor;
using UnityEngine;
using UnityEngine.TextCore;
using TMPro;

/// <summary>
/// Recentre automatiquement tous les sprites d'un TMP_SpriteAsset en
/// trouvant le bounding box alpha réel de chaque icône dans l'atlas,
/// puis en ajustant les métriques (glyphRect + bearings + advance) pour
/// que chaque icône soit centrée horizontalement et verticalement sur
/// son point d'insertion dans le texte.
///
/// Usage :
///   1. Sélectionner un TMP_SpriteAsset dans le Project
///   2. Menu : Tools > Raid Party > Recentrer sprites TMP (atlas sélectionné)
///
/// Prérequis : la texture d'atlas doit être en Read/Write enabled
/// (cocher la case dans les Import Settings).
/// </summary>
public static class TMPSpriteRecenter
{
    private const float AlphaThreshold = 0.05f;

    // Ancien MenuItem retiré — accessible via Tools > Raid Party > Fenetre Outils
    public static void RecenterSelectedAsset(float yOffsetPx = 0f)
    {
        var asset = Selection.activeObject as TMP_SpriteAsset;
        if (asset == null)
        {
            EditorUtility.DisplayDialog(
                "Recentrer sprites",
                "Sélectionne d'abord un TMP_SpriteAsset dans le Project window.",
                "OK");
            return;
        }

        Recenter(asset, yOffsetPx);
    }

    public static void Recenter(TMP_SpriteAsset asset, float yOffsetPx = 0f, bool showDialog = true)
    {
        var tex = asset.spriteSheet as Texture2D;
        if (tex == null)
        {
            Debug.LogError($"[TMPSpriteRecenter] Pas de spriteSheet sur {asset.name}");
            return;
        }
        if (!tex.isReadable)
        {
            Debug.LogError($"[TMPSpriteRecenter] L'atlas {tex.name} n'est pas readable. " +
                           "Coche 'Read/Write' dans les Import Settings de la texture.");
            return;
        }

        int recentered = 0;
        int skipped = 0;

        // Construit un lookup glyphIndex → widthRatio (depuis GameIconsConfig, via tag).
        var ratioByGlyph = BuildWidthRatioLookup(asset);

        // Passe 1 : calculer le max content width/height pour un advance uniforme
        int maxContentW = 0;
        int maxContentH = 0;
        var bboxes = new System.Collections.Generic.Dictionary<uint, (int minX, int minY, int maxX, int maxY)>();

        foreach (var glyph in asset.spriteGlyphTable)
        {
            var rect = glyph.glyphRect;
            var bbox = ComputeAlphaBBox(tex, rect);
            if (bbox == null) { skipped++; continue; }
            bboxes[glyph.index] = bbox.Value;
            int w = bbox.Value.maxX - bbox.Value.minX + 1;
            int h = bbox.Value.maxY - bbox.Value.minY + 1;
            if (w > maxContentW) maxContentW = w;
            if (h > maxContentH) maxContentH = h;
        }

        if (maxContentW == 0)
        {
            Debug.LogError("[TMPSpriteRecenter] Aucun sprite non-transparent trouvé.");
            return;
        }

        // Passe 2 : appliquer le recentrage
        foreach (var glyph in asset.spriteGlyphTable)
        {
            if (!bboxes.TryGetValue(glyph.index, out var bbox)) continue;

            var rect = glyph.glyphRect;

            int contentW = bbox.maxX - bbox.minX + 1;
            int contentH = bbox.maxY - bbox.minY + 1;

            // Recrop le glyphRect sur le contenu réel
            glyph.glyphRect = new GlyphRect(
                (int)rect.x + bbox.minX,
                (int)rect.y + bbox.minY,
                contentW,
                contentH
            );

            // Ratio de largeur par icône (défaut 1, lu depuis GameIconsConfig).
            float widthRatio = ratioByGlyph.TryGetValue(glyph.index, out var r) ? r : 1f;
            float advance = maxContentW * widthRatio;

            // Métriques : advance uniforme × ratio, contenu centré dedans.
            var m = glyph.metrics;
            m.width = contentW;
            m.height = contentH;
            m.horizontalBearingX = (advance - contentW) / 2f;
            // + yOffsetPx remonte l'icône (bearing vers le haut), - la descend
            m.horizontalBearingY = contentH + (maxContentH - contentH) / 2f + yOffsetPx;
            m.horizontalAdvance = advance;
            glyph.metrics = m;

            recentered++;
        }

        EditorUtility.SetDirty(asset);
        AssetDatabase.SaveAssets();

        Debug.Log($"[TMPSpriteRecenter] {asset.name} : {recentered} sprites recentrés, " +
                  $"{skipped} vides ignorés. Advance uniforme = {maxContentW}px, " +
                  $"hauteur max = {maxContentH}px.");

        if (showDialog)
        {
            EditorUtility.DisplayDialog(
                "Recentrage terminé",
                $"{recentered} sprites recentrés dans {asset.name}.\n\n" +
                $"Advance uniforme : {maxContentW} px\n" +
                $"Hauteur max : {maxContentH} px\n\n" +
                (skipped > 0 ? $"{skipped} sprites vides ignorés.\n\n" : "") +
                "Vérifie le rendu en jeu. Si une icône déborde, règle Scale dans l'atlas.",
                "OK");
        }
    }

    /// <summary>
    /// Construit un lookup glyphIndex → widthRatio en croisant la character
    /// table du SpriteAsset (pour avoir le tag) et les entrées du
    /// GameIconsConfig (pour avoir le ratio configuré par l'utilisateur).
    /// Tags non présents dans la config gardent un ratio de 1.
    /// </summary>
    private static Dictionary<uint, float> BuildWidthRatioLookup(TMP_SpriteAsset asset)
    {
        var result = new Dictionary<uint, float>();

        // 1) tag → ratio depuis GameIconsConfig (unique dans le projet)
        var ratioByTag = new Dictionary<string, float>(System.StringComparer.OrdinalIgnoreCase);
        var guids = AssetDatabase.FindAssets("t:GameIconsConfig");
        if (guids.Length > 0)
        {
            var config = AssetDatabase.LoadAssetAtPath<GameIconsConfig>(AssetDatabase.GUIDToAssetPath(guids[0]));
            if (config != null && config.icons != null)
            {
                foreach (var entry in config.icons)
                {
                    if (entry == null || string.IsNullOrWhiteSpace(entry.tag)) continue;
                    float r = entry.widthRatio > 0f ? entry.widthRatio : 1f;
                    ratioByTag[entry.tag] = r;
                }
            }
        }

        // 2) glyphIndex → tag via character table, puis → ratio
        foreach (var character in asset.spriteCharacterTable)
        {
            if (character == null || string.IsNullOrEmpty(character.name)) continue;
            float ratio = 1f;
            if (ratioByTag.TryGetValue(character.name, out var r)) ratio = r;
            result[character.glyphIndex] = ratio;
        }
        return result;
    }

    /// <summary>
    /// Trouve le bounding box des pixels alpha > seuil dans la région de l'atlas.
    /// Coordonnées retournées : locales à la région (origin = bas-gauche de glyphRect).
    /// Retourne null si la région est entièrement transparente.
    /// </summary>
    private static (int minX, int minY, int maxX, int maxY)? ComputeAlphaBBox(Texture2D tex, GlyphRect rect)
    {
        int x0 = (int)rect.x;
        int y0 = (int)rect.y;
        int w = (int)rect.width;
        int h = (int)rect.height;

        var pixels = tex.GetPixels(x0, y0, w, h);

        int minX = int.MaxValue, minY = int.MaxValue, maxX = -1, maxY = -1;
        for (int y = 0; y < h; y++)
        {
            int row = y * w;
            for (int x = 0; x < w; x++)
            {
                if (pixels[row + x].a > AlphaThreshold)
                {
                    if (x < minX) minX = x;
                    if (y < minY) minY = y;
                    if (x > maxX) maxX = x;
                    if (y > maxY) maxY = y;
                }
            }
        }

        if (maxX < 0) return null;
        return (minX, minY, maxX, maxY);
    }
}
