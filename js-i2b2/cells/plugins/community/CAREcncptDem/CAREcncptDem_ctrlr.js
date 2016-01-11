/*==========================================================================================================================
 * @projectDescription  CARE (Cohort Analysis & Refinement Expeditor) - Concept Demographics Histograms
 *                       - Generation of histograms of demographic breakdowns for the specified subset of a patient set and 
 *                         additional subsets from that subset that are associated to selected concepts (ontology terms).
 * @inherits            i2b2
 * @namespace           i2b2.CAREcncptDem
 * @author              S. Wayne Chan, 
 *						Biomedical Research Informatics Development Group (BRIDG),
 *						Biomedical Research Informatics Consulting & Knowledge Service (BRICKS), and
 *						Health Electronic Record Operationalization (HERO),
 *                      Div. of Health Informatics and Implementation Science (HIIS), 
 *						Dept. of Quantitative Health Sciences (QHS), 
 *                      University of Massachusetts Medical School (UMMS, UMassMed), Worcester, MA
 * @version             1.1 (for i2b2 v1.6 & above)
 * @acknowledgement     This module leveraged off the construct / format /style used in the i2b2 web client plugin examples
 *                       by N. Benik & G. Weber
 + ------------------------------------------------------------------------------------------------------------------------
 + @copyright           Copyright 2015 University of Massachusetts Medical School.
 + @license/disclaimer  This file is part of CARE - Concept Demographics Histograms plugin for the i2b2 webclient.
 +
 +						This plugin for the i2b2 webclient is free software: you can redistribute it and/or modify it 
 +                      under the terms of the GNU General Public License as published by the Free Software Foundation,  
 +                      either version 3 of the License, or (at your option) any later version.
 +
 +						This free software is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
 +                      without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the 
 +                      GNU General Public License for more details.
 +
 +						You should have received a copy of the GNU General Public License along with this free software.  
 +                      If not, see <http://www.gnu.org/licenses/>.
 + ------------------------------------------------------------------------------------------------------------------------
 * updated history (dateformat: YYYYMMDD) 
 * 20150211 S. Wayne Chan (v.1.0) developed initial version.
 * 20150401 S. W. Chan  (v.1.0.1) improved displays of the "COHORTS vs. POP. & LEGEND" table in the "View Results" tab
 *                                 on IE.  
 * 20150520 S. Wayne Chan (v.1.1) added "Export Data" tab & other minor refinements.
 * 20151109 S. Wayne Chan (v.1.2) fixed compatibility issue with the prototype.js v.1.7.2 (ships with webclient v1.7.0.7), 
 * 20151215 S. Wayne Chan (v.1.2) added .SetAccessories() to facilitate moving the Save*.php files, etc. into the local 
 *                                 /asset subfolder; & other minor touch-ups.
 * 20151230 S. Wayne Chan (v.1.2) fixed JIRA issue PLUGINS-10 ('Marital Status' value is always 'undefined').                                
 *==========================================================================================================================
 */

i2b2.CAREcncptDem.Init = function(loadedDiv) {
	// register DIV as valid DragDrop target for Patient Record Sets (PRS) objects
	var op_trgt = { dropTarget:true };
	i2b2.sdx.Master.AttachType("CAREcncptDem-PRSDROP", "PRS", op_trgt);
	i2b2.sdx.Master.AttachType("CAREcncptDem-CONCPTDROP", "CONCPT", op_trgt);
	// drop event handlers used by this plugin
	i2b2.sdx.Master.setHandlerCustom("CAREcncptDem-PRSDROP", "PRS", "DropHandler", i2b2.CAREcncptDem.PrsDropped);
	i2b2.sdx.Master.setHandlerCustom("CAREcncptDem-CONCPTDROP", "CONCPT", "DropHandler", i2b2.CAREcncptDem.ConceptDropped);
	i2b2.CAREcncptDem.Unload();								   // reset & init default settings
	// manage YUI tabs
	this.yuiTabs = new YAHOO.widget.TabView("CAREcncptDem-TABS", {activeIndex:0});
	this.yuiTabs.on('activeTabChange', function(ev) {          //Tabs have changed
		if ("CAREcncptDem-TAB1" == ev.newValue.get('id')) {    // user switched to Results tab
			if (i2b2.CAREcncptDem.prsRecord && 0 < i2b2.CAREcncptDem.concepts.length) { // proceed only if input OK
				if (i2b2.CAREcncptDem.runPending) {            // update results only if the input data has changed
					i2b2.CAREcncptDem.GetReadyForResults();
					i2b2.CAREcncptDem.GetResults();
				}
			}
		}
	});
	i2b2.CAREcncptDem.FixIEscrollbarProblem();
} // end of Init()

i2b2.CAREcncptDem.Unload = function() { // purge old data
	i2b2.CAREcncptDem.runPending = true;
	i2b2.CAREcncptDem.prsRecord = false;
	i2b2.CAREcncptDem.concepts = [];
	i2b2.CAREcncptDem.sumCounts = [];
	i2b2.CAREcncptDem.patients = [];
	i2b2.CAREcncptDem.cncptPats = {};
	$("CAREcncptDem-DeleteMsg").style.display = 'none'; // hide the concept delete message if none specified yet
	$("CAREcncptDem-PatStartNum").hide();				// hide the Pat Set info message if none specified yet
	i2b2.CAREcncptDem.qPatCount = 0;  					// count for chunked PDO queries
	i2b2.CAREcncptDem.qChunkStart = 0;    				// starting patient # of current chunked PDO queries
	i2b2.CAREcncptDem.qChunkEnd = 0;    				// ending patient # of current chunked PDO queries
	i2b2.CAREcncptDem.qChunkCurrent = 0;  				// current chunked PDO query #
	i2b2.CAREcncptDem.qLastPatNum = 1; 					// pat # of last patient, over all PDO queries (0-based indexing)
	i2b2.CAREcncptDem.qChunkTotal = 1; 					// number of patient chunks of PDO queries
	i2b2.CAREcncptDem.qMsgCore = "";					// the getPDO query filter list message core
	i2b2.CAREcncptDem.options = {};						// user specifiable options
	i2b2.CAREcncptDem.options.qChunkSize = 20;			// PDO query chunk size (# of pats each)
	i2b2.CAREcncptDem.options.startPatNum = 1;			// starting patient number (of the patient set to be used)
	i2b2.CAREcncptDem.options.patCount = 500;			// patient count (of the patient set to be used)
	i2b2.CAREcncptDem.StartTime = 0;
	i2b2.CAREcncptDem.CSVhdr = "";			    		// for ExportCSV
	i2b2.CAREcncptDem.CSVdata = "";						// for ExportCSV
	i2b2.CAREcncptDem.XLSdata = "";						// for ExportXLS
	return true;
} // end of Unload()

