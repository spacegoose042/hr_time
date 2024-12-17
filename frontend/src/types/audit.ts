export interface AuditLog {
    id: string;
    actor_id: string;
    action: AuditAction;
    target_type: string;
    target_id: string;
    metadata: Record<string, any>;
    notes?: string;
    created_at: Date;
}

export enum AuditAction {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    APPROVE = 'approve',
    REJECT = 'reject',
    CLOCK_IN = 'clock_in',
    CLOCK_OUT = 'clock_out',
    LOGIN = 'login',
    FAILED_LOGIN = 'failed_login',
    SUCCESSFUL_LOGIN = 'successful_login',
    PASSWORD_RESET = 'password_reset',
    FAILED_PASSWORD_ATTEMPT = 'failed_password_attempt'
} 