package com.finance.txnSync.repositories;
import com.finance.txnSync.models.Transaction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public class JdbcTransactionRepository implements TransactionRepository {
    @Autowired private JdbcTemplate jdbcTemplate;

    private final RowMapper<Transaction> rowMapper = (rs, rowNum) -> new Transaction(
        rs.getLong("id"), rs.getString("account_id"), rs.getString("payee_id"), rs.getString("payee_institution_name"),
        rs.getBigDecimal("amount"), rs.getString("currency"), rs.getString("type"), rs.getString("status"),
        rs.getString("description"), rs.getTimestamp("timestamp").toLocalDateTime()
    );

    @Override
    public int save(Transaction txn) {
        String sql = "INSERT INTO transactions (account_id, payee_id, payee_institution_name, amount, currency, type, status, description, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        return jdbcTemplate.update(sql, txn.getAccountId(), txn.getPayeeId(), txn.getPayeeInstitutionName(), txn.getAmount(), txn.getCurrency(), txn.getType(), txn.getStatus(), txn.getDescription(), txn.getTimestamp());
    }

    @Override
    public List<Transaction> findAll() { return jdbcTemplate.query("SELECT * FROM transactions ORDER BY timestamp DESC", rowMapper); }

    @Override
    public Transaction findById(Long id) { return jdbcTemplate.queryForObject("SELECT * FROM transactions WHERE id = ?", rowMapper, id); }
}