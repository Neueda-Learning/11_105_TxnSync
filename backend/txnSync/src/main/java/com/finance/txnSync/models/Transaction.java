package com.finance.txnSync.models;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class Transaction {
    
    private Long id;
    private String accountId;
    private String payeeId;
    private String payeeInstitutionName;
    private BigDecimal amount;
    private String currency;
    private String type;
    private String status;
    private String description;
    private LocalDateTime timestamp;

    public Transaction() {}

    public Transaction(Long id, String accountId, String payeeId, String payeeInstitutionName, 
                       BigDecimal amount, String currency, String type, String status, 
                       String description, LocalDateTime timestamp) {
        this.id = id;
        this.accountId = accountId;
        this.payeeId = payeeId;
        this.payeeInstitutionName = payeeInstitutionName;
        this.amount = amount;
        this.currency = currency;
        this.type = type;
        this.status = status;
        this.description = description;
        this.timestamp = timestamp;
    }

    public Long getId() { 
        return id; 
    }

    public void setId(Long id) { 
        this.id = id; 
    }

    public String getAccountId() { 
        return accountId; 
    }

    public void setAccountId(String accountId) { 
        this.accountId = accountId; 
    }

    public String getPayeeId() { 
        return payeeId; 
    }

    public void setPayeeId(String payeeId) { 
        this.payeeId = payeeId; 
    }

    public String getPayeeInstitutionName() { 
        return payeeInstitutionName; 
    }

    public void setPayeeInstitutionName(String payeeInstitutionName) { 
        this.payeeInstitutionName = payeeInstitutionName; 
    }

    public BigDecimal getAmount() { 
        return amount;
    }
    public void setAmount(BigDecimal amount) { 
        this.amount = amount; 
    }

    public String getCurrency() { 
        return currency; 
    }
    public void setCurrency(String currency) { 
        this.currency = currency; 
    }

    public String getType() { 
        return type; 
    }
    public void setType(String type) { 
        this.type = type; 
    }

    public String getStatus() { 
        return status; 
    }
    public void setStatus(String status) { 
        this.status = status; 
    }

    public String getDescription() { 
        return description; 
    }
    public void setDescription(String description) { 
        this.description = description; 
    }

    public LocalDateTime getTimestamp() { 
        return timestamp; 
    }
    public void setTimestamp(LocalDateTime timestamp) { 
        this.timestamp = timestamp; 
    }
}