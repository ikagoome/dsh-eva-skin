#!/usr/bin/env bash
# dsh-eva-skin installer: links this checkout into the dsh profile module
# fallback and registers the ui-eva row in the profile's user patch layer.
# Usage: ./install.sh [ProfileName]
set -euo pipefail

PROFILE_NAME="${1:-web}"
DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"

# 1. Link into the healed profiles module fallback ($DSH_HOME/profiles/node_modules).
SCOPE_DIR="$DSH_HOME/profiles/node_modules/@deepseek-ai"
mkdir -p "$SCOPE_DIR"
LINK="$SCOPE_DIR/dsh-client-ui-eva"
if [ ! -e "$LINK" ]; then
  ln -s "$REPO_DIR" "$LINK"
  echo "linked $LINK -> $REPO_DIR"
else
  echo "link already present: $LINK"
fi

# 2. Register the row in the profile's user patch layer (idempotent).
PATCH="$DSH_HOME/profiles/$PROFILE_NAME/cordis.patch.yml"
if [ ! -f "$PATCH" ]; then
  echo "profile patch not found: $PATCH (is the '$PROFILE_NAME' profile initialized?)" >&2
  exit 1
fi
if grep -q 'dsh-client-ui-eva' "$PATCH"; then
  echo "patch already contains the ui-eva row: $PATCH"
else
  cat >> "$PATCH" <<'EOF'

# dsh-eva-skin: Evangelion theme + wallpaper (installed by install.sh).
- insert:
    - id: ui-eva
      name: '@deepseek-ai/dsh-client-ui-eva'
EOF
  echo "appended ui-eva row to $PATCH"
fi

echo
echo 'Done. Refresh the dsh web GUI page (F5) to apply the skin.'
echo 'If the skin does not appear, restart dsh web, then refresh again.'
