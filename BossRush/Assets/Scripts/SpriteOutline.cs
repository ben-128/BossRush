using UnityEngine;
#if UNITY_EDITOR
using UnityEditor;
#endif

[ExecuteInEditMode]
[RequireComponent(typeof(SpriteRenderer))]
public class SpriteOutline : MonoBehaviour
{
    [Header("Outline")]
    public Color outlineColor = new Color(0.1f, 0.05f, 0.02f, 1f);

    [Tooltip("Épaisseur de l'outline en world units")]
    public float outlineExpand = 0.02f;

    [Tooltip("Seuil alpha pour la silhouette")]
    [Range(0f, 1f)]
    public float alphaCutoff = 0.5f;

    [Tooltip("Érosion : rayon en pixels pour éliminer les artefacts")]
    [Range(0f, 5f)]
    public float erode = 2f;

    [Tooltip("Material silhouette (shader Custom/SpriteSilhouette)")]
    public Material silhouetteMaterial;

    [Tooltip("Sorting order offset (négatif = derrière)")]
    public int sortingOrderOffset = -1;

    private SpriteRenderer sr;
    private GameObject outlineGO;
    private SpriteRenderer outlineSR;
    private Material matInstance;

    private void OnEnable()
    {
        sr = GetComponent<SpriteRenderer>();
        Rebuild();
    }

    private void OnDisable()
    {
        DestroyOutline();
    }

    private void OnValidate()
    {
        if (sr == null) sr = GetComponent<SpriteRenderer>();
#if UNITY_EDITOR
        EditorApplication.delayCall += () =>
        {
            if (this != null) Rebuild();
        };
#endif
    }

    private void LateUpdate()
    {
        if (sr == null || outlineSR == null) return;

        if (outlineSR.sprite != sr.sprite)
        {
            outlineSR.sprite = sr.sprite;
        }

        if (matInstance != null)
        {
            matInstance.SetColor("_Color", outlineColor);
            matInstance.SetFloat("_Expand", outlineExpand);
            matInstance.SetFloat("_AlphaCutoff", alphaCutoff);
            matInstance.SetFloat("_Erode", erode);
        }

        outlineSR.sortingLayerID = sr.sortingLayerID;
        outlineSR.sortingOrder = sr.sortingOrder + sortingOrderOffset;
    }

    private void Rebuild()
    {
        if (sr == null || silhouetteMaterial == null) return;

        DestroyOutline();

        outlineGO = new GameObject("_Outline");
        outlineGO.hideFlags = HideFlags.DontSave;
        outlineGO.transform.SetParent(transform, false);
        outlineGO.transform.localPosition = Vector3.zero;
        outlineGO.transform.localRotation = Quaternion.identity;
        outlineGO.transform.localScale = Vector3.one;

        matInstance = new Material(silhouetteMaterial);
        matInstance.hideFlags = HideFlags.DontSave;
        matInstance.SetColor("_Color", outlineColor);
        matInstance.SetFloat("_Expand", outlineExpand);

        outlineSR = outlineGO.AddComponent<SpriteRenderer>();
        outlineSR.sprite = sr.sprite;
        outlineSR.material = matInstance;
        outlineSR.sortingLayerID = sr.sortingLayerID;
        outlineSR.sortingOrder = sr.sortingOrder + sortingOrderOffset;
        outlineSR.flipX = sr.flipX;
        outlineSR.flipY = sr.flipY;

        // S'assurer que le parent garde le shader sprite par défaut
        var defaultShader = Shader.Find("Sprites/Default");
        if (sr.sharedMaterial == null || sr.sharedMaterial.shader != defaultShader)
        {
            sr.material = new Material(defaultShader);
        }
    }

    /// <summary>
    /// Force la reconstruction et mise à jour du outline.
    /// Appeler avant un Camera.Render() pour garantir que l'outline est prêt.
    /// </summary>
    public void ForceUpdate()
    {
        if (sr == null) sr = GetComponent<SpriteRenderer>();
        if (outlineGO == null || outlineSR == null)
            Rebuild();
        else
            LateUpdate();
    }

    private void DestroyOutline()
    {
        if (outlineGO != null)
        {
            if (Application.isPlaying)
                Destroy(outlineGO);
            else
                DestroyImmediate(outlineGO);
            outlineGO = null;
            outlineSR = null;
        }
    }
}
