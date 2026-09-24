# Freelancer Marketplace — Interview Preparation Kit

A complete, code-grounded walkthrough of the project: what it does, the tech used, how each layer works, the full request/business flows, and the questions you are most likely to be asked (with answers).

> Everything below reflects the actual code in this repository, not generic theory.

---

## 1. One-line pitch (memorize this)

> "It's a full-stack freelancer marketplace — like a mini Upwork. Clients post projects, freelancers submit proposals, clients accept one, funds are held in escrow (via real PayPal sandbox), the work gets done, funds are released, and the client leaves a rating. I built the backend as a stateless REST API with Spring Boot, Spring Security + JWT, and Spring Data JPA on PostgreSQL, and the frontend as a React (Vite) single-page app. It's deployed on Render — Dockerized backend, static frontend, managed PostgreSQL — with a PayPal sandbox payment integration."

---

## 2. Tech stack (what and why)

### Backend
| Area | Technology | Version |
|---|---|---|
| Language | Java | 21 |
| Framework | Spring Boot | 3.4.2 |
| Web | Spring Web (Spring MVC, REST) | managed by Boot |
| Persistence | Spring Data JPA + Hibernate | managed by Boot |
| Security | Spring Security | managed by Boot |
| Auth tokens | JJWT (io.jsonwebtoken) | 0.12.6 |
| Validation | Bean Validation (Jakarta) | managed by Boot |
| HTTP client (PayPal) | Spring `RestClient` | Spring 6 |
| DB (prod) | PostgreSQL | driver runtime |
| DB (local fallback) | H2 in-memory | runtime |
| Boilerplate | Lombok | 1.18.44 |
| API docs | springdoc-openapi (Swagger UI) | 2.8.4 |
| Ops | Spring Boot Actuator | managed by Boot |
| Build | Maven (wrapper included) | 3.9.6 |

### Frontend
| Area | Technology | Version |
|---|---|---|
| Library | React | 18.3 |
| Build tool | Vite | 6 |
| Routing | react-router-dom | 6.28 |
| HTTP client | axios | 1.7 |
| Styling | Tailwind CSS | 3.4 |
| Animation | framer-motion | 11 |
| Icons | react-icons | 5 |

### Why these choices (be ready to justify)
- **Spring Boot** — fast to build production-grade REST APIs, huge ecosystem, opinionated defaults.
- **PostgreSQL over MongoDB** — the data is highly **relational** (users ↔ roles, projects ↔ clients, proposals ↔ projects + freelancers, payments, reviews, many-to-many skills). Foreign keys, joins, and unique constraints map naturally; a document DB would force denormalization and lose referential integrity.
- **REST over GraphQL** — resource/CRUD-oriented app. REST is simpler to build, cache, and debug. GraphQL pays off with many client types and deeply nested, client-varying queries — not this case.
- **JWT (stateless) over sessions** — no server-side session store, scales horizontally, works cleanly with a separately-hosted SPA.
- **React + Vite** — component-based UI, fast dev/build; outputs a static `dist/` that hosts cheaply.

---

## 3. High-level architecture

```
┌────────────────────────┐        HTTPS / JSON        ┌──────────────────────────┐
│   React SPA (Vite)     │  ───────────────────────►  │   Spring Boot REST API   │
│   Static site on Render│   Authorization: Bearer     │   Docker web service     │
│   axios + JWT in       │  ◄───────────────────────  │   on Render              │
│   localStorage         │                             └───────┬──────────┬───────┘
└────────────────────────┘                        JPA/Hibernate │          │ RestClient
                                                                ▼          ▼
                                                   ┌───────────────┐  ┌──────────────┐
                                                   │ PostgreSQL     │  │ PayPal API   │
                                                   │ (Render)       │  │ (sandbox)    │
                                                   └───────────────┘  └──────────────┘
```

- Frontend and backend are **separate deployments**, communicating over HTTP/JSON.
- Backend is **stateless** — every request carries a JWT; no session.
- CORS on the backend explicitly allows the frontend origin (trimmed, comma-separated).
- The backend calls **PayPal's REST API v2 (sandbox)** for real payment orders.

