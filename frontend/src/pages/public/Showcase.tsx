import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, IconButton,
  Modal, Backdrop, Fade, Paper, Chip
} from '@mui/material';
import {
  VolumeUp, VolumeOff, ArrowForward,
  Close, Terminal, Hub, Security, ChevronLeft, ChevronRight
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { NoomoCrystalCanvas, ShowcaseProject } from '../../components/common/NoomoCrystalCanvas';

const SHOWCASE_PROJECTS: ShowcaseProject[] = [
  {
    id: '01',
    badge: 'Coinbase & Warriors activation',
    category: 'AI Defense',
    title: 'Coinbase x Warriors',
    subtitle: 'Neural XDR & Next-Gen Threat Telemetry Correlator',
    description: 'A mobile-first collectible experience built for game-day energy, blending motion, storytelling, and seamless on-chain telemetry for real-time cyber defense.',
    color: '#3B82F6', // Electric Blue
    secondaryColor: '#1D4ED8',
    tags: ['Sports', 'Brand activation', '3D', 'On-chain'],
    metrics: [
      { label: 'Ingestion Speed', val: '2.4M eps' },
      { label: 'Zero-Day Accuracy', val: '99.98%' },
      { label: 'Model Latency', val: '1.2ms' },
    ],
    caseStudy: {
      overview: 'Engineered as a hybrid neural SIEM/XDR telemetry bridge, correlating distributed OS kernel syscalls and memory allocation routines across multi-cloud clusters.',
      architecture: [
        'eBPF kernel-level event streaming sensor at 2.4M ops/sec',
        'Transformer-based zero-day anomaly detection engine',
        'Hardware-accelerated cryptographic packet validator',
        'Real-time automated endpoint containment daemon',
      ],
      threatVectors: ['Kernel Rootkits', 'Memory Injection', 'Zero-Day RCE', 'DNS Tunneling'],
      sampleLogs: [
        '[08:42:01.104] [eBPF_INGEST] Hooked sys_enter_execve (PID: 4920, comm: "svc_runner")',
        '[08:42:01.108] [NEURAL_CORE] Anomaly score: 0.9984 -> HEURISTIC_MATCH: APT29_PAYLOAD',
        '[08:42:01.112] [SOAR_TRIGGER] Dispatched ISOLATE_NIC command to host node (Duration: 1.4ms)',
        '[08:42:01.116] [MERKLE_LOG] Anchored forensic SHA-256 state tree to audit ledger',
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

  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All Projects');
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [isCaseStudyOpen, setIsCaseStudyOpen] = useState(false);

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
        backgroundColor: '#04050e',
        color: '#FFFFFF',
        fontFamily: '"Space Grotesk", "Outfit", sans-serif',
        userSelect: 'none',
      }}
    >
      {/* 1. 3D WebGL Crystal Hero Canvas */}
      <NoomoCrystalCanvas
        projects={SHOWCASE_PROJECTS}
        activeIndex={activeIndex}
        onSelectProject={setActiveIndex}
        onClickCrystal={() => setIsCaseStudyOpen(true)}
        isAudioMuted={isAudioMuted}
      />

      {/* 2. Top Header Bar */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          px: { xs: 2, md: 5 },
          pt: { xs: 2, md: 3 },
          pb: 1,
          pointerEvents: 'none',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          {/* Brand Logo with Signature Script */}
          <Box
            onClick={() => navigate('/')}
            sx={{
              pointerEvents: 'auto',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'baseline',
              gap: 0.8,
            }}
          >
            <Typography
              sx={{
                fontFamily: '"Outfit", "Syne", sans-serif',
                fontWeight: 800,
                fontSize: { xs: '1.3rem', md: '1.65rem' },
                letterSpacing: '-0.03em',
                color: '#FFFFFF',
              }}
            >
              kavach.
            </Typography>
            <Typography
              sx={{
                fontFamily: '"Caveat", cursive',
                fontSize: { xs: '1.35rem', md: '1.8rem' },
                fontWeight: 700,
                color: '#93C5FD',
                transform: 'rotate(-4deg)',
              }}
            >
              Showcase
            </Typography>
          </Box>

          {/* Desktop Category Filter Tabs */}
          <Box
            sx={{
              pointerEvents: 'auto',
              display: { xs: 'none', lg: 'flex' },
              alignItems: 'center',
              gap: 3.5,
            }}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <Typography
                  key={cat}
                  onClick={() => handleCategorySelect(cat)}
                  sx={{
                    fontFamily: '"Space Grotesk", sans-serif',
                    fontSize: '0.9rem',
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.55)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      color: '#FFFFFF',
                    },
                    '&::after': isSelected
                      ? {
                          content: '""',
                          position: 'absolute',
                          bottom: -4,
                          left: 0,
                          right: 0,
                          height: '2px',
                          backgroundColor: '#3B82F6',
                          borderRadius: '2px',
                        }
                      : {},
                  }}
                >
                  {cat}
                </Typography>
              );
            })}
          </Box>

          {/* Top Right Controls (Sound & CTA) */}
          <Box sx={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Audio Toggle Button */}
            <IconButton
              onClick={() => setIsAudioMuted(!isAudioMuted)}
              aria-label="Toggle sound"
              sx={{
                backgroundColor: 'rgba(30, 58, 138, 0.85)',
                color: '#FFFFFF',
                width: 36,
                height: 36,
                borderRadius: '8px',
                border: '1px solid rgba(59, 130, 246, 0.5)',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: '#2563EB',
                  transform: 'scale(1.05)',
                },
              }}
            >
              {isAudioMuted ? <VolumeOff sx={{ fontSize: 17 }} /> : <VolumeUp sx={{ fontSize: 17 }} />}
            </IconButton>

            {/* Launch Platform Button */}
            <Button
              variant="outlined"
              onClick={() => navigate('/login')}
              endIcon={<ArrowForward sx={{ fontSize: 15 }} />}
              sx={{
                color: '#FFFFFF',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                px: { xs: 1.6, md: 2.2 },
                py: 0.7,
                fontSize: { xs: '0.78rem', md: '0.85rem' },
                fontWeight: 600,
                textTransform: 'none',
                backdropFilter: 'blur(8px)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                transition: 'all 0.25s ease',
                '&:hover': {
                  borderColor: '#FFFFFF',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              Console
            </Button>
          </Box>
        </Box>

        {/* Mobile & Tablet Category Filter Chip Carousel */}
        <Box
          sx={{
            pointerEvents: 'auto',
            display: { xs: 'flex', lg: 'none' },
            overflowX: 'auto',
            gap: 1,
            py: 0.5,
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
                  backgroundColor: isSelected ? '#2563EB' : 'rgba(255, 255, 255, 0.06)',
                  color: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
                  border: isSelected ? '1px solid #60A5FA' : '1px solid rgba(255, 255, 255, 0.12)',
                  fontSize: '0.75rem',
                  fontWeight: isSelected ? 700 : 500,
                  backdropFilter: 'blur(6px)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  '&:hover': {
                    backgroundColor: isSelected ? '#1D4ED8' : 'rgba(255, 255, 255, 0.12)',
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
            xs: 'linear-gradient(to top, rgba(4, 5, 14, 0.95) 0%, rgba(4, 5, 14, 0.75) 70%, transparent 100%)',
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
                color: 'rgba(255, 255, 255, 0.65)',
                letterSpacing: '0.04em',
              }}
            >
              Project {currentProject.id}
            </Typography>
            <Chip
              label={currentProject.category}
              size="small"
              sx={{
                backgroundColor: `${currentProject.color}22`,
                color: currentProject.color,
                border: `1px solid ${currentProject.color}50`,
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
                  color: '#FFFFFF',
                  mb: { xs: 1.5, md: 2 },
                }}
              >
                {currentProject.title}
              </Typography>
            </motion.div>
          </AnimatePresence>

          {/* Electric Blue VIEW CASE STUDY Button */}
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
              borderRadius: '4px',
              textTransform: 'uppercase',
              boxShadow: `0 0 24px ${currentProject.color}60`,
              transition: 'all 0.25s ease',
              '&:hover': {
                backgroundColor: currentProject.secondaryColor,
                boxShadow: `0 0 35px ${currentProject.color}90`,
                transform: 'scale(1.02)',
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
              color: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(8px)',
              borderRadius: '50%',
              width: 38,
              height: 38,
              transition: 'all 0.2s ease',
              '&:hover': {
                color: '#FFFFFF',
                borderColor: '#FFFFFF',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                transform: 'scale(1.05)',
              },
            }}
          >
            <ChevronLeft />
          </IconButton>

          <Typography
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.85)',
            }}
          >
            {currentProject.id} / 0{SHOWCASE_PROJECTS.length}
          </Typography>

          <IconButton
            onClick={handleNext}
            aria-label="Next project"
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(8px)',
              borderRadius: '50%',
              width: 38,
              height: 38,
              transition: 'all 0.2s ease',
              '&:hover': {
                color: '#FFFFFF',
                borderColor: '#FFFFFF',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                transform: 'scale(1.05)',
              },
            }}
          >
            <ChevronRight />
          </IconButton>
        </Box>

        {/* Bottom Right: Info Header, Summary & Tag Badges (Collapsible on very small screens) */}
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
              color: 'rgba(255, 255, 255, 0.65)',
              mb: 0.6,
              letterSpacing: '0.04em',
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
                  color: 'rgba(255, 255, 255, 0.85)',
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
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      color: '#FFFFFF',
                      borderRadius: '16px',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      fontSize: '0.72rem',
                      fontFamily: '"Space Grotesk", sans-serif',
                      fontWeight: 500,
                      backdropFilter: 'blur(8px)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.18)',
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
            sx: { backgroundColor: 'rgba(4, 5, 14, 0.88)', backdropFilter: 'blur(16px)' },
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
              backgroundColor: '#0a0d1d',
              border: `1px solid ${currentProject.color}50`,
              boxShadow: `0 0 50px ${currentProject.color}35`,
              borderRadius: 3,
              p: { xs: 2.5, sm: 3.5, md: 5 },
              color: '#FFFFFF',
              outline: 'none',
            }}
          >
            {/* Modal Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box>
                <Chip
                  label={currentProject.badge}
                  sx={{
                    backgroundColor: `${currentProject.color}25`,
                    color: currentProject.color,
                    border: `1px solid ${currentProject.color}60`,
                    fontWeight: 700,
                    mb: 1.5,
                  }}
                />
                <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: '1.6rem', sm: '2rem', md: '2.4rem' } }}>
                  {currentProject.title}
                </Typography>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 0.5, fontSize: { xs: '0.88rem', md: '1rem' } }}>
                  {currentProject.subtitle}
                </Typography>
              </Box>

              <IconButton
                onClick={() => setIsCaseStudyOpen(false)}
                aria-label="Close modal"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF' },
                }}
              >
                <Close />
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
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.55)' }}>
                    {m.label}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: currentProject.color, mt: 0.5 }}>
                    {m.val}
                  </Typography>
                </Paper>
              ))}
            </Box>

            {/* Architecture Highlights */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Hub sx={{ color: currentProject.color }} /> System Architecture & Execution Flow
              </Typography>
              <Box sx={{ pl: 2, borderLeft: `2px solid ${currentProject.color}40` }}>
                {currentProject.caseStudy.architecture.map((item, idx) => (
                  <Typography key={idx} sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 1, fontSize: '0.95rem' }}>
                    • {item}
                  </Typography>
                ))}
              </Box>
            </Box>

            {/* Threat Vectors Mitigated */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Security sx={{ color: currentProject.color }} /> Neutralized Attack Vectors
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {currentProject.caseStudy.threatVectors.map((v) => (
                  <Chip
                    key={v}
                    label={v}
                    sx={{
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      color: '#F87171',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Live Telemetry Log Trace */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Terminal sx={{ color: currentProject.color }} /> Real-time Kernel & Audit Telemetry Log
              </Typography>
              <Box
                sx={{
                  backgroundColor: '#05070e',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
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
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Button
                variant="outlined"
                onClick={() => setIsCaseStudyOpen(false)}
                sx={{ color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.3)' }}
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
    </Box>
  );
};
