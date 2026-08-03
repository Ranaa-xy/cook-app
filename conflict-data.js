/**
 * 食物相克数据库
 * 数据来源：中医药理论及现代营养学研究
 * 格式：{ foods: [食物A, 食物B], reason: 原因, severity: 'high' | 'medium' }
 */

const FOOD_CONFLICTS = [
    // ===== 高严重度 =====
    { foods: ["柿子", "螃蟹"], reason: "柿子中的鞣酸与螃蟹的蛋白质结合，形成不溶性沉淀，导致腹痛、腹泻、呕吐", severity: "high" },
    { foods: ["柿子", "红薯"], reason: "红薯含大量淀粉产生胃酸，与柿子的鞣酸结合形成胃结石", severity: "high" },
    { foods: ["柿子", "海鲜"], reason: "柿子中的鞣酸与海鲜蛋白质结合，刺激肠胃，引起腹痛腹泻", severity: "high" },
    { foods: ["柿子", "牛奶"], reason: "鞣酸与牛奶蛋白质反应，导致消化不良和结石风险", severity: "high" },
    { foods: ["柿子", "鸡蛋"], reason: "鞣酸与蛋白质结合，可能引起腹痛、呕吐", severity: "high" },
    { foods: ["柿子", "酒"], reason: "酒精加速鞣酸与胃酸反应，易形成胃结石", severity: "high" },

    { foods: ["海鲜", "维生素C"], reason: "海鲜中的砷与大量维C反应可能生成有毒物质（大量同食才有风险）", severity: "high" },
    { foods: ["海鲜", "柿子"], reason: "同食会形成难以消化的物质，导致腹痛腹泻", severity: "high" },
    { foods: ["海鲜", "山楂"], reason: "山楂中的鞣酸与海鲜蛋白质结合，引起肠胃不适", severity: "high" },
    { foods: ["虾", "维生素C"], reason: "虾含高浓度砷化合物，与大量维C反应有中毒风险", severity: "high" },
    { foods: ["螃蟹", "柿子"], reason: "螃蟹蛋白质与柿子鞣酸结合，形成结石，引起腹痛", severity: "high" },
    { foods: ["螃蟹", "梨"], reason: "两者均为寒性食物，同食伤脾胃，导致腹泻", severity: "high" },
    { foods: ["螃蟹", "花生"], reason: "螃蟹性寒，花生油腻，同食易导致腹泻", severity: "high" },
    { foods: ["螃蟹", "茶水"], reason: "茶水中鞣酸与蟹肉蛋白质反应，影响消化吸收", severity: "high" },
    { foods: ["螃蟹", "南瓜"], reason: "螃蟹与南瓜同食可能导致中毒反应", severity: "high" },

    { foods: ["牛奶", "巧克力"], reason: "牛奶中的钙与巧克力中的草酸结合，形成草酸钙，影响吸收并可能导致结石", severity: "high" },
    { foods: ["牛奶", "橘子"], reason: "牛奶蛋白质与橘子果酸反应，产生沉淀，影响消化吸收", severity: "medium" },
    { foods: ["牛奶", "柠檬"], reason: "酸性水果使牛奶蛋白质凝固，降低营养价值", severity: "medium" },
    { foods: ["牛奶", "菠萝"], reason: "菠萝蛋白酶与牛奶蛋白质反应，引起消化不良", severity: "medium" },
    { foods: ["牛奶", "韭菜"], reason: "牛奶中的钙与韭菜中的草酸结合，影响钙吸收", severity: "medium" },
    { foods: ["牛奶", "药"], reason: "牛奶会影响多种药物的吸收，服药前后1小时内不宜饮用", severity: "high" },

    { foods: ["菠菜", "豆腐"], reason: "菠菜中的草酸与豆腐中的钙结合形成草酸钙，影响钙吸收并可能形成结石", severity: "high" },
    { foods: ["菠菜", "牛奶"], reason: "菠菜草酸与牛奶钙质结合，降低营养吸收", severity: "medium" },
    { foods: ["菠菜", "鳝鱼"], reason: "菠菜性凉滑，鳝鱼性温，两者性味相冲，易引起腹泻", severity: "medium" },

    { foods: ["白萝卜", "胡萝卜"], reason: "胡萝卜中的抗坏血酸酶会破坏白萝卜中的维生素C，降低营养价值", severity: "medium" },
    { foods: ["白萝卜", "人参"], reason: "白萝卜行气破气，与人参的补气作用相抵消，降低药效", severity: "high" },
    { foods: ["白萝卜", "木耳"], reason: "两者同食可能引发皮炎", severity: "medium" },

    { foods: ["鸡蛋", "豆浆"], reason: "生豆浆中的胰蛋白酶抑制剂影响鸡蛋蛋白质的消化吸收（煮熟后影响较小）", severity: "medium" },
    { foods: ["鸡蛋", "糖精"], reason: "鸡蛋中的氨基酸与糖精反应，可能引起中毒（日常食用白糖无影响）", severity: "high" },
    { foods: ["鸡蛋", "兔肉"], reason: "两者均性寒，同食可能刺激肠胃引起腹泻", severity: "medium" },
    { foods: ["鸡蛋", "茶"], reason: "茶叶中的鞣酸与鸡蛋蛋白质结合，影响消化吸收", severity: "medium" },

    { foods: ["狗肉", "绿豆"], reason: "狗肉性温，绿豆性寒，两者同食会导致腹胀腹痛", severity: "high" },
    { foods: ["狗肉", "大蒜"], reason: "狗肉性热，大蒜辛辣，同食容易上火", severity: "medium" },
    { foods: ["狗肉", "茶"], reason: "狗肉蛋白质丰富，茶叶鞣酸与之结合，影响消化", severity: "medium" },

    { foods: ["蜂蜜", "豆腐"], reason: "蜂蜜中的酶与豆腐中的矿物质反应，可导致腹泻", severity: "high" },
    { foods: ["蜂蜜", "洋葱"], reason: "蜂蜜中的有机酸与洋葱含硫化合物反应，刺激肠胃", severity: "medium" },
    { foods: ["蜂蜜", "韭菜"], reason: "蜂蜜通便，韭菜富含纤维，同食易导致腹泻", severity: "medium" },

    { foods: ["猪肉", "牛肉"], reason: "猪肉性微寒，牛肉性温，一温一寒性味相冲，不建议同食", severity: "low" },
    { foods: ["猪肉", "羊肝"], reason: "猪肉与羊肝同食可能导致心慌气闷", severity: "medium" },
    { foods: ["猪肉", "大黄"], reason: "猪肉与大黄（中药）同服会增加肠道蠕动，导致腹泻", severity: "high" },

    { foods: ["羊肉", "西瓜"], reason: "羊肉性热，西瓜性寒，同食伤脾胃，容易引起腹泻", severity: "high" },
    { foods: ["羊肉", "醋"], reason: "羊肉性热，醋性温，同食容易上火", severity: "medium" },
    { foods: ["羊肉", "茶"], reason: "羊肉蛋白质与茶的鞣酸结合，产生不消化物，导致便秘", severity: "medium" },
    { foods: ["羊肉", "南瓜"], reason: "羊肉与南瓜均为温性食物，同食容易导致上火、腹胀", severity: "medium" },

    { foods: ["芹菜", "黄瓜"], reason: "黄瓜中的维生素C分解酶会破坏芹菜中的维生素C", severity: "low" },
    { foods: ["芹菜", "蛤蜊"], reason: "芹菜与蛤蜊同食可能导致腹泻", severity: "medium" },

    { foods: ["黄瓜", "西红柿"], reason: "黄瓜中的维生素C分解酶会破坏西红柿中的维生素C（少量同食影响不大）", severity: "low" },
    { foods: ["黄瓜", "辣椒"], reason: "黄瓜中的酶会破坏辣椒中的维生素C，降低营养价值", severity: "low" },
    { foods: ["黄瓜", "花生"], reason: "黄瓜性寒，花生油腻，同食可能引起腹泻", severity: "medium" },

    { foods: ["红薯", "鸡蛋"], reason: "红薯与鸡蛋同食容易产生胀气，消化不良", severity: "medium" },
    { foods: ["红薯", "香蕉"], reason: "红薯和香蕉同食容易导致腹胀和胃酸过多", severity: "medium" },

    { foods: ["土豆", "牛肉"], reason: "土豆和牛肉同食需要不同的胃酸浓度来消化，增加胃部负担", severity: "low" },
    { foods: ["土豆", "香蕉"], reason: "两者同食可能导致面部出现色素沉着", severity: "low" },

    { foods: ["大蒜", "蜂蜜"], reason: "大蒜的辛辣与蜂蜜同食，容易引起肠胃不适", severity: "medium" },
    { foods: ["大蒜", "狗肉"], reason: "两者均为热性，同食容易上火", severity: "medium" },

    { foods: ["韭菜", "菠菜"], reason: "两者均为滑肠食物，同食容易引起腹泻", severity: "medium" },
    { foods: ["韭菜", "蜂蜜"], reason: "韭菜富含纤维，蜂蜜润肠，同食容易腹泻", severity: "medium" },
    { foods: ["韭菜", "牛肉"], reason: "韭菜性温，牛肉性温，两者同食容易上火", severity: "medium" },

    { foods: ["味精", "鸡蛋"], reason: "鸡蛋本身含谷氨酸，加味精烹饪会产生苦涩异味并可能产生有害物质", severity: "medium" },

    { foods: ["蕨菜", "黄豆"], reason: "蕨菜与黄豆同食可能影响甲状腺功能", severity: "medium" },
    { foods: ["蕨菜", "花生"], reason: "蕨菜中的维生素B1分解酶会破坏花生中的维生素B1", severity: "low" },

    { foods: ["毛豆", "鱼"], reason: "毛豆中的植酸会影响鱼肉中矿物质的吸收", severity: "low" },
];

