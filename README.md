# 📰 Amazetime.in — AI-Powered News Portal

**Amazetime.in** is a cutting-edge news aggregator that bridges regional reporting with high-end digital journalism. It automatically collects local Tamil news feeds and uses **Google Gemini 3 Flash AI** to rewrite them into professional, engaging editorial content.

---

## 🛠️ How It Works

1.  **Aggregate**: Fetches live RSS feeds from district-wise sources (News18 Tamil, etc.).
2.  **Process**: A Node.js backend script sends raw data to Gemini AI.
3.  **Refine**: AI removes external branding, checks sentiment, and writes a professional headline & summary in Tamil.
4.  **Automate**: GitHub Actions refreshes the entire database every **3 hours** and re-deploys the site.

---

## 🚀 For Team Members (Collaborators)

### 1. Local Development
Clone the repo and install dependencies:
```bash
git clone <repository-url>
npm install
```

### 2. Environment Setup
Create a `.env` file in the project root:
```env
API_KEY=your_gemini_api_key_here
```

### 3. Testing Changes
Before pushing, ensure your code builds and the AI generator functions:
```bash
# Generate fresh news data locally
npm run generate

# Verify the production build
npm run build
```

### 4. Pushing Code
Simply push to the `main` branch. Our **GitHub Actions** pipeline will:
- Validate your code.
- Run the AI generator.
- Update the live site on GitHub Pages.

---

## 📦 Tech Stack

- **Frontend**: React 19, Tailwind CSS (Vite)
- **Intelligence**: Google Gemini 3 Flash Preview
- **CI/CD**: GitHub Actions
- **Data**: Static JSON API (Auto-generated)

## 📡 Adding New Sources
To add a new district or news category, update the `FEED_SOURCES` array in:
- `constants.ts` (for the UI)
- `scripts/generate-news.js` (for the AI generator)

---

*Built with ❤️ for the Tamil community by the Amazetime Team.*