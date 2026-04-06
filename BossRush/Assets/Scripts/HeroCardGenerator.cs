using System;
using TMPro;
using UnityEngine;

public class HeroCardGenerator : MonoBehaviour
{
    #region JSON Data Classes
    [Serializable]
    public class MetaData
    {
        public string description;
        public string version;
        public string notes;
    }

    [Serializable]
    public class HeroesFile
    {
        public MetaData meta;
        public HeroJsonData[] heroes;
    }

    [Serializable]
    public class HeroJsonData
    {
        public string id;
        public string nom;
        public int pv;
        public string[] competences;
        public string capacite_speciale;
        public string description;
    }
    #endregion

    #region Visual Data (Inspector)
    [Serializable]
    public class HeroVisualData
    {
        [HideInInspector] public string nom;
        [HideInInspector] public int pv;
        [HideInInspector] public string[] competences;
        [HideInInspector] public string capacite_speciale;
        [HideInInspector] public string description;

        [Header("Visuel")]
        public Sprite sprite;
        public Vector2 offset = Vector2.up * 2;
        public float scale = 0.5f;
    }
    #endregion

    #region Competence Icons
    [Serializable]
    public class CompetenceSprites
    {
        public Sprite armure;
        public Sprite distance;
        public Sprite soin;
        public Sprite magie;
        public Sprite diplomatie;

        public Sprite GetSprite(string competence)
        {
            switch (competence.ToLower())
            {
                case "armure": return armure;
                case "distance": return distance;
                case "soin": return soin;
                case "magie": return magie;
                case "diplomatie": return diplomatie;
                default:
                    Debug.LogWarning($"Compétence inconnue : {competence}");
                    return null;
            }
        }
    }
    #endregion

    [Header("Source")]
    public TextAsset heroesJson;
    public string outputFolder = "Heros";

    [Header("Icônes de compétences")]
    public CompetenceSprites competenceSprites;

    [Header("Visuels de la carte")]
    public TextMeshPro nomText;
    public TextMeshPro pvText;
    public TextMeshPro capaciteText;
    public TextMeshPro descriptionText;
    public SpriteRenderer portraitRenderer;

    [Header("Emplacements des icônes de compétences")]
    public SpriteRenderer[] competenceSlots;

    [Header("Données des héros (charger depuis JSON)")]
    public HeroVisualData[] allHeroes;

    public void LoadFromJson()
    {
        if (heroesJson == null)
        {
            Debug.LogError("Aucun fichier JSON assigné !");
            return;
        }

        var file = JsonUtility.FromJson<HeroesFile>(heroesJson.text);
        if (file == null || file.heroes == null)
        {
            Debug.LogError("Impossible de parser le JSON des héros.");
            return;
        }

        // Préserver les sprites déjà assignés
        var oldSprites = new System.Collections.Generic.Dictionary<string, HeroVisualData>();
        if (allHeroes != null)
        {
            foreach (var h in allHeroes)
            {
                if (!string.IsNullOrEmpty(h.nom))
                    oldSprites[h.nom] = h;
            }
        }

        allHeroes = new HeroVisualData[file.heroes.Length];
        for (int i = 0; i < file.heroes.Length; i++)
        {
            var json = file.heroes[i];
            allHeroes[i] = new HeroVisualData
            {
                nom = json.nom,
                pv = json.pv,
                competences = json.competences,
                capacite_speciale = json.capacite_speciale,
                description = json.description,
            };

            // Récupérer le sprite s'il existait déjà
            if (oldSprites.TryGetValue(json.nom, out var old))
            {
                allHeroes[i].sprite = old.sprite;
                allHeroes[i].offset = old.offset;
                allHeroes[i].scale = old.scale;
            }
        }

        Debug.Log($"{allHeroes.Length} héros chargés. Assignez les sprites dans l'inspecteur.");
    }

    public void GenerateCard(HeroVisualData hero)
    {
        // Nom
        if (nomText != null)
            nomText.text = hero.nom;

        // PV
        if (pvText != null)
            pvText.text = hero.pv.ToString();

        // Capacité spéciale
        if (capaciteText != null)
            capaciteText.text = hero.capacite_speciale;

        // Description
        if (descriptionText != null)
            descriptionText.text = hero.description;

        // Portrait
        if (portraitRenderer != null)
        {
            portraitRenderer.sprite = hero.sprite;
            if (hero.sprite != null)
            {
                portraitRenderer.transform.localPosition = (Vector3)hero.offset + Vector3.forward * 0.01f;
                portraitRenderer.transform.localScale = new Vector3(hero.scale, hero.scale, 1f);
            }
        }

        // Icônes de compétences
        SetCompetenceIcons(hero.competences);

        Canvas.ForceUpdateCanvases();
    }

    private void SetCompetenceIcons(string[] competences)
    {
        if (competenceSlots == null) return;

        for (int i = 0; i < competenceSlots.Length; i++)
        {
            if (competenceSlots[i] != null)
                competenceSlots[i].gameObject.SetActive(false);
        }

        if (competences == null) return;

        for (int i = 0; i < competences.Length && i < competenceSlots.Length; i++)
        {
            var sprite = competenceSprites.GetSprite(competences[i]);
            if (sprite != null && competenceSlots[i] != null)
            {
                competenceSlots[i].gameObject.SetActive(true);
                competenceSlots[i].sprite = sprite;
            }
        }
    }
}
