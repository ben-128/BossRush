using UnityEngine;
#if UNITY_EDITOR
using UnityEditor;
#endif

/// <summary>
/// Ajoute une ombre portée derrière un SpriteRenderer.
/// Crée un child GameObject avec le même sprite, teinté noir semi-transparent, décalé.
/// Usage : icônes de compétence et goutte de PV sur les cartes.
/// </summary>
[ExecuteInEditMode]
[RequireComponent(typeof(SpriteRenderer))]
public class SpriteDropShadow : MonoBehaviour
{
    [Header("Ombre portée")]
    [Tooltip("Couleur de l'ombre (noir semi-transparent)")]
    public Color shadowColor = new Color(0f, 0f, 0f, 0.45f);

    [Tooltip("Décalage X en world units (positif = droite)")]
    public float offsetX = 0.015f;

    [Tooltip("Décalage Y en world units (négatif = bas)")]
    public float offsetY = -0.015f;

    [Tooltip("Échelle de l'ombre par rapport à l'icône (1.05 = légèrement plus grande)")]
    [Range(1f, 1.2f)]
    public float shadowScale = 1.03f;

    [Tooltip("Sorting order offset (négatif = derrière le sprite parent)")]
    public int sortingOrderOffset = -1;

    private SpriteRenderer sr;
    private GameObject shadowGO;
    private SpriteRenderer shadowSR;
    private MaterialPropertyBlock mpb;

    private void OnEnable()
    {
        sr = GetComponent<SpriteRenderer>();
        mpb = new MaterialPropertyBlock();
        Rebuild();
    }

    private void OnDisable()
    {
        DestroyShadow();
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
        if (sr == null || shadowSR == null) return;

        // Sync sprite
        if (shadowSR.sprite != sr.sprite)
            shadowSR.sprite = sr.sprite;

        // Position
        shadowGO.transform.localPosition = new Vector3(offsetX, offsetY, 0.001f);
        shadowGO.transform.localScale = new Vector3(shadowScale, shadowScale, 1f);

        // Couleur via PropertyBlock (pas de material instance)
        mpb.SetColor("_Color", shadowColor);
        shadowSR.SetPropertyBlock(mpb);

        // Sorting
        shadowSR.sortingLayerID = sr.sortingLayerID;
        shadowSR.sortingOrder = sr.sortingOrder + sortingOrderOffset;
    }

    private void Rebuild()
    {
        if (sr == null) return;

        DestroyShadow();

        shadowGO = new GameObject("_DropShadow");
        shadowGO.hideFlags = HideFlags.DontSave;
        shadowGO.transform.SetParent(transform, false);
        shadowGO.transform.localPosition = new Vector3(offsetX, offsetY, 0.001f);
        shadowGO.transform.localRotation = Quaternion.identity;
        shadowGO.transform.localScale = new Vector3(shadowScale, shadowScale, 1f);

        shadowSR = shadowGO.AddComponent<SpriteRenderer>();
        shadowSR.sprite = sr.sprite;
        shadowSR.sortingLayerID = sr.sortingLayerID;
        shadowSR.sortingOrder = sr.sortingOrder + sortingOrderOffset;
        shadowSR.flipX = sr.flipX;
        shadowSR.flipY = sr.flipY;

        // Teinter en noir semi-transparent via PropertyBlock
        mpb = new MaterialPropertyBlock();
        mpb.SetColor("_Color", shadowColor);
        shadowSR.SetPropertyBlock(mpb);
    }

    /// <summary>
    /// Force rebuild + update. Appeler avant Camera.Render() si besoin.
    /// </summary>
    public void ForceUpdate()
    {
        if (sr == null) sr = GetComponent<SpriteRenderer>();
        if (shadowGO == null || shadowSR == null)
            Rebuild();
        else
            LateUpdate();
    }

    private void DestroyShadow()
    {
        if (shadowGO != null)
        {
            if (Application.isPlaying)
                Destroy(shadowGO);
            else
                DestroyImmediate(shadowGO);
            shadowGO = null;
            shadowSR = null;
        }
    }
}
