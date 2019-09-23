/**
 * @projectDescription	View controller for CRC Query Tool window.
 * @inherits 	i2b2.CRC.view
 * @namespace	i2b2.CRC.view.QT
 * @author		Nick Benik, Griffin Weber MD PhD
 * @version 	1.3
 * ----------------------------------------------------------------------------------------
 * updated 9-15-08: RC4 launch [Nick Benik] 
 */
console.group('Load & Execute component file: CRC > view > Main');
console.time('execute time');


//create and save the screen objects
i2b2.CRC.view['QT']     = new i2b2Base_cellViewController(i2b2.CRC, 'QT');

//tdw9 1707c: create house-keeping vars for temporal query
i2b2.CRC.view.QT.isTemporalQueryInit                = false;    
i2b2.CRC.view.QT.isTemporalQueryUIInResetState      = true;    // if true, that means users have not added concepts to any temporal events
i2b2.CRC.view.QT.isShowingTemporalQueryUI           = false;    // whether we are displaying temporal query UI
i2b2.CRC.view.QT.isShowingClassicTemporalQueryUI    = false;    // whether classic temporal query UI is displayed (default=false: show new UI)
i2b2.CRC.view.QT.isShowingPopulationQueryUI         = false;    // whether the population portion of the temporal query UI is shown. (Default is  false)
i2b2.CRC.view.QT.isTutorial                         = false;    // whether tutorial to the SIMPLE temporal query UI is to be shown to assist users
i2b2.CRC.view.QT.tutorialState                      = 0;        // tutorial state starts at 0 (Tutorial is Off)

i2b2.CRC.view.QT.hasTemporalConstraint      = false;
i2b2.CRC.view.QT.temporalEventCounter       = 0;    // counter starts with 0
i2b2.CRC.view.QT.temporalRelationships      = [];   // relationships between Events, initialized in i2b2.events.afterCellInit.subscribe(...)
//tdw9 1707c: some constants.

//Event-level constants
i2b2.CRC.view.QT.TQryEvent                          = {};
i2b2.CRC.view.QT.TQryEvent.eventKey                 = "event";
i2b2.CRC.view.QT.TQryEvent.temporalEventDOMIDPrefix = "temporalEvent_";
i2b2.CRC.view.QT.TQryEvent.panelPrefix              = "panel"; // for naming panel DOM's HTML
i2b2.CRC.view.QT.TQryEvent.panelKey                 = "panel"; // for fetching panel object from DOM's .data() call 

//Panel-level constatns
i2b2.CRC.view.QT.TQryPanel                          = {};
i2b2.CRC.view.QT.TQryPanel.parentPanel              = "parentPanel"; // used as key to associate concept HTML to its containing parent

var queryTimingButton;
//define the option functions
//================================================================================================== //
i2b2.CRC.view.QT.showOptions = function(subScreen) {
	if (!this.modalOptions) {
		var handleSubmit = function() {
			// submit value(s)
			if(this.submit()) {
				var tmpValue = parseInt($('QryTimeout').value,10);
				i2b2.CRC.view['QT'].params.queryTimeout = tmpValue;
				//			var tmpValue = parseInt($('MaxChldDisp').value,10);
				//			i2b2.CRC.view['QT'].params.maxChildren = tmpValue;
			}
		}
		var handleCancel = function() {
			this.cancel();
		}
		this.modalOptions = new YAHOO.widget.SimpleDialog("optionsQT",
				{ width : "400px", 
			fixedcenter : true, 
			constraintoviewport : true, 
			modal: true,
			zindex: 700,
			buttons : [ { text:"OK", handler:handleSubmit, isDefault:true }, 
				{ text:"Cancel", handler:handleCancel } ] 
				} ); 
		$('optionsQT').show();
		this.modalOptions.validate = function() {
			// now process the form data
			var msgError = '';
			//		var tmpValue = parseInt($('MaxChldDisp').value,10);
			//		if (!isNaN(tmpValue) && tmpValue <= 0) {
			//			msgError += "The max number of Children to display must be a whole number larger then zero.\n";
			//		}
//			var tmpValue = parseInt($('QryTimeout').value,10);
//			if (!isNaN(tmpValue) && tmpValue <= 0) {
//			msgError += "The the query timeout period must be a whole number larger then zero.\n";
//			}
//			if (msgError) {
//			alert(msgError);
//			return false;
//			}
			//swc20170914 fixed bugs that let NaN & fractional number slip thru, and typo in error msg 
			var tmpVal = Number($('QryTimeout').value);
			var intVal = parseInt($('QryTimeout').value);
			//alert("your specified query timeout period is " + tmpVal + "\nits integer value is " + intVal); //for debug only
			if (isNaN(tmpVal) || tmpVal != intVal || tmpVal < 1) {
				msgError += "Please note that the query timeout period must be a plain positive whole number (in seconds).\n";
				alert(msgError);
				return false;
			}
			return true;
		};
		this.modalOptions.render(document.body);
	}
	this.modalOptions.show();
	// load settings
//	$('MaxChldDisp').value = this.params.maxChildren;
	$('QryTimeout').value = this.params.queryTimeout;
}

//================================================================================================== //
i2b2.CRC.view.QT.ContextMenuPreprocess = function(p_oEvent) {
	var clickId = false;
	var clickPanel = false;
	var isDone = false;
	var currentNode = this.contextEventTarget;
	var doNotShow = false;

	while (!isDone) {
		// save the first DOM node found with an ID
		if (currentNode.id && !clickId)  {
			clickId = currentNode.id;
		}
		// save and exit when we find the linkback to the panel controller
		if (currentNode.linkbackPanelController) {
			// we are at the tree root... 
			var clickPanel = currentNode.linkbackPanelController;
			isDone = true;
		}
		if (currentNode.parentNode) {
			currentNode = currentNode.parentNode;
		} else {
			// we have recursed up the tree to the window/document DOM...
			isDone = true;
		}
	}
	if (!clickId || !clickPanel) {
		// something is missing, exit
		this.cancel();
		return;
	}
	// see if the ID maps back to a treenode with SDX data
	var tvNode = clickPanel.yuiTree.getNodeByProperty('nodeid', clickId);
	if (tvNode) 
	{
		if (!Object.isUndefined(tvNode.data.i2b2_SDX)) 
		{
			// Make sure the clicked node is at the root level
			if (tvNode.parent == clickPanel.yuiTree.getRoot()) 
			{
				if (p_oEvent == "beforeShow") 
				{
					i2b2.CRC.view.QT.contextRecord = tvNode.data.i2b2_SDX;
					i2b2.CRC.view.QT.contextPanelCtrlr = clickPanel;
					// custom build the context menu according to the concept that was clicked
					var mil = [];
					var op = i2b2.CRC.view.QT;
					mil.push( { text: "Set Date Constraint", onclick: { fn: op.ContextMenuRouter, obj: 'dates' }} );
					// all nodes can be deleted
					mil.push( { text: "Delete", onclick: { fn: op.ContextMenuRouter, obj: 'delete' }} );
					if (i2b2.CRC.view.QT.contextRecord.origData.isModifier) 
					{
						//	if (i2b2.CRC.view.QT.contextRecord.origData.xmlOrig != null) {
						var cdetails = i2b2.ONT.ajax.GetModifierInfo("CRC:QueryTool", {modifier_applied_path:i2b2.CRC.view.QT.contextRecord.origData.applied_path, modifier_key_value:i2b2.CRC.view.QT.contextRecord.origData.key, ont_synonym_records: true, ont_hidden_records: true} );
						// this is what comes out of the old AJAX call
						try { new ActiveXObject ("MSXML2.DOMDocument.6.0"); isActiveXSupported =  true; } catch (e) { isActiveXSupported =  false; }
						if (isActiveXSupported) {
							//Internet Explorer
							xmlDocRet = new ActiveXObject("Microsoft.XMLDOM");
							xmlDocRet.async = "false";
							xmlDocRet.loadXML(cdetails.msgResponse);
							xmlDocRet.setProperty("SelectionLanguage", "XPath");
							var c = i2b2.h.XPath(xmlDocRet, 'descendant::modifier');						
						} else {					 
							var c = i2b2.h.XPath(cdetails.refXML, 'descendant::modifier');
						}
						if (c.length > 0) {
							i2b2.CRC.view.QT.contextRecord.origData.xmlOrig = c[0];
						}
						//	}


						var lvMetaDatas1 = i2b2.h.XPath(i2b2.CRC.view.QT.contextRecord.origData.xmlOrig, 'metadataxml/ValueMetadata[string-length(Version)>0]');
						if (lvMetaDatas1.length > 0) {

							mil.push( { text: "Set Modifier Value", onclick: { fn: op.ContextMenuRouter, obj: 'setmodifier' }} );					
						}
						var lvMetaDatas2 = i2b2.h.XPath(i2b2.CRC.view.QT.contextRecord.origData.parent.xmlOrig, 'metadataxml/ValueMetadata[string-length(Version)>0]');
						if (lvMetaDatas2.length > 0) {
							mil.push( { text: "Set Value...", onclick: { fn: op.ContextMenuRouter, obj: 'labvalues' }} );
						}

					} else {
						// For lab tests...

						if (!Object.isUndefined(i2b2.CRC.view.QT.contextRecord.origData.key)) {
							var cdetails = i2b2.ONT.ajax.GetTermInfo("CRC:QueryTool", {concept_key_value:i2b2.CRC.view.QT.contextRecord.origData.key, ont_synonym_records: true, ont_hidden_records: true} );
							try { new ActiveXObject ("MSXML2.DOMDocument.6.0"); isActiveXSupported =  true; } catch (e) { isActiveXSupported =  false; }

							if (isActiveXSupported) {
								//Internet Explorer
								xmlDocRet = new ActiveXObject("Microsoft.XMLDOM");
								xmlDocRet.async = "false";
								xmlDocRet.loadXML(cdetails.msgResponse);
								xmlDocRet.setProperty("SelectionLanguage", "XPath");
								var c = i2b2.h.XPath(xmlDocRet, 'descendant::concept');						
							} else {					
								var c = i2b2.h.XPath(cdetails.refXML, 'descendant::concept');
							}
							if (c.length > 0) {
								i2b2.CRC.view.QT.contextRecord.origData.xmlOrig = c[0];
							}
						}

						var lvMetaDatas = i2b2.h.XPath(i2b2.CRC.view.QT.contextRecord.origData.xmlOrig, 'metadataxml/ValueMetadata[string-length(Version)>0]');
						if (lvMetaDatas.length > 0) {
							mil.push( { text: "Set Value...", onclick: { fn: op.ContextMenuRouter, obj: 'labvalues' }} );
						}
					}
					i2b2.CRC.view.QT.ContextMenu.clearContent();
					i2b2.CRC.view.QT.ContextMenu.addItems(mil);
					i2b2.CRC.view.QT.ContextMenu.render();
				}
			} else {
				// not root level node
				doNotShow = true;
			}
		} else {
			// no SDX data
			doNotShow = true;
		}
	} else {
		// not a treenode
		doNotShow = true;
	}
	if (doNotShow) {
		if (p_oEvent == "beforeShow") { i2b2.CRC.view.QT.ContextMenu.clearContent(); }
		if (p_oEvent == "triggerContextMenu") { this.cancel(); }
	}
}

//================================================================================================== //
i2b2.CRC.view.QT.ContextMenuRouter = function(a, b, actionName) {
	// this is used to route the event to the correct handler
	var op = i2b2.CRC.view.QT;  // object path
	var cdat = { // context node data
			data: op.contextRecord,
			ctrlr: op.contextPanelCtrlr
	};
	// route accordingly
	switch(actionName) {
	case "dates":
		// nw096 - Date Constraints overhaul
		cdat.ctrlr.showDateConstraint(cdat.ctrlr, cdat.data);
		break;
	case "delete":
		// delete item from the panel
		cdat.ctrlr._deleteConcept(cdat.data.renderData.htmlID, cdat.data);
		break;
	case "labvalues":
		cdat.ctrlr.showLabValues(cdat.data.sdxInfo.sdxKeyValue, cdat.data);
		break;
	case "setmodifier":
		cdat.ctrlr.showModValues(cdat.data.sdxInfo.sdxKeyValue, cdat.data);
		break;
	default:
		alert('context event was not found for event "'+actionName+'"');
	}
}

//================================================================================================== //

i2b2.CRC.view.QT.enableSameTiming = function() {

	if (YAHOO.util.Dom.inDocument(queryTimingButton.getMenu().element)) {

		var t = queryTimingButton.getMenu().getItems();
		if (t.length == 2) {
			//	queryTimingButton.getMenu().clearContent();
			//	queryTimingButton.getMenu().addItems([ 	 
			//						{ text: "Treat Independently", value: "ANY"}]);	
			//	queryTimingButton.getMenu().addItems([ 	 
			//						{ text: "Selected groups occur in the same financial encounter", value: "SAMEVISIT" }]);	 
			queryTimingButton.getMenu().addItems([ 	 
				{ text: "Non-Temporal Query: Items Instance will be the samer", value: "SAMEINSTANCENUM" }]);	 
			queryTimingButton.getMenu().render();
		}
	} else {
		queryTimingButton.itemData =[{ text: "Non-Temporal Query: Treat Independently", value: "ANY"},
			{ text: "Non-Temporal Query: Selected groups occur in the same financial encounter", value: "SAMEVISIT"},
			{text: "Non-Temporal Query: Items Instance will be the same", value: "SAMEINSTANCENUM" }];
	}
}

i2b2.CRC.view.QT.clearTemportal = function() {
	i2b2.CRC.view.QT.setQueryTiming("ANY");

	var t = defineTemporalButton.getMenu().getItems();
	if (t.length > 4) {

		defineTemporalButton.getMenu().clearContent();
		defineTemporalButton.getMenu().addItems([ 	 
			{ text: "Population in which events occur" , value: "0" }]);		 
		defineTemporalButton.getMenu().addItems([ 	 
			{ text: "Event 1" , value: "1" }]);	
		defineTemporalButton.getMenu().addItems([ 	 
			{ text: "Event 2" , value: "2" }]);	 
		defineTemporalButton.getMenu().addItems([ 	 
			{ text: "Define order of events" , value: "BUILDER" }]);	
		defineTemporalButton.getMenu().render();			

	}
	i2b2.CRC.view.QT.ResizeHeight();

}
//================================================================================================== //

i2b2.CRC.view.QT.setQueryTiming = function(sText) {

	//TODO cleanup

	if (YAHOO.util.Dom.inDocument(queryTimingButton.getMenu().element)) {

		queryTimingButton.getMenu().clearContent();
		queryTimingButton.getMenu().addItems([ 	 
			{ text: "Non-Temporal Query: Treat Independently", value: "ANY"}]);	
		queryTimingButton.getMenu().addItems([ 	 
			{ text: "Non-Temporal Query: Selected groups occur in the same financial encounter", value: "SAMEVISIT" }]);
		queryTimingButton.getMenu().addItems([
			{ text: "Temporal Query: Define sequence of Events", value: "TEMPORAL" }]);									
		if (sText == "SAMEINSTANCENUM") {
			queryTimingButton.getMenu().addItems([ 	 
				{ text: "Non-Temporal Query: Items Instance will be the same", value: "SAMEINSTANCENUM" }]);	 
		}
		queryTimingButton.getMenu().render();
	}  else {

		if (sText =="TEMPORAL") {
			queryTimingButton.set("label",  "Temporal Query: Define sequence of Events");	

			i2b2.CRC.ctrlr.QT.queryTiming = "TEMPORAL";
			$('defineTemporalBar').show();	

		} else if (sText =="SAMEVISIT") {
			queryTimingButton.set("label",  "Non-Temporal Query: Selected groups occur in the same financial encounter");	
		} else if (sText == "ANY") {
			queryTimingButton.set("label",  "Non-Temporal Query: Treat Independently");	
			$('defineTemporalBar').hide();					
		}

	}

	queryTimingButton.getMenu().render();
	var menu = queryTimingButton.getMenu();

	if (sText == "SAMEINSTANCENUM" )
	{
		var item = menu.getItem(3);
	} else if (sText == "SAMEVISIT" )
	{
		var item = menu.getItem(1);
	} else if (sText == "TEMPORAL" )
	{
		var item = menu.getItem(2);
	} else
	{
		var item = menu.getItem(0);		
	}
	queryTimingButton.set("selectedMenuItem", item);

}

//================================================================================================== //

i2b2.CRC.view.QT.setPanelTiming = function(panelNum, sText) {
	if (panelNum > 3) {return}
	if (sText == "SAMEVISIT" )
	{
		$("queryPanelTimingB" + (panelNum) +  "-button").innerHTML = "Occurs in Same Encounter";	
		i2b2.CRC.ctrlr.QT.panelControllers[panelNum - 1].doTiming(sText);
		i2b2.CRC.ctrlr.QT.panelControllers[panelNum - 1].refTiming.set('disabled', false);	
	} else if (sText == "SAMEINSTANCENUM") {
		$("queryPanelTimingB" + (panelNum) +  "-button").innerHTML = "Items Instance will be the same";	
		i2b2.CRC.ctrlr.QT.panelControllers[panelNum - 1].doTiming(sText);
		i2b2.CRC.ctrlr.QT.panelControllers[panelNum - 1].refTiming.set('disabled', false);	
	} else {
		$("queryPanelTimingB" + (panelNum) +  "-button").innerHTML = "Treat Independently";	
		i2b2.CRC.ctrlr.QT.panelControllers[panelNum - 1].doTiming(sText);
	}
}

//================================================================================================== //
i2b2.CRC.view.QT.ZoomView = function() {
	i2b2.hive.MasterView.toggleZoomWindow("QT");
}

//================================================================================================== //
i2b2.CRC.view.QT.Resize = function(e) {
	//var ds = document.viewport.getDimensions();
	//var w = ds.width;
	//var h = ds.height
	var w =  window.innerWidth || (window.document.documentElement.clientWidth || window.document.body.clientWidth);
	var h =  window.innerHeight || (window.document.documentElement.clientHeight || window.document.body.clientHeight);


	if (w < 840) {w = 840;}
	if (h < 517) {h = 517;}

	// resize our visual components
	//var queryToolWidth = ds.width * 0.6;
	//$('crcQueryToolBox').style.left = w-queryToolWidth;
	//debugOnScreen("crcQueryToolBox.width = " + queryToolWidth );

	$('crcQueryToolBox').style.left = w-550;
	if (i2b2.WORK && i2b2.WORK.isLoaded) {
		var z = h - i2b2.CRC.cfg.config.ui.statusBox-276; // 438; //392 + 44 - 17 - 25;
		if (i2b2.CRC.view.QT.isZoomed) { z += i2b2.CRC.cfg.config.ui.statusBox - 10; /*196-44*/ }	
	} else {
		var z = h - 348;
		if (i2b2.CRC.view.QT.isZoomed) { z += 196; }
	}
	// display the topic selector bar if we are in SHRINE-mode
	if (i2b2.h.isSHRINE()) {
		$('queryTopicPanel').show();
		z = z - 28;
	}

	$('QPD1').style.height = z;
	$('QPD2').style.height = z;
	$('QPD3').style.height = z;	
	$('temporalbuilders').style.height = z + 50;	

};

