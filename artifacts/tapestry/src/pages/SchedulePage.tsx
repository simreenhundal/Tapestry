import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Loader2,
  Users,
  AlertTriangle,
  XCircle,
  Sparkles,
} from "lucide-react";
import { useListEmployees } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AttendeeReadiness = {
  employeeId: number;
  name: string;
  city: string;
  timezone: string;
  localTime: string;
  signal: "green" | "yellow" | "red";
  reason: string;
};

type ReadinessReport = {
  attendees: AttendeeReadiness[];
  aggregateSignal: "green" | "yellow" | "red";
  recommendation: string;
  alternatives: string[];
};

function SignalBadge({ signal }: { signal: "green" | "yellow" | "red" }) {
  if (signal === "green") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Clear
      </span>
    );
  }
  if (signal === "yellow") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">
        <AlertTriangle className="w-3.5 h-3.5" />
        Consider
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
      <XCircle className="w-3.5 h-3.5" />
      Conflict
    </span>
  );
}

function AggregateBanner({ report }: { report: ReadinessReport }) {
  const colors = {
    green: "bg-green-50 border-green-200 text-green-800",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-800",
    red: "bg-red-50 border-red-200 text-red-800",
  };
  const icons = {
    green: <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />,
    yellow: <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />,
    red: <XCircle className="w-5 h-5 text-red-600 shrink-0" />,
  };
  return (
    <div className={`border rounded-xl p-5 ${colors[report.aggregateSignal]}`}>
      <div className="flex items-start gap-3">
        {icons[report.aggregateSignal]}
        <div className="flex-1">
          <p className="font-semibold text-sm mb-1">Overall Recommendation</p>
          <p className="text-sm leading-relaxed">{report.recommendation}</p>
          {report.alternatives.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Suggested Alternatives</p>
              {report.alternatives.map((alt, i) => (
                <div key={i} className="flex items-start gap-2 text-xs leading-relaxed opacity-90">
                  <span className="mt-0.5 w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px] font-bold shrink-0">
                    {i + 1}
                  </span>
                  {alt}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const { data: employees, isLoading: employeesLoading } = useListEmployees();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [meetingDatetime, setMeetingDatetime] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReadinessReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleEmployee = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const checkReadiness = async () => {
    if (selectedIds.length === 0 || !meetingDatetime) return;
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const res = await fetch("/api/context-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeIds: selectedIds, meetingDatetime: new Date(meetingDatetime).toISOString() }),
      });
      if (!res.ok) throw new Error("Failed to check readiness");
      const data = await res.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check readiness");
    } finally {
      setLoading(false);
    }
  };

  const minDatetime = new Date().toISOString().slice(0, 16);

  return (
    <div className="min-h-[100dvh] bg-background">
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif font-medium text-xl tracking-tight text-primary">
            Tapestry.
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Dashboard
            </Link>
            <Link href="/schedule" className="text-sm text-primary font-medium border-b border-primary pb-0.5">
              Schedule
            </Link>
            <Link href="/onboarding">
              <Button size="sm" variant="outline">Add Member</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-serif text-primary mb-2">Meeting Scheduler</h1>
          <p className="text-muted-foreground text-lg">
            Select a time and attendees — Tapestry will check cultural, personal, and environmental readiness for everyone.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-8">
          <div className="space-y-6">
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary/70" />
                  Proposed Meeting Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Date & Time (your local timezone)
                  </label>
                  <input
                    type="datetime-local"
                    min={minDatetime}
                    value={meetingDatetime}
                    onChange={(e) => setMeetingDatetime(e.target.value)}
                    className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tapestry will calculate each attendee's local time automatically.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary/70" />
                  Select Attendees
                  {selectedIds.length > 0 && (
                    <Badge variant="secondary" className="ml-2 font-normal text-xs">
                      {selectedIds.length} selected
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {employeesLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground py-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading team members...</span>
                  </div>
                ) : !employees?.length ? (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground text-sm mb-3">No team members yet.</p>
                    <Link href="/onboarding">
                      <Button size="sm" variant="outline">Add First Member</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-border/40">
                    {employees.map((emp) => {
                      const isSelected = selectedIds.includes(emp.id);
                      return (
                        <button
                          key={emp.id}
                          onClick={() => toggleEmployee(emp.id)}
                          className={`w-full flex items-center gap-4 py-3 px-3 rounded-lg text-left transition-colors hover:bg-secondary/40 ${
                            isSelected ? "bg-primary/5" : ""
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? "bg-primary border-primary"
                                : "border-border"
                            }`}
                          >
                            {isSelected && (
                              <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-primary">{emp.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                              {emp.role && <span>{emp.role}</span>}
                              {emp.role && <span>·</span>}
                              <span>{emp.city}, {emp.country}</span>
                              <span>·</span>
                              <span>{emp.timezone}</span>
                            </div>
                          </div>
                          {emp.religion && (
                            <Badge variant="secondary" className="font-normal text-xs shrink-0 hidden sm:flex">
                              {emp.religion}
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Button
              onClick={checkReadiness}
              disabled={selectedIds.length === 0 || !meetingDatetime || loading}
              size="lg"
              className="w-full h-12 text-base shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Checking readiness...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Check Meeting Readiness
                </>
              )}
            </Button>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {loading && (
              <Card className="border-border/60 shadow-sm">
                <CardContent className="py-12">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-4 border-secondary animate-pulse" />
                      <Sparkles className="w-5 h-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-primary">Tapestry is thinking...</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Checking cultural context, live weather, work schedules, and personal considerations for each attendee.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {report && (
              <div className="space-y-4">
                <AggregateBanner report={report} />

                <div className="space-y-3">
                  {report.attendees.map((attendee) => (
                    <Card key={attendee.employeeId} className="border-border/60 shadow-sm">
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="font-semibold text-sm text-primary">{attendee.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {attendee.city} · {attendee.localTime}
                            </div>
                          </div>
                          <SignalBadge signal={attendee.signal} />
                        </div>
                        <p className="text-xs text-foreground/80 leading-relaxed bg-secondary/30 rounded-md p-3 border border-border/40">
                          {attendee.reason}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {!loading && !report && (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6 bg-secondary/20 rounded-xl border border-border/40 border-dashed">
                <Sparkles className="w-10 h-10 text-muted-foreground/30 mb-4" />
                <p className="text-sm text-muted-foreground font-medium">Readiness report</p>
                <p className="text-xs text-muted-foreground/70 mt-1 leading-relaxed">
                  Select a time and attendees, then click "Check Meeting Readiness" to see per-person signals.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
