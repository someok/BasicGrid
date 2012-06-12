/**
 * $Id$
 */
//jsHint options
/*jslint devel: true, windows: true, passfail: false, evil: false, plusplus: true, white: true,
	jQuery: true */

(function ($) {

	'use strict';

	var version = '1.0.1';

	var $this,
		paramDataName = 'params',	// 绑定的data名字
		notFirstLoad = 'notfirstLoad',	// 是否初次载入表格
		isStaticData = false,	// 是否静态数据
		colNum = 0;	// 表格列数

	/**
	 * 类似于java 中的 String.format()。
	 * 用法是： _s('abc{0}efg{1}hgi{2}...', '1', '2', '3');
	 * 需要注意的是中括号中需要从0开始
	 *
	 * @return {String} 替换后的字符串
	 */
	var _s = function() {
		var args = arguments;

		return s.replace(/{(\d+)}/g, function(match, number) {
			var n = parseInt(number) + 1;

			return typeof args[n] !== 'undefined'
				? args[n]
				: match;
		});
	};

	var htmlEncode = function (value) {
		return !value ? value : String(value).replace(/&/g, "&amp;")
			.replace(/\"/g, "&quot;").replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");
	};

	// 初始化
	var init = function(options) {
		$this = this;

		this.settings = $.extend({
			// 取后台数据的url，需注意，如果这个字段非空，那么data字段默认忽略
			url: "",

			// 静态数据，可用来生成非分页的表，需注意：此字段与url互斥
			// 如果使用了此字段的话，那么下面的几个key定义也就不必要了
			data: [],

			// 部分情况下可能在初始化的时候并不想显示表格，
			// 那么这时候可以将此属性设置为 true，在此情况下
			// 即使定义了 url，也不会载入数据。
			// 可以在之后通过 showTable 方法重新显示表格
			hidden: false,

			tableCls: 'basicGrid',	// table上的class
			width: '100%',	// 表格宽
			emptyTbodyText: 'The table is Empty',

			autoEncode: true,	// 是否对内容做encode处理

			rowNumCol: true,	// 是否显示行数
			rowNumColText: '&nbsp;',	// 行数列标题

			altRows: true,	// 是否隔行显示不同颜色
			altRowCls: 'alt-row-color', // 隔行定义的css

			checkboxCol: true,	// 是否显示多选列


			// 表格内容model
			// {} 对象格式，内容有：
			//   index: String
			//   text: String
			//   headCls: String
			//   headStyle: String
			//   hidden: boolean
			//   formatter: function格式，参数为： (tableData, rowData, index, colData)
			colModel: [],

			// json数据的key定义
			keys: {
				id: 'id',
				page: 'page',
				total: 'total',
				//records: 'totalRecords',
				rows: 'rows',
			},

			autoAppendPage: true,	// 是否自动在表格下面附加一个分页栏

			currentPage: 1,		// 当前所在页数，从1开始
			pageSize: 20,			// 每页记录数

			pageInfo: 'Display {from} to {to} of {total} items',

			txtFirst: '&hellip;',
			titleFirst: '首页',
			txtPrevious: '«',
			titlePrevious: '上一页',
			txtNext: '»',
			titleNext: '下一页',
			txtLast: '&hellip;',
			titleLast: '尾页',

			// 当autoAppendPage: false 的时候，需要指定分页栏的 selector
			pageEl: '',

			onError: null,	// url载入失败后的处理方法
			
			extraParams: {}	// 扩展对象，用于提交时候一起扔到后台

		}, options);

		return this.each(function() {
			var $table = $(this),
				o = $this.settings;

			// 首先判断id的格式是否正确
			if (!/^\#[\w\-_]+$/i.test($this.selector)) {
				$.error('Table id [' + $this.selector + '] has wrong format!');
			}

			// 判断属性定义是否正确
			if (!_settingsValid(o)) return;

			// 取得给定table的id
			$table.tableId = $this.selector.slice(1);

			// 判断url是否为空，不空的话ajax读取数据
			// todo
			isStaticData = o.data && o.data.length > 0;
			$table.data('isStaticData', isStaticData);

			_initTable($table, o);

			// 是否隐藏表格
			if (o.hidden) {
				$table.hide();
				return;
			}

			_buildTable($(this));

		});
	};

	/**
	 * 添加值到table的data上
	 * @param {Object} $table 表格的jQuery对象
	 * @param {String} name   参数名
	 * @param {Object} value  参数值
	 */
	var _addParam2Data = function($table, name, value) {
		var data = $table.data(paramDataName);
		
		if ($.isPlainObject(name)) {
			$.extend(data, name);
		} else {
			data[name] = value;
		}
		$table.data(paramDataName, data);
	};

	var _notFirstLoad = function($table) {
		return $table.data(notFirstLoad);
	};

	/**
	 * 初始化table
	 */
	var _initTable = function($table, o) {
		var colNum = 0, model, cls;

		// 设置表格样式
		if (!$table.hasClass(o.tableCls)) {
			$table.addClass(o.tableCls);
		}
		if (o.width) {
			$table.attr('width', o.width);
		}

		// 生成表格标题行
		_appendTableHead($table, o);

		_resetData($table, o);

	};
	
	var _resetData = function($table, o) {
		// 绑定个空对象到table上
		var data = {};
		data['size'] = o.pageSize;
		data['page'] = o.currentPage;
		$.extend(data, o.extraParams);
		$table.data(paramDataName, data);
	}

	var _buildTable = function ($table) {

		var o = $this.settings;

		if (!isStaticData) {
			// 从后台载入数据
			_loadDataFromUrl($table, o, _onSuccess, o.onError);
		} else {

			_buildTableContent($table, o);

		}
	};

	/**
	 * 填充表格内容，生成分页组件，并进行事件绑定等操作
	 */
	var _buildTableContent = function ($table, o, appendPager, pager) {
		_appendTableBody($table, o);

		// bind event
		_bindEvent2Table($table);

		if (appendPager && pager) {
			_appendPager($table, o, pager);
		}


		// 第一次载入表格之后，置入个标记，方便后面调用
		$table.data(notFirstLoad, true);
	}

	/**
	 * url载入成功之后的处理方法
	 *
	 */
	var _onSuccess = function ($table, o, data, status) {
		var pager = {};

		o.data = data[o.keys.rows];

		pager['total'] = data[o.keys.total];
		pager['page'] = data[o.keys.page];
		pager['size'] = o.pageSize;

		_buildTableContent($table, o, true, pager);

	};

	/**
	 * 通过ajax方式从后台读取json数据
	 *
	 * @return {[type]} [description]
	 */
	var _loadDataFromUrl = function ($table, o, onsuccess, onerror) {
		var data = $table.data(paramDataName);

		$.ajax({
			url: o.url,
			dataType: 'json',
			cache: false,
			context: $table,
			data: data,
			success: function (data, status) {
				onsuccess($table, o, data, status);
			},
			error: function(req, status, err) {
				console.log(err);
				if (onerror) {
					onerror($table, o, req, status, err);
				}
			}
		});
	};

	/**
	 * 验证给定属性是否正确
	 *
	 * @param  {Object} o 属性对象
	 * @return {boolean}   验证结果
	 */
	var _settingsValid = function(o) {

		var result = true;

		if (!o.colModel || o.colModel.length === 0) {
			$.error('colModel not define');
			result = result && false;
		}
		return result;
	};



	var _appendTableHead = function($table, o) {
		var model, cls, i,
			thead = '<thead><tr>';

		// 遍历列并顺便创建标题行
		// 如果需要显示计数列，则需要加1
		if (o.rowNumCol) {
			colNum += 1;
			thead += '<th class="rownum"';
			thead += '>' + o.rowNumColText + '</th>';
		}

		// 是否显示checkbox列
		if (o.checkboxCol) {
			colNum += 1;
			thead += '<th class="th-cb-all">';
			thead += '<input type="checkbox" class="cb-all">';
			thead += '</th>';
		}

		for (i = 0; i < o.colModel.length; i++) {
			model = o.colModel[i];
			if (model.hidden) {
				continue;
			}

			cls = model.index + '-header';

			colNum += 1;
			thead += '<th';
			// 设置标题列的样式
			if (model.headCls) {
				cls += ' ' + model.headCls;
			};
			thead += ' class="' + cls + '"';

			if (model.headStyle) {
				thead += ' style="' + model.headStyle + '"';
			};
			
			if (model.width) {
				thead += ' width="' + model.width + '"';
			}

			thead += '>' + model.text + '</th>';

		};

		thead += '</tr></thead>'
		$table.append(thead);
	};

	var _appendTableBody =function($table, o) {
		var model;

		// 首先删除tbody
		$('tbody', $table).remove();

		// 创建表格内容部分 tbody
		var tbody = '<tbody>';
		if ($.isEmptyObject(o.data)) {
			tbody += '<tr><td colspan="' + colNum + '" class="empty-tbody">' + o.emptyTbodyText
				+ '</td></tr>';
		} else {
			var row = null;
			var colData = null;
			for (var i = 0; i < o.data.length; i++) {
				row = o.data[i];

				tbody += '<tr';
				if (o.altRows && (i + 1) % 2 === 0) {
					tbody += ' class="' + o.altRowCls + '"';
				}
				tbody += '>';

				// 首先创建计数列
				if (o.rowNumCol) {
					tbody += '<td class="rownum"';
					tbody += '>' + (i + 1) + '</th>';
				};

				// 是否显示checkbox列
				if (o.checkboxCol) {
					tbody += '<td class="td-cb-row">';
					tbody += '<input type="checkbox" class="cb-row"';
					tbody += ' name="rowId" value="' + row[o.idKey] + '">';
					tbody += '</td>';
				};

				// 创建实际的数据列
				for (var j = 0; j < o.colModel.length; j++) {
					model = o.colModel[j];
					if (model.hidden) {
						continue;
					};

					// 生成cell
					colData = row[model.index];

					// 如果对象需要自己处理数据，则直接调用其处理函数。
					// 否则会自动处理：如果是空值，则返回 '';
					// 如果autoEncode设置为true，则需要escape html标签
					if ($.isFunction(model.formatter)) {
						colData = model.formatter.call(null, o.data, row, i, colData);
					} else {
						if (colData) {
							colData = o.autoEncode ? htmlEncode(colData) : colData;
						} else {
							colData = '';
						}
					}
					tbody += '<td>' + colData + '</td>';

				};

				tbody += '</tr>';
			};

		}

		tbody += '</tbody>'
		$table.append(tbody);
	};

	// 给table上的各个元素绑定事件
	var _bindEvent2Table = function($table) {

		// 单独点选某个checkbox的时候触发的方法
		// 给父元素 td、tr 增加后删除个 class
		// 需要先unbind click事件，否则会触发两次
		$('.cb-row', $table).unbind('click').click(function() {
			$(this).parent('td').toggleClass('td-cb-row-active');
			$(this).parent('td').parent('tr').toggleClass('tr-cb-row-active');

		});

		// 点击全选checkbox的时候触发的事件
		$('.cb-all', $table).unbind('click').click(function() {
			var cbAllChecked = $(this).attr('checked');
			$('.cb-row[checked != ' + cbAllChecked + ']', $table).click();
		});

		// 鼠标放到行上后整行变色
		$('tbody tr', $table).mouseover(function () {
			$(this).addClass('row-hover');
		}).mouseout(function () {
			$(this).removeClass('row-hover');
		});
	};

	/**
	 * Pager 对象，用于分页处理时候使用.
	 */
	var Pager = function(total, curPage, size, navPages) {
		// 总记录数
		this.total = total;

		// 当前页数
		this.curPage = curPage;

		// 每页数据数
		this.size = size ? size : 20;

		// 总页数
		this.pages = Math.floor((this.total - 1) / this.size + 1);

		// 对于给定的当前页，还需要进行下判断，放置给的值是非法的
		// 之后在系统中调用的当前页的属性使用的是 pageNumber
		if (this.curPage < 1) {
			this.pageNumber = 1;
		} else if (this.curPage > this.pages) {
			this.pageNumber = this.pages;
		} else {
			this.pageNumber = this.curPage;
		}

		// 一些页码边界属性的判断
		this.isFirstPage = this.pageNumber === 1;
		this.isLastPage = this.pageNumber === this.pages;
		this.hasPreviousPage = this.pageNumber > 1;
		this.hasNextPage = this.pageNumber < this.pages;

		// 导航页码数
		this.navPages = navPages ? navPages : 8;

		// 记录当前显示的页码，数组形式
		this.navPageNumbers = [];

		this.calNavPageNumbers();
	}

	/**
	 * 计算导航页数组内容
	 * @return {数组} 导航页数字列表
	 */
	Pager.prototype.calNavPageNumbers = function() {
		var i, startNum, endNum, leftNum, rightNum;

		// 当总页数小于或等于导航页码数
		if (this.pages <= this.navPages) {
			for (i = 0; i < this.pages; i++)
			this.navPageNumbers[i] = i + 1;
		} else {	// 当总页数大于导航页数时
			leftNum = Math.floor(this.navPages / 2);
			rightNum = this.navPages - leftNum;

			startNum = this.pageNumber - leftNum;
			endNum = this.pageNumber + rightNum;

			if (startNum < 1) {	// 从开始算起的导航页
				startNum = 1;

				for (i = 0; i < this.navPages; i++) {
					this.navPageNumbers[i] = startNum++;
				}
			} else if (endNum > this.pages) {	// 尾部记录的导航页
				endNum = this.pages;
				for (i = this.navPages - 1; i >= 0; i--) {
					this.navPageNumbers[i] = endNum--;
				}
			} else {	// 中间记录的导航页
				for (i = 0; i < this.navPages; i++) {
					this.navPageNumbers[i] = startNum++;
				}
			}
		}
	}

	Pager.prototype.output = function (o, currentPage) {
		var result = '', i, num;

		if (!this.isFirstPage) {
			result += '<li><a href="#" page="1" title="' + o.titleFirst + '">' + o.txtFirst + '</a></li>';
		}
		if (this.hasPreviousPage) {
			result += '<li><a href="#" page="' + (this.curPage - 1) + '" title="' + o.titlePrevious + '">' + o.txtPrevious + '</a></li>';
		}

		for (i = 0; i < this.navPageNumbers.length; i++) {
			num = this.navPageNumbers[i];
			if (num === currentPage) {
				result += '<li class="active"><a href="#">' + num + '</a></li>';
			} else {
				result += '<li><a href="#" page="' + num + '">' + num + '</a></li>';
			}
		}

		if (this.hasNextPage) {
			result += '<li><a href="#" page="' + (this.curPage + 1) + '" title="' + o.titleNext + '">' + o.txtNext + '</a></li>';
		}
		if (!this.isLastPage) {
			result += '<li><a href="#" page="' + this.pages + '" title="' + o.titleLast + '">' + o.txtLast + '</a></li>';
		}

		return result;
	}

	var _appendPager = function($table, o, remotePaper) {
		var $pDiv, info, numbers, pager, from, to, stat;

		// 判断是否是自动添加分页栏还是在页面上的某个元素下面生成分页栏
		if (o.autoAppendPage) {
			$pDiv = $('<div class="basicGridPager"></div>');
			if (_notFirstLoad($table)) {
				$pDiv = $('.basicGridPager');
			}
		} else {
			$pDiv = $(o.pageEl);
		}
		// $('div', $pDiv).remove();
		// 首先对div内部做清除操作，防止多次插入内容
		$pDiv.empty();
		
		// 如果没有数据，则不显示分页栏
		if (!(o.data && o.data.length > 0)) {
			$pDiv.hide();
			return;
		} else {
			$pDiv.show().addClass('clearfix');
		}

		pager = new Pager(remotePaper['total'], remotePaper['page'], remotePaper['size']);	// total, page, size
		from = (pager.curPage - 1) * pager.size + 1;
		to = from + pager.size -1;
		if (to > pager.total) {
			to = pager.total;
		}

		info = '<div class="pager-info">';
		stat = o.pageInfo;
		stat = stat.replace(/{from}/, from);
		stat = stat.replace(/{to}/, to);
		stat = stat.replace(/{total}/, pager.total);
		stat = stat.replace(/{curPage}/, pager.curPage);
		stat = stat.replace(/{pages}/, pager.pages);
		info += stat + '</div>';

		numbers = '<div class="pagination"><ul>';

		numbers += pager.output(o, pager.curPage);

		numbers += '</ul></div>';

		$pDiv.append(info).append(numbers);
		$table.after($pDiv);

		_bindEvent2Pager($table, $pDiv);
	};

	var _bindEvent2Pager = function($table, $pager) {
		$('.pagination a', $pager).click(function(e) {
			var $this = $(this);

			e.preventDefault();

			var page = $this.attr('page');

			_addParam2Data($table, 'page', parseInt(page));
			console.log($table.data(paramDataName));

			_buildTable($table);
		});
	}

	/**
	 * 增加一些扩展属性
	 */
	var addExtraParams = function(params) {
		if ($.isEmptyObject(params)) return;

		return this.each(function () {
			var $table = $(this);
			_addParam2Data($table, params);

		});
	};

	var reload = function(url) {
		showTable(this);

		return this.each(function() {
			var $table = $(this);
			if (url && url !== $this.settings.url) {
				$this.settings.url = url;
				_resetData($table, $this.settings);
			}
			_buildTable($table);
		});

	};

	var showTable = function (ctx) {
		if ($this.settings.hidden) {
			$this.settings.hidden = false;

			var c = ctx ? ctx : this;
			return c.each(function() {
				$(this).show();
			});
		}
	}

	var methods = {
		init: init,
		showTable: showTable,
		reload: reload,
		addExtraParams: addExtraParams,
		settings: function() {
			return this.settings;
		},

		// 返回版本号
		version: function() {
			return version;
		}
	};

	$.fn.basicGrid = function (method) {

		if ( methods[method] ) {
			return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || !method ) {
			return methods.init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.basicGrid' );
		}

	};

}(jQuery));
