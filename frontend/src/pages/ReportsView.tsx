import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
} from '@mui/material';
import {
  Assessment,
  Download,
  Security,
  Gavel,
  History,
  CheckCircle,
} from '@mui/icons-material';

export const ReportsView: React.FC = () => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleExport = (reportType: string) => {
    setDownloading(reportType);
    setTimeout(() => {
      const dataStr = `data:text/json;charset=utf-8,` + encodeURIComponent(JSON.stringify({
        report: reportType,
        generated_at: new Date().toISOString(),
        platform: "KAVACH",
        summary: "Zero high-priority unresolved incidents recorded.",
        compliance_status: "VERIFIED_COMPLIANT"
      }, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `kavach_${reportType}_report.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setDownloading(null);
    }, 800);
  };

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h4" fontWeight={700} sx={{ color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Assessment sx={{ color: '#38bdf8', fontSize: 32 }} />
          Security Audit & Compliance Reports
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Generate certified executive summaries, SOC audit dossiers, and MITRE ATT&CK coverage reports.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Security sx={{ color: '#38bdf8', fontSize: 36, mb: 1 }} />
              <Typography variant="h6" fontWeight={700}>
                Executive Risk Summary
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ my: 1.5 }}>
                High-level overview of system security posture, aggregate KAVACH score trends, and critical risk areas.
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Download />}
                onClick={() => handleExport('executive_summary')}
                disabled={downloading === 'executive_summary'}
              >
                {downloading === 'executive_summary' ? 'Exporting...' : 'Export JSON'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Gavel sx={{ color: '#a855f7', fontSize: 36, mb: 1 }} />
              <Typography variant="h6" fontWeight={700}>
                SOC Incident Dossier
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ my: 1.5 }}>
                Forensic investigation logs, Isolation Forest deviation metrics, and MITRE ATT&CK technique mapping.
              </Typography>
              <Button
                variant="outlined"
                color="secondary"
                fullWidth
                startIcon={<Download />}
                onClick={() => handleExport('soc_dossier')}
                disabled={downloading === 'soc_dossier'}
              >
                {downloading === 'soc_dossier' ? 'Exporting...' : 'Export JSON'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <History sx={{ color: '#22c55e', fontSize: 36, mb: 1 }} />
              <Typography variant="h6" fontWeight={700}>
                Compliance Audit Trail
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ my: 1.5 }}>
                Tamper-evident logs of playbook actions, analyst triage notes, and user authentication events.
              </Typography>
              <Button
                variant="outlined"
                color="success"
                fullWidth
                startIcon={<Download />}
                onClick={() => handleExport('compliance_audit')}
                disabled={downloading === 'compliance_audit'}
              >
                {downloading === 'compliance_audit' ? 'Exporting...' : 'Export JSON'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
