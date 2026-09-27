import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, TextField, IconButton, Button, Chip, Avatar,
  CircularProgress, Paper, Stack, useTheme, Tooltip,
} from '@mui/material';
import {
  Send, Psychology, Bolt, ContentCopy, CheckCircle,
  SmartToy, Person, Stop, AutoAwesome,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../api/client';

const CR = '#DC2626';
const BLUE = '#3B82F6';

interface Message {
  id: string;
  sender: 'user' | 'raksha';
  text: string;
  isAiGenerated?: boolean;
  timestamp: string;
}

const SUGGESTIONS = [
  'Explain my current security score',
  'What are the most critical active threats?',
  'How does Isolation Forest detect zero-days?',
  'Summarize today\'s incident log',
  'Which endpoint has the highest risk right now?',
  'How should I respond to a brute-force alert?',
];

// ─── Typewriter text effect ───────────────────────────────────────────────────
const TypewriterText: React.FC<{ text: string; speed?: number }> = ({ text, speed = 14 }) => {
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
    }, speed);
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

// ─── Message bubble ───────────────────────────────────────────────────────────
const MessageBubble: React.FC<{ msg: Message; isLatest: boolean }> = ({ msg, isLatest }) => {
  const isUser = msg.sender === 'user';
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          alignItems: 'flex-start',
          gap: 1.5,
          mb: 0.5,
        }}
      >
        {/* Raksha avatar */}
        {!isUser && (
          <Box
            sx={{
              width: 32, height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1D4ED8 0%, #7C3AED 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              mt: 0.5,
              boxShadow: '0 0 12px rgba(59,130,246,0.5)',
            }}
          >
            <SmartToy sx={{ fontSize: 16, color: '#FFFFFF' }} />
          </Box>
        )}

        {/* Bubble */}
        <Box sx={{ maxWidth: '78%', position: 'relative' }}>
          <Box
            sx={{
              px: 2.5,
              py: 1.8,
              borderRadius: isUser
                ? '18px 18px 4px 18px'
                : '4px 18px 18px 18px',
              background: isUser
                ? 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)'
                : isDark
                  ? 'rgba(26,26,38,0.95)'
                  : 'rgba(249,248,247,0.95)',
              border: isUser
                ? 'none'
                : isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(11,11,15,0.08)',
              backdropFilter: 'blur(10px)',
              boxShadow: isUser
                ? '0 4px 16px rgba(37,99,235,0.3)'
                : isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(11,11,15,0.06)',
            }}
          >
            {/* Content */}
            <Typography
              variant="body2"
              sx={{
                color: isUser ? '#FFFFFF' : 'text.primary',
                lineHeight: 1.7,
                fontSize: '0.875rem',
                fontFamily: 'Inter, sans-serif',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {!isUser && isLatest ? <TypewriterText text={msg.text} /> : msg.text}
            </Typography>

            {/* Footer */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, gap: 1 }}>
              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: isUser ? 'rgba(255,255,255,0.55)' : 'text.disabled' }}>
                {msg.timestamp}
              </Typography>
              {!isUser && (
                <Tooltip title={copied ? 'Copied!' : 'Copy response'}>
                  <IconButton
                    size="small"
                    onClick={handleCopy}
                    sx={{
                      p: 0.4,
                      color: copied ? '#22C55E' : 'text.disabled',
                      '&:hover': { color: 'text.secondary' },
                    }}
                  >
                    {copied ? <CheckCircle sx={{ fontSize: 13 }} /> : <ContentCopy sx={{ fontSize: 13 }} />}
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        </Box>

        {/* User avatar */}
        {isUser && (
          <Box
            sx={{
              width: 32, height: 32,
              borderRadius: '50%',
              bgcolor: CR,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              mt: 0.5,
            }}
          >
            <Person sx={{ fontSize: 16, color: '#FFFFFF' }} />
          </Box>
        )}
      </Box>
    </motion.div>
  );
};

