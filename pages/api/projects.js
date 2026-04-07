const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

async function getSheets() {
  const { google } = await import("googleapis");
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return { sheets: google.sheets({ version: "v4", auth }) };
}

export default async function handler(req, res) {
  try {
    const { sheets } = await getSheets();
    if (req.method === "GET") {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "Data!A1",
      });
      const raw = response.data.values?.[0]?.[0];
      return res.status(200).json({ projects: raw ? JSON.parse(raw) : [] });
    }
    if (req.method === "POST") {
      const { projects } = req.body;
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: "Data!A1",
        valueInputOption: "RAW",
        requestBody: { values: [[JSON.stringify(projects)]] },
      });
      const now = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: "Data!B1",
        valueInputOption: "RAW",
        requestBody: { values: [[now]] },
      });
      return res.status(200).json({ ok: true, savedAt: now });
    }
    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
