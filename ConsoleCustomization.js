
///////////////////////////////////////////////////////////////
//  Append this file to the contents of 
//  %GoogleChromeInstallationDir%/Application/%Version%/Resources/Inspector/DevTools.js
//  to have support for tags on console messages.
//
//  You can view/hide messages based on the tags.
//
//  Text in a log message with-in '::' will be treated as a tag.
//  For example, in the message   
//      ::History:: Failed to contact server
//  ::History:: is a tag. 
////////////////////////////////////////////////////////////////


WebInspector.ConsoleMessage.prototype._oldToMessageElement = WebInspector.ConsoleMessage.prototype.toMessageElement;
var _tagManager = new (function(){
    this.tags = {};
    this.showMessagesWithoutTags = true;
    this._hash = function(tag){
        return tag.replace(/[\W]/g, '-');
    };
    this.getStyle = function(tag){
        var h = this._hash(tag);
        if (this.tags[h]) {
            return this.tags[h];
        }
        this.tags[h] = this._createStyle(h);
        this.tags[h].tagLabel = tag;
        this.tags[h].visible = true;
        return this.tags[h];
    };
	this._newColor=function(){
		var colors = ['0','3','6','9','C', 'F'];
        var r = Math.floor(Math.random() * 1000) % 6;
        var g = Math.floor(Math.random() * 1000) % 6;
        var b = Math.floor(Math.random() * 1000) % 6;
        
		var bg = "#"+colors[r]+colors[g]+colors[b];
		var fg = g>=4?'#000':'#fff';
		return {bg: bg, fg:fg};
	};
    this._createStyle = function(h){
		var c = this._newColor();
        var s = {
            className: h,
            labelStyle: {
                backgroundColor: c.bg,
                color: c.fg,
            }
        }
        this._addConextMenuListener();
        return s;
    };
    var _contextMenuAction = function(){
        
        var label = this.label;
        var tagManager = this.tagManager;
        var h = tagManager._hash(label);
        var item = tagManager.tags[h];
        if (item) {
            item.visible = !item.visible;
        }
        else {
            switch (label) {
                case 'ToggleTags':
                    for (var h in tagManager.tags) {
                        tagManager.tags[h].visible = !tagManager.tags[h].visible;
                    }
                    break;
                case 'WithoutTag':
                    tagManager.showMessagesWithoutTags = !tagManager.showMessagesWithoutTags;
                    break;
            }
        }
        tagManager.resetMessageVisiblity();
    };
    this._onContextMenu = function(event){
        var contextMenu = new WebInspector.ContextMenu();
        contextMenu.appendSeparator();
		var sortedTags = [];
		for(var h in this.tags){
			sortedTags.push(h);
		}
		sortedTags.sort();
        for (var i=0; i<sortedTags.length; i++) {
			var h = sortedTags[i];
            var label = this.tags[h].tagLabel;
            var checked = !!this.tags[h].visible;
            contextMenu.appendCheckboxItem(WebInspector.UIString(label), _contextMenuAction.bind({
                label: label,
                tagManager: this
            }), checked);
        }
        contextMenu.appendCheckboxItem(WebInspector.UIString('Show Messages Without Tag'), _contextMenuAction.bind({
            label: 'WithoutTag',
            tagManager: this
        }), this.showMessagesWithoutTags);
        contextMenu.appendItem(WebInspector.UIString('Toogle Tags'), _contextMenuAction.bind({
            label: 'ToggleTags',
            tagManager: this
        }));
        contextMenu.show(event);
    };
    this._addConextMenuListener = function(){
        if (this._addedCMenuListener) {
            return;
        }
        this._top = document.getElementById('console-messages');
        if (!this._top) {
            return;
        }
        this._top.addEventListener("contextmenu", this._onContextMenu.bind(this), true);
        this._addedCMenuListener = true;
    };
    this.resetMessageVisiblity = function(){
        for (var h in this.tags) {
            var s = this.tags[h];
            var els = document.getElementsByClassName(s.className);
            for (var i = 0; i < els.length; i++) {
                var e = els[i];
                e.style.display = s.visible ? '' : 'none';
            }
        }
        var els = document.getElementsByClassName('notag');
        for (var i = 0; i < els.length; i++) {
            var e = els[i];
            e.style.display = this.showMessagesWithoutTags ? '' : 'none';
        }
        
    };
	this.getTags = function(str){
	    var re = /::(.+?)::/g;
		var r, tags = [];
	    while ((r = re.exec(str))) {
	        tags.push(r[0]);
	        //May want to limit to only one tag per line
	    }
		return tags;
	};
	this.decorateTag = function(tag){
		var s = this.getStyle(tag);
		var e = document.createElement("span");
		e.className = 'logLabel';
		style="border-radius: 100px; padding-left: 2px; padding-right: 2px;"
		e.style.color = s.labelStyle.color;
		e.style.backgroundColor = s.labelStyle.backgroundColor;
		e.style.borderRadius = "100px";
		e.style.paddingLeft = "2px";
		e.style.paddingRight = "2px";
		e.innerHTML = tag;
		return e;
    };
	this.decorateText = function(txt, formattedResult){
        var tags = this.getTags(txt);
        var left,right,ind;
        for(var k=0; k<tags.length; k++){
            var ind = txt.indexOf(tags[k]);
            var left = txt.substr(0, ind);
            var right = txt.substr(ind + tags[k].length);
            formattedResult.appendChild(document.createTextNode(left));
            var el = this.decorateTag(tags[k]);
            formattedResult.appendChild(el);                
            txt = right;
        }
        if(txt){
            formattedResult.appendChild(document.createTextNode(txt));              
        }
	}
})();
WebInspector.ConsoleMessage.prototype.toMessageElement = function(){
    var el = this._oldToMessageElement.apply(this);
    var txtSpan = el.getElementsByClassName("console-message-text")[0];
    var iHtml = txtSpan.innerHTML;
    var tags = [];
	tags = _tagManager.getTags(iHtml);
    if (tags.length) {
        for (var i = 0; i < tags.length; i++) {
            var s = _tagManager.getStyle(tags[i]);
            el.className += " " + s.className;
            el.style.display = s.visible ? '' : 'none';
        }
    }
    else {
        el.className += " notag";
        el.style.display = _tagManager.showMessagesWithoutTags ? '' : 'none';
    }
    return el;
};