i2b2.CAREcncptDem.FixIEscrollbarProblem = function() {
	var  mainContentDivs, i, z = $('anaPluginViewFrame').getHeight() - 34;
	mainContentDivs = $$('DIV#CAREcncptDem-TABS DIV.CAREcncptDem-MainContent');
	for (i = 0; i < mainContentDivs.length; i ++) {
		mainContentDivs[i].style.height = z;
	}
} // end of FixIEscrollbarProblem()

i2b2.CAREcncptDem.PrsDropped = function(sdxData) { // Patients Record Set dropped in
	var psSize;
	sdxData = sdxData[0];	                                                             // only interested in first record
	i2b2.CAREcncptDem.prsRecord = sdxData;                                         		 // save to local data model
	$("CAREcncptDem-PRSDROP").innerHTML = i2b2.h.Escape(sdxData.sdxInfo.sdxDisplayName); // display PS name to show drop OK
	$("CAREcncptDem-PRSDROP").style.background = "#CFB"; // momentarily change background color as sign of pending OK drop 
	setTimeout("$('CAREcncptDem-PRSDROP').style.background='#DEEBEF'", 250);	
	psSize = i2b2.CAREcncptDem.prsRecord.origData.size; 
	$("CAREcncptDem-PatSetSize").innerHTML = i2b2.CAREcncptDem.GetPatSetSizeAndUsageMsg(psSize);// update display
	$("CAREcncptDem-NumberOfPats").value = Math.min(Math.max($("CAREcncptDem-NumberOfPats").value, 500), psSize); 
	                                             //since 1+psSize-$("CAREcncptDem-StartingPat").value = 1+psSize-1 = psSize
	$("CAREcncptDem-PatStartNum").show();				 // show the Pat Set info msg
	i2b2.CAREcncptDem.runPending = true;	    		 // to prevent requerying the hive if the input has not changed
} // end of PrsDropped()

i2b2.CAREcncptDem.ConceptDropped = function(sdxData) {
	var nameD, n, newConcept, nameC;
	sdxData = sdxData[0];                       // Consider first record only 
	if (sdxData.origData.isModifier) {
		alert("Modifier item being dropped in is not supported.");
		return false;	
	}
	nameD = sdxData.sdxInfo.sdxDisplayName; 	// Save to local data model
	n = i2b2.CAREcncptDem.concepts.length;
	if (n) {	
		newConcept = true;
		if (19 < n) {
			alert("20 concepts has already been selected (no more concept would be accepted)!!");
			newConcept = false;
		} else {
			for (var i = 0; i < n; i ++) {		
				nameC = i2b2.CAREcncptDem.concepts[i].sdxInfo.sdxDisplayName;
				if (nameC == nameD)	{
					alert("This concept has already been selected (duplicate concept would not be accepted)!!");
					newConcept = false;
					break;
				}
			}
		}
		if(newConcept) {		
			i2b2.CAREcncptDem.ConceptAdd(sdxData);
		}
	} else {
		i2b2.CAREcncptDem.ConceptAdd(sdxData);
	}
	i2b2.CAREcncptDem.CheckUpdateCohortSizeUsageMeg(); // in case user skips to drag-drop concpts after setting startPatNum
} // end of ConceptDropped()

i2b2.CAREcncptDem.ConceptAdd = function(sdxData) {
	i2b2.CAREcncptDem.concepts.push(sdxData);		
	i2b2.CAREcncptDem.ConceptsRender(); 			      // Sort and display concepts 		
	i2b2.CAREcncptDem.runPending = true; 			      // to prevent requerying the hive if the input has not changed
} // end of ConceptAdd()

i2b2.CAREcncptDem.ConceptDelete = function(concptIndex) {
	i2b2.CAREcncptDem.concepts.splice(concptIndex, 1);    // remove the selected concept
	i2b2.CAREcncptDem.ConceptsRender(); 				  // sort and display the concept list
	i2b2.CAREcncptDem.runPending = true;		    	  // to prevent requerying the hive if the input has not changed
} // end of ConceptDelete()

i2b2.CAREcncptDem.ConceptsRender = function() {
	var i, s = '', conDiv = '<div class="concptDiv"></div>';
	var newCon = '<a class="concptItem" href="JavaScript:i2b2.CAREcncptDem.ConceptDelete({0});">{1}</a>';
	if (i2b2.CAREcncptDem.concepts.length) { // If there are any concepts in the list
		i2b2.CAREcncptDem.concepts.sort (    // Sort the concepts in alphabetical order
			function() { return arguments[0].sdxInfo.sdxDisplayName > arguments[1].sdxInfo.sdxDisplayName }
		); 
		for (i = 0; i < i2b2.CAREcncptDem.concepts.length; i ++) { // List the concepts
			if (i > 0) { s += conDiv; }
			s += i2b2.CAREcncptDem.format(newCon, i, i2b2.h.Escape(i2b2.h.HideBreak(i2b2.CAREcncptDem.concepts[i].sdxInfo.sdxDisplayName)));
		}
		$("CAREcncptDem-DeleteMsg").style.display = 'block';       // Show the concept delete message
		$("CAREcncptDem-ConceptHint").style.display = 'none';      // hide the Concept HINT link
	} else { // No concepts selected yet
		s = '<div class="concptItem">Drop one or more Concepts here</div>';
		$("CAREcncptDem-DeleteMsg").style.display = 'none';        // hide the concept delete message
		$("CAREcncptDem-ConceptHint").style.display = 'block';     // show the Concept HINT link	
	}
	$("CAREcncptDem-CONCPTDROP").innerHTML = s; // Update html
} // end of ConceptsRender()

