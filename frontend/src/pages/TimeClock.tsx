import React, { useState, useEffect } from 'react';
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

interface TimeEntry {
  id: string;
  clock_in: string;
  clock_out: string | null;
  notes: string;
  status: 'pending' | 'approved' | 'rejected';
}

const TimeClock: React.FC = () => {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState('00:00:00');

  const handleClockIn = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/time/clock-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add your auth token here
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ notes })
      });

      if (!response.ok) throw new Error('Failed to clock in');

      const data = await response.json();
      setCurrentEntry(data);
      setIsClockedIn(true);
    } catch (error) {
      console.error('Clock in failed:', error);
      // Add error handling here
    }
  };

  const handleClockOut = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/time/clock-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ notes })
      });

      if (!response.ok) throw new Error('Failed to clock out');

      setCurrentEntry(null);
      setIsClockedIn(false);
      setNotes('');
    } catch (error) {
      console.error('Clock out failed:', error);
      // Add error handling here
    }
  };

  // Update timer every second when clocked in
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isClockedIn && currentEntry) {
      intervalId = setInterval(() => {
        const start = new Date(currentEntry.clock_in).getTime();
        const now = new Date().getTime();
        const diff = now - start;

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setDuration(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);
    }

    return () => clearInterval(intervalId);
  }, [isClockedIn, currentEntry]);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Current Status: {isClockedIn ? 'Clocked In' : 'Not Clocked In'}
            </Typography>
            <Typography variant="body1">
              {currentEntry 
                ? `Started: ${new Date(currentEntry.clock_in).toLocaleString()}`
                : 'Last clock-in: Never'
              }
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Button 
              variant="contained" 
              color={isClockedIn ? "secondary" : "primary"}
              size="large" 
              fullWidth
              onClick={isClockedIn ? handleClockOut : handleClockIn}
            >
              {isClockedIn ? 'Clock Out' : 'Clock In'}
            </Button>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Notes"
            variant="outlined"
            placeholder="Enter any notes about your work session..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Current Session
          </Typography>
          <Typography variant="body1">
            Duration: {duration}
          </Typography>
          <Typography variant="body1">
            Started: {currentEntry ? new Date(currentEntry.clock_in).toLocaleString() : '--'}
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default TimeClock; 