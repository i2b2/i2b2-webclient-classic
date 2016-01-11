/*====================================================================================================================
 * @projectDescription	Workplace Items Sharing Enhancement - Searcher 
 *                                     (Tool for finding & listing all items in the Workplace that contain specified search terms in their annotations or names).
 * @inherits		        i2b2
 * @namespace		i2b2.WISEsearcher
 * @author		        S. Wayne Chan, 
 *                                     Biomedical Research Informatics Development Group (BRIDG) and Biomedical Research Informatics Consulting & Knowledge Service (BRICKS),
 *                                     Div. of Health Informatics and Implementation Science (HIIS), Dept. of Quantitative Health Sciences (QHS), 
 *                                     University of Massachusetts Medical School (UMMS), Worcester, MA
 *                                     wayne.chan@umassmed.edu
 * @version 		        1.1 (for i2b2 v1.3 - v1.6.0.2)
 * @acknowledgement   This module leveraged off 
 *                                      - the general construct / format /style  / template used in the i2b2 web client plugin examples by N. Benik & G. Weber 
 *                                      - the XLS export feature of the ExportXLS plugin by M. Bucalo, Universita' di Pavia
 * ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 * @copyright		       Copyright 2011, 2012  University of Massachusetts Medical School.
 * @license/disclaimer   This file is part of the WISE-Searcher plugin for i2b2 webclient.
 *                        
 *		        WISE-Searcher plugin for i2b2 webclient is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the
 *   			Free Software Foundation , either version 3 of the License, or (at your option) any later version.
 *
 *			WISE-Searcher plugin for the i2b2 webclient is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
 *		        MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.
 *
 *		        You should have received a copy of the GNU General Public License along with WISE-Searcher plugin for the i2b2 webclient.  If not, see <http://www.gnu.org/licenses/>.
 * ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 * updated history (dateformat: YYYYMMDD) 
 * 20110812 S. Wayne Chan (v.1.0) Developed initial version.
 * 20110916 S. Wayne Chan (v.1.0) updated .matchAllSearch() to only have match in either annotation or name iff all terms match in each.
 *				  updated .Init() & .Unload() to fix bug that option always defaulted to "at least one" when user only changes terms but leaves option as "all".
 * 20111028 S. Wayne Chan (v.1.0) added “copyright” & “license/disclaimer” sections in header following UMMS legal signoff.
 * 20120111 S. Wayne Chan (v.1.1) added "Case option" support.
 * 20120113 S. Wayne Chan (v.1.1) added "export to csv" support for Chrome, Firefox, and Safari.
 * 20120117 S. Wayne Chan (v.1.1) added "export to csv" support for Internet Explorer.
 * 20120118 S. Wayne Chan (v.1.1) added "Exclude terms" support.
 * 20120312 S. Wayne Chan (v.1.1) fixed unscrollable (effectively cutoff) panel display problem on IE against i2b2 webclient v1.6.0.2 (based on v1.6.0.2 Dem1Set_ctlr.js)
 * 20151215 S. W. Chan  (v.1.1.1) added .SetupSaveData2LocalPhps() to facilitate moving the Save*.php files into the local /asset subfolder
 *====================================================================================================================
 */


// -------------------------------------------------------------------------------------------------------------------
// This method initialize this plugin
// -------------------------------------------------------------------------------------------------------------------
i2b2.WISEsearcher.Init = function(loadedDiv) {
    // initiate all model data
    i2b2.WISEsearcher.Unload();
    i2b2.WISEsearcher.model.allTerms = "";
    i2b2.WISEsearcher.model.sameMatch = true;   // no change in Match option
    i2b2.WISEsearcher.model.match = "1";        // default: match at least 1
    i2b2.WISEsearcher.model.sameCase = true;    // no change in Case option
    i2b2.WISEsearcher.model.Case = "o";         // default: observe (case-sensitive)
    i2b2.WISEsearcher.model.sameExclude = true; // no change in Exclude option
    i2b2.WISEsearcher.model.exclude = "1";      // default: exclude if item contains at least 1
    i2b2.WISEsearcher.model.allExcludes = "";

    // manage YUI tabs
    this.yuiTabs = new YAHOO.widget.TabView("WISEsearcher-TABS", {activeIndex:0});
    this.yuiTabs.on('activeTabChange', function(ev) { 
	//Tabs have changed 
        if (ev.newValue.get('id')=="WISEsearcher-TAB0") {
            // defer call to .doDrop()
	    i2b2.WISEsearcher.Unload();
        } else if (ev.newValue.get('id')=="WISEsearcher-TAB1") {
                //i2b2.WISEsearcher.testing();
	        //i2b2.h.LoadingMask.show(); // turn on the "LOADING" mask (i2b2 Query Tool "busy, please wait" display)
	        i2b2.WISEsearcher.proceed();
                //i2b2.h.LoadingMask.hide(); // turn off the "LOADING" mask
        } else /* if (ev.newValue.get('id')=="WISEsearcher-TAB2") */ {
                // nothing extra needed            
        }
    });
	
   ///swc20120312{ fix unscrollable (effectively cutoff) panel display problem on IE against i2b2 webclient v1.6.0.2 (based on v1.6.0.2 Dem1Set_ctlr.js)
    z = $('anaPluginViewFrame').getHeight() - 34;
    $$('DIV#WISEsearcher-TABS DIV.WISEsearcher-MainContent')[0].style.height = z;
    $$('DIV#WISEsearcher-TABS DIV.WISEsearcher-MainContent')[1].style.height = z;
    $$('DIV#WISEsearcher-TABS DIV.WISEsearcher-MainContent')[2].style.height = z;
   ///}
};