i2b2.CAREcncptDem.GetReadyForResults = function() {
	var psSize, numPats, startingPat, targetPatCount;
	i2b2.CAREcncptDem.patients = [];
	i2b2.CAREcncptDem.cncptPats = {};
	i2b2.CAREcncptDem.sumCounts = [];	
	$("results-server-paging-warning").innerHTML = "";	
	psSize = i2b2.CAREcncptDem.prsRecord.origData.size; 
	numPats = i2b2.CAREcncptDem.options.patCount;
	startingPat = i2b2.CAREcncptDem.options.startPatNum;
	targetPatCount = i2b2.CAREcncptDem.FindPatientCountAndEndNum(psSize, numPats, startingPat); // in case values changed 
	i2b2.CAREcncptDem.StartTime = i2b2.CAREcncptDem.GetCurrentTime();
	i2b2.CAREcncptDem.FindPDOChunkTotal();
	i2b2.CAREcncptDem.qChunkStart = startingPat;
	i2b2.CAREcncptDem.FindPDOChunkUpper();
	i2b2.CAREcncptDem.qChunkCurrent = 0;
	$$("DIV#CAREcncptDem-mainDiv DIV#CAREcncptDem-TABS DIV.results-directions")[0].hide();
	$$("DIV#CAREcncptDem-mainDiv DIV#CAREcncptDem-TABS DIV.results-finished")[0].hide();
	$$("DIV#CAREcncptDem-mainDiv DIV#CAREcncptDem-TABS DIV.results-serverFailed")[0].hide();				
	$$("DIV#CAREcncptDem-mainDiv DIV#CAREcncptDem-TABS DIV.results-working")[0].show();		
	i2b2.CAREcncptDem.SetPDOMsgCore();
	i2b2.CAREcncptDem.SetAccessories(); // Set up the full relative paths of the accessory files (Save*.php, *.png, *.gif, etc.)
} // end of GetReadyForResults()

i2b2.CAREcncptDem.SetAccessories = function() {
	var curWrkPath = i2b2.PLUGINMGR.ctrlr.main.currentPluginCtrlr.cfg.config.assetDir;
	var dot_spr = curWrkPath + "loading.gif";
	var csv_btn = curWrkPath + "exportCSVBtn.png";
	var xls_btn = curWrkPath + "exportHTMLXLSBtn.png";
	var xls_php = curWrkPath + "SaveToHTMLXLS.php?suffix=CARE-cncptDem";
	var csv_php = curWrkPath + "SaveToCSV.php?suffix=CARE-cncptDem";
	//alert("xls_php='" + xls_php + "'\n\ncsv_php='" + csv_php + "'\n\ndot-spiral='" + dot_spr + "'\ncsv_btn='" + csv_btn + "'\nxls_btn='" + xls_btn + "'");
	$j("#dotSpiral").attr("src", dot_spr);
	$j("#save2csvBtn").attr("src", csv_btn);
	$j("#save2xlsBtn").attr("src", xls_btn);
	$j("#save2csv").attr("action", csv_php);
	$j("#save2xls").attr("action", xls_php);
} // end of SetAccessories()

i2b2.CAREcncptDem.GetResults = function() {
    var subGrp = 'Currently busy retrieving patient data for subgroup #{0}', n;
	var scallback = new i2b2_scopedCallback(); // callback processor
	scallback.scope = this;
	scallback.callback = function(results) { return i2b2.CAREcncptDem.ProcessResults(results); }
	i2b2.CAREcncptDem.qChunkCurrent ++;
    n = Math.min(i2b2.CAREcncptDem.qChunkCurrent, i2b2.CAREcncptDem.qChunkTotal);	
    $("results-working-progress").innerHTML = i2b2.CAREcncptDem.format(subGrp, n);
		                                       // qChunkCurrent may > qChunkTotal when server itself started paging!
	i2b2.CAREcncptDem.UpdateTimeMessage();
	// AJAX CALL USING THE EXISTING CRC CELL COMMUNICATOR
	i2b2.CRC.ajax.getPDO_fromInputList("Plugin:CAREcncptDem", {PDO_Request: i2b2.CAREcncptDem.GetRequest()}, scallback);
} // end of GetResults()

// THIS function is used to process the AJAX results of the i2b2 RESTful call
//		results data object contains the following attributes:
//			refXML: xmlDomObject <--- for data processing
//			msgRequest: xml (string)
//			msgResponse: xml (string)
//			error: boolean
//			errorStatus: string [only with error=true]
//			errorMsg: string [only with error=true]
i2b2.CAREcncptDem.ProcessResults = function(resultData) {
	if (resultData.error) { // handle errors
		$("results-server-paging-warning").innerHTML = "<font color='red'><b>Warning: The server (i2b2 hive) has returned an error <br/>(apparently, it has been overwhelmed by the amount of data requested of it, and had failed)!!</b></font>";
		var t = i2b2.CAREcncptDem.GetElapsedTime(i2b2.CAREcncptDem.StartTime);
        var msg = '<font color="black" style="normal">Elapsed time: {0}</font>'; 
		$("results-failure-time").innerHTML = i2b2.CAREcncptDem.format(msg, i2b2.CAREcncptDem.GetDuration(t));
		$$("DIV#CAREcncptDem-mainDiv DIV#CAREcncptDem-TABS DIV.results-working")[0].hide();
		$$("DIV#CAREcncptDem-mainDiv DIV#CAREcncptDem-TABS DIV.results-serverFailed")[0].show();		
		console.error("Bad Results from Cell Communicator: ", resultData);
		return false;
	}
	i2b2.CAREcncptDem.ProcessXMLResponse(resultData);
	if (i2b2.CAREcncptDem.AllChunksQueried()) {
		i2b2.CAREcncptDem.runPending = false;		
		$("results-working-progress").innerHTML = "Currently tabulating all data returned by the server (i2b2 hive).";
		i2b2.CAREcncptDem.SortPatientsByPatID();
		i2b2.CAREcncptDem.ProcessAllData();
	} else {
		i2b2.CAREcncptDem.qChunkStart = Math.min(i2b2.CAREcncptDem.qChunkEnd + 1, i2b2.CAREcncptDem.qLastPatNum);
		i2b2.CAREcncptDem.FindPDOChunkUpper();
		i2b2.CAREcncptDem.GetResults(); // get the data for the next subgroup of patients
	}
} // end of ProcessResults()
	
i2b2.CAREcncptDem.SortPatientsByPatID = function() {
	i2b2.CAREcncptDem.patients.sort(function() { return arguments[0]["patient_id"] > arguments[1]["patient_id"] } ); 
	return;
} // end of SortPatientsByPatID()

