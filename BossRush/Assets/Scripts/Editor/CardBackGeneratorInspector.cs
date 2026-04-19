using UnityEditor;
using UnityEngine;
using static CameraCapture;

[CustomEditor(typeof(CardBackGenerator))]
public class CardBackGeneratorInspector : Editor
{
    private int previewIndex = 0;
    private int previewVariantIndex = 0;

    public override void OnInspectorGUI()
    {
        DrawDefaultInspector();

        CardBackGenerator generator = (CardBackGenerator)target;

        int count = generator.Count;
        if (count <= 0) return;

        EditorGUILayout.Space(10);
        EditorGUILayout.LabelField("Génération des dos", EditorStyles.boldLabel);
        EditorGUILayout.LabelField($"{count} dos chargés", EditorStyles.helpBox);

        previewIndex = EditorGUILayout.IntSlider("Prévisualiser", previewIndex, 0, count - 1);
        string cardName = generator.GetCardName(previewIndex);

        int variantCount = generator.GetVariantCount(previewIndex);
        if (variantCount > 1)
        {
            previewVariantIndex = Mathf.Clamp(previewVariantIndex, 0, variantCount - 1);
            previewVariantIndex = EditorGUILayout.IntSlider(
                $"Variante ({variantCount})", previewVariantIndex, 0, variantCount - 1);
            string variantName = generator.GetVariantName(previewIndex, previewVariantIndex);
            EditorGUILayout.LabelField("Nom variante", variantName, EditorStyles.miniLabel);
        }

        if (GUILayout.Button($"Prévisualiser : {cardName}" +
            (variantCount > 1 ? $" (variante {previewVariantIndex})" : "")))
        {
            generator.GenerateCard(previewIndex, variantCount > 1 ? previewVariantIndex : 0);
            SceneView.RepaintAll();
        }

        EditorGUILayout.Space(5);

        if (GUILayout.Button($"Exporter : {cardName}" +
            (variantCount > 1 ? $" ({variantCount} variantes)" : "")))
        {
            int idx = previewIndex;
            EditorApplication.delayCall += () => ExportOne(generator, idx);
        }

        EditorGUILayout.Space(5);
        GUI.backgroundColor = Color.green;
        if (GUILayout.Button("Exporter tous les dos", GUILayout.Height(30)))
        {
            EditorApplication.delayCall += () => ExportAll(generator);
        }
        GUI.backgroundColor = Color.white;
    }

    private static GameObject FindBorders()
    {
        return GameObject.Find("Borders") ?? GameObject.Find("borders");
    }

    private void ExportOne(CardBackGenerator generator, int index)
    {
        var capture = Camera.main.GetComponent<CameraCapture>();
        if (capture == null)
        {
            Debug.LogError("Pas de CameraCapture sur la caméra principale !");
            return;
        }

        var borders = FindBorders();
        bool hideBorders = !capture.keepBorders && borders != null;
        if (hideBorders) borders.SetActive(false);

        int variantCount = generator.GetVariantCount(index);
        for (int v = 0; v < variantCount; v++)
        {
            generator.GenerateCard(index, v);
            capture.Capture(new ToExport
            {
                finalName = generator.GetVariantName(index, v),
                category = generator.outputFolder,
                suffix = "dos"
            });
        }

        if (hideBorders) borders.SetActive(true);

        AssetDatabase.Refresh();
        Debug.Log($"Dos exporté : {generator.GetCardName(index)} ({variantCount} variante(s))");
    }

    private void ExportAll(CardBackGenerator generator)
    {
        var capture = Camera.main.GetComponent<CameraCapture>();
        if (capture == null)
        {
            Debug.LogError("Pas de CameraCapture sur la caméra principale !");
            return;
        }

        var borders = FindBorders();
        bool hideBorders = !capture.keepBorders && borders != null;
        if (hideBorders) borders.SetActive(false);

        int count = generator.Count;
        int totalExports = 0;
        for (int i = 0; i < count; i++)
        {
            int variantCount = generator.GetVariantCount(i);
            Debug.Log($"[CardBack] Entrée {i} '{generator.GetCardName(i)}' → {variantCount} variante(s)");
            for (int v = 0; v < variantCount; v++)
            {
                generator.GenerateCard(i, v);
                string name = generator.GetVariantName(i, v);
                capture.Capture(new ToExport
                {
                    finalName = name,
                    category = generator.outputFolder,
                    suffix = "dos"
                });
                Debug.Log($"[CardBack]   ↳ export '{name}'");
                totalExports++;
            }
        }

        if (hideBorders) borders.SetActive(true);

        AssetDatabase.Refresh();
        Debug.Log($"[CardBack] {totalExports} dos exportés ({count} entrées) dans Art/Final/{generator.outputFolder}/");

        // Diagnostic si toutes les entrées ont 1 variante
        if (totalExports == count)
        {
            bool anyEntryHasVariants = false;
            for (int i = 0; i < count; i++)
            {
                var entriesField = typeof(CardBackGenerator).GetField("entries");
                // Accès direct via la réflexion inutile : on lit juste ce qu'on a
                // Note : si tu attends plus d'exports, vérifie :
                //   1) l'entrée Héros a bien « variantsParCompetence » coché
                //   2) le champ « Hero Palette » est assigné sur CardBackGenerator
                //   3) la palette contient bien 5 entrées dans son array « heroes »
            }
            Debug.LogWarning("[CardBack] Toutes les entrées ont 1 variante. " +
                "Si tu attends 5 variantes pour Héros : 1) coche « variantsParCompetence » " +
                "sur cette entrée, 2) assigne le champ « Hero Palette », 3) vérifie que la palette a 5 heroes.");
        }
    }
}
