"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ScanHistoryEntry {
  date: Date;
  type: string;
  results: number;
  threats: number;
}

interface ScanHistoryProps {
  scanHistory: ScanHistoryEntry[];
}

export function ScanHistory({ scanHistory }: ScanHistoryProps) {
  if (scanHistory.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Scan History</CardTitle>
        <CardDescription>Previous security scans performed</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {scanHistory.map((scan, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline">{scan.type}</Badge>
                <span className="text-sm">
                  {scan.date.toLocaleDateString()} {scan.date.toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span>{scan.results} checks</span>
                {scan.threats > 0 ? (
                  <span className="text-red-600 font-medium">
                    {scan.threats} threats
                  </span>
                ) : (
                  <span className="text-green-600">Clean</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
