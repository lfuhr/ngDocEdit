validationRules = [{
  description: "Every Component and Port has to have a Stereotype",
  ID: "ASR1",
  element: function(element) {
    if (element.Stereotype == "" && contains(["Component", "Port"], element.Type)) {
      this.findings.push(element.Name + " has no Stereotype.")
    }
  }
},
{
  description: "Components are not allowed to have instances",
  ID: "ASR2",
  element: function(element) {
    if (element.ClassifierID != 0) this.findings.push(element.Name + " is an instance.")
  }
},
{
  config: ["Component", "Package", "Logical", "Sequence", "State", "Activity", "Use Case"],
  description: "Only diagrams of specified type",
  ID: "ASR3",
  diagram: function(diagram) {
    if (!contains(this.config, diagram.Type))
      this.findings.push(diagram.Type + " is a forbidden diagram type.")
  }
},
{
  description: "Every FComp is within an FGroup",
  ID: "ASR4",
  element: function(element) {
    if (element.Stereotype.endsWith(".FComp") && (!element.ParentID ||
        !Repository.GetElementByID(element.ParentID).Stereotype.endsWith(".FGroup")))
      this.findings.push(element.Name + " is not within an FGroup.")
  }
},
{
  description: "At least one structural and one behavioral diagram.",
  config: {
    "structural": ["Component", "Package", "Logical"],
    "behavioral": ["Sequence", "State", "Activity", "Use Case"]
  },
  ID: "ASR5",
  diagram: function(diagram) {
    this.findings.push(diagram.Type)
  },
  result: function() {
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
{
  description: "Packages and Elements need either a Note or a Linked Document",
  ID: "ASR6",
  _auxiliary: function(item, type) {
    var hasLinkedDocument = item.GetLinkedDocument() != ""
    var hasNotes = item.Notes != ""
    if (!hasNotes && !hasLinkedDocument)
      this.findings.push(type + ' "' + item.Name + '" does not have a description')
    else if (hasNotes && hasLinkedDocument)
      this.findings.push(type + ' "' + item.Name + '" has both linked document and note"')
  },
  element: function(element) {
    this._auxiliary(element, element.Type)
  },
  package: function(package) {
    this._auxiliary(package.Element, "Package")
  }
},
{
  description: "As of UML 2.0 only Steretypes can define tagged values",
  requiredBy: ["ASR9"],
  ID: "ASR7",
  element: function(element) {
    for (var e = new Enumerator(element.TaggedValues); !e.atEnd(); e.moveNext()) {
      var tag = e.item()
      if (!tag.FQName.endsWith("::" + element.Stereotype + "::" + tag.Name))
        this.findings.push('Tagged value "' + tag.Name + '" of ' + element.Type + ' "' +
          element.Name + '" is not defined in stereotype "' + element.Stereotype + '"')
    }
  }
},
{
  description: "MDG Technology is loaded and has specified version",
  config: {
    "techName": "Mega",
    "requiredVersion": "1"
  },
  ID: "ASR8",
  result: function() {
    var actualVersion = Repository.GetTechnologyVersion("Mega")
    return {
      success: (this.config.requiredVersion == actualVersion),
      messages: ["Version: " + actualVersion + (this.config.requiredVersion == actualVersion ?
        "" : " (" + this.config.requiredVersion + " required)")]
    }
  }
},
{
  description: "Only allowed Element Types in Diagram",
  ID: "ASR9",
  config: {
    "Component": ["Port", "Component"],
    "Activity": ["StateNode", "Activity"]
  },
  diagram: function(diagram) {
    for (var e = new Enumerator(diagram.DiagramObjects); !e.atEnd(); e.moveNext()) {
      dgramobj = Repository.GetElementByID(e.item().ElementID)
      if (!contains(this.config[diagram.Type], dgramobj.Type))
        this.findings.push('Diagram "' + diagram.Name + '" has element "' + dgramobj.Name +
          '" has element "' + dgramobj.Type)
    }
  }
}
]