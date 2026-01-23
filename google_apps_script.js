function doGet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const lock = LockService.getScriptLock();
    lock.tryLock(10000);

    try {
        const data = {
            Livres: getSheetData(ss, "Livres"),
            Avis: getSheetData(ss, "Avis"),
            Genres: getSimpleList(ss, "Genres"),
            Membres: getSimpleList(ss, "Membres")
        };

        return ContentService.createTextOutput(JSON.stringify(data))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (e) {
        return ContentService.createTextOutput(JSON.stringify({ error: e.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    } finally {
        lock.releaseLock();
    }
}

function doPost(e) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const lock = LockService.getScriptLock();
    lock.tryLock(10000);

    try {
        const content = e.postData.contents;
        const data = JSON.parse(content);

        // Save Books
        if (data.Livres) saveSheetData(ss, "Livres", data.Livres);

        // Save Reviews
        if (data.Avis) saveSheetData(ss, "Avis", data.Avis);

        // Save Genres
        if (data.Genres) saveSimpleList(ss, "Genres", data.Genres);

        // Save Members
        if (data.Membres) saveSimpleList(ss, "Membres", data.Membres);

        return ContentService.createTextOutput(JSON.stringify({ success: true }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (e) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: e.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    } finally {
        lock.releaseLock();
    }
}

// Helper to read array of objects from sheet
function getSheetData(ss, sheetName) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) return [];

    const rows = sheet.getDataRange().getValues();
    if (rows.length < 2) return [];

    const headers = rows[0];
    const data = rows.slice(1).map(row => {
        let obj = {};
        headers.forEach((header, i) => {
            // Handle potential JSON strings in cells (like aiAnalysis)
            let value = row[i];
            if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
                try { value = JSON.parse(value); } catch (e) { }
            }
            obj[header] = value;
        });
        return obj;
    });

    return data;
}

// Helper to save array of objects to sheet
function saveSheetData(ss, sheetName, data) {
    if (!data || data.length === 0) return;

    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
        sheet = ss.insertSheet(sheetName);
    } else {
        sheet.clear();
    }

    const headers = Object.keys(data[0]);

    // Write Headers
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Write Rows
    const rows = data.map(item => {
        return headers.map(header => {
            const val = item[header];
            // Stringify objects if needed
            return (typeof val === 'object' && val !== null) ? JSON.stringify(val) : val;
        });
    });

    if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
}

// Helper for simple lists (Genres, Members) which are just strings
function getSimpleList(ss, sheetName) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) return [];
    const vals = sheet.getDataRange().getValues();
    // Assume generic list in first column
    // Filter out empty lines AND lines that might be headers (same as sheet name)
    return vals.flat().filter(x => x !== "" && x !== sheetName);
}

function saveSimpleList(ss, sheetName, list) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
        // If sheet doesn't exist and keys are empty, nothing to do
        if (!list || list.length === 0) return;
        sheet = ss.insertSheet(sheetName);
    } else {
        // Clear previous content
        sheet.clear();
    }

    // If list is empty, we just cleared it, so we are done.
    if (!list || list.length === 0) return;

    // Write as column
    const rows = list.map(x => [x]);
    sheet.getRange(1, 1, rows.length, 1).setValues(rows);
}

function setup() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ["Livres", "Avis", "Genres", "Membres"].forEach(name => {
        if (!ss.getSheetByName(name)) ss.insertSheet(name);
    });
}
