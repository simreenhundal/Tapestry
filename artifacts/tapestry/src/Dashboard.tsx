import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Clock,
  Globe2,
  PlusCircle,
  Sparkles,
  Users,
  Calendar,
} from "lucide-react";
import { useListEmployees } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Employee = {
  id: number;
  name: string;
  email: string;
  city: string;
  country: string;
  timezone: string;
  role?: string;
  religion?: string;
  culturalBackground?: string;
  caregivingResponsibilities?: string;
  preferredWorkStart?: string;
  preferredWorkEnd?: string;
  preferredWorkDays?: string;
  healthConsiderations?: string;
  additionalContext?: string;
  createdAt: string;
};

function useLocalTime(timezone: string) {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => {
      try {
        setTime(
          new Date().toLocaleTimeString("en-US", {
            timeZone: timezone,
            hour: "2-digit",
            minute: "2-digit",
            timeZoneName: "short",
          })
        );
      } catch {
        setTime("—");
      }
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [timezone]);
  return time;
}

type ContextTag = {
  emoji: string;
  label: string;
  color: string;
};

function getContextTags(employee: Employee): ContextTag[] {
  const tags: ContextTag[] = [];
  const religionLower = (employee.religion || "").toLowerCase();
  const caregivingLower = (employee.caregivingResponsibilities || "").toLowerCase();
  const culturalLower = (employee.culturalBackground || "").toLowerCase();
  const healthLower = (employee.healthConsiderations || "").toLowerCase();
  const notesLower = (employee.additionalContext || "").toLowerCase();

  if (religionLower.includes("islam") || religionLower.includes("muslim")) {
    tags.push({ emoji: "🕌", label: "Friday Prayer", color: "bg-emerald-50 text-emerald-700 border-emerald-200" });
    if (new Date().getMonth() >= 2 && new Date().getMonth() <= 3) {
      tags.push({ emoji: "🌙", label: "Ramadan Season", color: "bg-indigo-50 text-indigo-700 border-indigo-200" });
    }
  }
  if (religionLower.includes("judaism") || religionLower.includes("jewish")) {
    tags.push({ emoji: "✡️", label: "Shabbat Observer", color: "bg-blue-50 text-blue-700 border-blue-200" });
  }
  if (religionLower.includes("hinduism") || religionLower.includes("hindu")) {
    tags.push({ emoji: "🪔", label: "Hindu Observances", color: "bg-orange-50 text-orange-700 border-orange-200" });
  }
  if (religionLower.includes("buddhism") || religionLower.includes("buddhist")) {
    tags.push({ emoji: "☸️", label: "Buddhist Observances", color: "bg-amber-50 text-amber-700 border-amber-200" });
  }
  if (caregivingLower.includes("school") || notesLower.includes("school drop") || notesLower.includes("pickup")) {
    tags.push({ emoji: "👶", label: "School Pickup", color: "bg-pink-50 text-pink-700 border-pink-200" });
  }
  if (caregivingLower.includes("elderly") || caregivingLower.includes("parent")) {
    tags.push({ emoji: "🏥", label: "Caregiving", color: "bg-rose-50 text-rose-700 border-rose-200" });
  }
  if (healthLower && healthLower !== "none" && healthLower.length > 2) {
    tags.push({ emoji: "💙", label: "Health Context", color: "bg-sky-50 text-sky-700 border-sky-200" });
  }
  if (culturalLower.includes("carnival") || culturalLower.includes("lunar") || culturalLower.includes("golden week") || culturalLower.includes("obon")) {
    tags.push({ emoji: "🎊", label: "Cultural Calendar", color: "bg-purple-50 text-purple-700 border-purple-200" });
  }

  const startHour = parseInt(employee.preferredWorkStart?.split(":")?.[0] ?? "9", 10);
  const endHour = parseInt(employee.preferredWorkEnd?.split(":")?.[0] ?? "17", 10);
  if (startHour >= 7 && endHour >= 19) {
    tags.push({ emoji: "🦉", label: "Night Owl", color: "bg-slate-50 text-slate-600 border-slate-200" });
  } else if (startHour <= 7) {
    tags.push({ emoji: "🌅", label: "Early Bird", color: "bg-yellow-50 text-yellow-700 border-yellow-200" });
  }

  return tags;
}

