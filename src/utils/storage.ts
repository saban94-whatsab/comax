import { Driver, WorkOrder, DocumentScan, AppsScriptConfig } from '../types';

const KEYS = {
  DRIVER: 'delivery_app_driver',
  WORK_ORDERS: 'delivery_app_work_orders',
  OUTBOX: 'delivery_app_outbox_queue',
  CONFIG: 'delivery_app_script_config',
  RECENT_SCANS: 'delivery_app_recent_scans',
};

// Preset Israeli drivers list
export const INITIAL_DRIVERS: Driver[] = [
  { id: '1', name: 'חכמת', phone: '050-1234567', avatar: '👨‍✈️' },
  { id: '2', name: 'עלי', phone: '052-9876543', avatar: '🚛' },
  { id: '3', name: 'דניאל', phone: '054-5551234', avatar: '🚚' },
  { id: '4', name: 'יוסי', phone: '053-4449876', avatar: '📦' },
];

// Default Initial Open Work Orders ("סידור עבודה פתוח")
export const INITIAL_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'wo-101',
    orderNumber: 'INV-90421',
    clientName: 'שופרסל מרלו"ג ראשל"צ',
    address: 'אזור תעשייה חדש, ראשון לציון',
    status: 'pending',
    itemsCount: 14,
    deliveryDate: '2026-07-30',
    notes: 'פריקה ברציף 4, לתאם מול מנהל משמרת',
  },
  {
    id: 'wo-102',
    orderNumber: 'INV-90422',
    clientName: 'רמי לוי סניף מודיעין',
    address: 'שדרות המלאכות 12, מודיעין',
    status: 'pending',
    itemsCount: 8,
    deliveryDate: '2026-07-30',
    notes: 'משטח קירור + משטח יבש',
  },
  {
    id: 'wo-103',
    orderNumber: 'INV-90423',
    clientName: 'הום סנטר ב"ש',
    address: 'מתחם ביג, באר שבע',
    status: 'pending',
    itemsCount: 22,
    deliveryDate: '2026-07-30',
    notes: 'נדרשת חתימת מנהל מחלקה',
  },
  {
    id: 'wo-104',
    orderNumber: 'INV-90424',
    clientName: 'מחסני תאורה אשדוד',
    address: 'רחוב הבושם 8, אשדוד',
    status: 'pending',
    itemsCount: 5,
    deliveryDate: '2026-07-30',
  },
];

// Driver session management
export function getSavedDriver(): Driver | null {
  try {
    const data = localStorage.getItem(KEYS.DRIVER);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveDriverSession(driver: Driver): void {
  try {
    localStorage.setItem(KEYS.DRIVER, JSON.stringify(driver));
  } catch (e) {
    console.error('Error saving driver session', e);
  }
}

export function clearDriverSession(): void {
  localStorage.removeItem(KEYS.DRIVER);
}

// Work Orders management
export function getWorkOrders(): WorkOrder[] {
  try {
    const data = localStorage.getItem(KEYS.WORK_ORDERS);
    if (!data) {
      localStorage.setItem(KEYS.WORK_ORDERS, JSON.stringify(INITIAL_WORK_ORDERS));
      return INITIAL_WORK_ORDERS;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_WORK_ORDERS;
  }
}

export function saveWorkOrders(orders: WorkOrder[]): void {
  try {
    localStorage.setItem(KEYS.WORK_ORDERS, JSON.stringify(orders));
  } catch (e) {
    console.error('Error saving work orders', e);
  }
}

export function markWorkOrderScanned(orderNumber: string): void {
  const orders = getWorkOrders();
  const updated = orders.map((o) =>
    o.orderNumber.trim().toLowerCase() === orderNumber.trim().toLowerCase()
      ? { ...o, status: 'scanned' as const }
      : o
  );
  saveWorkOrders(updated);
}

// Config management
export function getAppsScriptConfig(): AppsScriptConfig {
  try {
    const data = localStorage.getItem(KEYS.CONFIG);
    if (!data) {
      return { webhookUrl: '', autoSync: true };
    }
    return JSON.parse(data);
  } catch {
    return { webhookUrl: '', autoSync: true };
  }
}

export function saveAppsScriptConfig(config: AppsScriptConfig): void {
  localStorage.setItem(KEYS.CONFIG, JSON.stringify(config));
}

// Offline Outbox Queue management
export function getOutboxQueue(): DocumentScan[] {
  try {
    const data = localStorage.getItem(KEYS.OUTBOX);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveOutboxQueue(queue: DocumentScan[]): void {
  try {
    localStorage.setItem(KEYS.OUTBOX, JSON.stringify(queue));
  } catch (e) {
    console.error('Error saving outbox queue', e);
  }
}

export function addToOutbox(scan: DocumentScan): void {
  const queue = getOutboxQueue();
  queue.push(scan);
  saveOutboxQueue(queue);
}

export function removeFromOutbox(scanId: string): void {
  const queue = getOutboxQueue().filter((s) => s.id !== scanId);
  saveOutboxQueue(queue);
}

// Recent Scans history log
export function getRecentScans(): DocumentScan[] {
  try {
    const data = localStorage.getItem(KEYS.RECENT_SCANS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveRecentScan(scan: DocumentScan): void {
  const scans = getRecentScans();
  const filtered = scans.filter((s) => s.id !== scan.id);
  filtered.unshift(scan);
  // Keep last 30
  localStorage.setItem(KEYS.RECENT_SCANS, JSON.stringify(filtered.slice(0, 30)));
}
