import React from 'react';
import { Box, Container, Typography, Grid } from '@mui/material';

const CR = '#DC2626';

const TimelineEvent: React.FC<{ time: string; title: string; isDark: boolean; isAlert?: boolean; isLast?: boolean }> = ({ time, title, isDark, isAlert, isLast }) => (
  <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2.5 }, position: 'relative', pb: isLast ? 0 : 3.5 }}>
    <Typography sx={{ width: 44, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: isDark ? 'rgba(255,255,255,0.4)' : '#94A3B8', pt: 0.3, flexShrink: 0 }}>
      {time}
    </Typography>
    <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: isAlert ? CR : (isDark ? '#333' : '#E2E8F0'), border: isDark ? '2px solid #0A0B0F' : '2px solid #FFFFFF', mt: 0.6, flexShrink: 0, boxShadow: isAlert ? `0 0 10px ${CR}` : 'none' }} />
      <Box>
        <Typography sx={{ color: isAlert ? CR : (isDark ? '#FFFFFF' : '#0B0B0F'), fontWeight: isAlert ? 800 : 600, fontSize: { xs: '0.88rem', sm: '1rem' }, mb: 0.5 }}>
          {title}
        </Typography>
        {isAlert && (
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Box sx={{ px: 1, py: 0.25, borderRadius: 1, bgcolor: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)' }}>
              <Typography sx={{ color: CR, fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.05em' }}>RISK ELEVATED</Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  </Box>
);

const SupportBlock: React.FC<{ label: string; color: string; title: string; desc: string; isDark: boolean }> = ({ label, color, title, desc, isDark }) => (
  <Box
    sx={{
      p: { xs: 2.5, sm: 3 },
      borderRadius: 2,
      bgcolor: isDark ? '#0A0B0F' : '#FFFFFF',
      border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color }} />
      <Typography sx={{ color, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {label}
      </Typography>
    </Box>
    <Typography sx={{ color: isDark ? '#FFFFFF' : '#0B0B0F', fontSize: '1.25rem', fontWeight: 800, mb: 1, fontFamily: 'Outfit, sans-serif' }}>
      {title}
    </Typography>
    <Typography sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#64748B', fontSize: '0.95rem', lineHeight: 1.6, flexGrow: 1 }}>
      {desc}
    </Typography>
  </Box>
);

export const ThreatDetection: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  return (
    <Box sx={{ py: { xs: 8, md: 16 }, bgcolor: 'transparent' }}>
      <Container maxWidth="xl">
        <Grid container spacing={{ xs: 3, lg: 6 }}>
          
          {/* LEFT: Large Feature (60%) */}
          <Grid item xs={12} lg={7}>
            <Box
              sx={{
                p: { xs: 2.5, sm: 4, md: 6 },
                borderRadius: 4,
                bgcolor: isDark ? '#0A0B0F' : '#FFFFFF',
                border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.4)' : '0 20px 40px rgba(15,23,42,0.05)',
                height: '100%',
              }}
            >
              <Typography sx={{ color: CR, fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.15em', mb: 2 }}>
                CORE CAPABILITY
              </Typography>
              <Typography variant="h3" sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' }, color: isDark ? '#FFFFFF' : '#0B0B0F', mb: 2 }}>
                Threat Detection
              </Typography>
              <Typography sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#475569', fontSize: { xs: '0.95rem', sm: '1.1rem' }, mb: { xs: 3, md: 5 }, maxWidth: 480 }}>
                KAVACH doesn't just log events. It actively pieces together the attack chain across endpoints and networks in real-time.
              </Typography>

              {/* Event Timeline Mockup */}
              <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 2, bgcolor: isDark ? '#11131A' : '#F8FAFC', border: isDark ? '1px solid rgba(255,255,255,0.02)' : '1px solid rgba(0,0,0,0.02)' }}>
                <TimelineEvent time="09:41" title="Process Activity: wscript.exe spawned" isDark={isDark} />
                <TimelineEvent time="09:42" title="Network Anomaly: Outbound connection to unknown ASN" isDark={isDark} />
                <TimelineEvent time="09:42" title="Suspicious PowerShell Execution: Encoded command" isDark={isDark} isAlert />
                <TimelineEvent time="09:43" title="Threat Correlated: Potential C2 beaconing" isDark={isDark} isAlert />
                <TimelineEvent time="09:43" title="Risk Elevated: Isolation playbook triggered" isDark={isDark} isLast />
              </Box>
            </Box>
          </Grid>

          {/* RIGHT: Supporting Capabilities (40%) */}
          <Grid item xs={12} lg={5}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
              <SupportBlock
                label="INCIDENT RESPONSE" color="#3B82F6"
                title="Automated SOAR Playbooks"
                desc="Execute pre-defined remediation workflows the moment a critical threat is correlated, isolating hosts before damage occurs."
                isDark={isDark}
              />
              <SupportBlock
                label="THREAT INTELLIGENCE" color="#F59E0B"
                title="Global IOC Correlation"
                desc="Automatically map local telemetry against global threat intelligence feeds to instantly identify known bad actors and infrastructure."
                isDark={isDark}
              />
              <SupportBlock
                label="ENDPOINT MONITORING" color="#10B981"
                title="Continuous Telemetry"
                desc="16 distinct security engines monitor everything from file integrity and network connections to registry changes and USB devices."
                isDark={isDark}
              />
            </Box>
          </Grid>

        </Grid>
      </Container>
    </Box>
  );
};
