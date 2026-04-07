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
        public string description;
    }
    #endregion

    #region Visual Data
    [Serializable]
    public class EpreuveVisualData : CardVisualData
    {
        [HideInInspector] public string description;
    }
    #endregion

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
        SetBaseTexts(epreuve.nom, 0, null, epreuve.description);
        SetPortrait(epreuve.sprite, epreuve.offset, epreuve.scale);

        // PV non pertinent pour les épreuves
        if (pvText != null) pvText.text = "";
    }
}
