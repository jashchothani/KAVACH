import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, IconButton,
  Modal, Backdrop, Fade, Paper, Chip,
  Drawer, List, ListItem, ListItemButton, ListItemText
} from '@mui/material';
import {
  VolumeUp, VolumeOff, ArrowForward,
  Close, Terminal, Hub, Security, ChevronLeft, ChevronRight,
  Brightness4, Brightness7, Lock, Menu as MenuIcon, Close as CloseIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeMode } from '../../context/ThemeContext';
import { NoomoCrystalCanvas, ShowcaseProject } from '../../components/common/NoomoCrystalCanvas';

const SHOWCASE_PROJECTS: ShowcaseProject[] = [
  {
    id: '01',
    badge: 'KAVACH Endpoint Protection',
    category: 'Endpoint Shield',
    title: 'Continuous Endpoint Sentinel',
    subtitle: 'Autonomous Telemetry & Threat Isolation for Workstations & Servers',
    description: 'Real-time telemetry collection across process trees, network sockets, memory spaces, and system logs to immediately detect and isolate malicious activity before harm occurs.',
    color: '#DC2626', // KAVACH Crimson Red
    secondaryColor: '#991B1B',
    tags: ['Endpoint Protection', 'Process Telemetry', 'Zero-Day AI', 'Sub-12ms Response'],
    metrics: [
      { label: 'Sensor Coverage', val: '16 Collectors' },
      { label: 'Zero-Day Accuracy', val: '99.98%' },
      { label: 'Detection Speed', val: '< 1.2ms' },
    ],
    caseStudy: {
      overview: 'Engineered as a lightweight endpoint detection and response (EDR) telemetry agent, correlating host operating system kernel events, process parenting, and network socket activity.',
      architecture: [
        'Real-time process, socket, registry, and file integrity telemetry collectors',
        'Isolation Forest anomaly detector identifying unfamiliar execution deviations',
        'Deterministic rule engine mapping against known attack patterns and LOLBins',
        'Sub-12ms automated network and process containment daemon',
      ],
      threatVectors: ['Ransomware Encryption', 'Memory Injection', 'Process Masquerading', 'C2 Beaconing'],
      sampleLogs: [
        '[08:42:01.104] [PROCESS_COLLECTOR] Hooked process start (PID: 4920, exe: "svchost_updater.exe")',
        '[08:42:01.108] [ML_ANOMALY] Isolation Forest score: 0.94 -> ANOMALY_ALERT: UNUSUAL_PARENT_PROCESS',
        '[08:42:01.112] [DEFENSE_ACTION] Terminated unauthorized child process & isolated socket (Duration: 2.1ms)',
        '[08:42:01.116] [KAVACH_AUDIT] Incident INC-1049 cryptographically logged and sealed in audit vault',
      ],
    },
  },
  {
    id: '02',
    badge: 'Autonomous SOAR Engine',
    category: 'SOAR & Auto',
    title: 'Autonomous SOAR Matrix',
    subtitle: 'Sub-12ms Microsecond Automated Incident Containment',
    description: 'Pre-compiled deterministic response playbooks orchestrate automated IP null-routing, host NIC isolation, Active Directory session revocation, and RAM acquisition.',
    color: '#F59E0B', // Amber Gold
    secondaryColor: '#B45309',
    tags: ['Automation', 'DAG Playbooks', 'Sub-12ms', 'Null-Route'],
    metrics: [
      { label: 'Containment Time', val: '< 12ms' },
      { label: 'Active Playbooks', val: '52 Rules' },
      { label: 'False Positives', val: '< 0.001%' },
    ],
    caseStudy: {
      overview: 'Zero-human-delay containment pipeline executing directed acyclic graph (DAG) remediation trees with rollback and safe-mode failovers.',
      architecture: [
        'Asynchronous DAG playbook execution engine in Rust/Python',
        'Direct API integrations with Palo Alto, CrowdStrike, and Cloudflare',
        'Automated memory dump and volatile forensic artifact capture',
        'Continuous blast-radius simulation and risk scoring',
      ],
      threatVectors: ['LockBit Ransomware', 'Lateral SMB Pivots', 'Credential Spraying', 'Data Exfiltration'],
      sampleLogs: [
        '[08:42:05.210] [SOAR_POLL] Incident #INC-8902 received: LATERAL_SMB_BRUTE_FORCE',
        '[08:42:05.214] [DAG_EXEC] Executing Playbook: PB_LOCKDOWN_HOST_AND_QUARANTINE_VLAN',
        '[08:42:05.218] [NET_FIREWALL] Null-routed 192.168.10.84 on edge switch (took 4.1ms)',
        '[08:42:05.222] [IAM_REVOKE] Revoked Kerberos TGT & invalidated Azure AD tokens',
      ],
    },
  },
  {
    id: '03',
    badge: 'Synthetic Shield Protocol',
    category: 'AI Defense',
    title: 'Deepfake Synthetic Shield',
    subtitle: 'Spectral Audio & 60 FPS Video Impersonation Defense',
    description: 'Real-time FFT frequency spectrum analysis for VoIP calls and neural frame-artifact inspection defending executive channels against AI voice clones and deepfakes.',
    color: '#EC4899', // Cyber Pink
    secondaryColor: '#BE185D',
    tags: ['Voice Clone', 'FFT Spectral', '60 FPS', 'Anti-Vishing'],
    metrics: [
      { label: 'Audio Frequency', val: '48 kHz Scan' },
      { label: 'Voice Clone Acc', val: '99.4%' },
      { label: 'Frame Analysis', val: '60 FPS' },
    ],
    caseStudy: {
      overview: 'Defends corporate communications and executive teleconferences from generative AI voice cloning, biometric spoofing, and video stream injection.',
      architecture: [
        'Fast Fourier Transform (FFT) spectral harmonic analyzer',
        'Neural vocal tract biometric verification model',
        'High-speed temporal facial micro-expression detector',
        'SIP/VoIP in-line packet gateway with synthetic audio filtering',
      ],
      threatVectors: ['ElevenLabs Voice Clone', 'Deepfake Video Injection', 'CEO Vishing Fraud', 'Biometric Spoofing'],
      sampleLogs: [
        '[08:42:10.002] [VOIP_SIP] Inbound SIP stream received (Caller ID: CEO_DIRECT_LINE)',
        '[08:42:10.015] [FFT_SCAN] Spectral anomaly: Artificial frequency cutoff at 16kHz',
        '[08:42:10.022] [AI_SHIELD] CONFIRMED: Synthetic Neural Voice Clone (Confidence: 99.7%)',
        '[08:42:10.025] [GATEWAY] Terminated call & broadcasted executive security alert',
      ],
    },
  },
  {
    id: '04',
    badge: 'MITRE ATT&CK Matrix v14',
    category: 'Threat Intel',
    title: 'MITRE Matrix Threat Map',
    subtitle: 'Graph Correlation Across 200+ Adversary Tactics & TTPs',
    description: 'Dynamic mapping of IOCs against enterprise techniques, adversary profiles, and STIX/TAXII feeds to pinpoint threat actor progression in real time.',
    color: '#8B5CF6', // Cyber Purple
    secondaryColor: '#6D28D9',
    tags: ['STIX/TAXII', '200+ TTPs', 'APT Intel', 'Graph Engine'],
    metrics: [
      { label: 'Tactics Tracked', val: '14 Tactics' },
      { label: 'Adversary Groups', val: '140+ APTs' },
      { label: 'Graph Resolution', val: '< 5ms' },
    ],
    caseStudy: {
      overview: 'Interactive multidimensional MITRE ATT&CK correlation matrix giving SOC analysts immediate visibility into adversary tactics, techniques, and procedures.',
      architecture: [
        'High-speed directed property graph engine for kill-chain mapping',
        'Automated threat intelligence ingestion via STIX 2.1 & TAXII feeds',
        'Adversary behavioral signature match against APT28, APT29, Lazarus',
        'Predictive next-hop tactic forecasting using Markov chain models',
      ],
      threatVectors: ['T1059 Command & Scripting', 'T1003 OS Credential Dumping', 'T1021 Lateral Movement', 'T1048 Exfiltration'],
      sampleLogs: [
        '[08:42:14.331] [INTEL_FEED] Ingested 1,420 new IOC hashes from US-CERT TAXII feed',
        '[08:42:14.340] [GRAPH_MATCH] Correlated T1059.001 (PowerShell) -> Target: DB_SERVER_01',
        '[08:42:14.346] [KILL_CHAIN] Adversary at Stage 4: Privilege Escalation (APT28 profile)',
        '[08:42:14.352] [RECOMMEND] Activated automated mitigation: Disable Remote WMI',
      ],
    },
  },
  {
    id: '05',
    badge: 'SCADA & OT Industrial Shield',
    category: 'OT & ICS',
    title: 'SCADA / OT Grid Defense',
    subtitle: 'Deterministic Deep Packet Inspection for Power Grids & ICS',
    description: 'Air-gapped and industrial protocol analysis defending Modbus TCP, DNP3, and IEC-104 telemetry against unauthorized PLC register overwrites and grid attacks.',
    color: '#10B981', // Emerald
    secondaryColor: '#047857',
    tags: ['Modbus TCP', 'IEC-104', 'Air-Gapped', 'Zero-Trust'],
    metrics: [
      { label: 'Protocol Scan', val: 'Modbus/DNP3' },
      { label: 'PLC Latency', val: '0.4ms' },
      { label: 'Grid Uptime', val: '99.999%' },
    ],
    caseStudy: {
      overview: 'Protects critical energy infrastructure, manufacturing plants, and SCADA systems through deterministic stateful inspection of industrial control commands.',
      architecture: [
        'Passive wire-speed deep packet inspection for Modbus, DNP3, Profinet',
        'Strict whitelist state-machine for PLC holding register modifications',
        'Out-of-band serial tap sensors for legacy air-gapped substations',
        'Automated emergency safe-state failover for substation protection',
      ],
      threatVectors: ['Stuxnet-Style PLC Overwrite', 'Industroyer2 Blackout', 'Modbus Coil Injection', 'Unauthorized Firmware Flash'],
      sampleLogs: [
        '[08:42:18.910] [SCADA_DPI] Monitored Frame on Port 502 (Modbus TCP / Substation #4)',
        '[08:42:18.914] [PLC_GUARD] Anomaly: Function Code 0x05 (Write Single Coil) to reserved address 0x1FA0',
        '[08:42:18.918] [POLICY_VIOLATION] Unauthorized command dropped at Industrial Gateway',
        '[08:42:18.922] [ALERT] Grid safety interlocks engaged; dispatching OT field ticket',
      ],
    },
  },
  {
    id: '06',
    badge: 'Quantum Immutable Audit Vault',
    category: 'On-Chain Audit',
    title: 'Decentralized Audit Vault',
    subtitle: 'Zero-Knowledge Merkle Tree Forensic Verification',
    description: 'Cryptographic log hashing, decentralized ledger anchoring, and zero-knowledge proofs ensuring forensic tamper-proof audit trails for global compliance.',
    color: '#E63946', // Crimson Red
    secondaryColor: '#9B111E',
    tags: ['On-Chain', 'Merkle Tree', 'Zero-Knowledge', 'SOC2 Compliant'],
    metrics: [
      { label: 'Proof Time', val: '180ms' },
      { label: 'Chain Finality', val: 'Instant' },
      { label: 'Integrity Seal', val: 'SHA3-256' },
    ],
    caseStudy: {
      overview: 'Guarantees legal admissibility and complete non-repudiation of SOC audit trails by anchoring Merkle state roots onto a high-throughput immutable decentralized ledger.',
      architecture: [
        'Hierarchical SHA3-256 Merkle tree log aggregation engine',
        'Zero-knowledge SNARK proof generation for compliance verification without data disclosure',
        'Decentralized consensus anchoring on permissioned enterprise nodes',
        'Cryptographic audit trail validator with instant public verification',
      ],
      threatVectors: ['Log Tampering', 'Insider Malice', 'Audit Trail Deletion', 'Legal Disavowal'],
      sampleLogs: [
        '[08:42:22.501] [AUDIT_BATCH] Merkle Tree batch created: 10,000 security logs hashed',
        '[08:42:22.509] [ZK_PROVER] Generated ZK-SNARK compliance proof: 0x88e7...b941',
        '[08:42:22.515] [BLOCK_COMMIT] Anchored Root Hash: 0x3d4a8f9c2e0b... on Block #4,198,022',
        '[08:42:22.518] [VERIFIED] Cryptographic seal validated: 100% Tamper-Proof',
      ],
    },
  },
];

