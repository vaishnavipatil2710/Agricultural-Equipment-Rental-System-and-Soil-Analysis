const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const app = express();

app.use(cors());
app.use(express.json());


// =====================================================
// GEMINI CLIENT
// =====================================================

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


// =====================================================
// TEST ROUTE
// =====================================================

app.get("/", (req, res) => {
    res.json({
        message: "Agri AI Service is running 🌱"
    });
});


// =====================================================
// AI CHAT API
// =====================================================

app.post("/api/chat", async (req, res) => {

    try {

        const userMessage = req.body.message;

        if (!userMessage || userMessage.trim() === "") {
            return res.status(400).json({
                error: "Message is required"
            });
        }


        // Send question to Gemini
        const response = await ai.models.generateContent({

            model: "gemini-3.6-flash",

            contents: userMessage,

            config: {
                systemInstruction: `
You are Agri AI, an agricultural assistant for the AgriRent Hub application.

Your job is to answer questions related to:

- Agriculture
- Crops
- Soil
- Fertilizers
- Irrigation
- Agricultural equipment
- Farming practices
- Crop diseases and pests
- General farming guidance

IMPORTANT LANGUAGE RULE:

Detect the language used by the user.

Answer in the SAME language as the user's question.

Examples:

English question → English answer.
Marathi question → Marathi answer.
Hindi question → Hindi answer.
Mixed English and Marathi → Respond naturally using the dominant language.

Do not unnecessarily translate the user's question.

Give simple, clear and practical answers that farmers can understand.

For questions involving fertilizer dosage, pesticides, crop diseases, or other potentially harmful agricultural decisions, recommend checking the product label and consulting a qualified local agricultural expert.

Do not pretend to be a human agricultural expert.

Keep answers reasonably concise.
`
            }

        });


        const answer = response.text;


        res.json({
            answer: answer
        });


    } catch (error) {

        console.error("Gemini API Error:", error);

        res.status(500).json({
            error: "AI service failed",
            details: error.message
        });

    }

});


// =====================================================
// START SERVER
// =====================================================

const PORT = 3000;

app.listen(PORT, () => {

    console.log(
        `Agri AI Service running at http://localhost:${PORT}`
    );

});