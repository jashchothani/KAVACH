import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  Button,
  Chip,
  Avatar,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Send,
  Psychology,
  Shield,
  AutoAwesome,
  HelpOutline,
  CheckCircle,
  Warning,
  Bolt,
  ContentCopy,
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/v1';

interface Message {
  sender: 'user' | 'raksha';
  text: string;
  isAiGenerated?: boolean;
  timestamp: string;
}

const SUGGESTIONS = [
  'Explain my security score',
  'Investigate recent high-risk alerts',
  'What should I fix first on my endpoints?',
  'Explain how Isolation Forest detects zero-day attacks',
  'Summarize today\'s security posture',
];

export const RakshaAi: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'raksha',
      text: `### 🛡️ Welcome to Raksha AI\nI am your intelligent cybersecurity assistant inside **KAVACH**.\n\nI can help you understand security detections, explain ML anomalies, analyze suspicious URLs, and prioritize defensive actions.\n\nHow can I help protect your system today?`,
      isAiGenerated: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [providerInfo, setProviderInfo] = useState<{ name: string; is_offline_fallback: boolean }>({
    name: 'Loading...',
    is_offline_fallback: false,
  });
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const resp = await axios.get(`${API_BASE}/raksha/status`);
        setProviderInfo(resp.data);
      } catch (e) {
        setProviderInfo({ name: 'Offline Mode', is_offline_fallback: true });
      }
    };
    fetchStatus();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!messageText) setInput('');
    setLoading(true);

    try {
      const resp = await axios.post(`${API_BASE}/raksha/chat`, {
        message: textToSend,
      });

      const rakshaMsg: Message = {
        sender: 'raksha',
        text: resp.data.response,
        isAiGenerated: resp.data.is_ai_generated,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, rakshaMsg]);
    } catch (err) {
      const errorMsg: Message = {
        sender: 'raksha',
        text: '### ⚠️ Communication Error\nUnable to contact KAVACH AI engine. Verify that the backend is running on `http://localhost:8000`.',
        isAiGenerated: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', gap: 2 }}>
      {/* Header Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: '#38bdf820', border: '1px solid #38bdf8', color: '#38bdf8' }}>
            <Psychology />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
              Raksha AI
              <Chip
                label={providerInfo.name}
                size="small"
                sx={{
                  bgcolor: providerInfo.is_offline_fallback ? '#ca8a0420' : '#22c55e20',
                  color: providerInfo.is_offline_fallback ? '#fde047' : '#4ade80',
                  fontWeight: 700,
                  fontSize: 10,
                }}
              />
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Specialized Cybersecurity Intelligence Assistant for KAVACH
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Suggestion Chips */}
      <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', py: 0.5 }}>
        {SUGGESTIONS.map((sug, i) => (
          <Chip
            key={i}
            label={sug}
            clickable
            onClick={() => handleSend(sug)}
            icon={<Bolt sx={{ fontSize: 16 }} />}
            sx={{
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': { bgcolor: 'action.hover' },
              fontSize: 12,
            }}
          />
        ))}
      </Box>

      {/* Chat Messages Log */}
      <Paper
        sx={{
          flexGrow: 1,
          p: 3,
          bgcolor: '#0a0e17',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
        }}
      >
        {messages.map((m, idx) => (
          <Box
            key={idx}
            sx={{
              display: 'flex',
              justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start',
              gap: 1.5,
            }}
          >
            {m.sender === 'raksha' && (
              <Avatar sx={{ bgcolor: '#0284c7', width: 32, height: 32, fontSize: 16 }}>
                🛡️
              </Avatar>
            )}
            <Box
              sx={{
                maxWidth: '75%',
                bgcolor: m.sender === 'user' ? '#1e40af' : '#111827',
                color: '#f8fafc',
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: m.sender === 'user' ? '#2563eb' : '#1e293b',
                whiteSpace: 'pre-wrap',
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              {m.text}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 10 }}>
                  {m.timestamp}
                </Typography>
              </Box>
            </Box>
          </Box>
        ))}
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#38bdf8' }}>
            <CircularProgress size={20} color="inherit" />
            <Typography variant="caption">Raksha AI is analyzing security telemetry...</Typography>
          </Box>
        )}
        <div ref={chatEndRef} />
      </Paper>

      {/* Input Area */}
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <TextField
          fullWidth
          placeholder="Ask Raksha AI about an alert, URL, anomaly, or cybersecurity defense..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          variant="outlined"
          size="medium"
          sx={{ bgcolor: 'background.paper', borderRadius: 1.5 }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          sx={{ px: 3, borderRadius: 1.5 }}
        >
          <Send />
        </Button>
      </Box>
    </Box>
  );
};
