import React, { useRef, useState } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Download,
  Upload,
  RotateCcw,
  Sliders,
  DollarSign,
  Building,
  FileSpreadsheet,
} from 'lucide-react';
import { ALL_ARTICLES, ARTICLE_MAP } from '../constants/initialData';
import { usePvz } from '../context/PvzContext';
import { Article, OperatorTariff, SellerTariff } from '../types/pvz';

export const SettingsView: React.FC = () => {
  const {
    settings,
    sellerTariffs,
    operatorTariffs,
    updateSettings,
    updateSellerTariff,
    updateOperatorTariff,
    exportBackupJson,
    importBackupJson,
    exportMatrixCsv,
    exportArrivalsCsv,
    exportShipmentsCsv,
    exportAllToExcel,
    resetToDemoData,
  } = usePvz();

  const [pvzName, setPvzName] = useState(settings.pvzName);
  const [sellerName, setSellerName] = useState(settings.sellerName);
  const [reportDateFrom, setReportDateFrom] = useState(settings.reportDateFrom);
  const [reportDateTo, setReportDateTo] = useState(settings.reportDateTo);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      pvzName,
      sellerName,
      reportDateFrom,
      reportDateTo,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importBackupJson(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex-1 overflow-auto bg-[#F8F8F9] p-6 space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold text-[#333333]">Параметры и тарифная сетка</h2>
        <p className="text-xs text-[#6B5530]">
          Настройка реквизитов ПВЗ, отчётного периода, тарифов селлера и сдельных расценок операторов
        </p>
      </div>

      {/* 1. General Info & Period Form */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4 text-[#5A081E] font-bold text-sm uppercase tracking-wide">
          <Building className="w-4 h-4" />
          <span>Основные параметры и отчётный период</span>
        </div>

        <form onSubmit={handleSaveGeneral} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B5530] mb-1.5">
                Название ПВЗ
              </label>
              <input
                type="text"
                required
                value={pvzName}
                onChange={(e) => setPvzName(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-[#BD995A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B5530] mb-1.5">
                Название селлера / юр. лицо
              </label>
              <input
                type="text"
                required
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-[#BD995A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B5530] mb-1.5">
                Начало отчётного периода
              </label>
              <input
                type="date"
                required
                value={reportDateFrom}
                onChange={(e) => setReportDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-[#BD995A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B5530] mb-1.5">
                Окончание отчётного периода
              </label>
              <input
                type="date"
                required
                value={reportDateTo}
                onChange={(e) => setReportDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-[#BD995A]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-[#5A081E] text-white hover:bg-[#460617] transition-colors shadow-xs"
            >
              <Save className="w-3.5 h-3.5 text-[#BD995A]" />
              <span>Сохранить параметры периода</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Seller Tariffs */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-[#5A081E] font-bold text-sm uppercase tracking-wide">
            <DollarSign className="w-4 h-4" />
            <span>Тарифы для селлера (рублей за единицу)</span>
          </div>
          <span className="text-xs text-[#6B5530]">Для категории «Ми» брендирование всегда 0 руб</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-neutral-200 rounded-lg overflow-hidden">
            <thead className="bg-[#F8F8F9] text-neutral-700 font-semibold border-b border-neutral-200">
              <tr>
                <th className="py-2.5 px-3">Артикул</th>
                <th className="py-2.5 px-3">Категория</th>
                <th className="py-2.5 px-3">Приёмка (₽)</th>
                <th className="py-2.5 px-3">Брендирование (₽)</th>
                <th className="py-2.5 px-3">Упаковка (₽)</th>
                <th className="py-2.5 px-3">Сборка (₽)</th>
                <th className="py-2.5 px-3">Хранение (₽/шт-день)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {ALL_ARTICLES.map((art) => {
                const info = ARTICLE_MAP.get(art)!;
                const tariff = sellerTariffs[art] || { reception: 0, branding: 0, packaging: 0, assembly: 0, storage: 0 };

                return (
                  <tr key={art} className="hover:bg-neutral-50">
                    <td className="py-2 px-3 font-bold text-neutral-900">{art}</td>
                    <td className="py-2 px-3 text-neutral-600">{info.category}</td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={tariff.reception}
                        onChange={(e) => updateSellerTariff(art, 'reception', Number(e.target.value))}
                        className="w-20 px-2 py-1 border border-neutral-300 rounded font-mono text-right"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.01"
                        disabled={!info.hasBranding}
                        value={info.hasBranding ? tariff.branding : 0}
                        onChange={(e) => updateSellerTariff(art, 'branding', Number(e.target.value))}
                        className={`w-20 px-2 py-1 border rounded font-mono text-right ${
                          !info.hasBranding ? 'bg-neutral-100 text-neutral-400 border-neutral-200' : 'border-neutral-300'
                        }`}
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={tariff.packaging}
                        onChange={(e) => updateSellerTariff(art, 'packaging', Number(e.target.value))}
                        className="w-20 px-2 py-1 border border-neutral-300 rounded font-mono text-right"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={tariff.assembly}
                        onChange={(e) => updateSellerTariff(art, 'assembly', Number(e.target.value))}
                        className="w-20 px-2 py-1 border border-neutral-300 rounded font-mono text-right"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={tariff.storage}
                        onChange={(e) => updateSellerTariff(art, 'storage', Number(e.target.value))}
                        className="w-24 px-2 py-1 border border-neutral-300 rounded font-mono text-right font-bold text-[#5A081E]"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Operator Tariffs */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-[#5A081E] font-bold text-sm uppercase tracking-wide">
            <Sliders className="w-4 h-4" />
            <span>Сдельные расценки операторов склада (рублей за единицу)</span>
          </div>
          <span className="text-xs text-[#6B5530]">Выплачивается оператору смены по графику</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-neutral-200 rounded-lg overflow-hidden">
            <thead className="bg-[#F8F8F9] text-neutral-700 font-semibold border-b border-neutral-200">
              <tr>
                <th className="py-2.5 px-3">Артикул</th>
                <th className="py-2.5 px-3">Категория</th>
                <th className="py-2.5 px-3">Приёмка (₽)</th>
                <th className="py-2.5 px-3">Брендирование (₽)</th>
                <th className="py-2.5 px-3">Упаковка (₽)</th>
                <th className="py-2.5 px-3">Сборка (₽)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {ALL_ARTICLES.map((art) => {
                const info = ARTICLE_MAP.get(art)!;
                const tariff = operatorTariffs[art] || { reception: 0, branding: 0, packaging: 0, assembly: 0 };

                return (
                  <tr key={art} className="hover:bg-neutral-50">
                    <td className="py-2 px-3 font-bold text-neutral-900">{art}</td>
                    <td className="py-2 px-3 text-neutral-600">{info.category}</td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={tariff.reception}
                        onChange={(e) => updateOperatorTariff(art, 'reception', Number(e.target.value))}
                        className="w-20 px-2 py-1 border border-neutral-300 rounded font-mono text-right"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.01"
                        disabled={!info.hasBranding}
                        value={info.hasBranding ? tariff.branding : 0}
                        onChange={(e) => updateOperatorTariff(art, 'branding', Number(e.target.value))}
                        className={`w-20 px-2 py-1 border rounded font-mono text-right ${
                          !info.hasBranding ? 'bg-neutral-100 text-neutral-400 border-neutral-200' : 'border-neutral-300'
                        }`}
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={tariff.packaging}
                        onChange={(e) => updateOperatorTariff(art, 'packaging', Number(e.target.value))}
                        className="w-20 px-2 py-1 border border-neutral-300 rounded font-mono text-right"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={tariff.assembly}
                        onChange={(e) => updateOperatorTariff(art, 'assembly', Number(e.target.value))}
                        className="w-20 px-2 py-1 border border-neutral-300 rounded font-mono text-right"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Backup & Data Management */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#5A081E] mb-2">
          Локальный экспорт данных (Excel и CSV) и резервное копирование
        </h3>
        <p className="text-xs text-[#6B5530] mb-5">
          Все файлы формируются локально на вашем ПК без обращений к серверам или внешним API. Кодировка UTF-8 с BOM обеспечивает корректное открытие кириллицы в Microsoft Excel.
        </p>

        {/* Export group */}
        <div className="mb-6 p-4 rounded-xl bg-[#F8F8F9] border border-neutral-200 space-y-3">
          <div className="text-xs font-bold text-neutral-800 uppercase tracking-wide flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-[#107C41]" />
            <span>Экспорт таблиц для Excel и 1С:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={exportAllToExcel}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg bg-[#EEDDB0] border border-[#BD995A] text-[#1c1917] hover:bg-[#e4cf99] transition-colors shadow-2xs"
              title="Экспорт единой книги Excel с отдельными листами: Матрица, Приёмка, Отгрузка, Капсулы"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#107C41]" />
              <span>Вся база в Excel (.xls, все листы)</span>
            </button>

            <button
              onClick={() => exportMatrixCsv('wide')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-lg bg-white border border-neutral-300 text-[#333333] hover:bg-neutral-50 transition-colors shadow-2xs"
              title="Матрица остатков в формате таблицы (Было/Поставка/Отгрузка/Осталось)"
            >
              <Download className="w-3.5 h-3.5 text-[#5A081E]" />
              <span>Матрица остатков (CSV)</span>
            </button>

            <button
              onClick={exportArrivalsCsv}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-lg bg-white border border-neutral-300 text-[#333333] hover:bg-neutral-50 transition-colors shadow-2xs"
              title="Журнал приёмок и возвратов"
            >
              <Download className="w-3.5 h-3.5 text-[#10b981]" />
              <span>Приёмка и возвраты (CSV)</span>
            </button>

            <button
              onClick={exportShipmentsCsv}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-lg bg-white border border-neutral-300 text-[#333333] hover:bg-neutral-50 transition-colors shadow-2xs"
              title="Журнал отгрузок в WB"
            >
              <Download className="w-3.5 h-3.5 text-[#5A081E]" />
              <span>Отгрузки (CSV)</span>
            </button>
          </div>
        </div>

        {/* Backup group */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-neutral-200">
          <button
            onClick={exportBackupJson}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-[#5A081E] text-white hover:bg-[#460617] transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-[#BD995A]" />
            <span>Резервная копия базы (JSON)</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-white border border-neutral-300 text-[#333333] hover:bg-neutral-50 transition-colors shadow-2xs"
          >
            <Upload className="w-4 h-4 text-[#5A081E]" />
            <span>Восстановить базу из файла (JSON)</span>
          </button>

          <div className="grow" />

          <button
            onClick={() => {
              if (
                window.confirm(
                  'Вы уверены, что хотите сбросить все данные к исходным демонстрационным за сентябрь 2026?'
                )
              ) {
                resetToDemoData();
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Сбросить к демо-данным</span>
          </button>
        </div>
      </div>
    </div>
  );
};
