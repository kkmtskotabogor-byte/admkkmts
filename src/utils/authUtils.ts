import { Madrasah, AppRole, AuthSession } from '../types';

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
 * Generate standard access code for a madrasah member
 * e.g., MTS01-1211, MTS02-2027
 */
export function getMadrasahAccessCode(madrasah: Madrasah): string {
  const shortId = madrasah.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const nsmSuffix = madrasah.nsm ? madrasah.nsm.slice(-4) : '1234';
  return `${shortId}-${nsmSuffix}`;
}

/**
 * Verify access code against all 3 roles:
 * 1. Ketua (code matches ADMIN_CREDENTIALS.ketua.code or 'KETUA')
 * 2. Bendahara (code matches ADMIN_CREDENTIALS.bendahara.code or 'BENDAHARA')
 * 3. Anggota (code matches any madrasah's unique access code, NSM, NPSN, or normalized code)
 */
export function verifyAccessCode(
  inputCode: string,
  madrasahs: Madrasah[],
  orgChairmanName?: string,
  orgTreasurerName?: string
): { success: boolean; session?: AuthSession; message?: string } {
  const trimmed = inputCode.trim().toUpperCase();

  if (!trimmed) {
    return { success: false, message: 'Silakan masukkan kode akses.' };
  }

  // 1. Check Ketua Role
  if (trimmed === ADMIN_CREDENTIALS.ketua.code || trimmed === 'KETUA' || trimmed === 'KETUA2025') {
    return {
      success: true,
      session: {
        role: 'ketua',
        userName: orgChairmanName || ADMIN_CREDENTIALS.ketua.defaultName,
        userTitle: 'Ketua KKMTS (Full Akses Seluruh Menu)',
        accessCode: ADMIN_CREDENTIALS.ketua.code,
      },
    };
  }

  // 2. Check Bendahara Role
  if (trimmed === ADMIN_CREDENTIALS.bendahara.code || trimmed === 'BENDAHARA' || trimmed === 'BENDAHARA2025' || trimmed === 'KASIR') {
    return {
      success: true,
      session: {
        role: 'bendahara',
        userName: orgTreasurerName || ADMIN_CREDENTIALS.bendahara.defaultName,
        userTitle: 'Bendahara KKMTS (Penerimaan Iuran & Kas Keluar)',
        accessCode: ADMIN_CREDENTIALS.bendahara.code,
      },
    };
  }

  // 3. Check Anggota Madrasah
  for (const m of madrasahs) {
    const standardCode = getMadrasahAccessCode(m).toUpperCase();
    const rawId = m.id.toUpperCase();
    const nsm = (m.nsm || '').trim();
    const npsn = (m.npsn || '').trim();

    if (
      trimmed === standardCode ||
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
          accessCode: standardCode,
        },
      };
    }
  }

  return {
    success: false,
    message: 'Kode akses tidak valid. Pastikan kode Ketua, Bendahara, atau Kode Unik Madrasah Anda benar.',
  };
}
