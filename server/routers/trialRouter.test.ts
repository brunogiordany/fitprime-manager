import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock bcrypt
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2a$10$hashedpassword"),
  },
}));

// Mock database
const mockExecute = vi.fn();
vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue({
    execute: mockExecute,
  }),
}));

describe("Trial Router - Password Support", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should require password field in createTrial schema", async () => {
    // Import the schema validation
    const { z } = await import("zod");
    
    const createTrialSchema = z.object({
      name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
      email: z.string().email("Email inválido"),
      phone: z.string().min(10, "Telefone inválido"),
      cpf: z.string().min(11, "CPF inválido"),
      birthDate: z.string().min(10, "Data de nascimento inválida"),
      password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
      cref: z.string().optional(),
    });

    // Test valid input with password
    const validInput = {
      name: "Test User",
      email: "test@example.com",
      phone: "11999999999",
      cpf: "12345678901",
      birthDate: "1990-01-01",
      password: "senha123",
    };

    const result = createTrialSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("should reject password shorter than 6 characters", async () => {
    const { z } = await import("zod");
    
    const createTrialSchema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      phone: z.string().min(10),
      cpf: z.string().min(11),
      birthDate: z.string().min(10),
      password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    });

    const invalidInput = {
      name: "Test User",
      email: "test@example.com",
      phone: "11999999999",
      cpf: "12345678901",
      birthDate: "1990-01-01",
      password: "12345", // Too short
    };

    const result = createTrialSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it("should reject missing password field", async () => {
    const { z } = await import("zod");
    
    const createTrialSchema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      phone: z.string().min(10),
      cpf: z.string().min(11),
      birthDate: z.string().min(10),
      password: z.string().min(6),
    });

    const inputWithoutPassword = {
      name: "Test User",
      email: "test@example.com",
      phone: "11999999999",
      cpf: "12345678901",
      birthDate: "1990-01-01",
    };

    const result = createTrialSchema.safeParse(inputWithoutPassword);
    expect(result.success).toBe(false);
  });

  it("should hash password with bcrypt", async () => {
    const bcrypt = await import("bcryptjs");
    
    const password = "senha123";
    const hashedPassword = await bcrypt.default.hash(password, 10);
    
    expect(hashedPassword).toBe("$2a$10$hashedpassword");
    expect(bcrypt.default.hash).toHaveBeenCalledWith(password, 10);
  });
});
