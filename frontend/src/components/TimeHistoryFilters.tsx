import { TimeHistoryFilters } from '../types/timeEntry';

interface TimeHistoryFiltersProps {
  filters: TimeHistoryFilters;
  onFilterChange: (filters: Partial<TimeHistoryFilters>) => void;
  onClearFilters: () => void;
  availableProjects: string[];
  availableTasks: string[];
}

export default function TimeHistoryFilters({
  filters,
  onFilterChange,
  onClearFilters,
  availableProjects,
  availableTasks
}: TimeHistoryFiltersProps) {
  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <DatePicker
          label="Start Date"
          value={filters.startDate}
          onChange={(date) => onFilterChange({ startDate: date })}
          slotProps={{ textField: { size: 'small' } }}
        />
        <DatePicker
          label="End Date"
          value={filters.endDate}
          onChange={(date) => onFilterChange({ endDate: date })}
          slotProps={{ textField: { size: 'small' } }}
        />
        <TextField
          select
          label="Status"
          value={filters.status}
          onChange={(e) => onFilterChange({ status: e.target.value })}
          size="small"
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="approved">Approved</MenuItem>
          <MenuItem value="rejected">Rejected</MenuItem>
        </TextField>
        <TextField
          label="Search"
          value={filters.searchTerm}
          onChange={(e) => onFilterChange({ searchTerm: e.target.value })}
          size="small"
          placeholder="Search notes, project, or task..."
          sx={{ minWidth: 200 }}
        />
        <Tooltip title="Clear filters">
          <IconButton onClick={onClearFilters} size="small">
            <ClearIcon />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
} 