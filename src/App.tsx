import React, { useState, useEffect } from 'react';
import {
  Driver,
  WorkOrder,
  DocumentScan,
  AppsScriptConfig,
  FilterMode,
  CropRect,
} from './types';
import {
  getSavedDriver,
  getWorkOrders,
  saveWorkOrders,
  markWorkOrderScanned,
  getAppsScriptConfig,
  saveAppsScriptConfig,
  getOutboxQueue,
  saveOutboxQueue,
  addToOutbox,
  removeFromOutbox,
  getRecentScans,
  saveRecentScan,
} from './utils/storage';
import { generateDocumentPdf } from './utils/pdfGenerator';
import { Header } from './components/Header';
import { DriverLoginModal } from './components/DriverLoginModal';
import { WorkOrderSelector } from './components/WorkOrderSelector';
import { CameraScanner } from './components/CameraScanner';
import { ScanPreviewEdit } from './components/ScanPreviewEdit';
import { AppsScriptModal } from './components/AppsScriptModal';
import { OfflineOutboxDrawer } from './components/OfflineOutboxDrawer';
import { ScansHistoryModal } from './components/ScansHistoryModal';
import { SuccessStatusNotification } from './components/SuccessStatusNotification';
import { Truck, CheckCircle2, CloudUpload, History, Layers } from 'lucide-react';