// -------------------------------------------------------------------------------------------------------------------
// this function is called when the plugin is loaded / unloaded by the framework
// -------------------------------------------------------------------------------------------------------------------
i2b2.WISEsearcher.Unload = function() {
    //alert("entered .Unload()");
    var excludeTerms = $$("DIV#WISEsearcher-mainDiv DIV#WISEsearcher-excludeTerms")[0];
    excludeTerms.select('textarea')[0].style.background = "#FFDDDD"; // change it to a shade of red / pink

    // initiate data / purge old data ----------

    // general / misc.
    i2b2.WISEsearcher.model.excludes = [];
    i2b2.WISEsearcher.model.terms = [];
    //i2b2.WISEsearcher.model.match = "1";
    i2b2.WISEsearcher.model.limbsPending = 0;

    // Workplace folders data -- for determining the paths of items
    i2b2.WISEsearcher.model.WFnames = [];
    i2b2.WISEsearcher.model.WFindices = [];
    i2b2.WISEsearcher.model.WFpaths = [];

    // Workplace item data
    i2b2.WISEsearcher.model.WIorigNames = [];
    i2b2.WISEsearcher.model.WInames = [];
    i2b2.WISEsearcher.model.WIicons = [];
    i2b2.WISEsearcher.model.WItypes = [];
    i2b2.WISEsearcher.model.WIindices = [];
    i2b2.WISEsearcher.model.WIpaths = [];
    i2b2.WISEsearcher.model.WIanns = [];
    i2b2.WISEsearcher.model.WIorigAnns = [];

    // result rows
    i2b2.WISEsearcher.model.rowIcons = [];
    i2b2.WISEsearcher.model.rowPaths = []; // for sorting the rows in ascending order of path & name
    i2b2.WISEsearcher.model.rows = [];
    i2b2.WISEsearcher.model.rowsCsv = [];
    i2b2.WISEsearcher.model.csv = "";

    //alert("exited .Unload()");
    return true;
};


// -------------------------------------------------------------------------------------------------------------------
// for debug only (not used in production)
// -------------------------------------------------------------------------------------------------------------------
i2b2.WISEsearcher.testing = function() {
var a = $$("DIV#WISEsearcher-mainDiv DIV#WISEsearcher-searchTerms")[0];
var b = Element.select(a, 'TEXTAREA')[0].value;
var c = Element.select(a, 'TEXTAREA')[0].value;
var d = a.select('textarea')[0].value;
var e = a.select('TEXTAREA')[0].value; // or a.select('textarea')[0].value; or Element.select(a, 'TEXTAREA')[0].value; or Element.select(a, 'textarea')[0].value;
alert("b="+b+"\nc="+c+"\nd="+d+"\ne="+e+"\n\nmatch="+i2b2.WISEsearcher.model.match);
};


// -------------------------------------------------------------------------------------------------------------------
// this method handles the change in the "Match option" radio button group following the clicking of any of its radio 
// buttons
// -------------------------------------------------------------------------------------------------------------------
i2b2.WISEsearcher.matchChanged = function(val) {
    i2b2.WISEsearcher.model.sameMatch = false;
    i2b2.WISEsearcher.model.match = val;
    //alert("exiting .matchChanged()--\n\sameMatch="+i2b2.WISEsearcher.model.sameMatch+"\nmatch="+i2b2.WISEsearcher.model.match);
};


// -------------------------------------------------------------------------------------------------------------------
// this method handles the change in the "Case option" radio button group following the clicking of any of its radio 
// buttons
// -------------------------------------------------------------------------------------------------------------------
i2b2.WISEsearcher.caseChanged = function(val) {
    i2b2.WISEsearcher.model.sameCase = false;
    i2b2.WISEsearcher.model.Case = val;
    //alert("exiting .caseChanged()--\n\sameCase="+i2b2.WISEsearcher.model.sameCase+"\ncase="+i2b2.WISEsearcher.model.case);
};


// -------------------------------------------------------------------------------------------------------------------
// this method handles the change in the "Exclude option" radio button group following the clicking of any of its radio 
// buttons
// -------------------------------------------------------------------------------------------------------------------
i2b2.WISEsearcher.excludeChanged = function(val) {
    i2b2.WISEsearcher.model.sameExclude = false;
    i2b2.WISEsearcher.model.exclude = val;
    //alert("exiting .excludeChanged()--\n\sameExclude="+i2b2.WISEsearcher.model.sameExclude+"\nexclude="+i2b2.WISEsearcher.model.exclude);
};


// -------------------------------------------------------------------------------------------------------------------
// This method returns a non-null string with both leading & trailing blanks trimmed off
// -------------------------------------------------------------------------------------------------------------------
i2b2.WISEsearcher.trim = function(str) {
    if (!str) { 
        return ""; 
    } else {
	return str.replace(/^\s+/,"").replace(/\s+$/,""); // trim off any leading & trailing spaces
    }
};


// -------------------------------------------------------------------------------------------------------------------
// This method starts processing the search:
//  1) seaparate the search terms;
//  2) call .searchRoots() to eventually get all the Workplace Items
// -------------------------------------------------------------------------------------------------------------------
i2b2.WISEsearcher.proceed = function() {
    var searchTerms = $$("DIV#WISEsearcher-mainDiv DIV#WISEsearcher-searchTerms")[0];
    var allTerms = i2b2.WISEsearcher.trim(searchTerms.select('TEXTAREA')[0].value);
    //alert("entered .proceed(),\n with allTerms="+allTerms);
    if ("" == allTerms) {
        $$("DIV#WISEsearcher-mainDiv DIV#WISEsearcher-TABS DIV.results-directions")[0].show();
        $$("DIV#WISEsearcher-mainDiv DIV#WISEsearcher-TABS DIV.results-finished")[0].hide();
        return;
    }

    var excludeTerms = $$("DIV#WISEsearcher-mainDiv DIV#WISEsearcher-excludeTerms")[0];
    var allExcludes = i2b2.WISEsearcher.trim(excludeTerms.select('TEXTAREA')[0].value);
    //alert("entered .proceed(),\n with allExcludes="+allExcludes);
    //it's OK to have no excludes --
    //if ("" == allExcludes) {
    //    $$("DIV#WISEsearcher-mainDiv DIV#WISEsearcher-TABS DIV.results-directions")[0].show();
    //    $$("DIV#WISEsearcher-mainDiv DIV#WISEsearcher-TABS DIV.results-finished")[0].hide();
    //    return;
    //}

    //alert(".sameCase="+i2b2.WISEsearcher.model.sameCase+"\n.sameMatch="+i2b2.WISEsearcher.model.sameMatch+
    //      "\n\nallTerms="+allTerms+"\ni2b2.WISEsearcher.model.allTerms="+i2b2.WISEsearcher.model.allTerms+
    //      "\n\n.sameExclude="+i2b2.WISEsearcher.model.sameExclude+"\n\nallExcludes="+allExcludes+"\ni2b2.WISEsearcher.model.allExcludes="+i2b2.WISEsearcher.model.allExcludes);
    if (i2b2.WISEsearcher.model.sameCase && i2b2.WISEsearcher.model.sameMatch && allTerms == i2b2.WISEsearcher.model.allTerms && 
        i2b2.WISEsearcher.model.sameExclude && allExcludes == i2b2.WISEsearcher.model.allExcludes) {
	return; // quit if there isn't any change
    }

    // save settings for next check
    $$("DIV#WISEsearcher-mainDiv DIV#WISEsearcher-TABS DIV.results-directions")[0].hide();
    i2b2.WISEsearcher.model.sameMatch = true; // toggle it
    i2b2.WISEsearcher.model.sameCase = true;   // toggle it
    i2b2.WISEsearcher.model.sameExclude = true; // toggle it
    i2b2.h.LoadingMask.show(); // turn on the "LOADING" mask (i2b2 Query Tool "busy, please wait" display)
    i2b2.WISEsearcher.model.allTerms = allTerms;
    var terms = allTerms.split(","); // separate out each of the terms
    var s;
    var n = 0; // count of unique terms
    var unique = true;

    for (var i = 0; i < terms.length; i ++) {
        s = i2b2.WISEsearcher.trim(terms[i]);
	if ("i" == i2b2.WISEsearcher.model.Case) {
            s = s.toLowerCase();
	}
	// discard / ignore any redundant (duplicate) terms
	unique = true;
	for (var j = 0; j < n; j ++) {
	    if (s == i2b2.WISEsearcher.model.terms[j]) {
	        unique = false;
	  	break;
	    }
	} 
	if (unique && s != "") {
	    i2b2.WISEsearcher.model.terms[n] = s;
	    n ++;
	}
    }
    //alert("allTerms='" + allTerms + "'\n# of unique terms: " + i2b2.WISEsearcher.model.terms.length + " (" + n + ")");

    i2b2.WISEsearcher.model.allExcludes = allExcludes;
    var excludes = allExcludes.split(","); // separate out each of the excludes
    n = 0;
    for (var i = 0; i < excludes.length; i ++) {
        s = i2b2.WISEsearcher.trim(excludes[i]);
	if ("i" == i2b2.WISEsearcher.model.Case) {
            s = s.toLowerCase();
	}
	// discard / ignore any redundant (duplicate) terms
	unique = true;
	for (var j = 0; j < n; j ++) {
	    if (s == i2b2.WISEsearcher.model.excludes[j]) {
	        unique = false;
	  	break;
	    }
	} 
	if (unique && s != "") {
	    i2b2.WISEsearcher.model.excludes[n] = s;
	    n ++;
	}
    }
    //alert("allExcludes='" + allExcludes + "'\n# of unique excludes: " + i2b2.WISEsearcher.model.excludes.length + " (" + n + ")");

    i2b2.WISEsearcher.climbTrunks();  
};


