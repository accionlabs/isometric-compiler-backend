# Isometric Compiler Backend

This repository contains the **Isometric Compiler Backend**, a scalable REST API built with Node.js, Express, and TypeScript. It features a decorator-based routing system, TypeORM integration for PostgreSQL, Keycloak authentication, AWS service support, and optional LLM (Large Language Model) tooling.

## Table of Contents
- [Folder Structure](#folder-structure)
- [Folder Descriptions](#folder-descriptions)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)

## Folder Structure
```plain
/src
│
├── agents                # AI/LLM agents and wrappers
├── configs               # App configuration (AWS, DB, Keycloak, LLM)
├── controllers           # Route handlers (decorator-based)
├── entities              # TypeORM entity definitions (schema)
├── enums                 # Shared enums and constants
├── middlewares           # Express middleware implementations
├── migrations            # TypeORM database migrations
├── services              # Business logic and data access
├── utils                 # Helper utility modules
└── validations           # DTOs and class-validator schemas

app.ts                     # Express app setup (middleware, DI, docs)
core.ts                    # Decorator-based routing metadata system
routes.ts                  # Auto-register routes from controllers
server.ts                  # HTTP server bootstrapper
index.ts                   # Minimal entry point
```

## Folder Descriptions

### agents/
Contains AI or LLM integration modules (prompt engineering, wrappers).

### configs/
Holds configuration files for AWS SDK, database (TypeORM), Keycloak auth, and LLM models.

### controllers/
Defines Express route handlers using custom decorators. Controllers handle request/response wiring only.

### entities/
TypeORM `@Entity` classes that map to database tables (no business logic here).

### enums/
Common enums and constant definitions used across the project.

### middlewares/
Express middleware functions (logging, authentication, error handling, etc.).

### migrations/
Database migration scripts managed by TypeORM CLI.

### services/
Implements core business operations and data-access logic. All DB interactions happen here.

### utils/
Reusable helper functions and classes (API responses, error handling, HTTP client, Swagger helpers).

### validations/
DTO classes with `class-validator` and `class-transformer` decorators to validate incoming requests.

## Technology Stack
- **Node.js** 22.0+
- **TypeScript** 5.x
- **Express** 4.21.2
- **TypeORM** 0.3.x
- **PostgreSQL** (via `pg` 8.14)
- **Keycloak** for authentication
- **AWS SDK** integrations
- Optional **LLM** support

## Getting Started

### Prerequisites
- Node.js 22 or higher
- PostgreSQL database
- (Optional) Keycloak server
- (Optional) AWS credentials

### Installation
```bash
git clone https://github.com/your-org/isometric-compiler-backend.git
cd isometric-compiler-backend
npm install
```

### Configuration
Copy `.env.example` to `.env` and update the required environment variables:
- `DATABASE_URL` (PostgreSQL connection)
- `KEYCLOAK_*` variables (realm, client, secret, etc.)
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
- `LLM_MODEL_URL` (if using LLM agents)

### Scripts
| Command                                     | Description                              |
| ------------------------------------------- | ---------------------------------------- |
| `npm run dev`                         | Start development server with hot reload |
| `npm run build`                             | Compile TypeScript to JavaScript         |
| `npm run start`                             | Start production server                  |

## API Documentation
Swagger UI is auto-generated from decorators. Once the server is running, visit:

```bash
http://localhost:<PORT>/api-docs
```

## Contributing

Follow these guidelines to keep the codebase consistent:

### When Creating a New Entity
- Place in `src/entities/{EntityName}.ts`
- Use `@Entity()`, `@PrimaryGeneratedColumn()`, `@Column()`, etc.
- No validation or business logic in entities.

### When Creating a New Service
- Place in `src/services/{entity}.service.ts`
- Annotate with `@Service()` (Typedi)
- Inject repository via TypeORM DataSource
- Keep all DB interactions and core logic here

### When Creating a New Controller
- Place in `src/controllers/{entity}.controller.ts`
- Use `@Controller()`, `@Get()`, `@Post()`, etc.
- Call service methods; no DB logic in controllers
- Protect routes with appropriate guards (auth, roles)

### When Creating a New DTO (Validation)
- Place in `src/validations/{Entity}.dto.ts`
- Use `class-validator` and `class-transformer`
- Keep validation separate from entities

### Code Reuse & Integration
- Leverage existing services, entities, DTOs, or middleware when possible.
- Register new controllers in `src/routes.ts`.

---

Happy coding! 🚀