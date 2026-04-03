# Freelancer Marketplace App

Full-stack implementation based on your PDF plan.

## Stack
- Backend: Java 17, Spring Boot, Spring Security, Hibernate/JPA, Liquibase
- Database: PostgreSQL
- Cache: Redis
- Frontend: React + Vite
- DevOps: Docker + Docker Compose

## Implemented Features
- JWT authentication with BCrypt password hashing
- Role-based access (`CLIENT`, `FREELANCER`)
- Task management (`POST /api/tasks`, `GET /api/tasks`)
- Applications (`POST /api/tasks/{id}/apply`, `POST /api/applications/{id}/accept`)
- Messaging (`POST /api/messages`)
- Payments basic (`POST /api/payments`)
- Reviews (`POST /api/reviews`)
- Pagination (`GET /api/tasks?page=0&size=10`)
- Redis cache for task listing
- Basic IP rate limiting for `/api/**`
- Liquibase migrations for `users`, `tasks`, `applications`, `messages`, `payments`, `reviews`

## Run From Scratch (Step-by-step)

### 1. Prerequisites
Install these first:
- Java 17+
- Maven 3.9+
- Node.js 18+
- Docker Desktop

### 2. Start DB + Redis + Backend (Docker)
From project root:

```bash
docker compose up --build
```

Backend runs on: `http://localhost:8080`

### Password reset email setup
The forgot-password flow sends a reset link by email. Before starting the backend with Docker, create a `.env` file in the project root based on `.env.example`.

For Gmail:
1. Open your Google account security settings.
2. Turn on 2-Step Verification.
3. Create an App Password for Mail.
4. Put that App Password into `MAIL_PASSWORD` in `.env`.

Example `.env` values:

```env
JWT_SECRET=replace-with-a-long-random-secret
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_16_character_app_password
MAIL_FROM=your_email@gmail.com
APP_BASE_URL=http://localhost:5173
APP_CORS_ALLOWED_ORIGINS=http://localhost:5173
```

After saving `.env`, restart the backend:

```bash
docker compose up --build
```

If you are running the backend with Maven instead of Docker, set the same values as environment variables in PowerShell before starting `mvn spring-boot:run`.

### 3. Start Frontend
Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

Before the first run, create `frontend/.env` from `frontend/.env.example` and keep:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

### 4. Quick API flow
1. Register client: `POST /api/auth/register`
2. Register freelancer: `POST /api/auth/register`
3. Login and get JWT: `POST /api/auth/login`
4. Client creates task: `POST /api/tasks`
5. Freelancer applies: `POST /api/tasks/{id}/apply`
6. Client accepts application: `POST /api/applications/{id}/accept`
7. Exchange messages: `POST /api/messages`
8. Create payment/review: `POST /api/payments`, `POST /api/reviews`

## Notes
- Change `JWT_SECRET` in `docker-compose.yml` for production.
- This is secure starter architecture and can be extended with HTTPS termination + CI/CD.

## Deploy to GitHub, Vercel, and Render

### 1. Push to GitHub
Create a dedicated Git repository from this project folder, then push it to GitHub:

```bash
git init
git add .
git commit -m "Prepare freelancer marketplace for deployment"
git branch -M main
git remote add origin https://github.com/<your-username>/freelancer-marketplace-app.git
git push -u origin main
```

### 2. Deploy the frontend on Vercel
1. Import the GitHub repository into Vercel.
2. Set the Root Directory to `frontend`.
3. Keep the framework preset as `Vite`.
4. Add this environment variable in Vercel:

```env
VITE_API_BASE_URL=https://<your-render-backend>.onrender.com/api
```

5. Deploy the project.

### 3. Deploy the backend on Render
This repo includes [render.yaml](C:\Users\shraddha\Documents\freelancer-marketplace-app\render.yaml), so Render can provision the backend, PostgreSQL, and Redis from a Blueprint.

1. Push the repo to GitHub.
2. In Render, choose `New +` > `Blueprint`.
3. Select the GitHub repository.
4. Render will create:
   - `freelancer-marketplace-backend`
   - `freelancer-marketplace-db`
   - `freelancer-marketplace-redis`
5. In Render, provide values for:
   - `MAIL_HOST`
   - `MAIL_USERNAME`
   - `MAIL_PASSWORD`
   - `MAIL_FROM`
   - `APP_BASE_URL`
   - `APP_CORS_ALLOWED_ORIGINS`

Recommended values:

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_gmail_app_password
MAIL_FROM=your_email@gmail.com
APP_BASE_URL=https://<your-vercel-site>.vercel.app
APP_CORS_ALLOWED_ORIGINS=https://<your-vercel-site>.vercel.app
```

### 4. Reconnect the frontend to the live backend
After the Render backend is live, update the Vercel environment variable:

```env
VITE_API_BASE_URL=https://<your-render-backend>.onrender.com/api
```

Then redeploy the Vercel project so the frontend points to the production API.
