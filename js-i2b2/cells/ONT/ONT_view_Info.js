/**
 * @projectDescription	View controller for ONT's "Info" tab.
 * @inherits 	i2b2.ONT.view
 * @namespace	i2b2.ONT.view.info
 * @author		Nich Wattanasin
 * @version 	1.0
 * ----------------------------------------------------------------------------------------
 * updated 12-12-18: Launch [Nich Wattanasin]
 */
console.group('Load & Execute component file: ONT > view > Find');
console.time('execute time');


// create and save the view object
i2b2.ONT.view.info = new i2b2Base_cellViewController(i2b2.ONT, 'info');
i2b2.ONT.view.info.visible = false;
i2b2.ONT.view.info.modifier = false;
i2b2.ONT.view.info.currentSdxData = '';
i2b2.ONT.view.info.currentKey = '';
this.currentTab = 'names';


// redefine the option functions
// ================================================================================================== //
i2b2.ONT.view.info.showOptions = function(subScreen) {
	if (!this.modalOptions) {
		var handleSubmit = function() {
			this.cancel();
		}
		var handleCancel = function() {
			this.cancel();
		}
		this.modalOptions = new YAHOO.widget.SimpleDialog("optionsOntInfo",
		{ width : "400px", 
			fixedcenter : true,
			constraintoviewport : true,
			modal: true,
			zindex: 700,
			buttons : [ { text:"OK", handler:handleSubmit, isDefault:true }, 
				    { text:"Cancel", handler:handleCancel } ] 
		} ); 
		$('optionsOntInfo').show();
		this.modalOptions.render(document.body);
	}
	this.modalOptions.show();
	// load settings from html
	//i2b2.ONT.view['info'].params.max = parseInt($('ONTFINDMaxQryDisp').value,10);
	//i2b2.ONT.view['info'].params.synonyms = $('ONTFINDshowSynonyms').checked;
	//i2b2.ONT.view['info'].params.hiddens = $('ONTFINDshowHiddens').checked;

	//$('ONTFINDMaxQryDisp').value = this.params.max;
	//$('ONTFINDshowSynonyms').checked = parseBoolean(this.params.synonyms);
	//$('ONTFINDshowHiddens').checked = parseBoolean(this.params.hiddens);			
}


// ================================================================================================== //
i2b2.ONT.view.info.showView = function() {
	$('tabInfo').addClassName('active');
	$('ontInfoDisp').style.display = 'block';
	this.showInfoByKey();
}

// ================================================================================================== //
i2b2.ONT.view.info.hideView = function() {
	$('tabInfo').removeClassName('active');
	$('ontInfoDisp').style.display = 'none';
}

// ================================================================================================== //
i2b2.ONT.view.info.selectSubTab = function(tabCode) {
	// toggle between the Navigate and Find Terms tabs
	switch (tabCode) {
		case "names":
			this.currentTab = 'names';
			$('ontFindTabName').blur();
			$('ontFindTabName').className = 'findSubTabSelected';
			$('ontFindTabCode').className = 'findSubTab';
			$('ontFindFrameName').show();
			$('ontFindFrameCode').hide();
			$('ontSearchNamesResults').show();
			$('ontSearchCodesResults').hide();
		break;
		case "codes":
			this.currentTab = 'codes';
			$('ontFindTabCode').blur();
			$('ontFindTabName').className = 'findSubTab';
			$('ontFindTabCode').className = 'findSubTabSelected';
			$('ontFindFrameModifier').hide();
			//$('ontSearchModifiersResults').hide();			
			$('ontFindFrameName').hide();
			$('ontFindFrameCode').show();
			$('ontSearchNamesResults').hide();
			$('ontSearchCodesResults').show();
		break;
	}
}

