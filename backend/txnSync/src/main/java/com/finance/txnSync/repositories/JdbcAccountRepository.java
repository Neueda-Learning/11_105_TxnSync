package com.finance.txnSync.repositories;

import com.finance.txnSync.models.Account;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public class JdbcAccountRepository implements AccountRepository {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public JdbcAccountRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Account> rowMapper = (rs, rowNum) -> {
        Timestamp createdTs = rs.getTimestamp("created_at");
        LocalDateTime createdAt = createdTs != null ? createdTs.toLocalDateTime() : null;
        return new Account(
            rs.getString("account_id"),
            rs.getString("account_name"),
            rs.getString("institution_name"),
            createdAt
        );
    };

    @Override
    public int save(Account account) {
        String sql = "INSERT INTO accounts (account_id, account_name, institution_name, created_at) VALUES (?, ?, ?, ?)";
        LocalDateTime createdAt = account.getCreatedAt() != null ? account.getCreatedAt() : LocalDateTime.now();
        return jdbcTemplate.update(sql, account.getAccountId(), account.getAccountName(), account.getInstitutionName(), createdAt);
    }

    @Override
    public List<Account> findAll() {
        return jdbcTemplate.query("SELECT * FROM accounts ORDER BY created_at DESC", rowMapper);
    }

    @Override
    public Account findById(String accountId) {
        return jdbcTemplate.queryForObject("SELECT * FROM accounts WHERE account_id = ?", rowMapper, accountId);
    }
}
