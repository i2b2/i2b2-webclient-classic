/*=========================================================================================================================
 * @projectDescription  CARE (Cohort Analysis & Refinement Expeditor) - Concept Observation Tally Demographics Histograms
 *                       - Generation of histograms of demographic breakdowns for the specified subset of a patient set  
 *                         and additional subsets from that subset that are associated with various observation counts of 
 *                         a selected concept (ontology terms).
 * @inherits            i2b2
 * @namespace           i2b2.CAREobsTally
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
 +                      without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See 
 +                      the GNU General Public License for more details.
 +
 +						You should have received a copy of the GNU General Public License along with this free software.  
 +                      If not, see <http://www.gnu.org/licenses/>.
 + --------------------------------------------------------------------------------------------------------------------------
 * updated history (dateformat: YYYYMMDD) 
 * 20150331 S. Wayne Chan (v.1.0) developed initial version.  
 * 20150511 S. Wayne Chan (v.1.1) added "Export Data" tab & other minor refinements.
 * 20151109 S. Wayne Chan (v.1.2) fixed compatibility issue with the prototype.js v.1.7.2 (ships with webclient v1.7.0.7), 
 *                                & other minor touch-ups.
 * 20151215 S. Wayne Chan (v.1.2) added .SetAccessories() to facilitate moving the Save*.php files, etc. into the local 
 *                                 /asset subfolder; & other minor touch-ups.
 * 20151230 S. Wayne Chan (v.1.2) fixed JIRA issue PLUGINS-10 ('Marital Status' value is always 'undefined').                                
 *=========================================================================================================================
 */

i2b2.CAREobsTally.Init = function(loadedDiv) {
   // register DIV as valid DragDrop target for Patient Record Sets (PRS) & concept objects
	var op_trgt = { dropTarget:true }; 
	i2b2.sdx.Master.AttachType("CAREobsTally-PRSDROP", "PRS", op_trgt);
	i2b2.sdx.Master.AttachType("CAREobsTally-CONCPTDROP", "CONCPT", op_trgt);
   // drop event handlers used by this plugin
	i2b2.sdx.Master.setHandlerCustom("CAREobsTally-PRSDROP", "PRS", "DropHandler", i2b2.CAREobsTally.PrsDropped);
	i2b2.sdx.Master.setHandlerCustom("CAREobsTally-CONCPTDROP", "CONCPT", "DropHandler", i2b2.CAREobsTally.ConceptDropped);
	i2b2.CAREobsTally.Unload();								                // reset & init default settings
   // manage YUI tabs
	this.yuiTabs = new YAHOO.widget.TabView("CAREobsTally-TABS", {activeIndex:0});
	this.yuiTabs.on('activeTabChange', function(ev) {                       //Tabs have changed
		if ("CAREobsTally-TAB2" == ev.newValue.get('id')) {                 // user switched to Results tab
			if (i2b2.CAREobsTally.prsRecord && i2b2.CAREobsTally.concept) { // proceed only if input OK
				if (i2b2.CAREobsTally.runPending) {                         // update results only if input data changed
					i2b2.CAREobsTally.GetReadyForResults();
					i2b2.CAREobsTally.GetResults();
				}
			}
		}
	});
	i2b2.CAREobsTally.FixIEscrollbarProblem();
} // end of Init()

i2b2.CAREobsTally.Unload = function() { // purge old data
	i2b2.CAREobsTally.runPending = true;
	i2b2.CAREobsTally.prsRecord = false;
	i2b2.CAREobsTally.concept = false;
	i2b2.CAREobsTally.patients = [];
	i2b2.CAREobsTally.cncptPats = {};					
	$("CAREobsTally-PatStartNum").hide();				// hide the Pat Set info message if none specified yet
	i2b2.CAREobsTally.qPatCount = 0;  					// count for chunked PDO queries
	i2b2.CAREobsTally.qChunkStart = 0;    				// starting patient # of current chunked PDO queries
	i2b2.CAREobsTally.qChunkEnd = 0;    				// ending patient # of current chunked PDO queries
	i2b2.CAREobsTally.qChunkCurrent = 0;  				// current chunked PDO query #
	i2b2.CAREobsTally.qLastPatNum = 1; 					// pat # of last patient, over all PDO queries (0-based indexing)
	i2b2.CAREobsTally.qChunkTotal = 1; 					// number of patient chunks of PDO queries
	i2b2.CAREobsTally.qMsgCore = "";					// the getPDO query filter list message core
	i2b2.CAREobsTally.options = {};						// user specifiable options
	i2b2.CAREobsTally.options.qChunkSize = 20;			// PDO query chunk size (# of pats each)
	i2b2.CAREobsTally.options.startPatNum = 1;			// starting patient number (of the patient set to be used)
	i2b2.CAREobsTally.options.patCount = 500;			// patient count (of the patient set to be used)
	i2b2.CAREobsTally.tallyInc = 1;					    // increment between consecutive observation tally groups
	i2b2.CAREobsTally.tallyTop = 9;					    // top most obs. tally group (i.e. in this case the group of '> 9'
	i2b2.CAREobsTally.StartTime = 0;
	i2b2.CAREobsTally.TimeMessage = false;				// time usages message at lower right corner of tables
	i2b2.CAREobsTally.CSVhdr = "";			    		// for ExportCSV
	i2b2.CAREobsTally.CSVdata = "";						// for ExportCSV
	i2b2.CAREobsTally.XLSdata = "";						// for ExportXLS
	return true;
} // end of Unload()

i2b2.CAREobsTally.FixIEscrollbarProblem = function() {
	var  mainContentDivs, i, z = $('anaPluginViewFrame').getHeight() - 34;
	mainContentDivs = $$('DIV#CAREobsTally-TABS DIV.CAREobsTally-MainContent');
	for (i = 0; i < mainContentDivs.length; i ++) {
		mainContentDivs[i].style.height = z;
	}
} // end of FixIEscrollbarProblem()

