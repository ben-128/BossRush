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

    [Tooltip("Échelle de l'ombre par rapport à l'icône (1.05 = légèrement plus grande)")]
    [Range(1f, 2f)]
    public float shadowScale = 1.03f;

    [Tooltip("Sorting order offset (négatif = derrière le sprite parent)")]
    public int sortingOrderOffset = -1;

    [Tooltip("Si activé, calcule le centroïde alpha du sprite pour centrer le shadowScale sur le contenu visible (pas sur le pivot). Nécessite Read/Write sur la texture sinon fallback bounds.")]
    public bool centerOnAlphaCentroid = true;

    [Tooltip("Log en console le centroïde calculé et si c'est un fallback bounds.")]
    public bool debugLog = false;

    private SpriteRenderer sr;
    private GameObject shadowGO;
    private SpriteRenderer shadowSR;
    private Material shadowMat;

    // Cache centroïde par sprite (clé: instanceID) pour éviter de relire la texture chaque frame.
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

        // Sync sprite
        if (shadowSR.sprite != sr.sprite)
            shadowSR.sprite = sr.sprite;

        ApplyShadowTransform();

        // Couleur via material (SpriteSilhouette : remplace tous les pixels par shadowColor)
        if (shadowMat != null)
            shadowMat.SetColor("_Color", shadowColor);

        // Sorting
        shadowSR.sortingLayerID = sr.sortingLayerID;
        shadowSR.sortingOrder = sr.sortingOrder + sortingOrderOffset;
    }

    /// <summary>
    /// Positionne et scale l'ombre en compensant pour que shadowScale soit centré
    /// sur le contenu visible du sprite (centroïde alpha), pas sur le pivot.
    /// </summary>
    private void ApplyShadowTransform()
    {
        Vector2 center = GetVisualCenterLocal(sr.sprite);
        // Quand on scale le child par s autour de son origine (= pivot du sprite),
        // un point p passe de p à p*s. Pour que le point "visual center" reste fixe,
        // on translate le child de center * (1 - s).
        Vector2 comp = center * (1f - shadowScale);
        shadowGO.transform.localPosition = new Vector3(offsetX + comp.x, offsetY + comp.y, 0.001f);
        shadowGO.transform.localScale = new Vector3(shadowScale, shadowScale, 1f);
    }

    /// <summary>
    /// Retourne le centre visuel du sprite en unités locales (relatif au pivot).
    /// Utilise le centroïde alpha si la texture est lisible, sinon bounds.center.
    /// </summary>
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
            // Fallback bounds — NE PAS cacher pour pouvoir retenter quand la texture devient lisible.
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

    /// <summary>
    /// Calcule le centroïde pondéré par l'alpha des pixels opaques du sprite,
    /// en unités locales relatives au pivot.
    /// </summary>
    private static bool TryComputeAlphaCentroid(Sprite sprite, out Vector2 localCenter)
    {
        localCenter = Vector2.zero;
        Texture2D tex = sprite.texture;
        if (tex == null) return false;
        if (!tex.isReadable) return false;

        // GetPixels peut lever si la texture n'est pas en Read/Write.
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

            double sumW = 0.0;
            double sumX = 0.0;
            double sumY = 0.0;
            // Sous-échantillonnage pour éviter les surcoûts sur grosses textures.
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

            // Centroïde en pixels locaux au textureRect.
            float cx = (float)(sumX / sumW);
            float cy = (float)(sumY / sumW);

            // Pivot en pixels locaux au textureRect.
            Vector2 pivotPx = sprite.pivot; // depuis bottom-left du rect

            // Conversion en unités locales : (centroïde - pivot) / PPU
            float ppu = sprite.pixelsPerUnit;
            if (ppu <= 0f) ppu = 100f;
            localCenter = new Vector2((cx - pivotPx.x) / ppu, (cy - pivotPx.y) / ppu);
            return true;
        }
        catch (System.Exception)
        {
            // Texture pas en Read/Write ou inaccessible, fallback.
            return false;
        }
    }

    private void Rebuild()
    {
        if (sr == null) return;

        DestroyShadow();

        // Charger le shader SpriteSilhouette (cache statique).
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

        // Material silhouette : remplace tous les pixels opaques par shadowColor.
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

        ApplyShadowTransform();
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

    /// <summary>
    /// Invalide le cache de centroïdes. À appeler si une texture change en cours d'exécution.
    /// </summary>
    public static void ClearCentroidCache()
    {
        centroidCache.Clear();
    }

    private void DestroyShadow()
    {
        if (shadowMat != null)
        {
            if (Application.isPlaying)
                Destroy(shadowMat);
            else
                DestroyImmediate(shadowMat);
            shadowMat = null;
        }
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
