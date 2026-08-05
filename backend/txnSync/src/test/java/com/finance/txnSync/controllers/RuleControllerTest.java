package com.finance.txnSync.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finance.txnSync.models.Rule;
import com.finance.txnSync.services.RuleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RuleControllerTest {

    @Mock
    private RuleService ruleService;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new RuleController(ruleService)).build();
        objectMapper = new ObjectMapper().findAndRegisterModules();
    }

    @Test
    void getAllRulesDefaultsActiveOnlyFalse() throws Exception {
        Rule rule = rule(1L, "High Value", "AMOUNT", "HIGH", "9000");
        when(ruleService.getAllRules(false)).thenReturn(List.of(rule));

        mockMvc.perform(get("/api/v1/rules"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1));

        verify(ruleService).getAllRules(false);
    }

    @Test
    void getAllRulesSupportsActiveOnlyTrue() throws Exception {
        Rule rule = rule(1L, "High Value", "AMOUNT", "HIGH", "9000");
        when(ruleService.getAllRules(true)).thenReturn(List.of(rule));

        mockMvc.perform(get("/api/v1/rules").param("activeOnly", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1));

        verify(ruleService).getAllRules(true);
    }

    @Test
    void getRuleByIdReturnsOkWhenFound() throws Exception {
        Rule rule = rule(3L, "New Payee", "NEW_PAYEE", "MEDIUM", null);
        when(ruleService.getRuleById(3L)).thenReturn(rule);

        mockMvc.perform(get("/api/v1/rules/3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(3));

        verify(ruleService).getRuleById(3L);
    }

    @Test
    void getRuleByIdReturnsNotFoundWhenMissing() throws Exception {
        when(ruleService.getRuleById(404L)).thenReturn(null);

        mockMvc.perform(get("/api/v1/rules/404"))
                .andExpect(status().isNotFound());

        verify(ruleService).getRuleById(404L);
    }

    @Test
    void updateRuleReturnsOkWhenUpdated() throws Exception {
        Rule request = rule(null, "High Value", "AMOUNT", "HIGH", "10000");
        Rule updated = rule(1L, "High Value", "AMOUNT", "HIGH", "10000");
        doReturn(updated).when(ruleService).updateRule(anyLong(), any(Rule.class));

        mockMvc.perform(put("/api/v1/rules/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));

        ArgumentCaptor<Rule> ruleCaptor = ArgumentCaptor.forClass(Rule.class);
        verify(ruleService).updateRule(eq(1L), ruleCaptor.capture());
        Rule captured = ruleCaptor.getValue();
        assertEquals("High Value", captured.getRuleName());
        assertEquals("AMOUNT", captured.getRuleType());
        assertEquals("HIGH", captured.getSeverity());
        assertEquals(new BigDecimal("10000"), captured.getThresholdAmount());
        assertEquals(Boolean.TRUE, captured.getActive());
    }

    @Test
    void updateRuleReturnsNotFoundWhenNoUpdate() throws Exception {
        Rule request = rule(null, "High Value", "AMOUNT", "HIGH", "10000");
        doReturn(null).when(ruleService).updateRule(anyLong(), any(Rule.class));

        mockMvc.perform(put("/api/v1/rules/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());

                        ArgumentCaptor<Rule> ruleCaptor = ArgumentCaptor.forClass(Rule.class);
                        verify(ruleService).updateRule(eq(1L), ruleCaptor.capture());
                        Rule captured = ruleCaptor.getValue();
                        assertEquals("High Value", captured.getRuleName());
                        assertEquals("AMOUNT", captured.getRuleType());
                        assertEquals("HIGH", captured.getSeverity());
                        assertEquals(new BigDecimal("10000"), captured.getThresholdAmount());
                        assertEquals(Boolean.TRUE, captured.getActive());
    }

    private Rule rule(Long id,
                      String name,
                      String type,
                      String severity,
                      String threshold) {
        Rule rule = new Rule();
        rule.setId(id);
        rule.setRuleName(name);
        rule.setRuleType(type);
        rule.setSeverity(severity);
        if (threshold != null) {
            rule.setThresholdAmount(new BigDecimal(threshold));
        }
        rule.setActive(true);
        return rule;
    }
}

