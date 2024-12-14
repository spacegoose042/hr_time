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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
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
type ColumnPreset = 'basic' | 'full' | 'custom';

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

// Add interfaces for export options
interface ExportColumn {
  key: keyof ExportData;
  label: string;
  selected: boolean;
}

interface ExportOptions {
  columns: ExportColumn[];
  dateRange: {
    startDate: Date | null;
    endDate: Date | null;
  };
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
  const [exportOptionsOpen, setExportOptionsOpen] = useState(false);
  const [exportType, setExportType] = useState<'csv' | 'excel' | null>(null);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    columns: [
      { key: 'date', label: 'Date', selected: true },
      { key: 'clock_in_time', label: 'Clock In', selected: true },
      { key: 'clock_out_time', label: 'Clock Out', selected: true },
      { key: 'duration', label: 'Duration', selected: true },
      { key: 'status', label: 'Status', selected: true },
      { key: 'notes', label: 'Notes', selected: true }
    ],
    dateRange: {
      startDate: null,
      endDate: null
    }
  });
  const [columnPreset, setColumnPreset] = useState<ColumnPreset>('full');

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

  const handleExportOptionClick = (type: 'csv' | 'excel') => {
    setExportType(type);
    setExportOptionsOpen(true);
    handleExportClose();
  };

  const handleColumnToggle = (key: keyof ExportData) => {
    setColumnPreset('custom');
    setExportOptions(prev => ({
      ...prev,
      columns: prev.columns.map(col => 
        col.key === key ? { ...col, selected: !col.selected } : col
      )
    }));
  };

  const handleExportDateChange = (type: 'startDate' | 'endDate', date: Date | null) => {
    setExportOptions(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [type]: date
      }
    }));
  };

  const handleExport = async () => {
    if (!exportType) {
      showNotification('Export type not selected', 'error');
      return;
    }

    const selectedColumns = exportOptions.columns.filter(col => col.selected);
    if (selectedColumns.length === 0) {
      showNotification('Please select at least one column to export', 'error');
      return;
    }

    setIsExporting(true);
    try {
      const data = formatDataForExport().filter(entry => {
        const entryDate = new Date(entry.clock_in);
        const { startDate, endDate } = exportOptions.dateRange;
        
        if (startDate && entryDate < startDate) return false;
        if (endDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (entryDate > endOfDay) return false;
        }
        return true;
      });

      if (exportType === 'csv') {
        const headers = selectedColumns.map(col => col.label);
        const csvData = data.map(row => 
          selectedColumns.map(col => row[col.key]?.toString() || '')
        );

        const csvContent = [
          headers.join(','),
          ...csvData.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        await saveAs(blob, `time-entries-${new Date().toISOString().split('T')[0]}.csv`);
      } else {
        const worksheet = XLSX.utils.json_to_sheet(
          data.map(row => {
            const exportRow: Record<string, any> = {};
            selectedColumns.forEach(col => {
              exportRow[col.label] = row[col.key];
            });
            return exportRow;
          })
        );

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Time Entries');
        
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        await saveAs(blob, `time-entries-${new Date().toISOString().split('T')[0]}.xlsx`);
      }

      showNotification(`${exportType.toUpperCase()} export successful`, 'success');
    } catch (error) {
      console.error('Export failed:', error);
      showNotification(`Failed to export ${exportType.toUpperCase()} file`, 'error');
    } finally {
      setIsExporting(false);
      setExportOptionsOpen(false);
      setExportType(null);
    }
  };

  const handlePresetChange = (_event: React.MouseEvent<HTMLElement>, newPreset: ColumnPreset | null) => {
    if (!newPreset) return;
    
    setColumnPreset(newPreset);
    setExportOptions(prev => ({
      ...prev,
      columns: prev.columns.map(col => ({
        ...col,
        selected: newPreset === 'full' || (
          newPreset === 'basic' && 
          ['date', 'clock_in_time', 'clock_out_time', 'duration'].includes(col.key)
        )
      }))
    }));
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
              onClick={() => handleExportOptionClick('csv')}
              disabled={isExporting}
            >
              <ListItemIcon>
                <CsvIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Export to CSV</ListItemText>
            </MuiMenuItem>
            <MuiMenuItem 
              onClick={() => handleExportOptionClick('excel')}
              disabled={isExporting}
            >
              <ListItemIcon>
                <ExcelIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Export to Excel</ListItemText>
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

      {/* Add Export Options Dialog */}
      <Dialog 
        open={exportOptionsOpen} 
        onClose={() => setExportOptionsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Export Options - {exportType?.toUpperCase() || 'Select Type'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            Column Presets
          </Typography>
          <ToggleButtonGroup
            value={columnPreset}
            exclusive
            onChange={handlePresetChange}
            size="small"
            sx={{ mb: 2, display: 'flex' }}
          >
            <ToggleButton value="basic">
              Basic
            </ToggleButton>
            <ToggleButton value="full">
              Full
            </ToggleButton>
            <ToggleButton value="custom">
              Custom
            </ToggleButton>
          </ToggleButtonGroup>

          <Typography variant="subtitle1" gutterBottom>
            Select Columns
          </Typography>
          <FormGroup>
            {exportOptions.columns.map(col => (
              <FormControlLabel
                key={col.key}
                control={
                  <Checkbox
                    checked={col.selected}
                    onChange={() => handleColumnToggle(col.key)}
                    disabled={columnPreset !== 'custom'}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {col.label}
                    {columnPreset !== 'custom' && col.selected && (
                      <Chip
                        label={columnPreset === 'basic' ? 'Basic' : 'Full'}
                        size="small"
                        variant="outlined"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Box>
                }
              />
            ))}
          </FormGroup>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {columnPreset === 'basic' && 'Basic includes date, clock in/out times, and duration'}
            {columnPreset === 'full' && 'Full includes all available columns'}
            {columnPreset === 'custom' && 'Select the columns you want to export'}
          </Typography>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" gutterBottom>
            Date Range
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={exportOptions.dateRange.startDate}
                  onChange={(date) => handleExportDateChange('startDate', date)}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={exportOptions.dateRange.endDate}
                  onChange={(date) => handleExportDateChange('endDate', date)}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setExportOptionsOpen(false)}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            variant="contained"
            disabled={isExporting}
            startIcon={isExporting ? <CircularProgress size={20} /> : undefined}
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default TimeHistory; 