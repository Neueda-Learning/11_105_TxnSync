package com.finance.txnSync.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finance.txnSync.models.Account;
import com.finance.txnSync.services.AccountService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AccountControllerTest {

    @Mock
    private AccountService accountService;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new AccountController(accountService)).build();
        objectMapper = new ObjectMapper().findAndRegisterModules();
    }

    @Test
    void getAllAccountsReturnsOk() throws Exception {
        Account account = new Account("A-1", "Primary", "Bank A", LocalDateTime.now());
        when(accountService.getAllAccounts()).thenReturn(List.of(account));

        mockMvc.perform(get("/api/v1/accounts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].accountId").value("A-1"));

        verify(accountService).getAllAccounts();
    }

    @Test
    void getAccountByIdReturnsOkWhenFound() throws Exception {
        Account account = new Account("A-1", "Primary", "Bank A", LocalDateTime.now());
        when(accountService.getAccountById("A-1")).thenReturn(account);

        mockMvc.perform(get("/api/v1/accounts/A-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accountId").value("A-1"));

        verify(accountService).getAccountById("A-1");
    }

    @Test
    void getAccountByIdReturnsNotFoundWhenMissing() throws Exception {
        when(accountService.getAccountById("A-404")).thenReturn(null);

        mockMvc.perform(get("/api/v1/accounts/A-404"))
                .andExpect(status().isNotFound());

        verify(accountService).getAccountById("A-404");
    }

    @Test
    void createAccountReturnsCreated() throws Exception {
        Account request = new Account("A-2", "Savings", "Bank B", null);
        Account created = new Account("A-2", "Savings", "Bank B", LocalDateTime.now());
        when(accountService.createAccount(any(Account.class))).thenReturn(created);

        mockMvc.perform(post("/api/v1/accounts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accountId").value("A-2"));

        ArgumentCaptor<Account> accountCaptor = ArgumentCaptor.forClass(Account.class);
        verify(accountService).createAccount(accountCaptor.capture());
        Account captured = accountCaptor.getValue();
        assertEquals("A-2", captured.getAccountId());
        assertEquals("Savings", captured.getAccountName());
        assertEquals("Bank B", captured.getInstitutionName());
    }
}

