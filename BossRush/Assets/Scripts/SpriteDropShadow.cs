using System.Collections.Generic;
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

    [Tooltip("Échelle de l'ombre par rapport à l'icône")]
    [Range(0.5f, 5f)]
    public float shadowScale = 1.03f;

    [Tooltip("Sorting order offset (négatif = derrière le sprite parent)")]
    public int sortingOrderOffset = -1;

    [Tooltip("Si activé, calcule le centroïde alpha du sprite pour centrer le shadowScale sur le contenu visible (pas sur le pivot). Nécessite Read/Write sur la texture sinon fallback bounds.")]
    public bool centerOnAlphaCentroid = true;

    [Tooltip("Log en console le centroïde calculé et si c'est un fallback bounds.")]
    public bool debugLog = false;

    [Header("Alpha Falloff")]
    [Tooltip("Active le dégradé d'alpha radial (centre = plein, bords = transparent).")]
    public bool useAlphaFalloff = false;

    [Tooltip("Curve contrôlant l'alpha en fonction de la distance normalisée depuis le centre du sprite (0 = centre, 1 = bord).")]
    public AnimationCurve alphaFalloff = new AnimationCurve(
        new Keyframe(0f, 1f, 0f, 0f),
        new Keyframe(1f, 0f, -2f, 0f)
    );

    [Tooltip("Intensité du falloff (0 = désactivé, 1 = plein effet).")]
    [Range(0f, 1f)]
    public float alphaFalloffStrength = 1f;

    private SpriteRenderer sr;
    private GameObject shadowGO;
    private SpriteRenderer shadowSR;
    private Material shadowMat;
    private Texture2D falloffTex;

    private static readonly Dictionary<int, Vector2> centroidCache = new Dictionary<int, Vector2>();
    private static Shader silhouetteShader;

    private void OnEnable()
    {
        sr = GetComponent<SpriteRenderer>();
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

        if (shadowSR.sprite != sr.sprite)
        {
            shadowSR.sprite = sr.sprite;
            UpdateFalloffMaterial();
        }

        ApplyShadowTransform();

        if (shadowMat != null)
        {
            shadowMat.SetColor("_Color", shadowColor);
            shadowMat.SetFloat("_FalloffStrength", useAlphaFalloff ? alphaFalloffStrength : 0f);
        }

        shadowSR.sortingLayerID = sr.sortingLayerID;
        shadowSR.sortingOrder = sr.sortingOrder + sortingOrderOffset;
    }

    private void ApplyShadowTransform()
    {
        Vector2 center = GetVisualCenterLocal(sr.sprite);
        Vector2 comp = center * (1f - shadowScale);
        shadowGO.transform.localPosition = new Vector3(offsetX + comp.x, offsetY + comp.y, 0.001f);
        shadowGO.transform.localScale = new Vector3(shadowScale, shadowScale, 1f);
    }

    private Vector2 GetVisualCenterLocal(Sprite sprite)
    {
        if (sprite == null) return Vector2.zero;

        if (centerOnAlphaCentroid)
        {
            int key = sprite.GetInstanceID();
            if (centroidCache.TryGetValue(key, out var cached))
                return cached;

            if (TryComputeAlphaCentroid(sprite, out var centroid))
            {
                centroidCache[key] = centroid;
                if (debugLog) Debug.Log($"[SpriteDropShadow] {name}: alpha centroid OK pour '{sprite.name}' = {centroid} (tex {sprite.texture?.name}, readable={sprite.texture?.isReadable})", this);
                return centroid;
            }
            if (debugLog) Debug.LogWarning($"[SpriteDropShadow] {name}: fallback bounds pour '{sprite.name}' (tex {sprite.texture?.name}, readable={sprite.texture?.isReadable}) → l'ombre risque d'être décalée si le pivot n'est pas centré sur le contenu visible", this);
        }
        return sprite.bounds.center;
    }

    [ContextMenu("Clear centroid cache & rebuild")]
    private void ContextClearAndRebuild()
    {
        ClearCentroidCache();
        Rebuild();
    }

    private static bool TryComputeAlphaCentroid(Sprite sprite, out Vector2 localCenter)
    {
        localCenter = Vector2.zero;
        Texture2D tex = sprite.texture;
        if (tex == null) return false;
        if (!tex.isReadable) return false;

        Color[] pixels;
        try
        {
            Rect tr = sprite.textureRect;
            int x = Mathf.FloorToInt(tr.x);
            int y = Mathf.FloorToInt(tr.y);
            int w = Mathf.FloorToInt(tr.width);
            int h = Mathf.FloorToInt(tr.height);
            if (w <= 0 || h <= 0) return false;
            pixels = tex.GetPixels(x, y, w, h);

            double sumW = 0.0, sumX = 0.0, sumY = 0.0;
            int step = Mathf.Max(1, Mathf.Min(w, h) / 128);
            for (int j = 0; j < h; j += step)
            {
                int row = j * w;
                for (int i = 0; i < w; i += step)
                {
                    float a = pixels[row + i].a;
                    if (a <= 0.01f) continue;
                    sumW += a;
                    sumX += a * i;
                    sumY += a * j;
                }
            }
            if (sumW <= 0.0) return false;

            float cx = (float)(sumX / sumW);
            float cy = (float)(sumY / sumW);
            Vector2 pivotPx = sprite.pivot;
            float ppu = sprite.pixelsPerUnit;
            if (ppu <= 0f) ppu = 100f;
            localCenter = new Vector2((cx - pivotPx.x) / ppu, (cy - pivotPx.y) / ppu);
            return true;
        }
        catch (System.Exception)
        {
            return false;
        }
    }

    private void BakeFalloffTexture()
    {
        if (falloffTex != null)
        {
            if (Application.isPlaying) Destroy(falloffTex);
            else DestroyImmediate(falloffTex);
            falloffTex = null;
        }

        const int w = 128;
        falloffTex = new Texture2D(w, 1, TextureFormat.R8, false);
        falloffTex.hideFlags = HideFlags.DontSave;
        falloffTex.wrapMode = TextureWrapMode.Clamp;
        falloffTex.filterMode = FilterMode.Bilinear;

        Color[] pixels = new Color[w];
        for (int i = 0; i < w; i++)
        {
            float t = i / (float)(w - 1);
            float v = Mathf.Clamp01(alphaFalloff != null ? alphaFalloff.Evaluate(t) : 1f);
            pixels[i] = new Color(v, v, v, 1f);
        }
        falloffTex.SetPixels(pixels);
        falloffTex.Apply();
    }

    private void UpdateFalloffMaterial()
    {
        if (shadowMat == null) return;

        if (!useAlphaFalloff || falloffTex == null)
        {
            shadowMat.SetFloat("_FalloffStrength", 0f);
            return;
        }

        shadowMat.SetTexture("_FalloffTex", falloffTex);
        shadowMat.SetFloat("_FalloffStrength", alphaFalloffStrength);

        Sprite sprite = sr != null ? sr.sprite : null;
        if (sprite != null && sprite.texture != null)
        {
            Texture2D tex = sprite.texture;
            Rect tr = sprite.textureRect;
            float cx = (tr.x + tr.width  * 0.5f) / tex.width;
            float cy = (tr.y + tr.height * 0.5f) / tex.height;
            float hx = (tr.width  * 0.5f) / tex.width;
            float hy = (tr.height * 0.5f) / tex.height;
            shadowMat.SetVector("_UVCenter",     new Vector4(cx, cy, 0, 0));
            shadowMat.SetVector("_UVHalfExtent", new Vector4(hx, hy, 0, 0));
        }
    }

    private void Rebuild()
    {
        if (sr == null) return;

        DestroyShadow();

        if (silhouetteShader == null)
            silhouetteShader = Shader.Find("Custom/SpriteSilhouette");

        shadowGO = new GameObject("_DropShadow");
        shadowGO.hideFlags = HideFlags.DontSave;
        shadowGO.transform.SetParent(transform, false);
        shadowGO.transform.localRotation = Quaternion.identity;

        shadowSR = shadowGO.AddComponent<SpriteRenderer>();
        shadowSR.sprite = sr.sprite;
        shadowSR.sortingLayerID = sr.sortingLayerID;
        shadowSR.sortingOrder = sr.sortingOrder + sortingOrderOffset;
        shadowSR.flipX = sr.flipX;
        shadowSR.flipY = sr.flipY;

        if (silhouetteShader != null)
        {
            shadowMat = new Material(silhouetteShader);
            shadowMat.hideFlags = HideFlags.DontSave;
            shadowMat.SetColor("_Color", shadowColor);
            shadowMat.SetFloat("_AlphaCutoff", 0.01f);
            shadowMat.SetFloat("_Expand", 0f);
            shadowMat.SetFloat("_Erode", 0f);
            shadowSR.material = shadowMat;
        }

        if (useAlphaFalloff)
        {
            BakeFalloffTexture();
            UpdateFalloffMaterial();
        }

        ApplyShadowTransform();
    }

    public void ForceUpdate()
    {
        if (sr == null) sr = GetComponent<SpriteRenderer>();
        if (shadowGO == null || shadowSR == null)
            Rebuild();
        else
            LateUpdate();
    }

    public static void ClearCentroidCache()
    {
        centroidCache.Clear();
    }

    private void DestroyShadow()
    {
        if (falloffTex != null)
        {
            if (Application.isPlaying) Destroy(falloffTex);
            else DestroyImmediate(falloffTex);
            falloffTex = null;
        }
        if (shadowMat != null)
        {
            if (Application.isPlaying) Destroy(shadowMat);
            else DestroyImmediate(shadowMat);
            shadowMat = null;
        }
        if (shadowGO != null)
        {
            if (Application.isPlaying) Destroy(shadowGO);
            else DestroyImmediate(shadowGO);
            shadowGO = null;
            shadowSR = null;
        }
    }
}
