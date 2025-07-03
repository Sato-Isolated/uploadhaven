/**
 * Système d'événements pour le découplage et l'observabilité
 */

export interface DomainEvent {
  readonly id: string;
  readonly type: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly version: number;
  readonly data: Record<string, any>;
}

/**
 * Interface pour les gestionnaires d'événements
 */
export interface EventHandler<T extends DomainEvent = DomainEvent> {
  handle(event: T): Promise<void> | void;
  canHandle(event: DomainEvent): boolean;
}

/**
 * Bus d'événements pour la publication et l'abonnement
 */
export class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  private globalHandlers: EventHandler[] = [];

  /**
   * Abonne un handler à un type d'événement spécifique
   */
  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler as EventHandler);
  }

  /**
   * Abonne un handler à tous les événements
   */
  subscribeToAll(handler: EventHandler): void {
    this.globalHandlers.push(handler);
  }

  /**
   * Publie un événement
   */
  async publish(event: DomainEvent): Promise<void> {
    const specificHandlers = this.handlers.get(event.type) || [];
    const allHandlers = [...specificHandlers, ...this.globalHandlers];

    const promises = allHandlers
      .filter(handler => handler.canHandle(event))
      .map(handler => this.safeHandle(handler, event));

    await Promise.allSettled(promises);
  }

  /**
   * Publie plusieurs événements
   */
  async publishAll(events: DomainEvent[]): Promise<void> {
    await Promise.all(events.map(event => this.publish(event)));
  }

  private async safeHandle(handler: EventHandler, event: DomainEvent): Promise<void> {
    try {
      await handler.handle(event);
    } catch (error) {
      console.error(`Error handling event ${event.type} with handler ${handler.constructor.name}:`, error);
      // En production, on pourrait logger vers un service de monitoring
    }
  }
}

/**
 * Factory pour créer des événements
 */
export class EventFactory {
  private static eventCounter = 0;

  static createEvent<T extends Record<string, any>>(
    type: string,
    aggregateId: string,
    aggregateType: string,
    data: T,
    version: number = 1
  ): DomainEvent {
    return {
      id: `event_${++this.eventCounter}_${Date.now()}`,
      type,
      occurredAt: new Date(),
      aggregateId,
      aggregateType,
      version,
      data
    };
  }
}

/**
 * Événements spécifiques au domaine des fichiers
 */
export class FileEvents {
  static readonly FILE_UPLOADED = 'file.uploaded';
  static readonly FILE_DOWNLOADED = 'file.downloaded';
  static readonly FILE_DELETED = 'file.deleted';
  static readonly FILE_EXPIRED = 'file.expired';
  static readonly FILE_DOWNLOAD_LIMIT_REACHED = 'file.download_limit_reached';

  static fileUploaded(fileId: string, data: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    encrypted: boolean;
    expiresAt: Date;
  }): DomainEvent {
    return EventFactory.createEvent(
      this.FILE_UPLOADED,
      fileId,
      'file',
      data
    );
  }

  static fileDownloaded(fileId: string, data: {
    fileName: string;
    downloadCount: number;
    userAgent?: string;
    ipAddress?: string;
  }): DomainEvent {
    return EventFactory.createEvent(
      this.FILE_DOWNLOADED,
      fileId,
      'file',
      data
    );
  }

  static fileDeleted(fileId: string, data: {
    fileName: string;
    reason: 'manual' | 'expired' | 'cleanup';
  }): DomainEvent {
    return EventFactory.createEvent(
      this.FILE_DELETED,
      fileId,
      'file',
      data
    );
  }
}

/**
 * Événements spécifiques au domaine des partages
 */
export class ShareEvents {
  static readonly SHARE_CREATED = 'share.created';
  static readonly SHARE_ACCESSED = 'share.accessed';
  static readonly SHARE_EXPIRED = 'share.expired';
  static readonly SHARE_ACCESS_LIMIT_REACHED = 'share.access_limit_reached';

  static shareCreated(shareId: string, data: {
    fileId: string;
    shareUrl: string;
    expiresAt: Date;
    passwordProtected: boolean;
  }): DomainEvent {
    return EventFactory.createEvent(
      this.SHARE_CREATED,
      shareId,
      'share',
      data
    );
  }

  static shareAccessed(shareId: string, data: {
    fileId: string;
    accessCount: number;
    userAgent?: string;
    ipAddress?: string;
  }): DomainEvent {
    return EventFactory.createEvent(
      this.SHARE_ACCESSED,
      shareId,
      'share',
      data
    );
  }
}

/**
 * Gestionnaire d'événements pour l'audit trail
 */
export class AuditEventHandler implements EventHandler {
  canHandle(event: DomainEvent): boolean {
    // Audite tous les événements
    return true;
  }

  handle(event: DomainEvent): void {
    // En production, ceci irait vers une base de données d'audit
    console.log(`[AUDIT] ${event.type} - ${event.aggregateType}:${event.aggregateId}`, {
      occurredAt: event.occurredAt,
      data: event.data
    });
  }
}

/**
 * Gestionnaire d'événements pour les métriques
 */
export class MetricsEventHandler implements EventHandler {
  private metrics: Map<string, number> = new Map();

  canHandle(event: DomainEvent): boolean {
    return [
      FileEvents.FILE_UPLOADED,
      FileEvents.FILE_DOWNLOADED,
      ShareEvents.SHARE_CREATED,
      ShareEvents.SHARE_ACCESSED
    ].includes(event.type);
  }

  handle(event: DomainEvent): void {
    const current = this.metrics.get(event.type) || 0;
    this.metrics.set(event.type, current + 1);
  }

  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  resetMetrics(): void {
    this.metrics.clear();
  }
}

/**
 * Instance globale du bus d'événements
 */
export const eventBus = new EventBus();

// Configuration des handlers par défaut
eventBus.subscribeToAll(new AuditEventHandler());
eventBus.subscribeToAll(new MetricsEventHandler());