//================================================================================================== //
i2b2.CRC.view.QT.splitterDragged = function()
{
	//var viewPortDim = document.viewport.getDimensions();
	var w =  window.innerWidth || (window.document.documentElement.clientWidth || window.document.body.clientWidth);

	var splitter = $( i2b2.hive.mySplitter.name );	
	var CRCQT = $("crcQueryToolBox");
	var CRCQTBodyBox = $("crcQueryToolBox.bodyBox");

	var CRCQueryName 			= $("queryName");
	var CRCQueryNameBar 		= $("queryNameBar");
	var temporalConstraintBar 	= $("temporalConstraintBar");
	var defineTemporalBar 		= $("defineTemporalBar");
	var temporalConstraintLabel = $("temporalConstraintLabel");
	var temporalConstraintDiv	= $("temporalConstraintDiv");
	var queryTiming				= $("queryTiming");
	var queryTimingButton		= $("queryTiming-button");

	var defineTemporal				= $("defineTemporal");
	var defineTemporalButton		= $("defineTemporal-button");

	var CRCQueryPanels 			= $("crcQryToolPanels");
	var CRCinnerQueryPanel		= $("crc.innerQueryPanel");
	var CRCtemoralBuilder		= $("crc.temoralBuilder");
	var basicWidth					= parseInt(w) - parseInt(splitter.style.left) - parseInt(splitter.offsetWidth);

	/* Title, buttons, and panels */		
	CRCQT.style.left				= parseInt(splitter.offsetWidth) + parseInt(splitter.style.left) + 3 + "px";
	CRCQT.style.width				= Math.max(basicWidth - 24, 0) + "px";
	CRCQTBodyBox.style.width 		= Math.max(basicWidth - 41, 0) + "px";

	CRCQueryNameBar.style.width 		= Math.max(basicWidth - 38, 0) + "px";
	temporalConstraintBar.style.width 	= Math.max(basicWidth - 38, 0) + "px";
	defineTemporalBar.style.width 	    = Math.max(basicWidth - 38, 0) + "px";
	if (i2b2.CRC.view.QT.isShowingTemporalQueryUI)
	{
		temporalConstraintDiv.style.width = Math.max(parseInt(temporalConstraintBar.style.width) - parseInt(temporalConstraintLabel.style.width) - 2 - 255, 0) + "px"; //tdw9 1707c: changing compute width
		queryTimingButton.style.width       = Math.max( parseInt(temporalConstraintBar.style.width) - 345,0) + "px"; //tdw9 1707c: changing computed width
	}
	else
	{
		temporalConstraintDiv.style.width = Math.max(parseInt(temporalConstraintBar.style.width) - parseInt(temporalConstraintLabel.style.width) - 2 , 0) + "px"; //tdw9 1707c: changing compute width
		queryTimingButton.style.width = Math.max(parseInt(temporalConstraintBar.style.width)-90, 0) + "px"; //tdw9 1707c: changing computed width
	}
	// TODO: tdw9: may need the following two lines back
	//temporalConstraintDiv.style.width 	= Math.max( parseInt(temporalConstraintBar.style.width) - parseInt(temporalConstraintLabel.style.width)-2, 0) + "px";
	//queryTimingButton.style.width 		= Math.max( parseInt(temporalConstraintBar.style.width) - 250,0) + "px";
	defineTemporalButton.style.width 		= Math.max( parseInt(temporalConstraintBar.style.width) - 250,0) + "px";
	//parseInt(temporalConstraintLabel.style.width)-23, 0) + "px";

	CRCQueryName.style.width			= Math.max(basicWidth - 128, 0) + "px"; // use max to avoid negative width

	CRCQueryPanels.style.width		= Math.max(basicWidth - 30, 0) + "px";
	CRCinnerQueryPanel.style.width	= Math.max(basicWidth - 36, 0) + "px";
	CRCtemoralBuilder.style.width	= Math.max(basicWidth - 36, 0) + "px";


	var panelWidth = (basicWidth - 36)/3 - 4;

	var panels = CRCinnerQueryPanel.childNodes;
	var panelArray = new Array(3);
	var panelCount = 0;
	for ( var i = 0; i < panels.length; i++ )
	{
		if ( panels[i].className === "qryPanel")
		{
			panels[i].style.width = Math.max(panelWidth, 0) + "px";
			var nodes = panels[i].childNodes;
			for ( var j = 0; j < nodes.length; j++ )
			{
				if (nodes[j].className === "qryPanelTitle")
					nodes[j].style.width = Math.max(panelWidth - 2, 0) + "px";
				else if ( nodes[j].className === "qryPanelButtonBar" )
				{
					nodes[j].style.width = Math.max(panelWidth, 0) + "px";
					var buttons = nodes[j].childNodes;
					for ( var k = 0; k < buttons.length; k++)
					{
						if ( buttons[k].className === "qryButtonOccurs")
							buttons[k].style.width = Math.max(panelWidth - 88, 0) + "px";	
					}
				}
				else if ( nodes[j].className === "qryPanelTiming" )
				{
					nodes[j].style.width = Math.max(panelWidth, 0) + "px";
					var queryPanelTimingChildren = nodes[j].childNodes;
					for ( var k = 0; k < queryPanelTimingChildren.length; k++)
					{
						if ( queryPanelTimingChildren[k].style == null )
							continue;
						queryPanelTimingChildren[k].style.width = Math.max(panelWidth - 4, 0) + "px";
					}
					//handle the special "queryPanelTimingB1"
					var queryPanelTimingB1 = $("queryPanelTimingB1");
					queryPanelTimingB1.style.width = Math.max(panelWidth - 4, 0) + "px";
				}
				else if ( nodes[j].className === "queryPanel" || nodes[j].className === "queryPanel queryPanelDisabled" ) // QueryPanel or disabled QueryPanel
					nodes[j].style.width =  Math.max(panelWidth - 8, 0) + "px";
			}
			panelArray[panelCount] = panels[i];
			panelCount++;
		}
		else
			continue;
	}

	/* Deal with Footer and its components */	
	var footer = $("qryToolFooter");	// footer
	var printBox = $('printQueryBox');	// print query
	var groupCount = $("groupCount");	// # of groups
	var scrollBox = $("scrollBox");		// scroll control

	footer.style.width = Math.max(basicWidth - 40, 0) + "px"; // adjust footer width	
	groupCount.style.width =  Math.max(parseInt(footer.style.width) - (printBox.offsetLeft + printBox.offsetWidth) - scrollBox.offsetWidth - 5, 0) + "px"; // adjust groupCount width

	/* Deal with Baloons */
	var baloonBox	= $("queryBalloonBox");
	var baloons = baloonBox.getElementsByTagName("div");

	for ( var i = 0; i < baloons.length; i++ )
	{
		if ( i%2 === 0) // event baloons 
		{
			var index = i/2;
			if ( index < baloons.length)
				baloons[i].style.left	= panelArray[index].offsetLeft + parseInt(panelArray[index].style.width)/2 - 35 + "px";			
		}
		else
		{
			var index = Math.floor(i/2);
			baloons[i].style.left	= panelArray[index].offsetLeft + parseInt(panelArray[index].style.width) - 22.5 + "px";
		}
	}

	// tdw9 1707c: update temporal query UI when it's visible
	if (i2b2.CRC.view.QT.isShowingTemporalQueryUI && !i2b2.CRC.view.QT.isShowingClassicTemporalQueryUI)
	{
		jQuery("#outerTemporalSequenceUI").width(Math.max(0, jQuery("#crc\\.innerQueryPanel").width()-8));
	}
}

//================================================================================================== //
i2b2.CRC.view.QT.ResizeHeight = function() 
{
	var h = window.innerHeight || (window.document.documentElement.clientHeight || window.document.body.clientHeight);

	if (h < 517) {h = 517;}
	// resize our visual components
	if (i2b2.WORK && i2b2.WORK.isLoaded) {
		var z = h - i2b2.CRC.cfg.config.ui.statusBox-276; // 438;
		if (i2b2.CRC.view.QT.isZoomed) 
			z += i2b2.CRC.cfg.config.ui.statusBox+34; //196 /* - 44; //tdw9 1707c: remvoed unnecessary subtraction */
	} 
	else 
	{
		var z = h - 472;
		if (i2b2.CRC.view.QT.isZoomed) { z += 196; }
	}
	// display the topic selector bar if we are in SHRINE-mode
	if (i2b2.h.isSHRINE()) {
		$('queryTopicPanel').show();
		z = z - 28;
	}

	if ($('defineTemporalBar').style.display === '')			
		z = z - 20;

	// tdw9 1707c: adjust panel height and innerQueryPannel height accordingly 
	if (i2b2.CRC.view.QT.isShowingTemporalQueryUI && !i2b2.CRC.view.QT.isShowingClassicTemporalQueryUI)
	{
		var diff = 75 + jQuery('#tutorialDiv').height();
		//if (i2b2.CRC.view.QT.isTutorial)
		//    diff = 75 + 30;
		if (this.isShowingPopulationQueryUI)
		{
			jQuery("#crc\\.innerQueryPanel").height(z + 58);                   // make sure we compute the innerPanel height before the .qryPanel height
			var ht = jQuery("#crc\\.innerQueryPanel").height();
			var dropAreaHeight = Math.max(ht - 62, 0) / 3;
			jQuery(".qryPanel #QPD1").height(dropAreaHeight);
			jQuery(".qryPanel #QPD2").height(dropAreaHeight);
			jQuery(".qryPanel #QPD3").height(dropAreaHeight);
			//jQuery("#queryBalloonBox").css("top", 120 + dropAreaHeight - 45); // adjust "top" for baloons
			var outerHeight = Math.max(0, dropAreaHeight*2-10);
			jQuery("#outerTemporalSequenceUI").height( outerHeight );
			jQuery(".temporalEvent").height(outerHeight - diff);
			jQuery(".temporalPanel").height(outerHeight - diff - 12);
			jQuery(".temporalPanelContentDiv").height(outerHeight-diff-28);
			jQuery(".qryPanel").show();
		}
		else
		{
			jQuery("#crc\\.innerQueryPanel").height(z + 58);                   // make sure we compute the innerPanel height before the .qryPanel height
			var ht = jQuery("#crc\\.innerQueryPanel").height();
			var dropAreaHeight = 0;
			jQuery(".qryPanel #QPD1").height(dropAreaHeight);
			jQuery(".qryPanel #QPD2").height(dropAreaHeight);
			jQuery(".qryPanel #QPD3").height(dropAreaHeight);
			//jQuery("#queryBalloonBox").css("top", 120 + dropAreaHeight - 45); // adjust "top" for baloons
			var outerHeight = Math.max(0, ht-22);
			jQuery("#outerTemporalSequenceUI").height( outerHeight );
			jQuery(".temporalEvent").height(outerHeight - diff);
			jQuery(".temporalPanel").height(outerHeight - diff - 12);
			jQuery(".temporalPanelContentDiv").height(outerHeight-diff-28);
			jQuery(".qryPanel").hide();
		}
	}
	else 
	{
		jQuery(".qryPanel").show();
		// tdw9 1707c: below is the old height resizing code
		$('QPD1').style.height = z;
		$('QPD2').style.height = z;
		$('QPD3').style.height = z;
		$('temporalbuilders').style.height = z + 50;
	}
}

i2b2.CRC.view.QT.addNewTemporalGroup = function() {

	$('addDefineGroup-button').disable();

	i2b2.CRC.ctrlr.QT.temporalGroup = i2b2.CRC.model.queryCurrent.panels.length;
	//i2b2.CRC.ctrlr.QT.temporalGroup = i2b2.CRC.ctrlr.QT.temporalGroup + 1;

	if (YAHOO.util.Dom.inDocument(defineTemporalButton.getMenu().element)) {					
		defineTemporalButton.getMenu().addItems([ 	 
			{ text: "Event " + (i2b2.CRC.ctrlr.QT.temporalGroup), value: i2b2.CRC.ctrlr.QT.temporalGroup}]);	 
		defineTemporalButton.getMenu().render();	
	} else {
		var aMenuItemData=[];
		aMenuItemData[0] = {text: "Event " + (i2b2.CRC.ctrlr.QT.temporalGroup), value: i2b2.CRC.ctrlr.QT.temporalGroup} ;
		defineTemporalButton.getMenu().itemData = aMenuItemData;
	}

	i2b2.CRC.model.queryCurrent.panels[i2b2.CRC.ctrlr.QT.temporalGroup] = {};
	this.yuiTree = new YAHOO.widget.TreeView("QPD1");
	i2b2.CRC.ctrlr.QT.panelAdd(this.yuiTree);
	i2b2.CRC.ctrlr.QT._redrawAllPanels();	

	//Add to define a query	
	for( var i = 0; i < i2b2.CRC.ctrlr.QT.tenporalBuilders + 1; i++){
		var select = document.getElementById("instancevent1["+i+"]");
		select.options[select.options.length] = new Option( 'Event '+i2b2.CRC.ctrlr.QT.temporalGroup, i2b2.CRC.ctrlr.QT.temporalGroup);

		select = document.getElementById("instancevent2["+i+"]");
		select.options[select.options.length] = new Option( 'Event '+i2b2.CRC.ctrlr.QT.temporalGroup, i2b2.CRC.ctrlr.QT.temporalGroup);
	}

	alert('New Event ' + i2b2.CRC.ctrlr.QT.temporalGroup + ' has been added.');

	$('addDefineGroup-button').enable();



};

i2b2.CRC.view.QT.deleteLastTemporalGroup = function() {

	if(i2b2.CRC.model.queryCurrent.panels.length > 3){
		var currentPanels = i2b2.CRC.model.queryCurrent.panels.length - 1;
		i2b2.CRC.model.queryCurrent.panels.pop();
		defineTemporalButton.getMenu().removeItem(defineTemporalButton.getMenu().getItems().length-1);

		for( var i = 0; i < i2b2.CRC.ctrlr.QT.tenporalBuilders + 1; i++){
			var select = document.getElementById("instancevent1["+i+"]");
			select.remove(select.length - 1);

			select = document.getElementById("instancevent2["+i+"]");
			select.remove(select.length - 1);
		}

		alert('Event ' + currentPanels + ' has been removed.');
		//i2b2.CRC.ctrlr.QT.temporalGroup = i2b2.CRC.model.queryCurrent.panels.length;

		defineTemporalButton.getMenu().getItem(0).element.click()

	} else {
		alert('You must leave a minimum of two events.');

	}
};



//Code for SIMPLE temporal query UI

/* when SIMPLE query UI model changes, the query status/chart/report should be reset */
i2b2.CRC.view.QT.resetQueryResults = function()
{
	$('infoQueryStatusText').innerHTML = "";
	$('infoQueryStatusChart').innerHTML = "";
	$('infoQueryStatusReport').innerHTML = "";
};

/* handle errors that occur from switching from ADV to SIMPLE modes */
i2b2.CRC.view.QT.handleSwitchErrors = function( queryPackage )
{
	if (queryPackage.errorName == "Empty Event(s)")
	{
		var detailMsg = "Empty Event(s):";
		for (var i = 0; i < queryPackage.emptyEventIDs.length; i++ )
		{
			detailMsg += " <b>Event " + queryPackage.emptyEventIDs[i] + "</b>";
			if ( i < queryPackage.emptyEventIDs.length-1)
				detailMsg += ",";
		}
		i2b2.CRC.view.QT.showDialog("Cannot Switch to SIMPLE Mode: " + queryPackage.errorName, queryPackage.errorMessage, detailMsg, "ui-icon-alert" );
	}
	else if (queryPackage.errorName == "Event(s) not in Temporal Relatioships")
	{
		var detailMsg = "Event(s) not in temporal relationships:";
		for (var i = 0; i < queryPackage.unrelatedEventNames.length; i++ )
		{
			detailMsg += " <b>" + queryPackage.unrelatedEventNames[i] + "</b>";
			if ( i < queryPackage.unrelatedEventNames.length-1)
				detailMsg += ",";
		}
		i2b2.CRC.view.QT.showDialog("Cannot Switch to SIMPLE Mode: " + queryPackage.errorName, queryPackage.errorMessage, detailMsg, "ui-icon-alert" );
	}
	else
	{
		i2b2.CRC.view.QT.showDialog("Cannot Switch to SIMPLE Mode", queryPackage.errorName, queryPackage.errorMessage, "ui-icon-alert" );
	}
};


/* switches between New and Classic mode of temporal queries, use a 160ms animated delay to hide the toggle and delay the running of the toggle code */
i2b2.CRC.view.QT.toggleTemporalQueryMode = function()
{   
	// hide the toggle so users don't click multiple times
	jQuery("#temporalUIToggleDiv").hide(160, function()
			{ 
		i2b2.CRC.view.QT.doToggleTemporalQueryMode();
			}, 0);
};

i2b2.CRC.view.QT.doHandleSimpleQueryValidationError = function( subMsg )
{
	i2b2.CRC.view.QT.showDialog("Cannot Switch to SIMPLE Mode", "Your temporal query contains advanced features that cannot be accommodated by SIMPLE mode.", subMsg, "ui-icon-alert" );
	i2b2.CRC.view.QT.isShowingClassicTemporalQueryUI = !i2b2.CRC.view.QT.isShowingClassicTemporalQueryUI; // flip state back
	jQuery("#temporalUIToggleDiv").show();
};

//look into ADV's UI to validate the current model to see if there are issues
i2b2.CRC.view.QT.validateADVQueryBeforeSwitching = function()
{
	// tdw9: 1707c: checks for panel_list.length. This only happens when one or more temporal events in the advanced mode has no content whatsoever. An object representing the error is returned.
	//              also checks for if all Events have no panels. In this case, an error "All Invalid Events" is returned. Should handle this by resetting SIMPLE and show its starting state.
	var returnError           = [];
	var hasEmptyEvent         = false;
	var hasAllEmptyEvents     = true;
	var emptyEventIDs         = [];

	for (var ip = 1; ip < i2b2.CRC.model.queryCurrent.panels.length; ip++) //skip checking population
	{
		panel_list = i2b2.CRC.model.queryCurrent.panels[ip];
		if ((panel_list.length == 0) || (panel_list[0].items.length == 0))
		{
			hasEmptyEvent     = true;
			emptyEventIDs.push( ip ); // IDs are 
		}
		else
			hasAllEmptyEvents = false;
	}
	if (hasAllEmptyEvents)
	{
		// no events have concepts. We only need empty SIMPLE query starting state. return an error here for handling.
		returnError.errorName       = "All Invalid Events";
		returnError.errorMessage    = "All Events are empty. Proceed to initialize SIMPLE mode to starting state";
		return returnError;
	}
	if ( hasEmptyEvent && !hasAllEmptyEvents)
	{
		returnError.errorName       = "Empty Event(s)";
		returnError.errorMessage    = "One or more Events do not contain any Concepts. Please make sure every Event has at least one concept before switching to SIMPLE mode.";
		returnError.emptyEventIDs   = emptyEventIDs;
		return returnError; 
	}

	// check to see if there are events not included as part of the temporal relationships. They are deleted automatically when switching to SIMPLE mode
	var numEvents = jQuery("#temporalbuilders .relationshipAmongEvents").length;
	var relatedEventNames = {};
	for ( var i = 0; i < numEvents; i++ )
	{
		var ev1Name = jQuery("#temporalbuilders .relationshipAmongEvents #instancevent1\\[" + i + "\\]").val();
		if (!isNaN(parseInt(ev1Name))) ev1Name = "Event " + ev1Name;
		var ev2Name = jQuery("#temporalbuilders .relationshipAmongEvents #instancevent2\\[" + i + "\\]").val();
		if (!isNaN(parseInt(ev2Name))) ev2Name = "Event " + ev2Name;
		relatedEventNames[ev1Name] = true;
		relatedEventNames[ev2Name] = true;
	}
	var unrelatedEventNames = [];
	for ( var i = 1; i < i2b2.CRC.model.queryCurrent.panels.length; i++)
	{
		var eventName = "Event " + i;
		if ( !(eventName in relatedEventNames) ) // event name not in the relatedEventName dictionary
			unrelatedEventNames.push(eventName);
	}
	if ( unrelatedEventNames.length > 0)
	{
		returnError.errorName       = "Event(s) not in Temporal Relatioships";
		returnError.errorMessage    = "One or more Events are not used in any temporal relationships. Please make sure every Event is in a temporal relationship before switching to SIMPLE mode.";
		returnError.unrelatedEventNames   = unrelatedEventNames;
		return returnError; 
	}

	return returnError;
};


i2b2.CRC.view.QT.doToggleTemporalQueryMode = function()
{
	// toggle mode
	i2b2.CRC.view.QT.isShowingClassicTemporalQueryUI = !i2b2.CRC.view.QT.isShowingClassicTemporalQueryUI;

	// save query reulsts

	var qText   = $('infoQueryStatusText').innerHTML;
	var qChart  = $('infoQueryStatusChart').innerHTML;
	var qReport = $('infoQueryStatusReport').innerHTML;

	// enable panel timings
	var length = i2b2.CRC.ctrlr.QT.panelControllers.length;
	for (var i = 0; i < length; i++)
		i2b2.CRC.ctrlr.QT.panelControllers[i].refTiming.set('disabled', false);

	// apply UI change
	if ( i2b2.CRC.view.QT.isShowingClassicTemporalQueryUI ) // to show classic UI
	{
		// hide new temporal sequence UI
		jQuery("#outerTemporalSequenceUI").hide();
		jQuery("#populationLabel").hide();
		// remove current classic data model, display classic UI, and load simple model to classic UI
		i2b2.CRC.ctrlr.QT.doClearTemporalComponent(); // clear temporal component of the classic query
		// show classic UI
		jQuery("#queryBalloonBox").show(); // show baloons
		$('defineTemporalBar').show();

		jQuery("#crc\\.innerQueryPanel").css('height', 'auto');   // set "crc.innerQueryPanel" height to be auto
		if (!i2b2.CRC.view.QT.isTemporalQueryUIInResetState) // only perform copy if there are temporal Events to copy from.
		{
			i2b2.CRC.ctrlr.QT.copySimpleQueryToClassic(); // perform the copying
			i2b2.CRC.ctrlr.QT.temporalGroup = 0;          // reset current temporalGroup to the population
			i2b2.CRC.ctrlr.QT._redrawAllPanels();         // redraw all panels to show population's content
			i2b2.CRC.ctrlr.QT._redrawPanelCount();        // update panel count
		}

		jQuery("#temporalUIToggleDiv").show( 160, function()
				{
			jQuery("#toggleTemporalQueryModeSpan").html("Switch to Simple Temporal Query");
			i2b2.CRC.ctrlr.QT.queryTiming = "TEMPORAL";       // set queryTiming to TEMPORAL
			i2b2.CRC.view.QT.ResizeHeight();
				});
	}
	else // to show new UI
	{
		// validate ADVANCED query before switching
		var validationResult = i2b2.CRC.view.QT.validateADVQueryBeforeSwitching();
		if (validationResult.errorName) // an error is returned
		{
			if (validationResult.errorName == "All Invalid Events") // no Events have content. Only need to re-initialize SIMPLE
			{
				i2b2.CRC.view.QT.deleteAllEvents();
				i2b2.CRC.view.QT.resetTemporalQueryUI();
				i2b2.CRC.view.QT.showNewTemporalUI();
				i2b2.CRC.ctrlr.QT.temporalGroup = 0;												   // reset current temporalGroup to the population so the subsequent redraw would clear population
				i2b2.CRC.ctrlr.QT._redrawAllPanels();         										   // redraw all panels to refresh population's content
				jQuery("#temporalUIToggleDiv").show( 160, function()
						{
					jQuery("#toggleTemporalQueryModeSpan").html("Switch to Advanced Temporal Query");
						});
			}
			else // all other validation errors are handled here
			{
				i2b2.CRC.view.QT.handleSwitchErrors( validationResult );
				i2b2.CRC.view.QT.isShowingClassicTemporalQueryUI = !i2b2.CRC.view.QT.isShowingClassicTemporalQueryUI; // flip state back
				jQuery("#temporalUIToggleDiv").show();
			}
			return;
		}

		// Build an XML representation of the partial query. Test for its compatibility with SIMPLE mode. Reject if not compatible.
		var queryPackage = i2b2.CRC.ctrlr.QT._getOtherQueryXML("TestQueryName"); // build query xml from advanced UI

		var xml    = jQuery.parseXML( queryPackage.queryXML );

		var qd = i2b2.h.XPath(xml, 'descendant::query_name/..');
		var sqc = i2b2.h.XPath(xml, 'descendant::subquery_constraint');

		if (i2b2.CRC.ctrlr.QT.eventContainsNumberConstraint(qd))
		{
			i2b2.CRC.view.QT.doHandleSimpleQueryValidationError("At least one of its Events contain a <b>Number Constraint (Occurs>1x)</b>.");
			return;
		}
		else if (i2b2.CRC.ctrlr.QT.eventContainsNonConceptItems(qd))
		{
			i2b2.CRC.view.QT.doHandleSimpleQueryValidationError("At least one of the Events contain <b>non-Concept items</b>.");
			return;
		}
		else if (i2b2.CRC.ctrlr.QT.eventContainsNonModifierItemsInNonFirstPanels(qd))
		{
			i2b2.CRC.view.QT.doHandleSimpleQueryValidationError("At least one of the Events contain a <b>non-Modifier item in non-first panels</b>.");
			return;
		}
		else if (i2b2.CRC.ctrlr.QT.eventContainsNonSameInstanceTimingInNonFirstPanels(qd))
		{
			i2b2.CRC.view.QT.doHandleSimpleQueryValidationError("At least one of the Events uses <b>timing that is not Same Observation</b>.");
			return; 
		}
		else if (!i2b2.CRC.ctrlr.QT.queryContainsValidSequence(xml))
		{
			i2b2.CRC.view.QT.doHandleSimpleQueryValidationError("The Order of Events contains <b>multiple starting Events, cycles, merging, or bifurcating patterns</b>.");
			return;
		}

		// Note: eventGraph is now available (byproduct of calling QT.queryContainsValidSequence) for the following functions
		// 1. build sequence structure: see loadPreviousQueryIntoNewTQ
		// 2. fill event contents (concepts, value constraints, modifier constraints, date constraints, etc.)
		// 3. fill relationship details
		i2b2.CRC.view.QT.showNewTemporalUI();
		i2b2.CRC.view.QT.loadPreviousQueryIntoNewTQ( qd, i2b2.CRC.ctrlr.QT.eventGraph, true ); // use query definition as if it's a previous query
		i2b2.CRC.ctrlr.QT.temporalGroup = 0;												   // reset current temporalGroup to the population so the subsequent redraw would clear population
		i2b2.CRC.ctrlr.QT._redrawAllPanels();         										   // redraw all panels to refresh population's content
		i2b2.CRC.view.QT.isTemporalQueryUIInResetState = false; // mark UI state as no longer in reset because we just loaded a previousquery definition

		i2b2.CRC.ctrlr.QT.queryTiming = "TEMPORAL";         // set queryTiming to TEMPORAL

		jQuery("#temporalUIToggleDiv").show( 160, function()
				{
			jQuery("#toggleTemporalQueryModeSpan").html("Switch to Advanced Temporal Query");
				});
	}

	// load query results
	$('infoQueryStatusText').innerHTML      = qText;
	$('infoQueryStatusChart').innerHTML     = qChart;
	$('infoQueryStatusReport').innerHTML    = qReport;
};

