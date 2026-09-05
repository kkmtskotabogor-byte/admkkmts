import { Madrasah, AppRole, AuthSession, OrganizationConfig } from '../types';

export interface RoleCredential {
  role: AppRole;
  title: string;
  name: string;
  code: string;
  description: string;
  scopeDescription: string;
  allowedTabs: string[];
}

export const ADMIN_CREDENTIALS: Record<'ketua' | 'bendahara', { code: string; title: string; defaultName: string }> = {
  ketua: {
    code: 'KETUA-KKMTS',
    title: 'Ketua KKMTS',
    defaultName: 'Drs. H. Ahmad Fauzi, M.Pd.I',
  },
  bendahara: {
    code: 'BENDAHARA-KKMTS',
    title: 'Bendahara KKMTS',
    defaultName: 'Hj. Siti Rohmah, S.Ag., M.M.',
  },
};

/**
 * Generate standard fallback access code for a madrasah member
 */
export function getDefaultMadrasahAccessCode(madrasah: Madrasah): string {
  const shortId = madrasah.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const nsmSuffix = madrasah.nsm ? madrasah.nsm.slice(-4) : '1234';
  return `${shortId}-${nsmSuffix}`;
}

/**
 * Get the active access code for a madrasah (uses custom if set, otherwise default)
 */
export function getMadrasahAccessCode(madrasah: Madrasah): string {
  if (madrasah.customAccessCode && madrasah.customAccessCode.trim()) {
    return madrasah.customAccessCode.trim().toUpperCase();
  }
  return getDefaultMadrasahAccessCode(madrasah);
}

/**
 * Get active Ketua access code
 */
export function getKetuaAccessCode(org?: OrganizationConfig | null): string {
  if (org?.ketuaAccessCode && org.ketuaAccessCode.trim()) {
    return org.ketuaAccessCode.trim().toUpperCase();
  }
  return ADMIN_CREDENTIALS.ketua.code;
}

/**
 * Get active Bendahara access code
 */
export function getBendaharaAccessCode(org?: OrganizationConfig | null): string {
  if (org?.bendaharaAccessCode && org.bendaharaAccessCode.trim()) {
    return org.bendaharaAccessCode.trim().toUpperCase();
  }
  return ADMIN_CREDENTIALS.bendahara.code;
}

/**
 * Generate a random alphanumeric code
 */
export function generateRandomAccessCode(prefix: string = 'MTS'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const numPart = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${numPart}`;
}

/**
 * Verify access code against all 3 roles:
 * 1. Ketua (code matches active ketua code or defaults)
 * 2. Bendahara (code matches active bendahara code or defaults)
 * 3. Anggota (code matches any madrasah's unique access code, NSM, NPSN, or normalized code)
 */
export function verifyAccessCode(
  inputCode: string,
  madrasahs: Madrasah[],
  orgOrChairmanName?: OrganizationConfig | string,
  orgTreasurerName?: string
): { success: boolean; session?: AuthSession; message?: string } {
  const trimmed = inputCode.trim().toUpperCase();

  if (!trimmed) {
    return { success: false, message: 'Silakan masukkan kode akses.' };
  }

  const orgConfig: OrganizationConfig | undefined = 
    typeof orgOrChairmanName === 'object' && orgOrChairmanName !== null 
      ? orgOrChairmanName 
      : undefined;

  const chairmanName = orgConfig?.chairmanName || (typeof orgOrChairmanName === 'string' ? orgOrChairmanName : ADMIN_CREDENTIALS.ketua.defaultName);
  const treasurerName = orgConfig?.treasurerName || (orgTreasurerName || ADMIN_CREDENTIALS.bendahara.defaultName);

  const activeKetuaCode = getKetuaAccessCode(orgConfig);
  const activeBendaharaCode = getBendaharaAccessCode(orgConfig);

  // 1. Check Ketua Role
  if (
    trimmed === activeKetuaCode ||
    trimmed === ADMIN_CREDENTIALS.ketua.code ||
    trimmed === 'KETUA' ||
    trimmed === 'KETUA2025' ||
    trimmed === 'KETUA-2026'
  ) {
    return {
      success: true,
      session: {
        role: 'ketua',
        userName: chairmanName,
        userTitle: 'Ketua KKMTS (Full Akses Seluruh Menu)',
        accessCode: activeKetuaCode,
      },
    };
  }

  // 2. Check Bendahara Role
  if (
    trimmed === activeBendaharaCode ||
    trimmed === ADMIN_CREDENTIALS.bendahara.code ||
    trimmed === 'BENDAHARA' ||
    trimmed === 'BENDAHARA2025' ||
    trimmed === 'BENDAHARA-2026' ||
    trimmed === 'KASIR'
  ) {
    return {
      success: true,
      session: {
        role: 'bendahara',
        userName: treasurerName,
        userTitle: 'Bendahara KKMTS (Penerimaan Iuran & Kas Keluar)',
        accessCode: activeBendaharaCode,
      },
    };
  }

  // 3. Check Anggota Madrasah
  for (const m of madrasahs) {
    const activeCode = getMadrasahAccessCode(m).toUpperCase();
    const defaultCode = getDefaultMadrasahAccessCode(m).toUpperCase();
    const rawId = m.id.toUpperCase();
    const nsm = (m.nsm || '').trim();
    const npsn = (m.npsn || '').trim();

    if (
      trimmed === activeCode ||
      trimmed === defaultCode ||
      trimmed === rawId ||
      (nsm && trimmed === nsm) ||
      (npsn && trimmed === npsn) ||
      trimmed === `MTS-${m.id.replace('mts-', '')}`.toUpperCase()
    ) {
      return {
        success: true,
        session: {
          role: 'anggota',
          userName: m.name,
          userTitle: `Madrasah Anggota (${m.status} - Kec. ${m.subdistrict})`,
          madrasahId: m.id,
          madrasahName: m.name,
          accessCode: activeCode,
        },
      };
    }
  }

  return {
    success: false,
    message: 'Kode akses tidak valid. Pastikan kode Ketua, Bendahara, atau Kode Unik Madrasah Anda benar.',
  };
}
