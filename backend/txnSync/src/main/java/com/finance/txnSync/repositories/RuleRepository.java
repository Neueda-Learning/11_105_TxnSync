package com.finance.txnSync.repositories;
import com.finance.txnSync.models.Rule;
import java.util.List;

public interface RuleRepository {
    List<Rule> findAllActiveRules();
    List<Rule> findAll();
    Rule findById(Long id);
    int updateRule(Long id, Rule rule);
}