i2b2.CAREcncptDem.ProcessAllData = function() {
	var psName, pssSize, s, DemCats, xmlResponse, patInfo, hData, j, i, panelName, curCncptPats, h, patId, n;
    var dt1 = i2b2.CAREcncptDem.GetDuration(i2b2.CAREcncptDem.GetElapsedTime(i2b2.CAREcncptDem.StartTime));
	var t1 = i2b2.CAREcncptDem.GetCurrentTime(), dt2, s2;	
	$$("DIV#CAREcncptDem-mainDiv DIV#CAREcncptDem-TABS DIV.results-working")[0].hide();			
	$$("DIV#CAREcncptDem-mainDiv DIV#CAREcncptDem-TABS DIV.results-finished")[0].show();
	psName = i2b2.CAREcncptDem.prsRecord.sdxInfo.sdxDisplayName;
	pssSize = i2b2.CAREcncptDem.patients.length; // PS subset (user-specified) size
	s = '<div class="intro">Below are the demographic details for the selected patient set subset, as well as the subsets associated (observed) with the selected concepts.<br/>For each demographic category, the values, number of patients, and a histogram are provided.</div><hr/><br/><div class="demTables">';
	DemCats = {
		age_in_years_num:'Age (Years)', 
		sex_cd:'Gender',
		race_cd:'Race',
		language_cd:'Language',
		marital_status_cd:'Marital Status',
		religion_cd:'Religion',
		vital_status_cd:'Vital Status (Deceased)'
	};
	hData = new Hash();
	for (j = 0; j < pssSize; j ++) {
		patInfo = i2b2.CAREcncptDem.patients[j];
		i2b2.CAREcncptDem.ProcessDemCats(patInfo, DemCats, hData);
	}
//	i2b2.CAREcncptDem.sumCounts[0] = eval("(" + hData.toJSON() + ")"); // convert & save hash to regular obj data model
	i2b2.CAREcncptDem.sumCounts[0] = eval("(" + Object.toJSON(hData) + ")"); // convert & save hash to regular obj data model (updated due to latest prototype.js)
	i = 0;
	for (panelName in i2b2.CAREcncptDem.cncptPats) {
		i ++;
		curCncptPats = i2b2.CAREcncptDem.cncptPats[panelName];
		hData = new Hash();
		for (h = 0; h < curCncptPats["patients"].length; h ++) {
			patId = curCncptPats["patients"][h];
			for (j = 0; j < pssSize; j ++) {
				patInfo = i2b2.CAREcncptDem.patients[j];					
				if (patId == patInfo["patient_id"])	{
					i2b2.CAREcncptDem.ProcessDemCats(patInfo, DemCats, hData);
					break;
				}
			}
		}
//		i2b2.CAREcncptDem.sumCounts[i] = eval("(" + hData.toJSON() + ")"); // convert & save hash to reg obj data model
		i2b2.CAREcncptDem.sumCounts[i] = eval("(" + Object.toJSON(hData) + ")"); // convert & save hash to reg obj data model (updated due to latest prototype.js)
	}	
	n = i2b2.CAREcncptDem.sumCounts.length;
	s += i2b2.CAREcncptDem.ShowLegend(psName, pssSize, n) + i2b2.CAREcncptDem.ShowCharts(DemCats, n);
	dt2 = i2b2.CAREcncptDem.GetDuration(i2b2.CAREcncptDem.GetElapsedTime(t1));
	s2 = '<div style="text-align:right;"><sup>data fetch time = {0}, tabulation time = {1}</sup></div>'; 	
	s += i2b2.CAREcncptDem.format(s2, dt1, dt2); 	
	$$("DIV#CAREcncptDem-mainDiv DIV#CAREcncptDem-TABS DIV.results-finished")[0].innerHTML = s;
	i2b2.CAREcncptDem.runPending = false;                         // to ensure requery only when the input data is changed
} // end of ProcessAllData()

i2b2.CAREcncptDem.ShowLegend = function(psName, psSize, n) {
	var s, scale, barCell, j, panelName, curCncptPats, sz, pop, s1, s2;
	var s0 = '<table style="width:80%">\n<tr><th style="width:75%">COHORTS<br/><small>{0}<br/>{1}</small></th><th colspan="2">POPULATIONS & LEGEND</th></tr>\n<tr><td style="width:75%"><b>{2}</b></td><td>{3}</td><td class="barTD0"><div class="bar0" style="width:220px;"></div></td></tr>';	
	var cs0 = 'COHORTS, POPULATIONS\n{0}\n{1}\n{2}, {3}\n', csv, conGrp = '{0}, all selected cohorts', delim = ', {0}';		
	s = $("CAREcncptDem-PatSetSize").innerHTML;
	j = s.indexOf("(");
	s1 = s.substring(0, j);
	s2 = s.substring(j).replace("using", "selected");	
	csv = i2b2.CAREcncptDem.format(cs0, psName, s1, s2, psSize);
	s = i2b2.CAREcncptDem.format(s0, psName, s1, s2, psSize);
	s2 = s;
	scale = 220 / psSize;
	j = 0;
	barCell = '{0}<td class="barTD1"><div class="bar{1}" style="width:{2}px;"></div></td></tr>'; 
	s0 = '\n<tr><td style="width:75%">{0}% of selected patients associated with "<b>{1}</b>"</td><td>{2}</td>';
						   // "width" needed to ensure no wrap for IE only, but OK with Chrome, Safari, FF, Opera, Vivaldi
	cs0 = '{0}% of selected patients associated with "{1}", {2}\n';
	for (panelName in i2b2.CAREcncptDem.cncptPats) {
		j ++;
		curCncptPats = i2b2.CAREcncptDem.cncptPats[panelName];
		sz = curCncptPats["patients"].length;
		pop = Math.round(1000 * sz / psSize) / 10; // round to 1 decimal place
		conGrp += i2b2.CAREcncptDem.format(delim, curCncptPats["display_name"]);
		csv += i2b2.CAREcncptDem.format(cs0, pop, curCncptPats["display_name"], sz);
		s1 = i2b2.CAREcncptDem.format(s0, pop, curCncptPats["display_name"], sz);
		s += i2b2.CAREcncptDem.format(barCell, s1, j, scale * sz);
		s2 += s1;
	}
	s1 = i2b2.CAREcncptDem.format('{0}\n</table>', s2.replace(/<th colspan="2">/g, '<th>').replace(/ & LEGEND/g, ''));
	i2b2.CAREcncptDem.XLSdata = s1;
	i2b2.CAREcncptDem.CSVdata = i2b2.CAREcncptDem.format('{0}\n\n', csv);							// for ExportCSV
	i2b2.CAREcncptDem.CSVhdr = i2b2.CAREcncptDem.format('{0}\n', conGrp); 					    	// for ExportCSV
	$$("DIV#CAREcncptDem-mainDiv DIV#CAREcncptDem-TABS DIV.export-directions")[0].hide();			
	$$("DIV#CAREcncptDem-mainDiv DIV#CAREcncptDem-TABS DIV.buttonTable")[0].show();			
	return i2b2.CAREcncptDem.format('{0}</table>', s);
} // end of ShowLegend()