export default function App() {
  // State initialization
  const [driver, setDriver] = useState<Driver | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string>('INV-90421');
  const [capturedImageBase64, setCapturedImageBase64] = useState<string | null>(null);

  // Connection & Queue State
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [outboxQueue, setOutboxQueue] = useState<DocumentScan[]>([]);
  const [recentScans, setRecentScans] = useState<DocumentScan[]>([]);
  const [appsScriptConfig, setAppsScriptConfig] = useState<AppsScriptConfig>({
    webhookUrl: '',
    autoSync: true,
  });

  // UI Modals
  const [showDriverModal, setShowDriverModal] = useState<boolean>(false);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [showOutboxModal, setShowOutboxModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  // Upload Notification Modal state
  const [notification, setNotification] = useState<{
    status: 'syncing' | 'success' | 'offline_saved' | 'error';
    message: string;
    driveLink?: string;
    orderNumber: string;
    driverName: string;
  } | null>(null);

  const [isSyncingQueue, setIsSyncingQueue] = useState<boolean>(false);

  // Load initial data from LocalStorage
  useEffect(() => {
    const savedDriver = getSavedDriver();
    setDriver(savedDriver);
    if (!savedDriver) {
      setShowDriverModal(true);
    }

    const loadedOrders = getWorkOrders();
    setWorkOrders(loadedOrders);

    const loadedConfig = getAppsScriptConfig();
    setAppsScriptConfig(loadedConfig);

    const loadedOutbox = getOutboxQueue();
    setOutboxQueue(loadedOutbox);

    const loadedScans = getRecentScans();
    setRecentScans(loadedScans);
  }, []);

  // Listen to Online / Offline connection changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto sync outbox queue when internet is restored
      syncOutboxQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Work order selection handler
  const handleSelectWorkOrder = (order: WorkOrder) => {
    setSelectedOrderNumber(order.orderNumber);
  };

  const handleAddNewOrder = (newOrder: WorkOrder) => {
    const updated = [newOrder, ...workOrders];
    setWorkOrders(updated);
    saveWorkOrders(updated);
  };

  // Image Captured from Camera Scanner
  const handleImageCaptured = (imageBase64: string) => {
    setCapturedImageBase64(imageBase64);
  };

  // Process and upload confirmed document scan
  const handleConfirmScan = async (
    processedBase64: string,
    filterMode: FilterMode,
    cropRect: CropRect,
    rotation: number,
    ocrData?: any
  ) => {
    if (!driver) {
      setShowDriverModal(true);
      return;
    }

    const orderNum = selectedOrderNumber.trim() || `ORD-${Date.now().toString().slice(-5)}`;

    const scanObject: DocumentScan = {
      id: `scan-${Date.now()}`,
      driverName: driver.name,
      orderNumber: orderNum,
      clientName: ocrData?.clientName || 'לקוח general',
      originalImageBase64: capturedImageBase64 || processedBase64,
      processedImageBase64: processedBase64,
      filterMode,
      cropRect,
      rotation,
      status: 'pending_sync',
      timestamp: new Date().toISOString(),
      ocrData,
    };

    // Show loading notification
    setNotification({
      status: 'syncing',
      message: 'ממיר את המסמך לקובץ PDF ושולח ל-Google Drive...',
      orderNumber: orderNum,
      driverName: driver.name,
    });

    try {
      // 1. Generate PDF file client-side
      const pdfBase64 = await generateDocumentPdf(scanObject);
      scanObject.pdfBase64 = pdfBase64;

      // Check network status
      if (!isOnline) {
        // Save to offline outbox queue
        addToOutbox(scanObject);
        setOutboxQueue(getOutboxQueue());
        markWorkOrderScanned(orderNum);
        setWorkOrders(getWorkOrders());

        setNotification({
          status: 'offline_saved',
          message: 'אין חיבור אינטרנט פעיל. התעודה נשמרה בבטחה בתור האופליין של המכשיר.',
          orderNumber: orderNum,
          driverName: driver.name,
        });
        setCapturedImageBase64(null);
        return;
      }

      // 2. Upload to server / Apps Script Webhook
      const response = await fetch('/api/upload-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverName: driver.name,
          orderNumber: orderNum,
          clientName: scanObject.clientName,
          pdfBase64: pdfBase64,
          timestamp: scanObject.timestamp,
          webhookUrl: appsScriptConfig.webhookUrl,
        }),
      });

      const resData = await response.json();

      if (resData.success) {
        scanObject.status = 'synced';
        scanObject.driveLink = resData.driveLink;
        saveRecentScan(scanObject);
        setRecentScans(getRecentScans());

        markWorkOrderScanned(orderNum);
        setWorkOrders(getWorkOrders());

        setNotification({
          status: 'success',
          message: 'התעודה הועלתה בהצלחה לדרייב ועודכנה בגיליון',
          driveLink: resData.driveLink,
          orderNumber: orderNum,
          driverName: driver.name,
        });
        setCapturedImageBase64(null);
      } else {
        // Backup to outbox queue if upload failed
        addToOutbox(scanObject);
        setOutboxQueue(getOutboxQueue());

        setNotification({
          status: 'offline_saved',
          message: 'ההעלאה נכשלה עקב בעיית תקשורת. התעודה נשמרה בתור הסנכרון.',
          orderNumber: orderNum,
          driverName: driver.name,
        });
        setCapturedImageBase64(null);
      }
    } catch (err: any) {
      console.error('Scan submission error:', err);
      addToOutbox(scanObject);
      setOutboxQueue(getOutboxQueue());

      setNotification({
        status: 'offline_saved',
        message: 'התעודה נשמרה בזיכרון המקומי עקב שגיאה זמנית ברשת.',
        orderNumber: orderNum,
        driverName: driver.name,
      });
      setCapturedImageBase64(null);
    }
  };

  // Sync Outbox Queue items
  const syncOutboxQueue = async () => {
    const queue = getOutboxQueue();
    if (queue.length === 0 || isSyncingQueue) return;

    setIsSyncingQueue(true);
    let successCount = 0;
    const remainingQueue: DocumentScan[] = [];

    for (const item of queue) {
      try {
        const response = await fetch('/api/upload-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            driverName: item.driverName,
            orderNumber: item.orderNumber,
            clientName: item.clientName,
            pdfBase64: item.pdfBase64,
            timestamp: item.timestamp,
            webhookUrl: appsScriptConfig.webhookUrl,
          }),
        });
        const resData = await response.json();
        if (resData.success) {
          successCount++;
          item.status = 'synced';
          item.driveLink = resData.driveLink;
          saveRecentScan(item);
        } else {
          remainingQueue.push(item);
        }
      } catch (e) {
        remainingQueue.push(item);
      }
    }

    saveOutboxQueue(remainingQueue);
    setOutboxQueue(remainingQueue);
    setRecentScans(getRecentScans());
    setIsSyncingQueue(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans dir-rtl antialiased flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Header bar */}
      <Header
        currentDriver={driver}
        isOnline={isOnline}
        offlineCount={outboxQueue.length}
        config={appsScriptConfig}
        onOpenDriverModal={() => setShowDriverModal(true)}
        onOpenConfigModal={() => setShowConfigModal(true)}
        onOpenOutboxModal={() => setShowOutboxModal(true)}
        onOpenHistoryModal={() => setShowHistoryModal(true)}
        onSyncNow={syncOutboxQueue}
        isSyncing={isSyncingQueue}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Offline Banner if offline */}
        {!isOnline && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
              <span className="font-bold">מצב אופליין פעיל:</span>
              <span className="font-medium">המצלמה והסורק עובדים כרגיל. התעודות יישמרו במכשיר ויסונכרנו אוטומטית כשתחזור הקליטה.</span>
            </div>
            {outboxQueue.length > 0 && (
              <span className="font-bold bg-amber-500 text-white px-2.5 py-1 rounded-lg text-[11px] shrink-0 shadow-xs">
                {outboxQueue.length} תעודות בממתינה
              </span>
            )}
          </div>
        )}

        {/* Dynamic Screen View: Camera Scan vs Preview Edit */}
        {!capturedImageBase64 ? (
          <>
            {/* Step 1: Work Order Selection */}
            <WorkOrderSelector
              workOrders={workOrders}
              selectedOrderNumber={selectedOrderNumber}
              onSelectOrder={handleSelectWorkOrder}
              onManualOrderChange={(val) => setSelectedOrderNumber(val)}
              onAddNewOrder={handleAddNewOrder}
            />

            {/* Step 2: Camera Scanner Launch View */}
            <CameraScanner
              onImageCaptured={handleImageCaptured}
              orderNumber={selectedOrderNumber}
            />

            {/* Recent Scans Overview Dashboard */}
            {recentScans.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-4 h-4 text-blue-600" />
                    <span>סריקות אחרונות שבוצעו היום ({recentScans.length})</span>
                  </h4>
                  <button
                    onClick={() => setShowHistoryModal(true)}
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    הצג את הכל
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {recentScans.slice(0, 4).map((scan) => (
                    <div
                      key={scan.id}
                      className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center gap-3"
                    >
                      <img
                        src={scan.processedImageBase64 || scan.originalImageBase64}
                        alt={scan.orderNumber}
                        className="w-10 h-12 object-cover rounded-xl border border-slate-200 bg-white shrink-0 shadow-xs"
                      />
                      <div className="overflow-hidden flex-1 text-xs">
                        <div className="font-bold font-mono text-slate-900 truncate">{scan.orderNumber}</div>
                        <div className="text-[11px] text-slate-500 truncate font-medium">{scan.driverName}</div>
                        <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>סונכרן לדרייב</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Step 3: Preview, Auto Crop & B&W Filters Edit Screen */
          <ScanPreviewEdit
            originalImageBase64={capturedImageBase64}
            orderNumber={selectedOrderNumber}
            driverName={driver?.name || 'נהג'}
            clientName={
              workOrders.find(
                (o) => o.orderNumber.trim().toLowerCase() === selectedOrderNumber.trim().toLowerCase()
              )?.clientName
            }
            onRetake={() => setCapturedImageBase64(null)}
            onConfirmScan={handleConfirmScan}
            isProcessing={notification?.status === 'syncing'}
          />
        )}
      </main>

      {/* Modals & Dialogs */}
      {showDriverModal && (
        <DriverLoginModal
          currentDriver={driver}
          onSelectDriver={(d) => setDriver(d)}
          onClose={() => setShowDriverModal(false)}
          isInitialRequired={!driver}
        />
      )}

      {showConfigModal && (
        <AppsScriptModal
          config={appsScriptConfig}
          onSaveConfig={(cfg) => setAppsScriptConfig(cfg)}
          onClose={() => setShowConfigModal(false)}
        />
      )}

      {showOutboxModal && (
        <OfflineOutboxDrawer
          outboxQueue={outboxQueue}
          isOnline={isOnline}
          isSyncing={isSyncingQueue}
          onSyncAll={syncOutboxQueue}
          onRemoveItem={(id) => {
            removeFromOutbox(id);
            setOutboxQueue(getOutboxQueue());
          }}
          onClose={() => setShowOutboxModal(false)}
        />
      )}

      {showHistoryModal && (
        <ScansHistoryModal scans={recentScans} onClose={() => setShowHistoryModal(false)} />
      )}

      {notification && (
        <SuccessStatusNotification
          status={notification.status}
          message={notification.message}
          driveLink={notification.driveLink}
          orderNumber={notification.orderNumber}
          driverName={notification.driverName}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}
