import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Download,
  RefreshCw,
  ShoppingBag,
  Info,
  Check,
  ChevronDown,
  Layers,
  X
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import {
  SalesChannel,
  SALES_CHANNELS,
  SALES_CHANNEL_CONFIGS,
  getChannelMeta
} from '../../data/salesChannels';
import { ImportPreviewResponse, ImportOrdersResponse } from '../../types/sales';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Loading } from '../ui/Loading';
import { useToast } from '../../context/ToastContext';

interface OrderImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialChannel?: string;
}

// Canonical CRM target fields for CSV column mapping
interface ColumnFieldDef {
  key: string;
  label: string;
  required: boolean;
  synonyms: string[];
}

const CRM_TARGET_FIELDS: ColumnFieldDef[] = [
  { key: 'externalOrderId', label: 'External Order ID', required: true, synonyms: ['order id', 'order_id', 'orderid', 'external id', 'external_order_id', 'amazon order id', 'order-id', 'order-item-id', 'od'] },
  { key: 'sku', label: 'Product SKU', required: false, synonyms: ['sku', 'seller sku', 'merchant sku', 'item sku', 'product sku', 'seller-sku', 'code'] },
  { key: 'productName', label: 'Product Name', required: false, synonyms: ['product', 'product name', 'product_name', 'title', 'item name', 'item-name', 'description'] },
  { key: 'quantity', label: 'Quantity', required: true, synonyms: ['qty', 'quantity', 'quantity-purchased', 'item quantity', 'units', 'number of items', 'count'] },
  { key: 'unitPrice', label: 'Unit Price (₹)', required: true, synonyms: ['price', 'unit price', 'unit_price', 'item price', 'item-price', 'rate', 'mrp', 'selling price'] },
  { key: 'discount', label: 'Discount (₹)', required: false, synonyms: ['discount', 'item discount', 'item-promotion-discount', 'promo', 'coupon'] },
  { key: 'tax', label: 'Tax / GST (₹)', required: false, synonyms: ['tax', 'gst', 'item-tax', 'vat'] },
  { key: 'shipping', label: 'Shipping (₹)', required: false, synonyms: ['shipping', 'shipping fee', 'shipping-price', 'delivery'] },
  { key: 'marketplaceFee', label: 'Marketplace Fee (₹)', required: false, synonyms: ['fee', 'commission', 'marketplace fee', 'amazon fee', 'flipkart fee', 'selling fee'] },
  { key: 'customerName', label: 'Customer Name', required: false, synonyms: ['customer', 'customer name', 'buyer name', 'recipient name', 'buyer-name', 'name'] },
  { key: 'customerEmail', label: 'Customer Email', required: false, synonyms: ['email', 'customer email', 'buyer email', 'buyer-email'] },
  { key: 'customerPhone', label: 'Customer Phone', required: false, synonyms: ['phone', 'mobile', 'customer phone', 'contact', 'buyer phone', 'buyer-phone'] },
  { key: 'orderDate', label: 'Order Date', required: false, synonyms: ['date', 'order date', 'purchase date', 'created at', 'order_date', 'purchase-date'] },
  { key: 'orderStatus', label: 'Order Status', required: false, synonyms: ['status', 'order status', 'fulfillment status'] },
  { key: 'paymentStatus', label: 'Payment Status', required: false, synonyms: ['payment', 'payment status', 'paid'] }
];

/**
 * Standard RFC-4180 robust CSV parser
 */
