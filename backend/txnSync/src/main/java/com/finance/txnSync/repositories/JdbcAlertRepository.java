package com.finance.txnSync.repositories;
import com.finance.txnSync.models.Alert;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public class JdbcAlertRepository implements AlertRepository {
    @Autowired private JdbcTemplate jdbcTemplate;

    private final RowMapper<Alert> rowMapper = (rs, rowNum) -> {
        Alert alert = new Alert(rs.getLong("id"), rs.getLong("transaction_id"), rs.getLong("rule_id"), rs.getString("status"), rs.getTimestamp("created_at").toLocalDateTime(), null, rs.getString("resolution_notes"));
        if (rs.getTimestamp("acknowledged_at") != null) alert.setAcknowledgedAt(rs.getTimestamp("acknowledged_at").toLocalDateTime());
        return alert;
    };

    @Override
    public int save(Alert alert) { return jdbcTemplate.update("INSERT INTO alerts (transaction_id, rule_id, status, created_at) VALUES (?, ?, ?, ?)", alert.getTransactionId(), alert.getRuleId(), alert.getStatus(), LocalDateTime.now()); }

    @Override
    public int updateStatus(Long id, String status, String resolutionNotes) { return jdbcTemplate.update("UPDATE alerts SET status = ?, resolution_notes = ?, acknowledged_at = ? WHERE id = ?", status, resolutionNotes, LocalDateTime.now(), id); }

    @Override
    public List<Alert> findAll() { return jdbcTemplate.query("SELECT * FROM alerts ORDER BY created_at DESC", rowMapper); }

    @Override
    public Alert findById(Long id) { return jdbcTemplate.queryForObject("SELECT * FROM alerts WHERE id = ?", rowMapper, id); }
}