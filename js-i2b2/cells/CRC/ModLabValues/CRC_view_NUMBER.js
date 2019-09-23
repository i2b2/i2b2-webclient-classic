/**
 * @projectDescription	(GUI-only) Master Controller for CRC Query Tool's Value constraint dialog boxes.
 * @inherits 	i2b2.CRC.view
 * @namespace	i2b2.CRC.view.valueBox.NUMBER
 * @author		Bhaswati Ghosh
 * @version 	
 * ----------------------------------------------------------------------------------------
 */

i2b2.CRC.view.NUMBER = {
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
		valueType: 'NUMBER',
		valueUnitsCurrent: 0, // index into Units[]
		valueUnits: {},
		rangeInfo: {},
		enumInfo: {}
	},
	
	// ================================================================================================== //
	getHTML  : function(){
		var thisHTML = "No html available at this time.";
		//Read the html from certain path
		var url = "js-i2b2/cells/CRC/ModLabValues/CRC_view_NUMBER.html";
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
						
						var closure_qpi = i2b2.CRC.view.NUMBER.qpi;
						var closure_number = i2b2.CRC.view.NUMBER.itemNumber;
						// submit value(s)
						if (this.submit()) {
							if(!i2b2.CRC.view.NUMBER.pluginCallerObj){
								var pd = i2b2.CRC.model.queryCurrent.panels[i2b2.CRC.ctrlr.QT.temporalGroup][closure_qpi];
								// find the correct item in the panel
								for (var i=0; i<pd.items.length; i++) {
									if (pd.items[i].itemNumber==closure_number) {
										if (i2b2.CRC.view.NUMBER.isModifier) {
											pd.items[i].ModValues = i2b2.CRC.view.NUMBER.i2b2Data.ModValues;
										} else {
											pd.items[i].LabValues = i2b2.CRC.view.NUMBER.i2b2Data.LabValues;										
										}
										break;
									}
								}
								// update the panel/query tool GUI
								i2b2.CRC.ctrlr.QT.doSetQueryName.call(this, '');
								
								i2b2.CRC.view.NUMBER.formatLabValues(i2b2.CRC.view.NUMBER.i2b2Data.itemNumber, pd);
								i2b2.CRC.view.NUMBER.cpc._renameConceptByValueChooser(i2b2.CRC.view.NUMBER.i2b2Data.itemNumber, i2b2.CRC.view.NUMBER.isModifier, pd);
								
								delete i2b2.CRC.view.NUMBER.isModifier;
								i2b2.CRC.view.NUMBER.cpc._redrawDates(pd);
							}
							else
							{
								i2b2.CRC.view.NUMBER.formatLabValues(i2b2.CRC.view.NUMBER.i2b2Data.itemNumber, null);
								i2b2.CRC.view.NUMBER.pluginCallerObj.conceptsRenderFromValueBox();
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
		
		if (!i2b2.CRC.view.NUMBER.isModifier) {
			if(!i2b2.CRC.view.NUMBER.pluginCallerObj){
				if (!this.i2b2Data.LabValues && this.i2b2Data.origData.LabValues) {
					// copy server delivered Lab Values to our scope
					this.i2b2Data.LabValues = this.i2b2Data.origData.LabValues;
				}
				var tmpLab = this.i2b2Data.LabValues;
			}
			else
				var tmpLab = i2b2.CRC.view.NUMBER.pluginCallerObj.currentTerm.LabValues;
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
				case "FLAG":
					fd.selectedType = "FLAG";
					$("mlvfrmTypeFLAG").checked = true;
					var tn = $("mlvfrmFlagValue");
					for (var i=0; i<tn.options.length; i++) {
						if (tn.options[i].value == tmpLab.ValueFlag) {
							tn.selectedIndex = i;
							fd.flagValue = i;
							break;
						}
					}
					break;
				case "VALUE":					
					fd.selectedType = "VALUE";
					$("mlvfrmTypeVALUE").checked = true;
					// select the correct numeric matching operator
					if (tmpLab.NumericOp) {
						var tn = $("mlvfrmOperator");
						for (var i=0; i<tn.options.length; i++) {
							if (tn.options[i].value == tmpLab.NumericOp) {
								tn.selectedIndex = i;
								fd.numericOperator = tmpLab.NumericOp;
								break;
							}
						}
						// load the values if any
						if (tmpLab.Value) 		{ jQuery('#mlvfrmNumericValue').val(tmpLab.Value); }
						if (tmpLab.ValueHigh) 	{ $('mlvfrmNumericValueHigh').value = tmpLab.ValueHigh; }
						if (tmpLab.ValueLow) 	{ $('mlvfrmNumericValueLow').value = tmpLab.ValueLow; }
					}
					break;
				default:
					break;
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
		var dm = i2b2.CRC.view.NUMBER.cfgTestInfo;
		var fd = i2b2.CRC.view.NUMBER.formdata;
		var tmpLabValue = {};
		var errorMsg = [];
		
		try
		{
			switch (fd.selectedType) {
				case "NONE":
					if (i2b2.CRC.view.NUMBER.isModifier) {
						delete i2b2.CRC.view.NUMBER.i2b2Data.ModValues;
					} else {
						delete i2b2.CRC.view.NUMBER.i2b2Data.LabValues;
					}
					if(i2b2.CRC.view.NUMBER.pluginCallerObj)
						i2b2.CRC.view.NUMBER.pluginCallerObj.currentTerm.LabValues = i2b2.CRC.view.NUMBER.i2b2Data.LabValues;
					return true;
					break;
				case "FLAG":
					tmpLabValue.MatchBy = "FLAG";
					var tn = $('mlvfrmFlagValue');
					tmpLabValue.ValueFlag = tn.options[tn.selectedIndex].value;
					tmpLabValue.FlagsToUse = dm.flagType;
					break;
				case "VALUE":
					tmpLabValue.MatchBy = "VALUE";
					switch(dm.valueType) {
						case "POSFLOAT":
						case "POSINT":
						case "FLOAT":
						case "INT": 
							tmpLabValue.GeneralValueType = "NUMBER";
							tmpLabValue.SpecificValueType = "NUMBER";
							var valInputs = [];
							tmpLabValue.NumericOp = fd.numericOperator;
							if (fd.numericOperator=="BETWEEN") {
								// verify that Low/High are correct
								var iv1 = $('mlvfrmNumericValueLow');
								var iv2 = $('mlvfrmNumericValueHigh');							
								iv1.value = iv1.value.strip();
								iv2.value = iv2.value.strip();
	//snm0
								if (iv1.value == "") {
									tmpLabValue.ValueLow = "";
									valInputs.push(NaN);
								}
								else {
									tmpLabValue.ValueLow = Number(iv1.value);
									valInputs.push(iv1);
								}
								if (iv2.value == "") {
									tmpLabValue.ValueHigh = "";
									valInputs.push(NaN);
								}
								else {
									tmpLabValue.ValueHigh = Number(iv2.value);
									valInputs.push(iv2);
								}
								tmpLabValue.UnitsCtrl = $('mlvfrmUnits'); 
							} else {
								var iv1 = $('mlvfrmNumericValue');
								iv1.value = iv1.value.strip();
								if (iv1.value == "") {
									tmpLabValue.Value = "";
									valInputs.push(NaN);
								}
								else {
									tmpLabValue.Value = Number(iv1.value);
									valInputs.push(iv1);
								}
	//snm0
								tmpLabValue.UnitsCtrl = $('mlvfrmUnits'); 
							}
							// loop through all the 
							for(var i=0; i<valInputs.length; i++){
								var tn = Number(valInputs[i].value);
								if (!isFinite(tn)) {
									errorMsg.push(" - One or more inputs are not a valid number\n");	
								}
								if (dm.valueValidate.onlyInt) {
									if (parseInt(valInputs[i].value) != valInputs[i].value) {
										errorMsg.push(" - One or more inputs are not integers\n");	
									}
								}
								if (dm.valueValidate.onlyPos) {
									if (parseFloat(valInputs[i].value) < 0) {
										errorMsg.push(" - One or more inputs have a negative value\n");	
									}
								}
							}
							// make sure the values are in the correct order
							if (fd.numericOperator=="BETWEEN" && (parseFloat(iv1) > parseFloat(iv2))) {
								errorMsg.push(" - The low value is larger than the high value\n");
							}
	//snm0						
							// CONVERT VALUES TO MASTER UNITS
							if (fd.unitIndex == -1) { // no units were in XML
								tmpLabValue.UnitsCtrl = "";
								break;
							}
							if ((dm.valueUnits[fd.unitIndex] == undefined) || (dm.valueUnits[fd.unitIndex] == "")) {
								alert('The units for this value are blank.');
								return false;
							}
	// snm0
							if (dm.valueUnits[fd.unitIndex].excluded) {
								alert('You cannot set a numerical value using the current Unit Of Measure.');
								return false;
							}
							if (dm.valueUnits.find(function(o){ return ((o.masterUnit === true) && (o.excluded===true)); })) {
								alert('You cannot set a numerical value because the master Unit Of Measure is declared as invalid.');
								return false;
							}
							try {
								var convtMult = dm.valueUnits[fd.unitIndex].multFactor;
								if (tmpLabValue.ValueHigh) tmpLabValue.ValueHigh = (tmpLabValue.ValueHigh * convtMult);
								if (tmpLabValue.ValueLow) tmpLabValue.ValueLow = (tmpLabValue.ValueLow * convtMult);
								if (tmpLabValue.Value) tmpLabValue.Value = (tmpLabValue.Value * convtMult);
								for (var i=0; i<dm.valueUnits.length;i++){
									if (dm.valueUnits[i].masterUnit) {
										tmpLabValue.UnitsCtrl = dm.valueUnits[i].name;
										break;
									}
								}
							} catch(e) {
								alert('An error was encountered while converting Units!');
								return false;
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
			if (i2b2.CRC.view.NUMBER.isModifier) {
				if (tmpLabValue) {
					i2b2.CRC.view.NUMBER.i2b2Data.ModValues = tmpLabValue;
				} else {
					delete i2b2.CRC.view.NUMBER.i2b2Data.ModValues;
				}
			} else { 
				if (tmpLabValue) {
					if(!i2b2.CRC.view.NUMBER.pluginCallerObj)
						i2b2.CRC.view.NUMBER.i2b2Data.LabValues = tmpLabValue;
					else
						i2b2.CRC.view.NUMBER.pluginCallerObj.currentTerm.LabValues = tmpLabValue;
				} else {
					delete i2b2.CRC.view.NUMBER.i2b2Data.LabValues;
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
		var dm = i2b2.CRC.view.NUMBER.cfgTestInfo;
		var fd = i2b2.CRC.view.NUMBER.formdata;
		fd.selectedType= "NONE";
		
		// process flag info
		dm.flag = false;
		try { 
			var t = i2b2.h.getXNodeVal(refXML, 'Flagstouse'); 
			if (t) {
				if(!i2b2.UI.cfg.useExpandedLabFlags) {
					if (t == "A") {
						dm.flagType = 'NA';
						dm.flags = [{name:'Normal', value:'@'},{name:'Abnormal', value:'A'}];
					} else if (t == "HL") {
						dm.flagType = 'HL';
						dm.flags = [{name:'Normal', value:'@'},{name:'High', value:'H'},{name:'Low', value:'L'}];
					} else {
						dm.flagType = false;
					}
				} else {
					var t_flags = i2b2.LabExpandedFlags.process(t);
					dm.flagType = t_flags.flagType;
					dm.flags = t_flags.flags;
				}
			} else {
				dm.flagType = false;
			}
			// insert the flags into the range select control
			var sn = $('mlvfrmFlagValue');
			while( sn.hasChildNodes() ) { sn.removeChild( sn.lastChild ); }
			for (var i=0; i<dm.flags.length; i++) {
				// ONT options dropdown
				var sno = document.createElement('OPTION');
				sno.setAttribute('value', dm.flags[i].value);
				var snt = document.createTextNode(dm.flags[i].name);
				sno.appendChild(snt);
				sn.appendChild(sno);
			}
		} 
		catch(e) { 
			var t = false;
			dm.flags = [];
		}
		
		// work with the data type
		dm.valueUnits = [];
		try {
			var t = i2b2.h.getXNodeVal(refXML, 'DataType');
			switch(t) {
				case "PosFloat":
					dm.valueType = "POSFLOAT";
					dm.valueValidate.onlyPos = true;
					dm.valueValidate.onlyInt = false;
					dm.valueValidate.maxString = false; 
					break;
				case "PosInteger":
					dm.valueType = "POSINT";
					dm.valueValidate.onlyPos = true;
					dm.valueValidate.onlyInt = true;
					dm.valueValidate.maxString = false; 
					break;
				case "Float":
					dm.valueType = "FLOAT";
					dm.valueValidate.onlyPos = false;
					dm.valueValidate.onlyInt = false;
					dm.valueValidate.maxString = false; 
					break;
				case "Integer":
					dm.valueType = "INT";
					dm.valueValidate.onlyPos = true;
					dm.valueValidate.onlyInt = true;
					dm.valueValidate.maxString = false; 
					break;			
				default:
					dm.valueType = false;
			}
		} catch(e) {
			dm.valueType = false;
			dm.valueValidate.onlyPos = false;
			dm.valueValidate.onlyInt = false;
			dm.valueValidate.maxString = false; 
			$('mlvfrmTypeVALUE').parentNode.hide();
		}
	
		// set the title bar (TestName and TestID are assumed to be mandatory)
		this.sd.setHeader("Choose value of <span title='"+i2b2.h.getXNodeVal(refXML, 'TestName')+" (Test:"+i2b2.h.getXNodeVal(refXML, 'TestID')+")'>"+i2b2.h.getXNodeVal(refXML, 'TestName'));
		
		// extract and populate unit info for all dropdowns
		var tProcessing = new Hash();
		try {
			// save list of all possible units (from)
			var t = i2b2.h.XPath(refXML,"descendant::UnitValues/descendant::text()[parent::NormalUnits or parent::EqualUnits or parent::Units]");
			var t2 = [];
			for (var i=0; i<t.length; i++) {
				t2.push(t[i].nodeValue);
			}
			t = t2.uniq();
			for (var i=0;i<t.length;i++) {
				var d = {name: t[i]};
				// does unit require conversion?
				try {
					d.multFactor = i2b2.h.XPath(refXML,"descendant::UnitValues/descendant::ConvertingUnits[Units/text()='"+t[i]+"']/MultiplyingFactor/text()")[0].nodeValue;
				} catch(e) {
					d.multFactor = 1;
				}
				tProcessing.set(t[i], d);
			}
			// get our master unit (the first NormalUnits encountered that is not disabled)
			var t = i2b2.h.XPath(refXML,"descendant::UnitValues/descendant::NormalUnits/text()");
			var t2 = [];
			for (var i=0; i<t.length; i++) {
				t2.push(t[i].nodeValue);
			}
			t = t2.uniq();
			var masterUnit = false;
			for (var i=0;i<t.length;i++) {
				var d = tProcessing.get(t[i]);
				if (!d.excluded && d.multFactor==1) {
					masterUnit = t[i];
					d.masterUnit = true;
					tProcessing.set(t[i], d);
					break;
				}
			}
			if (!masterUnit) {
				masterUnit = t[0];
				if (masterUnit) {
					var d = tProcessing.get(masterUnit);
					d.masterUnit = true;
					d.masterUnitViolation = true;
					tProcessing.set(masterUnit, d);
				}
			}
		} catch(e) { 
			console.error("Problem was encountered when processing given Units");
		}

		dm.valueUnits = tProcessing.values();

		// update the unit drop downs
		var ud = [ $('mlvfrmUnits')];
		for (var cud=0; cud < ud.length; cud++) {
			var sn = ud[cud];
			// clear the drop down
			while( sn.hasChildNodes() ) { sn.removeChild( sn.lastChild ); }			
			// populate values
			for (var i=0; i<dm.valueUnits.length; i++) {
				var sno = document.createElement('OPTION');
				sno.setAttribute('value', i);
				if (dm.valueUnits[i].masterUnit) { sno.setAttribute('selected', true); }				
				var snt = document.createTextNode(dm.valueUnits[i].name);
				sno.appendChild(snt);
				sn.appendChild(sno);
			}
		}
		// hide or show DIV
		if (dm.valueUnits.length==0) {
			Element.hide($('mlvfrmUnitsContainer'));
		} else {
			// message if selected Unit is excluded from use
			if (dm.valueUnits[ud[0].options[ud[0].selectedIndex].value].excluded) {
				Element.show($('mlvUnitExcluded'));
				$('mlvfrmNumericValue').disabled = true;
				$('mlvfrmNumericValueLow').disabled = true;
				$('mlvfrmNumericValueHigh').disabled = true;
			} else {
				Element.hide($('mlvUnitExcluded'));
				$('mlvfrmNumericValue').disabled = false;
				$('mlvfrmNumericValueLow').disabled = false;
				$('mlvfrmNumericValueHigh').disabled = false;
			}
			Element.show($('mlvfrmUnitsContainer'));
		}

// snm0		
		// Extract the value range info and display it on the range bar
		// The bar is 520 pixels long, fixed  
		//
		var nBarLength = 520; // fixed width of bar
		fd.bHidebar = false;  // set to true if decide bar not worth showing
		var nSituation = 0; // how many values are there?
		dm.rangeInfo = {};
		//
		// get preliminary bar length results and set up array
		try {
			dm.rangeInfo.LowOfToxic = parseFloat(refXML.getElementsByTagName('LowofToxicValue')[0].firstChild.nodeValue);
			nSituation = nSituation +1;
		} catch(e) {}
		try {
			dm.rangeInfo.LowOfLow = parseFloat(refXML.getElementsByTagName('LowofLowValue')[0].firstChild.nodeValue);
			if ((isFinite(dm.rangeInfo.LowOfToxic)) && (dm.rangeInfo.LowOfToxic == dm.rangeInfo.LowOfLow)) {
				dm.rangeInfo.LowOfLowRepeat = true;
			}
			else {
				dm.rangeInfo.LowOfLowRepeat = false;
				nSituation = nSituation +1;
			}
		} catch(e) {}
		try {
			dm.rangeInfo.HighOfLow = parseFloat(refXML.getElementsByTagName('HighofLowValue')[0].firstChild.nodeValue);	
			if ((isFinite(dm.rangeInfo.LowOfLow)) && (dm.rangeInfo.LowOfLow == dm.rangeInfo.HighOfLow)) {
				dm.rangeInfo.HighOfLowRepeat = true;
			}
			else {
				dm.rangeInfo.HighOfLowRepeat = false;
				nSituation = nSituation +1;
			}
		} catch(e) {}
		try {
			dm.rangeInfo.HighOfToxic = parseFloat(refXML.getElementsByTagName('HighofToxicValue')[0].firstChild.nodeValue);
			nSituation = nSituation +1;
		} catch(e) {}
		try {
			dm.rangeInfo.HighOfHigh = parseFloat(refXML.getElementsByTagName('HighofHighValue')[0].firstChild.nodeValue);
			if ((isFinite(dm.rangeInfo.HighOfToxic)) && (dm.rangeInfo.HighOfToxic == dm.rangeInfo.HighOfHigh)) {
				dm.rangeInfo.HighOfHighRepeat = true;
			}
			else {
				dm.rangeInfo.HighOfHighRepeat = false;
				nSituation = nSituation +1;
			}
		} catch(e) {}
		try {
			dm.rangeInfo.LowOfHigh = parseFloat(refXML.getElementsByTagName('LowofHighValue')[0].firstChild.nodeValue);
			if ((isFinite(dm.rangeInfo.HighOfHigh)) && (dm.rangeInfo.HighOfHigh == dm.rangeInfo.LowOfHigh)) {
				dm.rangeInfo.LowOfHighhRepeat = true;
			}
			else {
				dm.rangeInfo.LowOfHighRepeat = false;
				nSituation = nSituation +1;
			}
		} catch(e) {}
		//
		// get full situation of bar to be shown
		try {
			if (nSituation != 0) {
				var nPixelPerBar = nBarLength / (nSituation + 1);
				$('lblNorm').style.width = nPixelPerBar + "px";
				$('barNorm').style.width = nPixelPerBar + "px";	
				if (isFinite(dm.rangeInfo.LowOfToxic)) {
					$('lblToxL').innerHTML = dm.rangeInfo.LowOfToxic;
					$('lblToxL').style.width = nPixelPerBar + "px";
					$('barToxL').style.width = nPixelPerBar + "px";
				}
				else {
					$('lblToxL').innerHTML = "";
					$('lblToxL').style.width = "0px";
					$('barToxL').style.width = "0px";
				}
				if (isFinite(dm.rangeInfo.LowOfLow) && (dm.rangeInfo.LowOfLowRepeat == false)) {
					$('lblLofL').innerHTML = dm.rangeInfo.LowOfLow;
					$('lblLofL').style.width = nPixelPerBar + "px";
					$('barLofL').style.width = nPixelPerBar + "px";
				}
				else {
					$('lblLofL').innerHTML = "";
					$('lblLofL').style.width = "0px";
					$('barLofL').style.width = "0px";
				}
				if (isFinite(dm.rangeInfo.HighOfLow) && (dm.rangeInfo.HighOfLowRepeat == false)) {
					$('lblHofL').innerHTML = dm.rangeInfo.HighOfLow;
					$('lblHofL').style.width = nPixelPerBar + "px";
					$('barHofL').style.width = nPixelPerBar + "px";
				}
				else {
					$('lblHofL').innerHTML = "";
					$('lblHofL').style.width = "0px";
					$('barHofL').style.width = "0px";
				}
				if (isFinite(dm.rangeInfo.LowOfHigh) && (dm.rangeInfo.LowOfHighRepeat == false)) {
					$('lblLofH').innerHTML = dm.rangeInfo.LowOfHigh;
					$('lblLofH').style.width = nPixelPerBar + "px";
					$('barLofH').style.width = nPixelPerBar + "px";
				}
				else {
					$('lblLofH').innerHTML = "";
					$('lblLofH').style.width = "0px";
					$('barLofH').style.width = "0px";
				}
				if (isFinite(dm.rangeInfo.HighOfHigh) && (dm.rangeInfo.HighOfHighRepeat == false)) {
					$('lblHofH').innerHTML = dm.rangeInfo.HighOfHigh;
					$('lblHofH').style.width = nPixelPerBar + "px";
					$('barHofH').style.width = nPixelPerBar + "px";
				}
				else {
					$('lblHofH').innerHTML = "";
					$('lblHofH').style.width = "0px";
					$('barHofH').style.width = "0px";
				}
				if (isFinite(dm.rangeInfo.HighOfToxic)) {
					$('lblToxH').innerHTML = dm.rangeInfo.HighOfToxic;
					$('lblToxH').style.width = nPixelPerBar + "px";
					$('barToxH').style.width = nPixelPerBar + "px";
				}
				else {
					$('lblToxH').innerHTML = "";
					$('lblToxH').style.width = "0px";
					$('barToxH').style.width = "0px";
				}
			}
			else {
				fd.bHidebar = true;
			}
		} 
		catch(e) {
		   	var errString = "Description: " + e.description;
			alert(errString);
		}
		// show the right parts of the form
		if (dm.valueType) {
			$('mlvfrmTypeVALUE').checked = true;
			$('mlvfrmFLAG').hide();
			$('mlvfrmVALUE').show();
		}
		else if (dm.flagType) {
			$('mlvfrmTypeFLAG').checked = true;
			$('mlvfrmFLAG').show();
			$('mlvfrmVALUE').hide();
		}
		else {
			$('mlvfrmTypeNONE').checked = true;
			$('mlvfrmFLAG').hide();
			$('mlvfrmVALUE').hide();
		}
// snm0
		// clear the other data input elements
		$('mlvfrmOperator').selectedIndex = 0;
		$('mlvfrmFlagValue').selectedIndex = 0;
		$('mlvfrmNumericValueLow').value = '';
		$('mlvfrmNumericValueHigh').value = '';
		$('mlvfrmNumericValue').value = '';

		// save the initial values into the data model
		var tn = $("mlvfrmOperator");
		fd.numericOperator = tn.options[tn.selectedIndex].value;
		var tn = $("mlvfrmOperator");
		fd.flagValue = tn.options[tn.selectedIndex].value;
		fd.unitIndex = $('mlvfrmUnits').selectedIndex;
		i2b2.CRC.view.NUMBER.formdata.ignoreChanges = false;
		i2b2.CRC.view.NUMBER.setUnits();
		i2b2.CRC.view.NUMBER.Redraw();
	},
	
	// ================================================================================================== //
	setUnits: function(newUnitIndex) {
		// this function is used to change all the dropdowns and convert the range values
		if (!newUnitIndex) { newUnitIndex = this.formdata.unitIndex; }
		if (newUnitIndex==-1) { return; }
		var dm = this.cfgTestInfo;
		var ri = this.cfgTestInfo.rangeInfo;
		var cv = dm.valueUnits[newUnitIndex].multFactor;
		var t;
		var el;
		$('mlvfrmLblUnits').innerHTML = dm.valueUnits[newUnitIndex].name;
		try {
			t = dm.rangeInfo.LowOfLow * cv;
		} catch(e) {}
		try {
			t = dm.rangeInfo.HighOfLow * cv;
			if (isNaN(t)) { t = '';	}
			el = $("mlvfrmLblHighOfLow");
			el.innerHTML = t;
			el.style.left = (Element.getWidth(el)/ 2);
		} catch(e) {}
		try {
			t = dm.rangeInfo.LowOfHigh * cv;
			if (isNaN(t)) { t = '';	}
			el = $("mlvfrmLblLowOfHigh");
			el.innerHTML = t;
			el.style.left = (Element.getWidth(el)/ 2);
		} catch(e) {}
		try {
			t = dm.rangeInfo.HighOfHigh * cv;
		} catch(e) {}
		try {
			t = dm.rangeInfo.LowOfToxic * cv;
			if (isNaN(t)) { t = '';	}
			el = $("mlvfrmLblLowToxic");
			el.innerHTML = t;
			el.style.left = (Element.getWidth(el)/ 2);
		} catch(e) {}
		try {
			t = dm.rangeInfo.LowOfLowValue * cv;
			if (isNaN(t)) { t = '';	}
			el = $("mlvfrmLblHighToxic");
			el.innerHTML = t;
			el.style.left = (Element.getWidth(el)/ 2);
		} catch(e) {}
	},
	
	// ================================================================================================== //
	changeHandler: function(e) {
		var dm = i2b2.CRC.view.NUMBER.cfgTestInfo;
		var fd = i2b2.CRC.view.NUMBER.formdata;
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
			case "mlvfrmTypeFLAG":
				fd.selectedType = 'FLAG';
				break;
			case "mlvfrmTypeVALUE":
				fd.selectedType = 'VALUE';
				break;
			case "mlvfrmFlagValue":
				fd.flagValue = tn.options[tn.selectedIndex].value;
				break;
			case "mlvfrmOperator":
				var i1 = $('mlvfrmUnits');
				fd.numericOperator = tn.options[tn.selectedIndex].value;
				fd.valueUnitsCurrent = i1.selectedIndex;
				break;
			case "mlvfrmUnits":
				var u1 = $('mlvfrmUnits');
				// convert entered values
				var cvD = dm.valueUnits[fd.unitIndex].multFactor;
				var cvM = dm.valueUnits[u1.selectedIndex].multFactor;
				var lst = [$('mlvfrmNumericValue'), $('mlvfrmNumericValueLow'), $('mlvfrmNumericValueHigh')];
				// save the new Units
				fd.unitIndex = u1.selectedIndex;
				// message if selected Unit is excluded from use
				if (dm.valueUnits[u1.selectedIndex].excluded) {
					Element.show($('mlvUnitExcluded'));
					$('mlvfrmNumericValue').disabled = true;
					$('mlvfrmNumericValueLow').disabled = true;
					$('mlvfrmNumericValueHigh').disabled = true;
				} else {
					Element.hide($('mlvUnitExcluded'));
					$('mlvfrmNumericValue').disabled = false;
					$('mlvfrmNumericValueLow').disabled = false;
					$('mlvfrmNumericValueHigh').disabled = false;
				}	
				break;
			default:
				console.warn("onClick element was not captured for ID:"+tn.id)
		}
		tn.blur();
		i2b2.CRC.view.NUMBER.Redraw();
	},
	
	// ================================================================================================== //
	addHandlers: function(){
		YAHOO.util.Event.addListener("mlvfrmTypeNONE", "click", this.changeHandler);
		YAHOO.util.Event.addListener("mlvfrmTypeFLAG", "click", this.changeHandler);
		YAHOO.util.Event.addListener("mlvfrmTypeVALUE", "click", this.changeHandler);
		YAHOO.util.Event.addListener("mlvfrmFlagValue", "change", this.changeHandler);
		YAHOO.util.Event.addListener("mlvfrmOperator", "change", this.changeHandler);
		YAHOO.util.Event.addListener("mlvfrmUnits", "change", this.changeHandler);
	},
	
	// ================================================================================================== //
	Redraw: function(){
		var fd = i2b2.CRC.view.NUMBER.formdata;
		var dm = i2b2.CRC.view.NUMBER.cfgTestInfo;
		
		if (!dm.valueType && fd.selectedType == "VALUE") {
			$('mlvfrmTypeVALUE').checked=true;
			fd.selectedType= "VALUE";
		}
		if (dm.flagType) {
			Element.show($('mlvfrmTypeFLAG').parentNode);
		} else {
			if (fd.selectedType == "FLAG") {
				$('mlvfrmTypeNONE').checked=true;
				fd.selectedType = "NONE";
			}
			Element.hide($('mlvfrmTypeFLAG').parentNode);
		}
		switch (fd.selectedType) {
			case "NONE":
				$('mlvfrmFLAG').hide();
				$('mlvfrmVALUE').hide();
				$('mlvfrmBarContainer').hide();
				$('mlvfrmUnitsContainer').hide();
				break;
			case "FLAG":
				$('mlvfrmVALUE').hide();
				$('mlvfrmFLAG').show();
				$('mlvfrmBarContainer').hide();
				$('mlvfrmUnitsContainer').hide();
				break;
			case "VALUE":
				$('mlvfrmVALUE').show();
				$('mlvfrmFLAG').hide();
				$('mlvfrmEnterOperator').hide();
				$('mlvfrmEnterVal').hide();
				$('mlvfrmEnterVals').hide();
				$('mlvfrmBarContainer').hide();
				$('mlvfrmUnitsContainer').hide();
				switch(dm.valueType) {
					case "POSFLOAT":
					case "POSINT":
					case "FLOAT":
					case "INT":
						$('mlvfrmEnterOperator').show();
						// are we showing two input boxes?
						if (fd.numericOperator=="BETWEEN") {
							$('mlvfrmEnterVals').show();
						} else {
							$('mlvfrmEnterVal').show();
						}
						i2b2.CRC.view.NUMBER.setUnits();
						// this is the only location that determines to show the value bar
						if (fd.bHidebar) {
							$('mlvfrmBarContainer').hide();
						}
						else {
							$('mlvfrmBarContainer').show();
						}
						$('mlvfrmUnitsContainer').show();
						break;
					default:
						break;
					}
				break;
			default:
				break;
		}
	},
	
	// ================================================================================================== //
	// Gets called when a click occurs on the value bar graphic and the operator and 
// values are set.
//
	updateValue: function(e) {
		// The method is to embed the reference to the value label of the bar
		// in the anchor of the href and then get it and extract the value and
		// place it in the select drop down and text box.
		try {
			var targ; // href of bar item that was clicked
			if (!e) var e = window.event;
			if (e.target) targ = e.target;
			else if (e.srcElement) targ = e.srcElement;
			if (targ.nodeType == 3) // defeat Safari bug
				targ = targ.parentNode;
			// make href into a string and get the anchor of it
			var sTarg = targ.toString();
			var iTargAnchor = sTarg.lastIndexOf("#");
			if (iTargAnchor < 0) return; // no anchor
			var sTargAnchor = sTarg.substring(iTargAnchor+1);
			if (sTargAnchor.length <= 1) return; //no anchor
			//alert(sTargAnchor);
			var sTargNumber = $(sTargAnchor).innerHTML;
			// after getting the bar label get the value and put it in the slots
			if ((sTargAnchor == 'lblToxL') || (sTargAnchor == 'lblLofL') || (sTargAnchor == 'lblHofL')) {
				$('mlvfrmOperator').selectedIndex=1;
				//$('mlvfrmOperator').value='LE';
				i2b2.CRC.view.NUMBER.formdata.numericOperator = 'LE';
				$('mlvfrmNumericValue').value = sTargNumber;
			}
			if ((sTargAnchor == 'lblToxH') || (sTargAnchor == 'lblLofH') || (sTargAnchor == 'lblHofH')) {
				$('mlvfrmOperator').selectedIndex=5;
				i2b2.CRC.view.NUMBER.formdata.numericOperator = 'GE';
				$('mlvfrmNumericValue').value = sTargNumber;
			}
		}
		catch(eError) {
				alert("Error: updateValue: " + eError.description);
		}
	},
	
	// ================================================================================================== //
	formatLabValues: function(key, pd){
		if(!i2b2.CRC.view.NUMBER.pluginCallerObj){
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
			var values = i2b2.CRC.view.NUMBER.pluginCallerObj.currentTerm.LabValues;
		
		if(!values) return;

		var formattedLabValues = '';
		
		switch(values.MatchBy) {
			case "FLAG":
				formattedLabValues = i2b2.h.Escape(values.ValueFlag);
				break;
			case "VALUE":
				if (values.GeneralValueType=="NUMBER") 
				{
					if (values.NumericOp == 'BETWEEN') 
					{
						title =  ' '+i2b2.h.Escape(values.ValueLow)+' - '+i2b2.h.Escape(values.ValueHigh);
					} 
					else 
					{
						switch(values.NumericOp) {
						case "LT":
							var numericOp = " < ";
							break;
						case "LE":
							var numericOp = " <= ";
							break;
						case "EQ":
							var numericOp = " = ";
							break;
						case "GT":
							var numericOp = " > ";
							break;
						case "GE":
							var numericOp = " >= ";
							break;
							
						case "":
							break;	
						}
						title =   numericOp +i2b2.h.Escape(values.Value);
					}
					if (!Object.isUndefined(values.UnitsCtrl))
					{
						title += " " + values.UnitsCtrl;				
					}
					formattedLabValues = title;
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

