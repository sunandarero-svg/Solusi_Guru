import { readFile } from "fs/promises";
import path from "path";

async function testBandel() {
  const apiKey = "sk-qwen-ff6a4c95f769e0f97797d84e155a2f31f8b9ff13fc84645e";
  const modelName = "deepseek-v4-flash-vision-exp";
  
  const contentParts = [
    { type: "text", text: "Please return a JSON object with a single field \"status\" set to \"ok\"." }
  ];

  try {
    console.log("Sending request...");
    const response = await fetch("https://bandelbanget.xyz/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: "user",
            content: contentParts,
          },
        ],
        temperature: 0.2,
        max_tokens: 100,
        response_format: { type: "json_object" },
      }),
    });

    console.log("Status:", response.status);
    const data = await response.text();
    console.log("Response:", data);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

testBandel();
