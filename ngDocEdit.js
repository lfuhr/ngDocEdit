// Syntax Highlighting if available
// if ((typeof(hljs) != "undefined")) hljs.initHighlightingOnLoad();

if (!Element.prototype.matches) {  Element.prototype.matches = Element.prototype.msMatchesSelector; } // IE fix

if(typeof($) === 'undefined') {
    var $ = function(arg) {
        if (typeof(arg) == 'string') return angular.element(document.querySelectorAll(arg))
        else return angular.element(arg)
    }
    $.parseHTML = function(str) {
      var tmp = document.implementation.createHTMLDocument('argForIE');
      tmp.body.innerHTML = str;
      return tmp.body.children;
    }
}

$(function () { // onload
    var editControls = getEditControlsCode()
    $('body').prepend($.parseHTML(editControls.html));
    $('head').append($.parseHTML(editControls.css));
    if (isIE()) $('[iehint]').css('display', 'inline');

    angular.forEach($('#editControls a'), function (e) {
        $(e).attr('title', e.dataset.role) .attr('href', 'javascript:void(0)');
    })
    .on('click', function () {
        switch (this.dataset.role) {
        case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6': case 'p':
            document.execCommand('formatBlock', false, this.dataset.role);
            break;
        case 'insertImage':
            var imgurl = window.prompt("Please enter an image URL (alternatively paste directly in the text to embed into html)", "tree.jpg");
            if (imgurl) document.execCommand('insertImage', false, imgurl);
            break;
        case 'createLink':
            var linkurl = window.prompt("Please enter a link URL", "http://example.com");
            if (linkurl) document.execCommand('createLink', false, linkurl);
            break;
        case 'editHtml':
            var code = window.prompt("Change plain HTML, use carefully!", getHTMLOfSelection());
            if (code) document.execCommand('insertHTML', false, code);
            break;
        case 'convertToPlainText':
            document.execCommand('insertHTML', false, window.getSelection());
            break;
        default:
            document.execCommand(this.dataset.role, false, null);
            break;
        // See https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand for more options
        }
    });
})




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
                        label: $(e).text(),
                        element: e
                    })
                })
                scope.$apply()
            }
            scope.$on('$destroy', function () {scope.headlines=[]}); // avoid memoryleaks from dom references
            scope.scrollTo = function (headline) { headline.element.scrollIntoView(); };
            element.on('input blur', updateHeadlines)
            observeDOM(element[0],updateHeadlines)
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
            	var div = $(document.createElement("div"))
            	for (var attr in attrs.$attr) {
	            	div.attr(attr, attrs[attr])
	            	element.removeAttr(attr)
	            }
            	element.append(div)
            	element = div
            }
        	// if(scope.readonly) { element.attr('contenteditable', false) }
    		scope.$watch('readonly', function(){console.log('watch');element.attr('contenteditable', !scope.readonly)})
            function read() {
                ngModel.$setViewValue(element.html() || undefined)
            }
            ngModel.$render = function() {
                element.html(ngModel.$viewValue)
            }
            element.on("input blur", function() { scope.$apply(read) })
            observeDOM(element[0],function() { scope.$apply(read) })
            element.on('keydown', function(event) {
            	if(event.which == 27 /*ESC*/) { element[0].blur() }
            })
} } })
.directive("blobdata", function() {
    return {
        restrict: "A",
        scope: { blobdata: '=' },
        link: function(scope, element, attrs) {
            var dl = function() {downloadBlob(scope.blobdata, attrs.filename)};
            if (element[0].tagName == 'BUTTON')
                element.on('click', dl);
            if ('ctrlS' in attrs || element[0].tagName == 'CTRL-S') {
                $(document).on('keydown', function(event) {
                    if((event.ctrlKey || event.metaKey) && (event.which == 83)) {
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
                var header = $('<h' + attrs.level + '></h' + attrs.level + '>');
                for (var attr in attrs.$attr) if (attr != 'level') header.attr(attr, attrs[attr])
                header.append(clone);
                element.replaceWith(header); // replace=true
            });
        }
    }
})
.directive('readonly', function() { // Set Readonly if no parameter e is in URL
    return {
        restrict: 'A',
        link: function(scope) {
        	setReadonly = function(arg) {scope.readonly = arg; scope.$apply()}
            scope.readonly = !location.search.substr(1).split("&").some(function(item){return item && item.split("=")[0] == 'e'})
        }
    }
})
.directive('input', ['$timeout', function(timeout) { // Variable level Heading
    return {
        restrict: 'E',
        link: function(scope, element, attrs) {
            // if (scope.readonly) element.attr('disabled', 'disabled')
            scope.$watch('readonly', function(){scope.readonly ? element.attr('disabled', 'disabled') : element.removeAttr('disabled')})
        }
    }
}])
.directive('wysiwyg', function() {
    return {
        restrict: 'C',
        link: function (scope, element, attrs) {
            // Enable / Disable Controls and make links clickable
            element.on('focusout', function () {
                if (!$('#editControls')[0].matches(":hover")) {
                    $('#editControls').css('display', 'none');
                    element.find('a').attr("contenteditable", "false").attr('target', '_blank');
                }
            }).on('focusin', function () {
                $('#editControls').css('display', 'inline')
                element.find('a').removeAttr("contenteditable");
            });


            // Paste image in Chrome (Firefox works out of the Box)
            element.on('paste', function(){
                var clipboardItem = event.clipboardData.items[0]
                if (clipboardItem && clipboardItem.kind == 'file') {
                    var reader = new FileReader();
                    reader.readAsDataURL(clipboardItem.getAsFile());
                    reader.onload = function (clipboardItem) {
                        document.execCommand('insertImage', false, reader.result);
                    };
                }
            })
        }
    }
})




/* ========================================================== */
/* =============== Functions ================================ */



// Simplified verion of http://jsfiddle.net/Y4BBq/
function getHTMLOfSelection() {
    var div = document.createElement('div');
    div.appendChild(window.getSelection().getRangeAt(0).cloneContents());
    return div.innerHTML;
}

function observeDOM(obj, callback){
        new window.MutationObserver(function(mutations){
            if( mutations[0].addedNodes.length || mutations[0].removedNodes.length ) {
                callback()
            }
        }).observe( obj, { childList:true, subtree:true });
};


/* JSON-like formatting function that can serialize functions */
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


// function insertHTML_IE(html) {
//  var range = window.getSelection().getRangeAt(0)
//  range.deleteContents();
//  var el = document.createElement("div");
//  el.innerHTML = html;
//  var frag = document.createDocumentFragment()
//  frag.appendChild(el.firstChild)
//  range.insertNode(frag)
// }


// function findGetParameter(parameterName) {
//     var result = null
//     location.search .substr(1) .split("&") .forEach(function (item) {
//         if (item.split("=")[0] === parameterName) 
//             result = decodeURIComponent(item.split("=")[1] || '');
//     });
//     return result;
// }

function getEditControlsCode() {return {
html: '<div id="editControls">\
 <a data-role="undo"><i class="fa fa-undo"></i></a>\
 <a data-role="redo"><i class="fa fa-repeat"></i></a>\
 &nbsp;\
 <a data-role="bold"><i class="fa fa-bold"></i></a>\
 <a data-role="italic"><i class="fa fa-italic"></i></a>\
 <a data-role="underline"><i class="fa fa-underline"></i></a>\
 <a data-role="strikeThrough"><i class="fa fa-strikethrough"></i></a>\
 &nbsp;\
 <a data-role="justifyLeft"><i class="fa fa-align-left"></i></a>\
 <a data-role="justifyCenter"><i class="fa fa-align-center"></i></a>\
 <a data-role="justifyRight"><i class="fa fa-align-right"></i></a>\
 <a data-role="justifyFull"><i class="fa fa-align-justify"></i></a>\
 &nbsp;\
 <a data-role="indent"><i class="fa fa-indent"></i></a>\
 <a data-role="outdent"><i class="fa fa-outdent"></i></a>\
 &nbsp;\
 <a data-role="insertUnorderedList"><i class="fa fa-list-ul"></i></a>\
 <a data-role="insertOrderedList"><i class="fa fa-list-ol"></i></a>\
 &nbsp;\
 <a data-role="insertImage"><i class="fa fa-picture-o"></i></a>\
 <a data-role="createLink"><i class="fa fa-link"></i></a>\
 <a data-role="unlink"><i class="fa fa-unlink"></i></a>\
 &nbsp;\
 <a data-role="h1">H1</a>\
 <a data-role="h2">H2</a>\
 <a data-role="h3">H3</a>\
 <a data-role="h4">H4</a>\
 <a data-role="h5">H5</a>\
 <a data-role="h6">H6</a>\
 <a data-role="p">p</a>\
 &nbsp;\
 <a data-role="subscript"><i class="fa fa-subscript"></i></a>\
 <a data-role="superscript"><i class="fa fa-superscript"></i></a>\
 &nbsp;\
 <a data-role="removeFormat"><i class="fa fa-eraser"></i></a>\
 <a data-role="convertToPlainText"><i class="fa fa-file-text"></i></a>\
 <a data-role="editHtml"><i class="fa fa-code"></i></a>\
 &nbsp;\
<span iehint>IE only partially supported</span>\
</div>',
css: '<style>\
#editControls {\
    position:fixed;\
    background: #555;\
    width: 100%;\
    z-index: 100;\
    display: none;\
    padding: 3px;\
}\
#editControls a {\
    padding: 3px;\
    text-decoration: none;\
    color: white;\
}\
span[iehint] { display: none; color: pink; }\
</style>'};
}
