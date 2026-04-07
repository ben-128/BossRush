using UnityEditor;

[CustomEditor(typeof(HeroCardGenerator))]
public class HeroCardGeneratorInspector : CardGeneratorInspector<HeroCardGenerator>
{
    protected override int GetCardCount(HeroCardGenerator generator)
        => generator.allHeroes?.Length ?? 0;

    protected override string GetInfoLabel(HeroCardGenerator generator, int index)
        => null;
}
