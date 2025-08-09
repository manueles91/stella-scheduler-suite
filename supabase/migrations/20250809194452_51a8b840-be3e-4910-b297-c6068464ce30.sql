-- 1) Add invite_token + expires_at to invited_users and indexes
ALTER TABLE public.invited_users
  ADD COLUMN IF NOT EXISTS invite_token text UNIQUE DEFAULT public.generate_registration_token(),
  ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT (now() + interval '7 days');

-- Ensure fast lookup by email
CREATE INDEX IF NOT EXISTS idx_invited_users_email ON public.invited_users (email);

-- 2) Create trigger on auth.users to insert into profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3) Create trigger on profiles to claim invited profile data
DROP TRIGGER IF EXISTS before_insert_claim_invited_profile ON public.profiles;
CREATE TRIGGER before_insert_claim_invited_profile
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.claim_invited_profile();