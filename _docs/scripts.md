## Development Guide

### Docker Requirements

This project uses **Docker Compose V2**.

### Ubuntu / Debian / Pop!_OS

Install Docker Compose V2:

```bash
sudo apt update
sudo apt install -y docker-compose-v2
```

Verify the installation:

```bash
docker compose version
```

If the command returns the Docker Compose version, the installation is successful.

---

### Setup Environment Variables

#### Backend:

```bash
cd backend
cp .env.example .env
```
#### Frontend:

```bash
cd frontend
cp .env.example .env.local
```
#### structure:

```text
project/
├── backend/
│   ├── .env.example
│   ├── .env              # ← Copy from .env.example
│   └── Dockerfile
├── frontend/
│   ├── .env.example
│   ├── .env.local        # ← Copy from .env.example
│   ├── Dockerfile
│   └── Dockerfile.build.local
└── docker-compose.local.yml
```
### Docker (Local)

Start:

```bash
docker compose -f docker-compose.local.yml up
```

Start in background:

```bash
docker compose -f docker-compose.local.yml up -d
```

Stop:

```bash
docker compose -f docker-compose.local.yml down
```

#### Seed Database (Docker)

```bash
docker container list --format "table {{.Names}}" | grep backend
docker exec -it <backend-container-name> npm run seed:faker
```

---

### Backend (Local)

Start development server:

```bash
npm run start:dev
```

#### Seed Database

```bash
npm run seed:faker
```

---

### Frontend (Local)

Start development server:

```bash
npm run dev
```

---

## Production Build (Without Docker)

### Backend

Build:

```bash
npm run build
```

Run:

```bash
npm run start:prod
```

Available endpoints:

* [http://localhost:3000/api](http://localhost:3000/api)
* [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
* [http://localhost:3000/api/docs-json](http://localhost:3000/api/docs-json)

---

### Frontend

Build:

```bash
npm run build
```

Run:

```bash
npm start
```

Available at:

* [http://localhost:3001](http://localhost:3001)

---
