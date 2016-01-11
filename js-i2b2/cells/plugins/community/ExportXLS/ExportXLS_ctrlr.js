/**
 * @projectDescription	i2b2 XLS Export Plugin 
 * @inherits			i2b2
 * @namespace			i2b2.ExportXLS
 * @authors 	        Mauro Bucalo [Universita' di Pavia]; S. Wayne Chan [University of Massachusetts Medical School]; Axel Newe [FAU Erlangen-Nuremberg]; 
 *                      PARIS Nicolas [H�pital Ambroise Par�]
 * =========================================================================================================================================================================
 *    date    ver. update summary [coding engineer / developer, institute]
 * ---------- ---- -------------------------------------------------------
 * 2011-06-10 1.0  Initial Launch, for i2b2 v1.5 [Mauro Bucalo, Universita' di Pavia] 
 * 2011-07-18 1.1  Misc. compatibility (i2b2 v1.3), interface, & tabulation enhancements (for local users only) [S. Wayne Chan, University of Massachusetts Medical School]
 * 2012-01-xx 1.6  Updated for i2b2 v1.6 [Mauro Bucalo, Universita' di Pavia]
 * 2012-02-13 2.0  More compatibility (Internet Explorer), interface, & tabulation enhancements [S. Wayne Chan, University of Massachusetts Medical School]
 * 2013-01-09 3.0  Added many features (CSV export, tabulating options, formatting options, paged queries...), heavily re-engineered [Axel Newe, FAU Erlangen-Nuremberg] 
 * 2013-10-30 3.1  Fixed several minor bugs & added 'Locality' tabulation column, etc. (for local users only) [S. Wayne Chan, University of Massachusetts Medical School]
 * 2013-11-15 3.2  Added option to select target subset from a large patient set & termination at server failure, enhanced progress feedbacks [Wayne Chan, UMass Med School]
 * 2014-03-13 3.3  Added Observation_blob support & several new columns for observation values(for local users only) [PARIS Nicolas, H�pital Ambroise Par�]
 * 2014-03-27 3.3  updated new observation value columns for easier user understanding [Wayne Chan, UMass Med School]
 * 2015-11-06 3.4  fixed compatibility issue with the new prototype.js v.1.7.2 (ships with webclient v1.7.0.7), other minor touch-ups,   
 *                 & fixed selected patient subset size and starting & ending patient numbers off by 1 problems [Wayne Chan]
 * 2015-12-30 3.4  Hid "<br>" in any of the concept names (under all tab pages, as well as in exported .XLS & .CSV files)
 *                 & fixed .CSV concept contents for '1 row per patient' (to prevent them from scattering across multiple lines)  [Wayne Chan]                 
 */

 i2b2.ExportXLS.DEBUG_GetPropertyList = function(object)
 {
	var propertyList = "";
	
	for (var thisPropertyName in object) {
		propertyList += thisPropertyName + '\n';
	}
 
	return propertyList;
 }
 
i2b2.ExportXLS.InitAndResetGlobalVars = function()
{
 	// Global var to store concept columns for "single_filtered" and "single_detailed" mode
	i2b2.ExportXLS.ConceptColumns = new Array();

 	// Global vars to store count, lower border & upper border for chunked PDO queries.
	i2b2.ExportXLS.PDOQueryPatientCount = 0;
	i2b2.ExportXLS.PDOQueryChunkLower = 0;
	i2b2.ExportXLS.PDOQueryChunkUpper = 0;
	i2b2.ExportXLS.PDOQueryChunkCurrent = 1;

 	// Global vars to store end number of patient, for PDO queries.
	i2b2.ExportXLS.PDOQueryPatientEndNum = 1; // 0-based indexing

 	// Global var to store the number of patient chunks, for PDO queries.
	i2b2.ExportXLS.PDOQueryPatientChunkTotal = 1;

 	// Global var to store the actual patientset size.
	i2b2.ExportXLS.patientsetSize = 0;
	
 	// Global vars to store the start time & estimated end time.
	i2b2.ExportXLS.StartTime = 0;
	
	// Global var to flag whether query has been paged by server
	i2b2.ExportXLS.PDOQueryPagedByServer = false;
	
	// Global var to store result matrix
	i2b2.ExportXLS.ResultMatrix = new Array();

	// Global var to store CSV result
	i2b2.ExportXLS.CSVExport = "";

	// Global var to store HTML table result
	i2b2.ExportXLS.HTMLResult = "";

	// Global var to store all patient sets returned
	i2b2.ExportXLS.Patients = new Array();
	
	// Global var to store all observation sets returned
	i2b2.ExportXLS.ObservationSets = {};
	
	// Global var for patient demographic data column order. This also defines which columns are considered at all!
	// The full set would be: 
	i2b2.ExportXLS.PatientDataColumns = new Array ( "sex_cd", "age_in_years_num", "birth_date", "birth_year", "vital_status_cd", "language_cd", "marital_status_cd", "race_cd", "religion_cd", "income_cd", "statecityzip_path", "state_path", "city_path", "locality_path", "zip_cd");
	
	// Global var for patient demographic data column headers 
	i2b2.ExportXLS.PatientDataColumnHeaders = { "vital_status_cd": "Vital Status", "language_cd": "Language", "birth_date": "Birth Date", "birth_year": "Birth Year", "race_cd": "Race", "religion_cd": "Regligion", "income_cd": "Income", "statecityzip_path": "State/City/ZIP", "state_path": "State", "city_path": "City", "locality_path": "Locality", "zip_cd": "ZIP", "marital_status_cd": "Marital Status", "age_in_years_num": "Age in Years", "sex_cd": "Sex" };	
}
 
i2b2.ExportXLS.SetAccessories = function() {
	var curWrkPath = i2b2.PLUGINMGR.ctrlr.main.currentPluginCtrlr.cfg.config.assetDir;
	var dot_spr = curWrkPath + "loading.gif";
	var csv_btn = curWrkPath + "exportCSVBtn.png";
	var xls_btn = curWrkPath + "exportHTMLXLSBtn.png";
	var xls_php = curWrkPath + "SaveToHTMLXLS.php?suffix=patient-observations";
	var csv_php = curWrkPath + "SaveToCSV.php?suffix=patient-observations";
	//alert("xls_php='" + xls_php + "'\n\ncsv_php='" + csv_php + "'\n\ndot-spiral='" + dot_spr + "'\ncsv_btn='" + csv_btn + "'\nxls_btn='" + xls_btn + "'");
	$j("#dotSpiral1").attr("src", dot_spr);
	$j("#dotSpiral2").attr("src", dot_spr);
	$j("#save2csv").attr("action", csv_php);
	$j("#save2xls").attr("action", xls_php);
	$j("#save2csvBtn").attr("src", csv_btn);
	$j("#save2xlsBtn").attr("src", xls_btn);
	$j("#csvBtn").attr("src", csv_btn);
	$j("#xlsBtn").attr("src", xls_btn);
} // end of SetAccessories()

i2b2.ExportXLS.ResetOptionsToDefault = function()
{
	// Default output options
	i2b2.ExportXLS.model.dirtyResultsData = true;
	i2b2.ExportXLS.model.dirtyMatrixData = true;
	i2b2.ExportXLS.model.outputOptions = {};	

	i2b2.ExportXLS.model.outputOptions.queryPageSize = 20;

	i2b2.ExportXLS.model.outputOptions.StartingPatient = 1;
	i2b2.ExportXLS.model.outputOptions.NumberOfPatients = 500;
	
	i2b2.ExportXLS.model.outputOptions.replacePatientID = false;
	i2b2.ExportXLS.model.outputOptions.excludeDelimiter = false;
	i2b2.ExportXLS.model.outputOptions.resolveConceptDetails = false;
	i2b2.ExportXLS.model.outputOptions.includeOntologyPath = false;
	i2b2.ExportXLS.model.outputOptions.outputFormat = "single_filtered";
	i2b2.ExportXLS.model.outputOptions.includePatientDemoData_Sex = false;
	i2b2.ExportXLS.model.outputOptions.includePatientDemoData_Age = false;
	i2b2.ExportXLS.model.outputOptions.includePatientDemoData_BirthDate = false;
	i2b2.ExportXLS.model.outputOptions.includePatientDemoData_BirthYear = false;
	i2b2.ExportXLS.model.outputOptions.includePatientDemoData_VitalStatus = false;
	i2b2.ExportXLS.model.outputOptions.includePatientDemoData_Language = false;
	i2b2.ExportXLS.model.outputOptions.includePatientDemoData_Race = false;
	i2b2.ExportXLS.model.outputOptions.includePatientDemoData_Religion = false;
	i2b2.ExportXLS.model.outputOptions.includePatientDemoData_Income = false;
	i2b2.ExportXLS.model.outputOptions.includePatientDemoData_StateCityZIP = false;
	i2b2.ExportXLS.model.outputOptions.includePatientDemoData_Locality = false;
	i2b2.ExportXLS.model.outputOptions.includePatientDemoData_State = false;
	i2b2.ExportXLS.model.outputOptions.includePatientDemoData_City = false;
	i2b2.ExportXLS.model.outputOptions.includePatientDemoData_ZIP = false;
	i2b2.ExportXLS.model.outputOptions.includePatientDemoData_MaritalStatus = false;
	i2b2.ExportXLS.model.CsvDelimiter = ",";	
} 

i2b2.ExportXLS.UpdateProgressMessage = function(progressMessage)
{
	$("results-working-progress").innerHTML = progressMessage;
	$("results-working-hard-progress").innerHTML = progressMessage;
}

i2b2.ExportXLS.UpdateTimeMessage = function()
{
	var t = i2b2.ExportXLS.getElapsedTime(i2b2.ExportXLS.StartTime);
	$("results-working-time").innerHTML = "Elapsed time (as of the last completed subgroup): " + i2b2.ExportXLS.getDurationInHrMinSec(t);
	$("results-remaining-time").innerHTML = "estimated remaining run time: " + i2b2.ExportXLS.getEstimatedTimeRemaining(t);
}

i2b2.ExportXLS.CalcPDOChunkUpper = function() 
{
	var lower = i2b2.ExportXLS.PDOQueryChunkLower;
	var upper = i2b2.ExportXLS.PDOQueryPatientCount; // Set upper border by default to # of patients
	var total = i2b2.ExportXLS.PDOQueryPatientEndNum + 1;
	var chunkSize = i2b2.ExportXLS.model.outputOptions.queryPageSize;
	
	if (chunkSize != 0)
	{
		upper = lower + chunkSize - 1;
		
		if (upper > total)
		{
			upper = total;
		}		
	}

	i2b2.ExportXLS.PDOQueryChunkUpper = upper;
	
	return;
}

i2b2.ExportXLS.AllChunksQueried = function()
{
	result = false;
	
	if (i2b2.ExportXLS.PDOQueryChunkUpper >= i2b2.ExportXLS.PDOQueryPatientEndNum)
	{
		result = true;	
	}

	return result;
}

