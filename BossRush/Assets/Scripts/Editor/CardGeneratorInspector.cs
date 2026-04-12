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
        EditorGUILayout.LabelField($"{count} cartes chargées", EditorStyles.helpBox);

        previewIndex = EditorGUILayout.IntSlider("Prévisualiser", previewIndex, 0, count - 1);

        string cardName = generator.GetCardName(previewIndex);
        string info = GetInfoLabel(generator, previewIndex);
        if (!string.IsNullOrEmpty(info))
            EditorGUILayout.LabelField(info, EditorStyles.miniLabel);

        if (!generator.HasSprite(previewIndex))
            EditorGUILayout.HelpBox($"Pas de sprite assigné pour '{cardName}'", MessageType.Warning);

        if (GUILayout.Button($"Prévisualiser : {cardName}"))
        {
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
        if (borders != null) borders.SetActive(false);

        generator.GenerateCard(index);
        capture.Capture(new ToExport
        {
            finalName = generator.GetCardName(index),
            category = generator.outputFolder
        });

        if (borders != null) borders.SetActive(true);

        AssetDatabase.Refresh();
        Debug.Log($"Carte exportée : {generator.GetCardName(index)}");
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
        if (borders != null) borders.SetActive(false);

        int count = GetCardCount(generator);
        for (int i = 0; i < count; i++)
        {
            generator.GenerateCard(i);
            capture.Capture(new ToExport
            {
                finalName = generator.GetCardName(i),
                category = generator.outputFolder
            });
        }

        if (borders != null) borders.SetActive(true);

        AssetDatabase.Refresh();
        Debug.Log($"{count} cartes exportées dans Final/{generator.outputFolder}/");
    }
}
