package com.finance.txnSync.services;

import com.finance.txnSync.models.Alert;
import com.finance.txnSync.repositories.AlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AlertService {

    private final AlertRepository alertRepository;

    @Autowired
    public AlertService(AlertRepository alertRepository) {
        this.alertRepository = alertRepository;
    }

    public List<Alert> getAllAlerts() {
        return alertRepository.findAll();
    }

    public Alert getAlertById(Long id) {
        try {
            return alertRepository.findById(id);
        } catch (Exception e) {
            return null;
        }
    }

    public boolean updateAlertStatus(Long id, String status, String resolutionNotes) {
        int updated = alertRepository.updateStatus(id, status, resolutionNotes);
        return updated > 0;
    }
}
