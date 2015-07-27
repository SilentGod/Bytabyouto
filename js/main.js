(function(){
	$(document).ready(function() {
		/**load时加载一次**/
		ChangeHeight(".list-header",".list-content");
		ChangeHeight(".content-header",".content");
		$(window).resize(function(event) {
			/**防止过度刷新**/
			setTimeout(function(){
				ChangeHeight(".list-header",".list-content");
				ChangeHeight(".content-header",".content");
				},300);			
		});


		
		/**
		 * 删除文章按钮
		 */
		$('.delete').click(function(event) {
			deleteNote('article',$('.finish').attr('data-id'));
		});

		/**
		 * 添加文章按钮
		 * 
		 */
		$('.list-header a').click(function(event) {
			var res = ShowSelectedClass();
			$('.hideCheck').val('123');
			alert('您选择的分类是：'+res);
			//ShowSelectedClass();
		});

		/**
		 * 动态绑定，点击后右侧显示内容，用于更新
		 * 
		 */
		$(document).on("click", "article.list", function() {
             $('.input-title').val($(this).find('h2').text());
             $('.insert-content').val($(this).find('p').text());
             $('.finish').attr('data-id', $(this).attr('data-id'));
             
        });

		/**
		 * 高亮被点击的链接，同时查询该分类下的文章
		 * 
		 */
       $(document).on('click', '.category-list a', function(event) {
       	event.preventDefault();
       	$(this).addClass('active').parent().siblings().find('a').removeClass('active');
       	console.log($(this).text());
       	GetContent($(this).text(),'article');
       });

       $('.doadd').click(function(event) {
       	$('.mask').css('display', 'block');
       	$('.addCategory').css('display', 'block');
       	console.log("分类"+$('.category-list ul:has(li)').length);
       });

       $('.submit').click(function(event) {
		$('.mask').css('display', 'none');
		$(this).parent().css('display', 'none');
		
		if($('.category-list ul:has(li)').length==0){
			var html = "<li><a class='active' href='javascript:void(0)'>"+$('.cat-content').val()+"<span class='number'></span></a></li>";
			localStorage.setItem('category',$('.cat-content').val());
		}else{
			var html = "<li><a class='' href='javascript:void(0)'>"+$('.cat-content').val()+"<span class='number'></span></a></li>";
			var cat = new Array();
			cat.push(localStorage.getItem('category'));
			cat.push($('.cat-content').val());
			localStorage.setItem('category',cat);
		}
		$('.category-list ul').append(html);
       });
		/**
		 * 修改DIV高度
		 */
		function ChangeHeight(Node_1,Node_2){
			var height = $(Node_1).outerHeight();
			var windowHeight = $(window).height();
			$(Node_2).css('height', windowHeight-height);
		}

		/**
		 * 获取一下分类
		 */
		function ShowSelectedClass(){
			var res;
			$('.category-list a').each(function(index, el) {
				
				if($(el).hasClass('active')){
					res = $(el).text();
					console.log(res)
					
				}
			});
			return res;
		}
	});
	


	window.onload = function(){
		var addCategory = document.querySelector('.doadd');//添加分类
		var insertNote  = document.querySelector('.finish');//完成写作，插入数据库
		var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
		var dbName = "note";
		var tableName = "article";
		var lastCursor;
		var html="";
		init();
		//deleteDatabase(dbName);
		//首先检测浏览器是否支持离线存储
		if(window.localStorage){
			console.log('This browser supports localStorage');
			if(localStorage.getItem('category')){
				var cat = localStorage.getItem('category').split(',');
				var j = cat.length;
				for (var i = 0 ; i < j; i++) {
					if($('.category-list ul:has(li)').length==0){
						var htm = "<li><a class='active' href='javascript:void(0)'>"+cat[i]+"<span class='number'></span></a></li>";
					}else{
						var htm = "<li><a class='' href='javascript:void(0)'>"+cat[i]+"<span class='number'></span></a></li>";
					}
					$('.category-list ul').append(htm);
				}
			}
			
		}else{
		 	alert('This browser does NOT support localStorage');
		}
		function init(){
			openRequest = indexedDB.open(dbName);//不存在则创建
			openRequest.onupgradeneeded = function(e){
				console.log("running onupgradeneeded");
				var thisDb = e.target.result;
				console.log(thisDb.version);
				if(!thisDb.objectStoreNames.contains(tableName)){
					console.log("I need to create the objectStore");
					var objectStore = thisDb.createObjectStore(tableName,{keyPath:"id",autoIncrement:true});
					/**创建索引，用于搜索笔记**/
					// objectStore.createIndex("tag","tag",{ unique:false});
					objectStore.createIndex("category","category",{ unique:false});
					objectStore.createIndex("del","del",{ unique:false});
				}
			}
			openRequest.onsuccess = function(e){
				db = e.target.result;
				console.log(db.version);
				db.onerror = function(){
					alert("Database error:" + event.target.errorCode);
					console.log(event.target);
				};
				if(db.objectStoreNames.contains(tableName)){
					console.log("contains table" + tableName);
					var transaction = db.transaction([tableName],"readwrite");
					transaction.oncomplete = function(event){
						console.log("all done");
					};
					transaction.onerror = function(event){
						console.dir(event);
					};
					var objectStore = transaction.objectStore(tableName);
					objectStore.openCursor().onsuccess = function(event){//使用游标遍历
						var cursor = event.target.result;
						console.log("I am a "+cursor);
						// if(cursor==null){
							
						// 	//ChildNode.remove();
						// 	var html = "<article><p style='text-align: center;color: #ddd;'>暂无笔记</p></article>";
						// 	//ParentNode.appendChild(document.createNode(html));
						// 	$('.list-content .list').remove();
						// 	$('.list-content').append(html);
						// }
						if(cursor){
							console.log(cursor.key);
							console.log(cursor.value);
							// render({key:cursor.key,title:cursor.value["title"],content:cursor.value["content"]});
							html +="<article class='list' data-id='"+cursor.key+"'><header><h2>"+cursor.value["title"]+"</h2></header><p>"+cursor.value["content"]+"</p></article>";
							lastCursor = cursor.key;
							cursor.continue();
						}else{
							
					        $('.list-content .list').remove();
							$('.list-content ').append(html);
							//显示第一篇文章的具体信息
							// $('.title').val(text)
							html = "";
							console.log("done with cursor");
						}
					};
				}
			};
			openRequest.onerror = function(e){
				console.dir(event.target);
			}
		}

		//完成事件
		EventUtil.addHandler(insertNote,"click",function(){
			var input_title = document.querySelector('.input-title').value;//标题
			var insert_content = document.querySelector('.insert-content').value;//内容
			var hideCheck = document.querySelector('.hideCheck').value//检查隐藏域是否有值，确认选择了分类
			var category = null;
			$('.category-list a').each(function(index, el) {
				if($(el).hasClass('active')){
					category = $(this).text().split('(')[0];//获取分类
				}
			});
			//判断不为空，插入到数据库
			
			if(hideCheck == "" ){
				alert("请先选择分类");
			}else if(input_title=="" || insert_content==""){
				alert("填完整了，才算完成哦~~");
			}else if($(this).attr('data-id')){
				updateDataByKey(tableName,$(this).attr('data-id'));
			}else{
				var note={"title":input_title,"content":insert_content,"del":"1","category":category};
                //获取一个事务
                var transaction = db.transaction([tableName],"readwrite");
                //事务回调函数的处理
                transaction.oncomplete = function(event){
                    console.log("transactiono complete");
                };
                transaction.onerror = function(event){
                    console.dir(event);
                };
                //通过事务得到一个objectStore对象
                var objectStore = transaction.objectStore(tableName);
                objectStore.add(note);
                //将新添加的数据，加入到html里面展示
                objectStore.openCursor().onsuccess = function(event){
                    cursor = event.target.result;
                    var key;
                    if(lastCursor==null){
                        key=cursor.key;
                        lastCursor=key;
                    }else{
                        key=++lastCursor;
                    }
                   // render({key:key,title:input_title,content:insert_content});
                    console.log("成功添加一条新纪录！key值："+key);
                    console.dir(note);
                }
           
			}
		});

		//EventUtil.addHandler()
	};

	




	var EventUtil = {
		addHandler:function(element,type,handler){
			if(element.addEventListener){
				element.addEventListener(type,handler,false);
			}else if(element.attachEvent){
				element.attachEvent("on"+type,handler);
			}else{
				element["on"+type] = handler;
			}
		},
		removeHandler:function(element,type,handler){
			if(element.addEventListener){
				element.removeEventListener(type,handler,false);
			}else if(element.attachEvent){
				element.detachEvent("on"+type,handler);
			}else{
				element["on"+type] = null;
			}
		}
	};

	// function render(note){
	// 	// var Node = document.querySelector('.list-content');
	// 	// Node.remove();
 //        //接收传输的值
        
        
 //        var nte=note;
 //        html +="<article class='list' data-id='"+nte.key+"'><header><h2>"+nte.title+"</h2></header><p>"+nte.content+"</p></article>";
 //        console.log("hi")
 //        $('.list-content .list').remove();
	// 	$('.list-content ').append(html);
		
 //    }

    //删除方法
    function deleteNote(tableName,key){
        var transaction = db.transaction([tableName],"readwrite");
            transaction.oncomplete = function(event){
                console.log("transaction complete!");
            };
             
            transaction.onerror = function(event){
                console.dir(event);
            }
            //得到objectStore对象
            var objectStore = transaction.objectStore(tableName);
            //接收传过来的key值
            var removeKey = parseInt(key);
            //通过key值获取对象,在控制台打印
            var getRequest=objectStore.get(removeKey);
            getRequest.onsuccess=function(e){
                var result = getRequest.result;
                console.dir(result);
            };
            var request = objectStore.delete(removeKey);
            request.onsuccess = function(e){
            	alert("文章删除成功");
            	location.reload();
                console.log("success delete record!");   
            };
            request.onerror = function(e){
                console.log("Error delete record:",e);   
            }
           
    }


    //删除数据库
    function deleteDatabase(dbName) {
	   var deleteDbRequest = indexedDB.deleteDatabase(dbName);
	   deleteDbRequest.onsuccess = function (event) {
	      console.log('delete success');
	   };
	   deleteDbRequest.onerror = function (e) {
	      console.log("Database error: " + e.target.errorCode);
	   };
	}

	//更新单条数据，value是键值
	function updateDataByKey(tableName,key){
        var transaction = db.transaction([tableName],'readwrite'); 
        var objectStore = transaction.objectStore(tableName); 
        var Key = parseInt(key);
        var request = objectStore.get(Key); 
        request.onsuccess=function(e){ 
            var Note = e.target.result; 
            Note.title = $('.input-title').val();
            Note.content = $('.insert-content').val();
            objectStore.put(Note); 
        };
	}
	


	//查询数据库
            function GetContent(cat,tableName){
                var curName = cat;
                var transaction =db.transaction([tableName],"readwrite");
                transaction.oncomplete = function(event){
                    console.log("transaction complete");  
                };
                transaction.onerror = function(event){
                    console.dir(event);
                };
                //得到objectStore对象
                var objectStore = transaction.objectStore(tableName);
                var boundKeyRange = IDBKeyRange.only(curName); //生成一个遍历范围的Range对象
                var html="";
                objectStore.index("category").openCursor(boundKeyRange).onsuccess = function(event){
                    var cursor = event.target.result;
                    // if(!cursor){
                    // 	console.log("没有查询到");
                    // 	$('.list-content ').append("<article>没有文章</article>");
                    //     return;
                    // }
                    if(cursor){
	                    var rowData = cursor.value;
	                    console.log("rowDate="+rowData['title']);
	                    //render({key:cursor.key,title:cursor.value["title"],content:cursor.value["content"]});
	                    html +="<article class='list' data-id='"+cursor.key+"'><header><h2>"+rowData["title"]+"</h2></header><p>"+rowData["content"]+"</p></article>";
	                    cursor.continue();
	                    
                    }else{
                    	console.log('qingchu')
                    	$('.list-content .list').remove();
                    	if(html.length==0){
                    		$('.list-content ').append("<article class='list'>没有文章</article>");
                    	}else{

							$('.list-content ').append(html);
							//显示第一篇文章的具体信息
							// $('.title').val(text)
							html = "";
                    	}
                    	
						console.log("查询完毕！");
                    }
                }
            };

            //接受cursor，用于生成查询到新的数据
            function CreateNewList(rowData){
            	 html +="<article class='list' data-id='"+rowData.key+"'><header><h2>"+rowData.value["title"]+"</h2></header><p>"+rowData.value["content"]+"</p></article>";
            }

})()