WebInspector.ConsoleMessage.prototype._format = function(parameters){

    var formattedResult = document.createElement("span");
    if (!parameters.length) 
        return formattedResult;
    
    
    
    for (var i = 0; i < parameters.length; ++i) {
        if (typeof parameters[i] === "object") 
            parameters[i] = WebInspector.RemoteObject.fromPayload(parameters[i]);
        else 
            parameters[i] = WebInspector.RemoteObject.fromPrimitiveValue(parameters[i]);
    }
    
    
    var shouldFormatMessage = WebInspector.RemoteObject.type(parameters[0]) === "string" && this.type !== WebInspector.ConsoleMessage.MessageType.Result;
    
    
    if (shouldFormatMessage) {
    
        var result = this._formatWithSubstitutionString(parameters, formattedResult);
        parameters = result.unusedSubstitutions;
        if (parameters.length) 
            formattedResult.appendChild(document.createTextNode(" "));
		var iHtml = formattedResult.innerHTML;
		formattedResult.innerHTML='';
		//iHtml is not expected to have any markup here.
		//_formatWithSubstitutionString should result in plain text formatting only
        _tagManager.decorateText(iHtml, formattedResult);
    }
    
    
    for (var i = 0; i < parameters.length; ++i) {
    
        if (shouldFormatMessage && parameters[i].type === "string"){
			//formattedResult.appendChild(document.createTextNode(parameters[i].description));
			// changes made to introduce label support
			var txt = parameters[i].description;
			_tagManager.decorateText(txt, formattedResult);
		} 
        else 
            formattedResult.appendChild(WebInspector.console._format(parameters[i]));
        if (i < parameters.length - 1) 
            formattedResult.appendChild(document.createTextNode(" "));
    }
    return formattedResult;
};


