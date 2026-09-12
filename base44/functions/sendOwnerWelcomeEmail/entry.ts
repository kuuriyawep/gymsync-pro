import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const email = body?.email;
    const dashboardUrl = body?.dashboardUrl || '/';
    if (!email) return Response.json({ error: 'Email is required' }, { status: 400 });

    const subject = 'Welcome to GymSync — your dashboard is ready';
    const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;color:#111;">
  <div style="background:#000;color:#fff;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="margin:0;font-size:20px;letter-spacing:-0.01em;">Welcome to GymSync</h1>
    <p style="margin:4px 0 0;font-size:13px;color:#bbb;">Run your gym with clarity.</p>
  </div>
  <div style="border:1px solid #e5e5e5;border-top:none;border-radius:0 0 12px 12px;padding:24px;">
    <p style="margin:0 0 12px;">You're all set up. Your gym management dashboard is ready.</p>
    <p style="margin:0 0 20px;">Pick up where you left off — finish setting up your gym profile, add members, and start tracking payments and attendance.</p>
    <a href="${dashboardUrl}" style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px;">Go to my dashboard</a>
    <p style="margin:16px 0 0;font-size:12px;color:#888;">If the button doesn't work, copy this link: ${dashboardUrl}</p>
  </div>
</div>`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      subject,
      body: html,
      from_name: 'GymSync',
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}