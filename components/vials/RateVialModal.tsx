"use client";

import { useActionState, useState } from "react";
import { Modal, ModalHeader, ModalBody } from "@/components/ui/Modal";
import formStyles from "@/components/ui/Form.module.css";
import { RATING_DESCS, type VialRow } from "@/lib/vial-math";
import { rateVial, type ActionState } from "@/app/vials/actions";

export function RateVialModal({
  vial,
  onClose,
  onRated,
}: {
  vial: VialRow;
  onClose: () => void;
  onRated: () => void;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (prevState, formData) => {
      const result = await rateVial(prevState, formData);
      if (result.success) onRated();
      return result;
    },
    {},
  );
  const [rating, setRating] = useState(vial.effectiveness ?? 0);

  return (
    <Modal onClose={onClose} maxWidth={440} zIndex={300}>
      <form action={formAction}>
        <input type="hidden" name="vialId" value={vial.id} />
        <input type="hidden" name="rating" value={rating} />
        <ModalHeader title="Rate Vial Effectiveness" subtitle={vial.name} />
        <ModalBody>
          <p style={{ fontSize: 13, color: "var(--pt-muted)", lineHeight: 1.6, marginTop: -8 }}>
            How effective was this vial overall for your use case? This helps compare batches and
            manufacturers over time.
          </p>
          {state.error ? <div className={formStyles.error}>{state.error}</div> : null}

          <div>
            <label className={formStyles.label}>Effectiveness (1–10)</label>
            <div style={{ display: "flex", gap: 7, marginTop: 8, flexWrap: "wrap" }}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 800,
                    border: "none",
                    cursor: "pointer",
                    background: n <= rating ? "var(--pt-accent)" : "oklch(0.93 0.01 38)",
                    color: n <= rating ? "white" : "oklch(0.5 0.02 225)",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            {rating > 0 ? (
              <div style={{ marginTop: 8, fontSize: 13, color: "var(--pt-accent-soft-fg)", fontWeight: 600 }}>
                {RATING_DESCS[rating]}
              </div>
            ) : null}
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.label}>Notes / Use Case (optional)</label>
            <textarea
              name="note"
              rows={3}
              defaultValue={vial.effectiveness_note || ""}
              placeholder="e.g. Injury recovery, sleep improvement, weight loss…"
              style={{
                width: "100%",
                padding: "11px 14px",
                border: "1.5px solid var(--pt-border-soft)",
                borderRadius: 11,
                fontSize: 14,
                color: "var(--pt-ink)",
                resize: "vertical",
                minHeight: 78,
                background: "white",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={onClose} className={formStyles.buttonSecondary} style={{ flex: 1 }}>
              Skip
            </button>
            <button
              type="submit"
              disabled={isPending || rating === 0}
              className={formStyles.buttonPrimary}
              style={{ flex: 2 }}
            >
              {isPending ? "Saving…" : "Save Rating"}
            </button>
          </div>
        </ModalBody>
      </form>
    </Modal>
  );
}
