import { GoogleGenAI } from "@google/genai";
import { TrigramInfo } from "../types";

const apiKey = process.env.API_KEY?.trim();
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const getTrigramInterpretation = async (trigram: TrigramInfo): Promise<string> => {
  if (!ai) {
    return "The oracle is quiet until a Gemini API key is configured.";
  }

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
