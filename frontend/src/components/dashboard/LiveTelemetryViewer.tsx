import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, IconButton, Tooltip, Paper } from '@mui/material';
import { PlayArrow, Pause, Delete, Terminal, Code } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const CR = '#DC2626';
const SAFE = '#22C55E';
const WARN = '#F59E0B';
const BLUE = '#3B82F6';

interface LogEntry {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  severity?: 'info' | 'warning' | 'critical' | 'debug';
  raw?: any;
}

export const LiveTelemetryViewer: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollContainerRef.current && !userScrolledUp && !isPaused) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs, isPaused, userScrolledUp]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    
    // If the user scrolls up more than 30px from the bottom, stop auto-scrolling
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 30;
    if (!isNearBottom && !userScrolledUp) {
      setUserScrolledUp(true);
    } else if (isNearBottom && userScrolledUp) {
      setUserScrolledUp(false);
    }
  };

  useEffect(() => {
    const connectWs = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.port === '5173' ? '127.0.0.1:8000' : window.location.host;
      const wsUrl = `${protocol}//${host}/api/v1/dashboard/live`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        if (isPaused) return;
        
        try {
          const data = JSON.parse(event.data);
          
          let severity: 'info' | 'warning' | 'critical' = 'info';
          let message = data.message || JSON.stringify(data);
          let type = data.type || 'EVENT';

          if (data.severity === 'critical' || data.level === 'CRITICAL' || type === 'ALERT') severity = 'critical';
          else if (data.severity === 'high' || data.level === 'WARNING') severity = 'warning';

          if (data.title) message = `${data.title}: ${data.ai_explanation || data.description || ''}`;
          if (data.action) message = `${data.action} on ${data.target_process || data.target_ip || 'system'}`;

          const newLog: LogEntry = {
            id: Math.random().toString(36).substring(7),
            timestamp: data.timestamp || new Date().toISOString(),
            type: type.toUpperCase(),
            message,
            severity,
            raw: data,
          };

          setLogs(prev => {
            const updated = [...prev, newLog];
            return updated.slice(-150); // Keep last 150 logs
          });
        } catch (e) {
          console.error("Failed to parse telemetry:", e);
        }
      };

      ws.onerror = () => {
        const errorLog: LogEntry = {
          id: 'error',
          timestamp: new Date().toISOString(),
          type: 'SYSTEM',
          message: 'WebSocket connection error. Retrying...',
          severity: 'warning'
        };
        setLogs(prev => [...prev.slice(-149), errorLog]);
      };

      ws.onclose = () => {
        setTimeout(connectWs, 5000); // Reconnect after 5s
      };
    };

    connectWs();

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [isPaused]);

  const clearLogs = () => {
    setLogs([]);
    setUserScrolledUp(false);
  };

  const getLogColor = (severity?: string) => {
    switch (severity) {
      case 'critical': return CR;
      case 'warning': return WARN;
      case 'info': return BLUE;
      default: return isDark ? '#A1A1AA' : '#52525B';
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        minHeight: 350,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3.5,
        border: isDark ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(11,11,15,0.07)',
        bgcolor: isDark ? '#262A3B' : '#0F172A', // CRM card background
        boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.2)' : '0 10px 30px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Terminal Header */}
      <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', bgcolor: isDark ? 'rgba(0,0,0,0.1)' : '#1E293B' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Terminal sx={{ color: '#94A3B8', fontSize: 18 }} />
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#F8FAFC', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>
            SOC_TELEMETRY_STREAM_01
          </Typography>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: isPaused ? WARN : SAFE, boxShadow: `0 0 10px ${isPaused ? WARN : SAFE}`, animation: isPaused ? 'none' : 'status-blink 1.5s infinite' }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title={isPaused ? "Resume Stream" : "Pause Stream"}>
            <IconButton size="small" onClick={() => setIsPaused(!isPaused)} sx={{ color: '#94A3B8', '&:hover': { color: '#F8FAFC', bgcolor: 'rgba(255,255,255,0.1)' } }}>
              {isPaused ? <PlayArrow sx={{ fontSize: 16 }} /> : <Pause sx={{ fontSize: 16 }} />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear Console">
            <IconButton size="small" onClick={clearLogs} sx={{ color: '#94A3B8', '&:hover': { color: '#F8FAFC', bgcolor: 'rgba(255,255,255,0.1)' } }}>
              <Delete sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Floating indicator if user scrolled up */}
      <AnimatePresence>
        {(userScrolledUp || isPaused) && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            sx={{
              position: 'absolute', top: 60, left: '50%', transform: 'translateX(-50%)',
              bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
              color: '#FFF', px: 2, py: 0.5, borderRadius: 10,
              fontSize: '0.7rem', fontWeight: 700, zIndex: 10,
              border: '1px solid rgba(255,255,255,0.2)',
              cursor: 'pointer'
            }}
            onClick={() => {
              setIsPaused(false);
              setUserScrolledUp(false);
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'smooth' });
              }
            }}
          >
            {isPaused ? 'STREAM PAUSED - CLICK TO RESUME' : 'AUTO-SCROLL PAUSED - CLICK TO RESUME'}
          </Box>
        )}
      </AnimatePresence>

      <Box 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        sx={{ flex: 1, p: 2, overflowY: 'auto', fontFamily: 'JetBrains Mono, monospace', '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 10 } }}
      >
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ marginBottom: 6, display: 'flex', gap: 12, alignItems: 'flex-start' }}
            >
              <Typography sx={{ color: '#64748B', fontSize: '0.72rem', flexShrink: 0, whiteSpace: 'nowrap', pt: 0.2 }}>
                {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </Typography>
              <Typography sx={{ color: getLogColor(log.severity), fontSize: '0.72rem', flexShrink: 0, width: 65, pt: 0.2, fontWeight: 700 }}>
                [{log.type.substring(0, 5)}]
              </Typography>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ color: log.severity === 'critical' ? CR : log.severity === 'warning' ? WARN : '#CBD5E1', fontSize: '0.75rem', wordBreak: 'break-word', lineHeight: 1.4 }}>
                  {log.message}
                </Typography>
              </Box>
            </motion.div>
          ))}
        </AnimatePresence>
        {logs.length === 0 && (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={2} opacity={0.5}>
            <Code sx={{ fontSize: 32, color: '#64748B' }} />
            <Typography sx={{ color: '#64748B', fontSize: '0.75rem', fontStyle: 'italic', textAlign: 'center' }}>
              Listening for kernel events on socket /api/v1/dashboard/live...
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};
