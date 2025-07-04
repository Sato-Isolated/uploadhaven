import { BaseEntity, EntityUtils } from '@/domains/shared/base-entity';

export interface UserProps {
  email: string;
  name: string;
  role: 'user' | 'admin';
  emailVerified: boolean;
  image?: string;
}

export class UserEntity implements BaseEntity {
  readonly id: string;
  readonly createdAt: Date;
  readonly expiresAt: Date;
  private props: UserProps;
  private updatedAt: Date;

  constructor(props: UserProps, id?: string, createdAt?: Date, expiresAt?: Date) {
    this.id = id || EntityUtils.generateId();
    this.createdAt = createdAt || new Date();
    this.expiresAt = expiresAt || EntityUtils.calculateExpirationDate(24 * 365); // 1 year for users
    this.props = { ...props };
    this.updatedAt = new Date();
  }

  static create(props: UserProps, id?: string): UserEntity {
    return new UserEntity(props, id);
  }

  get email(): string {
    return this.props.email;
  }

  get name(): string {
    return this.props.name;
  }

  get role(): 'user' | 'admin' {
    return this.props.role;
  }

  get emailVerified(): boolean {
    return this.props.emailVerified;
  }

  get image(): string | undefined {
    return this.props.image;
  }

  get isAdmin(): boolean {
    return this.props.role === 'admin';
  }

  get lastUpdated(): Date {
    return this.updatedAt;
  }

  private touch(): void {
    this.updatedAt = new Date();
  }

  updateName(name: string): void {
    this.props.name = name;
    this.touch();
  }

  updateRole(role: 'user' | 'admin'): void {
    this.props.role = role;
    this.touch();
  }

  verifyEmail(): void {
    this.props.emailVerified = true;
    this.touch();
  }

  updateImage(image: string): void {
    this.props.image = image;
    this.touch();
  }

  toJSON() {
    return {
      id: this.id,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
      updatedAt: this.updatedAt,
      ...this.props,
    };
  }
}
