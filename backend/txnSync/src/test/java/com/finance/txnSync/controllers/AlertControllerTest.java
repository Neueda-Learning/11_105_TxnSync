package com.finance.txnSync.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finance.txnSync.models.Alert;
import com.finance.txnSync.services.AlertService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AlertControllerTest {

    @Mock
    private AlertService alertService;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new AlertController(alertService)).build();
        objectMapper = new ObjectMapper().findAndRegisterModules();
    }

    @Test
    void getAllAlertsReturnsOk() throws Exception {
        Alert alert = sampleAlert();
        when(alertService.getAllAlerts()).thenReturn(List.of(alert));

        mockMvc.perform(get("/api/v1/alerts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1));

        verify(alertService).getAllAlerts();
    }

    @Test
    void getAlertByIdReturnsOkWhenFound() throws Exception {
        Alert alert = sampleAlert();
        when(alertService.getAlertById(1L)).thenReturn(alert);

        mockMvc.perform(get("/api/v1/alerts/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));

        verify(alertService).getAlertById(1L);
    }

    @Test
    void getAlertByIdReturnsNotFoundWhenMissing() throws Exception {
        when(alertService.getAlertById(404L)).thenReturn(null);

        mockMvc.perform(get("/api/v1/alerts/404"))
                .andExpect(status().isNotFound());

        verify(alertService).getAlertById(404L);
    }

    @Test
    void updateAlertStatusReturnsOkWhenUpdated() throws Exception {
        when(alertService.updateAlertStatus(1L, "ACKNOWLEDGED", null)).thenReturn(true);

        mockMvc.perform(patch("/api/v1/alerts/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "ACKNOWLEDGED"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Alert status updated successfully."));

        verify(alertService).updateAlertStatus(1L, "ACKNOWLEDGED", null);
    }

    @Test
    void updateAlertStatusReturnsNotFoundWhenNoUpdate() throws Exception {
        when(alertService.updateAlertStatus(1L, "ACKNOWLEDGED", null)).thenReturn(false);

        mockMvc.perform(patch("/api/v1/alerts/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "ACKNOWLEDGED"))))
                .andExpect(status().isNotFound());

        verify(alertService).updateAlertStatus(1L, "ACKNOWLEDGED", null);
    }

    @Test
    void updateAlertStatusReturnsBadRequestWhenValidationFails() throws Exception {
        when(alertService.updateAlertStatus(eq(1L), eq("DISMISSED"), eq(null)))
                .thenThrow(new IllegalArgumentException("Resolution notes are required when status is DISMISSED."));

        mockMvc.perform(patch("/api/v1/alerts/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "DISMISSED"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Resolution notes are required when status is DISMISSED."));

        verify(alertService).updateAlertStatus(1L, "DISMISSED", null);
    }

    @Test
    void updateAlertStatusReturnsConflictWhenTransitionInvalid() throws Exception {
        when(alertService.updateAlertStatus(eq(1L), eq("CLOSED"), eq("already closed")))
                .thenThrow(new IllegalStateException("Invalid state transition"));

        mockMvc.perform(patch("/api/v1/alerts/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "status", "CLOSED",
                                "resolutionNotes", "already closed"
                        ))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Invalid state transition"));

        verify(alertService).updateAlertStatus(1L, "CLOSED", "already closed");
    }

    private Alert sampleAlert() {
        return new Alert(1L, 10L, 20L, "OPEN", LocalDateTime.now(), null, "note");
    }
}