// -------------------------------------------------------------------------------------------------------------------
// This method starts with the root nodes to find & climb the trunks
// -------------------------------------------------------------------------------------------------------------------
i2b2.WISEsearcher.climbTrunks = function() {      
    //alert("entered .climbTrunks()");
    var scopedCallback = new i2b2_scopedCallback();
    scopedCallback.scope = i2b2.WORK;

    scopedCallback.callback = function(results){
        //alert("entered .climbTrunks.callback()");
	i2b2.WORK.view.main.queryResponse = results.msgResponse;
	i2b2.WORK.view.main.queryRequest = results.msgRequest;
        var trunks = [];
        var n = i2b2.WISEsearcher.model.WFindices.length;
        var nlst = i2b2.h.XPath(results.refXML, "//folder[name and index]");
        for (var i = 0; i < nlst.length; i++) {
            trunks[trunks.length] = nlst[i];
            i2b2.WISEsearcher.model.limbsPending ++;

            // just save the names & indices of the root nodes (for determining the paths of their descendents), not annotations (as they cannot have annotation for searching), etc.
            //i2b2.WISEsearcher.model.WFs[n] = nlst[i];
	    i2b2.WISEsearcher.model.WFnames[n] = i2b2.WISEsearcher.trim(i2b2.h.getXNodeVal(nlst[i], "name"));
	    i2b2.WISEsearcher.model.WFindices[n] = i2b2.WISEsearcher.isolateIndex(i2b2.WISEsearcher.trim(i2b2.h.getXNodeVal(nlst[i], "index")));
	    i2b2.WISEsearcher.model.WFpaths[n] = "/ ";

	    n ++;
        }

        i2b2.WISEsearcher.climbBranches(trunks);
        //alert("exiting .climbTrunks.callback()--\n\n root-count=" + i2b2.WISEsearcher.model.WFindices.length + "\n trunks.length=" + trunks.length);
    };

    i2b2.WORK.ajax.getFoldersByUserId("WORK:Workplace", {}, scopedCallback); // ajax communicator call
    //alert("exiting .climbTrunks()");
};


// -------------------------------------------------------------------------------------------------------------------
// This method removes the "\\userName\" part from the index of a Workplace item
// -------------------------------------------------------------------------------------------------------------------
i2b2.WISEsearcher.isolateIndex = function(s) {
    var p = 1 + s.lastIndexOf("\\");
    var t = s.substr(p);
    //alert("exiting .isolateIndex()--\n\ns="+s+"\n\np="+p+"\nt="+t);
    return t;
};


