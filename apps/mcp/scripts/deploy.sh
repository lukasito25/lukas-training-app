#!/usr/bin/env bash
# Deploys the connector to Vercel project "liftwise-mcp" (creates it on first run).
#   apps/mcp/scripts/deploy.sh <secrets.env>
# secrets.env holds VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, CRON_SECRET (never commit it).
# Public settings come from the repo's .env. SUPABASE_SERVICE_ROLE_KEY is added by you:
#   cd apps/mcp/.deploy && vercel env add SUPABASE_SERVICE_ROLE_KEY production --sensitive
set -euo pipefail
SECRETS="$1"
SCOPE="${VERCEL_SCOPE:-lukas-projects-946e068e}"
PROJECT="${VERCEL_PROJECT:-liftwise-mcp}"
HERE="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
val() { grep -E "^$1=" "$2" | head -1 | cut -d= -f2-; }

cd "$HERE"
npm run bundle >/dev/null
cd .deploy
if [ ! -f .vercel/project.json ]; then
  vercel projects add "$PROJECT" --scope "$SCOPE" >/dev/null 2>&1 || true
  vercel link --yes --project "$PROJECT" --scope "$SCOPE" >/dev/null
fi
URL="${PUBLIC_URL:-https://$PROJECT.vercel.app}"

setenv() { # name value [--sensitive]
  printf %s "$2" | vercel env add "$1" production --force ${3:-} >/dev/null
  echo "  set $1"
}
echo "Setting environment:"
setenv SUPABASE_URL "$(val VITE_SUPABASE_URL "$ROOT/.env")"
setenv SUPABASE_ANON_KEY "$(val VITE_SUPABASE_ANON_KEY "$ROOT/.env")"
setenv PUBLIC_URL "$URL"
setenv VAPID_SUBJECT "mailto:support@camponord.eu"
setenv VAPID_PUBLIC_KEY "$(val VAPID_PUBLIC_KEY "$SECRETS")"
setenv VAPID_PRIVATE_KEY "$(val VAPID_PRIVATE_KEY "$SECRETS")" --sensitive
setenv CRON_SECRET "$(val CRON_SECRET "$SECRETS")" --sensitive

echo "Deploying…"
vercel deploy --prod --yes --scope "$SCOPE" 2>&1 | tail -3
echo "Health: $(curl -s "$URL/health")"

# Public settings for the web app project (they end up in the browser bundle; not secrets).
WEB="${VERCEL_WEB_PROJECT:-lukas-training-app}"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
vercel link --yes --project "$WEB" --scope "$SCOPE" --cwd "$TMP" >/dev/null
echo "Web app ($WEB) settings:"
for t in production preview; do
  for kv in "VITE_MCP_URL=$URL/mcp" "VITE_VAPID_PUBLIC_KEY=$(val VAPID_PUBLIC_KEY "$SECRETS")" "VITE_SUPPORT_EMAIL=support@camponord.eu"; do
    k="${kv%%=*}"; v="${kv#*=}"
    printf %s "$v" | vercel env add "$k" "$t" --force --cwd "$TMP" >/dev/null && echo "  $t: $k"
  done
done
echo "Redeploy the web app for these to take effect."
