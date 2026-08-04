package com.finance.txnSync.controllers;

import com.finance.txnSync.models.Alert;
import com.finance.txnSync.services.AlertService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/alerts")
public class AlertController {

    private final AlertService alertService;

    @Autowired
    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    @GetMapping
    public ResponseEntity<List<Alert>> getAllAlerts() {
        List<Alert> alerts = alertService.getAllAlerts();
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Alert> getAlertById(@PathVariable Long id) {
        Alert alert = alertService.getAlertById(id);
        if (alert == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(alert);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateAlertStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        try {
            String status = payload.get("status");
            String resolutionNotes = payload.get("resolutionNotes");
            boolean updated = alertService.updateAlertStatus(id, status, resolutionNotes);
            if (updated) {
                return ResponseEntity.ok(Map.of("message", "Alert status updated successfully."));
            }
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("message", e.getMessage()));
        }
    }
}
