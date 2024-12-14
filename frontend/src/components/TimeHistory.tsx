import React, { useState } from 'react';
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
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Button,
  ButtonGroup,
  Stack,
  Tooltip,
  Menu,
  MenuItem as MuiMenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Today as TodayIcon,
  DateRange as DateRangeIcon,
  Clear as ClearIcon,
  GetApp as DownloadIcon,
  TableChart as ExcelIcon,
  Description as CsvIcon,
} from '@mui/icons-material';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

interface TimeEntry {
  id: string;
  clock_in: string;
  clock_out: string | null;
  notes: string;
  status: 'pending' | 'approved' | 'rejected';
  duration?: string;
}

// Add preset types
type DatePreset = 'today' | 'week' | 'month' | 'custom';

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
  filters: {
    startDate: Date | null;
    endDate: Date | null;
    status: string;
  };
  onFilterChange: (filters: {
    startDate?: Date | null;
    endDate?: Date | null;
    status?: string;
  }) => void;
  onClearFilters: () => void;
}

interface ExportData extends TimeEntry {
  date: string;
  clock_in_time: string;
  clock_out_time: string;
}

// Add this interface for notification state
interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
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
  onRowsPerPageChange,
  filters,
  onFilterChange,
  onClearFilters
}) => {
  const [activePreset, setActivePreset] = useState<DatePreset>('custom');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'success'
  });

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

  const handlePresetClick = (preset: DatePreset) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (preset) {
      case 'today':
        startDate = today;
        endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay());
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
    }

    setActivePreset(preset);
    onFilterChange({ startDate, endDate });
  };

  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setAnchorEl(null);
  };

  const formatDataForExport = (): ExportData[] => {
    return entries.map(entry => ({
      ...entry,
      date: new Date(entry.clock_in).toLocaleDateString(),
      clock_in_time: new Date(entry.clock_in).toLocaleTimeString(),
      clock_out_time: entry.clock_out 
        ? new Date(entry.clock_out).toLocaleTimeString()
        : '---',
    }));
  };

  const handleNotificationClose = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const showNotification = (message: string, severity: 'success' | 'error') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      const data = formatDataForExport();
      const headers = [
        'Date',
        'Clock In',
        'Clock Out',
        'Duration',
        'Status',
        'Notes'
      ];
      
      const csvData = data.map(row => [
        row.date,
        row.clock_in_time,
        row.clock_out_time,
        row.duration || '---',
        row.status,
        row.notes || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      await saveAs(blob, `time-entries-${new Date().toISOString().split('T')[0]}.csv`);
      showNotification('CSV export successful', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      showNotification('Failed to export CSV file', 'error');
    } finally {
      setIsExporting(false);
      handleExportClose();
    }
  };

  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      const data = formatDataForExport();
      const worksheet = XLSX.utils.json_to_sheet(data.map(row => ({
        Date: row.date,
        'Clock In': row.clock_in_time,
        'Clock Out': row.clock_out_time,
        Duration: row.duration || '---',
        Status: row.status,
        Notes: row.notes || ''
      })));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Time Entries');
      
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      await saveAs(blob, `time-entries-${new Date().toISOString().split('T')[0]}.xlsx`);
      showNotification('Excel export successful', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      showNotification('Failed to export Excel file', 'error');
    } finally {
      setIsExporting(false);
      handleExportClose();
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleNotificationClose}
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

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
            sx={{ mr: 1 }}
          />
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportClick}
            size="small"
          >
            Export
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleExportClose}
          >
            <MuiMenuItem 
              onClick={exportToCSV}
              disabled={isExporting}
            >
              <ListItemIcon>
                {isExporting ? (
                  <CircularProgress size={20} />
                ) : (
                  <CsvIcon fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText>
                {isExporting ? 'Exporting...' : 'Export to CSV'}
              </ListItemText>
            </MuiMenuItem>
            <MuiMenuItem 
              onClick={exportToExcel}
              disabled={isExporting}
            >
              <ListItemIcon>
                {isExporting ? (
                  <CircularProgress size={20} />
                ) : (
                  <ExcelIcon fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText>
                {isExporting ? 'Exporting...' : 'Export to Excel'}
              </ListItemText>
            </MuiMenuItem>
          </Menu>
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={9}>
            <Stack direction="row" spacing={2} alignItems="center">
              <ButtonGroup size="small">
                <Tooltip title="Today">
                  <Button
                    variant={activePreset === 'today' ? 'contained' : 'outlined'}
                    onClick={() => handlePresetClick('today')}
                    startIcon={<TodayIcon />}
                  >
                    Today
                  </Button>
                </Tooltip>
                <Tooltip title="This Week">
                  <Button
                    variant={activePreset === 'week' ? 'contained' : 'outlined'}
                    onClick={() => handlePresetClick('week')}
                  >
                    Week
                  </Button>
                </Tooltip>
                <Tooltip title="This Month">
                  <Button
                    variant={activePreset === 'month' ? 'contained' : 'outlined'}
                    onClick={() => handlePresetClick('month')}
                    startIcon={<DateRangeIcon />}
                  >
                    Month
                  </Button>
                </Tooltip>
              </ButtonGroup>

              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={filters.startDate}
                  onChange={(date) => {
                    setActivePreset('custom');
                    onFilterChange({ startDate: date });
                  }}
                  slotProps={{ textField: { size: 'small' } }}
                />
                <DatePicker
                  label="End Date"
                  value={filters.endDate}
                  onChange={(date) => {
                    setActivePreset('custom');
                    onFilterChange({ endDate: date });
                  }}
                  slotProps={{ textField: { size: 'small' } }}
                />
              </LocalizationProvider>
            </Stack>
          </Grid>

          <Grid item xs={12} md={3}>
            <Stack direction="row" spacing={1}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => onFilterChange({ status: e.target.value })}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>

              <Tooltip title="Clear Filters">
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    setActivePreset('custom');
                    onClearFilters();
                  }}
                  startIcon={<ClearIcon />}
                >
                  Clear
                </Button>
              </Tooltip>
            </Stack>
          </Grid>
        </Grid>
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