i2b2.ExportXLS.ResultsTabSelected = function(ev)
{
	// Tabs have changed 
	// Set up the full relative paths of the accessory files (Save*.php, *.png, *.gif, etc.)
	i2b2.ExportXLS.SetAccessories();

	if (ev.newValue.get('id')=="ExportXLS-TAB2") 
	{
		// User switched to Results table_html
		if (  (i2b2.ExportXLS.model.concepts.length > 0) && (i2b2.ExportXLS.model.prsRecord)  ) 
		{				
			if (i2b2.ExportXLS.model.dirtyResultsData) // Query new result data only if relevant input data has changed
			{	
				i2b2.ExportXLS.ClearResults();
				
				i2b2.ExportXLS.PDOQueryPagedByServer = false;
				$("results-server-paging-warning").innerHTML = "";
		
				var psSize = i2b2.ExportXLS.model.prsRecord.origData.size; 
				var numPats = i2b2.ExportXLS.model.outputOptions.NumberOfPatients;
				var startingPat = i2b2.ExportXLS.model.outputOptions.StartingPatient;
				var targetPatCount = i2b2.ExportXLS.calcPatientCountAndEndNum(psSize, numPats, startingPat); // in case user changed any values
				i2b2.ExportXLS.StartTime = i2b2.ExportXLS.getCurrentTime();
				i2b2.ExportXLS.calcPDOChunkTotal();

				i2b2.ExportXLS.PDOQueryChunkLower = i2b2.ExportXLS.model.outputOptions.StartingPatient;
				i2b2.ExportXLS.CalcPDOChunkUpper();
				i2b2.ExportXLS.PDOQueryChunkCurrent = 0;
				
				i2b2.ExportXLS.GetResults(); 
			}
			else if (i2b2.ExportXLS.model.dirtyMatrixData) // Reformat matrix if necessary
			{				
				i2b2.ExportXLS.FinishProcessing();
			}
		}
	}
}

i2b2.ExportXLS.Init = function(loadedDiv) 
{
	i2b2.ExportXLS.debugCounter = 0;
	
	// Register DIV as valid drag&drop target for Patient Record Set (PRS) objects
	var op_trgt = {dropTarget:true}
	
	i2b2.sdx.Master.AttachType("ExportXLS-CONCPTDROP", "CONCPT", op_trgt);
	i2b2.sdx.Master.AttachType("ExportXLS-PRSDROP", "PRS", op_trgt);

	// Drop event handlers used by this plugin
	i2b2.sdx.Master.setHandlerCustom("ExportXLS-CONCPTDROP", "CONCPT", "DropHandler", i2b2.ExportXLS.ConceptDropped);
	i2b2.sdx.Master.setHandlerCustom("ExportXLS-PRSDROP", "PRS", "DropHandler", i2b2.ExportXLS.PatientRecordSetDropped);

	// Array to store concepts
	i2b2.ExportXLS.model.concepts = [];	
	i2b2.ExportXLS.ResetOptionsToDefault();	
	
	// Global var to cache denotation strings for concept codes
	i2b2.ExportXLS.ConceptCodeDenotations = {};

	// Global var to cache ontology paths of concept codes
	i2b2.ExportXLS.ConceptCodeOntologyPaths = {};

	// Init global vars
	i2b2.ExportXLS.InitAndResetGlobalVars();

	// Manage YUI tabs
	this.yuiTabs = new YAHOO.widget.TabView("ExportXLS-TABS", {activeIndex:0});
	this.yuiTabs.on('activeTabChange', function(ev) { i2b2.ExportXLS.ResultsTabSelected(ev) } );
	
	// Fix IE scrollbar problem 
	var z = $('anaPluginViewFrame').getHeight() - 34;
	var mainContentDivs = $$('DIV#ExportXLS-TABS DIV.ExportXLS-MainContent');
	for (var i = 0; i < mainContentDivs.length; i++) 
	{
		mainContentDivs[i].style.height = z;
	}
	
	$("ExportXLS-PatStartNum").hide();
}

i2b2.ExportXLS.Unload = function() 
{
	// Mop up old data
	i2b2.ExportXLS.model.prsRecord = false;
	i2b2.ExportXLS.model.conceptRecord = false;
	i2b2.ExportXLS.model.dirtyResultsData = true;
	
	i2b2.ExportXLS.ResetOptionsToDefault();
	i2b2.ExportXLS.InitAndResetGlobalVars();

	return true;
}

i2b2.ExportXLS.PatientRecordSetDropped = function(sdxData) 
{
	sdxData = sdxData[0];	// only interested in first record
	// save the info to our local data model
	i2b2.ExportXLS.model.prsRecord = sdxData;
	// let the user know that the drop was successful by displaying the name of the patient set
	$("ExportXLS-PRSDROP").innerHTML = i2b2.h.Escape(sdxData.sdxInfo.sdxDisplayName);
	// temporarily change background color to give GUI feedback of a successful drop occurring
	$("ExportXLS-PRSDROP").style.background = "#CFB";
	
	$("ExportXLS-PatSetSize").innerHTML = i2b2.ExportXLS.getPatientSetSizeAndUsageMsg();
	var psSize = i2b2.ExportXLS.model.prsRecord.origData.size; 
	$("ExportXLS-NumberOfPatients").value = Math.min(Math.max($("ExportXLS-NumberOfPatients").value, 500), psSize); //since 1+psSize-$("ExportXLS-StartingPatient").value = 1+psSize-1 = psSize
	$("ExportXLS-PatStartNum").show();
	
	setTimeout("$('ExportXLS-PRSDROP').style.background='#DEEBEF'", 250);	
	// optimization to prevent re-querying the hive for new results if the input dataset has not changed
	i2b2.ExportXLS.model.dirtyResultsData = true;		
}

i2b2.ExportXLS.ConceptDropped = function(sdxData) 
{
	sdxData = sdxData[0];	// Consider first record only 
		
	var nameD = sdxData.sdxInfo.sdxDisplayName;  // Save the info to local data model

	if(i2b2.ExportXLS.model.concepts.length) 
	{	
		var flagConcept = false;
		
		for (var i3 = 0; i3 < i2b2.ExportXLS.model.concepts.length; i3++) 
		{		
			var nameC = i2b2.ExportXLS.model.concepts[i3].sdxInfo.sdxDisplayName;
			
			if (nameC == nameD)
			{
				flagConcept = true;
			}
			else
			{
				// do nothing, flagConcept stay false;
			}
			
			nameC = "";
		}
		
		if(!flagConcept)
		{		
			i2b2.ExportXLS.model.concepts.push(sdxData);			
			i2b2.ExportXLS.ConceptsRender();  				// Sort and display the concept list			
			i2b2.ExportXLS.model.dirtyResultsData = true;	// Optimization to prevent requerying the hive for new results if the input dataset has not changed
		}
		else 
		{
			alert("This concept has already been selected (duplicate concept would not be accepted)!!");
		}	
	}
	else 
	{
		i2b2.ExportXLS.model.concepts.push(sdxData);		
		i2b2.ExportXLS.ConceptsRender(); 				// Sort and display the concept list		
		i2b2.ExportXLS.model.dirtyResultsData = true; 	// Optimization to prevent requerying the hive for new results if the input dataset has not changed
	}		
			
}

i2b2.ExportXLS.ConceptDelete = function(concptIndex) 
{
	i2b2.ExportXLS.model.concepts.splice(concptIndex,1); // remove the selected concept
	i2b2.ExportXLS.ConceptsRender(); 					 // sort and display the concept list
	i2b2.ExportXLS.model.dirtyResultsData = true;		 // optimization to prevent requerying the hive for new results if the input dataset has not changed
}

i2b2.ExportXLS.SetFlag = function(ckBox, option, dirtyResults) 
{
	if (Object.isUndefined(dirtyResults))
	{
		dirtyResults = true;
	}

	if (dirtyResults)  
	{
		i2b2.ExportXLS.model.dirtyResultsData = true;
	}	

	i2b2.ExportXLS.model.outputOptions[option] = ckBox.checked;
	i2b2.ExportXLS.model.dirtyMatrixData = true;
}

i2b2.ExportXLS.SetComboOption = function(comboBox, option, dirtyResults) 
{
	if (Object.isUndefined(dirtyResults))
	{
		dirtyResults = true;
	}

	if (dirtyResults)  
	{
		i2b2.ExportXLS.model.dirtyResultsData = true;
	}	

	i2b2.ExportXLS.model.outputOptions[option] = comboBox.options[comboBox.selectedIndex].value;
	i2b2.ExportXLS.model.dirtyMatrixData = true;
}

i2b2.ExportXLS.SetPositiveIntValue = function(editField, option, dirtyResults) 
{
	intValue = parseInt(editField.value);
	
	if (isNaN(intValue))
	{
		alert("Please enter an integer number!");
		editField.value = "0";
	}
	else if (intValue < 0)
	{
		alert("Please enter a positive integer number!");
		editField.value = "0";
	}
	else
	{
		i2b2.ExportXLS.model.outputOptions[option] = intValue;
		editField.value = intValue;
		
		if (dirtyResults || (i2b2.ExportXLS.model.prsRecord && i2b2.ExportXLS.model.concepts.length))  
		{
			i2b2.ExportXLS.model.dirtyResultsData = true; // user changed any setting while there are patient set & concepts in place constitutes 'dirtyness'
		}
		
		i2b2.ExportXLS.model.dirtyMatrixData = true;
		
		if (("StartingPatient" == option || "NumberOfPatients" == option) && i2b2.ExportXLS.model.prsRecord)
		{
			$("ExportXLS-PatSetSize").innerHTML = i2b2.ExportXLS.getPatientSetSizeAndUsageMsg(); // update the display accordingly
		}
	}
}

i2b2.ExportXLS.QueryResultHasErrors = function(resultData)
{
	if (resultData.error) 
	{
		$("results-server-paging-warning").innerHTML = "<font color='red'><b>Warning: The server (i2b2 hive) has returned an error <br/>(apparently, it has been overwhelmed by the amount of data requested of it, and had failed)!!</b></font>";
		var t = i2b2.ExportXLS.getElapsedTime(i2b2.ExportXLS.StartTime);
		$("results-failure-time").innerHTML = "<font color='black' style='normal'>Elapsed time: " + i2b2.ExportXLS.getDurationInHrMinSec(t) + "</font>";

		$$("DIV#ExportXLS-mainDiv DIV#ExportXLS-TABS DIV.results-working")[0].hide();
		$$("DIV#ExportXLS-mainDiv DIV#ExportXLS-TABS DIV.results-working-hard")[0].hide();
		$$("DIV#ExportXLS-mainDiv DIV#ExportXLS-TABS DIV.results-serverFailed")[0].show();		
		
		console.error("Bad Results from Cell Communicator: ", resultData);
		return true;
	}
	
	return false;
}

i2b2.ExportXLS.GetXMLResponseFromQueryResult = function(resultData)
{
	var xmlContent; 
	var xmlDoc;
	
	if (window.DOMParser) // not Internet Explorer
	{ 
		xmlContent = resultData.msgResponse; // for Chrome, Safari, & FireFox 
		var parser = new DOMParser();
		xmlDoc = parser.parseFromString(xmlContent,"text/xml"); 
	} 
	else // Internet Explorer
	{ 
		xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
		xmlDoc.async = false;
		xmlDoc.loadXML(resultData.msgResponse);
		xmlContent = xmlDoc; 
	}
	
	var result = new Array();
	result["xmlDoc"] = xmlDoc;
	result["xmlContent"] = xmlContent;
		
	return result;
}

