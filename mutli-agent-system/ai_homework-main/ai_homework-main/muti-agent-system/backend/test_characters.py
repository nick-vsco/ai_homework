from models import Character

# 测试角色创建
characters = [
    Character(
        id="char_0",
        name="张三",
        description="角色 张三",
        personality="待定",
        role="主要角色"
    ),
    Character(
        id="char_1",
        name="李四",
        description="角色 李四",
        personality="待定",
        role="主要角色"
    )
]

# 打印角色信息
print("创建的角色:")
for char in characters:
    print(f"ID: {char.id}, Name: {char.name}, Description: {char.description}")

# 测试转换为字典
print("\n角色转换为字典:")
for char in characters:
    print(char.dict())
