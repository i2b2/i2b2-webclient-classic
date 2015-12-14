<?php
 
#------------------------------------------------------------------------------------------------------------
# i2b2 Automatic Webclient Plugins Manager (install.php)
#------------------------------------------------------------------------------------------------------------
# 2015-06-23 1.0.001 N.Wattanasin  initial prototype as proof of concept and layout of framework
# 2015-11-19 1.0.002 S.W.Chan      added functionalities, error checkings, feedback messages, robustness, etc.
#------------------------------------------------------------------------------------------------------------

function get_plugin($manifest_url) {
	$manifest_file = file_get_contents($manifest_url);
	$manifest = json_decode($manifest_file);
	return $manifest;
}

function dir_exist($dir, $webclient_path, $blue_phrase, $red_msg_start) {
    $path = realpath($dir); // get canonicalized absolute pathname
    $path_phrase = sprintf($blue_phrase, $path);
    $err_path_phrase = sprintf("<li>%sFolder</font> %s%s", $red_msg_start, $path_phrase, $red_msg_start);
    if (file_exists($path)) {
        if (is_dir($path)) {
            print sprintf("<li>Folder %s already exists.<br/><br/></li>", $path_phrase);
            return true;
        } else {
            print sprintf("%s already exists as a file, please fix and retry!</font></li>", $err_path_phrase);
            return false;
        }
    } else if (mkdir($path)) {
        print sprintf("<li>Folder %s has been created successfully<br/><br/><li>", $path_phrase);
        return true;
    } else {
        $msg = sprintf($blue_phrase, $webclient_path . "js-i2b2/cells/plugins/") . $err_path_phrase;
        print sprintf("%s could not be created, please check access right to %s and retry!</font></li>", $err_path_phrase, $msg);
        return false;
    }
}

$webclient_path = $_GET['wcloc'] . "/";
$plugin = get_plugin($_GET['manifest']);
$pkg = $plugin->package;
$grp = $plugin->group;
$forceDir = "cells/plugins/" . $plugin->group;
$path = $webclient_path . "js-i2b2/" . $forceDir . "/";

$blue = "<nobr>'<font color='blue'>%s</font>'</nobr>";
$red = "<font color='red'>";

?>

<html>
 <head>
  <link rel="stylesheet" type="text/css" href="style.css">
 </head>
 <body align="center" style="background-color:#FFFEEE" >
  <h1 style="font-size:40px"><strong><em>i2b2</em></strong> Webclient Plugins Manager</h1>
  <img src="i2b2-wcp2.png" alt="" width=480 height=280>
  <span align="left">
   <ul style="font-size:22px; margin-left:120px; margin-right:150px; list-style-type:none">
    
<?php
  if (!dir_exist($path, $webclient_path, $blue, $red)) {
    print "<li>Please use the [OK and Close] button below to close this browser tab page and return to the main page.<br/><br/></li>";
    die;
  }
  $tmpZip = $path . "temp.zip";
  $tmpZip_phrase = sprintf($blue, $tmpZip);
  print sprintf("<li>Copying %s<br/>to %s.<br/><br/></li>", sprintf($blue, $pkg), $tmpZip_phrase) ;
  copy($pkg, $tmpZip);
  if (file_exists($tmpZip)) {
    $zip = new ZipArchive;
    $res = $zip->open($tmpZip);
    $forceDir_phrase = sprintf($blue, $forceDir);
    $retry_forseDir_phrase = sprintf("</font> %s %s and retry!</font></li>", $forceDir_phrase, $red);
    if ($res === TRUE) {
	   $zip->extractTo($path);
       print sprintf("<li>Extracted %s<br/>to %s.<br/><br/></li>", $tmpZip_phrase, sprintf($blue, $path)); 
       $zip->close();
	   unlink($tmpZip);
       #-- next add ref of plugin to i2b2_loader.js --
	   $file_i2b2_loader = $webclient_path . "js-i2b2/i2b2_loader.js";
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
	       $file = fopen($file_i2b2_loader,"w");
           if ($file) {
               $key = "];\n";
	           $foundkey = false;
	           foreach($lines as $line){
		          if (strstr($line,$key)){
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
		          fwrite($file,$line); //place $line back in file
               }
	           fclose($file);
	           print "<li style='text-align:center'><br/><br/><font size='40' color='green'>Plugin installed!</font></li>";
           } else {
               print sprintf("<li>%s Please check wirte access to %s", $red, $retry_loader_phrase);
           }
       } else {
           print sprintf("<li>%s Please check read right to %s",$red, $retry_loader_phrase);
       }
    } else {
	   print sprintf("<li>%s Failed to unzip file, please check access right to %s", $red, $retry_forseDir_phrase);
    }
} else {
    print sprintf("<li>%s Please check access right to %s", $red, $retry_forseDir_phrase);
}
print "<li><br/><br/>Please use the [OK and Close] button below to close this browser tab page and return to the main page.<br/><br/></li>";

?>

   </ul>  
  </span>     
  <br/>
  <span align="center"  width="70%">
    <a  class='btn' style='font-size:30px;' href="javascript:window.close();">&nbsp;&nbsp;OK and Close&nbsp;&nbsp;</a>
  </span>
  <br/><br/><br/><br/><hr/>
  <font face="Arial" color="gray"><sub><small>Version 1.0</small></sub></font>
 </body>
</html>
