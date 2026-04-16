using System.Collections.Generic;
using TMPro;
using UnityEngine;

public abstract class CardGenerator : MonoBehaviour
{
    [Header("Source")]
    public TextAsset jsonSource;
    public string outputFolder;

    [Header("Visuels de la carte")]
    public TextMeshPro nomText;
    public TextMeshPro descriptionText;
    public TextMeshPro citationText;
    public SpriteRenderer portraitRenderer;

    [Header("Style texte global")]
    [Tooltip("Couleur du texte principal (brun foncé recommandé au lieu de noir pur)")]
    public Color textColor = new Color(0.165f, 0.122f, 0.078f, 1f); // #2A1F14

    [Tooltip("Couleur du texte de citation")]
    public Color citationColor = new Color(0.165f, 0.122f, 0.078f, 1f); // #2A1F14 — même couleur que le texte principal

    [Tooltip("Activer l'ombre portée (underlay TMP)")]
    public bool enableDropShadow = true;

    [Tooltip("Couleur de l'ombre portée")]
    public Color shadowColor = new Color(0.165f, 0.122f, 0.078f, 0.3f);

    [Tooltip("Décalage X de l'ombre")]
    [Range(-1f, 1f)]
    public float shadowOffsetX = 0.3f;

    [Tooltip("Décalage Y de l'ombre")]
    [Range(-1f, 1f)]
    public float shadowOffsetY = -0.3f;

    [Tooltip("Flou de l'ombre (softness)")]
    [Range(0f, 1f)]
    public float shadowSoftness = 0.2f;

    [Header("Outline titre")]
    [Tooltip("Activer un outline sur le titre")]
    public bool titleOutline = true;

    [Tooltip("Couleur de l'outline titre")]
    public Color titleOutlineColor = new Color(0.165f, 0.122f, 0.078f, 0.4f);

    [Tooltip("Épaisseur de l'outline titre")]
    [Range(0f, 1f)]
    public float titleOutlineWidth = 0.15f;

    [Header("Outline description")]
    [Tooltip("Activer un outline sur la description")]
    public bool descriptionOutline = true;

    [Tooltip("Couleur de l'outline description")]
    public Color descriptionOutlineColor = new Color(0.165f, 0.122f, 0.078f, 0.4f);

    [Tooltip("Épaisseur de l'outline description")]
    [Range(0f, 1f)]
    public float descriptionOutlineWidth = 0.15f;

    [Header("Outline sous-titre")]
    [Tooltip("Activer un outline sur le sous-titre (ex: Le Rempart)")]
    public bool subtitleOutline = true;

    [Tooltip("Couleur de l'outline sous-titre")]
    public Color subtitleOutlineColor = new Color(0.165f, 0.122f, 0.078f, 0.4f);

    [Tooltip("Épaisseur de l'outline sous-titre")]
    [Range(0f, 1f)]
    public float subtitleOutlineWidth = 0.15f;

    [Header("Outline citation")]
    [Tooltip("Activer un outline sur la citation")]
    public bool citationOutline = true;

    [Tooltip("Couleur de l'outline citation")]
    public Color citationOutlineColor = new Color(0.165f, 0.122f, 0.078f, 0.4f);

    [Tooltip("Épaisseur de l'outline citation")]
    [Range(0f, 1f)]
    public float citationOutlineWidth = 0.15f;

    [Tooltip("Ombre portée plus forte sur la citation")]
    [Range(0f, 1f)]
    public float citationShadowOpacity = 0.5f;

    [Header("Style PV (chiffre sur fond coloré)")]
    [Tooltip("Font asset pour le chiffre PV (CinzelDecorative-Bold SDF recommandé)")]
    public TMP_FontAsset pvFontAsset;

    [Tooltip("Couleur de l'outline PV (sombre pour détacher du fond rouge)")]
    public Color pvOutlineColor = new Color(0.15f, 0.05f, 0.02f, 0.8f); // brun très foncé

    [Tooltip("Épaisseur de l'outline PV")]
    [Range(0f, 1f)]
    public float pvOutlineWidth = 0.25f;

    [Tooltip("Opacité de l'ombre PV (plus forte car fond texturé)")]
    [Range(0f, 1f)]
    public float pvShadowOpacity = 0.7f;

    // Fond de carte par type de héros — supprimé (avril 2026)
    // Les couleurs par compétence sont maintenant dans CompetenceColors (HeroCardGenerator)
    // et utilisées uniquement pour teinter le disque de fond des icônes.
    protected void SetBackground(string competence) { }

    public abstract string GetCardName(int index);
    public abstract bool HasSprite(int index);
    public abstract void GenerateCard(int index);
    public abstract void LoadFromJson();

    private enum TextRole { Title, Subtitle, Description, Citation }

    protected void ApplyTextStyle(TextMeshPro tmp, bool isCitation = false, bool isSubtitle = false)
    {
        TextRole role;
        if (isCitation) role = TextRole.Citation;
        else if (tmp == nomText) role = TextRole.Title;
        else if (isSubtitle) role = TextRole.Subtitle;
        else role = TextRole.Description;

        ApplyTextStyleForRole(tmp, role);
    }

