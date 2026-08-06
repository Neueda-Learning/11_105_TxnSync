package com.finance.txnSync.repositories;
import com.finance.txnSync.models.Transaction;
import java.util.List;

public interface TransactionRepository {
    Transaction save(Transaction transaction);
    List<Transaction> findAll();
    Transaction findById(Long id);
    long countPreviousTransactions(String accountId, String payeeId, java.time.LocalDateTime beforeTimestamp);
}