// -------------------------------------------------------------------------------------------------------------------
// This method climbs the tree branches for more sub-branches (it could be called recursively to exhaust the branches)
// -------------------------------------------------------------------------------------------------------------------
i2b2.WISEsearcher.climbBranches = function(branches) {
    //alert("entered .climbBranches():\n\nbranches.length=" + branches.length);
    var i = 0;
    var scopedCallback = new i2b2_scopedCallback();
    scopedCallback.scope = i2b2.WORK;

    scopedCallback.callback = function(results){
        //alert("entered .climbBranches.callback()");
        i2b2.WORK.view.main.queryResponse = results.msgResponse;
	i2b2.WORK.view.main.queryRequest = results.msgRequest;
	var type;
        var k = i2b2.WISEsearcher.model.WIindices.length;
	var m;
        var twigs = [];
        var nlst = i2b2.h.XPath(results.refXML, "//folder[name and work_xml_i2b2_type and index and parent_index]"); 
                                                 // can't include tooltip in the call above, otherwise it'll won't return anything w/o tooltip
        for (var j = 0; j < nlst.length; j ++) {  
//	    i2b2.WISEsearcher.model.WIorigNames[k] = i2b2.WISEsearcher.trim(i2b2.h.getXNodeVal(nlst[j], "name"));
	    i2b2.WISEsearcher.model.WIorigNames[k] = i2b2.WISEsearcher.trim(i2b2.h.getXNodeValNoKids(nlst[j], "name"));
	    i2b2.WISEsearcher.model.WIorigAnns[k] = i2b2.WISEsearcher.trim(i2b2.h.getXNodeVal(nlst[j], "tooltip"));
	    if ("o" == i2b2.WISEsearcher.model.Case) {
            	i2b2.WISEsearcher.model.WIanns[k] = i2b2.WISEsearcher.model.WIorigAnns[k];
		i2b2.WISEsearcher.model.WInames[k] = i2b2.WISEsearcher.model.WIorigNames[k];
	    } else { // "i"
            	i2b2.WISEsearcher.model.WIanns[k] = i2b2.WISEsearcher.model.WIorigAnns[k].toLowerCase();
		i2b2.WISEsearcher.model.WInames[k] = i2b2.WISEsearcher.model.WIorigNames[k].toLowerCase();
	    }
            i2b2.WISEsearcher.model.WItypes[k] = i2b2.WISEsearcher.translateType(i2b2.WISEsearcher.trim(i2b2.h.getXNodeVal(nlst[j], "work_xml_i2b2_type")), k);
	    i2b2.WISEsearcher.model.WIindices[k] = i2b2.WISEsearcher.isolateIndex(i2b2.WISEsearcher.trim(i2b2.h.getXNodeVal(nlst[j], "index")));
	    i2b2.WISEsearcher.model.WIpaths[k] = i2b2.WISEsearcher.findPath(i2b2.WISEsearcher.trim(i2b2.h.getXNodeVal(nlst[j], "parent_index")));

	    type = String(i2b2.h.getXNodeVal(nlst[j], "visual_attributes")).strip();
            if ("FA" == type) {
                twigs[twigs.length] = nlst[j];
                i2b2.WISEsearcher.model.limbsPending ++;
		m = i2b2.WISEsearcher.model.WFindices.length;
	        i2b2.WISEsearcher.model.WFnames[m] = i2b2.WISEsearcher.model.WInames[k];
	        i2b2.WISEsearcher.model.WFindices[m] = i2b2.WISEsearcher.model.WIindices[k];
	        i2b2.WISEsearcher.model.WFpaths[m] = i2b2.WISEsearcher.model.WIpaths[k];
            }

            k ++;
        }
        //alert(".climbBranches.callback()--\n\n item-count="+i2b2.WISEsearcher.model.WIindices.length + "\n twigs.length=" + twigs.length);

	i2b2.WISEsearcher.model.limbsPending --;

        if (0 < twigs.length) {
            i2b2.WISEsearcher.climbBranches(twigs);
        } else {
            //alert(".climbBranches.callback()--\n\nNo more twigs to climb in current branch!");
            if (0 >= i2b2.WISEsearcher.model.limbsPending) {
                //alert(".climbBranches.callback()--\n\nclimbed all limbs!\n\nstarting searching terms against all "+i2b2.WISEsearcher.model.WIindices.length+" Workplace items.");
                if ("1" == i2b2.WISEsearcher.model.match) {
	      	    i2b2.WISEsearcher.matchOneSearch(); 
		} else {
	      	    i2b2.WISEsearcher.matchAllSearch(); 
		}
            }
        }

        //alert("exiting .climbBranches.callback()");
    };

    var varInput = {};
    var index;
    for (var i = 0; i < branches.length; i ++) {
        index = i2b2.h.getXNodeVal(branches[i], "index");       
        varInput = {parent_key_value: index, result_wait_time: 180};
        i2b2.WORK.ajax.getChildren("WORK:Workplace", varInput, scopedCallback); // ajax communicator call
    }
    //alert("exiting .climbBranches()");
};


// -------------------------------------------------------------------------------------------------------------------
// This method translates the type code into appropriate description
// -------------------------------------------------------------------------------------------------------------------
i2b2.WISEsearcher.translateType = function(code, i) {
    if ("PREV_QUERY" == code) {
        i2b2.WISEsearcher.model.WIicons[i] = "<img src='js-i2b2/cells/CRC/assets/sdx_CRC_QM.gif' alt=''>";
        return "query";
    } else if ("PATIENT_COLL" == code) {
        i2b2.WISEsearcher.model.WIicons[i] = "<img src='js-i2b2/cells/CRC/assets/sdx_CRC_PRS.gif' alt=''>";
        return "patient set";
    } else if ("FOLDER" == code) {
        i2b2.WISEsearcher.model.WIicons[i] = "<img src='js-i2b2/cells/WORK/assets/WORK_folder.gif' alt=''>";
        return "folder";
    } else if ("PATIENT" == code) {
        i2b2.WISEsearcher.model.WIicons[i] = "<img src='js-i2b2/cells/CRC/assets/sdx_CRC_PR.jpg' alt=''>";
        return "patient";
    } else if ("CONCEPT" == code) {
        i2b2.WISEsearcher.model.WIicons[i] = "<img src='js-i2b2/cells/ONT/assets/sdx_ONT_CONCPT_leaf.gif' alt=''>";
        return "concept";
    } else if ("PATIENT_COUNT_XML" == code) {
        i2b2.WISEsearcher.model.WIicons[i] = "<img src='js-i2b2/cells/CRC/assets/sdx_CRC_PRC.jpg' alt=''>";
        return "patient count";
    } else if ("QUERY_DEFINITION" == code) {
        i2b2.WISEsearcher.model.WIicons[i] = "<img src='js-i2b2/cells/CRC/assets/sdx_CRC_QDEF.jpg' alt=''>";
        return "query definition";
    } else if ("GROUP_TEMPLATE" == code) {
        i2b2.WISEsearcher.model.WIicons[i] = "<img src='js-i2b2/cells/CRC/assets/sdx_CRC_QGDEF.jpg' alt=''>";
        return "group template";
    } else {
        i2b2.WISEsearcher.model.WIicons[i] = "";
        return code;
    }
};


// -------------------------------------------------------------------------------------------------------------------
// This method finds the path of a Workplace item
// -------------------------------------------------------------------------------------------------------------------
i2b2.WISEsearcher.findPath = function(s) {
    var path = " / ";
    for (var i = 0; i < i2b2.WISEsearcher.model.WFindices.length; i ++) {
    //alert(".findPath()--\n\ns="+s+"\ni2b2.WISEsearcher.model.WFindices["+i+"]="+i2b2.WISEsearcher.model.WFindices[i]);
	if (s == i2b2.WISEsearcher.model.WFindices[i]) {
	    path = i2b2.WISEsearcher.model.WFpaths[i] + i2b2.WISEsearcher.model.WFnames[i] + path;
        } 
    }
    //alert("exiting .findPath()--\n\ns="+s+"\npath="+path);
    return path;
};


