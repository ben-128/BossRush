using UnityEditor;

[CustomEditor(typeof(BossCardGenerator))]
public class BossCardGeneratorInspector : CardGeneratorInspector<BossCardGenerator>
{
    protected override int GetCardCount(BossCardGenerator g) => g.allBoss?.Length ?? 0;

    protected override string GetInfoLabel(BossCardGenerator g, int i)
    {
        var b = g.allBoss[i];
        return $"Difficulté: {b.difficulte} | PV: {b.pv_formule}";
    }
}
