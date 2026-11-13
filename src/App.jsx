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
  Filter,
  Target,
  Flame,
  Sun,
  Moon
} from 'lucide-react';

const COLOR_OPTIONS = [
  { id: 'blue', name: 'ブルー', bg: 'bg-[#1a73e8]', border: 'border-[#1a73e8]', text: 'text-white' },
  { id: 'green', name: 'グリーン', bg: 'bg-[#137333]', border: 'border-[#137333]', text: 'text-white' },
  { id: 'red', name: 'レッド', bg: 'bg-[#d93025]', border: 'border-[#d93025]', text: 'text-white' },
  { id: 'yellow', name: 'イエロー', bg: 'bg-[#f9ab00]', border: 'border-[#f9ab00]', text: 'text-[#202124]' },
  { id: 'purple', name: 'パープル', bg: 'bg-[#a142f4]', border: 'border-[#a142f4]', text: 'text-white' },
];

function formatDateKey(year, month, day) {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

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

  // テーマモード: 'light' | 'dark'
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('check_calendar_theme') || 'light';
    } catch {
      return 'light';
    }
  });

  const isDark = theme === 'dark';

  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('check_calendar_theme', nextTheme);
    } catch (e) {
      console.error(e);
    }
  };

  const [viewMode, setViewMode] = useState('month');
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedFilterTag, setSelectedFilterTag] = useState('ALL');

  // ユーザー登録イベント
  const [userEvents, setUserEvents] = useState(() => {
    try {
      const saved = localStorage.getItem('check_calendar_events');
      if (saved) {
        const parsed = JSON.parse(saved);
        // 例示で入っていた初期サンプルのタグ（勉強、運動など）をクリア
        return parsed.map(ev => {
          if (ev.id.startsWith('sample-') && (ev.tag === '勉強' || ev.tag === '運動')) {
            return { ...ev, tag: '' };
          }
          return ev;
        });
      }
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'sample-study-1',
        overallGoal: '英単語ターゲット1900 完走',
        dailyGoal: '1日50単語暗記＆確認テスト',
        startDate: '2026-11-04',
        endDate: '2026-11-08',
        tag: '',
        color: 'blue',
        completedDates: { '2026-11-04': true, '2026-11-05': true, '2026-11-06': true },
        isHoliday: false,
      },
      {
        id: 'sample-study-2',
        overallGoal: '基本情報技術者 午前過去問 3年分制覇',
        dailyGoal: '午前過去問 20問解答＆見直し',
        startDate: '2026-11-16',
        endDate: '2026-11-20',
        tag: '',
        color: 'purple',
        completedDates: { '2026-11-16': true },
        isHoliday: false,
      },
      {
        id: 'sample-exercise',
        overallGoal: '毎日ランニング継続',
        dailyGoal: '朝3kmジョギング',
        startDate: '2026-11-01',
        endDate: '2026-11-07',
        tag: '',
        color: 'green',
        completedDates: { '2026-11-01': true, '2026-11-02': true, '2026-11-03': true, '2026-11-04': true },
        isHoliday: false,
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('check_calendar_events', JSON.stringify(userEvents));
    } catch (e) {
      console.error(e);
    }
  }, [userEvents]);

  const [modalMode, setModalMode] = useState(null);
  const [activeEvent, setActiveEvent] = useState(null);
  const [formData, setFormData] = useState({
    overallGoal: '',
    dailyGoal: '',
    startDate: '2026-11-11',
    endDate: '2026-11-11',
    tag: '',
    color: 'blue',
    isHoliday: false,
  });

  const todayKey = '2026-11-11';
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const yearHolidays = useMemo(() => {
    return getJapaneseHolidays(currentYear);
  }, [currentYear]);

  const allEvents = useMemo(() => {
    return [...userEvents];
  }, [userEvents]);

  // 達成度計算
  const getDayAchievement = useMemo(() => {
    const cache = {};

    return (dateKey) => {
      if (cache[dateKey] !== undefined) return cache[dateKey];

      const tasksOnDate = userEvents.filter(ev => {
        if (ev.isHoliday) return false;
        const s = ev.startDate;
        const e = ev.endDate || ev.startDate;
        return s <= dateKey && dateKey <= e;
      });

      if (tasksOnDate.length === 0) {
        cache[dateKey] = { hasTask: false, total: 0, completed: 0, rate: 0 };
        return cache[dateKey];
      }

      const completed = tasksOnDate.filter(ev => !!ev.completedDates?.[dateKey]).length;
      const rate = completed / tasksOnDate.length;

      cache[dateKey] = {
        hasTask: true,
        total: tasksOnDate.length,
        completed,
        rate,
      };
      return cache[dateKey];
    };
  }, [userEvents]);

  // 月表示用背景色（ライト / ダーク対応）
  const getMonthCellBgClass = (dateKey) => {
    const ach = getDayAchievement(dateKey);
    if (!ach.hasTask || ach.rate === 0) {
      return isDark ? 'bg-[#1f1f1f]' : 'bg-white';
    }
    if (ach.rate === 1.0) {
      return isDark ? 'bg-[#1b4721]/90 border-emerald-500/50' : 'bg-[#d9f99d]/75 border-lime-300';
    }
    if (ach.rate >= 0.5) {
      return isDark ? 'bg-[#143d1a]/80 border-emerald-600/40' : 'bg-[#ecfccb]/70 border-lime-200';
    }
    return isDark ? 'bg-[#0f2e14]/70 border-emerald-700/30' : 'bg-[#f7fee7]/70 border-lime-100';
  };

  // 年表示用日付スタイル（ライト / ダーク対応）
  const getYearDayClass = (dateKey, isCurrent, isSun, isHol, isToday, isSelected) => {
    if (isToday) return 'bg-[#1a73e8] text-white font-medium shadow-xs';
    if (isSelected) return isDark ? 'bg-[#174ea6] text-white font-medium' : 'bg-[#d2e3fc] text-[#174ea6] font-medium';

    const ach = getDayAchievement(dateKey);

    if (ach.hasTask && ach.rate > 0) {
      if (ach.rate === 1.0) {
        return isDark ? 'bg-[#2ea043] text-white font-bold shadow-xs' : 'bg-[#84cc16] text-white font-bold shadow-xs';
      }
      if (ach.rate >= 0.5) {
        return isDark ? 'bg-[#238636] text-white font-semibold' : 'bg-[#bef264] text-lime-900 font-semibold';
      }
      return isDark ? 'bg-[#0e4429] text-gray-200 font-medium' : 'bg-[#d9f99d] text-lime-800 font-medium';
    }

    if (!isCurrent) return isDark ? 'text-gray-600 hover:bg-[#282a2d]' : 'text-gray-300 hover:bg-gray-50';
    if (isSun || isHol) return 'text-red-500 font-semibold hover:bg-red-500/10';
    return isDark ? 'text-gray-300 hover:bg-[#303134]' : 'text-gray-800 hover:bg-gray-100';
  };

  const getEventsForDate = (dateKey) => {
    return allEvents.filter((ev) => {
      const titleMatch = (ev.overallGoal || ev.title || '').toLowerCase().includes(searchQuery.toLowerCase());
      const dailyMatch = (ev.dailyGoal || '').toLowerCase().includes(searchQuery.toLowerCase());
      const tagMatch = (ev.tag || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (searchQuery.trim() && !titleMatch && !dailyMatch && !tagMatch) {
        return false;
      }
      if (selectedFilterTag !== 'ALL' && ev.tag !== selectedFilterTag) {
        return false;
      }
      const s = ev.startDate;
      const e = ev.endDate || ev.startDate;
      return s <= dateKey && dateKey <= e;
    });
  };

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
        holidayName: yearHolidays[dateKey] || '',
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
        holidayName: yearHolidays[dateKey] || '',
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
        holidayName: yearHolidays[dateKey] || '',
      });
    }

    return days;
  }, [currentYear, currentMonth, todayKey, yearHolidays]);

  const miniCalendarGrid = useMemo(() => {
    return generateMonthDays(currentYear, currentMonth, selectedDate, todayKey);
  }, [currentYear, currentMonth, selectedDate, todayKey]);

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

  const handleOpenCreateModal = (targetDate = selectedDate, defaultTag = '') => {
    setFormData({
      overallGoal: '',
      dailyGoal: '',
      startDate: targetDate,
      endDate: targetDate,
      tag: defaultTag,
      color: 'blue',
      isHoliday: false,
    });
    setModalMode('create');
  };

  const handleOpenEditModal = (ev, e) => {
    e.stopPropagation();
    setActiveEvent(ev);
    setFormData({
      overallGoal: ev.overallGoal || ev.title || '',
      dailyGoal: ev.dailyGoal || '',
      startDate: ev.startDate || ev.date,
      endDate: ev.endDate || ev.startDate || ev.date,
      tag: ev.tag || '',
      color: ev.color || 'blue',
      isHoliday: !!ev.isHoliday,
    });
    setModalMode('edit');
  };

  const handleSaveEvent = (e) => {
    e.preventDefault();
    if (!formData.overallGoal.trim()) return;

    const cleanEndDate = formData.endDate < formData.startDate ? formData.startDate : formData.endDate;

    if (modalMode === 'create') {
      const newEv = {
        id: `event-${Date.now()}`,
        overallGoal: formData.overallGoal.trim(),
        dailyGoal: formData.dailyGoal.trim(),
        startDate: formData.startDate,
        endDate: cleanEndDate,
        tag: (formData.tag || '').trim(),
        color: formData.color,
        completedDates: {},
        isHoliday: formData.isHoliday,
      };
      setUserEvents(prev => [...prev, newEv]);
    } else if (modalMode === 'edit' && activeEvent) {
      if (activeEvent.id.startsWith('sys-holiday-')) {
        const newEv = {
          id: `custom-event-${Date.now()}`,
          overallGoal: formData.overallGoal.trim(),
          dailyGoal: formData.dailyGoal.trim(),
          startDate: formData.startDate,
          endDate: cleanEndDate,
          tag: (formData.tag || '').trim(),
          color: formData.color,
          completedDates: {},
          isHoliday: formData.isHoliday,
        };
        setUserEvents(prev => [...prev, newEv]);
      } else {
        setUserEvents(prev => prev.map(ev => {
          if (ev.id === activeEvent.id) {
            return {
              ...ev,
              overallGoal: formData.overallGoal.trim(),
              dailyGoal: formData.dailyGoal.trim(),
              startDate: formData.startDate,
              endDate: cleanEndDate,
              tag: (formData.tag || '').trim(),
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

  const handleToggleDailyComplete = (eventId, dateKey, e) => {
    e.stopPropagation();
    setUserEvents(prev => prev.map(ev => {
      if (ev.id === eventId) {
        const currentDates = { ...(ev.completedDates || {}) };
        currentDates[dateKey] = !currentDates[dateKey];
        return { ...ev, completedDates: currentDates };
      }
      return ev;
    }));
  };

  const weekDayNames = ['日', '月', '火', '水', '木', '金', '土'];
  const taskEvents = useMemo(() => allEvents.filter(e => !e.isHoliday), [allEvents]);

  const totalTargetDaysCount = useMemo(() => {
    let targetTotal = 0;
    let completedTotal = 0;
    userEvents.forEach(ev => {
      const days = calculateDaysCount(ev.startDate, ev.endDate);
      targetTotal += days;
      const compCount = Object.values(ev.completedDates || {}).filter(Boolean).length;
      completedTotal += compCount;
    });
    return { targetTotal, completedTotal };
  }, [userEvents]);

  const availableTags = useMemo(() => {
    const set = new Set();
    userEvents.forEach(e => {
      if (e.tag && e.tag.trim() && e.tag !== '祝日') set.add(e.tag.trim());
    });
    return Array.from(set);
  }, [userEvents]);

  const currentViewLabel = viewMode === 'year' ? '年' : viewMode === 'month' ? '月' : 'チェック一覧';

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden font-sans antialiased transition-colors duration-200 ${
      isDark ? 'bg-[#121212] text-[#e8eaed]' : 'bg-[#f8fafd] text-[#3c4043]'
    }`}>
      {/* タイトルバー */}
      <div className={`${isDark ? 'bg-[#18191a] text-[#9aa0a6] border-[#3c4043]' : 'bg-[#202124] text-[#e8eaed] border-[#3c4043]/40'} text-xs px-3 py-1 flex items-center justify-between select-none shrink-0 border-b`}>
        <span className="font-medium tracking-wide">空のWebサイト</span>
        <div className="flex items-center space-x-2 text-[11px] opacity-70">
          <span>チェックカレンダー {isDark ? '🌙 ダーク' : '☀️ ライト'}</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* サイドバー */}
        {isSidebarOpen && (
          <aside className={`w-[260px] min-w-[260px] flex flex-col pt-3 px-3 z-30 select-none border-r transition-all duration-200 ${
            isDark ? 'bg-[#1e1e1e] border-[#3c4043]' : 'bg-[#f8fafd] border-gray-200/70 shadow-sm sm:shadow-none'
          }`}>
            <div className="flex items-center h-10 mb-2 pl-1">
              <button
                onClick={() => setIsSidebarOpen(false)}
                className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-[#303134] text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}
                title="メニューを閉じる"
              >
                <X size={26} strokeWidth={1.8} />
              </button>
            </div>

            {/* + 作成 ▾ ボタン */}
            <div className="mb-3 pl-1">
              <button
                onClick={() => handleOpenCreateModal(selectedDate, '')}
                className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl border transition-all cursor-pointer group shadow-sm ${
                  isDark
                    ? 'bg-[#2d2e30] border-[#3c4043] text-gray-200 hover:bg-[#35373a]'
                    : 'bg-white border-gray-200/80 text-gray-700 hover:shadow-md'
                }`}
              >
                <Plus size={20} className="group-hover:rotate-90 transition-transform" strokeWidth={2.4} />
                <span className="text-sm font-medium">目標・やること追加</span>
                <ChevronDown size={14} className="ml-auto opacity-70" />
              </button>
            </div>

            {/* 達成度カラー凡例 */}
            <div className={`mb-3 px-2 py-2 border rounded-xl ${isDark ? 'bg-[#252628] border-[#3c4043]' : 'bg-white/70 border-gray-200/70'}`}>
              <span className={`text-[10px] font-semibold block mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                その日のタスク達成度
              </span>
              <div className="flex items-center justify-between text-[10px] opacity-75">
                <span>0%</span>
                <div className="flex items-center gap-1">
                  <span className={`w-3.5 h-3.5 rounded border ${isDark ? 'bg-[#303134] border-[#3c4043]' : 'bg-gray-100 border-gray-200'}`} title="未完了"></span>
                  <span className={`w-3.5 h-3.5 rounded border ${isDark ? 'bg-[#0e4429] border-[#1b4721]' : 'bg-[#f7fee7] border-lime-200'}`} title="一部達成"></span>
                  <span className={`w-3.5 h-3.5 rounded border ${isDark ? 'bg-[#238636] border-[#2ea043]' : 'bg-[#bef264] border-lime-300'}`} title="50%以上達成"></span>
                  <span className={`w-3.5 h-3.5 rounded border ${isDark ? 'bg-[#2ea043] border-[#3fb950]' : 'bg-[#84cc16] border-lime-500'}`} title="100%達成！"></span>
                </div>
                <span className={isDark ? 'text-emerald-400 font-bold' : 'text-lime-700 font-bold'}>100%</span>
              </div>
            </div>

            {/* タグフィルター */}
            {availableTags.length > 0 && (
              <div className="mb-4 px-1">
                <span className={`text-[11px] font-semibold uppercase tracking-wider block mb-1.5 flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Filter size={12} />
                  タグで絞り込み
                </span>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setSelectedFilterTag('ALL')}
                    className={`text-[11px] px-2.5 py-1 rounded-full transition-all ${
                      selectedFilterTag === 'ALL'
                        ? 'bg-[#1a73e8] text-white font-medium'
                        : isDark
                        ? 'bg-[#303134] text-gray-300 hover:bg-[#3c4043]'
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
                          : isDark
                          ? 'bg-[#252628] border border-[#3c4043] text-gray-300 hover:bg-[#303134]'
                          : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span>#{tag}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ミニカレンダー */}
            <div className="px-1">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  {currentYear}年 {currentMonth}月
                </span>
                <div className="flex items-center space-x-0.5 opacity-80">
                  <button
                    onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 2, 1))}
                    className={`p-1 rounded-full transition-colors ${isDark ? 'hover:bg-[#303134]' : 'hover:bg-gray-200'}`}
                    title="前月"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date(currentYear, currentMonth, 1))}
                    className={`p-1 rounded-full transition-colors ${isDark ? 'hover:bg-[#303134]' : 'hover:bg-gray-200'}`}
                    title="次月"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className={`grid grid-cols-7 text-center mb-1 text-[11px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {weekDayNames.map((day, idx) => (
                  <div key={idx} className="py-0.5">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 text-center text-xs">
                {miniCalendarGrid.map((d, idx) => {
                  const ach = getDayAchievement(d.dateKey);
                  const isSun = (idx % 7 === 0);
                  const isHol = !!yearHolidays[d.dateKey];

                  let style = isDark ? 'text-gray-500 hover:bg-[#303134]' : 'text-gray-400 hover:bg-gray-100';

                  if (d.isToday) {
                    style = 'bg-[#1a73e8] text-white font-medium shadow-xs';
                  } else if (d.isSelected) {
                    style = isDark ? 'bg-[#174ea6] text-white font-medium' : 'bg-[#d2e3fc] text-[#174ea6] font-medium';
                  } else if (ach.hasTask && ach.rate > 0) {
                    if (ach.rate === 1.0) {
                      style = isDark ? 'bg-[#2ea043] text-white font-bold' : 'bg-[#84cc16] text-white font-bold';
                    } else {
                      style = isDark ? 'bg-[#0e4429] text-gray-200 font-medium' : 'bg-[#d9f99d] text-lime-800 font-medium';
                    }
                  } else if (d.isCurrent) {
                    style = (isSun || isHol)
                      ? 'text-red-500 font-semibold hover:bg-red-500/10'
                      : isDark ? 'text-gray-200 hover:bg-[#303134]' : 'text-gray-800 hover:bg-gray-200';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedDate(d.dateKey);
                        const [y, m] = d.dateKey.split('-').map(Number);
                        setCurrentDate(new Date(y, m - 1, 1));
                        if (viewMode === 'year') setViewMode('month');
                      }}
                      className={`h-7 w-7 mx-auto my-0.5 rounded-full flex items-center justify-center transition-colors text-[11px] ${style}`}
                      title={ach.hasTask ? `${d.dateKey}: 達成度 ${Math.round(ach.rate * 100)}%` : d.dateKey}
                    >
                      {d.num}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 進捗バー */}
            <div className={`mt-auto pt-3 pb-2 border-t px-2 ${isDark ? 'border-[#3c4043]' : 'border-gray-200/80'}`}>
              <div className={`flex items-center justify-between text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <span className="flex items-center gap-1.5">
                  <Flame size={14} className="text-orange-500" />
                  日々の目標達成
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  isDark ? 'bg-orange-950/60 text-orange-400' : 'bg-orange-50 text-orange-600'
                }`}>
                  {totalTargetDaysCount.completedTotal} / {totalTargetDaysCount.targetTotal} 日
                </span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-[#303134]' : 'bg-gray-200'}`}>
                <div
                  className="bg-orange-500 h-full transition-all duration-300"
                  style={{
                    width: `${totalTargetDaysCount.targetTotal > 0 ? (totalTargetDaysCount.completedTotal / totalTargetDaysCount.targetTotal) * 100 : 0}%`
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
                  className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-colors mr-1 ${
                    isDark ? 'hover:bg-[#252628] text-gray-200' : 'hover:bg-gray-200 text-gray-700'
                  }`}
                  title="メニューを開く"
                >
                  <Menu size={22} strokeWidth={2} />
                  <span className="text-[10px] leading-tight font-normal -mt-0.5">メニュー</span>
                </button>
              )}

              <button
                onClick={handleGoToday}
                className={`px-4 py-1.5 border rounded-md text-sm font-medium transition-colors ${
                  isDark
                    ? 'border-[#3c4043] bg-[#1e1e1e] text-gray-200 hover:bg-[#282a2d]'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                }`}
                title="今日（2026年11月）に戻る"
              >
                今日
              </button>

              <div className="flex items-center space-x-1">
                <button
                  onClick={handlePrev}
                  className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-[#282a2d] text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                  title={viewMode === 'year' ? '前年' : '前月'}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={handleNext}
                  className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-[#282a2d] text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                  title={viewMode === 'year' ? '次年' : '次月'}
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <h1 className={`text-xl font-medium tracking-tight ml-2 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                {viewMode === 'year' ? `${currentYear}年` : `${currentYear}年 ${currentMonth}月`}
              </h1>

              {/* 達成度ヒートマップ凡例 */}
              <div className={`hidden md:flex items-center gap-1.5 ml-3 px-2.5 py-1 border rounded-full text-[11px] shadow-2xs ${
                isDark ? 'bg-[#1e1e1e] border-[#3c4043] text-gray-400' : 'bg-white border-gray-200 text-gray-500'
              }`}>
                <span>達成度:</span>
                <span className={`w-2.5 h-2.5 rounded-full ${isDark ? 'bg-[#303134]' : 'bg-gray-200'}`} title="0%"></span>
                <span className={`w-2.5 h-2.5 rounded-full ${isDark ? 'bg-[#0e4429]' : 'bg-[#d9f99d]'}`} title="一部達成"></span>
                <span className={`w-2.5 h-2.5 rounded-full ${isDark ? 'bg-[#238636]' : 'bg-[#bef264]'}`} title="50%以上"></span>
                <span className={`w-2.5 h-2.5 rounded-full ${isDark ? 'bg-[#2ea043]' : 'bg-[#84cc16]'}`} title="100%達成！"></span>
              </div>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* ダーク/ライトモード切り替えボタン */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-all ${
                  isDark
                    ? 'hover:bg-[#282a2d] text-yellow-400'
                    : 'hover:bg-gray-200 text-gray-600'
                }`}
                title={isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {isSearchOpen ? (
                <div className={`flex items-center rounded-full px-3 py-1 border animate-in fade-in duration-150 ${
                  isDark ? 'bg-[#252628] border-[#3c4043]' : 'bg-gray-100 border-gray-300'
                }`}>
                  <Search size={16} className="text-gray-400 mr-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="全体目標・1日の目標を検索..."
                    className={`bg-transparent border-none outline-none text-xs w-36 sm:w-48 ${
                      isDark ? 'text-gray-100 placeholder-gray-500' : 'text-gray-700'
                    }`}
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchOpen(false);
                    }}
                    className="text-gray-400 hover:opacity-75 ml-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-[#282a2d] text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                  title="検索"
                >
                  <Search size={20} />
                </button>
              )}

              <button
                onClick={() => alert('【ダークモード＆機能ガイド】\n・太陽/月アイコンでダークモードとライトモードをいつでも切り替えられます。\n・タスクを達成すると、その日の達成率に応じて黄緑色に染まります。\n・年間表示でも1年間の草生やし（達成度）を一覧できます！')}
                className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-[#282a2d] text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                title="ヘルプ"
              >
                <HelpCircle size={20} />
              </button>

              <button
                onClick={() => {
                  if (confirm('登録した目標・やることデータを初期化しますか？')) {
                    localStorage.removeItem('check_calendar_events');
                    window.location.reload();
                  }
                }}
                className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-[#282a2d] text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                title="データ初期化"
              >
                <Settings size={20} />
              </button>

              {/* ビュー切替ドロップダウン */}
              <div className="relative">
                <button
                  onClick={() => setIsViewDropdownOpen(prev => !prev)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 border rounded-md text-sm font-medium transition-colors ml-1 ${
                    isDark
                      ? 'bg-[#1e1e1e] border-[#3c4043] text-gray-200 hover:bg-[#282a2d]'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{currentViewLabel}</span>
                  <ChevronDown size={14} className="opacity-70" />
                </button>

                {isViewDropdownOpen && (
                  <div className={`absolute right-0 mt-1 w-36 border rounded-lg shadow-lg py-1 z-50 animate-in fade-in duration-100 ${
                    isDark ? 'bg-[#252628] border-[#3c4043] text-gray-200' : 'bg-white border-gray-200 text-gray-700'
                  }`}>
                    <button
                      onClick={() => {
                        setViewMode('month');
                        setIsViewDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between ${
                        isDark ? 'hover:bg-[#303134]' : 'hover:bg-gray-100'
                      } ${viewMode === 'month' ? 'font-semibold text-[#1a73e8]' : ''}`}
                    >
                      <span>月表示</span>
                      {viewMode === 'month' && <Check size={14} />}
                    </button>
                    <button
                      onClick={() => {
                        setViewMode('year');
                        setIsViewDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between ${
                        isDark ? 'hover:bg-[#303134]' : 'hover:bg-gray-100'
                      } ${viewMode === 'year' ? 'font-semibold text-[#1a73e8]' : ''}`}
                    >
                      <span>年表示</span>
                      {viewMode === 'year' && <Check size={14} />}
                    </button>
                    <button
                      onClick={() => {
                        setViewMode('check-list');
                        setIsViewDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between ${
                        isDark ? 'hover:bg-[#303134]' : 'hover:bg-gray-100'
                      } ${viewMode === 'check-list' ? 'font-semibold text-[#1a73e8]' : ''}`}
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
            <main className={`flex-1 flex flex-col border rounded-2xl overflow-hidden shadow-xs transition-colors duration-200 ${
              isDark ? 'bg-[#1e1e1e] border-[#3c4043]' : 'bg-white border-gray-200'
            }`}>
              <div className={`grid grid-cols-7 border-b text-center py-2 text-xs font-medium ${
                isDark ? 'border-[#3c4043] bg-[#222325] text-gray-400' : 'border-gray-200 bg-white text-gray-500'
              }`}>
                {weekDayNames.map((day, idx) => (
                  <div key={idx} className="flex justify-center">
                    <span className={idx === 0 ? 'text-red-500 font-semibold' : idx === 6 ? 'text-blue-500' : ''}>
                      {day}
                    </span>
                  </div>
                ))}
              </div>

              <div className={`flex-1 grid grid-cols-7 ${calendarGrid.length > 35 ? 'grid-rows-6' : 'grid-rows-5'} ${
                isDark ? 'bg-[#18191a]' : 'bg-white'
              }`}>
                {calendarGrid.map((cell, idx) => {
                  const isColRightBorder = (idx + 1) % 7 !== 0;
                  const totalRows = calendarGrid.length / 7;
                  const isRowBottomBorder = Math.floor(idx / 7) < totalRows - 1;
                  const dayEvents = getEventsForDate(cell.id);
                  const isSundayOrHoliday = (idx % 7 === 0) || cell.isHoliday;
                  const bgClass = getMonthCellBgClass(cell.id);
                  const ach = getDayAchievement(cell.id);

                  return (
                    <div
                      key={cell.id}
                      onClick={() => {
                        setSelectedDate(cell.id);
                        handleOpenCreateModal(cell.id, '');
                      }}
                      className={`flex flex-col p-1 relative group transition-colors cursor-pointer overflow-hidden ${bgClass} ${
                        isColRightBorder ? (isDark ? 'border-r border-[#3c4043]/60' : 'border-r border-gray-200') : ''
                      } ${isRowBottomBorder ? (isDark ? 'border-b border-[#3c4043]/60' : 'border-b border-gray-200') : ''} ${
                        selectedDate === cell.id ? 'ring-2 ring-inset ring-blue-500' : ''
                      } hover:brightness-98`}
                    >
                      {/* 日付ヘッダー */}
                      <div className="flex justify-between items-center h-6 px-1 mb-1 shrink-0">
                        {ach.hasTask ? (
                          <span className={`text-[9px] font-bold px-1 rounded-sm ${
                            ach.rate === 1.0
                              ? (isDark ? 'bg-[#2ea043] text-white' : 'bg-[#84cc16] text-white')
                              : ach.rate > 0
                              ? (isDark ? 'bg-[#1e5828] text-emerald-300' : 'bg-lime-200 text-lime-900')
                              : (isDark ? 'text-gray-500' : 'text-gray-400')
                          }`}>
                            {ach.completed}/{ach.total}
                          </span>
                        ) : <div className="w-4" />}

                        {cell.isToday ? (
                          <div
                            className="w-6 h-6 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-xs font-medium shadow-xs"
                            title={cell.holidayName || undefined}
                          >
                            {cell.day}
                          </div>
                        ) : (
                          <span
                            title={cell.holidayName || undefined}
                            className={`text-xs ${
                              cell.isCurrentMonth
                                ? (isSundayOrHoliday ? 'text-red-500 font-medium' : idx % 7 === 6 ? 'text-blue-500' : isDark ? 'text-gray-200' : 'text-gray-800')
                                : (isDark ? 'text-gray-600 font-light' : 'text-gray-400 font-light')
                            }`}
                          >
                            {cell.display}
                          </span>
                        )}

                        {ach.hasTask && ach.rate === 1.0 ? (
                          <span className="text-[10px]" title="全タスク達成！">🌟</span>
                        ) : <div className="w-4" />}
                      </div>

                      {/* イベントリスト */}
                      <div className="flex-1 flex flex-col gap-1 overflow-y-auto no-scrollbar">
                        {dayEvents.map((ev) => {
                          if (ev.isHoliday) return null;
                          const colorObj = COLOR_OPTIONS.find(c => c.id === ev.color) || COLOR_OPTIONS[0];
                          const isDailyDone = !!ev.completedDates?.[cell.id];

                          return (
                            <div
                              key={`${ev.id}-${cell.id}`}
                              onClick={(e) => handleOpenEditModal(ev, e)}
                              className={`flex flex-col p-1 text-[11px] leading-tight font-normal rounded shadow-xs transition-all cursor-pointer border ${
                                isDailyDone
                                  ? isDark
                                    ? 'bg-[#1b3d22]/80 border-emerald-700/60 text-gray-400'
                                    : 'bg-lime-50/90 border-lime-300 text-gray-500'
                                  : `${colorObj.bg} text-white ${colorObj.border}`
                              } hover:brightness-95`}
                              title={`【全体の目標】${ev.overallGoal}\n【1日の目標】${ev.dailyGoal || 'なし'}`}
                            >
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleDailyComplete(ev.id, cell.id, e)}
                                  className={`w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0 transition-colors ${
                                    isDailyDone
                                      ? 'bg-[#2ea043] border-[#2ea043] text-white shadow-2xs'
                                      : 'bg-white/20 border-white/80 hover:bg-white/40 text-white'
                                  }`}
                                  title={isDailyDone ? '未達成に戻す' : '今日の目標を達成！'}
                                >
                                  {isDailyDone && <Check size={10} strokeWidth={3} className="text-white" />}
                                </button>

                                <span className={`truncate font-medium ${isDailyDone ? 'line-through opacity-70' : 'text-white'}`}>
                                  {ev.dailyGoal ? ev.dailyGoal : ev.overallGoal}
                                </span>
                              </div>

                              {ev.dailyGoal && (
                                <div className={`text-[9px] truncate pl-4.5 mt-0.5 flex items-center gap-1 ${isDailyDone ? 'opacity-60' : 'text-white/80'}`}>
                                  <span className="truncate">🎯 {ev.overallGoal}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          isDark ? 'bg-blue-900/60 text-blue-300' : 'bg-blue-100 text-[#1a73e8]'
                        }`}>
                          <Plus size={12} strokeWidth={2.5} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </main>
          ) : viewMode === 'year' ? (
            /* =================== 年間表示 =================== */
            <main className={`flex-1 border rounded-2xl overflow-y-auto p-4 sm:p-6 shadow-xs transition-colors duration-200 ${
              isDark ? 'bg-[#1e1e1e] border-[#3c4043]' : 'bg-white border-gray-200'
            }`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6 max-w-7xl mx-auto">
                {yearMonthsData.map((m) => (
                  <div key={m.monthNum} className="flex flex-col">
                    <div className="mb-2 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setCurrentDate(new Date(currentYear, m.monthNum - 1, 1));
                          setViewMode('month');
                        }}
                        className={`text-sm font-semibold transition-colors ${
                          isDark ? 'text-gray-200 hover:text-blue-400' : 'text-gray-800 hover:text-[#1a73e8]'
                        }`}
                      >
                        {m.title}
                      </button>
                    </div>

                    <div className={`grid grid-cols-7 text-center mb-1 text-[11px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
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
                        const ach = getDayAchievement(d.dateKey);
                        const dayStyle = getYearDayClass(d.dateKey, d.isCurrent, isSun, isHol, d.dateKey === todayKey, d.dateKey === selectedDate);

                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              setSelectedDate(d.dateKey);
                              const [y, mon] = d.dateKey.split('-').map(Number);
                              setCurrentDate(new Date(y, mon - 1, 1));
                              setViewMode('month');
                            }}
                            className={`h-6 w-6 mx-auto my-0.5 rounded-full flex items-center justify-center transition-all text-[11px] ${dayStyle}`}
                            title={`${d.dateKey}${ach.hasTask ? ` (達成度: ${Math.round(ach.rate * 100)}% - ${ach.completed}/${ach.total}件)` : ''}${isHol ? ` [${yearHolidays[d.dateKey]}]` : ''}`}
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
          ) : (
            /* =================== チェック一覧 =================== */
            <main className={`flex-1 flex flex-col border rounded-2xl overflow-hidden shadow-xs p-6 transition-colors duration-200 ${
              isDark ? 'bg-[#1e1e1e] border-[#3c4043]' : 'bg-white border-gray-200'
            }`}>
              <div className={`flex items-center justify-between pb-4 border-b mb-4 ${isDark ? 'border-[#3c4043]' : 'border-gray-200'}`}>
                <div>
                  <h2 className={`text-lg font-medium flex items-center gap-2 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                    <Target size={20} className="text-[#1a73e8]" />
                    目標・やること進捗一覧
                  </h2>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>全体の目標と日々の達成状況を一覧で管理できます</p>
                </div>
                <button
                  onClick={() => handleOpenCreateModal(selectedDate, '')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#1a73e8] text-white text-xs font-medium rounded-lg hover:bg-[#174ea6] transition-colors shadow-xs"
                >
                  <Plus size={16} />
                  新規目標を追加
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {taskEvents.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-gray-500">
                    <CheckSquare size={36} className="mb-2 stroke-1" />
                    <p className="text-sm">登録されている目標はありません</p>
                  </div>
                ) : (
                  taskEvents.map((t) => {
                    const totalDays = calculateDaysCount(t.startDate, t.endDate);
                    const doneDaysCount = Object.values(t.completedDates || {}).filter(Boolean).length;
                    const percent = Math.round((doneDaysCount / totalDays) * 100);

                    return (
                      <div
                        key={t.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isDark
                            ? 'bg-[#252628] border-[#3c4043] hover:border-blue-500/50'
                            : 'bg-white border-gray-200 shadow-xs hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                isDark ? 'bg-blue-950 text-blue-300' : 'bg-blue-100 text-[#1a73e8]'
                              }`}>
                                全体の目標
                              </span>
                              <span className={`text-base font-bold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                                {t.overallGoal}
                              </span>
                              {t.tag && (
                                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                                  isDark ? 'bg-[#303134] text-gray-300' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  #{t.tag}
                                </span>
                              )}
                            </div>

                            {t.dailyGoal && (
                              <div className="flex items-center gap-2 text-sm pl-1 mt-1">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                  isDark ? 'bg-emerald-950/70 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                                }`}>
                                  1日の目標
                                </span>
                                <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{t.dailyGoal}</span>
                              </div>
                            )}

                            <div className={`flex items-center gap-4 text-xs pt-1 pl-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              <span className="flex items-center gap-1">
                                <Clock size={13} className="opacity-70" />
                                <span>期間: {t.startDate} 〜 {t.endDate} ({totalDays}日間)</span>
                              </span>
                              <span className={`flex items-center gap-1 font-semibold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                                <Flame size={13} />
                                <span>達成状況: {doneDaysCount} / {totalDays} 日完了 ({percent}%)</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => handleOpenEditModal(t, e)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                isDark ? 'text-gray-300 hover:bg-[#303134]' : 'text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              編集
                            </button>
                            <button
                              onClick={() => {
                                setActiveEvent(t);
                                handleDeleteEvent();
                              }}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isDark ? 'text-red-400 hover:bg-red-950/40' : 'text-red-500 hover:bg-red-50'
                              }`}
                              title="削除"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className={`mt-3 w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#303134]' : 'bg-gray-100'}`}>
                          <div
                            className={`h-full transition-all duration-300 ${percent === 100 ? (isDark ? 'bg-[#2ea043]' : 'bg-[#84cc16]') : 'bg-[#1a73e8]'}`}
                            style={{ width: `${percent}%` }}
                          />
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div
            className={`rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border transform transition-all ${
              isDark ? 'bg-[#202124] border-[#3c4043] text-gray-200' : 'bg-white border-gray-100 text-gray-800'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between px-6 py-4 border-b ${
              isDark ? 'bg-[#282a2d] border-[#3c4043]' : 'bg-gray-50 border-gray-100'
            }`}>
              <h3 className="text-base font-semibold flex items-center gap-2">
                <Target size={18} className="text-[#1a73e8]" />
                {modalMode === 'create' ? '目標・やることの設定' : '目標・やることの編集'}
              </h3>
              <button
                onClick={() => setModalMode(null)}
                className={`p-1.5 rounded-full transition-colors ${isDark ? 'hover:bg-[#3c4043] text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-6 space-y-4">
              <div className={`p-3.5 rounded-xl border ${
                isDark ? 'bg-[#1e2838]/60 border-blue-900/60' : 'bg-blue-50/50 border-blue-100'
              }`}>
                <label className="block text-xs font-bold text-[#1a73e8] mb-1 flex items-center gap-1.5">
                  <Target size={14} />
                  ① 全体の目標（ゴール） <span className="text-red-500">*</span>
                </label>
                <p className={`text-[11px] mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>期間全体を通して達成したい最終ゴールを入力してください</p>
                <input
                  type="text"
                  required
                  value={formData.overallGoal}
                  onChange={(e) => setFormData({ ...formData, overallGoal: e.target.value })}
                  placeholder="例: 単語帳1900語を完全走破、基本情報過去問3年分制覇"
                  className={`w-full px-3.5 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a73e8] border ${
                    isDark ? 'bg-[#282a2d] border-[#3c4043] text-gray-100 placeholder-gray-500' : 'bg-white border-blue-200 text-gray-800'
                  }`}
                  autoFocus
                />
              </div>

              <div className={`p-3.5 rounded-xl border ${
                isDark ? 'bg-[#183020]/60 border-emerald-900/60' : 'bg-emerald-50/50 border-emerald-100'
              }`}>
                <label className={`block text-xs font-bold mb-1 flex items-center gap-1.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  <Flame size={14} />
                  ② 1日に達成する目標（日々のノルマ）
                </label>
                <p className={`text-[11px] mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>カレンダーの各マスに表示され、毎日チェックできる目標です</p>
                <input
                  type="text"
                  value={formData.dailyGoal}
                  onChange={(e) => setFormData({ ...formData, dailyGoal: e.target.value })}
                  placeholder="例: 1日50単語暗記＋復習テスト、1日午前過去問20問解く"
                  className={`w-full px-3.5 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 border ${
                    isDark ? 'bg-[#282a2d] border-[#3c4043] text-gray-100 placeholder-gray-500' : 'bg-white border-emerald-200 text-gray-800'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1.5 flex items-center justify-between ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
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
                    <span className={`block text-[11px] mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>開始日</span>
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
                      className={`w-full px-2.5 py-2 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a73e8] border ${
                        isDark ? 'bg-[#282a2d] border-[#3c4043] text-gray-200' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <span className={`block text-[11px] mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>終了日</span>
                    <input
                      type="date"
                      required
                      min={formData.startDate}
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className={`w-full px-2.5 py-2 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a73e8] border ${
                        isDark ? 'bg-[#282a2d] border-[#3c4043] text-gray-200' : 'border-gray-300'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1.5 flex items-center gap-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  <TagIcon size={13} />
                  タグ（カテゴリー）
                </label>
                {availableTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {availableTags.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormData({ ...formData, tag: t })}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                          formData.tag === t
                            ? isDark
                              ? 'bg-blue-950/70 border-blue-500 text-blue-300 font-semibold'
                              : 'bg-blue-50 border-[#1a73e8] text-[#1a73e8] font-semibold'
                            : isDark
                            ? 'bg-[#282a2d] border-[#3c4043] text-gray-300 hover:bg-[#303134]'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <span>#{t}</span>
                      </button>
                    ))}
                  </div>
                )}
                <input
                  type="text"
                  value={formData.tag}
                  onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                  placeholder="タグ名を入力（任意）"
                  className={`w-full px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1a73e8] border ${
                    isDark ? 'bg-[#282a2d] border-[#3c4043] text-gray-200' : 'border-gray-200'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>タグカラー</label>
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

              <div className={`flex items-center justify-between pt-4 border-t ${isDark ? 'border-[#3c4043]' : 'border-gray-100'}`}>
                {modalMode === 'edit' ? (
                  <button
                    type="button"
                    onClick={handleDeleteEvent}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      isDark ? 'text-red-400 hover:bg-red-950/40' : 'text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <Trash2 size={15} />
                    削除
                  </button>
                ) : <div />}

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setModalMode(null)}
                    className={`px-4 py-2 text-xs font-medium rounded-xl transition-colors ${
                      isDark ? 'text-gray-400 hover:bg-[#303134]' : 'text-gray-600 hover:bg-gray-100'
                    }`}
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