// -------------------------------------------------------------------------------------------------------------------
// This method determines if a code is for folder or not
// -------------------------------------------------------------------------------------------------------------------
i2b2.WISEsearcher.isFolder = function(code) {
    if ("FA" == code) {
        return true;
    } else {
        return false;
    }
};


// -------------------------------------------------------------------------------------------------------------------
// This method finds & logs all the Workplace items that matches at least one of the search terms 
// -------------------------------------------------------------------------------------------------------------------
i2b2.WISEsearcher.matchOneSearch = function() {
    //alert("entered .matchOneSearch()");
    var currWImatched = false;
    var currTermMatched = false;
    var matchedInAnn = false;
    var matchedInName = false;
    var matchedCount = 0;
    //var comma = ", ";
    var semicolon = "; ";
     var t;
    var matchedPos;
    var matchedStr1;
    var matchedStr2;
    var checkExcludes = false;
    if (0 < i2b2.WISEsearcher.model.excludes.length) {
        checkExcludes = true;
    } 
    //alert("checkExcludes="+checkExcludes);

    for (var i = 0; i < i2b2.WISEsearcher.model.WIindices.length; i ++) {
	if (checkExcludes && i2b2.WISEsearcher.excludeItem(i)) {
	    continue;
	}
    	currWImatched = false;
        currTermMatched = false;
        matchedInAnn = false;
        matchedInName = false;
	t = "";
        //var dbg = "i="+i+",\n ann="+i2b2.WISEsearcher.model.WIorigAnns[i]+",\n name="+i2b2.WISEsearcher.model.WIorigNames[i];	        
        for (var j = 0; j < i2b2.WISEsearcher.model.terms.length; j ++) {
	    matchedStr1 = "";
            matchedPos = i2b2.WISEsearcher.model.WIanns[i].indexOf(i2b2.WISEsearcher.model.terms[j]);
            //dbg += ",\n terms["+j+"]="+i2b2.WISEsearcher.model.terms[j]+", ann-matched-pos="+matchedPos;            
	    if (-1 < matchedPos) {
		matchedInAnn = true;
                currTermMatched = true;
		matchedStr1 = i2b2.WISEsearcher.model.WIorigAnns[i].substr(matchedPos, i2b2.WISEsearcher.model.terms[j].length); 
	    } 
	    matchedStr2 = "";
            matchedPos = i2b2.WISEsearcher.model.WInames[i].indexOf(i2b2.WISEsearcher.model.terms[j]);
            //dbg += ", name-matched-pos="+matchedPos;   
	    if (-1 < matchedPos) {
		matchedInName = true;
                currTermMatched = true;
		matchedStr2 = i2b2.WISEsearcher.model.WIorigNames[i].substr(matchedPos, i2b2.WISEsearcher.model.terms[j].length); 
	    }

	    if (currTermMatched) {
		//alert("matchedStr1=" + matchedStr1 + "\nmatchedStr2=" + matchedStr2);
		if (matchedStr1 != matchedStr2) {
		    if ("" == matchedStr1) {
			matchedStr1 = matchedStr2;
		    } else if ("" != matchedStr2) {
		        //matchedStr1 += comma + matchedStr2;
		        matchedStr1 += semicolon + matchedStr2;
		    }
		}
	        if (currWImatched) {
		    if ("" != matchedStr1) {
			//t += comma + matchedStr1;
			t += semicolon + matchedStr1;
		    }
	        } else {
                    t += matchedStr1;
		    currWImatched = true;
	        }
                currTermMatched = false; // reset it
	    } 
        }
	//alert("t=" + t);
        //alert(dbg);        
        if (currWImatched) {
	    i2b2.WISEsearcher.saveMatched(matchedCount, i, t, matchedInAnn, matchedInName);
 	    matchedCount ++;
	}
    }

    //alert("exiting .matchOneSearch()--\n\nmatchedCount="+matchedCount);
    i2b2.WISEsearcher.tabulateResult("1");
};


// -------------------------------------------------------------------------------------------------------------------
// This method saves the data of a matched item (for result tabulation later)
// -------------------------------------------------------------------------------------------------------------------
i2b2.WISEsearcher.saveMatched = function(matchedCount, i, matchedTerms, annMatch, nameMatch) {
    var c = ", ";
    var s = "</td><td>";
    i2b2.WISEsearcher.model.rowIcons[matchedCount] = s + i2b2.WISEsearcher.model.WIicons[i];
    i2b2.WISEsearcher.model.rows[matchedCount] = s + i2b2.WISEsearcher.model.WIorigNames[i] + s + i2b2.WISEsearcher.model.WItypes[i] + s + i2b2.WISEsearcher.model.WIpaths[i];
    i2b2.WISEsearcher.model.rowsCsv[matchedCount] = c + i2b2.WISEsearcher.model.WIorigNames[i] + c + i2b2.WISEsearcher.model.WItypes[i] + 
                                                                                           c + i2b2.WISEsearcher.model.WIpaths[i]; 
    if ("" != matchedTerms) {
        i2b2.WISEsearcher.model.rows[matchedCount] += s + matchedTerms;
        i2b2.WISEsearcher.model.rowsCsv[matchedCount] += c + matchedTerms;
    }
    i2b2.WISEsearcher.model.rows[matchedCount] += s + i2b2.WISEsearcher.yesOrBlank(annMatch) + s + i2b2.WISEsearcher.yesOrBlank(nameMatch) + "</td></tr>";
    i2b2.WISEsearcher.model.rowsCsv[matchedCount] += c + i2b2.WISEsearcher.yesOrBlankCsv(annMatch) + c + i2b2.WISEsearcher.yesOrBlankCsv(nameMatch);

    i2b2.WISEsearcher.model.rowPaths[matchedCount] = i2b2.WISEsearcher.model.WIpaths[i]; // for sorting by the paths & names only
};


// -------------------------------------------------------------------------------------------------------------------
// This method maps 'YES' / '&nbsp;' to true / false, for result tabulation
// -------------------------------------------------------------------------------------------------------------------
i2b2.WISEsearcher.yesOrBlank = function(t) {
    if (t) {
        //return "</td><td>YES";
        return "YES";
    } else {
        //return "</td><td>&nbsp;";
        return "&nbsp;";
    }
};


// -------------------------------------------------------------------------------------------------------------------
// This method maps 'YES' / '' to true / false, for result tabulation
// -------------------------------------------------------------------------------------------------------------------
i2b2.WISEsearcher.yesOrBlankCsv = function(t) {
    if (t) {
        return "YES";
    } else {
        return " ";
    }
};


