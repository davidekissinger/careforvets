alter table public.partner_verification_documents
  add column if not exists document_name text,
  add column if not exists content_type text,
  add column if not exists viewed_by uuid references auth.users(id),
  add column if not exists viewed_at timestamptz,
  add column if not exists view_count integer not null default 0 check (view_count >= 0);

alter table public.partner_verification_documents
  drop constraint if exists partner_verification_documents_accept_requires_view;

alter table public.partner_verification_documents
  add constraint partner_verification_documents_accept_requires_view
  check (status <> 'accepted' or viewed_at is not null);
