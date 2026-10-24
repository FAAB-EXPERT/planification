import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  DOC_TEMPLATE_CONFIGS,
  buildInstitutionalDocPages
} from './docTemplates';

export const ACRONYMS_LIST: Array<[string, string, string]> = [
  ['GAR', 'Gestion Axée sur les Résultats (Results-Based Management)', 'Méthodologie de pilotage orientée vers l’atteinte mesurable des impacts et livrables.'],
  ['PERT', 'Program Evaluation and Review Technique', 'Méthode d’ordonnancement en réseau modélisant les dépendances logiques entre tâches.'],
  ['CPM', 'Critical Path Method (Méthode du Chemin Critique)', 'Algorithme identifiant la séquence de tâches à marge nulle déterminant la durée minimale du projet.'],
  ['WBS', 'Work Breakdown Structure (Organigramme des Tâches)', 'Découpage hiérarchique du portefeuille en Axes, Projets, Phases et Activités.'],
  ['ES / EF', 'Early Start / Early Finish (Début / Fin au plus tôt)', 'Dates calendaires les plus précoces auxquelles une activité peut démarrer ou se terminer.'],
  ['LS / LF', 'Late Start / Late Finish (Début / Fin au plus tard)', 'Dates limites au-delà desquelles tout retard décale la date de fin globale du projet.'],
  ['CAP', 'Contrôle Périodique d’Avancement', 'Audit régulier mesurant les écarts physiques, calendaires et financiers.'],
  ['TDR', 'Termes de Référence (Terms of Reference)', 'Cahier des charges normé définissant le périmètre d’une mission ou prestation.'],
  ['NDA', 'Non-Disclosure Agreement (Contrat de Confidentialité)', 'Accord juridique protégeant la confidentialité des données et livrables du projet.'],
  ['OCDE / CAD', 'Comité d’Aide au Développement de l’OCDE', 'Référentiel international des 6 critères d’évaluation (Pertinence, Cohérence, Efficacité, Efficience, Impact, Durabilité).'],
  ['PMO', 'Project Management Office (Bureau de Pilotage)', ' Cellule centrale assurant la gouvernance, la consolidation et le suivi méthodologique.'],
  ['COPIL', 'Comité de Pilotage Stratégique', 'Instance décisionnelle supérieure chargée de valider les orientations et d’arbitrer les blocages.']
];

