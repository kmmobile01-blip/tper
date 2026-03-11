
import { 
    EmployeeInputRow, TableRowT1, TableRowT2, CoefSettings, 
    CalculationResult, CutoffYears, FractionConfig, YearlyDetail, RetirementAgeSettings, TransitionConfig, AdjustmentConfig, UnifyNewSystemConfig
} from './types';
import { COL_ALIASES } from './constants';

export const roundTo2 = (num: number): number => Math.round((num + Number.EPSILON) * 100) / 100;
// 追加: より細かい精度での丸め（年数計算用）
export const roundTo4 = (num: number): number => Math.round((num + Number.EPSILON) * 10000) / 10000;

export const deepClone = <T>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    // Handle Date
    if (obj instanceof Date) {
        return new Date(obj.getTime()) as any;
    }

    // Handle Array
    if (Array.isArray(obj)) {
        return obj.map(item => deepClone(item)) as any;
    }

    // Handle Object
    const clonedObj = {} as T;
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            clonedObj[key] = deepClone(obj[key]);
        }
    }
    return clonedObj;
};

export const parseDate = (val: string | number | undefined | Date): Date | null => {
    if (!val) return null;
    if (val instanceof Date) return val;
    if (typeof val === 'number') {
        return new Date(Math.round((val - 25569) * 86400 * 1000));
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
};

export const getWarekiYear = (date: Date): string => {
    const year = date.getFullYear();
    if (year >= 2019) return `R${year - 2018}`;
    if (year >= 1989) return `H${year - 1988}`;
    if (year >= 1926) return `S${year - 1925}`;
    return `${year}`; 
};

export const formatDateWithWareki = (val: string | number | undefined | Date): string => {
    const d = parseDate(val);
    if (!d) return '';
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return `${y}/${m}/${day} (${getWarekiYear(d)})`;
};

export const calculatePeriodYears = (baseDate: Date, endDate: Date, mode: string = 'ceil'): number => {
    if (!baseDate || !endDate) return 0;
    if (endDate < baseDate) return 0;

    // 日割り計算: 満年数 + (端数日数 / 365)
    if (mode === 'daily') {
        let fullYears = endDate.getFullYear() - baseDate.getFullYear();
        const startMonth = baseDate.getMonth();
        const endMonth = endDate.getMonth();
        const startDay = baseDate.getDate();
        const endDay = endDate.getDate();

        // 満年数計算（誕生日前なら-1）
        if (endMonth < startMonth || (endMonth === startMonth && endDay < startDay)) {
            fullYears--;
        }

        // 最後の満年経過日（Anniversary）を取得
        const lastAnniversary = new Date(baseDate);
        lastAnniversary.setFullYear(baseDate.getFullYear() + fullYears);

        // 端数日数の計算
        const diffTime = endDate.getTime() - lastAnniversary.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
        
        return roundTo4(fullYears + (diffDays / 365));
    }
    
    // 暦月計算モード (旧制度用: 日付を無視して月数差分のみで計算)
    if (mode === 'calendar_months') {
        let months = (endDate.getFullYear() - baseDate.getFullYear()) * 12 + (endDate.getMonth() - baseDate.getMonth());
        return roundTo4(Math.max(0, months / 12));
    }

    let months = (endDate.getFullYear() - baseDate.getFullYear()) * 12 + (endDate.getMonth() - baseDate.getMonth());
    const isBaseEndOfMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).getDate() === baseDate.getDate();
    
    let targetDayOfEndMonth: number;
    if (isBaseEndOfMonth) {
        targetDayOfEndMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate();
    } else {
        const endMonthLastDay = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate();
        targetDayOfEndMonth = Math.min(baseDate.getDate(), endMonthLastDay);
    }

    if (endDate.getDate() < targetDayOfEndMonth) {
        months--;
    }

    if (mode === 'ceil') {
        const completionBaseDate = new Date(baseDate);
        completionBaseDate.setMonth(completionBaseDate.getMonth() + months);
        // Logic to check if we crossed into the next month unit
        let targetYear = baseDate.getFullYear() + Math.floor((baseDate.getMonth() + months) / 12);
        let targetMonth = (baseDate.getMonth() + months) % 12;
        let targetDate = baseDate.getDate();
        const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
        if (targetDate > daysInTargetMonth) targetDate = daysInTargetMonth;
        
        const exactMonthDate = new Date(targetYear, targetMonth, targetDate);
        const dEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        
        if (dEnd > exactMonthDate) {
            months += 1;
        }
    } else if (mode === 'round') {
        const dEnd = endDate.getDate();
        let dayDiff = dEnd - baseDate.getDate();
        if (dayDiff < 0) dayDiff += 30; 
        if (dayDiff >= 15) months += 1; 
    } 
    return roundTo4(Math.max(0, months / 12));
};

export const getYearsAndMonths = (baseDate: Date, endDate: Date, ignoreDays: boolean = false) => {
    if (!baseDate || !endDate || endDate < baseDate) return { years: 0, months: 0 };
    
    // Using standard floor logic for years/months duration
    let months = (endDate.getFullYear() - baseDate.getFullYear()) * 12 + (endDate.getMonth() - baseDate.getMonth());
    
    if (!ignoreDays) {
        // Check days to see if full month is completed
        const dayBase = baseDate.getDate();
        const dayEnd = endDate.getDate();
        
        const endMonthLastDay = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate();
        
        if (dayEnd < dayBase) {
            const baseMonthLastDay = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).getDate();
            const isBaseLastDay = dayBase === baseMonthLastDay;
            const isEndLastDay = dayEnd === endMonthLastDay;
            
            if (!(isBaseLastDay && isEndLastDay)) {
                 months--;
            }
        }
    }

    return {
        years: Math.floor(months / 12),
        months: months % 12
    };
};