// -------------------------------------------------------------------------------------------------------------------
// This method finds & logs all the Workplace items that matches all the search terms 
// -------------------------------------------------------------------------------------------------------------------
i2b2.WISEsearcher.matchAllSearch = function() {
    //alert("entered .matchAllSearch()");
    var currWImatched = true;
    var currTermMatched = false;
    var matchedInAnn  = true;
    var matchedInName = true;
    var matchedCount  = 0;
    //var comma = ", ";
    //var t;
    var matchedPos;
    //var matchedStr1;
    //var matchedStr2;
    var checkExcludes = false;
    if (0 < i2b2.WISEsearcher.model.excludes.length) {
 	checkExcludes = true;
    } 

    for (var i = 0; i < i2b2.WISEsearcher.model.WIindices.length; i ++) {
	if (checkExcludes && i2b2.WISEsearcher.excludeItem(i)) {
	    continue;
	}
        currWImatched = true;
        currTermMatched = false;
        matchedInAnn  = true;
        matchedInName = true;
	//t = "";        
        //var dbg = "i="+i+",\n ann="+i2b2.WISEsearcher.model.WIorigAnns[i]+",\n name="+i2b2.WISEsearcher.model.WIorigNames[i];	        
        for (var j = 0; j < i2b2.WISEsearcher.model.terms.length; j ++) {
	    if (matchedInAnn) {
	    	//matchedStr1 = "";
            	matchedPos = i2b2.WISEsearcher.model.WIanns[i].indexOf(i2b2.WISEsearcher.model.terms[j]);
                //dbg += ",\n terms["+j+"]="+i2b2.WISEsearcher.model.terms[j]+", ann-matched-pos="+matchedPos;            
	        if (-1 < matchedPos) {
	    	    currTermMatched = true;
		    //matchedStr1 = i2b2.WISEsearcher.model.WIorigAnns[i].substr(matchedPos, i2b2.WISEsearcher.model.terms[j].length); 
	        } else {
		    matchedInAnn = false; // it only takes 1 miss to stop checking against annotation
		}
	    }
	    if (matchedInName) {
		//matchedStr2 = "";
            	matchedPos = i2b2.WISEsearcher.model.WInames[i].indexOf(i2b2.WISEsearcher.model.terms[j]);
                //dbg += ", name-matched-pos="+matchedPos;   
	        if (-1 < matchedPos) {
		    currTermMatched = true;
		    //matchedStr2 = i2b2.WISEsearcher.model.WIorigNames[i].substr(matchedPos, i2b2.WISEsearcher.model.terms[j].length); 
	        } else {
		    matchedInName = false; // it only takes 1 miss to stop checking against Name
		}
	    }

	    if (currTermMatched) {
		//if (matchedStr1 != matchedStr2) {
		//    if ("" == matchedStr1) {
		//        matchedStr1 = matchedStr2;
		//    } else if ("" != matchedStr2) {
		//	  matchedStr1 += comma + matchedStr2;
  		//    }
		//}
		//if ("" == t) {
		//    t += matchedStr1;
		//} else {
		//    t += comma + matchedStr1;
		//}
                currTermMatched = false; // reset it for next term
	    } else {
		currWImatched = false; // it only take 1 miss to disqualify current item
  		break;
	    }
        }
        //alert(dbg);        
	
	if (currWImatched) {
	    //i2b2.WISEsearcher.saveMatched(matchedCount, i, t, matchedInAnn, matchedInName);
	    i2b2.WISEsearcher.saveMatched(matchedCount, i, "", matchedInAnn, matchedInName);
	    matchedCount ++;
	}
    }

    //alert("exiting .matchAllSearch()--\n\nmatchedCount="+matchedCount);

    //i2b2.WISEsearcher.tabulateResult("1");
    i2b2.WISEsearcher.tabulateResult("a");
};


// -------------------------------------------------------------------------------------------------------------------
// This method returns T / F if an item is to be exluded or not
// -------------------------------------------------------------------------------------------------------------------
i2b2.WISEsearcher.excludeItem = function(index) {
    //alert("entered .excludeItem("+index+")");
    var excludesCount = i2b2.WISEsearcher.model.excludes.length;
    var matchedExcludes = 0;
    var excludeByAny;
    if ("1" == i2b2.WISEsearcher.model.exclude) {
	excludeByAny = true; 
    } else {
	excludeByAny = false; 
    }
    //var dbg = "excludesCount="+excludesCount+"\nexcludeByAny="+excludeByAny+"\nindex="+index+"\n\nanns="+i2b2.WISEsearcher.model.WIorigAnns[index]+
    //                 "\nname="+i2b2.WISEsearcher.model.WIorigNames[index]+"\n\n";
    for (var j = 0; j < excludesCount; j ++) {
        if ((-1 < i2b2.WISEsearcher.model.WIanns[index].indexOf(i2b2.WISEsearcher.model.excludes[j])) ||
            (-1 < i2b2.WISEsearcher.model.WInames[index].indexOf(i2b2.WISEsearcher.model.excludes[j]))) {
	    if (excludeByAny) {
                //alert(dbg+"\n.excludeItem("+index+") rtns true,\n matched exlude-item="+i2b2.WISEsearcher.model.excludes[j]);
		return true;
	    } else {
                //dbg += i2b2.WISEsearcher.model.excludes[j]+": matched\n";
		matchedExcludes ++;
		continue;
	    }
        } else {
	    if (!excludeByAny) { // i.e. exclude only when all excludes are present
                //alert(dbg+"\n.excludeItem("+index+") rtns false,\n no-match on exlude-item="+i2b2.WISEsearcher.model.excludes[j]);
		return false; // don't exclude current term since at least this 1 exclude is not there
	    }
	}
    }
    // at this point, last sanity check 7 return appropriate verdict
    if (excludeByAny) {
	if (0 < matchedExcludes) {
            //alert(dbg+"\n.excludeItem("+index+") rtns true\n matchedExcludes="+matchedExcludes);
	    return true;
	} else {
            //alert(dbg+"\n.excludeItem("+index+") rtns false\n matchedExcludes="+matchedExcludes);
	    return false;
	}
    } else {
	if (excludesCount == matchedExcludes) {
            //alert(dbg+"\n.excludeItem("+index+") rtns true\n matchedExcludes="+matchedExcludes);
	    return true;
	} else {
            //alert(dbg+"\n.excludeItem("+index+") rtns false\n matchedExcludes="+matchedExcludes);
	    return false;
	}
    }
};


