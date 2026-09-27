import React from 'react';
import { Plus, PackageCheck, Truck, Download, Calendar } from 'lucide-react';
import { usePvz } from '../context/PvzContext';
import { formatDateRu } from '../utils/calculations';

interface HeaderProps {
  title: string;
  onOpenArrivalModal: () => void;
  onOpenShipmentModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onOpenArrivalModal,
  onOpenShipmentModal,
}) => {
  const { settings, exportMatrixCsv } = usePvz();

  return (
    <header className="h-16 px-6 bg-white border-b border-neutral-200 flex items-center justify-between shrink-0 z-10 print:hidden">
      {/* Zone 1: Page Title */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-[#333333] tracking-tight">{title}</h1>
        <span className="hidden sm:inline-block text-xs px-2.5 py-1 rounded bg-[#F8F8F9] text-[#6B5530] border border-neutral-200 font-medium">
          {settings.pvzName}
        </span>
      </div>

      {/* Zone 2 & 3: Context and Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Period badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-[#F8F8F9] border border-neutral-200 rounded-lg text-xs text-[#6B5530]">
          <Calendar className="w-3.5 h-3.5 text-[#BD995A]" />
          <span>Период:</span>
          <span className="font-semibold text-[#333333] font-mono">
            {formatDateRu(settings.reportDateFrom)} — {formatDateRu(settings.reportDateTo)}
          </span>
        </div>

        {/* Quick CSV Export */}
        <button
          onClick={() => exportMatrixCsv('wide')}
          className="hidden md:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-neutral-200 text-[#333333] bg-[#F8F8F9] hover:bg-neutral-200 transition-colors"
          title="Экспорт матрицы остатков в CSV"
        >
          <Download className="w-3.5 h-3.5 text-[#6B5530]" />
          <span>CSV</span>
        </button>

        {/* Primary Actions */}
        <button
          onClick={onOpenArrivalModal}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#5A081E] text-white hover:bg-[#450516] transition-colors shadow-xs"
        >
          <PackageCheck className="w-4 h-4 text-emerald-400" />
          <span>+ Приход / Возврат</span>
        </button>

        <button
          onClick={onOpenShipmentModal}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#BD995A] text-[#1c1917] hover:bg-[#a8864b] transition-colors shadow-xs"
        >
          <Truck className="w-4 h-4 text-[#5A081E]" />
          <span>+ Отгрузка</span>
        </button>
      </div>
    </header>
  );
};