### Backend layered architecture
```
Controller  →  Service  →  Repository  →  Database
   (REST)      (business    (Spring Data JPA)   (PostgreSQL)
               logic + @Transactional)
        DTOs  ◄──────────────  Entities
```
Packages under `com.freelancerhub.marketplace`:
- `controller` — `AuthController`, `ProjectController`, `ProposalController`, `ProfileController`, `PaymentController`, `ReviewController`, `CategoryController`, `HealthController`
- `service` — `AuthService`, `ProjectService`, `ProposalService`, `ProfileService`, `PaymentService`, `PayPalService`, `ReviewService`
- `repository` — Spring Data JPA interfaces (User, Role, FreelancerProfile, ClientProfile, Project, Proposal, Payment, Review, Category, Skill)
- `entity` — JPA entities + `BaseEntity`
- `dto` — request/response objects
- `security` — `SecurityConfig`, `JwtUtil`, `JwtAuthenticationFilter`, `CustomUserDetailsService`
- `exception` — `GlobalExceptionHandler` + custom exceptions
- `config` — `AppConfig` (RestClient bean), `DataSeeder`

**Why layered?** Separation of concerns: controllers handle HTTP, services hold rules + transactions, repositories talk to the DB. DTOs decouple the API contract from the schema (so the password hash is never serialized).

---

## 4. Data model (entities & relationships)

All entities extend **`BaseEntity`**: `id` (IDENTITY), `createdAt` (`@CreationTimestamp`), `updatedAt` (`@UpdateTimestamp`).

### Entities
- **User** — firstName, lastName, username (unique), email (unique), password (BCrypt hash), bio, `avatarUrl` (TEXT, base64 image), location, active; **ManyToMany** to `Role` via `user_roles`.
- **Role** — enum `name` (CLIENT, FREELANCER, ADMIN).
- **FreelancerProfile** — **OneToOne** to User; title, overview, hourlyRate, experienceLevel, availability, yearsOfExperience, portfolio/LinkedIn/GitHub URLs, **ManyToMany** Skills, `averageRating`, `totalProjects`, `completedProjects`.
- **ClientProfile** — **OneToOne** to User; companyName, industry, website, description, location, totalProjectsPosted, `totalSpent`, averageRating.
- **Project** — title, description, budget, deadline, status (OPEN/IN_PROGRESS/COMPLETED/CANCELLED), experienceLevel; **ManyToOne** client (User), **ManyToOne** Category, **ManyToMany** Skills, proposalCount.
- **Proposal** — **ManyToOne** Project, **ManyToOne** freelancer (User); coverLetter, proposedPrice, estimatedDays, status (SUBMITTED/SHORTLISTED/ACCEPTED/REJECTED/WITHDRAWN). **Unique (project_id, freelancer_id)** — no double-apply.
- **Payment** *(escrow)* — **ManyToOne** project, client, freelancer, proposal; amount, status (PENDING_PAYMENT/HELD/RELEASED/REFUNDED), `paypalOrderId`, releasedAt. **Unique per project.**
- **Review** — **ManyToOne** project, reviewer (client), freelancer; rating (1-5), comment. **Unique per project.**
- **Category** — name, description. **Skill** — name, **ManyToOne** Category.

### Relationships in words
- A User has Roles (many-to-many; one role in practice).
- A freelancer User has one FreelancerProfile; a client User has one ClientProfile.
- A client posts many Projects; a Project has one Category and many Skills.
- `Proposal` joins Project ↔ freelancer with extra fields; one per (project, freelancer).
- `Payment` is one-per-project escrow record; `Review` is one-per-project rating.

---

## 5. REST API reference (grouped by controller)

Base path `/api`. `[public]` no auth, `[auth]` JWT required, `[role]` role-restricted.

### Auth — `/api/auth`
| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | public | Register (CLIENT/FREELANCER), returns JWT |
| POST | `/api/auth/login` | public | Authenticate, returns JWT |

### Projects — `/api/projects`
| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/projects` | public | List OPEN projects (paged) |
| GET | `/api/projects/search` | public | Search (keyword/category/budget) |
| GET | `/api/projects/{id}` | public | Project details |
| POST | `/api/projects` | auth (CLIENT) | Create project |
| GET | `/api/projects/my` | auth | Client's own projects |
| PATCH | `/api/projects/{id}/status` | auth | Update status (release/refund escrow hooks) |

### Proposals — `/api`
| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/projects/{projectId}/proposals` | auth (FREELANCER) | Submit proposal |
| GET | `/api/projects/{projectId}/proposals` | auth (owner) | View proposals |
| GET | `/api/proposals/my` | auth | My proposals |
| POST | `/api/proposals/{id}/accept` | auth (owner) | Accept (holds/creates escrow) |
| POST | `/api/proposals/{id}/reject` | auth (owner) | Reject |
| POST | `/api/proposals/{id}/withdraw` | auth (FREELANCER) | Withdraw own |

