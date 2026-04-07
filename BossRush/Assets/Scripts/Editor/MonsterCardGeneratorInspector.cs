using UnityEditor;

[CustomEditor(typeof(MonsterCardGenerator))]
public class MonsterCardGeneratorInspector : CardGeneratorInspector<MonsterCardGenerator>
{
    protected override int GetCardCount(MonsterCardGenerator generator)
        => generator.allMonsters?.Length ?? 0;

    protected override string GetInfoLabel(MonsterCardGenerator generator, int index)
    {
        var m = generator.allMonsters[index];
        return $"PV: {m.pv} | Dégâts: {m.degats} ({m.type_degats}) | x{m.quantite}";
    }
}
