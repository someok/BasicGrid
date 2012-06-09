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
* 支持帮定查询表单（那些表格插件实现的查询功能定制基本都是鸡肋，至于那些在每列上面加个文本框来做所谓的filter，我都不知道这帮老外的项目是不是都确实那么简单？我知道那些插件也支持表单绑定，我的意思是那干嘛不去掉这功能得了，还能让js小点——好吧，需要这样功能的诸位就不要跟我较劲了）；
* 支持每列数据展示方式自定义；
* 支持一些简单的事件（例如跟树结合用的时候，点击树上节点可以出发表格刷新）。

暂时就这些了，如果以后还有其它需要就再加吧。

## 注意：此插件还在开发中！！！