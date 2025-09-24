import { GoogleGenAI } from "@google/genai";

async function runChat(prompt) {
  const ai = new GoogleGenAI({
    apiKey:  "AIzaSyCA0zv53hJOYh3SPeJRnf0dugwOjeOLdto",
  });

  const tools = [
    {
      googleSearch: {},
    },
  ];

  const config = {
    thinkingConfig: {
      thinkingBudget: -1,
    },
    tools,
    responseMimeType: 'text/plain',
  };

  const model = 'gemini-2.5-pro';

  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: prompt, 
        },
      ],
    },
  ];

  const response = await ai.models.generateContentStream({
    model,
    config,
    contents,
  });

  let fullText = '';
  for await (const chunk of response) {
    fullText += chunk.text || '';
  }

  console.log(fullText);

//   for await (const chunk of response) {
//     console.log(chunk.text || '');
//     // process.stdout.write(chunk.text || '');
//   }
return fullText; 
}

export default runChat;
