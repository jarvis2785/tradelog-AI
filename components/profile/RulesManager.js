"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Check, X, Plus, Loader2 } from "lucide-react";
import { supabase, RULES_TABLE } from "@/lib/supabase";
import { fetchAllRules } from "@/lib/rules";
import { useToast } from "@/components/Toast";
import { classNames } from "@/lib/utils";
import DeleteRuleConfirm from "./DeleteRuleConfirm";

export default function RulesManager() {
  const toast = useToast();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [deletingRule, setDeletingRule] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [adding, setAdding] = useState(false);
  const [newRuleText, setNewRuleText] = useState("");
  const [savingNew, setSavingNew] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchAllRules();
      setRules(data);
    } catch (err) {
      toast.error("Could not load rules. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleToggleActive(rule) {
    setTogglingId(rule.id);
    const nextActive = !rule.is_active;
    setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, is_active: nextActive } : r)));
    const { error } = await supabase
      .from(RULES_TABLE)
      .update({ is_active: nextActive })
      .eq("id", rule.id);
    if (error) {
      setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, is_active: rule.is_active } : r)));
      toast.error("Could not update rule. Please try again.");
    }
    setTogglingId(null);
  }

  function startEdit(rule) {
    setEditingId(rule.id);
    setEditText(rule.rule_text);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditText("");
  }

  async function saveEdit(rule) {
    if (!editText.trim()) return;
    setSavingEdit(true);
    const { error } = await supabase
      .from(RULES_TABLE)
      .update({ rule_text: editText.trim(), updated_at: new Date().toISOString() })
      .eq("id", rule.id);
    setSavingEdit(false);
    if (error) {
      toast.error("Could not save rule. Please try again.");
      return;
    }
    setRules((prev) =>
      prev.map((r) => (r.id === rule.id ? { ...r, rule_text: editText.trim() } : r))
    );
    setEditingId(null);
    setEditText("");
    toast.success("Rule updated");
  }

  async function confirmDelete() {
    if (!deletingRule) return;
    setDeleting(true);
    const { error } = await supabase.from(RULES_TABLE).delete().eq("id", deletingRule.id);
    setDeleting(false);
    if (error) {
      toast.error("Could not delete rule. Please try again.");
      return;
    }
    setRules((prev) => prev.filter((r) => r.id !== deletingRule.id));
    setDeletingRule(null);
    toast.success("Rule deleted");
  }

  async function saveNewRule() {
    if (!newRuleText.trim()) return;
    setSavingNew(true);
    const { data, error } = await supabase
      .from(RULES_TABLE)
      .insert({ rule_text: newRuleText.trim(), is_active: true })
      .select()
      .single();
    setSavingNew(false);
    if (error) {
      toast.error("Could not add rule. Please try again.");
      return;
    }
    setRules((prev) => [...prev, data]);
    setNewRuleText("");
    setAdding(false);
    toast.success("Rule added");
  }

  return (
    <div className="card">
      <h3 className="text-h3 text-text-primary mb-1">My Trading Rules</h3>
      <p className="text-small text-text-secondary mb-5">
        These rules are checked when logging each trade. Add, edit or remove rules as your
        strategy evolves.
      </p>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-14 w-full" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="border border-border rounded-control p-3.5"
            >
              {editingId === rule.id ? (
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="input-field h-11"
                    autoFocus
                    disabled={savingEdit}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => saveEdit(rule)}
                      disabled={savingEdit || !editText.trim()}
                      className="btn-primary h-9 px-4 text-small"
                    >
                      {savingEdit ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={savingEdit}
                      className="btn-secondary h-9 px-4 text-small"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <p
                    className={classNames(
                      "text-body flex-1",
                      rule.is_active ? "text-text-primary" : "text-text-muted line-through"
                    )}
                  >
                    {rule.rule_text}
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleActive(rule)}
                      disabled={togglingId === rule.id}
                      aria-label={rule.is_active ? "Deactivate rule" : "Activate rule"}
                      className={classNames(
                        "relative w-10 h-6 rounded-full transition-colors duration-150 disabled:opacity-50",
                        rule.is_active ? "bg-profit" : "bg-border-hover"
                      )}
                    >
                      <span
                        className={classNames(
                          "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-150",
                          rule.is_active && "translate-x-4"
                        )}
                      />
                    </button>
                    <button
                      onClick={() => startEdit(rule)}
                      className="w-9 h-9 flex items-center justify-center rounded-control border border-border text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors"
                      aria-label="Edit rule"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeletingRule(rule)}
                      className="w-9 h-9 flex items-center justify-center rounded-control border border-border text-text-secondary hover:text-loss hover:border-loss/40 transition-colors"
                      aria-label="Delete rule"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {adding ? (
            <div className="border border-border rounded-control p-3.5 flex flex-col gap-3">
              <input
                type="text"
                value={newRuleText}
                onChange={(e) => setNewRuleText(e.target.value)}
                placeholder="Enter your trading rule..."
                className="input-field h-11"
                autoFocus
                disabled={savingNew}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={saveNewRule}
                  disabled={savingNew || !newRuleText.trim()}
                  className="btn-primary h-9 px-4 text-small"
                >
                  {savingNew ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Save
                </button>
                <button
                  onClick={() => {
                    setAdding(false);
                    setNewRuleText("");
                  }}
                  disabled={savingNew}
                  className="btn-secondary h-9 px-4 text-small"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAdding(true)} className="btn-outline-accent h-11 w-full">
              <Plus size={16} />
              Add New Rule
            </button>
          )}
        </div>
      )}

      {deletingRule && (
        <DeleteRuleConfirm
          deleting={deleting}
          onCancel={() => setDeletingRule(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
