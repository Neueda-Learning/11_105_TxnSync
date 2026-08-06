package com.finance.txnSync.dto.transaction;

import com.finance.txnSync.models.Transaction;

public final class TransactionDtoMapper {

    private TransactionDtoMapper() {
    }

    public static Transaction toModel(CreateTransactionRequestDto dto) {
        if (dto == null) {
            return null;
        }
        Transaction transaction = new Transaction();
        transaction.setAccountId(dto.accountId());
        transaction.setPayeeId(dto.payeeId());
        transaction.setPayeeInstitutionName(dto.payeeInstitutionName());
        transaction.setAmount(dto.amount());
        transaction.setCurrency(dto.currency() == null ? null : dto.currency().trim().toUpperCase());
        transaction.setType(dto.type());
        transaction.setStatus(dto.status());
        transaction.setDescription(dto.description());
        transaction.setTimestamp(dto.timestamp());
        return transaction;
    }

    public static TransactionResponseDto toResponse(Transaction transaction) {
        if (transaction == null) {
            return null;
        }
        return new TransactionResponseDto(
                transaction.getId(),
                transaction.getAccountId(),
                transaction.getPayeeId(),
                transaction.getPayeeInstitutionName(),
                transaction.getAmount(),
                transaction.getCurrency(),
                transaction.getType(),
                transaction.getStatus(),
                transaction.getDescription(),
                transaction.getTimestamp()
        );
    }
}

