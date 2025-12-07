import { GoogleGenAI } from "@google/genai";
import { TrigramInfo } from "../types";

// Initialize Gemini
// Note: API_KEY must be provided via environment variable.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getTrigramInterpretation = async (trigram: TrigramInfo): Promise<string> => {
  try {
    const modelId = "gemini-2.5-flash";
    const prompt = `
      You are a wise Taoist master. Interpret the Bagua Trigram "${trigram.name}" (${trigram.chinese}) which represents "${trigram.meaning}" and element "${trigram.element}".
      
      Give me a short, poetic, and philosophical insight about this state of energy. 
      Keep it under 60 words. Mystical but grounded.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    return response.text || "The Tao that can be told is not the eternal Tao.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The mists of uncertainty cloud the oracle right now.";
  }
};