revoke execute on function public.wallet_credit(uuid, numeric) from authenticated, anon;
revoke execute on function public.place_bet_debit(uuid, numeric) from authenticated, anon;
revoke execute on function public.claim_signup_bonus(uuid) from authenticated, anon;
revoke execute on function public.pay_referral_bonus(uuid, text) from authenticated, anon;
grant execute on function public.wallet_credit(uuid, numeric) to service_role;
grant execute on function public.place_bet_debit(uuid, numeric) to service_role;
grant execute on function public.claim_signup_bonus(uuid) to service_role;
grant execute on function public.pay_referral_bonus(uuid, text) to service_role;