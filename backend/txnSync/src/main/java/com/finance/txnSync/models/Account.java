package com.finance.txnSync.models;

import java.time.LocalDateTime;

public class Account {
    
    private String accountId;
    private String accountName;
    private String institutionName;
    private LocalDateTime createdAt;

    public Account() {}

    public Account(String accountId, String accountName, String institutionName, LocalDateTime createdAt) {
        this.accountId = accountId;
        this.accountName = accountName;
        this.institutionName = institutionName;
        this.createdAt = createdAt;
    }

    public String getAccountId() { 
        return accountId; 
    }

    public void setAccountId(String accountId) { 
        this.accountId = accountId; 
    }

    public String getAccountName() { 
        return accountName; 
    }
    public void setAccountName(String accountName) { 
        this.accountName = accountName; 
    }

    public String getInstitutionName() { 
        return institutionName; 
    }
    public void setInstitutionName(String institutionName) { 
        this.institutionName = institutionName; 
    }

    public LocalDateTime getCreatedAt() { 
        return createdAt; 
    }
    public void setCreatedAt(LocalDateTime createdAt) { 
        this.createdAt = createdAt; 
    }
}