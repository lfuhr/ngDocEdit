'use strict';
// Syntax Highlighting
hljs.initHighlightingOnLoad();

/* JSON-like formatting function that can serialize functions
/*============================================================================*/
var TAB = '\t'; var LINEBREAK_TAB = /(?:\r\n\t|\r\t|\n\t)/g

function serialize(obj, option) {
	const UNINDENT = 'unindent', STRIP_WRAPPING = 'strip_wrapping'

	function indent(str) { return str.replace(/(?:\r\n|\r|\n)/g, '\n' + TAB); }

    if (option == STRIP_WRAPPING && typeof(obj) == 'object')
    	return serialize(obj,UNINDENT).split('\n').slice(1, -1).join('\n')
    
    if (option == UNINDENT) return serialize(obj).replace(LINEBREAK_TAB, '\n');

    if (obj === undefined) return 'undefined'
    if (obj === null) return 'null'

	switch (obj.constructor) {
		case Function:
			var funstring = obj.toString()
		    if (funstring.indexOf('\n') > -1)
    			while(funstring.split('\n')[1].startsWith(TAB + TAB))
    				funstring = funstring.replace(LINEBREAK_TAB, '\n')
			return funstring;
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
					// upper is a javscript key not a json one
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
var app = angular.module("app", [])

// Allow download from blob
.config(['$compileProvider', function ($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(|blob|):/);
}])


// Output Filters
.filter('string', function () {
    return function(input) { return input.toString(); };
})
.filter('highlight', function() {
  return function(input, lang) {return hljs.highlight('javascript', input).value; }
})
.filter('unsafe', function($sce) { return $sce.trustAsHtml; })
.filter('serialize', function() { return serialize })


// Two filters that really depend on the context
.filter('evalsOn', function() { // Extract specific infos to the users
    var evalfunctions = ["diagram","element","package","structured"];
    return function(input){
        return Object.keys(input).filter(function(property){
            return evalfunctions.indexOf(property) > -1
        }).join(', ')
    };
})
.filter('requirements', function () { return function(rule, rules) {
    return (validationRules.filter(function(otherRule){
        return otherRule.requiredBy && otherRule.requiredBy.indexOf(rule.ID) > -1
    }).map(function(r){return r.ID})).join(', ');
}; })


// 2-Way code-string conversion
.directive('codestring', function() { return {
        restrict: 'A', require: 'ngModel',
        link: function(scope, element, attr, ngModel) {
            ngModel.$parsers.push( angular.fromJson );
            ngModel.$formatters.push( angular.toJson);
} }; })
.directive('tocSupervised', ['$timeout', function(timeout){
    return {
        restrict: 'C',
        link : function(scope, elm, attrs, ngModel) {
            function updateHeadlines() {
                scope.headlines=[];
                angular.forEach(elm[0].querySelectorAll('h1,h2,h3,h4,h5,h6'), function(e){
                    scope.headlines.push({
                        level: e.tagName[1],
                        label: angular.element(e).text(),
                        element: e
                    });
                });
            }
            // avoid memoryleaks from dom references
            scope.$on('$destroy',function(){
                scope.headlines=[];
            });
            // scroll to one of the headlines
            scope.scrollTo=function(headline){
                headline.element.scrollIntoView();
            }
            // Update if object content (3rd arg true) has changed
            scope.$watch('rules', updateHeadlines, true);
            scope.$watch('docu', updateHeadlines, true);
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
        ngModel.$setViewValue(element.html());
      }
      ngModel.$render = function() {
        element.html(ngModel.$viewValue || "");
      };
      element.bind("blur keyup change", function() {
        scope.$apply(read);
      });
    }
  };
})


// Provides variables to the code
.controller("controller", function ($scope, $window, $filter) {

    $scope.rules = validationRules; // load data
    $scope.docu = documentation;

    // Download object JSON formatted
    $scope.updatedownload = function() {
        var data = "validationRules = " + serialize($scope.rules,'unindent') +
            "\ndocumentation = " + serialize($scope.docu)

        data = data.replace(/(?:\r\n|\r|\n)/g, '\r\n');
        var blob = new Blob([data], { type: 'text/plain' });
        $scope.bloburl = URL.createObjectURL(blob);
        if (window.navigator && window.navigator.msSaveOrOpenBlob) { // for IE
            window.navigator.msSaveOrOpenBlob(blob, "validationRules.js");
            return false;
        } else { // For any other Browser
            return true;
        }
    };

    $scope.removeRule = function(index) {
        $scope.rules.splice(index, 1);
    };

    $scope.leadertext = "Editable"

});