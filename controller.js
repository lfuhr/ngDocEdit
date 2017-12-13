'use strict';
// definieren eines Moduls
var app = angular.module("app", []);

app.config(['$compileProvider', function ($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(|blob|):/);
}]);

// hinzufügen eines Controllers zum Modul
app.controller("HelloWorldController", function ($scope, $window, $filter) {
   	$scope.rules = [
   		{
   			name: "Ein name",
     		desc: "Beschreibung"
 		}
	]

   	$scope.add = function() {
    	$scope.rules.push(   		{
   			name: "Ein name",
 		})
	}


	$scope.download = function() {
		var data = $filter('json')($scope.rules);
		var blob = new Blob([data], { type: 'text/plain' });
	    var url = $window.URL || $window.webkitURL;
	    return url.createObjectURL(blob);
	}
});