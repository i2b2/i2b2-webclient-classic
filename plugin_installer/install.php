<?php
 
#------------------------------------------------------------------------------------------------------------
# i2b2 Automatic Webclient Plugins Manager (install.php)
#------------------------------------------------------------------------------------------------------------
# 2015-06-23 1.0.001 N.Wattanasin  initial prototype as proof of concept and layout of framework
# 2015-11-19 1.0.002 S.W.Chan      added functionalities, error checkings, feedback messages, robustness, etc.
# 2015-12-18 1.0.003 S.W.Chan      added helper.php & config.php requirements 
#------------------------------------------------------------------------------------------------------------

require_once  'config.php'; # the configuration file defining the key variables
require_once  'helper.php'; # the functions file

//covering $_GET, $_POST, or $_COOKIE
$r = $_REQUEST['rul'];
$d = $_REQUEST['niamod'];
$u = $_REQUEST['esur'];    
$k = $_REQUEST['yek'];
$v = $_REQUEST['noisreVcw'];

if ('Y' == $dbg) $dbg_msg = sprintf("info: r='%s', d='%s', u='%s', k='%s', v='%s', admin='%s'<br/>", $r, $d, $u, $k, $v, $i2b2_admin);
if ('' != $r && '' != $d && '' != $u && '' != $k && '' != $v) {
    $i2b2_admin = checkAuth($r, $d, $u, $k, $v, $dbg);
    if ('Y' == $dbg) $dbg_msg = sprintf("info: r='%s', d='%s', u='%s', k='%s', v='%s', admin='%s'<br/>", $r, $d, $u, $k, $v, $i2b2_admin);
} else {
    $i2b2_admin = 'N';
}
genJsPostNextPageFunc($r, $d, $u, $k, $v); // to generate the javascript function postNextPage(), for 'install'

$wcloc = $webclient_path;
$plugin_pkg = $_REQUEST['pkg'];

if ('Y' == $dbg) {
  $dbg_msg = sprintf("<font color='blue' face='arial'><sub><small>debugging...<br/>dbg='%s', %s wcloc='%s', pkg='%s'<br/><br/>", $dbg, $dbg_msg, $wcloc, $plugin_pkg);
} else {
  $dbg_msg = '';   
}

$plugin = get_plugin_quick($plugin_pkg);
$pkg = $plugin->package;
$grp = $plugin->group;
$forceDir = "cells/plugins/" . $plugin->group;
$path = str_replace("//", "/", $webclient_path . "/js-i2b2/" . $forceDir . "/");

$blue = "<nobr>'<font color='blue'>%s</font>'</nobr>";
$red = "<font color='red'>";

?>

<html>
 <head>
  <link rel="stylesheet" type="text/css" href="style.css">
 </head>
 <body align="center" style="background-color:#FFFEEE" >
  <h1 style="font-size:40px"><strong><em>i2b2</em></strong> Webclient Plugins Manager</h1>
  <span align="left">
   <ul style="font-size:22px; margin-left:120px; margin-right:150px; list-style-type:none">
