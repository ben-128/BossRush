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

    public abstract string GetCardName(int index);
    public abstract bool HasSprite(int index);
    public abstract void GenerateCard(int index);
    public abstract void LoadFromJson();

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

    protected void SetBaseTexts(string nom, string description)
    {
        if (nomText != null)
            nomText.text = nom;
        if (descriptionText != null)
            descriptionText.text = description ?? "";

        Canvas.ForceUpdateCanvases();
    }

    protected void SetCitation(string citation)
    {
        if (citationText != null)
            citationText.text = !string.IsNullOrEmpty(citation) ? $"<i>{citation}</i>" : "";
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
