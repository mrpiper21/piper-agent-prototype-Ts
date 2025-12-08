import { AiOutlineLeft, AiOutlineRight } from 'react-icons/ai';
import { sharedStyles } from '../../../shared/clerkStyles';
import type { lightStyles } from '../../../shared/clerkStyles';

type ThemeStyles = typeof lightStyles;

interface ActivityCalendarProps {
  themeStyles: ThemeStyles;
  calendarDates: Date[];
  calendarMonthHeader: string;
  calendarGridStart: number;
  monthlyCountMap: Map<string, number>;
  selectedDate: string;
  calendarOffset: number;
  onDateSelect: (date: string) => void;
  onCalendarOffsetChange: (offset: number) => void;
  onTodayClick: () => void;
}

export function ActivityCalendar({
  themeStyles,
  calendarDates,
  calendarMonthHeader,
  calendarGridStart,
  monthlyCountMap,
  selectedDate,
  calendarOffset,
  onDateSelect,
  onCalendarOffsetChange,
  onTodayClick,
}: ActivityCalendarProps) {
  return (
    <div
      style={{
        ...sharedStyles.card,
        ...themeStyles.card,
        display: 'flex',
        flexDirection: 'column',
        padding: 'var(--spacing-md, 12px)',
        boxShadow: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--spacing-md, 12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: `${themeStyles.primaryButton.background}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}
          >
            📅
          </div>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                color: themeStyles.text,
                margin: 0,
                fontWeight: '700',
                fontSize: '18px',
              }}
            >
              Activity Calendar
            </h3>
            <p style={{ color: themeStyles.textSecondary, margin: 0, fontSize: '12px' }}>
              {calendarMonthHeader || 'Job count by date'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onCalendarOffsetChange(calendarOffset + 1)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${themeStyles.card.border}`,
              background: themeStyles.input.background,
              color: themeStyles.text,
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = themeStyles.card.background;
              e.currentTarget.style.transform = 'translateX(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = themeStyles.input.background;
              e.currentTarget.style.transform = 'translateX(0)';
            }}
            title="Go to previous period"
          >
            <AiOutlineLeft />
          </button>
          <button
            onClick={onTodayClick}
            disabled={calendarOffset === 0}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${themeStyles.card.border}`,
              background:
                calendarOffset === 0
                  ? themeStyles.card.background
                  : themeStyles.primaryButton.background,
              color:
                calendarOffset === 0
                  ? themeStyles.textSecondary
                  : themeStyles.primaryButton.color,
              cursor: calendarOffset === 0 ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              opacity: calendarOffset === 0 ? 0.6 : 1,
            }}
            title="Jump to today"
          >
            Today
          </button>
          <button
            onClick={() => onCalendarOffsetChange(calendarOffset - 1)}
            disabled={calendarOffset === 0}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${themeStyles.card.border}`,
              background: themeStyles.input.background,
              color: calendarOffset === 0 ? themeStyles.textSecondary : themeStyles.text,
              cursor: calendarOffset === 0 ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              opacity: calendarOffset === 0 ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (calendarOffset !== 0) {
                e.currentTarget.style.background = themeStyles.card.background;
                e.currentTarget.style.transform = 'translateX(2px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = themeStyles.input.background;
              e.currentTarget.style.transform = 'translateX(0)';
            }}
            title="Go to next period"
          >
            <AiOutlineRight />
          </button>
        </div>
      </div>
      {/* Weekday Headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap: 'var(--spacing-sm, 8px)',
          marginBottom: 'var(--spacing-xs, 4px)',
        }}
      >
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: '600',
              color: themeStyles.textSecondary,
              padding: '4px',
            }}
          >
            {day}
          </div>
        ))}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap: 'var(--spacing-sm, 8px)',
        }}
      >
        {/* Empty cells for days before the first day of the month */}
        {Array.from({ length: calendarGridStart }).map((_, index) => (
          <div key={`empty-${index}`} />
        ))}
        {calendarDates.map((date, index) => {
          const dateStr = date.toISOString().split('T')[0];
          const dayJobCount = monthlyCountMap.get(dateStr) || 0;
          const isToday = dateStr === new Date().toISOString().split('T')[0];
          const isSelected = dateStr === selectedDate;

          return (
            <button
              key={index}
              onClick={() => onDateSelect(dateStr)}
              style={{
                padding: '16px 12px',
                borderRadius: '12px',
                border: `2px solid ${
                  isSelected ? themeStyles.primaryButton.background : 'transparent'
                }`,
                background: isSelected
                  ? themeStyles.primaryButton.background
                  : isToday
                    ? `${themeStyles.primaryButton.background}15`
                    : themeStyles.card.background,
                color: isSelected ? '#000000' : themeStyles.text,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                position: 'relative',
                transform: isSelected ? 'scale(1.05)' : 'scale(1)',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = themeStyles.input.background;
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = isToday
                    ? `${themeStyles.primaryButton.background}15`
                    : themeStyles.card.background;
                }
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  opacity: 0.8,
                }}
              >
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{date.getDate()}</span>
              {dayJobCount > 0 && (
                <span
                  style={{
                    background: isSelected ? '#000000' : themeStyles.primaryButton.background,
                    color: isSelected ? themeStyles.primaryButton.background : '#000000',
                    borderRadius: '12px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    marginTop: '4px',
                  }}
                >
                  {dayJobCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

