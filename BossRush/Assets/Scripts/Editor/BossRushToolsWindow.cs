using System.IO;
using UnityEditor;
using UnityEngine;

/// <summary>
/// Menu: Tools > Raid Party > Fenetre Outils
///
/// Fenetre centrale regroupant tous les outils specifiques au projet.
/// Un seul bouton "TOUT FAIRE" enchaine : compose les icones depuis
/// IconCompositionConfig, les auto-assigne au GameIconsConfig par nom,
/// puis regenere le TMP_SpriteAsset. Fin du relink manuel dans TMP.
/// </summary>
public class BossRushToolsWindow : EditorWindow
{
    [MenuItem("Tools/Raid Party/Fenetre Outils")]
    public static void Open()
    {
        var win = GetWindow<BossRushToolsWindow>("Raid Party");
        win.minSize = new Vector2(360, 360);
        win.Show();
    }

    private Vector2 scroll;

    private void OnGUI()
    {
        using (var scope = new EditorGUILayout.ScrollViewScope(scroll))
        {
            scroll = scope.scrollPosition;

            EditorGUILayout.Space(6);
            EditorGUILayout.LabelField("Raid Party — Outils projet", EditorStyles.boldLabel);
            EditorGUILayout.Space(6);

            DrawInlineIconsSection();
            EditorGUILayout.Space(10);
            DrawConfigShortcuts();
        }
    }

    // ─── Section icones inline ────────────────────────────────────────────
    private void DrawInlineIconsSection()
    {
        using (new EditorGUILayout.VerticalScope(EditorStyles.helpBox))
        {
            EditorGUILayout.LabelField("Icones inline (<ico:tag> dans le texte)", EditorStyles.boldLabel);
            EditorGUILayout.HelpBox(
                "Pipeline :\n" +
                "1) IconCompositor compose les PNG depuis IconCompositionConfig\n" +
                "   (cadre blanc + symbole blanc + teintes  →  Assets/Art/Icons/Inline/)\n" +
                "2) Auto-assignation : chaque PNG est assigne au GameIconsConfig\n" +
                "   via correspondance nom-de-fichier = tag (case-insensitive)\n" +
                "3) Regenere le TMP_SpriteAsset pour que <ico:tag> marche dans les textes.",
                MessageType.None);

            EditorGUILayout.Space(4);

            if (GUILayout.Button("0. Creer/completer config icones par defaut"))
                DefaultIconConfigCreator.CreateOrUpdate();

            if (GUILayout.Button("1. Composer les icones (merge cadre + symbole)"))
                IconCompositor.Compose();

            if (GUILayout.Button("2. Auto-assigner les PNG au GameIconsConfig"))
                AutoAssignIcons(verbose: true);

            if (GUILayout.Button("3. Regenerer le TMP_SpriteAsset"))
                GameIconsSpriteAssetCreator.CreateAsset();

            EditorGUILayout.Space(8);

            var bg = GUI.backgroundColor;
            GUI.backgroundColor = new Color(0.55f, 0.95f, 0.55f);
            if (GUILayout.Button("⚡ TOUT FAIRE (1 + 2 + 3)", GUILayout.Height(36)))
            {
                IconCompositor.Compose();
                AutoAssignIcons(verbose: false);
                GameIconsSpriteAssetCreator.CreateAsset();
            }
            GUI.backgroundColor = bg;
        }
    }

    // ─── Raccourcis vers les ScriptableObject de config ───────────────────
    private void DrawConfigShortcuts()
    {
        using (new EditorGUILayout.VerticalScope(EditorStyles.helpBox))
        {
            EditorGUILayout.LabelField("Configs", EditorStyles.boldLabel);

            if (GUILayout.Button("Ouvrir IconCompositionConfig"))
                PingAsset<IconCompositionConfig>();

            if (GUILayout.Button("Ouvrir GameIconsConfig"))
                PingAsset<GameIconsConfig>();
        }
    }

