package com.finance.txnSync.dto.transaction;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CreateTransactionRequestDto(
        @NotBlank String accountId,
        @NotBlank String payeeId,
        @NotBlank String payeeInstitutionName,
        @NotNull BigDecimal amount,
        @NotBlank @Pattern(regexp = "^[A-Za-z]{3}$", message = "currency must be a 3-letter ISO code like USD") String currency,
        @NotBlank String type,
        String status,
        String description,
        LocalDateTime timestamp
) {
}

