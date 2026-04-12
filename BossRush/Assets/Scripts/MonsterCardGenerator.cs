using System;
using UnityEngine;

public class MonsterCardGenerator : CardGenerator
{
    #region JSON Data Classes
    [Serializable]
    public class MonstresFile
    {
        public MetaData meta;
        public MonsterJsonData[] monstres;
    }

    [Serializable]
    public class MetaData
    {
        public string description;
        public string version;
        public string notes;
    }

    [Serializable]
    public class MonsterJsonData
    {
        public string id;
        public string nom;
        public int pv;
        public int degats;
        public string type_degats;
        public string capacite_speciale;
        public string description;
        public string citation;
        public int quantite;
    }
    #endregion

    #region Visual Data
    [Serializable]
    public class MonsterVisualData : CardVisualData
    {
        [HideInInspector] public string id;
        [HideInInspector] public int pv;
        [HideInInspector] public int degats;
        [HideInInspector] public string type_degats;
        [HideInInspector] public string capacite_speciale;
        [HideInInspector] public string description;
        [HideInInspector] public string citation;
        [HideInInspector] public int quantite;
    }
    #endregion

    #region Type Degats Icons
    [Serializable]
    public class TypeDegatsSprites
    {
        public Sprite physique;
        public Sprite magique;

        public Sprite GetSprite(string typeDegats)
        {
            switch (typeDegats?.ToLower())
            {
                case "physique": return physique;
                case "magique": return magique;
                default:
                    Debug.LogWarning($"Type de dégâts inconnu : {typeDegats}");
                    return null;
            }
        }
    }
    #endregion

    [Header("Textes spécifiques monstre")]
    public TMPro.TextMeshPro pvText;

    [Header("Icônes de type de dégâts")]
    public TypeDegatsSprites typeDegatsSprites;

    [Header("Dégâts")]
    public SpriteRenderer[] degatsSlots;
    public float degatsSpacing = 0.5f;
    public SpriteRenderer typeDegatsIcon;

    [Header("Données des monstres (charger depuis JSON)")]
    public MonsterVisualData[] allMonsters;

    public override void LoadFromJson()
    {
        if (jsonSource == null)
        {
            Debug.LogError("Aucun fichier JSON assigné !");
            return;
        }

        var file = JsonUtility.FromJson<MonstresFile>(jsonSource.text);
        if (file == null || file.monstres == null)
        {
            Debug.LogError("Impossible de parser le JSON des monstres.");
            return;
        }

        var oldMonsters = allMonsters;
        allMonsters = new MonsterVisualData[file.monstres.Length];
        for (int i = 0; i < file.monstres.Length; i++)
        {
            var json = file.monstres[i];
            allMonsters[i] = new MonsterVisualData
            {
                id = json.id,
                nom = json.nom,
                pv = json.pv,
                degats = json.degats,
                type_degats = json.type_degats,
                capacite_speciale = json.capacite_speciale,
                description = json.description,
                citation = json.citation,
                quantite = json.quantite,
            };
        }

        PreserveSprites(oldMonsters, allMonsters);
        Debug.Log($"{allMonsters.Length} monstres chargés. Assignez les sprites dans l'inspecteur.");
    }

    public override string GetCardName(int index) => allMonsters[index].nom;
    public override bool HasSprite(int index) => allMonsters[index].sprite != null;

    public override void GenerateCard(int index)
    {
        var monster = allMonsters[index];

        bool hasCapacite = !string.IsNullOrEmpty(monster.capacite_speciale);
        string texte = hasCapacite ? monster.capacite_speciale : $"<i>{monster.description}</i>";

        SetBaseTexts(monster.nom, texte);
        if (pvText != null) pvText.text = monster.pv.ToString();
        SetPortrait(monster.sprite, monster.offset, monster.scale);
        SetCitation(monster.citation);

        // Icônes de dégâts
        var dmgSprite = typeDegatsSprites.GetSprite(monster.type_degats);
        SetDamageIcons(degatsSlots, monster.degats, degatsSpacing);

        // Icône type de dégâts (grande)
        if (typeDegatsIcon != null)
        {
            if (dmgSprite != null)
            {
                typeDegatsIcon.gameObject.SetActive(true);
                typeDegatsIcon.sprite = dmgSprite;
            }
            else
            {
                typeDegatsIcon.gameObject.SetActive(false);
            }
        }

        ApplyPvStyle(pvText);
    }
}
