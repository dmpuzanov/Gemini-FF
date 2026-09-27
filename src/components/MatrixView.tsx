import React, { useState } from 'react';
import { Download, AlertTriangle, Filter, Search, ArrowUpDown, Calendar, FileSpreadsheet, Printer } from 'lucide-react';
import { ALL_ARTICLES, ARTICLE_MAP } from '../constants/initialData';
import { usePvz } from '../context/PvzContext';
import { Article } from '../types/pvz';
import { formatDateRu } from '../utils/calculations';
import { PrintHeader, PrintFooter } from './PrintHeader';

interface MatrixViewProps {
  onOpenArrivalModal: () => void;
  onOpenShipmentModal: () => void;
}

export const MatrixView: React.FC<MatrixViewProps> = ({
  onOpenArrivalModal,
  onOpenShipmentModal,
}) => {
  const { matrix, exportMatrixCsv, exportAllToExcel, settings } = usePvz();
  const [filterArticle, setFilterArticle] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handlePrint = () => {
    window.print();
  };

  // Displayed articles based on filter
  const displayedArticles = filterArticle === 'all'
    ? ALL_ARTICLES
    : ALL_ARTICLES.filter((a) => a === filterArticle);

  // Sorted rows
  const sortedRows = [...matrix].sort((a, b) => {
    return sortOrder === 'asc'
      ? a.date.localeCompare(b.date)
      : b.date.localeCompare(a.date);
  });

  // Check if any negative balances exist in current matrix
  const hasAnyNegative = matrix.some((row) =>
    ALL_ARTICLES.some((art) => (row.byArticle[art]?.balanceEnd ?? 0) < 0)
  );

  // Calculate bottom row (summary):
  // For Было: balance on earliest date
  // For Поставка: total arrival over all dates
  // For Отгрузка: total shipment over all dates
  // For Осталось: balance on latest date
  const latestRow = matrix.length > 0 ? matrix[matrix.length - 1] : null;
  const earliestRow = matrix.length > 0 ? matrix[0] : null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Control bar */}
      <div className="p-4 border-b border-neutral-200 bg-[#F8F8F9] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          {/* Article filter */}
          <div className="flex items-center gap-2 text-xs font-semibold text-[#6B5530]">
            <Filter className="w-3.5 h-3.5" />
            <span>Артикулы:</span>
            <select
              value={filterArticle}
              onChange={(e) => setFilterArticle(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg text-[#333333] focus:outline-hidden focus:ring-1 focus:ring-[#BD995A]"
            >
              <option value="all">Все 7 артикулов (Все категории)</option>
              {ALL_ARTICLES.map((art) => (
                <option key={art} value={art}>
                  {art} ({ARTICLE_MAP.get(art)?.category})
                </option>
              ))}
            </select>
          </div>

          {/* Sort order toggle */}
          <button
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-neutral-300 rounded-lg text-[#333333] hover:bg-neutral-50 transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#6B5530]" />
            <span>{sortOrder === 'asc' ? 'Сначала ранние даты' : 'Сначала свежие даты'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {hasAnyNegative && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 border border-red-300 text-red-800 rounded-lg text-xs font-semibold animate-pulse">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>Внимание: есть отрицательные остатки!</span>
            </div>
          )}

          <button
            onClick={() => exportMatrixCsv('wide')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-neutral-300 text-[#333333] hover:bg-neutral-50 transition-colors shadow-2xs"
            title="Экспорт матрицы в формате таблицы CSV (разделитель точка с запятой)"
          >
            <Download className="w-3.5 h-3.5 text-[#5A081E]" />
            <span>Матрица (CSV)</span>
          </button>

          <button
            onClick={exportAllToExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#EEDDB0] border border-[#BD995A] text-[#1c1917] hover:bg-[#e4cf99] transition-colors shadow-2xs font-bold"
            title="Экспорт полной книги Excel (.xls) со всеми листами: матрица, приёмка, отгрузки, капсулы"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#107C41]" />
            <span>Вся база в Excel (.xls)</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#EEDDB0] border border-[#BD995A] text-[#333333] hover:bg-[#e4cf99] transition-colors shadow-2xs"
            title="Печать матрицы остатков на принтер или сохранение в PDF"
          >
            <Printer className="w-3.5 h-3.5 text-[#5A081E]" />
            <span>Печать</span>
          </button>
        </div>
      </div>

      {/* Main Matrix Table */}
      <div className="flex-1 overflow-auto relative p-0 print:p-0 print:overflow-visible">
        {/* Print Header conforming to section 8.6 with logo >=15mm */}
        <PrintHeader
          documentTitle="МАТРИЦА ОСТАТКОВ И ДВИЖЕНИЯ ТОВАРА"
          documentSubtitle="Посуточный баланс: Было / Поставка / Отгрузка / Осталось"
        />

        <table className="w-full border-collapse text-left border-b border-neutral-200">
          {/* Header 1: Article groups */}
          <thead className="sticky top-0 z-20 bg-white">
            <tr className="border-b border-neutral-300 bg-[#F8F8F9] text-[#5A081E]">
              {/* Frozen Date Column Header */}
              <th className="sticky left-0 z-30 bg-[#F8F8F9] py-2.5 px-3 text-xs font-bold uppercase tracking-wider border-r border-neutral-300 min-w-[120px] shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
                Дата
              </th>

              {displayedArticles.map((art) => {
                const info = ARTICLE_MAP.get(art)!;
                return (
                  <th
                    key={art}
                    colSpan={4}
                    className="py-2 px-2 text-center text-xs font-bold uppercase tracking-wider border-r border-neutral-300 border-l border-neutral-200"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="font-extrabold text-[#5A081E]">{art}</span>
                      <span className="text-[10px] px-1 py-0.2 bg-neutral-200 text-neutral-700 rounded font-normal">
                        {info.category}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>

            {/* Header 2: 4 Subcolumns per article */}
            <tr className="border-b border-neutral-300 bg-[#F8F8F9] text-[11px] font-semibold text-[#6B5530]">
              <th className="sticky left-0 z-30 bg-[#F8F8F9] py-1.5 px-3 border-r border-neutral-300 text-neutral-500 font-medium shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
                ДД.ММ.ГГГГ
              </th>

              {displayedArticles.map((art) => (
                <React.Fragment key={`${art}_sub`}>
                  <th className="py-1 px-2 text-center border-l border-neutral-200 w-16 text-neutral-600 font-medium">
                    Было
                  </th>
                  <th className="py-1 px-2 text-center w-16 text-emerald-700 font-bold">
                    Поставка
                  </th>
                  <th className="py-1 px-2 text-center w-16 text-[#5A081E] font-bold">
                    Отгрузка
                  </th>
                  <th className="py-1 px-2 text-center border-r border-neutral-300 w-16 text-neutral-800 font-bold">
                    Осталось
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-neutral-200 text-xs font-mono tabular-nums">
            {sortedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={1 + displayedArticles.length * 4}
                  className="py-12 text-center text-neutral-400 font-sans"
                >
                  Нет данных за выбранный период. Зарегистрируйте первую приёмку.
                </td>
              </tr>
            ) : (
              sortedRows.map((row) => {
                const isWithinReport =
                  row.date >= settings.reportDateFrom && row.date <= settings.reportDateTo;

                return (
                  <tr
                    key={row.date}
                    className={`hover:bg-neutral-50 transition-colors ${
                      isWithinReport ? 'bg-white' : 'bg-neutral-50/50'
                    }`}
                  >
                    {/* Frozen Date Column */}
                    <td className="sticky left-0 z-10 bg-inherit py-2 px-3 font-medium font-sans text-neutral-900 border-r border-neutral-300 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.03)] flex items-center justify-between">
                      <span>{formatDateRu(row.date)}</span>
                      {isWithinReport && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#BD995A]" title="В периоде отчёта" />
                      )}
                    </td>

                    {/* Article cells */}
                    {displayedArticles.map((art) => {
                      const cell = row.byArticle[art] || {
                        balanceStart: 0,
                        arrival: 0,
                        shipment: 0,
                        balanceEnd: 0,
                      };

                      return (
                        <React.Fragment key={`${row.date}_${art}`}>
                          {/* Было */}
                          <td className="py-2 px-2 text-right border-l border-neutral-200 text-neutral-600">
                            {cell.balanceStart}
                          </td>

                          {/* Поставка: green when > 0 (#10b981) */}
                          <td
                            className={`py-2 px-2 text-right ${
                              cell.arrival > 0 ? 'text-[#10b981] font-bold' : 'text-neutral-400'
                            }`}
                          >
                            {cell.arrival > 0 ? `+${cell.arrival}` : '0'}
                          </td>

                          {/* Отгрузка: bordeaux when > 0 (#5A081E) */}
                          <td
                            className={`py-2 px-2 text-right ${
                              cell.shipment > 0 ? 'text-[#5A081E] font-bold' : 'text-neutral-400'
                            }`}
                          >
                            {cell.shipment > 0 ? `−${cell.shipment}` : '0'}
                          </td>

                          {/* Осталось: red when < 0 (#dc2626) */}
                          <td
                            className={`py-2 px-2 text-right border-r border-neutral-300 font-bold ${
                              cell.balanceEnd < 0
                                ? 'text-[#dc2626] bg-red-50'
                                : 'text-neutral-900'
                            }`}
                          >
                            {cell.balanceEnd}
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Section 8.3: Summary bottom row with accent background #BD995A and white text */}
          <tfoot className="sticky bottom-0 z-20 bg-[#BD995A] text-white font-mono tabular-nums text-xs shadow-[0_-2px_6px_rgba(0,0,0,0.15)]">
            <tr>
              <td className="sticky left-0 z-30 bg-[#BD995A] py-3 px-3 font-sans font-bold uppercase tracking-wider border-r border-[#a8864b] shadow-[2px_0_4px_rgba(0,0,0,0.15)]">
                Итоговый остаток
              </td>

              {displayedArticles.map((art) => {
                // Sum of arrivals and shipments across timeline
                const totalArrival = matrix.reduce((sum, r) => sum + (r.byArticle[art]?.arrival ?? 0), 0);
                const totalShipment = matrix.reduce((sum, r) => sum + (r.byArticle[art]?.shipment ?? 0), 0);
                const currentBalance = latestRow?.byArticle[art]?.balanceEnd ?? 0;
                const startBalance = earliestRow?.byArticle[art]?.balanceStart ?? 0;

                return (
                  <React.Fragment key={`total_${art}`}>
                    <td className="py-3 px-2 text-right border-l border-[#a8864b]/60 text-white/80">
                      {startBalance}
                    </td>
                    <td className="py-3 px-2 text-right font-bold text-white">
                      +{totalArrival}
                    </td>
                    <td className="py-3 px-2 text-right font-bold text-white">
                      −{totalShipment}
                    </td>
                    <td className="py-3 px-2 text-right border-r border-[#a8864b] font-extrabold text-sm text-white">
                      {currentBalance}
                    </td>
                  </React.Fragment>
                );
              })}
            </tr>
          </tfoot>
        </table>

        {/* Print Footer conforming to section 8.6.4 */}
        <PrintFooter />
      </div>

      {/* Footer hint */}
      <div className="p-2.5 px-4 bg-[#F8F8F9] border-t border-neutral-200 text-[11px] text-[#6B5530] flex items-center justify-between shrink-0">
        <div>
          Матрица является <strong>источником правды</strong> по остаткам. Было(день N) = Осталось(день N−1).
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" /> Поставка
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#5A081E]" /> Отгрузка
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626]" /> Отрицательный остаток
          </span>
        </div>
      </div>
    </div>
  );
};
