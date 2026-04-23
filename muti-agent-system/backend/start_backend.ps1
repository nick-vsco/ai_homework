$env:PYTHONPATH = "venv_new\Lib\site-packages"
$env:FLASK_APP = "app.py"
$env:FLASK_ENV = "development"
.\venv_new\Scripts\python.exe -m flask run --host=0.0.0.0 --port=5000
