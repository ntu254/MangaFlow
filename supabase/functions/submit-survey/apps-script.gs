/**
 * Google Apps Script - Redo Survey Receiver
 *
 * Deploy as Web App:
 *   Execute as: Me
 *   Who has access: Anyone with link
 *
 * Script Properties:
 *   SHEET_ID = your_google_sheet_id
 *   SURVEY_SECRET = your_secret_key
 *
 * Sheet Tab Name: "Responses"
 */

function doPost(e) {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const SHEET_ID = scriptProperties.getProperty("SHEET_ID");
    const SURVEY_SECRET = scriptProperties.getProperty("SURVEY_SECRET");

    if (!SHEET_ID || !SURVEY_SECRET) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: "Missing SHEET_ID or SURVEY_SECRET in Script Properties" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const data = JSON.parse(e.postData.contents);

    if (data.surveySecret !== SURVEY_SECRET) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: "Unauthorized" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
      const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Responses");

      if (!sheet) {
        return ContentService.createTextOutput(
          JSON.stringify({ success: false, error: "Sheet 'Responses' not found" })
        ).setMimeType(ContentService.MimeType.JSON);
      }

      const row = [
        new Date(),
        data.userId || "",
        data.sessionId || "",
        data.feature || "",
        data.surveyVersion || "",
        JSON.stringify(data.context || {}),
        data.ui_easy_view || "",
        data.ui_easy_understand || "",
        data.ui_easy_use || "",
        data.feature_accurate || "",
        data.feature_bugs || "",
        data.feature_links || "",
        data.feature_quality || "",
        data.exp_fun || "",
        data.exp_frustrating || "",
        data.exp_reuse || "",
        data.exp_recommend || "",
        data.demo_age || "",
        data.demo_role || "",
        Array.isArray(data.demo_style) ? data.demo_style.join(", ") : data.demo_style || "",
        data.demo_channel || "",
        data.feedback || "",
        data.submittedAt || new Date().toISOString(),
      ];

      sheet.appendRow(row);

      return ContentService.createTextOutput(
        JSON.stringify({ success: true, row: sheet.getLastRow() })
      ).setMimeType(ContentService.MimeType.JSON);
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Redo Survey Receiver - OK").setMimeType(ContentService.MimeType.TEXT);
}
