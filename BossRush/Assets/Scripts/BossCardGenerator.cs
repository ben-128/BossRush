using System;
using TMPro;
using UnityEngine;

public class BossCardGenerator : CardGenerator
{
    #region JSON Data Classes
    [Serializable]
    public class BossFile
    {
        public MetaData meta;
        public BossJsonData[] boss;
    }

    [Serializable]
    public class MetaData
    {
        public string description;
        public string version;
        public string notes;
    }

    [Serializable]
    public class BossJsonData
    {
        public string id;
        public string nom;
        public string difficulte;
        public string pv_formule;
        public string effet_special;
        public string[] monstres_ids;
        public string description;
    }
    #endregion

    #region Visual Data
    [Serializable]
    public class BossVisualData : CardVisualData
    {
        [HideInInspector] public string difficulte;
        [HideInInspector] public string pv_formule;
        [HideInInspector] public string effet_special;
        [HideInInspector] public string description;
    }
    #endregion

    [Header("Visuels spécifiques boss")]
    public TextMeshPro difficulteText;
    public TextMeshPro pvFormuleText;
    public TextMeshPro effetSpecialText;

    [Header("Données des boss (charger depuis JSON)")]
    public BossVisualData[] allBoss;

    public override void LoadFromJson()
    {
        if (jsonSource == null) { Debug.LogError("Aucun fichier JSON assigné !"); return; }

        var file = JsonUtility.FromJson<BossFile>(jsonSource.text);
        if (file == null || file.boss == null) { Debug.LogError("Impossible de parser le JSON des boss."); return; }

        var old = allBoss;
        allBoss = new BossVisualData[file.boss.Length];
        for (int i = 0; i < file.boss.Length; i++)
        {
            var json = file.boss[i];
            allBoss[i] = new BossVisualData
            {
                nom = json.nom,
                difficulte = json.difficulte,
                pv_formule = json.pv_formule,
                effet_special = json.effet_special,
                description = json.description,
            };
        }
        PreserveSprites(old, allBoss);
        Debug.Log($"{allBoss.Length} boss chargés.");
    }

    public override string GetCardName(int index) => allBoss[index].nom;
    public override bool HasSprite(int index) => allBoss[index].sprite != null;

    public override void GenerateCard(int index)
    {
        var boss = allBoss[index];
        SetBaseTexts(boss.nom, boss.description);
        SetPortrait(boss.sprite, boss.offset, boss.scale);

        if (difficulteText != null) difficulteText.text = boss.difficulte;
        if (pvFormuleText != null) pvFormuleText.text = boss.pv_formule;
        if (effetSpecialText != null) effetSpecialText.text = boss.effet_special;

        ApplyTextStyle(difficulteText);
        ApplyTextStyle(pvFormuleText);
        ApplyTextStyle(effetSpecialText);
    }
}