// ================================================================================================== //
i2b2.ONT.view.info.PopulateCategories = function() {		
	// insert the categories option list
	var tns = $('ontFindCategory');
	// clear the list first
	while( tns.hasChildNodes() ) { tns.removeChild( tns.lastChild ); }
	// add the default option
	//Load from HTML
	i2b2.ONT.view['info'].params.max = parseInt($('ONTFINDMaxQryDisp').value,10);
	i2b2.ONT.view['info'].params.synonyms = $('ONTFINDshowSynonyms').checked;
	i2b2.ONT.view['info'].params.hiddens = $('ONTFINDshowHiddens').checked;

	var tno = document.createElement('OPTION');
	tno.setAttribute('value', '[[[ALL]]]');
	var tnt = document.createTextNode('Any Category');
	tno.appendChild(tnt);
	tns.appendChild(tno);		
	// populate the Categories from the data model
	for (var i=0; i<i2b2.ONT.model.Categories.length; i++) {
		var cat = i2b2.ONT.model.Categories[i];
		// ONT options dropdown
		//var cid = cat.key;
		//cid = /\\\\\w*\\/.exec(cid);
		//cid = cid[0].replace(/\\/g,'');
		var cid = cat.key.substring(2,cat.key.indexOf('\\',3))
		tno = document.createElement('OPTION');
		tno.setAttribute('value', cid);
		var tnt = document.createTextNode(cat.name);
		tno.appendChild(tnt);
		tns.appendChild(tno);
	}
}

// ================================================================================================== //
i2b2.ONT.view.info.PopulateSchemes = function() {
	// insert the Codings option list
	var tns = $('ontFindCoding');
	// clear the list first
	while( tns.hasChildNodes() ) { tns.removeChild( tns.lastChild ); }
	// add the default option
	var tno = document.createElement('OPTION');
	tno.setAttribute('value', '');
	var tnt = document.createTextNode('Select a Coding System');
	tno.appendChild(tnt);
	tns.appendChild(tno);		
	// populate the Codings from the data model
	for (var i=0; i<i2b2.ONT.model.Schemes.length; i++) {
		var sc = i2b2.ONT.model.Schemes[i];
		// ONT scheme (codes) dropdown
		tno = document.createElement('OPTION');
		tno.setAttribute('value', sc.key);
		var tnt = document.createTextNode(sc.name);
		tno.appendChild(tnt);
		tns.appendChild(tno);
	}
}

// ================================================================================================== //
i2b2.ONT.view.info.Resize = function(e) {
	// this function provides the resize functionality needed for this screen
	var viewObj = i2b2.ONT.view.info;
	//var ds = document.viewport.getDimensions();
    var w =  window.innerWidth || (window.document.documentElement.clientWidth || window.document.body.clientWidth);
    var h =  window.innerHeight || (window.document.documentElement.clientHeight || window.document.body.clientHeight);
	if (w < 840) {w = 840;}
	if (h < 517) {h = 517;}
	switch(i2b2.hive.MasterView.getViewMode()) {
		case "Patients":
			var ve = $('ontInfoDisp').style;
			if (i2b2.WORK && i2b2.WORK.isLoaded) {
				var z = parseInt((h - 321)/2) + 8;
				ve.height = z;
			} else {
				ve.height = h-297;
			}
			break;
		case "Analysis":
			var ve = $('ontNavDisp').style;
			if (i2b2.WORK && i2b2.WORK.isLoaded) {
				var z = parseInt((h - 321)/2) + 8;
				ve.height = z;
			} else {
				ve.height = h-297;
			}
			break;
		default:
			break;
	}
	if (i2b2.ONT.view.main.isZoomed) { ve.height = h-101; }

}

// ================================================================================================== //
//console.info("SUBSCRIBED TO [window.resize]"); // tdw9
YAHOO.util.Event.addListener(window, "resize", i2b2.ONT.view.info.Resize, i2b2); // tdw9


//================================================================================================== //
i2b2.ONT.view.info.ResizeHeight = function() {
	// this function provides the resize functionality needed for this screen
	var viewObj = i2b2.ONT.view.info;
	//var ds = document.viewport.getDimensions();
    var h =  window.innerHeight || (window.document.documentElement.clientHeight || window.document.body.clientHeight);
	if (h < 517) {h = 517;}
	switch(i2b2.hive.MasterView.getViewMode()) {
		case "Patients":
			var ve = $('ontInfoDisp').style;
			if (i2b2.WORK && i2b2.WORK.isLoaded) {
				var z = parseInt((h - 321)/2) + 8;
				ve.height = z;
			} else {
				ve.height = h-297;
			}
			break;
		case "Analysis":
			var ve = $('ontInfoDisp').style;
			if (i2b2.WORK && i2b2.WORK.isLoaded) {
				var z = parseInt((h - 321)/2) + 8;
				ve.height = z;
			} else {
				ve.height = h-297;
			}
			break;
		default:
			break;
	}
	if (i2b2.ONT.view.main.isZoomed) { ve.height = h-101; }
}



