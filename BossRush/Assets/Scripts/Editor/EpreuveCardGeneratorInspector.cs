using UnityEditor;

[CustomEditor(typeof(EpreuveCardGenerator))]
public class EpreuveCardGeneratorInspector : CardGeneratorInspector<EpreuveCardGenerator>
{
    protected override int GetCardCount(EpreuveCardGenerator g) => g.allEpreuves?.Length ?? 0;
    protected override string GetInfoLabel(EpreuveCardGenerator g, int i) => null;
}
