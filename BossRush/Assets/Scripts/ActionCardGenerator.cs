using System;
using UnityEngine;

public class ActionCardGenerator : CardGenerator
{
    #region JSON Data Classes
    [Serializable]
    public class ActionsFile
    {
        public MetaData meta;
        public ActionJsonData[] cartes_action;
    }

    [Serializable]
    public class MetaData
    {
        public string description;
        public string version;
        public string notes;
    }

    [Serializable]
    public class ActionJsonData
    {
        public string id;
        public string nom;
        public string type;
        public string portee;
        public int degats;
        public string prerequis;
        public string effet;
        public string description;
    }
    #endregion

    #region Visual Data
    [Serializable]
    public class ActionVisualData : CardVisualData
    {
        [HideInInspector] public string type;
        [HideInInspector] public string portee;
        [HideInInspector] public int degats;
        [HideInInspector] public string prerequis;
        [HideInInspector] public string effet;
        [HideInInspector] public string description;
    }
    #endregion

    [Header("Visuels spécifiques action")]
    public SpriteRenderer[] degatsSlots;
    public float degatsSpacing = 0.5f;
    public TMPro.TextMeshPro porteeText;
    public TMPro.TextMeshPro prerequisText;
    public TMPro.TextMeshPro typeText;

    [Header("Données des actions (charger depuis JSON)")]
    public ActionVisualData[] allActions;

    public override void LoadFromJson()
    {
        if (jsonSource == null) { Debug.LogError("Aucun fichier JSON assigné !"); return; }

        var file = JsonUtility.FromJson<ActionsFile>(jsonSource.text);
        if (file == null || file.cartes_action == null) { Debug.LogError("Impossible de parser le JSON des actions."); return; }

        var old = allActions;
        allActions = new ActionVisualData[file.cartes_action.Length];
        for (int i = 0; i < file.cartes_action.Length; i++)
        {
            var json = file.cartes_action[i];
            allActions[i] = new ActionVisualData
            {
                nom = json.nom,
                type = json.type,
                portee = json.portee,
                degats = json.degats,
                prerequis = json.prerequis,
                effet = json.effet,
                description = json.description,
            };
        }
        PreserveSprites(old, allActions);
        Debug.Log($"{allActions.Length} cartes Action chargées.");
    }

    public override string GetCardName(int index) => allActions[index].nom;
    public override bool HasSprite(int index) => allActions[index].sprite != null;

    public override void GenerateCard(int index)
    {
        var action = allActions[index];

        string mainDesc = action.type == "effet" && !string.IsNullOrEmpty(action.effet)
            ? action.effet
            : action.description;

        SetBaseTexts(action.nom, mainDesc);
        SetPortrait(action.sprite, action.offset, action.scale);

        // Icônes de dégâts pour les attaques
        if (action.type == "attaque")
            SetDamageIcons(degatsSlots, action.degats, degatsSpacing);
        else
            SetDamageIcons(degatsSlots, 0, degatsSpacing);

        if (porteeText != null)
            porteeText.text = action.portee ?? "";

        if (prerequisText != null)
            prerequisText.text = action.prerequis ?? "";

        if (typeText != null)
            typeText.text = action.type;
    }
}
