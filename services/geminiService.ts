
import { GoogleGenAI, Type } from "@google/genai";
import { Sentiment, AIAnalysis } from "../types";

// Initialize lazily to avoid startup crashes if env is missing
const getAI = () => {
  const key = process.env.API_KEY || (window as any).GEMINI_API_KEY;
  if (!key) {
    console.warn("API Key missing for Gemini");
    throw new Error("Clé API manquante");
  }
  return new GoogleGenAI({ apiKey: key });
};

export const analyzeReview = async (title: string, author: string, content: string): Promise<AIAnalysis> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyse cet avis de livre pour "${title}" de ${author}.
    Avis: "${content}"
    
    Fournis un JSON avec:
    1. summary: Un résumé accrocheur en une seule phrase courte.
    2. sentiment: Uniquement parmi ["Enthousiaste", "Mitigé", "Déçu"].
    3. tags: Une liste de 3 à 5 hashtags pertinents (ex: #Suspense, #Historique).
    4. recommendations: Une liste de 2 livres similaires suggérés.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            sentiment: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["summary", "sentiment", "tags", "recommendations"]
        }
      }
    });

    const data = JSON.parse(response.text || '{}');

    let sentiment: Sentiment = Sentiment.UNKNOWN;
    if (data.sentiment === 'Enthousiaste') sentiment = Sentiment.ENTHUSIASTIC;
    else if (data.sentiment === 'Mitigé') sentiment = Sentiment.MIXED;
    else if (data.sentiment === 'Déçu') sentiment = Sentiment.DISAPPOINTED;

    return {
      summary: data.summary || "Aucun résumé disponible.",
      sentiment,
      tags: data.tags || [],
      recommendations: data.recommendations || []
    };
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return {
      summary: "Erreur lors de l'analyse IA.",
      sentiment: Sentiment.UNKNOWN,
      tags: [],
      recommendations: []
    };
  }
};

/**
 * Recherche une URL d'image de couverture et un résumé de livre
 */
export const searchBookCover = async (title: string, author: string): Promise<{ url: string | null, summary: string | null }> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Recherche pour le livre "${title}" de ${author}. 
      Donne moi l'URL d'une image de couverture directe et un résumé très court (2 phrases max).
      Réponds en JSON uniquement.`,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            url: { type: Type.STRING, description: "URL directe de l'image" },
            summary: { type: Type.STRING, description: "Résumé court du livre" }
          }
        }
      },
    });

    const data = JSON.parse(response.text || '{}');
    let url = data.url;

    // Fallback image search in grounding if URL is not provided in JSON text
    if (!url || !url.startsWith('http')) {
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        for (const chunk of chunks) {
          const uri = (chunk as any).web?.uri;
          if (uri && uri.match(/\.(jpg|jpeg|png|webp)/i)) {
            url = uri;
            break;
          }
        }
      }
    }

    return {
      url: url || null,
      summary: data.summary || null
    };
  } catch (error) {
    console.error("Cover search failed:", error);
    return { url: null, summary: null };
  }
};
