
const 
	OTS_NONE = -1,
	OTS_WAITING = 0,
	OTS_SYNCED = 1,
	OTS_EXECUTING = 2,
	OTS_FINISH_SUCCESS = 3,
	OTS_FINISH_FAILED = 4;

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-15790641-32']);
_gaq.push(['_trackPageview']);

(function(window, document, undefined){

    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);

	function gLog(category, action, opt_label, opt_value){
		if(_gaq){
			_gaq.push(['_trackEvent', action, opt_label, opt_value]);
		}
	}
	//cut string;
	String.prototype.sub = function(len, ext, nohtml){
		if(ext==null)ext = '';
		var l = this.length, s;
		if(l>Math.abs(len)){
			if(len>0){
				s = this.substring(0, len-ext.length)+ext;
			}else{
				var pre = Math.floor((Math.abs(len)-ext.length)/2);
				s = this.substr(0, pre)+ext+this.substr(l-pre, l);
			}
		}else{
			s = this.substr(0);
		}
		return s;
	}
	//运行后允许滚动中输入
	function allowFormsInIscroll(){
		[].slice.call(document.querySelectorAll('input, select, button')).forEach(function(el){
			el.addEventListener(('ontouchstart' in window)?'touchstart':'mousedown', function(e){
				console.log('Preventing event from bubbling up to iScroll, as it would then remove it.');
				e.stopPropagation();
			})
		});
	}
	//loading obj
	var UI = new Object();
	UI.loading = {
		init : false,
		show : function(text){
			if(!UI.loading.init){
				UI.loading.init = true;
				var maskDiv = document.createElement("div");
				maskDiv.id = "ui_mask";
				maskDiv.className = "ui-loader";
				maskDiv.innerHTML = "<span class='ui-icon ui-icon-loading'></span><h1>Loading Content</h1>";
				maskDiv.style.zIndex = 20000;
				maskDiv.style.display = "none";
				document.body.appendChild(maskDiv);
			}
			$('#ui_mask>h1').text(text);
			$("#ui_mask").show();
			return UI;
		},
		hide : function(){
			$("#ui_mask").hide();
			return UI;
		}
	};

	UI.loading.show('努力加载中...');

	UI.showContent = function(id){
		id = id.toLowerCase();
		$('#wrapper > *').each(function(){
			if($(this).attr('id').toLowerCase() == id){
				$(this).show();
			}else{
				$(this).hide();
			}
		});
		allowFormsInIscroll();
	}

	UI.toggleList = function(id){
		$('#wrapper').css('bottom', '0px');
		$('#navbar').hide();
		if(id == 'search'){
			$('#wrapper').css('top', '0px');
			$('#header').hide();
		}else{
			$('#wrapper').css('top', '40px');
			$('#header').show();
		}
		UI.showContent(id);
		return UI;
	}

	UI.toggleDetail = function(id){
		$('#wrapper').css('bottom', '42px');
		$('#wrapper').css('top', '0px');
		$('#navbar').show();
		$('#header').hide();
		UI.showContent(id);
		return UI;
	}
	
	UI.refreshScroller = function(type, pullUpCalback){
		UI.scroller = UI.scroller || [];
		if(!UI.scroller[type]){
			UI.scroller[type] = scrollObj(type, pullUpCalback);
			/*
			UI.scroller[type].options.onBeforeScrollStart = function(e) {                
		        var target = e.target;

		        while (target.nodeType != 1) target = target.parentNode;
		        if (target.tagName != 'SELECT' && target.tagName != 'INPUT' && target.tagName != 'TEXTAREA'){
		            e.preventDefault();
		        }
		   }
		   */
		}
		UI.scroller[type].refresh();
	}
	
	function scrollObj(objId, pullUpCalback){
		var outScroll, pullUpEl, pullHeight, hiddenTimer;
		function pullEle(){
			var e = $('#'+objId+' .pullUp').get(0);
			if(e){
				pullHeight = e.offsetHeight;
				return e;
			}else{
				return null;
			}
		}
		return new iScroll(objId, {
			useTransition: false,
			//useTransform: false,
			//topOffset: pullDownOffset,
			onRefresh: function () {
				pullUpEl = pullEle();
				if(!pullUpEl) return;
				var className = pullUpEl.className;
				if(className.search('nomore')>-1) return;
				if (pullUpEl.className.search('loading')>-1) {
					pullUpEl.className = 'pullUp';
					pullUpEl.querySelector('.pullUpLabel').innerHTML = '下拉加载更多...';
				}
				//pullUpOffset = pullUpEl.offsetHeight;
			},
			onScrollMove: function () {
				pullUpEl = pullEle();
				if(!pullUpEl) return;
				var className = pullUpEl.className;
				if(className.search('nomore')>-1) return;
				if (this.y < (this.maxScrollY - 5) && className.search('flip')==-1) {
					pullUpEl.className = 'pullUp flip';
					pullUpEl.querySelector('.pullUpLabel').innerHTML = '松开加载下一页...';
				} else if (this.y > (this.maxScrollY + 5) && className.search('flip')>-1) {
					pullUpEl.className = 'pullUp';
					pullUpEl.querySelector('.pullUpLabel').innerHTML = '下拉加载更多...';
				}
			},
			onBeforeScrollEnd : function(){
				clearTimeout(hiddenTimer);
				hiddenTimer = setTimeout(function(){
					$('#'+objId+' .scrollBar').hide();
				}, 1000);
			},
			/*
			onBeforeScrollStart:function(e){
				var target = e.target;
				while (target.nodeType != 1) target = target.parentNode;

				if (target.tagName != 'SELECT' && target.tagName != 'INPUT' && target.tagName != 'TEXTAREA'){
					e.preventDefault();
				}
			},
			*/
			onScrollStart:function(e){
				$('#'+objId+' .scrollBar').show();
				clearTimeout(hiddenTimer);
			},

			onScrollEnd: function () {
				pullUpEl = pullEle();
				if(!pullUpEl)return;
				var className = pullUpEl.className;
				if(className.search('nomore')>-1)return;
				if (className.search('flip')>-1) {
					pullUpEl.className = 'pullUp loading';
					pullUpEl.querySelector('.pullUpLabel').innerHTML = '加载中...';
					pullUpCalback();
				}
			}
		});
	}
	
	
	//defined external call
	if(typeof window.videoTaskPlugin == 'undefined'){
		window.videoTaskPlugin = {
			addTask : function(id, title, icon, url){
				console.log('addTask'+id);
				window.notifyDataChanged();
			},
			addTaskGroup : function(contents){
				
			},
			removeTask : function(id){
				//console.log('removeTask'+id);
				window.notifyDataChanged();
				return true;
			},
			removeTaskGroup : function(ids){
				//console.log('removeTask'+id);
				window.notifyDataChanged();
				return true;
			},
			getStatus : function(id){
				//console.log('getStatus:'+id);
				return OTS_NONE;
			},
			play : function(id){
				//console.log('getStatus:'+id);
			},
			openDetail : function(id, title, icon){
			},
			openList : function(){
			},
			openSearch : function(){
			},
			logToMuce : function(name, value){

			},
			getInfo : function(){

			},
			log : function(msg){
				//console.log(msg);
			}
		}
	}
	var 
		videoTaskPlugin = window.videoTaskPlugin,
		currentShow = '', lastShow = '',
		pageCaches = [], pageScroller = [];
	
	//js callback
	window.goBack = function(){
		if(lastShow.search('detail')>-1)lastShow = 'movie';
		slog('goback:'+lastShow);
		window.loadGroup($('#header>li[data-tab="'+lastShow+'"]').get(0));
	}
	//js callback go search
	window.goSearch = function(key){
		pageCaches['search'] = [];
		gLog('Search', 'SearchKey', key);
		window.searchKey = key;
		window.loadGroup($('#header>li[data-tab="search"]').get(0), 1);
	}
	
	var slog = function(msg){
		return false;
		$('#debug').append(msg+'<br>');
	}
	
	//status callback
	window.notifyDataChanged = function(){
		//slog(currentShow);
		//videoTaskPlugin.log('get notify');
		switch(currentShow){
			case 'movie':
				$('.downbtn').each(function(i, obj){
					var id = $(obj).data('id'),
					status = videoTaskPlugin.getStatus(id);
					//status changed
					if($(obj).data('status') != status){
						window.refershStatus(status, $(obj));
					}
				});
				pageCaches['tv'] = [];
				pageCaches['search'] = [];
			break;
			case 'tv':
				pageCaches['movie'] = [];
				pageCaches['search'] = [];
			break;
			case 'search':
				pageCaches['tv'] = [];
				pageCaches['movie'] = [];

			case 'movie-detail':
				pageCaches['tv'] = [];
				pageCaches['movie'] = [];
				pageCaches['search'] = [];

				$('.navbtn').each(function(){
					var status = videoTaskPlugin.getStatus($(this).data('id'));
					$(this).text(window.statusText(status));
				});
				
			break;
			case 'tv-detail':
				pageCaches['tv'] = [];
				pageCaches['movie'] = [];
				pageCaches['search'] = [];
				var unSelected = 0;
				slog($('.tv-list .tv-task').length);
				$('.tv-list .tv-task').each(function(){
					var id = $(this).data('id'), status = videoTaskPlugin.getStatus(id);
					if(status == OTS_NONE){
						$(this).removeClass('selected');
						unSelected++;
					}else{
						$(this).addClass('selected');
					}
					//slog(id+':'+status+':'+$(this).get(0).className);
				});
				if(unSelected == 0){
					$('.navbtn').text('取消全部下载');
				}else{
					$('.navbtn').text('打包下载全部');
					
				}
			break;
		}
	}
	
	//get status text
	window.statusText = function(status){
		switch(status){
			case OTS_NONE:
			case OTS_FINISH_FAILED:
				return ('零流量下载');
			break;
			case OTS_WAITING:
			case OTS_SYNCED:
			case OTS_EXECUTING:
				return ('取消下载');
			break;
			case OTS_FINISH_SUCCESS:
				return ('播放');
			break;
		}
	}
	
	//refresh btn status
	window.refershStatus = function(status, obj){
		if(typeof obj == 'string')obj = $(obj);
		switch(status){
			case OTS_NONE:
			case OTS_FINISH_FAILED:
				obj.css("backgroundImage", 'url(styles/images/download.png)');
			break;
			case OTS_WAITING:
			case OTS_SYNCED:
			case OTS_EXECUTING:
				obj.text('取消下载');
				obj.css("backgroundImage", 'url(styles/images/cancel.png)');
			break;
			case OTS_FINISH_SUCCESS:
				obj.text('播放');
				obj.css("backgroundImage", 'url(styles/images/open.png)');
			break;
		}
		obj.text(window.statusText(status));
		//cache status
		$(obj).data('status', status);
		return '';
	}
	
	//get content url
	window.downUrl = function(id){
		return 'http://video.wandoujia.com/api/down/'+id+'';
	}

	window.imgUrl = function(id){
		return 'http://video.wandoujia.com/api/img/'+id+'';
	}

	window.groupUrl = function(type, page){
		if(type == 'search'){
			return 'http://video.wandoujia.com/api/s?word='+window.searchKey+'&page='+page+'&size=20&jsonp=?';
		}else{
			return 'http://video.wandoujia.com/api/'+type+'/hot?page='+page+'&size=20&jsonp=?';
		}
		
	}
	
	window.imgError = function(o){
		this.onerror = null;
		this.src = 'styles/images/movie.png';
	}
	
	//run task
	var last_click_time = new Date().getTime(), last_click_element = null;
	window.runTask = function(o, add){

		//fix click twice = iscroll bug
		var click_time = new Date().getTime();
		if (last_click_element == o && (click_time - last_click_time) < 1000) {
			ev.stopImmediatePropagation();
			return false;
		}
		last_click_element = o;
		last_click_time = new Date().getTime();


		var obj = $(o), id = obj.data('id'), status = videoTaskPlugin.getStatus(id);
		if(status == OTS_FINISH_SUCCESS){
			videoTaskPlugin.play(id);
			gLog('TaskPlay', currentShow, id);
		}else if(status == OTS_NONE){
			videoTaskPlugin.addTask(id, (obj.data('tv') ? obj.data('tv') +'-' : '')+obj.data('title'), '', downUrl(id));
			if(obj.data('style')){
				obj.addClass(obj.data('style'));
			}
			gLog('TaskCreate', currentShow, id);
		}else{
			videoTaskPlugin.removeTask(id);
			if(obj.data('style')){
				obj.removeClass(obj.data('style'));
			}
			gLog('TaskRemove', currentShow, id);
		}
		event.cancelBubble = true;
		return false;
	}
	
	//load list
	window.loadGroup = function (o, page, callback){
		var obj = $(".group").find('.current'), that = $(o), type = that.data('tab');
		if(page == null || page < 0) page = 1;
		if(page == 1){
			UI.loading.show('加载中...');
		}
		//get last show
		lastShow = currentShow;
		if(lastShow == ''){
			lastShow = type;
		}
		if(currentShow != type){
			currentShow = type;
			obj.removeClass('current');
			that.addClass('current');
		}
		//open search
		if(type == 'search'){
			videoTaskPlugin.openSearch();
		}else{
			videoTaskPlugin.openList();
		}
		
		//toggle ui to this type
		UI.toggleList(type);

		pageCaches[type] = pageCaches[type] || [];
		if(typeof pageCaches[type][page] == 'undefined'){
			$.ajax({
				type     : 'get',
				url      : window.groupUrl(type, page),
				dataType : 'jsonp',
				success  : function(data){
					if(typeof data.items != 'undefined'){
						data.page = page;
						//callback
						if(callback){
							callback(!data.next);
						}

						var idx = data.items.length;
						while(idx--){
							data.items[idx].downloadStatus = (type == 'movie' ? videoTaskPlugin.getStatus(data.items[idx].id) : OTS_NONE);
							data.items[idx].img = imgUrl(data.items[idx].id);
						}
						pageCaches[type][page] = data;

						if(data.page == 1){
							$('#'+type+' .list').html('');
						}

						$('#'+type+' .list').append($.template("temp_"+type, data));

						$('#'+type+' .list .pullUp').remove();

						if(data.next){
							$('#'+type+' .list').append('<div class="pullUp"><span class="pullUpIcon"></span><span class="pullUpLabel">下拉加载更多...</span></div>');
						}else{
							$('#'+type+' .list').append('<div class="pullUp nomore"><span class="pullUpLabel">已经是最后一条...</span></div>');
						}

						idx = data.items.length;
						while(idx--){
							refershStatus(data.items[idx].downloadStatus, '#status_'+data.items[idx].id);
						}

						UI.refreshScroller(type, function(){
							window.loadGroup(o, ++page);
						});
					}else{
						$('#'+type+' .list').html($.template('temp_empty', {}));
					}
					UI.loading.hide();
				}
			});
		}else{ // load cache
			UI.loading.hide();
		}
		return;
	}
	
	window.loadDetail = function (obj, id, type){/*=moive|tv*/
		if(event.target.className == 'downbtn'){
			return false;
		}



		UI.loading.show('加载中...');
		if(obj){
			$(obj).addClass('active');
		}
		//last show
		if(currentShow.search('detail')==-1){
			lastShow = currentShow;
		}
		
		gLog('PageClick', 'LoadDedail_'+currentShow, id);

		$.ajax({
			type     : 'get',
			url      : 'http://video.wandoujia.com/api/detail/'+id+'?jsonp=?',
			dataType : 'jsonp',
			success  : function(data){
				$(obj).removeClass('active');

				if(data){
					currentShow = type+'-detail';
					data.img = imgUrl(data.id)
					//get task status
					if(type == 'movie'){
						data.downloadStatus = videoTaskPlugin.getStatus(data.id);
					}else{
						var idx = data.show.length;
						while(idx--){
							data.show[idx].downloadStatus = videoTaskPlugin.getStatus(data.show[idx].id);
						}
					}
					//notify detail event
					
					videoTaskPlugin.openDetail(id, data.title, imgUrl(data.id));
					
					if(videoTaskPlugin.logToMuce){
						videoTaskPlugin.logToMuce('dora.offline.opendetail');
					}
					
					$('#'+currentShow+' .info-wrap').html($.template("temp_"+type+'_detail', data));

					if(type == 'movie'){
						$('.navbtns').html('<div class="navbtn" data-id="'+data.id+'" onclick="runTask(this)" data-title="'+data.title+'" data-style="selected" data-status="'+data.downloadStatus+'">'+window.statusText(data.downloadStatus)+'</div>');
					}else{
						$('.tv-task').each(function(){
							var that = $(this);
							that.bind('click', function(){
								runTask(that);
								event.cancelBubble = true;
								return false;
							});
						});
						$packObj = $('<div class="navbtn">打包下载全部</div>');
						
						var idx = data.show.length, allnum = 0, contentStr = '';
						while(idx--){
							if(videoTaskPlugin.getStatus(data.show[idx].id) == OTS_NONE){
								allnum++;
								var record = data.show[idx];
							}
						}
						
						if(allnum == 0){
							$packObj.text('取消全部下载');
						}
						
						$packObj.bind('click', function(){
							var idx = data.show.length, allnum = 0, contentStr = '', ids = '';
							while(idx--){
								if(videoTaskPlugin.getStatus(data.show[idx].id) == OTS_NONE){
									allnum++;
									var record = data.show[idx];
									//content_id$$content_title$$content_icon$$content_url
									if(allnum > 1){
										contentStr = '##' + contentStr;
									}
									contentStr = record.id + '$$'+ data.title + '-'+ record.title + '$$' + imgUrl(id) + '$$' + downUrl(record.id) + contentStr;
								}
							}
							//取消
							if(allnum > 0){
								videoTaskPlugin.addTaskGroup(contentStr);
								gLog('TaskGrop', 'create', id);
							} else {
								idx = data.show.length;
								contentStr = '';
								while(idx--){
									contentStr += data.show[idx].id+',';
								}
								if(contentStr){
									videoTaskPlugin.removeTaskGroup(contentStr.substring(0, contentStr.length-1));
								}
								gLog('TaskGrop', 'remove', id);
							}
						});
						$('.navbtns').html('');
						$('.navbtns').append($packObj);
					}


					UI.loading.hide();

					UI.toggleDetail(currentShow);

					UI.refreshScroller(currentShow);
					
				}
			}
		});
	}
	
	window.toggleTvList = function(o){
		var cls = $(o).attr('class');
		if(cls.search(/down/ig)>-1){
			$(o).attr('class', 'tv-more-up');
			$('.tv-more-body').show();
		}else{
			$(o).attr('class', 'tv-more-down');
			$('.tv-more-body').hide();
		}
		try{
			UI.scroller['tv-detail'].refresh();	
		}catch(e){}
	}
	/*
	window.ontouchstart = function(e){
		if (e.target.className && e.target.className == "downbtn") {
			e.preventDefault();
			e.stopPropagation();
		}
	}
	*/
	
	var defaultTab = location.hash.substr(1);
	defaultTab = defaultTab ? '[data-tab="'+defaultTab+'"]' : '';
	if($('#header > li'+defaultTab).length == 0){
		window.goSearch(location.hash.substr(1));
	}else{
		window.loadGroup($('#header > li'+defaultTab).get(0));
	}
	
	$('#header > li').each(function(){
		var that = this;
		$(this).bind('click', function(){
			//send log
			if(videoTaskPlugin.logToMuce){
				videoTaskPlugin.logToMuce('dora.offline.VideoHeaderClick.'+$(that).data('tab'));
			}
			gLog('PageClick', 'Tab', $(that).data('tab'));

			loadGroup(that);
		});
		$(this).bind('mousedown', function(){
			$(that).addClass('selected');
		});
		$(this).bind('mouseup', function(){
			$(that).removeClass('selected');
		});
	});
	
	//document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);
	

    document.addEventListener('DOMContentLoaded', function(){}, false);




})(window, document);