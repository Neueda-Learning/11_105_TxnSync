-- Insert Test Accounts
INSERT INTO accounts (account_id, account_name, institution_name) VALUES 
('ACC-001', 'Alice Johnson', 'TxnSync Bank'),
('ACC-002', 'Bob Smith', 'TxnSync Bank'),
('ACC-003', 'Corporate Corp', 'TxnSync Bank');

-- Insert MVP Rules
INSERT INTO rules (rule_name, rule_type, severity, threshold_amount, time_window_minutes, transaction_count, is_active) VALUES 
('High Value Transfer', 'AMOUNT', 'HIGH', 10000.00, NULL, NULL, TRUE),
('Rapid Transactions', 'VELOCITY', 'MEDIUM', NULL, 10, 5, TRUE),
('Unseen Counterparty', 'NEW_PAYEE', 'MEDIUM', NULL, NULL, NULL, TRUE),
('Daily Volume Exceeded', 'DAILY_LIMIT', 'HIGH', 50000.00, NULL, NULL, TRUE);

-- Insert Test Transactions
INSERT INTO transactions (account_id, payee_id, payee_institution_name, amount, currency, type, status, description) VALUES
('ACC-001', 'PAYEE-A', 'Global Standard Bank', 15000.00, 'USD', 'DEBIT', 'COMPLETED', 'Large supplier payment'),
('ACC-002', 'PAYEE-B', 'Regional Trust', 500.00, 'USD', 'DEBIT', 'COMPLETED', 'Standard monthly fee'),
('ACC-003', 'PAYEE-NEW', 'Offshore Holdings', 1200.00, 'EUR', 'DEBIT', 'COMPLETED', 'First time vendor payment');

-- Insert Mock Alerts
INSERT INTO alerts (transaction_id, rule_id, status) VALUES 
(1, 1, 'OPEN'),
(3, 3, 'ACKNOWLEDGED');