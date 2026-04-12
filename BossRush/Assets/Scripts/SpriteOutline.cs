using UnityEngine;

[ExecuteInEditMode]
[RequireComponent(typeof(SpriteRenderer))]
public class SpriteOutline : MonoBehaviour
{
    [Header("Outline")]
    public Color outlineColor = new Color(0.1f, 0.05f, 0.02f, 1f);

    [Tooltip("Épaisseur en UV (0.005 = fin, 0.02 = épais)")]
    [Range(0f, 0.05f)]
    public float outlineThickness = 0.01f;

    private SpriteRenderer sr;
    private MaterialPropertyBlock mpb;

    private void OnEnable()
    {
        sr = GetComponent<SpriteRenderer>();
        mpb = new MaterialPropertyBlock();
        Apply();
    }

    private void OnValidate()
    {
        if (sr == null) sr = GetComponent<SpriteRenderer>();
        if (mpb == null) mpb = new MaterialPropertyBlock();
        Apply();
    }

    private void Apply()
    {
        if (sr == null) return;
        sr.GetPropertyBlock(mpb);
        mpb.SetColor("_OutlineColor", outlineColor);
        mpb.SetFloat("_OutlineThickness", outlineThickness);
        sr.SetPropertyBlock(mpb);
    }
}
