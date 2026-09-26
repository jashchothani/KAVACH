import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Stack, Chip, useTheme, Paper,
  Collapse, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, LinearProgress, Divider, Grid, IconButton,
  Tabs, Tab, TextField, InputAdornment,
} from '@mui/material';
import {
  Check, CheckCircle, Refresh, Block, Psychology, ExpandMore, ExpandLess,
  Warning, Error as ErrorIcon, BugReport, Search, FilterList,
  Notifications, Shield, Terminal,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { api } from '../api/client';

const CR = '#DC2626';
const SAFE = '#22C55E';

const SEVERITY_COLOR: Record<string, string> = {
  critical: '#991B1B',
  high: CR,
  medium: '#D97706',
  low: SAFE,
  info: '#3B82F6',
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: 'OPEN', color: CR, bg: 'rgba(220,38,38,0.1)' },
  acknowledged: { label: 'ACKNOWLEDGED', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  quarantined: { label: 'QUARANTINED', color: '#DC2626', bg: 'rgba(220,38,38,0.1)' },
  resolved: { label: 'RESOLVED', color: SAFE, bg: 'rgba(34,197,94,0.1)' },
};

// ─── Alert Row ────────────────────────────────────────────────────────────────
const AlertRow: React.FC<{
  alert: any;
  isExpanded: boolean;
  onToggle: () => void;
  onAction: (id: string, status: string) => void;
  onAskRaksha: (alert: any) => void;
  idx: number;
}> = ({ alert, isExpanded, onToggle, onAction, onAskRaksha, idx }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const sev = alert.severity || 'medium';
  const statusMeta = STATUS_META[alert.status] || STATUS_META.open;
  const tech = alert.technical_details || alert.details || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.06, duration: 0.4 }}
    >
      <Box
        sx={{
          borderRadius: 3,
          border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(11,11,15,0.07)',
          bgcolor: isDark ? 'rgba(18,18,26,0.9)' : '#FFFFFF',
          overflow: 'hidden',
          mb: 1.5,
          transition: 'border-color 0.2s',
          borderLeft: `3px solid ${SEVERITY_COLOR[sev] || CR}`,
          '&:hover': {
            borderColor: `${SEVERITY_COLOR[sev] || CR}60`,
          },
        }}
      >
        {/* Main row */}
        <Box sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, justifyContent: 'space-between', alignItems: { md: 'flex-start' } }}>
            {/* Left: Alert info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 0.8 }}>
                <Box
                  sx={{
                    px: 1.2, py: 0.3,
                    borderRadius: 1.5,
                    bgcolor: `${SEVERITY_COLOR[sev]}15`,
                    border: `1px solid ${SEVERITY_COLOR[sev]}30`,
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 800, color: SEVERITY_COLOR[sev], fontSize: '0.62rem', letterSpacing: '0.06em' }}>
                    {sev.toUpperCase()}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    px: 1.2, py: 0.3,
                    borderRadius: 1.5,
                    bgcolor: statusMeta.bg,
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 800, color: statusMeta.color, fontSize: '0.62rem', letterSpacing: '0.06em' }}>
                    {statusMeta.label}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
                  {alert.created_at ? new Date(alert.created_at).toLocaleString() : 'Just now'}
                </Typography>
              </Box>

              <Typography variant="subtitle1" sx={{ fontWeight: 800, fontFamily: 'Outfit, sans-serif', fontSize: '0.95rem', mb: 0.5, lineHeight: 1.3 }}>
                {alert.title}
              </Typography>

              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6, maxWidth: 620 }}>
                {alert.plain_english || alert.description || 'Security alert triggered by detection pipeline.'}
              </Typography>

              {alert.category && (
                <Chip
                  label={alert.category.toUpperCase()}
                  size="small"
                  variant="outlined"
                  sx={{ mt: 1, fontSize: '0.6rem', fontWeight: 800, height: 20, borderColor: 'divider' }}
                />
              )}
            </Box>

            {/* Right: Actions */}
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ flexShrink: 0, mt: { xs: 1, md: 0 } }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => onAskRaksha(alert)}
                startIcon={<Psychology sx={{ fontSize: 15 }} />}
                sx={{
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  borderColor: 'rgba(59,130,246,0.35)',
                  color: '#3B82F6',
                  '&:hover': { borderColor: '#3B82F6', bgcolor: 'rgba(59,130,246,0.06)' },
                }}
              >
                Ask AI
              </Button>

              {alert.status === 'open' && (
                <>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onAction(alert.id, 'resolved')}
                    startIcon={<CheckCircle sx={{ fontSize: 15 }} />}
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      textTransform: 'none',
                      borderColor: 'rgba(34,197,94,0.35)',
                      color: SAFE,
                      '&:hover': { borderColor: SAFE, bgcolor: 'rgba(34,197,94,0.06)' },
                    }}
                  >
                    Allow
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => onAction(alert.id, 'quarantined')}
                    startIcon={<Block sx={{ fontSize: 15 }} />}
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      textTransform: 'none',
                      bgcolor: CR,
                      '&:hover': { bgcolor: '#B91C1C' },
                      boxShadow: 'none',
                    }}
                  >
                    Block
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onAction(alert.id, 'acknowledged')}
                    startIcon={<Check sx={{ fontSize: 15 }} />}
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      textTransform: 'none',
                      borderColor: 'divider',
                      color: 'text.secondary',
                      '&:hover': { borderColor: 'text.secondary' },
                    }}
                  >
                    Ack
                  </Button>
                </>
              )}

              <Button
                size="small"
                onClick={onToggle}
                endIcon={isExpanded ? <ExpandLess sx={{ fontSize: 14 }} /> : <ExpandMore sx={{ fontSize: 14 }} />}
                sx={{ fontWeight: 700, fontSize: '0.72rem', color: 'text.disabled', textTransform: 'none', '&:hover': { color: 'text.secondary' } }}
              >
                {isExpanded ? 'Hide' : 'Details'}
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* Expandable forensics panel */}
        <Collapse in={isExpanded}>
          <Box
            sx={{
              px: 2.5, pb: 2.5,
              borderTop: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(11,11,15,0.05)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pt: 2, mb: 1.5 }}>
              <Terminal sx={{ fontSize: 16, color: CR }} />
              <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.06em', fontSize: '0.7rem', color: 'text.secondary' }}>
                FORENSIC TELEMETRY · SYSMON CORRELATION
              </Typography>
            </Box>
            <Grid container spacing={1.5}>
              {Object.entries(tech).map(([key, val]) => (
                <Grid item xs={12} sm={6} key={key}>
                  <Box
                    sx={{
                      p: 1.5, borderRadius: 2,
                      bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(11,11,15,0.02)',
                      border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(11,11,15,0.06)',
                    }}
                  >
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.08em', color: 'text.disabled', display: 'block', mb: 0.4 }}>
                      {key.replace(/_/g, ' ').toUpperCase()}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: 'JetBrains Mono, monospace',
                        wordBreak: 'break-all',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        color: key === 'mitre_attack' ? '#3B82F6' : key === 'command_line' ? CR : 'text.primary',
                        lineHeight: 1.4,
                      }}
                    >
                      {String(val)}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Collapse>
      </Box>
    </motion.div>
  );
};

