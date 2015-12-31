/**
 * @projectDescription	i2b2 CSV Export Plugin 
 * @inherits			i2b2
 * @namespace			i2b2.ExportXLS
 * @authors 	        Mauro Bucalo [Universita' di Pavia]; S. Wayne Chan [University of Massachusetts Medical School]; Axel Newe [FAU Erlangen-Nuremberg]
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
 * 2015-12-09 3.4  Changed from "standard" to "custom" category, for webclient v.1.7.0.7 conformance. [S. Wayne Chan]
 */

// This file contains a list of all files that need to be loaded dynamically for this i2b2 Cell
// Every file in this list will be loaded after the cell's Init function is called
{
	files:[
		"ExportXLS_ctrlr.js"
	],
	css:[ 
		"vwExportXLS.css"
	],
	config: {
		// Additional configuration variables that are set by the system
		short_name: "ExportXLS",
		name: "ExportXLS", 
		description: "This plugin tabulates unidentified patient data of selectable concepts/observations and provides options to download the result to specified file type.",
		icons: { size32x32: "ExportXLS_icon_32x32.png" },
		category: ["celless","plugin","custom"],
		plugin: {
			isolateHtml: false,  // This means do not use an IFRAME
			isolateComm: false,  // This means to expect the plugin to use AJAX communications provided by the framework
			standardTabs: true,  // This means the plugin uses standard tabs at top
			html: {
				source: 'injected_screens.html',
				mainDivId: 'ExportXLS-mainDiv'
			}
		}
	}
}
