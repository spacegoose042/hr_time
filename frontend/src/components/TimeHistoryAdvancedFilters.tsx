import { 
  Box, 
  Popover, 
  Button, 
  Stack, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Chip,
  IconButton
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { FilterList as FilterIcon, Close as ClearIcon } from '@mui/icons-material';
import { useState } from 'react';

interface AdvancedFilters {
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  searchTerm: string;
  minDuration: number | null;
  maxDuration: number | null;
  hasBreak: boolean | null;
  project: string;
  task: string;
}

interface TimeHistoryAdvancedFiltersProps {
  filters: AdvancedFilters;
  onFilterChange: (filters: Partial<AdvancedFilters>) => void;
  onClearFilters: () => void;
}

export default function TimeHistoryAdvancedFilters({
  filters,
  onFilterChange,
  onClearFilters
}: TimeHistoryAdvancedFiltersProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.status) count++;
    if (filters.searchTerm) count++;
    if (filters.minDuration) count++;
    if (filters.maxDuration) count++;
    if (filters.hasBreak !== null) count++;
    if (filters.project) count++;
    if (filters.task) count++;
    return count;
  };

  return (
    <Box>
      <Button
        startIcon={<FilterIcon />}
        onClick={handleClick}
        variant="outlined"
        size="small"
        endIcon={
          getActiveFilterCount() > 0 ? (
            <Chip 
              label={getActiveFilterCount()} 
              size="small" 
              color="primary"
            />
          ) : undefined
        }
      >
        Advanced Filters
      </Button>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, width: 400 }}>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <h3 style={{ margin: 0 }}>Advanced Filters</h3>
              <IconButton size="small" onClick={onClearFilters}>
                <ClearIcon />
              </IconButton>
            </Stack>
            
            <DatePicker
              label="Start Date"
              value={filters.startDate}
              onChange={(date) => onFilterChange({ startDate: date })}
            />
            
            <DatePicker
              label="End Date"
              value={filters.endDate}
              onChange={(date) => onFilterChange({ endDate: date })}
            />
            
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => onFilterChange({ status: e.target.value })}
                label="Status"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Search"
              value={filters.searchTerm}
              onChange={(e) => onFilterChange({ searchTerm: e.target.value })}
              placeholder="Search notes, project, or task..."
            />
            
            <Stack direction="row" spacing={2}>
              <TextField
                label="Min Duration (hrs)"
                type="number"
                value={filters.minDuration || ''}
                onChange={(e) => onFilterChange({ 
                  minDuration: e.target.value ? Number(e.target.value) : null 
                })}
              />
              <TextField
                label="Max Duration (hrs)"
                type="number"
                value={filters.maxDuration || ''}
                onChange={(e) => onFilterChange({ 
                  maxDuration: e.target.value ? Number(e.target.value) : null 
                })}
              />
            </Stack>
            
            <FormControl fullWidth>
              <InputLabel>Break</InputLabel>
              <Select
                value={filters.hasBreak === null ? '' : filters.hasBreak.toString()}
                onChange={(e) => onFilterChange({ 
                  hasBreak: e.target.value === '' ? null : e.target.value === 'true' 
                })}
                label="Break"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Has Break</MenuItem>
                <MenuItem value="false">No Break</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Project"
              value={filters.project}
              onChange={(e) => onFilterChange({ project: e.target.value })}
            />
            
            <TextField
              label="Task"
              value={filters.task}
              onChange={(e) => onFilterChange({ task: e.target.value })}
            />
          </Stack>
        </Box>
      </Popover>
    </Box>
  );
} 