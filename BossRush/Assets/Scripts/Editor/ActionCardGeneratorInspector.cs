using UnityEditor;

[CustomEditor(typeof(ActionCardGenerator))]
public class ActionCardGeneratorInspector : CardGeneratorInspector<ActionCardGenerator>
{
    protected override int GetCardCount(ActionCardGenerator g) => g.allActions?.Length ?? 0;

    protected override string GetInfoLabel(ActionCardGenerator g, int i)
    {
        var a = g.allActions[i];
        string info = $"Type: {a.type}";
        if (a.type == "attaque") info += $" | {a.portee} | {a.degats} dégâts";
        if (!string.IsNullOrEmpty(a.prerequis)) info += $" | Prérequis: {a.prerequis}";
        return info;
    }
}
