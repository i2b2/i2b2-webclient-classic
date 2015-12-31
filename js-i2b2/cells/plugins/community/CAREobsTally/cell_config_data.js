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
 * @version             1.0 (for i2b2 v1.6 & above)
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
 * 20150327 S. Wayne Chan (v.1.0) developed initial version.  
 * 20151209 S. Wayne Chan (v.1.2) changed from "standard" to "custom" category, for webclient v.1.7.0.7 conformance. 
 *=========================================================================================================================
 */

// this file contains a list of all files that need to be loaded dynamically for this i2b2 Cell
// every file in this list will be loaded after the cell's Init function is called
{
	files:[
		"CAREobsTally_ctrlr.js"
	],
	css:[ 
		"vwCAREobsTally.css"
	],
	config: {
		// additional configuration variables that are set by the system
		short_name: "CARE - Concept Observation Tally Demographics Histograms",
		name: "CARE (Cohort Analysis & Refinement Expeditor) - Concept Observation Tally Demographics Histograms",
		description: "This plugin generates the histograms of demographic break-downs of a selected subset of a Patient Set against those from that subset that are associated with various observation counts of a specified concept.",
		icons: { size32x32: "CARE_icon_32x32.png" },
		category: ["celless", "plugin", "custom", "demographics", "histogram", "CARE"],
		plugin: {
			isolateHtml: false,  // no IFRAME
			isolateComm: false,  // expects to use AJAX communications provided by the framework
			standardTabs: true,  // uses standard tabs at top
			html: {
				source: 'injected_screens.html',
				mainDivId: 'CAREobsTally-mainDiv'
			}
		}
	}
}