import { AppPersistedState, CustomDocsMap, Dossier, UserProfile } from './types';

const DB_NAME = 'faab_plan_strategic_idb';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';
const STATE_KEY = 'main_state';

export const defaultUserProfile: UserProfile = {
  fullName: 'KOFFIE Fabien Michael',
  email: 'fabien.frikupgeneration@gmail.com',
  phone: '00225 0748082739',
  institution: 'Direction Générale de la Stratégie & Pilotage des Projets',
  role: 'Architecte Principal & Coordonnateur du Pilotage Stratégique (PMO / GAR)'
};

export const defaultCustomDocsData: CustomDocsMap = {
  tdr: {
    referenceCode: 'TDR-FAAB-2026-001',
    recipientOrg: 'Cabinet / Équipe d’Exécution & Prestataires Techniques',
    recipientRepresentative: 'Chef de Mission / Consultant Principal',
    contextJustification: 'La présente mission s’inscrit dans le cadre de la mise en œuvre opérationnelle du portefeuille stratégique afin de garantir l’atteinte des résultats dans les délais, coûts et standards de qualité internationaux.',
    specificObjectives: '1. Structurer le cadre méthodologique et opérationnel ;\n2. Assurer le déploiement et le suivi rigoureux des livrables sur le chemin critique ;\n3. Transférer les compétences aux équipes internes.',
    methodologyApproach: 'Approche participative axée sur les résultats (GAR), ordonnancement PERT/CPM, revues périodiques de performance et validation par jalons.',
    confidentialityClauses: 'Respect strict de la confidentialité des données stratégiques, financières et opérationnelles collectées durant la mission.',
    governanceModalities: 'Comité de Pilotage mensuel et réunions techniques hebdomadaires de suivi des écarts.',
    recommendationsLessons: 'Aligner systématiquement les ressources sur les activités à marge nulle (chemin critique).',
    locationCity: 'Abidjan'
  },
  note_methodo: {
    referenceCode: 'NM-FAAB-2026-002',
    recipientOrg: 'Comité de Pilotage & Direction Générale',
    recipientRepresentative: 'Président du Comité de Pilotage',
    contextJustification: 'Définition du dispositif méthodologique de planification, d’ordonnancement PERT/CPM et de suivi-évaluation des activités du programme.',
    specificObjectives: 'Harmoniser les outils de collecte, fiabiliser le calcul des écarts de début et de fin, et sécuriser les jalons décisionnels.',
    methodologyApproach: 'Démarche en 5 phases normées (Avant-Projet, Conception, Planification, Exécution & Suivi, Clôture) couplée à l’analyse prédictive du réseau PERT.',
    confidentialityClauses: 'Diffusion restreinte aux membres accrédités de l’équipe projet et aux partenaires institutionnels.',
    governanceModalities: 'Validation méthodologique par le Comité Technique avant déploiement opérationnel.',
    recommendationsLessons: 'Mettre à jour hebdomadairement les dates d’exécution réelles dans l’onglet Suivi des tâches.',
    locationCity: 'Abidjan'
  },
  nda: {
    referenceCode: 'NDA-FAAB-2026-003',
    recipientOrg: 'Partenaire Technique / Consultant / Sous-traitant',
    recipientRepresentative: 'Représentant Légal du Partenaire',
    contextJustification: 'Protection juridique des informations sensibles, bases de données, budgets et livrables échangés dans le cadre de l’exécution du portefeuille.',
    specificObjectives: 'Prévenir toute divulgation non autorisée et encadrer l’usage exclusif des données aux fins de la mission.',
    methodologyApproach: 'Traçabilité documentaire, chiffrement des échanges et destruction ou restitution des supports en fin de contrat.',
    confidentialityClauses: 'Engagement irrévocable de non-divulgation pendant toute la durée du projet et durant cinq (5) ans après sa clôture officielle.',
    governanceModalities: 'Juridiction compétente en cas de litige et contrôle de conformité par la Direction Juridique.',
    recommendationsLessons: 'Faire signer le présent accord avant tout partage du fichier JSON ou des rapports exécutifs.',
    locationCity: 'Abidjan'
  },
  lettre_mission: {
    referenceCode: 'LM-FAAB-2026-004',
    recipientOrg: 'Équipe Projet / Responsable Désigné',
    recipientRepresentative: 'Chef de Projet Opérationnel',
    contextJustification: 'Mandat officiel conféré au responsable pour conduire, coordonner et superviser la réalisation des activités inscrites au plan.',
    specificObjectives: 'Livrer l’ensemble des activités dans le respect de l’enveloppe budgétaire allouée et du calendrier prévisionnel.',
    methodologyApproach: 'Mobilisation des équipes, arbitrage des priorités selon le réseau PERT et reporting régulier à la Direction.',
    confidentialityClauses: 'Obligation de réserve et de loyauté institutionnelle.',
    governanceModalities: 'Compte-rendu direct au Coordonnateur Général du Pilotage Stratégique.',
    recommendationsLessons: 'Signaler immédiatement tout blocage via le statut « Bloqué » pour déclencher un arbitrage rapide.',
    locationCity: 'Abidjan'
  },
  cadrage: {
    referenceCode: 'RCP-FAAB-2026-005',
    recipientOrg: 'Comité Stratégique & Bailleurs / Sponsors',
    recipientRepresentative: 'Directeur Général / Sponsor Exécutif',
    contextJustification: 'Consolidation du périmètre fonctionnel, de la macro-planification, de la matrice des responsabilités et de l’allocation budgétaire initiale.',
    specificObjectives: 'Valider la ligne de référence (Baseline) du calendrier et du budget avant le lancement des opérations.',
    methodologyApproach: 'Structuration WBS par Axes et Projets, modélisation du réseau PERT et identification préventive des goulots d’étranglement.',
    confidentialityClauses: 'Document officiel de référence interne et contractuel.',
    governanceModalities: 'Approbation formelle de la Baseline en séance plénière du Comité de Cadrage.',
    recommendationsLessons: 'Maintenir une réserve de contingence sur les tâches critiques identifiées dans le réseau PERT.',
    locationCity: 'Abidjan'
  },
  demarrage: {
    referenceCode: 'RD-FAAB-2026-006',
    recipientOrg: 'Autorité de Tutelle / Comité de Pilotage',
    recipientRepresentative: 'Secrétariat Technique du Comité',
    contextJustification: 'Constatation officielle de la mobilisation effective des ressources humaines, matérielles et financières pour le démarrage des activités.',
    specificObjectives: 'Confirmer la disponibilité des prérequis opérationnels et actualiser le calendrier initial d’exécution.',
    methodologyApproach: 'Revue de lancement (Kick-off), vérification des antécédents initiaux et lancement des premières tâches de la phase Avant-Projet.',
    confidentialityClauses: 'Usage institutionnel interne.',
    governanceModalities: 'Validation du procès-verbal de démarrage.',
    recommendationsLessons: 'Sécuriser les approvisionnements initiaux dès le premier mois pour éviter tout retard au démarrage.',
    locationCity: 'Abidjan'
  },
  cap: {
    referenceCode: 'CAP-FAAB-2026-007',
    recipientOrg: 'Direction du Suivi-Évaluation & Contrôle de Gestion',
    recipientRepresentative: 'Contrôleur Général de Gestion',
    contextJustification: 'Contrôle périodique de l’avancement physique et financier, analyse des écarts de début et de fin, et surveillance des activités bloquées.',
    specificObjectives: 'Mesurer la performance réelle par rapport aux prévisions et prescrire des actions correctives immédiates.',
    methodologyApproach: 'Audit des indicateurs GAR, calcul des glissements calendaires sur le chemin critique et réajustement dynamique via le Kanban.',
    confidentialityClauses: 'Document d’audit interne soumis au devoir de confidentialité.',
    governanceModalities: 'Revue périodique d’exécution avec les responsables d’axes et de projets.',
    recommendationsLessons: 'Débloquer en priorité les tâches critiques affichant un écart positif supérieur à 5 jours.',
    locationCity: 'Abidjan'
  },
  grille_evaluation: {
    referenceCode: 'GEV-FAAB-2026-010',
    recipientOrg: 'Comité d’Évaluation Indépendant & Partenaires Techniques et Financiers (PTF)',
    recipientRepresentative: 'Chef de Mission d’Évaluation / Expert Principal S&E (UNEG / OCDE-CAD)',
    contextJustification: 'Construction du référentiel analytique et de la matrice d’évaluation croisant les 6 critères internationaux OCDE/CAD (Pertinence, Cohérence, Efficacité, Efficience, Impact, Durabilité) avec des indicateurs SMART, des barèmes de notation (1 à 5) et une triangulation rigoureuse des sources.',
    specificObjectives: '1. Décliner les questions évaluatives principales et sous-questions par critère OCDE/CAD ;\n2. Objectiver le jugement évaluatif via une échelle de notation normée (Score 1 à 5) ;\n3. Garantir la traçabilité des preuves, des méthodes de collecte et l’analyse des risques/biais méthodologiques.',
    methodologyApproach: 'Méthodes mixtes (quantitatives et qualitatives), triangulation systématique des sources primaires et secondaires, échantillonnage stratifié et contrôle qualité conforme aux normes UNEG et GEROS.',
    confidentialityClauses: 'Respect strict des principes éthiques d’évaluation des Nations Unies (UNEG) : indépendance, impartialité, anonymat des répondants, consentement éclairé et protection des données.',
    governanceModalities: 'Validation de la grille par le Groupe de Référence de l’Évaluation (GRE) et le Comité de Pilotage avant déploiement des outils de collecte.',
    recommendationsLessons: 'Pondérer les scores d’efficacité et d’efficience en fonction de l’exécution réelle des activités situées sur le chemin critique PERT/CPM.',
    locationCity: 'Abidjan'
  },
  mi_parcours: {
    referenceCode: 'REMP-FAAB-2026-008',
    recipientOrg: 'Comité d’Évaluation & Partenaires Techniques et Financiers',
    recipientRepresentative: 'Président de la Commission d’Évaluation',
    contextJustification: 'Bilan critique à mi-parcours selon les critères internationaux OCDE/CAD : pertinence, cohérence, efficacité, efficience, impact et durabilité.',
    specificObjectives: 'Apprécier le taux de réalisation global à mi-étape et réorienter si nécessaire la trajectoire opérationnelle et budgétaire.',
    methodologyApproach: 'Analyse croisée des tableaux de planification et de suivi, évaluation du chemin critique résiduel et revue documentaire des livrables.',
    confidentialityClauses: 'Diffusion contrôlée auprès des parties prenantes accréditées.',
    governanceModalities: 'Atelier de restitution et validation des recommandations à mi-parcours.',
    recommendationsLessons: 'Réallouer les marges libres des tâches non critiques vers les activités sous tension.',
    locationCity: 'Abidjan'
  },
  rapport_final: {
    referenceCode: 'RFA-FAAB-2026-009',
    recipientOrg: 'Direction Générale, Conseil d’Administration & Partenaires',
    recipientRepresentative: 'Directeur Général / Autorité Contractante',
    contextJustification: 'Synthèse récapitulative de clôture présentant le bilan définitif des réalisations physiques, l’exécution budgétaire et la capitalisation des acquis.',
    specificObjectives: 'Documenter l’atteinte des objectifs finaux, réceptionner les livrables et capitaliser les bonnes pratiques.',
    methodologyApproach: 'Comparaison finale Prévu vs Réalisé, analyse rétrospective des écarts de début/fin et quitus opérationnel.',
    confidentialityClauses: 'Archivage institutionnel légal et propriété intellectuelle des livrables.',
    governanceModalities: 'Clôture officielle et décharge prononcée par le Comité de Pilotage.',
    recommendationsLessons: 'Pérenniser les acquis du projet et archiver la sauvegarde JSON finale ainsi que le rapport PDF officiel.',
    locationCity: 'Abidjan'
  },
  courrier_admin: {
    referenceCode: 'COUR-FAAB-2026-011',
    recipientOrg: 'Direction Générale & Partenaires Institutionnels',
    recipientRepresentative: 'Monsieur / Madame le Directeur Général',
    contextJustification: 'Transmission officielle des éléments de cadrage, de planification et d’état d’avancement du portefeuille stratégique.',
    specificObjectives: 'Madame, Monsieur,\n\nJ’ai l’honneur de vous soumettre par le présent courrier administratif les éléments consolidés relatifs au pilotage opérationnel et budgétaire de notre portefeuille de projets.',
    methodologyApproach: 'Conformément aux référentiels de gouvernance et de Gestion Axée sur les Résultats (GAR), l’ordonnancement des activités, le suivi du chemin critique PERT/CPM ainsi que la matrice des responsabilités RACI ont été rigoureusement arrêtés.',
    confidentialityClauses: 'Pièces jointes (P.J.) : 01 Dossier Technique Exécutif & État d’Avancement.\nAmpliations : Présidence du Comité de Pilotage (COPIL) / Archives PMO.',
    governanceModalities: 'À ce titre, nous sollicitons votre bienveillante approbation sur les jalons décisionnels en cours et restons à votre entière disposition pour toute séance de travail ou d’arbitrage complémentaire.',
    recommendationsLessons: 'Veuillez agréer, Madame, Monsieur, l’expression de ma haute considération et de mon profond respect institutionnel.',
    locationCity: 'Abidjan'
  },
  cv_executif: {
    referenceCode: 'CV-EXEC-FAAB-2026-012',
    locationCity: 'Abidjan, Côte d’Ivoire',
    recipientOrg: 'PNUD / Banque Mondiale / BAD / Union Européenne',
    recipientRepresentative: 'KOFFIE FABIEN MICHAEL — Directeur de Programme International & Expert Senior PMP® / S&E | Tél : 00225 0748082739 | Email : fabien.frikupgeneration@gmail.com | LinkedIn : linkedin.com/in/koffie-fabien-michael | Abidjan, Côte d’Ivoire | Nationalité : Ivoirienne',
    contextJustification: 'Directeur de Programme International et Expert Senior certifié PMP® / ISO 21500 capitalisant plus de 15 années d’expérience dans la conception, l’ordonnancement PERT/CPM, la Gestion Axée sur les Résultats (GAR) et le Suivi-Évaluation (OCDE/CAD, UNEG) de portefeuilles multisectoriels financés par les bailleurs internationaux (Banque Mondiale, BAD, PNUD, UE).',
    specificObjectives: 'Ingénierie de Projet & PMO (PMBOK 7, ISO 21500, WBS, PERT/CPM, EVM) | Suivi-Évaluation & GAR (Cadre Logique, Théorie du Changement, OCDE/CAD, UNEG) | Gouvernance, Fiduciaire & Passation des Marchés (RACI, Board RAID, PTBA, Directives BM/BAD/UE)',
    methodologyApproach: '2022–2026 : Directeur de Programme & Chef de Mission PMO — Portefeuille Stratégique FAAB PLAN (PNUD / BM / BAD) : Pilotage de 2 axes stratégiques, 100% de maîtrise du chemin critique PERT/CPM et exécution rigoureuse du PTBA.\n2018–2022 : Expert Principal en Suivi-Évaluation & GAR — Programme Régional de Modernisation & Gouvernance (UE / BAD) : Conception du dispositif S&E informatisé et réalisation des revues à mi-parcours et finales.\n2014–2018 : Coordonnateur Technique d’Unité de Gestion de Projet (UGP) — Projet d’Investissement Sectoriel (Banque Mondiale) : Coordination opérationnelle, supervision fiduciaire et renforcement des capacités nationales.',
    governanceModalities: 'Master Exécutif / Diplôme d’Ingénieur en Management de Projets Internationaux & Développement | Certifications : PMP® (PMI), ISO 21500 Lead Project Manager, Certificat International en Suivi-Évaluation (GAR / UNEG / CLEAR) & PRINCE2® Practitioner',
    confidentialityClauses: 'Langues : Français (C2 — Langue maternelle / Expert) · Anglais (C1 — Courant professionnel, négociation et rédaction de rapports bailleurs) | Logiciels & Outils S&E : FAAB PLAN, MS Project, Primavera P6, Power BI, KoboToolbox / ODK, SPSS, R, Excel Avancé (EVM)',
    recommendationsLessons: 'Disponibilité immédiate pour missions de direction de programme, d’assistance technique perlée ou résidentielle et d’évaluation indépendante.'
  },
  cv_detaille: {
    referenceCode: 'CV-AOI-FAAB-2026-013',
    locationCity: 'Abidjan, Côte d’Ivoire',
    recipientOrg: 'Banque Mondiale (Format WB Form TECH-6) / BAD / Union Européenne (EuropeAid) / PNUD / Nations Unies (P11)',
    recipientRepresentative: 'Nom & Prénoms : KOFFIE FABIEN MICHAEL | Date de naissance : 14/05/1984 | Nationalité : Ivoirienne | Résidence : Abidjan, Côte d’Ivoire | Tél : 00225 0748082739 | Email : fabien.frikupgeneration@gmail.com | Poste proposé : Chef de Mission / Directeur de Programme & Expert Principal S&E (Catégorie I)',
    contextJustification: 'Expert Senior de Catégorie I (> 15 ans d’expérience internationale) spécialisé en ingénierie de projets de développement, planification stratégique pluriannuelle, ordonnancement algorithmique PERT/CPM, contrôle budgétaire par la Valeur Acquise (EVM) et évaluations indépendantes selon les normes UNEG et les 6 critères du réseau OCDE/CAD.',
    specificObjectives: '2009–2011 : Master / DEA en Ingénierie de Projets, Économie du Développement & Planification Stratégique (Mention Très Bien).\n2005–2009 : Diplôme d’Ingénieur / Maîtrise en Sciences de Gestion, Statistique Appliquée & Systèmes d’Information.',
    methodologyApproach: 'Certifications Internationales : Project Management Professional (PMP® — PMI) · Lead Project Manager ISO 21500:2021 · Certificat Avancé en Gestion Axée sur les Résultats (GAR / PNUD) · Accréditation Évaluation des Politiques Publiques & Programmes (CLEAR / Banque Mondiale / UNEG) · Passation des Marchés FIDIC & Nouveau Cadre de Passation de la Banque Mondiale.',
    governanceModalities: 'Pays d’intervention : Côte d’Ivoire, Sénégal, Burkina Faso, Bénin, Togo, Guinée, Mali, Cameroun, RDC, Maroc.\nBailleurs pratiqués : Banque Mondiale (IDA/BIRD), Banque Africaine de Développement (BAD), Union Européenne (FED/NDICI), PNUD, UNICEF, AFD, GIZ, FIDA.',
    confidentialityClauses: 'Publications : (1) « Modélisation algorithmique du chemin critique PERT/CPM et pilotage par la Valeur Acquise (EVM) dans les projets financés par les banques multilatérales », Revue Internationale de Management Public, 2024 ; (2) « Guide méthodologique de triangulation mixte OCDE/CAD et d’assurance qualité GEROS ». Affiliations : Membre actif du Project Management Institute (PMI®), du Réseau Francophone de l’Évaluation (RFE) et de l’Association Africaine d’Évaluation (AfrEA).',
    recommendationsLessons: 'Référence 1 : Dr. Kouadio Jean-Baptiste — Directeur Général de la Planification, Ministère du Plan & du Développement | Email : dg.plan@gouv.ci | Tél : +225 27 20 00 11 22.\nRéférence 2 : Mme Aminata Touré — Spécialiste Senior en Gestion de Projets & S&E, Représentation Régionale Banque Mondiale / PNUD | Email : atoure.se@worldbank-undp.org | Tél : +221 33 859 00 00.\nRéférence 3 : M. Marc-Antoine Lefèvre — Chef de Coopération & Gouvernance, Délégation de l’Union Européenne / BAD | Email : ma.lefevre@intl-coop.eu | Tél : +32 2 299 11 11.',
    extraField1: 'Historique détaillé des missions synchronisé automatiquement avec les Projets, Livrables (M9), Budgets (M5) et Résultats (M1) du portefeuille actif.',
    extraField2: 'Français : Lu (C2 - Excellent), Écrit (C2 - Excellent), Parlé (C2 - Langue maternelle) | Anglais : Lu (C1 - Avancé), Écrit (C1 - Avancé), Parlé (C1 - Courant professionnel) | Espagnol / Portugais : Notions opérationnelles (B1).'
  },
  pv_reunion: {
    referenceCode: 'PV-COPIL-FAAB-2026-014',
    locationCity: 'Abidjan — Salle de Conférence Principale UGP & Visioconférence Hybride',
    recipientOrg: 'Comité de Pilotage Stratégique (COPIL) & Unité de Gestion du Programme (UGP)',
    recipientRepresentative: 'Type de réunion : Session Ordinaire d’Arbitrage du Comité de Pilotage (COPIL) | Horaire : 09h00 – 12h30 | Président de séance : Président du Comité de Pilotage | Secrétaire de séance (Rapporteur) : KOFFIE FABIEN MICHAEL (Coordonnateur PMO)',
    contextJustification: '1. Vérification du quorum, ouverture de la séance et adoption de l’ordre du jour ;\n2. Présentation de l’état d’avancement physique (WBS/Kanban) et du chemin critique PERT/CPM ;\n3. Examen de l’exécution budgétaire PTBA / Valeur Acquise (EVM) et revue des risques (Board RAID) ;\n4. Arbitrages sur les points de blocage, adoption des résolutions et calendrier de la prochaine séance.',
    specificObjectives: 'Les travaux se sont déroulés dans un climat constructif et rigoureux. L’Unité de Gestion a présenté le tableau de bord consolidé faisant ressortir le taux d’exécution physique, l’état des jalons critiques PERT/CPM ainsi que la situation des décaissements par projet. Les échanges ont porté sur la levée rapide des goulots d’étranglement identifiés et la sécurisation des livrables de la période.',
    methodologyApproach: 'DÉCISION N°01 : Approbation sans réserve du bilan d’exécution physique et financier présenté par le Coordonnateur PMO.\nDÉCISION N°02 : Instruction ferme de déblocage prioritaire des activités en alerte sur le chemin critique PERT/CPM sous huitaine.\nDÉCISION N°03 : Autorisation d’engagement des tranches budgétaires liées aux livrables réceptionnés et validés.',
    governanceModalities: 'Liste officielle des participants synchronisée avec la Matrice des Parties Prenantes (M4) et la Matrice RACI (M3) du portefeuille.',
    confidentialityClauses: 'Matrice des décisions et plan d’actions immédiat synchronisés avec la Matrice M10 (Plan d’Action CAP) et la Matrice M7 (Risques RAID).',
    recommendationsLessons: 'Prochaine séance du Comité de Pilotage fixée au mois prochain à 09h00. Ordre du jour prévisionnel : vérification de l’exécution des résolutions de la présente séance et revue des livrables d’étape. L’ordre du jour étant épuisé, la séance est levée à 12h30.'
  },
  tdr_simplifie: {
    referenceCode: 'TDRS-PTBA-2026-015',
    locationCity: 'Abidjan & Zones d’Intervention du Projet',
    recipientOrg: 'Unité de Gestion du Projet (UGP) & Partenaires Techniques et Financiers',
    recipientRepresentative: 'Durée : 30 Hommes-Jours (H/J) | Période souhaitée : T2–T3 2026 | Superviseur direct : KOFFIE FABIEN MICHAEL — Coordonnateur PMO & Chef de Projet',
    contextJustification: 'Dans le cadre de l’exécution du Plan de Travail et Budget Annuel (PTBA) du portefeuille actif, la présente activité opérationnelle vise à mobiliser une expertise technique ciblée afin d’accélérer la livraison des jalons inscrits sur le chemin critique PERT/CPM et de garantir la conformité qualitative des extrants.',
    specificObjectives: 'Objectif Global : Assurer la réalisation intégrale, dans les délais impartis et selon les standards internationaux (ISO 21500 / GAR), des livrables opérationnels de l’activité.\nObjectifs Spécifiques : (1) Conduire le diagnostic opérationnel et valider le protocole d’intervention ; (2) Produire les livrables techniques et animer les séances de restitution ; (3) Transférer les compétences et clôturer l’activité avec quitus technique.',
    methodologyApproach: 'Approche opérationnelle agile en 3 étapes : Phase 1 — Cadrage rapide, revue documentaire et note méthodologique (J+1 à J+5) ; Phase 2 — Déploiement opérationnel, collecte/production technique et travaux d’atelier (J+6 à J+22) ; Phase 3 — Consolidation, assurance qualité, restitution et remise des livrables finaux (J+23 à J+30).',
    governanceModalities: 'Profil requis : Expert Consultant Senior (Bac+5 minimum en Ingénierie, Gestion de Projet, Économie, Suivi-Évaluation ou discipline connexe) justifiant d’au moins 8 à 10 ans d’expérience avérée sur des missions similaires financées par les bailleurs internationaux, avec maîtrise parfaite des outils GAR et PERT/CPM.',
    confidentialityClauses: 'Modalités de paiement conditionnées à l’approbation des livrables (Matrice M9) : 20% au démarrage sur validation de la Note de cadrage (L1) ; 40% à la remise du Rapport/Livrable provisoire (L2) ; 40% au solde après validation finale et signature du PV de réception définitive (L3).',
    recommendationsLessons: 'Dossier de soumission rapide : (1) Lettre de manifestation d’intérêt datée et signée ; (2) CV détaillé actualisé de l’expert (format Doc 12 ou Doc 13) + copies des diplômes et attestations de bonne exécution ; (3) Note méthodologique succincte (3 pages max) et chronogramme ; (4) Proposition financière détaillée HT/TTC.'
  }
};

