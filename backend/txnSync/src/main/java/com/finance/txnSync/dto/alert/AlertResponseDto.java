package com.finance.txnSync.dto.alert;

import java.time.LocalDateTime;

public record AlertResponseDto(
        Long id,
        Long transactionId,
        Long ruleId,
        String status,
        LocalDateTime createdAt,
        LocalDateTime acknowledgedAt,
        String resolutionNotes
) {
}

