import React, { useEffect, useState, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { yCollab } from 'y-codemirror.next';
import { EditorView } from '@codemirror/view';
import { basicSetup } from '@uiw/react-codemirror';

export default function Editor({ roomId, setLocalCode }) {
  const [provider, setProvider] = useState(null);
  const [ytext, setYtext] = useState(null);

  useEffect(() => {
    const ydoc = new Y.Doc();
    
    // Connect to Y-Websocket backend
    // Ws location depends on window location
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/yjs`;
    
    const wsProvider = new WebsocketProvider(wsUrl, roomId, ydoc);
    const text = ydoc.getText('codemirror');
    
    setProvider(wsProvider);
    setYtext(text);

    return () => {
      wsProvider.destroy();
      ydoc.destroy();
    };
  }, [roomId]);

  if (!provider || !ytext) {
    return <div className="p-4 text-gray-500">Connecting to collaborative editor...</div>;
  }

  return (
    <div className="h-full w-full overflow-hidden flex flex-col bg-[#1e1e1e]">
      <CodeMirror
        value={ytext.toString()}
        height="100%"
        theme="dark"
        extensions={[
          basicSetup(),
          javascript({ jsx: true }),
          yCollab(ytext, provider.awareness),
          EditorView.updateListener.of((update) => {
             if(update.docChanged) {
                 setLocalCode(update.state.doc.toString());
             }
          })
        ]}
        className="flex-grow overflow-auto"
        style={{ fontSize: '14px', height: '100%' }}
      />
    </div>
  );
}
