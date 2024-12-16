import { useState, useEffect } from 'react';
import { 
  DataGrid, 
  GridColDef,
  GridRenderCellParams,
  GridRowParams,
  GridPaginationModel
} from '@mui/x-data-grid';
import { Box, Paper, Typography } from '@mui/material';
import { format } from 'date-fns';

export interface TimeEntry {
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
    valueFormatter: (params: GridRenderCellParams) => format(new Date(params.value), 'PPpp')
  },
  {
    field: 'clock_out',
    headerName: 'Clock Out',
    width: 200,
    valueFormatter: (params: GridRenderCellParams) => 
      params.value ? format(new Date(params.value), 'PPpp') : 'Not clocked out'
  },
  {
    field: 'duration',
    headerName: 'Duration',
    width: 150,
    valueGetter: (params: GridRenderCellParams) => {
      if (!params.row.clock_out) return 'In progress';
      const start = new Date(params.row.clock_in);
      const end = new Date(params.row.clock_out);
      const diffMs = end.getTime() - start.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    }
  },
  {
    field: 'break_minutes',
    headerName: 'Break',
    width: 100,
    valueFormatter: (params: GridRenderCellParams) => 
      params.value ? `${params.value} min` : 'No break'
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    valueFormatter: (params: GridRenderCellParams) => 
      params.value.charAt(0).toUpperCase() + params.value.slice(1)
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
    valueFormatter: (params: GridRenderCellParams) => 
      params.value || 'No notes'
  }
];

interface TimeHistoryProps {
  entries: TimeEntry[];
  todayTotal: string;
  weekTotal: string;
  totalCount: number;
  paginationModel: GridPaginationModel;
  isLoading: boolean;
  onPaginationModelChange: (model: GridPaginationModel) => void;
}

export default function TimeHistory({
  entries,
  isLoading,
  paginationModel,
  onPaginationModelChange
}: TimeHistoryProps) {
  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          Time Entry History
        </Typography>
        <DataGrid
          rows={entries}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[5, 10, 25, 50]}
          paginationModel={paginationModel}
          onPaginationModelChange={onPaginationModelChange}
          autoHeight
          disableRowSelectionOnClick
          getRowClassName={(params: GridRowParams<TimeEntry>) => {
            if (!params.row.clock_out) return 'in-progress';
            return '';
          }}
        />
      </Paper>
    </Box>
  );
} 
