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
        public string proto_illu_desc;
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

    [Header("Dégâts")]
    public SpriteRenderer[] degatsSlots;
    public float degatsSpacing = 0.5f;

    [Header("Portée")]
    public SpriteRenderer porteeDistanceIcon;

    [Header("Prérequis")]
    [Tooltip("Palette partagée (SO) — lookup par nom de héros (Nawel, Daraa, …) pour récupérer icône + couleur du prérequis.")]
    public CompetenceColorPalette competencePalette;
    public SpriteRenderer prerequisIcon;

    [Tooltip("Shadow drop du prérequis, teinté avec la couleur de compétence du héros.")]
    public SpriteDropShadow prerequisShadow;

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
                proto_illu_desc = json.proto_illu_desc,
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
        SetProtoIlluDesc(action.proto_illu_desc);

        // Icônes de dégâts pour les attaques
        if (action.type == "attaque")
            SetDamageIcons(degatsSlots, action.degats, degatsSpacing);
        else
            SetDamageIcons(degatsSlots, 0, degatsSpacing);

        // Icône portée distance
        if (porteeDistanceIcon != null)
            porteeDistanceIcon.gameObject.SetActive(action.portee == "distance");

        // Icône prérequis — lookup par nom de héros dans la palette partagée
        if (prerequisIcon != null)
        {
            var entry = competencePalette != null ? competencePalette.GetByCompetence(action.prerequis) : null;
            // Fallback : lookup par hero name si prerequis est "Nawel" plutôt que "armure"
            if (entry == null && competencePalette != null)
            {
                foreach (var h in competencePalette.heroes ?? System.Array.Empty<CompetenceColorPalette.HeroColor>())
                {
                    if (string.Equals(h.heroName, action.prerequis, System.StringComparison.OrdinalIgnoreCase))
                    { entry = h; break; }
                }
            }

            if (entry != null && entry.icon != null)
            {
                prerequisIcon.gameObject.SetActive(true);
                prerequisIcon.sprite = entry.icon;

                if (prerequisShadow != null)
                {
                    var tint = entry.color;
                    tint.a = prerequisShadow.shadowColor.a;
                    prerequisShadow.shadowColor = tint;
                    prerequisShadow.ForceUpdate();
                }
            }
            else
            {
                prerequisIcon.gameObject.SetActive(false);
            }
        }
    }
}
