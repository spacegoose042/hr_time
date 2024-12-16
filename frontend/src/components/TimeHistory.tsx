import { useState } from 'react';
import { 
  DataGrid, 
  GridColDef,
  GridRenderCellParams,
  GridRowParams,
  GridPaginationModel,
  GridFilterInputValue,
  GridFilterItem
} from '@mui/x-data-grid';
import { Box, Paper, Typography, Chip, Tooltip, IconButton, MenuItem, Menu, ListItemIcon, ListItemText } from '@mui/material';
import { format, formatDistanceToNow } from 'date-fns';
import TimeHistoryFilters from './TimeHistoryFilters';
import { 
  AccessTime as ClockIcon,
  Coffee as BreakIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Pending as PendingIcon,
  Info as InfoIcon,
  Edit as EditIcon,
  CheckCircleOutline as ApproveIcon,
  Block as RejectIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';

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

// Add status styling
const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved':
      return {
        backgroundColor: '#e8f5e9',
        color: '#2e7d32',
        borderColor: '#a5d6a7'
      };
    case 'rejected':
      return {
        backgroundColor: '#ffebee',
        color: '#c62828',
        borderColor: '#ef9a9a'
      };
    case 'pending':
    default:
      return {
        backgroundColor: '#fff3e0',
        color: '#ef6c00',
        borderColor: '#ffcc80'
      };
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'approved':
      return <ApprovedIcon fontSize="small" />;
    case 'rejected':
      return <RejectedIcon fontSize="small" />;
    default:
      return <PendingIcon fontSize="small" />;
  }
};

