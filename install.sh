#!/usr/bin/env bash
# dsh-eva-skin installer: links this checkout (skin + files companion) into the
# dsh profile module fallback and registers their rows in the profile's user
# patch layer. Usage: ./install.sh [ProfileName]
set -euo pipefail

PROFILE_NAME="${1:-web}"
DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"

# 1. Link into the healed profiles module fallback ($DSH_HOME/profiles/node_modules).
SCOPE_DIR="$DSH_HOME/profiles/node_modules/@deepseek-ai"
mkdir -p "$SCOPE_DIR"
for pair in "dsh-client-ui-eva $REPO_DIR" "dsh-eva-files $REPO_DIR/files"; do
  set -- $pair
  LINK="$SCOPE_DIR/$1"
  TARGET="$2"
  if [ ! -e "$LINK" ]; then
    ln -s "$TARGET" "$LINK"
    echo "linked $LINK -> $TARGET"
  else
    echo "link already present: $LINK"
  fi
done

# 2. Register the rows in the profile's user patch layer (idempotent).
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
    - id: eva-files
      name: '@deepseek-ai/dsh-eva-files'
EOF
  echo "appended ui-eva row to $PATCH"
fi

echo
echo 'Done. Refresh the dsh web GUI page (F5) to apply the skin.'
echo 'If the skin does not appear, restart dsh web, then refresh again.'
