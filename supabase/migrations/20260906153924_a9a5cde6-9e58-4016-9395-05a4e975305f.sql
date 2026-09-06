insert into public.app_settings (key, value)
values ('deposit_upi_id', '3472605a@bandhan')
on conflict (key) do update set value = excluded.value, updated_at = now();