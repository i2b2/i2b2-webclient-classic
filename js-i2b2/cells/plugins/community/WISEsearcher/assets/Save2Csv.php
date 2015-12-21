<?php
header("Content-Type: text/csv");
//header("Content-type: application/vnd.ms-excel");
//swc20120113 (v.1.1) developed [S. Wayne Chan, Biomedical Research Informatics Development Group, HIIS Div., QHS Dept., Univversity of Massachusetts Medical School]
//swc20120312 replaced '<?=' with '<?php echo ' in the <body> statement, per Greg Schulte (Children's Hospital Colorado), to prevent blank resulting .XLS due to 'short_open_tag = Off' in php.ini
//swc20120320 added more header statements & logic to prevent IE download glitches
header("Content-Disposition: csv" . date("Ymd") . ".csv");
//filename incorporates a caller-specifiable keyword as well as date-time stamp for uniqueness
$filename = "i2b2data_".$_GET['ext']."_".date('Ymd-His').".csv";
//header("Content-Disposition: filename=\"$filename\"");
header("Content-Disposition: attachment; filename=\"$filename\"");
// Fix for annoying IE bug in download.
//header("Pragma: ");
header("Pragma: public");
//header("Cache-Control: ");
header("Expires: 0");
header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
header("Cache-Control: public");
header("Content-Trabsfer-Encoding: binary");
//header("Content-Length: " . strlen($_REQUEST['datatocsv']));
if(strpos($_SERVER['HTTP_USER_AGENT'], 'MSIE')) {
 session_cache_limiter("public");
}
session_start();
if (isset($_POST['datatocsv'])) {
 $out = $_POST['datatocsv'];
 $out = str_replace("<table id=\"csvTable\"><tbody><tr><td>", "", $out); // remove prefix
 $out = str_replace("</td></tr></tbody></table>", "", $out); // remove postfix
 $out = str_replace("&amp;", "&", $out);
}
//Print the contents of out to the generated file.
//print $out;
echo $out; // echo is more efficient than print
//Exit the script
exit;
?>
<html>
<head></head>
<body><?php echo $_REQUEST['datatocsv']?>
</body>
</html>
