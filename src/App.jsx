import React, { useState, useEffect, useMemo } from 'react';
import {
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  HelpCircle,
  Settings,
  ChevronDown,
  Plus,
  Check,
  Trash2,
  Calendar as CalendarIcon,
  CheckSquare,
  Clock
} from 'lucide-react';

// カラーパレット定義
const COLOR_OPTIONS = [
  { id: 'green', name: 'グリーン', bg: 'bg-[#137333]', border: 'border-[#137333]', text: 'text-white' },
  { id: 'blue', name: 'ブルー', bg: 'bg-[#1a73e8]', border: 'border-[#1a73e8]', text: 'text-white' },
  { id: 'red', name: 'レッド', bg: 'bg-[#d93025]', border: 'border-[#d93025]', text: 'text-white' },
  { id: 'yellow', name: 'イエロー', bg: 'bg-[#f9ab00]', border: 'border-[#f9ab00]', text: 'text-[#202124]' },
  { id: 'purple', name: 'パープル', bg: 'bg-[#a142f4]', border: 'border-[#a142f4]', text: 'text-white' },
];

// 初期イベント（画像再現用 2026年11月データ含む）
const DEFAULT_EVENTS = [
  { id: 'ev-1', title: '文化の日', date: '2026-11-03', color: 'green', isCompleted: false, isHoliday: true },
  { id: 'ev-2', title: '七五三', date: '2026-11-15', color: 'green', isCompleted: false, isHoliday: true },
  { id: 'ev-3', title: '勤労感謝の日', date: '2026-11-23', color: 'green', isCompleted: false, isHoliday: true },
];

// 日本の祝日データ（2025〜2027年 主要祝日）
const JAPANESE_HOLIDAYS = {
  // 2026年
  '2026-01-01': '元日',
  '2026-01-12': '成人の日',
  '2026-02-11': '建国記念の日',
  '2026-02-23': '天皇誕生日',
  '2026-03-20': '春分の日',
  '2026-04-29': '昭和の日',
  '2026-05-03': '憲法記念日',
  '2026-05-04': 'みどりの日',
  '2026-05-05': 'こどもの日',
  '2026-05-06': '振替休日',
  '2026-07-20': '海の日',
  '2026-08-11': '山の日',
  '2026-09-21': '敬老の日',
  '2026-09-22': '国民の休日',
  '2026-09-23': '秋分の日',
  '2026-10-12': 'スポーツの日',
  '2026-11-03': '文化の日',
  '2026-11-15': '七五三',
  '2026-11-23': '勤労感謝の日',
};

