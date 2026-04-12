using System;
using System.Collections;
using UnityEditor;
using UnityEngine;
using static CameraCapture;

[CustomEditor(typeof(GenericImageGenerator))]
public class GenericImageGeneratorInspector : Editor
{
    public override void OnInspectorGUI()
    {
        DrawDefaultInspector();
        GenericImageGenerator myComponent = (GenericImageGenerator)target;
        if (GUILayout.Button("generateAll"))
        {
            EditorApplication.delayCall += () =>
            {
                GenerateAll(myComponent);
            };
        }
        if (GUILayout.Button("generate 3 lasts"))
        {
            EditorApplication.delayCall += () =>
            {
                Generate3Lasts(myComponent);
            };
        }
    }

    private static GameObject FindBorders()
    {
        return GameObject.Find("Borders") ?? GameObject.Find("borders");
    }

    private void GenerateAll(GenericImageGenerator myComponent)
    {
        var capture = Camera.main.GetComponent<CameraCapture>();
        var borders = FindBorders();
        if (borders != null) borders.SetActive(false);

        for (int i = 0; i < myComponent.allimages.Length; i++)
        {
            myComponent.GenerateImage(myComponent.allimages[i]);
            capture.Capture(new ToExport() { finalName = myComponent.allimages[i].name, category = myComponent.categoryName });
        }

        if (borders != null) borders.SetActive(true);
        AssetDatabase.Refresh();
    }

    private void Generate3Lasts(GenericImageGenerator myComponent)
    {
        var capture = Camera.main.GetComponent<CameraCapture>();
        var borders = FindBorders();
        if (borders != null) borders.SetActive(false);

        for (int i = myComponent.allimages.Length - 3; i < myComponent.allimages.Length; i++)
        {
            if(i >= 0)
            {
                myComponent.GenerateImage(myComponent.allimages[i]);
                capture.Capture(new ToExport() { finalName = myComponent.allimages[i].name, category = myComponent.categoryName });
            }
        }

        if (borders != null) borders.SetActive(true);
        AssetDatabase.Refresh();
    }
}
