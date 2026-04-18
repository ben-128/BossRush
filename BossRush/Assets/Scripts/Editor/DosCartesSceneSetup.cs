using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

/// <summary>
/// Prépare la scène existante DosCartes pour tester le rendu peinture des icônes.
///   - génère (si absent) une texture de noise procédurale (EdgeNoise_128.png)
///   - génère (si absent) un sprite icône placeholder (IconPlaceholder_Circle.png)
///   - crée/met à jour le matériau M_PaintedIconOnCanvas
///   - ouvre la scène existante Assets/Scenes/DosCartes.unity
///   - trouve le GameObject 'Icon' et lui assigne le matériau + SpriteDropShadow
///
/// Le changement de fond est géré par le composant CardBackGenerator
/// (champs backgroundRenderer + backgrounds[]) via l'inspecteur ou l'UI
/// de génération de cartes.
///
/// Idempotent : re-exécutable sans effet de bord.
/// Menu : Tools > Raid Party > Préparer scène DosCartes (test icônes)
/// </summary>
public static class DosCartesSceneSetup
{
    private const string ScenePath        = "Assets/Scenes/DosCartes.unity";
    private const string NoiseTexPath     = "Assets/Art/Textures/EdgeNoise_128.png";
    private const string IconPlaceholder  = "Assets/Art/Textures/IconPlaceholder_Circle.png";
    private const string MaterialPath     = "Assets/Art/Materials/M_PaintedIconOnCanvas.mat";
    private const string ShaderName       = "Sprites/PaintedIconOnCanvas";

    [MenuItem("Tools/Raid Party/Préparer scène DosCartes (test icônes)")]
    public static void Prepare()
    {
        EnsureDirectories();

        var noiseTex = EnsureNoiseTexture();
        var iconSprite = EnsurePlaceholderIcon();
        var mat = EnsureMaterial(noiseTex);

        if (mat == null) return;

        ApplyToExistingScene(mat, iconSprite);
    }

    // ──────────────────────────────────────────────────────────────────────
    // Assets
    // ──────────────────────────────────────────────────────────────────────

    private static void EnsureDirectories()
    {
        foreach (var dir in new[] {
            "Assets/Art/Textures",
            "Assets/Art/Materials",
            "Assets/Scenes"
        })
        {
            if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
        }
    }

    /// <summary>
    /// Génère un noise 128x128 en PNG (Perlin + fractal) pour l'edge noise du shader.
    /// </summary>
    private static Texture2D EnsureNoiseTexture()
    {
        if (File.Exists(NoiseTexPath))
        {
            AssetDatabase.ImportAsset(NoiseTexPath);
            return AssetDatabase.LoadAssetAtPath<Texture2D>(NoiseTexPath);
        }

        const int size = 128;
        var tex = new Texture2D(size, size, TextureFormat.R8, false);
        var seedOffset = new Vector2(Random.Range(0f, 1000f), Random.Range(0f, 1000f));

        for (int y = 0; y < size; y++)
        {
            for (int x = 0; x < size; x++)
            {
                // Fractal perlin : 3 octaves
                float nx = (float)x / size, ny = (float)y / size;
                float n = 0f, amp = 1f, freq = 4f, ampSum = 0f;
                for (int o = 0; o < 3; o++)
                {
                    n += Mathf.PerlinNoise(seedOffset.x + nx * freq, seedOffset.y + ny * freq) * amp;
                    ampSum += amp;
                    amp *= 0.5f;
                    freq *= 2f;
                }
                n /= ampSum;
                // Normalise un peu et centre autour de 0.5
                n = Mathf.Clamp01(n * 1.1f - 0.05f);
                tex.SetPixel(x, y, new Color(n, n, n, 1f));
            }
        }
        tex.Apply();

        File.WriteAllBytes(NoiseTexPath, tex.EncodeToPNG());
        Object.DestroyImmediate(tex);

        AssetDatabase.Refresh();

        // Régler l'importer pour que la texture soit répétable et samplable
        var importer = (TextureImporter)AssetImporter.GetAtPath(NoiseTexPath);
        importer.textureType = TextureImporterType.Default;
        importer.wrapMode = TextureWrapMode.Repeat;
        importer.filterMode = FilterMode.Bilinear;
        importer.sRGBTexture = false; // on l'utilise comme data, pas comme couleur
        importer.alphaSource = TextureImporterAlphaSource.None;
        importer.mipmapEnabled = false;
        importer.isReadable = false;
        importer.SaveAndReimport();

        return AssetDatabase.LoadAssetAtPath<Texture2D>(NoiseTexPath);
    }

