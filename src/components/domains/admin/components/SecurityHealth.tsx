'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  TrendingDown,
  Users,
  Lock,
  Activity,
  RefreshCw,
  Zap,
  AlertCircle,
  Target,
  ArrowRight
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { SecurityMetrics, SecurityIssue, SecurityRecommendation } from '@/types/admin';
import { toast } from 'sonner';

interface SecurityHealthProps {
  detailed?: boolean;
}

export default function SecurityHealth({ detailed = false }: SecurityHealthProps) {
  const t = useTranslations('Admin');
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSecurityMetrics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/security/metrics');
      
      if (!response.ok) {
        throw new Error('Failed to fetch security metrics');
      }

      const data = await response.json();
      setMetrics(data.data);
    } catch (error) {
      console.error('Security metrics error:', error);
      toast.error('Failed to load security metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityMetrics();
  }, []);

  const getStatusIcon = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy':
        return CheckCircle;
      case 'warning':
        return AlertTriangle;
      case 'critical':
        return XCircle;
    }
  };

  const getStatusColor = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'critical':
        return 'text-red-600 dark:text-red-400';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'low':
        return 'text-blue-600 dark:text-blue-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'high':
        return 'text-red-600 dark:text-red-400';
    }
  };

  const getPriorityColor = (priority: 'low' | 'medium' | 'high' | 'critical') => {
    switch (priority) {
      case 'low':
        return 'text-gray-600 dark:text-gray-400';
      case 'medium':
        return 'text-blue-600 dark:text-blue-400';
      case 'high':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'critical':
        return 'text-red-600 dark:text-red-400';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white/70 dark:bg-gray-800/40 border-gray-200/60 dark:border-gray-700/60 shadow-sm dark:shadow-gray-900/30 backdrop-blur-sm">
        <CardHeader className="border-b border-gray-200/60 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-700/20">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-50">
            <Shield className="h-5 w-5 animate-pulse text-blue-600 dark:text-blue-400" />
            {t('securityHealth')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {Array.from({ length: detailed ? 6 : 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-2 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className="bg-white/70 dark:bg-gray-800/40 border-gray-200/60 dark:border-gray-700/60 shadow-sm dark:shadow-gray-900/30 backdrop-blur-sm">
        <CardHeader className="border-b border-gray-200/60 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-700/20">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-50">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            {t('securityHealth')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="py-8 text-center">
            <XCircle className="mx-auto mb-2 h-8 w-8 text-red-500" />
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('securityDataUnavailable')}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchSecurityMetrics}
              className="mt-3 border-gray-300/60 dark:border-gray-600/60"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('retry')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const StatusIcon = getStatusIcon(metrics.status);
  const statusColor = getStatusColor(metrics.status);
  const scoreColor = getScoreColor(metrics.score);

  return (
    <Card className="bg-white/70 dark:bg-gray-800/40 border-gray-200/60 dark:border-gray-700/60 shadow-sm dark:shadow-gray-900/30 backdrop-blur-sm">
      <CardHeader className="border-b border-gray-200/60 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-700/20">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-50">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            {t('securityHealth')}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchSecurityMetrics}
            className="h-8 w-8 p-0 hover:bg-gray-100/80 dark:hover:bg-gray-700/60"
          >
            <RefreshCw className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Security Score */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusIcon className={`h-6 w-6 ${statusColor}`} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-gray-50">
                    {t('securityScore')}
                  </span>
                  <span className={`text-xl font-bold ${scoreColor}`}>
                    {metrics.score}/100
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {metrics.status === 'healthy' ? t('securityHealthy') : 
                   metrics.status === 'warning' ? t('securityWarning') : t('securityCritical')}
                </p>
              </div>
            </div>
            <Badge 
              variant={metrics.status === 'healthy' ? 'default' : 
                      metrics.status === 'warning' ? 'secondary' : 'destructive'}
              className="text-xs"
            >
              {metrics.status.toUpperCase()}
            </Badge>
          </div>

          {/* Zero Knowledge Compliance */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-50">
              <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              {t('zeroKnowledgeCompliance')}
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('encryptionRate')}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                  {metrics.zeroKnowledge.encryptionRate}%
                </span>
              </div>
              <Progress value={metrics.zeroKnowledge.encryptionRate} className="h-2" />
            </div>
            {metrics.zeroKnowledge.complianceScore && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('complianceScore')}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                    {metrics.zeroKnowledge.complianceScore}/100
                  </span>
                </div>
                <Progress value={metrics.zeroKnowledge.complianceScore} className="h-2" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">{t('encryptedFiles')}</span>
                <p className="font-medium text-gray-900 dark:text-gray-50">
                  {metrics.zeroKnowledge.encryptedFiles}/{metrics.zeroKnowledge.totalFiles}
                </p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">{t('expiredFiles')}</span>
                <p className="font-medium text-gray-900 dark:text-gray-50">
                  {metrics.zeroKnowledge.expiredFiles}
                </p>
              </div>
            </div>
          </div>

          {/* Security Issues */}
          {metrics.issues && metrics.issues.length > 0 && (
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-50">
                <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                {t('securityIssues')} ({metrics.issues.length})
              </h4>
              <div className="space-y-2">
                {metrics.issues.slice(0, detailed ? metrics.issues.length : 3).map((issue, index) => (
                  <div 
                    key={index}
                    className="p-3 rounded-lg border border-gray-200/60 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-700/20"
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`h-4 w-4 mt-0.5 ${getSeverityColor(issue.severity)}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                            {issue.message}
                          </span>
                          <Badge 
                            variant={issue.severity === 'high' ? 'destructive' : 
                                    issue.severity === 'medium' ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {issue.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {t('impact')}: {issue.impact}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Recommendations */}
          {metrics.recommendations && metrics.recommendations.length > 0 && (
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-50">
                <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
                {t('recommendations')} ({metrics.recommendations.length})
              </h4>
              <div className="space-y-2">
                {metrics.recommendations.slice(0, detailed ? metrics.recommendations.length : 3).map((rec, index) => (
                  <div 
                    key={index}
                    className="p-3 rounded-lg border border-gray-200/60 dark:border-gray-700/60 bg-green-50/50 dark:bg-green-900/10"
                  >
                    <div className="flex items-start gap-3">
                      <ArrowRight className={`h-4 w-4 mt-0.5 ${getPriorityColor(rec.priority)}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                            {rec.description}
                          </span>
                          <Badge 
                            variant={rec.priority === 'critical' ? 'destructive' : 
                                    rec.priority === 'high' ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {rec.priority.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Events (Last 24h) */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-50">
              <Activity className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              {t('securityEvents24h')}
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('totalEvents')}</span>
                <span className="font-medium text-gray-900 dark:text-gray-50">
                  {metrics.last24Hours.events}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('criticalEvents')}</span>
                <span className={`font-medium ${metrics.last24Hours.criticalEvents > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-50'}`}>
                  {metrics.last24Hours.criticalEvents}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('blockedRequests')}</span>
                <span className="font-medium text-gray-900 dark:text-gray-50">
                  {metrics.last24Hours.blockedRequests}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('failedLogins')}</span>
                <span className="font-medium text-gray-900 dark:text-gray-50">
                  {metrics.last24Hours.failedLogins}
                </span>
              </div>
            </div>
          </div>

          {detailed && (
            <>
              {/* User Security */}
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-50">
                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  {t('userSecurity')}
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('verificationRate')}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                      {metrics.users.verificationRate}%
                    </span>
                  </div>
                  <Progress value={metrics.users.verificationRate} className="h-2" />
                </div>
                {metrics.users.riskScore && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{t('userRiskScore')}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                        {metrics.users.riskScore}/100
                      </span>
                    </div>
                    <Progress 
                      value={100 - metrics.users.riskScore} 
                      className="h-2" 
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">{t('verifiedUsers')}</span>
                    <p className="font-medium text-gray-900 dark:text-gray-50">
                      {metrics.users.verified}/{metrics.users.total}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">{t('activeToday')}</span>
                    <p className="font-medium text-gray-900 dark:text-gray-50">
                      {metrics.users.activeToday}
                    </p>
                  </div>
                </div>
              </div>

              {/* Threat Intelligence */}
              {metrics.threats && Object.keys(metrics.threats).length > 0 && (
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-50">
                    <Zap className="h-4 w-4 text-red-600 dark:text-red-400" />
                    {t('threatIntelligence')}
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(metrics.threats).map(([type, data]) => (
                      <div 
                        key={type}
                        className="flex items-center justify-between p-2 rounded border border-gray-200/60 dark:border-gray-700/60"
                      >
                        <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {type.replace('_', ' ')}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                            {data.count}
                          </span>
                          <Badge 
                            variant={data.severity === 'high' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {data.severity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Security Trends */}
              {metrics.trends && (
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-50">
                    <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    {t('securityTrends')}
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {metrics.trends.scoreChange >= 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />
                        )}
                        <span className={`text-xs font-medium ${
                          metrics.trends.scoreChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {metrics.trends.scoreChange >= 0 ? '+' : ''}{metrics.trends.scoreChange}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{t('scoreChange')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {metrics.trends.issuesResolved}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{t('issuesResolved')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                        {metrics.trends.newThreats}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{t('newThreats')}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Overall Security Summary */}
              <div className="border-t border-gray-200/60 dark:border-gray-700/60 pt-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-50">{metrics.blockedIPs}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{t('blockedIPs')}</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-50">{metrics.totalEvents}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{t('totalEvents')}</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-50">{metrics.suspiciousActivity}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{t('suspiciousActivity')}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
