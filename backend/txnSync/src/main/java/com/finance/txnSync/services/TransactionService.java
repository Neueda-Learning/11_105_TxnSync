package com.finance.txnSync.services;

import com.finance.txnSync.models.Alert;
import com.finance.txnSync.models.Rule;
import com.finance.txnSync.models.Transaction;
import com.finance.txnSync.repositories.AlertRepository;
import com.finance.txnSync.repositories.RuleRepository;
import com.finance.txnSync.repositories.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class TransactionService {

    private static final Logger LOGGER = LoggerFactory.getLogger(TransactionService.class);

    private static final Map<String, BigDecimal> TO_USD_RATES = Map.of(
            "USD", BigDecimal.ONE,
            "EUR", new BigDecimal("1.08"),
            "GBP", new BigDecimal("1.27"),
            "INR", new BigDecimal("0.012"),
            "JPY", new BigDecimal("0.0068"),
            "CAD", new BigDecimal("0.74"),
            "AUD", new BigDecimal("0.66"),
            "AED", new BigDecimal("0.27")
    );

    private static final String FX_API_URL = "https://api.frankfurter.dev/v2/rate/{base}/{quote}";
    private static final int FX_TIMEOUT_MS = 2000;

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
        } catch (EmptyResultDataAccessException e) {
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

        // Save transaction and get the persisted object with id
        Transaction saved = transactionRepository.save(transaction);

        // Evaluate active monitoring rules using the saved transaction (with id)
        evaluateRules(saved);

        return saved;
    }

    private void evaluateRules(Transaction transaction) {
        List<Rule> activeRules = ruleRepository.findAllActiveRules();
        for (Rule rule : activeRules) {
            boolean triggered = false;
            String note = null;

            if ("AMOUNT".equalsIgnoreCase(rule.getRuleType()) && rule.getThresholdAmount() != null) {
                BigDecimal amountInUsd = convertToUsd(transaction.getAmount(), transaction.getCurrency());
                if (amountInUsd != null && amountInUsd.compareTo(rule.getThresholdAmount()) >= 0) {
                    triggered = true;
                    String currency = normalizeCurrency(transaction.getCurrency());
                    note = "Transaction amount ("
                            + transaction.getAmount() + " " + currency
                            + " ~ " + amountInUsd + " USD) exceeded threshold ("
                            + rule.getThresholdAmount() + " USD)";
                }
            } else if ("NEW_PAYEE".equalsIgnoreCase(rule.getRuleType())) {
                if (transaction.getPayeeId() != null && transaction.getAccountId() != null) {
                    long previous = transactionRepository.countPreviousTransactions(
                        transaction.getAccountId(),
                        transaction.getPayeeId(),
                        transaction.getTimestamp()
                    );
                    if (previous == 0) {
                        triggered = true;
                        note = "Transaction executed with new payee for this account: " + transaction.getPayeeId();
                    }
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

    private BigDecimal convertToUsd(BigDecimal amount, String currency) {
        if (amount == null) {
            return null;
        }

        String normalizedCurrency = normalizeCurrency(currency);
        BigDecimal rate = getLiveRateToUsd(normalizedCurrency);
        if (rate == null) {
            rate = TO_USD_RATES.get(normalizedCurrency);
            if (rate != null) {
                LOGGER.debug("Using static FX fallback for currency {}", normalizedCurrency);
            }
        }

        if (rate == null) {
            LOGGER.warn("Unable to convert currency {} to USD: no live rate and no static fallback", normalizedCurrency);
            return null;
        }

        return amount.multiply(rate).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal getLiveRateToUsd(String baseCurrency) {
        if ("USD".equals(baseCurrency)) {
            return BigDecimal.ONE;
        }

        try {
            String url = FX_API_URL
                    .replace("{base}", baseCurrency)
                    .replace("{quote}", "USD");

            Object responseBody = buildRestTemplate().getForObject(url, Object.class);
            if (!(responseBody instanceof Map<?, ?> responseMap)) {
                return null;
            }

            return extractRateFromResponse(responseMap);
        } catch (RestClientException ex) {
            LOGGER.warn("Live FX request failed for {} -> USD, falling back to static rates: {}", baseCurrency, ex.getMessage());
            return null;
        } catch (Exception ex) {
            LOGGER.warn("Unexpected live FX parsing issue for {} -> USD, falling back to static rates: {}", baseCurrency, ex.getMessage());
            return null;
        }
    }

    private RestTemplate buildRestTemplate() {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(FX_TIMEOUT_MS);
        requestFactory.setReadTimeout(FX_TIMEOUT_MS);
        return new RestTemplate(requestFactory);
    }

    private BigDecimal extractRateFromResponse(Map<?, ?> body) {
        return toBigDecimal(body.get("rate"));
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        try {
            return new BigDecimal(value.toString());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private String normalizeCurrency(String currency) {
        return currency == null || currency.isBlank() ? "USD" : currency.trim().toUpperCase();
    }
}