i2b2.CAREcncptDem.ShowCharts = function(DemCats, n) {
	var DemCat, DemCatValues, DemCatValsList, maxVal, i, j, DemCatVal, scale, curCatVal, barCell, barWidth, s = '';
	var csv = '', delim = ', {0}', delim0 = ', 0', demcatTitle = '<div class="demcatTitle">{0}</div><table>';
	var sTr = '<tr>', sTrEnd = '</tr>', sTableEnd = '</table>', lf = ' \n', lf2 = ' \n\n', none = '"no entry"';	
	var bc0 = '<td class="barTD0"><div class="bar', bc1 = '<td class="barTD1"><div class="bar';
	var s0 = '<tr><th rowspan="{0}">"no entry"</th>', s2 = '<td>0</td>{0}{1}" style="width:0px;"></div></td>';
	var s1 = '<tr><th rowspan="{0}">{1}</th>', s3 = '<td>{0}</td>{1}{2}" style="width:{3}px;"></div></td>';
	for (DemCat in DemCats) {
		DemCatValues = {};
		DemCatValsList = [];
		maxVal = [];
		for (i = 0; i < n; i ++) {
			maxVal[i] = 0;
			for (DemCatVal in i2b2.CAREcncptDem.sumCounts[i][DemCat]) {
				tempVal = i2b2.CAREcncptDem.sumCounts[i][DemCat][DemCatVal];
				if (!DemCatValues[DemCatVal]) {
					DemCatValues[DemCatVal] = [0, 0];
					DemCatValsList.push(DemCatVal);
				}
				DemCatValues[DemCatVal][i] = tempVal;
				maxVal[i] = Math.max(maxVal[i], tempVal);
			}	
		}
		scale = 440 / Math.max.apply(Math, maxVal); 
		s += i2b2.CAREcncptDem.format(demcatTitle, DemCats[DemCat]);
		csv += i2b2.CAREcncptDem.format(i2b2.CAREcncptDem.CSVhdr, DemCats[DemCat]);		
		DemCatValsList.sort();
		for (i = 0; i < DemCatValsList.length; i ++) {
			curCatVal = DemCatValsList[i];
			if ('' == curCatVal) {
				s += i2b2.CAREcncptDem.format(s0, n);
				csv += none;
			} else {
				s += i2b2.CAREcncptDem.format(s1, n, curCatVal);
				csv += curCatVal;				
			}
			for (j = 0; j < n; j ++) {
				if (0 < j) { 
					s += sTr;
					barCell = bc1
				} else {
					barCell = bc0;
				}
				if (undefined == DemCatValues[curCatVal][j]) {
					s += i2b2.CAREcncptDem.format(s2, barCell, j);
					csv += delim0;
				} else {
					barWidth = scale * DemCatValues[curCatVal][j];
					s += i2b2.CAREcncptDem.format(s3, DemCatValues[curCatVal][j], barCell, j, barWidth);
					csv += i2b2.CAREcncptDem.format(delim, DemCatValues[curCatVal][j]);
				}
				s += sTrEnd;
			}
			csv += lf;
		}
		s += sTableEnd;
		csv += lf2;				
	}
	i2b2.CAREcncptDem.CSVdata += csv;
	csv += '   \n';	// for ExportXLS
	csv = csv.replace(/, /g, '</td><td>').replace(/ \n \n\n   \n/g, '</td></tr>!!!</table>!!!<br/>!!!');
	csv = csv.replace(/ \n \n\n/g, '</td></tr>!!!</table>!!!<br/>!!!<table>!!!<tr><td>');
	csv = csv.replace(/\n/g, '</td></tr>!!!<tr><td>').replace(/!!!/g, '\n');			
	i2b2.CAREcncptDem.XLSdata += i2b2.CAREcncptDem.format('\n<br/>\n<table>\n<tr><td>{0}', csv);	
	return i2b2.CAREcncptDem.format('{0}</div><br/>', s);
} // end of ShowCharts()

i2b2.CAREcncptDem.ProcessDemCats = function(patInfo, DemCats, hData) {
	var n, t1, t2, DemCat;
	for (DemCat in DemCats) {
		n = patInfo[DemCat];
		t1 = hData.get(DemCat);
		if (!t1) { t1 = new Hash(); }
		t2 = t1.get(n);
		if (!t2) {
			t2 = 1;
		} else {
			t2++;
		}
		t1.set(n, t2);
		hData.set(DemCat, t1);
	}
} // end of ProcessDemCats()

i2b2.CAREcncptDem.SetPDOMsgCore = function() {
	var i, t, cdata, msgFilter, filterList = '';
	var sp0 = '	              ', sp2 = '\n	    	          ', sp3 = '\n			    '; 
	for (i = 0; i < i2b2.CAREcncptDem.concepts.length; i ++) {
		t = i2b2.CAREcncptDem.concepts[i].origData.xmlOrig;
		cdata = {};
		cdata.level = i2b2.h.getXNodeVal(t, "level");
		cdata.key = i2b2.h.getXNodeVal(t, "key");
		cdata.tablename = i2b2.h.getXNodeVal(t, "tablename");
		cdata.dimcode = i2b2.h.getXNodeVal(t, "dimcode");
		cdata.synonym = i2b2.h.getXNodeVal(t, "synonym_cd");
		filterList += i2b2.CAREcncptDem.format('{0}<panel name="{1}">{2}<panel_number>0</panel_number>{2}<panel_accuracy_scale>0</panel_accuracy_scale>{2}<invert>0</invert>{2}<item>{3}<hlevel>{4}</hlevel>{3}<item_key>{1}</item_key>{3}<dim_tablename>{5}</dim_tablename>{3}<dim_dimcode>{6}</dim_dimcode>{3}<item_is_synonym>{7}</item_is_synonym>{2}</item>\n{0}</panel>\n', sp0, cdata.key, sp2, sp3, cdata.level, cdata.tablename, cdata.dimcode, cdata.synonym);
	}
	sp0 = '	    	          ', sp2 = '\n	              ', sp3 = '	           ';
	i2b2.CAREcncptDem.qMsgCore = i2b2.CAREcncptDem.format('{0}<patient_set_coll_id>{1}</patient_set_coll_id>{2}</patient_list>\n{3}</input_list>\n{3}<filter_list>\n{4}{3}</filter_list>\n{3}<output_option>{2}<patient_set select="using_input_list" onlykeys="false"/>{2}<observation_set blob="false" onlykeys="true"/>\n{3}</output_option>\n', sp0, i2b2.CAREcncptDem.prsRecord.sdxInfo.sdxKeyValue, sp2, sp3, filterList);
	// just need '<input_list><patient_list min="' + min + '" max="' + max + '">'..
} // end of SetPDOMsgCore()

