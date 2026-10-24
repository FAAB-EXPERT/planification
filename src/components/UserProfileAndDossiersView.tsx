import React, { useState } from 'react';
import {
  User,
  Building2,
  Mail,
  Phone,
  Award,
  CheckCircle2,
  FolderOpen,
  FolderPlus,
  Plus,
  Trash2,
  Target,
  FolderKanban,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import {
  UserProfile,
  Dossier,
  CurrencyCode,
  LanguageCode
} from '../types';
import { AppLogo } from './AppLogo';
import { formatCurrency } from '../i18n';

interface UserProfileViewProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  language: LanguageCode;
  setLanguage: (l: LanguageCode) => void;
  onNavigateTab: (tab: string) => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  userProfile,
  setUserProfile,
  currency,
  setCurrency,
  language,
  setLanguage,
  onNavigateTab
}) => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0c4a6e] text-white rounded-2xl p-5 sm:p-6 border-b-4 border-[#90D5FF] shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-white p-2 rounded-xl shadow-md shrink-0">
            <AppLogo className="w-14 h-14 sm:w-16 sm:h-16" />
          </div>
          <div>
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#90D5FF] text-slate-950 text-[10px] font-black uppercase tracking-widest mb-1">
              IDENTITÉ & GOUVERNANCE
            </div>
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
              Profil Utilisateur & Identité du Responsable
            </h2>
            <p className="text-xs text-[#90D5FF] font-medium">
              Ces informations sont sauvegardées automatiquement dans l’IndexedDB de votre appareil et injectées dans la Fiche Technique A4 ainsi que dans les 9 Documents Institutionnels.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          Synchronisé en temps réel (IndexedDB)
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Card (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-[#0284c7] dark:text-[#90D5FF]" />
            Informations Professionnelles de l’Utilisateur
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Nom & Prénoms du Responsable
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#0284c7] absolute left-3 top-3" />
                <input
                  type="text"
                  value={userProfile.fullName}
                  onChange={e =>
                    setUserProfile(prev => ({ ...prev, fullName: e.target.value }))
                  }
                  placeholder="Ex: KOFFIE Fabien Michael"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#90D5FF]"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Fonction / Titre Officiel
              </label>
              <div className="relative">
                <Award className="w-4 h-4 text-[#0284c7] absolute left-3 top-3" />
                <input
                  type="text"
                  value={userProfile.role}
                  onChange={e =>
                    setUserProfile(prev => ({ ...prev, role: e.target.value }))
                  }
                  placeholder="Ex: Coordonnateur Général du Pilotage Stratégique / Chef de Projet"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#90D5FF]"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Organisation / Entreprise / Institution
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-[#0284c7] absolute left-3 top-3" />
                <input
                  type="text"
                  value={userProfile.institution}
                  onChange={e =>
                    setUserProfile(prev => ({
                      ...prev,
                      institution: e.target.value
                    }))
                  }
                  placeholder="Ex: Direction Générale de la Stratégie & Pilotage des Projets"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#90D5FF]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Adresse Email Professionnelle
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#0284c7] absolute left-3 top-3" />
                <input
                  type="email"
                  value={userProfile.email}
                  onChange={e =>
                    setUserProfile(prev => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="Ex: contact@organisation.org"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#90D5FF]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Contact / Téléphone
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#0284c7] absolute left-3 top-3" />
                <input
                  type="text"
                  value={userProfile.phone}
                  onChange={e =>
                    setUserProfile(prev => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="Ex: +225 07 00 00 00 00"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#90D5FF]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Devise Monétaire d’Affichage
              </label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value as CurrencyCode)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#90D5FF]"
              >
                <option value="FCFA">FCFA (XOF / XAF)</option>
                <option value="EUR">Euro (€)</option>
                <option value="USD">Dollar US ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Langue de l’Interface
              </label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value as LanguageCode)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#90D5FF]"
              >
                <option value="FR">Français (FR)</option>
                <option value="EN">English (EN)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Live Official Badge Preview Card (1 col) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-[#90D5FF] dark:border-sky-800 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="text-xs font-black uppercase tracking-wider text-[#0c4a6e] dark:text-[#90D5FF] border-b border-slate-100 dark:border-slate-800 pb-2">
              Aperçu du Cartouche Officiel (Rapports PDF)
            </div>

            <div className="p-4 rounded-xl bg-sky-50/70 dark:bg-slate-800 border border-[#90D5FF]/60 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#0c4a6e] text-[#90D5FF] flex items-center justify-center font-black text-base shrink-0">
                  {(userProfile.fullName || 'U').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-black text-slate-900 dark:text-white truncate">
                    {userProfile.fullName || 'Nom & Prénoms'}
                  </div>
                  <div className="text-[11px] font-bold text-[#0284c7] dark:text-[#90D5FF] truncate">
                    {userProfile.role || 'Fonction / Rôle'}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                <div>
                  <strong className="text-slate-500">Organisation :</strong>{' '}
                  {userProfile.institution || '—'}
                </div>
                <div>
                  <strong className="text-slate-500">Email :</strong>{' '}
                  {userProfile.email || '—'}
                </div>
                <div>
                  <strong className="text-slate-500">Téléphone :</strong>{' '}
                  {userProfile.phone || '—'}
                </div>
                <div>
                  <strong className="text-slate-500">Devise active :</strong>{' '}
                  <span className="px-2 py-0.5 rounded bg-[#90D5FF] text-slate-950 font-black text-[10px]">
                    {currency}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => onNavigateTab('planification')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0c4a6e] hover:bg-[#075985] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Aller à la Planification</span>
              <ArrowRight className="w-4 h-4 text-[#90D5FF]" />
            </button>
            <button
              onClick={() => onNavigateTab('fiche')}
              className="w-full py-2 px-4 rounded-xl bg-sky-100 dark:bg-slate-800 hover:bg-[#90D5FF] text-[#0c4a6e] dark:text-[#90D5FF] hover:text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Voir la Fiche Technique A4</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DossiersAndProjectsViewProps {
  dossiers: Dossier[];
  activeDossier: Dossier;
  setActiveDossierId: (id: string) => void;
  onCreateDossier: (name: string, desc: string, horizon: string) => void;
  onDeleteDossier: (id: string) => void;
  onAddAxe: () => void;
  onUpdateAxeName: (axeId: string, name: string) => void;
  onDeleteAxe: (axeId: string) => void;
  onAddProject: (axeId?: string) => void;
  onUpdateProjectName: (projectId: string, name: string) => void;
  onDeleteProject: (projectId: string) => void;
  currency: CurrencyCode;
  language: LanguageCode;
  onNavigateTab: (tab: string) => void;
}

export const DossiersAndProjectsView: React.FC<DossiersAndProjectsViewProps> = ({
  dossiers,
  activeDossier,
  setActiveDossierId,
  onCreateDossier,
  onDeleteDossier,
  onAddAxe,
  onUpdateAxeName,
  onDeleteAxe,
  onAddProject,
  onUpdateProjectName,
  onDeleteProject,
  currency,
  language,
  onNavigateTab
}) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [horizon, setHorizon] = useState('2026-2030');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateDossier(name.trim(), desc.trim(), horizon.trim() || '2026-2030');
    setName('');
    setDesc('');
  };

  const [pendingDelete, setPendingDelete] = useState<{
    type: 'dossier' | 'axe' | 'project';
    id: string;
    label: string;
  } | null>(null);

  return (
    <div className="space-y-3 sm:space-y-6 max-w-full overflow-x-hidden">
      {/* VALIDATION MODAL FOR DELETION OF DOSSIER, AXE OR PROJECT */}
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
                  Confirmez-vous la suppression définitive de{' '}
                  {pendingDelete.type === 'dossier'
                    ? 'ce dossier / programme'
                    : pendingDelete.type === 'axe'
                    ? 'cet axe stratégique'
                    : 'ce projet opérationnel'}{' '}
                  « <strong className="text-[#0c4a6e] dark:text-[#90D5FF]">{pendingDelete.label}</strong> » ?
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
                  if (pendingDelete.type === 'dossier') {
                    onDeleteDossier(pendingDelete.id);
                  } else if (pendingDelete.type === 'axe') {
                    onDeleteAxe(pendingDelete.id);
                  } else {
                    onDeleteProject(pendingDelete.id);
                  }
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

      {/* Compact Header & Quick Dossier Selector Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-2.5 sm:p-5 shadow-sm flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#90D5FF]/30 text-[#0c4a6e] dark:text-[#90D5FF] flex items-center justify-center shrink-0">
            <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[11px] sm:text-base font-black uppercase tracking-tight text-slate-900 dark:text-white truncate">
              Gestion des Dossiers, Axes & Projets
            </h2>
            <p className="text-[9.5px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
              Dossier Actif : <strong className="text-[#0284c7]">{activeDossier.name}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('planification')}
          className="inline-flex items-center gap-1 sm:gap-2 px-2.5 py-1 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-[#0c4a6e] text-white text-[9.5px] sm:text-xs font-black uppercase cursor-pointer shrink-0"
        >
          <span>Planification</span>
          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-[#90D5FF]" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
        {/* Create New Dossier Form (Compact on mobile) */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-2.5 sm:p-5 shadow-sm space-y-2 sm:space-y-4"
        >
          <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#0c4a6e] dark:text-[#90D5FF] flex items-center gap-1.5 sm:gap-2">
            <FolderPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Créer un Nouveau Dossier / Programme</span>
          </h3>

          <div className="grid grid-cols-3 sm:grid-cols-1 gap-1.5 sm:gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[9px] sm:text-[11px] font-bold uppercase text-slate-500 mb-0.5 sm:mb-1">
                Nom du Dossier / Programme
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Programme 2026-2030"
                className="w-full px-2 py-1 sm:px-3 sm:py-2 rounded-md sm:rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] sm:text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-[9px] sm:text-[11px] font-bold uppercase text-slate-500 mb-0.5 sm:mb-1">
                Horizon
              </label>
              <input
                type="text"
                value={horizon}
                onChange={e => setHorizon(e.target.value)}
                placeholder="2026-2030"
                className="w-full px-2 py-1 sm:px-3 sm:py-2 rounded-md sm:rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] sm:text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] sm:text-[11px] font-bold uppercase text-slate-500 mb-0.5 sm:mb-1">
              Description / Objectif Global
            </label>
            <textarea
              rows={2}
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Décrivez brièvement les objectifs du portefeuille..."
              className="w-full px-2 py-1 sm:px-3 sm:py-2 rounded-md sm:rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] sm:text-xs text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-[#0c4a6e] hover:bg-[#075985] text-white text-[10px] sm:text-xs font-black uppercase cursor-pointer"
          >
            + Créer et Activer ce Dossier
          </button>
        </form>

        {/* List of Dossiers & Active Dossier Structure */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4 min-w-0">
          {/* Ultra-Compact Dossiers / Programmes Selector on Mobile, Full Grid on Tablet/Desktop */}
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-2.5 sm:p-5 shadow-sm space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white truncate">
                Sélecteur de Dossiers / Programmes ({dossiers.length})
              </h3>
              {dossiers.length > 1 && (
                <button
                  onClick={() =>
                    setPendingDelete({
                      type: 'dossier',
                      id: activeDossier.id,
                      label: activeDossier.name
                    })
                  }
                  className="sm:hidden inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-[9px] font-bold cursor-pointer shrink-0"
                  title="Supprimer le dossier actif"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Mobile Ultra-Compact Select Dropdown */}
            <div className="sm:hidden">
              <select
                value={activeDossier.id}
                onChange={e => setActiveDossierId(e.target.value)}
                className="w-full h-7 px-2 py-0.5 rounded-md bg-sky-50/70 dark:bg-slate-800 border border-[#0284c7] text-[10px] font-extrabold text-slate-900 dark:text-white focus:outline-none truncate"
              >
                {dossiers.map(d => {
                  const dAxes = d.axes || [];
                  const dProjs = dAxes.flatMap(a => a.projects || []);
                  return (
                    <option key={d.id} value={d.id}>
                      {d.name} ({dAxes.length} Axes • {dProjs.length} Proj.)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Tablet & Desktop Cards Grid */}
            <div className="hidden sm:grid sm:grid-cols-2 gap-3">
              {dossiers.map(d => {
                const isAct = d.id === activeDossier.id;
                const dAxes = d.axes || [];
                const dProjs = dAxes.flatMap(a => a.projects || []);
                return (
                  <div
                    key={d.id}
                    className={`p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between gap-2 ${
                      isAct
                        ? 'border-[#0284c7] bg-sky-50/60 dark:bg-sky-950/40'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {d.name}
                        </span>
                        {isAct && (
                          <span className="px-2 py-0.5 rounded bg-[#90D5FF] text-slate-950 text-[9px] font-black uppercase shrink-0">
                            ACTIF
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {d.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 dark:border-slate-700 text-[10px] font-bold">
                      <span className="text-[#0284c7] dark:text-[#90D5FF]">
                        {dAxes.length} Axe(s) • {dProjs.length} Projet(s)
                      </span>
                      <div className="flex items-center gap-1.5">
                        {!isAct && (
                          <button
                            onClick={() => setActiveDossierId(d.id)}
                            className="px-2 py-0.5 rounded bg-[#0c4a6e] text-white text-[10px] font-bold cursor-pointer"
                          >
                            Activer
                          </button>
                        )}
                        {dossiers.length > 1 && (
                          <button
                            onClick={() =>
                              setPendingDelete({
                                type: 'dossier',
                                id: d.id,
                                label: d.name
                              })
                            }
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Supprimer ce dossier"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Dossier Axes & Projects (No Word Crushing on Mobile!) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-2.5 sm:p-5 shadow-sm space-y-2.5 sm:space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white truncate min-w-0 flex-1">
                Structure : {activeDossier.name}
              </h3>
              <button
                onClick={onAddAxe}
                className="inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-md sm:rounded-lg bg-[#90D5FF] hover:bg-sky-200 text-slate-950 text-[9.5px] sm:text-[11px] font-black cursor-pointer transition-colors shrink-0"
              >
                +Axe
              </button>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              {(activeDossier.axes || []).map((ax, aIdx) => (
                <div
                  key={ax.id}
                  className="p-2 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2"
                >
                  {/* AXE HEADER: Stacked cleanly on mobile so words never crush each other */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                    <div className="flex items-center justify-between sm:justify-start gap-1.5">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#0c4a6e] text-[#90D5FF] font-mono text-[9px] sm:text-[10px] font-black uppercase shrink-0">
                        <Target className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                        AXE {aIdx + 1}
                      </span>

                      {/* Mobile Action Buttons for Axe */}
                      <div className="flex sm:hidden items-center gap-1 shrink-0">
                        <button
                          onClick={() => onAddProject(ax.id)}
                          className="px-2 py-0.5 rounded bg-[#0c4a6e] hover:bg-[#075985] text-white text-[9px] font-black cursor-pointer transition-colors"
                        >
                          + Projet
                        </button>
                        {(activeDossier.axes || []).length > 1 && (
                          <button
                            onClick={() =>
                              setPendingDelete({
                                type: 'axe',
                                id: ax.id,
                                label: `AXE ${aIdx + 1} — ${ax.name}`
                              })
                            }
                            className="p-1 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Supprimer cet Axe"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <input
                      type="text"
                      value={ax.name}
                      onChange={e => onUpdateAxeName(ax.id, e.target.value)}
                      className="w-full min-w-0 flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-[10.5px] sm:text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0284c7]"
                    />

                    {/* Tablet/Desktop Action Buttons for Axe */}
                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onAddProject(ax.id)}
                        className="px-2.5 py-1 rounded-lg bg-[#0c4a6e] hover:bg-[#075985] text-white text-[10px] font-black cursor-pointer transition-colors"
                      >
                        + Projet
                      </button>
                      {(activeDossier.axes || []).length > 1 && (
                        <button
                          onClick={() =>
                            setPendingDelete({
                              type: 'axe',
                              id: ax.id,
                              label: `AXE ${aIdx + 1} — ${ax.name}`
                            })
                          }
                          className="p-1 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Supprimer cet Axe"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* PROJECTS LIST UNDER AXE */}
                  <div className="pl-2 sm:pl-4 border-l-2 border-[#90D5FF] space-y-1.5">
                    {(ax.projects || []).map((pr, pIdx) => {
                      const pTasks = pr.tasks || [];
                      const pBud = pTasks.reduce(
                        (s, tk) => s + (Number(tk.budget) || 0),
                        0
                      );
                      return (
                        <div
                          key={pr.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 text-[11px] bg-white dark:bg-slate-900 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
                        >
                          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 w-full min-w-0 flex-1">
                            <FolderKanban className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#0284c7] shrink-0" />
                            <span className="shrink-0 text-[9.5px] sm:text-[11px] font-black text-[#0c4a6e] dark:text-[#90D5FF]">
                              PRJ {aIdx + 1}.{pIdx + 1} :
                            </span>
                            <input
                              type="text"
                              value={pr.name}
                              onChange={e =>
                                onUpdateProjectName(pr.id, e.target.value)
                              }
                              className="w-full min-w-0 flex-1 bg-slate-50/70 sm:bg-transparent border border-slate-200/80 sm:border-transparent hover:border-slate-200 dark:border-slate-700 focus:border-[#0284c7] rounded px-1.5 py-0.5 text-[10px] sm:text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                            />
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-2 pl-4 sm:pl-0 shrink-0">
                            <span className="font-mono text-[9px] sm:text-[10px] font-bold text-slate-500 truncate">
                              {pTasks.length} tâche(s) •{' '}
                              {formatCurrency(pBud, currency, language)}
                            </span>
                            <button
                              onClick={() =>
                                setPendingDelete({
                                  type: 'project',
                                  id: pr.id,
                                  label: `PRJ ${aIdx + 1}.{pIdx + 1} — ${pr.name}`.replace('{pIdx + 1}', String(pIdx + 1))
                                })
                              }
                              className="p-0.5 sm:p-1 rounded text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
                              title="Supprimer ce Projet"
                            >
                              <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

