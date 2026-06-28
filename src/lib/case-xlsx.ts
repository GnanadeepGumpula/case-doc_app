import ExcelJS from "exceljs";
import type { CaseRecord } from "./cases";

const YELLOW = "FFFFFF00";
const BLUE = "FF46B0E1";
const BLACK = "FF000000";

function thin(color = "FF999999") {
  return { style: "thin" as const, color: { argb: color } };
}

function border() {
  return { top: thin(), left: thin(), right: thin(), bottom: thin() };
}

function setMerged(
  ws: ExcelJS.Worksheet,
  range: string,
  value: string | number | Date,
  opts: {
    bold?: boolean;
    size?: number;
    fill?: string;
    align?: "left" | "center" | "right";
    vAlign?: "top" | "middle" | "bottom";
    wrap?: boolean;
  } = {},
) {
  ws.mergeCells(range);
  const cell = ws.getCell(range.split(":")[0]);
  cell.value = value as ExcelJS.CellValue;
  cell.font = { bold: opts.bold ?? true, size: opts.size ?? 11, color: { argb: BLACK }, name: "Calibri" };
  if (opts.fill) {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: opts.fill } };
  }
  cell.alignment = {
    horizontal: opts.align ?? "left",
    vertical: opts.vAlign ?? "middle",
    wrapText: opts.wrap ?? true,
  };
  cell.border = border();
}

function setCell(
  ws: ExcelJS.Worksheet,
  addr: string,
  value: string | number | Date,
  opts: Parameters<typeof setMerged>[3] = {},
) {
  const cell = ws.getCell(addr);
  cell.value = value as ExcelJS.CellValue;
  cell.font = { bold: opts.bold ?? true, size: opts.size ?? 11, color: { argb: BLACK }, name: "Calibri" };
  if (opts.fill) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: opts.fill } };
  cell.alignment = {
    horizontal: opts.align ?? "left",
    vertical: opts.vAlign ?? "top",
    wrapText: opts.wrap ?? true,
  };
  cell.border = border();
}

async function buildWorkbook(c: CaseRecord): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Best Case Documentation";
  const ws = wb.addWorksheet("Best Case", {
    views: [{ showGridLines: false }],
  });

  // Column widths — A wide label, B-K body
  ws.getColumn(1).width = 35;
  for (let i = 2; i <= 11; i++) ws.getColumn(i).width = 12;

  // Row 1: Title
  setMerged(ws, "A1:K1", "BEST CASE DOCUMENTATION FORMAT", {
    bold: true,
    size: 18,
    fill: YELLOW,
    align: "center",
    vAlign: "middle",
  });
  ws.getRow(1).height = 32;

  // Rows 2-11: case info (label in A, value merged B:K)
  const info: [string, string | Date | number][] = [
    ["Date:", c.date],
    ["Case id:", c.caseId],
    ["Call time", c.callTime],
    ["Type of Emergency", c.emergencyType],
    ["Sub type of Emergency", c.subType],
    ["District", c.district],
    ["Ambulance segment", c.ambulanceBase],
    ["Ambulanc Contact Number", c.ambulanceContact],
    ["EMT Name and ID NO.", `${c.emtName}${c.emtId ? ` ${c.emtId}` : ""}`],
    ["Pilot Name and ID No.", `${c.pilotName}${c.pilotId ? ` ${c.pilotId}` : ""}`],
  ];
  info.forEach(([label, value], i) => {
    const r = 2 + i;
    setCell(ws, `A${r}`, label, { bold: true, align: "left", vAlign: "top" });
    setMerged(ws, `B${r}:K${r}`, value, { bold: true, align: "left", vAlign: "middle" });
    ws.getRow(r).height = 20;
  });

  // Row 13: section header
  setMerged(ws, "A13:K13", "Complete case details", {
    bold: true,
    size: 18,
    fill: BLUE,
    align: "center",
    vAlign: "middle",
  });
  ws.getRow(13).height = 30;

  // Helper for big section blocks (label cell merged vertically, value merged big block)
  const block = (startRow: number, endRow: number, label: string, value: string, labelSize = 20, valueSize = 14) => {
    setMerged(ws, `A${startRow}:A${endRow}`, label, {
      bold: true,
      size: labelSize,
      align: "center",
      vAlign: "middle",
      wrap: true,
    });
    setMerged(ws, `B${startRow}:K${endRow}`, value, {
      bold: true,
      size: valueSize,
      align: "center",
      vAlign: "middle",
      wrap: true,
    });
    for (let r = startRow; r <= endRow; r++) ws.getRow(r).height = 22;
  };

  block(14, 20, "Mechanism of Injury or Nature of Illness", c.mechanism, 11, 14);
  block(22, 31, "SCENE", c.sceneDescription);
  block(33, 42, "On the way to Hospital", c.duringTransport);
  block(44, 53, "Hospital Admission", c.hospitalHandover);

  // Rows 54-76: photo or outcome placeholder block
  if (c.photo) {
    // Embed image
    try {
      const base64 = c.photo.includes(",") ? c.photo.split(",")[1] : c.photo;
      const ext = c.photo.startsWith("data:image/png") ? "png" : "jpeg";
      const imgId = wb.addImage({ base64, extension: ext });
      ws.mergeCells("A54:K76");
      ws.addImage(imgId, {
        tl: { col: 0.2, row: 53.2 } as unknown as ExcelJS.Anchor,
        br: { col: 11, row: 76 } as unknown as ExcelJS.Anchor,
        editAs: "oneCell",
      });
      // Apply border to merged
      const cell = ws.getCell("A54");
      cell.border = border();
    } catch {
      setMerged(ws, "A54:K76", "[Photo could not be embedded]", {
        align: "center",
        vAlign: "middle",
      });
    }
  } else {
    setMerged(ws, "A54:K76", "Photo (none attached)", {
      align: "center",
      vAlign: "middle",
      size: 12,
    });
  }
  for (let r = 54; r <= 76; r++) ws.getRow(r).height = 18;

  // Outcome row at 78
  setMerged(ws, "A78:K78", "Outcome", {
    bold: true,
    size: 16,
    fill: BLUE,
    align: "center",
    vAlign: "middle",
  });
  ws.getRow(78).height = 26;
  setMerged(ws, "A79:K88", c.outcome, {
    bold: true,
    size: 14,
    align: "center",
    vAlign: "middle",
    wrap: true,
  });
  for (let r = 79; r <= 88; r++) ws.getRow(r).height = 22;

  return wb;
}

export async function downloadCaseXlsx(c: CaseRecord) {
  const wb = await buildWorkbook(c);
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Case_${c.caseId || c.id.slice(0, 8)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function caseSummaryText(c: CaseRecord): string {
  return [
    `Best Case Documentation`,
    `Case ID: ${c.caseId}`,
    `Date: ${c.date} ${c.callTime}`,
    `Emergency: ${c.emergencyType}${c.subType ? ` – ${c.subType}` : ""}`,
    `District: ${c.district}`,
    `Base: ${c.ambulanceBase}`,
    `EMT: ${c.emtName} (${c.emtId})`,
    `Pilot: ${c.pilotName} (${c.pilotId})`,
    ``,
    `Mechanism: ${c.mechanism}`,
    `Scene: ${c.sceneDescription}`,
    `Transport: ${c.duringTransport}`,
    `Handover: ${c.hospitalHandover}`,
    `Outcome: ${c.outcome}`,
  ].join("\n");
}
