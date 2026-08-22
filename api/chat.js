const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static('.'));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
    try {
        const { message, mode, imageBase64, mimeType } = req.body;

        // กำหนดชื่อโมเดลตามตัวเลือก
        let modelName = 'gemini-1.5-flash-latest';
        let systemInstruction = '';

        if (mode === 'expert') {
            modelName = 'gemini-1.5-pro-latest';
            systemInstruction = 'คุณคือผู้เชี่ยวชาญ คอยให้คำตอบที่ละเอียด แม่นยำ และเป็นทางการ';
        } else if (mode === 'dumb') {
            modelName = 'gemini-1.5-flash-latest';
            systemInstruction = 'คุณคือ AI ตลก กวนประสาท ตอบคำตอบกวนๆ แต่ยังให้ความรู้แบบสั้นๆ';
        } else {
            // โหมดปกติ
            systemInstruction = 'คุณคือ ATTACK AI ผู้ช่วยอัจฉริยะที่ตอบคำถามได้อย่างรวดเร็วและถูกต้อง';
        }

        const model = genAI.getGenerativeModel({ 
            model: modelName,
            systemInstruction: systemInstruction 
        });

        let contents = [];
        if (imageBase64 && mimeType) {
            contents = [
                {
                    inlineData: {
                        data: imageBase64,
                        mimeType: mimeType
                    }
                },
                message || 'ช่วยอธิบายภาพนี้'
            ];
        } else {
            contents = [message];
        }

        const result = await model.generateContent(contents);
        const response = await result.response;
        const reply = response.text();

        res.json({ success: true, reply });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
