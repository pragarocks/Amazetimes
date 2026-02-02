# Amazetime.in - Project Context

## Architecture
This project uses **Automated Static Generation**. 
- **Source**: Tamil RSS Feeds from News18.
- **Processing**: A Node.js script (`scripts/generate-news.js`) runs via GitHub Actions.
- **AI**: Gemini 3 Flash Preview processes the Tamil text.
- **Output**: A static `news.json` file in `public/data/`.
- **Frontend**: React fetches this static file for instant loading.

## AI Prompting Strategy
- **Target Language**: Tamil (தமிழ்).
- **Tone**: Professional, Authoritative, Editorial.
- **Constraints**: 
    - No source attribution (remove News18/agency names).
    - Output must be valid JSON matching the schema in the generation script.
    - Full article content must be clean HTML.

## Maintenance
- **GitHub Secrets**: Ensure `API_KEY` (Gemini) is set in the GitHub Repository Secrets.
- **Cron**: The workflow runs every 3 hours. Update the `.github/workflows/update-news.yml` file to change frequency.
- **Adding Feeds**: Add new RSS URLs to the `FEED_SOURCES` array in `scripts/generate-news.js` and `constants.ts`.

## UI/UX
- The theme uses Tailwind Slate and Sky colors for a clean news feel.
- Font stack: Inter (Sans) for UI, Merriweather (Serif) for news content.
