import { useState } from 'react';
import { Upload, FileText, Download, AlertCircle, CheckCircle } from 'lucide-react';
import FileUpload from './components/FileUpload';
import ComparisonResults from './components/ComparisonResults';
import Tabs from './components/Tabs';
import UserComparison from './components/UserComparison';
import { processComparison } from './utils/comparisonLogic';
import type { ComparisonResult } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<string>('excel');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [jsonFiles, setJsonFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async () => {
    if (!csvFile || jsonFiles.length === 0) {
      setError('Please upload both CSV file and JSON files');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await processComparison(csvFile, jsonFiles);
      setResults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during comparison');
    } finally {
      setLoading(false);
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

  const handleReset = () => {
    setCsvFile(null);
    setJsonFiles([]);
    setResults(null);
    setError(null);
  };

  const tabs = [
    { id: 'excel', label: 'Excel CSV Comparison' },
    { id: 'user', label: 'User Comparison' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <FileText className="w-12 h-12 text-slate-700" />
            </div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">
              Comparison Tool
            </h1>
            <p className="text-slate-600">
              Compare data using different methods
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="p-8">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-800 font-medium">Error</p>
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {activeTab === 'excel' && (
                <>
                  {!results ? (
                    <div>
                      <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <FileUpload
                          title="Upload CSV File"
                          accept=".csv"
                          icon={<FileText className="w-6 h-6" />}
                          file={csvFile}
                          onFileSelect={setCsvFile}
                          description="Upload your CSV file containing the data"
                        />

                        <FileUpload
                          title="Upload JSON Files"
                          accept=".json,.zip"
                          icon={<Upload className="w-6 h-6" />}
                          files={jsonFiles}
                          onFilesSelect={handleJsonFilesSelect}
                          multiple
                          description="Upload ZIP files or individual JSON files for comparison"
                        />
                      </div>

                      {(csvFile || jsonFiles.length > 0) && (
                        <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                          <h3 className="font-semibold text-slate-700 mb-2">Selected Files:</h3>
                          <div className="space-y-2 text-sm text-slate-600">
                            {csvFile && (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span>CSV: {csvFile.name}</span>
                              </div>
                            )}
                            {jsonFiles.length > 0 && (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span>JSON Files: {jsonFiles.length} file(s) selected</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handleCompare}
                        disabled={!csvFile || jsonFiles.length === 0 || loading}
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
                            <Download className="w-5 h-5" />
                            Compare & Generate Report
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <ComparisonResults results={results} onReset={handleReset} />
                  )}
                </>
              )}

              {activeTab === 'user' && (
                <UserComparison />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
