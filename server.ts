import express from 'express';
import { Pool } from 'pg';
import multer from 'multer';
import Groq from 'groq-sdk';
import fs from 'fs';
import os from 'os';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Database Connection (Fallback to memory if DATABASE_URL is not set for local preview)
  let pool: Pool | null = null;
  const memoryDB: any[] = [];
  
  if (process.env.DATABASE_URL) {
    console.log("Connecting to Postgres...");
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  } else {
    console.warn("DATABASE_URL not set! Using in-memory fallback for local preview.");
  }

  // Initialize Groq SDK server-side securely
  const groq = new Groq({ 
    apiKey: process.env.GROQ_API_KEY || 'dummy_key_to_allow_boot' // Won't work until configured
  });

  const upload = multer({ dest: os.tmpdir() });

  // 1. Convert Audio to Text using Whisper
  app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
    try {
      if (!process.env.GROQ_API_KEY) {
        return res.status(400).json({ error: "GROQ_API_KEY not configured on server" });
      }
      if (!req.file) return res.status(400).json({ error: "No audio file provided" });

      const transcription = await groq.audio.transcriptions.create({
        file: fs.createReadStream(req.file.path),
        model: "whisper-large-v3",
        response_format: "json",
      });

      fs.unlinkSync(req.file.path); // cleanup
      res.json({ text: transcription.text });
    } catch (e: any) {
      console.error(e);
      if (req.file) fs.unlinkSync(req.file.path).catch(() => {});
      res.status(500).json({ error: e.message || "Transcription failed" });
    }
  });

  // 2. Parse Text to Nutrition JSON
  app.post('/api/parse', async (req, res) => {
    try {
      const { text } = req.body;
      const SYSTEM_PROMPT = `You are an AI nutritionist. User dictation: extract ALL food, estimate nutritional values exactly formatting as JSON.
Format: { "mealType": "Breakfast"|"Lunch"|"Dinner"|"Snack", "items": [ { "name": "", "amount": 100, "unit": "g", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0, "micronutrients": {"Iron":"10%"} } ]}`;

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(chatCompletion.choices[0]?.message?.content || '{}');
      res.json(parsed);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Parse failed" });
    }
  });

  // 3. Save Log
  app.post('/api/logs', async (req, res) => {
    try {
      if (pool) {
        const { mealType, items, totalCalories, rawText } = req.body;
        const result = await pool.query(
          `INSERT INTO logs (meal_type, total_calories, raw_text, items) VALUES ($1, $2, $3, $4) RETURNING *`,
          [mealType, totalCalories, rawText, JSON.stringify(items)]
        );
        res.json(result.rows[0]);
      } else {
        const log = { id: Date.now().toString(), timestamp: new Date().toISOString(), ...req.body };
        memoryDB.push(log);
        res.json(log);
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to save log" });
    }
  });

  // Vite Integration for frontend routes
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
