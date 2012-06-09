/**
 * $Id$
 */
//jsHint options
/*jslint devel: true, windows: true, passfail: false, evil: false, plusplus: true, white: true,
	jQuery: true */

(function ($) {

	'use strict';

	var version = '1.0.0';

	var $this;

	// 初始化
	var init = function(options) {
		$this = this;
		this.settings = $.extend({
			// 取后台数据的url，需注意，如果这个字段非空，那么data字段默认忽略
			url: "",

			// 静态数据，可用来生成非分页的表，需注意：此字段与url互斥
			// 如果使用了此字段的话，那么下面的几个key定义也就不必要了
			data: [],

			// json数据的key定义
			idKey: 'id',
			pageKey: 'page',
			totalKey: 'total',
			recordNumKey: 'totalRecords',
			rowsKey: 'rows',

			tableCls: 'basicGrid',	// table上的class
			width: '100%',	// 表格宽
			emptyTbodyText: 'The table is Empty',

			autoEncode: true,	// 是否对内容做encode处理
			rowNumCol: true,	// 是否显示行数
			rowNumColText: '&nbsp;',	// 行数列标题
			rowNumColWidth: '30px',
			rowNumColCls: 'rownum',

			altRows: true,	// 是否隔行显示不同颜色
			altRowCls: 'alt-row-color', // 隔行定义的css

			// 表格内容model
			// {} 对象格式，内容有：
			//   index: String
			//   text: String
			//   headCls: String
			//   headStyle: String
			//   hidden: boolean
			//   formatter: function格式，参数为： (tableData, rowData, index, colData)
			colModel: [],

			pageElId: '',		// 分页组件id
			currentPage: 0,		// 当前所在页数，从0开始
			pageSize: 20		// 每页记录数

			// event
			// onRowFilter: null,	// 行循环的时候触发的方法
			// onCellFilter: null	// 每个表格内容块触发的方法
		}, options);

		return this.each(function() {
			var $table = $(this);

			// 首先判断id的格式是否正确
			if (!/^\#[\w\-_]+$/i.test($this.selector)) {
				$.error('Table id [' + $this.selector + '] has wrong format!');
			}

			// 判断属性定义是否正确
			if (!_settingsValid($this.settings)) return;

			// 取得给定table的id
			this.tableId = $this.selector.slice(1);

			// 判断url是否为空，不空的话ajax读取数据
			// todo

			_createTable($table, $this.settings);
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

	var _createTable = function($table, o) {
		var colNum = 0, model, thead = '<thead><tr>';

		// 设置表格样式
		if (!$table.hasClass(o.tableCls)) {
			$table.addClass(o.tableCls);
		}
		if (o.width) {
			$table.attr('width', o.width);
		}

		// 遍历列并顺便创建标题行
		// 如果需要显示计数列，则需要加1
		if (o.rowNumCol) {
			colNum += 1;
			thead += '<th width="' + o.rowNumColWidth + '"';
			thead += ' class="' + o.rowNumColCls + '"';
			thead += '>' + o.rowNumColText + '</th>';
		};

		for (var i = 0; i < o.colModel.length; i++) {
			model = o.colModel[i];
			if (model.hidden) {
				continue;
			}

			colNum += 1;
			thead += '<th';
			// 设置标题列的样式
			if (model.headCls) {
				thead += ' class="' + model.headCls + '"';
			};
			if (model.headStyle) {
				thead += ' style="' + model.headStyle + '"';
			};

			thead += '>' + model.text + '</th>';

		};

		thead += '</tr></thead>'
		$table.append(thead);

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

				tbody += '<tr>';

				// 首先创建计数列
				if (o.rowNumCol) {
					colNum += 1;
					tbody += '<td class="' + o.rowNumColCls + '"';
					tbody += '>' + (i + 1) + '</th>';
				};

				// 创建实际的数据列
				for (var j = 0; j < o.colModel.length; j++) {
					model = o.colModel[j];
					if (model.hidden) {
						continue;
					};

					// 生成cell
					colData = row[model.index];

					if ($.isFunction(model.formatter)) {
						colData = model.formatter.call(null, o.data, row, i, colData);
					}
					tbody += '<td>' + colData + '</td>';

				};

				tbody += '</tr>';
			};

		}

		tbody += '</tbody>'
		$table.append(tbody);
	};

	var reload = function() {
		return this.each(function() {
			console.log(this);
		})
		console.log('reload..........');
	};

	var methods = {
		init: init,
		reload: reload,
		getSetting: function() {
			console.log(this.settings);
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
