package com.finance.txnSync.controllers;

import com.finance.txnSync.dto.transaction.CreateTransactionRequestDto;
import com.finance.txnSync.dto.transaction.TransactionDtoMapper;
import com.finance.txnSync.dto.transaction.TransactionResponseDto;
import com.finance.txnSync.models.Transaction;
import com.finance.txnSync.services.TransactionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    @Autowired
    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping
    public ResponseEntity<List<TransactionResponseDto>> getAllTransactions() {
        List<TransactionResponseDto> transactions = transactionService.getAllTransactions()
                .stream()
                .map(TransactionDtoMapper::toResponse)
                .toList();
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransactionResponseDto> getTransactionById(@PathVariable Long id) {
        Transaction transaction = transactionService.getTransactionById(id);
        if (transaction == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(TransactionDtoMapper.toResponse(transaction));
    }

    @PostMapping
    public ResponseEntity<TransactionResponseDto> createTransaction(@Valid @RequestBody CreateTransactionRequestDto request) {
        Transaction processed = transactionService.processTransaction(TransactionDtoMapper.toModel(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(TransactionDtoMapper.toResponse(processed));
    }
}
