import React from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useThemeMode } from '../../context/ThemeContext';

import { HeroSection } from '../../components/home/HeroSection';
import { CapabilityStrip } from '../../components/home/CapabilityStrip';
import { PlatformShowcase } from '../../components/home/PlatformShowcase';
import { SecurityFlow } from '../../components/home/SecurityFlow';
import { ThreatDetection } from '../../components/home/ThreatDetection';
import { RakshaAiSection } from '../../components/home/RakshaAiSection';
import { IntelligenceGraph } from '../../components/home/IntelligenceGraph';
import { SecurityScore } from '../../components/home/SecurityScore';
import { ExperienceModes } from '../../components/home/ExperienceModes';
import { FinalCta } from '../../components/home/FinalCta';

export const Home: React.FC = () => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const navigate = useNavigate();

  return (
    <Box sx={{ bgcolor: 'transparent', minHeight: '100vh', transition: 'background-color 0.3s' }}>
      <HeroSection isDark={isDark} navigate={navigate} />
      <CapabilityStrip isDark={isDark} />
      <PlatformShowcase isDark={isDark} />
      <SecurityFlow isDark={isDark} />
      <ThreatDetection isDark={isDark} />
      <RakshaAiSection />
      <IntelligenceGraph isDark={isDark} />
      <SecurityScore isDark={isDark} />
      <ExperienceModes isDark={isDark} />
      <FinalCta isDark={isDark} navigate={navigate} />
    </Box>
  );
};
