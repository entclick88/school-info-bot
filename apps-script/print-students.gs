/**
 * Web App endpoint that serves a privacy-trimmed student roster
 * (เลขที่, ชื่อ-สกุล, ห้อง, ระดับ only — no ID card no., address, phone)
 * from the "total" tab of the รุ่น/ทำเนียบนักเรียน spreadsheet, for the
 * print-student.html tool.
 *
 * SETUP:
 * 1. Open the spreadsheet: docs.google.com/spreadsheets/d/1vTjkpVu-yBbCHuuGZ2vQmrnz-wEdjCpC9zQu7urzTo8
 * 2. Extensions > Apps Script
 * 3. Paste this whole file in (replace Code.gs content), Save.
 * 4. Deploy > New deployment > type: Web app
 *      - Execute as: Me
 *      - Who has access: Anyone within psuwitsurat.ac.th (or "Anyone" if no Workspace domain restriction available)
 * 5. Copy the deployment URL (ends in /exec) and paste it into
 *    PRINT_STUDENTS_API_URL in print-student.html
 */

const SHEET_NAME = 'total';

// Column headers as they appear in row 1 of the sheet.
const COL = {
  STUDENT_ID: 'รหัสนักเรียน',
  ROOM: 'ห้อง',
  NO: 'เลขที่',
  LEVEL: 'ระดับ',
  NAME: 'ชื่อ สกุล',
};

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    return jsonResponse({ error: `ไม่พบชีตชื่อ "${SHEET_NAME}"` });
  }

  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idx = {};
  Object.keys(COL).forEach(key => {
    idx[key] = headers.indexOf(COL[key]);
  });

  const students = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const name = idx.NAME >= 0 ? String(row[idx.NAME] || '').trim() : '';
    if (!name) continue; // skip blank rows
    students.push({
      level: idx.LEVEL >= 0 ? String(row[idx.LEVEL] || '').trim() : '',
      room: idx.ROOM >= 0 ? String(row[idx.ROOM] || '').trim() : '',
      no: idx.NO >= 0 ? String(row[idx.NO] || '').trim() : '',
      name: name,
    });
  }

  return jsonResponse({ students: students });
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