export const processRow = (
    row: EmployeeInputRow, 
    masterData1_1: TableRowT1[], // Type 1
    masterData1_2: TableRowT1[], // Type 2 
    masterData1_3: TableRowT1[], // Type 3 
    masterData2: TableRowT2[],   // Default New System (Current)
    masterDataFuture: { type1: TableRowT2[], type2: TableRowT2[], type3: TableRowT2[], type4: TableRowT2[] }, // Future System by Type
    retirementAges: RetirementAgeSettings, 
    cutoffYears: CutoffYears, 
    coefSettings: CoefSettings, // Current coefs
    coefSettingsFuture: CoefSettings, // Future coefs
    defaultYearlyEval: number, 
    fractionConfig: FractionConfig, 
    includeCurrentFiscalYear: boolean,
    unitPrice: number,
    transitionConfig: TransitionConfig, // { enabled: boolean, date: Date }
    retirementAgesFuture?: RetirementAgeSettings,
    cutoffYearsFuture?: CutoffYears,
    defaultYearlyEvalFuture?: number,
    adjustmentConfig?: AdjustmentConfig,
    unifyNewSystemConfig?: UnifyNewSystemConfig,
    targetRetirementAllowance?: number, // Passed only when Adjustment Mode is active
    targetReserve2026?: number // Passed when comparing against Pattern B (enforce 2025 consistency)
): CalculationResult | null => {
    try {
        const getValue = (aliases: string[]) => aliases.reduce((found, alias) => found !== undefined ? found : row[alias], undefined as string | number | undefined);

        const id = (row['社員番号'] || row['employeeId'] || row['id']) as string;
        const name = (row['氏名'] || row['name'] || 'Unknown') as string;
        const joinDateStr = (row['入社日'] || row['joinDate']) as string | number;
        const calcStartDateStr = getValue(COL_ALIASES.calcStartDate);
        const birthDateStr = (row['生年月日'] || row['birthDate']) as string | number;
        const grade = (row['等級'] || row['grade'] || '一般') as string;
        const qual = (row['資格'] || '') as string; 
        const rankInfo = qual || grade; 
        
        const joinDate = parseDate(joinDateStr);
        const calcStartDate = parseDate(calcStartDateStr);
        const birthDate = parseDate(birthDateStr);
        if (!joinDate || !birthDate) return null;

        const d1999_03_31 = new Date(1999, 2, 31);
        const d2000_03_31 = new Date(2000, 2, 31);
        const d2011_09_30 = new Date(2011, 8, 30);
        const d2014_04_03 = new Date(2014, 3, 3);
        const d2026_03_31 = new Date(2026, 2, 31); // 凍結基準日
        
        const dJoinPlus6Years = new Date(joinDate);
        dJoinPlus6Years.setFullYear(dJoinPlus6Years.getFullYear() + 6);

        // --- 定年日の決定ロジック ---
        // 1. まず「現行制度」の定年年齢で仮定の退職日を算出
        let currentRetirementAge = 60; 
        let typeKey: 'type1' | 'type2' | 'type3' | 'type4' = 'type4';

        // 入社日によるタイプ判定
        if (joinDate <= d1999_03_31) {
            typeKey = 'type1';
        } else if (joinDate <= d2000_03_31) {
            typeKey = 'type2';
        } else if (joinDate <= d2011_09_30) {
            typeKey = 'type3';
        } else {
            typeKey = 'type4';
        }

        // 定年年齢の決定
        if (adjustmentConfig?.enabled) {
            // 調整ポイントモード有効時は設定された定年年齢を使用
            if (adjustmentConfig.targetTypes?.[typeKey] !== false) {
                const adjAges = adjustmentConfig.retirementAges || { type1: 65, type2: 65, type3: 65, type4: 65 };
                currentRetirementAge = adjAges[typeKey];
            } else {
                // 対象外の場合 -> 通常設定
                if (typeKey === 'type1') currentRetirementAge = retirementAges.type1;
                else if (typeKey === 'type2') currentRetirementAge = retirementAges.type2;
                else if (typeKey === 'type3') currentRetirementAge = retirementAges.type3;
                else currentRetirementAge = retirementAges.type4;
            }
        } else if (unifyNewSystemConfig?.enabled) {
            // 新制度統一モード有効時は設定された定年年齢を使用
            if (unifyNewSystemConfig.targetTypes?.[typeKey] !== false) {
                // 対象となっている場合
                const unifyAges = unifyNewSystemConfig.retirementAges || { type1: 65, type2: 65, type3: 65, type4: 65 };
                currentRetirementAge = unifyAges[typeKey];
            } else {
                // 対象外の場合 -> 通常設定
                if (typeKey === 'type1') currentRetirementAge = retirementAges.type1;
                else if (typeKey === 'type2') currentRetirementAge = retirementAges.type2;
                else if (typeKey === 'type3') currentRetirementAge = retirementAges.type3;
                else currentRetirementAge = retirementAges.type4;
            }
        } else {
            // 通常モード
            if (typeKey === 'type1') currentRetirementAge = retirementAges.type1;
            else if (typeKey === 'type2') currentRetirementAge = retirementAges.type2;
            else if (typeKey === 'type3') currentRetirementAge = retirementAges.type3;
            else currentRetirementAge = retirementAges.type4;
        }

        let retirementDate = new Date(birthDate);
        retirementDate.setFullYear(retirementDate.getFullYear() + currentRetirementAge);

        // 2. 制度移行日が設定されており、かつ仮定退職日が移行日より後の場合 (通常Transitionのみ)
        if (!adjustmentConfig?.enabled && !unifyNewSystemConfig?.enabled && transitionConfig.enabled && transitionConfig.date && retirementAgesFuture && retirementDate > transitionConfig.date) {
            let futureRetirementAge = 60;
            if (typeKey === 'type1') futureRetirementAge = retirementAgesFuture.type1;
            else if (typeKey === 'type2') futureRetirementAge = retirementAgesFuture.type2;
            else if (typeKey === 'type3') futureRetirementAge = retirementAgesFuture.type3;
            else futureRetirementAge = retirementAgesFuture.type4;
            
            if (futureRetirementAge !== currentRetirementAge) {
                retirementDate = new Date(birthDate);
                retirementDate.setFullYear(retirementDate.getFullYear() + futureRetirementAge);
            }
        }
        
        const isStrictOldSystem = joinDate <= d2011_09_30;

        let retireDateLos = new Date(retirementDate);
        const losMode = isStrictOldSystem ? 'default' : fractionConfig.losDateMode;
        if (losMode === 'prev_day') retireDateLos.setDate(retireDateLos.getDate() - 1);
        else if (losMode === 'end_of_month') retireDateLos = new Date(retireDateLos.getFullYear(), retireDateLos.getMonth() + 1, 0);

        let retireDateRank = new Date(retirementDate);
        const rankMode = fractionConfig.rankDateMode; 
        if (rankMode === 'prev_day') retireDateRank.setDate(retireDateRank.getDate() - 1);
        else if (rankMode === 'end_of_month') retireDateRank = new Date(retireDateRank.getFullYear(), retireDateRank.getMonth() + 1, 0);
        
        // --- 制度移行処理の判定 ---
        const useTransition = transitionConfig.enabled && 
                              transitionConfig.date && 
                              retireDateLos > transitionConfig.date && 
                              joinDate < transitionConfig.date;
        
        const transitionDate = useTransition ? transitionConfig.date : null;

        // --- 調整ポイントモードの判定 ---
        const useAdjustment = adjustmentConfig?.enabled && 
                              (adjustmentConfig.targetTypes?.[typeKey] !== false) &&
                              targetRetirementAllowance !== undefined && 
                              retireDateLos > d2026_03_31;

        // --- 新制度統一モードの判定 ---
        const useUnify = unifyNewSystemConfig?.enabled &&
                         (unifyNewSystemConfig.targetTypes?.[typeKey] !== false) && 
                         retireDateLos > d2026_03_31;

        let coefTable: { years: number, coef: number }[] = [];
        let isCoefApplicable = true;
        let typeName = '';
        let useOldSystemTable = false; 
        let pointCalcBaseDate = joinDate;
        
        let targetOldMaster: TableRowT1[] = masterData1_1;
        const targetCoefSettings = useTransition ? coefSettingsFuture : coefSettings;

        if (typeKey === 'type1') {
            targetOldMaster = masterData1_1;
            coefTable = targetCoefSettings.type1; typeName = '旧制度①'; useOldSystemTable = true;
        } else if (typeKey === 'type2') {
            targetOldMaster = masterData1_2;
            coefTable = targetCoefSettings.type2; typeName = '旧制度②'; useOldSystemTable = true;
        } else if (typeKey === 'type3') {
            targetOldMaster = masterData1_3;
            coefTable = targetCoefSettings.type3; typeName = '旧制度③'; useOldSystemTable = true;
        } else {
            typeName = '新制度'; useOldSystemTable = false; isCoefApplicable = true;
            coefTable = targetCoefSettings.type4; 
            
            if (calcStartDate) {
                pointCalcBaseDate = calcStartDate;
            } else {
                const d = new Date(joinDate);
                d.setFullYear(d.getFullYear() + 3);
                d.setDate(1); 
                pointCalcBaseDate = d;
            }
        }
        
        if (useOldSystemTable && calcStartDate) {
            pointCalcBaseDate = calcStartDate;
        }

        const getMode = (key: 'los' | 'rank' | 'eval') => {
            if (key === 'los' && isStrictOldSystem) return 'ceil';
            return fractionConfig[key] || 'floor';
        };

        const referenceDate = new Date(2025, 8, 30); 

        // 勤続年数 (表示用・係数用): 実際入社日基準
        const yearsOfService = Math.floor(calculatePeriodYears(joinDate, retireDateLos, getMode('los')));
        const serviceDuration = getYearsAndMonths(joinDate, retireDateLos, isStrictOldSystem); 

        const inputLos = getValue(COL_ALIASES.currentLosPt);
        const inputRank = getValue(COL_ALIASES.currentRankPt);
        const inputEval = getValue(COL_ALIASES.currentEvalPt);

        let rankKeyOld: keyof TableRowT1 = 'r1_1';
        let rankKeyNew: keyof TableRowT2 = 'r1';
        
        if (rankInfo.includes('部長') || rankInfo.includes('6等級') || rankInfo.includes('６等級')) { rankKeyOld = 'r6'; rankKeyNew = 'r6'; } 
        else if (rankInfo.includes('次長') || rankInfo.includes('5等級') || rankInfo.includes('５等級')) { rankKeyOld = 'r5'; rankKeyNew = 'r5'; } 
        else if (rankInfo.includes('課長') || rankInfo.includes('4等級') || rankInfo.includes('４等級')) { rankKeyOld = 'r4'; rankKeyNew = 'r4'; } 
        else if (rankInfo.includes('係長') || rankInfo.includes('3等級') || rankInfo.includes('３等級')) { rankKeyOld = 'r3'; rankKeyNew = 'r3'; } 
        else if (rankInfo.includes('主任') || rankInfo.includes('2等級') || rankInfo.includes('２等級')) { rankKeyOld = 'r2'; rankKeyNew = 'r2'; } 
        else if (rankInfo.includes('係員') || rankInfo.includes('1等級') || rankInfo.includes('１等級')) { rankKeyOld = 'r1_1'; rankKeyNew = 'r1'; }

        // --- 初期ポイント計算 ---
        let initialLosPointsInput = 0, initialRankPointsInput = 0, initialEvalPointsInput = 0;
        if (inputLos !== undefined) {
            initialLosPointsInput = Number(inputLos);
            initialRankPointsInput = Number(inputRank || 0);
            initialEvalPointsInput = Number(inputEval || 0);
        } else {
            const getPointFromTable = (table: any[], year: number, key: string) => {
                const targetYear = year;
                if (targetYear <= 0) return 0;
                const row = table.find(r => r.y === targetYear) || table[table.length - 1];
                return row ? (row[key] || 0) : 0;
            };
            const currentYearsForInitialPoint = Math.floor(calculatePeriodYears(pointCalcBaseDate, referenceDate, 'floor'));
            const tableToUse = useOldSystemTable ? targetOldMaster : masterData2;
            const losKey = useOldSystemTable ? 'los1' : 'los';
            const rankKey = useOldSystemTable ? rankKeyOld : rankKeyNew;
            
            initialLosPointsInput = getPointFromTable(tableToUse, currentYearsForInitialPoint, losKey);
            initialRankPointsInput = getPointFromTable(tableToUse, currentYearsForInitialPoint, rankKey);
            initialEvalPointsInput = 0; 
        }

        // --- 共通ヘルパー: ポイント計算関数 ---
        const calculatePts = (yearsFloat: number, key: string, isOld: boolean, mode: string, tableOverride?: any[]) => {
            const yearInt = Math.floor(yearsFloat);
            const monthFraction = yearsFloat - yearInt; 
            const table = tableOverride || (isOld ? targetOldMaster : masterData2);
            const mappedKey = isOld ? (key === 'los' ? 'los1' : rankKeyOld) : key;
            
            const getVal = (y: number): number => {
                if (y <= 0) return 0;
                const r: any = table.find((d: any) => d.y === y) || table[table.length - 1];
                return r[mappedKey] || 0;
            };

            const fullYearPoints = getVal(yearInt);
            let fractionPoints = 0;
            if (monthFraction > 0) {
                if (yearInt >= 47) { 
                    fractionPoints = 0;
                } else {
                    const nextYearTotal = getVal(yearInt + 1);
                    const currentYearTotal = getVal(yearInt);
                    const yearlyUnit = nextYearTotal - currentYearTotal;
                    if (mode === 'daily') {
                        fractionPoints = roundTo2(yearlyUnit * monthFraction);
                    } else {
                        const months = Math.round(monthFraction * 12);
                        if (months > 0) fractionPoints = roundTo2( (yearlyUnit / 12) * months );
                    }
                }
            }
            return fullYearPoints + roundTo2(fractionPoints);
        };

        // --- 上限キャップの決定 ---
        let rankCapYearCurrent = 999;
        if (useOldSystemTable) {
             if (typeName === '旧制度①') rankCapYearCurrent = cutoffYears.type1;
             else if (typeName === '旧制度②') rankCapYearCurrent = cutoffYears.type2;
             else if (typeName === '旧制度③') rankCapYearCurrent = cutoffYears.type3;
             else rankCapYearCurrent = 35; 
        }

        const targetFutureMaster = masterDataFuture[typeKey];

        // --- ポイント計算 (退職時 & 現在) ---
        const currentYearsFloat = calculatePeriodYears(pointCalcBaseDate, referenceDate, getMode('los'));
        const totalLosAtCurrent = calculatePts(currentYearsFloat, 'los', useOldSystemTable, getMode('los'));

        const cappedCurrentYearsRank = useOldSystemTable ? Math.min(currentYearsFloat, rankCapYearCurrent) : currentYearsFloat;
        const totalRankAtCurrent = calculatePts(cappedCurrentYearsRank, rankKeyNew, useOldSystemTable, getMode('rank'));

        let totalLosAtRetire = 0;
        let totalRankAtRetire = 0;

        if (useAdjustment || useUnify) {
            const yearsAtFreezeLos = calculatePeriodYears(pointCalcBaseDate, d2026_03_31, getMode('los'));
            const yearsAtFreezeRank = calculatePeriodYears(pointCalcBaseDate, d2026_03_31, getMode('rank'));
            
            const cappedFreezeYearsRank = useOldSystemTable ? Math.min(yearsAtFreezeRank, rankCapYearCurrent) : yearsAtFreezeRank;
            
            totalLosAtRetire = calculatePts(yearsAtFreezeLos, 'los', useOldSystemTable, getMode('los'));
            totalRankAtRetire = calculatePts(cappedFreezeYearsRank, rankKeyNew, useOldSystemTable, getMode('rank'));
            
        } else if (useTransition && transitionDate) {
            const yearsAtTransitionLos = calculatePeriodYears(pointCalcBaseDate, transitionDate, getMode('los'));
            const yearsAtTransitionRank = calculatePeriodYears(pointCalcBaseDate, transitionDate, getMode('rank'));
            
            const losAtTransition = calculatePts(yearsAtTransitionLos, 'los', useOldSystemTable, getMode('los'));
            
            let cappedRankYearsAtTransition = yearsAtTransitionRank;
            if (useOldSystemTable) {
                cappedRankYearsAtTransition = Math.min(yearsAtTransitionRank, rankCapYearCurrent);
            }
            const rankAtTransition = calculatePts(cappedRankYearsAtTransition, rankKeyNew, useOldSystemTable, getMode('rank'));

            const yearsAtRetireLos = calculatePeriodYears(pointCalcBaseDate, retireDateLos, getMode('los'));
            const yearsAtRetireRank = calculatePeriodYears(pointCalcBaseDate, retireDateRank, getMode('rank'));

            const losNewAtRetire = calculatePts(yearsAtRetireLos, 'los', false, getMode('los'), targetFutureMaster);
            const losNewAtTransition = calculatePts(yearsAtTransitionLos, 'los', false, getMode('los'), targetFutureMaster);
            const incLosFuture = Math.max(0, losNewAtRetire - losNewAtTransition);

            const rankNewAtRetire = calculatePts(yearsAtRetireRank, rankKeyNew, false, getMode('rank'), targetFutureMaster);
            const rankNewAtTransition = calculatePts(yearsAtTransitionRank, rankKeyNew, false, getMode('rank'), targetFutureMaster);
            const incRankFuture = Math.max(0, rankNewAtRetire - rankNewAtTransition);

            totalLosAtRetire = losAtTransition + incLosFuture;
            totalRankAtRetire = rankAtTransition + incRankFuture;

        } else {
            const retirementYearsFloatLos = calculatePeriodYears(pointCalcBaseDate, retireDateLos, getMode('los'));
            const retirementYearsFloatRank = calculatePeriodYears(pointCalcBaseDate, retireDateRank, getMode('rank'));
            
            const cappedRetirementYearsRank = useOldSystemTable ? Math.min(retirementYearsFloatRank, rankCapYearCurrent) : retirementYearsFloatRank;
            
            totalLosAtRetire = calculatePts(retirementYearsFloatLos, 'los', useOldSystemTable, getMode('los'));
            totalRankAtRetire = calculatePts(cappedRetirementYearsRank, rankKeyNew, useOldSystemTable, getMode('rank'));
        }

        let futureLosPoints = Math.max(0, totalLosAtRetire - totalLosAtCurrent);
        let futureRankPoints = Math.max(0, totalRankAtRetire - totalRankAtCurrent);

        let futureEvalPoints = 0;
        const rowInputEval = (row['想定考課Pt'] !== undefined && row['想定考課Pt'] !== '') ? Number(row['想定考課Pt']) : null;
        
        let retireDateEval = new Date(retirementDate);
        if (fractionConfig.evalDateMode === 'prev_day') retireDateEval.setDate(retireDateEval.getDate() - 1);
        else if (fractionConfig.evalDateMode === 'end_of_month') retireDateEval = new Date(retireDateEval.getFullYear(), retireDateEval.getMonth() + 1, 0);

        if (joinDate <= d2011_09_30) {
            if (['r1', 'r2', 'r3'].includes(rankKeyNew)) {
                let countTotal = 0;
                let countCurrent = 0;
                let countFuture = 0;

                const startYear = 2026;
                const endYear = retireDateEval.getFullYear();
                
                if (endYear >= startYear) {
                    for(let y = startYear; y <= endYear; y++) {
                        const checkDate = new Date(y, 6, 1);
                        if (checkDate > retireDateEval) break;
                        
                        if ((useAdjustment || useUnify) && checkDate > d2026_03_31) continue; 

                        const oneYearAfterJoin = new Date(joinDate);
                        oneYearAfterJoin.setFullYear(oneYearAfterJoin.getFullYear() + 1);
                        if (checkDate >= oneYearAfterJoin) {
                            countTotal++;
                            if (useTransition && transitionDate && checkDate > transitionDate) {
                                countFuture++;
                            } else {
                                countCurrent++;
                            }
                        }
                    }
                }

                if (rowInputEval !== null) {
                    futureEvalPoints = countTotal * rowInputEval;
                } else {
                    const valCurrent = defaultYearlyEval;
                    const valFuture = (defaultYearlyEvalFuture !== undefined) ? defaultYearlyEvalFuture : defaultYearlyEval;
                    futureEvalPoints = (countCurrent * valCurrent) + (countFuture * valFuture);
                }
            }
        }
        futureEvalPoints = roundTo2(futureEvalPoints);
        
        const getCoefficient = (years: number, joinDateInput: Date) => {
            if (!isCoefApplicable || coefTable.length === 0) return 1.0;
            const targetYear = Math.max(1, Math.floor(years));
            const coefRow = coefTable.find(c => c.years === targetYear) || coefTable[coefTable.length - 1];
            return coefRow ? coefRow.coef : 1.0;
        };

        const yearsForCoef = Math.floor(calculatePeriodYears(joinDate, retireDateLos, getMode('los')));
        let coefficient = getCoefficient(yearsForCoef, joinDate); 
        
        if (joinDate >= d2014_04_03 && retireDateLos < dJoinPlus6Years) {
            coefficient = 0;
        }
        
        let reserveAmount2026Fixed = 0;
        let adjustmentGap = 0;
        let calculatedAnnualAdj = 0;

        let totalPoints = roundTo2(
            (initialLosPointsInput + futureLosPoints) + 
            (initialRankPointsInput + futureRankPoints) + 
            (initialEvalPointsInput + futureEvalPoints)
        );

        let retirementAllowance = Math.ceil((totalPoints * unitPrice * coefficient) / 10) * 10;
        
        // --- 年度別推移 (引当計算) ---
        const yearlyDetails: YearlyDetail[] = [];
        const baseYear = 2025;
        let runningLos = initialLosPointsInput;
        let runningRank = initialRankPointsInput;
        let runningEval = initialEvalPointsInput;
        let runningAdj = 0;
        
        const currentYearsFloatForCoef = calculatePeriodYears(joinDate, referenceDate, getMode('los'));
        
        const getEffectiveCoef = (yearsF: number, dateObj: Date) => {
            if (!isCoefApplicable) return 1.0;
            let table = coefSettings[typeKey]; 
            if (useTransition && transitionDate && dateObj > transitionDate) {
                 table = coefSettingsFuture[typeKey]; 
            }
            if (!table || table.length === 0) return 1.0;
            const targetYear = Math.max(1, Math.floor(yearsF));
            const coefRow = table.find(c => c.years === targetYear) || table[table.length - 1];
            return coefRow ? coefRow.coef : 1.0;
        };

        let initialCoef = getEffectiveCoef(currentYearsFloatForCoef, referenceDate);
        if (joinDate >= d2014_04_03 && referenceDate < dJoinPlus6Years) initialCoef = 0;
        
        let prevReserveAmount = Math.ceil((runningLos + runningRank + runningEval + runningAdj) * unitPrice * initialCoef / 10) * 10;
        
        let trackingTheoryLos = totalLosAtCurrent;
        let trackingTheoryRank = totalRankAtCurrent;
        
        const endYear = retireDateLos.getMonth() < 3 ? retireDateLos.getFullYear() - 1 : retireDateLos.getFullYear();
        const maxLoopYear = Math.max(2080, endYear + 2);

        let reserve2026 = 0;
        let cumulativeAdjustmentAmount = 0; 
        
        let unifyTrackingLos = 0;
        let unifyTrackingRank = 0;
        let unifyRunningNewAmount = 0;

        const calcPtAt = (yearsF: number, dateObj: Date, key: 'los'|'rank', rankK: string, mode: string) => {
            if ((useAdjustment || useUnify) && dateObj > d2026_03_31) {
                const freezeYears = calculatePeriodYears(pointCalcBaseDate, d2026_03_31, mode);
                const cap = (key === 'rank' && useOldSystemTable) ? rankCapYearCurrent : 999;
                return calculatePts(key==='rank' ? Math.min(freezeYears, cap) : freezeYears, key === 'los'?'los':rankK, useOldSystemTable, mode);
            }

            if (useTransition && transitionDate && dateObj > transitionDate) {
                const yearsAtTrans = calculatePeriodYears(pointCalcBaseDate, transitionDate, mode);
                let effYearsBase = yearsAtTrans;
                if (key === 'rank' && useOldSystemTable) {
                     effYearsBase = Math.min(yearsAtTrans, rankCapYearCurrent);
                }
                const basePtKey = (key === 'rank' && !useOldSystemTable) ? rankK : key;
                const basePt = calculatePts(effYearsBase, basePtKey, useOldSystemTable, mode);
                const newTotal = calculatePts(yearsF, key === 'los'?'los':rankKeyNew, false, mode, targetFutureMaster);
                const newBase = calculatePts(yearsAtTrans, key === 'los'?'los':rankKeyNew, false, mode, targetFutureMaster);
                return basePt + Math.max(0, newTotal - newBase);
            } else {
                const cap = (key === 'rank' && useOldSystemTable) ? rankCapYearCurrent : 999;
                const effYears = (key === 'rank') ? Math.min(yearsF, cap) : yearsF;
                return calculatePts(effYears, key === 'los'?'los':rankK, useOldSystemTable, mode);
            }
        };

        for (let y = baseYear; y <= maxLoopYear; y++) {
            let amountInc = 0, incLos = 0, incRank = 0, incEval = 0, incAdj = 0;
            if (y <= endYear) {
                let referenceDateY = new Date(y + 1, 2, 31);
                if (referenceDateY > retireDateLos) referenceDateY = retireDateLos;
                
                let nextYearsFloat = calculatePeriodYears(pointCalcBaseDate, referenceDateY, getMode('los'));
                let nextYearsFloatForCoef = calculatePeriodYears(joinDate, referenceDateY, getMode('los'));

                const nextTheoryLos = calcPtAt(nextYearsFloat, referenceDateY, 'los', '', getMode('los'));
                incLos = Math.max(0, nextTheoryLos - trackingTheoryLos);
                trackingTheoryLos = nextTheoryLos;

                let rankCalcEndDate = referenceDateY;
                if (referenceDateY > retireDateRank) rankCalcEndDate = retireDateRank;
                const nextYearsFloatRank = calculatePeriodYears(pointCalcBaseDate, rankCalcEndDate, getMode('rank'));
                const nextTheoryRank = calcPtAt(nextYearsFloatRank, rankCalcEndDate, 'rank', rankKeyNew, getMode('rank'));
                incRank = Math.max(0, nextTheoryRank - trackingTheoryRank);
                trackingTheoryRank = nextTheoryRank; 
                
                const evalCheckDate = new Date(y, 6, 1);
                if (joinDate <= d2011_09_30 && ['r1', 'r2', 'r3'].includes(rankKeyNew)) {
                     if ((!useAdjustment && !useUnify) || evalCheckDate <= d2026_03_31) {
                         if (evalCheckDate > joinDate && evalCheckDate <= retireDateEval && evalCheckDate > new Date(2025, 8, 30)) {
                            if (y > baseYear || (y === baseYear && evalCheckDate > new Date())) {
                                if (rowInputEval !== null) {
                                    incEval = rowInputEval;
                                } else {
                                    const valCurrent = defaultYearlyEval;
                                    const valFuture = (defaultYearlyEvalFuture !== undefined) ? defaultYearlyEvalFuture : defaultYearlyEval;
                                    if (useTransition && transitionDate && evalCheckDate > transitionDate) {
                                        incEval = valFuture;
                                    } else {
                                        incEval = valCurrent;
                                    }
                                }
                            }
                        }
                     }
                }

                runningLos += incLos; runningRank += incRank; runningEval += incEval; 
                
                const currentCoef = getEffectiveCoef(nextYearsFloatForCoef, referenceDateY);
                let effectiveCoef = currentCoef;
                if (joinDate >= d2014_04_03 && referenceDateY < dJoinPlus6Years) effectiveCoef = 0;
                
                let currentReserveAmount = 0;
                
                currentReserveAmount = Math.ceil((runningLos + runningRank + runningEval + runningAdj) * unitPrice * effectiveCoef / 10) * 10;
                if (currentReserveAmount < prevReserveAmount) {
                    currentReserveAmount = prevReserveAmount;
                }

                if ((useAdjustment || useUnify) && y === 2025) {
                    if (targetReserve2026 !== undefined) {
                        currentReserveAmount = targetReserve2026;
                    }

                    reserveAmount2026Fixed = currentReserveAmount;
                    reserve2026 = currentReserveAmount; 

                    if (useAdjustment && targetRetirementAllowance !== undefined) {
                        adjustmentGap = targetRetirementAllowance - reserveAmount2026Fixed;
                        let count = 0;
                        const rYear = retireDateLos.getFullYear();
                        for(let k = 2026; k <= rYear; k++) {
                            if (new Date(k, 3, 1) <= retireDateLos) count++;
                        }
                        if (count > 0) {
                            calculatedAnnualAdj = Math.floor(adjustmentGap / count);
                        }
                    }

                    if (useUnify) {
                        const freezeYears = calculatePeriodYears(pointCalcBaseDate, d2026_03_31, getMode('los'));
                        unifyTrackingLos = calculatePts(freezeYears, 'los', false, getMode('los'), masterData2);
                        unifyTrackingRank = calculatePts(freezeYears, rankKeyNew, false, getMode('rank'), masterData2);
                    }
                }

                if ((useAdjustment || useUnify) && y >= 2026) {
                    runningLos -= incLos; runningRank -= incRank; runningEval -= incEval;
                    incLos = 0; incRank = 0; incEval = 0;

                    if (useAdjustment) {
                        const apr1 = new Date(y, 3, 1);
                        let amountAdjThisYear = 0;
                        if (apr1 <= retireDateLos) {
                            if (y === endYear) {
                                amountAdjThisYear = adjustmentGap - cumulativeAdjustmentAmount;
                            } else {
                                amountAdjThisYear = calculatedAnnualAdj;
                            }
                        }
                        cumulativeAdjustmentAmount += amountAdjThisYear;
                        incAdj = roundTo2(amountAdjThisYear / unitPrice);
                        runningAdj += incAdj;
                        currentReserveAmount = reserveAmount2026Fixed + cumulativeAdjustmentAmount;
                    } else if (useUnify) {
                        const nextTheoryLosNewManual = calculatePts(nextYearsFloat, 'los', false, getMode('los'), masterData2);
                        const nextTheoryRankNewManual = calculatePts(calculatePeriodYears(pointCalcBaseDate, rankCalcEndDate, getMode('rank')), rankKeyNew, false, getMode('rank'), masterData2);
                        
                        const incLosNew = Math.max(0, nextTheoryLosNewManual - unifyTrackingLos);
                        const incRankNew = Math.max(0, nextTheoryRankNewManual - unifyTrackingRank);
                        
                        unifyTrackingLos = nextTheoryLosNewManual;
                        unifyTrackingRank = nextTheoryRankNewManual;

                        let incEvalNew = 0;
                        const evalCheckDate = new Date(y, 6, 1);
                        if (evalCheckDate > joinDate && evalCheckDate <= retireDateEval) {
                             incEvalNew = defaultYearlyEval; 
                             if (defaultYearlyEvalFuture !== undefined) incEvalNew = defaultYearlyEvalFuture;
                        }

                        incLos = incLosNew;
                        incRank = incRankNew;
                        incEval = incEvalNew;
                        
                        const coefNew = 1.0; 
                        
                        const incAmountNew = Math.ceil((incLosNew + incRankNew + incEvalNew) * unitPrice * coefNew / 10) * 10;
                        unifyRunningNewAmount += incAmountNew;
                        
                        currentReserveAmount = reserveAmount2026Fixed + unifyRunningNewAmount;
                        
                        runningLos += incLos; runningRank += incRank; runningEval += incEval;
                    }
                }

                if (!useAdjustment && !useUnify && y === 2025) {
                    reserve2026 = currentReserveAmount;
                }
                
                if (y === endYear) {
                    if (useAdjustment && targetRetirementAllowance !== undefined) {
                        currentReserveAmount = targetRetirementAllowance;
                        retirementAllowance = targetRetirementAllowance;
                    } else if (useUnify) {
                        retirementAllowance = currentReserveAmount;
                    } else {
                        retirementAllowance = currentReserveAmount;
                    }
                }

                amountInc = currentReserveAmount - prevReserveAmount;
                prevReserveAmount = currentReserveAmount;
                
                yearlyDetails.push({ year: y, age: (y - birthDate.getFullYear()) + (birthDate.getMonth() < 3 ? 1 : 0), losPtInc: roundTo2(incLos), rankPtInc: roundTo2(incRank), evalPtInc: roundTo2(incEval), adjustmentPtInc: roundTo2(incAdj), amountInc: amountInc, totalPt: roundTo2(runningLos + runningRank + runningEval + runningAdj), coef: effectiveCoef });
            } else {
                 yearlyDetails.push({ year: y, age: (y - birthDate.getFullYear()) + (birthDate.getMonth() < 3 ? 1 : 0), losPtInc: 0, rankPtInc: 0, evalPtInc: 0, adjustmentPtInc: 0, amountInc: 0, totalPt: roundTo2(runningLos + runningRank + runningEval + runningAdj), coef: 0 });
            }
        }

        // Final consistency check for totalPoints
        if (useAdjustment && targetRetirementAllowance !== undefined) {
            retirementAllowance = targetRetirementAllowance;
            if (unitPrice > 0 && coefficient > 0) {
                 totalPoints = roundTo2(retirementAllowance / (unitPrice * coefficient));
            } else {
                const sumAdjPt = yearlyDetails.reduce((s,d) => s + d.adjustmentPtInc, 0);
                totalPoints = roundTo2(
                    (initialLosPointsInput + futureLosPoints) + 
                    (initialRankPointsInput + futureRankPoints) + 
                    (initialEvalPointsInput + futureEvalPoints) + 
                    sumAdjPt
                );
            }
        } else if (useUnify) {
             // For Unify mode, rely on accumulated increments in loop
             const sumIncrements = yearlyDetails.filter(d => d.year >= 2026).reduce((s, d) => s + d.losPtInc + d.rankPtInc + d.evalPtInc, 0);
             totalPoints = roundTo2(
                (initialLosPointsInput + futureLosPoints) + 
                (initialRankPointsInput + futureRankPoints) + 
                (initialEvalPointsInput + futureEvalPoints) +
                sumIncrements
             );
        } else {
             // For Normal mode, verify consistency.
             // If allowance doesn't match totalPoints * unitPrice * coef (due to loop rounding), prefer the loop's final result to ensure chart consistency?
             // Or prefer totalPoints as truth?
             // Usually Point Table is truth. If annual increments rounded cause drift, we usually allow drift for financial accrual, 
             // but 'retirementAllowance' (Payout) should be exact Point * UnitPrice.
             // Here, let's strictly align Payout to Points for consistency.
             const calcAllowance = Math.ceil((totalPoints * unitPrice * coefficient) / 10) * 10;
             if (Math.abs(calcAllowance - retirementAllowance) > 100) {
                 // Significant drift (more than rounding). Trust points.
                 retirementAllowance = calcAllowance;
             }
        }

        if (reserve2026 === 0 && baseYear > endYear) {
             reserve2026 = prevReserveAmount;
        }

        return {
            employeeId: id, name, joinDate, calcStartDate: pointCalcBaseDate.getTime() !== joinDate.getTime() ? pointCalcBaseDate : undefined,
            birthDate, retirementDate, grade: rankInfo, typeName: useTransition ? `${typeName}(移行)` : (useUnify ? `${typeName}(統一)` : typeName), yearsOfService, serviceDuration,
            initialLosPointsInput, futureLosPoints, initialRankPointsInput, futureRankPoints, initialEvalPointsInput, futureEvalPoints,
            totalPointsAtRetirement: totalPoints, retirementAllowance: retirementAllowance > 0 ? retirementAllowance : 0, reserve2026, yearlyDetails, unitPrice
        };
    } catch (e) {
        console.error("Calculation Error for row:", row, e);
        return null;
    }
};
