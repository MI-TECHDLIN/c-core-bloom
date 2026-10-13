import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crown, Medal, Search, UserRound } from 'lucide-react';

export interface PerfResult {
  id: string;
  username: string;
  email: string;
  testTitle: string;
  score: number;
  totalQuestions: number;
  timestamp: string;
}

const pct = (score: number, total: number) => (total > 0 ? Math.round((score / total) * 100) : 0);

export const UserPerformanceStats = ({ results }: { results: PerfResult[] }) => {
  const [search, setSearch] = useState('');

  const { users, best } = useMemo(() => {
    const map = new Map<string, { name: string; email: string; tests: Map<string, { title: string; attempts: number; best: number; total: number; last: number }> }>();
    let best: (PerfResult & { percent: number }) | null = null;
    for (const r of results) {
      const key = r.email || r.username;
      if (!map.has(key)) map.set(key, { name: r.username, email: r.email, tests: new Map() });
      const u = map.get(key)!;
      const p = pct(r.score, r.totalQuestions);
      const t = u.tests.get(r.testTitle) || { title: r.testTitle, attempts: 0, best: 0, total: r.totalQuestions, last: p };
      t.attempts += 1;
      t.best = Math.max(t.best, p);
      u.tests.set(r.testTitle, t);
      if (!best || p > best.percent || (p === best.percent && r.score > best.score)) best = { ...r, percent: p };
    }
    const users = [...map.values()].map(u => {
      const tests = [...u.tests.values()];
      const avg = tests.length ? Math.round(tests.reduce((s, t) => s + t.best, 0) / tests.length) : 0;
      return { ...u, tests, avg };
    }).sort((a, b) => b.avg - a.avg);
    return { users, best };
  }, [results]);

  const filtered = users.filter(u =>
    `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Card className="border-primary/40 bg-primary/5">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            <CardTitle className="text-base sm:text-lg">Overall Best Score</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {best ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-lg truncate">{best.username}</p>
                <p className="text-sm text-muted-foreground truncate">{best.testTitle} · {best.timestamp}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-3xl font-bold text-primary">{best.percent}%</p>
                <p className="text-xs text-muted-foreground">{best.score}/{best.totalQuestions} correct</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No submitted tests yet</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Medal className="h-5 w-5 text-primary" />
            <CardTitle className="text-base sm:text-lg">Student Performance by Test</CardTitle>
          </div>
          <CardDescription>Best score each student got on every test they took</CardDescription>
          <div className="relative pt-2">
            <Search className="absolute left-3 top-1/2 mt-1 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search student..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No students found</p>}
          {filtered.map((u, i) => (
            <div key={u.email || u.name} className="rounded-lg border p-3 sm:p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email.replace('@cbt.local', '')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {i === 0 && !search && <Badge>Top</Badge>}
                  <Badge variant="secondary">Avg {u.avg}%</Badge>
                </div>
              </div>
              <div className="space-y-2">
                {u.tests.map(t => (
                  <div key={t.title} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate">{t.title}</span>
                      <span className="shrink-0 text-muted-foreground">
                        <span className="font-semibold text-foreground">{t.best}%</span> · {t.attempts} attempt{t.attempts > 1 ? 's' : ''}
                      </span>
                    </div>
                    <Progress value={t.best} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
