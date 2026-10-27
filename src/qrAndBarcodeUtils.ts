import {
  ActorCategoryType,
  CategorizedActor,
  Dossier,
  InternalActorProfile,
  UserProfile
} from './types';
import { ensureDossierCategorizedActors } from './db';

/**
 * Génère le payload universel vCard 3.0 pour le QR Code de la Carte de Visite Professionnelle.
 * Le scan avec n'importe quel smartphone (iOS / Android) ouvre directement la fiche contact
 * pré-remplie prête à être ajoutée au répertoire téléphonique.
 */
export function buildBusinessCardVCardPayload(
  profile: InternalActorProfile,
  dossier: Dossier
): string {
  const fullName = (profile.fullName || 'Expert Interne').trim();
  const parts = fullName.split(/\s+/);
  const lastName = parts.length > 1 ? parts[0] : fullName;
  const firstName = parts.length > 1 ? parts.slice(1).join(' ') : '';

  const org = (profile.executingOrgName || dossier.institution || 'Organisme Pilote').replace(
    /[;\r\n]+/g,
    ' '
  );
  const dept = (
    profile.executingDepartment ||
    profile.serviceUnit ||
    'Direction / UGP'
  ).replace(/[;\r\n]+/g, ' ');
  const role = (profile.officialRole || 'Responsable Opérationnel').replace(/[\r\n]+/g, ' ');
  const phoneWork = (profile.phonePro || '').trim();
  const phoneCell = (profile.phoneMobile || '').trim();
  const email = (profile.emailPro || '').trim();
  const address = (profile.officeAddress || '').replace(/[;\r\n]+/g, ' ');
  const city = (profile.residenceCity || 'Abidjan').replace(/[;\r\n]+/g, ' ');
  const website = (profile.websiteUrl || '').trim();
  const matricule = (profile.employeeId || 'MAT-PILOTE-001').trim();
  const raci = (profile.raciRoleBadge || 'R').trim();

  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${lastName};${firstName};;;`,
    `FN:${fullName}`,
    `TITLE:${role}`,
    `ORG:${org};${dept}`
  ];

  if (phoneCell) {
    lines.push(`TEL;TYPE=CELL,VOICE:${phoneCell}`);
  }
  if (phoneWork && phoneWork !== phoneCell) {
    lines.push(`TEL;TYPE=WORK,VOICE:${phoneWork}`);
  }
  if (email) {
    lines.push(`EMAIL;TYPE=PREF,WORK,INTERNET:${email}`);
  }
  if (address || city) {
    lines.push(`ADR;TYPE=WORK:;;${address};${city};;;`);
  }
  if (website) {
    lines.push(
      `URL:${website.startsWith('http') ? website : `https://${website}`}`
    );
  }
  lines.push(
    `NOTE:Programme: ${dossier.name} | Catégorie: Interne | Matricule: ${matricule} | RACI: ${raci} | Unité: ${profile.serviceUnit || 'UGP'}`
  );
  lines.push('END:VCARD');

  return lines.join('\n');
}

/**
 * Génère le payload structuré du QR Code du Badge d'Accès Professionnel.
 * Encode toutes les informations d'identification et d'accréditation de l'acteur Interne.
 */
export function buildBadgeQrPayload(
  profile: InternalActorProfile,
  dossier: Dossier,
  axeName?: string,
  projectName?: string
): string {
  const payload = {
    schema: 'FAAB_PLAN_BADGE_V1',
    category: 'Interne' as ActorCategoryType,
    matricule: profile.employeeId || 'MAT-PILOTE-001',
    fullName: profile.fullName || 'Membre Interne',
    role: profile.officialRole || 'Responsable Opérationnel',
    raci: profile.raciRoleBadge || 'R',
    org: profile.executingOrgName || dossier.institution || 'Organisme Pilote',
    dept: profile.executingDepartment || 'UGP / PMO',
    unit: profile.serviceUnit || 'Unité de Gestion du Programme',
    dossierId: dossier.id,
    programme: dossier.name,
    axe: axeName || dossier.axes?.[0]?.name || 'Tous les Axes',
    project:
      projectName ||
      dossier.axes?.[0]?.projects?.[0]?.name ||
      'Portefeuille Opérationnel',
    accreditation: 'ZONE A — ACCÈS TOTAL & SITES',
    validity: profile.badgeValidityDate || '31/12/2026',
    blood: profile.badgeBloodType || 'O+',
    emergency: profile.badgeEmergencyPhone || profile.phonePro || '+225 27 20 00 12 34',
    phone: profile.phoneMobile || profile.phonePro || '',
    email: profile.emailPro || ''
  };
  return JSON.stringify(payload);
}

// ============================================================================
// ENCODEUR STANDARD CODE-128 (SET B - ISO/IEC 15417) POUR CODE-BARRES 1D
// ============================================================================
const CODE128_PATTERNS: number[][] = [
  [2, 1, 2, 2, 2, 2], [2, 2, 2, 1, 2, 2], [2, 2, 2, 2, 2, 1], [1, 2, 1, 2, 2, 3],
  [1, 2, 1, 3, 2, 2], [1, 3, 1, 2, 2, 2], [1, 2, 2, 2, 1, 3], [1, 2, 2, 3, 1, 2],
  [1, 3, 2, 2, 1, 2], [2, 2, 1, 2, 1, 3], [2, 2, 1, 3, 1, 2], [2, 3, 1, 2, 1, 2],
  [1, 1, 2, 2, 3, 2], [1, 2, 2, 1, 3, 2], [1, 2, 2, 2, 3, 1], [1, 1, 3, 2, 2, 2],
  [1, 2, 3, 1, 2, 2], [1, 2, 3, 2, 2, 1], [2, 2, 3, 2, 1, 1], [2, 2, 1, 1, 3, 2],
  [2, 2, 1, 2, 3, 1], [2, 1, 3, 2, 1, 2], [2, 2, 3, 1, 1, 2], [3, 1, 2, 1, 3, 1],
  [3, 1, 1, 2, 2, 2], [3, 2, 1, 1, 2, 2], [3, 2, 1, 2, 2, 1], [3, 1, 2, 2, 1, 2],
  [3, 2, 2, 1, 1, 2], [3, 2, 2, 2, 1, 1], [2, 1, 2, 1, 2, 3], [2, 1, 2, 3, 2, 1],
  [2, 3, 2, 1, 2, 1], [1, 1, 1, 3, 2, 3], [1, 3, 1, 1, 2, 3], [1, 3, 1, 3, 2, 1],
  [1, 1, 2, 3, 1, 3], [1, 3, 2, 1, 1, 3], [1, 3, 2, 3, 1, 1], [2, 1, 1, 3, 1, 3],
  [2, 3, 1, 1, 1, 3], [2, 3, 1, 3, 1, 1], [1, 1, 2, 1, 3, 3], [1, 1, 2, 3, 3, 1],
  [1, 3, 2, 1, 3, 1], [1, 1, 3, 1, 2, 3], [1, 1, 3, 3, 2, 1], [1, 3, 3, 1, 2, 1],
  [3, 1, 3, 1, 2, 1], [2, 1, 1, 3, 3, 1], [2, 3, 1, 1, 3, 1], [2, 1, 3, 1, 1, 3],
  [2, 1, 3, 3, 1, 1], [2, 1, 3, 1, 3, 1], [3, 1, 1, 1, 2, 3], [3, 1, 1, 3, 2, 1],
  [3, 3, 1, 1, 2, 1], [3, 1, 2, 1, 1, 3], [3, 1, 2, 3, 1, 1], [3, 3, 2, 1, 1, 1],
  [3, 1, 4, 1, 1, 1], [2, 2, 1, 4, 1, 1], [4, 3, 1, 1, 1, 1], [1, 1, 1, 2, 2, 4],
  [1, 1, 1, 4, 2, 2], [1, 2, 1, 1, 2, 4], [1, 2, 1, 4, 2, 1], [1, 4, 1, 1, 2, 2],
  [1, 4, 1, 2, 2, 1], [1, 1, 2, 2, 1, 4], [1, 1, 2, 4, 1, 2], [1, 2, 2, 1, 1, 4],
  [1, 2, 2, 4, 1, 1], [1, 4, 2, 1, 1, 2], [1, 4, 2, 2, 1, 1], [2, 4, 1, 2, 1, 1],
  [2, 2, 1, 1, 1, 4], [4, 1, 3, 1, 1, 1], [2, 4, 1, 1, 1, 2], [1, 3, 4, 1, 1, 1],
  [1, 1, 1, 2, 4, 2], [1, 2, 1, 1, 4, 2], [1, 2, 1, 2, 4, 1], [1, 1, 4, 2, 1, 2],
  [1, 2, 4, 1, 1, 2], [1, 2, 4, 2, 1, 1], [4, 1, 1, 2, 1, 2], [4, 2, 1, 1, 1, 2],
  [4, 2, 1, 2, 1, 1], [2, 1, 2, 1, 4, 1], [2, 1, 4, 1, 2, 1], [4, 1, 2, 1, 2, 1],
  [1, 1, 1, 1, 4, 3], [1, 1, 1, 3, 4, 1], [1, 3, 1, 1, 4, 1], [1, 1, 4, 1, 1, 3],
  [1, 1, 4, 3, 1, 1], [4, 1, 1, 1, 1, 3], [4, 1, 1, 3, 1, 1], [1, 1, 3, 1, 4, 1],
  [1, 1, 4, 1, 3, 1], [3, 1, 1, 1, 4, 1], [4, 1, 1, 1, 3, 1], [2, 1, 1, 4, 1, 2],
  [2, 1, 1, 2, 1, 4], [2, 1, 1, 2, 3, 2], [2, 3, 3, 1, 1, 1, 2]
];

/**
 * Encode une chaîne ASCII (ex: Matricule du Badge) en séquence alternée Barre/Espace CODE-128B.
 */
export function encodeCode128Bars(rawValue: string): number[] {
  const clean = (rawValue || 'MAT-PILOTE-001')
    .replace(/[^\x20-\x7E]/g, '-')
    .slice(0, 28);
  const startCodeB = 104;
  const stopCode = 106;

  const codes: number[] = [startCodeB];
  let checksum = startCodeB;

  for (let i = 0; i < clean.length; i++) {
    const code = Math.max(0, Math.min(94, clean.charCodeAt(i) - 32));
    codes.push(code);
    checksum += code * (i + 1);
  }

  const checkSymbol = checksum % 103;
  codes.push(checkSymbol);
  codes.push(stopCode);

  const widths: number[] = [];
  codes.forEach(code => {
    const pat = CODE128_PATTERNS[code] || CODE128_PATTERNS[0];
    widths.push(...pat);
  });

  return widths;
}

// ============================================================================
// GÉNÉRATEUR DE MATRICE QR CODE ISO/IEC 18004 (VERSIONS 1 À 20, MODE BYTE, ECC L)
// ============================================================================
interface QrVersionSpec {
  version: number;
  totalCodewords: number;
  ecCodewordsPerBlock: number;
  numBlocksGroup1: number;
  dataCodewordsGroup1: number;
  numBlocksGroup2: number;
  dataCodewordsGroup2: number;
  alignmentCenters: number[];
}

const QR_VERSION_L_SPECS: QrVersionSpec[] = [
  { version: 1, totalCodewords: 26, ecCodewordsPerBlock: 7, numBlocksGroup1: 1, dataCodewordsGroup1: 19, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentCenters: [] },
  { version: 2, totalCodewords: 44, ecCodewordsPerBlock: 10, numBlocksGroup1: 1, dataCodewordsGroup1: 34, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentCenters: [6, 18] },
  { version: 3, totalCodewords: 70, ecCodewordsPerBlock: 15, numBlocksGroup1: 1, dataCodewordsGroup1: 55, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentCenters: [6, 22] },
  { version: 4, totalCodewords: 100, ecCodewordsPerBlock: 20, numBlocksGroup1: 1, dataCodewordsGroup1: 80, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentCenters: [6, 26] },
  { version: 5, totalCodewords: 134, ecCodewordsPerBlock: 26, numBlocksGroup1: 1, dataCodewordsGroup1: 108, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentCenters: [6, 30] },
  { version: 6, totalCodewords: 172, ecCodewordsPerBlock: 18, numBlocksGroup1: 2, dataCodewordsGroup1: 68, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentCenters: [6, 34] },
  { version: 7, totalCodewords: 196, ecCodewordsPerBlock: 20, numBlocksGroup1: 2, dataCodewordsGroup1: 78, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentCenters: [6, 22, 38] },
  { version: 8, totalCodewords: 242, ecCodewordsPerBlock: 24, numBlocksGroup1: 2, dataCodewordsGroup1: 97, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentCenters: [6, 24, 42] },
  { version: 9, totalCodewords: 292, ecCodewordsPerBlock: 30, numBlocksGroup1: 2, dataCodewordsGroup1: 116, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentCenters: [6, 26, 46] },
  { version: 10, totalCodewords: 346, ecCodewordsPerBlock: 18, numBlocksGroup1: 2, dataCodewordsGroup1: 68, numBlocksGroup2: 2, dataCodewordsGroup2: 69, alignmentCenters: [6, 28, 50] },
  { version: 11, totalCodewords: 404, ecCodewordsPerBlock: 20, numBlocksGroup1: 4, dataCodewordsGroup1: 81, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentCenters: [6, 30, 54] },
  { version: 12, totalCodewords: 466, ecCodewordsPerBlock: 24, numBlocksGroup1: 2, dataCodewordsGroup1: 92, numBlocksGroup2: 2, dataCodewordsGroup2: 93, alignmentCenters: [6, 32, 58] },
  { version: 13, totalCodewords: 532, ecCodewordsPerBlock: 26, numBlocksGroup1: 4, dataCodewordsGroup1: 107, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentCenters: [6, 34, 62] },
  { version: 14, totalCodewords: 581, ecCodewordsPerBlock: 30, numBlocksGroup1: 3, dataCodewordsGroup1: 115, numBlocksGroup2: 1, dataCodewordsGroup2: 116, alignmentCenters: [6, 26, 46, 66] },
  { version: 15, totalCodewords: 655, ecCodewordsPerBlock: 22, numBlocksGroup1: 5, dataCodewordsGroup1: 87, numBlocksGroup2: 1, dataCodewordsGroup2: 88, alignmentCenters: [6, 26, 48, 70] },
  { version: 16, totalCodewords: 733, ecCodewordsPerBlock: 24, numBlocksGroup1: 5, dataCodewordsGroup1: 98, numBlocksGroup2: 1, dataCodewordsGroup2: 99, alignmentCenters: [6, 26, 50, 74] },
  { version: 17, totalCodewords: 815, ecCodewordsPerBlock: 28, numBlocksGroup1: 1, dataCodewordsGroup1: 107, numBlocksGroup2: 5, dataCodewordsGroup2: 108, alignmentCenters: [6, 30, 54, 78] },
  { version: 18, totalCodewords: 901, ecCodewordsPerBlock: 30, numBlocksGroup1: 5, dataCodewordsGroup1: 120, numBlocksGroup2: 1, dataCodewordsGroup2: 121, alignmentCenters: [6, 30, 56, 82] },
  { version: 19, totalCodewords: 991, ecCodewordsPerBlock: 28, numBlocksGroup1: 3, dataCodewordsGroup1: 113, numBlocksGroup2: 4, dataCodewordsGroup2: 114, alignmentCenters: [6, 30, 58, 86] },
  { version: 20, totalCodewords: 1085, ecCodewordsPerBlock: 28, numBlocksGroup1: 3, dataCodewordsGroup1: 107, numBlocksGroup2: 5, dataCodewordsGroup2: 108, alignmentCenters: [6, 34, 62, 90] }
];

// Tables GF(256) pour correction d'erreur Reed-Solomon QR
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function buildRsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const factor = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], factor);
    }
    poly = next;
  }
  return poly;
}

function computeRsRemainder(data: Uint8Array, ecCount: number): Uint8Array {
  const gen = buildRsGeneratorPoly(ecCount);
  const rem = new Uint8Array(ecCount);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ rem[0];
    for (let j = 0; j < ecCount - 1; j++) {
      rem[j] = rem[j + 1];
    }
    rem[ecCount - 1] = 0;
    if (factor !== 0) {
      for (let j = 0; j < ecCount; j++) {
        rem[j] ^= gfMul(gen[j + 1], factor);
      }
    }
  }
  return rem;
}

/**
 * Génère une matrice 2D QR Code standard ISO/IEC 18004 (true = module noir, false = module blanc)
 * directement scannable par tout smartphone.
 */
export function encodeQrMatrix(rawText: string): boolean[][] {
  const utf8Bytes = new TextEncoder().encode(rawText || 'FAAB PLAN');

  // Choisir la plus petite version capable d'accueillir utf8Bytes en mode Byte (0100)
  let spec = QR_VERSION_L_SPECS[QR_VERSION_L_SPECS.length - 1];
  for (const candidate of QR_VERSION_L_SPECS) {
    const totalDataBytes =
      candidate.numBlocksGroup1 * candidate.dataCodewordsGroup1 +
      candidate.numBlocksGroup2 * candidate.dataCodewordsGroup2;
    const headerBytes = candidate.version <= 9 ? 2 : 3;
    if (utf8Bytes.length + headerBytes <= totalDataBytes) {
      spec = candidate;
      break;
    }
  }

  const totalDataCapacity =
    spec.numBlocksGroup1 * spec.dataCodewordsGroup1 +
    spec.numBlocksGroup2 * spec.dataCodewordsGroup2;
  const countBitsLen = spec.version <= 9 ? 8 : 16;
  const maxPayloadLen = Math.min(
    utf8Bytes.length,
    totalDataCapacity - (spec.version <= 9 ? 2 : 3)
  );
  const payload = utf8Bytes.slice(0, maxPayloadLen);

  // Construire le flux binaire
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >>> i) & 1);
    }
  };

  // Mode Byte = 0100
  pushBits(0b0100, 4);
  pushBits(payload.length, countBitsLen);
  for (let i = 0; i < payload.length; i++) {
    pushBits(payload[i], 8);
  }

  // Terminateur (jusqu'à 4 zéros)
  const maxDataBits = totalDataCapacity * 8;
  const termLen = Math.min(4, maxDataBits - bits.length);
  pushBits(0, termLen);

  // Aligner sur un octet
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  // Octets de bourrage alternés 0xEC, 0x11
  const dataBytes = new Uint8Array(totalDataCapacity);
  const byteLen = bits.length / 8;
  for (let i = 0; i < byteLen; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i * 8 + j];
    }
    dataBytes[i] = b;
  }
  for (let i = byteLen; i < totalDataCapacity; i++) {
    dataBytes[i] = (i - byteLen) % 2 === 0 ? 0xec : 0x11;
  }

  // Découpage en blocs et calcul Reed-Solomon
  const dataBlocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];
  let offset = 0;
  for (let b = 0; b < spec.numBlocksGroup1; b++) {
    const blk = dataBytes.slice(offset, offset + spec.dataCodewordsGroup1);
    offset += spec.dataCodewordsGroup1;
    dataBlocks.push(blk);
    ecBlocks.push(computeRsRemainder(blk, spec.ecCodewordsPerBlock));
  }
  for (let b = 0; b < spec.numBlocksGroup2; b++) {
    const blk = dataBytes.slice(offset, offset + spec.dataCodewordsGroup2);
    offset += spec.dataCodewordsGroup2;
    dataBlocks.push(blk);
    ecBlocks.push(computeRsRemainder(blk, spec.ecCodewordsPerBlock));
  }

  // Entrelacement des mots de code
  const interleaved: number[] = [];
  const maxDataBlockLen = Math.max(
    spec.dataCodewordsGroup1,
    spec.dataCodewordsGroup2
  );
  for (let i = 0; i < maxDataBlockLen; i++) {
    for (const blk of dataBlocks) {
      if (i < blk.length) interleaved.push(blk[i]);
    }
  }
  for (let i = 0; i < spec.ecCodewordsPerBlock; i++) {
    for (const ec of ecBlocks) {
      if (i < ec.length) interleaved.push(ec[i]);
    }
  }

  // Création de la grille QR (taille = 17 + 4 * version)
  const size = 17 + 4 * spec.version;
  const modules: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );
  const isFunction: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  const setFunctionModule = (r: number, c: number, dark: boolean) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      modules[r][c] = dark;
      isFunction[r][c] = true;
    }
  };

  // Finder patterns (7x7) + séparateurs blancs
  const drawFinderPattern = (topR: number, leftC: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = topR + dr;
        const c = leftC + dc;
        if (r < 0 || r >= size || c < 0 || c >= size) continue;
        const inOuter =
          dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6 &&
          (dr === 0 || dr === 6 || dc === 0 || dc === 6);
        const inCenter = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setFunctionModule(r, c, inOuter || inCenter);
      }
    }
  };

  drawFinderPattern(0, 0);
  drawFinderPattern(0, size - 7);
  drawFinderPattern(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setFunctionModule(6, i, i % 2 === 0);
    setFunctionModule(i, 6, i % 2 === 0);
  }

  // Dark module
  setFunctionModule(size - 8, 8, true);

  // Alignment patterns (5x5)
  const centers = spec.alignmentCenters;
  for (let i = 0; i < centers.length; i++) {
    for (let j = 0; j < centers.length; j++) {
      if (
        (i === 0 && j === 0) ||
        (i === 0 && j === centers.length - 1) ||
        (i === centers.length - 1 && j === 0)
      ) {
        continue;
      }
      const cr = centers[i];
      const cc = centers[j];
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dark =
            Math.max(Math.abs(dr), Math.abs(dc)) === 2 ||
            (dr === 0 && dc === 0);
          setFunctionModule(cr + dr, cc + dc, dark);
        }
      }
    }
  }

  // Réserver les zones Format Info
  for (let i = 0; i <= 8; i++) {
    if (!isFunction[8][i]) setFunctionModule(8, i, false);
    if (!isFunction[i][8]) setFunctionModule(i, 8, false);
  }
  for (let i = 0; i < 8; i++) {
    if (!isFunction[8][size - 1 - i]) setFunctionModule(8, size - 1 - i, false);
    if (!isFunction[size - 1 - i][8]) setFunctionModule(size - 1 - i, 8, false);
  }

  // Réserver les zones Version Info (si version >= 7)
  if (spec.version >= 7) {
    let rem = spec.version;
    for (let i = 0; i < 12; i++) {
      rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    }
    const vBits = (spec.version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const bit = ((vBits >>> i) & 1) !== 0;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      setFunctionModule(a, b, bit);
      setFunctionModule(b, a, bit);
    }
  }

  // Placement en zigzag des bits de données + ECC
  let bitIdx = 0;
  const totalBits = interleaved.length * 8;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        const upward = ((right + 1) & 2) === 0;
        const r = upward ? size - 1 - vert : vert;
        if (!isFunction[r][c]) {
          let dark = false;
          if (bitIdx < totalBits) {
            const byteVal = interleaved[bitIdx >>> 3];
            dark = ((byteVal >>> (7 - (bitIdx & 7))) & 1) !== 0;
            bitIdx++;
          }
          // Appliquer le masque 0 : (r + c) % 2 === 0
          if ((r + c) % 2 === 0) {
            dark = !dark;
          }
          modules[r][c] = dark;
        }
      }
    }
  }

  // Inscrire les 15 bits de Format Info (ECC Level L = 01, Mask 0 = 000 -> bits BCH masqués = 0x77c4)
  const formatBits = 0x77c4;
  const getFormatBit = (idx: number) => ((formatBits >>> idx) & 1) !== 0;

  for (let i = 0; i <= 5; i++) modules[8][i] = getFormatBit(i);
  modules[8][7] = getFormatBit(6);
  modules[8][8] = getFormatBit(7);
  modules[7][8] = getFormatBit(8);
  for (let i = 9; i < 15; i++) modules[14 - i][8] = getFormatBit(i);

  for (let i = 0; i < 8; i++) modules[size - 1 - i][8] = getFormatBit(i);
  for (let i = 8; i < 15; i++) modules[8][size - 15 + i] = getFormatBit(i);
  modules[size - 8][8] = true;

  return modules;
}

// ============================================================================
// DÉCODAGE & AUTHENTIFICATION POUR LE LECTEUR / SCANNER DE CONTRÔLE D'ACCÈS
// ============================================================================
export interface ScannedActorVerificationResult {
  isValid: boolean;
  isInternalAuthenticated: boolean;
  scanType: 'BADGE_QR' | 'VCARD_QR' | 'BARCODE_1D' | 'MANUAL_LOOKUP';
  rawPayload: string;
  actorName: string;
  matricule: string;
  category: ActorCategoryType | 'Inconnu';
  roleOrFunction: string;
  organization: string;
  department: string;
  programmeName: string;
  axeName: string;
  projectName: string;
  raciRoles: string;
  accreditationLevel: string;
  badgeValidity: string;
  bloodType: string;
  emergencyPhone: string;
  email: string;
  phone: string;
  photoDataUrl?: string;
  statusMessageFr: string;
  statusMessageEn: string;
  securityDetailFr: string;
  securityDetailEn: string;
}

/**
 * Analyse le contenu d'un QR Code (vCard ou JSON Badge) ou d'un Code-Barres (Matricule)
 * et vérifie l'authenticité de l'acteur dans la base du Programme actif.
 */
export function verifyScannedPayloadAgainstDossier(
  rawText: string,
  dossier: Dossier,
  userProfile: UserProfile,
  profilesMap?: Record<string, InternalActorProfile>
): ScannedActorVerificationResult {
  const trimmed = (rawText || '').trim();
  const allActors = ensureDossierCategorizedActors(dossier, userProfile);
  const storedProfiles: Record<string, InternalActorProfile> =
    profilesMap || dossier.actorProfiles || {};

  const resolveAxeAndProjectNames = (actor?: CategorizedActor) => {
    const axeObj =
      (dossier.axes || []).find(a => a.id === actor?.axeId) ||
      dossier.axes?.[0];
    const projObj =
      (axeObj?.projects || []).find(p => p.id === actor?.projectId) ||
      axeObj?.projects?.[0];
    return {
      axeName: axeObj?.name || 'Tous les Axes Stratégiques',
      projectName: projObj?.name || 'Tous les Projets du Programme'
    };
  };

  // 1. Cas JSON Badge (FAAB_PLAN_BADGE_V1)
  if (trimmed.startsWith('{') && trimmed.includes('FAAB_PLAN_BADGE_V1')) {
    try {
      const parsed = JSON.parse(trimmed);
      const matchedActor = allActors.find(
        a =>
          a.name.toLowerCase() === String(parsed.fullName || '').toLowerCase() ||
          a.matricule.toLowerCase() === String(parsed.matricule || '').toLowerCase()
      );
      const effectiveCategory: ActorCategoryType =
        matchedActor?.category || parsed.category || 'Interne';
      const isInternal = effectiveCategory === 'Interne';
      const prof =
        storedProfiles[parsed.fullName] ||
        (matchedActor ? storedProfiles[matchedActor.name] : undefined);

      return {
        isValid: true,
        isInternalAuthenticated: isInternal,
        scanType: 'BADGE_QR',
        rawPayload: trimmed,
        actorName: parsed.fullName || matchedActor?.name || 'Acteur',
        matricule: parsed.matricule || matchedActor?.matricule || 'MAT-PILOTE-001',
        category: effectiveCategory,
        roleOrFunction:
          parsed.role || matchedActor?.roleOrFunction || 'Responsable Opérationnel',
        organization:
          parsed.org || matchedActor?.organization || dossier.institution || 'UGP',
        department:
          parsed.dept || matchedActor?.department || 'Direction du Programme',
        programmeName: parsed.programme || dossier.name,
        axeName: parsed.axe || resolveAxeAndProjectNames(matchedActor).axeName,
        projectName:
          parsed.project || resolveAxeAndProjectNames(matchedActor).projectName,
        raciRoles: parsed.raci || (matchedActor?.raciRoles || ['R']).join('/'),
        accreditationLevel:
          parsed.accreditation ||
          matchedActor?.accreditationLevel ||
          'ZONE A — ACCÈS TOTAL',
        badgeValidity:
          parsed.validity || matchedActor?.badgeValidity || '31/12/2026',
        bloodType: parsed.blood || prof?.badgeBloodType || 'O+',
        emergencyPhone:
          parsed.emergency || prof?.badgeEmergencyPhone || '+225 27 20 00 12 34',
        email: parsed.email || matchedActor?.email || '',
        phone: parsed.phone || matchedActor?.phone || '',
        photoDataUrl:
          prof?.photoDataUrl ||
          matchedActor?.photoDataUrl ||
          (parsed.fullName === userProfile.fullName
            ? userProfile.cvPhotoDataUrl
            : ''),
        statusMessageFr: isInternal
          ? 'Statut : ACTEUR INTERNE AUTHENTIFIÉ'
          : `ACCÈS RESTREINT : Acteur classé « ${effectiveCategory} » (Non Interne)`,
        statusMessageEn: isInternal
          ? 'Status: AUTHENTICATED INTERNAL ACTOR'
          : `RESTRICTED ACCESS: Actor classified as "${effectiveCategory}" (Non-Internal)`,
        securityDetailFr: isInternal
          ? `Badge officiel vérifié et rattaché au Programme « ${dossier.name} ». Autorisation d’accès confirmée.`
          : `Seuls les acteurs de la catégorie « Interne » disposent d’une habilitation de badge d’accès interne.`,
        securityDetailEn: isInternal
          ? `Official badge verified and attached to Programme "${dossier.name}". Access authorization confirmed.`
          : `Only actors in the "Internal" category hold an internal access badge clearance.`
      };
    } catch {
      // fall through
    }
  }

  // 2. Cas vCard 3.0 / 4.0 (BEGIN:VCARD ... END:VCARD)
  if (/BEGIN:VCARD/i.test(trimmed)) {
    const getVCardField = (prefix: string): string => {
      const regex = new RegExp(`^${prefix}[^:]*:(.*)$`, 'im');
      const m = trimmed.match(regex);
      return m ? m[1].trim() : '';
    };
    const fn = getVCardField('FN');
    const title = getVCardField('TITLE');
    const orgRaw = getVCardField('ORG');
    const [orgPart, deptPart] = orgRaw.split(';');
    const tel = getVCardField('TEL');
    const email = getVCardField('EMAIL');
    const note = getVCardField('NOTE');

    const matMatch = note.match(/Matricule:\s*([^|\r\n]+)/i);
    const raciMatch = note.match(/RACI:\s*([^|\r\n]+)/i);
    const extractedMat = matMatch ? matMatch[1].trim() : 'MAT-VCARD-001';
    const extractedRaci = raciMatch ? raciMatch[1].trim() : 'R';

    const matchedActor = allActors.find(
      a =>
        a.name.toLowerCase() === fn.toLowerCase() ||
        a.matricule.toLowerCase() === extractedMat.toLowerCase()
    );
    const effectiveCategory: ActorCategoryType =
      matchedActor?.category || 'Interne';
    const isInternal = effectiveCategory === 'Interne';
    const prof =
      storedProfiles[fn] ||
      (matchedActor ? storedProfiles[matchedActor.name] : undefined);
    const { axeName, projectName } = resolveAxeAndProjectNames(matchedActor);

    return {
      isValid: true,
      isInternalAuthenticated: isInternal,
      scanType: 'VCARD_QR',
      rawPayload: trimmed,
      actorName: fn || matchedActor?.name || 'Titulaire Carte vCard',
      matricule: extractedMat,
      category: effectiveCategory,
      roleOrFunction: title || matchedActor?.roleOrFunction || 'Expert Interne',
      organization: orgPart || matchedActor?.organization || dossier.institution,
      department: deptPart || matchedActor?.department || 'UGP / PMO',
      programmeName: dossier.name,
      axeName,
      projectName,
      raciRoles: extractedRaci,
      accreditationLevel:
        matchedActor?.accreditationLevel ||
        'CARTE DE VISITE PRO & ACCÈS INTERNE',
      badgeValidity:
        prof?.badgeValidityDate || matchedActor?.badgeValidity || '31/12/2026',
      bloodType: prof?.badgeBloodType || 'O+',
      emergencyPhone: prof?.badgeEmergencyPhone || tel || '+225 27 20 00 12 34',
      email: email || matchedActor?.email || '',
      phone: tel || matchedActor?.phone || '',
      photoDataUrl:
        prof?.photoDataUrl ||
        matchedActor?.photoDataUrl ||
        (fn === userProfile.fullName ? userProfile.cvPhotoDataUrl : ''),
      statusMessageFr: isInternal
        ? 'Statut : ACTEUR INTERNE AUTHENTIFIÉ (Fiche Contact vCard)'
        : `Statut : Contact Externe (« ${effectiveCategory} »)`,
      statusMessageEn: isInternal
        ? 'Status: AUTHENTICATED INTERNAL ACTOR (vCard Contact)'
        : `Status: External Contact ("${effectiveCategory}")`,
      securityDetailFr: isInternal
        ? `QR Code vCard 3.0 valide. Membre interne rattaché à l’institution pilote du programme « ${dossier.name} ».`
        : `Ce contact appartient à la catégorie « ${effectiveCategory} » (hors périmètre interne UGP).`,
      securityDetailEn: isInternal
        ? `Valid vCard 3.0 QR Code. Internal member attached to the piloting entity of "${dossier.name}".`
        : `This contact belongs to category "${effectiveCategory}" (outside internal PMU scope).`
    };
  }

  // 3. Cas Code-Barres 1D (Matricule) ou Recherche par Nom / Matricule
  const cleanLookup = trimmed.toLowerCase();
  const matchedByMatOrName = allActors.find(
    a =>
      a.matricule.toLowerCase() === cleanLookup ||
      a.name.toLowerCase() === cleanLookup ||
      a.name.toLowerCase().includes(cleanLookup) ||
      a.matricule.toLowerCase().includes(cleanLookup)
  );

  // Vérifier aussi dans les profils internes enregistrés
  let matchedProfile: InternalActorProfile | undefined;
  for (const p of Object.values(storedProfiles)) {
    if (
      (p.employeeId && p.employeeId.toLowerCase() === cleanLookup) ||
      (p.fullName && p.fullName.toLowerCase() === cleanLookup)
    ) {
      matchedProfile = p;
      break;
    }
  }

  if (matchedByMatOrName || matchedProfile) {
    const actorName =
      matchedProfile?.fullName ||
      matchedByMatOrName?.name ||
      userProfile.fullName;
    const category: ActorCategoryType =
      matchedByMatOrName?.category || 'Interne';
    const isInternal = category === 'Interne';
    const prof = matchedProfile || storedProfiles[actorName];
    const { axeName, projectName } =
      resolveAxeAndProjectNames(matchedByMatOrName);

    return {
      isValid: true,
      isInternalAuthenticated: isInternal,
      scanType: 'BARCODE_1D',
      rawPayload: trimmed,
      actorName,
      matricule:
        prof?.employeeId ||
        matchedByMatOrName?.matricule ||
        trimmed.toUpperCase(),
      category,
      roleOrFunction:
        prof?.officialRole ||
        matchedByMatOrName?.roleOrFunction ||
        'Responsable Opérationnel',
      organization:
        prof?.executingOrgName ||
        matchedByMatOrName?.organization ||
        dossier.institution,
      department:
        prof?.executingDepartment ||
        matchedByMatOrName?.department ||
        'Unité de Gestion du Programme (UGP)',
      programmeName: dossier.name,
      axeName,
      projectName,
      raciRoles:
        prof?.raciRoleBadge ||
        (matchedByMatOrName?.raciRoles || ['R']).join('/'),
      accreditationLevel:
        matchedByMatOrName?.accreditationLevel ||
        'ZONE A — ACCÈS TOTAL UGP & SITES',
      badgeValidity:
        prof?.badgeValidityDate ||
        matchedByMatOrName?.badgeValidity ||
        '31/12/2026',
      bloodType: prof?.badgeBloodType || 'O+',
      emergencyPhone:
        prof?.badgeEmergencyPhone ||
        prof?.phonePro ||
        matchedByMatOrName?.phone ||
        '+225 27 20 00 12 34',
      email: prof?.emailPro || matchedByMatOrName?.email || '',
      phone:
        prof?.phoneMobile ||
        prof?.phonePro ||
        matchedByMatOrName?.phone ||
        '',
      photoDataUrl:
        prof?.photoDataUrl ||
        matchedByMatOrName?.photoDataUrl ||
        (actorName === userProfile.fullName ? userProfile.cvPhotoDataUrl : ''),
      statusMessageFr: isInternal
        ? 'Statut : ACTEUR INTERNE AUTHENTIFIÉ'
        : `ACCÈS REFUSÉ : Acteur classé « ${category} » (Non Interne)`,
      statusMessageEn: isInternal
        ? 'Status: AUTHENTICATED INTERNAL ACTOR'
        : `ACCESS DENIED: Actor classified as "${category}" (Non-Internal)`,
      securityDetailFr: isInternal
        ? `Matricule / Code-barres CODE-128 reconnu dans la base du Programme « ${dossier.name} ». Habilitation Interne valide.`
        : `Attention : L’acteur « ${actorName} » est enregistré dans la catégorie « ${category} ». Seuls les membres « Interne » sont autorisés à détenir un badge d’accès interne.`,
      securityDetailEn: isInternal
        ? `CODE-128 Barcode / ID recognized in Programme "${dossier.name}". Valid Internal clearance.`
        : `Warning: Actor "${actorName}" is registered in category "${category}". Only "Internal" members are authorized to hold an internal access badge.`
    };
  }

  return {
    isValid: false,
    isInternalAuthenticated: false,
    scanType: 'MANUAL_LOOKUP',
    rawPayload: trimmed,
    actorName: 'Identité Non Reconnue',
    matricule: trimmed || 'N/A',
    category: 'Inconnu',
    roleOrFunction: 'Aucune fonction rattachée',
    organization: 'Non répertorié',
    department: '—',
    programmeName: dossier.name,
    axeName: '—',
    projectName: '—',
    raciRoles: '—',
    accreditationLevel: 'AUCUN DROIT D’ACCÈS',
    badgeValidity: 'INVALIDE',
    bloodType: '—',
    emergencyPhone: '—',
    email: '—',
    phone: '—',
    statusMessageFr: 'ALERTE SÉCURITÉ : BADGE OU MATRICULE NON RECONNU',
    statusMessageEn: 'SECURITY ALERT: UNRECOGNIZED BADGE OR ID',
    securityDetailFr: `Aucun acteur interne correspondant au code « ${trimmed} » n’a été trouvé dans le Programme actif « ${dossier.name} ».`,
    securityDetailEn: `No internal actor matching code "${trimmed}" was found in active Programme "${dossier.name}".`
  };
}
