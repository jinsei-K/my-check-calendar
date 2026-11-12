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
  Sparkles
} from 'lucide-react';

// カラーパレット定義
const COLOR_OPTIONS = [
  { id: 'green', name: '祝日・グリーン', bg: 'bg-[#137333]', border: 'border-[#137333]', text: 'text-white' },
  { id: 'blue', name: 'ブルー', bg: 'bg-[#1a73e8]', border: 'border-[#1a73e8]', text: 'text-white' },
  { id: 'red', name: 'レッド', bg: 'bg-[#d93025]', border: 'border-[#d93025]', text: 'text-white' },
  { id: 'yellow', name: 'イエロー', bg: 'bg-[#f9ab00]', border: 'border-[#f9ab00]', text: 'text-[#202124]' },
  { id: 'purple', name: 'パープル', bg: 'bg-[#a142f4]', border: 'border-[#a142f4]', text: 'text-white' },
];

function formatDateKey(year, month, day) {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

// 日本の祝日・振替休日・国民の休日・年中行事を動的に完全計算する関数
function getJapaneseHolidays(year) {
  const holidays = {};

  const add = (m, d, name) => {
    const key = formatDateKey(year, m, d);
    holidays[key] = name;
  };

  // 第N月曜日を求める (m: 1-12, nth: 1-5)
  const getNthMonday = (m, nth) => {
    const firstDay = new Date(year, m - 1, 1).getDay();
    const firstMonday = (8 - firstDay) % 7 || 7;
    return firstMonday + (nth - 1) * 7;
  };

  // 春分の日 (1980〜2099年の略算式)
  const getVernalEquinoxDay = (y) => {
    return Math.floor(20.8431 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));
  };

  // 秋分の日 (1980〜2099年の略算式)
  const getAutumnEquinoxDay = (y) => {
    return Math.floor(23.2488 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));
  };

  // 1月
  add(1, 1, '元日');
  add(1, getNthMonday(1, 2), '成人の日');

  // 2月
  add(2, 11, '建国記念の日');
  if (year >= 2020) {
    add(2, 23, '天皇誕生日');
  }

  // 3月
  add(3, getVernalEquinoxDay(year), '春分の日');

  // 4月
  add(4, 29, '昭和の日');

  // 5月
  add(5, 3, '憲法記念日');
  add(5, 4, 'みどりの日');
  add(5, 5, 'こどもの日');

  // 7月
  add(7, getNthMonday(7, 3), '海の日');

  // 8月
  if (year >= 2016) {
    add(8, 11, '山の日');
  }

  // 9月
  const keiroDay = getNthMonday(9, 3);
  add(9, keiroDay, '敬老の日');
  const shubunDay = getAutumnEquinoxDay(year);
  add(9, shubunDay, '秋分の日');

  // 国民の休日 (敬老の日と秋分の日に挟まれた日)
  if (shubunDay - keiroDay === 2) {
    add(9, keiroDay + 1, '国民の休日');
  }

  // 10月
  add(10, getNthMonday(10, 2), 'スポーツの日');

  // 11月
  add(11, 3, '文化の日');
  add(11, 15, '七五三'); // 画像に登場する年中行事
  add(11, 23, '勤労感謝の日');

  // 振替休日計算（祝日が日曜日の場合、その直後の国民の祝日でない平日を振替休日にする）
  const sortedDates = Object.keys(holidays).sort();
  const substitutes = {};

  sortedDates.forEach((dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (dateObj.getDay() === 0) { // 日曜日
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

// 42マスの月グリッド生成ヘルパー
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

  // 表示モード: 'month' | 'year' | 'check-list' | 'holidays'
  const [viewMode, setViewMode] = useState('month');
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // ユーザー登録イベント（LocalStorage）
  const [userEvents, setUserEvents] = useState(() => {
    try {
      const saved = localStorage.getItem('check_calendar_events');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('check_calendar_events', JSON.stringify(userEvents));
    } catch (e) {
      console.error(e);
    }
  }, [userEvents]);

  // モーダル
  const [modalMode, setModalMode] = useState(null);
  const [activeEvent, setActiveEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    date: '2026-11-11',
    color: 'blue',
    isHoliday: false,
  });

  const todayKey = '2026-11-11';
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // 当年の祝日データを自動算出
  const yearHolidays = useMemo(() => {
    return getJapaneseHolidays(currentYear);
  }, [currentYear]);

  // 全イベント（自動計算祝日 + ユーザー登録イベント）のマージ
  const allEvents = useMemo(() => {
    const list = [...userEvents];

    // 自動計算祝日を追加
    Object.entries(yearHolidays).forEach(([dateStr, name]) => {
      // ユーザーイベントと重複していなければ追加
      if (!list.some(e => e.date === dateStr && e.title === name)) {
        list.push({
          id: `sys-holiday-${dateStr}`,
          title: name,
          date: dateStr,
          color: 'green',
          isCompleted: false,
          isHoliday: true,
        });
      }
    });

    return list;
  }, [userEvents, yearHolidays]);

  // 日付ごとのイベント辞書
  const eventsByDate = useMemo(() => {
    const map = {};
    allEvents.forEach((ev) => {
      if (searchQuery.trim() && !ev.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return;
      }
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    });
    return map;
  }, [allEvents, searchQuery]);

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

  const handleOpenCreateModal = (targetDate = selectedDate, isHoliday = false) => {
    setFormData({
      title: '',
      date: targetDate,
      color: isHoliday ? 'green' : 'blue',
      isHoliday: isHoliday,
    });
    setModalMode('create');
  };

  const handleOpenEditModal = (ev, e) => {
    e.stopPropagation();
    setActiveEvent(ev);
    setFormData({
      title: ev.title,
      date: ev.date,
      color: ev.color || 'blue',
      isHoliday: !!ev.isHoliday,
    });
    setModalMode('edit');
  };

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
        isHoliday: formData.isHoliday,
      };
      setUserEvents(prev => [...prev, newEv]);
    } else if (modalMode === 'edit' && activeEvent) {
      if (activeEvent.id.startsWith('sys-holiday-')) {
        // システム祝日をカスタム編集する場合はユーザーイベントに登録
        const newEv = {
          id: `custom-holiday-${Date.now()}`,
          title: formData.title.trim(),
          date: formData.date,
          color: formData.color,
          isCompleted: false,
          isHoliday: true,
        };
        setUserEvents(prev => [...prev, newEv]);
      } else {
        setUserEvents(prev => prev.map(ev => {
          if (ev.id === activeEvent.id) {
            return {
              ...ev,
              title: formData.title.trim(),
              date: formData.date,
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

  const currentViewLabel = viewMode === 'year' ? '年' : viewMode === 'month' ? '月' : viewMode === 'holidays' ? '祝日一覧' : 'チェック一覧';

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#f8fafd] text-[#3c4043] font-sans antialiased">
      {/* ブラウザ風タイトルバー */}
      <div className="bg-[#202124] text-[#e8eaed] text-xs px-3 py-1 flex items-center justify-between select-none shrink-0 border-b border-[#3c4043]/40">
        <span className="font-medium tracking-wide">空のWebサイト</span>
        <div className="flex items-center space-x-2 text-[11px] text-gray-400">
          <span>チェックカレンダー</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* サイドバー */}
        {isSidebarOpen && (
          <aside className="w-[260px] min-w-[260px] bg-[#f8fafd] flex flex-col pt-3 px-3 z-30 select-none border-r border-gray-200/70 transition-all duration-200 shadow-sm sm:shadow-none">
            {/* 閉じる✕ボタン */}
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
            <div className="mb-4 pl-1 flex items-center gap-2">
              <button
                onClick={() => handleOpenCreateModal(selectedDate)}
                className="flex-1 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-white border border-gray-200/80 shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] hover:shadow-[0_2px_6px_2px_rgba(60,64,67,0.3),0_6px_10px_4px_rgba(60,64,67,0.15)] transition-all cursor-pointer group"
              >
                <Plus size={20} className="text-[#3c4043] group-hover:rotate-90 transition-transform" strokeWidth={2.4} />
                <span className="text-sm font-medium text-gray-700">作成</span>
                <ChevronDown size={14} className="text-gray-500 ml-auto" />
              </button>
            </div>

            {/* 祝日追加クイックボタン */}
            <div className="mb-4 px-1">
              <button
                onClick={() => handleOpenCreateModal(selectedDate, true)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[#137333] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
              >
                <Sparkles size={14} />
                <span>祝日・記念日を追加</span>
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
            <div className="mt-auto pt-4 pb-2 border-t border-gray-200/80 px-2">
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
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2">
              {isSearchOpen ? (
                <div className="flex items-center bg-gray-100 rounded-full px-3 py-1 border border-gray-300 animate-in fade-in duration-150">
                  <Search size={16} className="text-gray-500 mr-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="予定や祝日を検索..."
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
                  title="予定・祝日を検索"
                >
                  <Search size={20} />
                </button>
              )}

              <button
                onClick={() => alert(`【祝日機能について】\n・日本の国民の祝日（元日、成人の日、春分・秋分、GW、海・山・敬老、文化の日、勤労感謝の日など）および振替休日、国民の休日が年ごとに自動計算されます。\n・サイドバーの「祝日・記念日を追加」ボタンから、独自の祝日や記念日も追加できます。`)}
                className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
                title="ヘルプ"
              >
                <HelpCircle size={20} />
              </button>

              <button
                onClick={() => {
                  if (confirm('追加したカスタム予定を初期化しますか？（祝日は自動計算で常に表示されます）')) {
                    setUserEvents([]);
                    localStorage.removeItem('check_calendar_events');
                  }
                }}
                className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
                title="データ初期化"
              >
                <Settings size={20} />
              </button>

              {/* ドロップダウンメニュー */}
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
            /* =================== 月表示 =================== */
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
                  const dayEvents = eventsByDate[cell.id] || [];
                  const isSundayOrHoliday = (idx % 7 === 0) || cell.isHoliday;

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
                      <div className="flex justify-center items-center h-7 mb-1 shrink-0">
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

                      <div className="flex-1 flex flex-col gap-1 overflow-y-auto no-scrollbar">
                        {dayEvents.map((ev) => {
                          const colorObj = COLOR_OPTIONS.find(c => c.id === ev.color) || COLOR_OPTIONS[0];

                          return (
                            <div
                              key={ev.id}
                              onClick={(e) => handleOpenEditModal(ev, e)}
                              className={`flex items-center gap-1.5 text-[11px] leading-tight px-1.5 py-0.5 rounded font-normal truncate shadow-xs transition-all cursor-pointer ${
                                ev.color === 'green' ? 'bg-[#137333] text-white hover:bg-[#0f5c29]' : `${colorObj.bg} ${colorObj.text}`
                              } ${ev.isCompleted ? 'opacity-50 line-through' : 'hover:brightness-95'}`}
                              title={ev.title}
                            >
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
                              d.isToday
                                ? 'bg-[#1a73e8] text-white font-medium shadow-xs'
                                : d.isSelected
                                ? 'bg-[#d2e3fc] text-[#174ea6] font-medium'
                                : d.isCurrent
                                ? (isSun || isHol ? 'text-red-600 font-medium hover:bg-red-50' : 'text-gray-800 hover:bg-gray-100')
                                : 'text-gray-300 hover:bg-gray-50'
                            }`}
                            title={`${d.dateKey}${isHol ? ` (${yearHolidays[d.dateKey]})` : ''}`}
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
                  <p className="text-xs text-gray-500 mt-0.5">日本の国民の祝日法に基づき自動計算された年間祝日リストです</p>
                </div>
                <button
                  onClick={() => handleOpenCreateModal(selectedDate, true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#137333] text-white text-xs font-medium rounded-lg hover:bg-[#0f5c29] transition-colors shadow-xs"
                >
                  <Plus size={16} />
                  記念日・独自祝日を追加
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
                      <span className="text-sm font-semibold text-gray-800">
                        {h.title}
                      </span>
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
            /* =================== チェック一覧（ToDo） =================== */
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

      {/* モーダル */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <CheckSquare size={18} className="text-[#1a73e8]" />
                {modalMode === 'create'
                  ? (formData.isHoliday ? '祝日・記念日の追加' : '予定・チェック項目の作成')
                  : '予定・チェック項目の編集'}
              </h3>
              <button
                onClick={() => setModalMode(null)}
                className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">名称・タイトル</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={formData.isHoliday ? "例: 創立記念日、開校記念日" : "例: 会議、買い物、課題提出"}
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
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">種類</label>
                <div className="flex items-center gap-4 text-xs text-gray-700">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="eventType"
                      checked={!formData.isHoliday}
                      onChange={() => setFormData({ ...formData, isHoliday: false, color: 'blue' })}
                      className="text-[#1a73e8]"
                    />
                    <span>通常の予定・ToDo</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="eventType"
                      checked={formData.isHoliday}
                      onChange={() => setFormData({ ...formData, isHoliday: true, color: 'green' })}
                      className="text-[#137333]"
                    />
                    <span>祝日・記念日（グリーンバッジ）</span>
                  </label>
                </div>
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
