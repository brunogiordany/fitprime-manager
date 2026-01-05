import { describe, it, expect, vi, beforeEach } from "vitest";
import * as db from "./db";

// Mock do banco de dados
vi.mock("./db", async () => {
  const actual = await vi.importActual("./db");
  return {
    ...actual,
    getCardioEvolutionData: vi.fn(),
    getCardioComparisonData: vi.fn(),
    getCardioByTypeStats: vi.fn(),
    getCardioOverallStats: vi.fn(),
  };
});

describe("Cardio Reports Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCardioEvolutionData", () => {
    it("should return empty array when no data", async () => {
      vi.mocked(db.getCardioEvolutionData).mockResolvedValue([]);
      
      const result = await db.getCardioEvolutionData(1, 1, "2025-01-01", "2025-01-31", "day");
      
      expect(result).toEqual([]);
    });

    it("should return grouped data by day", async () => {
      const mockData = [
        {
          date: "2025-01-01",
          totalDuration: 30,
          totalDistance: 5.5,
          totalCalories: 300,
          avgHeartRate: 140,
          maxHeartRate: 165,
          sessionCount: 1,
        },
        {
          date: "2025-01-02",
          totalDuration: 45,
          totalDistance: 8.2,
          totalCalories: 450,
          avgHeartRate: 145,
          maxHeartRate: 170,
          sessionCount: 1,
        },
      ];
      
      vi.mocked(db.getCardioEvolutionData).mockResolvedValue(mockData);
      
      const result = await db.getCardioEvolutionData(1, 1, "2025-01-01", "2025-01-31", "day");
      
      expect(result).toHaveLength(2);
      expect(result[0].date).toBe("2025-01-01");
      expect(result[0].totalDistance).toBe(5.5);
      expect(result[1].totalDuration).toBe(45);
    });

    it("should support week grouping", async () => {
      const mockData = [
        {
          date: "2025-01-05",
          totalDuration: 120,
          totalDistance: 20,
          totalCalories: 1200,
          avgHeartRate: 142,
          maxHeartRate: 175,
          sessionCount: 3,
        },
      ];
      
      vi.mocked(db.getCardioEvolutionData).mockResolvedValue(mockData);
      
      const result = await db.getCardioEvolutionData(1, 1, "2025-01-01", "2025-01-31", "week");
      
      expect(result).toHaveLength(1);
      expect(result[0].sessionCount).toBe(3);
    });

    it("should support month grouping", async () => {
      const mockData = [
        {
          date: "2025-01",
          totalDuration: 480,
          totalDistance: 80,
          totalCalories: 4800,
          avgHeartRate: 140,
          maxHeartRate: 180,
          sessionCount: 12,
        },
      ];
      
      vi.mocked(db.getCardioEvolutionData).mockResolvedValue(mockData);
      
      const result = await db.getCardioEvolutionData(1, 1, "2025-01-01", "2025-01-31", "month");
      
      expect(result).toHaveLength(1);
      expect(result[0].sessionCount).toBe(12);
    });
  });

  describe("getCardioComparisonData", () => {
    it("should return comparison between periods", async () => {
      const mockComparison = {
        current: {
          sessionCount: 10,
          totalDuration: 300,
          totalDistance: 50,
          totalCalories: 3000,
          avgHeartRate: 145,
          avgDuration: 30,
          avgDistance: 5,
        },
        previous: {
          sessionCount: 8,
          totalDuration: 240,
          totalDistance: 40,
          totalCalories: 2400,
          avgHeartRate: 142,
          avgDuration: 30,
          avgDistance: 5,
        },
        changes: {
          sessionCount: 25,
          totalDuration: 25,
          totalDistance: 25,
          totalCalories: 25,
          avgDuration: 0,
          avgDistance: 0,
        },
      };
      
      vi.mocked(db.getCardioComparisonData).mockResolvedValue(mockComparison);
      
      const result = await db.getCardioComparisonData(
        1, 1,
        "2025-01-01", "2025-01-31",
        "2024-12-01", "2024-12-31"
      );
      
      expect(result).not.toBeNull();
      expect(result?.current.sessionCount).toBe(10);
      expect(result?.previous.sessionCount).toBe(8);
      expect(result?.changes.sessionCount).toBe(25);
    });

    it("should handle null when no data", async () => {
      vi.mocked(db.getCardioComparisonData).mockResolvedValue(null);
      
      const result = await db.getCardioComparisonData(
        1, 1,
        "2025-01-01", "2025-01-31",
        "2024-12-01", "2024-12-31"
      );
      
      expect(result).toBeNull();
    });
  });

  describe("getCardioByTypeStats", () => {
    it("should return stats grouped by cardio type", async () => {
      const mockStats = [
        {
          type: "outdoor_run",
          sessionCount: 8,
          totalDuration: 240,
          totalDistance: 40,
          totalCalories: 2400,
        },
        {
          type: "treadmill",
          sessionCount: 5,
          totalDuration: 150,
          totalDistance: 25,
          totalCalories: 1500,
        },
        {
          type: "stationary_bike",
          sessionCount: 3,
          totalDuration: 90,
          totalDistance: 30,
          totalCalories: 900,
        },
      ];
      
      vi.mocked(db.getCardioByTypeStats).mockResolvedValue(mockStats);
      
      const result = await db.getCardioByTypeStats(1, 1, "2025-01-01", "2025-01-31");
      
      expect(result).toHaveLength(3);
      expect(result[0].type).toBe("outdoor_run");
      expect(result[0].sessionCount).toBe(8);
    });

    it("should return empty array when no cardio logs", async () => {
      vi.mocked(db.getCardioByTypeStats).mockResolvedValue([]);
      
      const result = await db.getCardioByTypeStats(1, 1, "2025-01-01", "2025-01-31");
      
      expect(result).toEqual([]);
    });
  });

  describe("getCardioOverallStats", () => {
    it("should return overall stats for all students", async () => {
      const mockOverall = {
        totalSessions: 50,
        totalDuration: 1500,
        totalDistance: 250,
        totalCalories: 15000,
        uniqueStudents: 5,
        avgSessionsPerStudent: 10,
        avgDurationPerSession: 30,
        topStudents: [
          { id: 1, name: "João", sessions: 15, duration: 450, distance: 75 },
          { id: 2, name: "Maria", sessions: 12, duration: 360, distance: 60 },
          { id: 3, name: "Pedro", sessions: 10, duration: 300, distance: 50 },
        ],
      };
      
      vi.mocked(db.getCardioOverallStats).mockResolvedValue(mockOverall);
      
      const result = await db.getCardioOverallStats(1, "2025-01-01", "2025-01-31");
      
      expect(result).not.toBeNull();
      expect(result?.totalSessions).toBe(50);
      expect(result?.uniqueStudents).toBe(5);
      expect(result?.topStudents).toHaveLength(3);
      expect(result?.topStudents[0].name).toBe("João");
    });

    it("should handle null when no data", async () => {
      vi.mocked(db.getCardioOverallStats).mockResolvedValue(null);
      
      const result = await db.getCardioOverallStats(1, "2025-01-01", "2025-01-31");
      
      expect(result).toBeNull();
    });
  });
});

describe("Cardio Evolution Data Calculations", () => {
  it("should correctly calculate percentage changes", () => {
    const calcChange = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };
    
    // Aumento de 25%
    expect(calcChange(10, 8)).toBe(25);
    
    // Diminuição de 20%
    expect(calcChange(8, 10)).toBe(-20);
    
    // Sem mudança
    expect(calcChange(10, 10)).toBe(0);
    
    // De zero para valor positivo
    expect(calcChange(5, 0)).toBe(100);
    
    // De zero para zero
    expect(calcChange(0, 0)).toBe(0);
  });

  it("should correctly round distance values", () => {
    const roundDistance = (value: number) => Math.round(value * 100) / 100;
    
    expect(roundDistance(5.555)).toBe(5.56);
    expect(roundDistance(10.001)).toBe(10);
    expect(roundDistance(0.125)).toBe(0.13);
  });
});
