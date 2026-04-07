using System;
using UnityEngine;

public class EpreuveCardGenerator : CardGenerator
{
    #region JSON Data Classes
    [Serializable]
    public class EpreuvesFile
    {
        public string boss_id;
        public string boss_nom;
        public EpreuveJsonData[] epreuves;
    }

    [Serializable]
    public class EpreuveJsonData
    {
        public string id;
        public string nom;
        public int degats;
        public string type_degats;
        public string description;
    }
    #endregion

    #region Visual Data
    [Serializable]
    public class EpreuveVisualData : CardVisualData
    {
        [HideInInspector] public int degats;
        [HideInInspector] public string type_degats;
        [HideInInspector] public string description;
    }
    #endregion

    [Header("Dégâts")]
    public SpriteRenderer[] degatsSlots;
    public float degatsSpacing = 0.5f;
    public SpriteRenderer typeDegatsIcon;
    public Sprite physiqueSprite;
    public Sprite magiqueSprite;

    [Header("Données des épreuves (charger depuis JSON)")]
    public EpreuveVisualData[] allEpreuves;

    public override void LoadFromJson()
    {
        if (jsonSource == null) { Debug.LogError("Aucun fichier JSON assigné !"); return; }

        var file = JsonUtility.FromJson<EpreuvesFile>(jsonSource.text);
        if (file == null || file.epreuves == null) { Debug.LogError("Impossible de parser le JSON des épreuves."); return; }

        var old = allEpreuves;
        allEpreuves = new EpreuveVisualData[file.epreuves.Length];
        for (int i = 0; i < file.epreuves.Length; i++)
        {
            var json = file.epreuves[i];
            allEpreuves[i] = new EpreuveVisualData
            {
                nom = json.nom,
                degats = json.degats,
                type_degats = json.type_degats,
                description = json.description,
            };
        }
        PreserveSprites(old, allEpreuves);
        Debug.Log($"{allEpreuves.Length} épreuves chargées depuis '{file.boss_nom}'.");
    }

    public override string GetCardName(int index) => allEpreuves[index].nom;
    public override bool HasSprite(int index) => allEpreuves[index].sprite != null;

    public override void GenerateCard(int index)
    {
        var epreuve = allEpreuves[index];
        SetBaseTexts(epreuve.nom, epreuve.description);
        SetPortrait(epreuve.sprite, epreuve.offset, epreuve.scale);

        // Icônes de dégâts (optionnel)
        SetDamageIcons(degatsSlots, epreuve.degats, degatsSpacing);

        // Icône type de dégâts
        if (typeDegatsIcon != null)
        {
            Sprite icon = epreuve.type_degats == "physique" ? physiqueSprite
                        : epreuve.type_degats == "magique" ? magiqueSprite : null;
            if (icon != null && epreuve.degats > 0)
            {
                typeDegatsIcon.gameObject.SetActive(true);
                typeDegatsIcon.sprite = icon;
            }
            else
            {
                typeDegatsIcon.gameObject.SetActive(false);
            }
        }
    }
}
