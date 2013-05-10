#!/bin/bash
for i in {7001..7008};
do
    python newvideo.py --port=$i 1>>log/video.log 2>&1 &
    echo $i
done