i2b2.CAREobsTally.PrsDropped = function(sdxData) { // Patients Record Set dropped in
	var psSize;
	sdxData = sdxData[0];	                                                             // only interested in first record
	i2b2.CAREobsTally.prsRecord = sdxData;                                         		 // save to local data model
	$("CAREobsTally-PRSDROP").innerHTML = i2b2.h.Escape(sdxData.sdxInfo.sdxDisplayName); // display PS name to show drop OK
	$("CAREobsTally-PRSDROP").style.background = "#CFB"; // momentarily change background color as sign of pending OK drop 
	setTimeout("$('CAREobsTally-PRSDROP').style.background='#DEEBEF'", 250);	
	psSize = i2b2.CAREobsTally.prsRecord.origData.size; 
	$("CAREobsTally-PatSetSize").innerHTML = i2b2.CAREobsTally.GetPatSetSizeAndUsageMsg(psSize);// update display
	$("CAREobsTally-NumberOfPats").value = Math.min(Math.max($("CAREobsTally-NumberOfPats").value, 500), psSize); 
	                                               // since 1+psSize-$("CAREobsTally-StartingPat").value=1+psSize-1=psSize
	$("CAREobsTally-PatStartNum").show();				 // show the Pat Set info msg
	i2b2.CAREobsTally.runPending = true;	    		 // to prevent requerying the hive if the input has not changed
} // end of PrsDropped()

i2b2.CAREobsTally.ConceptDropped = function(sdxData) {
	sdxData = sdxData[0];                                   // Consider first record only 
	if (sdxData.origData.isModifier) {
		alert("Modifier item being dropped in is not supported.");
		return false;	
	}
	i2b2.CAREobsTally.concept = sdxData;                                         		    // save to local data model
	$("CAREobsTally-CONCPTDROP").innerHTML = i2b2.h.Escape(i2b2.h.HideBreak(sdxData.sdxInfo.sdxDisplayName)); // show concpt name (drop OK)
	$("CAREobsTally-CONCPTDROP").style.background = "#CFB"; // momentarily change background color, pending OK drop 
	setTimeout("$('CAREobsTally-CONCPTDROP').style.background='#DEEBEF'", 250);	
	$("CAREobsTally-ConceptHint").style.display = 'none';   // hide the Concept HINT link
	i2b2.CAREobsTally.runPending = true;	    		    // to prevent requerying the hive if the input has not changed
	i2b2.CAREobsTally.CheckUpdateCohortSizeUsageMeg(); // in case user skips to drag-drop concpts after setting startPatNum
} // end of ConceptDropped()

i2b2.CAREobsTally.GetReadyForResults = function() {
	var psSize, numPats, startingPat, targetPatCount;
	i2b2.CAREobsTally.patients = [];
	i2b2.CAREobsTally.cncptPats = {};					
	$("results-server-paging-warning").innerHTML = "";	
	psSize = i2b2.CAREobsTally.prsRecord.origData.size; 
	numPats = i2b2.CAREobsTally.options.patCount;
	startingPat = i2b2.CAREobsTally.options.startPatNum;
	targetPatCount = i2b2.CAREobsTally.FindPatientCountAndEndNum(psSize, numPats, startingPat); // in case values changed 
	i2b2.CAREobsTally.StartTime = i2b2.CAREobsTally.GetCurrentTime();
	i2b2.CAREobsTally.FindPDOChunkTotal();
	i2b2.CAREobsTally.qChunkStart = startingPat;
	i2b2.CAREobsTally.FindPDOChunkUpper();
	i2b2.CAREobsTally.qChunkCurrent = 0;
	$$("DIV#CAREobsTally-mainDiv DIV#CAREobsTally-TABS DIV.results-directions")[0].hide();
	$$("DIV#CAREobsTally-mainDiv DIV#CAREobsTally-TABS DIV.results-finished")[0].hide();
	$$("DIV#CAREobsTally-mainDiv DIV#CAREobsTally-TABS DIV.results-serverFailed")[0].hide();				
	$$("DIV#CAREobsTally-mainDiv DIV#CAREobsTally-TABS DIV.results-working")[0].show();		
	i2b2.CAREobsTally.SetPDOMsgCore();
	i2b2.CAREobsTally.SetAccessories(); // Set up the full relative paths of the accessory files (Save*.php, *.png, *.gif, etc.)
} // end of GetReadyForResults()

i2b2.CAREobsTally.SetAccessories = function() {
	var curWrkPath = i2b2.PLUGINMGR.ctrlr.main.currentPluginCtrlr.cfg.config.assetDir;
	var dot_spr = curWrkPath + "loading.gif";
	var csv_btn = curWrkPath + "exportCSVBtn.png";
	var xls_btn = curWrkPath + "exportHTMLXLSBtn.png";
	var xls_php = curWrkPath + "SaveToHTMLXLS.php?suffix=CARE-obsTally";
	var csv_php = curWrkPath + "SaveToCSV.php?suffix=CARE-obsTally";
	//alert("xls_php='" + xls_php + "'\n\ncsv_php='" + csv_php + "'\n\ndot-spiral='" + dot_spr + "'\ncsv_btn='" + csv_btn + "'\nxls_btn='" + xls_btn + "'");
	$j("#dotSpiral").attr("src", dot_spr);
	$j("#save2csvBtn").attr("src", csv_btn);
	$j("#save2xlsBtn").attr("src", xls_btn);
	$j("#save2csv").attr("action", csv_php);
	$j("#save2xls").attr("action", xls_php);
} // end of SetAccessories()

i2b2.CAREobsTally.GetResults = function() {
    var subGrp = 'Currently busy retrieving patient data for subgroup #{0}', n;
	var scallback = new i2b2_scopedCallback(); // callback processor
	scallback.scope = this;
	scallback.callback = function(results) { return i2b2.CAREobsTally.ProcessResults(results); }
	i2b2.CAREobsTally.qChunkCurrent ++;
    n = Math.min(i2b2.CAREobsTally.qChunkCurrent, i2b2.CAREobsTally.qChunkTotal);	
	$("results-working-progress").innerHTML = i2b2.CAREobsTally.format(subGrp, n); 
		                                            // qChunkCurrent may > qChunkTotal when server itself started paging!
	i2b2.CAREobsTally.UpdateTimeMessage();
   // AJAX CALL USING THE EXISTING CRC CELL COMMUNICATOR
	i2b2.CRC.ajax.getPDO_fromInputList("Plugin:CAREobsTally", {PDO_Request: i2b2.CAREobsTally.GetRequest()}, scallback);
} // end of GetResults()

