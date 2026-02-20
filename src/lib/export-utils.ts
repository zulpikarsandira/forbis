import type jsPDF from 'jspdf';
import type ExcelJS from 'exceljs';

export const KOP_TEXT = {
    title: 'KOPERASI PEMASARAN FORBIS UMKM CIMANGGUNG',
    legal: 'Badan Hukum No. AHU-00529.AH.01.29. Tahun 2025',
    address: 'Perumahan Gria Prima Alam Asri Blok C.10 No 3, Desa Sindangpakuon',
    district: 'Kecamatan Cimanggung Kabupaten Sumedang 45364'
};

/**
 * Applies the official FORBIS header to a jsPDF document.
 * @param doc The jsPDF instance
 * @param title The document title (e.g., "LAPORAN PENJUALAN")
 * @returns The Y position where content should start (startY)
 */
export function applyPDFHeader(doc: any, title: string) {
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 15;

    // Title / Name of Cooperative
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(KOP_TEXT.title, pageWidth / 2, currentY, { align: 'center' });
    currentY += 6;

    // Legal Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(KOP_TEXT.legal, pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;

    // Address
    doc.setFontSize(9);
    doc.text(KOP_TEXT.address, pageWidth / 2, currentY, { align: 'center' });
    currentY += 4;
    doc.text(KOP_TEXT.district, pageWidth / 2, currentY, { align: 'center' });
    currentY += 6;

    // Line
    doc.setLineWidth(0.5);
    doc.line(15, currentY, pageWidth - 15, currentY);
    currentY += 10;

    // Document Subject
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;

    return currentY;
}

/**
 * Applies the official FORBIS header to an ExcelJS worksheet.
 * @param worksheet The ExcelJS worksheet instance
 * @param title The document title
 * @param lastColChar The last column character (e.g., 'H') for merging
 * @returns The row number where table headers should start
 */
export function applyExcelHeader(worksheet: any, title: string, lastColChar: string) {
    // Add logic for header rows
    worksheet.mergeCells(`A1:${lastColChar}1`);
    const titleRow = worksheet.getCell('A1');
    titleRow.value = KOP_TEXT.title;
    titleRow.font = { bold: true, size: 14 };
    titleRow.alignment = { horizontal: 'center' };

    worksheet.mergeCells(`A2:${lastColChar}2`);
    const legalRow = worksheet.getCell('A2');
    legalRow.value = KOP_TEXT.legal;
    legalRow.font = { size: 10 };
    legalRow.alignment = { horizontal: 'center' };

    worksheet.mergeCells(`A3:${lastColChar}3`);
    const addrRow = worksheet.getCell('A3');
    addrRow.value = `${KOP_TEXT.address}, ${KOP_TEXT.district}`;
    addrRow.font = { size: 10 };
    addrRow.alignment = { horizontal: 'center' };

    worksheet.mergeCells(`A5:${lastColChar}5`);
    const subjectRow = worksheet.getCell('A5');
    subjectRow.value = title.toUpperCase();
    subjectRow.font = { bold: true, size: 12 };
    subjectRow.alignment = { horizontal: 'center' };

    // Placeholder for "Tanggal Cetak"
    worksheet.mergeCells(`A6:${lastColChar}6`);
    const dateRow = worksheet.getCell('A6');
    dateRow.value = `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`;
    dateRow.font = { italic: true, size: 9 };
    dateRow.alignment = { horizontal: 'right' };

    return 8; // Table starts at row 8
}
