-- RPC function to check if an email exists in auth.users
-- Used by the membership modal email-first flow
create or replace function public.check_email_exists(p_email text)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1
    from auth.users
    where lower(email) = lower(p_email)
  );
end;
$$;