### Profiles — `/api`
| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/freelancers` | public | Directory (search/filter, paged) |
| GET | `/api/freelancers/{id}` | public | Public freelancer profile |
| GET/PUT | `/api/freelancers/me` | auth | Own freelancer profile |
| GET/PUT | `/api/clients/me` | auth | Own client profile |
| GET | `/api/clients/{userId}/public` | public | Public client + their projects |
| GET | `/api/users/me` | auth | Current user basic profile |

### Payments (escrow + PayPal) — `/api/payments`
| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/payments/summary` | auth | Held/spent/pending/earned totals |
| GET | `/api/payments/client` | auth | Payments as payer |
| GET | `/api/payments/freelancer` | auth | Payments as payee |
| GET | `/api/payments/project/{id}` | public | Escrow status for a project |
| GET | `/api/payments/paypal/enabled` | public | Is real PayPal on? |
| POST | `/api/payments/paypal/create/{projectId}` | auth (CLIENT) | Create PayPal order → approval URL |
| POST | `/api/payments/paypal/capture/{projectId}` | auth (CLIENT) | Capture after approval → escrow HELD |

### Reviews — `/api`
| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/projects/{projectId}/reviews` | auth (owner) | Leave review (project must be COMPLETED) |
| GET | `/api/freelancers/{id}/reviews` | public | A freelancer's reviews |
| GET | `/api/projects/{id}/review` | public | A project's review |

### Other
| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/categories/**` | public | Categories/skills |
| GET | `/api/health` | public | Health check |

---

## 6. Security & authentication

### Building blocks
- **`SecurityConfig`** — `SecurityFilterChain`: CORS on, **CSRF disabled** (stateless JWT, not cookies), session `STATELESS`, URL rules (public vs authenticated vs `hasRole("ADMIN")`), registers `JwtAuthenticationFilter` before the username/password filter, BCrypt password encoder.
- **`JwtUtil`** — creates/parses tokens with JJWT. Subject = email, `role` claim, issuedAt, expiration; signed HMAC-SHA with a secret from `app.jwt.secret`.
- **`JwtAuthenticationFilter`** — `OncePerRequestFilter`. Skips `/api/auth/**`, extracts the `Bearer` token, validates, loads the user via `CustomUserDetailsService`, sets the `Authentication` in the `SecurityContextHolder`.
- **`CustomUserDetailsService`** — loads a `User` by email → Spring Security `UserDetails` with authorities from roles.

### Register flow
1. `POST /api/auth/register` (name, email, password, role).
2. `AuthService.register`: reject duplicate email; validate role (no self-register as ADMIN); derive username from email; **BCrypt-hash** password; save User with role.
3. Generate JWT, return `AuthResponse`. (Profile rows are created lazily when the user first opens their profile.)

### Login flow
1. `POST /api/auth/login`.
2. `AuthService.login` → Spring Security `AuthenticationManager.authenticate(...)` (BCrypt verify).
3. On success, generate JWT, return `AuthResponse`.

### Authenticated request
Client sends `Authorization: Bearer <token>` → filter validates + populates context → controller reads `auth.getName()` (email) → service does the work.

**Why CSRF is disabled:** CSRF guards cookie-based sessions. This API is stateless and authenticates via a Bearer header (not auto-sent cross-site), so CSRF isn't applicable.

---

## 7. Core business flows

### A. Freelancer becomes discoverable
The directory query filters `WHERE title IS NOT NULL`. A new freelancer starts with a null title, so they don't appear until they set a professional title via `PUT /api/freelancers/me`. Deliberate — don't show empty profiles to clients.

### B. Client posts a project
`POST /api/projects` → `ProjectService.createProject` sets the client, status OPEN, links category/skills, increments the client's posted-project counter.

