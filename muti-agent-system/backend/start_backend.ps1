$env:PYTHONPATH = "venv\Lib\site-packages"
$env:FLASK_APP = "app.py"
$env:FLASK_ENV = "development"
.\venv\Scripts\python.exe -m flask run --host=0.0.0.0 --port=5000
