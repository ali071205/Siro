# 🔮 Ghost Protocol v3.0 — Run Commands Reference Guide

This reference guide lists all the commands used to set up, run, seed, test, and deploy the Ghost Protocol multi-agent system.

---

## 🛠️ 1. Environment & Setup Commands

### Virtual Environment Creation
Create and activate an isolated Python 3.12+ environment:
```bash
# Create the virtual environment
python -m venv .venv

# Activate the virtual environment
source .venv/bin/activate
```

### System Dependencies (Linux/Ubuntu)
Install system-level dependencies required by `WeasyPrint` (for PDF rendering) and Playwright:
```bash
# Update package list and install system requirements
sudo apt-get update && sudo apt-get install -y \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libpangocairo-1.0-0 \
    libcairo2 \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    libglib2.0-0 \
    fonts-liberation \
    fontconfig \
    curl \
    git

# Rebuild the system font cache (so WeasyPrint detects installed fonts)
fc-cache -fv
```

### Python Package Installation
Install requirements (optimizing PyTorch download size first):
```bash
# Install CPU-only PyTorch first (saves ~2GB of space)
pip install torch --index-url https://download.pytorch.org/whl/cpu

# Upgrade pip and install the remaining requirements
pip install --upgrade pip
pip install -r requirements.txt
```

### Browser Automation Setup
Download Chromium and its system dependencies via Playwright:
```bash
playwright install chromium
playwright install-deps chromium
```

### Environment File Setup
Create a local `.env` configuration file from the template:
```bash
cp .env.example .env
```

---

## 👤 2. Database Migrations Setup

Ensure your Supabase database is initialized by running the SQL scripts in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query).

### Apply Multi-User Schema
Apply the active v3 multiuser schema (including profile management, leads tracking, and triggers):
* Run the SQL statements found in `schema_v3_multiuser.sql` directly in Supabase SQL Editor.


---

## 🏃 3. Run & Execution Commands

### Start the SaaS Dashboard (Web Server)
Launches the FastAPI web dashboard providing the log UI, statistics, and profile management (default port `8080`):
```bash
python dashboard.py
```
* **URL:** [http://localhost:8080](http://localhost:8080)
* **Admin Interface:** [http://localhost:8080/admin](http://localhost:8080/admin)

*(Alternatively, run it manually with `uvicorn`)*:
```bash
uvicorn dashboard:app --host 0.0.0.0 --port 8080
```

### Start the Scheduler Daemon (Main Orchestrator)
Launches the continuous background loop that runs job discovery, scoring, tailoring, and delivery on a cron-like schedule:
```bash
python main_orchestrator.py
```

---

## 🧪 4. Testing & Verification Commands

### Run Integration Test Pipeline
Runs a mocked, end-to-end cycle (Discovery -> Score -> Tailor -> PDF -> Delivery) capped at 2 jobs to test integration without hitting LLM API rate limits:
```bash
python run_pipeline_test.py
```

### Run Targeted Search Verification
Executes a targeted search for a specific role and saves the raw search results to a dedicated JSON file in `data/searches/`:
```bash
python test_search.py
```

---

## 🐳 5. Docker Deployment Commands

### Build the Docker Image
```bash
docker build -t ghost-protocol .
```

### Run the Docker Container
Binds to port `7860` (Hugging Face default) and passes local environment variables:
```bash
docker run -p 7860:7860 --env-file .env ghost-protocol
```
