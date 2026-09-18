# FreelancerHub — Architecture & Technical Documentation

A full-stack Freelancer Marketplace platform (like a simplified Upwork/Fiverr) where **clients** post projects and **freelancers** submit proposals. Clients review proposals, accept one (which moves the project into progress), and both parties can view each other's profiles and contact one another.

---

## 1. Technology Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Java | 21 | Language (compiled/run on JDK 25) |
| Spring Boot | 3.4.2 | Application framework |
| Spring Web (MVC) | 3.4.2 | REST controllers |
| Spring Data JPA | 3.4.2 | ORM / database access |
| Hibernate | 6.6.x | JPA implementation |
| Spring Security | 3.4.2 | Authentication & authorization |
| JJWT (io.jsonwebtoken) | 0.12.6 | JWT creation & validation |
| Spring Validation | 3.4.2 | Bean validation on request DTOs |
| Spring Boot Actuator | 3.4.2 | Health/metrics endpoints |
| PostgreSQL | 42.7.x driver | Primary database |
| H2 | runtime | Optional in-memory DB for quick local dev |
| Lombok | 1.18.44 | Boilerplate reduction (getters/builders/logging) |
| SpringDoc OpenAPI | 2.8.4 | Swagger UI / API docs |
| Maven | (wrapper) | Build tool |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI library |
| Vite | 6.x | Dev server & bundler |
| React Router DOM | 6.28.0 | Client-side routing |
| Axios | 1.7.9 | HTTP client |
| Tailwind CSS | 3.4.16 | Styling (utility-first) |
| Framer Motion | 11.15.0 | Animations |
| React Icons | 5.4.0 | Icon set |

### Database
- **PostgreSQL** — database name `freelancer_marketplace`, port 5432
- Schema auto-managed by Hibernate (`spring.jpa.hibernate.ddl-auto=update`)

---

