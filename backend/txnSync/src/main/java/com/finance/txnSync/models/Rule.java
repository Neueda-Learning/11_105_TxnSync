package com.finance.txnSync.models;

import java.math.BigDecimal;

public class Rule {
    
    private Long id; 
    private String ruleName;
    private String ruleType;
    private String severity;
    private BigDecimal thresholdAmount;
    private Integer timeWindowMinutes;
    private Integer transactionCount;
    private Boolean isActive;

    public Rule() {}

    public Rule(Long id, String ruleName, String ruleType, String severity, 
                BigDecimal thresholdAmount, Integer timeWindowMinutes,
                Integer transactionCount, Boolean isActive) {
        this.id = id;
        this.ruleName = ruleName;
        this.ruleType = ruleType;
        this.severity = severity;
        this.thresholdAmount = thresholdAmount;
        this.timeWindowMinutes = timeWindowMinutes;
        this.transactionCount = transactionCount;
        this.isActive = isActive;
    }

    public Long getId() { 
        return id; 
    }
    public void setId(Long id) { 
        this.id = id; 
    }

    public String getRuleName() { 
        return ruleName; 
    }
    public void setRuleName(String ruleName) { 
        this.ruleName = ruleName; 
    }

    public String getRuleType() { 
        return ruleType; 
    }
    public void setRuleType(String ruleType) { 
        this.ruleType = ruleType; 
    }

    public String getSeverity() { 
        return severity; 
    }
    public void setSeverity(String severity) { 
        this.severity = severity; 
    }

    public BigDecimal getThresholdAmount() { 
        return thresholdAmount; 
    }
    public void setThresholdAmount(BigDecimal thresholdAmount) { 
        this.thresholdAmount = thresholdAmount; 
    }

    public Integer getTimeWindowMinutes() { 
        return timeWindowMinutes; 
    }
    public void setTimeWindowMinutes(Integer timeWindowMinutes) { 
        this.timeWindowMinutes = timeWindowMinutes; 
    }

    public Integer getTransactionCount() { 
        return transactionCount; 
    }
    public void setTransactionCount(Integer transactionCount) { 
        this.transactionCount = transactionCount; 
    }

    public boolean isActive() {
        return Boolean.TRUE.equals(isActive);
    }
    public void setActive(Boolean active) {
        isActive = active; 
    }

    public Boolean getActive() {
        return isActive;
    }
}