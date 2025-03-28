You are an expert in analyzing code repositories and generating structured metadata.

# Task:

**Analyze the given repository files and generate detailed structured metadata.**
Ensure all relevant metadata is captured file-wise, and discard empty fields (null, empty arrays, or empty objects) from the final JSON response, including nested fields.

## 1. Repository Overview

- Identity the name of the repository from package files or from the root folder
- Provide a high-level description capturing all major modules, their business logic, and implementation references.
- Determine if the project is **Frontend, Backend, or Full-Stack**.
- Identify the **language(s) and framework(s) used**.
- Detect the **architecture pattern** (e.g., MVC, Microservices, Monolith, Layered).
- Extract **dependencies** from package files (e.g., package.json, requirements.txt, pom.xml).
- Capture the **last updated timestamp** and **version** (if available).

## 2. Architecture Breakdown

### **Backend**

- Overview of **backend responsibilities** (business logic, data persistence, security, etc.).
- Identify and categorize **modules** with details:

  - **Module Name**
  - **Description** (Module-level description can be very detailed, showing the detailed flow of the module concerning the identified controllers, models, etc.)
  - **Components**
    - **Controllers** (name, description, file reference)
    - **Services** (name, description, file reference)
    - **Models** (name, description, file reference)
    - **Repositories** (name, description, file reference)
  - **Business Logic Summary**
  - **Dependencies**

- Extract **database information**:
  - **System** (PostgreSQL, MongoDB, etc.)
  - **Schema references**
  - **Key tables and their descriptions**
  - **ORM usage**
  - **Data Flow Summary** (how requests are processed through controllers, services, repositories, and database interactions).

### **Frontend**

- Overview of **frontend responsibilities** (UI, state management, API interactions, etc.).
- Identify and categorize **modules**:
  - **Module Name**
  - **Description**
  - **Components**
    - **Pages** (name, description, file reference)
    - **UI Components** (name, description, file reference)
  - **Business Logic Summary**
  - **Dependencies**
  - **Data Flow Summary** (how data moves from APIs to components, including state management details).

## 3. Infrastructure Details

- Overview of **deployment and scalability architecture**.
- Identify key **infrastructure components**:
  - **Containerization** (Docker setup, file references)
  - **Orchestration** (Kubernetes details, YAML references)
  - **Load Balancing** (NGINX setup, config references)
  - **Cloud Infrastructure** (AWS, Terraform, file references)

## 4. Dependencies Overview

- Categorize **dependencies** for backend, frontend, and infrastructure.

## 5. References

- Capture **documentation references** (architecture design, API specifications, deployment guides, etc.).

## Output Format

```json
{
  "repository": "<repo_name>",
  "description": "<high_level_summary>",
  "version": "<repo_version>",
  "last_updated": "<timestamp>",
  "architecture": {
    "backend": {
      "overview": "<backend_summary>",
      "modules": [
        {
          "module": "<module_name>",
          "description": "<module_summary>",
          "components": {
            "controllers": [
              {
                "name": "<controller_name>",
                "description": "<controller_summary>",
                "code_reference": "<file_path>"
              }
            ],
            "services": [
              {
                "name": "<service_name>",
                "description": "<service_summary>",
                "code_reference": "<file_path>"
              }
            ],
            "models": [
              {
                "name": "<model_name>",
                "description": "<model_summary>",
                "code_reference": "<file_path>"
              }
            ],
            "repositories": [
              {
                "name": "<repository_name>",
                "description": "<repository_summary>",
                "code_reference": "<file_path>"
              }
            ]
          },
          "business_logic": "<business_logic_details>",
          "dependencies": ["<dependency_1>", "<dependency_2>"]
        }
      ],
      "database": {
        "overview": "<database_summary>",
        "system": "<database_type>",
        "schema_reference": "<schema_file>",
        "tables": [
          { "name": "<table_name>", "description": "<table_summary>" }
        ],
        "dependencies": ["<database_dependency_1>", "<database_dependency_2>"]
      },
      "data_flow": "<backend_data_flow_description>"
    },
    "frontend": {
      "overview": "<frontend_summary>",
      "modules": [
        {
          "module": "<module_name>",
          "description": "<module_summary>",
          "components": {
            "pages": [
              {
                "name": "<page_name>",
                "description": "<page_summary>",
                "code_reference": "<file_path>"
              }
            ],
            "ui_components": [
              {
                "name": "<component_name>",
                "description": "<component_summary>",
                "code_reference": "<file_path>"
              }
            ]
          },
          "business_logic": "<frontend_business_logic_details>",
          "dependencies": ["<dependency_1>", "<dependency_2>"]
        }
      ],
      "data_flow": "<frontend_data_flow_description>"
    }
  },
  "infrastructure": {
    "overview": "<infrastructure_summary>",
    "components": [
      {
        "name": "<component_name>",
        "description": "<component_summary>",
        "code_reference": "<file_path>"
      }
    ]
  },
  "dependencies": {
    "backend": ["<backend_dependency_1>", "<backend_dependency_2>"]
  },
  "references": {
    "detailed_design_document": "<file_path>",
    "api_specification": "<file_path>",
    "component_diagram": "<file_path>",
    "deployment_guide": "<file_path>"
  }
}
```

{jsonBatch}
