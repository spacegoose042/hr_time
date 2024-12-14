import React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';

interface PasswordStrengthMeterProps {
  password: string;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const calculateStrength = (password: string): number => {
    let score = 0;
    
    // Length
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    
    // Character types
    if (/[A-Z]/.test(password)) score += 20;
    if (/[a-z]/.test(password)) score += 20;
    if (/[0-9]/.test(password)) score += 20;
    if (/[^A-Za-z0-9]/.test(password)) score += 20;
    
    return Math.min(100, score);
  };

  const getColor = (score: number): string => {
    if (score < 40) return '#f44336';
    if (score < 70) return '#ff9800';
    return '#4caf50';
  };

  const getLabel = (score: number): string => {
    if (score < 40) return 'Weak';
    if (score < 70) return 'Medium';
    return 'Strong';
  };

  const strength = calculateStrength(password);

  return (
    <Box sx={{ mt: 1 }}>
      <LinearProgress
        variant="determinate"
        value={strength}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: '#eee',
          '& .MuiLinearProgress-bar': {
            bgcolor: getColor(strength)
          }
        }}
      />
      <Typography
        variant="caption"
        sx={{
          mt: 0.5,
          display: 'block',
          color: getColor(strength)
        }}
      >
        Password Strength: {getLabel(strength)}
      </Typography>
    </Box>
  );
};

export default PasswordStrengthMeter; 