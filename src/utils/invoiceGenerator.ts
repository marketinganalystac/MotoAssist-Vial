// Utility to dynamically draw realistic invoices for testing OCR
export interface MockInvoiceDetails {
  title: string;
  type: "Bateria" | "Grua";
  companyName: string;
  companyRuc: string;
  invoiceNum: string;
  date: string;
  time: string;
  clientName: string;
  clientRuc: string;
  clientPhone: string;
  clientAddress: string;
  serviceDetail: string;
  vendedor: string;
  formaPago: string;
  subtotal: number;
  itbms: number;
  total: number;
  pie: string;
  cuenta: string;
}

export const mockInvoiceTemplates: MockInvoiceDetails[] = [
  {
    title: "Asistencia de Batería - AutoCentro Express",
    type: "Bateria",
    companyName: "AUTOCENTRO EXPRESS PANAMÁ S.A.",
    companyRuc: "8-9912-3329 DV 15",
    invoiceNum: "FAC-BAT-55122",
    date: "2026-06-11",
    time: "10:15",
    clientName: "Ingenierías Asociadas S.A.",
    clientRuc: "1290-3321-49233 DV 04",
    clientPhone: "+507 263-8821",
    clientAddress: "Calle 74 Oeste, San Francisco, Ciudad de Panamá",
    serviceDetail: "Suministro e instalación de batería Hankook NS60L libre mantenimiento. Paso de corriente y diagnóstico de alternador en sitio.",
    vendedor: "Patricia Domínguez",
    formaPago: "Tarjeta de Crédito",
    subtotal: 95.00,
    itbms: 6.65,
    total: 101.65,
    pie: "Garantía de 12 meses presentando esta factura. Gracias por su confianza en nuestro servicio rápido a domicilio.",
    cuenta: "Banco General - Cta Corriente 03-44-123490-2"
  },
  {
    title: "Remolque y Asistencia - Grúas Istmo S.A.",
    type: "Grua",
    companyName: "GRÚAS ISTMO & ASISTENCIA S.A.",
    companyRuc: "9-2234-11029 DV 02",
    invoiceNum: "FAC-GRU-88902",
    date: "2026-06-11",
    time: "08:45",
    clientName: "Alquiladora de Equipos S.A.",
    clientRuc: "8-882-9901 DV 44",
    clientPhone: "+507 395-5512",
    clientAddress: "Calle 50 y Ave. Aquilino de la Guardia, Obarrio",
    serviceDetail: "Traslado en plataforma auto sedán Toyota Corolla accidentado. Origen: Marbella, Destino: Taller Motores Unidos. Apertura urgente de maletero sin llave.",
    vendedor: "Carlos Rojas",
    formaPago: "Transferencia ACH",
    subtotal: 120.00,
    itbms: 8.40,
    total: 128.40,
    pie: "Cuentas bancarias para depósitos ACH en pie de página. Plazo de pago de 30 días para clientes corporativos.",
    cuenta: "BAC Credomatic - Cta Corriente 992013941"
  }
];

