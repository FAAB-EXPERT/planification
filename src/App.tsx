import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Menu,
  X,
  Home,
  LayoutDashboard,
  GanttChart,
  Kanban,
  FileText,
  Download,
  Upload,
  Plus,
  Trash2,
  FolderOpen,
  Sun,
  Moon,
  User,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Printer,
  Filter,
  Target,
  Briefcase,
  Layers,
  Award,
  DollarSign,
  TrendingUp,
  HelpCircle,
  Network,
  Calendar,
  ListChecks,
  FileSpreadsheet,
  Save,
  Users
} from 'lucide-react';
import {
  CurrencyCode,
  LanguageCode,
  ThemeMode,
  UserProfile,
  Dossier,
  Axe,
  Project,
  Task,
  CustomDocsMap,
  CustomDocFields,
  InstitutionalDocType
} from './types';
import {
  defaultUserProfile,
  defaultCustomDocsData,
  initialDossiers,
  loadAppStateFromIDB,
  saveAppStateToIDB
} from './db';
import { translations, formatCurrency } from './i18n';
import { generateDirectWhitePDF } from './pdfExport';
import {
  STANDARD_PHASES,
  getTodayISO,
  computeTaskMetrics,
  recalculateProjectTasksOnKanbanMove,
  computeDossierPertSummary
} from './pertUtils';
import { AppLogo } from './components/AppLogo';
import { LandingPage } from './components/LandingPage';
import { GanttAndTreeView } from './components/GanttAndTreeView';
import { FicheTechniquePages } from './components/FicheTechniquePages';
import { DocumentGeneratorView } from './components/DocumentGeneratorView';
import { OperationalMatrices } from './components/OperationalMatrices';
import {
  UserProfileView,
  DossiersAndProjectsView
} from './components/UserProfileAndDossiersView';

