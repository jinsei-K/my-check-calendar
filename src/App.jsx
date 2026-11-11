import React, { useState } from 'react';
import {
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  HelpCircle,
  Settings,
  ChevronDown,
  Plus
} from 'lucide-react';

export default function App() {
  // 画像の左側（サイドバー閉）と右側（サイドバー開）を切り替えられるステート
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // カレンダーの日付データ (2026年11月)
  const calendarDays = [
    // 1週目
    { id: '2026-11-01', display: '11月1日', isCurrentMonth: true, isToday: false, event: null },
    { id: '2026-11-02', display: '2', isCurrentMonth: true, isToday: false, event: null },
    { id: '2026-11-03', display: '3', isCurrentMonth: true, isToday: false, event: '文化の日' },
    { id: '2026-11-04', display: '4', isCurrentMonth: true, isToday: false, event: null },
    { id: '2026-11-05', display: '5', isCurrentMonth: true, isToday: false, event: null },
    { id: '2026-11-06', display: '6', isCurrentMonth: true, isToday: false, event: null },
    { id: '2026-11-07', display: '7', isCurrentMonth: true, isToday: false, event: null },
    // 2週目
    { id: '2026-11-08', display: '8', isCurrentMonth: true, isToday: false, event: null },
    { id: '2026-11-09', display: '9', isCurrentMonth: true, isToday: false, event: null },
    { id: '2026-11-10', display: '10', isCurrentMonth: true, isToday: false, event: null },
    { id: '2026-11-11', display: '11', isCurrentMonth: true, isToday: true, event: null },
    { id: '2026-11-12', display: '12', isCurrentMonth: true, isToday: false, event: null },
    { id: '2026-11-13', display: '13', isCurrentMonth: true, isToday: false, event: null },
    { id: '2026-11-14', display: '14', isCurrentMonth: true, isToday: false, event: null },
    // 3週目
    { id: '2026-11-15', display: '15', isCurrentMonth: true, isToday: false, event: '七五三' },
    { id: '2026-11-16', display: '16', isCurrentMonth: true, isToday: false, event: null },
    { id: '2026-11-17', display: '17', isCurrentMonth: true, isToday: false, event: null },
    { id: '2026-11-18', display: '18', isCurrentMonth: true, isToday: false, event: null },
    { id: '2026-11-19', display: '19', isCurrentMonth: true, isToday: false, event: null },
    { id: '2026-11-20', display: '20', isCurrentMonth: true, isToday: false, event: null },
    { id: '2026-11-21', display: '21', isCurrentMonth: true, isToday: false, event: null },
    // 4週目
    { id: '2026-11-22', display: '22', isCurrentMonth: true, isToday: false, event: null },
    { id: '2026-11-23', display: '23', isCurrentMonth: true, isToday: false, event: '勤労感謝の日' },
    { id: '2026-11-24', display: '24', isCurrentMonth: true, isToday: false, event: null },
    { id: '2026-11-25', display: '25', isCurrentMonth: true, isToday: false, event: null },
    { id: '2026-11-26', display: '26', isCurrentMonth: true, isToday: false, event: null },
    { id: '2026-11-27', display: '27', isCurrentMonth: true, isToday: false, event: null },
    { id: '2026-11-28', display: '28', isCurrentMonth: true, isToday: false, event: null },
    // 5週目
    { id: '2026-11-29', display: '29', isCurrentMonth: true, isToday: false, event: null },
    { id: '2026-11-30', display: '30', isCurrentMonth: true, isToday: false, event: null },
    { id: '2026-12-01', display: '12月1日', isCurrentMonth: false, isToday: false, event: null },
    { id: '2026-12-02', display: '2', isCurrentMonth: false, isToday: false, event: null },
    { id: '2026-12-03', display: '3', isCurrentMonth: false, isToday: false, event: null },
    { id: '2026-12-04', display: '4', isCurrentMonth: false, isToday: false, event: null },
    { id: '2026-12-05', display: '5', isCurrentMonth: false, isToday: false, event: null },
  ];

  // ミニカレンダーの日付データ (サイドバー内)
  const miniCalendarDays = [
    // 1行目: 11/1 ~ 11/7 (1日は選択表示の薄い水色背景)
    { num: 1, isCurrent: true, isSelected: true, isToday: false },
    { num: 2, isCurrent: true, isSelected: false, isToday: false },
    { num: 3, isCurrent: true, isSelected: false, isToday: false },
    { num: 4, isCurrent: true, isSelected: false, isToday: false },
    { num: 5, isCurrent: true, isSelected: false, isToday: false },
    { num: 6, isCurrent: true, isSelected: false, isToday: false },
    { num: 7, isCurrent: true, isSelected: false, isToday: false },
    // 2行目: 11/8 ~ 11/14 (11日は濃い青丸の今日)
    { num: 8, isCurrent: true, isSelected: false, isToday: false },
    { num: 9, isCurrent: true, isSelected: false, isToday: false },
    { num: 10, isCurrent: true, isSelected: false, isToday: false },
    { num: 11, isCurrent: true, isSelected: false, isToday: true },
    { num: 12, isCurrent: true, isSelected: false, isToday: false },
    { num: 13, isCurrent: true, isSelected: false, isToday: false },
    { num: 14, isCurrent: true, isSelected: false, isToday: false },
    // 3行目: 11/15 ~ 11/21
    { num: 15, isCurrent: true, isSelected: false, isToday: false },
    { num: 16, isCurrent: true, isSelected: false, isToday: false },
    { num: 17, isCurrent: true, isSelected: false, isToday: false },
    { num: 18, isCurrent: true, isSelected: false, isToday: false },
    { num: 19, isCurrent: true, isSelected: false, isToday: false },
    { num: 20, isCurrent: true, isSelected: false, isToday: false },
    { num: 21, isCurrent: true, isSelected: false, isToday: false },
    // 4行目: 11/22 ~ 11/28
    { num: 22, isCurrent: true, isSelected: false, isToday: false },
    { num: 23, isCurrent: true, isSelected: false, isToday: false },
    { num: 24, isCurrent: true, isSelected: false, isToday: false },
    { num: 25, isCurrent: true, isSelected: false, isToday: false },
    { num: 26, isCurrent: true, isSelected: false, isToday: false },
    { num: 27, isCurrent: true, isSelected: false, isToday: false },
    { num: 28, isCurrent: true, isSelected: false, isToday: false },
    // 5行目: 11/29 ~ 12/5
    { num: 29, isCurrent: true, isSelected: false, isToday: false },
    { num: 30, isCurrent: true, isSelected: false, isToday: false },
    { num: 1, isCurrent: false, isSelected: false, isToday: false },
    { num: 2, isCurrent: false, isSelected: false, isToday: false },
    { num: 3, isCurrent: false, isSelected: false, isToday: false },
    { num: 4, isCurrent: false, isSelected: false, isToday: false },
    { num: 5, isCurrent: false, isSelected: false, isToday: false },
    // 6行目: 12/6 ~ 12/12
    { num: 6, isCurrent: false, isSelected: false, isToday: false },
    { num: 7, isCurrent: false, isSelected: false, isToday: false },
    { num: 8, isCurrent: false, isSelected: false, isToday: false },
    { num: 9, isCurrent: false, isSelected: false, isToday: false },
    { num: 10, isCurrent: false, isSelected: false, isToday: false },
    { num: 11, isCurrent: false, isSelected: false, isToday: false },
    { num: 12, isCurrent: false, isSelected: false, isToday: false },
  ];

  const weekDayNames = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#f8fafd] text-[#3c4043] font-sans antialiased">
      {/* ブラウザ風タイトルバー（画像の「空のWebサイト」を忠実に再現） */}
      <div className="bg-[#202124] text-[#e8eaed] text-xs px-3 py-1 flex items-center select-none shrink-0 border-b border-[#3c4043]/40">
        <span className="font-medium tracking-wide">空のWebサイト</span>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* サイドバー（開いているとき表示） */}
        {isSidebarOpen && (
          <aside className="w-[256px] min-w-[256px] bg-[#f8fafd] flex flex-col pt-3 px-3 z-30 select-none border-r border-gray-200/60 transition-all duration-200">
            {/* サイドバー最上部: 閉じる✕ボタン */}
            <div className="flex items-center h-10 mb-2 pl-1">
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-700"
                title="メニューを閉じる"
              >
                <X size={26} strokeWidth={1.8} />
              </button>
            </div>

            {/* + 作成 ▾ ボタン */}
            <div className="mb-5 pl-1">
              <button className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white border border-gray-200/70 shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] hover:shadow-[0_2px_6px_2px_rgba(60,64,67,0.3),0_6px_10px_4px_rgba(60,64,67,0.15)] transition-shadow">
                <Plus size={20} className="text-[#3c4043]" strokeWidth={2.4} />
                <span className="text-sm font-medium text-gray-700">作成</span>
                <ChevronDown size={14} className="text-gray-500 ml-0.5" />
              </button>
            </div>

            {/* ミニカレンダー */}
            <div className="px-1">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-sm font-medium text-gray-700">2026年 11月</span>
                <div className="flex items-center space-x-0.5 text-gray-600">
                  <button className="p-1 rounded-full hover:bg-gray-200 transition-colors">
                    <ChevronLeft size={16} />
                  </button>
                  <button className="p-1 rounded-full hover:bg-gray-200 transition-colors">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* ミニカレンダー 曜日ヘッダー */}
              <div className="grid grid-cols-7 text-center mb-1 text-[11px] font-medium text-gray-500">
                {weekDayNames.map((day, idx) => (
                  <div key={idx} className="py-0.5">
                    {day}
                  </div>
                ))}
              </div>

              {/* ミニカレンダー 日付マス */}
              <div className="grid grid-cols-7 text-center text-xs">
                {miniCalendarDays.map((d, idx) => (
                  <button
                    key={idx}
                    className={`h-7 w-7 mx-auto my-0.5 rounded-full flex items-center justify-center transition-colors text-[11px] ${
                      d.isToday
                        ? 'bg-[#1a73e8] text-white font-medium shadow-xs'
                        : d.isSelected
                        ? 'bg-[#d2e3fc] text-[#174ea6] font-medium'
                        : d.isCurrent
                        ? 'text-gray-800 hover:bg-gray-200'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    {d.num}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* メインカレンダー領域 */}
        <div className="flex-1 flex flex-col h-full overflow-hidden p-3 pl-3">
          {/* 上部ヘッダー */}
          <header className="flex items-center justify-between h-14 px-2 select-none mb-1">
            {/* 左側: ハンバーガーメニュー / ナビゲーション */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* サイドバーが閉じている時に表示される三本線メニューボタン */}
              {!isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="flex flex-col items-center justify-center w-12 h-12 rounded-full hover:bg-gray-200 transition-colors text-gray-700 mr-1"
                  title="メニューを開く"
                >
                  <Menu size={22} strokeWidth={2} />
                  <span className="text-[10px] leading-tight font-normal text-gray-700 -mt-0.5">メニュー</span>
                </button>
              )}

              {/* 「今日」ボタン */}
              <button className="px-4 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                今日
              </button>

              {/* 前月・次月ボタン */}
              <div className="flex items-center space-x-1">
                <button className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors">
                  <ChevronLeft size={18} />
                </button>
                <button className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors">
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* 年月表示 */}
              <h1 className="text-xl font-medium text-gray-800 ml-2 tracking-tight">
                2026年 11月
              </h1>
            </div>

            {/* 右側: 検索・ヘルプ・設定・表示切替 */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors" title="検索">
                <Search size={20} />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors" title="サポート">
                <HelpCircle size={20} />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors" title="設定">
                <Settings size={20} />
              </button>

              {/* ビュー切替「月 ▾」 */}
              <button className="flex items-center space-x-1.5 px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors ml-1">
                <span>月</span>
                <ChevronDown size={14} className="text-gray-500" />
              </button>
            </div>
          </header>

          {/* カレンダー本体（外枠コンテナ: 角丸・白背景・薄いボーダー） */}
          <main className="flex-1 flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
            {/* 曜日ヘッダー */}
            <div className="grid grid-cols-7 border-b border-gray-200 text-center py-2 text-xs font-medium text-gray-500 bg-white">
              {weekDayNames.map((day, idx) => (
                <div key={idx} className="flex justify-center">
                  <span>{day}</span>
                </div>
              ))}
            </div>

            {/* カレンダーグリッド (5行×7列) */}
            <div className="flex-1 grid grid-cols-7 grid-rows-5 bg-white">
              {calendarDays.map((day, idx) => {
                const isColRightBorder = (idx + 1) % 7 !== 0;
                const isRowBottomBorder = idx < 28;

                return (
                  <div
                    key={day.id}
                    className={`flex flex-col p-1.5 relative group hover:bg-gray-50/40 transition-colors ${
                      isColRightBorder ? 'border-r border-gray-200' : ''
                    } ${isRowBottomBorder ? 'border-b border-gray-200' : ''}`}
                  >
                    {/* 日付表示（上部中央配置） */}
                    <div className="flex justify-center items-center h-7 mb-1">
                      {day.isToday ? (
                        <div className="w-6 h-6 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-xs font-medium">
                          {day.display}
                        </div>
                      ) : (
                        <span
                          className={`text-xs ${
                            day.isCurrentMonth
                              ? 'text-gray-800'
                              : 'text-gray-400 font-light'
                          }`}
                        >
                          {day.display}
                        </span>
                      )}
                    </div>

                    {/* イベントタグ（緑色のバッジ） */}
                    {day.event && (
                      <div className="mt-0.5 px-0.5">
                        <div className="bg-[#137333] hover:bg-[#0d5926] text-white text-[11px] leading-tight px-1.5 py-0.5 rounded font-normal truncate shadow-xs transition-colors cursor-pointer">
                          {day.event}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
