import React, { useMemo, useState } from 'react';
import {
  Printer,
  FileSpreadsheet,
  SlidersHorizontal,
  Sparkles,
  ImagePlus,
  Trash2,
  AlertTriangle,
  Filter,
  Briefcase,
  CheckSquare,
  Plus,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Copy,
  Check
} from 'lucide-react';
import {
  InstitutionalDocType,
  CustomDocFields,
  CustomDocsMap,
  UserProfile,
  Dossier,
  CurrencyCode,
  LanguageCode
} from '../types';
import {
  DOC_TEMPLATE_CONFIGS,
  getDocImageFieldDescriptors,
  DocTemplateConfig,
  DocFieldDescriptor,
  DocImageFieldKey,
  buildDynamicFieldsFromAppTabs,
  buildInstitutionalDocPages
} from '../docTemplates';
import {
  MASTER_MATRICES_DEFINITIONS,
  DOC_TO_MATRICES_MAP,
  MasterMatrixId,
  AllMatricesData,
  buildDefaultMatricesFromApp,
  resolveActiveMatricesData,
  computeMatrixRowCalculations,
  createEmptyMatrixRow,
  getMatrixCompletionStats,
  serializeMatrixToMarkdown
} from '../docMatrices';
import { defaultCustomDocsData } from '../db';
import { generateInstitutionalDocumentPDF } from '../pdfExport';
import { AppLogo } from './AppLogo';

interface DocumentGeneratorViewProps {
  dossier: Dossier;
  userProfile: UserProfile;
  currency: CurrencyCode;
  language: LanguageCode;
  customDocsData: CustomDocsMap;
  onUpdateDocField: (
    docType: InstitutionalDocType,
    fieldKey: keyof CustomDocFields,
    value: string
  ) => void;
  onResetDocDefaults: (docType: InstitutionalDocType) => void;
  filterAxeId?: string;
  setFilterAxeId?: (id: string) => void;
  filterProjectId?: string;
  setFilterProjectId?: (id: string) => void;
}

type MatrixFilterSelection = 'AUTO_DOC' | 'ALL' | MasterMatrixId;
type CompletionFilterMode = 'ALL' | 'MISSING' | 'PREFILLED';

