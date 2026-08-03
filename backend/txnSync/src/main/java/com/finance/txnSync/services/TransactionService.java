package com.finance.txnSync.services;

import com.finance.txnSync.models.Alert;
import com.finance.txnSync.models.Rule;
import com.finance.txnSync.models.Transaction;
import com.finance.txnSync.repositories.AlertRepository;
import com.finance.txnSync.repositories.RuleRepository;
import com.finance.txnSync.repositories.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final RuleRepository ruleRepository;
    private final AlertRepository alertRepository;

    @Autowired
    public TransactionService(TransactionRepository transactionRepository,
                               RuleRepository ruleRepository,
                               AlertRepository alertRepository) {
        this.transactionRepository = transactionRepository;
        this.ruleRepository = ruleRepository;
        this.alertRepository = alertRepository;
    }

    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    public Transaction getTransactionById(Long id) {
        try {
            return transactionRepository.findById(id);
        } catch (Exception e) {
            return null;
        }
    }

    public Transaction processTransaction(Transaction transaction) {
        if (transaction.getTimestamp() == null) {
            transaction.setTimestamp(LocalDateTime.now());
        }
        if (transaction.getStatus() == null) {
            transaction.setStatus("COMPLETED");
        }

        // Save transaction
        transactionRepository.save(transaction);

        // Evaluate active monitoring rules
        evaluateRules(transaction);

        return transaction;
    }

    private void evaluateRules(Transaction transaction) {
        List<Rule> activeRules = ruleRepository.findAllActiveRules();
        for (Rule rule : activeRules) {
            boolean triggered = false;
            String note = null;

            if ("AMOUNT".equalsIgnoreCase(rule.getRuleType()) && rule.getThresholdAmount() != null) {
                if (transaction.getAmount() != null && transaction.getAmount().compareTo(rule.getThresholdAmount()) >= 0) {
                    triggered = true;
                    note = "Transaction amount (" + transaction.getAmount() + ") exceeded threshold (" + rule.getThresholdAmount() + ")";
                }
            } else if ("NEW_PAYEE".equalsIgnoreCase(rule.getRuleType())) {
                if (transaction.getPayeeId() != null && transaction.getPayeeId().startsWith("PAYEE-NEW")) {
                    triggered = true;
                    note = "Transaction executed with new unverified payee: " + transaction.getPayeeId();
                }
            }

            if (triggered) {
                Alert alert = new Alert(
                    null,
                    transaction.getId() != null ? transaction.getId() : 0L,
                    rule.getId(),
                    "OPEN",
                    LocalDateTime.now(),
                    null,
                    note
                );
                alertRepository.save(alert);
            }
        }
    }
}