// -------------------------------------------------------------------------------------------------------------------
// This method tabulates & displays the search result
// -------------------------------------------------------------------------------------------------------------------
i2b2.WISEsearcher.tabulateResult = function(style) {
    //alert("entered .tabulateResult('"+style+"')--\n\nitems processed = "+i2b2.WISEsearcher.model.WIindices.length+"\nmatched items = "+i2b2.WISEsearcher.model.matchedWInames.length);

    var ok = i2b2.WISEsearcher.sortByPaths();

    // set up the tables, their captions & headers
    var ti = "<table><caption><b>Workplace Items matching the following criteria:</b>"; // no id needed for the icon table
    var tx = "<table id=\"ReportTable\"><caption><b>Workplace Items matching the following criteria:</b>"; // id needed for XLS table
    var tc = "<table id=\"csvTable\"><tbody><tr><td>\r\n   Workplace Items matching the following criteria:"; // id needed for CSV table
    var si = "<tr><th>&nbsp;</th><th>&nbsp;</th><th>Workplace Item</th><th>Type</th><th>Path</th>"; // extra column for icon (for the icon'd table)
    var sx = "<tr><th>&nbsp;</th><th>Workplace Item</th><th>Type</th><th>Path</th>"; // no icon column for XLS table
    var sc = "#, Workplace Item, Type, Path, "; // no icon column for CSV table
    var r = "<th>Annotation Match</th><th>Name Match</th>";
    var rc = "Annotation Match, Name Match";
    var z;
    var zc;
    var searchTerms = i2b2.WISEsearcher.model.allTerms.replace(/,/g, ";");
    var skipTerms = i2b2.WISEsearcher.model.allExcludes.replace(/,/g, ";");
    if ("o" == i2b2.WISEsearcher.model.Case) {
        z = "&nbsp;&nbsp;<u><b><big><code>case-sensitive</code></big></b></u><br>Search terms: <i>'" + i2b2.WISEsearcher.model.allTerms;
        zc = " case-sensitive\r\n   Search terms: '" + searchTerms;
    } else { // "i"
        z = "&nbsp;&nbsp;<u><b><big><code>case-insensitive</code></big></b></u><br>Search terms: <i>'" + i2b2.WISEsearcher.model.allTerms;
        zc = " case-insensitive\r\n   Search terms: '" + searchTerms;
    }
    if ("a" == style) {
        ti += z + "'</i>;<br>Match option: <i>'Match all the specified terms.'</i>"; 
        tx += z + "'</i>;<br>Match option: <i>'Match all the specified terms.'</i>";
        tc += zc + "';\r\n    Match option: 'Match all the specified terms.'";
    } else {
        ti += z + "'</i>;<br>Match option: <i>'Match at least one of the specified terms.'</i>";
        tx += z + "'</i>;<br>Match option: <i>'Match at least one of the specified terms.'</i>";
        tc += zc + "';\r\n    Match option: 'Match at least one of the specified terms.'";
    }   
    if (0 < i2b2.WISEsearcher.model.excludes.length) {
        z = "<br>Exclude terms: <i>'" + skipTerms + "'</i>;<br>Exclude option: <i>'Exclude any item that contains ";
        zc = "\r\n   Exclude terms: '" + skipTerms + "';\r\n    Exclude option: 'Exclude any item that contains ";
        if ("a" == style) {
	    ti += z + "all the specified terms.'</i></caption>" + si + r; 
	    tx += z + "all the specified terms.'</i><br>&nbsp;</caption>" + sx + r; // extra line for XLS table
	    tc += zc + "all the specified terms.'\r\n   ===========================\r\n\r\n" + sc + rc; // extra line for CSV table
        } else {
	    ti += z + "any of the specified terms.'</i></caption>" + si + "<th>Matched Terms</th>" + r;
	    tx += z + "any of the specified terms.'</i><br>&nbsp;</caption>" + sx + "<th>Matched Terms</th>" + r; // extra line for XLS table
	    tc += zc + "any of the specified terms.'\r\n   ===========================\r\n\r\n" + sc + "Matched Terms, " + rc; // extra line for CSV table
	}    
    } else {
	if ("a" == style) {
   	    ti += "<br>Exclude terms: <code>NONE</code></caption>" + si + r; 
	    tx += "<br>Exclude terms: <code>NONE</code><br>&nbsp;</caption>" + sx + r; // extra space for XLS table
	    tc += "\r\n   Exclude terms: NONE\r\n   ===========================\r\n\r\n" + sc + rc; // extra space for CSV table
	} else {
   	    ti += "<br>Exclude terms: <code>NONE</code></caption>" + si + "<th>Matched Terms</th>" + r; 
	    tx += "<br>Exclude terms: <code>NONE</code><br>&nbsp;</caption>" + sx + "<th>Matched Terms</th>" + r; // extra space for XLS table
	    tc += "\r\n   Exclude terms: NONE\r\n   ===========================\r\n\r\n" + sc + "Matched Terms, " + rc; // extra space for CSV table
	}
    }

    // add the rows
    var j;
    for (var i = 0; i < i2b2.WISEsearcher.model.rows.length; i ++) {
        j = i + 1;
	tc += "\r\n" + j + i2b2.WISEsearcher.model.rowsCsv[i]; // no icon column for CSV table
        j = "<tr><td>" + j;
	ti += j + i2b2.WISEsearcher.model.rowIcons[i] + i2b2.WISEsearcher.model.rows[i]; // extra column for icon (for the icon'd table)
	tx += j + i2b2.WISEsearcher.model.rows[i]; // no icon column for XLS table
    }
    j = "</table>";    
    ti += j;
    tx += j;
    tc += "</td></tr></tbody></table>"; // the "<table>.." prefix & "..</table>" postfix are needed for the jquery to work its magic, they are then stripped away in Save2Csv.php
    i2b2.WISEsearcher.model.csv = tc;

    $$("DIV#WISEsearcher-mainDiv DIV#WISEsearcher-TABS DIV.results-finished")[0].show();
    $$("DIV#WISEsearcher-mainDiv DIV#WISEsearcher-TABS DIV.results-export-xls")[0].show();
    var resultShow = $$("DIV#WISEsearcher-mainDiv DIV#results-display")[0];
    //Element.select(resultShow, '.results-tabulation .searchResult')[0].innerHTML = '<pre>' + t + '</pre>';		
    resultShow.select('.results-tabulation .searchResult')[0].innerHTML = ti;		
    resultShow.select('.searchResult-xls')[0].innerHTML = tx;		
    resultShow.select('.searchResult-xls')[0].hide(); // not for show (for export only) though		

    resultShow.select('.searchResult-csv')[0].innerHTML = tc;
    resultShow.select('.searchResult-csv')[0].hide(); // not for show (for export only) though		
    i2b2.h.LoadingMask.hide(); // turn off the "LOADING" mask

    i2b2.WISEsearcher.SetupSaveData2LocalPhps();
    
    // following not necessary with the introduction of i2b2.WISEsearcher.IEwriteCsvTable
    if (navigator.appName == 'Microsoft Internet Explorer') {
        //resultShow.select('.results-warn')[0].show();
    	resultShow.select('.results-export-csv-IE')[0].show();
    	resultShow.select('.results-export-csv')[0].hide();
    } else {
    	//resultShow.select('.results-warn')[0].hide();
    	resultShow.select('.results-export-csv-IE')[0].hide();
    	resultShow.select('.results-export-csv')[0].show();
    }
    resultShow.select('.results-export-csv2')[0].show();    //alert("exiting .tabulateResult('"+style+"')--\n\nt="+t);
};


