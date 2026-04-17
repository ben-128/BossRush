using System.IO;
using UnityEditor;
using UnityEngine;

/// <summary>
/// Menu: Tools > Composer Icones Inline
///
/// Lit un IconCompositionConfig (ScriptableObject) et genere pour chaque
/// entree un PNG composite (cadre + symbole + teinte).
///
/// Modes :
///   Cutout     : le symbole devient un trou dans le cadre (utile pour
///                les icones type-de-carte : cadre plein + silhouette cut-out)
///   Overlay    : le symbole est peint par-dessus le cadre
///   SymbolOnly : pas de cadre, juste le symbole tinte
///
/// Workflow :
///   1. Assets > Create > Boss Rush > Icon Composition Config
///   2. Remplir les entrees (outputName, frame, symbol, couleurs, scale)
///   3. Tools > Composer Icones Inline
///   4. Les PNG apparaissent dans outputFolder (ex: Assets/Art/Icons/Inline)
///   5. Assigner dans GameIconsConfig, puis Tools > Generer GameIcons SpriteAsset
/// </summary>
public static class IconCompositor
{
    [MenuItem("Tools/Composer Icones Inline")]
    public static void Compose()
    {
        var guids = AssetDatabase.FindAssets("t:IconCompositionConfig");
        if (guids.Length == 0)
        {
            EditorUtility.DisplayDialog("Erreur",
                "Aucun IconCompositionConfig trouve.\n\nCreez-en un via :\nAssets > Create > Boss Rush > Icon Composition Config",
                "OK");
            return;
        }

        var config = AssetDatabase.LoadAssetAtPath<IconCompositionConfig>(
            AssetDatabase.GUIDToAssetPath(guids[0]));

        if (config.entries == null || config.entries.Length == 0)
        {
            EditorUtility.DisplayDialog("Erreur", "La config ne contient aucune entree.", "OK");
            return;
        }

        Directory.CreateDirectory(config.outputFolder);

        int generated = 0;
        foreach (var entry in config.entries)
        {
            if (string.IsNullOrWhiteSpace(entry.outputName))
            {
                Debug.LogWarning("[IconCompositor] Entree sans outputName, ignoree.");
                continue;
            }
            if (entry.symbol == null)
            {
                Debug.LogWarning($"[IconCompositor] {entry.outputName} : symbole manquant, ignore.");
                continue;
            }
            if (entry.mode != IconCompositionConfig.CompositeMode.SymbolOnly && entry.frame == null)
            {
                Debug.LogWarning($"[IconCompositor] {entry.outputName} : cadre requis pour le mode {entry.mode}, ignore.");
                continue;
            }

            EnsureReadable(entry.symbol);
            if (entry.frame != null) EnsureReadable(entry.frame);

            Texture2D result = Compose(entry, config.outputSize);

            var outputPath = Path.Combine(config.outputFolder, entry.outputName + ".png");
            File.WriteAllBytes(outputPath, result.EncodeToPNG());
            Object.DestroyImmediate(result);
            generated++;

            Debug.Log($"[IconCompositor] {outputPath} genere.");
        }

        AssetDatabase.Refresh();
        EditorUtility.DisplayDialog("Composition terminee",
            $"{generated} icone(s) generee(s) dans :\n{config.outputFolder}", "OK");
    }

