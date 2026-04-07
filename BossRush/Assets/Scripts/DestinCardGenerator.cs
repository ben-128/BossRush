using System;
using UnityEngine;

public class DestinCardGenerator : CardGenerator
{
    #region JSON Data Classes
    [Serializable]
    public class DestinsFile
    {
        public MetaData meta;
        public DestinJsonData[] destins;
    }

    [Serializable]
    public class MetaData
    {
        public string description;
        public string type;
    }

    [Serializable]
    public class DestinJsonData
    {
        public string id;
        public string nom;
        public string effet;
    }
    #endregion

    #region Visual Data
    [Serializable]
    public class DestinVisualData : CardVisualData
    {
        [HideInInspector] public string effet;
    }
    #endregion

    [Header("Visuels spécifiques destin")]
    public TMPro.TextMeshPro effetText;

    [Header("Données des destins (charger depuis JSON)")]
    public DestinVisualData[] allDestins;

    public override void LoadFromJson()
    {
        if (jsonSource == null) { Debug.LogError("Aucun fichier JSON assigné !"); return; }

        var file = JsonUtility.FromJson<DestinsFile>(jsonSource.text);
        if (file == null || file.destins == null) { Debug.LogError("Impossible de parser le JSON des destins."); return; }

        var old = allDestins;
        allDestins = new DestinVisualData[file.destins.Length];
        for (int i = 0; i < file.destins.Length; i++)
        {
            var json = file.destins[i];
            allDestins[i] = new DestinVisualData
            {
                nom = json.nom,
                effet = json.effet,
            };
        }
        PreserveSprites(old, allDestins);
        string typeDestin = file.meta?.type ?? "inconnu";
        Debug.Log($"{allDestins.Length} destins ({typeDestin}) chargés.");
    }

    public override string GetCardName(int index) => allDestins[index].nom;
    public override bool HasSprite(int index) => allDestins[index].sprite != null;

    public override void GenerateCard(int index)
    {
        var destin = allDestins[index];
        SetBaseTexts(destin.nom, 0, null, destin.effet);
        SetPortrait(destin.sprite, destin.offset, destin.scale);

        if (effetText != null) effetText.text = destin.effet;

        // PV pas pertinent
        if (pvText != null) pvText.text = "";
    }
}
