import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storageService';
import { Madrasah, PaymentRecord, ExpenseRecord, OrganizationConfig, ActiveTab, AuthSession, AppRole, FeeItem } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { PaymentsView } from './components/PaymentsView';
import { PaymentMatrixView } from './components/PaymentMatrixView';
import { ExpensesView } from './components/ExpensesView';
import { FinancialReportsView } from './components/FinancialReportsView';
import { WhatsAppHubView } from './components/WhatsAppHubView';
import { MadrasahDirectoryView } from './components/MadrasahDirectoryView';
import { FeeManagementView } from './components/FeeManagementView';
import { MemberPortalView } from './components/MemberPortalView';
import { AccessCodesView } from './components/AccessCodesView';
import { OrganizationProfileView } from './components/OrganizationProfileView';
import { BackupRestoreView } from './components/BackupRestoreView';
import { MobileBottomNav } from './components/MobileBottomNav';
import { QuickPaymentModal } from './components/QuickPaymentModal';
import { VerificationModal } from './components/VerificationModal';
import { ReceiptModal } from './components/ReceiptModal';
import { SettingsModal } from './components/SettingsModal';
import { LoginPortalModal } from './components/LoginPortalModal';
import { ADMIN_CREDENTIALS } from './utils/authUtils';
import { isPaymentInAcademicYear } from './utils/formatters';

