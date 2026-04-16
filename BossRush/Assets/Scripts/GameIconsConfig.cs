using System;
using UnityEngine;

/// <summary>
/// ScriptableObject de configuration des icones de jeu.
/// Assigner un sprite pour chaque balise <ico:tag> utilisee dans les JSON.
///
/// Creer via : Assets > Create > Boss Rush > Game Icons Config
/// Puis assigner les sprites dans l'Inspector.
/// Lancer "Tools > Generer GameIcons SpriteAsset" pour construire le TMP_SpriteAsset.
/// </summary>
[CreateAssetMenu(fileName = "GameIconsConfig", menuName = "Boss Rush/Game Icons Config")]
public class GameIconsConfig : ScriptableObject
{
    [Serializable]
    public class IconEntry
    {
        [Tooltip("Nom de la balise (ex: menace, degat, action)")]
        public string tag;

        [Tooltip("Label affiche dans l'editeur (aide visuelle, non utilise au runtime)")]
        public string label;

        [Tooltip("Sprite a utiliser pour cette icone")]
        public Sprite sprite;

        [Tooltip("Echelle du sprite inline dans le texte (1 = taille normale)")]
        public float scale = 1f;
    }

    [Header("Icones du jeu")]
    [Tooltip("Chaque entree correspond a une balise <ico:tag> du JSON")]
    public IconEntry[] icons = new[]
    {
        new IconEntry { tag = "menace",     label = "Menace (carte Menace)" },
        new IconEntry { tag = "invocation", label = "Invocation (monstre)" },
        new IconEntry { tag = "attaque",    label = "Ordre d'attaque" },
        new IconEntry { tag = "actif_boss", label = "Actif boss" },
        new IconEntry { tag = "degat",      label = "Degat / blessure" },
        new IconEntry { tag = "action",     label = "Carte Action" },
        new IconEntry { tag = "capacite",   label = "Capacite active heros" },
        new IconEntry { tag = "destin",     label = "Carte Destin" },
        new IconEntry { tag = "chasse",     label = "Carte Chasse" },
    };
}
