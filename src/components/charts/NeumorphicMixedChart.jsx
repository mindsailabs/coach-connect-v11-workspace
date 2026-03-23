
import React, { useState } from 'react';
import {
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  LineChart
} from 'recharts';
import { Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NeumorphicCard from '../ui/NeumorphicCard';

const NeumorphicMixedChart = ({ data, chartType = 'mixed' }) => {
  // State to manage visibility of series for both chart types
  const [visibleSeries, setVisibleSeries] = useState({
    health: {
      activity: true,
      nutrition: false, // Changed to false
      mental: false,    // Changed to false
      work: false,      // Changed to false
      relationships: false, // Changed to false
      rest: true,
      overall: true
    },
    mixed: {
      revenue: true,
      profit: true,
      growth: true
    }
  });

  const [isFlashing, setIsFlashing] = useState(false);
  const [isButtonPressed, setIsButtonPressed] = useState(false);

  const handleCameraClick = () => {
    setIsButtonPressed(true);
    setTimeout(() => {
      setIsFlashing(true);
      setTimeout(() => {
        setIsFlashing(false);
        setIsButtonPressed(false);
      }, 1650);
    }, 500);
  };

  // Sample health data
  const healthData = [
    {
      date: '2024-01-15',
      overall: 3.2,
      activity: 5,
      sleep: 3, // Keep sleep data in healthData, as it might be used elsewhere or for future features
      nutrition: 3,
      mental: 2,
      work: 3,
      relationships: 3,
      rest: 4
    },
    {
      date: '2024-01-18',
      overall: 3.5,
      activity: 4,
      sleep: 4,
      nutrition: 3,
      mental: 3,
      work: 4,
      relationships: 3,
      rest: 3
    },
    {
      date: '2024-01-22',
      overall: 2.8,
      activity: 3,
      sleep: 2,
      nutrition: 3,
      mental: 2,
      work: 4,
      relationships: 3,
      rest: 4
    },
    {
      date: '2024-01-25',
      overall: 4.1,
      activity: 5,
      sleep: 4,
      nutrition: 4,
      mental: 4,
      work: 3,
      relationships: 4,
      rest: 2
    },
    {
      date: '2024-01-29',
      overall: 3.7,
      activity: 4,
      sleep: 3,
      nutrition: 4,
      mental: 3,
      work: 4,
      relationships: 4,
      rest: 3
    },
    {
      date: '2024-02-01',
      overall: 3.9,
      activity: 4,
      sleep: 4,
      nutrition: 4,
      mental: 4,
      work: 3,
      relationships: 4,
      rest: 3
    },
    {
      date: '2024-02-05',
      overall: 2.9,
      activity: 3,
      sleep: 2,
      nutrition: 3,
      mental: 2,
      work: 4,
      relationships: 4,
      rest: 5
    },
  ];

  // Mixed chart data (original)
  const mixedData = data || [
    { name: 'Jan', revenue: 186, profit: 80, growth: 240 },
    { name: 'Feb', revenue: 305, profit: 200, growth: 139 },
    { name: 'Mar', revenue: 237, profit: 120, growth: 980 },
    { name: 'Apr', revenue: 73, profit: 190, growth: 390 },
    { name: 'May', revenue: 209, profit: 130, growth: 480 },
    { name: 'Jun', revenue: 214, profit: 140, growth: 380 },
    { name: 'Jul', revenue: 290, profit: 160, growth: 430 },
    { name: 'Aug', revenue: 260, profit: 170, growth: 520 },
    { name: 'Sep', revenue: 318, profit: 210, growth: 340 },
    { name: 'Oct', revenue: 225, profit: 145, growth: 600 },
    { name: 'Nov', revenue: 389, profit: 250, growth: 290 },
    { name: 'Dec', revenue: 295, profit: 180, growth: 450 }
  ];

  const healthSeriesConfig = {
    activity: { color: 'var(--nm-chart-activity)', name: 'Activity', strokeWidth: 2 },
    nutrition: { color: 'var(--nm-chart-nutrition)', name: 'Nutrition', strokeWidth: 2 },
    mental: { color: 'var(--nm-chart-mental)', name: 'Mental Wellness', strokeWidth: 2 },
    work: { color: 'var(--nm-chart-work)', name: 'Work', strokeWidth: 2 },
    relationships: { color: 'var(--nm-chart-relationships)', name: 'Relationships', strokeWidth: 2 },
    rest: { color: 'var(--nm-chart-rest)', name: 'Rest', strokeWidth: 2 },
    overall: { color: 'var(--nm-chart-overall)', name: 'Overall Health', strokeWidth: 4 }
  };

  const mixedSeriesConfig = {
    revenue: { color: 'var(--nm-chart-revenue)', name: 'Revenue', type: 'line' },
    profit: { color: 'var(--nm-chart-profit)', name: 'Profit', type: 'bar' },
    growth: { color: 'var(--nm-chart-growth)', name: 'Growth', type: 'area' }
  };

  const toggleSeries = (seriesKey) => {
    if (chartType === 'health') {
      setVisibleSeries(prev => {
        const newState = {
          ...prev,
          health: {
            ...prev.health,
            [seriesKey]: !prev.health[seriesKey]
          }
        };
        return newState;
      });
    } else {
      setVisibleSeries(prev => {
        const newState = {
          ...prev,
          mixed: {
            ...prev.mixed,
            [seriesKey]: !prev.mixed[seriesKey]
          }
        };
        return newState;
      });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const CustomLegend = () => {
    const config = chartType === 'health' ? healthSeriesConfig : mixedSeriesConfig;
    const visibility = chartType === 'health' ? visibleSeries.health : visibleSeries.mixed;

    return (
      <div className="flex gap-6 flex-wrap">
        {Object.entries(config).map(([key, itemConfig]) => (
          <div
            key={key}
            className="flex items-center gap-2 cursor-pointer transition-all duration-200 hover:opacity-75"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleSeries(key);
            }}
            style={{ pointerEvents: 'auto', zIndex: 1000 }}
          >
            <div
              className={`w-4 h-4 ${chartType === 'health' ? 'rounded-full' : 'rounded-sm'}`}
              style={{
                backgroundColor: visibility[key] ? itemConfig.color : 'var(--nm-chart-border)', // Updated
                boxShadow: visibility[key] ? 'var(--nm-shadow-main)' : 'var(--nm-shadow-inset)',
                opacity: visibility[key] ? 1 : 0.5,
                pointerEvents: 'none'
              }}
            />
            <span
              className="text-xs font-medium transition-all duration-200"
              style={{
                color: visibility[key] ? 'var(--nm-text-color)' : 'var(--nm-chart-border)', // Updated
                opacity: visibility[key] ? 1 : 0.6,
                pointerEvents: 'none'
              }}
            >
              {itemConfig.name}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Format label for health chart (date) or mixed chart (name)
      const formattedLabel = chartType === 'health' ? formatDate(label) : label;

      return (
        <div
          className="rounded-xl p-4 border-0"
          style={{
            background: 'var(--nm-background)',
            boxShadow: 'var(--nm-shadow-main)',
            transform: 'translate(10px, -20px)'
          }}
        >
          <p className="text-sm font-semibold mb-3 text-center border-b pb-2" 
             style={{ 
               color: 'var(--nm-text-color)', 
               borderBottomColor: 'var(--nm-chart-border)' 
             }}>
            {formattedLabel}
          </p>
          <div className="space-y-2">
            {payload.map((entry, index) => {
              // Determine suffix based on chart type and data key
              let suffix = '';
              if (chartType === 'health') {
                suffix = '/5'; // Assuming health metrics are out of 5
                if (entry.name === 'Overall Health') {
                  suffix = ''; // Overall health is a score, not a /5
                }
              } else { // mixed chart
                if (entry.name === 'Growth') {
                  suffix = '%';
                }
              }

              return (
                <div key={index} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 ${chartType === 'health' ? 'rounded-full' : 'rounded-sm'}`}
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm" style={{ color: 'var(--nm-text-color)' }}>
                      {entry.name}:
                    </span>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: entry.color }}>
                    {entry.value}{suffix}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomDot = (props) => {
    const { cx, cy, fill } = props;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={3}
        fill="#ffffff"
        stroke={fill}
        strokeWidth={2}
        style={{
          filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.1))'
        }}
      />
    );
  };

  const OverallHealthDot = (props) => {
    const { cx, cy, payload } = props;
    if (!payload) return null;

    return (
      <g style={{ zIndex: 1000 }}>
        {/* Neumorphic circle with grey stroke only - 25% larger */}
        <circle
          cx={cx}
          cy={cy}
          r={20}
          fill="var(--nm-background)"
          stroke="var(--nm-chart-border)"
          strokeWidth="1"
        />
        {/* Score text inside the circle */}
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="14"
          fontWeight="500"
          fill="var(--nm-chart-overall)"
        >
          {payload.overall}
        </text>
      </g>
    );
  };

  const ActiveOverallHealthDot = (props) => {
    const { cx, cy, payload } = props;
    if (!payload) return null;

    return (
      <g style={{ zIndex: 1000, filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))' }}>
        {/* Neumorphic circle with white stroke - 25% larger */}
        <circle
          cx={cx}
          cy={cy}
          r={20}
          fill="var(--nm-background)"
          stroke="#ffffff"
          strokeWidth="3"
        />
        {/* Score text inside the circle */}
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="14"
          fontWeight="700"
          fill="var(--nm-chart-overall)"
        >
          {payload.overall}
        </text>
      </g>
    );
  };

  // Determine margin based on chartType for XAxis labels
  const chartMargin = chartType === 'health' ? { top: 20, right: 30, bottom: 60, left: 20 } : { top: 20, right: 30, bottom: 20, left: 20 };

  return (
    <NeumorphicCard className="relative pl-0 pr-[60px] pt-[50px] pb-[50px]">
      {/* Screenshot Flash Overlay - moved to card level */}
      <AnimatePresence>
        {isFlashing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.95, 0] }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1.65,
              times: [0, 0.06, 1],
              ease: "easeOut"
            }}
            className="absolute inset-0 bg-white pointer-events-none"
            style={{ borderRadius: 'var(--nm-radius)', zIndex: 200 }}
          />
        )}
      </AnimatePresence>

      <div className="w-full h-80 relative">
        {/* Chart content */}
        <style>{`
          .recharts-legend-wrapper {
            position: relative !important;
          }
          .recharts-cartesian-grid-horizontal line,
          .recharts-cartesian-grid-vertical line {
            stroke-dasharray: 3 3;
            stroke-opacity: 0.6;
          }
          .recharts-tooltip-cursor {
            stroke: var(--nm-chart-overall);
            stroke-width: 1;
            stroke-dasharray: 3 3;
            opacity: 0.5;
          }
        `}</style>

        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'health' ? (
            <LineChart data={healthData} margin={chartMargin}>
              <defs>
                {/* Removed sleepGradient as sleep area chart is removed */}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--nm-chart-grid)" opacity="0.3" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: 'var(--nm-text-color)',
                  fontSize: 11,
                  fontWeight: 500
                }}
                tickFormatter={formatDate}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                domain={[0, 5]}
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: 'var(--nm-text-color)',
                  fontSize: 12,
                  fontWeight: 500
                }}
              />
              <Tooltip content={<CustomTooltip />} offset={30} />

              {/* Removed visibleSeries.health.sleep Area chart */}

              {visibleSeries.health.activity && (
                <Line
                  type="monotone"
                  dataKey="activity"
                  stroke={healthSeriesConfig.activity.color}
                  strokeWidth={3}
                  dot={<CustomDot />}
                  activeDot={{
                    r: 6,
                    fill: healthSeriesConfig.activity.color,
                    stroke: '#ffffff',
                    strokeWidth: 3,
                    style: { filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))' }
                  }}
                  name="Activity"
                />
              )}

              {visibleSeries.health.nutrition && (
                <Line
                  type="monotone"
                  dataKey="nutrition"
                  stroke={healthSeriesConfig.nutrition.color}
                  strokeWidth={3}
                  dot={<CustomDot />}
                  activeDot={{
                    r: 6,
                    fill: healthSeriesConfig.nutrition.color,
                    stroke: '#ffffff',
                    strokeWidth: 3,
                    style: { filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))' }
                  }}
                  name="Nutrition"
                />
              )}

              {visibleSeries.health.mental && (
                <Line
                  type="monotone"
                  dataKey="mental"
                  stroke={healthSeriesConfig.mental.color}
                  strokeWidth={3}
                  dot={<CustomDot />}
                  activeDot={{
                    r: 6,
                    fill: healthSeriesConfig.mental.color,
                    stroke: '#ffffff',
                    strokeWidth: 3,
                    style: { filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))' }
                  }}
                  name="Mental Wellness"
                />
              )}

              {visibleSeries.health.work && (
                <Line
                  type="monotone"
                  dataKey="work"
                  stroke={healthSeriesConfig.work.color}
                  strokeWidth={3}
                  dot={<CustomDot />}
                  activeDot={{
                    r: 6,
                    fill: healthSeriesConfig.work.color,
                    stroke: '#ffffff',
                    strokeWidth: 3,
                    style: { filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))' }
                  }}
                  name="Work"
                />
              )}

              {visibleSeries.health.relationships && (
                <Line
                  type="monotone"
                  dataKey="relationships"
                  stroke={healthSeriesConfig.relationships.color}
                  strokeWidth={3}
                  dot={<CustomDot />}
                  activeDot={{
                    r: 6,
                    fill: healthSeriesConfig.relationships.color,
                    stroke: '#ffffff',
                    strokeWidth: 3,
                    style: { filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))' }
                  }}
                  name="Relationships"
                />
              )}

              {visibleSeries.health.rest && (
                <Line
                  type="monotone"
                  dataKey="rest"
                  stroke={healthSeriesConfig.rest.color}
                  strokeWidth={3}
                  dot={<CustomDot />}
                  activeDot={{
                    r: 6,
                    fill: healthSeriesConfig.rest.color,
                    stroke: '#ffffff',
                    strokeWidth: 3,
                    style: { filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))' }
                  }}
                  name="Rest"
                />
              )}

              {visibleSeries.health.overall && (
                <Line
                  type="monotone"
                  dataKey="overall"
                  stroke={healthSeriesConfig.overall.color}
                  strokeWidth={4}
                  dot={<OverallHealthDot />}
                  activeDot={<ActiveOverallHealthDot />}
                  name="Overall Health"
                />
              )}
            </LineChart>
          ) : (
            // Mixed Chart Areas, Bars, Lines
            <ComposedChart data={mixedData} margin={chartMargin}>
              <defs>
                <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--nm-chart-growth)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--nm-chart-growth)" stopOpacity={0.05}/>
                </linearGradient>
                <filter id="barShadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.1)"/>
                </filter>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="var(--nm-chart-grid)" opacity="0.3" />

              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: 'var(--nm-text-color)',
                  fontSize: 13,
                  fontWeight: 500
                }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: 'var(--nm-text-color)',
                  fontSize: 12,
                  fontWeight: 500
                }}
              />

              <Tooltip content={<CustomTooltip />} offset={30} />

              {visibleSeries.mixed.growth && (
                <Area
                  type="monotone"
                  dataKey="growth"
                  fill="url(#growthGradient)"
                  stroke={mixedSeriesConfig.growth.color}
                  strokeWidth={2}
                  name="Growth"
                />
              )}

              {visibleSeries.mixed.profit && (
                <Bar
                  dataKey="profit"
                  fill="var(--nm-chart-profit)"
                  radius={[4, 4, 0, 0]}
                  name="Profit"
                  style={{ filter: 'url(#barShadow)' }}
                />
              )}

              {visibleSeries.mixed.revenue && (
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--nm-chart-revenue)"
                  strokeWidth={3}
                  dot={<CustomDot />}
                  activeDot={{
                    r: 6,
                    fill: 'var(--nm-chart-revenue)',
                    stroke: '#ffffff',
                    strokeWidth: 3,
                    style: { filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))' }
                  }}
                  name="Revenue"
                />
              )}
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Camera Icon */}
      <div className="absolute top-4 right-4 z-40">
        <button
          onClick={handleCameraClick}
          className="p-3 rounded-full transition-all duration-200"
          style={{
            background: 'var(--nm-background)',
            boxShadow: isButtonPressed ? 'var(--nm-shadow-inset)' : 'var(--nm-shadow-main)',
          }}
        >
          <Camera className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      {/* Legend controls moved below graph and centered */}
      <div
        className="flex justify-center"
        style={{
          marginTop: '-40px',
          position: 'relative',
          zIndex: 100,
          pointerEvents: 'auto'
        }}
      >
        <div
          className="flex flex-wrap gap-2 justify-center"
          style={{ pointerEvents: 'auto', position: 'relative', zIndex: 20 }}
        >
          <CustomLegend />
        </div>
      </div>
    </NeumorphicCard>
  );
};

export default NeumorphicMixedChart;
