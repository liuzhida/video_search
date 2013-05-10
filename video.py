#!/usr/bin/python
# -*- coding: utf-8 -*-
import tornado.httpserver
import tornado.ioloop
import tornado.web
import tornado.options
from tornado import gen
from tornado import httpclient
from tornado.options import define, options
from tornado.escape import json_encode

import database
from mmseg import seg_txt

import redis
import json
import random
import re
import time
from jsonphandler import JSONPHandler
from BeautifulSoup import BeautifulSoup 
from datetime import timedelta, date


def sha1(src):
    import hashlib
    mySha1 = hashlib.sha1()
    mySha1.update(src)
    mySha1_Digest = mySha1.hexdigest()
    return mySha1_Digest


class BackupVideoHandler(tornado.web.RequestHandler):
    def post(self):
        id = self.request.body
        c = redis.Redis(host='192.168.0.32', port=6379, db=4)
        d = redis.Redis(host='192.168.0.32', port=6379, db=3)
        nows = time.strftime("%Y%m%d%H", time.localtime())
        yes = date.today()-timedelta(days=1)
        now = yes.strftime("%Y%m%d")
        arg = self.request.arguments

        flag = c.exists("id:%s"%id)
        if flag:
            down = c.hget("id:%s"%id,"down")
            i = []
            down = eval(down)
            for _down in down.values():
                i.append(_down)
            #with open("/home/work/sohu/log/fail_down","a") as f:
            #    f.write("%s %s %s\n"%(nows,id,arg))
            data = "%s##%s##failed"%(id,arg['version'][0])
            with open("/home/work/video/log/data","a") as f:
                f.write("%s\n"%data)

            self.finish(json.dumps(i))
            return
        elif d.exists("id:%s"%id):
            data = d.hgetall("id:%s"%id)
            item = data.values()[0]
            item = json.loads(item)
            i = item['down']
            self.finish(json.dumps(i))
            return
        else:
            raise tornado.web.HTTPError(404)
            self.finish()
            return


class ImgHandler(tornado.web.RequestHandler):
    def get(self,id):
        c = redis.Redis(host='192.168.0.32', port=6379, db=4)
        d = redis.Redis(host='192.168.0.32', port=6379, db=3)
        e = redis.Redis(host='192.168.0.32', port=6379, db=5)
        if id.startswith("singer") or id.startswith("show"):
            img = e.hget("id:%s"%id,"img")
            self.redirect(img, permanent=True)
            return
        elif c.exists("id:%s"%id):
            img = c.hget("id:%s"%id,"img")
            self.redirect(img, permanent=True)
            return
        elif d.exists("id:%s"%id):
            data = d.hgetall("id:%s"%id)
            item = json.loads(data.values()[0])
            img = item['img']
            self.redirect(img, permanent=True)
            return
        else:
            raise tornado.web.HTTPError(404)
            self.finish()
            return
        

class SeturlHandler(tornado.web.RequestHandler):
    def post(self,id):
        c = redis.Redis(host='192.168.0.32', port=6379, db=4)
        flag = c.exists("id:%s"%id)
        if flag:
            if id.startswith('T'):
                raise tornado.web.HTTPError(404)
                self.finish()
                return
            else:
                #c.hset("id:%s"%id,url,json.dumps(item))
                downurl = self.get_argument("downurl")
                size = self.get_argument("size", None)
                #self.write(downurl)
                down = c.hget("id:%s"%id,"down")
                down = eval(down)
                down['wandoujia'] = downurl
                c.hset("id:%s"%id,"down",json.dumps(down))
                if size:
                    c.hset("id:%s"%id,"size",int(size))
                self.finish("ok")
                return
   
        else:
            raise tornado.web.HTTPError(404)
            self.finish()
            return


