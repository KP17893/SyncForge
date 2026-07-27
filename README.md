# SyncForge - Real-Time Collaborative Coding Platform

CollabEdit is a feature-rich, real-time collaborative code editor and workspace designed for remote developer pair programming, technical interviews, and team workshops. It supports real-time document synchronization, multi-language editing, live WebRTC voice calling, and AI code assistance.

---

## 🚀 Key Features

- **Real-Time Collaborative Editing**: Multi-user concurrent code editing powered by Socket.io document synchronization and CodeMirror 6.
- **Multi-Language Support**: Syntax highlighting and code editing modes for JavaScript, Python, C++, HTML, CSS, JSON, and Markdown.
- **Multi-Tab Workspaces**: Create, switch, and rename multiple tabs per room session.
- **WebRTC Voice Call & Chat**: Low-latency peer-to-peer audio calling and real-time room text chat for seamless team communication.
- **Gemini AI Code Assistant**: Automated code reviews, bug detection, refactoring tips, and line-by-line explanations.
- **Live Collaborator Presence**: Real-time connected user lists, active cursors, and presence indicators.
- **Session Persistence**: Automatically stores session history and room snapshots in MongoDB with fallback in-memory state.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, CodeMirror 6, Lucide Icons, Socket.io-client, WebRTC
- **Backend**: Node.js, Express, Socket.io, Mongoose (MongoDB)
- **AI Integration**: `@google/genai` (Google Gemini 2.5 Flash)

---

## 📦 Project Structure

```text
├── server.js              # Express + Socket.io server & MongoDB models
├── src/
│   ├── main.jsx           # React entry point
│   ├── App.jsx            # Main application layout & state manager
│   ├── index.css          # Global Tailwind CSS configuration
│   └── components/
│       ├── Editor.jsx         # CodeMirror 6 text editor component
│       └── WorkspaceTabs.jsx  # Multi-tab room management component
├── package.json           # Project dependencies & npm scripts
├── vite.config.js         # Vite dev server configuration
```

---

## 📋 Prerequisites

Ensure you have the following installed on your machine:

1. **Node.js** (v18.0.0 or higher) - [Download Node.js](https://nodejs.org/)
2. **MongoDB** (Local instance or MongoDB Atlas cluster) - [Download MongoDB](https://www.mongodb.com/)
3. **npm** (included with Node.js)

---


## 🌐 Connecting Across the Local Network (Wi-Fi)

To collaborate with another device (such as a laptop, phone, or tablet) connected to the same Wi-Fi network:

1. Find your machine's local IP address:
   - **Windows**: Run `ipconfig` in Command Prompt (look for *IPv4 Address*, e.g., `192.168.1.15`).
   - **macOS / Linux**: Run `ifconfig` or `ip a` in Terminal.
2. Open `http://<YOUR_LOCAL_IP>:3000` on the other device.
3. Enter the same **Room ID** on both devices to join the same real-time session!

---

## 📜 Available Scripts

- `npm run dev` - Starts the backend Express server and Vite development server in watch mode.
- `npm run build` - Builds the production client bundle using Vite.
- `npm start` - Runs the production server using Node.js.


# SyncForge
