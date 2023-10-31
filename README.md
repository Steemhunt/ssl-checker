# SSL Checker
Check SSL expiry and send notifications to a Discord channel

## Cronjob
```
0 11 * * * cd ~/ssl-checker && node check-all-ssl.js >> ~/ssl-checker/cron.log 2>&1
```