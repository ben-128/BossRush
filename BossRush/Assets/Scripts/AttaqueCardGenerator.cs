using System;
using UnityEngine;

public class AttaqueCardGenerator : CardGenerator
{
    #region JSON Data Classes
    [Serializable]
    public class AttaquesFile
    {
        public string boss_id;
        public string boss_nom;
        public AttaqueJsonData[] attaques;
    }

    [Serializable]
    public class AttaqueJsonData
    {
        public string id;
        public string nom;
        public string type;
        public string type_degats;
        public int degats;
        public int nb_monstres;
        public int soin;
        public string description;
        public int quantite;
    }
    #endregion

    #region Visual Data
    [Serializable]
    public class AttaqueVisualData : CardVisualData
    {
        [HideInInspector] public string type;
        [HideInInspector] public string type_degats;
        [HideInInspector] public int degats;
        [HideInInspector] public int nb_monstres;
        [HideInInspector] public int soin;
        [HideInInspector] public string description;
        [HideInInspector] public int quantite;
    }
    #endregion

    [Header("Visuels spécifiques attaque")]
    public SpriteRenderer[] degatsSlots;
    public float degatsSpacing = 0.5f;
    public TMPro.TextMeshPro typeAttaqueText;
    public TMPro.TextMeshPro valeurSpecialeText;
    public SpriteRenderer typeDegatsIcon;

    [Header("Icônes de type de dégâts")]
    public Sprite physiqueSprite;
    public Sprite magiqueSprite;

    [Header("Données des attaques (charger depuis JSON)")]
    public AttaqueVisualData[] allAttaques;

    public override void LoadFromJson()
    {
        if (jsonSource == null) { Debug.LogError("Aucun fichier JSON assigné !"); return; }

        var file = JsonUtility.FromJson<AttaquesFile>(jsonSource.text);
        if (file == null || file.attaques == null) { Debug.LogError("Impossible de parser le JSON des attaques."); return; }

        var old = allAttaques;
        allAttaques = new AttaqueVisualData[file.attaques.Length];
        for (int i = 0; i < file.attaques.Length; i++)
        {
            var json = file.attaques[i];
            allAttaques[i] = new AttaqueVisualData
            {
                nom = json.nom,
                type = json.type,
                type_degats = json.type_degats,
                degats = json.degats,
                nb_monstres = json.nb_monstres,
                soin = json.soin,
                description = json.description,
                quantite = json.quantite,
            };
        }
        PreserveSprites(old, allAttaques);
        Debug.Log($"{allAttaques.Length} attaques chargées depuis '{file.boss_nom}'.");
    }

    public override string GetCardName(int index) => allAttaques[index].nom;
    public override bool HasSprite(int index) => allAttaques[index].sprite != null;

    public override void GenerateCard(int index)
    {
        var atk = allAttaques[index];
        SetBaseTexts(atk.nom, atk.degats, null, atk.description);
        SetPortrait(atk.sprite, atk.offset, atk.scale);

        // Icônes de dégâts pour les attaques de type "degats"
        Sprite dmgIcon = atk.type_degats == "physique" ? physiqueSprite
                       : atk.type_degats == "magique" ? magiqueSprite : null;

        if (atk.type == "degats")
        {
            SetDamageIcons(degatsSlots, atk.degats, degatsSpacing);
        }
        else
        {
            SetDamageIcons(degatsSlots, 0, degatsSpacing);
        }

        // Texte pour les types non-dégâts (soin, invocation)
        if (valeurSpecialeText != null)
        {
            if (atk.type == "soin") { valeurSpecialeText.gameObject.SetActive(true); valeurSpecialeText.text = "+" + atk.soin; }
            else if (atk.type == "invocation") { valeurSpecialeText.gameObject.SetActive(true); valeurSpecialeText.text = atk.nb_monstres.ToString(); }
            else valeurSpecialeText.gameObject.SetActive(false);
        }

        if (typeAttaqueText != null) typeAttaqueText.text = atk.type;

        if (typeDegatsIcon != null)
        {
            if (dmgIcon != null) { typeDegatsIcon.sprite = dmgIcon; typeDegatsIcon.gameObject.SetActive(true); }
            else typeDegatsIcon.gameObject.SetActive(false);
        }
    }
}
