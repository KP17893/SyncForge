import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { WebSocketServer } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils';
import mongoose from 'mongoose';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import vm from 'node:vm';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/collaborative-code';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log('MongoDB connection error. Starting without persistence.', err.message));

// Session Schema for Event Sourcing
const sessionSchema = new mongoose.Schema({
  sessionId: String,
  code: String,
  history: Array, // Could store snapshots or events
  updatedAt: { type: Date, default: Date.now }
});
const Session = mongoose.model('Session', sessionSchema);

// Code Execution API Route (Safe VM Sandbox)
app.post('/api/execute', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || !code.trim()) {
      return res.json({ output: '// No code provided to execute.' });
    }

    let logs = [];
    const customConsole = {
      log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
      error: (...args) => logs.push('[ERROR] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
      warn: (...args) => logs.push('[WARN] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
      info: (...args) => logs.push('[INFO] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '))
    };

    const sandbox = {
      console: customConsole,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      Math,
      Date,
      Array,
      Object,
      String,
      Number,
      Boolean,
      JSON,
      RegExp,
      Map,
      Set
    };

    const context = vm.createContext(sandbox);
    const script = new vm.Script(code);
    
    const result = script.runInContext(context, { timeout: 3000 });
    
    let output = logs.join('\n');
    if (!output && result !== undefined) {
      output = String(result);
    }
    if (!output) {
      output = '// Code executed successfully with no output.';
    }

    res.json({ output });
  } catch (err) {
    res.json({ output: `Runtime Error: ${err.message}` });
  }
});

// Gemini AI Route
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'fake-key' });
app.post('/api/review', async (req, res) => {
  try {
    const { code } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.json({ review: 'Gemini API Key missing. Please configure it in the secrets menu.' });
    }
    const prompt = `Review the following JavaScript code for an interview context. Point out bugs, performance issues, and suggest improvements. Keep it concise.\n\nCode:\n${code}`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    res.json({ review: response.text });
  } catch (error) {
    console.error('AI Review error:', error);
    res.status(500).json({ error: 'Failed to generate AI review' });
  }
});

app.post('/api/save-session', async (req, res) => {
  try {
    const { sessionId, code, events } = req.body;
    await Session.findOneAndUpdate(
      { sessionId },
      { code, history: events, updatedAt: new Date() },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving session:', error);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

// Socket.io for Voice/Video Signaling & Chat
const usersInRoom = {};
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    if (!usersInRoom[roomId]) usersInRoom[roomId] = [];
    usersInRoom[roomId].push({ socketId: socket.id, userId });
    
    // Notify others
    socket.to(roomId).emit('user-joined', socket.id);

    socket.on('signal', (data) => {
      io.to(data.to).emit('signal', {
        from: socket.id,
        signal: data.signal
      });
    });
    
    socket.on('chat-message', (msg) => {
      io.to(roomId).emit('chat-message', { sender: socket.id, message: msg });
    });

    socket.on('disconnect', () => {
      usersInRoom[roomId] = usersInRoom[roomId].filter(u => u.socketId !== socket.id);
      socket.to(roomId).emit('user-left', socket.id);
    });
  });
});

// Y-Websocket setup for CRDT (Code Collaboration)
const wss = new WebSocketServer({ noServer: true });
server.on('upgrade', (request, socket, head) => {
  if (request.url.startsWith('/yjs')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});
wss.on('connection', setupWSConnection);

// Vite middleware for dev
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
