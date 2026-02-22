import { jsPDF } from "jspdf";
import type { InvoiceData } from "@/services/payment.service";

const MARGIN = 20;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FONT_SIZE_TITLE = 18;
const FONT_SIZE_HEADING = 12;
const FONT_SIZE_BODY = 10;
const FONT_SIZE_SMALL = 9;
const ROW_HEIGHT = 7;
const TABLE_HEADER_HEIGHT = 8;

/**
 * Generate a downloadable invoice PDF from invoice data.
 * Filename: Invoice-{orderId}.pdf (caller can pass orderId for filename).
 */
export function generateInvoicePDF(
  data: InvoiceData,
  orderId: string
): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  // ----- Header -----
  doc.setFontSize(FONT_SIZE_TITLE);
  doc.setFont("helvetica", "bold");
  doc.text(data.restaurantName, MARGIN, y);
  y += 8;

  doc.setFontSize(FONT_SIZE_SMALL);
  doc.setFont("helvetica", "normal");
  if (data.address) {
    doc.text(data.address, MARGIN, y);
    y += 5;
  }

  doc.setFontSize(FONT_SIZE_HEADING);
  doc.setFont("helvetica", "bold");
  doc.text(`Invoice ${data.invoiceNumber}`, MARGIN, y);
  y += 6;

  doc.setFontSize(FONT_SIZE_SMALL);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${data.date}  |  Time: ${data.time}  |  Table: ${data.tableName}`, MARGIN, y);
  y += 10;

  // ----- Items table -----
  doc.setFontSize(FONT_SIZE_HEADING);
  doc.setFont("helvetica", "bold");
  doc.text("Items", MARGIN, y);
  y += TABLE_HEADER_HEIGHT;

  doc.setFontSize(FONT_SIZE_SMALL);
  doc.setFont("helvetica", "normal");

  const colItem = MARGIN;
  const colQty = MARGIN + 90;
  const colPrice = MARGIN + 110;
  const colTotal = PAGE_WIDTH - MARGIN - 25;

  doc.setFont("helvetica", "bold");
  doc.text("Item", colItem, y);
  doc.text("Qty", colQty, y);
  doc.text("Price", colPrice, y);
  doc.text("Total", colTotal, y);
  y += ROW_HEIGHT;

  doc.setDrawColor(200, 200, 200);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += ROW_HEIGHT;

  doc.setFont("helvetica", "normal");

  for (const item of data.items) {
    const itemName = doc.splitTextToSize(item.name, 85);
    const lineCount = itemName.length;
    for (let i = 0; i < lineCount; i++) {
      doc.text(itemName[i], colItem, y + i * ROW_HEIGHT);
    }
    const itemBlockHeight = Math.max(ROW_HEIGHT, lineCount * ROW_HEIGHT);
    doc.text(String(item.quantity), colQty, y);
    doc.text(formatMoney(item.price), colPrice, y);
    doc.text(formatMoney(item.lineTotal), colTotal, y);
    y += itemBlockHeight;
  }

  y += 8;

  // ----- Totals -----
  const totalsX = PAGE_WIDTH - MARGIN - 55;

  doc.setFont("helvetica", "normal");
  doc.text("Subtotal:", totalsX, y);
  doc.text(formatMoney(data.subtotal), colTotal, y);
  y += ROW_HEIGHT;

  doc.text("Tax:", totalsX, y);
  doc.text(formatMoney(data.tax), colTotal, y);
  y += ROW_HEIGHT;

  doc.text("Service charge:", totalsX, y);
  doc.text(formatMoney(data.serviceCharge), colTotal, y);
  y += ROW_HEIGHT;

  if (data.discount > 0) {
    doc.text("Discount:", totalsX, y);
    doc.text(`-${formatMoney(data.discount)}`, colTotal, y);
    y += ROW_HEIGHT;
  }

  y += 2;
  doc.setDrawColor(0, 0, 0);
  doc.line(totalsX, y, PAGE_WIDTH - MARGIN, y);
  y += ROW_HEIGHT;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT_SIZE_HEADING);
  doc.text("Grand total:", totalsX, y);
  doc.text(formatMoney(data.total), colTotal, y);
  y += 12;

  // ----- Footer -----
  doc.setFont("helvetica", "normal");
  doc.setFontSize(FONT_SIZE_SMALL);
  doc.text("Thank you for dining with us!", MARGIN, y);
  y += 5;
  doc.text(`Payment method: ${data.paymentMethod}`, MARGIN, y);

  doc.save(`Invoice-${orderId}.pdf`);
}

function formatMoney(value: number): string {
  return `₹${value.toFixed(2)}`;
}
