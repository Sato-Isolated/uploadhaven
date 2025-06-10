import { useState, useMemo } from "react";
import type { SecurityEvent } from "@/types";

export interface UseSecurityEventsFilterReturn {
  // Filter state
  searchTerm: string;
  severityFilter: string;
  typeFilter: string;
  showFilters: boolean;
  
  // Filtered data
  filteredEvents: SecurityEvent[];
  
  // Filter handlers
  setSearchTerm: (term: string) => void;
  setSeverityFilter: (severity: string) => void;
  setTypeFilter: (type: string) => void;
  setShowFilters: (show: boolean) => void;
  clearFilters: () => void;
}

export function useSecurityEventsFilter(events: SecurityEvent[]): UseSecurityEventsFilterReturn {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredEvents = useMemo(() => {
    return events.filter((event: SecurityEvent) => {
      const matchesSearch =
        searchTerm === "" ||
        (typeof event.details === 'string' && event.details.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (typeof event.details === 'object' && event.details?.ip?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (typeof event.details === 'object' && event.details?.filename?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        event.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.ip?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSeverity =
        severityFilter === "all" || event.severity === severityFilter;
      const matchesType = typeFilter === "all" || event.type === typeFilter;

      return matchesSearch && matchesSeverity && matchesType;
    });
  }, [events, searchTerm, severityFilter, typeFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setSeverityFilter("all");
    setTypeFilter("all");
  };

  return {
    // Filter state
    searchTerm,
    severityFilter,
    typeFilter,
    showFilters,
    
    // Filtered data
    filteredEvents,
    
    // Filter handlers
    setSearchTerm,
    setSeverityFilter,
    setTypeFilter,
    setShowFilters,
    clearFilters,
  };
}