i2b2.CRC.view.QT.showNewTemporalUI = function()
{    
	$('defineTemporalBar').hide();      // hide classic UI bar
	$('crc.temoralBuilder').hide();		// hide
	$('crc.innerQueryPanel').show();
	//jQuery("#crc\\.temoralBuilder").hide(); // hide temporal relationship builders
	if (i2b2.CRC.view.QT.isShowingPopulationQueryUI)
		jQuery("#queryBalloonBox").show(); // show baloons
	else
		jQuery("#queryBalloonBox").hide(); // hide baloons
	// ========== tdw9 1707c: initialize new temporal UI ============
	if (!i2b2.CRC.view.QT.isTemporalQueryInit) 
	{
		i2b2.CRC.view.QT.initializeTemporalEvents();
		i2b2.CRC.view.QT.isTemporalQueryInit = true;
	}
	// ========== end initialize new temporal UI ============

	var h = jQuery("#crc\\.innerQueryPanel").height();
	var dropAreaHeight = Math.max(h - 62, 0) * 1 / 3;
	jQuery(".qryPanel #QPD1").height(dropAreaHeight);
	jQuery(".qryPanel #QPD2").height(dropAreaHeight);
	jQuery(".qryPanel #QPD3").height(dropAreaHeight);
	jQuery("#crc\\.innerQueryPanel").height(h);                         // maintain old height to make room for temporal query UI
	//jQuery("#queryBalloonBox").css("top", 120 + dropAreaHeight - 45);   // set "top" for baloons
	// show temporal sequence UI
	jQuery("#outerTemporalSequenceUI").width(Math.max(0, jQuery("#crc\\.innerQueryPanel").width() - 8));
	jQuery("#outerTemporalSequenceUI").height(Math.max(0, h * 2 / 3 - 38 - 16));
	jQuery("#outerTemporalSequenceUI").show();

	jQuery("#populationLabel").show();
	i2b2.CRC.view.QT.ResizeHeight();
};

//tdw9 1707c: show/hide temporal query UI
i2b2.CRC.view.QT.toggleTemporalQueryUI = function()
{
	// toggle whether we are showing any temporal query UI
	i2b2.CRC.view.QT.isShowingTemporalQueryUI = !i2b2.CRC.view.QT.isShowingTemporalQueryUI;
	if (i2b2.CRC.view.QT.isShowingTemporalQueryUI)
	{
		jQuery("#temporalUIToggleDiv").show();
		if (i2b2.CRC.view.QT.isShowingClassicTemporalQueryUI) // show classic UI
		{
			// hide new UI
			jQuery("#outerTemporalSequenceUI").hide();
			// show classic UI
			$('defineTemporalBar').show();
			var length = i2b2.CRC.ctrlr.QT.panelControllers.length;
			for (var i = 0; i < length; i++)
				i2b2.CRC.ctrlr.QT.panelControllers[i].refTiming.set('disabled', false);
		}
		else // show new UI, initialize first if necessary
			i2b2.CRC.view.QT.showNewTemporalUI();        
	}
	else
	{
		jQuery("#temporalUIToggleDiv").hide();
		jQuery("#outerTemporalSequenceUI").hide();
		jQuery("#populationLabel").hide();
	}
	i2b2.CRC.view.QT.splitterDragged();
};

i2b2.CRC.view.QT.makeNewEventXML = function( eventName, domID )
{    
	return "<div id=\"" + domID + "\" class=\"temporalEvent\">" +
	"<div class=\"temporalEventHeader\">" +
	"<div class=\"temporalEventDeleteDiv\" style=\"float:right\"><a href=\"#\" onclick=\"i2b2.CRC.view.QT.deleteEventPressed(this); return false;\"><img src=\"js-i2b2/cells/CRC/assets/QryTool_b_clear.gif\" border=\"0\" alt=\"Remove this Observation\"></a></div>" +
	eventName +                      
	"</div>" +
	i2b2.CRC.view.QT.makeNewPanelXML( domID + "_P0" ) +
	"</div>";
};

i2b2.CRC.view.QT.makeNewActiveArrowXML = function( name1, name2, op, span1, span2 )
{    
	return "<div class=\"arrow immovable\">" +
	"<div class=\"arrowImage\">" +
	"<img src=\"js-i2b2/cells/CRC/assets/temporalQueryUIArrow.gif\" alt=\"->\">" +
	"</div>" +
	"<div class=\"arrowText\">"+
	"<a class=\"orderingText\" href=\"#\" onclick=\"i2b2.CRC.view.QT.relationshipLinkPressed(this);\">Start of first ever " + name1 + " occurs before Start of first ever " + name2 + "</a>"+
	"</div>" +
	"</div>";
};

i2b2.CRC.view.QT.makeNewInactiveActiveArrowXML = function() 
{
	return "<div class=\"arrow_inactive immovable\">" +
	"<div class=\"arrowImage\">" +
	"<img src=\"js-i2b2/cells/CRC/assets/temporalQueryUIAddEvent.gif\" alt=\"->\" />" +
	"</div>" +
	"<div class=\"inactiveArrowText\">" +
	"<a class=\"orderingText\" href=\"javascript:void(0);\">Add a new observation</a>" +
	"</div>" +
	"</div>";
};

//if not the 1st panel, isSecondary should be true
i2b2.CRC.view.QT.makeNewPanelXML = function( domID, isSecondary )
{
	var contentDivClass = "temporalPanel";
	if (isSecondary)
		contentDivClass = "temporalPanel temporalPanel_dark";

	return  "<div id=\"" + domID + "\" class=\"" + contentDivClass + "\">" +
	"<div class=\"temporalPanelConstraintsDiv\">" +
	"<div class=\"temporalPanelDatesDiv temporalPanelButton\">Dates</div>" +
	"<div class=\"temporalPanelExcludeDiv temporalPanelButton\">Exclude</div>" +
	"<div class=\"temporalPanelDeleteDiv\">" +
	"<div class=\"temporalPanelDeleteButton\" style=\"float:right\"><a href=\"#\" onclick=\"i2b2.CRC.view.QT.deletePanelPressed(this); return false;\"><img src=\"js-i2b2/cells/CRC/assets/TQryPanel_clear.gif\" border=\"0\" alt=\"Remove this Panel\" title=\"Remove this Panel\"></a></div>" +
	"</div>" +
	"</div>" +
	"<div id=\"" + domID + "_content" + "\" class=\"temporalPanelContentDiv\">" + 
	i2b2.CRC.view.QT.makeModifierDropReminder(isSecondary) + 
	"</div>" +
	i2b2.CRC.view.QT.makeAddPanelDivXML() +
	"</div>";
};

i2b2.CRC.view.QT.makeModifierDropReminder = function( isSecondary )
{
	if (!isSecondary) return "";
	return "<div class='modifierDropReminder' title='This panel only accepts Modifiers'>Drop Modifiers Here</div>";
};

i2b2.CRC.view.QT.makeAddPanelDivXML = function( )
{
	return  "<div class=\"temporalPanelAddDiv\">" +
	"<div class=\"addPanelButton\"><a href=\"#\" onclick=\"i2b2.CRC.view.QT.addPanelPressed(this); return false;\"><img src=\"js-i2b2/cells/CRC/assets/TQryPanel_add.gif\" border=\"0\" alt=\"Add a New Panel\" title=\"Add a New Panel\"></a></div>" +
	"</div>";
};

/* returns a character corresponding to num in base-26. Returned character is (A-Z)*/
i2b2.CRC.view.QT.mapNumToChar = function( num, isLeadingChar, index )
{
	if (isLeadingChar && index != 1)
		return String.fromCharCode(65 + Math.max(0,num-1));
	else
		return String.fromCharCode(65 + num);
};

/* Try to Create A, B,..., Z, AA, AB,..., ZZ, AAA, ... but we get 675=YZ, 676=AAA and 17575=YZZ, 17576=AAAA, prob should fix it up, though it's hard to see users use more than 100 events */
i2b2.CRC.view.QT.makeNewEventName = function( num )
{
	if ( num == 0 )
		return "Observation " + i2b2.CRC.view.QT.mapNumToChar(num, false, 1);
	var i = 0;
	var name = "";
	do
	{
		i++;
		var k = num % Math.pow(26, i);
		k = Math.floor(k / Math.pow(26, i - 1));
		var c = i2b2.CRC.view.QT.mapNumToChar(k, (Math.floor(num / Math.pow(26, i)) == 0), i);
		name = c + name;
	}while (Math.floor(num / Math.pow(26,i)) != 0)
		return "Observation " + name;
};

i2b2.CRC.view.QT.addEventClickHandler = function()
{
	var thisArrow = jQuery(this);
	var immovables = jQuery( ".immovable", thisArrow.parent());
	var index = i2b2.CRC.view.QT.temporalRelationships.length; // the one beyond the last relationship is the index of the currently clicked inactive arrow

	var eventCounter = (++i2b2.CRC.view.QT.temporalEventCounter);
	var eventName = i2b2.CRC.view.QT.makeNewEventName(eventCounter);
	var domID = i2b2.CRC.view.QT.TQryEvent.temporalEventDOMIDPrefix + eventCounter;
	thisArrow.parent().append(i2b2.CRC.view.QT.makeNewEventXML(eventName, domID));              // append new Event XML
	var newEventObj = new TQueryEventController(null, eventName, domID);                        // create new Event obj
	jQuery("#" + domID).data(i2b2.CRC.view.QT.TQryEvent.eventKey, newEventObj);                 // attach new Event obj to event XML

	var events = jQuery(".temporalEvent");
	var arrowParent = thisArrow.parent();
	if (events.length == 1) // if only one event, delete (the preceding) thisArrow
		thisArrow.remove(); 
	else
	{
		var temporalRelationship = new TQueryRelationship(i2b2.CRC.view.QT.temporalRelationships.length, jQuery(events[index]).data(i2b2.CRC.view.QT.TQryEvent.eventKey).name, jQuery(events[index + 1]).data(i2b2.CRC.view.QT.TQryEvent.eventKey).name);
		i2b2.CRC.view.QT.temporalRelationships.push( temporalRelationship ); // append new relationship object    
		thisArrow.off("click");                                                                     // remove click handler
		jQuery("img", thisArrow).attr("src", "js-i2b2/cells/CRC/assets/temporalQueryUIArrow.gif");  // change image
		thisArrow.append(jQuery("<div class=\"arrowText\">" +
				"<a class=\"orderingText\" href=\"#\" onclick=\"i2b2.CRC.view.QT.relationshipLinkPressed(this);\">Start of first ever " + 
				temporalRelationship.eventID1 +
				" occurs before start of first ever " + 
				temporalRelationship.eventID2 + "</a>" +
		"</div>"));                                              // add link text
		thisArrow.removeClass("arrow_inactive").addClass("arrow");                       // change class
		jQuery(".inactiveArrowText").remove();                                           // remove inactive Arrow Text
	}
	var newInactiveArrow = jQuery(i2b2.CRC.view.QT.makeNewInactiveActiveArrowXML()); // make new inactive arrow
	arrowParent.append(newInactiveArrow);                                     // append new inactive arrow
	newInactiveArrow.on("click", i2b2.CRC.view.QT.addEventClickHandler);      // attach listener to new inactive arrow
	i2b2.CRC.view.QT.resizeInnerTemporalSequenceUI();                         // resize innerTemporalSequenceUI
	newEventObj.redraw();
	i2b2.CRC.view.QT.ResizeHeight();                                          // resize height
};

i2b2.CRC.view.QT.updateAllRelationshipText = function()
{
	var events = jQuery(".temporalEvent");
	var links = jQuery(".arrowText > a");
	// update event names for each relationship
	for ( var i = 0; i < i2b2.CRC.view.QT.temporalRelationships.length; i++ )
	{
		i2b2.CRC.view.QT.temporalRelationships[i].eventID1 = jQuery(events[i]).data(i2b2.CRC.view.QT.TQryEvent.eventKey).name;
		i2b2.CRC.view.QT.temporalRelationships[i].eventID2 = jQuery(events[i+1]).data(i2b2.CRC.view.QT.TQryEvent.eventKey).name;
		links[i].text = i2b2.CRC.view.QT.temporalRelationships[i].makeDisplayText();
	}
};

//clears the UI and data of existing query in SIMPLE query UI in preparation for loading a previous query
i2b2.CRC.view.QT.clearNewTemporalQuery = function()
{
	i2b2.CRC.view.QT.temporalEventCounter = 0;
	i2b2.CRC.view.QT.temporalRelationships = [];
	var events = jQuery(".temporalEvent");      // get all events
	var relationships = jQuery(".immovable");   // get all immovables
	// remove events
	for (var i = events.length-1; i>=0 ; i--)    
	{
		var event = jQuery(events[i]);
		var eventData = event.data("event");
		for ( var j = 0; j < eventData.panels.length; j++ )
		{
			var panel = eventData.panels[j];
			panel.detachDropHandlers();
			panel.detachContextMenuTriggers();
			panel.items = []; // empty items 
		}
		events[i].remove();
	} // clear relationships
	for ( var i = relationships.length-1; i>=0; i-- )
		relationships[i].remove();               // remove DOM
	i2b2.CRC.view.QT.temporalRelationships = []; // remove objects              
};


//if dateString is undefined, then false is returned, otherwise a date model is returned
i2b2.CRC.view.QT.parseDateString =  function( dateString )
{
	var dateModel = false;
	if (dateString) // string exists, parse it
	{
		dateModel       = {};
		dateModel.Year  = dateString.substring(0, 4);    //t[0];
		dateModel.Month = dateString.substring(5, 7);    //t[1];
		dateModel.Day   = dateString.substring(8, 10);   //t[2];
	}
	return dateModel;
}; 

//tdw9: build the model and UI for panels of the given newEventOBj, panels in XML prepresentation, 
//index is the nth temporal event object in the sequence (staring with 0), and whether we have concept's original XML info
//hasOriginalXML if we are switching from ADV to SIM. IF we are loading a previous query, then we do not, and will fetch the data from server.
//tdw9: fixing JIRA BIOB 64
i2b2.CRC.view.QT.reconstitutePanels = function( newEventObj, eventID, panels, index, hasOriginalXML ) 
{
	for (var i = 0; i < panels.length; i++) 
	{
		// obtain panel object. Create new panel if necessary
		if (!newEventObj.panels[i])
		{   // create XML for the new panel, attach it to the newly created panel object.
			var newPanelName = newEventObj.domID + "_P" + newEventObj.panelCounter;
			var isSecondary = (i!=0);
			var panelXML = i2b2.CRC.view.QT.makeNewPanelXML( newPanelName, isSecondary );
			jQuery("#"+newEventObj.domID).append(jQuery(panelXML));
			newEventObj.addNewPanel( newPanelName, isSecondary );
		}
		var panelObj = newEventObj.panels[i];

		// get "exclude"
		panelObj.exclude     = (i2b2.h.getXNodeVal(panels[i], "invert") == "1");
		// check, parse, and set "panel dates" for panelObj
		panelObj.dateFrom   = i2b2.CRC.view.QT.parseDateString(i2b2.h.getXNodeVal(panels[i], 'panel_date_from') );
		panelObj.dateTo     = i2b2.CRC.view.QT.parseDateString(i2b2.h.getXNodeVal(panels[i], 'panel_date_to') );

		// keep track to see if dates in items are the same, if they all are, then we can set it as the panel date        
		var allDateFromsAreSame = true;
		var allDateTosAreSame = true;
		var allDateFroms = {};
		var allDateTos = {};

		var items = i2b2.h.XPath(panels[i], "item");
		for (var j = 0; j < items.length; j++) 
		{
			// item date processing
			var itm = {};
			if(panelObj.dateFrom == false)
				itm.dateFrom = i2b2.CRC.view.QT.parseDateString(i2b2.h.getXNodeVal(items[j],'constrain_by_date/date_from'));
			else 
				itm.dateFrom = panelObj.dateFrom;
			if(panelObj.dateTo == false)
				itm.dateTo = i2b2.CRC.view.QT.parseDateString(i2b2.h.getXNodeVal(items[j],'constrain_by_date/date_to'));
			else  
				itm.dateTo = panelObj.dateTo;

			if ((items.length == 1) && (j == 0))
			{
				if(typeof i2b2.h.getXNodeVal(items[j],'constrain_by_date/date_from' === "undefined"))
					allDateFromsAreSame = false;
				if(typeof i2b2.h.getXNodeVal(items[j],'constrain_by_date/date_to' === "undefined"))
					allDateTosAreSame = false;
			}

			// Set panel date by looking at item dates
			if ((items.length > 1) && (j < items.length - 1) && allDateFromsAreSame && allDateTosAreSame)
			{
				if(i2b2.h.getXNodeVal(items[j],'constrain_by_date/date_from') != i2b2.h.getXNodeVal(items[j + 1],'constrain_by_date/date_from'))
					allDateFromsAreSame = false;
				else 
					allDateFroms = itm.dateFrom;
				if(i2b2.h.getXNodeVal(items[j],'constrain_by_date/date_to') != i2b2.h.getXNodeVal(items[j + 1],'constrain_by_date/date_to'))
					allDateTosAreSame = false;
				else 
					allDateTos = itm.dateTo;
			}

			var o = {};
			o.level = i2b2.h.getXNodeVal(items[j], 'hlevel');
			o.name = i2b2.h.getXNodeVal(items[j], 'item_name');
			if (o.name.slice(0, 2) == '\\\\')  // If string starts with path \\, lookup path in Ontology cell
			{
				var results = i2b2.ONT.ajax.GetTermInfo("ONT", { ont_max_records: 'max="1"', ont_synonym_records: 'false', ont_hidden_records: 'false', concept_key_value: o.name }).parse();
				if (results.model.length > 0) 
				{
					o.name = results.model[0].origData.name;
					o.tooltip = results.model[0].origData.tooltip;
				}
			}
			o.tooltip = i2b2.h.getXNodeVal(items[j], 'tooltip');
			o.key = i2b2.h.getXNodeVal(items[j], 'item_key');
			o.synonym_cd = i2b2.h.getXNodeVal(items[j], 'item_is_synonym');
			if (o.synonym_cd == "false") // tdw9 bug fix for non-synonym terms showing blue text: HTML rendering checks to see if synonym is "N," not "false"
				o.synonym_cd = "N";
			o.hasChildren = i2b2.h.getXNodeVal(items[j], 'item_icon');

			// Lab Values processing
			var lvd = i2b2.h.XPath(items[j], 'descendant::constrain_by_value');
			if ((lvd.length > 0) && (i2b2.h.XPath(items[j], 'descendant::constrain_by_modifier').length == 0)) 
				o.LabValues = i2b2.CRC.ctrlr.QT.parseValueConstraint(lvd);

			// sdx encapsulate
			var sdxDataNode = i2b2.sdx.Master.EncapsulateData('CONCPT', o);

			// check to see if items from ADV has required xmlOrig. If so, fill in sdxDataNode.origData.xmlOrig. Otherwise we get from ONT service.
			// i2b2.CRC.model.queryCurrent.panels[index+1][i].items[j] is undefined when prev query is dropped.

			// tdw9: fixing JIRA BIOB 64
			var eventIndex = ""; // prase the eventID, "Event 3" to determine which Event's xmlOrig to save
			if (isNaN(eventID))
				eventIndex = parseInt(eventID.substring(5));
			else
				eventIndex = parseInt(eventID);
			if (hasOriginalXML && i2b2.CRC.model.queryCurrent.panels[eventIndex][i].items[j].origData.xmlOrig != undefined) // we are switching from ADV, fetch the data from there if it exists.
			{   
				var ADVItem = i2b2.CRC.model.queryCurrent.panels[eventIndex][i].items[j];
				sdxDataNode.origData.xmlOrig = ADVItem.origData.xmlOrig;
				sdxDataNode.origData.total_num = ADVItem.origData.total_num;
			}
			else // we are loading a previous query, no existing ginformation, we get it from ONT service
			{
				// interrogate ONT to populate sdxDataNode.origData.xmlOrig because we need it if we later toggle into the classic temporal mode
				var cdetails = i2b2.ONT.ajax.GetTermInfo("CRC:QueryTool", {concept_key_value:sdxDataNode.origData.key, ont_synonym_records: true, ont_hidden_records: true} );
				try { new ActiveXObject ("MSXML2.DOMDocument.6.0"); isActiveXSupported =  true; } catch (e) { isActiveXSupported =  false; }	
				if (isActiveXSupported) 
				{
					//Internet Explorer
					xmlDocRet = new ActiveXObject("Microsoft.XMLDOM");
					xmlDocRet.async = "false";
					xmlDocRet.loadXML(cdetails.msgResponse);
					xmlDocRet.setProperty("SelectionLanguage", "XPath");
					var c = i2b2.h.XPath(xmlDocRet, 'descendant::concept');						
				} 
				else 
					var c = i2b2.h.XPath(cdetails.refXML, 'descendant::concept');
				if (c.length > 0) 
					sdxDataNode.origData.xmlOrig = c[0];					
			}

			if (o.LabValues) 
				sdxDataNode.LabValues = o.LabValues;

			// set dates to sdxDataNode
			if (itm.dateFrom)
				sdxDataNode.dateFrom = itm.dateFrom;
			if (itm.dateTo)
				sdxDataNode.dateTo = itm.dateTo;

			if (i2b2.h.XPath(items[j], 'descendant::constrain_by_modifier').length > 0) 
			{
				sdxDataNode.origData.parent = {};
				sdxDataNode.origData.parent.key = o.key;
				sdxDataNode.origData.parent.hasChildren = o.hasChildren;
				sdxDataNode.origData.parent.level = o.level;
				sdxDataNode.origData.parent.name = o.name;
				sdxDataNode.origData.key = i2b2.h.getXNodeVal(items[j], 'constrain_by_modifier/modifier_key');
				sdxDataNode.origData.applied_path = i2b2.h.getXNodeVal(items[j], 'constrain_by_modifier/applied_path');
				sdxDataNode.origData.name = i2b2.h.getXNodeVal(items[j], 'constrain_by_modifier/modifier_name');
				sdxDataNode.origData.isModifier = true;
				this.hasModifier = true;

				// Mod Values processing
				var lvd = i2b2.h.XPath(items[j], 'descendant::constrain_by_modifier/constrain_by_value');
				if (lvd.length > 0) 
					o.ModValues = i2b2.CRC.ctrlr.QT.parseValueConstraint( lvd );
				if (o.ModValues) 
					sdxDataNode.ModValues = o.ModValues;
			}
			// create item visuals and redraw panel
			panelObj.performAddConcept(sdxDataNode, panelObj.yuiTree.root, false);
		}
		//Set panel date by looking at item dates if they are all the same
		if (allDateFromsAreSame && allDateTosAreSame) 
		{
			if (typeof allDateTos !== "undefined")
				panelObj.dateTo = allDateTos;
			if (typeof allDateFroms !== "undefined")
				panelObj.dateFrom = allDateFroms;
		}

		// redraw panel content and buttons
		panelObj.redrawTree();
		panelObj.redrawItemExclusion();
		panelObj.redrawItemDates();
		panelObj.redrawDateButton();
		panelObj.redrawExcludeButton();
	}
};