class GeturlHandler(tornado.web.RequestHandler):
    def get(self,id):
        c = redis.Redis(host='192.168.0.32', port=6379, db=4)
        d = redis.Redis(host='192.168.0.32', port=6379, db=3)
        e = redis.Redis(host='192.168.0.32', port=6379, db=5)

        if id.startswith("show"):
            down = e.hget("id:%s"%id,"down")
            down = eval(down)
            if down.has_key("wandoujia"):
                downurl = down['wandoujia']
            else:
                downurl = down.values()[0]
            self.redirect(downurl, permanent=True)
            return
        elif c.exists("id:%s"%id):
            if id.startswith('T'):
                raise tornado.web.HTTPError(404)
                self.finish()
                return
            else:
                down = c.hget("id:%s"%id,"down")
                down = eval(down)
                if down.has_key("wandoujia"):
                    downurl = down['wandoujia']
                else:
                    downurl = down.values()[0]
                if "itc.cn" in downurl:
                    downurl = downurl.split("&name")[0]
                self.redirect(downurl, permanent=True)
                return
        elif d.exists("id:%s"%id):
            data = d.hgetall("id:%s"%id)
            item = json.loads(data.values()[0])
            if item['type'] == 'tv':
                raise tornado.web.HTTPError(404)
                self.finish()
                return
            else:
                downurl = item['down'][0]
                self.redirect(downurl, permanent=True)
                return
   
        else:
            raise tornado.web.HTTPError(404)
            self.finish()
            return


class VideoDownHandler(tornado.web.RequestHandler):
    def get(self,id):
        c = redis.Redis(host='192.168.0.32', port=6379, db=4)

        if c.exists("id:%s"%id):
        #if c.sismember("list:display",id) and c.exists("id:%s"%id):
            item = c.hgetall("id:%s"%id)
            if item.has_key("urls"):
                item['urls'] = eval(item['urls'])
            if id.startswith('T'):
                #item['show'] = eval(item['show'])
                item['show'] = json.loads(item['show'])
                item['director'] = eval(item['director'])
                item['actor'] = eval(item['actor'])
                item['cate'] = eval(item['cate'])
            elif id.startswith("M"):
                item['director'] = eval(item['director'])
                item['actor'] = eval(item['actor'])
                item['cate'] = eval(item['cate'])
                item['down'] = eval(item['down'])
            else:
                item['down'] = eval(item['down'])


            self.finish(json.dumps(item))
            return
        else:
            raise tornado.web.HTTPError(404)
            self.finish()
            return
       
        
class DetailHandler(JSONPHandler):
    def get(self,id):
        c = redis.Redis(host='192.168.0.32', port=6379, db=4)

        flag = c.exists("id:%s"%id)
        if flag:
            item = c.hgetall("id:%s"%id)
            id = item['id']
            if "sohu" in item['url']:
                item['from'] = u'搜狐视频'
            elif "letv" in item['url']:
                item['from'] = u'乐视'
            #del item['url']
            if id.startswith('M') or id.startswith("T"):
                item['director'] = eval(item['director'])
                item['actor'] = eval(item['actor'])
                item['cate'] = eval(item['cate'])
            #del item['img']

            if item.has_key("down"):
                del item['down']
            if id.startswith('T'):
                show = []
                shows = json.loads(item['show'])
                for i in shows:
                    #i = json.loads(i)
                    del i['url']
                    if i.has_key("urls"):
                        del i['urls']
                    del i['down']
                    try:
                        if u"季第" in i['title']:
                            titlenum = re.findall(ur"季第(.+?)集$", i['title'])
                            i['title'] = u"第"+titlenum[0]+u"集"
                        elif u"集" in i['title']:
                            titlenum = re.findall(ur"第(.+?)集$", i['title'])
                            i['title'] = u"第"+titlenum[0]+u"集"
                        else:
                            i['title'] = i['title'].replace(item['title'].decode("utf-8"), "")
                            titlenum = re.findall(ur"(\d+)", i['title'])
                            i['title'] = u"第"+str(titlenum[0]).lstrip(u"0")+u"集"
                    except:
                        i['title'] = i['title'].replace(item['title'].decode("utf-8"), "")

                    show.append(i)
                item['show'] = show


            self.finish(json.dumps(item))
            return
        else:
            raise tornado.web.HTTPError(404)
            self.finish()
            return


