'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BaseComponentProps } from '@/types';

interface ActivityFiltersProps extends BaseComponentProps {
  typeFilter: string;
  severityFilter: string;
  onTypeFilterChange: (value: string) => void;
  onSeverityFilterChange: (value: string) => void;
}

export default function ActivityFilters({
  typeFilter,
  severityFilter,
  onTypeFilterChange,
  onSeverityFilterChange,
}: ActivityFiltersProps) {
  return (
    <div className="mt-4 flex gap-4">
      <Select value={typeFilter || 'all'} onValueChange={onTypeFilterChange}>
        <SelectTrigger className="w-48 bg-white/60 backdrop-blur-sm dark:bg-gray-700/60">
          <SelectValue placeholder="Filter by type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="file_upload">File Upload</SelectItem>
          <SelectItem value="file_download">File Download</SelectItem>
          <SelectItem value="user_registration">User Registration</SelectItem>
          <SelectItem value="user_login">User Login</SelectItem>
          <SelectItem value="user_logout">User Logout</SelectItem>
          <SelectItem value="malware_detected">Malware Detected</SelectItem>
          <SelectItem value="suspicious_activity">
            Suspicious Activity
          </SelectItem>
          <SelectItem value="rate_limit">Rate Limit</SelectItem>
          <SelectItem value="invalid_file">Invalid File</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={severityFilter || 'all'}
        onValueChange={onSeverityFilterChange}
      >
        <SelectTrigger className="w-48 bg-white/60 backdrop-blur-sm dark:bg-gray-700/60">
          <SelectValue placeholder="Filter by severity" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Severities</SelectItem>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
