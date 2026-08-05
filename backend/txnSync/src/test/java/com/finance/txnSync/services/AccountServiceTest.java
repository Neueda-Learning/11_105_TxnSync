package com.finance.txnSync.services;

import com.finance.txnSync.models.Account;
import com.finance.txnSync.repositories.AccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

    @Mock
    private AccountRepository accountRepository;

    private AccountService accountService;

    @BeforeEach
    void setUp() {
        accountService = new AccountService(accountRepository);
    }

    @Test
    void getAllAccountsReturnsRepositoryResult() {
        List<Account> accounts = List.of(new Account(), new Account());
        when(accountRepository.findAll()).thenReturn(accounts);

        List<Account> result = accountService.getAllAccounts();

        assertSame(accounts, result);
        verify(accountRepository).findAll();
    }

    @Test
    void getAccountByIdReturnsAccountWhenFound() {
        Account account = new Account();
        account.setAccountId("A-1");
        when(accountRepository.findById("A-1")).thenReturn(account);

        Account result = accountService.getAccountById("A-1");

        assertSame(account, result);
        verify(accountRepository).findById("A-1");
    }

    @Test
    void getAccountByIdReturnsNullWhenRepositoryThrows() {
        when(accountRepository.findById("A-1")).thenThrow(new RuntimeException("db"));

        Account result = accountService.getAccountById("A-1");

        assertNull(result);
    }

    @Test
    void createAccountSetsCreatedAtWhenMissing() {
        Account account = new Account();
        account.setAccountId("A-1");
        account.setCreatedAt(null);

        Account result = accountService.createAccount(account);

        assertSame(account, result);
        assertNotNull(result.getCreatedAt());
        verify(accountRepository).save(account);
    }

    @Test
    void createAccountPreservesCreatedAtWhenPresent() {
        LocalDateTime createdAt = LocalDateTime.now().minusDays(5);
        Account account = new Account();
        account.setAccountId("A-1");
        account.setCreatedAt(createdAt);

        Account result = accountService.createAccount(account);

        assertSame(account, result);
        assertEquals(createdAt, result.getCreatedAt());
        verify(accountRepository).save(account);
    }

    @Test
    void createAccountPropagatesRepositoryException() {
        Account account = new Account();
        when(accountRepository.save(account)).thenThrow(new RuntimeException("db"));

        assertThrows(RuntimeException.class, () -> accountService.createAccount(account));
    }
}

