# isometric-compiler-backend

A TypeScript-based backend system integrating AI/LLM agents with a modular and scalable architecture. Built on Node.js, Express, and TypeORM, this backend powers isometric code generation, user interaction, and service orchestration with robust authentication, validation, and API documentation.

---

## 🚀 Features

- Modular architecture with full TypeScript support
- Express-based REST API with Swagger documentation
- AI agents integrated via LangChain and LLMs
- PostgreSQL + TypeORM with migrations
- JWT + Keycloak authentication
- File upload via AWS S3
- Email notifications via AWS SES and Nodemailer
- Centralized config and error handling
- Role-based access control via decorators
- Built-in Swagger docs generation

---

## 📁 Project Structure

```plaintext
/src
│
├── /agents                # agents or modules integrating AI/LLMs
├── /configs               # AWS, DB, Keycloak, LLM configurations
├── /controllers           # Express route handlers
├── /entities              # TypeORM models
├── /enums                 # Shared enums and constants
├── /middlewares           # Express middleware (auth, logging, etc.)
├── /migrations            # DB migration scripts
├── /services              # Business logic and data access
├── /utils                 # Common helper functions
├── /validations           # class-validator schemas
│
├── app.ts                 # Express app setup
├── core.ts                # Custom decorator-based routing
├── index.ts               # Main entry point
├── routes.ts              # Route auto-registration
└── server.ts              # Server bootstrapper


### 🧪 Scripts

| Script   | Description                                   |
|----------|-----------------------------------------------|
| `dev`    | Start development server with `nodemon`       |
| `build`  | Compile TypeScript and generate Swagger JSON  |
| `start`  | Run the built application                     |