i2b2.ExportXLS.ReturnCSVResult = function() 
{
	return i2b2.ExportXLS.CSVExport;
}

i2b2.ExportXLS.ReturnHTMLResult = function() 
{
	var HTMLExport = "<html>\n<head></head>\n<body>\n" + i2b2.ExportXLS.HTMLResult + "\</body>\n</html>";

	return HTMLExport;
}

i2b2.ExportXLS.ConceptsRender = function()
{
	var s = '';
	
	if (i2b2.ExportXLS.model.concepts.length)  // If there are any concepts in the list
	{		
		// Sort the concepts in alphabetical order
		i2b2.ExportXLS.model.concepts.sort(function() {return arguments[0].sdxInfo.sdxDisplayName > arguments[1].sdxInfo.sdxDisplayName}); 
		
		// Draw the list of concepts
		for (var i1 = 0; i1 < i2b2.ExportXLS.model.concepts.length; i1++) 
		{
			if (i1 > 0) { s += '<div class="concptDiv"></div>'; }
			s += '<a class="concptItem" href="JavaScript:i2b2.ExportXLS.ConceptDelete(' + i1 + ');">' + i2b2.h.Escape(i2b2.h.HideBreak(i2b2.ExportXLS.model.concepts[i1].sdxInfo.sdxDisplayName)) + '</a>';
		}
		
		// Show the delete message
		$("ExportXLS-DeleteMsg").style.display = 'block';	
		
		// hide the Concept HINT link
		$("ExportXLS-ConceptHint").style.display = 'none';	
	} 
	else   // No concepts selected yet
	{
		s = '<div class="concptItem">Drop one or more Concepts here</div>';
		$("ExportXLS-DeleteMsg").style.display = 'none';

		// show the Concept HINT link
		$("ExportXLS-ConceptHint").style.display = 'block';	
	}
	
	// Update html
	$("ExportXLS-CONCPTDROP").innerHTML = s;
}

i2b2.ExportXLS.GetPDOQueryFilter = function(min, max) 
{
	// Translate the concept XML for injection as PDO item XML 
	var filterList = '';
	
	for (var i1=0; i1<i2b2.ExportXLS.model.concepts.length; i1++)
	{
		var t = i2b2.ExportXLS.model.concepts[i1].origData.xmlOrig;
		var cdata = {};
		cdata.level = i2b2.h.getXNodeVal(t, "level");
		cdata.key = i2b2.h.getXNodeVal(t, "key");
		cdata.tablename = i2b2.h.getXNodeVal(t, "tablename");
		cdata.dimcode = i2b2.h.getXNodeVal(t, "dimcode");
		cdata.synonym = i2b2.h.getXNodeVal(t, "synonym_cd");
		filterList +=
		'	<panel name="' + cdata.key + '">\n' +
		'		<panel_number>0</panel_number>\n' +
		'		<panel_accuracy_scale>0</panel_accuracy_scale>\n' +
		'		<invert>0</invert>\n' +
		'		<item>\n' +
		'			<hlevel>' + cdata.level + '</hlevel>\n' +
		'			<item_key>' + cdata.key + '</item_key>\n' +
		'			<dim_tablename>' + cdata.tablename + '</dim_tablename>\n' +
		'			<dim_dimcode>' + cdata.dimcode + '</dim_dimcode>\n' +
		'			<item_is_synonym>' + cdata.synonym + '</item_is_synonym>\n' + 
		'		</item>\n' +
		'	</panel>\n';
	}

if(i2b2.PM.model.userRoles.indexOf("DATA_DEID") == -1){var blob ="false";}else{var blob ="true";}//nps (test privilege)
	var outputOptions = '';		
	outputOptions += '	<patient_set select="using_input_list" onlykeys="false"/>\n';
	outputOptions += '	<observation_set blob="'+ blob +'" onlykeys="false"/>\n';//nps (false->true)
	
	var messageFilter = '';
	messageFilter += '<input_list>\n';
	messageFilter += '	 <patient_list min="' + min + '" max="' + max + '">\n';
	messageFilter += '	   <patient_set_coll_id>' + i2b2.ExportXLS.model.prsRecord.sdxInfo.sdxKeyValue + '</patient_set_coll_id>\n';
	messageFilter += '	 </patient_list>\n';
	messageFilter += '</input_list>\n';
	messageFilter += '<filter_list>\n';
	messageFilter += filterList;
	messageFilter += '</filter_list>\n';
	messageFilter += '<output_option>\n';
	messageFilter += outputOptions;
	messageFilter += '</output_option>\n';

	return messageFilter;
}

i2b2.ExportXLS.ClearResults = function() 
{
	i2b2.ExportXLS.Patients = new Array();
	i2b2.ExportXLS.ObservationSets = {};	

	// Delete all concept code denotation / ontology path which have not been resolved yet (-> keep those that HAVE been resolved).
	for (conceptCode in i2b2.ExportXLS.ConceptCodeDenotations)
	{
		var displayValue = i2b2.ExportXLS.ConceptCodeDenotations[conceptCode];

		if (displayValue.substr(0, 10) == "Unresolved")
		{
			delete i2b2.ExportXLS.ConceptCodeDenotations[conceptCode];
			delete i2b2.ExportXLS.ConceptCodeOntologyPaths[conceptCode];
		}
	}
}

i2b2.ExportXLS.GetResults = function() 
{
	if (i2b2.ExportXLS.model.dirtyResultsData) 
	{
		var queryFilter = i2b2.ExportXLS.GetPDOQueryFilter(i2b2.ExportXLS.PDOQueryChunkLower, i2b2.ExportXLS.PDOQueryChunkUpper);  
		i2b2.ExportXLS.PDOQueryChunkCurrent++;
		
		// Callback processor
		var scopedCallback = new i2b2_scopedCallback();
		scopedCallback.scope = this;
		
		scopedCallback.callback = function(results) { return i2b2.ExportXLS.GetResultsCallback(results); }
		
		$$("DIV#ExportXLS-mainDiv DIV#ExportXLS-TABS DIV.results-directions")[0].hide();
		$$("DIV#ExportXLS-mainDiv DIV#ExportXLS-TABS DIV.results-finished")[0].hide();
		$$("DIV#ExportXLS-mainDiv DIV#ExportXLS-TABS DIV.results-export")[0].hide();
		$$("DIV#ExportXLS-mainDiv DIV#ExportXLS-TABS DIV.results-serverFailed")[0].hide();				
		
		if ( (i2b2.ExportXLS.model.outputOptions.resolveConceptDetails) || (i2b2.ExportXLS.model.outputOptions.includeOntologyPath) )
		{		
			$$("DIV#ExportXLS-mainDiv DIV#ExportXLS-TABS DIV.results-working")[0].hide();
			$$("DIV#ExportXLS-mainDiv DIV#ExportXLS-TABS DIV.results-working-hard")[0].show();
		}
		else
		{
			$$("DIV#ExportXLS-mainDiv DIV#ExportXLS-TABS DIV.results-working")[0].show();
			$$("DIV#ExportXLS-mainDiv DIV#ExportXLS-TABS DIV.results-working-hard")[0].hide();
		}

		var s = "Currently busy retrieving patient data for subgroup #" + Math.min(i2b2.ExportXLS.PDOQueryChunkCurrent, i2b2.ExportXLS.PDOQueryPatientChunkTotal); // ChunkCurrent may > PatientChunkTotal when server itself started paging!
		
		i2b2.ExportXLS.UpdateProgressMessage(s);
		i2b2.ExportXLS.UpdateTimeMessage();
		
		// AJAX CALL USING THE EXISTING CRC CELL COMMUNICATOR
		i2b2.CRC.ajax.getPDO_fromInputList("Plugin:ExportXLS", {PDO_Request: queryFilter}, scopedCallback);
	}
		
}

i2b2.ExportXLS.GetAllConceptNamesFromOntology = function()
{
	// *********************
	// First step: Write all concept codes that have not been queried yet 
	//             as keys into dictionary and fill it with default value 
	//             "(Unresolved concept code: {$concept code})"
	// *********************
	for (panelName in i2b2.ExportXLS.ObservationSets)
	{
		var thisObservationSetDictionary = i2b2.ExportXLS.ObservationSets[panelName];
		var thisObservationSetDictionary_Observations = thisObservationSetDictionary["observations"];
		
		for (var j = 0; j < thisObservationSetDictionary_Observations.length; j++)
		{
			var thisObservation = thisObservationSetDictionary_Observations[j];		
			var thisObservationConceptCode = thisObservation["concept_cd"];
									
			if (  !Object.isUndefined(thisObservationConceptCode)  )
			{
				if (  Object.isUndefined(i2b2.ExportXLS.ConceptCodeDenotations[thisObservationConceptCode])  )
				{
					i2b2.ExportXLS.ConceptCodeDenotations[thisObservationConceptCode] = "Unresolved concept code: " + thisObservationConceptCode + "";
					i2b2.ExportXLS.ConceptCodeOntologyPaths[thisObservationConceptCode] = "";
				}
				else						
				{
					// For debugging only
					//alert("Skipping " + thisObservationConceptCode);			
				}
			}
		}
	
	}

	// *********************
	// Second step: Write all modifier codes that have not been queried yet 
	//              as keys into dictionary and fill it with default value 
	//              "(Unresolved modifier code: {$modifier code})"
	// *********************
	for (panelName in i2b2.ExportXLS.ObservationSets)
	{
		var thisObservationSetDictionary = i2b2.ExportXLS.ObservationSets[panelName];	
		var thisObservationSetDictionary_Observations = thisObservationSetDictionary["observations"];
		
		for (var j = 0; j < thisObservationSetDictionary_Observations.length; j++)
		{
			var thisObservation = thisObservationSetDictionary_Observations[j];		
			var thisObservationModifierCode = thisObservation["modifier_cd"];
												
			if (  !Object.isUndefined(thisObservationModifierCode)  )
			{
				if (  Object.isUndefined(i2b2.ExportXLS.ConceptCodeDenotations[thisObservationModifierCode])  )
				{
					i2b2.ExportXLS.ConceptCodeDenotations[thisObservationModifierCode] = "Unresolved modifier code: " + thisObservationModifierCode + "";
					i2b2.ExportXLS.ConceptCodeOntologyPaths[thisObservationModifierCode] = "";
				}
				else						
				{
					// For debugging only
					//alert("Skipping " + thisObservationModifierCode);			
				}
			}
		}
	
	}
	
	// *********************
	// Third step: start resolving the concept codes one after the other.
	// Cannot handle this in a loop since querying requires a callback function.
	// This callback function then starts a query for the next concept code until all codes have been resolved.
	// *********************
	i2b2.ExportXLS.GetNextConceptNamefromOntology();		
}

