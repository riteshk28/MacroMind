# Vercel Deployment & NeonDB Guidelines

NutriVoice is built as a Full-Stack application using Vite (Frontend) and Express (Backend). It securely handles Groq API calls and connects to a NeonDB PostgreSQL database to persist your nutrition logs.

## 1. Database Setup (NeonDB)

1. Go to [Neon.tech](https://neon.tech/) and create a free PostgreSQL project.
2. Go to the **SQL Editor** in your Neon dashboard and run the following queries to create the necessary table:

\`\`\`sql
CREATE TABLE logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    meal_type VARCHAR(50) NOT NULL,
    total_calories INTEGER NOT NULL,
    raw_text TEXT NOT NULL,
    items JSONB NOT NULL
);
\`\`\`

3. Go to the **Dashboard** and copy your Postgres Connection String.

## 2. Setting up Groq

1. Go to [Groq Console](https://console.groq.com/keys) and generate an API key. This key will be safely processed on your backend, keeping it hidden from the browser.

## 3. Deploying to Vercel

1. Push your code to a GitHub repository.
2. Log in to [Vercel](https://vercel.com/) and create a new project from your repository.
3. Vercel will automatically detect the \`vercel.json\` configuration provided in this project, which routes \`/api/*\` traffic to the Express backend (\`server.ts\`) and serves the Vite frontend statically.
4. **Environment Variables**: Before hitting deploy, add the following environment variables in Vercel settings:
   - \`GROQ_API_KEY\` = \`gsk_...\` (Your Groq API key)
   - \`DATABASE_URL\` = \`postgresql://...\` (Your Neon connection string)
5. Click **Deploy**.

## Architecture Notes
- **Voice Recognition**: We migrated from the browser's native speech API to capturing standard audio and routing it through Groq's insanely fast Whisper (speech-to-text) model for high reliability.
- **Privacy Check**: All environment variables are stored server-side. No API keys are exposed to the client.
- **Vercel Config**: The included \`vercel.json\` file leverages \`@vercel/node\` to run the Express API endpoints as serverless functions.
