using System;
using UnityEngine;

public class HeroCardGenerator : CardGenerator
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

    #region Visual Data
    [Serializable]
    public class HeroVisualData : CardVisualData
    {
        [HideInInspector] public int pv;
        [HideInInspector] public string[] competences;
        [HideInInspector] public string capacite_speciale;
        [HideInInspector] public string description;
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

    [Header("Icônes de compétences")]
    public CompetenceSprites competenceSprites;

    [Header("Emplacements des icônes de compétences")]
    public SpriteRenderer[] competenceSlots;

    [Header("Données des héros (charger depuis JSON)")]
    public HeroVisualData[] allHeroes;

    public override void LoadFromJson()
    {
        if (jsonSource == null)
        {
            Debug.LogError("Aucun fichier JSON assigné !");
            return;
        }

        var file = JsonUtility.FromJson<HeroesFile>(jsonSource.text);
        if (file == null || file.heroes == null)
        {
            Debug.LogError("Impossible de parser le JSON des héros.");
            return;
        }

        var oldHeroes = allHeroes;
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
        }

        PreserveSprites(oldHeroes, allHeroes);
        Debug.Log($"{allHeroes.Length} héros chargés. Assignez les sprites dans l'inspecteur.");
    }

    public override string GetCardName(int index) => allHeroes[index].nom;
    public override bool HasSprite(int index) => allHeroes[index].sprite != null;

    public override void GenerateCard(int index)
    {
        var hero = allHeroes[index];

        SetBaseTexts(hero.nom, hero.pv, hero.capacite_speciale, hero.description);
        SetPortrait(hero.sprite, hero.offset, hero.scale);
        SetCompetenceIcons(hero.competences);
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
