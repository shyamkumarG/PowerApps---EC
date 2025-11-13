export interface ComparisonRow {
  user: string;
  createdBy: string;
  csvCount: number;
  jsonCount: number;
  mismatched: number;
  status: 'match' | 'mismatch';
}

export interface SummaryData {
  totalCsvCount: number;
  totalJsonCount: number;
  nearmissCount: number;
  hazardCount: number;
  harmInjuryCount: number;
  productCount: number;
  salesDeliveryCount: number;
}

export interface ComparisonResult {
  details: ComparisonRow[];
  summary: SummaryData;
  processingTime: number;
}
