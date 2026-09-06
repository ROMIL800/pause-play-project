DO $$
DECLARE v_id uuid;
BEGIN
  SELECT id INTO v_id FROM auth.users WHERE email = 'p917597886713@phone.matka777.app';
  IF v_id IS NOT NULL THEN
    UPDATE auth.users
       SET phone = '917597886713',
           phone_confirmed_at = COALESCE(phone_confirmed_at, now()),
           raw_app_meta_data = '{"provider":"phone","providers":["phone","email"]}'::jsonb,
           updated_at = now()
     WHERE id = v_id;
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    SELECT gen_random_uuid(), v_id, '917597886713',
           jsonb_build_object('sub', v_id::text, 'phone', '917597886713', 'phone_verified', true),
           'phone', now(), now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_id AND provider = 'phone');
  END IF;
END $$;