// THIS function is used to process the AJAX results of the i2b2 RESTful call
//		results data object contains the following attributes:
//			refXML: xmlDomObject <--- for data processing
//			msgRequest: xml (string)
//			msgResponse: xml (string)
//			error: boolean
//			errorStatus: string [only with error=true]
//			errorMsg: string [only with error=true]
i2b2.CAREobsTally.ProcessResults = function(resultData) {
	if (resultData.error) { // handle errors
		$("results-server-paging-warning").innerHTML = "<font color='red'><b>Warning: The server (i2b2 hive) has returned an error <br/>(apparently, it has been overwhelmed by the amount of data requested of it, and had failed)!!</b></font>";
		var t = i2b2.CAREobsTally.GetElapsedTime(i2b2.CAREobsTally.StartTime);
        var msg = '<font color="black" style="normal">Elapsed time: {0}</font>'; 
		$("results-failure-time").innerHTML = 
		i2b2.CAREobsTally.format(msg, i2b2.CAREobsTally.GetDuration(t));
		$$("DIV#CAREobsTally-mainDiv DIV#CAREobsTally-TABS DIV.results-working")[0].hide();
		$$("DIV#CAREobsTally-mainDiv DIV#CAREobsTally-TABS DIV.results-serverFailed")[0].show();		
		console.error("Bad Results from Cell Communicator: ", resultData);
		return false;
	}
	i2b2.CAREobsTally.ProcessXMLResponse(resultData);
	if (i2b2.CAREobsTally.AllChunksQueried()) {
		i2b2.CAREobsTally.runPending = false;		
		$("results-working-progress").innerHTML = "Currently tabulating all data returned by the server (i2b2 hive).";
		i2b2.CAREobsTally.SortPatientsByPatID();
		i2b2.CAREobsTally.ProcessAllData();
	} else {
		i2b2.CAREobsTally.qChunkStart = Math.min(i2b2.CAREobsTally.qChunkEnd + 1, i2b2.CAREobsTally.qLastPatNum);
		i2b2.CAREobsTally.FindPDOChunkUpper();
		i2b2.CAREobsTally.GetResults(); // get the data for the next subgroup of patients
	}
} // end of ProcessResults()
	
i2b2.CAREobsTally.SortPatientsByPatID = function() {
	i2b2.CAREobsTally.patients.sort(function() { return arguments[0]["patient_id"] > arguments[1]["patient_id"] }); 
	return;
} // end of SortPatientsByPatID()

i2b2.CAREobsTally.ProcessAllData = function() {
	var psName, pssSize, s, DemCats, xmlResponse, patInfo, hData, j, i, panelName, curCncptPats, h, g, patId, n, k,
	    dt1, t1, dt2, s2, updateTimeMsg = false;
	if (!i2b2.CAREobsTally.TimeMessage) {
		dt1 = i2b2.CAREobsTally.GetDuration(i2b2.CAREobsTally.GetElapsedTime(i2b2.CAREobsTally.StartTime));
		t1 = i2b2.CAREobsTally.GetCurrentTime();
		updateTimeMsg = true;
	}
	$$("DIV#CAREobsTally-mainDiv DIV#CAREobsTally-TABS DIV.results-working")[0].hide();			
	$$("DIV#CAREobsTally-mainDiv DIV#CAREobsTally-TABS DIV.results-finished")[0].show();
	psName = i2b2.CAREobsTally.prsRecord.sdxInfo.sdxDisplayName;
	pssSize = i2b2.CAREobsTally.patients.length;                    // PS subset (user-specified) size
	s = '<div class="intro">Below are the demographic details for the selected patient set subset, as well as the subsets associated with selected observation counts of the selected concept.<br/><br/>For each demographic category, the values, number of patients, and a histogram are provided.<br/><br/>To change to a different grouping of observation counts, simply click on the <b>"Output Options"</b> tab to make the appropriate selection, and then return to this tab page again to view the new set of histograms (note that since the patient observation data are already fetched, the subsequent turn-around time would be much less than the very first run, provided that the cohort subset and concept are not changed).</div><hr/> <br/><div class="demTables">';
	DemCats = {
		age_in_years_num:'Age (Years)', 
		sex_cd:'Gender',
		race_cd:'Race',
		language_cd:'Language',
		marital_status_cd:'Marital Status',
		religion_cd:'Religion',
		vital_status_cd:'Vital Status (Deceased)'
	};
	i = 0;
	i2b2.CAREobsTally.sumCounts = new Array();
	n = i2b2.CAREobsTally.tallyTop + 2;
	for (panelName in i2b2.CAREobsTally.cncptPats) {
		i2b2.CAREobsTally.TallyObsPats();
		curCncptPats = i2b2.CAREobsTally.cncptPats[panelName];
		for (h = 1; h < n; h += i2b2.CAREobsTally.tallyInc) { 		// skip the unused [0] element
			hData = new Hash();
			for (g = h; g < h + i2b2.CAREobsTally.tallyInc; g ++) { // lump together adjacent tallies per user's choice
				if (undefined == curCncptPats.obsTallies[g]) continue;
				for (k = 0; k < curCncptPats.obsTallies[g].length; k ++) {
					patId = curCncptPats.obsTallies[g][k];
					for (j = 0; j < pssSize; j ++) {
						patInfo = i2b2.CAREobsTally.patients[j];					
						if (patId == patInfo["patient_id"])	{
							i2b2.CAREobsTally.ProcessDemCats(patInfo, DemCats, hData);
							break;
						}
					}
				}
			}
//			i2b2.CAREobsTally.sumCounts[i] = eval("(" + hData.toJSON() + ")"); // convert & save hash to reg obj data model
			i2b2.CAREobsTally.sumCounts[i] = eval("(" + Object.toJSON(hData) + ")"); // convert & save hash to regular obj data model (updated due to latest prototype.js)
			i ++;
		}
	}
	s += i2b2.CAREobsTally.ShowLegend(psName, pssSize, n) + i2b2.CAREobsTally.ShowCharts(DemCats);
	if (updateTimeMsg) {
		dt2 = i2b2.CAREobsTally.GetDuration(i2b2.CAREobsTally.GetElapsedTime(t1));
		s2 = '<div style="text-align:right;"><sup>data fetch time = {0}, tabulation time = {1}</sup></div>'; 
		i2b2.CAREobsTally.TimeMessage = i2b2.CAREobsTally.format(s2, dt1, dt2); // to be reused after any retabulations
	} 
	s += i2b2.CAREobsTally.TimeMessage;
	$$("DIV#CAREobsTally-mainDiv DIV#CAREobsTally-TABS DIV.results-finished")[0].innerHTML = s;
	i2b2.CAREobsTally.runPending = false;   // to ensure requery only when the input data is changed
} // end of ProcessAllData()

