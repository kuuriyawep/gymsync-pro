import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { secrets } from 'base44:runtime';
import { createSupabaseRestClient } from '../../shared/supabaseRest.ts';
import { deny, resolveAccess } from '../../shared/authz.ts';

const API = 'https://api.github.com';
// Repository names are interpolated into the GitHub URL, so they are strictly
// validated instead of being passed through from the client unchecked.
const REPO_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export default async function (req) {
  let operation = '';
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    operation = String(body.operation || '');
    if (!['repos', 'pulls'].includes(operation)) return Response.json({ error: 'Invalid operation' }, { status: 400 });

    const restUrl = secrets.get('SUPABASE_URL').replace(/\/$/, '');
    const serviceKey = secrets.get('SUPABASE_SERVICE_ROLE_KEY');
    const rest = createSupabaseRestClient(restUrl, serviceKey);
    const access = await resolveAccess(base44, rest, {
      url: restUrl,
      serviceKey,
      accessToken: String(body._supabaseAccessToken || ''),
    });
    if (!access?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    // Repository activity is engineering tooling for the account holder only —
    // the GitHub connection is the builder's own account, so staff and members
    // must never see it.
    if (access.role !== 'owner') return deny('Only the gym owner can view repository activity.');

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('github');
    if (!accessToken) return Response.json({ error: 'GitHub is not connected for this app.' }, { status: 409 });

    const github = async (path) => {
      const res = await fetch(`${API}${path}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'GymSyncPro',
        },
        signal: AbortSignal.timeout(10000),
      });
      if (res.status === 404) return { notFound: true };
      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        const message = detail ? `${res.status}: ${detail.slice(0, 160)}` : `GitHub returned ${res.status}`;
        return { error: message };
      }
      return { data: await res.json() };
    };

    if (operation === 'repos') {
      const result = await github('/user/repos?sort=updated&per_page=50&affiliation=owner,collaborator,organization_member');
      if (result.error) return Response.json({ error: result.error }, { status: 502 });
      const repos = (result.data || [])
        .filter((item) => item?.full_name)
        .map((item) => ({
          fullName: item.full_name,
          private: Boolean(item.private),
          description: item.description || '',
          updatedAt: item.updated_at || '',
        }));
      return Response.json({ repos });
    }

    const repo = String(body.repo || '').trim();
    if (!REPO_PATTERN.test(repo)) return Response.json({ error: 'A repository like "owner/name" is required' }, { status: 400 });
    const state = ['open', 'closed', 'all'].includes(String(body.state)) ? String(body.state) : 'open';
    const [owner, name] = repo.split('/');
    const result = await github(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/pulls?state=${state}&per_page=30&sort=updated&direction=desc`
    );
    if (result.notFound) return Response.json({ error: `Repository ${repo} was not found or is not accessible.` }, { status: 404 });
    if (result.error) return Response.json({ error: result.error }, { status: 502 });

    const pulls = (result.data || []).map((pull) => ({
      number: pull.number,
      title: pull.title || '',
      state: pull.state === 'open' ? 'open' : 'closed',
      draft: Boolean(pull.draft),
      merged: Boolean(pull.merged_at),
      author: pull.user?.login || '',
      branch: pull.head?.ref || '',
      base: pull.base?.ref || '',
      createdAt: pull.created_at || '',
      updatedAt: pull.updated_at || '',
      url: pull.html_url || '',
    }));
    return Response.json({ repo, state, pulls });
  } catch (error) {
    // Name the failed operation instead of forwarding raw provider text.
    return Response.json({ error: `Unable to load GitHub ${operation || 'data'} right now.` }, { status: 500 });
  }
}