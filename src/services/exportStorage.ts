/**
 * FAAB PLAN - Export & Local Storage Management Service
 * 
 * Règle stricte :
 * 1. Création / Utilisation du dossier racine : "faab-plan"
 * 2. Sous-dossier au nom du programme actif : "faab-plan/{Nom du Programme}/"
 * 3. Si le nom du programme est différent : création d'un nouveau sous-dossier au nom du programme.
 * 4. Si le nom du programme est identique : écrasement et remplacement automatique du fichier le plus ancien
 *    par la dernière version enregistrée (AUCUN ajout de suffixes "1", "2", "3"...).
 * 5. Tous les types d'exports partagent cette même règle et vont dans le même sous-dossier de programme :
 *    - JSON : faab_plan_{slug}.json
 *    - CSV : FAAB_PLAN_Planification_{slug}.csv, FAAB_PLAN_Matrice_RACI_{slug}.csv
 *    - PDF : FAAB_PLAN_Fiche_Technique_*.pdf, FAAB_PLAN_{DocType}_*.pdf, Slides 16:9, Badges, etc.
 */

import JSZip from 'jszip';

const DB_NAME = 'faab_plan_export_fs_v2';
const STORE_NAME = 'fs_handles';
const ROOT_HANDLE_KEY = 'faab_root_handle_v2';
const VFS_STORE_NAME = 'faab_vfs_files';

let memoryDirectoryHandle: any = null;
let isInitializingHandle = false;

/**
 * Nettoie le nom de programme pour créer un sous-dossier valide sur tous les systèmes de fichiers (Windows, Mac, Linux)
 */
