/**
 * @projectDescription	Event controller for CRC's Query Tool.
 * @inherits 	i2b2.CRC.ctrlr
 * @namespace	i2b2.CRC.ctrlr.QT
 * @author		Nick Benik, Griffin Weber MD PhD
 * @version 	1.3
 * ----------------------------------------------------------------------------------------
 * updated 9-15-08: RC4 launch [Nick Benik] 
 */
console.group('Load & Execute component file: CRC > ctrlr > QueryTool');
console.time('execute time');


i2b2.CRC.ctrlr.QT = new QueryToolController();
function QueryToolController() {
	i2b2.CRC.model.queryCurrent = {};
	this.queryIsDirty = true;
	this.queryIsRunning = false;
	this.queryNamePrompt = false;
	this.queryTiming = 'ANY';
	this.temporalGroup = 0;
	this.tenporalBuilders = 0;
	this.hasModifier = false;
	this.queryNameDefault = 'New Query';
	this.queryStatusDefaultText = 'Drag query items to one or more groups then click Run Query.';
	this.panelControllers = [];
	this.panelControllers[0] = new i2b2_PanelController(this);
	this.panelControllers[1] = new i2b2_PanelController(this);
	this.panelControllers[2] = new i2b2_PanelController(this);
	this.sCompiledResultsTest = "";  // snm0 - this is the text for the graph display
//	================================================================================================== //
	this.doSetQueryName = function(inName) {
		this.queryIsDirty = true;
		$('queryName').innerHTML = inName;
		i2b2.CRC.model.queryCurrent.name = inName;
	}

//	================================================================================================== //
	this.doUpdateDatesInPanel = function(panelIndex) { // nw096 - date constraints over
		var dm = i2b2.CRC.model.queryCurrent.panels[i2b2.CRC.ctrlr.QT.temporalGroup][panelIndex];

	}

//	================================================================================================== //
	this.doQueryClear = function() {
		// function to clear query from memory
		delete i2b2.CRC.model.queryCurrent;
		i2b2.CRC.model.queryCurrent = {};
		i2b2.CRC.ctrlr.QT.temporalGroup = 0; 
		var dm = i2b2.CRC.model.queryCurrent;
		dm.panels = [];
		dm.panels[0] = new Array();
		dm.panels[1] = new Array();
		dm.panels[2] = new Array();
		this.doSetQueryName.call(this,'');
		this.doShowFrom(0);
		this._redrawPanelCount();
		this.queryNamePrompt = false;
		this.queryIsDirty = true;
		this.hasModifier = false;
		$('infoQueryStatusText').innerHTML = "";
		$('infoQueryStatusChart').innerHTML = "";
		$('crc.temoralBuilder').hide();		
		$('crc.innerQueryPanel').show();
		this.panelControllers[0].refTitle.innerHTML =  'Group 1';
		$("defineTemporal-button").innerHTML = "Population in which events occur";
		i2b2.CRC.view.QT.setQueryTiming(0);
		i2b2.CRC.view.QT.clearTemportal();
		$('temporalbuilders').innerHTML = "";
		this.tenporalBuilders = -1;
		this.queryTiming = 'ANY';
		this.doAddTemporal();
		this.sCompiledResultsTest = "";  // snm0 - this is the text for the graph display

		// tdw9: 1707c - adding changes to clear to handle simple temporal query UI 
		jQuery("#temporalUIToggleDiv").hide();                    //  hide temporal query mode toggle when clear is pressed.
		jQuery("#toggleTemporalQueryModeSpan").html("Switch to Advanced Temporal Query"); // reset toggle button text
		i2b2.CRC.view.QT.isShowingTemporalQueryUI        = false; //  tdw9: 1707c:show reset state, which is not temporal query
		i2b2.CRC.view.QT.isShowingClassicTemporalQueryUI = false; 
		// reset tutorial
		jQuery(".highlighted").removeClass("highlighted"); // remove all highlighteds if they are not already removed
		jQuery("#simpleTemporalQueryPointyArrow").hide();
		jQuery('#tutorialShowMeLink').hide();
		jQuery("#populationLabel").hide();	
		if (i2b2.CRC.view.QT.isTutorial)
			i2b2.CRC.view.QT.toggleTutorial();
		i2b2.CRC.view.QT.deleteAllEvents();		
		i2b2.CRC.view.QT.resetTemporalQueryUI();
		i2b2.CRC.view.QT.tutorialState = 0; // reset tutorial state
		// hide new temporal sequence UI
		jQuery("#outerTemporalSequenceUI").hide();
		jQuery("#populationLabel").hide();
		// show classic UI
		jQuery("#queryBalloonBox").show(); // show baloons
		var length = i2b2.CRC.ctrlr.QT.panelControllers.length;
		for (var i = 0; i < length; i++)
			i2b2.CRC.ctrlr.QT.panelControllers[i].refTiming.set('disabled', false);
		jQuery(".qryPanel").show(); // make sure panels are visible
		jQuery("#crc\\.innerQueryPanel").css('height', 'auto');   // set "crc.innerQueryPanel" height to be auto

		// re-initialize SIMPLE temporal query
		i2b2.CRC.view.QT.deleteAllEvents();
		i2b2.CRC.view.QT.resetTemporalQueryUI();

		i2b2.CRC.view.QT.splitterDragged();    // tdw9: 1707c: resize query-timing button
		// tdw9 1707c: end changes to handle SIMPLE temporal query UI
	}



	// ================================================================================================== //
	// tdw9 1707c: clear only the temporal component of the ADVANCED query model
	this.doClearTemporalComponent= function( ) 
	{
		// save the population component of the temporal query
		var populationComponent = i2b2.CRC.model.queryCurrent.panels[0]
		// function to clear query from memory
		delete i2b2.CRC.model.queryCurrent;
		i2b2.CRC.model.queryCurrent = {};
		i2b2.CRC.ctrlr.QT.temporalGroup = 0; 
		var dm = i2b2.CRC.model.queryCurrent;
		dm.panels = [];
		dm.panels[0] = populationComponent;
		dm.panels[1] = new Array();
		dm.panels[2] = new Array();
		this.doSetQueryName.call(this,'');
		this.doShowFrom(0);
		this._redrawPanelCount();
		this.queryNamePrompt = false;
		this.queryIsDirty = true;
		this.hasModifier = false;
		$('infoQueryStatusText').innerHTML = "";
		$('infoQueryStatusChart').innerHTML = "";
		$('crc.temoralBuilder').hide();		
		$('crc.innerQueryPanel').show();
		this.panelControllers[0].refTitle.innerHTML =  'Group 1';
		$("defineTemporal-button").innerHTML = "Population in which events occur";

		// taken from the function i2b2.CRC.view.QT.clearTemportal
		var t = defineTemporalButton.getMenu().getItems();
		if (t.length > 4) 
		{
			defineTemporalButton.getMenu().clearContent();
			defineTemporalButton.getMenu().addItems([{ text: "Population in which events occur" , value: "0" }]);		 
			defineTemporalButton.getMenu().addItems([{ text: "Event 1" , value: "1" }]);	
			defineTemporalButton.getMenu().addItems([{ text: "Event 2" , value: "2" }]);	 
			defineTemporalButton.getMenu().addItems([{ text: "Define order of events" , value: "BUILDER" }]);	
			defineTemporalButton.getMenu().render();			
		}

		i2b2.CRC.view.QT.ResizeHeight();
		$('temporalbuilders').innerHTML = "";
		this.tenporalBuilders = -1;
		this.queryTiming = 'ANY';
		this.doAddTemporal();
		this.sCompiledResultsTest = "";  // snm0 - this is the text for the graph display
	}


//	================================================================================================== //
	// tdw9 1707: checks if an Event contains number constraints. 
	this.eventContainsNumberConstraint =  function(qd)
	{
		for (var i=1; i<qd.length; i++) // qd[0] is the population. No need to check it.
		{
			var panels = i2b2.h.XPath(qd[i], 'descendant::panel');
			for (var j=0; j<panels.length; j++) 
				if (parseInt(i2b2.h.getXNodeVal(panels[j],'total_item_occurrences')) > 1)
					return true;
		}
		return false;
	};

	this.eventContainsNonConceptItems =  function(qd)
	{
		for (var i=1; i<qd.length; i++) // qd[0] is the population. No need to check it.
		{
			var panels = i2b2.h.XPath(qd[i], 'descendant::panel');
			for (var j=0; j<panels.length; j++)
			{
				var items = i2b2.h.XPath(panels[j], 'descendant::item');
				for ( var k = 0; k < items.length; k++ )
				{
					var key = i2b2.h.getXNodeVal(items[k],'item_key');
					if (key.startsWith("query_master_id") || 
							key.startsWith("masterid") ||
							key.startsWith("patient_set_coll_id") ||
							key.startsWith("patient_set_enc_id"))
						return true;
				}
			}
		}
		return false;
	};

	this.eventContainsNonModifierItemsInNonFirstPanels =  function(qd)
	{
		for (var i=1; i<qd.length; i++) // qd[0] is the population. Don't check it.
		{
			var panels = i2b2.h.XPath(qd[i], 'descendant::panel');
			for (var j=1; j<panels.length; j++) // skip the 1st panel, which can be a normal concept
			{
				var items = i2b2.h.XPath(panels[j], 'descendant::item');
				for ( var k = 0; k < items.length; k++ ) 
				{
					if (i2b2.h.XPath(items[k], 'constrain_by_modifier').length == 0)
						return true;
				}
			}
		}
		return false;
	};

	// check to see if a non-first panel has timing other than "SAMEINSTANCENUM" (We currently do not allow Independent or Same Encounter because we only allow modifiers in these non-first panels)
	this.eventContainsNonSameInstanceTimingInNonFirstPanels =  function(qd)
	{
		for (var i=1; i<qd.length; i++) // qd[0] is the population. Don't check it.
		{
			var panels = i2b2.h.XPath(qd[i], 'descendant::panel');
			for (var j=1; j<panels.length; j++) // skip the 1st panel
			{
				if (i2b2.h.getXNodeVal(panels[j], 'panel_timing') != "SAMEINSTANCENUM" ) 
					return true;
			}
		}
		return false;
	};


	// parses the sequence and return the eventGraph is if it's valid. False otherwise
	this.queryContainsValidSequence = function(refXML)
	{
		var parser = new TQueryEventGraphParser(refXML);
		var graph = parser.parse();
		if (typeof graph != "object") 
			return false;
		this.eventGraph = graph; // save graph to local
		return graph;
	};

	this.doLoadSimpleTemporalQuery = function( qd, dObj, qm_id )
	{
		// show SIMPLE query UI
		if (!i2b2.CRC.view.QT.isShowingTemporalQueryUI)         i2b2.CRC.view.QT.toggleTemporalQueryUI();
		if (i2b2.CRC.view.QT.isShowingClassicTemporalQueryUI)   
		{
			i2b2.CRC.view.QT.isShowingClassicTemporalQueryUI = !i2b2.CRC.view.QT.isShowingClassicTemporalQueryUI;
			i2b2.CRC.view.QT.showNewTemporalUI();
		}
		i2b2.CRC.view.QT.loadPreviousQueryIntoNewTQ( qd, this.eventGraph, false, dObj, qm_id );

		i2b2.CRC.view.QT.isTemporalQueryUIInResetState = false; // previous query is loaded, simple temporal query is no longer in the reset state
		i2b2.CRC.view.QT.tutorialState = 0;                     // reset tutorial state
		i2b2.CRC.view.QT.isTutorial = true;
		i2b2.CRC.view.QT.toggleTutorial();                      // turn tutorial off
	};

	// tdw9: parses value constraint in Value Constraints and Modifier Constraints
	this.parseValueConstraint = function( lvd )
	{
		lvd = lvd[0];
		// pull the LabValue definition for concept
		// extract & translate
		var t = i2b2.h.getXNodeVal(lvd, "value_constraint");
		var values = {};
		values.NumericOp = i2b2.h.getXNodeVal(lvd, "value_operator");
		values.GeneralValueType = i2b2.h.getXNodeVal(lvd, "value_type");
		switch (values.GeneralValueType) 
		{
		case "NUMBER":
			values.MatchBy = "VALUE";
			if (t.indexOf(' and ') != -1) 
			{
				// extract high and low values
				t = t.split(' and ');
				values.ValueLow = t[0];
				values.ValueHigh = t[1];
			} 
			else 
			{
				values.Value = t;
			}
			values.UnitsCtrl = i2b2.h.getXNodeVal(lvd, "value_unit_of_measure");

			break;
		case "STRING":
			values.MatchBy = "VALUE";
			values.ValueString = t;
			break;
		case "LARGETEXT":
			values.MatchBy = "VALUE";
			values.GeneralValueType = "LARGESTRING";
			values.DbOp = (i2b2.h.getXNodeVal(lvd, "value_operator") == "CONTAINS[database]" ? true : false);
			values.ValueString = t;
			break;
		case "TEXT":	// this means Enum?
			values.MatchBy = "VALUE";
			try 
			{
				values.ValueEnum = eval("(Array" + t + ")");
				values.GeneralValueType = "ENUM";
			} 
			catch (e) 
			{
				//is a string
				values.StringOp = i2b2.h.getXNodeVal(lvd, "value_operator");
				values.ValueString = t;
				values.GeneralValueType = "STRING"; // tdw9: this line is missing for modifiers in current code. Does it make a different to have it here? Also, "TEXT" is changed from "STRING" to make sure TEXT works in modifiers
			}
			break;
		case "FLAG":
			values.MatchBy = "FLAG";
			values.ValueFlag = t
			break;
		default:
			values.Value = t;
		}
		return values;
	};

	// po: panel object. qp: array of query panels. i1: index of query panels
	this.loadItemsIntoPanel = function( po, qp, i1 )
	{
		var allDateFromsAreSame = true;
		var allDateTosAreSame = true;
		var allDateFroms = {};
		var allDateTos = {};

		po.items = [];
		var pi = i2b2.h.XPath(qp[i1], 'descendant::item[item_key]');
		for (i2 = 0; i2 < pi.length; i2++) 
		{
			var itm = {};
			// BUG FIX: WEBCLIENT-136
			if (po.dateFrom == false)
				itm.dateFrom = i2b2.CRC.view.QT.parseDateString(i2b2.h.getXNodeVal(pi[i2], 'constrain_by_date/date_from'));
			else // WEBCLIENT-162: Backwards compatible <panel_date_to> support
				itm.dateFrom = po.dateFrom;
			if (po.dateTo == false)
				itm.dateTo = i2b2.CRC.view.QT.parseDateString(i2b2.h.getXNodeVal(pi[i2], 'constrain_by_date/date_to'));
			else // WEBCLIENT-162: Backwards compatible <panel_date_to> support
				itm.dateTo = po.dateTo;

			if ((pi.length == 1) && (i2 == 0)) {
				if (typeof i2b2.h.getXNodeVal(pi[i2], 'constrain_by_date/date_from' === "undefined"))
					allDateFromsAreSame = false;
				if (typeof i2b2.h.getXNodeVal(pi[i2], 'constrain_by_date/date_to' === "undefined"))
					allDateTosAreSame = false;
			}
			// Set panel date by looking at item dates
			if ((pi.length > 1) && (i2 < pi.length - 1) && allDateFromsAreSame && allDateTosAreSame) {
				if (i2b2.h.getXNodeVal(pi[i2], 'constrain_by_date/date_from') != i2b2.h.getXNodeVal(pi[i2 + 1], 'constrain_by_date/date_from')) {
					allDateFromsAreSame = false;
				} else {
					allDateFroms = itm.dateFrom;
				}
				if (i2b2.h.getXNodeVal(pi[i2], 'constrain_by_date/date_to') != i2b2.h.getXNodeVal(pi[i2 + 1], 'constrain_by_date/date_to')) {
					allDateTosAreSame = false;
				} else {
					allDateTos = itm.dateTo;
				}
			}

			var item = {};
			// get the item's details from the ONT Cell
			var ckey = i2b2.h.getXNodeVal(pi[i2], 'item_key');

			// Determine what item this is
			if (ckey.startsWith("query_master_id")) {
				var o = new Object;
				o.name = i2b2.h.getXNodeVal(pi[i2], 'item_name');
				o.id = ckey.substring(16);
				o.result_instance_id = o.PRS_id;

				var sdxDataNode = i2b2.sdx.Master.EncapsulateData('QM', o);
				po.items.push(sdxDataNode);
			} else if (ckey.startsWith("masterid")) {
				var o = new Object;
				o.name = i2b2.h.getXNodeVal(pi[i2], 'item_name');
				o.id = ckey;
				o.result_instance_id = o.PRS_id;

				var sdxDataNode = i2b2.sdx.Master.EncapsulateData('QM', o);
				po.items.push(sdxDataNode);
			} else if (ckey.startsWith("patient_set_coll_id")) {
				var o = new Object;
				o.titleCRC = i2b2.h.getXNodeVal(pi[i2], 'item_name');
				o.PRS_id = ckey.substring(20);
				o.result_instance_id = o.PRS_id;

				var sdxDataNode = i2b2.sdx.Master.EncapsulateData('PRS', o);
				po.items.push(sdxDataNode);
			} else if (ckey.startsWith("patient_set_enc_id")) {
				var o = new Object;
				o.titleCRC = i2b2.h.getXNodeVal(pi[i2], 'item_name');
				o.PRS_id = ckey.substring(19);
				o.result_instance_id = o.PRS_id;

				var sdxDataNode = i2b2.sdx.Master.EncapsulateData('ENS', o);
				po.items.push(sdxDataNode);

			}
			else 
			{
				// WE MUST QUERY THE ONT CELL TO BE ABLE TO DISPLAY THE TREE STRUCTURE CORRECTLY
				var o = new Object;
				o.level = i2b2.h.getXNodeVal(pi[i2], 'hlevel');
				o.name = i2b2.h.getXNodeVal(pi[i2], 'item_name');
				o.tooltip = i2b2.h.getXNodeVal(pi[i2], 'tooltip');

				// nw096 - If string starts with path \\, lookup path in Ontology cell
				if (o.name.slice(0, 2) == '\\\\') {
					var results = i2b2.ONT.ajax.GetTermInfo("ONT", { ont_max_records: 'max="1"', ont_synonym_records: 'false', ont_hidden_records: 'false', concept_key_value: o.name }).parse();
					if (results.model.length > 0) {
						o.name = results.model[0].origData.name;
						o.tooltip = results.model[0].origData.tooltip;
					}
				}

				o.key = i2b2.h.getXNodeVal(pi[i2], 'item_key');
				o.synonym_cd = i2b2.h.getXNodeVal(pi[i2], 'item_is_synonym');
				if (o.synonym_cd == "false") // tdw9 bug fix for non-synonym terms showing blue text: HTML rendering checks to see if synonym is "N," not "false"
					o.synonym_cd = "N";

				o.hasChildren = i2b2.h.getXNodeVal(pi[i2], 'item_icon');

				// Lab Values processing
				var lvd = i2b2.h.XPath(pi[i2], 'descendant::constrain_by_value');                
				if ((lvd.length > 0) && (i2b2.h.XPath(pi[i2], 'descendant::constrain_by_modifier').length == 0)) 
					o.LabValues = this.parseValueConstraint( lvd );

				// sdx encapsulate
				var sdxDataNode = i2b2.sdx.Master.EncapsulateData('CONCPT', o);
				if (o.LabValues)
					sdxDataNode.LabValues = o.LabValues;

				// set item date
				if (itm.dateFrom)
					sdxDataNode.dateFrom = itm.dateFrom;
				if (itm.dateTo)
					sdxDataNode.dateTo = itm.dateTo;

				// parse for modifier
				if (i2b2.h.XPath(pi[i2], 'descendant::constrain_by_modifier').length > 0) 
				{
					sdxDataNode.origData.parent = {};
					sdxDataNode.origData.parent.key = o.key;
					//sdxDataNode.origData.parent.LabValues = o.LabValues;
					sdxDataNode.origData.parent.hasChildren = o.hasChildren;
					sdxDataNode.origData.parent.level = o.level;
					sdxDataNode.origData.parent.name = o.name;
					sdxDataNode.origData.key = i2b2.h.getXNodeVal(pi[i2], 'constrain_by_modifier/modifier_key');
					sdxDataNode.origData.applied_path = i2b2.h.getXNodeVal(pi[i2], 'constrain_by_modifier/applied_path');
					sdxDataNode.origData.name = i2b2.h.getXNodeVal(pi[i2], 'constrain_by_modifier/modifier_name');
					sdxDataNode.origData.isModifier = true;
					this.hasModifier = true;

					// Mod Values processing
					var lvd = i2b2.h.XPath(pi[i2], 'descendant::constrain_by_modifier/constrain_by_value');
					if (lvd.length > 0) 
						o.ModValues = this.parseValueConstraint( lvd );

					if (o.ModValues) 
						sdxDataNode.ModValues = o.ModValues;
				}
				po.items.push(sdxDataNode); // write to po.items
			}
		}

		// Set panel date by looking at item dates
		if (allDateFromsAreSame && allDateTosAreSame) 
		{
			if (typeof allDateTos !== "undefined") 
				po.dateTo = allDateTos;
			if (typeof allDateFroms !== "undefined") 
				po.dateFrom = allDateFroms;
		}
	};

	this.doLoadPopulationQuery = function( qd, dObj, qm_id )
	{
		for (var j = 0; j < 1; j++) 
		{
			dObj.panels = [];
			if (j == 0)
				var qp = i2b2.h.XPath(qd[j], 'panel');
			else
				var qp = i2b2.h.XPath(qd[j], 'descendant::panel');

			var total_panels = qp.length;
			for (var i1 = 0; i1 < total_panels; i1++) 
			{
				i2b2.CRC.ctrlr.QT.temporalGroup = j;
				i2b2.CRC.ctrlr.QT._redrawAllPanels();

				// extract the data for each panel
				var po = {};
				po.panel_num = i2b2.h.getXNodeVal(qp[i1], 'panel_number');
				var t = i2b2.h.getXNodeVal(qp[i1], 'invert');
				po.exclude = (t == "1");
				//po.timing = i2b2.h.getXNodeVal(qp[i1],'panel_timing');				
				// 1.4 queries don't have panel_timing, and undefined doesn't work
				// so default to ANY
				po.timing = i2b2.h.getXNodeVal(qp[i1], 'panel_timing') || 'ANY';
				i2b2.CRC.view.QT.setPanelTiming(po.panel_num, po.timing);
				var t = i2b2.h.getXNodeVal(qp[i1], 'total_item_occurrences');
				po.occurs = (1 * t) - 1;
				var t = i2b2.h.getXNodeVal(qp[i1], 'panel_accuracy_scale');
				po.relevance = t;

				// check, parse, and set "panel dates" for panelObj
				po.dateFrom = i2b2.CRC.view.QT.parseDateString(i2b2.h.getXNodeVal(qp[i1], 'panel_date_from'));
				po.dateTo = i2b2.CRC.view.QT.parseDateString(i2b2.h.getXNodeVal(qp[i1], 'panel_date_to'));

				// tdw9: load items into panel
				this.loadItemsIntoPanel(po, qp, i1);
				dObj.panels[po.panel_num] = po;
			}
			// reindex the panels index (panel [1,3,5] should be [0,1,2])
			dObj.panels = dObj.panels.compact();
			i2b2.CRC.model.queryCurrent.panels[j] = dObj.panels;
		}
		// populate the panels yuiTrees
		try {
			var qpc = i2b2.CRC.ctrlr.QT.panelControllers[0];
			var dm = i2b2.CRC.model.queryCurrent;
			for (var k = 0; k < dm.panels.length; k++) {
				for (var pi = 0; pi < dm.panels[k].length; pi++) {
					// create a treeview root node and connect it to the treeview controller
					dm.panels[k][pi].tvRootNode = new YAHOO.widget.RootNode(qpc.yuiTree);
					qpc.yuiTree.root = dm.panels[k][pi].tvRootNode;
					dm.panels[k][pi].tvRootNode.tree = qpc.yuiTree;
					qpc.yuiTree.setDynamicLoad(i2b2.CRC.ctrlr.QT._loadTreeDataForNode, 1);
					// load the treeview with the data
					var tvRoot = qpc.yuiTree.getRoot();
					for (var pii = 0; pii < dm.panels[k][pi].items.length; pii++) {
						var withRenderData = qpc._addConceptVisuals(dm.panels[k][pi].items[pii], tvRoot, false);
						if (dm.panels[k][pi].items[pii].ModValues) {
							withRenderData.ModValues = dm.panels[k][pi].items[pii].ModValues;
						}
						if (dm.panels[k][pi].items[pii].LabValues) {
							withRenderData.LabValues = dm.panels[k][pi].items[pii].LabValues;
						}
						if (dm.panels[k][pi].items[pii].dateFrom) {
							withRenderData.dateFrom = dm.panels[k][pi].items[pii].dateFrom;
						}
						if (dm.panels[k][pi].items[pii].dateTo) {
							withRenderData.dateTo = dm.panels[k][pi].items[pii].dateTo;
						}
						dm.panels[k][pi].items[pii] = withRenderData;
					}
				}
			}
		} catch (e) { }

		i2b2.CRC.ctrlr.QT.temporalGroup = 0;
		i2b2.CRC.ctrlr.QT._redrawAllPanels();
		i2b2.CRC.ctrlr.QT._redrawPanelCount(); // tdw9 1707c: update panel count
		i2b2.CRC.view.QT.ResizeHeight();
		//Load the query status
		i2b2.CRC.ctrlr.QT.laodQueryStatus(qm_id, dObj.name);
	};


//	================================================================================================== //
	this.doQueryLoad = function(qm_id) {  // function to load query from history
		// clear existing query
		i2b2.CRC.ctrlr.QT.doQueryClear();
		// show on GUI that work is being done
		//i2b2.h.LoadingMask.show();

		// callback processor
		var scopedCallback = new i2b2_scopedCallback();
		scopedCallback.scope = this;
		scopedCallback.callback = function(results) {
			var cl_queryMasterId = qm_id;
			// THIS function is used to process the AJAX results of the getChild call
			//		results data object contains the following attributes:
			//			refXML: xmlDomObject <--- for data processing
			//			msgRequest: xml (string)
			//			msgResponse: xml (string)
			//			error: boolean
			//			errorStatus: string [only with error=true]
			//			errorMsg: string [only with error=true]
			i2b2.CRC.view.QT.queryRequest = results.msgRequest;
			i2b2.CRC.view.QT.queryResponse = results.msgResponse;
			// switch to status tab
			i2b2.CRC.view.status.showDisplay();
			// did we get a valid query definition back? 
			var qd = i2b2.h.XPath(results.refXML, 'descendant::query_name/..');
			if (qd.length != 0) {
				i2b2.CRC.ctrlr.QT.doQueryClear();
				var dObj = {};
				dObj.name = i2b2.h.getXNodeVal(results.refXML,'name');
				this.doSetQueryName(dObj.name); // BUG FIX - WEBCLIENT-102
				dObj.timing = i2b2.h.XPath(qd[0],'descendant-or-self::query_timing/text()');
//				dObj.timing = dObj.timing[0].nodeValue; //will cause a null-pointer or undefined obj exception when dObj.timing has no length!
				if($("crcQueryToolBox.bodyBox")){
					var userId = i2b2.h.getXNodeVal(results.refXML,'user_id');
					var existingUserIdElemList = $$("#userIdElem");
					if(existingUserIdElemList)
					{
						existingUserIdElemList.each(function(existingUserIdElem){
							existingUserIdElem.remove();
						});
					}
					$("crcQueryToolBox.bodyBox").insert(new Element('input',{'type':'hidden','id':'userIdElem','value':userId}));
				}

				//i2b2.CRC.view.QT.queryTimingButtonset("label", dObj.timing);
//				i2b2.CRC.view.QT.setQueryTiming(dObj.timing); //must check to prevent null-pointer or undefined obj exception that'll result in hang
				if (dObj.timing && 0 < dObj.timing.length) i2b2.CRC.view.QT.setQueryTiming(dObj.timing[0].nodeValue);//to prevent null-ptr or undefined exception   
				dObj.specificity = i2b2.h.getXNodeVal(qd[0],'specificity_scale');
				//dObj.panels = new Array(new Array());

				var sqc = i2b2.h.XPath(qd[0], 'subquery_constraint');

				// tdw9 1707c: add decision maker for Temporal Query and if so, whether we use SIMPLE vs ADVANCED
				if (sqc.length > 0)  
				{      
					i2b2.CRC.view.QT.setQueryTiming("TEMPORAL");
					if ( !this.eventContainsNumberConstraint(qd) &&
							!this.eventContainsNonConceptItems(qd) &&
							!this.eventContainsNonModifierItemsInNonFirstPanels(qd) &&
							!this.eventContainsNonSameInstanceTimingInNonFirstPanels(qd) &&
							this.queryContainsValidSequence(results.refXML)) 
					{   
						// tdw9 1707c: showing dialog to load query
						i2b2.CRC.view.QT.showDialog("Loading Your Query...", "","", "=none=", {}, true, true);

						// load temporal query into SIMPLE mode
						this.doLoadSimpleTemporalQuery(qd, dObj, cl_queryMasterId);
						jQuery("#toggleTemporalQueryModeSpan").html("Switch to Advanced Temporal Query"); // tdw9: fix JIRA bug 4 (https://biobankportaldev.partners.org/jira/browse/BPTEMPQUER-4)
						return;
					}
					else
					{
						jQuery("#temporalUIToggleDiv").show();
						//i2b2.CRC.view.QT.isShowingClassicTemporalQueryUI = true; // make sure we show the classic UI 
						if (!i2b2.CRC.view.QT.isShowingTemporalQueryUI)
							i2b2.CRC.view.QT.toggleTemporalQueryUI();
						if (!i2b2.CRC.view.QT.isShowingClassicTemporalQueryUI )
							i2b2.CRC.view.QT.doToggleTemporalQueryMode(); // call the version that does not delay to prevent asynchronous changes to data model (i2b2.CRC.model.queryCUrrent)
					}
				}			
				for (var j=3; j < qd.length; j++)
					i2b2.CRC.view.QT.addNewTemporalGroup();

				for (var j=1; j < sqc.length; j++)
					i2b2.CRC.ctrlr.QT.doAddTemporal();

				for (var j=0; j <sqc.length; j++) {

					i2b2.CRC.view.QT.setQueryTiming("TEMPORAL");
					//i2b2.CRC.view.QT.setQueryTiming("BUILDER");

					// $('instancevent1['+j + ']').value = i2b2.h.getXNodeVal(sqc[j],'first_query/query_id');
					$('preloc1['+j + ']').value = i2b2.h.getXNodeVal(sqc[j],'first_query/join_column');
					$('instanceopf1['+j + ']').value = i2b2.h.getXNodeVal(sqc[j],'first_query/aggregate_operator');
					var operator = i2b2.h.XPath(sqc[j],'descendant-or-self::operator/text()');
					$('postloc['+j + ']').value = operator[0].nodeValue;

					//$('postloc['+j + ']').value = i2b2.h.getXNodeVal(sqc[j],'operator');
//					$('instancevent2['+j + ']').value =i2b2.h.getXNodeVal(sqc[j],'second_query/query_id');
					$('preloc2['+j + ']').value = i2b2.h.getXNodeVal(sqc[j],'second_query/join_column');
					$('instanceopf2['+j + ']').value = i2b2.h.getXNodeVal(sqc[j],'second_query/aggregate_operator');

					var event1 = i2b2.h.XPath(sqc[j],'descendant-or-self::first_query/query_id/text()');
					var evalue =  event1[0].nodeValue;
					evalue = evalue.replace("Event ", "");
					evalue = evalue - 1;
					$('instancevent1['+j + ']').selectedIndex  = evalue;

					var event2 = i2b2.h.XPath(sqc[j],'descendant-or-self::second_query/query_id/text()');
					var evalue =  event2[0].nodeValue;
					evalue = evalue.replace("Event ", "");
					evalue = evalue - 1;
					$('instancevent2['+j + ']').selectedIndex  = evalue;

					var span = i2b2.h.XPath(sqc[j], 'span');

					for (var k=0; k < span.length; k++) {
						$('byspan' + (k + 1) + '[' +j + ']').value = i2b2.h.getXNodeVal(span[k],'operator');
						$('bytimevalue' + (k + 1) + '[' +j + ']').value = i2b2.h.getXNodeVal(span[k],'span_value');
						$('bytimeunit' + (k + 1) + '[' +j + ']').value = i2b2.h.getXNodeVal(span[k],'units');
						$('bytime' + (k + 1) + '[' +j + ']').checked  = true;
					}
				}


				for (var j=0; j <qd.length; j++) {
					dObj.panels = [];
					if (j==0)
						var qp = i2b2.h.XPath(qd[j], 'panel');
					else
						var qp = i2b2.h.XPath(qd[j], 'descendant::panel');

					var total_panels = qp.length;
					for (var i1=0; i1<total_panels; i1++) {
						var allDateFromsAreSame = true;
						var allDateTosAreSame = true;
						var allDateFroms = {};
						var allDateTos = {};
						i2b2.CRC.ctrlr.QT.temporalGroup = j;
						i2b2.CRC.ctrlr.QT._redrawAllPanels();

						// extract the data for each panel

						var po = {};
						po.panel_num = i2b2.h.getXNodeVal(qp[i1],'panel_number');
						var t = i2b2.h.getXNodeVal(qp[i1],'invert');
						po.exclude = (t=="1");
						//po.timing = i2b2.h.getXNodeVal(qp[i1],'panel_timing');				
						// 1.4 queries don't have panel_timing, and undefined doesn't work
						// so default to ANY
						po.timing = i2b2.h.getXNodeVal(qp[i1],'panel_timing') || 'ANY';			
						i2b2.CRC.view.QT.setPanelTiming(po.panel_num, po.timing);
						var t = i2b2.h.getXNodeVal(qp[i1],'total_item_occurrences');
						po.occurs = (1*t)-1;
						var t = i2b2.h.getXNodeVal(qp[i1],'panel_accuracy_scale');
						po.relevance = t;					
						var t = i2b2.h.getXNodeVal(qp[i1],'panel_date_from');
						if (t) {
							//	t = t.replace('T','-');
							//	t = t.replace('Z','-');
							//	t = t.split('-');
							// new Date(start_date.substring(0,4), start_date.substring(5,7)-1, start_date.substring(8,10), start_date.substring(11,13), start_date.substring(14,16),start_date.substring(17,19),start_date.substring(20,23));
							po.dateFrom = {};
							po.dateFrom.Year = t.substring(0,4); //t[0];
							po.dateFrom.Month = t.substring(5,7); //t[1];
							po.dateFrom.Day = t.substring(8,10); //t[2];
						} else {
							po.dateFrom = false;
						}
						var t = i2b2.h.getXNodeVal(qp[i1],'panel_date_to');
						if (t) {
							//t = t.replace('T','-');
							//t = t.replace('Z','-');
							//t = t.split('-');
							po.dateTo = {};
							po.dateTo.Year =  t.substring(0,4); //t[0];
							po.dateTo.Month =  t.substring(5,7); // t[1];
							po.dateTo.Day = t.substring(8,10);// t[2];
						} else {
							po.dateTo = false;
						}
						po.items = [];
						var pi = i2b2.h.XPath(qp[i1], 'descendant::item[item_key]');
						for (i2=0; i2<pi.length; i2++) {
							var itm = {};
							// BUG FIX: WEBCLIENT-136
							if(po.dateFrom == false){
								var t = i2b2.h.getXNodeVal(pi[i2],'constrain_by_date/date_from');
								if (t) {
									itm.dateFrom = {};
									itm.dateFrom.Year = t.substring(0,4); //t[0];
									itm.dateFrom.Month = t.substring(5,7); //t[1];
									itm.dateFrom.Day = t.substring(8,10); //t[2];
								}
							} else { // WEBCLIENT-162: Backwards compatible <panel_date_from> support
								itm.dateFrom = po.dateFrom;
							}
							if(po.dateTo == false){
								var t = i2b2.h.getXNodeVal(pi[i2],'constrain_by_date/date_to');
								if (t) {
									itm.dateTo = {};
									itm.dateTo.Year =  t.substring(0,4); //t[0];
									itm.dateTo.Month =  t.substring(5,7); // t[1];
									itm.dateTo.Day = t.substring(8,10);// t[2];
								}
							} else { // WEBCLIENT-162: Backwards compatible <panel_date_to> support
								itm.dateTo = po.dateTo;
							}
							if ((pi.length == 1) && (i2 == 0)){
								if(typeof i2b2.h.getXNodeVal(pi[i2],'constrain_by_date/date_from' === "undefined"))
									allDateFromsAreSame = false;
								if(typeof i2b2.h.getXNodeVal(pi[i2],'constrain_by_date/date_to' === "undefined"))
									allDateTosAreSame = false;
							}
							// Set panel date by looking at item dates
							if ((pi.length > 1) && (i2 < pi.length - 1) && allDateFromsAreSame && allDateTosAreSame){
								if(i2b2.h.getXNodeVal(pi[i2],'constrain_by_date/date_from') != i2b2.h.getXNodeVal(pi[i2 + 1],'constrain_by_date/date_from')){
									allDateFromsAreSame = false;
								} else {
									allDateFroms = itm.dateFrom;
								}
								if(i2b2.h.getXNodeVal(pi[i2],'constrain_by_date/date_to') != i2b2.h.getXNodeVal(pi[i2 + 1],'constrain_by_date/date_to')){
									allDateTosAreSame = false;
								} else {
									allDateTos = itm.dateTo;
								}
							}


							var item = {};
							// get the item's details from the ONT Cell
							var ckey = i2b2.h.getXNodeVal(pi[i2],'item_key');


							// Determine what item this is
							if (ckey.toLowerCase().startsWith("query_master_id")) {
								var o = new Object;
								o.name =i2b2.h.getXNodeVal(pi[i2],'item_name');
								o.id = ckey.substring(16);
								o.result_instance_id = o.PRS_id ;

								var sdxDataNode = i2b2.sdx.Master.EncapsulateData('QM',o);
								po.items.push(sdxDataNode);								
							} else 	if (ckey.toLowerCase().startsWith("masterid")) {
								var o = new Object;
								o.name =i2b2.h.getXNodeVal(pi[i2],'item_name');
								o.id = ckey;
								o.result_instance_id = o.PRS_id ;

								var sdxDataNode = i2b2.sdx.Master.EncapsulateData('QM',o);
								po.items.push(sdxDataNode);								
							} else  if (ckey.toLowerCase().startsWith("folder")) {
								var o = new Object;

								//o.titleCRC = ckey.substring(8);
								o.titleCRC =  i2b2.h.getXNodeVal(pi[i2],'item_name');
								o.PRS_id = ckey.substring(19);
								o.result_instance_id = o.PRS_id ;
								o.id = ckey;
								var sdxDataNode = i2b2.sdx.Master.EncapsulateData('PRS',o);
								po.items.push(sdxDataNode);
							} else if (ckey.toLowerCase().startsWith("patient_set_coll_id")) {
								var o = new Object;
								o.titleCRC =i2b2.h.getXNodeVal(pi[i2],'item_name');
								o.PRS_id = ckey.substring(20);
								o.result_instance_id = o.PRS_id ;

								var sdxDataNode = i2b2.sdx.Master.EncapsulateData('PRS',o);
								po.items.push(sdxDataNode);		
							} else if (ckey.toLowerCase().startsWith("patient_set_enc_id")) {
								var o = new Object;
								o.titleCRC =i2b2.h.getXNodeVal(pi[i2],'item_name');
								o.PRS_id = ckey.substring(19);
								o.result_instance_id = o.PRS_id ;

								var sdxDataNode = i2b2.sdx.Master.EncapsulateData('ENS',o);
								po.items.push(sdxDataNode);		
							} else  if (ckey.toLowerCase().startsWith("patient")) {
								var o = new Object;

								//o.titleCRC = ckey.substring(8);
								o.titleCRC = i2b2.h.getXNodeVal(pi[i2],'item_key');
								o.patient_id = ckey.substring(13);
								o.result_instance_id = o.PRS_id ;
								o.id = ckey;
								var sdxDataNode = i2b2.sdx.Master.EncapsulateData('PR',o);
								po.items.push(sdxDataNode);
							} else {
								//Get the modfier if it exists
								//		if (i2b2.h.getXNodeVal(pi[i2],'constrain_by_modifier') != null)
								//		{
								//			po.modifier_key = i2b2.h.getXNodeVal(pi[i2],'constrain_by_modifier/modifier_key');
								//			po.applied_path = i2b2.h.getXNodeVal(pi[i2],'constrain_by_modifier/applied_path');
								//		}


								// WE MUST QUERY THE ONT CELL TO BE ABLE TO DISPLAY THE TREE STRUCTURE CORRECTLY

								var o = new Object;
								o.level = i2b2.h.getXNodeVal(pi[i2],'hlevel');
								o.name = i2b2.h.getXNodeVal(pi[i2],'item_name');
								o.tooltip = i2b2.h.getXNodeVal(pi[i2],'tooltip');

								// nw096 - If string starts with path \\, lookup path in Ontology cell
								if(o.name.slice(0, 2) == '\\\\'){
									var results = i2b2.ONT.ajax.GetTermInfo("ONT", {ont_max_records:'max="1"', ont_synonym_records:'false', ont_hidden_records: 'false', concept_key_value: o.name}).parse();
									if(results.model.length > 0){
										o.name = results.model[0].origData.name;
										o.tooltip = results.model[0].origData.tooltip;
									}
								}

								o.key = i2b2.h.getXNodeVal(pi[i2],'item_key');
								o.synonym_cd = i2b2.h.getXNodeVal(pi[i2],'item_is_synonym');
								o.hasChildren = i2b2.h.getXNodeVal(pi[i2],'item_icon');									

								//o.xmlOrig = c;

								// Lab Values processing
								var lvd = i2b2.h.XPath(pi[i2], 'descendant::constrain_by_value');
								if ((lvd.length>0) && (i2b2.h.XPath(pi[i2], 'descendant::constrain_by_modifier').length == 0)){
									lvd = lvd[0];
									o.LabValues = i2b2.CRC.view.modLabvaluesCtlr.processLabValuesForQryLoad(lvd);			
								}
								// sdx encapsulate
								var sdxDataNode = i2b2.sdx.Master.EncapsulateData('CONCPT',o);
								if (o.LabValues) {
									// We do want 2 copies of the Lab Values: one is original from server while the other one is for user manipulation
									sdxDataNode.LabValues = o.LabValues;	
								}
								if (itm.dateFrom) {
									sdxDataNode.dateFrom = itm.dateFrom;
								}

								if (itm.dateTo) {
									sdxDataNode.dateTo = itm.dateTo;
								}
								//o.xmlOrig = c;
								if (i2b2.h.XPath(pi[i2], 'descendant::constrain_by_modifier').length > 0) {
									//if (i2b2.h.getXNodeVal(pi[i2],'constrain_by_modifier') != null) {
									sdxDataNode.origData.parent = {};
									sdxDataNode.origData.parent.key = o.key;
									//sdxDataNode.origData.parent.LabValues = o.LabValues;
									sdxDataNode.origData.parent.hasChildren = o.hasChildren;
									sdxDataNode.origData.parent.level = o.level;
									sdxDataNode.origData.parent.name = o.name;
									sdxDataNode.origData.key = i2b2.h.getXNodeVal(pi[i2],'constrain_by_modifier/modifier_key');
									sdxDataNode.origData.applied_path = i2b2.h.getXNodeVal(pi[i2],'constrain_by_modifier/applied_path');
									sdxDataNode.origData.name = i2b2.h.getXNodeVal(pi[i2],'constrain_by_modifier/modifier_name');
									sdxDataNode.origData.isModifier = true;
									this.hasModifier = true;

									// Lab Values processing
									var lvd = i2b2.h.XPath(pi[i2], 'descendant::constrain_by_modifier/constrain_by_value');
									if (lvd.length>0){
										lvd = lvd[0];
										o.ModValues = i2b2.CRC.view.modLabvaluesCtlr.processModValuesForQryLoad(lvd);
									}
									if (o.ModValues) {
										// We do want 2 copies of the Lab Values: one is original from server while the other one is for user manipulation
										sdxDataNode.ModValues = o.ModValues;
									}
									//}
								}
								po.items.push(sdxDataNode);
								//	} else {
								//		console.error("CRC's ONT Handler could not get term details about '"+ckey+"'!");
								//	}
							}
						}

						if(allDateFromsAreSame && allDateTosAreSame){
							if(typeof allDateTos !== "undefined"){
								po.dateTo = allDateTos;
							}
							if(typeof allDateFroms !== "undefined"){
								po.dateFrom = allDateFroms;
							}
						}

						dObj.panels[po.panel_num] = po;
					}
					// reindex the panels index (panel [1,3,5] should be [0,1,2])
					dObj.panels = dObj.panels.compact();
					i2b2.CRC.model.queryCurrent.panels[j] = dObj.panels;

				}
				// populate the panels yuiTrees
				try {
					var qpc = i2b2.CRC.ctrlr.QT.panelControllers[0];
					var dm = i2b2.CRC.model.queryCurrent;
					for (var k=0; k<dm.panels.length; k++) {
						for (var pi=0; pi<dm.panels[k].length; pi++) {
							// create a treeview root node and connect it to the treeview controller
							dm.panels[k][pi].tvRootNode = new YAHOO.widget.RootNode(qpc.yuiTree);
							qpc.yuiTree.root = dm.panels[k][pi].tvRootNode;
							dm.panels[k][pi].tvRootNode.tree = qpc.yuiTree;
							qpc.yuiTree.setDynamicLoad(i2b2.CRC.ctrlr.QT._loadTreeDataForNode,1);						
							// load the treeview with the data
							var tvRoot = qpc.yuiTree.getRoot();
							for (var pii=0; pii<dm.panels[k][pi].items.length; pii++) {
								var withRenderData = qpc._addConceptVisuals(dm.panels[k][pi].items[pii], tvRoot, false);
								if (dm.panels[k][pi].items[pii].ModValues)
								{
									withRenderData.ModValues = 	dm.panels[k][pi].items[pii].ModValues;
								}
								if (dm.panels[k][pi].items[pii].LabValues)
								{
									withRenderData.LabValues = 	dm.panels[k][pi].items[pii].LabValues;
								}
								if (dm.panels[k][pi].items[pii].dateFrom)
								{
									withRenderData.dateFrom = 	dm.panels[k][pi].items[pii].dateFrom;
								}
								if (dm.panels[k][pi].items[pii].dateTo)
								{
									withRenderData.dateTo = 	dm.panels[k][pi].items[pii].dateTo;
								}
								dm.panels[k][pi].items[pii] = withRenderData;
							}
						}
					}
				} catch (e) {}
				// redraw the Query Tool GUI
				i2b2.CRC.ctrlr.QT._redrawPanelCount();
				i2b2.CRC.ctrlr.QT.doScrollFirst();
				// hide the loading mask
				i2b2.h.LoadingMask.hide();
			}
			i2b2.CRC.ctrlr.QT.temporalGroup = 0;
			i2b2.CRC.ctrlr.QT._redrawAllPanels();
			i2b2.CRC.view.QT.ResizeHeight();
			//Load the query status
			i2b2.CRC.ctrlr.QT.laodQueryStatus(qm_id, dObj.name);
		}
		// AJAX CALL
		i2b2.CRC.ajax.getRequestXml_fromQueryMasterId("CRC:QueryTool", { qm_key_value: qm_id }, scopedCallback);		


	}

	// tdw9: check to see if there are at least two Events before running a temporal query
	this.validateTemporalQuery = function()
	{
		if (i2b2.CRC.view.QT.isShowingClassicTemporalQueryUI) // check ADVANCED UI model to see if Events used are non-empty
		{
			// Check to see if the first two Events are not empty. 
			// We do this check because if Event1 and Event3 are filled but not Event 2, The query is immediately cancelled when run.
			var count = 0;
			if (i2b2.CRC.model.queryCurrent.panels[1].length == 0 ||
					i2b2.CRC.model.queryCurrent.panels[1][0] == undefined ||
					i2b2.CRC.model.queryCurrent.panels[1][0].items.length < 1 ||
					i2b2.CRC.model.queryCurrent.panels[2].length == 0 ||
					i2b2.CRC.model.queryCurrent.panels[2][0] == undefined ||
					i2b2.CRC.model.queryCurrent.panels[2][0].items.length < 1 )
			{ 
				return { isValidated: false,
					errorMainMsg: "You cannot run a temporal query without defining the first two Events.",
					errorSubMsg:  ""};              
			}
		}
		else // check SIMPLE model to see if there are two non-empty Events (empty Events are auto-removed when run)
		{
			var events = jQuery(".temporalEvent");
			var count = 0;
			for (var i = 0; i < events.length; i++ )
			{
				if (jQuery(jQuery(".temporalEvent")[i]).data("event").panels[0].items.length > 0 )  
					count++;
				if (count > 1)                                                                      
					break;
			}
			if (count < 2)
			{
				return { isValidated: false,
					errorMainMsg: "You cannot run a temporal query with only one Obsevation defined.",
					errorSubMsg:  ""};
			}
		}
		return { isValidated: true };
	};

//	================================================================================================== //
	this.doQueryRun = function() {
		// function to build and run query 
		if (i2b2.CRC.ctrlr.currentQueryStatus != false && i2b2.CRC.ctrlr.currentQueryStatus.isQueryRunning()) { 
			i2b2.CRC.ctrlr.deleteCurrentQuery.cancelled = true;
			i2b2.CRC.ctrlr.currentQueryStatus.cancelQuery();
			i2b2.CRC.ctrlr.currentQueryStatus = false;
			//alert('A query is already running.\n Please wait until the currently running query has finished.');
			return void(0);
		}

		// tdw9 1707c: allow panels to be empty if submitting from new temporal query UI 
		if (i2b2.CRC.model.queryCurrent.panels[i2b2.CRC.ctrlr.QT.temporalGroup].length < 1 && // check to see if current set of classic UI panels is empty 
				!(i2b2.CRC.view.QT.isShowingTemporalQueryUI && !i2b2.CRC.view.QT.isShowingClassicTemporalQueryUI))
		{
			alert('You must enter at least one concept to run a query.');
			return void(0);
		}

		if (i2b2.CRC.model.queryCurrent.panels[i2b2.CRC.ctrlr.QT.temporalGroup][0].items.length < 1)
		{
			alert('You must enter at least one concept to run a query.');
			return void(0);
		}
		// tdw9 1707c: validate temporal query if we are in temporal mode
		if (i2b2.CRC.view.QT.isShowingTemporalQueryUI)
		{
			var validationResult = this.validateTemporalQuery();
			if ( !validationResult.isValidated )
			{
				i2b2.CRC.view.QT.showDialog("Cannot Run Query", validationResult.errorMainMsg, validationResult.errorSubMsg);
				return void(0);
			}
		}

		// make sure a shrine topic has been selected
		if (i2b2.PM.model.shrine_domain) {
			var topicSELECT = $('queryTopicSelect');
			if (topicSELECT.selectedIndex == null || topicSELECT.selectedIndex == 0) {
				alert('You must select a Topic to run a SHRINE query.');
				return void(0);
			}
			var topicid = topicSELECT.options[topicSELECT.selectedIndex].value;
		}

		// callback for dialog submission
		var handleSubmit = function() {
			// submit value(s)
			if(this.submit()) {
				// run the query
				//if(jQuery("input:checkbox[name=queryType]:checked").length > 0){ // WEBCLIENT-170
				var t = $('dialogQryRun');
				var queryNameInput = t.select('INPUT.inputQueryName')[0];
				var options = {};
				var t2 = t.select('INPUT.chkQueryType');
				for (var i=0;i<t2.length; i++) {
					if (t2[i].checked == true) {
						options['chk_'+t2[i].value] = t2[i].checked;
					}
				}				
                    if (typeof i2b2.CRC.cfg.cellParams['QUERY_OPTIONS_XML'] !== "undefined") {
                        options['QUERY_RUN_TYPE'] = jQuery("#CRC_QUERY_TYPE option:selected")[0].value;
                    }
				$('queryName').innerHTML = queryNameInput.value;
				i2b2.CRC.model.queryCurrent.name = queryNameInput.value;
				i2b2.CRC.ctrlr.QT._queryRun(queryNameInput.value, options);
				//} else {
				//	alert('You must select one query result type to run.');
				//}
			}
		}
		// display the query name input dialog
		this._queryPromptRun(handleSubmit);
		// autogenerate query name
		var myDate=new Date();


		var hours = myDate.getHours()
		if (hours < 10){
			hours = "0" + hours
		}
		var minutes = myDate.getMinutes()
		if (minutes < 10){
			minutes = "0" + minutes
		}
		var seconds = myDate.getSeconds()
		if (seconds < 10){
			seconds = "0" + seconds
		}
		//var ds = myDate.toLocaleString();
		var ts = hours + ":" + minutes + ":" + seconds; //ds.substring(ds.length-5,ds.length-13);
		var defQuery = this._getQueryXML.call(this);
		var qn = defQuery.queryAutoName+'@'+ts;
		// display name
		var queryNameInput = $('dialogQryRun').select('INPUT.inputQueryName')[0];
		queryNameInput.value = qn;
	}

//	================================================================================================== //
	this._queryRun = function(inQueryName, options) {
		// make sure name is not blank
		if (inQueryName.blank()) { 
			//alert('Cannot run query with without providing a name!');
			alert('Please enter a name for this query.');
			return;
		}
		//	if(!options.chk_PRS && !options.chk_PRC  && !options.chk_ENS) {
		//		alert('You must select at least one query result type to return!');
		//		return;
		//	}

		// Query Parameters
		var query_definition = this._getQueryXML(inQueryName);
		var params = {
				result_wait_time: i2b2.CRC.view.QT.params.queryTimeout,
				psm_query_definition: query_definition.queryXML
		}

		// see if we are doing a normal run or sketchs based run
        params['query_run_method'] = "";
        if (typeof options['QUERY_RUN_TYPE'] !== 'undefined') {
            params['query_run_method'] = "<query_method>"+options['QUERY_RUN_TYPE']+"</query_method>\n";
            delete options['QUERY_RUN_TYPE'];
        }

		// SHRINE topic if we are running SHRINE query
		if (i2b2.h.isSHRINE()) {
			var topicSELECT = $('queryTopicSelect');
			if (topicSELECT.selectedIndex == null || topicSELECT.selectedIndex == 0) {
				alert("Please select a Topic to run the query.");
				return false;
			}
			params.shrine_topic = "<shrine><queryTopicID>"+topicSELECT.options[topicSELECT.selectedIndex].value+"</queryTopicID></shrine>";
		}

		// generate the result_output_list (for 1.3 backend)

		var result_output = "";
		/*
		var i=0;
		if (options.chk_PRS) {
			i++;
			result_output += '<result_output priority_index="'+i+'" name="patientset"/>';
		}
		if (options.chk_ENS) {
			i++;
			result_output += '<result_output priority_index="'+i+'" name="patient_encounter_set"/>';
		}
		if (options.chk_PRC) {
			i++;
			result_output += '<result_output priority_index="'+i+'" name="patient_count_xml"/>';
		}
		 */
		for(var name in options)
		{
			if (name) {
				i++;
				result_output += '<result_output priority_index="'+i+'" name="' + name.substring(4).toLowerCase() + '"/>\n';	
			}

		}
		params.psm_result_output = '<result_output_list>'+result_output+'</result_output_list>\n';

		// create query object
		$('runBoxText').innerHTML = "Cancel Query";
		i2b2.CRC.ctrlr.currentQueryStatus = new i2b2.CRC.ctrlr.QueryStatus($('infoQueryStatusText'));
		i2b2.CRC.ctrlr.currentQueryStatus.startQuery(inQueryName, params);		
	}


//	================================================================================================== //
	this._queryRunningTime = function() {
		if (i2b2.CRC.ctrlr.QT.queryIsRunning) {
			var d = new Date();
			var t = Math.floor((d.getTime() - queryStartTime)/100)/10;
			var el = $('numSeconds');
			if (el) {
				var s = t.toString();
				if (s.indexOf('.') < 0) {
					s += '.0';
				}
				el.innerHTML = s;
				window.setTimeout('i2b2.CRC.ctrlr.QT._queryRunningTime()',100);
			}
		}
	}


//	================================================================================================== //
	this._queryPromptRun = function(handleSubmit) {
		if (!i2b2.CRC.view.dialogQryRun) {
			var handleCancel = function() {
				this.cancel();
			};
			var loopBackSubmit = function() {
				i2b2.CRC.view.dialogQryRun.submitterFunction();
			};
			var handlePreview = function() {
				var queryNameInput = $('dialogQryRun').select('INPUT.inputQueryName')[0];
				if(!queryNameInput)
					queryNameInput.value = "No Query Name is currently provided";
				i2b2.CRC.ctrlr.QT.doPrintQueryNew(true,queryNameInput.value,true);
			};

            // N. Benik - show query run options if server has the capability to do time/accuracy trade-off
            if (typeof i2b2.CRC.cfg.cellParams['QUERY_OPTIONS_XML'] === "undefined") {
                jQuery('#CRC_QUERY_OPTIONS_UI').hide();
            } else {
                // populate the dropdown
                var select = jQuery("#CRC_QUERY_TYPE");
                select.empty();
                var ids = i2b2.h.XPath(i2b2.CRC.cfg.cellParams['QUERY_OPTIONS_XML'][0], "//QueryMethod/@ID");
                ids.forEach(function(item) {
                    select.append(jQuery('<option>', {
                        value: item.nodeValue,
                        text: item.ownerElement.textContent
                    }));
                });
                // show the extra query execution options
                jQuery("#CRC_QUERY_OPTIONS_UI").show();
            }

			i2b2.CRC.view.dialogQryRun = new YAHOO.widget.SimpleDialog("dialogQryRun", {
				width: "400px",
				fixedcenter: true,
				constraintoviewport: true,
				modal: true,
				zindex: 700,
				buttons: [{
					text: "OK",
					handler: loopBackSubmit,
					isDefault: true
				}, {
					text: "Cancel",
					handler: handleCancel
				}]
			});
			$('dialogQryRun').show();
			i2b2.CRC.view.dialogQryRun.validate = function(){
				// now process the form data
				var msgError = '';
				var queryNameInput = $('dialogQryRun').select('INPUT.inputQueryName')[0];
				if (!queryNameInput || queryNameInput.value.blank()) {
					alert('Please enter a name for this query.');
					return false;
				}
				if(jQuery("input:checkbox[name=queryType]:checked").length == 0){ // WEBCLIENT-170
					alert('You must select one query result type to run.');
					return false;
				}
                if (typeof i2b2.CRC.cfg.cellParams['QUERY_OPTIONS_XML'] !== "undefined") {
                    var query_type = jQuery("#CRC_QUERY_TYPE option:selected");
                    if (query_type.length == 0) {
                        alert('You must choose a query method.');
				        return false;
                    }
                }
				return true;
			};
			i2b2.CRC.view.dialogQryRun.render(document.body);
		}
		// manage the event handler for submit
		delete i2b2.CRC.view.dialogQryRun.submitterFunction;
		i2b2.CRC.view.dialogQryRun.submitterFunction = handleSubmit;
		// display the dialoge
		i2b2.CRC.view.dialogQryRun.center();
		i2b2.CRC.view.dialogQryRun.show();
	}


//	================================================================================================== //
	this._queryPromptName = function(handleSubmit) {
		if (!i2b2.CRC.view.dialogQmName) {
			var handleCancel = function() {
				this.cancel();
			};
			var loopBackSubmit = function() {
				i2b2.CRC.view.dialogQmName.submitterFunction();
			};
			i2b2.CRC.view.dialogQmName = new YAHOO.widget.SimpleDialog("dialogQmName", {
				width: "400px",
				fixedcenter: true,
				constraintoviewport: true,
				modal: true,
				zindex: 700,
				buttons: [{
					text: "OK",
					handler: loopBackSubmit,
					isDefault: true
				}, {
					text: "Cancel",
					handler: handleCancel
				}]
			});
			$('dialogQmName').show();
			i2b2.CRC.view.dialogQmName.validate = function(){
				// now process the form data
				var msgError = '';
				var queryNameInput = $('inputQueryName');
				if (!queryNameInput || queryNameInput.value.blank()) {
					alert('Please enter a name for this query.');
					return false;
				}
				if(jQuery("input:checkbox[name=queryType]:checked").length == 0){ // WEBCLIENT-170
					alert('You must select one query result type to run.');
					return false;
				}
				return true;
			};
			i2b2.CRC.view.dialogQmName.render(document.body);
		}
		// manage the event handler for submit
		delete i2b2.CRC.view.dialogQmName.submitterFunction;
		i2b2.CRC.view.dialogQmName.submitterFunction = handleSubmit;
		// display the dialoge
		i2b2.CRC.view.dialogQmName.center();
		i2b2.CRC.view.dialogQmName.show();
	}

	// tdw9 1707c: method to copy simple temporal query model to the classic one and load it to UI
	this.copySimpleQueryToClassic = function()
	{
		// load simple model to the classic UI. Parse in-UI content and put equivalent data into the classic model
		i2b2.CRC.view.QT.deleteEmptyEvents(); // delete any empty events
		var events = jQuery(".temporalEvent");
		var classicUIEventCount = i2b2.CRC.model.queryCurrent.panels.length - 1; // the first one ([0]) is Population

		// create a mapping of Event names
		var eventNameMapping = {};
		var eventCounter     = 1;
		// tell each event to put its content into the classic model and perform rendering
		for ( var i = 0; i < events.length; i++ )
		{
			var targetIndex = i+1;
			var tqEvent = jQuery(events[i]).data(i2b2.CRC.view.QT.TQryEvent.eventKey);
			tqEvent.copyToClassicUI(classicUIEventCount, targetIndex);
			eventNameMapping[tqEvent.name] = "Event " + eventCounter;
			eventCounter++;
		}

		// populate temporal relationships into the classic model
		for ( var i = 0; i < i2b2.CRC.view.QT.temporalRelationships.length; i++ )
			i2b2.CRC.view.QT.temporalRelationships[i].populateClassicUI(i, eventNameMapping);

		// redraw panel count
		i2b2.CRC.ctrlr.QT._redrawPanelCount();
		// scroll to show the first panel
		i2b2.CRC.ctrlr.QT.doScrollFirst();
	}

	// refactoring: considers the main query panels as a subquery, as well as each 'event' of the temporal query.
	// the main query panels are all in i2b2.CRC.mode.queryCurrent.panels[0]
	this.getSubqueryXML = function( isTemporal, subQueryIndex, auto_query_name_len )
	{
		var s = "";
		var ip = subQueryIndex;
		//for (var ip = 0; ip < i2b2.CRC.model.queryCurrent.panels.length; ip++) 
		//{
		panel_list = i2b2.CRC.model.queryCurrent.panels[ip]; //i2b2.CRC.ctrlr.QT.temporalGroup];
		panel_cnt = panel_list.length;

		var auto_query_name = '';
		if (isTemporal && ip > 0) 
		{
			//if equal to one than add subquery_contraint
			if (ip == 1) 
			{
				for (var tb = 0; tb <= this.tenporalBuilders; tb++) 
				{
					s += '\t<subquery_constraint>\n';
					s += '\t\t<first_query>\n';
					s += '\t\t\t<query_id>' + $('instancevent1[' + tb + ']').options[$('instancevent1[' + tb + ']').selectedIndex].value + '</query_id>\n';
					s += '\t\t\t<join_column>' + $('preloc1[' + tb + ']').options[$('preloc1[' + tb + ']').selectedIndex].value + '</join_column>\n';
					s += '\t\t\t<aggregate_operator>' + $('instanceopf1[' + tb + ']').options[$('instanceopf1[' + tb + ']').selectedIndex].value + '</aggregate_operator>\n';
					s += '\t\t</first_query>\n';
					s += '\t\t<operator>' + $('postloc[' + tb + ']').options[$('postloc[' + tb + ']').selectedIndex].value + '</operator>\n';
					s += '\t\t<second_query>\n';
					s += '\t\t\t<query_id>' + $('instancevent2[' + tb + ']').options[$('instancevent2[' + tb + ']').selectedIndex].value + '</query_id>\n';
					s += '\t\t\t<join_column>' + $('preloc2[' + tb + ']').options[$('preloc2[' + tb + ']').selectedIndex].value + '</join_column>\n';
					s += '\t\t\t<aggregate_operator>' + $('instanceopf2[' + tb + ']').options[$('instanceopf2[' + tb + ']').selectedIndex].value + '</aggregate_operator>\n';
					s += '\t\t</second_query>\n';

					if ($('bytime1[' + tb + ']').checked) 
					{
						s += '\t\t<span>\n';
						s += '\t\t\t<operator>' + $('byspan1[' + tb + ']').options[$('byspan1[' + tb + ']').selectedIndex].value + '</operator>\n';
						s += '\t\t\t<span_value>' + $('bytimevalue1[' + tb + ']').value + '</span_value>\n';
						s += '\t\t\t<units>' + $('bytimeunit1[' + tb + ']').options[$('bytimeunit1[' + tb + ']').selectedIndex].value + '</units>\n';
						s += '\t\t</span>\n';
					}
					if ($('bytime2[' + tb + ']').checked) 
					{
						s += '\t\t<span>\n';
						s += '\t\t\t<operator>' + $('byspan2[' + tb + ']').options[$('byspan2[' + tb + ']').selectedIndex].value + '</operator>\n';
						s += '\t\t\t<span_value>' + $('bytimevalue2[' + tb + ']').value + '</span_value>\n';
						s += '\t\t\t<units>' + $('bytimeunit2[' + tb + ']').options[$('bytimeunit2[' + tb + ']').selectedIndex].value + '</units>\n';
						s += '\t\t</span>\n';
					}
					s += '\t</subquery_constraint>\n';
				}
			}
			if (panel_list[0].items.length == 0)
				return s;
			s += '<subquery>\n ';
			s += '<query_id>Event ' + ip + '</query_id>\n';
			s += '<query_type>EVENT</query_type>\n';
			s += '<query_name>Event ' + ip + '</query_name>\n';
			s += '<query_timing>SAMEINSTANCENUM</query_timing>\n';
			s += '<specificity_scale>0</specificity_scale>\n';
		}

		for (var p = 0; p < panel_cnt; p++) 
		{
			if (panel_list[p].items.length > 0) {
				s += '\t<panel>\n';
				s += '\t\t<panel_number>' + (p + 1) + '</panel_number>\n';
				// date range constraints
				//if (panel_list[p].dateFrom) {
				//	s += '\t\t<panel_date_from>'+panel_list[p].dateFrom.Year+'-'+padNumber(panel_list[p].dateFrom.Month,2)+'-'+padNumber(panel_list[p].dateFrom.Day,2)+'T00:00:00.000-05:00</panel_date_from>\n';
				//}
				//if (panel_list[p].dateTo) {
				//	s += '\t\t<panel_date_to>'+panel_list[p].dateTo.Year+'-'+padNumber(panel_list[p].dateTo.Month,2)+'-'+padNumber(panel_list[p].dateTo.Day,2)+'T00:00:00.000-05:00</panel_date_to>\n';
				//}
				s += "\t\t<panel_accuracy_scale>" + panel_list[p].relevance + "</panel_accuracy_scale>\n";
				// Exclude constraint (invert flag)
				if (panel_list[p].exclude) {
					s += '\t\t<invert>1</invert>\n';
				} else {
					s += '\t\t<invert>0</invert>\n';
				}
				// Panel Timing
				s += '\t\t<panel_timing>' + panel_list[p].timing + '</panel_timing>\n';
				// Occurs constraint
				s += '\t\t<total_item_occurrences>' + ((panel_list[p].occurs * 1) + 1) + '</total_item_occurrences>\n';
				// Concepts
				for (i = 0; i < panel_list[p].items.length; i++) { // BUG FIX: WEBCLIENT-153 (Added i2b2.h.Escape() to all names/tooltips)
					var sdxData = panel_list[p].items[i];
					if (sdxData.sdxInfo.sdxType =="WRKF")
						break;
					s += '\t\t<item>\n';
					if (panel_list[p].items[i].dateFrom || panel_list[p].items[i].dateTo) { // BUG FIX: WEBCLIENT-136
						s += '\t\t\t<constrain_by_date>\n';
						if (panel_list[p].items[i].dateFrom) {
							s += '\t\t\t\t<date_from>' + panel_list[p].items[i].dateFrom.Year + '-' + padNumber(panel_list[p].items[i].dateFrom.Month, 2) + '-' + padNumber(panel_list[p].items[i].dateFrom.Day, 2) + 'T00:00:00.000-05:00</date_from>\n';

						}
						if (panel_list[p].items[i].dateTo) {
							s += '\t\t\t\t<date_to>' + panel_list[p].items[i].dateTo.Year + '-' + padNumber(panel_list[p].items[i].dateTo.Month, 2) + '-' + padNumber(panel_list[p].items[i].dateTo.Day, 2) + 'T00:00:00.000-05:00</date_to>\n';
						}
						s += '\t\t\t</constrain_by_date>\n';
					}
					switch (sdxData.sdxInfo.sdxType) {
					case "QM":
						if (sdxData.origData.id.startsWith("masterid")) // BUG FIX: WEBCLIENT-149
							s += '\t\t\t<item_key>' + sdxData.origData.id + '</item_key>\n';
						else
							s += '\t\t\t<item_key>masterid:' + sdxData.origData.id + '</item_key>\n';
						s += '\t\t\t<item_name>' + i2b2.h.Escape(sdxData.origData.title) + '</item_name>\n';
						s += '\t\t\t<tooltip>' + i2b2.h.Escape(sdxData.origData.name) + '</tooltip>\n';
						s += '\t\t\t<item_is_synonym>false</item_is_synonym>\n';
						s += '\t\t\t<hlevel>0</hlevel>\n';
						break;
					case "PRS":
						s += '\t\t\t<item_key>patient_set_coll_id:' + sdxData.sdxInfo.sdxKeyValue + '</item_key>\n';
						s += '\t\t\t<item_name>' + i2b2.h.Escape(sdxData.sdxInfo.sdxDisplayName) + '</item_name>\n';
						s += '\t\t\t<tooltip>' + i2b2.h.Escape(sdxData.sdxInfo.sdxDisplayName) + '</tooltip>\n';
						s += '\t\t\t<item_is_synonym>false</item_is_synonym>\n';
						s += '\t\t\t<hlevel>0</hlevel>\n';
						break;
					case "ENS":
						s += '\t\t\t<item_key>patient_set_enc_id:' + sdxData.sdxInfo.sdxKeyValue + '</item_key>\n';
						s += '\t\t\t<item_name>' + i2b2.h.Escape(sdxData.sdxInfo.sdxDisplayName) + '</item_name>\n';
						s += '\t\t\t<tooltip>' + i2b2.h.Escape(sdxData.sdxInfo.sdxDisplayName) + '</tooltip>\n';
						s += '\t\t\t<item_is_synonym>false</item_is_synonym>\n';
						s += '\t\t\t<hlevel>0</hlevel>\n';
						break;
					case "PR":
						s += '\t\t\t<item_key>PATIENT:HIVE:' + sdxData.sdxInfo.sdxKeyValue + '</item_key>\n';
						s += '\t\t\t<item_name>' + sdxData.sdxInfo.sdxDisplayName + '</item_name>\n';
						s += '\t\t\t<tooltip>' + sdxData.sdxInfo.sdxDisplayName + '</tooltip>\n';
						s += '\t\t\t<item_is_synonym>false</item_is_synonym>\n';
						s += '\t\t\t<hlevel>0</hlevel>\n';
						break;					
					default:
						if (sdxData.origData.isModifier) {

							var modParent = sdxData.origData.parent;
							var level = sdxData.origData.level;
							var key = sdxData.origData.parent.key;
							var name = (sdxData.origData.parent.name != null ? i2b2.h.Escape(sdxData.origData.parent.name) : i2b2.h.Escape(sdxData.origData.name));
							var tooltip = sdxData.origData.tooltip;
							var itemicon = sdxData.origData.hasChildren;
							while (modParent != null) {
								if (modParent.isModifier) {
									modParent = modParent.parent;
								} else {
									level = modParent.level;
									key = modParent.key;
									name = modParent.name;
									tooltip = modParent.tooltip;
									itemicon = modParent.hasChildren;
									break;
								}
							}

							s += '\t\t\t<hlevel>' + level + '</hlevel>\n';
							s += '\t\t\t<item_key>' + key + '</item_key>\n';
							s += '\t\t\t<item_name>' + i2b2.h.Escape(name) + '</item_name>\n';
							// (sdxData.origData.newName != null ? sdxData.origData.newName : sdxData.origData.name) + '</item_name>\n';
							s += '\t\t\t<tooltip>' + i2b2.h.Escape(tooltip) + '</tooltip>\n';
							s += '\t\t\t<item_icon>' + itemicon + '</item_icon>\n';
							s += '\t\t\t<class>ENC</class>\n';

							s += '\t\t\t\t<constrain_by_modifier>\n';
							s += '\t\t\t\t\t<modifier_name>' + sdxData.origData.name + '</modifier_name>\n';
							s += '\t\t\t\t\t<applied_path>' + sdxData.origData.applied_path + '</applied_path>\n';
							s += '\t\t\t\t\t<modifier_key>' + sdxData.origData.key + '</modifier_key>\n';
							if (sdxData.ModValues) {
								s += this.getValues(sdxData.ModValues);
							}

							s += '\t\t\t\t</constrain_by_modifier>\n';
						} else {
							sdxData.origData.key = (sdxData.origData.key).replace(/</g, "&lt;");
							sdxData.origData.name = (sdxData.origData.name).replace(/</g, "&lt;");
							if (undefined != sdxData.origData.tooltip)
								sdxData.origData.tooltip = (sdxData.origData.tooltip).replace(/</g, "&lt;");
							s += '\t\t\t<hlevel>' + sdxData.origData.level + '</hlevel>\n';
							//s += '\t\t\t<item_name>' + (sdxData.origData.newName != null ? i2b2.h.Escape(sdxData.origData.newName) : i2b2.h.Escape(sdxData.origData.name)) + '</item_name>\n';
							s += '\t\t\t<item_name>' + (sdxData.origData.name != null ? i2b2.h.Escape(sdxData.origData.name) : i2b2.h.Escape(sdxData.origData.newName)) + '</item_name>\n';
							s += '\t\t\t<item_key>' + sdxData.origData.key + '</item_key>\n';
							s += '\t\t\t<tooltip>' + i2b2.h.Escape(sdxData.origData.tooltip) + '</tooltip>\n'; // BUG FIX: WEBCLIENT-135 (Escape tooltip)
							s += '\t\t\t<class>ENC</class>\n';
							s += '\t\t\t<item_icon>' + sdxData.origData.hasChildren + '</item_icon>\n';
						}
					try {
						var t = i2b2.h.XPath(sdxData.origData.xmlOrig, 'descendant::synonym_cd/text()');
						t = (t[0].nodeValue == "Y");
					} catch (e) {
						var t = "false";
					}
					s += '\t\t\t<item_is_synonym>' + t + '</item_is_synonym>\n';

					if (sdxData.LabValues) {
						//s += '\t\t\t<constrain_by_value>\n';
						s += this.getValues(sdxData.LabValues);
					}

					break;
					}
					//TODO add contraint to the item in the future
					/*
                        s += '\t\t\t<constrain_by_date>\n';
                        if (panel_list[p].dateFrom) {
                            s += '\t\t\t\t<date_from>'+panel_list[p].dateFrom.Year+'-'+padNumber(panel_list[p].dateFrom.Month,2)+'-'+padNumber(panel_list[p].dateFrom.Day,2)+'Z</date_from>\n';
                        }
                        if (panel_list[p].dateTo) {
                            s += '\t\t\t\t<date_to>'+panel_list[p].dateTo.Year+'-'+padNumber(panel_list[p].dateTo.Month,2)+'-'+padNumber(panel_list[p].dateTo.Day,2)+'Z</date_to>\n';
                        }
                        s += '\t\t\t</constrain_by_date>\n';	
					 */
					s += '\t\t</item>\n';
					if (i == 0) {
						if (undefined != sdxData.origData.name) {
							auto_query_name += sdxData.origData.name.substring(0, auto_query_name_len);
						} else if (undefined != sdxData.origData.title) {
							auto_query_name += sdxData.origData.title.substring(0, auto_query_name_len);
						} else {
							auto_query_name += "new query";
						}

						if (p < panel_cnt - 1) { auto_query_name += '-'; }
					}
				}
				s += '\t</panel>\n';
			}
		}
		if (isTemporal && ip > 0)
			s += '</subquery>\n ';
		return s;
	};


//	================================================================================================== //
//	CREATING XML for the query users have built. ======================================================//
//	================================================================================================== //

//	Main entry to generating query XML. Decides which XML-generation subroutine to run based on UI states //
	this._getQueryXML = function(queryName) 
	{
		if (i2b2.CRC.view.QT.isShowingTemporalQueryUI && !i2b2.CRC.view.QT.isShowingClassicTemporalQueryUI)
			return this._getSimpleTemporalQueryXML( queryName );
		else 
			return this._getOtherQueryXML( queryName );
	}

	// tdw9 1707c: method to create XML from SIMPLE temporal query UI
	this.makeQueryXMLFromTemporalQueryUI = function( queryName )
	{
		var xml = "";
		// add population XML
		var panel_list = i2b2.CRC.model.queryCurrent.panels[0]; //i2b2.CRC.ctrlr.QT.temporalGroup];
		var panel_cnt = panel_list.length;
		var auto_query_name_len = 15;
		var auto_query_name = '';

		if (this.queryTiming == "TEMPORAL") {
			isTemporal = true;	
		}
		if (panel_cnt > 0) {
			auto_query_name_len = Math.floor(15/panel_cnt);
			if (auto_query_name_len < 1) {auto_query_name_len = 1;}
		}

		xml += this.getSubqueryXML(true, 0, auto_query_name_len); // build the population part of the query

		// add temporal XML
		var events = jQuery(".temporalEvent");
		for ( var i = 0; i < i2b2.CRC.view.QT.temporalRelationships.length; i++ )
			xml = xml + i2b2.CRC.view.QT.temporalRelationships[i].makeXML();
		for ( var i = 0; i < events.length; i++ )
			xml = xml + jQuery(events[i]).data("event").makeXML();
		return xml;
	};

	// go through each event and grab the first concept's name, cutDown to size, and concatanate
	this.makeAutoQueryNameForTemporalQueryUI = function()
	{
		var autoQueryName = "";
		var auto_query_name_len = 15;
		var events = jQuery(".temporalEvent");
		var populationPanels = i2b2.CRC.model.queryCurrent.panels[0];
		var nameParts = Math.max(1,populationPanels.length);

		auto_query_name_len = Math.floor(15/nameParts);
		if (auto_query_name_len < 1) {auto_query_name_len = 1;}

		// build the population portion of the query name
		for (var i = 0; i < populationPanels.length; i++ )
		{
			var sdxData = populationPanels[i].items[0];
			if (populationPanels[i].items.length > 0) {
				if (undefined != sdxData.origData.name)
					autoQueryName += sdxData.origData.name.substring(0,auto_query_name_len);
				else if (undefined != sdxData.origData.title)
					autoQueryName += sdxData.origData.title.substring(0,auto_query_name_len);					
				else
					autoQueryName += "new query";
				if ( i < populationPanels.length-1)
					autoQueryName += "-";
			}
		}

		// build the temporal event portion of the query name
		for ( var i = 0; i < events.length; i++ )
		{
			var sdxData = jQuery(events[i]).data("event").panels[0].items[0];
			if (undefined != sdxData.origData.name)
				autoQueryName += sdxData.origData.name.substring(0,auto_query_name_len);
			else if (undefined != sdxData.origData.title)
				autoQueryName += sdxData.origData.title.substring(0,auto_query_name_len);					
			else
				autoQueryName += "new query";
		}
		return autoQueryName;
	};

//	SIMPLE TEMPORAL QUERY //    
//	tdw9 1707c: 1. clear UI of empty events and 2.invoke method to create XML based on new temporal query UI
	this._getSimpleTemporalQueryXML = function(queryName)
	{
		i2b2.CRC.view.QT.deleteEmptyEvents();
		var xml = "<query_definition>\n" + 
		"\t<query_name>(t) " + queryName + "</query_name>\n" +
		"\t<query_timing>ANY</query_timing>\n" +
		"\t<specificity_scale>0</specificity_scale>\n";
		if (i2b2.PM.model.shrine_domain) 
			xml += '\t<use_shrine>1</use_shrine>\n'; 
		xml += this.makeQueryXMLFromTemporalQueryUI( queryName );
		xml += "</query_definition>\n";

		this.queryMsg = {};
		this.queryMsg.queryAutoName = this.makeAutoQueryNameForTemporalQueryUI();    
		if (undefined === queryName)
			this.queryMsg.queryName = this.queryNameDefault;
		else
			this.queryMsg.queryName = queryName;     
		this.queryMsg.queryXML = xml;
		return (this.queryMsg);
	};

//	tdw9 1707c: ALL OTHER QUERIES //
	this._getOtherQueryXML = function(queryName)
	{
		//var returnError = {};
		var i;
		var isTemporal = false;
		var el;
		var concept;
		var panel_list = i2b2.CRC.model.queryCurrent.panels[0]; //i2b2.CRC.ctrlr.QT.temporalGroup];
		var panel_cnt = panel_list.length;
		var auto_query_name_len = 15;
		var auto_query_name = '';

		if (this.queryTiming == "TEMPORAL") {
			isTemporal = true;	
		}
		if (panel_cnt > 0) {
			auto_query_name_len = Math.floor(15/panel_cnt);
			if (auto_query_name_len < 1) {auto_query_name_len = 1;}
		}
		// build Query XML
		var s = '<query_definition>\n';
		if (isTemporal)
		{
			queryName = '(t) ' + queryName;	
		}
		s += '\t<query_name>' + i2b2.h.Escape(queryName) + '</query_name>\n';
		if (this.queryTiming == "SAMEVISIT")
		{
			s += '\t<query_timing>SAMEVISIT</query_timing>\n';			
		} else if (this.queryTiming == "ANY") {
			s += '\t<query_timing>ANY</query_timing>\n';						
		} else if (this.queryTiming == "TEMPORAL") {
			s += '\t<query_timing>ANY</query_timing>\n';						
		} else {
			s += '\t<query_timing>SAMEINSTANCENUM</query_timing>\n';
		}
		s += '\t<specificity_scale>0</specificity_scale>\n';
		if (i2b2.PM.model.shrine_domain) { s += '\t<use_shrine>1</use_shrine>\n'; }

		for (var ip = 0; ip < i2b2.CRC.model.queryCurrent.panels.length; ip++)
		{
			panel_list = i2b2.CRC.model.queryCurrent.panels[ip]; //i2b2.CRC.ctrlr.QT.temporalGroup];
			panel_cnt = panel_list.length;
			if (isTemporal && ip > 0)
			{
				//if equal to one then add subquery_contraint
				if (ip == 1)
				{
					for (var tb=0; tb <= this.tenporalBuilders; tb++) {
						s += '\t<subquery_constraint>\n';
						s += '\t\t<first_query>\n';
						s +=  '\t\t\t<query_id>' + $('instancevent1[' + tb + ']').options[$('instancevent1[' + tb + ']').selectedIndex].text + '</query_id>\n';
						s +=  '\t\t\t<join_column>' + $('preloc1[' + tb + ']').options[$('preloc1[' + tb + ']').selectedIndex].value + '</join_column>\n';
						s +=  '\t\t\t<aggregate_operator>' + $('instanceopf1[' + tb + ']').options[$('instanceopf1[' + tb + ']').selectedIndex].value + '</aggregate_operator>\n';
						s += '\t\t</first_query>\n';
						s +=  '\t\t<operator>' + $('postloc[' + tb + ']').options[$('postloc[' + tb + ']').selectedIndex].value + '</operator>\n';
						s += '\t\t<second_query>\n';
						s +=  '\t\t\t<query_id>' + $('instancevent2[' + tb + ']').options[$('instancevent2[' + tb + ']').selectedIndex].text + '</query_id>\n';
						s +=  '\t\t\t<join_column>' + $('preloc2[' + tb + ']').options[$('preloc2[' + tb + ']').selectedIndex].value + '</join_column>\n';
						s +=  '\t\t\t<aggregate_operator>' + $('instanceopf2[' + tb + ']').options[$('instanceopf2[' + tb + ']').selectedIndex].value + '</aggregate_operator>\n';
						s += '\t\t</second_query>\n';
						if ( $('bytime1[' + tb + ']').checked)
						{
							s += '\t\t<span>\n';
							s += '\t\t\t<operator>' + $('byspan1[' + tb + ']').options[$('byspan1[' + tb + ']').selectedIndex].value + '</operator>\n';
							s += '\t\t\t<span_value>' + $('bytimevalue1[' + tb + ']').value + '</span_value>\n';
							s += '\t\t\t<units>' + $('bytimeunit1[' + tb + ']').options[$('bytimeunit1[' + tb + ']').selectedIndex].value + '</units>\n';
							s += '\t\t</span>\n';
						}
						if ( $('bytime2[' + tb + ']').checked)
						{
							s += '\t\t<span>\n';
							s += '\t\t\t<operator>' + $('byspan2[' + tb + ']').options[$('byspan2[' + tb + ']').selectedIndex].value + '</operator>\n';
							s += '\t\t\t<span_value>' + $('bytimevalue2[' + tb + ']').value + '</span_value>\n';
							s += '\t\t\t<units>' + $('bytimeunit2[' + tb + ']').options[$('bytimeunit2[' + tb + ']').selectedIndex].value + '</units>\n';
							s += '\t\t</span>\n';
						}
						s += '\t</subquery_constraint>\n';
					}
				}
				if (panel_list[0].items.length == 0)
					break;
				s += '<subquery>\n ';	

				s += '<query_id>Event '+ ip +'</query_id>\n';
				s += '<query_type>EVENT</query_type>\n';
				s += '<query_name>Event '+ ip +'</query_name>\n';
				s += '<query_timing>SAMEINSTANCENUM</query_timing>\n';
				s += '<specificity_scale>0</specificity_scale>\n';
			}


			for (var p = 0; p < panel_cnt; p++) {
				if ( panel_list[p].items.length> 0) {
					s += '\t<panel>\n';
					s += '\t\t<panel_number>' + (p+1) + '</panel_number>\n';
					// date range constraints
					//if (panel_list[p].dateFrom) {
					//	s += '\t\t<panel_date_from>'+panel_list[p].dateFrom.Year+'-'+padNumber(panel_list[p].dateFrom.Month,2)+'-'+padNumber(panel_list[p].dateFrom.Day,2)+'T00:00:00.000-05:00</panel_date_from>\n';
					//}
					//if (panel_list[p].dateTo) {
					//	s += '\t\t<panel_date_to>'+panel_list[p].dateTo.Year+'-'+padNumber(panel_list[p].dateTo.Month,2)+'-'+padNumber(panel_list[p].dateTo.Day,2)+'T00:00:00.000-05:00</panel_date_to>\n';
					//}
					s += "\t\t<panel_accuracy_scale>" + panel_list[p].relevance + "</panel_accuracy_scale>\n";
					// Exclude constraint (invert flag)
					if (panel_list[p].exclude) {
						s += '\t\t<invert>1</invert>\n';
					} else {
						s += '\t\t<invert>0</invert>\n';
					}
					// Panel Timing
					s += '\t\t<panel_timing>' + panel_list[p].timing + '</panel_timing>\n';
					// Occurs constraint
					s += '\t\t<total_item_occurrences>'+((panel_list[p].occurs*1)+1)+'</total_item_occurrences>\n';
					// Concepts
					for (i=0; i < panel_list[p].items.length; i++) { // BUG FIX: WEBCLIENT-153 (Added i2b2.h.Escape() to all names/tooltips)
						var sdxData = panel_list[p].items[i];
						if (sdxData.origData.parent ==  undefined  || sdxData.origData.parent.encapType == undefined || sdxData.origData.parent.encapType != "FOLDER") {
							s += '\t\t<item>\n';
							if(panel_list[p].items[i].dateFrom || panel_list[p].items[i].dateTo){ // BUG FIX: WEBCLIENT-136
								s += '\t\t\t<constrain_by_date>\n';
								if (panel_list[p].items[i].dateFrom) {
									s += '\t\t\t\t<date_from>'+panel_list[p].items[i].dateFrom.Year+'-'+padNumber(panel_list[p].items[i].dateFrom.Month,2)+'-'+padNumber(panel_list[p].items[i].dateFrom.Day,2)+'T00:00:00.000-05:00</date_from>\n';

								}
								if (panel_list[p].items[i].dateTo) {
									s += '\t\t\t\t<date_to>'+panel_list[p].items[i].dateTo.Year+'-'+padNumber(panel_list[p].items[i].dateTo.Month,2)+'-'+padNumber(panel_list[p].items[i].dateTo.Day,2)+'T00:00:00.000-05:00</date_to>\n';
								}
								s += '\t\t\t</constrain_by_date>\n';
							}
							switch(sdxData.sdxInfo.sdxType) {
							case "QM":
								if(sdxData.origData.id.startsWith("masterid")) // BUG FIX: WEBCLIENT-149
									s += '\t\t\t<item_key>' + sdxData.origData.id + '</item_key>\n';
								else
									s += '\t\t\t<item_key>masterid:' + sdxData.origData.id + '</item_key>\n';
								s += '\t\t\t<item_name>' + i2b2.h.Escape(sdxData.origData.title) + '</item_name>\n';
								s += '\t\t\t<tooltip>' + i2b2.h.Escape(sdxData.origData.name) + '</tooltip>\n';
								s += '\t\t\t<item_is_synonym>false</item_is_synonym>\n';
								s += '\t\t\t<hlevel>0</hlevel>\n';
								break;
							case "PRS":	
								s += '\t\t\t<item_key>patient_set_coll_id:' + sdxData.sdxInfo.sdxKeyValue + '</item_key>\n';
								s += '\t\t\t<item_name>' + i2b2.h.Escape(sdxData.sdxInfo.sdxDisplayName) + '</item_name>\n';
								s += '\t\t\t<tooltip>' + i2b2.h.Escape(sdxData.sdxInfo.sdxDisplayName) + '</tooltip>\n';
								s += '\t\t\t<item_is_synonym>false</item_is_synonym>\n';
								s += '\t\t\t<hlevel>0</hlevel>\n';
								break;
							case "PR":
								s += '\t\t\t<item_key>PATIENT:HIVE:' + sdxData.sdxInfo.sdxKeyValue + '</item_key>\n';
								s += '\t\t\t<item_name>' + sdxData.sdxInfo.sdxDisplayName + '</item_name>\n';
								s += '\t\t\t<tooltip>' + sdxData.sdxInfo.sdxDisplayName + '</tooltip>\n';
								s += '\t\t\t<item_is_synonym>false</item_is_synonym>\n';
								s += '\t\t\t<hlevel>0</hlevel>\n';
								break;
							case "WRKF_OLD":
								var varInput = {
									parent_key_value: sdxData.sdxInfo.sdxKeyValue,
									result_wait_time: 180
							};
								var results = i2b2.WORK.ajax.getChildren("WORK:Workplace", varInput );

								var nlst = i2b2.h.XPath(results.refXML, "//folder[name and work_xml and share_id and index and visual_attributes]");
								for (var i = 0; i < nlst.length; i++) {
									if (i != 0)
									{
										s += '\t\t</item>\n';
										if (i != nlst.length)
											s += '\t\t<item>\n';
									}

									if (i2b2.h.getXNodeVal(nlst[i], "work_xml_i2b2_type") == 'CONCEPT') {

										var work_xml= i2b2.h.XPath(nlst[i], "work_xml/descendant::concept/..");
										for (var j=0; j < work_xml.length; j++) {
											if (i2b2.h.getXNodeVal(work_xml[j], "level") != "undefined") {
												s += '\t\t\t<hlevel>' + i2b2.h.getXNodeVal(work_xml[j], "level") + '</hlevel>\n';
												s += '\t\t\t<item_name>' + i2b2.h.getXNodeVal(work_xml[j], "name")  + '</item_name>\n';
												s += '\t\t\t<item_key>' + i2b2.h.getXNodeVal(work_xml[j], "key") + '</item_key>\n';
												s += '\t\t\t<tooltip>' + i2b2.h.getXNodeVal(work_xml[j], "tooltip")  + '</tooltip>\n';
												s += '\t\t\t<class>ENC</class>\n';
												s += '\t\t\t<item_icon>' + i2b2.h.getXNodeVal(work_xml[j], "visualattributes") + '</item_icon>\n';
												try {
													var t = i2b2.h.XPath(work_xml[j],'descendant::synonym_cd/text()');
													t = (t[0].nodeValue=="Y");
												} catch(e) {
													var t = "false";
												}
												s += '\t\t\t<item_is_synonym>'+t+'</item_is_synonym>\n';
											}
										}
									} else if (i2b2.h.getXNodeVal(nlst[i], "work_xml_i2b2_type") == 'PATIENT') {

										var work_xml= i2b2.h.XPath(nlst[i], "work_xml/descendant::patient/..");
										for (var j=0; j < work_xml.length; j++) {
											if (i2b2.h.getXNodeVal(work_xml[j], "patient_id") != "undefined") {
												s += '\t\t\t<item_key>PATIENT:HIVE:' +  i2b2.h.getXNodeVal(work_xml[j], "patient_id") + '</item_key>\n';
												s += '\t\t\t<item_name>' +  i2b2.h.getXNodeVal(work_xml[j], "patient_id") + '</item_name>\n';
												s += '\t\t\t<tooltip>' +  i2b2.h.getXNodeVal(work_xml[j], "patient_id") + '</tooltip>\n';
												s += '\t\t\t<item_is_synonym>false</item_is_synonym>\n';
												s += '\t\t\t<hlevel>0</hlevel>\n';

											}
										}
									} else if (i2b2.h.getXNodeVal(nlst[i], "work_xml_i2b2_type") == 'PREV_QUERY') {
										var work_xml= i2b2.h.XPath(nlst[i], "work_xml");
										for (var j=0; j < work_xml.length; j++) {
											if (i2b2.h.getXNodeVal(work_xml[j], "query_master_id") != "undefined") {
												s += '\t\t\t<item_key>masterid:' +  i2b2.h.getXNodeVal(work_xml[j], "query_master_id") + '</item_key>\n';
												s += '\t\t\t<item_name>' +  i2b2.h.getXNodeVal(work_xml[j], "name") + '</item_name>\n';
												s += '\t\t\t<tooltip>' +  i2b2.h.getXNodeVal(work_xml[j], "name") + '</tooltip>\n';
												s += '\t\t\t<item_is_synonym>false</item_is_synonym>\n';
												s += '\t\t\t<hlevel>0</hlevel>\n';

											}
										}
									} else if (i2b2.h.getXNodeVal(nlst[i], "work_xml_i2b2_type") == 'PATIENT_COLL') {
										var work_xml= i2b2.h.XPath(nlst[i], "work_xml");
										for (var j=0; j < work_xml.length; j++) {
											if (i2b2.h.getXNodeVal(work_xml[j], "result_instance_id") != "undefined") {
												s += '\t\t\t<item_key>patient_set_col_id:' +  i2b2.h.getXNodeVal(work_xml[j], "result_instance_id") + '</item_key>\n';
												s += '\t\t\t<item_name>' +  i2b2.h.getXNodeVal(work_xml[j], "description") + '</item_name>\n';
												s += '\t\t\t<tooltip>' +  i2b2.h.getXNodeVal(work_xml[j], "description") + '</tooltip>\n';
												s += '\t\t\t<item_is_synonym>false</item_is_synonym>\n';
												s += '\t\t\t<hlevel>0</hlevel>\n';

											}
										}
									} else if (i2b2.h.getXNodeVal(nlst[i], "work_xml_i2b2_type") == 'ENCOUNTER_COLL') {
										var work_xml= i2b2.h.XPath(nlst[i], "work_xml");
										for (var j=0; j < work_xml.length; j++) {
											if (i2b2.h.getXNodeVal(work_xml[j], "result_instance_id") != "undefined") {
												s += '\t\t\t<item_key>encounter_set_col_id:' +  i2b2.h.getXNodeVal(work_xml[j], "result_instance_id") + '</item_key>\n';
												s += '\t\t\t<item_name>' +  i2b2.h.getXNodeVal(work_xml[j], "description") + '</item_name>\n';
												s += '\t\t\t<tooltip>' +  i2b2.h.getXNodeVal(work_xml[j], "description") + '</tooltip>\n';
												s += '\t\t\t<item_is_synonym>false</item_is_synonym>\n';
												s += '\t\t\t<hlevel>0</hlevel>\n';

											}
										}
									}							

								}
								break;
							case "ENS":	
								s += '\t\t\t<item_key>patient_set_enc_id:' + sdxData.sdxInfo.sdxKeyValue + '</item_key>\n';
								s += '\t\t\t<item_name>' + i2b2.h.Escape(sdxData.sdxInfo.sdxDisplayName) + '</item_name>\n';
								s += '\t\t\t<tooltip>' + i2b2.h.Escape(sdxData.sdxInfo.sdxDisplayName) + '</tooltip>\n';
								s += '\t\t\t<item_is_synonym>false</item_is_synonym>\n';
								s += '\t\t\t<hlevel>0</hlevel>\n';
								break;
							default:
								if (sdxData.origData.isModifier) {

									var modParent = sdxData.origData.parent;
									var level = sdxData.origData.level;
									var key = sdxData.origData.parent.key;
									var name = (sdxData.origData.parent.name != null ? i2b2.h.Escape(sdxData.origData.parent.name) : i2b2.h.Escape(sdxData.origData.name)) ;
									var tooltip = sdxData.origData.tooltip;
									var itemicon = sdxData.origData.hasChildren;
									while  (modParent != null)
									{
										if (modParent.isModifier)
										{
											modParent = modParent.parent;
										} else {
											level = modParent.level;
											key = modParent.key;
											name = modParent.name;
											tooltip = modParent.tooltip;
											itemicon = modParent.hasChildren;
											break;
										}
									}							

									s += '\t\t\t<hlevel>' + level + '</hlevel>\n';
									s += '\t\t\t<item_key>' + i2b2.h.Escape(key) + '</item_key>\n';
									s += '\t\t\t<item_name>' +  i2b2.h.Escape(name) + '</item_name>\n';
									// (sdxData.origData.newName != null ? sdxData.origData.newName : sdxData.origData.name) + '</item_name>\n';
									s += '\t\t\t<tooltip>' + i2b2.h.Escape(tooltip) + '</tooltip>\n';
									s += '\t\t\t<item_icon>' + itemicon + '</item_icon>\n';
									s += '\t\t\t<class>ENC</class>\n';

									s += '\t\t\t\t<constrain_by_modifier>\n';
									s += '\t\t\t\t\t<modifier_name>' + sdxData.origData.name + '</modifier_name>\n';
									s += '\t\t\t\t\t<applied_path>' + sdxData.origData.applied_path + '</applied_path>\n';
									s += '\t\t\t\t\t<modifier_key>' + sdxData.origData.key + '</modifier_key>\n';
									if (sdxData.ModValues)
									{
										s += this.getValues( sdxData.ModValues);
									}

									s += '\t\t\t\t</constrain_by_modifier>\n';					
								} else {
									s += '\t\t\t<hlevel>' + sdxData.origData.level + '</hlevel>\n';
									//s += '\t\t\t<item_name>' + (sdxData.origData.newName != null ? i2b2.h.Escape(sdxData.origData.newName) : i2b2.h.Escape(sdxData.origData.name)) + '</item_name>\n';
									s += '\t\t\t<item_name>' + (sdxData.origData.name != null ? i2b2.h.Escape(sdxData.origData.name) : i2b2.h.Escape(sdxData.origData.newName)) + '</item_name>\n';
									s += '\t\t\t<item_key>' + i2b2.h.Escape(sdxData.origData.key) + '</item_key>\n'; // BUG FIX: WEBCLIENT-227
									s += '\t\t\t<tooltip>' + i2b2.h.Escape(sdxData.origData.tooltip) + '</tooltip>\n'; // BUG FIX: WEBCLIENT-135 (Escape tooltip)
									s += '\t\t\t<class>ENC</class>\n';
									s += '\t\t\t<item_icon>' + sdxData.origData.hasChildren + '</item_icon>\n';	
								}
							try {
								var t = i2b2.h.XPath(sdxData.origData.xmlOrig,'descendant::synonym_cd/text()');
								t = (t[0].nodeValue=="Y");
							} catch(e) {
								var t = "false";
							}
							s += '\t\t\t<item_is_synonym>'+t+'</item_is_synonym>\n';

							if (sdxData.LabValues) {
								//s += '\t\t\t<constrain_by_value>\n';
								s += this.getValues( sdxData.LabValues);
							}

							break;
							}
							//TODO add contraint to the item in the future
							/*
						s += '\t\t\t<constrain_by_date>\n';
						if (panel_list[p].dateFrom) {
							s += '\t\t\t\t<date_from>'+panel_list[p].dateFrom.Year+'-'+padNumber(panel_list[p].dateFrom.Month,2)+'-'+padNumber(panel_list[p].dateFrom.Day,2)+'Z</date_from>\n';
						}
						if (panel_list[p].dateTo) {
							s += '\t\t\t\t<date_to>'+panel_list[p].dateTo.Year+'-'+padNumber(panel_list[p].dateTo.Month,2)+'-'+padNumber(panel_list[p].dateTo.Day,2)+'Z</date_to>\n';
						}
						s += '\t\t\t</constrain_by_date>\n';	
							 */
							s += '\t\t</item>\n';
							if (i==0) {
								if (undefined != sdxData.origData.name) {
									auto_query_name += sdxData.origData.name.substring(0,auto_query_name_len);
								} else if (undefined != sdxData.origData.title) {
									auto_query_name += sdxData.origData.title.substring(0,auto_query_name_len);					
								} else {
									auto_query_name += "new query";
								}

								if (p < panel_cnt-1) {auto_query_name += '-';}
							}
						}
					}
					s += '\t</panel>\n';
				}
			}
			if (isTemporal && ip > 0)
			{
				s += '</subquery>\n ';	
			}	
			if (isTemporal == false)
			{
				break;
			}
		}
		s += '</query_definition>\n';
		this.queryMsg = {};
		this.queryMsg.queryAutoName = auto_query_name;
		if (undefined===queryName) {
			this.queryMsg.queryName = this.queryNameDefault;
		} else {
			this.queryMsg.queryName = queryName;				
		}
		this.queryMsg.queryXML = s;
		return(this.queryMsg);
	};


//	================================================================================================== //
//	END routines for generating query XML ============================================================ //
//	================================================================================================== //

	this.getValues = function(lvd) {
		var s = '\t\t\t<constrain_by_value>\n';
		//var lvd = sdxData.LabValues;
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
				//sEnum = sEnum.join("\", \"");
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

	this.getWorkplaceFolder = function(folder_id) {
		var s = '';
		var scopedCallback = new i2b2_scopedCallback();
		scopedCallback.scope = i2b2.WORK;
		scopedCallback.callback = function(results){
			i2b2.WORK.view.main.queryResponse = results.msgResponse;
			i2b2.WORK.view.main.queryRequest = results.msgRequest;
			// var cl_yuiCallback = onCompleteCallback;
			var nlst = i2b2.h.XPath(results.refXML, "//folder[name and work_xml and share_id and index and visual_attributes]");
			for (var i = 0; i < nlst.length; i++) {
				var work_xml= i2b2.h.XPath(nlst[i], "work_xml/descendant::concept/..");//[0].childNodes;
				if (i != 0)
				{
					s += '\t\t</item>\n';
					if (i != nlst.length)
						s += '\t\t<item>\n';
				}

				if (i2b2.h.getXNodeVal(nlst[i], "work_xml_i2b2_type") == 'CONCEPT') {

					for (var j=0; j < work_xml.length; j++) {
						if (i2b2.h.getXNodeVal(work_xml[j], "level") != "undefined") {
							s += '\t\t\t<hlevel>' + i2b2.h.getXNodeVal(work_xml[j], "level") + '</hlevel>\n';
							s += '\t\t\t<item_name>' + i2b2.h.getXNodeVal(work_xml[j], "name")  + '</item_name>\n';
							s += '\t\t\t<item_key>' + i2b2.h.getXNodeVal(work_xml[j], "key") + '</item_key>\n';
							s += '\t\t\t<tooltip>' + i2b2.h.getXNodeVal(work_xml[j], "tooltip")  + '</tooltip>\n'; 
							s += '\t\t\t<class>ENC</class>\n';
							s += '\t\t\t<item_icon>' + i2b2.h.getXNodeVal(work_xml[j], "visualattributes") + '</item_icon>\n';
							try {
								var t = i2b2.h.XPath(work_xml[j],'descendant::synonym_cd/text()');
								t = (t[0].nodeValue=="Y");
							} catch(e) {
								var t = "false";
							}
							s += '\t\t\t<item_is_synonym>'+t+'</item_is_synonym>\n';
						}
					}




				}

				//    var tmpNode = i2b2.WORK.view.main._generateTvNode(nodeData.name, nodeData, cl_tvParentNode);
			}

			return s;
		};
		var varInput = {
				parent_key_value: folder_id,
				result_wait_time: 180
		};
		i2b2.WORK.ajax.getChildren("WORK:Workplace", varInput, scopedCallback);

		//return s;
	}



//	================================================================================================== //
	this.panelAdd = function(yuiTree) {
		// this function is used to create a new panel, it initializes the data structure in the 

		if (!i2b2.CRC.model.queryCurrent.panels) { 
			i2b2.CRC.model.queryCurrent.panels = [];
			i2b2.CRC.model.queryCurrent.panels[0] = new Array();
			i2b2.CRC.model.queryCurrent.panels[1] = new Array();
			i2b2.CRC.model.queryCurrent.panels[2] = new Array();

			//		i2b2.CRC.model.queryCurrent.panels = new Array(new Array());	
		}
		var dm = i2b2.CRC.model.queryCurrent;
		var pi = dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup].length;
		if (pi == undefined)
		{
			dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup] = new Array();
			pi = 0;
		}
		var tTiming = i2b2.CRC.ctrlr.QT.queryTiming;
		if ((tTiming == "TEMPORAL") && (i2b2.CRC.ctrlr.QT.temporalGroup > 0))
			tTiming = "SAMEINSTANCENUM";
		if ((tTiming == "TEMPORAL") && (i2b2.CRC.ctrlr.QT.temporalGroup == 0))
			tTiming = "ANY";



		// setup the data model for this panel
		dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][pi] = {};
		dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][pi].dateTo = false;
		dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][pi].dateFrom = false;
		dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][pi].exclude = false;
		dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][pi].occurs = '0';
		dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][pi].relevance = '100';
		dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][pi].timing = tTiming; // i2b2.CRC.ctrlr.QT.queryTiming; //'ANY';
		dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][pi].items = [];
		// create a treeview root node and connect it to the treeview controller
		dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][pi].tvRootNode = new YAHOO.widget.RootNode(this.yuiTree);
		yuiTree.root = dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][pi].tvRootNode;
		dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][pi].tvRootNode.tree = yuiTree;
		yuiTree.setDynamicLoad(i2b2.CRC.ctrlr.QT._loadTreeDataForNode,1);


		if (dm.panels.length == 1)
		{
			var tTiming = i2b2.CRC.ctrlr.QT.queryTiming;
			if (i2b2.CRC.ctrlr.QT.queryTiming == "TEMPORAL")
				tTiming = "ANY";
			i2b2.CRC.ctrlr.QT.temporalGroup = 1;
			dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup] = {};	
			dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][pi] = {};
			dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][pi].dateTo = false;
			dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][pi].dateFrom = false;
			dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][pi].exclude = false;
			dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][pi].occurs = '0';
			dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][pi].relevance = '100';
			dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][pi].timing = tTiming; //i2b2.CRC.ctrlr.QT.queryTiming; //'ANY';
			dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][pi].items = [];
			// create a treeview root node and connect it to the treeview controller
			dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][pi].tvRootNode = new YAHOO.widget.RootNode(this.yuiTree);
			yuiTree.root = dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][pi].tvRootNode;
			dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][pi].tvRootNode.tree = yuiTree;
			yuiTree.setDynamicLoad(i2b2.CRC.ctrlr.QT._loadTreeDataForNode,1);
			i2b2.CRC.ctrlr.QT.temporalGroup = 2;
			if (i2b2.CRC.ctrlr.QT.queryTiming == "TEMPORAL")
				tTiming = "SAMEINSTANCENUM";

			dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup] = {};	
			dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][pi] = {};
			dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][pi].dateTo = false;
			dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][pi].dateFrom = false;
			dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][pi].exclude = false;
			dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][pi].occurs = '0';
			dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][pi].relevance = '100';
			dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][pi].timing =  tTiming; //i2b2.CRC.ctrlr.QT.queryTiming; //'ANY';
			dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][pi].items = [];
			// create a treeview root node and connect it to the treeview controller
			dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][pi].tvRootNode = new YAHOO.widget.RootNode(this.yuiTree);
			yuiTree.root = dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][pi].tvRootNode;
			dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][pi].tvRootNode.tree = yuiTree;
			yuiTree.setDynamicLoad(i2b2.CRC.ctrlr.QT._loadTreeDataForNode,1);
			i2b2.CRC.ctrlr.QT.temporalGroup = 0;

		}
		// update the count on the GUI
		this._redrawPanelCount();
		// return a reference to the new panel object
		this.doSetQueryName.call(this,'');
		return dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][pi];
	}

