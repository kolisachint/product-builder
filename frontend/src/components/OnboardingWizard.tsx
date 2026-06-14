import React, { useState, useCallback } from 'react';
import type {
  UserProfile,
  ApiError,
} from '@shared/shared_types';
import { StepIndicator } from './StepIndicator';
import { Step1ProfileForm } from './Step1_ProfileForm';
import { Step2KycSubmission } from './Step2_KycSubmission';
import { Step3StatusDashboard } from './Step3_StatusDashboard';

export interface OnboardingState {
  currentStep: 1 | 2 | 3;
  profile: UserProfile | null;
  isSubmitting: boolean;
  error: ApiError | null;
  completedSteps: number[];
}

const initialState: OnboardingState = {
  currentStep: 1,
  profile: null,
  isSubmitting: false,
  error: null,
  completedSteps: [],
};

export const OnboardingWizard: React.FC = () => {
  const [state, setState] = useState<OnboardingState>(initialState);

  const handleStep1Complete = useCallback((profile: UserProfile) => {
    setState((prev) => ({
      ...prev,
      currentStep: 2,
      profile,
      error: null,
      completedSteps: [...new Set([...prev.completedSteps, 1])],
    }));
  }, []);

  const handleStep2Complete = useCallback((profile: UserProfile) => {
    setState((prev) => ({
      ...prev,
      currentStep: 3,
      profile,
      error: null,
      completedSteps: [...new Set([...prev.completedSteps, 2])],
    }));
  }, []);

  const handleBack = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: prev.currentStep === 3 ? 2 : 1,
      error: null,
    }));
  }, []);

  const handleResubmit = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: 2,
      error: null,
    }));
  }, []);

  return (
    <div
      data-testid="onboarding-wizard"
      style={{
        maxWidth: '32rem',
        margin: '2rem auto',
        padding: '2rem',
        backgroundColor: '#fff',
        borderRadius: '0.75rem',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
      }}
    >
      <h1
        data-testid="wizard-title"
        style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: '0.5rem',
          color: '#111827',
        }}
      >
        Onboarding
      </h1>
      <p
        style={{
          textAlign: 'center',
          color: '#6b7280',
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
        }}
      >
        Complete the steps below to set up your account and verify your identity.
      </p>

      <StepIndicator
        currentStep={state.currentStep}
        completedSteps={state.completedSteps}
      />

      <div
        style={{
          borderTop: '1px solid #e5e7eb',
          paddingTop: '1.5rem',
        }}
      >
        {state.currentStep === 1 && (
          <Step1ProfileForm
            profile={state.profile}
            onComplete={handleStep1Complete}
          />
        )}

        {state.currentStep === 2 && state.profile && (
          <Step2KycSubmission
            profile={state.profile}
            onComplete={handleStep2Complete}
            onBack={handleBack}
          />
        )}

        {state.currentStep === 3 && state.profile && (
          <Step3StatusDashboard
            profile={state.profile}
            onResubmit={handleResubmit}
          />
        )}
      </div>
    </div>
  );
};
