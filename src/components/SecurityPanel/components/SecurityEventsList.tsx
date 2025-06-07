import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";
import { SecurityEventsListProps, SecurityEvent } from "../types";
import { getSeverityColor, getEventIcon, formatTimestamp } from "../utils";

export default function SecurityEventsList({
  events,
  isLoading,
}: SecurityEventsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredEvents = useMemo(() => {
    return events.filter((event: SecurityEvent) => {
      const matchesSearch =
        searchTerm === "" ||
        event.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.details.ip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.details.filename
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Security Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse"
              >
                <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Security Events ({filteredEvents.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search events, IPs, or filenames..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
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
              <Select value={typeFilter} onValueChange={setTypeFilter}>
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
                  <SelectItem value="suspicious_activity">
                    Suspicious
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-y-auto space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {events.length === 0
                ? "No security events recorded"
                : "No events match the current filters"}
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="mt-0.5">{getEventIcon(event.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {event.message}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getSeverityColor(event.severity)}`}
                    >
                      {event.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTimestamp(event.timestamp)}
                  </p>
                  {event.details.ip && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      IP: {event.details.ip}
                    </p>
                  )}
                  {event.details.filename && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      File: {event.details.filename}
                    </p>
                  )}
                  {event.details.fileSize && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Size: {(event.details.fileSize / 1024 / 1024).toFixed(2)}
                      MB
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
