import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
import { formatDate } from '@/lib/format';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoicePDFData {
  invoiceNumber: string;
  status: string;
  createdAt: string;
  dueDate: string;
  note?: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  user: {
    name: string;
    email: string;
  };
}

export function generateInvoicePDF(data: InvoicePDFData) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 20;

  // HEADER
  doc.setFontSize(22);
  doc.setTextColor(31, 41, 55);
  doc.text('INVOICE', margin, y);
  y += 8;

  doc.setFontSize(11);
  doc.setTextColor(107, 114, 128);
  doc.text(`#${data.invoiceNumber}`, margin, y);
  y += 6;

  doc.setFontSize(9);
  doc.setTextColor(156, 163, 175);
  doc.text(`Created: ${formatDate(data.createdAt)}`, margin, y);
  y += 10;

  // DIVIDER
  doc.setDrawColor(229, 231, 235);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // CUSTOMER INFO
  doc.setFontSize(12);
  doc.setTextColor(31, 41, 55);
  doc.text('Customer', margin, y);
  y += 6;

  doc.setFontSize(10);
  doc.setTextColor(55, 65, 81);
  const customerRows = [
    [`${data.customer.name}`, `Email: ${data.customer.email}`],
    [`Phone: ${data.customer.phone || '-'}`, `Address: ${data.customer.address || '-'}`],
    [`Due Date: ${formatDate(data.dueDate)}`, ''],
  ];
  customerRows.forEach((row) => {
    doc.text(row[0], margin, y);
    if (row[1]) {
      const x2 = pageWidth / 2 + 10;
      doc.text(row[1], x2, y);
    }
    y += 6;
  });
  if (data.note) {
    doc.text(`Note: ${data.note}`, margin, y);
    y += 6;
  }
  y += 4;

  // DIVIDER
  doc.setDrawColor(229, 231, 235);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ITEMS TABLE
  doc.setFontSize(12);
  doc.setTextColor(31, 41, 55);
  doc.text('Items', margin, y);
  y += 6;

  const tableData = data.items.map((item) => [
    item.description,
    item.quantity.toString(),
    `Rp ${item.unitPrice.toLocaleString()}`,
    `Rp ${item.total.toLocaleString()}`,
  ]);

  // FOOTER ROWS
  const footerRows: RowInput[] = [
    [
      { content: 'Subtotal', colSpan: 3, styles: { halign: 'right' as const, fillColor: [249, 250, 251] } },
      { content: `Rp ${data.subtotal.toLocaleString()}`, styles: { halign: 'right' as const, fillColor: [249, 250, 251] } },
    ],
    [
      { content: 'Tax (11%)', colSpan: 3, styles: { halign: 'right' as const, fillColor: [249, 250, 251] } },
      { content: `Rp ${data.tax.toLocaleString()}`, styles: { halign: 'right' as const, fillColor: [249, 250, 251] } },
    ],
    [
      { content: 'Total', colSpan: 3, styles: { halign: 'right' as const, fillColor: [219, 234, 254], fontStyle: 'bold' as const, textColor: [37, 99, 235] } },
      { content: `Rp ${data.total.toLocaleString()}`, styles: { halign: 'right' as const, fillColor: [219, 234, 254], fontStyle: 'bold' as const, textColor: [37, 99, 235] } },
    ],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Description', 'Qty', 'Price', 'Total']],
    body: tableData,
    foot: footerRows,
    theme: 'plain',
    styles: {
      fontSize: 9,
      textColor: [55, 65, 81],
      lineColor: [229, 231, 235],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [243, 244, 246],
      textColor: [55, 65, 81],
      fontStyle: 'bold',
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 20, halign: 'right' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  // FOOTER - PRINTED DATE
  const lastAutoTable = doc as jsPDF & { lastAutoTable?: { finalY: number } };
  const finalY = lastAutoTable.lastAutoTable?.finalY || 200;
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text(`Printed: ${formatDate(new Date())} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`, margin, finalY + 10);
  doc.text(`Invoice #${data.invoiceNumber}`, pageWidth - margin, finalY + 10, { align: 'right' });

  doc.save(`invoice-${data.invoiceNumber}.pdf`);
}
