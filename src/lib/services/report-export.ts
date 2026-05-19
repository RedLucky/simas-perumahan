import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

type ExportFormat = "xlsx" | "pdf";

type ExportPayload = {
  title: string;
  filenameBase: string;
  meta?: Record<string, string | number>;
  rows: Array<Record<string, string | number | boolean | null>>;
};

function toArrayBuffer(buffer: Uint8Array): ArrayBuffer {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
}

function toCurrency(value: number | string) {
  const num = Number(value);
  if (isNaN(num)) return String(value);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

function renderPdf(payload: ExportPayload): Uint8Array {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let y = 40;

  // --- HEADER (KOP SURAT) ---
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("PENGURUS PERUMAHAN MASTRIP", doc.internal.pageSize.getWidth() / 2, y, { align: "center" });
  y += 15;
  doc.setFontSize(12);
  doc.text("Perumahan Mastrip, Kabupaten Jember", doc.internal.pageSize.getWidth() / 2, y, { align: "center" });
  y += 15;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Website: https://simas-perumahan.example.com", doc.internal.pageSize.getWidth() / 2, y, { align: "center" });
  y += 15;

  // --- SEPARATOR LINE ---
  doc.setLineWidth(1.5);
  doc.line(40, y, doc.internal.pageSize.getWidth() - 40, y);
  y += 25;

  // --- TITLE ---
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(payload.title, doc.internal.pageSize.getWidth() / 2, y, { align: "center" });
  y += 25;

  // --- METADATA ---
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Dicetak pada: ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} WIB`, 40, y);
  y += 15;

  if (payload.meta) {
    for (const [key, value] of Object.entries(payload.meta)) {
      const label = key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      const displayValue = (typeof value === "number" && (key.includes("total") || key.includes("balance") || key.includes("income") || key.includes("expense") || key.includes("net")))
        ? toCurrency(value)
        : String(value);
      doc.text(`${label}: ${displayValue}`, 40, y);
      y += 15;
    }
    y += 10;
  }

  // --- AUTOTABLE ---
  const headers = Object.keys(payload.rows[0] ?? {});
  const head = [headers.map((h) => h.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()))];
  
  const body = payload.rows.map(row => {
    return headers.map(h => {
      const val = row[h];
      if (typeof val === "number" && (h.includes("amount") || h.includes("balance") || h.includes("income") || h.includes("expense") || h.includes("net"))) {
         return toCurrency(val);
      }
      return String(val ?? "-");
    });
  });

  if (headers.length > 0) {
    autoTable(doc, {
      startY: y,
      head: head,
      body: body,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42] }, // Slate 900
      styles: { fontSize: 9, cellPadding: 5 },
      margin: { left: 40, right: 40 },
    });
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 40;
  }

  // --- SIGNATURE BLOCK ---
  if (y > doc.internal.pageSize.getHeight() - 100) {
    doc.addPage();
    y = 40;
  }
  
  const rightMargin = doc.internal.pageSize.getWidth() - 40;
  doc.setFontSize(10);
  doc.text(`Jember, ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}`, rightMargin, y, { align: "right" });
  y += 15;
  doc.text("Ketua Pengurus Perumahan", rightMargin - 28, y, { align: "right" });
  y += 60;
  doc.setFont("helvetica", "bold");
  doc.text("(.....................................................)", rightMargin, y, { align: "right" });

  return new Uint8Array(doc.output("arraybuffer"));
}

function renderXlsx(payload: ExportPayload): Uint8Array {
  const wb = XLSX.utils.book_new();
  const wsData = [
    [payload.title],
    ["Generated", new Date().toISOString()],
    ...(payload.meta ? Object.entries(payload.meta).map(([k, v]) => [k, v]) : []),
    [],
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const tableWs = XLSX.utils.json_to_sheet(payload.rows);

  XLSX.utils.sheet_add_json(ws, XLSX.utils.sheet_to_json(tableWs, { header: 1 }) as never[], {
    origin: -1,
    skipHeader: false,
  });

  XLSX.utils.book_append_sheet(wb, ws, "Report");
  const out = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
  return new Uint8Array(out);
}

export function exportReport(payload: ExportPayload, format: ExportFormat) {
  if (format === "pdf") {
    const bytes = renderPdf(payload);
    return {
      filename: `${payload.filenameBase}.pdf`,
      contentType: "application/pdf",
      body: toArrayBuffer(bytes),
    };
  }

  const bytes = renderXlsx(payload);
  return {
    filename: `${payload.filenameBase}.xlsx`,
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    body: toArrayBuffer(bytes),
  };
}
