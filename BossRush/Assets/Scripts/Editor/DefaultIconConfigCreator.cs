using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEngine;

/// <summary>
/// Cree (ou complete) un IconCompositionConfig peuple d'une entree par
/// balise <ico:tag> utilisee dans les JSON de cartes.
///
/// Menu : Tools > Raid Party > Creer/Completer config icones par defaut
///
/// Regles :
/// - outputName = tag avec premiere lettre en majuscule (ex: "menace" -> "Menace")
/// - Cutout (cadre + symbole creuse) pour les types-de-carte : menace,
///   invocation, action, destin, chasse
/// - SymbolOnly (symbole seul tinte) pour les actions pures : attaque,
///   actif_boss, capacite, degat
/// - Cadre auto-link : Sources/CadreCarte.png (pour les Cutout)
/// - Symbole auto-link : Sources/{TagCapitalise}.png si trouve, sinon null
/// - Couleurs par famille : rouge sombre (boss), brun (gameplay),
///   or (heros), cramoisi (degat)
///
/// Re-executable : ajoute uniquement les entrees manquantes, preserve
/// les entrees deja configurees.
/// </summary>
public static class DefaultIconConfigCreator
{
    private const string ConfigAssetPath = "Assets/Data/IconCompositionConfig.asset";
    private const string FramePath = "Assets/Art/Icons/Inline/Sources/CadreCarte.png";
    private const string SymbolsFolder = "Assets/Art/Icons/Inline/Sources";

    // Couleurs par famille
    private static readonly Color ColorBoss   = new Color(0x6B/255f, 0x15/255f, 0x15/255f); // #6B1515
    private static readonly Color ColorBrun   = new Color(0x3A/255f, 0x2E/255f, 0x22/255f); // #3A2E22
    private static readonly Color ColorHeros  = new Color(0xD4/255f, 0xA8/255f, 0x30/255f); // #D4A830
    private static readonly Color ColorDegat  = new Color(0x8B/255f, 0x20/255f, 0x20/255f); // #8B2020

    // Definition des 9 entrees
    private struct Preset
    {
        public string tag;
        public IconCompositionConfig.CompositeMode mode;
        public Color frameColor;
        public Color symbolColor;
        public float scale;
    }

    private static readonly Preset[] Presets = new[]
    {
        // Types de carte (Cutout)
        new Preset { tag = "menace",     mode = IconCompositionConfig.CompositeMode.Cutout,     frameColor = ColorBoss,  symbolColor = Color.white, scale = 0.6f },
        new Preset { tag = "invocation", mode = IconCompositionConfig.CompositeMode.Cutout,     frameColor = ColorBoss,  symbolColor = Color.white, scale = 0.6f },
        new Preset { tag = "action",     mode = IconCompositionConfig.CompositeMode.Cutout,     frameColor = ColorBrun,  symbolColor = Color.white, scale = 0.6f },
        new Preset { tag = "destin",     mode = IconCompositionConfig.CompositeMode.Cutout,     frameColor = ColorBrun,  symbolColor = Color.white, scale = 0.6f },
        new Preset { tag = "chasse",     mode = IconCompositionConfig.CompositeMode.Cutout,     frameColor = ColorBrun,  symbolColor = Color.white, scale = 0.6f },

        // Actions pures (SymbolOnly)
        new Preset { tag = "attaque",    mode = IconCompositionConfig.CompositeMode.SymbolOnly, frameColor = Color.white, symbolColor = ColorBoss,   scale = 1f   },
        new Preset { tag = "actif_boss", mode = IconCompositionConfig.CompositeMode.SymbolOnly, frameColor = Color.white, symbolColor = ColorBoss,   scale = 1f   },
        new Preset { tag = "capacite",   mode = IconCompositionConfig.CompositeMode.SymbolOnly, frameColor = Color.white, symbolColor = ColorHeros,  scale = 1f   },
        new Preset { tag = "degat",      mode = IconCompositionConfig.CompositeMode.SymbolOnly, frameColor = Color.white, symbolColor = ColorDegat,  scale = 1f   },
    };

    [MenuItem("Tools/Raid Party/Creer ou completer config icones par defaut")]
    public static void CreateOrUpdate()
    {
        // Localise ou cree le config
        var config = AssetDatabase.LoadAssetAtPath<IconCompositionConfig>(ConfigAssetPath);
        bool created = false;
        if (config == null)
        {
            Directory.CreateDirectory(Path.GetDirectoryName(ConfigAssetPath));
            config = ScriptableObject.CreateInstance<IconCompositionConfig>();
            config.outputFolder = "Assets/Art/Icons/Inline";
            config.outputSize = 512;
            config.entries = new IconCompositionConfig.Entry[0];
            AssetDatabase.CreateAsset(config, ConfigAssetPath);
            created = true;
        }

        // Charge le cadre (peut etre null si Sources/CadreCarte.png n'existe pas encore)
        var frame = AssetDatabase.LoadAssetAtPath<Texture2D>(FramePath);

        // Map tag -> entree existante (pour ne pas ecraser les reglages deja faits)
        var existingByTag = new Dictionary<string, IconCompositionConfig.Entry>();
        foreach (var e in config.entries ?? new IconCompositionConfig.Entry[0])
        {
            if (e != null && !string.IsNullOrWhiteSpace(e.outputName))
                existingByTag[e.outputName.ToLowerInvariant()] = e;
        }

        var result = new List<IconCompositionConfig.Entry>();
        int added = 0, kept = 0;

        foreach (var preset in Presets)
        {
            var capitalized = Capitalize(preset.tag);
            var key = capitalized.ToLowerInvariant();

            if (existingByTag.TryGetValue(key, out var existing))
            {
                result.Add(existing);
                kept++;
                continue;
            }

            var entry = new IconCompositionConfig.Entry
            {
                outputName = capitalized,
                mode = preset.mode,
                frame = preset.mode == IconCompositionConfig.CompositeMode.SymbolOnly ? null : frame,
                symbol = AssetDatabase.LoadAssetAtPath<Texture2D>(
                    Path.Combine(SymbolsFolder, capitalized + ".png").Replace('\\', '/')),
                frameColor = preset.frameColor,
                symbolColor = preset.symbolColor,
                symbolScale = preset.scale,
                alphaThreshold = 0.5f,
            };
            result.Add(entry);
            added++;
        }

        config.entries = result.ToArray();
        EditorUtility.SetDirty(config);
        AssetDatabase.SaveAssets();
        AssetDatabase.Refresh();

        Selection.activeObject = config;
        EditorGUIUtility.PingObject(config);

        var msg = $"{(created ? "Cree" : "Mis a jour")} : {ConfigAssetPath}\n\n" +
                  $"Entrees ajoutees : {added}\n" +
                  $"Entrees conservees : {kept}\n\n" +
                  $"Symboles manquants (a fournir dans {SymbolsFolder}/) :\n" +
                  string.Join("\n", ListMissingSymbols(result));
        EditorUtility.DisplayDialog("Config icones", msg, "OK");
    }

    private static IEnumerable<string> ListMissingSymbols(List<IconCompositionConfig.Entry> entries)
    {
        foreach (var e in entries)
            if (e.symbol == null)
                yield return $"  • {e.outputName}.png";
    }

    private static string Capitalize(string s)
    {
        if (string.IsNullOrEmpty(s)) return s;
        return char.ToUpperInvariant(s[0]) + s.Substring(1);
    }
}
