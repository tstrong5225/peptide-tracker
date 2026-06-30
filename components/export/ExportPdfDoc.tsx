import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ExportRow } from "@/app/api/export/route";

const styles = StyleSheet.create({
  page: { padding: 32, fontFamily: "Helvetica", backgroundColor: "#ffffff" },
  header: { marginBottom: 20 },
  title: { fontSize: 18, fontWeight: "bold", color: "#1a1a2e", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#6b7280" },
  table: { width: "auto" },
  thead: { flexDirection: "row", backgroundColor: "#f3f4f6", borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  tbody: {},
  tr: { flexDirection: "row", borderBottomColor: "#e5e7eb", borderBottomWidth: 0.5 },
  trEven: { backgroundColor: "#fafafa" },
  th: { padding: "6px 8px", fontSize: 7.5, fontWeight: "bold", color: "#6b7280", textTransform: "uppercase" },
  td: { padding: "5px 8px", fontSize: 8.5, color: "#111827" },
  tdMuted: { padding: "5px 8px", fontSize: 8.5, color: "#6b7280" },
  colDate: { width: "13%" },
  colPeptide: { width: "16%" },
  colDose: { width: "10%" },
  colUnits: { width: "10%" },
  colSite: { width: "13%" },
  colNotes: { width: "20%" },
  colBatch: { width: "18%" },
  footer: { position: "absolute", bottom: 24, left: 32, right: 32, textAlign: "center", fontSize: 8, color: "#9ca3af" },
});

export function ExportPdfDoc({
  rows,
  peptide,
  dateFrom,
  dateTo,
}: {
  rows: ExportRow[];
  peptide: string;
  dateFrom: string;
  dateTo: string;
}) {
  const subtitle = [
    peptide !== "all" ? `Peptide: ${peptide}` : "All peptides",
    dateFrom ? `From: ${dateFrom}` : null,
    dateTo ? `To: ${dateTo}` : null,
    `${rows.length} entr${rows.length === 1 ? "y" : "ies"}`,
  ]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <Document title="Peptide Tracker — Dose Export">
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Peptide Tracker — Dose Summary</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.thead}>
            <Text style={[styles.th, styles.colDate]}>Date / Time</Text>
            <Text style={[styles.th, styles.colPeptide]}>Peptide</Text>
            <Text style={[styles.th, styles.colDose]}>Dose (mcg)</Text>
            <Text style={[styles.th, styles.colUnits]}>Units</Text>
            <Text style={[styles.th, styles.colSite]}>Site</Text>
            <Text style={[styles.th, styles.colNotes]}>Notes</Text>
            <Text style={[styles.th, styles.colBatch]}>Batch / COA</Text>
          </View>
          <View style={styles.tbody}>
            {rows.map((row, i) => (
              <View key={i} style={[styles.tr, i % 2 === 1 ? styles.trEven : {}]}>
                <Text style={[styles.td, styles.colDate]}>
                  {row.date}{"\n"}<Text style={{ fontSize: 7.5, color: "#9ca3af" }}>{row.time}</Text>
                </Text>
                <Text style={[styles.td, styles.colPeptide]}>{row.peptide}</Text>
                <Text style={[styles.td, styles.colDose]}>{row.dose_mcg}</Text>
                <Text style={[styles.td, styles.colUnits]}>{row.units_used}</Text>
                <Text style={[styles.td, styles.colSite]}>{row.site}</Text>
                <Text style={[styles.tdMuted, styles.colNotes]}>{row.notes}</Text>
                <Text style={[styles.tdMuted, styles.colBatch]}>
                  {row.batch_number || row.coa_number
                    ? [row.batch_number && `Batch: ${row.batch_number}`, row.coa_number && `COA: ${row.coa_number}`]
                        .filter(Boolean)
                        .join(" · ")
                    : "—"}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Peptide Tracker  ·  Page ${pageNumber} of ${totalPages}  ·  Generated ${new Date().toLocaleDateString()}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
