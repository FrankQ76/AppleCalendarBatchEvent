import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

const getGenAI = () => {
  if (!genAI) {
    const apiKey = process.env.API_KEY;
    if (apiKey) {
      genAI = new GoogleGenAI({ apiKey });
    } else {
      console.warn("API_KEY not found in environment variables");
    }
  }
  return genAI;
};

export const enhanceReason = async (input: string): Promise<string> => {
  const ai = getGenAI();
  if (!ai) return input; // Fallback if no API key

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a helpful calendar assistant. Rewrite the following calendar event title to be more professional, clear, or descriptive depending on the context. Keep it concise (under 50 chars). Do not add quotes.
      
      Input: "${input}"`,
    });
    
    return response.text.trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return input;
  }
};
