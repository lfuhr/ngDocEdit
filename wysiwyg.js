var editControls = '<div id="editControls">\
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
</div>';

var controlStyles = '<style>\
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
</style>';

$(function () { // onload

    $('body').prepend($.parseHTML(editControls));
    $('head').append($.parseHTML(controlStyles));
    if (isIE()) $('[iehint]').show();

    $('#editControls a').each(function () {
        var e = $(this);
        e.attr('title', e.attr('data-role')).attr('href', 'javascript:void(0)');
    })
    .click(function () {
        switch ($(this).data('role')) {
        case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6': case 'p':
            document.execCommand('formatBlock', false, $(this).data('role'));
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
            document.execCommand($(this).data('role'), false, null);
            break;
        // See https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand for more options
        }
    });

    // Enable / Disable Controls and make links clickable
    $(document).on('focusout', '.wysiwyg', function () {
        if (!$('#editControls').is(":hover")) {
            $('#editControls').hide();
            $(this).find('a').attr("contenteditable", "false").attr('target', '_blank');
        }
    }).on('focusin', '.wysiwyg', function () {
        $('#editControls').show();
        $(this).find('a').removeAttr("contenteditable");
    });

}); // End onload


// Paste image in Chrome (Firefox works out of the Box)
$(document).on('paste', '.wysiwyg', function(){
    var clipboardItem = event.clipboardData.items[0]
    if (clipboardItem && clipboardItem.kind == 'file') {
		var reader = new FileReader();
		reader.readAsDataURL(clipboardItem.getAsFile());
		reader.onload = function (clipboardItem) {
			document.execCommand('insertImage', false, reader.result);
		};
    }
})


// Simplified verion of http://jsfiddle.net/Y4BBq/
function getHTMLOfSelection() {
    var div = document.createElement('div');
    div.appendChild(window.getSelection().getRangeAt(0).cloneContents());
    return div.innerHTML;
}

function isIE() { return window.navigator.userAgent.indexOf('Trident') > -1 ||
    window.navigator.userAgent.indexOf('MSIE') > -1 }


// function insertHTML_IE(html) {
// 	var range = window.getSelection().getRangeAt(0)
// 	range.deleteContents();
// 	var el = document.createElement("div");
// 	el.innerHTML = html;
// 	var frag = document.createDocumentFragment()
// 	frag.appendChild(el.firstChild)
// 	range.insertNode(frag)
// }