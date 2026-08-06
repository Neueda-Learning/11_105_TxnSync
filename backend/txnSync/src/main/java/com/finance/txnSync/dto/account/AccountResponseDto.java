package com.finance.txnSync.dto.account;

import java.time.LocalDateTime;

public record AccountResponseDto(
        String accountId,
        String accountName,
        String institutionName,
        LocalDateTime createdAt
) {
}

