package com.finance.txnSync.repositories;
import com.finance.txnSync.models.Alert;
import java.util.List;

public interface AlertRepository {
    int save(Alert alert);
    int updateStatus(Long id, String status, String resolutionNotes);
    List<Alert> findAll();
    Alert findById(Long id);
}