function EmployeeCard({ employee }: { employee: Employee }) {
  const localTime = useLocalTime(employee.timezone);
  const tags = getContextTags(employee);

  const tzCity = employee.timezone.split("/").pop()?.replace("_", " ") ?? employee.timezone;

  return (
    <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-serif text-primary truncate">{employee.name}</CardTitle>
            {employee.role && (
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">{employee.role}</p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <div className="text-xs font-mono font-medium text-primary bg-secondary/50 px-2 py-1 rounded-md">
              {localTime}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
          <Globe2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{employee.city}, {employee.country}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{tzCity}</span>
          {employee.preferredWorkStart && employee.preferredWorkEnd && (
            <span className="text-muted-foreground/60">
              · {employee.preferredWorkStart}–{employee.preferredWorkEnd}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col pb-4">
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.map((tag, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${tag.color}`}
              >
                {tag.emoji} {tag.label}
              </span>
            ))}
          </div>
        ) : (
          <div className="mb-4">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-green-50 text-green-700 border-green-200">
              ✓ No active context flags
            </span>
          </div>
        )}

        {employee.additionalContext && (
          <p className="text-xs text-muted-foreground italic leading-relaxed bg-secondary/30 rounded-md px-3 py-2 border border-border/40 mt-auto">
            "{employee.additionalContext}"
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: employees, isLoading, error } = useListEmployees();

  return (
    <div className="min-h-[100dvh] bg-background">
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif font-medium text-xl tracking-tight text-primary">
            Tapestry.
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-sm text-primary font-medium border-b border-primary pb-0.5">
              Dashboard
            </Link>
            <Link href="/schedule" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Schedule
            </Link>
            <Link href="/onboarding">
              <Button size="sm" variant="outline" className="gap-1.5">
                <PlusCircle className="w-4 h-4" />
                Add Member
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-serif text-primary mb-2">Team Dashboard</h1>
            <p className="text-muted-foreground">
              Real-time context across your distributed team. All times update live.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link href="/schedule">
              <Button variant="outline" className="gap-2">
                <Calendar className="w-4 h-4" />
                Schedule Meeting
              </Button>
            </Link>
            <Link href="/onboarding">
              <Button className="gap-2 shadow-sm">
                <PlusCircle className="w-4 h-4" />
                Add Member
              </Button>
            </Link>
          </div>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-56 rounded-xl bg-secondary/40 animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
            <p className="text-destructive font-medium">Failed to load employees</p>
            <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
          </div>
        )}

        {!isLoading && !error && employees?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <Users className="w-16 h-16 text-muted-foreground/20 mb-6" />
            <h2 className="text-2xl font-serif text-primary mb-3">No team members yet</h2>
            <p className="text-muted-foreground mb-8 max-w-sm leading-relaxed">
              Add your first team member to start seeing context-aware scheduling insights.
            </p>
            <Link href="/onboarding">
              <Button size="lg" className="gap-2 shadow-sm">
                <PlusCircle className="w-5 h-5" />
                Add First Team Member
              </Button>
            </Link>
          </div>
        )}

        {!isLoading && !error && employees && employees.length > 0 && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{employees.length} team members</span>
              </div>
              <div className="flex-1 border-t border-border/40" />
              <Link href="/schedule">
                <Button size="sm" variant="ghost" className="text-xs gap-1.5 text-muted-foreground hover:text-primary">
                  <Sparkles className="w-3.5 h-3.5" />
                  Check meeting readiness
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {employees.map((emp) => (
                <EmployeeCard key={emp.id} employee={emp as Employee} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
