# Repository Guidelines

## Project Structure & Module Organization
- `app.py`: Flask API with JSON and multipart endpoints (`/api/health`, `/api/models`, `/api/detect`, `/api/detect/batch`).
- `models/real_model_loader.py`: Real YOLOv8 loader and inference.
- `utils/`: Shared helpers (`image_processing.py`, `response_formatter.py`).
- `tests/`: Script-style checks and sample assets (`images/`, `outputs/`, `test.py`, `test2.py`).
- `requirements.txt`: Full dependencies (YOLO/torch/opencv). 

## Build, Test, and Development Commands
- Create venv: `python3 -m venv .venv && source .venv/bin/activate`
- Install deps: `pip install -r requirements.txt`
- Run API (dev): `python app.py` (env: `API_HOST`, `API_PORT`, `DEBUG=True|False`)
- Run API (prod): `gunicorn -w 2 -b 0.0.0.0:8000 app:app`
- Test YOLO script: `python tests/test.py --model ../models/models/yolo.pt --image tests/images/SafeDriving2.jpg --save tests/outputs/result.jpg`
- Simulate API flow: `python tests/test2.py`

## Coding Style & Naming Conventions
- Python 3.8+, PEP 8, 4-space indentation, type hints where practical.
- Filenames: `snake_case.py`; functions/variables: `snake_case`; classes: `PascalCase`.
- Keep routes thin; put preprocessing/formatting in `utils/`; model code in `models/real_model_loader.py`.

## Testing Guidelines
- Use script tests under `tests/` for quick validation.
- Place assets in `tests/images/`, outputs in `tests/outputs/`.
- Prefer `pytest` style for future automation; adopt `tests/test_<feature>.py`.

## Commit & Pull Request Guidelines
- Commit style: use Conventional Commits (`feat:`, `fix:`, `refactor:`).
- PRs: include description, linked issues, sample requests/responses, and test output.
- Ensure API starts and `tests/` scripts run without errors.

## Security & Configuration Tips
- Do not commit secrets; configure via env vars (`API_HOST`, `API_PORT`, `DEBUG`). Use `DEBUG=False` in production and restrict CORS.
- Store weights under `models/models/` (e.g., `yolo.pt`); consider Git LFS.

## Architecture Overview
- Request → `app.py` (route) → `ImageProcessor` → `RealModelLoader` (YOLO) → `ResponseFormatter` → JSON response.
