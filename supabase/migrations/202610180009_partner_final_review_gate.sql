alter table public.partner_verification_cases
  add column if not exists final_review_status text not null default 'not_started'
    check (final_review_status in ('not_started','in_review','approved','changes_requested','declined','paused')),
  add column if not exists final_reviewed_by uuid references auth.users(id),
  add column if not exists final_reviewed_at timestamptz,
  add column if not exists final_review_certification text,
  add column if not exists final_review_note text;

create table if not exists public.partner_verification_decisions (
  id uuid primary key default gen_random_uuid(),
  verification_case_id uuid not null references public.partner_verification_cases(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  decision text not null check (decision in ('approve','request_changes','decline','pause')),
  reviewer_user_id uuid not null references auth.users(id),
  reviewer_certification text,
  reviewer_note text,
  created_at timestamptz not null default now()
);

alter table public.partner_verification_decisions enable row level security;

create policy partner_decisions_staff_read on public.partner_verification_decisions
for select to authenticated using (private.current_user_is_staff());

create policy partner_decisions_staff_insert on public.partner_verification_decisions
for insert to authenticated
with check (private.current_user_is_staff() and reviewer_user_id = (select auth.uid()));

create policy audit_staff_insert on public.audit_events
for insert to authenticated
with check (private.current_user_is_staff() and actor_user_id = (select auth.uid()));

create or replace function public.finalize_partner_verification(
  target_case uuid,
  target_decision text,
  reviewer_certification text,
  reviewer_note text default null
)
returns public.partner_verification_cases
language plpgsql
security invoker
set search_path = public, private, pg_temp
as $$
declare
  c public.partner_verification_cases%rowtype;
  result_case public.partner_verification_cases%rowtype;
  target_org uuid;
begin
  if not private.current_user_is_staff() then
    raise exception 'staff authorization required';
  end if;

  if target_decision not in ('approve','request_changes','decline','pause') then
    raise exception 'unsupported final review decision';
  end if;

  select * into c from public.partner_verification_cases where id = target_case;
  if not found then raise exception 'verification case not found'; end if;

  target_org := c.organization_id;

  if target_decision = 'approve' then
    if coalesce(trim(reviewer_certification), '') = '' then raise exception 'reviewer certification required for approval'; end if;
    if c.w9_required and c.w9_status <> 'accepted' then raise exception 'W-9 must be accepted before approval'; end if;
    if c.classification_review_required and c.classification_status <> 'contractor_supported' then raise exception 'worker-classification review must support contractor status before approval'; end if;
    if c.agreement_required and c.agreement_status <> 'signed' then raise exception 'required agreement must be signed before approval'; end if;
    if c.risk_level = 'high' then raise exception 'high-risk case requires resolution before approval'; end if;

    update public.partner_verification_cases
    set verification_status='approved', final_review_status='approved',
        final_reviewed_by=(select auth.uid()), final_reviewed_at=now(),
        final_review_certification=reviewer_certification, final_review_note=reviewer_note,
        next_action=null, updated_at=now()
    where id=target_case returning * into result_case;

    update public.partner_profiles
    set relationship_status='active', verification_stage='approved',
        last_verified_at=now(), updated_at=now()
    where organization_id=target_org;

    update public.organizations
    set status='active', verification_status='verified', verified_at=now(), updated_at=now()
    where id=target_org;

  elsif target_decision = 'request_changes' then
    if coalesce(trim(reviewer_note), '') = '' then raise exception 'reviewer note required when requesting changes'; end if;
    update public.partner_verification_cases
    set verification_status='blocked', final_review_status='changes_requested',
        final_reviewed_by=(select auth.uid()), final_reviewed_at=now(),
        final_review_certification=reviewer_certification, final_review_note=reviewer_note,
        next_action=reviewer_note, updated_at=now()
    where id=target_case returning * into result_case;
    update public.partner_profiles set verification_stage='final_review', updated_at=now() where organization_id=target_org;

  elsif target_decision = 'decline' then
    if coalesce(trim(reviewer_note), '') = '' then raise exception 'reviewer note required when declining a partner'; end if;
    update public.partner_verification_cases
    set verification_status='declined', final_review_status='declined',
        final_reviewed_by=(select auth.uid()), final_reviewed_at=now(),
        final_review_certification=reviewer_certification, final_review_note=reviewer_note,
        next_action=null, updated_at=now()
    where id=target_case returning * into result_case;
    update public.partner_profiles set relationship_status='ended', verification_stage='declined', updated_at=now() where organization_id=target_org;
    update public.organizations set verification_status='rejected', status='inactive', updated_at=now() where id=target_org;

  else
    if coalesce(trim(reviewer_note), '') = '' then raise exception 'reviewer note required when pausing a partner'; end if;
    update public.partner_verification_cases
    set verification_status='paused', final_review_status='paused',
        final_reviewed_by=(select auth.uid()), final_reviewed_at=now(),
        final_review_certification=reviewer_certification, final_review_note=reviewer_note,
        next_action=reviewer_note, updated_at=now()
    where id=target_case returning * into result_case;
    update public.partner_profiles set relationship_status='paused', verification_stage='paused', updated_at=now() where organization_id=target_org;
  end if;

  insert into public.partner_verification_decisions (
    verification_case_id, organization_id, decision, reviewer_user_id, reviewer_certification, reviewer_note
  ) values (
    target_case, target_org, target_decision, (select auth.uid()), reviewer_certification, reviewer_note
  );

  insert into public.audit_events (
    actor_user_id, action, entity_type, entity_id, metadata
  ) values (
    (select auth.uid()),
    'partner_final_review_' || target_decision,
    'partner_verification_case',
    target_case::text,
    jsonb_build_object('organization_id',target_org,'decision',target_decision,'reviewer_note',reviewer_note)
  );

  return result_case;
end;
$$;

revoke all on function public.finalize_partner_verification(uuid,text,text,text) from public;
grant execute on function public.finalize_partner_verification(uuid,text,text,text) to authenticated;
