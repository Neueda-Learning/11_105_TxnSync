package com.finance.txnSync.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finance.txnSync.models.Transaction;
import com.finance.txnSync.services.TransactionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class TransactionControllerTest {

    @Mock
    private TransactionService transactionService;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new TransactionController(transactionService)).build();
        objectMapper = new ObjectMapper().findAndRegisterModules();
    }

    @Test
    void getAllTransactionsReturnsOk() throws Exception {
        Transaction tx = new Transaction(1L, "A-1", "P-1", "Bank B", new BigDecimal("10"), "USD", "TRANSFER", "COMPLETED", "Test", LocalDateTime.now());
        when(transactionService.getAllTransactions()).thenReturn(List.of(tx));

        mockMvc.perform(get("/api/v1/transactions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1));

        verify(transactionService).getAllTransactions();
    }

    @Test
    void getTransactionByIdReturnsOkWhenFound() throws Exception {
        Transaction tx = new Transaction(1L, "A-1", "P-1", "Bank B", new BigDecimal("10"), "USD", "TRANSFER", "COMPLETED", "Test", LocalDateTime.now());
        when(transactionService.getTransactionById(1L)).thenReturn(tx);

        mockMvc.perform(get("/api/v1/transactions/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));

        verify(transactionService).getTransactionById(1L);
    }

    @Test
    void getTransactionByIdReturnsNotFoundWhenMissing() throws Exception {
        when(transactionService.getTransactionById(404L)).thenReturn(null);

        mockMvc.perform(get("/api/v1/transactions/404"))
                .andExpect(status().isNotFound());

        verify(transactionService).getTransactionById(404L);
    }

    @Test
    void createTransactionReturnsCreated() throws Exception {
        Transaction request = new Transaction(null, "A-1", "P-1", "Bank B", new BigDecimal("10"), "USD", "TRANSFER", null, "Test", null);
        Transaction created = new Transaction(11L, "A-1", "P-1", "Bank B", new BigDecimal("10"), "USD", "TRANSFER", "COMPLETED", "Test", LocalDateTime.now());
        doReturn(created).when(transactionService).processTransaction(any(Transaction.class));

        mockMvc.perform(post("/api/v1/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(11));

        ArgumentCaptor<Transaction> transactionCaptor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionService).processTransaction(transactionCaptor.capture());
        Transaction captured = transactionCaptor.getValue();
        assertEquals("A-1", captured.getAccountId());
        assertEquals("P-1", captured.getPayeeId());
        assertEquals("Bank B", captured.getPayeeInstitutionName());
        assertEquals(new BigDecimal("10"), captured.getAmount());
        assertEquals("USD", captured.getCurrency());
        assertEquals("TRANSFER", captured.getType());
        assertEquals("Test", captured.getDescription());
    }
}

