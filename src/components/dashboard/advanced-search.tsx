"use client";

import { useState } from "react";
import { FileSearchFilters } from "@/domains/user/user-file-types";
import { Search, X, Calendar, HardDrive, FileType } from "lucide-react";

interface AdvancedSearchProps {
  initialFilters: FileSearchFilters;
  onSearch: (filters: FileSearchFilters) => void;
  onCancel: () => void;
}

export function AdvancedSearch({ initialFilters, onSearch, onCancel }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<FileSearchFilters>(initialFilters);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };

  const clearFilters = () => {
    setFilters({});
  };

  const formatDateForInput = (date?: Date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const parseInputDate = (dateString: string) => {
    if (!dateString) return undefined;
    return new Date(dateString + 'T00:00:00.000Z');
  };

  const formatSizeForInput = (bytes?: number) => {
    if (!bytes) return '';
    return Math.round(bytes / (1024 * 1024)).toString(); // Convert to MB
  };

  const parseSizeInput = (sizeString: string) => {
    if (!sizeString) return undefined;
    return parseInt(sizeString) * 1024 * 1024; // Convert from MB to bytes
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* File Name */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
            <Search className="w-4 h-4" />
            File Name
          </label>
          <input
            type="text"
            placeholder="Search in file names..."
            value={filters.name || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value || undefined }))}
            className="w-full px-3 py-2 bg-input border border-border text-foreground placeholder-muted-foreground"
          />
        </div>

        {/* Status */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
            <FileType className="w-4 h-4" />
            Status
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any || undefined }))}
            className="w-full px-3 py-2 bg-input border border-border text-foreground"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="expiring_soon">Expiring Soon</option>
          </select>
        </div>

        {/* MIME Type */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
            <FileType className="w-4 h-4" />
            File Type
          </label>
          <select
            value={filters.mimeType || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, mimeType: e.target.value || undefined }))}
            className="w-full px-3 py-2 bg-input border border-border text-foreground"
          >
            <option value="">All Types</option>
            <option value="image/">Images</option>
            <option value="video/">Videos</option>
            <option value="audio/">Audio</option>
            <option value="application/pdf">PDF</option>
            <option value="text/">Text Files</option>
            <option value="application/">Applications</option>
          </select>
        </div>

        {/* Upload Date Range */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
            <Calendar className="w-4 h-4" />
            Upload Date From
          </label>
          <input
            type="date"
            value={formatDateForInput(filters.startDate)}
            onChange={(e) => setFilters(prev => ({ ...prev, startDate: parseInputDate(e.target.value) }))}
            className="w-full px-3 py-2 bg-input border border-border text-foreground"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
            <Calendar className="w-4 h-4" />
            Upload Date To
          </label>
          <input
            type="date"
            value={formatDateForInput(filters.endDate)}
            onChange={(e) => setFilters(prev => ({ ...prev, endDate: parseInputDate(e.target.value) }))}
            className="w-full px-3 py-2 bg-input border border-border text-foreground"
          />
        </div>

        {/* File Size Range */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
            <HardDrive className="w-4 h-4" />
            Min Size (MB)
          </label>
          <input
            type="number"
            placeholder="0"
            min="0"
            value={formatSizeForInput(filters.minSize)}
            onChange={(e) => setFilters(prev => ({ ...prev, minSize: parseSizeInput(e.target.value) }))}
            className="w-full px-3 py-2 bg-input border border-border text-foreground placeholder-muted-foreground"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
            <HardDrive className="w-4 h-4" />
            Max Size (MB)
          </label>
          <input
            type="number"
            placeholder="50"
            min="0"
            max="50"
            value={formatSizeForInput(filters.maxSize)}
            onChange={(e) => setFilters(prev => ({ ...prev, maxSize: parseSizeInput(e.target.value) }))}
            className="w-full px-3 py-2 bg-input border border-border text-foreground placeholder-muted-foreground"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <button
          type="submit"
          className="btn-tactical-primary flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          Apply Filters
        </button>
        
        <button
          type="button"
          onClick={clearFilters}
          className="btn-tactical flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Clear All
        </button>
        
        <button
          type="button"
          onClick={onCancel}
          className="btn-tactical text-muted-foreground"
        >
          Cancel
        </button>
      </div>

      {/* Active Filters Summary */}
      {Object.keys(filters).length > 0 && (
        <div className="mt-4 p-3 bg-secondary/20 border border-border rounded-lg">
          <p className="text-sm font-medium text-foreground mb-2">Active Filters:</p>
          <div className="flex flex-wrap gap-2">
            {filters.name && (
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded border border-primary/20">
                Name: "{filters.name}"
              </span>
            )}
            {filters.status && (
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded border border-primary/20">
                Status: {filters.status}
              </span>
            )}
            {filters.mimeType && (
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded border border-primary/20">
                Type: {filters.mimeType}
              </span>
            )}
            {filters.startDate && (
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded border border-primary/20">
                From: {filters.startDate.toLocaleDateString()}
              </span>
            )}
            {filters.endDate && (
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded border border-primary/20">
                To: {filters.endDate.toLocaleDateString()}
              </span>
            )}
            {filters.minSize && (
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded border border-primary/20">
                Min: {formatSizeForInput(filters.minSize)}MB
              </span>
            )}
            {filters.maxSize && (
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded border border-primary/20">
                Max: {formatSizeForInput(filters.maxSize)}MB
              </span>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
