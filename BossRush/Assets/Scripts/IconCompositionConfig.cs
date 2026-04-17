using System;
using UnityEngine;

/// <summary>
/// ScriptableObject de configuration pour composer les icones inline.
/// Chaque entree combine un cadre (optionnel) + un symbole + une teinte
/// et genere un PNG dans le dossier de sortie.
///
/// Creer via : Assets > Create > Boss Rush > Icon Composition Config
/// Puis : Tools > Composer Icones Inline
/// </summary>
[CreateAssetMenu(fileName = "IconCompositionConfig", menuName = "Boss Rush/Icon Composition Config")]
public class IconCompositionConfig : ScriptableObject
{
    public enum CompositeMode
    {
        [Tooltip("Le symbole creuse un trou dans le cadre (destination-out). Le symbole devient transparent.")]
        Cutout,
        [Tooltip("Le symbole est pose par-dessus le cadre, tinte avec symbolColor.")]
        Overlay,
        [Tooltip("Pas de cadre : seul le symbole est tinte et exporte.")]
        SymbolOnly,
    }

    [Serializable]
    public class Entry
    {
        [Tooltip("Nom du fichier de sortie (sans extension). Ex: Menace")]
        public string outputName;

        [Tooltip("Mode de composition")]
        public CompositeMode mode = CompositeMode.Cutout;

        [Tooltip("Cadre blanc (requis pour Cutout et Overlay)")]
        public Texture2D frame;

        [Tooltip("Symbole blanc (toujours requis)")]
        public Texture2D symbol;

        [Tooltip("Couleur finale du cadre (tinte multiplicative du frame)")]
        public Color frameColor = Color.white;

        [Tooltip("Couleur du symbole (utilisee en mode Overlay et SymbolOnly)")]
        public Color symbolColor = Color.white;

        [Tooltip("Echelle du symbole relative au cadre (0.1 a 1). Ignore en SymbolOnly.")]
        [Range(0.1f, 1f)]
        public float symbolScale = 0.6f;

        [Tooltip("Seuil alpha (0-1) pour binariser le masque symbole. Evite les halos aux bords.")]
        [Range(0f, 1f)]
        public float alphaThreshold = 0.5f;
    }

    [Tooltip("Dossier de sortie relatif au dossier du projet (ex: Assets/Art/Icons/Inline)")]
    public string outputFolder = "Assets/Art/Icons/Inline";

    [Tooltip("Taille de sortie (carre). La resolution du cadre est resamplee a cette taille.")]
    public int outputSize = 512;

    [Tooltip("Entrees a generer")]
    public Entry[] entries;
}
