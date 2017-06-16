/**
 * @projectDescription	(GUI-only) Master Controller for CRC Query Tool's Value constraint dialog boxes.
 * @inherits 	i2b2.CRC.view
 * @namespace	i2b2.CRC.view.valueBox.LRGSTR
 * @author		Bhaswati Ghosh
 * @version 	
 * ----------------------------------------------------------------------------------------
 */

i2b2.CRC.view.LRGSTR = {
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
		valueType: 'LRGSTR',
		valueUnitsCurrent: 0, // index into Units[]
		valueUnits: {},
		rangeInfo: {},
		enumInfo: {}
	},
	
	// ================================================================================================== //
	getHTML  : function(){
		var thisHTML = "No html available at this time.";
		//Read the html from certain path
		var url = "js-i2b2/cells/CRC/ModLabValues/CRC_view_LRGSTR.html";
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
		
		if (this.sd) {
			this.sd = null;
		}
		// Create SimpleDialog control
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
						var closure_qpi = i2b2.CRC.view.LRGSTR.qpi;
						var closure_number = i2b2.CRC.view.LRGSTR.itemNumber;
						// submit value(s)
						if (this.submit()) {
							if(!i2b2.CRC.view.LRGSTR.pluginCallerObj){
								var pd = i2b2.CRC.model.queryCurrent.panels[i2b2.CRC.ctrlr.QT.temporalGroup][closure_qpi];
								// find the correct item in the panel
								for (var i=0; i<pd.items.length; i++) {
									if (pd.items[i].itemNumber==closure_number) {
										if (i2b2.CRC.view.LRGSTR.isModifier) {
											pd.items[i].ModValues = i2b2.CRC.view.LRGSTR.i2b2Data.ModValues;
										} else {
											pd.items[i].LabValues = i2b2.CRC.view.LRGSTR.i2b2Data.LabValues;										
										}
										break;
									}
								}
								// update the panel/query tool GUI
								i2b2.CRC.ctrlr.QT.doSetQueryName.call(this, '');
								
								i2b2.CRC.view.LRGSTR.formatLabValues(i2b2.CRC.view.LRGSTR.i2b2Data.itemNumber, pd);
								i2b2.CRC.view.LRGSTR.cpc._renameConceptByValueChooser(i2b2.CRC.view.LRGSTR.i2b2Data.itemNumber, i2b2.CRC.view.LRGSTR.isModifier, pd);
								
								delete i2b2.CRC.view.LRGSTR.isModifier;
								i2b2.CRC.view.LRGSTR.cpc._redrawDates(pd);
							}
							else
							{
								i2b2.CRC.view.LRGSTR.formatLabValues(i2b2.CRC.view.LRGSTR.i2b2Data.itemNumber, null);
								i2b2.CRC.view.LRGSTR.pluginCallerObj.conceptsRenderFromValueBox();
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
		
		if (!i2b2.CRC.view.LRGSTR.isModifier) {
			if(!i2b2.CRC.view.LRGSTR.pluginCallerObj){
				if (!this.i2b2Data.LabValues && this.i2b2Data.origData.LabValues) {
					// copy server delivered Lab Values to our scope
					this.i2b2Data.LabValues = this.i2b2Data.origData.LabValues;
				}
				var tmpLab = this.i2b2Data.LabValues;
			}
			else
				var tmpLab = i2b2.CRC.view.LRGSTR.pluginCallerObj.currentTerm.LabValues;
		}
		else
		{
			if (!this.i2b2Data.ModValues && this.i2b2Data.origData.ModValues) {
				// copy server delivered Lab Values to our scope
				this.i2b2Data.ModValues = this.i2b2Data.origData.ModValues;
			}
			var tmpLab = this.i2b2Data.ModValues;
		}
		
		// load any data already attached to the node
		if (tmpLab) {
			switch(tmpLab.MatchBy) {
				case "VALUE":					
					fd.selectedType = "VALUE";
					$("mlvfrmTypeVALUE").checked = true;
					// select the correct numeric matching operator
					if (tmpLab.ValueString) {
						$('mlvfrmStrValue').value = tmpLab.ValueString;
						// var tn = $("mlvfrmStringOperator");
						// for (var i=0; i<tn.options.length; i++) {
							// if (tn.options[i].value == tmpLab.StringOp) {
								// tn.selectedIndex = i;
								// fd.numericOperator = tmpLab.StringOp;
								// break;
							// }
						// }
					}
					break;
				default:
					break;
			}
			if (tmpLab.DbOp) {
				var tn = $("mlvfrmDbOperator");
				tn.checked = true;
			}
		}
		else 
		{
			// set the form to show value selection if available
			$("mlvfrmTypeVALUE").checked = true;
			fd.selectedType = 'VALUE';
		}
		
		this.sd.show();
		this.Redraw();
	},
	
	// ================================================================================================== //
	ValidateSave: function() {
		var dm = i2b2.CRC.view.LRGSTR.cfgTestInfo;
		var fd = i2b2.CRC.view.LRGSTR.formdata;
		var tmpLabValue = {};
		var errorMsg = [];
		
		try
		{
			switch (fd.selectedType) {
				case "NONE":
					if (i2b2.CRC.view.LRGSTR.isModifier) {
						delete i2b2.CRC.view.LRGSTR.i2b2Data.ModValues;
					} else {
						delete i2b2.CRC.view.LRGSTR.i2b2Data.LabValues;					
					}
					if(i2b2.CRC.view.LRGSTR.pluginCallerObj)
						i2b2.CRC.view.LRGSTR.pluginCallerObj.currentTerm.LabValues = i2b2.CRC.view.LRGSTR.i2b2Data.LabValues;
					return true;
					break;
				case "VALUE":
					tmpLabValue.MatchBy = "VALUE";
					switch(dm.valueType) {
						case "LRGSTR":
							tmpLabValue.GeneralValueType = "LARGESTRING";
							tmpLabValue.SpecificValueType = "LARGESTRING";
							tmpLabValue.DbOp = fd.dbOperator;
							var sv = $('mlvfrmStrValue').value;
							if (dm.valueValidate.maxString && (sv.length > dm.valueValidate.maxString)) {
								errorMsg.push(" - Input is over the "+dm.valueValidate.maxString+" character limit.\n");
							} else if (sv.length == 0) {
								errorMsg.push("The text for this value are blank.");
							} else {
								tmpLabValue.ValueString = $('mlvfrmStrValue').value;
							}
							break;
						default:
							break;
					}
				break;
			}
			// bail on errors
			if (errorMsg.length != 0) {
				var errlst = errorMsg.uniq();
				var errlst = errlst.toString();
				alert('The following errors have occurred:\n'+errlst);
				delete tmpLabValue;
				return false;
			}
			// save the labValues data into the node's data element
			if (i2b2.CRC.view.LRGSTR.isModifier) {
				if (tmpLabValue) {
					i2b2.CRC.view.LRGSTR.i2b2Data.ModValues = tmpLabValue;
				} else {
					delete i2b2.CRC.view.LRGSTR.i2b2Data.ModValues;
				}
			} else { 
				if (tmpLabValue) {
					if(!i2b2.CRC.view.LRGSTR.pluginCallerObj)
						i2b2.CRC.view.LRGSTR.i2b2Data.LabValues = tmpLabValue;
					else
						i2b2.CRC.view.LRGSTR.pluginCallerObj.currentTerm.LabValues = tmpLabValue;
				} else {
					delete i2b2.CRC.view.LRGSTR.i2b2Data.LabValues;
				}
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
		var dm = i2b2.CRC.view.LRGSTR.cfgTestInfo;
		var fd = i2b2.CRC.view.LRGSTR.formdata;
		fd.selectedType= "NONE";
		
		// work with the data type
		try {
			var t = i2b2.h.getXNodeVal(refXML, 'DataType');
			switch(t) {
				case "largestring":
					dm.valueType = "LRGSTR";
					dm.valueValidate.onlyPos = false;
					dm.valueValidate.onlyInt = false;
					// extract max string setting
					try {
						var t = refXML.getElementsByTagName('MaxStringLength')[0].firstChild.nodeValue;
						t = parseInt(t);
					} catch(e) { 
						var t = -1;
					}
					if (t > 0) {
						dm.valueValidate.maxString = t;
					} else {
						dm.valueValidate.maxString = false;
					}
					break;
				default:
					dm.valueType = false;
			}
		} catch(e) {
			dm.valueType = false;
			dm.valueValidate.maxString = false;
		}
	
		// set the title bar (TestName and TestID are assumed to be mandatory)
		this.sd.setHeader("Choose value of <span title='"+i2b2.h.getXNodeVal(refXML, 'TestName')+" (Test:"+i2b2.h.getXNodeVal(refXML, 'TestID')+")'>"+i2b2.h.getXNodeVal(refXML, 'TestName'));
		if (dm.valueType) {
			$('mlvfrmTypeVALUE').checked = true;
		}
		else {
			$('mlvfrmTypeNONE').checked = true;
		}
		$('valueContraintText').innerHTML = "You are allowed to search within the narrative text associated with the term " + i2b2.h.getXNodeVal(refXML, 'TestName');
		
		$('mlvfrmDbOperator').checked = false;
		fd.dbOperator = $("mlvfrmDbOperator").checked;
		i2b2.CRC.view.LRGSTR.Redraw();
	},
	
	// ================================================================================================== //
	
	changeHandler: function(e) {
		var dm = i2b2.CRC.view.LRGSTR.cfgTestInfo;
		var fd = i2b2.CRC.view.LRGSTR.formdata;
		// get the DOM node that fired the event
		var tn;
		if (e.target) {
			tn = e.target;
		} else {
			if (e.srcElement) tn = e.srcElement;
			if (tn.nodeType == 3) tn = tn.parentNode;
		}
		// process
		switch(tn.id) {
			case "mlvfrmTypeNONE":
				fd.selectedType = 'NONE';
				break;
			case "mlvfrmTypeVALUE":
				fd.selectedType = 'VALUE';
				break;
			// case "mlvfrmStringOperator":
				// fd.stringOperator = tn.options[tn.selectedIndex].value;	
				// break;
			case "mlvfrmDbOperator":
				fd.dbOperator = tn.checked;	
				break;
			default:
				console.warn("onClick element was not captured for ID:"+tn.id)
		}
		tn.blur();
		i2b2.CRC.view.LRGSTR.Redraw();
	},
	
	// ================================================================================================== //
	addHandlers: function(){
		YAHOO.util.Event.addListener("mlvfrmTypeNONE", "click", this.changeHandler);
		YAHOO.util.Event.addListener("mlvfrmTypeVALUE", "click", this.changeHandler);
		// YAHOO.util.Event.addListener("mlvfrmStringOperator", "change", this.changeHandler);
		YAHOO.util.Event.addListener("mlvfrmDbOperator", "change", this.changeHandler);
		YAHOO.util.Event.addListener("mlvfrmStrValue", "keypress", (function(e) {
			// anonymous function
			if (e.keyCode==8 || e.keyCode==46) { return true; }
			var msl = i2b2.CRC.view.LRGSTR.cfgTestInfo.valueValidate.maxString;
			if (!msl || this.value.length < msl) {
				delete i2b2.CRC.view.LRGSTR.formdata.lastValidStr;
				return true;
			} else {
				if (!i2b2.CRC.view.LRGSTR.formdata.lastValidStr) {
					i2b2.CRC.view.LRGSTR.formdata.lastValidStr = this.value;
				}
				return true;
			}
		}));
		YAHOO.util.Event.addListener("mlvfrmStrValue", "keyup", (function(e) {
			// anonymous function
			if (i2b2.CRC.view.LRGSTR.formdata.lastValidStr) {
				this.value = i2b2.CRC.view.LRGSTR.formdata.lastValidStr;
			}
		}));
	},
	
	// ================================================================================================== //
	Redraw: function(){
		var fd = i2b2.CRC.view.LRGSTR.formdata;
		var dm = i2b2.CRC.view.LRGSTR.cfgTestInfo;
		
		if (!dm.valueType && fd.selectedType == "VALUE") {
			$('mlvfrmTypeVALUE').checked=true;
			fd.selectedType= "VALUE";
		}
		switch (fd.selectedType) {
			case "NONE":
				$('mlvfrmEnterStr').hide();
				$('mlvfrmEnterDbOperator').hide();
				break;
			case "VALUE":
				$('mlvfrmEnterStr').show();
				$('mlvfrmEnterDbOperator').show();
				break;
			default:
				break;
		}
	},
	
	// ================================================================================================== //
	formatLabValues: function(key, pd){
		if(!i2b2.CRC.view.LRGSTR.pluginCallerObj){
			for (var i=0; i< pd.items.length; i++) {
				if ((pd.items[i].origData.key == key)
							  || (pd.items[i].itemNumber == key)) {
					var rto = pd.items[i];
					break;
				}
			}
			if (undefined===rto) { return; }
			
			if(rto.origData && rto.origData.isModifier)
				var values = rto.ModValues;	
			else
				var values = rto.LabValues;	
		}
		else	
			var values = i2b2.CRC.view.LRGSTR.pluginCallerObj.currentTerm.LabValues;
		
		if(!values) return;

		var formattedLabValues = '';
		
		switch(values.MatchBy) {
			case "VALUE":
				if (values.GeneralValueType=="LARGESTRING") {
					formattedLabValues = ' [contains "' + i2b2.h.Escape(values.ValueString) + '"]' ;
				}
				break;
			default:
				break;
		}
		
		if(formattedLabValues)
			values.formattedLabValues = formattedLabValues;
		return formattedLabValues;
	},
	
	parseLabValues: function(labValues,dataType){
		return false;
	}
};

