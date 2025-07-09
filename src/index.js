import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Still works, React will find App.jsx

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);