//================================================================================================== //
i2b2.ONT.view.info.setChecked = function(here) {
	//var oCheckedItem = here.parent.checkedItem;
    if (here.cfg.getProperty("checked")) {//(oCheckedItem != here) {
          here.cfg.setProperty("checked", false);
         // here.parent.checkedItem = here;
    } else {
		   here.cfg.setProperty("checked", true);
	}
}

//================================================================================================== //
i2b2.ONT.view.info.doPatientCount = function() { 
	i2b2.ONT.view.info.setChecked(this);
	i2b2.ONT.view['info'].params.patientCount = this.cfg.getProperty("checked");
}

//================================================================================================== //
i2b2.ONT.view.info.useShortTooltip = function() { 
	i2b2.ONT.view.info.setChecked(this);
	i2b2.ONT.view['info'].params.shortTooltip = this.cfg.getProperty("checked");	
}

//================================================================================================== //
i2b2.ONT.view.info.showConceptCode = function() { 
	i2b2.ONT.view.info.setChecked(this);
	i2b2.ONT.view['info'].params.showConceptCode = this.cfg.getProperty("checked");
}

//================================================================================================== //
i2b2.ONT.view.info.getIcon = function(hasChildren){
	var term_icon = 'sdx_ONT_CONCPT_leaf.gif';	
	if (hasChildren.substring(1,0) === "C"){
		term_icon = 'sdx_ONT_CONCPT_root.gif';
	} else if (hasChildren.substring(1,0) === "F")  {
		term_icon = 'sdx_ONT_CONCPT_branch.gif';
	} else if (hasChildren.substring(1,0) === "O")  {
		term_icon = 'sdx_ONT_CONCPT_root.gif';
	} else if (hasChildren.substring(1,0) === "D") {
		term_icon = 'sdx_ONT_CONCPT_branch.gif';
	} else {
		term_icon = 'sdx_ONT_CONCPT_leaf.gif';
	}
	return term_icon;
}

//   \\i2b2_LABS\i2b2\Labtests\LAB\(LLB16) Chemistry\(LLB31) Anemia Related Studies\FE\LOINC:2498-4\

i2b2.ONT.view.info.getParentKey = function(path){
	var p = path.split('\\');
	var parent_path = '';
	if(p.length > 5){
		for(i=0;i<p.length-2;i++){
			parent_path += p[i] + '\\';
		}		
	}
	return parent_path;
}

//================================================================================================== //
i2b2.ONT.view.info.showValueDialog = function(key) {
	var extData = i2b2.ONT.view.info.currentSdxData;
	var mdnodes = i2b2.h.XPath(extData.origData.xmlOrig, 'descendant::metadataxml/ValueMetadata[Version]');
		
	if (mdnodes.length > 0) {
		var dataType = i2b2.h.getXNodeVal(mdnodes[0], 'DataType');
		if(dataType)
			var valueType = i2b2.CRC.view.modLabvaluesCtlr.getValueType(dataType);
		else
			var valueType = "NODATATYPE";
	} else {
		// no LabValue configuration
		return false;
	}
		
	// notify the value type's controller class to activate
	try {
		if(valueType){
			var GeneralValueType = valueType;
			i2b2.CRC.view[GeneralValueType].showDialog(0, null, key, extData, false, null);
		}
		else
			alert('An error has occurred while trying to determine the value type.');
	} catch(e) {
		alert('An error has occurred while trying to initialize the Valuebox.');
	}
	//i2b2.CRC.view['NUMBER'].showDialog(0, null, '\\\\i2b2_LABS\\i2b2\\Labtests\\LAB\\(LLB16) Chemistry\\(LLB31) Anemia Related Studies\\', i2b2.ONT.view.info.currentSdxData, false,null);

}