## 2. High-Level Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                         BROWSER (User)                          │
└───────────────────────────────┬───────────────────────────────┘
                                │  HTTP (JSON) + JWT in Authorization header
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                 REACT FRONTEND  (Vite, port 5173)               │
│                                                                 │
│  Pages  ──▶  Services (axios)  ──▶  /api/*  (Vite proxy)        │
│  AuthContext (global auth state)                                │
│  ProtectedRoute (route guards by auth + role)                   │
└───────────────────────────────┬───────────────────────────────┘
                                │  proxied to http://localhost:8080
                                ▼
┌───────────────────────────────────────────────────────────────┐
│              SPRING BOOT BACKEND  (port 8080)                   │
│                                                                 │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│   │  Controller  │──▶│   Service    │──▶│  Repository  │        │
│   │  (REST/HTTP) │   │ (business)   │   │ (Spring Data)│        │
│   └──────────────┘   └──────────────┘   └──────┬───────┘        │
│           ▲                                     │                │
│   Security Filter Chain (JWT)                   ▼                │
│   GlobalExceptionHandler                 ┌──────────────┐       │
│   DTOs (request/response)                │  Entities    │       │
│                                          │  (JPA)       │       │
│                                          └──────┬───────┘       │
└─────────────────────────────────────────────────┼──────────────┘
                                                  ▼
                                        ┌──────────────────┐
                                        │   PostgreSQL     │
                                        └──────────────────┘
```

The backend follows the classic **layered architecture**:

**Controller → Service → Repository → Entity → Database**

- Business logic lives in **Services**, never in Controllers.
- JPA entities are never returned directly; everything crosses the boundary as **DTOs**.
- A global exception handler translates exceptions into clean JSON error responses.

---

## 3. Backend — Package Structure & Responsibilities

```
com.freelancerhub.marketplace
├── FreelancerMarketplaceApplication.java   # @SpringBootApplication entry point
├── config/
│   └── DataSeeder.java                      # Seeds roles, categories & skills at startup
├── controller/                              # REST layer (HTTP endpoints)
│   ├── AuthController.java
│   ├── ProjectController.java
│   ├── ProposalController.java
│   ├── ProfileController.java
│   ├── CategoryController.java
│   └── HealthController.java
├── service/                                 # Business logic layer
│   ├── AuthService.java
│   ├── ProjectService.java
│   ├── ProposalService.java
│   └── ProfileService.java
├── repository/                              # Data access (Spring Data JPA)
│   ├── UserRepository.java
│   ├── RoleRepository.java
│   ├── ProjectRepository.java
│   ├── ProposalRepository.java
│   ├── FreelancerProfileRepository.java
│   ├── ClientProfileRepository.java
│   ├── CategoryRepository.java
│   └── SkillRepository.java
├── entity/                                  # JPA entities (DB tables)
│   ├── BaseEntity.java                      # id, createdAt, updatedAt (auditing)
│   ├── User.java
│   ├── Role.java
│   ├── Project.java
│   ├── Proposal.java
│   ├── FreelancerProfile.java
│   ├── ClientProfile.java
│   ├── Category.java
│   └── Skill.java
├── dto/                                     # Data Transfer Objects (API contracts)
│   ├── RegisterRequest.java  LoginRequest.java  AuthResponse.java
│   ├── ProjectDto.java  CreateProjectRequest.java
│   ├── ProposalDto.java  CreateProposalRequest.java
│   ├── FreelancerProfileDto.java  ClientProfileDto.java  UserProfileDto.java
│   ├── PublicClientDto.java
│   └── CategoryDto.java  SkillDto.java
├── security/                                # Authentication & authorization
│   ├── SecurityConfig.java
│   ├── JwtUtil.java
│   ├── JwtAuthenticationFilter.java
│   └── CustomUserDetailsService.java
├── exception/                               # Error handling
│   ├── GlobalExceptionHandler.java
│   ├── ApiError.java
│   ├── ResourceNotFoundException.java
│   ├── BadRequestException.java
│   └── DuplicateResourceException.java
├── event/  notification/  payment/  mapper/ # Reserved for future phases (empty)
```

---

## 4. Key Spring Concepts & Annotations Used

### 4.1 Core Stereotypes (Dependency Injection)
| Annotation | Where | Meaning |
|------------|-------|---------|
| `@SpringBootApplication` | Main class | Enables auto-configuration + component scanning |
| `@RestController` | Controllers | Marks a class as a REST endpoint handler (returns JSON) |
| `@Service` | Services | Business logic component |
| `@Repository` | Repositories | Data access component |
| `@Configuration` | SecurityConfig | Java-based bean configuration |
| `@Component` | Filters, DataSeeder | Generic Spring-managed bean |
| `@Bean` | SecurityConfig | Declares a bean produced by a method |

**Dependency Injection style:** constructor injection via Lombok's `@RequiredArgsConstructor` (all `private final` fields are injected automatically — no `@Autowired` needed).

### 4.2 Web / REST Annotations
| Annotation | Meaning |
|------------|---------|
| `@RequestMapping("/api/...")` | Base path for a controller |
| `@GetMapping`, `@PostMapping`, `@PutMapping`, `@PatchMapping` | HTTP verb mappings |
| `@PathVariable` | Binds a URL segment (e.g. `/projects/{id}`) |
| `@RequestParam` | Binds a query parameter (e.g. `?keyword=react`) |
| `@RequestBody` | Deserializes JSON request body into a DTO |
| `@Valid` | Triggers bean validation on the request DTO |
| `ResponseEntity<T>` | Full control over status code + body |
| `Authentication auth` | Injected current principal (from JWT) |

### 4.3 Persistence / JPA Annotations
| Annotation | Meaning |
|------------|---------|
| `@Entity`, `@Table` | Maps a class to a DB table |
| `@Id`, `@GeneratedValue` | Primary key (auto-increment) |
| `@MappedSuperclass` | `BaseEntity` shares id/timestamps with all entities |
| `@CreationTimestamp`, `@UpdateTimestamp` | Auto-managed audit timestamps |
| `@Column` | Column config (nullable, length, `columnDefinition = "TEXT"`) |
| `@OneToOne`, `@OneToMany`, `@ManyToOne`, `@ManyToMany` | Relationships |
| `@JoinColumn`, `@JoinTable` | Foreign keys and join tables |
| `@Enumerated(EnumType.STRING)` | Stores enums as readable strings |
| `@Transactional` | Wraps a method in a DB transaction (also keeps the Hibernate session open for lazy loading) |

### 4.4 Security Annotations
| Annotation | Meaning |
|------------|---------|
| `@EnableWebSecurity` | Turns on Spring Security |
| `@EnableMethodSecurity` | Enables method-level security |
| `@PreAuthorize("hasRole('ADMIN')")` | Method guard by role (used on admin endpoints) |

### 4.5 Validation Annotations (on request DTOs)
`@NotBlank`, `@NotNull`, `@Email`, `@Size`, `@Min`, `@DecimalMin` — validated automatically when `@Valid` is present; violations are turned into a 400 response by the global handler.

### 4.6 Lombok Annotations
`@Data`, `@Getter`, `@Setter`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@RequiredArgsConstructor`, `@Slf4j` (logger).

---

## 5. Security Model (JWT + Spring Security)

### Flow
```
1. Register/Login → AuthService verifies credentials (BCrypt) → JwtUtil.generateToken()
2. Response: { token, userId, email, firstName, lastName, role }
3. Frontend stores token in localStorage; axios attaches "Authorization: Bearer <token>"
4. On every request → JwtAuthenticationFilter:
       - extracts token from header
       - JwtUtil.validateToken() checks signature + expiry
       - loads user via CustomUserDetailsService
       - sets Authentication in the SecurityContext
5. SecurityConfig authorizes the request based on path + role
```

### Key classes
- **JwtUtil** — `generateToken(email, role)`, `validateToken(token)`, `getEmailFromToken(token)`. Signs with an HMAC-SHA key from `app.jwt.secret`; 24h expiry.
- **JwtAuthenticationFilter** — a `OncePerRequestFilter` that runs before Spring's auth filter; skips `/api/auth/**` via `shouldNotFilter()`.
- **CustomUserDetailsService** — loads a `User` by email and maps roles to `ROLE_*` authorities for Spring Security.
- **SecurityConfig** — stateless session policy, CSRF disabled (token-based), CORS configured for `localhost:5173`, BCrypt password encoder, route authorization rules.

### Route authorization rules (SecurityConfig)
| Path | Access |
|------|--------|
| `/api/auth/**`, `/api/health`, Swagger | Public |
| `GET /api/projects/**`, `/api/freelancers/**`, `/api/clients/*/public`, `/api/categories/**`, `/api/skills/**` | Public (read) |
| `/api/users/me`, `/api/freelancers/me`, `/api/clients/me` | Authenticated |
| `/api/admin/**` | ADMIN only |
| everything else | Authenticated |

Passwords are hashed with **BCrypt** and never stored or returned in plain text.

---

## 6. Data Model (Entities & Relationships)

```
User (1) ─── (1) FreelancerProfile ─── (M:N) Skill ─── (M:1) Category
  │
  ├── (1:1) ClientProfile
  ├── (M:N) Role
  ├── (1:M) Project        [as client]
  └── (1:M) Proposal        [as freelancer]

Project (M:1) User [client]
Project (M:1) Category
Project (M:N) Skill
Project (1:M) Proposal

Proposal (M:1) Project
Proposal (M:1) User [freelancer]
```

### Entities
- **BaseEntity** — abstract `@MappedSuperclass` with `id`, `createdAt`, `updatedAt`. Every entity extends it.
- **User** — firstName, lastName, username, email (unique), password (BCrypt), bio, avatarUrl (TEXT — stores base64 image), location, active, roles (M:N).
- **Role** — enum `RoleName { CLIENT, FREELANCER, ADMIN }`.
- **FreelancerProfile** — title, overview, hourlyRate, experienceLevel, availability, yearsOfExperience, portfolio/linkedin/github URLs, skills (M:N), averageRating, totalProjects, completedProjects.
- **ClientProfile** — companyName, industry, companyWebsite, description, location, totalProjectsPosted, totalSpent, averageRating.
- **Project** — title, description, budget, deadline, status `{OPEN, IN_PROGRESS, COMPLETED, CANCELLED}`, experienceLevel, client (M:1), category (M:1), skills (M:N), proposalCount.
- **Proposal** — project (M:1), freelancer (M:1), coverLetter, proposedPrice, estimatedDays, status `{SUBMITTED, SHORTLISTED, ACCEPTED, REJECTED, WITHDRAWN}`. Unique constraint on (project, freelancer) — a freelancer can only apply once per project.
- **Category** — name, description, skills (1:M).
- **Skill** — name, category (M:1).

---

## 7. Business Logic — Service Layer Methods

### AuthService
- `register(RegisterRequest)` — rejects duplicate email, blocks self-registering as ADMIN, hashes password with BCrypt, assigns role, issues JWT.
- `login(LoginRequest)` — authenticates via `AuthenticationManager`, issues JWT.

### ProjectService
- `createProject(email, req)` — verifies user is a CLIENT, resolves category & skills, saves project as OPEN, increments client's `totalProjectsPosted`.
- `getOpenProjects(page, size)` — paginated list of OPEN projects.
- `searchProjects(keyword, categoryId, minBudget, maxBudget, page, size)` — filtered search (native SQL with explicit casts for null-safe filtering in PostgreSQL).
- `getProjectById(id)`, `getMyProjects(email)`.
- `updateProjectStatus(id, email, status)` — owner-only, validates the status value.

### ProposalService
- `submitProposal(projectId, email, req)` — enforces: user is FREELANCER, project is OPEN, not their own project, no duplicate proposal. Increments `proposalCount`.
- `getProposalsForProject(projectId, email)` — owner-only view.
- `getMyProposals(email)` — freelancer's own proposals.
- `acceptProposal(id, email)` — owner-only. Sets proposal ACCEPTED, **auto-rejects all other proposals**, moves project to IN_PROGRESS.
- `rejectProposal(id, email)` — owner-only.
- `withdrawProposal(id, email)` — freelancer-only, only if still SUBMITTED.

### ProfileService
- Get/update freelancer & client profiles (auto-creates an empty profile on first access).
- `searchFreelancers(...)` — public directory with filters (native SQL, null-safe).
- `getFreelancerProfileById(id)` — public freelancer profile.
- `getPublicClientProfile(userId)` — public client profile **+ their posted projects** (used by "About the Client").

---

## 8. REST API Reference

### Auth (`/api/auth`) — public
| Method | Endpoint | Body |
|--------|----------|------|
| POST | `/register` | firstName, lastName, email, password, role |
| POST | `/login` | email, password |

### Projects (`/api/projects`)
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/` | Public — open projects (paged) |
| GET | `/search?keyword&categoryId&minBudget&maxBudget` | Public |
| GET | `/{id}` | Public |
| POST | `/` | CLIENT |
| GET | `/my` | Authenticated |
| PATCH | `/{id}/status` | Owner |

### Proposals (`/api`)
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/projects/{projectId}/proposals` | FREELANCER |
| GET | `/projects/{projectId}/proposals` | Project owner |
| GET | `/proposals/my` | FREELANCER |
| POST | `/proposals/{id}/accept` | Owner |
| POST | `/proposals/{id}/reject` | Owner |
| POST | `/proposals/{id}/withdraw` | Freelancer |

### Profiles (`/api`)
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/users/me` | Authenticated |
| GET/PUT | `/freelancers/me` | Authenticated |
| GET/PUT | `/clients/me` | Authenticated |
| GET | `/freelancers` | Public — directory (filters) |
| GET | `/freelancers/{id}` | Public |
| GET | `/clients/{userId}/public` | Public — profile + projects |

### Categories & Skills (`/api`)
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/categories` | Public |
| GET | `/skills` | Public |
| GET | `/categories/{id}/skills` | Public |
| POST | `/admin/categories`, `/admin/skills` | ADMIN |

### Health — `GET /api/health` (public), plus Actuator at `/actuator/*`.

---

## 9. Frontend Architecture

```
src/
├── main.jsx                 # Entry: wraps App in <BrowserRouter> + <AuthProvider>
├── App.jsx                  # Route definitions (public + protected)
├── index.css                # Tailwind directives + design tokens
│
├── context/
│   └── AuthContext.jsx      # Global auth state (user, login, register, logout, refreshUser)
│
├── components/
│   ├── ProtectedRoute.jsx   # Guards routes by auth + optional role
│   ├── Avatar.jsx           # Image-or-initials avatar
│   ├── AvatarUpload.jsx     # Photo picker (downscales to 256px JPEG data URL)
│   ├── ProposalModal.jsx    # Freelancer's "submit proposal" form
│   ├── ProposalList.jsx     # Client's accept/reject proposal list
│   └── layout/
│       ├── Navbar.jsx       # Role-aware nav + user menu
│       └── Footer.jsx
│
├── pages/
│   ├── Home.jsx             # Landing page
│   ├── Login.jsx  Register.jsx
│   ├── Projects.jsx         # Browse/search projects
│   ├── ProjectDetails.jsx   # Project view + proposal actions + status controls
│   ├── CreateProject.jsx    # Client posts a project
│   ├── Freelancers.jsx      # Freelancer directory
│   ├── FreelancerDetails.jsx# Public freelancer profile + contact
│   ├── ClientDetails.jsx    # Public client profile + their projects + contact
│   └── dashboard/
│       ├── Dashboard.jsx            # Role router → Client/Freelancer dashboard
│       ├── ClientDashboard.jsx
│       ├── FreelancerDashboard.jsx
│       ├── ClientProfilePage.jsx    # Edit company profile + photo
│       └── FreelancerProfilePage.jsx# Edit freelancer profile + photo
│
└── services/                # Axios API wrappers
    ├── api.js               # Axios instance + JWT interceptor + 401 redirect
    ├── authService.js       # register, login, logout, token/user helpers
    ├── projectService.js    # project CRUD + search
    ├── proposalService.js   # submit/accept/reject/withdraw
    └── profileService.js    # profiles, directory, categories, skills
```

### Frontend patterns
- **AuthContext + useAuth()** — React Context provides global auth state; `user` is loaded from localStorage on mount. `refreshUser(patch)` merges partial updates (e.g. new avatar) so the navbar updates instantly.
- **ProtectedRoute** — redirects to `/login` when unauthenticated; redirects to `/dashboard` when the role doesn't match a role-restricted route.
- **Axios interceptors** (`api.js`) — request interceptor attaches `Bearer <token>`; response interceptor clears the session and redirects to `/login` on a 401.
- **Vite proxy** — `/api/*` requests are proxied to `http://localhost:8080`, avoiding CORS issues in development.
- **Avatars** — profile photos are compressed client-side to a small base64 JPEG and stored in the `avatarUrl` TEXT column (no external file storage needed).

---

## 10. End-to-End Flows

### Registration → Dashboard
```
Register/Login (frontend) → POST /api/auth/{register|login}
   → AuthService (BCrypt + JWT) → returns token + user
   → AuthContext stores user, token in localStorage
   → redirect to /dashboard (role-based view)
```

### Proposal Lifecycle (the core flow)
```
Freelancer                  Backend                        Client
   │  Submit Proposal          │                             │
   │─────────────────────────▶ │ ProposalService.submit      │
   │                           │  (status = SUBMITTED)        │
   │                           │◀──── views proposals ────────│
   │                           │                              │  Accept
   │                           │ ProposalService.accept ◀─────│
   │                           │  proposal → ACCEPTED          │
   │                           │  others   → REJECTED          │
   │                           │  project  → IN_PROGRESS        │
   │◀── sees ACCEPTED on ──────│  (removed from open list)     │
   │    dashboard/project        │                             │
   │                           │                              │  Reject
   │                           │ ProposalService.reject ◀─────│
   │◀── sees REJECTED ─────────│                              │
```

### "About the Client" / Contact
```
Freelancer on ProjectDetails → clicks client card
   → GET /api/clients/{userId}/public
   → ProfileService.getPublicClientProfile (profile + posted projects)
   → ClientDetails page → "Contact Client" modal → mailto link
```

---

## 11. Configuration

`application.properties`
- `spring.jpa.hibernate.ddl-auto=update` — schema auto-updates
- `spring.profiles.active=local`

`application-local.properties`
- PostgreSQL URL/username/password
- `app.jwt.secret`, `app.jwt.expiration-ms=86400000` (24h)
- CORS allowed origins: `http://localhost:5173`, `http://localhost:3000`

`DataSeeder` (runs at startup) seeds:
- Roles: CLIENT, FREELANCER, ADMIN
- 9 categories with ~59 skills

---

## 12. How to Run

**Backend** (Terminal 1):
```
cd freelancer-marketplace/backend
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-25.0.3.9-hotspot"
.\mvnw.cmd spring-boot:run
```
Runs on http://localhost:8080

**Frontend** (Terminal 2):
```
cd freelancer-marketplace/frontend
npm install      # first time only
npm run dev
```
Runs on http://localhost:5173

**Prerequisite:** PostgreSQL running on port 5432 with a `freelancer_marketplace` database.

**Docs:** Swagger UI at http://localhost:8080/swagger-ui.html

---

## 13. Design Principles Applied

- **Separation of concerns** — Controller (HTTP) / Service (logic) / Repository (data) are strictly layered.
- **DTO boundary** — JPA entities never leave the service layer; DTOs define the API contract.
- **Stateless authentication** — JWT means no server-side sessions; horizontally scalable.
- **Centralized error handling** — one `@RestControllerAdvice` produces consistent JSON errors.
- **Constructor injection + immutability** — `final` dependencies, no field injection.
- **Role-based authorization** — enforced both at the security layer (paths) and in services (business rules).
- **Microservice-ready** — empty `event/`, `notification/`, `payment/` packages mark seams where the modular monolith can later split into services (per the original project spec's later phases).

---

*Document generated for the FreelancerHub project.*