i2b2.ExportXLS.GetNextConceptNamefromOntology = function()
{
	// *********************
	// Resolving the next unresolved concept code.
	// If finished, the callback function then starts a new query for the next concept code until all codes have been resolved.
	// *********************
	var conceptCode = "";
	var allResolved = true;	
	
	var numberOfConcepts = Object.keys(i2b2.ExportXLS.ConceptCodeDenotations).length;
	var currentConceptNumber = 0;
	
	for (conceptCode in i2b2.ExportXLS.ConceptCodeDenotations)
	{
		var displayValue = i2b2.ExportXLS.ConceptCodeDenotations[conceptCode];
		currentConceptNumber++;
		
		if (displayValue.substr(0, 10) == "Unresolved")
		{
			allResolved = false;
			
			var conceptCodeElements = conceptCode.split(":");

			var codingSystem = conceptCodeElements[0];
			var codingTerm = "";

			if (conceptCodeElements.length > 1)
			{
				codingTerm = conceptCodeElements[1];
			}

			i2b2.ExportXLS.UpdateProgressMessage("Currently busy with: Querying concept details from ontology (" + currentConceptNumber + " of " + numberOfConcepts + ").")
			
			// The callback of this method sets the dictionary entry and then again calls this method.
			i2b2.ExportXLS.LaunchQueryToGetConceptNameFromOntology(codingSystem, codingTerm)

			break;
		}
	
	}

	if (allResolved)
	{
		i2b2.ExportXLS.AllConceptNamesRetrieved();		
	}
}

i2b2.ExportXLS.LaunchQueryToGetConceptNameFromOntology = function(codingSystem, codingTerm) 
{
	// Set Callback
	var scopedCallback = new i2b2_scopedCallback();
	scopedCallback.scope = this;
	scopedCallback.callback = function(results) { i2b2.ExportXLS.GetConceptNameFromOntologyCallback(codingSystem, codingTerm, results);	}
	
	// Set Options
	var searchOptions = {};
	searchOptions.ont_max_records = "max='" + i2b2.ONT.view['find'].params.max + "' ";
	searchOptions.ont_synonym_records = i2b2.ONT.view['find'].params.synonyms;
	searchOptions.ont_hidden_records = i2b2.ONT.view['find'].params.hiddens;
	searchOptions.ont_search_strategy = "exact";
	searchOptions.ont_search_coding = codingSystem + ":";
	searchOptions.ont_search_string = codingTerm;
	
	i2b2.ONT.ajax.GetCodeInfo("Plugin:ExportXLS", searchOptions, scopedCallback);
}

i2b2.ExportXLS.GetConceptNameFromOntologyCallback = function(codingSystem, codingTerm, resultData)
{
	var conceptCode = codingSystem;

	if (codingTerm != "")
	{
		conceptCode += ":" + codingTerm;
	}
	
	// THIS function is used to process the AJAX resultData of the getChild call
	//		resultData data object contains the following attributes:
	//			refXML: xmlDomObject <--- for data processing
	//			msgRequest: xml (string)
	//			msgResponse: xml (string)
	//			error: boolean
	//			errorStatus: string [only with error=true]
	//			errorMsg: string [only with error=true]
	
	// Check for errors
	if (i2b2.ExportXLS.QueryResultHasErrors(resultData)) 
	{
		return false;
	}

	var xmlResponse = i2b2.ExportXLS.GetXMLResponseFromQueryResult(resultData);
	var xmlDoc = xmlResponse["xmlDoc"];
	

	var conceptName = "";
	var conceptNameOfBranch = "";
	var conceptNameUnresolvable = "{Unresolvable code: '" + conceptCode + "'}";
	var conceptOnotlogyPath = "";
	
	$j(xmlDoc).find('concept').each( function() 
		{ 
			conceptNode = $j(this);
			
			var visualattributes = conceptNode.find("visualattributes").text();

			if (visualattributes == "FA ") 
			{
				conceptNameOfBranch = conceptNode.find("name").text();		
			}
			else
			{
				conceptName = conceptNode.find("name").text();
			}

			//if (visualattributes == "LA ") 
			//{
			//	conceptName = conceptNode.find("name").text();
			//}

			//if (visualattributes == "RA ") 
			//{
			//	conceptName = conceptNode.find("name").text();
			//}
			
			//if (visualattributes == "LI ") 
			//{
			//	conceptName = conceptNode.find("name").text();
			//}
			
			conceptOnotlogyPath = conceptNode.find("key").text();
		} 
	);
	
	if (conceptName == "")
	{
		if (conceptNameOfBranch != "")
		{
			conceptName = conceptNameOfBranch;
		}
		else
		{
			conceptName = conceptNameUnresolvable;
		}
	}
	
	i2b2.ExportXLS.ConceptCodeDenotations[conceptCode] = conceptName;
	i2b2.ExportXLS.ConceptCodeOntologyPaths[conceptCode] = conceptOnotlogyPath;
	
	i2b2.ExportXLS.GetNextConceptNamefromOntology();
}

i2b2.ExportXLS.AllConceptNamesRetrieved = function()
{
	i2b2.ExportXLS.FinishProcessing();	
}

i2b2.ExportXLS.ResolveConceptCode = function(observation)
{
	var conceptCode = observation["concept_cd"];
	var result = "";
	
	if (i2b2.ExportXLS.model.outputOptions.resolveConceptDetails)
	{	
		result = i2b2.ExportXLS.ConceptCodeDenotations[conceptCode];
	}
	
	if (Object.isUndefined(result))  // This should not happen... just for development & debugging purposes!	
	{
		result = "";
	}

	return result;
}

i2b2.ExportXLS.GetConceptOntologyPath = function(observation)
{
	var conceptCode = observation["concept_cd"];
	var result = "";
		
	if (i2b2.ExportXLS.model.outputOptions.includeOntologyPath)
	{	
		result = i2b2.ExportXLS.ConceptCodeOntologyPaths[conceptCode];
	}
	
	if (Object.isUndefined(result))  // This should not happen... just for development & debugging purposes!	
	{
		result = "";
	}

	return result;
}

i2b2.ExportXLS.ResolveModifierCode = function(observation)
{
	var modifierCode = observation["modifier_cd"];	
	
	if ( (Object.isUndefined(modifierCode)) || (modifierCode == "@") )
	{
		modifierCode = "";
	}
	
	var result = modifierCode;
	
	if (modifierCode != "")
	{
		if (i2b2.ExportXLS.model.outputOptions.resolveConceptDetails)
		{	
			var modifierDisplayValue = i2b2.ExportXLS.ConceptCodeDenotations[modifierCode];
			
			if (Object.isUndefined(modifierDisplayValue))
			{
				result = "";
			}
			else
			{
				result = modifierDisplayValue;
			}		
		}
	}
	
	if (Object.isUndefined(result))  // This should not happen... just for development & debugging purposes!	
	{
		result = modifierCode;
	}

	return result;
}

i2b2.ExportXLS.GetObservationSetDisplayName = function(key)
{
	var result = "";
	
	for (var i = 0; i < i2b2.ExportXLS.model.concepts.length; i++) {
		
		if (i2b2.ExportXLS.model.concepts[i].sdxInfo.sdxKeyValue == key) {
			result = i2b2.ExportXLS.model.concepts[i].sdxInfo.sdxDisplayName;
		}
	}
	
	return result;
}

i2b2.ExportXLS.ArraysAreEqual = function(templateArray, newArray)
{
	if (templateArray.length == newArray.length)
	{
		valuesAreEqual = true;
		
		for (var i = 0; i < templateArray.length; i++)
		{
			if (templateArray[i] != newArray[i])
			{
				valuesAreEqual = false;
				break;
			}
		}
		
		if (valuesAreEqual)
		{
			return true;
		}
	}

	return false;
}

i2b2.ExportXLS.CheckForDuplicates = function(arrayCollection, newArray) 	
{
	for (var i = 0; i < arrayCollection.length; i++)  // Loop through all arrays in the array collection
	{
		compareArray = arrayCollection[i];
		
		if (i2b2.ExportXLS.ArraysAreEqual(compareArray, newArray))
		{
			return true;
		}
	}
	
	return false;
}

i2b2.ExportXLS.ReplacePatientIDsByAscendingNumber = function() 	
{
	for (var i = 0; i < i2b2.ExportXLS.Patients.length; i++)
	{
		var thisPatient = i2b2.ExportXLS.Patients[i];
		thisPatient["patient_id_for_display"] = i + 1;		
	}		
}

i2b2.ExportXLS.FillPatientsDictionaryFromPatientNode = function(patientNode)
{
	var patient_id = patientNode.find("patient_id").text();

	var patientDataDictionary = {};

	patientDataDictionary["patient_id"] = patient_id;				
	patientDataDictionary["patient_id_for_display"] = patient_id;				
	patientDataDictionary["zip_cd"] = "";
	
	$j(patientNode).find('param').each(
		function() 
		{
			var paramName = $j(this).attr('column');
			var paramValue = $j(this).text();			
			patientDataDictionary[paramName] = paramValue;
			
			if (paramName == "birth_date")
			{
				patientDataDictionary["birth_date"] = i2b2.ExportXLS.GetFormattedDateTimeString(paramValue);
				patientDataDictionary["birth_year"] = i2b2.ExportXLS.GetFormattedYearString(paramValue);
			}
			if (paramName == "statecityzip_path")
			{
				i2b2.ExportXLS.GetStateCityZIPString(patientDataDictionary, paramValue);
			}
		}
	);		
	
	i2b2.ExportXLS.Patients.push(patientDataDictionary);
}

i2b2.ExportXLS.CheckIfServerPagedResult = function(xmlDoc) 	
{	
	var result = {};
	
	var pagingNode = $j(xmlDoc).find('paging_by_patients');
	
	var firstIndex = pagingNode.find('patients_returned').attr('first_index');
	var lastIndex = pagingNode.find('patients_returned').attr('last_index');

	if ( (!Object.isUndefined(firstIndex)) && (!Object.isUndefined(lastIndex)) )
	{
		result["firstIndex"] = parseInt(firstIndex);
		result["lastIndex"]  = parseInt(lastIndex);
		i2b2.ExportXLS.PDOQueryPagedByServer = true;	
		$("results-server-paging-warning").innerHTML = "<b>Warning: the server (i2b2 hive) has paged this data query</b><br/> (i.e. replaced it with many smaller queries that it hopes to better manage),<br/><b>this may take longer time to finish!<br/><br/>Next time, please consider reducing the 'Query Page Size' field value (non-zero)<br/>on the 'Specify Data' tab to speed things up.</b>";
	}
	
	return result;
}

i2b2.ExportXLS.FillPatientsDictionary = function(xmlDoc) 	
{	
	$j(xmlDoc).find('patient').each( function() { i2b2.ExportXLS.FillPatientsDictionaryFromPatientNode($j(this)) } );
}	

i2b2.ExportXLS.FillObservationDataDictionary = function(observationNode, childNode, observationDataDictionary)
{
	var textValue = observationNode.find(childNode).text();
	
	if ( (textValue != "@") && (textValue != "")  )
	{	
		observationDataDictionary[childNode] = textValue;
	}	
}

