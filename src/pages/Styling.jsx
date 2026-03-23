import React, { useState } from 'react';
import NeumorphicCard from '@/components/ui/NeumorphicCard';
import NeumorphicButton from '@/components/ui/NeumorphicButton';
import NeumorphicInput from '@/components/ui/NeumorphicInput';
import NeumorphicToggle from '@/components/ui/NeumorphicToggle';
import NeumorphicSlider from '@/components/ui/NeumorphicSlider';
import NeumorphicSelect from '@/components/ui/NeumorphicSelect';
import NeumorphicTextarea from '@/components/ui/NeumorphicTextarea';
import NeumorphicProgress from '@/components/ui/NeumorphicProgress';
import NeumorphicCheckbox from '@/components/ui/NeumorphicCheckbox';
import NeumorphicRadioGroup from '@/components/ui/NeumorphicRadioGroup';
import NeumorphicTabs from '@/components/ui/NeumorphicTabs';
import NeumorphicAlert from '@/components/ui/NeumorphicAlert';
import NeumorphicBadge from '@/components/ui/NeumorphicBadge';
import RotatableBadge from '@/components/ui/RotatableBadge';
import EditableBadge from '../components/ui/EditableBadge';
// Renamed SelectableBadge (with add functionality) to SelectableEditableBadge
import SelectableBadge from '../components/ui/SelectableBadge'; // This is the NEW dropdown-only SelectableBadge
import SelectableEditableBadge from '../components/ui/SelectableEditableBadge'; // This is the RENAMED original SelectableBadge
import NeumorphicAvatar from '@/components/ui/NeumorphicAvatar';
import NeumorphicJourney from '@/components/ui/NeumorphicJourney';
import NeumorphicNavigation from '@/components/ui/NeumorphicNavigation';
import NeumorphicSizedCard from '@/components/ui/NeumorphicSizedCard';
import NeumorphicModal from '@/components/ui/NeumorphicModal';
import NeumorphicSidePanel from '@/components/ui/NeumorphicSidePanel';
import NeumorphicDatePicker from '@/components/ui/NeumorphicDatePicker';
import NeumorphicTimePicker from '@/components/ui/NeumorphicTimePicker';
import NeumorphicModal2 from '@/components/ui/NeumorphicModal2';
import NeumorphicSidePanel2 from '@/components/ui/NeumorphicSidePanel2';
import NeumorphicSidePanel3 from '@/components/ui/NeumorphicSidePanel3';
import NeumorphicRatingDots from '../components/ui/NeumorphicRatingDots';
import NeumorphicRatingStars from '../components/ui/NeumorphicRatingStars';
// REMOVED: NeumorphicJourneyDesigner and NeumorphicJourneyDesignerV3 imports
// REMOVED: NeumorphicJourneyDesignerV4 import
// REMOVED: NeumorphicJourneyDesignerV5 import
// REMOVED: NeumorphicJourneyDesignerV6 import
import NeumorphicCollapsibleTable from '@/components/ui/NeumorphicCollapsibleTable';
import NeumorphicTable from '@/components/ui/NeumorphicTable';
import {
  User, Settings, Star, Home, FileText, BarChart3, Bell,
  Check, Circle, Activity, ClipboardList, Phone, MessageSquare,
  ChevronDown, RotateCw, Zap, Loader2, Filter, Calendar, Plus, X,
  Info, AlertTriangle, CheckCircle, XCircle
} from 'lucide-react';

import NeumorphicSleepGauge from '../components/ui/NeumorphicSleepGauge';
import NeumorphicActivityGauge from '../components/ui/NeumorphicActivityGauge';
import NeumorphicMixedChart from '../components/charts/NeumorphicMixedChart';
import NeumorphicGoals from '@/components/ui/NeumorphicGoals';

// Add the new import
import NeumorphicIconBadge from '@/components/ui/NeumorphicIconBadge';

