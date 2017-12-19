validationRules = [
{
  description: "Every Component and Port has a Stereotype referencing a profile",
  ID: "ASR1",
  element: function (element) {
    if (contains(["Component", "Port"], element.Type)) {
      if (element.Stereotype == "")
        this.found(DocLink(element) + " has no Stereotype.")
      else if (element.Stereotype == element.FQStereotype)
        this.found(DocLink(element) + " has non-profile-defined Stereotype.")
    }
  }
},
{ //--------------------------------------------------------------------------------------
  description: "Components are not allowed to have instances",
  ID: "ASR2",
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
    "State",
    "Activity",
    "Use Case"
  ],
  description: "Only diagrams of specified type",
  ID: "ASR3",
  diagram: function (diagram) {
    if (!contains(this.config, diagram.Type))
      this.found(diagram.Type + " is a forbidden diagram type.")
  }
},
{
  description: "Every FComp is within an FGroup",
  ID: "ASR4",
  element: function (element) {
    if (element.Stereotype.endsWith(".FComp") && (!element.ParentID ||
        !Repository.GetElementByID(element.ParentID).Stereotype.endsWith(".FGroup")))
      this.found(DocLink(element) + " is not within an FGroup.")
  }
},
{
  description: "At least one structural and one behavioral diagram.",
  config: {
    "structural": [
      "Component",
      "Package",
      "Logical"
    ],
    "behavioral": [
      "Sequence",
      "State",
      "Activity",
      "Use Case"
    ]
  },
  ID: "ASR5",
  diagram: function (diagram) {
    this.found(diagram.Type)
  },
  result: function () {
    var hasStructural = false
    var hasBehavioral = false
    for (var i in this.findings) {
      var type = this.findings[i]
      hasStructural = hasStructural || contains(this.config.structural, type)
      hasBehavioral = hasBehavioral || contains(this.config.behavioral, type)
      if (hasBehavioral && hasStructural) return {
        success: true,
        messages: []
      }
    }
    return {
      success: false,
      messages: ["Model has no " +
        (hasStructural ? "behavioral" : (hasBehavioral ? "structural" : "")) + " diagram."
      ]
    }
  }
},
{ //--------------------------------------------------------------------------------------
  description: "Packages and Elements need either a Note or a Linked Document",
  ID: "ASR6",
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
  description: "As of UML 2.0 only Steretypes can define tagged values",
  requiredBy: [
    "ASR9"
  ],
  ID: "ASR7",
  element: function (element) {
    for (var e = new Enumerator(element.TaggedValues); !e.atEnd(); e.moveNext()) {
      var tag = e.item()
      if (!tag.FQName.endsWith("::" + element.Stereotype + "::" + tag.Name))
        this.found('Tagged value "' + tag.Name + '" of ' + element.Type + ' "' +
          DocLink(element) + '" is not defined in stereotype "'+ element.Stereotype +'"')
    }
  }
},
{ //--------------------------------------------------------------------------------------
  description: "MDG Technology is loaded and has specified version",
  config: {
    "techName": "Mega",
    "requiredVersion": "1"
  },
  ID: "ASR8",
  result: function () {
    var actualVersion = Repository.GetTechnologyVersion(this.config.techName)
    return {
      success: (this.config.requiredVersion == actualVersion),
      messages: ["Version: " + actualVersion + (this.config.requiredVersion ==
        actualVersion ? "" : " (" + this.config.requiredVersion + " required)")]
    }
  }
},
{
  description: "Only allowed Element Types in Diagram",
  ID: "ASR9",
  config: {
    "Component": [
      "Port",
      "Component"
    ],
    "Activity": [
      "StateNode",
      "Activity"
    ]
  },
  diagram: function (diagram) {
    for (var e = new Enumerator(diagram.DiagramObjects); !e.atEnd(); e.moveNext()) {
      dgramobj = Repository.GetElementByID(e.item().ElementID)
      if (!contains(this.config[diagram.Type], dgramobj.Type))
        this.found('Diagram "' + DocLink(diagram) + '" has element "' +
          DocLink(dgramobj) + '" of type "' + dgramobj.Type)
    }
  }
}
]