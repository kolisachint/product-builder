import React, { useState, useCallback } from 'react';
import type {
  UserProfile,
  ApiError,
  CreateProfileRequest,
} from '@shared/shared_types';
import { createProfile, updateProfile } from '../api/client';

interface Step1Props {
  profile: UserProfile | null;
  onComplete: (profile: UserProfile) => void;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateForm(
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
): FormErrors {
  const errors: FormErrors = {};

  if (!firstName.trim()) {
    errors.firstName = 'First name is required';
  } else if (firstName.length > 100) {
    errors.firstName = 'First name must be 100 characters or less';
  }

  if (!lastName.trim()) {
    errors.lastName = 'Last name is required';
  } else if (lastName.length > 100) {
    errors.lastName = 'Last name must be 100 characters or less';
  }

  if (!email.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (phone && phone.length > 20) {
    errors.phone = 'Phone must be 20 characters or less';
  }

  return errors;
}

export const Step1ProfileForm: React.FC<Step1Props> = ({
  profile,
  onComplete,
}) => {
  const [firstName, setFirstName] = useState(profile?.firstName ?? '');
  const [lastName, setLastName] = useState(profile?.lastName ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<ApiError | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setApiError(null);

      const validationErrors = validateForm(firstName, lastName, email, phone);
      setErrors(validationErrors);

      if (Object.keys(validationErrors).length > 0) {
        return;
      }

      setIsSubmitting(true);

      try {
        const data: CreateProfileRequest = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
        };

        let result: UserProfile;
        if (profile) {
          result = await updateProfile(profile.id, data);
        } else {
          result = await createProfile(data);
        }

        onComplete(result);
      } catch (err) {
        const apiErr = err as ApiError;
        setApiError(apiErr);
      } finally {
        setIsSubmitting(false);
      }
    },
    [firstName, lastName, email, phone, profile, onComplete],
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

  return (
    <div>
      <h2
        data-testid="step1-heading"
        style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}
      >
        {profile ? 'Edit Profile' : 'Create Your Profile'}
      </h2>

      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
        Please fill in your basic information to get started.
      </p>

      {apiError && (
        <div
          data-testid="step1-api-error"
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
          <label htmlFor="firstName" style={labelStyle}>
            First Name *
          </label>
          <input
            id="firstName"
            data-testid="input-firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            style={errors.firstName ? errorInputStyle : inputStyle}
            disabled={isSubmitting}
          />
          {errors.firstName && (
            <div data-testid="error-firstName" style={errorTextStyle}>
              {errors.firstName}
            </div>
          )}
        </div>

        <div style={fieldStyle}>
          <label htmlFor="lastName" style={labelStyle}>
            Last Name *
          </label>
          <input
            id="lastName"
            data-testid="input-lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            style={errors.lastName ? errorInputStyle : inputStyle}
            disabled={isSubmitting}
          />
          {errors.lastName && (
            <div data-testid="error-lastName" style={errorTextStyle}>
              {errors.lastName}
            </div>
          )}
        </div>

        <div style={fieldStyle}>
          <label htmlFor="email" style={labelStyle}>
            Email *
          </label>
          <input
            id="email"
            data-testid="input-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={errors.email ? errorInputStyle : inputStyle}
            disabled={isSubmitting}
          />
          {errors.email && (
            <div data-testid="error-email" style={errorTextStyle}>
              {errors.email}
            </div>
          )}
        </div>

        <div style={fieldStyle}>
          <label htmlFor="phone" style={labelStyle}>
            Phone (optional)
          </label>
          <input
            id="phone"
            data-testid="input-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={errors.phone ? errorInputStyle : inputStyle}
            disabled={isSubmitting}
          />
          {errors.phone && (
            <div data-testid="error-phone" style={errorTextStyle}>
              {errors.phone}
            </div>
          )}
        </div>

        <button
          type="submit"
          data-testid="step1-submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
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
          {isSubmitting
            ? 'Saving...'
            : profile
              ? 'Update Profile'
              : 'Create Profile'}
        </button>
      </form>
    </div>
  );
};
