import React, { useMemo, useState } from 'react';
import {
  GanttChart,
  GitFork,
  Filter,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Calendar,
  UserCheck,
  Target,
  FolderKanban,
  Layers,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Dossier, GanttTimeScale, CurrencyCode, LanguageCode } from '../types';
import { STANDARD_PHASES, computeTaskMetrics, getTodayISO } from '../pertUtils';
import { formatCurrency } from '../i18n';

interface GanttAndTreeViewProps {
  dossier: Dossier;
  currency: CurrencyCode;
  language: LanguageCode;
  filterAxeId: string;
  setFilterAxeId: (id: string) => void;
  filterProjectId: string;
  setFilterProjectId: (id: string) => void;
}

interface TimeBucket {
  key: string;
  label: string;
  subLabel?: string;
  start: Date;
  end: Date;
}

export const GanttAndTreeView: React.FC<GanttAndTreeViewProps> = ({
  dossier,
  currency,
  language,
  filterAxeId,
  setFilterAxeId,
  filterProjectId,
  setFilterProjectId
}) => {
  const [viewMode, setViewMode] = useState<'gantt' | 'tree'>('gantt');
  const [timeScale, setTimeScale] = useState<GanttTimeScale>('month');
  const [filterPhase, setFilterPhase] = useState<string>('ALL');
  const [filterAssignee, setFilterAssignee] = useState<string>('ALL');
  const [zoom, setZoom] = useState<number>(1);
  const [collapsedPhases, setCollapsedPhases] = useState<Record<string, boolean>>({});

  const todayISO = getTodayISO();
  const axes = dossier.axes || [];

  const filteredAxes = useMemo(() => {
    if (filterAxeId === 'ALL') return axes;
    return axes.filter(a => a.id === filterAxeId);
  }, [axes, filterAxeId]);

  const availableProjects = useMemo(() => {
    return filteredAxes.flatMap(a => a.projects || []);
  }, [filteredAxes]);

  // All unique assignees for the Responsable filter
  const allAssignees = useMemo(() => {
    const set = new Set<string>();
    axes.forEach(ax => {
      (ax.projects || []).forEach(pr => {
        (pr.tasks || []).forEach(tk => {
          if (tk.assignee && tk.assignee.trim()) {
            set.add(tk.assignee.trim());
          }
        });
      });
    });
    return Array.from(set).sort();
  }, [axes]);

  const togglePhaseCollapse = (key: string) => {
    setCollapsedPhases(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Collect all filtered tasks for date range calculation
  const allFilteredTasks = useMemo(() => {
    const list: Array<{
      startDate: string;
      endDate: string;
      actualStartDate: string;
      actualEndDate: string;
    }> = [];

    filteredAxes.forEach(ax => {
      (ax.projects || [])
        .filter(pr => filterProjectId === 'ALL' || pr.id === filterProjectId)
        .forEach(pr => {
          (pr.tasks || []).forEach(tk => {
            if (filterPhase !== 'ALL' && tk.phase !== filterPhase) return;
            if (
              filterAssignee !== 'ALL' &&
              (tk.assignee || '').trim() !== filterAssignee
            ) {
              return;
            }
            list.push({
              startDate: tk.startDate,
              endDate: tk.endDate,
              actualStartDate: tk.actualStartDate || '',
              actualEndDate: tk.actualEndDate || ''
            });
          });
        });
    });
    return list;
  }, [filteredAxes, filterProjectId, filterPhase, filterAssignee]);

  // Dynamic time buckets based on timeScale (day | week | month | quarter | semester | year)
  const timeBuckets = useMemo<TimeBucket[]>(() => {
    const now = new Date();
    let minDate = new Date(now.getFullYear(), 0, 1);
    let maxDate = new Date(now.getFullYear(), 11, 31);

    const validDates: Date[] = [];
    allFilteredTasks.forEach(r => {
      [r.startDate, r.endDate, r.actualStartDate, r.actualEndDate].forEach(dStr => {
        if (dStr) {
          const d = new Date(dStr);
          if (!isNaN(d.getTime())) validDates.push(d);
        }
      });
    });

    if (validDates.length > 0) {
      minDate = new Date(Math.min(...validDates.map(d => d.getTime())));
      maxDate = new Date(Math.max(...validDates.map(d => d.getTime())));
    }

    const buckets: TimeBucket[] = [];

    if (timeScale === 'day') {
      const start = new Date(
        minDate.getFullYear(),
        minDate.getMonth(),
        minDate.getDate() - 2
      );
      const end = new Date(
        maxDate.getFullYear(),
        maxDate.getMonth(),
        maxDate.getDate() + 5
      );
      const cur = new Date(start);
      let count = 0;
      while (cur <= end && count < 120) {
        const bStart = new Date(
          cur.getFullYear(),
          cur.getMonth(),
          cur.getDate(),
          0,
          0,
          0
        );
        const bEnd = new Date(
          cur.getFullYear(),
          cur.getMonth(),
          cur.getDate(),
          23,
          59,
          59
        );
        buckets.push({
          key: bStart.toISOString().slice(0, 10),
          label: `${String(bStart.getDate()).padStart(2, '0')}/${String(
            bStart.getMonth() + 1
          ).padStart(2, '0')}`,
          subLabel: bStart
            .toLocaleDateString('fr-FR', { weekday: 'short' })
            .slice(0, 2),
          start: bStart,
          end: bEnd
        });
        cur.setDate(cur.getDate() + 1);
        count++;
      }
    } else if (timeScale === 'week') {
      const start = new Date(
        minDate.getFullYear(),
        minDate.getMonth(),
        minDate.getDate() - 7
      );
      const end = new Date(
        maxDate.getFullYear(),
        maxDate.getMonth(),
        maxDate.getDate() + 14
      );
      const cur = new Date(start);
      let weekIdx = 1;
      while (cur <= end && weekIdx <= 60) {
        const bStart = new Date(
          cur.getFullYear(),
          cur.getMonth(),
          cur.getDate(),
          0,
          0,
          0
        );
        const bEnd = new Date(
          cur.getFullYear(),
          cur.getMonth(),
          cur.getDate() + 6,
          23,
          59,
          59
        );
        buckets.push({
          key: `W-${bStart.toISOString().slice(0, 10)}`,
          label: `S${weekIdx}`,
          subLabel: `${String(bStart.getDate()).padStart(2, '0')}/${String(
            bStart.getMonth() + 1
          ).padStart(2, '0')}`,
          start: bStart,
          end: bEnd
        });
        cur.setDate(cur.getDate() + 7);
        weekIdx++;
      }
    } else if (timeScale === 'month') {
      const startYear = minDate.getFullYear();
      const endYear = Math.max(startYear, maxDate.getFullYear());
      const monthNames = [
        'Jan',
        'Fév',
        'Mar',
        'Avr',
        'Mai',
        'Juin',
        'Juil',
        'Août',
        'Sep',
        'Oct',
        'Nov',
        'Déc'
      ];
      for (let y = startYear; y <= endYear; y++) {
        for (let m = 0; m < 12; m++) {
          buckets.push({
            key: `${y}-${m + 1}`,
            label: monthNames[m],
            subLabel: String(y).slice(-2),
            start: new Date(y, m, 1, 0, 0, 0),
            end: new Date(y, m + 1, 0, 23, 59, 59)
          });
        }
      }
    } else if (timeScale === 'quarter') {
      const startYear = minDate.getFullYear();
      const endYear = Math.max(startYear, maxDate.getFullYear());
      for (let y = startYear; y <= endYear; y++) {
        for (let q = 0; q < 4; q++) {
          buckets.push({
            key: `${y}-T${q + 1}`,
            label: `T${q + 1}`,
            subLabel: String(y),
            start: new Date(y, q * 3, 1, 0, 0, 0),
            end: new Date(y, q * 3 + 3, 0, 23, 59, 59)
          });
        }
      }
    } else if (timeScale === 'semester') {
      const startYear = minDate.getFullYear();
      const endYear = Math.max(startYear, maxDate.getFullYear());
      for (let y = startYear; y <= endYear; y++) {
        for (let s = 0; s < 2; s++) {
          buckets.push({
            key: `${y}-S${s + 1}`,
            label: `Sem. ${s + 1}`,
            subLabel: String(y),
            start: new Date(y, s * 6, 1, 0, 0, 0),
            end: new Date(y, s * 6 + 6, 0, 23, 59, 59)
          });
        }
      }
    } else if (timeScale === 'year') {
      const startYear = Math.min(minDate.getFullYear(), now.getFullYear() - 1);
      const endYear = Math.max(maxDate.getFullYear(), now.getFullYear() + 2);
      for (let y = startYear; y <= endYear; y++) {
        buckets.push({
          key: `${y}`,
          label: `${y}`,
          subLabel: 'Annuel',
          start: new Date(y, 0, 1, 0, 0, 0),
          end: new Date(y, 11, 31, 23, 59, 59)
        });
      }
    }

    return buckets;
  }, [allFilteredTasks, timeScale]);

  const overlapsBucket = (startStr: string, endStr: string, bucket: TimeBucket) => {
    if (!startStr && !endStr) return false;
    const s = new Date(startStr || endStr);
    const e = new Date(endStr || startStr);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return false;
    return s <= bucket.end && e >= bucket.start;
  };

  return (
    <div className="space-y-2 sm:space-y-3">
      {/* Ultra-Compact Top Toolbar: View Switcher + 4 Filters + Time Scales */}
      <div className="bg-white dark:bg-slate-900 rounded-md sm:rounded-xl border border-slate-200 dark:border-slate-800 p-1 md:p-2.5 shadow-xs space-y-1 md:space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <div className="min-w-0">
            <h2 className="text-[10px] sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-1 truncate">
              <GanttChart className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#0284c7] dark:text-[#90D5FF] shrink-0" />
              <span>Diagramme de Gantt & Arbre WBS</span>
            </h2>
          </div>

          {/* ONLY Diagramme de Gantt & Arbre WBS (Compact buttons) */}
          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md">
            <button
              onClick={() => setViewMode('gantt')}
              className={`flex items-center gap-1 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded text-[9px] sm:text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'gantt'
                  ? 'bg-[#0c4a6e] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <GanttChart className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>Gantt</span>
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`flex items-center gap-1 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded text-[9px] sm:text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'tree'
                  ? 'bg-[#0c4a6e] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <GitFork className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>Arbre WBS</span>
            </button>
          </div>
        </div>

        {/* 4 Ultra-Compact Filter Dropdowns: Axe, Projet, Phase, Responsable (Single row on mobile) */}
        <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/70 px-1 py-0.5 md:px-2 md:py-1 rounded border border-slate-200 dark:border-slate-700 h-5.5 md:h-auto">
            <Filter className="hidden md:block w-3 h-3 text-[#0284c7] shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="hidden md:block text-[8px] font-bold uppercase text-slate-400 leading-none">
                1. Axe
              </label>
              <select
                value={filterAxeId}
                onChange={e => {
                  setFilterAxeId(e.target.value);
                  setFilterProjectId('ALL');
                }}
                className="w-full bg-transparent text-[8px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate leading-none"
              >
                <option value="ALL">Axe ({axes.length})</option>
                {axes.map(ax => (
                  <option key={ax.id} value={ax.id}>
                    {ax.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/70 px-1 py-0.5 md:px-2 md:py-1 rounded border border-slate-200 dark:border-slate-700 h-5.5 md:h-auto">
            <FolderKanban className="hidden md:block w-3 h-3 text-[#0284c7] shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="hidden md:block text-[8px] font-bold uppercase text-slate-400 leading-none">
                2. Projet
              </label>
              <select
                value={filterProjectId}
                onChange={e => setFilterProjectId(e.target.value)}
                className="w-full bg-transparent text-[8px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate leading-none"
              >
                <option value="ALL">
                  Projet ({availableProjects.length})
                </option>
                {availableProjects.map(pr => (
                  <option key={pr.id} value={pr.id}>
                    {pr.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/70 px-1 py-0.5 md:px-2 md:py-1 rounded border border-slate-200 dark:border-slate-700 h-5.5 md:h-auto">
            <Layers className="hidden md:block w-3 h-3 text-[#0284c7] shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="hidden md:block text-[8px] font-bold uppercase text-slate-400 leading-none">
                3. Phase
              </label>
              <select
                value={filterPhase}
                onChange={e => setFilterPhase(e.target.value)}
                className="w-full bg-transparent text-[8px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate leading-none"
              >
                <option value="ALL">Phases (5)</option>
                {STANDARD_PHASES.map((ph, idx) => (
                  <option key={ph} value={ph}>
                    P{idx + 1}: {ph}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/70 px-1 py-0.5 md:px-2 md:py-1 rounded border border-slate-200 dark:border-slate-700 h-5.5 md:h-auto">
            <UserCheck className="hidden md:block w-3 h-3 text-[#0284c7] shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="hidden md:block text-[8px] font-bold uppercase text-slate-400 leading-none">
                4. Responsable
              </label>
              <select
                value={filterAssignee}
                onChange={e => setFilterAssignee(e.target.value)}
                className="w-full bg-transparent text-[8px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate leading-none"
              >
                <option value="ALL">
                  Resp. ({allAssignees.length})
                </option>
                {allAssignees.map(resp => (
                  <option key={resp} value={resp}>
                    {resp}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Ultra-Compact Time Scale Buttons & Zoom */}
        <div className="flex flex-wrap items-center justify-between gap-1 pt-0.5 border-t border-slate-100 dark:border-slate-800">
          {viewMode === 'gantt' ? (
            <div className="flex flex-wrap items-center gap-0.5 sm:gap-1">
              <span className="hidden sm:inline-flex text-[9px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mr-0.5 items-center gap-1">
                <Calendar className="w-2.5 h-2.5 text-[#0284c7]" /> Échelle :
              </span>
              {(
                [
                  { id: 'day', label: 'Jours' },
                  { id: 'week', label: 'Sem.' },
                  { id: 'month', label: 'Mois' },
                  { id: 'quarter', label: 'Trim.' },
                  { id: 'semester', label: 'Semestre' },
                  { id: 'year', label: 'Année' }
                ] as Array<{ id: GanttTimeScale; label: string }>
              ).map(scale => (
                <button
                  key={scale.id}
                  onClick={() => setTimeScale(scale.id)}
                  className={`px-1 py-0.5 sm:px-2 sm:py-0.5 rounded text-[8px] sm:text-[10px] font-bold transition-all cursor-pointer ${
                    timeScale === scale.id
                      ? 'bg-[#90D5FF] text-slate-950 shadow-xs font-black'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {scale.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate">
              Arborescence WBS : Axes → Projets → Phases → Activités & Jalons
            </div>
          )}

          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
            <button
              onClick={() => setZoom(z => Math.max(0.5, Number((z - 0.1).toFixed(2))))}
              className="p-0.5 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
              title="Zoom -"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[9px] sm:text-[10px] font-extrabold text-slate-800 dark:text-slate-200 min-w-[34px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(z => Math.min(1.6, Number((z + 0.1).toFixed(2))))}
              className="p-0.5 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
              title="Zoom +"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
              title="Réinitialiser"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: DIAGRAMME DE GANTT AVEC AXES, PROJETS ET PHASES DE PROJET */}
      {viewMode === 'gantt' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span className="w-3 h-2 rounded-xs bg-[#0c4a6e] inline-block" />
                Barre Récapitulative de Phase
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span className="w-3 h-2 rounded-xs bg-[#90D5FF] border border-[#0284c7] inline-block" />
                Période Prévue (Planification)
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span className="w-3 h-2 rounded-xs bg-emerald-500 inline-block" />
                Exécution Réelle (À temps / Terminé)
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span className="w-3 h-2 rounded-xs bg-amber-500 inline-block" />
                Exécution avec Retard
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rotate-45 bg-[#0c4a6e] dark:bg-[#90D5FF] inline-block" />
                Jalon (J)
              </span>
            </div>
            <span className="text-slate-500 dark:text-slate-400">
              {allFilteredTasks.length} élément(s) • 2 premières colonnes bloquées et réduites de moitié
            </span>
          </div>

          <div className="overflow-x-auto max-h-[72vh]">
            <div style={{ zoom }}>
              <table className="w-full border-collapse table-compact">
                <thead>
                  <tr className="bg-[#0c4a6e] text-white">
                    {/* Locked Col 1: Code (Half-width: 44px) */}
                    <th className="sticky left-0 z-30 bg-[#0c4a6e] w-11 min-w-[44px] max-w-[48px] text-left border-r border-sky-800 px-1.5 py-2 text-[9px] font-black uppercase">
                      Code
                    </th>
                    {/* Locked Col 2: Activité / Jalon (Half-width: 112px, full wrap) */}
                    <th className="sticky left-[44px] z-30 bg-[#0c4a6e] w-28 min-w-[112px] max-w-[124px] text-left border-r-2 border-[#90D5FF] px-1.5 py-2 text-[9px] font-black uppercase shadow-md">
                      Activité / Jalon
                    </th>
                    {/* Col 3: Responsable */}
                    <th className="w-20 min-w-[76px] text-left border-r border-sky-800 px-1.5 py-2 text-[9px] font-black uppercase">
                      Resp.
                    </th>
                    {/* Col 4: Durée */}
                    <th className="w-10 min-w-[40px] text-center border-r border-sky-800 px-1 py-2 text-[9px] font-black uppercase">
                      Durée
                    </th>
                    {/* Time Buckets */}
                    {timeBuckets.map(b => (
                      <th
                        key={b.key}
                        className="min-w-[34px] text-center border-r border-sky-800/70 px-1 py-1.5 text-[9px] font-extrabold"
                      >
                        <div className="leading-tight text-white">{b.label}</div>
                        {b.subLabel && (
                          <div className="text-[8px] font-normal text-[#90D5FF] leading-none mt-0.5">
                            {b.subLabel}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredAxes.map((axe, axeIdx) => {
                    const axeProjects = (axe.projects || []).filter(
                      pr => filterProjectId === 'ALL' || pr.id === filterProjectId
                    );
                    const totalCols = 4 + timeBuckets.length;

                    return (
                      <React.Fragment key={axe.id}>
                        {/* AXE STRATÉGIQUE ROW */}
                        <tr className="bg-[#082f49] text-white">
                          <td
                            colSpan={2}
                            className="sticky left-0 z-20 bg-[#082f49] border-r-2 border-[#90D5FF] px-2 py-1.5 font-black text-[10px] uppercase tracking-wider whitespace-normal break-words"
                          >
                            <span className="px-1.5 py-0.5 rounded bg-[#90D5FF] text-slate-950 font-mono text-[9px] mr-1.5">
                              AXE {axeIdx + 1}
                            </span>
                            {axe.name}
                          </td>
                          <td
                            colSpan={totalCols - 2}
                            className="px-2 py-1.5 text-[10px] font-bold text-[#90D5FF]"
                          >
                            {axeProjects.length} Projet(s) Opérationnel(s)
                          </td>
                        </tr>

                        {axeProjects.map((proj, projIdx) => {
                          const rawTasks = proj.tasks || [];
                          const phasesToDisplay =
                            filterPhase === 'ALL'
                              ? STANDARD_PHASES
                              : STANDARD_PHASES.filter(ph => ph === filterPhase);

                          return (
                            <React.Fragment key={proj.id}>
                              {/* PROJECT HEADER ROW */}
                              <tr className="bg-[#0c4a6e]/90 text-white">
                                <td
                                  colSpan={2}
                                  className="sticky left-0 z-20 bg-[#0c4a6e] border-r-2 border-[#90D5FF] px-2 py-1.5 font-extrabold text-[10px] whitespace-normal break-words"
                                >
                                  <span className="px-1.5 py-0.5 rounded bg-sky-200 text-slate-950 font-mono text-[8px] font-black mr-1">
                                    PRJ {axeIdx + 1}.{projIdx + 1}
                                  </span>
                                  {proj.name}
                                </td>
                                <td
                                  colSpan={totalCols - 2}
                                  className="px-2 py-1.5 text-[10px] font-semibold text-sky-100"
                                >
                                  Projet : {proj.name} ({rawTasks.length} tâche(s)/jalon(s))
                                </td>
                              </tr>

                              {/* PHASES INSIDE PROJECT */}
                              {phasesToDisplay.map(phaseName => {
                                const pIdx = STANDARD_PHASES.indexOf(phaseName);
                                const collapseKey = `${proj.id}__${phaseName}`;
                                const isCollapsed = Boolean(
                                  collapsedPhases[collapseKey]
                                );

                                const phaseTasksAll = rawTasks.filter(
                                  tk => tk.phase === phaseName
                                );
                                const phaseTasks = phaseTasksAll.filter(
                                  tk =>
                                    filterAssignee === 'ALL' ||
                                    (tk.assignee || '').trim() === filterAssignee
                                );

                                // Phase start & end dates for phase summary bar
                                const phaseStarts = phaseTasks
                                  .map(tk => tk.startDate)
                                  .filter(Boolean)
                                  .sort();
                                const phaseEnds = phaseTasks
                                  .map(tk => tk.endDate)
                                  .filter(Boolean)
                                  .sort();
                                const phaseMinStart = phaseStarts[0] || '';
                                const phaseMaxEnd =
                                  phaseEnds[phaseEnds.length - 1] || '';

                                return (
                                  <React.Fragment key={collapseKey}>
                                    {/* PHASE HEADER ROW IN GANTT */}
                                    <tr className="bg-sky-100 dark:bg-slate-800 border-y border-[#90D5FF] dark:border-sky-800">
                                      <td className="sticky left-0 z-20 bg-sky-100 dark:bg-slate-800 w-11 min-w-[44px] max-w-[48px] border-r border-sky-200 dark:border-slate-700 px-1 py-1 text-center">
                                        <button
                                          onClick={() =>
                                            togglePhaseCollapse(collapseKey)
                                          }
                                          className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-[#0c4a6e] text-[#90D5FF] font-mono text-[8px] font-black cursor-pointer"
                                          title="Plier / Déplier la phase"
                                        >
                                          {isCollapsed ? (
                                            <ChevronRight className="w-2.5 h-2.5" />
                                          ) : (
                                            <ChevronDown className="w-2.5 h-2.5" />
                                          )}
                                          P{pIdx + 1}
                                        </button>
                                      </td>
                                      <td
                                        onClick={() =>
                                          togglePhaseCollapse(collapseKey)
                                        }
                                        className="sticky left-[44px] z-20 bg-sky-100 dark:bg-slate-800 w-28 min-w-[112px] max-w-[124px] border-r-2 border-[#90D5FF] px-1.5 py-1 font-black text-[9px] uppercase text-[#0c4a6e] dark:text-[#90D5FF] whitespace-normal break-words cursor-pointer"
                                      >
                                        PHASE {pIdx + 1} : {phaseName} (
                                        {phaseTasks.length})
                                      </td>
                                      <td className="border-r border-sky-200 dark:border-slate-700 px-1.5 py-1 text-[8px] font-bold text-slate-600 dark:text-slate-300">
                                        Phase {pIdx + 1}
                                      </td>
                                      <td className="border-r border-sky-200 dark:border-slate-700 px-1 py-1 text-center font-mono text-[8px] font-black text-[#0c4a6e] dark:text-[#90D5FF]">
                                        {phaseTasks.length} élém.
                                      </td>
                                      {timeBuckets.map(bucket => {
                                        const isPhaseActive = overlapsBucket(
                                          phaseMinStart,
                                          phaseMaxEnd,
                                          bucket
                                        );
                                        return (
                                          <td
                                            key={bucket.key}
                                            className="border-r border-sky-200/50 dark:border-slate-700/50 px-0.5 py-1 align-middle"
                                          >
                                            {isPhaseActive && (
                                              <div
                                                className="w-full h-1.5 rounded-full bg-[#0c4a6e] dark:bg-[#90D5FF]/70"
                                                title={`Phase ${
                                                  pIdx + 1
                                                } (${phaseName}) : ${phaseMinStart} → ${phaseMaxEnd}`}
                                              />
                                            )}
                                          </td>
                                        );
                                      })}
                                    </tr>

                                    {/* TASKS & MILESTONES IN THIS PHASE */}
                                    {!isCollapsed &&
                                      phaseTasks.map(tk => {
                                        const tIdxInPhase =
                                          phaseTasksAll.findIndex(
                                            item => item.id === tk.id
                                          );
                                        const code = `${
                                          tk.type === 'jalon' ? 'J' : 'T'
                                        }.${pIdx + 1}.${tIdxInPhase + 1}`;
                                        const metrics = computeTaskMetrics(
                                          tk,
                                          todayISO
                                        );
                                        const isJalon = tk.type === 'jalon';
                                        const hasDelay = metrics.ecartFinDays > 0;

                                        return (
                                          <tr
                                            key={tk.id}
                                            className={`${
                                              isJalon
                                                ? 'bg-sky-50/40 dark:bg-slate-800/40'
                                                : 'bg-white dark:bg-slate-900'
                                            } hover:bg-sky-50/80 dark:hover:bg-slate-800/80 transition-colors`}
                                          >
                                            {/* Locked Col 1: Code */}
                                            <td
                                              className={`sticky left-0 z-20 w-11 min-w-[44px] max-w-[48px] border-r border-slate-200 dark:border-slate-800 px-1.5 py-1.5 align-top whitespace-normal break-words ${
                                                isJalon
                                                  ? 'bg-sky-50 dark:bg-slate-800'
                                                  : 'bg-white dark:bg-slate-900'
                                              }`}
                                            >
                                              <span
                                                className={`inline-block font-mono text-[9px] font-black px-1 py-0.5 rounded leading-tight ${
                                                  isJalon
                                                    ? 'bg-[#90D5FF] text-slate-950'
                                                    : 'bg-[#0c4a6e] text-white'
                                                }`}
                                              >
                                                {code}
                                              </span>
                                            </td>

                                            {/* Locked Col 2: Activité / Jalon (Half-width, full wrap, no truncation) */}
                                            <td
                                              className={`sticky left-[44px] z-20 w-28 min-w-[112px] max-w-[124px] border-r-2 border-[#90D5FF]/70 px-1.5 py-1.5 align-top whitespace-normal break-words shadow-xs ${
                                                isJalon
                                                  ? 'bg-sky-50 dark:bg-slate-800'
                                                  : 'bg-white dark:bg-slate-900'
                                              }`}
                                            >
                                              <div
                                                className={`text-[10px] leading-snug whitespace-normal break-words ${
                                                  isJalon
                                                    ? 'font-bold text-slate-700 dark:text-slate-200 italic'
                                                    : 'font-extrabold text-slate-900 dark:text-white'
                                                }`}
                                              >
                                                {isJalon
                                                  ? `◆ ${tk.name}`
                                                  : tk.name}
                                              </div>
                                            </td>

                                            {/* Col 3: Responsable */}
                                            <td className="w-20 min-w-[76px] border-r border-slate-200 dark:border-slate-800 px-1.5 py-1.5 align-top text-[9px] font-semibold text-slate-700 dark:text-slate-300 whitespace-normal break-words">
                                              {tk.assignee || '—'}
                                            </td>

                                            {/* Col 4: Durée */}
                                            <td className="w-10 min-w-[40px] border-r border-slate-200 dark:border-slate-800 px-1 py-1.5 text-center align-middle font-mono font-black text-[9px] text-[#0c4a6e] dark:text-[#90D5FF]">
                                              {metrics.plannedDurationLabel}
                                            </td>

                                            {/* Time Bucket Cells */}
                                            {timeBuckets.map(bucket => {
                                              const isPlanned = overlapsBucket(
                                                tk.startDate,
                                                tk.endDate,
                                                bucket
                                              );
                                              const isActual = overlapsBucket(
                                                tk.actualStartDate || '',
                                                tk.actualEndDate || '',
                                                bucket
                                              );

                                              return (
                                                <td
                                                  key={bucket.key}
                                                  className="border-r border-slate-100 dark:border-slate-800/60 px-0.5 py-1 align-middle text-center"
                                                >
                                                  <div className="flex flex-col gap-0.5 justify-center items-center min-h-[18px]">
                                                    {isPlanned && (
                                                      <div
                                                        className={`${
                                                          isJalon
                                                            ? 'h-2.5 w-2.5 rotate-45 bg-[#0c4a6e] dark:bg-[#90D5FF]'
                                                            : 'w-full h-2 rounded-xs bg-[#90D5FF] border border-[#0284c7]/50'
                                                        }`}
                                                        title={`Prévu : ${tk.startDate} → ${tk.endDate}`}
                                                      />
                                                    )}
                                                    {isActual && (
                                                      <div
                                                        className={`w-full h-1.5 rounded-xs ${
                                                          hasDelay
                                                            ? 'bg-amber-500'
                                                            : 'bg-emerald-500'
                                                        }`}
                                                        title={`Exécuté : ${
                                                          tk.actualStartDate || '?'
                                                        } → ${
                                                          tk.actualEndDate || '?'
                                                        }`}
                                                      />
                                                    )}
                                                  </div>
                                                </td>
                                              );
                                            })}
                                          </tr>
                                        );
                                      })}
                                  </React.Fragment>
                                );
                              })}
                            </React.Fragment>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: ARBRE WBS (AXES -> PROJETS -> 5 PHASES -> ACTIVITÉS & JALONS) */}
      {viewMode === 'tree' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm overflow-x-auto">
          <div style={{ zoom }} className="min-w-[680px] space-y-6">
            {filteredAxes.map((axe, aIdx) => {
              const axeProjects = (axe.projects || []).filter(
                p => filterProjectId === 'ALL' || p.id === filterProjectId
              );

              return (
                <div
                  key={axe.id}
                  className="rounded-xl border-2 border-[#0c4a6e] dark:border-[#90D5FF]/50 bg-slate-50/50 dark:bg-slate-900/50 p-4"
                >
                  {/* Level 1: Axe Stratégique */}
                  <div className="flex items-center justify-between gap-3 bg-[#0c4a6e] text-white px-4 py-2.5 rounded-lg shadow-xs">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#90D5FF] shrink-0" />
                      <span className="font-mono text-xs font-black bg-[#90D5FF] text-slate-950 px-2 py-0.5 rounded">
                        AXE {aIdx + 1}
                      </span>
                      <span className="font-black text-xs sm:text-sm uppercase tracking-tight">
                        {axe.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-[#90D5FF]">
                      {axeProjects.length} Projet(s)
                    </span>
                  </div>

                  {/* Level 2: Projets Opérationnels */}
                  <div className="mt-4 pl-4 sm:pl-6 border-l-2 border-[#90D5FF] space-y-4">
                    {axeProjects.map((proj, pIdx) => {
                      const rawTasks = proj.tasks || [];
                      const projTasks = rawTasks.filter(
                        t =>
                          (filterPhase === 'ALL' || t.phase === filterPhase) &&
                          (filterAssignee === 'ALL' ||
                            (t.assignee || '').trim() === filterAssignee)
                      );
                      const projBudget = projTasks.reduce(
                        (acc, t) => acc + (Number(t.budget) || 0),
                        0
                      );

                      const phasesToDisplay =
                        filterPhase === 'ALL'
                          ? STANDARD_PHASES
                          : STANDARD_PHASES.filter(ph => ph === filterPhase);

                      return (
                        <div
                          key={proj.id}
                          className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3 shadow-xs space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-black bg-sky-100 dark:bg-sky-950 text-[#0c4a6e] dark:text-[#90D5FF] px-2 py-0.5 rounded">
                                PRJ {aIdx + 1}.{pIdx + 1}
                              </span>
                              <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                                {proj.name}
                              </span>
                            </div>
                            <span className="text-[11px] font-black text-[#0284c7] dark:text-[#90D5FF]">
                              {formatCurrency(projBudget, currency, language)}
                            </span>
                          </div>

                          {/* Level 3: Phases de Projet */}
                          <div className="space-y-3 pl-3 border-l-2 border-sky-200 dark:border-slate-700">
                            {phasesToDisplay.map(phaseName => {
                              const phIdx = STANDARD_PHASES.indexOf(phaseName);
                              const phaseTasks = projTasks.filter(
                                tk => tk.phase === phaseName
                              );
                              if (phaseTasks.length === 0) return null;

                              return (
                                <div
                                  key={phaseName}
                                  className="rounded-lg bg-sky-50/40 dark:bg-slate-900/50 border border-sky-200/70 dark:border-slate-700 p-2.5 space-y-2"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-[#0c4a6e] dark:text-[#90D5FF]">
                                      PHASE {phIdx + 1} : {phaseName}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500">
                                      {phaseTasks.length} élément(s)
                                    </span>
                                  </div>

                                  {/* Level 4: Tasks & Milestones */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {phaseTasks.map((tk, tIdx) => {
                                      const metrics = computeTaskMetrics(
                                        tk,
                                        todayISO
                                      );
                                      return (
                                        <div
                                          key={tk.id}
                                          className={`rounded-lg border p-2.5 ${
                                            tk.type === 'jalon'
                                              ? 'border-[#90D5FF] bg-sky-50/80 dark:bg-sky-950/30'
                                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                                          }`}
                                        >
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="text-[11px] font-bold text-slate-900 dark:text-white">
                                              <span className="font-mono text-[10px] font-black text-[#0284c7] dark:text-[#90D5FF] mr-1.5">
                                                [
                                                {tk.type === 'jalon' ? 'J' : 'T'}.
                                                {phIdx + 1}.{tIdx + 1}]
                                              </span>
                                              {tk.name}
                                            </div>
                                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-[#90D5FF]/30 text-[#0c4a6e] dark:text-[#90D5FF] shrink-0">
                                              {metrics.effectiveStatus}
                                            </span>
                                          </div>
                                          <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-2">
                                            <span>Resp: {tk.assignee || '—'}</span>
                                            <span>•</span>
                                            <span>
                                              {tk.startDate} → {tk.endDate} (
                                              {metrics.plannedDurationLabel})
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