// ─── Thinking indicator ───────────────────────────────────────────────────────
const ThinkingDots: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 10 }}
    transition={{ duration: 0.25 }}
  >
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
      <Box
        sx={{
          width: 32, height: 32,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1D4ED8 0%, #7C3AED 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 0 12px rgba(59,130,246,0.5)',
        }}
      >
        <SmartToy sx={{ fontSize: 16, color: '#FFFFFF' }} />
      </Box>
      <Box
        sx={{
          px: 2.5, py: 1.8,
          borderRadius: '4px 18px 18px 18px',
          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(26,26,38,0.95)' : 'rgba(249,248,247,0.95)',
          border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(11,11,15,0.08)',
          display: 'flex', alignItems: 'center', gap: 0.8,
        }}
      >
        {[0, 0.18, 0.36].map((delay) => (
          <Box
            key={delay}
            sx={{
              width: 7, height: 7,
              borderRadius: '50%',
              bgcolor: BLUE,
              animation: `breathe 1.2s ${delay}s ease-in-out infinite`,
            }}
          />
        ))}
      </Box>
    </Box>
  </motion.div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const RakshaAi: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'raksha',
      text: `Welcome to Raksha AI — your specialized cybersecurity intelligence assistant inside KAVACH.\n\nI can help you:\n• Understand and explain security detections\n• Analyze suspicious URLs and threat indicators\n• Interpret ML anomaly detection results\n• Prioritize defensive actions from your alert queue\n• Explain MITRE ATT&CK tactics and techniques\n\nHow can I help protect your system today?`,
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
  const inputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const resp = await apiClient.get('/raksha/status');
        setProviderInfo(resp.data);
      } catch {
        setProviderInfo({ name: 'Offline Mode', is_offline_fallback: true });
      }
    };
    fetchStatus();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (text?: string) => {
    const textToSend = text || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!text) setInput('');
    setLoading(true);
    inputRef.current?.focus();

    try {
      const resp = await apiClient.post('/raksha/chat', { message: textToSend });
      const replyText = resp.data.response || resp.data.reply || resp.data.message || 'No response from assistant.';
      const rakshaMsg: Message = {
        id: `r-${Date.now()}`,
        sender: 'raksha',
        text: replyText,
        isAiGenerated: resp.data.is_ai_generated ?? true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, rakshaMsg]);
    } catch {
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'raksha',
        text: 'Unable to reach KAVACH AI engine. Please ensure the backend server is running and try again.',
        isAiGenerated: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 92px)',
        gap: 0,
        position: 'relative',
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 2,
            borderBottom: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(11,11,15,0.07)',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Raksha avatar glow */}
            <Box
              sx={{
                width: 44, height: 44,
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #1D4ED8 0%, #7C3AED 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 20px rgba(59,130,246,0.45)',
                position: 'relative',
              }}
            >
              <Psychology sx={{ fontSize: 22, color: '#FFFFFF' }} />
              {/* Pulse ring */}
              <Box
                sx={{
                  position: 'absolute',
                  inset: -3,
                  borderRadius: '17px',
                  border: '1px solid rgba(59,130,246,0.4)',
                  animation: 'pulse-glow 2.5s ease infinite',
                }}
              />
            </Box>

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 900, fontSize: '1.15rem', letterSpacing: '-0.02em', fontFamily: 'Outfit, sans-serif' }}>
                  Raksha AI
                </Typography>
                <Chip
                  label={providerInfo.name}
                  size="small"
                  icon={<AutoAwesome sx={{ fontSize: 11 }} />}
                  sx={{
                    bgcolor: providerInfo.is_offline_fallback ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.12)',
                    color: providerInfo.is_offline_fallback ? '#F59E0B' : '#22C55E',
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    height: 20,
                    border: `1px solid ${providerInfo.is_offline_fallback ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.3)'}`,
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                Specialized cybersecurity intelligence — powered by KAVACH
              </Typography>
            </Box>
          </Box>

          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setMessages([{
                id: `welcome-${Date.now()}`,
                sender: 'raksha',
                text: 'New conversation started. How can I help protect your system?',
                isAiGenerated: true,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              }]);
            }}
            sx={{
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(11,11,15,0.12)',
              color: 'text.secondary',
              fontWeight: 600,
              fontSize: '0.75rem',
              px: 1.5,
              textTransform: 'none',
              '&:hover': { borderColor: BLUE, color: BLUE },
            }}
          >
            New Chat
          </Button>
        </Box>
      </motion.div>

      {/* ── Suggestion Chips ─────────────────────────────────────────────── */}
      {messages.length <= 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              overflowX: 'auto',
              pb: 1.5,
              mb: 1,
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            {SUGGESTIONS.map((sug, i) => (
              <Chip
                key={i}
                label={sug}
                clickable
                onClick={() => handleSend(sug)}
                icon={<Bolt sx={{ fontSize: 14 }} />}
                sx={{
                  bgcolor: isDark ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.05)',
                  border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.15)'}`,
                  color: BLUE,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(59,130,246,0.15)',
                    borderColor: BLUE,
                  },
                }}
              />
            ))}
          </Box>
        </motion.div>
      )}

      {/* ── Chat Area ────────────────────────────────────────────────────── */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          pr: 0.5,
          scrollbarWidth: 'thin',
          scrollbarColor: isDark ? 'rgba(255,255,255,0.1) transparent' : 'rgba(11,11,15,0.1) transparent',
        }}
      >
        <Stack spacing={1.5} sx={{ py: 1 }}>
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isLatest={idx === messages.length - 1 && msg.sender === 'raksha'}
              />
            ))}
            {loading && <ThinkingDots />}
          </AnimatePresence>
        </Stack>
        <div ref={chatEndRef} />
      </Box>

      {/* ── Input Area ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Box
          sx={{
            pt: 2,
            borderTop: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(11,11,15,0.07)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              p: 1.5,
              borderRadius: 3,
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(11,11,15,0.1)',
              bgcolor: isDark ? 'rgba(18,18,26,0.9)' : '#FFFFFF',
              backdropFilter: 'blur(10px)',
              boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 2px 12px rgba(11,11,15,0.06)',
              transition: 'border-color 0.2s',
              '&:focus-within': {
                borderColor: BLUE,
                boxShadow: `0 0 0 3px rgba(59,130,246,0.12)`,
              },
            }}
          >
            <TextField
              inputRef={inputRef}
              multiline
              maxRows={4}
              fullWidth
              placeholder="Ask about a threat, alert, URL, or any cybersecurity question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              variant="standard"
              sx={{
                '& .MuiInput-root': {
                  fontSize: '0.88rem',
                  fontFamily: 'Inter, sans-serif',
                  '&::before, &::after': { display: 'none' },
                },
              }}
            />
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, flexShrink: 0 }}>
              <Tooltip title={loading ? 'Stop generation' : 'Send message (Enter)'}>
                <IconButton
                  onClick={loading ? undefined : () => handleSend()}
                  disabled={!loading && !input.trim()}
                  size="medium"
                  sx={{
                    bgcolor: loading ? 'rgba(239,68,68,0.1)' : BLUE,
                    color: loading ? CR : '#FFFFFF',
                    border: loading ? `1px solid ${CR}` : 'none',
                    width: 40, height: 40,
                    '&:hover': {
                      bgcolor: loading ? 'rgba(239,68,68,0.2)' : '#1D4ED8',
                    },
                    '&.Mui-disabled': {
                      bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(11,11,15,0.05)',
                      color: 'text.disabled',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  {loading ? <Stop sx={{ fontSize: 18 }} /> : <Send sx={{ fontSize: 18 }} />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1, color: 'text.disabled', fontSize: '0.68rem' }}>
            Raksha AI · Specialized for KAVACH security intelligence · Press Enter to send
          </Typography>
        </Box>
      </motion.div>
    </Box>
  );
};

export default RakshaAi;
