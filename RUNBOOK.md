# Draft Runbook

This guide covers everything you need to get the Draft application running on your machine, bypassing Python environment headaches by using `uv`.

---

## 🚀 First-Time Setup (New Machines)

Run these commands once to set up the infrastructure, dependencies, and local AI models.

### 1. Install `uv` (The fast Python manager)
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```
*(Restart your terminal after this installs)*

### 2. Pull the Local AI Models
Make sure the Ollama desktop app is running, then pull the necessary models:
```bash
ollama pull llama3
ollama pull nomic-embed-text
```

### 3. Setup the Backend API
Navigate to the API folder, copy the environment file, and install dependencies using `uv`:
```bash
cd draft-api
cp .env.example .env

# Open the .env file and add your PINECONE_API_KEY
# Then install dependencies automatically into a virtual environment:
uv pip install -r requirements.txt
uv pip install httpx httpcore ollama --upgrade
```

### 4. Setup the Frontend Web App
Navigate to the web folder and install Node packages:
```bash
cd ../draft-web
npm install
```

---

## ☀️ Daily Startup

Every time you sit down to work on the project, you need to start both the backend API and the frontend dashboard. 

**Terminal 1: Start the Backend**
```bash
cd draft-api

# uv run automatically handles activating the virtual environment for you!
uv run uvicorn main:app --reload
```
*Wait ~10 seconds for the "Application startup complete" message.*

**Terminal 2: Start the Frontend**
```bash
cd draft-web
npm run dev
```

### Accessing the App
- **Dashboard UI:** [http://localhost:3000](http://localhost:3000)
- **API Swagger Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
