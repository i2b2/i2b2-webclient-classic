/**
 * @projectDescription	Temporal Relationship Dialog Editor (GUI-only controller).
 * @inherits 	
 * @namespace	i2b2.CRC.view.temporalRelationshipEditor
 * @author		Taowei David Wang
 * @version 	0.9c
 * ----------------------------------------------------------------------------------------
 */
console.group('Load & Execute component file: CRC > ctrlr > temporalRelationshipEditor');
console.time('execute time');

// polyfill so IE can use Number.isInteger (not natively supported in IE). See http://stackoverflow.com/questions/31720269/internet-explorer-11-object-doesnt-support-property-or-method-isinteger
Number.isInteger = Number.isInteger || function(value) 
{
    return typeof value === "number" && 
           isFinite(value) && 
           Math.floor(value) === value;
};

// ================================================================================================== //
i2b2.CRC.view.temporalRelationshipEditor = 
{
    dataModel:{},
    targetTemporalRelationship:null,

    restrictNumbers: function(inputField)
    {
        inputField.value = inputField.value.replace(/[^0-9]/g, '');
    },
    updateSpan1UI: function()
    {
        if (jQuery("#spanCheck1").is(':checked')) {
            i2b2.CRC.view.temporalRelationshipEditor.dataModel.span1.checked = true;
            jQuery("#spanOp1").prop("disabled", false);
            jQuery("#spanValue1").prop("disabled", false);
            jQuery("#spanUnits1").prop("disabled", false);
            jQuery("#spanCheck2").prop("disabled", false);
        }
        else {
            i2b2.CRC.view.temporalRelationshipEditor.dataModel.span1.checked = false;
            jQuery("#spanOp1").prop("disabled", true);
            jQuery("#spanValue1").prop("disabled", true);
            jQuery("#spanUnits1").prop("disabled", true);
        }
    },
    updateSpan2UI: function()
    {
        if (jQuery("#spanCheck2").is(':checked')) {
            i2b2.CRC.view.temporalRelationshipEditor.dataModel.span2.checked = true;
            jQuery("#spanOp2").prop("disabled", false);
            jQuery("#spanValue2").prop("disabled", false);
            jQuery("#spanUnits2").prop("disabled", false);
        }
        else {
            i2b2.CRC.view.temporalRelationshipEditor.dataModel.span2.checked = false;
            jQuery("#spanOp2").prop("disabled", true);
            jQuery("#spanValue2").prop("disabled", true);
            jQuery("#spanUnits2").prop("disabled", true);
        }

    },
    // ================================================================================================== //
    show: function(tQryRelationship) 
    {
        // only build the prompt box 1 time
        if (!i2b2.CRC.view.temporalRelationshipEditor.dialog)
        {
            var handleSubmit = function() 
            {
                // save the dates
                if (i2b2.CRC.view.temporalRelationshipEditor.handleAccept())
                {
                    // saved and validated, close modal form
                    this.submit();
                    i2b2.CRC.view.QT.updateAllRelationshipText(); // bugbug: update relationshp text, should use a more targeted function instead of updating all of them
                    i2b2.CRC.view.QT.resetQueryResults();  // reset query results
                }
            };
            var handleCancel = function() { this.cancel(); }

            i2b2.CRC.view.temporalRelationshipEditor.dialog = new YAHOO.widget.SimpleDialog("temporalRelationshipEditor", {
                width: "400px",
                fixedcenter: true,
                constraintoviewport: true,
                modal: true,
                zindex: 700,
                buttons: [{
                    text: "OK",
                    isDefault: true,
                    handler: handleSubmit
                }, {
                    text: "Cancel",
                    handler: handleCancel
                }]
            });
            // restrict inputs to accept only integers
            // add listeners to widgets: Changes are immeidately written to dataModel
            jQuery('select#refDate1').change( function()
            {
                i2b2.CRC.view.temporalRelationshipEditor.dataModel.refDate1 = jQuery('select#refDate1 option:selected').prop("value");
            });
            jQuery('select#aggregationOp1').change(function() {
                i2b2.CRC.view.temporalRelationshipEditor.dataModel.aggregateOp1 = jQuery('select#aggregationOp1 option:selected').prop("value");
            });

            jQuery('select#operator').change(function() {
                i2b2.CRC.view.temporalRelationshipEditor.dataModel.operator = jQuery('select#operator option:selected').prop("value");
            });

            jQuery('select#refDate2').change(function() {
                i2b2.CRC.view.temporalRelationshipEditor.dataModel.refDate2 = jQuery('select#refDate2 option:selected').prop("value");
            });
            jQuery('select#aggregationOp2').change(function() {
                i2b2.CRC.view.temporalRelationshipEditor.dataModel.aggregateOp2 = jQuery('select#aggregationOp2 option:selected').prop("value");
            });

            // listen to checkbox changes
            jQuery("#spanCheck1").change( function() 
            {
                i2b2.CRC.view.temporalRelationshipEditor.updateSpan1UI();
            });

            jQuery("#spanCheck2").change(function() 
            {
                i2b2.CRC.view.temporalRelationshipEditor.updateSpan2UI();
            });
            // add listeners to span dropdown boxes. 
            jQuery("#spanOp1").change( function(){
                i2b2.CRC.view.temporalRelationshipEditor.dataModel.span1.operator = jQuery("#spanOp1 option:selected").prop("value");
            });
            jQuery('#spanValue1').on('input', function() 
            {
                i2b2.CRC.view.temporalRelationshipEditor.restrictNumbers(this);
                i2b2.CRC.view.temporalRelationshipEditor.dataModel.span1.value = parseInt(jQuery("#spanValue1").val());
            });
            jQuery("#spanUnits1").change(function() {
                i2b2.CRC.view.temporalRelationshipEditor.dataModel.span1.units = jQuery("#spanUnits1 option:selected").prop("value");
            });
            jQuery("#spanOp2").change(function() {
                i2b2.CRC.view.temporalRelationshipEditor.dataModel.span2.operator = jQuery("#spanOp2 option:selected").prop("value");
            });
            jQuery('#spanValue2').on('input', function() 
            {
                i2b2.CRC.view.temporalRelationshipEditor.restrictNumbers(this);
                i2b2.CRC.view.temporalRelationshipEditor.dataModel.span2.value = parseInt(jQuery("#spanValue2").val());
            });
            jQuery("#spanUnits2").change(function() {
                i2b2.CRC.view.temporalRelationshipEditor.dataModel.span2.units = jQuery("#spanUnits2 option:selected").prop("value");
            });

            // render dialog
            $('temporalRelationshipEditor').show();
            i2b2.CRC.view.temporalRelationshipEditor.dialog.render(document.body);
        }
        i2b2.CRC.view.temporalRelationshipEditor.dialog.show();

        // save a copy for referece later
        this.targetTemporalRelationship = tQryRelationship;
        // create new dataModel and load data
        this.dataModel = new Object;
        this.dataModel.eventID1      = tQryRelationship.eventID1;
        this.dataModel.refDate1 = tQryRelationship.refDate1;
        this.dataModel.aggregateOp1 = tQryRelationship.aggregateOp1;

        this.dataModel.eventID2 = tQryRelationship.eventID2;
        this.dataModel.refDate2 = tQryRelationship.refDate2;
        this.dataModel.aggregateOp2 = tQryRelationship.aggregateOp2;

        this.dataModel.operator = tQryRelationship.operator;

        // load spans if they exist, otherwise load empty spans
        this.dataModel.span1 = new TQueryRelationshipSpan();
        this.dataModel.span1.checked = false;
        if (tQryRelationship.span1)
        {
            this.dataModel.span1 = new TQueryRelationshipSpan(tQryRelationship.span1.operator, tQryRelationship.span1.value, tQryRelationship.span1.units);
            this.dataModel.span1.checked = true;
        }
        this.dataModel.span2 = new TQueryRelationshipSpan();
        this.dataModel.span2.checked = false;
        if (tQryRelationship.span2)
        {
            this.dataModel.span2 = new TQueryRelationshipSpan(tQryRelationship.span2.operator, tQryRelationship.span2.value, tQryRelationship.span2.units);
            this.dataModel.span2.checked = true;
        }

        // update event names
        jQuery("#leadingEventNameSpan").text(this.dataModel.eventID1);
        jQuery("#trailingEventNameSpan").text(this.dataModel.eventID2);

        // update dropdown UIs
        jQuery('select#refDate1 option').filter(function() { return jQuery(this).prop("value") == i2b2.CRC.view.temporalRelationshipEditor.dataModel.refDate1; }).prop("selected", true);
        jQuery('select#aggregationOp1 option').filter(function() { return jQuery(this).prop("value") == i2b2.CRC.view.temporalRelationshipEditor.dataModel.aggregateOp1; }).prop("selected", true);

        jQuery('select#operator option').filter(function() { return jQuery(this).prop("value") == i2b2.CRC.view.temporalRelationshipEditor.dataModel.operator; }).prop("selected", true);

        jQuery('select#refDate2 option').filter(function() { return jQuery(this).prop("value") == i2b2.CRC.view.temporalRelationshipEditor.dataModel.refDate2; }).prop("selected", true);
        jQuery('select#aggregationOp2 option').filter(function() { return jQuery(this).prop("value") == i2b2.CRC.view.temporalRelationshipEditor.dataModel.aggregateOp2; }).prop("selected", true);

        jQuery('select#spanOp1 option').filter(function() { return jQuery(this).prop("value") == i2b2.CRC.view.temporalRelationshipEditor.dataModel.span1.operator; }).prop("selected", true);
        jQuery('input#spanValue1').val(i2b2.CRC.view.temporalRelationshipEditor.dataModel.span1.value);
        jQuery('select#spanUnits1 option').filter(function() { return jQuery(this).prop("value") == i2b2.CRC.view.temporalRelationshipEditor.dataModel.span1.units; }).prop("selected", true);

        jQuery('select#spanOp2 option').filter(function() { return jQuery(this).prop("value") == i2b2.CRC.view.temporalRelationshipEditor.dataModel.span2.operator; }).prop("selected", true);
        jQuery('input#spanValue2').val(i2b2.CRC.view.temporalRelationshipEditor.dataModel.span2.value);
        jQuery('select#spanUnits2 option').filter(function() { return jQuery(this).prop("value") == i2b2.CRC.view.temporalRelationshipEditor.dataModel.span2.units; }).prop("selected", true);

        jQuery('#spanCheck1').prop('checked', this.dataModel.span1.checked);
        jQuery('#spanCheck2').prop('checked', this.dataModel.span2.checked);
        
        // property change this.dataModel.spanX.checked value and span UI disable states
        this.updateSpan1UI();
        this.updateSpan2UI();
    },

    // ================================================================================================== //
    handleAccept: function() /* read values from UI into data model */
    {
        // check if there are errors
        var int1 = parseInt(jQuery("#spanValue1").val());
        var int2 = parseInt(jQuery("#spanValue2").val());
        if (i2b2.CRC.view.temporalRelationshipEditor.dataModel.span1.checked && ((isNaN(int1)) || !Number.isInteger(int1)))
        {
            alert("Input field cannot be left empty or contain non-integer values. Please enter only integer values");
            return false;
        }
        if (i2b2.CRC.view.temporalRelationshipEditor.dataModel.span2.checked && ((isNaN(int2)) || !Number.isInteger(int2)))
        {
            alert("Input field cannot be left empty or contain non-integer values. Please enter only integer values");
            return false;
        }

        // write value to dataModel
        i2b2.CRC.view.temporalRelationshipEditor.targetTemporalRelationship.refDate1 = i2b2.CRC.view.temporalRelationshipEditor.dataModel.refDate1;
        i2b2.CRC.view.temporalRelationshipEditor.targetTemporalRelationship.aggregateOp1 = i2b2.CRC.view.temporalRelationshipEditor.dataModel.aggregateOp1;
        i2b2.CRC.view.temporalRelationshipEditor.targetTemporalRelationship.operator = i2b2.CRC.view.temporalRelationshipEditor.dataModel.operator;
        i2b2.CRC.view.temporalRelationshipEditor.targetTemporalRelationship.refDate2 = i2b2.CRC.view.temporalRelationshipEditor.dataModel.refDate2;
        i2b2.CRC.view.temporalRelationshipEditor.targetTemporalRelationship.aggregateOp2 = i2b2.CRC.view.temporalRelationshipEditor.dataModel.aggregateOp2;

        if (i2b2.CRC.view.temporalRelationshipEditor.dataModel.span1.checked)
        {
            if (i2b2.CRC.view.temporalRelationshipEditor.targetTemporalRelationship.span1 == null)
                i2b2.CRC.view.temporalRelationshipEditor.targetTemporalRelationship.span1 = new TQueryRelationshipSpan( i2b2.CRC.view.temporalRelationshipEditor.dataModel.span1.operator,
                                                                                                                        i2b2.CRC.view.temporalRelationshipEditor.dataModel.span1.value,
                                                                                                                        i2b2.CRC.view.temporalRelationshipEditor.dataModel.span1.units);
            else
            {
                i2b2.CRC.view.temporalRelationshipEditor.targetTemporalRelationship.span1.operator = i2b2.CRC.view.temporalRelationshipEditor.dataModel.span1.operator;
                i2b2.CRC.view.temporalRelationshipEditor.targetTemporalRelationship.span1.value = i2b2.CRC.view.temporalRelationshipEditor.dataModel.span1.value;
                i2b2.CRC.view.temporalRelationshipEditor.targetTemporalRelationship.span1.units = i2b2.CRC.view.temporalRelationshipEditor.dataModel.span1.units;
            }
        }
        else
            i2b2.CRC.view.temporalRelationshipEditor.targetTemporalRelationship.span1 = null;
        if (i2b2.CRC.view.temporalRelationshipEditor.dataModel.span2.checked) 
        {
            if (i2b2.CRC.view.temporalRelationshipEditor.targetTemporalRelationship.span2 == null)
                i2b2.CRC.view.temporalRelationshipEditor.targetTemporalRelationship.span2 = new TQueryRelationshipSpan(i2b2.CRC.view.temporalRelationshipEditor.dataModel.span2.operator,
                                                                                                                        i2b2.CRC.view.temporalRelationshipEditor.dataModel.span2.value,
                                                                                                                        i2b2.CRC.view.temporalRelationshipEditor.dataModel.span2.units);
            else
            {
                i2b2.CRC.view.temporalRelationshipEditor.targetTemporalRelationship.span2.operator = i2b2.CRC.view.temporalRelationshipEditor.dataModel.span2.operator;
                i2b2.CRC.view.temporalRelationshipEditor.targetTemporalRelationship.span2.value = i2b2.CRC.view.temporalRelationshipEditor.dataModel.span2.value;
                i2b2.CRC.view.temporalRelationshipEditor.targetTemporalRelationship.span2.units = i2b2.CRC.view.temporalRelationshipEditor.dataModel.span2.units;
            }
        }
        else 
            i2b2.CRC.view.temporalRelationshipEditor.targetTemporalRelationship.span2 = null;
        return true;
    },

};


console.timeEnd('execute time');
console.groupEnd();