import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupees } from '../utils/format';
import { 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Printer, 
  Eye, 
  ArrowLeft, 
  Save, 
  Check, 
  Camera,
  AlertCircle,
  Download,
  ExternalLink,
  Cloud
} from 'lucide-react';
import { Quotation, QuotationItem } from '../types';
import { getAccessToken, googleSignInWithDrive } from '../lib/firebase';

function generateFullInvoiceHtml(quote: Quotation, settings: any, formatRupees: (amount: number) => string) {
  const subtotal = quote.items.reduce((sum, i) => sum + i.lineTotal, 0);
  const tax = Math.round(subtotal * (quote.gstRate / 100));
  const grandTotal = subtotal + tax;

  const logoHtml = quote.logoAttached ? `
    <img src="${quote.logoAttached}" alt="Logo" style="height: 64px; max-width: 200px; object-fit: contain; margin-bottom: 12px; border: 1px solid #f1f5f9; padding: 4px; border-radius: 4px;" />
  ` : (settings.logoUrl ? `
    <img src="${settings.logoUrl}" alt="Logo" style="height: 64px; max-width: 200px; object-fit: contain; margin-bottom: 12px; border: 1px solid #f1f5f9; padding: 4px; border-radius: 4px;" />
  ` : `
    <div style="background-color: #f59e0b; color: #0f172a; font-weight: 800; padding: 8px 16px; border-radius: 6px; display: inline-block; font-size: 14px; margin-bottom: 12px;">
      ${settings.appName || 'Onsite Build-Pro'}
    </div>
  `);

  const itemsRows = quote.items.map((it, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 12px 8px; text-align: left; font-size: 13px;">
        <strong>${idx + 1}. ${it.description}</strong>
      </td>
      <td style="padding: 12px 8px; text-align: right; font-family: monospace; font-size: 13px;">${it.qty}</td>
      <td style="padding: 12px 8px; text-align: right; font-family: monospace; font-size: 13px;">${formatRupees(it.unitPrice)}</td>
      <td style="padding: 12px 8px; text-align: right; font-family: monospace; font-weight: bold; font-size: 13px; color: #0f172a;">${formatRupees(it.lineTotal)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Estimation ${quote.quoteNumber}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', system-ui, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      color: #334155;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .container {
      max-width: 800px;
      margin: 40px auto;
      background: #ffffff;
      padding: 48px;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 24px;
    }
    .company-details {
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
    }
    .invoice-title {
      text-align: right;
    }
    .invoice-title h1 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 900;
      letter-spacing: 0.05em;
      color: #0f172a;
    }
    .meta-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #64748b;
      margin: 2px 0;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin: 32px 0;
    }
    .customer-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 16px;
      border-radius: 12px;
    }
    .customer-box span {
      font-size: 10px;
      font-weight: bold;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: block;
      margin-bottom: 6px;
    }
    .customer-box h4 {
      margin: 0 0 4px 0;
      font-size: 14px;
      font-weight: bold;
      color: #0f172a;
    }
    .customer-box p {
      margin: 0;
      font-size: 12px;
      color: #475569;
      line-height: 1.6;
      white-space: pre-line;
    }
    .terms-box {
      text-align: right;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      font-size: 12px;
    }
    .terms-box p {
      margin: 4px 0;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
    }
    .table th {
      background-color: #f8fafc;
      padding: 10px 12px;
      font-size: 11px;
      font-weight: bold;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 2px solid #0f172a;
    }
    .totals-section {
      display: flex;
      justify-content: space-between;
      gap: 48px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
    }
    .memo-box {
      max-width: 400px;
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 16px;
      border-radius: 12px;
      font-size: 11px;
      line-height: 1.6;
      color: #475569;
    }
    .memo-box h5 {
      margin: 0 0 6px 0;
      color: #b45309;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .totals-box {
      width: 300px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      margin-bottom: 8px;
    }
    .total-row .label {
      color: #64748b;
    }
    .total-row .value {
      font-family: 'JetBrains Mono', monospace;
      font-weight: bold;
      color: #0f172a;
    }
    .grand-total {
      background-color: #fffbeb;
      border: 1px solid #fef3c7;
      padding: 12px;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      font-weight: 800;
      font-size: 15px;
      color: #0f172a;
      margin-top: 12px;
    }
    .grand-total .value {
      font-family: 'JetBrains Mono', monospace;
      color: #78350f;
    }
    .signatures {
      margin-top: 64px;
      display: flex;
      justify-content: space-between;
      gap: 48px;
    }
    .sig-line {
      text-align: center;
      width: 200px;
    }
    .sig-line p {
      margin: 8px 0 0 0;
      font-size: 10px;
      font-weight: bold;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .sig-space {
      height: 48px;
      border-bottom: 1px dashed #cbd5e1;
    }
    .no-print-bar {
      max-width: 800px;
      margin: 20px auto 0 auto;
      padding: 12px 24px;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .print-btn {
      background-color: #0f172a;
      color: #ffffff;
      border: none;
      padding: 10px 20px;
      font-size: 13px;
      font-weight: bold;
      border-radius: 8px;
      cursor: pointer;
    }
    .print-btn:hover {
      background-color: #1e293b;
    }
    @media print {
      body {
        background-color: #ffffff;
      }
      .container {
        border: none;
        box-shadow: none;
        padding: 0;
        margin: 0;
        max-width: 100%;
      }
      .no-print-bar {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <span style="font-size: 13px; font-weight: 600; color: #475569;">✓ Offline Invoice Document Ready</span>
    <button class="print-btn" onclick="window.print()">Print This Estimation / Save as PDF</button>
  </div>
  <div class="container">
    <div class="header">
      <div>
        ${logoHtml}
        <div class="company-details">
          <p style="font-weight: bold; color: #0f172a; margin: 4px 0 2px 0; font-size: 14px;">${settings.appName || 'Onsite Build-Pro'}</p>
          <p style="margin: 0;">${settings.appSubtitle || 'Industrial Estimations Office'}</p>
          <p style="margin: 2px 0 0 0; font-size: 10px; color: #94a3b8;">Created via Accounts Workspace</p>
        </div>
      </div>
      <div class="invoice-title">
        <h1>ESTIMATION</h1>
        <p class="meta-value" style="font-weight: bold; color: #0f172a;">No: ${quote.quoteNumber}</p>
        <p class="meta-value">Date: ${quote.date}</p>
      </div>
    </div>

    <div class="grid">
      <div class="customer-box">
        <span>Customer Destination:</span>
        <h4>${quote.clientName}</h4>
        <p>${quote.clientAddress || 'No Address Declared.'}</p>
        ${quote.clientPhone || quote.clientEmail ? `
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 11px; color: #475569; line-height: 1.4;">
            ${quote.clientPhone ? `<div><strong>Phone:</strong> ${quote.clientPhone}</div>` : ''}
            ${quote.clientEmail ? `<div><strong>Email:</strong> ${quote.clientEmail}</div>` : ''}
          </div>
        ` : ''}
      </div>
      <div class="terms-box">
        <p style="color: #64748b; font-weight: 500;">Terms & Validity:</p>
        <p style="font-weight: bold; color: #334155;">Valid for 30 execution business days</p>
        <p style="color: #94a3b8; font-size: 11px; margin-top: 4px;">Reference Project ID: ${quote.projectId || 'Central Office'}</p>
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th style="text-align: left;">Itemized description</th>
          <th style="text-align: right; width: 60px;">Qty</th>
          <th style="text-align: right; width: 140px;">Unit Price (₹)</th>
          <th style="text-align: right; width: 150px;">Row Net (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <div class="totals-section">
      <div class="memo-box">
        <h5>Payment Estimations Memo</h5>
        <p style="margin: 0; white-space: pre-wrap;">${quote.notes || 'No payment terms saved.'}</p>
      </div>
      <div class="totals-box">
        <div class="total-row">
          <span class="label">Total Items Aggregate:</span>
          <span class="value">${formatRupees(subtotal)}</span>
        </div>
        <div class="total-row">
          <span class="label">GST Outlay (${quote.gstRate}%):</span>
          <span class="value">${formatRupees(tax)}</span>
        </div>
        <div class="grand-total">
          <span>Grand Total (₹):</span>
          <span class="value">${formatRupees(grandTotal)}</span>
        </div>
      </div>
    </div>

    <div class="signatures">
      <div class="sig-line">
        <div class="sig-space"></div>
        <p>Client Sign-off Authorization</p>
      </div>
      <div class="sig-line">
        <div class="sig-space"></div>
        <p>Authorized Accountant Seal</p>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;
}

export default function Quotations() {
  const { quotations, projects, settings, addQuotation, deleteQuotation } = useApp();

  // Selected focused quote for print review
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Google Drive integrations
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [driveSyncMessage, setDriveSyncMessage] = useState<{ success?: string; error?: string; invoiceUrl?: string }>({});

  // Form States for creating a custom quotation
  const [qNumber, setQNumber] = useState(() => `QT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [cName, setCName] = useState('');
  const [cAddress, setCAddress] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [qDate, setQDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [qGst, setQGst] = useState('18');
  const [qNotes, setQNotes] = useState('1. 50% Advance is required along with placement order sheet.\n2. Invoices strictly cleared on volumetric running measurements clearance.');
  const [qLogo, setQLogo] = useState('');
  const [qProjId, setQProjId] = useState('');

  // Table items state
  const [items, setItems] = useState<Omit<QuotationItem, 'lineTotal'>[]>([
    { id: 'item-1', description: 'Excavation & site grading prep', qty: 1, unitPrice: 150000 },
    { id: 'item-2', description: 'Reinforced concrete slabs casting M25', qty: 10, unitPrice: 35000 },
    { id: 'item-3', description: 'Structural steel girders delivery & fabrication', qty: 12, unitPrice: 42000 }
  ]);

  // Temp addition item state
  const [tempDesc, setTempDesc] = useState('');
  const [tempQty, setTempQty] = useState('');
  const [tempPrice, setTempPrice] = useState('');

  const appendQuotationItem = () => {
    if (!tempDesc || !tempQty || !tempPrice) return;
    setItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        description: tempDesc,
        qty: parseFloat(tempQty),
        unitPrice: parseFloat(tempPrice)
      }
    ]);
    setTempDesc('');
    setTempQty('');
    setTempPrice('');
  };

  const removeQuotationItem = (itemId: string) => {
    setItems(prev => prev.filter(it => it.id !== itemId));
  };

  // Convert Quote Item with lineTotal calculations
  const calculateGrossItems = () : QuotationItem[] => {
    return items.map(it => ({
      ...it,
      lineTotal: it.qty * it.unitPrice
    }));
  };

  const handleCreateQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    const grossItems = calculateGrossItems();
    if (grossItems.length === 0 || !cName) {
      alert('Ensure you populate the items grid before compiling quotation.');
      return;
    }

    addQuotation({
      quoteNumber: qNumber,
      clientName: cName,
      clientAddress: cAddress,
      clientPhone: cPhone,
      clientEmail: cEmail,
      date: qDate,
      items: grossItems,
      gstRate: parseFloat(qGst),
      notes: qNotes,
      logoAttached: qLogo || settings.logoUrl,
      projectId: qProjId
    });

    setIsCreating(false);
    // Reset Form fields
    setQNumber(`QT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    setCName('');
    setCAddress('');
    setCPhone('');
    setCEmail('');
    setItems([
      { id: 'item-1', description: 'Site surveys & earthworks', qty: 1, unitPrice: 15000 }
    ]);
  };

  // Handle local image uploads inside Quotations
  const handleClientLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setQLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePrintInNewWindow = () => {
    if (!selectedQuote) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Popup blocker active! Please click 'Allow Popups' or use the 'Download Offline Document' button.");
      return;
    }
    printWindow.document.write(generateFullInvoiceHtml(selectedQuote, settings, formatRupees));
    printWindow.document.close();
  };

  const handleDownloadHTML = () => {
    if (!selectedQuote) return;
    const htmlContent = generateFullInvoiceHtml(selectedQuote, settings, formatRupees);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Estimation-${selectedQuote.quoteNumber}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadToDrive = async () => {
    if (!selectedQuote) return;
    setIsUploadingToDrive(true);
    setDriveSyncMessage({});

    try {
      let token = await getAccessToken();
      if (!token) {
        const isConfirmed = window.confirm("Connect to your Google Account to authorize direct exports onto Google Drive. Click OK to connect now.");
        if (!isConfirmed) {
          setIsUploadingToDrive(false);
          return;
        }
        const authRes = await googleSignInWithDrive();
        if (!authRes?.accessToken) {
          throw new Error("Failed to authenticate with Google Account.");
        }
        token = authRes.accessToken;
      }

      const htmlContent = generateFullInvoiceHtml(selectedQuote, settings, formatRupees);
      const backupFilename = `Estimation_No_${selectedQuote.quoteNumber}.html`;

      const metadata = {
        name: backupFilename,
        mimeType: 'text/html',
        description: `Official Client Estimating Sheet, issued on ${selectedQuote.date} from Onsite Build-Pro Construction ERP`
      };

      const boundary = 'onsite_invoice_boundary';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;
      
      const compositeBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: text/html; charset=UTF-8\r\n\r\n' +
        htmlContent +
        closeDelimiter;

      const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink';
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: compositeBody
      });

      if (!response.ok) {
        throw new Error(`Google Drive API returned response error: ${response.status}`);
      }

      const uploadData = await response.json();
      const invoiceUrl = uploadData.webViewLink || `https://drive.google.com/file/d/${uploadData.id}/view?usp=drivesdk`;

      setDriveSyncMessage({ 
        success: `Excellent! Invoice "${backupFilename}" successfully exported and backed up inside your Google Drive.`,
        invoiceUrl: invoiceUrl
      });
      setTimeout(() => setDriveSyncMessage({}), 20000);
    } catch (err: any) {
      console.error('Google Drive invoice backup failed:', err);
      let errMsg = err.message || String(err);
      if (errMsg.includes('popup-closed-by-user') || errMsg.includes('access_denied') || errMsg.includes('cancelled-popup-request') || errMsg.includes('auth/')) {
        errMsg = "Authentication blocked/closed. Make sure your Google Email is added as a 'Test User' in your Google Cloud Console, or check instructions on the 'Cloud Sync' page.";
      }
      setDriveSyncMessage({ error: `Upload Failed: ${errMsg}` });
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  // focused active quotation calculations
  const selectedQuote = quotations.find(q => q.id === activeQuoteId);
  const selectedSubtotal = selectedQuote?.items.reduce((sum, i) => sum + i.lineTotal, 0) || 0;
  const selectedTax = Math.round(selectedSubtotal * ((selectedQuote?.gstRate || 18) / 100));
  const selectedGrandTotal = selectedSubtotal + selectedTax;

  // active editor calculations
  const editingSubtotal = items.reduce((sum, i) => sum + (i.qty * i.unitPrice), 0);
  const editingTax = Math.round(editingSubtotal * (parseFloat(qGst || '18') / 100));
  const editingGrandTotal = editingSubtotal + editingTax;

  return (
    <div id="quotations-page" className="space-y-6">
      
      {/* 1. VIEW/PRINT FULL INVOICE SCREEN OVERFLOW */}
      {selectedQuote ? (
        <div id="quotation-print-viewer" className="space-y-6 animate-fade-in pb-12 font-sans text-xs">
          
          {/* Header Dashboard Controls Bar (no-print) */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs no-print space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                onClick={() => setActiveQuoteId(null)}
                className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-xs cursor-pointer bg-slate-50 px-3 py-1.5 rounded-lg transition-all border shrink-0 self-start sm:self-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Invoice Registry</span>
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-3.5 rounded-xl inline-flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  title="Direct print this layout (might be limited inside browser sandboxes)"
                >
                  <Printer className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                  <span>Direct Print / PDF</span>
                </button>

                <button
                  onClick={handlePrintInNewWindow}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-2 px-3.5 rounded-xl inline-flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  title="Open invoice in a fresh browser tab to fully bypass preview iframe block"
                >
                  <ExternalLink className="w-4 h-4 text-slate-950" />
                  <span>Open & Print in New Tab (Bypass)</span>
                </button>

                <button
                  onClick={handleDownloadHTML}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl inline-flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  title="Get vector-perfect standalone HTML file with self-firing print dialog"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>Download HTML Invoice</span>
                </button>

                <button
                  onClick={handleUploadToDrive}
                  disabled={isUploadingToDrive}
                  className="bg-blue-650 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-xs py-2 px-3.5 rounded-xl inline-flex items-center gap-1.5 transition-all shadow-sm cursor-pointer border border-blue-500/10"
                  title="Upload this estimate document to Google Drive storage"
                >
                  <Cloud className="w-4 h-4 text-white" />
                  <span>{isUploadingToDrive ? 'Syncing...' : 'Save to Google Drive'}</span>
                </button>
              </div>
            </div>

            {driveSyncMessage.success && (
              <div className="bg-emerald-50 border border-emerald-150 p-3 rounded-xl text-emerald-800 text-[11px] font-semibold animate-fade-in space-y-2">
                <div>{driveSyncMessage.success}</div>
                {driveSyncMessage.invoiceUrl && (
                  <div className="pt-1.5">
                    <a
                      href={driveSyncMessage.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-extrabold hover:underline inline-flex items-center gap-1.5 bg-white border border-slate-200 py-1.5 px-3 rounded-lg shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>Open Exported Invoice in Drive ↗</span>
                    </a>
                  </div>
                )}
              </div>
            )}
            {driveSyncMessage.error && (
              <div className="bg-rose-50 border border-rose-150 p-3 rounded-xl text-rose-800 text-[11px] font-bold animate-fade-in">
                {driveSyncMessage.error}
              </div>
            )}

            {/* Print Friendly Informational Box inside the iframe preview */}
            <div className="bg-amber-50/60 border border-amber-100/80 rounded-xl p-3 text-[11px] text-amber-850 space-y-1 my-1 leading-relaxed font-semibold">
              <div className="flex items-center gap-2 text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-extrabold uppercase tracking-wide">Iframe Sandbox Printing Notice</span>
              </div>
              <p className="text-amber-800">
                AI Studio hosts development previews inside a sandboxed iframe. Browser security usually blocks direct print dialogs inside web sandboxes. 
                For a 100% flawless vector-perfect print & PDF:
              </p>
              <ul className="list-disc pl-3 text-amber-700 space-y-0.5 font-medium">
                <li>Click the <strong className="text-amber-955">Open & Print in New Tab (Bypass)</strong> button above.</li>
                <li>Or click <strong className="text-emerald-955">Download HTML Invoice</strong> to save a vector-perfect invoice file that triggers print immediately upon opening!</li>
                <li>Or click the arrow-out **"Open App in New Tab"** icon in the top right of your AI Studio browser environment first, then hit print.</li>
              </ul>
            </div>
          </div>

          {/* Letterhead Estimation Paper (Fully clean styled for print outputs!) */}
          <div className="bg-white border p-8 shadow-md rounded-2xl max-w-4xl mx-auto print-card print:border-none font-sans text-slate-800">
            {/* Top Layout */}
            <div className="flex justify-between items-start gap-12 pb-6 border-b border-slate-200">
              <div className="space-y-3">
                {/* Dynamically Attached Quote Logo or fallback settings logo or generic branding */}
                {selectedQuote.logoAttached ? (
                  <img 
                    src={selectedQuote.logoAttached} 
                    alt="Billing Representative Logo" 
                    className="h-16 w-auto object-contain rounded border border-slate-100 p-1"
                    referrerPolicy="no-referrer"
                  />
                ) : settings.logoUrl ? (
                  <img 
                    src={settings.logoUrl} 
                    alt="Corporate Brand Logo" 
                    className="h-16 w-auto object-contain rounded border border-slate-100 p-1"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="inline-flex items-center gap-1 bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded">
                    <span>{settings.appName || 'Onsite Build-Pro'}</span>
                  </div>
                )}

                <div className="space-y-0.5 text-slate-500 text-[11px] leading-tight font-sans font-medium">
                  <p className="font-bold text-slate-800 text-sm">{settings.appName || 'Onsite Build-Pro'}</p>
                  <p>{settings.appSubtitle || 'Industrial Estimations Office'}</p>
                  <p>In cooperation with shinchan007006 PM accounts</p>
                </div>
              </div>

              <div className="text-right space-y-1">
                <h2 className="text-xl font-black text-slate-900 tracking-wider">OFFICIAL ESTIMATION</h2>
                <div className="font-mono text-[11px] text-slate-400 font-bold space-y-0.5 leading-none">
                  <p className="font-bold text-slate-800">No: {selectedQuote.quoteNumber}</p>
                  <p>Date: {selectedQuote.date}</p>
                </div>
              </div>
            </div>

            {/* Client address details */}
            <div className="grid grid-cols-2 gap-8 py-6 text-xs">
              <div className="space-y-1.5 bg-slate-50 border p-3.5 rounded-xl print:bg-white print:p-0">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Customer Destination:</span>
                <h4 className="font-bold text-slate-850 text-sm leading-snug">{selectedQuote.clientName}</h4>
                <p className="text-slate-500 whitespace-pre-line leading-relaxed font-semibold">{selectedQuote.clientAddress || 'No Address Declared.'}</p>
                {(selectedQuote.clientPhone || selectedQuote.clientEmail) && (
                  <div className="text-[11px] text-slate-650 font-medium space-y-0.5 border-t border-slate-200/60 pt-1.5 mt-1.5 font-sans whitespace-nowrap">
                    {selectedQuote.clientPhone && (
                      <p className="flex items-center gap-1">
                        <span className="text-slate-400 font-bold">Phone:</span> {selectedQuote.clientPhone}
                      </p>
                    )}
                    {selectedQuote.clientEmail && (
                      <p className="flex items-center gap-1">
                        <span className="text-slate-400 font-bold">Email:</span> {selectedQuote.clientEmail}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1 text-right self-end">
                <p className="text-slate-400 font-semibold">Terms & Validity:</p>
                <p className="font-bold text-slate-700">Valid for 30 execution business days</p>
                <p className="text-slate-500 text-[10px]">Reference Project ID: {selectedQuote.projectId || 'Central Office'}</p>
              </div>
            </div>

            {/* Items estimation list */}
            <table className="w-full text-left text-xs border-collapse mt-4">
              <thead>
                <tr className="border-b-2 border-slate-900 text-slate-900 font-bold bg-slate-50 uppercase print:bg-slate-100">
                  <th className="py-2.5 px-3">Itemized description</th>
                  <th className="py-2.5 px-3 text-right">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price (₹)</th>
                  <th className="py-2.5 px-3 text-right font-mono">Row Net (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {selectedQuote.items.map((it, idx) => (
                  <tr key={it.id} className="hover:bg-slate-50/40">
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-800">{idx + 1}. {it.description}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium text-slate-700">{it.qty}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-705">{formatRupees(it.unitPrice)}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{formatRupees(it.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals and GST accounting */}
            <div className="flex justify-between items-start gap-12 mt-8 pt-6 border-t border-slate-200 text-xs">
              <div className="max-w-md space-y-1.5 leading-relaxed bg-slate-50 p-4 rounded-xl border print:p-0 print:border-none">
                <span className="text-[9px] text-amber-700 uppercase font-black block tracking-wider font-sans">Payment Estimations Memo</span>
                <p className="text-[11px] text-slate-600 font-semibold whitespace-pre-line leading-relaxed">
                  {selectedQuote.notes || 'No payment terms saved.'}
                </p>
              </div>

              <div className="w-80 space-y-2 text-xs">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-400">Total Items Aggregate:</span>
                  <span className="font-mono text-slate-900 font-bold">{formatRupees(selectedSubtotal)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-400">GST Outlay ({selectedQuote.gstRate}%):</span>
                  <span className="font-mono text-slate-800 font-medium">{formatRupees(selectedTax)}</span>
                </div>
                <hr className="border-t border-slate-200" />
                <div className="flex justify-between font-extrabold text-sm text-slate-900 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/15">
                  <span className="uppercase tracking-wide text-xs">Gross Grand Total (₹):</span>
                  <span className="font-mono text-slate-950 font-black">{formatRupees(selectedGrandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Signature Box */}
            <div className="mt-16 flex justify-between gap-12 text-center text-slate-500 text-[10px]">
              <div>
                <p className="h-10 border-b border-dashed border-slate-300 w-44 mx-auto"></p>
                <p className="mt-1.5 font-bold uppercase text-[9px] tracking-wider text-slate-600">Client Sign-off Authorization</p>
              </div>

              <div>
                <p className="h-10 border-b border-dashed border-slate-300 w-44 mx-auto"></p>
                <p className="mt-1.5 font-bold uppercase text-[9px] tracking-wider text-slate-600">Authorized Accountant Seal</p>
              </div>
            </div>

          </div>
        </div>
      ) : isCreating ? (
        
        // 2. CREATING WORKFLOW INVOICIAL EST
        <div id="quotation-form" className="space-y-6 animate-fade-in font-sans text-xs">
          
          <div className="flex items-center justify-between no-print">
            <div>
              <h2 className="text-lg font-bold">Compile Estimation Quotation</h2>
              <p className="text-xs text-slate-400">Add dynamic billing items, assign client data, and upload customized logos.</p>
            </div>
            <button
              onClick={() => setIsCreating(false)}
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-bold py-1.5 px-3 bg-slate-100 rounded-lg cursor-pointer border"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Discard Compilation</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Form Details Column */}
            <form onSubmit={handleCreateQuotation} className="bg-white p-6 rounded-2xl border border-slate-200/85 shadow-xs lg:col-span-2 space-y-6">
              
              {/* Header Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Estimation Quote Ref #</label>
                  <input
                    type="text"
                    required
                    value={qNumber}
                    onChange={(e) => setQNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2 px-3 rounded-lg font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quotation Date</label>
                  <input
                    type="date"
                    required
                    value={qDate}
                    onChange={(e) => setQDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2 px-3 rounded-lg font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Associated Active Project (Optional)</label>
                  <select
                    value={qProjId}
                    onChange={(e) => setQProjId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 text-slate-805 text-xs py-2.5 px-3 rounded-lg"
                  >
                    <option value="">-- Central General Scope --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">GST Tax Outflow Rate (%)</label>
                  <input
                    type="number"
                    value={qGst}
                    onChange={(e) => setQGst(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2.5 px-3 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              {/* Client specifications */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Prospect Person Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sterling Developers Board"
                    value={cName}
                    onChange={(e) => setCName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-850 text-xs py-2.5 px-3 rounded-lg focus:ring-2 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Billing Address Layout</label>
                  <input
                    type="text"
                    placeholder="Whitefield Outer ring Road 12, Bengaluru"
                    value={cAddress}
                    onChange={(e) => setCAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-202 text-slate-800 text-xs py-2.5 px-3 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Client Phone Number (Optional)</label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={cPhone}
                    onChange={(e) => setCPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-202 text-slate-850 text-xs py-2.5 px-3 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Client Email Address (Optional)</label>
                  <input
                    type="email"
                    placeholder="e.g. client@gmail.com"
                    value={cEmail}
                    onChange={(e) => setCEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-202 text-slate-850 text-xs py-2.5 px-3 rounded-lg"
                  />
                </div>
              </div>

              {/* Upload specified logo inside quotes */}
              <div className="bg-slate-50/50 p-4 border border-dashed border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-slate-700 text-xs text-slate-800">Quotation Branding Logo (Optional)</span>
                </div>
                <p className="text-[10px] text-slate-400">Attach a customized corporate symbol. If left blank, it falls back to the App logo settings.</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleClientLogoUpload}
                  className="w-full text-xs text-slate-500 file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:px-3 file:py-1.5 file:rounded cursor-pointer"
                />
                {qLogo && (
                  <div className="mt-2 border p-1 rounded w-max bg-white">
                    <img 
                      src={qLogo} 
                      alt="Local Upload preview" 
                      className="h-12 w-auto object-contain rounded" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>

              {/* Interactive Items addition grid */}
              <div className="space-y-3 pt-2">
                <h3 className="font-bold text-slate-800 block text-xs uppercase tracking-wider">Itemization Roster Table ({items.length})</h3>
                
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/70">
                        <th className="py-2.5 px-3">Description Comments</th>
                        <th className="py-2.5 px-3 text-right">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Price (₹)</th>
                        <th className="py-2.5 px-3 text-right">Total Outlay</th>
                        <th className="py-2.5 px-3 text-center">Manage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {items.map(it => (
                        <tr key={it.id}>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{it.description}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-650">{it.qty}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-650">{formatRupees(it.unitPrice)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatRupees(it.qty * it.unitPrice)}</td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeQuotationItem(it.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}

                      {/* Interactive Builder row (Inline) */}
                      <tr className="bg-slate-50/40">
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            placeholder="Add item details..."
                            value={tempDesc}
                            onChange={(e) => setTempDesc(e.target.value)}
                            className="w-full bg-white border border-slate-200 text-xs py-1.5 px-2 rounded-md"
                          />
                        </td>
                        <td className="py-2 px-2 w-20">
                          <input
                            type="number"
                            placeholder="1"
                            value={tempQty}
                            onChange={(e) => setTempQty(e.target.value)}
                            className="w-full bg-white border border-slate-200 text-xs py-1.5 px-2 rounded-md text-right font-mono"
                          />
                        </td>
                        <td className="py-2 px-2 w-28">
                          <input
                            type="number"
                            placeholder="Unit Price"
                            value={tempPrice}
                            onChange={(e) => setTempPrice(e.target.value)}
                            className="w-full bg-white border border-slate-200 text-xs py-1.5 px-2 rounded-md text-right font-mono"
                          />
                        </td>
                        <td className="py-2 px-2 text-right text-slate-400 italic">Auto Net</td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={appendQuotationItem}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold p-1.5 rounded-md cursor-pointer inline-flex items-center"
                            title="Add item row"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment conditions terms */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Default Payment Terms & Memo</label>
                <textarea
                  rows={3}
                  value={qNotes}
                  onChange={(e) => setQNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-202 text-slate-805 text-xs py-2 px-3 rounded-lg"
                ></textarea>
              </div>

              {/* Compile Button */}
              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  id="btn-save-compiled-quotation"
                  className="bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs py-2.5 px-5 rounded-xl inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Save className="w-4 h-4 text-amber-400" />
                  <span>Build Quotation Profile</span>
                </button>
              </div>

            </form>

            {/* Live Estimations Preview Sidebar (on Edit) */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-lg h-max space-y-4">
              <h3 className="font-bold text-amber-405 text-xs uppercase tracking-wider font-sans">Compilations Sheet Live Preview</h3>
              <hr className="border-t border-slate-800" />
              
              <div className="space-y-2.5 text-xs leading-none">
                <div className="flex justify-between">
                  <span className="text-slate-450">Prospect Firm:</span>
                  <span className="font-bold text-slate-100 truncate max-w-[140px]">{cName || 'Unnamed Lead'}</span>
                </div>
                {cPhone && (
                  <div className="flex justify-between font-sans">
                    <span className="text-slate-450">Phone:</span>
                    <span className="text-slate-300 font-semibold truncate max-w-[140px]">{cPhone}</span>
                  </div>
                )}
                {cEmail && (
                  <div className="flex justify-between font-sans">
                    <span className="text-slate-450">Email:</span>
                    <span className="text-slate-300 font-semibold truncate max-w-[140px]">{cEmail}</span>
                  </div>
                )}
                <div className="flex justify-between font-mono">
                  <span className="text-slate-455">Date Stamp:</span>
                  <span className="text-slate-300">{qDate}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-455">Items Count:</span>
                  <span className="text-slate-305">{items.length} Rows</span>
                </div>
              </div>

              <hr className="border-t border-slate-850" />

              <div className="space-y-1.5 font-sans">
                <div className="flex justify-between text-slate-400 font-semibold mb-1">
                  <span>Gross Net Subtotal:</span>
                  <span className="font-mono text-white">{formatRupees(editingSubtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-400 font-semibold mb-1">
                  <span>GST Tax Outflow ({qGst}%):</span>
                  <span className="font-mono text-slate-300">{formatRupees(editingTax)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-950 bg-amber-500 border border-amber-400 p-2.5 rounded-xl">
                  <span>GRAND ESTIMATE:</span>
                  <span className="font-mono">{formatRupees(editingGrandTotal)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : (
        
        // 3. MASTER ESTIMATION RECORDS LIST
        <div id="quotations-list" className="space-y-6 animate-fade-in font-sans text-xs">
          
          {/* Section banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 id="quotations-header-title" className="text-2xl font-bold text-slate-900 tracking-tight">
                Billing Estimation & Proposals
              </h1>
              <p className="text-sm text-slate-500">
                Generate estimation worksheets, attach specific logos, compile Indian GST levels (₹), and print professional business PDFs.
              </p>
            </div>
            <button
              id="btn-goto-compilation-view"
              onClick={() => setIsCreating(true)}
              className="bg-slate-905 hover:bg-slate-805 text-white font-bold text-xs h-10 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4 text-amber-400 stroke-[2.5]" />
              <span>Compile Estimations Sheet</span>
            </button>
          </div>

          {/* Quotations lists grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quotations.length > 0 ? (
              quotations.map(q => {
                const subTot = q.items.reduce((sum, item) => sum + item.lineTotal, 0);
                const taxTot = Math.round(subTot * (q.gstRate / 100));
                const grand = subTot + taxTot;

                return (
                  <div key={q.id} id={`quotation-card-${q.id}`} className="bg-white border p-5 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 font-sans border-slate-200">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="font-mono text-[9px] font-bold text-amber-500 bg-slate-50 border px-2 py-0.5 rounded">
                          {q.quoteNumber}
                        </span>
                        <h3 id={`quot-client-title-${q.id}`} className="font-bold text-slate-850 text-sm leading-snug pt-1 truncate max-w-[170px]">{q.clientName}</h3>
                      </div>
                      
                      <span className="font-mono text-[9px] text-slate-400 font-bold self-start mt-0.5">{q.id}</span>
                    </div>

                    <div className="space-y-2 pt-1 text-xs leading-none">
                      <div className="flex justify-between font-mono text-[10px]">
                        <span className="text-slate-400 font-semibold font-sans">Compiled Date:</span>
                        <span className="text-slate-600 font-medium">{q.date}</span>
                      </div>
                      <div className="flex justify-between font-mono text-[10px]">
                        <span className="text-slate-400 font-semibold font-sans">Estimate Scope size:</span>
                        <span className="text-slate-650 font-semibold">{q.items.length} Line Items</span>
                      </div>
                      {(q.clientPhone || q.clientEmail) && (
                        <div className="space-y-1 pt-1.5 border-t border-slate-100 mt-1.5 text-[10px]">
                          {q.clientPhone && (
                            <div className="flex justify-between text-slate-500 font-sans leading-tight">
                              <span className="font-semibold text-slate-400">Phone:</span>
                              <span className="font-medium text-slate-700">{q.clientPhone}</span>
                            </div>
                          )}
                          {q.clientEmail && (
                            <div className="flex justify-between text-slate-500 font-sans leading-tight">
                              <span className="font-semibold text-slate-400">Email:</span>
                              <span className="font-medium text-slate-700 truncate max-w-[140px]" title={q.clientEmail}>{q.clientEmail}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center bg-slate-50 border p-2.5 rounded-xl font-mono">
                        <span className="font-sans text-[10px] text-slate-500 font-semibold uppercase">Grand Value (₹):</span>
                        <span className="font-bold text-slate-900 font-mono text-sm">{formatRupees(grand)}</span>
                      </div>
                    </div>

                    {/* Manage actions */}
                    <div className="flex pt-1 border-t border-slate-100 justify-end gap-2 font-sans">
                      {deletingId === q.id ? (
                        <div className="flex items-center gap-1.5 bg-rose-50 border border-slate-200 p-1 rounded-lg">
                          <span className="text-[10px] text-rose-600 font-bold px-1 uppercase shrink-0">Erase?</span>
                          <button
                            onClick={() => {
                              deleteQuotation(q.id);
                              setDeletingId(null);
                            }}
                            className="bg-red-650 hover:bg-red-700 text-white text-[10px] font-black px-2 py-0.5 rounded cursor-pointer shrink-0"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingId(q.id)}
                          className="p-1.5 border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          title="Delete Quotation record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      
                      <button
                        id={`btn-quote-review-${q.id}`}
                        onClick={() => setActiveQuoteId(q.id)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2 px-3.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review & Print</span>
                      </button>
                    </div>

                  </div>
                );
              })
            ) : (
              <div className="col-span-1 md:col-span-3 bg-white p-12 text-center rounded-2xl border flex flex-col items-center justify-center space-y-3">
                <AlertCircle className="w-10 h-10 text-slate-350 animate-pulse" />
                <h3 className="font-bold text-slate-850">Estimation Registry holds no profiles</h3>
                <p className="text-xs text-slate-400 max-w-sm">Use the builder above to configure professional billing estimates with standard GST tax rates in INR (₹).</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
