"""
周易起卦算法

支持三数起卦法（梅花易数）：
- 第一个数 → 上卦（除以8取余）
- 第二个数 → 下卦（除以8取余）
- 第三个数 → 动爻（除以6取余）
"""
import random

# 八卦基础数据
TRIGRAMS = {
    1: {"name": "乾", "symbol": "☰", "nature": "天", "attribute": "健"},
    2: {"name": "兑", "symbol": "☱", "nature": "泽", "attribute": "悦"},
    3: {"name": "离", "symbol": "☲", "nature": "火", "attribute": "丽"},
    4: {"name": "震", "symbol": "☳", "nature": "雷", "attribute": "动"},
    5: {"name": "巽", "symbol": "☴", "nature": "风", "attribute": "入"},
    6: {"name": "坎", "symbol": "☵", "nature": "水", "attribute": "陷"},
    7: {"name": "艮", "symbol": "☶", "nature": "山", "attribute": "止"},
    8: {"name": "坤", "symbol": "☷", "nature": "地", "attribute": "顺"},
}

# 64卦数据：(上卦, 下卦) -> 卦名
# 上卦和下卦的编号对应 TRIGRAMS 的 key
HEXAGRAMS = {
    (1, 1): {"name": "乾", "symbol": "䷀", "description": "乾为天"},
    (2, 2): {"name": "兑", "symbol": "䷹", "description": "兑为泽"},
    (3, 3): {"name": "离", "symbol": "䷝", "description": "离为火"},
    (4, 4): {"name": "震", "symbol": "䷲", "description": "震为雷"},
    (5, 5): {"name": "巽", "symbol": "䷸", "description": "巽为风"},
    (6, 6): {"name": "坎", "symbol": "䷜", "description": "坎为水"},
    (7, 7): {"name": "艮", "symbol": "䷳", "description": "艮为山"},
    (8, 8): {"name": "坤", "symbol": "䷁", "description": "坤为地"},
    (1, 2): {"name": "履", "symbol": "䷉", "description": "天泽履"},
    (1, 3): {"name": "同人", "symbol": "䷌", "description": "天火同人"},
    (1, 4): {"name": "无妄", "symbol": "䷘", "description": "天雷无妄"},
    (1, 5): {"name": "姤", "symbol": "䷫", "description": "天风姤"},
    (1, 6): {"name": "讼", "symbol": "䷅", "description": "天水讼"},
    (1, 7): {"name": "遁", "symbol": "䷠", "description": "天山遁"},
    (1, 8): {"name": "否", "symbol": "䷋", "description": "天地否"},
    (2, 1): {"name": "夬", "symbol": "䷪", "description": "泽天夬"},
    (2, 3): {"name": "革", "symbol": "䷰", "description": "泽火革"},
    (2, 4): {"name": "随", "symbol": "䷐", "description": "泽雷随"},
    (2, 5): {"name": "大过", "symbol": "䷛", "description": "泽风大过"},
    (2, 6): {"name": "困", "symbol": "䷮", "description": "泽水困"},
    (2, 7): {"name": "咸", "symbol": "䷞", "description": "泽山咸"},
    (2, 8): {"name": "萃", "symbol": "䷬", "description": "泽地萃"},
    (3, 1): {"name": "大有", "symbol": "䷍", "description": "火天大有"},
    (3, 2): {"name": "睽", "symbol": "䷥", "description": "火泽睽"},
    (3, 4): {"name": "噬嗑", "symbol": "䷔", "description": "火雷噬嗑"},
    (3, 5): {"name": "鼎", "symbol": "䷱", "description": "火风鼎"},
    (3, 6): {"name": "既济", "symbol": "䷾", "description": "火水既济"},
    (3, 7): {"name": "旅", "symbol": "䷷", "description": "火山旅"},
    (3, 8): {"name": "晋", "symbol": "䷢", "description": "火地晋"},
    (4, 1): {"name": "大壮", "symbol": "䷡", "description": "雷天大壮"},
    (4, 2): {"name": "归妹", "symbol": "䷵", "description": "雷泽归妹"},
    (4, 3): {"name": "丰", "symbol": "䷶", "description": "雷火丰"},
    (4, 5): {"name": "恒", "symbol": "䷟", "description": "雷风恒"},
    (4, 6): {"name": "解", "symbol": "䷧", "description": "雷水解"},
    (4, 7): {"name": "小过", "symbol": "䷽", "description": "雷山小过"},
    (4, 8): {"name": "豫", "symbol": "䷏", "description": "雷地豫"},
    (5, 1): {"name": "小畜", "symbol": "䷈", "description": "风天小畜"},
    (5, 2): {"name": "中孚", "symbol": "䷼", "description": "风泽中孚"},
    (5, 3): {"name": "家人", "symbol": "䷤", "description": "风火家人"},
    (5, 4): {"name": "益", "symbol": "䷩", "description": "风雷益"},
    (5, 6): {"name": "涣", "symbol": "䷺", "description": "风水涣"},
    (5, 7): {"name": "渐", "symbol": "䷴", "description": "风山渐"},
    (5, 8): {"name": "观", "symbol": "䷓", "description": "风地观"},
    (6, 1): {"name": "需", "symbol": "䷄", "description": "水天需"},
    (6, 2): {"name": "节", "symbol": "䷻", "description": "水泽节"},
    (6, 3): {"name": "未济", "symbol": "䷿", "description": "水火未济"},
    (6, 4): {"name": "屯", "symbol": "䷂", "description": "水雷屯"},
    (6, 5): {"name": "井", "symbol": "䷯", "description": "水风井"},
    (6, 7): {"name": "蹇", "symbol": "䷦", "description": "水山蹇"},
    (6, 8): {"name": "比", "symbol": "䷇", "description": "水地比"},
    (7, 1): {"name": "大畜", "symbol": "䷙", "description": "山天大畜"},
    (7, 2): {"name": "损", "symbol": "䷨", "description": "山泽损"},
    (7, 3): {"name": "贲", "symbol": "䷕", "description": "山火贲"},
    (7, 4): {"name": "颐", "symbol": "䷚", "description": "山雷颐"},
    (7, 5): {"name": "蛊", "symbol": "䷑", "description": "山风蛊"},
    (7, 6): {"name": "蒙", "symbol": "䷃", "description": "山水蒙"},
    (7, 8): {"name": "剥", "symbol": "䷖", "description": "山地剥"},
    (8, 1): {"name": "泰", "symbol": "䷊", "description": "地天泰"},
    (8, 2): {"name": "临", "symbol": "䷒", "description": "地泽临"},
    (8, 3): {"name": "明夷", "symbol": "䷣", "description": "地火明夷"},
    (8, 4): {"name": "复", "symbol": "䷗", "description": "地雷复"},
    (8, 5): {"name": "升", "symbol": "䷭", "description": "地风升"},
    (8, 6): {"name": "师", "symbol": "䷆", "description": "地水师"},
    (8, 7): {"name": "谦", "symbol": "䷎", "description": "地山谦"},
}