    private static void PingAsset<T>() where T : ScriptableObject
    {
        var asset = FindAsset<T>();
        if (asset == null)
        {
            EditorUtility.DisplayDialog("Introuvable",
                $"Aucun {typeof(T).Name} dans le projet.\nAssets > Create > Boss Rush > ...",
                "OK");
            return;
        }
        Selection.activeObject = asset;
        EditorGUIUtility.PingObject(asset);
    }

    // ─── Auto-assignation par nom de fichier ──────────────────────────────
    /// <summary>
    /// Parcourt le dossier outputFolder du IconCompositionConfig, trouve
    /// chaque PNG, convertit son importer en Sprite (si necessaire), puis
    /// assigne le sprite au champ correspondant dans GameIconsConfig en
    /// matchant le nom de fichier au tag (case-insensitive).
    /// </summary>
    public static int AutoAssignIcons(bool verbose)
    {
        var comp = FindAsset<IconCompositionConfig>();
        var icons = FindAsset<GameIconsConfig>();

        if (comp == null)
        {
            if (verbose) EditorUtility.DisplayDialog("Erreur",
                "Aucun IconCompositionConfig trouve.", "OK");
            return 0;
        }
        if (icons == null)
        {
            if (verbose) EditorUtility.DisplayDialog("Erreur",
                "Aucun GameIconsConfig trouve.", "OK");
            return 0;
        }

        var folder = comp.outputFolder;
        if (!Directory.Exists(folder))
        {
            if (verbose) EditorUtility.DisplayDialog("Erreur",
                $"Dossier de sortie introuvable :\n{folder}", "OK");
            return 0;
        }

        // Index des PNG du dossier par nom (lowercase, sans extension)
        var pngs = new System.Collections.Generic.Dictionary<string, string>();
        foreach (var path in Directory.GetFiles(folder, "*.png", SearchOption.TopDirectoryOnly))
        {
            var name = Path.GetFileNameWithoutExtension(path).ToLowerInvariant();
            pngs[name] = path.Replace('\\', '/');
        }

        int assigned = 0, missing = 0;
        foreach (var entry in icons.icons)
        {
            if (entry == null || string.IsNullOrWhiteSpace(entry.tag)) continue;
            var key = entry.tag.ToLowerInvariant();
            if (!pngs.TryGetValue(key, out var pngPath))
            {
                missing++;
                continue;
            }

            // Assurer que le PNG est importe comme Sprite
            var importer = AssetImporter.GetAtPath(pngPath) as TextureImporter;
            if (importer != null)
            {
                bool dirty = false;
                if (importer.textureType != TextureImporterType.Sprite) { importer.textureType = TextureImporterType.Sprite; dirty = true; }
                if (!importer.alphaIsTransparency) { importer.alphaIsTransparency = true; dirty = true; }
                if (dirty) importer.SaveAndReimport();
            }

            var sprite = AssetDatabase.LoadAssetAtPath<Sprite>(pngPath);
            if (sprite != null)
            {
                entry.sprite = sprite;
                assigned++;
            }
        }

        EditorUtility.SetDirty(icons);
        AssetDatabase.SaveAssets();

        if (verbose)
        {
            EditorUtility.DisplayDialog("Auto-assignation",
                $"Assignees : {assigned}\nManquantes : {missing}\n\nDossier source :\n{folder}",
                "OK");
        }
        else
        {
            Debug.Log($"[BossRushTools] Auto-assigne {assigned} icone(s) ({missing} tag(s) sans PNG correspondant).");
        }
        return assigned;
    }

    private static T FindAsset<T>() where T : ScriptableObject
    {
        var guids = AssetDatabase.FindAssets("t:" + typeof(T).Name);
        if (guids.Length == 0) return null;
        return AssetDatabase.LoadAssetAtPath<T>(AssetDatabase.GUIDToAssetPath(guids[0]));
    }
}
