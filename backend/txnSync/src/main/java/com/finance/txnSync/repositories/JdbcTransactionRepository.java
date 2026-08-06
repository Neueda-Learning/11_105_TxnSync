package com.finance.txnSync.repositories;

import com.finance.txnSync.models.Transaction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.sql.PreparedStatement;
import java.sql.Statement;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
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
    public Transaction save(Transaction txn) {
        String sql = "INSERT INTO transactions (account_id, payee_id, payee_institution_name, amount, currency, type, status, description, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        LocalDateTime timestamp = txn.getTimestamp() != null ? txn.getTimestamp() : LocalDateTime.now();

        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, txn.getAccountId());
            ps.setString(2, txn.getPayeeId());
            ps.setString(3, txn.getPayeeInstitutionName());
            ps.setBigDecimal(4, txn.getAmount());
            ps.setString(5, txn.getCurrency());
            ps.setString(6, txn.getType());
            ps.setString(7, txn.getStatus());
            ps.setString(8, txn.getDescription());
            ps.setTimestamp(9, Timestamp.valueOf(timestamp));
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key != null) {
            txn.setId(key.longValue());
        }
        return txn;
    }

    @Override
    public List<Transaction> findAll() {
        return jdbcTemplate.query("SELECT * FROM transactions ORDER BY timestamp DESC", rowMapper);
    }

    @Override
    public Transaction findById(Long id) {
        return jdbcTemplate.queryForObject("SELECT * FROM transactions WHERE id = ?", rowMapper, id);
    }

    @Override
    public long countPreviousTransactions(String accountId, String payeeId, LocalDateTime beforeTimestamp) {
        String sql = "SELECT COUNT(*) FROM transactions WHERE account_id = ? AND payee_id = ? AND timestamp < ?";
        Timestamp ts = beforeTimestamp != null ? Timestamp.valueOf(beforeTimestamp) : Timestamp.valueOf(LocalDateTime.now());
        Long count = jdbcTemplate.queryForObject(sql, new Object[]{accountId, payeeId, ts}, Long.class);
        return count != null ? count : 0L;
    }
}