    /// <summary>
    /// Génère un sprite rond blanc 256x256 avec bord doux, à remplacer par
    /// la vraie icône blanche plus tard.
    /// </summary>
    private static Sprite EnsurePlaceholderIcon()
    {
        if (!File.Exists(IconPlaceholder))
        {
            const int size = 256;
            var tex = new Texture2D(size, size, TextureFormat.RGBA32, false);
            var center = new Vector2(size * 0.5f, size * 0.5f);
            float rOuter = size * 0.40f;
            float rInner = size * 0.36f;

            for (int y = 0; y < size; y++)
            {
                for (int x = 0; x < size; x++)
                {
                    float d = Vector2.Distance(new Vector2(x, y), center);
                    float a = Mathf.Clamp01(Mathf.InverseLerp(rOuter, rInner, d));
                    tex.SetPixel(x, y, new Color(1f, 1f, 1f, a));
                }
            }
            tex.Apply();
            File.WriteAllBytes(IconPlaceholder, tex.EncodeToPNG());
            Object.DestroyImmediate(tex);

            AssetDatabase.Refresh();
        }

        // Importer en Sprite
        var importer = (TextureImporter)AssetImporter.GetAtPath(IconPlaceholder);
        if (importer.textureType != TextureImporterType.Sprite)
        {
            importer.textureType = TextureImporterType.Sprite;
            importer.spriteImportMode = SpriteImportMode.Single;
            importer.alphaIsTransparency = true;
            importer.mipmapEnabled = false;
            importer.filterMode = FilterMode.Bilinear;
            importer.SaveAndReimport();
        }

        return AssetDatabase.LoadAssetAtPath<Sprite>(IconPlaceholder);
    }

    private static Material EnsureMaterial(Texture2D noiseTex)
    {
        var shader = Shader.Find(ShaderName);
        if (shader == null)
        {
            Debug.LogError("Shader introuvable : " + ShaderName + ". Vérifie que PaintedIconOnCanvas.shader est dans le projet.");
            return null;
        }

        var mat = AssetDatabase.LoadAssetAtPath<Material>(MaterialPath);
        if (mat == null)
        {
            mat = new Material(shader);
            AssetDatabase.CreateAsset(mat, MaterialPath);
        }
        else
        {
            mat.shader = shader;
        }

        // Valeurs par défaut
        mat.SetColor("_PaintTint", new Color(0.949f, 0.918f, 0.875f, 1f)); // ivoire #F2EADF
        mat.SetFloat("_BgBlend", 0.18f);
        mat.SetFloat("_EdgeNoiseStrength", 0.15f);  // UV jitter : 0.1-0.3 visible
        mat.SetFloat("_EdgeNoiseScale", 60f);
        if (noiseTex != null) mat.SetTexture("_EdgeNoiseTex", noiseTex);

        EditorUtility.SetDirty(mat);
        AssetDatabase.SaveAssets();
        return mat;
    }

    // ──────────────────────────────────────────────────────────────────────
    // Scene existante
    // ──────────────────────────────────────────────────────────────────────

    private static void ApplyToExistingScene(Material iconMat, Sprite fallbackSprite)
    {
        if (!File.Exists(ScenePath))
        {
            EditorUtility.DisplayDialog("DosCartes", "Scène introuvable : " + ScenePath, "OK");
            return;
        }

        if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo())
            return;

        var scene = EditorSceneManager.OpenScene(ScenePath, OpenSceneMode.Single);

        // Trouver le GameObject 'Icon' en parcourant toute la hiérarchie
        GameObject iconGO = null;
        foreach (var root in scene.GetRootGameObjects())
        {
            iconGO = FindInHierarchy(root.transform, "Icon");
            if (iconGO != null) break;
        }

        if (iconGO == null)
        {
            EditorUtility.DisplayDialog(
                "DosCartes",
                "Aucun GameObject nommé 'Icon' trouvé dans la scène.\n" +
                "Crée-en un (avec un SpriteRenderer) et relance la commande.",
                "OK");
            return;
        }

        var sr = iconGO.GetComponent<SpriteRenderer>() ?? iconGO.AddComponent<SpriteRenderer>();

        if (sr.sprite == null && fallbackSprite != null)
            sr.sprite = fallbackSprite;

        sr.sharedMaterial = iconMat;

        if (iconGO.GetComponent<SpriteDropShadow>() == null)
        {
            var shadow = iconGO.AddComponent<SpriteDropShadow>();
            shadow.shadowColor = new Color(0.10f, 0.06f, 0.03f, 0.35f); // noir chaud
            shadow.offsetX = 0.015f;
            shadow.offsetY = -0.015f;
            shadow.shadowScale = 1.02f;
            shadow.sortingOrderOffset = -1;
        }

        EditorUtility.SetDirty(iconGO);
        EditorSceneManager.MarkSceneDirty(scene);
        EditorSceneManager.SaveScene(scene);

        Selection.activeGameObject = iconGO;
        EditorGUIUtility.PingObject(iconGO);

        Debug.Log("[DosCartes] Icon configuré — Material : " + MaterialPath +
                  ". Le fond est piloté par le composant CardBackGenerator.");
    }

    private static GameObject FindInHierarchy(Transform root, string name)
    {
        if (root.name == name) return root.gameObject;
        for (int i = 0; i < root.childCount; i++)
        {
            var found = FindInHierarchy(root.GetChild(i), name);
            if (found != null) return found;
        }
        return null;
    }
}
