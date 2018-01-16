'use strict'
// Syntax Highlighting
if ((typeof(hljs) != "undefined")) hljs.initHighlightingOnLoad()

angular.element(document).on('dblclick', 'code', function() {
    var range = document.createRange();
    range.selectNodeContents(this);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
})


/* JSON-like formatting function that can serialize functions
/*============================================================================*/
var TAB = '\t'; var LINEBREAK_TAB = /(?:\r\n\t|\r\t|\n\t)/g

function serialize(obj) {

	function indent(str) { return str.replace(/(?:\r\n|\r|\n)/g, '\n' + TAB) }

    if (obj === undefined) return 'undefined'
    if (obj === null) return 'null'

	switch (obj.constructor) {
		case Function:
			var funstring = obj.toString()
		    if (funstring.indexOf('\n') > -1)
    			while(funstring.split('\n')[1].indexOf(TAB + TAB)==0)
    				funstring = funstring.replace(LINEBREAK_TAB, '\n')
			return funstring
		case Array:
			return '[' + obj.map(
				function(value) { return indent('\n' + serialize(value))}
			).join(',') + '\n]'
		case Object:
			var result = []
			angular.forEach(obj, function(value, key)  {
				if (key.indexOf('$$') == -1) {
					if (!key.match(/[a-z_A-Z]*/)) key = angular.toJson(key)
					result.push(key + ': ' + serialize(value) )
					// note that upper key is a javscript key not a valid json one
			}
			})
			return '{' + indent('\n' + result.join(',\n')) + '\n}'
		default:
			return angular.toJson(obj)
	}
}

/* Angular Template Engine
/*============================================================================*/
// Define model
var templateEngine = angular.module("app", [])

// Allow raw html
.config(function($sceProvider) {$sceProvider.enabled(false)})

// Allow download from blob
.config(['$compileProvider', function ($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(|blob|):/)
}])


// Output Filters
.filter('string', function () {
    return function(input) { return input.toString() }
})
.filter('highlight', function() {
  return function(input, lang) {return hljs.highlight('javascript', input).value }
})
//.filter('unsafe', function($sce) { return $sce.trustAsHtml })
.filter('serialize', function() { return serialize })
.filter('unindent', function() {return function(str, n) {
    for (var i = 0; i < (n || 1); i++) {
        str = str.replace(LINEBREAK_TAB, '\n')}
    return str
}})
.filter('strip_wrapping', function() { return function(json) {
    return json.replace(LINEBREAK_TAB, '\n').split('\n').slice(1, -1).join('\n')
}})


// 2-Way code-string conversion
.directive('codestring', function() { return {
        restrict: 'A', require: 'ngModel',
        link: function(scope, element, attr, ngModel) {
            ngModel.$parsers.push( angular.fromJson )
            ngModel.$formatters.push( angular.toJson)
} } })
.directive('tocSupervised', ['$timeout', function(timeout){
    return {
        restrict: 'C',
        link : function(scope, elm, attrs, ngModel) {
            function updateHeadlines() {
                scope.headlines=[]
                angular.forEach(elm[0].querySelectorAll('h1,h2,h3,h4,h5,h6'), function(e){
                    scope.headlines.push({
                        level: e.tagName[1],
                        label: angular.element(e).text(),
                        element: e
                    })
                })
            }
            scope.$on('$destroy',function(){  scope.headlines=[]  }) // avoid memoryleaks from dom references
            scope.scrollTo=function(headline){  headline.element.scrollIntoView()  }
            scope.$watch('data', updateHeadlines, true)
            timeout(updateHeadlines)
        }
    }
}])
.directive("contenteditable", function() {
  return {
    restrict: "A",
    require: "ngModel",
    link: function(scope, element, attrs, ngModel) {
      function read() {
        ngModel.$setViewValue(element.html())
      }
      ngModel.$render = function() {
        element.html(ngModel.$viewValue || "")
      }
      element.bind("blur keyup change", function() {
        scope.$apply(read)
      })
    }
  }
})


// Provides variables to the code
.controller("controller", function ($scope, $window, $filter) {

    $scope.data = jsonData // load data

    // Download object JSON formatted
    $scope.updataBloburl = function(data) {
        console.log((data.match(/\n/g) || []).length)
        var data = "jsonData = " + data
        data = data.replace(/(?:\r\n|\r|\n)/g, '\r\n') // Windows
        var blob = new Blob([data], { type: 'text/plain' })
        $scope.bloburl = URL.createObjectURL(blob)
        if (window.navigator && window.navigator.msSaveOrOpenBlob) { // for IE
            window.navigator.msSaveOrOpenBlob(blob, "jsonData.js")
            return false
        } else return true  // For any other Browser
    }
})