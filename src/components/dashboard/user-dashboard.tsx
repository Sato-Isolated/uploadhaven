"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import { PaginationParams, FileSearchFilters } from "@/domains/user/user-file-types";
import { useUserFiles, useUserStats } from "@/hooks/use-user-files";
import { DashboardStats } from "./dashboard-stats";
import { DashboardUpload } from "./dashboard-upload";
import { UserFilesList } from "./user-files-list";
import { AdvancedSearch } from "./advanced-search";
import { Plus, Search, Filter } from "lucide-react";

export function UserDashboard() {
  const { data: session } = useSession();
  const [showUpload, setShowUpload] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  
  // État de la pagination et des filtres
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  
  const [filters, setFilters] = useState<FileSearchFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Data retrieval
  const { data: files, isLoading: filesLoading, error: filesError } = useUserFiles({
    pagination,
    filters: { ...filters, name: searchTerm || undefined },
  });
  
  const { data: stats, isLoading: statsLoading } = useUserStats();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 })); // Reset à la page 1
  };

  const handleAdvancedSearch = (newFilters: FileSearchFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
    setShowAdvancedSearch(false);
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleSortChange = (sortBy: 'createdAt' | 'name' | 'size') => {
    setPagination(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc',
      page: 1,
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters = Object.keys(filters).length > 0 || searchTerm.length > 0;

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Welcome back, {session?.user.name || session?.user.email}
              </h1>
              <p className="text-muted-foreground">
                Manage your files, view statistics, and upload new content.
              </p>
            </div>
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="btn-tactical-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Upload
            </button>
          </div>

          {/* Statistiques */}
          <DashboardStats stats={stats} isLoading={statsLoading} />
        </div>

        {/* Zone d'upload dépliable */}
        {showUpload && (
          <div className="mb-8 slide-in-from-top">
            <DashboardUpload 
              onUploadComplete={() => {
                setShowUpload(false);
                // React Query hooks will automatically revalidate
              }} 
            />
          </div>
        )}

        {/* Barre de recherche et filtres */}
        <div className="tactical-card p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Recherche simple */}
            <form onSubmit={handleSearchSubmit} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search files by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-input border border-border text-foreground placeholder-muted-foreground transition-all duration-200 hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </form>

            {/* Boutons d'actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className={`btn-tactical flex items-center gap-2 ${showAdvancedSearch ? 'bg-primary text-primary-foreground' : ''}`}
              >
                <Filter className="w-4 h-4" />
                Advanced
              </button>
              
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="btn-tactical text-warning hover:text-warning/80"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Recherche avancée dépliable */}
          {showAdvancedSearch && (
            <div className="mt-4 pt-4 border-t border-border slide-in-from-top">
              <AdvancedSearch
                initialFilters={filters}
                onSearch={handleAdvancedSearch}
                onCancel={() => setShowAdvancedSearch(false)}
              />
            </div>
          )}
        </div>

        {/* File list */}
        <UserFilesList
          files={files}
          isLoading={filesLoading}
          error={filesError}
          pagination={pagination}
          onPageChange={handlePageChange}
          onSortChange={handleSortChange}
        />
      </div>
    </div>
  );
}
