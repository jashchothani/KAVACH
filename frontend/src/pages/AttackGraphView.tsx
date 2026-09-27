import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Chip, Stack, Paper, IconButton,
  Tooltip, CircularProgress, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, Divider
} from '@mui/material';
import {
  Hub, Computer, Terminal, InsertDriveFile, Language,
  Person, AppRegistration, Warning, CheckCircle, Shield,
  Refresh, PlayArrow, Block, DeleteForever, Lan, Whatshot,
  FiberManualRecord, Security, Bolt, Close, OpenInNew
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { api, type AttackGraphData, type GraphNode, type GraphEdge } from '../api/client';
import { useThemeMode } from '../context/ThemeContext';

const CR = '#DC2626';
const WARN = '#F59E0B';
const SAFE = '#22C55E';
const CYAN = '#06B6D4';
const BLUE = '#3B82F6';

// Node Type Icon Helper
const getNodeIcon = (type: GraphNode['type'], size = 20) => {
  switch (type) {
    case 'host': return <Computer sx={{ fontSize: size }} />;
    case 'process': return <Terminal sx={{ fontSize: size }} />;
    case 'file': return <InsertDriveFile sx={{ fontSize: size }} />;
    case 'ip': return <Language sx={{ fontSize: size }} />;
    case 'registry': return <AppRegistration sx={{ fontSize: size }} />;
    case 'user': return <Person sx={{ fontSize: size }} />;
    default: return <Hub sx={{ fontSize: size }} />;
  }
};

// Node Status Color Helper
const getStatusColor = (status: GraphNode['status']) => {
  switch (status) {
    case 'compromised': return CR;
    case 'suspicious': return WARN;
    case 'clean': return SAFE;
    case 'remediated': return CYAN;
  }
};

export const AttackGraphView: React.FC = () => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedScenario, setSelectedScenario] = useState('apt29-spearphish');
  const [graphData, setGraphData] = useState<AttackGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [remediating, setRemediating] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Fetch scenarios and current graph
  const loadGraph = async (scenarioId: string) => {
    setLoading(true);
    try {
      const overview = await api.graph.getOverview();
      setScenarios(overview);
      const data = await api.graph.getAttackTree(scenarioId);
      setGraphData(data);
      // Default selection to patient zero or first compromised node
      const pZero = data.nodes.find(n => n.is_patient_zero) || data.nodes[0];
      setSelectedNode(pZero || null);
    } catch (err) {
      console.error('Failed to load attack graph:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph(selectedScenario);
  }, [selectedScenario]);

  // Execute surgical containment
  const handleRemediate = async (node: GraphNode, action: string) => {
    setRemediating(true);
    try {
      const res = await api.graph.remediateNode(node.id, action);
      setActionSuccessMsg(res.message);
      // Reload current graph
      const updated = await api.graph.getAttackTree(selectedScenario);
      setGraphData(updated);
      setSelectedNode(updated.nodes.find(n => n.id === node.id) || null);
      setTimeout(() => setActionSuccessMsg(null), 5000);
    } catch (err) {
      console.error('Remediation failed:', err);
    } finally {
      setRemediating(false);
    }
  };

  // Node Positions Calculation (Hierarchical Tree layout)
  const computeNodePositions = (nodes: GraphNode[]) => {
    // Spread nodes horizontally and vertically across canvas
    const positions: Record<string, { x: number; y: number }> = {
      // APT29 Layout
      'node-ip-attacker': { x: 80, y: 160 },
      'node-user-rohit': { x: 80, y: 380 },
      'node-proc-outlook': { x: 280, y: 160 },
      'node-host-finance': { x: 280, y: 380 },
      'node-file-invoice': { x: 480, y: 160 },
      'node-proc-ps': { x: 680, y: 160 },
      'node-reg-runkey': { x: 880, y: 80 },
      'node-ip-c2-beacon': { x: 880, y: 260 },

      // LockBit Layout
      'node-usb-device': { x: 120, y: 240 },
      'node-host-ops': { x: 340, y: 100 },
      'node-proc-payload': { x: 380, y: 240 },
      'node-proc-vssadmin': { x: 660, y: 160 },
      'node-file-canary': { x: 660, y: 320 },
    };

    return positions;
  };

  const positions = graphData ? computeNodePositions(graphData.nodes) : {};

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1600, mx: 'auto' }}>
      {/* ── TOP HUD HEADER ──────────────────────────────────────────────── */}
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
              <Hub sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, color: 'text.primary', lineHeight: 1.1 }}>
                Chakra Attack Graph & Blast Radius
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Topological Root-Cause Analysis, Entity Relationships & 1-Click Surgical Containment
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Scenario Selector & Refresh */}
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <Box display="flex" gap={1}>
            {scenarios.map((sc) => (
              <Button
                key={sc.scenario_id}
                size="small"
                variant={selectedScenario === sc.scenario_id ? 'contained' : 'outlined'}
                onClick={() => setSelectedScenario(sc.scenario_id)}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  bgcolor: selectedScenario === sc.scenario_id ? CR : 'transparent',
                  color: selectedScenario === sc.scenario_id ? '#FFF' : 'text.secondary',
                  borderColor: selectedScenario === sc.scenario_id ? CR : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'),
                  '&:hover': {
                    bgcolor: selectedScenario === sc.scenario_id ? '#B91C1C' : 'rgba(220,38,38,0.08)',
                  }
                }}
              >
                {sc.title.split(':')[0]}
              </Button>
            ))}
          </Box>

          <Tooltip title="Refresh attack telemetry">
            <IconButton onClick={() => loadGraph(selectedScenario)} sx={{ border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
              <Refresh sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* ── BLAST RADIUS KPI METRIC CARDS ────────────────────────────────── */}
      {graphData && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' },
            gap: 2,
            mb: 3,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
              bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF',
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, letterSpacing: '0.04em' }}>
              PATIENT ZERO
            </Typography>
            <Typography variant="h6" sx={{ fontFamily: 'JetBrains Mono', fontWeight: 800, color: CR, mt: 0.5, fontSize: '0.95rem' }} noWrap>
              {graphData.blast_radius.patient_zero_id.replace('node-', '').toUpperCase()}
            </Typography>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
              bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF',
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, letterSpacing: '0.04em' }}>
              BLAST RADIUS (ASSETS)
            </Typography>
            <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 900, color: WARN, mt: 0.5 }}>
              {graphData.blast_radius.affected_endpoints} Endpoint • {graphData.blast_radius.affected_users} User
            </Typography>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
              bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF',
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, letterSpacing: '0.04em' }}>
              COMPROMISED PIDS
            </Typography>
            <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 900, color: CR, mt: 0.5 }}>
              {graphData.blast_radius.compromised_processes} Malicious Trees
            </Typography>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
              bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF',
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, letterSpacing: '0.04em' }}>
              ACTIVE C2 BEACONS
            </Typography>
            <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 900, color: CYAN, mt: 0.5 }}>
              {graphData.blast_radius.external_c2_ips} Sockets
            </Typography>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
              bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF',
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, letterSpacing: '0.04em' }}>
              CONTAINMENT STATUS
            </Typography>
            <Box mt={0.5}>
              <Chip
                label={graphData.blast_radius.containment_status.replace('_', ' ').toUpperCase()}
                size="small"
                sx={{
                  fontWeight: 900,
                  fontSize: '0.7rem',
                  bgcolor: graphData.blast_radius.containment_status === 'remediated' ? 'rgba(34,197,94,0.15)' : 'rgba(220,38,38,0.15)',
                  color: graphData.blast_radius.containment_status === 'remediated' ? SAFE : CR,
                  border: `1px solid ${graphData.blast_radius.containment_status === 'remediated' ? SAFE : CR}`,
                }}
              />
            </Box>
          </Paper>
        </Box>
      )}

      {/* Action Notification Alert */}
      {actionSuccessMsg && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 3, fontWeight: 600 }}>
          {actionSuccessMsg}
        </Alert>
      )}

      {/* ── MAIN INTERACTIVE GRAPH & SURGICAL INSPECTOR ────────────────────── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 380px' },
          gap: 3,
        }}
      >
        {/* GRAPH CANVAS */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 4,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
            bgcolor: isDark ? '#05070D' : '#F8FAFC',
            position: 'relative',
            minHeight: 560,
            overflow: 'auto',
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 500 }}>
              <CircularProgress sx={{ color: CR }} />
            </Box>
          ) : graphData ? (
            <Box sx={{ width: '100%', minWidth: 980, height: 520, position: 'relative' }}>
              {/* SVG Edges and Connectors */}
              <svg
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                }}
              >
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="8"
                    markerHeight="6"
                    refX="7"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill={isDark ? 'rgba(255,255,255,0.3)' : '#94A3B8'} />
                  </marker>
                  <marker
                    id="arrowhead-crit"
                    markerWidth="8"
                    markerHeight="6"
                    refX="7"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill={CR} />
                  </marker>
                </defs>

                {graphData.edges.map((edge) => {
                  const s = positions[edge.source];
                  const t = positions[edge.target];
                  if (!s || !t) return null;

                  const isCritical = graphData.blast_radius.critical_path.includes(edge.source) && graphData.blast_radius.critical_path.includes(edge.target);

                  return (
                    <g key={edge.id}>
                      <line
                        x1={s.x + 80}
                        y1={s.y + 35}
                        x2={t.x}
                        y2={t.y + 35}
                        stroke={isCritical ? CR : (isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1')}
                        strokeWidth={isCritical ? 2.5 : 1.5}
                        strokeDasharray={isCritical ? '4 2' : 'none'}
                        markerEnd={isCritical ? 'url(#arrowhead-crit)' : 'url(#arrowhead)'}
                      />
                      {/* Edge Label Pill */}
                      <text
                        x={(s.x + 80 + t.x) / 2}
                        y={(s.y + 35 + t.y + 35) / 2 - 8}
                        fill={isCritical ? (isDark ? '#FCA5A5' : '#B91C1C') : (isDark ? 'rgba(255,255,255,0.5)' : '#64748B')}
                        fontSize="9.5"
                        fontWeight="700"
                        fontFamily="JetBrains Mono, monospace"
                        textAnchor="middle"
                      >
                        {edge.label}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Render Graph Nodes */}
              {graphData.nodes.map((node) => {
                const pos = positions[node.id] || { x: 100, y: 100 };
                const isSelected = selectedNode?.id === node.id;
                const statusColor = getStatusColor(node.status);

                return (
                  <Box
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    sx={{
                      position: 'absolute',
                      left: pos.x,
                      top: pos.y,
                      width: 170,
                      p: 1.5,
                      borderRadius: 3,
                      cursor: 'pointer',
                      bgcolor: isDark ? '#0D111A' : '#FFFFFF',
                      border: `1.5px solid ${isSelected ? '#3B82F6' : statusColor}`,
                      boxShadow: isSelected
                        ? '0 0 20px rgba(59, 130, 246, 0.4)'
                        : `0 4px 16px ${statusColor}22`,
                      transition: 'all 0.2s ease',
                      zIndex: isSelected ? 10 : 2,
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: `0 8px 24px ${statusColor}44`,
                      },
                    }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Box
                        sx={{
                          width: 30,
                          height: 30,
                          borderRadius: 2,
                          bgcolor: `${statusColor}18`,
                          color: statusColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {getNodeIcon(node.type, 18)}
                      </Box>
                      <Chip
                        label={`${node.risk_score}`}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.65rem',
                          fontWeight: 900,
                          fontFamily: 'JetBrains Mono',
                          bgcolor: `${statusColor}22`,
                          color: statusColor,
                        }}
                      />
                    </Box>

                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.76rem',
                        color: 'text.primary',
                        display: 'block',
                        lineHeight: 1.3,
                        mb: 0.5,
                      }}
                      noWrap
                    >
                      {node.label}
                    </Typography>

                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.65rem',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          color: 'text.secondary',
                        }}
                      >
                        {node.type}
                      </Typography>
                      {node.is_patient_zero && (
                        <Chip
                          label="PATIENT 0"
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: '0.55rem',
                            fontWeight: 900,
                            bgcolor: 'rgba(220, 38, 38, 0.2)',
                            color: CR,
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ) : null}
        </Paper>

        {/* ── SURGICAL INSPECTOR & REMEDIATION DRAWER ─────────────────────── */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 4,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
            bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {selectedNode ? (
            <Box>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 2,
                      bgcolor: `${getStatusColor(selectedNode.status)}18`,
                      color: getStatusColor(selectedNode.status),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {getNodeIcon(selectedNode.type, 20)}
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: 'text.primary' }}>
                    Entity Inspector
                  </Typography>
                </Box>
                <Chip
                  label={selectedNode.status.toUpperCase()}
                  size="small"
                  sx={{
                    fontWeight: 900,
                    fontSize: '0.68rem',
                    bgcolor: `${getStatusColor(selectedNode.status)}22`,
                    color: getStatusColor(selectedNode.status),
                  }}
                />
              </Box>

              <Typography variant="h6" sx={{ fontFamily: 'JetBrains Mono', fontWeight: 800, fontSize: '0.92rem', mb: 1, color: 'text.primary', wordBreak: 'break-word' }}>
                {selectedNode.label}
              </Typography>

              <Divider sx={{ my: 2, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />

              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, display: 'block', mb: 1.5 }}>
                FORENSIC ATTRIBUTES
              </Typography>

              <Stack spacing={1.5} sx={{ mb: 3 }}>
                {Object.entries(selectedNode.details).map(([key, val]) => (
                  <Box key={key} sx={{ p: 1.2, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F1F5F9' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 700, fontSize: '0.65rem', display: 'block' }}>
                      {key.replace('_', ' ')}
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'JetBrains Mono', fontSize: '0.76rem', color: 'text.primary', wordBreak: 'break-all' }}>
                      {String(val)}
                    </Typography>
                  </Box>
                ))}
              </Stack>

              {/* 1-Click Surgical Remediations */}
              <Box>
                <Typography variant="caption" sx={{ color: CR, fontWeight: 900, letterSpacing: '0.06em', display: 'block', mb: 1.5 }}>
                  SURGICAL CONTAINMENT DISPATCH
                </Typography>

                <Stack spacing={1}>
                  {selectedNode.type === 'process' && (
                    <Button
                      fullWidth
                      variant="contained"
                      disabled={remediating || selectedNode.status === 'remediated'}
                      onClick={() => handleRemediate(selectedNode, 'kill_tree')}
                      startIcon={<Bolt />}
                      sx={{
                        bgcolor: CR,
                        color: '#FFF',
                        fontWeight: 800,
                        textTransform: 'none',
                        borderRadius: 2,
                        '&:hover': { bgcolor: '#B91C1C' },
                      }}
                    >
                      {selectedNode.status === 'remediated' ? 'Process Tree Terminated' : 'Kill Process Tree (Immediate)'}
                    </Button>
                  )}

                  {selectedNode.type === 'ip' && (
                    <Button
                      fullWidth
                      variant="contained"
                      disabled={remediating || selectedNode.status === 'remediated'}
                      onClick={() => handleRemediate(selectedNode, 'block_ip')}
                      startIcon={<Block />}
                      sx={{
                        bgcolor: CR,
                        color: '#FFF',
                        fontWeight: 800,
                        textTransform: 'none',
                        borderRadius: 2,
                        '&:hover': { bgcolor: '#B91C1C' },
                      }}
                    >
                      {selectedNode.status === 'remediated' ? 'IP Blocked on Firewall' : 'Block IP on Edge Gateway'}
                    </Button>
                  )}

                  {selectedNode.type === 'file' && (
                    <Button
                      fullWidth
                      variant="contained"
                      disabled={remediating || selectedNode.status === 'remediated'}
                      onClick={() => handleRemediate(selectedNode, 'quarantine_file')}
                      startIcon={<DeleteForever />}
                      sx={{
                        bgcolor: WARN,
                        color: '#000',
                        fontWeight: 800,
                        textTransform: 'none',
                        borderRadius: 2,
                        '&:hover': { bgcolor: '#D97706' },
                      }}
                    >
                      {selectedNode.status === 'remediated' ? 'File in Air-Gapped Vault' : 'Quarantine File to Vault'}
                    </Button>
                  )}

                  {selectedNode.type === 'host' && (
                    <Button
                      fullWidth
                      variant="contained"
                      disabled={remediating || selectedNode.status === 'remediated'}
                      onClick={() => handleRemediate(selectedNode, 'isolate_host')}
                      startIcon={<Lan />}
                      sx={{
                        bgcolor: CR,
                        color: '#FFF',
                        fontWeight: 800,
                        textTransform: 'none',
                        borderRadius: 2,
                        '&:hover': { bgcolor: '#B91C1C' },
                      }}
                    >
                      {selectedNode.status === 'remediated' ? 'Endpoint Isolated' : 'Isolate Endpoint NIC'}
                    </Button>
                  )}

                  {selectedNode.type === 'user' && (
                    <Button
                      fullWidth
                      variant="contained"
                      disabled={remediating || selectedNode.status === 'remediated'}
                      onClick={() => handleRemediate(selectedNode, 'revoke_session')}
                      startIcon={<Security />}
                      sx={{
                        bgcolor: BLUE,
                        color: '#FFF',
                        fontWeight: 800,
                        textTransform: 'none',
                        borderRadius: 2,
                        '&:hover': { bgcolor: '#2563EB' },
                      }}
                    >
                      {selectedNode.status === 'remediated' ? 'Session Revoked' : 'Revoke Session & Force MFA'}
                    </Button>
                  )}
                </Stack>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', py: 8 }}>
              <Hub sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.4, mb: 2 }} />
              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                Select any entity node in the Chakra topology graph to inspect its forensic blast radius and trigger surgical containment.
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default AttackGraphView;
