import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { ShieldCheck, Info } from "lucide-react";
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

const onboardingSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  religion: z.string().optional(),
  culturalBackground: z.string().optional(),
  caregivingResponsibilities: z.string().optional(),
  additionalContext: z.string().optional(),
  timezone: z.string().default("UTC"),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const createEmployee = useCreateEmployee();

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: "",
      email: "",
      city: "",
      country: "",
      religion: "",
      culturalBackground: "",
      caregivingResponsibilities: "",
      additionalContext: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    },
  });

  const onSubmit = (data: OnboardingFormValues) => {
    createEmployee.mutate(
      { data },
      {
        onSuccess: () => {
          toast({
            title: "Your context has been saved. Thank you.",
            description: "We've safely stored your preferences.",
          });
          form.reset();
        },
        onError: (err) => {
          toast({
            title: "Failed to save context",
            description: "An error occurred. Please try again.",
            variant: "destructive",
          });
          console.error(err);
        },
      }
    );
  };

  return (
    <div className="min-h-[100dvh] bg-background py-12 px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif text-primary mb-2">
            Welcome to the team
          </h1>
          <p className="text-muted-foreground text-lg">
            Help us understand how you work best.
          </p>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="bg-secondary/30 border-b border-border/40 pb-6">
            <div className="flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <CardTitle className="text-lg font-medium text-primary">
                  Privacy-preserving context
                </CardTitle>
                <CardDescription className="text-sm mt-1 text-muted-foreground">
                  This information is optional and employee-controlled. Share only what you're comfortable with. It helps your team accommodate your lifestyle, observances, and rhythm.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-serif text-xl text-primary border-b border-border/40 pb-2">
                    Basic Info
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Jane Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Work Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="jane@company.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Toronto" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="Canada" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Context */}
                <div className="space-y-4">
                  <h3 className="font-serif text-xl text-primary border-b border-border/40 pb-2">
                    Context (Optional)
                  </h3>
                  <FormField
                    control={form.control}
                    name="religion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Religion / spiritual practice</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Islam, prefer not to say" {...field} />
                        </FormControl>
                        <FormDescription>
                          Helps teams respect fasting periods or holidays.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="culturalBackground"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cultural background</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Lunar New Year observer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="caregivingResponsibilities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Caregiving responsibilities</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
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
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="additionalContext"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Anything else you'd like your team to know?</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g. I do school drop-offs between 8-9am."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={createEmployee.isPending}
                    className="w-full sm:w-auto"
                  >
                    {createEmployee.isPending ? "Saving..." : "Save Context"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
