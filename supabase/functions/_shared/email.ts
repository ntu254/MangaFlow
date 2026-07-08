import { PDFDocument, rgb, StandardFonts } from "npm:pdf-lib@1.17.1";

function encodeBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function generateInvoicePdf(invoice: {
  number: string;
  customerName: string;
  customerEmail: string;
  planName: string;
  amount: number;
  paidAt: string;
  billingCycle: string;
  paymentMethod: string;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let y = 800;

  page.drawText("HOA DON THANH TOAN", { x: 50, y, font: fontBold, size: 18, color: rgb(0, 0, 0) });
  y -= 6;
  page.drawText("REDO AI - Tro ly thoi trang AI", { x: 50, y, font, size: 10, color: rgb(0.4, 0.4, 0.4) });
  y -= 30;
  page.drawText(`So hoa don: ${invoice.number}`, { x: 50, y, font, size: 11 });
  y -= 18;
  page.drawText(`Ngay xuat: ${invoice.paidAt}`, { x: 50, y, font, size: 11 });
  y -= 30;

  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
  y -= 20;

  const fields = [
    { label: "Khach hang", value: invoice.customerName },
    { label: "Email", value: invoice.customerEmail },
    { label: "Goi dich vu", value: invoice.planName },
    { label: "Chu ky thanh toan", value: invoice.billingCycle === "yearly" ? "Nam" : "Thang" },
    { label: "Phuong thuc", value: invoice.paymentMethod },
  ];

  for (const f of fields) {
    page.drawText(f.label + ":", { x: 50, y, font: fontBold, size: 11, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(f.value, { x: 200, y, font, size: 11 });
    y -= 20;
  }

  y -= 10;
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
  y -= 25;

  page.drawText("Tong thanh toan:", { x: 50, y, font: fontBold, size: 14, color: rgb(0.8, 0.2, 0.1) });
  const formattedAmount = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(invoice.amount);
  page.drawText(formattedAmount, { x: 250, y, font: fontBold, size: 14, color: rgb(0.8, 0.2, 0.1) });
  y -= 60;

  page.drawText("Cam on ban da su dung Redo AI!", {
    x: 50, y, font, size: 11, color: rgb(0.4, 0.4, 0.4),
  });
  y -= 18;
  page.drawText("Moi thac mac xin lien he: support@redo.ai", {
    x: 50, y, font, size: 10, color: rgb(0.5, 0.5, 0.5),
  });

  return await doc.save();
}

function buildInvoiceHtml(invoice: {
  number: string;
  customerName: string;
  planName: string;
  amount: number;
  paidAt: string;
  billingCycle: string;
}): string {
  const formattedAmount = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(invoice.amount);

  return `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #1a1a2e; font-size: 24px;">Cam on ban da dang ky!</h1>
    <p style="color: #666;">Hoa don thanh toan goi <strong>${invoice.planName}</strong></p>
  </div>
  <table style="width: 100%; border-collapse: collapse;">
    <tr><td style="padding: 10px; color: #666;">So hoa don:</td><td style="padding: 10px; font-weight: bold;">${invoice.number}</td></tr>
    <tr><td style="padding: 10px; color: #666;">Khach hang:</td><td style="padding: 10px;">${invoice.customerName}</td></tr>
    <tr><td style="padding: 10px; color: #666;">Goi dich vu:</td><td style="padding: 10px;">${invoice.planName}</td></tr>
    <tr><td style="padding: 10px; color: #666;">Chu ky:</td><td style="padding: 10px;">${invoice.billingCycle === "yearly" ? "Nam" : "Thang"}</td></tr>
    <tr><td style="padding: 10px; color: #666;">Ngay thanh toan:</td><td style="padding: 10px;">${invoice.paidAt}</td></tr>
    <tr><td style="padding: 10px; color: #666; font-size: 16px;">Tong tien:</td>
        <td style="padding: 10px; font-size: 18px; font-weight: bold; color: #e63946;">${formattedAmount}</td></tr>
  </table>
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
    <p>Redo AI - Tro ly thoi trang thong minh</p>
    <p>Moi thac mac xin lien he: <a href="mailto:support@redo.ai">support@redo.ai</a></p>
  </div>
</body>
</html>`.trim();
}

function decodeBase64(str: string): Uint8Array {
  const binaryStr = atob(str);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

export interface InvoiceData {
  number: string;
  customerName: string;
  customerEmail: string;
  planName: string;
  amount: number;
  paidAt: string;
  billingCycle: string;
  paymentMethod: string;
}

export async function sendInvoiceEmail(
  resendApiKey: string,
  invoice: InvoiceData,
): Promise<void> {
  const pdfBytes = await generateInvoicePdf(invoice);
  const pdfBase64 = encodeBase64(pdfBytes);

  const html = buildInvoiceHtml(invoice);
  const formattedAmount = new Intl.NumberFormat("vi-VN", {
    style: "currency", currency: "VND", maximumFractionDigits: 0,
  }).format(invoice.amount);

  const body = {
    from: "Redo <onboarding@resend.dev>",
    to: invoice.customerEmail,
    subject: `Hoa don #${invoice.number} - Redo AI ${invoice.planName}`,
    html,
    attachments: [
      {
        filename: `invoice-${invoice.number}.pdf`,
        content: pdfBase64,
      },
    ],
  };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Resend error (${response.status}): ${errText}`);
  }
}
