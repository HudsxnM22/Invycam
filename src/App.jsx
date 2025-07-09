import React from 'react';
import './App.css';
import Peer from './NetworkController/Peer';

function App() {
    // test peer connection class
    const peer = new Peer(123);
    peer.createIceCandidate(); // just prints the ICE candidates
    console.log(peer.getPeerConnection());

  return (
    <div className="App">
      <header className="App-header">
        <h1>My Electron React App</h1>
        <p>Hello from React inside Electron!</p>
        <button onClick={() => alert('Button clicked!')}>
          Click me!
        </button>
      </header>
    </div>
  );
}

export default App;