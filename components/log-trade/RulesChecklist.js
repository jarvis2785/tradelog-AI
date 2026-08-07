"use client";

import { useEffect, useState } from "react";
import { fetchActiveRules } from "@/lib/rules";
import { classNames } from "@/lib/utils";

export default function RulesChecklist({ onChange, initialBrokenRules }) {
  const [rules, setRules] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await fetchActiveRules();
        if (cancelled) return;
        setRules(data);
        const initial = {};
        data.forEach((r) => {
          initial[r.id] =
            initialBrokenRules === undefined ? false : !initialBrokenRules.includes(r.rule_text);
        });
        setSelected(initial);
      } catch (err) {
        if (!cancelled) setRules([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const notFollowing = rules.filter((r) => !selected[r.id]).map((r) => r.rule_text);
    onChange(notFollowing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, rules]);

  function toggle(id) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  if (loading) {
    return (
      <div className="card">
        <div className="skeleton h-4 w-56 mb-4" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-9 w-32" />
          ))}
        </div>
      </div>
    );
  }

  if (rules.length === 0) return null;

  return (
    <div className="card">
      <h3 className="text-h3 text-text-primary mb-1">Rules Applicable to This Trade</h3>
      <p className="text-small text-text-secondary mb-4">
        Which rules were you trying to follow in this trade?
      </p>
      <div className="flex flex-wrap gap-2">
        {rules.map((rule) => {
          const isSelected = !!selected[rule.id];
          return (
            <button
              key={rule.id}
              type="button"
              onClick={() => toggle(rule.id)}
              aria-pressed={isSelected}
              className={classNames(
                "rounded-full px-4 py-2 text-body border transition-colors duration-150",
                isSelected
                  ? "bg-accent text-white border-accent"
                  : "bg-transparent text-text-secondary border-border hover:border-border-hover hover:text-text-primary"
              )}
            >
              {rule.rule_text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