### C. Proposal lifecycle (know this cold)
- **Submit** (`@Transactional`): must be a FREELANCER, project OPEN, not your own project, no duplicate (enforced in code + DB unique constraint). Save as SUBMITTED, bump proposalCount.
- **Accept** (`@Transactional`): only owner, only while OPEN → set chosen ACCEPTED, **auto-reject all other SUBMITTED proposals**, move project to IN_PROGRESS. Then **escrow is created** (see D).
- **Reject / Withdraw**: owner rejects; freelancer withdraws own SUBMITTED proposal.

### D. Escrow payments (the money flow)
Two modes, controlled by whether PayPal is enabled (`paypal.enabled` + credentials present):

**Simulated mode (PayPal off):** on accept, `PaymentService.holdEscrow` creates a `Payment` with status HELD immediately (no real money).

**Real PayPal mode (PayPal on):**
1. On accept, escrow is **not** auto-held.
2. Client clicks "Fund Escrow with PayPal" → `POST /api/payments/paypal/create/{projectId}` → `PaymentService.initiatePayPalPayment` → `PayPalService.createOrder` calls **PayPal Orders API v2** (`POST /v2/checkout/orders`, intent=CAPTURE). A `Payment` row is saved as **PENDING_PAYMENT** with the returned `paypalOrderId`. The approval URL is returned.
3. Client is redirected to PayPal, approves with a **sandbox buyer account**.
4. PayPal redirects back to `/projects/{id}?paypal=return` → frontend calls `POST /api/payments/paypal/capture/{projectId}` → `PayPalService.captureOrder` (`POST /v2/checkout/orders/{id}/capture`). On `COMPLETED`, `Payment` becomes **HELD**.

**Release / refund (on project status change):** `ProjectService.updateProjectStatus` → COMPLETED calls `releaseEscrow` (status RELEASED, updates client `totalSpent` + freelancer `completedProjects`); CANCELLED calls `refundEscrow` (status REFUNDED). Note: real PayPal payout to the freelancer is **simulated** (release is a status change) — sandbox create+capture is real, payouts are out of scope.

### E. Reviews & ratings
`POST /api/projects/{id}/reviews` → `ReviewService.createReview`: only the owner, only when project COMPLETED, only once (unique per project); the reviewed freelancer is the one whose proposal was ACCEPTED. After saving, the freelancer's `averageRating` is **recomputed** from all their reviews and saved to their profile. Ratings show on the profile page, the Find Talent cards, and the project page.

### F. Search
- **Projects:** `searchProjects` filters keyword/category/budget with paging.
- **Freelancers:** native SQL with `CAST(:param AS text) IS NULL OR ...`. **Why native + CAST?** In PostgreSQL, the JPQL `:param IS NULL OR col = :param` pattern can trigger a type-inference error (`lower(bytea) does not exist`) when a bound param is null. Casting to `text` makes types explicit so each filter is optional without erroring.

---

## 8. PayPal sandbox integration (Level 2 — a great talking point)

- **`PayPalService`** (marketplace backend) reuses the pattern from a separate standalone PayPal provider service in the repo:
  - **Auth:** OAuth `client_credentials` with HTTP Basic auth (client id + secret) → `POST /v1/oauth2/token` → access token.
  - **Create order:** `POST /v2/checkout/orders`, intent=CAPTURE, purchase_units with amount + currency, `experience_context` with return/cancel URLs; header `PayPal-Request-Id` (idempotency). Returns order id + `payer-action`/`approve` approval link.
  - **Capture:** `POST /v2/checkout/orders/{id}/capture` (empty body) → status COMPLETED.
- **HTTP client:** Spring `RestClient` (bean in `AppConfig`), JSON via Jackson maps.
- **Config keys** (env-driven, never hardcoded): `paypal.enabled`, `paypal.client-id`, `paypal.client-secret`, `paypal.oauth-url`, `paypal.create-order-url`, `paypal.capture-order-url`, `paypal.currency`, `paypal.frontend-return-base`.
- **Idempotency:** capture is safe to call twice — if PayPal reports `ORDER_ALREADY_CAPTURED`, the backend treats the escrow as HELD; the frontend guards against a double-fire and hides the "already captured" message.
- **Graceful fallback:** if `paypal.enabled` is false or credentials are missing, the app safely uses simulated escrow — no breakage.

