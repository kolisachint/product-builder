import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
  completedSteps: number[];
}

const steps = [
  { number: 1, label: 'Profile' },
  { number: 2, label: 'KYC Documents' },
  { number: 3, label: 'Status' },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  completedSteps,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '2rem',
        gap: '0.5rem',
      }}
    >
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(step.number);
        const isCurrent = currentStep === step.number;

        return (
          <React.Fragment key={step.number}>
            <div
              data-testid={`step-indicator-${step.number}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <div
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  backgroundColor: isCompleted
                    ? '#22c55e'
                    : isCurrent
                      ? '#3b82f6'
                      : '#d1d5db',
                  color: isCompleted || isCurrent ? '#fff' : '#6b7280',
                  transition: 'all 0.2s ease',
                }}
              >
                {isCompleted ? '✓' : step.number}
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: isCurrent ? '#1f2937' : '#6b7280',
                  fontWeight: isCurrent ? '600' : '400',
                }}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                data-testid={`step-connector-${step.number}`}
                style={{
                  width: '3rem',
                  height: '2px',
                  backgroundColor: isCompleted ? '#22c55e' : '#d1d5db',
                  marginBottom: '1.25rem',
                  transition: 'background-color 0.2s ease',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
