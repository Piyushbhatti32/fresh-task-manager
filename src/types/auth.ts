import { UserCredential as FirebaseUserCredential, User as FirebaseUser } from 'firebase/auth';

export interface AdditionalUserInfo {
  isNewUser: boolean;
  profile: {
    email: string;
    email_verified: boolean;
    name: string;
    picture: string;
    given_name: string;
    family_name: string;
    locale: string;
  };
  providerId: string;
}

export interface UserCredential extends FirebaseUserCredential {
  additionalUserInfo?: AdditionalUserInfo;
}

export type User = FirebaseUser; 