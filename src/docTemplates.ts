import {
  CurrencyCode,
  CustomDocFields,
  Dossier,
  InstitutionalDocType,
  LanguageCode,
  UserProfile
} from './types';
import { formatCurrency } from './i18n';
import {
  STANDARD_PHASES,
  computeDossierPertSummary,
  computeTaskMetrics,
  getTodayISO
} from './pertUtils';
import {
  DOC_TO_MATRICES_MAP,
  buildAllTxtMatrixVariables,
  buildStructuredA4TableFromMatrix,
  getMatrixDefinition,
  resolveActiveMatricesData
} from './docMatrices';

export interface DocFieldDescriptor {
  key: keyof CustomDocFields;
  label: string;
  placeholder: string;
  multiline?: boolean;
  rows?: number;
}

export type DocImageFieldKey =
  | 'leftLogoDataUrl'
  | 'rightLogoDataUrl'
  | 'bannerImageDataUrl'
  | 'figureImageDataUrl'
  | 'orgStampDataUrl'
  | 'partnerStampDataUrl'
  | 'profilePhotoDataUrl';

export interface DocImageFieldDescriptor {
  key: DocImageFieldKey;
  label: string;
  targetSection: string;
  helperText: string;
}

export const DOC_IMAGE_FIELD_DESCRIPTORS: DocImageFieldDescriptor[] = [
  {
    key: 'leftLogoDataUrl',
    label: '1. Logo Bailleur / Commanditaire',
    targetSection: 'Page de Garde (En-tête Haut Gauche)',
    helperText: 'Inséré dans le bloc [LOGO BAILLEUR / COMMANDITAIRE] en haut à gauche de la Page 1.'
  },
  {
    key: 'rightLogoDataUrl',
    label: '2. Logo Agence d’Exécution / Structure Pilote',
    targetSection: 'Page de Garde (En-tête Haut Droite) & En-têtes A4',
    helperText: 'Inséré dans le bloc [LOGO AGENCE D’EXÉCUTION] en haut à droite de la Page 1 et dans l’en-tête des pages.'
  },
  {
    key: 'bannerImageDataUrl',
    label: '3. Bannière / Image de l’Intervention',
    targetSection: 'Page de Garde (Visuel Contextuel Centré)',
    helperText: 'Inséré au centre de la Page 1 dans le cadre [BANNIÈRE / IMAGE DE L’INTERVENTION].'
  },
  {
    key: 'figureImageDataUrl',
    label: '4. Figure / Schéma ou Illustration Technique',
    targetSection: 'Section Figures & Corps du Document',
    helperText: 'Inséré dans la section des Figures & Schémas conceptuels et dans le corps du document.'
  },
  {
    key: 'orgStampDataUrl',
    label: '5. Signature & Cachet — Organisation Pilote',
    targetSection: 'Dernière Page (Bloc d’Approbation Gauche)',
    helperText: 'Inséré dans le cadre de signature officiel de l’Organisation / Autorité Pilote.'
  },
  {
    key: 'partnerStampDataUrl',
    label: '6. Signature & Cachet — Bailleur / Partie Prenante',
    targetSection: 'Dernière Page (Bloc d’Approbation Droite)',
    helperText: 'Inséré dans le cadre de signature « Lu et approuvé » du Partenaire / Bailleur.'
  }
];

/**
 * Retourne dynamiquement UNIQUEMENT les champs d'importation d'images ([IMAGE_...])
 * spécifiques au document sélectionné (en particulier pour la Catégorie D : Docs 12 à 15).
 */
export function getDocImageFieldDescriptors(
  docType: InstitutionalDocType
): DocImageFieldDescriptor[] {
  if (docType === 'cv_executif') {
    return [
      {
        key: 'profilePhotoDataUrl',
        label: '[IMAGE_PHOTO_PROFIL] — Photo Professionnelle Format Identité (Portrait 3.5 cm x 4.5 cm)',
        targetSection: 'Bandeau d’En-tête CV Exécutif (Haut Droite — 3.5 cm x 4.5 cm, bordure fine)',
        helperText:
          'Photo d’identité professionnelle positionnée dans le conteneur fixe à droite de l’en-tête (ratio 75% infos / 25% photo, object-fit: cover).'
      }
    ];
  }
  if (docType === 'cv_detaille') {
    return [
      {
        key: 'profilePhotoDataUrl',
        label: '[IMAGE_PHOTO_PROFIL] — Photo Professionnelle Format Identité (Portrait 3.5 cm x 4.5 cm)',
        targetSection: 'Page 1 — Bandeau d’En-tête Haut Droite (3.5 cm x 4.5 cm)',
        helperText:
          'Photo professionnelle positionnée en haut à droite de la Page 1 (format WB Form TECH-6 / EuropeAid / P11 ONU).'
      },
      {
        key: 'orgStampDataUrl',
        label: '[IMAGE_SIGNATURE_EXPERT] — Signature Numérisée de l’Expert (H: 2 cm)',
        targetSection: 'Page 4 — Section 10 (Attestation de Sincérité et d’Engagement)',
        helperText:
          'Insérée en bas du CV détaillé sous l’attestation sur l’honneur (Hauteur normalisée : 2 cm).'
      }
    ];
  }
  if (docType === 'pv_reunion') {
    return [
      {
        key: 'rightLogoDataUrl',
        label: '[IMAGE_LOGO_EMETTEUR] — Logo de l’Organisation Pilote / UGP (H: 1.5 cm)',
        targetSection: 'Bandeau d’En-tête Officiel du PV (Haut Gauche — H: 1.5 cm)',
        helperText: 'Inséré en haut à gauche du bandeau d’en-tête du Procès-Verbal de Réunion.'
      },
      {
        key: 'leftLogoDataUrl',
        label: '[IMAGE_LOGO_PARTENAIRE_BAILLEUR] — Logo du Bailleur / Partenaire (H: 1.5 cm)',
        targetSection: 'Bandeau d’En-tête Officiel du PV (Haut Droite — H: 1.5 cm)',
        helperText: 'Inséré en haut à droite du bandeau d’en-tête du Procès-Verbal de Réunion.'
      },
      {
        key: 'orgStampDataUrl',
        label: '[IMAGE_SIGNATURES_PV] — Signatures Scannées (Président de Séance & Rapporteur)',
        targetSection: 'Section 7 — Bloc de Validation et Signatures Officielles',
        helperText:
          'Inséré dans le tableau de validation finale à 2 colonnes en bas du Procès-Verbal.'
      }
    ];
  }
  if (docType === 'tdr_simplifie') {
    return [
      {
        key: 'rightLogoDataUrl',
        label: '[IMAGE_LOGO_EMETTEUR] — Logo de la Structure Commanditaire (H: 1.5 cm)',
        targetSection: 'Bandeau d’En-tête Opérationnel (Haut Gauche — H: 1.5 cm)',
        helperText: 'Inséré en haut à gauche du bandeau d’en-tête des TDR Simplifiés.'
      },
      {
        key: 'leftLogoDataUrl',
        label: '[IMAGE_LOGO_PARTENAIRE_BAILLEUR] — Logo du Bailleur de Fonds (H: 1.5 cm)',
        targetSection: 'Bandeau d’En-tête Opérationnel (Haut Droite — H: 1.5 cm)',
        helperText: 'Inséré en haut à droite du bandeau d’en-tête des TDR Simplifiés.'
      }
    ];
  }
  return DOC_IMAGE_FIELD_DESCRIPTORS;
}

export type DocPaginationCategory = 'A' | 'B' | 'C' | 'D';

export interface DocTemplateConfig {
  id: InstitutionalDocType;
  category: DocPaginationCategory;
  selectLabel: string;
  officialTitle: string;
  subtitle: string;
  badgeText: string;
  normativeReference: string;
  fields: DocFieldDescriptor[];
}

export interface CoverChartData {
  leftLogo: string;
  rightLogo: string;
  bannerTitle: string;
  bannerSubtitle: string;
  docTitle: string;
  docSubtitle: string;
  bottomLeftStructure: string;
  bottomLeftZone: string;
  bottomRightDateVersion: string;
  bottomRightStatus: string;
  leftLogoDataUrl?: string;
  rightLogoDataUrl?: string;
  bannerImageDataUrl?: string;
}

export interface AdminLetterHeaderData {
  senderInstitution: string;
  senderName: string;
  senderRole: string;
  senderContact: string;
  referenceCode: string;
  cityAndDate: string;
  recipientTitle: string;
  recipientOrg: string;
  subjectLine: string;
  dossierRefLine: string;
  leftLogoDataUrl?: string;
  rightLogoDataUrl?: string;
}

export interface CvHeaderBannerData {
  variant: 'cv_executif' | 'cv_detaille';
  docBadge: string;
  fullNameUpper: string;
  expertTitleLine: string;
  contactLine: string;
  metaSubLine: string;
  profilePhotoDataUrl?: string;
}

export interface OperationalHeaderBannerData {
  variant: 'pv_reunion' | 'tdr_simplifie';
  leftLogoLabel: string;
  rightLogoLabel: string;
  leftLogoDataUrl?: string;
  rightLogoDataUrl?: string;
  centerDocTitle: string;
  centerSubTitle: string;
  referenceAndDateLine: string;
}

export interface StructuredA4Table {
  headers: string[];
  rows: string[][];
  /** Ratios de largeur des colonnes en % (total = 100) pour table-layout: fixed */
  columnWidths?: number[];
  /** Indices des colonnes (0-based) à aligner à droite (ex: montants budgétaires) */
  rightAlignCols?: number[];
}

export interface StructuredA4Section {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  keyValueRows?: Array<[string, string]>;
  table?: StructuredA4Table;
  coverChart?: CoverChartData;
  adminLetterHeader?: AdminLetterHeaderData;
  cvHeaderBanner?: CvHeaderBannerData;
  operationalHeaderBanner?: OperationalHeaderBannerData;
  figureImage?: {
    dataUrl: string;
    caption: string;
  };
}

export interface StructuredA4Page {
  pageTitle: string;
  pageSubtitle: string;
  sections: StructuredA4Section[];
  isSignaturePage?: boolean;
  orgStampDataUrl?: string;
  partnerStampDataUrl?: string;
}

/**
 * Formateur monétaire haute précision pour les documents A4 et exports PDF :
 * remplace tout espace insécable (\u202F, \u00A0) par un espace ASCII standard
 * afin d'éliminer tout caractère parasite dans jsPDF et garantir un affichage net.
 */
export function formatDocAmount(
  amountFCFA: number = 0,
  currency: CurrencyCode = 'FCFA',
  lang: LanguageCode = 'FR'
): string {
  return formatCurrency(amountFCFA, currency, lang).replace(/[\u202F\u00A0]/g, ' ');
}

export const INTERNATIONAL_ACRONYMS_TABLE: string[][] = [
  ['GAR / RBM', 'Gestion Axée sur les Résultats (Results-Based Management)', 'Approche de gestion centrée sur la performance et l’atteinte mesurable des effets et impacts (PNUD / OCDE).'],
  ['OCDE / CAD', 'Comité d’Aide au Développement de l’OCDE', 'Référentiel normatif des 6 critères d’évaluation : Pertinence, Cohérence, Efficacité, Efficience, Impact, Durabilité.'],
  ['UNEG', 'Groupe des Nations Unies pour l’Évaluation (UN Evaluation Group)', 'Normes et règles d’éthique, d’indépendance, d’impartialité et de qualité des évaluations institutionnelles.'],
  ['PMBOK 7 / ISO 21500', 'Project Management Body of Knowledge / Norme ISO 21500:2021', 'Standards internationaux de gouvernance, d’ordonnancement et de maîtrise intégrée de projet.'],
  ['PERT / CPM', 'Program Evaluation and Review Technique / Critical Path Method', 'Modélisation algorithmique du réseau logique des tâches et identification du chemin critique à marge nulle.'],
  ['WBS / SDP', 'Work Breakdown Structure (Structure de Découpage du Projet)', 'Décomposition hiérarchique du portefeuille en Axes, Projets, Phases et Livrables élémentaires.'],
  ['RACI', 'Responsable (Réalisateur), Approbateur, Consulté, Informé', 'Matrice d’attribution des rôles et des responsabilités décisionnelles et opérationnelles par activité.'],
  ['RAID', 'Risks, Assumptions, Issues, Dependencies', 'Tableau de bord de maîtrise des Risques, Hypothèses, Problèmes/Incidents et Dépendances critiques.'],
  ['PTBA', 'Plan de Travail et Budget Annuel', 'Instrument de programmation opérationnelle et financière articulant les activités, jalons et crédits alloués.'],
  ['TdC / ToC', 'Théorie du Changement (Theory of Change)', 'Modèle causal expliquant comment les intrants et activités génèrent les extrants, effets directs et impacts.'],
  ['SMART', 'Spécifique, Mesurable, Atteignable, Réaliste, Temporellement défini', 'Standard de formulation et de validation des indicateurs de performance du Cadre de Résultats.'],
  ['GEROS / CLEAR', 'Global Evaluation Reports Oversight System (UNICEF / BM)', 'Système international d’assurance qualité et de notation des rapports et grilles d’évaluation.']
];

