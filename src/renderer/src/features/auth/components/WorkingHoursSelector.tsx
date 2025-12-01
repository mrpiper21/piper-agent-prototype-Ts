import React, { useState, useEffect } from 'react';

export interface WorkingHour {
  day: string;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}

interface WorkingHoursSelectorProps {
  value?: WorkingHour[];
  onChange: (hours: WorkingHour[]) => void;
  themeStyles: any;
}

const DAYS = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

export default function WorkingHoursSelector({
  value = [],
  onChange,
  themeStyles,
}: WorkingHoursSelectorProps) {
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>(() => {
    if (value && value.length > 0) {
      return value;
    }
    // Initialize with all days closed
    return DAYS.map((day) => ({
      day: day.value,
      isOpen: false,
      openTime: '',
      closeTime: '',
    }));
  });

  useEffect(() => {
    if (value && value.length > 0) {
      // Merge existing values with default days
      const merged = DAYS.map((day) => {
        const existing = value.find((wh) => wh.day.toLowerCase() === day.value.toLowerCase());
        return existing || { day: day.value, isOpen: false, openTime: '', closeTime: '' };
      });
      setWorkingHours(merged);
    }
  }, [value]);

  const handleToggle = (day: string) => {
    const updated = workingHours.map((wh) =>
      wh.day === day ? { ...wh, isOpen: !wh.isOpen } : wh
    );
    setWorkingHours(updated);
    onChange(updated);
  };

  const handleTimeChange = (day: string, field: 'openTime' | 'closeTime', time: string) => {
    const updated = workingHours.map((wh) =>
      wh.day === day ? { ...wh, [field]: time } : wh
    );
    setWorkingHours(updated);
    onChange(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {workingHours.map((wh) => {
        const dayLabel = DAYS.find((d) => d.value === wh.day)?.label || wh.day;
        return (
          <div
            key={wh.day}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: '6px',
              border: `1px solid ${themeStyles.card.border}`,
              background: themeStyles.card.background,
            }}
          >
            <div style={{ flex: '0 0 100px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  color: themeStyles.text,
                  fontWeight: '500',
                }}
              >
                <input
                  type="checkbox"
                  checked={wh.isOpen}
                  onChange={() => handleToggle(wh.day)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: themeStyles.accent,
                  }}
                />
                <span>{dayLabel}</span>
              </label>
            </div>

            {wh.isOpen && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flex: 1,
                }}
              >
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      color: themeStyles.textSecondary,
                      marginBottom: '4px',
                    }}
                  >
                    Open Time
                  </label>
                  <input
                    type="time"
                    value={wh.openTime || ''}
                    onChange={(e) => handleTimeChange(wh.day, 'openTime', e.target.value)}
                    style={{
                      ...themeStyles.input,
                      padding: '6px 8px',
                      fontSize: '14px',
                      width: '100%',
                      borderRadius: '4px',
                    }}
                  />
                </div>
                <span style={{ color: themeStyles.textSecondary, marginTop: '20px' }}>to</span>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      color: themeStyles.textSecondary,
                      marginBottom: '4px',
                    }}
                  >
                    Close Time
                  </label>
                  <input
                    type="time"
                    value={wh.closeTime || ''}
                    onChange={(e) => handleTimeChange(wh.day, 'closeTime', e.target.value)}
                    style={{
                      ...themeStyles.input,
                      padding: '6px 8px',
                      fontSize: '14px',
                      width: '100%',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>
            )}

            {!wh.isOpen && (
              <span style={{ color: themeStyles.textSecondary, fontSize: '14px' }}>Closed</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

