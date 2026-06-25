'use client';

import { FileX, Search } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: 'empty' | 'search';
  searchQuery?: string;
  onClearSearch?: () => void;
  className?: string;
}

const ICONS = {
  empty: <FileX className="w-16 h-16 mx-auto text-gray-300" strokeWidth={1.5} />,
  search: <Search className="w-16 h-16 mx-auto text-gray-300" strokeWidth={1.5} />,
};

export function EmptyState({
  title,
  description,
  icon = 'empty',
  searchQuery,
  onClearSearch,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="text-4xl mb-4">{ICONS[icon]}</div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description && <p className="text-gray-500 mt-1">{description}</p>}
      
      {searchQuery && onClearSearch && (
        <button
          onClick={onClearSearch}
          className="text-blue-600 hover:underline mt-2 text-sm"
        >
          Clear search for "{searchQuery}"
        </button>
      )}
    </div>
  );
}
