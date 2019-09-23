/**
* @projectDescription	Data model for Temporal Query Relationship and Relationship's Spans.
* @inherits 	CRC_ctrlr_QryPanel
* @namespace	
* @author		Taowei David Wang (tdw9)
* @version 	1.0
* ----------------------------------------------------------------------------------------
*
*/

function TQueryRelationship( index, event1, event2 )
{
    this.mapRefDateToText = function( refDate )
    {
        if (refDate == "STARTDATE")
            return "Start of";
        else if (refDate == "ENDDATE")
            return "End of";
        else
            return "Error. Unexpected Value. [see CRC_ctrlr_TQryRelationship.js:mapRefDateToText()]";
    };

    this.mapAggregateOperatorToText = function( aggreOp ) 
    {
        if (aggreOp == "FIRST")
            return "first ever";
        else if ( aggreOp == "LAST")
            return "last ever";
        else if ( aggreOp == "ANY")
            return "any";
        else
            return "Error. Unexpected Value. [see CRC_ctrlr_TQryRelationship.js:mapAggregateOperatorToText()]";
    };

    this.mapOperatorToText = function( op )
    {
        if (op == "LESS")
            return "occurs before";
        else if (op == "LESSEQUAL")
            return "occurs on or before";
        else if (op == "EQUAL")
            return "occurs simultaneously with";
        else // GREATER, GREATEREQUAL are eliminated from options
            return "Error. Unexpected Value. [see CRC_ctrlr_TQryRelationship.js:mapOperatorToText()]";
    };

    this.makeDisplayText = function()
    {
        var text =  this.mapRefDateToText( this.refDate1 ) + " " +
                    this.mapAggregateOperatorToText( this.aggregateOp1 ) + " " +
                    this.eventID1 + " " +
                    this.mapOperatorToText( this.operator ) + " " +
                    this.mapRefDateToText( this.refDate2 ) + " " +
                    this.mapAggregateOperatorToText( this.aggregateOp2 ) + " " +
                    this.eventID2;

        if (this.span1 || this.span2 )
            text = text + " by ";
        if ( this.span1 )
            text = text + " " + this.span1.makeDisplayText();
        if (this.span1 && this.span2)
            text = text + " and ";
        if ( this.span2 )
            text = text + " " + this.span2.makeDisplayText();
        return text;
    };

    /*
     * EXAMPLE XML output for a temporal relationship
     * 
    	<subquery_constraint>
		    <first_query>
			    <query_id>Event 1</query_id>
			    <join_column>STARTDATE</join_column>
			    <aggregate_operator>FIRST</aggregate_operator>
		    </first_query>
		    <operator>LESS</operator>
		    <second_query>
			    <query_id>Event 2</query_id>
			    <join_column>STARTDATE</join_column>
			    <aggregate_operator>FIRST</aggregate_operator>
		    </second_query>
		    <span>
			    <operator>GREATEREQUAL</operator>
			    <span_value>1</span_value>
			    <units>DAY</units>
		    </span>
		    <span>
			    <operator>LESSEQUAL</operator>
			    <span_value>3</span_value>
			    <units>DAY</units>
		    </span>
	    </subquery_constraint>
    *
    */
    this.makeXML = function()
    {
        var s = "\t<subquery_constraint>\n";
        s +=        "\t\t<first_query>\n";
        s +=            "\t\t\t<query_id>" + this.eventID1 +"</query_id>\n";
        s +=            "\t\t\t<join_column>" + this.refDate1 + "</join_column>\n";
        s +=            "\t\t\t<aggregate_operator>" + this.aggregateOp1 + "</aggregate_operator>\n";
        s +=        "\t\t</first_query>\n";
        s +=        "\t\t<operator>" + this.operator + "</operator>\n";
        s +=        "\t\t<second_query>\n";
        s +=            "\t\t\t<query_id>" + this.eventID2 + "</query_id>\n";
        s +=            "\t\t\t<join_column>" + this.refDate2 + "</join_column>\n";
        s +=            "\t\t\t<aggregate_operator>" + this.aggregateOp2 + "</aggregate_operator>\n";
        s +=        "\t\t</second_query>\n";

        // now add spans if they exist
        if ( this.span1 )
            s += this.span1.makeXML();
        if ( this.span2 )
            s += this.span2.makeXML();

        s +=    "\t</subquery_constraint>\n";
        return s;
    };

    /* Function that converts simple temporal relationsip model to classic ===============================*/
    // eventNameMapping is a mapping of Simple Temporal Query UI's event name (e.g. Event A) to Classic Temporal Query UI's event name (e.g. Event 1)
    this.populateClassicUI = function( index, eventNameMapping )
    {
        // make a new temporal builder (UI for relationship) if we need one
        if (index > i2b2.CRC.ctrlr.QT.tenporalBuilders )
            i2b2.CRC.ctrlr.QT.doAddTemporal();
        // there is no data model for classic temporal query. Everything is in the UI. We make apprpriate selections in the drop downs.
        jQuery("#preloc1\\["+index+"\\]").val( this.refDate1 );
        jQuery("#instanceopf1\\["+index+"\\]").val( this.aggregateOp1 );
        jQuery("#instancevent1\\["+index+"\\]").val( eventNameMapping[this.eventID1]);
        jQuery("#postloc\\["+index+"\\]").val( this.operator );

        jQuery("#preloc2\\["+index+"\\]").val( this.refDate2 );
        jQuery("#instanceopf2\\["+index+"\\]").val( this.aggregateOp2 );
        jQuery("#instancevent2\\["+index+"\\]").val( eventNameMapping[this.eventID2]);

        // deal with spans
        if (this.span1 != null)  
        {
            document.getElementById('bytime1['+index+']').checked = true; // check "By" 
            jQuery("#byspan1\\["+index+"\\]").val( this.span1.operator );
            jQuery("#bytimevalue1\\["+index+"\\]").val( this.span1.value );
            jQuery("#bytimeunit1\\["+index+"\\]").val( this.span1.units );
        }

        if (this.span2 != null)  
        {
            document.getElementById('bytime2['+index+']').checked = true; // check "AND"
            jQuery("#byspan2\\["+index+"\\]").val( this.span2.operator );
            jQuery("#bytimevalue2\\["+index+"\\]").val( this.span2.value );
            jQuery("#bytimeunit2\\["+index+"\\]").val( this.span2.units );
        }
    };


    // initialize new properties
    this.index = index;                 // index is the index of the relationship. e.g. the index of the first Event is 0.

    this.eventID1       = event1 || null;
    this.refDate1       = "STARTDATE";
    this.aggregateOp1   = "FIRST";

    this.eventID2       = event2 || null;
    this.refDate2       = "STARTDATE";
    this.aggregateOp2   = "FIRST";

    this.operator       = "LESS";

    this.span1          = null; // spans initialize to null
    this.span2          = null;
};


