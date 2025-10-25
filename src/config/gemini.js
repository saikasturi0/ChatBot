import { GoogleGenAI } from "@google/genai";

async function runChat(prompt) {
  const ai = new GoogleGenAI({
    apiKey: "", 
  });

  const tools = [{ googleSearch: {} }];

  const config = {
    thinkingConfig: { thinkingBudget: -1 },
    tools,
    responseMimeType: "text/plain",
  };

  const model = "gemini-2.5-pro";

  const contents = [
    {
      role: "user",
      parts: [{ text: prompt }],
    },
  ];

  try {
    const response = await ai.models.generateContent({
      model,
      config,
      contents,
    });

    // ✅ Extract text (safe for JS)
    const fullText =
      response?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text)
        ?.join("") || "No response from model";

    return fullText;
  } catch (error) {
    console.error("Error while calling Gemini API:", error);
    return "Sorry, an error occurred while generating the response.";
  }
}

export default runChat;
