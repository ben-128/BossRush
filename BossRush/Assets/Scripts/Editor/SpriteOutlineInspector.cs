using UnityEngine;
using UnityEditor;
using UnityEngine.SceneManagement;

[CustomEditor(typeof(SpriteOutline))]
public class SpriteOutlineInspector : Editor
{
    public override void OnInspectorGUI()
    {
        DrawDefaultInspector();

        EditorGUILayout.Space();

        if (GUILayout.Button("Cleanup tous les _Outline (scène entière)"))
        {
            int count = 0;

            // 1) Tous les GO dans les scènes chargées
            for (int i = 0; i < SceneManager.sceneCount; i++)
            {
                var scene = SceneManager.GetSceneAt(i);
                if (!scene.isLoaded) continue;

                foreach (var root in scene.GetRootGameObjects())
                {
                    count += DestroyAllOutlineChildren(root.transform);
                }
            }

            // 2) Objets DontSave / HideAndDontSave hors scène
            var allTransforms = Resources.FindObjectsOfTypeAll<Transform>();
            foreach (var t in allTransforms)
            {
                if (t == null) continue;
                if (t.name == "_Outline")
                {
                    DestroyImmediate(t.gameObject);
                    count++;
                }
            }

            // 3) Forcer les SpriteOutline actifs à recréer leur outline propre
            foreach (var so in FindObjectsOfType<SpriteOutline>())
            {
                if (so != null && so.enabled)
                    so.SendMessage("OnEnable", SendMessageOptions.DontRequireReceiver);
            }

            Debug.Log($"[SpriteOutline] {count} _Outline supprimé(s) et outlines actifs recréés.");
        }
    }

    private static int DestroyAllOutlineChildren(Transform parent)
    {
        int count = 0;
        for (int i = parent.childCount - 1; i >= 0; i--)
        {
            var child = parent.GetChild(i);
            count += DestroyAllOutlineChildren(child);

            if (child.name == "_Outline")
            {
                DestroyImmediate(child.gameObject);
                count++;
            }
        }
        return count;
    }
}
