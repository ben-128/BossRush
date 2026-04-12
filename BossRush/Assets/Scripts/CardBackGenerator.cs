using System;
using UnityEngine;

public class CardBackGenerator : MonoBehaviour
{
    [Serializable]
    public class CardBackEntry
    {
        public string nom;
        public Sprite sprite;
        public Vector2 offset = Vector2.zero;
        public float scale = 1f;
    }

    [Header("Export")]
    public string outputFolder;

    [Header("Visuels")]
    public SpriteRenderer backgroundRenderer;
    public SpriteRenderer iconRenderer;

    [Header("Dos de cartes")]
    public CardBackEntry[] entries;

    public int Count => entries?.Length ?? 0;

    public string GetCardName(int index) => entries[index].nom;

    public void GenerateCard(int index)
    {
        var entry = entries[index];

        if (iconRenderer != null)
        {
            iconRenderer.sprite = entry.sprite;
            if (entry.sprite != null)
            {
                iconRenderer.transform.localPosition = (Vector3)entry.offset + Vector3.forward * -0.01f;
                iconRenderer.transform.localScale = new Vector3(entry.scale, entry.scale, 1f);
            }
        }
    }
}
