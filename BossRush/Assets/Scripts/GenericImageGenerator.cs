using System;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class GenericImageGenerator : MonoBehaviour
{
    private const int MonstersDamageMultiplier = 2;
    public enum Type
    {
        Physic,
        Magic,
        Soin,
        None,
    }
    [Serializable]
    public class AllImageData
    {
        [Serializable]
        public class Recompense
        {
            public int equip;
            public int equipElite;
            public int obj;
            public int gold;
            public int xp;
        }

        [Serializable]
        public class MonsterStats
        {
            public int physicDef;
            public int magicDef;
            public int Life;
            public int lifePerHeros;

            public Atk atk;
            public Atk otherAtk;
        }

        [Serializable]
        public class Atk
        {
            public enum MoveType
            {
                None,
                Melee,
                Back,
            }

            public enum MoveMoment
            {
                Before,
                After
            }

            public Type type;
            public int dmg;
            public string range;
            public MoveType moveType;
            public MoveMoment moveMoment;
        }


        public string name;
        public Sprite sprite;
        public Vector2 offset = Vector2.up * 2;
        public float scale = .5f;
        public string description;
        public string description2;
        public int buyPrice = 15;
        public int sellPrice = 3;
        public int charges = 3;
        public bool sharable;
        public Recompense recompense;
        public string range = "0";
        public Type type;
        public string requirement;
        public MonsterStats monsterStats;
    }

    [Serializable]
    public class RecompenseVisual
    {
        public GameObject root;
        public TextMeshProUGUI text;
    }


    [Serializable]
    public class GeneralVisuals
    {
        public Sprite physiqueAtk;
        public Sprite magicAtk;
        public Sprite physiqueDef;
        public Sprite magicDef;
        public Sprite moveMelee;
        public Sprite Moveback;
        public Sprite Soins;
    }

    [Serializable]
    public class Atk
    {
        public Image damage;
        public TextMeshProUGUI damageValue;
        public TextMeshProUGUI rangeValue;
        public GameObject atkObject;
        public GameObject plusSign;
        public GameObject moveObject;
        public Image moveImg;
        public TextMeshProUGUI moveTxt;
    }

    public string categoryName;
    public GeneralVisuals visuals;
    public AllImageData[] allimages;
    private static void EnsureSpriteAsset(TextMeshPro tmp)
    {
        if (tmp == null || tmp.spriteAsset != null) return;
        var defaultAsset = TMP_Settings.defaultSpriteAsset;
        if (defaultAsset != null)
            tmp.spriteAsset = defaultAsset;
    }

    public TextMeshPro titre;
    public SpriteRenderer objectRender;
    public TextMeshPro description;
    public TextMeshPro description2;
    public TextMeshPro buyCost;
    public TextMeshPro sellCost;
    public TextMeshPro charges;
    public RecompenseVisual equipment;
    public RecompenseVisual equipmentElite;
    public RecompenseVisual objet;
    public RecompenseVisual gold;
    public RecompenseVisual xp;
    public GameObject sharable;
    public TextMeshPro range;
    public SpriteRenderer atkType;
    public SpriteRenderer defType;
    public SpriteRenderer defType2;
    public TextMeshPro atkTxt;
    public TextMeshPro requirementTxt;
    public TextMeshPro PhysicDef;
    public TextMeshPro MagicDef;
    public TextMeshPro Life;
    public Atk atk;
    public Atk OtherAtk;
    public int expBonus = 0;

    public void GenerateImage(AllImageData data)
    {
        titre.text = data.name;
        if (objectRender)
        {
            objectRender.sprite = data.sprite;
            objectRender.transform.localPosition = (Vector3)data.offset + (Vector3.forward * 0.01f);
            objectRender.transform.localScale = new Vector3(data.scale, data.scale, 1f);
        }

        EnsureSpriteAsset(description);
        description.text = IconTagParser.Parse((data.description).Replace("\\n", "\n"));
        if (description2)
        {
            EnsureSpriteAsset(description2);
            description2.text = IconTagParser.Parse((data.description2).Replace("\\n", "\n"));
        }

        Canvas.ForceUpdateCanvases();
        if (buyCost)
            buyCost.text = data.buyPrice.ToString();
        if (sellCost)
        {
            sellCost.transform.parent.gameObject.SetActive(data.sellPrice > 0);
            sellCost.text = data.sellPrice.ToString();
        }
            
        if (charges)
        {
            charges.text = data.charges.ToString();

            if(data.charges == 0)
            {
                charges.transform.parent.gameObject.SetActive(false);
            }
            else
            {
                charges.transform.parent.gameObject.SetActive(true);
            }
        }

        ActivateRecompense(equipment, data.recompense.equip);
        ActivateRecompense(equipmentElite, data.recompense.equipElite);
        ActivateRecompense(objet, data.recompense.obj);
        ActivateRecompense(gold, data.recompense.gold);
        ActivateRecompense(xp, data.recompense.xp + expBonus);

        if (sharable)
            sharable.SetActive(data.sharable);

        if (range)
        {
            range.transform.parent.gameObject.SetActive(data.range != "-1");
            range.text = data.range.ToString();
        }

        if (atkType)
        {
            if(data.type == Type.Physic)
            {
                atkType.sprite = visuals.physiqueAtk;

            }
            else if (data.type == Type.Magic)
            {
                atkType.sprite = visuals.magicAtk;
            }
            else if(data.type == Type.Soin)
            {
                atkType.sprite = visuals.Soins;
            }
            else
            {
                atkType.sprite = null;
            }
        }

        if (defType)
        {
            if (data.type == Type.Physic)
            {
                defType.gameObject.SetActive(true);
                defType2.gameObject.SetActive(false);
            }
            else if (data.type == Type.Magic)
            {
                defType.gameObject.SetActive(false);
                defType2.gameObject.SetActive(true);
            }
            else
            {
                defType.gameObject.SetActive(true);
                defType2.gameObject.SetActive(true);
            }
        }

        if (atkTxt)
        {
            atkTxt.text = IconTagParser.Parse(data.description2);
        }

        if (requirementTxt)
            requirementTxt.text = data.requirement;

        if (PhysicDef)
            PhysicDef.text = data.monsterStats.physicDef.ToString();

        if (MagicDef)
            MagicDef.text = data.monsterStats.magicDef.ToString();

        if (Life)
        {
            Life.text = data.monsterStats.Life.ToString();
            if (data.monsterStats.lifePerHeros > 0)
            {
                Life.text = data.monsterStats.Life + " + " + data.monsterStats.lifePerHeros + "/Héros";
            }
        }

        if (atk.atkObject)
        {
            atk.rangeValue.transform.parent.gameObject.SetActive(data.monsterStats.atk.range != "-1");
            atk.damageValue.transform.parent.gameObject.SetActive(data.monsterStats.atk.dmg != -1);

            int damageValue = OtherAtk.atkObject ? data.monsterStats.atk.dmg : data.monsterStats.atk.dmg * MonstersDamageMultiplier;
            atk.damageValue.text = damageValue.ToString();
            atk.rangeValue.text = data.monsterStats.atk.range.ToString();
            atk.rangeValue.fontSize = atk.rangeValue.text.Length > 1 ? 25 : 50;
            atk.damage.sprite = data.monsterStats.atk.type == Type.Physic ? visuals.physiqueAtk : visuals.magicAtk;
            if(atk.plusSign)
            {
                switch (data.monsterStats.atk.moveType)
                {
                    default:
                    case AllImageData.Atk.MoveType.None:
                        atk.plusSign.SetActive(false);
                        atk.moveObject.SetActive(false);
                        break;
                    case AllImageData.Atk.MoveType.Melee:
                        atk.plusSign.SetActive(true);
                        atk.moveObject.SetActive(true);
                        atk.moveImg.sprite = visuals.moveMelee;
                        atk.moveTxt.text = "Mêlée";
                        break;
                    case AllImageData.Atk.MoveType.Back:
                        atk.plusSign.SetActive(true);
                        atk.moveObject.SetActive(true);
                        atk.moveImg.sprite = visuals.Moveback;
                        atk.moveTxt.text = "Arrière";
                        break;
                }
            }
          
            if(atk.moveObject != null)
            {
                switch (data.monsterStats.atk.moveMoment)
                {
                    default:
                    case AllImageData.Atk.MoveMoment.Before:
                        atk.moveObject.transform.SetSiblingIndex(0);
                        atk.atkObject.transform.SetSiblingIndex(2);
                        break;
                    case AllImageData.Atk.MoveMoment.After:
                        atk.moveObject.transform.SetSiblingIndex(2);
                        atk.atkObject.transform.SetSiblingIndex(0);
                        break;
                }
            }
        }


        if (OtherAtk.atkObject)
        {
            OtherAtk.damageValue.text = data.monsterStats.otherAtk.dmg.ToString();
            OtherAtk.rangeValue.text = data.monsterStats.otherAtk.range.ToString();
            OtherAtk.rangeValue.fontSize = OtherAtk.rangeValue.text.Length > 1 ? 25 : 50;
            OtherAtk.damage.sprite = data.monsterStats.otherAtk.type == Type.Physic ? visuals.physiqueAtk : visuals.magicAtk;
        }
    }

    private void ActivateRecompense(RecompenseVisual what, int count)
    {
        if (!what.root)
            return;
        if (count > 0)
        {
            what.root.gameObject.SetActive(true);
            if(count > 1)
            {
                what.text.text = count.ToString();
            }
            else
            {
                what.text.text = "";
            }
        }
        else
        {
            what.root.gameObject.SetActive(false);
        }
    }
}