def getlist(page,size,setname,flag):
    c = redis.Redis(host='192.168.0.32', port=6379, db=4)
    m = (int(page) - 1) * int(size)
    n = int(page) * int(size)
    length = c.zcard(setname)
    nexts = length - n
    if n > length:
        n = length - 1
        if m > length:
            m = n - int(size) +1
        nexts = 0
    else:   
        n = n -1
    if m < 0:
        m = 0

    ids = c.zrange(setname,m,n,desc=flag)
    items = []
    for id in ids:
        if not c.exists("id:%s"%id):
            continue
        if not c.sismember("list:display",id):
            continue
        item = c.hgetall("id:%s"%id)
        item['director'] = eval(item['director'])
        item['actor'] = eval(item['actor'])
        item['cate'] = eval(item['cate'])
        if item.has_key("urls"):
            del item['urls']
        del item['url']
        del item['img']
        if item['id'].startswith("M"):
            del item['down']
        else:
            del item['show']
            item['time'] = item['time'].replace("集更新", "集|更新至")
        items.append(item)
    data = {}
    data['total'] = len(items)
    data['next']  = nexts
    data['items'] = items
    return data 


class SHandler(JSONPHandler):
    def get(self):
        c = redis.Redis(host='192.168.0.32', port=6379, db=4)
        page = self.get_argument("page")
        size = self.get_argument("size")
        word = self.get_argument("word", None)
        self.word = word

        items = []
        if word == "" or word == None:
            data = {}
            data['total'] = 0
            data['next']  = 0
            data['items'] = []
            self.finish(json.dumps(data))
            return

        word = word.encode("utf-8")
        words = []
        indexs = []
        for i in seg_txt(word):
            if c.exists("indexs:"+i):
                words.append(i)
                _i = "indexs:"+i
                indexs.append(_i)
        new = "".join(words)
        if len(indexs) ==1:
            ids = c.smembers(indexs[0])
        elif len(indexs) == 0:
            data = {}
            data['total'] = 0
            data['next']  = 0
            data['items'] = []
            self.finish(json.dumps(data))
            return
        else:
            c.sinterstore("indexs:%s"%new, *indexs)
            ids = c.smembers("indexs:%s"%new)
        for id in ids:
            if not c.exists(id):
                continue
            if not c.sismember("list:display",id.replace("id:","")):
                continue
            _item = c.hgetall(id)

            if _item.has_key("director"):
                _item['director'] = eval(_item['director'])
            if _item.has_key("actor"):
                _item['actor'] = eval(_item['actor'])
            if _item.has_key("cate"):
                _item['cate'] = eval(_item['cate'])
            if _item.has_key("urls"):
                del _item['urls']
            del _item['info']
            #del _item['cate']
            if _item.has_key("url"):
                del _item['url']
            if _item.has_key("img"):
                del _item['img']
            if _item['id'].startswith('M'):
                del _item['down']
            else:
                del _item['show']
                _item['time'] = _item['time'].replace("集更新", "集|更新至")
            items.append(_item)

        long = len(items)
        m = (int(page) - 1) * int(size)
        n = int(page) * int(size)
        hot = len(items)
        nexts = 0
        if m < hot < n:
            items = items[m:hot]
            nexts = 0
        elif n <= hot:
            items = items[m:n-1]
            nexts = hot -n
        elif m > hot:
            n = hot
            m = n - (int(size)) + 1
            if m < 0:
                m = 0
            items = items[m:n-1]
            nexts = 0
        data = {}
        data['total'] = len(items)
        data['next']  = nexts
        data['items'] = items
        self.finish(json.dumps(data))
        return



