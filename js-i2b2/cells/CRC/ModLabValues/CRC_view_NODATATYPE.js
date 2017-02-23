/**
 * @projectDescription	(GUI-only) Master Controller for CRC Query Tool's Value constraint dialog boxes.
 * @inherits 	i2b2.CRC.view
 * @namespace	i2b2.CRC.view.valueBox.NUMBER
 * @author		Bhaswati Ghosh
 * @version 	
 * ----------------------------------------------------------------------------------------
 */

i2b2.CRC.view.NODATATYPE = {
	formdata: {},
	cfgTestInfo: {
		name: 'RND-TEST',
		flagType: 'NA',
		flags: [],
		valueValidate: {
			onlyPos: false,
			onlyInt: false,
			maxString: 0 
		},
		valueType: '',
		valueUnitsCurrent: 0, // index into Units[]
		valueUnits: {},
		rangeInfo: {},
		enumInfo: {}
	},
	
	// ================================================================================================== //
	getHTML  : function(){
		var thisHTML = "No html available at this time.";
		//Read the html from certain path
		var url = "js-i2b2/cells/CRC/ModLabValues/CRC_view_NODATATYPE.html";
		var response = new Ajax.Request(url, {method: 'get', asynchronous: false});
		console.dir(response);
		if (response.transport.statusText=="OK") {
			thisHTML = response.transport.responseText;
		} else {
			alert('A problem was encounter while loading the html for the value type!');
			return false;
		}
		return thisHTML;
	},
	
	// ================================================================================================== //
	Initialize: function(panelIndex, queryPanelController, key, extData, isModifier, pluginObj) {
		// save info for callback
		this.qpi = panelIndex;
		this.cpc = queryPanelController;
		this.isModifier = isModifier;
		this.itemNumber = extData.itemNumber;
		this.htmlID = extData.renderData.htmlID;
		this.key = key;
		this.i2b2Data = extData;
		this.pluginCallerObj = pluginObj;
	},
	
	// ================================================================================================== //
	showDialog: function(panelIndex, queryPanelController, key, extData, isModifier, pluginObj) {
		var fd = this.formdata;
		var dm = i2b2.CRC.model.queryCurrent.panels[i2b2.CRC.ctrlr.QT.temporalGroup][panelIndex];
		this.Initialize(panelIndex, queryPanelController, key, extData, isModifier, pluginObj);
		
		// Create SimpleDialog control
		if (this.sd) {
			this.sd = null;
		}
		this.sd = new YAHOO.widget.SimpleDialog("itemLabRange", {
			zindex: 700,
			width: "600px",
			fixedcenter: true,
			constraintoviewport: true,
			modal: true,
			buttons: [{
				text: "OK",
				isDefault: true,
				handler: 
					(function() {
						var closure_qpi = i2b2.CRC.view.NODATATYPE.qpi;
						var closure_number = i2b2.CRC.view.NODATATYPE.itemNumber;
						// submit value(s)
						if (this.submit()) {
							if(!i2b2.CRC.view.NODATATYPE.pluginCallerObj){
								var pd = i2b2.CRC.model.queryCurrent.panels[i2b2.CRC.ctrlr.QT.temporalGroup][closure_qpi];
								// find the correct item in the panel
								for (var i=0; i<pd.items.length; i++) {
									if (pd.items[i].itemNumber==closure_number) {
										if (i2b2.CRC.view.NODATATYPE.isModifier) {
											pd.items[i].ModValues = i2b2.CRC.view.NODATATYPE.i2b2Data.ModValues;
										} else {
											pd.items[i].LabValues = i2b2.CRC.view.NODATATYPE.i2b2Data.LabValues;										
										}
										break;
									}
								}
								// update the panel/query tool GUI
								i2b2.CRC.ctrlr.QT.doSetQueryName.call(this, '');
								
								i2b2.CRC.view.NODATATYPE.formatLabValues(i2b2.CRC.view.NODATATYPE.i2b2Data.itemNumber, pd);
								i2b2.CRC.view.NODATATYPE.cpc._renameConceptByValueChooser(i2b2.CRC.view.NODATATYPE.i2b2Data.itemNumber, i2b2.CRC.view.NODATATYPE.isModifier, pd);
								
								delete i2b2.CRC.view.NODATATYPE.isModifier;
								i2b2.CRC.view.NODATATYPE.cpc._redrawDates(pd);
							}
							else
							{
								i2b2.CRC.view.NODATATYPE.formatLabValues(i2b2.CRC.view.NODATATYPE.i2b2Data.itemNumber, null);
								i2b2.CRC.view.NODATATYPE.pluginCallerObj.conceptsRenderFromValueBox();
							}
						}
					})
				}, {
				text: "Cancel",
				handler: (function(){ this.cancel(); })			
			}]
		});
		
		this.sd.setBody(this.getHTML());
		$('itemLabRange').show();
		
		this.sd.validate = this.ValidateSave;  // attach the validation function from this class
		this.sd.render(document.body);
		
		this.addHandlers();  // register for actions upon the modal DOM elements
		
		//Read the concept code
		var conceptCode = null;
		try{
			var conceptCode = i2b2.h.getXNodeVal(extData.origData.xmlOrig, 'basecode');
		}
		catch(e)
		{
			console.error(e);
		}
		
		var mdnodes = i2b2.h.XPath(extData.origData.xmlOrig, 'descendant::metadataxml/ValueMetadata[Version]');
		
		if (mdnodes.length > 0) {
			this.cfgByMetadata(mdnodes[0],conceptCode);
		} else {
			// no LabValue configuration
			return false;
		}
		
		if (!i2b2.CRC.view.NODATATYPE.isModifier) {
			if(!i2b2.CRC.view.NODATATYPE.pluginCallerObj){
				if (!this.i2b2Data.LabValues && this.i2b2Data.origData.LabValues) {
					// copy server delivered Lab Values to our scope
					this.i2b2Data.LabValues = this.i2b2Data.origData.LabValues;
				}
				var tmpLab = this.i2b2Data.LabValues;
			}
			else
				var tmpLab = i2b2.CRC.view.NODATATYPE.pluginCallerObj.currentTerm.LabValues;
		}
		
		// load any data already attached to the node
		if (tmpLab) {
			switch(tmpLab.MatchBy) {
				case "VALUE":					
					fd.selectedType = "NONE";
					$('mlvfrmTypeNONE').checked = true;
					break;
				default:
					break;
			}
		}
		else 
		{
			// set the form to show value selection if available
			$("mlvfrmTypeNONE").checked = true;
			fd.selectedType = 'NONE';
		}
		
		this.sd.show();
		this.Redraw();
	},
	
	// ================================================================================================== //
	ValidateSave: function() {
		var fd = i2b2.CRC.view.NODATATYPE.formdata;
		
		try
		{
			switch (fd.selectedType) {
				case "NONE":
					if (i2b2.CRC.view.NODATATYPE.isModifier) {
						delete i2b2.CRC.view.NODATATYPE.i2b2Data.ModValues;
					} else {
						delete i2b2.CRC.view.NODATATYPE.i2b2Data.LabValues;					
					}
					if(i2b2.CRC.view.NODATATYPE.pluginCallerObj)
						i2b2.CRC.view.NODATATYPE.pluginCallerObj.currentTerm.LabValues = i2b2.CRC.view.NODATATYPE.i2b2Data.LabValues;
					break;
				default:
					break;
			}
			return true;
		}
		catch(e)
		{
			alert("There were errors validating the input!");
			console.error(e);
		}
	},
	
	// ================================================================================================== //
	//Configure data model
	cfgByMetadata: function(refXML,conceptCode){
		// load and process the xml info
		var dm = i2b2.CRC.view.NODATATYPE.cfgTestInfo;
		var fd = i2b2.CRC.view.NODATATYPE.formdata;
		fd.selectedType= "NONE";
		dm.valueType = false;
		// set the title bar (TestName and TestID are assumed to be mandatory)
		this.sd.setHeader("Choose value of <span title='"+i2b2.h.getXNodeVal(refXML, 'TestName')+" (Test:"+i2b2.h.getXNodeVal(refXML, 'TestID')+")'>"+i2b2.h.getXNodeVal(refXML, 'TestName'));
		
		i2b2.CRC.view.NODATATYPE.Redraw();
	},
	
	// ================================================================================================== //
	
	changeHandler: function(e) {
		return;
	},
	
	// ================================================================================================== //
	addHandlers: function(){
		return;
	},
	
	// ================================================================================================== //
	Redraw: function(){
		$('mlvfrmTypeNONE').checked = true;
	},
	
	// ================================================================================================== //
	formatLabValues: function(key, pd){
		return;
	},
	
	parseLabValues: function(labValues,dataType){
		return false;
	}
};

