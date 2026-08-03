package com.finance.txnSync.repositories;
import com.finance.txnSync.models.Transaction;
import java.util.List;

public interface TransactionRepository {
    int save(Transaction transaction);
    List<Transaction> findAll();
    Transaction findById(Long id);
}