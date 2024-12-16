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
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TimeHistory from '../components/TimeHistory';
import { GridPaginationModel } from '@mui/x-data-grid';
import { TimeEntry } from '../components/TimeHistory';
import { TimeHistoryFilters } from '../components/TimeHistory';

interface ApiError {
  status: string;
  message: string;
  errors?: Array<{
    code: string;
    message: string;
    field?: string;
  }>;
}

interface TimeHistoryData {
  entries: TimeEntry[];
  todayTotal: string;
  weekTotal: string;
  totalCount: number;
}

const TimeClock: React.FC = () => {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState('00:00:00');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [timeHistory, setTimeHistory] = useState<TimeHistoryData>({
    entries: [],
    todayTotal: '0:00',
    weekTotal: '0:00',
    totalCount: 0
  });
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10
  });
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [filters, setFilters] = useState<TimeHistoryFilters>({
    startDate: null,
    endDate: null,
    status: '',
    searchTerm: '',
    minDuration: null,
    maxDuration: null,
    hasBreak: null,
    project: '',
    task: '',
    durationRange: [0, 12],
    hasNotes: null,
    projects: [],
    tasks: [],
    dateRange: 'today'
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<'approve' | 'reject'>('approve');
  const [approvalNotes, setApprovalNotes] = useState('');

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

  const fetchTimeHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: (paginationModel.page + 1).toString(),
        limit: paginationModel.pageSize.toString()
      });

      Object.entries(filters).forEach(([key, value]) => {
        if (value != null && value !== '') {
          if (value instanceof Date) {
            queryParams.append(key, value.toISOString());
          } else {
            queryParams.append(key, String(value));
          }
        }
      });

      const response = await fetch(
        `http://localhost:3002/api/time/entries?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch time history');

      const data = await response.json();
      
      // Calculate totals
      const today = new Date().toDateString();
      const todayEntries = data.entries.filter((entry: TimeEntry) => 
        new Date(entry.clock_in).toDateString() === today
      );

      const todayTotal = todayEntries.reduce((total: number, entry: TimeEntry) => {
        if (entry.clock_out) {
          const duration = new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime();
          return total + duration;
        }
        return total;
      }, 0);

      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const weekEntries = data.entries.filter((entry: TimeEntry) => 
        new Date(entry.clock_in) >= weekStart
      );

      const weekTotal = weekEntries.reduce((total: number, entry: TimeEntry) => {
        if (entry.clock_out) {
          const duration = new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime();
          return total + duration;
        }
        return total;
      }, 0);

      setTimeHistory({
        entries: data.entries,
        todayTotal: formatDuration(todayTotal),
        weekTotal: formatDuration(weekTotal),
        totalCount: data.total
      });
    } catch (error) {
      console.error('Failed to fetch time history:', error);
      setError({
        status: 'error',
        message: 'Failed to load time history'
      });
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    fetchTimeHistory();
  }, [paginationModel, filters]);

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
      await fetchTimeHistory();
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
      await fetchTimeHistory();
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

  const handleFilterChange = (newFilters: Partial<TimeHistoryFilters>) => {
    setFilters((prev: TimeHistoryFilters) => ({ ...prev, ...newFilters }));
    setPaginationModel((prev: GridPaginationModel) => ({ ...prev, page: 0 }));
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      status: '',
      searchTerm: '',
      minDuration: null,
      maxDuration: null,
      hasBreak: null,
      project: '',
      task: '',
      durationRange: [0, 12],
      hasNotes: null,
      projects: [],
      tasks: [],
      dateRange: 'today'
    });
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  };

  const handleEditEntry = async (entry: TimeEntry) => {
    setSelectedEntry(entry);
    setEditNotes(entry.notes || '');
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedEntry) return;

    try {
      const response = await fetch(`/api/time/current`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          notes: editNotes
        })
      });

      if (!response.ok) throw new Error('Failed to update entry');

      setEditDialogOpen(false);
      await fetchTimeHistory();
    } catch (error) {
      console.error('Failed to update entry:', error);
      // Handle error
    }
  };

  const handleApproveEntry = async (entry: TimeEntry) => {
    setSelectedEntry(entry);
    setApprovalStatus('approve');
    setApprovalNotes('');
    setApprovalDialogOpen(true);
  };

  const handleRejectEntry = async (entry: TimeEntry) => {
    setSelectedEntry(entry);
    setApprovalStatus('reject');
    setApprovalNotes('');
    setApprovalDialogOpen(true);
  };

  const handleApprovalSubmit = async () => {
    if (!selectedEntry) return;

    try {
      const response = await fetch(`/api/time/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          timeEntryIds: [selectedEntry.id],
          status: approvalStatus,
          notes: approvalNotes
        })
      });

      if (!response.ok) throw new Error('Failed to update status');

      setApprovalDialogOpen(false);
      await fetchTimeHistory();
    } catch (error) {
      console.error('Failed to update status:', error);
      // Handle error
    }
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

      <Grid item xs={12}>
        <TimeHistory 
          entries={timeHistory.entries}
          todayTotal={timeHistory.todayTotal}
          weekTotal={timeHistory.weekTotal}
          totalCount={timeHistory.totalCount}
          paginationModel={paginationModel}
          isLoading={isHistoryLoading}
          onPaginationModelChange={setPaginationModel}
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          onEditEntry={handleEditEntry}
          onApproveEntry={handleApproveEntry}
          onRejectEntry={handleRejectEntry}
          userRole="manager" // Or get from auth context
        />
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Time Entry</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Notes"
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onClose={() => setApprovalDialogOpen(false)}>
        <DialogTitle>
          {approvalStatus === 'approve' ? 'Approve' : 'Reject'} Time Entry
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Notes"
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleApprovalSubmit} 
            variant="contained"
            color={approvalStatus === 'approve' ? 'primary' : 'error'}
          >
            {approvalStatus === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default TimeClock; 
