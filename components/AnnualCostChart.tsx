import React, { useState } from 'react';
import { BarChart3, Printer, Download, Copy, Check, Image as ImageIcon, Loader2, FileSpreadsheet } from 'lucide-react';
import { AggregatedYearlyData } from '../types';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

interface AnnualCostChartProps {
    data: AggregatedYearlyData[];
}

export const AnnualCostChart: React.FC<AnnualCostChartProps> = ({ data }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [isCopying, setIsCopying] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isExcelExporting, setIsExcelExporting] = useState(false);

    if (!data || data.length === 0) return null;

    // Show 2026-2046 (Modified start year as requested)
    const displayData = data.filter(d => d.year >= 2026 && d.year <= 2046);
    const maxVal = Math.max(...displayData.map(d => Math.max(d.A.total, d.B.total)), 0);
    
    // Scale
    const yAxisMax = maxVal > 0 ? maxVal * 1.15 : 5000000; 

    // Dimensions
    const height = 300;
    const barGroupWidth = 50; 
    const barWidth = 18;
    const gap = 24;
    const marginLeft = 60;
    const width = displayData.length * (barGroupWidth + gap) + marginLeft + 20;

    const getWareki = (year: number) => `R${year - 2018}`;
    const roundToThousand = (val: number) => Math.round(val / 1000); // 千円単位四捨五入

    // Colors
    const colors = {
        type1: '#f97316', // Orange-500 (旧制度①)
        type2: '#eab308', // Yellow-500 (旧制度②)
        type3: '#10b981', // Emerald-500 (旧制度③)
        type4: '#3b82f6', // Blue-500 (新制度)
    };

    const handlePrint = () => {
        // A3横向き設定を注入
        const styleId = 'print-orientation-style';
        let style = document.getElementById(styleId);
        if (style) style.remove();
        
        style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `@media print { @page { size: A3 landscape; } }`;
        document.head.appendChild(style);
        
        setTimeout(() => window.print(), 100);
    };

    const captureChart = async (): Promise<HTMLCanvasElement | null> => {
        const element = document.getElementById('annual-cost-chart-container');
        if (!element) return null;
        
        // 一時的にスタイルを調整して全体をキャプチャしやすくする
        const originalOverflow = element.style.overflow;
        element.style.overflow = 'visible';

        try {
            const canvas = await html2canvas(element, {
                scale: 2, // 高解像度（Retina対応）
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false,
                windowWidth: element.scrollWidth + 50, // 横スクロール分を含める
            });
            element.style.overflow = originalOverflow;
            return canvas;
        } catch (e) {
            console.error(e);
            element.style.overflow = originalOverflow;
            return null;
        }
    };

    const handleDownloadImage = async () => {
        setIsDownloading(true);
        const canvas = await captureChart();
        if (canvas) {
            const link = document.createElement('a');
            link.download = `引当金繰入額推移_${new Date().toISOString().slice(0,10)}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } else {
            alert('画像の生成に失敗しました。');
        }
        setIsDownloading(false);
    };

    const handleCopyImage = async () => {
        setIsCopying(true);
        try {
            const canvas = await captureChart();
            if (canvas) {
                canvas.toBlob(async (blob) => {
                    if (!blob) return;
                    try {
                        const item = new ClipboardItem({ 'image/png': blob });
                        await navigator.clipboard.write([item]);
                        // 成功表示のために少し待つ
                        setTimeout(() => setIsCopying(false), 2000);
                    } catch (err) {
                        console.error(err);
                        alert('クリップボードへのコピーに失敗しました。\nブラウザの権限設定を確認するか、画像保存機能を使用してください。');
                        setIsCopying(false);
                    }
                });
            } else {
                setIsCopying(false);
            }
        } catch (e) {
            console.error(e);
            setIsCopying(false);
        }
    };

    const handleDownloadExcel = () => {
        setIsExcelExporting(true);
        try {
            // Excel出力時は全期間のデータを使用する
            const exportData = data;

            const headers = [
                "年度", 
                "A案_総額(千円)", "B案_総額(千円)", "差額_総額(A-B)",
                "A案_旧1", "B案_旧1", "差額_旧1",
                "A案_旧2", "B案_旧2", "差額_旧2",
                "A案_旧3", "B案_旧3", "差額_旧3",
                "A案_新",  "B案_新",  "差額_新",
                "人数_旧1", "人数_旧2", "人数_旧3", "人数_新", "人数合計"
            ];

            const rows = exportData.map(d => [
                d.year,
                roundToThousand(d.A.total), roundToThousand(d.B.total), roundToThousand(d.A.total - d.B.total),
                
                roundToThousand(d.A.type1), roundToThousand(d.B.type1), roundToThousand(d.A.type1 - d.B.type1),
                roundToThousand(d.A.type2), roundToThousand(d.B.type2), roundToThousand(d.A.type2 - d.B.type2),
                roundToThousand(d.A.type3), roundToThousand(d.B.type3), roundToThousand(d.A.type3 - d.B.type3),
                roundToThousand(d.A.type4), roundToThousand(d.B.type4), roundToThousand(d.A.type4 - d.B.type4),

                d.counts.type1, d.counts.type2, d.counts.type3, d.counts.type4, d.counts.total
            ]);

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
            
            // 幅調整
            ws['!cols'] = [
                {wch:6}, // 年度
                {wch:14}, {wch:14}, {wch:14}, // 総額
                {wch:10}, {wch:10}, {wch:10}, // 旧1
                {wch:10}, {wch:10}, {wch:10}, // 旧2
                {wch:10}, {wch:10}, {wch:10}, // 旧3
                {wch:10}, {wch:10}, {wch:10}, // 新
                {wch:8}, {wch:8}, {wch:8}, {wch:8}, {wch:8} // 人数
            ];

            XLSX.utils.book_append_sheet(wb, ws, "推移データ");
            XLSX.writeFile(wb, `引当金繰入額推移_全期間_${new Date().toISOString().slice(0,10)}.xlsx`);
        } catch (e: any) {
            console.error(e);
            alert("Excel生成に失敗しました: " + e.message);
        } finally {
            setIsExcelExporting(false);
        }
    };

    // Helper to render cell with breakdown
    const renderCellContent = (
        vals: { type1: number; type2: number; type3: number; type4: number; total: number },
        isCurrency: boolean,
        totalColorClass: string
    ) => {
        const fmt = (v: number) => isCurrency ? roundToThousand(v).toLocaleString() : v.toLocaleString();
        
        return (
            <div className="flex flex-col items-end w-full min-w-[100px]">
                <span className={`text-base font-bold ${totalColorClass} mb-1.5`}>{fmt(vals.total)}</span>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 w-full border-t border-slate-200/60 pt-1.5">
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
                        <span className="flex items-center text-[10px] text-slate-400"><span className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1"></span>①</span>
                        <span>{fmt(vals.type1)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
                        <span className="flex items-center text-[10px] text-slate-400"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mr-1"></span>②</span>
                        <span>{fmt(vals.type2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
                        <span className="flex items-center text-[10px] text-slate-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1"></span>③</span>
                        <span>{fmt(vals.type3)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
                        <span className="flex items-center text-[10px] text-slate-400"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1"></span>新</span>
                        <span>{fmt(vals.type4)}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div id="annual-cost-chart-container" className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mt-8 print-break-inside-avoid">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 rounded-lg">
                        <BarChart3 className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-700 text-lg">パターン比較: 引当金繰入額 (単年度費用)</h4>
                        <p className="text-sm text-slate-500">制度区分別の積み上げグラフ</p>
                    </div>
                </div>
                {/* Legend & Print Button */}
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 no-print">
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold mr-2">
                        <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-sm bg-orange-500"></span>旧制度①</div>
                        <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-sm bg-yellow-500"></span>旧制度②</div>
                        <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-sm bg-emerald-500"></span>旧制度③</div>
                        <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-sm bg-blue-500"></span>新制度</div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleDownloadExcel}
                            disabled={isExcelExporting}
                            className={`bg-white hover:bg-green-50 border border-slate-200 hover:border-green-300 text-green-700 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition`}
                            title="Excel形式でダウンロード"
                        >
                            {isExcelExporting ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileSpreadsheet className="w-4 h-4"/>}
                            Excel
                        </button>
                        <button 
                            onClick={handleCopyImage}
                            disabled={isCopying}
                            className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition border ${isCopying ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'}`}
                            title="クリップボードに画像をコピー"
                        >
                            {isCopying ? <Check className="w-4 h-4"/> : <Copy className="w-4 h-4"/>}
                            {isCopying ? 'コピー完了' : '画像コピー'}
                        </button>
                        <button 
                            onClick={handleDownloadImage}
                            disabled={isDownloading}
                            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition"
                            title="画像を保存"
                        >
                            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin"/> : <ImageIcon className="w-4 h-4"/>}
                            保存
                        </button>
                        <button 
                            onClick={handlePrint} 
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition"
                        >
                            <Printer className="w-4 h-4"/> 印刷
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200">
                <svg width={Math.max(width, 600)} height={height + 60} className="mx-auto">
                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                        const y = height - (height * ratio);
                        const value = yAxisMax * ratio;
                        return (
                            <g key={i}>
                                <line x1={marginLeft} y1={y} x2={width} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />
                                <text x={marginLeft - 8} y={y + 4} textAnchor="end" className="text-xs fill-slate-400 font-mono">
                                    {(value / 1000000).toFixed(1)}M
                                </text>
                            </g>
                        );
                    })}

                    {/* Bars */}
                    {displayData.map((d, i) => {
                        const x = marginLeft + i * (barGroupWidth + gap);
                        const isHovered = hoveredIndex === i;
                        
                        // Stack Calculation helper
                        const getStacks = (vals: {type1:number, type2:number, type3:number, type4:number, total:number}) => {
                            const scale = (v: number) => (v / yAxisMax) * height;
                            const h1 = scale(vals.type1);
                            const h2 = scale(vals.type2);
                            const h3 = scale(vals.type3);
                            const h4 = scale(vals.type4);
                            return { h1, h2, h3, h4 };
                        };

                        const sA = getStacks(d.A);
                        const sB = getStacks(d.B);

                        const renderStack = (bx: number, s: {h1:number, h2:number, h3:number, h4:number}) => (
                            <>
                                <rect x={bx} y={height - s.h1} width={barWidth} height={s.h1} fill={colors.type1} />
                                <rect x={bx} y={height - s.h1 - s.h2} width={barWidth} height={s.h2} fill={colors.type2} />
                                <rect x={bx} y={height - s.h1 - s.h2 - s.h3} width={barWidth} height={s.h3} fill={colors.type3} />
                                <rect x={bx} y={height - s.h1 - s.h2 - s.h3 - s.h4} width={barWidth} height={s.h4} fill={colors.type4} />
                            </>
                        );

                        return (
                            <g key={d.year} onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)}>
                                {/* Hover BG */}
                                <rect x={x - 4} y={0} width={barGroupWidth + 8} height={height} fill={isHovered ? "#f1f5f9" : "transparent"} rx={4} />

                                {/* Bar A */}
                                {renderStack(x, sA)}
                                
                                {/* Bar B */}
                                {renderStack(x + barWidth + 4, sB)}

                                {/* Labels */}
                                <text textAnchor="middle" x={x + barGroupWidth / 2} y={height + 20} className={`text-xs font-bold ${isHovered ? 'fill-indigo-700' : 'fill-slate-500'}`}>
                                    {d.year}
                                </text>
                                <text textAnchor="middle" x={x + barGroupWidth / 2} y={height + 35} className="text-[10px] fill-slate-400">
                                    {getWareki(d.year)}
                                </text>
                                
                                {/* A/B labels below */}
                                <text textAnchor="middle" x={x + barWidth/2} y={height + 5} className="text-[10px] font-bold fill-indigo-600">A</text>
                                <text textAnchor="middle" x={x + barWidth + 4 + barWidth/2} y={height + 5} className="text-[10px] font-bold fill-emerald-600">B</text>
                            </g>
                        );
                    })}
                    <line x1={marginLeft} y1={height} x2={width} y2={height} stroke="#cbd5e1" strokeWidth="1" />
                </svg>
            </div>

            {/* Detailed Table - Updated to Horizontal Layout */}
            <div className="mt-10 overflow-x-auto">
                <table className="w-full text-right text-base border-collapse min-w-max">
                    <thead>
                        <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                            <th className="p-4 text-left sticky left-0 bg-slate-100 z-10 w-44 font-bold border-r border-slate-200 shadow-[1px_0_3px_-1px_rgba(0,0,0,0.1)]">年度</th>
                            {displayData.map(d => (
                                <th key={d.year} className="p-4 text-center min-w-[120px] font-bold border-r border-slate-200 last:border-0 align-top">
                                    <div>{d.year}</div>
                                    <div className="text-xs font-normal text-slate-400 mt-1">({getWareki(d.year)})</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {/* Row: Personnel Count */}
                        <tr>
                            <th className="p-4 text-left font-bold text-slate-600 sticky left-0 bg-white border-r border-slate-200 shadow-[1px_0_3px_-1px_rgba(0,0,0,0.1)] align-top">
                                対象人数 (名)
                                <div className="mt-2 text-[10px] font-normal text-slate-400 grid grid-cols-1 gap-0.5 no-print">
                                    <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1"></span>① 旧制度1</span>
                                    <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mr-1"></span>② 旧制度2</span>
                                    <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1"></span>③ 旧制度3</span>
                                    <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1"></span>新 新制度</span>
                                </div>
                            </th>
                            {displayData.map(d => (
                                <td key={d.year} className="p-4 text-center border-r border-slate-100 align-top bg-white">
                                    {renderCellContent(d.counts, false, 'text-slate-700')}
                                </td>
                            ))}
                        </tr>
                        {/* Row: A Cost */}
                        <tr className="bg-indigo-50/20">
                            <th className="p-4 text-left font-bold text-indigo-700 sticky left-0 bg-indigo-50 border-r border-slate-200 shadow-[1px_0_3px_-1px_rgba(0,0,0,0.1)] align-top">
                                A案(変更) 費用
                                <div className="text-xs font-normal text-indigo-500 mt-1">(千円)</div>
                            </th>
                            {displayData.map(d => (
                                <td key={d.year} className="p-4 text-right font-mono border-r border-indigo-50 align-top">
                                    {renderCellContent(d.A, true, 'text-indigo-700')}
                                </td>
                            ))}
                        </tr>
                        {/* Row: B Cost */}
                        <tr className="bg-emerald-50/20">
                            <th className="p-4 text-left font-bold text-emerald-700 sticky left-0 bg-emerald-50 border-r border-slate-200 shadow-[1px_0_3px_-1px_rgba(0,0,0,0.1)] align-top">
                                B案(現行) 費用
                                <div className="text-xs font-normal text-emerald-500 mt-1">(千円)</div>
                            </th>
                            {displayData.map(d => (
                                <td key={d.year} className="p-4 text-right font-mono border-r border-emerald-50 align-top">
                                    {renderCellContent(d.B, true, 'text-emerald-700')}
                                </td>
                            ))}
                        </tr>
                        {/* Row: Difference */}
                        <tr>
                            <th className="p-4 text-left font-bold text-slate-700 sticky left-0 bg-white border-r border-slate-200 shadow-[1px_0_3px_-1px_rgba(0,0,0,0.1)]">
                                差額 (A - B)
                                <div className="text-xs font-normal text-slate-500 mt-1">(千円)</div>
                            </th>
                            {displayData.map(d => {
                                // A - B
                                const diff = roundToThousand(d.A.total) - roundToThousand(d.B.total);
                                return (
                                    <td key={d.year} className={`p-4 font-mono font-bold border-r border-slate-100 align-top ${diff > 0 ? 'text-red-500' : 'text-blue-600'}`}>
                                        <div className="flex flex-col items-end">
                                            <span className="text-lg">{diff > 0 ? '+' : ''}{diff.toLocaleString()}</span>
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};