// -------------------------------------------------------------------------------------------------------------------
// This method writes the csvTable into a file for IE only (since IE won't render the '\r\n' or 'PHP_EOL' correctly)
// -------------------------------------------------------------------------------------------------------------------
i2b2.WISEsearcher.IEwriteCsvTable = function() {
    var w = window.open('', 'csvWindow', 'width=100,height=100'); // minimized popup, may be blocked though

    // the following line does not actually do anything interesting with the parameter given in current browsers, but really should have. 
    // Maybe in some browser it will. It does not hurt anyway to give the mime type
    w.document.open("csv/csv");

    var s = i2b2.WISEsearcher.model.csv.slice("<table id=\"csvTable\"><tbody><tr><td>".length); // remove the prefix
    s = s.substr(0, s.length - "</td></tr></tbody></table>".length);                            // remove the postfix
    w.document.write(s);
    w.document.close();
    //swc20120320 replaced next alert dialog, as it turns out that despite of the ".csv" extension not being displayed in the "Save As" dialog, it is in fact there!
    //alert("Writing table to file --\n\nplease note that due to limitation in Internet Explorer (IE), you must enter the file extension '.csv' (no quote), " +
    //        "after the filename, yourself, before pressing the [Save] button in the \"Save As\" dialog (coming up next):\n\ne.g.\n      " +
    //        "append '.csv' to end of 'i2b2data_WISE-search_20120117-121534'\n      to make it 'i2b2data_WISE-search_20120117-121534.csv'\n\nThank you!");
    //swc20120321 unfortunately, this alert dialog may result in the "Save As" dialog being hidden under the parent webcleint browser window!
    //alert("Exporting file --\n\nin the next dialog, please ignore the 'Save as type:' field content (an Internet Explorer shortcoming), and just click the [Save] button to save the .CSV file");
    var t = new Date();
    var fn = "i2b2data_WISE-search_" + t.getFullYear() + i2b2.WISEsearcher.getDoubleDigit(1 + t.getMonth()) + i2b2.WISEsearcher.getDoubleDigit(t.getDate()) + "-" +
             i2b2.WISEsearcher.getDoubleDigit(t.getHours()) + i2b2.WISEsearcher.getDoubleDigit(t.getMinutes()) + i2b2.WISEsearcher.getDoubleDigit(t.getSeconds()) + ".csv";
    w.document.execCommand("SaveAs", true, fn); // only works on IE, which always drop the ".csv" extension!
    w.close();
}


// -------------------------------------------------------------------------------------------------------------------
// This method pads a single digit (like '1') into double digit with leading '0' (like '01')
// -------------------------------------------------------------------------------------------------------------------
i2b2.WISEsearcher.getDoubleDigit = function(n) {
    var s;
    if (n < 10) {
	s = "0" + n;
    } else {
	s = n;
    }
    return s;
}


// -------------------------------------------------------------------------------------------------------------------
// This method sorts the result rows by the order of the paths of the Workplace items
// -------------------------------------------------------------------------------------------------------------------
i2b2.WISEsearcher.sortByPaths = function() {
    var w = i2b2.WISEsearcher.model.rowPaths.slice(0); // clone  
    var x = i2b2.WISEsearcher.model.rowPaths.slice(0); // clone  
    x.sort(); // ordered

    var avail = [];
    var order = [];
    var sortedIcons = [];
    var sortedRows = [];
    var sortedRowsCsv = [];
    var i;
    var j;
    var n = w.length;
 
    // initialize the ref arrays
    for (i = 0; i < n; i ++) {
	avail[i] = true;
	order[i] = i;
    }

    // determine the orders of each element
    for (i = 0; i < n; i ++) {
        for (j = 0; j < n; j ++) {
  	    if (avail[j] && w[j] == x[i]) {
                avail[j] = false; // remove it from next considerations
		order[i] = j;
		break;
            }
        }
    }

    // re-arrange
    for (i = 0; i < n; i ++) {
        j = order[i];
	sortedIcons[i] = i2b2.WISEsearcher.model.rowIcons[j];
	sortedRows[i] = i2b2.WISEsearcher.model.rows[j];
        sortedRowsCsv[i] = i2b2.WISEsearcher.model.rowsCsv[j];
    }

    // clone back sorted arrays to original arrays
    i2b2.WISEsearcher.model.rowIcons = sortedIcons.slice(0); // clone
    i2b2.WISEsearcher.model.rows = sortedRows.slice(0); // clone
    i2b2.WISEsearcher.model.rowsCsv = sortedRowsCsv.slice(0); // clone
    return true;
};


//-------------------------------------------------------------------------------------------------------------------
//This method returns the relative-path'd invocation strings of the saving php's
//-------------------------------------------------------------------------------------------------------------------
i2b2.WISEsearcher.SetupSaveData2LocalPhps = function() {
 var xls_php = i2b2.PLUGINMGR.ctrlr.main.currentPluginCtrlr.cfg.config.assetDir + "SaveToExcel.php?ext=WISE-search";
 var csv_php = i2b2.PLUGINMGR.ctrlr.main.currentPluginCtrlr.cfg.config.assetDir + "Save2Csv.php?ext=WISE-search";
//alert("xls_php='" + xls_php + "'\n\ncsv_php='" + csv_php + "'");
 $j("#save2csv").attr("action", csv_php);
 $j("#save2xls").attr("action", xls_php);
}


