package com.finance.txnSync.services;

import com.finance.txnSync.models.Rule;
import com.finance.txnSync.repositories.RuleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RuleService {

    private final RuleRepository ruleRepository;

    @Autowired
    public RuleService(RuleRepository ruleRepository) {
        this.ruleRepository = ruleRepository;
    }

    public List<Rule> getAllRules(boolean activeOnly) {
        return activeOnly ? ruleRepository.findAllActiveRules() : ruleRepository.findAll();
    }

    public Rule getRuleById(Long id) {
        try {
            return ruleRepository.findById(id);
        } catch (Exception e) {
            return null;
        }
    }

    public Rule updateRule(Long id, Rule rule) {
        int updated = ruleRepository.updateRule(id, rule);
        if (updated > 0) {
            rule.setId(id);
            return rule;
        }
        return null;
    }
}
