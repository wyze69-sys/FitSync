const { GoogleGenAI } = require("@google/genai");

let geminiClient = null;

const AI_CONFIG = {
  modelName: "gemini-2.5-flash",
  getGeminiClient() {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key") {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    if (!geminiClient) {
      geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }

    return geminiClient;
  }
};

module.exports = { AI_CONFIG };
