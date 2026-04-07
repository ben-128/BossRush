using System;
using UnityEngine;

[Serializable]
public class CardVisualData
{
    [HideInInspector] public string nom;

    [Header("Visuel")]
    public Sprite sprite;
    public Vector2 offset = Vector2.up * 2;
    public float scale = 0.5f;
}
