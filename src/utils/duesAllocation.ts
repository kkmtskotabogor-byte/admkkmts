import { Madrasah, PaymentRecord, OrganizationConfig } from '../types';
import { 
  ACADEMIC_MONTHS, 
  getMadrasahMonthlyDues, 
  isPaymentInAcademicYear 
} from './formatters';

export type MonthPaymentStatus = 'verified' | 'partial' | 'pending' | 'unpaid';

export interface MonthlyAllocationCell {
  order: number; // 1 to 12 in academic year
  monthNum: number; // 7, 8, ..., 12, 1, ..., 6
  calendarYear: number;
  shortName: string;
  fullName: string;
  monthlyDues: number;
  paidAmount: number; // Verified amount allocated to this month
  pendingAmount: number; // Pending amount allocated to this month
  remainingDeficit: number; // Math.max(0, monthlyDues - paidAmount)
  status: MonthPaymentStatus;
  paymentRecord?: PaymentRecord | null;
  contributingPayments: PaymentRecord[];
}

export interface MadrasahDuesSummary {
  madrasah: Madrasah;
  monthlyDues: number;
  annualDues: number; // 12 * monthlyDues
  cells: MonthlyAllocationCell[];
  verifiedMonthsCount: number; // Count of months with status === 'verified'
  partialMonthsCount: number; // Count of months with status === 'partial'
  pendingMonthsCount: number; // Count of months with status === 'pending'
  unpaidMonthsCount: number; // Count of months with status === 'unpaid'
  totalVerifiedPaid: number;
  totalPendingPaid: number;
  totalArrears: number; // Math.max(0, annualDues - totalVerifiedPaid)
  isFullyPaid: boolean;
  hasArrears: boolean;
  unpaidMonths: { month: number; year: number }[];
  unpaidOrPartialMonths: { 
    month: number; 
    year: number; 
    monthName: string; 
    deficit: number; 
    isPartial: boolean; 
  }[];
}

/**
 * Calculates sequential multi-month dues allocation for a madrasah in a specific academic year.
 * Rule:
 * - If amount covers 1 month -> Month 1 is checked (Lunas / green).
 * - If amount exceeds 2 months -> Month 1 & 2 are checked (Lunas / green),
 *   and Month 3 is marked YELLOW (Belum Lunas / partial with remaining deficit).
 * - And so forth across the 12 academic months (Juli to Juni).
 */
export function calculateMadrasahDuesAllocation(
  madrasah: Madrasah,
  payments: PaymentRecord[],
  org: OrganizationConfig,
  academicYear: number
): MadrasahDuesSummary {
  const monthlyDues = getMadrasahMonthlyDues(madrasah, org);
  const annualDues = monthlyDues * 12;

  // Filter payments belonging to this madrasah in the target academic year
  // for monthly dues obligations
  const relevantPayments = payments.filter((p) => {
    if (p.madrasahId !== madrasah.id) return false;
    if (!isPaymentInAcademicYear(p, academicYear)) return false;
    if (p.status === 'rejected') return false;
    
    // Check if category is wajib_bulanan or default routine fee
    const isMonthlyDues = 
      !p.duesCategory || 
      p.duesCategory === 'wajib_bulanan' || 
      p.feeItemId === 'fee-bulanan-2026' ||
      (p.categoryLabel && p.categoryLabel.toLowerCase().includes('bulanan'));
      
    return isMonthlyDues;
  });

  // Separate verified and pending payments
  const verifiedPayments = relevantPayments.filter((p) => p.status === 'verified');
  const pendingPayments = relevantPayments.filter((p) => p.status === 'pending');

  const totalVerifiedPaid = verifiedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPendingPaid = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Sequential FIFO allocation pools
  let poolVerified = totalVerifiedPaid;
  let poolPending = totalPendingPaid;

  const cells: MonthlyAllocationCell[] = ACADEMIC_MONTHS.map((am) => {
    const calendarYear = am.getYear(academicYear);

    // 1. Allocate from verified pool
    const allocVerified = Math.min(poolVerified, monthlyDues);
    poolVerified = Math.max(0, poolVerified - allocVerified);

    // 2. Remaining deficit after verified allocation
    const remainingAfterVerified = Math.max(0, monthlyDues - allocVerified);

    // 3. Allocate from pending pool if there's remaining deficit
    const allocPending = Math.min(poolPending, remainingAfterVerified);
    poolPending = Math.max(0, poolPending - allocPending);

    const remainingDeficit = Math.max(0, remainingAfterVerified - allocPending);

    // Determine status according to user specification
    let status: MonthPaymentStatus = 'unpaid';
    if (allocVerified >= monthlyDues) {
      status = 'verified'; // LUNAS PENUH (Ceklis Hijau)
    } else if (allocVerified > 0) {
      status = 'partial'; // BELUM LUNAS (Warna Kuning - disetor sebagian)
    } else if (allocPending > 0) {
      status = 'pending'; // MENUNGGU VERIFIKASI (Oranye)
    } else {
      status = 'unpaid'; // BELUM BAYAR (+)
    }

    // Find the most relevant payment record for receipt / detail opening
    // Prefer verified payment that matches or latest verified, then pending
    const directMatchVerified = verifiedPayments.find(
      (p) => p.periodMonth === am.monthIndex && p.periodYear === calendarYear
    );
    const directMatchPending = pendingPayments.find(
      (p) => p.periodMonth === am.monthIndex && p.periodYear === calendarYear
    );
    const primaryPaymentRecord = directMatchVerified || directMatchPending || verifiedPayments[0] || pendingPayments[0] || null;

    return {
      order: am.order,
      monthNum: am.monthIndex,
      calendarYear,
      shortName: am.shortName,
      fullName: am.name,
      monthlyDues,
      paidAmount: allocVerified,
      pendingAmount: allocPending,
      remainingDeficit,
      status,
      paymentRecord: primaryPaymentRecord,
      contributingPayments: verifiedPayments.length > 0 ? verifiedPayments : pendingPayments,
    };
  });

  const verifiedMonthsCount = cells.filter((c) => c.status === 'verified').length;
  const partialMonthsCount = cells.filter((c) => c.status === 'partial').length;
  const pendingMonthsCount = cells.filter((c) => c.status === 'pending').length;
  const unpaidMonthsCount = cells.filter((c) => c.status === 'unpaid').length;

  const totalArrears = Math.max(0, annualDues - totalVerifiedPaid);
  const isFullyPaid = verifiedMonthsCount === 12;
  const hasArrears = totalArrears > 0;

  const unpaidMonths = cells
    .filter((c) => c.status === 'unpaid')
    .map((c) => ({ month: c.monthNum, year: c.calendarYear }));

  const unpaidOrPartialMonths = cells
    .filter((c) => c.status === 'unpaid' || c.status === 'partial')
    .map((c) => ({
      month: c.monthNum,
      year: c.calendarYear,
      monthName: `${c.fullName} ${c.calendarYear}`,
      deficit: c.remainingDeficit,
      isPartial: c.status === 'partial',
    }));

  return {
    madrasah,
    monthlyDues,
    annualDues,
    cells,
    verifiedMonthsCount,
    partialMonthsCount,
    pendingMonthsCount,
    unpaidMonthsCount,
    totalVerifiedPaid,
    totalPendingPaid,
    totalArrears,
    isFullyPaid,
    hasArrears,
    unpaidMonths,
    unpaidOrPartialMonths,
  };
}

