import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, TextField, IconButton, Paper, useTheme, Button } from '@mui/material';
import { Send, SmartToy, AutoAwesome } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../../api/client';

const BLUE = '#3B82F6';

interface Message {
  id: string;
  sender: 'user' | 'raksha';
  text: string;
}

const SUGGESTIONS = [
  'Explain my current security score',
  'What are the most critical active threats?',
  'Summarize today\'s incident log',
];

// ─── Typewriter text effect ───────────────────────────────────────────────────
const TypewriterText: React.FC<{ text: string }> = ({ text }) => {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(timer);
        setDone(true);
      }
    }, 14);
    return () => clearInterval(timer);
  }, [text]);

  return (
    <Box component="span" sx={{ whiteSpace: 'pre-wrap' }}>
      {displayed}
      {!done && (
        <Box
          component="span"
          sx={{
            display: 'inline-block',
            width: 2,
            height: '1em',
            bgcolor: BLUE,
            ml: 0.3,
            verticalAlign: 'text-bottom',
            animation: 'status-blink 0.9s ease-in-out infinite',
          }}
        />
      )}
    </Box>
  );
};

export const RakshaAiWidget: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'raksha', text: 'Greetings. I am Raksha AI. I am actively monitoring your telemetry. How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Math.random().toString(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await apiClient.post('/ai/chat', { message: text });
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        sender: 'raksha',
        text: res.data.response || 'I am sorry, I am having trouble processing that right now.'
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        sender: 'raksha',
        text: 'Error connecting to Raksha AI Core. Please ensure the backend is reachable.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        minHeight: 350,
        maxHeight: 500,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3.5,
        border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(11,11,15,0.07)',
        bgcolor: isDark ? 'rgba(18,18,26,0.95)' : '#FFFFFF',
        boxShadow: `0 8px 32px ${isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)'}`,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(11,11,15,0.05)', display: 'flex', alignItems: 'center', gap: 1.5, background: isDark ? 'linear-gradient(to right, rgba(29, 78, 216, 0.1), transparent)' : 'linear-gradient(to right, rgba(29, 78, 216, 0.05), transparent)' }}>
        <Box sx={{ width: 32, height: 32, borderRadius: 2, background: 'linear-gradient(135deg, #1D4ED8 0%, #7C3AED 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SmartToy sx={{ color: '#FFF', fontSize: 18 }} />
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Raksha AI Copilot</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22C55E' }} /> Online
          </Typography>
        </Box>
      </Box>

      {/* Chat Area */}
      <Box ref={scrollRef} sx={{ flex: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Box sx={{ display: 'flex', gap: 1, flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row' }}>
                <Box
                  sx={{
                    px: 2, py: 1.2,
                    borderRadius: 2,
                    maxWidth: '85%',
                    bgcolor: msg.sender === 'user' ? BLUE : isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6',
                    color: msg.sender === 'user' ? '#FFF' : 'text.primary',
                    fontSize: '0.85rem',
                    boxShadow: msg.sender === 'user' ? '0 4px 12px rgba(59,130,246,0.3)' : 'none',
                  }}
                >
                  {msg.sender === 'raksha' && idx === messages.length - 1 ? (
                    <TypewriterText text={msg.text} />
                  ) : (
                    <Box component="span" sx={{ whiteSpace: 'pre-wrap' }}>{msg.text}</Box>
                  )}
                </Box>
              </Box>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {loading && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Box sx={{ px: 2, py: 1.5, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6', display: 'flex', gap: 0.5, alignItems: 'center' }}>
              <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6 }}><Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#888' }} /></motion.div>
              <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}><Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#888' }} /></motion.div>
              <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}><Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#888' }} /></motion.div>
            </Box>
          </Box>
        )}

        {messages.length === 1 && !loading && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {SUGGESTIONS.map((s, i) => (
              <Button
                key={i}
                variant="outlined"
                size="small"
                onClick={() => handleSend(s)}
                startIcon={<AutoAwesome sx={{ fontSize: 14 }} />}
                sx={{ borderRadius: 4, textTransform: 'none', fontSize: '0.75rem', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
              >
                {s}
              </Button>
            ))}
          </Box>
        )}
      </Box>

      {/* Input */}
      <Box sx={{ p: 1.5, borderTop: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(11,11,15,0.05)' }}>
        <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSend(input); }} sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Ask Raksha AI..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <IconButton type="submit" disabled={!input.trim() || loading} sx={{ bgcolor: BLUE, color: '#FFF', borderRadius: 2, '&:hover': { bgcolor: '#2563EB' }, '&.Mui-disabled': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' } }}>
            <Send sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};
