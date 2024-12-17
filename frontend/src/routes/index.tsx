import { Routes, Route } from 'react-router-dom';
import TimeHistory from '../components/TimeHistory';
import PrivateRoute from '../components/PrivateRoute';
import { useState, useEffect } from 'react';
import { timeEntryService } from '../services/timeEntryService';
import { TimeEntry } from '../components/TimeHistory';
import { GridPaginationModel } from '@mui/x-data-grid';
import { TimeHistoryFilters } from '../components/TimeHistory';

export default function AppRoutes() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState<TimeHistoryFilters>({});

  const handlePaginationModelChange = (model: GridPaginationModel) => {
    setPage(model.page + 1);
    setLimit(model.pageSize);
  };

  const handleFilterChange = (newFilters: Partial<TimeHistoryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const response = await timeEntryService.getEntries({ page, limit });
        setTimeEntries(response.entries);
        setTotalCount(response.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [page, limit]);

  // Calculate totals
  const calculateTimeTotal = (entries: TimeEntry[], period: 'today' | 'week'): string => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

    const filteredEntries = entries.filter(entry => {
      const entryDate = new Date(entry.clock_in);
      return period === 'today' 
        ? entryDate >= startOfDay
        : entryDate >= startOfWeek;
    });

    const totalMinutes = filteredEntries.reduce((total, entry) => {
      if (!entry.clock_out) return total;
      const duration = new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime();
      return total + (duration / (1000 * 60));
    }, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <Routes>
      <Route path="/time-entries" element={
        <PrivateRoute>
          <TimeHistory 
            entries={timeEntries}
            todayTotal={calculateTimeTotal(timeEntries, 'today')}
            weekTotal={calculateTimeTotal(timeEntries, 'week')}
            totalCount={totalCount}
            isLoading={loading}
            error={error}
            page={page}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={setLimit}
            onPaginationModelChange={handlePaginationModelChange}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </PrivateRoute>
      } />
      {/* ... other routes */}
    </Routes>
  );
} 