export function sanitizeProgramFolderName(name: string): string {
  const cleaned = (name || 'Programme')
    .trim()
    .replace(/[\\/:*?"<>|\x00-\x1F]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || 'Programme';
}

/**
 * Nettoie le nom de fichier pour un stockage propre
 */
export function sanitizeFileName(name: string): string {
  const cleaned = (name || 'export')
    .trim()
    .replace(/[\\/:*?"<>|\x00-\x1F]/g, '_')
    .trim();
  return cleaned || 'export';
}

/**
 * Ouvre ou initialise la base IndexedDB
 */
function openHandleDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB non supporté'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 2);
    req.onupgradeneeded = (evt: any) => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(VFS_STORE_NAME)) {
        db.createObjectStore(VFS_STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Mémorise le handle du dossier en mémoire vive et dans IndexedDB
 */
export async function storeDirectoryHandle(handle: any): Promise<void> {
  memoryDirectoryHandle = handle;
  try {
    const db = await openHandleDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(handle, ROOT_HANDLE_KEY);
  } catch {
    // Si IndexedDB ne sérialise pas le handle sur ce navigateur, le cache mémoire reste actif
  }
}

/**
 * Précharge le handle stocké au démarrage de l'application (sans bloquer le fil d'exécution)
 */
export async function initExportStorage(): Promise<void> {
  if (memoryDirectoryHandle || isInitializingHandle) return;
  isInitializingHandle = true;
  try {
    const db = await openHandleDb();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(ROOT_HANDLE_KEY);
    req.onsuccess = () => {
      if (req.result) {
        memoryDirectoryHandle = req.result;
      }
      isInitializingHandle = false;
    };
    req.onerror = () => {
      isInitializingHandle = false;
    };
  } catch {
    isInitializingHandle = false;
  }
}

/**
 * Récupère le handle mémorisé (priorité absolue à la mémoire pour éviter de perdre le geste utilisateur)
 */
export function getStoredDirectoryHandleSync(): any | null {
  return memoryDirectoryHandle;
}

export async function getStoredDirectoryHandle(): Promise<any | null> {
  if (memoryDirectoryHandle) return memoryDirectoryHandle;
  try {
    const db = await openHandleDb();
    return new Promise(resolve => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(ROOT_HANDLE_KEY);
      req.onsuccess = () => {
        memoryDirectoryHandle = req.result || null;
        resolve(memoryDirectoryHandle);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Enregistre un fichier dans le VFS (Virtual File System) local IndexedDB pour ce programme.
 * Permet l'écrasement systématique sans suffixe (1, 2) et l'exportation en ZIP de l'arborescence complète faab-plan/{programme}/.
 */
interface VfsRecord {
  id: string; // "programme/fileName"
  programFolder: string;
  fileName: string;
  mimeType: string;
  blob: Blob;
  updatedAt: number;
}

async function recordFileInVfs(
  programFolder: string,
  fileName: string,
  blob: Blob,
  mimeType: string
): Promise<void> {
  try {
    const db = await openHandleDb();
    const tx = db.transaction(VFS_STORE_NAME, 'readwrite');
    const store = tx.objectStore(VFS_STORE_NAME);
    const id = `${programFolder}/${fileName}`;
    const record: VfsRecord = {
      id,
      programFolder,
      fileName,
      mimeType,
      blob,
      updatedAt: Date.now()
    };
    store.put(record);
  } catch (err) {
    console.warn('VFS record warning:', err);
  }
}

/**
 * Récupère la liste de tous les fichiers du VFS pour un programme donné
 */
export async function getVfsFilesForProgram(programName: string): Promise<VfsRecord[]> {
  const safeProgFolder = sanitizeProgramFolderName(programName);
  try {
    const db = await openHandleDb();
    return new Promise(resolve => {
      const tx = db.transaction(VFS_STORE_NAME, 'readonly');
      const store = tx.objectStore(VFS_STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const list: VfsRecord[] = (req.result || []).filter(
          (r: VfsRecord) => r.programFolder === safeProgFolder
        );
        resolve(list);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Permet à l'utilisateur de sélectionner explicitement le dossier de travail sur son disque
 */
export async function pickFaabPlanFolder(): Promise<any | null> {
  if (typeof (window as any).showDirectoryPicker !== 'function') {
    return null;
  }
  try {
    const handle = await (window as any).showDirectoryPicker({
      id: 'faab-plan-workspace',
      mode: 'readwrite',
      startIn: 'documents'
    });
    if (handle) {
      await storeDirectoryHandle(handle);
      return handle;
    }
  } catch (err: any) {
    if (err?.name === 'SecurityError') {
      console.warn('Iframe restriction on showDirectoryPicker:', err);
    }
  }
  return null;
}

/**
 * Déconnecte le handle de dossier stocké
 */
export async function disconnectFaabPlanFolder(): Promise<void> {
  memoryDirectoryHandle = null;
  try {
    const db = await openHandleDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(ROOT_HANDLE_KEY);
  } catch {
    // ignore
  }
}

export function isDirectDiskAccessSupported(): boolean {
  return typeof (window as any).showDirectoryPicker === 'function';
}

export function isDirectDiskAccessConnected(): boolean {
  return Boolean(memoryDirectoryHandle);
}

export function getConnectedFolderName(): string | null {
  return memoryDirectoryHandle?.name || null;
}

export interface SaveProgramFileOptions {
  programName: string;
  fileName: string;
  content: string | Blob | Uint8Array;
  mimeType: string;
}

export interface SaveProgramFileResult {
  success: boolean;
  mode: 'directory' | 'savepicker' | 'download';
  path: string;
  fileName: string;
  warning?: string;
}

/**
 * Enregistre un fichier (JSON, CSV, PDF) selon la règle stricte :
 *
 * Dossier racine : "faab-plan"
 *   └── Sous-dossier : "{Nom du Programme}"
 *       └── Fichier : "{Nom du Fichier}"
 *
 * 1. Si le nom du programme est différent -> création d'un nouveau sous-dossier avec le nom du programme.
 * 2. Si le nom du programme est identique -> écrasement et remplacement du fichier le plus ancien
 *    par le dernier fichier enregistré (aucun suffixe "1", "2", "3"...).
 * 3. Écriture directe sur le disque local via File System Access API lorsque le dossier est accessible.
 * 4. Fallback intelligent en environnement restreint (ex: iframe) garantissant le respect de l'arborescence.
 */
export async function saveProgramFile(
  options: SaveProgramFileOptions
): Promise<SaveProgramFileResult> {
  const { programName, fileName, content, mimeType } = options;
  const safeProgFolder = sanitizeProgramFolderName(programName);
  const cleanName = sanitizeFileName(fileName);
  const logicalPath = `faab-plan/${safeProgFolder}/${cleanName}`;

  // Préparation du Blob binaire propre
  let blob: Blob;
  if (content instanceof Blob) {
    blob = content;
  } else if (typeof content === 'string') {
    blob = new Blob([content], { type: mimeType });
  } else {
    blob = new Blob([content as any], { type: mimeType });
  }

  // Enregistrement dans le VFS persistant (écrase toujours l'ancienne version sous la même clé id)
  await recordFileInVfs(safeProgFolder, cleanName, blob, mimeType);

  // 1. TENTATIVE D'ÉCRITURE DIRECTE DANS LE DOSSIER SUR DISQUE
  if (typeof (window as any).showDirectoryPicker === 'function') {
    try {
      let rootHandle = memoryDirectoryHandle;

      // Si le handle n'est pas encore en mémoire, le demander directement (geste utilisateur actif)
      if (!rootHandle) {
        try {
          rootHandle = await (window as any).showDirectoryPicker({
            id: 'faab-plan-workspace',
            mode: 'readwrite',
            startIn: 'documents'
          });
          if (rootHandle) {
            await storeDirectoryHandle(rootHandle);
          }
        } catch (pickErr: any) {
          // L'utilisateur a annulé ou la sous-fenêtre iframe a bloqué le picker
          if (pickErr?.name !== 'AbortError') {
            console.warn('showDirectoryPicker prompt error:', pickErr);
          }
        }
      }

      if (rootHandle) {
        // Vérification / Demande des permissions lecture-écriture
        try {
          if (typeof rootHandle.queryPermission === 'function') {
            let qPerm = await rootHandle.queryPermission({ mode: 'readwrite' });
            if (qPerm !== 'granted' && typeof rootHandle.requestPermission === 'function') {
              qPerm = await rootHandle.requestPermission({ mode: 'readwrite' });
              if (qPerm !== 'granted') {
                rootHandle = null;
              }
            }
          }
        } catch {
          // ignore
        }
      }

      if (rootHandle) {
        // A. Dossier racine "faab-plan"
        let faabPlanDir: any;
        if (rootHandle.name.toLowerCase() === 'faab-plan') {
          faabPlanDir = rootHandle;
        } else {
          faabPlanDir = await rootHandle.getDirectoryHandle('faab-plan', { create: true });
        }

        // B. Sous-dossier au nom du programme actif (crée si nouveau, ouvre si existant)
        const progDir = await faabPlanDir.getDirectoryHandle(safeProgFolder, { create: true });

        // C. Fichier cible : create: true + keepExistingData: false
        // RÈGLE : Écrase et remplace le fichier le plus ancien sans renommer ni ajouter (1), (2)...
        const fileHandle = await progDir.getFileHandle(cleanName, { create: true });
        const writable = await fileHandle.createWritable({ keepExistingData: false });
        await writable.write(blob);
        await writable.close();

        return {
          success: true,
          mode: 'directory',
          path: logicalPath,
          fileName: cleanName
        };
      }
    } catch (fsErr: any) {
      console.warn('Écriture directe File System Access non autorisée ou échouée:', fsErr);
    }
  }

  // 2. TENTATIVE VIA showSaveFilePicker (permet à l'OS d'écraser le fichier sans ajouter "(1)", "(2)")
  if (typeof (window as any).showSaveFilePicker === 'function') {
    try {
      const ext = cleanName.includes('.') ? '.' + cleanName.split('.').pop() : '';
      const saveHandle = await (window as any).showSaveFilePicker({
        suggestedName: cleanName,
        types: [
          {
            description: cleanName.endsWith('.json')
              ? 'Fichier JSON FAAB PLAN'
              : cleanName.endsWith('.csv')
              ? 'Fichier CSV FAAB PLAN'
              : 'Fichier PDF FAAB PLAN',
            accept: { [mimeType.split(';')[0]]: [ext || '.bin'] }
          }
        ]
      });

      if (saveHandle) {
        const writable = await saveHandle.createWritable({ keepExistingData: false });
        await writable.write(blob);
        await writable.close();

        return {
          success: true,
          mode: 'savepicker',
          path: logicalPath,
          fileName: cleanName
        };
      }
    } catch (saveErr: any) {
      if (saveErr?.name !== 'AbortError') {
        console.warn('showSaveFilePicker error:', saveErr);
      }
    }
  }

  // 3. FALLBACK : Téléchargement navigateur direct
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = cleanName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);

    return {
      success: true,
      mode: 'download',
      path: logicalPath,
      fileName: cleanName,
      warning:
        "Téléchargement direct du navigateur effectué. Pour que le dossier « faab-plan/{programme} » se crée automatiquement sur votre disque et écrase directement les anciens fichiers sans créer de doublons (1, 2...), ouvrez l'application dans un onglet autonome (Chrome autorise l'accès disque direct)."
    };
  } catch (err: any) {
    return {
      success: false,
      mode: 'download',
      path: logicalPath,
      fileName: cleanName
    };
  }
}

/**
 * Exporte l'ensemble des fichiers générés pour ce programme sous forme d'archive ZIP
 * structurée exactement selon la hiérarchie demandée :
 *
 * faab-plan/
 *   └── {Nom du Programme}/
 *         ├── FAAB_PLAN_*.json
 *         ├── FAAB_PLAN_Planification_*.csv
 *         ├── FAAB_PLAN_Matrice_RACI_*.csv
 *         └── FAAB_PLAN_*.pdf
 *
 * Une fois décompressé sur le disque de l'utilisateur, ce dossier écrase automatiquement
 * les versions antérieures sans créer de doublons.
 */
export async function downloadProgramFolderZip(programName: string): Promise<boolean> {
  const safeProgFolder = sanitizeProgramFolderName(programName);
  const files = await getVfsFilesForProgram(safeProgFolder);

  if (!files || files.length === 0) {
    return false;
  }

  const zip = new JSZip();
  const rootDir = zip.folder('faab-plan');
  const progDir = rootDir?.folder(safeProgFolder);

  files.forEach(f => {
    progDir?.file(f.fileName, f.blob);
  });

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `faab-plan_${safeProgFolder}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);

  return true;
}
