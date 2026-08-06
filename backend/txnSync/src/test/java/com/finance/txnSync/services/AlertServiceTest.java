package com.finance.txnSync.services;

import com.finance.txnSync.models.Alert;
import com.finance.txnSync.repositories.AlertRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AlertServiceTest {

    @Mock
    private AlertRepository alertRepository;

    private AlertService alertService;

    @BeforeEach
    void setUp() {
        alertService = new AlertService(alertRepository);
    }

    @Test
    void getAllAlertsReturnsRepositoryResult() {
        List<Alert> alerts = List.of(new Alert(), new Alert());
        when(alertRepository.findAll()).thenReturn(alerts);

        List<Alert> result = alertService.getAllAlerts();

        assertSame(alerts, result);
        verify(alertRepository).findAll();
    }

    @Test
    void getAlertByIdReturnsAlertWhenFound() {
        Alert alert = new Alert();
        alert.setId(1L);
        when(alertRepository.findById(1L)).thenReturn(alert);

        Alert result = alertService.getAlertById(1L);

        assertSame(alert, result);
        verify(alertRepository).findById(1L);
    }

    @Test
    void getAlertByIdReturnsNullWhenRepositoryThrows() {
        when(alertRepository.findById(1L)).thenThrow(new RuntimeException("db"));

        Alert result = alertService.getAlertById(1L);

        assertNull(result);
    }

    @Test
    void updateAlertStatusThrowsWhenStatusIsNull() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> alertService.updateAlertStatus(1L, null, "note"));

        assertEquals("Status is required.", ex.getMessage());
    }

    @Test
    void updateAlertStatusThrowsWhenStatusIsBlank() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> alertService.updateAlertStatus(1L, "   ", "note"));

        assertEquals("Status is required.", ex.getMessage());
    }

    @Test
    void updateAlertStatusThrowsWhenStatusUnsupported() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> alertService.updateAlertStatus(1L, "OPEN", "note"));

        assertEquals("Unsupported alert status: OPEN", ex.getMessage());
    }

    @Test
    void updateAlertStatusThrowsWhenDismissedWithoutNotes() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> alertService.updateAlertStatus(1L, "DISMISSED", "   "));

        assertEquals("Resolution notes are required when status is DISMISSED.", ex.getMessage());
    }

    @Test
    void updateAlertStatusThrowsWhenClosedWithoutNotes() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> alertService.updateAlertStatus(1L, "CLOSED", null));

        assertEquals("Resolution notes are required when status is CLOSED.", ex.getMessage());
    }

    @Test
    void updateAlertStatusNormalizesStatusAndTrimsNotes() {
        when(alertRepository.updateStatus(1L, "DISMISSED", "investigated and closed")).thenReturn(1);

        boolean updated = alertService.updateAlertStatus(1L, " dismissed ", "  investigated and closed  ");

        assertTrue(updated);
        verify(alertRepository).updateStatus(1L, "DISMISSED", "investigated and closed");
    }

    @Test
    void updateAlertStatusSendsNullNotesForAcknowledgedWhenBlank() {
        when(alertRepository.updateStatus(1L, "ACKNOWLEDGED", null)).thenReturn(1);

        boolean updated = alertService.updateAlertStatus(1L, "acknowledged", "   ");

        assertTrue(updated);
        verify(alertRepository).updateStatus(1L, "ACKNOWLEDGED", null);
    }

    @Test
    void updateAlertStatusReturnsFalseWhenNoRowUpdated() {
        when(alertRepository.updateStatus(1L, "INVESTIGATING", null)).thenReturn(0);

        boolean updated = alertService.updateAlertStatus(1L, "INVESTIGATING", null);

        assertFalse(updated);
        verify(alertRepository).updateStatus(eq(1L), eq("INVESTIGATING"), eq(null));
    }
}