//	================================================================================================== //
	this._loadTreeDataForNode = function(node, onCompleteCallback) {
		i2b2.sdx.Master.LoadChildrenFromTreeview(node, onCompleteCallback);
	}

//	================================================================================================== //
	this.ToggleNode = function(divTarg, divTreeID) {
		// get the i2b2 data from the yuiTree node
		var tvTree = YAHOO.widget.TreeView.findTreeByChildDiv(divTarg);  // this is a custom extention found in "hive_helpers.js"
		var tvNode = tvTree.getNodeByProperty('nodeid', divTarg.id);
		tvNode.toggle();
	}

//	================================================================================================== //
	this.panelDelete = function(index) {
		// alter the data model's panel elements
		var dm = i2b2.CRC.model.queryCurrent;
		if(index <0 || index>=dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup].length) { return false;}
		dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup].splice(index,1);
		// redraw the panels
		this.doShowFrom(this.panelControllers[0].panelCurrentIndex);
		// BUG FIX: force the panels to fully reattach the yuiRootNode to the controllers
		for (var i=0; i<this.panelControllers.length; i++) {
			this.panelControllers[i].doRedraw();
		}		
		this._redrawPanelCount();
		this.doSetQueryName.call(this,'');
	}

//	================================================================================================== //
	this.doShowFrom = function(index_offset) {
		// have all panel controllers redraw using new index offest
		$('infoQueryStatusText').innerHTML = "";
		if (index_offset===false) { return true; }
		if (index_offset < 0) { index_offset = 0; }
		for (var i=0; i<3; i++) {
			if ((i2b2.CRC.ctrlr.QT.queryTiming == "TEMPORAL") && (i==0))
			{
				var sText = defineTemporalButton.get("label");

				if (sText != "Population in which events occur")
					this.panelControllers[i].refTitle.innerHTML =  'Anchoring Observation';
				else
					this.panelControllers[i].refTitle.innerHTML =  'Group 1';

			}
			else
			{
				this.panelControllers[i].refTitle.innerHTML = "Group "+(index_offset+i+1);
			}
			this.panelControllers[i].setPanelRecord(index_offset+i, i);
			if (i > 0) {
				if (index_offset+i <= i2b2.CRC.model.queryCurrent.panels[i2b2.CRC.ctrlr.QT.temporalGroup].length) {
					$('queryBalloonAnd'+(i)).style.display = 'block';
				} else {
					$('queryBalloonAnd'+(i)).style.display = 'none';
				}
			}
		}
		this._redrawScrollBtns();
	}