i2b2.CAREobsTally.ShowLegend = function(psName, psSize, n) {
	var s, scale, j, panelName, curCncptPats, pop, h, g, dash = (1 == i2b2.CAREobsTally.tallyInc) ? false : true;
	var i = Math.round(n / i2b2.CAREobsTally.tallyInc), sz = new Array(i), label = new Array(i), x, s2; 
	var cs0 = 'COHORTS, POPULATIONS\n{0}\n{1}\n{2}, {3}\n', csv, xls = '', obsGrp = '{0}', delim = ', {0} obs', cs2;	
	var	s0 = '<table style="width:80%">\n<tr><th style="width:75%">COHORTS<br/><small>{0}<br/>{1}</small></th><th>POPULATIONS</th></tr>\n<tr><td style="width:75%"><b>{2}</b></td><td>{3}</td></tr>'; 
	// "width" needed to ensure no wrap for IE only, but OK with Chrome, Safari, FF, Opera, Vivaldi
	s = $("CAREobsTally-PatSetSize").innerHTML, j = s.indexOf("(");
	x = s.substring(0, j), s2 = s.substring(j).replace("using", "selected");	
	csv = i2b2.CAREobsTally.format(cs0, psName, x, s2, psSize);	
	s = i2b2.CAREobsTally.format(s0, psName, x, s2, psSize);
	j = 0;
	s0 = '\n<tr><td style="width:75%">{0}% of selected patients associated with "<b>{1}</b>"</td><td>{2}</td></tr>\n</table><table width="95%">\n<tr><th style="width:75%">COHORTS</th><th colspan="2">POPULATIONS & LEGEND</th></tr>';
						// "width" needed to ensure no wrap for IE only, but OK with Chrome, Safari, FF, Opera, Vivaldi
	cs0 = '{0}% of selected patients associated with "{1}", {2}\n\n\nCOHORTS, POPULATIONS\n';
	s2 = '<tr><td style="width:75%">{0}% of these {6} patients have {1} "<b>{2}</b>" observations</td><td>{3}</td><td class="barTD1"><div class="bar{4}" style="width:{5}px;"></div></td></tr>';	
					    // "width" needed to ensure no wrap for IE only, but OK with Chrome, Safari, FF, Opera, Vivaldi
	cs2 = '{0}% of these {4} patients have {1} "{2}" observations, {3}\n';	
	x = '<tr><td style="width:75%">{0}% of these {4} patients have {1} "<b>{2}</b>" observations</td><td>{3}</td></tr>\n';	
	for (panelName in i2b2.CAREobsTally.cncptPats) {
		curCncptPats = i2b2.CAREobsTally.cncptPats[panelName];
		sz[0] = curCncptPats["patients"].length;
		pop = Math.round(1000 * sz[0] / psSize) / 10;               // round to 1 decimal place
		csv += i2b2.CAREobsTally.format(cs0, pop, curCncptPats["display_name"], sz[0]);
		s += i2b2.CAREobsTally.format(s0, pop, curCncptPats["display_name"], sz[0]);
		xls += s.replace(/<th colspan="2">/g, '<th>').replace(/ & LEGEND/g, '').replace(/table><tabl/g, 'table>\n<br/>\n<tabl');
		scale = 0;
		i = 0;		
		for (h = 1; h < n; h += i2b2.CAREobsTally.tallyInc) {       // skip the unused curCncptPats.obsTallies[0]   
			sz[i] = 0;
			for (g = h; g < h + i2b2.CAREobsTally.tallyInc; g ++) { // lumping together adjacent tallies per user's choice
				if (undefined == curCncptPats.obsTallies[g]) continue;
				sz[i] += curCncptPats.obsTallies[g].length;
			}
			if (sz[i] > scale) scale = sz[i];
			label[i] = (n - 1 > h) ? h + (dash ? " - " + (h + i2b2.CAREobsTally.tallyInc - 1) : "") :
									 i2b2.CAREobsTally.format("over {0}", i2b2.CAREobsTally.tallyTop);
			i ++;			
		}
		scale = 220 / scale;
		for (h = 0; h < i; h ++) {   								// skip the unused curCncptPats.obsTallies[0]   
			pop = Math.round(1000 * sz[h] / psSize) / 10;           // round to 1 decimal place
			s += i2b2.CAREobsTally.format(s2, pop, label[h], curCncptPats["display_name"], sz[h], j, scale * sz[h], psSize);
			csv += i2b2.CAREobsTally.format(cs2, pop, label[h], curCncptPats["display_name"], sz[h], psSize);
			obsGrp += i2b2.CAREobsTally.format(delim, label[h]);
			xls += i2b2.CAREobsTally.format(x, pop, label[h], curCncptPats["display_name"], sz[h], psSize);
			j ++;
		}
	}
	i2b2.CAREobsTally.CSVdata = csv + "\n\n";						// for ExportCSV
	i2b2.CAREobsTally.CSVhdr = obsGrp + "\n";					    // for ExportCSV
	i2b2.CAREobsTally.XLSdata = xls + '</table>';					// for ExportXLS
	$$("DIV#CAREobsTally-mainDiv DIV#CAREobsTally-TABS DIV.export-directions")[0].hide();			
	$$("DIV#CAREobsTally-mainDiv DIV#CAREobsTally-TABS DIV.buttonTable")[0].show();			
	return s + '</table>';
} // end of ShowLegend()

