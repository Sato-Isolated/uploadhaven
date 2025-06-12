import { Card, CardContent } from '@/components/ui/card';
import type { SecurityEvent, BaseComponentProps } from '@/types';
import { useSecurityEventsFilter } from './hooks/useSecurityEventsFilter';
import { SecurityEventsLoadingState } from './components/SecurityEventsLoadingState';
import { SecurityEventsHeader } from './components/SecurityEventsHeader';
import { SecurityEventsFilters } from './components/SecurityEventsFilters';
import { SecurityEventsListContent } from './components/SecurityEventsListContent';

interface SecurityEventsListProps extends BaseComponentProps {
  events: SecurityEvent[];
  isLoading?: boolean;
}

export default function SecurityEventsList({
  events,
  isLoading,
}: SecurityEventsListProps) {
  const {
    searchTerm,
    severityFilter,
    typeFilter,
    showFilters,
    filteredEvents,
    setSearchTerm,
    setSeverityFilter,
    setTypeFilter,
    setShowFilters,
    clearFilters,
  } = useSecurityEventsFilter(events);

  if (isLoading) {
    return <SecurityEventsLoadingState />;
  }

  return (
    <Card>
      {' '}
      <SecurityEventsHeader
        eventCount={filteredEvents.length}
        onToggleFilters={() => setShowFilters(!showFilters)}
      />
      {showFilters && (
        <SecurityEventsFilters
          searchTerm={searchTerm}
          severityFilter={severityFilter}
          typeFilter={typeFilter}
          onSearchChange={setSearchTerm}
          onSeverityChange={setSeverityFilter}
          onTypeChange={setTypeFilter}
          onClearFilters={clearFilters}
        />
      )}
      <CardContent>
        <div className="max-h-96 space-y-3 overflow-y-auto">
          <SecurityEventsListContent
            events={events}
            filteredEvents={filteredEvents}
          />
        </div>
      </CardContent>
    </Card>
  );
}
