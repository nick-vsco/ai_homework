$body = '{"text":"张三：你好，李四！李四：你好，张三！"}'
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/characters/extract" -Method POST -ContentType "application/json" -Body $body
Write-Output $response
