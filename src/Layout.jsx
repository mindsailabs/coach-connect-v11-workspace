import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';

const NeumorphicLayout = ({ children, currentPageName }) => {
  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap');
          :root {
            --nm-background: #f0f2f5;
            --nm-radius: 20px;
            --nm-shadow-light: -9px -9px 16px #ffffff;
            --nm-shadow-dark: 9px 9px 16px #d1d9e6;
            --nm-shadow-inset-light: inset -4px -4px 8px #ffffff;
            --nm-shadow-inset-dark: inset 4px 4px 8px #d1d9e6;
            --nm-shadow-main: var(--nm-shadow-light), var(--nm-shadow-dark);
            --nm-shadow-inset: var(--nm-shadow-inset-light), var(--nm-shadow-inset-dark);
            --nm-shadow-hover: -20px -20px 40px #ffffff, 20px 20px 40px #b1b8c3;
            --nm-shadow-inset-hover: inset -6px -6px 12px #ffffff, inset 6px 6px 12px #d1d9e6;
            --nm-text-color: #4a5568;

            /* Badge Color Variables - Standardized from Color Palette */
            --nm-badge-default-color: #718096;
            --nm-badge-primary-color: #2f949d;
            --nm-badge-success-color: #48bb78;
            --nm-badge-warning-color: #ed8936;
            --nm-badge-error-color: #f56565;
            --nm-badge-info-color: #4299e1;
            --nm-badge-learning-color: #ec4899;
            --nm-badge-checkin-color: #8b5cf6;
            --nm-badge-accent-color: #f6d55c;
            --nm-badge-category-color: #8b5cf6;
            --nm-badge-tag-color: #4299e1;

            /* Muted Badge Color Variables - For Solid Badges */
            --nm-badge-default-muted: #9ca3af;
            --nm-badge-primary-muted: #6bb6c0;
            --nm-badge-success-muted: #68d391;
            --nm-badge-warning-muted: #f6ad55;
            --nm-badge-error-muted: #fc8181;
            --nm-badge-info-muted: #63b3ed;
            --nm-badge-learning-muted: #f093c4;
            --nm-badge-checkin-muted: #a78bfa;
            --nm-badge-accent-muted: #f7dd72;
            --nm-badge-category-muted: #a78bfa;
            --nm-badge-tag-muted: #63b3ed;

            /* Dark Badge Color Variables - For Solid Badge Text */
            --nm-badge-default-dark: #2d3748;
            --nm-badge-primary-dark: #0f3a3e;
            --nm-badge-success-dark: #1a4731;
            --nm-badge-warning-dark: #8b4513;
            --nm-badge-error-dark: #9b2c2c;
            --nm-badge-info-dark: #1e5a96;
            --nm-badge-learning-dark: #8b2661;
            --nm-badge-checkin-dark: #553c9a;
            --nm-badge-accent-dark: #b7791f;
            --nm-badge-category-dark: #553c9a;
            --nm-badge-tag-dark: #1e5a96;

            /* Chart Color Variables - Mapped to Color Palette */
            --nm-chart-primary: var(--nm-badge-primary-color);
            --nm-chart-success: var(--nm-badge-success-color);
            --nm-chart-warning: var(--nm-badge-warning-color);
            --nm-chart-error: var(--nm-badge-error-color);
            --nm-chart-info: var(--nm-badge-info-color);
            --nm-chart-learning: var(--nm-badge-learning-color);
            --nm-chart-checkin: var(--nm-badge-checkin-color);
            --nm-chart-accent: var(--nm-badge-accent-color);
            --nm-chart-default: var(--nm-badge-default-color);

            /* Chart UI Elements */
            --nm-chart-border: #d1d9e6;
            --nm-chart-grid: var(--nm-badge-default-color);

            /* Rating Component Colors */
            --nm-rating-active: #2f949d;
            --nm-rating-inactive: #d1d9e6;
            --nm-rating-hover: #4a9fa8;

            /* Progress & Slider Component Colors */
            --nm-progress-track: var(--nm-background);
            --nm-progress-bar: linear-gradient(145deg, #2f949d, #4a9fa8, #5ab0b8);
            --nm-progress-text: #ffffff;
            --nm-slider-track: var(--nm-background);
            --nm-slider-progress: linear-gradient(90deg, #2f949d, #4a9fa8);
            --nm-slider-icon-active: #2f949d;
            --nm-slider-icon-inactive: #a8b2c5;

            /* Sleep Gauge Colors - Specific to Sleep Quality */
            --nm-sleep-poor: var(--nm-badge-error-color);
            --nm-sleep-fair: var(--nm-badge-warning-color);
            --nm-sleep-good: var(--nm-badge-success-color);
            --nm-sleep-excess: var(--nm-badge-accent-color);

            /* Activity Gauge Colors - Specific to Activity Levels */
            --nm-activity-sedentary: var(--nm-badge-error-color);
            --nm-activity-light: var(--nm-badge-warning-color);
            --nm-activity-moderate: var(--nm-badge-accent-color);
            --nm-activity-very-active: var(--nm-badge-primary-color);

            /* Health Chart Series Colors */
            --nm-chart-activity: var(--nm-chart-success);
            --nm-chart-nutrition: var(--nm-chart-warning);
            --nm-chart-mental: var(--nm-chart-checkin);
            --nm-chart-work: var(--nm-chart-error);
            --nm-chart-relationships: var(--nm-chart-primary);
            --nm-chart-rest: var(--nm-chart-info);
            --nm-chart-overall: var(--nm-chart-primary);

            /* Mixed Chart Series Colors */
            --nm-chart-revenue: var(--nm-chart-warning);
            --nm-chart-profit: var(--nm-chart-success);
            --nm-chart-growth: var(--nm-chart-primary);

            /* Modal & Side Panel Specific Shadows - Distinct from standard neumorphic elements */
            --nm-modal-backdrop: rgba(0, 0, 0, 0.2);
            --nm-modal-shadow-main: 9px 9px 16px #9ca3af, -9px -9px 16px #9ca3af, 0px 0px 20px #9ca3af;
            --nm-modal-shadow-hover: 12px 12px 20px #9ca3af, -12px -12px 20px #9ca3af, 0px 0px 25px #9ca3af;
            --nm-modal-close-shadow: 9px 9px 16px #d1d9e6, -9px -9px 16px #ffffff;
            --nm-modal-close-shadow-hover: 12px 12px 20px #d1d9e6, -12px -12px 20px #ffffff;
            --nm-panel-shadow-right: -9px 9px 16px #9ca3af, -16px 0px 32px #9ca3af;
            --nm-panel-shadow-left: 9px 9px 16px #9ca3af, 16px 0px 32px #9ca3af;
          }
          body {
            background-color: var(--nm-background);
            color: var(--nm-text-color);
            font-family: 'Lato', sans-serif;
            -webkit-tap-highlight-color: transparent;
          }

          /* Hide scrollbars on mobile */
          @media (max-width: 767px) {
            * {
              scrollbar-width: none;
              -ms-overflow-style: none;
            }
            *::-webkit-scrollbar {
              display: none;
            }
          }

          button, a, [role="button"] {
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
          }

          button:active {
            outline: none !important;
            border: none !important;
            box-shadow: none !important;
          }

          .time-picker-close-btn {
            -webkit-appearance: none !important;
            appearance: none !important;
            -webkit-tap-highlight-color: transparent !important;
            tap-highlight-color: transparent !important;
          }

          .time-picker-close-btn:active,
          .time-picker-close-btn:focus,
          .time-picker-close-btn:active:focus {
            outline: none !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            -webkit-box-shadow: none !important;
          }

          .time-picker-close-btn:active > *,
          .time-picker-close-btn:focus > *,
          .time-picker-close-btn:active:focus > * {
            filter: none !important;
            box-shadow: none !important;
            -webkit-box-shadow: none !important;
            outline: none !important;
          }

          .search-icon-btn,
          .search-icon-btn:active,
          .search-icon-btn:focus,
          .search-icon-btn:active:focus {
            outline: none !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            -webkit-box-shadow: none !important;
            -webkit-appearance: none !important;
            appearance: none !important;
            -webkit-tap-highlight-color: transparent !important;
            -webkit-user-select: none !important;
          }

          /* Global Input Field Styling */
          input[type="text"],
          input[type="email"],
          input[type="password"],
          input[type="number"],
          input[type="search"],
          input[type="tel"],
          input[type="url"],
          textarea {
            background: var(--nm-background) !important;
            box-shadow: var(--nm-shadow-inset) !important;
            border-radius: 12px !important;
            border: none !important;
            color: var(--nm-text-color) !important;
            transition: all 0.3s ease !important;
          }

          input[type="text"]:hover,
          input[type="email"]:hover,
          input[type="password"]:hover,
          input[type="number"]:hover,
          input[type="search"]:hover,
          input[type="tel"]:hover,
          input[type="url"]:hover,
          textarea:hover {
            box-shadow: inset -6px -6px 12px #ffffff, inset 6px 6px 12px #d1d9e6 !important;
          }

          input[type="text"]:focus,
          input[type="email"]:focus,
          input[type="password"]:focus,
          input[type="number"]:focus,
          input[type="search"]:focus,
          input[type="tel"]:focus,
          input[type="url"]:focus,
          textarea:focus {
            outline: none !important;
            box-shadow: inset -6px -6px 12px #ffffff, inset 6px 6px 12px #d1d9e6 !important;
          }

          input::placeholder,
          textarea::placeholder {
            color: var(--nm-badge-default-color) !important;
            opacity: 1 !important;
          }

          /* Global Neumorphic Select Styling - Standardized Template */
          [data-radix-select-trigger] {
            border-radius: 12px !important;
            background: var(--nm-background) !important;
            box-shadow: var(--nm-shadow-main) !important;
            border: none !important;
            color: var(--nm-text-color) !important;
            font-weight: normal !important;
            padding: 12px 16px !important;
            height: auto !important;
            transition: all 0.3s ease !important;
          }

          [data-radix-select-trigger]:focus {
            outline: none !important;
            ring: 0 !important;
            border: none !important;
          }

          [data-radix-select-trigger]:hover {
            box-shadow: inset -6px -6px 12px #ffffff, inset 6px 6px 12px #d1d9e6 !important;
          }

          [data-radix-select-trigger][data-state=open] {
            border-bottom-left-radius: 0px !important;
            border-bottom-right-radius: 0px !important;
            box-shadow: inset 2px 2px 6px #d1d9e6, inset -2px -2px 6px #ffffff !important;
          }

          [data-radix-select-content] {
            border-top-left-radius: 0px !important;
            border-top-right-radius: 0px !important;
            border-bottom-left-radius: 12px !important;
            border-bottom-right-radius: 12px !important;
            background: var(--nm-background) !important;
            box-shadow: 2px 4px 8px #d1d9e6, -2px 0px 8px #ffffff !important;
            border: none !important;
            padding: 0px !important;
            margin-top: 0px !important;
            min-width: var(--radix-select-trigger-width) !important;
            width: var(--radix-select-trigger-width) !important;
          }

          [data-radix-select-item] {
            color: var(--nm-text-color) !important;
            font-weight: normal !important;
            font-size: 0.875rem !important;
            border: none !important;
            outline: none !important;
            border-radius: 0 !important;
            background: transparent !important;
            padding: 12px 16px !important;
            transition: all 0.2s ease !important;
            cursor: pointer !important;
          }

          [data-radix-select-item]:hover {
            opacity: 0.8 !important;
            background: transparent !important;
          }

          [data-radix-select-item]:focus {
            background: transparent !important;
            outline: none !important;
          }

          [data-radix-select-item][data-highlighted] {
            background: transparent !important;
            outline: none !important;
          }

          /* Hide native select indicators globally */
          [data-radix-select-item] [data-radix-select-item-indicator],
          [data-radix-select-item] span[data-radix-select-item-indicator],
          [data-radix-select-item] [data-radix-select-item-indicator] *,
          [data-radix-select-item] .select-item-indicator {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            width: 0 !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          [data-radix-select-item] [data-radix-select-item-indicator]::before,
          [data-radix-select-item] [data-radix-select-item-indicator]::after,
          [data-radix-select-item] span[data-radix-select-item-indicator]::before,
          [data-radix-select-item] span[data-radix-select-item-indicator]::after {
            display: none !important;
            content: none !important;
          }

          [data-radix-select-item]::before,
          [data-radix-select-item]::after {
            display: none !important;
            content: none !important;
          }

          [data-radix-select-item] * [data-radix-select-item-indicator],
          [data-radix-select-item] * span[data-radix-select-item-indicator] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
          }

          /* Global select appearance reset */
          [data-radix-select-item] {
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            appearance: none !important;
            list-style: none !important;
          }

          /* Ensure green check marks are visible in all dropdowns */
          [data-radix-select-item] .lucide-check {
            display: inline-block !important;
            visibility: visible !important;
            opacity: 1 !important;
            color: #48bb78 !important;
            width: 16px !important;
            height: 16px !important;
            margin-left: 8px !important;
          }

          /* Global Neumorphic Toggle, Checkbox, and RadioGroup Styling - Standardized Template */
          
          /* NeumorphicToggle Standardized Styles */
          .neumorphic-toggle-track {
            width: 60px !important;
            height: 30px !important;
            border-radius: 15px !important;
            padding: 3px !important;
            cursor: pointer !important;
            background: var(--nm-background) !important;
            box-shadow: var(--nm-shadow-inset) !important;
            transition: all 0.3s ease !important;
          }

          .neumorphic-toggle-track:hover {
            box-shadow: var(--nm-shadow-inset-hover) !important;
          }

          .neumorphic-toggle-thumb {
            width: 24px !important;
            height: 24px !important;
            border-radius: 50% !important;
            background: var(--nm-background) !important;
            box-shadow: var(--nm-shadow-main) !important;
            transition: transform 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease !important;
          }

          .neumorphic-toggle-thumb.active {
            background: #2f949d !important;
            transform: translateX(30px) !important;
          }

          .neumorphic-toggle-track:hover .neumorphic-toggle-thumb {
            box-shadow: var(--nm-shadow-hover) !important;
          }

          /* NeumorphicCheckbox Standardized Styles */
          .neumorphic-checkbox-container {
            display: flex !important;
            align-items: center !important;
            gap: 0.75rem !important;
            cursor: pointer !important;
            transition: all 0.3s ease !important;
          }

          .neumorphic-checkbox-box {
            width: 1.5rem !important;
            height: 1.5rem !important;
            border-radius: 0.375rem !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            transition: all 0.2s ease !important;
            box-shadow: var(--nm-shadow-inset) !important;
          }

          .neumorphic-checkbox-box.checked {
            box-shadow: var(--nm-shadow-main) !important;
          }

          .neumorphic-checkbox-label {
            font-weight: normal !important;
            user-select: none !important;
            color: var(--nm-text-color) !important;
          }

          /* NeumorphicRadioGroup Standardized Styles */
          .neumorphic-radio-container {
            display: flex !important;
            flex-direction: column !important;
            gap: 0.75rem !important;
          }

          .neumorphic-radio-item {
            display: flex !important;
            align-items: center !important;
            gap: 0.75rem !important;
            cursor: pointer !important;
            transition: all 0.3s ease !important;
          }

          .neumorphic-radio-circle {
            width: 1.5rem !important;
            height: 1.5rem !important;
            border-radius: 50% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            transition: all 0.2s ease !important;
            box-shadow: var(--nm-shadow-inset) !important;
          }

          .neumorphic-radio-circle.selected {
            box-shadow: var(--nm-shadow-main) !important;
          }

          .neumorphic-radio-dot {
            width: 0.75rem !important;
            height: 0.75rem !important;
            border-radius: 50% !important;
            background-color: #2f949d !important;
          }

          .neumorphic-radio-label {
            font-weight: normal !important;
            user-select: none !important;
            color: var(--nm-text-color) !important;
          }

          /* NeumorphicTabs Standardized Styles - Global Template */
          .neumorphic-tabs-container {
            display: flex !important;
            align-items: center !important;
            gap: 0.5rem !important;
            border-radius: 9999px !important;
            justify-content: flex-start !important;
          }

          .neumorphic-tabs-button {
            border-radius: 9999px !important;
            border: none !important;
            background: transparent !important;
            cursor: pointer !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-weight: 400 !important;
            transition: transform 200ms ease-out, all 300ms !important;
            white-space: nowrap !important;
            width: auto !important;
          }

          .neumorphic-tabs-button:focus {
            outline: none !important;
            ring: 0 !important;
            border: none !important;
          }

          .neumorphic-tabs-button:hover {
            transform: scale(1.02) !important;
          }

          .neumorphic-tabs-button.active {
            color: #2f949d !important;
          }

          /* Main variant tabs */
          .neumorphic-tabs-main .neumorphic-tabs-container {
            height: 52px !important;
            box-shadow: var(--nm-shadow-inset) !important;
          }

          .neumorphic-tabs-main .neumorphic-tabs-button {
            padding: 0.5rem 1rem !important;
            font-size: 1rem !important;
            line-height: 1.5rem !important;
            height: 100% !important;
          }

          .neumorphic-tabs-main .neumorphic-tabs-button.active {
            box-shadow: var(--nm-shadow-main) !important;
            padding-top: 11px !important;
            padding-bottom: 11px !important;
          }

          /* Sub variant tabs */
          .neumorphic-tabs-sub .neumorphic-tabs-container {
            height: 40px !important;
            box-shadow: var(--nm-shadow-inset) !important;
          }

          .neumorphic-tabs-sub .neumorphic-tabs-button {
            padding: 0.25rem 0.75rem !important;
            font-size: 0.875rem !important;
            line-height: 1.25rem !important;
            height: 100% !important;
          }

          .neumorphic-tabs-sub .neumorphic-tabs-button.active {
            box-shadow: var(--nm-shadow-main) !important;
            padding-top: 6px !important;
            padding-bottom: 6px !important;
          }

          /* NeumorphicTable and NeumorphicCollapsibleTable Standardized Styles - Global Template */
          .neumorphic-table-row {
            transition: all 200ms ease-out !important;
            cursor: pointer !important;
          }

          .neumorphic-table-row:hover .neumorphic-table-cell-content,
          .neumorphic-table-row.expanded .neumorphic-table-cell-content {
            transform: scale(1.02) !important;
          }

          .neumorphic-table-cell-content {
            display: inline-block !important;
            transition: transform 200ms ease-out !important;
            transform-origin: center !important;
          }

          /* NeumorphicNavigation Standardized Styles - Global Template */
          .neumorphic-nav-container {
            background: var(--nm-background) !important;
            box-shadow: var(--nm-shadow-main) !important;
            border-radius: var(--nm-radius) !important;
            padding: 1rem !important;
          }

          .neumorphic-nav-item {
            width: 100% !important;
            display: flex !important;
            align-items: center !important;
            gap: 0.75rem !important;
            padding: 0.75rem 1rem !important;
            text-align: left !important;
            font-weight: normal !important;
            border-radius: var(--nm-radius) !important;
            background: transparent !important;
            border: none !important;
            color: var(--nm-text-color) !important;
            cursor: pointer !important;
            /* Added for grow effect on the item itself */
            transition: all 0.2s ease-in-out !important; 
            transform-origin: center !important;
          }

          .neumorphic-nav-item:focus {
            outline: none !important;
            ring: 0 !important;
            border: none !important;
          }

          .neumorphic-nav-item.active {
            background: var(--nm-background) !important;
            box-shadow: var(--nm-shadow-inset) !important;
            color: #2f949d !important;
          }
          
          /* Added grow effect to the navigation item on hover */
          .neumorphic-nav-item:not(.active):hover {
            transform: scale(1.05) !important; 
          }

          .neumorphic-nav-icon {
            width: 1.25rem !important;
            height: 1.25rem !important;
            flex-shrink: 0 !important;
            /* Removed individual transition and transform-origin, as parent now handles the grow effect */
          }

          .neumorphic-nav-label {
            font-weight: normal !important;
            user-select: none !important;
            /* Removed individual transition and transform-origin, as parent now handles the grow effect */
          }

          /* Removed the specific hover scaling rules for icon and label, as the parent item now scales */

          /* NeumorphicRatingDots and NeumorphicRatingStars Standardized Styles - Global Template */
          .neumorphic-rating-container {
            display: flex !important;
            align-items: center !important;
            gap: 0.75rem !important;
          }

          .neumorphic-rating-container.sm {
            gap: 0.5rem !important;
          }

          .neumorphic-rating-container.lg {
            gap: 1rem !important;
          }

          /* Rating Dots Styles */
          .neumorphic-rating-dot {
            border-radius: 50% !important;
            cursor: pointer !important;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
            background: var(--nm-background) !important;
            box-shadow: var(--nm-shadow-inset) !important;
            border: none !important;
            outline: none !important;
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            appearance: none !important;
          }

          .neumorphic-rating-dot.active {
            background: var(--nm-rating-active) !important;
            box-shadow: var(--nm-shadow-main) !important;
          }

          .neumorphic-rating-dot.readonly {
            cursor: default !important;
          }

          .neumorphic-rating-dot:not(.readonly):hover {
            transform: scale(1.1) !important;
            background: var(--nm-rating-hover) !important;
          }

          .neumorphic-rating-dot:not(.readonly):focus {
            outline: none !important;
            transform: scale(1.1) !important;
            box-shadow: var(--nm-shadow-hover) !important;
          }

          .neumorphic-rating-dot:not(.readonly):active {
            transform: scale(1.05) !important;
            outline: none !important;
          }

          /* Rating Stars Styles */
          .neumorphic-rating-star {
            cursor: pointer !important;
            transition: all 0.3s ease-out !important;
            border: none !important;
            background: transparent !important;
            padding: 0 !important;
            color: var(--nm-rating-inactive) !important;
            filter: drop-shadow(-9px -9px 16px #ffffff) drop-shadow(9px 9px 16px #d1d9e6) !important;
            /* Remove all browser defaults */
            outline: none !important;
            box-shadow: none !important;
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            appearance: none !important;
          }

          .neumorphic-rating-star.active {
            color: var(--nm-rating-active) !important;
          }

          .neumorphic-rating-star.readonly {
            cursor: default !important;
          }

          .neumorphic-rating-star:not(.readonly):hover {
            transform: scale(1.1) !important;
            background: transparent !important;
            outline: none !important;
            box-shadow: none !important;
          }

          .neumorphic-rating-star:not(.readonly):focus {
            outline: none !important;
            transform: scale(1.1) !important;
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
          }

          .neumorphic-rating-star:not(.readonly):active {
            outline: none !important;
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
            transform: scale(1.05) !important;
          }

          /* Override any browser-specific button styling for rating stars */
          .neumorphic-rating-star::-moz-focus-inner {
            border: none !important;
            outline: none !important;
          }

          .neumorphic-rating-star:-moz-focusring {
            outline: none !important;
            border: none !important;
          }

          /* NeumorphicProgress Standardized Styles - Global Template */
          .neumorphic-progress-track {
            height: 20px !important;
            background: var(--nm-progress-track) !important;
            box-shadow: var(--nm-shadow-inset) !important;
            border-radius: 10px !important;
            overflow: hidden !important;
            position: relative !important;
          }

          .neumorphic-progress-bar {
            height: 100% !important;
            background: var(--nm-progress-bar) !important;
            border-radius: 10px !important;
            transition: width 2s ease-out !important;
          }

          .neumorphic-progress-text {
            position: absolute !important;
            inset: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 0.875rem !important;
            font-weight: normal !important;
            color: var(--nm-progress-text) !important;
            text-shadow: 0px 1px 2px rgba(0, 0, 0, 0.25) !important;
            transition: opacity 0.5s ease-out !important;
          }

          /* NeumorphicSlider Standardized Styles - Global Template */
          .neumorphic-slider-container {
            position: relative !important;
            width: 100% !important;
            padding: 1.5rem 0 !important;
          }

          .neumorphic-slider-track {
            position: relative !important;
            width: 100% !important;
            height: 8px !important;
            border-radius: 4px !important;
            cursor: pointer !important;
            background: var(--nm-slider-track) !important;
            box-shadow: var(--nm-shadow-inset) !important;
          }

          .neumorphic-slider-progress {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            height: 100% !important;
            border-radius: 4px 0 0 4px !important;
            background: var(--nm-slider-progress) !important;
            box-shadow: inset 1px 1px 2px rgba(47, 148, 157, 0.3) !important;
            transition: width 0.2s ease-out !important;
          }

          .neumorphic-slider-thumb {
            position: absolute !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            pointer-events: none !important;
            top: 50% !important;
            z-index: 20 !important;
            transition: all 0.2s ease-out !important;
          }

          .neumorphic-slider-icon {
            width: 20px !important;
            height: 20px !important;
            border-radius: 50% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: var(--nm-background) !important;
            box-shadow: var(--nm-shadow-main) !important;
            transition: all 0.3s ease !important;
          }

          .neumorphic-slider-icon.dragging {
            box-shadow: 0 2px 6px rgba(47, 148, 157, 0.3), 2px 2px 5px #bec3c9, -2px -2px 5px #ffffff !important;
            transform: scale(1.1) translateY(-2px) !important;
          }

          .neumorphic-slider-icon.hovered {
            box-shadow: 2px 2px 5px #bec3c9, -2px -2px 5px #ffffff, 0 0 4px rgba(47, 148, 157, 0.2) !important;
            transform: scale(1.05) !important;
          }

          .neumorphic-slider-icon svg {
            width: 12px !important;
            height: 12px !important;
            transition: color 0.3s ease !important;
          }

          .neumorphic-slider-icon.active svg {
            color: var(--nm-slider-icon-active) !important;
          }

          .neumorphic-slider-icon:not(.active) svg {
            color: var(--nm-slider-icon-inactive) !important;
          }

          .neumorphic-slider-value {
            font-size: 0.75rem !important;
            font-weight: 500 !important;
            text-align: center !important;
            border-radius: 4px !important;
            background: var(--nm-background) !important;
            box-shadow: var(--nm-shadow-main) !important;
            padding: 2px 6px !important;
            min-width: 30px !important;
            color: var(--nm-text-color) !important;
            margin-top: 8px !important;
          }

          .neumorphic-slider-input {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            appearance: none !important;
            background: transparent !important;
            cursor: pointer !important;
            opacity: 0 !important;
            z-index: 30 !important;
          }

          .neumorphic-slider-input::-webkit-slider-thumb {
            -webkit-appearance: none !important;
            appearance: none !important;
            width: 20px !important;
            height: 20px !important;
            background: transparent !important;
            cursor: pointer !important;
          }

          .neumorphic-slider-input::-moz-range-thumb {
            appearance: none !important;
            width: 20px !important;
            height: 20px !important;
            background: transparent !important;
            cursor: pointer !important;
            border: none !important;
          }

          .neumorphic-slider-input:focus {
            outline: none !important;
          }

          /* NeumorphicAvatar Standardized Styles - Global Template */
          .neumorphic-avatar {
            border-radius: 50% !important;
            background: var(--nm-background) !important;
            box-shadow: var(--nm-shadow-main) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-weight: 600 !important;
            color: var(--nm-text-color) !important;
            overflow: hidden !important;
            transition: all 0.3s ease !important;
            position: relative !important;
          }

          .neumorphic-avatar:hover {
            box-shadow: var(--nm-shadow-hover) !important;
          }

          .neumorphic-avatar.sm {
            width: 2rem !important;
            height: 2rem !important;
            font-size: 0.75rem !important;
          }

          .neumorphic-avatar.smPlus {
            width: 2.5rem !important;
            height: 2.5rem !important;
            font-size: 0.875rem !important;
          }

          .neumorphic-avatar.md {
            width: 3rem !important;
            height: 3rem !important;
            font-size: 0.875rem !important;
          }

          .neumorphic-avatar.lg {
            width: 4rem !important;
            height: 4rem !important;
            font-size: 1rem !important;
          }

          .neumorphic-avatar.xl {
            width: 5rem !important;
            height: 5rem !important;
            font-size: 1.125rem !important;
          }

          .neumorphic-avatar img {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
          }

          .neumorphic-avatar-badge {
            position: absolute !important;
            top: -0.25rem !important;
            right: -0.25rem !important;
            width: 1rem !important;
            height: 1rem !important;
            border-radius: 50% !important;
            background: var(--nm-background) !important;
            box-shadow: var(--nm-shadow-main) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 0.75rem !important;
            font-weight: bold !important;
            color: var(--nm-text-color) !important;
            transition: all 0.3s ease !important;
          }

          .neumorphic-avatar-badge:hover {
            box-shadow: var(--nm-shadow-hover) !important;
          }

          /* NeumorphicIconBadge Standardized Styles - Global Template */
          .neumorphic-icon-badge {
            border-radius: 50% !important;
            background: var(--nm-background) !important;
            box-shadow: var(--nm-shadow-main) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            color: var(--nm-text-color) !important;
            transition: all 0.3s ease !important;
            position: relative !important;
            cursor: default !important;
          }

          .neumorphic-icon-badge:hover {
            box-shadow: var(--nm-shadow-hover) !important;
            transform: scale(1.05) !important;
          }

          .neumorphic-icon-badge.clickable {
            cursor: pointer !important;
          }

          .neumorphic-icon-badge.clickable:active {
            transform: scale(0.95) !important;
            transition: all 0.1s ease !important;
          }

          .neumorphic-icon-badge.sm {
            width: 2rem !important;
            height: 2rem !important;
          }

          .neumorphic-icon-badge.sm svg {
            width: 0.75rem !important;
            height: 0.75rem !important;
          }

          .neumorphic-icon-badge.smPlus {
            width: 2.5rem !important;
            height: 2.5rem !important;
          }

          .neumorphic-icon-badge.smPlus svg {
            width: 1rem !important;
            height: 1rem !important;
          }

          .neumorphic-icon-badge.md {
            width: 3rem !important;
            height: 3rem !important;
          }

          .neumorphic-icon-badge.md svg {
            width: 1.25rem !important;
            height: 1.25rem !important;
          }

          .neumorphic-icon-badge.lg {
            width: 4rem !important;
            height: 4rem !important;
          }

          .neumorphic-icon-badge.lg svg {
            width: 1.5rem !important;
            height: 1.5rem !important;
          }

          .neumorphic-icon-badge.xl {
            width: 5rem !important;
            height: 5rem !important;
          }

          .neumorphic-icon-badge.xl svg {
            width: 1.75rem !important;
            height: 1.75rem !important;
          }

          /* Color variants for icon badges */
          .neumorphic-icon-badge.variant-default svg { color: #4a5568 !important; }
          .neumorphic-icon-badge.variant-primary svg { color: #2f949d !important; }
          .neumorphic-icon-badge.variant-success svg { color: #48bb78 !important; }
          .neumorphic-icon-badge.variant-warning svg { color: #ed8936 !important; }
          .neumorphic-icon-badge.variant-error svg { color: #f56565 !important; }
          .neumorphic-icon-badge.variant-info svg { color: #4299e1 !important; }
          .neumorphic-icon-badge.variant-learning svg { color: #ec4899 !important; }
          .neumorphic-icon-badge.variant-checkin svg { color: #8b5cf6 !important; }
          .neumorphic-icon-badge.variant-accent svg { color: #f6d55c !important; }

          /* Icon badge notifications - same as avatar badges */
          .neumorphic-icon-badge .neumorphic-avatar-badge {
            position: absolute !important;
            top: -0.25rem !important;
            right: -0.25rem !important;
            width: 1rem !important;
            height: 1rem !important;
            border-radius: 50% !important;
            background: var(--nm-background) !important;
            box-shadow: var(--nm-shadow-main) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 0.75rem !important;
            font-weight: bold !important;
            color: var(--nm-text-color) !important;
            transition: all 0.3s ease !important;
          }

          /* NeumorphicGoals Standardized Styles - Global Template */
          .neumorphic-goals-container {
            background: var(--nm-background) !important;
            box-shadow: var(--nm-shadow-main) !important;
            border-radius: var(--nm-radius) !important;
            padding: 1.5rem !important;
            transition: all 0.3s ease !important;
          }

          .neumorphic-goals-container:hover {
            box-shadow: var(--nm-shadow-hover) !important;
            transform: translateY(-2px) !important;
          }

          .neumorphic-goals-header {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            margin-bottom: 1.5rem !important;
          }

          .neumorphic-goals-title {
            font-size: 1.5rem !important;
            font-weight: normal !important;
            color: var(--nm-text-color) !important;
            margin: 0 !important;
          }

          .neumorphic-goals-add-button {
            width: 2rem !important;
            height: 2rem !important;
            border-radius: 50% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            transition: all 0.2s ease !important;
            background: var(--nm-background) !important;
            box-shadow: var(--nm-shadow-main) !important;
            border: none !important;
            cursor: pointer !important;
          }

          .neumorphic-goals-add-button:hover {
            transform: scale(1.05) !important;
            box-shadow: var(--nm-shadow-hover) !important;
          }

          .neumorphic-goals-add-button svg {
            width: 1rem !important;
            height: 1rem !important;
            color: var(--nm-text-color) !important;
          }

          .neumorphic-goals-form {
            background: var(--nm-background) !important;
            box-shadow: var(--nm-shadow-inset) !important;
            border-radius: var(--nm-radius) !important;
            padding: 1.5rem !important;
            margin-bottom: 1rem !important;
          }

          .neumorphic-goals-item {
            background: var(--nm-background) !important;
            box-shadow: var(--nm-shadow-inset) !important;
            border-radius: var(--nm-radius) !important;
            padding: 1.5rem !important;
            transition: all 0.3s ease !important;
            margin-bottom: 1rem !important;
          }

          .neumorphic-goals-item:hover {
            box-shadow: var(--nm-shadow-hover) !important;
            transform: translateY(-2px) !important;
          }

          .neumorphic-goals-item.completed {
            opacity: 0.6 !important;
          }

          .neumorphic-goals-item-content {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
          }

          .neumorphic-goals-item-text {
            flex: 1 !important;
            min-width: 0 !important;
            padding-right: 1rem !important;
          }

          .neumorphic-goals-item-textarea {
            background: transparent !important;
            padding: 0.75rem 1rem !important;
            font-size: 0.875rem !important;
            width: 100% !important;
            border: none !important;
            outline: none !important;
            resize: none !important;
            color: var(--nm-text-color) !important;
            box-shadow: none !important;
            min-height: 3rem !important;
            overflow: hidden !important;
            transition: text-decoration 0.3s ease !important;
          }

          .neumorphic-goals-item-textarea.completed {
            text-decoration: line-through !important;
            color: #718096 !important;
          }

          .neumorphic-goals-item-actions {
            display: flex !important;
            align-items: center !important;
            gap: 0.75rem !important;
            flex-shrink: 0 !important;
          }

          .neumorphic-goals-date-picker {
            opacity: 0 !important;
            transition: opacity 0.2s ease !important;
          }

          .neumorphic-goals-item:hover .neumorphic-goals-date-picker {
            opacity: 0.6 !important;
          }

          .neumorphic-goals-item.completed .neumorphic-goals-date-picker {
            opacity: 0.6 !important;
          }

          .neumorphic-goals-toggle-button {
            background: none !important;
            border: none !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
            flex-shrink: 0 !important;
            color: #9ca3af !important;
          }

          .neumorphic-goals-toggle-button:hover {
            transform: scale(1.05) !important;
            opacity: 0.8 !important;
          }

          .neumorphic-goals-toggle-button.completed {
            color: var(--nm-badge-primary-color) !important;
          }

          .neumorphic-goals-delete-button {
            opacity: 0 !important;
            background: none !important;
            border: none !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
            color: var(--nm-badge-default-color) !important;
          }

          .neumorphic-goals-item:hover .neumorphic-goals-delete-button {
            opacity: 0.6 !important;
          }

          .neumorphic-goals-delete-button:hover {
            opacity: 1 !important;
            color: var(--nm-badge-error-color) !important;
          }

          .neumorphic-goals-completion-info {
            margin-top: 0.5rem !important;
            padding-top: 0.5rem !important;
            border-top: 1px solid var(--nm-chart-border) !important;
          }

          .neumorphic-goals-completion-text {
            font-size: 0.75rem !important;
            color: var(--nm-badge-primary-color) !important;
            opacity: 1 !important;
          }

          .neumorphic-goals-due-info {
            margin-top: 0.5rem !important;
            padding-top: 0.5rem !important;
            border-top: 1px solid var(--nm-chart-border) !important;
          }

          .neumorphic-goals-due-text {
            font-size: 0.75rem !important;
            color: var(--nm-badge-default-color) !important;
          }

          .neumorphic-goals-empty-state {
            text-align: center !important;
            padding: 2rem !important;
            color: var(--nm-badge-default-color) !important;
          }

          .neumorphic-goals-empty-icon {
            width: 3rem !important;
            height: 3rem !important;
            margin: 0 auto 0.75rem !important;
            opacity: 0.5 !important;
          }

          /* Global :disabled and :active States - Standardized Template */
          
          /* :disabled States - All interactive elements */
          button:disabled,
          input:disabled,
          textarea:disabled,
          select:disabled,
          [role="button"]:disabled,
          [data-radix-select-trigger]:disabled {
            opacity: 0.6 !important;
            cursor: not-allowed !important;
            box-shadow: none !important;
            border: 1px solid #d1d9e6 !important;
            pointer-events: none !important;
          }

          /* :active States - All interactive elements (exclude bottom nav, time picker close button, and search icon button) */
          button:active:not(:disabled):not(.bottom-nav-btn):not(.time-picker-close-btn):not(.search-icon-btn),
          [role="button"]:active:not(:disabled):not(.bottom-nav-btn):not(.time-picker-close-btn):not(.search-icon-btn),
          .neumorphic-button:active:not(:disabled) {
            transform: scale(0.98) !important;
            box-shadow: var(--nm-shadow-inset) !important;
            transition: all 100ms ease-out !important;
          }

          .bottom-nav-btn:active,
          .bottom-nav-btn:focus,
          .bottom-nav-btn:hover {
            background: transparent !important;
            box-shadow: none !important;
            transform: none !important;
            outline: none !important;
          }

          /* Specific :active state for primary buttons */
          button:active:not(:disabled).primary,
          .neumorphic-button:active:not(:disabled)[data-variant="primary"] {
            box-shadow: inset 2px 2px 6px rgba(0,0,0,0.3), inset -2px -2px 6px rgba(255,0,0,0.1) !important;
          }

          /* :active states for form inputs */
          input:active:not(:disabled),
          textarea:active:not(:disabled),
          [data-radix-select-trigger]:active:not(:disabled) {
            box-shadow: var(--nm-shadow-inset-hover) !important;
            transition: all 100ms ease-out !important;
          }

          /* :active states for cards and clickable elements */
          .neumorphic-card[data-clickable]:active,
          [data-clickable]:active {
            transform: translateY(1px) scale(0.99) !important;
            box-shadow: var(--nm-shadow-inset) !important;
            transition: all 100ms ease-out !important;
          }

          /* NeumorphicDatePicker Standardized Styles - Global Template */
          .neumorphic-datepicker-trigger {
            width: 100% !important;
            padding: 12px 16px !important;
            text-align: left !important;
            color: var(--nm-text-color) !important;
            background: var(--nm-background) !important;
            box-shadow: var(--nm-shadow-inset) !important;
            border-radius: 12px !important;
            border: none !important;
            transition: all 0.3s ease !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            cursor: pointer !important;
          }

          .neumorphic-datepicker-trigger:focus {
            outline: none !important;
            ring: 0 !important;
            border: none !important;
          }

          .neumorphic-datepicker-trigger:hover {
            box-shadow: var(--nm-shadow-inset-hover) !important;
          }

          .neumorphic-datepicker-content {
            border-radius: var(--nm-radius) !important;
            background: var(--nm-background) !important;
            box-shadow: var(--nm-shadow-main) !important;
            border: none !important;
            padding: 16px !important;
          }

          .neumorphic-calendar .rdp-months {
            color: var(--nm-text-color) !important;
          }

          .neumorphic-calendar .rdp-head_cell {
            color: var(--nm-text-color) !important;
            font-weight: 600 !important;
          }

          .neumorphic-calendar .rdp-button {
            border-radius: 8px !important;
            border: none !important;
            background: transparent !important;
            color: var(--nm-text-color) !important;
            transition: all 0.2s ease !important;
          }

          .neumorphic-calendar .rdp-button:hover {
            background: var(--nm-background) !important;
            box-shadow: var(--nm-shadow-inset) !important;
          }

          .neumorphic-calendar .rdp-day_today {
            font-weight: bold !important;
            border: none !important;
            border-radius: 8px !important;
            background: transparent !important;
            color: #2f949d !important;
            box-shadow: none !important;
          }

          .neumorphic-calendar button[aria-selected="true"],
          .neumorphic-calendar .rdp-button[aria-selected="true"] {
            background: var(--nm-background) !important;
            color: var(--nm-text-color) !important;
            box-shadow: var(--nm-shadow-inset) !important;
            border: none !important;
          }

          .neumorphic-calendar button.rdp-day_today[aria-selected="true"],
          .neumorphic-calendar .rdp-button.rdp-day_today[aria-selected="true"] {
            background: var(--nm-background) !important;
            color: var(--nm-text-color) !important;
            font-weight: bold !important;
            box-shadow: var(--nm-shadow-inset) !important;
            border: none !important;
          }

          .neumorphic-calendar .rdp-nav_button {
            border-radius: 50% !important;
            background: var(--nm-background) !important;
            box-shadow: var(--nm-shadow-main) !important;
            border: none !important;
            color: var(--nm-text-color) !important;
            width: 32px !important;
            height: 32px !important;
            transition: all 0.2s ease !important;
          }

          .neumorphic-calendar .rdp-nav_button:hover {
            box-shadow: var(--nm-shadow-hover) !important;
          }

          /* NeumorphicSelectableBadges Standardized Styles - Global Template */
          .neumorphic-selectable-badges-container {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 0.75rem !important;
            padding: 0.5rem !important;
            border-radius: var(--nm-radius) !important;
          }

          .neumorphic-selectable-badge {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 0.5rem 1rem !important;
            border-radius: 9999px !important; /* Pill shape */
            background: var(--nm-background) !important;
            box-shadow: var(--nm-shadow-main) !important;
            color: var(--nm-text-color) !important;
            font-size: 0.875rem !important;
            font-weight: normal !important;
            cursor: pointer !important;
            transition: all 0.3s ease !important;
            border: none !important;
            outline: none !important;
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            appearance: none !important;
            user-select: none !important;
          }

          .neumorphic-selectable-badge:hover {
            box-shadow: var(--nm-shadow-hover) !important;
            transform: translateY(-1px) !important;
          }

          .neumorphic-selectable-badge:active {
            transform: scale(0.98) !important;
            box-shadow: var(--nm-shadow-inset) !important;
          }

          .neumorphic-selectable-badge.active {
            background: var(--nm-badge-primary-color) !important;
            color: white !important;
            box-shadow: var(--nm-shadow-inset) !important;
          }

          .neumorphic-selectable-badge.active:hover {
            box-shadow: var(--nm-shadow-inset-hover) !important;
            transform: none !important;
          }
          
          /* Specific styling for category badges */
          .neumorphic-selectable-badge.category.active {
            background: var(--nm-badge-category-color) !important;
            color: white !important;
          }
          .neumorphic-selectable-badge.category:not(.active) {
            color: var(--nm-badge-category-dark) !important;
            background: var(--nm-badge-category-muted) !important;
            box-shadow: var(--nm-shadow-main) !important;
          }
          .neumorphic-selectable-badge.category:not(.active):hover {
            box-shadow: var(--nm-shadow-hover) !important;
            transform: translateY(-1px) !important;
            background: var(--nm-badge-category-color) !important;
            color: white !important;
          }

        `}
      </style>
      <div className="min-h-screen w-full bg-[--nm-background] text-[--nm-text-color]">
        {currentPageName !== 'App' && (
          <nav className="p-4 border-b border-gray-200">
            <div className="flex gap-4">
              <Link 
                to={createPageUrl('Home')} 
                className={`px-4 py-2 rounded-lg transition-colors ${currentPageName === 'Home' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Home
              </Link>
              <Link 
                to={createPageUrl('V11')} 
                className={`px-4 py-2 rounded-lg transition-colors ${currentPageName === 'V11' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
              >
                V11
              </Link>
              <Link 
                to={createPageUrl('Styling')} 
                className={`px-4 py-2 rounded-lg transition-colors ${currentPageName === 'Styling' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Styling
              </Link>
              <Link 
                to={createPageUrl('Archive')} 
                className={`px-4 py-2 rounded-lg transition-colors ${currentPageName === 'Archive' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Archive
              </Link>
              <Link 
                to={createPageUrl('Test')} 
                className={`px-4 py-2 rounded-lg transition-colors ${currentPageName === 'Test' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Test
              </Link>
              <Link 
                to={createPageUrl('StylingMobile')} 
                className={`px-4 py-2 rounded-lg transition-colors ${currentPageName === 'StylingMobile' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Mobile
              </Link>
            </div>
          </nav>
        )}
        <main className={currentPageName === 'App' ? 'p-0 mt-[65px] h-[calc(100vh-65px)] overflow-hidden' : 'p-4 sm:p-6 md:p-8'}>
          {children}
        </main>
      </div>
    </>
  );
};

export default NeumorphicLayout;