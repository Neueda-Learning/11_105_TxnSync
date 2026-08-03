package com.finance.txnSync.repositories;

import com.finance.txnSync.models.Account;
import java.util.List;

public interface AccountRepository {
    int save(Account account);
    List<Account> findAll();
    Account findById(String accountId);
}
