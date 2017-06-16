/**
 * @projectDescription	(GUI-only) Master Controller for CRC Query Tool's Value constraint dialog boxes.
 * @inherits 	i2b2.CRC.view
 * @namespace	i2b2.CRC.view.valueBox.Genotype
 * @author		Bhaswati Ghosh
 * @version 	
 * ----------------------------------------------------------------------------------------
 */
 
//Variables for Genomics data handling UI
var zygosityValues = ["Heterozygous", "Homozygous", "missing_zygosity"];
var consequenceValues = ["3'UTR", "5'UTR", "downstream","exon","Frameshift","In-frame","intron","missense","nonsense","start_loss","stop_loss","synonymous","upstream","missing_consequence"];
var alleleValues = ["A_to_C", "A_to_G", "A_to_T","C_to_A","C_to_G","C_to_T","G_to_A","G_to_C","G_to_T","T_to_A","T_to_C","T_to_G","._."];
//End Variables for Genomics data handling UI
 
i2b2.CRC.view.GENOTYPE = {
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
		valueType: 'GENOTYPE',
		valueUnitsCurrent: 0, // index into Units[]
		valueUnits: {},
		rangeInfo: {},
		enumInfo: {}
	},
	
	
	// ================================================================================================== //
	getHTML  : function(){
		var thisHTML = "No html available at this time.";
		//Read the html from certain path
		var url = "js-i2b2/cells/CRC/ModLabValues/CRC_view_GENOTYPE.html";
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
						var closure_qpi = i2b2.CRC.view.GENOTYPE.qpi;
						var closure_number = i2b2.CRC.view.GENOTYPE.itemNumber;
						// submit value(s)
						if (this.submit()) {
							if(!i2b2.CRC.view.GENOTYPE.pluginCallerObj){
								var pd = i2b2.CRC.model.queryCurrent.panels[i2b2.CRC.ctrlr.QT.temporalGroup][closure_qpi];
								// find the correct item in the panel
								for (var i=0; i<pd.items.length; i++) {
									if (pd.items[i].itemNumber==closure_number) {
										if (i2b2.CRC.view.GENOTYPE.isModifier) {
											pd.items[i].ModValues = i2b2.CRC.view.GENOTYPE.i2b2Data.ModValues;
										} else {
											pd.items[i].LabValues = i2b2.CRC.view.GENOTYPE.i2b2Data.LabValues;										
										}
										break;
									}
								}
								// update the panel/query tool GUI
								i2b2.CRC.ctrlr.QT.doSetQueryName.call(this, '');
								
								i2b2.CRC.view.GENOTYPE.formatLabValues(i2b2.CRC.view.GENOTYPE.i2b2Data.itemNumber, pd);
								i2b2.CRC.view.GENOTYPE.cpc._renameConceptByValueChooser(i2b2.CRC.view.GENOTYPE.i2b2Data.itemNumber, i2b2.CRC.view.GENOTYPE.isModifier, pd);
								
								delete i2b2.CRC.view.GENOTYPE.isModifier;
								i2b2.CRC.view.GENOTYPE.cpc._redrawDates(pd);
							}
							else
							{
								i2b2.CRC.view.GENOTYPE.formatLabValues(i2b2.CRC.view.GENOTYPE.i2b2Data.itemNumber, null);
								i2b2.CRC.view.GENOTYPE.pluginCallerObj.conceptsRenderFromValueBox();
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
		
		this.addHandlers();  // attach the autocomplete controls to the text input
		
		this.sd.hideEvent.subscribe(function(o) {
			var dm = i2b2.CRC.view.GENOTYPE.cfgTestInfo;
			if (dm.valueType && dm.valueType=="GENOTYPE") {
				//Mandate that search parameters are filled in the dialogue-box otherwise delete the concept from the panel
				if(!i2b2.CRC.view.GENOTYPE.pluginCallerObj){
					if(!i2b2.CRC.view.GENOTYPE.i2b2Data.LabValues){
						alert("No search parameters have been provided, thus this concept is being removed.");
						queryPanelController = i2b2.CRC.view.GENOTYPE.cpc;
						queryPanelController._deleteConcept(i2b2.CRC.view.GENOTYPE.htmlID);
					}
				}
				else
				{
					//If we don't fill any values in the GENOTYPE value chooser , the concept should be taken off from the plugin
					if(!i2b2.CRC.view.GENOTYPE.pluginCallerObj.currentTerm.LabValues)
					{
						alert("No search parameters have been provided, thus this concept is being removed.");
						i2b2.CRC.view.GENOTYPE.pluginCallerObj.modifyConceptList();
					}
				}
			}
		});
		
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
		
		if (!i2b2.CRC.view.GENOTYPE.isModifier) {
			if(!i2b2.CRC.view.GENOTYPE.pluginCallerObj){
				if (!this.i2b2Data.LabValues && this.i2b2Data.origData.LabValues) {
					// copy server delivered Lab Values to our scope
					this.i2b2Data.LabValues = this.i2b2Data.origData.LabValues;
				}
				var tmpLab = this.i2b2Data.LabValues;
			}
			else
				var tmpLab = i2b2.CRC.view.GENOTYPE.pluginCallerObj.currentTerm.LabValues;
		}
		
		// load any data already attached to the node
		if (tmpLab) {
			if(tmpLab.MatchBy == "VALUE"){
				fd.selectedType = "VALUE";
				if (tmpLab.ValueString && tmpLab.GeneralValueType && tmpLab.GeneralValueType=='GENOTYPE') {
					//Parse the existing input and populate ui for GENOTYPE concept
					if(tmpLab.searchByRsId)
					{
						var rsIdVal = tmpLab.ValueString;
						var allele = tmpLab.Allele;
						if(allele && allele != '')
						{
							var alleleList = allele.split('_');
							if(alleleList.length>=3)
								rsIdVal =  rsIdVal + " | " + alleleList[0] + " " + alleleList[1] + " " + alleleList[2];
						}
						$('frmEnterRSIDValue').value = rsIdVal;
					}
					if(tmpLab.searchByGeneName)
					{
						$('frmEnterGeneNameValue').value = tmpLab.ValueString;
						//Handle consequence dropdown
						if(tmpLab.Consequence && tmpLab.Consequence.length>0)
						{
							if(tmpLab.Consequence.indexOf("(")>=0)
								tmpLab.Consequence = tmpLab.Consequence.substring(1, tmpLab.Consequence.length-1);
							var concequenceList = tmpLab.Consequence.split("OR");
							var trimmedConcequences = [];
							concequenceList.each(function(item){
								trimmedConcequences.push(item.trim());
							});
							jQuery('#consequenceTypes').multipleSelect("setSelects", trimmedConcequences);
						}
					}
					if(tmpLab.Zygosity && tmpLab.Zygosity.length>0)
					{
						jQuery('#zygosityTypes').val(tmpLab.Zygosity).change();
						if(tmpLab.Zygosity.indexOf("(")>=0)
							tmpLab.Zygosity = tmpLab.Zygosity.substring(1, tmpLab.Zygosity.length-1);
						var zygosityList = tmpLab.Zygosity.split("OR");
						var trimmedZygosities = [];
						zygosityList.each(function(item){
							trimmedZygosities.push(item.trim());
						});
						jQuery('#zygosityTypes').multipleSelect("setSelects", trimmedZygosities);
					}
				}
			}
		}
		else 
		{
			fd.selectedType = 'VALUE';
		}
		
		//Change the zygosity reference/reference option to have information link
		var optionToDisable = jQuery(".disabled :input");
		var labelToUpdate = jQuery(".disabled").find("label");
		if(optionToDisable)
		{
			optionToDisable.replaceWith( "<span>&nbsp;<img src=\"js-i2b2/cells/CRC/assets/not_available.png\" style=\"margin-left:2px;margin-right:2px;\" />&nbsp;</span>" );
		}
		if(labelToUpdate)
		{
			labelToUpdate.append("&nbsp;<a href=\"Javascript:void(0)\" onclick=\"window.open('https://biobankportal.partners.org/mediawiki/index.php?title=Genotype_Data_Search#Query_for_patients_who_do_not_have_a_variant','infoPrintWindow','width=800,height=750,menubar=yes,resizable=yes,scrollbars=yes');return false;\">wiki</a>");
		}
		
		this.sd.show();
		this.Redraw();
	},
	
	// ================================================================================================== //
	ValidateSave: function() {
		var dm = i2b2.CRC.view.GENOTYPE.cfgTestInfo;
		var fd = i2b2.CRC.view.GENOTYPE.formdata;
		var tmpLabValue = {};
		var errorMsg = [];
		
		try
		{
			if(fd.selectedType == "VALUE") {
				tmpLabValue.MatchBy = "VALUE";
				// validate the data entry boxes
				if(dm.valueType == "GENOTYPE") {
					tmpLabValue.GeneralValueType = "GENOTYPE";
					tmpLabValue.SpecificValueType = "GENOTYPE";
					tmpLabValue.searchByRsId = false;
					tmpLabValue.searchByGeneName = false;
					tmpLabValue.DbOp = true;
					
					if(dm.searchByRsId){  //Validate rsid input
						tmpLabValue.searchByRsId = true;
						tmpLabValue.searchByGeneName = false;
						
						var rsIdVal = jQuery("#frmEnterRSIDValue").val();
						var valueStr = rsIdVal;
						
						if(rsIdVal.indexOf('|')>0)
						{
							var rsIdSplit = rsIdVal.split("|");
							var valueStr = rsIdSplit[0].trim();
							tmpLabValue.Allele = null;
							tmpLabValue.Consequence = null;
							
							if(rsIdSplit.length>=2){
								var RefToAlt = rsIdSplit[1].trim();
								var splitRefToAlt = RefToAlt.split("to");
								if(splitRefToAlt.length>=2)
								{
									var allele = splitRefToAlt[0].trim() + "_to_" + splitRefToAlt[1].trim();
									tmpLabValue.Allele = allele;
								}
							}
						}
						
						if(valueStr.length==0)
							errorMsg.push("The text for rs# can't be empty!");
						else{
							if((valueStr.match("^rs")) && (valueStr.length>=3))
							{
								var valueStrFinal = valueStr.replace(/-/g, '_');   //Replace the hyphens from rs identifier with underscores
								valueStrFinal = valueStrFinal.replace(/ /g,"_"); //Replace the blanks from rs identifier with underscores
								tmpLabValue.ValueString = valueStrFinal;
							}
							else
							{
								if(!valueStr.match("^rs"))
									errorMsg.push("The text for rs# should start with 'rs'");
								else
									errorMsg.push("The text for rs# is invalid");
							}
						}
						var zygsity = i2b2.CRC.view.GENOTYPE.getZygosities();
						if(zygsity.length==0)
							errorMsg.push("\nThe zygosity is required. Please make a selection.");
						else
							tmpLabValue.Zygosity = zygsity;
					}
					if(dm.searchByGeneName)  //Validate gene name input
					{
						tmpLabValue.searchByRsId = false;
						tmpLabValue.searchByGeneName = true;
						
						var geneName = jQuery("#frmEnterGeneNameValue").val();
						
						var valueStr = geneName.replace(/-/g, '_');   //Replace the hyphens from gene names with underscores
						valueStr = valueStr.replace(/ /g,"_"); //Replace the blanks from gene names with underscores
						if(valueStr.length==0)
							errorMsg.push("The text for gene name can't be empty!");
						else
							tmpLabValue.ValueString = valueStr;
							
						var zygsity = i2b2.CRC.view.GENOTYPE.getZygosities();
						if(zygsity.length==0)
							errorMsg.push("\nThe zygosity is required. Please make a selection.");
						else
							tmpLabValue.Zygosity = zygsity;
						
						var consequnce = i2b2.CRC.view.GENOTYPE.getConsequences();
						tmpLabValue.Consequence = consequnce;
					}
				}
				else{
					alert("Not a Genotype data!");
				}
			}
			else{
				alert("Not a Genotype data!");
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
			if (i2b2.CRC.view.GENOTYPE.isModifier) {
				if (tmpLabValue) {
					i2b2.CRC.view.GENOTYPE.i2b2Data.ModValues = tmpLabValue;
				} else {
					delete i2b2.CRC.view.GENOTYPE.i2b2Data.ModValues;
				}
			} else { 
				if (tmpLabValue) {
					if(!i2b2.CRC.view.GENOTYPE.pluginCallerObj)
						i2b2.CRC.view.GENOTYPE.i2b2Data.LabValues = tmpLabValue;
					else
						i2b2.CRC.view.GENOTYPE.pluginCallerObj.currentTerm.LabValues = tmpLabValue;
				} else {
					delete i2b2.CRC.view.GENOTYPE.i2b2Data.LabValues;
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
		i2b2.CRC.view.GENOTYPE.formdata.ignoreChanges = true;
		var dm = i2b2.CRC.view.GENOTYPE.cfgTestInfo;
		var fd = i2b2.CRC.view.GENOTYPE.formdata;
		fd.selectedType= "VALUE";
		
		// work with the data type
		try {
			var t = i2b2.h.getXNodeVal(refXML, 'DataType');
			switch(t) {
				case "GENOTYPE_GENE":
			    case "GENOTYPE_GENE_INDEL":
			    case "GENOTYPE_GENE_SNP": 
				case "GENOTYPE_RSID":
				case "GENOTYPE_RSID_INDEL":
				case "GENOTYPE_RSID_SNP":  //For Genotype metadata
					dm.valueType = "GENOTYPE";
					dm.valueValidate.onlyPos = false;
					dm.valueValidate.onlyInt = false;
					var dataType = t;
					var genotypeParams = dataType.split("_");
					if(genotypeParams && genotypeParams.length>1)
					{
						if(genotypeParams[1].toLowerCase().indexOf('rsid')>=0)
						{
							dm.searchByRsId = true;
							dm.searchByGeneName = false;
							dm.basecode = conceptCode;
						}
						else
						{
							dm.searchByRsId = false;
							dm.searchByGeneName = true;
						}
						if(genotypeParams.length==3)
						{
							dm.geneType = genotypeParams[2];
						}
					}
					break;					
				default:
					dm.valueType = false;
			}
		} catch(e) {
			dm.valueType = false;
		}
	
		// set the title bar (TestName and TestID are assumed to be mandatory)
		this.sd.setHeader("Choose value of <span title='"+i2b2.h.getXNodeVal(refXML, 'TestName')+" (Test:"+i2b2.h.getXNodeVal(refXML, 'TestID')+")'>"+i2b2.h.getXNodeVal(refXML, 'TestName'));
	
		if (dm.valueType == "GENOTYPE") {
			if(dm.searchByRsId)
				$('valueContraintText').innerHTML = "Use the rs identifier box to specify the variant for which to search.  When you begin typing in the search box below, a selection list will appear after you type the first three numbers.";
			else if(dm.searchByGeneName)
				$('valueContraintText').innerHTML = "Use the gene name box to specify the variant for which to search.  When you begin typing in the search box below, a selection list will appear after you type the first characters.";
			else
				$('valueContraintText').innerHTML = "Use the following input type to search Genomics data.  When you begin typing in the search box below, a selection list will appear after you type the first three characters.";
				
			jQuery("#valueContraintText").addClass('genotypeHeading');
			this.sd.setHeader("Search by "+i2b2.h.getXNodeVal(refXML, 'TestName'));
		}
	
		$('frmEnterRSIDValue').value = 'rs';
		var readOnlyLength = 2;

		jQuery('#frmEnterRSIDValue').on('keypress, keydown', function(event) {
			if ((this.selectionStart <= readOnlyLength) && (event.which == 8 || event.which == 46)) {
				$('frmEnterRSIDValue').value = 'rs';
				return false;
			}
		});
		$('frmEnterGeneNameValue').value = '';
		jQuery("#zygosityTypes").multipleSelect({
            placeholder: "Please make a selection",
			maxHeight: 100
        });
		jQuery("#zygosityTypes").multipleSelect("uncheckAll");
		
		jQuery("#consequenceTypes").multipleSelect({
            placeholder: "Please make a selection",
			maxHeight: 100
        });
		jQuery("#consequenceTypes").multipleSelect("uncheckAll");

		// save the initial values into the data model
		fd.dbOperator = true;
		i2b2.CRC.view.GENOTYPE.formdata.ignoreChanges = false;
		i2b2.CRC.view.GENOTYPE.addHandlers();
		i2b2.CRC.view.GENOTYPE.Redraw();
	},
	
	// ================================================================================================== //
	
	changeHandler: function(e) {
	
	},
	
	// ================================================================================================== //
	addHandlers: function(){
		//Adds the auto-complete functionality to specific input
		var dm = i2b2.CRC.view.GENOTYPE.cfgTestInfo;
					
		if(dm.valueType != "GENOTYPE") { return; }
		
		if(dm.searchByRsId){
			jQuery( "#frmEnterRSIDValue" ).autocomplete({
				source: function( request, response ) {
					jQuery.ajax({
					  url: "genomicsAutoComplete.php",
					  dataType: "json",
					  data: {
						request_type: "ajax",
						op:'rsid',
						basecode :dm.basecode,
						term: jQuery( "#frmEnterRSIDValue" ).val()
					  },
					  success: function( data ) {
						var rep = new Array(); // response array
						// simple loop for the options
						for (var i = 0; i < data.length; i++) {
							var item = data[i];
							if ( item.c_name )
								// add element to result array
								rep.push({
									label: item.c_name,
									value: item.c_name,
								});
						}
						if(rep.length>0){
							var isIE11 = !!navigator.userAgent.match(/Trident.*rv\:11\./);
							// send response
							if(isIE11)
								response( rep.slice(0, 100) );
							else
								response( rep );
						}
						else
						{
							jQuery('#searchRSID').hide();
						}
					  }
					});
				},
				minLength:5,
				delay: 700,
				search: function(event, ui) { 
					jQuery('#searchRSID').show();
				},
				select: function(event,ui){
					jQuery( "#frmEnterRSIDValue" ).val( ui.item.c_name );
				},
				// optional
				html: true, 
				// optional (if other layers overlap the autocomplete list)
				open: function(event, ui) {
					jQuery(".ui-autocomplete").css("z-index", 1000);
					jQuery(this).focus();
					jQuery('#searchRSID').hide();
				}
			}).autocomplete( "widget" ).addClass( "gtpAutoComplete" );
		}
		if(dm.searchByGeneName)
		{
			jQuery( "#frmEnterGeneNameValue" ).autocomplete({
				source: function( request, response ) {
					jQuery.ajax({
					  url: "genomicsAutoComplete.php",
					  dataType: "json",
					  data: {
						request_type: "ajax",
						op:'gene',
						term: jQuery( "#frmEnterGeneNameValue" ).val()
					  },
					  success: function( data ) {
						var rep = new Array(); // response array
						// simple loop for the options
						for (var i = 0; i < data.length; i++) {
							var item = data[i];
							if ( item.c_name )
								// add element to result array
								rep.push({
									label: item.c_name,
									value: item.c_name,
								});
						}
						if(rep.length>0){
							// send response
							response( rep );
						}
						else
						{
							jQuery('#searchGeneName').hide();
						}
					  }
					});
				},
				minLength:1,
				search: function(event, ui) { 
					jQuery('#searchGeneName').show();
				},
				focus: function( event, ui ) {
					jQuery( "#frmEnterRSIDValue" ).val( ui.item.c_name );
					return false;
				},
				select: function(event,ui){
					var a = ui.c_name;
				},
						// optional
				html: true, 
				// optional (if other layers overlap the autocomplete list)
				open: function(event, ui) {
					jQuery(".ui-autocomplete").css("z-index", 1000);
					jQuery('#searchGeneName').hide();
				}
			}).autocomplete( "widget" ).addClass( "gtpAutoComplete" );
		}
	},
	
	// ================================================================================================== //
	
	getZygosities: function(){
		var zygosityList = jQuery("#zygosityTypes").multipleSelect("getSelects");
		var zygosities = "";
		if(zygosityList.length==1)
		{
			var item = zygosityList[0];
			if(item != ""){
				zygosities = item;
			}
		}
		else
		{
			for(var i = 0 ; i < zygosityList.length ; i++)
			{
				var item = zygosityList[i];
				if(i==0)
					zygosities += "(";
				if(item != ""){
					if(i < zygosityList.length-1)
						zygosities += item + " OR ";
					else
						zygosities += item + ")";
				}
			}
		}
		return zygosities;
	},
	
	// ================================================================================================== //
	
	getConsequences: function(){
		var consequencesList = jQuery("#consequenceTypes").multipleSelect("getSelects");
		// var consequencesList = consequence.split(",");
		var consequences = "";
		if(consequencesList.length==1)
		{
			var item = consequencesList[0];
			if(item != ""){
				consequences = item;
			}
		}
		else if((consequencesList.length==2) && (consequencesList[0].toLowerCase()=='' || consequencesList[1].toLowerCase()==''))
		{
			var item = consequencesList[0];
			if(item.toLowerCase()=='')
			{
				item = consequencesList[1];
			}
			if(item != ""){
				consequences = item;
			}
		}
		else
		{
			for(var i = 0 ; i < consequencesList.length ; i++)
			{
				var item = consequencesList[i];
				if(i==0)
					consequences += "(";
				if(item != ""){
					if(i < consequencesList.length-1)
						consequences += item + " OR ";
					else
						consequences += item + ")";
				}
			}
		}
		return consequences;
	},

	// ================================================================================================== //
	
	Redraw: function(){
		var fd = i2b2.CRC.view.GENOTYPE.formdata;
		var dm = i2b2.CRC.view.GENOTYPE.cfgTestInfo;
		
		if(dm.searchByRsId){
			$('frmEnterRSID').show();
			$('frmEnterRSIDText').show();
			$('zygosityRSIDSpecificText').show();
			$('zygosityGeneSpecificText').hide();
			$('frmEnterGeneName').hide();
			$('frmEnterGeneNameText').hide();
			Element.hide($('consequenceContainer'));
		}
		if(dm.searchByGeneName)
		{
			$('frmEnterRSID').hide();
			$('frmEnterRSIDText').hide();
			$('frmEnterGeneName').show();
			$('frmEnterGeneNameText').show();
			$('zygosityRSIDSpecificText').hide();
			$('zygosityGeneSpecificText').show();
			Element.show($('consequenceContainer'));
		}
	},
	
	// ================================================================================================== //
	
	formatLabValues: function(key, pd){
		if(!i2b2.CRC.view.GENOTYPE.pluginCallerObj){
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
			var values = i2b2.CRC.view.GENOTYPE.pluginCallerObj.currentTerm.LabValues;
		
		if(!values) return;

		var formattedLabValues = '';
		if(values.searchByRsId){
			formattedLabValues = values.ValueString + ((values.Allele && values.Allele != '')?(" AND "+values.Allele):"") + ((values.Zygosity && values.Zygosity != '')?(" AND "+values.Zygosity):"")  + ((values.Consequence && values.Consequence != '')?(" AND "+values.Consequence):"");
		}
		if(values.searchByGeneName){
			formattedLabValues = values.ValueString + ((values.Zygosity && values.Zygosity != '')?(" AND "+values.Zygosity):"") + ((values.Consequence && values.Consequence != '')?(" AND "+values.Consequence):"") ;
		}
		
		values.formattedLabValues = ' [contains "' + formattedLabValues + '"]';
		values.cdataTextValue = formattedLabValues;
		return formattedLabValues;
	},
	
	// On right click this method creates the GENOTYPE data structure 
	parseLabValues: function(labValues,dataType){
		var updatedLabValues = labValues;
		updatedLabValues.MatchBy = "VALUE";
		updatedLabValues.GeneralValueType = "GENOTYPE";
		updatedLabValues.DbOp = true;
		//Find out whether the concept is rsid or gene
		var genotypeParams = dataType.split("_");
		if(genotypeParams && genotypeParams.length>1)
		{
			if(genotypeParams[1].toLowerCase().indexOf('rsid')>=0)
			{
				updatedLabValues.searchByRsId = true;
				updatedLabValues.searchByGeneName = false;
			}
			else
			{
				updatedLabValues.searchByRsId = false;
				updatedLabValues.searchByGeneName = true;
			}
			if(genotypeParams.length==3)
			{
				updatedLabValues.geneType = genotypeParams[2];
			}
		}
		//Parse the value_constraint to find different input
		var val_constraint = updatedLabValues.ValueString;
		updatedLabValues.WholeValueString = val_constraint;
		var valsArray = val_constraint.split(" AND ");
		if(valsArray){
			for(var i = 0 ; i < valsArray.length; i++)
			{
				var thisInput = valsArray[i];
				var testParam = null;
				try{
					if(thisInput.indexOf("(")>=0){
						//This param can either be zygosity or consequence. Determine the type.
						var paramLength = thisInput.length;
						var params = thisInput.substring(1, paramLength);
						var splitParams = params.split(" OR ");
						testParam = splitParams[0];
					}
				}
				catch(e)
				{}
				
				if(i==0)
				{
					updatedLabValues.ValueString = thisInput;
				}
				else
				{
					if((jQuery.inArray( thisInput, zygosityValues )>-1) || (testParam && (jQuery.inArray( testParam, zygosityValues )>-1)))
					{
						updatedLabValues.Zygosity = thisInput;
					}
					if((jQuery.inArray( thisInput, consequenceValues )>-1) || (testParam && (jQuery.inArray( testParam, consequenceValues )>-1)))
					{
						updatedLabValues.Consequence = thisInput;
					}
					if(thisInput.indexOf('_to_')>=0)
					{
						updatedLabValues.Allele = thisInput;
					}
					
				}
			}
		}
		return updatedLabValues;
	}
};

