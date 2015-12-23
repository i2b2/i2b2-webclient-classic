<?php
header("Content-type: application/vnd.ms-excel; name='excel'");
$filename = "i2b2-export_".$_GET['suffix']."_".date('Ymd-His').".html.xls";
header("Content-disposition: attachment;filename=\"$filename\"");
header("Pragma: public");
header("Cache-Control: ");
?>
<?php echo $_REQUEST['htmldata']?>