using System;
using System.IO;
using UnityEngine;

public class CameraCapture : MonoBehaviour
{
    [Serializable]
    public class ToExport
    {
        public string finalName;
        public string category;
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

        Camera.Render();

        Texture2D image = new Texture2D(Camera.targetTexture.width, Camera.targetTexture.height);
        image.ReadPixels(new Rect(0, 0, Camera.targetTexture.width, Camera.targetTexture.height), 0, 0);
        image.Apply();
        RenderTexture.active = activeRenderTexture;

        byte[] bytes = image.EncodeToPNG();
        DestroyImmediate(image);
        File.WriteAllBytes(Application.dataPath + "/Final/" + toExport.category + "/"+ toExport.finalName +"[face,1].png", bytes);
    }
}