"use client";

import { useActionState, useState } from "react";
import { Modal, ModalHeader, ModalBody } from "@/components/ui/Modal";
import formStyles from "@/components/ui/Form.module.css";
import { PROTOCOL_PATTERNS, WEEKDAYS } from "@/lib/protocol-logic";
import { saveProtocol, type ActionState } from "@/app/protocols/actions";

export function CreateProtocolModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (prevState, formData) => {
      const result = await saveProtocol(prevState, formData);
      if (result.success) onSaved();
      return result;
    },
    {},
  );

  const [pattern, setPattern] = useState<string>("daily");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  function toggleDay(day: number) {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const selectedDaysText =
    selectedDays.length > 0 ? selectedDays.map((d) => dayNames[d]).join(", ") : "";

  return (
    <Modal onClose={onClose} maxWidth={560}>
      <form action={formAction}>
        <input type="hidden" name="pattern" value={pattern} />
        <input type="hidden" name="selectedDays" value={JSON.stringify(selectedDays)} />
        <ModalHeader title="New Protocol" />
        <ModalBody>
          {state.error ? <div className={formStyles.error}>{state.error}</div> : null}

          <div className={formStyles.field}>
            <label className={formStyles.label}>Protocol Name</label>
            <input
              name="name"
              type="text"
              placeholder="e.g. BPC-157 Healing Protocol"
              required
              className={formStyles.input}
            />
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.label}>Associated Peptide</label>
            <input name="peptide" type="text" placeholder="e.g. BPC-157" required className={formStyles.input} />
          </div>

          <div>
            <label className={formStyles.label} style={{ display: "block", marginBottom: 10 }}>
              Pattern Type
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {PROTOCOL_PATTERNS.map((p) => (
                <label
                  key={p.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "11px 14px",
                    border: `2px solid ${pattern === p.value ? "var(--pt-accent)" : "var(--pt-border-soft)"}`,
                    borderRadius: 11,
                    cursor: "pointer",
                    background: pattern === p.value ? "var(--pt-accent-soft-bg)" : "var(--pt-surface)",
                  }}
                >
                  <input
                    type="radio"
                    name="patternRadio"
                    checked={pattern === p.value}
                    onChange={() => setPattern(p.value)}
                    style={{ accentColor: "var(--pt-accent)" }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{p.label}</div>
                    <div style={{ fontSize: 12, color: "var(--pt-muted-2)" }}>{p.sub}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {pattern === "weekly" ? (
            <div>
              <label className={formStyles.label} style={{ display: "block", marginBottom: 8 }}>
                Notification Days
              </label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {WEEKDAYS.map((wd, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(wd.value)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      border: "none",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      background: selectedDays.includes(wd.value) ? "var(--pt-accent)" : "var(--pt-track)",
                      color: selectedDays.includes(wd.value) ? "white" : "var(--pt-muted)",
                    }}
                  >
                    {wd.label}
                  </button>
                ))}
              </div>
              {selectedDaysText ? (
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--pt-accent-soft-fg)",
                    fontWeight: 600,
                    marginTop: 8,
                    padding: "8px 12px",
                    background: "var(--pt-accent-soft-bg)",
                    borderRadius: 9,
                  }}
                >
                  {selectedDaysText}
                </div>
              ) : null}
            </div>
          ) : null}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
            <div className={formStyles.field}>
              <label className={formStyles.label}>Start Date</label>
              <input name="startDate" type="date" required className={formStyles.input} />
            </div>
            <div className={formStyles.field}>
              <label className={formStyles.label}>Duration (days)</label>
              <input
                name="duration"
                type="number"
                placeholder="e.g. 21"
                min={1}
                step="1"
                defaultValue={28}
                className={formStyles.input}
              />
            </div>
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.label}>Reminder Time (optional)</label>
            <input name="reminderTime" type="time" className={formStyles.input} />
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.label}>Notes / Citation Source</label>
            <textarea
              name="notes"
              rows={3}
              placeholder="e.g. Based on Gwyer et al., 2019"
              style={{
                width: "100%",
                padding: "11px 14px",
                border: "1.5px solid var(--pt-border-soft)",
                borderRadius: 11,
                fontSize: 14,
                color: "var(--pt-ink)",
                background: "var(--pt-surface)",
                resize: "vertical",
                minHeight: 78,
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={onClose} className={formStyles.buttonSecondary} style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" disabled={isPending} className={formStyles.buttonPrimary} style={{ flex: 2 }}>
              {isPending ? "Saving…" : "Save Protocol"}
            </button>
          </div>
        </ModalBody>
      </form>
    </Modal>
  );
}
