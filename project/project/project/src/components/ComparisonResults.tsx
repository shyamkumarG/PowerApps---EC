import { useState } from 'react';
import { Download, RefreshCw, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { ComparisonResult } from '../types';
import { exportToExcel } from '../utils/excelExport';

interface ComparisonResultsProps {
  results: ComparisonResult;
  onReset: () => void;
}

export default function ComparisonResults({ results, onReset }: ComparisonResultsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [showPageSizeMenu, setShowPageSizeMenu] = useState(false);
  const pageSizeOptions = [5, 10, 20, 50, 100, 200, 300];

  const handleDownload = () => {
    exportToExcel(results);
  };

  const mismatchCount = results.details.filter(row => row.status === 'mismatch').length;

  const totalPages = Math.ceil(results.details.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = results.details.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handleItemsPerPageChange = (size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1);
    setShowPageSizeMenu(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Comparison Results</h2>
            <p className="text-sm text-slate-600 mt-1">
              Processed in {results.processingTime.toFixed(2)}s
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium
                       hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Excel
            </button>
            <button
              onClick={onReset}
              className="bg-slate-600 text-white px-4 py-2 rounded-lg font-medium
                       hover:bg-slate-700 transition-colors duration-200 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              New Comparison
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-600 mb-1">Total Users</p>
            <p className="text-2xl font-bold text-slate-800">{results.details.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600 mb-1">Matches</p>
            <p className="text-2xl font-bold text-green-700">
              {results.details.length - mismatchCount}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-red-600 mb-1">Mismatches</p>
            <p className="text-2xl font-bold text-red-700">{mismatchCount}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-600 mb-1">CSV Total</p>
            <p className="text-2xl font-bold text-slate-800">{results.summary.totalCsvCount}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-600 mb-1">Blob Count</p>
            <p className="text-2xl font-bold text-slate-800">{results.summary.totalJsonCount}</p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
          <div className={`overflow-y-auto ${results.details.length > 20 ? 'max-h-96' : ''}`}>
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-100">
                <tr className="border-b border-slate-300">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Created By</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-slate-700">CSV Count</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-slate-700">JSON Count</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((row, index) => {
                  const isMismatch = row.status === 'mismatch';
                  return (
                    <tr
                      key={index}
                      className={`border-b border-slate-200 transition-colors duration-150 ${
                        isMismatch
                          ? 'bg-red-50 hover:bg-red-100'
                          : 'bg-white hover:bg-slate-100'
                      }`}
                    >
                      <td className={`py-4 px-6 text-sm font-medium ${
                        isMismatch ? 'text-red-700' : 'text-slate-700'
                      }`}>
                        {row.createdBy}
                      </td>
                      <td className={`py-4 px-6 text-sm text-right font-medium ${
                        isMismatch ? 'text-red-700' : 'text-slate-800'
                      }`}>
                        {row.csvCount}
                      </td>
                      <td className={`py-4 px-6 text-sm text-right font-medium ${
                        isMismatch ? 'text-red-700' : 'text-slate-800'
                      }`}>
                        {row.jsonCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700">Rows per page:</span>
            <div className="relative">
              <button
                onClick={() => setShowPageSizeMenu(!showPageSizeMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg
                         text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors duration-200"
              >
                {itemsPerPage}
                <ChevronDown className="w-4 h-4" />
              </button>
              {showPageSizeMenu && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-slate-300 rounded-lg
                              shadow-lg z-10 min-w-fit">
                  {pageSizeOptions.map(size => (
                    <button
                      key={size}
                      onClick={() => handleItemsPerPageChange(size)}
                      className={`block w-full text-left px-4 py-2 text-sm transition-colors duration-150 ${
                        itemsPerPage === size
                          ? 'bg-slate-700 text-white'
                          : 'text-slate-700 hover:bg-slate-100'
                      } first:rounded-t-lg last:rounded-b-lg`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="text-sm font-medium text-slate-600">
            Showing <span className="text-slate-800 font-semibold">{startIndex + 1}</span> to <span className="text-slate-800 font-semibold">{Math.min(endIndex, results.details.length)}</span> of <span className="text-slate-800 font-semibold">{results.details.length}</span> entries
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              title="Previous page"
              className="p-2 border border-slate-300 rounded-lg text-slate-700
                       hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-200 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1 mx-2">
              {totalPages <= 7 ? (
                Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    title={`Go to page ${page}`}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      currentPage === page
                        ? 'bg-slate-700 text-white shadow-md'
                        : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {page}
                  </button>
                ))
              ) : (
                <>
                  {currentPage > 3 && (
                    <>
                      <button
                        onClick={() => setCurrentPage(1)}
                        className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 bg-white
                                 border border-slate-300 hover:bg-slate-100 transition-colors duration-200"
                      >
                        1
                      </button>
                      {currentPage > 4 && <span className="px-2 text-slate-500">...</span>}
                    </>
                  )}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = currentPage - 2 + i;
                    return page > 0 && page <= totalPages ? (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          currentPage === page
                            ? 'bg-slate-700 text-white shadow-md'
                            : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {page}
                      </button>
                    ) : null;
                  })}
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && <span className="px-2 text-slate-500">...</span>}
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 bg-white
                                 border border-slate-300 hover:bg-slate-100 transition-colors duration-200"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              title="Next page"
              className="p-2 border border-slate-300 rounded-lg text-slate-700
                       hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-200 disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Metric</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4 text-sm text-slate-800">Total CSV Count (Sum of Bo)</td>
                <td className="py-3 px-4 text-sm text-slate-800 text-right font-medium">{results.summary.totalCsvCount}</td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4 text-sm text-slate-800">Total JSON Count (Sum of Blop)</td>
                <td className="py-3 px-4 text-sm text-slate-800 text-right font-medium">{results.summary.totalJsonCount}</td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4 text-sm text-slate-800">Files containing 'Nearmiss'</td>
                <td className="py-3 px-4 text-sm text-slate-800 text-right font-medium">{results.summary.nearmissCount}</td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4 text-sm text-slate-800">Files containing 'Hazard'</td>
                <td className="py-3 px-4 text-sm text-slate-800 text-right font-medium">{results.summary.hazardCount}</td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4 text-sm text-slate-800">Files containing 'HarmInjury'</td>
                <td className="py-3 px-4 text-sm text-slate-800 text-right font-medium">{results.summary.harmInjuryCount}</td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4 text-sm text-slate-800">Files containing 'Product'</td>
                <td className="py-3 px-4 text-sm text-slate-800 text-right font-medium">{results.summary.productCount}</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-3 px-4 text-sm text-slate-800">Files containing 'SalesDelivery'</td>
                <td className="py-3 px-4 text-sm text-slate-800 text-right font-medium">{results.summary.salesDeliveryCount}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
