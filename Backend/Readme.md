## 🚀 How to Run the Project

### ✅ Option 1: Using Docker Compose (Recommended)

Run the following command in the project root:

```bash
docker compose up --build
```

> This will build the Docker image, run the PostgreSQL container, apply migrations, seed the database, and start the application.

---

### ⚙️ Option 2: Run Locally Without Docker

#### 🛠 Prerequisites

- **Node.js** and **npm** installed
- **PostgreSQL** running locally or in a container

#### 🧱 Step-by-Step

1. **Start PostgreSQL via Docker**

You can run a PostgreSQL container using:

```bash
docker run --name postgresForEventora -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=eventora -p 5432:5432 -d postgres```

2. **Check the `.env` file**

Ensure the environment variables match:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=eventora
POSTGRES_PORT=5432
```

- **Install dependencies**

```bash
npm install
```

- make sure DATABASE_URL=postgresql://postgres:postgres@localhost:5432/eventora?schema=public is set in the .env for the next steps 

- npx prisma migrate deploy

- npx prisma db seed

- **Build the TypeScript project**

```bash
npm run build
```

- **Start the application**

```bash
npm run start
```