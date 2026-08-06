package com.finance.txnSync.repositories;

import com.finance.txnSync.models.Alert;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public class JdbcAlertRepository implements AlertRepository {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public JdbcAlertRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Alert> rowMapper = (rs, rowNum) -> {
        Timestamp createdTs = rs.getTimestamp("created_at");
        LocalDateTime createdAt = createdTs != null ? createdTs.toLocalDateTime() : null;

        Timestamp ackTs = rs.getTimestamp("acknowledged_at");
        LocalDateTime acknowledgedAt = ackTs != null ? ackTs.toLocalDateTime() : null;

        return new Alert(
            rs.getLong("id"),
            rs.getLong("transaction_id"),
            rs.getLong("rule_id"),
            rs.getString("status"),
            createdAt,
            acknowledgedAt,
            rs.getString("resolution_notes")
        );
    };

    @Override
    public int save(Alert alert) {
        LocalDateTime createdAt = alert.getCreatedAt() != null ? alert.getCreatedAt() : LocalDateTime.now();
        return jdbcTemplate.update(
            "INSERT INTO alerts (transaction_id, rule_id, status, created_at) VALUES (?, ?, ?, ?)",
            alert.getTransactionId(), alert.getRuleId(), alert.getStatus(), createdAt
        );
    }

    @Override
    public int updateStatus(Long id, String status, String resolutionNotes) {
        return jdbcTemplate.update(
            "UPDATE alerts SET status = ?, resolution_notes = COALESCE(?, resolution_notes), acknowledged_at = CASE WHEN ? IN ('ACKNOWLEDGED', 'INVESTIGATING') AND acknowledged_at IS NULL THEN ? ELSE acknowledged_at END WHERE id = ?",
            status, resolutionNotes, status, LocalDateTime.now(), id
        );
    }

    @Override
    public List<Alert> findAll() {
        return jdbcTemplate.query("SELECT * FROM alerts ORDER BY created_at DESC", rowMapper);
    }

    @Override
    public Alert findById(Long id) {
        return jdbcTemplate.queryForObject("SELECT * FROM alerts WHERE id = ?", rowMapper, id);
    }
}