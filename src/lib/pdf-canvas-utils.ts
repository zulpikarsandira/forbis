import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface PDFInvoiceData {
    invoiceNo: string;
    date: string;
    customerName: string;
    customerPhone?: string;
    customerAddress?: string;
    items: {
        description: string;
        qty: number;
        price: number;
        total: number;
    }[];
    totalSum: number;
}

export async function generatePdfWithCanvas(templatePath: string, data: PDFInvoiceData): Promise<Uint8Array> {
    const existingPdfBytes = await fetch(templatePath).then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Header Colors (Match Template)
    const tealColor = rgb(0.08, 0.4, 0.5); // Dark Teal
    const grayColor = rgb(0.8, 0.8, 0.8);
    const lightGrayColor = rgb(0.95, 0.95, 0.95);

    // 1. Invoice Number (Top Right)
    const invoiceNoText = data.invoiceNo;
    firstPage.drawText(invoiceNoText, {
        x: width - 50 - fontBold.widthOfTextAtSize(invoiceNoText, 14),
        y: height - 108,
        size: 14,
        font: fontBold,
        color: rgb(1, 1, 1), // White text on dark header
    });

    // 2. Bill To & From (Upper Middle)
    // Bill To
    firstPage.drawText('Bill To:', { x: 50, y: height - 245, size: 12, font: fontBold });
    firstPage.drawText(data.customerName, { x: 50, y: height - 265, size: 11, font: font });
    if (data.customerPhone) {
        firstPage.drawText(data.customerPhone, { x: 50, y: height - 280, size: 10, font: font });
    }
    if (data.customerAddress) {
        firstPage.drawText(data.customerAddress, { x: 50, y: height - 295, size: 10, font: font });
    }

    // Date
    firstPage.drawText('Date:', { x: 50, y: height - 350, size: 11, font: fontBold });
    firstPage.drawText(data.date, { x: 100, y: height - 350, size: 11, font: font });

    // 3. Table Structure
    const tableTop = height - 420;
    const colWidths = [250, 60, 100, 85];
    const colX = [50, 300, 360, 460];
    const headerHeight = 25;
    const rowHeight = 25;

    // Draw Table Header Background
    firstPage.drawRectangle({
        x: colX[0],
        y: tableTop - headerHeight,
        width: width - 100,
        height: headerHeight,
        color: tealColor,
    });

    // Draw Header Text
    const headers = ['Description', 'Qty', 'Price', 'Total'];
    headers.forEach((h, i) => {
        const xPos = i === 0 ? colX[i] + 10 : colX[i] + (colWidths[i] / 2) - (fontBold.widthOfTextAtSize(h, 10) / 2);
        firstPage.drawText(h, {
            x: xPos,
            y: tableTop - 18,
            size: 10,
            font: fontBold,
            color: rgb(1, 1, 1),
        });
    });

    // Draw Data Rows & Grid
    let currentY = tableTop - headerHeight;
    data.items.slice(0, 10).forEach((item, index) => {
        // Row background (zebra striping)
        if (index % 2 === 1) {
            firstPage.drawRectangle({
                x: colX[0],
                y: currentY - rowHeight,
                width: width - 100,
                height: rowHeight,
                color: lightGrayColor,
            });
        }

        // Horizontal Line
        firstPage.drawLine({
            start: { x: colX[0], y: currentY },
            end: { x: width - 50, y: currentY },
            thickness: 0.5,
            color: grayColor,
        });

        // Cell Borders (Vertical)
        colX.forEach(x => {
            firstPage.drawLine({
                start: { x, y: currentY },
                end: { x, y: currentY - rowHeight },
                thickness: 0.5,
                color: grayColor,
            });
        });
        // Last vertical line
        firstPage.drawLine({
            start: { x: width - 50, y: currentY },
            end: { x: width - 50, y: currentY - rowHeight },
            thickness: 0.5,
            color: grayColor,
        });

        // Content
        // Description
        firstPage.drawText(item.description, { x: colX[0] + 10, y: currentY - 17, size: 9, font });

        // Qty
        const qtyStr = item.qty.toString();
        firstPage.drawText(qtyStr, {
            x: colX[1] + (colWidths[1] / 2) - (font.widthOfTextAtSize(qtyStr, 9) / 2),
            y: currentY - 17,
            size: 9,
            font
        });

        // Price
        const priceStr = item.price.toLocaleString('id-ID');
        firstPage.drawText(priceStr, {
            x: colX[2] + colWidths[2] - font.widthOfTextAtSize(priceStr, 9) - 10,
            y: currentY - 17,
            size: 9,
            font
        });

        // Total
        const totalStr = item.total.toLocaleString('id-ID');
        firstPage.drawText(totalStr, {
            x: colX[3] + colWidths[3] - font.widthOfTextAtSize(totalStr, 9) - 10,
            y: currentY - 17,
            size: 9,
            fontBold
        });

        currentY -= rowHeight;
    });

    // Last line of table
    firstPage.drawLine({
        start: { x: colX[0], y: currentY },
        end: { x: width - 50, y: currentY },
        thickness: 0.5,
        color: grayColor,
    });

    // 4. Sub Total / Grand Total Box
    const totalBoxWidth = 200;
    const totalBoxHeight = 30;
    firstPage.drawRectangle({
        x: width - 50 - totalBoxWidth,
        y: currentY - 40,
        width: totalBoxWidth,
        height: totalBoxHeight,
        color: tealColor,
    });

    firstPage.drawText('Sub Total', {
        x: width - 40 - totalBoxWidth,
        y: currentY - 30,
        size: 11,
        font: fontBold,
        color: rgb(1, 1, 1),
    });

    const grandTotalText = `Rp ${data.totalSum.toLocaleString('id-ID')}`;
    firstPage.drawText(grandTotalText, {
        x: width - 60 - fontBold.widthOfTextAtSize(grandTotalText, 11),
        y: currentY - 30,
        size: 11,
        font: fontBold,
        color: rgb(1, 1, 1),
    });

    // 5. Footer (Payment & Thank You)
    const footerY = 100;
    firstPage.drawText('Payment Information:', { x: 50, y: footerY + 60, size: 10, font: fontBold });
    firstPage.drawText('Bank: Name Bank', { x: 50, y: footerY + 45, size: 9, font });
    firstPage.drawText('No Bank: 123-456-7890', { x: 50, y: footerY + 30, size: 9, font });

    firstPage.drawText('Thank You!', {
        x: width - 180,
        y: footerY + 10,
        size: 24,
        font: fontBold,
        color: tealColor,
    });

    return await pdfDoc.save();
}
