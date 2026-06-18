-- Direct messaging is available between users who have a non-rejected match.
-- Connection requests are intentionally not part of the messaging permission.

DROP POLICY IF EXISTS "Authenticated users can send direct messages"
  ON public.messages;

CREATE POLICY "Authenticated users can send direct messages"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = sender_id
    AND receiver_id IS NOT NULL
    AND receiver_id <> sender_id
    AND nullif(btrim(content), '') IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.matches
      WHERE lower(coalesce(matches.status::text, 'recommended'))
        NOT IN ('rejected', 'declined', 'cancelled')
        AND (
          (
            matches.user_id = (SELECT auth.uid())
            AND matches.matched_user_id = messages.receiver_id
          )
          OR
          (
            matches.matched_user_id = (SELECT auth.uid())
            AND matches.user_id = messages.receiver_id
          )
        )
    )
  );

-- Matched peers must remain visible even when either profile is private.
DROP POLICY IF EXISTS "Accepted connections can read profiles"
  ON public.profiles;
DROP POLICY IF EXISTS "Matched users can read profiles"
  ON public.profiles;

CREATE POLICY "Matched users can read profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.matches
      WHERE lower(coalesce(matches.status::text, 'recommended'))
        NOT IN ('rejected', 'declined', 'cancelled')
        AND (
          (
            matches.user_id = (SELECT auth.uid())
            AND matches.matched_user_id = profiles.id
          )
          OR
          (
            matches.matched_user_id = (SELECT auth.uid())
            AND matches.user_id = profiles.id
          )
        )
    )
  );
