nohup tail -f ~/nginx/logs/video.access.log | maptail -h 125.39.24.50 -p 9801 2>&1 >/dev/null &
