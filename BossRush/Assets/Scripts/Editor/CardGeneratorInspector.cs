using UnityEditor;
using UnityEngine;
using static CameraCapture;

public abstract class CardGeneratorInspector<T> : Editor where T : CardGenerator
{
    private int previewIndex = 0;

    protected abstract int GetCardCount(T generator);
    protected abstract string GetInfoLabel(T generator, int index);

    public override void OnInspectorGUI()
    {
        DrawDefaultInspector();

        T generator = (T)target;

        // ── Mode de rendu : 2 boutons à bascule
        EditorGUILayout.Space(10);
        EditorGUILayout.LabelField("Mode de rendu", EditorStyles.boldLabel);
        using (new EditorGUILayout.HorizontalScope())
        {
            var orig = GUI.backgroundColor;

            GUI.backgroundColor = generator.renderMode == CardGenerator.RenderMode.Proto
                ? new Color(1f, 0.85f, 0.3f) : orig;
            if (GUILayout.Button("Proto", GUILayout.Height(24)))
            {
                Undo.RecordObject(generator, "Set Proto Mode");
                generator.renderMode = CardGenerator.RenderMode.Proto;
                generator.ApplyRenderMode();
                EditorUtility.SetDirty(generator);
                SceneView.RepaintAll();
            }

            GUI.backgroundColor = generator.renderMode == CardGenerator.RenderMode.Final
                ? new Color(0.4f, 0.9f, 0.5f) : orig;
            if (GUILayout.Button("Final", GUILayout.Height(24)))
            {
                Undo.RecordObject(generator, "Set Final Mode");
                generator.renderMode = CardGenerator.RenderMode.Final;
                generator.ApplyRenderMode();
                EditorUtility.SetDirty(generator);
                SceneView.RepaintAll();
            }

            GUI.backgroundColor = orig;
        }

        EditorGUILayout.Space(10);
        EditorGUILayout.LabelField("Génération", EditorStyles.boldLabel);

        if (GUILayout.Button("Charger le JSON"))
        {
            Undo.RecordObject(generator, "Load from JSON");
            generator.LoadFromJson();
            EditorUtility.SetDirty(generator);
        }

        int count = GetCardCount(generator);
        if (count <= 0) return;

        EditorGUILayout.Space(5);
        EditorGUILayout.LabelField($"{count} cartes chargées — mode {generator.renderMode}", EditorStyles.helpBox);

        previewIndex = EditorGUILayout.IntSlider("Prévisualiser", previewIndex, 0, count - 1);

        string cardName = generator.GetCardName(previewIndex);
        string info = GetInfoLabel(generator, previewIndex);
        if (!string.IsNullOrEmpty(info))
            EditorGUILayout.LabelField(info, EditorStyles.miniLabel);

        if (!generator.HasSprite(previewIndex))
            EditorGUILayout.HelpBox($"Pas de sprite assigné pour '{cardName}'", MessageType.Warning);

        if (GUILayout.Button($"Prévisualiser : {cardName}"))
        {
            generator.ApplyRenderMode();
            generator.GenerateCard(previewIndex);
            SceneView.RepaintAll();
        }

        EditorGUILayout.Space(5);

        if (GUILayout.Button($"Exporter : {cardName}"))
        {
            int idx = previewIndex;
            EditorApplication.delayCall += () => ExportOne(generator, idx);
        }

        EditorGUILayout.Space(5);
        GUI.backgroundColor = Color.green;
        if (GUILayout.Button("Exporter toutes les cartes", GUILayout.Height(30)))
        {
            EditorApplication.delayCall += () => ExportAll(generator);
        }
        GUI.backgroundColor = Color.white;
    }

    private static GameObject FindBorders()
    {
        return GameObject.Find("Borders") ?? GameObject.Find("borders");
    }

    private void ExportOne(T generator, int index)
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

        generator.ApplyRenderMode();
        generator.GenerateCard(index);
        ForceUpdateVisualComponents();
        capture.Capture(new ToExport
        {
            finalName = generator.GetCardName(index),
            category = generator.outputFolder
        });

        if (hideBorders) borders.SetActive(true);

        AssetDatabase.Refresh();
        Debug.Log($"Carte exportée ({generator.renderMode}) : {generator.GetCardName(index)}");
    }

    private static void ForceUpdateVisualComponents()
    {
        foreach (var shadow in Object.FindObjectsOfType<SpriteDropShadow>())
            shadow.ForceUpdate();
        foreach (var outline in Object.FindObjectsOfType<SpriteOutline>())
            outline.ForceUpdate();
    }

    private void ExportAll(T generator)
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

        generator.ApplyRenderMode();

        int count = GetCardCount(generator);
        for (int i = 0; i < count; i++)
        {
            generator.GenerateCard(i);
            ForceUpdateVisualComponents();
            capture.Capture(new ToExport
            {
                finalName = generator.GetCardName(i),
                category = generator.outputFolder
            });
        }

        if (hideBorders) borders.SetActive(true);

        AssetDatabase.Refresh();
        Debug.Log($"{count} cartes exportées ({generator.renderMode}) dans Art/Final/{generator.outputFolder}/");
    }
}