export const initialDossiers: Dossier[] = [
  {
    id: 'dossier-faab-2026-2030',
    name: 'Plan Stratégique de Développement & Transformation (2026-2030)',
    horizonPlan: '2026-2030',
    psdYear: 2026,
    horizonYears: 5,
    isReadOnly: false,
    type: 'Portefeuille Stratégique',
    institution: 'Organisation / Entreprise / Institution Publique ou Privée',
    description: 'Cadre universel de planification stratégique, d’ordonnancement PERT/CPM, de maîtrise budgétaire et de suivi opérationnel axé sur les résultats (GAR).',
    axes: [
      {
        id: 'axe-1-transfo',
        name: 'Axe 1 : Modernisation des Infrastructures & Transformation Opérationnelle',
        projects: [
          {
            id: 'proj-digital-core',
            name: 'Projet 1 : Déploiement de la Plateforme Intégrée & Digitalisation des Processus',
            tasks: [
              {
                id: 'task-dig-1',
                type: 'tache',
                phase: 'AVANT PROJET',
                name: 'Étude de cadrage architectural et audit des processus métiers existants',
                startDate: '2026-01-10',
                endDate: '2026-02-28',
                actualStartDate: '2026-01-12',
                actualEndDate: '2026-02-25',
                status: 'Terminé',
                assignee: 'Kouassi Marc',
                responsabilite: 'Architecte Urbaniste SI',
                livrable: 'Schéma directeur & Rapport d’audit',
                budget: 18500000,
                validated: true,
                antecedent: '—'
              },
              {
                id: 'task-dig-jalon-1',
                type: 'jalon',
                phase: 'AVANT PROJET',
                name: 'Validation officielle du Cahier des Charges par le Comité de Pilotage',
                startDate: '2026-03-05',
                endDate: '2026-03-05',
                actualStartDate: '2026-03-05',
                actualEndDate: '2026-03-05',
                status: 'Terminé',
                assignee: 'Direction Générale',
                responsabilite: 'Président COPIL',
                livrable: 'PV de validation signé',
                budget: 2500000,
                validated: true,
                antecedent: 'task-dig-1'
              },
              {
                id: 'task-dig-2',
                type: 'tache',
                phase: 'CONCEPTION',
                name: 'Conception détaillée des modules fonctionnels et maquettage UX/UI',
                startDate: '2026-03-10',
                endDate: '2026-05-15',
                actualStartDate: '2026-03-14',
                actualEndDate: '2026-05-18',
                status: 'Terminé',
                assignee: 'Équipe Ingénierie & Design',
                responsabilite: 'Lead Product Designer',
                livrable: 'Dossier de spécifications détaillées',
                budget: 24000000,
                validated: true,
                antecedent: 'task-dig-jalon-1'
              },
              {
                id: 'task-dig-3',
                type: 'tache',
                phase: 'PLANIFICATION',
                name: 'Acquisition des serveurs sécurisés et configuration des environnements Cloud',
                startDate: '2026-05-20',
                endDate: '2026-07-15',
                actualStartDate: '2026-05-25',
                actualEndDate: '',
                status: 'En cours',
                assignee: 'Service Infrastructures & Réseaux',
                responsabilite: 'Ingénieur DevOps Senior',
                livrable: 'Cluster Cloud Haute Disponibilité',
                budget: 42000000,
                validated: false,
                antecedent: 'task-dig-2'
              },
              {
                id: 'task-dig-4',
                type: 'tache',
                phase: 'EXÉCUTION & SUIVI',
                name: 'Intégration des API d’interopérabilité et migration des bases historiques',
                startDate: '2026-06-01',
                endDate: '2026-08-20',
                actualStartDate: '2026-06-10',
                actualEndDate: '',
                status: 'Bloqué',
                manualBlocked: true,
                assignee: 'Cellule Data & Intégration',
                responsabilite: 'Ingénieur Data',
                livrable: 'Passerelles API & Données migrées',
                budget: 31000000,
                validated: false,
                antecedent: 'task-dig-2'
              },
              {
                id: 'task-dig-5',
                type: 'tache',
                phase: 'EXÉCUTION & SUIVI',
                name: 'Tests de charge, audit de cybersécurité et recette utilisateur finale (UAT)',
                startDate: '2026-08-25',
                endDate: '2026-10-30',
                actualStartDate: '',
                actualEndDate: '',
                status: 'À faire',
                assignee: 'Cellule Qualité & Sécurité',
                responsabilite: 'Responsable QA / RSSI',
                livrable: 'Certificat d’homologation sécurité',
                budget: 19500000,
                validated: false,
                antecedent: 'task-dig-3'
              },
              {
                id: 'task-dig-jalon-2',
                type: 'jalon',
                phase: 'CLÔTURE',
                name: 'Mise en production officielle (Go-Live) et transfert de compétences',
                startDate: '2026-11-15',
                endDate: '2026-11-15',
                actualStartDate: '',
                actualEndDate: '',
                status: 'À faire',
                assignee: 'Direction de Projet PMO',
                responsabilite: 'Directeur de Projet',
                livrable: 'PV de réception définitive',
                budget: 8500000,
                validated: false,
                antecedent: 'task-dig-5'
              }
            ]
          },
          {
            id: 'proj-cap-humain',
            name: 'Projet 2 : Renforcement des Capacités & Conduite du Changement',
            tasks: [
              {
                id: 'task-rh-1',
                type: 'tache',
                phase: 'AVANT PROJET',
                name: 'Cartographie des compétences et évaluation des besoins en formation',
                startDate: '2026-02-01',
                endDate: '2026-03-31',
                actualStartDate: '2026-02-03',
                actualEndDate: '2026-03-28',
                status: 'Terminé',
                assignee: 'Direction des Ressources Humaines',
                responsabilite: 'Responsable Formation',
                livrable: 'Plan directeur de formation',
                budget: 12000000,
                validated: true,
                antecedent: '—'
              },
              {
                id: 'task-rh-2',
                type: 'tache',
                phase: 'EXÉCUTION & SUIVI',
                name: 'Sessions de formation certifiantes au pilotage par les résultats (GAR & PERT)',
                startDate: '2026-04-10',
                endDate: '2026-07-20',
                actualStartDate: '2026-04-15',
                actualEndDate: '',
                status: 'En cours',
                assignee: 'Cabinet Partenaire & Formateurs',
                responsabilite: 'Expert Formateur PMP/GAR',
                livrable: '120 cadres et chefs de projets certifiés',
                budget: 26500000,
                validated: false,
                antecedent: 'task-rh-1'
              }
            ]
          }
        ]
      },
      {
        id: 'axe-2-gouvernance',
        name: 'Axe 2 : Excellence Opérationnelle, Qualité & Performance Durable',
        projects: [
          {
            id: 'proj-iso-qualite',
            name: 'Projet 1 : Certification Qualité ISO 9001 & Optimisation de la Chaîne Logistique',
            tasks: [
              {
                id: 'task-iso-1',
                type: 'tache',
                phase: 'AVANT PROJET',
                name: 'Diagnostic initial de conformité aux normes internationales ISO 9001',
                startDate: '2026-01-15',
                endDate: '2026-03-15',
                actualStartDate: '2026-01-15',
                actualEndDate: '2026-03-14',
                status: 'Terminé',
                assignee: 'Cellule Qualité & Normes',
                responsabilite: 'Auditeur Qualité Principal',
                livrable: 'Rapport de diagnostic qualité',
                budget: 15000000,
                validated: true,
                antecedent: '—'
              },
              {
                id: 'task-iso-2',
                type: 'tache',
                phase: 'CONCEPTION',
                name: 'Rédaction du manuel qualité et formalisation des procédures opérationnelles',
                startDate: '2026-03-20',
                endDate: '2026-06-30',
                actualStartDate: '2026-03-25',
                actualEndDate: '',
                status: 'En cours',
                assignee: 'Comité Qualité Interne',
                responsabilite: 'Responsable Management Qualité',
                livrable: 'Référentiel des procédures validé',
                budget: 21000000,
                validated: false,
                antecedent: 'task-iso-1'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'dossier-programme-annuel',
    name: 'Programme Opérationnel Annuel & Investissements Prioritaires (2025-2026)',
    horizonPlan: '2025-2026',
    psdYear: 2025,
    horizonYears: 2,
    isReadOnly: false,
    type: 'Programme Opérationnel',
    institution: 'Direction des Opérations & Projets',
    description: 'Portefeuille de suivi rapproché des projets d’investissement à impact rapide et d’exécution budgétaire annuelle.',
    axes: [
      {
        id: 'axe-ops-1',
        name: 'Axe 1 : Déploiement Régional & Équipements Stratégiques',
        projects: [
          {
            id: 'proj-ops-equip',
            name: 'Projet d’aménagement et d’équipement des unités opérationnelles régionales',
            tasks: [
              {
                id: 'task-eq-1',
                type: 'tache',
                phase: 'AVANT PROJET',
                name: 'Passation des marchés et sélection des fournisseurs agréés',
                startDate: '2025-03-01',
                endDate: '2025-05-30',
                actualStartDate: '2025-03-04',
                actualEndDate: '2025-05-28',
                status: 'Terminé',
                assignee: 'Commission des Marchés',
                responsabilite: 'Spécialiste Passation des Marchés',
                livrable: 'Contrats attribués et notifiés',
                budget: 35000000,
                validated: true,
                antecedent: '—'
              },
              {
                id: 'task-eq-2',
                type: 'jalon',
                phase: 'CLÔTURE',
                name: 'Réception définitive et mise en service des équipements sur sites',
                startDate: '2025-11-15',
                endDate: '2025-11-15',
                actualStartDate: '2025-11-15',
                actualEndDate: '2025-11-15',
                status: 'Terminé',
                assignee: 'Direction Logistique & Patrimoine',
                responsabilite: 'Chef de Service Logistique',
                livrable: 'Procès-verbal de réception',
                budget: 14000000,
                validated: true,
                antecedent: 'task-eq-1'
              }
            ]
          }
        ]
      }
    ]
  }
];

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB non supporté'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadAppStateFromIDB(): Promise<Partial<AppPersistedState> | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(STATE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Fallback lecture localStorage:', err);
    try {
      const raw = localStorage.getItem(STATE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}

export async function saveAppStateToIDB(state: AppPersistedState): Promise<void> {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota warnings on fallback
  }
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(state, STATE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Erreur sauvegarde IndexedDB:', err);
  }
}

export function createInitialState(): AppPersistedState {
  return {
    userProfile: { ...defaultUserProfile },
    dossiers: JSON.parse(JSON.stringify(initialDossiers)),
    activeDossierId: initialDossiers[0].id,
    language: 'FR',
    currency: 'FCFA',
    theme: 'light',
    lastJsonFileName: 'FAAB_PLAN_Portefeuille.json',
    activeTab: 'landing',
    customDocsData: { ...defaultCustomDocsData }
  };
}

export async function loadStateFromDB(): Promise<AppPersistedState> {
  const initial = createInitialState();
  const loaded = await loadAppStateFromIDB();
  if (!loaded) return initial;
  const dossiers =
    Array.isArray(loaded.dossiers) && loaded.dossiers.length > 0
      ? loaded.dossiers
      : initial.dossiers;
  const activeDossierId =
    loaded.activeDossierId && dossiers.some(d => d.id === loaded.activeDossierId)
      ? loaded.activeDossierId
      : dossiers[0].id;
  const validTabs = new Set([
    'landing',
    'accueil',
    'profil',
    'projects',
    'planification',
    'suivi',
    'processus',
    'raci',
    'dashboard',
    'gantt',
    'pert',
    'kanban',
    'fiche',
    'docgen'
  ]);
  let normalizedTab = loaded.activeTab || 'landing';
  if (!validTabs.has(normalizedTab)) normalizedTab = 'landing';

  return {
    ...initial,
    ...loaded,
    activeTab: normalizedTab,
    userProfile: { ...initial.userProfile, ...(loaded.userProfile || {}) },
    dossiers,
    activeDossierId,
    customDocsData: {
      ...defaultCustomDocsData,
      ...(loaded.customDocsData || {})
    }
  };
}

export const saveStateToDB = saveAppStateToIDB;

export async function resetDatabaseToInitial(): Promise<AppPersistedState> {
  const fresh = createInitialState();
  await saveAppStateToIDB(fresh);
  return fresh;
}

