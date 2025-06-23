// Base entity and value object types for UploadHaven domains
// Following DDD patterns with privacy-first principles

export abstract class Entity<T> {
  protected readonly _id: T;

  protected constructor(id: T) {
    this._id = id;
  }

  get id(): T {
    return this._id;
  }

  equals(entity: Entity<T>): boolean {
    if (!(entity instanceof Entity)) return false;
    return this._id === entity._id;
  }
}

export abstract class ValueObject {
  abstract equals(obj: ValueObject): boolean;
}

// Common value objects
export class Id extends ValueObject {
  constructor(private readonly _value: string) {
    super();
    if (!_value || _value.trim().length === 0) {
      throw new Error('Id cannot be empty');
    }
  }

  get value(): string {
    return this._value;
  }

  equals(obj: ValueObject): boolean {
    return obj instanceof Id && obj._value === this._value;
  }

  static generate(): Id {
    return new Id(crypto.randomUUID());
  }
}

export class Timestamp extends ValueObject {
  constructor(private readonly _value: Date) {
    super();
  }

  get value(): Date {
    return this._value;
  }

  equals(obj: ValueObject): boolean {
    return obj instanceof Timestamp && obj._value.getTime() === this._value.getTime();
  }

  static now(): Timestamp {
    return new Timestamp(new Date());
  }
}

// Domain event base
export interface DomainEvent {
  readonly occurredOn: Date;
  readonly eventType: string;
  readonly aggregateId: string;
}

// Repository pattern interface
export interface Repository<T extends Entity<any>> {
  save(entity: T): Promise<void>;
  findById(id: string): Promise<T | null>;
  delete(id: string): Promise<void>;
}

// Use case interface
export interface UseCase<TRequest, TResponse> {
  execute(request: TRequest): Promise<TResponse>;
}

// Privacy-first audit event
export interface AuditEvent {
  readonly type: string;
  readonly timestamp: Date;
  readonly success: boolean;
  // Note: NO user data, IP addresses, or sensitive information
}

// File size value object with privacy considerations
export class FileSize extends ValueObject {
  private static readonly MAX_ANONYMOUS_SIZE = 100 * 1024 * 1024; // 100MB
  private static readonly MAX_ACCOUNT_SIZE = 500 * 1024 * 1024; // 500MB

  constructor(private readonly _bytes: number) {
    super();
    if (_bytes < 0) {
      throw new Error('File size cannot be negative');
    }
  }

  get bytes(): number {
    return this._bytes;
  }

  get megabytes(): number {
    return this._bytes / (1024 * 1024);
  }

  isValidForAnonymous(): boolean {
    return this._bytes <= FileSize.MAX_ANONYMOUS_SIZE;
  }

  isValidForAccount(): boolean {
    return this._bytes <= FileSize.MAX_ACCOUNT_SIZE;
  }

  equals(obj: ValueObject): boolean {
    return obj instanceof FileSize && obj._bytes === this._bytes;
  }
}

// TTL (Time To Live) value object
export class TTL extends ValueObject {
  private static readonly MIN_HOURS = 1;
  private static readonly MAX_ANONYMOUS_HOURS = 168; // 7 days
  private static readonly MAX_ACCOUNT_HOURS = 720; // 30 days

  constructor(private readonly _hours: number) {
    super();
    if (_hours < TTL.MIN_HOURS) {
      throw new Error(`TTL must be at least ${TTL.MIN_HOURS} hour`);
    }
  }

  get hours(): number {
    return this._hours;
  }

  get expirationDate(): Date {
    return new Date(Date.now() + this._hours * 60 * 60 * 1000);
  }

  isValidForAnonymous(): boolean {
    return this._hours <= TTL.MAX_ANONYMOUS_HOURS;
  }

  isValidForAccount(): boolean {
    return this._hours <= TTL.MAX_ACCOUNT_HOURS;
  }

  equals(obj: ValueObject): boolean {
    return obj instanceof TTL && obj._hours === this._hours;
  }

  static defaultAnonymous(): TTL {
    return new TTL(24); // 24 hours
  }

  static defaultAccount(): TTL {
    return new TTL(168); // 7 days
  }
}