**Interview angle:** "I integrated a real external payment gateway (PayPal Orders API v2) with the OAuth → create-order → redirect-approve → capture flow, made the capture idempotent, and kept a feature flag so it degrades gracefully to a simulated escrow when credentials aren't configured."

---

## 9. Cross-cutting concerns

- **Global exception handling** — `GlobalExceptionHandler` (`@RestControllerAdvice`) maps custom exceptions to clean HTTP responses (404 / 400 / 409) via a consistent `ApiError` body.
- **DataSeeder** (`CommandLineRunner`) — seeds **roles, categories, skills** (NOT users). That's why there are no default logins.
- **Validation** — request DTOs use `@NotBlank`, `@Email`, `@Size`, `@Min/@Max`; controllers use `@Valid`.
- **DTO mapping** — services map entities → DTOs by hand (builder pattern); entities never leak (no password hash in responses).
- **Profiles** — `spring.profiles.active` defaults `local`; production uses `prod` (env-driven DB creds, JWT secret, CORS, PayPal).
- **Enum-as-VARCHAR gotcha** — `Payment.status` is mapped `@JdbcTypeCode(SqlTypes.VARCHAR)` so adding a new enum value (e.g. PENDING_PAYMENT) doesn't clash with a stale DB CHECK constraint (`ddl-auto=update` won't alter check constraints).

---

## 10. Frontend deep-dive

### Structure (`frontend/src`)
- `main.jsx` — entry; wraps app in router + `AuthProvider`.
- `App.jsx` — routes + `Navbar`/`Footer` layout.
- `pages/` — Home, Login, Register, Projects, ProjectDetails, CreateProject, Freelancers, FreelancerDetails, ClientDetails, and `dashboard/` (Dashboard, ClientDashboard, FreelancerDashboard, FreelancerProfilePage, ClientProfilePage).
- `components/` — layout (Navbar, Footer), ProtectedRoute, ProposalList, ProposalModal, Avatar, AvatarUpload, StarRating, ui/StatusPill.
- `context/AuthContext.jsx` — global auth state.
- `services/` — api.js (axios), authService, projectService, proposalService, profileService, paymentService, reviewService.

### Routing (`App.jsx`)
- **Public:** `/`, `/login`, `/register`, `/projects`, `/freelancers`, `/freelancers/:id`, `/clients/:id`, `/projects/:id`.
- **Protected:** `/dashboard`, `/projects/new` (CLIENT), `/dashboard/profile` (FREELANCER), `/dashboard/company` (CLIENT) — via `<ProtectedRoute>`.

### Route protection (`ProtectedRoute.jsx`)
Reads `user`/`loading` from context; loader while resolving; redirect to `/login` if unauthenticated; redirect to `/dashboard` if role doesn't match.

### Auth state (`AuthContext.jsx`)
Restores user from `localStorage` on mount; exposes login/register/logout/refreshUser/isAuthenticated.

### API layer (`services/api.js`)
- Base URL: `VITE_API_BASE_URL ? \`${...}/api\` : '/api'`. Dev uses the Vite proxy → `localhost:8080`; prod points at the Render backend.
- Request interceptor attaches `Authorization: Bearer <token>`.
- Response interceptor: on 401, clears token/user and redirects to `/login`.

### Dashboard tabs (recent addition)
- **Client dashboard:** project tabs — All / Open / In Progress / Completed / Cancelled (with counts).
- **Freelancer dashboard:** proposal tabs — All / Pending / Active / Completed / Rejected. "Active" vs "Completed" uses the `projectStatus` field added to `ProposalDto`, so a finished project moves out of Active automatically.

---

## 11. Deployment

