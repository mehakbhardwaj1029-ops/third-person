"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeChatWithGemini = analyzeChatWithGemini;
async function analyzeChatWithGemini(prompt) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [{ text: prompt }],
                },
            ],
            generationConfig: {
                maxOutputTokens: 800,
                temperature: 0.7,
            },
        }),
    });
    const data = await res.json();
    console.log("🔍 FULL GEMINI RESPONSE:", JSON.stringify(data, null, 2));
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
    try {
        return JSON.parse(cleaned);
    }
    catch {
        console.error("❌ Raw Gemini response:", cleaned);
        throw new Error("Invalid JSON from Gemini");
    }
}
