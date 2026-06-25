import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  // ========== HEADER ==========
  doc.setFontSize(22);
  doc.setTextColor(31, 41, 55);
  doc.text('INVOICE', pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(11);
  doc.setTextColor(107, 114, 128);
  doc.text(`#${data.invoiceNumber}`, pageWidth / 2, y, { align: 'center' });
  y += 6;

  doc.setFontSize(9);
  doc.setTextColor(156, 163, 175);
  doc.text(`Created: ${new Date(data.createdAt).toLocaleDateString('id-ID')}`, pageWidth / 2, y, { align: 'center' });
  y += 10;

  // ========== DIVIDER ==========
  doc.setDrawColor(229, 231, 235);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ========== STATUS BADGE ==========
  const statusColors: Record<string, { bg: number[]; text: number[] }> = {
    DRAFT: { bg: [243, 244, 246], text: [55, 65, 81] },
    SENT: { bg: [219, 234, 254], text: [29, 78, 216] },
    PAID: { bg: [187, 247, 208], text: [22, 101, 52] },
    OVERDUE: { bg: [254, 202, 202], text: [185, 28, 28] },
    CANCELLED: { bg: [243, 244, 246], text: [107, 114, 128] },
  };
  const statusColor = statusColors[data.status] || statusColors.DRAFT;

  doc.setFillColor(statusColor.bg[0], statusColor.bg[1], statusColor.bg[2]);
  doc.setTextColor(statusColor.text[0], statusColor.text[1], statusColor.text[2]);
  doc.roundedRect(margin + 40, y - 4, 30, 8, 2, 2, 'F');
  doc.setFontSize(8);
  doc.text(`● ${data.status}`, margin + 45, y + 2);
  doc.setTextColor(107, 114, 128);
  y += 12;

  // ========== CUSTOMER INFO ==========
  doc.setFontSize(12);
  doc.setTextColor(31, 41, 55);
  doc.text('Customer', margin, y);
  y += 6;

  doc.setFontSize(10);
  doc.setTextColor(55, 65, 81);
  const customerRows = [
    [`Name: ${data.customer.name}`, `Email: ${data.customer.email}`],
    [`Phone: ${data.customer.phone || '-'}`, `Address: ${data.customer.address || '-'}`],
    [`Due Date: ${new Date(data.dueDate).toLocaleDateString('id-ID')}`, ''],
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

  // ========== DIVIDER ==========
  doc.setDrawColor(229, 231, 235);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ========== ITEMS TABLE ==========
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

  autoTable(doc, {
    startY: y,
    head: [['Description', 'Qty', 'Price', 'Total']],
    body: tableData,
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
    foot: [
      [
        { content: 'Subtotal', styles: { halign: 'right', fillColor: [249, 250, 251] } },
        { content: '', styles: { fillColor: [249, 250, 251] } },
        { content: '', styles: { fillColor: [249, 250, 251] } },
        { content: `Rp ${data.subtotal.toLocaleString()}`, styles: { halign: 'right', fillColor: [249, 250, 251] } },
      ],
      [
        { content: 'Tax (11%)', styles: { halign: 'right', fillColor: [249, 250, 251] } },
        { content: '', styles: { fillColor: [249, 250, 251] } },
        { content: '', styles: { fillColor: [249, 250, 251] } },
        { content: `Rp ${data.tax.toLocaleString()}`, styles: { halign: 'right', fillColor: [249, 250, 251] } },
      ],
      [
        { content: 'Total', styles: { halign: 'right', fillColor: [219, 234, 254], fontStyle: 'bold', textColor: [37, 99, 235] } },
        { content: '', styles: { fillColor: [219, 234, 254] } },
        { content: '', styles: { fillColor: [219, 234, 254] } },
        { content: `Rp ${data.total.toLocaleString()}`, styles: { halign: 'right', fillColor: [219, 234, 254], fontStyle: 'bold', textColor: [37, 99, 235] } },
      ],
    ],
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 20, halign: 'right' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  // ========== FOOTER ==========
  const finalY = (doc as any).lastAutoTable.finalY || 200;
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text(`Created by: ${data.user.name} (${data.user.email})`, margin, finalY + 10);

  doc.save(`invoice-${data.invoiceNumber}.pdf`);
}
