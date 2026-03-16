#!/bin/bash
set -e

HOST="newtown"
DEPLOY_DIR="\$HOME/ssl-checker"
REPO_URL="git@github.com:Steemhunt/ssl-checker.git"

echo "=== Deploying ssl-checker to $HOST ==="

# --- Sync repo ---
echo "[1/4] Syncing repo..."
ssh $HOST "
  if [ ! -d $DEPLOY_DIR ]; then
    git clone $REPO_URL $DEPLOY_DIR
  else
    cd $DEPLOY_DIR && git pull
  fi
"

# --- Install deps ---
echo "[2/4] Installing dependencies..."
ssh $HOST "cd $DEPLOY_DIR && npm install"

# --- Copy .env if missing ---
echo "[3/4] Checking .env..."
NEEDS_ENV=$(ssh $HOST "[ -f $DEPLOY_DIR/.env ] && echo 'no' || echo 'yes'")
if [ "$NEEDS_ENV" = "yes" ]; then
  if [ -f .env ]; then
    scp .env $HOST:~/ssl-checker/.env
    echo "Copied .env to server"
  else
    echo "WARNING: No .env on server and no local .env to copy"
  fi
else
  echo ".env already exists on server"
fi

# --- Setup cron jobs ---
echo "[4/4] Setting up cron jobs..."
ssh $HOST '
  DIR="$HOME/ssl-checker"
  DAILY="0 11 * * * cd $DIR && node cron-daily.js >> $DIR/cron-daily.log 2>&1"
  HOURLY="0 * * * * cd $DIR && node cron-hourly.js >> $DIR/cron-hourly.log 2>&1"

  CRON=$(crontab -l 2>/dev/null || true)
  CHANGED=false

  if ! echo "$CRON" | grep -qF "cron-daily.js"; then
    CRON=$(printf "%s\n%s" "$CRON" "$DAILY")
    CHANGED=true
    echo "Added daily cron (11:00 UTC)"
  else
    echo "Daily cron already exists"
  fi

  if ! echo "$CRON" | grep -qF "cron-hourly.js"; then
    CRON=$(printf "%s\n%s" "$CRON" "$HOURLY")
    CHANGED=true
    echo "Added hourly cron"
  else
    echo "Hourly cron already exists"
  fi

  if [ "$CHANGED" = true ]; then
    echo "$CRON" | crontab -
    echo "Crontab updated"
  fi

  echo ""
  echo "Current crontab:"
  crontab -l
'

echo ""
echo "=== Deploy complete ==="
