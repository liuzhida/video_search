#!/usr/bin/python
# -*- coding: utf-8 -*-
import requests
import redis
import json
def sha1():
    import hashlib
    mySha1 = hashlib.sha1()
    mySha1.update(src)
    mySha1_Digest = mySha1.hexdigest()
    return mySha1_Digest

def post():
    c = redis.Redis(host='127.0.0.1', port=6379, db=3)
    #url = "http://app.tv.sohu.com/360_app/play.jsp?cid=1&sid=5136421&vid=893568&"
    url = "http://app.tv.sohu.com/360_app/album.jsp?cid=2&sid=5116271&vid=880110&"
    if url.startswith("http://"):
        url = url.lstrip("http://")
    print c.exists("url:%s"%url)
    #c.delete("url:%s"%url)
    #print "delete"
    print url
    if c.exists("url:%s"%url) == False:
        data = url
        r = requests.post("http://care.wandoujia.com:9988/api",data=data)
        #print r.text
        d = json.loads(r.text)
        #print d['down']
        #print d['show']
        print d['title']
        print d['img']
        print d['time']
    else:
        data = url
        r = requests.post("http://care.wandoujia.com:9988/api",data=data)
        #print r.text
        d = json.loads(r.text)
        #print d['down']
        #print d['show']
        print d['title']
        print d['img']
        print d['time']
def search():
    c = redis.Redis(host='127.0.0.1', port=6379, db=3)
    url = "http://care.wandoujia.com:9988/api/s?word=太极"
    r = requests.get(url)
    data = json.loads(r.text)
    #data = r.text
    for i in data:
        #i = eval(i)
        i = json.loads(i)
        print i['url']

def testback():
    url = "http://video.wandoujia.com:9990/api/down?version=2.35.0.2182"
    #url = "http://video.wandoujia.com/api/down?version=2.35.0.2182"
    data = "M3d76dec2006"
    data = "76e9996"
    data = "M7aad8a22005"
    data = "S17da78f201214"
    data = "S8fb0cb920125"
    data = "M7aad8a22005"
    r = requests.post(url,data=data)
    print r.text


def tcn():
    url = "http://play.kuwo.cn/play/st/GetMusicPath?src=91&mid=MUSIC_498438&ext=mp3&key=01FE7479F483688DDA3C2A6F4779DF4F"
    r = requests.get(url, allow_redirects=True)
    print r.url


def tcn2():
    import StringIO
    import pycurl
    
    c = pycurl.Curl()
    str = StringIO.StringIO()
    url = "http://play.kuwo.cn/play/st/GetMusicPath?src=91&mid=MUSIC_498438&ext=mp3&key=01FE7479F483688DDA3C2A6F4779DF4F"
    c.setopt(pycurl.URL, url)
    c.setopt(pycurl.WRITEFUNCTION, str.write)
    c.setopt(pycurl.FOLLOWLOCATION, 1)
    
    c.perform()
    print c.getinfo(pycurl.EFFECTIVE_URL)
    
if __name__ == '__main__':
    #post()
    #search()
    testback()
    #tcn()
