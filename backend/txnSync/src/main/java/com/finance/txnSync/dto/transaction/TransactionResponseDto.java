package com.finance.txnSync.dto.transaction;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TransactionResponseDto(
        Long id,
        String accountId,
        String payeeId,
        String payeeInstitutionName,
        BigDecimal amount,
        String currency,
        String type,
        String status,
        String description,
        LocalDateTime timestamp
) {
}

