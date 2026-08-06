package com.finance.txnSync.controllers;

import com.finance.txnSync.dto.rule.RuleDtoMapper;
import com.finance.txnSync.dto.rule.RuleResponseDto;
import com.finance.txnSync.dto.rule.UpdateRuleRequestDto;
import com.finance.txnSync.models.Rule;
import com.finance.txnSync.services.RuleService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/rules")
public class RuleController {

    private final RuleService ruleService;

    @Autowired
    public RuleController(RuleService ruleService) {
        this.ruleService = ruleService;
    }

    @GetMapping
    public ResponseEntity<List<RuleResponseDto>> getAllRules(@RequestParam(required = false, defaultValue = "false") boolean activeOnly) {
        List<RuleResponseDto> rules = ruleService.getAllRules(activeOnly)
                .stream()
                .map(RuleDtoMapper::toResponse)
                .toList();
        return ResponseEntity.ok(rules);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RuleResponseDto> getRuleById(@PathVariable Long id) {
        Rule rule = ruleService.getRuleById(id);
        if (rule == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(RuleDtoMapper.toResponse(rule));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RuleResponseDto> updateRule(@PathVariable Long id, @Valid @RequestBody UpdateRuleRequestDto request) {
        Rule updated = ruleService.updateRule(id, RuleDtoMapper.toModel(request));
        if (updated != null) {
            return ResponseEntity.ok(RuleDtoMapper.toResponse(updated));
        }
        return ResponseEntity.notFound().build();
    }
}