i2b2.ExportXLS.GetObservationDataDictionaryFromObservationNode = function(observationNode)
{
	var observationDataDictionary = {};
	
	i2b2.ExportXLS.FillObservationDataDictionary(observationNode, "patient_id", observationDataDictionary)
	i2b2.ExportXLS.FillObservationDataDictionary(observationNode, "concept_cd", observationDataDictionary)
	i2b2.ExportXLS.FillObservationDataDictionary(observationNode, "start_date", observationDataDictionary)
	i2b2.ExportXLS.FillObservationDataDictionary(observationNode, "end_date", observationDataDictionary)
	i2b2.ExportXLS.FillObservationDataDictionary(observationNode, "valuetype_cd", observationDataDictionary)
	i2b2.ExportXLS.FillObservationDataDictionary(observationNode, "tval_char", observationDataDictionary)
	i2b2.ExportXLS.FillObservationDataDictionary(observationNode, "nval_num", observationDataDictionary)
	i2b2.ExportXLS.FillObservationDataDictionary(observationNode, "units_cd", observationDataDictionary)
	i2b2.ExportXLS.FillObservationDataDictionary(observationNode, "modifier_cd", observationDataDictionary)

	if(i2b2.PM.model.userRoles.indexOf("DATA_DEID") == -1)
	{
	}
	else
	{
	i2b2.ExportXLS.FillObservationDataDictionary(observationNode, "observation_blob", observationDataDictionary)//nps (add)
	}//nps (test privilege)
	
	// Not used in this version
	//i2b2.ExportXLS.FillObservationDataDictionary(observationNode, "valueflag_cd", observationDataDictionary)
	//i2b2.ExportXLS.FillObservationDataDictionary(observationNode, "location_cd", observationDataDictionary)
	i2b2.ExportXLS.FillObservationDataDictionary(observationNode, "instance_num", observationDataDictionary)//nps (uncomment)
	i2b2.ExportXLS.FillObservationDataDictionary(observationNode, "event_id", observationDataDictionary)//nps (uncomment)
	i2b2.ExportXLS.FillObservationDataDictionary(observationNode, "observer_cd", observationDataDictionary)	
	i2b2.ExportXLS.FillObservationDataDictionary(observationNode, "confidence_num", observationDataDictionary)//nps (add)
	
	return observationDataDictionary;
}

i2b2.ExportXLS.FillObservationSetsDictionaryFromObservationSetNode = function(observationSetNode)
{
	var panelName = observationSetNode.attr('panel_name');
	var displayName = i2b2.h.HideBreak(i2b2.ExportXLS.GetObservationSetDisplayName(panelName));
	
	var thisObservationSetDictionary = i2b2.ExportXLS.ObservationSets[panelName];
	
	if (Object.isUndefined(thisObservationSetDictionary))
	{
		thisObservationSetDictionary = { "display_name": displayName, "panel_name": panelName, "observations": new Array() }
	}
	
	$j(observationSetNode).find('observation').each( function() { thisObservationSetDictionary["observations"].push(i2b2.ExportXLS.GetObservationDataDictionaryFromObservationNode($j(this))); } );
	
	i2b2.ExportXLS.ObservationSets[panelName] = thisObservationSetDictionary;
}

i2b2.ExportXLS.FillObservationSetsArray = function(xmlContent) 	
{	
	// Optimization idea / TODO: 
	// As first step loop through all observation sets to get panel names and put them into a dictionary. 
	// Then the name does not need to be solved every time again in GetObservationDataDictionaryFromObservationNode()
	
	$j(xmlContent).find('ns2\\:observation_set').each( function() { i2b2.ExportXLS.FillObservationSetsDictionaryFromObservationSetNode($j(this)) } );	
}

i2b2.ExportXLS.OutputFormatIs = function(format_string)
{
	return (i2b2.ExportXLS.model.outputOptions.outputFormat == format_string);
}

i2b2.ExportXLS.GetObservationStringForValueType = function(observation) // swc (added to translate the code for unintiated users)
{
	if ((observation["valuetype_cd"]) == "N")
	{
		return "Numeric";
	}
	else if ((observation["valuetype_cd"]) == "T")
	{
		return "Text (short)";
	}
	else if ((observation["valuetype_cd"]) == "B")
	{
		return "Raw text (notes / report)";
	}
}

i2b2.ExportXLS.GetObservationStringForValue = function(observation)
{
	var result = "";

	if ((observation["valuetype_cd"]) == "N")
	{
		result = observation["nval_num"];
	}
	else if ((observation["valuetype_cd"]) == "T")
	{
		result = observation["tval_char"];
	}
	else if ((observation["valuetype_cd"]) == "B")
	{

if(i2b2.PM.model.userRoles.indexOf("DATA_DEID") == -1)//nps (test privilege, if DEID -> show blobs)
	{
		result = "[protected]";
	}
	else
	{
		result = observation["observation_blob"]; 
	}
	}
	
	return result;
}

i2b2.ExportXLS.GetObservationStringForUnit = function(observation)
{
	var unit = observation["units_cd"];	

	if (  (Object.isUndefined(unit)) || (unit == "@") || (unit == "undefined")  )
	{
		unit = "";
	}
	
	return unit;
}

i2b2.ExportXLS.GetObservationStringForAllComponents = function(observation)
{
	var result = "";
	
	var observationConcept = observation["concept_cd"];
	var observationConceptDenotation = i2b2.ExportXLS.ResolveConceptCode(observation);	
	var observationConceptOntologyPath = i2b2.ExportXLS.GetConceptOntologyPath(observation);
	var observationValue = i2b2.ExportXLS.GetObservationStringForValue(observation);
	var observationUnit = i2b2.ExportXLS.GetObservationStringForUnit(observation);
	var observationModifier = i2b2.ExportXLS.ResolveModifierCode(observation);
	
	var observationConceptWithPath = observationConcept;
	
	if ( (i2b2.ExportXLS.model.outputOptions.includeOntologyPath) && (observationConceptOntologyPath != "") )
	{
		observationConceptWithPath = observationConceptOntologyPath + observationConceptWithPath;
	}
	
	if (i2b2.ExportXLS.model.outputOptions.resolveConceptDetails)
	{
		observationConceptWithPath = i2b2.ExportXLS.ResolveConceptCode(observation) + " [" + observationConceptWithPath + "]";
	}

	if (observationUnit != "")
	{
		observationUnit = " " + observationUnit;
	}

	var result = observationConceptWithPath;

	if (observationValue != "")
	{
		result += " = " + observationValue + observationUnit
	}

	if (observationModifier != "")
	{
		result += " (" + observationModifier + ")"
	}
	
	return result;
}

i2b2.ExportXLS.CreateResultMatrixHeaderLine = function()
{
	var headerLine = new Array();
	
	headerLine.push(" ");           		// Always add column # header 
	
	if (i2b2.ExportXLS.model.outputOptions.replacePatientID)
	{
		headerLine.push("Patient Number");	// Always add Patient Number header... 
	}
	else
	{
		headerLine.push("Patient ID");		// ...or Patient ID header
	}

	for (var i = 0; i < i2b2.ExportXLS.PatientDataColumns.length; i++)  // If no demographic data is wanted, array length is 0
	{
		headerLine.push(i2b2.ExportXLS.PatientDataColumnHeaders[i2b2.ExportXLS.PatientDataColumns[i]]);	
	}

	if ( (i2b2.ExportXLS.OutputFormatIs("single_filtered")) || (i2b2.ExportXLS.OutputFormatIs("aggregated")) )
	{
		for (panelName in i2b2.ExportXLS.ObservationSets)
		{
			var thisObservationSet = i2b2.ExportXLS.ObservationSets[panelName];
			i2b2.ExportXLS.ConceptColumns.push(thisObservationSet["panel_name"]);  // Store which concept is displayed in which column #		
			headerLine.push(thisObservationSet["display_name"]);	
		}	
	}	
	else if (i2b2.ExportXLS.OutputFormatIs("single_detailed")) 
	{
		headerLine.push("Timestamp Start");
		headerLine.push("Timestamp End");
		
		for (panelName in i2b2.ExportXLS.ObservationSets)
		{
			var thisObservationSet = i2b2.ExportXLS.ObservationSets[panelName];
			i2b2.ExportXLS.ConceptColumns.push(thisObservationSet["panel_name"]);  // Store which concept is displayed in which column #		
			headerLine.push(thisObservationSet["display_name"]);	
		}	
	}	
	else if (i2b2.ExportXLS.OutputFormatIs("single_raw")) 
	{

		headerLine.push("Visit ID");//nps (add)
		headerLine.push("Provider ID");//nps (add)
		headerLine.push("Timestamp Start");
		headerLine.push("Timestamp End");
		headerLine.push("Instance Number");//nps (add)

		headerLine.push("Observation Set");

		if (i2b2.ExportXLS.model.outputOptions.includeOntologyPath)
		{
			headerLine.push("Observation Concept Ontology Path");
		}
		
		headerLine.push("Observation Concept Code");

		if (i2b2.ExportXLS.model.outputOptions.resolveConceptDetails)
		{
			headerLine.push("Observation Concept Denotation");
		}
		//headerLine.push("Observation Type");//nps (add)
		headerLine.push("Observation Value Type");//swc updated
		headerLine.push("Obs. val. qualifier (numerical val. only)");//swc (updated & moved up)
		headerLine.push("Observation Value");
		//headerLine.push("Observation Operator");//nps (add)
		headerLine.push("Observation Unit");
		//headerLine.push("Confidence Number");//nps (add)
		headerLine.push("Confidence assessment Number");//swc (updated)
		headerLine.push("Observation Modifier");	
	}	

	i2b2.ExportXLS.model.dirtyMatrixData = false;
	
	return headerLine;
}

i2b2.ExportXLS.GetFormattedYearString = function(dateTimeString)
{
	var year = "";
	
	if (!Object.isUndefined(dateTimeString))
	{
		if (dateTimeString.length >= 4)
		{
			year = dateTimeString.substr(0,4);
		}
	}
	
	return year
}

i2b2.ExportXLS.GetFormattedDateTimeString = function(dateTimeString)
{
	var result = "";
	
	var date = "";
	var time = "";
	
	if (!Object.isUndefined(dateTimeString))
	{
		if (dateTimeString.length >= 10)
		{
			date = dateTimeString.substr(0,10);
		}
		
		if (dateTimeString.length >= 18)
		{
			time = dateTimeString.substr(11,8);
		}
	}

	if (time == "00:00:00") 
	{
		time = "";
	}
	else if (time != "")
	{
		time = " " + time;
	}
	
	result = date + time;
	
	return result
}

i2b2.ExportXLS.GetStateCityZIPString = function(patientDictionary, value)
{
	// Value example: "Zip codes\Massachusetts\Northampton\01061\"
	var state = "";
	var city = "";
	var zip = "";
	
	// Remove leading "Zip codes" string if it exists
	if ("Zip code" == value.substring(0, 8)) 
	{
		value = value.substring(10, value.length);
	}
	
	var valueElements = value.split("\\");

	if (valueElements.length > 0)
	{
		state = valueElements[0];
	}

	if (valueElements.length > 1)
	{
		city = valueElements[1];
	}

	if (valueElements.length > 2)
	{
		zip = valueElements[2];
	}
	
	patientDictionary["statecityzip_path"] = state

	if (city != "")
	{
		if (patientDictionary["statecityzip_path"] != "")
		{
			patientDictionary["statecityzip_path"] += "/"
		}
		
		patientDictionary["statecityzip_path"] += city
	}

	if (zip != "")
	{
		if (patientDictionary["statecityzip_path"] != "")
		{
			patientDictionary["statecityzip_path"] += "/"
		}

		patientDictionary["statecityzip_path"] += zip
	}

	patientDictionary["state_path"] = state;
	patientDictionary["city_path"] = city;

	if (patientDictionary["zip_cd"] == "")  // Do not overwrite if already set by "zip_cd" param!
	{
		patientDictionary["zip_cd"] = zip;				
	}

	if (-1 == value.indexOf("\\"))
	{
		patientDictionary["locality_path"] = value;	                // for institutions that may have something like "CityState" (e.g. "PORTLANDME")
	}
	else
	{
		patientDictionary["locality_path"] = city + ", " + state;	// for institutions that just want to have something like "City, State" (e.g. "Portland, Maine")
	}
}

