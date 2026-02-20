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
 * @param title The document title
 * @param logoBase64 Optional logo in base64 format
 * @returns The Y position where content should start (startY)
 */
export function applyPDFHeader(doc: any, title: string, logoBase64?: string) {
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 15;

    // Add Logo if provided
    if (logoBase64) {
        // Logo on the left
        doc.addImage(logoBase64, 'PNG', 15, 12, 25, 25);
    }

    // Title / Name of Cooperative
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(KOP_TEXT.title, pageWidth / 2 + 10, currentY, { align: 'center' });
    currentY += 7;

    // Legal Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(KOP_TEXT.legal, pageWidth / 2 + 10, currentY, { align: 'center' });
    currentY += 5;

    // Address
    doc.setFontSize(9);
    doc.text(KOP_TEXT.address, pageWidth / 2 + 10, currentY, { align: 'center' });
    currentY += 4;
    doc.text(KOP_TEXT.district, pageWidth / 2 + 10, currentY, { align: 'center' });
    currentY += 10;

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
 * Applies the official FORBIS header to an ExcelJS worksheet and workbook.
 * @param workbook The ExcelJS workbook instance
 * @param worksheet The ExcelJS worksheet instance
 * @param title The document title
 * @param columns Array of column definitions { header, key, width }
 * @param logoBase64 Optional logo in base64 format
 * @returns The row number where table headers are placed
 */
export function applyExcelHeader(
    workbook: any,
    worksheet: any,
    title: string,
    columns: { header: string; key: string; width: number }[],
    logoBase64?: string
) {
    // 1. Set Column widths and keys (but don't rely on auto-header at row 1)
    worksheet.columns = columns.map(col => ({
        key: col.key,
        width: col.width
    }));

    // 2. Add Logo if provided
    if (logoBase64) {
        try {
            const logoId = workbook.addImage({
                base64: logoBase64,
                extension: 'png',
            });
            worksheet.addImage(logoId, 'A1:B4');
        } catch (e) {
            console.error('Error adding logo to Excel:', e);
        }
    }

    const lastColChar = String.fromCharCode(64 + columns.length);

    // 3. Add Header Info
    // Cooperative Title
    worksheet.mergeCells(`C1:${lastColChar}1`);
    const titleRow = worksheet.getCell('C1');
    titleRow.value = KOP_TEXT.title;
    titleRow.font = { bold: true, size: 14 };
    titleRow.alignment = { horizontal: 'center', vertical: 'middle' };

    // Legal Info
    worksheet.mergeCells(`C2:${lastColChar}2`);
    const legalRow = worksheet.getCell('C2');
    legalRow.value = KOP_TEXT.legal;
    legalRow.font = { size: 10 };
    legalRow.alignment = { horizontal: 'center', vertical: 'middle' };

    // Address
    worksheet.mergeCells(`C3:${lastColChar}3`);
    const addrRow = worksheet.getCell('C3');
    addrRow.value = `${KOP_TEXT.address}, ${KOP_TEXT.district}`;
    addrRow.font = { size: 10 };
    addrRow.alignment = { horizontal: 'center', vertical: 'middle' };

    // Document Subject (Title)
    worksheet.mergeCells(`A5:${lastColChar}5`);
    const subjectRow = worksheet.getCell('A5');
    subjectRow.value = title.toUpperCase();
    subjectRow.font = { bold: true, size: 12 };
    subjectRow.alignment = { horizontal: 'center' };

    // Print Date
    worksheet.mergeCells(`A6:${lastColChar}6`);
    const dateRow = worksheet.getCell('A6');
    dateRow.value = `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`;
    dateRow.font = { italic: true, size: 9 };
    dateRow.alignment = { horizontal: 'right' };

    // 4. Set Table Headers at Row 8
    const headerRow = worksheet.getRow(8);
    columns.forEach((col, index) => {
        headerRow.getCell(index + 1).value = col.header;
    });

    return 8; // Table header is at row 8, addRow will start at row 9
}

/**
 * Fetches the application logo and converts it to base64.
 * Useful for exports.
 */
export async function getLogoBase64(): Promise<string> {
    try {
        const response = await fetch('/images/1000075381-removebg-preview.png');
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error('Failed to load logo:', e);
        return '';
    }
}
