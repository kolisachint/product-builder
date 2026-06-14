/**
 * Frontend Component Tests — StepIndicator (NC-3)
 *
 * Blueprint §3.4 — StepIndicator Component Contract
 * Blueprint §5.4 — Frontend Component Tests
 *
 * This component has ZERO existing tests. These tests verify the
 * blueprint contract for the step progress indicator.
 */
// @vitest-environment jsdom

import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { StepIndicator } from '../components/StepIndicator';

// =============================================
// §3.4 StepIndicator — Rendering Contract
// =============================================
describe('StepIndicator', () => {
  describe('step circles rendering', () => {
    it('should render all three step indicators', () => {
      render(<StepIndicator currentStep={1} completedSteps={[]} />);
      expect(screen.getByTestId('step-indicator-1')).toBeDefined();
      expect(screen.getByTestId('step-indicator-2')).toBeDefined();
      expect(screen.getByTestId('step-indicator-3')).toBeDefined();
    });

    it('should render step labels: Profile, KYC Documents, Status', () => {
      render(<StepIndicator currentStep={1} completedSteps={[]} />);
      expect(screen.getByText('Profile')).toBeDefined();
      expect(screen.getByText('KYC Documents')).toBeDefined();
      expect(screen.getByText('Status')).toBeDefined();
    });

    it('should render step numbers when not completed', () => {
      render(<StepIndicator currentStep={1} completedSteps={[]} />);
      expect(screen.getByTestId('step-indicator-1')).toHaveTextContent('1');
      expect(screen.getByTestId('step-indicator-2')).toHaveTextContent('2');
      expect(screen.getByTestId('step-indicator-3')).toHaveTextContent('3');
    });
  });

  describe('connectors', () => {
    it('should render step connectors between steps', () => {
      render(<StepIndicator currentStep={1} completedSteps={[]} />);
      expect(screen.getByTestId('step-connector-1')).toBeDefined();
      expect(screen.getByTestId('step-connector-2')).toBeDefined();
    });
  });

  describe('completed state (§3.4 — colors: completed = green #22c55e with ✓)', () => {
    it('should show checkmark (✓) for completed steps', () => {
      render(<StepIndicator currentStep={2} completedSteps={[1]} />);
      expect(screen.getByTestId('step-indicator-1')).toHaveTextContent('✓');
    });

    it('should show checkmark for all completed steps', () => {
      render(<StepIndicator currentStep={3} completedSteps={[1, 2]} />);
      expect(screen.getByTestId('step-indicator-1')).toHaveTextContent('✓');
      expect(screen.getByTestId('step-indicator-2')).toHaveTextContent('✓');
    });

    it('should show green background (#22c55e) for completed steps', () => {
      render(<StepIndicator currentStep={2} completedSteps={[1]} />);
      const step1 = screen.getByTestId('step-indicator-1');
      // The circle div inside the indicator
      const circle = step1.querySelector('div');
      expect(circle).not.toBeNull();
      expect(circle!.style.backgroundColor).toBe('rgb(34, 197, 94)');
    });
  });

  describe('current state (§3.4 — colors: current = blue #3b82f6)', () => {
    it('should show blue background (#3b82f6) for current step', () => {
      render(<StepIndicator currentStep={1} completedSteps={[]} />);
      const step1 = screen.getByTestId('step-indicator-1');
      const circle = step1.querySelector('div');
      expect(circle).not.toBeNull();
      expect(circle!.style.backgroundColor).toBe('rgb(59, 130, 246)');
    });

    it('should show step number (not checkmark) for current step', () => {
      render(<StepIndicator currentStep={2} completedSteps={[1]} />);
      expect(screen.getByTestId('step-indicator-2')).toHaveTextContent('2');
    });
  });

  describe('upcoming state (§3.4 — colors: upcoming = grey #d1d5db)', () => {
    it('should show grey background (#d1d5db) for upcoming steps', () => {
      render(<StepIndicator currentStep={1} completedSteps={[]} />);
      const step3 = screen.getByTestId('step-indicator-3');
      const circle = step3.querySelector('div');
      expect(circle).not.toBeNull();
      expect(circle!.style.backgroundColor).toBe('rgb(209, 213, 219)');
    });

    it('should show step number for upcoming steps', () => {
      render(<StepIndicator currentStep={1} completedSteps={[]} />);
      expect(screen.getByTestId('step-indicator-3')).toHaveTextContent('3');
    });
  });

  describe('connector colors', () => {
    it('should show green connector after completed step', () => {
      render(<StepIndicator currentStep={2} completedSteps={[1]} />);
      const connector = screen.getByTestId('step-connector-1');
      expect(connector.style.backgroundColor).toBe('rgb(34, 197, 94)');
    });

    it('should show grey connector for non-completed step', () => {
      render(<StepIndicator currentStep={1} completedSteps={[]} />);
      const connector = screen.getByTestId('step-connector-1');
      expect(connector.style.backgroundColor).toBe('rgb(209, 213, 219)');
    });
  });
});
