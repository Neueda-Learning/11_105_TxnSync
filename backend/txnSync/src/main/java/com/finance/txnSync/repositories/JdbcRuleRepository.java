package com.finance.txnSync.repositories;

import com.finance.txnSync.models.Rule;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public class JdbcRuleRepository implements RuleRepository {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public JdbcRuleRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Rule> rowMapper = (rs, rowNum) -> new Rule(
        rs.getLong("id"),
        rs.getString("rule_name"),
        rs.getString("rule_type"),
        rs.getString("severity"),
        rs.getBigDecimal("threshold_amount"),
        rs.getInt("time_window_minutes"),
        rs.getInt("transaction_count"),
        rs.getBoolean("is_active")
    );

    @Override
    public List<Rule> findAllActiveRules() {
        return jdbcTemplate.query("SELECT * FROM rules WHERE is_active = true", rowMapper);
    }

    @Override
    public List<Rule> findAll() {
        return jdbcTemplate.query("SELECT * FROM rules", rowMapper);
    }

    @Override
    public Rule findById(Long id) {
        return jdbcTemplate.queryForObject("SELECT * FROM rules WHERE id = ?", rowMapper, id);
    }

    @Override
    public int updateRule(Long id, Rule rule) {
        return jdbcTemplate.update(
            "UPDATE rules SET rule_name = ?, rule_type = ?, severity = ?, threshold_amount = ?, time_window_minutes = ?, transaction_count = ?, is_active = ? WHERE id = ?",
            rule.getRuleName(), rule.getRuleType(), rule.getSeverity(), rule.getThresholdAmount(), rule.getTimeWindowMinutes(), rule.getTransactionCount(), rule.isActive(), id
        );
    }
}