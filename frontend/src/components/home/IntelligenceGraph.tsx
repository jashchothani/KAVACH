import React, { useState } from 'react';
import { Box, Container, Typography, Grid, Chip, Button, Stack, Tooltip } from '@mui/material';
import {
  Shield, Security, Bolt, Sensors, Hub, PlayArrow, CheckCircle,
  WarningAmber, DeviceHub, Terminal, Memory, VpnKey, Public
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const CR = '#DC2626';

interface ThreatScenario {
  id: string;
  title: string;
  mitre: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  description: string;
  activePath: string[];
  victimNode: string;
  actionTaken: string;
  latency: string;
}

const scenarios: ThreatScenario[] = [
  {
    id: 'ransomware',
    title: 'Ransomware Canary Trigger',
    mitre: 'MITRE T1486 (Data Encrypted)',
    severity: 'CRITICAL',
    description: 'Cryptographic payload touched high-priority canary file in user profile directory.',
    activePath: ['identity', 'device', 'kernel', 'event', 'threat', 'soar'],
    victimNode: 'kernel',
    actionTaken: 'Host isolated via WFP • PID 4920 suspended in 11ms • Canary decoy intact',
    latency: '11.4 ms',
  },
  {
    id: 'credential',
    title: 'LSASS Memory Dump',
    mitre: 'MITRE T1003 (OS Credential Dumping)',
    severity: 'CRITICAL',
    description: 'Unsigned binary attempted handle opening on lsass.exe process memory.',
    activePath: ['identity', 'device', 'kernel', 'ml', 'threat', 'soar'],
    victimNode: 'identity',
    actionTaken: 'Access token revoked • Kerberos session terminated • Alert dispatched to SOC',
    latency: '8.2 ms',
  },
  {
    id: 'c2_beacon',
    title: 'DNS C2 Covert Tunneling',
    mitre: 'MITRE T1071 (Application Layer Protocol)',
    severity: 'HIGH',
    description: 'High-entropy subdomains resolving at 240 req/min to unverified external IP.',
    activePath: ['device', 'network', 'ml', 'threat', 'soar'],
    victimNode: 'network',
    actionTaken: 'Domain sinkholed via KAVACH URL Shield • Rogue outbound socket terminated',
    latency: '14.1 ms',
  },
  {
    id: 'powershell',
    title: 'Encoded PowerShell Injection',
    mitre: 'MITRE T1059.001 (Command & Scripting)',
    severity: 'HIGH',
    description: 'Base64 obfuscated script block executing in-memory without disk write.',
    activePath: ['identity', 'device', 'event', 'threat', 'soar'],
    victimNode: 'device',
    actionTaken: 'Process lineage terminated • Script deobfuscated and logged to immutable audit ledger',
    latency: '9.6 ms',
  },
];

interface NodeItem {
  id: string;
  label: string;
  subtitle: string;
  x: number;
  y: number;
  icon: any;
  tier: string;
}

const graphNodes: NodeItem[] = [
  { id: 'identity', label: 'Identity / Auth', subtitle: 'admin@swastik.corp', x: 80, y: 120, icon: <VpnKey sx={{ fontSize: 18 }} />, tier: 'INGRESS' },
  { id: 'device', label: 'Endpoint Host', subtitle: 'WS-SEC-0492', x: 260, y: 90, icon: <DeviceHub sx={{ fontSize: 18 }} />, tier: 'SYSTEM' },
  { id: 'network', label: 'Network Fabric', subtitle: '10.0.1.1 Gateway', x: 450, y: 90, icon: <Public sx={{ fontSize: 18 }} />, tier: 'NETWORK' },
  { id: 'kernel', label: 'Ring-0 Kernel', subtitle: 'ntoskrnl Hook', x: 200, y: 240, icon: <Memory sx={{ fontSize: 18 }} />, tier: 'TELEMETRY' },
  { id: 'event', label: 'Event Telemetry', subtitle: '16 Host Engines', x: 380, y: 220, icon: <Sensors sx={{ fontSize: 18 }} />, tier: 'CORRELATION' },
  { id: 'ml', label: 'IsolationForest ML', subtitle: 'Anomaly 0.984', x: 550, y: 210, icon: <Hub sx={{ fontSize: 18 }} />, tier: 'NEURAL' },
  { id: 'threat', label: 'Threat Cluster', subtitle: 'MITRE Correlated', x: 330, y: 340, icon: <WarningAmber sx={{ fontSize: 18 }} />, tier: 'VERDICT' },
  { id: 'soar', label: 'Autonomous SOAR', subtitle: 'Controlled Playbook', x: 530, y: 340, icon: <Bolt sx={{ fontSize: 18 }} />, tier: 'CONTAINMENT' },
];

const graphEdges = [
  { from: 'identity', to: 'device' },
  { from: 'device', to: 'kernel' },
  { from: 'device', to: 'network' },
  { from: 'device', to: 'event' },
  { from: 'network', to: 'ml' },
  { from: 'kernel', to: 'event' },
  { from: 'kernel', to: 'threat' },
  { from: 'event', to: 'threat' },
  { from: 'ml', to: 'threat' },
  { from: 'threat', to: 'soar' },
];

export const IntelligenceGraph: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
  const [selectedNode, setSelectedNode] = useState<string | null>('threat');
  const [isSimulating, setIsSimulating] = useState(false);

  const scenario = scenarios[activeScenarioIdx];

  const handleSimulate = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
    }, 2500);
  };

  const isEdgeActive = (from: string, to: string) => {
    const fromIdx = scenario.activePath.indexOf(from);
    const toIdx = scenario.activePath.indexOf(to);
    return fromIdx !== -1 && toIdx !== -1 && Math.abs(fromIdx - toIdx) <= 2;
  };

  const cardBg = isDark ? 'rgba(14, 16, 24, 0.82)' : 'rgba(255, 255, 255, 0.88)';
  const border = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  const elevatedBg = isDark ? '#141722' : '#F8FAFC';
  const textPrimary = isDark ? '#FFFFFF' : '#0B0B0F';
  const textSecondary = isDark ? 'rgba(255, 255, 255, 0.65)' : '#475569';

  return (
    <Box sx={{ py: { xs: 10, md: 16 }, bgcolor: 'transparent', position: 'relative', zIndex: 1 }}>
      <Container maxWidth="xl">
        {/* Header Title Section */}
        <Box textAlign="center" maxWidth={860} mx="auto" mb={6}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 0.6,
              borderRadius: 999,
              bgcolor: isDark ? 'rgba(220, 38, 38, 0.12)' : 'rgba(220, 38, 38, 0.08)',
              border: isDark ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid rgba(220, 38, 38, 0.2)',
              mb: 2.5,
            }}
          >
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: CR }} />
            <Typography
              sx={{
                color: CR,
                fontWeight: 800,
                letterSpacing: '0.1em',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              REAL-TIME THREAT CORRELATION & TOPOLOGY
            </Typography>
          </Box>

          <Typography
            variant="h2"
            sx={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 900,
              fontSize: { xs: '2.4rem', sm: '3.2rem', md: '3.8rem' },
              color: textPrimary,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              mb: 2.5,
            }}
          >
            See the connection.<br />
            <Box component="span" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.4)' : '#64748B' }}>
              Understand the threat.
            </Box>
          </Typography>

          <Typography
            sx={{
              color: textSecondary,
              fontSize: { xs: '1.05rem', md: '1.18rem' },
              lineHeight: 1.7,
              maxWidth: 720,
              mx: 'auto',
            }}
          >
            Individual security events are misleading in isolation. KAVACH correlates identity, memory hooks, network sockets, and process execution into unified forensic intelligence graphs in sub-millisecond real time.
          </Typography>
        </Box>

        {/* Interactive Scenario Bar */}
        <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'center' }, mb: 4, width: '100%', overflowX: 'auto', pb: 1 }}>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              p: 1,
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
              borderRadius: 3,
              border: `1px solid ${border}`,
              backdropFilter: 'blur(12px)',
              maxWidth: '100%',
              flexWrap: { xs: 'nowrap', md: 'wrap' },
            }}
          >
            {scenarios.map((sc, idx) => {
              const active = idx === activeScenarioIdx;
              return (
                <Button
                  key={sc.id}
                  onClick={() => {
                    setActiveScenarioIdx(idx);
                    setSelectedNode(sc.victimNode);
                  }}
                  sx={{
                    px: 2.5,
                    py: 1.2,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: active ? '#FFFFFF' : (isDark ? 'rgba(255,255,255,0.7)' : '#475569'),
                    bgcolor: active ? CR : 'transparent',
                    boxShadow: active ? '0 4px 14px rgba(220, 38, 38, 0.35)' : 'none',
                    '&:hover': {
                      bgcolor: active ? '#B91C1C' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  {sc.title}
                </Button>
              );
            })}
          </Stack>
        </Box>

        {/* Main Interactive Stage */}
        <Grid container spacing={4} alignItems="stretch">
          {/* Left: Holographic SVG Graph Canvas */}
          <Grid item xs={12} lg={8}>
            <Box
              sx={{
                position: 'relative',
                height: { xs: 400, sm: 460, md: 500 },
                width: '100%',
                bgcolor: cardBg,
                border: `1px solid ${border}`,
                borderRadius: 4,
                boxShadow: isDark
                  ? '0 20px 48px -12px rgba(0, 0, 0, 0.7)'
                  : '0 20px 48px -12px rgba(15, 23, 42, 0.08)',
                backdropFilter: 'blur(20px)',
                overflow: 'hidden',
                p: 2,
              }}
            >
              {/* Corner HUD Markers */}
              <Box sx={{ position: 'absolute', top: 16, left: 20, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22C55E' }} />
                <Typography sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#64748B', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', fontWeight: 700 }}>
                  TOPOLOGY // LIVE TELEMETRY MATRIX
                </Typography>
              </Box>

              <Box sx={{ position: 'absolute', top: 16, right: 20 }}>
                <Chip
                  label={scenario.severity}
                  size="small"
                  sx={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 800,
                    fontSize: '0.7rem',
                    bgcolor: scenario.severity === 'CRITICAL' ? 'rgba(220, 38, 38, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                    color: scenario.severity === 'CRITICAL' ? '#DC2626' : '#EAB308',
                    border: `1px solid ${scenario.severity === 'CRITICAL' ? 'rgba(220, 38, 38, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
                  }}
                />
              </Box>

              {/* Responsive SVG Graph */}
              <svg
                style={{ width: '100%', height: '100%' }}
                viewBox="0 0 680 440"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Connecting Laser Edges */}
                {graphEdges.map((edge, i) => {
                  const fromNode = graphNodes.find(n => n.id === edge.from)!;
                  const toNode = graphNodes.find(n => n.id === edge.to)!;
                  const active = isEdgeActive(edge.from, edge.to);

                  return (
                    <g key={`edge-${i}`}>
                      {/* Underlying Guide Line */}
                      <line
                        x1={fromNode.x}
                        y1={fromNode.y}
                        x2={toNode.x}
                        y2={toNode.y}
                        stroke={active ? (isDark ? 'rgba(220, 38, 38, 0.4)' : 'rgba(220, 38, 38, 0.3)') : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)')}
                        strokeWidth={active ? 2.5 : 1}
                        strokeDasharray={active ? 'none' : '4 4'}
                      />

                      {/* Active Pulsing Laser Beam */}
                      {active && (
                        <motion.line
                          x1={fromNode.x}
                          y1={fromNode.y}
                          x2={toNode.x}
                          y2={toNode.y}
                          stroke={CR}
                          strokeWidth={2.5}
                          initial={{ pathLength: 0, opacity: 0.2 }}
                          animate={{ pathLength: [0, 1], opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
                        />
                      )}
                    </g>
                  );
                })}

                {/* Nodes Representation */}
                {graphNodes.map((node) => {
                  const isNodeInPath = scenario.activePath.includes(node.id);
                  const isVictim = scenario.victimNode === node.id;
                  const isSelected = selectedNode === node.id;

                  return (
                    <g
                      key={node.id}
                      onClick={() => setSelectedNode(node.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Outer Ring Pulse for active victim node */}
                      {isVictim && (
                        <motion.circle
                          cx={node.x}
                          cy={node.y}
                          r={30}
                          fill="none"
                          stroke={CR}
                          strokeWidth={1.5}
                          animate={{ scale: [0.9, 1.4, 0.9], opacity: [0.8, 0, 0.8] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      )}

                      {/* Node Body Card */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={22}
                        fill={isSelected ? (isDark ? '#2D1518' : '#FEE2E2') : (isDark ? '#111420' : '#FFFFFF')}
                        stroke={isSelected ? CR : (isNodeInPath ? (isDark ? '#DC2626' : '#DC2626') : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'))}
                        strokeWidth={isSelected ? 2.5 : (isNodeInPath ? 2 : 1)}
                      />

                      {/* Inner Dot */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={6}
                        fill={isNodeInPath ? CR : (isDark ? '#64748B' : '#94A3B8')}
                      />

                      {/* Node Typography */}
                      <text
                        x={node.x}
                        y={node.y + 36}
                        textAnchor="middle"
                        fill={isDark ? '#FFFFFF' : '#0B0B0F'}
                        fontSize="11"
                        fontWeight="800"
                        fontFamily="Outfit, sans-serif"
                      >
                        {node.label}
                      </text>
                      <text
                        x={node.x}
                        y={node.y + 48}
                        textAnchor="middle"
                        fill={isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748B'}
                        fontSize="9"
                        fontWeight="600"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {node.subtitle}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Bottom Interactive Trigger & Legend */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 12,
                  left: { xs: 12, sm: 20 },
                  right: { xs: 12, sm: 20 },
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'space-between',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  gap: 1,
                  bgcolor: { xs: isDark ? 'rgba(10, 12, 18, 0.85)' : 'rgba(255, 255, 255, 0.85)', sm: 'transparent' },
                  p: { xs: 1, sm: 0 },
                  borderRadius: { xs: 2, sm: 0 },
                }}
              >
                <Typography sx={{ color: textSecondary, fontSize: { xs: '0.68rem', sm: '0.75rem' }, fontFamily: 'JetBrains Mono, monospace' }}>
                  Tap any node to inspect payload
                </Typography>
                <Button
                  size="small"
                  onClick={handleSimulate}
                  disabled={isSimulating}
                  startIcon={<PlayArrow sx={{ fontSize: 16 }} />}
                  sx={{
                    bgcolor: isDark ? 'rgba(220, 38, 38, 0.15)' : 'rgba(220, 38, 38, 0.1)',
                    color: CR,
                    fontWeight: 800,
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 2,
                    py: 0.5,
                    border: '1px solid rgba(220, 38, 38, 0.3)',
                    '&:hover': { bgcolor: CR, color: '#FFFFFF' },
                  }}
                >
                  {isSimulating ? 'Intercepting Threat...' : 'Simulate Interception'}
                </Button>
              </Box>
            </Box>
          </Grid>

          {/* Right: Live Forensic Telemetry HUD */}
          <Grid item xs={12} lg={4}>
            <Box
              sx={{
                height: '100%',
                bgcolor: cardBg,
                border: `1px solid ${border}`,
                borderRadius: 4,
                boxShadow: isDark
                  ? '0 20px 48px -12px rgba(0, 0, 0, 0.7)'
                  : '0 20px 48px -12px rgba(15, 23, 42, 0.08)',
                backdropFilter: 'blur(20px)',
                p: { xs: 3, sm: 3.5 },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', fontWeight: 800, color: CR, letterSpacing: '0.08em' }}>
                    FORENSIC INCIDENT DOSSIER
                  </Typography>
                  <Chip
                    label={scenario.latency}
                    size="small"
                    sx={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontWeight: 800,
                      fontSize: '0.68rem',
                      bgcolor: 'rgba(34, 197, 94, 0.12)',
                      color: '#22C55E',
                    }}
                  />
                </Box>

                <Typography variant="h5" sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: textPrimary, mb: 1 }}>
                  {scenario.title}
                </Typography>

                <Typography sx={{ color: isDark ? '#38BDF8' : '#0284C7', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', fontWeight: 700, mb: 2 }}>
                  {scenario.mitre}
                </Typography>

                <Typography sx={{ color: textSecondary, fontSize: '0.9rem', lineHeight: 1.6, mb: 3 }}>
                  {scenario.description}
                </Typography>

                {/* Selected Node Inspector Pill */}
                {selectedNode && (
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: elevatedBg,
                      borderRadius: 2.5,
                      border: `1px solid ${border}`,
                      mb: 3,
                    }}
                  >
                    <Typography sx={{ fontSize: '0.68rem', fontFamily: 'JetBrains Mono, monospace', color: textSecondary, fontWeight: 700, mb: 0.8 }}>
                      ACTIVE INSPECTION // NODE
                    </Typography>
                    <Typography sx={{ color: textPrimary, fontWeight: 800, fontSize: '0.95rem', fontFamily: 'Outfit, sans-serif' }}>
                      {graphNodes.find(n => n.id === selectedNode)?.label}
                    </Typography>
                    <Typography sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#64748B', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', mt: 0.4 }}>
                      Entity: {graphNodes.find(n => n.id === selectedNode)?.subtitle}
                    </Typography>
                  </Box>
                )}

                {/* Automated SOAR Enforcement */}
                <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: isDark ? 'rgba(220, 38, 38, 0.08)' : 'rgba(220, 38, 38, 0.05)', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.8}>
                    <CheckCircle sx={{ fontSize: 16, color: '#22C55E' }} />
                    <Typography sx={{ color: textPrimary, fontWeight: 800, fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace' }}>
                      AUTONOMOUS SOAR INTERCEPTION
                    </Typography>
                  </Box>
                  <Typography sx={{ color: textSecondary, fontSize: '0.82rem', lineHeight: 1.5 }}>
                    {scenario.actionTaken}
                  </Typography>
                </Box>
              </Box>

              {/* Footer Stamp */}
              <Box pt={3} mt={3} borderTop={`1px solid ${border}`} display="flex" justifyContent="space-between" alignItems="center">
                <Typography sx={{ color: textSecondary, fontSize: '0.68rem', fontFamily: 'JetBrains Mono, monospace' }}>
                  KAVACH CORRELATION KERNEL v2.4
                </Typography>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22C55E' }} />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

