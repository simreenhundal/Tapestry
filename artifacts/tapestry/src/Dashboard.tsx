import { useState } from "react";
import { Link } from "wouter";
import { AlertTriangle, Clock, Globe2, Info, PlusCircle, Loader2, Sparkles } from "lucide-react";
import { useListEmployees } from "@workspace/api-client-react";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// The Employee type from the generated API
type Employee = {
  id: number;
  name: string;
  email: string;
  city: string;
  country: string;
  timezone: string;
  religion?: string;
  culturalBackground?: string;
  caregivingResponsibilities?: string;
  additionalContext?: string;
  createdAt: string;
};

function getContextFlags(employee: Employee) {
  const flags: string[] = [];

  const religionLower = (employee.religion || "").toLowerCase();
  if (religionLower.includes("islam") || religionLower.includes("muslim")) {
    flags.push("Observes Ramadan — schedule consideration for Feb–Mar annually");
  }

  const caregivingLower = (employee.caregivingResponsibilities || "").toLowerCase();
  if (caregivingLower.includes("school")) {
    flags.push("May have adjusted focus during school holidays");
  }
  if (caregivingLower.includes("elderly")) {
    flags.push("Caregiving responsibilities may affect availability");
  }

  return flags;
}

function EmployeeCard({ employee }: { employee: Employee }) {
  const flags = getContextFlags(employee);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insight, setInsight] = useState<{ insight: string; readiness: string; summary: string } | null>(null);
  const [insightError, setInsightError] = useState<string | null>(null);

  const generateInsight = async () => {
    setInsightLoading(true);
    setInsightError(null);
    try {
      const response = await fetch("/api/context-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employee),
      });

      if (!response.ok) {
        throw new Error("Failed to generate insight");
      }

      const data = await response.json();
      setInsight(data);
    } catch (err) {
      setInsightError(err instanceof Error ? err.message : "Failed to generate insight");
    } finally {
      setInsightLoading(false);
    }
  };

  let signalColor = "bg-green-500";
  if (insight) {
    if (insight.readiness === "yellow") signalColor = "bg-yellow-500";
    else if (insight.readiness === "red") signalColor = "bg-red-500";
  } else {
    if (flags.length === 1) signalColor = "bg-yellow-500";
    else if (flags.length >= 2) signalColor = "bg-red-500";
  }

  return (
    <Card className="border-border/60 shadow-sm flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-serif text-primary">
              {employee.name}
            </CardTitle>
            <div className="text-sm text-muted-foreground flex items-center mt-1">
              <Globe2 className="w-3.5 h-3.5 mr-1.5" />
              {employee.city}, {employee.country}
            </div>
            <div className="text-sm text-muted-foreground flex items-center mt-1">
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              {employee.timezone}
            </div>
          </div>
          <div className="relative flex h-3 w-3 mt-1">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${signalColor}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${signalColor}`}></span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pb-2">
        <div className="flex flex-wrap gap-2 mb-4">
          {employee.religion && (
            <Badge variant="secondary" className="bg-secondary/50 font-normal">
              {employee.religion}
            </Badge>
          )}
          {employee.culturalBackground && (
            <Badge variant="secondary" className="bg-secondary/50 font-normal">
              {employee.culturalBackground}
            </Badge>
          )}
          {employee.caregivingResponsibilities && employee.caregivingResponsibilities !== "None" && (
            <Badge variant="secondary" className="bg-secondary/50 font-normal">
              Care: {employee.caregivingResponsibilities}
            </Badge>
          )}
        </div>

        <div className="mt-auto space-y-3 pt-4 border-t border-border/40">
          {insightLoading ? (
            <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mb-2" />
              <span className="text-xs">Generating AI insight...</span>
            </div>
          ) : insight ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-primary/70" />
                  AI Insight
                </div>
                {insight.summary && (
                  <Badge variant="outline" className="text-[10px] font-medium bg-background">
                    {insight.summary}
                  </Badge>
                )}
              </div>
              <div className="text-sm text-primary/90 leading-relaxed bg-primary/5 p-3 rounded-md border border-primary/10">
                {insight.insight}
              </div>
            </div>
          ) : flags.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Readiness Insights
              </div>
              {flags.map((flag, idx) => (
                <div key={idx} className="flex items-start text-sm">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2 shrink-0 mt-0.5" />
                  <span className="text-primary/90">{flag}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-start text-sm">
              <Info className="w-4 h-4 text-green-600 mr-2 shrink-0 mt-0.5" />
              <span className="text-primary/90">No active context flags. Routine scheduling.</span>
            </div>
          )}

          {!insight && employee.additionalContext && (
            <div className="bg-secondary/30 p-3 rounded-md mt-4 text-sm italic text-muted-foreground border border-border/50">
              "{employee.additionalContext}"
            </div>
          )}
          
          {insightError && (
            <div className="text-xs text-destructive mt-2 text-center">
              {insightError}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2 pb-4">
        <Button 
          variant="secondary" 
          size="sm" 
          className="w-full text-xs font-medium bg-secondary/50 hover:bg-secondary/80 text-secondary-foreground"
          onClick={generateInsight}
          disabled={insightLoading}
        >
          {insightLoading ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Analyzing...
            </>
          ) : insight ? (
            <>
              <Sparkles className="mr-2 h-3 w-3" />
              Refresh Insight
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-3 w-3" />
              Generate AI Insight
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function Dashboard() {
  const { data: employees, isLoading, isError } = useListEmployees();

  return (
    <div className="min-h-[100dvh] bg-secondary/20 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif text-primary">Team Context Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Understand your team's rhythms and responsibilities.
            </p>
          </div>
          <Link href="/onboarding" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Team Member
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-24 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-3">Loading team context...</span>
          </div>
        ) : isError ? (
          <div className="text-center py-24 text-destructive">
            Failed to load employees. Please try again.
          </div>
        ) : !employees || employees.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-xl border border-border/50">
            <Globe2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-primary mb-2">No team members yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Add someone to your team to start building a contextual understanding of how they work best.
            </p>
            <Link href="/onboarding" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add First Member
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((employee) => (
              <EmployeeCard key={employee.id} employee={employee} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
