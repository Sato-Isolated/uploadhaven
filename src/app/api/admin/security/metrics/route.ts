import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import connectDB from '@/lib/database/mongodb';
import { SecurityEvent, File, User } from '@/lib/database/models';

/**
 * GET /api/admin/security/metrics
 * Get comprehensive security metrics for admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin role
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    // Get current time and 24h ago
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get security events from last 24 hours
    const last24hEvents = await SecurityEvent.find({
      timestamp: { $gte: yesterday }
    });    // Count events by severity
    const criticalEvents = last24hEvents.filter(e => e.severity === 'high').length;
    const blockedRequests = last24hEvents.filter(e => e.type === 'rate_limit' || e.type === 'blocked_ip').length;
    const failedLogins = last24hEvents.filter(e => e.type === 'user_login' && e.severity === 'high').length;
    const suspiciousActivity = last24hEvents.filter(e => e.type === 'suspicious_activity').length;

    // Get total counts
    const totalEvents = await SecurityEvent.countDocuments();
    const rateLimitHits = await SecurityEvent.countDocuments({ type: 'rate_limit' });

    // Get unique blocked IPs (from events in last 7 days)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const blockedIpEvents = await SecurityEvent.find({
      type: { $in: ['blocked_ip', 'rate_limit', 'suspicious_activity'] },
      timestamp: { $gte: weekAgo }
    }, { ip: 1 });
    
    const uniqueBlockedIPs = new Set(blockedIpEvents.map(e => e.ip)).size;

    // Zero Knowledge compliance metrics
    const totalFiles = await File.countDocuments({ isDeleted: false });
    const encryptedFiles = await File.countDocuments({ 
      isDeleted: false, 
      isZeroKnowledge: true 
    });
    const expiredFiles = await File.countDocuments({
      isDeleted: false,
      expiresAt: { $lt: now }
    });

    // User security metrics
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ emailVerified: true });
    const activeUsers = await User.countDocuments({ 
      lastActivity: { $gte: yesterday }
    });    // Calculate encryption and verification rates
    const encryptionRate = totalFiles > 0 ? (encryptedFiles / totalFiles) * 100 : 100;
    const verificationRate = totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 100;

    // Get threat intelligence
    const threats = await SecurityEvent.aggregate([
      {
        $match: {
          timestamp: { $gte: yesterday },
          severity: { $in: ['medium', 'high'] }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          severity: { $first: '$severity' }
        }
      }
    ]);

    // Analyze security patterns
    const securityIssues = [];
    const recommendations = [];
    
    // Check encryption compliance
    if (encryptionRate < 95) {
      securityIssues.push({
        type: 'encryption',
        severity: encryptionRate < 80 ? 'high' : 'medium',
        message: `${Math.round(100 - encryptionRate)}% of files are not encrypted`,
        impact: 'Zero Knowledge compliance at risk'
      });
      recommendations.push({
        action: 'enforceEncryption',
        priority: 'high',
        description: 'Enable automatic encryption for all new uploads'
      });
    }

    // Check expired files
    if (expiredFiles > 0) {
      securityIssues.push({
        type: 'cleanup',
        severity: expiredFiles > 100 ? 'high' : 'medium',
        message: `${expiredFiles} expired files need cleanup`,
        impact: 'Storage and privacy compliance'
      });
      recommendations.push({
        action: 'cleanupFiles',
        priority: expiredFiles > 100 ? 'high' : 'medium',
        description: 'Run automated cleanup for expired files'
      });
    }

    // Check user verification
    if (verificationRate < 70) {
      securityIssues.push({
        type: 'verification',
        severity: verificationRate < 50 ? 'high' : 'medium',
        message: `${Math.round(100 - verificationRate)}% of users are unverified`,
        impact: 'Account security and spam prevention'
      });
      recommendations.push({
        action: 'improveVerification',
        priority: 'medium',
        description: 'Send verification reminders and improve onboarding'
      });
    }

    // Check for attacks
    if (criticalEvents > 0) {
      securityIssues.push({
        type: 'attacks',
        severity: 'high',
        message: `${criticalEvents} critical security events in last 24h`,
        impact: 'Active security threats detected'
      });
      recommendations.push({
        action: 'reviewThreats',
        priority: 'critical',
        description: 'Immediate review of security events required'
      });
    }

    // Check for failed logins
    if (failedLogins > 20) {
      securityIssues.push({
        type: 'bruteforce',
        severity: failedLogins > 50 ? 'high' : 'medium',
        message: `${failedLogins} failed login attempts detected`,
        impact: 'Possible brute force attacks'
      });
      recommendations.push({
        action: 'strengthenAuth',
        priority: 'high',
        description: 'Consider implementing additional auth protection'
      });
    }

    // Calculate security score based on weighted factors
    let securityScore = 100;
    
    // Core security factors (weighted heavily)
    securityScore = securityScore * (encryptionRate / 100) * 0.3; // 30% weight for encryption
    securityScore += (verificationRate / 100) * 20; // 20% weight for verification
    
    // Threat factors (deductions)
    if (criticalEvents > 0) securityScore -= Math.min(criticalEvents * 8, 40);
    if (suspiciousActivity > 3) securityScore -= Math.min(suspiciousActivity * 3, 20);
    if (failedLogins > 20) securityScore -= Math.min((failedLogins - 20) * 0.5, 15);
    if (expiredFiles > 0) securityScore -= Math.min(expiredFiles * 0.1, 10);
    
    // Bonus for good practices
    if (encryptionRate === 100) securityScore += 5;
    if (verificationRate >= 90) securityScore += 5;
    if (criticalEvents === 0 && suspiciousActivity === 0) securityScore += 10;

    securityScore = Math.max(0, Math.min(100, Math.round(securityScore)));

    // Determine status based on issues and score
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    const highSeverityIssues = securityIssues.filter(i => i.severity === 'high').length;
    
    if (securityScore < 60 || highSeverityIssues > 1 || criticalEvents > 5) {
      status = 'critical';
    } else if (securityScore < 80 || highSeverityIssues > 0 || criticalEvents > 0 || suspiciousActivity > 3) {
      status = 'warning';
    }    const securityMetrics = {
      status,
      score: securityScore,
      totalEvents,
      criticalEvents,
      blockedIPs: uniqueBlockedIPs,
      rateLimitHits,
      suspiciousActivity,
      issues: securityIssues,
      recommendations,
      threats: threats.reduce((acc, threat) => {
        acc[threat._id] = {
          count: threat.count,
          severity: threat.severity
        };
        return acc;
      }, {} as Record<string, { count: number; severity: string }>),
      trends: {
        scoreChange: 0, // Would be calculated from historical data
        issuesResolved: 0, // Would track resolved issues
        newThreats: threats.length
      },
      last24Hours: {
        events: last24hEvents.length,
        blockedRequests,
        failedLogins,
        criticalEvents,
        suspiciousActivity
      },
      zeroKnowledge: {
        totalFiles,
        encryptedFiles,
        encryptionRate: Math.round(encryptionRate),
        expiredFiles,
        complianceScore: Math.round(encryptionRate * 0.8 + (expiredFiles === 0 ? 20 : Math.max(0, 20 - expiredFiles * 0.2)))
      },
      users: {
        total: totalUsers,
        verified: verifiedUsers,
        verificationRate: Math.round(verificationRate),
        activeToday: activeUsers,
        riskScore: Math.round(Math.max(0, 100 - verificationRate - (failedLogins * 0.5)))
      }
    };

    return NextResponse.json({
      success: true,
      data: securityMetrics
    });

  } catch (error) {
    console.error('Security metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security metrics' },
      { status: 500 }
    );
  }
}
