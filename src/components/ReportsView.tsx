import React, { useState } from 'react';
import { Printer, Download, FileText, Receipt, Users, Calendar } from 'lucide-react';
import { ALL_ARTICLES, ARTICLE_MAP } from '../constants/initialData';
import { usePvz } from '../context/PvzContext';
import { Article } from '../types/pvz';
import { formatCurrency, formatDateRu, formatNumber, getDateRange } from '../utils/calculations';
import { Logo } from './Logo';

type ReportTab = 'seller' | 'invoice' | 'payroll';

export const ReportsView: React.FC = () => {
  const {
    settings,
    sellerFulfillment,
    operatorPayroll,
    capsules,
    sellerTariffs,
    operatorTariffs,
    schedule,
    arrivals,
    shipments,
    exportAllToExcel,
  } = usePvz();

  const [activeTab, setActiveTab] = useState<ReportTab>('seller');

  const periodDates = getDateRange(settings.reportDateFrom, settings.reportDateTo);
  const printDateStr = formatDateRu(new Date().toISOString().split('T')[0]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-neutral-100">
      {/* Top Toolbar (Hidden when printing) */}
      <div className="p-4 bg-white border-b border-neutral-200 flex flex-wrap items-center justify-between gap-4 shrink-0 print:hidden">
        {/* Report Sub-tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F8F8F9] rounded-lg border border-neutral-200">
          <button
            onClick={() => setActiveTab('seller')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'seller'
                ? 'bg-white text-[#5A081E] shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Отчёт для селлера</span>
          </button>
          <button
            onClick={() => setActiveTab('invoice')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'invoice'
                ? 'bg-white text-[#5A081E] shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Счёт на оплату</span>
          </button>
          <button
            onClick={() => setActiveTab('payroll')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'payroll'
                ? 'bg-white text-[#5A081E] shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Расчётный листок персонала</span>
          </button>
        </div>

        {/* Print & Export Actions (Styled with #EEDDB0, border #BD995A per 8.6.3) */}
        <div className="flex items-center gap-3">
          <div className="text-xs text-neutral-500 mr-2 hidden sm:block">
            Период: <strong>{formatDateRu(settings.reportDateFrom)} — {formatDateRu(settings.reportDateTo)}</strong>
          </div>
          <button
            onClick={exportAllToExcel}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white text-[#1c1917] border border-neutral-300 hover:bg-neutral-50 transition-all shadow-2xs"
            title="Выгрузить данные в формате Excel (.xls)"
          >
            <Download className="w-4 h-4 text-[#107C41]" />
            <span>Выгрузить в Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-[#EEDDB0] text-[#333333] border border-[#BD995A] hover:bg-[#e4cf99] transition-all shadow-xs"
          >
            <Printer className="w-4 h-4 text-[#5A081E]" />
            <span>Печать / Экспорт в PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet Viewport */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center print:p-0 print:m-0 print:overflow-visible">
        {/* White Sheet Container */}
        <div className="bg-white max-w-[900px] w-full p-8 sm:p-12 shadow-md rounded-xl border border-neutral-200 print:border-none print:shadow-none print:p-0 print:max-w-none print:w-full">
          {/* 8.6.1 Mandatory Header */}
          <div className="flex items-start justify-between pb-6 border-b border-[#E6E6E6]">
            {/* Logo >= 15mm (~60px) in #5A081E */}
            <div className="flex items-center gap-3">
              <Logo size="print" variant="default" showText={true} />
            </div>

            {/* Document Title */}
            <div className="text-right">
              <h2 className="text-xl sm:text-2xl font-bold text-[#5A081E] tracking-tight">
                {activeTab === 'seller' && 'ОТЧЁТ ПО СКЛАДУ И ФУЛФИЛМЕНТУ'}
                {activeTab === 'invoice' && 'СЧЁТ НА ОПЛАТУ УСЛУГ'}
                {activeTab === 'payroll' && 'РАСЧЁТНЫЙ ЛИСТОК ПЕРСОНАЛА'}
              </h2>
              <p className="text-xs text-[#6B5530] mt-1 font-medium">
                {activeTab === 'seller' && 'Фулфилмент, брендирование и капсульное хранение'}
                {activeTab === 'invoice' && `Счёт № ${settings.reportDateTo.replace(/-/g, '')}-01`}
                {activeTab === 'payroll' && 'Сдельная заработная плата операторов склада'}
              </p>
            </div>
          </div>

          {/* 8.6.3 Meta Block: Background #EEE5D6 (cream), no borders */}
          <div className="my-5 p-4 bg-[#EEE5D6] text-xs text-[#333333] grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <span className="text-[#6B5530] font-semibold block">Склад / ПВЗ:</span>
              <span className="font-bold text-[#333333]">{settings.pvzName}</span>
            </div>
            <div>
              <span className="text-[#6B5530] font-semibold block">Селлер / Заказчик:</span>
              <span className="font-bold text-[#333333]">{settings.sellerName}</span>
            </div>
            <div>
              <span className="text-[#6B5530] font-semibold block">Отчётный период:</span>
              <span className="font-bold text-[#333333]">
                {formatDateRu(settings.reportDateFrom)} — {formatDateRu(settings.reportDateTo)}
              </span>
            </div>
          </div>

          {/* ======================================================== */}
          {/* TAB 1: ОТЧЁТ ДЛЯ СЕЛЛЕРА */}
          {/* ======================================================== */}
          {activeTab === 'seller' && (
            <div className="space-y-8">
              {/* 1. Fulfillment Services Table */}
              <div>
                <h3 className="text-sm font-bold text-[#5A081E] mb-2 uppercase tracking-wide">
                  1. Услуги фулфилмента по артикулам за период
                </h3>
                {/* STRICT PRINT RULE: All table cells white background, borders #E6E6E6 */}
                <table className="w-full border-collapse border border-[#E6E6E6] text-xs">
                  <thead>
                    <tr className="border-b border-[#E6E6E6]">
                      <th className="p-2 text-left font-bold text-[#5A081E] border-r border-[#E6E6E6] bg-white">
                        Артикул
                      </th>
                      <th className="p-2 text-center font-bold text-[#5A081E] border-r border-[#E6E6E6] bg-white">
                        Приёмка (шт / руб)
                      </th>
                      <th className="p-2 text-center font-bold text-[#5A081E] border-r border-[#E6E6E6] bg-white">
                        Возврат (шт)
                      </th>
                      <th className="p-2 text-center font-bold text-[#5A081E] border-r border-[#E6E6E6] bg-white">
                        Сборка (шт / руб)
                      </th>
                      <th className="p-2 text-center font-bold text-[#5A081E] border-r border-[#E6E6E6] bg-white">
                        Брендирование (шт / руб)
                      </th>
                      <th className="p-2 text-center font-bold text-[#5A081E] border-r border-[#E6E6E6] bg-white">
                        Упаковка (шт / руб)
                      </th>
                      <th className="p-2 text-right font-bold text-[#5A081E] bg-white">
                        Итого операции
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellerFulfillment.items.map((item) => {
                      const opTotal =
                        item.receptionCost +
                        item.assemblyCost +
                        item.brandingCost +
                        item.packagingCost;

                      return (
                        <tr key={item.article} className="border-b border-[#E6E6E6]">
                          <td className="p-2 font-bold text-[#333333] border-r border-[#E6E6E6] bg-white">
                            {item.article}
                          </td>
                          <td className="p-2 text-right font-mono tabular-nums border-r border-[#E6E6E6] bg-white">
                            {item.receptionQty > 0 ? `${item.receptionQty} шт / ${formatCurrency(item.receptionCost)}` : '—'}
                          </td>
                          <td className="p-2 text-right font-mono tabular-nums border-r border-[#E6E6E6] bg-white">
                            {item.returnsQty > 0 ? `${item.returnsQty} шт` : '—'}
                          </td>
                          <td className="p-2 text-right font-mono tabular-nums border-r border-[#E6E6E6] bg-white">
                            {item.assemblyQty > 0 ? `${item.assemblyQty} шт / ${formatCurrency(item.assemblyCost)}` : '—'}
                          </td>
                          <td className="p-2 text-right font-mono tabular-nums border-r border-[#E6E6E6] bg-white">
                            {item.brandingQty > 0 ? `${item.brandingQty} шт / ${formatCurrency(item.brandingCost)}` : '—'}
                          </td>
                          <td className="p-2 text-right font-mono tabular-nums border-r border-[#E6E6E6] bg-white">
                            {item.packagingQty > 0 ? `${item.packagingQty} шт / ${formatCurrency(item.packagingCost)}` : '—'}
                          </td>
                          <td className="p-2 text-right font-mono font-bold tabular-nums text-[#333333] bg-white">
                            {formatCurrency(opTotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Summary row with thick #5A081E border */}
                  <tfoot>
                    <tr className="border-t-2 border-[#5A081E] font-bold text-[#333333]">
                      <td className="p-2.5 font-bold border-r border-[#E6E6E6] bg-white">
                        Итого фулфилмент
                      </td>
                      <td className="p-2.5 text-right font-mono tabular-nums border-r border-[#E6E6E6] bg-white">
                        {formatCurrency(sellerFulfillment.totalReceptionCost)}
                      </td>
                      <td className="p-2.5 text-right font-mono tabular-nums border-r border-[#E6E6E6] bg-white">
                        {sellerFulfillment.items.reduce((sum, i) => sum + i.returnsQty, 0)} шт
                      </td>
                      <td className="p-2.5 text-right font-mono tabular-nums border-r border-[#E6E6E6] bg-white">
                        {formatCurrency(sellerFulfillment.totalAssemblyCost)}
                      </td>
                      <td className="p-2.5 text-right font-mono tabular-nums border-r border-[#E6E6E6] bg-white">
                        {formatCurrency(sellerFulfillment.totalBrandingCost)}
                      </td>
                      <td className="p-2.5 text-right font-mono tabular-nums border-r border-[#E6E6E6] bg-white">
                        {formatCurrency(sellerFulfillment.totalPackagingCost)}
                      </td>
                      <td className="p-2.5 text-right font-mono tabular-nums text-sm font-extrabold text-[#5A081E] bg-white">
                        {formatCurrency(
                          sellerFulfillment.totalReceptionCost +
                            sellerFulfillment.totalAssemblyCost +
                            sellerFulfillment.totalBrandingCost +
                            sellerFulfillment.totalPackagingCost
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* 2. Storage Table by Capsules (Section 5.6 & 5.7) */}
              <div>
                <h3 className="text-sm font-bold text-[#5A081E] mb-2 uppercase tracking-wide">
                  2. Расчёт хранения по партиям (капсулам) за период (FIFO)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-[#E6E6E6] text-[11px]">
                    <thead>
                      <tr className="border-b border-[#E6E6E6]">
                        <th className="p-2 text-left font-bold text-[#5A081E] border-r border-[#E6E6E6] bg-white">
                          Партия / Дата
                        </th>
                        <th className="p-2 text-left font-bold text-[#5A081E] border-r border-[#E6E6E6] bg-white">
                          Артикул
                        </th>
                        <th className="p-2 text-right font-bold text-[#5A081E] border-r border-[#E6E6E6] bg-white">
                          Приёмка
                        </th>
                        <th className="p-2 text-right font-bold text-[#5A081E] border-r border-[#E6E6E6] bg-white">
                          Отгружено
                        </th>
                        {/* Daily columns */}
                        {periodDates.map((d) => (
                          <th
                            key={d}
                            className="p-1 text-center font-bold text-[#5A081E] border-r border-[#E6E6E6] bg-white w-9"
                          >
                            {formatDateRu(d, false)}
                          </th>
                        ))}
                        <th className="p-2 text-right font-bold text-[#5A081E] border-r border-[#E6E6E6] bg-white">
                          Шт-дни
                        </th>
                        <th className="p-2 text-right font-bold text-[#5A081E] border-r border-[#E6E6E6] bg-white">
                          Тариф
                        </th>
                        <th className="p-2 text-right font-bold text-[#5A081E] bg-white">
                          Сумма
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {capsules.map((cap, idx) => {
                        const tariff = sellerTariffs[cap.article]?.storage ?? 0;
                        return (
                          <tr key={`${cap.id}_${idx}`} className="border-b border-[#E6E6E6]">
                            <td className="p-2 font-mono border-r border-[#E6E6E6] bg-white text-neutral-800">
                              {formatDateRu(cap.date)} {cap.type === 'return' ? '(Возврат)' : ''}
                            </td>
                            <td className="p-2 font-bold border-r border-[#E6E6E6] bg-white text-neutral-900">
                              {cap.article}
                            </td>
                            <td className="p-2 text-right font-mono tabular-nums border-r border-[#E6E6E6] bg-white text-neutral-700">
                              {cap.initialQuantity}
                            </td>
                            <td className="p-2 text-right font-mono tabular-nums border-r border-[#E6E6E6] bg-white text-neutral-700">
                              {cap.shippedQuantity}
                            </td>
                            {/* Daily balances */}
                            {periodDates.map((d) => (
                              <td
                                key={d}
                                className="p-1 text-center font-mono tabular-nums border-r border-[#E6E6E6] bg-white text-neutral-800"
                              >
                                {cap.dailyBalances[d] ?? 0}
                              </td>
                            ))}
                            <td className="p-2 text-right font-mono font-bold tabular-nums border-r border-[#E6E6E6] bg-white text-[#5A081E]">
                              {cap.unitDaysInPeriod}
                            </td>
                            <td className="p-2 text-right font-mono tabular-nums border-r border-[#E6E6E6] bg-white text-neutral-600">
                              {tariff.toFixed(2)} ₽
                            </td>
                            <td className="p-2 text-right font-mono font-bold tabular-nums bg-white text-[#333333]">
                              {formatCurrency(cap.storageCost)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-[#5A081E] font-bold text-[#333333]">
                        <td colSpan={4 + periodDates.length} className="p-2 text-right border-r border-[#E6E6E6] bg-white">
                          Итого шт-дней хранения:
                        </td>
                        <td className="p-2 text-right font-mono tabular-nums border-r border-[#E6E6E6] bg-white font-extrabold text-[#5A081E]">
                          {capsules.reduce((sum, c) => sum + c.unitDaysInPeriod, 0)}
                        </td>
                        <td className="p-2 text-right border-r border-[#E6E6E6] bg-white">—</td>
                        <td className="p-2 text-right font-mono tabular-nums font-extrabold text-sm text-[#5A081E] bg-white">
                          {formatCurrency(sellerFulfillment.totalStorageCost)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* 3. Summary Block */}
              <div className="pt-4 border-t-2 border-[#5A081E] flex flex-col items-end">
                <div className="w-full sm:w-80 space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#E6E6E6]">
                    <span className="text-[#6B5530]">Услуги фулфилмента:</span>
                    <span className="font-mono font-semibold text-[#333333]">
                      {formatCurrency(
                        sellerFulfillment.totalReceptionCost +
                          sellerFulfillment.totalAssemblyCost +
                          sellerFulfillment.totalBrandingCost +
                          sellerFulfillment.totalPackagingCost
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#E6E6E6]">
                    <span className="text-[#6B5530]">Ответственное хранение (FIFO):</span>
                    <span className="font-mono font-semibold text-[#333333]">
                      {formatCurrency(sellerFulfillment.totalStorageCost)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 text-base font-extrabold text-[#5A081E]">
                    <span>ИТОГО К ОПЛАТЕ:</span>
                    <span className="font-mono">{formatCurrency(sellerFulfillment.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: СЧЁТ НА ОПЛАТУ */}
          {/* ======================================================== */}
          {activeTab === 'invoice' && (
            <div className="space-y-6">
              <div className="p-4 bg-white border border-[#E6E6E6] text-xs space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[#6B5530] font-semibold block">Исполнитель:</span>
                    <span className="font-bold text-[#333333] text-sm">{settings.pvzName}</span>
                    <p className="text-neutral-500 mt-0.5">Услуги фулфилмента и складского хранения</p>
                  </div>
                  <div>
                    <span className="text-[#6B5530] font-semibold block">Заказчик (Плательщик):</span>
                    <span className="font-bold text-[#333333] text-sm">{settings.sellerName}</span>
                    <p className="text-neutral-500 mt-0.5">Договор обслуживания склада Wildberries</p>
                  </div>
                </div>
              </div>

              {/* Invoice table */}
              <table className="w-full border-collapse border border-[#E6E6E6] text-xs">
                <thead>
                  <tr className="border-b border-[#E6E6E6]">
                    <th className="p-2.5 text-center font-bold text-[#5A081E] border-r border-[#E6E6E6] bg-white w-10">
                      №
                    </th>
                    <th className="p-2.5 text-left font-bold text-[#5A081E] border-r border-[#E6E6E6] bg-white">
                      Наименование услуги
                    </th>
                    <th className="p-2.5 text-right font-bold text-[#5A081E] border-r border-[#E6E6E6] bg-white w-24">
                      Кол-во
                    </th>
                    <th className="p-2.5 text-center font-bold text-[#5A081E] border-r border-[#E6E6E6] bg-white w-20">
                      Ед.
                    </th>
                    <th className="p-2.5 text-right font-bold text-[#5A081E] bg-white w-32">
                      Сумма, руб.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#E6E6E6]">
                    <td className="p-2.5 text-center font-mono border-r border-[#E6E6E6] bg-white">1</td>
                    <td className="p-2.5 font-medium border-r border-[#E6E6E6] bg-white">
                      Приёмка товара от поставщика (7 артикулов)
                    </td>
                    <td className="p-2.5 text-right font-mono tabular-nums border-r border-[#E6E6E6] bg-white">
                      {sellerFulfillment.items.reduce((sum, i) => sum + i.receptionQty, 0)}
                    </td>
                    <td className="p-2.5 text-center border-r border-[#E6E6E6] bg-white">шт</td>
                    <td className="p-2.5 text-right font-mono tabular-nums font-semibold bg-white">
                      {formatCurrency(sellerFulfillment.totalReceptionCost)}
                    </td>
                  </tr>
                  <tr className="border-b border-[#E6E6E6]">
                    <td className="p-2.5 text-center font-mono border-r border-[#E6E6E6] bg-white">2</td>
                    <td className="p-2.5 font-medium border-r border-[#E6E6E6] bg-white">
                      Брендирование товара (категории АК и Г)
                    </td>
                    <td className="p-2.5 text-right font-mono tabular-nums border-r border-[#E6E6E6] bg-white">
                      {sellerFulfillment.items.reduce((sum, i) => sum + i.brandingQty, 0)}
                    </td>
                    <td className="p-2.5 text-center border-r border-[#E6E6E6] bg-white">шт</td>
                    <td className="p-2.5 text-right font-mono tabular-nums font-semibold bg-white">
                      {formatCurrency(sellerFulfillment.totalBrandingCost)}
                    </td>
                  </tr>
                  <tr className="border-b border-[#E6E6E6]">
                    <td className="p-2.5 text-center font-mono border-r border-[#E6E6E6] bg-white">3</td>
                    <td className="p-2.5 font-medium border-r border-[#E6E6E6] bg-white">
                      Индивидуальная упаковка заказов
                    </td>
                    <td className="p-2.5 text-right font-mono tabular-nums border-r border-[#E6E6E6] bg-white">
                      {sellerFulfillment.items.reduce((sum, i) => sum + i.packagingQty, 0)}
                    </td>
                    <td className="p-2.5 text-center border-r border-[#E6E6E6] bg-white">шт</td>
                    <td className="p-2.5 text-right font-mono tabular-nums font-semibold bg-white">
                      {formatCurrency(sellerFulfillment.totalPackagingCost)}
                    </td>
                  </tr>
                  <tr className="border-b border-[#E6E6E6]">
                    <td className="p-2.5 text-center font-mono border-r border-[#E6E6E6] bg-white">4</td>
                    <td className="p-2.5 font-medium border-r border-[#E6E6E6] bg-white">
                      Сборка и подготовка к отправке в Wildberries
                    </td>
                    <td className="p-2.5 text-right font-mono tabular-nums border-r border-[#E6E6E6] bg-white">
                      {sellerFulfillment.items.reduce((sum, i) => sum + i.assemblyQty, 0)}
                    </td>
                    <td className="p-2.5 text-center border-r border-[#E6E6E6] bg-white">шт</td>
                    <td className="p-2.5 text-right font-mono tabular-nums font-semibold bg-white">
                      {formatCurrency(sellerFulfillment.totalAssemblyCost)}
                    </td>
                  </tr>
                  <tr className="border-b border-[#E6E6E6]">
                    <td className="p-2.5 text-center font-mono border-r border-[#E6E6E6] bg-white">5</td>
                    <td className="p-2.5 font-medium border-r border-[#E6E6E6] bg-white">
                      Ответственное складское хранение (партии-капсулы FIFO)
                    </td>
                    <td className="p-2.5 text-right font-mono tabular-nums border-r border-[#E6E6E6] bg-white">
                      {capsules.reduce((sum, c) => sum + c.unitDaysInPeriod, 0)}
                    </td>
                    <td className="p-2.5 text-center border-r border-[#E6E6E6] bg-white">шт-дн</td>
                    <td className="p-2.5 text-right font-mono tabular-nums font-semibold bg-white">
                      {formatCurrency(sellerFulfillment.totalStorageCost)}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#5A081E] font-bold text-sm text-[#333333]">
                    <td colSpan={4} className="p-3 text-right border-r border-[#E6E6E6] bg-white font-extrabold">
                      Всего к оплате:
                    </td>
                    <td className="p-3 text-right font-mono font-extrabold text-base text-[#5A081E] bg-white">
                      {formatCurrency(sellerFulfillment.grandTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-xs text-[#333333]">
                <div>
                  <div className="border-b border-[#333333] pb-1 mb-1 font-semibold">
                    Исполнитель: ___________________ / (подпись)
                  </div>
                  <span className="text-[11px] text-neutral-500">М.П.</span>
                </div>
                <div>
                  <div className="border-b border-[#333333] pb-1 mb-1 font-semibold">
                    Заказчик: ___________________ / (подпись)
                  </div>
                  <span className="text-[11px] text-neutral-500">М.П.</span>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: РАСЧЁТНЫЙ ЛИСТОК ПЕРСОНАЛА */}
          {/* ======================================================== */}
          {activeTab === 'payroll' && (
            <div className="space-y-8">
              {operatorPayroll.operators.map((op) => (
                <div key={op.operator} className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#5A081E]">
                    <div>
                      <h4 className="text-base font-extrabold text-[#5A081E]">{op.operator}</h4>
                      <p className="text-xs text-[#6B5530]">
                        Отработано смен: <strong>{op.workDaysCount} дн.</strong> ({op.dates.map((d) => formatDateRu(d, false)).join(', ') || 'нет смен'})
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-neutral-500 block uppercase tracking-wider">К выплате:</span>
                      <span className="text-base font-bold font-mono text-[#5A081E]">
                        {formatCurrency(op.totalPay)}
                      </span>
                    </div>
                  </div>

                  <table className="w-full border-collapse border border-[#E6E6E6] text-xs">
                    <thead>
                      <tr className="border-b border-[#E6E6E6]">
                        <th className="p-2 text-left font-bold text-[#5A081E] border-r border-[#E6E6E6] bg-white">
                          Артикул
                        </th>
                        <th className="p-2 text-right font-bold text-[#5A081E] border-r border-[#E6E6E6] bg-white">
                          Приёмка (руб)
                        </th>
                        <th className="p-2 text-right font-bold text-[#5A081E] border-r border-[#E6E6E6] bg-white">
                          Брендирование (руб)
                        </th>
                        <th className="p-2 text-right font-bold text-[#5A081E] border-r border-[#E6E6E6] bg-white">
                          Упаковка (руб)
                        </th>
                        <th className="p-2 text-right font-bold text-[#5A081E] border-r border-[#E6E6E6] bg-white">
                          Сборка (руб)
                        </th>
                        <th className="p-2 text-right font-bold text-[#5A081E] bg-white">
                          Итого по артикулу
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {ALL_ARTICLES.map((art) => {
                        const row = op.byArticle[art] || { reception: 0, branding: 0, packaging: 0, assembly: 0, total: 0 };
                        return (
                          <tr key={art} className="border-b border-[#E6E6E6]">
                            <td className="p-2 font-bold text-[#333333] border-r border-[#E6E6E6] bg-white">
                              {art}
                            </td>
                            <td className="p-2 text-right font-mono tabular-nums border-r border-[#E6E6E6] bg-white">
                              {row.reception > 0 ? formatCurrency(row.reception) : '—'}
                            </td>
                            <td className="p-2 text-right font-mono tabular-nums border-r border-[#E6E6E6] bg-white">
                              {row.branding > 0 ? formatCurrency(row.branding) : '—'}
                            </td>
                            <td className="p-2 text-right font-mono tabular-nums border-r border-[#E6E6E6] bg-white">
                              {row.packaging > 0 ? formatCurrency(row.packaging) : '—'}
                            </td>
                            <td className="p-2 text-right font-mono tabular-nums border-r border-[#E6E6E6] bg-white">
                              {row.assembly > 0 ? formatCurrency(row.assembly) : '—'}
                            </td>
                            <td className="p-2 text-right font-mono font-bold tabular-nums text-[#333333] bg-white">
                              {formatCurrency(row.total)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-[#5A081E] font-bold text-[#333333]">
                        <td className="p-2.5 font-bold border-r border-[#E6E6E6] bg-white">Итого:</td>
                        <td className="p-2.5 text-right font-mono tabular-nums border-r border-[#E6E6E6] bg-white">
                          {formatCurrency(op.receptionPay)}
                        </td>
                        <td className="p-2.5 text-right font-mono tabular-nums border-r border-[#E6E6E6] bg-white">
                          {formatCurrency(op.brandingPay)}
                        </td>
                        <td className="p-2.5 text-right font-mono tabular-nums border-r border-[#E6E6E6] bg-white">
                          {formatCurrency(op.packagingPay)}
                        </td>
                        <td className="p-2.5 text-right font-mono tabular-nums border-r border-[#E6E6E6] bg-white">
                          {formatCurrency(op.assemblyPay)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-extrabold text-sm text-[#5A081E] bg-white">
                          {formatCurrency(op.totalPay)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ))}

              <div className="pt-4 border-t-2 border-[#5A081E] flex justify-between items-center text-sm font-bold text-[#5A081E]">
                <span>ОБЩИЙ ФОНД ОПЛАТЫ ТРУДА (ФОТ):</span>
                <span className="text-base font-extrabold font-mono">
                  {formatCurrency(operatorPayroll.totalPayroll)}
                </span>
              </div>
            </div>
          )}

          {/* 8.6.4 Mandatory Footer for Print Forms */}
          <div className="mt-12 pt-4 border-t border-[#E6E6E6] flex flex-wrap items-center justify-between text-[9pt] text-[#6B5530]">
            <div>PVZ.FLOW — Система учёта фулфилмента ПВЗ</div>
            <div>Документ сформирован: {printDateStr}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
