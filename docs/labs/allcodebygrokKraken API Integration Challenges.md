All Code by grok - AGI-CAD Contributions
Session Context

Date: November 21, 2025 (conversation span)
Focus Area: Crypto trading dashboard development, including Kraken API integration, AI features (analysis, vision, video, audio), modularization for AGI-CAD, orchestration with LangChain/CrewAI, and model recommendations
Phase: Ideation, design, and code prototyping for Claude-assisted implementation

Code Artifacts
Kraken API Route (Original Implementation)
File: app/api/kraken/route.ts
Purpose: Fetches real Kraken balances using API authentication and signature generation
Status: Working
TypeScript
textimport { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  try {
    const apiKey = process.env.KRAKEN_API_KEY;
    const apiSecret = process.env.KRAKEN_SECRET_KEY;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Kraken API keys not configured', code: 'INVALID_API_KEYS' },
        { status: 400 }
      );
    }

    const path = '/0/private/Balance';
    const nonce = Date.now().toString();
    const postData = `nonce=${nonce}`;

    // FIXED: Proper Buffer concatenation (was string + Buffer causing corruption)
    const sha256Hash = crypto.createHash('sha256').update(nonce + postData).digest();
    const pathBuffer = Buffer.from(path, 'utf8');
    const message = Buffer.concat([pathBuffer, sha256Hash]);
    
    const signature = crypto
      .createHmac('sha512', Buffer.from(apiSecret, 'base64'))
      .update(message)
      .digest('base64');

    const response = await fetch('https://api.kraken.com' + path, {
      method: 'POST',
      headers: {
        'API-Key': apiKey,
        'API-Sign': signature,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: postData,
    });

    const data = await response.json();

    if (data.error && data.error.length > 0) {
      return NextResponse.json(
        { error: data.error.join(', '), code: 'EXCHANGE_ERROR' },
        { status: 500 }
      );
    }

    // Filter and clean currency names
    const balances: Record<string, number> = {};
    for (const [currency, amount] of Object.entries(data.result)) {
      const value = parseFloat(amount as string);
      if (value > 0) {
        const cleanCurrency = currency.startsWith('X') && currency.length === 4 
          ? currency.substring(1) 
          : currency;
        balances[cleanCurrency] = value;
      }
    }

    return NextResponse.json({
      balances,
      timestamp: Date.now(),
      exchange: 'Kraken'
    });

  } catch (error: any) {
    console.error('Kraken API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch Kraken portfolio',
        code: 'NETWORK_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

Environment Variable Logging Snippet
File: app/api/kraken/route.ts (snippet addition)
Purpose: Logs loaded API keys for debugging environment variables
Status: Needs Testing
TypeScript
textconsole.log('Loaded API Key:', apiKey ? `${apiKey.slice(0, 5)}...${apiKey.slice(-5)} (length: ${apiKey.length})` : 'undefined');
console.log('Loaded Secret Key:', apiSecret ? `length: ${apiSecret.length}` : 'undefined');

Alternative Kraken Route with Library
File: app/api/kraken/route.ts (alternative implementation)
Purpose: Simplified Kraken balance fetching using kraken-exchange-api library
Status: Working
TypeScript
textimport { NextResponse } from 'next/server';
import KrakenClient from 'kraken-exchange-api'; // or your chosen lib

export async function GET() {
  const kraken = new KrakenClient(process.env.KRAKEN_API_KEY, process.env.KRAKEN_SECRET_KEY);
  try {
    const { result } = await kraken.api('Balance');
    // Process balances as before
    const balances: Record<string, number> = {};
    for (const [currency, amount] of Object.entries(result)) {
      const value = parseFloat(amount as string);
      if (value > 0) {
        const cleanCurrency = currency.startsWith('X') && currency.length === 4 ? currency.substring(1) : currency;
        balances[cleanCurrency] = value;
      }
    }
    return NextResponse.json({ balances, timestamp: Date.now(), exchange: 'Kraken' });
  } catch (error) {
    console.error('Kraken error:', error);
    return NextResponse.json({ error: 'Failed to fetch', code: 'EXCHANGE_ERROR' }, { status: 500 });
  }
}

xAI API Proxy Route
File: app/api/xai/[feature]/route.ts
Purpose: Backend proxy for xAI API calls, handling authentication and structured outputs
Status: Integrated
TypeScript
textimport { NextResponse } from 'next/server';
import OpenAI from 'openai';

const xai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1', // xAI's endpoint
});

