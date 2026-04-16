using UnityEngine;
using UnityEditor;
using TMPro;
using System.Collections.Generic;
using System.IO;
using System.Reflection;

/// <summary>
/// Menu: Tools > Generer GameIcons SpriteAsset
///
/// Lit le GameIconsConfig (ScriptableObject), pack tous les sprites
/// assignes en une texture atlas, et cree/met a jour le TMP_SpriteAsset
/// "GameIcons" utilisable avec <sprite name="tag">.
///
/// Workflow :
/// 1. Assets > Create > Boss Rush > Game Icons Config
/// 2. Assigner un sprite par icone dans l'Inspector
/// 3. Tools > Generer GameIcons SpriteAsset
/// 4. Assigner GameIcons dans TMP Settings > Default Sprite Asset
///    (ou par component TextMeshPro > Sprite Asset)
/// </summary>
public static class GameIconsSpriteAssetCreator
{
    private const string AssetPath = "Assets/TextMesh Pro/Resources/Sprite Assets/GameIcons.asset";
    private const string AtlasPath = "Assets/Art/UI/GameIcons_Atlas.png";
    private const int SpriteSize = 128; // taille cible par icone dans l'atlas

    [MenuItem("Tools/Generer GameIcons SpriteAsset")]
    public static void CreateAsset()
    {
        // Find config
        var guids = AssetDatabase.FindAssets("t:GameIconsConfig");
        if (guids.Length == 0)
        {
            EditorUtility.DisplayDialog("Erreur",
                "Aucun GameIconsConfig trouve.\n\nCreez-en un via :\nAssets > Create > Boss Rush > Game Icons Config",
                "OK");
            return;
        }

        var config = AssetDatabase.LoadAssetAtPath<GameIconsConfig>(AssetDatabase.GUIDToAssetPath(guids[0]));
        if (config.icons == null || config.icons.Length == 0)
        {
            EditorUtility.DisplayDialog("Erreur", "La config ne contient aucune icone.", "OK");
            return;
        }

        // Count valid sprites
        var validIcons = new List<(string tag, Sprite sprite, float scale)>();
        foreach (var entry in config.icons)
        {
            if (entry.sprite != null)
                validIcons.Add((entry.tag, entry.sprite, entry.scale > 0 ? entry.scale : 1f));
        }

        if (validIcons.Count == 0)
        {
            EditorUtility.DisplayDialog("Erreur",
                "Aucun sprite assigne dans la config.\nAssignez au moins un sprite et relancez.", "OK");
            return;
        }

        // Determine atlas layout
        int cols = Mathf.CeilToInt(Mathf.Sqrt(validIcons.Count));
        int rows = Mathf.CeilToInt((float)validIcons.Count / cols);
        int atlasW = cols * SpriteSize;
        int atlasH = rows * SpriteSize;

        // Create atlas texture
        var atlas = new Texture2D(atlasW, atlasH, TextureFormat.RGBA32, false);
        var clear = new Color32[atlasW * atlasH];
        atlas.SetPixels32(clear);

        var spriteRects = new List<(string tag, Rect rect)>();

        var spriteInfos = new List<(string tag, Rect rect, float scale)>();

        for (int i = 0; i < validIcons.Count; i++)
        {
            var (tag, sprite, scale) = validIcons[i];
            int col = i % cols;
            int row = i / cols;

            // Read sprite pixels (need readable texture)
            var srcTex = MakeReadable(sprite.texture);
            var spriteRect = sprite.textureRect;

            // Get pixels from sprite rect
            var pixels = srcTex.GetPixels(
                (int)spriteRect.x, (int)spriteRect.y,
                (int)spriteRect.width, (int)spriteRect.height);

            // Scale to SpriteSize if needed
            Texture2D scaled;
            if ((int)spriteRect.width != SpriteSize || (int)spriteRect.height != SpriteSize)
            {
                var tmp = new Texture2D((int)spriteRect.width, (int)spriteRect.height, TextureFormat.RGBA32, false);
                tmp.SetPixels(pixels);
                tmp.Apply();
                scaled = ScaleTexture(tmp, SpriteSize, SpriteSize);
                Object.DestroyImmediate(tmp);
            }
            else
            {
                scaled = new Texture2D(SpriteSize, SpriteSize, TextureFormat.RGBA32, false);
                scaled.SetPixels(pixels);
                scaled.Apply();
            }

            // Atlas Y is bottom-up, row 0 = top visually = (rows-1-row) in pixel coords
            int destX = col * SpriteSize;
            int destY = (rows - 1 - row) * SpriteSize;
            atlas.SetPixels(destX, destY, SpriteSize, SpriteSize, scaled.GetPixels());
            Object.DestroyImmediate(scaled);

            spriteRects.Add((tag, new Rect(destX, destY, SpriteSize, SpriteSize)));
            spriteInfos.Add((tag, new Rect(destX, destY, SpriteSize, SpriteSize), scale));
        }

        atlas.Apply();

        // Save atlas PNG
        Directory.CreateDirectory(Path.GetDirectoryName(AtlasPath));
        File.WriteAllBytes(AtlasPath, atlas.EncodeToPNG());
        Object.DestroyImmediate(atlas);
        AssetDatabase.Refresh();

        // Configure atlas texture importer
        var atlasImporter = AssetImporter.GetAtPath(AtlasPath) as TextureImporter;
        if (atlasImporter != null)
        {
            atlasImporter.textureType = TextureImporterType.Sprite;
            atlasImporter.spriteImportMode = SpriteImportMode.Multiple;
            atlasImporter.isReadable = true;
            atlasImporter.filterMode = FilterMode.Bilinear;
            atlasImporter.textureCompression = TextureImporterCompression.Uncompressed;

            var metaList = new List<SpriteMetaData>();
            foreach (var (tag, rect) in spriteRects)
            {
                metaList.Add(new SpriteMetaData
                {
                    name = tag,
                    rect = rect,
                    alignment = (int)SpriteAlignment.Center,
                    pivot = new Vector2(0.5f, 0.5f)
                });
            }
            atlasImporter.spritesheet = metaList.ToArray();
            atlasImporter.SaveAndReimport();
        }

        var atlasTexture = AssetDatabase.LoadAssetAtPath<Texture2D>(AtlasPath);

        // Always delete old asset to avoid corrupted internal state
        if (AssetDatabase.LoadAssetAtPath<TMP_SpriteAsset>(AssetPath) != null)
        {
            AssetDatabase.DeleteAsset(AssetPath);
            AssetDatabase.Refresh();
        }

        // Create fresh TMP_SpriteAsset
        var asset = ScriptableObject.CreateInstance<TMP_SpriteAsset>();
        asset.spriteSheet = atlasTexture;

        // Create material (required for TMP to render sprites)
        var shader = Shader.Find("TextMeshPro/Sprite");
        if (shader == null)
        {
            Debug.LogError("Shader 'TextMeshPro/Sprite' introuvable. Verifiez que TMP est bien installe.");
            return;
        }
        var mat = new Material(shader);
        mat.name = "GameIcons Material";
        mat.mainTexture = atlasTexture;
        asset.material = mat;

        // Build glyph + character tables
        var glyphs = new List<TMP_SpriteGlyph>();
        var characters = new List<TMP_SpriteCharacter>();

        for (int i = 0; i < spriteInfos.Count; i++)
        {
            var (tag, rect, scale) = spriteInfos[i];

            var glyph = new TMP_SpriteGlyph
            {
                index = (uint)i,
                metrics = new UnityEngine.TextCore.GlyphMetrics(
                    SpriteSize, SpriteSize, 0, SpriteSize * 0.8f, SpriteSize),
                glyphRect = new UnityEngine.TextCore.GlyphRect(
                    (int)rect.x, (int)rect.y, SpriteSize, SpriteSize),
                scale = scale
            };
            glyphs.Add(glyph);

            var character = new TMP_SpriteCharacter
            {
                name = tag,
                glyphIndex = (uint)i,
                glyph = glyph,
                scale = scale
            };
            characters.Add(character);
        }

        // Populate private fields via reflection — accessing the public property getter
        // triggers UpgradeSpriteAsset() which crashes on fresh assets (legacy spriteInfoList is null).
        // Field names vary by TMP version: try both conventions.
        var type = typeof(TMP_SpriteAsset);
        var glyphField = type.GetField("m_GlyphTable", BindingFlags.Instance | BindingFlags.NonPublic)
                      ?? type.GetField("m_SpriteGlyphTable", BindingFlags.Instance | BindingFlags.NonPublic);
        var charField  = type.GetField("m_SpriteCharacterTable", BindingFlags.Instance | BindingFlags.NonPublic);

        if (glyphField == null)
            Debug.LogError("Champ glyph table introuvable dans TMP_SpriteAsset");
        else
            glyphField.SetValue(asset, glyphs);

        if (charField == null)
            Debug.LogError("Champ character table introuvable dans TMP_SpriteAsset");
        else
            charField.SetValue(asset, characters);

        // Init legacy spriteInfoList to empty so UpgradeSpriteAsset() doesn't NPE later.
        var legacyField = type.GetField("spriteInfoList", BindingFlags.Instance | BindingFlags.Public);
        if (legacyField != null) legacyField.SetValue(asset, new List<TMP_Sprite>());

        // Mark as version 1.1.0 so TMP does NOT trigger UpgradeSpriteAsset on Awake.
        var versionField = type.GetField("m_Version", BindingFlags.Instance | BindingFlags.NonPublic);
        if (versionField != null) versionField.SetValue(asset, "1.1.0");

        // Save main asset + material as sub-asset
        Directory.CreateDirectory(Path.GetDirectoryName(AssetPath));
        AssetDatabase.CreateAsset(asset, AssetPath);
        AssetDatabase.AddObjectToAsset(mat, AssetPath);

        // Force TMP to rebuild its internal name/unicode lookup dictionaries.
        // Calling UpdateLookupTables() via reflection avoids the buggy getter path.
        var updateMethod = type.GetMethod("UpdateLookupTables",
            BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);
        if (updateMethod != null)
        {
            try { updateMethod.Invoke(asset, null); }
            catch (System.Exception ex) { Debug.LogWarning($"UpdateLookupTables: {ex.Message}"); }
        }

        EditorUtility.SetDirty(asset);

        AssetDatabase.SaveAssets();
        AssetDatabase.Refresh();

        Debug.Log($"GameIcons SpriteAsset OK : {spriteRects.Count} icones → {AssetPath}");
        EditorUtility.DisplayDialog("Succes",
            $"{spriteRects.Count} icones packees dans GameIcons SpriteAsset.\n\n" +
            "N'oubliez pas d'assigner GameIcons dans :\n" +
            "TMP Settings > Default Sprite Asset\n" +
            "ou sur chaque TextMeshPro > Sprite Asset",
            "OK");
        Selection.activeObject = asset;
    }

