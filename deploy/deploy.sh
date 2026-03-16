#!/bin/bash
set -e

HOST="newtown"
DEPLOY_DIR="/srv/ssl-checker"

run_on_server() {
  ssh $HOST "
    export NVM_DIR=\"\$HOME/.nvm\" &&
    [ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\" &&
    $*
  "
}

echo "=== Deploying ssl-checker to $HOST ==="

# --- Package ---
echo "[1/4] Packaging..."
export COPYFILE_DISABLE=1
tar --no-xattrs --no-mac-metadata --no-fflags \
  --exclude='.DS_Store' --exclude='node_modules' --exclude='.git' --exclude='.env' \
  -zcf packed.tar.gz \
  checks lib cron-daily.js cron-hourly.js package.json package-lock.json

# --- Upload ---
echo "[2/4] Uploading..."
ssh $HOST "mkdir -p $DEPLOY_DIR"
scp packed.tar.gz $HOST:$DEPLOY_DIR/
run_on_server "cd $DEPLOY_DIR && tar -zxf packed.tar.gz && rm packed.tar.gz"
rm -f packed.tar.gz

# --- Install deps ---
echo "[3/4] Installing dependencies..."
run_on_server "cd $DEPLOY_DIR && npm install --omit=dev"

# --- Copy .env if missing ---
NEEDS_ENV=$(ssh $HOST "[ -f $DEPLOY_DIR/.env ] && echo 'no' || echo 'yes'")
if [ "$NEEDS_ENV" = "yes" ] && [ -f .env ]; then
  scp .env $HOST:$DEPLOY_DIR/.env
  echo "Copied .env to server"
fi

# --- Setup cron jobs ---
echo "[4/4] Setting up cron jobs..."
ssh $HOST "
  DAILY=\"0 11 * * * cd $DEPLOY_DIR && /root/.nvm/versions/node/v24.14.0/bin/node cron-daily.js >> $DEPLOY_DIR/cron-daily.log 2>&1\"
  HOURLY=\"5 * * * * cd $DEPLOY_DIR && /root/.nvm/versions/node/v24.14.0/bin/node cron-hourly.js >> $DEPLOY_DIR/cron-hourly.log 2>&1\"

  CRON=\$(crontab -l 2>/dev/null || true)
  CHANGED=false

  if ! echo \"\$CRON\" | grep -qF 'cron-daily.js'; then
    CRON=\$(printf '%s\n%s' \"\$CRON\" \"\$DAILY\")
    CHANGED=true
    echo 'Added daily cron (11:00 UTC)'
  else
    echo 'Daily cron already exists'
  fi

  if ! echo \"\$CRON\" | grep -qF 'cron-hourly.js'; then
    CRON=\$(printf '%s\n%s' \"\$CRON\" \"\$HOURLY\")
    CHANGED=true
    echo 'Added hourly cron'
  else
    echo 'Hourly cron already exists'
  fi

  if [ \"\$CHANGED\" = true ]; then
    echo \"\$CRON\" | crontab -
    echo 'Crontab updated'
  fi

  echo ''
  echo 'Current crontab:'
  crontab -l
"

echo ""
echo "=== Deploy complete ==="