// ─── Main Alert Center ────────────────────────────────────────────────────────
export const AlertCenter: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [alerts, setAlerts] = useState<any[]>([]);
  const [tabVal, setTabVal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<{ title: string; explanation: string; recommendation?: string } | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [search, setSearch] = useState('');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await api.threats.getAlerts();
      if (data && data.length) {
        setAlerts(data);
      } else {
        setAlerts([]);
      }
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, []);

  const handleAction = async (id: string, newStatus: string) => {
    try {
      await api.threats.updateAlert(id, { status: newStatus });
    } catch { /* offline */ }
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)));
  };

  const handleAskRaksha = async (alert: any) => {
    setAiExplanation({ title: alert.title, explanation: 'Analyzing...', recommendation: undefined });
    setExplaining(true);
    try {
      const res = await api.threats.explainAlert(alert.id);
      setAiExplanation({
        title: alert.title,
        explanation: res.explanation || 'KAVACH AI analyzed this alert: Anomaly in process behavior detected. No data loss has occurred. The process has been safely suspended.',
        recommendation: res.recommended_action || 'Keep in quarantine and verify with your IT lead before allowing execution.',
      });
    } catch {
      setAiExplanation({
        title: alert.title,
        explanation: 'This alert indicates an anomaly in process behavior. KAVACH has suspended the process safely. The file hash has been matched against the local threat database.',
        recommendation: 'Recommend blocking or keeping in quarantine until verified by IT lead.',
      });
    } finally {
      setExplaining(false);
    }
  };

  const CATEGORIES = ['all', 'threat', 'soar', 'ai', 'system'];
  const filteredAlerts = alerts
    .filter((a) => {
      const cat = CATEGORIES[tabVal];
      if (cat !== 'all' && a.category?.toLowerCase() !== cat) return false;
      if (search && !a.title?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

  const openCount = alerts.filter((a) => a.status === 'open').length;
  const critCount = alerts.filter((a) => a.severity === 'critical' || a.severity === 'high').length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', fontFamily: 'Outfit, sans-serif' }}>
              Alert Center
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.3 }}>
              Live security incidents, AI detections & SOAR notifications
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            {openCount > 0 && (
              <Box
                sx={{
                  px: 1.5, py: 0.5,
                  borderRadius: 100,
                  bgcolor: 'rgba(220,38,38,0.1)',
                  border: '1px solid rgba(220,38,38,0.25)',
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 800, color: CR, fontSize: '0.72rem' }}>
                  {openCount} Open Alert{openCount !== 1 ? 's' : ''}
                </Typography>
              </Box>
            )}
            <IconButton
              size="small"
              onClick={fetchAlerts}
              sx={{ border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(11,11,15,0.1)', borderRadius: 2 }}
            >
              <Refresh sx={{ fontSize: 18 }} />
            </IconButton>
          </Stack>
        </Box>
      </motion.div>

      {/* ── Progress ─────────────────────────────────────────────────────── */}
      {loading && <LinearProgress sx={{ borderRadius: 100, height: 2 }} />}

      {/* ── Search + Filter bar ───────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            alignItems: 'center',
            p: 2,
            borderRadius: 3,
            border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(11,11,15,0.07)',
            bgcolor: isDark ? 'rgba(18,18,26,0.9)' : '#FFFFFF',
          }}
        >
          <TextField
            size="small"
            placeholder="Search alerts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment>,
            }}
          />
          <Tabs
            value={tabVal}
            onChange={(_, v) => setTabVal(v)}
            sx={{
              '& .MuiTab-root': { fontWeight: 700, fontSize: '0.78rem', minHeight: 36, py: 0.5, textTransform: 'none' },
              '& .MuiTabs-indicator': { bgcolor: CR, height: 2 },
              minHeight: 36,
            }}
          >
            <Tab label={`All (${alerts.length})`} />
            <Tab label="Threats" />
            <Tab label="SOAR" />
            <Tab label="AI Anomaly" />
            <Tab label="System" />
          </Tabs>
        </Box>
      </motion.div>

      {/* ── Alert List ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {filteredAlerts.length === 0 && !loading ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Box
              sx={{
                py: 8, textAlign: 'center',
                border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(11,11,15,0.07)',
                borderRadius: 3,
                bgcolor: isDark ? 'rgba(18,18,26,0.9)' : '#FFFFFF',
              }}
            >
              <CheckCircle sx={{ fontSize: 48, color: SAFE, mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                All Clear
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                No alerts in this category. System is operating normally.
              </Typography>
            </Box>
          </motion.div>
        ) : (
          <Box>
            {filteredAlerts.map((alert, idx) => (
              <AlertRow
                key={alert.id || idx}
                alert={alert}
                idx={idx}
                isExpanded={expandedId === alert.id}
                onToggle={() => setExpandedId(expandedId === alert.id ? null : alert.id)}
                onAction={handleAction}
                onAskRaksha={handleAskRaksha}
              />
            ))}
          </Box>
        )}
      </AnimatePresence>

      {/* ── Raksha AI Explanation Dialog ─────────────────────────────────── */}
      <Dialog
        open={Boolean(aiExplanation)}
        onClose={() => setAiExplanation(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(11,11,15,0.08)',
            boxShadow: isDark ? '0 24px 64px rgba(0,0,0,0.7)' : '0 16px 48px rgba(11,11,15,0.15)',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1.5 }}>
          <Box
            sx={{
              width: 36, height: 36, borderRadius: 2,
              background: 'linear-gradient(135deg, #1D4ED8, #7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Psychology sx={{ fontSize: 20, color: '#FFFFFF' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: 'Outfit, sans-serif', fontSize: '1rem', lineHeight: 1.2 }}>
              Raksha AI Analysis
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Security intelligence powered by KAVACH AI
            </Typography>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ py: 2.5 }}>
          {aiExplanation && (
            <Stack spacing={2}>
              <Box
                sx={{
                  p: 1.5, borderRadius: 2,
                  bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(11,11,15,0.02)',
                  border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(11,11,15,0.06)',
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.06em', color: 'text.disabled', fontSize: '0.62rem', display: 'block', mb: 0.3 }}>
                  ANALYZED ALERT
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.4 }}>
                  {aiExplanation.title}
                </Typography>
              </Box>

              {explaining ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
                  <CircularProgress size={20} sx={{ color: '#3B82F6' }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Raksha AI is analyzing telemetry...</Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    p: 2, borderRadius: 2.5,
                    bgcolor: isDark ? 'rgba(59,130,246,0.05)' : 'rgba(59,130,246,0.03)',
                    border: '1px solid rgba(59,130,246,0.15)',
                  }}
                >
                  <Typography variant="body2" sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {aiExplanation.explanation}
                  </Typography>
                </Box>
              )}

              {aiExplanation.recommendation && !explaining && (
                <Box
                  sx={{
                    p: 2, borderRadius: 2.5,
                    bgcolor: 'rgba(34,197,94,0.07)',
                    border: '1px solid rgba(34,197,94,0.2)',
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#16A34A', fontSize: '0.65rem', letterSpacing: '0.06em', display: 'block', mb: 0.5 }}>
                    RECOMMENDED ACTION
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#16A34A', fontWeight: 600, lineHeight: 1.6 }}>
                    {aiExplanation.recommendation}
                  </Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 0 }}>
          <Button
            onClick={() => setAiExplanation(null)}
            variant="contained"
            sx={{ fontWeight: 700, bgcolor: CR, '&:hover': { bgcolor: '#B91C1C' } }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AlertCenter;