<?php if ('N' == $i2b2_admin) { ?>  
   <h2>
    <font color='red'>
        <b>Sorry, you are timed out (due to prolonged inactivities)!<br/>
        Please use the [Close] button below to close this page!</b>
    </font>
   </h2>  
   <br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</br/>
   <a class='btn' style='font-size:30px;' href='#' onClick='self.close()'>&nbsp;&nbsp;Close&nbsp;&nbsp;</a>    
<?php die; } ?>    
<?php
 if (dir_exist($path, $webclient_path, $blue, $red)) {
  $tmpZip = $path . "temp.zip";
  $tmpZip_phrase = sprintf($blue, $tmpZip);
  print sprintf("<li>Copying %s<br/>to %s.<br/><br/></li>", sprintf($blue, $pkg), $tmpZip_phrase) ;
  $path_phrase = sprintf($blue, $path);
  $retry_path_phrase = sprintf("</font> %s %s and retry!</font></li>", $path_phrase, $red);
  copy($pkg, $tmpZip);
  if (file_exists($tmpZip)) {
    $zip = new ZipArchive;
    $res = $zip->open($tmpZip);
    if (TRUE === $res) {
      $continue = true;
      $plugin_folder = $path . $plugin->id;
      if (file_exists($plugin_folder) && is_dir($plugin_folder)) {
         $t = getdate();
         $old_plugin_folder = $plugin_folder . "_pre" . $t[year] . $t[mon] . $t[mday] . $t[hours] . $t[minutes];  
         if (FALSE === rename($plugin_folder, $old_plugin_folder)) {
            print sprintf("<li>%s Attempt to rename existing '</font>%s %s folder (for backup) failed, please ensure the appropriate access and retry!</font></li>",
                          $red, sprintf($blue, $plugin_folder), $red);
            $continue = false;
         }
      }
      if ($continue) {    
       $tmpZipDirName = $path . trim($zip->getNameIndex(0), '/');
	   $zip->extractTo($path);
       print sprintf("<li>Extracted %s<br/>to %s.<br/><br/></li>", $tmpZip_phrase, sprintf($blue, $path)); 
       if (FALSE === rename($tmpZipDirName, $plugin_folder)) {
           print sprintf("<li><small>%s Attempt to rename raw extracted folder (%s)%s<br/>to %s %s failed, please check the access!</small></font></li>",
                         $red, sprintf($blue, $tmpZipDirName), $red, sprintf($blue, $plugin_folder), $red);
       } else {
           print sprintf("<li><small>Renamed raw extracted folder (%s)<br/>to %s.</small></li><br/>", 
                         sprintf($blue, $tmpZipDirName), sprintf($blue, $plugin_folder));
       }
       $zip->close();
	   unlink($tmpZip);
       #-- next add ref of plugin to i2b2_loader.js --
	   $file_i2b2_loader = str_replace("//", "/", $webclient_path . "js-i2b2/i2b2_loader.js");
       $loader_phrase = sprintf($blue, $file_i2b2_loader);
       $retry_loader_phrase = sprintf("</font> %s %s and retry!</font></li>", $loader_phrase, $red);
       print sprintf("<li>Updating %s to add reference to this plugin.<br/><br/></li>", $loader_phrase);
	   $fc = fopen ($file_i2b2_loader, "r");
       if ($fc) {
	       while (!feof ($fc)){  
		      $buffer = fgets($fc, 4096); 
		      $lines[] = $buffer; 
	       }
	       fclose($fc); 
	       $file = fopen($file_i2b2_loader, "w");
           if ($file) {
               $key = "];\n";
	           $foundkey = false;
	           foreach($lines as $line){
		          if (strstr($line, $key)){
			         if(!$foundkey){
				        fwrite($file, ',' . "\n");
				        fwrite($file, '	 {  code: "'.$plugin->id.'",' . "\n");
				        fwrite($file, '     forceLoading: true,' . "\n");
				        fwrite($file, '     forceConfigMsg: { params: [] },' . "\n");
				        fwrite($file, '     roles: '.str_replace("'", "\"", $plugin->roles).',' . "\n");
                        fwrite($file, '     forceDir: "' . $forceDir . '"' . "\n");
				        fwrite($file, '  }' . "\n"); 
				        $foundkey = true;
			         }
		          } 
		          fwrite($file, $line); //place $line back in file
               }
	           fclose($file);
	           print "<li style='text-align:center'><br/><br/><font size='40' color='green'>Plugin installed!</font></li>";
           } else {
               print sprintf("<li>%s Please check wirte access to %s", $red, $retry_loader_phrase);
           }
       } else {
           print sprintf("<li>%s Please check read right to %s",$red, $retry_loader_phrase);
       }
      }
    } else {
	   print sprintf("<li>%s Failed to unzip file, please check access right to %s", $red, $retry_path_phrase);
    }
  } else {
    print sprintf("<li>%s Sorry, plugin package %s does not exist, <br/>please check existance of %s, <br/>and access right to %s", 
                  $red, $tmpZip_phrase, sprintf($blue, $pkg), $retry_path_phrase);
  }
 }
 print "<li><br/><br/>Please use the [OK] button below to return to the main page.<br/><br/>Thank you.<br/><br/></li>";
?>
   </ul>  
  </span>     
  <br/>
  <span align="center"  width="70%">
   <a class='btn' style='font-size:30px;' onClick='postNextPage("admin.php", "", "")' href='#'>
      &nbsp;&nbsp;&nbsp;&nbsp;OK&nbsp;&nbsp;&nbsp;&nbsp;
   </a>
  </span>
  <br/><br/><br/><br/><hr/>
  <font face="Arial" color="gray"><sub><small>Version 1.0</small></sub></font>
 </body>
</html>