i2b2.ExportXLS.AddDataLine_SingleFiltered = function(dataLines, patientID, patientDemographicData, observation, observationSetPanelName)
{
	var thisNewDataLine = new Array();
	thisNewDataLine.push(patientID);
	thisNewDataLine = thisNewDataLine.concat(patientDemographicData);

	for (var conceptColumnIndex = 0; conceptColumnIndex < i2b2.ExportXLS.ConceptColumns.length; conceptColumnIndex++)
	{
		if (i2b2.ExportXLS.ConceptColumns[conceptColumnIndex] == observationSetPanelName)
		{
			thisNewDataLine.push(i2b2.ExportXLS.GetObservationStringForAllComponents(observation));
		}
		else
		{
			thisNewDataLine.push("");
		}		
	}
	
	if (!i2b2.ExportXLS.CheckForDuplicates(dataLines,thisNewDataLine))  // This is a little tricky, because indexOf always returns -1, since arrays are always different instances, even if the values are the same!
	{
		dataLines.push(thisNewDataLine);
	}
}

i2b2.ExportXLS.AddDataLine_SingleDetailed = function(dataLines, patientID, patientDemographicData, observation, observationSetPanelName, j)
{
	var thisNewDataLine = new Array();
	thisNewDataLine.push(patientID);
	thisNewDataLine = thisNewDataLine.concat(patientDemographicData);
	
	thisNewDataLine.push(i2b2.ExportXLS.GetFormattedDateTimeString(observation["start_date"]));
	thisNewDataLine.push(i2b2.ExportXLS.GetFormattedDateTimeString(observation["end_date"]));
	
	for (var conceptColumnIndex = 0; conceptColumnIndex < i2b2.ExportXLS.ConceptColumns.length; conceptColumnIndex++)
	{
		if (i2b2.ExportXLS.ConceptColumns[conceptColumnIndex] == observationSetPanelName)
		{
			thisNewDataLine.push(i2b2.ExportXLS.GetObservationStringForAllComponents(observation));
		}
		else
		{
			thisNewDataLine.push("");
		}		
	}
	
	dataLines.push(thisNewDataLine);
}

i2b2.ExportXLS.AddDataLine_SingleRaw = function(dataLines, patientID, patientDemographicData, observation, observationSetDisplayName)
{
	var thisNewDataLine = new Array();
	thisNewDataLine.push(patientID);
	thisNewDataLine = thisNewDataLine.concat(patientDemographicData);
	thisNewDataLine.push(observation["event_id"]);//nps (add)
	thisNewDataLine.push(observation["observer_cd"]);//nps (add)
	thisNewDataLine.push(i2b2.ExportXLS.GetFormattedDateTimeString(observation["start_date"]));
	thisNewDataLine.push(i2b2.ExportXLS.GetFormattedDateTimeString(observation["end_date"]));
	thisNewDataLine.push(observation["instance_num"]);//nps (add)
	thisNewDataLine.push(observationSetDisplayName);

	var observationConceptCode = observation["concept_cd"];
	var observationConceptDenotation = i2b2.ExportXLS.ResolveConceptCode(observation);
	var observationConceptOntologyPath = i2b2.ExportXLS.GetConceptOntologyPath(observation);
	var observationValueType = i2b2.ExportXLS.GetObservationStringForValueType(observation); //swc (added)
	var observationValue = i2b2.ExportXLS.GetObservationStringForValue(observation);
	var observationUnit = i2b2.ExportXLS.GetObservationStringForUnit(observation);
	var observationModifier = i2b2.ExportXLS.ResolveModifierCode(observation)

	if (i2b2.ExportXLS.model.outputOptions.includeOntologyPath)
		{
			thisNewDataLine.push(observationConceptOntologyPath);
		}

		thisNewDataLine.push(observationConceptCode);

		if (i2b2.ExportXLS.model.outputOptions.resolveConceptDetails)
			{
				thisNewDataLine.push(observationConceptDenotation);
			}
	var valuetypeCd = observation["valuetype_cd"];	
	if ( (Object.isUndefined(valuetypeCd)) || (valuetypeCd == "@") )
	{
		valuetypeCd = "";
	}
	//thisNewDataLine.push(valuetypeCd);//nps (add)
	thisNewDataLine.push(observationValueType);//swc (replaced with text un-initiated user can readily comprehand)
	//thisNewDataLine.push(observationValue); //swc (moved to after operatorNum / 'numerical obs. val. qualifier')
	var operatorNum = "";	
	if ( observation["valuetype_cd"] == "N" )
		{
			switch (observation["tval_char"])
			{
				case "E":
					operatorNum = "=";
				break;
				case "NE":
					//operatorNum = "!=";
					operatorNum = "not"; //swc (replaced for non-coder users)
				break;	
				case "L":
					operatorNum = "<";
				break;
				case "LE":
					operatorNum = "<=";
				break;
				case "G":
					operatorNum = ">";
				break;
				case "GE":
					operatorNum = ">=";
				break;
				default:
					operatorNum = "";
				break;
			}
		}else{}
	thisNewDataLine.push(operatorNum);
	thisNewDataLine.push(observationValue); //swc (moved to after operatorNum / 'numerical obs. val. qualifier')
	thisNewDataLine.push(observationUnit);
	var confidenceNum = observation["confidence_num"];	
	if ( (Object.isUndefined(confidenceNum)) || (confidenceNum == "@") )
	{
		confidenceNum = "";
	}
	thisNewDataLine.push(confidenceNum);//nps (add)

	thisNewDataLine.push(observationModifier);
	dataLines.push(thisNewDataLine);
}

	i2b2.ExportXLS.CreateResultMatrixDataLines = function()
	{
		var dataLines = new Array();
		
		var patientNumber = 1;
		var increasePatientNumber = false;

		for (var p = 0; p < i2b2.ExportXLS.Patients.length; p++) // First loop over all patients
		{  	
			var thisPatient = i2b2.ExportXLS.Patients[p];
			var thisPatientID = thisPatient["patient_id"];
			var thisPatientIDForDisplay = thisPatient["patient_id_for_display"];
			
			if (i2b2.ExportXLS.model.outputOptions.replacePatientID)
			{
				thisPatientIDForDisplay = patientNumber;
			}
					
			var dataLine_PatientDemographicData = new Array();
			
			var notYetProcessedBirthDate = true; 
			
			for (var i = 0; i < i2b2.ExportXLS.PatientDataColumns.length; i++)   // If no demographic data is wanted, array length is 0
			{
				var patientDemoDataColumn = i2b2.ExportXLS.PatientDataColumns[i];
				var patientDemoDataValue = thisPatient[patientDemoDataColumn];
				
				if (patientDemoDataColumn == "birth_date")
				{
					if (true == notYetProcessedBirthDate && true == i2b2.ExportXLS.model.outputOptions.includePatientDemoData_BirthDate)
					{
						patientDemoDataValue = i2b2.ExportXLS.GetFormattedDateTimeString(patientDemoDataValue);
						notYetProcessedBirthDate = false; // since 'Birth Date' column always precedes 'Birth Year' column
					}
					else if (true == i2b2.ExportXLS.model.outputOptions.includePatientDemoData_BirthYear)
					{
						patientDemoDataValue = i2b2.ExportXLS.GetFormattedYearString(patientDemoDataValue);
					}
				}
				dataLine_PatientDemographicData.push(patientDemoDataValue);	
			}
			
			if (i2b2.ExportXLS.OutputFormatIs("aggregated"))
			{
				var dataline_aggregated = new Array();
				dataline_aggregated.push(thisPatientIDForDisplay);
				dataline_aggregated = dataline_aggregated.concat(dataLine_PatientDemographicData);
				var aggregatedColumsDictionary = {};
				increasePatientNumber = true;
			}
			
			for (panelName in i2b2.ExportXLS.ObservationSets)  // Now loop over all observation sets
			{
				var thisObservationSet = i2b2.ExportXLS.ObservationSets[panelName];
				var thisObservationSetDisplayName = thisObservationSet["display_name"];
				var thisObservationSetPanelName = thisObservationSet["panel_name"];
				
				if (i2b2.ExportXLS.OutputFormatIs("aggregated"))
				{
					aggregatedObservationsArray = new Array();				
				}
				
				for (var j = 0; j < thisObservationSet["observations"].length; j++)  // And now loop over all observations of this set
				{				
					thisObservation = thisObservationSet["observations"][j];
					
					if (thisObservation["patient_id"] == thisPatientID)
					{
						if  (i2b2.ExportXLS.OutputFormatIs("single_filtered"))
						{
							i2b2.ExportXLS.AddDataLine_SingleFiltered(dataLines, thisPatientIDForDisplay, dataLine_PatientDemographicData, thisObservation, thisObservationSetPanelName);	
						increasePatientNumber = true;
					}
					else if (i2b2.ExportXLS.OutputFormatIs("single_detailed")) 
					{
						i2b2.ExportXLS.AddDataLine_SingleDetailed(dataLines, thisPatientIDForDisplay, dataLine_PatientDemographicData, thisObservation, thisObservationSetPanelName, j);
						increasePatientNumber = true;
					}
					else if (i2b2.ExportXLS.OutputFormatIs("single_raw")) 
					{
						i2b2.ExportXLS.AddDataLine_SingleRaw(dataLines, thisPatientIDForDisplay, dataLine_PatientDemographicData, thisObservation, thisObservationSetDisplayName);
						increasePatientNumber = true;
					}
					else if (i2b2.ExportXLS.OutputFormatIs("aggregated"))
					{
						observationString = i2b2.ExportXLS.GetObservationStringForAllComponents(thisObservation);
						
						if (-1 == aggregatedObservationsArray.indexOf(observationString))
						{					
							aggregatedObservationsArray.push(observationString);
						}
					}
				}
			}
			
			if (i2b2.ExportXLS.OutputFormatIs("aggregated"))
			{
				var aggregatedCell = "";
				
				for (var l = 0; l < aggregatedObservationsArray.length; l++)
				{
					aggregatedCell += aggregatedObservationsArray[l];
					
					if (l < aggregatedObservationsArray.length)
					{
						aggregatedCell += "\n";
					}
				}
			
				aggregatedColumsDictionary[thisObservationSetPanelName] = aggregatedCell;				
			}
			
		}

		if (i2b2.ExportXLS.OutputFormatIs("aggregated")) 
		{		
			var data_exists = false;  // This flag stores wheter ANY data exists for this patient. If not: do not add data row!
			
			var k = 0;
			for (panelName in i2b2.ExportXLS.ObservationSets)
			{
				var thisObservationSet = i2b2.ExportXLS.ObservationSets[panelName];
				var thisObservationSetPanelName = thisObservationSet["panel_name"];
				
				if (aggregatedColumsDictionary[thisObservationSetPanelName].length > 0)
				{
					data_exists = true;
				}
				
				// Find out the correct concept column #
				if (i2b2.ExportXLS.ConceptColumns[k] == thisObservationSetPanelName)
				{
					dataline_aggregated.push(aggregatedColumsDictionary[thisObservationSetPanelName]);
				}
				else
				{
					dataline_aggregated.push("");
				}
				
				k++;
			}	
		
			if (data_exists)
			{
				dataLines.push(dataline_aggregated);
			}
		}		

		if (increasePatientNumber)
		{
			patientNumber++;
			increasePatientNumber = false;
		}
	} 
	
	return dataLines;
}

