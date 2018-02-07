// this file contains a list of all files that need to be loaded dynamically for this i2b2 Cell
// every file in this list will be loaded after the cell's Init function is called
{
	files: [
//		"CRC_ajax.js",
		"CRC_ctrlr_Dates.js",
		"CRC_ctrlr_History.js",
		"CRC_ctrlr_Find.js",
		"CRC_ctrlr_QryPanel.js",
		"CRC_ctrlr_QryTool.js",
		"CRC_ctrlr_QryStatus.js",
        "CRC_ctrlr_TQryRelationship.js", /* tdw9 1707c: added temporal query relationship datamodel*/
        "CRC_ctrlr_TQryEvent.js",        /* tdw9 1707c: added temporal query Event controller */
        "CRC_ctrlr_TQryPanel.js",        /* tdw9 1707c: added temporal query Panel controller */
        "CRC_view_TemporalRelationshipEditor.js", /* tdw9 1707c: added editor for temporal relationship */
        "CRC_eventGraph.js",             /* tdw9 1707c: added graph model to check for temporal query reload modes to be SIMPLE or ADVANCED */
		"CRC_sdx_QM.js",
		"CRC_sdx_QI.js",
		"CRC_sdx_PRC.js",
		"CRC_sdx_PRS.js",		
		"CRC_sdx_ENS.js",		
		"CRC_sdx_PR.js",
		"CRC_sdx_QDEF.js",
		"CRC_sdx_QGDEF.js",
		"CRC_view_History.js",
		"CRC_view_Find.js",
		"CRC_view_QryTool.js",
		"CRC_view_Graphs.js",
		"CRC_view_Status.js",
		"CRC_view_QueryReport.js",
		"CRC_view_modLabRange.js",
		"i2b2_msgs.js",
		"ModLabValues/CRC_ModLabValues_config_data.js",
		"ModLabValues/CRC_view_ModLabValues_ctrlr.js",
		"ModLabValues/CRC_view_GENOTYPE.js",
		"ModLabValues/CRC_view_NUMBER.js",
		"ModLabValues/CRC_view_STR.js",
		"ModLabValues/CRC_view_LRGSTR.js",
		"ModLabValues/CRC_view_ENUM.js",
		"ModLabValues/CRC_view_NODATATYPE.js",
		"ModLabValues/CRC_view_PPV.js"
	],
	files_updated: [
		{origName: "i2b2_msgs.js", newName: "i2b2_msgs-Ver1_3.js", versionLevel: 1.3},
		{origName: "CRC_sdx_QI.js", newName: "CRC_sdx_QI-Ver1_3.js", versionLevel: 1.3}
	],
	css: [ "main_list.css" ],  // ONLY USE 1 STYLE SHEET: http://support.microsoft.com/kb/262161
	config: {
		// additional configuration variables that are set by the system
		name: "Data Repository",
		description: "The Data Repository cell stores all information that a user saves within the i2b2 Hive.",
		icons: {
			size32x32: "CRC_icon_32x32.gif"
		},
		category: ["core","cell"],
		paramTranslation: [
			{thinClientName:'sortBy', defaultValue:'DATE'},
			{thinClientName:'sortOrder', defaultValue:'DESC'},
			{thinClientName:'maxQueriesDisp', defaultValue:20},
			{thinClientName:'maxChildren', defaultValue:200},
			{thinClientName:'queryTimeout', defaultValue:180}
		]
	}
}