//tdw9: perform loading previous query. qd is the query definition of the previous query.
//isFromModeSwitch: TRUE: user is switching temporal query mode. FALSE: code is invoked from loading a previous SIMPLE temporal query
i2b2.CRC.view.QT.loadPreviousQueryIntoNewTQ = function( qd, eventGraph, isFromModeSwitch, dObj, qm_id )
{
	jQuery("#temporalSequenceHeaderMessage").hide();    // hide instructional messages
	jQuery("#tutorialBox").hide();
	jQuery("#tqDropBox").hide();
	jQuery("#tutorLaunchDiv").hide();
	jQuery("#innerTemporalSequenceUI").show();          // make sure events are showing
	i2b2.CRC.view.QT.clearNewTemporalQuery();           // clear temporal query UI and data
	i2b2.CRC.view.QT.detachDropListenerToOuterTemporalSequenceUI(); // detach the outer drop listener

	var subQueries = {};
	for ( var i = 1; i < qd.length; i++ ) // qd[0] is population
	{
		var subQueryName = i2b2.h.getXNodeVal(i2b2.h.XPath(qd[i], 'query_id')[0], 'query_id');
		if (subQueryName)
			subQueries[subQueryName] = qd[i];
	}

	var nodeIDToEventMap = {};
	var node = eventGraph.startingNode;
	var index = 0;
	jQuery("#temporalSequence_0").hide(160, function(){});

	if ( isFromModeSwitch )
	{
		i2b2.CRC.view.QT.loadAllEvents(subQueries, nodeIDToEventMap, node, eventGraph, index, isFromModeSwitch, qd );
	}
	else
	{
		jQuery("#QTDialogProgressBar").progressbar("option", "max", qd.length);
		// initiate loading of Events in an interleaving manner
		if (node && node.hasEdgeOut())
		{
			setTimeout( function()
					{
				i2b2.CRC.view.QT.interleaveSingleEventLoading( subQueries, nodeIDToEventMap, node, eventGraph, index, isFromModeSwitch, qd, dObj, qm_id );
					}, 50 );
		}
	}
};

i2b2.CRC.view.QT.loadAllEvents = function( subQueries, nodeIDToEventMap, node, eventGraph, index, isFromModeSwitch, qd )
{
	while ( node && node.hasEdgeOut() )
	{
		var id = node.ID;
		var eventCounter = (i2b2.CRC.view.QT.temporalEventCounter++);
		var eventName = i2b2.CRC.view.QT.makeNewEventName(eventCounter);
		nodeIDToEventMap[id] = eventName;
		var domID = i2b2.CRC.view.QT.TQryEvent.temporalEventDOMIDPrefix + eventCounter;
		jQuery("#temporalSequence_0").append(i2b2.CRC.view.QT.makeNewEventXML(eventName, domID));   // append new Event XML (hardcoding because we only have 1 sequence
		var newEventObj = new TQueryEventController(null, eventName, domID);                        // create new Event obj
		jQuery("#" + domID).data(i2b2.CRC.view.QT.TQryEvent.eventKey, newEventObj);                 // attach new Event obj to event XML

		// parse subquery's panels
		var panels = i2b2.h.XPath(subQueries[ node.ID ], "panel");
		i2b2.CRC.view.QT.reconstitutePanels(newEventObj, id, panels, index, isFromModeSwitch); // create items for the panel // tdw9: fixing JIRA BIOB 64
		var edgeOut = node.edgeOuts[0]; // grab edge (for now each node should have only 1 edge out)

		var nextEventName = i2b2.CRC.view.QT.makeNewEventName(eventCounter+1);
		nodeIDToEventMap[edgeOut.targtID] = nextEventName;

		var temporalRelationship = new TQueryRelationship(i2b2.CRC.view.QT.temporalRelationships.length, eventName, nextEventName);        
		temporalRelationship.operator     = edgeOut.type;
		temporalRelationship.refDate1     = edgeOut.refDate1;
		temporalRelationship.refDate2     = edgeOut.refDate2;
		temporalRelationship.aggregateOp1 = edgeOut.aggregateOp1;
		temporalRelationship.aggregateOp2 = edgeOut.aggregateOp2;
		for (var i =0; i < edgeOut.spans.length; i++ )
		{
			if (i==0) temporalRelationship.span1        = new TQueryRelationshipSpan(edgeOut.spans[i].operator, edgeOut.spans[i].value, edgeOut.spans[i].unit);
			else      temporalRelationship.span2        = new TQueryRelationshipSpan(edgeOut.spans[i].operator, edgeOut.spans[i].value, edgeOut.spans[i].unit);
		}
		i2b2.CRC.view.QT.temporalRelationships.push(temporalRelationship); // append new relationship object
		var displayText = temporalRelationship.makeDisplayText();
		jQuery("#temporalSequence_0").append(jQuery("<div class=\"arrow immovable\">" +
				"<div class=\"arrowImage\">" +
				"<img src=\"js-i2b2/cells/CRC/assets/temporalQueryUIArrow.gif\" alt=\"->\" />" +
				"</div>" +
				"<div class=\"arrowText\">" +
				"<a class=\"orderingText\" href=\"#\" onclick=\"i2b2.CRC.view.QT.relationshipLinkPressed(this);\">" +
				displayText + 
				"</a>" +
				"</div>" +
		"</div>")); // add link text
		node = eventGraph.nodes[edgeOut.targetID];
		i2b2.CRC.view.QT.resizeInnerTemporalSequenceUI();                         // resize innerTemporalSequenceUI
		newEventObj.redraw();
		index++;
		if ( !node.hasEdgeOut() ) // this is the last node of the sequence
		{
			eventCounter = (i2b2.CRC.view.QT.temporalEventCounter); // last node in the sequence, do not advance counter. tdw9: fix JIRA bug 5: https://biobankportaldev.partners.org/jira/browse/BPTEMPQUER-5last 
			domID = i2b2.CRC.view.QT.TQryEvent.temporalEventDOMIDPrefix + eventCounter;
			jQuery("#temporalSequence_0").append(i2b2.CRC.view.QT.makeNewEventXML(nextEventName, domID));   // append new Event XML (hardcoding because we only have 1 sequence
			newEventObj = new TQueryEventController(null, nextEventName, domID);                            // create new Event obj
			jQuery("#" + domID).data(i2b2.CRC.view.QT.TQryEvent.eventKey, newEventObj);                     // attach new Event obj to event XML
			var panels = i2b2.h.XPath(subQueries[edgeOut.targetID], "panel");
			id = node.ID;  // tdw9: fixing JIRA BIOB 64
			i2b2.CRC.view.QT.reconstitutePanels(newEventObj, id, panels, index, isFromModeSwitch); // create items for the panel  // tdw9: fixing JIRA BIOB 64
			var newInactiveArrow = jQuery(i2b2.CRC.view.QT.makeNewInactiveActiveArrowXML());   // make new inactive arrow
			jQuery("#temporalSequence_0").append( newInactiveArrow );
			newInactiveArrow.on("click", i2b2.CRC.view.QT.addEventClickHandler);      // attach listener to new inactive arrow
			i2b2.CRC.view.QT.resizeInnerTemporalSequenceUI();                         // resize innerTemporalSequenceUI
			newEventObj.redraw();
		}
	}

	jQuery("#temporalSequence_0").show(function(){});
	i2b2.CRC.view.QT.ResizeHeight(); // resize height of Events
};

i2b2.CRC.view.QT.interleaveSingleEventLoading = function( subQueries, nodeIDToEventMap, node, eventGraph, index, isFromModeSwitch, qd, dObj, qm_id )
{
	var id = node.ID;
	var eventCounter = (i2b2.CRC.view.QT.temporalEventCounter++);
	var eventName = i2b2.CRC.view.QT.makeNewEventName(eventCounter);
	nodeIDToEventMap[id] = eventName;
	var domID = i2b2.CRC.view.QT.TQryEvent.temporalEventDOMIDPrefix + eventCounter;
	jQuery("#temporalSequence_0").append(i2b2.CRC.view.QT.makeNewEventXML(eventName, domID));   // append new Event XML (hardcoding because we only have 1 sequence
	var newEventObj = new TQueryEventController(null, eventName, domID);                        // create new Event obj
	jQuery("#" + domID).data(i2b2.CRC.view.QT.TQryEvent.eventKey, newEventObj);                 // attach new Event obj to event XML

	// parse subquery's panels
	var panels = i2b2.h.XPath(subQueries[ node.ID ], "panel");
	i2b2.CRC.view.QT.reconstitutePanels(newEventObj, id, panels, index, isFromModeSwitch); // create items for the panel // tdw9: fixing JIRA BIOB 64
	var edgeOut = node.edgeOuts[0]; // grab edge (for now each node should have only 1 edge out)

	var nextEventName = i2b2.CRC.view.QT.makeNewEventName(eventCounter+1);
	nodeIDToEventMap[edgeOut.targtID] = nextEventName;

	var temporalRelationship = new TQueryRelationship(i2b2.CRC.view.QT.temporalRelationships.length, eventName, nextEventName);        
	temporalRelationship.operator     = edgeOut.type;
	temporalRelationship.refDate1     = edgeOut.refDate1;
	temporalRelationship.refDate2     = edgeOut.refDate2;
	temporalRelationship.aggregateOp1 = edgeOut.aggregateOp1;
	temporalRelationship.aggregateOp2 = edgeOut.aggregateOp2;
	for (var i =0; i < edgeOut.spans.length; i++ )
	{
		if (i==0) temporalRelationship.span1        = new TQueryRelationshipSpan(edgeOut.spans[i].operator, edgeOut.spans[i].value, edgeOut.spans[i].unit);
		else      temporalRelationship.span2        = new TQueryRelationshipSpan(edgeOut.spans[i].operator, edgeOut.spans[i].value, edgeOut.spans[i].unit);
	}
	i2b2.CRC.view.QT.temporalRelationships.push(temporalRelationship); // append new relationship object
	var displayText = temporalRelationship.makeDisplayText();
	jQuery("#temporalSequence_0").append(jQuery("<div class=\"arrow immovable\">" +
			"<div class=\"arrowImage\">" +
			"<img src=\"js-i2b2/cells/CRC/assets/temporalQueryUIArrow.gif\" alt=\"->\" />" +
			"</div>" +
			"<div class=\"arrowText\">" +
			"<a class=\"orderingText\" href=\"#\" onclick=\"i2b2.CRC.view.QT.relationshipLinkPressed(this);\">" +
			displayText + 
			"</a>" +
			"</div>" +
	"</div>")); // add link text
	node = eventGraph.nodes[edgeOut.targetID];

	jQuery("#QTDialogProgressBar").progressbar("value", jQuery("#QTDialogProgressBar").progressbar("value") + 1);

	i2b2.CRC.view.QT.resizeInnerTemporalSequenceUI();                         // resize innerTemporalSequenceUI
	newEventObj.redraw();
	index++;
	if ( !node.hasEdgeOut() ) // this is the last node of the sequence
	{
		eventCounter = (i2b2.CRC.view.QT.temporalEventCounter); // last node in the sequence, do not advance counter. tdw9: fix JIRA bug 5: https://biobankportaldev.partners.org/jira/browse/BPTEMPQUER-5last 
		domID = i2b2.CRC.view.QT.TQryEvent.temporalEventDOMIDPrefix + eventCounter;
		jQuery("#temporalSequence_0").append(i2b2.CRC.view.QT.makeNewEventXML(nextEventName, domID));   // append new Event XML (hardcoding because we only have 1 sequence
		newEventObj = new TQueryEventController(null, nextEventName, domID);                            // create new Event obj
		jQuery("#" + domID).data(i2b2.CRC.view.QT.TQryEvent.eventKey, newEventObj);                     // attach new Event obj to event XML
		var panels = i2b2.h.XPath(subQueries[edgeOut.targetID], "panel");
		id = node.ID;
		i2b2.CRC.view.QT.reconstitutePanels(newEventObj, id, panels, index, isFromModeSwitch); // create items for the panel 
		var newInactiveArrow = jQuery(i2b2.CRC.view.QT.makeNewInactiveActiveArrowXML()); // make new inactive arrow
		jQuery("#temporalSequence_0").append( newInactiveArrow );
		newInactiveArrow.on("click", i2b2.CRC.view.QT.addEventClickHandler);      // attach listener to new inactive arrow

		jQuery("#QTDialogProgressBar").progressbar("value", jQuery("#QTDialogProgressBar").progressbar("value") + 1);

		i2b2.CRC.view.QT.resizeInnerTemporalSequenceUI();                         // resize innerTemporalSequenceUI
		newEventObj.redraw();

		jQuery("#temporalSequence_0").show(function(){});
		i2b2.CRC.view.QT.ResizeHeight(); // resize height of Events

		// load population and close progressbar dialog
		i2b2.CRC.ctrlr.QT.doLoadPopulationQuery( qd, dObj, qm_id );
		jQuery("#QTDialogProgressBar").progressbar("value", jQuery("#QTDialogProgressBar").progressbar("option", "max"));
		//jQuery("#QTDialogProgressBar").progressbar("value", jQuery("#QTDialogProgressBar").progressbar("value") + 1);

		setTimeout( function()
				{
			jQuery("#QTDialog").dialog("close");    //tdw9 1707c: remove dialog and mask for query loading
				}, 250);
	}

	if (node && node.hasEdgeOut())
	{
		setTimeout( function()
				{
			i2b2.CRC.view.QT.interleaveSingleEventLoading( subQueries, nodeIDToEventMap, node, eventGraph, index, isFromModeSwitch, qd, dObj, qm_id );
				}, 50 );
	}
};

i2b2.CRC.view.QT.deleteAllEvents = function()
{
	var events = jQuery(".temporalEvent");      // get all events
	var relationships = jQuery(".immovable");   // get all immovables
	for (var i = events.length-1; i>=0 ; i--)
	{
		var event = jQuery(events[i]);
		if (event.data("event") !== undefined)
		{
			var panels = event.data("event").panels;
			for (var j = 0; j < panels.length; j++) // remove listeners to panels of the to-be deleted event
			{
				panels[j].detachDropHandlers();
				panels[j].detachContextMenuTriggers();
			}
		}
		events[i].remove();
	}
	relationships.remove();
	i2b2.CRC.view.QT.temporalRelationships = [];
	i2b2.CRC.view.QT.resetQueryResults(); // reset query results
};


//deletes empty events and updates relationships. This is done prior to query submission
i2b2.CRC.view.QT.deleteEmptyEvents = function()
{
	var events = jQuery(".temporalEvent");      // get all events
	var relationships = jQuery(".immovable");   // get all immovables
	for (var i = events.length-1; i>=0 ; i--)   // find events that are empty, doing it backwards
	{
		var event = jQuery(events[i]);
		if ( event.data("event").isEmpty() ) 
		{
			var panels = event.data("event").panels;
			for (var j = 0; j < panels.length; j++) // remove listeners to panels of the to-be deleted event
			{
				panels[j].detachDropHandlers();
				panels[j].detachContextMenuTriggers();
			}
			var curLength = jQuery(".temporalEvent").length; // grab the current length
			jQuery(events[i]).remove();            
			if (i != curLength - 1) 
			{
				jQuery(relationships[i]).remove();                              // remove DOM
				i2b2.CRC.view.QT.temporalRelationships.splice(i, 1);    // remove object
			}
			else // this is the last event of the sequence
			{
				jQuery(relationships[Math.max(i - 1, 0)]).remove();                                // remove DOM, ensure removing the i=0th entry performs correctly
				i2b2.CRC.view.QT.temporalRelationships.splice(Math.max(i - 1, 0), 1);   // remove object
			}
		}
	}
	i2b2.CRC.view.QT.updateAllRelationshipText();// update Relationship text display
	i2b2.CRC.view.QT.resetQueryResults(); // reset query results
};

//el is the link that's clicked
i2b2.CRC.view.QT.deleteEventPressed = function(el)
{
	if ( i2b2.CRC.view.QT.isTutorial )
	{
		i2b2.CRC.view.QT.showDialog("Cannot Delete Event", "Event deletion is disabled while in tutorial mode.", "Please <b>turn off</b> tutorial first.");
		return;
	}
	var temporalSequence = jQuery(el).parent().parent().parent().parent()[0];
	var event = jQuery(el).parent().parent().parent()[0];
	//var events = jQuery(".temporalEvent");      // get all events
	i2b2.CRC.view.QT.deleteEvent( event );       // call helper function
	i2b2.CRC.view.QT.resizeInnerTemporalSequenceUI();
};

//event is a jQuery object of the event
i2b2.CRC.view.QT.deleteEvent = function( event )
{
	var events = jQuery(".temporalEvent");      // get all events
	var relationships = jQuery(".immovable");   // get all immovables
	for ( var i = 0; i < events.length; i++ )   // find the matching event and removes it and its following arrow
	{
		if ( events[i] == event )
		{
			var panels = jQuery(event).data("event").panels;
			for (var j = 0; j < panels.length; j++ ) // remove listeners to panels of the to-be deleted event
			{
				panels[j].detachDropHandlers();
				panels[j].detachContextMenuTriggers();
			}
			event.remove();
			if (i != events.length-1)
			{
				relationships[i].remove();                              // remove DOM
				i2b2.CRC.view.QT.temporalRelationships.splice(i, 1);    // remove object
			}
			else // this is the last event of the sequence
			{
				relationships[Math.max(i-1,0)].remove();                                // remove DOM, ensure removing the i=0th entry performs correctly
				i2b2.CRC.view.QT.temporalRelationships.splice(Math.max(i - 1, 0), 1);   // remove object
			}
			break;
		}
	} 
	i2b2.CRC.view.QT.updateAllRelationshipText();   // update Relationship text display
	if ( jQuery(".temporalEvent").length == 0 )     // if all events are deleted, we reset everything
		i2b2.CRC.view.QT.resetTemporalQueryUI();
	i2b2.CRC.view.QT.resetQueryResults(); // reset query results
};

