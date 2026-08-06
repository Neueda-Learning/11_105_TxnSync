package com.finance.txnSync.dto.account;

import com.finance.txnSync.models.Account;

public final class AccountDtoMapper {

    private AccountDtoMapper() {
    }

    public static Account toModel(CreateAccountRequestDto dto) {
        if (dto == null) {
            return null;
        }
        Account account = new Account();
        account.setAccountId(dto.accountId());
        account.setAccountName(dto.accountName());
        account.setInstitutionName(dto.institutionName());
        return account;
    }

    public static AccountResponseDto toResponse(Account account) {
        if (account == null) {
            return null;
        }
        return new AccountResponseDto(
                account.getAccountId(),
                account.getAccountName(),
                account.getInstitutionName(),
                account.getCreatedAt()
        );
    }
}

