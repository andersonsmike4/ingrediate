# Ingrediate

Rails 7 + React app that suggests recipes from ingredients a user types or
photographs.

## Stack
- Rails 7, Ruby 3.3.8, esbuild
- React (app/javascript/react/)
- PostgreSQL
- Tailwind CSS, Headless UI, Heroicons
- Google Gemini 2.0 Flash API (via Rails backend only)

## Subagent Delegation
Always delegate to specialized subagents:
- Use `rails-backend` for all Ruby, Rails, migrations, services, controllers
- Use `react-frontend` for all React components, hooks, and UI work

## Security Rules (non-negotiable)
- GEMINI_API_KEY loaded only from Rails.application.credentials.gemini_api_key
  or ENV['GEMINI_API_KEY']
- Zero external API calls from the browser - all go through Rails
- Validate image uploads: jpg/png/webp only, max 10MB, server-side
- CSRF protection on all API endpoints
- Never log user ingredients, images, or personal data

## Key Files
- app/services/ai_service.rb — all Gemini API logic lives here
- app/controllers/api/ — API endpoints
- app/javascript/react/App.jsx — React root
- app/javascript/react/components/ — all components

## Database
- Development: ingrediate_development
- Test: ingrediate_test
