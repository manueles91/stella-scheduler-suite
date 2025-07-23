import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle } from "lucide-react";
import { BookingStep } from "@/types/booking";

interface BookingProgressProps {
  steps: BookingStep[];
  currentStep: number;
}

export const BookingProgress = ({ steps, currentStep }: BookingProgressProps) => {
  const progress = (currentStep / steps.length) * 100;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center space-x-2">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    currentStep >= step.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {currentStep > step.id ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <div className="hidden sm:block">
                  <p className="font-medium text-sm">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      </CardContent>
    </Card>
  );
}; 