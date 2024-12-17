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
  IconButton,
  Typography,
  Slider,
  FormControlLabel,
  Switch,
  Autocomplete
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { FilterList as FilterIcon, Close as ClearIcon } from '@mui/icons-material';
import { useState } from 'react';

type AutocompleteChangeHandler = (
  event: React.SyntheticEvent,
  value: string[]
) => void;

type SliderChangeHandler = (
  event: Event | null,
  value: number | number[]
) => void;

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
  durationRange: [number, number];
  hasNotes: boolean | null;
  projects: string[];
  tasks: string[];
  dateRange: 'today' | 'week' | 'month' | 'custom';
}

interface TimeHistoryAdvancedFiltersProps {
  filters: AdvancedFilters;
  onFilterChange: (filters: Partial<AdvancedFilters>) => void;
  onClearFilters: () => void;
  availableProjects: string[];
  availableTasks: string[];
}

const DATE_RANGE_OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'Custom Range', value: 'custom' }
] as const;

export default function TimeHistoryAdvancedFilters({
  filters,
  onFilterChange,
  onClearFilters,
  availableProjects,
  availableTasks
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
    if (filters.durationRange) count++;
    if (filters.hasNotes !== null) count++;
    if (filters.projects) count++;
    if (filters.tasks) count++;
    if (filters.dateRange) count++;
    return count;
  };

  const handleProjectsChange: AutocompleteChangeHandler = (_, newValue) => {
    onFilterChange({ projects: newValue });
  };

  const handleTasksChange: AutocompleteChangeHandler = (_, newValue) => {
    onFilterChange({ tasks: newValue });
  };

  const handleDurationChange: SliderChangeHandler = (_, newValue) => {
    onFilterChange({ durationRange: newValue as [number, number] });
  };

  const handleNotesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ hasNotes: event.target.checked });
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
            
            <Box>
              <Typography gutterBottom>Duration (hours)</Typography>
              <Slider
                value={filters.durationRange}
                onChange={handleDurationChange}
                valueLabelDisplay="auto"
                min={0}
                max={12}
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={filters.hasNotes === true}
                  onChange={handleNotesChange}
                />
              }
              label="Has Notes"
            />

            <Autocomplete
              multiple
              options={availableProjects}
              value={filters.projects}
              onChange={handleProjectsChange}
              renderInput={(params) => (
                <TextField {...params} label="Projects" />
              )}
            />

            <Autocomplete
              multiple
              options={availableTasks}
              value={filters.tasks}
              onChange={handleTasksChange}
              renderInput={(params) => (
                <TextField {...params} label="Tasks" />
              )}
            />

            <FormControl fullWidth>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={filters.dateRange}
                onChange={(e) => onFilterChange({ dateRange: e.target.value as typeof DATE_RANGE_OPTIONS[number]['value'] })}
                label="Date Range"
              >
                {DATE_RANGE_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Box>
      </Popover>
    </Box>
  );
} 