class SearchHandler(JSONPHandler):
    def get(self):
        c = redis.Redis(host='192.168.0.32', port=6379, db=4)
        page = self.get_argument("page")
        size = self.get_argument("size")
        word = self.get_argument("word", None)
        self.word = word

        cate = self.get_argument("cate", None)
        if cate:
            flag = True
            setname = "cate:%s"%cate
            data = getlist(page,size,setname,flag)
            self.finish(json.dumps(data))
            return

        items = []
        if word == "" or word == None:
            data = {}
            data['total'] = 0
            data['next']  = 0
            data['items'] = []
            self.finish(json.dumps(data))
            return

        word =word.encode("utf-8")

        words = []
        indexs = []
        for i in seg_txt(word):
            if c.exists("indexs:"+i):
                words.append(i)
                _i = "indexs:"+i
                indexs.append(_i)
                

        new = "".join(words)
        if len(indexs) ==1:
            #c.sinterstore("indexs:%s"%new, indexs[0])
            #c.zunionstore("indexss:%s"%new, indexs[0])
            ids = c.smembers(indexs[0])
        elif len(indexs) == 0:
            data = {}
            data['total'] = 0
            data['next']  = 0
            data['items'] = []
            self.finish(json.dumps(data))
            return
        else:
            c.sinterstore("indexs:%s"%new, *indexs)
            #c.zunionstore("indexss:%s"%new, *indexs)
            ids = c.smembers("indexs:%s"%new)
        #ids = c.zrange("indexss:%s"%new,0,-1)
        for id in ids:
            if not c.exists(id):
                continue
            if not c.sismember("list:display",id.replace("id:","")):
                continue
            _item = c.hgetall(id)

            if _item.has_key("director"):
                _item['director'] = eval(_item['director'])
            if _item.has_key("actor"):
                _item['actor'] = eval(_item['actor'])
            if _item.has_key("cate"):
                _item['cate'] = eval(_item['cate'])
            if _item.has_key("urls"):
                del _item['urls']
            #del _item['info']
            #del _item['cate']
            if _item.has_key("url"):
                del _item['url']
            #del _item['year']
            if _item.has_key("img"):
                del _item['img']
            if _item['id'].startswith('M'):
                del _item['down']
            else:
                del _item['show']
                _item['time'] = _item['time'].replace("集更新", "集|更新至")
            items.append(_item)

        long = len(items)
        m = (int(page) - 1) * int(size)
        n = int(page) * int(size)
        hot = len(items)
        nexts = 0
        if m < hot < n:
            items = items[m:hot]
            nexts = 0
        elif n <= hot:
            items = items[m:n-1]
            nexts = hot -n
        elif m > hot:
            n = hot
            m = n - (int(size)) + 1
            if m < 0:
                m = 0
            items = items[m:n-1]
            nexts = 0

        data = {}
        data['total'] = len(items)
        data['next']  = nexts
        data['items'] = items
        self.finish(json.dumps(data))
        return


class TvnewHandler(JSONPHandler):
    def get(self):
        page = self.get_argument("page")
        size = self.get_argument("size")
        c = redis.Redis(host='192.168.0.32', port=6379, db=4)
        now = time.strftime("%Y%m%d", time.localtime())

        m = (int(page) - 1) * int(size)
        n = int(page) * int(size)
        list = c.zcard("new:tv")
        nexts = list -n

        items = []
        if n <= list:
            x1 = m 
            x2 = n -1
            _items = c.zrange("new:tv",x1,x2)
            for i in _items:
                id = i
                if not c.exists("id:%s"%id):
                    continue
                if not c.sismember("list:display",id):
                    continue
                _item = c.hgetall("id:%s"%id)
                _item['director'] = eval(_item['director'])
                _item['actor'] = eval(_item['actor'])
                _item['cate'] = eval(_item['cate'])
                del _item['info']
                if _item.has_key("urls"):
                    del _item['urls']
                del _item['cate']
                del _item['url']
                #del _item['type']
                del _item['year']
                del _item['img']
                del _item['show']
                _item['time'] = _item['time'].replace("集更新", "集|更新至")
                if "|" in _item['time']:
                    _item['time'] = _item['time'].split("|")[1]
                #except:
                #    continue
                items.append(_item)

        elif n > list:
            x2  = list - 1
            if m > list:
                x1 = x2 -int(size) +1
            if x1 <0:
                x1 = 0
            nexts = 0
            _items = c.zrange("new:tv",x1,x2)
            for i in _items:
                id = i

                if not c.exists("id:%s"%id):
                    continue
                if not c.sismember("list:display",id):
                    continue
                _item = c.hgetall("id:%s"%id)
                if _item.has_key("img"):
                    _item['director'] = eval(_item['director'])
                    _item['actor'] = eval(_item['actor'])
                    _item['cate'] = eval(_item['cate'])
                    if _item.has_key("urls"):
                        del _item['urls']
                    del _item['info']
                    del _item['cate']
                    del _item['url']
                    del _item['show']
                    #del _item['type']
                    del _item['year']
                    del _item['img']
                    items.append(_item)

        data = {}
        data['total'] = len(items)
        data['next']  = nexts
        data['items'] = items
        self.finish(json.dumps(data))
        return



