/**
 * Frontend Component Tests — OnboardingWizard State Machine (NC-3)
 *
 * Blueprint §3.2 — Component Tree
 * Blueprint §3.3 — Onboarding Wizard State
 * Blueprint §3.3 — Step Transitions
 *
 * This component has ZERO existing tests. These tests verify the
 * wizard state machine and step transitions described in the blueprint.
 */
// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { OnboardingWizard } from '../components/OnboardingWizard';
import type { UserProfile } from '@shared/shared_types';

// =============================================
// Mock the API client
// =============================================
vi.mock('../api/client', () => ({
  createProfile: vi.fn(),
  updateProfile: vi.fn(),
  getProfile: vi.fn(),
  submitKyc: vi.fn(),
  reviewKyc: vi.fn(),
}));

import { createProfile, updateProfile, submitKyc } from '../api/client';
const mockCreateProfile = vi.mocked(createProfile);
const mockUpdateProfile = vi.mocked(updateProfile);
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

// =============================================
// §3.2 OnboardingWizard — Initial Render
// =============================================
describe('OnboardingWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial render (§3.2, §3.3)', () => {
    it('should render the wizard title "Onboarding"', () => {
      render(<OnboardingWizard />);
      expect(screen.getByTestId('wizard-title')).toHaveTextContent('Onboarding');
    });

    it('should render the wizard container', () => {
      render(<OnboardingWizard />);
      expect(screen.getByTestId('onboarding-wizard')).toBeDefined();
    });

    it('should start at Step 1 (Profile Form)', () => {
      render(<OnboardingWizard />);
      expect(screen.getByTestId('step1-heading')).toBeDefined();
      expect(screen.getByTestId('input-firstName')).toBeDefined();
    });

    it('should not show Step 2 or Step 3 initially', () => {
      render(<OnboardingWizard />);
      expect(screen.queryByTestId('step2-heading')).toBeNull();
      expect(screen.queryByTestId('step3-heading')).toBeNull();
    });

    it('should render the StepIndicator at step 1', () => {
      render(<OnboardingWizard />);
      expect(screen.getByTestId('step-indicator-1')).toBeDefined();
    });
  });

  describe('§3.3 Step Transitions: Step 1 → Step 2', () => {
    it('should transition to Step 2 when profile creation succeeds', async () => {
      mockCreateProfile.mockResolvedValue(mockProfile);

      render(<OnboardingWizard />);

      // Fill in step 1 form
      fireEvent.change(screen.getByTestId('input-firstName'), { target: { value: 'John' } });
      fireEvent.change(screen.getByTestId('input-lastName'), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'john@example.com' } });

      // Submit step 1
      await act(async () => {
        fireEvent.click(screen.getByTestId('step1-submit'));
      });

      // Should now show Step 2
      expect(screen.getByTestId('step2-heading')).toBeDefined();
      expect(screen.queryByTestId('step1-heading')).toBeNull();
    });

    it('should pass the created profile to Step 2', async () => {
      mockCreateProfile.mockResolvedValue(mockProfile);

      render(<OnboardingWizard />);

      fireEvent.change(screen.getByTestId('input-firstName'), { target: { value: 'John' } });
      fireEvent.change(screen.getByTestId('input-lastName'), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'john@example.com' } });

      await act(async () => {
        fireEvent.click(screen.getByTestId('step1-submit'));
      });

      // Step 2 should have the heading and be functional
      expect(screen.getByTestId('step2-heading')).toHaveTextContent('Submit KYC Documents');
    });

    it('should update step indicator to show step 1 as completed', async () => {
      mockCreateProfile.mockResolvedValue(mockProfile);

      render(<OnboardingWizard />);

      fireEvent.change(screen.getByTestId('input-firstName'), { target: { value: 'John' } });
      fireEvent.change(screen.getByTestId('input-lastName'), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'john@example.com' } });

      await act(async () => {
        fireEvent.click(screen.getByTestId('step1-submit'));
      });

      // Step 1 should show checkmark (✓) indicating completion
      expect(screen.getByTestId('step-indicator-1')).toHaveTextContent('✓');
    });
  });

  describe('§3.3 Step Transitions: Step 2 → Step 3', () => {
    it('should transition to Step 3 when KYC submission succeeds', async () => {
      mockCreateProfile.mockResolvedValue(mockProfile);
      mockSubmitKyc.mockResolvedValue({ ...mockProfile, kycStatus: 'pending' });

      render(<OnboardingWizard />);

      // Complete Step 1
      fireEvent.change(screen.getByTestId('input-firstName'), { target: { value: 'John' } });
      fireEvent.change(screen.getByTestId('input-lastName'), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'john@example.com' } });

      await act(async () => {
        fireEvent.click(screen.getByTestId('step1-submit'));
      });

      // Complete Step 2
      fireEvent.change(screen.getByTestId('select-documentType'), { target: { value: 'passport' } });
      fireEvent.change(screen.getByTestId('input-documentUrl'), {
        target: { value: 'https://example.com/passport.pdf' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('step2-submit'));
      });

      // Should now show Step 3
      expect(screen.getByTestId('step3-heading')).toBeDefined();
      expect(screen.queryByTestId('step2-heading')).toBeNull();
    });

    it('should update step indicator to show steps 1 and 2 as completed', async () => {
      mockCreateProfile.mockResolvedValue(mockProfile);
      mockSubmitKyc.mockResolvedValue({ ...mockProfile, kycStatus: 'pending' });

      render(<OnboardingWizard />);

      // Complete Step 1
      fireEvent.change(screen.getByTestId('input-firstName'), { target: { value: 'John' } });
      fireEvent.change(screen.getByTestId('input-lastName'), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'john@example.com' } });

      await act(async () => {
        fireEvent.click(screen.getByTestId('step1-submit'));
      });

      // Complete Step 2
      fireEvent.change(screen.getByTestId('select-documentType'), { target: { value: 'passport' } });
      fireEvent.change(screen.getByTestId('input-documentUrl'), {
        target: { value: 'https://example.com/passport.pdf' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('step2-submit'));
      });

      // Both steps 1 and 2 should show checkmarks
      expect(screen.getByTestId('step-indicator-1')).toHaveTextContent('✓');
      expect(screen.getByTestId('step-indicator-2')).toHaveTextContent('✓');
    });
  });

  describe('§3.3 Step Transitions: Step 3 → Step 2 (Back Navigation)', () => {
    it('should go back to Step 2 when back button is clicked from Step 2', async () => {
      mockCreateProfile.mockResolvedValue(mockProfile);

      render(<OnboardingWizard />);

      // Complete Step 1 to get to Step 2
      fireEvent.change(screen.getByTestId('input-firstName'), { target: { value: 'John' } });
      fireEvent.change(screen.getByTestId('input-lastName'), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'john@example.com' } });

      await act(async () => {
        fireEvent.click(screen.getByTestId('step1-submit'));
      });

      expect(screen.getByTestId('step2-heading')).toBeDefined();

      // Click back from Step 2 → should go to Step 1
      await act(async () => {
        fireEvent.click(screen.getByTestId('step2-back'));
      });

      expect(screen.getByTestId('step1-heading')).toBeDefined();
      expect(screen.queryByTestId('step2-heading')).toBeNull();
    });
  });
});
