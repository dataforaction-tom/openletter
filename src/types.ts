export interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export interface AuthToken {
  id: string;
  user_id: string | null;
  email: string;
  token: string;
  type: 'login' | 'signup';
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  expires_at: string;
  created_at: string;
}

export interface Letter {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  description: string | null;
  content_md: string;
  authors_json: string;
  settings_json: string;
  status: 'draft' | 'published' | 'closed';
  closing_date: string | null;
  signature_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface Signature {
  id: string;
  letter_id: string;
  name: string;
  email: string;
  organisation: string | null;
  role: string | null;
  location: string | null;
  comment: string | null;
  verified: number;
  verification_token: string | null;
  ip_hash: string | null;
  created_at: string;
  verified_at: string | null;
}

export interface LetterSettings {
  require_verification: boolean;
  show_signature_count: boolean;
  show_view_count: boolean;
  show_signatories: boolean;
  allow_comments: boolean;
  fields: {
    name: 'required' | 'optional' | 'hidden';
    email: 'required' | 'optional' | 'hidden';
    organisation: 'required' | 'optional' | 'hidden';
    role: 'required' | 'optional' | 'hidden';
    location: 'required' | 'optional' | 'hidden';
  };
}

export interface Author {
  name: string;
  org?: string;
}