class TvhotHandler(JSONPHandler):
    def get(self):
        page = self.get_argument("page")
        size = self.get_argument("size")
        c = redis.Redis(host='192.168.0.32', port=6379, db=4)
        now = time.strftime("%Y%m%d", time.localtime())

        m = (int(page) - 1) * int(size)
        n = int(page) * int(size)
        list = c.zcard("week:tv")
        nexts = list -n

        items = []
        if n <= list:
            x1 = m 
            x2 = n -1
            _items = c.zrange("week:tv",x1,x2,desc=False)
            for i in _items:
                id = i
                if not c.exists("id:%s"%id):
                    continue
                if not c.sismember("list:display",id):
                    continue
                _item = c.hgetall("id:%s"%id)
                _item['director'] = eval(_item['director'])
                _item['actor'] = eval(_item['actor'])
                _item['cate'] = eval(_item['cate'])
                del _item['info']
                if _item.has_key("urls"):
                    del _item['urls']
                del _item['cate']
                del _item['url']
                #del _item['type']
                del _item['year']
                del _item['img']
                del _item['show']
                _item['time'] = _item['time'].replace("集更新", "集|更新至")
                if "|" in _item['time']:
                    _item['time'] = _item['time'].split("|")[1]
                #except:
                #    continue
                items.append(_item)

        elif n > list:
            x2  = list - 1
            if m > list:
                x1 = x2 -int(size) +1
            if x1 < 0:
                x1 = 0
            nexts = 0
            _items = c.zrange("week:tv",x1,x2,desc=False)
            for i in _items:
                id = i

                if not c.exists("id:%s"%id):
                    continue
                if not c.sismember("list:display",id):
                    continue
                _item = c.hgetall("id:%s"%id)
                if _item.has_key("img"):
                    _item['director'] = eval(_item['director'])
                    _item['actor'] = eval(_item['actor'])
                    _item['cate'] = eval(_item['cate'])
                    if _item.has_key("urls"):
                        del _item['urls']
                    del _item['info']
                    del _item['cate']
                    del _item['url']
                    del _item['show']
                    #del _item['type']
                    del _item['year']
                    del _item['img']
                    items.append(_item)

        data = {}
        data['total'] = len(items)
        data['next']  = nexts
        data['items'] = items
        self.finish(json.dumps(data))
        return


class MvnewHandler(JSONPHandler):
    def get(self):
        page = self.get_argument("page")
        self.page = page
        size = self.get_argument("size")
        self.size = size
        c = redis.Redis(host='192.168.0.32', port=6379, db=4)
        now = time.strftime("%Y%m%d", time.localtime())

        m = (int(page) - 1) * int(size)
        n = int(page) * int(size)
        list = c.zcard("new:movie")
        nexts = list -n
        
        items = []
        if n <= list:
            x1 = m 
            x2 = n -1
            _items = c.zrange("new:movie",x1,x2)
            for i in _items:
                id = i
                if not c.exists("id:%s"%id):
                    continue
                if not c.sismember("list:display",id):
                    continue
                _item = c.hgetall("id:%s"%id)
                #_item = _item.values()[0]
                #_item = json.loads(_item)
                _item['director'] = eval(_item['director'])
                _item['actor'] = eval(_item['actor'])
                #_item['cate'] = eval(_item['cate'])
                if _item.has_key("urls"):
                    del _item['urls']
                del _item['info']
                del _item['cate']
                del _item['url']
                del _item['down']
                del _item['type']
                del _item['year']
                del _item['area']
                del _item['img']
                items.append(_item)


        elif n > list:
            x2  = list - 1
            if m > list:
                x1 = x2 -int(size) +1
            if x1 < 0:
                x1 = 0
            nexts = 0
            items = []
            _items = c.zrange("new:movie",x1,x2)
            for i in _items:
                id = i
                if not c.exists("id:%s"%id):
                    continue
                if not c.sismember("list:display",id):
                    continue
                _item = c.hgetall("id:%s"%id)
                if _item.has_key("urls"):
                    del _item['urls']
                del _item['info']
                del _item['cate']
                del _item['url']
                del _item['down']
                del _item['type']
                del _item['year']
                del _item['area']
                del _item['img']
                _item['director'] = eval(_item['director'])
                _item['actor'] = eval(_item['actor'])
                _item['cate'] = eval(_item['cate'])
                items.append(_item)


        data = {}
        data['total'] = len(items)
        data['next']  = nexts
        data['items'] = items
        self.finish(json_encode(data))
        return


