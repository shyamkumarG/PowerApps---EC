# CSV & JSON Comparison Tool

A web-based tool to compare CSV and JSON files, identify mismatches, and generate Excel reports.

## Features

- Upload CSV and multiple JSON files through an intuitive interface
- Automatic comparison of user data between CSV and JSON files
- Visual results with mismatch highlighting
- Summary statistics for different file types
- Export results to Excel format with formatting
- Real-time processing with performance metrics

## How to Use

1. **Upload CSV File**: Click on the CSV upload area and select your CSV file containing user data
2. **Upload JSON Files**: Click on the JSON upload area and select multiple JSON files (you can select multiple files at once)
3. **Compare**: Click the "Compare & Generate Report" button to process the files
4. **View Results**: See the comparison results with:
   - User-by-user comparison table
   - Match/Mismatch status for each user
   - Summary statistics
5. **Download**: Click "Download Excel" to export the results as an Excel file

## Column Requirements

### CSV File
- Should contain an email column (email_LkUp, email, or similar)
- Should contain a CreatedBy0 column (optional)

### JSON Files
- Should be in JSON format
- Should contain a "currentUser" field with the email address
- Files with "BehaviouralObservation" in the name will be processed for comparison
- Other file types (Nearmiss, Hazard, HarmInjury, Product, SalesDelivery) will be counted in the summary

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
