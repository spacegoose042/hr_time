export interface TimeEntry {
    id: string;
    employee_id: string;
    clock_in: Date;
    clock_out?: Date;
    status: 'pending' | 'approved' | 'rejected';
    notes?: string;
    break_minutes?: number;
    project?: string;
    task?: string;
    created_at: Date;
    updated_at: Date;
}

export interface TimeHistoryFilters {
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