- **Backend:** Docker web service on Render. Multi-stage Dockerfile (Temurin 21 build → JRE run). `server.port=${PORT:8080}`, `server.address=0.0.0.0`. Root dir `backend`.
- **Frontend:** Render Static Site. Build `npm install && npm run build`, publish `dist`, env `VITE_API_BASE_URL` = backend URL, plus a rewrite rule `/* → /index.html` (SPA deep links).
- **Database:** Render managed PostgreSQL; `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` in prod profile.
- **CORS:** env `APP_CORS_ALLOWED_ORIGINS`; `SecurityConfig` splits on comma and **trims** each origin.
- **PayPal on Render:** `PAYPAL_ENABLED`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_CURRENCY`, `PAYPAL_FRONTEND_RETURN_BASE` (env vars — secrets never committed).
- **Cold start:** free tier sleeps after ~15 min; a UptimeRobot keep-alive pings `/api/health` every 5 min. First cold hit ~50s.

---

## 12. Likely interview questions (with crisp answers)

**Q: REST or GraphQL — why?** Resource/CRUD app; REST is simpler to build/cache/debug. GraphQL shines with many clients + nested queries — not this case.

**Q: PostgreSQL or MongoDB?** Domain is relational (users↔roles, projects↔clients, proposals, payments, reviews, skills). FK/joins/unique constraints fit a relational DB.

**Q: How does auth work?** Stateless JWT. On login/register we sign a token (email + role). Each request sends it as a Bearer header; a OncePerRequestFilter validates it and populates the security context. CSRF disabled since auth is header-based.

**Q: How do you prevent double-applying to a project?** Two layers: a check in `submitProposal` plus a DB unique constraint on (project_id, freelancer_id).

**Q: What happens when a client accepts a proposal?** In one transaction: chosen proposal → ACCEPTED, siblings → REJECTED, project → IN_PROGRESS, and escrow is created (HELD if simulated, PENDING_PAYMENT if PayPal).

**Q: Walk me through the PayPal payment.** OAuth token (client_credentials) → create order (intent CAPTURE) → redirect client to PayPal approval → on return, capture the order → on COMPLETED mark escrow HELD. Idempotent capture; feature-flagged with graceful fallback.

**Q: Why `@Transactional`?** Accept/complete touch multiple rows (proposal, siblings, project, payment). Transactions make them atomic.

**Q: How are ratings computed?** On each new review, average all of that freelancer's ratings and persist to `FreelancerProfile.averageRating`.

**Q: Why native SQL for search?** JPQL null-parameter filtering caused a Postgres type error; native SQL with `CAST(:param AS text)` makes types explicit and filters optional.

**Q: How do entities stay out of the API?** Services map entities → DTOs (builder), so sensitive fields never serialize.

**Q: How does the frontend handle expired tokens?** An axios response interceptor catches 401, clears the token, redirects to `/login`.

**Q: How would you scale this?** Stateless backend → multiple instances behind a load balancer; Postgres read replicas + pooling; Redis cache for hot reads; move base64 avatars to object storage/CDN; add a message queue for async work (emails, payouts).

---

## 13. Honest limitations & "what I'd improve" (volunteer these)

- **No automated tests yet** — would add JUnit + Spring test slices, Testcontainers for Postgres, React component tests.
- **PayPal payout is simulated** — real freelancer payouts need the Payouts API + a verified business account + webhooks.
- **No refresh tokens** — fixed-expiry access token; a refresh flow would improve UX/security.
- **Avatars as base64 in TEXT** — bloats the DB; move to object storage, store only a URL.
- **JWT in localStorage** — XSS-exposed; httpOnly cookies (with CSRF protection) are more secure.
- **No real-time notifications** — proposal/review/payment updates need a refresh; add polling or WebSocket.
- **No rate limiting** on auth endpoints — add to resist brute force.
- **Cold start on free tier** — upgrade the plan or rely on the keep-alive ping.

---

## 14. 60-second whiteboard script (rehearse this)

"A user registers as a client or freelancer — the password is BCrypt-hashed and we return a JWT that the React SPA stores and sends on every request. A client posts a project (starts OPEN and appears in the public list). Freelancers apply with a proposal; a DB unique constraint blocks duplicates. The client accepts one — in a single transaction we mark it ACCEPTED, reject the rest, and move the project to IN_PROGRESS. The client then funds escrow through real PayPal sandbox: we create a PayPal order, redirect them to approve, and capture on return, which marks the escrow HELD. When the client marks the project complete, escrow is released to the freelancer and stats update, and the client can leave a star rating that aggregates onto the freelancer's profile. On the backend it's clean controller → service → repository layering with DTOs, Spring Security + a JWT filter for stateless auth, global exception handling, Spring Data JPA over PostgreSQL, and a RestClient-based PayPal integration. It's deployed on Render — Dockerized backend, static React frontend, managed Postgres — with a keep-alive ping to avoid free-tier cold starts."
