'use strict';
// Syntax Highlighting
hljs.initHighlightingOnLoad();

/* JSON-like formatting functions
/*============================================================================*/
function obj2src(obj) {
    var functions = [], others = []
    for (var key in obj) {
        if (key.startsWith('$$')) { continue; }
        else if (typeof(obj[key]) == 'function')
            functions.push(key + ": " + obj[key].toString())
        else
            others.push(key + ": " + JSON.stringify(obj[key]))
    }
    return others.concat(functions).join(',\n')
}
function arr2src(arr) {
    var depth = 1;
    function indent(str) {
        return str.replace(/(?:\r\n|\r|\n)/g, '\n' + '  '.repeat(depth));
    }
    return '[\n{' + arr.map( function(obj) {
        return indent('\n' + obj2src(obj))
    }).join('\n},\n{') + '\n}\n]'
}


/* Angular Template Engine
/*============================================================================*/
// Define model
var app = angular.module("app", []);

// Allow download from blob
app.config(['$compileProvider', function ($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(|blob|):/);
}]);


// Output Filters
app.filter('string', function () {
    return function(input) { return input.toString(); };
});
app.filter('obj2src', function () { return obj2src; });
app.filter('arr2src', function () { return arr2src; });
app.filter('evalsOn', function() {
    var evalfunctions = ["diagram","element","package","structured"];
    return function(input){
        return Object.keys(input).filter(function(property){
            return evalfunctions.indexOf(property) > -1
        }).join(', ')
    };
});
app.filter('requirements', function () { return function(rule, rules) {
    return (validationRules.filter(function(otherRule){
        return otherRule.requiredBy && otherRule.requiredBy.indexOf(rule.ID) > -1
    }).map(function(r){return r.ID})).join(', ');
}; });


// 2-Way code-string conversion
app.directive('codestring', function() { return {
        restrict: 'A', require: 'ngModel',
        link: function(scope, element, attr, ngModel) {
            ngModel.$parsers.push( JSON.parse );
            ngModel.$formatters.push( JSON.stringify);
//            ngModel.$parsers.push(function () {
//                ngModel.$setValidity('codestring', false); });
} }; });


// Provides variables to the code
app.controller("controller", function ($scope, $window, $filter) {

    $scope.rules = validationRules; // load data

    // Download object JSON formatted
    $scope.dljson = function(arr) {
        var data = arr2src(arr);
        var blob = new Blob([data], { type: 'text/plain' });
        var url = $window.URL || $window.webkitURL;
        return url.createObjectURL(blob);
    };
    $scope.removeRule = function(index) {
        $scope.rules.splice(index, 1);
    };
});