    // ── Helpers ──────────────────────────────────────────
    private static Texture2D MakeReadable(Texture2D source)
    {
        if (source.isReadable) return source;

        var rt = RenderTexture.GetTemporary(source.width, source.height, 0, RenderTextureFormat.ARGB32);
        Graphics.Blit(source, rt);
        var prev = RenderTexture.active;
        RenderTexture.active = rt;
        var readable = new Texture2D(source.width, source.height, TextureFormat.RGBA32, false);
        readable.ReadPixels(new Rect(0, 0, source.width, source.height), 0, 0);
        readable.Apply();
        RenderTexture.active = prev;
        RenderTexture.ReleaseTemporary(rt);
        return readable;
    }

    private static Texture2D ScaleTexture(Texture2D source, int targetW, int targetH)
    {
        var rt = RenderTexture.GetTemporary(targetW, targetH, 0, RenderTextureFormat.ARGB32);
        rt.filterMode = FilterMode.Bilinear;
        Graphics.Blit(source, rt);
        var prev = RenderTexture.active;
        RenderTexture.active = rt;
        var result = new Texture2D(targetW, targetH, TextureFormat.RGBA32, false);
        result.ReadPixels(new Rect(0, 0, targetW, targetH), 0, 0);
        result.Apply();
        RenderTexture.active = prev;
        RenderTexture.ReleaseTemporary(rt);
        return result;
    }
}
