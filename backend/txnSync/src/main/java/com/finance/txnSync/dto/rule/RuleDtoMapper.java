package com.finance.txnSync.dto.rule;

import com.finance.txnSync.models.Rule;

public final class RuleDtoMapper {

    private RuleDtoMapper() {
    }

    public static Rule toModel(UpdateRuleRequestDto dto) {
        if (dto == null) {
            return null;
        }
        Rule rule = new Rule();
        rule.setRuleName(dto.ruleName());
        rule.setRuleType(dto.ruleType());
        rule.setSeverity(dto.severity());
        rule.setThresholdAmount(dto.thresholdAmount());
        rule.setTimeWindowMinutes(dto.timeWindowMinutes());
        rule.setTransactionCount(dto.transactionCount());
        rule.setActive(dto.active());
        return rule;
    }

    public static RuleResponseDto toResponse(Rule rule) {
        if (rule == null) {
            return null;
        }
        return new RuleResponseDto(
                rule.getId(),
                rule.getRuleName(),
                rule.getRuleType(),
                rule.getSeverity(),
                rule.getThresholdAmount(),
                rule.getTimeWindowMinutes(),
                rule.getTransactionCount(),
                rule.getActive()
        );
    }
}

