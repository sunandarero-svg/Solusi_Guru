import { google } from 'googleapis';
import fs from 'fs';
import { Readable } from 'stream';

/**
 * Mendapatkan client Google Drive API yang sudah terautentikasi dengan Service Account.
 */
function getDriveClient() {
  let auth;

  // Jika menggunakan kredensial berupa string JSON langsung dari env
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
  } 
  // Jika menggunakan file path kredensial (default google behavior)
  else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
  } else {
    throw new Error("Kredensial Google Cloud tidak ditemukan di environment variables.");
  }

  return google.drive({ version: 'v3', auth });
}

/**
 * Mengunggah file ke Google Drive ke dalam folder spesifik.
 * @param filePath Path lokal file yang akan diunggah
 * @param fileName Nama file di Google Drive
 * @param folderId ID folder Google Drive tujuan
 * @param mimeType Mime type file (contoh: 'application/pdf')
 * @returns Object berisi id dan webViewLink file yang diunggah
 */
export async function uploadToGoogleDrive(
  filePath: string,
  fileName: string,
  folderId: string,
  mimeType: string = 'application/pdf'
) {
  const drive = getDriveClient();

  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };

  const media = {
    mimeType: mimeType,
    body: fs.createReadStream(filePath),
  };

  try {
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink',
    });

    return {
      id: response.data.id,
      webViewLink: response.data.webViewLink,
      webContentLink: response.data.webContentLink,
    };
  } catch (error: any) {
    console.error("Gagal mengunggah ke Google Drive:", error);
    throw new Error(`Google Drive API Error: ${error.message}`);
  }
}

