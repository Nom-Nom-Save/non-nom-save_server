export interface RegisterUserDto {
  fullName: string;
  email: string;
  password: string;
}

export interface RegisterUserResponse {
  userId: string;
}

export interface RegisterEstablishmentDto {
  establishmentName: string;
  email: string;
  password: string;
  address: string;
}

export interface RegisterEstablishmentResponse {
  establishmentId: string;
}

export enum LoginType {
  USER = 'user',
  ESTABLISHMENT = 'establishment',
}

export interface LoginDto {
  email: string;
  password: string;
  loginType: LoginType;
}

export enum UserType {
  USER = 'user',
  ESTABLISHMENT = 'establishment',
}

export interface GoogleLoginDto {
  idToken: string;
  loginType?: LoginType;
}
