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
  Sparkles,
  Tag as TagIcon,
  Clock,
  Filter
} from 'lucide-react';

// カラーパレット定義
const COLOR_OPTIONS = [
  { id: 'blue', name: 'ブルー', bg: 'bg-[#1a73e8]', border: 'border-[#1a73e8]', text: 'text-white' },
  { id: 'green', name: 'グリーン', bg: 'bg-[#137333]', border: 'border-[#137333]', text: 'text-white' },
  { id: 'red', name: 'レッド', bg: 'bg-[#d93025]', border: 'border-[#d93025]', text: 'text-white' },
  { id: 'yellow', name: 'イエロー', bg: 'bg-[#f9ab00]', border: 'border-[#f9ab00]', text: 'text-[#202124]' },
  { id: 'purple', name: 'パープル', bg: 'bg-[#a142f4]', border: 'border-[#a142f4]', text: 'text-white' },
];

// よく使うタグのプリセット
const PRESET_TAGS = [
  { id: '勉強', name: '勉強', icon: '📚', color: 'blue' },
  { id: '仕事', name: '仕事', icon: '💼', color: 'yellow' },
  { id: '運動', name: '運動', icon: '🏃', color: 'green' },
  { id: '読書', name: '読書', icon: '📖', color: 'purple' },
  { id: '趣味', name: '趣味', icon: '🎨', color: 'red' },
];

function formatDateKey(year, month, day) {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

// 期間の日数を計算
function calculateDaysCount(start, end) {
  if (!start || !end) return 1;
  const d1 = new Date(start);
  const d2 = new Date(end);
  const diffTime = d2.getTime() - d1.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 1;
}

// 日本の祝日完全計算
function getJapaneseHolidays(year) {
  const holidays = {};
  const add = (m, d, name) => {
    holidays[formatDateKey(year, m, d)] = name;
  };

  const getNthMonday = (m, nth) => {
    const firstDay = new Date(year, m - 1, 1).getDay();
    const firstMonday = (8 - firstDay) % 7 || 7;
    return firstMonday + (nth - 1) * 7;
  };

  const getVernalEquinoxDay = (y) => Math.floor(20.8431 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));
  const getAutumnEquinoxDay = (y) => Math.floor(23.2488 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));

  add(1, 1, '元日');
  add(1, getNthMonday(1, 2), '成人の日');
  add(2, 11, '建国記念の日');
  if (year >= 2020) add(2, 23, '天皇誕生日');
  add(3, getVernalEquinoxDay(year), '春分の日');
  add(4, 29, '昭和の日');
  add(5, 3, '憲法記念日');
  add(5, 4, 'みどりの日');
  add(5, 5, 'こどもの日');
  add(7, getNthMonday(7, 3), '海の日');
  if (year >= 2016) add(8, 11, '山の日');

  const keiro = getNthMonday(9, 3);
  const shubun = getAutumnEquinoxDay(year);
  add(9, keiro, '敬老の日');
  add(9, shubun, '秋分の日');
  if (shubun - keiro === 2) add(9, keiro + 1, '国民の休日');

  add(10, getNthMonday(10, 2), 'スポーツの日');
  add(11, 3, '文化の日');
  add(11, 15, '七五三');
  add(11, 23, '勤労感謝の日');

  // 振替休日
  const sortedDates = Object.keys(holidays).sort();
  const substitutes = {};
  sortedDates.forEach((dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (dateObj.getDay() === 0) {
      let subDate = new Date(y, m - 1, d + 1);
      while (true) {
        const subKey = formatDateKey(subDate.getFullYear(), subDate.getMonth() + 1, subDate.getDate());
        if (!holidays[subKey] && !substitutes[subKey]) {
          substitutes[subKey] = '振替休日';
          break;
        }
        subDate.setDate(subDate.getDate() + 1);
      }
    }
  });

  return { ...holidays, ...substitutes };
}

