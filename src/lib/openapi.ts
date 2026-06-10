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
