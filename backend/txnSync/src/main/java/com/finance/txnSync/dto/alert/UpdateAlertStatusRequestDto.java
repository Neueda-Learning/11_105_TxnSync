package com.finance.txnSync.dto.alert;

import jakarta.validation.constraints.NotBlank;

public record UpdateAlertStatusRequestDto(
        @NotBlank String status,
        String resolutionNotes
) {
}