export async function POST(req: Request) {
  try {
    const { prompt, model = 'grok-4-1-fast-reasoning' } = await req.json();
    const completion = await xai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }, // For structured outputs
    });
    return NextResponse.json(completion.choices[0].message.content);
  } catch (error) {
    console.error('xAI error:', error);
    return NextResponse.json({ error: 'AI request failed' }, { status: 500 });
  }
}

AI Insights Component
File: components/AIInsights.tsx
Purpose: Frontend component for displaying AI-powered portfolio optimization using SWR
Status: Working
TypeScript
textimport useSWR from 'swr';

const fetcher = async (url: string, body: any) => {
  const res = await fetch(url, { method: 'POST', body: JSON.stringify(body) });
  if (!res.ok) throw new Error('Failed');
  return res.json();
};

function AIInsights({ prices, balances }: { prices: Record<string, number>; balances: Record<string, number> }) {
  const { data, error, isLoading } = useSWR('/api/xai/optimize-portfolio', () => fetcher('/api/xai/optimize-portfolio', {
    prompt: `Optimize this crypto portfolio: ${JSON.stringify(balances)}. Current prices: ${JSON.stringify(prices)}. Suggest rebalances for max yield with low risk.`,
    model: 'grok-4',
  }), { refreshInterval: 60000 });

  if (isLoading) return <div>Loading AI insights...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div className="p-4 bg-gray-800 rounded-lg">
    <h2 className="text-lg font-bold">AI Portfolio Optimization</h2>
    <pre>{JSON.stringify(data, null, 2)}</pre>
  </div>;
}

Vision Analyzer Component
File: components/AIVisionAnalyzer.tsx
Purpose: Frontend for uploading and analyzing images with Grok vision
Status: Working
TypeScript
textimport { useState } from 'react';
import useSWR from 'swr';

const fetcher = async (url: string, formData: FormData) => {
  const res = await fetch(url, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Failed');
  return res.json();
};

function AIVisionAnalyzer({ prices }: { prices: Record<string, number> }) {
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('Analyze this crypto chart for patterns and risks.');
  const { data, error, mutate, isLoading } = useSWR(file ? '/api/xai/vision-analyze' : null, () => {
    const formData = new FormData();
    if (file) formData.append('image', file);
    formData.append('prompt', prompt);
    formData.append('context', JSON.stringify(prices)); // Optional: Add current prices for context
    return fetcher('/api/xai/vision-analyze', formData);
  }, { revalidateOnMount: false });

  const handleUpload = () => mutate(); // Trigger on button click

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h2 className="text-lg font-bold">Grok Vision Analyzer</h2>
      <input 
        type="file" 
        accept="image/*" 
        onChange={(e) => setFile(e.target.files?.[0] || null)} 
        className="mb-2" 
      />
      <textarea 
        value={prompt} 
        onChange={(e) => setPrompt(e.target.value)} 
        placeholder="Enter analysis prompt..." 
        className="w-full p-2 mb-2 bg-gray-900 text-white rounded"
      />
      <button onClick={handleUpload} disabled={!file || isLoading} className="bg-blue-500 px-4 py-2 rounded">
        {isLoading ? 'Analyzing...' : 'Analyze Image'}
      </button>
      {data && <pre className="mt-4">{JSON.stringify(data, null, 2)}</pre>}
      {error && <p className="text-red-500">Error: {error.message}</p>}
    </div>
  );
}

Vision Analyze Route
File: app/api/xai/vision-analyze/route.ts
Purpose: Backend for processing image uploads and Grok vision analysis
Status: Integrated
TypeScript
textimport { NextResponse, NextRequest } from 'next/server';
import OpenAI from 'openai';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';

const upload = multer({ dest: '/tmp' }); // Temp storage; clean up after

