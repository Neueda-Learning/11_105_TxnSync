package com.finance.txnSync.dto.account;

import jakarta.validation.constraints.NotBlank;

public record CreateAccountRequestDto(
        @NotBlank String accountId,
        @NotBlank String accountName,
        @NotBlank String institutionName
) {
}

