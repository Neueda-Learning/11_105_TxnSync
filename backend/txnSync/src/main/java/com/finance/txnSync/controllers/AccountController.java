package com.finance.txnSync.controllers;

import com.finance.txnSync.dto.account.AccountDtoMapper;
import com.finance.txnSync.dto.account.AccountResponseDto;
import com.finance.txnSync.dto.account.CreateAccountRequestDto;
import com.finance.txnSync.models.Account;
import com.finance.txnSync.services.AccountService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/accounts")
public class AccountController {

    private final AccountService accountService;

    @Autowired
    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping
    public ResponseEntity<List<AccountResponseDto>> getAllAccounts() {
        List<AccountResponseDto> accounts = accountService.getAllAccounts()
                .stream()
                .map(AccountDtoMapper::toResponse)
                .toList();
        return ResponseEntity.ok(accounts);
    }

    @GetMapping("/{accountId}")
    public ResponseEntity<AccountResponseDto> getAccountById(@PathVariable String accountId) {
        Account account = accountService.getAccountById(accountId);
        if (account == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(AccountDtoMapper.toResponse(account));
    }

    @PostMapping
    public ResponseEntity<AccountResponseDto> createAccount(@Valid @RequestBody CreateAccountRequestDto request) {
        Account created = accountService.createAccount(AccountDtoMapper.toModel(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(AccountDtoMapper.toResponse(created));
    }
}
