/**
 * Web App endpoint that serves a privacy-trimmed student roster
 * (เลขที่, ชื่อ-สกุล, ห้อง, ระดับ only — no ID card no., address, phone)
 * from the "total" tab of the รุ่น/ทำเนียบนักเรียน spreadsheet, for the
 * print-student.html tool.
 *
 * SETUP:
 * 1. Open the spreadsheet: docs.google.com/spreadsheets/d/1UK1iYfvezu8bW3BapdnjLsitLd6Du0_W316bNe5nrtk
 * 2. Extensions > Apps Script
 * 3. Paste this whole file in (replace Code.gs content), Save.
 * 4. Deploy > New deployment > type: Web app
 *      - Execute as: Me
 *      - Who has access: Anyone
 *        (Domain-restricted access ("Anyone within <domain>") does NOT work
 *        here: the print-student.html page is hosted on a different origin
 *        (GitHub Pages), and cross-site script/fetch requests don't carry
 *        the browser's Google login cookies, so the request always looks
 *        anonymous and gets redirected to a login page instead of data.
 *        "Anyone" access is fine because this endpoint only ever returns
 *        non-sensitive fields — เลขที่/ชื่อ-สกุล/ห้อง/ระดับ — never the ID
 *        card number, address, or phone columns from the source sheet.)
 * 5. Copy the deployment URL (ends in /exec) and paste it into
 *    PRINT_STUDENTS_API_URL in print-student.html
 */

const SPREADSHEET_ID = '1UK1iYfvezu8bW3BapdnjLsitLd6Du0_W316bNe5nrtk';
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
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const callback = e && e.parameter && e.parameter.callback;

  if (!sheet) {
    return respond({ error: `ไม่พบชีตชื่อ "${SHEET_NAME}"` }, callback);
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

  return respond({ students: students }, callback);
}

// JSONP (script-tag) response when a ?callback= param is present — this avoids
// the CORS/login-redirect issue that breaks plain fetch() across origins for
// a domain-restricted Apps Script Web App. Falls back to plain JSON otherwise.
function respond(obj, callback) {
  if (callback) {
    return ContentService
      .createTextOutput(`${callback}(${JSON.stringify(obj)});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