//	================================================================================================== //
	this._redrawAllPanels = function() {
		$('infoQueryStatusText').innerHTML = "";		
		for (var i=0; i<3; i++) {
			this.panelControllers[i].doRedraw();
			if (i > 0) {
				if (this.panelControllers[i].panelCurrentIndex-1 < i2b2.CRC.model.queryCurrent.panels[i2b2.CRC.ctrlr.QT.temporalGroup].length) {
					$('queryBalloonAnd'+(i)).style.display = 'block';
				} else {
					$('queryBalloonAnd'+(i)).style.display = 'none';
				}
			}
		}
	}

//	================================================================================================== //
	this._redrawPanelCount = function() {
		var c = i2b2.CRC.model.queryCurrent.panels[i2b2.CRC.ctrlr.QT.temporalGroup].length; 
		if (c == 1) {
			var s = '1 Group';
		} else {
			var s = c + ' Groups';
		}
		$('groupCount').innerHTML = s;
	}

//	================================================================================================== //
	this.laodQueryStatus = function( queryMasterId, queryName) {

		var QRS = {};
		var newHTML = "";
		var  qi_id = "";
		$('infoQueryStatusText').innerHTML = "";

		var scopedCallbackQI = new i2b2_scopedCallback();
		scopedCallbackQI.scope = this;
		scopedCallbackQI.callback = function(results) {
			if (results.error) {
				alert(results.errorMsg);
				return;
			} else {
				// find our query instance
				var qi_list = results.refXML.getElementsByTagName('query_instance');
				var l = qi_list.length;
				for (var i=0; i<l; i++) {
					var temp = qi_list[i];
					qi_id = i2b2.h.XPath(temp, 'descendant-or-self::query_instance_id')[0].firstChild.nodeValue;


					var start_date = i2b2.h.XPath(temp, 'descendant-or-self::start_date')[0].firstChild.nodeValue;
					var startDateElem = "";
					if (!Object.isUndefined(start_date)) {
						//alert(sDate.substring(0,4) + ":" + sDate.substring(5,7)  + ":" + sDate.substring(8,10));
						//012345678901234567890123
						//2010-12-21T16:12:01.427
						startDateElem = "<input type=\"hidden\" id=\"startDateElem\" value=" + start_date + ">";
						start_date =  new Date(start_date.substring(0,4), start_date.substring(5,7)-1, start_date.substring(8,10), start_date.substring(11,13), start_date.substring(14,16),start_date.substring(17,19),start_date.substring(20,23));
					}						
					var end_date = i2b2.h.XPath(temp, 'descendant-or-self::end_date')[0].firstChild.nodeValue;
					var endDateElem = "";
					if (!Object.isUndefined(end_date)) {
						//alert(sDate.substring(0,4) + ":" + sDate.substring(5,7)  + ":" + sDate.substring(8,10));
						endDateElem = "<input type=\"hidden\" id=\"endDateElem\" value=" + end_date + ">";  // Query Report BG
						end_date =  new Date(end_date.substring(0,4), end_date.substring(5,7)-1,  end_date.substring(8,10),  end_date.substring(11,13),end_date.substring(14,16), end_date.substring(17,19), end_date.substring(20,23));
					}	

					$('infoQueryStatusText').innerHTML = '<div style="clear:both;"><div style="float:left; font-weight:bold">Finished Query: "'+queryName+'"</div>';
					$('infoQueryStatusText').innerHTML += '<div style="float:right">['+ (Math.floor((end_date - start_date)/100))/10 +' secs]</div></div>'+ startDateElem + endDateElem;


					//	$('infoQueryStatusText').innerHTML += '<div style="clear:both;"><div style="float:left; font-weight:bold">Finished Query: "'+queryName+'"</div><div style="margin-left:20px; clear:both; height:16px; line-height:16px; "><div height:16px; line-height:16px; ">Compute Time: ' + (Math.floor((end_date - start_date)/100))/10 + ' secs</div></div>';


					i2b2.CRC.ajax.getQueryResultInstanceList_fromQueryInstanceId("CRC:QueryTool", {qi_key_value: qi_id}, scopedCallbackQRS);
				}

			}
		}


		// this is a private function that is used by all QueryStatus object instances to check their status
		// this is mostly used for display for previous queries when they are dragged over
		// callback processor to check the Query Instance
		var scopedCallbackQRSI = new i2b2_scopedCallback();
		scopedCallbackQRSI.scope = this;
		scopedCallbackQRSI.callback = function(results) {
			//var sCompiledResultsTest = "";  // snm0 - this is the text for the graph display
			if (results.error) {
				alert(results.errorMsg);
				return;
			} else {
				// find our query instance

				var ri_list = results.refXML.getElementsByTagName('query_result_instance');
				var l = ri_list.length;
				for (var i=0; i<l; i++) {
					var temp = ri_list[i];
					var description = i2b2.h.XPath(temp, 'descendant-or-self::description')[0].firstChild.nodeValue;
					description = description.replace(/'/g, "&#39;");
					$('infoQueryStatusText').innerHTML += "<div class=\"mainGrp\" style=\"clear: both;   padding-top: 10px; font-weight: bold;\">" + description + "</div>";
					i2b2.CRC.ctrlr.QT.sCompiledResultsTest += description + '\n';  //snm0					

				} 
				var crc_xml = results.refXML.getElementsByTagName('crc_xml_result');
				l = crc_xml.length;
				for (var i=0; i<l; i++) {			
					var temp = crc_xml[i];
					var xml_value = i2b2.h.XPath(temp, 'descendant-or-self::xml_value')[0].firstChild.nodeValue;

					var xml_v = i2b2.h.parseXml(xml_value);	


					i2b2.PM.model.userRoles.indexOf("DATA_LDS") == -1
					//	var proj_data = i2b2.PM.view.admin.currentProject;

					var params = i2b2.h.XPath(xml_v, 'descendant::data[@column]/text()/..');
					for (var i2 = 0; i2 < params.length; i2++) {
						var name = params[i2].getAttribute("name"); // snm0 - here for prev query
						// BUG FIX: WEBCLIENT-147
						if (i2b2.PM.model.isObfuscated) {
							if (params[i2].firstChild.nodeValue < 4)
							{
								var value = "<"+i2b2.UI.cfg.obfuscatedDisplayNumber.toString();
							} else {
								var value = params[i2].firstChild.nodeValue + "&plusmn;"+i2b2.UI.cfg.obfuscatedDisplayNumber.toString();
							}
						} else {
							var value = params[i2].firstChild.nodeValue;
						}
						if(i2b2.UI.cfg.useFloorThreshold){
							if (params[i2].firstChild.nodeValue < i2b2.UI.cfg.floorThresholdNumber){
								var value = i2b2.UI.cfg.floorThresholdText + i2b2.UI.cfg.floorThresholdNumber.toString();
							}
						}

						var displayValue = value;
                        if (typeof params[i2].attributes.display !== 'undefined') {
						    displayValue = params[i2].attributes.display.textContent;
                        }
						var graphValue = displayValue;
                       if (typeof params[i2].attributes.comment !== 'undefined') {
						    displayValue += ' &nbsp; <span style="color:#090;">[' + params[i2].attributes.comment.textContent + ']<span>';
						    graphValue += '|' + params[i2].attributes.comment.textContent;
                        }
						
						$('infoQueryStatusText').innerHTML += "<div class=\'" + description + "\' style=\"clear: both; margin-left: 20px; float: left; height: 16px; line-height: 16px;\">" + params[i2].getAttribute("column") +  ": <font color=\"#0000dd\">" + displayValue +   "</font></div>";

						if (params[i2].getAttribute("column") == 'patient_count') {
							i2b2.CRC.ctrlr.QT.sCompiledResultsTest += params[i2].getAttribute("column").substring(0,20) + " : " + graphValue + "\n"; //snm0
						} else {
							i2b2.CRC.ctrlr.QT.sCompiledResultsTest += params[i2].getAttribute("column").substring(0,20) + " : " + value + "\n"; //snm0						
						}
					}


					var ri_id = i2b2.h.XPath(temp, 'descendant-or-self::result_instance_id')[0].firstChild.nodeValue;

					//alert(i2b2.CRC.ctrlr.QT.sCompiledResultsTest); //snm0 
					i2b2.CRC.view.graphs.createGraphs("infoQueryStatusChart", i2b2.CRC.ctrlr.QT.sCompiledResultsTest, i2b2.CRC.view.graphs.bIsSHRINE);
					if (i2b2.CRC.view.graphs.bisGTIE8) {
						// Resize the query status box depending on whether breakdowns are included
						if (i2b2.CRC.ctrlr.QT.sCompiledResultsTest.includes("breakdown"))
							i2b2.CRC.cfg.config.ui.statusBox = i2b2.CRC.cfg.config.ui.largeStatusBox; 
							else i2b2.CRC.cfg.config.ui.statusBox = i2b2.CRC.cfg.config.ui.defaultStatusBox;
						i2b2.CRC.view.status.selectTab('graphs');
						//$(window).trigger('resize');
						window.dispatchEvent(new Event('resize'));					}		
				}
			}
		}

		// callback processor to check the Query Result Set
		var scopedCallbackQRS = new i2b2_scopedCallback();
		scopedCallbackQRS.scope = this;
		scopedCallbackQRS.callback = function(results) {
			if (results.error) {
				alert(results.errorMsg);
				return;
			} else {
				// find our query instance
				var qrs_list = results.refXML.getElementsByTagName('query_result_instance');
				var l = qrs_list.length;
				var resultStr = "";
				for (var i=0; i<l; i++) {
					var temp = qrs_list[i];
					var qrs_id = i2b2.h.XPath(temp, 'descendant-or-self::result_instance_id')[0].firstChild.nodeValue;
					if (QRS.hasOwnProperty(qrs_id)) {
						var rec = QRS[qrs_id];
					} else {
						var rec = new Object();
						rec.QRS_ID = qrs_id;
						//			resultStr += i2b2.h.getXNodeVal(temp, 'description');
						//			resultStr += i2b2.h.XPath(temp, 'descendant-or-self::query_status_type/name')[0].firstChild.nodeValue;
						//			resultStr += "<br/>";
						rec.QRS_DisplayType = i2b2.h.XPath(temp, 'descendant-or-self::query_result_type/display_type')[0].firstChild.nodeValue;
						rec.QRS_Type = i2b2.h.XPath(temp, 'descendant-or-self::query_result_type/name')[0].firstChild.nodeValue;
						rec.QRS_Description = i2b2.h.XPath(temp, 'descendant-or-self::description')[0].firstChild.nodeValue;
						rec.QRS_TypeID = i2b2.h.XPath(temp, 'descendant-or-self::query_result_type/result_type_id')[0].firstChild.nodeValue;
					}
					rec.QRS_Status = i2b2.h.XPath(temp, 'descendant-or-self::query_status_type/name')[0].firstChild.nodeValue;
					rec.QRS_Status_ID = i2b2.h.XPath(temp, 'descendant-or-self::query_status_type/status_type_id')[0].firstChild.nodeValue;
					// create execution time string
					QRS[rec.QRS_ID] = rec;

					if (rec.QRS_DisplayType == "CATNUM") {


						i2b2.CRC.ajax.getQueryResultInstanceList_fromQueryResultInstanceId("CRC:QueryTool", {qr_key_value: rec.QRS_ID}, scopedCallbackQRSI);
					} else if (rec.QRS_DisplayType == "LIST") {
						$('infoQueryStatusText').innerHTML += "<div style=\"clear: both; padding-top: 10px; font-weight: bold;\">" + rec.QRS_Description + "</div>";
					}


				}
				//	$('infoQueryStatusText').innerHTML = resultStr;

			}
		}





		//first get instance id 
		i2b2.CRC.ajax.getQueryInstanceList_fromQueryMasterId("CRC:QueryTool", {qm_key_value: queryMasterId}, scopedCallbackQI);	

		//if (qi_id != "") {
//		i2b2.CRC.ajax.getQueryResultInstanceList_fromQueryInstanceId("CRC:QueryTool", {qi_key_value: qi_id}, scopedCallbackQRS);
//		for (var q in QRS) {
//		i2b2.CRC.ajax.getQueryResultInstanceList_fromQueryResultInstanceId("CRC:QueryTool", {qr_key_value: QRS[q].QRS_ID}, scopedCallbackQRSI);
//		}		
		//}

	}


//	================================================================================================== //
	this.doAddTemporal = function() {
		//var html = $('temporalbuilders').innerHTML;
		this.tenporalBuilders = this.tenporalBuilders + 1;
		//	html = '		  <div class="relationshipAmongEvents" id="temporalbuilder_' + this.tenporalBuilders + '"> '
		html             = '          <select id="preloc1[' + this.tenporalBuilders + ']" name="preloc1[' + this.tenporalBuilders + ']" style="width:100px;"><option value="STARTDATE">Start of</option><option  value="ENDDATE">End of</option></select> '
		+ '          <select id="instanceopf1[' + this.tenporalBuilders + ']" name="instanceopf1[' + this.tenporalBuilders + ']" style="width:150px;"><option  value="FIRST">the First Ever</option><option  value="LAST">the Last Ever</option><option value="ANY">any</option></select> '
		+ '          <select id="instancevent1[' + this.tenporalBuilders + ']" name="instancevent1[' + this.tenporalBuilders + ']" style="width:100px;"><option  selected>Event 1</option><option>Event 2</option>';

		for (var j =3; j < i2b2.CRC.model.queryCurrent.panels.length; j ++)
		{	
			html += '<option>Event ' + j + '</option>';
		}

		html += '  </select>    		<br/> '

			+ '          <select id="postloc[' + this.tenporalBuilders + ']" name="postloc[' + this.tenporalBuilders + ']"  style="width:150px;"><option value="LESS">Occurs Before</option><option value="LESSEQUAL">Occurs On Or Before</option> '
			+ '         <option value="EQUAL">Occurs Simultaneously With</option> '
			+ '          <option  value="GREATER">Occurs After</option> '
			+ '         <option  value="GREATEREQUAL">Occurs On or After</option> '

			+ '         </select> '

			+ '    		<br/> '

			+ '        <select id="preloc2[' + this.tenporalBuilders + ']" name="preloc2[' + this.tenporalBuilders + ']" style="width:100px;"><option value="STARTDATE">Start of</option><option  value="ENDDATE">End of</option></select> '
			+ '        <select id="instanceopf2[' + this.tenporalBuilders + ']" name="instanceopf2[' + this.tenporalBuilders + ']"  style="width:150px;"><option  value="FIRST">the First Ever</option><option  value="LAST">the Last Ever</option><option value="ANY">any</option></select> '
			+ '        <select id="instancevent2[' + this.tenporalBuilders + ']" name="instancevent2[' + this.tenporalBuilders + ']" style="width:100px;"><option>Event 1</option><option  selected>Event 2</option>';

		for (var j =3; j < i2b2.CRC.model.queryCurrent.panels.length; j ++)
		{	
			html += '<option>Event ' + j + '</option>';
		}

		html += '  </select>      <br/> '

			+ '        <input  id="bytime1[' + this.tenporalBuilders + ']" name="bytime1[' + this.tenporalBuilders + ']" type="checkbox">By <select id="byspan1[' + this.tenporalBuilders + ']" name="byspan1[' + this.tenporalBuilders + ']"  style="width:50px;"><option value="GREATER">&gt;</option><option value="GREATEREQUAL" selected>&ge;</option><option value="EQUAL">=</option><option value="LESSEQUAL">&le;</option><option value="LESS">&lt;</option></select> '
			+ '         <input   id="bytimevalue1[' + this.tenporalBuilders + ']" name="bytimevalue1[' + this.tenporalBuilders + ']" style="width:50px;" type="text" value="1"> '
			+ '          <select   id="bytimeunit1[' + this.tenporalBuilders + ']" name="bytimeunit1[' + this.tenporalBuilders + ']" style="width:100px;"> '
			+ '          <option  value="HOUR">hour(s)</option> '
			+ '          <option   value="DAY" selected>day(s)</option> '
			+ '          <option  value="MONTH">month(s)</option> '
			+ '          <option  value="YEAR">year(s)</option></select> '

			+ '          <br/> '

			+ '         <input id="bytime2[' + this.tenporalBuilders + ']" name="bytime2[' + this.tenporalBuilders + ']" type="checkbox">And <select  id="byspan2[' + this.tenporalBuilders + ']" name="byspan2[' + this.tenporalBuilders + ']"  style="width:50px;"><option value="GREATER">&gt;</option><option value="GREATEREQUAL">&ge;</option><option value="EQUAL">=</option><option value="LESSEQUAL" selected>&le;</option><option value="LESS">&lt;</option></select> '
			+ '         <input id="bytimevalue2[' + this.tenporalBuilders + ']" name="bytimevalue2[' + this.tenporalBuilders + ']"  style="width:50px;" type="text" value="1"> '
			+ '          <select  id="bytimeunit2[' + this.tenporalBuilders + ']" name="bytimeunit2[' + this.tenporalBuilders + ']" style="width:100px;"> '
			+ '          <option  value="HOUR">hour(s)</option> '
			+ '          <option   value="DAY" selected>day(s)</option> '
			+ '          <option  value="MONTH">month(s)</option> '
			+ '          <option  value="YEAR">year(s)</option></select> ';




		//  + '    </div> ';


		'<div class="relationshipAmongEvents" id="temporalbuilder_' + this.tenporalBuilders + '">' +  html + '</div>';
		var content = document.createElement ("div");
		content.id = "temporalbuilder_" + this.tenporalBuilders;
		content.className = "relationshipAmongEvents";
		content.innerHTML = html;
		$('temporalbuilders').appendChild(content);

	}

//	================================================================================================== //
	this.doRemoveTemporal = function() { // nw096 - WEBCLIENT-155 Removes last temporal relationship
		if(this.tenporalBuilders == 0){
			alert('You must leave a minimum of one temporal relationship.');
		} else {
			if(jQuery("[id^='temporalbuilder_']").length > 1){
				this.tenporalBuilders = this.tenporalBuilders - 1;
				$('temporalbuilders').lastChild.remove();
			}
		}
	}


//	================================================================================================== //
	this.doScrollFirst = function() {
		this.doShowFrom(0);
	}

//	================================================================================================== //
	this.doScrollPrev = function() {
		var i = this.panelControllers[0].panelCurrentIndex - 1;
		if (i<0) { i=0; }
		this.doShowFrom(i);
	}

//	================================================================================================== //
	this.doScrollNext = function() {
		var i = this.panelControllers[0].panelCurrentIndex + 1;
		var dm = i2b2.CRC.model.queryCurrent;
		if (i > (dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup].length-3)) { i=dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup].length-3; }
		this.doShowFrom(i);
	}

