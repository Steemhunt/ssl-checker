#!/bin/bash
set -e

HOST="newtown"
DEPLOY_DIR="/srv/ssl-checker"
SHARED_DIR="$DEPLOY_DIR/shared"
RELEASE_DIR="$DEPLOY_DIR/releases"
CURRENT_LINK="$DEPLOY_DIR/current"
TIMESTAMP=$(date +%Y-%m-%d-%H-%M-%S)

echo "=== Deploying ssl-checker to $HOST ==="

# --- Package ---
echo "[1/5] Packaging..."
export COPYFILE_DISABLE=1
tar --no-xattrs --no-mac-metadata --no-fflags \
  --exclude='.DS_Store' --exclude='node_modules' --exclude='.git' --exclude='.env' \
  -zcf packed.tar.gz \
  checks lib cron-daily.js cron-hourly.js package.json package-lock.json

# --- Upload ---
echo "[2/5] Uploading..."
ssh $HOST "mkdir -p $RELEASE_DIR/$TIMESTAMP"
scp packed.tar.gz $HOST:$RELEASE_DIR/$TIMESTAMP/
ssh $HOST "cd $RELEASE_DIR/$TIMESTAMP && tar -zxf packed.tar.gz && rm packed.tar.gz"
rm -f packed.tar.gz

# --- Install deps ---
echo "[3/5] Installing dependencies..."
ssh $HOST "cd $RELEASE_DIR/$TIMESTAMP && npm install --omit=dev"

# --- Link .env and current ---
echo "[4/5] Linking..."
NEEDS_ENV=$(ssh $HOST "[ -f $SHARED_DIR/.env ] && echo 'no' || echo 'yes'")
if [ "$NEEDS_ENV" = "yes" ] && [ -f .env ]; then
  ssh $HOST "mkdir -p $SHARED_DIR"
  scp .env $HOST:$SHARED_DIR/.env
  echo "Copied .env to server"
fi
ssh $HOST "
  mkdir -p $SHARED_DIR/log
  ln -sf $SHARED_DIR/.env $RELEASE_DIR/$TIMESTAMP/.env
  rm -f $CURRENT_LINK && ln -s $RELEASE_DIR/$TIMESTAMP $CURRENT_LINK
"

# --- Setup cron jobs ---
echo "[5/5] Setting up cron jobs..."
ssh $HOST "
  DAILY=\"0 11 * * * cd $CURRENT_LINK && node cron-daily.js >> $SHARED_DIR/log/cron-daily.log 2>&1\"
  HOURLY=\"0 * * * * cd $CURRENT_LINK && node cron-hourly.js >> $SHARED_DIR/log/cron-hourly.log 2>&1\"

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

# --- Cleanup old releases ---
echo "Cleaning up old releases..."
ssh $HOST "find $RELEASE_DIR -maxdepth 1 -type d -name '20*' -mtime +7 -exec rm -rf {} +"

echo ""
echo "=== Deploy $TIMESTAMP complete ==="
