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

    #region Competence Icons
    [Serializable]
    public class CompetenceSprites
    {
        public Sprite armure;
        public Sprite distance;
        public Sprite soin;
        public Sprite magie;
        public Sprite diplomatie;

        [Header("Scale par type")]
        public float scaleArmure = 1f;
        public float scaleDistance = 1f;
        public float scaleSoin = 1f;
        public float scaleMagie = 1f;
        public float scaleDiplomatie = 1f;

        [Header("Offset par type")]
        public Vector2 offsetArmure;
        public Vector2 offsetDistance;
        public Vector2 offsetSoin;
        public Vector2 offsetMagie;
        public Vector2 offsetDiplomatie;

        public Sprite GetSprite(string competence)
        {
            switch (competence.ToLower())
            {
                case "armure": return armure;
                case "distance": return distance;
                case "soin": return soin;
                case "magie": return magie;
                case "diplomatie": return diplomatie;
                default:
                    Debug.LogWarning($"Compétence inconnue : {competence}");
                    return null;
            }
        }

        public float GetScale(string competence)
        {
            if (string.IsNullOrEmpty(competence)) return 1f;
            switch (competence.ToLower())
            {
                case "armure": return scaleArmure;
                case "distance": return scaleDistance;
                case "soin": return scaleSoin;
                case "magie": return scaleMagie;
                case "diplomatie": return scaleDiplomatie;
                default: return 1f;
            }
        }

        public Vector2 GetOffset(string competence)
        {
            if (string.IsNullOrEmpty(competence)) return Vector2.zero;
            switch (competence.ToLower())
            {
                case "armure": return offsetArmure;
                case "distance": return offsetDistance;
                case "soin": return offsetSoin;
                case "magie": return offsetMagie;
                case "diplomatie": return offsetDiplomatie;
                default: return Vector2.zero;
            }
        }
    }
    #endregion

    #region Couleurs par compétence (pastille icône + identité héros)
    /// <summary>
    /// Couleurs associées à chaque compétence / héros.
    /// Utilisées pour teinter le disque de fond derrière l'icône de compétence.
    /// Valeurs par défaut = palette définie dans icon_design.md
    /// </summary>
    [Serializable]
    public class CompetenceColors
    {
        [Tooltip("Nawel — Bleu acier #2B4F6E")]
        public Color armure = new Color(0.169f, 0.310f, 0.431f, 0.9f);

        [Tooltip("Daraa — Rouge cramoisi #8B2020")]
        public Color magie = new Color(0.545f, 0.125f, 0.125f, 0.9f);

        [Tooltip("Aslan — Sienna chaud #7A5B3A")]
        public Color diplomatie = new Color(0.478f, 0.357f, 0.227f, 0.9f);

        [Tooltip("Isonash — Vert émeraude #2A5E3A")]
        public Color distance = new Color(0.165f, 0.369f, 0.227f, 0.9f);

        [Tooltip("Gao — Ambre doré #9B7B2F")]
        public Color soin = new Color(0.608f, 0.482f, 0.184f, 0.9f);

        [Tooltip("Fallback — Brun foncé #3A2E22")]
        public Color neutre = new Color(0.227f, 0.180f, 0.133f, 0.9f);

        public Color GetColor(string competence)
        {
            if (string.IsNullOrEmpty(competence)) return neutre;
            switch (competence.ToLower())
            {
                case "armure":     return armure;
                case "magie":      return magie;
                case "diplomatie": return diplomatie;
                case "distance":   return distance;
                case "soin":       return soin;
                default:           return neutre;
            }
        }
    }
    #endregion

    [Header("Textes spécifiques héros")]
    public TMPro.TextMeshPro titreText;
    public TMPro.TextMeshPro pvText;
    public TMPro.TextMeshPro capaciteText;

    [Header("Icônes de compétences")]
    public CompetenceSprites competenceSprites;
    public CompetenceColors competenceColors;

    [Header("Emplacements des icônes de compétences")]
    public SpriteRenderer[] competenceSlots;

    [Tooltip("Disque de fond derrière l'icône compétence (sprite whiteCircle teinté)")]
    public SpriteRenderer competenceDiscRenderer;

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

        if (competences == null) return;

        // Teinter le disque de fond avec la couleur de la compétence principale
        if (competenceDiscRenderer != null && competences.Length > 0 && competenceColors != null)
        {
            competenceDiscRenderer.color = competenceColors.GetColor(competences[0]);
        }

        for (int i = 0; i < competences.Length && i < competenceSlots.Length; i++)
        {
            var sprite = competenceSprites.GetSprite(competences[i]);
            if (sprite != null && competenceSlots[i] != null)
            {
                competenceSlots[i].gameObject.SetActive(true);
                competenceSlots[i].sprite = sprite;
                float s = competenceSprites.GetScale(competences[i]);
                competenceSlots[i].transform.localScale = new Vector3(s, s, 1f);
                Vector2 o = competenceSprites.GetOffset(competences[i]);
                var pos = competenceSlots[i].transform.localPosition;
                competenceSlots[i].transform.localPosition = new Vector3(o.x, o.y, pos.z);
            }
        }
    }
}
