import React, { useState } from 'react';
import { X, BookOpen, HelpCircle, FileText, CheckCircle, Sliders, BarChart3, ArrowRight, MousePointerClick, RefreshCw, Lock, Sparkles, Database, Printer, FileDown } from 'lucide-react';

interface HelpModalProps {
    onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<'usage' | 'faq'>('usage');

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-slate-800 text-white px-8 py-5 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3 font-bold text-xl">
                        <HelpCircle className="w-7 h-7 text-indigo-300" />
                        操作ガイド ＆ よくある質問
                    </div>
                    <button onClick={onClose} className="hover:bg-slate-700 p-2 rounded-full transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 shrink-0">
                    <button
                        onClick={() => setActiveTab('usage')}
                        className={`flex-1 py-4 text-base font-bold flex items-center justify-center gap-2 transition ${activeTab === 'usage' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <BookOpen className="w-5 h-5" /> システムの使い方（操作ガイド）
                    </button>
                    <button
                        onClick={() => setActiveTab('faq')}
                        className={`flex-1 py-4 text-base font-bold flex items-center justify-center gap-2 transition ${activeTab === 'faq' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <HelpCircle className="w-5 h-5" /> よくある質問 (FAQ)
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 bg-slate-50/50 flex-1">
                    {activeTab === 'usage' ? (
                        <div className="space-y-10 max-w-5xl mx-auto">
                            {/* Step 1 */}
                            <section className="relative pl-12">
                                <div className="absolute left-0 top-0 w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md ring-4 ring-indigo-50">1</div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
                                    <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        社員データの準備と読み込み
                                    </h3>
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="flex-1 space-y-3 text-slate-600 leading-relaxed text-sm">
                                            <p>
                                                シミュレーションを行うには、まず社員データを読み込む必要があります。
                                                画面中央の<span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-300 mx-1">テンプレートDL</span>ボタンから雛形(CSV)をダウンロードし、データを入力してください。
                                            </p>
                                            <p>
                                                Excelファイル(.xlsx)またはCSVファイルに対応しています。<br/>
                                                <span className="text-xs text-slate-500">※ 1行目はヘッダーとして扱われます。列の順序が変わっても、ヘッダー名が正しければ自動認識します。</span>
                                            </p>
                                        </div>
                                        <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm">
                                            <div className="font-bold text-slate-500 mb-3 uppercase text-xs tracking-wider">必須入力項目</div>
                                            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-slate-700 font-medium">
                                                <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500"/> 社員番号</div>
                                                <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500"/> 氏名</div>
                                                <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500"/> 生年月日</div>
                                                <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500"/> 入社日</div>
                                                <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500"/> 資格・等級</div>
                                                <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500"/> 現在の累積ポイント</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Step 2 */}
                            <section className="relative pl-12">
                                <div className="absolute left-0 top-0 w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md ring-4 ring-indigo-50">2</div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
                                    <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        シミュレーション条件の設定（A案 vs B案）
                                    </h3>
                                    <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                                        本システムは、2つの条件（<span className="font-bold text-indigo-600">パターンA：変更案</span> と <span className="font-bold text-emerald-600">パターンB：現行制度</span>）を並行して計算し、将来の退職金引当額の推移や個人の支給額を比較します。
                                    </p>
                                    
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="border border-slate-200 rounded-xl p-4">
                                            <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><Sliders className="w-4 h-4"/> 基本パラメータ設定</h4>
                                            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                                                <li><span className="font-bold">ポイント単価</span>: 1ポイントあたりの金額（円）</li>
                                                <li><span className="font-bold">標準考課Pt</span>: 将来期間のシミュレーションで毎年加算する仮定の考課ポイント</li>
                                                <li><span className="font-bold">定年年齢</span>: 制度区分ごとの定年年齢（60歳、65歳など）</li>
                                                <li><span className="font-bold">職能Pt上限年数</span>: 昇給が停止する勤続年数キャップ</li>
                                            </ul>
                                        </div>
                                        <div className="border border-slate-200 rounded-xl p-4">
                                            <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><MousePointerClick className="w-4 h-4"/> マスタ詳細設定</h4>
                                            <p className="text-sm text-slate-600 leading-relaxed mb-2">
                                                <span className="font-bold text-slate-800">「勤続P・職能P・支給率テーブルを確認・編集する」</span>ボタンから、年数ごとのポイント付与テーブルや係数表を詳細に編集できます。
                                            </p>
                                            <div className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded inline-block">
                                                ★ CSVインポート/エクスポート、Excelからのコピペも可能です
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Step 3 */}
                            <section className="relative pl-12">
                                <div className="absolute left-0 top-0 w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md ring-4 ring-indigo-50">3</div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
                                    <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        高度なシミュレーション設定（制度移行・特殊モード）
                                    </h3>
                                    <div className="space-y-4">
                                        {/* 制度改定日 */}
                                        <div className="flex gap-4 items-start p-4 bg-slate-50 rounded-xl border border-slate-200">
                                            <div className="bg-white p-2 rounded-lg border border-slate-200 shrink-0"><RefreshCw className="w-6 h-6 text-indigo-600"/></div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 mb-1">制度改定日（移行シミュレーション）</h4>
                                                <p className="text-sm text-slate-600 leading-relaxed">
                                                    「制度改定日」にチェックを入れ日付を指定すると、その日までは「現行マスタ」、翌日以降は「将来マスタ（改定案）」を使用して計算します（カーブ乗り換え方式）。<br/>
                                                    マスタ編集画面の「改定（案）」タブで、改定後のポイント表を設定してください。
                                                </p>
                                            </div>
                                        </div>

                                        {/* 調整ポイントモード */}
                                        <div className="flex gap-4 items-start p-4 bg-amber-50 rounded-xl border border-amber-200">
                                            <div className="bg-white p-2 rounded-lg border border-amber-200 shrink-0"><Lock className="w-6 h-6 text-amber-600"/></div>
                                            <div>
                                                <h4 className="font-bold text-amber-800 mb-1">調整ポイントモード（パターンA専用）</h4>
                                                <p className="text-sm text-amber-900/80 leading-relaxed">
                                                    2026年3月31日時点の引当額を「既得権」として凍結し、以降のポイント加算を停止します。<br/>
                                                    代わりに、定年時の支給額が「B案（現行）」と同額になるよう、不足分を「調整ポイント」として将来期間で均等割りして付与します。
                                                    <span className="font-bold ml-1">移行時の不利益変更回避策</span>のシミュレーションに使用します。
                                                </p>
                                            </div>
                                        </div>

                                        {/* 新制度統一モード */}
                                        <div className="flex gap-4 items-start p-4 bg-sky-50 rounded-xl border border-sky-200">
                                            <div className="bg-white p-2 rounded-lg border border-sky-200 shrink-0"><RefreshCw className="w-6 h-6 text-sky-600"/></div>
                                            <div>
                                                <h4 className="font-bold text-sky-800 mb-1">新制度に統一モード（パターンA専用）</h4>
                                                <p className="text-sm text-sky-900/80 leading-relaxed">
                                                    2026年3月31日時点の引当額を凍結し、2026年4月以降は、対象となる全社員を<span className="font-bold">「新制度（Type 4）」</span>のルール（ポイント表・計算式）で積み上げ計算します。<br/>
                                                    旧制度対象者を新制度へ統合する場合のシミュレーションに使用します。<br/>
                                                    <span className="font-bold">「適用対象」</span>のチェックボックスで、どの制度区分の社員にこのモードを適用するかを選択できます。
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Step 4 */}
                            <section className="relative pl-12">
                                <div className="absolute left-0 top-0 w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md ring-4 ring-indigo-50">4</div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
                                    <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-purple-600"/>
                                        AI分析レポートと自動提案
                                    </h3>
                                    <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                                        画面下部の「AI分析レポート」セクションでは、Google Gemini AIがシミュレーション結果（A案とB案の差異、将来のコスト推移）を分析し、
                                        改善案や最適なパラメータ設定を提案します。
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="flex-1 border border-slate-200 p-3 rounded-lg bg-slate-50">
                                            <div className="font-bold text-slate-700 text-sm mb-1">1. 分析の実行</div>
                                            <p className="text-xs text-slate-500">「分析レポートを作成する」ボタンを押すと、現状の比較分析と、コスト削減や制度統合に向けた具体的なアドバイスが生成されます。</p>
                                        </div>
                                        <div className="flex-1 border border-slate-200 p-3 rounded-lg bg-slate-50">
                                            <div className="font-bold text-slate-700 text-sm mb-1">2. 対話的な調整</div>
                                            <p className="text-xs text-slate-500">チャット形式で「定年を65歳にして」「コストを10%削減する案を出して」等の追加指示が出せます。</p>
                                        </div>
                                        <div className="flex-1 border border-indigo-200 p-3 rounded-lg bg-indigo-50">
                                            <div className="font-bold text-indigo-700 text-sm mb-1">3. 設定の自動反映</div>
                                            <p className="text-xs text-indigo-800">AIが生成したパラメータやマスタ案を、ボタン一つで<span className="font-bold">パターンA</span>に適用し、即座に再計算できます。</p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Step 5 */}
                            <section className="relative pl-12">
                                <div className="absolute left-0 top-0 w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md ring-4 ring-indigo-50">5</div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
                                    <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        結果の確認と出力
                                    </h3>
                                    <div className="grid sm:grid-cols-3 gap-4">
                                        <div className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition cursor-default flex flex-col items-center text-center">
                                            <div className="p-3 bg-indigo-50 rounded-full text-indigo-600 mb-3"><BarChart3 className="w-6 h-6"/></div>
                                            <div className="font-bold text-slate-700 mb-1">全体グラフ</div>
                                            <p className="text-xs text-slate-500">年度ごとの引当金繰入額（単年度費用）の推移を、制度区分別に積み上げグラフで表示します。画像保存も可能です。</p>
                                        </div>
                                        <div className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition cursor-default flex flex-col items-center text-center">
                                            <div className="p-3 bg-emerald-50 rounded-full text-emerald-600 mb-3"><FileDown className="w-6 h-6"/></div>
                                            <div className="font-bold text-slate-700 mb-1">Excel出力</div>
                                            <p className="text-xs text-slate-500">全社員分の比較結果一覧、差額、年度ごとの費用推移を含む詳細なExcelファイルをダウンロードします。</p>
                                        </div>
                                        <div className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition cursor-default flex flex-col items-center text-center">
                                            <div className="p-3 bg-purple-50 rounded-full text-purple-600 mb-3"><ArrowRight className="w-6 h-6"/></div>
                                            <div className="font-bold text-slate-700 mb-1">個人検索</div>
                                            <p className="text-xs text-slate-500">社員番号や氏名で検索し、その社員の退職金内訳、移行時のポイント推移などの詳細カードを表示します。</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    ) : (
                        <div className="space-y-6 max-w-4xl mx-auto pb-10">
                            {/* FAQ Items */}
                            {[
                                {
                                    q: "「制度区分（旧①～③、新）」はどのように判定されますか？",
                                    a: "社員データの「入社日」に基づいて自動的に判定されます。\n\n・旧制度①：～平成11年3月31日 入社\n・旧制度②：平成11年4月1日 ～ 平成12年3月31日 入社\n・旧制度③：平成12年4月1日 ～ 平成23年9月30日 入社\n・新制度：平成23年10月1日 ～ 以降入社"
                                },
                                {
                                    q: "「調整ポイントモード」と「新制度に統一モード」の違いは？",
                                    a: "どちらも「2026年3月末で旧制度計算を凍結する」点は同じですが、それ以降の計算方法が異なります。\n\n●調整ポイントモード：\n「定年時の支給額を現行制度(B案)と合わせる」ことが目的です。不足分を逆算して埋め合わせます。\n\n●新制度に統一モード：\n「全員を新制度のルールで計算する」ことが目的です。凍結時点以降は、新制度のポイント表に基づいて積み上げ計算を行います。結果として支給額が増減する可能性があります。"
                                },
                                {
                                    q: "支給率係数を変更するにはどうすればよいですか？",
                                    a: "設定パネルの下部にある「勤続P・職能P・支給率テーブルを確認・編集する」ボタンをクリックしてください。\n開いた画面のタブから、以下のいずれかを選択して編集します。\n\n・「現行支給率」タブ：現在の制度で使用されている係数表\n・「改定（案）」タブ：制度改定日以降に適用される新係数（サブメニューで「支給率係数」を選択）"
                                },
                                {
                                    q: "CSVインポート時のデータの作り方は？",
                                    a: "「単年度(増分)」と「累計」のどちらのモードで入力するかによって値が異なります。\nマスタ編集画面の右上にある切替ボタンでモードを確認してください。\nAI分析レポートから出力されるCSVは通常「単年度(増分)」形式です。Excel等で編集する際は、1行目をヘッダー（Year, Los, Rank1...）とし、2行目以降にデータを作成してください。"
                                },
                                {
                                    q: "「2026/3末 引当残高」とは何ですか？",
                                    a: "2025年度末（2026年3月31日）時点での理論上の退職金要支給額です。\n入力された累積ポイントと、そこから2026年3月末までに加算される見込みポイント（勤続・職能等）を合算し、その時点の支給率と単価を乗じて算出しています。\n将来の費用シミュレーションの「開始残高」として扱われます。"
                                },
                                {
                                    q: "グラフの金額が極端に変動するのはなぜですか？",
                                    a: "グラフは「単年度ごとの費用（引当金繰入額）」を表示しています。\n特定の年度に退職者が集中する場合や、定年延長により特定の年度の退職者がゼロになる場合（空洞化）、極端な変動が生じることがあります。\nまた、ポイント単価の設定桁数が正しいか（例：10,000円など）もご確認ください。"
                                },
                                {
                                    q: "印刷時にレイアウトが崩れてしまいます。",
                                    a: "ブラウザの印刷設定で「背景のグラフィック」をオンにしてください。\nまた、結果詳細カードやグラフには専用の「印刷」ボタンがあり、これを押すと自動的にA3用紙サイズに最適化された印刷プレビューが開きます。"
                                }
                            ].map((faq, i) => (
                                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-indigo-200 transition">
                                    <div className="flex items-start gap-4 mb-3">
                                        <span className="bg-indigo-600 text-white text-sm font-bold px-3 py-1 rounded-full shrink-0 mt-0.5 shadow-sm">Q</span>
                                        <h4 className="font-bold text-slate-800 text-lg leading-snug">{faq.q}</h4>
                                    </div>
                                    <div className="flex items-start gap-4 pl-2 border-l-2 border-indigo-100 ml-4 pt-1">
                                        <span className="text-emerald-600 text-sm font-bold px-3 py-1 bg-emerald-50 rounded-full shrink-0 mt-0.5 shadow-sm">A</span>
                                        <div className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm">
                                            {faq.a}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-8 py-5 border-t border-slate-200 text-right shrink-0">
                    <button onClick={onClose} className="bg-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-700 transition text-base shadow-lg flex items-center gap-2 ml-auto">
                        <CheckCircle className="w-5 h-5"/> 閉じる
                    </button>
                </div>
            </div>
        </div>
    );
};