export function App() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>(defaultUserProfile);
  const [dossiers, setDossiers] = useState<Dossier[]>(initialDossiers);
  const [activeDossierId, setActiveDossierId] = useState<string>(
    initialDossiers[0].id
  );
  const [language, setLanguage] = useState<LanguageCode>('FR');
  const [currency, setCurrency] = useState<CurrencyCode>('FCFA');
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [lastJsonFileName, setLastJsonFileName] = useState<string>(
    'faab_plan_sauvegarde.json'
  );
  const [activeTab, setActiveTab] = useState<string>('accueil');
  const [customDocsData, setCustomDocsData] =
    useState<CustomDocsMap>(defaultCustomDocsData);

  // Slidebar & UI states
  const [isSlidebarOpen, setIsSlidebarOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [filterAxeId, setFilterAxeId] = useState<string>('ALL');
  const [filterProjectId, setFilterProjectId] = useState<string>('ALL');

  // PERT View & Zoom (down to 10% = 0.10)
  const [pertZoom, setPertZoom] = useState<number>(1);
  const [pertViewMode, setPertViewMode] = useState<'graph' | 'table'>('graph');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileHandleRef = useRef<any>(null);

  // Hydrate from IndexedDB on mount
  useEffect(() => {
    loadAppStateFromIDB().then(saved => {
      if (saved) {
        if (saved.userProfile) setUserProfile(saved.userProfile);
        if (Array.isArray(saved.dossiers) && saved.dossiers.length > 0) {
          setDossiers(saved.dossiers);
        }
        if (saved.activeDossierId) setActiveDossierId(saved.activeDossierId);
        if (saved.language) setLanguage(saved.language);
        if (saved.currency) setCurrency(saved.currency);
        if (saved.theme) setTheme(saved.theme);
        if (saved.lastJsonFileName) setLastJsonFileName(saved.lastJsonFileName);
        if (saved.activeTab) setActiveTab(saved.activeTab);
        if (saved.customDocsData) {
          setCustomDocsData({
            ...defaultCustomDocsData,
            ...saved.customDocsData
          });
        }
      }
      setIsHydrated(true);
    });
  }, []);

  // Auto-persist to IndexedDB & sync dark mode
  useEffect(() => {
    if (!isHydrated) return;
    saveAppStateToIDB({
      userProfile,
      dossiers,
      activeDossierId,
      language,
      currency,
      theme,
      lastJsonFileName,
      activeTab,
      customDocsData
    });
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [
    isHydrated,
    userProfile,
    dossiers,
    activeDossierId,
    language,
    currency,
    theme,
    lastJsonFileName,
    activeTab,
    customDocsData
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const activeDossier = useMemo<Dossier>(() => {
    return dossiers.find(d => d.id === activeDossierId) || dossiers[0];
  }, [dossiers, activeDossierId]);

  const todayISO = getTodayISO();
  const t = translations[language] || translations.FR;

  // Filtered Axes & Projects for operational views
  const filteredAxes = useMemo<Axe[]>(() => {
    const axes = activeDossier.axes || [];
    if (filterAxeId === 'ALL') return axes;
    return axes.filter(a => a.id === filterAxeId);
  }, [activeDossier, filterAxeId]);

  const availableProjectsInFilter = useMemo<Project[]>(() => {
    return filteredAxes.flatMap(a => a.projects || []);
  }, [filteredAxes]);

  const filteredProjects = useMemo<Project[]>(() => {
    if (filterProjectId === 'ALL') return availableProjectsInFilter;
    return availableProjectsInFilter.filter(p => p.id === filterProjectId);
  }, [availableProjectsInFilter, filterProjectId]);

  // Flatten tasks with codes & metrics for Dashboard & Kanban
  const flatTaskRows = useMemo(() => {
    const list: Array<{
      axeId: string;
      axeName: string;
      projectId: string;
      projectName: string;
      task: Task;
      code: string;
      antecedentCode: string;
      allProjectTasks: Array<{ id: string; code: string; name: string }>;
      metrics: ReturnType<typeof computeTaskMetrics>;
    }> = [];

    filteredAxes.forEach(axe => {
      (axe.projects || [])
        .filter(pr => filterProjectId === 'ALL' || pr.id === filterProjectId)
        .forEach(proj => {
          const rawTasks = proj.tasks || [];
          const codeMap = new Map<string, string>();
          const projectTaskOptions: Array<{
            id: string;
            code: string;
            name: string;
          }> = [];

          STANDARD_PHASES.forEach((pName, pIdx) => {
            const pTasks = rawTasks.filter(tk => tk.phase === pName);
            pTasks.forEach((tk, tIdx) => {
              const c = `${tk.type === 'jalon' ? 'J' : 'T'}.${pIdx + 1}.${
                tIdx + 1
              }`;
              codeMap.set(tk.id, c);
              projectTaskOptions.push({ id: tk.id, code: c, name: tk.name });
            });
          });

          rawTasks.forEach((tk, idx) => {
            const code =
              codeMap.get(tk.id) ||
              `${tk.type === 'jalon' ? 'J' : 'T'}.1.${idx + 1}`;
            const antCode =
              tk.antecedent && tk.antecedent !== '—'
                ? codeMap.get(tk.antecedent) || tk.antecedent
                : '—';
            const metrics = computeTaskMetrics(tk, todayISO);
            list.push({
              axeId: axe.id,
              axeName: axe.name,
              projectId: proj.id,
              projectName: proj.name,
              task: tk,
              code,
              antecedentCode: antCode,
              allProjectTasks: projectTaskOptions.filter(o => o.id !== tk.id),
              metrics
            });
          });
        });
    });

    return list;
  }, [filteredAxes, filterProjectId, todayISO]);

  // Global Dossier KPIs
  const allDossierTasks = useMemo(() => {
    return (activeDossier.axes || []).flatMap(a =>
      (a.projects || []).flatMap(p => p.tasks || [])
    );
  }, [activeDossier]);

  const totalBudgetFCFA = useMemo(
    () => allDossierTasks.reduce((acc, tk) => acc + (Number(tk.budget) || 0), 0),
    [allDossierTasks]
  );

  const statusCounts = useMemo(() => {
    const counts = {
      Terminé: 0,
      'En cours': 0,
      'À faire': 0,
      Bloqué: 0
    };
    allDossierTasks.forEach(tk => {
      const st = computeTaskMetrics(tk, todayISO).effectiveStatus;
      counts[st] = (counts[st] || 0) + 1;
    });
    return counts;
  }, [allDossierTasks, todayISO]);

  const completionPct =
    allDossierTasks.length > 0
      ? Math.round((statusCounts.Terminé / allDossierTasks.length) * 100)
      : 0;

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <AppLogo className="w-24 h-24 animate-pulse" />
          <p className="text-xs font-bold tracking-widest uppercase text-[#90D5FF]">
            Hydratation IndexedDB FAAB PLAN en cours...
          </p>
        </div>
      </div>
    );
  }

  const navigateTo = (tab: string) => {
    setActiveTab(tab);
    setIsSlidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // JSON Save / Overwrite or Export
  const handleSaveOrExportJSON = async () => {
    const payload = {
      userProfile,
      dossiers,
      activeDossierId,
      language,
      currency,
      theme,
      lastJsonFileName,
      activeTab,
      customDocsData
    };
    const jsonString = JSON.stringify(payload, null, 2);

    try {
      if (fileHandleRef.current) {
        const writable = await fileHandleRef.current.createWritable();
        await writable.write(jsonString);
        await writable.close();
        showToast(`Fichier JSON mis à jour directement : ${lastJsonFileName}`);
        return;
      }
      if ('showSaveFilePicker' in window) {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: lastJsonFileName || 'faab_plan_sauvegarde.json',
          types: [
            {
              description: 'Fichier JSON FAAB PLAN',
              accept: { 'application/json': ['.json'] }
            }
          ]
        });
        fileHandleRef.current = handle;
        const writable = await handle.createWritable();
        await writable.write(jsonString);
        await writable.close();
        setLastJsonFileName(handle.name);
        showToast(`Sauvegardé dans : ${handle.name}`);
        return;
      }
    } catch {
      // Fallback to standard download if inside iframe or user cancels picker
    }

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const filename =
      lastJsonFileName ||
      `FAAB-PLAN-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
        now.getDate()
      )}.json`;

    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setLastJsonFileName(filename);
    showToast(`Sauvegarde JSON téléchargée : ${filename}`);
  };

  // JSON Import
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed && Array.isArray(parsed.dossiers)) {
          setDossiers(parsed.dossiers);
          if (parsed.activeDossierId) setActiveDossierId(parsed.activeDossierId);
          if (parsed.userProfile) setUserProfile(parsed.userProfile);
          if (parsed.currency) setCurrency(parsed.currency);
          if (parsed.language) setLanguage(parsed.language);
          if (parsed.customDocsData) {
            setCustomDocsData({
              ...defaultCustomDocsData,
              ...parsed.customDocsData
            });
          }
          setLastJsonFileName(file.name);
          showToast(`Portefeuille restauré depuis : ${file.name}`);
        } else {
          showToast('Fichier JSON non reconnu.');
        }
      } catch {
        showToast('Erreur de lecture du fichier JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Dossier / Axe / Project / Task mutations
  const updateActiveDossier = (updater: (d: Dossier) => Dossier) => {
    setDossiers(prev =>
      prev.map(d => (d.id === activeDossier.id ? updater(d) : d))
    );
  };

  const createDossierDirect = (
    name: string,
    desc: string,
    horizon: string = '2026-2030'
  ) => {
    const newId = `dossier-${Date.now()}`;
    const newDossier: Dossier = {
      id: newId,
      name,
      horizonPlan: horizon,
      psdYear: new Date().getFullYear(),
      horizonYears: 5,
      type: 'Portefeuille Stratégique',
      institution: userProfile.institution || 'Organisation',
      description:
        desc || 'Portefeuille de projets planifié et suivi dans FAAB PLAN.',
      axes: [
        {
          id: `axe-${Date.now()}`,
          name: 'Axe 1 : Orientation Stratégique Principale',
          projects: [
            {
              id: `proj-${Date.now()}`,
              name: 'Projet 1.1 : Projet Opérationnel Pilote',
              tasks: [
                {
                  id: `task-${Date.now()}`,
                  type: 'tache',
                  phase: 'AVANT PROJET',
                  name: 'Cadrage initial et lancement opérationnel',
                  startDate: todayISO,
                  endDate: todayISO,
                  status: 'En cours',
                  assignee: userProfile.fullName || 'Chef de Projet',
                  autorite: 'Comité de Pilotage (COPIL)',
                  consulte: 'Experts Techniques',
                  informe: 'Parties Prenantes',
                  budget: 5000000,
                  antecedent: '—'
                }
              ]
            }
          ]
        }
      ]
    };

    setDossiers(prev => [...prev, newDossier]);
    setActiveDossierId(newId);
    setFilterAxeId('ALL');
    setFilterProjectId('ALL');
    showToast(`Nouveau dossier "${newDossier.name}" créé et activé.`);
  };

  const handleDeleteDossier = (id: string) => {
    if (dossiers.length <= 1) {
      showToast('Impossible de supprimer le dernier dossier.');
      return;
    }
    const remaining = dossiers.filter(d => d.id !== id);
    setDossiers(remaining);
    if (activeDossierId === id) {
      setActiveDossierId(remaining[0].id);
    }
    showToast('Dossier supprimé.');
  };

  const handleAddAxe = () => {
    const nextNum = (activeDossier.axes || []).length + 1;
    const newAxe: Axe = {
      id: `axe-${Date.now()}`,
      name: `Axe ${nextNum} : Nouvel Axe Stratégique`,
      projects: [
        {
          id: `proj-${Date.now()}`,
          name: `Projet ${nextNum}.1 : Nouveau Projet Opérationnel`,
          tasks: []
        }
      ]
    };
    updateActiveDossier(d => ({
      ...d,
      axes: [...(d.axes || []), newAxe]
    }));
    showToast(`Nouvel Axe ${nextNum} ajouté.`);
  };

  const handleUpdateAxeName = (axeId: string, name: string) => {
    updateActiveDossier(d => ({
      ...d,
      axes: (d.axes || []).map(a => (a.id === axeId ? { ...a, name } : a))
    }));
  };

  const handleDeleteAxe = (axeId: string) => {
    if ((activeDossier.axes || []).length <= 1) {
      showToast('Le dossier doit conserver au moins un Axe Stratégique.');
      return;
    }
    updateActiveDossier(d => ({
      ...d,
      axes: (d.axes || []).filter(a => a.id !== axeId)
    }));
    if (filterAxeId === axeId) setFilterAxeId('ALL');
    showToast('Axe supprimé.');
  };

  const handleAddProject = (targetAxeId?: string) => {
    const targetAxe = targetAxeId
      ? (activeDossier.axes || []).find(a => a.id === targetAxeId)
      : filterAxeId !== 'ALL'
      ? (activeDossier.axes || []).find(a => a.id === filterAxeId)
      : (activeDossier.axes || [])[0];
    if (!targetAxe) {
      handleAddAxe();
      return;
    }
    const nextNum = (targetAxe.projects || []).length + 1;
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      name: `Projet ${nextNum} : Nouveau Projet Opérationnel`,
      tasks: []
    };
    updateActiveDossier(d => ({
      ...d,
      axes: (d.axes || []).map(a =>
        a.id === targetAxe.id
          ? { ...a, projects: [...(a.projects || []), newProj] }
          : a
      )
    }));
    showToast(`Projet ajouté dans ${targetAxe.name}.`);
  };

  const handleUpdateProjectName = (projectId: string, name: string) => {
    updateActiveDossier(d => ({
      ...d,
      axes: (d.axes || []).map(a => ({
        ...a,
        projects: (a.projects || []).map(p =>
          p.id === projectId ? { ...p, name } : p
        )
      }))
    }));
  };

  const handleDeleteProject = (projectId: string) => {
    updateActiveDossier(d => ({
      ...d,
      axes: (d.axes || []).map(a => ({
        ...a,
        projects: (a.projects || []).filter(p => p.id !== projectId)
      }))
    }));
    if (filterProjectId === projectId) setFilterProjectId('ALL');
    showToast('Projet supprimé.');
  };

  const handleAddTaskInPhase = (
    projectId: string,
    phaseName: string,
    type: 'tache' | 'jalon' = 'tache'
  ) => {
    const newTask: Task = {
      id: `tk-${Date.now()}`,
      type,
      phase: phaseName,
      name:
        type === 'jalon'
          ? `Nouveau Jalon (${phaseName})`
          : `Nouvelle Activité (${phaseName})`,
      startDate: todayISO,
      endDate: todayISO,
      actualStartDate: '',
      actualEndDate: '',
      status: 'À faire',
      assignee: userProfile.fullName || 'Responsable',
      autorite: 'Comité de Pilotage (COPIL)',
      consulte: 'Experts Techniques',
      informe: 'Parties Prenantes',
      budget: type === 'jalon' ? 0 : 2500000,
      antecedent: '—'
    };

    updateActiveDossier(d => ({
      ...d,
      axes: (d.axes || []).map(a => ({
        ...a,
        projects: (a.projects || []).map(p =>
          p.id === projectId
            ? { ...p, tasks: [...(p.tasks || []), newTask] }
            : p
        )
      }))
    }));
    showToast(
      `${type === 'jalon' ? 'Jalon' : 'Activité'} ajouté(e) dans la phase « ${phaseName} ».`
    );
  };

  const handleAddTask = (type: 'tache' | 'jalon' = 'tache') => {
    const targetProj =
      filterProjectId !== 'ALL'
        ? availableProjectsInFilter.find(p => p.id === filterProjectId)
        : availableProjectsInFilter[0];
    if (!targetProj) {
      showToast("Veuillez d'abord créer un Projet.");
      return;
    }
    handleAddTaskInPhase(targetProj.id, 'PLANIFICATION', type);
  };

  const handleUpdateTask = (
    projectId: string,
    taskId: string,
    patch: Partial<Task>
  ) => {
    updateActiveDossier(d => ({
      ...d,
      axes: (d.axes || []).map(a => ({
        ...a,
        projects: (a.projects || []).map(p =>
          p.id === projectId
            ? {
                ...p,
                tasks: (p.tasks || []).map(tk =>
                  tk.id === taskId ? { ...tk, ...patch } : tk
                )
              }
            : p
        )
      }))
    }));
  };

  const handleDeleteTask = (projectId: string, taskId: string) => {
    updateActiveDossier(d => ({
      ...d,
      axes: (d.axes || []).map(a => ({
        ...a,
        projects: (a.projects || []).map(p =>
          p.id === projectId
            ? {
                ...p,
                tasks: (p.tasks || []).filter(tk => tk.id !== taskId)
              }
            : p
        )
      }))
    }));
  };

  const handleMoveTaskInKanban = (
    projectId: string,
    taskId: string,
    newStatus: Task['status']
  ) => {
    updateActiveDossier(d => ({
      ...d,
      axes: (d.axes || []).map(a => ({
        ...a,
        projects: (a.projects || []).map(p => {
          if (p.id !== projectId) return p;
          const updatedTasks = recalculateProjectTasksOnKanbanMove(
            p.tasks || [],
            taskId,
            newStatus,
            todayISO
          );
          return { ...p, tasks: updatedTasks };
        })
      }))
    }));
    showToast(
      `Statut changé vers "${newStatus}" (dates prévues recalculées automatiquement).`
    );
  };

  // Document generator field handlers
  const handleUpdateDocField = (
    docType: InstitutionalDocType,
    fieldKey: keyof CustomDocFields,
    value: string
  ) => {
    const isSharedImageKey =
      fieldKey === 'leftLogoDataUrl' ||
      fieldKey === 'rightLogoDataUrl' ||
      fieldKey === 'bannerImageDataUrl' ||
      fieldKey === 'figureImageDataUrl' ||
      fieldKey === 'orgStampDataUrl' ||
      fieldKey === 'partnerStampDataUrl';

    setCustomDocsData(prev => {
      if (isSharedImageKey && value === '') {
        const cleaned = { ...prev };
        (Object.keys(cleaned) as InstitutionalDocType[]).forEach(k => {
          if (cleaned[k]) {
            cleaned[k] = { ...cleaned[k], [fieldKey]: '' };
          }
        });
        return cleaned;
      }
      return {
        ...prev,
        [docType]: {
          ...(prev[docType] || defaultCustomDocsData[docType]),
          [fieldKey]: value
        }
      };
    });
  };

  const handleResetDocDefaults = (docType: InstitutionalDocType) => {
    setCustomDocsData(prev => {
      const existing = prev[docType];
      return {
        ...prev,
        [docType]: {
          ...defaultCustomDocsData[docType],
          leftLogoDataUrl: existing?.leftLogoDataUrl,
          rightLogoDataUrl: existing?.rightLogoDataUrl,
          bannerImageDataUrl: existing?.bannerImageDataUrl,
          figureImageDataUrl: existing?.figureImageDataUrl,
          orgStampDataUrl: existing?.orgStampDataUrl,
          partnerStampDataUrl: existing?.partnerStampDataUrl
        }
      };
    });
    showToast('Champs synchronisés avec les données des autres onglets.');
  };

  // Shared Macro Filter Bar (Ultra-compact on mobile portrait & landscape — Filters ONLY)
  const renderMacroFilterBar = () => (
    <div className="bg-white dark:bg-slate-900 rounded-md sm:rounded-xl border border-slate-200 dark:border-slate-800 p-1 md:p-2.5 shadow-xs mb-1.5 sm:mb-3">
      <div className="grid grid-cols-2 gap-1 sm:gap-2 items-center">
        <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-1.5 py-0.5 md:px-2.5 md:py-1 rounded border border-slate-200 dark:border-slate-700 h-6 md:h-auto">
          <Filter className="hidden sm:block w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#0284c7] dark:text-[#90D5FF] shrink-0" />
          <div className="flex-1 min-w-0">
            <label className="hidden md:block text-[8px] font-bold uppercase text-slate-400 leading-none">
              1. Axe Stratégique
            </label>
            <select
              value={filterAxeId}
              onChange={e => {
                setFilterAxeId(e.target.value);
                setFilterProjectId('ALL');
              }}
              className="w-full bg-transparent text-[8.5px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate leading-none"
            >
              <option value="ALL">
                Axe : Tous ({(activeDossier.axes || []).length})
              </option>
              {(activeDossier.axes || []).map(ax => (
                <option key={ax.id} value={ax.id}>
                  {ax.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-1.5 py-0.5 md:px-2.5 md:py-1 rounded border border-slate-200 dark:border-slate-700 h-6 md:h-auto">
          <Briefcase className="hidden sm:block w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#0284c7] dark:text-[#90D5FF] shrink-0" />
          <div className="flex-1 min-w-0">
            <label className="hidden md:block text-[8px] font-bold uppercase text-slate-400 leading-none">
              2. Projet Opérationnel
            </label>
            <select
              value={filterProjectId}
              onChange={e => setFilterProjectId(e.target.value)}
              className="w-full bg-transparent text-[8.5px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate leading-none"
            >
              <option value="ALL">
                Projet : Tous ({availableProjectsInFilter.length})
              </option>
              {availableProjectsInFilter.map(pr => (
                <option key={pr.id} value={pr.id}>
                  {pr.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // SLIDEBAR MENU (Burger ☰) — Portefeuille / Dossier selector ONLY + Ordered Tabs
  // ============================================================================
  const renderSlidebar = () => {
    if (!isSlidebarOpen) return null;

    // Reorganized into the exact 4 groups with spacing between groups:
    // Group 1: Accueil & Présentation, Profil Utilisateur
    // Group 2: Dossiers & Projets, Fiche Technique & Résumé Exécutif, Générateur de Documents
    // Group 3: Tableau de Bord Décisionnel, Réseau PERT, Tableau Kanban Interactif, Diagramme de Gantt & Arbre
    // Group 4: Planification, Suivi des tâches, RACI
    const navGroups: Array<
      Array<{
        id: string;
        label: string;
        icon: React.ReactNode;
        badge?: string;
      }>
    > = [
      [
        { id: 'accueil', label: t.nav.accueil, icon: <Home className="w-4 h-4" /> },
        {
          id: 'profil',
          label: t.nav.profil,
          icon: <User className="w-4 h-4" />
        }
      ],
      [
        {
          id: 'projects',
          label: t.nav.projects,
          icon: <FolderOpen className="w-4 h-4" />,
          badge: `${dossiers.length}`
        },
        {
          id: 'fiche',
          label: t.nav.fiche,
          icon: <FileText className="w-4 h-4" />
        },
        {
          id: 'docgen',
          label: t.nav.docgen,
          icon: <FileSpreadsheet className="w-4 h-4" />,
          badge: '10 Docs'
        }
      ],
      [
        {
          id: 'dashboard',
          label: t.nav.dashboard,
          icon: <LayoutDashboard className="w-4 h-4" />
        },
        {
          id: 'pert',
          label: t.nav.pert,
          icon: <Network className="w-4 h-4" />
        },
        {
          id: 'kanban',
          label: t.nav.kanban,
          icon: <Kanban className="w-4 h-4" />
        },
        {
          id: 'gantt',
          label: t.nav.gantt,
          icon: <GanttChart className="w-4 h-4" />
        }
      ],
      [
        {
          id: 'planification',
          label: t.nav.planification,
          icon: <Calendar className="w-4 h-4" />,
          badge: `${allDossierTasks.length}`
        },
        {
          id: 'processus',
          label: t.nav.processus,
          icon: <ListChecks className="w-4 h-4" />,
          badge: `${completionPct}%`
        },
        {
          id: 'raci',
          label: t.nav.raci,
          icon: <Users className="w-4 h-4" />,
          badge: 'R-A-C-I'
        }
      ]
    ];

    return (
      <div className="fixed inset-0 z-50 flex">
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
          onClick={() => setIsSlidebarOpen(false)}
        />

        <aside className="relative z-10 w-80 sm:w-96 max-w-[92vw] h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
          {/* Sticky Top Bar: ONLY the 4 Action Icons + Close Button */}
          <div className="px-3.5 py-2.5 bg-[#0c4a6e] text-white flex items-center justify-between border-b border-sky-800 shrink-0">
            <div className="flex items-center gap-1.5">
              {/* 1. Import JSON */}
              <button
                onClick={() => fileInputRef.current?.click()}
                title={t.actions.importJson}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-[#90D5FF] hover:text-slate-950 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
              </button>
              {/* 2. Save / Overwrite JSON */}
              <button
                onClick={handleSaveOrExportJSON}
                title={t.actions.saveJson}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-[#90D5FF] hover:text-slate-950 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
              </button>
              {/* 3. Export PDF Fiche Technique */}
              <button
                onClick={() =>
                  generateDirectWhitePDF(
                    activeDossier,
                    userProfile,
                    currency,
                    language
                  )
                }
                title={t.actions.exportPdf}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-[#90D5FF] hover:text-slate-950 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
              </button>
              {/* 4. Theme Toggle */}
              <button
                onClick={() =>
                  setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
                }
                title={t.actions.theme}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-[#90D5FF] hover:text-slate-950 flex items-center justify-center transition-colors cursor-pointer"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-[#90D5FF]" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>
            </div>

            <button
              onClick={() => setIsSlidebarOpen(false)}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-rose-500 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Fermer le menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* SCROLLABLE CONTAINER: Logo + Description below the 4 icons scrolls up with mobile swipe! */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
            {/* Scrollable Logo & Brand Header */}
            <div className="p-4 bg-gradient-to-b from-[#0c4a6e] to-[#082f49] text-white">
              <div className="flex items-center gap-3">
                <div className="bg-white p-1.5 rounded-xl shadow-md shrink-0">
                  <AppLogo className="w-16 h-16 sm:w-20 sm:h-20" />
                </div>
                <div className="min-w-0">
                  <div className="inline-block px-2 py-0.5 rounded bg-[#90D5FF] text-slate-950 text-[9px] font-black uppercase tracking-widest mb-1">
                    PLATEFORME UNIVERSELLE
                  </div>
                  <h2 className="text-base font-black tracking-tight uppercase truncate">
                    FAAB PLAN
                  </h2>
                  <p className="text-[11px] text-[#90D5FF] font-medium leading-snug">
                    Planification Stratégique, Réseau PERT, RACI, Suivi & Rapports
                  </p>
                </div>
              </div>
              {lastJsonFileName && (
                <div className="mt-2.5 px-2.5 py-1 rounded bg-white/10 text-[10px] font-mono text-[#90D5FF] truncate">
                  JSON actif : {lastJsonFileName}
                </div>
              )}
            </div>

            {/* Sélecteur de Portefeuille / Dossier UNIQUEMENT (Compact on mobile) */}
            <div className="p-2 sm:p-3 bg-sky-50/60 dark:bg-slate-800/50 space-y-1 sm:space-y-1.5">
              <label className="block text-[8.5px] sm:text-[10px] font-black uppercase tracking-wider text-[#0284c7] dark:text-[#90D5FF] leading-none">
                Portefeuille / Dossier
              </label>
              <select
                value={activeDossier.id}
                onChange={e => {
                  setActiveDossierId(e.target.value);
                  setFilterAxeId('ALL');
                  setFilterProjectId('ALL');
                  const found = dossiers.find(d => d.id === e.target.value);
                  if (found) showToast(`Dossier sélectionné : ${found.name}`);
                }}
                className="w-full h-7 sm:h-auto bg-white dark:bg-slate-900 px-2 py-0.5 sm:px-2.5 sm:py-1.5 rounded-md sm:rounded-lg border border-[#90D5FF] dark:border-slate-700 text-[10px] sm:text-xs font-extrabold text-slate-900 dark:text-white focus:outline-none truncate"
              >
                {dossiers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Navigation Modules organized into 4 groups with spacing between each group */}
            <div className="p-3 space-y-4">
              {navGroups.map((group, groupIdx) => (
                <div
                  key={groupIdx}
                  className={`space-y-1 ${
                    groupIdx > 0
                      ? 'pt-3 border-t border-slate-200/80 dark:border-slate-800'
                      : ''
                  }`}
                >
                  {group.map(item => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigateTo(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#0c4a6e] text-white shadow-xs'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 truncate">
                          <span
                            className={
                              isActive ? 'text-[#90D5FF]' : 'text-[#0284c7]'
                            }
                          >
                            {item.icon}
                          </span>
                          <span className="truncate">{item.label}</span>
                        </span>
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                              isActive
                                ? 'bg-[#90D5FF] text-slate-950'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    );
  };

  // ============================================================================
  // VIEW: TABLEAU DE BORD DÉCISIONNEL (Exact 2 Charts from User Screenshot!)
  // ============================================================================
  const renderDashboardView = () => {
    const delayedRows = flatTaskRows.filter(
      r =>
        r.metrics.effectiveStatus === 'Bloqué' ||
        r.metrics.ecartFinDays > 0 ||
        r.metrics.ecartDebutDays > 0
    );

    // Prepare per-project operational breakdown for Chart 1
    const projectChartData = filteredProjects.map(proj => {
      const pTasks = proj.tasks || [];
      let done = 0;
      let inProgress = 0;
      let todo = 0;
      let blocked = 0;
      let late = 0;

      pTasks.forEach(tk => {
        const m = computeTaskMetrics(tk, todayISO);
        if (m.effectiveStatus === 'Terminé') done++;
        else if (m.effectiveStatus === 'En cours') inProgress++;
        else if (m.effectiveStatus === 'Bloqué') blocked++;
        else todo++;

        if (m.ecartFinDays > 0 || m.ecartDebutDays > 0) {
          late++;
        }
      });

      return {
        id: proj.id,
        name: proj.name,
        done,
        inProgress,
        todo,
        blocked,
        total: pTasks.length,
        late
      };
    });

    const maxBarValue = Math.max(
      8,
      ...projectChartData.map(d => Math.max(d.total, d.late, 1))
    );
    const yAxisMax = Math.ceil(maxBarValue / 2) * 2;
    const yTicks = [
      0,
      Math.round(yAxisMax * 0.25),
      Math.round(yAxisMax * 0.5),
      Math.round(yAxisMax * 0.75),
      yAxisMax
    ];

    // Prepare Donut Chart segments for Chart 2 ("Répartition par Statut")
    const totalActiveOps = allDossierTasks.length;
    const donutSegments = [
      {
        label: 'Bloquées',
        count: statusCounts.Bloqué,
        color: '#ef4444'
      },
      {
        label: 'En cours',
        count: statusCounts['En cours'],
        color: '#0ea5e9'
      },
      {
        label: 'Terminées',
        count: statusCounts.Terminé,
        color: '#10b981'
      },
      {
        label: 'À faire',
        count: statusCounts['À faire'],
        color: '#94a3b8'
      }
    ];

    const donutRadius = 64;
    const donutCircumference = 2 * Math.PI * donutRadius;
    let cumulativeFraction = 0;

    return (
      <div className="space-y-2.5 sm:space-y-5">
        {renderMacroFilterBar()}

        {/* 4 KPI Cards (Reduced size & font-size on mobile!) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-3">
          <div className="bg-white dark:bg-slate-900 p-2 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 border-l-3 sm:border-l-4 border-l-[#0c4a6e] shadow-xs">
            <div className="flex items-center justify-between text-[8.5px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase leading-tight">
              <span className="truncate">Axes & Projets</span>
              <Layers className="w-3 h-3 sm:w-4 sm:h-4 text-[#0284c7] shrink-0" />
            </div>
            <div className="mt-0.5 sm:mt-2 text-xs sm:text-2xl font-black text-slate-900 dark:text-white leading-tight truncate">
              {(activeDossier.axes || []).length} Axes /{' '}
              {availableProjectsInFilter.length} Proj.
            </div>
            <div className="mt-0.5 sm:mt-1 text-[8px] sm:text-[11px] text-slate-500 truncate leading-tight">
              Dossier : <strong className="text-[#0284c7]">{activeDossier.name}</strong>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-2 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 border-l-3 sm:border-l-4 border-l-[#0284c7] shadow-xs">
            <div className="flex items-center justify-between text-[8.5px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase leading-tight">
              <span className="truncate">Activités & Jalons</span>
              <Target className="w-3 h-3 sm:w-4 sm:h-4 text-[#0284c7] shrink-0" />
            </div>
            <div className="mt-0.5 sm:mt-2 text-xs sm:text-2xl font-black text-slate-900 dark:text-white leading-tight truncate">
              {allDossierTasks.length} Élément(s)
            </div>
            <div className="mt-0.5 sm:mt-1 text-[8px] sm:text-[11px] text-emerald-600 font-bold truncate leading-tight">
              {statusCounts.Terminé} terminé(s) • {statusCounts['En cours']} en cours
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-2 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 border-l-3 sm:border-l-4 border-l-emerald-500 shadow-xs">
            <div className="flex items-center justify-between text-[8.5px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase leading-tight">
              <span className="truncate">Budget Consolidé</span>
              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
            </div>
            <div className="mt-0.5 sm:mt-2 text-[11px] sm:text-xl font-black text-slate-900 dark:text-white truncate leading-tight">
              {formatCurrency(totalBudgetFCFA, currency, language)}
            </div>
            <div className="mt-0.5 sm:mt-1 text-[8px] sm:text-[11px] text-slate-500 truncate leading-tight">
              Horizon : {activeDossier.horizonPlan}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-2 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 border-l-3 sm:border-l-4 border-l-[#90D5FF] shadow-xs">
            <div className="flex items-center justify-between text-[8.5px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase leading-tight">
              <span className="truncate">Taux d’Achèvement</span>
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-[#0284c7] shrink-0" />
            </div>
            <div className="mt-0.5 sm:mt-2 text-xs sm:text-2xl font-black text-[#0284c7] dark:text-[#90D5FF] leading-tight">
              {completionPct}%
            </div>
            <div className="w-full h-1 sm:h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1 sm:mt-2">
              <div
                className="h-full bg-[#0284c7]"
                style={{ width: `${Math.min(100, completionPct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* THE 2 EXACT CHARTS FROM ATTACHED SCREENSHOT (2/3 Left + 1/3 Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 sm:gap-4">
          {/* Chart 1 (2/3 width): Répartition opérationnelle par Projet */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-2.5 sm:p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-[11px] sm:text-base font-extrabold text-slate-800 dark:text-white mb-1.5 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 dark:text-[#90D5FF] shrink-0" />
                <span>Répartition opérationnelle par Projet</span>
              </h3>

              {/* Legend matching the screenshot */}
              <div className="flex flex-wrap items-center justify-center gap-x-2.5 sm:gap-x-4 gap-y-1 text-[8.5px] sm:text-[11px] font-medium mb-2 sm:mb-4">
                <span className="inline-flex items-center gap-1 text-[#ef4444]">
                  <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-xs bg-[#ef4444] inline-block" />
                  Bloquées (Goulots)
                </span>
                <span className="inline-flex items-center gap-1 text-[#8b5cf6]">
                  <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-xs bg-[#8b5cf6] inline-block" />
                  En Retard
                </span>
                <span className="inline-flex items-center gap-1 text-[#0ea5e9]">
                  <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-xs bg-[#0ea5e9] inline-block" />
                  En cours
                </span>
                <span className="inline-flex items-center gap-1 text-[#10b981]">
                  <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-xs bg-[#10b981] inline-block" />
                  Terminées
                </span>
                <span className="inline-flex items-center gap-1 text-[#64748b]">
                  <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-xs bg-[#64748b] inline-block" />
                  Total Tâches
                </span>
                <span className="inline-flex items-center gap-1 text-[#94a3b8]">
                  <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-xs bg-[#94a3b8] inline-block" />
                  À faire
                </span>
              </div>
            </div>

            {projectChartData.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-8 sm:py-12 text-center">
                Aucun projet pour ce filtre.
              </p>
            ) : (
              <div className="relative pt-1 sm:pt-2 pb-1">
                {/* Chart Plot Area */}
                <div className="flex items-end h-36 sm:h-56">
                  {/* Y-axis labels */}
                  <div className="flex flex-col justify-between h-28 sm:h-48 pr-1.5 sm:pr-2 text-[8.5px] sm:text-[11px] font-mono text-slate-400 select-none">
                    {[...yTicks].reverse().map((tick, idx) => (
                      <span key={idx} className="leading-none">
                        {tick}
                      </span>
                    ))}
                  </div>

                  {/* Bars + Horizontal Gridlines */}
                  <div className="relative flex-1 h-28 sm:h-48 border-l border-b border-slate-300 dark:border-slate-700 flex items-end justify-around px-1.5 sm:px-6">
                    {/* Horizontal dashed gridlines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      {yTicks.map((_, idx) => (
                        <div
                          key={idx}
                          className="w-full border-t border-dashed border-slate-200 dark:border-slate-800"
                        />
                      ))}
                    </div>

                    {/* Grouped Bars per Project */}
                    {projectChartData.map(proj => {
                      const scalePct = (val: number) =>
                        yAxisMax > 0
                          ? Math.min(100, (val / yAxisMax) * 100)
                          : 0;

                      const donePct = scalePct(proj.done);
                      const inProgPct = scalePct(proj.inProgress);
                      const todoPct = scalePct(proj.todo);
                      const blockedPct = scalePct(proj.blocked);
                      const totalPct = scalePct(proj.total);
                      const latePct = scalePct(proj.late);

                      return (
                        <div
                          key={proj.id}
                          className="relative z-10 flex flex-col items-center h-full justify-end group max-w-[140px] flex-1"
                        >
                          <div className="flex items-end justify-center gap-1 sm:gap-2 w-full h-full px-0.5 sm:px-1">
                            {/* Bar 1: Stacked Status Breakdown (Terminées + En cours + À faire + Bloquées) */}
                            <div
                              className="w-3.5 sm:w-7 h-full flex flex-col-reverse justify-start rounded-t overflow-hidden"
                              title={`${proj.name} — Terminées: ${proj.done}, En cours: ${proj.inProgress}, À faire: ${proj.todo}, Bloquées: ${proj.blocked}`}
                            >
                              {proj.done > 0 && (
                                <div
                                  style={{ height: `${donePct}%` }}
                                  className="w-full bg-[#10b981] transition-all"
                                />
                              )}
                              {proj.inProgress > 0 && (
                                <div
                                  style={{ height: `${inProgPct}%` }}
                                  className="w-full bg-[#0ea5e9] transition-all"
                                />
                              )}
                              {proj.todo > 0 && (
                                <div
                                  style={{ height: `${todoPct}%` }}
                                  className="w-full bg-[#94a3b8] transition-all"
                                />
                              )}
                              {proj.blocked > 0 && (
                                <div
                                  style={{ height: `${blockedPct}%` }}
                                  className="w-full bg-[#ef4444] transition-all"
                                />
                              )}
                            </div>

                            {/* Bar 2: Total Tâches */}
                            <div className="w-3.5 sm:w-7 h-full flex items-end">
                              <div
                                style={{ height: `${totalPct}%` }}
                                className="w-full bg-[#64748b] rounded-t transition-all"
                                title={`${proj.name} — Total Tâches: ${proj.total}`}
                              />
                            </div>

                            {/* Bar 3: En Retard */}
                            <div className="w-3.5 sm:w-7 h-full flex items-end">
                              <div
                                style={{
                                  height: `${
                                    proj.late > 0 ? Math.max(4, latePct) : 0
                                  }%`
                                }}
                                className="w-full bg-[#8b5cf6] rounded-t transition-all"
                                title={`${proj.name} — En Retard: ${proj.late}`}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* X-axis Project Labels */}
                <div className="flex pl-4 sm:pl-6 pt-1 sm:pt-2 justify-around gap-1 sm:gap-2">
                  {projectChartData.map(proj => (
                    <div
                      key={proj.id}
                      className="text-center text-[8.5px] sm:text-[11px] font-medium text-slate-600 dark:text-slate-300 max-w-[140px] flex-1 leading-tight line-clamp-2"
                      title={proj.name}
                    >
                      {proj.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chart 2 (1/3 width): Répartition par Statut (Donut Chart) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-2.5 sm:p-5 shadow-sm flex flex-col justify-between">
            <h3 className="text-[11px] sm:text-base font-extrabold text-slate-800 dark:text-white mb-1 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 dark:text-[#90D5FF] shrink-0" />
              <span>Répartition par Statut</span>
            </h3>

            {/* SVG Donut Chart */}
            <div className="flex flex-col items-center justify-center my-1 sm:my-2">
              <div className="relative w-28 h-28 sm:w-44 sm:h-44 flex items-center justify-center">
                <svg
                  className="w-28 h-28 sm:w-44 sm:h-44 -rotate-90"
                  viewBox="0 0 160 160"
                >
                  {totalActiveOps === 0 ? (
                    <circle
                      cx="80"
                      cy="80"
                      r={donutRadius}
                      fill="transparent"
                      stroke="#e2e8f0"
                      strokeWidth="22"
                    />
                  ) : (
                    donutSegments.map(seg => {
                      if (seg.count <= 0) return null;
                      const fraction = seg.count / totalActiveOps;
                      const dashLength = Math.max(
                        0,
                        fraction * donutCircumference - 2
                      );
                      const dashOffset =
                        -cumulativeFraction * donutCircumference;
                      cumulativeFraction += fraction;

                      return (
                        <circle
                          key={seg.label}
                          cx="80"
                          cy="80"
                          r={donutRadius}
                          fill="transparent"
                          stroke={seg.color}
                          strokeWidth="22"
                          strokeDasharray={`${dashLength} ${donutCircumference}`}
                          strokeDashoffset={dashOffset}
                        >
                          <title>{`${seg.label}: ${seg.count}`}</title>
                        </circle>
                      );
                    })
                  )}
                </svg>
              </div>

              {/* Donut Legend */}
              <div className="flex flex-wrap items-center justify-center gap-x-2.5 sm:gap-x-4 gap-y-1 text-[8.5px] sm:text-xs font-medium mt-2 sm:mt-3">
                <span className="inline-flex items-center gap-1 text-[#ef4444]">
                  <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-xs bg-[#ef4444] inline-block" />
                  Bloquées
                </span>
                <span className="inline-flex items-center gap-1 text-[#0ea5e9]">
                  <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-xs bg-[#0ea5e9] inline-block" />
                  En cours
                </span>
                <span className="inline-flex items-center gap-1 text-[#10b981]">
                  <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-xs bg-[#10b981] inline-block" />
                  Terminées
                </span>
                <span className="inline-flex items-center gap-1 text-[#94a3b8]">
                  <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-xs bg-[#94a3b8] inline-block" />
                  À faire
                </span>
              </div>
            </div>

            {/* Footer Total */}
            <div className="pt-2 sm:pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-[9.5px] sm:text-xs text-slate-500 dark:text-slate-400">
              Total des opérations actives :{' '}
              <strong className="text-slate-900 dark:text-white font-black">
                {totalActiveOps}
              </strong>
            </div>
          </div>
        </div>

        {/* BOTTLENECKS & ALERTS SECTION (BELOW THE 2 CHARTS) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Goulots d’étranglement & Alertes d’Écarts ({delayedRows.length})
          </h3>
          {delayedRows.length === 0 ? (
            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Aucun goulot d’étranglement ni écart critique détecté sur les tâches actives.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {delayedRows.map(r => (
                <div
                  key={r.task.id}
                  className="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="text-xs font-black text-slate-900 dark:text-white">
                      <span className="font-mono text-[#0c4a6e] dark:text-[#90D5FF] mr-1.5">
                        [{r.code}]
                      </span>
                      {r.task.name}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      Responsable : <strong>{r.task.assignee}</strong> • Fin prévue :{' '}
                      {r.task.endDate}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black shrink-0">
                    {r.metrics.effectiveStatus === 'Bloqué'
                      ? 'BLOQUÉ'
                      : r.metrics.ecartFinLabel}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================================================
  // VIEW: RÉSEAU PERT (Zoom out down to 10% = 0.10!)
  // ============================================================================
  const renderPertView = () => {
    const pertSummaries = computeDossierPertSummary(activeDossier, todayISO).filter(
      ps => filterProjectId === 'ALL' || ps.projectId === filterProjectId
    );
    const allNodes = pertSummaries.flatMap(p => p.nodes);

    // Group nodes by level for SVG layout
    const levelsMap = new Map<number, typeof allNodes>();
    allNodes.forEach(n => {
      const list = levelsMap.get(n.level) || [];
      list.push(n);
      levelsMap.set(n.level, list);
    });
    const maxLevel = Math.max(0, ...Array.from(levelsMap.keys()));
    const maxNodesInLevel = Math.max(
      1,
      ...Array.from(levelsMap.values()).map(l => l.length)
    );

    const colWidth = 250;
    const rowHeight = 130;
    const svgWidth = Math.max(820, (maxLevel + 1) * colWidth + 120);
    const svgHeight = Math.max(420, maxNodesInLevel * rowHeight + 100);

    const nodePositions = new Map<string, { x: number; y: number }>();
    Array.from(levelsMap.entries()).forEach(([lvl, nodes]) => {
      nodes.forEach((node, idx) => {
        const x = 60 + lvl * colWidth;
        const y = 50 + idx * rowHeight;
        nodePositions.set(node.id, { x, y });
      });
    });

    return (
      <div className="space-y-4">
        {renderMacroFilterBar()}

        {/* PERT Controls Bar (Zoom down to 10% = 0.10) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <Network className="w-4 h-4 text-[#0284c7] dark:text-[#90D5FF]" />
              Réseau PERT & Chemin Critique (CPM)
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Dézoomez jusqu’à 10% pour visualiser l’intégralité du graphe PERT sur mobile et ordinateur
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Switch Graph / Table */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setPertViewMode('graph')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  pertViewMode === 'graph'
                    ? 'bg-[#0c4a6e] text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Vue Graphique PERT
              </button>
              <button
                onClick={() => setPertViewMode('table')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  pertViewMode === 'table'
                    ? 'bg-[#0c4a6e] text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Vue Tableau Antécéd. / Précéd.
              </button>
            </div>

            {/* Zoom Controls allowing down to 10% (0.10) */}
            {pertViewMode === 'graph' && (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                <button
                  onClick={() =>
                    setPertZoom(z => Math.max(0.1, Number((z - 0.1).toFixed(2))))
                  }
                  className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                  title="Dézoomer jusqu'à 10%"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 min-w-[44px] text-center">
                  {Math.round(pertZoom * 100)}%
                </span>
                <button
                  onClick={() =>
                    setPertZoom(z => Math.min(2.0, Number((z + 0.1).toFixed(2))))
                  }
                  className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                  title="Zoomer +"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPertZoom(0.1)}
                  className="px-1.5 py-0.5 rounded bg-sky-100 dark:bg-slate-700 text-[#0c4a6e] dark:text-[#90D5FF] text-[9px] font-black cursor-pointer"
                  title="Dézoomer à 10%"
                >
                  10%
                </button>
                <button
                  onClick={() => setPertZoom(1)}
                  className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                  title="Réinitialiser à 100%"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic PERT Interpretation Cards */}
        <div className="space-y-3">
          {pertSummaries.map(ps => (
            <div
              key={ps.projectId}
              className="bg-sky-50/80 dark:bg-slate-900 rounded-xl border border-[#90D5FF] dark:border-sky-800 p-4 space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#0c4a6e] dark:text-[#90D5FF]">
                  {ps.projectName} — Durée Totale : {ps.projectDuration}j
                </span>
                <span className="px-2.5 py-0.5 rounded bg-[#0c4a6e] text-white text-[10px] font-black">
                  Chemin Critique : {ps.criticalPathCodes.join(' → ') || 'N/A'}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                {ps.interpretation.criticalPathSummary}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {ps.interpretation.slackSummary}
              </p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {ps.interpretation.riskAndSteeringSummary}
              </p>
            </div>
          ))}
        </div>

        {pertViewMode === 'graph' ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm overflow-auto max-h-[70vh]">
            <div
              style={{
                transform: `scale(${pertZoom})`,
                transformOrigin: 'top left',
                width: svgWidth * pertZoom,
                height: svgHeight * pertZoom
              }}
            >
              <svg width={svgWidth} height={svgHeight} className="overflow-visible">
                <defs>
                  <marker
                    id="arrow-normal"
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="4"
                    orient="auto"
                  >
                    <path d="M0,0 L8,4 L0,8 Z" fill="#0284c7" />
                  </marker>
                  <marker
                    id="arrow-crit"
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="4"
                    orient="auto"
                  >
                    <path d="M0,0 L8,4 L0,8 Z" fill="#f59e0b" />
                  </marker>
                </defs>

                {/* Dependency Edges */}
                {allNodes.map(node => {
                  if (!node.antecedentId || node.antecedentId === '—') return null;
                  const from = nodePositions.get(node.antecedentId);
                  const to = nodePositions.get(node.id);
                  if (!from || !to) return null;
                  const predNode = allNodes.find(n => n.id === node.antecedentId);
                  const isCritEdge = node.isCritical && predNode?.isCritical;

                  const x1 = from.x + 175;
                  const y1 = from.y + 42;
                  const x2 = to.x;
                  const y2 = to.y + 42;
                  const midX = (x1 + x2) / 2;

                  return (
                    <path
                      key={`${node.antecedentId}->${node.id}`}
                      d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                      fill="none"
                      stroke={isCritEdge ? '#f59e0b' : '#0284c7'}
                      strokeWidth={isCritEdge ? 3 : 1.8}
                      strokeDasharray={isCritEdge ? undefined : '4 2'}
                      markerEnd={
                        isCritEdge ? 'url(#arrow-crit)' : 'url(#arrow-normal)'
                      }
                    />
                  );
                })}

                {/* PERT Nodes */}
                {allNodes.map(node => {
                  const pos = nodePositions.get(node.id);
                  if (!pos) return null;
                  return (
                    <g
                      key={node.id}
                      transform={`translate(${pos.x}, ${pos.y})`}
                    >
                      <rect
                        width={175}
                        height={86}
                        rx={10}
                        fill={node.isCritical ? '#fffbeb' : '#f0f9ff'}
                        stroke={node.isCritical ? '#f59e0b' : '#0284c7'}
                        strokeWidth={node.isCritical ? 2.5 : 1.5}
                      />
                      <text
                        x={10}
                        y={18}
                        fontSize={11}
                        fontWeight="900"
                        fill="#0c4a6e"
                      >
                        {node.code} ({node.duration}j)
                      </text>
                      {node.isCritical && (
                        <text
                          x={114}
                          y={18}
                          fontSize={9}
                          fontWeight="900"
                          fill="#d97706"
                        >
                          CRITIQUE
                        </text>
                      )}
                      <text x={10} y={34} fontSize={9.5} fill="#334155">
                        {node.name.length > 24
                          ? `${node.name.slice(0, 24)}…`
                          : node.name}
                      </text>
                      <line
                        x1={8}
                        y1={42}
                        x2={167}
                        y2={42}
                        stroke="#cbd5e1"
                        strokeWidth={1}
                      />
                      <text x={10} y={56} fontSize={9} fill="#0f172a">
                        ES: J+{node.es} | EF: J+{node.ef}
                      </text>
                      <text x={10} y={70} fontSize={9} fill="#0f172a">
                        LS: J+{node.ls} | LF: J+{node.lf}
                      </text>
                      <text
                        x={114}
                        y={78}
                        fontSize={8.5}
                        fontWeight="bold"
                        fill={node.totalFloat === 0 ? '#d97706' : '#0284c7'}
                      >
                        MT: {node.totalFloat}j
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        ) : (
          /* PERT Table: Code | Activité / Jalon | Antécéd. | Précéd. */
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
            <table className="w-full border-collapse table-compact">
              <thead>
                <tr className="bg-[#0c4a6e] text-white">
                  <th className="text-left">Code</th>
                  <th className="text-left">Activité / Jalon</th>
                  <th className="text-center">Antécéd.</th>
                  <th className="text-left">Précéd. (Chaîne Complète)</th>
                  <th className="text-center">Durée</th>
                  <th className="text-center">ES (Tôt)</th>
                  <th className="text-center">EF (Tôt)</th>
                  <th className="text-center">LS (Tard)</th>
                  <th className="text-center">LF (Tard)</th>
                  <th className="text-center">Marge Totale</th>
                  <th className="text-center">Chemin Critique</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {allNodes.map(node => (
                  <tr
                    key={node.id}
                    className={
                      node.isCritical
                        ? 'bg-amber-50/60 dark:bg-amber-950/30 font-bold'
                        : 'bg-white dark:bg-slate-900'
                    }
                  >
                    <td className="font-mono text-[#0c4a6e] dark:text-[#90D5FF] font-black">
                      {node.code}
                    </td>
                    <td className="text-slate-900 dark:text-white whitespace-normal break-words">
                      {node.name}
                    </td>
                    <td className="text-center font-mono text-slate-700 dark:text-slate-300">
                      {node.antecedentCode}
                    </td>
                    <td className="font-mono text-slate-600 dark:text-slate-400">
                      {node.precedingChainCodes}
                    </td>
                    <td className="text-center font-mono">{node.duration}j</td>
                    <td className="text-center font-mono">J+{node.es}</td>
                    <td className="text-center font-mono">J+{node.ef}</td>
                    <td className="text-center font-mono">J+{node.ls}</td>
                    <td className="text-center font-mono">J+{node.lf}</td>
                    <td className="text-center font-mono">{node.totalFloat}j</td>
                    <td className="text-center">
                      {node.isCritical ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-black">
                          CRITIQUE
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-bold">
                          Souple
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // VIEW: TABLEAU KANBAN INTERACTIF (Execution-driven + Date Recalculation)
  // ============================================================================
  const renderKanbanView = () => {
    const columns: Array<{
      status: Task['status'];
      title: string;
      headerBg: string;
    }> = [
      { status: 'À faire', title: 'À Faire', headerBg: 'bg-slate-700 text-white' },
      {
        status: 'En cours',
        title: 'En Cours d’Exécution',
        headerBg: 'bg-[#0284c7] text-white'
      },
      {
        status: 'Bloqué',
        title: 'Bloqué / Retard',
        headerBg: 'bg-amber-500 text-slate-950'
      },
      {
        status: 'Terminé',
        title: 'Terminé',
        headerBg: 'bg-emerald-600 text-white'
      }
    ];

    return (
      <div className="space-y-2.5 sm:space-y-4">
        {renderMacroFilterBar()}

        <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 p-2 sm:p-3 shadow-sm">
          <h2 className="text-xs sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-1.5 sm:gap-2">
            <Kanban className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0284c7] dark:text-[#90D5FF] shrink-0" />
            <span>Tableau Kanban Interactif (Basé sur l’Exécution Réelle)</span>
          </h2>
          <p className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
            Déplacez une tâche ou un jalon d’une colonne de statut vers une autre : ses dates prévues se recalculent automatiquement en conservant sa durée et la logique des antécédents.
          </p>
        </div>

        {/* HORIZONTAL KANBAN COLUMNS (Side-by-side horizontally on mobile & desktop!) */}
        <div className="flex flex-row overflow-x-auto lg:grid lg:grid-cols-4 gap-2 sm:gap-3 pb-2">
          {columns.map(col => {
            const colRows = flatTaskRows.filter(
              r => r.metrics.effectiveStatus === col.status
            );

            return (
              <div
                key={col.status}
                className="min-w-[205px] w-[205px] sm:min-w-[245px] sm:w-[245px] lg:min-w-0 lg:w-auto shrink-0 bg-slate-100/80 dark:bg-slate-900/70 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
              >
                <div
                  className={`px-2.5 py-2 sm:px-3 sm:py-2.5 ${col.headerBg} flex items-center justify-between font-black text-[10px] sm:text-xs uppercase`}
                >
                  <span className="truncate">{col.title}</span>
                  <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-black/20 text-[9px] sm:text-[10px] shrink-0">
                    {colRows.length}
                  </span>
                </div>

                <div className="p-2 sm:p-2.5 space-y-2 sm:space-y-2.5 flex-1 max-h-[65vh] overflow-y-auto">
                  {colRows.map(r => {
                    const { task, code, projectId, metrics } = r;
                    const isJalon = task.type === 'jalon';

                    return (
                      <div
                        key={task.id}
                        className={`rounded-lg border p-2 sm:p-3 shadow-xs space-y-1.5 sm:space-y-2 ${
                          isJalon
                            ? 'bg-sky-50/80 dark:bg-slate-800/70 border-[#90D5FF]'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded font-mono text-[9px] sm:text-[10px] font-black shrink-0 ${
                              isJalon
                                ? 'bg-[#90D5FF] text-slate-950'
                                : 'bg-[#0c4a6e] text-white'
                            }`}
                          >
                            {code}
                          </span>
                          <span className="text-[8.5px] sm:text-[10px] font-black text-[#0284c7] dark:text-[#90D5FF] text-right leading-tight">
                            {task.phase} • {metrics.plannedDurationLabel}
                          </span>
                        </div>

                        <div className="text-[10.5px] sm:text-xs font-extrabold text-slate-900 dark:text-white leading-snug">
                          {isJalon ? `◆ ${task.name}` : task.name}
                        </div>

                        <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5">
                          <div className="truncate">Réalisateur : {task.assignee}</div>
                          <div>
                            Prévu: {task.startDate} → {task.endDate}
                          </div>
                        </div>

                        <div className="pt-1.5 sm:pt-2 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-1">
                          {columns
                            .filter(c => c.status !== col.status)
                            .map(targetCol => (
                              <button
                                key={targetCol.status}
                                onClick={() =>
                                  handleMoveTaskInKanban(
                                    projectId,
                                    task.id,
                                    targetCol.status
                                  )
                                }
                                className="px-1.5 sm:px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 hover:bg-[#90D5FF] hover:text-slate-950 text-[8.5px] sm:text-[9px] font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                              >
                                → {targetCol.status}
                              </button>
                            ))}
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
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Hidden JSON File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImportJSON}
        className="hidden"
      />

      {/* Slidebar Drawer */}
      {renderSlidebar()}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#0c4a6e] text-white px-4 py-2.5 rounded-xl shadow-xl border border-[#90D5FF] flex items-center gap-2 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-[#90D5FF] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MOBILE ONLY ON OTHER TABS (activeTab !== 'accueil'): Burger Icon + App Icon right next to it (Same Size w-10 h-10, No Navbar) */}
      {activeTab !== 'accueil' && (
        <div className="md:hidden fixed top-2 left-2 z-40 flex items-center gap-1.5 no-print">
          <button
            onClick={() => setIsSlidebarOpen(true)}
            aria-label="Ouvrir le menu déroulant"
            title="Menu FAAB PLAN"
            className="w-10 h-10 rounded-xl bg-[#0c4a6e] text-[#90D5FF] hover:bg-[#90D5FF] hover:text-slate-950 flex items-center justify-center transition-all border border-[#90D5FF]/70 shadow-md cursor-pointer shrink-0"
          >
            <Menu className="w-6 h-6" />
          </button>

          <button
            onClick={() => navigateTo('accueil')}
            aria-label="Accueil FAAB PLAN"
            title="Accueil FAAB PLAN"
            className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center border border-[#90D5FF]/80 shadow-md cursor-pointer shrink-0"
          >
            <AppLogo className="w-full h-full" />
          </button>
        </div>
      )}

      {/* INSTITUTIONAL NAVBAR: Visible on ALL screens on Home Page (accueil), and on Tablet/Desktop (md:block) on other tabs */}
      <header
        className={`${
          activeTab === 'accueil' ? 'block' : 'hidden md:block'
        } sticky top-0 z-30 bg-[#0c4a6e] text-white border-b-2 border-[#90D5FF] shadow-md no-print`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => setIsSlidebarOpen(true)}
            aria-label="Ouvrir le menu déroulant"
            title="Ouvrir le menu déroulant"
            className="w-10 h-10 rounded-xl bg-sky-950/80 text-[#90D5FF] hover:bg-[#90D5FF] hover:text-slate-950 flex items-center justify-center transition-all border border-[#90D5FF]/60 shadow-sm cursor-pointer shrink-0"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div
            onClick={() => navigateTo('accueil')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none min-w-0"
          >
            <div className="w-10 h-10 bg-white p-1 rounded-xl shadow-sm shrink-0 flex items-center justify-center">
              <AppLogo className="w-full h-full" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-black tracking-wider uppercase text-white leading-tight truncate">
                FAAB PLAN
              </h1>
              <p className="text-[10px] sm:text-[11px] font-semibold text-[#90D5FF] leading-tight truncate">
                {t.appSubtitle}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main
        className={`flex-1 max-w-7xl w-full mx-auto px-2 sm:px-6 ${
          activeTab === 'accueil' ? 'pt-3 md:pt-5' : 'pt-14 md:pt-5'
        } pb-4`}
      >
        {activeTab === 'accueil' && (
          <LandingPage
            isDark={theme === 'dark'}
            language={language}
            lastJsonFileName={lastJsonFileName}
            onOpenSlidebar={() => setIsSlidebarOpen(true)}
            onNavigateTab={navigateTo}
          />
        )}

        {activeTab === 'profil' && (
          <UserProfileView
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            currency={currency}
            setCurrency={setCurrency}
            language={language}
            setLanguage={setLanguage}
            onNavigateTab={navigateTo}
          />
        )}

        {activeTab === 'projects' && (
          <DossiersAndProjectsView
            dossiers={dossiers}
            activeDossier={activeDossier}
            setActiveDossierId={setActiveDossierId}
            onCreateDossier={createDossierDirect}
            onDeleteDossier={handleDeleteDossier}
            onAddAxe={handleAddAxe}
            onUpdateAxeName={handleUpdateAxeName}
            onDeleteAxe={handleDeleteAxe}
            onAddProject={handleAddProject}
            onUpdateProjectName={handleUpdateProjectName}
            onDeleteProject={handleDeleteProject}
            currency={currency}
            language={language}
            onNavigateTab={navigateTo}
          />
        )}

        {activeTab === 'dashboard' && renderDashboardView()}

        {activeTab === 'gantt' && (
          <GanttAndTreeView
            dossier={activeDossier}
            currency={currency}
            language={language}
            filterAxeId={filterAxeId}
            setFilterAxeId={setFilterAxeId}
            filterProjectId={filterProjectId}
            setFilterProjectId={setFilterProjectId}
          />
        )}

        {(activeTab === 'planification' ||
          activeTab === 'processus' ||
          activeTab === 'raci') && (
          <OperationalMatrices
            mode={activeTab as 'planification' | 'processus' | 'raci'}
            dossier={activeDossier}
            currency={currency}
            language={language}
            filterAxeId={filterAxeId}
            setFilterAxeId={setFilterAxeId}
            filterProjectId={filterProjectId}
            setFilterProjectId={setFilterProjectId}
            onAddAxe={handleAddAxe}
            onUpdateAxeName={handleUpdateAxeName}
            onDeleteAxe={handleDeleteAxe}
            onAddProject={handleAddProject}
            onUpdateProjectName={handleUpdateProjectName}
            onDeleteProject={handleDeleteProject}
            onAddTaskInPhase={handleAddTaskInPhase}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        )}

        {activeTab === 'pert' && renderPertView()}

        {activeTab === 'kanban' && renderKanbanView()}

        {activeTab === 'fiche' && (
          <FicheTechniquePages
            dossier={activeDossier}
            userProfile={userProfile}
            currency={currency}
            language={language}
          />
        )}

        {activeTab === 'docgen' && (
          <DocumentGeneratorView
            dossier={activeDossier}
            userProfile={userProfile}
            currency={currency}
            language={language}
            customDocsData={customDocsData}
            onUpdateDocField={handleUpdateDocField}
            onResetDocDefaults={handleResetDocDefaults}
            filterAxeId={filterAxeId}
            setFilterAxeId={setFilterAxeId}
            filterProjectId={filterProjectId}
            setFilterProjectId={setFilterProjectId}
          />
        )}
      </main>

      {/* INSTITUTIONAL FOOTER — ONLY ON HOME PAGE (accueil) */}
      {activeTab === 'accueil' && (
        <footer className="bg-[#0c4a6e] text-white border-t-4 border-[#90D5FF] mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white p-1.5 rounded-xl shadow-md shrink-0">
                <AppLogo className="w-16 h-16 sm:w-20 sm:h-20" />
              </div>
              <div>
                <div className="text-sm font-black uppercase tracking-wider text-white">
                  FAAB PLAN — PILOTAGE STRATÉGIQUE & OPÉRATIONNEL
                </div>
                <div className="text-xs text-[#90D5FF]">
                  Créateur & Architecte Principal : KOFFIE FABIEN MICHAEL
                </div>
                <div className="text-[11px] text-sky-200 mt-0.5">
                  Persistance Locale IndexedDB • Sauvegarde JSON • Exports PDF A4 Fond Blanc Pur
                </div>
              </div>
            </div>

            <div className="text-center sm:text-right text-xs text-sky-200">
              <div className="font-bold text-white">
                © {new Date().getFullYear()} FAAB PLAN • Tous droits réservés
              </div>
              <div className="text-[11px] text-[#90D5FF]">
                Application Web Universelle & Multi-Projets
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
