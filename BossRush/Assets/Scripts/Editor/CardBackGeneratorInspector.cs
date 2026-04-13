using UnityEditor;
using UnityEngine;
using static CameraCapture;

[CustomEditor(typeof(CardBackGenerator))]
public class CardBackGeneratorInspector : Editor
{
    private int previewIndex = 0;

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
        if (borders != null) borders.SetActive(false);

        generator.GenerateCard(index);
        capture.Capture(new ToExport
        {
            finalName = generator.GetCardName(index),
            category = generator.outputFolder,
            suffix = "dos"
        });

        if (borders != null) borders.SetActive(true);

        AssetDatabase.Refresh();
        Debug.Log($"Dos exporté : {generator.GetCardName(index)}");
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
        if (borders != null) borders.SetActive(false);

        int count = generator.Count;
        for (int i = 0; i < count; i++)
        {
            generator.GenerateCard(i);
            capture.Capture(new ToExport
            {
                finalName = generator.GetCardName(i),
                category = generator.outputFolder,
                suffix = "dos"
            });
        }

        if (borders != null) borders.SetActive(true);

        AssetDatabase.Refresh();
        Debug.Log($"{count} dos exportés dans Art/Final/{generator.outputFolder}/");
    }
}
