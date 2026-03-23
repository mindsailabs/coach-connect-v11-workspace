import React, { useState, useRef } from 'react';
import { Filter, Search, Plus } from 'lucide-react';
import RotatableBadge from '@/components/ui/RotatableBadge';
import ViewHeader from '@/components/ui/ViewHeader';

export default function ListToolbar({
  onAdd,
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  filterStates,
  filterColors,
  onFilterChange,
  showFilter: externalShowFilter,
  onFilterToggle,
  extraFilters,
  currentFilter,
  title,
  subtitle
}) {
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const searchInputRef = useRef(null);

  const isFilterVisible = externalShowFilter !== undefined ? externalShowFilter : showFilter;
  const hasActiveFilters = currentFilter && currentFilter !== 'All' || !!extraFilters;

  const handleFilterToggle = () => {
    const nextFilterVisible = !isFilterVisible;
    if (nextFilterVisible && showSearch) {
      setShowSearch(false);
      if (onSearchChange) onSearchChange('');
    }
    if (onFilterToggle) {
      onFilterToggle();
    } else {
      setShowFilter((prev) => !prev);
    }
  };

  const icons = [];
  
  if (filterStates && filterStates.length > 0) {
    icons.push({
      id: 'filter',
      icon: Filter,
      isActive: isFilterVisible,
      badge: hasActiveFilters,
      onClick: handleFilterToggle
    });
  }

  if (onSearchChange) {
    icons.push({
      id: 'search',
      icon: Search,
      isActive: showSearch,
      onClick: () => {
        const next = !showSearch;
        setShowSearch(next);
        if (next) {
          setTimeout(() => searchInputRef.current?.focus(), 150);
          if (isFilterVisible) {
            if (onFilterToggle) onFilterToggle(); else setShowFilter(false);
          }
        } else {
          onSearchChange('');
        }
      }
    });
  }

  if (onAdd) {
    icons.push({
      id: 'add',
      icon: Plus,
      onClick: onAdd
    });
  }

  return (
    <ViewHeader title={title} subtitle={subtitle} icons={icons}>
      {/* Search row - expands and pushes content down */}
      <div
        style={{
          overflow: 'hidden',
          maxHeight: showSearch ? '80px' : '0px',
          opacity: showSearch ? 1 : 0,
          transition: 'max-height 200ms ease-out, opacity 200ms ease-out',
          marginTop: showSearch ? '16px' : '0px'
        }}>
        <div className="relative w-full pt-3">
          <div className="absolute top-3 left-0 h-[44px] flex items-center pl-4 pointer-events-none">
            <Search className="w-4 h-4" style={{ color: '#2f949d' }} />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-[44px] pl-11 pr-4 text-sm focus:outline-none rounded-xl" style={{background: 'var(--nm-background)', boxShadow: 'var(--nm-shadow-inset)'}} />
        </div>
      </div>

      {/* Filter badge row - expands and pushes content down */}
      <div
        style={{
          overflow: 'visible',
          maxHeight: isFilterVisible ? '80px' : '0px',
          opacity: isFilterVisible ? 1 : 0,
          transition: 'opacity 200ms ease-out, max-height 200ms ease-out',
          pointerEvents: isFilterVisible ? 'auto' : 'none',
          marginTop: isFilterVisible ? '16px' : '0px'
        }}>
        <div className="flex items-center justify-end gap-3 pt-3 pb-4">
          {filterStates && filterColors &&
            <RotatableBadge
              states={filterStates}
              colors={filterColors}
              onRotate={(value) => onFilterChange?.(value)}
              initialState={currentFilter} />
          }
          {extraFilters}
        </div>
      </div>
    </ViewHeader>
  );
}