    private static Texture2D Compose(IconCompositionConfig.Entry entry, int size)
    {
        var result = new Texture2D(size, size, TextureFormat.RGBA32, false);

        // Fond transparent
        var clear = new Color[size * size];
        for (int i = 0; i < clear.Length; i++) clear[i] = new Color(0, 0, 0, 0);
        result.SetPixels(clear);

        if (entry.mode == IconCompositionConfig.CompositeMode.SymbolOnly)
        {
            // Juste tinter le symbole a la taille de sortie
            StampSymbol(result, entry.symbol, entry.symbolColor, 1f, entry.alphaThreshold, additive: true);
            result.Apply();
            return result;
        }

        // Etape 1 : poser le cadre tinte
        StampFrame(result, entry.frame, entry.frameColor);

        // Etape 2 : appliquer le symbole selon le mode
        if (entry.mode == IconCompositionConfig.CompositeMode.Cutout)
        {
            StampSymbol(result, entry.symbol, Color.white, entry.symbolScale, entry.alphaThreshold, additive: false);
        }
        else // Overlay
        {
            StampSymbol(result, entry.symbol, entry.symbolColor, entry.symbolScale, entry.alphaThreshold, additive: true);
        }

        result.Apply();
        return result;
    }

    private static void StampFrame(Texture2D dst, Texture2D frame, Color tint)
    {
        int w = dst.width;
        int h = dst.height;
        for (int y = 0; y < h; y++)
        {
            for (int x = 0; x < w; x++)
            {
                float u = (float)x / (w - 1);
                float v = (float)y / (h - 1);
                var src = frame.GetPixelBilinear(u, v);
                if (src.a <= 0f) continue;
                dst.SetPixel(x, y, new Color(
                    src.r * tint.r,
                    src.g * tint.g,
                    src.b * tint.b,
                    src.a));
            }
        }
    }

    /// <summary>
    /// Pose le symbole centre sur dst a une echelle donnee.
    /// additive=true : dessine par-dessus avec symbolColor (mode Overlay / SymbolOnly).
    /// additive=false : soustrait l'alpha du symbole de dst (mode Cutout).
    /// </summary>
    private static void StampSymbol(Texture2D dst, Texture2D symbol, Color symColor,
                                    float scale, float alphaThreshold, bool additive)
    {
        int w = dst.width;
        int h = dst.height;
        int symW = Mathf.RoundToInt(w * scale);
        int symH = Mathf.RoundToInt(h * scale);
        int offX = (w - symW) / 2;
        int offY = (h - symH) / 2;

        for (int y = 0; y < symH; y++)
        {
            for (int x = 0; x < symW; x++)
            {
                float u = (float)x / Mathf.Max(1, symW - 1);
                float v = (float)y / Mathf.Max(1, symH - 1);
                var symPx = symbol.GetPixelBilinear(u, v);

                // Binarisation pour eviter les halos
                float symAlpha = symPx.a >= alphaThreshold ? 1f : 0f;
                if (symAlpha <= 0f) continue;

                int dstX = offX + x;
                int dstY = offY + y;
                if (dstX < 0 || dstX >= w || dstY < 0 || dstY >= h) continue;

                var cur = dst.GetPixel(dstX, dstY);

                if (additive)
                {
                    // Overlay : blend le symbole colore par-dessus (alpha du symbole)
                    var layer = new Color(
                        symColor.r * symPx.r,
                        symColor.g * symPx.g,
                        symColor.b * symPx.b,
                        symAlpha * symColor.a);
                    // Over-blend simple
                    float outA = layer.a + cur.a * (1f - layer.a);
                    var outRGB = outA > 0f
                        ? (layer * layer.a + cur * cur.a * (1f - layer.a)) / outA
                        : Color.clear;
                    dst.SetPixel(dstX, dstY, new Color(outRGB.r, outRGB.g, outRGB.b, outA));
                }
                else
                {
                    // Cutout : destination-out, reduit l'alpha du cadre
                    cur.a = cur.a * (1f - symAlpha);
                    dst.SetPixel(dstX, dstY, cur);
                }
            }
        }
    }

    private static void EnsureReadable(Texture2D tex)
    {
        var path = AssetDatabase.GetAssetPath(tex);
        if (string.IsNullOrEmpty(path)) return;
        var importer = AssetImporter.GetAtPath(path) as TextureImporter;
        if (importer != null && !importer.isReadable)
        {
            importer.isReadable = true;
            importer.SaveAndReimport();
        }
    }
}
