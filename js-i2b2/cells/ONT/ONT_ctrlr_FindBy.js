/**
 * @projectDescription	Event controller for functionality in the "Find By" sub-tab.
 * @inherits 	i2b2.ONT.ctrlr
 * @namespace	i2b2.ONT.ctrlr.FindBy
 * @author		Nick Benik, Griffin Weber MD PhD
 * @version 	1.7.12
 * ----------------------------------------------------------------------------------------
 * updated 9-15-08: RC4 launch [Nick Benik] 
 * updated 01-12-18: Mauro Bucalo
 * hierarchical result display 08-19 by Jeff Klann, PhD
 */
console.group('Load & Execute component file: ONT > ctrlr > FindBy');
console.time('execute time');


i2b2.ONT.ctrlr.FindBy = {
	queryNewName: false,
	treeNameYui: false,
	treeCodeYui: false,

// ================================================================================================== //
	clickSearchName: function() {
		var f = $('ontFormFindName');
		var search_info = {};
		search_info.SearchStr = f.ontFindNameMatch.value;
		if (search_info.SearchStr.length < 3) {
			alert("Search string must be at least 3 characters.");
		} else {
		search_info.Category = f.ontFindCategory.options[f.ontFindCategory.selectedIndex].value;
		search_info.Strategy = f.ontFindStrategy.options[f.ontFindStrategy.selectedIndex].value;
		
		treeObj = i2b2.ONT.view.find.yuiTreeName;
		 treeObj.removeChildren(treeObj.getRoot());
		treeObj.setDynamicLoad(i2b2.sdx.Master.LoadChildrenFromTreeview,1);
		treeObj.draw();
		i2b2.ONT.ctrlr.FindBy.ButtonOn();
		setTimeout(function(){i2b2.ONT.ctrlr.FindBy.doNameSearch(search_info);},0);
	
		//i2b2.ONT.ctrlr.FindBy.doNameSearch(search_info);
		}
	},

	ButtonOn: function() {
				document.getElementById('ontFindNameButtonWorking').style.display = 'block';
	},
// ================================================================================================== //
	doNameSearch: function(inSearchData) {
		// inSearchData is expected to have the following attributes:
		//   SearchStr:  what is being searched for
		//   Category: what category is being searched.  Blank for all
		//   Strategy: what matching strategy should be used

		// Debug: add time check
		var mytime = new Date().getTime();
			
		// VERIFY that the above information has been passed		
		var f = false;
		if (Object.isUndefined(inSearchData)) return false;
		if (Object.isUndefined(inSearchData.SearchStr)) {
			alert('Please enter a search term.');
			return false;
		}
		if (Object.isUndefined(inSearchData.Category)) { inSearchData.Category=''; }
		if (Object.isUndefined(inSearchData.Strategy)) { 
			console.error('Matching Strategy has not been set');
			return false;
		}
		var s = inSearchData.Strategy;
		switch(s) {
			case "contains":	break;
			case "exact":		break;
			case "left":		break;
			case "right":		break;
			default:
				s = 'contains';
		}
		inSearchData.Strategy = s;

		// special client processing to search all categories
		var searchCats = [];
		if (inSearchData.Category == "[[[ALL]]]") {
			var d = i2b2.ONT.model.Categories;
			var l = d.length
			// build list of all categories to search 
			for (var i=0; i<l; i++) {
				var cid = d[i].key;
				cid = cid.substring(2);
				cid = cid.substring(0,cid.indexOf("\\"));
				if (cid != null) {
					searchCats.push(cid);
				}
			}
		} else {
			// just a single category to search
			searchCats.push(inSearchData.Category);
		}
			
	//	var treeObj = i2b2.ONT.view['find'].yuiTreeName;
		//Clear out modifier is exists;
		//$('ontFindModifierMatch').innerHTML = "";
		 $('ontFormFindModifier').ontFindModifierMatch.value = "";
		i2b2.ONT.view.find.yuiTreeModifier.removeChildren(i2b2.ONT.view.find.yuiTreeModifier.getRoot());

		i2b2.ONT.view.find.yuiTreeModifier.draw();
		//Reset display
		i2b2.ONT.view.find.modifier = false;
		i2b2.ONT.view.find.Resize();
		
		 $('ontFindNameButtonWorking').innerHTML = "Searching...";
		var scopedCallback = new i2b2_scopedCallback();
		scopedCallback.scope = this;
		// define our callback function
		scopedCallback.callback = function(results)
		{
			// THIS function is used to process the AJAX results of the getChild call
			//		results data object contains the following attributes:
			//			refXML: xmlDomObject <--- for data processing
			//			msgRequest: xml (string)
			//			msgResponse: xml (string)
			//			error: boolean
			//			errorStatus: string [only with error=true]
			//			errorMsg: string [only with error=true]			

			//Create a new treeobject so it does not append 
			//treeObj = new YAHOO.widget.TreeView("ontSearchNamesResults");
			var treeObj = i2b2.ONT.view.find.yuiTreeName;
			// treeObj.removeChildren(treeObj.getRoot());
			//treeObj.setDynamicLoad(i2b2.sdx.Master.LoadChildrenFromTreeview,1);
			// register the treeview with the SDX subsystem to be a container for CONCPT objects
			i2b2.sdx.Master.AttachType("ontSearchNamesResults","CONCPT");
			
			var jsTreeObjPath = 'i2b2.ONT.view.find.yuiTreeName';
			var tmpNode;

			i2b2.ONT.ctrlr.FindBy.ButtonOn();
			// fire multiple AJAX calls
	
			
						//Determine if a error occured
			// <result_status>  <status type="ERROR">MAX_EXCEEDED</status>  </result_status> 
			var s = i2b2.h.XPath( results.refXML, 'descendant::result_status/status[@type="ERROR"]');
			if (s.length > 0) {
				// we have a proper error msg
				try {
					if (s[0].firstChild.nodeValue == "MAX_EXCEEDED")
						i2b2.h.nonmodalAlert("The number of terms that were returned for category " + results.msgParams.ont_category + " exceeded the maximum number currently set as " + i2b2.ONT.view['find'].params.max+ ".  Only the first " + i2b2.ONT.view['find'].params.max+ " results are displayed. Please try again with a more specific search or increase the maximum number of terms that can be returned as defined in the options screen.");
					else
						alert("ERROR: "+s[0].firstChild.nodeValue);	
					document.getElementById('ontFindNameButtonWorking').style.display = 'none';	
					$('ontFindNameButtonWorking').innerHTML = "";					
					//return;
				} catch (e) {
					alert("An unknown error has occured during your rest call attempt!");
				}
			} 
		
			higherNodes = { '.':treeObj.root }
			makeHigherNode = function(parent,key,lvl,fullkey) {
				var o = new Object;

				o.search_viz_attr = "T";

				o.name = key;
				o.tooltip = key;
				
				o.hasChildren = lvl==1 ? 'CA':'FA';
				o.level = lvl;
				o.key = fullkey; // Note, some value required by SDX

				var sdxDataNode = i2b2.sdx.Master.EncapsulateData('CONCPT',o);
				var renderOptions = {
					title: o.name,
					dragdrop: "i2b2.sdx.TypeControllers.CONCPT.AttachDrag2Data",
					click: "i2b2.ONT.view.info.SetKey('"+encodeURI(fullkey)+"')",
					showchildren: true,
					icon: {
						root: "sdx_ONT_SEARCH_root2.gif",
						rootExp: "sdx_ONT_SEARCH_root2.gif",
						branch: "sdx_ONT_SEARCH_branch.gif",
						branchExp: "sdx_ONT_SEARCH_branch.gif"
					}
				};
				
				parentNode = parent['.']
				
				var sdxRenderData = i2b2.sdx.Master.RenderHTML(treeObj.id, sdxDataNode, renderOptions);
				var tmpNode = i2b2.sdx.Master.AppendTreeNode(treeObj, parentNode, sdxRenderData);
				tmpNode.expand(); // Show children 
				treeObj.draw(); // If this isn't here, some nodes are undraggable at random due to YUI
				
				return { '.':tmpNode }
			}
			getHigherNodes = function(key_name,key) { 
				var keys = key.split("\\").slice(2,-1); // Skip the leading '\\', skip the final node
				var key_names = key_name.split("\\").slice(1,-1); // Skip the leading '\', skip the final node	
				var key_key_offset = keys.length - key_names.length; // Number of elements in key is different than key_name due to preamble
				var parent = higherNodes;
				for(var i2=0;i2<key_names.length-1;i2++) {
					var fullkey = key.substring(0,i2b2.h.nthIndex(key,'\\',i2+key_key_offset+3)+1); 
					var shortKeyname = key_names[i2];
					if(!(shortKeyname in parent)) parent[shortKeyname]=makeHigherNode(parent,shortKeyname,i2+1,fullkey);
					parent=parent[shortKeyname];
				}
				return parent;
			}
		
			// Render the tree view showing the relative levels of the nodes in the find results (jgk 0519)
			// TODO: If results are missing an hlevel (i.e. hlevel 3 and then hlevel 5), it might render the deeper hlevel as a root node
			// NOTE: Looks best with hlevel-sorted results (ONT cell 1.7.12)
			levelNodes = {}
			// Helper function, get category from table code
			getCatNameFromCode = function(code) {
				var d = i2b2.ONT.model.Categories;
				var l = d.length;
				for (var i=0; i<l; i++) {
					if(d[i].key.includes("\\"+code+"\\")) return d[i].name;
				}
				return code;
			}
			// Helper function, add hlevel nodes to the tree
			getLevelNode = function(hlevel) {
				if (hlevel in levelNodes) return levelNodes[hlevel]; // only add it once
				
				bAddRoot = !(hlevel-1 in levelNodes); // Name is category if its the root node
				ontCat = getCatNameFromCode(results.msgParams.ont_category);
				
				var o = new Object;
				if (bAddRoot) {
					o.name = ontCat;
					
					o.tooltip='Find results for '+ontCat;
				}
				else {
					o.name = 'More specific results....';//(Hierarchy level:'+hlevel+')';
					
					if (i2b2.ONT.view['find'].params.reduce) {
						o.tooltip = 'These '+ontCat+' results are more specific (deeper in the hierarchy) and not contained in any of the folders above. [Hierarchy level '+hlevel+']';
					} else {
						o.tooltip = 'These '+ontCat+' results are more specific (deeper in the hierarchy). [Hierarchy level '+hlevel+']';
					}
				}
				o.hasChildren = 'CA';
				o.level = hlevel;
				o.key = '\\'; // dummy: required by SDX

				var sdxDataNode = i2b2.sdx.Master.EncapsulateData('CONCPT',o);
				var renderOptions = {
					title: o.name,
					showchildren: true,
					icon: {
						root: "sdx_ONT_SEARCH_root.png",
						rootExp: "sdx_ONT_SEARCH_root.png"
					}
				};
				
				if (!bAddRoot) {parentNode = levelNodes[hlevel-1];} else {parentNode=treeObj.root;}
				 // add to appropriate level
				var sdxRenderData = i2b2.sdx.Master.RenderHTML(treeObj.id, sdxDataNode, renderOptions);
				var tmpNode = i2b2.sdx.Master.AppendTreeNode(treeObj, parentNode, sdxRenderData);
				tmpNode.expand(); // Show children
				levelNodes[hlevel]= tmpNode;
			
				return tmpNode;
			}

			// display the results
			var c = results.refXML.getElementsByTagName('concept');
			totalCount = totalCount + c.length;
			var oset = [];
			for(var i2=0; i2<1*c.length; i2++) {

				var o = new Object;
				o.xmlOrig = c[i2];
				o.name = /*'['+i2b2.h.getXNodeVal(c[i2],'level')+'] ' +*/ i2b2.h.getXNodeVal(c[i2],'name');
				o.hasChildren =  i2b2.h.getXNodeVal(c[i2],'visualattributes');
				if (i2b2.h.getXNodeVal(c[i2],'key_name')) o.search_viz_attr = "N"; // Display as a result node in the search results
				if (o.hasChildren != undefined && o.hasChildren.length > 1)
				{
					o.hasChildren = o.hasChildren.substring(0,2)
				}
				o.level = i2b2.h.getXNodeVal(c[i2],'level');
				o.key = i2b2.h.getXNodeVal(c[i2],'key');
				o.tooltip = i2b2.h.getXNodeVal(c[i2],'tooltip');
				o.icd9 = '';
				o.table_name = i2b2.h.getXNodeVal(c[i2],'tablename');
				o.column_name = i2b2.h.getXNodeVal(c[i2],'columnname');
				o.operator = i2b2.h.getXNodeVal(c[i2],'operator');
				o.dim_code = i2b2.h.getXNodeVal(c[i2],'dimcode');
				o.basecode = i2b2.h.getXNodeVal(c[i2],'basecode');
				o.total_num = i2b2.h.getXNodeVal(c[i2],'totalnum');
				oset.push(o);
			}
			//oset.sort(function(a,b) {return (a.key > b.key) ? 1 : ((b.key > a.key) ? -1 : 0);} );
			for(var i2=0;i2<oset.length;i2++) {
				var o = oset[i2];
				// parent nodes
				if (i2b2.h.getXNodeVal(c[i2],'key_name')) // && i2b2.ONT.view['find'].params.hierarchy)
					var parentNode = getHigherNodes(i2b2.h.getXNodeVal(c[i2],'key_name'),i2b2.h.getXNodeVal(c[i2],'key'))['.'];
				else var parentNode = getLevelNode(i2b2.h.getXNodeVal(c[i2],'level'));
				
				// append the data node
				var sdxDataNode = i2b2.sdx.Master.EncapsulateData('CONCPT',o);
				var renderOptions = {
					title: o.name,
					dragdrop: "i2b2.sdx.TypeControllers.CONCPT.AttachDrag2Data",
					click: "i2b2.ONT.view.info.SetKey('"+encodeURI(o.key)+"')",
					showchildren: true,
					icon: {
						root: "sdx_ONT_CONCPT_root.gif",
						rootExp: "sdx_ONT_CONCPT_root-exp.gif",
						branch: "sdx_ONT_CONCPT_branch.gif",
						branchExp: "sdx_ONT_CONCPT_branch-exp.gif",
						leaf: "sdx_ONT_CONCPT_leaf.gif"
					}
				};
				var sdxRenderData = i2b2.sdx.Master.RenderHTML(treeObj.id, sdxDataNode, renderOptions);
				i2b2.sdx.Master.AppendTreeNode(treeObj, parentNode, sdxRenderData);
			}
			
			// redraw treeview
			treeObj.draw();

			// BUG FIX: WEBCLIENT-139 & WEBCLIENT-150
			searchCatsCount++;
			if(searchCatsCount == searchCats.length){ // found last scopedCallback AJAX call
				if(totalCount == 0 && s.length == 0){ // s.length fix - don't display err messages twice
					alert('No records found.'); // ' for category ' + results.msgParams.ont_category);
				}
				$('ontFindNameButtonWorking').innerHTML = "";
			}
			
				// $('ontFindNameButtonWorking').innerHTML = treeObj.getRoot().children.length + " Found";

			//document.getElementById('ontFindNameButtonWorking').style.display = 'none';

				
			// How long did it take?
			if (searchCatsCount == searchCats.length) {
				var outtime = new Date().getTime()-mytime;
				console.log("FindBy took "+outtime+"ms");
			}
		}
		
	
		// add AJAX options
		var searchOptions = {};
		searchOptions.ont_max_records = "max='"+i2b2.ONT.view['find'].params.max+"' ";
		searchOptions.ont_synonym_records = i2b2.ONT.view['find'].params.synonyms;
		searchOptions.ont_hidden_records = i2b2.ONT.view['find'].params.hiddens;
		searchOptions.ont_reduce_results = i2b2.ONT.view['find'].params.reduce;
		searchOptions.ont_hierarchy = i2b2.ONT.view['find'].params.hierarchy;
		searchOptions.ont_search_strategy = inSearchData.Strategy;
		searchOptions.ont_search_string = inSearchData.SearchStr;
			
		l = searchCats.length;
		var totalCount = 0;
		var searchCatsCount = 0;
		
		for (var i=0; i<l; i++) {
			searchOptions.ont_category = searchCats[i];
	
			 
			i2b2.ONT.ajax.GetNameInfo("ONT:FindBy", searchOptions, scopedCallback);

		}

	},



// ================================================================================================== //
	clickSearchModifier: function(searchBy) {
		var f = $('ontFormFindModifier');
		var search_info = {};
		search_info.SearchStr = f.ontFindModifierMatch.value;
		if (search_info.SearchStr.length < 3 && searchBy != "all") {
			alert("Search string must be at least 3 characters.");
		} else {
			
				treeObj = i2b2.ONT.view.find.yuiTreeModifier;
				treeObj.setDynamicLoad(i2b2.sdx.Master.LoadChildrenFromTreeview,1);
				
								var tvRoot = treeObj.getRoot();
			treeObj.removeChildren(tvRoot);
			treeObj.draw();
		search_info.Strategy = f.ontFindStrategy.options[f.ontFindStrategy.selectedIndex].value;
		search_info.SearchBy = searchBy;
		i2b2.ONT.ctrlr.FindBy.doModifierSearch(search_info);
		}
	},

// ================================================================================================== //
	doModifierSearch: function(inSearchData) {
		// inSearchData is expected to have the following attributes:
		//   SearchStr:  what is being searched for
		//   Category: what category is being searched.  Blank for all
		//   Strategy: what matching strategy should be used

		// VERIFY that the above information has been passed		
		var f = false;
		if (Object.isUndefined(inSearchData)) return false;
		if (Object.isUndefined(inSearchData.SearchStr)) {
			alert('Please enter a search term.');
			return false;
		}
		if (Object.isUndefined(inSearchData.Strategy)) { 
			console.error('Matching Strategy has not been set');
			return false;
		}
		var s = inSearchData.Strategy;
		switch(s) {
			case "contains":	break;
			case "exact":		break;
			case "left":		break;
			case "right":		break;
			default:
				s = 'contains';
		}
		inSearchData.Strategy = s;
		
		// special client processing to search all categories
		var searchCats = [];
		if (inSearchData.Category == "[[[ALL]]]") {
			var d = i2b2.ONT.model.Categories;
			var l = d.length
			// build list of all categories to search 
			for (var i=0; i<l; i++) {
				var cid = d[i].key;
				cid = /\\\\\w*\\/.exec(cid);
				cid = cid[0].replace(/\\/g,'');
				searchCats.push(cid);
			}
		} else {
			// just a single category to search
			searchCats.push(inSearchData.Category);
		}
			
	//	var treeObj = i2b2.ONT.view['find'].yuiTreeName;
		
		//Create a new treeobject so it does not append 
		//treeObj = new YAHOO.widget.TreeView("ontSearchNamesResults");
	
		// register the treeview with the SDX subsystem to be a container for CONCPT objects
		i2b2.sdx.Master.AttachType("ontSearchModifiersResults","CONCPT");
		
				// $('ontFindNameButtonWorking').innerHTML = "0 Found";
		 $('ontFindModiferButtonWorking').innerHTML = "Searching...";

		var jsTreeObjPath = 'i2b2.ONT.view.find.yuiTreeModifier';
		var tmpNode;


	// scope our callback function
		var scopedCallback = new i2b2_scopedCallback();
		scopedCallback.scope = this;
		// define our callback function
		scopedCallback.callback = function(results)
		{
			// THIS function is used to process the AJAX results of the getChild call
			//		results data object contains the following attributes:
			//			refXML: xmlDomObject <--- for data processing
			//			msgRequest: xml (string)
			//			msgResponse: xml (string)
			//			error: boolean
			//			errorStatus: string [only with error=true]
			//			errorMsg: string [only with error=true]
			
		// fire multiple AJAX calls
		
						//Determine if a error occured
			// <result_status>  <status type="ERROR">MAX_EXCEEDED</status>  </result_status> 
			var s = i2b2.h.XPath( results.refXML, 'descendant::result_status/status[@type="ERROR"]');
			if (s.length > 0) {
				// we have a proper error msg
				try {
					if (s[0].firstChild.nodeValue == "MAX_EXCEEDED")
						i2b2.h.nonmodalAlert("Max number of terms exceeded please try with a more specific query.");
					else
						alert("ERROR: "+s[0].firstChild.nodeValue);	
					document.getElementById('ontFindNameButtonWorking').style.display = 'none';						
					//return;
				} catch (e) {
					alert("An unknown error has occured during your rest call attempt!");
				}
			} 
		
		    var treeObj = i2b2.ONT.view.find.yuiTreeModifier;
			//	var tvRoot = treeObj.getRoot();
			//treeObj.removeChildren(tvRoot);

			// display the results
			var c = results.refXML.getElementsByTagName('modifier');
			//totalCount = totalCount + c.length;
			for(var i2=0; i2<1*c.length; i2++) {
				var o = new Object;
				o.xmlOrig = c[i2];
				o.isModifier = true;
				o.parent =  i2b2.ONT.view.find.contextRecord.origData;
				o.name = i2b2.h.getXNodeVal(c[i2],'name');
				o.hasChildren = "";
				if ((c[i2],'visualattributes') != undefined && (c[i2],'visualattributes').length > 1)
					o.hasChildren = i2b2.h.getXNodeVal(c[i2],'visualattributes').substring(0,2);
				o.level = i2b2.h.getXNodeVal(c[i2],'level');
				o.key = i2b2.h.getXNodeVal(c[i2],'key');
				o.tooltip = i2b2.h.getXNodeVal(c[i2],'tooltip');
				o.icd9 = '';
				o.table_name = i2b2.h.getXNodeVal(c[i2],'tablename');
				o.applied_path = i2b2.h.getXNodeVal(c[i2],'applied_path');
				o.column_name = i2b2.h.getXNodeVal(c[i2],'columnname');
				o.operator = i2b2.h.getXNodeVal(c[i2],'operator');
				o.dim_code = i2b2.h.getXNodeVal(c[i2],'dimcode');
				// append the data node
				var sdxDataNode = i2b2.sdx.Master.EncapsulateData('CONCPT',o);
				var renderOptions = {
					title: o.name,
					dragdrop: "i2b2.sdx.TypeControllers.CONCPT.AttachDrag2Data",
					showchildren: true,
					icon: {
						root: "sdx_ONT_MODIFIER_root.gif",
						rootExp: "sdx_ONT_MODIFIER_root-exp.gif",
						branch: "sdx_ONT_MODIFIER_branch.gif",
						branchExp: "sdx_ONT_MODIFIER_branch-exp.gif",
						leaf: "sdx_ONT_MODIFIER_leaf.gif"
					}
				};
				var sdxRenderData = i2b2.sdx.Master.RenderHTML(treeObj.id, sdxDataNode, renderOptions);
				i2b2.sdx.Master.AppendTreeNode(treeObj, treeObj.root, sdxRenderData);
			//}
			// redraw treeview

			treeObj.draw();
			 $('ontFindModiferButtonWorking').innerHTML = "";//treeObj.getRoot().children.length + " Found";

		}
	}

//		if (totalCount == 0)
//		{
//			alert("No Records Found");
//		}
	
	
	// add AJAX options
		var searchOptions = {};
		searchOptions.ont_max_records = "max='"+i2b2.ONT.view['find'].params.max+"' ";
		searchOptions.ont_synonym_records = i2b2.ONT.view['find'].params.synonyms;
		searchOptions.ont_hidden_records = i2b2.ONT.view['find'].params.hiddens;
		searchOptions.ont_search_strategy = inSearchData.Strategy;
		searchOptions.ont_search_string = inSearchData.SearchStr;
		searchOptions.concept_key_value =  i2b2.ONT.view.find.contextRecord.sdxInfo.sdxKeyValue;
		searchOptions.modifier_key_value =  i2b2.ONT.view.find.contextRecord.sdxInfo.sdxKeyValue;
		searchOptions.modifier_applied_path =  i2b2.ONT.view.find.contextRecord.origData.dim_code + "%";
		searchOptions.ont_search_by = inSearchData.SearchBy;
	
		l = searchCats.length;
		var totalCount = 0;
		for (var i=0; i<l; i++) {
			searchOptions.ont_category = searchCats[i];
			if (inSearchData.SearchBy == "name") {
				i2b2.ONT.ajax.GetModifierNameInfo("ONT:FindBy", searchOptions, scopedCallback);
			} else if (inSearchData.SearchBy == "code") {
				i2b2.ONT.ajax.GetModifierCodeInfo("ONT:FindBy", searchOptions, scopedCallback);
			} else {
				 $('ontFormFindModifier').ontFindModifierMatch.value = "";
				i2b2.ONT.ajax.GetModifiers("ONT:FindBy", searchOptions, scopedCallback);
			}
	

		}

	},



// ================================================================================================== //
	clickSearchCode: function() {
		var f = $('ontFormFindCode');
		var search_info = {};
		search_info.SearchStr = f.ontFindCodeMatch.value;
		search_info.Coding =  f.ontFindCoding.options[f.ontFindCoding.selectedIndex].value ;
		i2b2.ONT.ctrlr.FindBy.doCodeSearch(search_info);
	},

// ================================================================================================== //
	doCodeSearch: function(inSearchData) {
		// VERIFY that the above information has been passed		
		var f = false;
		if (Object.isUndefined(inSearchData)) return false;
		if (Object.isUndefined(inSearchData.SearchStr)) {
			alert('Please enter a search term.');
			return false;
		}
		var strMatch = inSearchData.SearchStr;
		if (Object.isUndefined(inSearchData.Coding)) { 
			alert('Please select a Coding System to search');
			return false;
		} else {
			if (inSearchData.Coding=='') { 
				alert('Please select a Coding System to search');
				return false;
			}
		}
		
		document.getElementById('ontFindCodeButtonWorking').style.display = 'block';


			//delete old search results
			var treeObj = i2b2.ONT.view.find.yuiTreeCode;
			var tvRoot = treeObj.getRoot();
			treeObj.removeChildren(tvRoot);
			treeObj.draw();

		 $('ontFormFindModifier').ontFindModifierMatch.value = "";
		i2b2.ONT.view.find.yuiTreeModifier.removeChildren(i2b2.ONT.view.find.yuiTreeModifier.getRoot());
		i2b2.ONT.view.find.yuiTreeModifier.draw();
	
		//Reset display
		i2b2.ONT.view.find.modifier = false;
		i2b2.ONT.view.find.Resize();		
		
		var code_system = inSearchData.Coding;
		// scope our callback function
		var scopedCallback = new i2b2_scopedCallback();
		scopedCallback.scope = this;
		// define our callback function
		scopedCallback.callback = function(results)
		{
			// THIS function is used to process the AJAX results of the getChild call
			//		results data object contains the following attributes:
			//			refXML: xmlDomObject <--- for data processing
			//			msgRequest: xml (string)
			//			msgResponse: xml (string)
			//			error: boolean
			//			errorStatus: string [only with error=true]
			//			errorMsg: string [only with error=true]
			var treeObj = i2b2.ONT.view.find.yuiTreeCode;
			var jsTreeObjPath = 'i2b2.ONT.view.find.yuiTreeCode';
			var tmpNode;
			i2b2.ONT.view.find.queryRequest = results.msgRequest;			
			i2b2.ONT.view.find.queryResponse = results.msgResponse;
			//delete old search results
			//var tvRoot = treeObj.getRoot();
			//treeObj.removeChildren(tvRoot);
			var c = results.refXML.getElementsByTagName('concept');
			for(var i=0; i<1*c.length; i++) {
				var o = new Object;
				o.xmlOrig = c[i];
				o.name = i2b2.h.getXNodeVal(c[i],'name');
				if ((c[i],'visualattributes') != undefined && (c[i],'visualattributes').length > 1)
					o.hasChildren = i2b2.h.getXNodeVal(c[i],'visualattributes').substring(0,2);
				o.level = i2b2.h.getXNodeVal(c[i],'level');
				o.key = i2b2.h.getXNodeVal(c[i],'key');
				o.tooltip = i2b2.h.getXNodeVal(c[i],'tooltip');
				o.icd9 = '';
				o.table_name = i2b2.h.getXNodeVal(c[i],'tablename');
				o.column_name = i2b2.h.getXNodeVal(c[i],'columnname');
				o.operator = i2b2.h.getXNodeVal(c[i],'operator');
				o.dim_code = i2b2.h.getXNodeVal(c[i],'dimcode');
				o.basecode = i2b2.h.getXNodeVal(c[i],'basecode');
				// append the data node
				var sdxDataNode = i2b2.sdx.Master.EncapsulateData('CONCPT',o);
				var renderOptions = {
					title: o.name,
					dragdrop: "i2b2.sdx.TypeControllers.CONCPT.AttachDrag2Data",
					click: "i2b2.ONT.view.info.SetKey('"+encodeURI(o.key)+"')",
					showchildren: false,
					icon: {
						root: "sdx_ONT_CONCPT_root.gif",
						rootExp: "sdx_ONT_CONCPT_root-exp.gif",
						branch: "sdx_ONT_CONCPT_branch.gif",
						branchExp: "sdx_ONT_CONCPT_branch-exp.gif",
						leaf: "sdx_ONT_CONCPT_leaf.gif"
					}
				};
				var sdxRenderData = i2b2.sdx.Master.RenderHTML(treeObj.id, sdxDataNode, renderOptions);
				i2b2.sdx.Master.AppendTreeNode(treeObj, treeObj.root, sdxRenderData);
			}
			
			if (c.length == 0)
			{
				alert("No Records Found");
			}
			// redraw treeview	
			treeObj.draw();
		}
		document.getElementById('ontFindCodeButtonWorking').style.display = 'none';			

		// add options
		var searchOptions = {};
		searchOptions.ont_max_records = "max='"+i2b2.ONT.view['find'].params.max+"' ";
		searchOptions.ont_synonym_records = i2b2.ONT.view['find'].params.synonyms;
		searchOptions.ont_hidden_records = i2b2.ONT.view['find'].params.hiddens;
		searchOptions.ont_search_strategy = "exact";
		searchOptions.ont_search_coding = (inSearchData.Coding == 'undefined'  ? '' : inSearchData.Coding);
		searchOptions.ont_search_string = inSearchData.SearchStr;
		i2b2.ONT.ajax.GetCodeInfo("ONT:FindBy", searchOptions, scopedCallback);
	}
}

console.timeEnd('execute time');
console.groupEnd();
