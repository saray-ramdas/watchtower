# WatchTower

WatchTower is a Vite frontend with a FastAPI backend for managing AI gateway projects, endpoints, provider keys, PII masking, request blocking, and audit events.

## Prerequisites

- Node.js and npm
- Python 3.9+
- PostgreSQL running locally
- A PostgreSQL database named `watchtower`

The backend currently connects to:

```text
postgresql://localhost/watchtower
```

## Setup

Install frontend dependencies:

```sh
npm install
```

Create and activate a Python virtual environment, then install backend dependencies:

```sh
python -m venv backend/venv
.\backend\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

On macOS/Linux, activate with:

```sh
source backend/venv/bin/activate
```

Create the local backend environment file:

```sh
cp backend/.env.example backend/.env
```

Set `GROQ_API_KEY` in `backend/.env` if you want to use the test endpoint PII masking flow.

## Run

Start the backend API on the port expected by the frontend:

```sh
cd backend
uvicorn main:app --reload --port 8888
```

In a second terminal, start the frontend:

```sh
npm run dev
```

Open the Vite URL shown in the terminal. On first launch, create the initial super admin account from the signup screen.

## Useful Commands

```sh
npm run build
```

```sh
cd backend
uvicorn main:app --reload --port 8888
```

## Project Structure

- `backend/` - FastAPI app, SQLAlchemy models, auth, database setup, proxy and masking endpoints.
- `src/` - Vite frontend pages, API client, UI helpers, and styles.
- `public/` - Static frontend assets.
