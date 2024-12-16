import { useState, useEffect } from 'react';
import { DataGrid, GridColDef, GridValueFormatterParams, GridValueGetterParams } from '@mui/x-data-grid';
import { Box, Paper, Typography } from '@mui/material';
import { format } from 'date-fns';

interface TimeEntry {
  id: string;
  clock_in: string;
  clock_out: string | null;
  status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
  break_minutes: number | null;
  project?: string;
  task?: string;
}

const columns: GridColDef[] = [
  {
    field: 'clock_in',
    headerName: 'Clock In',
    width: 200,
    valueFormatter: (params: GridValueFormatterParams) => 
      format(new Date(params.value), 'PPpp'),
  },
  {
    field: 'clock_out',
    headerName: 'Clock Out',
    width: 200,
    valueFormatter: (params: GridValueFormatterParams) => 
      params.value ? format(new Date(params.value), 'PPpp') : 'Not clocked out',
  },
  {
    field: 'duration',
    headerName: 'Duration',
    width: 150,
    valueGetter: (params: GridValueGetterParams) => {
      if (!params.row.clock_out) return 'In progress';
      const start = new Date(params.row.clock_in);
      const end = new Date(params.row.clock_out);
      const diffMs = end.getTime() - start.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    },
  },
  {
    field: 'break_minutes',
    headerName: 'Break',
    width: 100,
    valueFormatter: (params: GridValueFormatterParams) => 
      params.value ? `${params.value} min` : 'No break',
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    valueFormatter: (params: GridValueFormatterParams) => 
      params.value.charAt(0).toUpperCase() + params.value.slice(1),
  },
  {
    field: 'project',
    headerName: 'Project',
    width: 150,
  },
  {
    field: 'task',
    headerName: 'Task',
    width: 150,
  },
  {
    field: 'notes',
    headerName: 'Notes',
    width: 300,
    valueFormatter: (params: GridValueFormatterParams) => 
      params.value || 'No notes',
  },
];

export default function TimeHistory() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTimeEntries = async () => {
      try {
        const response = await fetch('/api/time/entries', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch time entries');
        }

        const data = await response.json();
        setTimeEntries(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTimeEntries();
  }, []);

  if (error) {
    return (
      <Typography color="error" variant="h6">
        Error: {error}
      </Typography>
    );
  }

  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          Time Entry History
        </Typography>
        <DataGrid
          rows={timeEntries}
          columns={columns}
          loading={loading}
          pageSizeOptions={[5, 10, 25, 50]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}
          autoHeight
          disableRowSelectionOnClick
          getRowClassName={(params: { row: TimeEntry }) => {
            if (!params.row.clock_out) return 'in-progress';
            return '';
          }}
        />
      </Paper>
    </Box>
  );
} 
