import React, { useState, useEffect } from 'react';
import './App.css';
import ConnectionManager from './Utils/ConnectionManager';

function App() {
  const [manager, setManager] = useState(null);
  const [status, setStatus] = useState('disconnected');
  const [roomInfo, setRoomInfo] = useState({});
  const [logs, setLogs] = useState([]);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [remoteStreams, setRemoteStreams] = useState([]);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    // Initialize ConnectionManager on startup
    const initManager = async () => {
      try {
        addLog("🚀 Initializing ConnectionManager...");
        const newManager = new ConnectionManager();
        
        addLog("✅ SDP initialized");
        
        setManager(newManager);
        window.debugManager = newManager;
        addLog("🎯 ConnectionManager ready!");
      } catch (error) {
        addLog(`💥 Failed to initialize: ${error.message}`);
      }
    };

    initManager();
  }, []);

  const handleCreateRoom = async () => {
    if (!manager) {
      addLog("❌ Manager not initialized");
      return;
    }

    try {
      addLog("🏠 Creating room...");
      setStatus('creating');
      
      await manager.createRoom("Test Room Alpha", "Alice");
      
      const roomData = {
        roomId: manager.getRoomId(),
        userId: manager.getUserId(),
        role: manager.role,
        status: manager.getRoomStatus()
      };
      
      setRoomInfo(roomData);
      setStatus('connected');
      addLog(`✅ Room created! ID: ${roomData.roomId}, User: ${roomData.userId}`);
      addLog(`👑 Role: ${roomData.role}`);
      
    } catch (error) {
      addLog(`💥 Create room failed: ${error.message}`);
      setStatus('disconnected');
    }
  };

  const handleJoinRoom = async () => {
    if (!manager) {
      addLog("❌ Manager not initialized");
      return;
    }

    if (!roomIdInput.trim()) {
      addLog("❌ Please enter a Room ID");
      return;
    }

    try {
      addLog(`🚪 Joining room: ${roomIdInput}...`);
      setStatus('joining');
      
      await manager.joinRoom(roomIdInput.trim(), "Bob");
      
      const roomData = {
        roomId: manager.getRoomId(),
        userId: manager.getUserId(),
        role: manager.role,
        status: manager.getRoomStatus()
      };
      
      setRoomInfo(roomData);
      setStatus('connected');
      addLog(`✅ Joined room! ID: ${roomData.roomId}, User: ${roomData.userId}`);
      addLog(`👤 Role: ${roomData.role}`);
      
    } catch (error) {
      addLog(`💥 Join room failed: ${error.message}`);
      setStatus('disconnected');
    }
  };

  const handleGetRemoteStreams = async () => {
    if (!manager) {
      addLog("❌ Manager not initialized");
      return;
    }

    try {
      addLog("📺 Getting remote streams...");
      const streams = await manager.getRemoteStreams();
      
      if (streams && streams.length > 0) {
        setRemoteStreams(streams);
        addLog(`✅ Found ${streams.length} remote stream(s)!`);
        
        // Log each stream - streams are already MediaStreams
        streams.forEach((stream, index) => {
          addLog(`🎥 Stream ${index + 1}: ${stream.getTracks().length} tracks`);
        });
      } else {
        addLog("⚠️ No remote streams found");
      }
      
    } catch (error) {
      addLog(`💥 Failed to get remote streams: ${error.message}`);
    }
  };

  const handleLeaveRoom = async () => {
    if (!manager) return;

    try {
      addLog("👋 Leaving room...");
      await manager.leaveRoom();
      setStatus('disconnected');
      setRoomInfo({});
      setRoomIdInput('');
      setRemoteStreams([]);
      addLog("✅ Left room successfully");
    } catch (error) {
      addLog(`💥 Leave room failed: ${error.message}`);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Invycam Test Interface</h1>
        
        <div style={{ margin: '20px 0' }}>
          <h3>Status: {status}</h3>
          {roomInfo.roomId && (
            <div>
              <p><strong>Room ID:</strong> {roomInfo.roomId}</p>
              <p><strong>User ID:</strong> {roomInfo.userId}</p>
              <p><strong>Role:</strong> {roomInfo.role}</p>
              <p><strong>Remote Streams:</strong> {remoteStreams.length}</p>
            </div>
          )}
        </div>

        <div style={{ margin: '20px 0' }}>
          <button 
            onClick={handleCreateRoom} 
            disabled={!manager || status !== 'disconnected'}
            style={{ margin: '0 10px', padding: '10px 20px' }}
          >
            🏠 Create Room
          </button>
          
          <div style={{ margin: '20px 0' }}>
            <input
              type="text"
              placeholder="Enter Room ID to join..."
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value)}
              disabled={status !== 'disconnected'}
              style={{
                padding: '10px',
                marginRight: '10px',
                width: '200px',
                fontSize: '16px',
                border: '2px solid #ccc',
                borderRadius: '4px'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && manager && status === 'disconnected' && roomIdInput.trim()) {
                  handleJoinRoom();
                }
              }}
            />
            <button 
              onClick={handleJoinRoom} 
              disabled={!manager || status !== 'disconnected' || !roomIdInput.trim()}
              style={{ margin: '0 10px', padding: '10px 20px' }}
            >
              🚪 Join Room
            </button>
          </div>
          
          <button 
            onClick={handleGetRemoteStreams} 
            disabled={!manager || status !== 'connected'}
            style={{ margin: '0 10px', padding: '10px 20px' }}
          >
            📺 Get Remote Streams
          </button>

          <button 
            onClick={handleLeaveRoom} 
            disabled={!manager || status === 'disconnected'}
            style={{ margin: '0 10px', padding: '10px 20px' }}
          >
            👋 Leave Room
          </button>
        </div>

        {/* Show local stream for reference */}
        {manager && manager.localStream && (
          <div style={{ margin: '20px 0' }}>
            <h4>📹 Your Local Stream</h4>
            <div style={{ border: '2px solid #0099ff', borderRadius: '8px', overflow: 'hidden', display: 'inline-block' }}>
              <video
                ref={(videoElement) => {
                  if (videoElement && manager.localStream) {
                    videoElement.srcObject = manager.localStream;
                  }
                }}
                autoPlay
                playsInline
                muted
                style={{
                  width: '320px',
                  height: '240px',
                  backgroundColor: '#000'
                }}
              />
              <div style={{ padding: '5px', fontSize: '12px', textAlign: 'center', color: '#0099ff' }}>
                Your Screen
              </div>
            </div>
          </div>
        )}

        {/* Display actual video streams */}
        {remoteStreams.length > 0 && (
          <div style={{ margin: '20px 0' }}>
            <h4>🎬 Live Remote Streams</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
              {remoteStreams.map((stream, index) => (
                <div key={index} style={{ border: '2px solid #00ff00', borderRadius: '8px', overflow: 'hidden' }}>
                  <video
                    ref={(videoElement) => {
                      if (videoElement && stream) {
                        videoElement.srcObject = stream;
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '320px',
                      height: '240px',
                      backgroundColor: '#000'
                    }}
                  />
                  <div style={{ padding: '5px', fontSize: '12px', textAlign: 'center', color: '#00ff00' }}>
                    Remote Stream {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Show remote streams info */}
        {remoteStreams.length > 0 && (
          <div style={{ margin: '20px 0', padding: '10px', backgroundColor: '#333', borderRadius: '5px' }}>
            <h4>🎥 Stream Technical Info ({remoteStreams.length})</h4>
            {remoteStreams.map((stream, index) => (
              <div key={index} style={{ margin: '5px 0' }}>
                <strong>Stream {index + 1}:</strong> {stream.getTracks().length} tracks 
                ({stream.getVideoTracks().length} video, {stream.getAudioTracks().length} audio)
              </div>
            ))}
          </div>
        )}

        <div style={{ 
          backgroundColor: '#222', 
          color: '#00ff00', 
          padding: '20px', 
          marginTop: '20px',
          textAlign: 'left',
          height: '300px',
          overflowY: 'scroll',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          <h4>Debug Logs:</h4>
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>

        <div style={{ marginTop: '20px', fontSize: '14px' }}>
          <p><strong>Testing Instructions:</strong></p>
          <ol style={{ textAlign: 'left', maxWidth: '600px' }}>
            <li>Click "Create Room" in first window/tab</li>
            <li>Copy the Room ID from the display or logs</li>
            <li>Open second window/tab</li>
            <li>Paste Room ID into the input box</li>
            <li>Click "Join Room" or press Enter</li>
            <li>Click "Get Remote Streams" to check for video</li>
            <li>🎉 You should see live video streams appear!</li>
            <li>Check DevTools console and server logs for signaling</li>
          </ol>
        </div>
      </header>
    </div>
  );
}

export default App;