function parseCsvContent(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentLine += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      if (currentLine.trim()) lines.push(currentLine);
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) lines.push(currentLine);

  if (lines.length === 0) return { headers: [], rows: [] };

  // Parse a single line into columns
  const parseLine = (lineStr: string): string[] => {
    const values: string[] = [];
    let curVal = '';
    let insideQuotes = false;

    for (let j = 0; j < lineStr.length; j++) {
      const c = lineStr[j];
      const nc = lineStr[j + 1];

      if (c === '"') {
        if (insideQuotes && nc === '"') {
          curVal += '"';
          j++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (c === ',' && !insideQuotes) {
        values.push(curVal.trim());
        curVal = '';
      } else {
        curVal += c;
      }
    }
    values.push(curVal.trim());
    return values;
  };

  const rawHeaders = parseLine(lines[0]);
  const headers = rawHeaders.map(h => h.replace(/^["']|["']$/g, '').trim());

  const rows: Record<string, string>[] = [];
  for (let l = 1; l < lines.length; l++) {
    const vals = parseLine(lines[l]);
    if (vals.every(v => !v)) continue; // ignore empty rows
    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = vals[idx] !== undefined ? vals[idx] : '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

export const OrderImportModal: React.FC<OrderImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialChannel = 'FLIPKART'
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Workflow steps: 1 = Channel & File, 2 = Mapping & Preview, 3 = Confirmation / Executing, 4 = Final Report
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [selectedChannel, setSelectedChannel] = useState<string>(initialChannel);
  const [csvFileName, setCsvFileName] = useState<string>('');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({}); // targetKey -> csvHeader

  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<ImportPreviewResponse | null>(null);

  const [isImporting, setIsImporting] = useState(false);
  const [importReport, setImportReport] = useState<ImportOrdersResponse | null>(null);

  if (!isOpen) return null;

  // Auto-map CSV headers to CRM fields
  const autoMapHeaders = (detectedHeaders: string[]) => {
    const mapping: Record<string, string> = {};
    const normalizedDetected = detectedHeaders.map(h => ({
      original: h,
      clean: h.toLowerCase().replace(/[^a-z0-9]/g, '')
    }));

    CRM_TARGET_FIELDS.forEach(target => {
      // Direct clean match
      const targetClean = target.label.toLowerCase().replace(/[^a-z0-9]/g, '');
      const directMatch = normalizedDetected.find(h => h.clean === targetClean || h.clean === target.key.toLowerCase());
      if (directMatch) {
        mapping[target.key] = directMatch.original;
        return;
      }

      // Synonym match
      for (const synonym of target.synonyms) {
        const cleanSyn = synonym.toLowerCase().replace(/[^a-z0-9]/g, '');
        const match = normalizedDetected.find(h => h.clean === cleanSyn || h.clean.includes(cleanSyn));
        if (match) {
          mapping[target.key] = match.original;
          return;
        }
      }
    });

    return mapping;
  };

  // Convert raw CSV rows according to mapping
  const buildMappedRecords = (
    rows: Record<string, string>[],
    currentMapping: Record<string, string>
  ) => {
    return rows.map(row => {
      const mapped: Record<string, any> = {};
      Object.entries(currentMapping).forEach(([targetKey, csvHeader]) => {
        if (csvHeader && row[csvHeader] !== undefined) {
          mapped[targetKey] = row[csvHeader];
        }
      });
      return mapped;
    });
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      showToast('Please select a valid .csv file', 'warning');
      return;
    }

    setCsvFileName(file.name);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = (event.target?.result as string) || '';
        const { headers, rows } = parseCsvContent(text);

        if (headers.length === 0 || rows.length === 0) {
          showToast('CSV file is empty or missing data', 'warning');
          return;
        }

        setRawHeaders(headers);
        setRawRows(rows);

        const detectedMapping = autoMapHeaders(headers);
        setColumnMapping(detectedMapping);

        // Fetch backend preview immediately
        await runPreview(selectedChannel, rows, detectedMapping);
        setStep(2);
      } catch (err: any) {
        showToast(err.message || 'Failed to read CSV file', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Run backend validation & duplicate detection
  const runPreview = async (
    channel: string,
    rows: Record<string, string>[],
    mapping: Record<string, string>
  ) => {
    try {
      setIsLoadingPreview(true);
      const mappedRecords = buildMappedRecords(rows, mapping);
      const res = await orderService.previewImport(channel, mappedRecords);
      setPreviewData(res);
    } catch (err: any) {
      showToast(err.message || 'Validation preview failed', 'error');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Handle re-validating if user manually tweaks column mapping
  const handleMappingChange = async (targetKey: string, newHeader: string) => {
    const updated = { ...columnMapping, [targetKey]: newHeader };
    setColumnMapping(updated);
    await runPreview(selectedChannel, rawRows, updated);
  };

  // Confirm and execute import of valid records
  const handleConfirmImport = async () => {
    if (!previewData) return;

    // Filter only valid records
    const validMappedRecords = previewData.previewRows
      .filter(r => r.status === 'VALID')
      .map(r => ({
        externalOrderId: r.externalOrderId,
        sku: r.sku,
        productName: r.productName,
        quantity: r.quantity,
        unitPrice: r.unitPrice,
        discount: r.discount,
        tax: r.tax,
        shipping: r.shipping,
        marketplaceFee: r.marketplaceFee,
        customerName: r.customerName,
        customerEmail: r.customerEmail,
        customerPhone: r.customerPhone,
        orderDate: r.orderDate,
        orderStatus: r.orderStatus,
        paymentStatus: r.paymentStatus
      }));

    if (validMappedRecords.length === 0) {
      showToast('No valid records to import. Please review errors.', 'warning');
      return;
    }

    try {
      setIsImporting(true);
      setStep(3);
      const report = await orderService.confirmImport(selectedChannel, validMappedRecords);
      setImportReport(report);
      setStep(4);
      showToast(`Successfully imported ${report.importedCount} orders!`, 'success');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Failed to complete order import', 'error');
      setStep(2);
    } finally {
      setIsImporting(false);
    }
  };

  // Generate downloadable sample CSV template
  const downloadSampleTemplate = (channel: string) => {
    let csvSample = '';
    if (channel === 'FLIPKART') {
      csvSample = `order_id,sku,product_name,quantity,unit_price,discount,tax,shipping,customer_name,customer_city,order_date,order_status\n` +
        `OD123456789,LAV-SERUM-01,Lavanta Face Serum,2,799,0,0,0,Pooja Verma,Bengaluru,2026-03-15,CONFIRMED\n` +
        `OD123456790,LAV-KUMKUMADI-01,Kumkumadi Facial Oil,1,1250,50,0,40,Rohan Mehta,Mumbai,2026-03-15,CONFIRMED`;
    } else if (channel === 'AMAZON') {
      csvSample = `amazon-order-id,merchant-sku,product-name,quantity-purchased,item-price,item-promotion-discount,shipping-price,marketplace-fee,recipient-name,purchase-date,order-status\n` +
        `403-8912345-1234567,LAV-SERUM-01,Lavanta Face Serum,1,799,0,0,120,Aarav Patel,2026-03-15,CONFIRMED\n` +
        `403-9123456-7654321,LAV-ROSEWATER-01,Pure Rose Floral Mist,3,450,50,0,90,Sneha Reddy,2026-03-15,DELIVERED`;
    } else {
      csvSample = `order_id,sku,product_name,quantity,unit_price,discount,tax,shipping,customer_name,customer_email,customer_phone,order_date,order_status\n` +
        `LVN-98421,LAV-SERUM-01,Lavanta Face Serum,2,799,100,0,50,Aditi Sharma,aditi@example.com,9876543210,2026-03-15,CONFIRMED\n` +
        `LVN-98422,LAV-KUMKUMADI-01,Kumkumadi Facial Oil,1,1250,0,0,0,Vikram Joshi,vikram@example.com,9811223344,2026-03-15,CONFIRMED`;
    }

    const blob = new Blob([csvSample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `lavanta_${channel.toLowerCase()}_sample_orders.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const channelMeta = getChannelMeta(selectedChannel);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backgroundColor: 'rgba(5, 10, 18, 0.75)',
        backdropFilter: 'blur(6px)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: step === 2 ? '1020px' : '760px',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-surface, #0E1726)',
          borderRadius: '12px',
          border: '1px solid var(--border-color, #1F2D42)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'max-width 0.25s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color, #1F2D42)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface-elevated, #142032)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: 'rgba(105, 196, 63, 0.15)',
                color: 'var(--color-primary, #69C43F)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--color-text-primary, #F3F4F6)', margin: 0 }}>
                Import Multi-Channel Sales Orders
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary, #9CA3AF)', margin: '2px 0 0' }}>
                Batch ingest canonical sales records from Website, Amazon, or Flipkart CSV reports
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-secondary, #9CA3AF)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Indicator Progress Bar */}
        <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--border-color, #1F2D42)', backgroundColor: 'rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {[
              { num: 1, label: 'Upload CSV' },
              { num: 2, label: 'Preview & Validate' },
              { num: 3, label: 'Confirm Import' },
              { num: 4, label: 'Import Report' }
            ].map(s => (
              <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor: step > s.num ? '#10B981' : step === s.num ? 'var(--color-primary, #69C43F)' : 'var(--bg-surface-elevated, #1F2D42)',
                    color: step >= s.num ? '#FFFFFF' : 'var(--color-text-secondary, #9CA3AF)',
                    border: step === s.num ? '2px solid rgba(105, 196, 63, 0.4)' : 'none'
                  }}
                >
                  {step > s.num ? <Check size={13} /> : s.num}
                </div>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: step === s.num ? 600 : 500,
                    color: step === s.num ? 'var(--color-text-primary, #F3F4F6)' : 'var(--color-text-secondary, #9CA3AF)'
                  }}
                >
                  {s.label}
                </span>
                {s.num < 4 && <span style={{ color: 'var(--border-color, #1F2D42)', margin: '0 0.5rem' }}>—</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Body Container */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* STEP 1: Select Channel & Upload File */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Channel Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary, #F3F4F6)', marginBottom: '0.5rem' }}>
                  1. Select Target Sales Channel
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  {(['WEBSITE', 'AMAZON', 'FLIPKART'] as SalesChannel[]).map((ch) => {
                    const meta = getChannelMeta(ch);
                    const isSelected = selectedChannel === ch;
                    return (
                      <div
                        key={ch}
                        onClick={() => setSelectedChannel(ch)}
                        style={{
                          padding: '1rem',
                          borderRadius: '8px',
                          border: isSelected ? `2px solid ${meta.color}` : '1px solid var(--border-color, #1F2D42)',
                          backgroundColor: isSelected ? `${meta.color}15` : 'var(--bg-surface-elevated, #142032)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: meta.color }} />
                          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: isSelected ? meta.color : 'var(--color-text-primary, #F3F4F6)' }}>
                            {meta.displayName}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #9CA3AF)', margin: 0 }}>
                          {meta.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Upload Dropzone */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary, #F3F4F6)' }}>
                    2. Upload Orders CSV File
                  </label>
                  <button
                    type="button"
                    onClick={() => downloadSampleTemplate(selectedChannel)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary, #69C43F)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Download size={13} />
                    Download Sample {channelMeta.shortName} CSV
                  </button>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed var(--border-color, #27374D)',
                    borderRadius: '10px',
                    padding: '2.5rem 1.5rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--bg-surface-elevated, #142032)',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s ease'
                  }}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--color-primary, #69C43F)'; }}
                  onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color, #27374D)'; }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = 'var(--border-color, #27374D)';
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      const input = fileInputRef.current;
                      if (input) {
                        input.files = e.dataTransfer.files;
                        handleFileChange({ target: input } as any);
                      }
                    }
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />

                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(105, 196, 63, 0.12)',
                      color: 'var(--color-primary, #69C43F)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 0.75rem'
                    }}
                  >
                    <UploadCloud size={24} />
                  </div>

                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary, #F3F4F6)', margin: '0 0 0.25rem' }}>
                    Click to browse or drag and drop your CSV report here
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary, #9CA3AF)', margin: '0 0 0.75rem' }}>
                    Supports standard marketplace export formats with headers (Order ID, SKU, Quantity, Price, etc.)
                  </p>

                  <Button variant="outline" size="sm" type="button">
                    Choose File
                  </Button>
                </div>
              </div>

              {/* Informational Callout */}
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(30, 58, 138, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem'
                }}
              >
                <Info size={16} color="#60A5FA" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.78rem', color: '#93C5FD' }}>
                  <strong>Strict Duplicate Prevention:</strong> The CRM uses <code>salesChannel + externalOrderId</code> as the unique identity. Any external order previously imported or duplicated in the file will be flagged and skipped safely. Operational inventory is never mutated.
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Preview & Column Mapping */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {isLoadingPreview ? (
                <div style={{ padding: '4rem 0', textAlign: 'center' }}>
                  <Loading size="lg" message="Validating catalog items, computing amounts, and detecting duplicates..." />
                </div>
              ) : previewData ? (
                <>
                  {/* Summary Metric Counters */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                    {/* Total Detected */}
                    <div style={{ padding: '0.85rem', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated, #142032)', border: '1px solid var(--border-color, #1F2D42)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #9CA3AF)', fontWeight: 600 }}>DETECTED RECORDS</span>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary, #F3F4F6)', marginTop: '2px' }}>
                        {previewData.totalRows}
                      </div>
                    </div>

                    {/* Valid Orders */}
                    <div style={{ padding: '0.85rem', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                      <span style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 600 }}>NEW VALID ORDERS</span>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10B981', marginTop: '2px' }}>
                        {previewData.validCount}
                      </div>
                    </div>

                    {/* Duplicate Orders */}
                    <div style={{ padding: '0.85rem', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                      <span style={{ fontSize: '0.75rem', color: '#FBBF24', fontWeight: 600 }}>DUPLICATES SKIPPED</span>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F59E0B', marginTop: '2px' }}>
                        {previewData.duplicateCount}
                      </div>
                    </div>

                    {/* Invalid Records */}
                    <div style={{ padding: '0.85rem', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                      <span style={{ fontSize: '0.75rem', color: '#F87171', fontWeight: 600 }}>INVALID RECORDS</span>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#EF4444', marginTop: '2px' }}>
                        {previewData.invalidCount}
                      </div>
                    </div>
                  </div>

                  {/* Column Mapping Accordion */}
                  <details style={{ background: 'var(--bg-surface-elevated, #142032)', borderRadius: '8px', border: '1px solid var(--border-color, #1F2D42)', padding: '0.75rem 1rem' }}>
                    <summary style={{ cursor: 'pointer', fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-primary, #69C43F)', outline: 'none' }}>
                      ⚙️ Column Field Mappings ({Object.keys(columnMapping).length} detected columns)
                    </summary>
                    <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem' }}>
                      {CRM_TARGET_FIELDS.slice(0, 8).map(field => (
                        <div key={field.key}>
                          <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--color-text-secondary, #9CA3AF)', marginBottom: '2px' }}>
                            {field.label} {field.required && <span style={{ color: '#EF4444' }}>*</span>}
                          </label>
                          <select
                            value={columnMapping[field.key] || ''}
                            onChange={(e) => handleMappingChange(field.key, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              backgroundColor: 'var(--bg-surface, #0E1726)',
                              border: '1px solid var(--border-color, #1F2D42)',
                              color: 'var(--color-text-primary, #F3F4F6)'
                            }}
                          >
                            <option value="">(None / Ignored)</option>
                            {rawHeaders.map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </details>

                  {/* Preview Table */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary, #F3F4F6)' }}>
                        Validation Preview Table ({previewData.previewRows.length} rows)
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #9CA3AF)' }}>
                        Channel: <strong>{channelMeta.displayName}</strong> | File: {csvFileName}
                      </span>
                    </div>

                    <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--border-color, #1F2D42)', borderRadius: '8px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem' }}>
                        <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-surface-elevated, #142032)', zIndex: 1 }}>
                          <tr style={{ borderBottom: '1px solid var(--border-color, #1F2D42)', color: 'var(--color-text-secondary, #9CA3AF)' }}>
                            <th style={{ padding: '0.5rem 0.75rem' }}>Row</th>
                            <th style={{ padding: '0.5rem 0.75rem' }}>Status</th>
                            <th style={{ padding: '0.5rem 0.75rem' }}>Ext Order ID</th>
                            <th style={{ padding: '0.5rem 0.75rem' }}>Product & SKU</th>
                            <th style={{ padding: '0.5rem 0.75rem' }}>Qty</th>
                            <th style={{ padding: '0.5rem 0.75rem' }}>Price</th>
                            <th style={{ padding: '0.5rem 0.75rem' }}>Customer</th>
                            <th style={{ padding: '0.5rem 0.75rem' }}>Notes / Errors</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.previewRows.map((r) => (
                            <tr
                              key={r.row}
                              style={{
                                borderBottom: '1px solid var(--border-color, #1F2D42)',
                                backgroundColor: r.status === 'VALID'
                                  ? 'transparent'
                                  : r.status === 'DUPLICATE'
                                  ? 'rgba(245, 158, 11, 0.05)'
                                  : 'rgba(239, 68, 68, 0.05)'
                              }}
                            >
                              <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-muted, #6B7280)' }}>#{r.row}</td>
                              <td style={{ padding: '0.5rem 0.75rem' }}>
                                {r.status === 'VALID' && <Badge variant="green" size="sm">Valid</Badge>}
                                {r.status === 'DUPLICATE' && <Badge variant="warning" size="sm">Duplicate</Badge>}
                                {r.status === 'INVALID' && <Badge variant="danger" size="sm">Invalid</Badge>}
                              </td>
                              <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: 'var(--color-text-primary, #F3F4F6)' }}>
                                {r.externalOrderId || '—'}
                              </td>
                              <td style={{ padding: '0.5rem 0.75rem' }}>
                                <div style={{ color: 'var(--color-text-primary, #F3F4F6)', fontWeight: 500 }}>{r.productName || '—'}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted, #6B7280)', fontFamily: 'monospace' }}>{r.sku || '—'}</div>
                              </td>
                              <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-primary, #F3F4F6)' }}>{r.quantity}</td>
                              <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-primary, #F3F4F6)', fontWeight: 600 }}>₹{r.unitPrice}</td>
                              <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-secondary, #9CA3AF)' }}>{r.customerName || `${channelMeta.shortName} Customer`}</td>
                              <td style={{ padding: '0.5rem 0.75rem' }}>
                                {r.status === 'VALID' && <span style={{ color: '#10B981' }}>Ready to import</span>}
                                {r.status === 'DUPLICATE' && <span style={{ color: '#F59E0B' }}>{r.duplicateReason}</span>}
                                {r.status === 'INVALID' && <span style={{ color: '#EF4444' }}>{r.errors?.join('; ')}</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {/* STEP 3: In-Flight Progress Animation */}
          {step === 3 && (
            <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
              <Loading size="lg" message={`Ingesting ${previewData?.validCount} valid orders into CRM...`} />
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary, #9CA3AF)', marginTop: '1rem' }}>
                Generating internal CRM order numbers, linking catalog formulation snapshots, and updating security audit trail.
              </p>
            </div>
          )}

          {/* STEP 4: Final Import Report */}
          {step === 4 && importReport && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto'
                }}
              >
                <CheckCircle2 size={32} />
              </div>

              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-text-primary, #F3F4F6)', margin: 0 }}>
                  Order Import Successfully Completed
                </h3>
                <p style={{ color: 'var(--color-text-secondary, #9CA3AF)', fontSize: '0.875rem', marginTop: '0.35rem' }}>
                  Orders have been registered in the canonical Unified Order Register under <strong>{channelMeta.displayName}</strong>.
                </p>
              </div>

              {/* Report Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
                <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  <span style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 600 }}>IMPORTED ORDERS</span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>
                    {importReport.importedCount}
                  </div>
                </div>

                <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                  <span style={{ fontSize: '0.75rem', color: '#FBBF24', fontWeight: 600 }}>DUPLICATES SKIPPED</span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F59E0B', marginTop: '4px' }}>
                    {importReport.skippedDuplicatesCount}
                  </div>
                </div>

                <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                  <span style={{ fontSize: '0.75rem', color: '#F87171', fontWeight: 600 }}>REJECTED RECORDS</span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#EF4444', marginTop: '4px' }}>
                    {importReport.failedCount}
                  </div>
                </div>
              </div>

              {/* Created Orders Sample List */}
              {importReport.importedOrders.length > 0 && (
                <div style={{ textAlign: 'left', border: '1px solid var(--border-color, #1F2D42)', borderRadius: '8px', padding: '0.75rem 1rem', background: 'var(--bg-surface-elevated, #142032)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #9CA3AF)', marginBottom: '0.5rem' }}>
                    Created CRM Orders:
                  </div>
                  <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {importReport.importedOrders.map(o => (
                      <div key={o._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--color-text-primary, #F3F4F6)' }}>
                        <span>
                          <strong>{o.orderNumber}</strong> ({channelMeta.shortName} ID: {o.externalOrderId})
                        </span>
                        <span style={{ color: 'var(--color-primary, #69C43F)', fontWeight: 600 }}>
                          ₹{o.total.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-color, #1F2D42)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface-elevated, #142032)'
          }}
        >
          {step === 1 && (
            <>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary, #9CA3AF)' }}>
                Select a channel and drop a CSV file to proceed
              </span>
            </>
          )}

          {step === 2 && (
            <>
              <Button variant="ghost" icon={<ArrowLeft size={15} />} onClick={() => setStep(1)}>
                Back to Upload
              </Button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  icon={<Check size={16} />}
                  onClick={handleConfirmImport}
                  disabled={!previewData || previewData.validCount === 0 || isImporting}
                >
                  Confirm & Import ({previewData?.validCount || 0} Orders)
                </Button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <Button
                variant="outline"
                icon={<ShoppingBag size={15} />}
                onClick={() => {
                  onClose();
                  navigate('/orders');
                }}
              >
                View Unified Order Register
              </Button>
              <Button variant="primary" onClick={onClose}>
                Done
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
