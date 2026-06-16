import { z } from "zod";

// Mirror the schemas defined in the page components
const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ── Register schema ─────────────────────────────────────────────────────────

describe("Register form schema", () => {
  describe("valid input", () => {
    it("accepts all required fields", () => {
      const result = registerSchema.safeParse({
        name: "Jane Doe",
        email: "jane@example.com",
        password: "securepass",
      });
      expect(result.success).toBe(true);
    });

    it("accepts without optional name", () => {
      // name has min(1) so it IS required — this verifies that
      const result = registerSchema.safeParse({
        name: "J",
        email: "jane@example.com",
        password: "securepass",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("name validation", () => {
    it("rejects empty name", () => {
      const result = registerSchema.safeParse({
        name: "",
        email: "jane@example.com",
        password: "securepass",
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.name).toBeDefined();
    });

    it("rejects name longer than 100 characters", () => {
      const result = registerSchema.safeParse({
        name: "a".repeat(101),
        email: "jane@example.com",
        password: "securepass",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("email validation", () => {
    it("rejects missing email", () => {
      const result = registerSchema.safeParse({
        name: "Jane",
        password: "securepass",
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.email).toBeDefined();
    });

    it("rejects invalid email format", () => {
      const result = registerSchema.safeParse({
        name: "Jane",
        email: "not-an-email",
        password: "securepass",
      });
      expect(result.success).toBe(false);
      const errors = result.error?.flatten().fieldErrors.email ?? [];
      expect(errors[0]).toBe("Invalid email address");
    });

    it("rejects email missing domain", () => {
      const result = registerSchema.safeParse({
        name: "Jane",
        email: "jane@",
        password: "securepass",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("password validation", () => {
    it("rejects missing password", () => {
      const result = registerSchema.safeParse({
        name: "Jane",
        email: "jane@example.com",
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.password).toBeDefined();
    });

    it("rejects password shorter than 8 characters", () => {
      const result = registerSchema.safeParse({
        name: "Jane",
        email: "jane@example.com",
        password: "short",
      });
      expect(result.success).toBe(false);
      const errors = result.error?.flatten().fieldErrors.password ?? [];
      expect(errors[0]).toBe("Password must be at least 8 characters");
    });

    it("accepts password of exactly 8 characters", () => {
      const result = registerSchema.safeParse({
        name: "Jane",
        email: "jane@example.com",
        password: "exactly8",
      });
      expect(result.success).toBe(true);
    });
  });
});

// ── Login schema ────────────────────────────────────────────────────────────

describe("Login form schema", () => {
  describe("valid input", () => {
    it("accepts valid email and password", () => {
      const result = loginSchema.safeParse({
        email: "jane@example.com",
        password: "anypassword",
      });
      expect(result.success).toBe(true);
    });

    it("accepts any non-empty password (no minimum length on login)", () => {
      const result = loginSchema.safeParse({
        email: "jane@example.com",
        password: "x",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("email validation", () => {
    it("rejects missing email", () => {
      const result = loginSchema.safeParse({ password: "anypassword" });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.email).toBeDefined();
    });

    it("rejects invalid email format", () => {
      const result = loginSchema.safeParse({
        email: "not-valid",
        password: "anypassword",
      });
      expect(result.success).toBe(false);
      const errors = result.error?.flatten().fieldErrors.email ?? [];
      expect(errors[0]).toBe("Invalid email address");
    });
  });

  describe("password validation", () => {
    it("rejects missing password", () => {
      const result = loginSchema.safeParse({ email: "jane@example.com" });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.password).toBeDefined();
    });

    it("rejects empty password", () => {
      const result = loginSchema.safeParse({
        email: "jane@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
      const errors = result.error?.flatten().fieldErrors.password ?? [];
      expect(errors[0]).toBe("Password is required");
    });
  });
});
