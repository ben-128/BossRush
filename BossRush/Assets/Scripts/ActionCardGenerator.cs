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
    }
    #endregion

    #region Prerequis Icons
    [Serializable]
    public class PrerequisSprites
    {
        public Sprite armure;
        public Sprite distance;
        public Sprite soin;
        public Sprite magie;
        public Sprite diplomatie;
        public Sprite elementaire;

        public Sprite GetSprite(string prerequis)
        {
            if (string.IsNullOrEmpty(prerequis)) return null;
            switch (prerequis.ToLower())
            {
                case "armure": return armure;
                case "distance": return distance;
                case "soin": return soin;
                case "magie": return magie;
                case "diplomatie": return diplomatie;
                case "élémentaire": return elementaire;
                default:
                    Debug.LogWarning($"Prérequis inconnu : {prerequis}");
                    return null;
            }
        }
    }
    #endregion

    [Header("Dégâts")]
    public SpriteRenderer[] degatsSlots;
    public float degatsSpacing = 0.5f;

    [Header("Portée")]
    public SpriteRenderer porteeDistanceIcon;

    [Header("Prérequis")]
    public PrerequisSprites prerequisSprites;
    public SpriteRenderer prerequisIcon;

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

        SetBaseTexts(action.nom, action.effet ?? "");
        SetPortrait(action.sprite, action.offset, action.scale);
        SetBackground(action.prerequis);

        // Icônes de dégâts pour les attaques
        if (action.type == "attaque")
            SetDamageIcons(degatsSlots, action.degats, degatsSpacing);
        else
            SetDamageIcons(degatsSlots, 0, degatsSpacing);

        // Icône portée distance
        if (porteeDistanceIcon != null)
            porteeDistanceIcon.gameObject.SetActive(action.portee == "distance");

        // Icône prérequis
        if (prerequisIcon != null)
        {
            var sprite = prerequisSprites.GetSprite(action.prerequis);
            if (sprite != null)
            {
                prerequisIcon.gameObject.SetActive(true);
                prerequisIcon.sprite = sprite;
            }
            else
            {
                prerequisIcon.gameObject.SetActive(false);
            }
        }

        // Gemmes de classe sur la bordure centrale
        SetGems(action.prerequis);
    }
}