//	================================================================================================== //
	this.doScrollLast = function() {
		var i = i2b2.CRC.model.queryCurrent.panels[i2b2.CRC.ctrlr.QT.temporalGroup].length - 3;
		if (i<0) { i = 0; }
		this.doShowFrom(i);
	}

//	================================================================================================== //
	this.doScrollNew = function() {
		var i = i2b2.CRC.model.queryCurrent.panels[i2b2.CRC.ctrlr.QT.temporalGroup].length - 2;
		if (i<0) { i = 0; }
		this.doShowFrom(i);
	}

//	================================================================================================== //
	this._redrawScrollBtns = function() {
		// enable & disable scroll buttons (at least the look of the buttons)
		var dir = i2b2.hive.cfg.urlFramework + 'cells/CRC/assets/';
		if (i2b2.CRC.ctrlr.QT.panelControllers[0].panelCurrentIndex == 0) {
			$('panelScrollFirst').src = dir+"QryTool_b_first_hide.gif";
			$('panelScrollPrev').src = dir+"QryTool_b_prev_hide.gif";
		} else {
			$('panelScrollFirst').src = dir+"QryTool_b_first.gif";
			$('panelScrollPrev').src = dir+"QryTool_b_prev.gif";
		}
		if ((i2b2.CRC.model.queryCurrent.panels[i2b2.CRC.ctrlr.QT.temporalGroup].length - i2b2.CRC.ctrlr.QT.panelControllers[0].panelCurrentIndex) > 3) {
			$('panelScrollNext').src = dir+"QryTool_b_next.gif";
			$('panelScrollLast').src = dir+"QryTool_b_last.gif";
		} else {
			$('panelScrollNext').src = dir+"QryTool_b_next_hide.gif";
			$('panelScrollLast').src = dir+"QryTool_b_last_hide.gif";
		}
	},


	// =====================================================================================================//
	/***************
	 * Zoom Query - nw096
	 ****************/
	this.doZoomQuery = function() {
		i2b2.CRC.ctrlr.QT.doUnZoomQuery();
		$('infoQueryStatusText').style.height = '600px';
		$('infoQueryStatusText').style.width = '700px';
		$('infoQueryStatusText').style.top = '50%';
		$('infoQueryStatusText').style.left = '50%';
		$('infoQueryStatusText').style.position = 'fixed';
		$('infoQueryStatusText').style.zIndex = '99999';
		$('infoQueryStatusText').style.marginTop = '-300px';
		$('infoQueryStatusText').style.marginLeft = '-350px';

		document.onclick = check;

		function check(e){
			var target = (e && e.target) || (event && event.srcElement); 
			var queryStatusDiv = document.getElementById("infoQueryStatusText"); 
			var dropdownMenu = document.getElementById("menu-dropdown"); 


			if (checkParent(target, "infoQueryStatusText")) {

			} else {
				i2b2.CRC.ctrlr.QT.doUnZoomQuery();
			}
		}

		function checkParent(t,id) {
			while(t.parentNode) { 
				if( t == document.getElementById(id) ) {return true;} 
				t = t.parentNode;
			} 
			return false;
		}

	}

	this.doUnZoomQuery = function() {
		$('infoQueryStatusText').style.height = '100px';
		$('infoQueryStatusText').style.width = '';
		$('infoQueryStatusText').style.top = '';
		$('infoQueryStatusText').style.left = '';
		$('infoQueryStatusText').style.position = '';
		$('infoQueryStatusText').style.zIndex = '';
		$('infoQueryStatusText').style.marginTop = '';
		$('infoQueryStatusText').style.marginLeft = '';

		document.onclick = null;
	}
