import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';

interface SecurityEventsFiltersProps {
  searchTerm: string;
  severityFilter: string;
  typeFilter: string;
  onSearchChange: (term: string) => void;
  onSeverityChange: (severity: string) => void;
  onTypeChange: (type: string) => void;
  onClearFilters: () => void;
}

export function SecurityEventsFilters({
  searchTerm,
  severityFilter,
  typeFilter,
  onSearchChange,
  onSeverityChange,
  onTypeChange,
  onClearFilters,
}: SecurityEventsFiltersProps) {
  return (
    <div className="mt-4 space-y-4 rounded-lg border bg-gray-50 p-4 dark:bg-gray-800">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              placeholder="Search events, IPs, or filenames..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={severityFilter} onValueChange={onSeverityChange}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={onTypeChange}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Event Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="rate_limit">Rate Limit</SelectItem>
            <SelectItem value="invalid_file">Invalid File</SelectItem>
            <SelectItem value="blocked_ip">Blocked IP</SelectItem>
            <SelectItem value="malware_detected">Malware</SelectItem>
            <SelectItem value="large_file">Large File</SelectItem>
            <SelectItem value="access_denied">Access Denied</SelectItem>
            <SelectItem value="suspicious_activity">Suspicious</SelectItem>
            <SelectItem value="system_maintenance">
              System Maintenance
            </SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
