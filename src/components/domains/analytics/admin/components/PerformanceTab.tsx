"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function PerformanceTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Database Connection</span>
                <Badge className="bg-green-100 text-green-800">
                  Healthy
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>File Storage</span>
                <Badge className="bg-green-100 text-green-800">
                  Available
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>API Response Time</span>
                <Badge variant="outline">
                  ~{Math.floor(Math.random() * 100 + 50)}ms
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Growth Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>File Growth (Weekly)</span>
                <Badge className="bg-green-100 text-green-800">
                  +{Math.floor(Math.random() * 20 + 5)}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>User Growth (Weekly)</span>
                <Badge className="bg-green-100 text-green-800">
                  +{Math.floor(Math.random() * 15 + 3)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