i2b2.CRC.view.QT.resetTemporalQueryUI = function()
{
	i2b2.CRC.view.QT.resetTemporalQueryData();          // reset relevant data
	var innerTemporalSequenceUI = jQuery("#innerTemporalSequenceUI");
	innerTemporalSequenceUI.empty();                    // remove everything in innerTemporalSequenceUI
	innerTemporalSequenceUI.hide();                     // hide it
	jQuery("#temporalSequenceHeaderMessage").show();    // show instructional message and drop box 
	jQuery("#tqDropBox").show();
	jQuery('#startDropBox').show();
	i2b2.CRC.view.QT.attachDropListenerToOuterTemporalSequenceUI(); // attach drop listener to OuterTemporalQueryUI

	// Aattach HTML for initial state
	innerTemporalSequenceUI.append(
			jQuery('<div id="temporalSequence_0" class="temporalSequence">' +
					'<div id="temporalEvent_0" class="temporalEvent">' +
					'<div class="temporalEventHeader">' +
					'<div class="temporalEventDeleteDiv" style="float:right"><a href="#" onclick="i2b2.CRC.view.QT.deleteEventPressed(this); return false;"><img src="js-i2b2/cells/CRC/assets/QryTool_b_clear.gif" border="0" alt="Remove this Observation" title="Remove this Panel"></a></div>' +
					'Observation A' +                        
					'</div>' +
					'<div id="temporalEvent_0_P0" class="temporalPanel">' +
					'<div class="temporalPanelConstraintsDiv">' +
					'<div class="temporalPanelDatesDiv temporalPanelButton">Dates</div>' +
					'<div class="temporalPanelExcludeDiv temporalPanelButton">Exclude</div>' +
					'<div class="temporalPanelDeleteDiv">' +
					'<div class="temporalPanelDeleteButton"><a href="#" onclick="i2b2.CRC.view.QT.deletePanelPressed(this); return false;"><img src="js-i2b2/cells/CRC/assets/TQryPanel_clear.gif" border="0" alt="Remove this Panel" title="Remove this Panel"></a></div>' +
					'</div>' +
					'</div>' +
					'<div id="temporalEvent_0_P0_content" class="temporalPanelContentDiv"></div>' +
					'<div class="temporalPanelAddDiv">' +
					'<div class="addPanelButton"><a href="#" onclick="i2b2.CRC.view.QT.addPanelPressed(this); return false;"><img src="js-i2b2/cells/CRC/assets/TQryPanel_add.gif" border="0" alt="Add a New Panel" title="Add a New Panel"></a></div>' +
					'</div>' +
					'</div>' +
					'</div>' +
					'<div class="arrow immovable">' +
					'<div class="arrowImage">' +
					'<img src="js-i2b2/cells/CRC/assets/temporalQueryUIArrow.gif" alt="->" />' +
					'</div>' +
					'<div class="arrowText">' +
					'<a class="orderingText" href="#" onclick="i2b2.CRC.view.QT.relationshipLinkPressed(this);">Start of first ever Observation A occurs before start of first ever Observation B</a>' +
					'</div>' +
					'</div>' +
					'<div id="temporalEvent_1" class="temporalEvent">' +
					'<div class="temporalEventHeader">' +
					'<div class="temporalEventDeleteDiv" style="float:right"><a href="#" onclick="i2b2.CRC.view.QT.deleteEventPressed(this); return false;"><img src="js-i2b2/cells/CRC/assets/QryTool_b_clear.gif" border="0" alt="Remove this Observation"></a></div>' +
					'Observation B' +                        
					'</div>' +
					'<div id="temporalEvent_1_P0" class="temporalPanel">' +
					'<div class="temporalPanelConstraintsDiv">' +
					'<div class="temporalPanelDatesDiv temporalPanelButton">Dates</div>' +
					'<div class="temporalPanelExcludeDiv temporalPanelButton">Exclude</div>' +
					'<div class="temporalPanelDeleteDiv">' +
					'<div class="temporalPanelDeleteButton"><a href="#" onclick="i2b2.CRC.view.QT.deletePanelPressed(this); return false;"><img src="js-i2b2/cells/CRC/assets/TQryPanel_clear.gif" border="0" alt="Remove this Panel" title="Remove this Panel"></a></div>' +
					'</div>' +
					'</div>' +
					'<div id="temporalEvent_1_P0_content" class="temporalPanelContentDiv"></div>' +
					'<div class="temporalPanelAddDiv">' +
					'<div class="addPanelButton"><a href="#" onclick="i2b2.CRC.view.QT.addPanelPressed(this); return false;"><img src="js-i2b2/cells/CRC/assets/TQryPanel_add.gif" border="0" alt="Add a New Panel" title="Add a New Panel"></a></div>' +
					'</div>' +
					'</div>' +
					'</div>' +
					'<div class="arrow_inactive immovable">' +
					'<div class="arrowImage">' +
					'<img src="js-i2b2/cells/CRC/assets/temporalQueryUIAddEvent.gif" alt="->" />' +
					'</div>' +
					'<div class="inactiveArrowText">' +
					'<a class="orderingText" href="javascript:void(0);">Add a new Observation</a>' +
					'</div>' +
					'</div>' +
			'</div>'));

	i2b2.CRC.view.QT.initializeTemporalEvents(); // re-initialize HTML with data model and event handlers
	i2b2.CRC.view.QT.isTemporalQueryInit           = true; // make sure we don't initialize it again
	i2b2.CRC.view.QT.isTemporalQueryUIInResetState = true; // remember that the the UI is now in reset state
};

i2b2.CRC.view.QT.resetTemporalQueryData = function()
{
	i2b2.CRC.view.QT.isTemporalQueryInit    = false;
	i2b2.CRC.view.QT.hasTemporalConstraint  = false;
	i2b2.CRC.view.QT.temporalEventCounter   = 0;    // reset counter to 0
};

i2b2.CRC.view.QT.addPanelPressed = function(element)
{
	// get the data associated with the click
	var panelObj = jQuery(element).parent().parent().parent().data("panel");
	var eventObj = panelObj.parentEvent;
	var newPanelName = eventObj.generateCurrentPanelName();
	// create XML and append to the Event DOM  
	var panelXML = i2b2.CRC.view.QT.makeNewPanelXML( newPanelName, true );
	jQuery(element).parent().parent().parent().parent().append( jQuery(panelXML) );
	// create new panelObj and attach it to its DOM
	eventObj.addNewPanel( newPanelName, true );
	i2b2.CRC.view.QT.resetQueryResults(); // reset query results
	eventObj.redraw(); // redraw Event
	i2b2.CRC.view.QT.ResizeHeight();
};

i2b2.CRC.view.QT.deletePanelPressed = function(element)
{
	if ( i2b2.CRC.view.QT.isTutorial )
	{
		i2b2.CRC.view.QT.showDialog("Cannot Delete Panel", "Panel deletion is disabled while in tutorial mode.", "Please <b>turn off</b> tutorial first.");
		return;
	}
	var panelUI  = jQuery(element).parent().parent().parent().parent();
	var panelObj = panelUI.data("panel");
	var eventObj = panelObj.parentEvent;    
	panelObj.detachDropHandlers();                      // detach handlers
	panelObj.detachContextMenuTriggers();               // remove itself from context menu triggers
	eventObj.panels.splice( panelObj.index, 1 );        // remove panelObj from event model
	panelUI.remove();                                   // remove UI
	for ( var i = 0; i < eventObj.panels.length; i++ )  // recompute indices for each panel
	{
		if ( i == 0 ) // change the 0th panel's appearance to be non-secondary
			jQuery("#"+eventObj.panels[i].domID).removeClass("temporalPanel_dark");
		eventObj.panels[i].index = i;
	}
	i2b2.CRC.view.QT.resetQueryResults(); // reset query results
	i2b2.CRC.view.QT.resizeInnerTemporalSequenceUI();
	eventObj.redraw();                                  // redraw Event
};

i2b2.CRC.view.QT.relationshipLinkPressed = function(element)
{
	var immovables = jQuery(".arrow", "#" + jQuery(element).parent().parent().parent().attr("id"));
	for (var i = 0; i < immovables.length; i++)
	{
		if (jQuery(immovables[i]).find(".orderingText")[0] == element)
		{
			i2b2.CRC.view.temporalRelationshipEditor.show(i2b2.CRC.view.QT.temporalRelationships[i]);
			break;
		}
	}
};

i2b2.CRC.view.QT.attachListenersForTemporalQueryUI = function()
{
	jQuery(".arrow_inactive").on("click", i2b2.CRC.view.QT.addEventClickHandler);
};

//bugbug: need better width calculations for multi-panel events
i2b2.CRC.view.QT.resizeInnerTemporalSequenceUI = function()
{
	var targetWidth = (jQuery(".temporalEvent").length) * 160 + 450;
	var panels = jQuery(".temporalPanel");
	for (var i = 0; i < panels.length; i++)
		targetWidth = targetWidth + parseFloat(jQuery(jQuery(".temporalPanel")[i]).css("width")) + 2;
	jQuery("#innerTemporalSequenceUI").width( targetWidth);
	jQuery("#tutorialDiv").width(targetWidth + 20);
};

i2b2.CRC.view.QT.attachDropListenerToOuterTemporalSequenceUI = function()
{
	// tdw9 1707c: initialize and allow conceps to be dropped onto outerTemporalSequenceUI
	var funcHovOverTemporalSequence = function(e, id, ddProxy) {
		jQuery("#" + id).addClass('ddCONCPTTarget');
	}
	var funcHovOutTemporalSequence = function(e, id, ddProxy) {
		jQuery("#" + id).removeClass('ddCONCPTTarget');
	}
	i2b2.sdx.Master.setHandlerCustom('outerTemporalSequenceUI', 'CONCPT', 'onHoverOver', funcHovOverTemporalSequence);
	i2b2.sdx.Master.setHandlerCustom('outerTemporalSequenceUI', 'CONCPT', 'onHoverOut', funcHovOutTemporalSequence);

	// adding drop handler
	i2b2.sdx.Master.setHandlerCustom('outerTemporalSequenceUI', 'CONCPT', 'DropHandler', (function(sdxData) {
		var sdxConceptOrig = sdxData[0]; // only interested in the 1st object
		var sdxConcept = i2b2.sdx.TypeControllers.CONCPT.MakeObject(sdxConceptOrig.origData.xmlOrig, sdxConceptOrig.origData.isModifier, null, sdxConceptOrig.origData.parent, sdxConceptOrig.sdxInfo.sdxType);
		jQuery(jQuery(".temporalEvent")[0]).data("event").panels[0].performDrop(sdxConcept); // push concept into the first Event and redraw
		i2b2.CRC.view.QT.ResizeHeight();
		i2b2.CRC.view.QT.detachDropListenerToOuterTemporalSequenceUI(); // once a concept is dropped, detach the drop listener
		jQuery("#temporalSequenceHeaderMessage").hide();
		jQuery("#tqDropBox").hide();
		jQuery("#tutorLaunchDiv").hide();
		jQuery("#startDropBox").hide();        
		jQuery("#innerTemporalSequenceUI").show();
		i2b2.CRC.view.QT.isTemporalQueryUIInResetState = false; // a concept has been dropped. The UI is no longer in reset state
		i2b2.CRC.view.QT.incrementTutorialState( 0 );
	}));
};

i2b2.CRC.view.QT.detachDropListenerToOuterTemporalSequenceUI = function() 
{
	// removing mouse over/out handler
	i2b2.sdx.Master.setHandlerCustom('outerTemporalSequenceUI', 'CONCPT', 'onHoverOver', null);
	i2b2.sdx.Master.setHandlerCustom('outerTemporalSequenceUI', 'CONCPT', 'onHoverOut', null);
	// removing drop handler (set it to no-op)
	i2b2.sdx.Master.setHandlerCustom('outerTemporalSequenceUI', 'CONCPT', 'DropHandler', function(sdxData){});
};

/* tdw9 1707c: initialize temporal panels and sortables (ref: http://jsfiddle.net/PQrqS/1/ and http://stackoverflow.com/questions/4299241/jquery-sortable-lists-and-fixed-locked-items 
 * Called after i2b2 cells are initialied. See below.
 */
i2b2.CRC.view.QT.initializeTemporalEvents = function()
{
	// initialize the starting 2 Events
	var name = i2b2.CRC.view.QT.makeNewEventName(i2b2.CRC.view.QT.temporalEventCounter);  // Event A
	var domID = i2b2.CRC.view.QT.TQryEvent.temporalEventDOMIDPrefix + i2b2.CRC.view.QT.temporalEventCounter;
	//var tp1 = new TQueryPanelController(null, name, domID);
	var te1 = new TQueryEventController(null, name, domID);
	name = i2b2.CRC.view.QT.makeNewEventName(++i2b2.CRC.view.QT.temporalEventCounter);      // Event B
	domID = i2b2.CRC.view.QT.TQryEvent.temporalEventDOMIDPrefix + i2b2.CRC.view.QT.temporalEventCounter;
	//var tp2 = new TQueryPanelController(null, name, domID);
	var te2 = new TQueryEventController(null, name, domID);
	// attach event objects onto dom
	jQuery("#" + te1.domID).data(i2b2.CRC.view.QT.TQryEvent.eventKey, te1);
	jQuery("#" + te2.domID).data(i2b2.CRC.view.QT.TQryEvent.eventKey, te2);
	// initialize the starting temporal relationship
	i2b2.CRC.view.QT.temporalRelationships.push(new TQueryRelationship(0, te1.name, te2.name));
	// create sortable and define items
	jQuery('#temporalSequence_0').sortable({
		items: ':not(.immovable, .immovable .arrowText, .immovable .arrowText a, .immovable .arrowImage, .immovable .arrowImage img, .immovable div, .immovable div a, .temporalSequence .ygtvtable, .temporalEvent div, .temporalEvent a, .temporalEvent img, .temporalEvent tbody, .temporalEvent .table, .temporalEvent .ygtvrow, .temporalEvent .ygtvchildren, .temporalEvent .ygtvcell, .temporalEvent .ygtvhtml, .temporalEvent .ygtvcontent, .temporalEvent .itemDateConstraint )',
		/* .temporalEvent div div, .temporalEvent div div a, .temporalEvent div div a img, */
		/*tbody, .table, .ygtvrow, .ygtvchildren, .ygtvcell, .ygtvhtml, .ygtvcontent*/
		start: function(event, ui) 
		{
			var k = jQuery('.immovable');
			jQuery(ui.item).addClass("shadowClass");
			jQuery('.immovable', this).each(function() {
				var $this = jQuery(this);
				$this.data('pos', $this.index());
			});
		},
		change: function() {
			$sortable = jQuery(this);
			$statics = jQuery('.immovable', this).detach();
			$helper = jQuery('<div></div>').prependTo(this);
			$statics.each(function() 
					{
				var $this = jQuery(this);
				var target = $this.data('pos');
				$this.insertAfter(jQuery('>div', $sortable).eq(target));
					});
			$helper.remove();
			i2b2.CRC.view.QT.resetQueryResults();           // clear query results
		},
		stop: function(event, ui) 
		{
			jQuery(ui.item).removeClass("shadowClass");
			i2b2.CRC.view.QT.updateAllRelationshipText();   // update all relationship texts after drag/drop
		}
	});
	// tdw9: listen to clicks on arrow-inactive:
	i2b2.CRC.view.QT.attachListenersForTemporalQueryUI();
	te1.redraw(); // redraw new events
	te2.redraw();
};

i2b2.CRC.view.QT.togglePopulationPanels = function()
{
	i2b2.CRC.view.QT.isShowingPopulationQueryUI = !i2b2.CRC.view.QT.isShowingPopulationQueryUI;
	if (i2b2.CRC.view.QT.isShowingPopulationQueryUI)
	{
		jQuery("#populationLabel a span").text("\u25BC Hide Constraining Population");
		jQuery("#queryBalloonBox").show();
	}
	else
	{
		jQuery("#populationLabel a span").text("\u25B2 Show Constraining Population");
		jQuery("#queryBalloonBox").hide();
	}
	i2b2.CRC.view.QT.ResizeHeight();
};



/* SIMPLE temporal query tutorial */
i2b2.CRC.view.QT.resetAndStartTutorial = function()
{
	i2b2.CRC.view.QT.deleteAllEvents();
	i2b2.CRC.view.QT.resetTemporalQueryUI();
	jQuery("#tutorialOnOffSpan").text("Turn Off Tutorial");
	i2b2.CRC.view.QT.tutorialState = 0;
	i2b2.CRC.view.QT.resetTutorialAtState();

	// remove population as well
	delete i2b2.CRC.model.queryCurrent;
	i2b2.CRC.model.queryCurrent = {};
	i2b2.CRC.ctrlr.QT.temporalGroup = 0; 
	var dm = i2b2.CRC.model.queryCurrent;
	dm.panels = [];
	dm.panels[0] = new Array();
	dm.panels[1] = new Array();
	dm.panels[2] = new Array();
	i2b2.CRC.ctrlr.QT.doSetQueryName.call(this,'');
	i2b2.CRC.ctrlr.QT.doShowFrom(0);
	i2b2.CRC.ctrlr.QT._redrawPanelCount();

};

i2b2.CRC.view.QT.toggleTutorial = function()
{
	i2b2.CRC.view.QT.isTutorial = !i2b2.CRC.view.QT.isTutorial;
	if ( i2b2.CRC.view.QT.isTutorial )
	{
		// check to see if we have non-empty events
		var events = jQuery(".temporalEvent");
		var hasNonEmptyEvent = false;
		for ( var i = 0; i < events.length; i++ )
		{
			var jqEvent = jQuery(events[i]);
			if (jqEvent.data("event") != undefined && jqEvent.data("event").panels[0].items.length > 0)
			{
				hasNonEmptyEvent = true;
				break;
			}
		}
		// warn users that their progress will be 
		if (  !jQuery("#tqDropBox").is(":visible") && hasNonEmptyEvent )
		{
			i2b2.CRC.view.QT.showDialog("Abandon Your Current Temporal Query?", 
					"Starting tutorial now will <b>reset</b> your temporal query", 
					"Proceed to <b>reset?</b>", 
					"ui-icon-alert", 
					{Reset:function()
				{
						i2b2.CRC.view.QT.resetAndStartTutorial();
						jQuery( this ).dialog( "close");
				}, 
				Cancel:function()
				{
					i2b2.CRC.view.QT.isTutorial = false; 
					jQuery( this ).dialog( "close");
				}
					});
		}
		else
			i2b2.CRC.view.QT.resetAndStartTutorial(); // start tutorial
	}
	else
	{        
		jQuery("#tutorialOnOffSpan").text("Turn On Tutorial");
		jQuery(".tutorialComponent").hide();                    // hide ALL tutorial components
		jQuery(".highlighted").removeClass("highlighted");      // reset any highlighted components
		jQuery("#runBox").css("border", "1px #667788 solid");   // reset runQuery border 
	}
};

//First checks to see if current tutorialState is currentState before incrementing. THen it increments and resets tutorial content according the tutorialState.
i2b2.CRC.view.QT.incrementTutorialState = function( currentState, param )
{
	if (i2b2.CRC.view.QT.tutorialState == currentState )
	{
		if (currentState == 1 ) // 
		{
			var events = jQuery(".temporalEvent");
			if (events.length < 2) return; // missing at least one Event
			if (jQuery(events[0]).data("event").isEmpty() || jQuery(events[1]).data("event").isEmpty())
				return; // one of the 2 Events is empty
		}
		i2b2.CRC.view.QT.tutorialState++; // advance tutorial state
		if (i2b2.CRC.view.QT.isTutorial)
			i2b2.CRC.view.QT.resetTutorialAtState();
	}
};

i2b2.CRC.view.QT.resetTutorialAtState = function()
{
	switch (i2b2.CRC.view.QT.tutorialState)
	{
	case 0: // show users how to drop in an initial concept
		i2b2.CRC.view.QT.updateTutorialText("1. Drag a Concept from Terms or Workplace and drop it in the box below.");
		jQuery('#tutorShowMeText').text("Show Me");
		jQuery('#tutorialShowMeLink').fadeIn();
		break;
	case 1: // tell users to drop in another concept to fill in Observation B   
		i2b2.CRC.view.QT.updateTutorialText("2. Drop a Concept into Observation B to complete the temporal sequence.");
		jQuery('#tutorialShowMeLink').fadeIn();
		break;
	case 2: // users have just completed a simple sequence!
		i2b2.CRC.view.QT.updateTutorialText("3. You have just defined your first temporal sequence! Click 'Next' to tour the rest of the features.");
		jQuery('#tutorShowMeText').text("Next");
		jQuery('#tutorialShowMeLink').fadeIn();
		break;
	case 3:
		i2b2.CRC.view.QT.updateTutorialText("4. An Observation to the left always occurs before Observations to the right.");
		jQuery('#tutorShowMeText').text("Next");
		jQuery('#tutorialShowMeLink').fadeIn();
		break;
	case 4:
		jQuery('#tutorialShowMeLink').hide();
		jQuery('#tutorShowMeText').text("Next");
		i2b2.CRC.view.QT.updateTutorialText("5. But you can drag an Observation over another Observation to exchange their positons. Try it! ", function()
				{                
			jQuery('.temporalEvent').delay(1200).fadeOut(250).fadeIn(250).fadeOut(250).fadeIn(600, function()
					{ 
				jQuery(".temporalEvent").addClass("highlighted");   /*change border of temporalEvents to remind users where to drag*/ 
				jQuery('#tutorialShowMeLink').fadeIn(); 
					});                
				});
		break;
	case 5:
		jQuery('#tutorialShowMeLink').hide();
		jQuery(".temporalEvent").removeClass("highlighted");
		i2b2.CRC.view.QT.updateTutorialText("6. Click the highlighted link to change how these Observations temporally relate to each other.");
		jQuery(jQuery('.arrowText')[0]).delay(1500).fadeOut(250).fadeIn(250).fadeOut(250).fadeIn(600, function()
				{
			jQuery(jQuery(".arrowText")[0]).addClass("highlighted");
			jQuery('#tutorialShowMeLink').fadeIn();
				});
		break;
	case 6:
		jQuery('#tutorialShowMeLink').hide();
		jQuery(jQuery(".arrowText")[0]).removeClass("highlighted");
		i2b2.CRC.view.QT.updateTutorialText("7. Click the highlighted link to add more Observations to your temporal sequence.");
		jQuery(jQuery('.inactiveArrowText')[0]).delay(1500).fadeOut(250).fadeIn(250).fadeOut(250).fadeIn(600, function()
				{
			jQuery(".inactiveArrowText ").addClass("highlighted");
			jQuery('#tutorialShowMeLink').fadeIn();
				});
		break;
	case 7:
		jQuery('#tutorialShowMeLink').hide();
		jQuery(jQuery(".inactiveArrowText")[0]).removeClass("highlighted");            
		i2b2.CRC.view.QT.updateTutorialText("8. Click the highlighted label to optionally specify a population to apply the temporal search to. Click it again to hide it.");
		jQuery("#simpleTemporalQueryPointyArrow").css("top", jQuery("#populationLabel").position().top-70);
		jQuery("#simpleTemporalQueryPointyArrow").css("left", jQuery("#populationLabel").position().left + 100);
		jQuery("#simpleTemporalQueryPointyArrow").fadeIn();
		jQuery('#populationLabel').delay(1500).fadeOut(250).fadeIn(250).fadeOut(250).fadeIn(600, function()
				{
			jQuery("#simpleTemporalQueryPointyArrow").fadeOut();
			jQuery("#populationLabel").css("height", "12px");
			if (i2b2.CRC.view.QT.isTutorial) // if user turned off tutorial, do not do these
			{
				jQuery("#populationLabel").addClass("highlighted");
				jQuery('#tutorialShowMeLink').fadeIn();
			}
			else
			{
				jQuery("#populationLabel").hide();
				jQuery('#tutorialShowMeLink').hide();
			}
				});
		break;
	case 8:
		jQuery("#simpleTemporalQueryPointyArrow").hide();
		jQuery("#populationLabel").css("height", "");
		jQuery("#populationLabel").removeClass("highlighted");            
		i2b2.CRC.view.QT.updateTutorialText("9. A population is optional. By leaving it empty, the temporal search applies to every patient in the databse.");
		break;
	case 9:
		jQuery('#tutorialShowMeLink').hide();
		i2b2.CRC.view.QT.updateTutorialText("10. When you are ready, submit your query by clicking the 'Run Query' button.");
		jQuery("#simpleTemporalQueryPointyArrow").css("top", jQuery("#runBox").offset().top-150);
		jQuery("#simpleTemporalQueryPointyArrow").css("left", 20);
		jQuery("#simpleTemporalQueryPointyArrow").fadeIn();
		jQuery('#runBox').delay(1500).fadeOut(250).fadeIn(250).fadeOut(250).fadeIn(600, function()
				{
			jQuery("#simpleTemporalQueryPointyArrow").fadeOut();
			jQuery("#runBox").css("border", "2px #FED478 solid");
			jQuery('#tutorialShowMeLink').fadeIn();
				});
		break;
	case 10:
		jQuery(".highlighted").removeClass("highlighted");   // reset any highlighted components
		jQuery("#runBox").css("border", "1px #667788 solid");// reset runBox's border
		jQuery('#tutorialShowMeLink').hide();
		jQuery("#simpleTemporalQueryPointyArrow").hide();
		jQuery('#tutorShowMeText').text("Finish");
		i2b2.CRC.view.QT.updateTutorialText("11. You have completed the tutorial. Click 'Finish' to end the tutorial and reset Simple Temporal Query.",  function()
				{
			jQuery('#tutorialShowMeLink').fadeIn();
				});
		break;
	default: 
		break; 
	}
};