// 同一种食物可能有多个名称，建立别名映射
const FOOD_ALIASES = {
    "番茄": "西红柿",
    "圣女果": "西红柿",
    "小番茄": "西红柿",
    "马铃薯": "土豆",
    "洋芋": "土豆",
    "番薯": "红薯",
    "地瓜": "红薯",
    "甘薯": "红薯",
    "大闸蟹": "螃蟹",
    "梭子蟹": "螃蟹",
    "青蟹": "螃蟹",
    "纯牛奶": "牛奶",
    "酸奶": "牛奶",
    "鲜奶": "牛奶",
    "鸡子": "鸡蛋",
    "土鸡蛋": "鸡蛋",
    "豆奶": "豆浆",
    "豆乳": "豆浆",
    "白萝卜": "萝卜",
    "胡萝卜": "萝卜",
    "虾仁": "虾",
    "大虾": "虾",
    "对虾": "虾",
    "基围虾": "虾",
    "龙眼": "桂圆",
    "圆葱": "洋葱",
    "大葱": "葱",
    "小葱": "葱",
    "蒜头": "大蒜",
    "蒜": "大蒜",
    "韭黄": "韭菜",
    "猪肝": "猪肉",
    "猪蹄": "猪肉",
    "排骨": "猪肉",
    "五花肉": "猪肉",
    "瘦肉": "猪肉",
    "羊排": "羊肉",
    "羊腿": "羊肉",
    "橙": "橘子",
    "橙子": "橘子",
    "柑": "橘子",
    "柚子": "橘子",
    "奇异果": "猕猴桃",
    "啤梨": "梨",
    "雪梨": "梨",
    "鸭梨": "梨",
};

