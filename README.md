# iQB
Football Game Planner

## Overview
This repo contains a Rails 7 app with React (via esbuild) located in the `web` directory. PostgreSQL is used as the database. Ruby is pinned to `3.3.8` via rbenv for isolation from other apps.

## Prerequisites
- Homebrew (macOS): `https://brew.sh`
- rbenv + ruby-build: `brew install rbenv ruby-build`
- Ruby 3.3.8 (installed via rbenv)
- Node.js 18+ (20.x recommended) and Corepack (ships with Node; we enable it below)
- Yarn (enabled via Corepack)
- PostgreSQL (latest via Homebrew)
- Git

## One-time machine setup
Run these in order on a fresh machine.

1) Clone and enter the repo
```bash
git clone <your-repo-url> iQB
cd iQB
```

2) Install/use Ruby 3.3.8 locally
```bash
brew install rbenv ruby-build
rbenv install -s 3.3.8
cd web
echo "3.3.8" > .ruby-version
rbenv local 3.3.8
ruby -v
```

3) Install latest Rails (if not already)
```bash
gem install rails -N
rails -v
```

4) Install PostgreSQL (latest) and start it
```bash
brew install postgresql
brew services start postgresql
createuser -s "$(whoami)" || true
psql --version
```

5) Ensure pg gem builds against Homebrew Postgres
```bash
bundle config set --local build.pg --with-pg-config="$(brew --prefix)/bin/pg_config"
```

6) Install Ruby gems (vendored inside the project)
```bash
bundle config set --local path 'vendor/bundle'
bundle install
```

7) Enable Yarn via Corepack and install JS deps
```bash
corepack enable
yarn install
```

8) Prepare databases (creates `iqb_development` and `iqb_test`)
```bash
bin/rails db:prepare
```

## Running the app (development)
Option A: Use Foreman via `bin/dev` (recommended)
```bash
gem install foreman -N   # first time only
bin/dev
```
This runs Rails and esbuild together. Visit `http://localhost:3000`.

Option B: Run watchers in separate terminals
- Terminal A (JS build/watch):
```bash
yarn watch
```
- Terminal B (Rails server):
```bash
bin/rails server
```
Visit `http://localhost:3000`.

## Live reload (frontend)
Auto-refresh the browser on changes to React/CSS/views using Guard + Rack::LiveReload.

1) Add development gems and install
```bash
cd /Users/michael.anderson/Documents/iQB/iQB/web
bundle add guard guard-livereload rack-livereload --group development
bundle install
```

2) Enable the middleware (injects the client script)
```bash
ruby -e 'f="config/environments/development.rb"; s=File.read(f); l="  config.middleware.insert_after ActionDispatch::Static, Rack::LiveReload\n"; unless s.include?(l); s=s.sub(/Rails\.application\.configure do\n/, "\\0"+l); File.write(f,s); end'
```

3) Create a minimal Guardfile (watches JS/CSS/views)
```bash
cat > Guardfile <<'EOF'
guard "livereload", port: 35729 do
  watch(%r{app/views/.+\.(erb|haml|slim)$})
  watch(%r{app/helpers/.+\.rb})
  watch(%r{app/assets/.+\.(css|scss|sass|js)$})
  watch(%r{app/javascript/.+\.(js|jsx|ts|tsx)$})
  watch(%r{app/assets/builds/.+\.(js|css)$})
  watch(%r{config/locales/.+\.yml})
end
EOF
```

4) Ensure `Procfile.dev` runs Guard (so `bin/dev` starts it)
```bash
grep -q '^livereload:' Procfile.dev || printf '\nlivereload: bundle exec guard -i\n' >> Procfile.dev
```

5) Run everything
```bash
bin/dev
```

Troubleshooting:
- “cannot load such file -- guard/livereload”: ensure gems are installed (`bundle show guard-livereload`) and not excluded by Bundler (`bundle config set --local without "" && bundle install`).
- Port 35729 blocked: allow in firewall or change the port in `Guardfile`.
- Prefer HMR/Fast Refresh? Consider Vite (`vite_ruby`) for React fast-refresh.

## Vite + React Fast Refresh (HMR)
Vite provides instant HMR for React. These steps are project-local and won’t affect other apps.

Node requirement for Vite 7: Node ^20.19.0 or >=22.12.0.

Pin Node per project (choose one):
- Volta (recommended)
```bash
curl https://get.volta.sh | bash
exec $SHELL -l
cd /Users/michael.anderson/Documents/iQB/iQB/web
volta pin node@22
volta pin yarn@1
node -v
```
- nvm
```bash
brew install nvm
mkdir -p ~/.nvm
# Add to ~/.zshrc:
# export NVM_DIR="$HOME/.nvm"
# [ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && . "/opt/homebrew/opt/nvm/nvm.sh"
source ~/.zshrc
cd /Users/michael.anderson/Documents/iQB/iQB/web
echo "22" > .nvmrc
nvm install
nvm use
node -v
```

Install Vite (manual setup that works even if generators aren’t available):
```bash
cd /Users/michael.anderson/Documents/iQB/iQB/web
bundle add vite_rails
bundle install
yarn add -D vite @vitejs/plugin-react vite-plugin-ruby
```