class MvhotHandler(JSONPHandler):
    def get(self):
        page = self.get_argument("page")
        self.page = page
        size = self.get_argument("size")
        self.size = size
        c = redis.Redis(host='192.168.0.32', port=6379, db=4)
        now = time.strftime("%Y%m%d", time.localtime())

        m = (int(page) - 1) * int(size)
        n = int(page) * int(size)
        list = c.zcard("week:movie")
        nexts = list -n
        
        items = []
        if n <= list:
            x1 = m 
            x2 = n -1
            _items = c.zrange("week:movie",x1,x2)
            for i in _items:
                id = i
                if not c.exists("id:%s"%id):
                    continue
                if not c.sismember("list:display",id):
                    continue
                _item = c.hgetall("id:%s"%id)
                #_item = _item.values()[0]
                #_item = json.loads(_item)
                _item['director'] = eval(_item['director'])
                _item['actor'] = eval(_item['actor'])
                #_item['cate'] = eval(_item['cate'])
                if _item.has_key("urls"):
                    del _item['urls']
                del _item['info']
                del _item['cate']
                del _item['url']
                del _item['down']
                del _item['type']
                del _item['year']
                del _item['area']
                del _item['img']
                items.append(_item)


        elif n > list:
            x2  = list - 1
            if m > list:
                x1 = x2 -int(size) +1
            if x1 < 0:
                x1 = 0
            nexts = 0
            items = []
            _items = c.zrange("week:movie",x1,x2)
            for i in _items:
                id = i
                if not c.exists("id:%s"%id):
                    continue
                if not c.sismember("list:display",id):
                    continue
                _item = c.hgetall("id:%s"%id)
                if _item.has_key("urls"):
                    del _item['urls']
                del _item['info']
                del _item['cate']
                del _item['url']
                del _item['down']
                del _item['type']
                del _item['year']
                del _item['area']
                del _item['img']
                _item['director'] = eval(_item['director'])
                _item['actor'] = eval(_item['actor'])
                _item['cate'] = eval(_item['cate'])
                items.append(_item)


        data = {}
        data['total'] = len(items)
        data['next']  = nexts
        data['items'] = items
        self.finish(json_encode(data))
        return


