/**
 * @projectDescription	View controller for the query report window (which is a GUI-only component of the CRC module).
 * @inherits 	i2b2.CRC.view
 * @namespace	i2b2.CRC.view.QueryReport
 * @author 		Bhaswati Ghosh
 * @version 	1.7.05
 * ----------------------------------------------------------------------------------------
 */
 
// Query Report BG
console.group('Load & Execute component file: CRC > view > QueryReport');
console.time('execute time');

// create and save the screen objects
i2b2.CRC.view.queryReport = new i2b2Base_cellViewController(i2b2.CRC, 'queryReport');
i2b2.CRC.view.queryReport.visible = false;

i2b2.CRC.view.queryReport.show = function() {
	i2b2.CRC.view.queryReport.visible = true;
	$('crcQueryReportBox').show();
}
i2b2.CRC.view.queryReport.hide = function() {
	i2b2.CRC.view.queryReport.visible = false;
	$('crcQueryReportBox').hide();
}

i2b2.CRC.view.queryReport.hideDisplay = function() {
	$('infoQueryStatusReport').hide();
}
i2b2.CRC.view.queryReport.showDisplay = function() {
	var targs = $('infoQueryStatusReport').parentNode.parentNode.select('DIV.tabBox.active');
	// remove all active tabs
	targs.each(function(el) { el.removeClassName('active'); });
	// set us as active
	$('infoQueryStatusReport').parentNode.parentNode.select('DIV.tabBox.tabQueryReport')[0].addClassName('active');
	
	$('infoQueryStatusText').hide();
	$('infoQueryStatusChart').hide();
	$('infoQueryStatusReport').show();
	// if($('infoQueryStatusReport').innerHTML=="")
	$('infoQueryStatusReport').innerHTML=="";
	//i2b2.CRC.ctrlr.QT.queryReport(false,"",false);
	i2b2.CRC.ctrlr.QT.doPrintQueryNew(false,"",false);
}
// ================================================================================================== //


console.timeEnd('execute time');
console.groupEnd();

// End Query Report BG
