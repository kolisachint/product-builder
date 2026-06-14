import React from 'react';
import type { UserProfile, KycStatus } from '@shared/shared_types';

interface Step3Props {
  profile: UserProfile;
  onResubmit: () => void;
}

const statusConfig: Record<
  KycStatus,
  { color: string; backgroundColor: string; borderColor: string; label: string }
> = {
  pending: {
    color: '#92400e',
    backgroundColor: '#fef3c7',
    borderColor: '#fcd34d',
    label: 'Pending Review',
  },
  verified: {
    color: '#065f46',
    backgroundColor: '#d1fae5',
    borderColor: '#6ee7b7',
    label: 'Verified',
  },
  rejected: {
    color: '#991b1b',
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
    label: 'Rejected',
  },
};

const statusIcon: Record<KycStatus, string> = {
  pending: '⏳',
  verified: '✅',
  rejected: '❌',
};

export const Step3StatusDashboard: React.FC<Step3Props> = ({
  profile,
  onResubmit,
}) => {
  const config = statusConfig[profile.kycStatus];
  const icon = statusIcon[profile.kycStatus];

  const cardStyle: React.CSSProperties = {
    padding: '1.5rem',
    borderRadius: '0.5rem',
    backgroundColor: config.backgroundColor,
    border: `2px solid ${config.borderColor}`,
    marginBottom: '1.5rem',
  };

  const statusRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.75rem',
  };

  return (
    <div>
      <h2
        data-testid="step3-heading"
        style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}
      >
        KYC Status
      </h2>

      <div style={cardStyle}>
        <div style={statusRowStyle}>
          <span style={{ fontSize: '1.5rem' }}>{icon}</span>
          <span
            data-testid="kyc-status"
            style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: config.color,
            }}
          >
            {config.label}
          </span>
        </div>

        <div
          style={{
            fontSize: '0.875rem',
            color: config.color,
            opacity: 0.8,
          }}
        >
          <p data-testid="profile-name">
            <strong>Name:</strong> {profile.firstName} {profile.lastName}
          </p>
          <p data-testid="profile-email">
            <strong>Email:</strong> {profile.email}
          </p>
          {profile.phone && (
            <p data-testid="profile-phone">
              <strong>Phone:</strong> {profile.phone}
            </p>
          )}
        </div>
      </div>

      {profile.kycStatus === 'pending' && (
        <div
          data-testid="status-pending-message"
          style={{
            padding: '1rem',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '0.375rem',
            color: '#475569',
          }}
        >
          <p style={{ margin: 0 }}>
            Your documents are under review. You will be notified once the
            verification is complete. This typically takes 1–2 business days.
          </p>
        </div>
      )}

      {profile.kycStatus === 'verified' && (
        <div
          data-testid="status-verified-message"
          style={{
            padding: '1rem',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '0.375rem',
            color: '#166534',
          }}
        >
          <p style={{ margin: 0 }}>
            🎉 <strong>Congratulations!</strong> Your identity has been
            successfully verified. You now have full access to the platform.
          </p>
        </div>
      )}

      {profile.kycStatus === 'rejected' && (
        <div>
          <div
            data-testid="status-rejected-message"
            style={{
              padding: '1rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '0.375rem',
              color: '#991b1b',
              marginBottom: '1rem',
            }}
          >
            <p style={{ margin: 0 }}>
              <strong>Unfortunately, your KYC verification was rejected.</strong>
            </p>
            <p style={{ margin: '0.5rem 0 0' }}>
              Please review your documents and resubmit. Make sure the documents
              are clear and all information is legible.
            </p>
          </div>
          <button
            data-testid="resubmit-button"
            onClick={onResubmit}
            style={{
              width: '100%',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Resubmit Documents
          </button>
        </div>
      )}

      <div
        style={{
          marginTop: '1.5rem',
          padding: '0.75rem',
          fontSize: '0.75rem',
          color: '#9ca3af',
          textAlign: 'center',
        }}
      >
        Profile ID: {profile.id} &middot; Last updated:{' '}
        {new Date(profile.updatedAt).toLocaleString()}
      </div>
    </div>
  );
};