i2b2.CRC.view.QT.updateTutorialText = function( newText, callBack )
{
	jQuery('#tutorialText').hide();
	jQuery('#tutorialText').text( newText );
	jQuery('#tutorialText').css("color", "#FED478");
	jQuery('#tutorialText').fadeIn();
	jQuery('#tutorialText').animate({color:"white"}, 1000, function(){ if (callBack) callBack(); });
};

i2b2.CRC.view.QT.runTutorialAtState = function()
{
	switch (i2b2.CRC.view.QT.tutorialState)
	{
	case 0: // show users how to drop in an initial concept
		i2b2.CRC.view.QT.runTutorial0();
		break;
	case 1: // show users how to drop in a second concept
		i2b2.CRC.view.QT.runTutorial1();
		break;
	case 2:
		i2b2.CRC.view.QT.runTutorial2();
		break;
	case 3:
		i2b2.CRC.view.QT.runTutorial3();
		break;
	case 4: 
		i2b2.CRC.view.QT.runTutorial4();
		break;
	case 5: 
		i2b2.CRC.view.QT.runTutorial5();
		break;
	case 6: 
		i2b2.CRC.view.QT.runTutorial6();
		break;
	case 7: 
		i2b2.CRC.view.QT.runTutorial7();
		break;
	case 8: 
		i2b2.CRC.view.QT.runTutorial8();
		break;
	case 9: 
		i2b2.CRC.view.QT.runTutorial9();
		break;
	case 10: 
		i2b2.CRC.view.QT.runTutorial10();
		break;
	default: break;        
	}
};

i2b2.CRC.view.QT.runTutorial0 = function()
{
	// reset tutorial page
	jQuery("#tqDropBox").removeClass("ddCONCPTTarget");
	jQuery("#startDrop").hide();
	jQuery("#startDrop").css("left", parseInt(jQuery("#main\\.splitter").css("left")));
	jQuery("#startDrop").css("top", "190");

	// animate drop div
	var leftBound = parseInt(jQuery("#tqDropBox").css("margin-left"));
	if (leftBound == 0 ) // required for Firefox to work
		leftBound = 25;

	jQuery("#startDrop").show().animate(
			{
				left:"+=" + (100 + leftBound),
				top:"+=50"
			}, 400, 
			function()
			{
				jQuery("#tqDropBox").addClass("ddCONCPTTarget");
			}
	).fadeOut("slow", function(){ jQuery("#tqDropBox").removeClass("ddCONCPTTarget"); });
};

i2b2.CRC.view.QT.runTutorial1 = function()
{
	// reset tutorial page
	jQuery(jQuery(".temporalPanelContentDiv")[1]).removeClass("ddCONCPTTarget");
	jQuery("#startDrop").hide();
	jQuery("#startDrop").css("left", jQuery("#main\\.splitter").css("left"));
	jQuery("#startDrop").css("top", "200");
	//jQuery("#startDrop").css("");
	// animate drop div
	jQuery("#startDrop").show().animate(
			{
				left:"+="+410,
				top:"+="+150
			}, 700, 
			function()
			{
				jQuery(jQuery(".temporalPanelContentDiv")[1]).addClass("ddCONCPTTarget");
			}
	).fadeOut(700, function(){ jQuery(jQuery(".temporalPanelContentDiv")[1]).removeClass("ddCONCPTTarget"); });
};

i2b2.CRC.view.QT.runTutorial2 = function()
{ i2b2.CRC.view.QT.incrementTutorialState(2); /*go to state 3*/ };

i2b2.CRC.view.QT.runTutorial3 = function()
{ i2b2.CRC.view.QT.incrementTutorialState(3); /*go to state 4*/ };

i2b2.CRC.view.QT.runTutorial4 = function()
{ i2b2.CRC.view.QT.incrementTutorialState(4); /*go to state 5*/ };

i2b2.CRC.view.QT.runTutorial5 = function()
{ i2b2.CRC.view.QT.incrementTutorialState(5); /*go to state 6*/ };

i2b2.CRC.view.QT.runTutorial6 = function()
{ i2b2.CRC.view.QT.incrementTutorialState(6); /*go to state 7*/ };

i2b2.CRC.view.QT.runTutorial7 = function()
{ i2b2.CRC.view.QT.incrementTutorialState(7); /*go to state 8*/ };

i2b2.CRC.view.QT.runTutorial8 = function()
{ i2b2.CRC.view.QT.incrementTutorialState(8); /*go to state 9*/ };

i2b2.CRC.view.QT.runTutorial9 = function()
{ i2b2.CRC.view.QT.incrementTutorialState(9); /*go to state 9*/ };

i2b2.CRC.view.QT.runTutorial10 = function()
{ 
	jQuery(".highlighted").removeClass("highlighted"); // remove all highlighteds if they are not already removed
	jQuery("#simpleTemporalQueryPointyArrow").hide();
	i2b2.CRC.view.QT.toggleTutorial();
	i2b2.CRC.view.QT.deleteAllEvents();
	i2b2.CRC.view.QT.resetTemporalQueryUI();
	i2b2.CRC.view.QT.tutorialState = 0; // reset tutorial state
};



//Some common iconNames are: ui-icon-notice, ui-icon-info,  ui-icon-help, 	ui-icon-alert | see: https://api.jqueryui.com/theming/icons/ (use "=none=" to not show image ata ll)
i2b2.CRC.view.QT.showDialog = function(title, mainMsgHTML, subMsgHTML, userIconName, buttons, hideCloseButton, showProgress)
{

	// set buttons
	var dialogButtons = {OK: function(){jQuery( this ).dialog( "close" )}};
	if (buttons)
		dialogButtons = buttons;

	var isToHideCloseButton = false;
	if (hideCloseButton) 
		isToHideCloseButton = hideCloseButton;

	jQuery( "#QTDialog" ).dialog(
			{
				title: title,
				modal: true,
				autoOpen: false,
				width: 400,
				buttons: dialogButtons,
				open: function(event, ui)
				{
					if (isToHideCloseButton)
					{
						jQuery( "#QTDialog" ).dialog("option", "closeOnEscape", false);  // so users cannot use 'ESC' to close the dialog
						jQuery(".ui-dialog-titlebar-close", ui.dialog | ui).hide();     // hide the close button ("X")
					}
					else
					{
						jQuery( "#QTDialog" ).dialog("option", "closeOnEscape", true);  // so users can use 'ESC' to close the dialog
						jQuery(".ui-dialog-titlebar-close", ui.dialog | ui).show();     // show the close button ("X")
					}
				}
			});

	// set icon via changing classnames
	jQuery("#QTDialogImage").removeClass();
	var iconName = "ui-icon-alert";
	if (userIconName ) 
		iconName = userIconName;
	if (iconName === "=none=")
		jQuery("#QTDialogImage").hide();
	else
	{
		jQuery("#QTDialogImage").addClass("ui-icon " + iconName);
		jQuery("#QTDialogImage").show();
	}

	// set messages
	jQuery("#QTDialogMainMsg").html(mainMsgHTML);

	if ( subMsgHTML )   jQuery("#QTDialogSubMsg").html(subMsgHTML);
	else                jQuery("#QTDialogSubMsg").html("");

	// progressbar
	if ( showProgress )
	{
		jQuery("#QTDialogProgressBar").progressbar({value: 0});
		jQuery("#QTDialogProgressBar").height(20);
		jQuery(jQuery("#QTDialogProgressBar").children()[0]).css("height", 20);
		jQuery("#QTDialogProgressBar").show();
	}
	else
	{
		jQuery("#QTDialogProgressBar").hide();
	}
	// open dialog
	jQuery("#QTDialog").dialog("open");    
};

/******************************************************************************************************
 * tdw9 1707c: end of Temporal Query Remake Code
 ******************************************************************************************************/



