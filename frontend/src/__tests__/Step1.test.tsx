/**
 * Frontend Component Tests — Step 1: Profile Form (NC-3)
 *
 * Blueprint §3.2 — Step 1: Profile Form
 * Blueprint §3.4 — Validation Gates
 * Blueprint §5.2 — Frontend Component Tests
 */
// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Step1ProfileForm } from '../components/Step1_ProfileForm';
import type { UserProfile, CreateProfileRequest } from '@shared/shared_types';

// =============================================
// Mock the API client
// =============================================
vi.mock('../api/client', () => ({
  createProfile: vi.fn(),
  updateProfile: vi.fn(),
}));

import { createProfile, updateProfile } from '../api/client';
const mockCreateProfile = vi.mocked(createProfile);
const mockUpdateProfile = vi.mocked(updateProfile);

const mockProfile: UserProfile = {
  id: 'test-uuid-123',
  userId: 'user-1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  kycStatus: 'pending',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

// =============================================
// §3.2 Step 1: Profile Form Tests
// =============================================
describe('Step1_ProfileForm', () => {
  const onComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render firstName input field', () => {
      render(<Step1ProfileForm profile={null} onComplete={onComplete} />);
      expect(screen.getByTestId('input-firstName')).toBeDefined();
    });

    it('should render lastName input field', () => {
      render(<Step1ProfileForm profile={null} onComplete={onComplete} />);
      expect(screen.getByTestId('input-lastName')).toBeDefined();
    });

    it('should render email input field', () => {
      render(<Step1ProfileForm profile={null} onComplete={onComplete} />);
      expect(screen.getByTestId('input-email')).toBeDefined();
    });

    it('should render optional phone input field', () => {
      render(<Step1ProfileForm profile={null} onComplete={onComplete} />);
      expect(screen.getByTestId('input-phone')).toBeDefined();
    });

    it('should render a submit button', () => {
      render(<Step1ProfileForm profile={null} onComplete={onComplete} />);
      expect(screen.getByTestId('step1-submit')).toBeDefined();
    });
  });

  describe('field labels and placeholders', () => {
    it('should display "First Name" label', () => {
      render(<Step1ProfileForm profile={null} onComplete={onComplete} />);
      const label = screen.getByLabelText('First Name *');
      expect(label).toBeDefined();
    });

    it('should display "Last Name" label', () => {
      render(<Step1ProfileForm profile={null} onComplete={onComplete} />);
      const label = screen.getByLabelText('Last Name *');
      expect(label).toBeDefined();
    });

    it('should display "Email" label', () => {
      render(<Step1ProfileForm profile={null} onComplete={onComplete} />);
      const label = screen.getByLabelText('Email *');
      expect(label).toBeDefined();
    });

    it('should display "Phone" (optional) label', () => {
      render(<Step1ProfileForm profile={null} onComplete={onComplete} />);
      const label = screen.getByLabelText('Phone (optional)');
      expect(label).toBeDefined();
    });
  });

  describe('validation gates (§3.4)', () => {
    it('should prevent submission when firstName is empty', async () => {
      render(<Step1ProfileForm profile={null} onComplete={onComplete} />);
      fireEvent.click(screen.getByTestId('step1-submit'));
      expect(screen.getByTestId('error-firstName')).toHaveTextContent('First name is required');
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('should prevent submission when lastName is empty', async () => {
      render(<Step1ProfileForm profile={null} onComplete={onComplete} />);
      fireEvent.click(screen.getByTestId('step1-submit'));
      expect(screen.getByTestId('error-lastName')).toHaveTextContent('Last name is required');
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('should prevent submission when email is empty', async () => {
      render(<Step1ProfileForm profile={null} onComplete={onComplete} />);
      fireEvent.click(screen.getByTestId('step1-submit'));
      expect(screen.getByTestId('error-email')).toHaveTextContent('Email is required');
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('should prevent submission when email format is invalid', async () => {
      const user = (await import('@testing-library/user-event')).default;
      render(<Step1ProfileForm profile={null} onComplete={onComplete} />);

      // Fill in valid name fields so only email error shows
      await user.type(screen.getByTestId('input-firstName'), 'John');
      await user.type(screen.getByTestId('input-lastName'), 'Doe');
      await user.type(screen.getByTestId('input-email'), 'not-an-email');

      const form = screen.getByTestId('step1-submit').closest('form')!;
      fireEvent.submit(form);

      expect(screen.getByTestId('error-email')).toHaveTextContent('Please enter a valid email address');
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('should show validation error messages for empty required fields', async () => {
      render(<Step1ProfileForm profile={null} onComplete={onComplete} />);
      fireEvent.click(screen.getByTestId('step1-submit'));

      expect(screen.getByTestId('error-firstName')).toBeDefined();
      expect(screen.getByTestId('error-lastName')).toBeDefined();
      expect(screen.getByTestId('error-email')).toBeDefined();
    });

    it('should allow submission when all required fields are valid', async () => {
      mockCreateProfile.mockResolvedValue(mockProfile);

      render(<Step1ProfileForm profile={null} onComplete={onComplete} />);

      fireEvent.change(screen.getByTestId('input-firstName'), { target: { value: 'John' } });
      fireEvent.change(screen.getByTestId('input-lastName'), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'john@example.com' } });

      await act(async () => {
        fireEvent.click(screen.getByTestId('step1-submit'));
      });

      expect(mockCreateProfile).toHaveBeenCalled();
    });
  });

  describe('submission behavior', () => {
    it('should call createProfile with correct CreateProfileRequest shape', async () => {
      mockCreateProfile.mockResolvedValue(mockProfile);

      render(<Step1ProfileForm profile={null} onComplete={onComplete} />);

      fireEvent.change(screen.getByTestId('input-firstName'), { target: { value: 'John' } });
      fireEvent.change(screen.getByTestId('input-lastName'), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByTestId('input-phone'), { target: { value: '+1234567890' } });

      await act(async () => {
        fireEvent.click(screen.getByTestId('step1-submit'));
      });

      expect(mockCreateProfile).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      });
    });

    it('should include phone in submission when provided', async () => {
      mockCreateProfile.mockResolvedValue(mockProfile);

      render(<Step1ProfileForm profile={null} onComplete={onComplete} />);

      fireEvent.change(screen.getByTestId('input-firstName'), { target: { value: 'John' } });
      fireEvent.change(screen.getByTestId('input-lastName'), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByTestId('input-phone'), { target: { value: '555-1234' } });

      await act(async () => {
        fireEvent.click(screen.getByTestId('step1-submit'));
      });

      const callArg = mockCreateProfile.mock.calls[0][0];
      expect(callArg.phone).toBe('555-1234');
    });

    it('should not include phone in submission when omitted', async () => {
      mockCreateProfile.mockResolvedValue(mockProfile);

      render(<Step1ProfileForm profile={null} onComplete={onComplete} />);

      fireEvent.change(screen.getByTestId('input-firstName'), { target: { value: 'John' } });
      fireEvent.change(screen.getByTestId('input-lastName'), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'john@example.com' } });

      await act(async () => {
        fireEvent.click(screen.getByTestId('step1-submit'));
      });

      const callArg = mockCreateProfile.mock.calls[0][0];
      expect(callArg.phone).toBeUndefined();
    });

    it('should disable submit button while submitting', async () => {
      let resolveCreate: (v: UserProfile) => void;
      mockCreateProfile.mockImplementation(
        () => new Promise((resolve) => { resolveCreate = resolve; }) as Promise<UserProfile>,
      );

      render(<Step1ProfileForm profile={null} onComplete={onComplete} />);

      fireEvent.change(screen.getByTestId('input-firstName'), { target: { value: 'John' } });
      fireEvent.change(screen.getByTestId('input-lastName'), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'john@example.com' } });

      fireEvent.click(screen.getByTestId('step1-submit'));

      expect(screen.getByTestId('step1-submit')).toBeDisabled();

      await act(async () => {
        resolveCreate!(mockProfile);
      });
    });

    it('should display error message when API returns error', async () => {
      mockCreateProfile.mockRejectedValue({ error: 'Email already in use', code: 409 });

      render(<Step1ProfileForm profile={null} onComplete={onComplete} />);

      fireEvent.change(screen.getByTestId('input-firstName'), { target: { value: 'John' } });
      fireEvent.change(screen.getByTestId('input-lastName'), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'taken@example.com' } });

      await act(async () => {
        fireEvent.click(screen.getByTestId('step1-submit'));
      });

      expect(screen.getByTestId('step1-api-error')).toHaveTextContent('Email already in use');
    });

    it('should call updateProfile when editing an existing profile', async () => {
      mockUpdateProfile.mockResolvedValue({ ...mockProfile, firstName: 'Jane' });

      render(<Step1ProfileForm profile={mockProfile} onComplete={onComplete} />);

      fireEvent.change(screen.getByTestId('input-firstName'), { target: { value: 'Jane' } });

      await act(async () => {
        fireEvent.click(screen.getByTestId('step1-submit'));
      });

      expect(mockUpdateProfile).toHaveBeenCalledWith('test-uuid-123', expect.objectContaining({
        firstName: 'Jane',
      }));
    });

    it('should show "Edit Profile" heading when profile is provided', () => {
      render(<Step1ProfileForm profile={mockProfile} onComplete={onComplete} />);
      expect(screen.getByTestId('step1-heading')).toHaveTextContent('Edit Profile');
    });

    it('should show "Create Your Profile" heading when no profile', () => {
      render(<Step1ProfileForm profile={null} onComplete={onComplete} />);
      expect(screen.getByTestId('step1-heading')).toHaveTextContent('Create Your Profile');
    });
  });
});
