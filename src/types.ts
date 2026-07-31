export interface Driver {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
}

export interface WorkOrder {
  id: string;
  orderNumber: string;
  clientName: string;
  address: string;
  status: 'pending' | 'scanned' | 'delivered';
  itemsCount: number;
  deliveryDate?: string;
  notes?: string;
}

export type FilterMode = 'bw' | 'grayscale' | 'contrast' | 'original';

export interface CropRect {
  x: number; // percentage 0-100
  y: number;
  width: number;
  height: number;
}

export interface DocumentScan {
  id: string;
  driverName: string;
  orderNumber: string;
  clientName?: string;
  originalImageBase64: string;
  processedImageBase64: string;
  filterMode: FilterMode;
  cropRect: CropRect;
  rotation: number; // 0, 90, 180, 270
  pdfBase64?: string;
  status: 'pending_sync' | 'synced' | 'failed';
  timestamp: string;
  driveLink?: string;
  isOffline?: boolean;
  ocrData?: {
    deliveryNoteNumber?: string;
    clientName?: string;
    deliveryDate?: string;
    itemsSummary?: string;
  };
}

export interface AppsScriptConfig {
  webhookUrl: string;
  autoSync: boolean;
  folderId?: string;
  sheetUrl?: string;
}