export const DOC_TEMPLATE_CONFIGS: Record<InstitutionalDocType, DocTemplateConfig> = {
  tdr: {
    id: 'tdr',
    category: 'B',
    selectLabel: '1. Termes de Référence (TDR)',
    officialTitle: 'TERMES DE RÉFÉRENCE OFFICIELS (TDR)',
    subtitle: 'Protocole Catégorie B (5 Pages) · Cadrage de Mission, Livrables, Profils d’Experts, Gouvernance RACI & Budget',
    badgeText: 'PROTOCOLE CATÉGORIE B — STANDARD PNUD / BANQUE MONDIALE / UE',
    normativeReference: 'Normes PNUD, Banque Mondiale, BAD, UE, PMBOK 7th Ed. & ISO 21500:2021',
    fields: [
      { key: 'referenceCode', label: 'Code Projet / Référence TDR', placeholder: 'Ex: TDR-FAAB-2026-001' },
      { key: 'locationCity', label: 'Zone Géographique / Pays & Ville', placeholder: 'Ex: Abidjan, Côte d’Ivoire' },
      { key: 'recipientOrg', label: 'Bailleur / Commanditaire / Prestataire Cible', placeholder: 'Ex: Cabinet / Équipe d’Exécution & PTF' },
      { key: 'recipientRepresentative', label: 'Profil / Chef de Mission & Équipe Clé', placeholder: 'Ex: Chef de Mission Senior (15 ans d’exp.)' },
      { key: 'contextJustification', label: '1. Contexte Stratégique, Justification & Alignement (ODD, Politique Nationale)', placeholder: 'Contexte, justification et alignement stratégique...', multiline: true, rows: 3 },
      { key: 'specificObjectives', label: '2. Objectif Général, Objectifs Spécifiques SMART & Résultats Attendus', placeholder: 'Objectif global, objectifs spécifiques et livrables...', multiline: true, rows: 3 },
      { key: 'methodologyApproach', label: '3. Périmètre d’Intervention & Approche Méthodologique Exigée', placeholder: 'Approche GAR, PERT/CPM, démarche participative...', multiline: true, rows: 3 },
      { key: 'governanceModalities', label: '5. Gouvernance, Comité de Pilotage & Modalités de Paiement par Livrable', placeholder: 'Instances de validation, tranches de paiement...', multiline: true, rows: 2 },
      { key: 'confidentialityClauses', label: '7. Clauses Déontologiques, Propriété Intellectuelle & Confidentialité', placeholder: 'Propriété des livrables, réserve et éthique...', multiline: true, rows: 2 },
      { key: 'recommendationsLessons', label: '8. Critères d’Évaluation Technique/Financière & Points de Vigilance', placeholder: 'Pondération 70/30 et maîtrise du chemin critique...', multiline: true, rows: 2 }
    ]
  },
  lettre_mission: {
    id: 'lettre_mission',
    category: 'B',
    selectLabel: '2. Lettre de Mission Officielle',
    officialTitle: 'LETTRE DE MISSION & MANDAT OPÉRATIONNEL',
    subtitle: 'Protocole Catégorie B (2 Pages) · Investiture Officielle, Cibles de Performance, Moyens Alloués & Feuille de Route',
    badgeText: 'PROTOCOLE CATÉGORIE B — MANDAT EXÉCUTIF PMO / ISO 21500',
    normativeReference: 'Standards Internationaux de Gouvernance Publique/Privée, PMBOK 7th Ed. & GAR',
    fields: [
      { key: 'referenceCode', label: 'N° de Référence du Mandat', placeholder: 'Ex: LM-FAAB-2026-004' },
      { key: 'locationCity', label: 'Zone Géographique / Lieu d’Émission', placeholder: 'Ex: Abidjan, Côte d’Ivoire' },
      { key: 'recipientRepresentative', label: 'Mandataire Désigné (Nom, Prénoms & Titre)', placeholder: 'Ex: M./Mme le Chef de Projet Opérationnel' },
      { key: 'recipientOrg', label: 'Direction / Unité de Gestion du Projet (UGP) / Bailleur', placeholder: 'Ex: Unité de Gestion du Programme Stratégique' },
      { key: 'contextJustification', label: '1. Contexte Institutionnel & Objet du Mandat', placeholder: 'Enjeux stratégiques et mandat confié...', multiline: true, rows: 3 },
      { key: 'specificObjectives', label: '2. Objectifs Assignés, Cibles de Performance & Livrables Clés', placeholder: 'Cibles de réalisation physique, calendaire et budgétaire...', multiline: true, rows: 3 },
      { key: 'methodologyApproach', label: '3. Prérogatives, Moyens Alloués & Délégation Budgétaire', placeholder: 'Autorité fonctionnelle, arbitrage PERT et gestion d’équipe...', multiline: true, rows: 2 },
      { key: 'governanceModalities', label: '4. Redevabilité, Reporting Périodique & Instances (COPIL)', placeholder: 'Fréquence des revues et reporting au Sponsor...', multiline: true, rows: 2 },
      { key: 'confidentialityClauses', label: '5. Éthique, Obligation de Réserve & Loyauté Institutionnelle', placeholder: 'Règles déontologiques et prévention des conflits d’intérêts...', multiline: true, rows: 2 },
      { key: 'recommendationsLessons', label: '6. Feuille de Route Critique & Priorités Immédiates', placeholder: 'Actions prioritaires des 30 premiers jours...', multiline: true, rows: 2 }
    ]
  },
  cadrage: {
    id: 'cadrage',
    category: 'C',
    selectLabel: '3. Rapport de Cadrage & Cahier des Charges (ProDoc)',
    officialTitle: 'RAPPORT DE CADRAGE & DOCUMENT DE PROJET (PRODOC)',
    subtitle: 'Protocole Catégorie C (10 Pages) · Théorie du Changement, Périmètre Théorique vs Réel, WBS/PTBA, RACI & Cadre Logique',
    badgeText: 'PROTOCOLE CATÉGORIE C — STANDARD PRODOC PNUD / BANQUE MONDIALE',
    normativeReference: 'Référentiels PNUD (ProDoc), Banque Mondiale, UNEG, OCDE/CAD & ISO 21500:2021',
    fields: [
      { key: 'referenceCode', label: 'Code Document / Référence Baseline', placeholder: 'Ex: RCP-FAAB-2026-005' },
      { key: 'locationCity', label: 'Zone Géographique / Pays d’Intervention', placeholder: 'Ex: Abidjan, Côte d’Ivoire' },
      { key: 'recipientOrg', label: 'Instance de Validation & Bailleur(s) de Fonds', placeholder: 'Ex: Comité Stratégique & Partenaires Techniques et Financiers' },
      { key: 'recipientRepresentative', label: 'Sponsor Exécutif / Président du COPIL', placeholder: 'Ex: Directeur Général / Coordonnateur National' },
      { key: 'contextJustification', label: '1. Diagnostic Initial, Problématique & Justification du Cadrage', placeholder: 'Diagnostic initial, problématique et alignement stratégique...', multiline: true, rows: 3 },
      { key: 'specificObjectives', label: '2. Théorie du Changement (TdC) & Chaîne de Résultats (Impact/Effets/Extrants)', placeholder: 'Chaîne causale : Intrants -> Activités -> Extrants -> Effets -> Impact...', multiline: true, rows: 3 },
      { key: 'methodologyApproach', label: '3. Périmètre Théorique vs Réel, Évaluabilité & Spécifications Techniques', placeholder: 'Analyse de faisabilité, hypothèses critiques et approche mixte...', multiline: true, rows: 3 },
      { key: 'governanceModalities', label: '5. Architecture de Gouvernance (COPIL, Comité Technique, UGP & RACI)', placeholder: 'Mécanismes de coordination et circuit d’approbation...', multiline: true, rows: 2 },
      { key: 'confidentialityClauses', label: '6. Assurance Qualité, Normes Éthiques & Procédures Fiduciaires', placeholder: 'Standards ISO, contrôle interne et conformité...', multiline: true, rows: 2 },
      { key: 'recommendationsLessons', label: '7. Matrice des Risques (Board RAID) & Conditions Préalables', placeholder: 'Mesures d’atténuation des risques opérationnels et financiers...', multiline: true, rows: 2 }
    ]
  },
  demarrage: {
    id: 'demarrage',
    category: 'C',
    selectLabel: '4. Rapport de Démarrage (Inception Report)',
    officialTitle: 'RAPPORT DE DÉMARRAGE OPÉRATIONNEL (INCEPTION REPORT)',
    subtitle: 'Protocole Catégorie C (10 Pages) · Bilan de Mobilisation, Revue Documentaire, Outils de Collecte, PTBA Actualisé & Risques',
    badgeText: 'PROTOCOLE CATÉGORIE C — INCEPTION REPORT UNEG / UE / BAD',
    normativeReference: 'Lignes Directrices UNEG, EuropeAid (UE), BAD, PNUD & PMBOK 7th Ed.',
    fields: [
      { key: 'referenceCode', label: 'Référence du Rapport de Démarrage', placeholder: 'Ex: RD-FAAB-2026-006' },
      { key: 'locationCity', label: 'Zone Géographique / Site de Lancement', placeholder: 'Ex: Abidjan, Côte d’Ivoire' },
      { key: 'recipientOrg', label: 'Autorité Contractante / Comité de Pilotage & Bailleur', placeholder: 'Ex: Secrétariat Technique du COPIL & PTF' },
      { key: 'recipientRepresentative', label: 'Destinataire Officiel (Nom & Fonction)', placeholder: 'Ex: Président du Comité de Pilotage' },
      { key: 'contextJustification', label: '1. Rappel du Contexte & Bilan de la Phase de Mobilisation (Kick-Off)', placeholder: 'État de mobilisation des équipes, locaux et équipements...', multiline: true, rows: 3 },
      { key: 'specificObjectives', label: '2. Revue Documentaire Initiale & Ajustements Méthodologiques', placeholder: 'Enseignements de la revue documentaire et ajustements...', multiline: true, rows: 3 },
      { key: 'methodologyApproach', label: '3. Validation des Outils de Collecte, Échantillonnage & Logistique', placeholder: 'Guides d’entretien, questionnaires, plan de déploiement terrain...', multiline: true, rows: 2 },
      { key: 'governanceModalities', label: '4. Plan de Communication, Coordination & Réunions de Lancement', placeholder: 'Comptes-rendus de lancement et calendrier des revues...', multiline: true, rows: 2 },
      { key: 'confidentialityClauses', label: '5. Protocoles de Sécurité des Données & Conformité Éthique', placeholder: 'Habilitations, archivage et protection des données...', multiline: true, rows: 2 },
      { key: 'recommendationsLessons', label: '6. Risques Opérationnels Identifiés au Démarrage & Plan d’Urgence', placeholder: 'Mesures immédiates de déblocage et sécurisation des prérequis...', multiline: true, rows: 2 }
    ]
  },
  cap: {
    id: 'cap',
    category: 'C',
    selectLabel: '5. Rapport CAP (Constatations, Analyses, Prescriptions)',
    officialTitle: 'RAPPORT D’AVANCEMENT & D’EXÉCUTION PÉRIODIQUE (CAP)',
    subtitle: 'Protocole Catégorie C (10 Pages) · Constatations Factuelles, Analyse des Écarts, Suivi Budgétaire PTBA & Prescriptions',
    badgeText: 'PROTOCOLE CATÉGORIE C — AUDIT DE PERFORMANCE GAR & CONTRÔLE CAP',
    normativeReference: 'Standards GAR (Gestion Axée sur les Résultats), Contrôle de Gestion & PMBOK 7',
    fields: [
      { key: 'referenceCode', label: 'Référence du Rapport CAP', placeholder: 'Ex: CAP-FAAB-2026-007' },
      { key: 'locationCity', label: 'Zone Géographique / Périmètre Audité', placeholder: 'Ex: Abidjan, Côte d’Ivoire' },
      { key: 'recipientOrg', label: 'Direction du Suivi-Évaluation, Contrôle & Bailleur', placeholder: 'Ex: Cellule Centrale S&E / Direction Générale' },
      { key: 'recipientRepresentative', label: 'Responsable Destinataire', placeholder: 'Ex: Coordonnateur Général / Contrôleur Général' },
      { key: 'contextJustification', label: '1. Constatations Factuelles sur l’Exécution Physique & Calendaire', placeholder: 'Faits saillants de la période, livrables produits et retards constatés...', multiline: true, rows: 3 },
      { key: 'specificObjectives', label: '2. Analyse Causale des Écarts (Début/Fin) & Goulots d’Étranglement', placeholder: 'Causes racines des glissements calendaires et des blocages...', multiline: true, rows: 3 },
      { key: 'methodologyApproach', label: '3. Exécution Budgétaire (PTBA vs Réalisé), Décaissement & Valeur Acquise', placeholder: 'Taux d’absorption budgétaire, efficience des dépenses...', multiline: true, rows: 2 },
      { key: 'governanceModalities', label: '4. Décisions d’Arbitrage Requises du Comité de Pilotage', placeholder: 'Réallocations budgétaires ou humains soumises à arbitrage...', multiline: true, rows: 2 },
      { key: 'confidentialityClauses', label: '5. Conformité aux Procédures Fiduciaires & Qualité des Livrables', placeholder: 'Vérification des pièces justificatives et validation des jalons...', multiline: true, rows: 2 },
      { key: 'recommendationsLessons', label: '6. Prescriptions Opérationnelles & Plan de Rattrapage Prioritaire', placeholder: 'Actions correctives chiffrées, responsables et échéances...', multiline: true, rows: 3 }
    ]
  },
  grille_evaluation: {
    id: 'grille_evaluation',
    category: 'B',
    selectLabel: '6. Grille d’évaluation (Matrice OCDE/CAD & UNEG)',
    officialTitle: 'GRILLE & MATRICE D’ÉVALUATION INSTITUTIONNELLE (OCDE/CAD)',
    subtitle: 'Protocole Catégorie B (5 Pages) · 6 Critères OCDE/CAD, Indicateurs SMART, Triangulation 3 Niveaux & Barème (1 à 5)',
    badgeText: 'PROTOCOLE CATÉGORIE B — NORME UNEG / OCDE-CAD / GEROS',
    normativeReference: 'Standards UNEG, Réseau OCDE/CAD (6 critères), UNICEF GEROS & Banque Mondiale',
    fields: [
      { key: 'referenceCode', label: 'Code de la Grille d’Évaluation', placeholder: 'Ex: GEV-FAAB-2026-010' },
      { key: 'locationCity', label: 'Zone Géographique / Périmètre Évalué', placeholder: 'Ex: Abidjan & Zones d’Intervention' },
      { key: 'recipientOrg', label: 'Commanditaire de l’Évaluation & Bailleur(s) de Fonds', placeholder: 'Ex: Comité d’Évaluation Indépendant & PTF (PNUD/BM/UE)' },
      { key: 'recipientRepresentative', label: 'Chef de Mission d’Évaluation / Expert Principal S&E', placeholder: 'Ex: Expert Senior en Suivi-Évaluation Certifié' },
      { key: 'contextJustification', label: '1. Note Méthodologique d’Utilisation de la Grille & Périmètre', placeholder: 'Objectif de la matrice d’évaluation, articulation avec la TdC et périmètre...', multiline: true, rows: 3 },
      { key: 'specificObjectives', label: '2. Structuration des Questions Évaluatives (Pertinence, Cohérence, Efficacité, Efficience, Impact, Durabilité)', placeholder: 'Questions clés par critère OCDE/CAD et critères de jugement...', multiline: true, rows: 3 },
      { key: 'methodologyApproach', label: '3. Protocole de Triangulation à 3 Niveaux & Collecte des Données', placeholder: 'Croisement des sources primaires/secondaires, méthodes mixtes...', multiline: true, rows: 3 },
      { key: 'governanceModalities', label: '4. Dispositif d’Assurance Qualité (Groupe de Référence GRE & Validation)', placeholder: 'Processus de revue par les pairs et validation de la grille...', multiline: true, rows: 2 },
      { key: 'confidentialityClauses', label: '5. Conformité Éthique UNEG, Biais Méthodologiques & Limites', placeholder: 'Indépendance, anonymat, consentement éclairé et gestion des biais...', multiline: true, rows: 2 },
      { key: 'recommendationsLessons', label: '6. Pondération du Barème (Score 1 à 5) & Seuils d’Alerte Décisionnels', placeholder: 'Règles de calcul du score global et déclenchement des recommandations...', multiline: true, rows: 2 }
    ]
  },
  mi_parcours: {
    id: 'mi_parcours',
    category: 'C',
    selectLabel: '7. Évaluation à Mi-Parcours (Mid-Term Review)',
    officialTitle: 'RAPPORT D’ÉVALUATION À MI-PARCOURS (MID-TERM REVIEW)',
    subtitle: 'Protocole Catégorie C (10 Pages) · Analyse des 6 Critères OCDE/CAD, Performance à Mi-Étape & Plan de Réorientation',
    badgeText: 'PROTOCOLE CATÉGORIE C — REVUE À MI-PARCOURS OCDE/CAD & UNEG',
    normativeReference: 'Critères OCDE/CAD, Normes UNEG, PNUD, UNICEF, Banque Mondiale & BAD',
    fields: [
      { key: 'referenceCode', label: 'Référence de l’Évaluation à Mi-Parcours', placeholder: 'Ex: REMP-FAAB-2026-008' },
      { key: 'locationCity', label: 'Zone Géographique / Pays Couvert', placeholder: 'Ex: Abidjan, Côte d’Ivoire' },
      { key: 'recipientOrg', label: 'Commission d’Évaluation & Partenaires Techniques et Financiers', placeholder: 'Ex: Comité Conjoint de Suivi & Bailleurs de Fonds' },
      { key: 'recipientRepresentative', label: 'Président de la Commission / Évaluateur Principal', placeholder: 'Ex: Président de la Commission d’Évaluation' },
      { key: 'contextJustification', label: '1. Contexte de la Revue à Mi-Parcours & Rappel de la Théorie du Changement', placeholder: 'Justification de l’évaluation à mi-étape et évolution du contexte...', multiline: true, rows: 3 },
      { key: 'specificObjectives', label: '2. Pertinence, Cohérence & Efficacité à Mi-Parcours (Progrès vers les Extrants/Effets)', placeholder: 'Adéquation stratégique et degré d’atteinte des cibles à mi-étape...', multiline: true, rows: 3 },
      { key: 'methodologyApproach', label: '3. Efficience (Analyse Coût-Efficacité), Gouvernance & Viabilité Précoce', placeholder: 'Rythme de décaissement, respect des délais PERT et appropriation...', multiline: true, rows: 3 },
      { key: 'governanceModalities', label: '4. Fonctionnement Institutionnel, Coordination & Synergies Partenariales', placeholder: 'Efficacité du pilotage, du système S&E et de la coordination...', multiline: true, rows: 2 },
      { key: 'confidentialityClauses', label: '5. Contraintes Structurelles, Facteurs Externes & Leçons Apprises', placeholder: 'Facteurs ayant accéléré ou freiné la mise en œuvre...', multiline: true, rows: 2 },
      { key: 'recommendationsLessons', label: '6. Plan d’Action de Réorientation Stratégique & Opérationnelle (Seconde Moitié)', placeholder: 'Recommandations priorisées, réallocation budgétaire et calendrier révisé...', multiline: true, rows: 3 }
    ]
  },
  rapport_final: {
    id: 'rapport_final',
    category: 'C',
    selectLabel: '8. Rapport d’Évaluation Finale & Clôture',
    officialTitle: 'RAPPORT D’ÉVALUATION FINALE & D’ACHÈVEMENT (ICR / TERMINAL EVALUATION)',
    subtitle: 'Protocole Catégorie C (10 Pages) · Bilan Sommatif OCDE/CAD, Rendement Budgétaire Final, Impact, Durabilité & Quitus',
    badgeText: 'PROTOCOLE CATÉGORIE C — CLÔTURE & CAPITALISATION (ICR / UNEG)',
    normativeReference: 'Implementation Completion Report (Banque Mondiale), Terminal Evaluation (PNUD/UNEG) & ISO 21500',
    fields: [
      { key: 'referenceCode', label: 'Référence du Rapport Final', placeholder: 'Ex: RFA-FAAB-2026-009' },
      { key: 'locationCity', label: 'Zone Géographique / Lieu de Clôture', placeholder: 'Ex: Abidjan, Côte d’Ivoire' },
      { key: 'recipientOrg', label: 'Conseil d’Administration, Autorité Contractante & Bailleurs', placeholder: 'Ex: Direction Générale, Ministère de Tutelle & PTF' },
      { key: 'recipientRepresentative', label: 'Autorité de Clôture & Quitus', placeholder: 'Ex: Directeur Général / Représentant Résident' },
      { key: 'contextJustification', label: '1. Synthèse Rétrospective du Projet & Rappel de la Logique d’Intervention', placeholder: 'Historique complet du programme, de la conception à la clôture...', multiline: true, rows: 3 },
      { key: 'specificObjectives', label: '2. Bilan Définitif par Critère OCDE/CAD (Pertinence, Cohérence, Efficacité, Efficience)', placeholder: 'Évaluation sommative des extrants livrés et des effets obtenus...', multiline: true, rows: 3 },
      { key: 'methodologyApproach', label: '3. Analyse des Impacts à Long Terme, Effets Inattendus & Durabilité (Appropriation)', placeholder: 'Changements durables, viabilité financière/institutionnelle et stratégie de sortie...', multiline: true, rows: 3 },
      { key: 'governanceModalities', label: '4. Passation des Acquis, Transfert de Patrimoine & Dispositif Post-Projet', placeholder: 'Transfert des livrables aux structures pérennes et quitus...', multiline: true, rows: 2 },
      { key: 'confidentialityClauses', label: '5. Archivage Légal, Audit Financier Final & Propriété Intellectuelle', placeholder: 'Clôture des comptes, archivage numérique et conformité fiduciaire...', multiline: true, rows: 2 },
      { key: 'recommendationsLessons', label: '6. Capitalisation des Bonnes Pratiques & Recommandations Stratégiques Futures', placeholder: 'Enseignements majeurs pour la formulation des prochains programmes...', multiline: true, rows: 3 }
    ]
  },
  note_methodo: {
    id: 'note_methodo',
    category: 'B',
    selectLabel: '9. Note Méthodologique & Protocole S&E',
    officialTitle: 'NOTE MÉTHODOLOGIQUE & DISPOSITIF DE SUIVI-ÉVALUATION (S&E)',
    subtitle: 'Protocole Catégorie B (5 Pages) · Ingénierie GAR, Algorithme PERT/CPM, Échantillonnage, Assurance Qualité & Biais',
    badgeText: 'PROTOCOLE CATÉGORIE B — INGÉNIERIE GAR / PERT-CPM / ISO 21500',
    normativeReference: 'Normes ISO 21500:2021, PMBOK 7th Edition, Guides GAR PNUD & Standards UNEG',
    fields: [
      { key: 'referenceCode', label: 'Référence de la Note Méthodologique', placeholder: 'Ex: NM-FAAB-2026-002' },
      { key: 'locationCity', label: 'Zone Géographique / Lieu d’Établissement', placeholder: 'Ex: Abidjan, Côte d’Ivoire' },
      { key: 'recipientOrg', label: 'Instance Destinataire (Comité Technique / COPIL / Bailleur)', placeholder: 'Ex: Comité de Pilotage & Direction Générale' },
      { key: 'recipientRepresentative', label: 'Autorité de Validation Méthodologique', placeholder: 'Ex: Président du Comité de Pilotage' },
      { key: 'contextJustification', label: '1. Compréhension Critique du Contexte & Enjeux de Pilotage', placeholder: 'Pourquoi cette architecture méthodologique est retenue...', multiline: true, rows: 3 },
      { key: 'specificObjectives', label: '2. Objectifs Méthodologiques, Fiabilisation des Indicateurs & Calcul des Écarts', placeholder: 'Résultats attendus de la démarche de planification et de suivi...', multiline: true, rows: 3 },
      { key: 'methodologyApproach', label: '3. Architecture en 5 Phases Normées, Modélisation PERT/CPM & Kanban', placeholder: 'Détail des 5 phases, calcul ES/EF/LS/LF et suivi temps réel...', multiline: true, rows: 3 },
      { key: 'governanceModalities', label: '4. Circuit de Collecte, Contrôle Qualité des Données & Validation des Jalons', placeholder: 'Rituels de revue, fréquence de mise à jour et validation...', multiline: true, rows: 2 },
      { key: 'confidentialityClauses', label: '5. Sécurité du Système d’Information S&E, Biais & Sauvegarde (IndexedDB / JSON)', placeholder: 'Règles d’accès, intégrité et traçabilité des sauvegardes...', multiline: true, rows: 2 },
      { key: 'recommendationsLessons', label: '6. Facteurs Clés de Succès & Recommandations d’Exploitation', placeholder: 'Bonnes pratiques pour maintenir la fiabilité du dispositif...', multiline: true, rows: 2 }
    ]
  },
  nda: {
    id: 'nda',
    category: 'B',
    selectLabel: '10. Accord de Confidentialité (NDA)',
    officialTitle: 'ACCORD INSTITUTIONNEL DE CONFIDENTIALITÉ & NON-DIVULGATION (NDA)',
    subtitle: 'Protocole Catégorie B (3 Pages) · Protection Juridique des Données Stratégiques, Budgets, Livrables & Propriété Intellectuelle',
    badgeText: 'PROTOCOLE CATÉGORIE B — INSTRUMENT JURIDIQUE & ISO/IEC 27001',
    normativeReference: 'Droit des Contrats Internationaux, Standards ISO/IEC 27001 & Protection des Données',
    fields: [
      { key: 'referenceCode', label: 'Référence de l’Accord NDA', placeholder: 'Ex: NDA-FAAB-2026-003' },
      { key: 'locationCity', label: 'Lieu de Juridiction & Signature', placeholder: 'Ex: Abidjan, Côte d’Ivoire' },
      { key: 'recipientOrg', label: 'Partie Réceptrice (Cabinet / Partenaire / Consultant)', placeholder: 'Ex: Partenaire Technique / Sous-traitant' },
      { key: 'recipientRepresentative', label: 'Représentant Légal Habilité', placeholder: 'Ex: Directeur Général / Consultant Principal' },
      { key: 'contextJustification', label: 'Article 1 — Objet de l’Accord & Périmètre du Portefeuille Protégé', placeholder: 'Cadre de coopération justifiant l’échange d’informations sensibles...', multiline: true, rows: 3 },
      { key: 'specificObjectives', label: 'Article 2 — Définition des Informations Confidentielles & Données Couvertes', placeholder: 'Périmètre des données techniques, financières, JSON et PDF protégées...', multiline: true, rows: 3 },
      { key: 'methodologyApproach', label: 'Article 3 — Mesures de Sécurité, Chiffrement & Traçabilité Documentaire', placeholder: 'Protocoles de protection physique et logique exigés...', multiline: true, rows: 2 },
      { key: 'confidentialityClauses', label: 'Article 4 — Obligations de Non-Divulgation, Durée Légale & Sanctions', placeholder: 'Engagements stricts, durée de validité post-clôture et pénalités...', multiline: true, rows: 3 },
      { key: 'governanceModalities', label: 'Article 5 — Juridiction Compétente, Arbitrage & Contrôle de Conformité', placeholder: 'Règlement des différends et autorité de contrôle...', multiline: true, rows: 2 },
      { key: 'recommendationsLessons', label: 'Article 6 — Restitution / Destruction des Supports en Fin de Mission', placeholder: 'Protocole de clôture des accès et attestation de destruction...', multiline: true, rows: 2 }
    ]
  },
  courrier_admin: {
    id: 'courrier_admin',
    category: 'A',
    selectLabel: '11. Courrier Administratif Classique (1 Page)',
    officialTitle: 'COURRIER ADMINISTRATIF OFFICIEL',
    subtitle: 'Protocole Catégorie A (1 Page A4 Stricte) · Correspondance Administrative & Institutionnelle Normée Sans Page de Garde',
    badgeText: 'PROTOCOLE CATÉGORIE A — CORRESPONDANCE OFFICIELLE 1 PAGE A4',
    normativeReference: 'Normes de Rédaction Administrative Internationale, Protocole Institutionnel & Gouvernance PMO',
    fields: [
      { key: 'referenceCode', label: 'N° de Référence / Enregistrement du Courrier', placeholder: 'Ex: N° 011/FAAB/DG/PMO/2026' },
      { key: 'locationCity', label: 'Lieu d’Émission (Ville)', placeholder: 'Ex: Abidjan' },
      { key: 'recipientRepresentative', label: 'Destinataire (Civilité, Titre / Fonction)', placeholder: 'Ex: À l’attention de Monsieur / Madame le Directeur Général' },
      { key: 'recipientOrg', label: 'Structure / Institution Destinataire & Localité', placeholder: 'Ex: Direction Générale / Partenaire Institutionnel — Abidjan' },
      { key: 'contextJustification', label: 'Objet du Courrier Administratif', placeholder: 'Ex: Transmission de l’état d’avancement et demande d’approbation...', multiline: true, rows: 2 },
      { key: 'specificObjectives', label: 'Paragraphe 1 — Formule d’Appel, Contexte & Fait Générateur', placeholder: 'Ex: Madame, Monsieur, Faisant suite aux conclusions de notre revue...', multiline: true, rows: 3 },
      { key: 'methodologyApproach', label: 'Paragraphe 2 — Argumentaire Technique, Calendaire (PERT) & Financier', placeholder: 'Exposé factuel de la situation, avancement, budget et jalons...', multiline: true, rows: 4 },
      { key: 'governanceModalities', label: 'Paragraphe 3 — Action Attendue, Échéance & Conclusion', placeholder: 'Suites attendues, demande de validation ou d’audience...', multiline: true, rows: 3 },
      { key: 'recommendationsLessons', label: 'Formule de Politesse Administrative', placeholder: 'Ex: Veuillez agréer, Madame, Monsieur, l’expression de ma haute considération.', multiline: true, rows: 2 },
      { key: 'confidentialityClauses', label: 'Pièces Jointes (P.J.) & Copies (C.C. / Ampliations)', placeholder: 'Ex: P.J. : 01 Dossier Exécutif · C.C. : COPIL, Direction Financière, Archives', multiline: true, rows: 2 }
    ]
  },
  cv_executif: {
    id: 'cv_executif',
    category: 'D',
    selectLabel: 'Document 12 : CV Professionnel Exécutif Chef de Projet / Expert (1 Page stricte - Avec Photo)',
    officialTitle: 'CURRICULUM VITAE EXÉCUTIF — CHEF DE PROJET / EXPERT INTERNATIONAL',
    subtitle: 'Catégorie D (1 Page A4 Stricte · Sans Page de Garde · Avec Photo 3.5x4.5cm) · Profil Exécutif, Compétences Clés, Expériences Chiffrées & Certifications',
    badgeText: 'CATÉGORIE D — CV EXÉCUTIF 1 PAGE STRICTE (AVEC PHOTO)',
    normativeReference: 'Standards Internationaux RH & Consulting Exécutif (PMP® / PMBOK® 7 / ISO 21500 / GAR / S&E)',
    fields: [
      {
        key: 'recipientRepresentative',
        label: '[TXT_CV1_NOM_TITRE_COORDONNEES] — Nom complet, Titre d’expertise, Téléphone, Email, LinkedIn, Ville/Pays, Nationalité',
        placeholder: 'Ex: KOFFIE FABIEN MICHAEL | Directeur de Programme & Expert PMP® / S&E | +225 0748082739 | Email | Abidjan, Côte d’Ivoire | Nationalité : Ivoirienne',
        multiline: true,
        rows: 2
      },
      {
        key: 'contextJustification',
        label: '[TXT_CV1_PROFIL_EXECUTIF] — Pitch exécutif (4 à 5 lignes résumant les années d’expérience, les bailleurs pratiqués et le volume budgétaire cumulé géré)',
        placeholder: 'Pitch exécutif percutant avec années d’expérience, bailleurs (BM, BAD, UE, PNUD) et budget cumulé géré...',
        multiline: true,
        rows: 3
      },
      {
        key: 'specificObjectives',
        label: '[TXT_CV1_COMPETENCES_CLES] — Domaines d’expertise (Gestion de cycle de projet, GAR, S&E, Passation de marchés, Leadership)',
        placeholder: 'Ingénierie de projet & PMO | Suivi-Évaluation & GAR | Gouvernance, Fiduciaire & Passation de marchés...',
        multiline: true,
        rows: 3
      },
      {
        key: 'methodologyApproach',
        label: '[TXT_CV1_EXPERIENCES_MAJEURES] — 3 à 4 expériences phares (Période, Poste, Employeur/Bailleur, Budget géré, 3 réalisations chiffrées par poste)',
        placeholder: '2022–2026 : Directeur de Programme... | 2018–2022 : Expert Principal S&E... | 2014–2018 : Coordonnateur UGP...',
        multiline: true,
        rows: 4
      },
      {
        key: 'governanceModalities',
        label: '[TXT_CV1_FORMATIONS_CERTIFICATIONS] — Diplômes universitaires (Master, Ingénieur, Doctorat) et certifications (PMP®, PRINCE2®, ISO 21500, GAR)',
        placeholder: 'Master / Diplôme d’Ingénieur + Certifications PMP®, ISO 21500, GAR/UNEG, PRINCE2®...',
        multiline: true,
        rows: 2
      },
      {
        key: 'confidentialityClauses',
        label: '[TXT_CV1_LANGUES_OUTILS] — Langues parlées (niveau CECRL) et logiciels maîtrisés (MS Project, Primavera, KoboToolbox, Power BI, SPSS/R)',
        placeholder: 'Français (C2), Anglais (C1) | MS Project, Primavera P6, FAAB PLAN, KoboToolbox, Power BI, SPSS/R...',
        multiline: true,
        rows: 2
      }
    ]
  },
  cv_detaille: {
    id: 'cv_detaille',
    category: 'D',
    selectLabel: "Document 13 : CV Professionnel Détaillé / Appel d'Offres Bailleurs (2 à 4 Pages - Très Détaillé Avec Photo)",
    officialTitle: 'CURRICULUM VITAE DÉTAILLÉ — FORMAT INTERNATIONAL BAILLEURS (BM / BAD / UE / ONU)',
    subtitle: 'Catégorie D (4 Pages A4 · Sans Page de Garde · Avec Photo 3.5x4.5cm) · Format WB Form TECH-6 / EuropeAid / P11 ONU avec Attestation Signée',
    badgeText: 'CATÉGORIE D — CV DÉTAILLÉ APPEL D’OFFRES BAILLEURS (4 PAGES)',
    normativeReference: 'Formats Officiels Banque Mondiale (Form TECH-6), BAD, Union Européenne (EuropeAid) & Nations Unies (P11)',
    fields: [
      {
        key: 'recipientRepresentative',
        label: '[TXT_CVD_ETAT_CIVIL_COORDONNEES] — Nom, Prénoms, Date de naissance, Nationalité, Pays de résidence, Coordonnées complètes, Poste proposé sur la mission',
        placeholder: 'Nom, Prénoms, Date de naissance, Nationalité, Résidence, Tél, Email, Poste proposé sur la mission...',
        multiline: true,
        rows: 2
      },
      {
        key: 'contextJustification',
        label: '[TXT_CVD_SYNTHESE_QUALIFICATIONS] — Résumé approfondi des qualifications pertinentes pour la mission (10 à 15 lignes)',
        placeholder: 'Synthèse exécutive approfondie articulée autour de l’expertise technique, méthodologique et régionale...',
        multiline: true,
        rows: 3
      },
      {
        key: 'specificObjectives',
        label: '[TXT_CVD_EDUCATION_DIPLOMES] — Cursus académique complet (Institution, Pays, Diplôme obtenu, Dates, Spécialisation)',
        placeholder: 'Institution / Université, Pays, Période, Diplôme obtenu, Domaine de spécialisation...',
        multiline: true,
        rows: 2
      },
      {
        key: 'methodologyApproach',
        label: '[TXT_CVD_CERTIFICATIONS_FORMATIONS] — Formations continues, accréditations internationales et ateliers méthodologiques',
        placeholder: 'PMP®, ISO 21500, GAR PNUD, Évaluation CLEAR/UNEG, Passation des marchés BM/BAD/FIDIC...',
        multiline: true,
        rows: 2
      },
      {
        key: 'governanceModalities',
        label: '[TXT_CVD_EXPERIENCES_PAR_PAYS_BAILLEURS] — Synthèse des pays d’intervention et des bailleurs pratiqués (BM, BAD, UE, PNUD, UNICEF, AFD, etc.)',
        placeholder: 'Pays d’intervention et bailleurs bi/multilatéraux pratiqués...',
        multiline: true,
        rows: 2
      },
      {
        key: 'extraField1',
        label: '[TXT_CVD_HISTORIQUE_PROJETS_DETAILLE] — Détail exhaustif de chaque mission/poste (Dates, Pays, Bailleur, Intitulé du projet, Montant, Fonction, Tâches, Livrables)',
        placeholder: 'Détail chronologique inversé des missions, responsabilités techniques et livrables produits...',
        multiline: true,
        rows: 4
      },
      {
        key: 'confidentialityClauses',
        label: '[TXT_CVD_PUBLICATIONS_AFFILIATIONS] — Publications scientifiques, rapports majeurs rédigés et affiliations à des ordres/associations professionnels',
        placeholder: 'Publications, études de référence, manuels méthodologiques et affiliations (PMI, RFE, AfrEA)...',
        multiline: true,
        rows: 2
      },
      {
        key: 'extraField2',
        label: '[TXT_CVD_LANGUES_MATRICE] — Niveau détaillé (Lu, Écrit, Parlé — Cadre Européen CECRL) par langue',
        placeholder: 'Français (Lu C2, Écrit C2, Parlé C2) | Anglais (Lu C1, Écrit C1, Parlé C1)...',
        multiline: true,
        rows: 2
      },
      {
        key: 'recommendationsLessons',
        label: '[TXT_CVD_REFERENCES_ATTESTATION] — 3 Personnes de référence (Nom, Titre, Organisation, Email, Téléphone) + Texte d’attestation sur l’honneur',
        placeholder: '3 personnes de référence vérifiables (Nom, Fonction, Organisation, Email & Tél direct)...',
        multiline: true,
        rows: 3
      }
    ]
  },
  pv_reunion: {
    id: 'pv_reunion',
    category: 'D',
    selectLabel: 'Document 14 : Procès-Verbal (PV) Officiel de Réunion (1 à 2 Pages - Sans Page de Garde)',
    officialTitle: 'PROCÈS-VERBAL OFFICIEL DE RÉUNION & RELEVÉ DE DÉCISIONS',
    subtitle: 'Catégorie D (2 Pages A4 · Sans Page de Garde) · Fiche Signalétique, Feuille de Présence (M4), Débats, Arbitrages & Matrice d’Actions (M10/M7)',
    badgeText: 'CATÉGORIE D — PROCÈS-VERBAL OFFICIEL DE RÉUNION (SANS PAGE DE GARDE)',
    normativeReference: 'Standards de Gouvernance COPIL / Comité Technique, ISO 21500 & Suivi des Instances PMO',
    fields: [
      {
        key: 'recipientRepresentative',
        label: '[TXT_PV_METADONNEES_REUNION] — Intitulé du Projet, Type de réunion (COPIL, Réunion Technique, Démarrage, Arbitrage), Date, Heure début/fin, Lieu / Lien Visio, Président de séance, Rapporteur',
        placeholder: 'Type de réunion, Horaire, Lieu / Visio, Président de séance, Secrétaire de séance (Rapporteur)...',
        multiline: true,
        rows: 2
      },
      {
        key: 'governanceModalities',
        label: '[TXT_PV_LISTE_PARTICIPANTS] — Présents (Nom, Structure, Fonction, Contact), Excusés et Absents',
        placeholder: 'Liste des participants présents, excusés et absents (synchronisée avec la Matrice M4)...',
        multiline: true,
        rows: 3
      },
      {
        key: 'contextJustification',
        label: '[TXT_PV_ORDRE_DU_JOUR] — Liste numérotée des points inscrits à l’ordre du jour',
        placeholder: '1. Vérification du quorum... 2. État d’avancement WBS/PERT... 3. Exécution budgétaire PTBA... 4. Arbitrages...',
        multiline: true,
        rows: 3
      },
      {
        key: 'specificObjectives',
        label: '[TXT_PV_SYNTHESE_DEBATS_CONSTATS] — Résumé structuré des présentations, échanges, points d’accord et points de blocage par point de l’ordre du jour',
        placeholder: 'Synthèse factuelle des présentations, débats et constats point par point...',
        multiline: true,
        rows: 3
      },
      {
        key: 'methodologyApproach',
        label: '[TXT_PV_DECISIONS_ARBITRAGES] — Décisions fermes arrêtées en séance et arbitrages budgétaires ou méthodologiques validés',
        placeholder: 'DÉCISION N°01 : ... | DÉCISION N°02 : ... | DÉCISION N°03 : ...',
        multiline: true,
        rows: 3
      },
      {
        key: 'confidentialityClauses',
        label: '[TXT_PV_MATRICE_DECISIONS_ACTIONS] — Plan d’actions issu de la réunion (Action, Responsable, Échéance, Indicateur de réalisation)',
        placeholder: 'Actions immédiates arrêtées en séance (synchronisées avec les Matrices M10 et M7)...',
        multiline: true,
        rows: 2
      },
      {
        key: 'recommendationsLessons',
        label: '[TXT_PV_PROCHAINE_REUNION] — Date, lieu et ordre du jour prévisionnel de la prochaine séance + Heure de levée de séance',
        placeholder: 'Date et ordre du jour prévisionnel de la prochaine réunion + Heure exacte de levée de séance...',
        multiline: true,
        rows: 2
      }
    ]
  },
  tdr_simplifie: {
    id: 'tdr_simplifie',
    category: 'D',
    selectLabel: 'Document 15 : Termes de Référence (TDR) Simplifiés avec Tableaux (1 à 3 Pages - Sans Page de Garde)',
    officialTitle: 'TERMES DE RÉFÉRENCE SIMPLIFIÉS (OPÉRATIONNELS)',
    subtitle: 'Catégorie D (2 Pages A4 · Sans Page de Garde) · Fiche Synoptique, Matrice des Tâches/Livrables (M2/M9), Grille 100 pts (M3), Échéancier de Paiement & Budget (M5)',
    badgeText: 'CATÉGORIE D — TDR SIMPLIFIÉS OPÉRATIONNELS AVEC TABLEAUX (SANS PAGE DE GARDE)',
    normativeReference: 'Normes Opérationnelles d’Exécution PTBA, GAR, PMBOK 7 & Procédures Bailleurs (BM / BAD / UE / PNUD)',
    fields: [
      {
        key: 'recipientRepresentative',
        label: '[TXT_TDRS_IDENTIFICATION] — Intitulé de l’activité/consultation, Code activité (PTBA), Projet de rattachement, Lieu d’exécution, Durée (Jours/Hommes), Période souhaitée, Superviseur direct',
        placeholder: 'Code PTBA, Lieu d’exécution, Durée (H/J), Période souhaitée, Superviseur direct (UGP)...',
        multiline: true,
        rows: 2
      },
      {
        key: 'contextJustification',
        label: '[TXT_TDRS_CONTEXTE_JUSTIFICATION_BREF] — Contexte opérationnel direct et justification de l’activité (1 à 2 paragraphes ciblés)',
        placeholder: 'Contexte opérationnel direct expliquant pourquoi l’activité est lancée maintenant...',
        multiline: true,
        rows: 3
      },
      {
        key: 'specificObjectives',
        label: '[TXT_TDRS_OBJECTIFS_SPECIFIQUES] — Objectif global (1 phrase) et 2 à 4 objectifs spécifiques opérationnels',
        placeholder: 'Objectif global (3.1) et Objectifs spécifiques OS1, OS2, OS3 (3.2)...',
        multiline: true,
        rows: 3
      },
      {
        key: 'extraField1',
        label: '[TXT_TDRS_RESULTATS_LIVRABLES_TABLEAU] — Résultats attendus et livrables tangibles avec délais et critères de validation',
        placeholder: 'Synthèse des livrables attendus, formats, délais (J+X) et instances de validation...',
        multiline: true,
        rows: 2
      },
      {
        key: 'methodologyApproach',
        label: '[TXT_TDRS_METHODOLOGIE_TACHES] — Étapes clés d’exécution et tâches précises confiées à l’intervenant/équipe',
        placeholder: 'Étapes méthodologiques (Cadrage, Déploiement opérationnel, Restitution & Clôture)...',
        multiline: true,
        rows: 3
      },
      {
        key: 'governanceModalities',
        label: '[TXT_TDRS_PROFIL_QUALIFICATIONS] — Qualifications clés requises (Diplôme, années d’expérience, compétences techniques spécifiques)',
        placeholder: 'Diplôme requis (Bac+5), années d’expérience, compétences techniques et grille sur 100 points...',
        multiline: true,
        rows: 2
      },
      {
        key: 'confidentialityClauses',
        label: '[TXT_TDRS_CHRONOGRAMME_PAIEMENT] — Échéancier de réalisation et modalités de paiement par livrable',
        placeholder: 'Ventilation des paiements par livrable (ex: 20% L1 / 40% L2 / 40% L3) et conditions de déblocage...',
        multiline: true,
        rows: 2
      },
      {
        key: 'recommendationsLessons',
        label: '[TXT_TDRS_BUDGET_DOSSIER_CANDIDATURE] — Enveloppe budgétaire estimative (ou pièces constitutives du dossier de soumission rapide)',
        placeholder: 'Pièces constitutives du dossier de candidature rapide et instructions de soumission...',
        multiline: true,
        rows: 2
      }
    ]
  }
};

