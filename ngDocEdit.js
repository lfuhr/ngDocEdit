// Syntax Highlighting if available
if ((typeof(hljs) != "undefined")) hljs.initHighlightingOnLoad();


/* JSON-like formatting function that can serialize functions
/*============================================================================*/
var TAB = '\t'; var LINEBREAK_TAB = /(?:\r\n\t|\r\t|\n\t)/g;

function serialize(obj) {

	function indent(str) { return str.replace(/(?:\r\n|\r|\n)/g, '\n' + TAB); }

    if (obj === undefined) return 'undefined';
    if (obj === null) return 'null';

    switch (obj.constructor) {
        case Function:
            var funstring = obj.toString();
            if (funstring.indexOf('\n') > -1) {
                while(funstring.split('\n')[1].indexOf(TAB + TAB) == 0)
                    funstring = funstring.replace(LINEBREAK_TAB, '\n');
            }
            return funstring;
        case Array:
            return '[' + obj.map(
                function(value) { return indent('\n' + serialize(value));}
                ).join(',') + '\n]';
        case Object:
            var result = [];
            angular.forEach(obj, function(value, key)  {
                if (key.charAt(0) !== '$') {
                    if (!key.match(/[a-z_A-Z]*/)) key = angular.toJson(key);
                    // note that upper key is a javscript key not a valid json one
                    result.push(key + ': ' + serialize(value) );
                }
            })
            return '{' + indent('\n' + result.join(',\n')) + '\n}';
        default:
            return angular.toJson(obj);
    }
}

function downloadBlob(data, filename) {
    data = data.replace(/(?:\r\n|\r|\n)/g, '\r\n') // Windows
    var blob = new Blob([data], { type: 'text/plain' })
    if (window.navigator.msSaveOrOpenBlob) { // for IE
        window.navigator.msSaveOrOpenBlob(blob, filename);
    } else {
        var bloburl = URL.createObjectURL(blob)
        var a = document.createElement("a");
        a.href = bloburl;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(bloburl);
    }
    return false
}

function isIE() { return window.navigator.userAgent.indexOf('Trident') > -1 ||
	window.navigator.userAgent.indexOf('MSIE') > -1 }

/* Angular Template Engine
/*============================================================================*/
// Define model
var ngDocEdit = angular.module("ngDocEdit", [])

// Allow raw html everywhere, without explicitly trusting
.config(function($sceProvider) {$sceProvider.enabled(false)})
//.filter('unsafe', function($sce) { return $sce.trustAsHtml }) // Alternative

// // Allow download from blob (if upper is disabled)
// .config(['$compileProvider', function ($compileProvider) {
//     $compileProvider.aHrefSanitizationWhitelist(/^\s*(|blob|):/);
// }])


// Output Filters
.filter('string', function() {
    return function(input) { return input.toString(); };
})
.filter('highlight', function() {
  return function(input, lang) {return hljs.highlight('javascript', input).value; };
})
.filter('serialize', function() { return serialize; })
.filter('unindent', function() { return function(str, n) {
    for (var i = 0; i < (n || 1); i++) { str = str.replace(LINEBREAK_TAB, '\n'); }
    return str;
}})
.filter('strip_wrapping', function() { return function(json) {
    return json.replace(LINEBREAK_TAB, '\n').split('\n').slice(1, -1).join('\n');
}})


.directive('json', function() { return {
    restrict: 'A', require: 'ngModel',
    link: function(scope, element, attr, ngModel) {
        ngModel.$parsers.push( angular.fromJson );
        ngModel.$formatters.push( angular.toJson);
} }; })
.directive('code', function() { return { // Doubleclick to select
    restrict: 'E',
    link: function(scope, element, attr, ngModel) {
        element.on('dblclick', function() {
            var range = document.createRange();
            range.selectNodeContents(this);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        })
} }; })
.directive('tocSupervised', ['$timeout', function(timeout){
    return {
        restrict: 'C',
        link : function(scope, element, attrs, ngModel) {
            function updateHeadlines() {
                scope.headlines=[]
                angular.forEach(element[0].querySelectorAll('h1,h2,h3,h4,h5,h6'), function(e){
                    scope.headlines.push({
                        level: e.tagName[1],
                        label: angular.element(e).text(),
                        element: e
                    })
                })
            }
            scope.$on('$destroy', function () {scope.headlines=[]}); // avoid memoryleaks from dom references
            scope.scrollTo = function (headline) { headline.element.scrollIntoView(); };
            scope.$watch('data', updateHeadlines, true);
            timeout(updateHeadlines);
        }
    };
}])
.directive("contenteditable", function() {
    return {
        restrict: "A",
        require: "ngModel",
        link: function(scope, element, attrs, ngModel) {
            if (element[0].tagName =='TD') { // td not editable in IE+Edge
            	var div = angular.element(document.createElement("div"))
            	for (var attr in attrs.$attr) {
	            	div.attr(attr, attrs[attr])
	            	element.removeAttr(attr)
	            }
            	element.append(div)
            	element = div
            }
            function read() {
                ngModel.$setViewValue(element.html() || undefined)
            }
            ngModel.$render = function() {
                element.html(ngModel.$viewValue)
            }
            element.bind("blur keyup", function() { scope.$apply(read) })
            element.bind('keydown', function(event) {
            	if(event.which == 27 /*ESC*/) { element.blur() }
            })
} } })
.directive("blobdata", function() {
    return {
        restrict: "A",
        scope: { blobdata: '=' },
        link: function(scope, element, attrs) {
            var dl = function() {downloadBlob(scope.blobdata, attrs.filename)};
            if (element[0].tagName == 'BUTTON')
                element.bind('click', dl);
            if ('ctrlS' in attrs || element[0].tagName == 'CTRL-S') {
                angular.element(document).bind('keydown', function(event) {
                    if(event.ctrlKey && (event.which == 83)) {
                        event.preventDefault();
                        dl();
                        return false;
                    }
                });
            }
        }
    }
})
.directive('hx', function() { // Variable level Heading
	return {
		restrict: 'E',  transclude: true,
		link: function(scope, element, attrs, ctrl, transclude) {
			transclude(scope, function (clone) {
				var header = angular.element('<h' + attrs.level + '></h' + attrs.level + '>');
				for (var attr in attrs.$attr) if (attr != 'level') header.attr(attr, attrs[attr])
				header.append(clone);
        		element.replaceWith(header); // replace=true
    		});
		}
	}
})