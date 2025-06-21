'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

export function DebugNotifications() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testNotificationAPI = async () => {
    setIsLoading(true);
    setDebugInfo(null);

    try {
      // Test 1: Create a test notification
      console.log('1. Testing notification creation...');
      const createResponse = await fetch('/api/notifications/test', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const createResult = await createResponse.json();
      console.log('Create response:', createResult);

      // Test 2: Fetch notifications
      console.log('2. Testing notification fetch...');
      const fetchResponse = await fetch('/api/notifications?limit=10&includeRead=false');
      const fetchResult = await fetchResponse.json();
      console.log('Fetch response:', fetchResult);

      // Test 3: Fetch stats
      console.log('3. Testing stats fetch...');
      const statsResponse = await fetch('/api/notifications/stats');
      const statsResult = await statsResponse.json();
      console.log('Stats response:', statsResult);

      // Test 4: Session check
      console.log('4. Testing session...');
      const sessionResponse = await fetch('/api/auth/get-session');
      const sessionResult = await sessionResponse.json();
      console.log('Session response:', sessionResult);

      setDebugInfo({
        createTest: { status: createResponse.status, data: createResult },
        fetchTest: { status: fetchResponse.status, data: fetchResult },
        statsTest: { status: statsResponse.status, data: statsResult },
        sessionTest: { status: sessionResponse.status, data: sessionResult },
      });    } catch (error) {
      console.error('Debug error:', error);
      setDebugInfo({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
      <h3 className="text-lg font-semibold mb-4">🔧 Debug Notifications</h3>
      
      <Button 
        onClick={testNotificationAPI} 
        disabled={isLoading}
        className="mb-4"
      >
        {isLoading ? 'Testing...' : 'Test Notification System'}
      </Button>

      {debugInfo && (
        <div className="space-y-4">
          <div className="text-sm">
            <h4 className="font-semibold">🧪 Test Results:</h4>
            <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