/**
 * 标准化食物名称（处理别名）
 */
function normalizeFood(name) {
    const cleaned = name.trim();
    // 先检查别名
    for (const [alias, standard] of Object.entries(FOOD_ALIASES)) {
        if (cleaned.includes(alias)) {
            return standard;
        }
    }
    return cleaned;
}

/**
 * 检查两种食物是否相克
 * @param {string} food1 - 食物名称1
 * @param {string} food2 - 食物名称2
 * @returns {object|null} - 冲突信息或null
 */
function checkConflict(food1, food2) {
    const f1 = normalizeFood(food1);
    const f2 = normalizeFood(food2);

    for (const conflict of FOOD_CONFLICTS) {
        const [a, b] = conflict.foods;
        const n1 = normalizeFood(a);
        const n2 = normalizeFood(b);

        // 双向匹配
        if ((f1.includes(n1) || n1.includes(f1)) &&
            (f2.includes(n2) || n2.includes(f2))) {
            return conflict;
        }
        if ((f1.includes(n2) || n2.includes(f1)) &&
            (f2.includes(n1) || n1.includes(f2))) {
            return conflict;
        }
    }
    return null;
}

/**
 * 在一组食材中查找所有冲突
 * @param {string[]} ingredients - 食材名称数组
 * @returns {object[]} - 所有冲突的数组
 */
function findAllConflicts(ingredients) {
    const conflicts = [];
    for (let i = 0; i < ingredients.length; i++) {
        for (let j = i + 1; j < ingredients.length; j++) {
            const result = checkConflict(ingredients[i], ingredients[j]);
            if (result) {
                conflicts.push({
                    food1: ingredients[i],
                    food2: ingredients[j],
                    reason: result.reason,
                    severity: result.severity,
                });
            }
        }
    }
    return conflicts;
}