//This is done once the entire cell has been loaded
console.info("SUBSCRIBED TO i2b2.events.afterCellInit");
i2b2.events.afterCellInit.subscribe(
		(function(en,co) {
			if (co[0].cellCode=='CRC') {
//				================================================================================================== //
				console.debug('[EVENT CAPTURED i2b2.events.afterCellInit]');
				//Update the result types from ajax call
				var scopedCallback = new i2b2_scopedCallback();
				scopedCallback.callback = function(results) {
					//var cl_onCompleteCB = onCompleteCallback;
					// THIS function is used to process the AJAX results of the getChild call
					//		results data object contains the following attributes:
					//			refXML: xmlDomObject <--- for data processing
					//			msgRequest: xml (string)
					//			msgResponse: xml (string)
					//			error: boolean
					//			errorStatus: string [only with error=true]
					//			errorMsg: string [only with error=true]

					var retMsg = {
							error: results.error,
							msgRequest: results.msgRequest,
							msgResponse: results.msgResponse,
							msgUrl: results.msgUrl,
							results: null
					};
					var retChildren = [];

					// extract records from XML msg
					var newHTML = "";
					var ps = results.refXML.getElementsByTagName('query_result_type');
					for(var i1=0; i1<ps.length; i1++) {
						var o = new Object;
						o.result_type_id = i2b2.h.getXNodeVal(ps[i1],'result_type_id');
						o.name = i2b2.h.getXNodeVal(ps[i1],'name');

						var checked = "";
						switch(o.name) {
						case "PATIENT_COUNT_XML":
							//	o.name = "PRS";
							checked = "checked=\"checked\"";
							break;
							//case "PATIENT_ENCOUNTER_SET":
							//	o.name = "ENS";
							//	checked = "checked=\"checked\"";
							//	break;
							//case "PATIENT_COUNT_XML":
							//	o.name = "PRC";
							//	checked = "checked=\"checked\"";
							//	break;
						}

						o.display_type = i2b2.h.getXNodeVal(ps[i1],'display_type');
						o.visual_attribute_type = i2b2.h.getXNodeVal(ps[i1],'visual_attribute_type');
						o.description = i2b2.h.getXNodeVal(ps[i1],'description');
						// need to process param columns 
						//o. = i2b2.h.getXNodeVal(ps[i1],'');
						//this.model.events.push(o);
						if (o.visual_attribute_type == "LA") {
							newHTML += 	"			<div id=\"crcDlgResultOutput" + o.name + "\"><input type=\"checkbox\" class=\"chkQueryType\" name=\"queryType\" value=\"" + o.name + "\" " + checked + "/> " + o.description + "</div>";
						}
					}		

					$('dialogQryRunResultType').innerHTML = newHTML;
				}

				i2b2.CRC.ajax.getQRY_getResultType("CRC:SDX:PatientRecordSet", null, scopedCallback);





				// register the query panels as valid DragDrop targets for Ontology Concepts (CONCPT) and query master (QM) objects
				var op_trgt = {dropTarget:true};
				i2b2.sdx.Master.AttachType('QPD1', 'CONCPT', op_trgt);
				i2b2.sdx.Master.AttachType('QPD2', 'CONCPT', op_trgt);
				i2b2.sdx.Master.AttachType('QPD3', 'CONCPT', op_trgt);
				i2b2.sdx.Master.AttachType('QPD1', 'ENS', op_trgt);
				i2b2.sdx.Master.AttachType('QPD2', 'ENS', op_trgt);
				i2b2.sdx.Master.AttachType('QPD3', 'ENS', op_trgt);
				i2b2.sdx.Master.AttachType('QPD1', 'PRS', op_trgt);
				i2b2.sdx.Master.AttachType('QPD2', 'PRS', op_trgt);
				i2b2.sdx.Master.AttachType('QPD3', 'PRS', op_trgt);
				i2b2.sdx.Master.AttachType('QPD1', 'QM', op_trgt);
				i2b2.sdx.Master.AttachType('QPD2', 'QM', op_trgt);
				i2b2.sdx.Master.AttachType('QPD3', 'QM', op_trgt);
				i2b2.sdx.Master.AttachType('queryName', 'QM', op_trgt);
				i2b2.sdx.Master.AttachType('outerTemporalSequenceUI', 'CONCPT', op_trgt); // tdw9 1707c: let outerTemporalSequenceUI accept drops

				i2b2.sdx.Master.AttachType('QPD1', 'PR', op_trgt);
				i2b2.sdx.Master.AttachType('QPD2', 'PR', op_trgt);
				i2b2.sdx.Master.AttachType('QPD3', 'PR', op_trgt);
				/*
                        i2b2.sdx.Master.AttachType('QPD1', 'WRK', op_trgt);
                        i2b2.sdx.Master.AttachType('QPD2', 'WRK', op_trgt);
                        i2b2.sdx.Master.AttachType('QPD3', 'WRK', op_trgt);		
				 */
				i2b2.sdx.Master.AttachType('QPD1', 'WRKF', op_trgt);
				i2b2.sdx.Master.AttachType('QPD2', 'WRKF', op_trgt);
				i2b2.sdx.Master.AttachType('QPD3', 'WRKF', op_trgt);

				//======================= <Define Hover Handlers> =======================
				var funcHovOverQM = function(e, id, ddProxy) {
					var el = $(id);
					// apply DragDrop targeting CCS
					var targets = YAHOO.util.DDM.getRelated(ddProxy, true);
					for (var i=0; i<targets.length; i++) {
						Element.addClassName(targets[i]._domRef,"ddQMTarget");
					} 
				}
				var funcHovOutQM = function(e, id, ddProxy) {
					var el = $(id);
					// apply DragDrop targeting CCS
					var targets = YAHOO.util.DDM.getRelated(ddProxy, true);
					for (var i=0; i<targets.length; i++) {
						Element.removeClassName(targets[i]._domRef,"ddQMTarget");
					} 
				}
				var funcHovOverCONCPT = function(e, id, ddProxy) {
					var el = $(id);
					if (Object.isUndefined(el.linkbackPanelController)) { return false;}
					var panelController = el.linkbackPanelController;
					// see if the panel controller is enabled
					if (panelController.isActive == 'Y') {										
						Element.addClassName(panelController.refDispContents,'ddCONCPTTarget');
					}
				}
				var funcHovOutCONCPT = function(e, id, ddProxy) {
					var el = $(id);
					if (Object.isUndefined(el.linkbackPanelController)) { return false;}
					var panelController = el.linkbackPanelController;
					// see if the panel controller is enabled
					if (panelController.isActive == 'Y') {
						Element.removeClassName(panelController.refDispContents,'ddCONCPTTarget');
					}
				}
				i2b2.sdx.Master.setHandlerCustom('QPD1', 'QM', 'onHoverOut', funcHovOutCONCPT);
				i2b2.sdx.Master.setHandlerCustom('QPD2', 'QM', 'onHoverOut', funcHovOutCONCPT);
				i2b2.sdx.Master.setHandlerCustom('QPD3', 'QM', 'onHoverOut', funcHovOutCONCPT);
				i2b2.sdx.Master.setHandlerCustom('queryName', 'QM', 'onHoverOut', funcHovOutQM);
				i2b2.sdx.Master.setHandlerCustom('QPD1', 'QM', 'onHoverOver', funcHovOverCONCPT);
				i2b2.sdx.Master.setHandlerCustom('QPD2', 'QM', 'onHoverOver', funcHovOverCONCPT);
				i2b2.sdx.Master.setHandlerCustom('QPD3', 'QM', 'onHoverOver', funcHovOverCONCPT);
				i2b2.sdx.Master.setHandlerCustom('queryName', 'QM', 'onHoverOver', funcHovOverQM);
				i2b2.sdx.Master.setHandlerCustom('QPD1', 'CONCPT', 'onHoverOut', funcHovOutCONCPT);
				i2b2.sdx.Master.setHandlerCustom('QPD2', 'CONCPT', 'onHoverOut', funcHovOutCONCPT);
				i2b2.sdx.Master.setHandlerCustom('QPD3', 'CONCPT', 'onHoverOut', funcHovOutCONCPT);
				i2b2.sdx.Master.setHandlerCustom('QPD1', 'CONCPT', 'onHoverOver', funcHovOverCONCPT);
				i2b2.sdx.Master.setHandlerCustom('QPD2', 'CONCPT', 'onHoverOver', funcHovOverCONCPT);
				i2b2.sdx.Master.setHandlerCustom('QPD3', 'CONCPT', 'onHoverOver', funcHovOverCONCPT);
				i2b2.sdx.Master.setHandlerCustom('QPD1', 'ENS', 'onHoverOut', funcHovOutCONCPT);
				i2b2.sdx.Master.setHandlerCustom('QPD2', 'ENS', 'onHoverOut', funcHovOutCONCPT);
				i2b2.sdx.Master.setHandlerCustom('QPD3', 'ENS', 'onHoverOut', funcHovOutCONCPT);
				i2b2.sdx.Master.setHandlerCustom('QPD1', 'ENS', 'onHoverOver', funcHovOverCONCPT);
				i2b2.sdx.Master.setHandlerCustom('QPD2', 'ENS', 'onHoverOver', funcHovOverCONCPT);
				i2b2.sdx.Master.setHandlerCustom('QPD3', 'ENS', 'onHoverOver', funcHovOverCONCPT);			
				i2b2.sdx.Master.setHandlerCustom('QPD1', 'PRS', 'onHoverOut', funcHovOutCONCPT);
				i2b2.sdx.Master.setHandlerCustom('QPD2', 'PRS', 'onHoverOut', funcHovOutCONCPT);
				i2b2.sdx.Master.setHandlerCustom('QPD3', 'PRS', 'onHoverOut', funcHovOutCONCPT);
				i2b2.sdx.Master.setHandlerCustom('QPD1', 'PRS', 'onHoverOver', funcHovOverCONCPT);
				i2b2.sdx.Master.setHandlerCustom('QPD2', 'PRS', 'onHoverOver', funcHovOverCONCPT);
				i2b2.sdx.Master.setHandlerCustom('QPD3', 'PRS', 'onHoverOver', funcHovOverCONCPT);			

				i2b2.CRC.view.QT.attachDropListenerToOuterTemporalSequenceUI(); //tdw9 1707c: attach mouse over/out listenrs to outerTemporalSequenceUI

				i2b2.sdx.Master.setHandlerCustom('QPD1', 'PR', 'onHoverOut', funcHovOutCONCPT);
				i2b2.sdx.Master.setHandlerCustom('QPD2', 'PR', 'onHoverOut', funcHovOutCONCPT);
				i2b2.sdx.Master.setHandlerCustom('QPD3', 'PR', 'onHoverOut', funcHovOutCONCPT);
				i2b2.sdx.Master.setHandlerCustom('QPD1', 'PR', 'onHoverOver', funcHovOverCONCPT);
				i2b2.sdx.Master.setHandlerCustom('QPD2', 'PR', 'onHoverOver', funcHovOverCONCPT);
				i2b2.sdx.Master.setHandlerCustom('QPD3', 'PR', 'onHoverOver', funcHovOverCONCPT);

				i2b2.sdx.Master.setHandlerCustom('QPD1', 'WRKF', 'onHoverOut', funcHovOutCONCPT);
				i2b2.sdx.Master.setHandlerCustom('QPD2', 'WRKF', 'onHoverOut', funcHovOutCONCPT);
				i2b2.sdx.Master.setHandlerCustom('QPD3', 'WRKF', 'onHoverOut', funcHovOutCONCPT);
				i2b2.sdx.Master.setHandlerCustom('QPD1', 'WRKF', 'onHoverOver', funcHovOverCONCPT);
				i2b2.sdx.Master.setHandlerCustom('QPD2', 'WRKF', 'onHoverOver', funcHovOverCONCPT);
				i2b2.sdx.Master.setHandlerCustom('QPD3', 'WRKF', 'onHoverOver', funcHovOverCONCPT);


				//======================= <Define Drop Handlers> =======================

				//======================= <Define Drop Handlers> =======================
				i2b2.sdx.Master.setHandlerCustom('QPD1', 'CONCPT', 'DropHandler', (function(sdxData) { 
					sdxData = sdxData[0];	// only interested in first record
					var t = i2b2.CRC.ctrlr.QT.panelControllers[0];
					if (t.isActive=="Y") { t.doDrop(sdxData); }
				}));
				i2b2.sdx.Master.setHandlerCustom('QPD2', 'CONCPT', 'DropHandler', (function(sdxData) { 
					sdxData = sdxData[0];	// only interested in first record
					var t = i2b2.CRC.ctrlr.QT.panelControllers[1];
					if (t.isActive=="Y") { t.doDrop(sdxData); }
				}));
				i2b2.sdx.Master.setHandlerCustom('QPD3', 'CONCPT', 'DropHandler', (function(sdxData) { 
					sdxData = sdxData[0];	// only interested in first record
					var t = i2b2.CRC.ctrlr.QT.panelControllers[2];
					if (t.isActive=="Y") { t.doDrop(sdxData); }
				}));

				i2b2.sdx.Master.setHandlerCustom('QPD1', 'ENS', 'DropHandler', (function(sdxData) { 
					sdxData = sdxData[0];	// only interested in first record
					var t = i2b2.CRC.ctrlr.QT.panelControllers[0];
					if (t.isActive=="Y") { t.doDrop(sdxData); }
				}));
				i2b2.sdx.Master.setHandlerCustom('QPD2', 'ENS', 'DropHandler', (function(sdxData) { 
					sdxData = sdxData[0];	// only interested in first record
					var t = i2b2.CRC.ctrlr.QT.panelControllers[1];
					if (t.isActive=="Y") { t.doDrop(sdxData); }
				}));
				i2b2.sdx.Master.setHandlerCustom('QPD3', 'ENS', 'DropHandler', (function(sdxData) { 
					sdxData = sdxData[0];	// only interested in first record
					var t = i2b2.CRC.ctrlr.QT.panelControllers[2];
					if (t.isActive=="Y") { t.doDrop(sdxData); }
				}));

				i2b2.sdx.Master.setHandlerCustom('QPD1', 'PRS', 'DropHandler', (function(sdxData) { 
					sdxData = sdxData[0];	// only interested in first record
					var t = i2b2.CRC.ctrlr.QT.panelControllers[0];
					if (t.isActive=="Y") { t.doDrop(sdxData); }
				}));
				i2b2.sdx.Master.setHandlerCustom('QPD2', 'PRS', 'DropHandler', (function(sdxData) { 
					sdxData = sdxData[0];	// only interested in first record
					var t = i2b2.CRC.ctrlr.QT.panelControllers[1];
					if (t.isActive=="Y") { t.doDrop(sdxData); }
				}));
				i2b2.sdx.Master.setHandlerCustom('QPD3', 'PRS', 'DropHandler', (function(sdxData) { 
					sdxData = sdxData[0];	// only interested in first record
					var t = i2b2.CRC.ctrlr.QT.panelControllers[2];
					if (t.isActive=="Y") { t.doDrop(sdxData); }
				}));

				i2b2.sdx.Master.setHandlerCustom('QPD1', 'PR', 'DropHandler', (function(sdxData) {
					sdxData = sdxData[0];   // only interested in first record
					var t = i2b2.CRC.ctrlr.QT.panelControllers[0];
					if (t.isActive=="Y") { t.doDrop(sdxData); }
				}));
				i2b2.sdx.Master.setHandlerCustom('QPD2', 'PR', 'DropHandler', (function(sdxData) {
					sdxData = sdxData[0];   // only interested in first record
					var t = i2b2.CRC.ctrlr.QT.panelControllers[1];
					if (t.isActive=="Y") { t.doDrop(sdxData); }
				}));
				i2b2.sdx.Master.setHandlerCustom('QPD3', 'PR', 'DropHandler', (function(sdxData) {
					sdxData = sdxData[0];   // only interested in first record
					var t = i2b2.CRC.ctrlr.QT.panelControllers[2];
					if (t.isActive=="Y") { t.doDrop(sdxData); }
				}));

				i2b2.sdx.Master.setHandlerCustom('QPD1', 'WRKF', 'DropHandler', (function(sdxData) {
					sdxData = sdxData[0];   // only interested in first record
					var t = i2b2.CRC.ctrlr.QT.panelControllers[0];
					if (t.isActive=="Y") { t.doDrop(sdxData); }
				}));
				i2b2.sdx.Master.setHandlerCustom('QPD2', 'WRKF', 'DropHandler', (function(sdxData) {
					sdxData = sdxData[0];   // only interested in first record
					var t = i2b2.CRC.ctrlr.QT.panelControllers[1];
					if (t.isActive=="Y") { t.doDrop(sdxData); }
				}));
				i2b2.sdx.Master.setHandlerCustom('QPD3', 'WRKF', 'DropHandler', (function(sdxData) {
					sdxData = sdxData[0];   // only interested in first record
					var t = i2b2.CRC.ctrlr.QT.panelControllers[2];
					if (t.isActive=="Y") { t.doDrop(sdxData); }
				}));	

				i2b2.sdx.Master.setHandlerCustom('QPD1', 'QM', 'DropHandler', (function(sdxData) { 
					sdxData = sdxData[0];	// only interested in first record
					var t = i2b2.CRC.ctrlr.QT.panelControllers[0];
					if (t.isActive=="Y") { t.doDrop(sdxData); }
				}));
				i2b2.sdx.Master.setHandlerCustom('QPD2', 'QM', 'DropHandler', (function(sdxData) { 
					sdxData = sdxData[0];	// only interested in first record
					var t = i2b2.CRC.ctrlr.QT.panelControllers[1];
					if (t.isActive=="Y") { t.doDrop(sdxData); }
				}));
				i2b2.sdx.Master.setHandlerCustom('QPD3', 'QM', 'DropHandler', (function(sdxData) { 
					sdxData = sdxData[0];	// only interested in first record
					var t = i2b2.CRC.ctrlr.QT.panelControllers[2];
					if (t.isActive=="Y") { t.doDrop(sdxData); }
				}));

				var funcATN = function(yuiTree, yuiParentNode, sdxDataPack, callbackLoader) { 
					var myobj = { html: sdxDataPack.renderData.html, nodeid: sdxDataPack.renderData.htmlID}
					// if the treenode we are appending to is the root node then do not show the [+] infront
					if (yuiTree.getRoot() == yuiParentNode) {
						var tmpNode = new YAHOO.widget.HTMLNode(myobj, yuiParentNode, false, false);
					} else {
						var tmpNode = new YAHOO.widget.HTMLNode(myobj, yuiParentNode, false, true);
					}
					if (sdxDataPack.renderData.iconType != 'CONCPT_item' && !Object.isUndefined(callbackLoader)) {
						// add the callback to load child nodes
						sdxDataPack.sdxInfo.sdxLoadChildren = callbackLoader;
					}
					tmpNode.data.i2b2_SDX= sdxDataPack;
					tmpNode.toggle = function() {
						if (!this.tree.locked && ( this.hasChildren(true) ) ) {
							var data = this.data.i2b2_SDX.renderData;
							var img = this.getContentEl();
							img = Element.select(img,'img')[0];
							if (this.expanded) { 
								img.src = data.icon;
								this.collapse(); 
							} else { 
								img.src = data.iconExp;
								this.expand(); 
							}
						}
					};
					if (sdxDataPack.renderData.iconType == 'CONCPT_leaf' || !sdxDataPack.renderData.canExpand) { tmpNode.dynamicLoadComplete = true; }
				}
				i2b2.sdx.Master.setHandlerCustom('QPD1', 'CONCPT', 'AppendTreeNode', funcATN);
				i2b2.sdx.Master.setHandlerCustom('QPD2', 'CONCPT', 'AppendTreeNode', funcATN);
				i2b2.sdx.Master.setHandlerCustom('QPD3', 'CONCPT', 'AppendTreeNode', funcATN);

				i2b2.sdx.Master.setHandlerCustom('QPD1', 'ENS', 'AppendTreeNode', funcATN);
				i2b2.sdx.Master.setHandlerCustom('QPD2', 'ENS', 'AppendTreeNode', funcATN);
				i2b2.sdx.Master.setHandlerCustom('QPD3', 'ENS', 'AppendTreeNode', funcATN);

				i2b2.sdx.Master.setHandlerCustom('QPD1', 'PRS', 'AppendTreeNode', funcATN);
				i2b2.sdx.Master.setHandlerCustom('QPD2', 'PRS', 'AppendTreeNode', funcATN);
				i2b2.sdx.Master.setHandlerCustom('QPD3', 'PRS', 'AppendTreeNode', funcATN);

				i2b2.sdx.Master.setHandlerCustom('QPD1', 'PR', 'AppendTreeNode', funcATN);
				i2b2.sdx.Master.setHandlerCustom('QPD2', 'PR', 'AppendTreeNode', funcATN);
				i2b2.sdx.Master.setHandlerCustom('QPD3', 'PR', 'AppendTreeNode', funcATN);
				/*
                        i2b2.sdx.Master.setHandlerCustom('QPD1', 'WRK', 'AppendTreeNode', funcATN);
                        i2b2.sdx.Master.setHandlerCustom('QPD2', 'WRK', 'AppendTreeNode', funcATN);
                        i2b2.sdx.Master.setHandlerCustom('QPD3', 'WRK', 'AppendTreeNode', funcATN);
				 */
				i2b2.sdx.Master.setHandlerCustom('QPD1', 'WRKF', 'AppendTreeNode', funcATN);
				i2b2.sdx.Master.setHandlerCustom('QPD2', 'WRKF', 'AppendTreeNode', funcATN);
				i2b2.sdx.Master.setHandlerCustom('QPD3', 'WRKF', 'AppendTreeNode', funcATN);


				var funcQMDH = function(sdxData) {
					sdxData = sdxData[0];	// only interested in first record
					// pass the QM ID to be loaded
					var qm_id = sdxData.sdxInfo.sdxKeyValue;
					i2b2.CRC.ctrlr.QT.doQueryLoad(qm_id)
				};
				i2b2.sdx.Master.setHandlerCustom('QPD1', 'QM', 'AppendTreeNode', funcATN);
				i2b2.sdx.Master.setHandlerCustom('QPD2', 'QM', 'AppendTreeNode', funcATN);
				i2b2.sdx.Master.setHandlerCustom('QPD3', 'QM', 'AppendTreeNode', funcATN);
				i2b2.sdx.Master.setHandlerCustom('queryName', 'QM', 'DropHandler', funcQMDH);
				//======================= </Define Drop Handlers> =======================


				// ========= Override default LoadChildrenFromTreeview handler (we need this so that we can properly capture the XML request/response messages) ========= 
				var funcLCFT = function(node, onCompleteCallback) {
					var scopedCallback = new i2b2_scopedCallback();
					scopedCallback.scope = node.data.i2b2_SDX;
					scopedCallback.callback = function(results) {
						var cl_node = node;
						var cl_onCompleteCB = onCompleteCallback;
						var cl_options = options;
						// THIS function is used to process the AJAX results of the getChild call
						//		results data object contains the following attributes:
						//			refXML: xmlDomObject <--- for data processing
						//			msgRequest: xml (string)
						//			msgResponse: xml (string)
						//			error: boolean
						//			errorStatus: string [only with error=true]
						//			errorMsg: string [only with error=true]


						// <THIS IS WHY WE ARE CREATING CUSTOMER HANDLERS FOR THE Query Tool CONTROL!>
						i2b2.CRC.view.QT.queryResponse = results.msgResponse;
						i2b2.CRC.view.QT.queryRequest = results.msgRequest;
						i2b2.CRC.view.QT.queryUrl = results.msgUrl;
						// </THIS IS WHY WE ARE CREATING CUSTOMER HANDLERS FOR THE QueryTool CONTROL!>					

						// clear the drop-lock so the node can be requeried if anything bad happens below
						node.data.i2b2_dropLock = false;


						// handle any errors
						if (results.error) {
							// process the specific error
							var errorCode = results.refXML.getElementsByTagName('status')[0].firstChild.nodeValue;
							if (errorCode == "MAX_EXCEEDED") {
								var eaction = confirm("The number of children in this node exceeds the maximum number you specified in options.\n Displaying all children may take a long time to do.");
							}
							else {
								alert("The following error has occurred:\n" + errorCode);
							}
							// re-fire the call with no max limit if the user requested so
							if (eaction) {
								var mod_options = Object.clone(cl_options);
								delete mod_options.ont_max_records;
								i2b2.ONT.ajax.GetChildConcepts("CRC:QueryTool", mod_options, scopedCallback);
								return true;
							}
							// ROLLBACK the tree changes
							cl_onCompleteCB();
							// reset dynamic load state for the node (total hack of YUI Treeview)
							node.collapse();
							node.dynamicLoadComplete = false;
							node.expanded = false;
							node.childrenRendered = false;
							node._dynLoad = true;
							// uber-elite code (fix the style settings)
							var tc = node.getToggleEl().className;
							tc = tc.substring(0, tc.length - 1) + 'p';
							node.getToggleEl().className = tc;
							// fix the icon image
							var img = node.getContentEl();
							img = Element.select(img, 'img')[0];
							img.src = node.data.i2b2_SDX.sdxInfo.icon;
							return false;
						}

						var c = results.refXML.getElementsByTagName('concept');
						for(var i=0; i<1*c.length; i++) {
							var o = new Object;
							o.xmlOrig = c[i];
							o.name = i2b2.h.getXNodeVal(c[i],'name');
							o.hasChildren = i2b2.h.getXNodeVal(c[i],'visualattributes').substring(0,2);
							o.level = i2b2.h.getXNodeVal(c[i],'level');
							o.key = i2b2.h.getXNodeVal(c[i],'key');
							o.tooltip = i2b2.h.getXNodeVal(c[i],'tooltip');
							o.icd9 = '';
							o.table_name = i2b2.h.getXNodeVal(c[i],'tablename');
							o.column_name = i2b2.h.getXNodeVal(c[i],'columnname');
							o.operator = i2b2.h.getXNodeVal(c[i],'operator');
							o.dim_code = i2b2.h.getXNodeVal(c[i],'dimcode');
							// append the data node
							var sdxDataNode = i2b2.sdx.Master.EncapsulateData('CONCPT',o);
							var renderOptions = {
									title: o.name,
									dblclick: "i2b2.ONT.view.nav.ToggleNode(this,'"+cl_node.tree.id+"')",
									icon: {
										root: "sdx_ONT_CONCPT_root.gif",
										rootExp: "sdx_ONT_CONCPT_root-exp.gif",
										branch: "sdx_ONT_CONCPT_branch.gif",
										branchExp: "sdx_ONT_CONCPT_branch-exp.gif",
										leaf: "sdx_ONT_CONCPT_leaf.gif"
									}
							};
							var sdxRenderData = i2b2.sdx.Master.RenderHTML(cl_node.tree.id, sdxDataNode, renderOptions);
							i2b2.sdx.Master.AppendTreeNode(cl_node.tree, cl_node, sdxRenderData);
						}
						// handle the YUI treeview	
						cl_onCompleteCB();
					}

					// fix double loading error via node level dropping-lock
					if (node.data.i2b2_dropLock) { return true; }
					node.data.i2b2_dropLock = true;

					var options = {};
					options.ont_max_records = "max='" +i2b2.CRC.cfg.params.maxChildren + "'";
					options.result_wait_time= i2b2.CRC.cfg.params.queryTimeout;
					options.ont_synonym_records = i2b2.ONT.cfg.params.synonyms;
					options.ont_hidden_records = i2b2.ONT.cfg.params.hiddens;
					// parent key
					options.concept_key_value = node.data.i2b2_SDX.sdxInfo.sdxKeyValue;
					options.version = i2b2.ClientVersion;
					i2b2.ONT.ajax.GetChildConcepts("CRC:QueryTool", options, scopedCallback);
				}
				i2b2.sdx.Master.setHandlerCustom('QPD1', 'CONCPT', 'LoadChildrenFromTreeview', funcLCFT);
				i2b2.sdx.Master.setHandlerCustom('QPD2', 'CONCPT', 'LoadChildrenFromTreeview', funcLCFT);
				i2b2.sdx.Master.setHandlerCustom('QPD3', 'CONCPT', 'LoadChildrenFromTreeview', funcLCFT);
				// ========= END Override default LoadChildrenFromTreeview handler (we need this so that we can properly capture the XML request/response messages)  END ========= 



				//======================= <Initialization> =======================
				// Connect the panel controllers to the DOM nodes in the document
				var t = i2b2.CRC.ctrlr.QT;

				queryTimingButton =  new YAHOO.widget.Button("queryTiming", 
						{ lazyLoad: "false", type: "menu", menu: "menubutton1select", name:"querytiming" });

				defineTemporalButton = new YAHOO.widget.Button( "defineTemporal", 
						{ lazyloadmenu: false, type: "menu", menu: "menubutton2select", name:"definetemporal" });


				var addDefineGroup = new YAHOO.widget.Button("addDefineGroup"); 
				addDefineGroup.on("click", function (event) {
					i2b2.CRC.view.QT.addNewTemporalGroup();

				});

				var removeDefineGroup = new YAHOO.widget.Button("removeDefineGroup"); 
				removeDefineGroup.on("click", function (event) {
					i2b2.CRC.view.QT.deleteLastTemporalGroup();

				});


				queryTimingButton.on("mousedown", function (event) {
					//i2b2.CRC.ctrlr.QT.panelControllers[0].doTiming(p_oItem.value);
					if ((i2b2.CRC.ctrlr.QT.hasModifier) && (queryTimingButton.getMenu().getItems().length == 3))  {
						queryTimingButton.getMenu().addItems([ 	 
							{ text: "Non-Temporal Query: Items Instance will be the same", value: "SAMEINSTANCENUM" }]); // tdw9 1707c: added "Non-Temporal Query" for temporal query UI work
						queryTimingButton.getMenu().render();
					}
				});



				defineTemporalButton.on("selectedMenuItemChange", function (event) {
					//i2b2.CRC.ctrlr.QT.panelControllers[0].doTiming(p_oItem.value);
					var oMenuItem = event.newValue; 

					var sText = oMenuItem.value;
					defineTemporalButton.set("label",oMenuItem.cfg.getProperty("text"));	

					if (sText != "BUILDER")
					{
						$('crc.temoralBuilder').hide();		

						$('crc.innerQueryPanel').show();
						i2b2.CRC.ctrlr.QT.temporalGroup = sText;
						i2b2.CRC.ctrlr.QT._redrawAllPanels();


						if (sText == "0")
						{
							$('QPD1').style.background = '#FFFFFF';
							$('queryPanelTitle1').innerHTML = 'Group 1';
							i2b2.CRC.ctrlr.QT.panelControllers[0].refTiming.set('disabled', false);
						} else {
							$('QPD1').style.background = '#D9ECF0';
							$('queryPanelTitle1').innerHTML = 'Anchoring Observation';	
							i2b2.CRC.ctrlr.QT.panelControllers[0].doTiming("SAMEINSTANCENUM");
							i2b2.CRC.ctrlr.QT.panelControllers[0].refTiming.set('disabled', true);
							i2b2.CRC.ctrlr.QT.panelControllers[0].refTiming.set("label", "Items Instance will be the same");		



						}
					} else {
						$('crc.innerQueryPanel').hide();
						$('crc.temoralBuilder').show();	
						//				queryTimingButton.set("label", "Temporal Contraint Builder");
					}
					i2b2.CRC.view.QT.ResizeHeight();
				}); 

				queryTimingButton.on("selectedMenuItemChange", function (event) {
					//i2b2.CRC.ctrlr.QT.panelControllers[0].doTiming(p_oItem.value);
					var oMenuItem = event.newValue; 

					if (oMenuItem == 0)
					{
						var sValue = "ANY";
						var sText = "Treat all groups independently";
					} else if (oMenuItem == 1)
					{
						var sValue = "SAME";
						var sText = "Selected groups occur in the same financial encounter";
					} else {
						var sValue = oMenuItem.value;
						var sText = oMenuItem.cfg.getProperty("text");
					}

					if (sValue != "TEMPORAL") {
						var dm = i2b2.CRC.model.queryCurrent;
						for (var k=0; k<dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup].length; k++) {
							dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][k].timing = sValue;
						}
					}

					//var sText = oMenuItem.cfg.getProperty("text");

					var length = i2b2.CRC.ctrlr.QT.panelControllers.length;

					queryTimingButton.set("label", sText);		

					if (sValue != "TEMPORAL") {
						$('QPD1').style.background = '#FFFFFF';
						$('defineTemporalBar').hide();
						$('crc.temoralBuilder').hide();	
						$('crc.innerQueryPanel').show();
						// tdw9 1707c: if currently showing temporal query, hide it and go back to non-temporal query UI
						if (i2b2.CRC.view.QT.isShowingTemporalQueryUI)
							i2b2.CRC.view.QT.toggleTemporalQueryUI();
					}
					if (sValue == "SAMEVISIT") {
						i2b2.CRC.ctrlr.QT.queryTiming = "SAMEVISIT";
						for (var i=0; i<length; i++) {
							//$("queryPanelTimingB" + (i+1) +  "-button").disabled = false;					
							//$("queryPanelTimingB" + (i+1) +  "-button").innerHTML = "Occurs in Same Encounter";	
							i2b2.CRC.ctrlr.QT.panelControllers[i].refTiming.set('disabled', false);					
							i2b2.CRC.ctrlr.QT.panelControllers[i].refTiming.set("label",  "Occurs in Same Encounter");	
							if (YAHOO.util.Dom.inDocument(i2b2.CRC.ctrlr.QT.panelControllers[i].refTiming.getMenu().element)) {

								i2b2.CRC.ctrlr.QT.panelControllers[i].refTiming.getMenu().clearContent();
								i2b2.CRC.ctrlr.QT.panelControllers[i].refTiming.getMenu().addItems([ 	 
									{ text: "Treat Independently", value: "ANY"}]);	
								i2b2.CRC.ctrlr.QT.panelControllers[i].refTiming.getMenu().addItems([ 	 
									{ text: "Occurs in Same Encounter", value: "SAMEVISIT" }]);	 
								i2b2.CRC.ctrlr.QT.panelControllers[i].refTiming.getMenu().addItems([ 												
									{ text: "Items Instance will be the same", value: "SAMEINSTANCENUM" }]);	 
								i2b2.CRC.ctrlr.QT.panelControllers[i].refTiming.getMenu().render();
							} else {
								i2b2.CRC.ctrlr.QT.panelControllers[i].refTiming.itemData ={ text: "Treat Independently", value: "ANY",
										text: "Occurs in Same Encounter", value: "SAMEVISIT",
										text: "Items Instance will be the same", value: "SAMEINSTANCENUM"  };
							}
							i2b2.CRC.ctrlr.QT.panelControllers[i].doTiming(sValue);
						}

					} else if (sValue == "ANY") {
						i2b2.CRC.ctrlr.QT.queryTiming = "ANY";

						i2b2.CRC.ctrlr.QT.temporalGroup = 0;
						i2b2.CRC.ctrlr.QT._redrawAllPanels();

						for (var i=0; i<length; i++) {
							i2b2.CRC.ctrlr.QT.panelControllers[i].refTiming.set("label", "Treat Independently");		
							i2b2.CRC.ctrlr.QT.panelControllers[i].refTiming.set('disabled', true);				
							i2b2.CRC.ctrlr.QT.panelControllers[i].doTiming(sValue);
						}
					} else if (sValue == "ENCOUNTER") {
						i2b2.CRC.ctrlr.QT.queryTiming = "ENCOUNTER";
						for (var i=0; i<length; i++) {
							//$("queryPanelTimingB" + (i+1) +  "-button").disabled = false;					
							//$("queryPanelTimingB" + (i+1) +  "-button").innerHTML = "Occurs in Same Encounter";	
							i2b2.CRC.ctrlr.QT.panelControllers[i].refTiming.set('disabled', false);					
							i2b2.CRC.ctrlr.QT.panelControllers[i].refTiming.set("label",  "Treat Independently");	
							if (YAHOO.util.Dom.inDocument(i2b2.CRC.ctrlr.QT.panelControllers[i].refTiming.getMenu().element)) {

								i2b2.CRC.ctrlr.QT.panelControllers[i].refTiming.getMenu().clearContent();
								i2b2.CRC.ctrlr.QT.panelControllers[i].refTiming.getMenu().addItems([ 	 
									{ text: "Treat Independently", value: "ANY"}]);	
								for (var j=0; j<length; j++) {
									i2b2.CRC.ctrlr.QT.panelControllers[i].refTiming.getMenu().addItems([ 	 
										{ text: "Occurs (" + (j+1) + ")", value: "OCCUR"+j }]);	 
								}
								i2b2.CRC.ctrlr.QT.panelControllers[i].refTiming.getMenu().render();
							} else {
								i2b2.CRC.ctrlr.QT.panelControllers[i].refTiming.itemData ={ text: "Treat Independently", value: "ANY",
										text: "Occurs", value: "OCCUR0" };
							}
							i2b2.CRC.ctrlr.QT.panelControllers[i].doTiming(sValue);
						}					
					} 
					else if  (sValue == "TEMPORAL") 
					{
						if (i2b2.CRC.view.QT.isShowingTemporalQueryUI) return; // tdw9 1707c: nothing needs to be done. Already showing Temporal UI
						i2b2.CRC.ctrlr.QT.queryTiming = "TEMPORAL";
						// tdw9 1707c: bring out new temporal query UI when user selects Define Events...
						i2b2.CRC.view.QT.toggleTemporalQueryUI();
						/*
					$('defineTemporalBar').show();	
					for (var i=0; i<length; i++) {

						i2b2.CRC.ctrlr.QT.panelControllers[i].refTiming.set('disabled', false);					
						//i2b2.CRC.ctrlr.QT.panelControllers[i].refTiming.set("label", "Items Instance will be the same");

					}					
					//$('QPD1').style.background = '#D9ECF0';
					//$('queryPanelTitle1').innerHTML = 'Anchoring Observation';
						 */
					} else {
						i2b2.CRC.ctrlr.QT.queryTiming = "SAMEINSTANCENUM";
						for (var i=0; i<length; i++) {

							i2b2.CRC.ctrlr.QT.panelControllers[i].refTiming.set('disabled', false);					
							i2b2.CRC.ctrlr.QT.panelControllers[i].refTiming.set("label", sText);

							if (YAHOO.util.Dom.inDocument(i2b2.CRC.ctrlr.QT.panelControllers[i].refTiming.getMenu().element)) {

								i2b2.CRC.ctrlr.QT.panelControllers[i].refTiming.getMenu().clearContent();
								i2b2.CRC.ctrlr.QT.panelControllers[i].refTiming.getMenu().addItems([ 	 
									{ text: "Treat Independently", value: "ANY"}]);	
								i2b2.CRC.ctrlr.QT.panelControllers[i].refTiming.getMenu().addItems([ 	 
									{ text: "Occurs in Same Encounter", value: "SAMEVISIT" }]);	 
								i2b2.CRC.ctrlr.QT.panelControllers[i].refTiming.getMenu().addItems([ 												
									{ text: "Items Instance will be the same", value: "SAMEINSTANCENUM" }]);	 
								i2b2.CRC.ctrlr.QT.panelControllers[i].refTiming.getMenu().render();
							} else {
								i2b2.CRC.ctrlr.QT.panelControllers[i].refTiming.itemData =[{ text: "Treat Independently", value: "ANY"},
									{ text: "Occurs in Same Encounter", value: "SAMEVISIT"} ,
									{ text: "Items Instance will be the same", value: "SAMEINSTANCENUM"  }];
							}				


							i2b2.CRC.ctrlr.QT.panelControllers[i].doTiming(sValue);
						}

					}
					i2b2.CRC.view.QT.ResizeHeight();

				}); 

				//var qryButtonTiming = {};
				for (var i=0; i<3; i++) {

					var onSelectedMenuItemChange = function (event) { 
						var oMenuItem = event.newValue; 

						this.set("label", ("<em class=\"yui-button-label\">" +  
								oMenuItem.cfg.getProperty("text") + "</em>")); 

						if (event.newvalue != event.prevValue) {		
							var panelNumber = this.toString();
							panelNumber = panelNumber.substring( panelNumber.length-1, panelNumber.length-0);
							i2b2.CRC.ctrlr.QT.panelControllers[panelNumber-1].doTiming(oMenuItem.value);	
						}
						if (oMenuItem.value.substring(0,5) == "OCCUR") {
							this.setStyle('width', 130);
							$("qryButtonLimitB1").show();
							//$('qryPanelTiming Button').style.width = 120;
						} else {
							this.setStyle('width', 160);
							$("qryButtonLimitB1").hide();
							//$('qryPanelTiming Button').style.width = 160;
							//$(this._button.id).clientWidth = 160;
						}
					}; 

					//var panelControl = t.panelControllers[i];

					t.panelControllers[i].ctrlIndex = i;
					t.panelControllers[i].refTitle = $("queryPanelTitle"+(i+1));
					t.panelControllers[i].refButtonExclude = $("queryPanelExcludeB"+(i+1));
					t.panelControllers[i].refButtonDates = $("queryPanelDatesB"+(i+1));
					t.panelControllers[i].refButtonOccurs = $("queryPanelOccursB"+(i+1));
					t.panelControllers[i].refButtonOccursNum = $("QP"+(i+1)+"Occurs");
					t.panelControllers[i].refBalloon = $("queryBalloon"+(i+1));
					t.panelControllers[i].refDispContents = $("QPD"+(i+1));


					//t.panelControllers[i].refTiming = $("queryPanelTimingB"+(i+1));
					//t.panelControllers[i].refTiming = $("queryPanelTimingB"+(i+1));
					var qryButtonTiming =  new YAHOO.widget.Button("queryPanelTimingB"+(i+1), 
							{ type: "menu", menu: "menubutton1select", name:"querytiming" });
					//qryButtonTiming.set('disabled', true);
					qryButtonTiming.on("selectedMenuItemChange", onSelectedMenuItemChange); 
					qryButtonTiming.setStyle('width', 160);

					t.panelControllers[i].refTiming = qryButtonTiming;
					t.panelControllers[i].refTiming.set('disabled', true);				

					// create a instance of YUI Treeview
					if (!t.panelControllers[i].yuiTree) {
						t.panelControllers[i].yuiTree = new YAHOO.widget.TreeView("QPD"+(i+1));
						t.panelControllers[i].yuiTree.setDynamicLoad(t.panelControllers[i]._loadTreeDataForNode,1);
						// forward reference from DOM Node to tree obj
						$("QPD"+(i+1)).tree = t.panelControllers[i].yuiTree;
						// linkback on the treeview to allow it to find its PanelController
						t.panelControllers[i].refDispContents.linkbackPanelController = t.panelControllers[i];
					}
				}
				// display the panels
				t.doScrollFirst();
				t._redrawPanelCount();
				i2b2.CRC.ctrlr.QT.doShowFrom(0);
				i2b2.CRC.ctrlr.history.Refresh();
				//======================= </Initialization> =======================


				function qryPanelTimingClick(p_sType, p_aArgs) {

					var oEvent = p_aArgs[0],	//	DOM event

					oMenuItem = p_aArgs[1];	//	MenuItem instance that was the 
					//	target of the event

					if (oMenuItem) {
						YAHOO.log("[MenuItem Properties] text: " + 
								oMenuItem.cfg.getProperty("text") + ", value: " + 
								oMenuItem.value);
					}

					qryButtonTiming.set("label", qryButtonTiming.getMenu().activeItem.srcElement.text );


					//		i2b2.CRC.ctrlr.QT.panelControllers[0].doTiming(p_oItem.value);
					//		var sText = p_oItem.cfg.getProperty("text");
					//		oMenuPanelTiming1.set("label", sText);		

				}


				// attach the context controller to all panel controllers objects
				var op = i2b2.CRC.view.QT; // object path 
				i2b2.CRC.view.QT.ContextMenu = new YAHOO.widget.ContextMenu( 
						"divContextMenu-QT",  
						{ lazyload: true,
							trigger: [$('QPD1'), $('QPD2'), $('QPD3')],
							itemdata: [
								{ text: "Delete", 		onclick: { fn: op.ContextMenuRouter, obj: 'delete' } },
								{ text: "Lab Values", 	onclick: { fn: op.ContextMenuRouter, obj: 'labvalues' } }
								] }  
				); 

				i2b2.CRC.view.QT.ContextMenu.subscribe("triggerContextMenu", i2b2.CRC.view.QT.ContextMenuPreprocess); 
				i2b2.CRC.view.QT.ContextMenu.subscribe("beforeShow", i2b2.CRC.view.QT.ContextMenuPreprocess);

				// tdw9: create context menu for simple temporal query

				i2b2.CRC.view.TQuery.ContextMenuObj = new YAHOO.widget.ContextMenu( 
						"TemporalQueryContextMenuDiv",  
						{ 
							lazyload: true,
							trigger: [],//[$('temporalEvent_0_P0_content')],
							itemdata: []                                    // menu items are dynamically built when users right-clicks an item
						}  
				); 

				i2b2.CRC.view.TQuery.ContextMenuObj.subscribe("triggerContextMenu", i2b2.CRC.view.TQuery.ContextMenu.prepareContextMenu); 
				i2b2.CRC.view.TQuery.ContextMenuObj.subscribe("beforeShow", i2b2.CRC.view.TQuery.ContextMenu.prepareContextMenu);

				// tdw9: initialize QT Dialog
				/*
            jQuery( "#QTDialog" ).dialog({
                  modal: true,
                  autoOpen: false,
                  width: 400,
                  buttons: 
                  {
                    Ok: function() 
                    {
                      jQuery( this ).dialog( "close" );
                    }
                  }
                });
				 */

				i2b2.CRC.view.QT.splitterDragged();					// initialize query tool's elements
//				================================================================================================== //
			}
		})
);

