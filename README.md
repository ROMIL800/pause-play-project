# PredictPro Dashboard

Create a high-quality, mobile-first "Sports Prediction Dashboard" web app.

🎨 DESIGN:

- Theme: Dark Blue (#0033cc), White, Red, Gold accents.

- Style: Professional, clean, responsive (looks like a premium betting app UI).

- Font: Inter or Roboto.

📱 CORE PAGES:

1. DASHBOARD (HOME):

   - Header: App Logo, User Name "Alakh Sharma", Virtual Balance "₹1000.00" (Display only).

   - Quick Action Buttons: "Deposit Funds" (Button), "Withdraw" (Button), "Support" (WhatsApp Icon).

   - Game List (Grid Layout):

     - Card 1: "Karnataka Day"

       - Status: "Live" (Green badge)

       - Time: "10:10 AM - 11:10 AM"

       - Button: "View Results"

     - Card 2: "Sridevi Day"

       - Status: "Live"

       - Time: "11:40 AM - 12:40 PM"

       - Button: "View Results"

     - Card 3: "Time Bazar"

       - Status: "Closed" (Gray badge)

       - Button: "View Results"

   - Bottom Navigation: "Home", "My Bets", "Passbook", "Wallet", "Support".

2. GAME DETAILS MODAL (Pop-up):

   - Game Name & Time.

   - Payout Table: Single (9x), Jodi (90x), Panna (270x).

   - Input Field: "Enter Your Number (000-999)".

   - Input Field: "Enter Amount".

   - Button: "Place Prediction" (No real backend, just UI alert).

3. CHARTS & STATS PAGE:

   - Line Chart: "30-Day Trend" (Use dummy data, show up/down trends).

   - Bar Chart: "Most Frequent Numbers".

   - Data Source: "Public Lottery Data".

4. PASSBOOK / HISTORY:

   - Table Columns: Date, Game, Number, Amount, Result (Win/Loss), Status.

   - Styling: Clean table with alternating rows.

5. WALLET PAGE:

   - Show QR Code (Static image placeholder).

   - Text: "Scan to Add Funds".

   - Bank Details: "Name: Alakh Sharma", "Account: [Placeholder]", "IFSC: [Placeholder]".

   - Button: "I Have Paid" (Triggers a mock success message).

⚠️ TECHNICAL CONSTRAINTS:

- Use React + Tailwind CSS.

- Use Chart.js for the graphs.

- **DO NOT** implement real payment processing or real money gambling logic.

- All data should be mock data for UI demonstration.

- Focus on the visual layout and user experience.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4aa5e8cc-86fa-4191-b40f-d8471e2ac916).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
