package com.finance.txnSync.services;

import com.finance.txnSync.models.Alert;
import com.finance.txnSync.repositories.AlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
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
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    public boolean updateAlertStatus(Long id, String status, String resolutionNotes) {
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("Status is required.");
        }

        String normalizedStatus = status.trim().toUpperCase();
        if (!normalizedStatus.equals("ACKNOWLEDGED")
                && !normalizedStatus.equals("INVESTIGATING")
                && !normalizedStatus.equals("DISMISSED")
                && !normalizedStatus.equals("CLOSED")) {
            throw new IllegalArgumentException("Unsupported alert status: " + status);
        }

        String sanitizedResolutionNotes = resolutionNotes == null ? null : resolutionNotes.trim();
        if ((normalizedStatus.equals("DISMISSED") || normalizedStatus.equals("CLOSED"))
                && (sanitizedResolutionNotes == null || sanitizedResolutionNotes.isEmpty())) {
            throw new IllegalArgumentException("Resolution notes are required when status is " + normalizedStatus + ".");
        }

        if (sanitizedResolutionNotes != null && sanitizedResolutionNotes.isEmpty()) {
            sanitizedResolutionNotes = null;
        }

        int updated = alertRepository.updateStatus(id, normalizedStatus, sanitizedResolutionNotes);
        return updated > 0;
    }
}
