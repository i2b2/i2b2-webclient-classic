/**
 * @projectDescription	The Date Constraint controller (GUI-only controller).
 * @inherits 	i2b2.CRC.ctrlr
 * @namespace	i2b2.CRC.ctrlr.dateConstraint
 * @author		Nick Benik, Griffin Weber MD PhD
 * @version 	1.3
 * ----------------------------------------------------------------------------------------
 * updated 01-10-18 by Mauro Bucalo
 */
console.group('Load & Execute component file: CRC > ctrlr > Dates');
console.time('execute time');

// ================================================================================================== //
i2b2.CRC.ctrlr.dateConstraint = {
	defaultStartDate: '12/01/1979',
	defaultEndDate: '12/31/2006',
	currentPanelIndex: false,
    panelDateTitle: "Constrain Panel by Date Range",
    panelDateMsg1: "Setting this will apply the date constraint to the entire panel.",
    panelDateMsg2: "Any item-level date constraints will be overwritten.",
	panelDateMsg3: "Date constraints do not apply on Demographics data.",
    itemDateTitle: "Constrain Item by Date Range",
    itemDateMsg1: "Setting date range for this item.",
    itemDateMsg2: "It will overwrite panel-level date constraint on this item, if any.",
// ================================================================================================== //
	showDates: function(panelControllerIndex) {
		var dm = i2b2.CRC.model.queryCurrent;
		var panelIndex = i2b2.CRC.ctrlr.QT.panelControllers[panelControllerIndex].panelCurrentIndex;
		if (undefined==dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][panelIndex]) return;
		// grab our current values
		var qn = dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][panelIndex];
		this.currentPanelIndex = panelIndex;

		// only build the prompt box 1 time
		if (!i2b2.CRC.view.modalDates) {

			var handleSubmit = function(){
				var closure_pi = i2b2.CRC.ctrlr.dateConstraint.currentPanelIndex;
				// save the dates
				if (i2b2.CRC.ctrlr.dateConstraint.doProcessDates(closure_pi)) {
					// saved and validated, close modal form
					this.submit();
				}
			};
			var handleCancel = function(){
				this.cancel();
			}
			i2b2.CRC.view.modalDates = new YAHOO.widget.SimpleDialog("constraintDates", {
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
			$('constraintDates').show();
			i2b2.CRC.view.modalDates.render(document.body);
		} 
		i2b2.CRC.view.modalDates.show();
		// load our panel data				
		var DateRecord = new Object;
		if (qn.dateFrom) { 
			DateRecord.Start = padNumber(qn.dateFrom.Month,2)+'/'+padNumber(qn.dateFrom.Day,2)+'/'+qn.dateFrom.Year;
		} else { 
			DateRecord.Start = this.defaultStartDate; 
		}
		$('constraintDateStart').value = DateRecord.Start;
		if (qn.dateTo) {
			DateRecord.End = padNumber(qn.dateTo.Month,2)+'/'+padNumber(qn.dateTo.Day,2)+'/'+qn.dateTo.Year;
		} else {
//			DateRecord.End = this.defaultEndDate;
			var curdate = new Date(); 
			DateRecord.End = padNumber(curdate.getMonth()+1,2)+'/'+padNumber(curdate.getDate(),2)+'/'+curdate.getFullYear();
		}
		$('constraintDateEnd').value = DateRecord.End;
		if (qn.dateFrom) {
			$('checkboxDateStart').checked = true;
			$('constraintDateStart').disabled = false;
		} else {
			$('checkboxDateStart').checked = false;
			$('constraintDateStart').disabled = true;
		}
		if (qn.dateTo) {
			$('checkboxDateEnd').checked = true;
			$('constraintDateEnd').disabled = false;
		} else {
			$('checkboxDateEnd').checked = false;
			$('constraintDateEnd').disabled = true;
		}
	},

// ================================================================================================== //
	// nw096 - Date Constraints overhaul
	showDate: function(panelCurrentIndex, key, extData) {
		var panelControllerIndex = key.ctrlIndex;
		var itemNumber = extData.itemNumber;
		
		var dm = i2b2.CRC.model.queryCurrent;
		var panelIndex = i2b2.CRC.ctrlr.QT.panelControllers[panelControllerIndex].panelCurrentIndex;
		if (undefined==dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][panelIndex]) return;
		// grab our current values
		var qn = dm.panels[i2b2.CRC.ctrlr.QT.temporalGroup][panelIndex];
		
		var itemIndex = 0;
		for(var i=0;i<qn.items.length;i++){
			if(qn.items[i].itemNumber == itemNumber){
				itemIndex = i;
			}
		}
		var item = qn.items[itemIndex];
		
		this.currentPanelIndex = panelIndex;
		this.currentItemIndex = itemIndex;

		// only build the prompt box 1 time
		if (!i2b2.CRC.view.modalDate) {

			var handleSubmit = function(){
				var closure_pi = i2b2.CRC.ctrlr.dateConstraint.currentPanelIndex;
				var closure_ii = i2b2.CRC.ctrlr.dateConstraint.currentItemIndex;
				// save the dates
				if (i2b2.CRC.ctrlr.dateConstraint.doProcessDate(closure_pi, closure_ii)) {
					// saved and validated, close modal form
					this.submit();
				}
			};
			var handleCancel = function(){
				this.cancel();
			}
			i2b2.CRC.view.modalDate = new YAHOO.widget.SimpleDialog("constraintDate", {
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
			$('constraintDate').show();
			i2b2.CRC.view.modalDate.render(document.body);
		} 
		i2b2.CRC.view.modalDate.show();
		// load our panel data				
		var DateRecord = new Object;
		if (item.dateFrom) { 
			DateRecord.Start = padNumber(item.dateFrom.Month,2)+'/'+padNumber(item.dateFrom.Day,2)+'/'+item.dateFrom.Year;
		} else { 
			DateRecord.Start = this.defaultStartDate; 
		}
		$('item_constraintDateStart').value = DateRecord.Start;
		if (item.dateTo) {
			DateRecord.End = padNumber(item.dateTo.Month,2)+'/'+padNumber(item.dateTo.Day,2)+'/'+item.dateTo.Year;
		} else {
			var curdate = new Date(); 
			DateRecord.End = padNumber(curdate.getMonth()+1,2)+'/'+padNumber(curdate.getDate(),2)+'/'+curdate.getFullYear();
		}
		$('item_constraintDateEnd').value = DateRecord.End;
		if (item.dateFrom) {
			$('item_checkboxDateStart').checked = true;
			$('item_constraintDateStart').disabled = false;
		} else {
			$('item_checkboxDateStart').checked = false;
			$('item_constraintDateStart').disabled = true;
		}
		if (item.dateTo) {
			$('item_checkboxDateEnd').checked = true;
			$('item_constraintDateEnd').disabled = false;
		} else {
			$('item_checkboxDateEnd').checked = false;
			$('item_constraintDateEnd').disabled = true;
		}
	},
	
    // tdw9: making date dialogs for temporal panels and temporal panel items
	tqShowDates: function(dateModel, itemNumber) // dateModel is the data model object that has properties fromDate and toDate
    {
	    this.targetDateModel = dateModel;
	    // only build the prompt box 1 time
	    if (!i2b2.CRC.view.tqModalDates) 
        {
	        var handleSubmit = function() 
            {
	            // save the dates
                var index = null;
                if ( !i2b2.CRC.ctrlr.dateConstraint.targetDateModel.items ) // only panels have items
                    index = i2b2.CRC.ctrlr.dateConstraint.targetDateModel.itemNumber - 1; // we are dealing with a single concept, get its itemNumber
	            if (i2b2.CRC.ctrlr.dateConstraint.qtDoProcessDates( index ))
                {
                    i2b2.CRC.view.QT.resetQueryResults(); // clear query results
	                // saved and validated, close modal form
	                this.submit();
	            }
	        };
	        var handleCancel = function() 
            {
	            this.cancel();
	        }
	        i2b2.CRC.view.tqModalDates = new YAHOO.widget.SimpleDialog("tqConstraintDates", {
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
	        $('tqConstraintDates').show();
	        i2b2.CRC.view.tqModalDates.render(document.body);
	    }

        // update dialog title and messages depending on whether the dialog is for panel or item
        var title   = this.panelDateTitle;
        var msgHTML = "<br>" + this.panelDateMsg1 + "<br><br>" + this.panelDateMsg2 + "<br><br>" + this.panelDateMsg3;

        if (itemNumber != undefined ) // we are setting date constrain to the entire PANEL
        {
            title   = this.itemDateTitle
            msgHTML = "<br>" + this.itemDateMsg1 + "<br><br>" + this.itemDateMsg2;
        }
        jQuery("#tqConstraintDates .hd").text(title);           // set title
        jQuery("#tqConstraintDates .bd span").html(msgHTML);    // set message


	    i2b2.CRC.view.tqModalDates.show();
	    // load date model into dialog		
	    var DateRecord = new Object;
	    if (this.targetDateModel.dateFrom)
	        DateRecord.Start = padNumber(this.targetDateModel.dateFrom.Month, 2) + '/' + padNumber(this.targetDateModel.dateFrom.Day, 2) + '/' + this.targetDateModel.dateFrom.Year;
        else 
	        DateRecord.Start = this.defaultStartDate;
	    $('tqConstraintDateStart').value = DateRecord.Start;
	    if (this.targetDateModel.dateTo) 
	        DateRecord.End = padNumber(this.targetDateModel.dateTo.Month, 2) + '/' + padNumber(this.targetDateModel.dateTo.Day, 2) + '/' + this.targetDateModel.dateTo.Year;
        else
        {
	        var curdate = new Date();
	        DateRecord.End = padNumber(curdate.getMonth() + 1, 2) + '/' + padNumber(curdate.getDate(), 2) + '/' + curdate.getFullYear();
        }
	    $('tqConstraintDateEnd').value = DateRecord.End;

	    if (this.targetDateModel.dateFrom) 
        {
	        $('tqCheckboxDateStart').checked = true;
	        $('tqConstraintDateStart').disabled = false;
	    } 
        else 
        {
	        $('tqCheckboxDateStart').checked = false;
	        $('tqConstraintDateStart').disabled = true;
	    }
	    if (this.targetDateModel.dateTo) 
        {
	        $('tqCheckboxDateEnd').checked = true;
	        $('tqConstraintDateEnd').disabled = false;
	    } 
        else 
        {
	        $('tqCheckboxDateEnd').checked = false;
	        $('tqConstraintDateEnd').disabled = true;
	    }
	},


// ================================================================================================== //
	toggleDate: function() {
		if ($('checkboxDateStart').checked) {
			$('constraintDateStart').disabled = false;
			setTimeout("$('constraintDateStart').select()",150);
		} else {
			$('constraintDateStart').disabled = true;
		}
		if ($('checkboxDateEnd').checked) {
			$('constraintDateEnd').disabled = false;
			setTimeout("$('constraintDateEnd').select()", 150);
		} else {
			$('constraintDateEnd').disabled = true;
		}
	},
	
// ================================================================================================== //
	toggleItemDate: function() {
		if ($('item_checkboxDateStart').checked) {
			$('item_constraintDateStart').disabled = false;
			setTimeout("$('item_constraintDateStart').select()",150);
		} else {
			$('item_constraintDateStart').disabled = true;
		}
		if ($('item_checkboxDateEnd').checked) {
			$('item_constraintDateEnd').disabled = false;
			setTimeout("$('item_constraintDateEnd').select()", 150);
		} else {
			$('item_constraintDateEnd').disabled = true;
		}
	},
// ================================================================================================== //
	tqToggleDate: function() {
	    if ($('tqCheckboxDateStart').checked) {
	        $('tqConstraintDateStart').disabled = false;
	        setTimeout("$('tqConstraintDateStart').select()",150);
	    } else {
	        $('tqConstraintDateStart').disabled = true;
	    }
	    if ($('tqCheckboxDateEnd').checked) {
	        $('tqConstraintDateEnd').disabled = false;
	        setTimeout("$('tqConstraintDateEnd').select()", 150);
	    } else {
	        $('tqConstraintDateEnd').disabled = true;
	    }
	},
// ================================================================================================== //
	doShowCalendar: function(whichDate) {
		// create calendar if not already initialized
		if (!this.DateConstrainCal) {
			this.DateConstrainCal = new YAHOO.widget.Calendar("DateContstrainCal","calendarDiv");
			this.DateConstrainCal.selectEvent.subscribe(this.dateSelected, this.DateConstrainCal,true);
		}
		this.DateConstrainCal.clear();
		// process click
		if (whichDate=='S') {
			if ($('checkboxDateStart').checked==false) { return; }
			var apos = Position.cumulativeOffset($('dropDateStart'));
			var cx = apos[0] - $("calendarDiv").getWidth() + $('dropDateStart').width + 3;
			var cy = apos[1] + $('dropDateStart').height + 3;
			$("calendarDiv").style.top = cy+'px';
			$("calendarDiv").style.left = cx+'px';
			$("constraintDateStart").select();
			var sDateValue = $('constraintDateStart').value;
		} else {
			if ($('checkboxDateEnd').checked==false) { return; }
			var apos = Position.cumulativeOffset($('dropDateEnd'));
			var cx = apos[0] - $("calendarDiv").getWidth() + $('dropDateEnd').width + 3;
			var cy = apos[1] + $('dropDateEnd').height + 3;
			$("calendarDiv").style.top = cy+'px';
			$("calendarDiv").style.left = cx+'px';
			$("constraintDateEnd").select();
			var sDateValue = $('constraintDateEnd').value;
		}
		var rxDate = /^\d{1,2}(\-|\/|\.)\d{1,2}\1\d{4}$/
		if (rxDate.test(sDateValue)) {
			var aDate = sDateValue.split(/\//);
			this.DateConstrainCal.setMonth(aDate[0]-1);
			this.DateConstrainCal.setYear(aDate[2]);
		} else {
			alert("Invalid Date Format, please use mm/dd/yyyy or select a date using the calendar.");
		}
		// save our date type on the calendar object for later use
		this.whichDate = whichDate;
		// display everything
		$("calendarDiv").show();
		
	 	var w =  window.innerWidth || (window.document.documentElement.clientWidth || window.document.body.clientWidth);
	    var h =  window.innerHeight || (window.document.documentElement.clientHeight || window.document.body.clientHeight);

		$("calendarDivMask").style.top = "0px";
		$("calendarDivMask").style.left = "0px";
		$("calendarDivMask").style.width = (w - 10) + "px";
		$("calendarDivMask").style.height = (h - 10) + "px";
		$("calendarDivMask").show();
		this.DateConstrainCal.render(document.body);
	},

// ================================================================================================== //
	doShowItemCalendar: function(whichDate) {
		// create calendar if not already initialized
		if (!this.ItemDateConstrainCal) {
			this.ItemDateConstrainCal = new YAHOO.widget.Calendar("ItemDateConstrainCal","item_calendarDiv");
			this.ItemDateConstrainCal.selectEvent.subscribe(this.dateItemSelected, this.ItemDateConstrainCal,true);
		}
		this.ItemDateConstrainCal.clear();
		// process click
		if (whichDate=='S') {
			if ($('item_checkboxDateStart').checked==false) { return; }
			var apos = Position.cumulativeOffset($('item_dropDateStart'));
			var cx = apos[0] - $("item_calendarDiv").getWidth() + $('item_dropDateStart').width + 3;
			var cy = apos[1] + $('item_dropDateStart').height + 3;
			$("item_calendarDiv").style.top = cy+'px';
			$("item_calendarDiv").style.left = cx+'px';
			$("item_constraintDateStart").select();
			var sDateValue = $('item_constraintDateStart').value;
		} else {
			if ($('item_checkboxDateEnd').checked==false) { return; }
			var apos = Position.cumulativeOffset($('item_dropDateEnd'));
			var cx = apos[0] - $("item_calendarDiv").getWidth() + $('item_dropDateEnd').width + 3;
			var cy = apos[1] + $('item_dropDateEnd').height + 3;
			$("item_calendarDiv").style.top = cy+'px';
			$("item_calendarDiv").style.left = cx+'px';
			$("item_constraintDateEnd").select();
			var sDateValue = $('item_constraintDateEnd').value;
		}
		var rxDate = /^\d{1,2}(\-|\/|\.)\d{1,2}\1\d{4}$/
		// mbucalo's more advanced date verification - var rxDate = /((((0[13578]|1[02])\/(0[1-9]|1[0-9]|2[0-9]|3[01]))|((0[469]|11)\/(0[1-9]|1[0-9]|2[0-9]|3[0]))|((02)(\/(0[1-9]|1[0-9]|2[0-8]))))\/(19([6-9][0-9])|20([0-9][0-9])))|((02)\/(29)\/(19(6[048]|7[26]|8[048]|9[26])|20(0[048]|1[26]|2[048])))/
		if (rxDate.test(sDateValue)) {
			var aDate = sDateValue.split(/\//);
			this.ItemDateConstrainCal.setMonth(aDate[0]-1);
			this.ItemDateConstrainCal.setYear(aDate[2]);
		} else {
			alert("Invalid Date Format, please use mm/dd/yyyy or select a date using the calendar.");
		}
		// save our date type on the calendar object for later use
		this.whichDate = whichDate;
		// display everything
		$("item_calendarDiv").show();
		
	 	var w =  window.innerWidth || (window.document.documentElement.clientWidth || window.document.body.clientWidth);
	    var h =  window.innerHeight || (window.document.documentElement.clientHeight || window.document.body.clientHeight);

		$("item_calendarDivMask").style.top = "0px";
		$("item_calendarDivMask").style.left = "0px";
		$("item_calendarDivMask").style.width = (w - 10) + "px";
		$("item_calendarDivMask").style.height = (h - 10) + "px";
		$("item_calendarDivMask").show();
		this.ItemDateConstrainCal.render(document.body);
	},

// ================================================================================================== //
	tqDoShowCalendar: function(whichDate) 
    {
	    // create calendar if not already initialized
	    if (!this.tqDateConstrainCal) 
        {
	        this.tqDateConstrainCal = new YAHOO.widget.Calendar("tqDateConstrainCal", "tqCalendarDiv");
	        this.tqDateConstrainCal.selectEvent.subscribe(this.tqDateSelected, this.tqDateConstrainCal, true);
	    }
	    this.tqDateConstrainCal.clear();
	    // process click
	    if (whichDate == 'S') {
	        if ($('tqCheckboxDateStart').checked == false) { return; }
	        var apos = Position.cumulativeOffset($('tqDropDateStart'));
	        var cx = apos[0] - $("tqCalendarDiv").getWidth() + $('tqDropDateStart').width + 3;
	        var cy = apos[1] + $('tqDropDateStart').height - 42;
	        $("tqCalendarDiv").style.top = cy + 'px';
	        $("tqCalendarDiv").style.left = cx + 'px';
	        $("tqConstraintDateStart").select();
	        var sDateValue = $('tqConstraintDateStart').value;
	    } else {
	        if ($('tqCheckboxDateEnd').checked == false) { return; }
	        var apos = Position.cumulativeOffset($('tqDropDateEnd'));
	        var cx = apos[0] - $("tqCalendarDiv").getWidth() + $('tqDropDateEnd').width + 3;
	        var cy = apos[1] + $('tqDropDateEnd').height - 42;
	        $("tqCalendarDiv").style.top = cy + 'px';
	        $("tqCalendarDiv").style.left = cx + 'px';
	        $("tqConstraintDateEnd").select();
	        var sDateValue = $('tqConstraintDateEnd').value;
	    }
	    var rxDate = /^\d{1,2}(\-|\/|\.)\d{1,2}\1\d{4}$/
	    if (rxDate.test(sDateValue)) {
	        var aDate = sDateValue.split(/\//);
	        this.tqDateConstrainCal.setMonth(aDate[0] - 1);
	        this.tqDateConstrainCal.setYear(aDate[2]);
	    } else {
	        alert("Invalid Date Format, please use mm/dd/yyyy or select a date using the calendar.");
	    }
	    // save our date type on the calendar object for later use
	    this.whichDate = whichDate;
	    // display everything
	    $("tqCalendarDiv").show();

	    var w = window.innerWidth || (window.document.documentElement.clientWidth || window.document.body.clientWidth);
	    var h = window.innerHeight || (window.document.documentElement.clientHeight || window.document.body.clientHeight);

	    $("tqCalendarDivMask").style.top = "0px";
	    $("tqCalendarDivMask").style.left = "0px";
	    $("tqCalendarDivMask").style.width = (w - 10) + "px";
	    $("tqCalendarDivMask").style.height = (h - 10) + "px";
	    $("tqCalendarDivMask").show();
	    this.tqDateConstrainCal.render(document.body);
	},
// ================================================================================================== //
	dateSelected: function(eventName, selectedDate) {
		// function is event callback fired by YUI Calendar control 
		// (this function looses it's class scope)
		var cScope = i2b2.CRC.ctrlr.dateConstraint;
		if (cScope.whichDate=='S') {
			var tn = $('constraintDateStart');
		} else {
			var tn = $('constraintDateEnd');
		}
		var selectDate = selectedDate[0][0];
		tn.value = selectDate[1]+'/'+selectDate[2]+'/'+selectDate[0];
		cScope.hideCalendar.call(cScope);
	},
	
// ================================================================================================== //
	dateItemSelected: function(eventName, selectedDate) {
		// function is event callback fired by YUI Calendar control 
		// (this function looses it's class scope)
		var cScope = i2b2.CRC.ctrlr.dateConstraint;
		if (cScope.whichDate=='S') {
			var tn = $('item_constraintDateStart');
		} else {
			var tn = $('item_constraintDateEnd');
		}
		var selectDate = selectedDate[0][0];
		tn.value = selectDate[1]+'/'+selectDate[2]+'/'+selectDate[0];
		cScope.hideItemCalendar.call(cScope);
	},

// ================================================================================================== //
	tqDateSelected: function(eventName, selectedDate) 
    {
	    // function is event callback fired by YUI Calendar control 
	    // (this function looses it's class scope)
	    var cScope = i2b2.CRC.ctrlr.dateConstraint;
	    if (cScope.whichDate == 'S') {
	        var tn = $('tqConstraintDateStart');
	    } else {
	        var tn = $('tqConstraintDateEnd');
	    }
	    var selectDate = selectedDate[0][0];
	    tn.value = selectDate[1] + '/' + selectDate[2] + '/' + selectDate[0];
	    cScope.tqHideCalendar.call(cScope);
	},

// ================================================================================================== //
	hideCalendar: function() {
		$("calendarDiv").hide();
		$("calendarDivMask").hide();
	},
	
// ================================================================================================== //
	hideItemCalendar: function() {
		$("item_calendarDiv").hide();
		$("item_calendarDivMask").hide();
	},

// ================================================================================================== //
	tqHideCalendar: function() {
	    $("tqCalendarDiv").hide();
	    $("tqCalendarDivMask").hide();
	},


// ================================================================================================== //
	doProcessDates: function(panelIndex) {
		// push the dates into the data model
		var sDate = new String;
		var sDateError = false;
		var rxDate = /^\d{1,2}(\-|\/|\.)\d{1,2}\1\d{4}$/
		// mbucalo's more advanced date verification - var rxDate = /((((0[13578]|1[02])\/(0[1-9]|1[0-9]|2[0-9]|3[01]))|((0[469]|11)\/(0[1-9]|1[0-9]|2[0-9]|3[0]))|((02)(\/(0[1-9]|1[0-9]|2[0-8]))))\/(19([6-9][0-9])|20([0-9][0-9])))|((02)\/(29)\/(19(6[048]|7[26]|8[048]|9[26])|20(0[048]|1[26]|2[048])))/
		var DateRecord = {};
		var dm = i2b2.CRC.model.queryCurrent.panels[i2b2.CRC.ctrlr.QT.temporalGroup][panelIndex];
		this.currentPanelIndex = panelIndex;
		// start date
		if ($('checkboxDateStart').checked) {
			DateRecord.Start = {};
			sDate = $('constraintDateStart').value;
			if (rxDate.test(sDate)) {
				var aDate = sDate.split(/\//);
				DateRecord.Start.Month = padNumber(aDate[0],2);
				DateRecord.Start.Day = padNumber(aDate[1],2);
				DateRecord.Start.Year = aDate[2];
			} else {
				sDateError = "Invalid Start Date\n";
			}
		}
		// end date
		if ($('checkboxDateEnd').checked) {
			DateRecord.End = {};
			sDate = $('constraintDateEnd').value;
			if (rxDate.test(sDate)) {
				var aDate = sDate.split(/\//);
				DateRecord.End.Month = padNumber(aDate[0]);
				DateRecord.End.Day = padNumber(aDate[1]);
				DateRecord.End.Year = aDate[2];
			} else {
				sDateError = "Invalid End Date\n";
			}
		}
		// check for processing errors
		if (sDateError) {
			sDateError += "\nPlease use the following format: mm/dd/yyyy";
			alert(sDateError);
			return false;
		} else {
			// attach the data to our panel data
			if (DateRecord.Start) {
				for(var i=0;i<dm.items.length;i++){
					dm.items[i].dateFrom = DateRecord.Start;
				}
				dm.dateFrom = DateRecord.Start;
			} else {
				for(var i=0;i<dm.items.length;i++){
					delete dm.items[i].dateFrom;
				}
				delete dm.dateFrom;
			}
			if (DateRecord.End) {
				for(var i=0;i<dm.items.length;i++){
					dm.items[i].dateTo = DateRecord.End;
				}
				dm.dateTo = DateRecord.End;
			} else {
				for(var i=0;i<dm.items.length;i++){
					delete dm.items[i].dateTo;
				}
				delete dm.dateTo;
			}
			
			for(var i=0;i<dm.items.length;i++){ // WEBCLIENT-133: Remove dates from patient_dimension concepts
				if(dm.items[i].origData.hasOwnProperty('table_name')){
					var table_name = dm.items[i].origData.table_name;
				} else { // lookup table_name
					var results = i2b2.ONT.ajax.GetTermInfo("ONT", {ont_max_records:'max="1"', ont_synonym_records:'false', ont_hidden_records: 'false', concept_key_value: dm.items[i].origData.key}).parse();
					if(results.model.length > 0){
						var table_name = results.model[0].origData.table_name;
					}
				}
				 if(typeof(table_name) != "undefined" && table_name.toLowerCase() == 'patient_dimension'){
 					delete dm.items[i].dateFrom;
					delete dm.items[i].dateTo;
					alert("Date constraints are not allowed on patient dimension concepts and will not be set.");
				}
			}
			
			
			// clear the query name and set the query as having dirty data
			var QT = i2b2.CRC.ctrlr.QT;
			QT.doSetQueryName.call(QT,'');
		}
		// redraw buttons if needed
		var panelctrlFound = false;
		var pd = i2b2.CRC.ctrlr.QT;
		for (var i=0; i<pd.panelControllers.length; i++) {
			if (pd.panelControllers[i].panelCurrentIndex == panelIndex) {
				// found the controller for the panel requested
				panelctrlFound = pd.panelControllers[i];
				break;
			}
		}
		if (panelctrlFound!==false) { panelctrlFound._redrawButtons(); panelctrlFound._redrawDates(); }
		return true;
	},
	
// ================================================================================================== //
	doProcessDate: function(panelIndex, itemIndex) {
		// push the date into the data model
		var sDate = new String;
		var sDateError = false;
		var rxDate = /^\d{1,2}(\-|\/|\.)\d{1,2}\1\d{4}$/
		// mbucalo's more advanced date verification - var rxDate = /((((0[13578]|1[02])\/(0[1-9]|1[0-9]|2[0-9]|3[01]))|((0[469]|11)\/(0[1-9]|1[0-9]|2[0-9]|3[0]))|((02)(\/(0[1-9]|1[0-9]|2[0-8]))))\/(19([6-9][0-9])|20([0-9][0-9])))|((02)\/(29)\/(19(6[048]|7[26]|8[048]|9[26])|20(0[048]|1[26]|2[048])))/
		var DateRecord = {};
		var dm = i2b2.CRC.model.queryCurrent.panels[i2b2.CRC.ctrlr.QT.temporalGroup][panelIndex];
		this.currentPanelIndex = panelIndex;
		// start date
		if ($('item_checkboxDateStart').checked) {
			DateRecord.Start = {};
			sDate = $('item_constraintDateStart').value;
			if (rxDate.test(sDate)) {
				var aDate = sDate.split(/\//);
				DateRecord.Start.Month = padNumber(aDate[0],2);
				DateRecord.Start.Day = padNumber(aDate[1],2);
				DateRecord.Start.Year = aDate[2];
			} else {
				sDateError = "Invalid Start Date\n";
			}
		}
		// end date
		if ($('item_checkboxDateEnd').checked) {
			DateRecord.End = {};
			sDate = $('item_constraintDateEnd').value;
			if (rxDate.test(sDate)) {
				var aDate = sDate.split(/\//);
				DateRecord.End.Month = padNumber(aDate[0]);
				DateRecord.End.Day = padNumber(aDate[1]);
				DateRecord.End.Year = aDate[2];
			} else {
				sDateError = "Invalid End Date\n";
			}
		}
		// check for processing errors
		if (sDateError) {
			sDateError += "\nPlease use the following format: mm/dd/yyyy";
			alert(sDateError);
			return false;
		} else {
			// attach the data to our panel data
			if (DateRecord.Start) {
				dm.items[itemIndex].dateFrom = DateRecord.Start;
				
			} else {
				delete dm.items[itemIndex].dateFrom;
			}
			if (DateRecord.End) {
				dm.items[itemIndex].dateTo = DateRecord.End;
			} else {
				delete dm.items[itemIndex].dateTo;
			}
			// clear the query name and set the query as having dirty data
			var QT = i2b2.CRC.ctrlr.QT;
			QT.doSetQueryName.call(QT,'');
		}
		
		var table_name="";
		if(dm.items[itemIndex].origData.hasOwnProperty('table_name') && typeof dm.items[itemIndex].origData.table_name != "undefined"){ // WEBCLIENT-133: Remove dates from patient_dimension concepts
			var table_name = dm.items[itemIndex].origData.table_name;
		} else { // lookup table_name
			if (typeof dm.items[itemIndex].origData.key != "undefined") {
				var results = i2b2.ONT.ajax.GetTermInfo("ONT", {ont_max_records:'max="1"', ont_synonym_records:'false', ont_hidden_records: 'false', concept_key_value: dm.items[itemIndex].origData.key}).parse();
				if(results.model.length > 0){
					var table_name = results.model[0].origData.table_name;
				}
			}
		}
		if(table_name.toLowerCase() == 'patient_dimension'){
			delete dm.items[itemIndex].dateFrom;
			delete dm.items[itemIndex].dateTo;
			alert("Date constraints are not allowed on patient dimension concepts and will not be set.");
		}
		
		
		// redraw buttons if needed
		var panelctrlFound = false;
		var pd = i2b2.CRC.ctrlr.QT;
		for (var i=0; i<pd.panelControllers.length; i++) {
			if (pd.panelControllers[i].panelCurrentIndex == panelIndex) {
				// found the controller for the panel requested
				panelctrlFound = pd.panelControllers[i];
				break;
			}
		}
		if (panelctrlFound!==false) { panelctrlFound._redrawButtons(); panelctrlFound._redrawDates(); }
		return true;
	},

    // ================================================================================================== //
	qtDoProcessDates: function(index) 
    {
	    // push the dates into the data model
	    var sDate = new String;
	    var sDateError = false;
	    var rxDate = /^\d{1,2}(\-|\/|\.)\d{1,2}\1\d{4}$/
	    var DateRecord = {};
	    // start date
	    if ($('tqCheckboxDateStart').checked) 
        {
	        DateRecord.Start = {};
	        sDate = $('tqConstraintDateStart').value;
	        if (rxDate.test(sDate)) 
            {
	            var aDate = sDate.split(/\//);
	            DateRecord.Start.Month = padNumber(aDate[0], 2);
	            DateRecord.Start.Day = padNumber(aDate[1], 2);
	            DateRecord.Start.Year = aDate[2];
	        } 
            else 
	            sDateError = "Invalid Start Date\n";
	    }
	    // end date
	    if ($('tqCheckboxDateEnd').checked) 
        {
	        DateRecord.End = {};
	        sDate = $('tqConstraintDateEnd').value;
	        if (rxDate.test(sDate)) 
            {
	            var aDate = sDate.split(/\//);
	            DateRecord.End.Month = padNumber(aDate[0]);
	            DateRecord.End.Day = padNumber(aDate[1]);
	            DateRecord.End.Year = aDate[2];
	        } 
            else
	            sDateError = "Invalid End Date\n";
	    }
	    // check for processing errors
	    if (sDateError) 
        {
	        sDateError += "\nPlease use the following format: mm/dd/yyyy";
	        alert(sDateError);
	        return false;
	    } 
        else 
        {
            if (index != null )  // apply to a particular item (targetDateModel is an sdxConcept, an item in panel.items[]
            {
                if (DateRecord.Start)
                    this.targetDateModel.dateFrom = DateRecord.Start;
                else
                    delete this.targetDateModel.dateFrom;
                if (DateRecord.End)
                    this.targetDateModel.dateTo = DateRecord.End;
                else
                    delete this.targetDateModel.dateTo;
                this.targetDateModel.parentPanel.redrawItemDates();
            }
            else// apply to all items in panel
            {
	            // attach the data to our panel data
	            if (DateRecord.Start) 
                {
	                for (var i = 0; i < this.targetDateModel.items.length; i++)
	                    this.targetDateModel.items[i].dateFrom = DateRecord.Start;
	                this.targetDateModel.dateFrom = DateRecord.Start;
	            } 
                else 
                {
	                for (var i = 0; i < this.targetDateModel.items.length; i++)
	                    delete this.targetDateModel.items[i].dateFrom;
	                delete this.targetDateModel.dateFrom;
	            }
	            if (DateRecord.End) 
                {
	                for (var i = 0; i < this.targetDateModel.items.length; i++)
	                    this.targetDateModel.items[i].dateTo = DateRecord.End;
	                this.targetDateModel.dateTo = DateRecord.End;
	            } 
                else 
                {
	                for (var i = 0; i < this.targetDateModel.items.length; i++)
	                    delete this.targetDateModel.items[i].dateTo;
	                delete this.targetDateModel.dateTo;
	            }
	            this.targetDateModel.redrawDateButton(); // redraw button
	            this.targetDateModel.redrawItemDates();
            }
	        // clear the query name and set the query as having dirty data
	        //var QT = i2b2.CRC.ctrlr.QT;
	        //QT.doSetQueryName.call(QT, '');
	    }
        return true;
	}
};


console.timeEnd('execute time');
console.groupEnd();
