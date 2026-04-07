using UnityEditor;

[CustomEditor(typeof(ObjetCardGenerator))]
public class ObjetCardGeneratorInspector : CardGeneratorInspector<ObjetCardGenerator>
{
    protected override int GetCardCount(ObjetCardGenerator g) => g.allObjets?.Length ?? 0;

    protected override string GetInfoLabel(ObjetCardGenerator g, int i)
    {
        var o = g.allObjets[i];
        string info = $"Type: {o.type}";
        if (o.bonus_degats > 0) info += $" | +{o.bonus_degats} dégâts";
        if (!string.IsNullOrEmpty(o.prerequis)) info += $" | Prérequis: {o.prerequis}";
        return info;
    }
}
