import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Button, Card, Badge } from '../../components/ui/DesignSystem';
import { Modal } from '../../components/ui/Modal';
import { DatePicker } from '../../components/ui/DatePicker';
import {
  submitKYC,
  getKYCStatus,
  type KYCSubmission,
  type KYCStatus as KYCStatusType,
} from '../../services/kyc.service';

// KYC Status Type (extended for UI states)
type KYCStatus = 'not_started' | 'in_progress' | 'pending' | 'approved' | 'rejected';

// Validation Schemas
const step1Schema = z.object({
  documentType: z.enum(['passport', 'drivers_license', 'national_id'], {
    required_error: 'Please select document type',
  }),
  documentNumber: z.string().min(5, 'Document number is required'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((date) => {
      if (!date) return false;
      const selectedDate = new Date(date);
      const today = new Date();
      // Check if date is not in the future
      if (selectedDate > today) return false;
      // Check if user is at least 18 years old
      const age = today.getFullYear() - selectedDate.getFullYear();
      const monthDiff = today.getMonth() - selectedDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < selectedDate.getDate())) {
        return age - 1 >= 18;
      }
      return age >= 18;
    }, 'You must be at least 18 years old'),
  nationality: z.string().min(2, 'Nationality is required'),
  address: z.string().min(10, 'Please provide a complete address'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State/Province is required'),
  postalCode: z.string().min(3, 'Postal code is required'),
  country: z.string().min(2, 'Country is required'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  otpCode: z.string().length(6, 'OTP must be 6 digits').optional(),
});

const step2Schema = z.object({
  idProofFront: z.any().refine((file) => file !== null, 'ID proof front is required'),
  idProofBack: z.any().optional(),
  addressProof: z.any().refine((file) => file !== null, 'Address proof is required'),
  selfieWithId: z.any().refine((file) => file !== null, 'Selfie with ID is required'),
});

type Step1FormData = z.infer<typeof step1Schema>;
type Step2FormData = z.infer<typeof step2Schema>;

// File Upload Component
interface FileUploadProps {
  label: string;
  description: string;
  accept: string;
  maxSize?: number;
  onFileSelect: (file: File | null) => void;
  preview?: string | null;
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  description,
  accept,
  maxSize = 5,
  onFileSelect,
  preview,
  error,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    onFileSelect(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    onFileSelect(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="mb-6">
      <label className="block text-[#cbd5e1] font-semibold mb-2">{label}</label>
      <p className="text-[#94a3b8] text-sm mb-3">{description}</p>

      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all ${
          dragActive
            ? 'border-[#00C7D1] bg-[#00C7D1]/10'
            : error
            ? 'border-[#ef4444] bg-[#ef4444]/5'
            : 'border-[#475569] hover:border-[#64748b]'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />

        {preview ? (
          <div className="space-y-4">
            {preview.endsWith('.pdf') ? (
              <div className="flex items-center justify-center gap-3 text-[#00C7D1]">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h10l6 6v14H2v-1z" />
                </svg>
                <span className="text-[#cbd5e1] font-medium">PDF Document</span>
              </div>
            ) : (
              <img
                src={preview}
                alt="Preview"
                className="max-h-40 mx-auto rounded-lg border border-[#475569]"
              />
            )}

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-[#475569] rounded-full h-2">
                <div
                  className="bg-[#00C7D1] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            <div className="flex justify-center gap-3">
              <Button variant="secondary" size="sm" onClick={handleButtonClick}>
                Change File
              </Button>
              <Button variant="danger" size="sm" onClick={handleRemove}>
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <svg
              className="mx-auto h-12 w-12 text-[#94a3b8] mb-4"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-[#cbd5e1] mb-2">
              <button
                type="button"
                onClick={handleButtonClick}
                className="text-[#00C7D1] font-semibold hover:underline"
              >
                Click to upload
              </button>{' '}
              or drag and drop
            </p>
            <p className="text-[#94a3b8] text-sm">
              {accept.includes('image') ? 'JPG, PNG' : 'PDF'} (Max {maxSize}MB)
            </p>
          </div>
        )}
      </div>

      {error && <p className="text-[#ef4444] text-sm mt-2">{error}</p>}
    </div>
  );
};

// Progress Stepper Component
interface StepperProps {
  currentStep: number;
  steps: { number: number; label: string }[];
}

const Stepper: React.FC<StepperProps> = ({ currentStep, steps }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                  currentStep >= step.number
                    ? 'bg-gradient-to-r from-[#00C7D1] to-[#00e5f0] text-white shadow-lg scale-110'
                    : 'bg-[#475569] text-[#94a3b8]'
                }`}
              >
                {currentStep > step.number ? '✓' : step.number}
              </div>
              <p
                className={`mt-2 text-sm font-medium ${
                  currentStep >= step.number ? 'text-[#00C7D1]' : 'text-[#94a3b8]'
                }`}
              >
                {step.label}
              </p>
            </div>

            {index < steps.length - 1 && (
              <div className="flex-1 h-1 mx-4 mb-6">
                <div
                  className={`h-full rounded transition-all ${
                    currentStep > step.number ? 'bg-[#00C7D1]' : 'bg-[#475569]'
                  }`}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export const KYCNew: React.FC = () => {
  const navigate = useNavigate();
  const [kycStatus, setKycStatus] = useState<KYCStatus>('not_started');
  const [kycSubmission, setKycSubmission] = useState<KYCSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [selectedDateOfBirth, setSelectedDateOfBirth] = useState<Date | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [viewingImage, setViewingImage] = useState<{ url: string; label: string } | null>(null);
  const [imageZoom, setImageZoom] = useState(1);

  // Load KYC status on mount
  useEffect(() => {
    loadKYCStatus();
  }, []);

  const loadKYCStatus = async () => {
    setIsLoading(true);
    try {
      const statusData = await getKYCStatus();

      // Map service status to UI status
      let uiStatus: KYCStatus = 'not_started';
      if (statusData.status === 'not_submitted') {
        uiStatus = 'not_started';
      } else if (statusData.status === 'pending') {
        uiStatus = 'pending';
      } else if (statusData.status === 'approved') {
        uiStatus = 'approved';
      } else if (statusData.status === 'rejected') {
        uiStatus = 'rejected';
      }

      setKycStatus(uiStatus);
      setKycSubmission(statusData.submission || null);
    } catch (error: any) {
      console.error('Error loading KYC status:', error);
      toast.error('Failed to load KYC status');
    } finally {
      setIsLoading(false);
    }
  };

  // Form data storage
  const [step1Data, setStep1Data] = useState<Partial<Step1FormData>>({});
  const [uploadedFiles, setUploadedFiles] = useState<{
    idProofFront: { file: File | null; preview: string | null };
    idProofBack: { file: File | null; preview: string | null };
    addressProof: { file: File | null; preview: string | null };
    selfieWithId: { file: File | null; preview: string | null };
  }>({
    idProofFront: { file: null, preview: null },
    idProofBack: { file: null, preview: null },
    addressProof: { file: null, preview: null },
    selfieWithId: { file: null, preview: null },
  });

  // Step 1 form
  const {
    register: registerStep1,
    handleSubmit: handleSubmitStep1,
    formState: { errors: errorsStep1 },
    watch: watchStep1,
  } = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: step1Data,
  });

  const phoneNumber = watchStep1('phoneNumber');

  const handleSendOtp = () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: 'Sending OTP...',
        success: 'OTP sent successfully! Check your phone.',
        error: 'Failed to send OTP',
      }
    );

    setOtpSent(true);
    setShowOtpModal(true);
  };

  const handleVerifyOtp = (otp: string) => {
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: 'Verifying OTP...',
        success: 'Phone number verified successfully!',
        error: 'Invalid OTP',
      }
    );

    setPhoneVerified(true);
    setShowOtpModal(false);
  };

  const onStep1Submit = (data: Step1FormData) => {
    if (!phoneVerified) {
      toast.error('Please verify your phone number first');
      return;
    }

    setStep1Data(data);
    setCurrentStep(2);
    setKycStatus('in_progress');
    toast.success('Personal information saved!');
  };

  const handleFileUpload = (
    field: keyof typeof uploadedFiles,
    file: File | null
  ) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedFiles((prev) => ({
          ...prev,
          [field]: { file, preview: reader.result as string },
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setUploadedFiles((prev) => ({
        ...prev,
        [field]: { file: null, preview: null },
      }));
    }
  };

  const handleStep2Continue = () => {
    // Validate that all files are uploaded
    if (
      !uploadedFiles.idProofFront.file ||
      !uploadedFiles.idProofBack.file ||
      !uploadedFiles.addressProof.file ||
      !uploadedFiles.selfieWithId.file
    ) {
      toast.error('Please upload all required documents');
      return;
    }

    setCurrentStep(3);
    toast.success('Documents uploaded successfully!');
  };

  const handleFinalSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const promise = submitKYC({
        document_type: step1Data.documentType as 'passport' | 'drivers_license' | 'national_id',
        document_number: step1Data.documentNumber!,
        full_name: step1Data.fullName!,
        date_of_birth: step1Data.dateOfBirth!,
        nationality: step1Data.nationality!,
        address: step1Data.address!,
        city: step1Data.city!,
        state: step1Data.state!,
        postal_code: step1Data.postalCode!,
        country: step1Data.country!,
        phone: step1Data.phoneNumber!,
        front_document: uploadedFiles.idProofFront.file!,
        back_document: uploadedFiles.idProofBack.file || undefined,
        selfie: uploadedFiles.selfieWithId.file!,
        proof_of_address: uploadedFiles.addressProof.file!,
      });

      toast.promise(promise, {
        loading: 'Uploading documents and submitting KYC...',
        success: 'KYC submitted successfully! Your documents are under review.',
        error: (err) => err.message || 'Submission failed. Please try again.',
      });

      const result = await promise;

      setKycStatus('pending');
      setKycSubmission(result.submission);
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Error submitting KYC:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, label: 'Personal Info' },
    { number: 2, label: 'Documents' },
    { number: 3, label: 'Review & Submit' },
  ];

  // KYC Status Display
  if (kycStatus === 'approved') {
    return (
      <div className="min-h-screen bg-[#1e293b] p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="text-center py-12">
            <div className="text-8xl mb-6">✅</div>
            <h2 className="text-4xl font-bold text-[#10b981] mb-4">KYC Approved!</h2>
            <p className="text-[#cbd5e1] text-lg mb-8">
              Your KYC verification has been approved. You now have full access to all features.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="primary" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
              <Button variant="secondary" onClick={() => navigate('/wallet')}>
                Start Trading
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (kycStatus === 'pending') {
    return (
      <div className="min-h-screen bg-[#1e293b] p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <div className="text-center py-12">
              <div className="text-8xl mb-6">⏳</div>
              <h2 className="text-4xl font-bold text-[#f59e0b] mb-4">Under Review</h2>
              <p className="text-[#cbd5e1] text-lg mb-4">
                Your KYC application is currently being reviewed by our team.
              </p>
              <div className="bg-[#1e293b] p-6 rounded-lg inline-block mb-8">
                <p className="text-[#94a3b8] mb-2">Estimated Review Time</p>
                <p className="text-3xl font-bold text-[#00C7D1]">24-48 Hours</p>
              </div>
              <p className="text-[#94a3b8] mb-8">
                Submitted on:{' '}
                {kycSubmission?.submitted_at
                  ? format(new Date(kycSubmission.submitted_at), 'MMM dd, yyyy HH:mm')
                  : format(new Date(), 'MMM dd, yyyy HH:mm')}
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                  Back to Dashboard
                </Button>
                <Button
                  variant="primary"
                  onClick={() => toast.info('Support will contact you via email')}
                >
                  Contact Support
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (kycStatus === 'rejected') {
    return (
      <div className="min-h-screen bg-[#1e293b] p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <div className="text-center py-12">
              <div className="text-8xl mb-6">❌</div>
              <h2 className="text-4xl font-bold text-[#ef4444] mb-4">KYC Rejected</h2>
              <p className="text-[#cbd5e1] text-lg mb-8">
                Unfortunately, your KYC application was rejected.
              </p>

              <div className="bg-[#fef2f2] border border-[#ef4444] rounded-lg p-6 mb-8 text-left max-w-2xl mx-auto">
                <h3 className="text-[#991b1b] font-bold mb-3">Rejection Reason:</h3>
                <p className="text-[#7f1d1d]">
                  {kycSubmission?.rejection_reason ||
                    'The submitted documents were unclear or did not match the requirements. Please ensure all documents are clear, readable, and match your personal information.'}
                </p>
                {kycSubmission?.notes && (
                  <div className="mt-4">
                    <h4 className="text-[#991b1b] font-semibold mb-2">Additional Notes:</h4>
                    <p className="text-[#7f1d1d] text-sm">{kycSubmission.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-center gap-4">
                <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                  Back to Dashboard
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    setKycStatus('not_started');
                    setCurrentStep(1);
                    setKycSubmission(null);
                    toast.info('Please re-submit your KYC with correct documents');
                  }}
                >
                  Re-submit KYC
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1e293b] p-6 flex items-center justify-center">
        <Card className="text-center py-12 px-8">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-[#cbd5e1] text-lg">Loading KYC status...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1e293b] p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#f8fafc] mb-2">KYC Verification</h1>
          <p className="text-[#cbd5e1] text-lg">
            Complete your Know Your Customer (KYC) verification to unlock all features
          </p>
        </div>

        {/* Progress Stepper */}
        <Card className="mb-8">
          <div className="p-8">
            <Stepper currentStep={currentStep} steps={steps} />
          </div>
        </Card>

        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <Card>
            <div className="p-8">
              <h2 className="text-2xl font-bold text-[#f8fafc] mb-6">Personal Information</h2>

              <form onSubmit={handleSubmitStep1(onStep1Submit)} className="space-y-6">
                {/* Document Type and Number */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[#cbd5e1] font-semibold mb-2">
                      Document Type <span className="text-[#ef4444]">*</span>
                    </label>
                    <select
                      {...registerStep1('documentType')}
                      className="w-full px-4 py-3 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc] focus:border-[#00C7D1] focus:outline-none"
                    >
                      <option value="">Select document type</option>
                      <option value="passport">Passport</option>
                      <option value="drivers_license">Driver's License</option>
                      <option value="national_id">National ID Card</option>
                    </select>
                    {errorsStep1.documentType && (
                      <p className="text-[#ef4444] text-sm mt-1">{errorsStep1.documentType.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[#cbd5e1] font-semibold mb-2">
                      Document Number <span className="text-[#ef4444]">*</span>
                    </label>
                    <input
                      {...registerStep1('documentNumber')}
                      type="text"
                      placeholder="Enter document number"
                      className="w-full px-4 py-3 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc] focus:border-[#00C7D1] focus:outline-none"
                    />
                    {errorsStep1.documentNumber && (
                      <p className="text-[#ef4444] text-sm mt-1">{errorsStep1.documentNumber.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[#cbd5e1] font-semibold mb-2">
                      Full Name <span className="text-[#ef4444]">*</span>
                    </label>
                    <input
                      {...registerStep1('fullName')}
                      type="text"
                      placeholder="Enter your full legal name"
                      className="w-full px-4 py-3 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc] focus:border-[#00C7D1] focus:outline-none"
                    />
                    {errorsStep1.fullName && (
                      <p className="text-[#ef4444] text-sm mt-1">{errorsStep1.fullName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[#cbd5e1] font-semibold mb-2">
                      Date of Birth <span className="text-[#ef4444]">*</span>
                    </label>
                    <DatePicker
                      selected={selectedDateOfBirth}
                      onChange={(date) => {
                        setSelectedDateOfBirth(date);
                      }}
                      placeholder="Select your date of birth"
                      maxDate={new Date()}
                      dateFormat="MMMM d, yyyy"
                      showYearDropdown
                      showMonthDropdown
                      dropdownMode="select"
                      error={!!errorsStep1.dateOfBirth}
                    />
                    <input
                      {...registerStep1('dateOfBirth')}
                      type="hidden"
                      value={selectedDateOfBirth ? selectedDateOfBirth.toISOString().split('T')[0] : ''}
                      onChange={() => {}}
                    />
                    {errorsStep1.dateOfBirth && (
                      <p className="text-[#ef4444] text-sm mt-1">{errorsStep1.dateOfBirth.message}</p>
                    )}
                    {!errorsStep1.dateOfBirth && (
                      <p className="text-[#94a3b8] text-xs mt-1">You must be at least 18 years old</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[#cbd5e1] font-semibold mb-2">
                      Nationality <span className="text-[#ef4444]">*</span>
                    </label>
                    <input
                      {...registerStep1('nationality')}
                      type="text"
                      placeholder="e.g., United States"
                      className="w-full px-4 py-3 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc] focus:border-[#00C7D1] focus:outline-none"
                    />
                    {errorsStep1.nationality && (
                      <p className="text-[#ef4444] text-sm mt-1">{errorsStep1.nationality.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[#cbd5e1] font-semibold mb-2">
                      Country <span className="text-[#ef4444]">*</span>
                    </label>
                    <input
                      {...registerStep1('country')}
                      type="text"
                      placeholder="e.g., United States"
                      className="w-full px-4 py-3 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc] focus:border-[#00C7D1] focus:outline-none"
                    />
                    {errorsStep1.country && (
                      <p className="text-[#ef4444] text-sm mt-1">{errorsStep1.country.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[#cbd5e1] font-semibold mb-2">
                    Address <span className="text-[#ef4444]">*</span>
                  </label>
                  <textarea
                    {...registerStep1('address')}
                    placeholder="Enter your complete residential address"
                    rows={3}
                    className="w-full px-4 py-3 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc] focus:border-[#00C7D1] focus:outline-none resize-none"
                  />
                  {errorsStep1.address && (
                    <p className="text-[#ef4444] text-sm mt-1">{errorsStep1.address.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[#cbd5e1] font-semibold mb-2">
                      City <span className="text-[#ef4444]">*</span>
                    </label>
                    <input
                      {...registerStep1('city')}
                      type="text"
                      placeholder="City"
                      className="w-full px-4 py-3 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc] focus:border-[#00C7D1] focus:outline-none"
                    />
                    {errorsStep1.city && (
                      <p className="text-[#ef4444] text-sm mt-1">{errorsStep1.city.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[#cbd5e1] font-semibold mb-2">
                      State/Province <span className="text-[#ef4444]">*</span>
                    </label>
                    <input
                      {...registerStep1('state')}
                      type="text"
                      placeholder="State"
                      className="w-full px-4 py-3 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc] focus:border-[#00C7D1] focus:outline-none"
                    />
                    {errorsStep1.state && (
                      <p className="text-[#ef4444] text-sm mt-1">{errorsStep1.state.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[#cbd5e1] font-semibold mb-2">
                      Postal Code <span className="text-[#ef4444]">*</span>
                    </label>
                    <input
                      {...registerStep1('postalCode')}
                      type="text"
                      placeholder="Postal Code"
                      className="w-full px-4 py-3 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc] focus:border-[#00C7D1] focus:outline-none"
                    />
                    {errorsStep1.postalCode && (
                      <p className="text-[#ef4444] text-sm mt-1">{errorsStep1.postalCode.message}</p>
                    )}
                  </div>
                </div>

                {/* Phone Verification */}
                <div className="border border-[#475569] rounded-lg p-6 bg-[#1e293b]">
                  <h3 className="text-lg font-bold text-[#f8fafc] mb-4">
                    Phone Verification <span className="text-[#ef4444]">*</span>
                  </h3>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <input
                        {...registerStep1('phoneNumber')}
                        type="tel"
                        placeholder="+1 234 567 8900"
                        disabled={phoneVerified}
                        className="w-full px-4 py-3 bg-[#334155] border border-[#475569] rounded-lg text-[#f8fafc] focus:border-[#00C7D1] focus:outline-none disabled:opacity-50"
                      />
                      {errorsStep1.phoneNumber && (
                        <p className="text-[#ef4444] text-sm mt-1">{errorsStep1.phoneNumber.message}</p>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant={phoneVerified ? 'success' : 'primary'}
                      onClick={handleSendOtp}
                      disabled={phoneVerified || !phoneNumber}
                    >
                      {phoneVerified ? '✓ Verified' : otpSent ? 'Resend OTP' : 'Send OTP'}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" variant="primary" size="lg">
                    Continue to Documents →
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        )}

        {/* Step 2: Document Upload */}
        {currentStep === 2 && (
          <Card>
            <div className="p-8">
              <h2 className="text-2xl font-bold text-[#f8fafc] mb-2">Upload Documents</h2>
              <p className="text-[#94a3b8] mb-8">
                Please upload clear, readable copies of your documents. All documents must be valid and
                not expired.
              </p>

              <div className="space-y-6">
                <FileUpload
                  label="ID Proof - Front Side"
                  description="Upload the front side of your Passport, Driver's License, or National ID"
                  accept="image/*,.pdf"
                  maxSize={5}
                  onFileSelect={(file) => handleFileUpload('idProofFront', file)}
                  preview={uploadedFiles.idProofFront.preview}
                />

                <FileUpload
                  label="ID Proof - Back Side"
                  description="Upload the back side of your ID document"
                  accept="image/*,.pdf"
                  maxSize={5}
                  onFileSelect={(file) => handleFileUpload('idProofBack', file)}
                  preview={uploadedFiles.idProofBack.preview}
                />

                <FileUpload
                  label="Address Proof"
                  description="Upload a recent utility bill, bank statement, or government-issued document (within last 3 months)"
                  accept="image/*,.pdf"
                  maxSize={5}
                  onFileSelect={(file) => handleFileUpload('addressProof', file)}
                  preview={uploadedFiles.addressProof.preview}
                />

                <FileUpload
                  label="Selfie with ID"
                  description="Take a selfie holding your ID document next to your face. Ensure your face and the ID are clearly visible"
                  accept="image/*"
                  maxSize={5}
                  onFileSelect={(file) => handleFileUpload('selfieWithId', file)}
                  preview={uploadedFiles.selfieWithId.preview}
                />

                <div className="bg-[#fef3c7] border border-[#f59e0b] rounded-lg p-4">
                  <div className="flex gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <h4 className="text-[#92400e] font-semibold mb-2">Document Guidelines:</h4>
                      <ul className="text-[#92400e] text-sm space-y-1 list-disc list-inside">
                        <li>All documents must be clear and readable</li>
                        <li>No glare or shadows on documents</li>
                        <li>All four corners of documents must be visible</li>
                        <li>Personal information must match across all documents</li>
                        <li>Documents must not be expired</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="secondary" onClick={() => setCurrentStep(1)}>
                  ← Back
                </Button>
                <Button variant="primary" size="lg" onClick={handleStep2Continue}>
                  Continue to Review →
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Step 3: Review & Submit */}
        {currentStep === 3 && (
          <Card>
            <div className="p-8">
              <h2 className="text-2xl font-bold text-[#f8fafc] mb-2">Review & Submit</h2>
              <p className="text-[#94a3b8] mb-8">
                Please review your information carefully before submitting. You can edit any section if
                needed.
              </p>

              {/* Personal Information Review */}
              <div className="mb-8 border border-[#475569] rounded-lg p-6 bg-[#1e293b]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-[#f8fafc]">Personal Information</h3>
                  <Button variant="secondary" size="sm" onClick={() => setCurrentStep(1)}>
                    Edit
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {Object.entries(step1Data).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-[#94a3b8] capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </p>
                      <p className="text-[#f8fafc] font-medium">{String(value)}</p>
                    </div>
                  ))}
                  <div>
                    <p className="text-[#94a3b8]">Phone Verification:</p>
                    <p className="text-[#10b981] font-medium flex items-center gap-2">
                      ✓ Verified
                    </p>
                  </div>
                </div>
              </div>

              {/* Documents Review */}
              <div className="mb-8 border border-[#475569] rounded-lg p-6 bg-[#1e293b]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-[#f8fafc]">Uploaded Documents</h3>
                  <Button variant="secondary" size="sm" onClick={() => setCurrentStep(2)}>
                    Edit
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(uploadedFiles).map(([key, { preview }]) => (
                    <div key={key} className="text-center">
                      <div
                        className="w-full h-32 bg-[#334155] rounded-lg mb-2 overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#f59e0b] transition-all relative group"
                        onClick={() => {
                          if (preview) {
                            setViewingImage({
                              url: preview,
                              label: key.replace(/([A-Z])/g, ' $1').trim()
                            });
                            setImageZoom(1);
                          }
                        }}
                      >
                        {preview && (
                          <>
                            <img src={preview} alt={key} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                            </div>
                          </>
                        )}
                      </div>
                      <p className="text-[#cbd5e1] text-xs capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Declaration */}
              <div className="bg-[#fef2f2] border border-[#ef4444] rounded-lg p-6 mb-8">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    className="mt-1 w-5 h-5 text-[#ef4444] bg-white border-[#ef4444] rounded focus:ring-[#ef4444]"
                  />
                  <span className="text-[#991b1b] text-sm">
                    I declare that all information provided is true and accurate to the best of my
                    knowledge. I understand that providing false information may result in account
                    suspension or legal action.
                  </span>
                </label>
              </div>

              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setCurrentStep(2)}>
                  ← Back
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-gradient-to-r from-[#10b981] to-[#059669]"
                  onClick={handleFinalSubmit}
                >
                  Submit KYC Application
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Important Notice */}
        <Card className="mt-8 bg-[#eff6ff] border-[#3b82f6]">
          <div className="p-6">
            <div className="flex gap-4">
              <span className="text-3xl">ℹ️</span>
              <div>
                <h3 className="text-[#1e3a8a] font-bold mb-2">Important Information</h3>
                <ul className="text-[#1e40af] text-sm space-y-1 list-disc list-inside">
                  <li>KYC verification is required for withdrawals above $50</li>
                  <li>Review process typically takes 24-48 hours</li>
                  <li>You'll receive email notification once your KYC is reviewed</li>
                  <li>Keep your documents ready in JPG, PNG, or PDF format</li>
                  <li>Each file should not exceed 5MB in size</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* OTP Modal */}
      <Modal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        title="Verify Phone Number"
        maxWidth="md"
      >
        <div className="text-center py-6">
          <div className="text-6xl mb-4">📱</div>
          <p className="text-[#cbd5e1] mb-6">
            Enter the 6-digit OTP sent to <strong>{phoneNumber}</strong>
          </p>

          <input
            type="text"
            maxLength={6}
            placeholder="000000"
            className="w-full max-w-xs px-6 py-4 text-center text-2xl font-mono bg-[#1e293b] border-2 border-[#475569] rounded-lg text-[#f8fafc] focus:border-[#00C7D1] focus:outline-none mx-auto mb-6"
            onChange={(e) => {
              if (e.target.value.length === 6) {
                handleVerifyOtp(e.target.value);
              }
            }}
          />

          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={() => setShowOtpModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSendOtp}>
              Resend OTP
            </Button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate('/dashboard');
        }}
        title="KYC Submitted Successfully!"
        maxWidth="md"
      >
        <div className="text-center py-8">
          <div className="text-8xl mb-4">🎉</div>
          <h3 className="text-3xl font-bold text-[#10b981] mb-4">Submission Complete!</h3>
          <p className="text-[#cbd5e1] mb-8">
            Your KYC application has been submitted successfully and is now under review.
          </p>

          <div className="bg-[#1e293b] p-6 rounded-lg mb-8">
            <p className="text-[#94a3b8] mb-2">Estimated Review Time</p>
            <p className="text-3xl font-bold text-[#00C7D1]">24-48 Hours</p>
          </div>

          <p className="text-[#94a3b8] text-sm mb-8">
            We'll notify you via email once your KYC has been reviewed.
          </p>

          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              setShowSuccessModal(false);
              navigate('/dashboard');
            }}
          >
            Back to Dashboard
          </Button>
        </div>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal
        isOpen={viewingImage !== null}
        onClose={() => {
          setViewingImage(null);
          setImageZoom(1);
        }}
        title={viewingImage?.label || 'Document Preview'}
        maxWidth="xl"
      >
        <div className="space-y-4">
          {/* Zoom Controls */}
          <div className="flex items-center justify-center gap-4 pb-4 border-b border-[#475569]">
            <button
              onClick={() => setImageZoom(Math.max(0.5, imageZoom - 0.25))}
              disabled={imageZoom <= 0.5}
              className="px-4 py-2 bg-[#475569] hover:bg-[#64748b] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              aria-label="Zoom out"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
            </button>

            <span className="text-[#f8fafc] font-semibold min-w-[80px] text-center">
              {Math.round(imageZoom * 100)}%
            </span>

            <button
              onClick={() => setImageZoom(Math.min(3, imageZoom + 0.25))}
              disabled={imageZoom >= 3}
              className="px-4 py-2 bg-[#475569] hover:bg-[#64748b] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              aria-label="Zoom in"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </button>

            <button
              onClick={() => setImageZoom(1)}
              className="px-4 py-2 bg-[#f59e0b] hover:bg-[#d97706] text-white rounded-lg transition-colors"
            >
              Reset
            </button>
          </div>

          {/* Image Container */}
          <div className="overflow-auto max-h-[60vh] bg-[#1e293b] rounded-lg p-4">
            <div className="flex items-center justify-center min-h-[400px]">
              {viewingImage && (
                <img
                  src={viewingImage.url}
                  alt={viewingImage.label}
                  style={{
                    transform: `scale(${imageZoom})`,
                    transition: 'transform 0.2s ease-in-out',
                    maxWidth: '100%',
                    height: 'auto',
                  }}
                  className="rounded-lg"
                />
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-[#1e293b] rounded-lg p-4">
            <p className="text-[#94a3b8] text-sm text-center">
              Use the zoom controls above to inspect the document details. Click outside or press ESC to close.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default KYCNew;
