import re

text = "这是一个故事，主角是张三和李四。他们来到了一个小镇。"
chinese_surnames = '张王李刘陈杨赵黄周吴徐孙胡朱高林何郭马罗'

# 更精确的模式：只匹配姓+1-2个非姓中文字符
# 使用负向前瞻避免匹配连续的姓
chinese_name_pattern = f'[{chinese_surnames}](?![{chinese_surnames}])([\u4e00-\u9fa5]{{1,2}})'

# 或者使用更简单的模式：只匹配2-3个字符，且第二个字符不是姓
chinese_name_pattern2 = f'([{chinese_surnames}])([\u4e00-\u9fa5]{{1,2}})(?![{chinese_surnames}])'

matches = re.findall(chinese_name_pattern2, text)
print("Matches:", matches)

# 提取完整名字
full_names = [''.join(m) for m in matches]
print("Full names:", full_names)
