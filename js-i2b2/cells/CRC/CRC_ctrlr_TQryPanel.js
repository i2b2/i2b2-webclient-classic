/**
* @projectDescription	Controller for Temporal Query Tool's query panels. (GUI-only controller).
* @inherits 	CRC_ctrlr_QryPanel
* @namespace	
* @author		Taowei David Wang (tdw9)
* @version 	1.0
* ----------------------------------------------------------------------------------------
*
*/

function TQueryPanelController(eventController, panelDOMID, index, isSecondary)
{
    //tdw9: 1710:  inheriting from i2b2_PanelController's 
    i2b2_PanelController.call(this, null);
        
    this.initialize = function()
    {
        this.yuiTree = new YAHOO.widget.TreeView( this.domID + "_content" ); // add yui treeview to content panel
        // add click handler to date and exclude controls
        jQuery('#' + this.domID + ' [class^="temporalPanelDatesDiv"]').click(function() { self.handlePanelDates(); });
        jQuery('#' + this.domID + ' [class^="temporalPanelExcludeDiv"]').click(function() { self.handleExclude(); });
        // add content panel to context menu trigger list
        var triggers = i2b2.CRC.view.TQuery.ContextMenuObj.cfg.getProperty("trigger");
        triggers.push( $(this.domID + "_content") );
        i2b2.CRC.view.TQuery.ContextMenuObj.cfg.setProperty("trigger", triggers);
    };

    this.attachDropHandlers = function()
    {    
        var dropTargetDomID = this.domID + "_content";
        var op_trgt = { dropTarget: true };
        i2b2.sdx.Master.AttachType(dropTargetDomID, 'CONCPT', op_trgt); // tdw9 1707c: lets the panel accept drops
        var funcHovOverCONCPT = function(e, id, ddProxy) 
        {
            jQuery("#" + dropTargetDomID).addClass('ddCONCPTTarget');
        }
        var funcHovOutCONCPT = function(e, id, ddProxy) 
        {
            jQuery("#" + dropTargetDomID).removeClass('ddCONCPTTarget');
        }
        i2b2.sdx.Master.setHandlerCustom(dropTargetDomID, 'CONCPT', 'onHoverOut', funcHovOutCONCPT);
        i2b2.sdx.Master.setHandlerCustom(dropTargetDomID, 'CONCPT', 'onHoverOver', funcHovOverCONCPT);

        i2b2.sdx.Master.setHandlerCustom(dropTargetDomID, 'CONCPT', 'DropHandler', (function(sdxData)
        {
            sdxData = sdxData[0];	// only interested in first record
            if (self.index != 0 && !sdxData.origData.isModifier)
            {
                alert("This panel only accepts Modifiers.");
                return;
            }
            self.performDrop(sdxData);

            // increment tutorial state
            var eventID = jQuery("#"+dropTargetDomID).parent().parent().attr("id");
            i2b2.CRC.view.QT.incrementTutorialState(1, {"id":eventID} );
        }));

        i2b2.sdx.Master.setHandlerCustom(dropTargetDomID, 'CONCPT', 'AppendTreeNode', this.funcATN);
    };
    
    /* Detaches handlers by removing its references directly from i2b2.sdx.Mater._sysData. This is called when user initiates a panel deletion */
    this.detachDropHandlers = function() 
    {
        var dropTargetDomID = this.domID + "_content";
        delete i2b2.sdx.Master._sysData[dropTargetDomID]; // delete references to handlers
    };

    /* removes self from the list of triggers known to the context menu */
    this.detachContextMenuTriggers = function()
    {
        var thisPanelContent = $(this.domID + "_content");
        var triggers = i2b2.CRC.view.TQuery.ContextMenuObj.cfg.getProperty("trigger"); // get reference to triggers
        for ( var i = 0; i < triggers.length; i++ )
        {
            if ( triggers[i] == thisPanelContent)
            {
                triggers.splice(i, 1); // removes self form triggers
                break;
            }
        }
        i2b2.CRC.view.TQuery.ContextMenuObj.cfg.setProperty("trigger", triggers);
    }

    /*  Handles concept drops into the panel */
    this.performDrop = function(sdxConceptOrig)
    {
        i2b2.CRC.view.QT.resetQueryResults();
        if (!('xmlOrig' in sdxConceptOrig.origData)) // jgk0719 While it's a good habit to repackage the XML into an sdx object, it's not usually necessary, so if we don't have the XML (find terms hierarchy result), just use the original
			var sdxConcept = sdxConceptOrig;
        else var sdxConcept = i2b2.sdx.TypeControllers.CONCPT.MakeObject(sdxConceptOrig.origData.xmlOrig, sdxConceptOrig.origData.isModifier, null, sdxConceptOrig.origData.parent, sdxConceptOrig.sdxInfo.sdxType);
        // following nw096's Date Constraints overhaul
        if (this.dateFrom)
            sdxConcept.dateFrom = this.dateFrom;
        if (this.dateTo)
            sdxConcept.dateTo   = this.dateTo;
        // save data
        var newConceptInfo = this.performAddConcept(sdxConcept, this.yuiTree.root, true);
        this.redrawTree(); // draw the node
        this.redrawItemExclusion();
        this.redrawItemDates();
    };

    this.performAddConcept = function(sdxConcept, tvParent, isDragged) 
    {
        var tmpNode = this._addConceptVisuals.call(this, sdxConcept, tvParent, isDragged, this);
        sdxConcept.itemNumber   = this.items.length + 1; // assign itemNumber to each item so things like modlab dialog will work properly. This number comforms with i2b2_PanelController.itemNumber, which, inexplicably, starts with 1, not 0.
        sdxConcept.parentPanel  = this;                  // link sdxConcept to this panel controller
        sdxConcept.renderData   = tmpNode;               // tdw9:1710 attach tmpNode as renderData for sdxConcept (sdxConcept.renderData cannot be null when invoking Lab/Mod dialog)
        this.items.push( sdxConcept );
        return tmpNode;
    }

    this.performDeleteConcept = function(htmlID, itemNum)
    {
		if (undefined===htmlID) return; // nothing to delete
        i2b2.CRC.view.QT.resetQueryResults();

        var node = this.yuiTree.getNodeByProperty('nodeid', htmlID );
        this.yuiTree.removeNode(node, false);   // remove visual in tree
        this.items.splice(itemNum-1,1);         // remove concept in model (we use itemNumber-1 because items[i].itemNumber = i+1)

        this.redrawTree();
        this.redrawItemExclusion();
        this.redrawItemDates();

        // re-assign itemNumber for all remaining items
        for (var i = 0; i < this.items.length; i++)
            this.items[i].itemNumber = i+1;
    };

    this.performChangeConceptDate = function(htmlID, itemNum)
    {
        if (undefined === htmlID) return; // nothing to change
        i2b2.CRC.ctrlr.dateConstraint.tqShowDates( this.items[itemNum-1], itemNum-1 );
    };

    // tdw9: 1710: the following two methods now call the proper functions with proper arguments 
    this.performChangeLabValue = function( sdxConcept )
    {
        if (undefined === sdxConcept) return; // nothing to change
        this.showLabValues(sdxConcept.origData.key, sdxConcept);
    };

    this.performChangeModValue = function( sdxConcept )
    {
        if (undefined === sdxConcept) return; // nothing to change
        this.showModValues(sdxConcept.origData.key, sdxConcept);
    };


    this.handleExclude = function(bExclude) 
    {
        if ( this.items.length == 0) return; // do nothing if there are no items
        i2b2.CRC.view.QT.resetQueryResults();
        var bVal;
        if (undefined != bExclude) 
            bVal = bExclude;
        else 
            bVal = !Boolean(this.exclude);
        this.exclude = bVal;
        //this._redrawButtons(dm);
        this.redrawExcludeButton();
        this.redrawItemExclusion();
        this.redrawItemDates();

        // clear the query name and set the query as having dirty data
        //var QT = i2b2.CRC.ctrlr.QT;
        //QT.doSetQueryName.call(QT, '');
    };

    this.handlePanelDates = function()
    {
        i2b2.CRC.ctrlr.dateConstraint.tqShowDates(self);
    };

    // returns whether the panel is empty
    this.isEmpty = function() 
    { return this.items.length == 0; };



/********************************************************************************
*  (tdw9: 1710)  Overriding i2b2_PanelController functions for Mod/Lab selector 
*********************************************************************************/
this.showLabValues = function(key, extData)
{
    this.currentTerm = extData; // save value as this.currentTerm, which is required for ModLabVlues to work properly
    i2b2.CRC.view.modLabvaluesCtlr.selectValueBox(-1, this, key, extData, false, this); // pass in this as pluginObj
};

this.showModValues = function(key, extData)
{
    this.currentTerm = extData;  // save value as this.currentTerm, which is required for ModLabVlues to work properly
    i2b2.CRC.view.modLabvaluesCtlr.selectValueBox(-1, this, key, extData, true, this); // pass in this as pluginObj
};

/********************************************************************************
*  (tdw9: 1710)  Implement function necessary for ModLabValues to work properly
*********************************************************************************/
this.conceptsRenderFromValueBox = function()
{
    var closure_number = this.currentTerm.itemNumber;
    // find the correct item in the panel
    for (var i = 0; i < this.items.length; i++) 
    {
        if (this.items[i].itemNumber == closure_number) 
        {
            if (this.currentTerm.origData.isModifier)
            {
                this.items[i].ModValues = this.currentTerm.ModValues;
            }
            else
            {
                this.items[i].LabValues = this.currentTerm.LabValues;
            }
            break;
        }
    }
    // update the panel/query tool GUI
    i2b2.CRC.ctrlr.QT.doSetQueryName.call(this, '');
    this._performRenameConcept(this.currentTerm.itemNumber, this.currentTerm.origData.isModifier, this);
    i2b2.CRC.view.QT.resetQueryResults(); // reset query results
};


/***************************************************************
*                      Redraw functions
****************************************************************/
    this.redrawTree = function()
    {
        //if (undefined === pd.tvRootNode)
        //    pd.tvRootNode = this.yuiTree.root;
        // redraw tree
        this.yuiTree.draw();
        /*
        for (var i = 0; i < pd.tvRootNode.children.length; i++) {
            // fix the folder icon for expanded folders
            var n = pd.tvRootNode.children[i];
            this._redrawTreeFix.call(this, n);
        }
        */
    };

    this.redrawExcludeButton = function()
    {        
        jQuery('#' + this.domID + " .temporalPanelExcludeDiv").removeClass("temporalPanelButtonActive");
        if (this.exclude)
            jQuery('#' + this.domID + " .temporalPanelExcludeDiv").addClass("temporalPanelButtonActive"); // adds underline style
    };
    this.redrawItemExclusion = function()
    {
        jQuery('#' + this.domID + "_content" + ' [class^="sdxDefault"]').find('span.itemExclude').remove();
        if (this.exclude) 
        {
            for (var i = 0; i < this.items.length; i++) 
            {
                jQuery('<span title="This item is being excluded" class="itemExclude">&nbsp;NOT&nbsp;</span>').prependTo(jQuery('#' +this.domID + '_content [class^="sdxDefault"]')[i]);
            }
        }
    }

    this.redrawDateButton = function() {
        jQuery('#' + this.domID + " .temporalPanelDatesDiv").removeClass("temporalPanelButtonActive");
        if (this.dateFrom || this.dateTo )
            jQuery('#' + this.domID + " .temporalPanelDatesDiv").addClass("temporalPanelButtonActive"); // adds underline style
    };
    this.redrawItemDates = function()
    {
        jQuery('#' + this.domID + ' table.ygtvdepth0 [class^="sdxDefault"]').find('span.itemDateConstraint').remove();
        if (this.items.length > 0) {
            for (var i = 0; i < this.items.length; i++) {
                if (this.items[i].dateFrom && this.items[i].dateTo)
                    jQuery('<span title="This item has a date constraint" class="itemDateConstraint">&nbsp;[' + this.items[i].dateFrom.Month + '/' + this.items[i].dateFrom.Day + '/' + this.items[i].dateFrom.Year + ' to ' + this.items[i].dateTo.Month + '/' + this.items[i].dateTo.Day + '/' + this.items[i].dateTo.Year + ']</span>').appendTo(jQuery('#' + this.domID + ' table.ygtvdepth0 [class^="sdxDefault"]')[i]);
                if (this.items[i].dateFrom && !this.items[i].dateTo)
                    jQuery('<span title="This item has a date constraint" class="itemDateConstraint">&nbsp;[&ge;' + this.items[i].dateFrom.Month + '/' + this.items[i].dateFrom.Day + '/' + this.items[i].dateFrom.Year + ']</span>').appendTo(jQuery('#' + this.domID + ' table.ygtvdepth0 [class^="sdxDefault"]')[i]);
                if (!this.items[i].dateFrom && this.items[i].dateTo) 
                    jQuery('<span title="This item has a date constraint" class="itemDateConstraint">&nbsp;[&le;' + this.items[i].dateTo.Month + '/' + this.items[i].dateTo.Day + '/' + this.items[i].dateTo.Year + ']</span>').appendTo(jQuery('#' + this.domID + ' table.ygtvdepth0 [class^="sdxDefault"]')[i]);
            }
        }
    };

    this.funcATN = function(yuiTree, yuiParentNode, sdxDataPack, callbackLoader) 
    {
        var myobj = { html: sdxDataPack.renderData.html, nodeid: sdxDataPack.renderData.htmlID }
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
        tmpNode.data.i2b2_SDX = sdxDataPack;
        tmpNode.toggle = function() {
            if (!this.tree.locked && (this.hasChildren(true))) {
                var data = this.data.i2b2_SDX.renderData;
                var img = this.getContentEl();
                img = Element.select(img, 'img')[0];
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
    };


    /**************************************************************************************************** 
     * Code called to change a treenode that represents a concept that changes names (e.g. change of value). Ref: CRC_ctrlr_QryPanel.js: _renameConcept
     *      pd is an instance of TQueryPanelController
     ****************************************************************************************************/
    this._performRenameConcept = function(key, isModifier, pd)
    {
        $('infoQueryStatusText').innerHTML = "";
        $('infoQueryStatusChart').innerHTML = "";
        $('infoQueryStatusReport').innerHTML = "";

        // remove the concept from panel
        for (var i = 0; i < pd.items.length; i++) 
        {
            if ((pd.items[i].origData.key == key) || (pd.items[i].itemNumber == key)) 
            {
                // found the concept to remove
                var rto = pd.items[i];
                break;
            }
        }
        if (undefined === rto) { return; }
        // rename the node in the treeview
        var tvChildren = this.yuiTree.root.children;
        for (var i = 0; i < tvChildren.length; i++) 
        {
            if (tvChildren[i].data.i2b2_SDX.sdxConcept.itemNumber == key) 
            {
                var tt = tvChildren[i].getContentHtml();
                var tt2 = tt.substring(0, tt.lastIndexOf("\"/>") + 3);
                var tt3 = "";
                if (isModifier) 
                {
                    var values = rto.ModValues;
                    var modParent = rto.origData.parent;
                    while (modParent != null) 
                    {
                        if (modParent.isModifier) 
                            modParent = modParent.parent;
                        else 
                            break;
                    }
                    tt2 += modParent.name + " [" + rto.origData.name;
                    tt3 = "]";
                    rto.origData.newName = modParent.name + " [" + rto.origData.name;
                } 
                else 
                {
                    var values = rto.LabValues;
                    tt2 += rto.origData.name;
                    rto.origData.newName = rto.origData.name;
                }
                tvChildren[i].html = tt2 + tt3 + "</div></div>"
                rto.origData.newName += tt3;

                if (undefined != values) 
                {
                    switch (values.MatchBy) 
                    {
                        case "FLAG":
                            tvChildren[i].html = tt2 + ' = ' + i2b2.h.Escape(values.ValueFlag) + "</div></div>";
                            rto.origData.newName += ' = ' + i2b2.h.Escape(values.ValueFlag);

                            break;
                        case "VALUE":
                            if (values.GeneralValueType == "ENUM") {
                                var sEnum = [];
                                for (var i2 = 0; i2 < values.ValueEnum.length; i2++) {
                                    sEnum.push(i2b2.h.Escape(values.NameEnum[i2].text));
                                }
                                sEnum = sEnum.join("\", \"");
                                sEnum = ' =  ("' + sEnum + '")';
                                tvChildren[i].html = tt2 + sEnum + tt3 + "</div></div>";
                                rto.origData.newName += sEnum + tt3;
                            } else if (values.GeneralValueType == "LARGESTRING") {
                                tvChildren[i].html = tt2 + ' [contains "' + i2b2.h.Escape(values.ValueString) + '"]' + tt3 + "</div></div>";
                                rto.origData.newName += ' [contains "' + i2b2.h.Escape(values.ValueString) + '"]' + tt3;
                            } else if (values.GeneralValueType == "STRING") {
                                if (values.StringOp == undefined) {
                                    var stringOp = "";
                                } else {
                                    switch (values.StringOp) {
                                        case "LIKE[exact]":
                                            var stringOp = "Exact: ";
                                            break;
                                        case "LIKE[begin]":
                                            var stringOp = "Starts With: ";
                                            break;
                                        case "LIKE[end]":
                                            var stringOp = "Ends With: ";
                                            break;
                                        case "LIKE[contains]":
                                            var stringOp = "Contains: ";
                                            break;
                                        default:
                                            var stringOp = "";
                                            break;
                                    }
                                }
                                tvChildren[i].html = tt2 + ' [' + stringOp + i2b2.h.Escape(values.ValueString) + "]" + tt3 + "</div></div>";
                                rto.origData.newName += ' [' + stringOp + i2b2.h.Escape(values.ValueString) + "]" + tt3;
                            } else {
                                if (!Object.isUndefined(values.UnitsCtrl)) {
                                    tt3 = " " + values.UnitsCtrl + tt3;
                                }

                                if (values.NumericOp == 'BETWEEN') {
                                    tvChildren[i].html = tt2 + ' ' + i2b2.h.Escape(values.ValueLow) + ' - ' + i2b2.h.Escape(values.ValueHigh) + tt3 + "</div></div>";
                                    rto.origData.newName += ' ' + i2b2.h.Escape(values.ValueLow) + ' - ' + i2b2.h.Escape(values.ValueHigh) + tt3;
                                } else {
                                    switch (values.NumericOp) {
                                        case "LT":
                                            var numericOp = " < ";
                                            break;
                                        case "LE":
                                            var numericOp = " <= ";
                                            break;
                                        case "EQ":
                                            var numericOp = " = ";
                                            break;
                                        case "GT":
                                            var numericOp = " > ";
                                            break;
                                        case "GE":
                                            var numericOp = " >= ";
                                            break;

                                        case "":
                                            break;
                                    }
                                    tvChildren[i].html = tt2 + numericOp + i2b2.h.Escape(values.Value) + tt3 + "</div></div>"
                                    rto.origData.newName += numericOp + i2b2.h.Escape(values.Value) + tt3;
                                }
                            }
                            break;
                        case "":
                            break;
                    }
                }
                //this.yuiTree.root.tree.draw();
                this.redrawTree();
                this.redrawItemExclusion();
                this.redrawItemDates();
                break;
            }
        }
        // clear the query name if it was set
        //this.QTController.doSetQueryName.call(this, '');
    };

    /**********************************************************
     * Code to generate XML for query submission
     **********************************************************/
    // generate XML for this panel and all of its contents for submitting queries. See CRC_ctrlr_QryTools.js: _getQueryXML
    this.makeXML = function()
    {
        var s = '\t\t<panel>\n';
        s += '\t\t\t<panel_number>' + this.index + '</panel_number>\n';
        s += "\t\t\t<panel_accuracy_scale>" + this.accuracy + "</panel_accuracy_scale>\n";
        // Exclude constraint (invert flag)
        if (this.exclude)    s += '\t\t\t<invert>1</invert>\n';
        else                s += '\t\t\t<invert>0</invert>\n';

        // Panel Timing
        s += '\t\t\t<panel_timing>' + this.timing + '</panel_timing>\n';

        // Occurs constraint
        s += '\t\t\t<total_item_occurrences>' + (this.occurs+1) + '</total_item_occurrences>\n'; // add 1 to this.occurs because specs say it's the number OR more

        // Concepts
        for (var i = 0; i < this.items.length; i++) // BUG FIX: WEBCLIENT-153 (Added i2b2.h.Escape() to all names/tooltips)
        {
            var sdxData = this.items[i];
            s += '\t\t\t<item>\n';
            // date constraint on Concepts
            if (this.items[i].dateFrom || this.items[i].dateTo) // BUG FIX: WEBCLIENT-136
            {
                s += '\t\t\t\t<constrain_by_date>\n';
                if (this.items[i].dateFrom) 
                    s += '\t\t\t\t\t<date_from>' + this.items[i].dateFrom.Year + '-' + padNumber(this.items[i].dateFrom.Month, 2) + '-' + padNumber(this.items[i].dateFrom.Day, 2) + 'T00:00:00.000-05:00</date_from>\n';
                if (this.items[i].dateTo)
                    s += '\t\t\t\t\t<date_to>' + this.items[i].dateTo.Year + '-' + padNumber(this.items[i].dateTo.Month, 2) + '-' + padNumber(this.items[i].dateTo.Day, 2) + 'T00:00:00.000-05:00</date_to>\n';
                s += '\t\t\t\t</constrain_by_date>\n';
            }
            
            // Assume every item is a Concept because we only allow Concepts for now
            if (sdxData.origData.isModifier) 
                s += this.makeModifierXML( sdxData );
            else 
            {
                sdxData.origData.key = (sdxData.origData.key).replace(/</g, "&lt;");
                sdxData.origData.name = (sdxData.origData.name).replace(/</g, "&lt;");
                if (undefined != sdxData.origData.tooltip)
                    sdxData.origData.tooltip = (sdxData.origData.tooltip).replace(/</g, "&lt;");
                s += '\t\t\t\t<hlevel>' + sdxData.origData.level + '</hlevel>\n';
                s += '\t\t\t\t<item_name>' + (sdxData.origData.name != null ? i2b2.h.Escape(sdxData.origData.name) : i2b2.h.Escape(sdxData.origData.newName)) + '</item_name>\n';
                s += '\t\t\t\t<item_key>' + sdxData.origData.key + '</item_key>\n';
                s += '\t\t\t\t<tooltip>' + i2b2.h.Escape(sdxData.origData.tooltip) + '</tooltip>\n'; // BUG FIX: WEBCLIENT-135 (Escape tooltip)
                s += '\t\t\t\t<class>ENC</class>\n';
                s += '\t\t\t\t<item_icon>' + sdxData.origData.hasChildren + '</item_icon>\n';
            }

            // process Synonym
            try 
            {
                var t = i2b2.h.XPath(sdxData.origData.xmlOrig, 'descendant::synonym_cd/text()');
                t = (t[0].nodeValue == "Y");
            }
            catch (e) 
            {
                var t = "false";
            }
            s += '\t\t\t\t<item_is_synonym>' + t + '</item_is_synonym>\n';

            // process LabValues
            if (sdxData.LabValues)
                s += this.getValues(sdxData.LabValues);

            s += '\t\t\t</item>\n';

            // tdw9 1707c: deal with query names, commented out for now
            /*
            if (i==0) 
            {
                if (undefined != sdxData.origData.name) 
                {
                    auto_query_name += sdxData.origData.name.substring(0,auto_query_name_len);
                } 
                else if (undefined != sdxData.origData.title) 
                {
                    auto_query_name += sdxData.origData.title.substring(0,auto_query_name_len);					
                } 
                else 
                {
                    auto_query_name += "new query";
                }
                if (p < panel_cnt-1) {auto_query_name += '-';}
            }
            */
        }
        s += '\t\t</panel>\n';
        return s;
    };

    // returns XML for a given modifier
    this.makeModifierXML = function( sdxData )
    {
        var xml = "";
        var modParent = sdxData.origData.parent;
        var level = sdxData.origData.level;
        var key = sdxData.origData.parent.key;
        var name = (sdxData.origData.parent.name != null ? i2b2.h.Escape(sdxData.origData.parent.name) : i2b2.h.Escape(sdxData.origData.name));
        var tooltip = sdxData.origData.tooltip;
        var itemicon = sdxData.origData.hasChildren;
        while (modParent != null) {
            if (modParent.isModifier)
                modParent = modParent.parent;
            else {
                level = modParent.level;
                key = modParent.key;
                name = modParent.name;
                tooltip = modParent.tooltip;
                itemicon = modParent.hasChildren;
                break;
            }
        }
        xml += '\t\t\t<hlevel>' + level + '</hlevel>\n';
        xml += '\t\t\t<item_key>' + key + '</item_key>\n';
        xml += '\t\t\t<item_name>' + i2b2.h.Escape(name) + '</item_name>\n';
        // (sdxData.origData.newName != null ? sdxData.origData.newName : sdxData.origData.name) + '</item_name>\n';
        xml += '\t\t\t<tooltip>' + i2b2.h.Escape(tooltip) + '</tooltip>\n';
        xml += '\t\t\t<item_icon>' + itemicon + '</item_icon>\n';
        xml += '\t\t\t<class>ENC</class>\n';

        xml += '\t\t\t\t<constrain_by_modifier>\n';
        xml += '\t\t\t\t\t<modifier_name>' + sdxData.origData.name + '</modifier_name>\n';
        xml += '\t\t\t\t\t<applied_path>' + sdxData.origData.applied_path + '</applied_path>\n';
        xml += '\t\t\t\t\t<modifier_key>' + sdxData.origData.key + '</modifier_key>\n';
        if (sdxData.ModValues)
            xml += this.getValues(sdxData.ModValues);
        xml += '\t\t\t\t</constrain_by_modifier>\n';
        return xml;
    };

    this.getValues = function(lvd) // given lab values, generate XML for the value constraints for query submission. See CRC_ctrlr_QryTools.js: getValues
    {
        var s = '\t\t\t<constrain_by_value>\n';
        switch (lvd.MatchBy) 
        {
            case "FLAG":
                s += '\t\t\t\t<value_type>FLAG</value_type>\n';
                s += '\t\t\t\t<value_operator>EQ</value_operator>\n';
                s += '\t\t\t\t<value_constraint>' + i2b2.h.Escape(lvd.ValueFlag) + '</value_constraint>\n';
                break;
            case "VALUE":
                if (lvd.GeneralValueType == "ENUM") 
                {
                    var sEnum = [];
                    for (var i2 = 0; i2 < lvd.ValueEnum.length; i2++)
                        sEnum.push(i2b2.h.Escape(lvd.ValueEnum[i2]));
                    sEnum = sEnum.join("\',\'");
                    sEnum = '(\'' + sEnum + '\')';
                    s += '\t\t\t\t<value_type>TEXT</value_type>\n';
                    s += '\t\t\t\t<value_constraint>' + sEnum + '</value_constraint>\n';
                    s += '\t\t\t\t<value_operator>IN</value_operator>\n';
                } 
                else if ((lvd.GeneralValueType == "STRING") || (lvd.GeneralValueType == "TEXT")) 
                {
                    s += '\t\t\t\t<value_type>TEXT</value_type>\n';
                    s += '\t\t\t\t<value_operator>' + lvd.StringOp + '</value_operator>\n';
                    s += '\t\t\t\t<value_constraint><![CDATA[' + i2b2.h.Escape(lvd.ValueString) + ']]></value_constraint>\n';
                } 
                else if (lvd.GeneralValueType == "LARGESTRING") 
                {
                    if (lvd.DbOp) 
                        s += '\t\t\t\t<value_operator>CONTAINS[database]</value_operator>\n';
                    else
                        s += '\t\t\t\t<value_operator>CONTAINS</value_operator>\n';
                    s += '\t\t\t\t<value_type>LARGETEXT</value_type>\n';
                    s += '\t\t\t\t<value_constraint><![CDATA[' + lvd.ValueString + ']]></value_constraint>\n';
                } 
                else 
                {
                    s += '\t\t\t\t<value_type>' + lvd.GeneralValueType + '</value_type>\n';
                    s += '\t\t\t\t<value_unit_of_measure>' + lvd.UnitsCtrl + '</value_unit_of_measure>\n';
                    s += '\t\t\t\t<value_operator>' + lvd.NumericOp + '</value_operator>\n';
                    if (lvd.NumericOp == 'BETWEEN') 
                        s += '\t\t\t\t<value_constraint>' + i2b2.h.Escape(lvd.ValueLow) + ' and ' + i2b2.h.Escape(lvd.ValueHigh) + '</value_constraint>\n';
                    else
                        s += '\t\t\t\t<value_constraint>' + i2b2.h.Escape(lvd.Value) + '</value_constraint>\n';
                }
                break;
            case "":
                break;
        }
        s += '\t\t\t</constrain_by_value>\n';
        return s;
    };



     /**********************************************************
     * Code to copy this panel from SIMPLE UI to CLASSIC UI
     **********************************************************/
    this.copyToClassicUI = function( classicUITargetEventIndex, panelIndex )
    {
        i2b2.CRC.ctrlr.QT.temporalGroup = classicUITargetEventIndex;
        //var panelController = i2b2.CRC.ctrlr.QT.panelControllers[ this.index % 3];
        var panelController = i2b2.CRC.ctrlr.QT.panelControllers[0];
        panelController.copyIntoSelf( this, panelIndex );
    };

    // initialize new properties
    var self = this;                        // allow inner functions to access 'this' object
    
    this.parentEvent = eventController;
    this.index       = index;               // index of this panel in this.parentEvent.panels
    this.isSecondary = isSecondary || false;
    this.domID      = panelDOMID;
    this.items      = [];
    //this.dates      = null;
    this.exclude    = false;
    this.accuracy   = 100;                  // default accuracy scale = 100
    this.timing     = "SAMEINSTANCENUM";    // default for now is Same Instance since we are only looking at observations
    this.occurs     = 0;                    // default occurs = 0: "more." When translating to XML, needs to use this.occurs+1 because XML spec says "this.occurs or more"
    
    this.isActive   = true;

    this.initialize();
};

//TQueryPanelController.prototype = new i2b2_PanelController; // subclassing i2b2_PanelController
