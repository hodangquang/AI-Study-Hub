# Gr8 AI Study Hub

Ứng dụng học tập (giao diện từ **ai-study-hub**, API Gemini).

## Chạy dev — http://localhost:5173

```bash
npm install
cp .env.example .env
# Thêm GEMINI_API_KEY vào .env
```

**Terminal 1** — giao diện:

```bash
npm run dev
```

**Terminal 2** — API AI (bắt buộc cho chat & phân tích tài liệu):

```bash
npm run dev:api
```

Hoặc: `npm run dev:all`

## Cấu trúc

| Thư mục | Vai trò |
|---------|---------|
| `src/` | Mã chạy chính (từ ai-study-hub) |
| `src/data.ts` | Dữ liệu mẫu tài liệu & nhóm |
| `server.ts` | `/api/gemini/chat`, `/api/gemini/analyze-doc` |
| `zip/`, `ai-study-hub/` | Bản gốc tham khảo (không dùng khi build) |

## Tính năng chính

- Dashboard, Tài liệu, Yêu thích, Nhóm, Chatbot AI
- Overlay phân tích AI tài liệu (`AIDocumentOverlay`)
- Upload modal kéo-thả (`UploadModal`)
- Thùng rác, Cài đặt, Admin, Trợ giúp
