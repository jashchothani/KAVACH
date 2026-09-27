import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button, Chip, CircularProgress,
  Avatar
} from '@mui/material';
import {
  Psychology, Send, AutoAwesome
} from '@mui/icons-material';
import { api } from '../../api/client';

const CR = '#DC2626';

interface ChatMessage {
  id: string;
  sender: 'user' | 'raksha';
  text: string;
  timestamp: string;
}

const PRESET_PROMPTS = [
  'Is my computer safe?',
  'What happened today?',
  'Why did my score decrease?',
  'What should I fix first?',
  'What changed on my computer?',
  'Show me suspicious activity',
];

export const RakshaUserChat: React.FC<{ isDark: boolean; initialPrompt?: string }> = ({
  isDark,
  initialPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-0',
      sender: 'raksha',
      text: 'Namaste! I am Raksha, your dedicated KAVACH cybersecurity copilot. I continuously monitor your telemetry engines and translate complex security events into actionable advice. How can I help secure your device today?',
      timestamp: 'Just now',
    },
  ]);
  const [inputVal, setInputVal] = useState(initialPrompt || '');
  const [loading, setLoading] = useState(false);

  const cardBg = isDark ? 'rgba(18, 20, 29, 0.85)' : 'rgba(255, 255, 255, 0.95)';
  const border = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputVal;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setLoading(true);

    try {
      const resp = await api.raksha.chat(query, 'KAVACH User Dashboard Context');
      const rakshaMsg: ChatMessage = {
        id: `raksha-${Date.now()}`,
        sender: 'raksha',
        text: resp.reply || 'Your device is actively protected.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, rakshaMsg]);
    } catch {
      // Generic fallback answer if backend AI is cold
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: `raksha-${Date.now()}`,
          sender: 'raksha',
          text: 'Raksha AI is currently warming up or unreachable, but your KAVACH agent is still actively protecting your device in the background. Please try again in a moment.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }]);
        setLoading(false);
      }, 600);
      return;
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        p: { xs: 2.5, md: 4 },
        borderRadius: 4,
        bgcolor: cardBg,
        border: `1px solid ${border}`,
        boxShadow: isDark ? '0 16px 40px rgba(0,0,0,0.5)' : '0 12px 32px rgba(15,23,42,0.06)',
      }}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={3}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2.5,
              bgcolor: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3B82F6',
            }}
          >
            <Psychology sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, lineHeight: 1.2 }}>
              Raksha AI Cybersecurity Copilot
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Natural-Language Explanations & Guided Fixes
            </Typography>
          </Box>
        </Box>

        <Chip
          icon={<AutoAwesome sx={{ fontSize: '14px !important', color: '#3B82F6 !important' }} />}
          label="Neural Model Online"
          sx={{
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 800,
            fontSize: '0.68rem',
            bgcolor: 'rgba(59, 130, 246, 0.1)',
            color: '#3B82F6',
            border: '1px solid rgba(59, 130, 246, 0.25)',
          }}
        />
      </Box>

      {/* Suggested Prompts */}
      <Box mb={2.5}>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: 'text.secondary', letterSpacing: '0.05em', textTransform: 'uppercase', mb: 1 }}>
          Suggested Inquiries
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {PRESET_PROMPTS.map((prompt, idx) => (
            <Chip
              key={idx}
              label={prompt}
              onClick={() => handleSend(prompt)}
              sx={{
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                border: `1px solid ${border}`,
                '&:hover': { borderColor: '#3B82F6', color: '#3B82F6' },
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Chat Messages Container */}
      <Box
        sx={{
          p: 2.5,
          borderRadius: 3.5,
          bgcolor: isDark ? '#0F121C' : '#F8FAFC',
          border: `1px solid ${border}`,
          height: 380,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          mb: 2.5,
        }}
      >
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <Box
              key={msg.id}
              sx={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                gap: 1.5,
              }}
            >
              {!isUser && (
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: 'rgba(59, 130, 246, 0.15)',
                    color: '#3B82F6',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    fontSize: '0.8rem',
                  }}
                >
                  <Psychology sx={{ fontSize: 18 }} />
                </Avatar>
              )}

              <Box sx={{ maxWidth: '82%' }}>
                <Box
                  sx={{
                    p: 2,
                    px: 2.5,
                    borderRadius: 3,
                    bgcolor: isUser
                      ? CR
                      : (isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF'),
                    color: isUser ? '#FFFFFF' : 'text.primary',
                    border: isUser ? 'none' : `1px solid ${border}`,
                    boxShadow: isUser ? '0 4px 12px rgba(220,38,38,0.25)' : 'none',
                  }}
                >
                  <Typography sx={{ fontSize: '0.86rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                    {msg.text}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.66rem', color: 'text.secondary', mt: 0.4, textAlign: isUser ? 'right' : 'left', px: 0.5 }}>
                  {msg.timestamp}
                </Typography>
              </Box>
            </Box>
          );
        })}

        {loading && (
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' }}>
              <CircularProgress size={16} color="inherit" />
            </Avatar>
            <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', fontStyle: 'italic' }}>
              Raksha is inspecting sovereign host telemetry...
            </Typography>
          </Box>
        )}
      </Box>

      {/* Input Field */}
      <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSend(); }} sx={{ display: 'flex', gap: 1.5 }}>
        <TextField
          fullWidth
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Ask Raksha anything about your device security..."
          disabled={loading}
          InputProps={{
            sx: {
              borderRadius: 3,
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
              fontSize: '0.88rem',
            },
          }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={loading || !inputVal.trim()}
          startIcon={<Send sx={{ fontSize: 16 }} />}
          sx={{
            bgcolor: CR,
            color: '#FFFFFF',
            fontWeight: 800,
            borderRadius: 3,
            px: 3.5,
            textTransform: 'none',
            '&:hover': { bgcolor: '#B91C1C' },
          }}
        >
          Ask
        </Button>
      </Box>
    </Box>
  );
};
