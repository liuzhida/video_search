pid=`ps auxf | grep "9990" | grep -v "grep" | awk {'print $2'}`
echo $pid
sudo kill $pid
python turn.py --port=9990 1>log/turn.log 2>&1 &
