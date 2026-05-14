# 启动后端
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd c:\Users\Tikaua\Desktop\ai_homework-main\muti-agent-system\backend; python app.py"

# 等待一下让后端启动
Start-Sleep -Seconds 2

# 启动前端
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd c:\Users\Tikaua\Desktop\ai_homework-main\muti-agent-system\frontend; node node_modules\vite\bin\vite.js"

Write-Host "✅ 后端和前端都已启动！"
Write-Host "📱 前端地址: http://localhost:3000"
Write-Host "🔧 后端地址: http://localhost:5001"
