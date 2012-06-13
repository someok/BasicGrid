# BasicGrid说明

jQuery的表格插件不少，不过能用且饱受推荐的那几个实在是重的令人发指。例如jqGrid、DataTables等。

功能确实强大的没边没界，不过我所需要的可就那么点东西啊。这些倒还是其次，最令人发指的是这些grid的css定制起来相当麻烦，jqGrid最讨厌的地方是跟jQuery UI绑定；

索性，自己实现个简单的符合自己用的就行了。我的要求其实很简单：

* 定制起来方便，最好不要在table之外包的里三层外三层的；
* 支持ajax后台取json数据（xml不考虑）；
* 支持分页；
* 支持点击标题行后台排序；
* 支持复选框（不要那种点击选整行的，看着含义不够明显）；
* 支持首列显示行号；
* 支持绑定查询表单（那些表格插件实现的查询功能定制基本都是鸡肋，至于那些在每列上面加个文本框来做所谓的filter，我都不知道这帮老外的项目是不是都确实那么简单？我知道那些插件也支持表单绑定，我的意思是那干嘛不去掉这功能得了，还能让js小点——好吧，需要这样功能的诸位就不要跟我较劲了）；
* 支持每列数据展示方式自定义；
* 支持一些简单的事件（例如跟树结合用的时候，点击树上节点可以触发表格刷新）。

----------

## 已实现：

* [X] 纯采用table实现
* [X] 支持三种展示方式：
  - 直接将数据作为参数置入 data 中，此种情况不会分页，数据格式是list；
  - 参数中定义了url，但是 pagination 设置为 false，则后台读取数据但不分页，数据格式同上；
  - 定义了url，且 pagination 为 true（默认值），后台读取数据，且前台出现分页栏。
* [X] 支持复选框，如果需要那种点击选整行的，已经提供了css了，自己定制下显示颜色吧
* [X] 支持首列显示行号
* [X] 所有样式可通过css定制，例如定制那个载入页面时候的菊花的css
* [X] 定义了多个事件，基本满足需求了
* [X] 支持添加附加参数，以便传递到后台
* [X] 提供了几个方法方便前台调用，例如reload（重建表格）、getSelectedItems（查看那些复选框被选中）
* [X] 支持初次进入页面的时候表格初始为隐藏状态，之后通过调用reload方法创建表格。这个在跟某些组件联动的时候比较有用，例如点击树上某个分支的时候才载入表格内容
* [X] 提供三个demo网页，怎么用基本上一目了然了

##尚未实现

* [ ] 支持点击标题行后台排序（这个在犹豫是否有必要）
* [ ] 序列号表单数据到请求中（这个是下一步要加的功能，等待项目实际用到的时候再加吧）

> **更新日志直接看 js 里面开头的注释吧**



