import React from 'react';
import { OnboardingWizard } from './components/OnboardingWizard';

export const App: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f3f4f6',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <OnboardingWizard />
    </div>
  );
};
