<?php
 
#-----------------------------------------------------------------------------------------------------------------------
# i2b2 Automatic Webclient Plugins Manager (installConfirm.php)
#-----------------------------------------------------------------------------------------------------------------------
# 2015-11-19 1.0.001 S.W.Chan      initialize with functionalities, error checkings, feedback messages, robustness, etc.
# 2015-11-30 1.0.002 S.W.Chan      fine-tuned dbg & user messages, etc. 
#-----------------------------------------------------------------------------------------------------------------------

$dbg = $_GET['dbg'];
$wcloc = $_GET['wc_loc'];
$plugin_folder = $_GET['dir'];
$plugin_pkg = $_GET['pkg'];

$err_msg = '';
if ("Y" == $dbg) {
  $dbg_msg = sprintf("<font color='blue' face='arial'><sub><small>debugging...<br/>dbg='%s', wcloc='%s', p_dir='%s', pkg='%s'<br/><br/>",
                     $dbg, $wcloc, $plugin_folder, $plugin_pkg);
} else {
  $dbg_msg = '';   
}

?>

<html>
<head>
 <link rel="stylesheet" type="text/css" href="style.css">
</head>
<body align="center" style="background-color:#FFFEEE" >
<h1 style="font-size:40px"><strong><em>i2b2</em></strong> Webclient Plugins Manager</h1>
<img src="i2b2-wcp2.png" alt="" width=480 height=280>
<form action="admin.php" method="POST" id="adminform">
 <span align="left">    
  <ul style="font-size:22px; margin-left:120px; margin-right:150px; text-align:justify; list-style-type:none">
<?php if ('' === realpath($plugin_folder)) { ?>
   <li>
      Please click the [Proceed] button below to confirm that you are aware that the installation of the specified i2b2 webclient plugin would result
      in all the current files within the <nobr>'<font color='blue'><?php echo $plugin_folder; ?></font>'</nobr> folder, of your server, being replaced.
   </li>
   <li>
      <br/>
      <font style="font-size:18px">
          <i>You may want to consider backing up or renaming that folder now before you proceed with the installation.</i>
      </font>
   </li>
<?php } else { ?>
   <li>
      Please click the [Proceed] button below to confirm that you are aware that the installation of the specified i2b2 webclient plugin would result
      in the <nobr>'<font color='blue'><?php echo $plugin_folder; ?></font>'</nobr> folder being created, along with the necessary files, on your server.
   </li>
<?php } ?>
   <li>
      <br/><br/>
      Conversely, please use the [Cancel] button below to close this browser tab page and return to the main page
      if you are not entirely sure.  
   </li>
   <li>
      <br/>
      Thank you.  
   </li>
  </ul>  
 </span>
 <br/><br/>
 <span align="center"  width="70%">
<?php
  print "<a class='btn' style='font-size:30px;' href='install.php?manifest=$plugin_pkg&wcloc=$wcloc' >&nbsp;&nbsp;Proceed&nbsp;&nbsp;</a>";     
?>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <a class='btn' style='font-size:30px;' href="#" onClick="self.close()">&nbsp;&nbsp;Cancel&nbsp;&nbsp;</a>
 </span>
</form>
<label><?php echo $dbg_msg; ?></label>
<br/><br/><br/><br/><hr/>
<font face="Arial" color="gray"><sub><small>Version 1.0</small></sub></font>
</body>
</html>