i2b2.ExportXLS.CreatePatientDemoDataArray = function()
{
	i2b2.ExportXLS.PatientDataColumns = new Array ();
	
	if (i2b2.ExportXLS.model.outputOptions.includePatientDemoData_Sex == true) 
	{
		i2b2.ExportXLS.PatientDataColumns.push("sex_cd");
	}
	if (i2b2.ExportXLS.model.outputOptions.includePatientDemoData_Age == true)
	{
		i2b2.ExportXLS.PatientDataColumns.push("age_in_years_num");
	}
	if (i2b2.ExportXLS.model.outputOptions.includePatientDemoData_BirthDate == true)
	{
		i2b2.ExportXLS.PatientDataColumns.push("birth_date");
	}
	if (i2b2.ExportXLS.model.outputOptions.includePatientDemoData_BirthYear == true)
	{
		i2b2.ExportXLS.PatientDataColumns.push("birth_year");
	}
	if (i2b2.ExportXLS.model.outputOptions.includePatientDemoData_VitalStatus == true)
	{
		i2b2.ExportXLS.PatientDataColumns.push("vital_status_cd");
	}
	if (i2b2.ExportXLS.model.outputOptions.includePatientDemoData_Language == true)
	{
		i2b2.ExportXLS.PatientDataColumns.push("language_cd");
	}
	if (i2b2.ExportXLS.model.outputOptions.includePatientDemoData_Race == true)
	{
		i2b2.ExportXLS.PatientDataColumns.push("race_cd");
	}
	if (i2b2.ExportXLS.model.outputOptions.includePatientDemoData_Religion == true)
	{
		i2b2.ExportXLS.PatientDataColumns.push("religion_cd");
	}
	if (i2b2.ExportXLS.model.outputOptions.includePatientDemoData_Income == true)
	{
		i2b2.ExportXLS.PatientDataColumns.push("income_cd");
	}
	if (i2b2.ExportXLS.model.outputOptions.includePatientDemoData_StateCityZIP == true)
	{
		i2b2.ExportXLS.PatientDataColumns.push("statecityzip_path");
	}
	if (i2b2.ExportXLS.model.outputOptions.includePatientDemoData_Locality == true)
	{
		i2b2.ExportXLS.PatientDataColumns.push("locality_path");
	}
	if (i2b2.ExportXLS.model.outputOptions.includePatientDemoData_State == true)
	{
		i2b2.ExportXLS.PatientDataColumns.push("state_path");
	}
	if (i2b2.ExportXLS.model.outputOptions.includePatientDemoData_City == true)
	{
		i2b2.ExportXLS.PatientDataColumns.push("city_path");
	}
	if (i2b2.ExportXLS.model.outputOptions.includePatientDemoData_ZIP == true)
	{
		i2b2.ExportXLS.PatientDataColumns.push("zip_cd");
	}
	if (i2b2.ExportXLS.model.outputOptions.includePatientDemoData_MaritalStatus == true)
	{
		i2b2.ExportXLS.PatientDataColumns.push("marital_status_cd");
	}
}

i2b2.ExportXLS.CreateResultMatrix = function()
{
	i2b2.ExportXLS.ResultMatrix = new Array();
	i2b2.ExportXLS.ConceptColumns = new Array();
	i2b2.ExportXLS.CreatePatientDemoDataArray();
	
	// **********************************************
	// Create colunmn headers
	// **********************************************
	var headerLine = i2b2.ExportXLS.CreateResultMatrixHeaderLine();
	i2b2.ExportXLS.ResultMatrix.push(headerLine);

	// **********************************************
	// Create data lines
	// **********************************************
	var dataLines = i2b2.ExportXLS.CreateResultMatrixDataLines()
	
	// **********************************************
	// Add row numbers to data lines
	//   Must be last step, because duplicates could 
	//   not be found otherwise (row numbers are 
	//   ALWAYS different)!
	// **********************************************
	for (var x = 0; x < dataLines.length; x++)
	{
		var dataline_with_rownumber = new Array();

		if (i2b2.ExportXLS.OutputFormatIs("aggregated"))
		{
			dataline_with_rownumber.push(x + i2b2.ExportXLS.model.outputOptions.StartingPatient); // to be inline with the user-specified starting patient #
		}
		else
		{
			dataline_with_rownumber.push(x + 1);
		}

		dataline_without_rownumber = dataLines[x];
		dataline_with_rownumber = dataline_with_rownumber.concat(dataLines[x]);
		
		i2b2.ExportXLS.ResultMatrix.push(dataline_with_rownumber);
	}
}

i2b2.ExportXLS.CreateHTMLTable = function()
{
	var html_table = "<table id=\"ReportTable\">\n";
	html_table += "<caption><b>Patient Information (for patients " + i2b2.ExportXLS.model.outputOptions.StartingPatient + " - " + (1 + i2b2.ExportXLS.PDOQueryPatientEndNum) +") </b><br> of Patient Set <i>\'" + i2b2.ExportXLS.model.prsRecord.sdxInfo.sdxDisplayName + "\'<br>&nbsp;</i></caption>\n";
	
	// **********************
	// Add header row
	// **********************
	matrix_headerline = i2b2.ExportXLS.ResultMatrix[0];
	var table_header = "";
	table_header += "<tr>";
	
	for (var j = 0; j < matrix_headerline.length; j++)
	{
		table_header += "<th>" + matrix_headerline[j] + "</th>";
	}

	table_header += "</tr>\n";
	html_table += table_header;	
	
	// **********************
	// Add data rows
	// **********************
	for (var i = 1; i < i2b2.ExportXLS.ResultMatrix.length; i++)
	{
		matrix_dataline = i2b2.ExportXLS.ResultMatrix[i];
		var table_row = "";
		table_row += "<tr>";
		
		if (i2b2.ExportXLS.OutputFormatIs("aggregated"))
		{
			for (var j = 0; j < matrix_dataline.length; j++)
			{
				table_row += '<td align="center">' + matrix_dataline[j] + '</td>';  // The align="center" is for the exported HTML only. In the web client it is defined by CSS
				table_row = table_row.replace(/\n/g, '<br>');
			}
		}
		else
		{
			for (var j = 0; j < matrix_dataline.length; j++)
			{
				table_row += '<td align="center">' + matrix_dataline[j] + '</td>';  // The align="center" is for the exported HTML only. In the web client it is defined by CSS
			}
		}
		
		table_row += "</tr>";
		html_table += table_row + "\n";
	}
	
    // Close table	
	html_table += "</table><small>NOTE: only patients with any of the selected concepts are included above.</small>";	
	i2b2.ExportXLS.HTMLResult = html_table;	
}

i2b2.ExportXLS.CreateCSV = function()
{
	var csv = "";
	var csvDelimiter = i2b2.ExportXLS.model.CsvDelimiter;

	for (var i = 0; i < i2b2.ExportXLS.ResultMatrix.length; i++)
	{
		matrix_row = i2b2.ExportXLS.ResultMatrix[i];
		
		var csv_line = "";
		var cellDelimiter = '"';
		
		if ( ((i2b2.ExportXLS.model.outputOptions.excludeDelimiter)) && (!i2b2.ExportXLS.OutputFormatIs("aggregated")) ) 
		{
			cellDelimiter = "";
		}
		
		for (var j = 0; j < matrix_row.length; j++)
		{
			var cell = "" + matrix_row[j]; // render it as string, to utilize its .replace() method
			if (i2b2.ExportXLS.OutputFormatIs("aggregated")) {
				cell = cell.replace(/\n$/, '').replace(/\n/g, ', ');
			}
			//csv_line += cellDelimiter + cell + cellDelimiter + ';';
			csv_line += cellDelimiter + cell + cellDelimiter + csvDelimiter;
		}
	
		csv_line = csv_line.replace(/;$/, '');
		csv += csv_line + "\n";	
	}
	
	csv = csv.replace(/\n$/, '');	
	
	i2b2.ExportXLS.CSVExport = csv;	
}

i2b2.ExportXLS.SortPatientArrayByPatientID = function(resultData)
{
	i2b2.ExportXLS.Patients.sort(function() { return arguments[0]["patient_id"] > arguments[1]["patient_id"] } ); 
	return;
}

i2b2.ExportXLS.GetResultsCallback = function(resultData)
{
	// THIS function is used to process the AJAX resultData of the getChild call
	//		resultData data object contains the following attributes:
	//			refXML: xmlDomObject <--- for data processing
	//			msgRequest: xml (string)
	//			msgResponse: xml (string)
	//			error: boolean
	//			errorStatus: string [only with error=true]
	//			errorMsg: string [only with error=true]
	
	// Check for errors
	if (i2b2.ExportXLS.QueryResultHasErrors(resultData)) 
	{
		return false;
	}
	
	var xmlResponse = i2b2.ExportXLS.GetXMLResponseFromQueryResult(resultData);
	var xmlDoc = xmlResponse["xmlDoc"];
	var xmlContent = xmlResponse["xmlContent"];
	
	var pagingResult = i2b2.ExportXLS.CheckIfServerPagedResult(xmlDoc);
	
	if ( (!Object.isUndefined(pagingResult["firstIndex"])) && (!Object.isUndefined(pagingResult["lastIndex"])) )
	{
		i2b2.ExportXLS.PDOQueryChunkUpper = pagingResult["lastIndex"];
	}
	
	i2b2.ExportXLS.FillPatientsDictionary(xmlDoc);
	i2b2.ExportXLS.FillObservationSetsArray(xmlContent);
	
	if (i2b2.ExportXLS.AllChunksQueried())
	{
		i2b2.ExportXLS.model.dirtyResultsData = false;	
		
		i2b2.ExportXLS.SortPatientArrayByPatientID();
	
		if ( (i2b2.ExportXLS.model.outputOptions.resolveConceptDetails) || (i2b2.ExportXLS.model.outputOptions.includeOntologyPath) )
		{
			i2b2.ExportXLS.UpdateProgressMessage("Currently busy with: Querying concept details from ontology.");
			
			// This launches a method with a callback. 
			// The rest of the processing is handled in i2b2.ExportXLS.FinishProcessing() which is called by the callback.
			i2b2.ExportXLS.GetAllConceptNamesFromOntology();  
		}
		else
		{
			i2b2.ExportXLS.FinishProcessing();
		}
	}
	else
	{
		i2b2.ExportXLS.PDOQueryChunkLower = Math.min(i2b2.ExportXLS.PDOQueryChunkUpper + 1, i2b2.ExportXLS.PDOQueryPatientEndNum);
		i2b2.ExportXLS.CalcPDOChunkUpper();
		
		i2b2.ExportXLS.GetResults(); 
	}
}