//================================================================================================== //
i2b2.ONT.view.info.showInfoByKey = function(key) {
	 
	// if you specify a key, make it the current key and bring this tab to the front, otherwise use a previously set key and assume we're already at the front
	if(!key) key = i2b2.ONT.view.info.currentKey;
		else {
			i2b2.ONT.view.info.currentKey = key;
			$('tabInfo').click();
			return;
		}
	if (key=="") return;
	
	i2b2.ONT.view.info.currentSdxData = '';
	var t = i2b2.ONT.view.nav.params;
	if($('ontMainBox').style.display == "none"){
		i2b2.ONT.view.main.ZoomView();
	}

	
	var term = i2b2.ONT.ajax.GetTermInfo("ONT", {ont_max_records:'max="1"', ont_synonym_records:'false', ont_hidden_records: 'false', concept_key_value: key}).parse();
	if(term.model.length > 0){
		var sdxData = term.model[0];
		sdxData.renderData = {
			htmlID : 'temp'
		};
		i2b2.ONT.view.info.currentSdxData = sdxData;
		// get all the variables of the concept
		//var table_name = results.model[0].origData.table_name;
		var term_name = sdxData.origData.name;
		var term_tooltip = sdxData.origData.tooltip;
		var term_key = sdxData.origData.key;
		var term_dimcode = sdxData.origData.dim_code;
		var term_icon = i2b2.ONT.view.info.getIcon(sdxData.origData.hasChildren);
		var term_parent_key = i2b2.ONT.view.info.getParentKey(sdxData.origData.key);
		var term_metadataxml = i2b2.h.XPath(sdxData.origData.xmlOrig, 'metadataxml/ValueMetadata[string-length(Version)>0]');
	        var term_table = sdxData.origData.table_name;

		//var term_description = 'This term is a {non-draggable} {folder} which {can} be used in a query. The term {represents the code of 125.125 and} {could have} children below it.';
		var term_description = 'This term is a ';
		if(sdxData.origData.hasChildren.substring(1,0) === "C"){
			term_description += 'non-draggable ';
		} else {
			term_description += 'draggable ';
		}
		if (sdxData.origData.hasChildren.substring(1,0) === "C" || sdxData.origData.hasChildren.substring(1,0) === "F" || sdxData.origData.hasChildren.substring(1,0) === "O" || sdxData.origData.hasChildren.substring(1,0) === "D"){
			term_description += 'folder ';
		} else {
			term_description += 'leaf node ';
		}
		term_description += 'which ';
		if(sdxData.origData.hasChildren.substring(1,0) === "C"){
			term_description += 'cannot ';
		} else {
			term_description += 'can ';
		}
		term_description += 'be used in a query. The term ';
		if(typeof sdxData.origData.basecode !== "undefined"){
			term_description += 'represents the code of ' + sdxData.origData.basecode + ' and ';
		}
		if (sdxData.origData.hasChildren.substring(1,0) === "C" || sdxData.origData.hasChildren.substring(1,0) === "F" || sdxData.origData.hasChildren.substring(1,0) === "O" || sdxData.origData.hasChildren.substring(1,0) === "D"){
			term_description += 'may ';
		} else {
			term_description += 'does not ';
		}
		term_description += 'have children below it.';
		
		// display
		/*$('ontInfoName').innerHTML = '<img src="js-i2b2/cells/ONT/assets/'+term_icon+'" align="absbottom"> ' + term_name;
		$('ontInfoName').setAttribute("onmouseover","i2b2.sdx.TypeControllers.CONCPT.AttachDrag2Data('ontInfoName','ontInfoDisp')");*/
		var o = new Object;
				o.name = term_name;
				o.tooltip = term_name;
				o.hasChildren = 'L';
				o.key = '\\\\'; // Note, some value required by SDX

				var sdxDataNode = i2b2.sdx.Master.EncapsulateData('CONCPT',o);
				var renderOptions = {
					title: o.name,
					dragdrop: "i2b2.sdx.TypeControllers.CONCPT.AttachDrag2Data",
					showchildren: true,
					icon: {
						branch: "sdx_ONT_SEARCH_branch.gif",
						branchExp: "sdx_ONT_SEARCH_branch.gif",
						leaf: "sdx_ONT_CONCPT_leaf.gif"
					}
				};				
				var sdxRenderData = i2b2.sdx.Master.RenderHTML("ontInfoName", sdxDataNode, renderOptions);
				$('ontInfoName').innerHTML=sdxRenderData.renderData.html;
				//jgk - for dragging the term from the info panel, doesn't quite work
		
		
		$('ontInfoTooltip').innerHTML = term_tooltip;
		if(term_parent_key !== ''){
			var parent_key = term_parent_key.replace(/\\/g,'\\\\');
			$('ontInfoTooltip').innerHTML += ' - <a href="#" style="color:green" onclick="i2b2.ONT.view.info.showInfoByKey(\''+parent_key+'\')">Go Up</a>';
		}
		$('ontInfoKey').innerHTML = term_key;
		if (term_metadataxml.length > 0) {
			$('ontMetadataXml').innerHTML = 'This term accepts values to be set when using the term in a query. <a href="#" style="color:green" onclick="i2b2.ONT.view.info.showValueDialog(\''+parent_key+'\')">Preview Value Box</a>';

		} else {
			$('ontMetadataXml').innerHTML = 'This term does not allow values to be set.';
		}
		if (sdxData.origData.operator.toLowerCase()=='like')
			$('ontInfoSQL').innerHTML = "SELECT * FROM concept_dimension WHERE concept_path LIKE '" + sdxData.origData.dim_code+ "%';";
	    else $('ontInfoSQL').innerHTML = "(n/a)";
	    //    var sql_term_dimcode = term_dimcode.replace(/\\/g,'\\\\');
	       
	    //  if(term_table.toLowerCase() == 'concept_dimension'){
		//    $('ontInfoSQL').innerHTML = "SELECT CONCEPT_PATH, CONCEPT_CD, NAME_CHAR FROM concept_dimension WHERE CONCEPT_PATH LIKE '" + sql_term_dimcode + "%';";

		//} else {
		//    $('ontInfoSQL').innerHTML = "No example is available";
		//}
		$('ontInfoDescription').innerHTML = term_description;
		
		// get children
		
		var options = {};
		options.ont_hidden_records = t.hiddens;
		options.ont_max_records = "max='"+t.max+"' ";
		options.ont_synonym_records = t.synonyms;
		options.ont_patient_count = t.patientCount;
		options.ont_short_tooltip = t.shortTooltip;
		options.ont_show_concept_code = t.showConceptCode;
		options.concept_key_value = key;
		if (t.modifiers == undefined || t.modifiers == false){
			options.version = i2b2.ClientVersion;	
		} else {
			options.version = "1.5";	
		}
		var response = i2b2.ONT.ajax.GetChildConcepts("ONT:SDX:Concept", options);
		response.parse();
		
		var basecodes = [];
		var childrenHTML = '<table cellpadding="0" cellspacing="0" style="font-size:11px;width:95%;margin-left:10px;"><tr><td style="background: #edf5ff;font-size: 11px;color: #333;">Name</td><td style="background: #edf5ff;font-size: 11px;color: #333;width:100px;">Code</td></tr>';
		for(i=0; i < response.model.length; i++){
			var child = response.model[i];
			var child_icon = i2b2.ONT.view.info.getIcon(child.origData.hasChildren);
			var child_key = child.origData.key.replace(/\\/g,'\\\\');
			childrenHTML += '<tr><td><img src="js-i2b2/cells/ONT/assets/'+child_icon+'" align="absbottom"> <a href="#" onclick="i2b2.ONT.view.info.showInfoByKey(\''+child_key+'\')">' + child.origData.name + '</a></td><td>';
			if(typeof child.origData.basecode !== "undefined"){
				childrenHTML += child.origData.basecode;
			}
			childrenHTML += '</td></tr>';
		}
		childrenHTML += '</table>';
		$('ontInfoChildren').innerHTML = childrenHTML;
		
	} else {
		$('ontInfoChildren').innerHTML = '<ul><li>This term has no children</li></ul>';
	}
	
}