export const App: React.FC = () => {
  // Global State initialized from LocalStorage
  const [madrasahs, setMadrasahs] = useState<Madrasah[]>(() => StorageService.getMadrasahs());
  const [payments, setPayments] = useState<PaymentRecord[]>(() => StorageService.getPayments());
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => StorageService.getExpenses());
  const [feeItems, setFeeItems] = useState<FeeItem[]>(() => StorageService.getFeeItems());
  const [orgConfig, setOrgConfig] = useState<OrganizationConfig>(() => StorageService.getConfig());

  // Role Session Authentication
  const [session, setSession] = useState<AuthSession | null>(() => {
    const saved = StorageService.getAuthSession();
    if (saved) return saved;
    // Default initial session: Ketua
    return {
      role: 'ketua',
      userName: StorageService.getConfig().chairmanName || ADMIN_CREDENTIALS.ketua.defaultName,
      userTitle: 'Ketua KKMTS (Full Akses Seluruh Menu)',
      accessCode: ADMIN_CREDENTIALS.ketua.code,
    };
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // UI Navigation & Filters
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const saved = StorageService.getAuthSession();
    if (saved?.role === 'bendahara') return 'payments';
    if (saved?.role === 'anggota') return 'portal';
    return 'dashboard';
  });

  const [selectedYear, setSelectedYear] = useState<number>(() => 2026);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [defaultPaymentMadrasahId, setDefaultPaymentMadrasahId] = useState<string | undefined>(undefined);
  const [defaultPaymentMonth, setDefaultPaymentMonth] = useState<number | undefined>(undefined);
  const [defaultPaymentFeeItemId, setDefaultPaymentFeeItemId] = useState<string | undefined>(undefined);

  const [verificationPayment, setVerificationPayment] = useState<PaymentRecord | null>(null);
  const [receiptPayment, setReceiptPayment] = useState<PaymentRecord | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Synchronize with LocalStorage on updates
  useEffect(() => {
    StorageService.saveMadrasahs(madrasahs);
  }, [madrasahs]);

  useEffect(() => {
    StorageService.savePayments(payments);
  }, [payments]);

  useEffect(() => {
    StorageService.saveExpenses(expenses);
  }, [expenses]);

  useEffect(() => {
    StorageService.saveFeeItems(feeItems);
  }, [feeItems]);

  useEffect(() => {
    StorageService.saveConfig(orgConfig);
  }, [orgConfig]);

  useEffect(() => {
    StorageService.saveAuthSession(session);
  }, [session]);

  // Adjust active tab if role changes
  const handleLoginSuccess = (newSession: AuthSession) => {
    setSession(newSession);
    setIsLoginModalOpen(false);

    if (newSession.role === 'ketua') {
      setActiveTab('dashboard');
    } else if (newSession.role === 'bendahara') {
      setActiveTab('payments');
    } else if (newSession.role === 'anggota') {
      setActiveTab('portal');
    }
  };

  const handleLogout = () => {
    setIsLoginModalOpen(true);
  };

  // Handlers for Payment Operations
  const handleCreatePayment = (newPayment: PaymentRecord) => {
    const updated = [newPayment, ...payments];
    setPayments(updated);
    StorageService.savePayments(updated);
  };

  const handleApprovePayment = (paymentId: string) => {
    const updated = payments.map((p) =>
      p.id === paymentId
        ? {
            ...p,
            status: 'verified' as const,
            verifiedAt: new Date().toISOString(),
            verifiedBy: orgConfig.treasurerName,
          }
        : p
    );
    setPayments(updated);
    StorageService.savePayments(updated);
    
    // Automatically open receipt
    const approved = updated.find(p => p.id === paymentId);
    if (approved) {
      setReceiptPayment(approved);
    }
  };

  const handleRejectPayment = (paymentId: string, reason: string) => {
    const updated = payments.map((p) =>
      p.id === paymentId
        ? {
            ...p,
            status: 'rejected' as const,
            rejectionReason: reason,
          }
        : p
    );
    setPayments(updated);
    StorageService.savePayments(updated);
  };

  const handleDeletePayment = (paymentId: string) => {
    const updated = payments.filter(p => p.id !== paymentId);
    setPayments(updated);
    StorageService.savePayments(updated);
  };

  // Handlers for Expenses
  const handleAddExpense = (newExpense: ExpenseRecord) => {
    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    StorageService.saveExpenses(updated);
  };

  const handleDeleteExpense = (expenseId: string) => {
    const updated = expenses.filter(e => e.id !== expenseId);
    setExpenses(updated);
    StorageService.saveExpenses(updated);
  };

  // Handlers for Madrasah Directory
  const handleAddMadrasah = (newM: Madrasah) => {
    const updated = [...madrasahs, newM];
    setMadrasahs(updated);
    StorageService.saveMadrasahs(updated);
  };

  const handleUpdateMadrasah = (updatedM: Madrasah) => {
    const updated = madrasahs.map(m => m.id === updatedM.id ? updatedM : m);
    setMadrasahs(updated);
    StorageService.saveMadrasahs(updated);
  };

  const handleUpdateMultipleMadrasahs = (updatedList: Madrasah[]) => {
    setMadrasahs(updatedList);
    StorageService.saveMadrasahs(updatedList);
  };

  const handleDeleteMadrasah = (madrasahId: string) => {
    const updated = madrasahs.filter(m => m.id !== madrasahId);
    setMadrasahs(updated);
    StorageService.saveMadrasahs(updated);
  };

  // Reset demo data handler
  const handleResetData = () => {
    StorageService.resetToDefault();
    setMadrasahs(StorageService.getMadrasahs());
    setPayments(StorageService.getPayments());
    setExpenses(StorageService.getExpenses());
    setFeeItems(StorageService.getFeeItems());
    setOrgConfig(StorageService.getConfig());
  };

  // Handlers for Backup, Restore & Clear Data
  const handleRestoreSuccess = (newData: {
    madrasahs: Madrasah[];
    payments: PaymentRecord[];
    expenses: ExpenseRecord[];
    feeItems: FeeItem[];
    config?: OrganizationConfig;
  }) => {
    setMadrasahs(newData.madrasahs);
    setPayments(newData.payments);
    setExpenses(newData.expenses);
    setFeeItems(newData.feeItems);
    if (newData.config) {
      setOrgConfig(newData.config);
    }
  };

  const handleClearTransactions = () => {
    StorageService.clearTransactionsOnly();
    setPayments([]);
    setExpenses([]);
  };

  const handleClearAllData = () => {
    StorageService.clearAllDataTotal();
    setPayments([]);
    setExpenses([]);
    setMadrasahs([]);
    setFeeItems([]);
  };

  // Quick Open Modal Helpers
  const handleOpenNewPayment = () => {
    if (session?.role === 'anggota' && session.madrasahId) {
      setDefaultPaymentMadrasahId(session.madrasahId);
    } else {
      setDefaultPaymentMadrasahId(undefined);
    }
    setDefaultPaymentMonth(undefined);
    setDefaultPaymentFeeItemId(undefined);
    setIsPaymentModalOpen(true);
  };

  const handleOpenPaymentForMonth = (madrasahId: string, month: number, feeItemId?: string) => {
    setDefaultPaymentMadrasahId(madrasahId);
    setDefaultPaymentMonth(month);
    setDefaultPaymentFeeItemId(feeItemId);
    setIsPaymentModalOpen(true);
  };

  const pendingPaymentsCount = payments.filter(
    p => p.status === 'pending' && isPaymentInAcademicYear(p, selectedYear)
  ).length;

  const currentRole = session?.role || 'ketua';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex font-sans antialiased selection:bg-emerald-500 selection:text-white">
      
      {/* Bento Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        org={orgConfig}
        pendingCount={pendingPaymentsCount}
        session={session}
        onOpenNewPayment={handleOpenNewPayment}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        
        {/* Top Bento Header Bar */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          orgConfig={orgConfig}
          session={session}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          pendingCount={pendingPaymentsCount}
          onOpenNewPayment={handleOpenNewPayment}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* Dynamic Bento View Main Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 pb-24 lg:pb-8">
          
          {/* ROLE 1: KETUA (Semua menu) */}
          {activeTab === 'dashboard' && currentRole === 'ketua' && (
            <DashboardView
              payments={payments}
              expenses={expenses}
              madrasahs={madrasahs}
              org={orgConfig}
              selectedYear={selectedYear}
              onOpenNewPayment={handleOpenNewPayment}
              setActiveTab={setActiveTab}
              onSelectPaymentForVerification={(p) => setVerificationPayment(p)}
              onSelectPaymentForReceipt={(p) => setReceiptPayment(p)}
            />
          )}

          {/* ROLE 1 (KETUA) & ROLE 2 (BENDAHARA): Iuran & Penerimaan */}
          {activeTab === 'payments' && (currentRole === 'ketua' || currentRole === 'bendahara') && (
            <PaymentsView
              payments={payments}
              madrasahs={madrasahs}
              org={orgConfig}
              selectedYear={selectedYear}
              onOpenNewPayment={handleOpenNewPayment}
              onSelectPaymentForVerification={(p) => setVerificationPayment(p)}
              onSelectPaymentForReceipt={(p) => setReceiptPayment(p)}
              onDeletePayment={handleDeletePayment}
            />
          )}

          {/* ROLE 1: KETUA - Matriks 12 Bulan */}
          {activeTab === 'matrix' && currentRole === 'ketua' && (
            <PaymentMatrixView
              madrasahs={madrasahs}
              payments={payments}
              org={orgConfig}
              selectedYear={selectedYear}
              onOpenNewPaymentForMonth={handleOpenPaymentForMonth}
              onSelectPaymentForVerification={(p) => setVerificationPayment(p)}
              onSelectPaymentForReceipt={(p) => setReceiptPayment(p)}
            />
          )}

          {/* ROLE 1 (KETUA) & ROLE 2 (BENDAHARA): Kas Keluar / Pengeluaran */}
          {activeTab === 'expenses' && (currentRole === 'ketua' || currentRole === 'bendahara') && (
            <ExpensesView
              expenses={expenses}
              feeItems={feeItems}
              payments={payments}
              org={orgConfig}
              selectedYear={selectedYear}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          {/* ROLE 1: KETUA - Pengaturan Kewajiban & Pos Iuran (Wajib & Sukarela) */}
          {activeTab === 'fees' && currentRole === 'ketua' && (
            <FeeManagementView
              feeItems={feeItems}
              madrasahs={madrasahs}
              payments={payments}
              org={orgConfig}
              selectedYear={selectedYear}
              onUpdateFeeItems={(items) => setFeeItems(items)}
              onUpdateOrgConfig={(cfg) => setOrgConfig(cfg)}
              onOpenNewPaymentForMadrasah={(mId, fId) => {
                setDefaultPaymentMadrasahId(mId);
                setDefaultPaymentFeeItemId(fId);
                setIsPaymentModalOpen(true);
              }}
            />
          )}

          {/* ROLE 1: KETUA - Laporan BKU */}
          {activeTab === 'reports' && currentRole === 'ketua' && (
            <FinancialReportsView
              payments={payments}
              expenses={expenses}
              madrasahs={madrasahs}
              org={orgConfig}
              selectedYear={selectedYear}
            />
          )}

          {/* ROLE 1: KETUA - WhatsApp Gateway */}
          {activeTab === 'whatsapp' && currentRole === 'ketua' && (
            <WhatsAppHubView
              madrasahs={madrasahs}
              payments={payments}
              expenses={expenses}
              org={orgConfig}
              selectedYear={selectedYear}
              onUpdateConfig={setOrgConfig}
            />
          )}

          {/* ROLE 1: KETUA - Direktori Madrasah */}
          {activeTab === 'madrasah' && currentRole === 'ketua' && (
            <MadrasahDirectoryView
              madrasahs={madrasahs}
              payments={payments}
              org={orgConfig}
              selectedYear={selectedYear}
              onAddMadrasah={handleAddMadrasah}
              onUpdateMadrasah={handleUpdateMadrasah}
              onDeleteMadrasah={handleDeleteMadrasah}
              onOpenPaymentForMadrasah={(mId) => {
                setDefaultPaymentMadrasahId(mId);
                setDefaultPaymentFeeItemId(undefined);
                setIsPaymentModalOpen(true);
              }}
              onNavigateToAccessCodes={() => setActiveTab('access_codes')}
            />
          )}

          {/* ROLE 1: KETUA - Pengaturan & Distribusi Kode Akses */}
          {activeTab === 'access_codes' && currentRole === 'ketua' && (
            <AccessCodesView
              madrasahs={madrasahs}
              org={orgConfig}
              onUpdateMadrasah={handleUpdateMadrasah}
              onUpdateMultipleMadrasahs={handleUpdateMultipleMadrasahs}
              onUpdateOrgConfig={(cfg) => setOrgConfig(cfg)}
              onSwitchSession={handleLoginSuccess}
            />
          )}

          {/* ROLE 1: KETUA - Pengaturan Identitas & Logo KKMTS */}
          {activeTab === 'organization' && currentRole === 'ketua' && (
            <OrganizationProfileView
              org={orgConfig}
              onUpdateOrgConfig={(cfg) => setOrgConfig(cfg)}
            />
          )}

          {/* ROLE 1: KETUA - Backup, Restore & Hapus Data */}
          {activeTab === 'backup' && currentRole === 'ketua' && (
            <BackupRestoreView
              madrasahs={madrasahs}
              payments={payments}
              expenses={expenses}
              feeItems={feeItems}
              org={orgConfig}
              onRestoreSuccess={handleRestoreSuccess}
              onClearTransactions={handleClearTransactions}
              onClearAllData={handleClearAllData}
              onResetToDemo={handleResetData}
            />
          )}

          {/* ROLE 3 (ANGGOTA) & ROLE 1 (KETUA): Portal Madrasah (Kewajiban & Sudah Dibayar) */}
          {(activeTab === 'portal' || currentRole === 'anggota') && (
            <MemberPortalView
              madrasahs={madrasahs}
              payments={payments}
              feeItems={feeItems}
              org={orgConfig}
              session={session}
              selectedYear={selectedYear}
              onOpenNewPaymentForMonth={handleOpenPaymentForMonth}
              onSelectPaymentForReceipt={(p) => setReceiptPayment(p)}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
            />
          )}

        </main>

        {/* Bento Footer */}
        <footer className="bg-white border-t border-slate-200/80 py-5 text-xs text-slate-500 print:hidden mt-auto pb-24 lg:pb-5">
          <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <p className="font-bold text-slate-800">
                Sistem Iuran & Keuangan Terpadu {orgConfig.orgName}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Role Aktif: <strong className="uppercase text-emerald-800">{currentRole}</strong> • {session?.userName}
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-600">
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
              >
                Ganti Role / Kode Akses
              </button>
              <span>•</span>
              <span className="font-medium">© {new Date().getFullYear()} {orgConfig.regency}</span>
            </div>
          </div>
        </footer>

        {/* Mobile Bottom Navigation Bar */}
        <MobileBottomNav
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setIsMobileMenuOpen(false);
          }}
          currentRole={currentRole}
          session={session}
          pendingPaymentsCount={pendingPaymentsCount}
          onOpenNewPayment={handleOpenNewPayment}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onOpenLoginModal={() => {
            setIsLoginModalOpen(true);
            setIsMobileMenuOpen(false);
          }}
          isMobileMenuOpen={isMobileMenuOpen}
        />

      </div>

      {/* Global Role Login Portal Modal */}
      {isLoginModalOpen && (
        <LoginPortalModal
          isOpen={isLoginModalOpen}
          madrasahs={madrasahs}
          org={orgConfig}
          currentSession={session}
          onLoginSuccess={handleLoginSuccess}
          onClose={() => setIsLoginModalOpen(false)}
          allowClose={!!session}
        />
      )}

      {/* Global Transaction Modals */}
      {isPaymentModalOpen && (
        <QuickPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setDefaultPaymentFeeItemId(undefined);
          }}
          madrasahs={madrasahs}
          org={orgConfig}
          feeItems={feeItems}
          defaultFeeItemId={defaultPaymentFeeItemId}
          selectedYear={selectedYear}
          defaultMadrasahId={defaultPaymentMadrasahId}
          defaultMonth={defaultPaymentMonth}
          userRole={currentRole === 'anggota' ? 'public_madrasah' : 'admin'}
          onSubmitPayment={handleCreatePayment}
        />
      )}

      {verificationPayment && (
        <VerificationModal
          payment={verificationPayment}
          madrasah={madrasahs.find(m => m.id === verificationPayment.madrasahId)}
          org={orgConfig}
          onClose={() => setVerificationPayment(null)}
          onVerify={(id) => handleApprovePayment(id)}
          onApprove={(id) => handleApprovePayment(id)}
          onReject={(id, reason) => handleRejectPayment(id, reason)}
        />
      )}

      {receiptPayment && (
        <ReceiptModal
          payment={receiptPayment}
          madrasah={madrasahs.find(m => m.id === receiptPayment.madrasahId)}
          org={orgConfig}
          onClose={() => setReceiptPayment(null)}
        />
      )}

      {isSettingsOpen && currentRole === 'ketua' && (
        <SettingsModal
          config={orgConfig}
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSave={(newCfg) => setOrgConfig(newCfg)}
          onResetData={handleResetData}
          onNavigateToOrgProfile={() => setActiveTab('organization')}
          onNavigateToBackup={() => setActiveTab('backup')}
        />
      )}

    </div>
  );
};

export default App;
