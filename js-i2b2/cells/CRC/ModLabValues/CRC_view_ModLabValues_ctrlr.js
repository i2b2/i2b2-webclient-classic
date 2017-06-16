/**
 * @projectDescription	(GUI-only) Master Controller for CRC Query Tool's Value constraint dialog boxes.
 * @inherits 	i2b2.CRC.view
 * @namespace	i2b2.CRC.view.modLabvaluesCtlr
 * @author		Bhaswati Ghosh
 * @version 	
 * ----------------------------------------------------------------------------------------
 */

i2b2.CRC.view.modLabvaluesCtlr = {
	//Is called when a concept that has lab values associated is dropped in the query panel
	selectValueBox: function(panelIndex, queryPanelController, key, extData, isModifier,pluginObj) {
		if (!pluginObj && Object.isUndefined(i2b2.CRC.model.queryCurrent.panels[i2b2.CRC.ctrlr.QT.temporalGroup][panelIndex])) { return; }

		//Determine the value type 
		var mdnodes = i2b2.h.XPath(extData.origData.xmlOrig, 'descendant::metadataxml/ValueMetadata[Version]');
		
		if (mdnodes.length > 0) {
			var dataType = i2b2.h.getXNodeVal(mdnodes[0], 'DataType');
			if(dataType)
				var valueType = this.getValueType(dataType);
			else
				var valueType = "NODATATYPE";
		} else {
			// no LabValue configuration
			return false;
		}
		
		// notify the value type's controller class to activate
		try {
			if(valueType){
				var GeneralValueType = valueType;
				i2b2.CRC.view[GeneralValueType].showDialog(panelIndex, queryPanelController, key, extData, isModifier,pluginObj);
			}
			else
				alert('An error has occurred while trying to determine the value type.');
		} catch(e) {
			alert('An error has occurred while trying to initialize the Valuebox.');
		}
	},
	
	getValueType : function(dataType)
	{
		if(!i2b2.ValueTypes.type.hasOwnProperty(dataType))
			var valuetype = i2b2.ValueTypes.type["DEFAULT"];
		else
			var valueType = i2b2.ValueTypes.type[dataType];
		return valueType;
	},
	
	//Does the initial loading of the LabValues object for related concepts when a previous query is loaded in the query panel. 
	processLabValuesForQryLoad : function(lvd)
	{
		// pull the LabValue definition for concept, extract & translate
		var t = i2b2.h.getXNodeVal(lvd,"value_constraint");
		LabValues = {};
		LabValues.NumericOp = i2b2.h.getXNodeVal(lvd,"value_operator");
		LabValues.GeneralValueType = i2b2.h.getXNodeVal(lvd,"value_type");								
		switch(LabValues.GeneralValueType) {
			case "NUMBER":
				LabValues.MatchBy = "VALUE";
				if (t.indexOf(' and ')!=-1) {
					// extract high and low values
					t = t.split(' and ');
					LabValues.ValueLow = t[0];
					LabValues.ValueHigh = t[1];
				} else {
					LabValues.Value = t;
				}
				LabValues.UnitsCtrl = i2b2.h.getXNodeVal(lvd,"value_unit_of_measure");										
				
				break;
			case "STRING":
				LabValues.MatchBy = "VALUE";
				LabValues.ValueString = t;
				break;
			case "LARGETEXT":
					LabValues.MatchBy = "VALUE";
					LabValues.GeneralValueType = "LARGESTRING";
					LabValues.DbOp = (i2b2.h.getXNodeVal(lvd,"value_operator") == "CONTAINS[database]" ? true : false );													
					LabValues.ValueString = t;
				break;
			case "TEXT":	// this means Enum?
				LabValues.MatchBy = "VALUE";
				try {
					LabValues.ValueEnum = eval("(Array"+t+")");
					LabValues.GeneralValueType = "ENUM";																									
				} catch(e) {
					//is a string
					LabValues.StringOp = i2b2.h.getXNodeVal(lvd,"value_operator");
					LabValues.ValueString = t;
					LabValues.GeneralValueType = "STRING";	
				}
				break;
			case "FLAG":
				LabValues.MatchBy = "FLAG";
				LabValues.ValueFlag = t
				break;		
			default:
				LabValues.Value = t;
		}
		return 	LabValues;
	},
	
	//Does the initial loading of the ModValues object for related concepts when a previous query is loaded in the query panel. 
	processModValuesForQryLoad : function(lvd)
	{
		ModValues = {};
		// pull the LabValue definition for concept, extract & translate
		var t = i2b2.h.getXNodeVal(lvd,"value_constraint");
		ModValues.NumericOp = i2b2.h.getXNodeVal(lvd,"value_operator");
		ModValues.GeneralValueType = i2b2.h.getXNodeVal(lvd,"value_type");	
		switch(ModValues.GeneralValueType) {
			case "NUMBER":
				ModValues.MatchBy = "VALUE";
				if (t.indexOf(' and ')!=-1) {
					// extract high and low values
					t = t.split(' and ');
					ModValues.ValueLow = t[0];
					ModValues.ValueHigh = t[1];
				} else {
					ModValues.Value = t;
				}
				ModValues.UnitsCtrl = i2b2.h.getXNodeVal(lvd,"value_unit_of_measure");	
				break;
			case "STRING":
				ModValues.MatchBy = "VALUE";
				ModValues.ValueString = t;
				break;
			case "LARGETEXT":
				ModValues.MatchBy = "VALUE";
				ModValues.GeneralValueType = "LARGESTRING";
				ModValues.DbOp = (i2b2.h.getXNodeVal(lvd,"value_operator") == "CONTAINS[database]" ? true : false );													
				ModValues.ValueString = t;
				break;
			case "TEXT":	// this means Enum?
				ModValues.MatchBy = "VALUE";
				try {
					ModValues.ValueEnum = eval("(Array"+t+")");
					ModValues.GeneralValueType = "ENUM";													
				} 
				catch(e) {
					ModValues.StringOp = i2b2.h.getXNodeVal(lvd,"value_operator");
					ModValues.ValueString = t;
				}
				break;
			case "FLAG":
				ModValues.MatchBy = "FLAG";
				ModValues.ValueFlag = t
				break;		
			default:
				ModValues.Value = t;
		}
		return ModValues;
	},
	
	//Creates the text to be displayed in the query panel when a previous query with concepts having labvalues is dropped
	getTitleForValues : function(values,sdxConcept)
	{
		var title = "";
		switch(values.MatchBy) {
			case "FLAG":
				title = ' = '+i2b2.h.Escape(values.ValueFlag);
			//mm ??not sure tvChildren[i].html = ' = '+i2b2.h.Escape(values.ValueFlag) + "</div></div>";
				break;
			case "VALUE":
				if ((values.GeneralValueType== "LARGESTRING") || (values.GeneralValueType=="TEXT")) {
					title = ' = ("' + values.ValueString +'")';
					try
					{
						var conceptPath = sdxConcept.origData.key;
						if(conceptPath && conceptPath.indexOf("genomics")>=0)
							title = ' [contains "' + values.ValueString +'"]';
					}
					catch(e)
					{}
				} else if (values.GeneralValueType=="STRING") { 
					if (values.StringOp == undefined )
					{
						var stringOp = "";
					} 
					else 
					{
						switch(values.StringOp) {
							case "LIKE[exact]":
								var  stringOp = "Exact: ";
								break;
							case "LIKE[begin]":
								var  stringOp = "Starts With: ";
								break;
							case "LIKE[end]":
								var  stringOp = "Ends With: ";
								break;
							case "LIKE[contains]":
								var  stringOp = "Contains: ";
								break;
							default:
								var stringOp = "";
								break;
						}
					}
					title += ' ['+stringOp + i2b2.h.Escape(values.ValueString) + "]";
				} else if (values.GeneralValueType=="GENOTYPE") {
					title = ' [contains "' + values.WholeValueString +'"]';
				} else if (values.GeneralValueType=="ENUM") { 
					try {
						var sEnum = [];
						for (var i2=0;i2<values.ValueEnum.length;i2++) {
							sEnum.push(i2b2.h.Escape(values.ValueEnum[i2]));
						}
						sEnum = sEnum.join("\", \"");
						sEnum = ' =  ("'+sEnum+'")';
						//tvChildren[i].html =  sEnum + "</div></div>"
						title = sEnum;
					} catch (e) {
						
					}
				} else {
					if (values.NumericOp == 'BETWEEN') {
						title =  ' '+i2b2.h.Escape(values.ValueLow)+' - '+i2b2.h.Escape(values.ValueHigh);
					} else {
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
				}
				break;
			case "":
				break;
		}
		
		return title;
	},
	
	//Creates the xml part for the concept with a lab value when a query request xml is generated
	getModLabValuesForXML : function(lvd) {
		if(!lvd.MatchBy) return;
		var s = '\t\t\t<constrain_by_value>\n';
		switch(lvd.MatchBy) {
			case "FLAG":
				s += '\t\t\t\t<value_type>FLAG</value_type>\n';
				s += '\t\t\t\t<value_operator>EQ</value_operator>\n';
				s += '\t\t\t\t<value_constraint>'+i2b2.h.Escape(lvd.ValueFlag)+'</value_constraint>\n';
				break;
			case "VALUE":
				if (lvd.GeneralValueType=="ENUM") {
					var sEnum = [];
					for (var i2=0;i2<lvd.ValueEnum.length;i2++) {
						sEnum.push(i2b2.h.Escape(lvd.ValueEnum[i2]));
					}
					sEnum = sEnum.join("\',\'");
					sEnum = '(\''+sEnum+'\')';
					s += '\t\t\t\t<value_type>TEXT</value_type>\n';
					s += '\t\t\t\t<value_constraint>'+sEnum+'</value_constraint>\n';
					s += '\t\t\t\t<value_operator>IN</value_operator>\n';								
				 } else if ((lvd.GeneralValueType=="STRING") || (lvd.GeneralValueType=="TEXT")){
					s += '\t\t\t\t<value_type>TEXT</value_type>\n';
					s += '\t\t\t\t<value_operator>'+lvd.StringOp+'</value_operator>\n';
					s += '\t\t\t\t<value_constraint><![CDATA['+i2b2.h.Escape(lvd.ValueString)+']]></value_constraint>\n';
				} else if (lvd.GeneralValueType=="LARGESTRING") {
					if (lvd.DbOp) {
						s += '\t\t\t\t<value_operator>CONTAINS[database]</value_operator>\n';
					} else {
						s += '\t\t\t\t<value_operator>CONTAINS</value_operator>\n';											
					}
					s += '\t\t\t\t<value_type>LARGETEXT</value_type>\n';
					s += '\t\t\t\t<value_constraint><![CDATA['+lvd.ValueString+']]></value_constraint>\n';
				} else if (lvd.GeneralValueType=="GENOTYPE") {
					s += '\t\t\t\t<value_operator>CONTAINS[database]</value_operator>\n';  //mandate the contains[database] operation
					s += '\t\t\t\t<value_type>LARGETEXT</value_type>\n';
					var cdataText = lvd.cdataTextValue;
					if(!cdataText)
						cdataText = lvd.WholeValueString;
					s += '\t\t\t\t<value_constraint><![CDATA['+cdataText+']]></value_constraint>\n';
				} else {
					s += '\t\t\t\t<value_type>'+lvd.GeneralValueType+'</value_type>\n';
					s += '\t\t\t\t<value_unit_of_measure>'+lvd.UnitsCtrl+'</value_unit_of_measure>\n';
					s += '\t\t\t\t<value_operator>'+lvd.NumericOp+'</value_operator>\n';
					if (lvd.NumericOp == 'BETWEEN') {
						s += '\t\t\t\t<value_constraint>'+i2b2.h.Escape(lvd.ValueLow)+' and '+i2b2.h.Escape(lvd.ValueHigh)+'</value_constraint>\n';
					} else {
						s += '\t\t\t\t<value_constraint>'+i2b2.h.Escape(lvd.Value)+'</value_constraint>\n';
					}
				}
				break;
			case "":
				break;
		}
		s += '\t\t\t</constrain_by_value>\n';
		return s;
	}
};

