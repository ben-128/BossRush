using System;
using UnityEngine;

public class ObjetCardGenerator : CardGenerator
{
    #region JSON Data Classes
    [Serializable]
    public class ObjetsFile
    {
        public MetaData meta;
        public ObjetJsonData[] cartes_objet;
    }

    [Serializable]
    public class MetaData
    {
        public string description;
        public string version;
        public string notes;
    }

    [Serializable]
    public class ObjetJsonData
    {
        public string id;
        public string nom;
        public string type;
        public string prerequis;
        public int bonus_degats;
        public string effet;
        public string description;
    }
    #endregion

    #region Visual Data
    [Serializable]
    public class ObjetVisualData : CardVisualData
    {
        [HideInInspector] public string type;
        [HideInInspector] public string prerequis;
        [HideInInspector] public int bonus_degats;
        [HideInInspector] public string effet;
        [HideInInspector] public string description;
    }
    #endregion

    [Header("Visuels spécifiques objet")]
    public TMPro.TextMeshPro typeText;
    public TMPro.TextMeshPro prerequisText;
    public TMPro.TextMeshPro effetText;
    public TMPro.TextMeshPro bonusDegatsText;

    [Header("Données des objets (charger depuis JSON)")]
    public ObjetVisualData[] allObjets;

    public override void LoadFromJson()
    {
        if (jsonSource == null) { Debug.LogError("Aucun fichier JSON assigné !"); return; }

        var file = JsonUtility.FromJson<ObjetsFile>(jsonSource.text);
        if (file == null || file.cartes_objet == null) { Debug.LogError("Impossible de parser le JSON des objets."); return; }

        var old = allObjets;
        allObjets = new ObjetVisualData[file.cartes_objet.Length];
        for (int i = 0; i < file.cartes_objet.Length; i++)
        {
            var json = file.cartes_objet[i];
            allObjets[i] = new ObjetVisualData
            {
                nom = json.nom,
                type = json.type,
                prerequis = json.prerequis,
                bonus_degats = json.bonus_degats,
                effet = json.effet,
                description = json.description,
            };
        }
        PreserveSprites(old, allObjets);
        Debug.Log($"{allObjets.Length} cartes Objet chargées.");
    }

    public override string GetCardName(int index) => allObjets[index].nom;
    public override bool HasSprite(int index) => allObjets[index].sprite != null;

    public override void GenerateCard(int index)
    {
        var objet = allObjets[index];
        SetBaseTexts(objet.nom, objet.effet);
        SetPortrait(objet.sprite, objet.offset, objet.scale);
        SetBackground(objet.prerequis);

        if (typeText != null) typeText.text = objet.type;
        if (prerequisText != null) prerequisText.text = objet.prerequis ?? "";
        if (effetText != null) effetText.text = objet.effet ?? "";

        if (bonusDegatsText != null)
        {
            bonusDegatsText.gameObject.SetActive(objet.bonus_degats > 0);
            bonusDegatsText.text = objet.bonus_degats > 0 ? $"+{objet.bonus_degats}" : "";
        }

        ApplyTextStyle(typeText);
        ApplyTextStyle(prerequisText);
        ApplyTextStyle(effetText);
        ApplyTextStyle(bonusDegatsText);
    }
}