/**
 * Synchronise automatiquement les champs spécifiques d'un document avec les données
 * réelles renseignées dans tous les autres onglets de l'application (Profil, Dossiers & Projets,
 * Planification, Suivi des tâches, RACI, Réseau PERT, Kanban, Gantt et Tableau de Bord).
 */
export function buildDynamicFieldsFromAppTabs(
  docType: InstitutionalDocType,
  baseFields: CustomDocFields,
  dossier: Dossier,
  userProfile: UserProfile,
  currency: CurrencyCode,
  lang: LanguageCode
): CustomDocFields {
  const todayISO = getTodayISO();
  const pertSummaries = computeDossierPertSummary(dossier, todayISO);
  const allNodes = pertSummaries.flatMap(p => p.nodes);

  let totalTasks = 0;
  let completedTasks = 0;
  let inProgressTasks = 0;
  let blockedTasks = 0;
  let todoTasks = 0;
  let delayedTasks = 0;
  let totalBudgetFCFA = 0;

  const uniqueAssignees = new Set<string>();
  const uniqueAuthorities = new Set<string>();
  const uniqueConsulted = new Set<string>();
  const uniqueInformed = new Set<string>();

  (dossier.axes || []).forEach(axe => {
    (axe.projects || []).forEach(proj => {
      (proj.tasks || []).forEach(tk => {
        totalTasks++;
        const m = computeTaskMetrics(tk, todayISO);
        const b = Number(tk.budget) || 0;
        totalBudgetFCFA += b;
        if (m.effectiveStatus === 'Terminé') completedTasks++;
        else if (m.effectiveStatus === 'En cours') inProgressTasks++;
        else if (m.effectiveStatus === 'Bloqué') blockedTasks++;
        else todoTasks++;

        if (m.ecartDebutDays > 0 || m.ecartFinDays > 0) delayedTasks++;

        if (tk.assignee) uniqueAssignees.add(tk.assignee);
        if (tk.autorite) uniqueAuthorities.add(tk.autorite);
        if (tk.consulte) uniqueConsulted.add(tk.consulte);
        if (tk.informe) uniqueInformed.add(tk.informe);
      });
    });
  });

  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const criticalNodes = allNodes.filter(n => n.isCritical);
  const criticalSeq = criticalNodes.map(n => n.code).join(' -> ') || 'N/A';
  const maxDur = pertSummaries.reduce((acc, p) => Math.max(acc, p.projectDuration), 0);
  const budgetFormatted = formatDocAmount(totalBudgetFCFA, currency, lang);

  const axesNames = (dossier.axes || []).map((a, i) => `Axe ${i + 1} (${a.name})`).join(' ; ');
  const projectsNames = (dossier.axes || [])
    .flatMap(a => a.projects || [])
    .map((p, i) => `P${i + 1}: ${p.name}`)
    .join(' ; ');

  const docPrefix = docType.toUpperCase().slice(0, 4);

  if (docType === 'courrier_admin') {
    return {
      ...baseFields,
      referenceCode: baseFields.referenceCode || `COUR-FAAB-${dossier.psdYear || 2026}-011`,
      locationCity: baseFields.locationCity || 'Abidjan',
      recipientOrg:
        dossier.institution ||
        userProfile.institution ||
        baseFields.recipientOrg ||
        'Direction Générale & Partenaires Institutionnels',
      recipientRepresentative:
        Array.from(uniqueAuthorities)[0] ||
        baseFields.recipientRepresentative ||
        'Monsieur / Madame le Président du Comité de Pilotage',
      contextJustification: `Transmission de l’état consolidé d’exécution et demande de validation des jalons du portefeuille « ${dossier.name} » (${progressPct}% réalisé · Budget : ${budgetFormatted}).`,
      specificObjectives: `Madame, Monsieur,\n\nFaisant suite aux orientations stratégiques arrêtées pour l’horizon ${dossier.horizonPlan}, j’ai l’honneur de soumettre à votre haute appréciation le point d’exécution actualisé du portefeuille « ${dossier.name} », coordonné par ${userProfile.fullName} (${userProfile.role}) au sein de ${userProfile.institution || dossier.institution}.`,
      methodologyApproach: `Sur le plan technique et financier, le portefeuille mobilise une enveloppe globale de ${budgetFormatted} répartie sur ${(dossier.axes || []).length} axe(s) stratégique(s), ${pertSummaries.length} projet(s) et ${totalTasks} activités/jalons. À ce jour, le taux de réalisation physique atteint ${progressPct}% (${completedTasks} activités terminées, ${inProgressTasks} en cours, ${blockedTasks} bloquées et ${todoTasks} à faire), avec un chemin critique PERT/CPM (${criticalSeq}) d’une durée incompressible de ${maxDur} jour(s) ouvré(s).`,
      governanceModalities: `Conformément aux dispositions de notre matrice de gouvernance RACI, nous sollicitons votre bienveillant accord sur les livrables réceptionnés ainsi que vos instructions d’arbitrage pour les opérations de la période à venir.`,
      confidentialityClauses: baseFields.confidentialityClauses,
      recommendationsLessons: baseFields.recommendationsLessons
    };
  }

  // CATÉGORIE D — DOC 12 : CV PROFESSIONNEL EXÉCUTIF (1 PAGE STRICTE - AVEC PHOTO)
  if (docType === 'cv_executif') {
    const projectExperiences = (dossier.axes || [])
      .flatMap(a => a.projects || [])
      .map((p, idx) => {
        const pTasks = p.tasks || [];
        const pBud = pTasks.reduce((s, t) => s + (Number(t.budget) || 0), 0);
        const pDone = pTasks.filter(t => computeTaskMetrics(t, todayISO).effectiveStatus === 'Terminé').length;
        const pPct = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0;
        return `${dossier.horizonPlan} | CHEF DE PROJET / DIRECTEUR DE MISSION — ${p.name} (${dossier.institution || userProfile.institution}) · Budget géré : ${formatDocAmount(pBud, currency, lang)} · Réalisations : (${idx + 1}.1) Pilotage de ${pTasks.length} activités WBS avec ${pPct}% d’achèvement ; (${idx + 1}.2) Maîtrise du chemin critique PERT/CPM (${maxDur}j) ; (${idx + 1}.3) Conformité GAR & redevabilité bailleurs.`;
      })
      .join('\n');

    return {
      ...baseFields,
      referenceCode: baseFields.referenceCode || `CV-EXEC-${dossier.psdYear || 2026}-012`,
      locationCity: baseFields.locationCity || 'Abidjan, Côte d’Ivoire',
      recipientOrg:
        dossier.institution ||
        userProfile.institution ||
        baseFields.recipientOrg ||
        'PNUD / Banque Mondiale / BAD / Union Européenne',
      recipientRepresentative: `${userProfile.fullName.toUpperCase()} | ${userProfile.role} — Certifié PMP® / ISO 21500 & Expert Senior GAR / S&E | Tél : ${userProfile.phone} | Email : ${userProfile.email} | Abidjan, Côte d’Ivoire | Nationalité : Ivoirienne`,
      contextJustification: `Directeur de Programme International et Expert Senior (${userProfile.role}) capitalisant plus de 15 années d’expérience dans la conception, l’ordonnancement algorithmique PERT/CPM, la Gestion Axée sur les Résultats (GAR) et le Suivi-Évaluation (normes OCDE/CAD et UNEG) de programmes financés par la Banque Mondiale, la BAD, l’UE et le PNUD. Pilote actuel du portefeuille « ${dossier.name} » (${budgetFormatted} sous gestion · ${totalTasks} activités WBS · ${progressPct}% achevé).`,
      specificObjectives: `Ingénierie & Gestion de Cycle de Projet : PMBOK® 7th Ed., ISO 21500:2021, WBS/PTBA, Réseau PERT/CPM (${criticalSeq}), Gestion de la Valeur Acquise (EVM).\nSuivi-Évaluation & GAR : Cadre Logique (M1), Théorie du Changement (TdC), Évaluations OCDE/CAD (6 critères), Normes UNEG & Assurance Qualité GEROS.\nGouvernance, Fiduciaire & Leadership : Coordination d’UGP, Matrice RACI (M3 — ${uniqueAssignees.size} acteurs), Maîtrise des Risques Board RAID (M7), Passation des Marchés (BM/BAD/UE).`,
      methodologyApproach:
        projectExperiences || baseFields.methodologyApproach,
      governanceModalities: baseFields.governanceModalities,
      confidentialityClauses: baseFields.confidentialityClauses,
      recommendationsLessons: baseFields.recommendationsLessons
    };
  }

  // CATÉGORIE D — DOC 13 : CV PROFESSIONNEL DÉTAILLÉ / APPEL D'OFFRES BAILLEURS (2 À 4 PAGES)
  if (docType === 'cv_detaille') {
    const detailedMissions = (dossier.axes || [])
      .flatMap((a, aIdx) =>
        (a.projects || []).map((p, pIdx) => {
          const pTasks = p.tasks || [];
          const pBud = pTasks.reduce((s, t) => s + (Number(t.budget) || 0), 0);
          const livrablesList = pTasks
            .map(t => t.livrable)
            .filter(Boolean)
            .slice(0, 4)
            .join(' ; ');
          return `Mission ${aIdx + 1}.${pIdx + 1} (${dossier.horizonPlan}) — Projet : « ${p.name} » (${a.name}) | Bailleur / Client : ${dossier.institution || userProfile.institution} | Financement : ${formatDocAmount(pBud, currency, lang)} | Poste : ${userProfile.role} (Chef de Mission) | Activités : Planification WBS de ${pTasks.length} tâches, calcul PERT/CPM, suivi budgétaire EVM et coordination RACI | Livrables produits : ${livrablesList || 'Rapports de cadrage, PTBA, Rapports CAP et PV de réception'}.`;
        })
      )
      .join('\n\n');

    return {
      ...baseFields,
      referenceCode: baseFields.referenceCode || `CV-AOI-${dossier.psdYear || 2026}-013`,
      locationCity: baseFields.locationCity || 'Abidjan, Côte d’Ivoire',
      recipientOrg:
        baseFields.recipientOrg ||
        'Banque Mondiale (Form TECH-6) / BAD / Union Européenne (EuropeAid) / Nations Unies (P11)',
      recipientRepresentative: `Nom & Prénoms : ${userProfile.fullName} | Titre : ${userProfile.role} | Institution : ${userProfile.institution || dossier.institution} | Tél : ${userProfile.phone} | Email : ${userProfile.email} | Résidence : Abidjan, Côte d’Ivoire | Nationalité : Ivoirienne | Poste proposé : Chef de Mission / Directeur de Programme & Expert Principal S&E (Catégorie I)`,
      contextJustification: `Expert Senior de Catégorie I (+15 ans d’expérience) spécialisé en direction de programmes complexes, ingénierie de planification stratégique, modélisation du chemin critique PERT/CPM (${allNodes.length} nœuds modélisés, durée critique ${maxDur}j), suivi budgétaire analytique EVM (enveloppe active de ${budgetFormatted} sur « ${dossier.name} ») et conduite d’évaluations selon les standards OCDE/CAD et UNEG.`,
      specificObjectives: baseFields.specificObjectives,
      methodologyApproach: baseFields.methodologyApproach,
      governanceModalities: baseFields.governanceModalities,
      confidentialityClauses: baseFields.confidentialityClauses,
      recommendationsLessons: baseFields.recommendationsLessons,
      extraField1: detailedMissions || baseFields.extraField1,
      extraField2: baseFields.extraField2
    };
  }

  // CATÉGORIE D — DOC 14 : PROCÈS-VERBAL (PV) OFFICIEL DE RÉUNION (1 À 2 PAGES - SANS PAGE DE GARDE)
  if (docType === 'pv_reunion') {
    const participantsList = [
      `1. ${userProfile.fullName} (${userProfile.role} — ${userProfile.institution || dossier.institution}) : PRÉSENT (Secrétaire de séance / Rapporteur)`,
      ...Array.from(uniqueAuthorities).map(
        (auth, i) => `${i + 2}. ${auth} (Autorité d’Approbation COPIL / RACI-A) : PRÉSENT (Président de séance)`
      ),
      ...Array.from(uniqueAssignees).map(
        (ass, i) => `${i + 2 + uniqueAuthorities.size}. ${ass} (Responsable Opérationnel / RACI-R) : PRÉSENT`
      ),
      ...Array.from(uniqueConsulted)
        .slice(0, 2)
        .map((con, i) => `${i + 2 + uniqueAuthorities.size + uniqueAssignees.size}. ${con} (Expert Consulté / RACI-C) : EXCUSÉ`)
    ].join('\n');

    return {
      ...baseFields,
      referenceCode: baseFields.referenceCode || `PV-COPIL-${dossier.psdYear || 2026}-014`,
      locationCity: baseFields.locationCity || 'Abidjan — Salle de Conférence UGP & Visioconférence',
      recipientOrg:
        dossier.institution ||
        userProfile.institution ||
        baseFields.recipientOrg ||
        'Comité de Pilotage Stratégique (COPIL) & Unité de Gestion (UGP)',
      recipientRepresentative: `Projet : « ${dossier.name} » (${dossier.horizonPlan}) | Instance : Session Ordinaire d’Arbitrage du Comité de Pilotage (COPIL) | Horaire : 09h00 – 12h30 | Président de séance : ${Array.from(uniqueAuthorities)[0] || 'Président du COPIL'} | Secrétaire de séance (Rapporteur) : ${userProfile.fullName} (${userProfile.role})`,
      governanceModalities: participantsList || baseFields.governanceModalities,
      contextJustification: `1. Vérification du quorum, ouverture officielle de la séance et adoption de l’ordre du jour ;\n2. Examen de l’état d’avancement physique du portefeuille « ${dossier.name} » (${progressPct}% achevé sur ${totalTasks} activités) et revue du chemin critique PERT/CPM (${criticalSeq}) ;\n3. Audit de l’exécution budgétaire PTBA / Valeur Acquise (Enveloppe : ${budgetFormatted}) et revue des risques (Board RAID M7) ;\n4. Arbitrage des ${blockedTasks} point(s) de blocage et des ${delayedTasks} écart(s) calendaires, adoption de la Matrice de Décisions (M10) et clôture.`,
      specificObjectives: `Point 4.1 (Avancement Physique & PERT) : Le Rapporteur (${userProfile.fullName}) a présenté le bilan consolidé faisant état de ${completedTasks} activité(s) terminée(s) (${progressPct}%), ${inProgressTasks} en cours, ${blockedTasks} bloquée(s) et ${todoTasks} à faire, pour une durée critique incompressible de ${maxDur} jours ouvrés.\nPoint 4.2 (Exécution Financière PTBA/EVM) : L’enveloppe globale programmée s’établit à ${budgetFormatted}, répartie sur ${(dossier.axes || []).length} axe(s) et ${pertSummaries.length} projet(s).\nPoint 4.3 (Goulots d’Étranglement & Risques RAID) : Les échanges ont porté sur les mesures immédiates de déblocage des tâches critiques et la sécurisation des livrables attendus.`,
      methodologyApproach: `DÉCISION N°01 (Quitus d’étape) : Le Comité approuve l’état d’avancement physique (${progressPct}%) et financier (${budgetFormatted}) présenté par l’UGP.\nDÉCISION N°02 (Traitement du Chemin Critique) : Instruction ferme est donnée aux Responsables (RACI-R) de résorber sous 7 jours ouvrés les ${blockedTasks} blocage(s) et ${delayedTasks} écart(s) sur la séquence critique (${criticalSeq}).\nDÉCISION N°03 (Validation des Livrables) : Autorisation de décaissement des tranches associées aux livrables homologués dans la Matrice M9.`,
      confidentialityClauses: baseFields.confidentialityClauses,
      recommendationsLessons: baseFields.recommendationsLessons
    };
  }

  // CATÉGORIE D — DOC 15 : TERMES DE RÉFÉRENCE (TDR) SIMPLIFIÉS AVEC TABLEAUX (1 À 3 PAGES - SANS PAGE DE GARDE)
  if (docType === 'tdr_simplifie') {
    const firstProjName =
      (dossier.axes || []).flatMap(a => a.projects || [])[0]?.name || dossier.name;
    return {
      ...baseFields,
      referenceCode: baseFields.referenceCode || `TDRS-PTBA-${dossier.psdYear || 2026}-015`,
      locationCity: baseFields.locationCity || 'Abidjan & Zones d’Intervention',
      recipientOrg:
        dossier.institution ||
        userProfile.institution ||
        baseFields.recipientOrg ||
        'Unité de Gestion du Projet (UGP) & Bailleur de Fonds',
      recipientRepresentative: `Intitulé : Appui Technique & Opérationnel à l’Exécution du Projet « ${firstProjName} » | Code PTBA : ${baseFields.referenceCode || 'PTBA-2026-A1'} | Portefeuille : ${dossier.name} (${dossier.horizonPlan}) | Durée : ${maxDur || 30} Hommes-Jours (H/J) | Superviseur direct : ${userProfile.fullName} (${userProfile.role})`,
      contextJustification: `Dans le cadre de la mise en œuvre opérationnelle du portefeuille « ${dossier.name} » (${dossier.horizonPlan}, budget consolidé de ${budgetFormatted}), la présente activité inscrite au PTBA vise à appuyer la réalisation des ${totalTasks} activités et jalons programmés (dont ${completedTasks} achevés à ${progressPct}%) et à sécuriser le chemin critique PERT/CPM (${criticalSeq}).`,
      specificObjectives: `3.1 Objectif Global : Assurer la production et la validation dans les délais prescrits des livrables opérationnels de l’activité conformément aux standards GAR et ISO 21500.\n3.2 Objectifs Spécifiques : (OS1) Conduire le cadrage opérationnel et stabiliser les outils d’intervention ; (OS2) Exécuter les tâches techniques sur les séquences critiques (${criticalSeq}) et lever les ${blockedTasks} goulot(s) identifié(s) ; (OS3) Soumettre les livrables finaux (Matrice M9) et assurer le transfert de compétences à l’UGP.`,
      extraField1: `Livrables synchronisés avec la Matrice M2 (WBS) et la Matrice M9 (Assurance Qualité & Paiements) du portefeuille actif.`,
      methodologyApproach: baseFields.methodologyApproach,
      governanceModalities: baseFields.governanceModalities,
      confidentialityClauses: baseFields.confidentialityClauses,
      recommendationsLessons: baseFields.recommendationsLessons
    };
  }

  return {
    ...baseFields,
    referenceCode: baseFields.referenceCode || `${docPrefix}-FAAB-${dossier.psdYear || 2026}-001`,
    locationCity: baseFields.locationCity || 'Abidjan',
    recipientOrg:
      dossier.institution ||
      userProfile.institution ||
      baseFields.recipientOrg ||
      'Comité de Pilotage & Partenaires Techniques et Financiers',
    recipientRepresentative:
      Array.from(uniqueAuthorities)[0] ||
      userProfile.fullName ||
      baseFields.recipientRepresentative ||
      'Président du Comité de Pilotage',
    contextJustification: `${dossier.description || baseFields.contextJustification}\nPortefeuille actif : « ${dossier.name} » (${dossier.type}, Horizon ${dossier.horizonPlan}, ${dossier.horizonYears} ans), structuré autour de ${(dossier.axes || []).length} axe(s) stratégique(s) [${axesNames || 'Aucun axe'}] et ${pertSummaries.length} projet(s) opérationnel(s) [${projectsNames || 'Aucun projet'}], pour une enveloppe consolidée de ${budgetFormatted}.`,
    specificObjectives: `1. Piloter et livrer les ${totalTasks} activités et jalons programmés (${completedTasks} terminées soit ${progressPct}%, ${inProgressTasks} en cours, ${blockedTasks} bloquées, ${todoTasks} à faire) ;\n2. Sécuriser le chemin critique PERT/CPM (${criticalSeq}) d’une durée totale incompressible de ${maxDur} jour(s) ouvré(s) ;\n3. Garantir la redevabilité budgétaire (${budgetFormatted}) et la qualité des livrables sous la coordination de ${userProfile.fullName} (${userProfile.role}).`,
    methodologyApproach: `Démarche intégrée en 5 phases normées (Avant-Projet, Conception, Planification, Exécution & Suivi, Clôture) articulant la Gestion Axée sur les Résultats (GAR), l’ordonnancement algorithmique PERT/CPM (${allNodes.length} nœuds modélisés), le suivi temps réel par tableau Kanban et l’audit des écarts calendaires (${delayedTasks} activité(s) présentant un écart à date).`,
    governanceModalities: `Gouvernance RACI consolidée depuis l’onglet RACI : Réalisateurs (R) [${Array.from(uniqueAssignees).slice(0, 5).join(', ') || userProfile.fullName}] ; Autorité d’approbation (A) [${Array.from(uniqueAuthorities).join(', ') || 'Comité de Pilotage (COPIL)'}] ; Consultés (C) [${Array.from(uniqueConsulted).slice(0, 4).join(', ') || 'Experts Techniques'}] ; Informés (I) [${Array.from(uniqueInformed).slice(0, 4).join(', ') || 'Parties Prenantes'}].`,
    confidentialityClauses: baseFields.confidentialityClauses,
    recommendationsLessons:
      blockedTasks > 0 || delayedTasks > 0
        ? `Priorité opérationnelle issue du Tableau de Bord & Suivi : lever immédiatement les ${blockedTasks} blocage(s) actif(s) et résorber les écarts sur les ${delayedTasks} activité(s) en glissement, en particulier sur la séquence critique PERT (${criticalSeq}).`
        : `Maintenir la cadence d’exécution actuelle (${progressPct}% achevé, 0 blocage critique) et protéger les marges nulles du chemin critique (${criticalSeq}).`
  };
}

/**
 * Construit les pages A4 normées selon le PROMPT SYSTÈME MAÎTRE : ARCHITECTURE MODULAIRE HAUTE PRÉCISION
 * en respectant strictement les 3 catégories de pagination (Catégorie A : 1 page stricte ;
 * Catégorie B : documents courts 2 à 5 pages avec Fiche Signalétique intégrée ;
 * Catégorie C : rapports lourds 10 pages avec protocole liminaire complet + corps spécifique + annexes).
 */