def cast_hexagram(numbers: list[int] | None = None) -> dict:
    """
    三数起卦法
    numbers: [num1, num2, num3] 三个正整数，None 则随机生成
    """
    if numbers is None:
        numbers = [random.randint(1, 999) for _ in range(3)]

    if len(numbers) < 3:
        numbers.extend([random.randint(1, 999) for _ in range(3 - len(numbers))])

    # 上卦：第一个数除以8取余，余数为0则取8
    upper = numbers[0] % 8 or 8
    # 下卦：第二个数除以8取余
    lower = numbers[1] % 8 or 8
    # 动爻：第三个数除以6取余，余数为0则取6
    changing_line = numbers[2] % 6 or 6

    hexagram = HEXAGRAMS.get((upper, lower), {
        "name": "未知",
        "symbol": "?",
        "description": "未知卦象"
    })

    return {
        "hexagram_name": hexagram["name"],
        "hexagram_symbol": hexagram["symbol"],
        "hexagram_description": hexagram["description"],
        "upper_trigram": TRIGRAMS[upper]["name"],
        "lower_trigram": TRIGRAMS[lower]["name"],
        "upper_nature": TRIGRAMS[upper]["nature"],
        "lower_nature": TRIGRAMS[lower]["nature"],
        "changing_line": changing_line,
        "numbers": numbers,
    }


def get_all_hexagrams() -> list[dict]:
    """获取全部64卦列表"""
    result = []
    idx = 1
    for (upper, lower), info in HEXAGRAMS.items():
        result.append({
            "id": idx,
            "name": info["name"],
            "symbol": info["symbol"],
            "description": info["description"],
            "upper_trigram": TRIGRAMS[upper]["name"],
            "lower_trigram": TRIGRAMS[lower]["name"],
        })
        idx += 1
    return result
