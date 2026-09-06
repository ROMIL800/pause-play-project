/** Continuous right-to-left scrolling ticker shown under the app header. */
export function Marquee() {
  const text =
    "Welcome to GD BOSS777 | Kalyan Live Result Sabse Fast | Play Kalyan, Gali, Deshawer, Faridabad | Kalyan Open-Close Jodi Rate 1:95 | DP Boss Betting | Instant Withdrawal | Bet and Win Big";
  return (
    <div className="overflow-hidden bg-[#003366] py-1.5">
      <div className="marquee-track whitespace-nowrap text-white text-[12px] font-bold">
        <span className="px-6">{text}</span>
        <span className="px-6">{text}</span>
      </div>
    </div>
  );
}
