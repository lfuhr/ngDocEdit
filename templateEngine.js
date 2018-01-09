'use strict';
// Syntax Highlighting
hljs.initHighlightingOnLoad();

/* JSON-like formatting functions
/*============================================================================*/
var TAB = '\t'; var LINEBREAK_TAB = /(?:\r\n\t|\r\t|\n\t)/g

function obj2src(obj) {
    function unindent(str) {
        return str.replace(LINEBREAK_TAB, '\n');
    }
    var functions = [], others = []
    for (var key in obj) {
        if (key.indexOf('$$') > -1) { continue; }
        else if (typeof(obj[key]) == 'function')
            functions.push(key + ": " + unindent(obj[key].toString()))
        else
            others.push(key + ": " + JSON.stringify(obj[key],null,TAB))
    }
    return others.concat(functions).join(',\n');
}
function arr2src(arr) {
    function indent(str) {
        return str.replace(/(?:\r\n|\r|\n)/g, '\n' + TAB);
    }
    return '[\n{' + arr.map( function(obj) {
        return indent('\n' + obj2src(obj))
    }).join('\n},\n{') + '\n}\n]'
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
.filter('obj2src', function () { return obj2src; })
.filter('arr2src', function () { return arr2src; })
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
.filter('highlight', function() {
  return function(input, lang) {return hljs.highlight('javascript', input).value; }
})
.filter('unsafe', function($sce) { return $sce.trustAsHtml; })


// 2-Way code-string conversion
.directive('codestring', function() { return {
        restrict: 'A', require: 'ngModel',
        link: function(scope, element, attr, ngModel) {
            ngModel.$parsers.push( JSON.parse );
            ngModel.$formatters.push( JSON.stringify);
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
        var data = "validationRules = " + arr2src($scope.rules) +
            "\ndocumentation = " + JSON.stringify($scope.docu,null,TAB)

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