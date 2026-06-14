# XenoPilot Frontend

![XenoPilot Dashboard](https://via.placeholder.com/1200x600/161625/6366f1?text=XenoPilot+Dashboard)

XenoPilot is an AI-powered CRM and campaign copilot for consumer brands. It helps marketers identify target audiences, dynamically generate personalized campaigns, predict outcomes, and track post-launch analytics without writing complex queries.

## 🚀 Features

- **Audience Builder**: Query your customer base in plain English (e.g., "Find customers likely to churn"). 
- **Campaign Studio**: Dynamically generates campaign copy, subject lines, and suggests optimal channels (Email, SMS, WhatsApp) based on the target audience.
- **Predictive Analytics**: Pre-launch prediction of Open Rate, Click-Through Rate (CTR), and Expected Conversions.
- **Campaign Dashboard**: Real-time insights and revenue tracking using interactive Recharts components.
- **Hydration Safe SSR**: Fully optimized Server-Side Rendering ensuring fast initial loads with zero React hydration warnings.
- **Premium UI**: Uses a sleek, dark-mode-first glassmorphism design with responsive micro-animations powered by Tailwind CSS.

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charting**: Recharts
- **Data Fetching**: Native Fetch API with structured endpoints mapping to FastAPI

## 💻 Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/XenoPilot-Frontend.git
   cd XenoPilot-Frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🌐 Deployment Details

This application is designed for zero-config deployment on Vercel:

1. Connect your GitHub repository to Vercel.
2. Set the `NEXT_PUBLIC_API_URL` environment variable to your deployed Backend URL (e.g., `https://api.xenopilot.app`).
3. Deploy! Next.js will automatically handle static generation and serverless functions.

## 🤖 AI-Native Workflow

XenoPilot relies on the backend to translate plain English into database filters. The frontend dynamically consumes the predictions and renders actionable next steps, providing marketers with a conversational copilot that abstract away complex CRM data modeling.