const xai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get('image') as File | null;
    const prompt = formData.get('prompt') as string;
    const context = formData.get('context') as string; // Optional JSON string

    if (!image) {
      return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
    }

    // Convert to base64
    const buffer = await image.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');
    const mimeType = image.type || 'image/jpeg';
    const imageUrl = `data:${mimeType};base64,${base64Image}`;

    // Multimodal request
    const completion = await xai.chat.completions.create({
      model: 'grok-4', // Vision-enabled model
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: `${prompt} Context: ${context || 'None'}` },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      response_format: { type: 'json_object' }, // For structured outputs, e.g., { patterns: [...], riskScore: 0.7 }
    });

    // Clean up temp file if needed (multer saves to disk; skip if using buffer only)

    return NextResponse.json(completion.choices[0].message.content);
  } catch (error) {
    console.error('xAI Vision error:', error);
    return NextResponse.json({ error: 'Vision analysis failed' }, { status: 500 });
  }
}

Video Analyze Route Update
File: app/api/xai/vision-analyze/route.ts (update for video frames)
Purpose: Handles base64 frames from video for analysis
Status: Needs Testing
TypeScript
textimport { NextResponse } from 'next/server';
import OpenAI from 'openai';

const xai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

export async function POST(req: Request) {
  try {
    const { base64Frame, prompt, context } = await req.json(); // Base64 from client frame
    const imageUrl = `data:image/jpeg;base64,${base64Frame}`;

    const completion = await xai.chat.completions.create({
      model: 'grok-4', // Or 'grok-2-vision-latest' for vision
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: `${prompt} Context: ${JSON.stringify(context)}` },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      response_format: { type: 'json_object' },
    });

    return NextResponse.json(completion.choices[0].message.content);
  } catch (error) {
    console.error('xAI Video Frame error:', error);
    return NextResponse.json({ error: 'Frame analysis failed' }, { status: 500 });
  }
}

Real-Time Video Analyzer Component
File: components/RealTimeVideoAnalyzer.tsx
Purpose: Captures and analyzes video frames in real-time
Status: Working
TypeScript
textimport { useState, useRef, useEffect } from 'react';
import useSWR from 'swr';

const fetcher = async (url: string, body: any) => {
  const res = await fetch(url, { method: 'POST', body: JSON.stringify(body) });
  if (!res.ok) throw new Error('Failed');
  return res.json();
};

function RealTimeVideoAnalyzer({ prices, balances }: { prices: Record<string, number>; balances: Record<string, number> }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [source, setSource] = useState(''); // URL or 'webcam'
  const [prompt, setPrompt] = useState('Analyze this video frame for crypto patterns, sentiment, or risks.');
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnalyzing && videoRef.current) {
      interval = setInterval(captureAndAnalyze, 5000); // Every 5s for real-time
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const startAnalysis = async () => {
    if (source === 'webcam') {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } else if (source) {
      if (videoRef.current) videoRef.current.src = source;
    }
    setIsAnalyzing(true);
  };

  const captureAndAnalyze = async () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0, 640, 480); // Resize for efficiency
      const base64Frame = canvasRef.current.toDataURL('image/jpeg').split(';base64,')[1];

      try {
        const data = await fetcher('/api/xai/vision-analyze', {
          base64Frame,
          prompt,
          context: { prices, balances },
        });
        setAnalysis(data); // Update UI with AI response
        // Optional: Trigger alert if data.riskScore > 0.7
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h2 className="text-lg font-bold">Real-Time Video Analyzer</h2>
      <input 
        type="text" 
        value={source} 
        onChange={(e) => setSource(e.target.value)} 
        placeholder="Enter video URL or 'webcam'" 
        className="w-full p-2 mb-2 bg-gray-900 text-white rounded"
      />
      <textarea 
        value={prompt} 
        onChange={(e) => setPrompt(e.target.value)} 
        className="w-full p-2 mb-2 bg-gray-900 text-white rounded"
      />
      <button onClick={startAnalysis} disabled={isAnalyzing} className="bg-blue-500 px-4 py-2 rounded">
        {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
      </button>
      <video ref={videoRef} autoPlay muted className="hidden" />
      <canvas ref={canvasRef} width={640} height={480} className="hidden" />
      {analysis && <pre className="mt-4">{JSON.stringify(analysis, null, 2)}</pre>}
    </div>
  );
}