i2b2.CAREobsTally.ShowCharts = function(DemCats) {
	var DemCat, DemCatValues, DemCatValsList, maxVal, i, j, DemCatVal, scale, curCatVal, barCell, barWidth, s = '', 
		demcatTitle = '<div class="demcatTitle">{0}</div><table>', sTr = '<tr>', sTrEnd = '</tr>', sTableEnd = '</table>',
		bc0 = '<td class="barTD0"><div class="bar', bc1 = '<td class="barTD1"><div class="bar',
		lf = ' \n', lf2 = ' \n\n', none = '"no entry"',	s0 = '<tr><th rowspan="{0}">"no entry"</th>', 
		s1 = '<tr><th rowspan="{0}">{1}</th>', s2 = '<td>0</td>{0}{1}" style="width:0px;"></div></td>', 
		s3 = '<td>{0}</td>{1}{2}" style="width:{3}px;"></div></td>', n = i2b2.CAREobsTally.sumCounts.length; 
	var csv = '', delim = ', {0}', delim0 = ', 0';		
	for (DemCat in DemCats) {
		DemCatValues = {};
		DemCatValsList = [];
		maxVal = [];
		for (i = 0; i < n; i ++) {
			maxVal[i] = 0;
			for (DemCatVal in i2b2.CAREobsTally.sumCounts[i][DemCat]) {
				tempVal = i2b2.CAREobsTally.sumCounts[i][DemCat][DemCatVal];
				if (!DemCatValues[DemCatVal]) {
					DemCatValues[DemCatVal] = [0, 0];
					DemCatValsList.push(DemCatVal);
				}
				DemCatValues[DemCatVal][i] = tempVal;
				maxVal[i] = Math.max(maxVal[i], tempVal);
			}	
		}
		scale = 440 / Math.max.apply(Math, maxVal); 
		s += i2b2.CAREobsTally.format(demcatTitle, DemCats[DemCat]);
		csv += i2b2.CAREobsTally.format(i2b2.CAREobsTally.CSVhdr, DemCats[DemCat]);		
		DemCatValsList.sort();
		for (i = 0; i < DemCatValsList.length; i ++) {
			curCatVal = DemCatValsList[i];
			if ('' == curCatVal) {
				s += i2b2.CAREobsTally.format(s0, n);
				csv += none;
			} else {
				s += i2b2.CAREobsTally.format(s1, n, curCatVal);
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
					s += i2b2.CAREobsTally.format(s2, barCell, j);
					csv += delim0;
				} else {
					barWidth = scale * DemCatValues[curCatVal][j];
					s += i2b2.CAREobsTally.format(s3, DemCatValues[curCatVal][j], barCell, j, barWidth);
					csv += i2b2.CAREobsTally.format(delim, DemCatValues[curCatVal][j]);
				}
				s += sTrEnd;
			}
				csv += lf;
		}
		s += sTableEnd;
		csv += lf2;				
	}
	i2b2.CAREobsTally.CSVdata += csv;
	csv += '   \n';													// for ExportXLS
	csv = csv.replace(/, /g, '</td><td>').replace(/ \n \n\n   \n/g, '</td></tr>!!!</table>!!!<br/>!!!');
	csv = csv.replace(/ \n \n\n/g, '</td></tr>!!!</table>!!!<br/>!!!<table>!!!<tr><td>');
	csv = csv.replace(/\n/g, '</td></tr>!!!<tr><td>').replace(/!!!/g, '\n');			
	i2b2.CAREobsTally.XLSdata += i2b2.CAREobsTally.format('\n<br/>\n<table>\n<tr><td>{0}', csv);	
	return s + '</div><br/>';
} // end of ShowCharts()

i2b2.CAREobsTally.ProcessDemCats = function(patInfo, DemCats, hData) {
	var n, t1, t2, DemCat;
	for (DemCat in DemCats) {
		n = patInfo[DemCat];
		t1 = hData.get(DemCat);
		if (!t1) { t1 = new Hash(); }
		t2 = t1.get(n);
		if (!t2) {
			t2 = 1;
		} else {
			t2 ++;
		}
		t1.set(n, t2);
		hData.set(DemCat, t1);
	}
} // end of ProcessDemCats()

i2b2.CAREobsTally.SetPDOMsgCore = function() {
	var i, msgFilter, filterList = '', sp0 = '	              ', sp2 = '\n	    	          ', sp3 = '\n			    ',
	t = i2b2.CAREobsTally.concept.origData.xmlOrig, cdata = {};
	cdata.level = i2b2.h.getXNodeVal(t, "level");
	cdata.key = i2b2.h.getXNodeVal(t, "key");
	cdata.tablename = i2b2.h.getXNodeVal(t, "tablename");
	cdata.dimcode = i2b2.h.getXNodeVal(t, "dimcode");
	cdata.synonym = i2b2.h.getXNodeVal(t, "synonym_cd");
	filterList += i2b2.CAREobsTally.format('{0}<panel name="{1}">{2}<panel_number>0</panel_number>{2}<panel_accuracy_scale>0</panel_accuracy_scale>{2}<invert>0</invert>{2}<item>{3}<hlevel>{4}</hlevel>{3}<item_key>{5}</item_key>{3}<dim_tablename>{6}</dim_tablename>{3}<dim_dimcode>{7}</dim_dimcode>{3}<item_is_synonym>{8}</item_is_synonym>{2}</item>\n{0}</panel>\n', sp0, cdata.key, sp2, sp3, cdata.level, cdata.key, cdata.tablename, cdata.dimcode, cdata.synonym);
    sp0 = '	    	          ', sp2 = '\n	              ', sp3 = '	           ';
	i2b2.CAREobsTally.qMsgCore = i2b2.CAREobsTally.format('{0}<patient_set_coll_id>{1}</patient_set_coll_id>{2}</patient_list>\n{3}</input_list>\n{3}<filter_list>\n{4}{3}</filter_list>\n{3}<output_option>{2}<patient_set select="using_input_list" onlykeys="false"/>{2}<observation_set blob="false" onlykeys="true"/>\n{3}</output_option>\n', sp0, i2b2.CAREobsTally.prsRecord.sdxInfo.sdxKeyValue, sp2, sp3, filterList);
	// just need '<input_list><patient_list min="' + min + '" max="' + max + '">'..
} // end of SetPDOMsgCore()