//	=====================================================================================================//
	/***************
	 * Print Query
	 ****************/
	this.doPrintQuery = function() {
		var v_i2b2_quey_name = i2b2.CRC.model.queryCurrent.name;


		var crc_bcgrnd1 = "<td style='border:1px solid #667788;'>";
		var crc_bcgrnd2 = "<td style='border:1px solid #667788;background:#7FFFD4'>";
		var crc_cur_bcgrnd = null;

		if(
				(v_i2b2_quey_name == null) || 
				(v_i2b2_quey_name == undefined) ||
				(v_i2b2_quey_name.length == 0)
		){
			v_i2b2_quey_name = 'No Query Name is currently provided.';
		}
		var v_cnt_panels = i2b2.CRC.model.queryCurrent.panels[0].length;

		if (v_cnt_panels == 0 && this.queryTiming == "TEMPORAL")
			v_cnt_panels = i2b2.CRC.model.queryCurrent.panels[1].length;
		if(v_cnt_panels > 0){
			var win_html_inner = 
				"<table style='border:1px solid #667788;width:700px;' cellpadding=3px>"+
				"<tbody>";



			//Get Query Name if available
			win_html_inner +=
				"<tr>"+
				"<td style='background:#6677AA none repeat scroll 0%;border:1px solid #667788;'>"+
				"<span style='color:#FFFFFF;font-weight:bold;font-family:arial,helvetica;font-size:13px;'>"+
				"Query Name: "+ v_i2b2_quey_name + "<br>Temporal Constraint: ";

			var v_querytiming = i2b2.CRC.ctrlr.QT.queryTiming;
			if  (v_querytiming == "ANY")
			{
				win_html_inner += "Treat all groups independently";
			} else if  (v_querytiming == "SAMEVISIT") {
				win_html_inner += "Selected groups occur in the same financial encounter";
			} else if  (v_querytiming == "TEMPORAL") {
				win_html_inner += "Define sequence of events";
			} else {
				win_html_inner +=  "Items Instance will be the same";
			}

			win_html_inner += "</span></td></tr>";


			var isTemporal = false;
			if (this.queryTiming == "TEMPORAL") {
				isTemporal = true;	
			}

			for (var ip = 0; ip < i2b2.CRC.model.queryCurrent.panels.length; ip++)
			{

				var v_cnt_panels = i2b2.CRC.model.queryCurrent.panels[ip].length;

				//Get information for each query panel
				for(x =0; x < v_cnt_panels; x++){
					var v_dateTo 	= i2b2.CRC.model.queryCurrent.panels[ip][x].dateTo;
					var v_dateFrom 	= i2b2.CRC.model.queryCurrent.panels[ip][x].dateFrom;
					var v_exclude	= i2b2.CRC.model.queryCurrent.panels[ip][x].exclude;
					var v_occurs	= i2b2.CRC.model.queryCurrent.panels[ip][x].occurs;
					var v_relevance	= i2b2.CRC.model.queryCurrent.panels[ip][x].relevance;
					var v_timing	= i2b2.CRC.model.queryCurrent.panels[ip][x].timing;
					var v_items 	= i2b2.CRC.model.queryCurrent.panels[ip][x].items;

					if((x % 2) == 0){
						crc_cur_bcgrnd = crc_bcgrnd1;
					}
					else{
						crc_cur_bcgrnd = crc_bcgrnd2;
					}

					var v_strDateTo = null;
					var v_strDateFrom = null;
					//Handle JS Dates
					if((v_dateTo == null) ||
							(v_dateTo == undefined)  ||
							(v_dateTo == false)
					){
						v_strDateTo = "none";				   
					}
					else{
						v_strDateTo = 
							v_dateTo.Month +"/"+
							v_dateTo.Day  +"/" +
							v_dateTo.Year;
					}


					//QueryTiming
					if (v_querytiming == "ANY")
					{
						v_timing = "Treat Independently";

					} else if (v_querytiming == "SAMEVISIT")
					{
						if (v_timing == "ANY")
						{
							v_timing = "Treat Independently";							
						} else {
							v_timing = "Occurs in Same Encounter";													
						}
					} else 
					{
						if (v_timing == "ANY")
						{
							v_timing = "Treat Independently";							
						} else {
							v_timing = "Items Instance will be the same";													
						}
					}


					//Handle JS Dates
					if((v_dateFrom == null) ||
							(v_dateFrom == undefined)  ||
							(v_dateFrom == false)
					){
						v_strDateFrom = "none";				   
					}
					else{
						v_strDateFrom =
							v_dateFrom.Month +"/"+
							v_dateFrom.Day  +"/" +
							v_dateFrom.Year;
					}

					if (isTemporal)
					{
						var tempalTitle = "Population in which events occur";
						if (ip > 0)
							tempalTitle = "Event " + ip;

						win_html_inner += 
							"<tr>"+
							crc_cur_bcgrnd;

						win_html_inner += 
							"<span style='color:black;font-weight:bold;font-family:arial,helvetica;font-size:12px;'>"+
							tempalTitle
							"</span></td></tr>";
					}

					win_html_inner += 
						"<tr>"+
						crc_cur_bcgrnd;

					win_html_inner += 
						"<span style='color:black;font-weight:bold;font-family:arial,helvetica;font-size:12px;'>"+
						"Group "+ (x + 1)
						"</span></td></tr>";

					win_html_inner +=
						"<tr><td style='border:1px solid #667788;'>"+
						"<table width=100% cellpadding=2px cellspacing=0>"+
						"<tbody>"+
						"<tr style='border:1px solid #667788;'>"+
						"<td colspan=3>"+
						"<span style='color:black;font-weight:bold;font-family:arial,helvetica;font-size:11px;'>"+
						"&nbsp; Date From: &nbsp;</span>"+
						"<span style='color:black;font-weight:normal;font-family:arial,helvetica;font-size:11px;'>"+
						v_strDateFrom +
						"</span>"+
						"<span style='color:black;font-weight:normal;font-family:arial,helvetica;font-size:11px;'> </span>"+
						"<span style='color:black;font-weight:bold;font-family:arial,helvetica;font-size:11px;'>"+
						"&nbsp; Date To: &nbsp;</span>"+
						"<span style='color:black;font-weight:normal;font-family:arial,helvetica;font-size:11px;'>"+
						v_strDateTo +
						"</span>"+
						"<span style='color:black;font-weight:normal;font-family:arial,helvetica;font-size:11px;'> </span>"+
						"<!--Excluded-->"+
						"<span style='color:black;font-weight:bold;font-family:arial,helvetica;font-size:11px;'>"+
						"&nbsp; Excluded? &nbsp;</span>"+
						"<span style='color:black;font-weight:normal;font-family:arial,helvetica;font-size:11px;'>"+
						v_exclude +
						"</span>"+
						"<span style='color:black;font-weight:normal;font-family:arial,helvetica;font-size:11px;'> </span>"+
						"<span style='color:black;font-weight:bold;font-family:arial,helvetica;font-size:11px;'>"+
						"&nbsp; Occurs X times: &nbsp;</span>"+
						"<span style='color:black;font-weight:normal;font-family:arial,helvetica;font-size:11px;'>&gt; "+
						v_occurs +
						"</span>"+
						"<span style='color:black;font-weight:normal;font-family:arial,helvetica;font-size:11px;'> </span>"+
						"<span style='color:black;font-weight:bold;font-family:arial,helvetica;font-size:11px;'>"+
						"&nbsp; Relevance %: &nbsp;</span>"+
						"<span style='color:black;font-weight:normal;font-family:arial,helvetica;font-size:11px;'> "+
						v_relevance +
						"</span>"+				
						"<span style='color:black;font-weight:normal;font-family:arial,helvetica;font-size:11px;'> </span>"+
						"<span style='color:black;font-weight:bold;font-family:arial,helvetica;font-size:11px;'>"+
						"&nbsp; Temporal Constraint: &nbsp;</span>"+
						"<span style='color:black;font-weight:normal;font-family:arial,helvetica;font-size:11px;'>"+
						v_timing +
						"</span>"+				
						"</td>"+
						"</tr>";

					win_html_inner +=
						"<!--Header Columns-->"+
						"<tr>"+
						"<!--Path-->"+
						"<td width=40% style='background:#6677AA none repeat scroll 0%;align:center;border-left-style:solid;border-bottom-style:solid;border-top-style:solid;border-right-style:solid;'>"+
						"<span style='color:#FFFFFF;font-weight:bold;font-family:arial,helvetica;font-size:11px;'>Path</span>"+
						"</td>"+
						"<!--Concept-->"+
						"<td width=30% style='background:#6677AA none repeat scroll 0%;align:center;border-bottom-style:solid;border-top-style:solid;border-right-style:solid;'>"+
						"<span style='color:#FFFFFF;font-weight:bold;font-family:arial,helvetica;font-size:11px;'>Concept/Term</span>"+
						"</td>"+
						"<!--Other Information-->"+
						"<td width=30% style='background:#6677AA none repeat scroll 0%;align:center;border-bottom-style:solid;border-top-style:solid;border-right-style:solid;'>"+
						"<span style='color:#FFFFFF;font-weight:bold;font-family:arial,helvetica;font-size:11px;'>Other Information</span>"+
						"</td>"+
						"</tr>";

					win_html_inner +=
						"<!--Data Columns-->";

					for(n = 0; n < v_items.length; n++){
						//str_shrine_path = v_items[n].sdxInfo.sdxKeyValue;
						//Using tooltips
						str_shrine_path = v_items[n].origData.tooltip;

						win_html_inner += "<tr>";
						win_html_inner += 
							"<td width=40% style='align:center;border-left-style:solid;border-bottom-style:solid;border-right-style:solid;'>"+
							"<span style='color:black;font-weight:normal;font-family:arial,helvetica;font-size:11px;'>"+
							str_shrine_path +
							"</span></td>";

						win_html_inner += 
							"<td width=30% style='align:center;solid;border-bottom-style:solid;border-right-style:solid;'>"+
							"<span style='color:black;font-weight:normal;font-family:arial,helvetica;font-size:11px;'>"+
							v_items[n].origData.newName +
							"</span></td>";

						win_html_inner += 
							"<td width=30% style='align:center;border-bottom-style:solid;border-right-style:solid;'>"+
							"<span style='color:black;font-weight:normal;font-family:arial,helvetica;font-size:11px;'>";
						if((v_items[n].LabValues == null) ||
								(v_items[n].LabValues == undefined) ||
								(v_items[n].LabValues.length <= 0)
						){

							win_html_inner += "&nbsp;";	

						}
						else{
							var v_lab_values = v_items[n].LabValues;

							var str_lab_values = "";


							if(v_lab_values.GeneralValueType == "NUMBER") {
								str_lab_values =
									v_lab_values.NumericOp +" : ";

								if((v_lab_values.ValueLow != null) ||
										(v_lab_values.ValueLow != undefined)
								){
									str_lab_values +=
										v_lab_values.ValueLow + " - "+
										v_lab_values.ValueHigh;
								} else {
									str_lab_values +=
										v_lab_values.Value;
								}							
								str_lab_values += " "+ v_lab_values.UnitsCtrl;
							}
							//String
							else if((v_lab_values.ValueString != null) ||
									(v_lab_values.ValueString != undefined)
							){
								str_lab_values =
									"By String: "+
									v_lab_values.ValueString;
							}
							//Flag
							else if((v_lab_values.ValueFlag != null) ||
									(v_lab_values.ValueFlag != undefined)
							){
								var v_flag = "Normal";
								if(v_lab_values.ValueFlag == "H"){
									v_flag = "High";
								}
								else if(v_lab_values.ValueFlag == "L"){
									v_flag = "Low";
								}

								str_lab_values = 
									"By Flag: "+ v_flag;
							}

							win_html_inner += str_lab_values;
						}


						win_html_inner += "</span></td></tr>";
					}

					//end

					//if (isTemporal == false)
					//break;



					win_html_inner += "</tbody></table>";
				}

			}

			if (isTemporal)
			{

				win_html_inner += 
					"<tr>"+
					crc_cur_bcgrnd;

				win_html_inner += 
					"<span style='color:black;font-weight:bold;font-family:arial,helvetica;font-size:12px;'><center>"+

					$('instancevent1[0]').options[$('instancevent1[0]').selectedIndex].value + " " +
					$('preloc1[0]').options[$('preloc1[0]').selectedIndex].value +" " +
					$('instanceopf1[0]').options[$('instanceopf1[0]').selectedIndex].value  +"<br/>" +
					$('postloc[0]').options[$('postloc[0]').selectedIndex].value + "<br/>" +
					$('instancevent2[0]').options[$('instancevent2[0]').selectedIndex].value + " " +
					$('preloc2[0]').options[$('preloc2[0]').selectedIndex].value + " " +
					$('instanceopf2[0]').options[$('instanceopf2[0]').selectedIndex].value +" ";

				if ( $('bytime1[0]').checked)
				{
					win_html_inner += "<br/>" + $('byspan1[0]').options[$('byspan1[0]').selectedIndex].value + " " +
					$('bytimevalue1[0]').value + " " +
					$('bytimeunit1[0]').options[$('bytimeunit1[0]').selectedIndex].value +" ";

				}
				if ( $('bytime2[0]').checked)
				{
					win_html_inner += "<br/>" +  $('byspan2[0]').options[$('byspan2[0]').selectedIndex].value + " " +
					$('bytimevalue2[0]').value + " " +
					$('bytimeunit2[0]').options[$('bytimeunit2[0]').selectedIndex].value;

				}						   
				win_html_inner += "</center></span></td></tr>";
			}

			win_html_inner += "</tbody></table>";

			//Query Status window
			win_html_inner += "<p>" + $('infoQueryStatusText').innerHTML;

			var win = 
				window.open("",'shrinePrintWindow','width=800,height=750,menubar=yes,resizable=yes,scrollbars=yes');



			win.document.writeln('<div id="shrinePrintQueryPage">');
			win.document.writeln(win_html_inner);
			win.document.writeln('</div>');
		}
		else{
			alert("Currently no query is available for printing. \nPlease generate a query before clicking on [Print Query] button.");
		}
	}


	/**********************
	 * Query Report BG 
	 **********************/	

	this.doPrintQueryNew = function(fromPrintButton,queryNameInput,previewQueryOnly)
	{
		//This request is to populate the query report pane in the query results section
		if(!fromPrintButton){
			//If the status box is empty no need to proceed
			if($('infoQueryStatusText').innerHTML=="") return;

			//Clean the corresponding div before repopulating
			if(!fromPrintButton)
				$("infoQueryStatusReport").innerHTML="";

		}

		//Clean and populate the variables for printing
		this.ClearVariablesForPrinting();
		if(queryNameInput.length>0 || previewQueryOnly)
			this.queryPanelObjForPrinting.name = queryNameInput;
		else{
			var nameObj = document.getElementById("queryName");
			var v_i2b2_quey_name = i2b2.CRC.model.queryCurrent.name;
			if(nameObj){
				this.queryPanelObjForPrinting.name = nameObj.innerHTML;
			}
		}

		var startDateElm = $("startDateElem");
		if(startDateElm)
			this.QI_Rec_ForPrinting.start_date = startDateElm.value;

		var endDateElm = $("endDateElem");
		if(endDateElm)
			this.QI_Rec_ForPrinting.end_date = endDateElm.value;

		var userIdElm = $("userIdElem");
		if(userIdElm)
			this.query_user_id = userIdElm.value;

		// tdw9: if SIMPLE temporal query mode, write data to ADVANCED mode data model and then generate content to print
		if (i2b2.CRC.view.QT.isShowingTemporalQueryUI && !i2b2.CRC.view.QT.isShowingClassicTemporalQueryUI )
		{
			// cache existing chart and status text. Put them back after the following block.
			var statusText  = $('infoQueryStatusText').innerHTML;
			var chartText   = $('infoQueryStatusChart').innerHTML;
			i2b2.CRC.ctrlr.QT.doClearTemporalComponent(); // clear temporal component of the classic query without clearing query results (flag = false)
			i2b2.CRC.ctrlr.QT.copySimpleQueryToClassic(); // perform the copying then do query printing
			i2b2.CRC.ctrlr.QT.queryTiming = "TEMPORAL";   // make sure we are in temporal mode            
			i2b2.CRC.ctrlr.QT.temporalGroup = 0;          // reset current temporalGroup to the population
			i2b2.CRC.ctrlr.QT._redrawAllPanels();         // redraw all panels to show population's content
			$('infoQueryStatusText').innerHTML  = statusText;
			$('infoQueryStatusChart').innerHTML = chartText;
		}
		// end tdw9

		var v_cnt_panels = i2b2.CRC.model.queryCurrent.panels[0].length;
		if(v_cnt_panels > 0 || i2b2.CRC.view.QT.isShowingTemporalQueryUI) // tdw9
		{
			this.queryPanelObjForPrinting.timing = i2b2.CRC.ctrlr.QT.queryTiming;

			var isTemporal = false;
			if (this.queryTiming == "TEMPORAL") {
				isTemporal = true;	
			}
			this.queryPanelObjForPrinting.subQryRelationStructure = [];
			this.queryPanelObjForPrinting.mainQryStructure = [];
			this.queryPanelObjForPrinting.subQryStructure = [];
			this.queryPanelObjForPrinting.hasSubquery = false;


			for (var ip = 0; ip < i2b2.CRC.model.queryCurrent.panels.length; ip++)
			{
				var v_cnt_panels = i2b2.CRC.model.queryCurrent.panels[ip].length;
				//Get information for each query panel
				var panels = [];
				for(x =0; x < v_cnt_panels; x++){
					var po = {};
					//po.dateTo = i2b2.CRC.model.queryCurrent.panels[ip][x].dateTo;
					//po.dateFrom = i2b2.CRC.model.queryCurrent.panels[ip][x].dateFrom;
					po.exclude = i2b2.CRC.model.queryCurrent.panels[ip][x].exclude;
					po.occurs = i2b2.CRC.model.queryCurrent.panels[ip][x].occurs;
					po.relevance = i2b2.CRC.model.queryCurrent.panels[ip][x].relevance;
					po.timing = i2b2.CRC.model.queryCurrent.panels[ip][x].timing;
					po.subquery = false;
					if (isTemporal && ip>0){
						po.name = "Event" + ip;
						po.subquery = true;
					}

					var v_items = i2b2.CRC.model.queryCurrent.panels[ip][x].items;



					po.items = [];

					for(n = 0; n < v_items.length; n++){

						var itemObj = {};
						var v_strDateTo = null;
						var v_strDateFrom = null;
						//Handle JS Dates
						if((v_items[n].dateTo == null) ||
								(v_items[n].dateTo == undefined)  ||
								(v_items[n].dateTo == false)
						){
							v_strDateTo = "none";				   
						}
						else{
							v_strDateTo = 
								v_items[n].dateTo.Month +"/"+
								v_items[n].dateTo.Day  +"/" +
								v_items[n].dateTo.Year;
						}
						itemObj.dateTo = v_strDateTo

						//Handle JS Dates
						if((v_items[n].dateFrom == null) ||
								(v_items[n].dateFrom == undefined)  ||
								(v_items[n].dateFrom == false)
						){
							v_strDateFrom = "none";				   
						}
						else{
							v_strDateFrom =
								v_items[n].dateFrom.Month +"/"+
								v_items[n].dateFrom.Day  +"/" +
								v_items[n].dateFrom.Year;
						}
						itemObj.dateFrom = v_strDateFrom;


						itemObj.tooltip = v_items[n].origData.tooltip? v_items[n].origData.tooltip:"";
						itemObj.name = 	v_items[n].origData.result_instance_id ? 
								(v_items[n].origData.title ? v_items[n].origData.title : 
									(v_items[n].origData.titleCRC ? v_items[n].origData.titleCRC : ""))
									:(v_items[n].origData.newName ? v_items[n].origData.newName 
											: (v_items[n].origData.name?v_items[n].origData.name:""));
								itemObj.hasChildren = v_items[n].origData.hasChildren;

								if (v_items[n].sdxInfo.sdxType == "PR")
									itemObj.name = v_items[n].origData.title;
								if ( v_items[n].sdxInfo.sdxType != "WRKF")
									po.items.push(itemObj);
								//itemObj.level = 	
								// deal with PR

					}
					panels[x] = po;
				}
				if(panels.length>0){
					if (isTemporal)
					{
						if (ip > 0)
							this.queryPanelObjForPrinting.subQryStructure.push(panels);
						else
							this.queryPanelObjForPrinting.mainQryStructure.push(panels);
					}
					else
						this.queryPanelObjForPrinting.mainQryStructure.push(panels);
				}
			}

			if(isTemporal)
			{
				var evntRelDiv = document.getElementById('temporalbuilders');
				if(evntRelDiv)
				{
					var relationNodes = evntRelDiv.childNodes;
					this.queryPanelObjForPrinting.subQryRelationStructure = [];
					var subQryRelationStructureIndex = 0;
					for(i=0; i < relationNodes.length; i++)
					{
						var thisRelNode = relationNodes[i];
						var rel = {};
						rel.spans = [];
						var spanIndex = 0;
						var spanObj = {};
						var bytime1 = false;
						var bytime2 = false;
						var allChildren = thisRelNode.childNodes;

						for(j=0; j < allChildren.length; j++)
						{
							var currentNode = allChildren[j];
							if(currentNode.id){
								if(currentNode.id.indexOf("preloc1") >= 0)
								{
									rel.firstQryJoinCol = getSelectedValueFromOptions(currentNode.options);
								}
								if(currentNode.id.indexOf("instanceopf1") >= 0)
								{
									rel.firstQryOp = getSelectedValueFromOptions(currentNode.options);
								}
								if(currentNode.id.indexOf("instancevent1") >= 0)
								{
									rel.firstQryEvntNm = getSelectedValueFromOptions(currentNode.options);
								}
								if(currentNode.id.indexOf("postloc") >= 0)
								{
									rel.operator = getSelectedValueFromOptions(currentNode.options);
								}
								if(currentNode.id.indexOf("preloc2") >= 0)
								{
									rel.secondQryJoinCol = getSelectedValueFromOptions(currentNode.options);
								}
								if(currentNode.id.indexOf("instanceopf2") >= 0)
								{
									rel.secondQryOp = getSelectedValueFromOptions(currentNode.options);
								}
								if(currentNode.id.indexOf("instancevent2") >= 0)
								{
									rel.secondQryEvntNm = getSelectedValueFromOptions(currentNode.options);
								}
								if((currentNode.id.indexOf('bytime1') >= 0) && currentNode.checked)
								{
									bytime1 = true;
								}
								if(currentNode.id.indexOf('byspan1') >= 0 && bytime1)
								{
									spanObj.oprator = getSelectedValueFromOptions(currentNode.options);
								}
								if(currentNode.id.indexOf('bytimevalue1') >= 0 && bytime1)
								{
									spanObj.value = currentNode.value;
								}
								if(currentNode.id.indexOf('bytimeunit1') >= 0 && bytime1)
								{
									spanObj.units = getSelectedValueFromOptions(currentNode.options);
									rel.spans[spanIndex++] = spanObj;
								}
								if((currentNode.id.indexOf('bytime2') >= 0) && currentNode.checked)
								{
									bytime2 = true;
									spanObj = {};
								}
								if(currentNode.id.indexOf('byspan2') >= 0 && bytime2)
								{
									spanObj.oprator = getSelectedValueFromOptions(currentNode.options);
								}
								if(currentNode.id.indexOf('bytimevalue2') >= 0 && bytime2)
								{
									spanObj.value = currentNode.value;
								}
								if(currentNode.id.indexOf('bytimeunit2') >= 0 && bytime2)
								{
									spanObj.units = getSelectedValueFromOptions(currentNode.options);
									rel.spans[spanIndex++] = spanObj;
								}	 
							}
						}
						if(allChildren.length > 0)
							this.queryPanelObjForPrinting.subQryRelationStructure[subQryRelationStructureIndex++] = rel ;
					}
				}
			}
			//All variables are ready to print. 
			var infoQueryStatusTextObj = $('infoQueryStatusText');
			if(infoQueryStatusTextObj)
			{
				var allGroups = $H();
				var queryStatusNodes = infoQueryStatusTextObj.childNodes;
				for(i=0; i < queryStatusNodes.length; i++)
				{
					var thisNode = queryStatusNodes[i];
					if(thisNode.className == "mainGrp")
					{
						allGroups.set(jQuery(thisNode).text(),"");
					}
				}
				var text = "";
				allGroups.each(function(mainGrp){
					var mainClassName = mainGrp.key;
					text += mainClassName + "\n";
					for(i=0; i < queryStatusNodes.length; i++)
					{
						var thisNode = queryStatusNodes[i];
						var trimmedMainClassName = mainClassName.replace(/ +/g, "");
						var trimmedClassName = "";
						if(thisNode.className)
							trimmedClassName = thisNode.className.replace(/ +/g, "");

						if(trimmedClassName == trimmedMainClassName)
						{
							var thisChildrenNodes = thisNode.childNodes;
							for(j = 0; j < thisChildrenNodes.length; j++)
							{
								var childNode = thisChildrenNodes[j];
								if(childNode)
								{
									if(childNode.nodeType == 3)
										text += jQuery(childNode).text();//.textContent;
									else
										text += childNode.innerHTML + "\n";
								}
							}
						}
					}
				});
			}
			text = text.replace(/\xB1/g, "&plusmn;");
			text = text.replace(/\&lt;/g, "<");
			this.createHTMLForPrinting(text,fromPrintButton,previewQueryOnly,isTemporal);
		}
		else{
			alert("Currently no query is available for printing. \nPlease generate a query before clicking on [Print Query] button.");
		}
	}

	this.ClearVariablesForPrinting = function()
	{
		this.queryPanelObjForPrinting = {};
		this.QI_Rec_ForPrinting = new Object();
		this.QueryResultsForPrinting = {};
		this.QueryResultsForPrintingIndex = 0;
		this.QueryResultsNum = 0;
		this.query_user_id=null;
		this.XMLResultsStringForPrint = "";
		var uniqueItems = $H();
		queryReportWin = null;
	};

	this.createHTMLForPrinting = function(resultText,printFromId,previewQueryOnly,isTemporal)
	{
		var QueryReportWin = null;
		var QueryReportDiv = null;
		var ua = window.navigator.userAgent;
		var msie = ua.indexOf("MSIE ");
		var browserIsIE = false;
		if (msie > 0)
			browserIsIE = true;
		if(!(window.ActiveXObject) && "ActiveXObject" in window)
			browserIsIE = true;
		var savedHTML = null;

		if(this.queryPanelObjForPrinting.mainQryStructure.length > 0 || isTemporal)
		{
			if(printFromId || previewQueryOnly){
				if(browserIsIE){
					i2b2.CRC.ctrlr.QT.queryReportViewer.yuiPanel = null;
					i2b2.CRC.ctrlr.QT.queryReportViewer.show();
					QueryReportDiv = jQuery(i2b2.CRC.ctrlr.QT.queryReportViewer.yuiPanel.body)//.find('#queryReport-viewer-body');
				}
				else{ //Open a new window for printing query for non-IE browsers
					QueryReportWin = window.open("",'shrinePrintWindow','width=800,height=750,menubar=yes,resizable=yes,scrollbars=yes');
					//Request came for query preview generation. Need to load the child window with template
					// if(previewQueryOnly){
					var doc = QueryReportWin.document;
					doc.write(this.PrintQueryTemplate);
					doc.write(this.PrintQueryBody);
					doc.close();
					// }
				}
			}
			else
			{
				QueryReportDiv = $('infoQueryStatusReport');
				QueryReportDiv.innerHTML = this.PrintQueryBody;
				var printLinks = $$('a.printReportButton.no-print');
				if(printLinks)
					printLinks.each(function(printLink){
						printLink.href="javascript:i2b2.CRC.ctrlr.QT.PrintElem('infoQueryStatusReport')";
					});

			}

			//Populate the query details section
			try{
				if(QueryReportWin)
					this.getQueryDetails(this.queryPanelObjForPrinting,this.query_user_id,previewQueryOnly,QueryReportWin,"queryDetailsTable");

				if(QueryReportDiv)
					this.getQueryDetails(this.queryPanelObjForPrinting,this.query_user_id,previewQueryOnly,false,"queryDetailsTable");
			}
			catch(e)
			{
				console.error(e);
			}

			//Populate the query description section

			try{
				if(QueryReportWin)
					this.getQrTiming(this.queryPanelObjForPrinting,QueryReportWin,"qdHeaderTable");
				if(QueryReportDiv)
					this.getQrTiming(this.queryPanelObjForPrinting,false,"qdHeaderTable");
			}
			catch(e)
			{
				console.error(e);
			}

			//Populate the query structure description section

			var qdDescription = this.getQueryDescription(this.queryPanelObjForPrinting.mainQryStructure);
			if(qdDescription)
			{
				try{
					var Row = "<tr><td width=\"5px\"><div class=\"tabSpace\"></div></td>";
					var Cell = "<td class=\"eventsRelHdr\">" + "All Groups" + "</td>";
					Row = Row + Cell;

					if(QueryReportWin)
						jQuery("#qdContainerTable",QueryReportWin.document).append(Row);
					if(QueryReportDiv)
						jQuery("#qdContainerTable").append(Row);

					if(QueryReportWin)
						jQuery("#qdContainerTable",QueryReportWin.document).append(qdDescription);
					if(QueryReportDiv)
						jQuery("#qdContainerTable").append(qdDescription);
				}
				catch(e)
				{
					console.error(e);
				}
			}

			//Populate temporal query events description section
			var qdDescription = this.getQueryDescription(this.queryPanelObjForPrinting.subQryStructure);
			if(qdDescription)
			{
				try{
					var Row = "<tr><td width=\"5px\"><div class=\"tabSpace\"></div></td>";
					var Cell = "<td class=\"eventsRelHdr\">" + "All Events" + "</td>";
					Row = Row + Cell;

					if(QueryReportWin)
						jQuery("#temporalQryEventsContainerTable",QueryReportWin.document).append(Row);
					if(QueryReportDiv)
						jQuery("#temporalQryEventsContainerTable").append(Row);

					if(QueryReportWin)
						jQuery("#temporalQryEventsContainerTable",QueryReportWin.document).append(qdDescription);
					if(QueryReportDiv)
						jQuery("#temporalQryEventsContainerTable").append(qdDescription);
				}
				catch(e)
				{
					console.error(e);
				}
			}

			//Populate temporal query events relation section
			if(this.queryPanelObjForPrinting.subQryStructure && this.queryPanelObjForPrinting.subQryStructure.length>0){
				var temporalQEventsRelTable = null;
				if(QueryReportWin)
					temporalQEventsRelTable = QueryReportWin.document.getElementById("temporalQryEventsRelationsTable");
				if(QueryReportDiv)
					temporalQEventsRelTable = $("temporalQryEventsRelationsTable");

				try{
					var qdDescription = this.getTemporalQueryEventRelations(temporalQEventsRelTable);
				}	
				catch(e)
				{
					console.error(e);
				}	
			}			

			if(!previewQueryOnly){
				//Populate the query results section
				if(resultText.length>0)
					var resultsArray = parseInputIntoArray(resultText, false);
				else
					var resultsArray = parseInputIntoArray(this.XMLResultsStringForPrint, false);

				if(resultsArray && resultsArray.length>0){
					try{
						if(QueryReportWin)
							this.createResultsForPrint(resultsArray,QueryReportWin);
						else{
							if(browserIsIE)
								this.createResultsForPrintInPanel(resultsArray);
							else
								this.createResultsForPrint(resultsArray,false);
						}
					}
					catch(e)
					{
						console.error(e);
					}
				}
				else  // There is no results, so no need to show Query Results section
				{
					var resultTitleDiv = null;
					if(QueryReportWin)
						resultTitleDiv = QueryReportWin.document.getElementById("qrsTitle");
					if(QueryReportDiv)
						resultTitleDiv = $("qrsTitle");

					if(resultTitleDiv){
						resultTitleDiv.parentNode.removeChild(resultTitleDiv);
					}
				}
			}
			else  // This window is to only show the query structure preview, so no need to show Query Results section
			{
				var resultTitleDiv = null;
				if(QueryReportWin)
					resultTitleDiv = QueryReportWin.document.getElementById("qrsTitle");
				if(QueryReportDiv)
					resultTitleDiv = $("qrsTitle");

				if(resultTitleDiv){
					resultTitleDiv.parentNode.removeChild(resultTitleDiv);
				}
			}
			var loaderDiv = null;
			if(QueryReportWin)
				loaderDiv = QueryReportWin.document.getElementById("QueryReportLoading");
			if(QueryReportDiv){
				// if(browserIsIE && printFromId)
				loaderDiv = jQuery(QueryReportDiv).find('#QueryReportLoading');
				// else
				// loaderDiv = jQuery("#infoQueryStatusReport #QueryReportLoading");
			}

			if(loaderDiv)
				jQuery(loaderDiv).addClass("no-show");

			var resultsDiv = null;
			if(QueryReportWin)
				resultsDiv = QueryReportWin.document.getElementById("QueryReportContainer");
			if(QueryReportDiv){
				// if(browserIsIE && printFromId)
				resultsDiv = jQuery(QueryReportDiv).find('#QueryReportContainer');
				// else
				// resultsDiv = $("#infoQueryStatusReport #QueryReportContainer");
			}

			if(resultsDiv)
				jQuery(resultsDiv).removeClass("no-show");

			if((browserIsIE) && (printFromId || previewQueryOnly))
			{
				// this.PrintElem();
				// jQuery(resultsDiv).html(savedHTML);
			}
		}
		else{
			alert("Currently no query is available for printing. \nPlease generate a query before clicking on [Print Query] button.");
		}
	};

