jsonData = {
title: "Enterprise Architect UML Model Validation",
author: "Ludwig Fuhr",
version: "0.1",
scope: "Public",
preamble: "\t\t    <h1>Purpose</h1><div>This is an editable visual documentation, a formal documentation and working source code all in one. There is only one artifact that is json-like javascript code. The visual view can be used to define rules that can be implemented later. The implementation can only be done in a external code editor. Enterprise Architect is recommended, because of autocompletion capabilities on its API and debugging.</div><h1>Usage</h1><h2>Editable visual view</h2><div>In the View you can add and remove rules. Empty but required fields are highlighted. Configuration is only shown when there is one.</div>        <h2>Coding</h2><p>A rule is defined in a javascript object. The script then collects all rules and evaluates them in one single iteration over the EA-Model.</p><p></p><ul><li>Put configurable parameters in the config field to make them editable in the visual view.<br></li><li>Use an underscore for self defined variables and functions for better readability</li></ul><p></p><p>Consult the EA-API for details of the items that are iterated through.</p><h3>Available properties</h3><div><ul><li><b>description, ID, fancy</b>&nbsp;The description an ID appear also in the generated validation report</li><li><b>package, diagram, element, connector</b> can be set to functions that are run on any of these items</li><li><b>findings</b>&nbsp;is an array for you to use</li><li><b>result</b>&nbsp;in its standard implementation is<br>&nbsp; &nbsp; return{success: this.findings.length == 0, messages: this.findings}<br>you can change this anyway you want as long as you keep the return type.</li><li><b>found </b>is a shortcut for findings.push</li></ul></div>        <h1>List of Rules</h1>",
rules: [
{
	title: "Every Component and Port has a Stereotype referencing a profile",
	ID: "VAL1",
	config: [
		"Component",
		"Port"
	],
	element: function (element) {
		if (this.config.includes(element.Type)) {
			if (element.Stereotype == "")
				this.found(DocLink(element) + " has no Stereotype.")
			else if (element.Stereotype == element.FQStereotype)
				this.found(DocLink(element) + " has non-profile-defined Stereotype.")
		}
	}
},
{
	title: "Components are not allowed to have instances",
	ID: "VAL2",
	description: "<p>Ein <b>Fettes </b>Wort</p><p><img src=\"https://www.autosar.org/typo3conf/ext/sysgtheme/Resources/Public/images/logo.png\"><b><br></b></p>",
	element: function (element) {
		if (element.ClassifierID != 0) this.found(DocLink(element) + " is an instance.")
	}
},
{
	config: [
		"Component",
		"Package",
		"Logical",
		"Sequence",
		"Statechart",
		"Activity",
		"Use Case"
	],
	title: "Only diagrams of specified type",
	ID: "VAL3",
	diagram: function (diagram) {
		if (!this.config.includes(diagram.Type))
			this.found(diagram.Type + " is a forbidden diagram type.")
	}
},
{
	title: "Every FComp is within an FGroup",
	ID: "VAL4",
	element: function (element) {
		if (element.Stereotype.endsWith("FComp") && (!element.ParentID ||
				!Repository.GetElementByID(element.ParentID).Stereotype.endsWith("FGroup")))
			this.found(DocLink(element) + " is not within an FGroup.")
	}
},
{
	title: "At least one structural and one behavioral diagram.",
	config: {
		structural: [
			"Component",
			"Package",
			"Logical"
		],
		behavioral: [
			"Sequence",
			"State",
			"Activity",
			"Use Case"
		]
	},
	ID: "VAL5",
	diagram: function (diagram) {
		this.found(diagram.Type)
	},
	result: function () {
		var config = this.config
		var hasStructural = false
		var hasBehavioral = false
		this.findings.forEach(function(type) {
			hasStructural = hasStructural || config.structural.includes(type)
			hasBehavioral = hasBehavioral || config.behavioral.includes(type)
		})
		if (hasBehavioral && hasStructural) return {
			success: true,
			messages: []
		}
		return {
			success: false,
			messages: ["Model has no " +
				(hasStructural ? "behavioral" : (hasBehavioral ? "structural" : "")) + " diagram."
			]
		}
	}
},
{
	title: "Packages and Elements need either a Note or a Linked Document",
	ID: "VAL6",
	_auxiliary: function (item, type) {
		var hasLinkedDocument = item.GetLinkedDocument() != ""
		var hasNotes = item.Notes != ""
		if (!hasNotes && !hasLinkedDocument)
			this.found(type + ' "' + DocLink(item) + '" does not have a description')
		else if (hasNotes && hasLinkedDocument)
			this.found(type + ' "' + DocLink(item) + '" has both linked document and note"')
	},
	element: function (element) {
		this._auxiliary(element, element.Type)
	},
	package: function (package) {
		this._auxiliary(package.Element, "Package")
	}
},
{
	title: "As of UML 2.0 only Steretypes can define tagged values",
	ID: "VAL7",
	element: function (element) {
		for (var e = new Enumerator(element.TaggedValues); !e.atEnd(); e.moveNext()) {
			var tag = e.item()
			if (!tag.FQName.endsWith("::" + element.Stereotype + "::" + tag.Name))
				this.found('Tagged value "' + tag.Name + '" of ' + element.Type + ' "' +
					DocLink(element) + '" is not defined in stereotype "'+ element.Stereotype +'"')
		}
	}
},
{
	title: "MDG Technology is loaded and has specified version",
	config: {
		techName: "AVL.VCU_MDG",
		requiredVersion: "0.1"
	},
	ID: "VAL8",
	result: function () {
		var actualVersion = Repository.GetTechnologyVersion(this.config.techName)
		if (actualVersion == '') actualVersion = 'none'
		return {
			success: (this.config.requiredVersion == actualVersion),
			messages: ["Version: " + actualVersion + (this.config.requiredVersion ==
				actualVersion ? "" : " (" + this.config.requiredVersion + " required)")]
		}
	}
},
{
	title: "Only allowed Element Types in Diagram",
	ID: "VAL9",
	requires: [
		"VAL3"
	],
	config: {
		Component: [
			"Port",
			"Component"
		],
		Activity: [
			"StateNode",
			"Activity"
		]
	},
	diagram: function (diagram) {
		for (var e = new Enumerator(diagram.DiagramObjects); !e.atEnd(); e.moveNext()) {
			dgramobj = Repository.GetElementByID(e.item().ElementID)
			if (! (diagram.Type in this.config)) this.found('Fatal: invalid diagram type ' + diagram.Type)
			else if (!this.config[diagram.Type].includes(dgramobj.Type))
				this.found('Diagram "' + DocLink(diagram) + '" has element "' +
					DocLink(dgramobj) + '" of type "' + dgramobj.Type)
		}
	}
},
{
	title: "Referred Stereotypes occur in a profile",
	ID: "VAL10",
	_xmi: function (doc) { // commented out for performance reasons
		var nodes = doc.selectNodes("/xmi:XMI/*[@__EAStereoName]/@base_Component")
		var invalidElements = {}
		for (i=0; i < nodes.length; i++) {
			var node = nodes.nextNode;
			if (! invalidElements.includes(node.text)) invalidElements[node.text] = undefined
		}
		for (guid in invalidElements) {
			var searchstring = "/xmi:XMI/xmi:Extension//*[@xmi:idref='" + guid + "']";
			var el = doc.selectSingleNode(searchstring)
			var stereo = doc.selectSingleNode(searchstring + '/properties/@stereotype')
			this.found('Stereotype ' + stereo.text +  ' of item ' +
				el.getAttribute('name') + ' is not defined in any Profile')
		}
	}
},
{
	title: "Only ports and no Components do not have Connectors",
	ID: "VAL11",
	element: function (element) {
		if (element.Type == 'Component' && element.Connectors.Count > 0)
			this.found(element.Name + " has direct connectors")
	}
},
{
	title: "All Connectors on Ports have the stereotype DataFlow",
	ID: "VAL12",
	config: "DataFlow",
	_portIDs: [
	],
	element: function (element) {
		if (element.Type == 'Port') this._portIDs.push(element.ElementID)
	},
	connector: function (c) {
		if ((this._portIDs.includes(c.SupplierID) || this._portIDs.includes(c.ClientID)) && c.Stereotype != this.config)
			this.found('Connector between ' + Repository.GetElementByID(c.SupplierID).Name + ' and ' +
				Repository.GetElementByID(c.ClientID).Name + 'has Stereotype ' + (c.Stereotype == 0 ? "none" : c.Stereotype))
	}
},
{
	title: "All DataFlows flow through Ports",
	ID: "VAL13",
	config: "DataFlow",
	_portIDs: [
	],
	element: function (element) {
		if (element.Type == 'Port') this._portIDs.push(element.ElementID)
	},
	connector: function (c, client, supplier) {
		if (c.Stereotype == this.config) {
			if (!this._portIDs.includes(c.SupplierID))
				this.found(this.config + ' on element ' + supplier.Name + ' not going through a port')
			if (!this._portIDs.includes(c.ClientID))
				this.found(this.config + ' on element ' + client + ' not going through a port')
		}
	}
},
{
	title: "Directions of connected ports differ.",
	ID: "VAL14",
	config: "DataPort",
	connector: function (c, client, supplier) {
		if (client && supplier && client.Type == 'Port' && supplier.Type == 'Port' &&
			client.Stereotype == this.config && supplier.Stereotype == this.config) {
			if (client.TaggedValues.GetByName('direction').Value == supplier.TaggedValues.GetByName('direction').Value)
				this.found('Connector between '+supplier.Name+' and '+client.Name+' have same direction.')
		}
	}
}
]
}
