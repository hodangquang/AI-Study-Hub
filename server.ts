import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { "User-Agent": "aistudio-build" },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const apiOnly = process.env.API_ONLY === "1";
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      aiEnabled: !!getGeminiClient(),
      time: new Date(),
    });
  });

  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: "Invalid messages array." });
        return;
      }

      const client = getGeminiClient();
      if (!client) {
        res.json({
          role: "model",
          text: `**CẢNH BÁO HỆ THỐNG**: Chưa cấu hình \`GEMINI_API_KEY\` trong file \`.env\`.\n\n*Phản hồi mô phỏng*: Xin chào! Tôi sẵn sàng hỗ trợ ôn tập Cơ sở Dữ liệu, Giải tích, RAG và Marketing. Thêm khóa API để chat với Gemini thật.`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const systemInstruction =
        "Bạn là Trợ lý AI học tập của 'AI Study Hub'. Hỗ trợ sinh viên Việt Nam học tập, tóm tắt giáo trình, giải đáp thắc mắc. Trả lời tiếng Việt, thân thiện, dùng Markdown rõ ràng.";

      const formattedContents = messages.map((msg: { role: string; text: string }) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: { systemInstruction, temperature: 0.7 },
      });

      res.json({
        role: "model",
        text: response.text || "Tôi không nhận được phản hồi phù hợp từ mô hình.",
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Gemini API error";
      console.error("Gemini Chat API Error:", error);
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/gemini/analyze-doc", async (req, res) => {
    try {
      const { fileTitle, fileContent, fileType } = req.body;
      if (!fileTitle) {
        res.status(400).json({ error: "Missing file title." });
        return;
      }

      const payload =
        fileContent ||
        `Tài liệu mang tên ${fileTitle} thuộc định dạng ${fileType || "tài liệu học tập"}.`;

      const client = getGeminiClient();
      if (!client) {
        res.json({
          summary: `Tài liệu ${fileTitle} nghiên cứu các khái niệm cơ bản liên quan đến nội dung học tập.`,
          insights: [
            "Giới thiệu tổng quan cấu trúc lý thuyết và phương pháp tiếp cận chủ đề.",
            "Cung cấp các công thức hoặc mô hình thiết kế quan trọng.",
            "Hướng dẫn thực hành dựa trên ví dụ cụ thể.",
            "Câu hỏi ôn tập bám sát đề thi.",
          ],
          topics: ["Tính ứng dụng cao", "Chương trình cốt lõi", "Tài liệu tự học"],
          advice:
            "Dành 30–45 phút/ngày đọc lý thuyết và làm bài tập cuối chương. Dùng chatbot AI Study Hub khi gặp vướng mắc!",
        });
        return;
      }

      const systemInstruction =
        "Bạn là chuyên gia đọc hiểu tài liệu của 'AI Study Hub'. Phân tích và trả về JSON theo schema.";

      const prompt = `Hãy phân tích tài liệu sau:\nTiêu đề: ${fileTitle}\nNội dung: ${payload}`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: "Tóm tắt 2-3 câu bằng tiếng Việt.",
              },
              insights: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "4 luận điểm trọng tâm.",
              },
              topics: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 chủ đề nổi bật.",
              },
              advice: {
                type: Type.STRING,
                description: "Lời khuyên ôn tập.",
              },
            },
            required: ["summary", "insights", "topics", "advice"],
          },
        },
      });

      const resultText = response.text;
      if (resultText) {
        res.json(JSON.parse(resultText));
      } else {
        throw new Error("Empty analysis result from model.");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Document analysis error";
      console.error("Gemini doc analysis Error:", error);
      res.status(500).json({ error: message });
    }
  });

  if (apiOnly) {
    // API only — frontend via Vite :5173
  } else if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  const httpServer = app.listen(PORT, "0.0.0.0", () => {
    if (apiOnly) {
      console.log(`API server: http://localhost:${PORT}`);
      console.log(`Frontend: npm run dev → http://localhost:5173`);
    } else {
      console.log(`Server: http://localhost:${PORT}`);
    }
  });

  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `\nPort ${PORT} đang được dùng. Ctrl+C terminal cũ hoặc: taskkill /PID <pid> /F\n`,
      );
      process.exit(1);
    }
    throw err;
  });
}

startServer();
