import React, { useEffect, useRef } from 'react';
import {
  Menu,
  ShieldCheck,
  Calendar,
  Network,
  Kanban,
  FileCheck2,
  HardDrive,
  Save,
  Award,
  CheckSquare,
  GitBranch,
  User,
  Folder,
  FileText,
  Download,
  Upload,
  Printer,
  Users
} from 'lucide-react';
import { AppLogo } from './AppLogo';
import { LanguageCode } from '../types';
import { translations } from '../i18n';

interface LandingPageProps {
  isDark: boolean;
  language: LanguageCode;
  lastJsonFileName: string;
  onOpenSlidebar: () => void;
  onNavigateTab: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  isDark,
  language,
  lastJsonFileName,
  onOpenSlidebar,
  onNavigateTab
}) => {
  const t = translations[language];
  const containerRef = useRef<HTMLDivElement>(null);

  // Bidirectional Scroll Reveal (triggers both when scrolling down AND when scrolling up)
  useEffect(() => {
    const rootEl = containerRef.current;
    if (!rootEl) return;

    const elements = rootEl.querySelectorAll(
      '.scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-up'
    );

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
          } else {
            entry.target.classList.remove('is-revealed');
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    elements.forEach(el => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  const appModules = [
    {
      step: '01',
      id: 'profil',
      title: 'Profil Utilisateur & Identité',
      desc: 'Renseignez une seule fois vos coordonnées professionnelles (Nom, Fonction, Organisation, Email, Téléphone). Elles sont automatiquement injectées dans tous vos dossiers, votre Fiche Technique et vos 9 rapports PDF.',
      icon: User,
      direction: 'left'
    },
    {
      step: '02',
      id: 'projects',
      title: 'Dossiers Stratégiques, Axes & Projets',
      desc: 'Créez vos portefeuilles multi-annuels, structurez vos Axes Stratégiques et ajoutez vos Projets Opérationnels quel que soit votre secteur d’activité (entreprise, administration, ONG, cabinet).',
      icon: Folder,
      direction: 'right'
    },
    {
      step: '03',
      id: 'planification',
      title: 'Planification Macro des Activités & Jalons',
      desc: 'Saisissez dans un tableau unique par projet et phase le code (Tâche/Jalon), l’intitulé, le responsable, le budget, l’antécédent logique et les dates prévues (Déb. Prév, Fin Prév). Le mois et la durée se calculent automatiquement.',
      icon: Calendar,
      direction: 'left'
    },
    {
      step: '04',
      id: 'processus',
      title: 'Suivi des Tâches & Calcul Automatisé des Écarts',
      desc: 'Suivez l’exécution réelle au jour le jour : le statut évolue automatiquement selon la date d’aujourd’hui, seul le statut « Bloqué » est commutable manuellement, et les écarts de début et de fin sont calculés instantanément.',
      icon: CheckSquare,
      direction: 'right'
    },
    {
      step: '05',
      id: 'raci',
      title: 'Matrice des Responsabilités RACI',
      desc: 'Définissez clairement les rôles sur chaque activité et jalon : Réalisateur (R, synchronisé avec le Responsable), Autorité d’approbation (A), Consulté (C) et Informé (I).',
      icon: Users,
      direction: 'left'
    },
    {
      step: '06',
      id: 'gantt',
      title: 'Diagramme de Gantt Multi-Échelles & Arbre WBS',
      desc: 'Visualisez l’évolution temporelle par Jours, Semaine, Mois, Trimestre, Semestre ou Année avec les Phases de Projet, filtre par Responsable, colonnes Code/Activité figées à gauche et organigramme WBS interactif.',
      icon: GitBranch,
      direction: 'right'
    },
    {
      step: '07',
      id: 'pert',
      title: 'Réseau PERT & Chemin Critique (CPM)',
      desc: 'Basculez entre la matrice des Antécédents/Précédents et le graphe PERT dézoomable jusqu’à 10% avec interprétation dynamique des marges libres/totales et des risques sur le chemin critique.',
      icon: Network,
      direction: 'left'
    },
    {
      step: '08',
      id: 'kanban',
      title: 'Tableau Kanban Interactif Auto-Recalculé',
      desc: 'Déplacez vos tâches d’une colonne de statut à une autre selon l’exécution réelle : les dates prévues se recalculent automatiquement en conservant la durée et la logique des dépendances.',
      icon: Kanban,
      direction: 'right'
    },
    {
      step: '09',
      id: 'fiche',
      title: 'Fiche Technique & Générateur de 9 Documents A4',
      desc: 'Éditez la Fiche Technique multi-pages A4 (Page de garde, Sommaire, Acronymes, Synthèse & Graphiques, Gantt, Tableaux 1 & 2, PERT) ainsi que 9 documents institutionnels aux normes internationales.',
      icon: FileText,
      direction: 'left'
    }
  ];

  return (
    <div
      ref={containerRef}
      className={`flex flex-col overflow-x-hidden ${
        isDark ? 'text-slate-100' : 'text-slate-900'
      }`}
    >
      {/* SECTION 1: PRESENTATION GENERALE DE LA PLATEFORME (SANS DONNEES DE PROJET SPECIFIQUE) */}
      <section
        id="section-presentation"
        className="relative overflow-hidden py-8 sm:py-14 border-b border-[#90D5FF]/50 dark:border-slate-800"
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5 scroll-reveal-left">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#0284c7] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{t.home.heroBadge}</span>
              </div>
              <h2
                className={`text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {t.home.heroTitle}
              </h2>
              <p
                className={`text-sm sm:text-base leading-relaxed font-medium ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                {t.home.heroDesc}
              </p>

              <div
                onClick={onOpenSlidebar}
                className={`p-4 rounded-xl border-l-4 border-[#0284c7] cursor-pointer transition hover:opacity-95 ${
                  isDark
                    ? 'bg-slate-900/90 text-slate-200'
                    : 'bg-[#90D5FF]/20 text-slate-900'
                } text-xs sm:text-sm font-bold flex items-center space-x-3`}
              >
                <Award className="w-5 h-5 text-[#0284c7] shrink-0" />
                <span>{t.home.menuInstruction}</span>
              </div>

              {/* Capacités générales de la plateforme */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div
                  className={`p-3.5 rounded-xl border ${
                    isDark
                      ? 'bg-slate-900 border-slate-800'
                      : 'bg-white border-[#90D5FF]'
                  }`}
                >
                  <div className="text-[10px] font-extrabold uppercase text-[#0284c7]">
                    Méthodologies
                  </div>
                  <div className="text-sm sm:text-base font-black mt-1">
                    GAR · PERT · RACI
                  </div>
                </div>
                <div
                  className={`p-3.5 rounded-xl border ${
                    isDark
                      ? 'bg-slate-900 border-slate-800'
                      : 'bg-white border-[#90D5FF]'
                  }`}
                >
                  <div className="text-[10px] font-extrabold uppercase text-[#0284c7]">
                    Échelles Gantt
                  </div>
                  <div className="text-sm sm:text-base font-black mt-1">
                    Jour à Année
                  </div>
                </div>
                <div
                  className={`p-3.5 rounded-xl border ${
                    isDark
                      ? 'bg-slate-900 border-slate-800'
                      : 'bg-white border-[#90D5FF]'
                  }`}
                >
                  <div className="text-[10px] font-extrabold uppercase text-[#0284c7]">
                    Multi-Devises
                  </div>
                  <div className="text-sm sm:text-base font-black mt-1">
                    FCFA · EUR · USD
                  </div>
                </div>
                <div
                  className={`p-3.5 rounded-xl border ${
                    isDark
                      ? 'bg-slate-900 border-slate-800'
                      : 'bg-white border-[#90D5FF]'
                  }`}
                >
                  <div className="text-[10px] font-extrabold uppercase text-[#0284c7]">
                    Rapports Normés
                  </div>
                  <div className="text-sm sm:text-base font-black mt-1">
                    9 Modèles A4 PDF
                  </div>
                </div>
              </div>
            </div>

            {/* Carte Visuelle Officielle FAAB PLAN */}
            <div className="lg:col-span-5 flex justify-center scroll-reveal-right">
              <div
                className={`w-full max-w-md p-6 sm:p-8 rounded-3xl border-2 shadow-xl flex flex-col items-center text-center ${
                  isDark
                    ? 'bg-gradient-to-br from-slate-900 via-[#0c4a6e]/40 to-slate-900 border-[#90D5FF]/50'
                    : 'bg-gradient-to-br from-[#FFFFFF] via-[#90D5FF]/25 to-[#90D5FF]/40 border-[#90D5FF]'
                }`}
              >
                <AppLogo className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 mb-4" />
                <div className="text-xs font-black uppercase tracking-widest text-[#0284c7]">
                  SYSTÈME UNIVERSEL DE PILOTAGE DE PROJETS
                </div>
                <h3
                  className={`mt-2 text-lg sm:text-xl font-black ${
                    isDark ? 'text-white' : 'text-[#0c4a6e]'
                  }`}
                >
                  FAAB PLAN — Ingénierie & Suivi Opérationnel
                </h3>
                <p
                  className={`mt-2 text-xs leading-relaxed font-medium ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Une solution tout-en-un pour structurer vos portefeuilles,
                  ordonnancer vos tâches par phases sur le chemin critique,
                  gérer votre matrice RACI, suivre l’exécution réelle et générer
                  vos rapports officiels A4.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: COMMENT UTILISER L'APPLICATION & SON CONTENU EN GENERAL (EFFET GAUCHE / DROITE) */}
      <section
        id="section-utilisation"
        className={`py-10 sm:py-14 border-b rounded-2xl my-4 ${
          isDark
            ? 'bg-slate-900/40 border-slate-800'
            : 'bg-sky-50/40 border-[#90D5FF]/40'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 space-y-8">
          <div className="max-w-3xl scroll-reveal-left">
            <div className="text-xs font-extrabold uppercase tracking-widest text-[#0284c7]">
              Mode d’Emploi Complet & Contenu de la Plateforme
            </div>
            <h2
              className={`text-xl sm:text-3xl font-black mt-1 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Comment utiliser FAAB PLAN étape par étape ?
            </h2>
            <p
              className={`text-xs sm:text-sm mt-2 leading-relaxed ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              Découvrez l’architecture complète de l’application et le rôle de
              chaque module accessible depuis le menu déroulant (☰) :
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {appModules.map(mod => {
              const Icon = mod.icon;
              const animClass =
                mod.direction === 'left'
                  ? 'scroll-reveal-left'
                  : 'scroll-reveal-right';
              return (
                <div
                  key={mod.id}
                  onClick={() => onNavigateTab(mod.id)}
                  className={`${animClass} p-5 rounded-2xl border transition hover:border-[#0284c7] cursor-pointer flex items-start gap-4 shadow-2xs ${
                    isDark
                      ? 'bg-slate-900 border-slate-800'
                      : 'bg-[#FFFFFF] border-[#90D5FF]/70'
                  }`}
                >
                  <div className="w-11 h-11 rounded-xl bg-[#90D5FF] text-slate-950 flex flex-col items-center justify-center shrink-0 font-black text-xs shadow-xs">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-black text-[#0284c7]">
                        ÉTAPE {mod.step}
                      </span>
                      <h3
                        className={`text-sm font-black ${
                          isDark ? 'text-white' : 'text-[#0c4a6e]'
                        }`}
                      >
                        {mod.title}
                      </h3>
                    </div>
                    <p
                      className={`text-xs leading-relaxed ${
                        isDark ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      {mod.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 3: LES 4 PILIERS METHODOLOGIQUES ET LES 4 ICONES D'ACTION */}
      <section
        id="section-methodologie"
        className="py-10 sm:py-14 border-b border-[#90D5FF]/40 dark:border-slate-800"
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-4 space-y-10">
          <div className="max-w-3xl scroll-reveal-right">
            <div className="text-xs font-extrabold uppercase tracking-widest text-[#0284c7]">
              Ingénierie Méthodologique
            </div>
            <h2
              className={`text-xl sm:text-3xl font-black mt-1 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {t.home.pillarsTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                title: t.home.pillar1Title,
                desc: t.home.pillar1Desc,
                icon: Calendar,
                dir: 'left'
              },
              {
                title: t.home.pillar2Title,
                desc: t.home.pillar2Desc,
                icon: Network,
                dir: 'left'
              },
              {
                title: t.home.pillar3Title,
                desc: t.home.pillar3Desc,
                icon: Kanban,
                dir: 'right'
              },
              {
                title: t.home.pillar4Title,
                desc: t.home.pillar4Desc,
                icon: FileCheck2,
                dir: 'right'
              }
            ].map((pillar, i) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={i}
                  className={`${
                    pillar.dir === 'left'
                      ? 'scroll-reveal-left'
                      : 'scroll-reveal-right'
                  } p-5 rounded-2xl border transition shadow-xs ${
                    isDark
                      ? 'bg-slate-900 border-slate-800'
                      : 'bg-[#FFFFFF] border-[#90D5FF]/70'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#90D5FF] text-slate-950 flex items-center justify-center mb-4 shadow-xs">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4
                    className={`text-sm font-black mb-2 ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {pillar.title}
                  </h4>
                  <p
                    className={`text-xs leading-relaxed ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {pillar.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Explication des 4 icônes supérieures du menu déroulant */}
          <div
            className={`p-6 rounded-2xl border scroll-reveal-left ${
              isDark
                ? 'bg-slate-900 border-slate-800'
                : 'bg-sky-50/40 border-[#90D5FF]'
            }`}
          >
            <h3
              className={`text-sm sm:text-base font-black mb-4 ${
                isDark ? 'text-[#90D5FF]' : 'text-[#0c4a6e]'
              }`}
            >
              Fonctionnement des 4 Icônes d’Action Rapide (en haut du Menu
              Déroulant ☰)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div
                className={`p-3.5 rounded-xl border ${
                  isDark
                    ? 'bg-slate-800 border-slate-700'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 font-black text-[#0284c7] mb-1">
                  <Download className="w-4 h-4" />
                  <span>1. Importer JSON</span>
                </div>
                <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                  Chargez un fichier de sauvegarde `.json` existant depuis votre
                  ordinateur ou téléphone pour restaurer tous vos dossiers.
                </p>
              </div>
              <div
                className={`p-3.5 rounded-xl border ${
                  isDark
                    ? 'bg-slate-800 border-slate-700'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 font-black text-[#0284c7] mb-1">
                  <Save className="w-4 h-4" />
                  <span>2. Enregistrer / Mettre à jour JSON</span>
                </div>
                <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                  Écrase et met à jour directement votre fichier `.json` local
                  sans créer de doublons multiples.
                </p>
              </div>
              <div
                className={`p-3.5 rounded-xl border ${
                  isDark
                    ? 'bg-slate-800 border-slate-700'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 font-black text-[#0284c7] mb-1">
                  <Upload className="w-4 h-4" />
                  <span>3. Exporter une copie JSON</span>
                </div>
                <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                  Génère une nouvelle archive `.json` datée pour archiver une
                  étape clé ou la transmettre à un collaborateur.
                </p>
              </div>
              <div
                className={`p-3.5 rounded-xl border ${
                  isDark
                    ? 'bg-slate-800 border-slate-700'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 font-black text-[#0284c7] mb-1">
                  <Printer className="w-4 h-4" />
                  <span>4. Télécharger le Rapport PDF</span>
                </div>
                <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                  Édite instantanément la Fiche Technique & Résumé Exécutif
                  multi-pages au format A4 sur fond blanc pur `#FFFFFF`.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: GUIDE DE SAUVEGARDE JSON & PERSISTANCE INDEXEDDB */}
      <section
        id="section-sauvegarde"
        className="py-10 sm:py-14 border-b border-[#90D5FF]/40 dark:border-slate-800"
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div
            className={`p-6 sm:p-8 rounded-3xl border-2 scroll-reveal-right ${
              isDark
                ? 'bg-slate-900 border-[#90D5FF]/40'
                : 'bg-[#90D5FF]/15 border-[#90D5FF]'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#90D5FF]/50 dark:border-slate-800">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-widest text-[#0284c7]">
                  Persistance Hybride IndexedDB & File System Access
                </div>
                <h2
                  className={`text-xl sm:text-2xl font-black mt-1 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {t.home.backupTitle}
                </h2>
                <p
                  className={`text-xs sm:text-sm mt-1 font-medium ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  {t.home.backupSubtitle}
                </p>
              </div>
              <div className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#0c4a6e] text-white text-xs font-bold shrink-0">
                <Save className="w-4 h-4 text-[#90D5FF]" />
                <span>Base locale active : {lastJsonFileName}</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div
                className={`lg:col-span-5 p-5 rounded-2xl border scroll-reveal-left ${
                  isDark
                    ? 'bg-slate-800/80 border-slate-700'
                    : 'bg-white border-[#90D5FF]'
                }`}
              >
                <h3 className="text-sm font-black text-[#0284c7] flex items-center gap-2 mb-2">
                  <HardDrive className="w-4 h-4" />
                  <span>{t.home.backupHowTitle}</span>
                </h3>
                <p
                  className={`text-xs leading-relaxed ${
                    isDark ? 'text-slate-200' : 'text-slate-700'
                  }`}
                >
                  {t.home.backupHowDesc}
                </p>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    title: t.home.backupWhy1Title,
                    desc: t.home.backupWhy1Desc,
                    dir: 'right'
                  },
                  {
                    title: t.home.backupWhy2Title,
                    desc: t.home.backupWhy2Desc,
                    dir: 'left'
                  },
                  {
                    title: t.home.backupWhy3Title,
                    desc: t.home.backupWhy3Desc,
                    dir: 'right'
                  }
                ].map((w, idx) => (
                  <div
                    key={idx}
                    className={`${
                      w.dir === 'left'
                        ? 'scroll-reveal-left'
                        : 'scroll-reveal-right'
                    } p-4 rounded-2xl border ${
                      isDark
                        ? 'bg-slate-800/50 border-slate-700'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <h4
                      className={`text-xs font-black mb-1.5 ${
                        isDark ? 'text-[#90D5FF]' : 'text-[#0c4a6e]'
                      }`}
                    >
                      {w.title}
                    </h4>
                    <p
                      className={`text-[11px] leading-relaxed ${
                        isDark ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      {w.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: CREDITS D'INGENIERIE & CONTRAT DE CONFIDENTIALITE / PROPRIETE INTELLECTUELLE */}
      <section id="section-credits" className="py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div
            className={`lg:col-span-5 p-6 rounded-2xl border scroll-reveal-left ${
              isDark
                ? 'bg-slate-900 border-slate-800'
                : 'bg-white border-[#90D5FF]'
            }`}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 rounded-xl bg-[#90D5FF] text-slate-950">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#0284c7]">
                  {t.home.creditsTitle}
                </div>
                <h3
                  className={`text-base font-black ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  KOFFIE FABIEN MICHAEL
                </h3>
              </div>
            </div>
            <div
              className={`space-y-2 text-xs ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              <p>
                <strong className="font-bold">{t.home.creatorLabel} :</strong>{' '}
                KOFFIE FABIEN MICHAEL
              </p>
              <p>
                <strong className="font-bold">Email :</strong>{' '}
                <span className="font-mono text-[#0284c7] font-semibold">
                  fabien.frikupgeneration@gmail.com
                </span>
              </p>
              <p>
                <strong className="font-bold">Contact / Téléphone :</strong>{' '}
                <span className="font-mono font-bold">00225 0748082739</span>
              </p>
            </div>
          </div>

          <div
            id="section-propriete"
            className={`lg:col-span-7 p-6 rounded-2xl border scroll-reveal-right ${
              isDark
                ? 'bg-slate-900 border-slate-800'
                : 'bg-sky-50/40 border-[#90D5FF]'
            }`}
          >
            <h3
              className={`text-sm font-black uppercase tracking-wider mb-2 flex items-center gap-2 ${
                isDark ? 'text-[#90D5FF]' : 'text-[#0c4a6e]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{t.home.legalTitle}</span>
            </h3>
            <p
              className={`text-xs leading-relaxed text-justify ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              {t.home.legalText}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
