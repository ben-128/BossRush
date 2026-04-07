using UnityEditor;

[CustomEditor(typeof(DestinCardGenerator))]
public class DestinCardGeneratorInspector : CardGeneratorInspector<DestinCardGenerator>
{
    protected override int GetCardCount(DestinCardGenerator g) => g.allDestins?.Length ?? 0;
    protected override string GetInfoLabel(DestinCardGenerator g, int i) => null;
}
