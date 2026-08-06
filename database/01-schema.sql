-- Accounts Table
CREATE TABLE accounts (
    account_id VARCHAR(50) PRIMARY KEY,
    account_name VARCHAR(100) NOT NULL,
    institution_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions Table
CREATE TABLE transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_id VARCHAR(50) NOT NULL,
    payee_id VARCHAR(50) NOT NULL,
    payee_institution_name VARCHAR(100),
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    type VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL,
    description VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(account_id)
);

-- Rules Table
CREATE TABLE rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(50) NOT NULL,
    severity VARCHAR(10) NOT NULL,
    threshold_amount DECIMAL(15, 2),
    time_window_minutes INT,
    transaction_count INT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Alerts Table
CREATE TABLE alerts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_id BIGINT NOT NULL,
    rule_id INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP NULL,
    resolution_notes TEXT,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (rule_id) REFERENCES rules(id)
);