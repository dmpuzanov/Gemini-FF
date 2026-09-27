import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_OPERATOR_TARIFFS,
  DEFAULT_SELLER_TARIFFS,
  DEFAULT_SETTINGS,
  DEMO_ARRIVALS,
  DEMO_SCHEDULE,
  DEMO_SHIPMENTS,
} from '../constants/initialData';
import {
  Article,
  ArrivalRecord,
  CapsuleItem,
  DailyStockRow,
  OperatorFulfillment,
  OperatorName,
  OperatorTariff,
  ProblematicStockItem,
  ScheduleMap,
  SellerTariff,
  Settings,
  ShipmentRecord,
} from '../types/pvz';
import {
  calculateCapsules,
  calculateMatrix,
  calculateOperatorPayroll,
  calculateSellerFulfillment,
  exportMatrixToCsv,
  getAllMatrixDates,
  getDateRange,
  simulateNegativeStockCheck,
} from '../utils/calculations';
import {
  downloadFile,
  generateArrivalsCsv,
  generateExcelWorkbookXml,
  generateMatrixCsv,
  generateMatrixWideCsv,
  generateShipmentsCsv,
} from '../utils/exportHelpers';

interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning';
}

interface PendingNegativeAction {
  type: 'addArrival' | 'addShipment' | 'editArrival' | 'editShipment' | 'deleteArrival' | 'deleteShipment';
  payload: any;
  problems: ProblematicStockItem[];
}

interface PvzContextType {
  arrivals: ArrivalRecord[];
  shipments: ShipmentRecord[];
  schedule: ScheduleMap;
  settings: Settings;
  sellerTariffs: Record<Article, SellerTariff>;
  operatorTariffs: Record<Article, OperatorTariff>;

  // Computed
  allDates: string[];
  matrix: DailyStockRow[];
  capsules: CapsuleItem[];
  sellerFulfillment: ReturnType<typeof calculateSellerFulfillment>;
  operatorPayroll: ReturnType<typeof calculateOperatorPayroll>;

  // Modals & Pending Checks
  pendingNegativeAction: PendingNegativeAction | null;
  setPendingNegativeAction: (action: PendingNegativeAction | null) => void;
  confirmPendingAction: () => void;

  // Actions
  addArrival: (record: Omit<ArrivalRecord, 'id' | 'createdAt'>) => ProblematicStockItem[] | null;
  forceAddArrival: (record: Omit<ArrivalRecord, 'id' | 'createdAt'>) => void;
  editArrival: (id: string, record: Partial<Omit<ArrivalRecord, 'id' | 'createdAt'>>) => ProblematicStockItem[] | null;
  deleteArrival: (id: string) => ProblematicStockItem[] | null;
  forceDeleteArrival: (id: string) => void;

  addShipment: (record: Omit<ShipmentRecord, 'id' | 'createdAt'>) => ProblematicStockItem[] | null;
  forceAddShipment: (record: Omit<ShipmentRecord, 'id' | 'createdAt'>) => void;
  editShipment: (id: string, record: Partial<Omit<ShipmentRecord, 'id' | 'createdAt'>>) => ProblematicStockItem[] | null;
  deleteShipment: (id: string) => ProblematicStockItem[] | null;
  forceDeleteShipment: (id: string) => void;

  setScheduleForDate: (date: string, operator: OperatorName) => void;
  fillSchedulePattern: (pattern: '2/2' | '1/1' | 'puzanov' | 'zavalishin') => void;

  updateSettings: (partial: Partial<Settings>) => void;
  updateSellerTariff: (article: Article, field: keyof SellerTariff, val: number) => void;
  updateOperatorTariff: (article: Article, field: keyof OperatorTariff, val: number) => void;

  exportBackupJson: () => void;
  importBackupJson: (jsonStr: string) => boolean;
  exportMatrixCsv: (format?: 'wide' | 'vertical') => void;
  exportArrivalsCsv: () => void;
  exportShipmentsCsv: () => void;
  exportAllToExcel: () => void;
  resetToDemoData: () => void;

  // Toasts
  toasts: ToastState[];
  addToast: (message: string, type?: 'success' | 'error' | 'warning') => void;
  removeToast: (id: string) => void;
}

const STORAGE_KEY = 'pvz_flow_v2_1_state';

const PvzContext = createContext<PvzContextType | undefined>(undefined);