export function generateDirectWhitePDF(
  dossier: Dossier,
  userProfile: UserProfile,
  currency: CurrencyCode,
  lang: LanguageCode
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const todayISO = getTodayISO();
  const dateStr = new Date().toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const drawPageHeader = (subtitle: string) => {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setFillColor(12, 74, 110); // #0c4a6e
    doc.rect(0, 0, pageWidth, 24, 'F');
    doc.setFillColor(144, 213, 255); // #90D5FF
    doc.rect(0, 24, pageWidth, 2.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('FAAB PLAN — FICHE TECHNIQUE & RÉSUMÉ EXÉCUTIF', 14, 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(subtitle, 14, 18);
    doc.text(dateStr, pageWidth - 14, 14, { align: 'right' });
  };

  // Prepare all data
  const pertSummaries = computeDossierPertSummary(dossier, todayISO);
  const allNodes = pertSummaries.flatMap(p => p.nodes);

  const planningRows: any[] = [];
  const trackingRows: any[] = [];
  let totalTasks = 0;
  let completedTasks = 0;
  let inProgressTasks = 0;
  let blockedTasks = 0;
  let totalBudgetFCFA = 0;

  (dossier.axes || []).forEach(axe => {
    (axe.projects || []).forEach(proj => {
      const codeMap = new Map<string, string>();
      STANDARD_PHASES.forEach((pName, pIdx) => {
        const pTasks = (proj.tasks || []).filter(tk => tk.phase === pName);
        pTasks.forEach((tk, tIdx) => {
          codeMap.set(tk.id, `${tk.type === 'jalon' ? 'J' : 'T'}.${pIdx + 1}.${tIdx + 1}`);
        });
      });

      (proj.tasks || []).forEach((task, idx) => {
        totalTasks++;
        const metrics = computeTaskMetrics(task, todayISO);
        if (metrics.effectiveStatus === 'Terminé') completedTasks++;
        if (metrics.effectiveStatus === 'En cours') inProgressTasks++;
        if (metrics.effectiveStatus === 'Bloqué') blockedTasks++;
        const taskBudget = Number(task.budget) || 0;
        totalBudgetFCFA += taskBudget;

        const code = codeMap.get(task.id) || `${task.type === 'jalon' ? 'J' : 'T'}.1.${idx + 1}`;
        const antCode =
          task.antecedent && task.antecedent !== '—'
            ? codeMap.get(task.antecedent) || task.antecedent
            : '—';
        const startD = new Date(task.startDate);
        const monthStr = !isNaN(startD.getTime())
          ? startD.toLocaleString('fr-FR', { month: 'short', year: '2-digit' })
          : '—';

        planningRows.push([
          code,
          task.name,
          task.assignee || '—',
          formatCurrency(taskBudget, currency, lang),
          monthStr,
          antCode,
          task.startDate || '—',
          task.endDate || '—',
          metrics.plannedDurationLabel
        ]);

        trackingRows.push([
          code,
          task.name,
          task.assignee || '—',
          metrics.effectiveStatus,
          task.startDate || '—',
          task.endDate || '—',
          metrics.plannedDurationLabel,
          task.actualStartDate || '—',
          task.actualEndDate || '—',
          metrics.realDurationLabel,
          metrics.ecartDebutLabel,
          metrics.ecartFinLabel
        ]);
      });
    });
  });

  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // ==========================================================================
  // PAGE 1 : PRÉSENTATION DU DOCUMENT EXÉCUTIF CONSOLIDÉ & IDENTITÉ DU RESPONSABLE
  // ==========================================================================
  drawPageHeader(`Page de Garde Officielle · Horizon ${dossier.horizonPlan}`);

  doc.setDrawColor(144, 213, 255);
  doc.setLineWidth(0.6);
  doc.setFillColor(240, 249, 255);
  doc.roundedRect(14, 34, pageWidth - 28, 45, 3, 3, 'FD');

  doc.setTextColor(12, 74, 110);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('DOCUMENT EXÉCUTIF CONSOLIDÉ', 20, 46);

  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(dossier.name, 20, 56);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const splitDesc = doc.splitTextToSize(dossier.description || '', pageWidth - 40);
  doc.text(splitDesc, 20, 64);

  autoTable(doc, {
    startY: 88,
    head: [['1. IDENTITÉ DU RESPONSABLE & ORGANISATION DE RATTACHEMENT', 'DÉTAILS OFFICIELS']],
    body: [
      ['Nom & Prénoms du Responsable', userProfile.fullName],
      ['Fonction / Titre Officiel', userProfile.role],
      ['Organisation / Institution', userProfile.institution || dossier.institution],
      ['Adresse Email Professionnelle', userProfile.email],
      ['Contact Téléphonique', userProfile.phone],
      ['Intitulé du Portefeuille', dossier.name],
      ['Horizon Stratégique', `${dossier.horizonPlan} (${dossier.horizonYears} ans)`],
      ['Devise de Consolidation', currency]
    ],
    theme: 'grid',
    styles: { fillColor: [255, 255, 255], textColor: [15, 23, 42], fontSize: 9.5, cellPadding: 4 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 75, fillColor: [248, 250, 252] } },
    headStyles: { fillColor: [12, 74, 110], textColor: [255, 255, 255], fontSize: 9.5, fontStyle: 'bold' }
  });

  // ==========================================================================
  // PAGE 2 : LE SOMMAIRE EXÉCUTIF
  // ==========================================================================
  doc.addPage();
  drawPageHeader('Sommaire Exécutif & Architecture Documentaire');

  autoTable(doc, {
    startY: 36,
    head: [['SECTION', 'INTITULÉ DE LA RUBRIQUE DOCUMENTAIRE', 'CONTENU & NORMES']],
    body: [
      ['Section I', 'Présentation du Document Exécutif Consolidé & Identité du Responsable', 'Métadonnées institutionnelles & Profil'],
      ['Section II', 'Sommaire Exécutif Détaillé', 'Structure séquentielle multi-pages A4'],
      ['Section III', 'Table des Sigles, Acronymes & Abréviations', 'Référentiel normatif GAR, PERT, CPM, OCDE'],
      ['Section IV', 'Synthèse Financière & Avancement Opérationnel (Graphiques & KPIs)', 'Consolidation budgétaire & Répartition par statut'],
      ['Section V', 'Diagramme de Gantt Simplifié & Épuré', 'Visualisation temporelle proportionnelle sans débordement'],
      ['Section VI', 'Tableau 1 — Planification Macro des Activités & Jalons', 'Code, Activité, Responsable, Budget, Antécéd., Dates Prév.'],
      ['Section VII', 'Tableau 2 — Suivi de l’Exécution des Activités & Écarts', 'Statut à date, Dates Exéc., Écart début & Écart fin'],
      ['Section VIII', 'Interprétation Dynamique du Réseau PERT & Chemin Critique (CPM)', 'Séquences critiques, Marges libres/totales & Alertes']
    ],
    theme: 'grid',
    styles: { fillColor: [255, 255, 255], textColor: [15, 23, 42], fontSize: 9.5, cellPadding: 4.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 28, fillColor: [240, 249, 255] } },
    headStyles: { fillColor: [12, 74, 110], textColor: [255, 255, 255], fontSize: 9.5, fontStyle: 'bold' }
  });

  // ==========================================================================
  // PAGE 3 : LES ACRONYMES
  // ==========================================================================
  doc.addPage();
  drawPageHeader('Table des Sigles, Acronymes & Abréviations Officiels');

  autoTable(doc, {
    startY: 36,
    head: [['SIGLE / ACRONYME', 'SIGNIFICATION COMPLÈTE', 'DÉFINITION OPÉRATIONNELLE']],
    body: ACRONYMS_LIST,
    theme: 'grid',
    styles: { fillColor: [255, 255, 255], textColor: [15, 23, 42], fontSize: 8.5, cellPadding: 3.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 32, fillColor: [240, 249, 255] }, 1: { fontStyle: 'bold', cellWidth: 62 } },
    headStyles: { fillColor: [12, 74, 110], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' }
  });

  // ==========================================================================
  // PAGE 4 : SYNTHÈSE FINANCIÈRE & AVANCEMENT OPÉRATIONNEL
  // ==========================================================================
  doc.addPage();
  drawPageHeader(`Synthèse Financière & Avancement Opérationnel (${currency})`);

  autoTable(doc, {
    startY: 36,
    head: [['INDICATEUR EXÉCUTIF', 'VALEUR CONSOLIDÉE', 'INTERPRÉTATION']],
    body: [
      [`Budget Global Consolidé (${currency})`, formatCurrency(totalBudgetFCFA, currency, lang), 'Enveloppe financière totale programmée'],
      ['Total des Activités & Jalons', String(totalTasks), 'Volume global du portefeuille'],
      ['Activités Terminées', `${completedTasks} (${progressPct}%)`, 'Livrables réceptionnés et validés'],
      ['Activités En Cours', String(inProgressTasks), 'Opérations actives à la date du jour'],
      ['Activités Bloquées (Goulots)', String(blockedTasks), 'Points d’attention nécessitant un arbitrage']
    ],
    theme: 'grid',
    styles: { fillColor: [255, 255, 255], textColor: [15, 23, 42], fontSize: 9, cellPadding: 3.5 },
    columnStyles: { 0: { fontStyle: 'bold', fillColor: [240, 249, 255] }, 1: { fontStyle: 'bold', halign: 'center' } },
    headStyles: { fillColor: [12, 74, 110], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' }
  });

  const projBreakdownRows = pertSummaries.map((p, idx) => {
    const pTerm = p.nodes.filter(n => n.status === 'Terminé').length;
    const pEnc = p.nodes.filter(n => n.status === 'En cours').length;
    const pBloq = p.nodes.filter(n => n.status === 'Bloqué').length;
    const pAf = p.nodes.filter(n => n.status === 'À faire').length;
    const pBud = p.nodes.reduce((acc, n) => acc + n.budget, 0);
    return [
      `P${idx + 1} — ${p.projectName}`,
      String(pTerm),
      String(pEnc),
      String(pBloq),
      String(pAf),
      formatCurrency(pBud, currency, lang)
    ];
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 8,
    head: [['PROJET OPÉRATIONNEL', 'TERMINÉES', 'EN COURS', 'BLOQUÉES', 'À FAIRE', `BUDGET (${currency})`]],
    body: projBreakdownRows,
    theme: 'grid',
    styles: { fillColor: [255, 255, 255], textColor: [15, 23, 42], fontSize: 8.5, cellPadding: 3 },
    headStyles: { fillColor: [2, 132, 199], textColor: [255, 255, 255], fontSize: 8.5, fontStyle: 'bold' }
  });

  // ==========================================================================
  // PAGE 5 : DIAGRAMME DE GANTT SIMPLIFIÉ & ÉPURÉ
  // ==========================================================================
  doc.addPage();
  drawPageHeader('Diagramme de Gantt Simplifié & Épuré');

  const ganttRows = allNodes.map(n => [
    n.code,
    n.name,
    n.startDate,
    n.endDate,
    `${n.duration}j`,
    n.isCritical ? 'CRITIQUE (CPM)' : `Marge +${n.totalFloat}j`,
    n.status
  ]);

  autoTable(doc, {
    startY: 36,
    head: [['Code', 'Activité / Jalon', 'Déb. Prév', 'Fin Prév', 'Durée', 'Criticité PERT', 'Statut']],
    body: ganttRows,
    theme: 'grid',
    styles: { fillColor: [255, 255, 255], textColor: [15, 23, 42], fontSize: 8, cellPadding: 2.8 },
    headStyles: { fillColor: [12, 74, 110], textColor: [255, 255, 255], fontSize: 8.5, fontStyle: 'bold' }
  });

  // ==========================================================================
  // PAGE 6+ : TABLEAU 1 — PLANIFICATION MACRO DES ACTIVITÉS & JALONS
  // ==========================================================================
  doc.addPage();
  drawPageHeader('Tableau 1 — Planification Macro des Activités & Jalons');

  autoTable(doc, {
    startY: 36,
    head: [['Code', 'Activité / Jalon', 'Responsable', `Budget (${currency})`, 'Mois', 'Antécéd.', 'Déb. Prév', 'Fin Prév', 'Durée']],
    body: planningRows,
    theme: 'grid',
    styles: { fillColor: [255, 255, 255], textColor: [15, 23, 42], fontSize: 7.5, cellPadding: 2.5 },
    headStyles: { fillColor: [12, 74, 110], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' }
  });

  // ==========================================================================
  // PAGE 7+ : TABLEAU 2 — SUIVI DE L’EXÉCUTION DES ACTIVITÉS & ÉCARTS
  // ==========================================================================
  doc.addPage();
  drawPageHeader('Tableau 2 — Suivi de l’Exécution des Activités & Écarts');

  autoTable(doc, {
    startY: 36,
    head: [['Code', 'Activité / Jalon', 'Responsable', 'Statut', 'Déb. Prév', 'Fin Prév', 'Durée', 'Déb. Exéc', 'Fin Exéc', 'Réel', 'Écart début', 'Écart fin']],
    body: trackingRows,
    theme: 'grid',
    styles: { fillColor: [255, 255, 255], textColor: [15, 23, 42], fontSize: 7, cellPadding: 2.2 },
    headStyles: { fillColor: [2, 132, 199], textColor: [255, 255, 255], fontSize: 7.5, fontStyle: 'bold' }
  });

  // ==========================================================================
  // DERNIÈRE PAGE : INTERPRÉTATION DYNAMIQUE DU RÉSEAU PERT & CHEMIN CRITIQUE
  // ==========================================================================
  doc.addPage();
  drawPageHeader('Interprétation Dynamique du Réseau PERT & Chemin Critique (CPM)');

  const pertInterpRows = pertSummaries.map(p => [
    p.projectName,
    `${p.projectDuration} jour(s)`,
    p.criticalPathCodes.join(' -> ') || '—',
    `${p.interpretation.criticalPathSummary}\n\n${p.interpretation.slackSummary}\n\n${p.interpretation.riskAndSteeringSummary}`
  ]);

  autoTable(doc, {
    startY: 36,
    head: [['Projet Opérationnel', 'Durée Critique', 'Chemin Critique', 'Interprétation Dynamique & Recommandations']],
    body: pertInterpRows,
    theme: 'grid',
    styles: { fillColor: [255, 255, 255], textColor: [15, 23, 42], fontSize: 8, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 42 }, 1: { fontStyle: 'bold', cellWidth: 24 }, 2: { fontStyle: 'bold', cellWidth: 32 } },
    headStyles: { fillColor: [12, 74, 110], textColor: [255, 255, 255], fontSize: 8.5, fontStyle: 'bold' }
  });

  // Number all pages cleanly
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `FAAB PLAN · Conception & Architecture : KOFFIE FABIEN MICHAEL (fabien.frikupgeneration@gmail.com | 00225 0748082739) · Page ${p} / ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  const cleanFileName = (dossier.name || 'FAAB_PLAN_Fiche_Technique')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_');

  doc.save(`FAAB_PLAN_${cleanFileName}_${currency}.pdf`);
}

/**
 * Génère le PDF A4 multi-pages spécifique à chacun des 9 documents institutionnels
 */
export function generateInstitutionalDocumentPDF(
  docType: InstitutionalDocType,
  customFields: CustomDocFields,
  dossier: Dossier,
  userProfile: UserProfile,
  currency: CurrencyCode,
  lang: LanguageCode
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const cleanPdfText = (val: string = ''): string =>
    String(val || '')
      .replace(/[\u202F\u00A0]/g, ' ')
      .replace(/→/g, '->')
      .replace(/◆/g, '[Jalon]')
      .replace(/≥/g, '>=')
      .replace(/≤/g, '<=');

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = pageWidth - 28; // 14mm left + 14mm right margin = 182mm on A4
  const dateStr = cleanPdfText(
    new Date().toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  );

  const pages = buildInstitutionalDocPages(docType, customFields, dossier, userProfile, currency, lang);
  const cfg = DOC_TEMPLATE_CONFIGS[docType];

  const drawPageHeaderBanner = (title: string, subtitle: string) => {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setFillColor(12, 74, 110);
    doc.rect(0, 0, pageWidth, 26, 'F');
    doc.setFillColor(144, 213, 255);
    doc.rect(0, 26, pageWidth, 2.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(cleanPdfText(title), 14, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.text(cleanPdfText(subtitle), 14, 19);
    doc.text(dateStr, pageWidth - 14, 15, { align: 'right' });
  };

  pages.forEach((pageData, pageIdx) => {
    if (pageIdx > 0) {
      doc.addPage();
    }

    drawPageHeaderBanner(pageData.pageTitle, pageData.pageSubtitle);

    let currentY = 34;

    const safeAddImage = (dataUrl: string | undefined, x: number, y: number, w: number, h: number) => {
      if (!dataUrl || !dataUrl.startsWith('data:image/')) return;
      try {
        const format = dataUrl.includes('image/jpeg') || dataUrl.includes('image/jpg') ? 'JPEG' : 'PNG';
        doc.addImage(dataUrl, format, x, y, w, h);
      } catch {
        // Fallback silently if image format cannot be embedded
      }
    };

    pageData.sections.forEach(sec => {
      if (sec.coverChart) {
        const hasTopLogos = Boolean(sec.coverChart.leftLogoDataUrl || sec.coverChart.rightLogoDataUrl);
        const hasBannerImg = Boolean(sec.coverChart.bannerImageDataUrl);
        const covChart = sec.coverChart;

        autoTable(doc, {
          startY: currentY,
          margin: { left: 14, right: 14 },
          head: [[
            cleanPdfText(`${hasTopLogos ? '\n\n\n\n' : ''}${covChart.leftLogo}\n(Aligné en haut à gauche)`),
            cleanPdfText(`${hasTopLogos ? '\n\n\n\n' : ''}${covChart.rightLogo}\n(Aligné en haut à droite)`)
          ]],
          body: [
            [
              {
                content: cleanPdfText(`${hasBannerImg ? '\n\n\n\n\n\n' : ''}${covChart.bannerTitle}\n${covChart.bannerSubtitle}`),
                colSpan: 2,
                styles: {
                  halign: 'center',
                  fillColor: [12, 74, 110],
                  textColor: [255, 255, 255],
                  fontStyle: 'bold',
                  fontSize: 9.2,
                  cellPadding: 4.5
                }
              } as any
            ],
            [
              {
                content: cleanPdfText(`${covChart.docTitle}\n\n${covChart.docSubtitle}`),
                colSpan: 2,
                styles: {
                  halign: 'center',
                  fillColor: [240, 249, 255],
                  textColor: [12, 74, 110],
                  fontStyle: 'bold',
                  fontSize: 10,
                  cellPadding: 5
                }
              } as any
            ],
            [
              cleanPdfText(`${covChart.bottomLeftStructure}\n\n${covChart.bottomLeftZone}`),
              cleanPdfText(`${covChart.bottomRightDateVersion}\n\n${covChart.bottomRightStatus}`)
            ]
          ],
          theme: 'grid',
          styles: {
            fillColor: [255, 255, 255],
            textColor: [15, 23, 42],
            fontSize: 8,
            cellPadding: 3,
            overflow: 'linebreak'
          },
          columnStyles: {
            0: { halign: 'left', fontStyle: 'bold', cellWidth: usableWidth / 2 },
            1: { halign: 'right', fontStyle: 'bold', cellWidth: usableWidth / 2 }
          },
          headStyles: { fillColor: [248, 250, 252], textColor: [12, 74, 110], fontSize: 7.8, fontStyle: 'bold' },
          didDrawCell: data => {
            if (data.section === 'head' && data.row.index === 0) {
              if (data.column.index === 0 && covChart.leftLogoDataUrl) {
                safeAddImage(covChart.leftLogoDataUrl, data.cell.x + 3, data.cell.y + 2, 22, 13);
              }
              if (data.column.index === 1 && covChart.rightLogoDataUrl) {
                safeAddImage(
                  covChart.rightLogoDataUrl,
                  data.cell.x + data.cell.width - 25,
                  data.cell.y + 2,
                  22,
                  13
                );
              }
            }
            if (data.section === 'body' && data.row.index === 0 && data.column.index === 0 && covChart.bannerImageDataUrl) {
              const imgW = Math.min(72, data.cell.width - 16);
              const imgX = data.cell.x + (data.cell.width - imgW) / 2;
              safeAddImage(covChart.bannerImageDataUrl, imgX, data.cell.y + 2.5, imgW, 20);
            }
          }
        });
        currentY = (doc as any).lastAutoTable.finalY + 4.5;
      }

      if (sec.adminLetterHeader) {
        const hdr = sec.adminLetterHeader;
        const hasLogo = Boolean(hdr.rightLogoDataUrl || hdr.leftLogoDataUrl);
        autoTable(doc, {
          startY: currentY,
          margin: { left: 14, right: 14 },
          head: [['EXPÉDITEUR / TIMBRE OFFICIEL', 'LIEU, DATE & DESTINATAIRE']],
          body: [
            [
              cleanPdfText(
                `${hasLogo ? '\n\n\n' : ''}${hdr.senderInstitution}\n${hdr.senderName} — ${hdr.senderRole}\n${hdr.senderContact}\nN° Réf : ${hdr.referenceCode}`
              ),
              cleanPdfText(
                `${hdr.cityAndDate}\n\nÀ L’ATTENTION DE :\n${hdr.recipientTitle}\n${hdr.recipientOrg}`
              )
            ],
            [
              {
                content: cleanPdfText(`OBJET : ${hdr.subjectLine}\nRÉF. DOSSIER : ${hdr.dossierRefLine}`),
                colSpan: 2,
                styles: {
                  fillColor: [240, 249, 255],
                  textColor: [12, 74, 110],
                  fontStyle: 'bold',
                  fontSize: 8.3,
                  cellPadding: 3.2
                }
              } as any
            ]
          ],
          theme: 'grid',
          styles: {
            fillColor: [255, 255, 255],
            textColor: [15, 23, 42],
            fontSize: 8,
            cellPadding: 3,
            overflow: 'linebreak'
          },
          columnStyles: {
            0: { halign: 'left', fontStyle: 'bold', cellWidth: usableWidth / 2 },
            1: { halign: 'right', fontStyle: 'bold', cellWidth: usableWidth / 2 }
          },
          headStyles: { fillColor: [12, 74, 110], textColor: [255, 255, 255], fontSize: 7.8, fontStyle: 'bold' },
          didDrawCell: data => {
            if (data.section === 'body' && data.row.index === 0 && data.column.index === 0 && hasLogo) {
              const logoUrl = hdr.rightLogoDataUrl || hdr.leftLogoDataUrl;
              safeAddImage(logoUrl, data.cell.x + 3, data.cell.y + 2, 18, 10);
            }
          }
        });
        currentY = (doc as any).lastAutoTable.finalY + 4;
      }

      if (sec.cvHeaderBanner) {
        const cvHdr = sec.cvHeaderBanner;
        const hasProfilePhoto = Boolean(cvHdr.profilePhotoDataUrl);
        autoTable(doc, {
          startY: currentY,
          margin: { left: 14, right: 14 },
          head: [[cleanPdfText(cvHdr.docBadge), 'PHOTO D’IDENTITÉ (3.5 x 4.5 cm)']],
          body: [
            [
              cleanPdfText(
                `${cvHdr.fullNameUpper}\n\n${cvHdr.expertTitleLine}\n\n${cvHdr.contactLine}${
                  cvHdr.metaSubLine ? `\n\n${cvHdr.metaSubLine}` : ''
                }`
              ),
              cleanPdfText(
                hasProfilePhoto
                  ? '\n\n\n\n\n\n\n\n\n\n\n'
                  : '\n\n[IMAGE_PHOTO_PROFIL]\nPhoto Identité Pro\n(3.5 cm x 4.5 cm)\n\n'
              )
            ]
          ],
          theme: 'grid',
          styles: {
            fillColor: [255, 255, 255],
            textColor: [15, 23, 42],
            fontSize: 8.2,
            cellPadding: 3,
            overflow: 'linebreak'
          },
          columnStyles: {
            0: { halign: 'left', fontStyle: 'bold', cellWidth: Number((usableWidth * 0.76).toFixed(2)) },
            1: { halign: 'center', fontStyle: 'bold', cellWidth: Number((usableWidth * 0.24).toFixed(2)) }
          },
          headStyles: { fillColor: [12, 74, 110], textColor: [255, 255, 255], fontSize: 7.8, fontStyle: 'bold' },
          didDrawCell: data => {
            if (data.section === 'body' && data.row.index === 0 && data.column.index === 1 && cvHdr.profilePhotoDataUrl) {
              const photoW = 35; // 3.5 cm
              const photoH = 45; // 4.5 cm
              const photoX = data.cell.x + (data.cell.width - photoW) / 2;
              const photoY = data.cell.y + 2;
              safeAddImage(cvHdr.profilePhotoDataUrl, photoX, photoY, photoW, photoH);
            }
          }
        });
        currentY = (doc as any).lastAutoTable.finalY + 4;
      }

      if (sec.operationalHeaderBanner) {
        const opHdr = sec.operationalHeaderBanner;
        const hasLeftLogo = Boolean(opHdr.rightLogoDataUrl);
        const hasRightLogo = Boolean(opHdr.leftLogoDataUrl);
        autoTable(doc, {
          startY: currentY,
          margin: { left: 14, right: 14 },
          head: [['LOGO ÉMETTEUR (H: 1.5 cm)', 'EN-TÊTE OPÉRATIONNEL OFFICIEL', 'LOGO PARTENAIRE / BAILLEUR (H: 1.5 cm)']],
          body: [
            [
              cleanPdfText(`${hasLeftLogo ? '\n\n\n\n' : ''}${opHdr.leftLogoLabel}`),
              cleanPdfText(
                `${opHdr.centerDocTitle}\n\n${opHdr.centerSubTitle}\n${opHdr.referenceAndDateLine}`
              ),
              cleanPdfText(`${hasRightLogo ? '\n\n\n\n' : ''}${opHdr.rightLogoLabel}`)
            ]
          ],
          theme: 'grid',
          styles: {
            fillColor: [255, 255, 255],
            textColor: [15, 23, 42],
            fontSize: 7.8,
            cellPadding: 2.8,
            overflow: 'linebreak'
          },
          columnStyles: {
            0: { halign: 'left', fontStyle: 'bold', cellWidth: Number((usableWidth * 0.24).toFixed(2)) },
            1: {
              halign: 'center',
              fontStyle: 'bold',
              fillColor: [240, 249, 255],
              textColor: [12, 74, 110],
              cellWidth: Number((usableWidth * 0.52).toFixed(2))
            },
            2: { halign: 'right', fontStyle: 'bold', cellWidth: Number((usableWidth * 0.24).toFixed(2)) }
          },
          headStyles: { fillColor: [12, 74, 110], textColor: [255, 255, 255], fontSize: 7.4, fontStyle: 'bold' },
          didDrawCell: data => {
            if (data.section === 'body' && data.row.index === 0) {
              if (data.column.index === 0 && opHdr.rightLogoDataUrl) {
                safeAddImage(opHdr.rightLogoDataUrl, data.cell.x + 3, data.cell.y + 2, 22, 15);
              }
              if (data.column.index === 2 && opHdr.leftLogoDataUrl) {
                safeAddImage(
                  opHdr.leftLogoDataUrl,
                  data.cell.x + data.cell.width - 25,
                  data.cell.y + 2,
                  22,
                  15
                );
              }
            }
          }
        });
        currentY = (doc as any).lastAutoTable.finalY + 4;
      }

      if (sec.keyValueRows && sec.keyValueRows.length > 0) {
        autoTable(doc, {
          startY: currentY,
          margin: { left: 14, right: 14 },
          head: [[cleanPdfText(sec.heading), 'INFORMATIONS OFFICIELLES']],
          body: sec.keyValueRows.map(([k, v]) => [cleanPdfText(k), cleanPdfText(v)]),
          theme: 'grid',
          styles: {
            fillColor: [255, 255, 255],
            textColor: [15, 23, 42],
            fontSize: 8,
            cellPadding: 2.5,
            overflow: 'linebreak'
          },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 64, fillColor: [240, 249, 255] },
            1: { cellWidth: usableWidth - 64 }
          },
          headStyles: { fillColor: [12, 74, 110], textColor: [255, 255, 255], fontSize: 8.2, fontStyle: 'bold' }
        });
        currentY = (doc as any).lastAutoTable.finalY + 4.5;
      }

      if ((sec.paragraphs && sec.paragraphs.length > 0) || (sec.bullets && sec.bullets.length > 0)) {
        const textRows: string[][] = [];
        if (sec.paragraphs) {
          sec.paragraphs.forEach(p => textRows.push([cleanPdfText(p)]));
        }
        if (sec.bullets) {
          sec.bullets.forEach(b => textRows.push([cleanPdfText(`• ${b}`)]));
        }
        autoTable(doc, {
          startY: currentY,
          margin: { left: 14, right: 14 },
          head: [[cleanPdfText(sec.heading)]],
          body: textRows,
          theme: 'grid',
          styles: {
            fillColor: [255, 255, 255],
            textColor: [15, 23, 42],
            fontSize: 8,
            cellPadding: 2.5,
            overflow: 'linebreak'
          },
          headStyles: { fillColor: [2, 132, 199], textColor: [255, 255, 255], fontSize: 8.2, fontStyle: 'bold' }
        });
        currentY = (doc as any).lastAutoTable.finalY + 4.5;
      }

      if (sec.figureImage && sec.figureImage.dataUrl) {
        const figImg = sec.figureImage;
        autoTable(doc, {
          startY: currentY,
          margin: { left: 14, right: 14 },
          head: [[cleanPdfText(figImg.caption)]],
          body: [['\n\n\n\n\n\n\n\n']],
          theme: 'grid',
          styles: { fillColor: [255, 255, 255], textColor: [15, 23, 42], fontSize: 7.8, halign: 'center' },
          headStyles: { fillColor: [12, 74, 110], textColor: [255, 255, 255], fontSize: 7.8, fontStyle: 'bold', halign: 'center' },
          didDrawCell: data => {
            if (data.section === 'body' && data.row.index === 0) {
              const imgW = Math.min(90, data.cell.width - 16);
              const imgX = data.cell.x + (data.cell.width - imgW) / 2;
              safeAddImage(figImg.dataUrl, imgX, data.cell.y + 2, imgW, 28);
            }
          }
        });
        currentY = (doc as any).lastAutoTable.finalY + 4.5;
      }

      if (sec.table) {
        const dynamicColStyles: Record<number, any> = {};
        const colWidths = sec.table.columnWidths;
        const rightCols = sec.table.rightAlignCols || [];

        if (colWidths && colWidths.length === sec.table.headers.length) {
          colWidths.forEach((pct, cIdx) => {
            dynamicColStyles[cIdx] = {
              cellWidth: Number(((usableWidth * pct) / 100).toFixed(2)),
              ...(rightCols.includes(cIdx) ? { halign: 'right', fontStyle: 'bold' } : {}),
              ...(cIdx === 0 ? { fontStyle: 'bold' } : {})
            };
          });
        } else {
          rightCols.forEach(cIdx => {
            dynamicColStyles[cIdx] = { halign: 'right', fontStyle: 'bold' };
          });
        }

        autoTable(doc, {
          startY: currentY,
          margin: { left: 14, right: 14 },
          head: [sec.table.headers.map(h => cleanPdfText(h))],
          body: sec.table.rows.map(row => row.map(c => cleanPdfText(c))),
          theme: 'grid',
          rowPageBreak: 'avoid',
          styles: {
            fillColor: [255, 255, 255],
            textColor: [15, 23, 42],
            fontSize: 7.2,
            cellPadding: 2,
            overflow: 'linebreak'
          },
          columnStyles: dynamicColStyles,
          headStyles: {
            fillColor: [12, 74, 110],
            textColor: [255, 255, 255],
            fontSize: 7.4,
            fontStyle: 'bold',
            overflow: 'linebreak'
          }
        });
        currentY = (doc as any).lastAutoTable.finalY + 4.5;
      }
    });

    if (pageData.isSignaturePage) {
      const hasStamps = Boolean(pageData.orgStampDataUrl || pageData.partnerStampDataUrl);
      if (currentY > pageHeight - 52) {
        doc.addPage();
        drawPageHeaderBanner(pageData.pageTitle, `${pageData.pageSubtitle} (Approbation & Signatures)`);
        currentY = 36;
      }
      autoTable(doc, {
        startY: currentY + 2,
        margin: { left: 14, right: 14 },
        rowPageBreak: 'avoid',
        head: [[
          cleanPdfText(`POUR L’INSTITUTION (${userProfile.institution || 'AUTORITÉ PILOTE'})`),
          cleanPdfText(`POUR LA PARTIE PRENANTE (${customFields.recipientOrg || customFields.recipientRepresentative || 'PARTENAIRE'})`)
        ]],
        body: [[
          cleanPdfText(
            `Nom : ${userProfile.fullName}\nFonction : ${userProfile.role}\nFait à ${customFields.locationCity}, le ${dateStr}\n\nSignature & Cachet Officiel :\n${hasStamps ? '\n\n\n\n' : '\n'}_____________________________`
          ),
          cleanPdfText(
            `Nom / Entité : ${customFields.recipientRepresentative || customFields.recipientOrg || '______________________'}\nFait à ${customFields.locationCity}, le ${dateStr}\n\nSignature & Cachet (« Lu et approuvé ») :\n${hasStamps ? '\n\n\n\n' : '\n'}_____________________________`
          )
        ]],
        theme: 'grid',
        styles: {
          fillColor: [255, 255, 255],
          textColor: [15, 23, 42],
          fontSize: 7.8,
          cellPadding: 3,
          overflow: 'linebreak'
        },
        columnStyles: {
          0: { cellWidth: usableWidth / 2 },
          1: { cellWidth: usableWidth / 2 }
        },
        headStyles: { fillColor: [3, 105, 161], textColor: [255, 255, 255], fontSize: 7.8, fontStyle: 'bold', halign: 'center' },
        didDrawCell: data => {
          if (data.section === 'body' && data.row.index === 0) {
            if (data.column.index === 0 && pageData.orgStampDataUrl) {
              safeAddImage(pageData.orgStampDataUrl, data.cell.x + 12, data.cell.y + data.cell.height - 20, 28, 15);
            }
            if (data.column.index === 1 && pageData.partnerStampDataUrl) {
              safeAddImage(pageData.partnerStampDataUrl, data.cell.x + 12, data.cell.y + data.cell.height - 20, 28, 15);
            }
          }
        }
      });
    }
  });

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7.2);
    doc.setTextColor(100, 116, 139);
    doc.text(
      cleanPdfText(
        `FAAB PLAN · ${cfg.selectLabel} (${customFields.referenceCode}) · Ingénierie : KOFFIE FABIEN MICHAEL · Page ${p} / ${totalPages}`
      ),
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  doc.save(`FAAB_PLAN_${docType.toUpperCase()}_${customFields.referenceCode || 'OFFICIEL'}.pdf`);
}
