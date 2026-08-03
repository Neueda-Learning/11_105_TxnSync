package com.finance.txnSync.repositories;

import com.finance.txnSync.models.Transaction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public class JdbcTransactionRepository implements TransactionRepository {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public JdbcTransactionRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Transaction> rowMapper = (rs, rowNum) -> {
        Timestamp ts = rs.getTimestamp("timestamp");
        LocalDateTime timestamp = ts != null ? ts.toLocalDateTime() : null;
        return new Transaction(
            rs.getLong("id"),
            rs.getString("account_id"),
            rs.getString("payee_id"),
            rs.getString("payee_institution_name"),
            rs.getBigDecimal("amount"),
            rs.getString("currency"),
            rs.getString("type"),
            rs.getString("status"),
            rs.getString("description"),
            timestamp
        );
    };

    @Override
    public int save(Transaction txn) {
        String sql = "INSERT INTO transactions (account_id, payee_id, payee_institution_name, amount, currency, type, status, description, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        LocalDateTime timestamp = txn.getTimestamp() != null ? txn.getTimestamp() : LocalDateTime.now();
        return jdbcTemplate.update(
            sql,
            txn.getAccountId(),
            txn.getPayeeId(),
            txn.getPayeeInstitutionName(),
            txn.getAmount(),
            txn.getCurrency(),
            txn.getType(),
            txn.getStatus(),
            txn.getDescription(),
            timestamp
        );
    }

    @Override
    public List<Transaction> findAll() {
        return jdbcTemplate.query("SELECT * FROM transactions ORDER BY timestamp DESC", rowMapper);
    }

    @Override
    public Transaction findById(Long id) {
        return jdbcTemplate.queryForObject("SELECT * FROM transactions WHERE id = ?", rowMapper, id);
    }
}