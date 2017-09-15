/*===============================================================================================================================================================================================
 * @projectDescription	Workplace Items Sharing Enhancement - Searcher (Tool for finding & listing all items in the Workplace that contain specified search terms in their annotations or names).
 * @inherits		i2b2
 * @namespace		i2b2.WISEsearcher
 * @author		S. Wayne Chan, Biomedical Research Informatics Development Group (BRIDG) and Biomedical Research Informatics Consulting & Knowledge Service (BRICKS),
 *                                     Div. of Health Informatics and Implementation Science (HIIS), Dept. of Quantitative Health Sciences (QHS), 
 *                                     University of Massachusetts Medical School (UMMS), Worcester, MA
 * @version 		1.0 (for i2b2 v1.3 & v1.6RC2)
 * @acknowledgement     This module leveraged off the construct / format /style / template used in the i2b2 web client plugin examples by N. Benik & G. Weber
 * ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 + @copyright		Copyright 2011 University of Massachusetts Medical School.
 + @license/disclaimer  This file is part of WISE-Searcher plugin for the i2b2 webclient.
 +
 + 			WISE-Searcher plugin for the i2b2 webclient is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by
 +			the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 +
 +			WISE-Searcher plugin for the i2b2 webclient is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
 +			MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.
 +
 +			You should have received a copy of the GNU General Public License along with WISE-Searcher plugin for the i2b2 webclient.  If not, see <http://www.gnu.org/licenses/>.
 + ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 * updated history (dateformat: YYYYMMDD) 
 * 20110812 S. Wayne Chan 	Developed initial version.  
 + 20111028 S. Wayne Chan   Added “copyright” & “license/disclaimer” sections in header following UMMS legal signoff.
 + 20151208 S. Wayne Chan   Added "Workplace" & "WISE" categories, changed "standard" to "custom" category, for webclient v.1.7.0.7 conformance.
 + 20170912 S. Wayne Chan   Added icons
 *===============================================================================================================================================================================================
 */

// this file contains a list of all files that need to be loaded dynamically for this plugin
// every file in this list will be loaded after the plugin's Init function is called
{
	files:[ "WISEsearcher_ctrlr.js" ],
	css:[ "vwWISEsearcher.css" ],
	config: {
		// additional configuration variables that are set by the system
		short_name: "WISE Searcher",
		name: "Workplace Items Sharing Enhancement - Searcher",
		description: "This plugin facilitates searching for similar Workplace items (folder, query, patient set, etc.) within the web client framework.",
		icons: {size32x32: "WISE_icon_32x32.png", size16x16: "WISE_icon_16x16.png"},
		category: ["celless", "plugin", "custom", "Workplace", "WISE"],
		plugin: {
			isolateHtml: false,  
			isolateComm: false,  
			standardTabs: true,
			html: {
				source: 'injected_screens.html',
				mainDivId: 'WISEsearcher-mainDiv'
			}
		}
	}
}