i2b2.CAREcncptDem.GetRequest = function() {
	var	s = '\n	        <input_list>\n	           <patient_list min="{0}" max="{1}">\n{2}';
	s = i2b2.CAREcncptDem.format(s, i2b2.CAREcncptDem.qChunkStart, i2b2.CAREcncptDem.qChunkEnd, i2b2.CAREcncptDem.qMsgCore);
	return s;
} // end of GetRequest()

i2b2.CAREcncptDem.ProcessXMLResponse = function(resultData) {
	var xmlContent, xmlDoc; 
	if (window.DOMParser) {                  // not Internet Explorer
		xmlContent = resultData.msgResponse; // for Chrome, Safari, & FireFox 
		var parser = new DOMParser();
		xmlDoc = parser.parseFromString(xmlContent, "text/xml"); 
	} else {                                 // Internet Explorer
		xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
		xmlDoc.async = false;
		xmlDoc.loadXML(resultData.msgResponse);
		xmlContent = xmlDoc; 
	}
	i2b2.CAREcncptDem.CheckForServerPagedResult(xmlDoc);
	i2b2.CAREcncptDem.SavePats(xmlDoc);
	i2b2.CAREcncptDem.SaveAllCncptPats(xmlContent);	
} // end of ProcessXMLResponse()

i2b2.CAREcncptDem.CheckForServerPagedResult = function(xmlDoc) {	
	var pagingNode = $j(xmlDoc).find('paging_by_patients');
	var firstIndex = pagingNode.find('patients_returned').attr('first_index');
	var lastIndex = pagingNode.find('patients_returned').attr('last_index');
	if (!Object.isUndefined(firstIndex) && !Object.isUndefined(lastIndex)) {
		i2b2.CAREcncptDem.qChunkEnd = parseInt(lastIndex);
		$("results-server-paging-warning").innerHTML = "<b>Warning: the server (i2b2 hive) has paged this data query</b><br/> (i.e. replaced it with many smaller queries that it hopes to better manage),<br/><b>this may take longer time to finish!<br/><br/>Next time, please consider reducing the 'Query Page Size' field value (non-zero)<br/>on the 'Specify Data' tab to speed things up.</b>";
	}
} // end of CheckForServerPagedResult()

i2b2.CAREcncptDem.SavePats = function(xmlDoc) {	
	$j(xmlDoc).find('patient').each( 
		function() { i2b2.CAREcncptDem.SavePatInfo($j(this)) } 
	);
} // end of SavePats()	

i2b2.CAREcncptDem.SavePatInfo = function(patientNode) {
	var patient_id = patientNode.find("patient_id").text();
	var patInfo = {};
	patInfo["patient_id"] = patient_id;				
	$j(patientNode).find('param').each(
		function() {
			var v;
			var paramName = $j(this).attr('column');
			var paramValue = $j(this).text();		
			if ('vital_status_cd' == paramName || 'language_cd' == paramName || 'race_cd' == paramName || 
			    'religion_cd' == paramName || 'marital_status_cd' == paramName || 'sex_cd' == paramName) {
				patInfo[paramName] = paramValue;
			} else if ('age_in_years_num' == paramName)	{
				v = Math.floor(paramValue / 10);
				if (0 == v)	{
					v = '< 10 yrs';
				} else if (v > 10) {
					v = '> 100 yrs';
				} else {	
					v = i2b2.CAREcncptDem.format('{0}0 - {1}0 yrs', v, (v + 1)); 
					// the ' yrs' is to prevent '10 - 20' from being converted to '20-Oct' when exported to XLS 
				}
				patInfo[paramName] = v;
			}
		}
	);		
	i2b2.CAREcncptDem.patients.push(patInfo);
} // end of SavePatInfo()	

i2b2.CAREcncptDem.SaveAllCncptPats = function(xmlContent) {	
	$j(xmlContent).find('ns2\\:observation_set').each( function() { i2b2.CAREcncptDem.SaveCurCncptObsPats($j(this)) } );	
} // end of SaveAllCncptPats()	

i2b2.CAREcncptDem.SaveCurCncptObsPats = function(cncptObsSetNode) {
	var panelName = cncptObsSetNode.attr('panel_name');
	var curCncptPats = i2b2.CAREcncptDem.cncptPats[panelName];
	if (Object.isUndefined(curCncptPats)) {
		var displayName = i2b2.CAREcncptDem.GetCncptObsSetName(panelName);
		curCncptPats = { "display_name" : displayName, "panel_name" : panelName, "patients" : new Array() }
	}
	$j(cncptObsSetNode).find('observation').each( 
		function() { 
			var patId = $j(this).find("patient_id").text();
			if ("@" != patId && "" != patId && 0 > curCncptPats["patients"].indexOf(patId)) {
				curCncptPats["patients"].push(patId); // save only valid, unique patient ID
			}
		} 
	);
	i2b2.CAREcncptDem.cncptPats[panelName] = curCncptPats;
} // end of SaveCurCncptObsPats()	

i2b2.CAREcncptDem.GetCncptObsSetName = function(key) {
	for (var i = 0; i < i2b2.CAREcncptDem.concepts.length; i ++) {
		if (key == i2b2.CAREcncptDem.concepts[i].sdxInfo.sdxKeyValue) {
			return i2b2.h.Escape(i2b2.h.HideBreak(i2b2.CAREcncptDem.concepts[i].sdxInfo.sdxDisplayName));
		}
	}
	return "";
} // end of GetCncptObsSetName()	

i2b2.CAREcncptDem.CheckUpdateCohortSizeUsageMeg = function() {
	window.setTimeout( // in case user skips to concepts after just setting PatStartNum and /or NumberOfPats
		function (){ 
			$("CAREcncptDem-OutputQueryPageSize").focus(); 
		}, 0
	);
} // end of CheckUpdateCohortSizeUsageMeg()	

