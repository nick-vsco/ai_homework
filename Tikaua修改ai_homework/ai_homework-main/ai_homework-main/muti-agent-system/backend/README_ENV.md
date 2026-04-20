# Python 环境配置说明

## 问题
IDE 显示 "无法解析导入" 错误，因为 IDE 使用的是全局 Python 解释器，而不是虚拟环境中的 Python。

## 解决方案

### 方法 1：配置 IDE 使用虚拟环境

在 Trae IDE 中：

1. 打开命令面板（Ctrl+Shift+P）
2. 输入 "Python: Select Interpreter"
3. 选择虚拟环境中的 Python：
   ```
   c:\Users\28765\Desktop\muti-agent-system\backend\venv\Scripts\python.exe
   ```

### 方法 2：使用命令行运行

所有 Python 命令都使用虚拟环境中的 Python：

```powershell
cd c:\Users\28765\Desktop\muti-agent-system\backend

# 激活虚拟环境
.\venv\Scripts\activate

# 运行 Flask 应用
python -m flask run --host=0.0.0.0 --port=5000

# 运行测试脚本
python test_simple.py
```

### 方法 3：使用启动脚本

使用提供的启动脚本：

```powershell
cd c:\Users\28765\Desktop\muti-agent-system\backend
.\start_backend.ps1
```

## 验证

运行以下命令验证虚拟环境：

```powershell
cd c:\Users\28765\Desktop\muti-agent-system\backend
.\venv\Scripts\python.exe -c "import flask; print(flask.__version__)"
```

应该输出 Flask 版本号，而不是 "ModuleNotFoundError"。
