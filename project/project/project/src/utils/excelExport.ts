import * as XLSX from 'xlsx';
import { ComparisonResult } from '../types';

export function exportToExcel(results: ComparisonResult) {
  const wb = XLSX.utils.book_new();

  const detailsData = results.details.map(row => ({
    User: row.user,
    CreatedBy0: row.createdBy,
    'Bo (CSV Count)': row.csvCount,
    'Blop (JSON Count)': row.jsonCount,
    Mismatched: row.mismatched,
    Status: row.status === 'match' ? 'Match' : 'Mismatch',
  }));

  const detailsWs = XLSX.utils.json_to_sheet(detailsData);

  const summaryData = [
    { Metric: 'Total CSV Count (Sum of Bo)', Value: results.summary.totalCsvCount },
    { Metric: 'Total JSON Count (Sum of Blop)', Value: results.summary.totalJsonCount },
    { Metric: "Files containing 'Nearmiss'", Value: results.summary.nearmissCount },
    { Metric: "Files containing 'Hazard'", Value: results.summary.hazardCount },
    { Metric: "Files containing 'HarmInjury'", Value: results.summary.harmInjuryCount },
    { Metric: "Files containing 'Product'", Value: results.summary.productCount },
    { Metric: "Files containing 'SalesDelivery'", Value: results.summary.salesDeliveryCount },
  ];

  const summaryWs = XLSX.utils.json_to_sheet(summaryData);

  XLSX.utils.book_append_sheet(wb, detailsWs, 'Comparison_Details');
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

  applyCellStyles(detailsWs, results.details);

  const timestamp = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `comparison_result_${timestamp}.xlsx`);
}

function applyCellStyles(ws: XLSX.WorkSheet, details: ComparisonResult['details']) {
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    const row = details[R - 1];
    if (row && row.status === 'mismatch') {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;

        if (!ws[cellAddress].s) {
          ws[cellAddress].s = {};
        }
        ws[cellAddress].s = {
          fill: {
            fgColor: { rgb: 'FF9999' }
          }
        };
      }
    }
  }
}
