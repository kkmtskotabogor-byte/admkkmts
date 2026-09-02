import { Madrasah, PaymentRecord, ExpenseRecord, OrganizationConfig, AuthSession, FeeItem } from '../types';
import { 
  INITIAL_MADRASAH_LIST, 
  INITIAL_PAYMENT_RECORDS, 
  INITIAL_EXPENSE_RECORDS, 
  INITIAL_ORGANIZATION_CONFIG,
  INITIAL_FEE_ITEMS 
} from '../data/initialData';

const STORAGE_KEYS = {
  AUTH_SESSION: 'kkmts_app_auth_session_v2',
  MADRASAH: 'kkmts_app_madrasah_v2',
  PAYMENTS: 'kkmts_app_payments_v2',
  EXPENSES: 'kkmts_app_expenses_v2',
  CONFIG: 'kkmts_app_config_v2',
  FEE_ITEMS: 'kkmts_app_fee_items_v2',
  ACTIVE_ROLE: 'kkmts_app_role_v2',
  SELECTED_MADRASAH_ID: 'kkmts_app_selected_madrasah_id_v2',
};

export const StorageService = {
  getFeeItems(): FeeItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FEE_ITEMS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load fee items from storage', e);
    }
    return INITIAL_FEE_ITEMS;
  },

  saveFeeItems(items: FeeItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.FEE_ITEMS, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save fee items', e);
    }
  },

  getMadrasahs(): Madrasah[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MADRASAH);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load madrasah from storage', e);
    }
    return INITIAL_MADRASAH_LIST;
  },

  saveMadrasahs(list: Madrasah[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MADRASAH, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save madrasahs', e);
    }
  },

  getPayments(): PaymentRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load payments from storage', e);
    }
    return INITIAL_PAYMENT_RECORDS;
  },

  savePayments(list: PaymentRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save payments', e);
    }
  },

  getExpenses(): ExpenseRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load expenses from storage', e);
    }
    return INITIAL_EXPENSE_RECORDS;
  },

  saveExpenses(list: ExpenseRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save expenses', e);
    }
  },

  getConfig(): OrganizationConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load config from storage', e);
    }
    return INITIAL_ORGANIZATION_CONFIG;
  },

  saveConfig(config: OrganizationConfig): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save config', e);
    }
  },

  getAuthSession(): AuthSession | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load auth session', e);
    }
    return null;
  },

  saveAuthSession(session: AuthSession | null): void {
    try {
      if (!session) {
        localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
      } else {
        localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
      }
    } catch (e) {
      console.error('Failed to save auth session', e);
    }
  },

  clearAuthSession(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    } catch (e) {
      console.error('Failed to clear auth session', e);
    }
  },

  getUserRole(): 'admin' | 'public_madrasah' {
    try {
      const role = localStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE);
      if (role === 'public_madrasah') return 'public_madrasah';
    } catch (e) {
      console.error('Failed to load role', e);
    }
    return 'admin';
  },

  saveUserRole(role: 'admin' | 'public_madrasah'): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, role);
    } catch (e) {
      console.error('Failed to save role', e);
    }
  },

  getSelectedMadrasahId(): string {
    try {
      const id = localStorage.getItem(STORAGE_KEYS.SELECTED_MADRASAH_ID);
      if (id) return id;
    } catch (e) {
      console.error('Failed to load selected madrasah id', e);
    }
    return 'mts-01';
  },

  saveSelectedMadrasahId(id: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SELECTED_MADRASAH_ID, id);
    } catch (e) {
      console.error('Failed to save selected madrasah id', e);
    }
  },

  resetToDefault(): void {
    localStorage.removeItem(STORAGE_KEYS.MADRASAH);
    localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.CONFIG);
    localStorage.removeItem(STORAGE_KEYS.FEE_ITEMS);
  },

  exportDatabaseJSON(): string {
    const backup = {
      version: '1.1',
      exportedAt: new Date().toISOString(),
      madrasahs: this.getMadrasahs(),
      payments: this.getPayments(),
      expenses: this.getExpenses(),
      config: this.getConfig(),
      feeItems: this.getFeeItems(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importDatabaseJSON(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.madrasahs && parsed.payments && parsed.expenses && parsed.config) {
        this.saveMadrasahs(parsed.madrasahs);
        this.savePayments(parsed.payments);
        this.saveExpenses(parsed.expenses);
        this.saveConfig(parsed.config);
        if (parsed.feeItems) {
          this.saveFeeItems(parsed.feeItems);
        }
        return true;
      }
    } catch (e) {
      console.error('Invalid backup JSON', e);
    }
    return false;
  }
};

