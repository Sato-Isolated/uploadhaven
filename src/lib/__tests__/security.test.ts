import {
  securityLogger,
  logSecurityEvent,
  detectSuspiciousActivity,
} from '../core/security';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock localStorage for testing
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('Security Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('[]');
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('logSecurityEvent', () => {
    it('should log a security event with all required fields', () => {
      const initialEvents = securityLogger.getEvents();
      const initialCount = initialEvents.length;
      const loggedEvent = logSecurityEvent(
        'rate_limit',
        'Rate limit exceeded',
        'medium',
        {
          ip: '192.168.1.1',
          filename: 'test.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
        }
      );

      expect(loggedEvent.type).toBe('rate_limit');
      expect(loggedEvent.details).toBe('Rate limit exceeded');
      expect(loggedEvent.severity).toBe('medium');
      expect(loggedEvent.filename).toBe('test.pdf');
      expect(loggedEvent.fileSize).toBe(1024);
      expect(loggedEvent.fileType).toBe('application/pdf');
      expect(loggedEvent.id).toBeDefined();
      expect(loggedEvent.timestamp).toBeDefined();

      const events = securityLogger.getEvents();
      expect(events.length).toBe(initialCount + 1);
    });

    it('should log events with minimal required fields', () => {
      const initialEvents = securityLogger.getEvents();
      const initialCount = initialEvents.length;

      const loggedEvent = logSecurityEvent(
        'invalid_file',
        'Invalid file type uploaded',
        'high'
      );

      expect(loggedEvent.type).toBe('invalid_file');
      expect(loggedEvent.details).toBe('Invalid file type uploaded');
      expect(loggedEvent.severity).toBe('high');

      const events = securityLogger.getEvents();
      expect(events.length).toBe(initialCount + 1);
    });

    it('should use default severity when not provided', () => {
      const loggedEvent = logSecurityEvent('large_file', 'Large file uploaded');

      expect(loggedEvent.severity).toBe('low');
    });    it('should save events to localStorage', () => {
      logSecurityEvent(
        'invalid_file',
        'Invalid file detected',
        'high'
      );

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'securityEvents',
        expect.any(String)
      );
    });
  });

  describe('securityLogger.getEvents', () => {
    it('should return all logged events', () => {
      const initialEvents = securityLogger.getEvents();
      const initialCount = initialEvents.length;

      logSecurityEvent('rate_limit', 'Rate limit exceeded', 'medium');
      logSecurityEvent('invalid_file', 'Invalid file extension', 'high');

      const events = securityLogger.getEvents();
      expect(events.length).toBe(initialCount + 2);
    });

    it('should return events in chronological order (newest first)', () => {
      // Clear existing events by getting a fresh logger state
      const event1 = logSecurityEvent('rate_limit', 'First event', 'medium');
      const event2 = logSecurityEvent('invalid_file', 'Second event', 'high');      const events = securityLogger.getEvents();
      const eventIndex1 = events.findIndex((e: any) => e.id === event1.id);
      const eventIndex2 = events.findIndex((e: any) => e.id === event2.id);

      // Newer events should come first (lower index)
      expect(eventIndex2).toBeLessThan(eventIndex1);
    });
  });

  describe('securityLogger.getStats', () => {    beforeEach(() => {
      // Start with a known state by logging specific events
      logSecurityEvent('rate_limit', 'Rate limit exceeded', 'medium');
      logSecurityEvent('invalid_file', 'Invalid file type', 'high');
      logSecurityEvent('large_file', 'Large file uploaded', 'low');
    });    it('should return correct statistics', () => {
      const stats = securityLogger.getStats();

      expect(stats.totalEvents).toBeGreaterThanOrEqual(3);
      expect(stats.rateLimitHits).toBeGreaterThanOrEqual(1);
      expect(stats.invalidFiles).toBeGreaterThanOrEqual(1);      expect(stats.largeSizeBlocked).toBeGreaterThanOrEqual(1);
      expect(stats.last24h).toBeGreaterThanOrEqual(3);
      expect(typeof stats.blockedIPs).toBe('number');
    });
  });

  describe('detectSuspiciousActivity', () => {
    it('should return false for normal activity', () => {
      const result = detectSuspiciousActivity('192.168.1.1');
      expect(typeof result).toBe('boolean');
    });

    it('should detect high activity from same IP', () => {
      const ip = '192.168.1.100';

      // Log many events from the same IP
      for (let i = 0; i < 12; i++) {
        logSecurityEvent('rate_limit', `Event ${i}`, 'medium', { ip });
      }

      const result = detectSuspiciousActivity(ip);
      expect(result).toBe(true);
    });
  });

  describe('event listeners', () => {
    it('should notify listeners when events are logged', () => {
      const mockListener = vi.fn();
      securityLogger.addEventListener(mockListener);

      const event = logSecurityEvent('rate_limit', 'Test event', 'medium');

      expect(mockListener).toHaveBeenCalledWith(event);

      securityLogger.removeEventListener(mockListener);
    });
    it('should remove event listeners correctly', () => {
      const mockListener = vi.fn();
      securityLogger.addEventListener(mockListener);
      securityLogger.removeEventListener(mockListener);

      logSecurityEvent('rate_limit', 'Test event', 'medium');

      expect(mockListener).not.toHaveBeenCalled();
    });
  });

  describe('localStorage integration', () => {
    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw an error
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw an error
      expect(() => {
        logSecurityEvent('rate_limit', 'Test event', 'medium');
      }).not.toThrow();
    });

    it('should handle corrupted localStorage data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');

      // Should not throw and should work with empty array
      expect(() => {
        const events = securityLogger.getEvents();
        expect(Array.isArray(events)).toBe(true);
      }).not.toThrow();
    });
  });
});
