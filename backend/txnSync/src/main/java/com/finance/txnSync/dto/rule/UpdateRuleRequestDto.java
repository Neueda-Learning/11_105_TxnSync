package com.finance.txnSync.dto.rule;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record UpdateRuleRequestDto(
        @NotBlank String ruleName,
        @NotBlank String ruleType,
        @NotBlank String severity,
        BigDecimal thresholdAmount,
        Integer timeWindowMinutes,
        Integer transactionCount,
        Boolean active
) {
}