const formatDuration = (start: Date, end: Date | null, breakMinutes: number = 0) => {
  if (!end) return 'In progress';
  const diffMs = end.getTime() - start.getTime() - (breakMinutes * 60 * 1000);
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

const ActionCell = ({ 
  row,
  onEditEntry,
  onApproveEntry,
  onRejectEntry,
  userRole 
}: {
  row: TimeEntry;
  onEditEntry?: (entry: TimeEntry) => void;
  onApproveEntry?: (entry: TimeEntry) => void;
  onRejectEntry?: (entry: TimeEntry) => void;
  userRole?: 'employee' | 'manager' | 'admin';
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action: 'edit' | 'approve' | 'reject') => {
    handleClose();
    switch (action) {
      case 'edit':
        onEditEntry?.(row);
        break;
      case 'approve':
        onApproveEntry?.(row);
        break;
      case 'reject':
        onRejectEntry?.(row);
        break;
    }
  };

  return (
    <>
      <Tooltip title="Actions" arrow>
        <IconButton onClick={handleClick} size="small">
          <MoreIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={(e) => e.stopPropagation()}
      >
        {userRole === 'manager' && row.status === 'pending' && (
          <>
            <MenuItem onClick={() => handleAction('approve')}>
              <ListItemIcon>
                <ApproveIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Approve</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleAction('reject')}>
              <ListItemIcon>
                <RejectIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Reject</ListItemText>
            </MenuItem>
          </>
        )}
        {!row.clock_out && (
          <MenuItem onClick={() => handleAction('edit')}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

const createColumns = (
  onEditEntry?: (entry: TimeEntry) => void,
  onApproveEntry?: (entry: TimeEntry) => void,
  onRejectEntry?: (entry: TimeEntry) => void,
  userRole?: 'employee' | 'manager' | 'admin'
): GridColDef[] => [
  {
    field: 'clock_in',
    headerName: 'Clock In',
    width: 200,
    renderCell: (params: GridRenderCellParams) => (
      <Tooltip 
        title={`${formatDistanceToNow(new Date(params.value))} ago`}
        arrow
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ClockIcon fontSize="small" color="action" />
          {format(new Date(params.value), 'PPpp')}
        </Box>
      </Tooltip>
    )
  },
  {
    field: 'clock_out',
    headerName: 'Clock Out',
    width: 200,
    renderCell: (params: GridRenderCellParams) => {
      if (!params.value) return (
        <Tooltip title="Still clocked in" arrow>
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'warning.main' }}>
            <ClockIcon fontSize="small" sx={{ mr: 1 }} />
            Not clocked out
          </Box>
        </Tooltip>
      );
      
      return (
        <Tooltip 
          title={`Duration: ${formatDuration(
            new Date(params.row.clock_in),
            new Date(params.value),
            params.row.break_minutes
          )}`}
          arrow
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ClockIcon fontSize="small" color="action" />
            {format(new Date(params.value), 'PPpp')}
          </Box>
        </Tooltip>
      );
    }
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
    width: 120,
    renderCell: (params: GridRenderCellParams) => {
      if (!params.value) return 'No break';
      return (
        <Tooltip 
          title={params.row.break_notes || 'No break notes'}
          arrow
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BreakIcon fontSize="small" color="action" />
            {`${params.value} min`}
          </Box>
        </Tooltip>
      );
    }
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 150,
    filterOperators: [
      {
        label: 'Status',
        value: 'status',
        getApplyFilterFn: (filterItem: GridFilterItem) => {
          if (!filterItem.value) return null;
          return (params): boolean => params.value === filterItem.value;
        },
        InputComponent: GridFilterInputValue,
        InputComponentProps: {
          select: true,
          children: [
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' }
          ].map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))
        }
      }
    ],
    renderCell: (params: GridRenderCellParams) => {
      const status = params.value as string;
      const colors = getStatusColor(status);
      
      return (
        <Tooltip 
          title={`Last updated: ${format(new Date(params.row.updated_at || params.row.clock_in), 'PPpp')}`}
          arrow
        >
          <Chip
            icon={getStatusIcon(status)}
            label={status.charAt(0).toUpperCase() + status.slice(1)}
            size="small"
            sx={{
              ...colors,
              fontWeight: 500,
              '& .MuiChip-label': {
                px: 2
              }
            }}
          />
        </Tooltip>
      );
    }
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
    renderCell: (params: GridRenderCellParams) => {
      const notes = params.value as string;
      if (!notes) return 'No notes';
      
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography noWrap>{notes}</Typography>
          {notes.length > 40 && (
            <Tooltip title={notes} arrow>
              <IconButton size="small">
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      );
    }
  },
  {
    field: 'actions',
    headerName: 'Actions',
    width: 100,
    sortable: false,
    filterable: false,
    renderCell: (params: GridRenderCellParams) => (
      <ActionCell
        row={params.row}
        onEditEntry={onEditEntry}
        onApproveEntry={onApproveEntry}
        onRejectEntry={onRejectEntry}
        userRole={userRole}
      />
    )
  }
];

// Add row styling
const getRowStyle = (params: GridRowParams<TimeEntry>) => {
  let style = '';
  
  if (!params.row.clock_out) {
    style += 'in-progress';
  }
  
  if (params.row.break_minutes && params.row.break_minutes > 0) {
    style += ' has-break';
  }
  
  return style;
};

interface TimeHistoryProps {
  entries: TimeEntry[];
  todayTotal: string;
  weekTotal: string;
  totalCount: number;
  paginationModel: GridPaginationModel;
  isLoading: boolean;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  filters: {
    startDate: Date | null;
    endDate: Date | null;
    status: string;
    searchTerm: string;
  };
  onFilterChange: (filters: Partial<TimeHistoryProps['filters']>) => void;
  onClearFilters: () => void;
  onEditEntry?: (entry: TimeEntry) => void;
  onApproveEntry?: (entry: TimeEntry) => void;
  onRejectEntry?: (entry: TimeEntry) => void;
  userRole?: 'employee' | 'manager' | 'admin';
}

export default function TimeHistory({
  entries,
  todayTotal,
  weekTotal,
  totalCount,
  paginationModel,
  isLoading,
  onPaginationModelChange,
  filters,
  onFilterChange,
  onClearFilters,
  onEditEntry,
  onApproveEntry,
  onRejectEntry,
  userRole
}: TimeHistoryProps) {
  const columns = createColumns(onEditEntry, onApproveEntry, onRejectEntry, userRole);
  
  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5">Time Entry History</Typography>
          <Box>
            <Typography variant="body2">Today's Total: {todayTotal}</Typography>
            <Typography variant="body2">Week's Total: {weekTotal}</Typography>
          </Box>
        </Box>
        
        <TimeHistoryFilters
          filters={filters}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
        />

        <DataGrid
          rows={entries}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[5, 10, 25, 50]}
          paginationModel={paginationModel}
          onPaginationModelChange={onPaginationModelChange}
          rowCount={totalCount}
          paginationMode="server"
          autoHeight
          disableRowSelectionOnClick
          getRowClassName={getRowStyle}
          sx={{
            '& .in-progress': {
              bgcolor: '#f5f5f5',
            },
            '& .has-break': {
              fontStyle: 'italic',
            },
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
            '& .MuiDataGrid-row:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.04)',
            }
          }}
        />
      </Paper>
    </Box>
  );
} 
