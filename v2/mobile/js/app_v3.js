//status code
const 
	OTS_NONE = -1,
	OTS_WAITING = 0,
	OTS_SYNCED = 1,
	OTS_EXECUTING = 2,
	OTS_FINISH_SUCCESS = 3,
	OTS_FINISH_FAILED = 4;

//ga
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-15790641-32']);
_gaq.push(['_trackPageview']);

(function(window, document, undefined){
	var 
		videoTaskPlugin = null,
		systemInit = true,
		currentShow = '', lastShow = '',
		pageCaches = [], pageScroller = [];
		
	//debug log
	var slog = function(msg){
		return false;
		$('#debug').append(msg+'<br>');
	}
	//define external call
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
			//v2
			setBarTitle : function (title){
			},
			//v2 
			finishActivity : function(){
				console.log('return main activity');
			},
			showMenuButton : function(btnName){
				console.log('show menu button');
			},
			hideMenuButton : function(btnName){
				console.log('hide menu button');
			
			},
			log : function(msg){
				//console.log(msg);
			}
		}
	}
	
	videoTaskPlugin = window.videoTaskPlugin;

	//load ga async
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
	
	//cut string by length
	String.prototype.sub = function(len, ext){
		if(ext == null){
			ext = '';
		}
		var l = this.length, s;
		if(l > Math.abs(len)){
			if(len>0){
				s = this.substring(0, len-ext.length)+ext;
			}else{
				var pre = Math.floor((Math.abs(len) - ext.length) / 2);
				s = this.substr(0, pre) + ext + this.substr(l - pre, l);
			}
		}else{
			s = this.substr(0);
		}
		return s;
	}
	//found webview support
	if('ontouchstart' in window){
		window.E = {
			'onmousedown' : 'ontouchstart',
			'onmouseup'   : 'ontouchend',
			'onclick'     : 'ontouchstart'
		}
	}else{
		window.E = {
			'onmousedown' : 'onmousedown',
			'onmouseup'   : 'onmouseup',
			'onclick'     : 'onclick'
		}
	}
	
	//collect log
	function gLog(category, action, opt_label, opt_value){
		if(_gaq){
			_gaq.push(['_trackEvent', action, opt_label, opt_value]);
		}
	}
	//loading obj
	var UI = new Object();
	UI.loading = {
		init : false,
		show : function(text){
			if(!UI.loading.init){
				UI.loading.init = true;
				var maskDiv = document.createElement("div");
				maskDiv.id  = "ui_mask";
				maskDiv.className = "ui-loader";
				maskDiv.innerHTML = "<span class='ui-icon ui-icon-loading'></span><h1>Loading Content</h1>";
				maskDiv.style.zIndex = 20000;
				maskDiv.style.display = "none";
				document.body.appendChild(maskDiv);
			}
			$('#ui_mask > h1').text(text);
			$("#ui_mask").show();
			return UI;
		},
		hide : function(){
			$("#ui_mask").hide();
			return UI;
		}
	};
	//show default loading
	UI.loading.show('努力加载中...');

	//show content by id
	UI.showContent = function(id){
		if(!id)return false;
		id = id.toLowerCase();
		$('#wrapper > *').each(function(){
			if($(this).attr('id') && $(this).attr('id').toLowerCase() == id){
				$(this).show();
			}else{
				$(this).hide();
			}
		});
	}

	//toggle list  ui
	UI.toggleList = function(id){
		if(id == 'search' || id == 'category'){
			UI.toggleSearch(id);
		}else{
			$('#wrapper').css('bottom', '0px');
			$('#navbar').hide();
			$('#wrapper').css('top', '40px');
			$('#header').show();
		}
		UI.showContent(id);
		return UI;
	}
	
	//toggle detail ui
	UI.toggleDetail = function(id){
		$('#wrapper').css('bottom', '42px');
		$('#wrapper').css('top', '0px');
		$('#navbar').show();
		$('#header').hide();
		UI.showContent(id);
		return UI;
	}
	
	//toggle search ui
	UI.toggleSearch = function(id){
		$('#wrapper').css('bottom', '0px');
		$('#wrapper').css('top', '0px');
		$('#navbar').hide();
		$('#header').hide();
		UI.showContent(id);
		return UI;
	}
	
	//create or refresh scroller
	UI.refreshScroller = function(type, pullUpCalback){
		UI.scroller = UI.scroller || [];
		if(!UI.scroller[type]){
			UI.scroller[type] = scrollObj(type, pullUpCalback);
		}
		UI.scroller[type].refresh();
		return UI.scroller[type];
	}
	
	
	//history obj
	UI.history = {
		init : false,
		list : [],
		getDeep : function(type){
			switch(type.toLowerCase()){
				case 'tv':
				case 'movie':
				case 'category-index':
				case 'search-index':
					return 1;
					break;
				case 'category':
				case 'search':
					return 2;
					break;
				case 'movie-detail':
				case 'tv-detail':
					return 3;
					break;
			}
		},
		add  : function(type, callback){ 
			if(UI.history.list.length > 0 ){
				var lastObj = UI.history.list[UI.history.list.length-1];
				var currentIndex  = UI.history.getDeep(type);
				var lastIndex = UI.history.getDeep(lastObj.type);
				
				if(lastIndex == currentIndex){
					UI.history.del(lastObj.type);
					return UI.history.list.push({type:type, callback:callback});
				}else if(lastIndex < currentIndex){
					return UI.history.list.push({type:type, callback:callback});
				}
			}else{
				return UI.history.list.push({type:type, callback:callback});
			}
			
			
		},
		del : function(type){
			for(var i=UI.history.list.length-1; i >= 0; i--){
				if(UI.history.list[i].type == type){
					UI.history.list.splice(i, 1);
					break;
				}
			}
		},
		updateBeforeBack : function(id, callback){
			if(id > 0 && UI.history.list[id-1]){
				UI.history.list[id-1].onBeforeCallback = callback;
			}
		},
		updateTitle : function(id, title){
			document.title = title;
			if(id > 0 && UI.history.list[id-1]){
				UI.history.list[id-1].title = title;
			}
			
			videoTaskPlugin.setBarTitle(title);
			
		},
		back : function(){
			var historyObj, historyDeep ;
			while(true){
				if(UI.history.list.length==1){
					if(UI.history.list[0].type == currentShow){
						/*
						if(historyObj.onBeforeCallback){
							historyObj.onBeforeCallback();
						}
						*/
						return false;
					}else{
						historyObj = UI.history.list[0];
						break;
					}
				}else{
					historyObj = UI.history.list.pop();
					if(historyObj.type && historyObj.type == currentShow){
						/*
						if(historyObj.onBeforeCallback){
							historyObj.onBeforeCallback();
						}
						*/
						continue;
					}
					else break;
				}
			}
			historyDeep = UI.history.getDeep(historyObj.type);
		
			if(historyObj){
				if(historyObj.title){
					videoTaskPlugin.setBarTitle(historyObj.title);
				}
				
				historyObj.callback();
				return true;
			}else{
				return false;
			}
		}
	}
	
	
	//create new scroll object
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
			onScrollStart:function(e){
				$('#'+objId+' .scrollBar').show();
				clearTimeout(hiddenTimer);
			},
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
	
	
	
	//js callback to go back
	window.goBack = function(){
		if(!UI.history.back()){
			videoTaskPlugin.finishActivity();
		}
	}
	//js callback go search
	window.goSearch = function(key){
		//clear cache
		pageCaches['search'] = [];
		//
		if($(event.target).length > 0 && $(event.target).data('tag')){
			gLog('Search', 'SearchTag', key);
		}else{
			gLog('Search', 'SearchKey', key);
		}
		$('#search').data('title', '搜索：'+key);
		window.searchKey  = key;
		window.searchCate = '';
		window.loadGroup($('#header>li[data-tab="search"]').get(0), 1);
	}
	
	//js callback go search category
	window.goCategory = function(cate, key){
		//clear cache
		pageCaches['category'] = [];
		if(key){
			window.searchKey = key;
		}else{
			window.searchKey = '';
		}
		gLog('Category', 'click', cate);
		window.searchCate = cate;
		window.loadGroup($('#header>li[data-tab="category"]').get(0), 1);
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
						window.refershStatus(status, '#status_'+id);
					}
				});
				pageCaches['tv'] = [];
				pageCaches['search'] = [];
				pageCaches['category'] = [];
			break;
			case 'tv':
				pageCaches['movie'] = [];
				pageCaches['search'] = [];
				pageCaches['category'] = [];
			break;
			case 'search':
				pageCaches['tv'] = [];
				pageCaches['movie'] = [];
				pageCaches['category'] = [];
			break;
			case 'search-index':
				
			break;
			case 'category-index':
			break;
			case 'category':
			
			break;
			case 'movie-detail':
				pageCaches['tv'] = [];
				pageCaches['movie'] = [];
				pageCaches['search'] = [];
				pageCaches['category'] = [];
				$('.navbtn').each(function(){
					var status = videoTaskPlugin.getStatus($(this).data('id'));
					$(this).text(window.statusText(status));
				});
			break;
				
			case 'tv-detail':
				pageCaches['tv'] = [];
				pageCaches['movie'] = [];
				pageCaches['search'] = [];
				pageCaches['category'] = [];
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
	
	window.statusTip = function(status){
		switch(status){
			case OTS_NONE:
				return('');
			case OTS_FINISH_FAILED:
				return('下载失败');
			break;
			case OTS_WAITING:
				return('等待PC端下载');
			case OTS_SYNCED:
				return('等待与PC同步');
			case OTS_EXECUTING:
				return('正在下载中');
			break;
			case OTS_FINISH_SUCCESS:
				return('');
			break;
		}
	}
						
	
	//refresh btn status
	window.refershStatus = function(status, id){
		var obj = $(id),
			textObj = $(id+'_text'),
			textTip = window.statusTip(status);
		
		switch(status){
			case OTS_NONE:
				obj.css("backgroundImage", 'url(styles/images/download.png)');
				break;
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
		
		if(textTip == ''){
			textObj.hide().text('');
		}else{
			textObj.show().text(textTip);
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
	
	//img url
	window.imgUrl = function(id){
		return 'http://video.wandoujia.com/api/img/'+id+'';
	}
	
	//define all url
	window.groupUrl = function(type, page){
		switch(type){
			case 'search-index':
				return 'http://video.wandoujia.com/api/hot/word?size=20&jsonp=?';
			case 'search':
				return 'http://video.wandoujia.com/api/s?word='+window.searchKey+'&page='+page+'&size=20&jsonp=?'
			case 'category':
				return 'http://video.wandoujia.com/api/s?page='+page+'&size=20&cate='+window.searchCate+'&jsonp=?';
			case 'category-index':
				return 'http://video.wandoujia.com/api/word?jsonp=?';
			case 'singer':
				return 'http://video.wandoujia.com/api/cate?jsonp=?';
			default:
				return 'http://video.wandoujia.com/api/'+type+'/hot?page='+page+'&size=20&jsonp=?';
		}
	}
	
	//img load error
	window.imgError = function(o){
		this.onerror = null;
		this.src = 'styles/images/movie.png';
	}
	
	//set category title
	window.setCategoryTitle = function(title){
		$('#category').data('title', title);
	}
	
	//run task
	var last_click_time = new Date().getTime(), last_click_element = null;
	
	//fix click twice[iscroll BUG]
	function isNotClickTime(e){
		if(!e)return false;
		var click_time = new Date().getTime(),
			last_time = (click_time - last_click_time),
			o = e ? e.target : null;
		if ((last_click_element == o && last_time < 500) || last_time < 500) {
			e && e.stopImmediatePropagation();
			return true;
		}
		last_click_element = o;
		last_click_time = new Date().getTime();
		return false;
	}
	
	
	//start a task
	window.runTask = function(o, add){
		if(isNotClickTime(event)){
			return false;
		}
		var obj = $(o), id = obj.data('id'), status = videoTaskPlugin.getStatus(id);
		if(status == OTS_FINISH_SUCCESS){
			videoTaskPlugin.play(id);
			//
			gLog('TaskPlay', currentShow, id);
		}else if(status == OTS_NONE){
			videoTaskPlugin.addTask(id, (obj.data('tv') ? obj.data('tv') +'-' : '')+obj.data('title'), '', downUrl(id));
			if(obj.data('style')){
				obj.addClass(obj.data('style'));
			}
			//
			gLog('TaskCreate', currentShow, id);
		}else{
			videoTaskPlugin.removeTask(id);
			if(obj.data('style')){
				obj.removeClass(obj.data('style'));
			}
			//
			gLog('TaskRemove', currentShow, id);
		}
		event.cancelBubble = true;
		return false;
	}
	
	//load list
	window.loadGroup = function (o, page, callback, byBack){
		if(isNotClickTime(event)){
			return false;
		}
		var lastTab = $(".group").find('.current'), 
			thisTab = $(o), 
			type = thisTab.data('tab'),
			pageTitle = $('#'+type).data('title') || ''; 
			historyId = -1;
			
		if(page == null || page < 0) page = 1;
		if(page == 1 || thisTab.data('showloading')){
			UI.loading.show('加载中...');
		}
		//get last show
		lastShow = currentShow;
		if(lastShow == ''){
			lastShow = type;
		}
		
		if(currentShow != type){
			//not history
			if(!byBack ){
				historyId = UI.history.add(type, function(){
					window.loadGroup(o, page, callback, true);
				});
			}
			currentShow = type;
			lastTab.removeClass('current');
			thisTab.addClass('current');
		}
		
		//toggle ui to this type
		UI.toggleList(type);

		pageCaches[type] = pageCaches[type] || [];
		if(typeof pageCaches[type][page] == 'undefined'){
			var groupUrl = window.groupUrl(type, page);
			$.ajax({
				type     : 'get',
				url      : groupUrl,
				dataType : 'jsonp',
				success  : function(data){
					switch(type){
						case 'category-index':
							console.log(data);
							$('#'+type+' .list').html($.template("temp_category_index", data));
							UI.refreshScroller(type, function(){});
							break;
						case 'search-index':
							$('#search-index .search-taglink').html($.template('temp_search_index', {'list':data}));
							UI.refreshScroller(type, function(){});
							UI.history.updateTitle(historyId, '视频搜索');
							break;
						default:
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
							break;
					}
					UI.history.updateTitle(historyId, pageTitle);
					UI.loading.hide();
				}
			});
		}else{ // load cache
			UI.loading.hide();
			UI.history.updateTitle(historyId, pageTitle);
		}
		
		return;
	}
	
	//load detail
	window.loadDetail = function (obj, id, type, byBack){
		if(isNotClickTime(event)){
			return false;
		}
		
		if(event && event.target.className == 'downbtn'){
			return false;
		}
		
		var historyId = -1;
		
		UI.loading.show('加载中...');
		
		if(obj){
			$(obj).addClass('active');
		}
		//last show
		if(currentShow.search('detail')==-1){
			lastShow = currentShow;
			//not history
			if(!byBack){
				historyId = UI.history.add(type+'-detail',function(){
					window.loadDetail(obj, id, type, true);
				});
			}
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
					data.img = imgUrl(data.id);
					data.info = data.info.replace(/[\r\n]+/ig, '<br>');
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
					
					
					videoTaskPlugin.openDetail(id, data.title, imgUrl(data.id));
					/*
					videoTaskPlugin.showMenuButton('ShareButton');
					
					UI.history.updateBeforeBack(historyId, function(){
						videoTaskPlugin.hideMenuButton('ShareButton');
					});
					*/
					UI.history.updateTitle(historyId, data.title);

					UI.loading.hide();

					UI.toggleDetail(currentShow);

					UI.refreshScroller(currentShow);
					
				}
			}
		});
	}
	
	//expand tv list
	window.expandTvList = function(o){
		var cls = $(o).attr('class');
		if(cls.search(/down/ig)>-1){
			$(o).attr('class', 'tv-more-up');
			$('.tv-more-body').show();
		}else{
			$(o).attr('class', 'tv-more-down');
			$('.tv-more-body').hide();
		}
		//refresh scroller
		try{
			UI.scroller['tv-detail'].refresh();	
		}catch(e){}
	}
	
	//load default tab
	var defaultTab = location.hash.substr(1);
	defaultTab = defaultTab ? '[data-tab="'+defaultTab+'"]' : '';
	//not tab?
	if($('#header > li'+defaultTab).length == 0){
		window.goSearch(location.hash.substr(1));
	}else{
		window.loadGroup($('#header > li'+defaultTab).get(0));
	}
	//header event
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
	//search btn event
	$('#search-btn').on('click', function(){
		window.goSearch($.trim($('#search-key').val()));
	});
	
	document.addEventListener('DOMContentLoaded', function(e){}, false);
	
	//allow all input field
	[].slice.call(document.querySelectorAll('input, select, button')).forEach(function(el){
		el.addEventListener(('ontouchstart' in window)?'touchstart':'mousedown', function(e){
			console.log('Preventing event from bubbling up to iScroll, as it would then remove it.');
			e.stopPropagation();
		})
	});


})(window, document);
