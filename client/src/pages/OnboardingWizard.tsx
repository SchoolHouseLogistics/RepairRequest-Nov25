import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import OrgSetupStep from "@/components/onboarding/OrgSetupStep";
import BuildingSetupStep from "@/components/onboarding/BuildingSetupStep";
import RoomSetupStep from "@/components/onboarding/RoomSetupStep";
import InviteUsersStep from "@/components/onboarding/InviteUsersStep";

const steps = [
  { label: "Organization", component: OrgSetupStep },
  { label: "Buildings", component: BuildingSetupStep },
  { label: "Rooms", component: RoomSetupStep },
  { label: "Invite Team", component: InviteUsersStep },
];

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    await fetch("/api/onboarding/complete", { method: "POST" });
    navigate("/dashboard");
  };

  const handleFinish = async () => {
    await fetch("/api/onboarding/complete", { method: "POST" });
    navigate("/dashboard");
  };

  const StepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index < currentStep
                  ? "bg-green-500 text-white"
                  : index === currentStep
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}>
                {index < currentStep ? <CheckCircle className="w-5 h-5" /> : index + 1}
              </div>
              <span className={`ml-2 text-sm hidden sm:inline ${
                index === currentStep ? "font-medium text-gray-900" : "text-gray-500"
              }`}>
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-3 ${
                  index < currentStep ? "bg-green-500" : "bg-gray-200"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <StepComponent onNext={handleNext} />

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <div>
              {currentStep > 0 && (
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={handleSkip}>
                Skip for now
              </Button>
              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
                  Continue
                </Button>
              ) : (
                <Button onClick={handleFinish} className="bg-blue-600 hover:bg-blue-700">
                  Finish Setup
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
