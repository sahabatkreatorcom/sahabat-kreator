"use client";

import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface TourStep {
  target: string;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
}

interface OnboardingTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const TOUR_STORAGE_KEY = "sk-onboarding-complete";

export function OnboardingTour({ steps, isOpen, onClose, onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [skipTour, setSkipTour] = useState(false);

  const highlightElement = (selector: string) => {
    const element = document.querySelector(selector);
    if (!element) return;

    const rect = element.getBoundingClientRect();
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });

    // Add highlight class
    element.classList.add("ring-2", "ring-[var(--accent-gold)]", "rounded-lg", "transition-all");
    setTimeout(() => {
      element.classList.remove("ring-2", "ring-[var(--accent-gold)]", "rounded-lg");
    }, 2000);
  };

  const completeTour = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    onComplete();
    onClose();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      highlightElement(steps[currentStep + 1].target);
    } else {
      completeTour();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      highlightElement(steps[currentStep - 1].target);
    }
  };

  if (!isOpen || skipTour || steps.length === 0) return null;

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div
        className="absolute max-w-sm rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-6 shadow-xl"
        style={{
          left: Math.min(Math.max(position.x - 150, 16), window.innerWidth - 316),
          top: Math.min(Math.max(position.y - 100, 16), window.innerHeight - 200),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Step indicator */}
        <div className="mb-4 flex items-center gap-1">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 w-8 rounded-full transition-all ${
                index === currentStep ? "bg-[var(--accent-gold)]" : "bg-[var(--bg-tertiary)]"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="mb-6">
          <h3 className="mb-2 font-semibold text-[var(--text-primary)] text-lg">{step.title}</h3>
          <p className="text-[var(--text-muted)]">{step.description}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-[var(--text-muted)]">
            Lewati
          </Button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button variant="secondary" size="sm" onClick={handlePrev}>
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>
            )}
            <Button size="sm" onClick={handleNext} className="gap-2">
              {currentStep === steps.length - 1 ? (
                <>
                  Selesai <Check className="h-4 w-4" />
                </>
              ) : (
                <>
                  Berikutnya <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook to manage tour state
export function useOnboardingTour(_steps: TourStep[], onComplete: () => void) {
  const [isOpen, setIsOpen] = useState(false);
  const [_hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    // Show tour after login if not completed
    const timer = setTimeout(() => {
      const completed = localStorage.getItem(TOUR_STORAGE_KEY);
      if (!completed) {
        setIsOpen(true);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => setIsOpen(false);

  const handleComplete = () => {
    setHasCompleted(true);
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    onComplete();
  };

  return { isOpen, handleClose, handleComplete };
}
