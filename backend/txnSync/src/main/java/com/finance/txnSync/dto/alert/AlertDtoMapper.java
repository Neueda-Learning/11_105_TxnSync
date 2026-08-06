package com.finance.txnSync.dto.alert;

import com.finance.txnSync.models.Alert;

public final class AlertDtoMapper {

    private AlertDtoMapper() {
    }

    public static AlertResponseDto toResponse(Alert alert) {
        if (alert == null) {
            return null;
        }
        return new AlertResponseDto(
                alert.getId(),
                alert.getTransactionId(),
                alert.getRuleId(),
                alert.getStatus(),
                alert.getCreatedAt(),
                alert.getAcknowledgedAt(),
                alert.getResolutionNotes()
        );
    }
}

