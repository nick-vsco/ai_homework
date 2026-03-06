import re
from typing import List, Dict, Tuple, Optional
from models import Character

class CharacterAnalyzer:
    """角色分析器 - 从文本中识别和提取角色信息"""
    
    def __init__(self):
        pass
    
    def extract_characters(self, text: str, existing_characters: List[Character] = None) -> List[Character]:
        """从文本中提取角色"""
        characters = []
        
        # 中文角色识别：查找常见的中文人名模式
        # 匹配单字姓+1-2个非姓中文字符（如：张三、李四、王小明）
        chinese_surnames = '张王李刘陈杨赵黄周吴徐孙胡朱高林何郭马罗'
        chinese_name_pattern = f'([{chinese_surnames}])([\u4e00-\u9fa5]{{1,2}})(?![{chinese_surnames}])'
        
        # 抽象角色名称列表
        abstract_roles = ['小女孩', '小男孩', '老人', '年轻人', '女人', '男人', '女士', '先生', '孩子', '孩子', '母亲', '父亲', '医生', '护士', '老师', '学生', '国王', '王后', '公主', '王子']
        
        # 简单的角色识别：查找人名（大写字母开头的名词）
        lines = text.split('\n')
        
        # 提取所有可能的角色名称和对话结构
        all_names = []
        dialogue_structure = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # 尝试匹配对话格式：角色名: 内容（优先使用这种方式）
            dialogue_pattern = r'^([\u4e00-\u9fa5]{2,4})[：:]\s*'
            dialogue_match = re.match(dialogue_pattern, line)
            if dialogue_match:
                name = dialogue_match.group(1)
                all_names.append(name)
                dialogue_structure.append({'type': 'dialogue', 'name': name, 'line': line})
            
            # 尝试匹配中文人名
            chinese_matches = re.findall(chinese_name_pattern, line)
            for surname, given_name in chinese_matches:
                name = surname + given_name
                if len(name) >= 2 and len(name) <= 3:
                    all_names.append(name)
                    dialogue_structure.append({'type': 'character', 'name': name, 'line': line})
            
            # 尝试匹配抽象角色名称
            for role in abstract_roles:
                if role in line:
                    all_names.append(role)
                    dialogue_structure.append({'type': 'character', 'name': role, 'line': line})
            
            # 提取包含代词的句子
            if any(pronoun in line for pronoun in ['他', '她', '它', '他们', '她们', '它们']):
                dialogue_structure.append({'type': 'pronoun', 'line': line})
        
        # 处理不同称谓对应同一个角色的情况，考虑上下文
        name_mappings = self._map_similar_names(all_names, dialogue_structure)
        
        # 去重并创建角色
        seen_names = set()
        for name in all_names:
            # 获取标准化的角色名称
            normalized_name = name_mappings.get(name, name)
            
            if normalized_name not in seen_names:
                seen_names.add(normalized_name)
                characters.append(Character(
                    id=f"char_{len(characters)}",
                    name=normalized_name,
                    description=f"角色 {normalized_name}",
                    personality="待定",
                    role="主要角色"
                ))
        
        # 如果提供了现有角色列表，合并
        if existing_characters:
            existing_names = {c.name for c in existing_characters}
            for char in characters:
                if char.name not in existing_names:
                    existing_characters.append(char)
            return existing_characters
        
        return characters
    
    def _map_similar_names(self, names: List[str], dialogue_structure: List[Dict]) -> Dict[str, str]:
        """处理不同称谓对应同一个角色的情况，考虑上下文"""
        # 常见的称谓映射
        mappings = {
            # 亲属关系
            '爸爸': '父亲',
            '妈妈': '母亲',
            '爷爷': '祖父',
            '奶奶': '祖母',
            '外公': '外祖父',
            '外婆': '外祖母',
            '哥哥': '兄长',
            '姐姐': '姐姐',
            '弟弟': '弟弟',
            '妹妹': '妹妹',
            
            # 职业称谓
            '老师': '老师',
            '医生': '医生',
            '护士': '护士',
            '警察': '警察',
            '医生': '医生',
            
            # 其他称谓
            '先生': '先生',
            '女士': '女士',
            '小姐': '女士',
            '夫人': '女士',
            '先生': '先生',
            '太太': '女士',
        }
        
        # 处理抽象角色的不同称谓
        abstract_mappings = {
            '小女孩': '小女孩',
            '女孩': '小女孩',
            '小姑娘': '小女孩',
            '小男孩': '小男孩',
            '男孩': '小男孩',
            '小伙子': '小男孩',
            '老人': '老人',
            '老爷爷': '老人',
            '老奶奶': '老人',
            '年轻人': '年轻人',
            '女人': '女人',
            '女性': '女人',
            '男人': '男人',
            '男性': '男人',
            '孩子': '孩子',
            '小孩': '孩子',
            '小朋友': '孩子',
        }
        
        # 合并所有映射
        mappings.update(abstract_mappings)
        
        # 基于上下文的角色指代解析
        # 1. 提取所有唯一的角色名称
        unique_names = list(set(names))
        
        # 2. 按出现频率排序，频率高的角色可能是主要角色
        name_counts = {name: names.count(name) for name in unique_names}
        sorted_names = sorted(unique_names, key=lambda x: name_counts[x], reverse=True)
        
        # 3. 处理同姓的情况
        surname_groups = {}
        for name in sorted_names:
            if len(name) >= 2 and name[0] in '张王李刘陈杨赵黄周吴徐孙胡朱高林何郭马罗':
                surname = name[0]
                if surname not in surname_groups:
                    surname_groups[surname] = []
                surname_groups[surname].append(name)
        
        # 4. 对于每个姓氏组，根据上下文确定不同称谓的指代
        for surname, group_names in surname_groups.items():
            if len(group_names) > 1:
                # 对于同姓的多个角色，保留所有不同的名字
                # 避免将不同的人映射到同一个角色
                for name in group_names:
                    # 不要将不同的全名映射到同一个角色
                    if len(name) >= 2:
                        # 保留全名，不进行映射
                        pass
        
        # 5. 基于对话结构的指代解析
        recent_characters = []
        for item in dialogue_structure:
            if item['type'] == 'character' or item['type'] == 'dialogue':
                # 记录最近出现的角色
                character_name = item['name']
                normalized_name = mappings.get(character_name, character_name)
                if normalized_name not in recent_characters:
                    recent_characters.append(normalized_name)
                # 保持最近5个角色
                if len(recent_characters) > 5:
                    recent_characters.pop(0)
            elif item['type'] == 'pronoun':
                # 处理代词，根据最近的角色进行指代
                if recent_characters:
                    # 假设代词指的是最近的角色
                    pass
        
        return mappings
    
    def analyze_dialogue(self, text: str) -> List[Dict[str, str]]:
        """分析对话，提取角色对话对"""
        dialogues = []
        
        # 中文对话模式匹配
        # 匹配 "角色名: 内容" 或 "角色名说：" 格式
        chinese_pattern = r'([\u4e00-\u9fa5]{2,4})[：:]\s*([^。\n！？!?\s]+[。！？!?\s]*)'
        matches = re.findall(chinese_pattern, text)
        
        for name, content in matches:
            # 验证是否是角色名（2-4个中文字符）
            if 2 <= len(name) <= 4:
                dialogues.append({
                    'character': name.strip(),
                    'content': content.strip()
                })
        
        # 同时也尝试匹配英文格式
        english_pattern = r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*):\s*([^.\n!?]+[.\n!?])'
        english_matches = re.findall(english_pattern, text)
        
        for name, content in english_matches:
            if not any(d['character'] == name.strip() for d in dialogues):
                dialogues.append({
                    'character': name.strip(),
                    'content': content.strip()
                })
        
        return dialogues
    
    def detect_emotion(self, text: str) -> str:
        """检测文本情感倾向"""
        positive_words = ['快乐', '开心', '高兴', '喜悦', '幸福', '激动', '兴奋', '爱', '喜欢']
        negative_words = ['悲伤', '难过', '伤心', '痛苦', '愤怒', '生气', '恐惧', '害怕', '恨']
        
        text_lower = text.lower()
        
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        if positive_count > negative_count:
            return 'positive'
        elif negative_count > negative_count:
            return 'negative'
        else:
            return 'neutral'
    
    def get_character_by_name(self, name: str, characters: List[Character]) -> Optional[Character]:
        """根据名称查找角色"""
        for char in characters:
            if char.name == name:
                return char
        return None