const CATEGORIES = ['All Projects', 'AI Defense', 'SOAR & Auto', 'Threat Intel', 'OT & ICS', 'On-Chain Audit'];

export const Showcase: React.FC = () => {
  const navigate = useNavigate();
  const { mode, toggleTheme } = useThemeMode();
  const isDark = mode === 'dark';

  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All Projects');
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [isCaseStudyOpen, setIsCaseStudyOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Current active project
  const currentProject = SHOWCASE_PROJECTS[activeIndex] || SHOWCASE_PROJECTS[0];

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % SHOWCASE_PROJECTS.length);
  }, []);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + SHOWCASE_PROJECTS.length) % SHOWCASE_PROJECTS.length);
  }, []);

  // Keyboard Arrow Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCaseStudyOpen) {
        if (e.key === 'Escape') setIsCaseStudyOpen(false);
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, isCaseStudyOpen]);

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    if (cat !== 'All Projects') {
      const matchIndex = SHOWCASE_PROJECTS.findIndex((p) => p.category === cat);
      if (matchIndex !== -1) setActiveIndex(matchIndex);
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        bgcolor: isDark ? '#04050E' : '#F1F5F9',
        color: isDark ? '#FFFFFF' : '#0F172A',
        fontFamily: '"Space Grotesk", "Outfit", sans-serif',
        userSelect: 'none',
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      {/* 1. 3D WebGL Crystal Hero Canvas */}
      <NoomoCrystalCanvas
        projects={SHOWCASE_PROJECTS}
        activeIndex={activeIndex}
        onSelectProject={setActiveIndex}
        onClickCrystal={() => setIsCaseStudyOpen(true)}
        isAudioMuted={isAudioMuted}
        isDark={isDark}
      />

      {/* 2. Unified Floating Intelligent Capsule Navigation Bar (Navbar parity across all pages) */}
      <Box
        component={motion.header}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          pt: { xs: 1.5, md: 2 },
          px: { xs: 2, md: 3 },
          pointerEvents: 'none',
        }}
      >
        <Box
          sx={{
            maxWidth: 1080,
            mx: 'auto',
            pointerEvents: 'auto',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            bgcolor: isDark ? 'rgba(11, 11, 15, 0.82)' : 'rgba(255, 255, 255, 0.88)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(11, 11, 15, 0.1)',
            borderRadius: '100px',
            boxShadow: isDark
              ? '0 12px 36px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.04)'
              : '0 12px 32px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.04)',
            px: { xs: 2, sm: 2.5, md: 3 },
            py: 0.75,
          }}
        >
          <Box
            sx={{
              display: 'flex !important',
              flexDirection: 'row !important',
              alignItems: 'center !important',
              justifyContent: 'space-between !important',
              flexWrap: 'nowrap !important',
              width: '100%',
              minHeight: 40,
            }}
          >
            {/* Left: Official KAVACH Logo + Live Pulse */}
            <Box
              onClick={() => navigate('/')}
              sx={{
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                flexShrink: 0,
                whiteSpace: 'nowrap',
                userSelect: 'none',
                mr: 2,
              }}
            >
              <Box
                component="img"
                src="/kavach-logo-transparent.png"
                alt="KAVACH"
                onError={(e: any) => { e.currentTarget.src = '/kavach-logo.png'; }}
                sx={{ height: 28, width: 'auto', filter: 'drop-shadow(0 0 8px rgba(220,38,38,0.5))' }}
              />
              <Typography
                variant="h6"
                sx={{
                  ml: 1.2,
                  fontWeight: 900,
                  fontFamily: 'Outfit, sans-serif',
                  color: isDark ? '#FFFFFF' : '#0B0B0F',
                  letterSpacing: '0.06em',
                  fontSize: '1.05rem',
                  lineHeight: 1,
                }}
              >
                KAVACH
              </Typography>
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: '#22C55E',
                  boxShadow: '0 0 8px #22C55E',
                  ml: 1.2,
                  display: { xs: 'none', sm: 'block' },
                }}
              />
            </Box>

            {/* Center Navigation Links (Desktop only) */}
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                flexGrow: 1,
                flexShrink: 0,
                gap: 0.5,
                whiteSpace: 'nowrap',
              }}
            >
              {[
                { label: 'Protection', path: '/#protection' },
                { label: 'Intelligence', path: '/#intelligence' },
                { label: 'Raksha AI', path: '/#raksha-ai' },
                { label: 'Platform', path: '/#platform' },
                { label: 'About', path: '/about' },
              ].map((link) => (
                <Button
                  key={link.label}
                  onClick={() => navigate(link.path)}
                  disableRipple
                  sx={{
                    color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(11, 11, 15, 0.7)',
                    fontWeight: 500,
                    fontSize: '0.82rem',
                    px: { md: 1.4, lg: 1.8 },
                    py: 0.5,
                    borderRadius: '100px',
                    '&:hover': {
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(11, 11, 15, 0.05)',
                      color: isDark ? '#FFFFFF' : '#0B0B0F',
                    },
                    textTransform: 'none',
                    transition: 'all 0.18s ease',
                    whiteSpace: 'nowrap',
                    minWidth: 'auto',
                  }}
                >
                  {link.label}
                </Button>
              ))}

              {/* Showcase Active Status Badge */}
              <Chip
                label="3D Showcase"
                size="small"
                sx={{
                  bgcolor: isDark ? 'rgba(220, 38, 38, 0.2)' : 'rgba(220, 38, 38, 0.1)',
                  color: '#DC2626',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  border: '1px solid rgba(220, 38, 38, 0.4)',
                  height: 24,
                  ml: 0.5,
                }}
              />
            </Box>

            {/* Right: Sound Toggle + Light/Dark Mode + Login Button */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                flexShrink: 0,
                whiteSpace: 'nowrap',
                gap: 1,
              }}
            >
              {/* Sound Synthesizer Toggle */}
              <IconButton
                onClick={() => setIsAudioMuted(!isAudioMuted)}
                size="small"
                aria-label="Toggle sound synth"
                sx={{
                  color: isDark ? '#FFFFFF' : '#0B0B0F',
                  bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(11,11,15,0.04)',
                  p: 0.7,
                  borderRadius: '50%',
                  '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(11,11,15,0.08)' },
                }}
              >
                {isAudioMuted ? <VolumeOff sx={{ fontSize: 18 }} /> : <VolumeUp sx={{ fontSize: 18, color: '#38BDF8' }} />}
              </IconButton>

              {/* Light/Dark Toggle */}
              <IconButton
                onClick={toggleTheme}
                size="small"
                aria-label="toggle light/dark theme"
                sx={{
                  color: isDark ? '#FFFFFF' : '#0B0B0F',
                  bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(11,11,15,0.04)',
                  p: 0.7,
                  borderRadius: '50%',
                  '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(11,11,15,0.08)' },
                }}
              >
                {isDark ? <Brightness7 sx={{ fontSize: 18, color: '#F59E0B' }} /> : <Brightness4 sx={{ fontSize: 18, color: '#3B82F6' }} />}
              </IconButton>

              {/* Login Button */}
              <Button
                variant="outlined"
                onClick={() => navigate('/login')}
                startIcon={<Lock sx={{ fontSize: 14 }} />}
                sx={{
                  display: { xs: 'none', sm: 'inline-flex' },
                  color: isDark ? '#FFFFFF' : '#0B0B0F',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(11, 11, 15, 0.2)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  px: 1.6,
                  py: 0.5,
                  borderRadius: '100px',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    borderColor: '#DC2626',
                    bgcolor: isDark ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.05)',
                  },
                  textTransform: 'none',
                }}
              >
                Login
              </Button>

              {/* Mobile Drawer Toggle */}
              <IconButton
                onClick={() => setMobileOpen(true)}
                sx={{
                  display: { md: 'none' },
                  color: isDark ? '#FFFFFF' : '#0B0B0F',
                  p: 0.8,
                  bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(11,11,15,0.05)',
                  borderRadius: '50%',
                }}
              >
                <MenuIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Category Filter Selector Sub-Bar */}
      <Box
        sx={{
          position: 'absolute',
          top: { xs: 68, md: 78 },
          left: 0,
          right: 0,
          zIndex: 100,
          display: 'flex',
          justifyContent: 'center',
          px: 2,
          pointerEvents: 'none',
        }}
      >
        <Box
          sx={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 0.6,
            borderRadius: '100px',
            bgcolor: isDark ? 'rgba(15, 17, 28, 0.75)' : 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(16px)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(15, 23, 42, 0.1)',
            boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 6px 20px rgba(15, 23, 42, 0.06)',
            overflowX: 'auto',
            maxWidth: '100%',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <Chip
                key={cat}
                label={cat}
                size="small"
                onClick={() => handleCategorySelect(cat)}
                sx={{
                  cursor: 'pointer',
                  fontWeight: isSelected ? 800 : 500,
                  fontSize: '0.78rem',
                  px: 0.8,
                  borderRadius: '100px',
                  bgcolor: isSelected ? '#DC2626' : 'transparent',
                  color: isSelected ? '#FFFFFF' : (isDark ? 'rgba(255, 255, 255, 0.75)' : '#475569'),
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: isSelected ? '#B91C1C' : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.06)'),
                    color: isDark ? '#FFFFFF' : '#0F172A',
                  },
                }}
              />
            );
          })}
        </Box>
      </Box>

      {/* 3. Bottom Hero Interface (Left Project Info + Center Pagination + Right Overview & Tags) */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', md: 'flex-end' },
          px: { xs: 2.5, sm: 4, md: 6 },
          pb: { xs: 2.5, sm: 3.5, md: 4.5 },
          gap: { xs: 2, md: 0 },
          pointerEvents: 'none',
          background: {
            xs: isDark
              ? 'linear-gradient(to top, rgba(4, 5, 14, 0.95) 0%, rgba(4, 5, 14, 0.75) 70%, transparent 100%)'
              : 'linear-gradient(to top, rgba(241, 245, 249, 0.98) 0%, rgba(241, 245, 249, 0.82) 70%, transparent 100%)',
            md: 'none',
          },
          pt: { xs: 4, md: 0 },
        }}
      >
        {/* Bottom Left: Project Header & High-Contrast VIEW CASE STUDY Button */}
        <Box sx={{ pointerEvents: 'auto', maxWidth: { xs: '100%', md: 450 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.6 }}>
            <Typography
              sx={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '0.8rem',
                color: isDark ? 'rgba(255, 255, 255, 0.65)' : '#64748B',
                letterSpacing: '0.04em',
                fontWeight: 600,
              }}
            >
              Project {currentProject.id}
            </Typography>
            <Chip
              label={currentProject.category}
              size="small"
              sx={{
                backgroundColor: `${currentProject.color}${isDark ? '22' : '15'}`,
                color: currentProject.color,
                border: `1px solid ${currentProject.color}${isDark ? '50' : '40'}`,
                fontSize: '0.68rem',
                fontWeight: 700,
                height: 20,
              }}
            />
          </Box>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentProject.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <Typography
                sx={{
                  fontFamily: '"Outfit", "Space Grotesk", sans-serif',
                  fontWeight: 800,
                  fontSize: { xs: '1.45rem', sm: '1.85rem', md: '2.4rem' },
                  letterSpacing: '-0.02em',
                  lineHeight: 1.15,
                  color: isDark ? '#FFFFFF' : '#0F172A',
                  mb: { xs: 1.5, md: 2 },
                }}
              >
                {currentProject.title}
              </Typography>
            </motion.div>
          </AnimatePresence>

          {/* Electric Project Color VIEW CASE STUDY Button */}
          <Button
            variant="contained"
            onClick={() => setIsCaseStudyOpen(true)}
            sx={{
              backgroundColor: currentProject.color,
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: { xs: '0.8rem', md: '0.88rem' },
              letterSpacing: '0.06em',
              px: { xs: 2.5, md: 3.2 },
              py: { xs: 0.9, md: 1.1 },
              borderRadius: '6px',
              textTransform: 'uppercase',
              boxShadow: `0 4px 20px ${currentProject.color}50`,
              transition: 'all 0.25s ease',
              '&:hover': {
                backgroundColor: currentProject.secondaryColor,
                boxShadow: `0 6px 28px ${currentProject.color}80`,
                transform: 'translateY(-1px)',
              },
            }}
          >
            VIEW CASE STUDY
          </Button>
        </Box>

        {/* Bottom Center: Slide Pagination Controls */}
        <Box
          sx={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: { xs: 'space-between', md: 'center' },
            gap: 2,
            alignSelf: { xs: 'stretch', md: 'flex-end' },
            mb: { xs: 0, md: 1 },
          }}
        >
          <IconButton
            onClick={handlePrev}
            aria-label="Previous project"
            sx={{
              color: isDark ? '#FFFFFF' : '#0F172A',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(15, 23, 42, 0.15)',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              borderRadius: '50%',
              width: 40,
              height: 40,
              boxShadow: isDark ? 'none' : '0 2px 8px rgba(15, 23, 42, 0.08)',
              transition: 'all 0.2s ease',
              '&:hover': {
                color: isDark ? '#FFFFFF' : '#DC2626',
                borderColor: '#DC2626',
                transform: 'scale(1.06)',
              },
            }}
          >
            <ChevronLeft />
          </IconButton>

          <Typography
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: isDark ? 'rgba(255, 255, 255, 0.85)' : '#0F172A',
            }}
          >
            {currentProject.id} / 0{SHOWCASE_PROJECTS.length}
          </Typography>

          <IconButton
            onClick={handleNext}
            aria-label="Next project"
            sx={{
              color: isDark ? '#FFFFFF' : '#0F172A',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(15, 23, 42, 0.15)',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              borderRadius: '50%',
              width: 40,
              height: 40,
              boxShadow: isDark ? 'none' : '0 2px 8px rgba(15, 23, 42, 0.08)',
              transition: 'all 0.2s ease',
              '&:hover': {
                color: isDark ? '#FFFFFF' : '#DC2626',
                borderColor: '#DC2626',
                transform: 'scale(1.06)',
              },
            }}
          >
            <ChevronRight />
          </IconButton>
        </Box>

        {/* Bottom Right: Info Header, Summary & Tag Badges */}
        <Box
          sx={{
            pointerEvents: 'auto',
            maxWidth: { xs: '100%', md: 460 },
            display: { xs: 'none', sm: 'block' },
          }}
        >
          <Typography
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.8rem',
              color: isDark ? 'rgba(255, 255, 255, 0.65)' : '#64748B',
              mb: 0.6,
              letterSpacing: '0.04em',
              fontWeight: 600,
            }}
          >
            System Telemetry Overview
          </Typography>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentProject.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <Typography
                sx={{
                  fontFamily: '"Space Grotesk", "Inter", sans-serif',
                  fontSize: { xs: '0.82rem', md: '0.92rem' },
                  color: isDark ? 'rgba(255, 255, 255, 0.85)' : '#334155',
                  lineHeight: 1.55,
                  mb: 1.5,
                }}
              >
                {currentProject.description}
              </Typography>

              {/* Tag Pill Badges */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                {currentProject.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    sx={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.9)',
                      color: isDark ? '#FFFFFF' : '#1E293B',
                      borderRadius: '16px',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.18)' : '1px solid rgba(15, 23, 42, 0.12)',
                      fontSize: '0.72rem',
                      fontFamily: '"Space Grotesk", sans-serif',
                      fontWeight: 600,
                      backdropFilter: 'blur(8px)',
                      boxShadow: isDark ? 'none' : '0 1px 4px rgba(15, 23, 42, 0.04)',
                      '&:hover': {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.18)' : '#F1F5F9',
                      },
                    }}
                  />
                ))}
              </Box>
            </motion.div>
          </AnimatePresence>
        </Box>
      </Box>

      {/* 4. Fullscreen Interactive Cyber Case Study Modal */}
      <Modal
        open={isCaseStudyOpen}
        onClose={() => setIsCaseStudyOpen(false)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 300,
            sx: {
              backgroundColor: isDark ? 'rgba(4, 5, 14, 0.88)' : 'rgba(15, 23, 42, 0.5)',
              backdropFilter: 'blur(16px)',
            },
          },
        }}
      >
        <Fade in={isCaseStudyOpen}>
          <Paper
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '94vw', sm: '88vw', md: '75vw', lg: '65vw' },
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: isDark ? '#0a0d1d' : '#FFFFFF',
              border: `1px solid ${currentProject.color}${isDark ? '50' : '40'}`,
              boxShadow: isDark
                ? `0 0 50px ${currentProject.color}35`
                : `0 20px 60px rgba(15, 23, 42, 0.18), 0 0 40px ${currentProject.color}25`,
              borderRadius: 3,
              p: { xs: 2.5, sm: 3.5, md: 5 },
              color: isDark ? '#FFFFFF' : '#0F172A',
              outline: 'none',
            }}
          >
            {/* Modal Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box>
                <Chip
                  label={currentProject.badge}
                  sx={{
                    backgroundColor: `${currentProject.color}${isDark ? '25' : '15'}`,
                    color: currentProject.color,
                    border: `1px solid ${currentProject.color}60`,
                    fontWeight: 700,
                    mb: 1.5,
                  }}
                />
                <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: '1.6rem', sm: '2rem', md: '2.4rem' }, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                  {currentProject.title}
                </Typography>
                <Typography sx={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748B', mt: 0.5, fontSize: { xs: '0.88rem', md: '1rem' } }}>
                  {currentProject.subtitle}
                </Typography>
              </Box>

              <IconButton
                onClick={() => setIsCaseStudyOpen(false)}
                aria-label="Close modal"
                sx={{
                  color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748B',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.05)',
                  '&:hover': { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(15, 23, 42, 0.1)', color: isDark ? '#FFFFFF' : '#0F172A' },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Metrics Row */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                gap: 2,
                mb: 4,
              }}
            >
              {currentProject.metrics.map((m) => (
                <Paper
                  key={m.label}
                  sx={{
                    p: 2.5,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="caption" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.55)' : '#64748B', fontWeight: 600 }}>
                    {m.label}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: currentProject.color, mt: 0.5 }}>
                    {m.val}
                  </Typography>
                </Paper>
              ))}
            </Box>

            {/* Architecture Highlights */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                <Hub sx={{ color: currentProject.color }} /> System Architecture & Execution Flow
              </Typography>
              <Box sx={{ pl: 2, borderLeft: `2px solid ${currentProject.color}40` }}>
                {currentProject.caseStudy.architecture.map((item, idx) => (
                  <Typography key={idx} sx={{ color: isDark ? 'rgba(255, 255, 255, 0.85)' : '#334155', mb: 1, fontSize: '0.95rem' }}>
                    • {item}
                  </Typography>
                ))}
              </Box>
            </Box>

            {/* Threat Vectors Mitigated */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                <Security sx={{ color: currentProject.color }} /> Neutralized Attack Vectors
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {currentProject.caseStudy.threatVectors.map((v) => (
                  <Chip
                    key={v}
                    label={v}
                    sx={{
                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                      color: '#DC2626',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      fontWeight: 600,
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Live Telemetry Log Trace */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                <Terminal sx={{ color: currentProject.color }} /> Real-time Kernel & Audit Telemetry Log
              </Typography>
              <Box
                sx={{
                  backgroundColor: '#05070e',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #334155',
                  borderRadius: 2,
                  p: 2,
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.85rem',
                  lineHeight: 1.7,
                  color: '#93C5FD',
                  overflowX: 'auto',
                }}
              >
                {currentProject.caseStudy.sampleLogs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </Box>
            </Box>

            {/* Footer Action */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2, borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0' }}>
              <Button
                variant="outlined"
                onClick={() => setIsCaseStudyOpen(false)}
                sx={{ color: isDark ? '#FFFFFF' : '#0F172A', borderColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(15, 23, 42, 0.25)' }}
              >
                Close Case Study
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/login')}
                sx={{
                  backgroundColor: currentProject.color,
                  color: '#FFFFFF',
                  fontWeight: 700,
                  '&:hover': {
                    backgroundColor: currentProject.secondaryColor,
                  },
                }}
              >
                Deploy in SOC Console
              </Button>
            </Box>
          </Paper>
        </Fade>
      </Modal>

      {/* 5. Mobile Navigation Drawer (Parity with PublicLayout) */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: 320,
            bgcolor: isDark ? '#0B0B0F' : '#FFFFFF',
            color: isDark ? '#FFFFFF' : '#0B0B0F',
            p: 3,
          },
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box display="flex" alignItems="center">
            <Box
              component="img"
              src="/kavach-logo-transparent.png"
              alt="KAVACH"
              onError={(e: any) => { e.currentTarget.src = '/kavach-logo.png'; }}
              sx={{ height: 28, width: 'auto' }}
            />
            <Typography variant="h6" sx={{ ml: 1.5, fontWeight: 900, fontFamily: 'Outfit, sans-serif' }}>
              KAVACH
            </Typography>
          </Box>
          <IconButton onClick={() => setMobileOpen(false)} sx={{ color: isDark ? '#FFFFFF' : '#0B0B0F' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <List sx={{ flexGrow: 1 }}>
          {[
            { label: 'Home', path: '/' },
            { label: 'Protection', path: '/#protection' },
            { label: 'Intelligence', path: '/#intelligence' },
            { label: 'Raksha AI', path: '/#raksha-ai' },
            { label: 'Platform', path: '/#platform' },
            { label: 'About', path: '/about' },
            { label: 'Contact', path: '/contact' },
            { label: 'Privacy Policy', path: '/privacy' },
            { label: 'Terms of Service', path: '/terms' },
          ].map((link) => (
            <ListItem key={link.label} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => { setMobileOpen(false); navigate(link.path); }}
                sx={{
                  borderRadius: 2,
                  py: 1.2,
                  '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(11,11,15,0.05)' },
                }}
              >
                <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', fontFamily: 'Outfit, sans-serif' }}>
                  {link.label}
                </Typography>
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Box sx={{ mt: 'auto', pt: 2 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => { setMobileOpen(false); navigate('/login'); }}
            sx={{
              bgcolor: '#DC2626',
              color: '#FFFFFF',
              fontWeight: 800,
              py: 1.5,
              borderRadius: 3,
              textTransform: 'none',
              '&:hover': { bgcolor: '#B91C1C' },
            }}
          >
            Open SOC Console
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
};
export default Showcase;
