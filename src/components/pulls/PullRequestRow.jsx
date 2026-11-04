import React from "react";
import { GitPullRequest } from "lucide-react";
import { formatDistanceToNowStrict, isValid } from "date-fns";

const badgeFor = (pull) => {
  if (pull.merged) return { label: "Merged", className: "border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-400" };
  if (pull.draft) return { label: "Draft", className: "border-border bg-muted text-muted-foreground" };
  if (pull.state === "open") return { label: "Open", className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
  return { label: "Closed", className: "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400" };
};

const relative = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  return isValid(date) ? formatDistanceToNowStrict(date, { addSuffix: true }) : "";
};

export default function PullRequestRow({ pull }) {
  const badge = badgeFor(pull);
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <GitPullRequest className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={pull.url}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 truncate text-sm font-medium hover:underline"
          >
            {pull.title}
          </a>
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}>
            {badge.label}
          </span>
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          #{pull.number}
          {pull.author ? ` · ${pull.author}` : ""}
          {pull.branch ? ` · ${pull.branch} → ${pull.base}` : ""}
          {pull.updatedAt ? ` · updated ${relative(pull.updatedAt)}` : ""}
        </p>
      </div>
    </li>
  );
}