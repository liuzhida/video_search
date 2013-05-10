#!/bin/bash
#for i in {7001..7032}
for i in {7001..7008}
do
    pid=`ps auxf | grep $i | grep -v "grep" | awk {'print $2'}`
    echo $pid;
    sudo kill $pid;
    python newvideo.py --port=$i 1>>log/video.log 2>&1 &
    echo $i;
done
