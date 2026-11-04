import React, { useCallback, useEffect, useState } from "react";
import { GitPullRequest, RefreshCw, AlertCircle } from "lucide-react";
import { invokeWithAuth } from "@/lib/invokeWithAuth";
import ActionSelect from "@/components/ui/action-select";
import PullRequestRow from "@/components/pulls/PullRequestRow";

const REPO_KEY = "gymsync_tracked_repo";
const STATES = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "all", label: "All" },
];

export default function PullRequests() {
  const [repos, setRepos] = useState([]);
  const [repo, setRepo] = useState(() => localStorage.getItem(REPO_KEY) || "");
  const [state, setState] = useState("open");
  const [pulls, setPulls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    invokeWithAuth("githubPulls", { operation: "repos" })
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.repos || [];
        setRepos(list);
        const saved = localStorage.getItem(REPO_KEY);
        const stillValid = list.some((item) => item.fullName === saved);
        if (!stillValid && list[0]) setRepo(list[0].fullName);
        if (!list.length) setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.response?.data?.error || "Could not reach GitHub for this account.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadPulls = useCallback(async (targetRepo, targetState) => {
    if (!targetRepo) return;
    setLoading(true);
    setError("");
    try {
      const res = await invokeWithAuth("githubPulls", { operation: "pulls", repo: targetRepo, state: targetState });
      setPulls(res.data?.pulls || []);
    } catch (err) {
      setError(err?.response?.data?.error || "Could not load pull requests from GitHub.");
      setPulls([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!repo) return;
    localStorage.setItem(REPO_KEY, repo);
    loadPulls(repo, state);
  }, [repo, state, loadPulls]);

  const repoOptions = repos.map((item) => ({
    value: item.fullName,
    label: item.private ? `${item.fullName} (private)` : item.fullName,
  }));

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">Pull requests</h1>
          <p className="mt-1 text-sm text-muted-foreground">Live review status from your GitHub repository.</p>
        </div>
        <button
          onClick={() => loadPulls(repo, state)}
          disabled={!repo || loading}
          className="flex min-h-[44px] items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Repository</label>
        <ActionSelect
          value={repo}
          onChange={(next) => setRepo(next)}
          options={repoOptions}
          placeholder={repos.length ? "Select a repository" : "No repositories available"}
          disabled={!repos.length}
          ariaLabel="Repository"
          title="Choose a repository"
        />
        <div className="mt-3 flex gap-2">
          {STATES.map((option) => (
            <button
              key={option.value}
              onClick={() => setState(option.value)}
              className={`min-h-[40px] flex-1 rounded-xl border px-3 text-sm font-medium transition-colors ${
                state === option.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-accent"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="space-y-3 p-4">
            {[0, 1, 2].map((row) => (
              <div key={row} className="h-12 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : pulls.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
            <GitPullRequest className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium">No {state === "all" ? "" : `${state} `}pull requests</p>
            <p className="text-xs text-muted-foreground">
              {repo ? `Nothing to show for ${repo}.` : "Choose a repository to see its pull requests."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {pulls.map((pull) => (
              <PullRequestRow key={pull.number} pull={pull} />
            ))}
          </ul>
        )}
      </div>

      {!loading && pulls.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Showing {pulls.length} {pulls.length === 1 ? "pull request" : "pull requests"} · newest first
        </p>
      )}
    </div>
  );
}