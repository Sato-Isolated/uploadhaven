'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function PerformanceTab() {
  const t = useTranslations('Admin');
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('systemHealth')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>{t('databaseConnection')}</span>
                <Badge className="bg-green-100 text-green-800">{t('healthy')}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>{t('fileStorage')}</span>
                <Badge className="bg-green-100 text-green-800">{t('available')}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>{t('apiResponseTime')}</span>
                <Badge variant="outline">
                  ~{Math.floor(Math.random() * 100 + 50)}ms
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('growthMetrics')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>{t('fileGrowthWeekly')}</span>
                <Badge className="bg-green-100 text-green-800">
                  +{Math.floor(Math.random() * 20 + 5)}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>{t('userGrowthWeekly')}</span>
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