export const PvzProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial state from localStorage or demo defaults
  const [arrivals, setArrivals] = useState<ArrivalRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_arrivals`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEMO_ARRIVALS;
  });

  const [shipments, setShipments] = useState<ShipmentRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_shipments`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEMO_SHIPMENTS;
  });

  const [schedule, setSchedule] = useState<ScheduleMap>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_schedule`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEMO_SCHEDULE;
  });

  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_settings`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_SETTINGS;
  });

  const [sellerTariffs, setSellerTariffs] = useState<Record<Article, SellerTariff>>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_sellerTariffs`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_SELLER_TARIFFS;
  });

  const [operatorTariffs, setOperatorTariffs] = useState<Record<Article, OperatorTariff>>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_operatorTariffs`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_OPERATOR_TARIFFS;
  });

  const [pendingNegativeAction, setPendingNegativeAction] = useState<PendingNegativeAction | null>(null);
  const [toasts, setToasts] = useState<ToastState[]>([]);

  // Toast helpers
  const addToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_arrivals`, JSON.stringify(arrivals));
      localStorage.setItem(`${STORAGE_KEY}_shipments`, JSON.stringify(shipments));
      localStorage.setItem(`${STORAGE_KEY}_schedule`, JSON.stringify(schedule));
      localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(settings));
      localStorage.setItem(`${STORAGE_KEY}_sellerTariffs`, JSON.stringify(sellerTariffs));
      localStorage.setItem(`${STORAGE_KEY}_operatorTariffs`, JSON.stringify(operatorTariffs));
    } catch (e) {
      console.error('Failed to sync to localStorage', e);
    }
  }, [arrivals, shipments, schedule, settings, sellerTariffs, operatorTariffs]);

  // Computed timeline dates
  const allDates = useMemo(() => {
    return getAllMatrixDates(arrivals, shipments, settings);
  }, [arrivals, shipments, settings]);

  // Computed Matrix (stock_daily)
  const matrix = useMemo(() => {
    return calculateMatrix(allDates, arrivals, shipments);
  }, [allDates, arrivals, shipments]);

  // Computed Capsules (FIFO)
  const capsules = useMemo(() => {
    return calculateCapsules(arrivals, shipments, settings, sellerTariffs);
  }, [arrivals, shipments, settings, sellerTariffs]);

  // Computed Seller Fulfillment
  const sellerFulfillment = useMemo(() => {
    return calculateSellerFulfillment(arrivals, shipments, settings, sellerTariffs, capsules);
  }, [arrivals, shipments, settings, sellerTariffs, capsules]);

  // Computed Operator Payroll
  const operatorPayroll = useMemo(() => {
    return calculateOperatorPayroll(arrivals, shipments, settings, schedule, operatorTariffs);
  }, [arrivals, shipments, settings, schedule, operatorTariffs]);

  // --- Actions with Negative Balance Check ---

  const addArrival = (record: Omit<ArrivalRecord, 'id' | 'createdAt'>): ProblematicStockItem[] | null => {
    const newRecord: ArrivalRecord = {
      ...record,
      id: `arr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    const candidateArrivals = [...arrivals, newRecord];
    const problems = simulateNegativeStockCheck(candidateArrivals, shipments, matrix, settings);

    if (problems.length > 0) {
      setPendingNegativeAction({
        type: 'addArrival',
        payload: newRecord,
        problems,
      });
      return problems;
    }

    setArrivals(candidateArrivals);
    addToast(
      record.type === 'return'
        ? `Возврат по ${record.article} (+${record.quantity} шт) добавлен`
        : `Приёмка ${record.article} (+${record.quantity} шт) добавлена`
    );
    return null;
  };

  const forceAddArrival = (record: Omit<ArrivalRecord, 'id' | 'createdAt'>) => {
    const newRecord: ArrivalRecord = {
      ...record,
      id: `arr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setArrivals((prev) => [...prev, newRecord]);
    addToast(`Операция сохранена с предупреждением о балансе`, 'warning');
  };

  const editArrival = (id: string, record: Partial<Omit<ArrivalRecord, 'id' | 'createdAt'>>): ProblematicStockItem[] | null => {
    const candidateArrivals = arrivals.map((a) => (a.id === id ? { ...a, ...record } : a));
    const problems = simulateNegativeStockCheck(candidateArrivals, shipments, matrix, settings);

    if (problems.length > 0) {
      setPendingNegativeAction({
        type: 'editArrival',
        payload: { id, record },
        problems,
      });
      return problems;
    }

    setArrivals(candidateArrivals);
    addToast('Запись прихода обновлена');
    return null;
  };

  const deleteArrival = (id: string): ProblematicStockItem[] | null => {
    const candidateArrivals = arrivals.filter((a) => a.id !== id);
    const problems = simulateNegativeStockCheck(candidateArrivals, shipments, matrix, settings);

    if (problems.length > 0) {
      setPendingNegativeAction({
        type: 'deleteArrival',
        payload: { id },
        problems,
      });
      return problems;
    }

    setArrivals(candidateArrivals);
    addToast('Запись прихода удалена');
    return null;
  };

  const forceDeleteArrival = (id: string) => {
    setArrivals((prev) => prev.filter((a) => a.id !== id));
    addToast('Запись удалена с подтверждением отрицательного остатка', 'warning');
  };

  const addShipment = (record: Omit<ShipmentRecord, 'id' | 'createdAt'>): ProblematicStockItem[] | null => {
    const newRecord: ShipmentRecord = {
      ...record,
      id: `shp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    const candidateShipments = [...shipments, newRecord];
    const problems = simulateNegativeStockCheck(arrivals, candidateShipments, matrix, settings);

    if (problems.length > 0) {
      setPendingNegativeAction({
        type: 'addShipment',
        payload: newRecord,
        problems,
      });
      return problems;
    }

    setShipments(candidateShipments);
    addToast(`Отгрузка ${record.article} (−${record.quantity} шт) добавлена`);
    return null;
  };

  const forceAddShipment = (record: Omit<ShipmentRecord, 'id' | 'createdAt'>) => {
    const newRecord: ShipmentRecord = {
      ...record,
      id: `shp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setShipments((prev) => [...prev, newRecord]);
    addToast(`Отгрузка сохранена с отрицательным остатком`, 'warning');
  };

  const editShipment = (id: string, record: Partial<Omit<ShipmentRecord, 'id' | 'createdAt'>>): ProblematicStockItem[] | null => {
    const candidateShipments = shipments.map((s) => (s.id === id ? { ...s, ...record } : s));
    const problems = simulateNegativeStockCheck(arrivals, candidateShipments, matrix, settings);

    if (problems.length > 0) {
      setPendingNegativeAction({
        type: 'editShipment',
        payload: { id, record },
        problems,
      });
      return problems;
    }

    setShipments(candidateShipments);
    addToast('Запись отгрузки обновлена');
    return null;
  };

  const deleteShipment = (id: string): ProblematicStockItem[] | null => {
    const candidateShipments = shipments.filter((s) => s.id !== id);
    const problems = simulateNegativeStockCheck(arrivals, candidateShipments, matrix, settings);

    if (problems.length > 0) {
      setPendingNegativeAction({
        type: 'deleteShipment',
        payload: { id },
        problems,
      });
      return problems;
    }

    setShipments(candidateShipments);
    addToast('Запись отгрузки удалена');
    return null;
  };

  const forceDeleteShipment = (id: string) => {
    setShipments((prev) => prev.filter((s) => s.id !== id));
    addToast('Отгрузка удалена');
  };

  // Confirm modal action handler
  const confirmPendingAction = () => {
    if (!pendingNegativeAction) return;
    const { type, payload } = pendingNegativeAction;

    if (type === 'addArrival') {
      setArrivals((prev) => [...prev, payload]);
      addToast('Приёмка сохранена (зафиксирован отрицательный остаток)', 'warning');
    } else if (type === 'addShipment') {
      setShipments((prev) => [...prev, payload]);
      addToast('Отгрузка сохранена (зафиксирован отрицательный остаток)', 'warning');
    } else if (type === 'editArrival') {
      setArrivals((prev) => prev.map((a) => (a.id === payload.id ? { ...a, ...payload.record } : a)));
      addToast('Изменение сохранено', 'warning');
    } else if (type === 'editShipment') {
      setShipments((prev) => prev.map((s) => (s.id === payload.id ? { ...s, ...payload.record } : s)));
      addToast('Изменение сохранено', 'warning');
    } else if (type === 'deleteArrival') {
      setArrivals((prev) => prev.filter((a) => a.id !== payload.id));
      addToast('Запись удалена', 'warning');
    } else if (type === 'deleteShipment') {
      setShipments((prev) => prev.filter((s) => s.id !== payload.id));
      addToast('Запись удалена', 'warning');
    }

    setPendingNegativeAction(null);
  };

  // Schedule helpers
  const setScheduleForDate = (date: string, operator: OperatorName) => {
    setSchedule((prev) => ({
      ...prev,
      [date]: operator,
    }));
  };

  const fillSchedulePattern = (pattern: '2/2' | '1/1' | 'puzanov' | 'zavalishin') => {
    const dates = getDateRange(settings.reportDateFrom, settings.reportDateTo);
    const updated: ScheduleMap = { ...schedule };

    dates.forEach((d, idx) => {
      if (pattern === 'puzanov') {
        updated[d] = 'Пузанов Д.В.';
      } else if (pattern === 'zavalishin') {
        updated[d] = 'Завалишин Д.Л.';
      } else if (pattern === '1/1') {
        updated[d] = idx % 2 === 0 ? 'Пузанов Д.В.' : 'Завалишин Д.Л.';
      } else if (pattern === '2/2') {
        const cycle = Math.floor(idx / 2) % 2;
        updated[d] = cycle === 0 ? 'Пузанов Д.В.' : 'Завалишин Д.Л.';
      }
    });

    setSchedule(updated);
    addToast(`График заполнен по шаблону: ${pattern}`);
  };

  // Settings & Tariffs
  const updateSettings = (partial: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
    addToast('Настройки обновлены');
  };

  const updateSellerTariff = (article: Article, field: keyof SellerTariff, val: number) => {
    setSellerTariffs((prev) => ({
      ...prev,
      [article]: {
        ...prev[article],
        [field]: Number(val),
      },
    }));
  };

  const updateOperatorTariff = (article: Article, field: keyof OperatorTariff, val: number) => {
    setOperatorTariffs((prev) => ({
      ...prev,
      [article]: {
        ...prev[article],
        [field]: Number(val),
      },
    }));
  };

  // Backup & CSV
  const exportBackupJson = () => {
    const data = {
      version: '2.1',
      exportedAt: new Date().toISOString(),
      arrivals,
      shipments,
      schedule,
      settings,
      sellerTariffs,
      operatorTariffs,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pvz_flow_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Резервная копия экспортирована');
  };

  const importBackupJson = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.arrivals || !data.shipments) {
        addToast('Некорректный формат файла резервной копии', 'error');
        return false;
      }
      setArrivals(data.arrivals);
      setShipments(data.shipments);
      if (data.schedule) setSchedule(data.schedule);
      if (data.settings) setSettings(data.settings);
      if (data.sellerTariffs) setSellerTariffs(data.sellerTariffs);
      if (data.operatorTariffs) setOperatorTariffs(data.operatorTariffs);
      addToast('Данные успешно восстановлены из резервной копии');
      return true;
    } catch (e) {
      addToast('Ошибка разбора JSON файла', 'error');
      return false;
    }
  };

  const exportMatrixCsv = (format: 'wide' | 'vertical' = 'wide') => {
    const csv = format === 'wide' ? generateMatrixWideCsv(matrix) : generateMatrixCsv(matrix);
    downloadFile(csv, `pvz_matrix_${settings.reportDateFrom}_${settings.reportDateTo}.csv`);
    addToast('Матрица остатков экспортирована в CSV');
  };

  const exportArrivalsCsv = () => {
    const csv = generateArrivalsCsv(arrivals);
    downloadFile(csv, `pvz_arrivals_${settings.reportDateFrom}_${settings.reportDateTo}.csv`);
    addToast('Журнал приёмки и возвратов экспортирован в CSV');
  };

  const exportShipmentsCsv = () => {
    const csv = generateShipmentsCsv(shipments);
    downloadFile(csv, `pvz_shipments_${settings.reportDateFrom}_${settings.reportDateTo}.csv`);
    addToast('Журнал отгрузок экспортирован в CSV');
  };

  const exportAllToExcel = () => {
    const xml = generateExcelWorkbookXml({
      matrix,
      arrivals,
      shipments,
      capsules,
      settings,
      sellerTariffs,
    });
    downloadFile(xml, `pvz_flow_full_export_${settings.reportDateFrom}_${settings.reportDateTo}.xls`, 'application/vnd.ms-excel;charset=utf-8;');
    addToast('Полная книга Excel со всеми таблицами экспортирована');
  };

  const resetToDemoData = () => {
    setArrivals(DEMO_ARRIVALS);
    setShipments(DEMO_SHIPMENTS);
    setSchedule(DEMO_SCHEDULE);
    setSettings(DEFAULT_SETTINGS);
    setSellerTariffs(DEFAULT_SELLER_TARIFFS);
    setOperatorTariffs(DEFAULT_OPERATOR_TARIFFS);
    addToast('Данные сброшены к начальным демонстрационным', 'warning');
  };

  return (
    <PvzContext.Provider
      value={{
        arrivals,
        shipments,
        schedule,
        settings,
        sellerTariffs,
        operatorTariffs,
        allDates,
        matrix,
        capsules,
        sellerFulfillment,
        operatorPayroll,
        pendingNegativeAction,
        setPendingNegativeAction,
        confirmPendingAction,
        addArrival,
        forceAddArrival,
        editArrival,
        deleteArrival,
        forceDeleteArrival,
        addShipment,
        forceAddShipment,
        editShipment,
        deleteShipment,
        forceDeleteShipment,
        setScheduleForDate,
        fillSchedulePattern,
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
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </PvzContext.Provider>
  );
};

export const usePvz = () => {
  const context = useContext(PvzContext);
  if (!context) {
    throw new Error('usePvz must be used within a PvzProvider');
  }
  return context;
};