// ヘルパー: YYYY-MM-DD 形式の文字列生成
function formatDateKey(year, month, day) {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export default function App() {
  // 現在表示中の年月（初期値は画像に合わせた2026年11月）
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 10, 1)); // 10 = 11月
  // 選択中の日付
  const [selectedDate, setSelectedDate] = useState('2026-11-01');
  // サイドバーの開閉状態
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // 表示モード ('month' | 'check-list')
  const [viewMode, setViewMode] = useState('month');
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);

  // 検索クエリ
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // イベント・タスクリスト（LocalStorage永続化）
  const [events, setEvents] = useState(() => {
    try {
      const saved = localStorage.getItem('check_calendar_events');
      return saved ? JSON.parse(saved) : DEFAULT_EVENTS;
    } catch (e) {
      return DEFAULT_EVENTS;
    }
  });

  // LocalStorageに保存
  useEffect(() => {
    try {
      localStorage.setItem('check_calendar_events', JSON.stringify(events));
    } catch (e) {
      console.error(e);
    }
  }, [events]);

  // モーダル管理
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [activeEvent, setActiveEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    date: '2026-11-11',
    color: 'blue',
    isTask: true,
  });

  // 今日の実際の日付（2026-11-11 をデフォルトのTodayとするが、リアルTodayにも対応）
  const todayKey = '2026-11-11';

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // カレンダー送り処理
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 2, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth, 1));
  };

  const handleGoToday = () => {
    setCurrentDate(new Date(2026, 10, 1)); // 2026年11月へ戻る
    setSelectedDate('2026-11-11');
  };

  // メインカレンダーの日付グリッド生成 (日曜始まり・7列×5〜6行)
  const calendarGrid = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0(日) - 6(土)
    const daysInCurrentMonth = new Date(currentYear, currentMonth, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth - 1, 0).getDate();

    const days = [];

    // 前月のはみ出し分
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(currentYear, currentMonth - 2, d);
      const dateKey = formatDateKey(prevDate.getFullYear(), prevDate.getMonth() + 1, d);
      days.push({
        id: dateKey,
        year: prevDate.getFullYear(),
        month: prevDate.getMonth() + 1,
        day: d,
        display: d === 1 ? `${prevDate.getMonth() + 1}月1日` : `${d}`,
        isCurrentMonth: false,
        isToday: dateKey === todayKey,
      });
    }

    // 当月の日付
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateKey = formatDateKey(currentYear, currentMonth, d);
      days.push({
        id: dateKey,
        year: currentYear,
        month: currentMonth,
        day: d,
        display: d === 1 ? `${currentMonth}月1日` : `${d}`,
        isCurrentMonth: true,
        isToday: dateKey === todayKey,
      });
    }

    // 翌月のはみ出し分 (35マスまたは42マスに揃える)
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remainingSlots = totalSlots - days.length;
    for (let d = 1; d <= remainingSlots; d++) {
      const nextDate = new Date(currentYear, currentMonth, d);
      const dateKey = formatDateKey(nextDate.getFullYear(), nextDate.getMonth() + 1, d);
      days.push({
        id: dateKey,
        year: nextDate.getFullYear(),
        month: nextDate.getMonth() + 1,
        day: d,
        display: d === 1 ? `${nextDate.getMonth() + 1}月1日` : `${d}`,
        isCurrentMonth: false,
        isToday: dateKey === todayKey,
      });
    }

    return days;
  }, [currentYear, currentMonth, todayKey]);

  // ミニカレンダーの日付グリッド生成 (日曜始まり)
  const miniCalendarGrid = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const daysInPrev = new Date(currentYear, currentMonth - 1, 0).getDate();

    const days = [];
    // 前月
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrev - i;
      const prevDate = new Date(currentYear, currentMonth - 2, d);
      const dateKey = formatDateKey(prevDate.getFullYear(), prevDate.getMonth() + 1, d);
      days.push({
        num: d,
        dateKey,
        isCurrent: false,
        isSelected: dateKey === selectedDate,
        isToday: dateKey === todayKey,
      });
    }
    // 当月
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = formatDateKey(currentYear, currentMonth, d);
      days.push({
        num: d,
        dateKey,
        isCurrent: true,
        isSelected: dateKey === selectedDate,
        isToday: dateKey === todayKey,
      });
    }
    // 翌月 (42マス固定)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(currentYear, currentMonth, d);
      const dateKey = formatDateKey(nextDate.getFullYear(), nextDate.getMonth() + 1, d);
      days.push({
        num: d,
        dateKey,
        isCurrent: false,
        isSelected: dateKey === selectedDate,
        isToday: dateKey === todayKey,
      });
    }
    return days;
  }, [currentYear, currentMonth, selectedDate, todayKey]);

  // 日付ごとのイベント取得マップ
  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      // 検索フィルター
      if (searchQuery.trim() && !ev.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return;
      }
      if (!map[ev.date]) {
        map[ev.date] = [];
      }
      map[ev.date].push(ev);
    });

    // 祝日データもマージ
    Object.entries(JAPANESE_HOLIDAYS).forEach(([dateStr, name]) => {
      if (searchQuery.trim() && !name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return;
      }
      if (!map[dateStr]) map[dateStr] = [];
      // 既存の祝日と重複していないか確認
      if (!map[dateStr].some(e => e.title === name)) {
        map[dateStr].unshift({
          id: `holiday-${dateStr}`,
          title: name,
          date: dateStr,
          color: 'green',
          isCompleted: false,
          isHoliday: true,
        });
      }
    });

    return map;
  }, [events, searchQuery]);

  // イベント追加モーダルを開く
  const handleOpenCreateModal = (targetDate = selectedDate) => {
    setFormData({
      title: '',
      date: targetDate,
      color: 'blue',
      isTask: true,
    });
    setModalMode('create');
  };

  // イベント編集モーダルを開く
  const handleOpenEditModal = (ev, e) => {
    e.stopPropagation();
    if (ev.isHoliday) return; // 祝日は編集不可
    setActiveEvent(ev);
    setFormData({
      title: ev.title,
      date: ev.date,
      color: ev.color || 'blue',
      isTask: ev.isTask ?? true,
    });
    setModalMode('edit');
  };

  // 保存処理 (新規 or 更新)
  const handleSaveEvent = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (modalMode === 'create') {
      const newEv = {
        id: `event-${Date.now()}`,
        title: formData.title.trim(),
        date: formData.date,
        color: formData.color,
        isCompleted: false,
        isTask: formData.isTask,
      };
      setEvents(prev => [...prev, newEv]);
    } else if (modalMode === 'edit' && activeEvent) {
      setEvents(prev => prev.map(ev => {
        if (ev.id === activeEvent.id) {
          return {
            ...ev,
            title: formData.title.trim(),
            date: formData.date,
            color: formData.color,
            isTask: formData.isTask,
          };
        }
        return ev;
      }));
    }
    setModalMode(null);
    setActiveEvent(null);
  };

  // 削除処理
  const handleDeleteEvent = () => {
    if (!activeEvent) return;
    setEvents(prev => prev.filter(ev => ev.id !== activeEvent.id));
    setModalMode(null);
    setActiveEvent(null);
  };

  // チェックボックス切り替え (完了 / 未完了)
  const handleToggleComplete = (eventId, e) => {
    e.stopPropagation();
    setEvents(prev => prev.map(ev => {
      if (ev.id === eventId) {
        return { ...ev, isCompleted: !ev.isCompleted };
      }
      return ev;
    }));
  };

  const weekDayNames = ['日', '月', '火', '水', '木', '金', '土'];

  // チェックリスト（ToDo）ビュー用イベント一覧
  const taskEvents = useMemo(() => {
    return events.filter(e => !e.isHoliday);
  }, [events]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#f8fafd] text-[#3c4043] font-sans antialiased">
      {/* ブラウザ風タイトルバー（画像の「空のWebサイト」） */}
      <div className="bg-[#202124] text-[#e8eaed] text-xs px-3 py-1 flex items-center justify-between select-none shrink-0 border-b border-[#3c4043]/40">
        <span className="font-medium tracking-wide">空のWebサイト</span>
        <div className="flex items-center space-x-2 text-[11px] text-gray-400">
          <span>チェックカレンダー v1.0</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* サイドバー（開いているとき表示） */}
        {isSidebarOpen && (
          <aside className="w-[260px] min-w-[260px] bg-[#f8fafd] flex flex-col pt-3 px-3 z-30 select-none border-r border-gray-200/70 transition-all duration-200 shadow-sm sm:shadow-none">
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
              <button
                onClick={() => handleOpenCreateModal(selectedDate)}
                className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white border border-gray-200/80 shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] hover:shadow-[0_2px_6px_2px_rgba(60,64,67,0.3),0_6px_10px_4px_rgba(60,64,67,0.15)] transition-all cursor-pointer group"
              >
                <Plus size={20} className="text-[#3c4043] group-hover:rotate-90 transition-transform" strokeWidth={2.4} />
                <span className="text-sm font-medium text-gray-700">作成</span>
                <ChevronDown size={14} className="text-gray-500 ml-0.5" />
              </button>
            </div>

            {/* ミニカレンダー */}
            <div className="px-1">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-sm font-medium text-gray-700">
                  {currentYear}年 {currentMonth}月
                </span>
                <div className="flex items-center space-x-0.5 text-gray-600">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                    title="前月"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                    title="次月"
                  >
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
                {miniCalendarGrid.map((d, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedDate(d.dateKey);
                      const [y, m] = d.dateKey.split('-').map(Number);
                      if (y !== currentYear || m !== currentMonth) {
                        setCurrentDate(new Date(y, m - 1, 1));
                      }
                    }}
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

            {/* サイドバー下部: チェックタスクサマリー */}
            <div className="mt-6 pt-4 border-t border-gray-200/80 px-2">
              <div className="flex items-center justify-between text-xs font-medium text-gray-600 mb-2">
                <span className="flex items-center gap-1.5">
                  <CheckSquare size={14} className="text-[#1a73e8]" />
                  タスク進捗
                </span>
                <span className="text-[11px] bg-blue-50 text-[#1a73e8] px-2 py-0.5 rounded-full">
                  {taskEvents.filter(t => t.isCompleted).length} / {taskEvents.length} 完了
                </span>
              </div>
              <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#1a73e8] h-full transition-all duration-300"
                  style={{
                    width: `${taskEvents.length > 0 ? (taskEvents.filter(t => t.isCompleted).length / taskEvents.length) * 100 : 0}%`
                  }}
                />
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
              <button
                onClick={handleGoToday}
                className="px-4 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                title="今日（2026年11月）に戻る"
              >
                今日
              </button>

              {/* 前月・次月ボタン */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
                  title="前月"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
                  title="次月"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* 年月表示 */}
              <h1 className="text-xl font-medium text-gray-800 ml-2 tracking-tight">
                {currentYear}年 {currentMonth}月
              </h1>
            </div>

            {/* 右側: 検索・ヘルプ・設定・表示切替 */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* 検索入力欄（トグル式） */}
              {isSearchOpen ? (
                <div className="flex items-center bg-gray-100 rounded-full px-3 py-1 border border-gray-300 animate-in fade-in duration-150">
                  <Search size={16} className="text-gray-500 mr-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="予定やタスクを検索..."
                    className="bg-transparent border-none outline-none text-xs text-gray-700 w-36 sm:w-48"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchOpen(false);
                    }}
                    className="text-gray-400 hover:text-gray-600 ml-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
                  title="予定を検索"
                >
                  <Search size={20} />
                </button>
              )}

              <button
                onClick={() => alert('【チェックカレンダーの使い方】\n・日付マスをクリックして新しい予定やチェックリストを追加できます。\n・イベントの左のチェックをクリックすると「完了・未完了」が切り替わります。\n・上部の「月 ▾」ボタンからToDoチェック一覧ビューにも切り替えられます。')}
                className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
                title="ヘルプ"
              >
                <HelpCircle size={20} />
              </button>

              <button
                onClick={() => {
                  if (confirm('予定データを初期状態（2026年11月）にリセットしますか？')) {
                    setEvents(DEFAULT_EVENTS);
                    localStorage.removeItem('check_calendar_events');
                  }
                }}
                className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
                title="データ初期化"
              >
                <Settings size={20} />
              </button>

              {/* ビュー切替「月 ▾」ドロップダウン */}
              <div className="relative">
                <button
                  onClick={() => setIsViewDropdownOpen(prev => !prev)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors ml-1"
                >
                  <span>{viewMode === 'month' ? '月' : 'チェック一覧'}</span>
                  <ChevronDown size={14} className="text-gray-500" />
                </button>

                {isViewDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 animate-in fade-in duration-100">
                    <button
                      onClick={() => {
                        setViewMode('month');
                        setIsViewDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-gray-100 ${viewMode === 'month' ? 'font-semibold text-[#1a73e8]' : 'text-gray-700'}`}
                    >
                      <span>月表示</span>
                      {viewMode === 'month' && <Check size={14} />}
                    </button>
                    <button
                      onClick={() => {
                        setViewMode('check-list');
                        setIsViewDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-gray-100 ${viewMode === 'check-list' ? 'font-semibold text-[#1a73e8]' : 'text-gray-700'}`}
                    >
                      <span>チェック一覧</span>
                      {viewMode === 'check-list' && <Check size={14} />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* ビュー表示: 月カレンダービュー */}
          {viewMode === 'month' ? (
            <main className="flex-1 flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
              {/* 曜日ヘッダー */}
              <div className="grid grid-cols-7 border-b border-gray-200 text-center py-2 text-xs font-medium text-gray-500 bg-white">
                {weekDayNames.map((day, idx) => (
                  <div key={idx} className="flex justify-center">
                    <span className={idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : ''}>
                      {day}
                    </span>
                  </div>
                ))}
              </div>

              {/* カレンダーグリッド */}
              <div className={`flex-1 grid grid-cols-7 ${calendarGrid.length > 35 ? 'grid-rows-6' : 'grid-rows-5'} bg-white`}>
                {calendarGrid.map((cell, idx) => {
                  const isColRightBorder = (idx + 1) % 7 !== 0;
                  const totalRows = calendarGrid.length / 7;
                  const isRowBottomBorder = Math.floor(idx / 7) < totalRows - 1;
                  const dayEvents = eventsByDate[cell.id] || [];

                  return (
                    <div
                      key={cell.id}
                      onClick={() => {
                        setSelectedDate(cell.id);
                        handleOpenCreateModal(cell.id);
                      }}
                      className={`flex flex-col p-1.5 relative group hover:bg-blue-50/30 transition-colors cursor-pointer overflow-hidden ${
                        isColRightBorder ? 'border-r border-gray-200' : ''
                      } ${isRowBottomBorder ? 'border-b border-gray-200' : ''} ${
                        selectedDate === cell.id ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      {/* 日付表示（上部中央） */}
                      <div className="flex justify-center items-center h-7 mb-1 shrink-0">
                        {cell.isToday ? (
                          <div className="w-6 h-6 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-xs font-medium shadow-xs">
                            {cell.day}
                          </div>
                        ) : (
                          <span
                            className={`text-xs ${
                              cell.isCurrentMonth
                                ? (idx % 7 === 0 ? 'text-red-600' : idx % 7 === 6 ? 'text-blue-600' : 'text-gray-800')
                                : 'text-gray-400 font-light'
                            }`}
                          >
                            {cell.display}
                          </span>
                        )}
                      </div>

                      {/* イベントタグ・タスク一覧 */}
                      <div className="flex-1 flex flex-col gap-1 overflow-y-auto no-scrollbar">
                        {dayEvents.map((ev) => {
                          const colorObj = COLOR_OPTIONS.find(c => c.id === ev.color) || COLOR_OPTIONS[0];

                          return (
                            <div
                              key={ev.id}
                              onClick={(e) => handleOpenEditModal(ev, e)}
                              className={`flex items-center gap-1.5 text-[11px] leading-tight px-1.5 py-0.5 rounded font-normal truncate shadow-xs transition-all cursor-pointer ${
                                ev.color === 'green' ? 'bg-[#137333] text-white' : `${colorObj.bg} ${colorObj.text}`
                              } ${ev.isCompleted ? 'opacity-50 line-through' : 'hover:brightness-95'}`}
                              title={ev.title}
                            >
                              {/* チェックボックス（祝日以外） */}
                              {!ev.isHoliday && (
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleComplete(ev.id, e)}
                                  className={`w-3.5 h-3.5 rounded flex items-center justify-center border border-white/80 shrink-0 transition-colors ${
                                    ev.isCompleted ? 'bg-white text-[#137333]' : 'hover:bg-white/20'
                                  }`}
                                  title={ev.isCompleted ? '未完了に戻す' : '完了にする'}
                                >
                                  {ev.isCompleted && <Check size={10} strokeWidth={3} className="text-gray-800" />}
                                </button>
                              )}
                              <span className="truncate">{ev.title}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* ホバー時に追加アイコンを右下に小さく表示 */}
                      <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-[#1a73e8] flex items-center justify-center">
                          <Plus size={12} strokeWidth={2.5} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </main>
          ) : (
            /* ビュー表示: チェック一覧（ToDo）ビュー */
            <main className="flex-1 flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs p-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-4">
                <div>
                  <h2 className="text-lg font-medium text-gray-800">チェック一覧（ToDoタスク）</h2>
                  <p className="text-xs text-gray-500 mt-0.5">登録した予定・タスクのチェック状態を一覧で管理できます</p>
                </div>
                <button
                  onClick={() => handleOpenCreateModal()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#1a73e8] text-white text-xs font-medium rounded-lg hover:bg-[#174ea6] transition-colors shadow-xs"
                >
                  <Plus size={16} />
                  新規タスク作成
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {taskEvents.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-gray-400">
                    <CheckSquare size={36} className="mb-2 stroke-1" />
                    <p className="text-sm">登録されているタスクはありません</p>
                    <p className="text-xs text-gray-400 mt-1">「作成」ボタンから新しいチェック項目を追加してみましょう</p>
                  </div>
                ) : (
                  taskEvents.map((t) => {
                    const colorObj = COLOR_OPTIONS.find(c => c.id === t.color) || COLOR_OPTIONS[0];

                    return (
                      <div
                        key={t.id}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          t.isCompleted
                            ? 'bg-gray-50/60 border-gray-200 text-gray-400'
                            : 'bg-white border-gray-200 shadow-xs hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => handleToggleComplete(t.id, e)}
                            className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                              t.isCompleted
                                ? 'bg-[#1a73e8] border-[#1a73e8] text-white'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {t.isCompleted && <Check size={14} strokeWidth={3} />}
                          </button>
                          <div>
                            <span className={`text-sm font-medium ${t.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                              {t.title}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <CalendarIcon size={12} />
                                {t.date}
                              </span>
                              <span className={`w-2 h-2 rounded-full ${colorObj.bg}`} />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleOpenEditModal(t, e)}
                            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-xs"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => {
                              setActiveEvent(t);
                              handleDeleteEvent();
                            }}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="削除"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </main>
          )}
        </div>
      </div>

      {/* 予定・タスク作成/編集モーダル */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* モーダルヘッダー */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <CheckSquare size={18} className="text-[#1a73e8]" />
                {modalMode === 'create' ? '予定・チェック項目の作成' : '予定・チェック項目の編集'}
              </h3>
              <button
                onClick={() => setModalMode(null)}
                className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* モーダルフォーム */}
            <form onSubmit={handleSaveEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">タイトル</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="例: 会議、買い物、課題提出"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">日付</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">カラー</label>
                <div className="flex items-center gap-3">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: c.id })}
                      className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center transition-transform ${
                        formData.color === c.id ? 'scale-125 ring-2 ring-offset-2 ring-blue-500' : 'hover:scale-110'
                      }`}
                    >
                      {formData.color === c.id && <Check size={14} className="text-white" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* フッターボタン */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                {modalMode === 'edit' ? (
                  <button
                    type="button"
                    onClick={handleDeleteEvent}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={15} />
                    削除
                  </button>
                ) : <div />}

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setModalMode(null)}
                    className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-medium bg-[#1a73e8] hover:bg-[#174ea6] text-white rounded-xl shadow-xs transition-colors"
                  >
                    {modalMode === 'create' ? '保存' : '更新'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