Create Vite config and entrypoint:
```bash
cat > vite.config.ts <<'EOF'
import { defineConfig } from 'vite';
import RubyPlugin from 'vite-plugin-ruby';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react(), RubyPlugin()],
});
EOF

mkdir -p config
cat > config/vite.json <<'EOF'
{
  "all": {
    "entrypointsDir": "app/frontend/entrypoints",
    "watchAdditionalPaths": ["app/views/**/*"]
  }
}
EOF

mkdir -p app/frontend/entrypoints
cat > app/frontend/entrypoints/application.jsx <<'EOF'
import "../../javascript/react/index.jsx";
EOF
```

Switch the application layout to Vite helpers:
```bash
ruby - <<'RB'
f = "app/views/layouts/application.html.erb"
s = File.read(f)
s.gsub!(/<%=\s*javascript_include_tag.*?%>\n?/m, "")
unless s.include?("vite_client_tag")
  s.sub!("<head>\n", "<head>\n    <%= vite_client_tag %>\n    <%= vite_javascript_tag \"application\" %>\n")
end
File.write(f, s)
RB
```

Add scripts and update Procfile.dev:
```bash
node -e 'const fs=require("fs");const p=JSON.parse(fs.readFileSync("package.json","utf8"));p.scripts=p.scripts||{};p.scripts.dev="vite";p.scripts.build="vite build";fs.writeFileSync("package.json",JSON.stringify(p,null,2));console.log(p.scripts);'
sed -i '' '/^js:/d' Procfile.dev 2>/dev/null || true
grep -q '^vite:' Procfile.dev || printf '\nvite: bundle exec vite dev\n' >> Procfile.dev
```

Run with Vite:
```bash
bin/dev
```
Notes:
- Rails remains on http://localhost:3000; Vite serves HMR internally (default 5173).
- Keep Guard/Rack::LiveReload if you want reloads on ERB/view changes; Vite covers JS/CSS HMR.
- If CSP blocks Vite’s HMR websocket, allow it in `config/initializers/content_security_policy.rb` in development.

## Headless UI (React) + Tailwind
Install Headless UI and Tailwind CSS for accessible, unstyled components you can theme with Tailwind.

1) From the Rails app directory:
```bash
cd /Users/michael.anderson/Documents/iQB/iQB/web
```

2) Install Headless UI (and Heroicons)
```bash
yarn add @headlessui/react @heroicons/react
```

3) Install Tailwind via cssbundling-rails (if not already installed)
```bash
bundle add cssbundling-rails
bin/rails css:install:tailwind
yarn install
```
This creates `app/assets/stylesheets/application.tailwind.css` and adds a CSS watcher so `bin/dev` runs Tailwind alongside esbuild and Rails.

4) Run the app with all watchers
```bash
bin/dev
```

Minimal React usage example (e.g., in `app/javascript/react/App.jsx`):
```jsx
import React, { Fragment, useState } from "react";
import { Dialog, Transition, Switch } from "@headlessui/react";

export default function App() {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  return (
    <div className="p-6 space-y-6">
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
      >
        Open Dialog
      </button>
      <div className="flex items-center space-x-3">
        <span>Enabled</span>
        <Switch
          checked={enabled}
          onChange={setEnabled}
          className={`${enabled ? "bg-blue-600" : "bg-gray-300"} relative inline-flex h-6 w-11 items-center rounded-full transition`}
        >
          <span
            className={`${enabled ? "translate-x-6" : "translate-x-1"} inline-block h-4 w-4 transform rounded-full bg-white transition`}
          />
        </Switch>
      </div>
      <Transition show={open} as={Fragment}>
        <Dialog onClose={setOpen} className="relative z-50">
          <Transition.Child
            enter="transition-opacity ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <Dialog.Title className="text-lg font-semibold">Hello from Headless UI</Dialog.Title>
                <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-gray-100">✕</button>
              </div>
              <p className="mt-3 text-gray-600">This dialog uses Tailwind for styling.</p>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
```

## Database
- Adapter: PostgreSQL
- Default names:
  - development: `iqb_development`
  - test: `iqb_test`
- Names are configured in `web/config/database.yml`. PostgreSQL folds unquoted names to lowercase; prefer lowercase names.

Common DB tasks:
```bash
bin/rails db:create           # create databases (if not already created)
bin/rails db:migrate         # run migrations
bin/rails db:reset           # drop + create + migrate + seed
bin/rails db:prepare         # create + migrate if needed
```

## Troubleshooting
- pg gem fails to compile:
  - Ensure Postgres is installed: `brew install postgresql`
  - Point bundler to pg_config: `bundle config set --local build.pg --with-pg-config="$(brew --prefix)/bin/pg_config"`
  - Reinstall: `bundle install`
- `yarn watch` not found:
  - Ensure esbuild scripts exist: `bin/rails javascript:install:esbuild`
  - Then: `yarn install` and retry `yarn watch`
- Postgres connection issues:
  - Ensure service is running: `brew services start postgresql`
  - Give your user permissions: `createuser -s "$(whoami)" || true`
  - Check credentials / DB names in `web/config/database.yml`

## Project layout
- `web/` – Rails app (Ruby 3.3.8, esbuild, React, PostgreSQL)
  - `app/javascript/` – frontend entry (`application.js`) and React code (e.g. `react/`)
  - `config/database.yml` – Postgres configuration and DB names
  - `vendor/bundle/` – vendored Ruby gems (local, per-project)

## Notes
- Ruby version is pinned in `web/.ruby-version`.
- Use `rbenv local 3.3.8` in `web/` to ensure the correct Ruby for this app.
- Use `bin/rails` and `bin/bundle` inside `web/` to guarantee the app’s Ruby and gems are used.
