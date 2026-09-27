import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Chip, Stack, Paper, IconButton,
  Tooltip, CircularProgress, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Divider, MenuItem, Select
} from '@mui/material';
import {
  PlayArrow, AutoAwesome, Add, Save, Refresh, Tune,
  Bolt, FilterAlt, Security, Psychology, CheckCircle,
  Speed, DeleteOutlined, Layers, Close, Code, ArrowForward
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  api, type FlowWorkflow, type FlowNode,
  type FlowEdge, type SimulationResponse
} from '../api/client';
import { useThemeMode } from '../context/ThemeContext';

const CR = '#DC2626';
const WARN = '#F59E0B';
const SAFE = '#22C55E';
const CYAN = '#06B6D4';
const PURPLE = '#8B5CF6';

const getCategoryColor = (category: FlowNode['category']) => {
  switch (category) {
    case 'trigger': return WARN;
    case 'condition': return PURPLE;
    case 'action': return CR;
    case 'ai': return CYAN;
  }
};

const getCategoryIcon = (category: FlowNode['category']) => {
  switch (category) {
    case 'trigger': return <Bolt sx={{ fontSize: 18 }} />;
    case 'condition': return <FilterAlt sx={{ fontSize: 18 }} />;
    case 'action': return <Security sx={{ fontSize: 18 }} />;
    case 'ai': return <Psychology sx={{ fontSize: 18 }} />;
  }
};

