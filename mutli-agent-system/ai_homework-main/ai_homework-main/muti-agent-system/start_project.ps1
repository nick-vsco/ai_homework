# 启动多智能体角色扮演系统
Write-Host "正在启动多智能体角色扮演系统..."

# 启动后端服务
Write-Host "启动后端服务..."
Start-Process -FilePath "python" -ArgumentList "-m flask run --host=0.0.0.0 --port=5000" -WorkingDirectory "backend" -WindowStyle Normal

# 等待 3 秒让后端服务启动
Start-Sleep -Seconds 3

# 启动前端服务
Write-Host "启动前端服务..."
Start-Process -FilePath "node" -ArgumentList "start-dev.js" -WorkingDirectory "frontend" -WindowStyle Normal

Write-Host "系统已启动！"
Write-Host "后端服务：http://localhost:5000"
Write-Host "前端服务：http://localhost:3000"
