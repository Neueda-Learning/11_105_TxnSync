package com.finance.txnSync.models;

import java.time.LocalDateTime;

public class Alert {
    
    private Long id;
    private Long transactionId;
    private Long ruleId; 
    private String status;      
    private LocalDateTime createdAt;
    private LocalDateTime acknowledgedAt;
    private String resolutionNotes;

    public Alert() {}

    public Alert(Long id, Long transactionId, Long ruleId, String status, 
                 LocalDateTime createdAt, LocalDateTime acknowledgedAt, String resolutionNotes) {
        this.id = id;
        this.transactionId = transactionId;
        this.ruleId = ruleId;
        this.status = status;
        this.createdAt = createdAt;
        this.acknowledgedAt = acknowledgedAt;
        this.resolutionNotes = resolutionNotes;
    }

    public Long getId() { 
        return id; 
    }
    public void setId(Long id) { 
        this.id = id; 
    }

    public Long getTransactionId() { 
        return transactionId; 
    }
    public void setTransactionId(Long transactionId) { 
        this.transactionId = transactionId; 
    }

    public Long getRuleId() { 
        return ruleId; 
    }
    public void setRuleId(Long ruleId) { 
        this.ruleId = ruleId; 
    }

    public String getStatus() { 
        return status; 
    }
    public void setStatus(String status) { 
        this.status = status; 
    }

    public LocalDateTime getCreatedAt() { 
        return createdAt; 
    }
    public void setCreatedAt(LocalDateTime createdAt) { 
        this.createdAt = createdAt; 
    }

    public LocalDateTime getAcknowledgedAt() { 
        return acknowledgedAt; 
    }
    public void setAcknowledgedAt(LocalDateTime acknowledgedAt) { 
        this.acknowledgedAt = acknowledgedAt; 
    }

    public String getResolutionNotes() { 
        return resolutionNotes; 
    }
    public void setResolutionNotes(String resolutionNotes) { 
        this.resolutionNotes = resolutionNotes; 
    }
}