i2b2.CAREcncptDem.GetPatSetSizeAndUsageMsg = function(psSize) {
	var numPats, startingPat, targetPatCount, s, s0;
	numPats = i2b2.CAREcncptDem.options.patCount;
	startingPat = i2b2.CAREcncptDem.options.startPatNum;
	targetPatCount = i2b2.CAREcncptDem.FindPatientCountAndEndNum(psSize, numPats, startingPat);
	s0 = "contains some {0} patients (using patients #{1} - {2}";
	s = i2b2.CAREcncptDem.format(s0, psSize, startingPat, (1 + i2b2.CAREcncptDem.qLastPatNum));
	if (psSize > targetPatCount) {
		s += i2b2.CAREcncptDem.format("; or just {0} of the set)", targetPatCount);
	} else {
		s += "; or the entire set)";
	}
	return s; 
} // end of GetPatSetSizeAndUsageMsg()	

i2b2.CAREcncptDem.FindPatientCountAndEndNum = function(psSize, numPats, startingPat) {
	if (psSize < (startingPat + numPats)) {
		i2b2.CAREcncptDem.qPatCount = psSize - startingPat + 1;
		i2b2.CAREcncptDem.qLastPatNum = psSize;
	} else {
		i2b2.CAREcncptDem.qPatCount = numPats;
		i2b2.CAREcncptDem.qLastPatNum = startingPat + i2b2.CAREcncptDem.qPatCount - 1;
	}
	i2b2.CAREcncptDem.qLastPatNum --; // convert to 0-based indexing
	return i2b2.CAREcncptDem.qPatCount;
} // end of FindPatientCountAndEndNum()	

i2b2.CAREcncptDem.SetValidValue = function(editField, option) {
	var intValue, psSize, subsetSize, numPatField, s;
	intValue = parseInt(editField.value);
	if (isNaN(intValue)) {
		alert("Please enter an integer number!");
		editField.value = "0";
	} else if (intValue < 0) {
		alert("Please enter a positive integer number!");
		editField.value = "0";
	} else {
		psSize = i2b2.CAREcncptDem.prsRecord.origData.size; 
		subsetSize = psSize - i2b2.CAREcncptDem.options["startPatNum"] + 1;
		if ("startPatNum" == option) {
			if (intValue > psSize) {
				alert("'Starting Patient' value out of range!\n\nAutomatically adjusted to 1 instead\n\n");
				intValue = 1;
			}
			subsetSize = psSize - intValue + 1;
			i2b2.CAREcncptDem.options["patCount"] = subsetSize;
			numPatField = $("CAREcncptDem-NumberOfPats");
			window.setTimeout(
				function (){ 
					numPatField.focus(); 
					numPatField.value = subsetSize;
				}, 0
			);
		} else if ("patCount" == option && intValue > subsetSize) {
			intValue = subsetSize;
			s = "'Number of Patients' value too high!\n\nAutomatically adjusted to {0} instead\n\n";
			alert(i2b2.CAREcncptDem.format(s, intValue));
		}
		i2b2.CAREcncptDem.options[option] = intValue;
		editField.value = intValue;
		if (i2b2.CAREcncptDem.concepts.length) { // PS must have been selected when this function is called
			i2b2.CAREcncptDem.runPending = true; // rerun if any setting change while there are pat set & concepts in place 
		}
		if ("startPatNum" == option || "patCount" == option || "qChunkSize" == option) {
			$("CAREcncptDem-PatSetSize").innerHTML = i2b2.CAREcncptDem.GetPatSetSizeAndUsageMsg(psSize); // update display
		}
	}
} // end of SetValidValue()	

i2b2.CAREcncptDem.UpdateTimeMessage = function() {
	var t = i2b2.CAREcncptDem.GetElapsedTime(i2b2.CAREcncptDem.StartTime), s0 = "estimated remaining run time: {0}";
	$("results-remaining-time").innerHTML = i2b2.CAREcncptDem.format(s0, i2b2.CAREcncptDem.EstimateRemainingTime(t));
	s0 = "Elapsed time (as of the last completed subgroup): {0}";
	$("results-working-time").innerHTML = i2b2.CAREcncptDem.format(s0, i2b2.CAREcncptDem.GetDuration(t));
} // end of UpdateTimeMessage()	

i2b2.CAREcncptDem.FindPDOChunkUpper = function() {
	var lower = i2b2.CAREcncptDem.qChunkStart;
	var upper = i2b2.CAREcncptDem.qPatCount; 					// Set upper border by default to # of patients
	var total = i2b2.CAREcncptDem.qLastPatNum + 1;
	var chunkSize = i2b2.CAREcncptDem.options.qChunkSize;
	if (0 < chunkSize) {
		upper = lower + chunkSize - 1;
		if (upper > total) {
			upper = total;
		}		
	}
	i2b2.CAREcncptDem.qChunkEnd = upper;
	return;
} // end of FindPDOChunkUpper()	

i2b2.CAREcncptDem.AllChunksQueried = function() {
	if (i2b2.CAREcncptDem.qChunkEnd < i2b2.CAREcncptDem.qLastPatNum) {
		return false;
	} else {
		return true;	
	}
} // end of AllChunksQueried()	

i2b2.CAREcncptDem.ExplainQueryPageSize = function() {
	var s = "About 'Query Subgroup Size':\n\n      Please note that a large query (i.e. a large patient set with many concepts, especially ones consisting many subfolder trees) may overwhelm the server (i2b2 hive), which may fail (where no data can be rendered at all) after considerable delays and timeouts.  To avoid this problem, you may want to set the 'Query Subgroup Size' value.\n\n     Setting the 'Query Subgroup Size' instructs this plugin to temporarily divide up your patient set into subgroups of your specified size, and then iteratively make requests of relevant data for each of these resulting subgroups, and then collate and render the returned data (when all these smaller queries are completed).\n\n     Since each subgroup should be of small enough size, the requests hopefully would not cause the server to fail or hang.\n\n     The ideal 'Query Subgroup Size' value cannot be predicted in general, and strongly depends on the number of observations (related to the total numbers of concepts and their complexities) returned; but values of 20 to 50 may be good.  A higher value may result in faster processing but may also carry higher risk of the server failing (where no data can be rendered at all).\n\n     Incidentally, setting a value of 0 instructs this plugin not to divide up the original query into smaller queries (and carries the risk of overwhelming and failing the server, as well as practivally no 'Elapsed time' and 'estimated remaining run time' updates)."
	alert(s);
} // end of ExplainQueryPageSize()	