export default function StylingPage() {
  const selectOptions = [
    { value: 'option1', label: 'Option One' },
    { value: 'option2', label: 'Option Two' },
    { value: 'option3', label: 'Option Three' },
  ];

  const radioOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  const tableData = [
    { id: 1, item: 'Wellness Journal', category: 'Mindfulness', status: 'Active', details: 'A detailed log of daily wellness activities, including mood tracking, meditation minutes, and gratitude entries. This helps in maintaining a balanced mental state.' },
    { id: 2, item: 'Morning Run', category: 'Fitness', status: 'Completed', details: 'Completed a 5km run this morning. Average pace was 6 min/km. Weather was sunny. Feeling energized for the day.' },
    { id: 3, item: 'Read a Book', category: 'Growth', status: 'Pending', details: 'Plan to read "Atomic Habits" by James Clear. Goal is to read one chapter per day to build consistent reading habits.' },
  ];

  const [generateLoading, setGenerateLoading] = useState(false);
  const [selectedDropdownValue, setSelectedDropdownValue] = useState(''); // Added state for dropdown

  const [editableTags, setEditableTags] = useState(['Health', 'Routine', 'Morning']);
  const [selectableTags, setSelectableTags] = useState(['Health', 'Routine']);
  const [smallBadges, setSmallBadges] = useState(false);

  const [showCenteredModal, setShowCenteredModal] = useState(false);
  const [showSidePanel, setShowSidePanel] = useState(false);

  const [showCenteredModal2, setShowCenteredModal2] = useState(false);
  const [showSidePanel2, setShowSidePanel2] = useState(false);
  const [showSidePanel3, setShowSidePanel3] = useState(false);

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');

  const [sleepHours, setSleepHours] = useState(7.5); // Changed default sleep hours to 7.5
  const [activityLevel, setActivityLevel] = useState('Light');

  const [progressKey, setProgressKey] = useState(0);

  const [dotRating, setDotRating] = useState(3);
  const [starRating, setStarRating] = useState(4);

  const [goals, setGoals] = useState([
    {
      id: '1',
      title: 'Launch new website',
      targetDate: new Date('2024-02-15'),
      completed: false,
      createdDate: new Date()
    },
    {
      id: '2',
      title: 'Complete React certification',
      targetDate: new Date('2024-01-30'),
      completed: true,
      completedDate: new Date('2024-01-28'),
      createdDate: new Date()
    },
    {
      id: '3',
      title: 'Read 12 books this year',
      targetDate: new Date('2024-12-31'),
      completed: false,
      createdDate: new Date()
    },
    {
      id: '4',
      title: 'Learn to cook Italian cuisine',
      targetDate: null,
      completed: false,
      createdDate: new Date()
    }
  ]);

  const handleRefreshProgress = () => {
    setProgressKey(prev => prev + 1);
  };

  const handleGenerateClick = () => {
    setGenerateLoading(true);
    setTimeout(() => setGenerateLoading(false), 3000);
  };

  const subTabs = [
    { label: 'Details', content: <p>Profile details content.</p> },
    { label: 'Activity', content: <p>Recent activity feed.</p> },
  ];

  const tabs = [
    {
      label: 'Profile',
      content: (
        <div>
          <p className="mb-4">This is the main profile content area. It can contain other components, like these sub-tabs.</p>
          <NeumorphicTabs tabs={subTabs} variant="sub" />
        </div>
      )
    },
    { label: 'Settings', content: <p>This is the settings content area.</p> },
    { label: 'Notifications', content: <p>This is the notifications content area.</p> },
  ];

  const journeyMilestones = [
    {
      title: 'Project Kick-off',
      status: 'completed',
      description: 'Initial planning and team alignment.',
      date: 'Jan 15',
      steps: [
        { title: 'Define Scope', status: 'completed', date: 'Jan 15', type: 'assignment' },
        { title: 'Allocate Resources', status: 'completed', date: 'Jan 16', type: 'check-in' }
      ]
    },
    {
      title: 'Design Phase',
      status: 'current',
      description: 'Creating wireframes and mockups.',
      date: 'Jan 22',
      steps: [
        { title: 'User Research', status: 'completed', date: 'Jan 20', type: 'assignment' },
        { title: 'UI/UX Design', status: 'completed', date: 'Jan 24', type: 'assignment' },
        { title: 'Prototype Testing', status: 'overdue', date: 'Jan 25', type: 'session' }
      ]
    },
    {
      title: 'Development',
      status: 'pending',
      description: 'Building the core application.',
      date: 'Feb 1',
      steps: [
        { title: 'Frontend Setup', status: 'pending', date: 'Feb 1', type: 'assignment' },
        { title: 'Backend API', status: 'pending', date: 'Feb 5', type: 'assignment' },
        { title: 'Database Integration', status: 'pending', date: 'Feb 10', type: 'check-in' }
      ]
    },
    {
      title: 'Deployment',
      status: 'pending',
      description: 'Launching the application.',
      date: 'Feb 15',
      steps: []
    },
  ];

  const colorPalette = [
    { name: 'Primary', color: '#2f949d', usage: 'Primary actions, active states', muted: '#6bb6c0', dark: '#0f3a3e' },
    { name: 'Background', color: '#f0f2f5', usage: 'Main background color', dark: '#d1d5db' },
    { name: 'Text', color: '#4a5568', usage: 'Primary text color', dark: '#1f2937' },
    { name: 'Light Shadow', color: '#ffffff', usage: 'Light shadow for neumorphic effect', dark: '#e5e7eb' },
    { name: 'Dark Shadow', color: '#d1d9e6', usage: 'Dark shadow for neumorphic effect', dark: '#6b7280' },
    { name: 'Text Muted', color: '#718096', usage: 'Secondary text, descriptions', muted: '#9ca3af', dark: '#2d3748' },
    { name: 'Success', color: '#48bb78', usage: 'Success states, confirmations', muted: '#68d391', dark: '#1a4731' },
    { name: 'Warning', color: '#ed8936', usage: 'Warning states, cautions', muted: '#f6ad55', dark: '#8b4513' },
    { name: 'Error', color: '#f56565', usage: 'Error states, destructive actions', muted: '#fc8181', dark: '#9b2c2c' },
    { name: 'Info', color: '#4299e1', usage: 'Informational states, neutral actions', muted: '#63b3ed', dark: '#1e5a96' },
    { name: 'Learning', color: '#ec4899', usage: 'Learning step types, educational content', muted: '#f093c4', dark: '#8b2661' },
    { name: 'Check-in', color: '#8b5cf6', usage: 'Check-in step types, review actions', muted: '#a78bfa', dark: '#553c9a' },
    { name: 'Accent Yellow', color: '#f6d55c', usage: 'Highlight accents, attention drawing', muted: '#f7dd72', dark: '#b7791f' },
  ];

  const iconsList = [
    { name: 'User', component: User },
    { name: 'Settings', component: Settings },
    { name: 'Star', component: Star },
    { name: 'Home', component: Home },
    { name: 'FileText', component: FileText },
    { name: 'BarChart3', component: BarChart3 },
    { name: 'Bell', component: Bell },
    { name: 'Check', component: Check },
    { name: 'Circle', component: Circle },
    { name: 'Activity', component: Activity },
    { name: 'ClipboardList', component: ClipboardList },
    { name: 'Phone', component: Phone },
    { name: 'MessageSquare', component: MessageSquare },
    { name: 'ChevronDown', component: ChevronDown },
    { name: 'RotateCw', component: RotateCw },
    { name: 'Zap', component: Zap },
    { name: 'Loader2', component: Loader2 },
    { name: 'Filter', component: Filter },
    { name: 'Calendar', component: Calendar },
    { name: 'Plus', component: Plus },
    { name: 'Info', component: Info },
    { name: 'AlertTriangle', component: AlertTriangle },
    { name: 'CheckCircle', component: CheckCircle },
    { name: 'XCircle', component: XCircle },
    { name: 'X', component: X },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <style>{`
        .neumorphic-step-hover {
          transition: all 0.2s ease-in-out;
        }
        .neumorphic-step-hover:hover {
          transform: translateY(-2px);
          box-shadow: var(--nm-shadow-hover);
        }

        /* Soft, natural colour easing for the Generate button only */
        .btn-generate {
          transition-property: background-color, color, border-color, box-shadow;
          transition-duration: 320ms;
          transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1); /* easeOutExpo-ish */
        }

        /* Accessibility: reduce motion if the user prefers */
        @media (prefers-reduced-motion: reduce) {
          .btn-generate {
            transition-duration: 0.01ms;
            transition-timing-function: linear;
          }
        }
      `}</style>

      <NeumorphicCard>
        <h1 className="text-4xl font-normal text-center">Design System Guide</h1>
        <p className="text-center mt-2 text-gray-600">Complete reference for all UI components, colors, and patterns.</p>
      </NeumorphicCard>

      {/* Color Palette */}
      <NeumorphicCard>
        <h2 className="text-2xl font-normal mb-6">Color Palette</h2>

        <NeumorphicTabs
          tabs={[
            {
              label: 'Standard',
              content: (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {colorPalette.map((color, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-lg shadow-inner"
                          style={{ backgroundColor: color.color }}
                        />
                        <div>
                          <h4 className="font-semibold">{color.name}</h4>
                          <p className="text-sm text-gray-500 font-mono">{color.color}</p>
                          <p className="text-xs text-gray-400">{color.usage}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            },
            {
              label: 'Muted',
              content: (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {colorPalette.filter(color => color.muted).map((color, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-lg shadow-inner"
                          style={{ backgroundColor: color.muted }}
                        />
                        <div>
                          <h4 className="font-semibold">{color.name} (Muted)</h4>
                          <p className="text-sm text-gray-500 font-mono">{color.muted}</p>
                          <p className="text-xs text-gray-400">Used for solid badges</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            },
            {
              label: 'Dark',
              content: (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {colorPalette.filter(color => color.dark).map((color, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-lg shadow-inner"
                          style={{ backgroundColor: color.dark }}
                        />
                        <div>
                          <h4 className="font-semibold">{color.name} (Dark)</h4>
                          <p className="text-sm text-gray-500 font-mono">{color.dark}</p>
                          <p className="text-xs text-gray-400">Used for solid badge text</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          ]}
          variant="sub"
        />
      </NeumorphicCard>

      {/* Chart Visualizations */}
      <NeumorphicCard>
        <h2 className="text-2xl font-normal mb-6">Chart Visualizations</h2>

        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-normal mb-4 text-gray-600">Health Score Chart</h3>
            <p className="text-gray-600 mb-6">
              Track health metrics over time with detailed breakdowns on hover.
            </p>
            <NeumorphicMixedChart chartType="health" />
          </div>
        </div>
      </NeumorphicCard>

      {/* Icons */}
      <NeumorphicCard>
        <h2 className="text-2xl font-normal mb-6">Icon Library</h2>
        <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-4">
          {iconsList.map((icon, index) => {
            const IconComponent = icon.component;
            return (
              <div key={index} className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <IconComponent className="w-6 h-6 text-gray-600" />
                <span className="text-xs text-center font-mono">{icon.name}</span>
              </div>
            );
          })}
        </div>
      </NeumorphicCard>

      {/* Sleep Gauge */}
      <NeumorphicCard>
        <h2 className="text-2xl font-normal mb-6">Sleep Gauge</h2>
        <div className="flex flex-col items-center space-y-4">
          <NeumorphicSleepGauge
            value={sleepHours}
            onChange={setSleepHours}
          />
        </div>
      </NeumorphicCard>

      {/* Activity Gauge */}
      <NeumorphicCard>
        <h2 className="text-2xl font-normal mb-6">Activity Gauge</h2>
        <div className="flex flex-col items-center space-y-4">
          <NeumorphicActivityGauge
            value={activityLevel}
            onChange={setActivityLevel}
          />
        </div>
      </NeumorphicCard>

      {/* Navigation */}
      <NeumorphicCard>
        <h2 className="text-2xl font-normal mb-6">Left Navigation</h2>
        <div className="flex justify-center">
          <NeumorphicNavigation />
        </div>
      </NeumorphicCard>

      {/* Modals */}
      <NeumorphicCard>
        <h2 className="text-2xl font-normal mb-6">Modal Components</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-normal mb-3 text-gray-600">Centered Modal</h3>
            <p className="text-sm text-gray-500 mb-4">
              Best for quick actions, confirmations, and alerts. Responsive design adapts to mobile screens.
            </p>
            <div className="flex gap-3">
              <NeumorphicButton
                variant="primary"
                onClick={() => setShowCenteredModal(true)}
              >
                Open Centered Modal
              </NeumorphicButton>
              <NeumorphicButton
                variant="primary"
                onClick={() => setShowCenteredModal2(true)}
              >
                Open Centered Modal 2
              </NeumorphicButton>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-normal mb-3 text-gray-600">Side Panel Modal</h3>
            <p className="text-sm text-gray-500 mb-4">
              Best for adding/editing details and forms. Takes 30-50% width on desktop, full-screen on mobile.
            </p>
            <div className="flex gap-3">
              <NeumorphicButton
                variant="primary"
                onClick={() => setShowSidePanel(true)}
              >
                Open Side Panel
              </NeumorphicButton>
              <NeumorphicButton
                variant="primary"
                onClick={() => setShowSidePanel2(true)}
              >
                Open Side Panel 2
              </NeumorphicButton>
              <NeumorphicButton
                variant="primary"
                onClick={() => setShowSidePanel3(true)}
              >
                Open Side Panel 3
              </NeumorphicButton>
            </div>
          </div>
        </div>
      </NeumorphicCard>

      {/* Card Sizes */}
      <NeumorphicCard>
        <h2 className="text-2xl font-normal mb-6">Card Sizes</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-normal mb-3 text-gray-600">Static Versions</h3>
            <div className="space-y-4">
              <NeumorphicSizedCard size="100%">
                <h4 className="font-semibold mb-3">100% Width</h4>
                <p className="text-sm text-gray-600 mb-4">Full width card for main content sections or large data displays. Occupies the full container width.</p>
                <div className="flex gap-3">
                  <NeumorphicButton variant="primary">Primary</NeumorphicButton>
                  <NeumorphicButton>Secondary</NeumorphicButton>
                </div>
              </NeumorphicSizedCard>

              <NeumorphicSizedCard size="75%">
                <h4 className="font-semibold mb-3">75% Width</h4>
                <p className="text-sm text-gray-600 mb-4">Large content area for detailed information, complex forms, or multiple sections. Ideal for dashboard widgets.</p>
                <div className="flex gap-3">
                  <NeumorphicButton variant="primary">Primary</NeumorphicButton>
                  <NeumorphicButton>Secondary</NeumorphicButton>
                </div>
              </NeumorphicSizedCard>

              <NeumorphicSizedCard size="50%">
                <h4 className="font-semibold mb-2">50% Width</h4>
                <p className="text-sm text-gray-600 mb-3">Medium content card with moderate amount of information. Good for forms and common use cases.</p>
                <NeumorphicButton variant="primary">Action</NeumorphicButton>
              </NeumorphicSizedCard>

              <NeumorphicSizedCard size="25%">
                <h4 className="font-semibold mb-2">25% Width</h4>
                <p className="text-sm text-gray-600">Small content with basic info.</p>
              </NeumorphicSizedCard>

              <NeumorphicSizedCard size="15%">
                <h4 className="font-semibold mb-1">15% Width</h4>
                <p className="text-sm text-gray-600">Compact</p>
              </NeumorphicSizedCard>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-normal mb-3 text-gray-600">Collapsible Versions</h3>
            <div className="space-y-4">
              <NeumorphicSizedCard
                collapsible
                title="100% Width Card"
                defaultOpen={false}
                size="100%"
              >
                <h4 className="font-semibold mb-3">100% Width</h4>
                <p className="text-sm text-gray-600 mb-4">Full width card for main content sections or large data displays. Occupies the full container width.</p>
                <div className="flex gap-3">
                  <NeumorphicButton variant="primary">Primary</NeumorphicButton>
                  <NeumorphicButton>Secondary</NeumorphicButton>
                </div>
              </NeumorphicSizedCard>

              <NeumorphicSizedCard
                collapsible
                title="75% Width Card"
                defaultOpen={false}
                size="75%"
              >
                <h4 className="font-semibold mb-3">75% Width</h4>
                <p className="text-sm text-gray-600 mb-4">Large content area for detailed information, complex forms, or multiple sections. Ideal for dashboard widgets.</p>
                <div className="flex gap-3">
                  <NeumorphicButton variant="primary">Primary</NeumorphicButton>
                  <NeumorphicButton>Secondary</NeumorphicButton>
                </div>
              </NeumorphicSizedCard>

              <NeumorphicSizedCard
                collapsible
                title="50% Width Card"
                defaultOpen={false}
                size="50%"
              >
                <h4 className="font-semibold mb-2">50% Width</h4>
                <p className="text-sm text-gray-600 mb-3">Medium content card with moderate amount of information. Good for forms and common use cases.</p>
                <NeumorphicButton variant="primary">Action</NeumorphicButton>
              </NeumorphicSizedCard>

              <NeumorphicSizedCard
                collapsible
                title="25% Width Card"
                defaultOpen={false}
                size="25%"
              >
                <h4 className="font-semibold mb-2">25% Width</h4>
                <p className="text-sm text-gray-600">Small content with basic info.</p>
              </NeumorphicSizedCard>

              <NeumorphicSizedCard
                collapsible
                title="15% Width Card"
                defaultOpen={false}
                size="15%"
              >
                <h4 className="font-semibold mb-1">15% Width</h4>
                <p className="text-sm text-gray-600">Compact</p>
              </NeumorphicSizedCard>
            </div>
          </div>
        </div>
      </NeumorphicCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-12">
          {/* Typography */}
          <NeumorphicCard>
            <h2 className="text-2xl font-normal mb-6">Typography</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-baseline">
                  <h3 className="text-xl font-normal text-gray-800">Headings</h3>
                  <span className="text-xs font-mono text-gray-400">Reference</span>
                </div>
                <div className="p-4 bg-gray-100 rounded-lg space-y-2">
                  <div className="flex justify-between items-center"><h1 className="text-4xl font-normal">Heading 1</h1><code className="text-sm">text-4xl</code></div>
                  <div className="flex justify-between items-center"><h2 className="text-3xl font-normal">Heading 2</h2><code className="text-sm">text-3xl</code></div>
                  <div className="flex justify-between items-center"><h3 className="text-2xl font-normal">Heading 3</h3><code className="text-sm">text-2xl</code></div>
                  <div className="flex justify-between items-center"><h4 className="text-xl font-normal">Heading 4</h4><code className="text-sm">text-xl</code></div>
                  <div className="flex justify-between items-center"><h5 className="text-lg font-normal">Heading 5</h5><code className="text-sm">text-lg</code></div>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-normal text-gray-800">Body & Paragraphs</h3>
                <div className="p-4 bg-gray-100 rounded-lg space-y-2">
                  <div className="flex justify-between items-start"><p className="text-base flex-1">Standard body text. Used for descriptions and general content.</p><code className="text-sm ml-4">text-base</code></div>
                  <div className="flex justify-between items-start"><p className="text-sm text-gray-600 flex-1">Smaller body text for secondary information.</p><code className="text-sm ml-4">text-sm</code></div>
                  <div className="flex justify-between items-start"><p className="text-xs text-gray-500 flex-1">Smallest text for footnotes or tertiary details.</p><code className="text-sm ml-4">text-xs</code></div>
                </div>
              </div>
               <div>
                <h3 className="text-xl font-normal text-gray-800">UI Elements</h3>
                <div className="p-4 bg-gray-100 rounded-lg space-y-2">
                  <div className="flex justify-between items-center"><p className="font-normal text-base">Button Text</p><code className="text-sm">font-normal</code></div>
                  <div className="flex justify-between items-center"><p className="font-medium text-sm">Badge Text</p><code className="text-sm">font-medium</code></div>
                  <div className="flex justify-between items-center"><p className="font-normal text-base">Input & Field Text</p><code className="text-sm">font-normal</code></div>
                </div>
              </div>
            </div>
          </NeumorphicCard>

          {/* Buttons */}
          <NeumorphicCard>
            <h2 className="text-2xl font-normal mb-4">Buttons</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-normal mb-3 text-gray-600">Default Size</h3>
                <div className="flex flex-wrap gap-4 items-center">
                  <NeumorphicButton>Secondary</NeumorphicButton>
                  <NeumorphicButton variant="primary">Primary</NeumorphicButton>
                  <NeumorphicButton icon={Star}>Icon</NeumorphicButton>
                  <NeumorphicButton
                    variant="generate"
                    loading={generateLoading}
                    onClick={handleGenerateClick}
                    className="btn-generate"
                  >
                    Generate
                  </NeumorphicButton>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-normal mb-3 text-gray-600">Small Size</h3>
                 <div className="flex flex-wrap gap-4 items-center">
                  <NeumorphicButton size="sm">Secondary</NeumorphicButton>
                  <NeumorphicButton size="sm" variant="primary">Primary</NeumorphicButton>
                  <NeumorphicButton size="sm" icon={Star}>Icon</NeumorphicButton>
                  <NeumorphicButton
                    size="sm"
                    variant="generate"
                    loading={generateLoading}
                    onClick={handleGenerateClick}
                    className="btn-generate"
                  >
                    Generate
                  </NeumorphicButton>
                </div>
              </div>
            </div>
          </NeumorphicCard>

          {/* Badges */}
          <NeumorphicCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-normal">Badges</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm" style={{ color: 'var(--nm-text-color)' }}>{smallBadges ? 'Small' : 'Large'}</span>
                <NeumorphicToggle checked={smallBadges} onCheckedChange={setSmallBadges} />
              </div>
            </div>

            <NeumorphicTabs
              tabs={[
                {
                  label: 'Outline',
                  content: (
                    <div className="space-y-6">
                      {/* All Badge Variants */}
                      <div>
                        <h3 className="text-lg font-normal mb-3">All Badge Variants</h3>
                        <div className="flex flex-wrap gap-3 items-center">
                          <NeumorphicBadge variant="default" size={smallBadges ? 'sm' : 'md'}>Default</NeumorphicBadge>
                          <NeumorphicBadge variant="primary" size={smallBadges ? 'sm' : 'md'}>Primary</NeumorphicBadge>
                          <NeumorphicBadge variant="success" size={smallBadges ? 'sm' : 'md'}>Success</NeumorphicBadge>
                          <NeumorphicBadge variant="warning" size={smallBadges ? 'sm' : 'md'}>Warning</NeumorphicBadge>
                          <NeumorphicBadge variant="error" size={smallBadges ? 'sm' : 'md'}>Error</NeumorphicBadge>
                          <NeumorphicBadge variant="info" size={smallBadges ? 'sm' : 'md'}>Info</NeumorphicBadge>
                          <NeumorphicBadge variant="learning" size={smallBadges ? 'sm' : 'md'}>Learning</NeumorphicBadge>
                          <NeumorphicBadge variant="checkin" size={smallBadges ? 'sm' : 'md'}>Check-in</NeumorphicBadge>
                          <NeumorphicBadge variant="accent" size={smallBadges ? 'sm' : 'md'}>Accent</NeumorphicBadge>
                        </div>
                      </div>

                      {/* Categories & Tags */}
                      <div>
                        <h3 className="text-lg font-normal mb-3">Categories & Tags</h3>
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Category Badges (Various Colors)</h4>
                            <div className="flex flex-wrap gap-3">
                              <NeumorphicBadge variant="category" size={smallBadges ? 'sm' : 'md'}>Health</NeumorphicBadge>
                              <NeumorphicBadge variant="success" size={smallBadges ? 'sm' : 'md'}>Fitness</NeumorphicBadge>
                              <NeumorphicBadge variant="warning" size={smallBadges ? 'sm' : 'md'}>Work</NeumorphicBadge>
                              <NeumorphicBadge variant="learning" size={smallBadges ? 'sm' : 'md'}>Learning</NeumorphicBadge>
                              <NeumorphicBadge variant="info" size={smallBadges ? 'sm' : 'md'}>Personal</NeumorphicBadge>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Tag Badges (Various Colors)</h4>
                            <div className="flex flex-wrap gap-3">
                              <NeumorphicBadge variant="tag" size={smallBadges ? 'sm' : 'md'}>Routine</NeumorphicBadge>
                              <NeumorphicBadge variant="primary" size={smallBadges ? 'sm' : 'md'}>Important</NeumorphicBadge>
                              <NeumorphicBadge variant="accent" size={smallBadges ? 'sm' : 'md'}>Featured</NeumorphicBadge>
                              <NeumorphicBadge variant="checkin" size={smallBadges ? 'sm' : 'md'}>Review</NeumorphicBadge>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Rotatable Badges */}
                      <div>
                        <h3 className="text-lg font-normal mb-3">Rotatable Badges</h3>
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Single Color Rotation</h4>
                            <div className="flex flex-wrap gap-4">
                              <RotatableBadge states={['Badge 1', 'Badge 2', 'Badge 3']} variant="primary" />
                              <RotatableBadge states={['Pending', 'In Progress', 'Done']} variant="success" />
                              <RotatableBadge states={['Low', 'Medium', 'High']} variant="warning" />
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Multi-Color Rotation</h4>
                            <div className="flex flex-wrap gap-4">
                              <RotatableBadge
                                states={['Todo', 'In Progress', 'Done']}
                                colors={['default', 'warning', 'success']}
                              />
                              <RotatableBadge
                                states={['Low', 'Medium', 'High']}
                                colors={['info', 'warning', 'error']}
                              />
                              <RotatableBadge
                                states={['Draft', 'Review', 'Published']}
                                colors={['default', 'accent', 'success']}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Editable Badges */}
                      <div>
                        <h3 className="text-lg font-normal mb-3">Editable Badges (Various Colors)</h3>
                        <EditableBadge
                          badges={editableTags}
                          onAdd={(newTag) => {
                            if (newTag && !editableTags.includes(newTag)) {
                              setEditableTags([...editableTags, newTag]);
                            }
                          }}
                          onRemove={(index) => {
                            setEditableTags(editableTags.filter((_, i) => i !== index));
                          }}
                          variant="category"
                          size={smallBadges ? 'sm' : 'md'}
                          placeholder="add tag..."
                        />
                        <p className="text-sm text-gray-500 mt-2">
                          <strong>Color Variety:</strong> Editable badges automatically cycle through different color variants for visual distinction.
                        </p>
                      </div>

                      {/* Selectable Badges (Dropdown Only) */}
                      <div>
                        <h3 className="text-lg font-normal mb-3">Selectable Badges (Dropdown Selection Only)</h3>
                        <SelectableBadge
                          badges={selectableTags}
                          onAdd={(newTag) => {
                            if (newTag && !selectableTags.includes(newTag)) {
                              setSelectableTags([...selectableTags, newTag]);
                            }
                          }}
                          onRemove={(index) => {
                            setSelectableTags(selectableTags.filter((_, i) => i !== index));
                          }}
                          options={[
                            'Weight Loss',
                            'Nutrition',
                            'Fitness',
                            'Mindfulness',
                            'Health',
                            'Routine',
                            'Morning',
                            'Evening',
                            'Work',
                            'Personal',
                            'Learning',
                            'Growth'
                          ]}
                          variant="category"
                          size={smallBadges ? 'sm' : 'md'}
                          placeholder="Select category..."
                        />
                        <p className="text-sm text-gray-500 mt-2">
                          <strong>Dropdown Only:</strong> Select from predefined options via dropdown. No "Add New" functionality.
                        </p>
                      </div>

                      {/* Selectable Editable Badges (Dropdown + Add New) */}
                      <div>
                        <h3 className="text-lg font-normal mb-3">Selectable Editable Badges (Dropdown + Add New)</h3>
                        <SelectableEditableBadge
                          badges={selectableTags}
                          onAdd={(newTag) => {
                            if (newTag && !selectableTags.includes(newTag)) {
                              setSelectableTags([...selectableTags, newTag]);
                            }
                          }}
                          onRemove={(index) => {
                            setSelectableTags(selectableTags.filter((_, i) => i !== index));
                          }}
                          options={[
                            'Weight Loss',
                            'Nutrition',
                            'Fitness',
                            'Mindfulness',
                            'Health',
                            'Routine',
                            'Morning',
                            'Evening',
                            'Work',
                            'Personal',
                            'Learning',
                            'Growth'
                          ]}
                          variant="category"
                          size={smallBadges ? 'sm' : 'md'}
                          placeholder="Select category..."
                        />
                        <p className="text-sm text-gray-500 mt-2">
                          <strong>Dropdown + Add New:</strong> Select from predefined options OR add new custom entries via input field.
                        </p>
                      </div>
                    </div>
                  )
                },
                {
                  label: 'Coloured',
                  content: (
                    <div className="space-y-6">
                      {/* All Solid Badge Variants */}
                      <div>
                        <h3 className="text-lg font-normal mb-3">All Solid Badge Variants</h3>
                        <div className="flex flex-wrap gap-3 items-center">
                          <NeumorphicBadge variant="default" solid size={smallBadges ? 'sm' : 'md'}>Default</NeumorphicBadge>
                          <NeumorphicBadge variant="primary" solid size={smallBadges ? 'sm' : 'md'}>Primary</NeumorphicBadge>
                          <NeumorphicBadge variant="success" solid size={smallBadges ? 'sm' : 'md'}>Success</NeumorphicBadge>
                          <NeumorphicBadge variant="warning" solid size={smallBadges ? 'sm' : 'md'}>Warning</NeumorphicBadge>
                          <NeumorphicBadge variant="error" solid size={smallBadges ? 'sm' : 'md'}>Error</NeumorphicBadge>
                          <NeumorphicBadge variant="info" solid size={smallBadges ? 'sm' : 'md'}>Info</NeumorphicBadge>
                          <NeumorphicBadge variant="learning" solid size={smallBadges ? 'sm' : 'md'}>Learning</NeumorphicBadge>
                          <NeumorphicBadge variant="checkin" solid size={smallBadges ? 'sm' : 'md'}>Check-in</NeumorphicBadge>
                          <NeumorphicBadge variant="accent" solid size={smallBadges ? 'sm' : 'md'}>Accent</NeumorphicBadge>
                        </div>
                      </div>

                      {/* Solid Categories & Tags */}
                      <div>
                        <h3 className="text-lg font-normal mb-3">Solid Categories & Tags</h3>
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Solid Category Badges</h4>
                            <div className="flex flex-wrap gap-3">
                              <NeumorphicBadge variant="category" solid size={smallBadges ? 'sm' : 'md'}>Health</NeumorphicBadge>
                              <NeumorphicBadge variant="success" solid size={smallBadges ? 'sm' : 'md'}>Fitness</NeumorphicBadge>
                              <NeumorphicBadge variant="warning" solid size={smallBadges ? 'sm' : 'md'}>Work</NeumorphicBadge>
                              <NeumorphicBadge variant="learning" solid size={smallBadges ? 'sm' : 'md'}>Learning</NeumorphicBadge>
                              <NeumorphicBadge variant="info" solid size={smallBadges ? 'sm' : 'md'}>Personal</NeumorphicBadge>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Solid Tag Badges</h4>
                            <div className="flex flex-wrap gap-3">
                              <NeumorphicBadge variant="tag" solid size={smallBadges ? 'sm' : 'md'}>Routine</NeumorphicBadge>
                              <NeumorphicBadge variant="primary" solid size={smallBadges ? 'sm' : 'md'}>Important</NeumorphicBadge>
                              <NeumorphicBadge variant="accent" solid size={smallBadges ? 'sm' : 'md'}>Featured</NeumorphicBadge>
                              <NeumorphicBadge variant="checkin" solid size={smallBadges ? 'sm' : 'md'}>Review</NeumorphicBadge>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Solid Rotatable Badges */}
                      <div>
                        <h3 className="text-lg font-normal mb-3">Solid Rotatable Badges</h3>
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Single Color Rotation</h4>
                            <div className="flex flex-wrap gap-4">
                              <RotatableBadge states={['Badge 1', 'Badge 2', 'Badge 3']} variant="primary" solid />
                              <RotatableBadge states={['Pending', 'In Progress', 'Done']} variant="success" solid />
                              <RotatableBadge states={['Low', 'Medium', 'High']} variant="warning" solid />
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Multi-Color Rotation</h4>
                            <div className="flex flex-wrap gap-4">
                              <RotatableBadge
                                states={['Todo', 'In Progress', 'Done']}
                                colors={['default', 'warning', 'success']}
                                solid
                              />
                              <RotatableBadge
                                states={['Low', 'Medium', 'High']}
                                colors={['info', 'warning', 'error']}
                                solid
                              />
                              <RotatableBadge
                                states={['Draft', 'Review', 'Published']}
                                colors={['default', 'accent', 'success']}
                                solid
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Solid Editable Badges */}
                      <div>
                        <h3 className="text-lg font-normal mb-3">Solid Editable Badges</h3>
                        <EditableBadge
                          badges={editableTags}
                          onAdd={(newTag) => {
                            if (newTag && !editableTags.includes(newTag)) {
                              setEditableTags([...editableTags, newTag]);
                            }
                          }}
                          onRemove={(index) => {
                            setEditableTags(editableTags.filter((_, i) => i !== index));
                          }}
                          variant="category"
                          size={smallBadges ? 'sm' : 'md'}
                          placeholder="add solid tag..."
                          solid
                        />
                        <p className="text-sm text-gray-500 mt-2">
                          <strong>Solid Colors:</strong> Solid editable badges use full color backgrounds with white text for better contrast.
                        </p>
                      </div>

                      {/* Solid Selectable Badges (Dropdown Only) */}
                      <div>
                        <h3 className="text-lg font-normal mb-3">Solid Selectable Badges (Dropdown Only)</h3>
                        <SelectableBadge
                          badges={selectableTags}
                          onAdd={(newTag) => {
                            if (newTag && !selectableTags.includes(newTag)) {
                              setSelectableTags([...selectableTags, newTag]);
                            }
                          }}
                          onRemove={(index) => {
                            setSelectableTags(selectableTags.filter((_, i) => i !== index));
                          }}
                          options={[
                            'Weight Loss',
                            'Nutrition',
                            'Fitness',
                            'Mindfulness',
                            'Health',
                            'Routine',
                            'Morning',
                            'Evening',
                            'Work',
                            'Personal',
                            'Learning',
                            'Growth'
                          ]}
                          variant="category"
                          size={smallBadges ? 'sm' : 'md'}
                          placeholder="Select category..."
                          solid
                        />
                        <p className="text-sm text-gray-500 mt-2">
                          <strong>Solid Dropdown Only:</strong> Solid selectable badges with dropdown selection functionality only.
                        </p>
                      </div>

                      {/* Solid Selectable Editable Badges (Dropdown + Add New) */}
                      <div>
                        <h3 className="text-lg font-normal mb-3">Solid Selectable Editable Badges (Dropdown + Add New)</h3>
                        <SelectableEditableBadge
                          badges={selectableTags}
                          onAdd={(newTag) => {
                            if (newTag && !selectableTags.includes(newTag)) {
                              setSelectableTags([...selectableTags, newTag]);
                            }
                          }}
                          onRemove={(index) => {
                            setSelectableTags(selectableTags.filter((_, i) => i !== index));
                          }}
                          options={[
                            'Weight Loss',
                            'Nutrition',
                            'Fitness',
                            'Mindfulness',
                            'Health',
                            'Routine',
                            'Morning',
                            'Evening',
                            'Work',
                            'Personal',
                            'Learning',
                            'Growth'
                          ]}
                          variant="category"
                          size={smallBadges ? 'sm' : 'md'}
                          placeholder="Select category..."
                          solid
                        />
                        <p className="text-sm text-gray-500 mt-2">
                          <strong>Solid Dropdown + Add New:</strong> Solid selectable badges with both dropdown selection and custom input functionality.
                        </p>
                      </div>
                    </div>
                  )
                }
              ]}
              variant="sub"
            />
          </NeumorphicCard>

          {/* Avatars */}
          <NeumorphicCard>
            <h2 className="text-2xl font-normal mb-4">Avatars</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-normal mb-3 text-gray-600">Standard Sizes</h3>
                <div className="flex flex-wrap gap-6 items-center">
                  <NeumorphicAvatar size="sm" initials="SM" />
                  <NeumorphicAvatar size="smPlus" initials="SM+" />
                  <NeumorphicAvatar size="md" initials="MD" />
                  <NeumorphicAvatar size="lg" initials="LG" />
                  <NeumorphicAvatar size="xl" initials="XL" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-normal mb-3 text-gray-600">With Badges</h3>
                <div className="flex flex-wrap gap-6 items-center">
                  <NeumorphicAvatar size="md" initials="JD" badge="3" />
                  <NeumorphicAvatar size="lg" initials="AB" badge="!" />
                  <NeumorphicAvatar size="xl" initials="MX" badge="99+" />
                </div>
              </div>
            </div>
          </NeumorphicCard>

          {/* Icon Badges */}
          <NeumorphicCard>
            <h2 className="text-2xl font-normal mb-4">Icon Badges</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-normal mb-3 text-gray-600">Standard Sizes</h3>
                <div className="flex flex-wrap gap-6 items-center">
                  <NeumorphicIconBadge size="sm" icon={User} />
                  <NeumorphicIconBadge size="smPlus" icon={Settings} />
                  <NeumorphicIconBadge size="md" icon={Home} />
                  <NeumorphicIconBadge size="lg" icon={Star} />
                  <NeumorphicIconBadge size="xl" icon={Bell} />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-normal mb-3 text-gray-600">Color Variants</h3>
                <div className="flex flex-wrap gap-4 items-center">
                  <NeumorphicIconBadge icon={User} variant="default" />
                  <NeumorphicIconBadge icon={Settings} variant="primary" />
                  <NeumorphicIconBadge icon={CheckCircle} variant="success" />
                  <NeumorphicIconBadge icon={AlertTriangle} variant="warning" />
                  <NeumorphicIconBadge icon={XCircle} variant="error" />
                  <NeumorphicIconBadge icon={Info} variant="info" />
                  <NeumorphicIconBadge icon={FileText} variant="learning" />
                  <NeumorphicIconBadge icon={Activity} variant="checkin" />
                  <NeumorphicIconBadge icon={Star} variant="accent" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-normal mb-3 text-gray-600">With Badges</h3>
                <div className="flex flex-wrap gap-6 items-center">
                  <NeumorphicIconBadge size="md" icon={Bell} variant="primary" badge="3" />
                  <NeumorphicIconBadge size="lg" icon={MessageSquare} variant="accent" badge="!" />
                  <NeumorphicIconBadge size="xl" icon={Activity} variant="success" badge="99+" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-normal mb-3 text-gray-600">Interactive (Clickable)</h3>
                <div className="flex flex-wrap gap-4 items-center">
                  <NeumorphicIconBadge
                    icon={Home}
                    variant="primary"
                    clickable
                    onClick={() => alert('Home clicked!')}
                  />
                  <NeumorphicIconBadge
                    icon={Settings}
                    variant="warning"
                    clickable
                    onClick={() => alert('Settings clicked!')}
                  />
                  <NeumorphicIconBadge
                    icon={Bell}
                    variant="accent"
                    clickable
                    onClick={() => alert('Notifications clicked!')}
                    badge="5"
                  />
                </div>
              </div>
            </div>
          </NeumorphicCard>

          {/* Progress & Sliders */}
          <NeumorphicCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-normal">Progress & Sliders</h2>
              <button
                onClick={handleRefreshProgress}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                style={{
                  borderRadius: '50%',
                  background: 'var(--nm-background)',
                  boxShadow: 'var(--nm-shadow-main)',
                }}
              >
                <RotateCw className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="space-y-6">
               <div>
                <h3 className="text-xl font-normal mb-3">Progress Bar</h3>
                <NeumorphicProgress value={65} animated={true} key={progressKey} />
              </div>
              <div>
                <h3 className="text-xl font-normal mb-3">Slider</h3>
                <NeumorphicSlider icon={Activity} />
              </div>
            </div>
          </NeumorphicCard>

          {/* Goals Component */}
          <NeumorphicGoals
            goals={goals}
            onGoalsChange={setGoals}
          />

          {/* Card Types */}
          <NeumorphicCard>
            <h2 className="text-2xl font-normal mb-6">Card Types</h2>
            <div className="grid grid-cols-2 gap-4">
              <div
                className="text-center p-4 rounded-lg transition-all duration-300 hover:shadow-[var(--nm-shadow-hover)]"
                style={{
                  background: 'var(--nm-background)',
                  boxShadow: 'var(--nm-shadow-main)',
                }}
              >
                <div className="text-2xl font-bold text-blue-600">24</div>
                <div className="text-sm text-gray-600">Projects</div>
              </div>
              <div
                className="text-center p-4 rounded-lg transition-all duration-300 hover:shadow-[var(--nm-shadow-hover)]"
                style={{
                  background: 'var(--nm-background)',
                  boxShadow: 'var(--nm-shadow-main)',
                }}
              >
                <div className="text-2xl font-bold text-green-600">89%</div>
                <div className="text-sm text-gray-600">Completion</div>
              </div>
            </div>
          </NeumorphicCard>

        </div>

        <div className="space-y-12">
            {/* Form Inputs */}
            <NeumorphicCard>
              <h2 className="text-2xl font-normal mb-6">Form Inputs</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-normal mb-3">Input Field</h3>
                  <NeumorphicInput placeholder="Enter your name..." />
                </div>
                <div>
                  <h3 className="text-xl font-normal mb-3">Dropdown List</h3>
                  <p className="text-sm text-gray-500 mb-3">
                    <strong>Component:</strong> <code className="bg-gray-100 px-2 py-1 rounded">NeumorphicSelect</code> with <code className="bg-gray-100 px-2 py-1 rounded">size="md"</code> (default)
                  </p>
                  <NeumorphicSelect
                    placeholder="Choose an option"
                    options={selectOptions}
                    value={selectedDropdownValue}
                    onValueChange={setSelectedDropdownValue}
                  />
                </div>
                <div>
                  <h3 className="text-xl font-normal mb-3">Dropdown List Small</h3>
                  <p className="text-sm text-gray-500 mb-3">
                    <strong>Component:</strong> <code className="bg-gray-100 px-2 py-1 rounded">NeumorphicSelect</code> with <code className="bg-gray-100 px-2 py-1 rounded">size="sm"</code> and <code className="bg-gray-100 px-2 py-1 rounded">widthClass="w-auto"</code>
                  </p>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Without Icon</h4>
                      <NeumorphicSelect
                        placeholder="Choose option"
                        options={selectOptions}
                        value={selectedDropdownValue}
                        onValueChange={setSelectedDropdownValue}
                        size="sm"
                        widthClass="w-auto"
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">With Icon</h4>
                      <NeumorphicSelect
                        placeholder="Choose option"
                        options={selectOptions}
                        value={selectedDropdownValue}
                        onValueChange={setSelectedDropdownValue}
                        size="sm"
                        widthClass="w-auto"
                        icon={Activity}
                      />
                    </div>
                  </div>
                </div>
                 <div>
                  <h3 className="text-xl font-normal mb-3">Text Area</h3>
                  <NeumorphicTextarea placeholder="Share your thoughts..." />
                </div>
                <div>
                  <h3 className="text-xl font-normal mb-3">Date & Time Pickers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                      <NeumorphicDatePicker
                        value={selectedDate}
                        onChange={setSelectedDate}
                        placeholder="Select date..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                      <NeumorphicTimePicker
                        value={selectedTime}
                        onChange={setSelectedTime}
                        placeholder="Select time..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </NeumorphicCard>

            {/* Selection Controls */}
            <NeumorphicCard>
              <h2 className="text-2xl font-normal mb-6">Selection Controls</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-normal mb-3">Checkbox</h3>
                  <NeumorphicCheckbox label="Accept terms" />
                </div>
                <div>
                  <h3 className="text-xl font-normal mb-3">Toggle</h3>
                  <NeumorphicToggle />
                </div>
                <div className="sm:col-span-2">
                  <h3 className="text-xl font-normal mb-3">Radio Group</h3>
                  <NeumorphicRadioGroup options={radioOptions} name="frequency" />
                </div>
              </div>
            </NeumorphicCard>

            {/* Tabs */}
            <NeumorphicCard>
              <h2 className="text-2xl font-normal mb-4">Tabs</h2>

              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-normal mb-4 text-gray-600">Standard Tabs</h3>
                  <NeumorphicTabs tabs={tabs} />
                </div>

                <div>
                  <h3 className="text-lg font-normal mb-4 text-gray-600">Tabs with Icons</h3>
                  <NeumorphicTabs
                    tabs={[
                      {
                        label: 'Dashboard',
                        icon: Home,
                        content: (
                          <div className="p-4">
                            <h4 className="font-medium mb-2">Dashboard Overview</h4>
                            <p className="text-gray-600">Welcome to your dashboard. Here you can see an overview of all your activities.</p>
                          </div>
                        )
                      },
                      {
                        label: 'Analytics',
                        icon: BarChart3,
                        content: (
                          <div className="p-4">
                            <h4 className="font-medium mb-2">Analytics & Reports</h4>
                            <p className="text-gray-600">View detailed analytics and generate reports for your data.</p>
                          </div>
                        )
                      },
                      {
                        label: 'Settings',
                        icon: Settings,
                        content: (
                          <div className="p-4">
                            <h4 className="font-medium mb-2">Application Settings</h4>
                            <p className="text-gray-600">Configure your application preferences and account settings.</p>
                          </div>
                        )
                      },
                      {
                        label: 'Notifications',
                        icon: Bell,
                        content: (
                          <div className="p-4">
                            <h4 className="font-medium mb-2">Notification Center</h4>
                            <p className="text-gray-600">Manage your notifications and communication preferences.</p>
                          </div>
                        )
                      }
                    ]}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-normal mb-4 text-gray-600">Sub Tabs with Icons (Smaller)</h3>
                  <NeumorphicTabs
                    variant="sub"
                    tabs={[
                      {
                        label: 'Overview',
                        icon: Activity,
                        content: <p className="p-4 text-gray-600">Sub tab overview content with activity data.</p>
                      },
                      {
                        label: 'Documents',
                        icon: FileText,
                        content: <p className="p-4 text-gray-600">Document management and file uploads.</p>
                      },
                      {
                        label: 'Team',
                        icon: User,
                        content: <p className="p-4 text-gray-600">Team members and collaboration tools.</p>
                      }
                    ]}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-normal mb-4 text-gray-600">Mixed Content Length (Shows Left Alignment)</h3>
                  <NeumorphicTabs
                    tabs={[
                      {
                        label: 'Short',
                        content: <p className="p-4 text-gray-600">Short tab content.</p>
                      },
                      {
                        label: 'Medium Length Tab',
                        content: <p className="p-4 text-gray-600">Medium length tab with more content.</p>
                      },
                      {
                        label: 'Very Long Tab Name Here',
                        content: <p className="p-4 text-gray-600">Very long tab name demonstration.</p>
                      },
                      {
                        label: 'End',
                        content: <p className="p-4 text-gray-600">Final tab content.</p>
                      }
                    ]}
                  />
                </div>
              </div>
            </NeumorphicCard>
        </div>
      </div>

      {/* Ratings */}
      <NeumorphicCard>
        <h2 className="text-2xl font-normal mb-6">Ratings</h2>
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-normal mb-4 text-gray-600">Rating Dots</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Interactive (Small)</h4>
                <NeumorphicRatingDots
                  size="sm"
                  initialRating={dotRating}
                  onRatingChange={setDotRating}
                />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Interactive (Medium)</h4>
                <NeumorphicRatingDots
                  size="md"
                  initialRating={dotRating}
                  onRatingChange={setDotRating}
                />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Interactive (Large)</h4>
                <NeumorphicRatingDots
                  size="lg"
                  initialRating={dotRating}
                  onRatingChange={setDotRating}
                />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Read-only</h4>
                <NeumorphicRatingDots
                  size="md"
                  initialRating={3}
                  readonly={true}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-normal mb-4 text-gray-600">Rating Stars</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Interactive (Small)</h4>
                <NeumorphicRatingStars
                  size="sm"
                  initialRating={starRating}
                  onRatingChange={setStarRating}
                />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Interactive (Medium)</h4>
                <NeumorphicRatingStars
                  size="md"
                  initialRating={starRating}
                  onRatingChange={setStarRating}
                />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Interactive (Large)</h4>
                <NeumorphicRatingStars
                  size="lg"
                  initialRating={starRating}
                  onRatingChange={setStarRating}
                />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Read-only</h4>
                <NeumorphicRatingStars
                  size="md"
                  initialRating={4}
                  readonly={true}
                />
              </div>
            </div>
          </div>
        </div>
      </NeumorphicCard>

      {/* Alerts */}
      <NeumorphicCard>
        <h2 className="text-2xl font-normal mb-4">Alerts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NeumorphicAlert type="info">This is an informational message.</NeumorphicAlert>
          <NeumorphicAlert type="success">Your action was successful.</NeumorphicAlert>
          <NeumorphicAlert type="warning">Please be aware of this warning.</NeumorphicAlert>
          <NeumorphicAlert type="error">An error has occurred.</NeumorphicAlert>
        </div>
      </NeumorphicCard>

      {/* Simple Table */}
      <NeumorphicCard>
        <h2 className="text-2xl font-normal mb-4">Simple Table</h2>
        <NeumorphicTable
          data={tableData}
          columns={[
            { header: 'Item', accessor: 'item' },
            { header: 'Category', accessor: 'category' },
            { header: 'Status', accessor: 'status', align: 'right' }
          ]}
          maxRows={2}
        />
      </NeumorphicCard>

      {/* Collapsible Table */}
      <NeumorphicCard>
        <h2 className="text-2xl font-normal mb-4">Collapsible Table</h2>
        <NeumorphicCollapsibleTable
          data={tableData}
          columns={[
            { header: 'Item', accessor: 'item' },
            { header: 'Category', accessor: 'category' },
            { header: 'Status', accessor: 'status', align: 'right' }
          ]}
          getRowDetails={(row) => row.details}
        />
      </NeumorphicCard>

      {/* Journey Timeline */}
      <NeumorphicCard>
        <h2 className="text-2xl font-normal mb-6">Journey Timeline</h2>
        <NeumorphicJourney milestones={journeyMilestones} />
      </NeumorphicCard>

      {/* Modal Components */}
      <NeumorphicModal
        isOpen={showCenteredModal}
        onClose={() => setShowCenteredModal(false)}
        title="Confirmation Required"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this item? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <NeumorphicButton onClick={() => setShowCenteredModal(false)}>
              Cancel
            </NeumorphicButton>
            <NeumorphicButton
              variant="primary"
              onClick={() => setShowCenteredModal(false)}
            >
              Delete Item
            </NeumorphicButton>
          </div>
        </div>
      </NeumorphicModal>

      <NeumorphicModal2
        isOpen={showCenteredModal2}
        onClose={() => setShowCenteredModal2(false)}
        title="Confirmation Required"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this item? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <NeumorphicButton onClick={() => setShowCenteredModal2(false)}>
              Cancel
            </NeumorphicButton>
            <NeumorphicButton
              variant="primary"
              onClick={() => setShowCenteredModal2(false)}
            >
              Delete Item
            </NeumorphicButton>
          </div>
        </div>
      </NeumorphicModal2>

      <NeumorphicSidePanel
        isOpen={showSidePanel}
        onClose={() => setShowSidePanel(false)}
        title="Edit Profile Details"
        side="right"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <NeumorphicInput placeholder="Enter your full name" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <NeumorphicInput placeholder="Enter your email" type="email" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
            <NeumorphicTextarea placeholder="Tell us about yourself..." rows={4} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notification Preferences</label>
            <div className="space-y-3">
              <NeumorphicCheckbox label="Email notifications" />
              <NeumorphicCheckbox label="Push notifications" />
              <NeumorphicCheckbox label="Weekly digest" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Privacy Level</label>
            <NeumorphicRadioGroup
              options={[
                { value: 'public', label: 'Public Profile' },
                { value: 'private', label: 'Private Profile' },
                { value: 'friends', label: 'Friends Only' }
              ]}
              name="privacy"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <NeumorphicButton onClick={() => setShowSidePanel(false)}>
              Cancel
            </NeumorphicButton>
            <NeumorphicButton
              variant="primary"
              onClick={() => setShowSidePanel(false)}
            >
              Save Changes
            </NeumorphicButton>
          </div>
        </div>
      </NeumorphicSidePanel>

      <NeumorphicSidePanel2
        isOpen={showSidePanel2}
        onClose={() => setShowSidePanel2(false)}
        title="Edit Profile Details"
        side="right"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <NeumorphicInput placeholder="Enter your full name" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <NeumorphicInput placeholder="Enter your email" type="email" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
            <NeumorphicTextarea placeholder="Tell us about yourself..." rows={4} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notification Preferences</label>
            <div className="space-y-3">
              <NeumorphicCheckbox label="Email notifications" />
              <NeumorphicCheckbox label="Push notifications" />
              <NeumorphicCheckbox label="Weekly digest" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Privacy Level</label>
            <NeumorphicRadioGroup
              options={[
                { value: 'public', label: 'Public Profile' },
                { value: 'private', label: 'Private Profile' },
                { value: 'friends', label: 'Friends Only' }
              ]}
              name="privacy"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <NeumorphicButton onClick={() => setShowSidePanel2(false)}>
              Cancel
            </NeumorphicButton>
            <NeumorphicButton
              variant="primary"
              onClick={() => setShowSidePanel2(false)}
            >
              Save Changes
            </NeumorphicButton>
          </div>
        </div>
      </NeumorphicSidePanel2>

      <NeumorphicSidePanel3
        isOpen={showSidePanel3}
        onClose={() => setShowSidePanel3(false)}
        title="Edit Profile Details"
        side="right"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <NeumorphicInput placeholder="Enter your full name" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <NeumorphicInput placeholder="Enter your email" type="email" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
            <NeumorphicTextarea placeholder="Tell us about yourself..." rows={4} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notification Preferences</label>
            <div className="space-y-3">
              <NeumorphicCheckbox label="Email notifications" />
              <NeumorphicCheckbox label="Push notifications" />
              <NeumorphicCheckbox label="Weekly digest" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Privacy Level</label>
            <NeumorphicRadioGroup
              options={[
                { value: 'public', label: 'Public Profile' },
                { value: 'private', label: 'Private Profile' },
                { value: 'friends', label: 'Friends Only' }
              ]}
              name="privacy"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <NeumorphicButton onClick={() => setShowSidePanel3(false)}>
              Cancel
            </NeumorphicButton>
            <NeumorphicButton
              variant="primary"
              onClick={() => setShowSidePanel3(false)}
            >
              Save Changes
            </NeumorphicButton>
          </div>
        </div>
      </NeumorphicSidePanel3>
    </div>
  );
}