//================================================================================================== //
i2b2.ONT.view.info.SetKey = function(key) { 

	i2b2.ONT.view.info.currentKey = decodeURI(key);
}

//================================================================================================== //
i2b2.ONT.view.info.doShowInfo = function(p_sType, p_aArgs, p_oValue) { 

	i2b2.ONT.view.info.showInfoByKey(p_oValue.origData.key);

	
	//window.open(p_oValue,'infoPrintWindow','width=800,height=750,menubar=yes,resizable=yes,scrollbars=yes');
}

//================================================================================================== //
i2b2.ONT.view.info.doRefreshAll = function() { 
	i2b2.ONT.view.info.PopulateCategories();
}

//================================================================================================== //
i2b2.ONT.view.info.doShowModifiers = function(e) { 
	var op = i2b2.ONT.view.info.contextRecord;	
	$('ontFindFrameModifierTitle').innerHTML = 'Find Modifiers for ' + op.sdxInfo.sdxDisplayName;
	i2b2.ONT.view.info.modifier = true;
	i2b2.ONT.view.info.Resize();
	i2b2.hive.MasterView.addZoomWindow("ONT");
//	i2b2.ONT.view.nav.PopulateCategories();
}

// ================================================================================================== //
i2b2.ONT.view.info.ContextMenuValidate = function(p_oEvent) {
	var clickId = null;
	var currentNode = this.contextEventTarget;
	while (!currentNode.id) {
		if (currentNode.parentNode) {
			currentNode = currentNode.parentNode;
		} else {
			// we have recursed up the tree to the window/document DOM... it's a bad click
			this.cancel();
			return;
		}
	}
	clickId = currentNode.id;
	
	var items = this.getItems();
	var addItem = { text: "Find Modifiers",	onclick: { fn: i2b2.ONT.view.info.doShowModifiers } };
	
	 if ($('ONTFINDdisableModifiers').checked) {
		if (items.length == 2 )
		{
				this.removeItem(1);
		}
	 } else if (items.length == 1) {
		 this.insertItem(addItem,1);
	 }
	// see if the ID maps back to a treenode with SDX data
	var tvNode = i2b2.ONT.view.info.yuiTreeName.getNodeByProperty('nodeid', clickId);
	
	if (tvNode == null) {
		tvNode = i2b2.ONT.view.info.yuiTreeCode.getNodeByProperty('nodeid', clickId);
	}

	if (tvNode) {
		if (tvNode.data.i2b2_SDX) {
			if (tvNode.data.i2b2_SDX.sdxInfo.sdxType == "CONCPT") {
				i2b2.ONT.view.info.contextRecord = tvNode.data.i2b2_SDX;
			} else {
				this.cancel();
				return;
			}
		}
	}
};

