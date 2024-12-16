import React, { useState, useEffect } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Box,
  Chip,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  FilterList as FilterIcon,
  Info as InfoIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { AuditAction } from '../../types/audit';

interface AuditLog {
  id: string;
  employeeId: string;
  employee: {
    first_name: string;
    last_name: string;
    email: string;
  };
  action: AuditAction;
  metadata: Record<string, any>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface FilterState {
  startDate: Date | null;
  endDate: Date | null;
  action: AuditAction | '';
  employeeId: string;
  searchTerm: string;
}

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    startDate: null,
    endDate: null,
    action: '',
    employeeId: '',
    searchTerm: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(page + 1),
        limit: String(rowsPerPage),
        ...(filters.startDate && { startDate: filters.startDate.toISOString() }),
        ...(filters.endDate && { endDate: filters.endDate.toISOString() }),
        ...(filters.action && { action: filters.action }),
        ...(filters.employeeId && { employeeId: filters.employeeId }),
        ...(filters.searchTerm && { search: filters.searchTerm }),
      });

      const response = await fetch(`/api/admin/audit-logs?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setLogs(data.logs);
      setTotalCount(data.total);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, rowsPerPage, filters]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getActionColor = (action: AuditAction) => {
    switch (action) {
      case AuditAction.PASSWORD_RESET:
        return 'primary';
      case AuditAction.FAILED_PASSWORD_ATTEMPT:
        return 'error';
      case AuditAction.ACCOUNT_LOCKED:
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatMetadata = (metadata: Record<string, any>): string => {
    return Object.entries(metadata)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Audit Logs</Typography>
        <Button
          startIcon={<FilterIcon />}
          onClick={() => setFilterOpen(true)}
          variant="outlined"
        >
          Filters
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Details</TableCell>
              <TableCell>IP Address</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                </TableCell>
                <TableCell>
                  <Chip
                    label={log.action}
                    color={getActionColor(log.action)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {log.employee.first_name} {log.employee.last_name}
                  <Typography variant="caption" display="block" color="textSecondary">
                    {log.employee.email}
                  </Typography>
                </TableCell>
                <TableCell>{formatMetadata(log.metadata)}</TableCell>
                <TableCell>{log.ip_address}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => setSelectedLog(log)}
                  >
                    <InfoIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Filter Dialog */}
      <Dialog
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Filter Audit Logs
          <IconButton
            onClick={() => setFilterOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(date) => setFilters(prev => ({ ...prev, startDate: date }))}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(date) => setFilters(prev => ({ ...prev, endDate: date }))}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Action Type</InputLabel>
                <Select
                  value={filters.action}
                  onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value as AuditAction }))}
                >
                  <MenuItem value="">All Actions</MenuItem>
                  {Object.values(AuditAction).map((action) => (
                    <MenuItem key={action} value={action}>
                      {action}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Search"
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                placeholder="Search by email, name, or IP"
              />
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Audit Log Details
          <IconButton
            onClick={() => setSelectedLog(null)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Timestamp</Typography>
                <Typography>
                  {format(new Date(selectedLog.created_at), 'PPpp')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Action</Typography>
                <Chip
                  label={selectedLog.action}
                  color={getActionColor(selectedLog.action)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">User</Typography>
                <Typography>
                  {selectedLog.employee.first_name} {selectedLog.employee.last_name}
                  <Typography variant="caption" display="block">
                    {selectedLog.employee.email}
                  </Typography>
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Metadata</Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">IP Address</Typography>
                <Typography>{selectedLog.ip_address}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">User Agent</Typography>
                <Typography
                  sx={{
                    wordBreak: 'break-word',
                    fontSize: '0.875rem'
                  }}
                >
                  {selectedLog.user_agent}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default AuditLogs; 