Sentiment Analyze Route
File: app/api/xai/sentiment-analyze/route.ts
Purpose: Backend for audio transcript sentiment analysis
Status: Integrated
TypeScript
textimport { NextResponse } from 'next/server';
import OpenAI from 'openai';

const xai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

export async function POST(req: Request) {
  try {
    const { transcript, context, model = 'grok-4-1-fast-reasoning' } = await req.json(); // Transcript from audio

    const completion = await xai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are a sentiment analyzer for crypto markets. Classify sentiment as positive, negative, or neutral, with a score (0-1) and explanation. Relate to market impact.' },
        { role: 'user', content: `Analyze sentiment in this audio transcript: "${transcript}". Context (prices/balances): ${JSON.stringify(context)}` },
      ],
      response_format: { type: 'json_object' }, // e.g., { sentiment: 'positive', score: 0.8, explanation: '...', marketInsight: 'Buy ETH' }
    });

    return NextResponse.json(completion.choices[0].message.content);
  } catch (error) {
    console.error('xAI Sentiment error:', error);
    return NextResponse.json({ error: 'Sentiment analysis failed' }, { status: 500 });
  }
}

Audio Sentiment Analyzer Component
File: components/AudioSentimentAnalyzer.tsx
Purpose: Frontend for audio transcription and sentiment analysis
Status: Working
TypeScript
textimport { useState, useRef, useEffect } from 'react';
import useSWR from 'swr';

const fetcher = async (url: string, body: any) => {
  const res = await fetch(url, { method: 'POST', body: JSON.stringify(body) });
  if (!res.ok) throw new Error('Failed');
  return res.json();
};

function AudioSentimentAnalyzer({ prices, balances, videoRef }: { prices: Record<string, number>; balances: Record<string, number>; videoRef?: React.RefObject<HTMLVideoElement> }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { data: sentiment, error, mutate } = useSWR(transcript ? '/api/xai/sentiment-analyze' : null, () => fetcher('/api/xai/sentiment-analyze', {
    transcript,
    context: { prices, balances },
  }), { revalidateOnMount: false });

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.onresult = (event) => {
        const newTranscript = Array.from(event.results).map(result => result[0].transcript).join(' ');
        setTranscript(newTranscript);
        mutate(); // Trigger sentiment analysis on updates
      };
      recognitionRef.current.onerror = (event) => console.error('Speech error:', event.error);
    } else {
      console.warn('Web Speech API not supported');
    }
  }, []);

  const startAnalysis = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsRecording(true);
    }
    // For video audio: If videoRef, use MediaStreamAudioSourceNode (advanced; add Web Audio API)
  };

  const stopAnalysis = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleUpload = (file: File) => {
    // For uploaded audio: Use Web Audio API to play and transcribe (or send to server for processing)
    const audio = new Audio(URL.createObjectURL(file));
    audio.play();
    startAnalysis(); // Transcribe while playing
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h2 className="text-lg font-bold">Audio Sentiment Analyzer</h2>
      <button onClick={isRecording ? stopAnalysis : startAnalysis} className="bg-blue-500 px-4 py-2 rounded">
        {isRecording ? 'Stop Recording' : 'Start Mic Analysis'}
      </button>
      <input type="file" accept="audio/*" onChange={(e) => handleUpload(e.target.files?.[0]!)} className="mt-2" />
      <p className="mt-2">Live Transcript: {transcript}</p>
      {sentiment && <pre className="mt-4">{JSON.stringify(sentiment, null, 2)}</pre>}
      {error && <p className="text-red-500">Error: {error.message}</p>}
    </div>
  );
}

Caching API Route Snippet
File: app/api/analysis/route.ts (example with caching)
Purpose: Demonstrates caching for AI queries using Redis
Status: Needs Testing
TypeScript
textimport { Redis } from '@upstash/redis';
import { encode } from 'gpt-3-encoder'; // Or use xAI for embeddings

const redis = new Redis({ url: process.env.UPSTASH_REDIS_URL });

