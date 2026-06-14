/**
 * Frontend Component Tests — Step 2: KYC Submission (NC-3)
 *
 * Blueprint §3.2 — Step 2: KYC Submission
 * Blueprint §5.2 — Frontend Component Tests
 */
// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Step2KycSubmission } from '../components/Step2_KycSubmission';
import type { UserProfile } from '@shared/shared_types';

// =============================================
// Mock the API client
// =============================================
vi.mock('../api/client', () => ({
  submitKyc: vi.fn(),
}));

import { submitKyc } from '../api/client';
const mockSubmitKyc = vi.mocked(submitKyc);

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

const updatedProfile: UserProfile = {
  ...mockProfile,
  kycStatus: 'pending',
};

// =============================================
// §3.2 Step 2: KYC Submission Tests
// =============================================
describe('Step2_KycSubmission', () => {
  const onComplete = vi.fn();
  const onBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the heading', () => {
      render(
        <Step2KycSubmission profile={mockProfile} onComplete={onComplete} onBack={onBack} />,
      );
      expect(screen.getByTestId('step2-heading')).toHaveTextContent('Submit KYC Documents');
    });

    it('should render document type selector', () => {
      render(
        <Step2KycSubmission profile={mockProfile} onComplete={onComplete} onBack={onBack} />,
      );
      expect(screen.getByTestId('select-documentType')).toBeDefined();
    });

    it('should render document URL input', () => {
      render(
        <Step2KycSubmission profile={mockProfile} onComplete={onComplete} onBack={onBack} />,
      );
      expect(screen.getByTestId('input-documentUrl')).toBeDefined();
    });

    it('should render submit button', () => {
      render(
        <Step2KycSubmission profile={mockProfile} onComplete={onComplete} onBack={onBack} />,
      );
      expect(screen.getByTestId('step2-submit')).toBeDefined();
    });

    it('should render back button', () => {
      render(
        <Step2KycSubmission profile={mockProfile} onComplete={onComplete} onBack={onBack} />,
      );
      expect(screen.getByTestId('step2-back')).toBeDefined();
    });
  });

  describe('document type options', () => {
    it('should include passport option', () => {
      render(
        <Step2KycSubmission profile={mockProfile} onComplete={onComplete} onBack={onBack} />,
      );
      const select = screen.getByTestId('select-documentType') as HTMLSelectElement;
      const options = Array.from(select.options).map((o) => o.value);
      expect(options).toContain('passport');
    });

    it('should include drivers_license option', () => {
      render(
        <Step2KycSubmission profile={mockProfile} onComplete={onComplete} onBack={onBack} />,
      );
      const select = screen.getByTestId('select-documentType') as HTMLSelectElement;
      const options = Array.from(select.options).map((o) => o.value);
      expect(options).toContain('drivers_license');
    });

    it('should include national_id option', () => {
      render(
        <Step2KycSubmission profile={mockProfile} onComplete={onComplete} onBack={onBack} />,
      );
      const select = screen.getByTestId('select-documentType') as HTMLSelectElement;
      const options = Array.from(select.options).map((o) => o.value);
      expect(options).toContain('national_id');
    });
  });

  describe('validation', () => {
    it('should prevent submission when documentType is not selected', async () => {
      render(
        <Step2KycSubmission profile={mockProfile} onComplete={onComplete} onBack={onBack} />,
      );
      fireEvent.click(screen.getByTestId('step2-submit'));
      expect(screen.getByTestId('error-documentType')).toHaveTextContent('Please select a document type');
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('should prevent submission when documentUrl is empty', async () => {
      render(
        <Step2KycSubmission profile={mockProfile} onComplete={onComplete} onBack={onBack} />,
      );
      fireEvent.change(screen.getByTestId('select-documentType'), {
        target: { value: 'passport' },
      });
      fireEvent.click(screen.getByTestId('step2-submit'));
      expect(screen.getByTestId('error-documentUrl')).toHaveTextContent('Document URL is required');
      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe('submission behavior', () => {
    it('should call submitKyc with profile ID and document data', async () => {
      mockSubmitKyc.mockResolvedValue(updatedProfile);

      render(
        <Step2KycSubmission profile={mockProfile} onComplete={onComplete} onBack={onBack} />,
      );

      fireEvent.change(screen.getByTestId('select-documentType'), {
        target: { value: 'passport' },
      });
      fireEvent.change(screen.getByTestId('input-documentUrl'), {
        target: { value: 'https://example.com/passport.pdf' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('step2-submit'));
      });

      expect(mockSubmitKyc).toHaveBeenCalledWith('test-uuid-123', {
        documentType: 'passport',
        documentUrl: 'https://example.com/passport.pdf',
      });
    });

    it('should disable submit button while submitting', async () => {
      let resolveSubmit: (v: UserProfile) => void;
      mockSubmitKyc.mockImplementation(
        () => new Promise((resolve) => { resolveSubmit = resolve; }) as Promise<UserProfile>,
      );

      render(
        <Step2KycSubmission profile={mockProfile} onComplete={onComplete} onBack={onBack} />,
      );

      fireEvent.change(screen.getByTestId('select-documentType'), {
        target: { value: 'passport' },
      });
      fireEvent.change(screen.getByTestId('input-documentUrl'), {
        target: { value: 'https://example.com/passport.pdf' },
      });

      fireEvent.click(screen.getByTestId('step2-submit'));

      expect(screen.getByTestId('step2-submit')).toBeDisabled();

      await act(async () => {
        resolveSubmit!(updatedProfile);
      });
    });

    it('should display error message when API returns error', async () => {
      mockSubmitKyc.mockRejectedValue({ error: 'KYC already pending', code: 409 });

      render(
        <Step2KycSubmission profile={mockProfile} onComplete={onComplete} onBack={onBack} />,
      );

      fireEvent.change(screen.getByTestId('select-documentType'), {
        target: { value: 'passport' },
      });
      fireEvent.change(screen.getByTestId('input-documentUrl'), {
        target: { value: 'https://example.com/passport.pdf' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('step2-submit'));
      });

      expect(screen.getByTestId('step2-api-error')).toHaveTextContent('KYC already pending');
    });
  });

  describe('navigation', () => {
    it('should call onBack when back button is clicked', () => {
      render(
        <Step2KycSubmission profile={mockProfile} onComplete={onComplete} onBack={onBack} />,
      );
      fireEvent.click(screen.getByTestId('step2-back'));
      expect(onBack).toHaveBeenCalled();
    });
  });
});