    private void ApplyTextStyleForRole(TextMeshPro tmp, TextRole role)
    {
        if (tmp == null) return;

        tmp.color = role == TextRole.Citation ? citationColor : textColor;

        var mat = tmp.fontMaterial;

        // Ombre portée (underlay)
        if (enableDropShadow)
        {
            mat.EnableKeyword("UNDERLAY_ON");
            var uc = shadowColor;
            uc.a = citationShadowOpacity;
            mat.SetColor("_UnderlayColor", uc);
            mat.SetFloat("_UnderlayOffsetX", shadowOffsetX);
            mat.SetFloat("_UnderlayOffsetY", shadowOffsetY);
            mat.SetFloat("_UnderlaySoftness", shadowSoftness);
        }
        else
        {
            mat.DisableKeyword("UNDERLAY_ON");
        }

        // Outline par rôle
        bool outlineOn;
        Color outlineCol;
        float outlineW;

        switch (role)
        {
            case TextRole.Title:
                outlineOn = titleOutline;
                outlineCol = titleOutlineColor;
                outlineW = titleOutlineWidth;
                break;
            case TextRole.Subtitle:
                outlineOn = subtitleOutline;
                outlineCol = subtitleOutlineColor;
                outlineW = subtitleOutlineWidth;
                break;
            case TextRole.Citation:
                outlineOn = citationOutline;
                outlineCol = citationOutlineColor;
                outlineW = citationOutlineWidth;
                break;
            default: // Description
                outlineOn = descriptionOutline;
                outlineCol = descriptionOutlineColor;
                outlineW = descriptionOutlineWidth;
                break;
        }

        if (outlineOn)
        {
            mat.EnableKeyword("OUTLINE_ON");
            mat.SetColor("_OutlineColor", outlineCol);
            mat.SetFloat("_OutlineWidth", outlineW);
        }
        else
        {
            mat.DisableKeyword("OUTLINE_ON");
            mat.SetFloat("_OutlineWidth", 0f);
        }
    }

    protected void ApplyPvStyle(TextMeshPro pvTmp)
    {
        if (pvTmp == null) return;

        // Font bold
        if (pvFontAsset != null)
            pvTmp.font = pvFontAsset;

        // Couleur blanche sur fond rouge
        pvTmp.color = Color.white;

        var mat = pvTmp.fontMaterial;

        // Outline sombre épaisse
        mat.EnableKeyword("OUTLINE_ON");
        mat.SetColor("_OutlineColor", pvOutlineColor);
        mat.SetFloat("_OutlineWidth", pvOutlineWidth);

        // Ombre portée forte
        mat.EnableKeyword("UNDERLAY_ON");
        mat.SetColor("_UnderlayColor", new Color(0f, 0f, 0f, pvShadowOpacity));
        mat.SetFloat("_UnderlayOffsetX", 0.4f);
        mat.SetFloat("_UnderlayOffsetY", -0.4f);
        mat.SetFloat("_UnderlaySoftness", 0.15f);
    }

    protected void ApplyTextStyleAll()
    {
        ApplyTextStyle(nomText);
        ApplyTextStyle(descriptionText);
        ApplyTextStyle(citationText, isCitation: true);
    }

    protected void SetPortrait(Sprite sprite, Vector2 offset, float scale)
    {
        if (portraitRenderer == null) return;

        portraitRenderer.sprite = sprite;
        if (sprite != null)
        {
            portraitRenderer.transform.localPosition = (Vector3)offset + Vector3.forward * 0.01f;
            portraitRenderer.transform.localScale = new Vector3(scale, scale, 1f);
        }
    }

    /// <summary>
    /// Assigne le TMP_SpriteAsset par defaut sur un composant TMP
    /// pour que les balises <sprite name="xxx"> fonctionnent.
    /// </summary>
    protected static void EnsureSpriteAsset(TextMeshPro tmp)
    {
        if (tmp == null || tmp.spriteAsset != null) return;
        var defaultAsset = TMP_Settings.defaultSpriteAsset;
        if (defaultAsset != null)
            tmp.spriteAsset = defaultAsset;
    }

    protected void SetBaseTexts(string nom, string description)
    {
        if (nomText != null)
            nomText.text = nom;
        if (descriptionText != null)
        {
            EnsureSpriteAsset(descriptionText);
            descriptionText.text = IconTagParser.Parse(description);
        }

        ApplyTextStyle(nomText);
        ApplyTextStyle(descriptionText);

        Canvas.ForceUpdateCanvases();
    }

    protected void SetCitation(string citation)
    {
        if (citationText != null)
            citationText.text = !string.IsNullOrEmpty(citation) ? $"<i>{citation}</i>" : "";

        ApplyTextStyle(citationText, isCitation: true);
    }

    protected static void SetDamageIcons(SpriteRenderer[] slots, int count, float spacing)
    {
        if (slots == null) return;

        float totalWidth = (count - 1) * spacing;
        float startX = -totalWidth / 2f;

        for (int i = 0; i < slots.Length; i++)
        {
            if (slots[i] == null) continue;

            bool active = i < count;
            slots[i].gameObject.SetActive(active);
            if (active)
            {
                var t = slots[i].transform;
                t.localPosition = new Vector3(startX + i * spacing, t.localPosition.y, t.localPosition.z);
            }
        }
    }

    protected static void PreserveSprites<T>(T[] oldArray, T[] newArray) where T : CardVisualData
    {
        if (oldArray == null) return;

        var lookup = new Dictionary<string, T>();
        foreach (var item in oldArray)
        {
            if (!string.IsNullOrEmpty(item.nom))
                lookup[item.nom] = item;
        }

        foreach (var item in newArray)
        {
            if (lookup.TryGetValue(item.nom, out var old))
            {
                item.sprite = old.sprite;
                item.offset = old.offset;
                item.scale = old.scale;
            }
        }
    }
}
