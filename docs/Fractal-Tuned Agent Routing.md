import React, { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc, onSnapshot } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Slider from 'react-slider'; // npm i react-slider
import { computeDVar } from '../fractalUtils'; // From our toolkit

const firebaseConfig = { /* Your config */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const NexusChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [coherence, setCoherence] = useState(50); // Claude bias
  const [creativity, setCreativity] = useState(50); // Grok bias
  const [tokenBudget, setTokenBudget] = useState(500);
  const [noveltyBoost, setNoveltyBoost] = useState(false); // New: Neuroevolution toggle
  const [theme, setTheme] = useState('arcane'); // Example themes: 'arcane' or 'neon'
  const [latency, setLatency] = useState(0);
  const [tokenUse, setTokenUse] = useState(0);
  const [agentBreakdown, setAgentBreakdown] = useState({ claude: 0, grok: 0 });

  useEffect(() => {
    const userId = /* Get from auth */;
    onSnapshot(collection(db, `users/${userId}/chatHistory`), (snapshot) => {
      setMessages(snapshot.docs.map(doc => doc.data()));
    });
  }, []);

  const handleSend = async () => {
    if (!input) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);

    // Fractal modulation: Compute D_var on input embedding (mock)
    const embedding = [/* Pinecone or simple hash */];
    const d_var = computeDVar(embedding);
    const adjustedCoherence = coherence * (1 + d_var / 10); // Boost logic on chaos

    const start = Date.now();
    const response = await genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-09-2025' }).generateContent(input);
    const aiMsg = { role: 'ai', content: response.response.text() };
    setMessages(prev => [...prev, aiMsg]);

    // Simulate novelty boost (neuroevolution stub)
    if (noveltyBoost) {
      aiMsg.content += ' [Evolved Variant: ' + /* Breed mini-agent response */ + ']';
    }

    // Persistence
    await addDoc(collection(db, `users/${userId}/chatHistory`), aiMsg);

    // Dashboard updates
    setLatency(Date.now() - start);
    setTokenUse(response.response.usageMetadata.promptTokenCount + response.response.usageMetadata.candidatesTokenCount);
    setAgentBreakdown(prev => ({
      claude: prev.claude + (adjustedCoherence / 100),
      grok: prev.grok + (creativity / 100)
    }));
    setInput('');
  };

  return (
    <div className={`nexus-chat ${theme}`}>
      <div className="grimoire-panel">
        <h2>Agent Council Tuning</h2>
        <Slider value={coherence} onChange={setCoherence} /> Logical Coherence (Claude Bias)
        <Slider value={creativity} onChange={setCreativity} /> Creative Framing (Grok Bias)
        <Slider value={tokenBudget} onChange={setTokenBudget} min={100} max={2000} /> Token Budget
        <label><input type="checkbox" checked={noveltyBoost} onChange={e => setNoveltyBoost(e.target.checked)} /> Novelty Boost (Neuroevolution)</label>
      </div>
      <div className="chat-history">
        {messages.map((msg, i) => <div key={i} className={msg.role}>{msg.content}</div>)}
      </div>
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={handleSend}>Send</button>
      <div className="performance-dashboard">
        Latency: {latency}ms | Token Use: {tokenUse}
        <div>Agent Breakdown: Claude {agentBreakdown.claude.toFixed(1)} | Grok {agentBreakdown.grok.toFixed(1)}</div>
      </div>
      <select value={theme} onChange={e => setTheme(e.target.value)}>
        <option value="arcane">Arcane Blueprint</option>
        <option value="neon">Blade Runner Neon</option>
      </select>
    </div>
  );
};

export default NexusChat;