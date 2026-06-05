# Andwell Growth Plan

This repository contains the Andwell Maine Innovation and Growth Plan dashboard.

## Project type

Vite React application using Tailwind CSS and Recharts.

## Local setup

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

The production website will be generated in the `dist` folder.

## Hostinger upload

For standard Hostinger web hosting:

1. Run `npm run build`.
2. Upload the full contents of `dist` into `public_html`.
3. Keep the generated `api/ai/*.php` files and `.htaccess` rewrite rules in place.
4. Set `OPENAI_API_KEY` or `openai_api_key` in Hostinger environment variables, or add it to a server-side `.env` file above or inside `public_html`.

This published build includes a PHP fallback for `/api/ai/token`, `/api/ai/chat`, and `/api/ai/cms-analyze`, so the OpenAI key stays server-side even when the Node Express server is not running.

If you deploy the full Node app on a Hostinger VPS or another Node-capable host, the original Express `/api/*` routes continue to work as well.

## Notes

The main dashboard component lives in `src/App.jsx`. It includes the county growth plan, referral model, financial impact sections, CMS market data layer, competitive view, and data confidence logic.