//================================================================================================== //
/*i2b2.ONT.view.info.ContextMenu = new YAHOO.widget.ContextMenu( 
		"divContextMenu-Find",  
			{ lazyload: true,
			trigger: $('ontFindDisp'), 
			itemdata: [
				{ text: "Refresh All",	onclick: { fn: i2b2.ONT.view.info.doRefreshAll } },
				{ text: "Find Modifiers",	onclick: { fn: i2b2.ONT.view.info.doShowModifiers } }
		] }  
);
i2b2.ONT.view.info.ContextMenu.subscribe("triggerContextMenu",i2b2.ONT.view.info.ContextMenuValidate); */
//================================================================================================== //

// This is done once the entire cell has been loaded
// ================================================================================================== //
console.info("SUBSCRIBED TO i2b2.events.afterCellInit");
i2b2.events.afterCellInit.subscribe(
	(function(en,co) {
		if (co[0].cellCode=='ONT') {
// ===================================================================
			var thisview = i2b2.ONT.view.info;
			
			// register the treeview with the SDX subsystem to be a container for CONCPT objects
			i2b2.sdx.Master.AttachType("ontInfoName","CONCPT");
			
			// perform visual actions
			thisview.Resize();

// ===================================================================
		}
	})
);

//================================================================================================== //
i2b2.events.initView.subscribe((function(eventTypeName, newMode) {
// -------------------------------------------------------
	newMode = newMode[0];
	this.viewMode = newMode;
	this.visible = true;
	this.Resize();
// -------------------------------------------------------
}),'',i2b2.ONT.view.info);


i2b2.events.changedViewMode.subscribe((function(eventTypeName, newMode) {
// -------------------------------------------------------
	newMode = newMode[0];
	this.viewMode = newMode;
	switch(newMode) {
		case "Patients":
		case "Analysis":
			var wlst = i2b2.hive.MasterView.getZoomWindows();
			if (wlst.indexOf("HISTORY")!=-1 || wlst.indexOf("WORK")!=-1) { return; }
			this.visible = true;
			this.Resize();
			break;
		default:
			this.visible = false;
			break;
	}
// -------------------------------------------------------
}),'',i2b2.ONT.view.info);


// ================================================================================================== //
i2b2.events.changedZoomWindows.subscribe((function(eventTypeName, zoomMsg) {
// -------------------------------------------------------
	newMode = zoomMsg[0];
	switch (newMode.window) {
		case "ONT":
		case "HISTORY":
		case "WORK":
			this.ResizeHeight();
			//this.Resize(); //tdw9
	}
// -------------------------------------------------------
}),'',i2b2.ONT.view.info);


console.timeEnd('execute time');
console.groupEnd();
