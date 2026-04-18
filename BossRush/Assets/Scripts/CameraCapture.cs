using System;
using System.IO;
using UnityEngine;

public class CameraCapture : MonoBehaviour
{
    [Tooltip("Si activé, les bandes noires (Borders) sont conservées à l'export")]
    public bool keepBorders = false;

    [Tooltip("Résolution finale de l'export (le rendu est fait en haute résolution puis downscalé)")]
    public int exportWidth = 825;
    public int exportHeight = 1125;

    [Serializable]
    public class ToExport
    {
        public string finalName;
        public string category;
        public string suffix = "face";
    }

    private Camera Camera
    {
        get
        {
            if (!_camera)
            {
                _camera = Camera.main;
            }
            return _camera;
        }
    }
    private Camera _camera;
    public void Capture(ToExport toExport)
    {
        RenderTexture activeRenderTexture = RenderTexture.active;
        RenderTexture.active = Camera.targetTexture;

        // Forcer la mise à jour des ombres et outlines avant le rendu
        foreach (var shadow in FindObjectsOfType<SpriteDropShadow>())
            shadow.ForceUpdate();
        foreach (var outline in FindObjectsOfType<SpriteOutline>())
            outline.ForceUpdate();

        Camera.Render();

        Texture2D hiRes = new Texture2D(Camera.targetTexture.width, Camera.targetTexture.height);
        hiRes.ReadPixels(new Rect(0, 0, Camera.targetTexture.width, Camera.targetTexture.height), 0, 0);
        hiRes.Apply();
        RenderTexture.active = activeRenderTexture;

        // Downscale vers la résolution d'export si le rendu est plus grand.
        // Pour un downscale 2x-3x, un seul Blit bilinéaire produit du moiré/aliasing
        // sur les bords fins. On fait 2 passes successives (cascade) :
        //   hiRes -> intermédiaire ~1.5x la taille d'export -> taille finale.
        // Équivalent d'un filtre box 2-pass, bien plus propre qu'un blit unique.
        Texture2D image;
        if (hiRes.width != exportWidth || hiRes.height != exportHeight)
        {
            int midWidth = Mathf.Max(exportWidth, exportWidth * 3 / 2);
            int midHeight = Mathf.Max(exportHeight, exportHeight * 3 / 2);

            RenderTexture rtMid = RenderTexture.GetTemporary(midWidth, midHeight, 0, RenderTextureFormat.ARGB32, RenderTextureReadWrite.Default);
            rtMid.filterMode = FilterMode.Bilinear;
            Graphics.Blit(hiRes, rtMid);

            RenderTexture rt = RenderTexture.GetTemporary(exportWidth, exportHeight, 0, RenderTextureFormat.ARGB32, RenderTextureReadWrite.Default);
            rt.filterMode = FilterMode.Bilinear;
            Graphics.Blit(rtMid, rt);
            RenderTexture.active = rt;

            image = new Texture2D(exportWidth, exportHeight);
            image.ReadPixels(new Rect(0, 0, exportWidth, exportHeight), 0, 0);
            image.Apply();

            RenderTexture.active = null;
            RenderTexture.ReleaseTemporary(rt);
            RenderTexture.ReleaseTemporary(rtMid);
            DestroyImmediate(hiRes);
        }
        else
        {
            image = hiRes;
        }

        byte[] bytes = image.EncodeToPNG();
        DestroyImmediate(image);
        string suffix = string.IsNullOrEmpty(toExport.suffix) ? "face" : toExport.suffix;
        File.WriteAllBytes(Application.dataPath + "/Art/Final/" + toExport.category + "/"+ toExport.finalName +"[" + suffix + ",1].png", bytes);
    }
}