// Draw invoice dynamically to canvas and return as base64 string
export function generateInvoiceImageBase64(templateNum: number, rotateDeg: number = 0): string {
  const data = mockInvoiceTemplates[templateNum];
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 800;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // 1. Draw Paper Background
  ctx.fillStyle = "#fcfbfa";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle paper grain/grid lines
  ctx.strokeStyle = "#f3f0ea";
  ctx.lineWidth = 1;
  for (let i = 0; i < canvas.height; i += 40) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(canvas.width, i);
    ctx.stroke();
  }

  // Draw border
  ctx.strokeStyle = "#dfdacc";
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

  ctx.strokeStyle = "#8f8b7b";
  ctx.lineWidth = 1;
  ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

  // 2. Draw Header
  ctx.fillStyle = "#1e293b";
  ctx.font = "bold 20px 'Courier New', Courier, monospace";
  ctx.textAlign = "center";
  ctx.fillText(data.companyName, canvas.width / 2, 60);

  ctx.font = "bold 13px 'Courier New', Courier, monospace";
  ctx.fillStyle = "#4b5563";
  ctx.fillText(`RUC: ${data.companyRuc}`, canvas.width / 2, 85);
  ctx.fillText("PANAMÁ, REPÚBLICA DE PANAMÁ", canvas.width / 2, 105);
  ctx.fillText("TEL: +507 300-4500 | INFO@MOTOASSIST.COM.PA", canvas.width / 2, 120);

  // Line separator
  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(30, 140);
  ctx.lineTo(canvas.width - 30, 140);
  ctx.stroke();

  // Invoice Meta
  ctx.textAlign = "left";
  ctx.font = "bold 15px 'Courier New', Courier, monospace";
  ctx.fillStyle = "#b91c1c";
  ctx.fillText(`DOCUMENTO FISCAL (FACTURA): ${data.invoiceNum}`, 35, 170);

  ctx.fillStyle = "#1e293b";
  ctx.font = "14px 'Courier New', Courier, monospace";
  ctx.fillText(`FECHA DE EMISIÓN: ${data.date}`, 35, 195);
  ctx.fillText(`HORA DE EMISIÓN:  ${data.time}`, 35, 215);
  ctx.fillText(`CAJERO/TÉCNICO:   ${data.vendedor}`, 35, 235);

  // Separator
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, 255);
  ctx.lineTo(canvas.width - 30, 255);
  ctx.stroke();

  // 3. Client details box
  ctx.fillStyle = "#f1f5f9";
  ctx.fillRect(35, 265, canvas.width - 70, 110);
  ctx.strokeRect(35, 265, canvas.width - 70, 110);

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 13px 'Courier New', Courier, monospace";
  ctx.fillText("DATOS DEL CLIENTE / RECEPTOR:", 45, 285);
  ctx.font = "13px 'Courier New', Courier, monospace";
  ctx.fillText(`RAZÓN SOCIAL / CLIENTE: ${data.clientName}`, 45, 305);
  ctx.fillText(`R.U.C. FISCAL:          ${data.clientRuc}`, 45, 325);
  ctx.fillText(`TÉL / CELULAR:          ${data.clientPhone}`, 45, 345);
  ctx.fillText(`DIRECCIÓN:              ${data.clientAddress.substring(0, 42)}...`, 45, 365);

  // 4. Table Headers
  ctx.font = "bold 13px 'Courier New', Courier, monospace";
  ctx.fillText("DESCRIPCIÓN DEL SERVICIO", 35, 410);
  ctx.textAlign = "right";
  ctx.fillText("CANT", canvas.width - 150, 410);
  ctx.fillText("TOTAL (B/.)", canvas.width - 35, 410);

  // Table header line
  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(30, 420);
  ctx.lineTo(canvas.width - 30, 420);
  ctx.stroke();

  // Line items
  ctx.textAlign = "left";
  ctx.font = "12px 'Courier New', Courier, monospace";

  // Wrap service text
  const words = data.serviceDetail.split(" ");
  let currentLine = "";
  let lineY = 445;
  for (let n = 0; n < words.length; n++) {
    const testLine = currentLine + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > 350 && n > 0) {
      ctx.fillText(currentLine, 35, lineY);
      currentLine = words[n] + " ";
      lineY += 20;
    } else {
      currentLine = testLine;
    }
  }
  ctx.fillText(currentLine, 35, lineY);

  ctx.textAlign = "right";
  ctx.font = "13px 'Courier New', Courier, monospace";
  ctx.fillText("1", canvas.width - 158, 445);
  ctx.fillText(`B/. ${data.subtotal.toFixed(2)}`, canvas.width - 35, 445);

  // Settle at Y=540 for financials
  const financialY = 560;
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(250, financialY - 20);
  ctx.lineTo(canvas.width - 30, financialY - 20);
  ctx.stroke();

  ctx.fillText(`SUBTOTAL:`, canvas.width - 160, financialY);
  ctx.fillText(`B/. ${data.subtotal.toFixed(2)}`, canvas.width - 35, financialY);

  ctx.fillText(`ITBMS (7%):`, canvas.width - 160, financialY + 20);
  ctx.fillText(`B/. ${data.itbms.toFixed(2)}`, canvas.width - 35, financialY + 20);

  ctx.font = "bold 14px 'Courier New', Courier, monospace";
  ctx.fillText(`TOTAL A PAGAR:`, canvas.width - 160, financialY + 45);
  ctx.fillText(`B/. ${data.total.toFixed(2)}`, canvas.width - 35, financialY + 45);

  // Line separator
  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(30, financialY + 65);
  ctx.lineTo(canvas.width - 30, financialY + 65);
  ctx.stroke();

  // 5. Footer & Payment Meta
  ctx.textAlign = "center";
  ctx.font = "bold 12px 'Courier New', Courier, monospace";
  ctx.fillText("METODO DE PAGO ACEPTADO", canvas.width / 2, financialY + 90);
  
  ctx.font = "12px 'Courier New', Courier, monospace";
  ctx.fillText(`FORMA DE PAGO: ${data.formaPago}`, canvas.width / 2, financialY + 110);
  ctx.fillText(`CUENTA DE DEPÓSITO: ${data.cuenta}`, canvas.width / 2, financialY + 130);

  // Legal footer block
  ctx.fillStyle = "#475569";
  ctx.font = "italic 11px Arial, Helvetica, sans-serif";
  const rawPieWords = data.pie.split(" ");
  let pieLine1 = "";
  let pieLine2 = "";
  for(let n = 0; n < rawPieWords.length; n++) {
    if(pieLine1.length < 50) {
      pieLine1 += rawPieWords[n] + " ";
    } else {
      pieLine2 += rawPieWords[n] + " ";
    }
  }
  ctx.fillText(pieLine1.trim(), canvas.width / 2, financialY + 165);
  if(pieLine2) {
    ctx.fillText(pieLine2.trim(), canvas.width / 2, financialY + 185);
  }

  // Draw signature fields
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, financialY + 220);
  ctx.lineTo(200, financialY + 220);
  ctx.moveTo(canvas.width - 200, financialY + 220);
  ctx.lineTo(canvas.width - 80, financialY + 220);
  ctx.stroke();

  ctx.font = "9px Arial, sans-serif";
  ctx.fillText("Entregado por (Motorizado)", 140, financialY + 235);
  ctx.fillText("Recibido Conforme (Cliente)", canvas.width - 140, financialY + 235);

  // Extra context if rotation has been requested (simulates camera perspective distortion physically)
  if (rotateDeg !== 0) {
    const backupCanvas = document.createElement("canvas");
    backupCanvas.width = canvas.width;
    backupCanvas.height = canvas.height;
    const bCtx = backupCanvas.getContext("2d");
    if (bCtx) {
      bCtx.translate(canvas.width / 2, canvas.height / 2);
      bCtx.rotate((rotateDeg * Math.PI) / 180);
      bCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
      return backupCanvas.toDataURL("image/jpeg", 0.85);
    }
  }

  return canvas.toDataURL("image/jpeg", 0.90);
}
