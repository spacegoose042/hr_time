export enum UserRole {
  EMPLOYEE = 'employee',
  MANAGER = 'manager',
  ADMIN = 'admin'
}

export const ROLE_HIERARCHY = {
  [UserRole.ADMIN]: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE],
  [UserRole.MANAGER]: [UserRole.MANAGER, UserRole.EMPLOYEE],
  [UserRole.EMPLOYEE]: [UserRole.EMPLOYEE]
}; 