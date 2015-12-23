<?php
header('Content-type: text/csv');
$filename = "i2b2-export_".$_GET['suffix']."_".date('Ymd-His').".csv";
header("Content-disposition: attachment;filename=\"$filename\"");
header("Pragma: public");
header("Cache-Control: ");
?>
<?php echo $_REQUEST['csvdata']?>