class CateHandler(JSONPHandler):
    def get(self):
        m_cate = [
                    { "title":"传记片", "id":"m_zhuanji"},
                    { "title":"伦理片", "id":"m_lunli"},
                    { "title":"剧情片", "id":"m_juqing"},
                    { "title":"动作片", "id":"m_dongzuo"},
                    { "title":"动画片", "id":"m_donghua"},
                    { "title":"历史片", "id":"m_lishi"},
                    { "title":"喜剧片", "id":"m_xiju"},
                    { "title":"恐怖片", "id":"m_kongbu"},
                    { "title":"悬疑片", "id":"m_xuanyi"},
                    { "title":"惊悚片", "id":"m_jingsong"},
                    { "title":"战争片", "id":"m_zhanzheng"},
                    { "title":"歌舞片", "id":"m_gewu"},
                    { "title":"武侠片", "id":"m_wuxia"},
                    { "title":"灾难片", "id":"m_zainan"},
                    { "title":"爱情片", "id":"m_aiqing"},
                    { "title":"短片",   "id":"m_duan"},
                    { "title":"科幻片", "id":"m_kehuan"},
                    { "title":"纪录片", "id":"m_jilu"},
                    { "title":"警匪片", "id":"m_jingfei"},
                    { "title":"风月片", "id":"m_fengyue"},
                    { "title":"魔幻片", "id":"m_mohuan"},
                    { "title":"青春片", "id":"m_qingchun"},
                    { "title":"文艺片", "id":"m_wenyi"},
                    { "title":"谍战片", "id":"m_diezhan"}
                ]
        t_cate = [
                    { "title":"伦理剧", "id":"t_lunli"},
                    { "title":"偶像剧", "id":"t_ouxiang"},
                    { "title":"军旅剧", "id":"t_junlv"},
                    { "title":"刑侦剧", "id":"t_xingzhen"},
                    { "title":"剧情片", "id":"t_juqing"},
                    { "title":"动作剧", "id":"t_dongzuo"},
                    { "title":"历史剧", "id":"t_lishi"},
                    { "title":"古装剧", "id":"t_guzhuang"},
                    { "title":"喜剧片", "id":"t_xiju"},
                    { "title":"家庭剧", "id":"t_jiating"},
                    { "title":"悬疑剧", "id":"t_xuanyi"},
                    { "title":"情景剧", "id":"t_qingjing"},
                    { "title":"战争剧", "id":"t_zhanzheng"},
                    { "title":"武侠剧", "id":"t_wuxia"},
                    { "title":"科幻剧", "id":"t_kehuan"},
                    { "title":"谍战剧", "id":"t_diezhan"},
                    { "title":"都市剧", "id":"t_dushi"},
                    { "title":"神话剧", "id":"t_shenhua"},
                    { "title":"言情剧", "id":"t_yanqing"},
                    { "title":"年代剧", "id":"t_niandai"},
                    { "title":"农村剧", "id":"t_nongcun"},
                    { "title":"惊悚剧", "id":"t_jingsong"},
                    { "title":"传记剧", "id":"t_zhuanji"},
                    { "title":"灾难剧", "id":"t_zainan"},
                    { "title":"犯罪剧", "id":"t_fanzui"},
                    { "title":"生活剧", "id":"t_shenghuo"},
                    { "title":"经典剧", "id":"t_jingdian"}
                 ]
        cate = {}
        cate['movie'] = m_cate
        cate['tv'] = t_cate
        self.finish(json.dumps(cate))
        return


class WordHandler(JSONPHandler):
    def get(self):
        c = redis.Redis(host='192.168.0.32', port=6379, db=4)
        now = time.strftime("%Y%m%d", time.localtime())
        size = self.get_argument("size")
        if c.exists("word:%s"%now):
            titles = c.smembers("word:%s"%now)
        else:
            db = database.MysqlHander()
            title = db.getword()
            for ti in title:
                key = sha1(ti.encode("utf-8"))[:7]
                for i in c.keys("id:M%s*"%key):
                    if not c.sismember("list:display",i.replace("id:","")):
                        continue
                    if c.exists(i):
                        c.sadd("word:%s"%now,ti)
                for i in c.keys("id:T%s*"%key):
                    if not c.sismember("list:display",i.replace("id:","")):
                        continue
                    if c.exists(i):
                        c.sadd("word:%s"%now,ti)
            titles = c.smembers("word:%s"%now)
        titles = list(titles)
        random.shuffle(titles)
        titles = titles[:int(size)]
        return self.finish(json.dumps(titles))


class UrlHandler(tornado.web.RequestHandler):
    def get(self,id):
        c = redis.Redis(host='192.168.0.32', port=6379, db=4)
        flag = c.exists("id:%s"%id)
        if flag:
            url = c.hget("id:%s"%id,"url")
            if id.startswith("T"):
                if "tv.sohu.com" in url:
                    show = c.hget("id:%s"%id,"show")
                    show = eval(show)
                    url = show[0]['url']
                    self.redirect(url, permanent=True)
            else:
                self.redirect(url, permanent=True)
            return
        else:
            raise tornado.web.HTTPError(404)
            self.finish()
            return


