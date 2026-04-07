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
        public string effet;
    }
    #endregion

    #region Visual Data
    [Serializable]
    public class DestinVisualData
    {
        [HideInInspector] public string id;
        [HideInInspector] public string effet;
    }
    #endregion

    [Header("Données des destins (charger depuis JSON)")]
    public DestinVisualData[] allDestins;

    public override void LoadFromJson()
    {
        if (jsonSource == null) { Debug.LogError("Aucun fichier JSON assigné !"); return; }

        var file = JsonUtility.FromJson<DestinsFile>(jsonSource.text);
        if (file == null || file.destins == null) { Debug.LogError("Impossible de parser le JSON des destins."); return; }

        allDestins = new DestinVisualData[file.destins.Length];
        for (int i = 0; i < file.destins.Length; i++)
        {
            var json = file.destins[i];
            allDestins[i] = new DestinVisualData
            {
                id = json.id,
                effet = json.effet,
            };
        }
        string typeDestin = file.meta?.type ?? "inconnu";
        Debug.Log($"{allDestins.Length} destins ({typeDestin}) chargés.");
    }

    public override string GetCardName(int index) => allDestins[index].id;
    public override bool HasSprite(int index) => true;

    public override void GenerateCard(int index)
    {
        var destin = allDestins[index];

        // Pas de nom, pas de portrait — juste l'effet
        if (nomText != null) nomText.text = "";
        if (descriptionText != null) descriptionText.text = destin.effet;
        if (portraitRenderer != null) portraitRenderer.gameObject.SetActive(false);
    }
}
