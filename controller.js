'use strict';
// definieren eines Moduls
var helloWorldModule = angular.module("helloWorldModule", []);



// hinzufügen eines Controllers zum Modul
helloWorldModule.controller("HelloWorldController", function ($scope) {
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
});