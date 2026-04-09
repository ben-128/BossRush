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

    [Header("Gemmes de classe (bordure centrale)")]
    public SpriteRenderer[] gemsRenderers;
    public GemSprites gemSprites;

    [System.Serializable]
    public class GemSprites
    {
        public Sprite armure;      // Guerrier - rouge
        public Sprite distance;    // Rodeur - vert
        public Sprite soin;        // Soigneur - or
        public Sprite magie;       // Mage - bleu
        public Sprite diplomatie;  // Diplomate - marron

        [Header("Couleurs par type")]
        public Color couleurArmure = Color.red;
        public Color couleurDistance = Color.green;
        public Color couleurSoin = new Color(1f, 0.84f, 0f);     // or
        public Color couleurMagie = Color.blue;
        public Color couleurDiplomatie = new Color(0.6f, 0.4f, 0.2f); // marron

        public Sprite GetSprite(string competence)
        {
            if (string.IsNullOrEmpty(competence)) return null;
            switch (competence.ToLower())
            {
                case "armure": return armure;
                case "distance": return distance;
                case "soin": return soin;
                case "magie": return magie;
                case "élémentaire": return magie;
                case "diplomatie": return diplomatie;
                default: return null;
            }
        }

        public Color GetColor(string competence)
        {
            if (string.IsNullOrEmpty(competence)) return Color.white;
            switch (competence.ToLower())
            {
                case "armure": return couleurArmure;
                case "distance": return couleurDistance;
                case "soin": return couleurSoin;
                case "magie": return couleurMagie;
                case "élémentaire": return couleurMagie;
                case "diplomatie": return couleurDiplomatie;
                default: return Color.white;
            }
        }
    }

    protected void SetGems(string competence)
    {
        if (gemsRenderers == null || gemSprites == null) return;

        var sprite = gemSprites.GetSprite(competence);
        var color = gemSprites.GetColor(competence);

        for (int i = 0; i < gemsRenderers.Length; i++)
        {
            if (gemsRenderers[i] == null) continue;

            if (sprite != null)
            {
                gemsRenderers[i].gameObject.SetActive(true);
                gemsRenderers[i].sprite = sprite;
                gemsRenderers[i].color = color;
            }
            else
            {
                gemsRenderers[i].gameObject.SetActive(false);
            }
        }
    }

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
