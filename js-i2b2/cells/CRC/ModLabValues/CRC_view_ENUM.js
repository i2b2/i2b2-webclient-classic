/**
 * @projectDescription	(GUI-only) Master Controller for CRC Query Tool's Value constraint dialog boxes.
 * @inherits 	i2b2.CRC.view
 * @namespace	i2b2.CRC.view.valueBox.ENUM
 * @author		Bhaswati Ghosh
 * @version 	
 * ----------------------------------------------------------------------------------------
 */

i2b2.CRC.view.ENUM = {
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
		valueType: 'ENUM',
		valueUnitsCurrent: 0, // index into Units[]
		valueUnits: {},
		rangeInfo: {},
		enumInfo: {}
	},
	
	// ================================================================================================== //
	getHTML  : function(){
		var thisHTML = "No html available at this time.";
		//Read the html from certain path
		var url = "js-i2b2/cells/CRC/ModLabValues/CRC_view_ENUM.html";
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
						var closure_qpi = i2b2.CRC.view.ENUM.qpi;
						var closure_number = i2b2.CRC.view.ENUM.itemNumber;
						// submit value(s)
						if (this.submit()) {
							if(!i2b2.CRC.view.ENUM.pluginCallerObj){
								var pd = i2b2.CRC.model.queryCurrent.panels[i2b2.CRC.ctrlr.QT.temporalGroup][closure_qpi];
								// find the correct item in the panel
								for (var i=0; i<pd.items.length; i++) {
									if (pd.items[i].itemNumber==closure_number) {
										if (i2b2.CRC.view.ENUM.isModifier) {
											pd.items[i].ModValues = i2b2.CRC.view.ENUM.i2b2Data.ModValues;
										} else {
											pd.items[i].LabValues = i2b2.CRC.view.ENUM.i2b2Data.LabValues;										
										}
										break;
									}
								}
								// update the panel/query tool GUI
								i2b2.CRC.ctrlr.QT.doSetQueryName.call(this, '');
								
								i2b2.CRC.view.ENUM.formatLabValues(i2b2.CRC.view.ENUM.i2b2Data.itemNumber, pd);
								i2b2.CRC.view.ENUM.cpc._renameConceptByValueChooser(i2b2.CRC.view.ENUM.i2b2Data.itemNumber, i2b2.CRC.view.ENUM.isModifier, pd);
								
								delete i2b2.CRC.view.ENUM.isModifier;
								i2b2.CRC.view.ENUM.cpc._redrawDates(pd);
							}
							else
							{
								i2b2.CRC.view.ENUM.formatLabValues(i2b2.CRC.view.ENUM.i2b2Data.itemNumber, null);
								i2b2.CRC.view.ENUM.pluginCallerObj.conceptsRenderFromValueBox();
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
		
		// register for actions upon the modal DOM elements
		this.addHandlers();
		
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
		
		if (!i2b2.CRC.view.ENUM.isModifier) {
			if(!i2b2.CRC.view.ENUM.pluginCallerObj){
				if (!this.i2b2Data.LabValues && this.i2b2Data.origData.LabValues) {
					// copy server delivered Lab Values to our scope
					this.i2b2Data.LabValues = this.i2b2Data.origData.LabValues;
				}
				var tmpLab = this.i2b2Data.LabValues;
			}
			else
				var tmpLab = i2b2.CRC.view.ENUM.pluginCallerObj.currentTerm.LabValues;
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
					if (tmpLab.ValueEnum) 	{ 
						var tn = $("mlvfrmEnumValue");
						for (var i=0; i<tn.options.length; i++) {
							if (tmpLab.ValueEnum.indexOf(tn.options[i].text) > -1) {
								tn.options[i].selected = true;
							} else {
								tn.options[i].selected = false;
							}
						}
					}
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
		var dm = i2b2.CRC.view.ENUM.cfgTestInfo;
		var fd = i2b2.CRC.view.ENUM.formdata;
		var tmpLabValue = {};
		var errorMsg = [];
		
		try
		{
			switch (fd.selectedType) {
				case "NONE":
					if (i2b2.CRC.view.ENUM.isModifier) {
						delete i2b2.CRC.view.ENUM.i2b2Data.ModValues;
					} else {
						delete i2b2.CRC.view.ENUM.i2b2Data.LabValues;					
					}
					if(i2b2.CRC.view.ENUM.pluginCallerObj)
						i2b2.CRC.view.ENUM.pluginCallerObj.currentTerm.LabValues = i2b2.CRC.view.ENUM.i2b2Data.LabValues;
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
					if(dm.valueType == "ENUM") {
						tmpLabValue.GeneralValueType = "ENUM";
						tmpLabValue.SpecificValueType = "ENUM";
						tmpLabValue.ValueEnum = [];
						tmpLabValue.NameEnum = [];
						var t = $('mlvfrmEnumValue').options;
						for (var i=0; i<t.length;i++) {
							if (t[i].selected) {
								tmpLabValue.ValueEnum.push(t[i].value); //dm.enumInfo[t[i].value]);
								tmpLabValue.NameEnum.push(t[i]);
							}
						}
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
			if (i2b2.CRC.view.ENUM.isModifier) {
				if (tmpLabValue) {
					i2b2.CRC.view.ENUM.i2b2Data.ModValues = tmpLabValue;
				} else {
					delete i2b2.CRC.view.ENUM.i2b2Data.ModValues;
				}
			} else { 
				if (tmpLabValue) {
					if(!i2b2.CRC.view.ENUM.pluginCallerObj)
						i2b2.CRC.view.ENUM.i2b2Data.LabValues = tmpLabValue;
					else
						i2b2.CRC.view.ENUM.pluginCallerObj.currentTerm.LabValues = tmpLabValue;
				} else {
					delete i2b2.CRC.view.ENUM.i2b2Data.LabValues;
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
		var dm = i2b2.CRC.view.ENUM.cfgTestInfo;
		var fd = i2b2.CRC.view.ENUM.formdata;
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
		dm.enumInfo = [];
		try {
			var t = i2b2.h.getXNodeVal(refXML, 'DataType');
			switch(t) {
				case "Enum":
					dm.valueType = "ENUM";
					// extract the enum data
					var t1 = i2b2.h.XPath(refXML,"descendant::EnumValues/Val");
					var sn = $('mlvfrmEnumValue');
					// clear the drop down
					while( sn.hasChildNodes() ) { sn.removeChild( sn.lastChild ); }			
					
					var t2 = new Array();
					for (var i=0; i<t1.length; i++) {
						if (t1[i].attributes[0].nodeValue != "" ) {
							var name = t1[i].attributes[0].nodeValue;
						} else {
							var name = t1[i].childNodes[0].nodeValue;
						}
						t2[(t1[i].childNodes[0].nodeValue)] = name;

						var sno = document.createElement('OPTION');
						sno.setAttribute('value', (t1[i].childNodes[0].nodeValue));
						var snt = document.createTextNode(name);
						sno.appendChild(snt);
						sn.appendChild(sno);
							
					}
					dm.enumInfo = t2;

					// remove any Enums found in <CommentsDeterminingExclusion> section
					
					var t = i2b2.h.XPath(refXML,"descendant::CommentsDeterminingExclusion/Com/text()");
					var t2 = [];
					for (var i=0; i<t.length; i++) {
						t2.push(t[i].nodeValue);
					}
					t = t2.uniq();
					if (t.length > 0) {
						for (var i=0;i<t.length; i++){
							for (var i2=0;i2<dm.enumInfo.length; i2++) {
								if (dm.enumInfo[i2].indexOf(t[i]) > -1 ) {
									dm.enumInfo[i2] = null;
								}
							}
							// clean up the array
							dm.enumInfo = dm.enumInfo.compact();
						}
					}
					// clear & populate the Enum dropdown, populate values
					var count = 0;
					break;					
				default:
					dm.valueType = false;
			}
		} catch(e) {
			dm.valueType = false;
		}
	
		// set the title bar (TestName and TestID are assumed to be mandatory)
		this.sd.setHeader("Choose value of <span title='"+i2b2.h.getXNodeVal(refXML, 'TestName')+" (Test:"+i2b2.h.getXNodeVal(refXML, 'TestID')+")'>"+i2b2.h.getXNodeVal(refXML, 'TestName'));
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
		$('mlvfrmEnumValue').selectedIndex = 0;
		i2b2.CRC.view.ENUM.Redraw();
	},
	
	// ================================================================================================== //
	
	changeHandler: function(e) {
		var dm = i2b2.CRC.view.ENUM.cfgTestInfo;
		var fd = i2b2.CRC.view.ENUM.formdata;
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
			case "mlvfrmEnumValue":
				fd.enumIndex = tn.selectedIndex;
				fd.enumValue = tn.options[fd.enumIndex].innerHTML;
				break;
			default:
				console.warn("onClick element was not captured for ID:"+tn.id)
		}
		tn.blur();
		i2b2.CRC.view.ENUM.Redraw();
	},
	
	addHandlers: function(){
		YAHOO.util.Event.addListener("mlvfrmTypeNONE", "click", this.changeHandler);
		YAHOO.util.Event.addListener("mlvfrmTypeFLAG", "click", this.changeHandler);
		YAHOO.util.Event.addListener("mlvfrmTypeVALUE", "click", this.changeHandler);
		YAHOO.util.Event.addListener("mlvfrmFlagValue", "change", this.changeHandler);
		YAHOO.util.Event.addListener("mlvfrmEnumValue", "change", this.changeHandler);
	},
	
	Redraw: function(){
		var fd = i2b2.CRC.view.ENUM.formdata;
		var dm = i2b2.CRC.view.ENUM.cfgTestInfo;
		
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
				$('mlvfrmEnterEnum').hide();
				break;
			case "FLAG":
				$('mlvfrmFLAG').show();
				$('mlvfrmEnterEnum').hide();
				break;
			case "VALUE":
				$('mlvfrmFLAG').hide();
				$('mlvfrmEnterEnum').show();
				break;
			default:
				break;
		}
	},
	
	formatLabValues: function(key, pd){
		if(!i2b2.CRC.view.ENUM.pluginCallerObj){
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
			var values = i2b2.CRC.view.ENUM.pluginCallerObj.currentTerm.LabValues;
		
		if(!values) return;
		var formattedLabValues = '';
		
		switch(values.MatchBy) {
			case "FLAG":
				formattedLabValues = i2b2.h.Escape(values.ValueFlag);
				break;
			case "VALUE":
				if (values.GeneralValueType=="ENUM") {
					var sEnum = [];
					for (var i2=0;i2<values.ValueEnum.length;i2++) {
						sEnum.push(i2b2.h.Escape(values.NameEnum[i2].text));
					}
					sEnum = sEnum.join("\", \"");
					sEnum = ' =  ("'+sEnum+'")';
					formattedLabValues = sEnum ;
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