i2b2.CAREobsTally.GetRequest = function() {
	var	s = '\n	        <input_list>\n	           <patient_list min="{0}" max="{1}">\n{2}';
	s = i2b2.CAREobsTally.format(s, i2b2.CAREobsTally.qChunkStart, i2b2.CAREobsTally.qChunkEnd, i2b2.CAREobsTally.qMsgCore);
	return s;
} // end of GetRequest()

i2b2.CAREobsTally.ProcessXMLResponse = function(resultData) {
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
	i2b2.CAREobsTally.CheckForServerPagedResult(xmlDoc);
	i2b2.CAREobsTally.SavePats(xmlDoc);
	i2b2.CAREobsTally.SaveAllCncptPats(xmlContent);	
} // end of ProcessXMLResponse()

i2b2.CAREobsTally.CheckForServerPagedResult = function(xmlDoc) {	
	var pagingNode = $j(xmlDoc).find('paging_by_patients');
	var firstIndex = pagingNode.find('patients_returned').attr('first_index');
	var lastIndex = pagingNode.find('patients_returned').attr('last_index');
	if (!Object.isUndefined(firstIndex) && !Object.isUndefined(lastIndex)) {
		i2b2.CAREobsTally.qChunkEnd = parseInt(lastIndex);
		$("results-server-paging-warning").innerHTML = "<b>Warning: the server (i2b2 hive) has paged this data query</b><br/> (i.e. replaced it with many smaller queries that it hopes to better manage),<br/><b>this may take longer time to finish!<br/><br/>Next time, please consider reducing the 'Query Page Size' field value (non-zero)<br/>on the 'Specify Data' tab to speed things up.</b>";
	}
} // end of CheckForServerPagedResult()

i2b2.CAREobsTally.SavePats = function(xmlDoc) {	
	$j(xmlDoc).find('patient').each( 
		function() { i2b2.CAREobsTally.SavePatInfo($j(this)) } 
	);
} // end of SavePats()	

i2b2.CAREobsTally.SavePatInfo = function(patientNode) {
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
					v = i2b2.CAREobsTally.format('{0}0 - {1}0 yrs', v, (v + 1)); 
					// the ' yrs' is to prevent '10 - 20' from being converted to '20-Oct' when exported to XLS 
				}
				patInfo[paramName] = v;
			}
		}
	);		
	i2b2.CAREobsTally.patients.push(patInfo);
} // end of SavePatInfo()	

i2b2.CAREobsTally.SaveAllCncptPats = function(xmlContent) {	
	$j(xmlContent).find('ns2\\:observation_set').each( function() { i2b2.CAREobsTally.SaveCurCncptObsPats($j(this)) } );	
} // end of SaveAllCncptPats()	

i2b2.CAREobsTally.SaveCurCncptObsPats = function(cncptObsSetNode) {
    var panelName = cncptObsSetNode.attr('panel_name'), curCncptPats = i2b2.CAREobsTally.cncptPats[panelName], displayName;
	if (Object.isUndefined(curCncptPats)) {
		displayName = i2b2.h.Escape(i2b2.h.HideBreak(i2b2.CAREobsTally.concept.sdxInfo.sdxDisplayName));
		curCncptPats = { "display_name":displayName, "panel_name":panelName, "patients":[], "obsPats":[], "obsTallies":[[]] };
	}
	$j(cncptObsSetNode).find('observation').each( 
		function() { 
			var patId = $j(this).find("patient_id").text();
			if ("@" != patId && "" != patId) { 
				curCncptPats["obsPats"].push(patId); // save only valid patient ID (repeats are important to the tally)
				if (0 > curCncptPats["patients"].indexOf(patId)) {
					curCncptPats["patients"].push(patId); // save only valid, unique patient ID
				}
			}
		} 
	);
	i2b2.CAREobsTally.cncptPats[panelName] = curCncptPats;
} // end of SaveCurCncptObsPats()	

i2b2.CAREobsTally.TallyObsPats = function() {
    var panelName, curCncptPats, curObsPats, obsCounts = {}, j, curObsCount, counts = [[]], pat, overTop;
	for (panelName in i2b2.CAREobsTally.cncptPats) {
		curCncptPats = i2b2.CAREobsTally.cncptPats[panelName];
		curObsPats = curCncptPats.obsPats;
		/*** incompatible with IE (compatible with Chrome, FF, Safari, Opera, & Vivaldi)
		curObsPats.forEach(function(pat) {
			obsCounts[pat] = obsCounts[pat] + 1 || 1;
		});
        */
		for (j = 0; j < curObsPats.length; j ++) {
			pat = curObsPats[j];
			obsCounts[pat] = obsCounts[pat] + 1 || 1;
		}		
		for (j = 1; j < 12; j ++) { // counts[0]=[] already, by default (it is also not used); 12 = max overtop + 1
			counts[j] = [];
		}
		overTop = i2b2.CAREobsTally.tallyTop + 1; // max overtop = 11, for the grouping of '1-5, 6-10, >10'
		for (pat in obsCounts) {
			curObsCount = obsCounts[pat];
			if (i2b2.CAREobsTally.tallyTop < curObsCount) curObsCount = overTop;
			counts[curObsCount].push(pat);
		}
		curCncptPats.obsTallies = counts;
	}
} // end of TallyObsPats()	

i2b2.CAREobsTally.CheckUpdateCohortSizeUsageMeg = function() {
	window.setTimeout( // in case user skips to concepts after just setting PatStartNum and /or NumberOfPats
		function (){ 
			$("CAREobsTally-OutputQueryPageSize").focus(); 
		}, 0
	);
} // end of CheckUpdateCohortSizeUsageMeg()	

i2b2.CAREobsTally.GetPatSetSizeAndUsageMsg = function(psSize) {
	var numPats, startingPat, targetPatCount, s, s0;
	numPats = i2b2.CAREobsTally.options.patCount;
	startingPat = i2b2.CAREobsTally.options.startPatNum;
	targetPatCount = i2b2.CAREobsTally.FindPatientCountAndEndNum(psSize, numPats, startingPat);
	s0 = "contains some {0} patients (using patients #{1} - {2}";
	s = i2b2.CAREobsTally.format(s0, psSize, startingPat, (1 + i2b2.CAREobsTally.qLastPatNum));
	if (psSize > targetPatCount) {
		s += i2b2.CAREobsTally.format("; or just {0} of the set)", targetPatCount);
	} else {
		s += "; or the entire set)";
	}
	return s; 
} // end of GetPatSetSizeAndUsageMsg()	

