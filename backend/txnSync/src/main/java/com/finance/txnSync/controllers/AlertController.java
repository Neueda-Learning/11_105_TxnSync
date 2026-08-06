package com.finance.txnSync.controllers;

import com.finance.txnSync.dto.alert.AlertDtoMapper;
import com.finance.txnSync.dto.alert.AlertResponseDto;
import com.finance.txnSync.dto.alert.AlertStatusUpdateResponseDto;
import com.finance.txnSync.dto.alert.UpdateAlertStatusRequestDto;
import com.finance.txnSync.models.Alert;
import com.finance.txnSync.services.AlertService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/alerts")
public class AlertController {

    private final AlertService alertService;

    @Autowired
    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    @GetMapping
    public ResponseEntity<List<AlertResponseDto>> getAllAlerts() {
        List<AlertResponseDto> alerts = alertService.getAllAlerts()
                .stream()
                .map(AlertDtoMapper::toResponse)
                .toList();
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AlertResponseDto> getAlertById(@PathVariable Long id) {
        Alert alert = alertService.getAlertById(id);
        if (alert == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(AlertDtoMapper.toResponse(alert));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<AlertStatusUpdateResponseDto> updateAlertStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAlertStatusRequestDto payload) {
        boolean updated = alertService.updateAlertStatus(id, payload.status(), payload.resolutionNotes());
        if (updated) {
            return ResponseEntity.ok(new AlertStatusUpdateResponseDto("Alert status updated successfully."));
        }
        return ResponseEntity.notFound().build();
    }
}
