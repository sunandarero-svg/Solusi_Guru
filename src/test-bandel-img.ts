import { readFile } from "fs/promises";
import path from "path";

async function testBandelImage() {
  const apiKey = "sk-qwen-ff6a4c95f769e0f97797d84e155a2f31f8b9ff13fc84645e";
  const modelName = "deepseek-v4-flash-vision-exp";
  
  const contentParts = [
    { type: "text", text: "Describe this image in a JSON object with a single key \"description\"." },
    { type: "image_url", image_url: { url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" } }
  ];

  try {
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
        max_tokens: 500,
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.text();
    console.log("Response:", data);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

testBandelImage();
