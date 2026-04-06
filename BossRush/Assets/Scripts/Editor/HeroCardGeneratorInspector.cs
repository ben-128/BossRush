using UnityEditor;
using UnityEngine;
using static CameraCapture;

[CustomEditor(typeof(HeroCardGenerator))]
public class HeroCardGeneratorInspector : Editor
{
    private int previewIndex = 0;

    public override void OnInspectorGUI()
    {
        DrawDefaultInspector();

        HeroCardGenerator generator = (HeroCardGenerator)target;

        EditorGUILayout.Space(10);
        EditorGUILayout.LabelField("Génération", EditorStyles.boldLabel);

        // Bouton pour charger le JSON
        if (GUILayout.Button("Charger le JSON"))
        {
            Undo.RecordObject(generator, "Load heroes from JSON");
            generator.LoadFromJson();
            EditorUtility.SetDirty(generator);
        }

        if (generator.allHeroes != null && generator.allHeroes.Length > 0)
        {
            EditorGUILayout.Space(5);
            EditorGUILayout.LabelField($"{generator.allHeroes.Length} héros chargés", EditorStyles.helpBox);

            previewIndex = EditorGUILayout.IntSlider("Prévisualiser", previewIndex, 0, generator.allHeroes.Length - 1);

            string heroName = generator.allHeroes[previewIndex].nom;
            bool hasSprite = generator.allHeroes[previewIndex].sprite != null;

            if (!hasSprite)
                EditorGUILayout.HelpBox($"Pas de sprite assigné pour '{heroName}'", MessageType.Warning);

            if (GUILayout.Button($"Prévisualiser : {heroName}"))
            {
                generator.GenerateCard(generator.allHeroes[previewIndex]);
                SceneView.RepaintAll();
            }

            EditorGUILayout.Space(5);

            if (GUILayout.Button($"Exporter : {heroName}"))
            {
                EditorApplication.delayCall += () =>
                {
                    ExportOne(generator, previewIndex);
                };
            }

            EditorGUILayout.Space(5);
            GUI.backgroundColor = Color.green;
            if (GUILayout.Button("Exporter tous les héros", GUILayout.Height(30)))
            {
                EditorApplication.delayCall += () =>
                {
                    ExportAll(generator);
                };
            }
            GUI.backgroundColor = Color.white;
        }
    }

    private void ExportOne(HeroCardGenerator generator, int index)
    {
        var capture = Camera.main.GetComponent<CameraCapture>();
        if (capture == null)
        {
            Debug.LogError("Pas de CameraCapture sur la caméra principale !");
            return;
        }

        var hero = generator.allHeroes[index];
        generator.GenerateCard(hero);
        capture.Capture(new ToExport()
        {
            finalName = hero.nom,
            category = generator.outputFolder
        });

        AssetDatabase.Refresh();
        Debug.Log($"Héros exporté : {hero.nom}");
    }

    private void ExportAll(HeroCardGenerator generator)
    {
        var capture = Camera.main.GetComponent<CameraCapture>();
        if (capture == null)
        {
            Debug.LogError("Pas de CameraCapture sur la caméra principale !");
            return;
        }

        for (int i = 0; i < generator.allHeroes.Length; i++)
        {
            var hero = generator.allHeroes[i];
            generator.GenerateCard(hero);
            capture.Capture(new ToExport()
            {
                finalName = hero.nom,
                category = generator.outputFolder
            });
        }

        AssetDatabase.Refresh();
        Debug.Log($"{generator.allHeroes.Length} héros exportés dans Final/{generator.outputFolder}/");
    }
}
