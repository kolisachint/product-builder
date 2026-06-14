import React, { useState, useCallback } from 'react';
import type {
  UserProfile,
  ApiError,
} from '@shared/shared_types';
import { submitKyc } from '../api/client';

interface Step2Props {
  profile: UserProfile;
  onComplete: (profile: UserProfile) => void;
  onBack: () => void;
}

const DOCUMENT_TYPES = [
  { value: 'passport', label: 'Passport' },
  { value: 'drivers_license', label: "Driver's License" },
  { value: 'national_id', label: 'National ID Card' },
] as const;

interface FormErrors {
  documentType?: string;
  documentUrl?: string;
}

function validateForm(
  documentType: string,
  documentUrl: string,
): FormErrors {
  const errors: FormErrors = {};

  if (!documentType) {
    errors.documentType = 'Please select a document type';
  }

  if (!documentUrl.trim()) {
    errors.documentUrl = 'Document URL is required';
  }

  return errors;
}

export const Step2KycSubmission: React.FC<Step2Props> = ({
  profile,
  onComplete,
  onBack,
}) => {
  const [documentType, setDocumentType] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<ApiError | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setApiError(null);

      const validationErrors = validateForm(documentType, documentUrl);
      setErrors(validationErrors);

      if (Object.keys(validationErrors).length > 0) {
        return;
      }

      setIsSubmitting(true);

      try {
        const result = await submitKyc(profile.id, {
          documentType,
          documentUrl: documentUrl.trim(),
        });

        onComplete(result);
      } catch (err) {
        const apiErr = err as ApiError;
        setApiError(apiErr);
      } finally {
        setIsSubmitting(false);
      }
    },
    [documentType, documentUrl, profile.id, onComplete],
  );

  const fieldStyle: React.CSSProperties = {
    marginBottom: '1rem',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '0.25rem',
    fontWeight: '500',
    fontSize: '0.875rem',
    color: '#374151',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    fontSize: '1rem',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const errorInputStyle: React.CSSProperties = {
    ...inputStyle,
    borderColor: '#ef4444',
  };

  const errorTextStyle: React.CSSProperties = {
    color: '#ef4444',
    fontSize: '0.75rem',
    marginTop: '0.25rem',
  };

  const buttonRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '1.5rem',
  };

  return (
    <div>
      <h2
        data-testid="step2-heading"
        style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}
      >
        Submit KYC Documents
      </h2>

      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
        Upload a mock document to verify your identity. This is a demo — no real
        files are uploaded.
      </p>

      {apiError && (
        <div
          data-testid="step2-api-error"
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.375rem',
            color: '#dc2626',
            marginBottom: '1rem',
          }}
        >
          {apiError.error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={fieldStyle}>
          <label htmlFor="documentType" style={labelStyle}>
            Document Type *
          </label>
          <select
            id="documentType"
            data-testid="select-documentType"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            style={errors.documentType ? errorInputStyle : inputStyle}
            disabled={isSubmitting}
          >
            <option value="">Select a document type...</option>
            {DOCUMENT_TYPES.map((dt) => (
              <option key={dt.value} value={dt.value}>
                {dt.label}
              </option>
            ))}
          </select>
          {errors.documentType && (
            <div data-testid="error-documentType" style={errorTextStyle}>
              {errors.documentType}
            </div>
          )}
        </div>

        <div style={fieldStyle}>
          <label htmlFor="documentUrl" style={labelStyle}>
            Document URL *
          </label>
          <input
            id="documentUrl"
            data-testid="input-documentUrl"
            type="url"
            placeholder="https://example.com/document.pdf"
            value={documentUrl}
            onChange={(e) => setDocumentUrl(e.target.value)}
            style={errors.documentUrl ? errorInputStyle : inputStyle}
            disabled={isSubmitting}
          />
          {errors.documentUrl && (
            <div data-testid="error-documentUrl" style={errorTextStyle}>
              {errors.documentUrl}
            </div>
          )}
        </div>

        <div style={buttonRowStyle}>
          <button
            type="button"
            data-testid="step2-back"
            onClick={onBack}
            disabled={isSubmitting}
            style={{
              flex: '0 0 auto',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            Back
          </button>
          <button
            type="submit"
            data-testid="step2-submit"
            disabled={isSubmitting}
            style={{
              flex: 1,
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit KYC Documents'}
          </button>
        </div>
      </form>
    </div>
  );
};
