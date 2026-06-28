import * as XLSX from "xlsx";
import type { CaseRecord } from "./cases";

export function exportCasesToExcel(cases: CaseRecord[], filename = "cases.xlsx") {
  const rows = cases.map((c) => ({
    Date: c.date,
    "Case ID": c.caseId,
    "Call Time": c.callTime,
    "Emergency Type": c.emergencyType,
    "Sub-Type": c.subType,
    District: c.district,
    "Ambulance Base": c.ambulanceBase,
    "Ambulance Contact": c.ambulanceContact,
    "EMT Name": c.emtName,
    "EMT ID": c.emtId,
    "Pilot Name": c.pilotName,
    "Pilot ID": c.pilotId,
    Mechanism: c.mechanism,
    "Scene Description": c.sceneDescription,
    "During Transport": c.duringTransport,
    "Hospital Handover": c.hospitalHandover,
    Outcome: c.outcome,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Cases");
  XLSX.writeFile(wb, filename);
}