i2b2.CAREcncptDem.ExplainStartingAndNumberOfPatients = function() {
	var s = "About 'Starting Patient' and 'Number of Patients':\n\n     If your patient set contains thousands of patients, you may want to use just a subset of that.  By so doing, you will speed up your query as well as reduce the likelihood of overwhelming the server (i2b2 hive) to the point of failure (and no result).\n\n     Also, if you already encountered a server failure (overwhelmed by the combination of large number of patients times lots of concepts), then you may like to rerun this plugin several times. each time specifying different 'Starting Patient' and 'Number of Patients'.\n\n     For instance, use 1 and 500, respectively, in your first run; follow with 501 and 500, respectively, in your second run; then 1001 and 500, respectively, in your third run; and so on, until you get enough data.\n\n     The example above should also show that the 'Starting Patient' and 'Number of Patients' refer to the patient entry order in the patient set only, which has no bearing on the actual patient IDs.\n\n     In addition, if the sum of the 'Starting Patient' and the 'Number of Patients' values exceeds the total patient count, then it'll be adjusted to the remaining patient count accordingly."
	alert(s);
} // end of ExplainStartingAndNumberOfPatients()	

i2b2.CAREcncptDem.SuggestFinerConceptGrainularity = function() {
	var s = "'Concept' hint (suggestion):\n\n     For best results, select finer-grained concepts that may not be related to multiple non-exclusive observations in patients.\n\n       For example, while a patient set may be for 'Circulatory system', selecting several finer concepts like 'Hypertensive disease', 'Ischemic heart disease', and 'arterial vascular disease', etc., that are pertinent to the interest at hand, would result in more meaningful results than simply specifying a single concept of 'Circulatory system', which contains other concepts that may be irrelevent to the present study.\n\n     Furthermore, keep in mind that far-reaching concepts (that contains many branches and sub-branches of concepts), coupled with a large patient set, may overwhelm the server (i2b2 hive) to the point of failure, resulting in no data getting returned at all."
	alert(s);
} // end of SuggestFinerConceptGrainularity()

i2b2.CAREcncptDem.FindPDOChunkTotal = function() {
	var lot, size, count, grps, s0;
	lot = i2b2.CAREcncptDem.qPatCount;
	size = i2b2.CAREcncptDem.options.qChunkSize;
	if (0 == size) {
		i2b2.CAREcncptDem.options.qChunkSize = lot;
		size = lot;
	}
	count = parseInt(lot / size);
	grps = count;
	if (0 < lot % size)	{
		grps += 1;
	}
	i2b2.CAREcncptDem.qChunkTotal = grps;
	if (1 == grps) {
		s0 = "(out of 1 group of {0} each, or a total of {1} patients).";
		$("results-chunks").innerHTML = i2b2.CAREcncptDem.format(s0, size, lot);
	} else {
		s0 = "(out of some {0} subgroups of roughly {1} each, or a total of some {2} patients).";
		$("results-chunks").innerHTML = i2b2.CAREcncptDem.format(s0, grps, size, lot);
	}
} // end of FindPDOChunkTotal()

i2b2.CAREcncptDem.EstimateRemainingTime = function(elapsedTime) {
	var estLastPDOrespTime, estTotalPDOreqTime, estChartTime, t;
	// guesstimating that worst case it takes 2 sec to render each pat, with 10% safety factor
	estChartTime = i2b2.CAREcncptDem.qPatCount * 2.1; 
    if (i2b2.CAREcncptDem.qPatCount != i2b2.CAREcncptDem.options.qChunkSize) {	
		estChartTime /= 100; // guesstimating that best case it takes 2 sec to render 100 pats (or 20 ms per pat)
	}
	if (0 == elapsedTime) {  // i.e. before even the first chunk (subgroup) came back
		t = 110 * Math.random() * i2b2.CAREcncptDem.qChunkTotal + Math.min(estChartTime, 1);
		return i2b2.CAREcncptDem.GetDuration(t);
	} else {
		if (0 < i2b2.CAREcncptDem.qChunkCurrent) {	
			estLastPDOrespTime = elapsedTime / i2b2.CAREcncptDem.qChunkCurrent;    
		} else {
			estLastPDOrespTime = elapsedTime;	
		}
		estTotalPDOreqTime = estLastPDOrespTime * i2b2.CAREcncptDem.qChunkTotal;    
		t = Math.abs(estTotalPDOreqTime + estLastPDOrespTime + estChartTime - elapsedTime);   
		return i2b2.CAREcncptDem.GetDuration(t);
	}
} // end of EstimateRemainingTime()

i2b2.CAREcncptDem.GetCurrentTime = function() {
	var d = new Date();    
	return d.getTime();
} // end of GetCurrentTime()

i2b2.CAREcncptDem.GetElapsedTime = function(refTime) {
	var d = new Date();    
    return Math.max(2, Math.round((d.getTime() - refTime) / 1000));
} // end of GetElapsedTime()

i2b2.CAREcncptDem.GetDuration = function(duration) {
	var s, m, h;
	if (60 > duration) {
		return i2b2.CAREcncptDem.format("{0} sec.", parseInt(duration));
	} else {
		s = parseInt(duration % 60);
		m = parseInt(duration / 60);
		if (60 > m) {
			return i2b2.CAREcncptDem.format("{1} min. {2} sec.", m, s);
		} else {
			h = parseInt(m / 60);
			m = parseInt(m % 60);
			return i2b2.CAREcncptDem.format("{0} hr. {1} min. {2} sec.", h, m, s);
		}
	}
} // end of GetDuration()

i2b2.CAREcncptDem.format = function (str, col) {
    col = typeof col === 'object' ? col : Array.prototype.slice.call(arguments, 1);
    return str.replace(/\{\{|\}\}|\{(\w+)\}/g, function (m, n) {
        if ("{{" == m) { return "{"; }
        if ("}}" == m) { return "}"; }
        return col[n];
    });
} // end of format()

i2b2.CAREcncptDem.ExportCSVdata = function() 
{
	return i2b2.CAREcncptDem.CSVdata;
} // end of ExportCSVdata()

i2b2.CAREcncptDem.ExportXLSdata = function() 
{
	return i2b2.CAREcncptDem.format("<html>\n<head></head>\n<body>\n{0}\n</body>\n</html>", i2b2.CAREcncptDem.XLSdata);
} // end of ExportXLSdata()


