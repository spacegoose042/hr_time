import React from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Chip,
  TablePagination,
  LinearProgress
} from '@mui/material';

interface TimeEntry {
  id: string;
  clock_in: string;
  clock_out: string | null;
  notes: string;
  status: 'pending' | 'approved' | 'rejected';
  duration?: string;
}

interface TimeHistoryProps {
  entries: TimeEntry[];
  todayTotal: string;
  weekTotal: string;
  totalCount: number;
  page: number;
  rowsPerPage: number;
  isLoading?: boolean;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
}

const TimeHistory: React.FC<TimeHistoryProps> = ({ 
  entries, 
  todayTotal, 
  weekTotal,
  totalCount,
  page,
  rowsPerPage,
  isLoading = false,
  onPageChange,
  onRowsPerPageChange
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'warning';
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    onPageChange(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    onRowsPerPageChange(parseInt(event.target.value, 10));
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6" gutterBottom>
          Time History
        </Typography>
        <Box>
          <Chip 
            label={`Today: ${todayTotal}`} 
            color="primary" 
            sx={{ mr: 1 }}
          />
          <Chip 
            label={`This Week: ${weekTotal}`} 
            color="secondary"
          />
        </Box>
      </Box>

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Clock In</TableCell>
              <TableCell>Clock Out</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>
                  {new Date(entry.clock_in).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {new Date(entry.clock_in).toLocaleTimeString()}
                </TableCell>
                <TableCell>
                  {entry.clock_out 
                    ? new Date(entry.clock_out).toLocaleTimeString()
                    : '---'
                  }
                </TableCell>
                <TableCell>{entry.duration || '---'}</TableCell>
                <TableCell>
                  <Chip 
                    label={entry.status}
                    size="small"
                    color={getStatusColor(entry.status)}
                  />
                </TableCell>
                <TableCell>
                  {entry.notes?.substring(0, 50)}
                  {entry.notes?.length > 50 ? '...' : ''}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </Paper>
  );
};

export default TimeHistory; 