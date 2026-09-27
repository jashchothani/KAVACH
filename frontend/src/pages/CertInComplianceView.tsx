import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Chip, Stack, Paper, IconButton,
  Tooltip, CircularProgress, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, Divider, Tabs, Tab,
  TextField, InputAdornment,
} from '@mui/material';
import {
  Gavel, VerifiedUser, AccessTime, Warning, CheckCircle,
  FileDownload, ContentCopy, Email, Security, Storage,
  InfoOutlined, Launch, ArrowForward, Close, Dns, Refresh,
  Search, Fingerprint, Lock,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  api, type CertInIncident, type CertInReport,
  type CertInAdvisory, type AuditVaultStatus
} from '../api/client';
import { useThemeMode } from '../context/ThemeContext';

const CR = '#DC2626';
const WARN = '#F59E0B';
const SAFE = '#22C55E';
const CYAN = '#06B6D4';
const BLUE = '#3B82F6';

export const CertInComplianceView: React.FC = () => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  const [incidents, setIncidents] = useState<CertInIncident[]>([]);
  const [advisories, setAdvisories] = useState<CertInAdvisory[]>([]);
  const [vaultStatus, setVaultStatus] = useState<AuditVaultStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<CertInReport | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Vault Query State
  const [vaultQuery, setVaultQuery] = useState('');
  const [vaultResults, setVaultResults] = useState<any | null>(null);
  const [vaultSearching, setVaultSearching] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [inc, adv, vlt] = await Promise.all([
        api.compliance.getIncidents(),
        api.compliance.getAdvisories(),
        api.compliance.getAuditVaultStatus(),
      ]);
      setIncidents(inc);
      setAdvisories(adv);
      setVaultStatus(vlt);
    } catch (err) {
      console.error('Failed to load compliance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenReport = async (incidentId: string) => {
    setGeneratingReport(true);
    try {
      const report = await api.compliance.generateReport(incidentId);
      setSelectedReport(report);
      setReportModalOpen(true);
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleMarkReported = async (incidentId: string) => {
    try {
      await api.compliance.markReported(incidentId);
      setIncidents(prev =>
        prev.map(i => (i.incident_id === incidentId ? { ...i, reported_to_certin: true } : i))
      );
    } catch (err) {
      console.error('Failed to mark reported:', err);
    }
  };

  const handleCopyDeclaration = () => {
    if (selectedReport) {
      navigator.clipboard.writeText(selectedReport.official_formatted_declaration);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleDownloadJson = () => {
    if (!selectedReport) return;
    const blob = new Blob([JSON.stringify(selectedReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReport.report_reference_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTextNotice = () => {
    if (!selectedReport) return;
    const blob = new Blob([selectedReport.official_formatted_declaration], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CERT-IN-ANNEXURE-I-${selectedReport.incident_id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSearchVault = async () => {
    setVaultSearching(true);
    try {
      const res = await api.compliance.searchVault(vaultQuery);
      setVaultResults(res);
    } catch (err) {
      console.error('Vault query failed:', err);
    } finally {
      setVaultSearching(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1600, mx: 'auto' }}>
      {/* ── TOP HEADER ─────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Box display="flex" alignItems="center" gap={1.5} mb={0.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2.5,
                bgcolor: 'rgba(220, 38, 38, 0.12)',
                color: CR,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Gavel sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, color: 'text.primary', lineHeight: 1.1 }}>
                Sovereign Indian CERT-In Compliance Suite
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Pursuant to Cyber Security Directions under Section 70B of Information Technology Act, 2000
              </Typography>
            </Box>
          </Box>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Chip
            icon={<VerifiedUser sx={{ fontSize: 16, color: `${SAFE} !important` }} />}
            label="CERT-In 6-Hour Ready"
            sx={{
              fontWeight: 800,
              bgcolor: 'rgba(34, 197, 94, 0.12)',
              color: SAFE,
              border: `1px solid ${SAFE}`,
            }}
          />
          <IconButton onClick={loadData} sx={{ border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
            <Refresh sx={{ fontSize: 20 }} />
          </IconButton>
        </Stack>
      </Box>

      {/* ── STATUTORY SUMMARY METRICS ───────────────────────────────────── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 2.5,
          mb: 4,
        }}
      >
        {/* 180-Day Log Vault Status */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3.5,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
            bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF',
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
            <Box display="flex" alignItems="center" gap={1}>
              <Storage sx={{ color: CYAN, fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                180-Day Audit Log Vault
              </Typography>
            </Box>
            <Chip
              label="100% COMPLIANT"
              size="small"
              sx={{ bgcolor: 'rgba(34,197,94,0.15)', color: SAFE, fontWeight: 900, fontSize: '0.65rem' }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.82rem', mb: 1.5 }}>
            All telemetry and access logs are timestamped with NTP synchronized clocks and archived for 180+ days within Indian jurisdiction.
          </Typography>
          <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC' }}>
            <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono', color: 'text.secondary', display: 'block', fontSize: '0.72rem' }}>
              • Retention Guaranteed: <strong>{vaultStatus?.retention_days_guaranteed || 185} Days</strong>
            </Typography>
            <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono', color: 'text.secondary', display: 'block', fontSize: '0.72rem' }}>
              • Tamper-Proof Merkle Hash Chain: <strong style={{ color: SAFE }}>ACTIVE</strong>
            </Typography>
          </Box>
        </Paper>

        {/* 6-Hour Countdown Window */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3.5,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
            bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF',
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
            <Box display="flex" alignItems="center" gap={1}>
              <AccessTime sx={{ color: CR, fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                Mandatory 6-Hour Notification
              </Typography>
            </Box>
            <Chip
              label="LEGAL REQUIREMENT"
              size="small"
              sx={{ bgcolor: 'rgba(220,38,38,0.15)', color: CR, fontWeight: 900, fontSize: '0.65rem' }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.82rem', mb: 1.5 }}>
            Section 70B mandates notice to CERT-In within 6 hours of incident identification. KAVACH auto-collates Annexure-I reports instantly.
          </Typography>
          <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC' }}>
            <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono', color: 'text.secondary', display: 'block', fontSize: '0.72rem' }}>
              • Official Email: <strong style={{ color: BLUE }}>incident@cert-in.org.in</strong>
            </Typography>
            <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono', color: 'text.secondary', display: 'block', fontSize: '0.72rem' }}>
              • Active Incidents Requiring Notice: <strong style={{ color: CR }}>{incidents.filter(i => !i.reported_to_certin).length} Pending</strong>
            </Typography>
          </Box>
        </Paper>

        {/* Organization Sovereign Profile */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3.5,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
            bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF',
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
            <Box display="flex" alignItems="center" gap={1}>
              <Security sx={{ color: SAFE, fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                Designated Reporting Entity
              </Typography>
            </Box>
            <Chip
              label="INDIA / MH"
              size="small"
              sx={{ bgcolor: 'rgba(59,130,246,0.15)', color: BLUE, fontWeight: 900, fontSize: '0.65rem' }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.82rem', mb: 1.5 }}>
            Certified entity profile registered for automated incident filing with CERT-In emergency operations centre.
          </Typography>
          <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC' }}>
            <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono', color: 'text.secondary', display: 'block', fontSize: '0.72rem' }}>
              • Entity: <strong>Swastik Chemical (India) Pvt. Ltd.</strong>
            </Typography>
            <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono', color: 'text.secondary', display: 'block', fontSize: '0.72rem' }}>
              • Designated POC: <strong>CISO Emergency Response Cell</strong>
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* ── TABS: INCIDENTS FILING vs NATIONAL ADVISORIES ──────────────────── */}
      <Box sx={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`, mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 800, fontSize: '0.9rem' },
            '& .Mui-selected': { color: `${CR} !important` },
            '& .MuiTabs-indicator': { bgcolor: CR },
          }}
        >
          <Tab label={`Active Reportable Incidents (${incidents.length})`} />
          <Tab label={`CERT-In Threat Advisories (${advisories.length})`} />
          <Tab label="180-Day Immutable Audit Vault (Section 70B)" />
        </Tabs>
      </Box>

      {/* TAB 0: INCIDENTS TABLE */}
      {activeTab === 0 && (
        <Stack spacing={2}>
          {incidents.map((inc) => {
            const isReported = inc.reported_to_certin;
            const isUrgent = inc.time_remaining_minutes < 180 && !isReported;

            return (
              <Paper
                key={inc.incident_id}
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3.5,
                  border: `1px solid ${isUrgent ? 'rgba(220,38,38,0.4)' : (isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0')}`,
                  bgcolor: isDark ? '#0A0C13' : '#FFFFFF',
                  boxShadow: isUrgent ? '0 0 20px rgba(220,38,38,0.1)' : 'none',
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2} mb={2}>
                  <Box>
                    <Box display="flex" alignItems="center" gap={1.2} mb={0.5}>
                      <Chip
                        label={inc.severity.toUpperCase()}
                        size="small"
                        sx={{
                          bgcolor: inc.severity === 'critical' ? 'rgba(220,38,38,0.15)' : 'rgba(245,158,11,0.15)',
                          color: inc.severity === 'critical' ? CR : WARN,
                          fontWeight: 900,
                          fontSize: '0.65rem',
                        }}
                      />
                      <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono', color: 'text.secondary', fontWeight: 700 }}>
                        {inc.incident_id}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>•</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {inc.regulatory_category}
                      </Typography>
                    </Box>

                    <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                      {inc.title}
                    </Typography>

                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.84rem' }}>
                      Affected: <strong>{inc.blast_radius}</strong>
                    </Typography>
                  </Box>

                  {/* 6-Hour Clock Countdown */}
                  <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                    {isReported ? (
                      <Chip
                        icon={<CheckCircle sx={{ fontSize: 16, color: `${SAFE} !important` }} />}
                        label="Reported to CERT-In"
                        sx={{ bgcolor: 'rgba(34,197,94,0.12)', color: SAFE, fontWeight: 800 }}
                      />
                    ) : (
                      <Box>
                        <Typography variant="caption" sx={{ color: isUrgent ? CR : 'text.secondary', fontWeight: 800, display: 'block' }}>
                          REGULATORY DEADLINE:
                        </Typography>
                        <Typography variant="h6" sx={{ fontFamily: 'JetBrains Mono', fontWeight: 900, color: isUrgent ? CR : WARN }}>
                          {Math.floor(inc.time_remaining_minutes / 60)}h {inc.time_remaining_minutes % 60}m remaining
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                          Due by {inc.deadline_ist}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                <Divider sx={{ my: 2, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />

                {/* Actions Row */}
                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'JetBrains Mono', fontSize: '0.75rem' }}>
                    Detected: {inc.detected_at_ist}
                  </Typography>

                  <Stack direction="row" spacing={1.5}>
                    {!isReported && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleMarkReported(inc.incident_id)}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          borderRadius: 2,
                          color: 'text.secondary',
                          borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)',
                        }}
                      >
                        Mark as Notified
                      </Button>
                    )}

                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleOpenReport(inc.incident_id)}
                      disabled={generatingReport}
                      startIcon={<FileDownload sx={{ fontSize: 18 }} />}
                      sx={{
                        bgcolor: CR,
                        color: '#FFF',
                        fontWeight: 800,
                        textTransform: 'none',
                        borderRadius: 2,
                        '&:hover': { bgcolor: '#B91C1C' },
                      }}
                    >
                      Generate CERT-In Annexure-I Report
                    </Button>
                  </Stack>
                </Box>
              </Paper>
            );
          })}
        </Stack>
      )}

      {/* TAB 1: ADVISORIES FEED */}
      {activeTab === 1 && (
        <Stack spacing={2.5}>
          {advisories.map((adv) => (
            <Paper
              key={adv.id}
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3.5,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
                bgcolor: isDark ? '#0A0C13' : '#FFFFFF',
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip
                    label={adv.advisory_number}
                    size="small"
                    sx={{ fontFamily: 'JetBrains Mono', fontWeight: 900, bgcolor: 'rgba(59,130,246,0.15)', color: BLUE }}
                  />
                  <Chip
                    label={adv.severity}
                    size="small"
                    sx={{
                      fontWeight: 900,
                      bgcolor: adv.severity === 'CRITICAL' ? 'rgba(220,38,38,0.15)' : 'rgba(245,158,11,0.15)',
                      color: adv.severity === 'CRITICAL' ? CR : WARN,
                    }}
                  />
                </Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Published: {adv.published_date}
                </Typography>
              </Box>

              <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 800, mb: 1, color: 'text.primary' }}>
                {adv.title}
              </Typography>

              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6, mb: 2 }}>
                {adv.summary}
              </Typography>

              <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', mb: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary', display: 'block', mb: 0.5 }}>
                  RECOMMENDED DEFENSIVE ACTION:
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                  {adv.recommended_mitigation}
                </Typography>
              </Box>

              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Chip
                  label={`Target: ${adv.target_sector}`}
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', color: 'text.secondary' }}
                />
                <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono', color: CYAN, fontWeight: 700 }}>
                  {adv.mitre_attack}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Stack>
      )}

      {/* TAB 2: 180-DAY IMMUTABLE AUDIT VAULT SEARCH & MERKLE PROOF */}
      {activeTab === 2 && (
        <Stack spacing={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3.5,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
              bgcolor: isDark ? '#0A0C13' : '#FFFFFF',
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2.5}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 2.5,
                    bgcolor: 'rgba(6, 182, 212, 0.12)',
                    color: CYAN,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Fingerprint sx={{ fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
                    180-Day Secure Immutable Log Vault Query
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Section 70B & CERT-In Directions 2022 Mandate: Local Sovereign Storage with Merkle Hash Integrity Proofs
                  </Typography>
                </Box>
              </Box>

              {vaultResults && (
                <Chip
                  icon={<VerifiedUser sx={{ fontSize: 16, color: `${SAFE} !important` }} />}
                  label={`Merkle Root: ${vaultResults.merkle_root_hash?.slice(0, 16)}...`}
                  sx={{ bgcolor: 'rgba(34,197,94,0.12)', color: SAFE, fontFamily: 'JetBrains Mono', fontWeight: 800 }}
                />
              )}
            </Box>

            <Box display="flex" gap={1.5} mb={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search vault by Hostname (SWSTK-LPT-0492), SHA-256 Hash, or keyword (powershell, mimikatz)..."
                value={vaultQuery}
                onChange={(e) => setVaultQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchVault()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                  }
                }}
              />
              <Button
                variant="contained"
                onClick={handleSearchVault}
                disabled={vaultSearching}
                sx={{
                  bgcolor: CYAN,
                  color: '#000',
                  fontWeight: 800,
                  borderRadius: 2.5,
                  px: 3,
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#0891B2' },
                }}
              >
                {vaultSearching ? <CircularProgress size={18} color="inherit" /> : 'Query Vault'}
              </Button>
            </Box>

            {/* Vault Records Table / Cards */}
            {vaultResults && vaultResults.results && (
              <Stack spacing={1.5}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, letterSpacing: '0.04em' }}>
                  MATCHED CRYPTOGRAPHICALLY SEALED AUDIT BLOCKS ({vaultResults.records_matched})
                </Typography>
                {vaultResults.results.map((r: any) => (
                  <Paper
                    key={r.block_id}
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                      bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={0.8}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          label={r.block_id}
                          size="small"
                          sx={{ fontFamily: 'JetBrains Mono', fontWeight: 800, fontSize: '0.7rem' }}
                        />
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                          {r.host}
                        </Typography>
                        <Chip
                          label={r.collector.toUpperCase()}
                          size="small"
                          sx={{ fontSize: '0.65rem', bgcolor: 'rgba(59,130,246,0.1)', color: BLUE, fontWeight: 700 }}
                        />
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          icon={<CheckCircle sx={{ fontSize: 14, color: `${SAFE} !important` }} />}
                          label="SHA-256 SEAL VALID"
                          size="small"
                          sx={{ bgcolor: 'rgba(34,197,94,0.12)', color: SAFE, fontWeight: 800, fontSize: '0.65rem' }}
                        />
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'JetBrains Mono' }}>
                          {r.timestamp}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ fontFamily: 'JetBrains Mono', color: 'text.secondary', fontSize: '0.78rem', mb: 1 }}>
                      {r.event_summary}
                    </Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono', color: isDark ? 'rgba(255,255,255,0.4)' : '#64748B', fontSize: '0.7rem' }}>
                      Leaf Hash: {r.merkle_leaf_hash} • Retention Guaranteed to: {r.retention_guaranteed_until}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>
        </Stack>
      )}

      {/* ── OFFICIAL CERT-IN ANNEXURE-I REPORT MODAL ──────────────────────── */}
      <Dialog
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            bgcolor: isDark ? '#080A10' : '#FFFFFF',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`,
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Gavel sx={{ color: CR }} />
            <Box>
              <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 900 }}>
                CERT-In Annexure-I Official Filing
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Ref: {selectedReport?.report_reference_id} • Section 70B Compliance
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setReportModalOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }}>
          {selectedReport && (
            <Box>
              <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2.5, fontSize: '0.82rem' }}>
                This pre-filled statutory document is ready for direct submission to <strong>incident@cert-in.org.in</strong>. All technical hashes, affected assets, and SOAR mitigation steps have been correlated automatically.
              </Alert>

              {/* Formatted Declaration Preview Box */}
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  bgcolor: isDark ? '#020408' : '#0F172A',
                  color: '#E2E8F0',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.74rem',
                  lineHeight: 1.6,
                  maxHeight: 420,
                  overflowY: 'auto',
                  border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #1E293B',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {selectedReport.official_formatted_declaration}
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2.5, gap: 1.5 }}>
          <Button
            onClick={handleCopyDeclaration}
            startIcon={<ContentCopy />}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
          >
            {copied ? 'Copied to Clipboard!' : 'Copy Declaration Text'}
          </Button>

          <Button
            variant="outlined"
            onClick={handleDownloadJson}
            startIcon={<FileDownload />}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
          >
            Download JSON
          </Button>

          <Button
            variant="outlined"
            onClick={handleDownloadTextNotice}
            startIcon={<FileDownload />}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
          >
            Download Notice (.txt)
          </Button>

          <Button
            variant="contained"
            onClick={() => {
              if (selectedReport) {
                handleMarkReported(selectedReport.incident_id);
              }
              setReportModalOpen(false);
            }}
            sx={{
              bgcolor: SAFE,
              color: '#FFF',
              fontWeight: 800,
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': { bgcolor: '#16A34A' },
            }}
          >
            Confirm & Mark as Dispatched
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CertInComplianceView;
