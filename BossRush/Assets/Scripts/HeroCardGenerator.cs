using System;
using UnityEngine;

public class HeroCardGenerator : CardGenerator
{
    #region JSON Data Classes
    [Serializable]
    public class MetaData
    {
        public string description;
        public string version;
        public string notes;
    }

    [Serializable]
    public class HeroesFile
    {
        public MetaData meta;
        public HeroJsonData[] heroes;
    }

    [Serializable]
    public class HeroJsonData
    {
        public string id;
        public string nom;
        public string titre;
        public int vie;
        public string[] competences;
        public string capacite_speciale;
        public string description;
        public string citation;
        public string proto_illu_desc;
    }
    #endregion

    #region Visual Data
    [Serializable]
    public class HeroVisualData : CardVisualData
    {
        [HideInInspector] public string titre;
        [HideInInspector] public int pv;
        [HideInInspector] public string[] competences;
        [HideInInspector] public string capacite_speciale;
        [HideInInspector] public string description;
        [HideInInspector] public string citation;
    }
    #endregion

    [Header("Textes spécifiques héros")]
    public TMPro.TextMeshPro titreText;
    public TMPro.TextMeshPro pvText;
    public TMPro.TextMeshPro capaciteText;

    [Header("Palette de compétences (partagée)")]
    [Tooltip("Palette partagée (SO) — source unique pour couleurs, icônes, scales et offsets par compétence. Partagée avec CardBackGenerator.")]
    public CompetenceColorPalette competencePalette;

    [Header("Emplacements des icônes de compétences")]
    public SpriteRenderer[] competenceSlots;

    [Tooltip("Shadow drop (composant SpriteDropShadow) teinté avec la couleur de compétence")]
    public SpriteDropShadow shadowDrop;

    [Header("Données des héros (charger depuis JSON)")]
    public HeroVisualData[] allHeroes;

    public override void LoadFromJson()
    {
        if (jsonSource == null)
        {
            Debug.LogError("Aucun fichier JSON assigné !");
            return;
        }

        var file = JsonUtility.FromJson<HeroesFile>(jsonSource.text);
        if (file == null || file.heroes == null)
        {
            Debug.LogError("Impossible de parser le JSON des héros.");
            return;
        }

        var oldHeroes = allHeroes;
        allHeroes = new HeroVisualData[file.heroes.Length];
        for (int i = 0; i < file.heroes.Length; i++)
        {
            var json = file.heroes[i];
            allHeroes[i] = new HeroVisualData
            {
                nom = json.nom,
                titre = json.titre,
                pv = json.vie,
                competences = json.competences,
                capacite_speciale = json.capacite_speciale,
                description = json.description,
                citation = json.citation,
                proto_illu_desc = json.proto_illu_desc,
            };
        }

        PreserveSprites(oldHeroes, allHeroes);
        Debug.Log($"{allHeroes.Length} héros chargés. Assignez les sprites dans l'inspecteur.");
    }

    public override string GetCardName(int index) => allHeroes[index].nom;
    public override bool HasSprite(int index) => allHeroes[index].sprite != null;

    public override void GenerateCard(int index)
    {
        var hero = allHeroes[index];

        var mainCompetence = (hero.competences != null && hero.competences.Length > 0) ? hero.competences[0] : null;

        SetBaseTexts(hero.nom, hero.description);
        if (titreText != null) titreText.text = hero.titre ?? "";
        if (pvText != null) pvText.text = hero.pv.ToString();
        if (capaciteText != null)
        {
            EnsureSpriteAsset(capaciteText);
            capaciteText.text = IconTagParser.Parse(hero.capacite_speciale);
        }
        SetPortrait(hero.sprite, hero.offset, hero.scale);
        SetCitation(hero.citation);
        SetProtoIlluDesc(hero.proto_illu_desc);
        SetCompetenceIcons(hero.competences);
        SetBackground(mainCompetence);

        ApplyTextStyle(titreText, isSubtitle: true);
        ApplyTextStyle(capaciteText);
        ApplyPvStyle(pvText);
    }

    private void SetCompetenceIcons(string[] competences)
    {
        if (competenceSlots == null) return;

        for (int i = 0; i < competenceSlots.Length; i++)
        {
            if (competenceSlots[i] != null)
                competenceSlots[i].gameObject.SetActive(false);
        }

        if (competences == null || competencePalette == null) return;

        // Teinter le shadow drop avec la couleur de la compétence principale.
        var mainEntry = competencePalette.GetByCompetence(competences[0]);
        if (competences.Length > 0 && shadowDrop != null && mainEntry != null)
        {
            Color tint = mainEntry.color;
            tint.a = shadowDrop.shadowColor.a;
            shadowDrop.shadowColor = tint;
            shadowDrop.ForceUpdate();
        }

        for (int i = 0; i < competences.Length && i < competenceSlots.Length; i++)
        {
            var entry = competencePalette.GetByCompetence(competences[i]);
            if (entry != null && entry.icon != null && competenceSlots[i] != null)
            {
                competenceSlots[i].gameObject.SetActive(true);
                competenceSlots[i].sprite = entry.icon;
                float s = entry.iconScale > 0f ? entry.iconScale : 1f;
                competenceSlots[i].transform.localScale = new Vector3(s, s, 1f);
                Vector2 o = entry.iconOffset;
                var pos = competenceSlots[i].transform.localPosition;
                competenceSlots[i].transform.localPosition = new Vector3(o.x, o.y, pos.z);
            }
        }
    }
}
