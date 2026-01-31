-- Add response token to offers for one-click email accept/decline
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS response_token UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS response_token_expires_at TIMESTAMPTZ;

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_offers_response_token ON public.offers(response_token);

-- Allow anonymous access to the respond RPC (token-based, no auth needed)
-- The API route validates the token itself
