-- Insert test employees
INSERT INTO employees (first_name, last_name, email, password_hash, role, hire_date)
VALUES 
  ('Test', 'Manager', 'manager@test.com', 'hash', 'manager', NOW()),
  ('Test', 'Employee', 'employee@test.com', 'hash', 'employee', NOW());

-- Insert test time entries
INSERT INTO time_entries (employee_id, clock_in, clock_out, status)
SELECT 
  id, 
  NOW() - INTERVAL '1 day',
  NOW(),
  'pending'
FROM employees 
WHERE email = 'employee@test.com';

-- Insert test audit logs
INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata, notes)
SELECT 
  e.id,
  'create',
  'time_entry',
  t.id,
  '{"ip": "127.0.0.1", "userAgent": "Test Browser"}',
  'Test audit log'
FROM employees e
JOIN time_entries t ON t.employee_id = e.id
WHERE e.email = 'employee@test.com'; 