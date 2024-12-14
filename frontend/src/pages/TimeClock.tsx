import React from 'react';
import { 
  Paper, 
  Typography, 
  Button, 
  TextField, 
  Box,
  Card,
  CardContent,
  Grid
} from '@mui/material';

const TimeClock: React.FC = () => {
  return (
    <Grid container spacing={3}>
      {/* Status Card */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Current Status: Not Clocked In
            </Typography>
            <Typography variant="body1">
              Last clock-in: Never
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Clock In/Out Section */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Button 
              variant="contained" 
              color="primary" 
              size="large" 
              fullWidth
            >
              Clock In
            </Button>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Notes"
            variant="outlined"
            placeholder="Enter any notes about your work session..."
          />
        </Paper>
      </Grid>

      {/* Current Session Info */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Current Session
          </Typography>
          <Typography variant="body1">
            Duration: 00:00:00
          </Typography>
          <Typography variant="body1">
            Started: --
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default TimeClock; 