class CheckHandler(tornado.web.RequestHandler):
    def get(self):
	self.finish("ok")
	return
	

class MiniHandler(tornado.web.RequestHandler):
    def get(self):
        c = redis.Redis(host='192.168.0.32', port=6379, db=4)

        newtv = []
        _items = c.zrange("new:tv",0,7,desc=False)
        for i in _items:
            id = i
            if not c.exists("id:%s"%id):
                continue
            if not c.sismember("list:display",id):
                continue
            _item = {}
            _item['id'] = id
            _item['title'] = c.hget("id:%s"%id,"title")
            _item['time'] = c.hget("id:%s"%id,"time")
            _item['time'] = _item['time'].replace("集更新", "集|更新至")
            if "更新" in _item['time']:
                _item['time'] = "更"+ _item['time'].split("更")[1]
            newtv.append(_item)

        toptv = []
        _items = c.zrange("week:tv",0,9,desc=False)
        x = 0
        for i in _items:
            id = i
            if not c.exists("id:%s"%id):
                continue
            if not c.sismember("list:display",id):
                continue
            _item = {}
            if x == 0:
                _item['info'] = c.hget("id:%s"%id,"info")
            x += 1
            _item['id'] = id
            _item['title'] = c.hget("id:%s"%id,"title")
            _item['score'] = c.hget("id:%s"%id,"score")
            toptv.append(_item)

        newmovie = []
        _items = c.zrange("new:movie",0,7,desc=False)
        for i in _items:
            id = i
            if not c.exists("id:%s"%id):
                continue
            if not c.sismember("list:display",id):
                continue
            _item = {}
            _item['id'] = id
            _item['title'] = c.hget("id:%s"%id,"title")
            _item['time'] = c.hget("id:%s"%id,"time")
            _item['time'] = _item['time'].replace("集更新", "集|更新至")
            if "更新" in _item['time']:
                _item['time'] = "更"+ _item['time'].split("更")[1]
            newmovie.append(_item)

        topmovie = []
        _items = c.zrange("week:movie",0,9,desc=False)
        x = 0
        for i in _items:
            id = i
            if not c.exists("id:%s"%id):
                continue
            if not c.sismember("list:display",id):
                continue
            _item = {}
            if x == 0:
                _item['info'] = c.hget("id:%s"%id,"info")
            x += 1
            _item['id'] = id
            _item['title'] = c.hget("id:%s"%id,"title")
            _item['score'] = c.hget("id:%s"%id,"score")
            topmovie.append(_item)


        self.render("index.html",newtv=newtv,toptv=toptv,topmovie=topmovie,newmovie=newmovie)


def main():
    define("port", default=9990, help="run on the given port", type=int)
    settings = {"debug": False, "template_path": "templates",
           "cookie_secret": "z1DAVh+WTvyqpWGmOtJCQLETQYUznEuYskSF062J0To="}
    tornado.options.parse_command_line()
    application = tornado.web.Application([
        (r"/api/detail/(.*)",       DetailHandler),
        (r"/api/url/(.*)",          UrlHandler),
        (r"/api/downdetail/(.*)",   VideoDownHandler),
        (r"/api/down",              BackupVideoHandler),
        (r"/api/down/(.*)",         GeturlHandler),
        (r"/api/set/(.*)",          SeturlHandler),
        (r"/api/s",                 SearchHandler),
        (r"/api/ss",                SHandler),
        (r"/api/movie/hot",         MvhotHandler),
        (r"/api/movie/new",         MvnewHandler),
        (r"/api/tv/new",            TvnewHandler),
        (r"/api/tv/hot",            TvhotHandler),
        (r"/api/cate",              CateHandler),
        (r"/api/img/(.*)",          ImgHandler),
        (r"/api/hot/word",          WordHandler),
        (r"/api/mini",              MiniHandler),
        (r"/api/proxycheck",        CheckHandler),
    ], **settings)
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()
if __name__ == "__main__":
    main()
