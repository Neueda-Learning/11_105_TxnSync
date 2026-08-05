package com.finance.txnSync.services;

import com.finance.txnSync.models.Rule;
import com.finance.txnSync.repositories.RuleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RuleServiceTest {

    @Mock
    private RuleRepository ruleRepository;

    private RuleService ruleService;

    @BeforeEach
    void setUp() {
        ruleService = new RuleService(ruleRepository);
    }

    @Test
    void getAllRulesUsesActiveQueryWhenActiveOnlyTrue() {
        List<Rule> rules = List.of(new Rule(), new Rule());
        when(ruleRepository.findAllActiveRules()).thenReturn(rules);

        List<Rule> result = ruleService.getAllRules(true);

        assertSame(rules, result);
        verify(ruleRepository).findAllActiveRules();
    }

    @Test
    void getAllRulesUsesAllQueryWhenActiveOnlyFalse() {
        List<Rule> rules = List.of(new Rule());
        when(ruleRepository.findAll()).thenReturn(rules);

        List<Rule> result = ruleService.getAllRules(false);

        assertSame(rules, result);
        verify(ruleRepository).findAll();
    }

    @Test
    void getRuleByIdReturnsRuleWhenFound() {
        Rule rule = new Rule();
        rule.setId(9L);
        when(ruleRepository.findById(9L)).thenReturn(rule);

        Rule result = ruleService.getRuleById(9L);

        assertSame(rule, result);
        verify(ruleRepository).findById(9L);
    }

    @Test
    void getRuleByIdReturnsNullWhenRepositoryThrows() {
        when(ruleRepository.findById(9L)).thenThrow(new RuntimeException("db"));

        Rule result = ruleService.getRuleById(9L);

        assertNull(result);
    }

    @Test
    void updateRuleReturnsUpdatedRuleAndSetsIdWhenRepositoryUpdates() {
        Rule rule = new Rule();
        rule.setRuleName("High Value");
        when(ruleRepository.updateRule(1L, rule)).thenReturn(1);

        Rule updated = ruleService.updateRule(1L, rule);

        assertSame(rule, updated);
        assertEquals(1L, updated.getId());
        verify(ruleRepository).updateRule(1L, rule);
    }

    @Test
    void updateRuleReturnsNullWhenNoRowsUpdated() {
        Rule rule = new Rule();
        when(ruleRepository.updateRule(1L, rule)).thenReturn(0);

        Rule updated = ruleService.updateRule(1L, rule);

        assertNull(updated);
        verify(ruleRepository).updateRule(1L, rule);
    }

    @Test
    void updateRulePropagatesRepositoryException() {
        Rule rule = new Rule();
        when(ruleRepository.updateRule(1L, rule)).thenThrow(new RuntimeException("db"));

        assertThrows(RuntimeException.class, () -> ruleService.updateRule(1L, rule));
    }
}