export function buildInstitutionalDocPages(
  docType: InstitutionalDocType,
  rawFields: CustomDocFields,
  dossier: Dossier,
  userProfile: UserProfile,
  currency: CurrencyCode,
  lang: LanguageCode
): StructuredA4Page[] {
  const cfg = DOC_TEMPLATE_CONFIGS[docType];
  const todayISO = getTodayISO();
  const dateStr = new Date().toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  // Résolution des 10 Matrices Maîtresses (M1 à M10) pré-remplies et/ou éditées par l'utilisateur
  const activeMatrices = resolveActiveMatricesData(
    dossier,
    rawFields,
    userProfile,
    currency,
    lang
  );
  const txtVarsMap = buildAllTxtMatrixVariables(activeMatrices);
  const injectTxtVars = (val?: string): string => {
    if (!val) return '';
    let out = val;
    Object.entries(txtVarsMap).forEach(([token, mdTable]) => {
      if (out.includes(token)) {
        out = out.split(token).join(`\n${mdTable}\n`);
      }
    });
    return out;
  };

  const fields: CustomDocFields = {
    ...rawFields,
    recipientRepresentative: injectTxtVars(rawFields.recipientRepresentative),
    contextJustification: injectTxtVars(rawFields.contextJustification),
    specificObjectives: injectTxtVars(rawFields.specificObjectives),
    methodologyApproach: injectTxtVars(rawFields.methodologyApproach),
    confidentialityClauses: injectTxtVars(rawFields.confidentialityClauses),
    governanceModalities: injectTxtVars(rawFields.governanceModalities),
    recommendationsLessons: injectTxtVars(rawFields.recommendationsLessons),
    extraField1: injectTxtVars(rawFields.extraField1),
    extraField2: injectTxtVars(rawFields.extraField2),
    extraField3: injectTxtVars(rawFields.extraField3),
    extraField4: injectTxtVars(rawFields.extraField4)
  };

  const m1Table = buildStructuredA4TableFromMatrix('M1', activeMatrices, currency, lang);
  const m2Table = buildStructuredA4TableFromMatrix('M2', activeMatrices, currency, lang);
  const m3Table = buildStructuredA4TableFromMatrix('M3', activeMatrices, currency, lang);
  const m4Table = buildStructuredA4TableFromMatrix('M4', activeMatrices, currency, lang);
  const m5Table = buildStructuredA4TableFromMatrix('M5', activeMatrices, currency, lang);
  const m6Table = buildStructuredA4TableFromMatrix('M6', activeMatrices, currency, lang);
  const m7Table = buildStructuredA4TableFromMatrix('M7', activeMatrices, currency, lang);
  const m8Table = buildStructuredA4TableFromMatrix('M8', activeMatrices, currency, lang);
  const m9Table = buildStructuredA4TableFromMatrix('M9', activeMatrices, currency, lang);
  const m10Table = buildStructuredA4TableFromMatrix('M10', activeMatrices, currency, lang);

  const pertSummaries = computeDossierPertSummary(dossier, todayISO);
  const allNodes = pertSummaries.flatMap(p => p.nodes);

  let totalTasks = 0;
  let completedTasks = 0;
  let inProgressTasks = 0;
  let blockedTasks = 0;
  let todoTasks = 0;
  let delayedTasksCount = 0;
  let totalBudgetFCFA = 0;
  let completedBudgetFCFA = 0;
  let inProgressBudgetFCFA = 0;

  // Tableaux compacts et calibrés (5 à 6 colonnes max avec ratios explicites = 0 débordement !)
  const wbsBudgetRows: string[][] = [];
  const trackingRows: string[][] = [];
  const raciRows: string[][] = [];
  const deliverablesRows: string[][] = [];
  const ganttPertRows: string[][] = [];
  const projectDashboardRows: string[][] = [];
  const bottleneckRows: string[][] = [];
  const capFinancialRows: string[][] = [];

  (dossier.axes || []).forEach((axe, aIdx) => {
    (axe.projects || []).forEach((proj, prIdx) => {
      const codeMap = new Map<string, string>();
      STANDARD_PHASES.forEach((pName, pIdx) => {
        const pTasks = (proj.tasks || []).filter(tk => tk.phase === pName);
        pTasks.forEach((tk, tIdx) => {
          codeMap.set(tk.id, `${tk.type === 'jalon' ? 'J' : 'T'}.${pIdx + 1}.${tIdx + 1}`);
        });
      });

      let pDone = 0;
      let pInProg = 0;
      let pBlocked = 0;
      let pTodo = 0;
      let pLate = 0;
      let pBudget = 0;
      let pDisbursed = 0;

      (proj.tasks || []).forEach((task, idx) => {
        totalTasks++;
        const metrics = computeTaskMetrics(task, todayISO);
        const b = Number(task.budget) || 0;
        totalBudgetFCFA += b;
        pBudget += b;

        let taskDisbursed = 0;
        if (metrics.effectiveStatus === 'Terminé') {
          completedTasks++;
          completedBudgetFCFA += b;
          pDone++;
          taskDisbursed = b;
        } else if (metrics.effectiveStatus === 'En cours') {
          inProgressTasks++;
          inProgressBudgetFCFA += b;
          pInProg++;
          taskDisbursed = Math.round(b * 0.6);
        } else if (metrics.effectiveStatus === 'Bloqué') {
          blockedTasks++;
          pBlocked++;
          taskDisbursed = Math.round(b * 0.2);
        } else {
          todoTasks++;
          pTodo++;
          taskDisbursed = 0;
        }
        pDisbursed += taskDisbursed;

        if (metrics.ecartDebutDays > 0 || metrics.ecartFinDays > 0) {
          delayedTasksCount++;
          pLate++;
        }

        const code = codeMap.get(task.id) || `${task.type === 'jalon' ? 'J' : 'T'}.${aIdx + 1}.${idx + 1}`;
        const antCode =
          task.antecedent && task.antecedent !== '—'
            ? codeMap.get(task.antecedent) || task.antecedent
            : 'Aucun';
        const labelName = task.type === 'jalon' ? `[Jalon] ${task.name}` : task.name;
        const formattedTaskBudget = formatDocAmount(b, currency, lang);

        // 1. Planification WBS & Budget Analytique (6 colonnes calibrées : [9, 15, 28, 16, 16, 16])
        wbsBudgetRows.push([
          code,
          task.phase,
          labelName,
          `${task.assignee || 'Équipe'}\n(Antéc. : ${antCode})`,
          `${task.startDate || '—'} au ${task.endDate || '—'} (${metrics.plannedDurationLabel})`,
          formattedTaskBudget
        ]);

        // 2. Suivi de l'Exécution & Écarts (6 colonnes calibrées : [9, 27, 14, 20, 16, 14])
        trackingRows.push([
          code,
          labelName,
          task.assignee || '—',
          `Prév : ${task.startDate || '—'} au ${task.endDate || '—'}\nRéel : ${task.actualStartDate || '—'} au ${task.actualEndDate || '—'}`,
          `Déb : ${metrics.ecartDebutLabel}\nFin : ${metrics.ecartFinLabel}`,
          metrics.effectiveStatus
        ]);

        // 3. Matrice RACI (6 colonnes calibrées : [9, 27, 16, 16, 16, 16])
        raciRows.push([
          code,
          labelName,
          task.assignee || 'Équipe Opérationnelle',
          task.autorite || userProfile.fullName || 'Comité de Pilotage (COPIL)',
          task.consulte || task.responsabilite || 'Experts Techniques',
          task.informe || fields.recipientOrg || 'Parties Prenantes'
        ]);

        // 4. Livrables, Indicateurs & Crédits (6 colonnes calibrées : [9, 25, 24, 12, 14, 16])
        deliverablesRows.push([
          code,
          `Axe ${aIdx + 1} / P${prIdx + 1}\n${task.name}`,
          task.livrable || 'Livrable opérationnel documenté & PV',
          task.endDate || '—',
          `${metrics.effectiveStatus}\n(${metrics.ecartFinLabel})`,
          formattedTaskBudget
        ]);

        // 5. Goulots d'étranglement & Alertes d'écarts (6 colonnes calibrées : [9, 27, 16, 14, 17, 17])
        if (metrics.effectiveStatus === 'Bloqué' || metrics.ecartFinDays > 0 || metrics.ecartDebutDays > 0) {
          bottleneckRows.push([
            code,
            `${proj.name} — ${task.name}`,
            task.assignee || '—',
            metrics.effectiveStatus,
            `Déb : ${metrics.ecartDebutLabel}\nFin : ${metrics.ecartFinLabel}`,
            formattedTaskBudget
          ]);
        }
      });

      const pTotal = (proj.tasks || []).length;
      const pPct = pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0;
      const pExecFinPct = pBudget > 0 ? Math.round((pDisbursed / pBudget) * 100) : 0;

      // Synthèse par Projet (6 colonnes calibrées : [28, 12, 24, 10, 10, 16])
      projectDashboardRows.push([
        `Axe ${aIdx + 1} — P${prIdx + 1} : ${proj.name}`,
        `${pTotal} tâche(s)`,
        `${pDone} Term. · ${pInProg} En cours · ${pBlocked} Bloq. · ${pTodo} À faire`,
        `${pLate} écart(s)`,
        `${pPct}%`,
        formatDocAmount(pBudget, currency, lang)
      ]);

      // Suivi Financier PTBA par Projet pour le Rapport CAP & Clôture (6 colonnes : [24, 18, 18, 18, 10, 12])
      capFinancialRows.push([
        `P${prIdx + 1} — ${proj.name}`,
        formatDocAmount(pBudget, currency, lang),
        formatDocAmount(pDisbursed, currency, lang),
        formatDocAmount(Math.max(0, pBudget - pDisbursed), currency, lang),
        `${pExecFinPct}%`,
        `${pPct}%`
      ]);
    });
  });

  // 6. Ordonnancement PERT/CPM & Marges (6 colonnes calibrées : [9, 27, 14, 18, 18, 14])
  allNodes.forEach(n => {
    ganttPertRows.push([
      n.code,
      n.name,
      `Antéc. : ${n.antecedentCode || 'Aucun'}\nChaîne : ${n.precedingChainCodes || '—'}`,
      `Tôt : J+${n.es} -> J+${n.ef}\nTard : J+${n.ls} -> J+${n.lf}`,
      n.isCritical ? 'CRITIQUE (Marge 0j)' : `Souple (MT: +${n.totalFloat}j / ML: +${n.freeFloat}j)`,
      `${n.status}\n(${n.duration}j)`
    ]);
  });

  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const criticalNodes = allNodes.filter(n => n.isCritical);
  const criticalSequence = criticalNodes.map(n => n.code).join(' -> ') || 'Aucune séquence critique détectée';
  const maxProjectDuration = pertSummaries.reduce((acc, p) => Math.max(acc, p.projectDuration), 0);
  const committedBudgetFCFA = completedBudgetFCFA + Math.round(inProgressBudgetFCFA * 0.6);
  const remainingBudgetFCFA = Math.max(0, totalBudgetFCFA - committedBudgetFCFA);
  const financialExecutionPct = totalBudgetFCFA > 0 ? Math.round((committedBudgetFCFA / totalBudgetFCFA) * 100) : 0;

  const nomDuProjet = dossier.name || 'Portefeuille Stratégique FAAB PLAN';
  const organisationCommanditaire = userProfile.institution || dossier.institution || 'Direction Générale de la Stratégie & PMO';
  const bailleurDeFonds = fields.recipientOrg || dossier.institution || 'Partenaires Techniques et Financiers (PNUD / BM / BAD / UE)';
  const zoneGeographique = fields.locationCity || 'Abidjan, République de Côte d’Ivoire';
  const budgetGlobalFormatted = formatDocAmount(totalBudgetFCFA, currency, lang);
  const committedBudgetFormatted = formatDocAmount(committedBudgetFCFA, currency, lang);
  const remainingBudgetFormatted = formatDocAmount(remainingBudgetFCFA, currency, lang);
  const dureeOuPeriode = `Horizon ${dossier.horizonPlan} (${dossier.horizonYears} ans · Chemin critique : ${maxProjectDuration} jours ouvrés)`;
  const objectifPrincipal = dossier.description || fields.specificObjectives;

  // ============================================================================
  // CATÉGORIE A (DOC 1 : COURRIER ADMINISTRATIF CLASSIQUE — 1 PAGE A4 STRICTE)
  // ============================================================================
  if (docType === 'courrier_admin') {
    const singlePageCourrier: StructuredA4Page = {
      pageTitle: `COURRIER ADMINISTRATIF OFFICIEL (1 PAGE A4 STRICTE)`,
      pageSubtitle: `Protocole Catégorie A · ${organisationCommanditaire} · Réf. ${fields.referenceCode}`,
      isSignaturePage: true,
      orgStampDataUrl: fields.orgStampDataUrl,
      partnerStampDataUrl: fields.partnerStampDataUrl,
      sections: [
        {
          heading: 'TIMBRE ADMINISTRATIF, COORDONNÉES DES PARTIES & OBJET OFFICIEL',
          adminLetterHeader: {
            senderInstitution: organisationCommanditaire,
            senderName: userProfile.fullName,
            senderRole: userProfile.role,
            senderContact: `${userProfile.email} · Tél : ${userProfile.phone}`,
            referenceCode: fields.referenceCode || 'COUR-FAAB-2026-011',
            cityAndDate: `${fields.locationCity || 'Abidjan'}, le ${dateStr}`,
            recipientTitle: fields.recipientRepresentative || 'Monsieur / Madame le Directeur Général',
            recipientOrg: fields.recipientOrg || 'Direction Générale & Partenaires Institutionnels',
            subjectLine: fields.contextJustification,
            dossierRefLine: `${nomDuProjet} (${dossier.horizonPlan} · Budget : ${budgetGlobalFormatted} · Exécution : ${progressPct}%)`,
            leftLogoDataUrl: fields.leftLogoDataUrl,
            rightLogoDataUrl: fields.rightLogoDataUrl
          }
        },
        {
          heading: 'CORPS DE LA CORRESPONDANCE ADMINISTRATIVE (STRUCTURE NORMÉE EN 3 PARAGRAPHES)',
          paragraphs: [
            fields.specificObjectives,
            fields.methodologyApproach,
            fields.governanceModalities,
            fields.recommendationsLessons
          ].filter(Boolean)
        },
        {
          heading: 'SYNTHÈSE CHIFFRÉE DU DOSSIER DE RÉFÉRENCE & MENTIONS (P.J. / AMPLIATIONS)',
          table: {
            headers: [
              'Portefeuille de Référence (24%)',
              'Structure WBS (16%)',
              'Bilan des Activités (24%)',
              'Chemin Critique PERT (18%)',
              `Budget Consolidé (18%)`
            ],
            columnWidths: [24, 16, 24, 18, 18],
            rightAlignCols: [4],
            rows: [
              [
                `${nomDuProjet} (${dossier.horizonPlan})`,
                `${(dossier.axes || []).length} Axe(s) / ${pertSummaries.length} Projet(s)`,
                `${completedTasks}/${totalTasks} Terminées (${progressPct}%) · ${inProgressTasks} En cours · ${blockedTasks} Bloquées`,
                `${maxProjectDuration}j (${criticalSequence})`,
                budgetGlobalFormatted
              ]
            ]
          },
          paragraphs: fields.confidentialityClauses ? [fields.confidentialityClauses] : undefined
        }
      ]
    };

    return [singlePageCourrier];
  }

  // ============================================================================
  // CATÉGORIE D : DOCUMENTS OPÉRATIONNELS & RH SANS PAGE DE GARDE (DOCS 12 À 15)
  // ============================================================================

  // ----------------------------------------------------------------------------
  // DOCUMENT 12 : CV PROFESSIONNEL EXÉCUTIF CHEF DE PROJET / EXPERT (1 PAGE STRICTE - AVEC PHOTO)
  // ----------------------------------------------------------------------------
  if (docType === 'cv_executif') {
    const m3Rows = activeMatrices.M3 || [];
    const m1Rows = activeMatrices.M1 || [];
    const m5Rows = activeMatrices.M5 || [];

    // Expériences phares synchronisées avec les Projets du Dossier + Matrices M3, M1, M5
    const expBullets: string[] = [];
    (dossier.axes || []).forEach((axe, aIdx) => {
      (axe.projects || []).forEach((proj, pIdx) => {
        const pTasks = proj.tasks || [];
        const pBud = pTasks.reduce((s, t) => s + (Number(t.budget) || 0), 0);
        const pDone = pTasks.filter(
          t => computeTaskMetrics(t, todayISO).effectiveStatus === 'Terminé'
        ).length;
        const pPct = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0;
        expBullets.push(
          `[${dossier.horizonPlan}] ${userProfile.role.toUpperCase()} — Projet « ${proj.name} » (${organisationCommanditaire} / ${bailleurDeFonds}, ${zoneGeographique}) · Budget géré : ${formatDocAmount(pBud, currency, lang)} : (1) Pilotage opérationnel de ${pTasks.length} activités WBS sur l’Axe ${aIdx + 1}.${pIdx + 1} avec un taux de réalisation physique de ${pPct}% ; (2) Ordonnancement du chemin critique PERT/CPM (${maxProjectDuration}j) et maîtrise des coûts EVM ; (3) Coordination RACI et livraison des extrants GAR homologués.`
        );
      });
    });

    if (fields.methodologyApproach) {
      fields.methodologyApproach
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .forEach(line => {
          if (expBullets.length < 4 && !expBullets.includes(line)) {
            expBullets.push(line);
          }
        });
    }

    const singlePageCvExec: StructuredA4Page = {
      pageTitle: `CURRICULUM VITAE EXÉCUTIF — ${userProfile.fullName.toUpperCase()}`,
      pageSubtitle: `Catégorie D (1 Page A4 Stricte · Sans Page de Garde · Avec Photo) · Réf. ${fields.referenceCode}`,
      sections: [
        {
          heading: 'BANDEAU D’EN-TÊTE EXÉCUTIF & COORDONNÉES PROFESSIONNELLES (SANS PAGE DE GARDE)',
          cvHeaderBanner: {
            variant: 'cv_executif',
            docBadge: 'CURRICULUM VITAE EXÉCUTIF — 1 PAGE A4 STRICTE (NORMES INTERNATIONALES)',
            fullNameUpper: userProfile.fullName.toUpperCase(),
            expertTitleLine: `${userProfile.role} — Certifié PMP® / PMBOK® 7 / ISO 21500 & Expert Senior GAR / S&E (OCDE-CAD / UNEG)`,
            contactLine: `${zoneGeographique} | Tél : ${userProfile.phone} | Email : ${userProfile.email} | Institution : ${organisationCommanditaire} | Nationalité : Ivoirienne`,
            metaSubLine: fields.recipientRepresentative,
            profilePhotoDataUrl: fields.profilePhotoDataUrl
          }
        },
        {
          heading: '1. PROFIL EXÉCUTIF & PROPOSITION DE VALEUR',
          paragraphs: [
            `${fields.contextJustification}\n Synthèse Quantitative Clé : +15 ans d’expérience internationale | Portefeuille actif sous pilotage : « ${nomDuProjet} » (${budgetGlobalFormatted} consolidés sur ${pertSummaries.length} projet(s) et ${totalTasks} activités WBS, ${progressPct}% réalisés) | Bailleurs pratiqués : Banque Mondiale, BAD, Union Européenne, PNUD, UNICEF.`
          ]
        },
        {
          heading: '2. MATRICE DES COMPÉTENCES CLÉS & CERTIFICATIONS (SYNCHRONISÉE M3 / GAR / EVM)',
          table: {
            headers: [
              'Ingénierie & Gestion de Projet (34%)',
              'Suivi-Évaluation & GAR (33%)',
              'Gouvernance, Fiduciaire & Outils (33%)'
            ],
            columnWidths: [34, 33, 33],
            rows: [
              [
                `• Pilotage de portefeuilles & PMO (PMBOK® 7 / ISO 21500:2021)\n• Découpage WBS, PTBA & Ordonnancement PERT/CPM (${maxProjectDuration}j)\n• Gestion de la Valeur Acquise (EVM : BAC, EV, AC, CPI — ${m5Rows.length} lignes M5)`,
                `• Conception de Cadres Logiques GAR (${m1Rows.length} résultats M1) & Théorie du Changement\n• Évaluations indépendantes selon les 6 critères OCDE/CAD & normes UNEG\n• Dispositifs S&E informatisés, indicateurs SMART & assurance qualité GEROS`,
                `• Gouvernance COPIL, Matrice RACI (${m3Rows.length} postes M3) & Management d’UGP\n• Gestion des Risques Board RAID & Passation des Marchés (BM / BAD / UE)\n• Maîtrise avancée : FAAB PLAN, MS Project, Primavera P6, Power BI, KoboToolbox`
              ]
            ]
          }
        },
        {
          heading: '3. EXPÉRIENCES PROFESSIONNELLES SIGNIFICATIVES (SÉLECTION EXÉCUTIVE QUANTIFIÉE)',
          bullets: expBullets.slice(0, 4)
        },
        {
          heading: '4. FORMATION ACADÉMIQUE, DIPLÔMES & ACCRÉDITATIONS INTERNATIONALES',
          table: {
            headers: [
              'Période / Année (18%)',
              'Diplôme Universitaire / Certification Internationale (48%)',
              'Institution Académique / Organisme Certificateur & Pays (34%)'
            ],
            columnWidths: [18, 48, 34],
            rows: [
              [
                'Certifications Actives',
                'Project Management Professional (PMP®) · ISO 21500 Lead Project Manager · Certificat GAR/S&E (UNEG/CLEAR)',
                'Project Management Institute (PMI) / PECB / Groupe Banque Mondiale & PNUD'
              ],
              [
                'Cursus Supérieur (Bac+5)',
                fields.governanceModalities ||
                  'Master Exécutif / Diplôme d’Ingénieur en Management de Projets Internationaux & Ingénierie du Développement',
                'Grande École / Université Internationale — Mention Très Bien'
              ]
            ]
          }
        },
        {
          heading: '5. LANGUES (CADRE CECRL) & LOGICIELS TECHNIQUES DE PLANIFICATION / S&E',
          paragraphs: [
            `${fields.confidentialityClauses}${fields.recommendationsLessons ? `\nDisponibilité : ${fields.recommendationsLessons}` : ''}`
          ]
        }
      ]
    };

    return [singlePageCvExec];
  }

  // ----------------------------------------------------------------------------
  // DOCUMENT 13 : CV PROFESSIONNEL DÉTAILLÉ / APPEL D'OFFRES BAILLEURS (4 PAGES - AVEC PHOTO)
  // ----------------------------------------------------------------------------
  if (docType === 'cv_detaille') {
    const m1Rows = activeMatrices.M1 || [];
    const m3Rows = activeMatrices.M3 || [];
    const m5Rows = activeMatrices.M5 || [];
    const m9Rows = activeMatrices.M9 || [];

    // Construction des fiches de missions détaillées à partir des projets réels + M3/M5/M9
    const missionSummaryRows: string[][] = [];
    const missionDetailedParagraphs: string[] = [];

    (dossier.axes || []).forEach((axe, aIdx) => {
      (axe.projects || []).forEach((proj, pIdx) => {
        const pTasks = proj.tasks || [];
        const pBud = pTasks.reduce((s, t) => s + (Number(t.budget) || 0), 0);
        const pDone = pTasks.filter(
          t => computeTaskMetrics(t, todayISO).effectiveStatus === 'Terminé'
        ).length;
        const pPct = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0;
        const livs = pTasks
          .map(t => t.livrable)
          .filter(Boolean)
          .join(' ; ');

        missionSummaryRows.push([
          `${dossier.horizonPlan}\n(${dossier.horizonYears} ans)`,
          zoneGeographique,
          `${organisationCommanditaire}\n(${bailleurDeFonds})`,
          `${userProfile.role}\n(Chef de Mission / RACI-A)`,
          formatDocAmount(pBud, currency, lang)
        ]);

        missionDetailedParagraphs.push(
          `MISSION ${aIdx + 1}.${pIdx + 1} — PROJET : « ${proj.name.toUpperCase()} » (${axe.name})\n` +
            `• Période : ${dossier.horizonPlan} | Pays : ${zoneGeographique} | Client / Bailleur : ${bailleurDeFonds} | Financement géré : ${formatDocAmount(pBud, currency, lang)} | Poste : ${userProfile.role}\n` +
            `• Objectif global du projet : ${dossier.description}\n` +
            `• Responsabilités techniques exercées : (1) Structuration du découpage WBS en 5 phases normées (${pTasks.length} activités et jalons) ; (2) Modélisation du réseau PERT/CPM et pilotage des marges critiques ; (3) Supervision de l’exécution budgétaire PTBA et contrôle de la Valeur Acquise (EVM) ; (4) Coordination des équipes pluridisciplinaires selon la matrice RACI ; (5) Assurance qualité et réception des livrables (${pDone}/${pTasks.length} achevés soit ${pPct}%).\n` +
            `• Livrables produits et résultats atteints : ${livs || 'Rapport de cadrage ProDoc, PTBA consolidé, Rapports périodiques CAP et PV de réception définitive'}.`
        );
      });
    });

    const page1CvDetaille: StructuredA4Page = {
      pageTitle: `CV DÉTAILLÉ BAILLEURS (PAGE 1/4) — IDENTIFICATION, QUALIFICATIONS & ÉDUCATION`,
      pageSubtitle: `Format International WB Form TECH-6 / EuropeAid / P11 ONU · Sans Page de Garde · Avec Photo 3.5x4.5cm`,
      sections: [
        {
          heading: 'BANDEAU D’EN-TÊTE OFFICIEL BAILLEURS AVEC PHOTO D’IDENTITÉ (SANS PAGE DE GARDE)',
          cvHeaderBanner: {
            variant: 'cv_detaille',
            docBadge: 'CURRICULUM VITAE DÉTAILLÉ — FORMAT INTERNATIONAL BAILLEURS (BM / BAD / UE / ONU)',
            fullNameUpper: `EXPERT : ${userProfile.fullName.toUpperCase()}`,
            expertTitleLine: `POSTE PROPOSÉ : ${userProfile.role.toUpperCase()} — CHEF DE MISSION / EXPERT PRINCIPAL S&E (CATÉGORIE I)`,
            contactLine: `Nationalité : Ivoirienne | Résidence : ${zoneGeographique} | Tél : ${userProfile.phone} | Email : ${userProfile.email}`,
            metaSubLine: fields.recipientRepresentative,
            profilePhotoDataUrl: fields.profilePhotoDataUrl
          }
        },
        {
          heading: '1. FICHE SYNOPTIQUE DE L’EXPERT (ÉTAT CIVIL, COORDONNÉES & PORTÉE INTERNATIONALE)',
          table: {
            headers: [
              'Rubrique d’Identification (22%)',
              'Données Officielles de l’Expert (28%)',
              'Paramètre de Qualification (22%)',
              'Détails & Références Bailleurs (28%)'
            ],
            columnWidths: [22, 28, 22, 28],
            rows: [
              [
                'Nom & Prénoms complets',
                userProfile.fullName,
                'Poste proposé sur la mission',
                `${userProfile.role} / Chef de Mission Senior (Cat. I)`
              ],
              [
                'Nationalité & Résidence',
                `Ivoirienne — ${zoneGeographique}`,
                'Années d’expérience cumulée',
                '+15 ans en Ingénierie de Projet, PMO, GAR & S&E'
              ],
              [
                'Contacts directs vérifiables',
                `Tél : ${userProfile.phone}\nEmail : ${userProfile.email}`,
                'Portefeuille actif géré',
                `${nomDuProjet} (${budgetGlobalFormatted})`
              ],
              [
                'Institution de rattachement',
                organisationCommanditaire,
                'Pays & Bailleurs pratiqués',
                fields.governanceModalities
              ]
            ]
          }
        },
        {
          heading: '2. RÉSUMÉ EXÉCUTIF DES QUALIFICATIONS & VALEUR AJOUTÉE POUR LA MISSION',
          paragraphs: [fields.contextJustification]
        },
        {
          heading: '3. CURSUS UNIVERSITAIRE, DIPLÔMES & CERTIFICATIONS INTERNATIONALES',
          table: {
            headers: [
              'Institution / Organisme & Pays (28%)',
              'Période / Dates (14%)',
              'Diplôme Obtenu / Accréditation Internationale (34%)',
              'Spécialisation Principale (24%)'
            ],
            columnWidths: [28, 14, 34, 24],
            rows: [
              [
                'Grande École / Université Internationale',
                '2009 – 2011',
                fields.specificObjectives.split('\n')[0] ||
                  'Master / DEA en Ingénierie de Projets & Économie du Développement',
                'Planification Stratégique, GAR, Évaluation & Finance de Projet'
              ],
              [
                'Université / Institut Polytechnique',
                '2005 – 2009',
                fields.specificObjectives.split('\n')[1] ||
                  'Diplôme d’Ingénieur / Maîtrise en Sciences de Gestion & Statistique',
                'Modélisation PERT/CPM, Statistique & Systèmes d’Information'
              ],
              [
                'PMI® / PECB / Banque Mondiale / UNEG',
                '2015 – 2026',
                fields.methodologyApproach,
                'Standards PMBOK® 7, ISO 21500:2021, OCDE/CAD, UNEG & FIDIC'
              ]
            ]
          }
        },
        {
          heading: '4. COMPÉTENCES LINGUISTIQUES (CADRE EUROPÉEN CECRL) & 5. MAÎTRISE DES LOGICIELS S&E',
          table: {
            headers: [
              'Langue / Catégorie d’Outils (26%)',
              'Niveau Lu / Planification PMO (24%)',
              'Niveau Écrit / Collecte S&E (25%)',
              'Niveau Parlé / Analyse & BI (25%)'
            ],
            columnWidths: [26, 24, 25, 25],
            rows: [
              [
                'Français (Langue de travail)',
                'C2 — Excellent (Expert)',
                'C2 — Rédaction de rapports bailleurs',
                'C2 — Langue maternelle / Négociation'
              ],
              [
                'Anglais (International)',
                'C1 — Avancé professionnel',
                'C1 — Rédaction technique & TDR',
                'C1 — Courant (Réunions COPIL / PTF)'
              ],
              [
                'Logiciels & Systèmes Maîtrisés',
                'FAAB PLAN, MS Project, Primavera P6 (PERT/CPM & Gantt)',
                'KoboToolbox, ODK, SurveyCTO, DHIS2, Google Workspace',
                'Power BI, SPSS, R, Stata, Excel Avancé (Modélisation EVM)'
              ]
            ]
          }
        }
      ]
    };

    const page2CvDetaille: StructuredA4Page = {
      pageTitle: `CV DÉTAILLÉ BAILLEURS (PAGE 2/4) — EXPÉRIENCES PROFESSIONNELLES DÉTAILLÉES (PARTIE I)`,
      pageSubtitle: `Historique Chronologique Inversé des Missions de Direction de Programme & Pilotage PMO (Synchronisé M3 & M5)`,
      sections: [
        {
          heading: '6. EXPÉRIENCES PROFESSIONNELLES DÉTAILLÉES — SYNTHÈSE CHRONOLOGIQUE DES PROJETS GÉRÉS',
          table: {
            headers: [
              'Période & Durée (15%)',
              'Pays / Zone (16%)',
              'Employeur / Bailleur (23%)',
              'Poste Occupé & Rôle RACI (26%)',
              `Financement Géré (20%)`
            ],
            columnWidths: [15, 16, 23, 26, 20],
            rightAlignCols: [4],
            rows:
              missionSummaryRows.length > 0
                ? [
                    ...missionSummaryRows,
                    [
                      '2018 – 2022\n(4 ans)',
                      'Afrique de l’Ouest (UEMOA)',
                      'Union Européenne / BAD / PNUD',
                      'Expert Principal Suivi-Évaluation & GAR (Cat. I)',
                      formatDocAmount(450000000, currency, lang)
                    ],
                    [
                      '2014 – 2018\n(4 ans)',
                      'Côte d’Ivoire & Sous-région',
                      'Banque Mondiale (IDA) / UGP',
                      'Coordonnateur Technique & Spécialiste Planification',
                      formatDocAmount(320000000, currency, lang)
                    ]
                  ]
                : [
                    [
                      dossier.horizonPlan,
                      zoneGeographique,
                      bailleurDeFonds,
                      userProfile.role,
                      budgetGlobalFormatted
                    ]
                  ]
          }
        },
        {
          heading: '6.1 FICHES DÉTAILLÉES DES MISSIONS SUR LE PORTEFEUILLE ACTIF (TÂCHES & LIVRABLES)',
          paragraphs: [
            ...missionDetailedParagraphs,
            ...(fields.extraField1 ? [fields.extraField1] : [])
          ]
        },
        {
          heading: '6.2 RESPONSABILITÉS DE GOUVERNANCE RACI & ÉQUIPE D’EXPERTS SUPERVISÉE (MATRICE M3)',
          table: m3Table
        }
      ]
    };

    const page3CvDetaille: StructuredA4Page = {
      pageTitle: `CV DÉTAILLÉ BAILLEURS (PAGE 3/4) — EXPÉRIENCES DÉTAILLÉES (PARTIE II : RÉSULTATS GAR M1, BUDGET EVM M5 & LIVRABLES M9)`,
      pageSubtitle: `Preuves Quantifiées de Performance : Cadre Logique Géré (M1), Exécution Budgétaire EVM (M5) & Livrables Homologués (M9)`,
      sections: [
        {
          heading: '6.3 RÉSULTATS GAR & INDICATEURS SMART ATTEINTS SOUS LA DIRECTION DE L’EXPERT (MATRICE M1)',
          paragraphs: [
            `Au cours de ses missions de direction de programme et d’expertise S&E, ${userProfile.fullName} a directement piloté l’atteinte des cibles suivantes inscrites au Cadre de Résultats (${m1Rows.length} indicateurs suivis) :`
          ],
          table: m1Table
        },
        {
          heading: '6.4 MAÎTRISE BUDGÉTAIRE PTBA & PERFORMANCE PAR LA VALEUR ACQUISE EVM (MATRICE M5)',
          table: m5Table
        },
        {
          heading: '6.5 INVENTAIRE DES LIVRABLES MAJEURS RÉDIGÉS, VALIDÉS ET HOMOLOGUÉS (MATRICE M9)',
          table: {
            headers: m9Table.headers,
            columnWidths: m9Table.columnWidths,
            rightAlignCols: m9Table.rightAlignCols,
            rows: (m9Table.rows || []).slice(0, 8)
          }
        }
      ]
    };

    // Parse 3 references from recommendationsLessons
    const refLines = (fields.recommendationsLessons || '')
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    const page4CvDetaille: StructuredA4Page = {
      pageTitle: `CV DÉTAILLÉ BAILLEURS (PAGE 4/4) — PUBLICATIONS, RÉFÉRENCES & ATTESTATION DE SINCÉRITÉ SIGNÉE`,
      pageSubtitle: `Sections 7, 8, 9 & 10 · Travaux Scientifiques, Personnes de Référence Vérifiables & Attestation Officielle WB/UE/ONU`,
      isSignaturePage: true,
      orgStampDataUrl: fields.orgStampDataUrl,
      partnerStampDataUrl: fields.partnerStampDataUrl,
      sections: [
        {
          heading: '7. PUBLICATIONS SCIENTIFIQUES, MANUELS MÉTHODOLOGIQUES & 8. AFFILIATIONS PROFESSIONNELLES',
          paragraphs: [fields.confidentialityClauses],
          bullets: [
            'Project Management Institute (PMI®) — Membre actif & Certifié PMP® (Respect du Code d’Éthique et de Conduite Professionnelle).',
            'Réseau Francophone de l’Évaluation (RFE) & Association Africaine d’Évaluation (AfrEA) — Expert Évaluateur Senior.',
            'Praticien certifié des normes du Groupe des Nations Unies pour l’Évaluation (UNEG) et des critères du Comité d’Aide au Développement (OCDE/CAD).'
          ]
        },
        {
          heading: '9. PERSONNES DE RÉFÉRENCE PROFESSIONNELLE VÉRIFIABLES (MINIMUM 3 RÉFÉRENCES)',
          table: {
            headers: [
              'Nom & Prénoms de la Référence (24%)',
              'Fonction / Titre Officiel (28%)',
              'Organisation / Bailleur de Fonds (24%)',
              'Email Professionnel & Téléphone Direct (24%)'
            ],
            columnWidths: [24, 28, 24, 24],
            rows: [
              [
                'Dr. Kouadio Jean-Baptiste',
                'Directeur Général de la Planification & du S&E',
                'Ministère du Plan & du Développement / COPIL',
                refLines[0] || 'dg.plan@gouv.ci | Tél : +225 27 20 00 11 22'
              ],
              [
                'Mme Aminata Touré',
                'Spécialiste Senior en Gestion de Projets & S&E',
                'Représentation Régionale Banque Mondiale / PNUD',
                refLines[1] || 'atoure.se@worldbank-undp.org | Tél : +221 33 859 00 00'
              ],
              [
                'M. Marc-Antoine Lefèvre',
                'Chef de Coopération, Infrastructures & Gouvernance',
                'Délégation de l’Union Européenne / BAD',
                refLines[2] || 'ma.lefevre@intl-coop.eu | Tél : +32 2 299 11 11'
              ]
            ]
          }
        },
        {
          heading: '10. ATTESTATION DE SINCÉRITÉ ET D’ENGAGEMENT DE DISPONIBILITÉ (NORME WB TECH-6 / EUROPEAID)',
          paragraphs: [
            `« Je, soussigné(e) ${userProfile.fullName}, certifie sur l’honneur, en toute conscience, que les renseignements ci-dessus rendent fidèlement compte de ma situation, de mes qualifications et de mon expérience, et m’engage à être disponible pour réaliser la mission au sein de « ${nomDuProjet} » en cas d’attribution. Je comprends que toute fausse déclaration volontaire peut entraîner ma disqualification ou la résiliation de mon contrat. »`,
            `Fait à ${fields.locationCity || 'Abidjan'}, le ${dateStr} — Signature officielle de l’Expert ([IMAGE_SIGNATURE_EXPERT]) ci-dessous :`
          ]
        }
      ]
    };

    return [page1CvDetaille, page2CvDetaille, page3CvDetaille, page4CvDetaille];
  }

  // ----------------------------------------------------------------------------
  // DOCUMENT 14 : PROCÈS-VERBAL (PV) OFFICIEL DE RÉUNION (2 PAGES - SANS PAGE DE GARDE)
  // ----------------------------------------------------------------------------
  if (docType === 'pv_reunion') {
    const m4Rows = activeMatrices.M4 || [];
    const m7Rows = activeMatrices.M7 || [];
    const m10Rows = activeMatrices.M10 || [];

    // Construction de la feuille de présence officielle à 6 colonnes depuis M4 + Équipe du projet
    const attendanceRows: string[][] = [];
    attendanceRows.push([
      '01',
      userProfile.fullName,
      organisationCommanditaire,
      `${userProfile.role} (Rapporteur / Secrétaire)`,
      `${userProfile.email}\n${userProfile.phone}`,
      'PRÉSENT (Émargé)'
    ]);

    m4Rows.forEach((r, idx) => {
      attendanceRows.push([
        String(idx + 2).padStart(2, '0'),
        r.Nom_Institution_Groupe || `Acteur #${idx + 2}`,
        r.Categorie_Acteur || organisationCommanditaire,
        r.Role_Dans_Projet || 'Membre du Comité',
        r.Canal_Frequence_Comm || 'Contact officiel COPIL',
        idx < 5 ? 'PRÉSENT (Émargé)' : 'EXCUSÉ (Représenté)'
      ]);
    });

    // Construction de la Matrice de Suivi des Décisions et Plan d'Actions Immédiat (Section 5 — 6 colonnes) depuis M10 & M7
    const pvActionRows: string[][] = m10Rows.map((r, i) => [
      r.Code_Action_Rec || `DEC-${String(i + 1).padStart(2, '0')}`,
      r.Recommandation_Prescription_Action || r.Constat_Ecart_Lecon_Identifiee || 'Action décidée en séance',
      r.Responsable_Execution || userProfile.fullName,
      r.Echeance_Cible || todayISO,
      r.Indicateur_Verif_Mise_En_Oeuvre || 'PV / Livrable validé',
      `${r.Priorite || 'Haute'} (${r.Statut_Mise_En_Oeuvre || 'En cours'})`
    ]);

    if (pvActionRows.length === 0) {
      m7Rows.slice(0, 3).forEach((r, i) => {
        pvActionRows.push([
          `ACT-${String(i + 1).padStart(2, '0')}`,
          r.Plan_Action_Mitigation || r.Description_Precise,
          r.Proprietaire_Risque || userProfile.fullName,
          todayISO,
          'Rapport de levée de réserve',
          `Critique (${r.Statut_RAID || 'Ouvert'})`
        ]);
      });
    }

    const page1PvReunion: StructuredA4Page = {
      pageTitle: `PROCÈS-VERBAL OFFICIEL DE RÉUNION — ${fields.referenceCode}`,
      pageSubtitle: `Catégorie D (Page 1/2 · Sans Page de Garde) · Fiche Signalétique, Feuille de Présence (M4), Ordre du Jour & Débats`,
      sections: [
        {
          heading: 'BANDEAU D’EN-TÊTE OFFICIEL DE SÉANCE (SANS PAGE DE GARDE)',
          operationalHeaderBanner: {
            variant: 'pv_reunion',
            leftLogoLabel: `[IMAGE_LOGO_EMETTEUR]\n${organisationCommanditaire}`,
            rightLogoLabel: `[IMAGE_LOGO_PARTENAIRE_BAILLEUR]\n${bailleurDeFonds}`,
            leftLogoDataUrl: fields.leftLogoDataUrl,
            rightLogoDataUrl: fields.rightLogoDataUrl,
            centerDocTitle: `PROCÈS-VERBAL OFFICIEL DE RÉUNION — ${fields.referenceCode}`,
            centerSubTitle: `Portefeuille : « ${nomDuProjet} » (${dossier.horizonPlan} · Budget : ${budgetGlobalFormatted})`,
            referenceAndDateLine: `Séance tenue le ${dateStr} à ${fields.locationCity || 'Abidjan'} · Quorum vérifié et atteint`
          }
        },
        {
          heading: '1. FICHE SIGNALÉTIQUE DE LA SÉANCE',
          table: {
            headers: [
              'Paramètre de Séance (22%)',
              'Détails Officiels (28%)',
              'Gouvernance & Quorum (22%)',
              'Validation Institutionnelle (28%)'
            ],
            columnWidths: [22, 28, 22, 28],
            rows: [
              [
                'Projet / Programme',
                `${nomDuProjet} (${dossier.horizonPlan})`,
                'Président de Séance',
                `${fields.recipientOrg} (Autorité COPIL)`
              ],
              [
                'Type d’Instance',
                'Comité de Pilotage (COPIL) & Revue d’Avancement',
                'Secrétaire de Séance (Rapporteur)',
                `${userProfile.fullName} (${userProfile.role})`
              ],
              [
                'Date & Horaire',
                `${dateStr} (09h00 – 12h30)`,
                'Lieu / Modalité',
                fields.locationCity || 'Salle de Conférence UGP & Hybride'
              ],
              [
                'Constatation du Quorum',
                'Le quorum réglementaire étant atteint, la séance est déclarée ouverte.',
                'État d’Avancement Audité',
                `${progressPct}% réalisé (${completedTasks}/${totalTasks} tâches) · Chemin critique : ${maxProjectDuration}j`
              ]
            ]
          }
        },
        {
          heading: '2. FEUILLE DE PRÉSENCE OFFICIELLE (PARTICIPANTS, EXCUSÉS & ABSENTS — CONNECTÉE MATRICE M4)',
          table: {
            headers: [
              'N° (7%)',
              'Nom & Prénoms / Entité (23%)',
              'Institution / Structure (20%)',
              'Fonction / Rôle Projet (20%)',
              'Email / Téléphone / Canal (16%)',
              'Statut & Émargement (14%)'
            ],
            columnWidths: [7, 23, 20, 20, 16, 14],
            rows: attendanceRows
          }
        },
        {
          heading: '3. ORDRE DU JOUR APPROUVÉ EN OUVERTURE DE SÉANCE',
          paragraphs: [fields.contextJustification]
        },
        {
          heading: '4. DÉROULEMENT DES TRAVAUX, SYNTHÈSE DES DÉBATS ET ARBITRAGES PAR POINT DE L’ODJ',
          paragraphs: [
            `4.1 Synthèse Factuelle des Présentations et Débats :\n${fields.specificObjectives}`,
            `4.2 Résolutions Fermes et Arbitrages Validés en Séance :\n${fields.methodologyApproach}`
          ]
        }
      ]
    };

    const page2PvReunion: StructuredA4Page = {
      pageTitle: `PROCÈS-VERBAL OFFICIEL DE RÉUNION (PAGE 2/2) — MATRICE DES DÉCISIONS (M10/M7) & SIGNATURES`,
      pageSubtitle: `Sections 5, 6 & 7 · Plan d’Actions Immédiat, Risques Arbitrés, Prochaine Séance & Approbation Officielle`,
      isSignaturePage: true,
      orgStampDataUrl: fields.orgStampDataUrl,
      partnerStampDataUrl: fields.partnerStampDataUrl,
      sections: [
        {
          heading: '5. MATRICE DE SUIVI DES DÉCISIONS ET PLAN D’ACTIONS IMMÉDIAT (CONNECTÉE MATRICE M10)',
          paragraphs: fields.confidentialityClauses ? [fields.confidentialityClauses] : undefined,
          table: {
            headers: [
              'N° Action (10%)',
              'Décision / Action à Entreprendre (28%)',
              'Responsable Désigné (18%)',
              'Échéance Stricte (14%)',
              'Livrable / Preuve Attendue (18%)',
              'Priorité & Statut (12%)'
            ],
            columnWidths: [10, 28, 18, 14, 18, 12],
            rows: pvActionRows
          }
        },
        {
          heading: '5 BIS. POINT DE VIGILANCE SUR LES RISQUES & PROBLÈMES SOUMIS À ARBITRAGE (MATRICE M7 RAID)',
          table: {
            headers: m7Table.headers,
            columnWidths: m7Table.columnWidths,
            rightAlignCols: m7Table.rightAlignCols,
            rows: (m7Table.rows || []).slice(0, 4)
          }
        },
        {
          heading: '6. PROCHAINE SÉANCE & CLÔTURE OFFICIELLE DES TRAVAUX',
          paragraphs: [fields.recommendationsLessons]
        },
        {
          heading: '7. BLOC DE VALIDATION ET SIGNATURES OFFICIELLES ([IMAGE_SIGNATURES_PV])',
          table: {
            headers: [
              `LE SECRÉTAIRE DE SÉANCE / RAPPORTEUR (${organisationCommanditaire})`,
              `LE PRÉSIDENT DE SÉANCE — POUR APPROBATION (${fields.recipientOrg})`
            ],
            columnWidths: [50, 50],
            rows: [
              [
                `Nom & Prénoms : ${userProfile.fullName}\nFonction : ${userProfile.role}\nDate : ${dateStr}\nMention : « Certifié conforme aux délibérations »`,
                `Autorité : Président du Comité de Pilotage (COPIL)\nEntité : ${fields.recipientOrg}\nDate : ${dateStr}\nMention : « Lu et approuvé en séance »`
              ]
            ]
          }
        }
      ]
    };

    return [page1PvReunion, page2PvReunion];
  }

  // ----------------------------------------------------------------------------
  // DOCUMENT 15 : TERMES DE RÉFÉRENCE (TDR) SIMPLIFIÉS AVEC TABLEAUX (2 PAGES - SANS PAGE DE GARDE)
  // ----------------------------------------------------------------------------
  if (docType === 'tdr_simplifie') {
    const m2Rows = activeMatrices.M2 || [];
    const m3Rows = activeMatrices.M3 || [];
    const m5Rows = activeMatrices.M5 || [];
    const m9Rows = activeMatrices.M9 || [];

    // Section 4 : Matrice des Tâches, Méthodologie et Livrables Attendus (5 colonnes depuis M2 & M9)
    const tdrTasksLivrablesRows: string[][] = m2Rows.slice(0, 8).map((r, idx) => {
      const matchingLiv = m9Rows[idx] || m9Rows[0] || {};
      return [
        r.Phase_Lot || `Phase ${(idx % 5) + 1}`,
        `${r.Code_WBS} — ${r.Intitule_Tache_Activite}`,
        matchingLiv.Intitule_Livrable_Actif ||
          `${r.Jalon_Associe || 'Livrable opérationnel'} (${matchingLiv.Description_Format_Attendu || 'Rapport PDF + Données'})`,
        `${r.Duree_Jours || '15'}j (Éch. : ${r.Date_Fin_Prevue || todayISO})`,
        matchingLiv.Instance_Approbation || 'UGP / Comité Technique & COPIL'
      ];
    });

    // Section 6 : Tableau d'Échéancier, Jours-Hommes et Modalités de Paiement (5 colonnes depuis M9)
    const tdrPaymentScheduleRows: string[][] = m9Rows.slice(0, 6).map((r, idx) => {
      const hj = m3Rows[idx]?.Charge_Homme_Jours || String(Math.max(5, Math.round(maxProjectDuration / Math.max(1, m9Rows.length))));
      return [
        r.Code_Livrable || `L${idx + 1}`,
        `${r.Intitule_Livrable_Actif}\n(${r.Description_Format_Attendu || 'Format A4 PDF & Numérique'})`,
        `${hj} H/J`,
        r['Tranche_Paiement_Associee_%'] || (idx === 0 ? '20%' : idx === 1 ? '40%' : '40%'),
        `${r.Criteres_Qualite_Acceptation || 'Validation sans réserve'}\n(${r.Instance_Approbation || 'COPIL / UGP'})`
      ];
    });

    // Section 7 : Budget Prévisionnel de l'Activité (5 colonnes condensées depuis M5)
    const tdrCondensedBudgetRows: string[][] = m5Rows.slice(0, 6).map(r => [
      `${r.Code_Ligne_Budget} — ${r.Rubrique_Activite_PTBA}`,
      r.Unite || 'Forfait',
      r.Quantite || '1',
      formatDocAmount(Number(r.Cout_Unitaire) || Number(r.Budget_Initial_BAC) || 0, currency, lang),
      formatDocAmount(Number(r.Budget_Initial_BAC) || 0, currency, lang)
    ]);
    tdrCondensedBudgetRows.push([
      'TOTAL BUDGET PRÉVISIONNEL DE L’ACTIVITÉ (HT / TTC)',
      'Global',
      '100%',
      '—',
      budgetGlobalFormatted
    ]);

    const page1TdrSimplifie: StructuredA4Page = {
      pageTitle: `TERMES DE RÉFÉRENCE SIMPLIFIÉS (OPÉRATIONNELS) — ${fields.referenceCode}`,
      pageSubtitle: `Catégorie D (Page 1/2 · Sans Page de Garde) · Fiche Synoptique, Contexte, Objectifs & Matrice des Tâches/Livrables (M2/M9)`,
      sections: [
        {
          heading: 'BANDEAU D’EN-TÊTE OPÉRATIONNEL DES TDR SIMPLIFIÉS (SANS PAGE DE GARDE)',
          operationalHeaderBanner: {
            variant: 'tdr_simplifie',
            leftLogoLabel: `[IMAGE_LOGO_EMETTEUR]\n${organisationCommanditaire}`,
            rightLogoLabel: `[IMAGE_LOGO_PARTENAIRE_BAILLEUR]\n${bailleurDeFonds}`,
            leftLogoDataUrl: fields.leftLogoDataUrl,
            rightLogoDataUrl: fields.rightLogoDataUrl,
            centerDocTitle: `TERMES DE RÉFÉRENCE SIMPLIFIÉS (OPÉRATIONNELS)`,
            centerSubTitle: `Portefeuille : « ${nomDuProjet} » · Code Activité PTBA : ${fields.referenceCode}`,
            referenceAndDateLine: `Lieu : ${zoneGeographique} · Durée critique : ${maxProjectDuration}j · Enveloppe : ${budgetGlobalFormatted}`
          }
        },
        {
          heading: '1. FICHE SYNOPTIQUE DE L’ACTIVITÉ (TABLEAU D’IDENTIFICATION OPÉRATIONNELLE)',
          table: {
            headers: [
              'Projet & Bailleur de Fonds (22%)',
              'Code & Ligne PTBA (18%)',
              'Lieu & Période d’Exécution (20%)',
              'Charge (H/J) & Budget Estimé (20%)',
              'Superviseur Direct (UGP) (20%)'
            ],
            columnWidths: [22, 18, 20, 20, 20],
            rightAlignCols: [3],
            rows: [
              [
                `${nomDuProjet}\n(${bailleurDeFonds})`,
                `${fields.referenceCode}\n(${(dossier.axes || []).length} Axe(s) / ${pertSummaries.length} Projet(s))`,
                `${zoneGeographique}\nHorizon ${dossier.horizonPlan}`,
                `${maxProjectDuration} Jours-Hommes\n${budgetGlobalFormatted}`,
                `${userProfile.fullName}\n(${userProfile.role} — ${organisationCommanditaire})`
              ]
            ]
          },
          paragraphs: [fields.recipientRepresentative]
        },
        {
          heading: '2. CONTEXTE ET JUSTIFICATION OPÉRATIONNELLE (SYNTHÈSE CIBLÉE)',
          paragraphs: [fields.contextJustification]
        },
        {
          heading: '3. OBJECTIFS DE LA PRESTATION / ACTIVITÉ (3.1 OBJECTIF GLOBAL & 3.2 OBJECTIFS SPÉCIFIQUES)',
          paragraphs: [
            fields.specificObjectives,
            `Méthodologie d’intervention exigée : ${fields.methodologyApproach}`
          ]
        },
        {
          heading: '4. MATRICE DES TÂCHES, MÉTHODOLOGIE ET LIVRABLES ATTENDUS (CONNECTÉE MATRICES M2 & M9)',
          table: {
            headers: [
              'Phase / Étape (14%)',
              'Tâches Opérationnelles à Réaliser (28%)',
              'Livrables Attendus & Format (24%)',
              'Délai / Échéance (16%)',
              'Instance de Validation (18%)'
            ],
            columnWidths: [14, 28, 24, 16, 18],
            rows: tdrTasksLivrablesRows
          }
        }
      ]
    };

    const page2TdrSimplifie: StructuredA4Page = {
      pageTitle: `TERMES DE RÉFÉRENCE SIMPLIFIÉS (PAGE 2/2) — PROFIL (M3), ÉCHÉANCIER DE PAIEMENT (M9) & BUDGET (M5)`,
      pageSubtitle: `Sections 5, 6 & 7 · Qualifications & Grille 100 pts, Modalités de Paiement par Livrable & Budget Prévisionnel`,
      isSignaturePage: true,
      orgStampDataUrl: fields.orgStampDataUrl,
      partnerStampDataUrl: fields.partnerStampDataUrl,
      sections: [
        {
          heading: '5. PROFIL REQUIS (MATRICE M3) ET GRILLE D’ÉVALUATION RAPIDE SUR 100 POINTS',
          paragraphs: [fields.governanceModalities],
          table: {
            headers: [
              'CodeCritère (16%)',
              'Critère d’Évaluation Technique des Candidatures / Offres (64%)',
              'Barème / Note Max (20%)'
            ],
            columnWidths: [16, 64, 20],
            rightAlignCols: [2],
            rows: [
              [
                'CRIT-01',
                'Qualifications académiques (Bac+5 minimum : Ingénierie, Gestion de Projet, Économie, S&E) et certifications internationales (PMP®, ISO 21500, GAR)',
                '20 points'
              ],
              [
                'CRIT-02',
                'Expérience générale et spécifique avérée sur des missions similaires financées par les bailleurs internationaux (BM, BAD, UE, PNUD)',
                '50 points'
              ],
              [
                'CRIT-03',
                'Qualité de la note méthodologique opérationnelle, maîtrise du chemin critique PERT/CPM et adéquation du chronogramme',
                '30 points'
              ],
              [
                'TOTAL TECHNIQUE',
                'NOTE GLOBALE SUR 100 POINTS (Score technique minimal de qualification requis : 75 / 100 points)',
                '100 points'
              ]
            ]
          }
        },
        {
          heading: '6. TABLEAU D’ÉCHÉANCIER, JOURS-HOMMES ET MODALITÉS DE PAIEMENT (CONNECTÉ MATRICE M9)',
          paragraphs: [fields.confidentialityClauses],
          table: {
            headers: [
              'Code Livrable (12%)',
              'Désignation du Livrable Contractuel (30%)',
              'Effort Estimé (14%)',
              '% de Paiement (14%)',
              'Condition de Déblocage & Validation (30%)'
            ],
            columnWidths: [12, 30, 14, 14, 30],
            rightAlignCols: [2, 3],
            rows: tdrPaymentScheduleRows
          }
        },
        {
          heading: '7. BUDGET PRÉVISIONNEL DE L’ACTIVITÉ (MATRICE M5) & DOSSIER DE SOUMISSION RAPIDE',
          table: {
            headers: [
              'Rubrique Budgétaire PTBA (Honoraires, Logistique, Livrables) (32%)',
              'Unité (12%)',
              'Quantité (12%)',
              `Coût Unitaire (22%)`,
              `Montant Total (${currency}) (22%)`
            ],
            columnWidths: [32, 12, 12, 22, 22],
            rightAlignCols: [2, 3, 4],
            rows: tdrCondensedBudgetRows
          },
          paragraphs: [fields.recommendationsLessons]
        }
      ]
    };

    return [page1TdrSimplifie, page2TdrSimplifie];
  }

  // ============================================================================
  // BLOCS COMMUNS RÉUTILISABLES (CHARTE DE GARDE, CADRE LOGIQUE 4x4, BOARD RAID)
  // ============================================================================
  const coverChartBlock: CoverChartData = {
    leftLogo: `[LOGO BAILLEUR / COMMANDITAIRE]\n${bailleurDeFonds}`,
    rightLogo: `[LOGO AGENCE D'EXÉCUTION]\n${organisationCommanditaire}`,
    bannerTitle: `[BANNIÈRE / IMAGE DE L'INTERVENTION]\n${nomDuProjet.toUpperCase()}`,
    bannerSubtitle: `Visuel contextuel centré du programme · ${zoneGeographique} · ${dureeOuPeriode}`,
    docTitle: cfg.officialTitle,
    docSubtitle: `${cfg.subtitle}\n[CODE DOCUMENT : ${fields.referenceCode} | PORTÉE : ${dossier.type.toUpperCase()}]`,
    bottomLeftStructure: `[NOM DE LA STRUCTURE / REPRÉSENTATION]\n${organisationCommanditaire}\nPilotage : ${userProfile.fullName} (${userProfile.role})`,
    bottomLeftZone: `[ZONE GÉOGRAPHIQUE / PAYS]\n${zoneGeographique}`,
    bottomRightDateVersion: `[DATES & VERSION]\nÉmis le ${dateStr} · Version 1.0 Consolidée`,
    bottomRightStatus: `[STATUS : FINAL / OFFICIEL]\nNormes : ${cfg.normativeReference}`,
    leftLogoDataUrl: fields.leftLogoDataUrl,
    rightLogoDataUrl: fields.rightLogoDataUrl,
    bannerImageDataUrl: fields.bannerImageDataUrl
  };

  const ficheSignaletiqueKeyValues: Array<[string, string]> = [
    ['1. Intitulé Officiel du Projet / Portefeuille', nomDuProjet],
    ['2. Référence & Protocole Documentaire', `${fields.referenceCode || 'REF-FAAB-2026'} — Catégorie ${cfg.category}`],
    ['3. Structure Pilote / Agence d’Exécution', `${organisationCommanditaire} (${userProfile.fullName} — ${userProfile.role})`],
    ['4. Bailleur(s) de Fonds / Destinataire Officiel', `${bailleurDeFonds} (${fields.recipientRepresentative || 'Représentant Habilité'})`],
    ['5. Zone Géographique & Période Couverte', `${zoneGeographique} · ${dureeOuPeriode}`],
    ['6. Enveloppe Budgétaire Globale Consolidée', `${budgetGlobalFormatted} (Engagé à date : ${committedBudgetFormatted} soit ${financialExecutionPct}%)`],
    ['7. État d’Avancement Opérationnel (Kanban & Suivi)', `${progressPct}% achevé (${completedTasks}/${totalTasks} terminées, ${inProgressTasks} en cours, ${blockedTasks} bloquées, ${delayedTasksCount} en écart)`],
    ['8. Chemin Critique PERT/CPM & Référentiel Normatif', `Durée minimale : ${maxProjectDuration}j (${criticalSequence}) · ${cfg.normativeReference}`]
  ];

  const logframeTable: StructuredA4Table = m1Table;
  const raidTable: StructuredA4Table = m7Table;

  // ============================================================================
  // CATÉGORIE B : DOCUMENTS COURTS DE 2 À 5 PAGES (SANS PAGES LOURDES DE LISTES)
  // ============================================================================

  // ----------------------------------------------------------------------------
  // DOC 4 : LETTRE DE MISSION / ORDRE DE MISSION (CATÉGORIE B — 2 PAGES)
  // ----------------------------------------------------------------------------
  if (docType === 'lettre_mission') {
    return [
      {
        pageTitle: `PAGE 1 — LETTRE DE MISSION & MANDAT OPÉRATIONNEL`,
        pageSubtitle: `Protocole Catégorie B (Page 1/2) · En-tête Exécutif, Fiche Signalétique du Mandat & Objectifs Assignés`,
        sections: [
          {
            heading: 'CHARTE EXÉCUTIVE D’INVESTITURE & IDENTIFICATION DU MANDAT',
            coverChart: coverChartBlock,
            keyValueRows: ficheSignaletiqueKeyValues
          },
          {
            heading: '1. CONTEXTE INSTITUTIONNEL, OBJET DU MANDAT ET INVESTITURE OFFICIELLE',
            paragraphs: [
              `1.1 Cadre d’Investiture : ${fields.contextJustification}`,
              `1.2 Portée Opérationnelle du Mandat : Par la présente Lettre de Mission (Réf. ${fields.referenceCode}), ${organisationCommanditaire} confie à ${fields.recipientRepresentative || userProfile.fullName} la responsabilité opérationnelle de coordonner, superviser et livrer les activités du portefeuille « ${nomDuProjet} » sur l’horizon ${dossier.horizonPlan}, dans le strict respect des normes ${cfg.normativeReference}.`
            ]
          },
          {
            heading: '2. OBJECTIFS ASSIGNÉS, RÉSULTATS ATTENDUS ET CIBLES DE PERFORMANCE',
            paragraphs: [fields.specificObjectives],
            table: {
              headers: [
                'Domaine de Performance (20%)',
                'Indicateur de Mandat SMART (32%)',
                'Cible Contractuelle Assignée (28%)',
                'Situation Actuelle (20%)'
              ],
              columnWidths: [20, 32, 28, 20],
              rows: [
                [
                  'Exécution Physique WBS',
                  'Taux de réalisation des activités et jalons programmés',
                  `100% des ${totalTasks} activités validées`,
                  `${progressPct}% (${completedTasks}/${totalTasks} terminées)`
                ],
                [
                  'Maîtrise du Chemin Critique',
                  'Respect de la durée critique incompressible PERT/CPM',
                  `<= ${maxProjectDuration} jours ouvrés (0 glissement)`,
                  `Séquence : ${criticalSequence}`
                ],
                [
                  'Performance Budgétaire',
                  'Exécution conforme au PTBA sans dépassement non autorisé',
                  `Plafond : ${budgetGlobalFormatted}`,
                  `Engagé : ${committedBudgetFormatted} (${financialExecutionPct}%)`
                ],
                [
                  'Qualité & Redevabilité',
                  'Taux de livrables approuvés par l’Autorité (A) RACI',
                  '100% des PV de réception signés',
                  `${blockedTasks} blocage(s) · ${delayedTasksCount} écart(s)`
                ]
              ]
            }
          }
        ]
      },
      {
        pageTitle: `PAGE 2 — MOYENS ALLOUÉS, GOUVERNANCE RACI, FEUILLE DE ROUTE & SIGNATURES`,
        pageSubtitle: `Protocole Catégorie B (Page 2/2) · Délégation de Moyens, Ordonnancement Critique & Approbation Conjointe`,
        isSignaturePage: true,
        orgStampDataUrl: fields.orgStampDataUrl,
        partnerStampDataUrl: fields.partnerStampDataUrl,
        sections: [
          {
            heading: '3. PRÉROGATIVES, MOYENS ALLOUÉS ET ENVELOPPE BUDGÉTAIRE SOUS DÉLÉGATION (MATRICE M5)',
            paragraphs: [
              `3.1 Autorité Fonctionnelle et Moyens : ${fields.methodologyApproach}`,
              `3.2 Modalités de Reporting et Gouvernance : ${fields.governanceModalities}`,
              `3.3 Déontologie et Obligation de Réserve : ${fields.confidentialityClauses}`
            ],
            table: m5Table
          },
          {
            heading: '4. FEUILLE DE ROUTE WBS (M2), MATRICE RACI (M3) & LIVRABLES ATTENDUS (M9)',
            paragraphs: [`4.1 Instructions Prioritaires : ${fields.recommendationsLessons}`],
            table: m3Table
          },
          {
            heading: '5. CALENDRIER DES LIVRABLES CONTRACTUELS SOUS MANDAT (MATRICE M9)',
            table: m9Table
          }
        ]
      }
    ];
  }

  // ----------------------------------------------------------------------------
  // DOC 10 : ACCORD DE CONFIDENTIALITÉ & NON-DIVULGATION - NDA (CATÉGORIE B — 3 PAGES)
  // ----------------------------------------------------------------------------
  if (docType === 'nda') {
    return [
      {
        pageTitle: `PAGE 1 — ACCORD DE CONFIDENTIALITÉ & NON-DIVULGATION (NDA)`,
        pageSubtitle: `Protocole Catégorie B (Page 1/3) · Identification Juridique des Parties, Fiche Signalétique & Préambule`,
        sections: [
          {
            heading: 'CHARTE OFFICIELLE & IDENTIFICATION DES PARTIES CONTRACTANTES',
            coverChart: coverChartBlock,
            keyValueRows: ficheSignaletiqueKeyValues
          },
          {
            heading: 'PRÉAMBULE & ARTICLE 1 — OBJET DE L’ACCORD ET PÉRIMÈTRE DU PORTEFEUILLE PROTÉGÉ',
            paragraphs: [
              `ENTRE LES SOUSSIGNÉS : D’une part, « ${organisationCommanditaire} », représentée par ${userProfile.fullName} (${userProfile.role}), ci-après dénommée « La Partie Divulgatrice » ; ET d’autre part, « ${bailleurDeFonds} », représentée par ${fields.recipientRepresentative || 'son Représentant Légal'}, ci-après dénommée « La Partie Réceptrice ».`,
              `Article 1.1 — Objet de l’Accord : ${fields.contextJustification}`,
              `Article 1.2 — Périmètre des Données Protégées : ${fields.specificObjectives}`
            ]
          }
        ]
      },
      {
        pageTitle: `PAGE 2 — INVENTAIRE DES ACTIFS PROTÉGÉS, SÉCURITÉ ISO 27001 & OBLIGATIONS`,
        pageSubtitle: `Protocole Catégorie B (Page 2/3) · Articles 2, 3 & 4 · Données Financières, Livrables & Engagements de Non-Divulgation`,
        sections: [
          {
            heading: 'ARTICLE 2 — INVENTAIRE DES LIVRABLES ET ACTIFS DOCUMENTAIRES COUVERTS PAR LE SECRET (MATRICE M9)',
            table: m9Table
          },
          {
            heading: 'ARTICLE 3 — MESURES DE SÉCURITÉ LOGIQUE, CHIFFREMENT & TRAÇABILITÉ (ISO/IEC 27001)',
            paragraphs: [
              `Article 3.1 — Protocole de Sécurité : ${fields.methodologyApproach}`,
              `Article 4.1 — Obligations Strictes de Non-Divulgation & Durée Légale : ${fields.confidentialityClauses}`
            ],
            bullets: [
              'Interdiction absolue de copie, diffusion, publication ou transmission des fichiers JSON, bases IndexedDB, états financiers et rapports PDF à des tiers non habilités.',
              'Obligation de chiffrement des supports numériques et de restriction des accès aux seuls acteurs inscrits dans la matrice RACI officielle.',
              'Maintien de l’obligation de confidentialité pendant toute la durée du programme et durant cinq (5) années après sa clôture définitive.'
            ]
          }
        ]
      },
      {
        pageTitle: `PAGE 3 — JURIDICTION, HABILITATIONS RACI (M3), PARTIES PRENANTES (M4), RISQUES (M7) & SIGNATURES`,
        pageSubtitle: `Protocole Catégorie B (Page 3/3) · Articles 5 & 6 · Registre des Personnes Habilitées & Engagements Signés`,
        isSignaturePage: true,
        orgStampDataUrl: fields.orgStampDataUrl,
        partnerStampDataUrl: fields.partnerStampDataUrl,
        sections: [
          {
            heading: 'ARTICLE 5 — REGISTRE DES HABILITATIONS D’ACCÈS SELON LA MATRICE RACI (MATRICE M3)',
            table: m3Table
          },
          {
            heading: 'ARTICLE 5 BIS — PARTIES PRENANTES ACCRÉDITÉES (M4) & RISQUES DE SÉCURITÉ (M7)',
            table: m4Table
          },
          {
            heading: 'ARTICLE 6 — JURIDICTION COMPÉTENTE, CONTRÔLE ET RESTITUTION / DESTRUCTION DES SUPPORTS',
            paragraphs: [
              `Article 6.1 — Règlement des Différends et Juridiction : ${fields.governanceModalities}`,
              `Article 6.2 — Clôture des Accès et Destruction des Copies : ${fields.recommendationsLessons}`
            ],
            table: m7Table
          }
        ]
      }
    ];
  }

  // ----------------------------------------------------------------------------
  // DOC 2 : TERMES DE RÉFÉRENCE OFFICIELS - TDR (CATÉGORIE B — 5 PAGES)
  // ----------------------------------------------------------------------------
  if (docType === 'tdr') {
    return [
      {
        pageTitle: `PAGE 1 — TERMES DE RÉFÉRENCE OFFICIELS (TDR)`,
        pageSubtitle: `Protocole Catégorie B (Page 1/5) · Page de Garde Condensée & Fiche Signalétique Intégrée`,
        sections: [
          {
            heading: 'CHARTE OFFICIELLE DE PAGE DE GARDE (TERMES DE RÉFÉRENCE — STANDARD PNUD / BM / UE)',
            coverChart: coverChartBlock
          },
          {
            heading: 'FICHE SIGNALÉTIQUE INTÉGRÉE DE LA MISSION (SYNTHÈSE CONTRACTUELLE)',
            keyValueRows: ficheSignaletiqueKeyValues
          }
        ]
      },
      {
        pageTitle: `PAGE 2 — CONTEXTE STRATÉGIQUE, OBJECTIFS SMART & APPROCHE MÉTHODOLOGIQUE`,
        pageSubtitle: `Protocole Catégorie B (Page 2/5) · Sections 1, 2 & 3 · Justification, Objectifs et Démarche Exigée`,
        sections: [
          {
            heading: '1. CONTEXTE STRATÉGIQUE, JUSTIFICATION DE LA MISSION ET ALIGNEMENT INSTITUTIONNEL',
            paragraphs: [
              `1.1 Contexte Général et Problématique : ${fields.contextJustification}`,
              `1.2 Ancrage Stratégique : La présente prestation s’inscrit dans l’exécution du portefeuille « ${nomDuProjet} » (${dossier.horizonPlan}) porté par ${organisationCommanditaire} en partenariat avec ${bailleurDeFonds}.`
            ],
            ...(fields.figureImageDataUrl
              ? {
                  figureImage: {
                    dataUrl: fields.figureImageDataUrl,
                    caption: `Schéma d’Intervention & Architecture du Portefeuille — ${nomDuProjet}`
                  }
                }
              : {})
          },
          {
            heading: '2. OBJECTIFS DE LA MISSION (OBJECTIF GÉNÉRAL, OBJECTIFS SPÉCIFIQUES SMART & EXTRANTS)',
            paragraphs: [fields.specificObjectives],
            bullets: (dossier.axes || []).map((axe, idx) => {
              const pCount = (axe.projects || []).length;
              const tCount = (axe.projects || []).reduce((acc, p) => acc + (p.tasks || []).length, 0);
              const aBud = (axe.projects || []).reduce(
                (acc, p) => acc + (p.tasks || []).reduce((s, t) => s + (Number(t.budget) || 0), 0),
                0
              );
              return `Axe Stratégique ${idx + 1} (${axe.name}) : ${pCount} projet(s), ${tCount} activité(s)/jalon(s), dotation de ${formatDocAmount(aBud, currency, lang)}.`;
            })
          },
          {
            heading: '3. PÉRIMÈTRE D’INTERVENTION ET APPROCHE MÉTHODOLOGIQUE EXIGÉE',
            paragraphs: [
              `3.1 Démarche Méthodologique Normée : ${fields.methodologyApproach}`,
              `3.2 Structuration en 5 Phases : Le prestataire articule son intervention autour des 5 phases normées ISO 21500 (Avant-Projet, Conception, Planification, Exécution & Suivi, Clôture) en maintenant l’intégrité du réseau PERT/CPM (${maxProjectDuration} jours ouvrés sur le chemin critique : ${criticalSequence}).`
            ]
          }
        ]
      },
      {
        pageTitle: `PAGE 3 — LIVRABLES ATTENDUS, MODALITÉS DE PAIEMENT & PROFILS D’EXPERTS`,
        pageSubtitle: `Protocole Catégorie B (Page 3/5) · Sections 4 & 5 · Calendrier des Livrables et Compétences Clés`,
        sections: [
          {
            heading: '4. TABLEAU DES LIVRABLES ATTENDUS, ASSURANCE QUALITÉ ET CONDITIONNALITÉS DE PAIEMENT (MATRICE M9)',
            table: m9Table
          },
          {
            heading: '5. PROFIL DE L’ÉQUIPE CLÉ EXIGÉE, CHARGE H/J ET MATRICE RACI (MATRICE M3)',
            table: m3Table
          }
        ]
      },
      {
        pageTitle: `PAGE 4 — PLANIFICATION OPÉRATIONNELLE WBS/PERT (M2) & BUDGET ANALYTIQUE EVM (M5)`,
        pageSubtitle: `Protocole Catégorie B (Page 4/5) · Sections 6 & 7 · Chronogramme WBS/PTBA et Allocation Budgétaire`,
        sections: [
          {
            heading: '6. PLANIFICATION OPÉRATIONNELLE WBS, CHRONOGRAMME GANTT & CHEMIN CRITIQUE PERT (MATRICE M2)',
            paragraphs: [`6.1 Gouvernance & Circuit d’Approbation : ${fields.governanceModalities}`],
            table: m2Table
          },
          {
            heading: '7. BUDGET ANALYTIQUE PTBA, EXÉCUTION FINANCIÈRE & VALEUR ACQUISE (MATRICE M5)',
            table: m5Table
          }
        ]
      },
      {
        pageTitle: `PAGE 5 — GRILLE D’ÉVALUATION DES OFFRES, DÉONTOLOGIE & APPROBATION`,
        pageSubtitle: `Protocole Catégorie B (Page 5/5) · Section 8 · Barème Technique/Financier (70/30), Risques RAID & Signatures`,
        isSignaturePage: true,
        orgStampDataUrl: fields.orgStampDataUrl,
        partnerStampDataUrl: fields.partnerStampDataUrl,
        sections: [
          {
            heading: '8. GRILLE D’ÉVALUATION DES OFFRES (PONDÉRATION TECHNIQUE 70% / FINANCIÈRE 30%)',
            paragraphs: [
              `8.1 Critères de Sélection : ${fields.recommendationsLessons}`,
              `8.2 Clauses Déontologiques et Propriété Intellectuelle : ${fields.confidentialityClauses}`
            ],
            table: {
              headers: [
                'Rubrique d’Évaluation (24%)',
                'Critères Détaillés d’Appréciation Technique & Financière (58%)',
                'Note Maximale (18%)'
              ],
              columnWidths: [24, 58, 18],
              rightAlignCols: [2],
              rows: [
                ['1. Compréhension des TDR', 'Qualité de l’analyse critique du contexte, pertinence des objectifs et maîtrise des enjeux du dossier.', '15 points'],
                ['2. Qualité de la Méthodologie', 'Robustesse de l’approche GAR, maîtrise de l’ordonnancement PERT/CPM, du Kanban et des outils S&E.', '30 points'],
                ['3. Qualification de l’Équipe Clé', 'Adéquation des diplômes, certifications PMP/ISO 21500 et références similaires du Chef de mission et des experts.', '35 points'],
                ['4. Organisation & Chronogramme', 'Réalisme du calendrier Gantt/PERT, respect du chemin critique et clarté de la matrice RACI.', '20 points'],
                ['TOTAL SCORE TECHNIQUE (Seuil : 70/100)', 'Pondération Technique = 70% · Pondération Financière (Moins-disant conforme) = 30%', '100 points']
              ]
            }
          },
          {
            heading: '9. MATRICE DES RISQUES DE LA MISSION (BOARD RAID SYNTHÉTIQUE)',
            table: raidTable
          }
        ]
      }
    ];
  }

  // ----------------------------------------------------------------------------
  // DOC 3 : NOTE MÉTHODOLOGIQUE & PROTOCOLE S&E (CATÉGORIE B — 5 PAGES)
  // ----------------------------------------------------------------------------
  if (docType === 'note_methodo') {
    return [
      {
        pageTitle: `PAGE 1 — NOTE MÉTHODOLOGIQUE & PROTOCOLE DE SUIVI-ÉVALUATION (S&E)`,
        pageSubtitle: `Protocole Catégorie B (Page 1/5) · Page de Garde Condensée & Fiche Signalétique Intégrée`,
        sections: [
          {
            heading: 'CHARTE OFFICIELLE DE LA NOTE MÉTHODOLOGIQUE (INGÉNIERIE GAR / PERT-CPM / ISO 21500)',
            coverChart: coverChartBlock
          },
          {
            heading: 'FICHE SIGNALÉTIQUE DU DISPOSITIF MÉTHODOLOGIQUE',
            keyValueRows: ficheSignaletiqueKeyValues
          }
        ]
      },
      {
        pageTitle: `PAGE 2 — SOMMAIRE CONDENSÉ, RÉSUMÉ EXÉCUTIF & COMPRÉHENSION DU MANDAT`,
        pageSubtitle: `Protocole Catégorie B (Page 2/5) · Synthèse de l’Approche et Relecture Critique des Enjeux`,
        sections: [
          {
            heading: 'SOMMAIRE EXÉCUTIF DE LA NOTE MÉTHODOLOGIQUE',
            table: {
              headers: ['Section (14%)', 'Intitulé de la Rubrique Méthodologique (54%)', 'Normes & Outils Mobilisés (20%)', 'Page (12%)'],
              columnWidths: [14, 54, 20, 12],
              rows: [
                ['Section 1', 'Compréhension Critique du Contexte, des Enjeux et de la Demande', 'GAR / Théorie du Changement', 'Page 2'],
                ['Section 2', 'Architecture Méthodologique en 5 Phases & Algorithme PERT/CPM', 'ISO 21500 / PMBOK 7 / CPM', 'Page 3'],
                ['Section 3', 'Dispositif de Collecte, Indicateurs SMART & Suivi Financier', 'UNEG / PTBA / Valeur Acquise', 'Page 4'],
                ['Section 4', 'Organisation du Travail, Gouvernance RACI & Chronogramme', 'Matrice RACI & Kanban', 'Page 4'],
                ['Section 5', 'Assurance Qualité des Données, Limites, Biais & Risques RAID', 'GEROS / Contrôle Interne', 'Page 5']
              ]
            }
          },
          {
            heading: '1. COMPRÉHENSION CRITIQUE DU CONTEXTE, DES ENJEUX ET DES OBJECTIFS MÉTHODOLOGIQUES',
            paragraphs: [
              `1.1 Justification du Dispositif : ${fields.contextJustification}`,
              `1.2 Objectifs de Fiabilisation et de Pilotage : ${fields.specificObjectives}`
            ],
            ...(fields.figureImageDataUrl
              ? {
                  figureImage: {
                    dataUrl: fields.figureImageDataUrl,
                    caption: `Architecture Conceptuelle du Dispositif S&E — ${nomDuProjet}`
                  }
                }
              : {})
          }
        ]
      },
      {
        pageTitle: `PAGE 3 — DÉMARCHE EN 5 PHASES NORMÉES & MODÉLISATION DU RÉSEAU PERT/CPM`,
        pageSubtitle: `Protocole Catégorie B (Page 3/5) · Section 2 · Ingénierie d’Ordonnancement et Calcul du Chemin Critique`,
        sections: [
          {
            heading: '2. ARCHITECTURE MÉTHODOLOGIQUE EN 5 PHASES ET PLANIFICATION WBS / PERT (MATRICE M2)',
            paragraphs: [
              `2.1 Démarche Opérationnelle : ${fields.methodologyApproach}`,
              `2.2 Formules d’Ordonnancement PERT/CPM : Le moteur FAAB PLAN calcule pour chaque nœud ses dates au plus tôt (ES, EF = ES + Durée) par passe avant, et ses dates au plus tard (LF, LS = LF - Durée) par passe arrière. La Marge Totale (MT = LS - ES) identifie le Chemin Critique (${criticalSequence}) de ${maxProjectDuration} jours ouvrés.`
            ],
            table: m2Table
          }
        ]
      },
      {
        pageTitle: `PAGE 4 — GRILLE D’ÉVALUATION OCDE/CAD (M6) & GOUVERNANCE RACI / RH (M3)`,
        pageSubtitle: `Protocole Catégorie B (Page 4/5) · Sections 3 & 4 · Référentiel Évaluatif OCDE et Attribution des Rôles`,
        sections: [
          {
            heading: '3. MATRICE DES QUESTIONS ÉVALUATIVES ET CRITÈRES OCDE/CAD (MATRICE M6)',
            table: m6Table
          },
          {
            heading: '4. ORGANISATION DU TRAVAIL, CHARGE D’EXPERTS ET MATRICE RACI (MATRICE M3)',
            paragraphs: [`4.1 Gouvernance des Données et Rituels de Validation : ${fields.governanceModalities}`],
            table: m3Table
          }
        ]
      },
      {
        pageTitle: `PAGE 5 — ASSURANCE QUALITÉ, GESTION DES BIAIS, RISQUES RAID & SIGNATURES`,
        pageSubtitle: `Protocole Catégorie B (Page 5/5) · Section 5 · Sécurité du Système d’Information S&E et Validation`,
        isSignaturePage: true,
        orgStampDataUrl: fields.orgStampDataUrl,
        partnerStampDataUrl: fields.partnerStampDataUrl,
        sections: [
          {
            heading: '5. DISPOSITIF D’ASSURANCE QUALITÉ, SÉCURITÉ HYBRIDE (INDEXEDDB / JSON) ET LIMITES',
            paragraphs: [
              `5.1 Sécurité et Intégrité Documentaire : ${fields.confidentialityClauses}`,
              `5.2 Recommandations d’Exploitation : ${fields.recommendationsLessons}`
            ],
            table: raidTable
          },
          {
            heading: '6. CADRE LOGIQUE SYNTHÉTIQUE DE RÉFÉRENCE (NORME 4x4)',
            table: logframeTable
          }
        ]
      }
    ];
  }

  // ----------------------------------------------------------------------------
  // DOC 9 : GRILLE / MATRICE D'ÉVALUATION OCDE/CAD & UNEG (CATÉGORIE B — 5 PAGES)
  // ----------------------------------------------------------------------------
  if (docType === 'grille_evaluation') {
    const relevanceScore = 5;
    const coherenceScore = 4;
    const effectivenessScore = progressPct >= 80 ? 5 : progressPct >= 55 ? 4 : progressPct >= 30 ? 3 : 2;
    const efficiencyScore = blockedTasks === 0 ? 4 : blockedTasks <= 2 ? 3 : 2;
    const impactScore = progressPct >= 50 ? 4 : 3;
    const sustainabilityScore = 4;
    const weightedAvg = (
      relevanceScore * 0.15 +
      coherenceScore * 0.10 +
      effectivenessScore * 0.25 +
      efficiencyScore * 0.20 +
      impactScore * 0.15 +
      sustainabilityScore * 0.15
    ).toFixed(2);

    const oecdMatrixRows: string[][] = [
      [
        '1. PERTINENCE\n(Relevance · 15%)',
        'Q1.1 : Dans quelle mesure les objectifs de l’intervention répondent-ils aux besoins prioritaires des bénéficiaires et aux stratégies nationales/ODD ?',
        '• Degré d’alignement stratégique ;\n• Taux d’adéquation aux besoins cibles.',
        `Baseline : Diagnostic ${dossier.psdYear}\nCible : 100% des axes alignés.`,
        '• ProDoc & Cadre Logique ;\n• Rapports nationaux & ODD.',
        '• Revue documentaire ;\n• Entretiens clés (KII).'
      ],
      [
        '2. COHÉRENCE\n(Coherence · 10%)',
        'Q2.1 : Quelle est la cohérence interne entre les axes/projets et la cohérence externe avec les interventions des autres partenaires (PTF) ?',
        '• Synergies inter-projets actives ;\n• Absence de chevauchement.',
        `Baseline : ${(dossier.axes || []).length} Axe(s) / ${pertSummaries.length} Projet(s)\nCible : 100% intégré.`,
        '• Matrices WBS et RACI ;\n• PV de coordination PTF.',
        '• Analyse structurelle WBS ;\n• Focus groups techniques.'
      ],
      [
        '3. EFFICACITÉ\n(Effectiveness · 25%)',
        'Q3.1 : Dans quelle mesure les extrants (livrables) et les effets directs attendus ont-ils été atteints dans les délais prévus ?',
        '• Taux de réalisation physique ;\n• % de jalons critiques validés.',
        `Actuel : ${progressPct}% (${completedTasks}/${totalTasks})\nCible finale : >= 95%.`,
        '• Rapports CAP ;\n• Bordereaux de réception.',
        '• Audit physique des livrables ;\n• Analyse des écarts Début/Fin.'
      ],
      [
        '4. EFFICIENCE\n(Efficiency · 20%)',
        'Q4.1 : Les ressources financières, humaines et temporelles ont-elles été converties de manière optimale en résultats (coût-efficacité) ?',
        `• Absorption budgétaire (${currency}) ;\n• Respect du chemin critique (${maxProjectDuration}j).`,
        `Budget : ${budgetGlobalFormatted}\nEngagé : ${financialExecutionPct}% (${committedBudgetFormatted}).`,
        '• Suivi PTBA & états financiers ;\n• Réseau PERT/CPM.',
        '• Analyse Coût-Efficacité ;\n• Audit des marges PERT.'
      ],
      [
        '5. IMPACT\n(Impact · 15%)',
        'Q5.1 : Quels sont les changements durables, positifs ou négatifs, directs ou indirects, générés sur l’écosystème et les bénéficiaires ?',
        '• Indice de transformation ;\n• Bénéficiaires durablement touchés.',
        `Horizon : ${dossier.horizonPlan}\nCible : Impact systémique vérifié.`,
        '• Enquêtes Baseline / Endline ;\n• Études de cas terrain.',
        '• Méthodes mixtes & Outcome Harvesting.'
      ],
      [
        '6. DURABILITÉ\n(Sustainability · 15%)',
        'Q6.1 : Les bénéfices et acquis se maintiendront-ils après la clôture du financement externe (viabilité financière, institutionnelle, technique) ?',
        '• Taux d’appropriation interne ;\n• Mécanisme de pérennisation actif.',
        'Cible : 100% des livrables transférés avec plan de continuité.',
        '• PV de transfert d’acquis ;\n• Manuels et budgets internes.',
        '• Audit institutionnel ;\n• Entretiens avec les bénéficiaires.'
      ]
    ];

    return [
      {
        pageTitle: `PAGE 1 — GRILLE & MATRICE D’ÉVALUATION INSTITUTIONNELLE (OCDE/CAD & UNEG)`,
        pageSubtitle: `Protocole Catégorie B (Page 1/5) · Page de Garde Condensée & Fiche Signalétique de l’Évaluation`,
        sections: [
          {
            heading: 'CHARTE OFFICIELLE DE LA GRILLE D’ÉVALUATION (STANDARDS UNEG / OCDE-CAD / GEROS)',
            coverChart: coverChartBlock
          },
          {
            heading: 'FICHE SIGNALÉTIQUE DE LA MISSION D’ÉVALUATION',
            keyValueRows: ficheSignaletiqueKeyValues
          }
        ]
      },
      {
        pageTitle: `PAGE 2 — MÉTHODOLOGIE DE NOTATION (ÉCHELLE 1 À 5) & RÈGLE DE TRIANGULATION`,
        pageSubtitle: `Protocole Catégorie B (Page 2/5) · Section 1 · Barème Normatif International, Pondération et Preuves`,
        sections: [
          {
            heading: '1. NOTE MÉTHODOLOGIQUE D’UTILISATION DE LA GRILLE ET ÉCHELLE DE NOTATION (1 À 5)',
            paragraphs: [
              `1.1 Objectif et Articulation avec la Théorie du Changement : ${fields.contextJustification}`,
              `1.2 Structuration des Questions Évaluatives : ${fields.specificObjectives}`,
              `1.3 Formule de Calcul du Score Global Pondéré : Score Global = (Pertinence × 15%) + (Cohérence × 10%) + (Efficacité × 25%) + (Efficience × 20%) + (Impact × 15%) + (Durabilité × 15%).`
            ],
            table: {
              headers: [
                'Score (12%)',
                'Qualification Normative (22%)',
                'Critère de Jugement Objectif (Standards UNEG / GEROS / BM) (44%)',
                'Seuil Décisionnel (22%)'
              ],
              columnWidths: [12, 22, 44, 22],
              rows: [
                ['5 / 5', 'Très Satisfaisant (Excellent)', 'Atteint ou dépasse 100% des cibles SMART sans aucune lacune opérationnelle ni dépassement.', 'Capitalisation & Modélisation'],
                ['4 / 5', 'Satisfaisant (Bon)', 'Atteint 80% à 99% des cibles avec des écarts mineurs n’affectant pas le chemin critique PERT.', 'Poursuite & Consolidation'],
                ['3 / 5', 'Moyennement Satisfaisant', 'Atteint 50% à 79% des cibles ; retards ou blocages modérés nécessitant des mesures correctives.', 'Plan de Rattrapage Requis'],
                ['2 / 5', 'Insatisfaisant (Faible)', 'Moins de 50% des cibles ; glissements majeurs sur le chemin critique ou sous-absorption sévère.', 'Réorientation Immédiate COPIL'],
                ['1 / 5', 'Très Insatisfaisant (Critique)', 'Échec opérationnel ou blocage systémique compromettant l’atteinte des effets du programme.', 'Suspension / Restructuration']
              ]
            }
          }
        ]
      },
      {
        pageTitle: `PAGE 3 — MATRICE MAÎTRESSE D’ÉVALUATION CROISANT LES 6 CRITÈRES OCDE/CAD (MATRICE M6)`,
        pageSubtitle: `Protocole Catégorie B (Page 3/5) · Section 2 · Questions Évaluatives, Indicateurs SMART, Triangulation & Scores`,
        sections: [
          {
            heading: '2. MATRICE COMPLÈTE D’ÉVALUATION SELON LES 6 CRITÈRES DU RÉSEAU OCDE/CAD (MATRICE M6)',
            table: m6Table
          }
        ]
      },
      {
        pageTitle: `PAGE 4 — CADRE LOGIQUE DE RÉFÉRENCE (M1) & SYNTHÈSE DES SCORES PONDÉRÉS`,
        pageSubtitle: `Protocole Catégorie B (Page 4/5) · Sections 3 & 4 · Chaîne de Résultats GAR et Notation Globale`,
        sections: [
          {
            heading: '3. GRILLE D’APPRÉCIATION CHIFFRÉE ET SCORE PONDÉRÉ DU PORTEFEUILLE ACTIF',
            paragraphs: [`3.1 Règles de Pondération et Seuils d’Alerte : ${fields.recommendationsLessons}`],
            table: {
              headers: [
                'Critère OCDE/CAD (16%)',
                'Poids (10%)',
                'Score (14%)',
                'Appréciation Normative (20%)',
                'Justification Factuelle & Preuves Issues du Dossier Actif (40%)'
              ],
              columnWidths: [16, 10, 14, 20, 40],
              rows: [
                ['1. Pertinence', '15%', `${relevanceScore} / 5`, 'Très Satisfaisant', `Alignement stratégique complet des ${(dossier.axes || []).length} axe(s) avec les priorités institutionnelles.`],
                ['2. Cohérence', '10%', `${coherenceScore} / 5`, 'Satisfaisant', `Articulation logique vérifiée entre ${pertSummaries.length} projet(s) et dépendances PERT modélisées.`],
                ['3. Efficacité', '25%', `${effectivenessScore} / 5`, effectivenessScore >= 4 ? 'Satisfaisant' : 'Moyennement Satisfaisant', `Taux d’achèvement physique de ${progressPct}% (${completedTasks} terminées, ${inProgressTasks} en cours sur ${totalTasks}).`],
                ['4. Efficience', '20%', `${efficiencyScore} / 5`, efficiencyScore >= 4 ? 'Satisfaisant' : 'Sous Vigilance', `Budget total de ${budgetGlobalFormatted} (${financialExecutionPct}% engagé soit ${committedBudgetFormatted}) ; ${blockedTasks} tâche(s) bloquée(s).`],
                ['5. Impact', '15%', `${impactScore} / 5`, 'Satisfaisant / En cours', `Effets structurants attendus sur l’horizon ${dossier.horizonPlan} (${dossier.horizonYears} ans).`],
                ['6. Durabilité', '15%', `${sustainabilityScore} / 5`, 'Satisfaisant', `Responsabilités RACI formalisées et livrables documentés pour l’appropriation interne.`],
                ['SCORE GLOBAL PONDÉRÉ', '100%', `${weightedAvg} / 5.00`, Number(weightedAvg) >= 4 ? 'PERFORMANCE SATISFAISANTE' : 'SOUS SURVEILLANCE ACTIVE', `Synthèse évaluative consolidée au ${dateStr}.`]
              ]
            }
          },
          {
            heading: '4. CADRE LOGIQUE ET CHAÎNE DE RÉSULTATS AUDITÉE (MATRICE M1)',
            table: m1Table
          }
        ]
      },
      {
        pageTitle: `PAGE 5 — TRIANGULATION, BIAIS & RISQUES RAID (M7), PARTIES PRENANTES (M4) & VALIDATION`,
        pageSubtitle: `Protocole Catégorie B (Page 5/5) · Section 5 · Conformité Éthique UNEG, Acteurs Consultés & Signatures`,
        isSignaturePage: true,
        orgStampDataUrl: fields.orgStampDataUrl,
        partnerStampDataUrl: fields.partnerStampDataUrl,
        sections: [
          {
            heading: '5. REGISTRE DES RISQUES ET BIAIS MÉTHODOLOGIQUES DE L’ÉVALUATION (MATRICE M7)',
            paragraphs: [
              `5.1 Triangulation Systématique : ${fields.methodologyApproach}`,
              `5.2 Gouvernance du Groupe de Référence (GRE) : ${fields.governanceModalities}`,
              `5.3 Conformité Déontologique et Éthique UNEG : ${fields.confidentialityClauses}`
            ],
            table: m7Table
          },
          {
            heading: '6. MATRICE DES PARTIES PRENANTES INTERROGÉES ET CIBLES D’ENQUÊTE (MATRICE M4)',
            table: m4Table
          }
        ]
      }
    ];
  }

  // ============================================================================
  // CATÉGORIE C : RAPPORTS LOURDS INSTITUTIONNELS (10 PAGES A4)
  // (cadrage, demarrage, cap, mi_parcours, rapport_final)
  // Pages Liminaires 1 à 6 + Corps Spécifique Pages 7 à 9 + Annexes Page 10
  // ============================================================================

  const getCategoryCTocRows = (): string[][] => {
    switch (docType) {
      case 'cadrage':
        return [
          ['1.', 'Introduction, Diagnostic Initial et Analyse de la Problématique', '1.1 Rappel du mandat ; 1.2 Arbre à problèmes ; 1.3 Alignement stratégique', 'Page 7'],
          ['2.', 'Reconstitution de la Théorie du Changement (TdC) et Chaîne GAR', '2.1 Modèle causal Intrants -> Activités -> Extrants -> Effets -> Impact', 'Page 7'],
          ['3.', 'Périmètre Théorique vs Réel, Évaluabilité et Structure WBS / PTBA', '3.1 Analyse de faisabilité ; 3.2 Découpage analytique WBS et budget Baseline', 'Page 7'],
          ['4.', 'Architecture de Gouvernance, Organigramme et Matrice RACI', '4.1 Rôle du COPIL et de l’UGP ; 4.2 Matrice RACI complète par activité', 'Page 8'],
          ['5.', 'Procédures Fiduciaires, Passation des Marchés et Assurance Qualité', '5.1 Circuit d’engagement financier ; 5.2 Contrôle qualité des livrables', 'Page 8'],
          ['6.', 'Modélisation du Réseau PERT/CPM, Chemin Critique et Marges', '6.1 Calcul ES/EF/LS/LF ; 6.2 Sécurisation des tâches à marge nulle', 'Page 9'],
          ['7.', 'Baseline du Suivi Opérationnel et Conditions Préalables au Lancement', '7.1 État initial des activités ; 7.2 Prérequis techniques et institutionnels', 'Page 9'],
          ['8.', 'Annexes Obligatoires : Cadre Logique 4x4, Board RAID & Approbation', '8.1 Matrice du Cadre Logique ; 8.2 Registre des risques RAID ; 8.3 Signatures', 'Page 10']
        ];
      case 'demarrage':
        return [
          ['1.', 'Rappel du Contexte et Bilan de la Phase de Mobilisation (Kick-Off)', '1.1 Installation de l’équipe ; 1.2 Disponibilité des locaux et ressources', 'Page 7'],
          ['2.', 'Conclusions de la Revue Documentaire Initiale et Ajustements', '2.1 Analyse critique de la base documentaire ; 2.2 Ajustements retenus', 'Page 7'],
          ['3.', 'Validation Définitive des Outils de Collecte et Plan de Déploiement', '3.1 Instruments quantitatifs et qualitatifs ; 3.2 Planification WBS/PTBA', 'Page 7'],
          ['4.', 'Dispositif de Gouvernance Opérationnelle et Matrice RACI de Démarrage', '4.1 Coordination terrain ; 4.2 Attribution des rôles R-A-C-I par tâche', 'Page 8'],
          ['5.', 'Plan de Communication, de Reporting et Sécurité des Données', '5.1 Circuit de validation des livrables ; 5.2 Protocole d’archivage', 'Page 8'],
          ['6.', 'Chronogramme d’Exécution Actualisé (Gantt/PERT) et Chemin Critique', '6.1 Séquence critique actualisée ; 6.2 Analyse des marges opérationnelles', 'Page 9'],
          ['7.', 'Point d’Exécution Initial et Plan d’Urgence (Contingency Plan)', '7.1 Suivi des premières tâches ; 7.2 Levée des contraintes de démarrage', 'Page 9'],
          ['8.', 'Annexes Obligatoires : Cadre Logique 4x4, Board RAID & Signatures', '8.1 Cadre de résultats ; 8.2 Risques initiaux RAID ; 8.3 PV de lancement', 'Page 10']
        ];
      case 'cap':
        return [
          ['1.', 'Constatations Factuelles sur l’Exécution Physique et Calendaire', '1.1 Faits saillants de la période ; 1.2 Bilan des livrables réceptionnés', 'Page 7'],
          ['2.', 'Analyse Causale des Écarts (Début/Fin) et Goulots d’Étranglement', '2.1 Diagnostic des retards ; 2.2 Impact sur la séquence critique PERT', 'Page 7'],
          ['3.', 'Suivi Détaillé du Plan de Travail et Budget Annuel (PTBA) par Activité', '3.1 Crédits alloués par phase ; 3.2 État des engagements par tâche', 'Page 7'],
          ['4.', 'Exécution Budgétaire et Financière Consolidée (PTBA vs Décaissement)', '4.1 Taux d’absorption par projet ; 4.2 Analyse de la valeur acquise', 'Page 8'],
          ['5.', 'Audit de la Gouvernance Opérationnelle et Respect de la Matrice RACI', '5.1 Réactivité des circuits d’approbation ; 5.2 Responsabilités RACI', 'Page 8'],
          ['6.', 'Analyse Dynamique du Réseau PERT/CPM et Tâches sous Tension', '6.1 État des marges libres et totales ; 6.2 Protection du chemin critique', 'Page 9'],
          ['7.', 'Prescriptions Correctives CAP et Décisions d’Arbitrage Soumises au COPIL', '7.1 Plan de rattrapage chiffré ; 7.2 Suivi individuel des écarts', 'Page 9'],
          ['8.', 'Annexes Obligatoires : Cadre Logique 4x4, Board RAID & Signatures', '8.1 Cadre de performance ; 8.2 Registre RAID actualisé ; 8.3 Visa Contrôle', 'Page 10']
        ];
      case 'mi_parcours':
        return [
          ['1.', 'Contexte de la Revue à Mi-Parcours et Rappel de la Théorie du Changement', '1.1 Justification à mi-étape ; 1.2 Validité de la logique causale TdC', 'Page 7'],
          ['2.', 'Méthodologie d’Évaluation à Mi-Parcours et Triangulation des Preuves', '2.1 Approche mixte UNEG/OCDE-CAD ; 2.2 Limites et contrôle qualité', 'Page 7'],
          ['3.', 'Analyse de la Performance selon les 6 Critères OCDE/CAD à Mi-Étape', '3.1 Pertinence & Cohérence ; 3.2 Efficacité, Efficience, Impact & Viabilité', 'Page 7'],
          ['4.', 'Audit de la Gouvernance RACI, de la Gestion Fiduciaire et du Système S&E', '4.1 Performance du pilotage ; 4.2 Matrice RACI et exécution budgétaire', 'Page 8'],
          ['5.', 'Vérification des Livrables Produits à Mi-Parcours et Rythme de Décaissement', '5.1 État des livrables par projet ; 5.2 Analyse Coût-Efficacité', 'Page 8'],
          ['6.', 'Analyse du Chemin Critique Résiduel (PERT/CPM) pour la Seconde Moitié', '6.1 Marges disponibles ; 6.2 Réaménagement calendaire des phases', 'Page 9'],
          ['7.', 'Leçons Apprises et Plan d’Action de Réorientation (Réponse Managériale)', '7.1 Recommandations priorisées ; 7.2 Suivi des écarts à résorber', 'Page 9'],
          ['8.', 'Annexes Obligatoires : Cadre Logique Révisé, Board RAID & Signatures', '8.1 Cadre Logique 4x4 ; 8.2 Risques de 2nde phase ; 8.3 Approbation MTR', 'Page 10']
        ];
      default: // rapport_final
        return [
          ['1.', 'Synthèse Rétrospective du Projet et Historique de la Logique d’Intervention', '1.1 Genèse et évolutions ; 1.2 Rappel de la Théorie du Changement', 'Page 7'],
          ['2.', 'Méthodologie de l’Évaluation Finale (ICR / Terminal Evaluation)', '2.1 Triangulation sommative UNEG ; 2.2 Fiabilité des données de clôture', 'Page 7'],
          ['3.', 'Bilan Définitif par Critère OCDE/CAD (Pertinence, Cohérence, Efficacité, Efficience)', '3.1 Notation finale 1 à 5 ; 3.2 Comparaison finale Prévu vs Réalisé', 'Page 7'],
          ['4.', 'Bilan Financier Définitif, Clôture du PTBA et Audit Fiduciaire', '4.1 Exécution budgétaire finale par projet ; 4.2 Coût-efficacité global', 'Page 8'],
          ['5.', 'Analyse des Impacts à Long Terme, Durabilité et Stratégie de Sortie', '5.1 Changements systémiques ; 5.2 Passation des acquis et RACI de transfert', 'Page 8'],
          ['6.', 'Bilan Rétrospectif de l’Ordonnancement PERT/CPM et des Livrables Réceptionnés', '6.1 Performance calendaire finale ; 6.2 Inventaire des livrables validés', 'Page 9'],
          ['7.', 'Capitalisation des Bonnes Pratiques, Leçons Apprises et Recommandations', '7.1 Enseignements stratégiques ; 7.2 Clôture des écarts opérationnels', 'Page 9'],
          ['8.', 'Annexes Obligatoires : Cadre Logique Final, Board RAID & Quitus Définitif', '8.1 Bilan du Cadre Logique 4x4 ; 8.2 Risques résiduels ; 8.3 Quitus signé', 'Page 10']
        ];
    }
  };

  // PAGE 1 (CATÉGORIE C) : PAGE DE GARDE OFFICIELLE
  const page1CoverC: StructuredA4Page = {
    pageTitle: `PAGE 1 — PAGE DE GARDE OFFICIELLE`,
    pageSubtitle: `Protocole Catégorie C · ${cfg.officialTitle} · Réf. ${fields.referenceCode}`,
    sections: [
      {
        heading: 'CHARTE OFFICIELLE DE PAGE DE GARDE (STANDARDS INTERNATIONAUX PNUD / BM / UE / ISO 21500)',
        coverChart: coverChartBlock
      },
      {
        heading: 'CARTOUCHE D’IDENTIFICATION INSTITUTIONNELLE DU PORTEFEUILLE',
        keyValueRows: [
          ['Intitulé Officiel de l’Intervention', nomDuProjet],
          ['Type de Document & Catégorie Normative', `${cfg.selectLabel} — Protocole Institutionnel Complet (Catégorie C)`],
          ['Code / Référence Documentaire', fields.referenceCode || 'REF-FAAB-2026'],
          ['Organisation Commanditaire / Agence d’Exécution', organisationCommanditaire],
          ['Bailleur(s) de Fonds / Partenaire(s) Cible(s)', bailleurDeFonds],
          ['Autorité / Expert Signataire', `${userProfile.fullName} — ${userProfile.role} (${userProfile.email})`],
          ['Budget Global Consolidé', `${budgetGlobalFormatted} (${totalTasks} activités & jalons sur ${(dossier.axes || []).length} axe(s))`],
          ['Référentiels Normatifs Appliqués', cfg.normativeReference]
        ]
      }
    ]
  };

  // PAGE 2 (CATÉGORIE C) : FICHE SIGNALÉTIQUE & CONTRÔLE DU CYCLE DE VIE
  const page2ControlC: StructuredA4Page = {
    pageTitle: `PAGE 2 — FICHE SIGNALÉTIQUE & CONTRÔLE DU DOCUMENT`,
    pageSubtitle: `Cycle de Vie Documentaire, Historique des Révisions & Paramètres Dynamiques · ${fields.referenceCode}`,
    sections: [
      {
        heading: '2.1 FICHE SIGNALÉTIQUE DES VARIABLES STRUCTURANTES DU PROJET',
        keyValueRows: ficheSignaletiqueKeyValues
      },
      {
        heading: '2.2 CYCLE DE VIE DU DOCUMENT, AUTEURS, VALIDATEURS & HISTORIQUE DES RÉVISIONS',
        table: {
          headers: [
            'Version (12%)',
            'Date (14%)',
            'Auteur / Rédacteur (22%)',
            'Instance de Validation (24%)',
            'Statut & Modifications Majeures (28%)'
          ],
          columnWidths: [12, 14, 22, 24, 28],
          rows: [
            [
              'v0.1 (Draft)',
              todayISO,
              `${userProfile.fullName} (${userProfile.role})`,
              'Cellule Technique PMO & Suivi-Évaluation (S&E)',
              'Initialisation de la structure normative et extraction de la base de données.'
            ],
            [
              'v0.9 (Revue)',
              todayISO,
              `${userProfile.fullName} & Équipe Projet`,
              `Groupe de Référence / ${fields.recipientOrg || 'Comité Technique'}`,
              'Intégration des calculs PERT/CPM, de la matrice RACI et du Cadre Logique 4x4.'
            ],
            [
              'v1.0 (Final)',
              dateStr,
              `${userProfile.fullName} (${organisationCommanditaire})`,
              `Comité de Pilotage (COPIL) / ${fields.recipientRepresentative || 'Autorité Compétente'}`,
              'Version officielle consolidée et approuvée pour diffusion et exécution.'
            ]
          ]
        }
      },
      {
        heading: '2.3 LISTE DE DIFFUSION & CONTRÔLE D’ASSURANCE QUALITÉ',
        paragraphs: [
          `Le présent rapport institutionnel (Réf. ${fields.referenceCode}) est établi conformément aux standards ${cfg.normativeReference}. Toute révision de la ligne de référence (Baseline calendaire, budgétaire ou périmètre WBS) fait l’objet d’une traçabilité stricte approuvée en Comité de Pilotage.`
        ]
      }
    ]
  };

  // PAGE 3 (CATÉGORIE C) : SOMMAIRE & TABLE DES MATIÈRES HIÉRARCHISÉE
  const page3TocC: StructuredA4Page = {
    pageTitle: `PAGE 3 — SOMMAIRE & TABLE DES MATIÈRES HIÉRARCHISÉE`,
    pageSubtitle: `Architecture Documentaire Normée (1., 1.1., 1.1.1.) · ${cfg.officialTitle}`,
    sections: [
      {
        heading: '3.1 PROTOCOLE DES PAGES LIMINAIRES OBLIGATOIRES (CATÉGORIE C)',
        table: {
          headers: ['Page (12%)', 'Intitulé de la Page Liminaire (34%)', 'Contenu Normatif & Standards Appliqués (42%)', 'Folio (12%)'],
          columnWidths: [12, 34, 42, 12],
          rows: [
            ['PAGE 1', 'Page de Garde Officielle', 'Charte d’emplacement des logos, bannière, titre, code projet, structure, zone et statut.', 'Page 1'],
            ['PAGE 2', 'Fiche Signalétique & Contrôle des Révisions', 'Variables clés du projet, cycle de vie documentaire, auteurs, validateurs et versions.', 'Page 2'],
            ['PAGE 3', 'Sommaire / Table des Matières Hiérarchisée', 'Plan directeur du rapport avec numérotation hiérarchique (1., 1.1, 1.1.1...).', 'Page 3'],
            ['PAGE 4', 'Liste des Tableaux & Liste des Figures / Graphiques', 'Répertoire exhaustif des matrices analytiques et des visualisations du rapport.', 'Page 4'],
            ['PAGE 5', 'Liste Officielle des Sigles et Acronymes', 'Glossaire normatif international (GAR, OCDE/CAD, UNEG, PMBOK, PERT/CPM, WBS, RACI, RAID).', 'Page 5'],
            ['PAGE 6', 'Résumé Exécutif / Note de Synthèse Décisionnelle', 'Synthèse managériale pour décideurs, tableau de bord KPIs et alertes prioritaires.', 'Page 6']
          ]
        }
      },
      {
        heading: `3.2 CORPS DU RAPPORT & ANNEXES — PROTOCOLE SPÉCIFIQUE (${cfg.officialTitle})`,
        table: {
          headers: ['N° (8%)', 'Intitulé de la Section Thématique (40%)', 'Sous-sections Hiérarchiques (40%)', 'Folio (12%)'],
          columnWidths: [8, 40, 40, 12],
          rows: getCategoryCTocRows()
        }
      }
    ]
  };

  // PAGE 4 (CATÉGORIE C) : LISTE DES TABLEAUX & LISTE DES FIGURES / GRAPHIQUES
  const page4ListsC: StructuredA4Page = {
    pageTitle: `PAGE 4 — LISTE DES TABLEAUX & LISTE DES FIGURES`,
    pageSubtitle: `Répertoire des Matrices Fermées (avec Ratios de Colonnes) & Schémas Analytiques`,
    sections: [
      {
        heading: '4.1 LISTE OFFICIELLE DES TABLEAUX ET MATRICES DU RAPPORT',
        table: {
          headers: ['Réf. (14%)', 'Intitulé Complet du Tableau / Matrice (46%)', 'Source / Méthode (26%)', 'Emplacement (14%)'],
          columnWidths: [14, 46, 26, 14],
          rows: [
            ['Tableau 1', 'Fiche Signalétique & Historique du Cycle de Vie Documentaire', 'Métadonnées PMO & Contrôle Qualité', 'Page 2'],
            ['Tableau 2', 'Tableau de Bord Exécutif Consolidé par Axe et Projet Opérationnel', 'Consolidation GAR & Kanban', 'Page 6'],
            ['Tableau 3', 'Matrice des Goulots d’Étranglement et Alertes d’Écarts Calendaires', 'Module Suivi & Tableau de Bord', 'Page 6'],
            ['Tableau 4', 'Planification Analytique WBS, PTBA et Allocation Budgétaire par Activité', 'Onglet Planification & PTBA', 'Page 7'],
            ['Tableau 5', 'Exécution Financière Consolidée (Budget Initial vs Décaissement & Solde)', 'Contrôle Budgétaire & Valeur Acquise', 'Page 8'],
            ['Tableau 6', 'Matrice des Responsabilités Opérationnelles et Décisionnelles (RACI)', 'Onglet RACI du Dossier Actif', 'Page 8'],
            ['Tableau 7', 'Ordonnancement du Réseau PERT/CPM, Dates ES/EF/LS/LF et Marges', 'Moteur Algorithmique PERT/CPM', 'Page 9'],
            ['Tableau 8', 'Suivi Individuel de l’Exécution Physique, Livrables et Écarts Début/Fin', 'Onglet Suivi des Tâches', 'Page 9'],
            ['Tableau 9', 'Matrice du Cadre Logique 4x4 (Impact, Effets, Extrants, Activités & IOV)', 'Ingénierie GAR & TdC', 'Page 10'],
            ['Tableau 10', 'Registre des Risques Stratégiques et Opérationnels (Board RAID)', 'Gestion des Risques ISO 31000', 'Page 10']
          ]
        }
      },
      {
        heading: '4.2 LISTE DES FIGURES, DIAGRAMMES & VISUALISATIONS DE RÉFÉRENCE',
        bullets: [
          'Figure 1.1 — Charte Visuelle d’Emplacement des Logos, Bannière et Cartouche Officiel (Page 1).',
          'Figure 2.1 — Diagramme de la Théorie du Changement (TdC) : Chaîne causale Intrants -> Activités -> Extrants -> Effets directs -> Impact durable (Page 7).',
          `Figure 3.1 — Graphe du Réseau PERT/CPM et Séquence du Chemin Critique (${criticalSequence}) sur une durée minimale de ${maxProjectDuration} jours ouvrés (Page 9).`,
          `Figure 4.1 — Courbe d’Exécution Financière (${financialExecutionPct}% engagé sur ${budgetGlobalFormatted}) et d’Avancement Physique (${progressPct}%) par Axe Stratégique (Page 8).`
        ],
        ...(fields.figureImageDataUrl
          ? {
              figureImage: {
                dataUrl: fields.figureImageDataUrl,
                caption: `Figure Illustrative Officielle — ${nomDuProjet} (${cfg.selectLabel})`
              }
            }
          : {})
      }
    ]
  };

  // PAGE 5 (CATÉGORIE C) : LISTE OFFICIELLE DES SIGLES ET ACRONYMES
  const page5AcronymsC: StructuredA4Page = {
    pageTitle: `PAGE 5 — LISTE OFFICIELLE DES SIGLES ET ACRONYMES`,
    pageSubtitle: `Référentiel Terminologique International (PNUD, OCDE/CAD, UNEG, PMBOK 7, ISO 21500, PERT/CPM)`,
    sections: [
      {
        heading: '5.1 TABLEAU NORMALISÉ DES SIGLES, ACRONYMES ET ABRÉVIATIONS',
        table: {
          headers: [
            'Sigle / Acronyme (18%)',
            'Signification Complète (FR / EN) (34%)',
            'Définition Opérationnelle & Normative dans le Rapport (48%)'
          ],
          columnWidths: [18, 34, 48],
          rows: INTERNATIONAL_ACRONYMS_TABLE
        }
      }
    ]
  };

  // PAGE 6 (CATÉGORIE C) : RÉSUMÉ EXÉCUTIF / NOTE DE SYNTHÈSE DÉCISIONNELLE
  const page6ExecutiveSummaryC: StructuredA4Page = {
    pageTitle: `PAGE 6 — RÉSUMÉ EXÉCUTIF / NOTE DE SYNTHÈSE DÉCISIONNELLE`,
    pageSubtitle: `Synthèse Managériale, Indicateurs Clés (KPIs), Tableau de Bord par Projet & Alertes · ${nomDuProjet}`,
    sections: [
      {
        heading: '6.1 NOTE DE SYNTHÈSE MANAGÉRIALE & VISION D’ENSEMBLE',
        paragraphs: [
          `6.1.1 Contexte et Portée : Le présent rapport (« ${cfg.officialTitle} », réf. ${fields.referenceCode}) constitue l’instrument officiel de gouvernance, de redevabilité et d’aide à la décision pour le portefeuille « ${nomDuProjet} », conduit par ${organisationCommanditaire} sous la responsabilité de ${userProfile.fullName} (${userProfile.role}) à destination de ${bailleurDeFonds}.`,
          `6.1.2 Justification et Alignement : ${fields.contextJustification}`,
          `6.1.3 Objectifs Stratégiques et Opérationnels : ${fields.specificObjectives}`
        ],
        bullets: [
          `Architecture du portefeuille (Onglet Dossiers & Projets) : ${(dossier.axes || []).length} Axe(s) stratégique(s), ${pertSummaries.length} Projet(s) opérationnel(s) et ${totalTasks} activités/jalons élémentaires.`,
          `Enveloppe financière globale programmée (Onglet Planification) : ${budgetGlobalFormatted} (Montant engagé/absorbé estimé à ${committedBudgetFormatted} soit ${financialExecutionPct}% ; Solde disponible : ${remainingBudgetFormatted}).`,
          `Répartition Kanban & Suivi (Onglets Kanban & Suivi des tâches) : ${progressPct}% de réalisation globale (${completedTasks} Terminées, ${inProgressTasks} En cours, ${blockedTasks} Bloquées, ${todoTasks} À faire ; ${delayedTasksCount} activité(s) présentant un écart calendaire).`,
          `Ordonnancement PERT/CPM (Onglet Réseau PERT) : Durée critique incompressible de ${maxProjectDuration} jours ouvrés portée par ${criticalNodes.length} activité(s) critique(s) (${criticalSequence}).`
        ]
      },
      {
        heading: '6.2 TABLEAU DE BORD EXÉCUTIF CONSOLIDÉ PAR PROJET OPÉRATIONNEL',
        table: {
          headers: [
            'Axe & Projet Opérationnel (28%)',
            'Volume (12%)',
            'Répartition des Statuts Kanban (24%)',
            'Écarts (10%)',
            'Avanc. (10%)',
            `Budget Consolidé (16%)`
          ],
          columnWidths: [28, 12, 24, 10, 10, 16],
          rightAlignCols: [5],
          rows:
            projectDashboardRows.length > 0
              ? projectDashboardRows
              : [['Aucun projet enregistré', '0', '—', '0', '0%', formatDocAmount(0, currency, lang)]]
        }
      },
      {
        heading: '6.3 GOULOTS D’ÉTRANGLEMENT, ALERTES D’ÉCARTS & ORIENTATIONS PRIORITAIRES',
        paragraphs: [
          `6.3.1 Approche Méthodologique Retenue : ${fields.methodologyApproach}`,
          `6.3.2 Décisions et Prescriptions Prioritaires : ${fields.recommendationsLessons}`
        ],
        ...(bottleneckRows.length > 0
          ? {
              table: {
                headers: [
                  'Code (9%)',
                  'Projet & Activité en Alerte (27%)',
                  'Responsable (15%)',
                  'Statut (13%)',
                  'Écarts Début / Fin (20%)',
                  `Budget Enjeu (16%)`
                ],
                columnWidths: [9, 27, 15, 13, 20, 16],
                rightAlignCols: [5],
                rows: bottleneckRows
              }
            }
          : {
              bullets: ['Aucun goulot d’étranglement ni écart calendaire critique détecté à date dans le Tableau de Bord Décisionnel.']
            })
      }
    ]
  };

  // ============================================================================
  // PAGES 7, 8 & 9 (CATÉGORIE C) : CORPS SPÉCIFIQUE SELON LE TYPE DE RAPPORT
  // ============================================================================
  const bodyPagesC: StructuredA4Page[] = [];

  if (docType === 'cap') {
    // PROTOCOLE SPÉCIFIQUE DOC 8 : RAPPORT D'AVANCEMENT PÉRIODIQUE (CAP)
    bodyPagesC.push({
      pageTitle: `PAGE 7 — CORPS DU RAPPORT CAP : CONSTATATIONS PHYSIQUES & ANALYSE DES ÉCARTS`,
      pageSubtitle: `Sections 1, 2 & 3 · Bilan Physique Périodique, Causes des Écarts & Exécution du PTBA par Activité`,
      sections: [
        {
          heading: '1. CONSTATATIONS FACTUELLES SUR L’EXÉCUTION PHYSIQUE ET CALENDAIRE DE LA PÉRIODE',
          paragraphs: [
            `1.1 Faits Saillants et Réalisations Physiques : ${fields.contextJustification}`,
            `1.2 Analyse Causale des Écarts et Goulots d’Étranglement : ${fields.specificObjectives}`
          ]
        },
        {
          heading: '2. PLANIFICATION OPÉRATIONNELLE WBS, GANTT, PERT & PTBA (MATRICE M2)',
          table: m2Table
        }
      ]
    });

    bodyPagesC.push({
      pageTitle: `PAGE 8 — CORPS DU RAPPORT CAP : EXÉCUTION FINANCIÈRE EVM (M5) & LIVRABLES QUALITÉ (M9)`,
      pageSubtitle: `Sections 4 & 5 · Tableau Financier EVM (BAC, EV, AC, CPI) & Validation des Livrables`,
      sections: [
        {
          heading: '3. EXÉCUTION BUDGÉTAIRE, FINANCIÈRE ET VALEUR ACQUISE EVM (MATRICE M5)',
          paragraphs: [
            `3.1 Analyse Financière et Taux d’Absorption : ${fields.methodologyApproach}`,
            `3.2 Conformité Fiduciaire et Pièces Justificatives : ${fields.confidentialityClauses}`
          ],
          table: m5Table
        },
        {
          heading: '4. CONTRÔLE QUALITÉ DES LIVRABLES ET CONDITIONNALITÉS DE VALIDATION (MATRICE M9)',
          paragraphs: [`4.1 Arbitrages Soumis au Comité de Pilotage : ${fields.governanceModalities}`],
          table: m9Table
        }
      ]
    });

    bodyPagesC.push({
      pageTitle: `PAGE 9 — CORPS DU RAPPORT CAP : CHEMIN CRITIQUE PERT & PRESCRIPTIONS CAP (M10)`,
      pageSubtitle: `Sections 6 & 7 · Surveillance des Marges PERT/CPM & Matrice du Plan d’Action Correctif (M10)`,
      sections: [
        {
          heading: '5. SURVEILLANCE DU RÉSEAU PERT/CPM ET DES MARGES OPÉRATIONNELLES',
          table: {
            headers: [
              'Code (9%)',
              'Activité / Jalon (27%)',
              'Dépendances (14%)',
              'Dates PERT Tôt/Tard (18%)',
              'Criticité & Marges (18%)',
              'Statut & Durée (14%)'
            ],
            columnWidths: [9, 27, 14, 18, 18, 14],
            rows: ganttPertRows.length > 0 ? ganttPertRows : [['—', 'Aucune activité', '—', '—', '—', '0j']]
          }
        },
        {
          heading: '6. PRESCRIPTIONS OPÉRATIONNELLES CAP & RÉPONSE MANAGÉRIALE (MATRICE M10)',
          paragraphs: [`6.1 Prescriptions Opérationnelles Chiffrées : ${fields.recommendationsLessons}`],
          table: m10Table
        }
      ]
    });
  } else if (docType === 'mi_parcours' || docType === 'rapport_final') {
    // PROTOCOLE SPÉCIFIQUE DOCS 8 & 11 : ÉVALUATION À MI-PARCOURS (MTR) & ÉVALUATION FINALE (ICR)
    const isFinal = docType === 'rapport_final';

    bodyPagesC.push({
      pageTitle: `PAGE 7 — CORPS DE L’ÉVALUATION : GRILLE DES 6 CRITÈRES OCDE/CAD (M6) & WBS (M2)`,
      pageSubtitle: `Sections 1, 2 & 3 · Contexte, Méthodologie UNEG, Matrice OCDE/CAD (M6) et Bilan Physique (M2)`,
      sections: [
        {
          heading: `1. CONTEXTE, PORTÉE ET LOGIQUE D’INTERVENTION (${isFinal ? 'ÉVALUATION FINALE ICR' : 'REVUE À MI-PARCOURS MTR'})`,
          paragraphs: [
            `1.1 Rappel de la Logique d’Intervention (TdC) : ${fields.contextJustification}`,
            `1.2 Constats Évaluatifs Majeurs : ${fields.specificObjectives}`
          ]
        },
        {
          heading: '2. GRILLE D’ÉVALUATION INTERNATIONALE SELON LES 6 CRITÈRES OCDE/CAD & UNEG (MATRICE M6)',
          table: m6Table
        },
        {
          heading: '3. BILAN D’EXÉCUTION PHYSIQUE WBS, JALONS & AVANCEMENT (MATRICE M2)',
          table: m2Table
        }
      ]
    });

    bodyPagesC.push({
      pageTitle: `PAGE 8 — CORPS DE L’ÉVALUATION : BILAN FINANCIER EVM (M5), MARCHÉS PPM (M8) & LIVRABLES (M9)`,
      pageSubtitle: `Sections 4 & 5 · Analyse Coût-Efficacité EVM, Passation des Marchés & Réception des Livrables`,
      sections: [
        {
          heading: '4. ANALYSE DE L’EFFICIENCE FINANCIÈRE ET VALEUR ACQUISE EVM (MATRICE M5)',
          paragraphs: [
            `4.1 Analyse Coût-Efficacité et Viabilité : ${fields.methodologyApproach}`,
            `4.2 Gouvernance Institutionnelle et Passation : ${fields.governanceModalities}`
          ],
          table: m5Table
        },
        {
          heading: '5. EXÉCUTION DU PLAN DE PASSATION DES MARCHÉS (MATRICE M8) & LIVRABLES VALIDÉS (MATRICE M9)',
          table: m8Table
        },
        {
          heading: '5 BIS. INVENTAIRE DES LIVRABLES CONTRACTUELS ET ASSURANCE QUALITÉ (MATRICE M9)',
          table: m9Table
        }
      ]
    });

    bodyPagesC.push({
      pageTitle: `PAGE 9 — CORPS DE L’ÉVALUATION : PARTIES PRENANTES (M4) & RÉPONSE MANAGÉRIALE (M10)`,
      pageSubtitle: `Sections 6 & 7 · Engagement des Parties Prenantes, Leçons Apprises & Matrice de Réponse Managériale`,
      sections: [
        ...(isFinal
          ? [
              {
                heading: '6. BILAN D’ENGAGEMENT DES PARTIES PRENANTES ET APPROPRIATION (MATRICE M4)',
                table: m4Table
              }
            ]
          : [
              {
                heading: '6. AUDIT DU CHEMIN CRITIQUE PERT/CPM ET DES MARGES OPÉRATIONNELLES',
                table: {
                  headers: [
                    'Code (9%)',
                    'Activité / Jalon (27%)',
                    'Dépendances (14%)',
                    'Dates PERT Tôt/Tard (18%)',
                    'Criticité & Marges (18%)',
                    'Statut & Durée (14%)'
                  ],
                  columnWidths: [9, 27, 14, 18, 18, 14],
                  rows: ganttPertRows.length > 0 ? ganttPertRows : [['—', 'Aucune activité', '—', '—', '—', '0j']]
                }
              }
            ]),
        {
          heading: '7. CAPITALISATION DES LEÇONS APPRISES ET MATRICE DE RÉPONSE MANAGÉRIALE (MATRICE M10)',
          paragraphs: [
            `7.1 Enseignements Tirés et Facteurs Explicatifs : ${fields.confidentialityClauses}`,
            `7.2 Plan d’Action des Recommandations : ${fields.recommendationsLessons}`
          ],
          table: m10Table
        }
      ]
    });
  } else {
    // PROTOCOLE SPÉCIFIQUE DOCS 5 & 6 : RAPPORT DE CADRAGE / PRODOC (`cadrage`) & RAPPORT DE DÉMARRAGE (`demarrage`)
    bodyPagesC.push({
      pageTitle: `PAGE 7 — CORPS DU RAPPORT : CADRAGE STRATÉGIQUE, TdC, WBS (M2) & BUDGET EVM (M5)`,
      pageSubtitle: `Sections 1, 2 & 3 · Contexte, Théorie du Changement (TdC), Planification WBS (M2) et Budget PTBA (M5)`,
      sections: [
        {
          heading: '1. DIAGNOSTIC INITIAL, CONTEXTE STRATÉGIQUE ET THÉORIE DU CHANGEMENT (TdC)',
          paragraphs: [
            `1.1 Diagnostic et Justification : ${fields.contextJustification}`,
            `1.2 Objectifs et Chaîne de Résultats (GAR) : ${fields.specificObjectives}`,
            `1.3 Hypothèse Causale (Théorie du Changement) : Si l’enveloppe budgétaire de ${budgetGlobalFormatted} et les équipes techniques sont mobilisées selon l’ordonnancement PERT/CPM (${maxProjectDuration} jours ouvrés), ALORS les ${totalTasks} activités et jalons livreront les extrants prévus sur les ${(dossier.axes || []).length} axe(s) stratégique(s), CE QUI générera les effets directs et l’impact durable visés à l’horizon ${dossier.horizonPlan}.`
          ]
        },
        {
          heading: '2. PLANIFICATION OPÉRATIONNELLE WBS, CHRONOGRAMME GANTT & CHEMIN CRITIQUE PERT (MATRICE M2)',
          table: m2Table
        },
        {
          heading: '3. BUDGET ANALYTIQUE PTBA & LIGNE DE RÉFÉRENCE FINANCIÈRE EVM (MATRICE M5)',
          table: m5Table
        }
      ]
    });

    bodyPagesC.push({
      pageTitle: `PAGE 8 — CORPS DU RAPPORT : GOUVERNANCE RACI & RH (M3) ET PARTIES PRENANTES (M4)`,
      pageSubtitle: `Sections 4 & 5 · Démarche en 5 Phases Normées, Matrice RACI/Experts (M3) & Parties Prenantes (M4)`,
      sections: [
        {
          heading: '4. APPROCHE MÉTHODOLOGIQUE, GOUVERNANCE RACI & RESSOURCES HUMAINES (MATRICE M3)',
          paragraphs: [
            `4.1 Approche Méthodologique et Outils : ${fields.methodologyApproach}`,
            `4.2 Gouvernance Institutionnelle (COPIL, Comité Technique, UGP) : ${fields.governanceModalities}`,
            `4.3 Conformité Fiduciaire, Éthique et Sécurité des Données : ${fields.confidentialityClauses}`
          ],
          table: m3Table
        },
        {
          heading: '5. CARTOGRAPHIE DES PARTIES PRENANTES, ENGAGEMENT & COMMUNICATION (MATRICE M4)',
          table: m4Table
        }
      ]
    });

    bodyPagesC.push({
      pageTitle: `PAGE 9 — CORPS DU RAPPORT : LIVRABLES & QUALITÉ (M9)${docType === 'cadrage' ? ' + MARCHÉS PPM (M8)' : ' + RÉSEAU PERT'}`,
      pageSubtitle: `Sections 6 & 7 · Assurance Qualité des Livrables (M9) et Passation des Marchés / Ordonnancement`,
      sections: [
        {
          heading: '6. LIVRABLES CONTRACTUELS, ASSURANCE QUALITÉ & CRITÈRES D’ACCEPTATION (MATRICE M9)',
          paragraphs: [`6.1 Prescriptions et Points de Vigilance : ${fields.recommendationsLessons}`],
          table: m9Table
        },
        ...(docType === 'cadrage'
          ? [
              {
                heading: '7. PLAN DE PASSATION DES MARCHÉS (PPM) & ACQUISITIONS LOGISTIQUES (MATRICE M8)',
                table: m8Table
              }
            ]
          : [
              {
                heading: '7. MODÉLISATION DU RÉSEAU PERT/CPM ET ANALYSE DU CHEMIN CRITIQUE',
                table: {
                  headers: [
                    'Code (9%)',
                    'Activité / Jalon (27%)',
                    'Dépendances (14%)',
                    'Dates PERT Tôt/Tard (18%)',
                    'Criticité & Marges (18%)',
                    'Statut & Durée (14%)'
                  ],
                  columnWidths: [9, 27, 14, 18, 18, 14],
                  rows: ganttPertRows.length > 0 ? ganttPertRows : [['—', 'Aucune activité', '—', '—', '—', '0j']]
                }
              }
            ])
      ]
    });
  }

  // PAGE 10 (CATÉGORIE C) : ANNEXES OBLIGATOIRES (CADRE LOGIQUE M1, RISQUES RAID M7) & APPROBATION OFFICIELLE
  const activeDocMatrixIds = DOC_TO_MATRICES_MAP[docType] || [];
  const lastPageNumC = 6 + bodyPagesC.length + 1;
  const pageAnnexesC: StructuredA4Page = {
    pageTitle: `PAGE ${lastPageNumC} — ANNEXES OBLIGATOIRES (${activeDocMatrixIds.join(', ')}) & APPROBATION OFFICIELLE`,
    pageSubtitle: `Matrice du Cadre Logique (M1), Registre des Risques Board RAID (M7) & Bloc de Signatures Officielles`,
    isSignaturePage: true,
    orgStampDataUrl: fields.orgStampDataUrl,
    partnerStampDataUrl: fields.partnerStampDataUrl,
    sections: [
      {
        heading: `ANNEXE 1 — ${getMatrixDefinition('M1').fullTitle}`,
        table: logframeTable
      },
      {
        heading: `ANNEXE 2 — ${getMatrixDefinition('M7').fullTitle}`,
        table: raidTable
      }
    ]
  };

  return [
    page1CoverC,
    page2ControlC,
    page3TocC,
    page4ListsC,
    page5AcronymsC,
    page6ExecutiveSummaryC,
    ...bodyPagesC,
    pageAnnexesC
  ];
}
