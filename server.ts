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
    let tempFilePath = '';
    try {
      if (!process.env.GROQ_API_KEY) {
        return res.status(400).json({ error: "GROQ_API_KEY not configured on server" });
      }
      if (!req.file) return res.status(400).json({ error: "No audio file provided" });

      const extension = req.file.originalname.split('.').pop() || 'webm';
      tempFilePath = req.file.path + '.' + extension;
      fs.renameSync(req.file.path, tempFilePath);

      const transcription = await groq.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: "whisper-large-v3",
        response_format: "json",
      });

      fs.unlinkSync(tempFilePath); // cleanup
      res.json({ text: transcription.text });
    } catch (e: any) {
      console.error(e);
      if (tempFilePath) {
         try { fs.unlinkSync(tempFilePath); } catch(_) {}
      }
      if (req.file && req.file.path) {
         try { fs.unlinkSync(req.file.path); } catch(_) {}
      }
      res.status(500).json({ error: e.message || "Transcription failed" });
    }
  });

  // 2. Parse Text to Nutrition JSON using Gemini
  app.post('/api/parse', async (req, res) => {
    try {
      const { text } = req.body;
      const SYSTEM_PROMPT = `You are an expert AI nutritionist. User dictation: extract ALL food, estimate nutritional values exactly formatting as JSON. Carefully consider the state of the food (e.g. cooked vs raw) as it dramatically changes the weight-to-calorie ratio. E.g. 150g of cooked chicken breast is ~248 calories and ~46g protein.
Format: { "mealType": "Breakfast"|"Lunch"|"Dinner"|"Snack", "items": [ { "name": "", "amount": 100, "unit": "g", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0, "micronutrients": {"Iron":"10%"} } ]}`;

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
           { role: 'user', parts: [{ text: SYSTEM_PROMPT + '\n\n' + text }] }
        ],
        config: {
           responseMimeType: 'application/json',
           temperature: 0.1
        }
      });

      const parsed = JSON.parse(response.text || '{}');
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
        const row = result.rows[0];
        res.json({
          id: row.id,
          timestamp: row.timestamp,
          mealType: row.meal_type,
          totalCalories: row.total_calories,
          rawText: row.raw_text,
          items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items
        });
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

  // 4. Delete Log
  app.delete('/api/logs/:id', async (req, res) => {
    try {
      const { id } = req.params;
      if (pool) {
        await pool.query(`DELETE FROM logs WHERE id = $1`, [id]);
        res.json({ success: true });
      } else {
        const index = memoryDB.findIndex(l => l.id === id);
        if (index > -1) memoryDB.splice(index, 1);
        res.json({ success: true });
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to delete log" });
    }
  });

  // 5. Get Logs
  app.get('/api/logs', async (req, res) => {
    try {
      if (pool) {
        const result = await pool.query(`SELECT * FROM logs ORDER BY timestamp DESC LIMIT 200`);
        const logs = result.rows.map(row => ({
          id: row.id,
          timestamp: row.timestamp,
          mealType: row.meal_type,
          totalCalories: row.total_calories,
          rawText: row.raw_text,
          items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items
        }));
        res.json(logs);
      } else {
        res.json(memoryDB);
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });

  const memoryWeightDB: any[] = [];

  // 6. Save Weight
  app.post('/api/weight', async (req, res) => {
    try {
      const { weight } = req.body;
      if (pool) {
        const result = await pool.query(
          `INSERT INTO weight_logs (weight) VALUES ($1) RETURNING *`,
          [weight]
        );
        res.json(result.rows[0]);
      } else {
        const log = { id: Date.now().toString(), timestamp: new Date().toISOString(), weight };
        memoryWeightDB.push(log);
        res.json(log);
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to save weight" });
    }
  });

  // 7. Get Weight Logs
  app.get('/api/weight', async (req, res) => {
    try {
      if (pool) {
        const result = await pool.query(`SELECT * FROM weight_logs ORDER BY timestamp ASC`);
        res.json(result.rows);
      } else {
        res.json(memoryWeightDB);
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to fetch weight logs" });
    }
  });

  // 8. Delete Weight Log
  app.delete('/api/weight/:id', async (req, res) => {
    try {
      const { id } = req.params;
      if (pool) {
        await pool.query(`DELETE FROM weight_logs WHERE id = $1`, [id]);
        res.json({ success: true });
      } else {
        const index = memoryWeightDB.findIndex(l => l.id === id);
        if (index > -1) memoryWeightDB.splice(index, 1);
        res.json({ success: true });
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to delete weight log" });
    }
  });

  // 9. Calculate Macros with Gemini
  app.post('/api/calculate-macros', async (req, res) => {
    try {
      const { profile } = req.body;
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const prompt = `You are a world-class sports nutritionist. Based on the following user profile, calculate their optimal Exact Target Calories (TDEE adjusted for goal) and Macronutrients (Protein, Carbs, Fat in grams).

      Profile:
      - Age: ${profile.age}
      - Gender: ${profile.gender}
      - Height: ${profile.height} cm
      - Weight: ${profile.weight} kg
      - Activity Level Factor: ${profile.activityLevel} (1.2 sedentary -> 1.7+ highly active)
      - Weekly Goal Pace: ${profile.targetPace}
      - Diet Preference: ${profile.dietPreference}
      - Custom Notes: ${profile.activityNotes || 'None'}

      Please calculate their BMR (e.g. Mifflin-St Jeor), multiply by activity level to get TDEE, and apply the exact deficit/surplus based on their goal pace.
      Split macros based on their diet preference (e.g. Keto is low carb high fat, High Protein is very high protein, Balanced is 30/40/30). Ensure adequate protein for muscle maintenance.
      
      IMPORTANT: Return ONLY a valid JSON object matching this schema exactly:
      {
        "calories": 2000,
        "protein": 150,
        "carbs": 200,
        "fat": 65,
        "explanation": "Brief 2-sentence explanation of calculation and approach."
      }`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
           responseMimeType: 'application/json',
           temperature: 0.1
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (e: any) {
      console.error('Macro calculation error:', e);
      res.status(500).json({ error: 'Failed to calculate macros via AI' });
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