//declare object for temporal query context menu 
i2b2.CRC.view.TQuery = {}
i2b2.CRC.view.TQuery.ContextMenu = {};
i2b2.CRC.view.TQuery.ContextMenu.clickedSDX     = false; // two globals to preserve click information so we can process them when user makes menuItem selection
i2b2.CRC.view.TQuery.ContextMenu.clickedPanel   = false;

i2b2.CRC.view.TQuery.ContextMenu.prepareContextMenu = function( p_oEvent )
{
	var currentNode = this.contextEventTarget; // the node that's clicked
	var clickPanel  = false;
	var doNotShow   = false;

	// this gets the i2b2_SDX we need to determine whether it is modifier/lab or neither
	var parentPanelDOM = jQuery(this.contextEventTarget).closest(".temporalPanel");
	clickPanel = jQuery(parentPanelDOM).data(i2b2.CRC.view.QT.TQryEvent.panelPrefix);

	if (!clickPanel) 
	{
		// something is missing, exit
		this.cancel();
		return;
	}

	if (currentNode.getAttribute("class") == "temporalPanelContentDiv") // user clickecd on the panel content node, not a concept
		doNotShow = true;
	var tvNode  = clickPanel.yuiTree.getNodeByProperty('nodeid', currentNode.parentElement.id);

	if (!tvNode)                                             doNotShow = true; // not a treenode
	else if (Object.isUndefined(tvNode.data.i2b2_SDX))       doNotShow = true; // no SDX data
	else if (tvNode.parent != clickPanel.yuiTree.getRoot())  doNotShow = true; // not root-level node

	if (p_oEvent == "triggerContextMenu")
	{
		if (doNotShow) 
		{
			this.cancel();
			return;
		}
	}
	else if ( p_oEvent == "beforeShow" )
	{
		if (doNotShow) 
		{ 
			i2b2.CRC.view.QT.ContextMenu.clearContent(); 
			return;
		}
		// rememebr the SDX and the panel information in global so we an access them when we process uers choice of menuItems
		i2b2.CRC.view.TQuery.ContextMenu.clickedSDX     = tvNode.data.i2b2_SDX;
		i2b2.CRC.view.TQuery.ContextMenu.clickedPanel   = clickPanel;
		// custom build the context menu according to the concept that was clicked
		var mil = [];
		mil.push( { text: "Set Date Constraint", onclick: { fn: i2b2.CRC.view.TQuery.handleContextMenuItemSelected, obj: 'dates'}, classname:"temporalQueryContextMenuItem" } );
		// all nodes can be deleted
		mil.push( { text: "Delete", onclick: { fn: i2b2.CRC.view.TQuery.handleContextMenuItemSelected, obj: 'delete'}, classname:"temporalQueryContextMenuItem"} );
		if (tvNode.data.i2b2_SDX.origData.isModifier) 
		{
			//Get the blob for this now.
			var cdetails = i2b2.ONT.ajax.GetModifierInfo("CRC:QueryTool", {modifier_applied_path:tvNode.data.i2b2_SDX.origData.applied_path, modifier_key_value:tvNode.data.i2b2_SDX.origData.key, ont_synonym_records: true, ont_hidden_records: true} );
			// this is what comes out of the old AJAX call
			if (isActiveXSupported) 
			{
				//Internet Explorer
				xmlDocRet = new ActiveXObject("Microsoft.XMLDOM");
				xmlDocRet.async = "false";
				xmlDocRet.loadXML(cdetails.msgResponse);
				xmlDocRet.setProperty("SelectionLanguage", "XPath");
				var c = i2b2.h.XPath(xmlDocRet, 'descendant::modifier');						
			} 
			else 
				var c = i2b2.h.XPath(cdetails.refXML, 'descendant::modifier');
			if (c.length > 0) 
				tvNode.data.i2b2_SDX.origData.xmlOrig = c[0];
			var lvMetaDatas1 = i2b2.h.XPath(tvNode.data.i2b2_SDX.origData.xmlOrig, 'metadataxml/ValueMetadata[string-length(Version)>0]');
			if (lvMetaDatas1.length > 0) 
				mil.push( { text: "Set Modifier Value", onclick: { fn: i2b2.CRC.view.TQuery.handleContextMenuItemSelected, obj: 'setmodifier' }, classname: "temporalQueryContextMenuItem"} );					
			var lvMetaDatas2 = i2b2.h.XPath(tvNode.data.i2b2_SDX.origData.parent.xmlOrig, 'metadataxml/ValueMetadata[string-length(Version)>0]');
			if (lvMetaDatas2.length > 0) 
				mil.push( { text: "Set Value...", onclick: { fn: i2b2.CRC.view.TQuery.handleContextMenuItemSelected, obj: 'labvalues' }, classname: "temporalQueryContextMenuItem"} );
		} 
		else 
		{
			// For lab tests...
			if (!Object.isUndefined(tvNode.data.i2b2_SDX.origData.key)) 
			{
				var cdetails = i2b2.ONT.ajax.GetTermInfo("CRC:QueryTool", {concept_key_value:tvNode.data.i2b2_SDX.origData.key, ont_synonym_records: true, ont_hidden_records: true} );
				try { new ActiveXObject ("MSXML2.DOMDocument.6.0"); isActiveXSupported =  true; } catch (e) { isActiveXSupported =  false; }			
				if (isActiveXSupported) 
				{
					//Internet Explorer
					xmlDocRet = new ActiveXObject("Microsoft.XMLDOM");
					xmlDocRet.async = "false";
					xmlDocRet.loadXML(cdetails.msgResponse);
					xmlDocRet.setProperty("SelectionLanguage", "XPath");
					var c = i2b2.h.XPath(xmlDocRet, 'descendant::concept');
				} 
				else 
					var c = i2b2.h.XPath(cdetails.refXML, 'descendant::concept');
				if (c.length > 0) 
					tvNode.data.i2b2_SDX.origData.xmlOrig = c[0];
			}
			var lvMetaDatas = i2b2.h.XPath(tvNode.data.i2b2_SDX.origData.xmlOrig, 'metadataxml/ValueMetadata[string-length(Version)>0]');
			if (lvMetaDatas.length > 0) {
				mil.push( { text: "Set Value...", onclick: { fn: i2b2.CRC.view.TQuery.handleContextMenuItemSelected, obj: 'labvalues' }, classname: "temporalQueryContextMenuItem"} );
			}
		}
		i2b2.CRC.view.TQuery.ContextMenuObj.clearContent();
		i2b2.CRC.view.TQuery.ContextMenuObj.addItems(mil);
		i2b2.CRC.view.TQuery.ContextMenuObj.render();
	}
};

i2b2.CRC.view.TQuery.handleContextMenuItemSelected = function( a, b, actionName )
{
	//alert("context item selected: " + actionName );
	if ( actionName == "delete" )
		i2b2.CRC.view.TQuery.ContextMenu.clickedPanel.performDeleteConcept( i2b2.CRC.view.TQuery.ContextMenu.clickedSDX.renderData.htmlID, i2b2.CRC.view.TQuery.ContextMenu.clickedSDX.sdxConcept.itemNumber );
	else if ( actionName == "dates")
		i2b2.CRC.view.TQuery.ContextMenu.clickedPanel.performChangeConceptDate( i2b2.CRC.view.TQuery.ContextMenu.clickedSDX.renderData.htmlID, i2b2.CRC.view.TQuery.ContextMenu.clickedSDX.sdxConcept.itemNumber );
	else if ( actionName == "labvalues")
		i2b2.CRC.view.TQuery.ContextMenu.clickedPanel.performChangeLabValue( i2b2.CRC.view.TQuery.ContextMenu.clickedSDX.sdxConcept );
	else if ( actionName == "setmodifier")
		i2b2.CRC.view.TQuery.ContextMenu.clickedPanel.performChangeModValue( i2b2.CRC.view.TQuery.ContextMenu.clickedSDX.sdxConcept );
	else
		alert("Unknown selection '"+ actionName + "' from context menu.");
};

//QueryTool Helper Balloons
//================================================================================================== //
i2b2.CRC.view.QT.hballoon = {
		canShowQueryBalloons: true,
		delayQueryBalloons: false,
		hideBalloons: function() {
			var thisObj = i2b2.CRC.view.QT.hballoon;
			thisObj.canShowQueryBalloons = false;
			clearTimeout(thisObj.delayQueryBalloons);
			$('queryBalloonBox').hide();
			YAHOO.util.Event.removeListener(document, "mousemove", thisObj.showBalloons);
			YAHOO.util.Event.addListener(document, "mousemove", thisObj.showBalloons);
		},
		showBalloons: function(e) {
			var thisObj = i2b2.CRC.view.QT.hballoon;
			var x = YAHOO.util.Event.getPageX(e);
			var y = YAHOO.util.Event.getPageY(e);
			var elX = parseInt($('crcQueryToolBox').style.left);
			if (isNaN(elX)) {elX = 241;}
			var elY = $('crcQueryToolBox').getHeight();
			if (isNaN(elY)) {elY = 280;}
			elY = elY + 76 - 135;
			if ( (x < elX-5) || (x > elX+524+5) || (y < elY-15) || (y > elY+110) ) {
				if (!thisObj.canShowQueryBalloons) {
					thisObj.canShowQueryBalloons = true;
					thisObj.delayQueryBalloons = setTimeout("i2b2.CRC.view.QT.hballoon._showQueryBalloons()",200);
				}
			} else {
				thisObj.canShowQueryBalloons = false;
				clearTimeout(thisObj.delayQueryBalloons);
			}
		},
		_showQueryBalloons: function() {
			var thisObj = i2b2.CRC.view.QT.hballoon;
			if (thisObj.canShowQueryBalloons) {
				$('queryBalloonBox').show();
				YAHOO.util.Event.removeListener(document, "mousemove", thisObj.showBalloons);
			}
		}
};

//================================================================================================== //
i2b2.events.initView.subscribe((function(eventTypeName, newMode) {
//	-------------------------------------------------------
	this.visible = true;
	$('crcQueryToolBox').show();
	this.Resize();

	// initialize the dropdown menu for query timing
	var temporalConstraintBar 	= $("temporalConstraintBar");
	var temporalConstraintLabel = $("temporalConstraintLabel");
	var queryTimingButton		= $("queryTiming-button");
	//temporalConstraintDiv.style.width 	= Math.max( parseInt(temporalConstraintBar.style.width) - parseInt(temporalConstraintLabel.style.width)-2, 0) + "px"; //tdw9 1707c: remove width for compact left-floating div to work
	queryTimingButton.style.width 		= Math.max( parseInt(temporalConstraintBar.style.width) - parseInt(temporalConstraintLabel.style.width)-6, 0) + "px";

	// -------------------------------------------------------
}),'',i2b2.CRC.view.QT);


//================================================================================================== //
i2b2.events.changedViewMode.subscribe((function(eventTypeName, newMode) {
//	-------------------------------------------------------
	newMode = newMode[0];
	this.viewMode = newMode;
	switch(newMode) {
	case "Patients":
		this.visible = true;
		$('crcQueryToolBox').show();
		i2b2.CRC.view.QT.splitterDragged();
		//this.Resize();
		break;
	default:
		this.visible = false;
	$('crcQueryToolBox').hide();
	break;
	}
//	-------------------------------------------------------
}),'', i2b2.CRC.view.QT);


//================================================================================================== //
i2b2.events.changedZoomWindows.subscribe((function(eventTypeName, zoomMsg) {
	newMode = zoomMsg[0];
	if (!newMode.action) { return; }
	if (newMode.action == "ADD") {
		switch (newMode.window) {
		case "QT":
			this.isZoomed = true;
			this.visible = true;
			break;
		}
	} else {
		switch (newMode.window) {
		case "QT":
			this.isZoomed = false;
			this.visible = true;
		}
	}
	this.ResizeHeight();
}),'',i2b2.CRC.view.QT);


console.timeEnd('execute time');
console.groupEnd();