/* object representing temporal query relationship span*/
function TQueryRelationshipSpan( op, val, u )
{
    this.mapSpanOperatorToText = function(spanOp) 
    {
        if (spanOp == "LESS")
            return "<";
        else if (spanOp == "LESSEQUAL")
            return "≤";
        else if (spanOp == "EQUAL")
            return "=";
        else if (spanOp == "GREATER")
            return ">";
        else if (spanOp == "GREATEREQUAL")
            return "≥";
        return "Error. Unexpected Value. [see CRC_ctrlr_TQryRelationship.js:mapSpanOperatorToText()]";
    };

    this.mapSpanUnitsToText = function(spanUnits) 
    {
        if (spanUnits == "MINUTE")
            return "minute(s)";
        else if (spanUnits == "HOUR")
            return "hour(s)";
        else if (spanUnits == "DAY")
            return "day(s)";
        else if (spanUnits == "MONTH")
            return "month(s)";
        else if (spanUnits == "YEAR")
            return "year(s)";
        return "Error. Unexpected Value. [see CRC_ctrlr_TQryRelationship.js:mapSpanUnitsToText()]";
    };

    this.makeDisplayText = function()
    {
        var text = "";
        text = text + this.mapSpanOperatorToText(this.operator);
        text = text + " " + this.value;
        text = text + " " + this.mapSpanUnitsToText(this.units);
        return text;
    };

    /*
     * Example Span XML
     *
            <span>
                <operator>GREATEREQUAL</operator>
                <span_value>1</span_value>
                <units>DAY</units>
            </span>
    */
    this.makeXML = function()
    {
        var s = "\t\t<span>\n";
        s +=        "\t\t\t<operator>" + this.operator + "</operator>\n";
        s +=        "\t\t\t<span_value>" + this.value + "</span_value>\n";
        s +=        "\t\t\t<units>" + this.units + "</units>\n";
        s +=    "\t\t</span>\n";
        return s;
    };

    this.operator   = op || "GREATEREQUAL";
    this.value      = val || 1;
    this.units      = u || "DAY";
};