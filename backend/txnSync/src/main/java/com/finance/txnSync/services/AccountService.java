package com.finance.txnSync.services;

import com.finance.txnSync.models.Account;
import com.finance.txnSync.repositories.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AccountService {

    private final AccountRepository accountRepository;

    @Autowired
    public AccountService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    public List<Account> getAllAccounts() {
        return accountRepository.findAll();
    }

    public Account getAccountById(String accountId) {
        try {
            return accountRepository.findById(accountId);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    public Account createAccount(Account account) {
        if (account.getCreatedAt() == null) {
            account.setCreatedAt(LocalDateTime.now());
        }
        accountRepository.save(account);
        return account;
    }
}