export const DocumentGeneratorView: React.FC<DocumentGeneratorViewProps> = ({
  dossier,
  userProfile,
  currency,
  language,
  customDocsData,
  onUpdateDocField,
  onResetDocDefaults,
  filterAxeId = 'ALL',
  setFilterAxeId,
  filterProjectId = 'ALL',
  setFilterProjectId
}) => {
  const [selectedDocType, setSelectedDocType] = useState<InstitutionalDocType>('tdr');
  const [localAxeId, setLocalAxeId] = useState<string>('ALL');
  const [localProjectId, setLocalProjectId] = useState<string>('ALL');
  const [pendingImageDelete, setPendingImageDelete] = useState<{
    key: DocImageFieldKey;
    label: string;
  } | null>(null);

  // États du panneau « Filtrer & Renseigner les Matrices (M1 - M10) »
  const [isMatricesPanelOpen, setIsMatricesPanelOpen] = useState<boolean>(false);
  const [matrixFilterMode, setMatrixFilterMode] = useState<MatrixFilterSelection>('AUTO_DOC');
  const [completionFilter, setCompletionFilter] = useState<CompletionFilterMode>('ALL');
  const [copiedMatrixToken, setCopiedMatrixToken] = useState<string | null>(null);
  const [pendingMatrixRowDelete, setPendingMatrixRowDelete] = useState<{
    matrixId: MasterMatrixId;
    rowIndex: number;
    rowCode: string;
  } | null>(null);

  const activeAxeFilter = setFilterAxeId ? filterAxeId : localAxeId;
  const activeProjectFilter = setFilterProjectId ? filterProjectId : localProjectId;

  const handleAxeChange = (val: string) => {
    if (setFilterAxeId) setFilterAxeId(val);
    else setLocalAxeId(val);
    if (setFilterProjectId) setFilterProjectId('ALL');
    else setLocalProjectId('ALL');
  };

  const handleProjectChange = (val: string) => {
    if (setFilterProjectId) setFilterProjectId(val);
    else setLocalProjectId(val);
  };

  const availableProjects = useMemo(() => {
    const axes =
      activeAxeFilter === 'ALL'
        ? dossier.axes || []
        : (dossier.axes || []).filter(a => a.id === activeAxeFilter);
    return axes.flatMap(a => a.projects || []);
  }, [dossier, activeAxeFilter]);

  // Filtered dossier view reflecting the selected Axe / Project from the app tabs
  const effectiveDossier = useMemo<Dossier>(() => {
    if (activeAxeFilter === 'ALL' && activeProjectFilter === 'ALL') {
      return dossier;
    }
    const filteredAxes = (dossier.axes || [])
      .filter(a => activeAxeFilter === 'ALL' || a.id === activeAxeFilter)
      .map(a => ({
        ...a,
        projects: (a.projects || []).filter(
          p => activeProjectFilter === 'ALL' || p.id === activeProjectFilter
        )
      }))
      .filter(a => a.projects.length > 0 || activeProjectFilter === 'ALL');

    return {
      ...dossier,
      axes: filteredAxes
    };
  }, [dossier, activeAxeFilter, activeProjectFilter]);

  const configList = useMemo<DocTemplateConfig[]>(
    () => Object.values(DOC_TEMPLATE_CONFIGS),
    []
  );

  const currentConfig = useMemo<DocTemplateConfig>(
    () => DOC_TEMPLATE_CONFIGS[selectedDocType] || DOC_TEMPLATE_CONFIGS.tdr,
    [selectedDocType]
  );

  // Automatically synchronize untouched default fields with live data from all other tabs
  const currentFields = useMemo<CustomDocFields>(() => {
    const baseDefaults = defaultCustomDocsData[selectedDocType];
    const saved = customDocsData?.[selectedDocType] || ({} as Partial<CustomDocFields>);
    const liveSynced = buildDynamicFieldsFromAppTabs(
      selectedDocType,
      baseDefaults,
      effectiveDossier,
      userProfile,
      currency,
      language
    );

    const resolveField = (key: keyof CustomDocFields): string => {
      const savedVal = saved[key];
      const defaultVal = baseDefaults[key];
      const liveVal = liveSynced[key];
      // If user customized the field away from static default, keep user value; otherwise use live data from app tabs
      if (savedVal && savedVal.trim() !== '' && savedVal !== defaultVal) {
        return savedVal;
      }
      return (liveVal as string) || (savedVal as string) || (defaultVal as string) || '';
    };

    // Share uploaded logos/images across documents if the current document doesn't have its own override yet
    const findSharedImage = (imgKey: DocImageFieldKey): string | undefined => {
      if (saved[imgKey]) return saved[imgKey];
      for (const docKey of Object.keys(customDocsData || {}) as InstitutionalDocType[]) {
        const candidate = customDocsData?.[docKey]?.[imgKey];
        if (candidate) return candidate;
      }
      return undefined;
    };

    // Share user-edited matrices across documents if the current document doesn't have its own override yet
    const findSharedMatricesJson = (): string | undefined => {
      if (saved.matricesJson) return saved.matricesJson;
      for (const docKey of Object.keys(customDocsData || {}) as InstitutionalDocType[]) {
        const candidate = customDocsData?.[docKey]?.matricesJson;
        if (candidate) return candidate;
      }
      return undefined;
    };

    return {
      ...baseDefaults,
      ...liveSynced,
      ...saved,
      referenceCode: resolveField('referenceCode'),
      locationCity: resolveField('locationCity'),
      recipientOrg: resolveField('recipientOrg'),
      recipientRepresentative: resolveField('recipientRepresentative'),
      contextJustification: resolveField('contextJustification'),
      specificObjectives: resolveField('specificObjectives'),
      methodologyApproach: resolveField('methodologyApproach'),
      confidentialityClauses: resolveField('confidentialityClauses'),
      governanceModalities: resolveField('governanceModalities'),
      recommendationsLessons: resolveField('recommendationsLessons'),
      extraField1: resolveField('extraField1'),
      extraField2: resolveField('extraField2'),
      extraField3: resolveField('extraField3'),
      extraField4: resolveField('extraField4'),
      leftLogoDataUrl: findSharedImage('leftLogoDataUrl'),
      rightLogoDataUrl: findSharedImage('rightLogoDataUrl'),
      bannerImageDataUrl: findSharedImage('bannerImageDataUrl'),
      figureImageDataUrl: findSharedImage('figureImageDataUrl'),
      orgStampDataUrl: findSharedImage('orgStampDataUrl'),
      partnerStampDataUrl: findSharedImage('partnerStampDataUrl'),
      profilePhotoDataUrl: findSharedImage('profilePhotoDataUrl'),
      matricesJson: findSharedMatricesJson()
    };
  }, [selectedDocType, customDocsData, effectiveDossier, userProfile, currency, language]);

  // Liste dynamique des champs d'importation d'images ([IMAGE_...]) spécifiques au document sélectionné
  const activeImageFieldDescriptors = useMemo(
    () => getDocImageFieldDescriptors(selectedDocType),
    [selectedDocType]
  );

  // Données complètes des 10 Matrices Maîtresses (M1 - M10) pré-remplies depuis l'appli + modifications utilisateur
  const matricesData = useMemo<AllMatricesData>(
    () =>
      resolveActiveMatricesData(
        effectiveDossier,
        currentFields,
        userProfile,
        currency,
        language,
        currentFields.matricesJson
      ),
    [effectiveDossier, currentFields, userProfile, currency, language]
  );

  // Liste des matrices requises automatiquement par le document sélectionné (Doc 1 à 11)
  const docRequiredMatrixIds = useMemo<MasterMatrixId[]>(
    () => DOC_TO_MATRICES_MAP[selectedDocType] || [],
    [selectedDocType]
  );

  // Matrices visibles selon le filtre actif (Auto par Document, Toutes M1-M10, ou M1..M10 individuel)
  const visibleMatrixDefinitions = useMemo(() => {
    let baseList = MASTER_MATRICES_DEFINITIONS;
    if (matrixFilterMode === 'AUTO_DOC') {
      baseList = MASTER_MATRICES_DEFINITIONS.filter(m =>
        docRequiredMatrixIds.includes(m.id)
      );
    } else if (matrixFilterMode !== 'ALL') {
      baseList = MASTER_MATRICES_DEFINITIONS.filter(m => m.id === matrixFilterMode);
    }
    return baseList;
  }, [matrixFilterMode, docRequiredMatrixIds]);

  // Statistiques globales de complétion sur les matrices du document actif
  const activeDocMatricesStats = useMemo(() => {
    const targetIds =
      docRequiredMatrixIds.length > 0
        ? docRequiredMatrixIds
        : (MASTER_MATRICES_DEFINITIONS.map(m => m.id) as MasterMatrixId[]);
    let totalCells = 0;
    let filledCells = 0;
    let missingCells = 0;
    targetIds.forEach(mId => {
      const st = getMatrixCompletionStats(mId, matricesData[mId] || []);
      totalCells += st.totalCells;
      filledCells += st.filledCells;
      missingCells += st.missingCells;
    });
    return { totalCells, filledCells, missingCells };
  }, [docRequiredMatrixIds, matricesData]);

  // Sauvegarde d'une modification dans les matrices M1 - M10
  const persistMatricesUpdate = (nextMatrices: AllMatricesData) => {
    onUpdateDocField(selectedDocType, 'matricesJson', JSON.stringify(nextMatrices));
  };

  const handleMatrixCellChange = (
    matrixId: MasterMatrixId,
    rowIndex: number,
    colKey: string,
    newValue: string
  ) => {
    const currentRows = [...(matricesData[matrixId] || [])];
    const updatedRow = computeMatrixRowCalculations(matrixId, {
      ...(currentRows[rowIndex] || {}),
      [colKey]: newValue
    });
    currentRows[rowIndex] = updatedRow;
    persistMatricesUpdate({
      ...matricesData,
      [matrixId]: currentRows
    });
  };

  const handleAddMatrixRow = (matrixId: MasterMatrixId) => {
    const currentRows = [...(matricesData[matrixId] || [])];
    const newRow = createEmptyMatrixRow(matrixId, currentRows.length);
    currentRows.push(newRow);
    persistMatricesUpdate({
      ...matricesData,
      [matrixId]: currentRows
    });
  };

  const confirmDeleteMatrixRow = () => {
    if (!pendingMatrixRowDelete) return;
    const { matrixId, rowIndex } = pendingMatrixRowDelete;
    const currentRows = [...(matricesData[matrixId] || [])];
    currentRows.splice(rowIndex, 1);
    persistMatricesUpdate({
      ...matricesData,
      [matrixId]: currentRows
    });
    setPendingMatrixRowDelete(null);
  };

  const handleResetSingleMatrixFromApp = (matrixId: MasterMatrixId) => {
    const appDefaults = buildDefaultMatricesFromApp(
      effectiveDossier,
      currentFields,
      userProfile,
      currency,
      language
    );
    persistMatricesUpdate({
      ...matricesData,
      [matrixId]: appDefaults[matrixId]
    });
  };

  const handleResetAllMatricesFromApp = () => {
    const appDefaults = buildDefaultMatricesFromApp(
      effectiveDossier,
      currentFields,
      userProfile,
      currency,
      language
    );
    persistMatricesUpdate(appDefaults);
  };

  const handleCopyMatrixMarkdown = (matrixId: MasterMatrixId, txtVar: string) => {
    const md = serializeMatrixToMarkdown(matrixId, matricesData[matrixId] || []);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(md).catch(() => {});
    }
    setCopiedMatrixToken(txtVar);
    setTimeout(() => setCopiedMatrixToken(null), 2000);
  };

  // Build multi-page A4 document pages synchronized with all tabs & M1-M10 matrices
  const pages = useMemo(
    () =>
      buildInstitutionalDocPages(
        selectedDocType,
        currentFields,
        effectiveDossier,
        userProfile,
        currency,
        language
      ),
    [selectedDocType, currentFields, effectiveDossier, userProfile, currency, language]
  );

  const handleDownloadPDF = () => {
    generateInstitutionalDocumentPDF(
      selectedDocType,
      currentFields,
      effectiveDossier,
      userProfile,
      currency,
      language
    );
  };

  // Compress/convert uploaded image to DataURL (preserving PNG transparency for logos/stamps)
  const handleImageFileSelect = (
    imageKey: DocImageFieldKey,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const rawDataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const maxDim = 900;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const optimizedDataUrl = canvas.toDataURL('image/png');
          onUpdateDocField(selectedDocType, imageKey, optimizedDataUrl);
        } else {
          onUpdateDocField(selectedDocType, imageKey, rawDataUrl);
        }
      };
      img.onerror = () => {
        onUpdateDocField(selectedDocType, imageKey, rawDataUrl);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const confirmRemoveImage = () => {
    if (!pendingImageDelete) return;
    onUpdateDocField(selectedDocType, pendingImageDelete.key, '');
    setPendingImageDelete(null);
  };

  return (
    <div className="space-y-3 sm:space-y-5 max-w-full overflow-x-hidden">
      {/* Validation Modal before deleting an uploaded image */}
      {pendingImageDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
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
                  Confirmez-vous la suppression définitive de l’image importée pour «{' '}
                  <strong className="text-[#0c4a6e] dark:text-[#90D5FF]">
                    {pendingImageDelete.label}
                  </strong>{' '}
                  » ?
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPendingImageDelete(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmRemoveImage}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase cursor-pointer"
              >
                Valider la suppression
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Modal before deleting a Matrix Row */}
      {pendingMatrixRowDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-[#90D5FF] max-w-md w-full p-5 shadow-2xl space-y-4 text-left">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Validation de Suppression de Ligne
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  Confirmez-vous la suppression définitive de la ligne «{' '}
                  <strong className="text-[#0c4a6e] dark:text-[#90D5FF]">
                    {pendingMatrixRowDelete.rowCode}
                  </strong>{' '}
                  » dans la matrice{' '}
                  <strong className="text-[#0c4a6e] dark:text-[#90D5FF]">
                    {pendingMatrixRowDelete.matrixId}
                  </strong>{' '}
                  ?
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPendingMatrixRowDelete(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDeleteMatrixRow}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase cursor-pointer"
              >
                Supprimer la ligne
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP BAR: 11-Document Selector + Grille d'évaluation Filter + Matrices Filter Button + Axe/Projet Sync + ICON-ONLY PDF Download Button */}
      <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 p-2 sm:p-3.5 shadow-sm space-y-2 max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-2 sm:gap-3 max-w-full overflow-hidden">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-[#90D5FF]/30 text-[#0c4a6e] dark:text-[#90D5FF] flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-[10.5px] sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                Générateur de Documents Institutionnels
              </h2>
              <p className="text-[9px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {currentConfig.badgeText} • {pages.length} page(s) A4 consolidée(s)
              </p>
            </div>
          </div>

          {/* Filter Selector + Dedicated "Grille d'évaluation" Filter Button + M1-M10 Matrices Button + Icon-Only PDF Button */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-2 w-full sm:w-auto min-w-0 max-w-full">
            <select
              value={selectedDocType}
              onChange={e => setSelectedDocType(e.target.value as InstitutionalDocType)}
              aria-label="Filtre de modèle de document"
              className="min-w-0 w-0 flex-1 sm:w-64 h-7 sm:h-auto px-1.5 py-0.5 sm:px-3 sm:py-2 rounded-md sm:rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[9px] sm:text-xs font-extrabold text-slate-900 dark:text-white focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-[#90D5FF] truncate"
            >
              <optgroup label="Catégories A, B & C : Documents Institutionnels de Gestion de Projet & S&E (Docs 1 à 11)">
                {configList
                  .filter(cfg => cfg.category !== 'D')
                  .map(cfg => (
                    <option key={cfg.id} value={cfg.id}>
                      {cfg.selectLabel}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Catégorie D : Documents Opérationnels & RH (Sans Page de Garde)">
                {configList
                  .filter(cfg => cfg.category === 'D')
                  .map(cfg => (
                    <option key={cfg.id} value={cfg.id}>
                      {cfg.selectLabel}
                    </option>
                  ))}
              </optgroup>
            </select>

            {/* Quick Document Filter Button for "Grille d'évaluation" */}
            <button
              type="button"
              onClick={() => setSelectedDocType('grille_evaluation')}
              title="Filtrer sur : Grille d'évaluation (Matrice OCDE/CAD & UNEG)"
              className={`h-7 sm:h-auto px-2 py-0.5 sm:px-2.5 sm:py-2 rounded-md sm:rounded-lg border text-[8.5px] sm:text-xs font-extrabold flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
                selectedDocType === 'grille_evaluation'
                  ? 'bg-[#0c4a6e] text-[#90D5FF] border-[#90D5FF] shadow-xs'
                  : 'bg-sky-50 dark:bg-slate-800 text-[#0c4a6e] dark:text-[#90D5FF] border-sky-200 dark:border-slate-700 hover:bg-sky-100'
              }`}
            >
              <CheckSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="truncate max-w-[85px] sm:max-w-none">Grille d’évaluation</span>
            </button>

            {/* BOUTON PRINCIPAL : 📊 Filtrer & Renseigner les Matrices (M1 - M10) */}
            <button
              type="button"
              onClick={() => setIsMatricesPanelOpen(prev => !prev)}
              title="Ouvrir le panneau de filtrage et d'édition interactive des 10 Matrices Maîtresses (M1 à M10)"
              className={`h-7 sm:h-auto px-2 py-0.5 sm:px-3 sm:py-2 rounded-md sm:rounded-lg border text-[8.5px] sm:text-xs font-extrabold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                isMatricesPanelOpen
                  ? 'bg-[#0c4a6e] text-white border-[#90D5FF] shadow-sm ring-2 ring-[#90D5FF]/50'
                  : 'bg-sky-50 dark:bg-slate-800 text-[#0c4a6e] dark:text-[#90D5FF] border-[#90D5FF] dark:border-slate-700 hover:bg-sky-100'
              }`}
            >
              <span className="truncate max-w-[165px] sm:max-w-none">
                📊 Filtrer & Renseigner les Matrices (M1 - M10)
              </span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[8px] sm:text-[10px] font-black tabular-nums ${
                  isMatricesPanelOpen
                    ? 'bg-[#90D5FF] text-slate-950'
                    : 'bg-[#0c4a6e] text-[#90D5FF]'
                }`}
              >
                {docRequiredMatrixIds.length} active{docRequiredMatrixIds.length > 1 ? 's' : ''}
              </span>
              {isMatricesPanelOpen ? (
                <ChevronUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              ) : (
                <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              )}
            </button>

            {/* ICON-ONLY PDF DOWNLOAD BUTTON */}
            <button
              onClick={handleDownloadPDF}
              title={`Télécharger ${currentConfig.selectLabel} en PDF A4`}
              aria-label={`Télécharger ${currentConfig.selectLabel} en PDF A4`}
              className="w-7 h-7 sm:w-10 sm:h-10 rounded-md sm:rounded-lg bg-[#0c4a6e] hover:bg-[#075985] text-white flex items-center justify-center shadow-sm transition-all shrink-0 cursor-pointer border border-[#90D5FF]/40"
            >
              <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#90D5FF]" />
            </button>
          </div>
        </div>

        {/* Compact Filter Bar Synchronized with Other Tabs (Axe Stratégique & Projet Opérationnel) */}
        <div className="grid grid-cols-2 gap-1 sm:gap-2 pt-1.5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded border border-slate-200 dark:border-slate-700 h-6 sm:h-auto min-w-0">
            <Filter className="hidden sm:block w-3.5 h-3.5 text-[#0284c7] dark:text-[#90D5FF] shrink-0" />
            <select
              value={activeAxeFilter}
              onChange={e => handleAxeChange(e.target.value)}
              className="w-full bg-transparent text-[8.5px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate leading-none"
            >
              <option value="ALL">
                Axe : Tous ({(dossier.axes || []).length})
              </option>
              {(dossier.axes || []).map(ax => (
                <option key={ax.id} value={ax.id}>
                  {ax.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded border border-slate-200 dark:border-slate-700 h-6 sm:h-auto min-w-0">
            <Briefcase className="hidden sm:block w-3.5 h-3.5 text-[#0284c7] dark:text-[#90D5FF] shrink-0" />
            <select
              value={activeProjectFilter}
              onChange={e => handleProjectChange(e.target.value)}
              className="w-full bg-transparent text-[8.5px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate leading-none"
            >
              <option value="ALL">
                Projet : Tous ({availableProjects.length})
              </option>
              {availableProjects.map(pr => (
                <option key={pr.id} value={pr.id}>
                  {pr.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* PANNEAU INTÉGRÉ : SYSTÈME DE FILTRAGE ET D'ÉDITION INTERACTIVE DES 10 MATRICES MAÎTRESSES (M1 - M10) */}
      {isMatricesPanelOpen && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-[#90D5FF] dark:border-sky-800 p-3 sm:p-5 shadow-md space-y-4 max-w-full overflow-hidden">
          {/* En-tête du Panneau des Matrices */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-[#0c4a6e] text-[#90D5FF] text-[10px] font-black uppercase tracking-wider">
                  ARCHITECTURE M1 - M10
                </span>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  Filtrage & Renseignement Interactif des 10 Matrices Maîtresses
                </h3>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">
                Pré-remplissage automatique depuis les onglets de l’application (Dossiers, Planification, Suivi, RACI, PERT, Kanban) avec calculs temps réel et injection directe dans l’aperçu A4 et le PDF.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResetAllMatricesFromApp}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 text-[#0c4a6e] dark:text-[#90D5FF] border border-sky-200 dark:border-slate-700 text-[10px] sm:text-xs font-extrabold cursor-pointer transition-colors"
                title="Réinitialiser toutes les matrices (M1 à M10) depuis les données actuelles des onglets de l'application"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Réinitialiser depuis les champs de l’appli</span>
              </button>
              <button
                type="button"
                onClick={() => setIsMatricesPanelOpen(false)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-[10px] sm:text-xs font-bold cursor-pointer"
              >
                Réduire le panneau
              </button>
            </div>
          </div>

          {/* 3.2. BARRE DE FILTRES INTELLIGENTE (3 MODES DE FILTRAGE COMBINABLES) */}
          <div className="space-y-3 bg-slate-50/90 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            {/* Mode 1 & 3 : Filtre Automatique par Document + Filtre d'État de Complétion */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200/80 dark:border-slate-700">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0c4a6e] dark:text-[#90D5FF] mr-1">
                  1. Mode de Ciblage :
                </span>
                <button
                  type="button"
                  onClick={() => setMatrixFilterMode('AUTO_DOC')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-extrabold border transition-all cursor-pointer ${
                    matrixFilterMode === 'AUTO_DOC'
                      ? 'bg-[#0c4a6e] text-white border-[#0c4a6e] shadow-2xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-sky-50'
                  }`}
                >
                  Filtre Auto par Document ({currentConfig.selectLabel} : {docRequiredMatrixIds.length}{' '}
                  matrice{docRequiredMatrixIds.length > 1 ? 's' : ''})
                </button>
                <button
                  type="button"
                  onClick={() => setMatrixFilterMode('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-extrabold border transition-all cursor-pointer ${
                    matrixFilterMode === 'ALL'
                      ? 'bg-[#0c4a6e] text-white border-[#0c4a6e] shadow-2xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-sky-50'
                  }`}
                >
                  Toutes les Matrices (M1 - M10)
                </button>
              </div>

              {/* Mode 3 : Filtre d'État de Complétion */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0c4a6e] dark:text-[#90D5FF] mr-1">
                  3. État de Complétion :
                </span>
                <button
                  type="button"
                  onClick={() => setCompletionFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-extrabold border transition-all cursor-pointer ${
                    completionFilter === 'ALL'
                      ? 'bg-[#0284c7] text-white border-[#0284c7]'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-sky-50'
                  }`}
                >
                  Tous ({activeDocMatricesStats.totalCells})
                </button>
                <button
                  type="button"
                  onClick={() => setCompletionFilter('MISSING')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-extrabold border transition-all cursor-pointer ${
                    completionFilter === 'MISSING'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-100'
                  }`}
                >
                  Champs manquants à compléter ({activeDocMatricesStats.missingCells})
                </button>
                <button
                  type="button"
                  onClick={() => setCompletionFilter('PREFILLED')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-extrabold border transition-all cursor-pointer ${
                    completionFilter === 'PREFILLED'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  Données pré-remplies ({activeDocMatricesStats.filledCells})
                </button>
              </div>
            </div>

            {/* Mode 2 : Filtre Manuel par Matrice (Puces cliquables Toutes + M1 à M10) */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-[#0c4a6e] dark:text-[#90D5FF]">
                2. Filtre Manuel par Matrice Maîtresse :
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMatrixFilterMode('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-extrabold border transition-all cursor-pointer ${
                    matrixFilterMode === 'ALL'
                      ? 'bg-[#0c4a6e] text-[#90D5FF] border-[#0c4a6e]'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#0284c7]'
                  }`}
                >
                  Toutes
                </button>
                {MASTER_MATRICES_DEFINITIONS.map(def => {
                  const isRequiredByDoc = docRequiredMatrixIds.includes(def.id);
                  const isSelected = matrixFilterMode === def.id;
                  const stats = getMatrixCompletionStats(def.id, matricesData[def.id] || []);
                  return (
                    <button
                      key={def.id}
                      type="button"
                      onClick={() => setMatrixFilterMode(def.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-extrabold border flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0c4a6e] text-[#90D5FF] border-[#0c4a6e] shadow-2xs'
                          : isRequiredByDoc
                          ? 'bg-sky-50/90 dark:bg-slate-800 text-[#0c4a6e] dark:text-[#90D5FF] border-[#90D5FF] hover:bg-sky-100'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{def.chipLabel}</span>
                      {isRequiredByDoc && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"
                          title="Matrice requise pour le document sélectionné"
                        />
                      )}
                      {stats.missingCells > 0 && (
                        <span
                          className="px-1 rounded bg-amber-100 text-amber-800 text-[9px] font-black"
                          title={`${stats.missingCells} cellule(s) à compléter`}
                        >
                          {stats.missingCells} à compl.
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Message spécifique si Doc 1 (Courrier Administratif 1 page) est en filtre Auto */}
          {visibleMatrixDefinitions.length === 0 ? (
            <div className="p-4 rounded-xl bg-sky-50/70 dark:bg-slate-800/70 border border-sky-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-xs font-black uppercase text-[#0c4a6e] dark:text-[#90D5FF]">
                  Protocole Catégorie A — Courrier Administratif Classique (1 Page Stricte)
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Conformément aux normes internationales d’édition, le Courrier Administratif d’une page ne comporte aucune matrice lourde par défaut. Vous pouvez toutefois consulter ou éditer manuellement n’importe quelle matrice (M1 à M10) en cliquant sur les puces ci-dessus.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMatrixFilterMode('ALL')}
                className="px-3 py-1.5 rounded-lg bg-[#0c4a6e] text-white text-xs font-extrabold shrink-0 cursor-pointer hover:bg-[#075985]"
              >
                Afficher toutes les matrices (M1 - M10)
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {visibleMatrixDefinitions.map(def => {
                const allRowsForMatrix = matricesData[def.id] || [];
                const stats = getMatrixCompletionStats(def.id, allRowsForMatrix);
                const editableCols = def.columns.filter(c => c.inputType !== 'computed');

                // Filtrage des lignes selon completionFilter
                const filteredRowEntries = allRowsForMatrix
                  .map((row, idx) => ({ row, originalIndex: idx }))
                  .filter(({ row }) => {
                    if (completionFilter === 'ALL') return true;
                    const hasMissing = editableCols.some(
                      c => !(row[c.key] || '').trim()
                    );
                    const hasFilled = editableCols.some(
                      c => Boolean((row[c.key] || '').trim())
                    );
                    if (completionFilter === 'MISSING') return hasMissing;
                    if (completionFilter === 'PREFILLED') return hasFilled && !hasMissing;
                    return true;
                  });

                return (
                  <div
                    key={def.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs overflow-hidden"
                  >
                    {/* En-tête de la Matrice */}
                    <div className="p-3 sm:p-4 bg-sky-50/70 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-[#0c4a6e] text-[#90D5FF] text-[10px] font-black uppercase">
                            {def.id}
                          </span>
                          <h4 className="text-xs sm:text-sm font-black uppercase text-[#0c4a6e] dark:text-[#90D5FF] break-words">
                            {def.fullTitle}
                          </h4>
                          <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[9.5px] font-extrabold">
                            {stats.filledCells}/{stats.totalCells} pré-remplis
                          </span>
                          {stats.missingCells > 0 && (
                            <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[9.5px] font-extrabold">
                              {stats.missingCells} à compléter
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>
                            <strong>Référentiel :</strong> {def.normativeRef}
                          </span>
                          <span>•</span>
                          <span>
                            <strong>Documents associés :</strong> {def.associatedDocsLabels}
                          </span>
                        </div>
                      </div>

                      {/* Boutons d'action par matrice : Variable [TXT_...], + Ajouter une ligne, Réinitialiser */}
                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyMatrixMarkdown(def.id, def.txtVariable)}
                          title={`Copier la table Markdown sérialisée pour la variable ${def.txtVariable}`}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[9.5px] sm:text-[10.5px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                        >
                          {copiedMatrixToken === def.txtVariable ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600">Copié {def.txtVariable}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-[#0284c7]" />
                              <span>{def.txtVariable}</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAddMatrixRow(def.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0c4a6e] hover:bg-[#075985] text-white text-[10px] sm:text-xs font-extrabold cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#90D5FF]" />
                          <span>+ Ajouter une ligne</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleResetSingleMatrixFromApp(def.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-100/80 dark:bg-slate-800 hover:bg-sky-200/70 text-[#0c4a6e] dark:text-[#90D5FF] text-[10px] sm:text-xs font-bold cursor-pointer transition-colors"
                          title="Réinitialiser cette matrice depuis les champs de l'application"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Réinitialiser depuis les champs de l’appli</span>
                        </button>
                      </div>
                    </div>

                    {/* Tableau interactif à défilement horizontal fluide et en-têtes figés */}
                    {filteredRowEntries.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                        Aucune ligne ne correspond au filtre d’état «{' '}
                        {completionFilter === 'MISSING'
                          ? 'Champs manquants à compléter'
                          : 'Données pré-remplies'}
                        » pour {def.chipLabel}.{' '}
                        <button
                          type="button"
                          onClick={() => setCompletionFilter('ALL')}
                          className="text-[#0284c7] font-bold underline cursor-pointer ml-1"
                        >
                          Afficher toutes les lignes ({allRowsForMatrix.length})
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto max-h-[420px]">
                        <table className="w-full border-collapse text-left text-[10.5px] sm:text-xs">
                          <thead className="sticky top-0 z-10 bg-[#0c4a6e] text-white shadow-2xs">
                            <tr>
                              {def.columns.map(col => (
                                <th
                                  key={col.key}
                                  style={{ minWidth: col.minWidthPx ? `${col.minWidthPx}px` : '130px' }}
                                  className={`px-2.5 py-2 font-black uppercase tracking-wider border-r border-sky-800 text-[9.5px] sm:text-[10px] leading-tight ${
                                    col.isRightAligned ? 'text-right' : 'text-left'
                                  }`}
                                >
                                  <div>{col.label}</div>
                                  {col.helperFormula && (
                                    <div className="text-[8.5px] font-semibold text-[#90D5FF] normal-case mt-0.5">
                                      Formule : {col.helperFormula}
                                    </div>
                                  )}
                                </th>
                              ))}
                              <th className="px-2.5 py-2 font-black uppercase tracking-wider text-center text-[9.5px] sm:text-[10px] w-24 shrink-0">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {filteredRowEntries.map(({ row, originalIndex }) => {
                              const firstColKey = def.columns[0]?.key || 'Code';
                              const rowCodeLabel =
                                row[firstColKey] || `Ligne #${originalIndex + 1}`;
                              return (
                                <tr
                                  key={originalIndex}
                                  className="hover:bg-sky-50/40 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                  {def.columns.map(col => {
                                    const cellVal = row[col.key] ?? '';
                                    const isMissing =
                                      col.inputType !== 'computed' &&
                                      cellVal.trim() === '';

                                    if (col.inputType === 'computed') {
                                      return (
                                        <td
                                          key={col.key}
                                          className="px-2.5 py-2 bg-sky-50/70 dark:bg-slate-800/90 border-r border-slate-200 dark:border-slate-800 align-top text-right font-black tabular-nums text-[#0c4a6e] dark:text-[#90D5FF]"
                                        >
                                          <div className="px-2 py-1 rounded bg-white/90 dark:bg-slate-900 border border-sky-200 dark:border-slate-700 inline-block min-w-[70px] text-right">
                                            {cellVal || '0%'}
                                          </div>
                                          <div className="text-[8px] font-bold uppercase text-[#0284c7] dark:text-sky-400 mt-0.5">
                                            Calcul auto
                                          </div>
                                        </td>
                                      );
                                    }

                                    return (
                                      <td
                                        key={col.key}
                                        className={`p-1.5 border-r border-slate-200 dark:border-slate-800 align-top ${
                                          isMissing
                                            ? 'bg-amber-50/60 dark:bg-amber-950/20'
                                            : ''
                                        }`}
                                      >
                                        {col.inputType === 'select' && col.options ? (
                                          <select
                                            value={cellVal}
                                            onChange={e =>
                                              handleMatrixCellChange(
                                                def.id,
                                                originalIndex,
                                                col.key,
                                                e.target.value
                                              )
                                            }
                                            className="w-full px-2 py-1.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#90D5FF]"
                                          >
                                            {col.options.map(opt => (
                                              <option key={opt} value={opt}>
                                                {opt}
                                              </option>
                                            ))}
                                          </select>
                                        ) : col.inputType === 'textarea' ? (
                                          <textarea
                                            rows={2}
                                            value={cellVal}
                                            placeholder={col.placeholder || 'À compléter...'}
                                            onChange={e =>
                                              handleMatrixCellChange(
                                                def.id,
                                                originalIndex,
                                                col.key,
                                                e.target.value
                                              )
                                            }
                                            className={`w-full px-2 py-1 rounded-md bg-white dark:bg-slate-800 border text-[11px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#90D5FF] ${
                                              isMissing
                                                ? 'border-amber-400 dark:border-amber-600'
                                                : 'border-slate-200 dark:border-slate-700'
                                            }`}
                                          />
                                        ) : (
                                          <input
                                            type={
                                              col.inputType === 'date'
                                                ? 'date'
                                                : col.inputType === 'number'
                                                ? 'number'
                                                : 'text'
                                            }
                                            value={cellVal}
                                            placeholder={col.placeholder || 'À compléter...'}
                                            onChange={e =>
                                              handleMatrixCellChange(
                                                def.id,
                                                originalIndex,
                                                col.key,
                                                e.target.value
                                              )
                                            }
                                            className={`w-full px-2 py-1.5 rounded-md bg-white dark:bg-slate-800 border text-[11px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#90D5FF] ${
                                              col.isRightAligned
                                                ? 'text-right font-bold tabular-nums'
                                                : ''
                                            } ${
                                              isMissing
                                                ? 'border-amber-400 dark:border-amber-600'
                                                : 'border-slate-200 dark:border-slate-700'
                                            }`}
                                          />
                                        )}
                                        {isMissing && (
                                          <div className="mt-0.5 text-[8.5px] font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                                            <span>⚠ À compléter</span>
                                          </div>
                                        )}
                                      </td>
                                    );
                                  })}

                                  {/* Bouton Supprimer la ligne */}
                                  <td className="p-1.5 text-center align-middle">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPendingMatrixRowDelete({
                                          matrixId: def.id,
                                          rowIndex: originalIndex,
                                          rowCode: rowCodeLabel
                                        })
                                      }
                                      title="Supprimer la ligne"
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-[10px] font-bold cursor-pointer transition-colors"
                                    >
                                      <Trash2 className="w-3 h-3 shrink-0" />
                                      <span>Supprimer</span>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MAIN CONTENT: STACKED ON MOBILE, SIDE-BY-SIDE ON TABLET & DESKTOP (LEFT: CHAMPS SPÉCIFIQUES ALIGNED, RIGHT: A4 PDF PREVIEW) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-5 items-start">
        {/* LEFT COLUMN (TABLET & DESKTOP): SPECIFIC SUPPLEMENTARY FORM FIELDS + IMAGE UPLOAD FIELDS ALIGNED */}
        <div className="md:col-span-5 lg:col-span-4 h-auto bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 sm:p-4 pb-6 shadow-sm space-y-2.5 sm:space-y-3.5 max-w-full">
          <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 pb-2 sm:pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0284c7] dark:text-[#90D5FF] shrink-0" />
              <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white truncate">
                Champs Spécifiques — {currentConfig.selectLabel}
              </h3>
            </div>
            <button
              onClick={() => onResetDocDefaults(selectedDocType)}
              className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-sky-50 dark:bg-slate-800 text-[#0c4a6e] dark:text-[#90D5FF] text-[9px] sm:text-[10px] font-bold hover:bg-sky-100 transition-colors cursor-pointer max-w-full truncate"
              title="Restaurer et synchroniser automatiquement avec les données des autres onglets"
            >
              <Sparkles className="w-3 h-3 shrink-0" />
              <span className="truncate">Synchroniser avec les onglets</span>
            </button>
          </div>

          <p className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
            {currentConfig.subtitle} ({currentConfig.normativeReference}). Toutes les données des autres onglets (Dossiers & Projets, Planification, Suivi des tâches, RACI, Réseau PERT, Kanban, Gantt, Tableau de Bord et Profil Utilisateur) sont récupérées automatiquement.
          </p>

          {/* SECTION : CHAMPS D'IMPORTATION D'IMAGES & LOGOS OFFICIELS */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-sky-50/60 dark:bg-slate-800/60 border border-[#90D5FF]/70 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#0c4a6e] dark:text-[#90D5FF]">
              <ImagePlus className="w-3.5 h-3.5 shrink-0" />
              <span>Champs d’Importation d’Images & Logos</span>
            </div>
            <p className="text-[9px] sm:text-[10px] text-slate-600 dark:text-slate-400 leading-tight">
              Importez les logos, bannières, figures et cachets/signatures pour les différentes parties du document A4 :
            </p>

            <div className="grid grid-cols-1 gap-2">
              {activeImageFieldDescriptors.map(imgField => {
                const currentImgUrl = currentFields[imgField.key];
                return (
                  <div
                    key={imgField.key}
                    className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="min-w-0">
                        <div className="text-[9.5px] sm:text-[10.5px] font-extrabold text-slate-800 dark:text-slate-100 truncate">
                          {imgField.label}
                        </div>
                        <div className="text-[8.5px] font-bold text-[#0284c7] dark:text-[#90D5FF] truncate">
                          Emplacement : {imgField.targetSection}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <label className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#0c4a6e] hover:bg-[#075985] text-white text-[8.5px] sm:text-[9.5px] font-bold cursor-pointer transition-colors">
                          <ImagePlus className="w-3 h-3 text-[#90D5FF]" />
                          <span>{currentImgUrl ? 'Changer' : 'Importer'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => handleImageFileSelect(imgField.key, e)}
                            className="hidden"
                          />
                        </label>
                        {currentImgUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setPendingImageDelete({
                                key: imgField.key,
                                label: imgField.label
                              })
                            }
                            title="Supprimer cette image (validation requise)"
                            className="p-1 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {currentImgUrl ? (
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <img
                          src={currentImgUrl}
                          alt={imgField.label}
                          className="h-10 w-auto max-w-[110px] object-contain rounded border border-slate-200 bg-white p-0.5"
                        />
                        <span className="text-[8.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                          ✓ Image insérée dans le document
                        </span>
                      </div>
                    ) : (
                      <div className="text-[8.5px] text-slate-400 leading-tight">
                        {imgField.helperText}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION : CHAMPS TEXTUELS SPÉCIFIQUES DU DOCUMENT */}
          <div className="grid grid-cols-1 gap-3">
            {currentConfig.fields.map((field: DocFieldDescriptor) => {
              const val = (currentFields[field.key] as string) || '';

              return (
                <div key={String(field.key)} className="col-span-1">
                  <label className="block text-[10.5px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 text-left">
                    {field.label}
                  </label>
                  {field.multiline ? (
                    <textarea
                      rows={field.rows || 3}
                      value={val}
                      onChange={e =>
                        onUpdateDocField(selectedDocType, field.key, e.target.value)
                      }
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#90D5FF]"
                    />
                  ) : (
                    <input
                      type="text"
                      value={val}
                      onChange={e =>
                        onUpdateDocField(selectedDocType, field.key, e.target.value)
                      }
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#90D5FF]"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN (TABLET & DESKTOP): MULTI-PAGE A4 DOCUMENT PREVIEW */}
        <div className="md:col-span-7 lg:col-span-8 min-w-0 space-y-6 overflow-x-auto pb-8">
          {pages.map((page, pageIdx) => (
            <React.Fragment key={pageIdx}>
              {pageIdx > 0 && (
                <div className="flex items-center gap-3 px-2 select-none" aria-hidden="true">
                  <div className="flex-1 border-t-2 border-dashed border-sky-300 dark:border-slate-700" />
                  <span className="px-2.5 py-0.5 rounded bg-sky-100 dark:bg-slate-800 text-[9px] font-black uppercase tracking-widest text-[#0c4a6e] dark:text-[#90D5FF]">
                    --- SAUT DE PAGE A4 (PAGE {pageIdx + 1} / {pages.length}) ---
                  </span>
                  <div className="flex-1 border-t-2 border-dashed border-sky-300 dark:border-slate-700" />
                </div>
              )}

              <div className="a4-page flex flex-col justify-between overflow-hidden">
                <div className="min-w-0">
                  {/* Institutional Header */}
                  <div className="border-b-2 border-[#0c4a6e] pb-3 mb-5 flex items-start justify-between gap-3 min-w-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {currentFields.rightLogoDataUrl ? (
                        <img
                          src={currentFields.rightLogoDataUrl}
                          alt="Logo Agence d'Exécution"
                          className="w-11 h-11 object-contain rounded bg-white p-0.5 border border-slate-200 shrink-0"
                        />
                      ) : (
                        <AppLogo className="w-11 h-11 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-black uppercase tracking-wider text-[#0c4a6e] leading-[1.2] break-words">
                          {page.pageTitle}
                        </div>
                        <div className="text-[10.5px] font-bold text-slate-600 leading-[1.3] break-words mt-0.5">
                          {page.pageSubtitle}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-[10px] font-bold text-slate-500 shrink-0 max-w-[155px] break-words">
                      <div className="font-extrabold text-[#0c4a6e]">Réf: {currentFields.referenceCode}</div>
                      <div className="text-[#0284c7]">{currentFields.locationCity}</div>
                    </div>
                  </div>

                  {/* Page Sections */}
                  <div className="space-y-6 min-w-0">
                    {page.sections.map((sec, sIdx) => (
                      <div key={sIdx} className="space-y-3 min-w-0">
                        <h3 className="text-xs font-black uppercase tracking-wider text-[#0c4a6e] bg-sky-50 px-3 py-1.5 rounded-lg border-l-4 border-[#0284c7] leading-[1.2] break-words">
                          {sec.heading}
                        </h3>

                        {/* Official Cover Page Placement Chart (Page 1) */}
                        {sec.coverChart && (
                          <div className="rounded-xl border-2 border-[#0c4a6e] bg-white p-4 sm:p-5 shadow-sm space-y-5 overflow-hidden">
                            {/* Top Logos Row */}
                            <div className="grid grid-cols-2 gap-3 border-b border-dashed border-slate-300 pb-3">
                              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-left flex flex-col justify-between min-w-0">
                                <div className="text-[9px] font-black uppercase tracking-wider text-[#0284c7]">
                                  (Aligné en haut à gauche)
                                </div>
                                {sec.coverChart.leftLogoDataUrl && (
                                  <div className="my-2 flex justify-start">
                                    <img
                                      src={sec.coverChart.leftLogoDataUrl}
                                      alt="Logo Bailleur / Commanditaire"
                                      className="max-h-16 max-w-[150px] object-contain rounded bg-white p-1 border border-slate-200 shadow-2xs"
                                    />
                                  </div>
                                )}
                                <div className="text-[10.5px] font-extrabold text-slate-900 whitespace-pre-line break-words mt-0.5">
                                  {sec.coverChart.leftLogo}
                                </div>
                              </div>
                              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-right flex flex-col justify-between min-w-0">
                                <div className="text-[9px] font-black uppercase tracking-wider text-[#0284c7]">
                                  (Aligné en haut à droite)
                                </div>
                                {sec.coverChart.rightLogoDataUrl && (
                                  <div className="my-2 flex justify-end">
                                    <img
                                      src={sec.coverChart.rightLogoDataUrl}
                                      alt="Logo Agence d'Exécution"
                                      className="max-h-16 max-w-[150px] object-contain rounded bg-white p-1 border border-slate-200 shadow-2xs"
                                    />
                                  </div>
                                )}
                                <div className="text-[10.5px] font-extrabold text-slate-900 whitespace-pre-line break-words mt-0.5">
                                  {sec.coverChart.rightLogo}
                                </div>
                              </div>
                            </div>

                            {/* Centered Visual Intervention Banner */}
                            <div className="rounded-xl bg-[#0c4a6e] text-white p-5 border-b-4 border-[#90D5FF] text-center space-y-2.5">
                              <div className="inline-block px-3 py-0.5 rounded-full bg-[#90D5FF] text-slate-950 text-[9.5px] font-black uppercase tracking-widest max-w-full break-words">
                                {currentConfig.badgeText}
                              </div>
                              {sec.coverChart.bannerImageDataUrl && (
                                <div className="my-2 flex justify-center">
                                  <img
                                    src={sec.coverChart.bannerImageDataUrl}
                                    alt="Bannière de l'Intervention"
                                    className="max-h-40 w-auto max-w-full object-contain rounded-lg border-2 border-[#90D5FF] bg-white/95 p-1 shadow-md"
                                  />
                                </div>
                              )}
                              <div className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#90D5FF] whitespace-pre-line break-words leading-[1.25]">
                                {sec.coverChart.bannerTitle}
                              </div>
                              <div className="text-[10px] text-sky-100 italic break-words">
                                {sec.coverChart.bannerSubtitle}
                              </div>
                            </div>

                            {/* Centered Document Title & Subtitle / Project Code */}
                            <div className="py-4 px-3 rounded-xl bg-sky-50/70 border border-sky-200 text-center space-y-1.5">
                              <div className="text-base sm:text-lg font-black uppercase tracking-tight text-[#0c4a6e] leading-[1.2] break-words">
                                {sec.coverChart.docTitle}
                              </div>
                              <div className="text-[11px] font-extrabold text-slate-700 whitespace-pre-line break-words leading-[1.4]">
                                {sec.coverChart.docSubtitle}
                              </div>
                            </div>

                            {/* Bottom Metadata Row */}
                            <div className="grid grid-cols-2 gap-3 border-t border-dashed border-slate-300 pt-3">
                              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-left space-y-1.5 min-w-0">
                                <div className="text-[10px] font-extrabold text-slate-800 whitespace-pre-line break-words">
                                  {sec.coverChart.bottomLeftStructure}
                                </div>
                                <div className="text-[10px] font-bold text-[#0284c7] whitespace-pre-line break-words">
                                  {sec.coverChart.bottomLeftZone}
                                </div>
                              </div>
                              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-right space-y-1.5 min-w-0">
                                <div className="text-[10px] font-extrabold text-slate-800 whitespace-pre-line break-words">
                                  {sec.coverChart.bottomRightDateVersion}
                                </div>
                                <div className="text-[10px] font-black text-emerald-700 whitespace-pre-line break-words">
                                  {sec.coverChart.bottomRightStatus}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Classic 1-Page Administrative Letter Header Block */}
                        {sec.adminLetterHeader && (
                          <div className="rounded-xl border-2 border-[#0c4a6e] bg-white p-4 shadow-sm space-y-3.5 overflow-hidden">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b border-dashed border-slate-300">
                              {/* Left: Timbre / Expéditeur */}
                              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-left space-y-1 min-w-0">
                                <div className="text-[9px] font-black uppercase tracking-wider text-[#0284c7]">
                                  EXPÉDITEUR / TIMBRE OFFICIEL
                                </div>
                                {(sec.adminLetterHeader.rightLogoDataUrl ||
                                  sec.adminLetterHeader.leftLogoDataUrl) && (
                                  <div className="py-1 flex justify-start gap-2">
                                    {sec.adminLetterHeader.rightLogoDataUrl && (
                                      <img
                                        src={sec.adminLetterHeader.rightLogoDataUrl}
                                        alt="Logo Structure Émettrice"
                                        className="max-h-12 max-w-[120px] object-contain rounded bg-white p-0.5 border border-slate-200"
                                      />
                                    )}
                                    {sec.adminLetterHeader.leftLogoDataUrl && (
                                      <img
                                        src={sec.adminLetterHeader.leftLogoDataUrl}
                                        alt="Logo Partenaire"
                                        className="max-h-12 max-w-[120px] object-contain rounded bg-white p-0.5 border border-slate-200"
                                      />
                                    )}
                                  </div>
                                )}
                                <div className="text-[11px] font-black uppercase text-[#0c4a6e] break-words">
                                  {sec.adminLetterHeader.senderInstitution}
                                </div>
                                <div className="text-[10.5px] font-extrabold text-slate-900 break-words">
                                  {sec.adminLetterHeader.senderName} — {sec.adminLetterHeader.senderRole}
                                </div>
                                <div className="text-[9.5px] text-slate-600 break-words">
                                  {sec.adminLetterHeader.senderContact}
                                </div>
                                <div className="pt-1 text-[10px] font-black text-[#0c4a6e] break-words">
                                  N° Réf : {sec.adminLetterHeader.referenceCode}
                                </div>
                              </div>

                              {/* Right: Lieu, Date & Destinataire */}
                              <div className="p-3 rounded-lg bg-sky-50/50 border border-sky-200 text-left sm:text-right flex flex-col justify-between space-y-2 min-w-0">
                                <div className="text-[10.5px] font-extrabold text-slate-800 break-words">
                                  {sec.adminLetterHeader.cityAndDate}
                                </div>
                                <div className="space-y-1">
                                  <div className="text-[9px] font-black uppercase tracking-wider text-[#0284c7]">
                                    À L’ATTENTION DE :
                                  </div>
                                  <div className="text-[11px] font-black text-slate-900 break-words">
                                    {sec.adminLetterHeader.recipientTitle}
                                  </div>
                                  <div className="text-[10.5px] font-extrabold text-[#0c4a6e] break-words">
                                    {sec.adminLetterHeader.recipientOrg}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Subject / Objet & Dossier Ref */}
                            <div className="p-3 rounded-lg bg-sky-50/80 border-l-4 border-[#0c4a6e] space-y-1 text-left">
                              <div className="text-[11px] font-black text-[#0c4a6e] break-words">
                                <span className="underline">OBJET</span> :{' '}
                                <span className="text-slate-900 font-extrabold">
                                  {sec.adminLetterHeader.subjectLine}
                                </span>
                              </div>
                              <div className="text-[10px] font-bold text-slate-600 break-words tabular-nums">
                                <span className="font-black text-[#0284c7]">RÉF. DOSSIER :</span>{' '}
                                {sec.adminLetterHeader.dossierRefLine}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Catégorie D (Docs 12 & 13) : Bandeau d'En-tête CV Exécutif / Détaillé avec Photo Portrait 3.5cm x 4.5cm à droite (Ratio 75% / 25%) */}
                        {sec.cvHeaderBanner && (
                          <div className="rounded-xl border-2 border-[#0c4a6e] bg-white p-4 shadow-sm overflow-hidden">
                            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                              {/* Colonne Gauche (75% de largeur) : Identité, Titre & Coordonnées */}
                              <div className="w-full sm:w-3/4 space-y-2 text-left min-w-0">
                                <div className="inline-block px-2.5 py-0.5 rounded-md bg-[#0c4a6e] text-[#90D5FF] text-[9px] font-black uppercase tracking-widest">
                                  {sec.cvHeaderBanner.docBadge}
                                </div>
                                <div className="text-base sm:text-lg font-black uppercase tracking-tight text-[#0c4a6e] leading-tight break-words">
                                  {sec.cvHeaderBanner.fullNameUpper}
                                </div>
                                <div className="text-xs font-extrabold text-[#0284c7] leading-snug break-words">
                                  {sec.cvHeaderBanner.expertTitleLine}
                                </div>
                                <div className="text-[10.5px] font-bold text-slate-700 leading-relaxed break-words pt-1 border-t border-slate-200">
                                  {sec.cvHeaderBanner.contactLine}
                                </div>
                                {sec.cvHeaderBanner.metaSubLine && (
                                  <div className="p-2 rounded-lg bg-sky-50/80 border border-sky-200 text-[10px] font-semibold text-slate-800 whitespace-pre-line break-words leading-snug">
                                    {sec.cvHeaderBanner.metaSubLine}
                                  </div>
                                )}
                              </div>

                              {/* Colonne Droite (25% de largeur) : Cadre Photo Fixe 3.5 cm x 4.5 cm (object-fit: cover, border: 1px solid #ccc) */}
                              <div className="w-full sm:w-1/4 flex flex-col items-center sm:items-end justify-start shrink-0">
                                <div
                                  style={{ width: '3.5cm', height: '4.5cm', boxSizing: 'border-box' }}
                                  className="rounded-md border border-slate-300 bg-slate-50 overflow-hidden flex flex-col items-center justify-center shadow-2xs shrink-0"
                                >
                                  {sec.cvHeaderBanner.profilePhotoDataUrl ? (
                                    <img
                                      src={sec.cvHeaderBanner.profilePhotoDataUrl}
                                      alt="Photo de profil de l'Expert"
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                  ) : (
                                    <div className="p-2 text-center space-y-1">
                                      <div className="text-[8.5px] font-black uppercase text-[#0c4a6e]">
                                        [IMAGE_PHOTO_PROFIL]
                                      </div>
                                      <div className="text-[8px] font-semibold text-slate-500 leading-tight">
                                        Photo Identité Pro
                                        <br />
                                        (3.5 cm × 4.5 cm)
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Catégorie D (Docs 14 & 15) : Bandeau d'En-tête Opérationnel sans Page de Garde (Logos H: 1.5 cm Gauche / Droite) */}
                        {sec.operationalHeaderBanner && (
                          <div className="rounded-xl border-2 border-[#0c4a6e] bg-white p-3.5 shadow-sm space-y-2.5 overflow-hidden">
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pb-2.5 border-b border-dashed border-slate-300">
                              {/* Gauche : [IMAGE_LOGO_EMETTEUR] (H: 1.5 cm) */}
                              <div className="sm:col-span-3 p-2 rounded-lg bg-slate-50 border border-slate-200 text-left flex flex-col items-start justify-center min-w-0">
                                {sec.operationalHeaderBanner.rightLogoDataUrl ? (
                                  <img
                                    src={sec.operationalHeaderBanner.rightLogoDataUrl}
                                    alt="Logo Émetteur"
                                    style={{ height: '1.5cm' }}
                                    className="w-auto max-w-full object-contain rounded bg-white p-0.5 border border-slate-200 mb-1"
                                  />
                                ) : (
                                  <div className="text-[8px] font-black uppercase text-[#0284c7] mb-0.5">
                                    [IMAGE_LOGO_EMETTEUR] (H: 1.5cm)
                                  </div>
                                )}
                                <div className="text-[9.5px] font-extrabold text-slate-800 whitespace-pre-line break-words leading-tight">
                                  {sec.operationalHeaderBanner.leftLogoLabel}
                                </div>
                              </div>

                              {/* Centre : Titre du Document & Sous-titre du Projet */}
                              <div className="sm:col-span-6 p-2.5 rounded-lg bg-[#0c4a6e] text-white text-center space-y-1 border-b-2 border-[#90D5FF]">
                                <div className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#90D5FF] break-words leading-tight">
                                  {sec.operationalHeaderBanner.centerDocTitle}
                                </div>
                                <div className="text-[10px] font-bold text-white break-words leading-snug">
                                  {sec.operationalHeaderBanner.centerSubTitle}
                                </div>
                                <div className="text-[9px] text-sky-200 font-semibold break-words">
                                  {sec.operationalHeaderBanner.referenceAndDateLine}
                                </div>
                              </div>

                              {/* Droite : [IMAGE_LOGO_PARTENAIRE_BAILLEUR] (H: 1.5 cm) */}
                              <div className="sm:col-span-3 p-2 rounded-lg bg-slate-50 border border-slate-200 text-right flex flex-col items-end justify-center min-w-0">
                                {sec.operationalHeaderBanner.leftLogoDataUrl ? (
                                  <img
                                    src={sec.operationalHeaderBanner.leftLogoDataUrl}
                                    alt="Logo Partenaire / Bailleur"
                                    style={{ height: '1.5cm' }}
                                    className="w-auto max-w-full object-contain rounded bg-white p-0.5 border border-slate-200 mb-1"
                                  />
                                ) : (
                                  <div className="text-[8px] font-black uppercase text-[#0284c7] mb-0.5">
                                    [IMAGE_LOGO_PARTENAIRE_BAILLEUR] (H: 1.5cm)
                                  </div>
                                )}
                                <div className="text-[9.5px] font-extrabold text-slate-800 whitespace-pre-line break-words leading-tight">
                                  {sec.operationalHeaderBanner.rightLogoLabel}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {sec.keyValueRows && sec.keyValueRows.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                            {sec.keyValueRows.map(([k, v], kIdx) => {
                              const hasCurrency = /\b(FCFA|EUR|USD)\b/.test(v);
                              return (
                                <div
                                  key={kIdx}
                                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 min-w-0"
                                >
                                  <div className="text-[9px] font-bold uppercase text-slate-400 break-words">
                                    {k}
                                  </div>
                                  <div
                                    className={`text-[10.5px] font-extrabold mt-0.5 whitespace-normal break-words [overflow-wrap:anywhere] leading-[1.4] ${
                                      hasCurrency ? 'text-[#0c4a6e] tabular-nums' : 'text-slate-900'
                                    }`}
                                  >
                                    {v}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {sec.paragraphs &&
                          sec.paragraphs.map((p, pIdx) => (
                            <p
                              key={pIdx}
                              className="text-[11px] leading-[1.5] text-slate-700 text-justify whitespace-pre-line break-words px-1"
                            >
                              {p}
                            </p>
                          ))}

                        {sec.bullets && sec.bullets.length > 0 && (
                          <ul className="list-disc pl-5 space-y-1.5 text-[11px] leading-[1.5] text-slate-700">
                            {sec.bullets.map((bItem, bIdx) => (
                              <li key={bIdx} className="leading-[1.5] break-words">
                                {bItem}
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* Uploaded Figure / Technical Illustration Image */}
                        {sec.figureImage && sec.figureImage.dataUrl && (
                          <div className="my-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2 break-inside-avoid">
                            <img
                              src={sec.figureImage.dataUrl}
                              alt={sec.figureImage.caption}
                              className="max-h-52 w-auto mx-auto object-contain rounded-lg border border-slate-200 bg-white p-1.5 shadow-xs"
                            />
                            <div className="text-[10px] font-extrabold text-[#0c4a6e] italic break-words">
                              {sec.figureImage.caption}
                            </div>
                          </div>
                        )}

                        {/* Anti-Overflow Fixed-Layout Table with Explicit Column Width Ratios & Clean Amount Styling */}
                        {sec.table && (
                          <div className="pt-1 w-full overflow-hidden break-inside-avoid">
                            <table className="w-full table-fixed border-collapse text-[8.5px] sm:text-[9px] leading-[1.45]">
                              {sec.table.columnWidths &&
                                sec.table.columnWidths.length === sec.table.headers.length && (
                                  <colgroup>
                                    {sec.table.columnWidths.map((w, colIdx) => (
                                      <col key={colIdx} style={{ width: `${w}%` }} />
                                    ))}
                                  </colgroup>
                                )}
                              <thead>
                                <tr className="bg-[#0c4a6e] text-white">
                                  {sec.table.headers.map((h, hIdx) => {
                                    const isRightAligned = sec.table?.rightAlignCols?.includes(hIdx);
                                    return (
                                      <th
                                        key={hIdx}
                                        className={`px-1.5 py-1.5 font-black uppercase border border-[#0c4a6e] break-words [overflow-wrap:anywhere] leading-[1.2] align-middle ${
                                          isRightAligned ? 'text-right' : 'text-left'
                                        }`}
                                      >
                                        {h}
                                      </th>
                                    );
                                  })}
                                </tr>
                              </thead>
                              <tbody>
                                {sec.table.rows.map((row, rIdx) => {
                                  const isTotalRow =
                                    row[0]?.startsWith('TOTAL') ||
                                    row[0]?.startsWith('SCORE GLOBAL') ||
                                    row[0]?.startsWith('NOTE GLOBALE');
                                  return (
                                    <tr
                                      key={rIdx}
                                      className={
                                        isTotalRow
                                          ? 'bg-sky-50/90 font-extrabold'
                                          : rIdx % 2 === 0
                                          ? 'bg-white'
                                          : 'bg-slate-50'
                                      }
                                    >
                                      {row.map((cell, cIdx) => {
                                        const isRightCol = sec.table?.rightAlignCols?.includes(cIdx);
                                        const isMonetaryCell = /\b(FCFA|EUR|USD)\b/.test(cell);
                                        return (
                                          <td
                                            key={cIdx}
                                            className={`px-1.5 py-1.5 border border-slate-200 whitespace-pre-line break-words [overflow-wrap:anywhere] align-top ${
                                              isRightCol || isMonetaryCell
                                                ? 'text-right font-extrabold tabular-nums text-[#0c4a6e]'
                                                : cIdx === 0
                                                ? 'font-bold text-slate-900'
                                                : 'text-slate-800'
                                            }`}
                                          >
                                            {cell}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Official Signature Block on final page */}
                    {page.isSignaturePage && (
                      <div className="mt-6 pt-4 border-t-2 border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-xs break-inside-avoid">
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 min-w-0">
                          <div className="font-black uppercase text-[#0c4a6e] text-[10px] break-words">
                            POUR L’ORGANISATION ({userProfile.institution || 'AUTORITÉ PILOTE'})
                          </div>
                          <div className="text-[11px] font-bold text-slate-800 break-words">
                            {userProfile.fullName} — {userProfile.role}
                          </div>
                          {page.orgStampDataUrl && (
                            <div className="py-1.5">
                              <img
                                src={page.orgStampDataUrl}
                                alt="Signature et Cachet Organisation"
                                className="max-h-16 w-auto object-contain rounded bg-white p-1 border border-slate-200"
                              />
                            </div>
                          )}
                          <div className="text-[10px] text-slate-500 pt-2">
                            Signature & Cachet Officiel : _______________________
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 min-w-0">
                          <div className="font-black uppercase text-[#0c4a6e] text-[10px] break-words">
                            POUR LA PARTIE PRENANTE ({currentFields.recipientOrg || 'PARTENAIRE'})
                          </div>
                          <div className="text-[11px] font-bold text-slate-800 break-words">
                            {currentFields.recipientRepresentative || 'Représentant Habilité'}
                          </div>
                          {page.partnerStampDataUrl && (
                            <div className="py-1.5">
                              <img
                                src={page.partnerStampDataUrl}
                                alt="Signature et Cachet Partenaire"
                                className="max-h-16 w-auto object-contain rounded bg-white p-1 border border-slate-200"
                              />
                            </div>
                          )}
                          <div className="text-[10px] text-slate-500 pt-2">
                            Signature (« Lu et approuvé ») : _______________________
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Page Footer */}
                <div className="mt-6 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[9.5px] font-bold text-slate-500">
                  <span className="truncate max-w-[45%]">
                    FAAB PLAN • {currentConfig.selectLabel} ({currentFields.referenceCode})
                  </span>
                  <span className="truncate max-w-[35%]">
                    {userProfile.institution || 'Usage Institutionnel & Universel'}
                  </span>
                  <span className="text-[#0c4a6e] font-black shrink-0">
                    Page {pageIdx + 1} / {pages.length}
                  </span>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

