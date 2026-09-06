-- Seed admin settings and create the permanent administrator account
INSERT INTO public.app_settings (key, value) VALUES
  ('admin_username', 'admin777'),
  ('admin_phone', '917597886713')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

DO $$
DECLARE
  v_id uuid;
  v_email text := 'p917597886713@phone.matka777.app';
BEGIN
  SELECT id INTO v_id FROM auth.users WHERE email = v_email;

  IF v_id IS NULL THEN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
      v_email, crypt('Swb@1992', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('phone','917597886713','full_name','Admin'),
      now(), now()
    );

    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_id, v_id::text,
      jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
      'email', now(), now(), now());
  ELSE
    UPDATE auth.users
       SET encrypted_password = crypt('Swb@1992', gen_salt('bf')),
           email_confirmed_at = COALESCE(email_confirmed_at, now()),
           updated_at = now()
     WHERE id = v_id;
  END IF;

  INSERT INTO public.profiles (id, phone, full_name) VALUES (v_id, '917597886713', 'Admin')
    ON CONFLICT (id) DO UPDATE SET phone = '917597886713';
  INSERT INTO public.wallets (user_id, balance) VALUES (v_id, 0) ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_id, 'admin') ON CONFLICT DO NOTHING;
END $$;