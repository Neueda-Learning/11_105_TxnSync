package com.finance.txnSync.services;

import com.finance.txnSync.models.Alert;
import com.finance.txnSync.models.Rule;
import com.finance.txnSync.models.Transaction;
import com.finance.txnSync.repositories.AlertRepository;
import com.finance.txnSync.repositories.RuleRepository;
import com.finance.txnSync.repositories.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockedConstruction;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mockConstruction;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private RuleRepository ruleRepository;

    @Mock
    private AlertRepository alertRepository;

    private TransactionService transactionService;

    @BeforeEach
    void setUp() {
        transactionService = new TransactionService(transactionRepository, ruleRepository, alertRepository);
    }

    @Test
    void getAllTransactionsReturnsRepositoryResult() {
        List<Transaction> expected = List.of(new Transaction(), new Transaction());
        when(transactionRepository.findAll()).thenReturn(expected);

        List<Transaction> actual = transactionService.getAllTransactions();

        assertSame(expected, actual);
        verify(transactionRepository).findAll();
    }

    @Test
    void getTransactionByIdReturnsEntityWhenFound() {
        Transaction expected = new Transaction();
        expected.setId(55L);
        when(transactionRepository.findById(55L)).thenReturn(expected);

        Transaction actual = transactionService.getTransactionById(55L);

        assertSame(expected, actual);
    }

    @Test
    void getTransactionByIdReturnsNullWhenRepositoryThrows() {
        when(transactionRepository.findById(55L)).thenThrow(new RuntimeException("DB issue"));

        Transaction actual = transactionService.getTransactionById(55L);

        assertNull(actual);
    }

    @Test
    void processTransactionAppliesDefaultsWhenMissing() {
        Transaction input = new Transaction();
        input.setAmount(new BigDecimal("120"));
        input.setCurrency("USD");

        Transaction saved = new Transaction();
        saved.setId(1L);
        saved.setAmount(new BigDecimal("120"));
        saved.setCurrency("USD");
        saved.setTimestamp(input.getTimestamp());
        saved.setStatus(input.getStatus());

        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> {
            Transaction arg = invocation.getArgument(0);
            saved.setTimestamp(arg.getTimestamp());
            saved.setStatus(arg.getStatus());
            return saved;
        });
        when(ruleRepository.findAllActiveRules()).thenReturn(List.of());

        Transaction result = transactionService.processTransaction(input);

        assertNotNull(input.getTimestamp());
        assertEquals("COMPLETED", input.getStatus());
        assertSame(saved, result);
        verify(transactionRepository).save(input);
        verify(ruleRepository).findAllActiveRules();
        verify(alertRepository, never()).save(any(Alert.class));
    }

    @Test
    void processTransactionPreservesExistingTimestampAndStatus() {
        LocalDateTime existingTimestamp = LocalDateTime.now().minusDays(1);
        Transaction input = new Transaction();
        input.setTimestamp(existingTimestamp);
        input.setStatus("PENDING");

        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(ruleRepository.findAllActiveRules()).thenReturn(List.of());

        Transaction result = transactionService.processTransaction(input);

        assertEquals(existingTimestamp, result.getTimestamp());
        assertEquals("PENDING", result.getStatus());
    }

    @Test
    void processTransactionTriggersAmountRuleForUsdWhenThresholdMet() {
        Rule rule = amountRule(101L, "9000");
        Transaction saved = baseTransaction(12L, "A-1", "P-1", new BigDecimal("9000"), "USD");

        when(transactionRepository.save(any(Transaction.class))).thenReturn(saved);
        when(ruleRepository.findAllActiveRules()).thenReturn(List.of(rule));

        transactionService.processTransaction(new Transaction());

        ArgumentCaptor<Alert> captor = ArgumentCaptor.forClass(Alert.class);
        verify(alertRepository).save(captor.capture());
        Alert alert = captor.getValue();
        assertEquals(12L, alert.getTransactionId());
        assertEquals(101L, alert.getRuleId());
        assertEquals("OPEN", alert.getStatus());
        assertNotNull(alert.getCreatedAt());
        assertTrue(alert.getResolutionNotes().contains("9000 USD"));
        assertTrue(alert.getResolutionNotes().contains("9000.00 USD"));
    }

    @Test
    void processTransactionDoesNotTriggerAmountRuleWhenBelowThreshold() {
        Rule rule = amountRule(101L, "1000");
        Transaction saved = baseTransaction(12L, "A-1", "P-1", new BigDecimal("999.99"), "USD");

        when(transactionRepository.save(any(Transaction.class))).thenReturn(saved);
        when(ruleRepository.findAllActiveRules()).thenReturn(List.of(rule));

        transactionService.processTransaction(new Transaction());

        verify(alertRepository, never()).save(any(Alert.class));
    }

    @Test
    void processTransactionDoesNotTriggerAmountRuleWhenTransactionAmountIsNull() {
        Rule rule = amountRule(101L, "1000");
        Transaction saved = baseTransaction(12L, "A-1", "P-1", null, "USD");

        when(transactionRepository.save(any(Transaction.class))).thenReturn(saved);
        when(ruleRepository.findAllActiveRules()).thenReturn(List.of(rule));

        transactionService.processTransaction(new Transaction());

        verify(alertRepository, never()).save(any(Alert.class));
    }

    @Test
    void processTransactionDoesNotTriggerAmountRuleWhenThresholdIsNull() {
        Rule rule = amountRule(101L, null);
        Transaction saved = baseTransaction(12L, "A-1", "P-1", new BigDecimal("5000"), "USD");

        when(transactionRepository.save(any(Transaction.class))).thenReturn(saved);
        when(ruleRepository.findAllActiveRules()).thenReturn(List.of(rule));

        transactionService.processTransaction(new Transaction());

        verify(alertRepository, never()).save(any(Alert.class));
    }

    @Test
    void processTransactionUsesLiveRateWhenAvailable() {
        Rule rule = amountRule(101L, "100");
        Transaction saved = baseTransaction(12L, "A-1", "P-1", new BigDecimal("60"), "EUR");

        when(transactionRepository.save(any(Transaction.class))).thenReturn(saved);
        when(ruleRepository.findAllActiveRules()).thenReturn(List.of(rule));

        try (MockedConstruction<RestTemplate> mocked = mockConstruction(RestTemplate.class,
                (mock, context) -> when(mock.getForObject(anyString(), eq(Object.class)))
                        .thenReturn(Map.of("rate", new BigDecimal("2.0"))))) {

            transactionService.processTransaction(new Transaction());
        }

        verify(alertRepository).save(any(Alert.class));
    }

    @Test
    void processTransactionFallsBackToStaticRateWhenLiveRequestFails() {
        Rule rule = amountRule(101L, "107");
        Transaction saved = baseTransaction(12L, "A-1", "P-1", new BigDecimal("100"), "EUR");

        when(transactionRepository.save(any(Transaction.class))).thenReturn(saved);
        when(ruleRepository.findAllActiveRules()).thenReturn(List.of(rule));

        try (MockedConstruction<RestTemplate> mocked = mockConstruction(RestTemplate.class,
                (mock, context) -> when(mock.getForObject(anyString(), eq(Object.class)))
                        .thenThrow(new RestClientException("timeout")))) {

            transactionService.processTransaction(new Transaction());
        }

        verify(alertRepository).save(any(Alert.class));
    }

    @Test
    void processTransactionFallsBackToStaticRateWhenLivePayloadInvalid() {
        Rule rule = amountRule(101L, "107");
        Transaction saved = baseTransaction(12L, "A-1", "P-1", new BigDecimal("100"), "EUR");

        when(transactionRepository.save(any(Transaction.class))).thenReturn(saved);
        when(ruleRepository.findAllActiveRules()).thenReturn(List.of(rule));

        try (MockedConstruction<RestTemplate> mocked = mockConstruction(RestTemplate.class,
                (mock, context) -> when(mock.getForObject(anyString(), eq(Object.class)))
                        .thenReturn(Map.of("unexpected", 999)))) {

            transactionService.processTransaction(new Transaction());
        }

        verify(alertRepository).save(any(Alert.class));
    }

    @Test
    void processTransactionDoesNotTriggerAmountRuleWhenNoLiveOrStaticRate() {
        Rule rule = amountRule(101L, "1");
        Transaction saved = baseTransaction(12L, "A-1", "P-1", new BigDecimal("100"), "XYZ");

        when(transactionRepository.save(any(Transaction.class))).thenReturn(saved);
        when(ruleRepository.findAllActiveRules()).thenReturn(List.of(rule));

        try (MockedConstruction<RestTemplate> mocked = mockConstruction(RestTemplate.class,
                (mock, context) -> when(mock.getForObject(anyString(), eq(Object.class)))
                        .thenThrow(new RestClientException("service down")))) {

            transactionService.processTransaction(new Transaction());
        }

        verify(alertRepository, never()).save(any(Alert.class));
    }

    @Test
    void processTransactionTriggersNewPayeeRuleWhenNoPreviousTransactions() {
        Rule rule = newPayeeRule(202L);
        Transaction saved = baseTransaction(50L, "ACC-1", "PAYEE-1", new BigDecimal("10"), "USD");

        when(transactionRepository.save(any(Transaction.class))).thenReturn(saved);
        when(ruleRepository.findAllActiveRules()).thenReturn(List.of(rule));
        when(transactionRepository.countPreviousTransactions(eq("ACC-1"), eq("PAYEE-1"), any(LocalDateTime.class))).thenReturn(0L);

        transactionService.processTransaction(new Transaction());

        ArgumentCaptor<Alert> captor = ArgumentCaptor.forClass(Alert.class);
        verify(alertRepository).save(captor.capture());
        assertEquals(202L, captor.getValue().getRuleId());
        assertTrue(captor.getValue().getResolutionNotes().contains("new payee"));
    }

    @Test
    void processTransactionDoesNotTriggerNewPayeeRuleWhenPreviousTransactionsExist() {
        Rule rule = newPayeeRule(202L);
        Transaction saved = baseTransaction(50L, "ACC-1", "PAYEE-1", new BigDecimal("10"), "USD");

        when(transactionRepository.save(any(Transaction.class))).thenReturn(saved);
        when(ruleRepository.findAllActiveRules()).thenReturn(List.of(rule));
        when(transactionRepository.countPreviousTransactions(eq("ACC-1"), eq("PAYEE-1"), any(LocalDateTime.class))).thenReturn(3L);

        transactionService.processTransaction(new Transaction());

        verify(alertRepository, never()).save(any(Alert.class));
    }

    @Test
    void processTransactionDoesNotQueryHistoryForNewPayeeRuleWhenAccountMissing() {
        Rule rule = newPayeeRule(202L);
        Transaction saved = baseTransaction(50L, null, "PAYEE-1", new BigDecimal("10"), "USD");

        when(transactionRepository.save(any(Transaction.class))).thenReturn(saved);
        when(ruleRepository.findAllActiveRules()).thenReturn(List.of(rule));

        transactionService.processTransaction(new Transaction());

        verify(transactionRepository, never()).countPreviousTransactions(anyString(), anyString(), any(LocalDateTime.class));
        verify(alertRepository, never()).save(any(Alert.class));
    }

    @Test
    void processTransactionUsesZeroTransactionIdInAlertWhenSavedTransactionIdIsNull() {
        Rule rule = amountRule(101L, "100");
        Transaction saved = baseTransaction(null, "A-1", "P-1", new BigDecimal("150"), "USD");

        when(transactionRepository.save(any(Transaction.class))).thenReturn(saved);
        when(ruleRepository.findAllActiveRules()).thenReturn(List.of(rule));

        transactionService.processTransaction(new Transaction());

        ArgumentCaptor<Alert> captor = ArgumentCaptor.forClass(Alert.class);
        verify(alertRepository).save(captor.capture());
        assertEquals(0L, captor.getValue().getTransactionId());
    }

    @Test
    void processTransactionCanCreateMultipleAlertsWhenMultipleRulesTrigger() {
        Rule amountRule = amountRule(101L, "100");
        Rule newPayeeRule = newPayeeRule(202L);
        Transaction saved = baseTransaction(50L, "ACC-1", "PAYEE-1", new BigDecimal("150"), "USD");

        when(transactionRepository.save(any(Transaction.class))).thenReturn(saved);
        when(ruleRepository.findAllActiveRules()).thenReturn(List.of(amountRule, newPayeeRule));
        when(transactionRepository.countPreviousTransactions(eq("ACC-1"), eq("PAYEE-1"), any(LocalDateTime.class))).thenReturn(0L);

        transactionService.processTransaction(new Transaction());

        verify(alertRepository, times(2)).save(any(Alert.class));
    }

    private Rule amountRule(Long id, String thresholdAmount) {
        Rule rule = new Rule();
        rule.setId(id);
        rule.setRuleType("AMOUNT");
        if (thresholdAmount != null) {
            rule.setThresholdAmount(new BigDecimal(thresholdAmount));
        }
        return rule;
    }

    private Rule newPayeeRule(Long id) {
        Rule rule = new Rule();
        rule.setId(id);
        rule.setRuleType("NEW_PAYEE");
        return rule;
    }

    private Transaction baseTransaction(Long id,
                                        String accountId,
                                        String payeeId,
                                        BigDecimal amount,
                                        String currency) {
        Transaction tx = new Transaction();
        tx.setId(id);
        tx.setAccountId(accountId);
        tx.setPayeeId(payeeId);
        tx.setAmount(amount);
        tx.setCurrency(currency);
        tx.setTimestamp(LocalDateTime.now().minusMinutes(1));
        tx.setStatus("COMPLETED");
        return tx;
    }
}

