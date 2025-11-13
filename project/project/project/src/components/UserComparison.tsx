import { useState } from 'react';
import { Upload, Users, Download, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import FileUpload from './FileUpload';
import Papa from 'papaparse';

interface MissingUser {
  currentUser: string;
  file: string;
}

interface UserGroup {
  user: string;
  files: string[];
  count: number;
}

interface ComparisonResults {
  totalJsonFiles: number;
  matchingCount: number;
  missingUsers: MissingUser[];
  csvUsers: Set<string>;
}

export default function UserComparison() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [jsonFiles, setJsonFiles] = useState<File[]>([]);
  const [csvColumn, setCsvColumn] = useState<string>('');
  const [jsonKey, setJsonKey] = useState<string>('currentUser');
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ComparisonResults | null>(null);

  const handleCsvUpload = async (file: File | null) => {
    setCsvFile(file);
    setAvailableColumns([]);
    setCsvColumn('');

    if (file) {
      Papa.parse(file, {
        header: true,
        preview: 1,
        complete: (results) => {
          if (results.meta.fields) {
            setAvailableColumns(results.meta.fields);
          }
        },
        error: () => {
          setError('Failed to parse CSV file');
        }
      });
    }
  };

  const handleJsonFilesSelect = async (selectedFiles: File[]) => {
    try {
      const allJsonFiles: File[] = [];

      for (const file of selectedFiles) {
        if (file.name.endsWith('.zip')) {
          const extractedFiles = await extractZipFiles(file);
          allJsonFiles.push(...extractedFiles);
        } else if (file.name.endsWith('.json')) {
          allJsonFiles.push(file);
        }
      }

      if (allJsonFiles.length === 0) {
        setError('No JSON files found in the selected files/archives');
        return;
      }

      setJsonFiles(allJsonFiles);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error processing files');
    }
  };

  const extractZipFiles = async (zipFile: File) => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const loaded = await zip.loadAsync(zipFile);
    const jsonFiles: File[] = [];

    for (const [path, file] of Object.entries(loaded.files)) {
      if (path.endsWith('.json') && !file.dir) {
        const content = await file.async('blob');
        const jsonFile = new File([content], path, { type: 'application/json' });
        jsonFiles.push(jsonFile);
      }
    }

    if (jsonFiles.length === 0) {
      throw new Error('No JSON files found in the ZIP archive');
    }

    return jsonFiles;
  };

  const extractUsersFromCsv = async (file: File, columnName: string, key: string): Promise<Set<string>> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          try {
            const users = new Set<string>();
            const data = results.data as Record<string, string>[];

            data.forEach(row => {
              const cellValue = row[columnName];
              if (!cellValue || cellValue.trim() === '') return;

              try {
                const jsonData = JSON.parse(cellValue);
                if (jsonData[key]) {
                  users.add(String(jsonData[key]).trim());
                }
              } catch {
                users.add(cellValue.trim());
              }
            });

            resolve(users);
          } catch (err) {
            reject(err);
          }
        },
        error: (err) => {
          reject(new Error(`CSV parsing error: ${err.message}`));
        }
      });
    });
  };

  const processJsonFiles = async (files: File[], csvUsers: Set<string>, key: string): Promise<{ matchingCount: number; missing: MissingUser[] }> => {
    const missing: MissingUser[] = [];
    let matchingCount = 0;

    for (const file of files) {
      try {
        const content = await file.text();
        const jsonData = JSON.parse(content);
        const currentUser = jsonData[key]?.trim() || '';

        if (currentUser) {
          if (csvUsers.has(currentUser)) {
            matchingCount++;
          } else {
            missing.push({
              currentUser,
              file: file.name
            });
          }
        }
      } catch (err) {
        console.warn(`Error parsing ${file.name}:`, err);
      }
    }

    return { matchingCount, missing };
  };

  const handleCompare = async () => {
    if (!csvFile || jsonFiles.length === 0 || !csvColumn || !jsonKey) {
      setError('Please upload files and fill all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const csvUsers = await extractUsersFromCsv(csvFile, csvColumn, jsonKey);
      const { matchingCount, missing } = await processJsonFiles(jsonFiles, csvUsers, jsonKey);

      setResults({
        totalJsonFiles: jsonFiles.length,
        matchingCount,
        missingUsers: missing,
        csvUsers
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during comparison');
    } finally {
      setLoading(false);
    }
  };

  const groupByUser = (users: MissingUser[]): UserGroup[] => {
    const grouped: Record<string, string[]> = {};

    users.forEach(item => {
      if (!grouped[item.currentUser]) {
        grouped[item.currentUser] = [];
      }
      grouped[item.currentUser].push(item.file);
    });

    return Object.entries(grouped).map(([user, files]) => ({
      user,
      files,
      count: files.length
    }));
  };

  const handleDownloadMissing = () => {
    if (!results || results.missingUsers.length === 0) return;

    const groupedData = groupByUser(results.missingUsers);
    const csvData = groupedData.map(group => ({
      'User Email': group.user,
      'File Count': group.count,
      'Files': group.files.join('; ')
    }));

    const csv = Papa.unparse(csvData);

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'missing_users_summary.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setCsvFile(null);
    setJsonFiles([]);
    setCsvColumn('');
    setJsonKey('currentUser');
    setAvailableColumns([]);
    setResults(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 mb-6">
        <Users className="w-6 h-6 text-slate-700 flex-shrink-0 mt-1" />
        <div>
          <h2 className="text-xl font-bold text-slate-800">User Comparison Tool</h2>
          <p className="text-sm text-slate-600 mt-1">
            Compare usernames from CSV and JSON files to identify mismatches
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {!results ? (
        <div>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <FileUpload
              title="CSV File"
              accept=".csv"
              icon={<FileText className="w-6 h-6" />}
              file={csvFile}
              onFileSelect={handleCsvUpload}
              description="Click to upload"
            />

            <FileUpload
              title="JSON Files"
              accept=".json,.zip"
              icon={<Upload className="w-6 h-6" />}
              files={jsonFiles}
              onFilesSelect={handleJsonFilesSelect}
              multiple
              description="Click to upload"
            />
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Column name inside CSV that contains JSON
                <span className="text-red-600 ml-1">*</span>
              </label>
              {availableColumns.length > 0 ? (
                <select
                  value={csvColumn}
                  onChange={(e) => setCsvColumn(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-700
                           focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent
                           bg-white"
                >
                  <option value="">Select a column</option>
                  {availableColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={csvColumn}
                  onChange={(e) => setCsvColumn(e.target.value)}
                  placeholder="ex: File_Content"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-700
                           placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500
                           focus:border-transparent"
                />
              )}
              <p className="text-xs text-slate-500 mt-1">
                The column in your CSV that contains JSON data
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                JSON key to extract
                <span className="text-red-600 ml-1">*</span>
              </label>
              <input
                type="text"
                value={jsonKey}
                onChange={(e) => setJsonKey(e.target.value)}
                placeholder="ex: currentUser"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-700
                         placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500
                         focus:border-transparent"
              />
              <p className="text-xs text-slate-500 mt-1">
                The JSON property that contains the user identifier
              </p>
            </div>
          </div>

          <button
            onClick={handleCompare}
            disabled={!csvFile || jsonFiles.length === 0 || !csvColumn || !jsonKey || loading}
            className="w-full bg-slate-700 text-white py-3 px-6 rounded-lg font-medium
                     hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed
                     transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Compare
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">Comparison Results</h3>
              <button
                onClick={handleReset}
                className="bg-slate-600 text-white px-4 py-2 rounded-lg font-medium
                         hover:bg-slate-700 transition-colors duration-200 flex items-center gap-2"
              >
                New Comparison
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-lg p-6 border-l-4 border-blue-500 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Total JSON Files</p>
                <p className="text-4xl font-bold text-slate-800">{results.totalJsonFiles}</p>
              </div>
              <div className="bg-white rounded-lg p-6 border-l-4 border-green-500 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Matching Users</p>
                <div className="flex items-baseline gap-3">
                  <p className="text-4xl font-bold text-green-700">{results.matchingCount}</p>
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 border-l-4 border-red-500 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Missing Users</p>
                <div className="flex items-baseline gap-3">
                  <p className="text-4xl font-bold text-red-700">{results.missingUsers.length}</p>
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </div>

            {results.missingUsers.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-semibold text-slate-800">Missing Users Details</h4>
                  <button
                    onClick={handleDownloadMissing}
                    className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium
                             hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2 text-sm shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>

                <div className="space-y-4">
                  {groupByUser(results.missingUsers).map((userGroup, index) => (
                    <div key={index} className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between bg-slate-50 px-5 py-4 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">User Email</p>
                            <p className="text-base font-medium text-slate-800 mt-0.5">{userGroup.user}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">File Count</p>
                          <p className="text-2xl font-bold text-slate-800 mt-0.5">{userGroup.count}</p>
                        </div>
                      </div>

                      <div className="px-5 py-4">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Files</p>
                        <div className="space-y-2">
                          {userGroup.files.map((file, fileIndex) => (
                            <div key={fileIndex} className="flex items-start gap-2 text-sm text-slate-700 bg-slate-50 p-3 rounded border border-slate-100">
                              <span className="text-slate-400 flex-shrink-0 mt-0.5">•</span>
                              <span className="break-all">{file}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.missingUsers.length === 0 && (
              <div className="text-center py-8 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <p className="text-green-800 font-semibold">All users matched successfully!</p>
                <p className="text-green-600 text-sm mt-1">No missing users found in the comparison.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
