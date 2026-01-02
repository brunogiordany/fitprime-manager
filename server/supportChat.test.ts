import { describe, it, expect, beforeEach, vi } from "vitest";
import * as db from "./db";

// Mock das funções do banco de dados
vi.mock("./db", () => ({
  createSupportConversation: vi.fn(),
  getSupportConversationByVisitorId: vi.fn(),
  getAllSupportConversations: vi.fn(),
  getSupportConversationById: vi.fn(),
  updateSupportConversation: vi.fn(),
  createSupportMessage: vi.fn(),
  getSupportMessages: vi.fn(),
  markSupportMessageAsRead: vi.fn(),
  getUnreadSupportMessagesCount: vi.fn(),
  getSupportConversationsWithUnreadMessages: vi.fn(),
}));

describe("Support Chat Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createSupportConversation", () => {
    it("should create a new support conversation", async () => {
      const mockConversationId = 1;
      vi.mocked(db.createSupportConversation).mockResolvedValue(mockConversationId);

      const result = await db.createSupportConversation({
        visitorId: "visitor_123",
        visitorName: "João Silva",
        visitorEmail: "joao@example.com",
        visitorPhone: "11999999999",
        status: "active",
        source: "landing",
      });

      expect(result).toBe(mockConversationId);
      expect(db.createSupportConversation).toHaveBeenCalledWith(
        expect.objectContaining({
          visitorId: "visitor_123",
          visitorName: "João Silva",
        })
      );
    });
  });

  describe("getSupportConversationByVisitorId", () => {
    it("should return a conversation for a given visitor ID", async () => {
      const mockConversation = {
        id: 1,
        visitorId: "visitor_123",
        visitorName: "João Silva",
        visitorEmail: "joao@example.com",
        status: "active" as const,
        source: "landing" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getSupportConversationByVisitorId).mockResolvedValue(
        mockConversation
      );

      const result = await db.getSupportConversationByVisitorId("visitor_123");

      expect(result).toEqual(mockConversation);
      expect(db.getSupportConversationByVisitorId).toHaveBeenCalledWith(
        "visitor_123"
      );
    });

    it("should return undefined if conversation not found", async () => {
      vi.mocked(db.getSupportConversationByVisitorId).mockResolvedValue(
        undefined
      );

      const result = await db.getSupportConversationByVisitorId(
        "nonexistent_visitor"
      );

      expect(result).toBeUndefined();
    });
  });

  describe("createSupportMessage", () => {
    it("should create a support message", async () => {
      const mockMessageId = 1;
      vi.mocked(db.createSupportMessage).mockResolvedValue(mockMessageId);

      const result = await db.createSupportMessage({
        conversationId: 1,
        sender: "visitor",
        message: "Qual é o preço do plano Pro?",
        isAutoReply: false,
      });

      expect(result).toBe(mockMessageId);
      expect(db.createSupportMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: 1,
          sender: "visitor",
          message: "Qual é o preço do plano Pro?",
        })
      );
    });

    it("should create an AI auto-reply message", async () => {
      const mockMessageId = 2;
      vi.mocked(db.createSupportMessage).mockResolvedValue(mockMessageId);

      const result = await db.createSupportMessage({
        conversationId: 1,
        sender: "ai",
        message: "O plano Pro custa R$ 147/mês",
        isAutoReply: true,
      });

      expect(result).toBe(mockMessageId);
      expect(db.createSupportMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          sender: "ai",
          isAutoReply: true,
        })
      );
    });
  });

  describe("getSupportMessages", () => {
    it("should return messages for a conversation", async () => {
      const mockMessages = [
        {
          id: 1,
          conversationId: 1,
          sender: "visitor" as const,
          message: "Qual é o preço?",
          isAutoReply: false,
          createdAt: new Date(),
        },
        {
          id: 2,
          conversationId: 1,
          sender: "ai" as const,
          message: "O preço é R$ 147/mês",
          isAutoReply: true,
          createdAt: new Date(),
        },
      ];

      vi.mocked(db.getSupportMessages).mockResolvedValue(mockMessages);

      const result = await db.getSupportMessages(1, 50);

      expect(result).toEqual(mockMessages);
      expect(result.length).toBe(2);
      expect(db.getSupportMessages).toHaveBeenCalledWith(1, 50);
    });

    it("should return empty array if no messages found", async () => {
      vi.mocked(db.getSupportMessages).mockResolvedValue([]);

      const result = await db.getSupportMessages(999, 50);

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });

  describe("updateSupportConversation", () => {
    it("should update conversation status", async () => {
      vi.mocked(db.updateSupportConversation).mockResolvedValue(undefined);

      await db.updateSupportConversation(1, {
        status: "closed",
        resolvedAt: new Date(),
      });

      expect(db.updateSupportConversation).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: "closed",
        })
      );
    });
  });

  describe("getUnreadSupportMessagesCount", () => {
    it("should return count of unread messages", async () => {
      vi.mocked(db.getUnreadSupportMessagesCount).mockResolvedValue(5);

      const result = await db.getUnreadSupportMessagesCount();

      expect(result).toBe(5);
      expect(db.getUnreadSupportMessagesCount).toHaveBeenCalled();
    });

    it("should return 0 if no unread messages", async () => {
      vi.mocked(db.getUnreadSupportMessagesCount).mockResolvedValue(0);

      const result = await db.getUnreadSupportMessagesCount();

      expect(result).toBe(0);
    });
  });

  describe("getAllSupportConversations", () => {
    it("should return all conversations with limit", async () => {
      const mockConversations = [
        {
          id: 1,
          visitorId: "visitor_1",
          visitorName: "João",
          status: "active" as const,
          source: "landing" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          visitorId: "visitor_2",
          visitorName: "Maria",
          status: "closed" as const,
          source: "landing" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.getAllSupportConversations).mockResolvedValue(
        mockConversations
      );

      const result = await db.getAllSupportConversations(100);

      expect(result).toEqual(mockConversations);
      expect(result.length).toBe(2);
      expect(db.getAllSupportConversations).toHaveBeenCalledWith(100);
    });
  });
});
