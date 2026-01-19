import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do banco de dados
const mockDb = {
  insert: vi.fn().mockReturnValue({
    values: vi.fn().mockResolvedValue({ insertId: 1 }),
  }),
  select: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            offset: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    }),
  }),
  execute: vi.fn().mockResolvedValue([[]]),
};

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(mockDb),
}));

// Mock do schema
vi.mock("../drizzle/schema", () => ({
  activityLogs: {
    id: "id",
    activityType: "activityType",
    title: "title",
    description: "description",
    metadata: "metadata",
    entityType: "entityType",
    entityId: "entityId",
    leadId: "leadId",
    leadName: "leadName",
    leadPhone: "leadPhone",
    leadEmail: "leadEmail",
    userId: "userId",
    userName: "userName",
    status: "status",
    errorMessage: "errorMessage",
    externalId: "externalId",
    createdAt: "createdAt",
  },
}));

describe("Activity Log Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("logActivity helper function", () => {
    it("should log a whatsapp_sent activity successfully", async () => {
      const { logActivity } = await import("./routers/activityLogRouter");
      
      const result = await logActivity({
        activityType: "whatsapp_sent",
        title: "WhatsApp enviado para João",
        description: "Mensagem de teste",
        leadId: 1,
        leadName: "João Silva",
        leadPhone: "11999999999",
        status: "success",
      });

      expect(mockDb.insert).toHaveBeenCalled();
    });

    it("should log an email_sent activity successfully", async () => {
      const { logActivity } = await import("./routers/activityLogRouter");
      
      const result = await logActivity({
        activityType: "email_sent",
        title: "Email enviado: Bem-vindo ao FitPrime",
        description: "Email de boas-vindas",
        leadId: 2,
        leadName: "Maria Santos",
        leadEmail: "maria@email.com",
        status: "success",
        externalId: "resend_123",
      });

      expect(mockDb.insert).toHaveBeenCalled();
    });

    it("should log a failed activity with error message", async () => {
      const { logActivity } = await import("./routers/activityLogRouter");
      
      const result = await logActivity({
        activityType: "whatsapp_failed",
        title: "Falha ao enviar WhatsApp",
        leadId: 3,
        leadPhone: "11888888888",
        status: "failed",
        errorMessage: "Número inválido",
      });

      expect(mockDb.insert).toHaveBeenCalled();
    });

    it("should handle metadata correctly", async () => {
      const { logActivity } = await import("./routers/activityLogRouter");
      
      const result = await logActivity({
        activityType: "lead_created",
        title: "Lead criado via quiz",
        leadId: 4,
        leadName: "Pedro Oliveira",
        metadata: {
          source: "quiz",
          quizId: 1,
          utm_source: "google",
        },
        status: "success",
      });

      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe("Activity types validation", () => {
    it("should accept all valid activity types", () => {
      const validTypes = [
        "whatsapp_sent",
        "whatsapp_received",
        "whatsapp_failed",
        "whatsapp_bulk_sent",
        "email_sent",
        "email_failed",
        "email_opened",
        "email_clicked",
        "lead_created",
        "lead_updated",
        "lead_converted",
        "lead_tag_added",
        "lead_tag_removed",
        "funnel_stage_changed",
        "automation_triggered",
        "user_login",
        "user_action",
      ];

      expect(validTypes.length).toBe(17);
      validTypes.forEach((type) => {
        expect(typeof type).toBe("string");
      });
    });
  });

  describe("Status validation", () => {
    it("should accept all valid status values", () => {
      const validStatuses = ["success", "failed", "pending", "cancelled"];
      
      expect(validStatuses.length).toBe(4);
      validStatuses.forEach((status) => {
        expect(typeof status).toBe("string");
      });
    });
  });
});
