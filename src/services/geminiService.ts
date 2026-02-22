import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generatePromptFromMedia(mimeType: string, base64Data: string): Promise<string> {
  const prompt = `Analyze this media in extreme detail. Generate a highly descriptive prompt that could be used in an AI image or video generator to recreate this exact scene. Include details about the subject, lighting, camera angle, colors, mood, style, texture, and any specific actions or movements if it's a video. Make it a comprehensive, comma-separated or well-structured paragraph prompt suitable for high-end AI generators like Midjourney, Stable Diffusion, or Veo. Output ONLY the prompt text, without any introductory or concluding remarks.`;
  
  const mediaPart = {
    inlineData: {
      mimeType,
      data: base64Data,
    },
  };
  
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: { parts: [mediaPart, { text: prompt }] },
  });
  
  return response.text || "Failed to generate prompt.";
}

export async function generateImageFromPrompt(
  prompt: string,
  aspectRatio: string = "1:1",
  style: string = "none",
  negativePrompt: string = ""
): Promise<string> {
  let finalPrompt = prompt;
  if (style !== "none") {
    finalPrompt += `\nStyle: ${style}`;
  }
  if (negativePrompt) {
    finalPrompt += `\nNegative prompt: ${negativePrompt}`;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: finalPrompt }],
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio,
      }
    }
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
}
