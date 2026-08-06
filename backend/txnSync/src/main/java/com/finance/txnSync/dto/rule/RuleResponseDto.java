package com.finance.txnSync.dto.rule;

import java.math.BigDecimal;

public record RuleResponseDto(
        Long id,
        String ruleName,
        String ruleType,
        String severity,
        BigDecimal thresholdAmount,
        Integer timeWindowMinutes,
        Integer transactionCount,
        Boolean active
) {
}

