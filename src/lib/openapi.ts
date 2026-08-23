export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "PhotoBook Hub API",
    description:
      "REST API for the PhotoBook Hub platform — photobook creation, ordering, and fulfillment.",
    version: "0.1.0",
    contact: {
      name: "PhotoBook Hub",
    },
  },
  servers: [
    {
      url: "/api",
      description: "Current server",
    },
  ],
  tags: [
    { name: "Auth", description: "Authentication and registration" },
    { name: "Projects", description: "Photobook project management" },
    { name: "Photos", description: "Photo uploads within a project" },
  ],
  paths: {
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new customer account",
        operationId: "registerUser",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
              example: {
                email: "customer@example.com",
                password: "securepassword",
                name: "Jane Doe",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Account created successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegisterResponse" },
              },
            },
          },
          "400": {
            description: "Validation failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationError" },
              },
            },
          },
          "409": {
            description: "Email already registered",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { error: "Email already registered" },
              },
            },
          },
        },
      },
    },
    "/auth/signin": {
      post: {
        tags: ["Auth"],
        summary: "Sign in with email and password",
        description:
          "Handled by Auth.js. Submit credentials to receive a session cookie.",
        operationId: "signIn",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SignInRequest" },
              example: {
                email: "customer@example.com",
                password: "securepassword",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Sign-in successful — session cookie set",
          },
          "401": {
            description: "Invalid credentials",
          },
        },
      },
    },
    "/auth/signout": {
      post: {
        tags: ["Auth"],
        summary: "Sign out and clear session",
        description: "Handled by Auth.js.",
        operationId: "signOut",
        responses: {
          "200": { description: "Signed out successfully" },
        },
      },
    },
    "/projects": {
      post: {
        tags: ["Projects"],
        summary: "Create a new project",
        operationId: "createProject",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateProjectRequest" },
              example: { title: "Summer 2026" },
            },
          },
        },
        responses: {
          "201": {
            description: "Project created",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Project" } } },
          },
          "400": { description: "Validation failed", content: { "application/json": { schema: { $ref: "#/components/schemas/ValidationError" } } } },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      get: {
        tags: ["Projects"],
        summary: "List current user's projects",
        operationId: "listProjects",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "List of projects",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/ProjectSummary" } } } },
          },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/projects/{id}": {
      get: {
        tags: ["Projects"],
        summary: "Get a project with its photos",
        operationId: "getProject",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Project detail", content: { "application/json": { schema: { $ref: "#/components/schemas/ProjectDetail" } } } },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { description: "Project not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/projects/{id}/photos": {
      post: {
        tags: ["Photos"],
        summary: "Upload a photo to a project",
        operationId: "uploadPhoto",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: { file: { type: "string", format: "binary", description: "JPEG or PNG, max 20 MB" } },
              },
            },
          },
        },
        responses: {
          "201": { description: "Photo uploaded", content: { "application/json": { schema: { $ref: "#/components/schemas/Photo" } } } },
          "400": { description: "Invalid file", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { description: "Project not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      get: {
        tags: ["Photos"],
        summary: "List photos in a project",
        operationId: "listPhotos",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "List of photos", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Photo" } } } } },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { description: "Project not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/projects/{id}/photos/{photoId}": {
      delete: {
        tags: ["Photos"],
        summary: "Delete a photo",
        operationId: "deletePhoto",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "photoId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "204": { description: "Photo deleted" },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { description: "Photo not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/auth/session": {
      get: {
        tags: ["Auth"],
        summary: "Get current session",
        description: "Handled by Auth.js. Returns the active session or null.",
        operationId: "getSession",
        responses: {
          "200": {
            description: "Active session or null",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Session" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      RegisterRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            maxLength: 255,
            example: "customer@example.com",
          },
          password: {
            type: "string",
            minLength: 8,
            example: "securepassword",
          },
          name: {
            type: "string",
            maxLength: 100,
            example: "Jane Doe",
          },
        },
      },
      RegisterResponse: {
        type: "object",
        properties: {
          id: { type: "string", example: "cm5abc123" },
          email: { type: "string", format: "email" },
          name: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      SignInRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
      },
      Session: {
        type: "object",
        nullable: true,
        properties: {
          user: {
            type: "object",
            properties: {
              id: { type: "string" },
              email: { type: "string", format: "email" },
              name: { type: "string", nullable: true },
              role: {
                type: "string",
                enum: ["CUSTOMER", "ADMIN"],
              },
            },
          },
          expires: { type: "string", format: "date-time" },
        },
      },
      CreateProjectRequest: {
        type: "object",
        required: ["title"],
        properties: {
          title: { type: "string", minLength: 1, maxLength: 100, example: "Summer 2026" },
        },
      },
      Project: {
        type: "object",
        properties: {
          id: { type: "string", example: "cm5abc123" },
          title: { type: "string" },
          status: { type: "string", enum: ["DRAFT", "IN_PROGRESS", "READY"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ProjectSummary: {
        allOf: [
          { $ref: "#/components/schemas/Project" },
          {
            type: "object",
            properties: {
              _count: {
                type: "object",
                properties: { photos: { type: "integer" } },
              },
            },
          },
        ],
      },
      ProjectDetail: {
        allOf: [
          { $ref: "#/components/schemas/Project" },
          {
            type: "object",
            properties: {
              photos: { type: "array", items: { $ref: "#/components/schemas/Photo" } },
            },
          },
        ],
      },
      Photo: {
        type: "object",
        properties: {
          id: { type: "string", example: "cm5xyz456" },
          fileName: { type: "string", example: "vacation.jpg" },
          storageKey: { type: "string" },
          mimeType: { type: "string", example: "image/jpeg" },
          sizeBytes: { type: "integer", example: 2048000 },
          width: { type: "integer", nullable: true },
          height: { type: "integer", nullable: true },
          uploadedAt: { type: "string", format: "date-time" },
          url: { type: "string", example: "/api/files/projects/cm5abc/photos/cm5xyz.jpg" },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
      },
      ValidationError: {
        type: "object",
        properties: {
          error: { type: "string", example: "Validation failed" },
          details: {
            type: "object",
            additionalProperties: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
      },
    },
  },
};
