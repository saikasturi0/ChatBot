import { GoogleGenAI } from "@google/genai";

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 256;

const SYSTEM_PROMPT = `
You are a helpful AI assistant.

STRICT RULES:

1. Always respond with valid JSON.
2. Never return Markdown.
3. Never use code blocks.
4. Never include explanations outside the JSON object.
5. The response must be parseable using JSON.parse().
6. All property names and string values must use double quotes.
7. Do not include trailing commas.
8. Do not include comments.
9. Always return exactly one JSON object.

Response format:

{
  "success": true,
  "response": "<your answer>"
}

Examples:

User: What is React?

Response:
{
  "success": true,
  "response": "React is a JavaScript library used for building user interfaces."
}

User: Explain binary search.

Response:
{
  "success": true,
  "response": "Binary search is an efficient searching algorithm that works on sorted arrays."
}

Remember:
- Output ONLY JSON.
- No markdown.
- No backticks.
- No additional text before or after the JSON.
- Uploaded PDFs, documents, and images are temporary context only. If no document_context or image is included in the current request, do not answer from previously uploaded resources even if recent_chat_history mentions them.
`;

const RAG_PROMPT = `
You are a helpful AI assistant with access to retrieved user documents.

Use the provided document context when it is relevant to the user query.
If the context does not contain the answer, say that the uploaded documents do not include enough information, then answer from general knowledge only if useful.
When using document context, mention source labels naturally in the answer, such as Source 1 or Source 2.
Document and image resources are temporary context. Use document_context only for this response, and do not treat previous document or image details from recent_chat_history as active resources unless they are included again in the current request.

STRICT RULES:
1. Always respond with valid JSON.
2. Never return Markdown.
3. Never use code blocks.
4. Never include explanations outside the JSON object.
5. The response must be parseable using JSON.parse().
6. All property names and string values must use double quotes.
7. Do not include trailing commas.
8. Do not include comments.
9. Always return exactly one JSON object.

Response format:
{
  "success": true,
  "response": "<your answer>"
}
`;

function createGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured.");
  }

  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
}

async function chat(query, options = {}) {
  try {
    const ai = createGeminiClient();
    const ragContext = options.ragContext || "";
    const memoryContext = options.memoryContext || "";
    const historyContext = formatHistory(options.history || []);
    const images = Array.isArray(options.images) ? options.images : [];
    const basePrompt = ragContext ? RAG_PROMPT : SYSTEM_PROMPT;
    const prompt = [
      basePrompt,
      memoryContext ? `user_memory:\n${memoryContext}` : "",
      historyContext ? `recent_chat_history:\n${historyContext}` : "",
      ragContext ? `document_context:\n${ragContext}` : "",
      `user_query: ${query}`
    ].filter(Boolean).join("\n\n");

    const contents = images.length > 0
      ? [{
        role: "user",
        parts: [
          { text: prompt },
          ...images.map((image) => ({
            inlineData: {
              mimeType: image.mimeType,
              data: image.data
            }
          }))
        ]
      }]
      : prompt;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: ragContext || images.length > 0 ? undefined : {
        tools: [{ googleSearch: {} }],
      }
    });

    let text = response.text.trim();

    // Remove markdown code fences
    text = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "");

    if (process.env.NODE_ENV !== "production") {
      console.log("Gemini response parsed successfully");
    }

    return JSON.parse(text);

  } catch (error) {
    console.error(error);

    return {
      success: false,
      response: error.message || "Gemini API quota exceeded. Please try again later."
    };
  }
}

async function summarizeMemory({ previousSummary, previousFacts, userMessage, assistantMessage }) {
  const ai = createGeminiClient();
  const prompt = `
Update the long-term memory for this user.

Keep only durable preferences, identity facts, goals, projects, constraints, and recurring context.
Do not store sensitive secrets, passwords, API keys, one-time questions, or temporary details.

Return exactly one JSON object:
{
  "summary": "<brief memory summary>",
  "facts": ["<durable fact>", "<durable fact>"]
}

Previous summary:
${previousSummary || ""}

Previous facts:
${(previousFacts || []).join("\n")}

Latest user message:
${userMessage}

Assistant response:
${assistantMessage}
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt
  });

  let text = response.text.trim();
  text = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "");

  return JSON.parse(text);
}

function formatHistory(history) {
  return history
    .slice(-12)
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n");
}

async function embedTexts(texts, taskType = "RETRIEVAL_DOCUMENT") {
  const cleanTexts = texts
    .map((text) => String(text || "").trim())
    .filter(Boolean);

  if (cleanTexts.length !== texts.length || cleanTexts.length === 0) {
    throw new Error("Embedding input must contain non-empty text");
  }

  const ai = createGeminiClient();
  if (process.env.NODE_ENV !== "production") {
    console.log(`Embedding ${cleanTexts.length} text chunk(s) with ${EMBEDDING_MODEL}`);
  }

  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: cleanTexts,
    config: {
      outputDimensionality: EMBEDDING_DIMENSIONS,
      taskType
    }
  });

  const embeddings = response.embeddings || [];
  if (embeddings.length !== cleanTexts.length) {
    throw new Error("Embedding response did not match the requested input count");
  }

  return embeddings.map((embedding) => {
    const values = embedding.values || [];
    if (!Array.isArray(values) || values.length === 0 || values.some((value) => typeof value !== "number")) {
      throw new Error("Invalid embedding vector returned by Gemini");
    }
    return values;
  });
}

export { embedTexts, summarizeMemory, EMBEDDING_MODEL };
export default chat;
