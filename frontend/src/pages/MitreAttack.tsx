import React, { useState } from 'react';
import {
  Box, Typography, CardContent, Button, Chip,
  Divider, Drawer, useTheme, Card
} from '@mui/material';
import { CheckCircle, Warning, Help } from '@mui/icons-material';
import { GlassCard } from '../components/common/GlassCard';

const TACTICS = [
  'Initial Access',
  'Execution',
  'Persistence',
  'Privilege Escalation',
  'Defense Evasion',
  'Credential Access',
  'Lateral Movement'
];

const TECHNIQUES: Record<string, { id: string; name: string; status: 'covered' | 'partial' | 'uncovered'; count: number; desc: string; rule: string }[]> = {
  'Initial Access': [
    { id: 'T1190', name: 'Exploit Public Application', status: 'covered', count: 4, desc: 'Adversaries may attempt to exploit public facing applications to gain access.', rule: 'WAF log injection detection + exploit signature matching' },
    { id: 'T1566', name: 'Phishing', status: 'covered', count: 12, desc: 'Email link harvesting, credential harvesting or malicious attachments.', rule: 'Email gateway attachment sandboxing & URL reputation analysis' },
  ],
  'Execution': [
    { id: 'T1059', name: 'Command & Script Interpreter', status: 'covered', count: 8, desc: 'Execution of commands or code in shell instances.', rule: 'PowerShell/Bash shell execution telemetry logging + script block analysis' },
    { id: 'T1204', name: 'User Execution', status: 'partial', count: 2, desc: 'Requiring local user interaction to launch binary files.', rule: 'Endpoint tracking on directory download script triggers' }
  ],
  'Persistence': [
    { id: 'T1053', name: 'Scheduled Task/Job', status: 'covered', count: 3, desc: 'Abuse scheduled tasks for continuous malware execution.', rule: 'Task scheduler event ID 106 and 140 telemetry capture' },
    { id: 'T1543', name: 'Create/Modify System Process', status: 'uncovered', count: 0, desc: 'Registering malware components as services.', rule: 'Rule coverage not active. Deploy OSSEC system monitoring.' }
  ],
  'Privilege Escalation': [
    { id: 'T1548', name: 'Abuse Elevation Control', status: 'partial', count: 4, desc: 'Bypassing user access controls or sudo permissions.', rule: 'Sudoers file modification audit logs + UAC bypass behavior signature' }
  ],
  'Defense Evasion': [
    { id: 'T1070', name: 'Indicator Removal', status: 'covered', count: 6, desc: 'Clearing logs or shell history files.', rule: 'Auditing command executions containing rm -rf or Clear-EventLog' },
    { id: 'T1562', name: 'Impair Defenses', status: 'uncovered', count: 0, desc: 'Disabling antivirus or firewall configurations.', rule: 'No direct alert coverage. System health monitoring alerts only.' }
  ],
  'Credential Access': [
    { id: 'T1003', name: 'OS Credential Dumping', status: 'covered', count: 9, desc: 'LSASS memory reading or SAM database copies.', rule: 'LSASS process read handle check + volume shadow copy detection' }
  ],
  'Lateral Movement': [
    { id: 'T1021', name: 'Remote Services', status: 'covered', count: 5, desc: 'Using Remote Desktop, WinRM, or SSH keys for movement.', rule: 'Intra-network logon session auditing + non-standard RDP ports check' }
  ]
};

export const MitreAttack: React.FC = () => {
  const [selectedTech, setSelectedTech] = useState<typeof TECHNIQUES['Initial Access'][0] | null>(null);
  const theme = useTheme();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'covered': return <CheckCircle fontSize="small" sx={{ color: 'success.main' }} />;
      case 'partial': return <Warning fontSize="small" sx={{ color: 'warning.main' }} />;
      default: return <Help fontSize="small" sx={{ color: 'error.main' }} />;
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={900} sx={{ fontFamily: 'Outfit' }}>
            MITRE ATT&CK Explorer
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Coverage analysis across tactical categories and automated detection validation
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Chip label="Covered (12)" size="small" icon={<CheckCircle sx={{ color: 'success.main !important' }} />} variant="outlined" />
          <Chip label="Partial (4)" size="small" icon={<Warning sx={{ color: 'warning.main !important' }} />} variant="outlined" />
          <Chip label="Uncovered (2)" size="small" icon={<Help sx={{ color: 'error.main !important' }} />} variant="outlined" />
        </Box>
      </Box>

      {/* Grid of Tactics columns */}
      <Box sx={{ overflowX: 'auto', pb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, minWidth: 1200 }}>
          {TACTICS.map((tactic) => (
            <Box key={tactic} sx={{ flex: 1, minWidth: 160 }}>
              <GlassCard sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)', p: 1.5, mb: 2 }}>
                <Typography variant="subtitle2" align="center" fontWeight="bold" noWrap>
                  {tactic}
                </Typography>
              </GlassCard>

              {/* Techniques list under each tactic */}
              <Box display="flex" flexDirection="column" gap={1.5}>
                {(TECHNIQUES[tactic] || []).map((tech) => (
                  <Card
                    key={tech.id}
                    onClick={() => setSelectedTech(tech)}
                    sx={{
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 4px 12px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.06)'}`,
                      },
                      borderLeft: `4px solid ${
                        tech.status === 'covered' ? theme.palette.success.main :
                        tech.status === 'partial' ? theme.palette.warning.main :
                        theme.palette.error.main
                      }`
                    }}
                  >
                    <CardContent sx={{ p: '12px !important' }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Typography variant="caption" color="text.secondary" fontWeight="bold">
                          {tech.id}
                        </Typography>
                        {getStatusIcon(tech.status)}
                      </Box>
                      <Typography variant="body2" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                        {tech.name}
                      </Typography>
                      {tech.count > 0 && (
                        <Chip
                          label={`${tech.count} Incidents`}
                          size="small"
                          sx={{ mt: 1, height: 16, fontSize: '0.65rem', fontWeight: 'bold' }}
                        />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Technique detail drawer */}
      <Drawer
        anchor="right"
        open={Boolean(selectedTech)}
        onClose={() => setSelectedTech(null)}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 400 }, p: 3, pt: 8 }
        }}
      >
        {selectedTech && (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" fontWeight="bold" sx={{ fontFamily: 'Outfit' }}>
                {selectedTech.id}
              </Typography>
              <Chip
                label={selectedTech.status.toUpperCase()}
                color={
                  selectedTech.status === 'covered' ? 'success' :
                  selectedTech.status === 'partial' ? 'warning' : 'error'
                }
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            </Box>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              {selectedTech.name}
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Description</Typography>
            <Typography variant="body2" paragraph sx={{ lineHeight: 1.6 }}>
              {selectedTech.desc}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>Active Detection Rule</Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontFamily: 'monospace', 
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', 
                p: 1.5, 
                borderRadius: 1.5, 
                border: `1px solid ${theme.palette.divider}`,
                mb: 4
              }}
            >
              {selectedTech.rule}
            </Typography>

            <Button
              variant="contained"
              fullWidth
              onClick={() => setSelectedTech(null)}
              sx={{ fontWeight: 'bold' }}
            >
              Close Details
            </Button>
          </Box>
        )}
      </Drawer>
    </Box>
  );
};
