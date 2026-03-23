import React, { useState } from 'react';
import NeumorphicCard from '@/components/ui/NeumorphicCard';
import NeumorphicDatePickerMobile from '@/components/ui/NeumorphicDatePickerMobile';
import NeumorphicTimePickerMobile from '@/components/ui/NeumorphicTimePickerMobile';

export default function StylingMobile() {
  const [date1, setDate1] = useState(null);
  const [date2, setDate2] = useState(new Date());
  const [time1, setTime1] = useState('');
  const [time2, setTime2] = useState('9:00 AM');
  const [time3, setTime3] = useState('');

  return (
    <div className="max-w-md mx-auto space-y-8">
      <NeumorphicCard>
        <h1 className="text-2xl font-normal text-center">Mobile Component Library</h1>
        <p className="text-center mt-2 text-gray-500 text-sm">Touch-optimised date & time pickers</p>
      </NeumorphicCard>

      {/* Date Picker - Mobile */}
      <NeumorphicCard>
        <h2 className="text-xl font-normal mb-4">Date Picker (Mobile)</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Empty State</label>
            <NeumorphicDatePickerMobile
              value={date1}
              onChange={setDate1}
              placeholder="Select date..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">With Value</label>
            <NeumorphicDatePickerMobile
              value={date2}
              onChange={setDate2}
              placeholder="Select date..."
            />
          </div>
        </div>
      </NeumorphicCard>

      {/* Time Picker - Mobile */}
      <NeumorphicCard>
        <h2 className="text-xl font-normal mb-4">Time Picker (Mobile)</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Empty State</label>
            <NeumorphicTimePickerMobile
              value={time1}
              onChange={setTime1}
              placeholder="Select time..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">With Value</label>
            <NeumorphicTimePickerMobile
              value={time2}
              onChange={setTime2}
              placeholder="Select time..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Custom Default (2:30 PM)</label>
            <NeumorphicTimePickerMobile
              value={time3}
              onChange={setTime3}
              placeholder="Select time..."
              defaultTime="2:30 PM"
            />
          </div>
        </div>
      </NeumorphicCard>

      {/* Usage Notes */}
      <NeumorphicCard>
        <h2 className="text-xl font-normal mb-4">Usage Notes</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <p><strong>NeumorphicDatePickerMobile</strong> — Inline calendar that expands below the trigger. Tap to open/close. Tap X to clear.</p>
          <p><strong>NeumorphicTimePickerMobile</strong> — Swipe up/down on hour, minute, or AM/PM rollers to change values. Uses native touch events for reliable Android support. Tap ✓ to confirm, tap when open with no value to close.</p>
          <p className="text-xs text-gray-400 mt-4">These components use native touch listeners instead of pointer events for cross-device compatibility.</p>
        </div>
      </NeumorphicCard>
    </div>
  );
}