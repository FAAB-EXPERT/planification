import React, { useState, useMemo } from 'react';
import {
  Calendar,
  ListChecks,
  Users,
  Filter,
  Briefcase,
  Layers,
  Trash2,
  ChevronDown,
  ChevronRight,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Plus,
  X
} from 'lucide-react';
import {
  Dossier,
  Task,
  CurrencyCode,
  LanguageCode
} from '../types';
import {
  STANDARD_PHASES,
  computeTaskMetrics,
  getTodayISO
} from '../pertUtils';
import { formatCurrency, convertFromFCFA, convertToFCFA } from '../i18n';

interface RaciMultiActorCellProps {
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
  isPrimary?: boolean;
  suggestions?: string[];
  datalistId: string;
}

const RaciMultiActorCell: React.FC<RaciMultiActorCellProps> = ({
  value,
  onChange,
  placeholder = 'Ajouter...',
  isPrimary = false,
  suggestions = [],
  datalistId
}) => {
  const [draft, setDraft] = useState('');
  const [pendingRemoveIdx, setPendingRemoveIdx] = useState<number | null>(null);

  const actors = useMemo(() => {
    if (!value || !value.trim()) return [];
    return value
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }, [value]);

  const handleAddActor = () => {
    const trimmed = draft.trim().replace(/,/g, '');
    if (!trimmed) return;
    const next = [...actors, trimmed];
    onChange(next.join(', '));
    setDraft('');
  };

  const handleRemoveActor = (indexToRemove: number) => {
    const next = actors.filter((_, idx) => idx !== indexToRemove);
    onChange(next.join(', '));
  };

  const handleEditActor = (indexToEdit: number, newName: string) => {
    const cleaned = newName.replace(/,/g, '');
    const next = actors.map((act, idx) => (idx === indexToEdit ? cleaned : act));
    onChange(next.filter(s => s.trim().length > 0).join(', '));
  };

  return (
    <div className="space-y-1">
      {/* Validation modal before removing a RACI actor */}
      {pendingRemoveIdx !== null && actors[pendingRemoveIdx] !== undefined && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 whitespace-normal">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-[#90D5FF] max-w-md w-full p-5 shadow-2xl space-y-4 text-left">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Validation de Suppression Requise
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  Confirmez-vous la suppression définitive du responsable «{' '}
                  <strong className="text-[#0c4a6e] dark:text-[#90D5FF]">
                    {actors[pendingRemoveIdx]}
                  </strong>{' '}
                  » ?
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPendingRemoveIdx(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  handleRemoveActor(pendingRemoveIdx);
                  setPendingRemoveIdx(null);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase cursor-pointer"
              >
                Valider la suppression
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing actors list */}
      {actors.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {actors.map((actor, idx) => (
            <div
              key={`${idx}-${actor}`}
              className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-bold border ${
                isPrimary
                  ? 'bg-[#0c4a6e]/10 dark:bg-sky-950/60 border-[#90D5FF] text-[#0c4a6e] dark:text-[#90D5FF]'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
              }`}
            >
              <input
                type="text"
                value={actor}
                onChange={e => handleEditActor(idx, e.target.value)}
                style={{ width: `${Math.max(actor.length + 1, 6)}ch` }}
                className="bg-transparent text-[9px] font-bold focus:outline-none min-w-[40px] max-w-[120px]"
              />
              <button
                type="button"
                onClick={() => setPendingRemoveIdx(idx)}
                className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                title="Retirer ce responsable"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new actor inline */}
      <div className="flex items-center gap-1">
        <input
          type="text"
          list={datalistId}
          value={draft}
          placeholder={placeholder}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddActor();
            }
          }}
          className="flex-1 min-w-[65px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[9px] font-semibold text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-[#90D5FF]"
        />
        <button
          type="button"
          onClick={handleAddActor}
          className="px-1.5 py-0.5 rounded bg-[#0c4a6e] hover:bg-[#075985] text-[#90D5FF] text-[9px] font-black flex items-center justify-center shrink-0 cursor-pointer"
          title="Ajouter un responsable"
        >
          <Plus className="w-2.5 h-2.5" />
        </button>
        {suggestions.length > 0 && (
          <datalist id={datalistId}>
            {suggestions.map(s => (
              <option key={s} value={s} />
            ))}
          </datalist>
        )}
      </div>
    </div>
  );
};

interface OperationalMatricesProps {
  mode: 'planification' | 'processus' | 'raci';
  dossier: Dossier;
  currency: CurrencyCode;
  language: LanguageCode;
  filterAxeId: string;
  setFilterAxeId: (id: string) => void;
  filterProjectId: string;
  setFilterProjectId: (id: string) => void;
  onAddAxe: () => void;
  onUpdateAxeName: (axeId: string, name: string) => void;
  onDeleteAxe: (axeId: string) => void;
  onAddProject: (axeId?: string) => void;
  onUpdateProjectName: (projectId: string, name: string) => void;
  onDeleteProject: (projectId: string) => void;
  onAddTaskInPhase: (
    projectId: string,
    phaseName: string,
    type: 'tache' | 'jalon'
  ) => void;
  onUpdateTask: (
    projectId: string,
    taskId: string,
    patch: Partial<Task>
  ) => void;
  onDeleteTask: (projectId: string, taskId: string) => void;
}

interface EnrichedTaskItem {
  task: Task;
  projectId: string;
  projectName: string;
  axeId: string;
  axeName: string;
  code: string;
  projectTaskOptions: Array<{ id: string; code: string; name: string }>;
}

export const OperationalMatrices: React.FC<OperationalMatricesProps> = ({
  mode,
  dossier,
  currency,
  language,
  filterAxeId,
  setFilterAxeId,
  filterProjectId,
  setFilterProjectId,
  onAddTaskInPhase,
  onUpdateTask,
  onDeleteTask
}) => {
  const [filterPhase, setFilterPhase] = useState<string>('ALL');
  const [filterAssignee, setFilterAssignee] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [collapsedPhases, setCollapsedPhases] = useState<Record<string, boolean>>({});
  const [pendingDelete, setPendingDelete] = useState<{
    projectId: string;
    taskId: string;
    taskName: string;
    code: string;
  } | null>(null);

  const todayISO = getTodayISO();
  const axes = dossier.axes || [];

  const filteredAxes = useMemo(() => {
    if (filterAxeId === 'ALL') return axes;
    return axes.filter(a => a.id === filterAxeId);
  }, [axes, filterAxeId]);

  const availableProjects = useMemo(() => {
    return filteredAxes.flatMap(a => a.projects || []);
  }, [filteredAxes]);

  const allAssignees = useMemo(() => {
    const set = new Set<string>();
    axes.forEach(ax => {
      (ax.projects || []).forEach(pr => {
        (pr.tasks || []).forEach(tk => {
          if (tk.assignee && tk.assignee.trim()) {
            tk.assignee
              .split(',')
              .map(s => s.trim())
              .filter(Boolean)
              .forEach(actor => set.add(actor));
          }
        });
      });
    });
    return Array.from(set).sort();
  }, [axes]);

  // Build consolidated list of tasks across filtered Axes and Projects, with consistent codes per project
  const allFilteredEnrichedTasks = useMemo<EnrichedTaskItem[]>(() => {
    const list: EnrichedTaskItem[] = [];

    filteredAxes.forEach(axe => {
      const axeProjects = (axe.projects || []).filter(
        p => filterProjectId === 'ALL' || p.id === filterProjectId
      );

      axeProjects.forEach(proj => {
        const rawTasks = proj.tasks || [];
        const codeMap = new Map<string, string>();
        const projectTaskOptions: Array<{ id: string; code: string; name: string }> = [];

        STANDARD_PHASES.forEach((pName, pIdx) => {
          const pTasks = rawTasks.filter(tk => tk.phase === pName);
          pTasks.forEach((tk, tIdx) => {
            const c = `${tk.type === 'jalon' ? 'J' : 'T'}.${pIdx + 1}.${tIdx + 1}`;
            codeMap.set(tk.id, c);
            projectTaskOptions.push({ id: tk.id, code: c, name: tk.name });
          });
        });

        rawTasks
          .filter(tk => !STANDARD_PHASES.includes(tk.phase))
          .forEach((tk, tIdx) => {
            const c = `${tk.type === 'jalon' ? 'J' : 'T'}.X.${tIdx + 1}`;
            codeMap.set(tk.id, c);
            projectTaskOptions.push({ id: tk.id, code: c, name: tk.name });
          });

        rawTasks.forEach(tk => {
          list.push({
            task: tk,
            projectId: proj.id,
            projectName: proj.name,
            axeId: axe.id,
            axeName: axe.name,
            code: codeMap.get(tk.id) || 'T.1.1',
            projectTaskOptions
          });
        });
      });
    });

    return list;
  }, [filteredAxes, filterProjectId]);

  const togglePhaseCollapse = (key: string) => {
    setCollapsedPhases(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Column count per mode:
  // Planification: 10 columns
  // Processus (Suivi des tâches): 12 columns
  // RACI: 6 columns
  const colSpanCount =
    mode === 'planification' ? 10 : mode === 'processus' ? 12 : 6;

  const phasesToDisplay =
    filterPhase === 'ALL'
      ? STANDARD_PHASES
      : STANDARD_PHASES.filter(ph => ph === filterPhase);

  // Target project when clicking "+" in a Phase header in Planification
  const defaultTargetProjectId = useMemo(() => {
    if (filterProjectId !== 'ALL') return filterProjectId;
    if (availableProjects.length > 0) return availableProjects[0].id;
    const anyProj = axes.flatMap(a => a.projects || [])[0];
    return anyProj ? anyProj.id : '';
  }, [filterProjectId, availableProjects, axes]);

  return (
    <div className="space-y-2 sm:space-y-3">
      {/* VALIDATION MODAL FOR DELETION IN PLANIFICATION */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-[#90D5FF] max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Validation de Suppression Requise
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  Confirmez-vous la suppression définitive de l’élément{' '}
                  <strong className="font-mono text-[#0c4a6e] dark:text-[#90D5FF]">
                    [{pendingDelete.code}]
                  </strong>{' '}
                  « <strong>{pendingDelete.taskName}</strong> » ?
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteTask(pendingDelete.projectId, pendingDelete.taskId);
                  setPendingDelete(null);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase cursor-pointer"
              >
                Valider la suppression
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ULTRA-COMPACT TOP FILTER BAR FOR MOBILE (PORTRAIT & LANDSCAPE) */}
      <div className="bg-white dark:bg-slate-900 rounded-md sm:rounded-xl border border-slate-200 dark:border-slate-800 p-1 md:p-2.5 shadow-xs space-y-1 md:space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[10px] sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-1 truncate">
            {mode === 'planification' && (
              <>
                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#0284c7] dark:text-[#90D5FF] shrink-0" />
                <span>Planification Macro</span>
              </>
            )}
            {mode === 'processus' && (
              <>
                <ListChecks className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#0284c7] dark:text-[#90D5FF] shrink-0" />
                <span>Suivi des Tâches & Écarts</span>
              </>
            )}
            {mode === 'raci' && (
              <>
                <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#0284c7] dark:text-[#90D5FF] shrink-0" />
                <span>Matrice RACI</span>
              </>
            )}
          </h2>
          <p className="hidden xl:block text-[10px] text-slate-500 dark:text-slate-400 truncate">
            {mode === 'planification' &&
              'Cliquez sur le Code pour basculer Tâche ⇄ Jalon.'}
            {mode === 'processus' &&
              'Seules Déb. Exéc et Fin Exéc sont modifiables.'}
            {mode === 'raci' &&
              'Ajoutez plusieurs responsables dans R, C et I (+). Autorité (A) unique.'}
          </p>
        </div>

        {/* 5 Ultra-Compact Filter Dropdowns (Reduced height & padding on mobile) */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 sm:gap-1.5">
          {/* 1. Axe */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-1 py-0.5 md:px-2 md:py-1 rounded border border-slate-200 dark:border-slate-700 h-5.5 md:h-auto">
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

          {/* 2. Projet */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-1 py-0.5 md:px-2 md:py-1 rounded border border-slate-200 dark:border-slate-700 h-5.5 md:h-auto">
            <Briefcase className="hidden md:block w-3 h-3 text-[#0284c7] shrink-0" />
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

          {/* 3. Phase de Projet */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-1 py-0.5 md:px-2 md:py-1 rounded border border-slate-200 dark:border-slate-700 h-5.5 md:h-auto">
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

          {/* 4. Responsable / Réalisateur */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-1 py-0.5 md:px-2 md:py-1 rounded border border-slate-200 dark:border-slate-700 h-5.5 md:h-auto">
            <UserCheck className="hidden md:block w-3 h-3 text-[#0284c7] shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="hidden md:block text-[8px] font-bold uppercase text-slate-400 leading-none">
                4. {mode === 'raci' ? 'Réalisateur' : 'Responsable'}
              </label>
              <select
                value={filterAssignee}
                onChange={e => setFilterAssignee(e.target.value)}
                className="w-full bg-transparent text-[8px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate leading-none"
              >
                <option value="ALL">
                  {mode === 'raci' ? 'Réal.' : 'Resp.'} ({allAssignees.length})
                </option>
                {allAssignees.map(resp => (
                  <option key={resp} value={resp}>
                    {resp}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. Statut */}
          <div className="col-span-2 sm:col-span-1 flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-1 py-0.5 md:px-2 md:py-1 rounded border border-slate-200 dark:border-slate-700 h-5.5 md:h-auto">
            <CheckCircle2 className="hidden md:block w-3 h-3 text-[#0284c7] shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="hidden md:block text-[8px] font-bold uppercase text-slate-400 leading-none">
                5. Statut
              </label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full bg-transparent text-[8px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate leading-none"
              >
                <option value="ALL">Statut : Tous</option>
                <option value="À faire">À Faire</option>
                <option value="En cours">En Cours</option>
                <option value="Bloqué">Bloqué</option>
                <option value="Terminé">Terminé</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* SINGLE UNIFIED TABLE PER TAB (First row + First 2 columns "Code" & "Activité / Jalon" locked/sticky!) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-auto max-h-[75vh] sm:max-h-[calc(100vh-185px)] relative">
          <table className="w-full min-w-[760px] border-separate border-spacing-0 table-compact">
            <thead className="sticky top-0 z-30">
              {mode === 'planification' && (
                <tr className="bg-[#0c4a6e] text-white">
                  {/* 1. Code (Locked Row 1 + Col 1) */}
                  <th
                    style={{ position: 'sticky', top: 0, left: 0 }}
                    className="sticky top-0 left-0 z-40 bg-[#0c4a6e] w-[48px] min-w-[48px] max-w-[48px] text-left border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    Code
                  </th>
                  {/* 2. Activité / Jalon (Locked Row 1 + Col 2) */}
                  <th
                    style={{ position: 'sticky', top: 0, left: 48 }}
                    className="sticky top-0 left-[48px] z-40 bg-[#0c4a6e] w-[116px] min-w-[116px] max-w-[116px] sm:w-[136px] sm:min-w-[136px] sm:max-w-[136px] text-left border-r-2 border-[#90D5FF] border-b-2 border-[#90D5FF] shadow-[3px_0_6px_rgba(0,0,0,0.28)]"
                  >
                    Activité / Jalon
                  </th>
                  {/* 3. Responsable */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-24 min-w-[84px] text-left border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    Responsable
                  </th>
                  {/* 4. Budget */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-24 min-w-[84px] text-right border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    Budget ({currency})
                  </th>
                  {/* 5. Mois */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-14 min-w-[50px] text-center border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    Mois
                  </th>
                  {/* 6. Antécéd. */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-20 min-w-[70px] text-center border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    Antécéd.
                  </th>
                  {/* 7. Déb. Prév */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-28 min-w-[100px] text-center border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    Déb. Prév
                  </th>
                  {/* 8. Fin Prév */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-28 min-w-[100px] text-center border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    Fin Prév
                  </th>
                  {/* 9. Durée */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-14 min-w-[48px] text-center border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    Durée
                  </th>
                  {/* 10. Actions */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-12 min-w-[44px] text-center border-b-2 border-[#90D5FF]"
                  >
                    Actions
                  </th>
                </tr>
              )}

              {mode === 'processus' && (
                <tr className="bg-[#0c4a6e] text-white">
                  {/* 1. Code (Locked Row 1 + Col 1) */}
                  <th
                    style={{ position: 'sticky', top: 0, left: 0 }}
                    className="sticky top-0 left-0 z-40 bg-[#0c4a6e] w-[48px] min-w-[48px] max-w-[48px] text-left border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    Code
                  </th>
                  {/* 2. Activité / Jalon (Locked Row 1 + Col 2) */}
                  <th
                    style={{ position: 'sticky', top: 0, left: 48 }}
                    className="sticky top-0 left-[48px] z-40 bg-[#0c4a6e] w-[116px] min-w-[116px] max-w-[116px] sm:w-[136px] sm:min-w-[136px] sm:max-w-[136px] text-left border-r-2 border-[#90D5FF] border-b-2 border-[#90D5FF] shadow-[3px_0_6px_rgba(0,0,0,0.28)]"
                  >
                    Activité / Jalon
                  </th>
                  {/* 3. Responsable */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-20 min-w-[76px] text-left border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    Responsable
                  </th>
                  {/* 4. Statut */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-24 min-w-[84px] text-center border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    Statut
                  </th>
                  {/* 5. Déb. Prév */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-20 min-w-[76px] text-center border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    Déb. Prév
                  </th>
                  {/* 6. Fin Prév */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-20 min-w-[76px] text-center border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    Fin Prév
                  </th>
                  {/* 7. Durée */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-12 min-w-[42px] text-center border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    Durée
                  </th>
                  {/* 8. Déb. Exéc */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-28 min-w-[98px] text-center border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    Déb. Exéc
                  </th>
                  {/* 9. Fin Exéc */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-28 min-w-[98px] text-center border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    Fin Exéc
                  </th>
                  {/* 10. Réel */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-12 min-w-[44px] text-center border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    Réel
                  </th>
                  {/* 11. Écart début */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-20 min-w-[72px] text-center border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    Écart début
                  </th>
                  {/* 12. Écart fin */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-20 min-w-[72px] text-center border-b-2 border-[#90D5FF]"
                  >
                    Écart fin
                  </th>
                </tr>
              )}

              {mode === 'raci' && (
                <tr className="bg-[#0c4a6e] text-white">
                  {/* 1. Code (Locked Row 1 + Col 1) */}
                  <th
                    style={{ position: 'sticky', top: 0, left: 0 }}
                    className="sticky top-0 left-0 z-40 bg-[#0c4a6e] w-[48px] min-w-[48px] max-w-[48px] text-left border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    Code
                  </th>
                  {/* 2. Activité / Jalon (Locked Row 1 + Col 2) */}
                  <th
                    style={{ position: 'sticky', top: 0, left: 48 }}
                    className="sticky top-0 left-[48px] z-40 bg-[#0c4a6e] w-[116px] min-w-[116px] max-w-[116px] sm:w-[136px] sm:min-w-[136px] sm:max-w-[136px] text-left border-r-2 border-[#90D5FF] border-b-2 border-[#90D5FF] shadow-[3px_0_6px_rgba(0,0,0,0.28)]"
                  >
                    Activité / Jalon
                  </th>
                  {/* 3. Réalisateur (R) = Responsable (Multiple allowed) */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 w-44 min-w-[140px] text-left border-r border-sky-800 border-b-2 border-[#90D5FF] bg-[#075985]"
                  >
                    Réalisateur (R) <span className="text-[8px] font-normal text-[#90D5FF]">(+ Responsables)</span>
                  </th>
                  {/* 4. Autorité (A) (Single authority only!) */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-36 min-w-[115px] text-left border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    Autorité (A) <span className="text-[8px] font-normal text-amber-300">(1 seule)</span>
                  </th>
                  {/* 5. Consulté (C) (Multiple allowed) */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-44 min-w-[140px] text-left border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    Consulté (C) <span className="text-[8px] font-normal text-[#90D5FF]">(+ Responsables)</span>
                  </th>
                  {/* 6. Informé (I) (Multiple allowed) */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-44 min-w-[140px] text-left border-b-2 border-[#90D5FF]"
                  >
                    Informé (I) <span className="text-[8px] font-normal text-[#90D5FF]">(+ Responsables)</span>
                  </th>
                </tr>
              )}
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {phasesToDisplay.map(phaseName => {
                const phaseIndex = STANDARD_PHASES.indexOf(phaseName) + 1;
                const collapseKey = `PHASE__${phaseName}`;
                const isCollapsed = Boolean(collapsedPhases[collapseKey]);

                const phaseItems = allFilteredEnrichedTasks
                  .filter(item => {
                    const tk = item.task;
                    const matchPhase = tk.phase === phaseName;
                    const matchAssignee =
                      filterAssignee === 'ALL' ||
                      (tk.assignee || '').includes(filterAssignee);
                    const effSt = computeTaskMetrics(tk, todayISO).effectiveStatus;
                    const matchStatus =
                      filterStatus === 'ALL' || effSt === filterStatus;
                    return matchPhase && matchAssignee && matchStatus;
                  })
                  .sort((a, b) => {
                    const d1 = a.task.startDate || '9999-12-31';
                    const d2 = b.task.startDate || '9999-12-31';
                    if (d1 !== d2) return d1.localeCompare(d2);
                    const e1 = a.task.endDate || '9999-12-31';
                    const e2 = b.task.endDate || '9999-12-31';
                    return e1.localeCompare(e2);
                  });

                const phaseBudgetFCFA = phaseItems.reduce(
                  (sum, item) => sum + (Number(item.task.budget) || 0),
                  0
                );

                return (
                  <React.Fragment key={collapseKey}>
                    {/* PHASE HEADER ROW */}
                    <tr className="bg-sky-100 dark:bg-slate-800 border-y border-[#90D5FF] dark:border-sky-800">
                      <td colSpan={colSpanCount} className="px-2.5 py-1 border-b border-[#90D5FF] dark:border-sky-800">
                        <div className="sticky left-2 inline-flex flex-wrap items-center justify-between gap-3 w-full max-w-[calc(100vw-2.5rem)]">
                          <button
                            onClick={() => togglePhaseCollapse(collapseKey)}
                            className="flex items-center gap-1.5 text-left cursor-pointer"
                          >
                            {isCollapsed ? (
                              <ChevronRight className="w-3.5 h-3.5 text-[#0c4a6e] dark:text-[#90D5FF]" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-[#0c4a6e] dark:text-[#90D5FF]" />
                            )}
                            <span className="px-1.5 py-0.5 rounded bg-[#0c4a6e] text-[#90D5FF] font-mono text-[8px] font-black uppercase">
                              PHASE {phaseIndex}
                            </span>
                            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#0c4a6e] dark:text-[#90D5FF]">
                              {phaseName}
                            </span>
                            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
                              ({phaseItems.length})
                            </span>
                          </button>

                          <div className="flex items-center gap-2">
                            {mode === 'planification' && (
                              <>
                                <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                                  Sous-total :{' '}
                                  {formatCurrency(
                                    phaseBudgetFCFA,
                                    currency,
                                    language
                                  )}
                                </span>
                                {defaultTargetProjectId && (
                                  <button
                                    onClick={() =>
                                      onAddTaskInPhase(
                                        defaultTargetProjectId,
                                        phaseName,
                                        'tache'
                                      )
                                    }
                                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-[#0c4a6e] hover:bg-[#075985] text-[#90D5FF] font-black text-xs sm:text-sm flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                                    title="Ajouter une activité ou un jalon dans cette phase"
                                  >
                                    +
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* PHASE TASKS & MILESTONES (ORDERED BY DATES) */}
                    {!isCollapsed &&
                      (phaseItems.length === 0 ? (
                        <tr>
                          <td
                            colSpan={colSpanCount}
                            className="py-2 text-center text-[10px] text-slate-400 italic bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800"
                          >
                            Aucun élément dans la phase « {phaseName} ».
                            {mode === 'planification' &&
                              ' Cliquez sur « + » pour en ajouter.'}
                          </td>
                        </tr>
                      ) : (
                        phaseItems.map(item => {
                          const {
                            task,
                            projectId,
                            code,
                            projectTaskOptions
                          } = item;
                          const isJalon = task.type === 'jalon';
                          const metrics = computeTaskMetrics(task, todayISO);
                          const startD = new Date(task.startDate);
                          const monthStr = !isNaN(startD.getTime())
                            ? startD.toLocaleString('fr-FR', {
                                month: 'short',
                                year: '2-digit'
                              })
                            : '—';

                          const otherProjectTasks = projectTaskOptions.filter(
                            o => o.id !== task.id
                          );

                          const stickyCellBg = isJalon
                            ? 'bg-[#f0f9ff] dark:bg-[#1e293b]'
                            : 'bg-white dark:bg-[#0f172a]';

                          // ==========================================
                          // ROW MODE 1 : PLANIFICATION (10 Columns)
                          // ==========================================
                          if (mode === 'planification') {
                            const displayedBudget = Math.round(
                              convertFromFCFA(task.budget || 0, currency)
                            );

                            return (
                              <tr
                                key={task.id}
                                className={`${
                                  isJalon
                                    ? 'bg-sky-50/40 dark:bg-slate-800/40'
                                    : 'bg-white dark:bg-slate-900'
                                } hover:bg-sky-50/70 dark:hover:bg-slate-800/70`}
                              >
                                {/* 1. Code (Locked Col 1 — click to switch Tache <-> Jalon) */}
                                <td
                                  style={{ position: 'sticky', left: 0 }}
                                  className={`sticky left-0 z-20 ${stickyCellBg} w-[48px] min-w-[48px] max-w-[48px] align-top border-r border-slate-200 dark:border-slate-800 border-b border-slate-200 dark:border-slate-800 whitespace-normal break-words`}
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onUpdateTask(projectId, task.id, {
                                        type: isJalon ? 'tache' : 'jalon',
                                        ...(isJalon
                                          ? {}
                                          : { endDate: task.startDate })
                                      })
                                    }
                                    className={`w-full text-center font-mono text-[9px] font-black px-1 py-1 rounded leading-tight cursor-pointer transition-transform active:scale-95 ${
                                      isJalon
                                        ? 'bg-[#90D5FF] text-slate-950'
                                        : 'bg-[#0c4a6e] text-white'
                                    }`}
                                    title="Cliquez sur le code pour convertir Tâche (T) ⇄ Jalon (J)"
                                  >
                                    {code}
                                  </button>
                                </td>

                                {/* 2. Activité / Jalon (Locked Col 2) */}
                                <td
                                  style={{ position: 'sticky', left: 48 }}
                                  className={`sticky left-[48px] z-20 ${stickyCellBg} w-[116px] min-w-[116px] max-w-[116px] sm:w-[136px] sm:min-w-[136px] sm:max-w-[136px] align-top border-r-2 border-[#0284c7] dark:border-[#90D5FF] border-b border-slate-200 dark:border-slate-800 shadow-[3px_0_6px_rgba(12,74,110,0.18)] whitespace-normal break-words`}
                                >
                                  <textarea
                                    rows={2}
                                    value={task.name}
                                    onChange={e =>
                                      onUpdateTask(projectId, task.id, {
                                        name: e.target.value
                                      })
                                    }
                                    className={`w-full bg-transparent text-[10px] leading-tight resize-y whitespace-normal break-words focus:outline-none focus:ring-1 focus:ring-[#90D5FF] rounded p-0.5 ${
                                      isJalon
                                        ? 'font-bold italic text-slate-700 dark:text-slate-200'
                                        : 'font-extrabold text-slate-900 dark:text-white'
                                    }`}
                                  />
                                </td>

                                {/* 3. Responsable (= Réalisateur R) */}
                                <td className="align-top border-r border-slate-200 dark:border-slate-800">
                                  <input
                                    type="text"
                                    value={task.assignee}
                                    onChange={e =>
                                      onUpdateTask(projectId, task.id, {
                                        assignee: e.target.value
                                      })
                                    }
                                    className="w-full bg-transparent text-[10px] font-semibold text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-[#90D5FF]"
                                  />
                                </td>

                                {/* 4. Budget */}
                                <td className="align-top border-r border-slate-200 dark:border-slate-800">
                                  <input
                                    type="number"
                                    value={displayedBudget}
                                    onChange={e =>
                                      onUpdateTask(projectId, task.id, {
                                        budget: convertToFCFA(
                                          Number(e.target.value),
                                          currency
                                        )
                                      })
                                    }
                                    className="w-full bg-transparent text-right font-mono text-[10px] font-bold text-slate-900 dark:text-white px-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-[#90D5FF]"
                                  />
                                </td>

                                {/* 5. Mois (Auto) */}
                                <td className="align-top text-center font-bold text-[10px] text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                                  {monthStr}
                                </td>

                                {/* 6. Antécéd. */}
                                <td className="align-top text-center border-r border-slate-200 dark:border-slate-800">
                                  <select
                                    value={task.antecedent || '—'}
                                    onChange={e =>
                                      onUpdateTask(projectId, task.id, {
                                        antecedent: e.target.value
                                      })
                                    }
                                    className="w-full bg-slate-50 dark:bg-slate-800 font-mono text-[10px] font-bold text-slate-800 dark:text-slate-200 rounded px-1 py-0.5"
                                  >
                                    <option value="—">—</option>
                                    {otherProjectTasks.map(opt => (
                                      <option key={opt.id} value={opt.id}>
                                        {opt.code}
                                      </option>
                                    ))}
                                  </select>
                                </td>

                                {/* 7. Déb. Prév */}
                                <td className="align-top text-center border-r border-slate-200 dark:border-slate-800">
                                  <input
                                    type="date"
                                    value={task.startDate}
                                    onChange={e =>
                                      onUpdateTask(projectId, task.id, {
                                        startDate: e.target.value,
                                        ...(isJalon
                                          ? { endDate: e.target.value }
                                          : {})
                                      })
                                    }
                                    className="bg-transparent text-[10px] font-semibold text-slate-800 dark:text-slate-200 rounded px-1 py-0.5"
                                  />
                                </td>

                                {/* 8. Fin Prév */}
                                <td className="align-top text-center border-r border-slate-200 dark:border-slate-800">
                                  <input
                                    type="date"
                                    value={task.endDate}
                                    onChange={e =>
                                      onUpdateTask(projectId, task.id, {
                                        endDate: e.target.value
                                      })
                                    }
                                    className="bg-transparent text-[10px] font-semibold text-slate-800 dark:text-slate-200 rounded px-1 py-0.5"
                                  />
                                </td>

                                {/* 9. Durée (Auto) */}
                                <td className="align-top text-center font-mono font-black text-[10px] text-[#0c4a6e] dark:text-[#90D5FF] border-r border-slate-200 dark:border-slate-800">
                                  {metrics.plannedDurationLabel}
                                </td>

                                {/* 10. Actions (Delete with Validation) */}
                                <td className="align-top text-center">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPendingDelete({
                                        projectId,
                                        taskId: task.id,
                                        taskName: task.name,
                                        code
                                      })
                                    }
                                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                    title="Supprimer (validation requise)"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          }

                          // ==========================================
                          // ROW MODE 2 : SUIVI DES TÂCHES (12 Columns — Read-Only except Déb. Exéc & Fin Exéc, No Add/Delete)
                          // ==========================================
                          if (mode === 'processus') {
                            const effStatus = metrics.effectiveStatus;

                            const statusBadgeClass =
                              effStatus === 'Terminé'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300'
                                : effStatus === 'En cours'
                                ? 'bg-sky-100 text-[#0c4a6e] dark:bg-sky-950/60 dark:text-[#90D5FF] border-[#90D5FF]'
                                : effStatus === 'Bloqué'
                                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border-amber-400'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300';

                            return (
                              <tr
                                key={task.id}
                                className={`${
                                  isJalon
                                    ? 'bg-sky-50/40 dark:bg-slate-800/40'
                                    : 'bg-white dark:bg-slate-900'
                                } hover:bg-sky-50/70 dark:hover:bg-slate-800/70`}
                              >
                                {/* 1. Code (Locked Col 1, Read-only) */}
                                <td
                                  style={{ position: 'sticky', left: 0 }}
                                  className={`sticky left-0 z-20 ${stickyCellBg} w-[48px] min-w-[48px] max-w-[48px] align-top border-r border-slate-200 dark:border-slate-800 border-b border-slate-200 dark:border-slate-800 whitespace-normal break-words`}
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

                                {/* 2. Activité / Jalon (Locked Col 2, Read-only) */}
                                <td
                                  style={{ position: 'sticky', left: 48 }}
                                  className={`sticky left-[48px] z-20 ${stickyCellBg} w-[116px] min-w-[116px] max-w-[116px] sm:w-[136px] sm:min-w-[136px] sm:max-w-[136px] align-top border-r-2 border-[#0284c7] dark:border-[#90D5FF] border-b border-slate-200 dark:border-slate-800 shadow-[3px_0_6px_rgba(12,74,110,0.18)] whitespace-normal break-words`}
                                >
                                  <div
                                    className={`text-[10px] leading-snug whitespace-normal break-words ${
                                      isJalon
                                        ? 'font-bold italic text-slate-700 dark:text-slate-200'
                                        : 'font-extrabold text-slate-900 dark:text-white'
                                    }`}
                                  >
                                    {isJalon ? `◆ ${task.name}` : task.name}
                                  </div>
                                </td>

                                {/* 3. Responsable (Read-only) */}
                                <td className="align-top border-r border-slate-200 dark:border-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300 whitespace-normal break-words">
                                  {task.assignee}
                                </td>

                                {/* 4. Statut (Read-only auto-calculated) */}
                                <td className="align-top text-center border-r border-slate-200 dark:border-slate-800">
                                  <span
                                    className={`inline-block px-1.5 py-0.5 rounded border text-[9px] font-black ${statusBadgeClass}`}
                                  >
                                    {effStatus}
                                  </span>
                                </td>

                                {/* 5. Déb. Prév (Read-only) */}
                                <td className="align-top text-center font-mono text-[10px] text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                                  {task.startDate}
                                </td>

                                {/* 6. Fin Prév (Read-only) */}
                                <td className="align-top text-center font-mono text-[10px] text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                                  {task.endDate}
                                </td>

                                {/* 7. Durée (Read-only) */}
                                <td className="align-top text-center font-mono font-bold text-[10px] text-[#0c4a6e] dark:text-[#90D5FF] border-r border-slate-200 dark:border-slate-800">
                                  {metrics.plannedDurationLabel}
                                </td>

                                {/* 8. Déb. Exéc (Editable) */}
                                <td className="align-top text-center border-r border-slate-200 dark:border-slate-800">
                                  <input
                                    type="date"
                                    value={task.actualStartDate || ''}
                                    onChange={e =>
                                      onUpdateTask(projectId, task.id, {
                                        actualStartDate: e.target.value
                                      })
                                    }
                                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-900 dark:text-white rounded px-1 py-0.5"
                                  />
                                </td>

                                {/* 9. Fin Exéc (Editable) */}
                                <td className="align-top text-center border-r border-slate-200 dark:border-slate-800">
                                  <input
                                    type="date"
                                    value={task.actualEndDate || ''}
                                    onChange={e =>
                                      onUpdateTask(projectId, task.id, {
                                        actualEndDate: e.target.value
                                      })
                                    }
                                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-900 dark:text-white rounded px-1 py-0.5"
                                  />
                                </td>

                                {/* 10. Réel (Auto) */}
                                <td className="align-top text-center font-mono font-bold text-[10px] text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800">
                                  {metrics.realDurationLabel}
                                </td>

                                {/* 11. Écart début (Auto) */}
                                <td className="align-top text-center border-r border-slate-200 dark:border-slate-800">
                                  <span
                                    className={`inline-block px-1.5 py-0.5 rounded font-mono text-[9px] font-bold ${
                                      metrics.ecartDebutDays > 0
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                        : metrics.ecartDebutDays < 0
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                        : 'text-slate-500'
                                    }`}
                                  >
                                    {metrics.ecartDebutLabel}
                                  </span>
                                </td>

                                {/* 12. Écart fin (Auto) */}
                                <td className="align-top text-center">
                                  <span
                                    className={`inline-block px-1.5 py-0.5 rounded font-mono text-[9px] font-bold ${
                                      metrics.ecartFinDays > 0
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                        : metrics.ecartFinDays < 0
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                        : 'text-slate-500'
                                    }`}
                                  >
                                    {metrics.ecartFinLabel}
                                  </span>
                                </td>
                              </tr>
                            );
                          }

                          // ==========================================
                          // ROW MODE 3 : MATRICE RACI (6 Columns — Sticky First 2 cols, Multi-actor add in R, C, I)
                          // ==========================================
                          return (
                            <tr
                              key={task.id}
                              className={`${
                                isJalon
                                  ? 'bg-sky-50/40 dark:bg-slate-800/40'
                                  : 'bg-white dark:bg-slate-900'
                              } hover:bg-sky-50/70 dark:hover:bg-slate-800/70`}
                            >
                              {/* 1. Code (Locked Col 1, Read-only) */}
                              <td
                                style={{ position: 'sticky', left: 0 }}
                                className={`sticky left-0 z-20 ${stickyCellBg} w-[48px] min-w-[48px] max-w-[48px] align-top border-r border-slate-200 dark:border-slate-800 border-b border-slate-200 dark:border-slate-800 whitespace-normal break-words`}
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

                              {/* 2. Activité / Jalon (Locked Col 2, Read-only) */}
                              <td
                                style={{ position: 'sticky', left: 48 }}
                                className={`sticky left-[48px] z-20 ${stickyCellBg} w-[116px] min-w-[116px] max-w-[116px] sm:w-[136px] sm:min-w-[136px] sm:max-w-[136px] align-top border-r-2 border-[#0284c7] dark:border-[#90D5FF] border-b border-slate-200 dark:border-slate-800 shadow-[3px_0_6px_rgba(12,74,110,0.18)] whitespace-normal break-words`}
                              >
                                <div
                                  className={`text-[10px] leading-snug whitespace-normal break-words ${
                                    isJalon
                                      ? 'font-bold italic text-slate-700 dark:text-slate-200'
                                      : 'font-extrabold text-slate-900 dark:text-white'
                                  }`}
                                >
                                  {isJalon ? `◆ ${task.name}` : task.name}
                                </div>
                              </td>

                              {/* 3. Réalisateur (R) = Responsable (Multi-actor addition in cell) */}
                              <td className="align-top border-r border-slate-200 dark:border-slate-800 bg-sky-50/30 dark:bg-sky-950/20">
                                <RaciMultiActorCell
                                  value={task.assignee || ''}
                                  isPrimary
                                  placeholder="+ Réalisateur (R)..."
                                  suggestions={allAssignees}
                                  datalistId={`raci-r-${task.id}`}
                                  onChange={newVal =>
                                    onUpdateTask(projectId, task.id, {
                                      assignee: newVal
                                    })
                                  }
                                />
                              </td>

                              {/* 4. Autorité (A) — STRICTLY 1 SINGLE AUTHORITY PER ACTION */}
                              <td className="align-top border-r border-slate-200 dark:border-slate-800">
                                <input
                                  type="text"
                                  value={
                                    task.autorite ??
                                    'Comité de Pilotage (COPIL)'
                                  }
                                  placeholder="1 seule Autorité (A)..."
                                  onChange={e => {
                                    const singleAuthority = e.target.value
                                      .split(/[,;/]+/)[0];
                                    onUpdateTask(projectId, task.id, {
                                      autorite: singleAuthority
                                    });
                                  }}
                                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-[#90D5FF]"
                                />
                              </td>

                              {/* 5. Consulté (C) — Multi-actor addition in cell */}
                              <td className="align-top border-r border-slate-200 dark:border-slate-800">
                                <RaciMultiActorCell
                                  value={task.consulte ?? 'Experts Techniques'}
                                  placeholder="+ Consulté (C)..."
                                  suggestions={allAssignees}
                                  datalistId={`raci-c-${task.id}`}
                                  onChange={newVal =>
                                    onUpdateTask(projectId, task.id, {
                                      consulte: newVal
                                    })
                                  }
                                />
                              </td>

                              {/* 6. Informé (I) — Multi-actor addition in cell */}
                              <td className="align-top">
                                <RaciMultiActorCell
                                  value={task.informe ?? 'Parties Prenantes'}
                                  placeholder="+ Informé (I)..."
                                  suggestions={allAssignees}
                                  datalistId={`raci-i-${task.id}`}
                                  onChange={newVal =>
                                    onUpdateTask(projectId, task.id, {
                                      informe: newVal
                                    })
                                  }
                                />
                              </td>
                            </tr>
                          );
                        })
                      ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
