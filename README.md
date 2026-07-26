# ChatBot Deployment Guide

Feature-complete React + Vite frontend with a Node.js + Express backend, MongoDB Atlas storage, Gemini chat/image/RAG support, memory, chat history, and web search.

## Tech Stack

- Frontend: React, Vite
- Backend: Node.js, Express
- Database: MongoDB Atlas with Mongoose
- AI: Google Gemini API via `@google/genai`
- Uploads: In-memory upload handling for images and RAG documents

## Project Structure

```text
client/   React + Vite app
server/   Express API, auth, chat, memory, RAG, Gemini integration
```

## Environment Variables

Copy the examples before running locally:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### Backend

Set these in `server/.env` or your hosting provider:

```env
NODE_ENV=production
PORT=3000
CLIENT_URL=https://your-frontend-domain.vercel.app
SERVER_URL=https://your-backend-service.onrender.com
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-secret
GEMINI_API_KEY=replace-with-your-gemini-api-key
JSON_BODY_LIMIT=2mb
FORM_BODY_LIMIT=2mb
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
```

### Frontend

Set these in `client/.env` locally and in Vercel/Railway environment settings:

```env
VITE_API_URL=https://your-backend-service.onrender.com
```

## Run Locally

Install dependencies:

```bash
cd server
npm install

cd ../client
npm install
```

Start backend:

```bash
cd server
npm run dev
```

Start frontend:

```bash
cd client
npm run dev
```

## Build

Frontend:

```bash
cd client
npm run build
```

Backend syntax check:

```bash
cd server
npm run check
```

## Deploy Frontend on Vercel

1. Import the repository.
2. Set root directory to `client`.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Add `VITE_API_URL` with your deployed backend URL.

## Deploy Backend on Render or Railway

1. Set root directory to `server`.
2. Build command: `npm install`.
3. Start command: `npm start`.
4. Add all backend environment variables.
5. Set `CLIENT_URL` to the deployed frontend URL.
6. Confirm `/health` returns `{ "success": true }`.

## MongoDB Atlas Setup

1. Create an Atlas cluster.
2. Create a database user.
3. Allow your backend host IP or use `0.0.0.0/0` if your platform requires dynamic outbound IPs.
4. Copy the connection string into `MONGODB_URI`.

## Gemini API Setup

1. Create a Gemini API key in Google AI Studio.
2. Add it as `GEMINI_API_KEY` on the backend host.
3. Do not expose this key in frontend environment variables.

## Troubleshooting

- CORS errors: verify `CLIENT_URL` exactly matches the frontend origin.
- Cookie auth failing in production: use HTTPS for both frontend and backend.
- Mongo connection failing: verify Atlas network access, username/password, and database name.
- Gemini failures: verify `GEMINI_API_KEY` and API quota.
- Upload failures: keep documents/images under the configured upload limits.
