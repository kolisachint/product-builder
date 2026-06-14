/**
 * Frontend Component Tests — Step 3: Status Dashboard (NC-3)
 *
 * Blueprint §3.2 — Step 3: Status Dashboard
 * Blueprint §5.2 — Frontend Component Tests
 */
// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Step3StatusDashboard } from '../components/Step3_StatusDashboard';
import type { UserProfile, KycStatus } from '@shared/shared_types';

const baseProfile: UserProfile = {
  id: 'test-uuid-123',
  userId: 'user-1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  kycStatus: 'pending',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T12:00:00.000Z',
};

function makeProfile(kycStatus: KycStatus): UserProfile {
  return { ...baseProfile, kycStatus };
}

// =============================================
// §3.2 Step 3: Status Dashboard Tests
// =============================================
describe('Step3_StatusDashboard', () => {
  const onResubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the heading', () => {
      render(
        <Step3StatusDashboard profile={makeProfile('pending')} onResubmit={onResubmit} />,
      );
      expect(screen.getByTestId('step3-heading')).toHaveTextContent('KYC Status');
    });

    it('should display the profile name', () => {
      render(
        <Step3StatusDashboard profile={makeProfile('pending')} onResubmit={onResubmit} />,
      );
      expect(screen.getByTestId('profile-name')).toHaveTextContent('John Doe');
    });

    it('should display the profile email', () => {
      render(
        <Step3StatusDashboard profile={makeProfile('pending')} onResubmit={onResubmit} />,
      );
      expect(screen.getByTestId('profile-email')).toHaveTextContent('john@example.com');
    });

    it('should display the profile phone when provided', () => {
      render(
        <Step3StatusDashboard profile={makeProfile('pending')} onResubmit={onResubmit} />,
      );
      expect(screen.getByTestId('profile-phone')).toHaveTextContent('+1234567890');
    });
  });

  describe('status indicators', () => {
    it('should display "Pending Review" for pending status', () => {
      render(
        <Step3StatusDashboard profile={makeProfile('pending')} onResubmit={onResubmit} />,
      );
      expect(screen.getByTestId('kyc-status')).toHaveTextContent('Pending Review');
    });

    it('should display "Verified" for verified status', () => {
      render(
        <Step3StatusDashboard profile={makeProfile('verified')} onResubmit={onResubmit} />,
      );
      expect(screen.getByTestId('kyc-status')).toHaveTextContent('Verified');
    });

    it('should display "Rejected" for rejected status', () => {
      render(
        <Step3StatusDashboard profile={makeProfile('rejected')} onResubmit={onResubmit} />,
      );
      expect(screen.getByTestId('kyc-status')).toHaveTextContent('Rejected');
    });
  });

  describe('status-specific content', () => {
    it('should show pending message for pending status', () => {
      render(
        <Step3StatusDashboard profile={makeProfile('pending')} onResubmit={onResubmit} />,
      );
      expect(screen.getByTestId('status-pending-message')).toBeDefined();
    });

    it('should show verified message for verified status', () => {
      render(
        <Step3StatusDashboard profile={makeProfile('verified')} onResubmit={onResubmit} />,
      );
      expect(screen.getByTestId('status-verified-message')).toBeDefined();
    });

    it('should show rejected message for rejected status', () => {
      render(
        <Step3StatusDashboard profile={makeProfile('rejected')} onResubmit={onResubmit} />,
      );
      expect(screen.getByTestId('status-rejected-message')).toBeDefined();
    });

    it('should not show resubmit button for pending status', () => {
      render(
        <Step3StatusDashboard profile={makeProfile('pending')} onResubmit={onResubmit} />,
      );
      expect(screen.queryByTestId('resubmit-button')).toBeNull();
    });

    it('should not show resubmit button for verified status', () => {
      render(
        <Step3StatusDashboard profile={makeProfile('verified')} onResubmit={onResubmit} />,
      );
      expect(screen.queryByTestId('resubmit-button')).toBeNull();
    });

    it('should show resubmit button for rejected status', () => {
      render(
        <Step3StatusDashboard profile={makeProfile('rejected')} onResubmit={onResubmit} />,
      );
      expect(screen.getByTestId('resubmit-button')).toBeDefined();
    });
  });

  describe('navigation', () => {
    it('should call onResubmit when resubmit button is clicked', () => {
      render(
        <Step3StatusDashboard profile={makeProfile('rejected')} onResubmit={onResubmit} />,
      );
      fireEvent.click(screen.getByTestId('resubmit-button'));
      expect(onResubmit).toHaveBeenCalled();
    });
  });
});
