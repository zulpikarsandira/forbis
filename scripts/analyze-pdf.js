const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

async function analyze() {
    const pdfBytes = fs.readFileSync('public/images/Blue Modern Creative Professional Company Invoice (1).pdf');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    console.log(`Page Size: ${width} x ${height}`);

    // pdf-lib doesn't easily extract text positions, but we can try to find fields or objects
    // for now, let's just create a test PDF with coordinates printed to see where they land
    const testDoc = await PDFDocument.load(pdfBytes);
    const testPage = testDoc.getPages()[0];
    const { Courier } = require('@pdf-lib/fontkit'); // This might not work as expected

    const font = await testDoc.embedFont('Helvetica');

    // Draw a grid
    for (let x = 0; x < width; x += 50) {
        testPage.drawText(x.toString(), { x, y: 10, size: 8, font });
    }
    for (let y = 0; y < height; y += 50) {
        testPage.drawText(y.toString(), { x: 10, y, size: 8, font });
    }

    const testPdfBytes = await testDoc.save();
    fs.writeFileSync('public/images/template_grid_test.pdf', testPdfBytes);
    console.log('Grid test PDF created: public/images/template_grid_test.pdf');
}

analyze().catch(console.error);
