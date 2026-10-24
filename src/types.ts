export type CurrencyCode = 'FCFA' | 'EUR' | 'USD';
export type LanguageCode = 'FR' | 'EN';
export type ThemeMode = 'light' | 'dark';

export type GanttTimeScale = 'day' | 'week' | 'month' | 'quarter' | 'semester' | 'year';

export type InstitutionalDocType =
  | 'tdr'
  | 'note_methodo'
  | 'nda'
  | 'lettre_mission'
  | 'cadrage'
  | 'demarrage'
  | 'cap'
  | 'grille_evaluation'
  | 'mi_parcours'
  | 'rapport_final'
  | 'courrier_admin'
  | 'cv_executif'
  | 'cv_detaille'
  | 'pv_reunion'
  | 'tdr_simplifie';

export interface CustomDocFields {
  referenceCode: string;
  locationCity: string;
  recipientOrg: string;
  recipientRepresentative: string;
  contextJustification: string;
  specificObjectives: string;
  methodologyApproach: string;
  confidentialityClauses: string;
  governanceModalities: string;
  recommendationsLessons: string;
  // Champs d'importation d'images et logos (Data URL base64)
  leftLogoDataUrl?: string;
  rightLogoDataUrl?: string;
  bannerImageDataUrl?: string;
  figureImageDataUrl?: string;
  orgStampDataUrl?: string;
  partnerStampDataUrl?: string;
  profilePhotoDataUrl?: string;
  // Document-specific extra fields
  extraField1?: string;
  extraField2?: string;
  extraField3?: string;
  extraField4?: string;
  // Données sérialisées des 10 Matrices Maîtresses (M1 - M10)
  matricesJson?: string;
}

export type CustomDocsMap = Record<InstitutionalDocType, CustomDocFields>;

export interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  institution: string;
  role: string;
}

export interface Task {
  id: string;
  type: 'tache' | 'jalon';
  phase: string;
  name: string;
  startDate: string;
  endDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  status: 'À faire' | 'En cours' | 'Terminé' | 'Bloqué';
  manualBlocked?: boolean;
  assignee: string;
  autorite?: string;
  consulte?: string;
  informe?: string;
  responsabilite?: string;
  livrable?: string;
  budget?: number; // Stored in base FCFA
  validated?: boolean;
  antecedent?: string;
  projectName?: string;
  projectId?: string;
  axeId?: string;
  axeName?: string;
  dossierId?: string;
  isReadOnly?: boolean;
}

export interface PertNode {
  id: string;
  code: string;
  name: string;
  type: 'tache' | 'jalon';
  phase: string;
  projectId: string;
  projectName: string;
  assignee: string;
  budget: number;
  startDate: string;
  endDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  status: Task['status'];
  duration: number;
  antecedentId: string;
  antecedentCode: string;
  precedingChainCodes: string;
  successorCodes: string[];
  es: number;
  ef: number;
  ls: number;
  lf: number;
  totalFloat: number;
  freeFloat: number;
  isCritical: boolean;
  startDelayDays: number;
  endDelayDays: number;
  level: number;
}

export interface Project {
  id: string;
  name: string;
  tasks: Task[];
  axeId?: string;
  axeName?: string;
  dossierId?: string;
  dossierName?: string;
  isReadOnly?: boolean;
}

export interface Axe {
  id: string;
  name: string;
  projects: Project[];
}

export interface Dossier {
  id: string;
  name: string;
  horizonPlan: string;
  psdYear: number;
  horizonYears: number;
  isReadOnly?: boolean;
  type: string;
  institution: string;
  description: string;
  axes: Axe[];
}

export interface AppPersistedState {
  userProfile: UserProfile;
  dossiers: Dossier[];
  activeDossierId: string;
  language: LanguageCode;
  currency: CurrencyCode;
  theme: ThemeMode;
  lastJsonFileName: string;
  activeTab: string;
  customDocsData?: CustomDocsMap;
}