export const RakshaFlowStudio: React.FC = () => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  const [workflowsList, setWorkflowsList] = useState<any[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('wf-ransomware-shield');
  const [activeWorkflow, setActiveWorkflow] = useState<FlowWorkflow | null>(null);
  const [loading, setLoading] = useState(true);

  // Inspector & Simulation State
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<SimulationResponse | null>(null);

  // AI Prompt Modal State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  // Add Node Modal State
  const [addNodeModalOpen, setAddNodeModalOpen] = useState(false);
  const [newNodeTitle, setNewNodeTitle] = useState('');
  const [newNodeCategory, setNewNodeCategory] = useState<FlowNode['category']>('action');

  const loadWorkflow = async (wfId: string) => {
    setLoading(true);
    setSimResult(null);
    try {
      const list = await api.rakshaFlow.getWorkflows();
      setWorkflowsList(list);
      const wf = await api.rakshaFlow.getWorkflow(wfId);
      setActiveWorkflow(wf);
      setSelectedNode(wf.nodes[0] || null);
    } catch (err) {
      console.error('Failed to load workflow:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflow(selectedWorkflowId);
  }, [selectedWorkflowId]);

  // Run Simulation
  const handleSimulate = async () => {
    if (!activeWorkflow) return;
    setSimulating(true);
    setSimResult(null);

    try {
      const res = await api.rakshaFlow.simulate(activeWorkflow.id);
      
      // Step-by-step visual animation across nodes
      for (let i = 0; i < activeWorkflow.nodes.length; i++) {
        const nodeId = activeWorkflow.nodes[i].id;
        setActiveWorkflow(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, status: 'running' } : n)
          };
        });
        await new Promise(r => setTimeout(r, 280));
        setActiveWorkflow(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, status: 'success' } : n)
          };
        });
      }

      setSimResult(res);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  // Generate Playbook with Raksha AI
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    try {
      const generated = await api.rakshaFlow.generateWithAi(aiPrompt.trim());
      setAiModalOpen(false);
      setAiPrompt('');
      await loadWorkflow(generated.id);
      setSelectedWorkflowId(generated.id);
    } catch (err) {
      console.error('AI generation failed:', err);
    } finally {
      setAiGenerating(false);
    }
  };

  // Add Custom Node
  const handleAddNode = () => {
    if (!activeWorkflow || !newNodeTitle.trim()) return;
    const newId = `node-${Date.now().toString().slice(-4)}`;
    const newNode: FlowNode = {
      id: newId,
      title: newNodeTitle.trim(),
      category: newNodeCategory,
      action_type: `custom_${newNodeCategory}`,
      status: 'idle',
      x: 300 + Math.floor(Math.random() * 200),
      y: 180 + Math.floor(Math.random() * 100),
      config: {}
    };

    setActiveWorkflow(prev => prev ? { ...prev, nodes: [...prev.nodes, newNode] } : prev);
    setSelectedNode(newNode);
    setAddNodeModalOpen(false);
    setNewNodeTitle('');
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1600, mx: 'auto' }}>
      {/* ── TOP ACTION & TITLE BAR ──────────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Box display="flex" alignItems="center" gap={1.5} mb={0.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2.5,
                bgcolor: 'rgba(6, 182, 212, 0.12)',
                color: CYAN,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AutoAwesome sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, color: 'text.primary', lineHeight: 1.1 }}>
                Raksha Flow: Visual SOAR Playbook Studio
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Graphical Drag-and-Drop Orchestration • AI Natural Language Generator • Sub-50ms Response DAG
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Action Controls */}
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          {/* Select Active Playbook */}
          <Select
            size="small"
            value={selectedWorkflowId}
            onChange={(e) => setSelectedWorkflowId(e.target.value)}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              fontSize: '0.82rem',
              minWidth: 260,
              bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
            }}
          >
            {workflowsList.map((wf) => (
              <MenuItem key={wf.id} value={wf.id}>
                {wf.name}
              </MenuItem>
            ))}
          </Select>

          {/* AI Generator Button */}
          <Button
            size="small"
            variant="contained"
            onClick={() => setAiModalOpen(true)}
            startIcon={<AutoAwesome />}
            sx={{
              bgcolor: CYAN,
              color: '#000',
              fontWeight: 800,
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': { bgcolor: '#0891B2' },
            }}
          >
            Generate with Raksha AI
          </Button>

          {/* Add Node Button */}
          <Button
            size="small"
            variant="outlined"
            onClick={() => setAddNodeModalOpen(true)}
            startIcon={<Add />}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              textTransform: 'none',
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
            }}
          >
            Add Node
          </Button>

          {/* Run Simulation */}
          <Button
            size="small"
            variant="contained"
            disabled={simulating}
            onClick={handleSimulate}
            startIcon={simulating ? <CircularProgress size={16} sx={{ color: '#FFF' }} /> : <PlayArrow />}
            sx={{
              bgcolor: SAFE,
              color: '#FFF',
              fontWeight: 800,
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': { bgcolor: '#16A34A' },
            }}
          >
            {simulating ? 'Simulating...' : 'Simulate Playbook'}
          </Button>
        </Stack>
      </Box>

      {/* ── PLAYBOOK INFO BANNER ─────────────────────────────────────────── */}
      {activeWorkflow && (
        <Paper
          elevation={0}
          sx={{
            p: 2.2,
            px: 3,
            borderRadius: 3.5,
            mb: 3,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
            bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Box display="flex" alignItems="center" gap={1.2} mb={0.5}>
              <Typography variant="subtitle1" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
                {activeWorkflow.name}
              </Typography>
              <Chip
                label={activeWorkflow.category.toUpperCase()}
                size="small"
                sx={{ bgcolor: 'rgba(6,182,212,0.12)', color: CYAN, fontWeight: 900, fontSize: '0.65rem' }}
              />
              <Chip
                label="ACTIVE DEFENSE"
                size="small"
                sx={{ bgcolor: 'rgba(34,197,94,0.12)', color: SAFE, fontWeight: 900, fontSize: '0.65rem' }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>
              {activeWorkflow.description}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={3}>
            <Box textAlign="right">
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 700 }}>
                NODES IN DAG
              </Typography>
              <Typography variant="h6" sx={{ fontFamily: 'JetBrains Mono', fontWeight: 900, color: 'text.primary' }}>
                {activeWorkflow.nodes.length} Stages
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem sx={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }} />
            <Box textAlign="right">
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 700 }}>
                TRIGGERS DETECTED
              </Typography>
              <Typography variant="h6" sx={{ fontFamily: 'JetBrains Mono', fontWeight: 900, color: WARN }}>
                {activeWorkflow.trigger_count}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* ── MAIN WORKFLOW CANVAS & INSPECTOR ─────────────────────────────── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 380px' },
          gap: 3,
        }}
      >
        {/* GRAPH WORKFLOW CANVAS */}
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
              <CircularProgress sx={{ color: CYAN }} />
            </Box>
          ) : activeWorkflow ? (
            <Box sx={{ width: '100%', minWidth: 1100, height: 520, position: 'relative' }}>
              {/* Connecting Bezier Curves */}
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
                    id="flow-arrow"
                    markerWidth="8"
                    markerHeight="6"
                    refX="7"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill={isDark ? 'rgba(255,255,255,0.3)' : '#94A3B8'} />
                  </marker>
                </defs>

                {activeWorkflow.edges.map((edge) => {
                  const s = activeWorkflow.nodes.find(n => n.id === edge.source);
                  const t = activeWorkflow.nodes.find(n => n.id === edge.target);
                  if (!s || !t) return null;

                  const sX = s.x + 190;
                  const sY = s.y + 40;
                  const tX = t.x;
                  const tY = t.y + 40;

                  const c1X = sX + (tX - sX) * 0.5;
                  const c1Y = sY;
                  const c2X = sX + (tX - sX) * 0.5;
                  const c2Y = tY;

                  return (
                    <g key={edge.id}>
                      <path
                        d={`M ${sX} ${sY} C ${c1X} ${c1Y}, ${c2X} ${c2Y}, ${tX} ${tY}`}
                        fill="none"
                        stroke={isDark ? 'rgba(255,255,255,0.25)' : '#94A3B8'}
                        strokeWidth="2"
                        markerEnd="url(#flow-arrow)"
                      />
                      {edge.label && (
                        <text
                          x={(sX + tX) / 2}
                          y={(sY + tY) / 2 - 8}
                          fill={isDark ? 'rgba(255,255,255,0.6)' : '#475569'}
                          fontSize="9.5"
                          fontWeight="700"
                          fontFamily="JetBrains Mono, monospace"
                          textAnchor="middle"
                        >
                          {edge.label}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Render Nodes */}
              {activeWorkflow.nodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const catColor = getCategoryColor(node.category);

                return (
                  <Box
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    sx={{
                      position: 'absolute',
                      left: node.x,
                      top: node.y,
                      width: 190,
                      p: 1.8,
                      borderRadius: 3,
                      cursor: 'pointer',
                      bgcolor: isDark ? '#0D111A' : '#FFFFFF',
                      border: `2px solid ${node.status === 'running' ? CYAN : isSelected ? '#3B82F6' : catColor}`,
                      boxShadow: node.status === 'running'
                        ? '0 0 24px rgba(6, 182, 212, 0.6)'
                        : isSelected
                        ? '0 0 20px rgba(59, 130, 246, 0.4)'
                        : `0 4px 16px ${catColor}15`,
                      transition: 'all 0.2s ease',
                      zIndex: isSelected ? 10 : 2,
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 24px ${catColor}33`,
                      },
                    }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: 2,
                          bgcolor: `${catColor}18`,
                          color: catColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {getCategoryIcon(node.category)}
                      </Box>
                      <Chip
                        label={node.category.toUpperCase()}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.62rem',
                          fontWeight: 900,
                          bgcolor: `${catColor}22`,
                          color: catColor,
                        }}
                      />
                    </Box>

                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        color: 'text.primary',
                        display: 'block',
                        lineHeight: 1.3,
                        mb: 0.8,
                      }}
                    >
                      {node.title}
                    </Typography>

                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: 'text.secondary' }}>
                        {node.action_type.split('_')[0]}
                      </Typography>
                      {node.status === 'success' && (
                        <CheckCircle sx={{ fontSize: 16, color: SAFE }} />
                      )}
                      {node.status === 'running' && (
                        <CircularProgress size={14} sx={{ color: CYAN }} />
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ) : null}
        </Paper>

        {/* ── WORKFLOW INSPECTOR & SIMULATION TRACE ───────────────────────── */}
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
          {simResult ? (
            <Box>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle1" sx={{ fontFamily: 'Outfit', fontWeight: 900, color: 'text.primary' }}>
                  Execution Simulation Trace
                </Typography>
                <Chip
                  label={`${simResult.total_duration_ms} ms`}
                  size="small"
                  sx={{ bgcolor: 'rgba(34,197,94,0.15)', color: SAFE, fontWeight: 900 }}
                />
              </Box>

              <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2.5, fontSize: '0.78rem' }}>
                {simResult.summary}
              </Alert>

              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 1 }}>
                STEP-BY-STEP LATENCY AUDIT:
              </Typography>

              <Stack spacing={1.2} sx={{ maxHeight: 380, overflowY: 'auto' }}>
                {simResult.steps_executed.map((st, sidx) => (
                  <Box key={sidx} sx={{ p: 1.5, borderRadius: 2.5, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.78rem', color: 'text.primary' }}>
                        {sidx + 1}. {st.node_title}
                      </Typography>
                      <Typography sx={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: CYAN, fontWeight: 700 }}>
                        {st.duration_ms}ms
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                      {st.output_message}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          ) : selectedNode ? (
            <Box>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 2,
                      bgcolor: `${getCategoryColor(selectedNode.category)}18`,
                      color: getCategoryColor(selectedNode.category),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {getCategoryIcon(selectedNode.category)}
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>
                    Node Configuration
                  </Typography>
                </Box>
                <Chip
                  label={selectedNode.category.toUpperCase()}
                  size="small"
                  sx={{
                    fontWeight: 900,
                    fontSize: '0.65rem',
                    bgcolor: `${getCategoryColor(selectedNode.category)}22`,
                    color: getCategoryColor(selectedNode.category),
                  }}
                />
              </Box>

              <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 800, mb: 1 }}>
                {selectedNode.title}
              </Typography>

              <Divider sx={{ my: 2, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />

              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 0.5 }}>
                    Action Type Identifier
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'JetBrains Mono', p: 1, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F1F5F9' }}>
                    {selectedNode.action_type}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 0.5 }}>
                    Parameters & Thresholds
                  </Typography>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F1F5F9', fontFamily: 'JetBrains Mono', fontSize: '0.74rem' }}>
                    {JSON.stringify(selectedNode.config, null, 2)}
                  </Box>
                </Box>
              </Stack>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', py: 8 }}>
              <Tune sx={{ fontSize: 44, color: 'text.secondary', opacity: 0.4, mb: 1.5 }} />
              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                Select any node in the visual playbook canvas to inspect and calibrate its parameters.
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      {/* ── GENERATE WITH RAKSHA AI MODAL ────────────────────────────────── */}
      <Dialog
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            bgcolor: isDark ? '#0A0C13' : '#FFFFFF',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`,
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AutoAwesome sx={{ color: CYAN }} />
          <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 900 }}>
            Generate Playbook with Raksha AI
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Describe the security response logic in natural language. Raksha AI will compile triggers, conditions, and containment actions into a visual execution graph.
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="e.g., If an unauthorized USB drive contains executable files after 8 PM, isolate the host and terminate any running PowerShell scripts..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                fontFamily: 'inherit',
                fontSize: '0.9rem',
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAiModalOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={aiGenerating || !aiPrompt.trim()}
            onClick={handleAiGenerate}
            startIcon={aiGenerating ? <CircularProgress size={16} sx={{ color: '#000' }} /> : <AutoAwesome />}
            sx={{
              bgcolor: CYAN,
              color: '#000',
              fontWeight: 800,
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': { bgcolor: '#0891B2' },
            }}
          >
            {aiGenerating ? 'Synthesizing Flow...' : 'Generate Playbook'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── ADD NODE MODAL ──────────────────────────────────────────────── */}
      <Dialog
        open={addNodeModalOpen}
        onClose={() => setAddNodeModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            bgcolor: isDark ? '#0A0C13' : '#FFFFFF',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`,
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 900 }}>
          Add Custom Node to Canvas
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Node Title"
              size="small"
              fullWidth
              value={newNodeTitle}
              onChange={(e) => setNewNodeTitle(e.target.value)}
              placeholder="e.g. Block External C2 IP"
            />

            <Select
              size="small"
              fullWidth
              value={newNodeCategory}
              onChange={(e) => setNewNodeCategory(e.target.value as any)}
            >
              <MenuItem value="trigger">Trigger (Event Signal)</MenuItem>
              <MenuItem value="condition">Condition (Filter / Rule)</MenuItem>
              <MenuItem value="action">Action (Containment Response)</MenuItem>
              <MenuItem value="ai">AI Decision (Raksha AI)</MenuItem>
            </Select>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddNodeModalOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!newNodeTitle.trim()}
            onClick={handleAddNode}
            sx={{
              bgcolor: CR,
              color: '#FFF',
              fontWeight: 800,
              textTransform: 'none',
              borderRadius: 2,
            }}
          >
            Add to Canvas
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RakshaFlowStudio;
