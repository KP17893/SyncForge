import React, { useState, useEffect } from 'react';
import Editor from './components/Editor';
import WorkspaceTabs from './components/WorkspaceTabs';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { Play, Sparkles, Save, Code2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function App() {
  const [roomId, setRoomId] = useState('');
  const [localCode, setLocalCode] = useState('');
  
  const [consoleOutput, setConsoleOutput] = useState('// Output will appear here...\n');
  const [aiReview, setAiReview] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Determine room ID from URL or generate one
    const params = new URLSearchParams(window.location.search);
    let room = params.get('room');
    if (!room) {
      room = uuidv4().substring(0, 8);
      const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?room=${room}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
    setRoomId(room);
  }, []);

  const runCode = async () => {
    setIsExecuting(true);
    setConsoleOutput('Running...\n');
    try {
      const response = await axios.post('/api/execute', { code: localCode });
      setConsoleOutput(response.data.output || '// Finished without output');
    } catch (err) {
      setConsoleOutput(`Error executing code: ${err.message}`);
    }
    setIsExecuting(false);
  };

  const askAiReview = async () => {
    setIsReviewing(true);
    try {
      const res = await axios.post('/api/review', { code: localCode });
      setAiReview(res.data.review);
    } catch (err) {
      setAiReview(`Error: ${err.message}`);
    }
    setIsReviewing(false);
  };

  const saveSession = async () => {
    setIsSaving(true);
    try {
      await axios.post('/api/save-session', {
        sessionId: roomId,
        code: localCode,
        events: [] // We could push YJS state vectors here for full history replay
      });
      alert('Session saved to database!');
    } catch (err) {
      alert('Failed to save. Is MongoDB connected?');
    }
    setIsSaving(false);
  };

  if (!roomId) return <div className="h-screen w-screen flex items-center justify-center bg-gray-50"><div className="animate-pulse flex items-center gap-2"><div className="w-4 h-4 bg-blue-600 rounded-full"></div> Loading Workspace...</div></div>;

  return (
    <div className="flex flex-col h-screen w-screen bg-white font-sans text-gray-900 overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white shadow-sm z-10 relative">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white">
            <Code2 size={20} />
          </div>
          <h1 className="text-lg font-bold text-gray-800 tracking-tight hidden sm:block">CollabEdit</h1>
          <div className="px-3 py-1 bg-gray-100 rounded-md border border-gray-200 text-xs font-mono text-gray-600 flex items-center gap-2 ml-4 shadow-inner">
             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
             Room: {roomId}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={askAiReview}
            disabled={isReviewing}
            className="px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Sparkles size={16} />
            {isReviewing ? 'Reviewing...' : 'AI Review'}
          </button>
          <button 
            onClick={saveSession}
            disabled={isSaving}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-md transition-colors flex items-center gap-1.5 hidden sm:flex disabled:opacity-50"
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button 
            onClick={runCode}
            disabled={isExecuting}
            className="px-4 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-70 ml-2"
          >
            <Play size={16} fill="currentColor" />
            {isExecuting ? 'Running...' : 'Run'}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-grow flex flex-col md:flex-row overflow-hidden bg-gray-50">
        
        {/* Editor Pane */}
        <div className="w-full md:w-2/3 h-1/2 md:h-full border-b md:border-b-0 border-gray-200 flex flex-col">
          <Editor roomId={roomId} setLocalCode={setLocalCode} />
        </div>

        {/* Tools Pane */}
        <div className="w-full md:w-1/3 h-1/2 md:h-full flex flex-col shadow-[-4px_0_12px_rgba(0,0,0,0.03)] z-10">
          <WorkspaceTabs 
             roomId={roomId} 
             consoleContent={<pre className="whitespace-pre-wrap font-mono text-sm">{consoleOutput}</pre>}
             aiContent={
                <div className="p-5">
                   {aiReview ? (
                      <div className="prose prose-sm prose-purple max-w-none">
                         <ReactMarkdown>{aiReview}</ReactMarkdown>
                      </div>
                   ) : (
                      <div className="text-center text-gray-400 mt-10">
                         <Sparkles size={32} className="mx-auto mb-3 opacity-50" />
                         <p>Click "AI Review" to analyze your code.</p>
                      </div>
                   )}
                </div>
             }
          />
        </div>

      </main>
    </div>
  );
}
