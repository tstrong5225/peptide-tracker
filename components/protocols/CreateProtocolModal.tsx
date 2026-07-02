"use client";

import { useActionState, useState } from "react";
import { Modal, ModalHeader, ModalBody } from "@/components/ui/Modal";
import formStyles from "@/components/ui/Form.module.css";
import { PROTOCOL_PATTERNS, WEEKDAYS, COMMON_TIMEZONES, type ProtocolRow } from "@/lib/protocol-logic";
import { saveProtocol, type ActionState } from "@/app/protocols/actions";

type VialOption = { id: string; name: string };

export function CreateProtocolModal({
  onClose,
  onSaved,
  initialData,
  editMode = false,
  vials,
}: {
  onClose: () => void;
  onSaved: () => void;
  initialData?: ProtocolRow;
  editMode?: boolean;
  vials?: VialOption[];
}) {
  // editMode=true + initialData = editing existing protocol
  // editMode=false + initialData = cloning
  const isEdit = editMode && !!initialData;
  const isClone = !editMode && !!initialData;
  const today = new Date().toISOString().slice(0, 10);

  const browserTz = (() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return "UTC"; }
  })();

  const src = initialData ?? null;
  const defaultName = isEdit ? (src?.name ?? "") : (src ? `${src.name} (copy)` : "");
  const defaultPeptide = src?.peptide ?? "";
  const defaultStartDate = isEdit ? (src?.start_date ?? today) : (isClone ? today : "");
  const defaultDuration = src?.duration ?? 28;
  const defaultReminderTime = src?.reminder_time ?? "";
  const defaultReminderTz = src?.reminder_timezone ?? browserTz;
  const defaultNotes = src?.notes ?? "";
  const defaultVialId = src?.vial_id ?? "";
  const defaultSubtitle = isClone && src ? `Copying "${src.name}" — starts today` : undefined;

  const modalTitle = isEdit ? "Edit Protocol" : (isClone ? "Clone Protocol" : "New Protocol");
  const submitLabel = isEdit ? "Save Changes" : (isClone ? "Clone Protocol" : "Save Protocol");

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (prevState, formData) => {
      const result = await saveProtocol(prevState, formData);
      if (result.success) onSaved();
      return result;
    },
    {},
  );

  const [pattern, setPattern] = useState<string>(initialData?.pattern ?? "daily");
  const [selectedDays, setSelectedDays] = useState<number[]>(
    (initialData?.selected_days as number[]) ?? [],
  );
  const [cycleOn, setCycleOn] = useState<string>(String(initialData?.cycle_on ?? 5));
  const [cycleOff, setCycleOff] = useState<string>(String(initialData?.cycle_off ?? 2));

  function toggleDay(day: number) {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const selectedDaysText =
    selectedDays.length > 0 ? selectedDays.map((d) => dayNames[d]).join(", ") : "";

  return (
    <Modal onClose={onClose} maxWidth={560}>
      <form action={formAction}>
        {isEdit && src ? <input type="hidden" name="id" value={src.id} /> : null}
        <input type="hidden" name="pattern" value={pattern} />
        <input type="hidden" name="selectedDays" value={JSON.stringify(selectedDays)} />
        <ModalHeader title={modalTitle} subtitle={defaultSubtitle} />
        <ModalBody>
          {state.error ? <div className={formStyles.error}>{state.error}</div> : null}

          <div className={formStyles.field}>
            <label className={formStyles.label}>Protocol Name</label>
            <input
              name="name"
              type="text"
              placeholder="e.g. BPC-157 Healing Protocol"
              defaultValue={defaultName}
              required
              className={formStyles.input}
            />
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.label}>Associated Peptide</label>
            <input
              name="peptide"
              type="text"
              placeholder="e.g. BPC-157"
              defaultValue={defaultPeptide}
              required
              className={formStyles.input}
            />
          </div>

          {/* Vial link */}
          <div className={formStyles.field}>
            <label className={formStyles.label}>Linked Vial <span style={{ fontWeight: 500, textTransform: "none", letterSpacing: 0, fontSize: 11 }}>(optional)</span></label>
            {vials && vials.length > 0 ? (
              <>
                <select
                  name="vialId"
                  defaultValue={defaultVialId}
                  className={formStyles.input}
                  style={{ cursor: "pointer" }}
                >
                  <option value="">— No vial linked —</option>
                  {vials.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
                <div style={{ fontSize: 11, color: "var(--pt-muted-2)", marginTop: 5 }}>
                  Link a vial to log doses directly from this protocol and track inventory automatically.
                </div>
              </>
            ) : (
              <div
                style={{
                  fontSize: 12,
                  color: "var(--pt-muted-2)",
                  padding: "10px 14px",
                  background: "var(--pt-surface-soft)",
                  borderRadius: 10,
                }}
              >
                No vials yet — create a vial in the Vials section first, then link it here.
              </div>
            )}
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

          {pattern === "xony" ? (
            <div>
              <label className={formStyles.label} style={{ display: "block", marginBottom: 8 }}>
                Cycle Length
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "var(--grid-2col)", gap: 13 }}>
                <div className={formStyles.field}>
                  <label className={formStyles.label}>Days on</label>
                  <input
                    name="cycleOn"
                    type="number"
                    min={1}
                    max={60}
                    value={cycleOn}
                    onChange={(e) => setCycleOn(e.target.value)}
                    className={formStyles.input}
                  />
                </div>
                <div className={formStyles.field}>
                  <label className={formStyles.label}>Days off</label>
                  <input
                    name="cycleOff"
                    type="number"
                    min={1}
                    max={60}
                    value={cycleOff}
                    onChange={(e) => setCycleOff(e.target.value)}
                    className={formStyles.input}
                  />
                </div>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--pt-accent-soft-fg)",
                  fontWeight: 600,
                  marginTop: 6,
                  padding: "8px 12px",
                  background: "var(--pt-accent-soft-bg)",
                  borderRadius: 9,
                }}
              >
                {cycleOn} day{Number(cycleOn) !== 1 ? "s" : ""} on,{" "}
                {cycleOff} day{Number(cycleOff) !== 1 ? "s" : ""} off — repeating cycle
              </div>
            </div>
          ) : null}

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

          <div style={{ display: "grid", gridTemplateColumns: "var(--grid-2col)", gap: 13 }}>
            <div className={formStyles.field}>
              <label className={formStyles.label}>Start Date</label>
              <input
                name="startDate"
                type="date"
                required
                defaultValue={defaultStartDate}
                className={formStyles.input}
              />
            </div>
            <div className={formStyles.field}>
              <label className={formStyles.label}>Duration (days)</label>
              <input
                name="duration"
                type="number"
                placeholder="e.g. 21"
                min={1}
                step="1"
                defaultValue={defaultDuration}
                className={formStyles.input}
              />
            </div>
          </div>

          <div>
            <label className={formStyles.label} style={{ display: "block", marginBottom: 8 }}>
              Reminder <span style={{ fontWeight: 500, textTransform: "none", letterSpacing: 0, fontSize: 11 }}>(optional)</span>
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "var(--grid-2col)", gap: 13 }}>
              <div className={formStyles.field}>
                <label className={formStyles.label}>Time</label>
                <input
                  name="reminderTime"
                  type="time"
                  defaultValue={defaultReminderTime}
                  className={formStyles.input}
                />
              </div>
              <div className={formStyles.field}>
                <label className={formStyles.label}>Timezone</label>
                <select
                  name="reminderTimezone"
                  defaultValue={defaultReminderTz}
                  className={formStyles.input}
                  style={{ cursor: "pointer" }}
                >
                  {!COMMON_TIMEZONES.some((t) => t.value === browserTz) ? (
                    <option value={browserTz}>Auto-detected: {browserTz}</option>
                  ) : null}
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ fontSize: 11, color: "var(--pt-muted-2)", marginTop: 5 }}>
              Push notifications fire at this local time on dose days.
            </div>
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.label}>Notes / Citation Source</label>
            <textarea
              name="notes"
              rows={3}
              placeholder="e.g. Based on Gwyer et al., 2019"
              defaultValue={defaultNotes}
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
              {isPending ? "Saving…" : submitLabel}
            </button>
          </div>
        </ModalBody>
      </form>
    </Modal>
  );
}