i2b2.CAREobsTally.FindPatientCountAndEndNum = function(psSize, numPats, startingPat) {
	if (psSize < (startingPat + numPats)) {
		i2b2.CAREobsTally.qPatCount = psSize - startingPat + 1;
		i2b2.CAREobsTally.qLastPatNum = psSize;
	} else {
		i2b2.CAREobsTally.qPatCount = numPats;
		i2b2.CAREobsTally.qLastPatNum = startingPat + i2b2.CAREobsTally.qPatCount - 1;
	}
	i2b2.CAREobsTally.qLastPatNum --; // convert to 0-based indexing
	return i2b2.CAREobsTally.qPatCount;
} // end of FindPatientCountAndEndNum()	

i2b2.CAREobsTally.SetTallyChoice = function(inc, top) {
	i2b2.CAREobsTally.tallyInc = inc;
	i2b2.CAREobsTally.tallyTop = top;
	if (i2b2.CAREobsTally.prsRecord && i2b2.CAREobsTally.concept) { // proceed only if input already OK
		if (!i2b2.CAREobsTally.runPending) {                        // update results only if input data has changed
			i2b2.CAREobsTally.ProcessAllData();
		}
	}
} // end of SetTallyChoice()	

i2b2.CAREobsTally.SetValidValue = function(editField, option) {
	var intValue, psSize, subsetSize, numPatField;
	intValue = parseInt(editField.value);
	if (isNaN(intValue)) {
		alert("Please enter an integer number!");
		editField.value = "0";
	} else if (intValue < 0) {
		alert("Please enter a positive integer number!");
		editField.value = "0";
	} else {
		psSize = i2b2.CAREobsTally.prsRecord.origData.size; 
		subsetSize = psSize - i2b2.CAREobsTally.options["startPatNum"] + 1;
		if ("startPatNum" == option) {
			if (intValue > psSize) {
				alert("'Starting Patient' value out of range!\n\nAutomatically adjusted to 1 instead\n\n");
				intValue = 1;
			}
			subsetSize = psSize - intValue + 1;
			i2b2.CAREobsTally.options["patCount"] = subsetSize;
			numPatField = $("CAREobsTally-NumberOfPats");
			window.setTimeout(
				function (){ 
					numPatField.focus(); 
					numPatField.value = subsetSize;
				}, 0
			);
		} else if ("patCount" == option && intValue > subsetSize) {
			intValue = subsetSize;
			alert(i2b2.CAREobsTally.format("'Number of Patients' value too high!\n\nAutomatically adjusted to {0} instead\n\n", intValue));
		}
		i2b2.CAREobsTally.options[option] = intValue;
		editField.value = intValue;
		if (i2b2.CAREobsTally.concept) {           // PS (pat set) must have been selected when this function is called
			i2b2.CAREobsTally.runPending = true;   // rerun if any setting change while there are PS & concepts in place 
			i2b2.CAREobsTally.TimeMessage = false; // to flush current time usage message 
		}
		if ("startPatNum" == option || "patCount" == option || "qChunkSize" == option) {
			$("CAREobsTally-PatSetSize").innerHTML = i2b2.CAREobsTally.GetPatSetSizeAndUsageMsg(psSize); // update display
		}
	}
} // end of SetValidValue()	

i2b2.CAREobsTally.UpdateTimeMessage = function() {
	var t = i2b2.CAREobsTally.GetElapsedTime(i2b2.CAREobsTally.StartTime), s0 = "estimated remaining run time: {0}";
	$("results-remaining-time").innerHTML = i2b2.CAREobsTally.format(s0, i2b2.CAREobsTally.EstimateRemainingTime(t));
	s0 = "Elapsed time (as of the last completed subgroup): {0}";
	$("results-working-time").innerHTML = i2b2.CAREobsTally.format(s0, i2b2.CAREobsTally.GetDuration(t));
} // end of UpdateTimeMessage()	

i2b2.CAREobsTally.FindPDOChunkUpper = function() {
	var lower = i2b2.CAREobsTally.qChunkStart;
	var upper = i2b2.CAREobsTally.qPatCount; 					// Set upper border by default to # of patients
	var total = i2b2.CAREobsTally.qLastPatNum + 1;
	var chunkSize = i2b2.CAREobsTally.options.qChunkSize;
	if (0 < chunkSize) {
		upper = lower + chunkSize - 1;
		if (upper > total) {
			upper = total;
		}		
	}
	i2b2.CAREobsTally.qChunkEnd = upper;
	return;
} // end of FindPDOChunkUpper()	

i2b2.CAREobsTally.AllChunksQueried = function() {
	if (i2b2.CAREobsTally.qChunkEnd < i2b2.CAREobsTally.qLastPatNum) {
		return false;
	} else {
		return true;	
	}
} // end of AllChunksQueried()	

i2b2.CAREobsTally.ExplainQueryPageSize = function() {
	var s = "About 'Query Subgroup Size':\n\n      Please note that a large query (i.e. a large patient set with many concepts, especially ones consisting many subfolder trees) may overwhelm the server (i2b2 hive), which may fail (where no data can be rendered at all) after considerable delays and timeouts.  To avoid this problem, you may want to set the 'Query Subgroup Size' value.\n\n     Setting the 'Query Subgroup Size' instructs this plugin to temporarily divide up your patient set into subgroups of your specified size, and then iteratively make requests of relevant data for each of these resulting subgroups, and then collate and render the returned data (when all these smaller queries are completed).\n\n     Since each subgroup should be of small enough size, the requests hopefully would not cause the server to fail or hang.\n\n     The ideal 'Query Subgroup Size' value cannot be predicted in general, and strongly depends on the number of observations (related to the total numbers of concepts and their complexities) returned; but values of 20 to 50 may be good.  A higher value may result in faster processing but may also carry higher risk of the server failing (where no data can be rendered at all).\n\n     Incidentally, setting a value of 0 instructs this plugin not to divide up the original query into smaller queries (and carries the risk of overwhelming and failing the server, as well as practivally no 'Elapsed time' and 'estimated remaining run time' updates)."
	alert(s);
} // end of ExplainQueryPageSize()	

