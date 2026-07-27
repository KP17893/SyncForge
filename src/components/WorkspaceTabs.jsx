import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Mic, MicOff, Send } from 'lucide-react';

export default function WorkspaceTabs({ roomId, aiContent, consoleContent }) {
  const [activeTab, setActiveTab] = useState('chat');
  
  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button onClick={() => setActiveTab('chat')} className={`px-4 py-3 text-sm font-medium ${activeTab === 'chat' ? 'border-b-2 border-blue-500 text-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}>Chat & Voice</button>
        <button onClick={() => setActiveTab('ai')} className={`px-4 py-3 text-sm font-medium ${activeTab === 'ai' ? 'border-b-2 border-purple-500 text-purple-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}>AI Reviewer</button>
        <button onClick={() => setActiveTab('console')} className={`px-4 py-3 text-sm font-medium ${activeTab === 'console' ? 'border-b-2 border-green-500 text-green-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}>Console Output</button>
      </div>
      
      <div className="flex-grow overflow-hidden relative">
        <div className={`absolute inset-0 ${activeTab === 'chat' ? 'block' : 'hidden'}`}>
           <ChatAndVoice roomId={roomId} />
        </div>
        <div className={`absolute inset-0 ${activeTab === 'ai' ? 'block' : 'hidden'} overflow-y-auto bg-gray-50`}>
           {aiContent}
        </div>
        <div className={`absolute inset-0 ${activeTab === 'console' ? 'block' : 'hidden'} bg-[#1e1e1e] text-green-400 font-mono text-sm p-4 overflow-y-auto`}>
           {consoleContent}
        </div>
      </div>
    </div>
  );
}

function ChatAndVoice({ roomId }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const streamRef = useRef();

  useEffect(() => {
    const s = io('/');
    setSocket(s);
    
    s.on('connect', () => {
      s.emit('join-room', roomId, s.id);
    });

    s.on('chat-message', (data) => {
      setMessages(prev => [...prev, data]);
    });
    
    return () => s.disconnect();
  }, [roomId]);

  const sendMessage = (e) => {
    e.preventDefault();
    if(input.trim() && socket) {
      socket.emit('chat-message', input);
      setInput('');
    }
  };

  const toggleAudio = async () => {
    if (!isAudioEnabled) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        streamRef.current = stream;
        setIsAudioEnabled(true);
      } catch (err) {
        console.error("Failed to get local stream", err);
      }
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setIsAudioEnabled(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-3 border-b flex justify-between items-center shadow-sm bg-gray-50">
         <div className="text-sm font-semibold text-gray-700">Team Comms</div>
         <button onClick={toggleAudio} className={`p-2 rounded-full ${isAudioEnabled ? 'bg-green-100 text-green-600 shadow-sm border border-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'} transition-all`}>
           {isAudioEnabled ? <Mic size={16} /> : <MicOff size={16} />}
         </button>
      </div>
      
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
           <div key={i} className={`flex flex-col ${msg.sender === socket?.id ? 'items-end' : 'items-start'}`}>
              <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm ${msg.sender === socket?.id ? 'bg-blue-600 text-white rounded-br-none shadow-sm' : 'bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200'}`}>
                {msg.message}
              </div>
           </div>
        ))}
        {messages.length === 0 && (
            <div className="text-center text-gray-400 text-sm mt-10">
                No messages yet. Say hello to your team!
            </div>
        )}
      </div>
      
      <div className="p-3 bg-white border-t border-gray-100">
        <form onSubmit={sendMessage} className="flex gap-2 relative">
          <input 
            type="text" 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            placeholder="Message room..." 
            className="flex-grow pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm transition-all"
          />
          <button type="submit" disabled={!input.trim()} className="absolute right-1 top-1 bottom-1 bg-blue-600 disabled:bg-blue-400 text-white p-2 rounded-full hover:bg-blue-700 transition flex items-center justify-center">
             <Send size={16} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
