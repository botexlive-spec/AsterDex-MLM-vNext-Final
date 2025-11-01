/**
 * KYC (Know Your Customer) Type Definitions
 * For identity verification and document management
 */

export type KYCStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

export type DocumentType =
  | 'passport'
  | 'drivers_license'
  | 'national_id'
  | 'proof_of_address'
  | 'selfie';

export interface KYCDocument {
  id: string;
  user_id: string;
  document_type: DocumentType;
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

export interface KYCSubmission {
  id: string;
  user_id: string;
  status: KYCStatus;
  document_type: string; // 'passport' | 'drivers_license' | 'national_id'
  document_number: string;
  full_name: string;
  date_of_birth: string;
  nationality: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;

  // Document URLs
  front_document_url?: string;
  back_document_url?: string;
  selfie_url?: string;
  proof_of_address_url?: string;

  // Review fields
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  notes?: string;

  submitted_at: string;
  created_at: string;
  updated_at: string;

  // Relations
  user?: {
    id: string;
    email: string;
    full_name: string;
  };
}

export interface KYCSubmissionRequest {
  document_type: 'passport' | 'drivers_license' | 'national_id';
  document_number: string;
  full_name: string;
  date_of_birth: string;
  nationality: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;

  // File uploads
  front_document: File;
  back_document?: File;
  selfie: File;
  proof_of_address: File;
}

export interface KYCSubmissionResponse {
  submission: KYCSubmission;
  message: string;
}

export interface KYCStatusResponse {
  status: KYCStatus;
  submission?: KYCSubmission;
  can_resubmit: boolean;
}

export interface DocumentUploadProgress {
  file_name: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}
