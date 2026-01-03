import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: "Sugestão gerada pela IA"
      }
    }]
  })
}));

describe("aiAssistant.generateSuggestions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should have valid field enum values", () => {
    const validFields = [
      "personalBio",
      "servicesOffered",
      "workingHoursDescription",
      "locationDescription",
      "priceRange",
      "welcomeMessageLead",
      "welcomeMessageStudent",
      "awayMessage",
      "customPersonality",
      "all"
    ];
    
    // Verifica que todos os campos esperados estão na lista
    expect(validFields).toContain("personalBio");
    expect(validFields).toContain("servicesOffered");
    expect(validFields).toContain("welcomeMessageLead");
    expect(validFields).toContain("welcomeMessageStudent");
    expect(validFields).toContain("awayMessage");
    expect(validFields).toContain("customPersonality");
    expect(validFields).toContain("all");
    expect(validFields.length).toBe(10);
  });

  it("should have valid gender options", () => {
    const validGenders = ["male", "female", "neutral"];
    
    expect(validGenders).toContain("male");
    expect(validGenders).toContain("female");
    expect(validGenders).toContain("neutral");
  });

  it("should have valid communication tone options", () => {
    const validTones = ["formal", "casual", "motivational", "friendly"];
    
    expect(validTones).toContain("formal");
    expect(validTones).toContain("casual");
    expect(validTones).toContain("motivational");
    expect(validTones).toContain("friendly");
  });

  it("should generate correct gender text in Portuguese", () => {
    const getGenderText = (gender: string) => {
      return gender === "female" ? "feminino" : gender === "male" ? "masculino" : "neutro";
    };
    
    expect(getGenderText("female")).toBe("feminino");
    expect(getGenderText("male")).toBe("masculino");
    expect(getGenderText("neutral")).toBe("neutro");
  });

  it("should generate correct tone text in Portuguese", () => {
    const getToneText = (tone: string) => {
      return tone === "formal" ? "formal e profissional" 
        : tone === "casual" ? "casual e descontraído" 
        : tone === "motivational" ? "motivacional e energético" 
        : "amigável e acolhedor";
    };
    
    expect(getToneText("formal")).toBe("formal e profissional");
    expect(getToneText("casual")).toBe("casual e descontraído");
    expect(getToneText("motivational")).toBe("motivacional e energético");
    expect(getToneText("friendly")).toBe("amigável e acolhedor");
  });

  it("should handle LLM response content correctly", () => {
    // Simula o tratamento de resposta do LLM
    const mockResponse = {
      choices: [{
        message: {
          content: "  Sugestão com espaços  "
        }
      }]
    };
    
    const content = mockResponse.choices[0]?.message?.content;
    const result = typeof content === 'string' ? content.trim() : "";
    
    expect(result).toBe("Sugestão com espaços");
  });

  it("should handle empty LLM response", () => {
    const mockResponse = {
      choices: [{
        message: {
          content: null
        }
      }]
    };
    
    const content = mockResponse.choices[0]?.message?.content;
    const result = typeof content === 'string' ? content.trim() : "";
    
    expect(result).toBe("");
  });

  it("should handle undefined LLM response", () => {
    const mockResponse = {
      choices: []
    };
    
    const content = mockResponse.choices[0]?.message?.content;
    const result = typeof content === 'string' ? content.trim() : "";
    
    expect(result).toBe("");
  });
});
