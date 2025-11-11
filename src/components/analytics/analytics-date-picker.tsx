// src/components/analytics/analytics-date-picker.tsx
// Date Range Picker for Analytics Dashboard - Client Component for interactivity

'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarIcon } from '@radix-ui/react-icons';
import { format, subDays, subWeeks, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface AnalyticsDatePickerProps {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month';
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AnalyticsDatePicker({
  startDate,
  endDate,
  period = 'month'
}: AnalyticsDatePickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize date range from props or default to last 30 days
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date();
    return {
      from: startDate ? new Date(startDate) : subDays(today, 30),
      to: endDate ? new Date(endDate) : today,
    };
  });

  const [selectedPeriod, setSelectedPeriod] = useState(period);
  const [isOpen, setIsOpen] = useState(false);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handlePeriodChange = (newPeriod: 'day' | 'week' | 'month') => {
    setSelectedPeriod(newPeriod);
    
    const today = new Date();
    let newDateRange: DateRange;

    switch (newPeriod) {
      case 'day':
        newDateRange = {
          from: subDays(today, 7),
          to: today,
        };
        break;
      case 'week':
        newDateRange = {
          from: subWeeks(today, 8),
          to: today,
        };
        break;
      case 'month':
        newDateRange = {
          from: subMonths(today, 6),
          to: today,
        };
        break;
      default:
        newDateRange = dateRange;
    }

    setDateRange(newDateRange);
    updateURL(newDateRange, newPeriod);
  };

  const handleDateRangeChange = (range: any) => {
    if (range) {
      setDateRange(range);
      if (range.from && range.to) {
        updateURL(range, selectedPeriod);
        setIsOpen(false);
      }
    }
  };

  const updateURL = (range: DateRange, period: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (range.from) {
      params.set('startDate', format(range.from, 'yyyy-MM-dd'));
    }
    if (range.to) {
      params.set('endDate', format(range.to, 'yyyy-MM-dd'));
    }
    params.set('period', period);

    router.push(`?${params.toString()}`);
  };

  const handleQuickSelect = (days: number) => {
    const today = new Date();
    const newRange: DateRange = {
      from: subDays(today, days),
      to: today,
    };
    
    setDateRange(newRange);
    updateURL(newRange, selectedPeriod);
    setIsOpen(false);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      {/* Period Select */}
      <div className="flex items-center space-x-2">
        <label htmlFor="period-select" className="text-sm font-medium">
          Group by:
        </label>
        <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
          <SelectTrigger id="period-select" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Day</SelectItem>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date Range Picker */}
      <div className="flex items-center space-x-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-72 justify-start text-left font-normal',
                !dateRange.from && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'LLL dd, y')} -{' '}
                    {format(dateRange.to, 'LLL dd, y')}
                  </>
                ) : (
                  format(dateRange.from, 'LLL dd, y')
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 border-b">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect(7)}
                >
                  Last 7 days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect(30)}
                >
                  Last 30 days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect(90)}
                >
                  Last 90 days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect(365)}
                >
                  Last year
                </Button>
              </div>
            </div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={dateRange}
              onSelect={handleDateRangeChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}