i2b2.CAREobsTally.ExplainStartingAndNumberOfPatients = function() {
	var s = "About 'Starting Patient' and 'Number of Patients':\n\n     If your patient set contains thousands of patients, you may want to use just a subset of that.  By so doing, you will speed up your query as well as reduce the likelihood of overwhelming the server (i2b2 hive) to the point of failure (and no result).\n\n     Also, if you already encountered a server failure (overwhelmed by the combination of large number of patients times lots of concepts), then you may like to rerun this plugin several times. each time specifying different 'Starting Patient' and 'Number of Patients'.\n\n     For instance, use 1 and 500, respectively, in your first run; follow with 501 and 500, respectively, in your second run; then 1001 and 500, respectively, in your third run; and so on, until you get enough data.\n\n     The example above should also show that the 'Starting Patient' and 'Number of Patients' refer to the patient entry order in the patient set only, which has no bearing on the actual patient IDs.\n\n     In addition, if the sum of the 'Starting Patient' and the 'Number of Patients' values exceeds the total patient count, then it'll be adjusted to the remaining patient count accordingly."
	alert(s);
} // end of ExplainStartingAndNumberOfPatients()	

i2b2.CAREobsTally.SuggestFinerConceptGrainularity = function() {
	var s = "'Concept' hint (suggestion):\n\n     For best results, select finer-grained concepts that may not be related to multiple non-exclusive observations in patients.\n\n       For example, while a patient set may be for 'Circulatory system', selecting several finer concepts like 'Hypertensive disease', 'Ischemic heart disease', and 'arterial vascular disease', etc., that are pertinent to the interest at hand, would result in more meaningful results than simply specifying a single concept of 'Circulatory system', which contains other concepts that may be irrelevent to the present study.\n\n     Furthermore, keep in mind that far-reaching concepts (that contains many branches and sub-branches of concepts), coupled with a large patient set, may overwhelm the server (i2b2 hive) to the point of failure, resulting in no data getting returned at all."
	alert(s);
} // end of SuggestFinerConceptGrainularity()

i2b2.CAREobsTally.FindPDOChunkTotal = function() {
	var lot, size, count, grps, s0;
	lot = i2b2.CAREobsTally.qPatCount;
	size = i2b2.CAREobsTally.options.qChunkSize;
	if (0 == size) {
		i2b2.CAREobsTally.options.qChunkSize = lot;
		size = lot;
	}
	count = parseInt(lot / size);
	grps = count;
	if (0 < lot % size)	{
		grps += 1;
	}
	i2b2.CAREobsTally.qChunkTotal = grps;
	if (1 == grps) {
		s0 = "(out of 1 group of {0} each, or a total of {1} patients).";
		$("results-chunks").innerHTML = i2b2.CAREobsTally.format(s0, size, lot);
	} else {
		s0 = "(out of some {0} subgroups of roughly {1} each, or a total of some {2} patients).";
		$("results-chunks").innerHTML = i2b2.CAREobsTally.format(s0, grps, size, lot);
	}
} // end of FindPDOChunkTotal()

i2b2.CAREobsTally.EstimateRemainingTime = function(elapsedTime) {
	var estLastPDOrespTime, estTotalPDOreqTime, estChartTime;
	estChartTime = i2b2.CAREobsTally.qPatCount * 2.1; // guesstimating that worst case it takes 2 sec to render each pat, 
													  // with 10% safety factor
    if (i2b2.CAREobsTally.qPatCount != i2b2.CAREobsTally.options.qChunkSize) {	
		estChartTime /= 100; // guesstimating that best case it takes 2 sec to render 100 pats (or 20 ms per pat)
	}
	if (0 == elapsedTime) {  // i.e. before even the first chunk (subgroup) came back
		return i2b2.CAREobsTally.GetDuration(110 * Math.random() * i2b2.CAREobsTally.qChunkTotal + Math.min(estChartTime, 1));
	} else {
		if (0 < i2b2.CAREobsTally.qChunkCurrent) {	
			estLastPDOrespTime = elapsedTime / i2b2.CAREobsTally.qChunkCurrent;    
		} else {
			estLastPDOrespTime = elapsedTime;	
		}
		estTotalPDOreqTime = estLastPDOrespTime * i2b2.CAREobsTally.qChunkTotal;    
		return i2b2.CAREobsTally.GetDuration(Math.abs(estTotalPDOreqTime + estLastPDOrespTime + estChartTime - elapsedTime));
	}
} // end of EstimateRemainingTime()

i2b2.CAREobsTally.GetCurrentTime = function() {
	var d = new Date();    
	return d.getTime();
} // end of GetCurrentTime()

i2b2.CAREobsTally.GetElapsedTime = function(refTime) {
	var d = new Date();    
    return Math.max(2, Math.round((d.getTime() - refTime) / 1000));
} // end of GetElapsedTime()

i2b2.CAREobsTally.GetDuration = function(duration) {
	var s, m, h;
	if (60 > duration) {
		return i2b2.CAREobsTally.format("{0} sec.", parseInt(duration));
	} else {
		s = parseInt(duration % 60);
		m = parseInt(duration / 60);
		if (60 > m) {
			return i2b2.CAREobsTally.format("{1} min. {2} sec.", m, s);
		} else {
			h = parseInt(m / 60);
			m = parseInt(m % 60);
			return i2b2.CAREobsTally.format("{0} hr. {1} min. {2} sec.", h, m, s);
		}
	}
} // end of GetDuration()

i2b2.CAREobsTally.format = function (str, col) {
    col = typeof col === 'object' ? col : Array.prototype.slice.call(arguments, 1);
    return str.replace(/\{\{|\}\}|\{(\w+)\}/g, function (m, n) {
        if ("{{" == m) { return "{"; }
        if ("}}" == m) { return "}"; }
        return col[n];
    });
} // end of format()

i2b2.CAREobsTally.ExportCSVdata = function() 
{
	return i2b2.CAREobsTally.CSVdata;
} // end of ExportCSVdata()

i2b2.CAREobsTally.ExportXLSdata = function() 
{
	return i2b2.CAREobsTally.format("<html>\n<head></head>\n<body>\n{0}\n</body>\n</html>", i2b2.CAREobsTally.XLSdata);
} // end of ExportXLSdata()

