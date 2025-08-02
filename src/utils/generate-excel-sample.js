const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Read the sample JSON data
const sampleData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/sample-items.json'), 'utf8'));

// Create a new workbook
const workbook = XLSX.utils.book_new();

// Convert the JSON data to a worksheet
const worksheet = XLSX.utils.json_to_sheet(sampleData);

// Add the worksheet to the workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Items');

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, '../data/excel');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Write the workbook to a file
const outputPath = path.join(outputDir, 'sample-items.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log(`Sample Excel file created at: ${outputPath}`);