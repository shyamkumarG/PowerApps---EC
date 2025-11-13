import Papa from 'papaparse';
import { ComparisonResult, ComparisonRow, SummaryData } from '../types';

export async function processComparison(
  csvFile: File,
  jsonFiles: File[]
): Promise<ComparisonResult> {
  const startTime = performance.now();

  const csvData = await parseCSV(csvFile);
  const jsonData = await parseJSONFiles(jsonFiles);

  const csvCounts = countUsers(csvData.users);
  const jsonCounts = countUsers(jsonData.users);

  const allUsers = Array.from(
    new Set([...Object.keys(csvCounts), ...Object.keys(jsonCounts)])
  ).sort();

  const details: ComparisonRow[] = allUsers.map(user => {
    const csvCount = csvCounts[user] || 0;
    const jsonCount = jsonCounts[user] || 0;
    const mismatched = csvCount - jsonCount;

    return {
      user,
      createdBy: csvData.createdByMap[user] || 'N/A',
      csvCount,
      jsonCount,
      mismatched,
      status: csvCount === jsonCount ? 'match' : 'mismatch',
    };
  });

  const summary: SummaryData = {
    totalCsvCount: details.reduce((sum, row) => sum + row.csvCount, 0),
    totalJsonCount: details.reduce((sum, row) => sum + row.jsonCount, 0),
    nearmissCount: jsonData.fileCounts.nearmiss,
    hazardCount: jsonData.fileCounts.hazard,
    harmInjuryCount: jsonData.fileCounts.harmInjury,
    productCount: jsonData.fileCounts.product,
    salesDeliveryCount: jsonData.fileCounts.salesDelivery,
  };

  const endTime = performance.now();
  const processingTime = (endTime - startTime) / 1000;

  return { details, summary, processingTime };
}

async function parseCSV(file: File): Promise<{
  users: string[];
  createdByMap: Record<string, string>;
}> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        try {
          const data = results.data as Record<string, string>[];

          const emailColumn = findColumn(data, ['email_LkUp', 'email', 'Email', 'emailLkUp']);
          const createdByColumn = findColumn(data, ['CreatedBy0', 'createdby0', 'CreatedBy']);

          if (!emailColumn) {
            throw new Error('Could not find email column in CSV');
          }

          const users: string[] = [];
          const createdByMap: Record<string, string> = {};

          data.forEach(row => {
            const email = row[emailColumn]?.trim();
            if (email) {
              users.push(email);
              if (createdByColumn && row[createdByColumn]) {
                createdByMap[email] = row[createdByColumn].trim();
              }
            }
          });

          resolve({ users, createdByMap });
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      },
    });
  });
}

async function parseJSONFiles(files: File[]): Promise<{
  users: string[];
  fileCounts: {
    nearmiss: number;
    hazard: number;
    harmInjury: number;
    product: number;
    salesDelivery: number;
  };
}> {
  const users: string[] = [];
  const fileCounts = {
    nearmiss: 0,
    hazard: 0,
    harmInjury: 0,
    product: 0,
    salesDelivery: 0,
  };

  for (const file of files) {
    const fileName = file.name.toLowerCase();

    if (fileName.includes('nearmiss')) fileCounts.nearmiss++;
    if (fileName.includes('hazard')) fileCounts.hazard++;
    if (fileName.includes('harminjury')) fileCounts.harmInjury++;
    if (fileName.includes('product')) fileCounts.product++;
    if (fileName.includes('salesdelivery')) fileCounts.salesDelivery++;

    if (fileName.includes('behaviouralobservation')) {
      try {
        const content = await file.text();
        const jsonData = JSON.parse(content);

        if (jsonData.currentUser) {
          users.push(jsonData.currentUser.trim());
        }
      } catch (error) {
        console.warn(`Error parsing ${file.name}:`, error);
      }
    }
  }

  return { users, fileCounts };
}

function findColumn(data: Record<string, string>[], possibleNames: string[]): string | null {
  if (data.length === 0) return null;

  const headers = Object.keys(data[0]);

  for (const possibleName of possibleNames) {
    const normalized = possibleName.toLowerCase().replace(/[_\s]/g, '');
    const found = headers.find(h =>
      h.toLowerCase().replace(/[_\s]/g, '') === normalized
    );
    if (found) return found;
  }

  return null;
}

function countUsers(users: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  users.forEach(user => {
    counts[user] = (counts[user] || 0) + 1;
  });
  return counts;
}
