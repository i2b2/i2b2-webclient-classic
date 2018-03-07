/**
* @projectDescription	Controller for Temporal Query Tool's Event. (GUI-only controller).
* @inherits 	none
* @namespace	
* @author		Taowei David Wang (tdw9)
* @version 	1.0
* ----------------------------------------------------------------------------------------
*
*/


function TQueryEventController(sequence, eventName, eventDOMID, panelDOMID ) 
{
    /*==============================================================================*/
    /* declare functions                                                            */
    /*==============================================================================*/

    // build a new panel object. Allows specification of a particular DOM ID to be bind this object to. if null, then a unique name is created. new panel object is returned.
    this.addNewPanel = function(panelDOMID, isSecondary)
    {
        i2b2.CRC.view.QT.resetQueryResults(); // reset query results
        var panelDomID = panelDOMID || this.domID + "_P" + this.panelCounter;
        var newPanel = new TQueryPanelController(this, panelDomID, this.panels.length, isSecondary);
        this.panels.push( newPanel );
        this.panelCounter++;
        jQuery("#" + panelDomID).data(i2b2.CRC.view.QT.TQryEvent.panelPrefix, newPanel); // associate panel object with DOM element
        newPanel.attachDropHandlers(); // attach drop handlers
        return newPanel;
    };

    // generate a panel name based on this.panelCounter. Does NOT increment this.panelCounter.
    this.generateCurrentPanelName = function()
    {
        var name = this.domID + "_P" + this.panelCounter;
        return name;
    };

    // returns whether the Event is empty
    this.isEmpty = function()
    {
        var flag = true;
        for (var i = 0; i < this.panels.length; i++ )
        {
            if ( !this.panels[i].isEmpty() )
                return false;
        }
        return flag;
    };

    // recompute widths of events and panels to redraw
    this.redraw = function()
    {
        var eventElement = jQuery("#" + this.domID);
        var firstPanel   = jQuery("#" + this.panels[0].domID);
        if (this.panels.length == 1 )
        {           
            firstPanel.width(242);
            eventElement.width(242);
            // hide 1st panel's delete panel button and set constriants to 50% widths 
            firstPanel.find(".temporalPanelDeleteDiv").hide();
            firstPanel.find(".temporalPanelDatesDiv").css("right","50%");
            firstPanel.find(".temporalPanelExcludeDiv").css("left","50%");
            firstPanel.find(".temporalPanelExcludeDiv").css("right","0%");
            // firstPanel.find(".temporalPanelAddDiv").show(); // tdw9: hide add panel button for biobankportal
        }
        else if (this.panels.length == 2 )
        {
            eventElement.width(300);
            for ( var i=0; i < this.panels.length; i++ )
            {
                var panelElement = jQuery("#" + this.panels[i].domID);
                if (i == this.panels.length - 1)
                {                    
                    panelElement.width(149);
                    panelElement.css("border-right", "0px");
                    // tdw9: hide add panel button for biobankportal
                    //panelElement.find(".temporalPanelAddDiv").show(); // only the last panel has add button 
                }
                else
                {
                    jQuery("#"+this.panels[i].domID).width(150);
                    panelElement.css("border-right", "");
                    // tdw9: hide add panel button for biobankportal
                    //panelElement.find(".temporalPanelAddDiv").hide();
                }
            }
            firstPanel.find(".temporalPanelDeleteDiv").show();
            firstPanel.find(".temporalPanelDatesDiv").css("right", "");
            firstPanel.find(".temporalPanelExcludeDiv").css("left", "");
            firstPanel.find(".temporalPanelExcludeDiv").css("right", "");
        }
        else
        {
            var panelWidth = 132;
            var eventWidth = (panelWidth+1) * this.panels.length;
            eventElement.width( eventWidth );
            for (var i = 0; i < this.panels.length; i++) 
            {
                var panelElement = jQuery("#" + this.panels[i].domID);
                if (i == this.panels.length-1) 
                {                    
                    panelElement.width(panelWidth+1);
                    panelElement.css("border-right", "0px");
                    // tdw9: hide add panel button for biobankportal
                    //panelElement.find(".temporalPanelAddDiv").show(); // only the last panel has add button
                }
                else 
                {
                    jQuery("#" + this.panels[i].domID).width(panelWidth);
                    panelElement.css("border-right", "");
                    // tdw9: hide add panel button for biobankportal
                    //panelElement.find(".temporalPanelAddDiv").hide();
                }
            }
            firstPanel.find(".temporalPanelDeleteDiv").show();
            firstPanel.find(".temporalPanelDatesDiv").css("right", "");
            firstPanel.find(".temporalPanelExcludeDiv").css("left", "");
            firstPanel.find(".temporalPanelExcludeDiv").css("right", "");
        }
    };

    /*==============================================================================
     * Code to genrate XML for query submission                                     
     *==============================================================================*/
    // generate XML for this Event and all of its contents for submitting queries. Panels generate their own XML.
    /*
     * An Event is a Subquery. Example follows:
        <subquery>
            <query_id>Event 1</query_id>
            <query_type>EVENT</query_type>
            <query_name>Event 1</query_name>
            <query_timing>SAMEINSTANCENUM</query_timing>
            <specificity_scale>0</specificity_scale>
	            <panel>
		            <panel_number>1</panel_number>
		            <panel_accuracy_scale>100</panel_accuracy_scale>
		            <invert>0</invert>
		            <panel_timing>SAMEINSTANCENUM</panel_timing>
		            <total_item_occurrences>1</total_item_occurrences>
		            <item>
			            <hlevel>2</hlevel>
			            <item_name>Circulatory system</item_name>
			            <item_key>\\i2b2_DIAG\i2b2\Diagnoses\Circulatory system (390-459)\</item_key>
			            <tooltip>Diagnoses \ Circulatory system</tooltip>
			            <class>ENC</class>
			            <item_icon>FA</item_icon>
			            <item_is_synonym>false</item_is_synonym>
		            </item>
	            </panel>
        </subquery>
    */
    this.makeXML = function()
    {
        var s = "\t<subquery>\n";
        s += "\t\t<query_id>" + this.name + "</query_id>\n";
        s += "\t\t<query_type>EVENT</query_type>\n";
        s += "\t\t<query_name>" + this.name + "</query_name>\n";
        s += "\t\t<query_timing>SAMEINSTANCENUM</query_timing>\n";
        s += "\t\t<specificity_scale>0</specificity_scale>\n";
        for ( var i = 0; i < this.panels.length; i++ )
            if (!this.panels[i].isEmpty())
                s += this.panels[i].makeXML();
        s += "\t</subquery>\n";
        return s;
    };

    this.copyToClassicUI = function( classicUIEventCount, classicUITargetEventIndex )
    {
        if (classicUITargetEventIndex > classicUIEventCount)
        { // there are more events than currently in exsitence. Create a new one
            $('addDefineGroup-button').disable();
			i2b2.CRC.ctrlr.QT.temporalGroup = i2b2.CRC.model.queryCurrent.panels.length;
			if (YAHOO.util.Dom.inDocument(defineTemporalButton.getMenu().element))
            {
				defineTemporalButton.getMenu().addItems([{ text: "Event " + (i2b2.CRC.ctrlr.QT.temporalGroup), value: i2b2.CRC.ctrlr.QT.temporalGroup}]);
				defineTemporalButton.getMenu().render();
			} 
            else 
            {
				var aMenuItemData=[];
				aMenuItemData[0] = {text: "Event " + (i2b2.CRC.ctrlr.QT.temporalGroup), value: i2b2.CRC.ctrlr.QT.temporalGroup};
				defineTemporalButton.getMenu().itemData = aMenuItemData;
			}
                    
			i2b2.CRC.model.queryCurrent.panels[i2b2.CRC.ctrlr.QT.temporalGroup] = {};
			var newTreeView = new YAHOO.widget.TreeView("QPD1");
			i2b2.CRC.ctrlr.QT.panelAdd(newTreeView);
			i2b2.CRC.ctrlr.QT._redrawAllPanels();
					
			//Add to define a query	
			for( var i = 0; i < i2b2.CRC.ctrlr.QT.tenporalBuilders + 1; i++)
            {
				var select = document.getElementById("instancevent1["+i+"]");
				select.options[select.options.length] = new Option( 'Event '+i2b2.CRC.ctrlr.QT.temporalGroup, i2b2.CRC.ctrlr.QT.temporalGroup);
				select = document.getElementById("instancevent2["+i+"]");
				select.options[select.options.length] = new Option( 'Event '+i2b2.CRC.ctrlr.QT.temporalGroup, i2b2.CRC.ctrlr.QT.temporalGroup);
			}
			$('addDefineGroup-button').enable();
        }
        for ( var i = 0; i < this.panels.length; i++ )
            if (!this.panels[i].isEmpty())
                this.panels[i].copyToClassicUI(classicUITargetEventIndex, i);

        //i2b2.CRC.model.queryCurrent.panels[classicUITargetIndex].
    };


    /*==============================================================================*/
    /* declare and initialize new properties                                        */
    /*==============================================================================*/

    this.parentSequence = sequence;
    this.name           = eventName;
    this.domID          = eventDOMID;
    this.panels         = [];
    this.panelCounter   = 0;
    this.addNewPanel();
};