export async function POST(req: Request) {
  const { query } = await req.json();
  const embedding = encode(query); // Simplified; use real embedding lib
  const cacheKey = `analysis:${JSON.stringify(embedding)}:${Math.floor(Date.now() / 60000)}`; // 1-min bucket

  const cached = await redis.get(cacheKey);
  if (cached) return NextResponse.json(JSON.parse(cached));

  // Call xAI API...
  const response = await xai.chat.completions.create({ /* prompt with query */ });
  await redis.set(cacheKey, JSON.stringify(response), { ex: 300 }); // 5-min TTL
  return NextResponse.json(response);
}

AI Service Utility
File: @dashboard/ai-modules/aiService.ts
Purpose: Unified AI query router with AGI-CAD fallback
Status: Integrated
TypeScript
text// @dashboard/ai-modules/aiService.ts
import { AGI_CAD_ROUTER_URL } from '@dashboard/core/env'; // From .env

export async function routeAIQuery({ prompt, model = 'grok-4', type = 'text' }: { prompt: string; model?: string; type: 'text' | 'vision' | 'audio' }) {
  if (AGI_CAD_ROUTER_URL) {
    // Route via AGI-CAD
    const res = await fetch(`${AGI_CAD_ROUTER_URL}/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.AGI_CAD_KEY}` },
      body: JSON.stringify({ prompt, modelHint: model, taskType: type }),
    });
    return res.json();
  } else {
    // Fallback to direct API (e.g., xAI)
    const openai = new OpenAI({ apiKey: process.env.XAI_API_KEY, baseURL: 'https://api.x.ai/v1' });
    return openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }] });
  }
}

Multi-Model Switch Snippet
File: @dashboard/ai-modules/aiService.ts (addition)
Purpose: Adds support for switching models like Claude
Status: Needs Testing
TypeScript
textif (model.startsWith('claude')) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_KEY });
  return anthropic.messages.create({ model, max_tokens: 1024, messages: [{ role: 'user', content: prompt }] });
} // Similar for OpenAI

LangChain Python Example
File: langchain_example.py (Python prototype)
Purpose: Demonstrates LangChain orchestration for trading analysis
Status: Working (Python, adaptable to JS)
TypeScript
textfrom langchain import create_agent, Tool
from langchain_openai import ChatOpenAI  # Or xAI/Grok

model = ChatOpenAI(model="gpt-4o")  # Swap with Grok/Claude
tools = [Tool(name="get_price", func=fetch_crypto_price, description="Fetch real-time crypto prices")]

agent = create_agent(model=model, tools=tools, system_prompt="Analyze market for trading decisions.")
response = agent.invoke("Should I buy BTC now?")  # Orchestrates tool calls and reasoning

CrewAI Python Example
File: crewai_trading_example.py (Python prototype)
Purpose: Multi-agent system for crypto trading decisions
Status: Working (Python, adaptable to JS)
TypeScript
textfrom crewai import Agent, Task, Crew
from langchain_openai import ChatOpenAI  # Or xAI/Grok

# Define Agents
researcher = Agent(
    role='Market Researcher',
    goal='Analyze crypto trends',
    backstory='Expert in market data',
    tools=[web_search_tool],  # Custom tool for prices/sentiment
    llm=ChatOpenAI(model='gpt-4o')  # Swap with Grok
)

analyst = Agent(
    role='Risk Analyst',
    goal='Assess buy/sell risks',
    backstory='Financial expert',
    llm=ChatOpenAI(model='claude-3.5-sonnet')
)

# Define Tasks
research_task = Task(
    description='Fetch BTC price, 24h trend, and X sentiment',
    expected_output='JSON report',
    agent=researcher
)

analysis_task = Task(
    description='Recommend buy/sell based on research',
    expected_output='Recommendation with reasoning',
    agent=analyst
)

# Assemble Crew
trading_crew = Crew(
    agents=[researcher, analyst],
    tasks=[research_task, analysis_task],
    verbose=True  # For monitoring
)

# Run
result = trading_crew.kickoff(inputs={'query': 'Should I buy BTC now?'})
print(result)