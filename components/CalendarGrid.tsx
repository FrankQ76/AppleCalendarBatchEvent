import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getDaysInMonth, isSameDay, getMonthName } from '../utils/dateUtils.ts';

interface CalendarGridProps {
  selectedDates: Date[];
  onToggleDate: (date: Date) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ selectedDates, onToggleDate }) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const days = getDaysInMonth(currentYear, currentMonth);

  // Pad the start of the month to align with day of week
  const startDayOfWeek = days[0].getDay(); // 0 = Sunday
  const emptySlots = Array(startDayOfWeek).fill(null);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const isSelected = (date: Date) => selectedDates.some((d) => isSameDay(d, date));

  return (
    <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-200"
        >
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-lg font-semibold text-slate-100">
          {getMonthName(currentYear, currentMonth)}
        </h3>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-200"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-medium text-slate-500 py-2 border-b border-slate-800">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      <div className="grid grid-cols-7 p-2 gap-1">
        {emptySlots.map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        {days.map((date) => {
          const selected = isSelected(date);
          const isToday = isSameDay(date, new Date());
          return (
            <button
              key={date.toISOString()}
              onClick={() => onToggleDate(date)}
              className={`
                aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all duration-200
                ${
                  selected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50 scale-105'
                    : 'text-slate-300 hover:bg-slate-800'
                }
                ${isToday && !selected ? 'ring-2 ring-blue-500/50 font-bold text-blue-400' : ''}
              `}
            >
              <span>{date.getDate()}</span>
              {selected && <div className="w-1 h-1 bg-white rounded-full mt-1 opacity-50"></div>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarGrid;