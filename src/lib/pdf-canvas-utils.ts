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

/**
 * Generates a PDF by overlaying data on a provided template (canvas).
 */
export async function generatePdfWithCanvas(templatePath: string, data: PDFInvoiceData): Promise<Uint8Array> {
    const existingPdfBytes = await fetch(templatePath).then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { height } = firstPage.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Coordinates (Estimated from image alignment)
    // pdf-lib uses 0,0 at BOTTOM-LEFT

    // 1. Invoice No
    firstPage.drawText(data.invoiceNo, {
        x: 480,
        y: height - 108,
        size: 10,
        font: fontBold,
        color: rgb(0, 0, 0),
    });

    // 2. Date
    firstPage.drawText(data.date, {
        x: 100,
        y: height - 395,
        size: 10,
        font: font,
    });

    // 3. Bill To
    firstPage.drawText(data.customerName, {
        x: 55,
        y: height - 268,
        size: 11,
        font: fontBold,
    });
    if (data.customerPhone) {
        firstPage.drawText(data.customerPhone, {
            x: 55,
            y: height - 285,
            size: 10,
            font: font,
        });
    }
    if (data.customerAddress) {
        firstPage.drawText(data.customerAddress, {
            x: 55,
            y: height - 302,
            size: 10,
            font: font,
        });
    }

    // 4. Table Items
    let currentY = height - 505;
    const rowHeight = 25;

    data.items.slice(0, 6).forEach((item) => {
        // Description
        firstPage.drawText(item.description, {
            x: 55,
            y: currentY,
            size: 10,
            font: font,
        });

        // Qty
        firstPage.drawText(item.qty.toString(), {
            x: 275,
            y: currentY,
            size: 10,
            font: font,
        });

        // Price
        const priceText = item.price.toLocaleString('id-ID');
        firstPage.drawText(priceText, {
            x: 420 - font.widthOfTextAtSize(priceText, 10),
            y: currentY,
            size: 10,
            font: font,
        });

        // Total
        const totalText = item.total.toLocaleString('id-ID');
        firstPage.drawText(totalText, {
            x: 550 - font.widthOfTextAtSize(totalText, 10),
            y: currentY,
            size: 10,
            font: fontBold,
        });

        currentY -= rowHeight;
    });

    // 5. Total Sum
    const totalSumText = `Rp ${data.totalSum.toLocaleString('id-ID')}`;
    firstPage.drawText(totalSumText, {
        x: 550 - fontBold.widthOfTextAtSize(totalSumText, 12),
        y: height - 728,
        size: 12,
        font: fontBold,
        color: rgb(1, 1, 1), // White text for the blue total box if applicable
    });

    return await pdfDoc.save();
}