/**
 * Calculates a preview of how a given payment amount will allocate across months for a madrasah.
 * Used inside QuickPaymentModal to show live feedback to the user.
 */
export function simulatePaymentAllocation(
  monthlyDues: number,
  newAmount: number,
  existingVerifiedPaid: number = 0,
  academicStartMonthOrder: number = 1 // 1 for Juli
) {
  if (monthlyDues <= 0 || newAmount <= 0) {
    return {
      fullMonthsCount: 0,
      partialAmount: 0,
      partialDeficit: 0,
      hasPartial: false,
      summaryText: '',
      monthsDetail: [] as { name: string; amount: number; status: 'lunas' | 'partial' }[],
    };
  }

  // Calculate prior months already fully or partially covered
  const priorFullMonths = Math.floor(existingVerifiedPaid / monthlyDues);
  const priorRemainder = existingVerifiedPaid % monthlyDues;

  const effectiveStartOrder = priorFullMonths + 1;
  const fullMonthsFromNew = Math.floor((newAmount + priorRemainder) / monthlyDues);
  const remainderFromNew = (newAmount + priorRemainder) % monthlyDues;

  const hasPartial = remainderFromNew > 0;
  const partialDeficit = hasPartial ? monthlyDues - remainderFromNew : 0;

  const monthsDetail: { name: string; amount: number; status: 'lunas' | 'partial' }[] = [];

  for (let i = 0; i < fullMonthsFromNew; i++) {
    const idx = (effectiveStartOrder - 1 + i) % 12;
    const am = ACADEMIC_MONTHS[idx];
    monthsDetail.push({
      name: am.name,
      amount: monthlyDues,
      status: 'lunas',
    });
  }

  if (hasPartial) {
    const idx = (effectiveStartOrder - 1 + fullMonthsFromNew) % 12;
    const am = ACADEMIC_MONTHS[idx];
    monthsDetail.push({
      name: am.name,
      amount: remainderFromNew,
      status: 'partial',
    });
  }

  let summaryText = '';
  if (fullMonthsFromNew > 0 && hasPartial) {
    summaryText = `${fullMonthsFromNew} Bulan Lunas (Ceklis Hijau) + 1 Bulan Belum Lunas (Kuning - Terbayar sebagian)`;
  } else if (fullMonthsFromNew > 0) {
    summaryText = `${fullMonthsFromNew} Bulan Lunas Penuh (Ceklis Hijau)`;
  } else if (hasPartial) {
    summaryText = `Bulan Pertama Belum Lunas Penuh (Kuning - Terbayar sebagian)`;
  }

  return {
    fullMonthsCount: fullMonthsFromNew,
    partialAmount: remainderFromNew,
    partialDeficit,
    hasPartial,
    summaryText,
    monthsDetail,
  };
}