//	=====================================================================================================//

	function sqlToJsDate(sqlDate){
		//sqlDate in SQL DATETIME format ("yyyy-mm-dd hh:mm:ss.ms")
		var sqlDateArr1 = sqlDate.split("-");
		//format of sqlDateArr1[] = ['yyyy','mm','dd hh:mm:ms']
		var sYear = sqlDateArr1[0].toString();
		var sMonth = sqlDateArr1[1].toString();
		var sqlDateArr2 = sqlDateArr1[2].split("T");
		//format of sqlDateArr2[] = ['dd', 'hh:mm:ss.ms']
		var sDay = sqlDateArr2[0].toString();
		var sqlDateArr3 = sqlDateArr2[1].split(":");
		//format of sqlDateArr3[] = ['hh','mm','ss.ms']
		var sHour = sqlDateArr3[0].toString();
		var sMinute = sqlDateArr3[1].toString();
		var sqlDateArr4 = sqlDateArr3[2].split(".");
		//format of sqlDateArr4[] = ['ss','ms']
		var sSecond = sqlDateArr4[0].toString();
		var sqlDateArr4 = sqlDateArr4[1].split("Z");
		var sMillisecond = sqlDateArr4[0];
		return new Date(sYear,sMonth,sDay,sHour,sMinute,sSecond,sMillisecond);
	}

	function isDate(val) {
		val = new Date(val);
		try{
			return new Date(val.getYear(),val.getMonth(),val.getDate(),val.getHours(),val.getMinutes(),val.getSeconds(),val.getMilliseconds());
		}
		catch(e){
			return false;
		}
	}

	this.getQueryDetails = function(queryObj,query_user_id,previewQueryOnly,QueryReportWin,objId){
		var username = this.getQueryUserFullName(query_user_id);
		var instanceRec = this.QI_Rec_ForPrinting;
		var dateInfoProvided = false;
		var diff = "";
		if(instanceRec.start_date && instanceRec.end_date){
			var start_date = moment(instanceRec.start_date).format("YYYY-MM-DD HH:mm:ss"); //sqlToJsDate(instanceRec.start_date);
			var end_date = moment(instanceRec.end_date).format("YYYY-MM-DD HH:mm:ss");//sqlToJsDate(instanceRec.end_date);
			if(end_date && start_date)
			{
				try{
					var startDateMillsecElm = $("startDateMillsecElem");
					var endDateMillsecElm = $("endDateMillsecElem");
					if(startDateMillsecElm && endDateMillsecElm )
					{
						diff = (Math.floor((endDateMillsecElm.value - startDateMillsecElm.value)/100))/10;
					}
					else
					{
						diff = moment.duration((moment(instanceRec.end_date)).diff(moment(instanceRec.start_date)));
						diff = (Math.floor((diff.asMilliseconds())/100))/10;
					}
					dateInfoProvided = true;
				}
				catch(e){
					console.log(e);
				}

			}
		}
		var text = "";
		var qrNameNotProvided = false;
		if(queryObj.name.length <= 0){
			text = 'No Query Name is currently provided';
			qrNameNotProvided = true;
		}
		else{
			if(previewQueryOnly)
				text = 'The query is entitled "' + queryObj.name + '"';
			else
				text = 'The query entitled "' + queryObj.name ;
		}

		if(dateInfoProvided == true && !previewQueryOnly){
			text = (qrNameNotProvided ? 'The query "' : '') + text + '" submitted on ' +  
			start_date.toLocaleString('en-GB') + ', was successfully completed on '+  
			end_date.toLocaleString('en-GB') + '. This query was performed by "'+ username + 
			'". The search was completed in ' + 
			diff.toString() + ' seconds.' ;
		}

		if(QueryReportWin)
			jQuery("#" + objId,QueryReportWin.document).append('<tr><td>' + text.toString() + '</td></tr>');
		else
			jQuery("#" + objId).append('<tr><td>' + text.toString() + '</td></tr>');
	};

	this.getQrTiming = function(queryObj,QueryReportWin,objId){
		var tdText = "";
		if(queryObj.timing)
		{
			switch(queryObj.timing)
			{
			case "ANY":
				tdText = " Temporal Constraint: Treat All Groups Independently";
				break;
			case "SAMEVISIT":
				tdText = " Temporal Constraint: Selected groups occur in the same financial encounter";
				break;
			case "TEMPORAL":   //Temporal query
				query_order = "Groups occur in the same sequence from left to right";
				tdText = " Temporal Constraint: Population in which events occur";
			}
			if(QueryReportWin)
				jQuery("#" + objId,QueryReportWin.document).append('<tr><td>' + tdText + '</td></tr>');
			else
				jQuery("#" + objId).append('<tr><td>' + tdText + '</td></tr>');
		}
	};

	this.getQueryDescription = function(queryObj) {
		var elemToAppend = "";

		if(queryObj.length > 0)
		{
			elemToAppend = "<tr>";
			var panelNum = 0;
			elemToAppend = elemToAppend + "<td width=\"5px\"><div class=\"tabSpace\"></div></td>";

			var tdObj = "<td width=\"610px\">";

			queryObj.each(function(queryData){
				var andCounter = 0;
				var subQryEventNameDisplayed = false;
				queryData.each(function(panelData){
					var orCounter = 0;
					var numItemsInPanel = panelData.items.length;

					if (numItemsInPanel > 0) {
						var panelContdivObj = "<div class=\"panelContainer";
						var PanelTableObj = "<table width=\"615px\" border=\"0\">";
						var PanelTableTrObj = "<tr>";
						var PanelTableTd1Obj = "<td width=\"5px\"><div class=\"tabSpace\"></div></td>";
						PanelTableTrObj = PanelTableTrObj + PanelTableTd1Obj;
						var PanelTableTd2Obj = "<td width=\"610px\">";
						panelNum++ ;
						var panelOperatorDivId = "PanelOp-" + panelNum;
						var panelOperatorDiv = "<div id=\"" + panelOperatorDivId + "\" class=\"opDiv\">";
						if(andCounter == 0){
							andCounter++ ;
							if (panelData.exclude)
							{
								panelOperatorDiv = panelOperatorDiv + "NOT";
								panelContdivObj = panelContdivObj + " notOpPanel";
							}
						}
						else
						{
							var text = "AND";
							if (panelData.exclude)
							{
								text = "AND   NOT";
								panelContdivObj = panelContdivObj + " notOpPanel";
							}
							panelOperatorDiv = panelOperatorDiv + text;
							andCounter++ ;
						}
						var panelItemDiv = "<div class=\"panelItem\">";

						var panelTiming = "";
						switch(panelData.timing)
						{
						case "ANY":
							panelTiming = "Independent of Visit";
							break;
						case "SAMEVISIT":
							panelTiming = "Occurs in Same Encounter";
							break;
						case "SAMEINSTANCENUM":
							panelTiming = "Items Instance will be the same";
							break;
						}

						var panelItemOccurrenceText = "# of times an item is recorded is > " + panelData.occurs;

						panelData.items.each(function(itemData){
							var data = itemData;
							if(!(typeof itemData.origData == 'undefined'))
								data = itemData.origData;
							var qrPanelItemTableObj = "<table class=\"qrPanelItemTable\">";
							var qrPanelItemTableTrObj = "<tr>";
							var imageObj = null;


							var itemDateFrom = "";
							if(itemData.dateFrom)
							{
								if(itemData.dateFrom.Month && itemData.dateFrom.Day && itemData.dateFrom.Year)
									itemDateFrom = itemData.dateFrom.Month + "/" + itemData.dateFrom.Day + "/" + itemData.dateFrom.Year;
								else
								{
									itemDateFrom = itemData.dateFrom;
								}
							}

							var itemDateTo = "";
							if(itemData.dateTo)
							{
								if(itemData.dateTo.Month && itemData.dateTo.Day && itemData.dateTo.Year)
									panelDateTo = itemData.dateTo.Month + "/" + itemData.dateTo.Day + "/" + itemData.dateTo.Year;
								else
								{
									itemDateTo = itemData.dateTo;
								}
							}

							var itemDateRangeText = "From earliest date available to latest date available";
							if(itemData.dateFrom && itemData.dateTo)
							{
								if(itemDateFrom == "none")
									itemDateFrom = "earliest date available";
								if(itemDateTo == "none")
									itemDateTo = "latest date available";
								itemDateRangeText = "From " + itemDateFrom + " to " + itemDateTo;
							}
							else
							{
								if(itemDateFrom == "none")
									itemDateFrom = "earliest date available";
								if(itemDateTo == "none")
									itemDateTo = "latest date available";
								if(itemData.dateFrom && !itemData.dateTo)
									itemDateRangeText = "From " + itemDateFrom + " to latest date available";

								if(!itemData.dateFrom && itemData.dateTo)
									itemDateRangeText = "From earliest date available to " + itemDateTo;
							}


							//Evaluate the lab values
							var str_lab_values = "";
							if(data.LabValues){
								var v_lab_values = data.LabValues;

								if(v_lab_values.GeneralValueType == "NUMBER") {
									var labOp = "";
									switch(v_lab_values.NumericOp)
									{
									case "LT":
										labOp = " <";
										break;
									case "LE":
										labOp = " <=";
										break;
									case "EQ":
										labOp = " =";
										break;
									case "BETWEEN":
										labOp = " Between";
										break;
									case "GE":
										labOp = " >=";
										break;
									case "GT":
										labOp = " >";
										break;
									}
									str_lab_values =
										labOp +" ";

									if((v_lab_values.ValueLow != null) ||
											(v_lab_values.ValueLow != undefined)
									){
										str_lab_values +=
											v_lab_values.ValueLow + " - "+
											v_lab_values.ValueHigh;
									} else {
										str_lab_values +=
											v_lab_values.Value;
									}							
									str_lab_values += " "+ v_lab_values.UnitsCtrl;
								}
								//String
								else if((v_lab_values.ValueString != null) ||
										(v_lab_values.ValueString != undefined)
								){
									str_lab_values =
										"By String: "+
										v_lab_values.ValueString;
								}
								//Flag
								else if((v_lab_values.ValueFlag != null) ||
										(v_lab_values.ValueFlag != undefined)
								){
									var v_flag = "Normal";
									if(v_lab_values.ValueFlag == "H"){
										v_flag = "High";
									}
									else if(v_lab_values.ValueFlag == "L"){
										v_flag = "Low";
									}

									str_lab_values = 
										"By Flag: "+ v_flag;
								}
								// End evaluate lab values
							}
							if(data.hasChildren)  //It is a previous query inside a query, so no item-icon provided
							{	
								if( data.hasChildren.indexOf("LA") >=0 )
								{
									imageObj = "<img src=\"js-i2b2/cells/ONT/assets/sdx_ONT_CONCPT_leaf.gif\" style=\"float:left;margin-top:5px;margin-right:5px;\">";
								}
								else
								{
									imageObj = "<img src=\"js-i2b2/cells/ONT/assets/sdx_ONT_CONCPT_branch-exp.gif\" style=\"float:left;margin-top: 5px;margin-right: 5px;\">";
								}
							}
							if(imageObj)
							{
								var nameText = "";
								if(data.newName)
									nameText = data.newName;
								else
									nameText = data.name;
								var qrPanelItemTableTdObj = "<td width=\"610px\" style=\"font-weight:bold; font-size:18px;\"><div width=\"400px\" style=\"display:inline;\">" + imageObj + "<div>" + "    " + nameText + str_lab_values + "</div></div>" + "</td>";
							}
							else
							{
								var qrPanelItemTableTdObj = "<td width=\"610px\" style=\"font-weight:bold; font-size:18px;\">" + data.name + str_lab_values + "</td>";
							}


							qrPanelItemTableTrObj = qrPanelItemTableTrObj + qrPanelItemTableTdObj;
							qrPanelItemTableObj = qrPanelItemTableObj + qrPanelItemTableTrObj + "</tr>";

							qrPanelItemTableTrObj = "<tr>";
							qrPanelItemTableTdObj = "<td width=\"610px\" style=\"font-weight:bold; font-size:14px;\">" + data.tooltip + "</td>";
							qrPanelItemTableTrObj = qrPanelItemTableTrObj + qrPanelItemTableTdObj + "</tr>";
							qrPanelItemTableObj = qrPanelItemTableObj + qrPanelItemTableTrObj;

							qrPanelItemTableTrObj = "<tr>";
							qrPanelItemTableTdObj = "<td width=\"610px\"  style=\"font-size:14px;\">" + panelTiming + "</td>" ;
							qrPanelItemTableTrObj = qrPanelItemTableTrObj + qrPanelItemTableTdObj + "</tr>";
							qrPanelItemTableObj = qrPanelItemTableObj + qrPanelItemTableTrObj;

							qrPanelItemTableTrObj = "<tr>";
							qrPanelItemTableTdObj = "<td width=\"610px\" style=\"font-size:14px;\">" + itemDateRangeText + "</td>" ;
							qrPanelItemTableTrObj = qrPanelItemTableTrObj + qrPanelItemTableTdObj + "</tr>";
							qrPanelItemTableObj = qrPanelItemTableObj + qrPanelItemTableTrObj;

							qrPanelItemTableTrObj = "<tr>";
							qrPanelItemTableTdObj = "<td width=\"610px\" style=\"font-size:14px;\">" + panelItemOccurrenceText + "</td>" ;
							qrPanelItemTableTrObj = qrPanelItemTableTrObj + qrPanelItemTableTdObj + "</tr>";
							qrPanelItemTableObj = qrPanelItemTableObj + qrPanelItemTableTrObj;

							qrPanelItemTableObj = qrPanelItemTableObj + "</table>";
							panelItemDiv = panelItemDiv + "<br>" + qrPanelItemTableObj + "<br>";

							if(++orCounter < numItemsInPanel)
							{
								var orDiv = "<div style=\"font-size: 20px;font-style: italic;font-weight: bold;\">" + "OR" + "</div>";
								panelItemDiv = panelItemDiv + orDiv;
							}
							if( nameText === undefined)
                                                        {
                                                                panelItemDiv = "<div class=\"panelItem\">";
                                                        }

						});
						panelItemDiv = panelItemDiv + "</div>";
						PanelTableTd2Obj = PanelTableTd2Obj + panelItemDiv + "</td>";
						PanelTableTrObj = PanelTableTrObj + PanelTableTd2Obj + "</tr>";
						PanelTableObj = PanelTableObj + PanelTableTrObj + "</table>";
						panelContdivObj = panelContdivObj + "\">" + PanelTableObj + "</div>";

						panelOperatorDiv = panelOperatorDiv + "</div>";
						if(panelData.subquery)
						{
							if(!subQryEventNameDisplayed){
								var eventNameDiv = "<div class=\"opDiv\">" + panelData.name + "</div>";
								tdObj = tdObj + eventNameDiv + panelOperatorDiv + panelContdivObj;
								subQryEventNameDisplayed = true;
							}
							else
								tdObj = tdObj + panelOperatorDiv + panelContdivObj;
						}
						else
							tdObj = tdObj + panelOperatorDiv + panelContdivObj;
					}
				});
			});
		}
		if(elemToAppend)
			elemToAppend = elemToAppend + tdObj + "</td></tr>";
		return elemToAppend;
	};

	this.getTemporalQueryEventRelations = function(eventsRelTable){
		if(this.queryPanelObjForPrinting.subQryRelationStructure.length > 0 )
		{
			var Row = new Element('tr');
			var Cell = new Element('td',{'width':'5px'});
			var divInCell = new Element('div',{'class':'tabSpace'});
			Row.insert(Cell.insert(divInCell));
			Cell = new Element('td',{'class':'eventsRelHdr'}).update('Order of Events');
			Row.insert(Cell);
			var tempDiv = new Element('div');
			tempDiv.insert(Row);
			jQuery(eventsRelTable).append(jQuery(tempDiv).html());
		}

		this.queryPanelObjForPrinting.subQryRelationStructure.each(function(relation){
			var Row = new Element('tr');
			var Cell = new Element('td',{'width':'5px'});
			var divInCell = new Element('div',{'class':'tabSpace'});
			Row.insert(Cell.insert(divInCell));

			Cell = new Element('td', {'class' : 'eventsRel'});
			var mnSpan = new Element('span', {'class' : 'eventsRelSpan'});
			var mainSpan = new Element('center');
			var textFirst = relation.firstQryJoinCol + " " + relation.firstQryOp + "  occurrence for " + relation.firstQryEvntNm;
			var firstSpan = new Element('span').update(textFirst);
			mainSpan.insert(firstSpan).insert(new Element('br'));
			var relationOperator = "";
			switch(relation.operator)
			{
			case "LESS":
				relationOperator = "Occurs Before";
				break;
			case "LESSEQUAL":
				relationOperator = "Occurs On Or Before";
				break;
			case "EQUAL":
				relationOperator = "Occurs Simultaneously With";
				break;
			case "GREATER":
				relationOperator = "Occurs After";
				break;
			case "GREATEREQUAL":
				relationOperator = "Occurs On or After";
				break;
			default:
				break;
			}
			var textOperator = relationOperator.length>0 ? relationOperator : relation.operator;
			var opSpan = new Element('span').update(textOperator);
			mainSpan.insert(opSpan).insert(new Element('br'));
			var textSecond = relation.secondQryJoinCol + " of " + relation.secondQryOp + "  occurrence of " + relation.secondQryEvntNm;
			var secondSpan = new Element('span').update(textSecond);
			mainSpan.insert(secondSpan).insert(new Element('br'));

			var firstSpan = true;
			relation.spans.each(function(thisSpan){
				switch(thisSpan.oprator)
				{
				case "GREATER" :
					thisSpan.oprator = ">";
					break;
				case "GREATEREQUAL" :
					thisSpan.oprator = ">=";
					break;
				case "EQUAL" :
					thisSpan.oprator = "=";
					break;
				case "LESSEQUAL" :
					thisSpan.oprator = "<=";
					break;
				case "LESS" :
					thisSpan.oprator = "<";
					break;
				default:
					break;
				}
				var text = "";
				if(firstSpan)
				{
					text = " By " + thisSpan.oprator + " " + thisSpan.value + " " + thisSpan.units;
					firstSpan = false;
				}
				else
				{
					text = " And " + thisSpan.oprator + " " + thisSpan.value + " " + thisSpan.units;
				}
				mainSpan.insert((new Element('span')).update(text)).insert(new Element('br'));
			});
			mnSpan.insert(mainSpan);
			Row.insert((Cell).insert(mnSpan));
			var tempDiv = new Element('div');
			tempDiv.insert(Row);
			jQuery(eventsRelTable).append(jQuery(tempDiv).html());
		});
	};

	this.createResultsForPrint = function(dataArray,child){
		//Take care of the patient number element separately
		patientNumItem = $H();
		var resultNumber = 0;
		dataArray.each(function(data){
			if(data[1].trim().toLowerCase().indexOf('number of patients') >= 0)
			{
				patientNumItem.set('Total Patients Matching Query',data[4].trim());
			}
		});

		var reultsContDivId = "table-" + resultNumber++ ;
		var contDiv = null;
		var reultsTable = new Element('table',{'class':'reultsTable'});
		patientNumItem.each(function(item){
			var itemValue = item.value;
			if (i2b2.PM.model.isObfuscated) {
				if (itemValue < 4){
					itemValue = i2b2.CRC.view.graphs.sObfuscatedText;
				} else {
					itemValue += i2b2.CRC.view.graphs.sObfuscatedEnding;
				}
			}
			if(i2b2.UI.cfg.useFloorThreshold){
				if (item.value < i2b2.UI.cfg.floorThresholdNumber){
					itemValue = i2b2.UI.cfg.floorThresholdText + i2b2.UI.cfg.floorThresholdNumber.toString();
				}
			}
			contDiv = new Element('div',{'id':reultsContDivId});
			var trObj = new Element('tr');
			var tdObj = new Element('td' , {'class' : 'descResultshead'}).update('Total Patients Matching Query');
			reultsTable.insert(trObj.insert(tdObj));

			trObj = new Element('tr');
			tdObj = new Element('td' , {'class' : 'descResults'}).update(itemValue);
			reultsTable.insert(trObj.insert(tdObj));
			contDiv.insert(reultsTable);
		}); 

		if(child){
			jQuery("#queryResultsContainer",child.document).append('<div class="subTitleDivs">Total Number of Cases</div>');
			jQuery("#queryResultsContainer",child.document).append(jQuery(contDiv).html());
			jQuery("#queryResultsContainer",child.document).append('<br>');
		}
		else
		{
			jQuery("#queryResultsContainer").append('<div class="subTitleDivs">Total Number of Cases</div>');
			jQuery("#queryResultsContainer").append(jQuery(contDiv).html());
			jQuery("#queryResultsContainer").append('<br>');
		}


		//Take care of other results
		uniqueItems = $H();
		for (var i = 0; i < dataArray.length; i++) {
			var key = dataArray[i][1].trim();
			if (key.trim().toLowerCase().indexOf('number of patients') == -1 )
			{
				uniqueItems.set(key,$H());
			}
		}

		uniqueItems.each(function(pair){
			var key = pair.key;
			var item = pair.value;
			dataArray.each(function(data){
				if(data[1].trim() == key)
				{
					var subKey = data[3].trim().substring(0,20);
					var val = data[4].trim();
					item.set(subKey,val);
				}
			});
		});

		// var chartId = 0;
		try {
			jQuery("#infoQueryStatusText").append('<div id="chartsDiv"></div>');
			uniqueItems.each(function(pair){
				//Table Creation
				var valueHash = pair.value;
				var labelsPerChart = [];
				var values = [];
				var index = 0;

				var key = pair.key;

				//Create results table header
				var tableHeadingText = "Total Unique Patients by ";
				var reultsTable = new Element('table' , {'class':'reultsTable'});

				var td1Header = "";
				var td2Header = "Counts";

				if(key.search(/age/i) >= 0)
				{
					td1Header = 'Age';
				}
				else{
					if(key.search(/gender/i) >= 0)
					{
						td1Header = 'Gender';
					}
					else{
						if(key.search(/race/i) >= 0)
						{
							td1Header = 'Race';
						}
						else{
							if(key.search(/vital status/i) >= 0)
							{
								td1Header = 'Vital Status';
							}
							else{
								if(key.search(/specimen type/i) >= 0)
								{
									td1Header = 'Specimen type';
								}
								else
									td1Header = key;
							}
						}
					}
				}
				tableHeadingText += td1Header;

				var trObj = new Element('tr');
				var tdNameObj = new Element('td', {'class' : 'descResultshead' , 'width' : '50%'}).update(td1Header);
				var tdValueObj = new Element('td', {'class' : 'descResultshead' , 'width' : '50%'}).update(td2Header);
				reultsTable.insert(trObj.insert(tdNameObj).insert(tdValueObj));

				reultsContDivId = "table-" + resultNumber++ ;
				valueHash.each(function(item){
					//Populate results table
					var itemValue = item.value;
					if (i2b2.PM.model.isObfuscated) {
						if (itemValue < 4){
							itemValue = i2b2.CRC.view.graphs.sObfuscatedText;
						} else {
							itemValue += i2b2.CRC.view.graphs.sObfuscatedEnding;
						}
					}
					if(i2b2.UI.cfg.useFloorThreshold){
						if (item.value < i2b2.UI.cfg.floorThresholdNumber){
							itemValue = i2b2.UI.cfg.floorThresholdText + i2b2.UI.cfg.floorThresholdNumber.toString();
						}
					}
					contDiv = new Element('div',{'id':reultsContDivId});
					trObj = new Element('tr');
					tdNameObj = new Element('td', {'class' : 'descResults' , 'width' : '50%'}).update(item.key);
					tdValueObj = new Element('td', {'class' : 'descResults' , 'width' : '50%'}).update(itemValue);
					reultsTable.insert(trObj.insert(tdNameObj).insert(tdValueObj));
					contDiv.insert(reultsTable);
					//Generate data for charts
					var quotedItemLabel = '"' + item.key + '"';
					labelsPerChart[index] = quotedItemLabel;
					values[index]=itemValue.split(' ')[0].replace(/,/g, '');
					index++;
				});
				var subResultDivId = "subResults-" + resultNumber;

				if(child){
					jQuery("#queryResultsContainer",child.document).append('<div id="' + subResultDivId + '"></div>');
					jQuery("#" + subResultDivId,child.document).append('<div class="subTitleDivs">' + tableHeadingText + '</div>');
					jQuery("#" + subResultDivId,child.document).append(jQuery(contDiv).html());
					jQuery("#" + subResultDivId,child.document).append('<br>');
				}
				else{
					jQuery("#queryResultsContainer").append('<div id="' + subResultDivId + '"></div>');
					jQuery("#" + subResultDivId).append('<div class="subTitleDivs">' + tableHeadingText + '</div>');
					jQuery("#" + subResultDivId).append(jQuery(contDiv).html());
					jQuery("#" + subResultDivId).append('<br>');
				}

				//Chart Creation
				try{
					jQuery("#chartsDiv").append('<div id="chart"></div>');
					var c3xaxis = pair.value.keys();
					c3xaxis.splice(0, 0, 'x');
					var c3values = values; //pair.value.values();
					var sBreakdownText = "";
					var iPbLocation = pair.key.toLowerCase().indexOf(" patient breakdown");
					if (iPbLocation != -1) {
						sBreakdownText = pair.key.substring(0,iPbLocation);
					} else {
						sBreakdownText = pair.key;
					}
					c3values.splice(0, 0, sBreakdownText);

					if(!(typeof c3 === 'undefined')){
						var chart = c3.generate({
							size: { 
								width: 800,
//								height: 250
								height: 260 //swc20171027 updated to prevent x-axis label clipping
							},
							data: {
								x: 'x',
								columns: [
									c3xaxis,
									c3values
									],
									type: 'bar',
									color: function (color, d) {return "darkblue";},
									labels: {
										format: {
											y: function (v, id) {
												if(i2b2.UI.cfg.useFloorThreshold){
													if (v < i2b2.UI.cfg.floorThresholdNumber){
														return i2b2.UI.cfg.floorThresholdText + i2b2.UI.cfg.floorThresholdNumber.toString();
													}
												}
												if (i2b2.PM.model.isObfuscated) {
													if(v == 0){
														return i2b2.CRC.view.graphs.sObfuscatedText;
													} else {
														return v + i2b2.CRC.view.graphs.sObfuscatedEnding.replace(/\&plusmn;/g, " +/- ");
													}
												} else {
													return v;
												}
											}
										}
									}
							},
							padding: {
								left: 60,
								bottom: 40
							},
							axis: {
								x: {
									type: 'category',
									tick: {
//										rotate: 25
										rotate: -45,//swc20171027 updated to improve readability
										multiline: false //swc20171027 added to improve readability (prevents random wrapping of labels)
									},
//									height: 45
									height: 55 //swc20171027 updated to prevent x-axis label clipping
								},
								y: {
									label: {
										text: 'Number of Patients',
									},
									tick: {
										format: d3.format(",")
									}
								}
							},
							bar: {
								width: {
									ratio: 0.50 // this makes bar width 75% of length between ticks
								}
							},
							legend: {
								item: {
									onclick: function (id) {}
								},
								position: 'right'
							}
						});

						if(chart){
							if(child){
								jQuery("#" + subResultDivId,child.document).append('<div id="chart" width="auto"></div>');
								jQuery("#" + subResultDivId + " #chart",child.document).append(chart.element);
							}
							else
							{
								var chartId = 'chart-' + resultNumber;
								jQuery("#" + subResultDivId).append('<div id=\"' + chartId + '\" class=\"qrGraphs\" width="auto"></div>');
								var chartDiv = jQuery("#" + subResultDivId + " #" + chartId);
								chartDiv.append(chart.element);
							}
						}
					}
				}
				catch(e) {
					jQuery("#chartsDiv").remove();
					console.error(e);
				}
				jQuery("#queryResultsContainer",child.document).append('<br>');
			});
			jQuery("#chartsDiv").remove();
		}
		catch(err) {
			jQuery("#chartsDiv").remove();
			console.error(err);
		}
	};

	this.createResultsForPrintInPanel = function(dataArray){
		jQuery("#queryResultsContainer").append('<div id="AllTables" class="QRSDiv"></div>');
		jQuery("#queryResultsContainer").append('<br>');
		jQuery("#queryResultsContainer").append('<div id="AllGraphs" class="QRSDiv"></div>');
		//Take care of the patient number element separately
		patientNumItem = $H();
		var resultNumber = 0;
		dataArray.each(function(data){
			if(data[1].trim().toLowerCase().indexOf('number of patients') >= 0)
			{
				patientNumItem.set('Total Patients Matching Query',data[4].trim());
			}
		});

		var reultsContDivId = "table-" + resultNumber++ ;
		var contDiv = null;
		var reultsTable = new Element('table',{'class':'reultsTable'});
		patientNumItem.each(function(item){
			contDiv = new Element('div',{'id':reultsContDivId});
			var trObj = new Element('tr');
			var tdObj = new Element('td' , {'class' : 'descResultshead'}).update('Total Patients Matching Query');
			reultsTable.insert(trObj.insert(tdObj));

			trObj = new Element('tr');
			tdObj = new Element('td' , {'class' : 'descResults'}).update(item.value);
			reultsTable.insert(trObj.insert(tdObj));
			contDiv.insert(reultsTable);
		}); 

		jQuery("#queryResultsContainer #AllTables").append('<div class="subTitleDivs">Total Number of Cases</div>');
		jQuery("#queryResultsContainer #AllTables").append(jQuery(contDiv).html());
		jQuery("#queryResultsContainer #AllTables").append('<br>');


		//Take care of other results
		uniqueItems = $H();
		for (var i = 0; i < dataArray.length; i++) {
			var key = dataArray[i][1].trim();
			if (key.trim().toLowerCase().indexOf('number of patients') == -1 )
			{
				uniqueItems.set(key,$H());
			}
		}

		uniqueItems.each(function(pair){
			var key = pair.key;
			var item = pair.value;
			dataArray.each(function(data){
				if(data[1].trim() == key)
				{
					var subKey = data[3].trim();
					var val = data[4].trim();
					item.set(subKey,val);
				}
			});
		});

		var chartId = 0;
		var sDivName = "";
		try {
			uniqueItems.each(function(pair){
				//Table Creation
				var valueHash = pair.value;
				var labelsPerChart = [];
				var values = [];
				var index = 0;

				var key = pair.key;

				//Create results table header
				var tableHeadingText = "Total Unique Patients by ";
				var reultsTable = new Element('table' , {'class':'reultsTable'});

				var td1Header = "";
				var td2Header = "Counts";
				if(key.search(/age/i) >= 0)
				{
					td1Header = 'Age';
				}
				else{
					if(key.search(/gender/i) >= 0)
					{
						td1Header = 'Gender';
					}
					else{
						if(key.search(/race/i) >= 0)
						{
							td1Header = 'Race';
						}
						else{
							if(key.search(/vital status/i) >= 0)
							{
								td1Header = 'Vital Status';
							}
							else{
								if(key.search(/specimen type/i) >= 0)
								{
									td1Header = 'Specimen type';
								}
								else
									td1Header = key;
							}
						}
					}
				}
				tableHeadingText += td1Header;

				var trObj = new Element('tr');
				var tdNameObj = new Element('td', {'class' : 'descResultshead' , 'width' : '50%'}).update(td1Header);
				var tdValueObj = new Element('td', {'class' : 'descResultshead' , 'width' : '50%'}).update(td2Header);
				reultsTable.insert(trObj.insert(tdNameObj).insert(tdValueObj));

				reultsContDivId = "table-" + resultNumber++ ;
				valueHash.each(function(item){
					//Populate results table
					contDiv = new Element('div',{'id':reultsContDivId});
					trObj = new Element('tr');
					tdNameObj = new Element('td', {'class' : 'descResults' , 'width' : '50%'}).update(item.key);
					tdValueObj = new Element('td', {'class' : 'descResults' , 'width' : '50%'}).update(item.value);
					reultsTable.insert(trObj.insert(tdNameObj).insert(tdValueObj));
					contDiv.insert(reultsTable);
					//Generate data for charts
					var quotedItemLabel = '"' + item.key + '"';
					labelsPerChart[index] = quotedItemLabel;
					values[index]=item.value;
					index++;
				});

				jQuery("#queryResultsContainer #AllTables").append('<div class="subTitleDivs">' + tableHeadingText + '</div>');
				jQuery("#queryResultsContainer #AllTables").append(jQuery(contDiv).html());
				jQuery("#queryResultsContainer #AllTables").append('<br>');

				//Chart Creation
				try{
					var c3xaxis = pair.value.keys();
					c3xaxis.splice(0, 0, 'x');
					var c3values = pair.value.values();
					var sBreakdownText = "";
					var iPbLocation = pair.key.toLowerCase().indexOf(" patient breakdown");
					if (iPbLocation != -1) {
						sBreakdownText = pair.key.substring(0,iPbLocation);
					} else {
						sBreakdownText = pair.key;
					}
					c3values.splice(0, 0, sBreakdownText);

					sDivName = "chart" + chartId++;
					jQuery("#queryResultsContainer #AllGraphs").append("<div id=\"" + sDivName + "\"></div>");
					jQuery("#queryResultsContainer #AllGraphs").append('<br>');

					if(!(typeof c3 === 'undefined')){
						var chart = c3.generate({
							bindto: '#AllGraphs #' + sDivName,
							size: { 
								width: 700,
//								height: 250
								height: 260 //swc20171027 updated to prevent x-axis label clipping
							},
							data: {
								x: 'x',
								columns: [
									c3xaxis,
									c3values
									],
									type: 'bar',
									color: function (color, d) {return "darkblue";},
									labels: true
							},
							padding: {
								left: 60,
								bottom: 40
							},
							axis: {
								x: {
									type: 'category',
									tick: {
//										rotate: 25
										rotate: -45,//swc20171027 updated to improve readability
										multiline: false //swc20171027 added to improve readability (prevents random wrapping of labels)
									},
//									height: 45
									height: 55 //swc20171027 updated to prevent x-axis label clipping
								},
								y: {
									label: {
										text: 'Number of Patients',
									}
								}
							},
							bar: {
								width: {
									ratio: 0.50 // this makes bar width 75% of length between ticks
								}
							},
							legend: {
								item: {
									onclick: function (id) {}
								}
							}
						});

					}
				}
				catch(e) {
					console.error(e);
				}
			});
		}
		catch(err) {
			console.error(err);
		}
	};

	this.getQueryUserFullName = function(query_user_id)
	{
		var returnValue = query_user_id;
		if(query_user_id)
		{
			try {
				var response = i2b2.PM.ajax.getUser("CRC:PrintQueryNew", {user_id:query_user_id});
				response.parse();
				var data = response.model[0];
				if (data.full_name) { returnValue = data.full_name;}
			} 
			catch (e) {}
		}
		return returnValue;
	};

	function getSelectedValueFromOptions(options)
	{
		var value = null;
		for(k = 0; k < options.length; k++) {
			var thisOption = options[k];
			if(thisOption.selected == true)
			{
				value = options[k].innerHTML;
				break;
			}
		}
		return value;
	}



	this.PrintElem = function(divIdToPrint)
	{
		// Popup(jQuery("#" + divToPrint).html());
		if(jQuery("#" + divIdToPrint)){
			var contents = jQuery("#" + divIdToPrint).html();
			var frame1 = jQuery("<iframe />");
			frame1[0].name = "frame1";
			frame1.css({ "position": "absolute", "top": "-1000000px" });
			jQuery("body").append(frame1);
			var frameDoc = frame1[0].contentWindow ? frame1[0].contentWindow : frame1[0].contentDocument.document ? frame1[0].contentDocument.document : frame1[0].contentDocument;
			frameDoc.document.open();
			//Create a new HTML document.
			frameDoc.document.write("<html><head><title>Query Report</title>");
			//Append the external CSS file.
			frameDoc.document.write("<link rel=\"stylesheet\" href=\"js-i2b2/cells/CRC/assets/print_query.css\">");
			frameDoc.document.write('<link href=\'js-ext/c3code/c3.css\' rel=\'stylesheet\' type=\'text/css\'></head><body>');
			frameDoc.document.write("</head><body>");
			//Append the DIV contents.
			frameDoc.document.write(contents);
			frameDoc.document.write('</body></html>');
			frameDoc.document.close();

			setTimeout(function () {
				window.frames["frame1"].focus();
				window.frames["frame1"].print();
				frame1.remove();
			}, 500);
		}
		else
			alert("Query report can't be printed!");
	};


	function Popup(htmlToPrint) 
	{
		var mywindow = window.open("",'shrinePrintWindow','width=800,height=750,menubar=yes,resizable=yes,scrollbars=yes');
		mywindow.document.write('<html><head><title>Query Report</title><link rel=\'stylesheet\' TYPE=\'text/css\' href=\'js-i2b2/cells/CRC/assets/print_query.css\'>');
		mywindow.document.write('<link href=\'js-ext/c3code/c3.css\' rel=\'stylesheet\' type=\'text/css\'></head><body>');
		mywindow.document.write(htmlToPrint);
		mywindow.document.write('</body></html>');

		mywindow.document.close(); // necessary for IE >= 10
		mywindow.focus(); // necessary for IE >= 10

		mywindow.print();
		mywindow.close();

		return true;
	}

	this.PrintQueryTemplate = "<head>"+
	"<title>Query Report</title>"+
	//"<link href='http://fonts.googleapis.com/css?family=Open+Sans' rel='stylesheet'  type='text/css'>"+
	"<link rel='stylesheet' TYPE='text/css' href='js-i2b2/cells/CRC/assets/print_query.css'>"+
	"<link href='js-ext/c3code/c3.css' rel='stylesheet' type='text/css'>"+
	"</head>"+
	"<body>"+
	"</body>";

	this.PrintQueryBody = 
		"<div id=\"QueryReportLoading\"><img src=\"js-i2b2/cells/CRC/assets/loading.gif\" alt=\"Loading\"/></div>"+
		"<div id='QueryReportContainer' class='no-show'>"+
		"<a class='printReportButton no-print' href='javascript:window.print()' title='Click here to print the report.'><img align='absbottom' border='0' src='assets/images/printer.png'/> Print Report</a>"+
		"<div class='QRMainHeader'>i2b2 Query Report</div>"+
		"<table id='queryDetailsTable'></table>"+
		"<div class='descHead'>Query Definition</div>"+
		"<table id='qdHeaderTable'></table>"+
		"<table id='qdContainerTable'></table><br>"+
		"<table id='temporalQryEventsContainerTable'></table><br>"+
		"<table id='temporalQryEventsRelationsTable'></table>"+
		"<div id='qrsTitle' class='descHead'>Query Results</div>"+
		"<br><div id='queryResultsContainer'></div>" + 
		"<a class='printReportButton no-print' href='javascript:window.print()' title='Click here to print the report.'><img align='absbottom' border='0' src='assets/images/printer.png'/> Print Report</a>"+
		"</div>";

	this.PrintQueryBodyForPanel = 
		"<div id=\"QueryReportLoading\"><img src=\"js-i2b2/cells/CRC/assets/loading.gif\" alt=\"Loading\"/></div>"+
		"<div id='QueryReportContainer' class='no-show'>"+
		"<a class='printReportButton no-print' href='javascript:i2b2.CRC.ctrlr.QT.PrintElem(\"queryReport-viewer-body\")' title='Click here to print the report.'><img align='absbottom' border='0' src='assets/images/printer.png'/> Print Report</a>"+
		"<div class='QRMainHeader'>i2b2 Query Report</div>"+
		"<table id='queryDetailsTable'></table>"+
		"<div class='descHead'>Query Definition</div>"+
		"<table id='qdHeaderTable'></table>"+
		"<table id='qdContainerTable'></table><br>"+
		"<table id='temporalQryEventsContainerTable'></table><br>"+
		"<table id='temporalQryEventsRelationsTable'></table>"+
		"<div id='qrsTitle' class='descHead'>Query Results</div>"+
		"<br><div id='queryResultsContainer'></div>" + 
		"<a class='printReportButton no-print' href='javascript:i2b2.CRC.ctrlr.QT.PrintElem(\"queryReport-viewer-body\")' title='Click here to print the report.'><img align='absbottom' border='0' src='assets/images/printer.png'/> Print Report</a>"+
		"</div>";

	this.queryReportViewer = {
			show: function() {
				if (!i2b2.CRC.ctrlr.QT.queryReportViewer.yuiPanel) {
					// show non-modal dialog with help documentation		
					var panel = new YAHOO.widget.Panel("queryReport-viewer-panel", { 
						draggable: true,
						zindex:10000,
						width: "900px", 
						height: "550px", 
						autofillheight: "body", 
						constraintoviewport: true, 
						context: ["showbtn", "tl", "bl"]
					}); 
					$("queryReport-viewer-panel").show();

					panel.setBody(i2b2.CRC.ctrlr.QT.PrintQueryBodyForPanel);

					panel.beforeHideEvent.subscribe(function() {
						if($("queryReport-viewer-body"))
							$("queryReport-viewer-body").innerHTML="";
					});
					panel.render(document.body); 
					panel.show(); 
					i2b2.CRC.ctrlr.QT.queryReportViewer.yuiPanel = panel;

				} else {
					i2b2.CRC.ctrlr.QT.queryReportViewer.yuiPanel.show();
				}
			},
			hide: function() {
				try {
					i2b2.CRC.ctrlr.QT.queryReportViewer.yuiPanel.hide();
				} catch (e) {}
			}
	};

	/**********************
	 * END Query Report BG 
	 **********************/	

}

console.timeEnd('execute time');
console.groupEnd();
