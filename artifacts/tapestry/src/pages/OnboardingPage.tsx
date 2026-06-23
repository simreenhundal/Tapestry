import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, Link } from "wouter";
import { ShieldCheck, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { useCreateEmployee } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const onboardingSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  role: z.string().optional(),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  timezone: z.string().default("UTC"),
  preferredWorkStart: z.string().optional(),
  preferredWorkEnd: z.string().optional(),
  religion: z.string().optional(),
  culturalBackground: z.string().optional(),
  caregivingResponsibilities: z.string().optional(),
  healthConsiderations: z.string().optional(),
  additionalContext: z.string().optional(),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

const STEPS = [
  { id: 1, label: "Basic Info" },
  { id: 2, label: "Work Schedule" },
  { id: 3, label: "Personal Context" },
];

export default function OnboardingPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const createEmployee = useCreateEmployee();
  const [step, setStep] = useState(1);
  const [selectedDays, setSelectedDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      role: "",
      city: "",
      country: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      preferredWorkStart: "09:00",
      preferredWorkEnd: "17:00",
      religion: "",
      culturalBackground: "",
      caregivingResponsibilities: "",
      healthConsiderations: "",
      additionalContext: "",
    },
  });

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const validateStep = async (s: number) => {
    if (s === 1) {
      return await form.trigger(["name", "email", "city", "country"]);
    }
    return true;
  };

  const goNext = async () => {
    const valid = await validateStep(step);
    if (valid) setStep((s) => Math.min(s + 1, 3));
  };

  const onSubmit = (data: OnboardingFormValues) => {
    createEmployee.mutate(
      {
        data: {
          ...data,
          preferredWorkDays: selectedDays,
        },
      },
      {
        onSuccess: () => {
          setSubmitted(true);
        },
        onError: (err) => {
          toast({
            title: "Failed to save profile",
            description: "An error occurred. Please try again.",
            variant: "destructive",
          });
          console.error(err);
        },
      }
    );
  };

  if (submitted) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-3xl font-serif text-primary mb-2">You're all set!</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your context profile has been saved. Your team can now schedule meetings that respect your schedule, culture, and preferences.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="w-full sm:w-auto shadow-sm">View Team Dashboard</Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                setSubmitted(false);
                setStep(1);
                setSelectedDays(["Mon", "Tue", "Wed", "Thu", "Fri"]);
                form.reset();
              }}
            >
              Add Another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background py-12 px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Dashboard
          </Link>
          <div className="font-serif font-medium text-xl tracking-tight text-primary mb-6">Tapestry.</div>
          <h1 className="text-3xl md:text-4xl font-serif text-primary mb-2">
            Join your team on Tapestry
          </h1>
          <p className="text-muted-foreground text-lg">
            Help your team understand how you work best. Takes 2 minutes.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    step > s.id
                      ? "bg-primary text-primary-foreground"
                      : step === s.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
                </div>
                <span className={`text-sm hidden sm:block ${step === s.id ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px transition-colors ${step > s.id ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="bg-secondary/30 border-b border-border/40 pb-5">
            <div className="flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <CardTitle className="text-base font-medium text-primary">
                  Privacy-preserving context
                </CardTitle>
                <CardDescription className="text-sm mt-1 text-muted-foreground">
                  Everything after Basic Info is optional. Share only what you're comfortable sharing.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Step 1: Basic Info */}
                {step === 1 && (
                  <div className="space-y-5">
                    <h3 className="font-serif text-xl text-primary border-b border-border/40 pb-2">Basic Info</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl><Input placeholder="Jane Doe" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Work Email *</FormLabel>
                          <FormControl><Input type="email" placeholder="jane@company.com" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="company" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company</FormLabel>
                          <FormControl><Input placeholder="e.g. Acme Corp" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="role" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role / Title</FormLabel>
                          <FormControl><Input placeholder="e.g. Engineering Lead" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="city" render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl><Input placeholder="Lagos" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="country" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country *</FormLabel>
                          <FormControl><Input placeholder="Nigeria" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="timezone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone</FormLabel>
                        <FormControl><Input placeholder="Africa/Lagos" {...field} /></FormControl>
                        <FormDescription>Auto-detected from your browser. Edit if incorrect.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                )}

                {/* Step 2: Work Schedule */}
                {step === 2 && (
                  <div className="space-y-5">
                    <h3 className="font-serif text-xl text-primary border-b border-border/40 pb-2">Work Schedule</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="preferredWorkStart" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Start Time</FormLabel>
                          <FormControl><Input type="time" {...field} /></FormControl>
                          <FormDescription>Local time</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="preferredWorkEnd" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred End Time</FormLabel>
                          <FormControl><Input type="time" {...field} /></FormControl>
                          <FormDescription>Local time</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div>
                      <FormLabel>Work Days</FormLabel>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {DAYS.map((day) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(day)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                              selectedDays.includes(day)
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-muted-foreground border-border hover:border-primary/50"
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Selected: {selectedDays.length > 0 ? selectedDays.join(", ") : "None"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 3: Personal Context */}
                {step === 3 && (
                  <div className="space-y-5">
                    <h3 className="font-serif text-xl text-primary border-b border-border/40 pb-2">
                      Personal Context <span className="text-muted-foreground text-base font-sans font-normal">(Optional)</span>
                    </h3>
                    <FormField control={form.control} name="religion" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Religion / Spiritual Practice</FormLabel>
                        <FormControl><Input placeholder="e.g. Islam, Judaism, prefer not to say" {...field} /></FormControl>
                        <FormDescription>Helps teams respect fasting periods, prayer times, or holy days.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="culturalBackground" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cultural Background</FormLabel>
                        <FormControl><Input placeholder="e.g. Observes Lunar New Year, Golden Week" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="caregivingResponsibilities" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Caregiving Responsibilities</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="None">None</SelectItem>
                            <SelectItem value="School-age children">School-age children</SelectItem>
                            <SelectItem value="Elderly parent care">Elderly parent care</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="healthConsiderations" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Health Considerations</FormLabel>
                        <FormControl><Input placeholder="e.g. Migraines — avoids early morning calls" {...field} /></FormControl>
                        <FormDescription>Optional — helps teams avoid inadvertently difficult scheduling.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="additionalContext" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Anything else you'd like your team to know?</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g. I do school drop-offs between 8–9am. I'm most focused mornings."
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t border-border/40">
                  {step > 1 ? (
                    <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
                      <ArrowLeft className="w-4 h-4 mr-1.5" />
                      Back
                    </Button>
                  ) : (
                    <div />
                  )}
                  {step < 3 ? (
                    <Button type="button" onClick={goNext}>
                      Continue
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={createEmployee.isPending} className="shadow-sm">
                      {createEmployee.isPending ? "Saving..." : "Save Profile"}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
