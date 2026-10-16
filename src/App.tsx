import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  LayoutDashboard, Folder, CalendarDays, Calendar, AlertTriangle, 
  CheckCircle, Clock, ChevronRight, Activity, Menu, 
  Diamond, Star, Shield, Grid, Filter, Plus, Trash2, Edit, X, Save,
  Home, Mail, Phone, Unlock
} from 'lucide-react';

interface Task {
  id: string;
  type: 'tache' | 'jalon';
  phase: string;
  name: string;
  startDate: string;
  endDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  status: 'À faire' | 'En cours' | 'Terminé' | 'Bloqué';
  assignee: string;
  responsabilite?: string;
  livrable?: string;
  validated?: boolean;
  antecedent?: string;
  projectName?: string;
  projectId?: string;
  axeId?: string;
  axeName?: string;
  dossierId?: string;
  isReadOnly?: boolean;
}

interface Project {
  id: string;
  name: string;
  tasks: Task[];
  axeId?: string;
  axeName?: string;
  dossierId?: string;
  dossierName?: string;
  isReadOnly?: boolean;
}

interface Axe {
  id: string;
  name: string;
  projects: Project[];
}

interface Dossier {
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

interface InlineEditState {
  taskId: string;
  dossierId: string;
  axeId: string;
  projectId: string;
  phase: string;
  data: Task;
}

const BriefcaseIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const initialData: Dossier[] = [
  {
    id: 'dossier-psd-2026-2035',
    name: 'Plan Stratégique de Développement (PSD) 2026-2035',
    horizonPlan: '2026-2035',
    psdYear: 2026,
    horizonYears: 10,
    isReadOnly: false,
    type: 'official',
    institution: 'CNRA PERFORMANCE',
    description: 'Cadre de référence stratégique décennal pour la recherche agronomique nationale et le développement de filières résilientes.',
    axes: [
      {
        id: 'axe-1-agri',
        name: 'Axe 1 : Amélioration Variétale & Adaptation au Changement Climatique',
        projects: [
          {
            id: 'proj-cacao-resilience',
            name: 'Projet 1 : Sélection clonale et dissémination de matériel végétal cacao & café tolérant au déficit hydrique',
            tasks: [
              {
                id: 'task-cacao-1',
                type: 'tache',
                phase: 'AVANT PROJET',
                name: 'Cadrage méthodologique et diagnostic phénotypique des parcelles mères',
                startDate: '2026-01-15',
                endDate: '2026-03-30',
                actualStartDate: '2026-01-20',
                actualEndDate: '2026-03-25',
                status: 'Terminé',
                assignee: 'Dr. Kouamé Yao',
                responsabilite: 'Généticien Senior',
                livrable: 'Rapport de caractérisation morpho-physiologique',
                validated: true,
                antecedent: '—'
              },
              {
                id: 'task-cacao-jalon-1',
                type: 'jalon',
                phase: 'AVANT PROJET',
                name: 'Validation collégiale du panel de génotypes cibles par le Conseil Scientifique',
                startDate: '2026-04-10',
                endDate: '2026-04-10',
                actualStartDate: '2026-04-10',
                actualEndDate: '2026-04-10',
                status: 'Terminé',
                assignee: 'Direction Scientifique CNRA',
                responsabilite: 'Présidence COST',
                livrable: 'PV de validation du panel',
                validated: true,
                antecedent: 'task-cacao-1'
              },
              {
                id: 'task-cacao-2',
                type: 'tache',
                phase: 'CONCEPTION',
                name: 'Définition des protocoles d’hybridation et d’évaluation en milieu contrôlé',
                startDate: '2026-04-15',
                endDate: '2026-06-30',
                actualStartDate: '2026-04-20',
                actualEndDate: '',
                status: 'En cours',
                assignee: 'Équipe Agronomie Divo',
                responsabilite: 'Chef de station Divo',
                livrable: 'Cahier des charges expérimental',
                validated: false,
                antecedent: 'task-cacao-jalon-1'
              },
              {
                id: 'task-cacao-3',
                type: 'tache',
                phase: 'PLANIFICATION',
                name: 'Approvisionnement en substrats certifiés et calibrage des chambres de culture',
                startDate: '2026-07-01',
                endDate: '2026-08-31',
                actualStartDate: '',
                actualEndDate: '',
                status: 'À faire',
                assignee: 'Service Logistique & Intrants',
                responsabilite: 'Responsable achats R&D',
                livrable: 'Bons de livraison conformes',
                validated: false,
                antecedent: 'task-cacao-2'
              },
              {
                id: 'task-cacao-4',
                type: 'tache',
                phase: 'EXÉCUTION & SUIVI',
                name: 'Déploiement des stations micro-climatiques et capteurs d’humidité au sol',
                startDate: '2026-05-01',
                endDate: '2026-05-25',
                actualStartDate: '2026-05-10',
                actualEndDate: '',
                status: 'Bloqué',
                assignee: 'Unité Bioclimatologie',
                responsabilite: 'Ingénieur IoT & Météo',
                livrable: 'Réseau de capteurs opérationnel',
                validated: false,
                antecedent: 'task-cacao-2'
              },
              {
                id: 'task-cacao-5',
                type: 'tache',
                phase: 'EXÉCUTION & SUIVI',
                name: 'Suivi biométrique de croissance sous stress hydrique induit',
                startDate: '2026-09-01',
                endDate: '2027-04-30',
                actualStartDate: '',
                actualEndDate: '',
                status: 'À faire',
                assignee: 'Techniciens de recherche Bingerville',
                responsabilite: 'Superviseur de serres',
                livrable: 'Matrice de données de croissance',
                validated: false,
                antecedent: 'task-cacao-3'
              },
              {
                id: 'task-cacao-jalon-2',
                type: 'jalon',
                phase: 'EXÉCUTION & SUIVI',
                name: 'Jalon d’étape : Rapport intermédiaire d’expression génétique sous stress',
                startDate: '2027-05-15',
                endDate: '2027-05-15',
                actualStartDate: '',
                actualEndDate: '',
                status: 'À faire',
                assignee: 'Laboratoire Central de Biotechnologie',
                responsabilite: 'Biologiste moléculaire',
                livrable: 'Publications et fiches clones',
                validated: false,
                antecedent: 'task-cacao-5'
              },
              {
                id: 'task-cacao-6',
                phase: 'CLÔTURE',
                type: 'tache',
                name: 'Restitution auprès des coopératives productrices et homologation des clones',
                startDate: '2027-06-01',
                endDate: '2027-09-30',
                actualStartDate: '',
                actualEndDate: '',
                status: 'À faire',
                assignee: 'Direction Transfert de Technologies',
                responsabilite: 'Chargé des partenariats agricoles',
                livrable: 'Catalogue variétal officiel',
                validated: false,
                antecedent: 'task-cacao-jalon-2'
              }
            ]
          },
          {
            id: 'proj-vivrier-securite',
            name: 'Projet 2 : Intensification agroécologique du manioc et du maïs bio-fortifié',
            tasks: [
              {
                id: 'task-vivrier-1',
                type: 'tache',
                phase: 'AVANT PROJET',
                name: 'Cartographie des zones de déficit nutritionnel et recensement des écotypes locaux',
                startDate: '2026-02-01',
                endDate: '2026-04-30',
                actualStartDate: '2026-02-05',
                actualEndDate: '2026-04-28',
                status: 'Terminé',
                assignee: 'Programme Plantes à Racines',
                responsabilite: 'Coordinateur Vivriers',
                livrable: 'Atlas des variétés locales',
                validated: true,
                antecedent: '—'
              },
              {
                id: 'task-vivrier-2',
                type: 'tache',
                phase: 'CONCEPTION',
                name: 'Multiplication rapide in vitro de boutures saines indemnes de mosaïque',
                startDate: '2026-05-01',
                endDate: '2026-07-31',
                actualStartDate: '2026-05-08',
                actualEndDate: '',
                status: 'En cours',
                assignee: 'Laboratoire Culture in vitro Bouaké',
                responsabilite: 'Responsable Laboratoire Bouaké',
                livrable: 'Lot de 20 000 vitro-plants',
                validated: false,
                antecedent: 'task-vivrier-1'
              },
              {
                id: 'task-vivrier-jalon-1',
                type: 'jalon',
                phase: 'PLANIFICATION',
                name: 'Homologation des parcelles de pré-multiplication semencière',
                startDate: '2026-08-20',
                endDate: '2026-08-20',
                actualStartDate: '',
                actualEndDate: '',
                status: 'À faire',
                assignee: 'Service Contrôle et Certification',
                responsabilite: 'Inspecteur Semences',
                livrable: 'Certificats de conformité phytosanitaire',
                validated: false,
                antecedent: 'task-vivrier-2'
              }
            ]
          }
        ]
      },
      {
        id: 'axe-2-gouvernance',
        name: 'Axe 2 : Modernisation Institutionnelle & Valorisation des Acquis de Recherche',
        projects: [
          {
            id: 'proj-data-cnra',
            name: 'Projet 1 : Déploiement de la plateforme de gestion centralisée des données de recherche (Data CNRA)',
            tasks: [
              {
                id: 'task-data-1',
                type: 'tache',
                phase: 'AVANT PROJET',
                name: 'Audit de gouvernance numérique et schéma directeur des systèmes d’information',
                startDate: '2026-01-10',
                endDate: '2026-03-15',
                actualStartDate: '2026-01-15',
                actualEndDate: '2026-03-20',
                status: 'Terminé',
                assignee: 'DSI CNRA',
                responsabilite: 'Directeur Systèmes d’Information',
                livrable: 'Document d’architecture SI',
                validated: true,
                antecedent: '—'
              },
              {
                id: 'task-data-2',
                type: 'tache',
                phase: 'CONCEPTION',
                name: 'Intégration du portail cartographique et interopérabilité des banques de données',
                startDate: '2026-03-20',
                endDate: '2026-06-15',
                actualStartDate: '2026-03-22',
                actualEndDate: '',
                status: 'En cours',
                assignee: 'Cellule SIG & Bio-informatique',
                responsabilite: 'Lead Développeur Data',
                livrable: 'Portail SIG V1 en recette',
                validated: false,
                antecedent: 'task-data-1'
              },
              {
                id: 'task-data-3',
                type: 'tache',
                phase: 'EXÉCUTION & SUIVI',
                name: 'Formation des 150 chercheurs et ingénieurs aux normes FAIR et saisie temps réel',
                startDate: '2026-05-10',
                endDate: '2026-05-27',
                actualStartDate: '',
                actualEndDate: '',
                status: 'À faire',
                assignee: 'Direction de la Formation',
                responsabilite: 'Responsable Renforcement des Capacités',
                livrable: 'Attestations de formation délivrées',
                validated: false,
                antecedent: 'task-data-2'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'dossier-transition',
    name: 'Période de Transition : Bilan et Planification (2024-2025)',
    horizonPlan: '2024-2025',
    psdYear: 2024,
    horizonYears: 2,
    isReadOnly: false,
    type: 'official',
    institution: 'CNRA / COST',
    description: 'Bilan d\'étape institutionnel et élaboration participative du nouveau plan stratégique décennal.',
    axes: [
      {
        id: 'axe-trans-1',
        name: 'Axe 1 : Évaluation Rétrospective & Bilan d’Impact',
        projects: [
          {
            id: 'proj-trans-bilan',
            name: 'Projet d\'audit d\'impact des technologies agronomiques générées',
            tasks: [
              {
                id: 'task-tr-1',
                type: 'tache',
                phase: 'AVANT PROJET',
                name: 'Collecte d’enquêtes terrain auprès des producteurs partenaires',
                startDate: '2024-03-01',
                endDate: '2024-06-30',
                actualStartDate: '2024-03-05',
                actualEndDate: '2024-06-28',
                status: 'Terminé',
                assignee: 'Cellule Évaluation',
                responsabilite: 'Évaluateur Externe',
                livrable: 'Rapport d’enquête consolidé'
              },
              {
                id: 'task-tr-2',
                type: 'jalon',
                phase: 'CLÔTURE',
                name: 'Restitution nationale du bilan décennal 2014-2023',
                startDate: '2024-11-15',
                endDate: '2024-11-15',
                actualStartDate: '2024-11-15',
                actualEndDate: '2024-11-15',
                status: 'Terminé',
                assignee: 'Direction Générale',
                responsabilite: 'Directeur Général',
                livrable: 'Actes du colloque national'
              }
            ]
          }
        ]
      }
    ] 
  },
  {
    id: 'dossier-pmt-2020',
    name: 'Plan à Moyen Terme (PMT) 2020 - 2023',
    horizonPlan: '2020-2023',
    psdYear: 2020,
    horizonYears: 4,
    isReadOnly: false,
    type: 'official',
    institution: 'CNRA',
    description: 'Programmation quadriennale d\'activités de recherche agronomique de 6ème génération.',
    axes: [] 
  }
];

const COLORS = { 'Terminé': '#10B981', 'En cours': '#0ea5e9', 'Bloqué': '#EF4444', 'À faire': '#9CA3AF' };
const STANDARD_PHASES = ['AVANT PROJET', 'CONCEPTION', 'PLANIFICATION', 'EXÉCUTION & SUIVI', 'CLÔTURE'];

const defaultTaskForm: Task = {
  id: '',
  name: '',
  startDate: '2026-06-01',
  endDate: '2026-06-30',
  actualStartDate: '',
  actualEndDate: '',
  status: 'À faire',
  assignee: '',
  responsabilite: '',
  livrable: '',
  validated: false,
  antecedent: '—',
  type: 'tache',
  phase: 'AVANT PROJET'
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 text-red-800 rounded-xl border border-red-200 m-4">
          <h3 className="font-bold text-lg mb-2">Une erreur est survenue lors de l'affichage du module</h3>
          <p className="text-xs font-mono mb-4">{this.state.error?.toString()}</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition"
          >
            Réinitialiser le module
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface KanbanCardProps {
  task: Task;
  borderColor: string;
  onDragStart?: (e: React.DragEvent, task: Task) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ task, borderColor, onDragStart }) => (
  <div 
    draggable={!task.isReadOnly}
    onDragStart={(e) => onDragStart && onDragStart(e, task)}
    className={`bg-white rounded-xl shadow-xs border-t-4 ${borderColor} border border-slate-200 p-4 flex flex-col space-y-3 mb-4 transition-all duration-150 ${!task.isReadOnly ? 'cursor-grab active:cursor-grabbing hover:shadow-md' : 'opacity-80 cursor-not-allowed'}`}
  >
    <div className="flex justify-between items-start">
       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{task.type === 'jalon' ? 'Jalon' : 'Tâche'}</span>
       <div className="flex space-x-1">
          {task.type === 'jalon' ? <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center"><Star className="w-2.5 h-2.5 mr-1 fill-current"/> JALON</span> : null}
          {task.status === 'Bloqué' ? <span className="bg-rose-100 text-rose-700 text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center"><AlertTriangle className="w-2.5 h-2.5 mr-1"/> BLOQUÉ</span> : null}
       </div>
    </div>
    <div className="inline-block bg-sky-50 text-sky-700 text-[9px] px-2 py-0.5 rounded font-bold uppercase w-max tracking-wide">{task.phase || ''}</div>
    <h4 className="font-bold text-slate-800 text-xs leading-snug">{task.name || ''}</h4>

    <div className="bg-slate-50 rounded p-2 text-[11px] border border-slate-100">
      <div className="flex justify-between items-center text-slate-500">
        <span className="flex items-center"><Calendar className="w-3 h-3 mr-1 text-slate-400"/> Calendrier</span>
        <span className="font-semibold text-slate-700 tabular-nums">
          {task.startDate ? new Date(task.startDate).toLocaleDateString('fr-FR', {day:'2-digit', month:'short'}) : ''} - {task.endDate && task.type !== 'jalon' ? new Date(task.endDate).toLocaleDateString('fr-FR', {day:'2-digit', month:'short'}) : ''}
        </span>
      </div>
    </div>

    <div className="flex items-center text-[11px] text-slate-500 pt-2 border-t border-slate-100">
      <div className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-[9px] mr-1.5 border border-sky-200 shrink-0">
        {(task.assignee || 'N').substring(0, 2).toUpperCase()}
      </div>
      <span className="truncate max-w-[150px] font-medium" title={task.assignee || ''}>{task.assignee || 'Non assigné'}</span>
    </div>
  </div>
);

function MainApp() {
  const [activeTab, setActiveTab] = useState<string>(() => localStorage.getItem('cnra_activeTab') || 'accueil'); 
  const [isExploring, setIsExploring] = useState<boolean>(() => localStorage.getItem('cnra_isExploring') === 'true');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Formulaire de configuration de création de dossier
  const [isCreatingDossier, setIsCreatingDossier] = useState(false);
  const [newDossierForm, setNewDossierForm] = useState({
    name: 'Nouveau Portefeuille d\'expérimentation',
    type: 'PSD', 
    startYear: 2026,
    horizonYears: 10,
    institution: 'CNRA PERFORMANCE',
    description: 'Espace de gouvernance pour piloter un portefeuille stratégique avec la méthodologie axée sur les résultats.'
  });

  const TODAY = useMemo(() => new Date('2026-05-28'), []);

  const [data, setData] = useState<Dossier[]>(() => {
    try {
      const savedData = localStorage.getItem('cnra_data');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If the stored data has empty axes on the first dossier, seed it with our rich initial data
          if (parsed[0].id === 'dossier-psd-2026-2035' && (!parsed[0].axes || parsed[0].axes.length === 0)) {
            return initialData;
          }
          return parsed;
        }
      }
      return initialData;
    } catch {
      return initialData;
    }
  });

  const [activeDossierId, setActiveDossierId] = useState<string>(() => {
    return localStorage.getItem('cnra_activeDossierId') || initialData[0].id;
  });

  useEffect(() => { localStorage.setItem('cnra_data', JSON.stringify(data)); }, [data]);
  useEffect(() => { localStorage.setItem('cnra_activeDossierId', activeDossierId); }, [activeDossierId]);
  useEffect(() => { localStorage.setItem('cnra_activeTab', activeTab); }, [activeTab]);
  useEffect(() => { localStorage.setItem('cnra_isExploring', String(isExploring)); }, [isExploring]);

  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string | null; step: number }>({ id: null, step: 0 });

  // Variables de filtrage transversales
  const [filterDashboardAxe, setFilterDashboardAxe] = useState('FULL');
  const [filterDashboardProj, setFilterDashboardProj] = useState('FULL');
  const [filterProcessusAxe, setFilterProcessusAxe] = useState('FULL');
  const [filterProcessusProj, setFilterProcessusProj] = useState('FULL');
  const [filterKanbanAxe, setFilterKanbanAxe] = useState('FULL');
  const [filterKanbanProj, setFilterKanbanProj] = useState('FULL');
  const [filterGanttAxe, setFilterGanttAxe] = useState('FULL');
  const [filterGanttProj, setFilterGanttProj] = useState('FULL');

  const [ganttStartMonth, setGanttStartMonth] = useState('2026-01');
  const [ganttEndMonth, setGanttEndMonth] = useState('2028-12');
  const [ganttViewMode, setGanttViewMode] = useState('mois');

  const activeDossier = useMemo(() => data.find(d => d.id === activeDossierId) || data[0], [data, activeDossierId]);

  const currentInstitution = useMemo(() => {
    if (isExploring && activeDossier) {
      return activeDossier.institution || 'CNRA PERFORMANCE';
    }
    return 'CNRA PERFORMANCE';
  }, [isExploring, activeDossier]);

  // Synchronisation dynamique de l'échelle temporelle pour le Gantt
  useEffect(() => {
    if (activeDossier) {
      const startYear = activeDossier.psdYear || parseInt(activeDossier.horizonPlan?.split('-')[0]) || 2026;
      const length = parseInt(String(activeDossier.horizonYears)) || 3;
      const endYear = startYear + length - 1; 
      setGanttStartMonth(`${startYear}-01`);
      setGanttEndMonth(`${endYear}-12`);
    }
  }, [activeDossierId, activeDossier]);

  const allProjects = useMemo(() => {
    const projects: Project[] = [];
    if (activeDossier && Array.isArray(activeDossier.axes)) {
      activeDossier.axes.forEach(axe => {
        if (Array.isArray(axe.projects)) {
          axe.projects.forEach(proj => {
            projects.push({ 
              ...proj, 
              dossierId: activeDossier.id,
              dossierName: activeDossier.name, 
              axeName: axe.name, 
              axeId: axe.id, 
              isReadOnly: activeDossier.isReadOnly 
            });
          });
        }
      });
    }
    return projects;
  }, [activeDossier]);

  const allTasks = useMemo(() => {
    const tasks: Task[] = [];
    allProjects.forEach(proj => {
      if (Array.isArray(proj.tasks)) {
        proj.tasks.forEach(task => tasks.push({ 
          ...task, 
          projectName: proj.name,
          projectId: proj.id,
          axeId: proj.axeId,
          dossierId: proj.dossierId,
          isReadOnly: proj.isReadOnly
        }));
      }
    });
    return tasks;
  }, [allProjects]);

  const dashProjects = useMemo(() => {
    let filtered = allProjects;
    if (filterDashboardAxe !== 'FULL') filtered = filtered.filter(p => p.axeId === filterDashboardAxe);
    if (filterDashboardProj !== 'FULL') filtered = filtered.filter(p => p.id === filterDashboardProj);
    return filtered;
  }, [allProjects, filterDashboardAxe, filterDashboardProj]);

  const dashTasks = useMemo(() => {
    const validIds = dashProjects.map(p => p.id);
    return allTasks.filter(t => t.projectId && validIds.includes(t.projectId));
  }, [allTasks, dashProjects]);

  const cpmDashboardData = useMemo(() => {
    if (dashTasks.length === 0) return "Aucune activité planifiée";
    let minStart = Infinity;
    let maxEnd = -Infinity;
    dashTasks.forEach(t => {
      const sd = new Date(t.startDate).getTime();
      const ed = new Date(t.endDate).getTime();
      if (!isNaN(sd) && !isNaN(ed)) {
        if (sd < minStart) minStart = sd;
        if (ed > maxEnd) maxEnd = ed;
      }
    });
    if (minStart === Infinity) return "Dates manquantes";
    const diffDays = Math.ceil((maxEnd - minStart) / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays >= 365) {
      return `${(diffDays / 365).toFixed(1)} Ans (${diffDays} j) d'horizon`;
    }
    return `${diffDays} Jours d'horizon global`;
  }, [dashTasks]);

  const stats = useMemo(() => {
    const total = dashTasks.length;
    const completed = dashTasks.filter(t => t.status === 'Terminé').length;
    const blocked = dashTasks.filter(t => t.status === 'Bloqué').length;
    const inProgress = dashTasks.filter(t => t.status === 'En cours').length;
    const todo = dashTasks.filter(t => t.status === 'À faire').length;
    
    let currentlyDelayedCount = 0;
    let totalStartDelayDays = 0;
    let totalEndDelayDays = 0;
    let totalDurationOverrunDays = 0;

    dashTasks.forEach(t => {
      const startD = t.startDate ? new Date(t.startDate) : null;
      const endD = t.endDate ? new Date(t.endDate) : null;
      
      const isAFaire = t.status === 'À faire';
      const isTermine = t.status === 'Terminé';

      const actualStartD = isAFaire ? null : (t.actualStartDate ? new Date(t.actualStartDate) : null);
      const actualEndD = isTermine ? (t.actualEndDate ? new Date(t.actualEndDate) : null) : null;

      const hasValidStart = startD && !isNaN(startD.getTime());
      const hasValidEnd = endD && !isNaN(endD.getTime());
      const hasValidActualStart = actualStartD && !isNaN(actualStartD.getTime());
      const hasValidActualEnd = actualEndD && !isNaN(actualEndD.getTime());

      let isDelayed = false;
      if (!isTermine) {
        if (hasValidEnd && TODAY > endD) {
          isDelayed = true; 
        } else if (hasValidStart && TODAY > startD && isAFaire) {
          isDelayed = true; 
        }
      }
      if (isDelayed) {
        currentlyDelayedCount++;
      }

      if (hasValidStart) {
        if (isAFaire && TODAY > startD) {
          totalStartDelayDays += Math.ceil((TODAY.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24));
        } else if (hasValidActualStart && actualStartD > startD) {
          totalStartDelayDays += Math.ceil((actualStartD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      if (hasValidEnd) {
        if (isTermine && hasValidActualEnd && actualEndD > endD) {
          totalEndDelayDays += Math.ceil((actualEndD.getTime() - endD.getTime()) / (1000 * 60 * 60 * 24));
        } else if (!isTermine && TODAY > endD) {
          totalEndDelayDays += Math.ceil((TODAY.getTime() - endD.getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      if (hasValidStart && hasValidEnd) {
        const plannedDuration = Math.max(1, Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)));
        let actualDuration = 0;

        if (isTermine && hasValidActualStart && hasValidActualEnd) {
          actualDuration = Math.max(1, Math.ceil((actualEndD.getTime() - actualStartD.getTime()) / (1000 * 60 * 60 * 24)));
        } else if (!isAFaire && hasValidActualStart && TODAY > actualStartD) {
          actualDuration = Math.max(1, Math.ceil((TODAY.getTime() - actualStartD.getTime()) / (1000 * 60 * 60 * 24)));
        }

        if (actualDuration > plannedDuration) {
          totalDurationOverrunDays += (actualDuration - plannedDuration);
        }
      }
    });

    return { 
      total, 
      completed, 
      blocked, 
      inProgress, 
      todo,
      delayed: currentlyDelayedCount, 
      totalStartDelay: totalStartDelayDays, 
      totalEndDelay: totalEndDelayDays, 
      totalDurationOverrun: totalDurationOverrunDays 
    };
  }, [dashTasks, TODAY]);

  const bottlenecks = useMemo(() => {
    const list: (Task & { reasons: string[] })[] = [];
    dashTasks.forEach(t => {
      const startD = t.startDate ? new Date(t.startDate) : null;
      const endD = t.endDate ? new Date(t.endDate) : null;

      const hasValidStart = startD && !isNaN(startD.getTime());
      const hasValidEnd = endD && !isNaN(endD.getTime());

      let isBottleneck = false;
      const reasons: string[] = [];

      if (t.status === 'Bloqué') {
        isBottleneck = true;
        reasons.push("Statut de blocage structurel");
      }

      if (t.status !== 'Terminé') {
        if (hasValidEnd && TODAY > endD) {
          isBottleneck = true;
          reasons.push(`Échéance dépassée`);
        } else if (hasValidStart && TODAY > startD && t.status === 'À faire') {
          isBottleneck = true;
          reasons.push(`Démarrage non initié`);
        }
      }

      if (t.status === 'À faire' && hasValidStart) {
        const startDelay = Math.ceil((TODAY.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24));
        if (startDelay > 15) {
          isBottleneck = true;
          reasons.push(`Retard critique au démarrage (+${startDelay} jours)`);
        }
      }

      if (isBottleneck) {
        const matchingProj = dashProjects.find(p => p.id === t.projectId);
        list.push({
          ...t,
          projectName: matchingProj ? matchingProj.name : "Projet Inconnu",
          reasons
        });
      }
    });
    return list;
  }, [dashTasks, dashProjects, TODAY]);

  const globalProgress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const pieData = useMemo(() => [
    { name: 'Terminées', value: stats.completed }, 
    { name: 'En cours', value: stats.inProgress },
    { name: 'Bloquées', value: stats.blocked }, 
    { name: 'À faire', value: stats.todo },
  ], [stats]);

  const projectStats = useMemo(() => {
    const pStats: {
      projectName: string;
      shortName: string;
      total: number;
      'Terminées': number;
      'En cours': number;
      'Bloquées (Goulots)': number;
      'À faire': number;
      'En Retard': number;
      progress: number;
    }[] = [];
    const today = new Date();
    dashProjects.forEach(proj => {
      const safeTasks = Array.isArray(proj.tasks) ? proj.tasks : [];
      const total = safeTasks.length;
      const completed = safeTasks.filter(t => t.status === 'Terminé').length;
      const inProgress = safeTasks.filter(t => t.status === 'En cours').length;
      const blocked = safeTasks.filter(t => t.status === 'Bloqué').length;
      const todo = safeTasks.filter(t => t.status === 'À faire').length;
      
      const delayed = safeTasks.filter(t => {
        if (t.status === 'Terminé') return false;
        const startD = new Date(t.startDate);
        const endD = new Date(t.endDate);
        if (!isNaN(endD.getTime()) && today > endD) return true;
        if (!isNaN(startD.getTime()) && today > startD && t.status === 'À faire') return true;
        return false;
      }).length;

      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      const shortName = (proj.name || 'Projet Inconnu').replace(/Projet\s*(\d)?\s*:\s*/, '');

      pStats.push({ 
        projectName: proj.name || 'Projet Inconnu', 
        shortName: shortName.length > 25 ? shortName.substring(0, 25) + '...' : shortName,
        total, 
        'Terminées': completed, 
        'En cours': inProgress, 
        'Bloquées (Goulots)': blocked, 
        'À faire': todo, 
        'En Retard': delayed,
        progress 
      });
    });
    return pStats;
  }, [dashProjects]);

  const ganttColumns = useMemo(() => {
    const startStr = ganttStartMonth || '2026-01';
    const endStr = ganttEndMonth || '2028-12';
    const [sYear, sMonth] = startStr.split('-').map(Number);
    const [eYear, eMonth] = endStr.split('-').map(Number);
    const startDate = new Date(sYear, sMonth - 1, 1);
    const endDate = new Date(eYear, eMonth, 0); 
    
    const cols: {
      label: string;
      parentLabel: string;
      start: Date;
      end: Date;
    }[] = [];
    let curr = new Date(startDate);
    const maxCols = 1500; 

    if (ganttViewMode === 'jour') {
        while (curr <= endDate && cols.length < maxCols) {
            cols.push({
                label: curr.getDate().toString().padStart(2, '0'),
                parentLabel: curr.toLocaleString('fr-FR', { month: 'short', year: 'numeric' }),
                start: new Date(curr.getFullYear(), curr.getMonth(), curr.getDate(), 0, 0, 0),
                end: new Date(curr.getFullYear(), curr.getMonth(), curr.getDate(), 23, 59, 59)
            });
            curr = new Date(curr.getFullYear(), curr.getMonth(), curr.getDate() + 1);
        }
    } else if (ganttViewMode === 'semaine') {
        let currWeekStart = new Date(startDate);
        let weekNum = 1;
        while (currWeekStart <= endDate && cols.length < maxCols) {
            const currWeekEnd = new Date(currWeekStart.getFullYear(), currWeekStart.getMonth(), currWeekStart.getDate() + 6, 23, 59, 59);
            const actualEnd = currWeekEnd > endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59) : currWeekEnd;
            
            cols.push({
                label: `S${weekNum}`,
                parentLabel: currWeekStart.toLocaleString('fr-FR', { month: 'short', year: 'numeric' }),
                start: new Date(currWeekStart.getFullYear(), currWeekStart.getMonth(), currWeekStart.getDate(), 0, 0, 0),
                end: actualEnd
            });
            
            const nextWeekStart = new Date(currWeekStart.getFullYear(), currWeekStart.getMonth(), currWeekStart.getDate() + 7);
            if (nextWeekStart.getMonth() !== currWeekStart.getMonth()) {
                weekNum = 1;
            } else {
                weekNum++;
            }
            currWeekStart = nextWeekStart;
        }
    } else if (ganttViewMode === 'mois') {
        while (curr <= endDate && cols.length < maxCols) {
            const mEnd = new Date(curr.getFullYear(), curr.getMonth() + 1, 0);
            cols.push({
                label: curr.toLocaleString('fr-FR', { month: 'short' }).substring(0,3),
                parentLabel: curr.getFullYear().toString(),
                start: new Date(curr.getFullYear(), curr.getMonth(), 1, 0, 0, 0),
                end: new Date(mEnd.getFullYear(), mEnd.getMonth(), mEnd.getDate(), 23, 59, 59)
            });
            curr = new Date(curr.getFullYear(), curr.getMonth() + 1, 1);
        }
    } else if (ganttViewMode === 'trimestre') {
        while (curr <= endDate && cols.length < maxCols) {
            const q = Math.floor(curr.getMonth() / 3) + 1;
            const qEnd = new Date(curr.getFullYear(), q * 3, 0);
            const actualEnd = qEnd > endDate ? endDate : qEnd;
            cols.push({
                label: `T${q}`,
                parentLabel: curr.getFullYear().toString(),
                start: new Date(curr.getFullYear(), curr.getMonth(), 1, 0, 0, 0),
                end: new Date(actualEnd.getFullYear(), actualEnd.getMonth(), actualEnd.getDate(), 23, 59, 59)
            });
            curr = new Date(curr.getFullYear(), curr.getMonth() + 3, 1);
        }
    } else if (ganttViewMode === 'semestre') {
        while (curr <= endDate && cols.length < maxCols) {
            const s = Math.floor(curr.getMonth() / 6) + 1;
            const sEnd = new Date(curr.getFullYear(), s * 6, 0);
            const actualEnd = sEnd > endDate ? endDate : sEnd;
            cols.push({
                label: `S${s}`,
                parentLabel: curr.getFullYear().toString(),
                start: new Date(curr.getFullYear(), curr.getMonth(), 1, 0, 0, 0),
                end: new Date(actualEnd.getFullYear(), actualEnd.getMonth(), actualEnd.getDate(), 23, 59, 59)
            });
            curr = new Date(curr.getFullYear(), curr.getMonth() + 6, 1);
        }
    }
    return cols;
  }, [ganttStartMonth, ganttEndMonth, ganttViewMode]);

  const ganttParents = useMemo(() => {
    const parents: { label: string; count: number }[] = [];
    if (!ganttColumns) return [];
    let currentParent: { label: string; count: number } | null = null;
    ganttColumns.forEach(col => {
        if (!currentParent || currentParent.label !== col.parentLabel) {
            if (currentParent) parents.push(currentParent);
            currentParent = { label: col.parentLabel, count: 1 };
        } else {
            currentParent.count++;
        }
    });
    if (currentParent) parents.push(currentParent);
    return parents;
  }, [ganttColumns]);

  const handleSaveNewDossier = () => {
    if (!newDossierForm.name.trim()) {
      setValidationError("Veuillez saisir le nom du dossier.");
      return;
    }
    if (!newDossierForm.institution.trim()) {
      setValidationError("Veuillez renseigner l'institution rattachée.");
      return;
    }
    const years = parseInt(String(newDossierForm.horizonYears)) || 10;
    const startYear = parseInt(String(newDossierForm.startYear)) || 2026;
    const endYear = startYear + years - 1;
    const horizonStr = `${startYear}-${endYear}`;

    const newDossier: Dossier = { 
      id: `dossier-${Date.now()}`, 
      name: newDossierForm.name.trim(), 
      psdYear: startYear,
      horizonYears: years,
      horizonPlan: horizonStr, 
      isReadOnly: false, 
      type: newDossierForm.type,
      institution: newDossierForm.institution.trim(),
      description: newDossierForm.description || 'Espace d\'expérimentation et de pilotage stratégique.',
      axes: [
        {
          id: `axe-1-${Date.now()}`,
          name: 'Axe 1 : Transformation Digitale & Performance administrative',
          projects: [
            {
              id: `proj-sim-${Date.now()}`,
              name: 'Projet Pilote : Déploiement de la méthodologie GAR',
              tasks: [
                {
                  id: `t-sim-init-${Date.now()}`,
                  type: 'tache',
                  phase: 'AVANT PROJET',
                  name: 'Initialisation du diagnostic de gouvernance',
                  startDate: `${startYear}-03-01`,
                  endDate: `${startYear}-05-15`,
                  status: 'À faire',
                  assignee: 'Comité de Pilotage GAR',
                  responsabilite: 'Coordinateur Performance',
                  livrable: 'Diagnostic SWOT validé'
                }
              ]
            }
          ]
        }
      ] 
    };

    setData([...data, newDossier]);
    setActiveDossierId(newDossier.id);
    setIsCreatingDossier(false);
    setValidationError('');
  };

  const handleUpdateDossier = (id: string, field: keyof Dossier, value: string | number) => {
    setData(data.map(d => {
      if (d.id === id) {
        const updated = { ...d, [field]: value };
        
        // Si modification de l'année de début ou de la durée de l'horizon, recalculer l'horizonPlan
        if (field === 'psdYear' || field === 'horizonYears') {
          const startY = field === 'psdYear' ? Number(value) : (Number(d.psdYear) || 2026);
          const yearsLength = field === 'horizonYears' ? Number(value) : (Number(d.horizonYears) || 10);
          
          if (!isNaN(startY) && !isNaN(yearsLength) && yearsLength > 0) {
            const endY = startY + yearsLength - 1;
            updated.horizonPlan = `${startY}-${endY}`;
          }
        }
        return updated;
      }
      return d;
    }));
  };

  const handleDeleteDossier = (id: string) => {
    setData(data.filter(d => d.id !== id));
  };

  const handleAddAxe = (dossierId: string) => {
    setData(data.map(d => d.id === dossierId ? { 
      ...d, 
      axes: [...(d.axes || []), { id: `axe-${Date.now()}-${Math.floor(Math.random()*1000)}`, name: 'Nouvel Axe Stratégique', projects: [] }] 
    } : d));
  };

  const handleUpdateAxe = (dossierId: string, axeId: string, field: string, value: string) => {
    setData(data.map(d => d.id === dossierId ? { 
      ...d, 
      axes: d.axes.map(a => a.id === axeId ? { ...a, [field]: value } : a) 
    } : d));
  };

  const handleDeleteAxe = (dossierId: string, axeId: string) => {
     setData(data.map(d => dossierId === d.id ? { 
       ...d, 
       axes: d.axes.filter(a => a.id !== axeId) 
     } : d));
  };

  const handleAddProject = (dossierId: string, axeId: string) => {
    setData(data.map(d => d.id === dossierId ? { 
      ...d, 
      axes: d.axes.map(a => a.id === axeId ? { 
        ...a, 
        projects: [...(a.projects || []), { id: `proj-${Date.now()}-${Math.floor(Math.random()*1000)}`, name: 'Nouveau Projet OP', tasks: [] }] 
      } : a) 
    } : d));
  };

  const handleUpdateProject = (dossierId: string, axeId: string, projId: string, field: string, value: string) => {
    setData(data.map(d => dossierId === d.id ? { 
      ...d, 
      axes: d.axes.map(a => a.id === axeId ? { 
        ...a, 
        projects: a.projects.map(p => p.id === projId ? { ...p, [field]: value } : p) 
      } : a) 
    } : d));
  };
  
  const handleDeleteProject = (dossierId: string, axeId: string, projId: string) => {
    setData(data.map(d => d.id === dossierId ? { 
      ...d, 
      axes: d.axes.map(a => a.id === axeId ? { 
        ...a, 
        projects: a.projects.filter(p => p.id !== projId) 
      } : a) 
    } : d));
  };

  const updateTaskStatus = (dossierId: string, axeId: string, projectId: string, taskId: string, newStatus: Task['status']) => {
    setData(data.map(d => {
      if (d.id !== dossierId) return d;
      return {
        ...d, axes: d.axes.map(a => {
          if (a.id !== axeId) return a;
          return {
            ...a, projects: a.projects.map(p => {
              if (p.id !== projectId) return p;
              return {
                ...p, tasks: p.tasks.map(t => {
                  if (t.id === taskId) {
                    let newActualStart = t.actualStartDate;
                    let newActualEnd = t.actualEndDate;
                    if (newStatus === 'À faire') {
                      newActualStart = '';
                      newActualEnd = '';
                    } else if (newStatus !== 'Terminé') {
                      newActualEnd = '';
                    }
                    return { ...t, status: newStatus, actualStartDate: newActualStart, actualEndDate: newActualEnd };
                  }
                  return t;
                })
              };
            })
          };
        })
      };
    }));
  };

  const [inlineEdit, setInlineEdit] = useState<InlineEditState | null>(null);
  const [taskDeleteConfirmation, setTaskDeleteConfirmation] = useState<string | null>(null); 
  const [validationError, setValidationError] = useState('');

  const openInlineAdd = (dossierId: string, axeId: string, projectId: string, phase: string, type: 'tache' | 'jalon' = 'tache') => {
    setInlineEdit({
      taskId: 'new', dossierId, axeId, projectId, phase,
      data: { ...defaultTaskForm, phase, type }
    });
  };

  const openInlineEdit = (dossierId: string, axeId: string, projectId: string, task: Task) => {
    setInlineEdit({
      taskId: task.id, dossierId, axeId, projectId, phase: task.phase,
      data: { ...task }
    });
  };

  const handleInlineChange = (field: keyof Task, value: any) => {
    setInlineEdit(prev => {
      if (!prev) return null;
      const newData = { ...prev.data, [field]: value };
      if (newData.type === 'jalon') {
        if (field === 'startDate') newData.endDate = value;
        if (field === 'actualStartDate') newData.actualEndDate = value;
        if (field === 'type') {
          newData.endDate = newData.startDate;
          newData.actualEndDate = newData.actualStartDate;
        }
      }
      return { ...prev, data: newData };
    });
  };

  const cancelInlineEdit = () => {
    setInlineEdit(null);
    setValidationError('');
  };
  
  const saveInlineEdit = () => {
    if (!inlineEdit) return;
    if (!inlineEdit.data.name.trim()) {
      setValidationError("Veuillez saisir un nom pour l'activité.");
      return;
    }
    if (!STANDARD_PHASES.includes(inlineEdit.data.phase)) {
      setValidationError("Phase invalide. Le cycle de projet imposé doit être respecté.");
      return;
    }

    const startD = new Date(inlineEdit.data.startDate);
    const endD = new Date(inlineEdit.data.endDate);
    if (inlineEdit.data.type === 'tache' && !isNaN(startD.getTime()) && !isNaN(endD.getTime()) && startD > endD) {
      setValidationError("La date de début d'échéance doit précéder la date de fin.");
      return;
    }

    setValidationError('');

    if (inlineEdit.data.status === 'À faire') {
      inlineEdit.data.actualStartDate = '';
      inlineEdit.data.actualEndDate = '';
    } else if (inlineEdit.data.status !== 'Terminé') {
      inlineEdit.data.actualEndDate = '';
    }
    
    setData(data.map(d => {
      if (d.id !== inlineEdit.dossierId) return d;
      return {
        ...d, axes: d.axes.map(a => {
          if (a.id !== inlineEdit.axeId) return a;
          return {
            ...a, projects: a.projects.map(p => {
              if (p.id !== inlineEdit.projectId) return p;
              const tasks = p.tasks || [];
              let newTasks: Task[];
              if (inlineEdit.taskId === 'new') {
                newTasks = [...tasks, { ...inlineEdit.data, id: `t-${Date.now()}` }];
              } else {
                newTasks = tasks.map(t => t.id === inlineEdit.taskId ? inlineEdit.data : t);
              }
              return { ...p, tasks: newTasks };
            })
          };
        })
      };
    }));
    setInlineEdit(null);
  };

  const handleDeleteTask = (dossierId: string, axeId: string, projectId: string, taskId: string) => {
    setData(data.map(d => {
      if (d.id !== dossierId) return d;
      return {
        ...d, axes: d.axes.map(a => {
          if (a.id !== axeId) return a;
          return {
            ...a, projects: a.projects.map(p => {
              if (p.id !== projectId) return p;
              return { ...p, tasks: p.tasks.filter(t => t.id !== taskId) };
            })
          };
        })
      };
    }));
    setTaskDeleteConfirmation(null);
  };

  const renderAccueil = () => (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10 max-w-5xl mx-auto">
      <div className="bg-sky-600 rounded-2xl p-8 md:p-12 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="relative z-10 max-w-xl">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight tracking-tight">
            Maîtrisez le Processus de <br/>
            <span className="text-sky-200">Pilotage Stratégique</span>
          </h1>
          <p className="text-sky-100 text-base md:text-lg mb-8 leading-relaxed font-medium">
            Gouvernance universelle adaptée aux institutions de recherche, d'enseignement supérieur et d'administration publique. Suivi opérationnel axé sur les résultats, détection des goulots critiques et alignement décennal.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => { 
                setActiveTab('projects'); 
                setIsExploring(false); 
              }} 
              className="bg-white text-sky-700 hover:bg-sky-50 font-bold px-6 py-3.5 rounded-lg shadow-lg transition-all flex items-center cursor-pointer active:scale-95"
            >
              <Folder className="w-5 h-5 mr-3 text-sky-600" />
              Accéder aux Portefeuilles
            </button>
            <button 
              onClick={() => {
                setActiveDossierId(data[0].id);
                setIsExploring(true);
                setActiveTab('dashboard');
              }}
              className="bg-sky-700/80 hover:bg-sky-700 text-white font-bold px-6 py-3.5 rounded-lg border border-sky-400/50 shadow-lg transition-all flex items-center cursor-pointer active:scale-95"
            >
              <Activity className="w-5 h-5 mr-3 text-sky-200" />
              Consulter PSD 2026-2035
            </button>
          </div>
        </div>
        
        <div className="bg-sky-800/70 rounded-xl p-5 border border-sky-400/60 w-full md:w-80 shadow-2xl relative z-10 backdrop-blur-sm">
          <p className="text-sky-200 text-[10px] font-bold tracking-widest uppercase mb-1">Application conçue par :</p>
          <h3 className="text-white font-black text-lg mb-3">KOFFIE FABIEN MICHAEL</h3>
          <div className="space-y-2 text-xs text-sky-100 font-medium">
            <p className="flex items-center"><Mail className="w-4 h-4 mr-2 text-sky-300" /> fabien.frikupgeneration@gmail.com</p>
            <p className="flex items-center"><Phone className="w-4 h-4 mr-2 text-sky-300" /> +225 07 48 08 27 39</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative text-slate-800">
        <h4 className="flex items-center text-rose-600 font-black tracking-widest text-sm uppercase mb-3 drop-shadow-xs">
          <AlertTriangle className="w-5 h-5 mr-2" />
          Accord de confidentialité & Propriété intellectuelle
        </h4>
        <p className="text-xs text-slate-600 font-medium leading-relaxed text-justify">
          La présente plateforme, incluant son architecture structurelle, sa logique algorithmique et son design d'interface, constitue une œuvre de l'esprit protégée appartenant à son créateur. En utilisant cette application, l'administration ou l'institution utilisatrice s'engage formellement à respecter la stricte confidentialité de ce système. Toute copie, reproduction, ingénierie inverse, ou distribution non expressément autorisée de cet outil à des tiers est rigoureusement interdite sous peine de poursuites légales.
        </p>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-3 border-sky-200 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Tableau de Bord Décisionnel</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">{activeDossier?.name} · {activeDossier?.institution}</p>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          {cpmDashboardData && (
            <div className="bg-sky-50 px-4 py-2 rounded-lg shadow-xs border border-sky-200 min-w-[200px] flex flex-col justify-center">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-sky-800 flex items-center"><Activity className="w-3 h-3 mr-1 text-sky-600"/>CPM & Horizon Global</span>
              </div>
              <span className="text-sm font-black text-sky-700 uppercase tracking-wide tabular-nums">{cpmDashboardData}</span>
            </div>
          )}
          <div className="bg-white px-4 py-2 rounded-lg shadow-xs border border-slate-200 min-w-[240px]">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-slate-600">Avancement Global</span>
              <span className="text-base font-bold text-emerald-600 tabular-nums">{globalProgress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${globalProgress}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl shadow-xs border border-slate-200 shrink-0 text-sm">
        <div className="flex-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center">
            <Filter className="w-3 h-3 mr-1 text-sky-600" /> 1. Filtrer par Axe Stratégique
          </label>
          <div className="relative">
            <select 
              className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-800 text-sm font-medium rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 p-2.5 pr-8 outline-none transition-shadow cursor-pointer"
              value={filterDashboardAxe}
              onChange={(e) => { 
                setFilterDashboardAxe(e.target.value); 
                setFilterDashboardProj('FULL');
              }}
            >
              <option value="FULL">Toutes les données (Vue Globale)</option>
              {activeDossier?.axes?.map(axe => (
                <option key={axe.id} value={axe.id}>{axe.name}</option>
              ))}
            </select>
            <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 top-3 rotate-90 pointer-events-none" />
          </div>
        </div>
        <div className="flex-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center">
            <Filter className="w-3 h-3 mr-1 text-sky-600" /> 2. Filtrer par Projet OP
          </label>
          <div className="relative">
            <select 
              className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-800 text-sm font-medium rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 p-2.5 pr-8 outline-none transition-shadow cursor-pointer"
              value={filterDashboardProj}
              onChange={(e) => setFilterDashboardProj(e.target.value)}
            >
              <option value="FULL">Tous les projets {filterDashboardAxe !== 'FULL' ? 'de cet axe' : ''}</option>
              {allProjects
                .filter(p => filterDashboardAxe === 'FULL' || p.axeId === filterDashboardAxe)
                .map((proj, idx) => (
                  <option key={proj.id} value={proj.id}>{idx + 1}. {proj.name}</option>
              ))}
            </select>
            <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 top-3 rotate-90 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 border-t-4 border-t-slate-500 flex flex-col justify-center">
          <p className="text-xs text-slate-500 uppercase font-bold mb-1">Tâches totales</p>
          <p className="text-3xl font-black text-slate-800 leading-none tabular-nums">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 border-t-4 border-t-emerald-500 flex flex-col justify-center">
          <p className="text-xs text-slate-500 uppercase font-bold mb-1">Terminées</p>
          <p className="text-3xl font-black text-emerald-600 leading-none tabular-nums">{stats.completed}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 border-t-4 border-t-sky-400 flex flex-col justify-center">
          <p className="text-xs text-slate-500 uppercase font-bold mb-1">En Cours</p>
          <p className="text-3xl font-black text-sky-600 leading-none tabular-nums">{stats.inProgress}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 border-t-4 border-t-rose-500 flex flex-col justify-center">
          <p className="text-xs text-slate-500 uppercase font-bold mb-1">Bloquées</p>
          <p className="text-3xl font-black text-rose-600 leading-none tabular-nums">{stats.blocked}</p>
        </div>
        <div className="bg-white p-3 rounded-xl shadow-xs border border-slate-200 border-t-4 border-t-purple-500 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex justify-between items-start mb-1">
            <p className="text-xs text-slate-500 flex items-center font-bold uppercase"><Clock className="w-3.5 h-3.5 mr-1 text-purple-500" />En Retard Réel</p>
            <p className="text-2xl font-black text-purple-600 leading-none tabular-nums">{stats.delayed}</p>
          </div>
          <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-purple-100 mt-1">
            <div className="text-center" title="Jours cumulés de retard au démarrage par rapport à la planification">
              <p className="text-[7.5px] text-slate-400 uppercase font-bold tracking-tight">Démarrage</p>
              <p className="text-[10px] font-black text-rose-500 tabular-nums">+{stats.totalStartDelay}j</p>
            </div>
            <div className="text-center border-l border-r border-purple-100" title="Jours cumulés de retard sur l'échéance finale">
              <p className="text-[7.5px] text-slate-400 uppercase font-bold tracking-tight">Fin</p>
              <p className="text-[10px] font-black text-rose-500 tabular-nums">+{stats.totalEndDelay}j</p>
            </div>
            <div className="text-center" title="Jours cumulés de dépassement de la durée prévisionnelle d'exécution">
              <p className="text-[7.5px] text-slate-400 uppercase font-bold tracking-tight">Dépassement</p>
              <p className="text-[10px] font-black text-rose-500 tabular-nums">+{stats.totalDurationOverrun}j</p>
            </div>
          </div>
        </div>
      </div>

      {/* Goulots d'étranglement */}
      <div className="bg-white rounded-xl shadow-xs border border-rose-100 overflow-hidden">
        <div className="bg-rose-50/80 px-5 py-4 border-b border-rose-100 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-rose-900 text-sm md:text-base uppercase tracking-wider">
              Analyse Critique : Goulots d'étranglement détectés ({bottlenecks.length})
            </h3>
          </div>
          <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2.5 py-1 rounded-full">
            Seuil de criticité élevé
          </span>
        </div>
        <div className="p-5">
          {bottlenecks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bottlenecks.map(b => (
                <div key={b.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between hover:shadow-xs transition-shadow">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                        {b.type === 'jalon' ? 'Jalon Bloquant' : 'Tâche en souffrance'}
                      </span>
                      <span className="text-[11px] text-slate-500 font-bold max-w-[180px] truncate" title={b.projectName}>
                        {b.projectName}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm mb-3 leading-snug">{b.name}</h4>
                    
                    <div className="space-y-1 mb-4">
                      {b.reasons.map((r, idx) => (
                        <div key={idx} className="flex items-center text-xs text-rose-600 font-semibold">
                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mr-2"></span>
                          {r}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-slate-200 text-xs mt-auto">
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] mr-2">
                        {b.assignee.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-600 truncate max-w-[140px]">{b.assignee}</span>
                    </div>
                    <span className="text-slate-500 font-medium text-[11px] tabular-nums">
                      Échéance : {new Date(b.endDate).toLocaleDateString('fr-FR', {day: '2-digit', month: 'short'})}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 italic text-sm flex flex-col items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
              Aucun goulot d'étranglement ou retard critique n'est actuellement détecté.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 lg:col-span-2">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center"><Activity className="w-5 h-5 mr-2 text-sky-500" /> Répartition opérationnelle par Projet</h3>
          <div className="h-80">
            {projectStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectStats} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="shortName" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} />
                  <Legend verticalAlign="top" height={36}/>
                  <Bar dataKey="total" name="Total Tâches" fill="#64748b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Terminées" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="En cours" stackId="a" fill="#0ea5e9" />
                  <Bar dataKey="À faire" stackId="a" fill="#9CA3AF" />
                  <Bar dataKey="Bloquées (Goulots)" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="En Retard" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (<div className="h-full flex items-center justify-center text-slate-400 italic">Aucun projet à analyser</div>)}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 flex flex-col justify-between">
          <h3 className="text-base font-bold text-slate-800 mb-2 text-center">Répartition par Statut</h3>
          <div className="h-64">
            {stats.total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                    {pieData.map((_entry, index) => <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % 4]} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic">Aucune donnée à afficher</div>
            )}
          </div>
          <div className="border-t border-slate-100 pt-3 text-center text-xs text-slate-500 font-medium">
            Total des opérations actives : <span className="font-bold text-slate-800 tabular-nums">{stats.total}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProjectManager = () => {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 pb-10">
        <div className="flex justify-between items-center border-b pb-3 border-sky-200 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center">
              <Folder className="w-6 h-6 mr-2 text-sky-600" /> 
              Portefeuilles d'Activités & Dossiers
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Cadres stratégiques décennaux et espaces d'expérimentation opérationnelle</p>
          </div>
          <button 
            onClick={() => setIsCreatingDossier(true)}
            className="bg-sky-600 text-white hover:bg-sky-700 px-4 py-2.5 rounded-lg text-sm font-bold flex items-center transition-colors shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" /> Nouveau PSD / Dossier
          </button>
        </div>

        {/* Formulaire de création de simulation */}
        {isCreatingDossier && (
          <div className="bg-white border-2 border-teal-500 p-6 rounded-2xl shadow-lg space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-teal-900 flex items-center">
              <Plus className="w-5 h-5 mr-2" /> Initialiser un Nouveau Dossier Stratégique
            </h3>
            {validationError && (
              <div className="bg-rose-50 text-rose-700 p-3 rounded-lg text-xs font-semibold flex items-center border border-rose-200">
                <AlertTriangle className="w-4 h-4 mr-2 shrink-0"/> {validationError}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-teal-700 uppercase tracking-widest block mb-1">Institution Rattachée</label>
                <input 
                  type="text" 
                  value={newDossierForm.institution} 
                  onChange={e => setNewDossierForm({ ...newDossierForm, institution: e.target.value })}
                  placeholder="Ex: MINISTÈRE DE L'AGRICULTURE, ENTREPRISE PRIVÉE, etc."
                  className="w-full p-2.5 text-sm border border-teal-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-400 font-bold text-teal-950 uppercase"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-teal-700 uppercase tracking-widest block mb-1">Nom du Portefeuille / PSD</label>
                <input 
                  type="text" 
                  value={newDossierForm.name} 
                  onChange={e => setNewDossierForm({ ...newDossierForm, name: e.target.value })}
                  placeholder="Ex: Nouveau Portefeuille de Recherche"
                  className="w-full p-2.5 text-sm border border-teal-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-teal-700 uppercase tracking-widest block mb-1">Description libre du Portefeuille</label>
              <textarea 
                rows={2}
                value={newDossierForm.description} 
                onChange={e => setNewDossierForm({ ...newDossierForm, description: e.target.value })}
                placeholder="Espace de gouvernance pour piloter un portefeuille stratégique avec la méthodologie axée sur les résultats."
                className="w-full p-2.5 text-sm border border-teal-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-400 text-slate-600 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-black text-teal-700 uppercase tracking-widest block mb-1">Type de Document</label>
                <select
                  value={newDossierForm.type}
                  onChange={e => {
                    const type = e.target.value;
                    const horizonYears = type === 'PSD' ? 10 : 3;
                    setNewDossierForm({ ...newDossierForm, type, horizonYears });
                  }}
                  className="w-full p-2.5 text-sm border border-teal-200 rounded-lg outline-none bg-white font-semibold text-teal-900"
                >
                  <option value="PSD">Plan Stratégique (PSD)</option>
                  <option value="Dossier Opérationnel">Dossier Opérationnel</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-teal-700 uppercase tracking-widest block mb-1">Année de Début</label>
                <input 
                  type="number" 
                  value={newDossierForm.startYear} 
                  onChange={e => setNewDossierForm({ ...newDossierForm, startYear: parseInt(e.target.value) || 2026 })}
                  className="w-full p-2.5 text-sm border border-teal-200 rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-teal-700 uppercase tracking-widest block mb-1">Durée d'Horizon (Années)</label>
                <input 
                  type="number" 
                  min="1"
                  max="100"
                  value={newDossierForm.horizonYears} 
                  onChange={e => setNewDossierForm({ ...newDossierForm, horizonYears: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full p-2.5 text-sm border border-teal-200 rounded-lg outline-none font-bold text-teal-900"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button 
                onClick={() => setIsCreatingDossier(false)} 
                className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              >
                Annuler
              </button>
              <button 
                onClick={handleSaveNewDossier} 
                className="px-4 py-2 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition cursor-pointer"
              >
                Créer l'Espace de suivi
              </button>
            </div>
          </div>
        )}
        
        {/* Grille de cartes de portefeuilles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map(dossier => {
            return (
              <div 
                key={dossier.id} 
                className="bg-white rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between overflow-hidden relative transition-all duration-300 hover:shadow-md border-t-4 border-t-emerald-500"
              >
                <div className="p-6 flex flex-col h-full">
                  <div className="flex justify-between items-start w-full">
                    <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
                      <BriefcaseIcon className="w-6 h-6" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider bg-teal-100 text-teal-800">
                        Éditable
                      </span>
                      <button 
                        onClick={() => setDeleteConfirmation({ id: dossier.id, step: 1 })}
                        className="text-slate-300 hover:text-rose-500 transition-colors cursor-pointer p-1"
                        title="Supprimer la simulation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {deleteConfirmation.id === dossier.id && (
                    <div className="mt-3 flex items-center space-x-2 bg-rose-50 p-2 rounded-lg border border-rose-200 shadow-xs transition-all duration-300">
                      {deleteConfirmation.step === 1 && (
                        <>
                          <span className="text-xs font-bold text-rose-600 px-1">Sûr ?</span>
                          <button onClick={() => setDeleteConfirmation({ id: dossier.id, step: 2 })} className="bg-rose-500 text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-rose-600 transition-colors">Oui</button>
                          <button onClick={() => setDeleteConfirmation({ id: null, step: 0 })} className="bg-slate-300 text-slate-700 px-2 py-1 rounded text-[10px] font-bold hover:bg-slate-400 transition-colors">Non</button>
                        </>
                      )}
                      {deleteConfirmation.step === 2 && (
                        <>
                          <span className="text-[10px] font-black text-rose-600 px-1 uppercase tracking-wider">Irréversible !</span>
                          <button onClick={() => { handleDeleteDossier(dossier.id); setDeleteConfirmation({ id: null, step: 0 }); }} className="bg-rose-700 text-white px-3 py-1 rounded text-[10px] font-bold hover:bg-rose-800 shadow-xs transition-colors">Détruire</button>
                          <button onClick={() => setDeleteConfirmation({ id: null, step: 0 })} className="bg-slate-300 text-slate-700 px-2 py-1 rounded text-[10px] font-bold hover:bg-slate-400 transition-colors">Annuler</button>
                        </>
                      )}
                    </div>
                  )}

                  <div className="border-b border-dashed border-teal-200/80 pb-2 mt-4">
                    <p className="text-[10.5px] font-black tracking-widest text-slate-400 uppercase truncate" title={dossier.institution || 'INSTITUTION PAR DÉFAUT'}>
                      {dossier.institution || 'INSTITUTION PAR DÉFAUT'}
                    </p>
                  </div>

                  <div className="py-3 flex-1 flex flex-col">
                    <h3 className="text-base font-black text-slate-800 leading-snug line-clamp-2" title={dossier.name}>
                      {dossier.name}
                    </h3>
                    <p className="text-[11.5px] text-slate-500 font-medium mt-2 leading-relaxed line-clamp-3">
                      {dossier.description || 'Espace d\'expérimentation pour la saisie et le suivi d\'activités opérationnelles.'}
                    </p>
                  </div>

                  <div className="border-t border-dashed border-teal-200/80 pt-4 mt-2">
                    <div className="flex justify-between items-center text-[11px] text-slate-500 font-bold mb-4">
                      <span className="bg-teal-50 text-teal-800 px-2 py-1 rounded border border-teal-200 tabular-nums">Horizon : {dossier.horizonPlan}</span>
                      <span>{dossier.axes?.length || 0} Axes</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-3 space-y-2">
                      <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Modifier l'institution :</label>
                        <input 
                          type="text" 
                          value={dossier.institution || ''} 
                          onChange={e => handleUpdateDossier(dossier.id, 'institution', e.target.value)}
                          className="w-full mt-1 p-1.5 text-xs font-bold border border-slate-200 rounded uppercase bg-white outline-none focus:border-teal-400" 
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Modifier le titre :</label>
                        <input 
                          type="text" 
                          value={dossier.name || ''} 
                          onChange={e => handleUpdateDossier(dossier.id, 'name', e.target.value)}
                          className="w-full mt-1 p-1.5 text-xs font-bold border border-slate-200 rounded bg-white outline-none focus:border-teal-400" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Année Début :</label>
                          <input 
                            type="number" 
                            value={dossier.psdYear || 2026} 
                            onChange={e => handleUpdateDossier(dossier.id, 'psdYear', parseInt(e.target.value) || 2026)}
                            className="w-full mt-1 p-1.5 text-xs font-bold border border-slate-200 rounded bg-white outline-none focus:border-teal-400 tabular-nums" 
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Échéance (ans) :</label>
                          <input 
                            type="number" 
                            min="1"
                            value={dossier.horizonYears || 10} 
                            onChange={e => handleUpdateDossier(dossier.id, 'horizonYears', Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full mt-1 p-1.5 text-xs font-bold border border-slate-200 rounded bg-white outline-none focus:border-teal-400 tabular-nums" 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Modifier la description :</label>
                        <textarea 
                          value={dossier.description || ''} 
                          onChange={e => handleUpdateDossier(dossier.id, 'description', e.target.value)}
                          className="w-full mt-1 p-1.5 text-xs font-medium border border-slate-200 rounded bg-white outline-none focus:border-teal-400" 
                        />
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setActiveDossierId(dossier.id);
                        setIsExploring(true);
                        setActiveTab('dashboard');
                      }}
                      className="w-full bg-sky-600 hover:bg-sky-700 text-white py-2.5 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-xs transition-colors text-sm cursor-pointer active:scale-98"
                    >
                      <Unlock className="w-4 h-4" />
                      <span>Ouvrir Suivi des tâches</span>
                    </button>
                  </div>
                </div>

                <div className="bg-teal-50/50 p-4 border-t border-slate-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-teal-800 uppercase tracking-wider">Axes Stratégiques</span>
                    <button 
                      onClick={() => handleAddAxe(dossier.id)}
                      className="bg-teal-600 hover:bg-teal-700 text-white text-[9px] px-2 py-1 rounded font-bold flex items-center cursor-pointer"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Ajouter Axe
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
                    {dossier.axes?.map((axe, axeIdx) => (
                      <div key={axe.id} className="bg-white p-2 rounded-lg border border-slate-200 relative shadow-xs">
                        <button 
                          onClick={() => handleDeleteAxe(dossier.id, axe.id)}
                          className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <div className="flex items-center space-x-1.5 pr-6">
                          <span className="bg-teal-100 text-teal-800 font-black text-[9px] w-4 h-4 rounded flex items-center justify-center shrink-0">{axeIdx + 1}</span>
                          <input 
                            type="text" 
                            value={axe.name} 
                            onChange={e => handleUpdateAxe(dossier.id, axe.id, 'name', e.target.value)}
                            placeholder="Nom de l'axe..." 
                            className="w-full p-1 text-[11px] font-bold border border-slate-100 rounded focus:border-teal-400 outline-none" 
                          />
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-1 border-t border-slate-100">
                          <button onClick={() => handleAddProject(dossier.id, axe.id)} className="text-[8px] bg-slate-100 hover:bg-teal-100 text-slate-700 hover:text-teal-800 px-1.5 py-0.5 rounded font-black flex items-center transition-colors cursor-pointer">
                            <Plus className="w-2.5 h-2.5 mr-0.5" /> Ajouter un Projet
                          </button>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest tabular-nums">{axe.projects?.length || 0} projets</span>
                        </div>
                        {axe.projects?.length > 0 && (
                          <div className="mt-1.5 space-y-1 pl-4">
                            {axe.projects.map((proj, projIdx) => (
                              <div key={proj.id} className="flex items-center gap-1">
                                <span className="text-[9px] text-slate-400 font-bold">{projIdx + 1}.</span>
                                <input 
                                  type="text" 
                                  value={proj.name} 
                                  onChange={e => handleUpdateProject(dossier.id, axe.id, proj.id, 'name', e.target.value)} 
                                  className="w-full p-1 text-[9px] font-semibold border-b border-transparent focus:border-teal-200 outline-none" 
                                  placeholder="Nom du projet..."
                                />
                                <button onClick={() => handleDeleteProject(dossier.id, axe.id, proj.id)} className="text-slate-300 hover:text-rose-500 cursor-pointer"><X className="w-3 h-3" /></button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderProcessus = () => {
    let filteredProjects = allProjects;
    if (filterProcessusAxe !== 'FULL') filteredProjects = filteredProjects.filter(p => p.axeId === filterProcessusAxe);
    if (filterProcessusProj !== 'FULL') filteredProjects = filteredProjects.filter(p => p.id === filterProcessusProj);
    
    const today = new Date();
    const colSpanCount = 13; 

    const enrichedProjects = filteredProjects.map(project => {
      const phaseGroups = STANDARD_PHASES.map(phaseName => {
        const pTasks = Array.isArray(project.tasks) ? project.tasks.filter(t => t.phase === phaseName) : [];
        let minStart = Infinity;
        pTasks.forEach(t => {
            const d = new Date(t.startDate).getTime();
            if (!isNaN(d) && d < minStart) minStart = d;
        });
        return { phase: phaseName, tasks: pTasks, minStart };
      });

      phaseGroups.sort((a, b) => {
        if (a.minStart === Infinity && b.minStart === Infinity) return STANDARD_PHASES.indexOf(a.phase) - STANDARD_PHASES.indexOf(b.phase);
        if (a.minStart === Infinity) return 1;
        if (b.minStart === Infinity) return -1;
        return a.minStart - b.minStart;
      });

      phaseGroups.forEach(group => {
        group.tasks.sort((a, b) => {
          const dA = new Date(a.startDate).getTime();
          const dB = new Date(b.startDate).getTime();
          if (isNaN(dA) && isNaN(dB)) return 0;
          if (isNaN(dA)) return 1;
          if (isNaN(dB)) return -1;
          return dA - dB;
        });
      });

      const taskNumbers: Record<string, { type: string; number: string }> = {};
      phaseGroups.forEach((group, phaseIndex) => {
        group.tasks.forEach((t, idx) => {
          taskNumbers[t.id] = { type: t.type, number: `${phaseIndex + 1}.${idx + 1}` };
        });
      });

      const groups = phaseGroups.map((group, phaseIndex) => {
        const items = group.tasks.map((t, idx) => {
          const startD = new Date(t.startDate); 
          const endD = new Date(t.endDate);
          const duration = Math.max(1, Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24))) || 1;
          
          const isTermine = t.status === 'Terminé';
          const isAFaire = t.status === 'À faire';

          const actualStartD = isAFaire ? null : (t.actualStartDate ? new Date(t.actualStartDate) : null);
          const actualEndD = isTermine ? (t.actualEndDate ? new Date(t.actualEndDate) : null) : null;

          const debutReel = actualStartD && !isNaN(actualStartD.getTime()) ? actualStartD.toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit', year: '2-digit'}) : '—';
          const finReelle = actualEndD && !isNaN(actualEndD.getTime()) ? actualEndD.toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit', year: '2-digit'}) : '—';
          
          let startDelayDays = 0;
          if (actualStartD && !isNaN(actualStartD.getTime())) {
            startDelayDays = Math.ceil((actualStartD.getTime() - startD.getTime()) / (1000*60*60*24)) || 0;
          } else if (today > startD && isAFaire) {
            startDelayDays = Math.ceil((today.getTime() - startD.getTime()) / (1000*60*60*24)) || 0;
          }

          let endDelayDays = 0;
          if (actualEndD && !isNaN(actualEndD.getTime())) {
            endDelayDays = Math.ceil((actualEndD.getTime() - endD.getTime()) / (1000*60*60*24)) || 0;
          } else if (today > endD && !isTermine) {
            endDelayDays = Math.ceil((today.getTime() - endD.getTime()) / (1000*60*60*24)) || 0;
          }
          
          let dureeExecution = '—';
          if (t.type === 'jalon') {
            dureeExecution = '0j';
          } else if (isTermine && actualStartD && actualEndD) {
            const execDur = Math.max(1, Math.ceil((actualEndD.getTime() - actualStartD.getTime()) / (1000 * 60 * 60 * 24)));
            dureeExecution = execDur + 'j';
          } else if (!isAFaire && actualStartD && !isNaN(actualStartD.getTime()) && today > actualStartD) {
            const elapsed = Math.max(1, Math.ceil((today.getTime() - actualStartD.getTime()) / (1000 * 60 * 60 * 24)));
            dureeExecution = `${elapsed}j (en cours)`;
          } else {
            dureeExecution = 'À venir';
          }

          let antecedentLabel = '—';
          if (t.antecedent && t.antecedent !== '—') {
            const antInfo = taskNumbers[t.antecedent];
            if (antInfo) {
              antecedentLabel = antInfo.type === 'tache' ? `T. ${antInfo.number}` : `J. ${antInfo.number}`;
            } else {
              antecedentLabel = t.antecedent;
            }
          }
          
          return { 
            ...t, 
            number: `${phaseIndex + 1}.${idx + 1}`, 
            month: !isNaN(startD.getTime()) ? startD.toLocaleString('fr-FR', { month: 'short', year: 'numeric' }) : '—', 
            duration: t.type === 'jalon' ? '0j' : duration + 'j', 
            start: !isNaN(startD.getTime()) ? startD.toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit', year: '2-digit'}) : '—', 
            end: !isNaN(endD.getTime()) ? endD.toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit', year: '2-digit'}) : '—',
            debutReel,
            finReelle,
            startDelayDays,
            endDelayDays,
            dureeExecution,
            antecedentLabel
          };
        });
        return { phase: group.phase, items };
      });
      return { ...project, groups };
    });

    return (
      <div className="animate-in fade-in duration-300 pb-10 flex flex-col h-full relative">
        <div className="flex justify-between items-center border-b pb-2 border-sky-200 shrink-0 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-sky-600" /> 
              Suivi des Opérations (Saisie Opérationnelle)
            </h2>
            <p className="text-xs text-slate-500">Cycle de gestion complet des activités : planification, exécution réelle, antécédents et écarts temporels</p>
          </div>
        </div>

        {validationError && (
          <div className="bg-rose-50 text-rose-700 p-3 rounded-lg border border-rose-200 mb-4 flex items-center text-sm font-semibold">
            <AlertTriangle className="w-4 h-4 mr-2 shrink-0" />
            {validationError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl shadow-xs border border-slate-200 mb-4 shrink-0">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center">
              <Filter className="w-3 h-3 mr-1 text-sky-600" /> 1. Filtrer par Axe Stratégique
            </label>
            <div className="relative">
              <select 
                className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-800 text-sm font-medium rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 p-2.5 pr-8 outline-none transition-shadow cursor-pointer"
                value={filterProcessusAxe}
                onChange={(e) => { 
                  setFilterProcessusAxe(e.target.value); 
                  setFilterProcessusProj('FULL');
                }}
              >
                <option value="FULL">Toutes les données (Vue Globale)</option>
                {activeDossier?.axes?.map(axe => (
                  <option key={axe.id} value={axe.id}>{axe.name}</option>
                ))}
              </select>
              <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 top-3 rotate-90 pointer-events-none" />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center">
              <Filter className="w-3 h-3 mr-1 text-sky-600" /> 2. Filtrer par Projet OP
            </label>
            <div className="relative">
              <select 
                className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-800 text-sm font-medium rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 p-2.5 pr-8 outline-none transition-shadow cursor-pointer"
                value={filterProcessusProj}
                onChange={(e) => setFilterProcessusProj(e.target.value)}
              >
                <option value="FULL">Tous les projets {filterProcessusAxe !== 'FULL' ? 'de cet axe' : ''}</option>
                {allProjects
                  .filter(p => filterProcessusAxe === 'FULL' || p.axeId === filterProcessusAxe)
                  .map((proj, idx) => (
                    <option key={proj.id} value={proj.id}>{idx + 1}. {proj.name}</option>
                  ))}
              </select>
              <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 top-3 rotate-90 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 pb-10">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 flex flex-col overflow-hidden mb-6">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 shrink-0 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-800 flex items-center">
                Détail des Opérations (Saisie matricielle)
              </h3>
              <span className="text-xs text-slate-500 font-medium">Tableau avec verrouillage de colonnes et calculs automatisés</span>
            </div>
            
            <div className="overflow-x-auto relative max-h-[600px] hide-scrollbar">
              <table className="w-full text-left text-sm whitespace-nowrap" style={{ minWidth: '1600px' }}>
                <thead className="bg-slate-800 text-white text-xs shadow-md sticky top-0 z-40">
                  <tr>
                    <th className="px-2 py-3 border-b border-slate-700 border-r border-slate-600 sticky left-0 bg-slate-800 z-50 w-24 min-w-[96px] text-[10px] uppercase">Tâche/Jalon</th>
                    <th className="px-2 py-3 border-b border-slate-700 w-56 min-w-[224px] max-w-[280px] border-r border-slate-600 text-[10px] uppercase sticky left-[96px] bg-slate-800 z-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">Activité</th>
                    <th className="px-2 py-3 border-b border-slate-700 text-center border-r w-32 min-w-[128px] text-[10px] uppercase">Responsable</th>
                    <th className="px-2 py-3 border-b border-slate-700 text-center border-r w-24 min-w-[96px] text-[10px] uppercase">Mois</th>
                    <th className="px-2 py-3 border-b border-slate-700 text-center border-r w-28 min-w-[112px] text-[10px] uppercase">Antécédent</th>
                    <th className="px-2 py-3 border-b border-slate-700 text-center text-sky-200 border-r w-24 min-w-[96px] text-[10px] uppercase">Début Prév.</th>
                    <th className="px-2 py-3 border-b border-slate-700 text-center text-sky-200 border-r w-24 min-w-[96px] text-[10px] uppercase">Fin Prév.</th>
                    <th className="px-2 py-3 border-b border-slate-700 text-center text-sky-200 border-r w-16 min-w-[64px] text-[10px] uppercase">Durée Prév.</th>
                    <th className="px-2 py-3 border-b border-slate-700 text-center text-emerald-200 border-r bg-slate-700/50 w-24 min-w-[96px] text-[10px] uppercase">Début Exéc.</th>
                    <th className="px-2 py-3 border-b border-slate-700 text-center text-emerald-200 border-r bg-slate-700/50 w-24 min-w-[96px] text-[10px] uppercase">Fin Exéc.</th>
                    <th className="px-2 py-3 border-b border-slate-700 text-center text-emerald-200 border-r bg-slate-700/50 w-16 min-w-[64px] text-[10px] uppercase">Durée Exéc.</th>
                    <th className="px-2 py-3 border-b border-slate-700 text-center text-rose-200 border-r bg-slate-700/50 w-16 min-w-[64px] text-[10px] uppercase">Retard</th>
                    <th className="px-2 py-3 border-b border-slate-700 text-center bg-slate-700 w-20 min-w-[80px] text-[10px] uppercase sticky right-0 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.3)]">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {enrichedProjects.map(project => {
                    return (
                      <React.Fragment key={project.id}>
                        <tr className="bg-slate-200 border-b">
                          <td colSpan={colSpanCount} className="px-3 py-2.5 font-bold text-slate-800 text-sm bg-slate-200 z-20 relative">
                            <div className="flex justify-between items-center w-full sticky left-4">
                              <span className="flex items-center">
                                <Unlock className="w-3.5 h-3.5 mr-2 text-teal-600" />
                                Projet : <span className="text-teal-800 ml-1 font-black">{project.name || ''}</span>
                              </span>
                            </div>
                          </td>
                        </tr>
                        
                        {project.groups.map((group, idx) => (
                          <React.Fragment key={`${project.id}-phase-${idx}`}>
                            <tr className="bg-slate-700 border-b border-slate-600">
                              <td colSpan={colSpanCount} className="p-0">
                                <div className="px-3 py-1.5 w-max text-sky-200 font-bold text-[11px] uppercase tracking-widest flex items-center sticky left-4">
                                  PHASE DU CYCLE : {group.phase}
                                  <div className="flex space-x-2">
                                    <button 
                                      onClick={() => openInlineAdd(project.dossierId || '', project.axeId || '', project.id, group.phase, 'tache')} 
                                      className="ml-4 bg-teal-500 hover:bg-teal-400 text-white px-2 py-0.5 rounded text-[9px] flex items-center shadow-xs transition-colors cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3 mr-1"/> Ajouter Tâche
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                            
                            {(() => {
                              const allProjectTasks = project.groups.flatMap(g => g.items);

                              const renderInlineEditRow = (itemData: Task) => {
                                const showActualStart = itemData.status !== 'À faire';
                                const showActualEnd = itemData.status === 'Terminé';

                                return (
                                <tr className="bg-sky-50/90 border-b-2 border-sky-300 shadow-inner text-xs">
                                  {/* Column 1: Jalon ou Tâche Select */}
                                  <td className="px-2 py-2 sticky left-0 z-30 bg-sky-50/95 border-r border-sky-200 w-24 min-w-[96px]">
                                    <select value={itemData.type} onChange={(e) => handleInlineChange('type', e.target.value)} className="w-full text-[10px] p-1.5 border border-sky-300 rounded font-bold text-sky-700 outline-none focus:ring-1 focus:ring-sky-500 bg-white">
                                      <option value="tache">Tâche</option>
                                      <option value="jalon">Jalon</option>
                                    </select>
                                  </td>
                                  
                                  {/* Column 2: Inputs Activité */}
                                  <td className="px-2 py-2 border-r border-sky-200 sticky left-[96px] bg-sky-50/95 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-56 min-w-[224px] max-w-[280px]">
                                    <div className="flex flex-col space-y-1.5 w-full">
                                      <input 
                                        type="text" 
                                        value={itemData.name} 
                                        onChange={(e) => handleInlineChange('name', e.target.value)} 
                                        className="w-full text-[10px] p-1.5 border border-sky-300 rounded outline-none focus:ring-1 focus:ring-sky-500 font-bold bg-white" 
                                        placeholder="Nom de l'activité..." 
                                        autoFocus 
                                      />
                                      <select 
                                        value={itemData.status} 
                                        onChange={(e) => handleInlineChange('status', e.target.value)} 
                                        className="w-full text-[9px] p-1 border border-sky-300 rounded outline-none text-slate-700 font-bold bg-white"
                                      >
                                        <option value="À faire">À faire</option>
                                        <option value="En cours">En cours</option>
                                        <option value="Terminé">Terminé</option>
                                        <option value="Bloqué">Bloqué</option>
                                      </select>
                                    </div>
                                  </td>
                                  
                                  {/* Column 3: Responsable */}
                                  <td className="px-2 py-2 border-r border-sky-200 w-32 min-w-[128px]">
                                    <input type="text" value={itemData.assignee} onChange={(e) => handleInlineChange('assignee', e.target.value)} className="w-full text-[10px] p-1.5 border border-sky-300 rounded mb-1.5 outline-none bg-white focus:ring-1 focus:ring-sky-500" placeholder="Responsable..." />
                                    <input type="text" value={itemData.responsabilite || ''} onChange={(e) => handleInlineChange('responsabilite', e.target.value)} className="w-full text-[10px] p-1.5 border border-sky-300 rounded outline-none bg-white focus:ring-1 focus:ring-sky-500" placeholder="Rôle..." />
                                  </td>
                                  
                                  {/* Column 4: Mois */}
                                  <td className="px-2 py-2 border-r border-sky-200 text-center text-[10px] text-sky-500 italic w-24 min-w-[96px]">Auto.</td>
                                  
                                  {/* Column 5: Antécédent */}
                                  <td className="px-2 py-2 border-r border-sky-200 w-28 min-w-[112px]">
                                    <select 
                                      value={itemData.antecedent || '—'} 
                                      onChange={(e) => handleInlineChange('antecedent', e.target.value)} 
                                      className="w-full text-[10px] p-1.5 border border-sky-300 rounded outline-none focus:ring-1 focus:ring-sky-500 bg-white"
                                    >
                                      <option value="—">— Aucun —</option>
                                      {allProjectTasks.map(t => (
                                        <option key={t.id} value={t.id} disabled={Boolean(inlineEdit && inlineEdit.taskId === t.id)}>
                                          {t.type === 'tache' ? 'T.' : 'J.'}{t.number} : {t.name.substring(0, 20)}...
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  
                                  {/* Column 6: Début Prév. */}
                                  <td className="px-2 py-2 border-r border-sky-200 w-24 min-w-[96px]">
                                    <input type="date" value={itemData.startDate} onChange={(e) => handleInlineChange('startDate', e.target.value)} className="w-full text-[10px] p-1.5 border border-sky-300 rounded outline-none focus:ring-1 focus:ring-sky-500 bg-white tabular-nums" />
                                  </td>
                                  
                                  {/* Column 7: Fin Prév. */}
                                  <td className="px-2 py-2 border-r border-sky-200 w-24 min-w-[96px]">
                                    <input type="date" value={itemData.type === 'jalon' ? itemData.startDate : itemData.endDate} onChange={(e) => handleInlineChange('endDate', e.target.value)} disabled={itemData.type === 'jalon'} title={itemData.type === 'jalon' ? "Identique à la date de début pour un Jalon" : ""} className={`w-full text-[10px] p-1.5 border rounded outline-none tabular-nums ${itemData.type === 'jalon' ? 'bg-sky-100 border-sky-200 text-sky-600 cursor-not-allowed' : 'border-sky-300 focus:ring-1 focus:ring-sky-500 bg-white'}`} />
                                  </td>
                                  
                                  {/* Column 8: Durée Prév. */}
                                  <td className="px-2 py-2 border-r border-sky-200 text-center text-[10px] text-sky-500 italic w-16 min-w-[64px]">Auto.</td>
                                  
                                  {/* Column 9: Début Exéc. */}
                                  <td className="px-2 py-2 border-r border-sky-200 bg-sky-100/30 w-24 min-w-[96px]">
                                    <input type="date" value={showActualStart ? (itemData.actualStartDate || '') : ''} onChange={(e) => handleInlineChange('actualStartDate', e.target.value)} disabled={!showActualStart} className={`w-full text-[10px] p-1.5 border rounded outline-none tabular-nums ${!showActualStart ? 'bg-sky-50/50 border-sky-200 text-sky-400 cursor-not-allowed opacity-50' : 'border-emerald-300 focus:ring-1 focus:ring-emerald-500 bg-white'}`} />
                                  </td>
                                  
                                  {/* Column 10: Fin Exéc. */}
                                  <td className="px-2 py-2 border-r border-sky-200 bg-sky-100/30 w-24 min-w-[96px]">
                                    <input type="date" value={showActualEnd ? (itemData.actualEndDate || '') : ''} onChange={(e) => handleInlineChange('actualEndDate', e.target.value)} disabled={!showActualEnd || itemData.type === 'jalon'} title={itemData.type === 'jalon' ? "Identique à la date de début réelle pour un Jalon" : (!showActualEnd ? "La tâche doit être Terminée" : "")} className={`w-full text-[10px] p-1.5 border rounded outline-none tabular-nums ${(!showActualEnd || itemData.type === 'jalon') ? 'bg-sky-50/50 border-sky-200 text-sky-400 cursor-not-allowed opacity-50' : 'border-emerald-300 focus:ring-1 focus:ring-emerald-500 bg-white'}`} />
                                  </td>
                                  
                                  {/* Column 11: Durée Exéc. */}
                                  <td className="px-2 py-2 border-r border-sky-200 text-center text-[10px] text-sky-500 italic w-16 min-w-[64px]">Auto.</td>
                                  
                                  {/* Column 12: Retard */}
                                  <td className="px-2 py-2 border-r border-sky-200 text-center text-[10px] text-sky-500 italic w-16 min-w-[64px]">Auto.</td>
                                  
                                  {/* Column 13: Actions */}
                                  <td className="px-2 py-2 text-center bg-sky-50/95 sticky right-0 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] w-20 min-w-[80px]">
                                    <div className="flex justify-center gap-1.5">
                                      <button onClick={saveInlineEdit} className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded shadow-xs transition-colors cursor-pointer" title="Enregistrer"><Save className="w-4 h-4"/></button>
                                      <button onClick={cancelInlineEdit} className="bg-rose-500 hover:bg-rose-600 text-white p-2 rounded shadow-xs transition-colors cursor-pointer" title="Annuler"><X className="w-4 h-4"/></button>
                                    </div>
                                  </td>
                                </tr>
                                );
                              };

                              const isAddingNew = inlineEdit && inlineEdit.taskId === 'new' && inlineEdit.projectId === project.id && inlineEdit.phase === group.phase;

                              return (
                                <>
                                  {group.items.length === 0 && !isAddingNew ? (
                                    <tr>
                                      <td colSpan={colSpanCount} className="px-8 py-3 text-left text-slate-400 italic text-[11px] bg-slate-50">
                                        Aucune tâche d'entraînement n'est encore enregistrée pour cette phase du cycle de projet.
                                      </td>
                                    </tr>
                                  ) : (
                                    group.items.map((item) => {
                                      if (inlineEdit && inlineEdit.taskId === item.id) {
                                        return <React.Fragment key={`edit-${item.id}`}>{renderInlineEditRow(inlineEdit.data)}</React.Fragment>;
                                      }
                                      return (
                                        <tr key={item.id} className="group border-b hover:bg-sky-50/40 transition-colors text-xs bg-slate-50/60">
                                          <td className="px-2 py-2 font-bold relative text-sky-700 sticky left-0 bg-slate-50 group-hover:bg-sky-50 z-30 border-r border-slate-200 w-24 min-w-[96px] text-[11px] tabular-nums">
                                            <div className="flex items-center">
                                              <span className="w-auto mr-1">{item.type === 'tache' ? `T. ${item.number}` : `J. ${item.number}`}</span>
                                              {item.type === 'jalon' && <Diamond className="w-3 h-3 text-amber-500 fill-current shrink-0" />}
                                            </div>
                                          </td>
                                          
                                          <td className="px-2 py-2 font-bold text-slate-800 whitespace-normal leading-tight w-56 min-w-[224px] max-w-[280px] border-r border-slate-200 text-[11px] sticky left-[96px] bg-slate-50 group-hover:bg-sky-50 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                            {item.name || ''}
                                            <div className="flex items-center space-x-1.5 mt-1">
                                              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${item.status === 'Terminé' ? 'bg-emerald-100 text-emerald-800' : item.status === 'En cours' ? 'bg-sky-100 text-sky-800' : item.status === 'Bloqué' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'}`}>
                                                {item.status}
                                              </span>
                                            </div>
                                          </td>
                                          
                                          <td className="px-2 py-2 border-r border-slate-200 text-[11px] w-32 min-w-[128px]">
                                            <div className="font-bold text-slate-700 truncate" title={item.assignee}>{item.assignee || '—'}</div>
                                            <div className="text-[9px] text-slate-400 font-normal truncate" title={item.responsabilite}>{item.responsabilite || '—'}</div>
                                          </td>
                                          
                                          <td className="px-2 py-2 text-slate-600 capitalize text-center border-r border-slate-200 text-[10px] w-24 min-w-[96px]">{item.month}</td>
                                          
                                          <td className="px-2 py-2 text-slate-600 text-center font-bold border-r border-slate-200 text-[10px] w-28 min-w-[112px]">{item.antecedentLabel}</td>
                                          
                                          <td className="px-2 py-2 text-sky-700 text-center font-bold border-r border-slate-200 text-[11px] tracking-tight w-24 min-w-[96px] tabular-nums">
                                            {item.start}
                                          </td>
                                          
                                          <td className="px-2 py-2 text-center font-bold text-sky-700 border-r border-slate-200 text-[11px] tracking-tight w-24 min-w-[96px] tabular-nums">{item.end}</td>
                                          
                                          <td className="px-2 py-2 text-center border-r border-slate-200 w-16 min-w-[64px]">
                                            <span className="bg-sky-100 text-sky-800 font-bold px-1.5 py-0.5 rounded text-[10px] tabular-nums">{item.duration}</span>
                                          </td>
                                          
                                          <td className={`px-2 py-2 text-center font-bold border-r border-slate-200 bg-emerald-50/30 text-[11px] tracking-tight w-24 min-w-[96px] tabular-nums ${item.debutReel === '—' ? 'text-slate-400 italic' : 'text-emerald-700'}`}>
                                            {item.debutReel}
                                          </td>
                                          
                                          <td className={`px-2 py-2 text-center font-bold border-r border-slate-200 bg-emerald-50/30 text-[11px] tracking-tight w-24 min-w-[96px] tabular-nums ${item.finReelle === '—' ? 'text-slate-400 italic' : 'text-emerald-700'}`}>{item.finReelle}</td>
                                          
                                          <td className="px-2 py-2 text-center border-r border-slate-200 bg-emerald-50/30 w-16 min-w-[64px]">
                                            <span className="text-emerald-700 font-bold text-[10px] bg-emerald-100/60 px-1.5 py-0.5 rounded tabular-nums">{item.dureeExecution}</span>
                                          </td>
                                          
                                          <td className="px-2 py-2 text-center border-r border-slate-200 bg-rose-50/30 w-16 min-w-[64px]">
                                            {item.startDelayDays > 0 ? <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold text-[10px] leading-none inline-block tabular-nums">+{item.startDelayDays}j</span> : item.startDelayDays < 0 ? <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold text-[10px] leading-none inline-block tabular-nums">{item.startDelayDays}j</span> : <span className="text-slate-400 text-[10px] leading-none tabular-nums">0j</span>}
                                          </td>
                                          
                                          <td className="px-2 py-2 text-center bg-white sticky right-0 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] w-20 min-w-[80px]">
                                            {taskDeleteConfirmation === item.id ? (
                                              <div className="flex flex-col gap-1 items-center animate-in fade-in">
                                                <span className="text-[8px] text-rose-600 font-bold leading-none uppercase">Sûr ?</span>
                                                <div className="flex gap-1">
                                                  <button onClick={() => handleDeleteTask(project.dossierId || '', project.axeId || '', project.id, item.id)} className="bg-rose-600 hover:bg-rose-700 text-white px-1.5 py-0.5 rounded text-[9px] font-bold shadow-xs cursor-pointer">Oui</button>
                                                  <button onClick={() => setTaskDeleteConfirmation(null)} className="bg-slate-300 hover:bg-slate-400 text-slate-800 px-1.5 py-0.5 rounded text-[9px] font-bold shadow-xs cursor-pointer">Non</button>
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="flex justify-center gap-2">
                                                <button onClick={() => openInlineEdit(project.dossierId || '', project.axeId || '', project.id, item)} className="text-sky-600 hover:bg-sky-50 p-1.5 rounded transition-colors cursor-pointer" title="Modifier la tâche">
                                                  <Edit className="w-3.5 h-3.5"/>
                                                </button>
                                                <button onClick={() => setTaskDeleteConfirmation(item.id)} className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded transition-colors cursor-pointer" title="Supprimer la tâche">
                                                  <Trash2 className="w-3.5 h-3.5"/>
                                                </button>
                                              </div>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })
                                  )}
                                  
                                  {isAddingNew && renderInlineEditRow(inlineEdit.data)}
                                </>
                              );
                            })()}
                          </React.Fragment>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGantt = () => {
    let filteredProjects = allProjects;
    if (filterGanttAxe !== 'FULL') filteredProjects = filteredProjects.filter(p => p.axeId === filterGanttAxe);
    if (filterGanttProj !== 'FULL') filteredProjects = filteredProjects.filter(p => p.id === filterGanttProj);
    
    const today = new Date();

    const enrichedProjects = filteredProjects.map(project => {
      const phaseGroups = STANDARD_PHASES.map(phaseName => {
        const pTasks = Array.isArray(project.tasks) ? project.tasks.filter(t => t.phase === phaseName) : [];
        let minStart = Infinity;
        pTasks.forEach(t => {
            const d = new Date(t.startDate).getTime();
            if (!isNaN(d) && d < minStart) minStart = d;
        });
        return { phase: phaseName, tasks: pTasks, minStart };
      });

      phaseGroups.sort((a, b) => {
        if (a.minStart === Infinity && b.minStart === Infinity) return STANDARD_PHASES.indexOf(a.phase) - STANDARD_PHASES.indexOf(b.phase);
        if (a.minStart === Infinity) return 1;
        if (b.minStart === Infinity) return -1;
        return a.minStart - b.minStart;
      });

      phaseGroups.forEach(group => {
        group.tasks.sort((a, b) => {
          const dA = new Date(a.startDate).getTime();
          const dB = new Date(b.startDate).getTime();
          if (isNaN(dA) && isNaN(dB)) return 0;
          if (isNaN(dA)) return 1;
          if (isNaN(dB)) return -1;
          return dA - dB;
        });
      });

      const taskNumbers: Record<string, { type: string; number: string }> = {};
      phaseGroups.forEach((group, phaseIndex) => {
        group.tasks.forEach((t, idx) => {
          taskNumbers[t.id] = { type: t.type, number: `${phaseIndex + 1}.${idx + 1}` };
        });
      });

      const groups = phaseGroups.map((group, phaseIndex) => {
        const items = group.tasks.map((t, idx) => {
          let antecedentLabel = '—';
          if (t.antecedent && t.antecedent !== '—') {
            const antInfo = taskNumbers[t.antecedent];
            if (antInfo) {
              antecedentLabel = antInfo.type === 'tache' ? `T. ${antInfo.number}` : `J. ${antInfo.number}`;
            } else {
              antecedentLabel = t.antecedent;
            }
          }
          return { 
            ...t, 
            number: `${phaseIndex + 1}.${idx + 1}`,
            antecedentLabel
          };
        });
        return { phase: group.phase, items };
      });
      return { ...project, groups };
    });

    let totalMinStart = Infinity;
    let totalMaxEnd = -Infinity;
    let hasTotalValidDates = false;

    enrichedProjects.forEach(project => {
      project.groups.forEach(group => {
        group.items.forEach(t => {
          const sd = new Date(t.startDate).getTime();
          const ed = new Date(t.endDate).getTime();
          if (!isNaN(sd) && !isNaN(ed)) {
            hasTotalValidDates = true;
            if (sd < totalMinStart) totalMinStart = sd;
            if (ed > totalMaxEnd) totalMaxEnd = ed;
          }
        });
      });
    });

    let totalCpmText: string | null = null;
    if (hasTotalValidDates) {
      const diffDays = Math.ceil((totalMaxEnd - totalMinStart) / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays >= 365) {
          const years = (diffDays / 365).toFixed(1);
          totalCpmText = `${years} an${Number(years) > 1 ? 's' : ''} (${diffDays} j)`;
      } else if (diffDays >= 30) {
          const months = (diffDays / 30).toFixed(1);
          totalCpmText = `~${months} mois (${diffDays} j)`;
      } else {
          totalCpmText = `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
      }
    }

    return (
      <div className="animate-in fade-in duration-300 pb-10 flex flex-col h-full">
        <div className="flex justify-between items-center border-b pb-2 border-sky-200 shrink-0 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <CalendarDays className="w-5 h-5 mr-2 text-sky-600" /> 
              Diagramme de Gantt (Visualisation Graphique)
            </h2>
            <p className="text-xs text-slate-500">Planification prévisionnelle versus exécution constatée sur échelle temporelle paramétrable</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl shadow-xs border border-slate-200 mb-4 shrink-0">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center">
              <Filter className="w-3 h-3 mr-1 text-sky-600" /> 1. Filtrer par Axe Stratégique
            </label>
            <div className="relative">
              <select 
                className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-800 text-sm font-medium rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 p-2.5 pr-8 outline-none transition-shadow cursor-pointer"
                value={filterGanttAxe}
                onChange={(e) => { 
                  setFilterGanttAxe(e.target.value); 
                  setFilterGanttProj('FULL');
                }}
              >
                <option value="FULL">Toutes les données (Vue Globale)</option>
                {activeDossier?.axes?.map(axe => (
                  <option key={axe.id} value={axe.id}>{axe.name}</option>
                ))}
              </select>
              <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 top-3 rotate-90 pointer-events-none" />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center">
              <Filter className="w-3 h-3 mr-1 text-sky-600" /> 2. Filtrer par Projet OP
            </label>
            <div className="relative">
              <select 
                className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-800 text-sm font-medium rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 p-2.5 pr-8 outline-none transition-shadow cursor-pointer"
                value={filterGanttProj}
                onChange={(e) => setFilterGanttProj(e.target.value)}
              >
                <option value="FULL">Tous les projets {filterGanttAxe !== 'FULL' ? 'de cet axe' : ''}</option>
                {allProjects
                  .filter(p => filterGanttAxe === 'FULL' || p.axeId === filterGanttAxe)
                  .map((proj, idx) => (
                    <option key={proj.id} value={proj.id}>{idx + 1}. {proj.name}</option>
                  ))}
              </select>
              <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 top-3 rotate-90 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xs border border-slate-200 flex flex-col overflow-hidden mb-6">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 shrink-0 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center">
              <CalendarDays className="w-5 h-5 mr-2 text-sky-600" />
              Planification Graphique & Ordonnancement
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-3 px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs bg-white text-xs font-bold text-slate-600">
                <div className="flex items-center"><div className="w-3 h-1.5 bg-sky-300 rounded mr-1.5"></div>Prévu</div>
                <div className="flex items-center"><div className="w-3 h-1.5 bg-rose-500 rounded mr-1.5"></div>Réel (Exécuté)</div>
              </div>
              
              {totalCpmText && (
                <div className="flex items-center space-x-2 px-4 py-1.5 rounded-lg border border-sky-300 shadow-inner bg-gradient-to-r from-sky-50 to-sky-100 text-xs font-black text-sky-800" title="Durée globale de tous les projets affichés">
                  <Activity className="w-4 h-4 text-sky-600" />
                  <span className="uppercase tracking-widest tabular-nums">Horizon : {totalCpmText}</span>
                </div>
              )}

              <div className="flex items-center space-x-3 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-xs text-sm flex-wrap">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="font-bold text-slate-600 text-xs">Vue :</span>
                <select value={ganttViewMode} onChange={e => setGanttViewMode(e.target.value)} className="border border-slate-300 rounded px-2 py-1 outline-none font-medium text-slate-700 text-xs cursor-pointer">
                  <option value="jour">Jours</option>
                  <option value="semaine">Semaines</option>
                  <option value="mois">Mois</option>
                  <option value="trimestre">Trimestres</option>
                  <option value="semestre">Semestres</option>
                </select>
                <div className="h-4 w-px bg-slate-300 mx-2"></div>
                <span className="font-bold text-slate-600 text-xs">Période :</span>
                <input type="month" value={ganttStartMonth} onChange={e => ganttStartMonth && setGanttStartMonth(e.target.value)} className="border border-slate-300 rounded px-1.5 py-1 text-xs cursor-pointer tabular-nums"/>
                <span className="text-slate-400 font-bold text-xs">à</span>
                <input type="month" value={ganttEndMonth} onChange={e => ganttEndMonth && setGanttEndMonth(e.target.value)} className="border border-slate-300 rounded px-1.5 py-1 text-xs cursor-pointer tabular-nums"/>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto relative max-h-[600px] hide-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap min-w-max">
              <thead className="bg-slate-800 text-white text-xs shadow-md sticky top-0 z-40">
                <tr>
                  <th className="px-2 py-3 border-b border-slate-700 border-r border-slate-600 sticky left-0 bg-slate-800 z-50 w-24 min-w-[96px] max-w-[96px] text-[10px] uppercase" rowSpan={2}>Tâche/Jalon</th>
                  <th className="px-3 py-3 border-b border-slate-700 border-r border-slate-600 sticky left-[96px] bg-slate-800 z-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] w-48 min-w-[192px] max-w-[192px] text-[10px] uppercase" rowSpan={2}>Activité</th>
                  <th className="px-1 py-3 border-b border-slate-700 border-r text-center w-16 min-w-[64px] max-w-[64px] text-[10px] uppercase" rowSpan={2}>Antécédent</th>
                  {ganttParents.map((parent, idx) => (
                    <th key={idx} className="px-4 py-1.5 border-b border-slate-700 border-r text-center font-bold" colSpan={parent.count}>{parent.label}</th>
                  ))}
                </tr>
                <tr className="bg-slate-700">
                  {ganttColumns.map((col, i) => (
                    <th key={i} className="px-2 py-1.5 text-center border-r border-slate-600 text-[10px] min-w-[40px] tabular-nums">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {enrichedProjects.length === 0 && (
                  <tr><td colSpan={3 + ganttColumns.length} className="text-center py-12 text-slate-400 italic">Aucun projet ne correspond à cette sélection.</td></tr>
                )}
                {enrichedProjects.map(project => {
                  return (
                    <React.Fragment key={`gantt-p-${project.id}`}>
                      <tr className="bg-slate-200 border-b">
                        <td colSpan={3 + ganttColumns.length} className="px-4 py-3 font-bold text-slate-800 text-sm bg-slate-200 z-20 relative">
                          <div className="flex justify-between items-center w-max sticky left-4 z-40">
                            <span className="flex items-center">
                              Projet : <span className="text-sky-700 ml-1 font-black">{project.name || ''}</span>
                            </span>
                          </div>
                        </td>
                      </tr>
                      
                      {project.groups.map((group, idx) => (
                        <React.Fragment key={`gantt-${project.id}-phase-${idx}`}>
                          {(() => {
                            let phaseSpanText: string | null = null;
                            if (group.items && group.items.length > 0) {
                              let minStart = Infinity;
                              let maxEnd = -Infinity;
                              let hasValidDates = false;

                              group.items.forEach(t => {
                                const sd = new Date(t.startDate).getTime();
                                const ed = new Date(t.endDate).getTime();
                                if (!isNaN(sd) && !isNaN(ed)) {
                                  hasValidDates = true;
                                  if (sd < minStart) minStart = sd;
                                  if (ed > maxEnd) maxEnd = ed;
                                }
                              });

                              if (hasValidDates) {
                                const diffDays = Math.ceil((maxEnd - minStart) / (1000 * 60 * 60 * 24)) + 1;
                                if (diffDays >= 365) {
                                    const years = (diffDays / 365).toFixed(1);
                                    phaseSpanText = `Cycle : ${years} an${Number(years) > 1 ? 's' : ''} (${diffDays} j)`;
                                } else if (diffDays >= 30) {
                                    const months = (diffDays / 30).toFixed(1);
                                    phaseSpanText = `Cycle : ~${months} mois (${diffDays} j)`;
                                } else {
                                    phaseSpanText = `Cycle : ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
                                }
                              }
                            }

                            return (
                              <tr className="bg-slate-700 border-b border-slate-600">
                                <td colSpan={3 + ganttColumns.length} className="p-0">
                                  <div className="px-4 py-2 w-max text-sky-200 font-bold text-xs uppercase tracking-widest flex items-center sticky left-4 z-40">
                                    <span>PHASE : {group.phase}</span>
                                    {phaseSpanText && (
                                      <span className="ml-6 text-sky-300 font-black text-[10px] bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-sky-500/30 shadow-xs whitespace-nowrap tracking-normal flex items-center tabular-nums">
                                        <Activity className="w-3 h-3 mr-1" />
                                        {phaseSpanText}
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })()}
                          
                          {group.items.length === 0 ? (
                            <tr>
                              <td colSpan={3 + ganttColumns.length} className="px-8 py-3 text-left text-slate-400 italic text-[11px] bg-slate-50">
                                Aucune tâche n'est encore enregistrée pour cette phase.
                              </td>
                            </tr>
                          ) : (
                            group.items.map((item) => (
                              <tr key={`gantt-t-${item.id}`} className="group border-b hover:bg-sky-50/40 transition-colors text-xs bg-slate-50/60">
                                <td className="px-2 py-3 font-bold text-sky-700 sticky left-0 bg-slate-50 group-hover:bg-sky-50 z-30 border-r border-slate-200 w-24 min-w-[96px] max-w-[96px] text-[11px] tabular-nums">
                                  <div className="flex items-center">
                                    <span className="w-auto mr-1 truncate">{item.type === 'tache' ? `T. ${item.number}` : `J. ${item.number}`}</span>
                                    {item.type === 'jalon' && <Diamond className="w-3 h-3 text-amber-500 fill-current shrink-0" />}
                                  </div>
                                </td>
                                <td className="px-2 py-3 font-bold text-slate-800 whitespace-normal leading-tight border-r border-slate-200 text-[11px] sticky left-[96px] bg-slate-50 group-hover:bg-sky-50 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-48 min-w-[192px] max-w-[192px]">{item.name || ''}</td>
                                <td className="px-1 py-3 text-slate-600 text-center font-bold border-r border-slate-200 bg-slate-50/50 text-[10px] w-16 min-w-[64px] max-w-[64px] truncate" title={item.antecedentLabel}>{item.antecedentLabel}</td>
                                
                                {ganttColumns.map((col, i) => {
                                  const sd = new Date(item.startDate);
                                  const ed = new Date(item.endDate);
                                  
                                  const isAFaire = item.status === 'À faire';
                                  const isTermine = item.status === 'Terminé';

                                  let actualStartD: Date | null = null;
                                  let actualEndD: Date | null = null;
                                  
                                  if (!isAFaire) {
                                      actualStartD = (item.actualStartDate && !isNaN(new Date(item.actualStartDate).getTime())) 
                                          ? new Date(item.actualStartDate) 
                                          : sd;
                                          
                                      if (isTermine) {
                                          actualEndD = (item.actualEndDate && !isNaN(new Date(item.actualEndDate).getTime()))
                                              ? new Date(item.actualEndDate)
                                              : ed;
                                      } else {
                                          actualEndD = today;
                                      }
                                  }

                                  const colStart = col.start.getTime();
                                  const colEnd = col.end.getTime();

                                  let pActive = false, pStart = false, pEnd = false;
                                  if (!isNaN(sd.getTime()) && !isNaN(ed.getTime())) {
                                    const st = sd.getTime();
                                    const et = new Date(ed.getFullYear(), ed.getMonth(), ed.getDate(), 23, 59, 59).getTime();
                                    pActive = st <= colEnd && et >= colStart;
                                    pStart = st >= colStart && st <= colEnd;
                                    pEnd = et >= colStart && et <= colEnd;
                                  }

                                  let aActive = false, aStart = false, aEnd = false;
                                  if (actualStartD && actualEndD && !isNaN(actualStartD.getTime()) && !isNaN(actualEndD.getTime())) {
                                    const ast = actualStartD.getTime();
                                    const aet = actualEndD.getFullYear() ? new Date(actualEndD.getFullYear(), actualEndD.getMonth(), actualEndD.getDate(), 23, 59, 59).getTime() : new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).getTime();
                                    
                                    aActive = ast <= colEnd && aet >= colStart;
                                    aStart = ast >= colStart && ast <= colEnd;
                                    aEnd = isTermine ? (aet >= colStart && aet <= colEnd) : false;
                                  }

                                  const isJalon = item.type === 'jalon';

                                  let pClasses = 'absolute top-2.5 h-1.5 bg-sky-300 z-10 transition-all ';
                                  if (isJalon) {
                                      pClasses = 'absolute top-1 h-4 w-4 bg-sky-300 rounded-full z-10 left-1/2 -translate-x-1/2 flex items-center justify-center shadow-xs';
                                  } else {
                                      if (pStart && pEnd) pClasses += 'left-1 right-1 rounded-full';
                                      else if (pStart) pClasses += 'left-1 right-[-1px] rounded-l-full';
                                      else if (pEnd) pClasses += 'left-0 right-1 rounded-r-full';
                                      else pClasses += 'left-0 right-[-1px]';
                                  }

                                  let aClasses = 'absolute bottom-2.5 h-1.5 bg-rose-500 shadow-xs z-20 transition-all ';
                                  if (isJalon) {
                                      aClasses = 'absolute bottom-1 h-4 w-4 bg-rose-500 rounded-full shadow-xs z-20 left-1/2 -translate-x-1/2 flex items-center justify-center';
                                  } else {
                                      if (aStart && aEnd) aClasses += 'left-1 right-1 rounded-full';
                                      else if (aStart) aClasses += 'left-1 right-[-1px] rounded-l-full';
                                      else if (aEnd) aClasses += 'left-0 right-1 rounded-r-full';
                                      else aClasses += 'left-0 right-[-1px]';
                                  }

                                  return (
                                    <td key={i} className={`p-0 border-r border-slate-100 min-w-[40px] h-10 relative ${pActive || aActive ? 'bg-slate-50/50' : ''}`}>
                                      {pActive && (
                                        <div className={pClasses} title={`Prévu : ${item.name} (${sd.toLocaleDateString('fr-FR')} - ${ed.toLocaleDateString('fr-FR')})`}>
                                          {isJalon && <Diamond className="w-2.5 h-2.5 text-white fill-current" />}
                                        </div>
                                      )}
                                      {aActive && (
                                        <div className={aClasses} title={`Réel : ${item.name} (${actualStartD ? actualStartD.toLocaleDateString('fr-FR') : ''} - ${actualEndD ? actualEndD.toLocaleDateString('fr-FR') : 'En cours'})`}>
                                          {isJalon && <Diamond className="w-2.5 h-2.5 text-white fill-current" />}
                                        </div>
                                      )}
                                    </td>
                                  )
                                })}
                              </tr>
                            ))
                          )}
                        </React.Fragment>
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

  const renderKanban = () => {
    let filteredProjects = allProjects;
    if (filterKanbanAxe !== 'FULL') filteredProjects = filteredProjects.filter(p => p.axeId === filterKanbanAxe);
    if (filterKanbanProj !== 'FULL') filteredProjects = filteredProjects.filter(p => p.id === filterKanbanProj);
    const validProjIds = filteredProjects.map(p => p.id);

    const tasksToRender = allTasks
      .filter(t => t.projectId && validProjIds.includes(t.projectId))
      .sort((a, b) => {
        const dA = new Date(a.startDate).getTime();
        const dB = new Date(b.startDate).getTime();
        if (isNaN(dA) && isNaN(dB)) return 0;
        if (isNaN(dA)) return 1;
        if (isNaN(dB)) return -1;
        return dA - dB;
      });
    
    const cols: { id: Task['status']; title: string; color: string; bg: string }[] = [
      { id: 'À faire', title: 'À Faire', color: 'border-slate-300', bg: 'bg-slate-100/70' },
      { id: 'En cours', title: 'En Cours', color: 'border-sky-400', bg: 'bg-sky-50/60' },
      { id: 'Bloqué', title: 'Bloqué', color: 'border-rose-400', bg: 'bg-rose-50/60' },
      { id: 'Terminé', title: 'Terminé', color: 'border-emerald-400', bg: 'bg-emerald-50/60' }
    ];

    const handleDragStart = (e: React.DragEvent, task: Task) => {
      if (task.isReadOnly) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.setData('taskId', task.id);
      e.dataTransfer.setData('projectId', task.projectId || '');
      e.dataTransfer.setData('axeId', task.axeId || '');
      e.dataTransfer.setData('dossierId', task.dossierId || '');
    };

    const handleDrop = (e: React.DragEvent, newStatus: Task['status']) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData('taskId');
      const projectId = e.dataTransfer.getData('projectId');
      const axeId = e.dataTransfer.getData('axeId');
      const dossierId = e.dataTransfer.getData('dossierId');
      
      if (taskId && projectId && axeId && dossierId) {
        updateTaskStatus(dossierId, axeId, projectId, taskId, newStatus);
      }
    };

    return (
      <div className="animate-in fade-in duration-300 pb-10 flex flex-col h-full">
        <div className="flex justify-between items-center border-b pb-2 border-sky-200 shrink-0 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <Grid className="w-5 h-5 mr-2 text-sky-600" /> 
              Tableau Kanban
            </h2>
            <p className="text-xs text-slate-500">Flux d'avancement visuel et changement de statut interactif par glisser-déposer</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl shadow-xs border border-slate-200 mb-4 shrink-0">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center">
              <Filter className="w-3 h-3 mr-1 text-sky-600" /> 1. Filtrer par Axe Stratégique
            </label>
            <div className="relative">
              <select 
                className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-800 text-sm font-medium rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 p-2.5 pr-8 outline-none transition-shadow cursor-pointer"
                value={filterKanbanAxe}
                onChange={(e) => { 
                  setFilterKanbanAxe(e.target.value); 
                  setFilterKanbanProj('FULL');
                }}
              >
                <option value="FULL">Toutes les données (Vue Globale)</option>
                {activeDossier?.axes?.map(axe => (
                  <option key={axe.id} value={axe.id}>{axe.name}</option>
                ))}
              </select>
              <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 top-3 rotate-90 pointer-events-none" />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center">
              <Filter className="w-3 h-3 mr-1 text-sky-600" /> 2. Filtrer par Projet OP
            </label>
            <div className="relative">
              <select 
                className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-800 text-sm font-medium rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 p-2.5 pr-8 outline-none transition-shadow cursor-pointer"
                value={filterKanbanProj}
                onChange={(e) => setFilterKanbanProj(e.target.value)}
              >
                <option value="FULL">Tous les projets {filterKanbanAxe !== 'FULL' ? 'de cet axe' : ''}</option>
                {allProjects
                  .filter(p => filterKanbanAxe === 'FULL' || p.axeId === filterKanbanAxe)
                  .map((proj, idx) => (
                    <option key={proj.id} value={proj.id}>{idx + 1}. {proj.name}</option>
                ))}
              </select>
              <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 top-3 rotate-90 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 h-full items-start">
          {cols.map(col => (
            <div 
              key={col.id} 
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`${col.bg} p-4 rounded-xl min-w-[290px] flex-1 flex flex-col max-h-full border border-slate-200 shadow-xs transition-colors duration-200`}
            >
              <h3 className="font-bold border-b border-slate-200 pb-2 mb-3 text-slate-700 flex justify-between items-center text-xs uppercase tracking-wider">
                {col.title} <span className="bg-white text-xs px-2.5 py-0.5 rounded-full shadow-xs font-black tabular-nums">{tasksToRender.filter(t => t.status === col.id).length}</span>
              </h3>
              <div className="flex-1 overflow-y-auto pr-1 space-y-3 hide-scrollbar min-h-[180px]">
                {tasksToRender.filter(t => t.status === col.id).length === 0 && (
                  <div className="text-center text-xs text-slate-400 italic py-8 pointer-events-none">Aucune tâche dans cette colonne.</div>
                )}
                {tasksToRender.filter(t => t.status === col.id).map(task => (
                  <KanbanCard key={task.id} task={task} borderColor={col.color} onDragStart={handleDragStart} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Header Top Bar */}
      <header className="bg-white border-b border-slate-200 shadow-xs px-6 py-3 flex justify-between items-center shrink-0 z-50 relative">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-2 -ml-2 mr-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-200 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 bg-sky-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-inner uppercase tracking-wider">
            {currentInstitution.substring(0, 4)}
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-none tracking-tight uppercase">{currentInstitution}</h1>
            <p className="text-xs text-sky-600 font-bold tracking-wide uppercase mt-0.5">
              {isExploring && activeDossier ? activeDossier.name : "Suivi des tâches & Pilotage Stratégique"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {isExploring && activeDossier && (
            <div className="hidden sm:flex items-center space-x-2 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="truncate max-w-[200px]">{activeDossier.name}</span>
            </div>
          )}
          <button
            onClick={() => {
              setActiveTab('projects');
              setIsExploring(false);
            }}
            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
          >
            Changer de Portefeuille
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Navigation Sidebar */}
        <aside className={`bg-white border-slate-200 shrink-0 flex flex-col transition-all duration-300 ease-in-out overflow-hidden z-40 relative shadow-[4px_0_15px_-3px_rgba(0,0,0,0.03)] border-r ${isSidebarOpen ? 'w-56' : 'w-[72px]'}`}>
          <div className="w-full px-3 py-6 flex flex-col h-full overflow-y-auto hide-scrollbar overflow-x-hidden">
            <nav className="space-y-1.5 flex-1 text-[13px] font-bold">
              <button 
                onClick={() => { setActiveTab('accueil'); setIsExploring(false); }} 
                className={`w-full flex items-center ${isSidebarOpen ? 'px-4 space-x-3' : 'justify-center'} py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'accueil' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-500 hover:bg-sky-50 hover:text-sky-600'}`}
              >
                <Home className="w-5 h-5 shrink-0" />
                {isSidebarOpen && <span>Accueil</span>}
              </button>

              <button 
                onClick={() => { setActiveTab('projects'); setIsExploring(false); }} 
                className={`w-full flex items-center ${isSidebarOpen ? 'px-4 space-x-3' : 'justify-center'} py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'projects' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-500 hover:bg-sky-50 hover:text-sky-600'}`}
              >
                <Folder className="w-5 h-5 shrink-0" />
                {isSidebarOpen && <span>Portefeuilles</span>}
              </button>
              
              {isExploring && (
                <>
                  <div className="pt-2 pb-1">
                    {isSidebarOpen && (
                      <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase px-4 block">
                        Suivi Actif
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => setActiveTab('dashboard')} 
                    className={`w-full flex items-center ${isSidebarOpen ? 'px-4 space-x-3' : 'justify-center'} py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'dashboard' ? 'bg-teal-700 text-white shadow-md' : 'text-slate-500 hover:bg-teal-50 hover:text-teal-700'}`}
                  >
                    <LayoutDashboard className="w-5 h-5 shrink-0" />
                    {isSidebarOpen && <span>Dashboard</span>}
                  </button>
                  <button 
                    onClick={() => setActiveTab('processus')} 
                    className={`w-full flex items-center ${isSidebarOpen ? 'px-4 space-x-3' : 'justify-center'} py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'processus' ? 'bg-teal-700 text-white shadow-md' : 'text-slate-500 hover:bg-teal-50 hover:text-teal-700'}`}
                  >
                    <Activity className="w-5 h-5 shrink-0" />
                    {isSidebarOpen && <span>Saisie Opérations</span>}
                  </button>
                  <button 
                    onClick={() => setActiveTab('gantt')} 
                    className={`w-full flex items-center ${isSidebarOpen ? 'px-4 space-x-3' : 'justify-center'} py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'gantt' ? 'bg-teal-700 text-white shadow-md' : 'text-slate-500 hover:bg-teal-50 hover:text-teal-700'}`}
                  >
                    <CalendarDays className="w-5 h-5 shrink-0" />
                    {isSidebarOpen && <span>Gantt & Arcs</span>}
                  </button>
                  <button 
                    onClick={() => setActiveTab('kanban')} 
                    className={`w-full flex items-center ${isSidebarOpen ? 'px-4 space-x-3' : 'justify-center'} py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'kanban' ? 'bg-teal-700 text-white shadow-md' : 'text-slate-500 hover:bg-teal-50 hover:text-teal-700'}`}
                  >
                    <Grid className="w-5 h-5 shrink-0" />
                    {isSidebarOpen && <span>Tableau Kanban</span>}
                  </button>
                </>
              )}
            </nav>
            {isSidebarOpen ? (
              <div className="mt-auto pt-4 border-t border-slate-100 text-[10px] text-slate-500 flex flex-col items-center shrink-0">
                <div className="bg-sky-50/60 p-3 rounded-xl border border-sky-100 w-full text-center shadow-xs">
                  <div className="flex justify-center mb-1.5"><Shield className="w-4 h-4 text-sky-600" /></div>
                  <p className="font-bold text-slate-800 text-[11px] mb-0.5">Koffié Fabien Michael</p>
                  <p className="text-[8px] text-sky-700 font-bold uppercase tracking-wider mb-2">Propriété Intellectuelle</p>
                  <div className="space-y-1.5 text-slate-700 mt-2">
                    <p className="flex justify-center items-center font-medium tracking-wide"> +225 07 48 08 27 39</p>
                    <p className="flex justify-center items-center break-all font-medium"> fabien.frikupgeneration@gmail.com</p>
                  </div>
                  <p className="text-[8.5px] text-slate-500 mt-2.5 border-t border-sky-200/60 pt-2 leading-tight">
                    Toute reproduction interdite.<br/>Pour toute collaboration ou réutilisation, veuillez me contacter.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-auto pt-4 border-t border-slate-100 text-[10px] text-slate-400 text-center font-bold cursor-pointer flex flex-col items-center" title="Propriété de Koffié Fabien Michael&#10; +225 07 48 08 27 39&#10; fabien.frikupgeneration@gmail.com&#10;Pour toute collaboration, veuillez me contacter.">
                <Shield className="w-4 h-4 text-sky-500 mb-1" />
                <span className="text-slate-600 font-black">KFM</span>
              </div>
            )}
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 p-6 overflow-y-auto bg-slate-50 z-10 relative">
          <ErrorBoundary>
            {activeTab === 'accueil' && renderAccueil()}
            {activeTab === 'projects' && renderProjectManager()}
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'processus' && renderProcessus()}
            {activeTab === 'gantt' && renderGantt()}
            {activeTab === 'kanban' && renderKanban()}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return <MainApp />;
}