function generateMonthDays(year, month, selectedDate, todayKey) {
  const firstDay = new Date(year, month - 1, 1);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPrev = new Date(year, month - 1, 0).getDate();

  const days = [];
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = daysInPrev - i;
    const prevDate = new Date(year, month - 2, d);
    const dateKey = formatDateKey(prevDate.getFullYear(), prevDate.getMonth() + 1, d);
    days.push({
      num: d,
      dateKey,
      isCurrent: false,
      isSelected: dateKey === selectedDate,
      isToday: dateKey === todayKey,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = formatDateKey(year, month, d);
    days.push({
      num: d,
      dateKey,
      isCurrent: true,
      isSelected: dateKey === selectedDate,
      isToday: dateKey === todayKey,
    });
  }
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const nextDate = new Date(year, month, d);
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
}

export default function App() {
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 10, 1)); // 2026年11月
  const [selectedDate, setSelectedDate] = useState('2026-11-01');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 表示モード
  const [viewMode, setViewMode] = useState('month');
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);

  // 検索 & タグフィルター
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedFilterTag, setSelectedFilterTag] = useState('ALL'); // 'ALL' or tag name

  // ユーザー登録イベント（LocalStorage保存）
  const [userEvents, setUserEvents] = useState(() => {
    try {
      const saved = localStorage.getItem('check_calendar_events');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // 初期サンプル（勉強などのやることと期間）
    return [
      {
        id: 'sample-study-1',
        title: '英単語 ターゲット1900 暗記',
        startDate: '2026-11-04',
        endDate: '2026-11-08',
        tag: '勉強',
        color: 'blue',
        isCompleted: false,
        isHoliday: false,
      },
      {
        id: 'sample-study-2',
        title: '基本情報技術者試験 過去問演習',
        startDate: '2026-11-16',
        endDate: '2026-11-20',
        tag: '勉強',
        color: 'purple',
        isCompleted: false,
        isHoliday: false,
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('check_calendar_events', JSON.stringify(userEvents));
    } catch (e) {
      console.error(e);
    }
  }, [userEvents]);

  // モーダル状態
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [activeEvent, setActiveEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    startDate: '2026-11-11',
    endDate: '2026-11-11',
    tag: '勉強',
    color: 'blue',
    isHoliday: false,
  });

  const todayKey = '2026-11-11';
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // 当年の祝日
  const yearHolidays = useMemo(() => {
    return getJapaneseHolidays(currentYear);
  }, [currentYear]);

  // 全イベント
  const allEvents = useMemo(() => {
    const list = [...userEvents];

    Object.entries(yearHolidays).forEach(([dateStr, name]) => {
      if (!list.some(e => e.startDate === dateStr && e.title === name)) {
        list.push({
          id: `sys-holiday-${dateStr}`,
          title: name,
          startDate: dateStr,
          endDate: dateStr,
          tag: '祝日',
          color: 'green',
          isCompleted: false,
          isHoliday: true,
        });
      }
    });

    return list;
  }, [userEvents, yearHolidays]);

  // 日付ごとのイベント判定（期間 startDate <= date <= endDate に一致するもの）
  const getEventsForDate = (dateKey) => {
    return allEvents.filter((ev) => {
      // 検索フィルター
      if (searchQuery.trim() && !ev.title.toLowerCase().includes(searchQuery.toLowerCase()) && !ev.tag?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // タグフィルター
      if (selectedFilterTag !== 'ALL' && ev.tag !== selectedFilterTag) {
        return false;
      }
      const s = ev.startDate;
      const e = ev.endDate || ev.startDate;
      return s <= dateKey && dateKey <= e;
    });
  };

  // ナビゲーション
  const handlePrev = () => {
    if (viewMode === 'year') {
      setCurrentDate(new Date(currentYear - 1, currentMonth - 1, 1));
    } else {
      setCurrentDate(new Date(currentYear, currentMonth - 2, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'year') {
      setCurrentDate(new Date(currentYear + 1, currentMonth - 1, 1));
    } else {
      setCurrentDate(new Date(currentYear, currentMonth, 1));
    }
  };

  const handleGoToday = () => {
    setCurrentDate(new Date(2026, 10, 1));
    setSelectedDate('2026-11-11');
  };

  // メイン月グリッド
  const calendarGrid = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const startDayOfWeek = firstDayOfMonth.getDay();
    const daysInCurrentMonth = new Date(currentYear, currentMonth, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth - 1, 0).getDate();

    const days = [];
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
        isHoliday: !!yearHolidays[dateKey],
      });
    }

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
        isHoliday: !!yearHolidays[dateKey],
      });
    }

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
        isHoliday: !!yearHolidays[dateKey],
      });
    }

    return days;
  }, [currentYear, currentMonth, todayKey, yearHolidays]);

  // ミニカレンダー
  const miniCalendarGrid = useMemo(() => {
    return generateMonthDays(currentYear, currentMonth, selectedDate, todayKey);
  }, [currentYear, currentMonth, selectedDate, todayKey]);

  // 年表示データ
  const yearMonthsData = useMemo(() => {
    const months = [];
    for (let m = 1; m <= 12; m++) {
      months.push({
        monthNum: m,
        title: `${m}月`,
        days: generateMonthDays(currentYear, m, selectedDate, todayKey),
      });
    }
    return months;
  }, [currentYear, selectedDate, todayKey]);

  // 作成モーダルを開く
  const handleOpenCreateModal = (targetDate = selectedDate, defaultTag = '勉強') => {
    setFormData({
      title: '',
      startDate: targetDate,
      endDate: targetDate,
      tag: defaultTag,
      color: defaultTag === '勉強' ? 'blue' : 'green',
      isHoliday: defaultTag === '祝日',
    });
    setModalMode('create');
  };

  // 編集モーダルを開く
  const handleOpenEditModal = (ev, e) => {
    e.stopPropagation();
    setActiveEvent(ev);
    setFormData({
      title: ev.title,
      startDate: ev.startDate || ev.date,
      endDate: ev.endDate || ev.startDate || ev.date,
      tag: ev.tag || '勉強',
      color: ev.color || 'blue',
      isHoliday: !!ev.isHoliday,
    });
    setModalMode('edit');
  };

  // 保存処理
  const handleSaveEvent = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    // 終了日が開始日より前の場合は開始日と同じにする
    const cleanEndDate = formData.endDate < formData.startDate ? formData.startDate : formData.endDate;

    if (modalMode === 'create') {
      const newEv = {
        id: `event-${Date.now()}`,
        title: formData.title.trim(),
        startDate: formData.startDate,
        endDate: cleanEndDate,
        tag: formData.tag || '勉強',
        color: formData.color,
        isCompleted: false,
        isHoliday: formData.isHoliday,
      };
      setUserEvents(prev => [...prev, newEv]);
    } else if (modalMode === 'edit' && activeEvent) {
      if (activeEvent.id.startsWith('sys-holiday-')) {
        const newEv = {
          id: `custom-event-${Date.now()}`,
          title: formData.title.trim(),
          startDate: formData.startDate,
          endDate: cleanEndDate,
          tag: formData.tag,
          color: formData.color,
          isCompleted: false,
          isHoliday: formData.isHoliday,
        };
        setUserEvents(prev => [...prev, newEv]);
      } else {
        setUserEvents(prev => prev.map(ev => {
          if (ev.id === activeEvent.id) {
            return {
              ...ev,
              title: formData.title.trim(),
              startDate: formData.startDate,
              endDate: cleanEndDate,
              tag: formData.tag,
              color: formData.color,
              isHoliday: formData.isHoliday,
            };
          }
          return ev;
        }));
      }
    }
    setModalMode(null);
    setActiveEvent(null);
  };

  const handleDeleteEvent = () => {
    if (!activeEvent) return;
    setUserEvents(prev => prev.filter(ev => ev.id !== activeEvent.id));
    setModalMode(null);
    setActiveEvent(null);
  };

  const handleToggleComplete = (eventId, e) => {
    e.stopPropagation();
    setUserEvents(prev => prev.map(ev => {
      if (ev.id === eventId) {
        return { ...ev, isCompleted: !ev.isCompleted };
      }
      return ev;
    }));
  };

  const weekDayNames = ['日', '月', '火', '水', '木', '金', '土'];
  const taskEvents = useMemo(() => allEvents.filter(e => !e.isHoliday), [allEvents]);
  const holidayList = useMemo(() => {
    return Object.entries(yearHolidays)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, title]) => ({ date, title }));
  }, [yearHolidays]);

  // 利用可能なタグ一覧
  const availableTags = useMemo(() => {
    const set = new Set(['勉強', '仕事', '運動', '読書', '趣味']);
    userEvents.forEach(e => {
      if (e.tag && e.tag !== '祝日') set.add(e.tag);
    });
    return Array.from(set);
  }, [userEvents]);

  const currentViewLabel = viewMode === 'year' ? '年' : viewMode === 'month' ? '月' : viewMode === 'holidays' ? '祝日一覧' : 'チェック一覧';

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#f8fafd] text-[#3c4043] font-sans antialiased">
      {/* タイトルバー */}
      <div className="bg-[#202124] text-[#e8eaed] text-xs px-3 py-1 flex items-center justify-between select-none shrink-0 border-b border-[#3c4043]/40">
        <span className="font-medium tracking-wide">空のWebサイト</span>
        <div className="flex items-center space-x-2 text-[11px] text-gray-400">
          <span>チェックカレンダー - やること・勉強・期間管理</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* サイドバー */}
        {isSidebarOpen && (
          <aside className="w-[260px] min-w-[260px] bg-[#f8fafd] flex flex-col pt-3 px-3 z-30 select-none border-r border-gray-200/70 transition-all duration-200 shadow-sm sm:shadow-none">
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
            <div className="mb-3 pl-1">
              <button
                onClick={() => handleOpenCreateModal(selectedDate, '勉強')}
                className="w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-white border border-gray-200/80 shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] hover:shadow-[0_2px_6px_2px_rgba(60,64,67,0.3),0_6px_10px_4px_rgba(60,64,67,0.15)] transition-all cursor-pointer group"
              >
                <Plus size={20} className="text-[#3c4043] group-hover:rotate-90 transition-transform" strokeWidth={2.4} />
                <span className="text-sm font-medium text-gray-700">やること・勉強を追加</span>
                <ChevronDown size={14} className="text-gray-500 ml-auto" />
              </button>
            </div>

            {/* タグ別絞り込みフィルター */}
            <div className="mb-4 px-1">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <Filter size={12} />
                タグで絞り込み
              </span>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setSelectedFilterTag('ALL')}
                  className={`text-[11px] px-2.5 py-1 rounded-full transition-all ${
                    selectedFilterTag === 'ALL'
                      ? 'bg-[#1a73e8] text-white font-medium'
                      : 'bg-gray-200/70 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  すべて
                </button>
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedFilterTag(tag)}
                    className={`text-[11px] px-2.5 py-1 rounded-full transition-all flex items-center gap-1 ${
                      selectedFilterTag === tag
                        ? 'bg-[#1a73e8] text-white font-medium'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span>#{tag}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ミニカレンダー */}
            <div className="px-1">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-sm font-medium text-gray-700">
                  {currentYear}年 {currentMonth}月
                </span>
                <div className="flex items-center space-x-0.5 text-gray-600">
                  <button
                    onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 2, 1))}
                    className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                    title="前月"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date(currentYear, currentMonth, 1))}
                    className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                    title="次月"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 text-center mb-1 text-[11px] font-medium text-gray-500">
                {weekDayNames.map((day, idx) => (
                  <div key={idx} className="py-0.5">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 text-center text-xs">
                {miniCalendarGrid.map((d, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedDate(d.dateKey);
                      const [y, m] = d.dateKey.split('-').map(Number);
                      setCurrentDate(new Date(y, m - 1, 1));
                      if (viewMode === 'year') setViewMode('month');
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

            {/* 進捗バー */}
            <div className="mt-auto pt-3 pb-2 border-t border-gray-200/80 px-2">
              <div className="flex items-center justify-between text-xs font-medium text-gray-600 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <CheckSquare size={14} className="text-[#1a73e8]" />
                  やること達成率
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

        {/* メインエリア */}
        <div className="flex-1 flex flex-col h-full overflow-hidden p-3 pl-3">
          {/* ヘッダー */}
          <header className="flex items-center justify-between h-14 px-2 select-none mb-1">
            <div className="flex items-center space-x-2 sm:space-x-3">
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

              <button
                onClick={handleGoToday}
                className="px-4 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                title="今日（2026年11月）に戻る"
              >
                今日
              </button>

              <div className="flex items-center space-x-1">
                <button
                  onClick={handlePrev}
                  className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
                  title={viewMode === 'year' ? '前年' : '前月'}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={handleNext}
                  className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
                  title={viewMode === 'year' ? '次年' : '次月'}
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <h1 className="text-xl font-medium text-gray-800 ml-2 tracking-tight">
                {viewMode === 'year' ? `${currentYear}年` : `${currentYear}年 ${currentMonth}月`}
              </h1>

              {/* 選択中のタグフィルター表示バッジ */}
              {selectedFilterTag !== 'ALL' && (
                <div className="hidden sm:flex items-center gap-1.5 ml-2 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs text-[#1a73e8]">
                  <span>絞り込み: #{selectedFilterTag}</span>
                  <button onClick={() => setSelectedFilterTag('ALL')} className="hover:text-blue-800">
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2">
              {isSearchOpen ? (
                <div className="flex items-center bg-gray-100 rounded-full px-3 py-1 border border-gray-300 animate-in fade-in duration-150">
                  <Search size={16} className="text-gray-500 mr-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="やること・タグを検索..."
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
                  title="検索"
                >
                  <Search size={20} />
                </button>
              )}

              <button
                onClick={() => alert('【やること・勉強・期間機能の使い方】\n・「作成」ボタンまたはカレンダーのセルをクリックして、やること・タグ（#勉強など）・やる期間（開始日〜終了日）を登録できます。\n・複数日にわたるやることは帯状の期間バーとしてカレンダー上に連続表示されます。\n・タスクのチェックボックスで完了/未完了を切り替えられます。')}
                className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
                title="ヘルプ"
              >
                <HelpCircle size={20} />
              </button>

              <button
                onClick={() => {
                  if (confirm('登録したやることデータを初期化しますか？')) {
                    localStorage.removeItem('check_calendar_events');
                    window.location.reload();
                  }
                }}
                className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
                title="データ初期化"
              >
                <Settings size={20} />
              </button>

              {/* ビュー切替ドロップダウン */}
              <div className="relative">
                <button
                  onClick={() => setIsViewDropdownOpen(prev => !prev)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors ml-1"
                >
                  <span>{currentViewLabel}</span>
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
                        setViewMode('year');
                        setIsViewDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-gray-100 ${viewMode === 'year' ? 'font-semibold text-[#1a73e8]' : 'text-gray-700'}`}
                    >
                      <span>年表示</span>
                      {viewMode === 'year' && <Check size={14} />}
                    </button>
                    <button
                      onClick={() => {
                        setViewMode('holidays');
                        setIsViewDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-gray-100 ${viewMode === 'holidays' ? 'font-semibold text-[#1a73e8]' : 'text-gray-700'}`}
                    >
                      <span>祝日一覧</span>
                      {viewMode === 'holidays' && <Check size={14} />}
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

          {/* ビュー描画 */}
          {viewMode === 'month' ? (
            /* =================== 月表示 (Month View) =================== */
            <main className="flex-1 flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="grid grid-cols-7 border-b border-gray-200 text-center py-2 text-xs font-medium text-gray-500 bg-white">
                {weekDayNames.map((day, idx) => (
                  <div key={idx} className="flex justify-center">
                    <span className={idx === 0 ? 'text-red-500 font-semibold' : idx === 6 ? 'text-blue-500' : ''}>
                      {day}
                    </span>
                  </div>
                ))}
              </div>

              <div className={`flex-1 grid grid-cols-7 ${calendarGrid.length > 35 ? 'grid-rows-6' : 'grid-rows-5'} bg-white`}>
                {calendarGrid.map((cell, idx) => {
                  const isColRightBorder = (idx + 1) % 7 !== 0;
                  const totalRows = calendarGrid.length / 7;
                  const isRowBottomBorder = Math.floor(idx / 7) < totalRows - 1;
                  const dayEvents = getEventsForDate(cell.id);
                  const isSundayOrHoliday = (idx % 7 === 0) || cell.isHoliday;

                  return (
                    <div
                      key={cell.id}
                      onClick={() => {
                        setSelectedDate(cell.id);
                        handleOpenCreateModal(cell.id, '勉強');
                      }}
                      className={`flex flex-col p-1 relative group hover:bg-blue-50/20 transition-colors cursor-pointer overflow-hidden ${
                        isColRightBorder ? 'border-r border-gray-200' : ''
                      } ${isRowBottomBorder ? 'border-b border-gray-200' : ''} ${
                        selectedDate === cell.id ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      {/* 日付ヘッダー */}
                      <div className="flex justify-center items-center h-6 mb-1 shrink-0">
                        {cell.isToday ? (
                          <div className="w-6 h-6 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-xs font-medium shadow-xs">
                            {cell.day}
                          </div>
                        ) : (
                          <span
                            className={`text-xs ${
                              cell.isCurrentMonth
                                ? (isSundayOrHoliday ? 'text-red-600 font-medium' : idx % 7 === 6 ? 'text-blue-600' : 'text-gray-800')
                                : 'text-gray-400 font-light'
                            }`}
                          >
                            {cell.display}
                          </span>
                        )}
                      </div>

                      {/* やること・期間バー・イベント一覧 */}
                      <div className="flex-1 flex flex-col gap-1 overflow-y-auto no-scrollbar">
                        {dayEvents.map((ev) => {
                          const colorObj = COLOR_OPTIONS.find(c => c.id === ev.color) || COLOR_OPTIONS[0];
                          const isMultiDay = ev.startDate && ev.endDate && ev.startDate !== ev.endDate;
                          const isStartDay = cell.id === ev.startDate;
                          const isEndDay = cell.id === ev.endDate;

                          return (
                            <div
                              key={`${ev.id}-${cell.id}`}
                              onClick={(e) => handleOpenEditModal(ev, e)}
                              className={`flex items-center gap-1 text-[11px] leading-tight px-1.5 py-0.5 font-normal truncate shadow-xs transition-all cursor-pointer ${
                                ev.color === 'green' ? 'bg-[#137333] text-white hover:bg-[#0f5c29]' : `${colorObj.bg} ${colorObj.text}`
                              } ${
                                isMultiDay
                                  ? (isStartDay ? 'rounded-l-md mr-0' : isEndDay ? 'rounded-r-md ml-0' : 'rounded-none mx-0')
                                  : 'rounded'
                              } ${ev.isCompleted ? 'opacity-40 line-through' : 'hover:brightness-95'}`}
                              title={`${ev.title}${ev.tag ? ` [${ev.tag}]` : ''}${isMultiDay ? ` (${ev.startDate} 〜 ${ev.endDate})` : ''}`}
                            >
                              {/* チェックボタン */}
                              {!ev.isHoliday && (
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleComplete(ev.id, e)}
                                  className={`w-3.5 h-3.5 rounded flex items-center justify-center border border-white/80 shrink-0 transition-colors ${
                                    ev.isCompleted ? 'bg-white text-gray-800' : 'hover:bg-white/20'
                                  }`}
                                  title={ev.isCompleted ? '未完了に戻す' : '完了にする'}
                                >
                                  {ev.isCompleted && <Check size={10} strokeWidth={3} className="text-gray-800" />}
                                </button>
                              )}

                              {/* タグ表示 */}
                              {ev.tag && !ev.isHoliday && (
                                <span className="text-[9px] bg-black/20 px-1 py-0.2 rounded shrink-0 font-medium">
                                  #{ev.tag}
                                </span>
                              )}

                              <span className="truncate">{ev.title}</span>

                              {/* 複数日期間の初日に期間バッジ表示 */}
                              {isStartDay && isMultiDay && (
                                <span className="text-[9px] opacity-80 shrink-0 ml-auto font-mono">
                                  {calculateDaysCount(ev.startDate, ev.endDate)}日間
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* ホバー時の追加ボタン */}
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
          ) : viewMode === 'year' ? (
            /* =================== 年表示 =================== */
            <main className="flex-1 bg-white border border-gray-200 rounded-2xl overflow-y-auto p-4 sm:p-6 shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6 max-w-7xl mx-auto">
                {yearMonthsData.map((m) => (
                  <div key={m.monthNum} className="flex flex-col">
                    <div className="mb-2">
                      <button
                        onClick={() => {
                          setCurrentDate(new Date(currentYear, m.monthNum - 1, 1));
                          setViewMode('month');
                        }}
                        className="text-sm font-semibold text-gray-800 hover:text-[#1a73e8] transition-colors"
                      >
                        {m.title}
                      </button>
                    </div>

                    <div className="grid grid-cols-7 text-center mb-1 text-[11px] font-medium text-gray-500">
                      {weekDayNames.map((day, idx) => (
                        <div key={idx} className="py-0.5">
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 text-center text-xs">
                      {m.days.map((d, idx) => {
                        const isHol = !!yearHolidays[d.dateKey];
                        const isSun = (idx % 7 === 0);

                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              setSelectedDate(d.dateKey);
                              const [y, mon] = d.dateKey.split('-').map(Number);
                              setCurrentDate(new Date(y, mon - 1, 1));
                              setViewMode('month');
                            }}
                            className={`h-6 w-6 mx-auto my-0.5 rounded-full flex items-center justify-center transition-all text-[11px] ${
                              d.dateKey === todayKey
                                ? 'bg-[#1a73e8] text-white font-medium shadow-xs'
                                : d.dateKey === selectedDate
                                ? 'bg-[#d2e3fc] text-[#174ea6] font-medium'
                                : d.isCurrent
                                ? (isSun || isHol ? 'text-red-600 font-semibold hover:bg-red-50' : 'text-gray-800 hover:bg-gray-100')
                                : 'text-gray-300 hover:bg-gray-50'
                            }`}
                            title={d.dateKey}
                          >
                            {d.num}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </main>
          ) : viewMode === 'holidays' ? (
            /* =================== 祝日一覧ビュー =================== */
            <main className="flex-1 flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs p-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-4">
                <div>
                  <h2 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                    <Sparkles size={20} className="text-[#137333]" />
                    {currentYear}年の日本の祝日・振替休日一覧
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">国民の祝日法に基づき自動計算された年間祝日です</p>
                </div>
                <button
                  onClick={() => handleOpenCreateModal(selectedDate, '祝日')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#137333] text-white text-xs font-medium rounded-lg hover:bg-[#0f5c29] transition-colors shadow-xs"
                >
                  <Plus size={16} />
                  記念日・祝日を追加
                </button>
              </div>

              <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pr-1">
                {holidayList.map((h) => (
                  <div
                    key={h.date}
                    onClick={() => {
                      setSelectedDate(h.date);
                      const [y, m] = h.date.split('-').map(Number);
                      setCurrentDate(new Date(y, m - 1, 1));
                      setViewMode('month');
                    }}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-300 transition-all cursor-pointer"
                  >
                    <div>
                      <span className="text-sm font-semibold text-gray-800">{h.title}</span>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                        <CalendarIcon size={12} className="text-[#137333]" />
                        <span>{h.date}</span>
                      </div>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#137333] text-white font-medium">
                      祝日
                    </span>
                  </div>
                ))}
              </div>
            </main>
          ) : (
            /* =================== チェック一覧（ToDo・やること） =================== */
            <main className="flex-1 flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs p-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-4">
                <div>
                  <h2 className="text-lg font-medium text-gray-800">やること・勉強チェック一覧</h2>
                  <p className="text-xs text-gray-500 mt-0.5">登録したやることの期間と達成状況をまとめて管理できます</p>
                </div>
                <button
                  onClick={() => handleOpenCreateModal(selectedDate, '勉強')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#1a73e8] text-white text-xs font-medium rounded-lg hover:bg-[#174ea6] transition-colors shadow-xs"
                >
                  <Plus size={16} />
                  新規やること追加
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {taskEvents.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-gray-400">
                    <CheckSquare size={36} className="mb-2 stroke-1" />
                    <p className="text-sm">登録されているやることはありません</p>
                  </div>
                ) : (
                  taskEvents.map((t) => {
                    const colorObj = COLOR_OPTIONS.find(c => c.id === t.color) || COLOR_OPTIONS[0];
                    const isMulti = t.startDate !== t.endDate;
                    const days = calculateDaysCount(t.startDate, t.endDate);

                    return (
                      <div
                        key={t.id}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
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
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-semibold ${t.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                {t.title}
                              </span>
                              {t.tag && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-[#1a73e8] border border-blue-200 font-medium">
                                  #{t.tag}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock size={12} className="text-gray-400" />
                                <span>やる期間: {t.startDate} {isMulti ? `〜 ${t.endDate} (${days}日間)` : ''}</span>
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

      {/* やること・勉強・期間・タグ追加・編集モーダル */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <CheckSquare size={18} className="text-[#1a73e8]" />
                {modalMode === 'create' ? 'やること・勉強の追加' : 'やることの編集'}
              </h3>
              <button
                onClick={() => setModalMode(null)}
                className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-6 space-y-4">
              {/* やること（タイトル） */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  やること（内容） <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="例: 数学のワーク、英単語暗記、読書、資格試験対策"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent transition-all"
                  autoFocus
                />
              </div>

              {/* タグ選択 */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                  <TagIcon size={13} />
                  タグ（カテゴリー）
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {PRESET_TAGS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, tag: t.name, color: t.color })}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                        formData.tag === t.name
                          ? 'bg-blue-50 border-[#1a73e8] text-[#1a73e8] font-semibold'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span>{t.icon}</span>
                      <span>{t.name}</span>
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={formData.tag}
                  onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                  placeholder="または自由入力（例: プログラミング、宿題）"
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                />
              </div>

              {/* やる期間（開始日・終了日） */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Clock size={13} />
                    やる期間（期間指定）
                  </span>
                  <span className="text-[11px] text-[#1a73e8] font-medium font-mono">
                    {calculateDaysCount(formData.startDate, formData.endDate)}日間
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="block text-[11px] text-gray-500 mb-1">開始日</span>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => {
                        const newStart = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          startDate: newStart,
                          endDate: prev.endDate < newStart ? newStart : prev.endDate,
                        }));
                      }}
                      className="w-full px-2.5 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a73e8]"
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] text-gray-500 mb-1">終了日</span>
                    <input
                      type="date"
                      required
                      min={formData.startDate}
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-2.5 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a73e8]"
                    />
                  </div>
                </div>
              </div>

              {/* カラー選択 */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">タグカラー</label>
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

              {/* フッター */}
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