i2b2.ExportXLS.FinishProcessing = function()
{
	i2b2.ExportXLS.UpdateProgressMessage("Currently tabulating all data returned by the server (i2b2 hive).");
	
	var s = "";//nps 
	if ( i2b2.ExportXLS.PDOQueryPagedByServer )
	{
		s += "\n\nWarning: the query has been paged by the server (i2b2 hive) -- you can speed up future queries by reducing the 'Query Page Size' field value (non-zero) on the 'Specify Data' tab.";
		i2b2.ExportXLS.PDOQueryPagedByServer = false;
		alert(s); // to inform the user as well as provide a chance for the progress message to be updated //nps (mooved to this block)
	}

    i2b2.ExportXLS.CreateResultMatrix();
    i2b2.ExportXLS.CreateCSV();
    i2b2.ExportXLS.CreateHTMLTable();

	$$("DIV#ExportXLS-mainDiv DIV#ExportXLS-TABS DIV.results-working")[0].hide();
	$$("DIV#ExportXLS-mainDiv DIV#ExportXLS-TABS DIV.results-working-hard")[0].hide();
	$$("DIV#ExportXLS-mainDiv DIV#ExportXLS-TABS DIV.results-finished")[0].show();

	var divResults = $$("DIV#ExportXLS-mainDiv DIV#ExportXLS-InfoPDO")[0];			
//	Element.select(divResults, '.InfoPDO-Response. originalXML')[0].innerHTML = '<pre>' + i2b2.ExportXLS.HTMLResult + '</pre>';	// Do not remove space character in '.InfoPDO-Response. originalXML'!
	Element.select(divResults, '.InfoPDO-Response .originalXML')[0].innerHTML = '<pre>' + i2b2.ExportXLS.HTMLResult + '</pre>';	// Do not remove space character in '.InfoPDO-Response .originalXML'! (updated to work with new prototype.js)

	$$("DIV#ExportXLS-mainDiv DIV#ExportXLS-TABS DIV.results-export")[0].show();
}

i2b2.ExportXLS.calcPatientSetSizeAndMsg = function()
{
	var psSize = i2b2.ExportXLS.model.prsRecord.origData.size; 
	i2b2.ExportXLS.patientsetSize = psSize; // they're off by 1, due to 0-based indexing
	$("ExportXLS-PatSetSize").innerHTML = "contains some " + psSize + " patients -- please specify pertinent query options:"
}

i2b2.ExportXLS.getPatientSetSizeAndUsageMsg = function()
{
	var psSize = i2b2.ExportXLS.model.prsRecord.origData.size; 
	var numPats = i2b2.ExportXLS.model.outputOptions.NumberOfPatients;
	var startingPat = i2b2.ExportXLS.model.outputOptions.StartingPatient;
	var targetPatCount = i2b2.ExportXLS.calcPatientCountAndEndNum(psSize, numPats, startingPat);
	var s = "contains some " + psSize + " patients (using patients #" + startingPat + " - " + (1 + i2b2.ExportXLS.PDOQueryPatientEndNum);
	if (psSize > targetPatCount)
	{
		s += ", or just " + targetPatCount + " of the set)";
	}
	else
	{
		s += ", or the entire set)";
	}
	return s; 
}

i2b2.ExportXLS.calcPatientCountAndEndNum = function(psSize, numPats, startingPat)
{
	if (psSize > startingPat + numPats)
	{
		i2b2.ExportXLS.PDOQueryPatientCount = numPats;
		i2b2.ExportXLS.PDOQueryPatientEndNum = startingPat + i2b2.ExportXLS.PDOQueryPatientCount - 1;
	}
	else
	{
		i2b2.ExportXLS.PDOQueryPatientCount = psSize - startingPat + 1;
		i2b2.ExportXLS.PDOQueryPatientEndNum = psSize;
	}
	i2b2.ExportXLS.PDOQueryPatientEndNum --; // convert to 0-based indexing
	return i2b2.ExportXLS.PDOQueryPatientCount;
}

i2b2.ExportXLS.ExplainQueryPageSize = function()
{
	var s = "About 'Query Subgroup Size':\n\n      Please note that a large query (i.e. a large patient set with many concepts, especially ones consisting many subfolder trees) may overwhelm the server (i2b2 hive), which may fail (where no data can be rendered at all) after considerable delays and timeouts.  To avoid this problem, you may want to set the 'Query Subgroup Size' value.\n\n     Setting the 'Query Subgroup Size' instructs this plugin to temporarily divide up your patient set into subgroups of your specified size, and then iteratively make request of relevant data for each of these resulting subgroups, and then collate and render the returned data (when all these smaller queries are completed).\n\n     Since each subgroup should be of small enough size, the requests hopefully would not cause the server to fail or hang.\n\n     The ideal 'Query Subgroup Size' value cannot be predicted in general, and strongly depends on the number of observations (related to the total numbers of concepts and their complexities) returned; but values of 20 to 50 may be good.  A higher value may result in faster processing but may also carry higher risk of the server failing (where no data can be rendered at all).\n\n     Incidentally, setting a value of 0 instructs this plugin not to divide up the original query into smaller queries (and carries the risk of overwhelming and failing the server, as well as practivally no 'Elapsed time' and 'estimated remaining run time' updates)."
	alert(s);

}

i2b2.ExportXLS.ExplainStartingAndNumberOfPatients = function()
{
	var s = "About 'Starting Patient' and 'Number of Patients':\n\n     If your patient set contains thousands of patients, you may want to use just a subset of that.  By so doing, you will speed up your query as well as reduce the likelihood of overwhelming the server (i2b2 hive) to the point of failure (and no result).\n\n     Also, if you already encountered a server failure (overwhelmed by the combination of large number of patients times lots of concepts), then you may like to rerun this plugin several times. each time specifying different 'Starting Patient' and 'Number of Patients'.\n\n     For instance, use 1 and 500, respectively, in your first run; follow with 501 and 500, respectively, in your second run; then 1001 and 500, respectively, in your third run; and so on, until you get enough data.\n\n     The example above should also show that the 'Starting Patient' and 'Number of Patients' refer to the patient entry order in the patient set only, which has no bearing on the actual patient IDs.\n\n     In addition, if the sum of the 'Starting Patient' and the 'Number of Patients' values exceeds the total patient count, then it'll be adjusted to the remaining patient count accordingly."
	alert(s);
}

i2b2.ExportXLS.SuggestFinerConceptGrainularity = function()
{
	var s = "'Concept' hint (suggestion):\n\n     For best results, select finer-grained concepts that may not be related to multiple non-exclusive observations in patients.\n\n       For example, while a patient set may be for 'Circulatory system', selecting several finer concepts like 'Hypertensive disease', 'Ischemic heart disease', and 'arterial vascular disease', etc., that are pertinent to the interest at hand, would result in more meaningful results than simply specifying a single concept of 'Circulatory system', which contains other concepts that may be irrelevent to the present study.\n\n     Furthermore, keep in mind that far-reaching concepts (that contains many branches and sub-branches of concepts), coupled with a large patient set, may overwhelm the server (i2b2 hive) to the point of failure, resulting in no data getting returned at all."
	alert(s);
}

i2b2.ExportXLS.calcPDOChunkTotal = function()
{
	var lot = i2b2.ExportXLS.PDOQueryPatientCount;
	var size = i2b2.ExportXLS.model.outputOptions.queryPageSize;
	if (0 == size)
	{
		i2b2.ExportXLS.model.outputOptions.queryPageSize = lot;
		size = lot;
	}
	var count = parseInt(lot / size);
	var grps = count;
	if (0 < lot % size)
	{
		grps += 1;
	}
	i2b2.ExportXLS.PDOQueryPatientChunkTotal = grps;
	if (1 == grps)
	{
		$("results-total-chunks-patients").innerHTML = "(out of " + grps + " group of " + size + " each, or a total of " + lot + " patients)."
	}
	else
	{
		$("results-total-chunks-patients").innerHTML = "(out of some " + grps + " subgroups of roughly " + size + " each, or a total of some " + lot + " patients)."
	}
}

i2b2.ExportXLS.getEstimatedTimeRemaining = function(elapsedTime)
{
	var estimatedTotalPDOreqTime = elapsedTime;    
	var estimatedLastPDOresponseArrivalTime;
	var estimatedTabulationTime = i2b2.ExportXLS.PDOQueryPatientCount * 1.1; // guesstimating that worst case it takes 1 sec to render each patient, with 10% safety factor
    if (i2b2.ExportXLS.PDOQueryPatientCount != i2b2.ExportXLS.model.outputOptions.queryPageSize)
	{	
		estimatedTabulationTime /= 100; // guesstimating that best case it takes 1 sec to render each 100 patients (or 10 ms per patient), with 10% safety factor
	}
	if (0 < i2b2.ExportXLS.PDOQueryChunkCurrent)
    {	
	    estimatedLastPDOresponseArrivalTime = elapsedTime / i2b2.ExportXLS.PDOQueryChunkCurrent;    
	}
	else
	{
		estimatedLastPDOresponseArrivalTime = elapsedTime;	
	}
    estimatedTotalPDOreqTime = estimatedLastPDOresponseArrivalTime * i2b2.ExportXLS.PDOQueryPatientChunkTotal;    
	if (0 == elapsedTime) // i.e. before even the first chunk (subgroup) came back
	{
		return i2b2.ExportXLS.getDurationInHrMinSec(110 * Math.random() * i2b2.ExportXLS.PDOQueryPatientChunkTotal + estimatedTabulationTime);
	}
	else
	{
		return i2b2.ExportXLS.getDurationInHrMinSec(Math.abs(estimatedTotalPDOreqTime + estimatedLastPDOresponseArrivalTime + estimatedTabulationTime - elapsedTime));
	}
}

i2b2.ExportXLS.getCurrentTime = function()
{
	var d = new Date();    
	return d.getTime();
}

i2b2.ExportXLS.getElapsedTime = function(refTime)
{
	var d = new Date();    
	var t = d.getTime();
    return Math.round((t - refTime) / 1000);    
}

i2b2.ExportXLS.getDurationInHrMinSec = function(duration)
{
	var s;
	var m;
	var h;
	if (60 > duration) 
	{
		return (parseInt(duration) + " sec.");
	}
	else 
	{
		s = parseInt(duration % 60);
		m = parseInt(duration / 60);
		if (60 > m)
		{
			return (m + " min. " + s + " sec.");
		}
		else
		{
			h = parseInt(m / 60);
			m = parseInt(m % 60);
			return (h + " hr. " + m + " min. " + s + " sec.");
		}
	}
}

i2b2.ExportXLS.SetCsvDelimiter = function(delim)
{
	i2b2.ExportXLS.model.CsvDelimiter = delim.value;
}
