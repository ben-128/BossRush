using UnityEditor;

[CustomEditor(typeof(AttaqueCardGenerator))]
public class AttaqueCardGeneratorInspector : CardGeneratorInspector<AttaqueCardGenerator>
{
    protected override int GetCardCount(AttaqueCardGenerator g) => g.allAttaques?.Length ?? 0;

    protected override string GetInfoLabel(AttaqueCardGenerator g, int i)
    {
        var a = g.allAttaques[i];
        return $"Type: {a.type} | Dégâts: {a.degats} ({a.type_degats}) | x{a.quantite}";
    }
}
