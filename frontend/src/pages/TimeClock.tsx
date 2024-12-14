import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  Button, 
  TextField, 
  Box,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Backdrop,
  Alert,
  Snackbar,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface TimeEntry {
  id: string;
  clock_in: string;
  clock_out: string | null;
  notes: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface ApiError {
  status: string;
  message: string;
  errors?: Array<{
    code: string;
    message: string;
    field?: string;
  }>;
}

const TimeClock: React.FC = () => {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState('00:00:00');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    const checkCurrentStatus = async () => {
      try {
        const response = await fetch('http://localhost:3002/api/time/current', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          setError({
            status: 'error',
            message: 'Failed to load current status'
          });
          throw new Error('Failed to fetch current status');
        }

        const data = await response.json();
        if (data.status === 'clocked_in') {
          setCurrentEntry(data.timeEntry);
          setIsClockedIn(true);
          setNotes(data.timeEntry.notes || '');
        }
      } catch (error) {
        console.error('Failed to fetch status:', error);
        setError({
          status: 'error',
          message: 'Failed to load current status'
        });
      } finally {
        setIsInitializing(false);
      }
    };

    checkCurrentStatus();
  }, []);

  const handleClockIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3002/api/time/clock-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ notes })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(JSON.stringify({
          status: 'error',
          message: data.message || 'Failed to clock in',
          errors: data.errors
        }));
      }

      setCurrentEntry(data);
      setIsClockedIn(true);
    } catch (error) {
      console.error('Clock in failed:', error);
      try {
        const errorData: ApiError = JSON.parse(error instanceof Error ? error.message : '{}');
        setError(errorData);
      } catch {
        setError({
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to clock in',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockOut = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3002/api/time/clock-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ notes })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(JSON.stringify({
          status: 'error',
          message: data.message || 'Failed to clock out',
          errors: data.errors
        }));
      }

      setCurrentEntry(null);
      setIsClockedIn(false);
      setNotes('');
    } catch (error) {
      console.error('Clock out failed:', error);
      try {
        const errorData: ApiError = JSON.parse(error instanceof Error ? error.message : '{}');
        setError(errorData);
      } catch {
        setError({
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to clock out'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleErrorClose = () => {
    setError(null);
  };

  const getErrorMessage = (error: ApiError) => {
    if (error.errors && error.errors.length > 0) {
      return (
        <Box>
          <Typography variant="body1" gutterBottom>
            {error.message}
          </Typography>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {error.errors.map((err, index) => (
              <li key={index}>
                {err.field ? `${err.field}: ` : ''}{err.message}
              </li>
            ))}
          </ul>
        </Box>
      );
    }
    return error.message;
  };

  if (isInitializing) {
    return (
      <Backdrop open={true} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
    );
  }

  return (
    <Grid container spacing={3}>
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleErrorClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="error"
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleErrorClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
          sx={{ width: '100%', mb: 2 }}
        >
          {error && getErrorMessage(error)}
        </Alert>
      </Snackbar>

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
          <Box sx={{ mb: 3, position: 'relative' }}>
            <Button 
              variant="contained" 
              color={isClockedIn ? "secondary" : "primary"}
              size="large" 
              fullWidth
              onClick={isClockedIn ? handleClockOut : handleClockIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                isClockedIn ? 'Clock Out' : 'Clock In'
              )}
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
            disabled={isLoading}
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