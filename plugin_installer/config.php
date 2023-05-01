<?php

#-------------------------------------------------------------------------------------------------------------------------
# i2b2 Automatic Webclient Plugins Manager v.1.0 Configuration File (config.php)
#-------------------------------------------------------------------------------------------------------------------------
# 2015-12-17 1.0.001 S.W.Chan      initialized.
# 2017-07-13 1.0.002 P.K.Ng (URMC) Added some generic directory detection
#-------------------------------------------------------------------------------------------------------------------------

### Configuration for Plugin Installer v.1.0 ###

# $webclient_path contains absolute local path to the i2b2 webclient
$webclient_path = ""; # be sure to fill in your actual webclient path here (ref: below), to use this installer
$webclient_path = dirname( __DIR__ )."/"; # on All boxes, add trailing slash as it is utilized later.

# This should be set to Y if you want debugging to be enabled for the installer module.
$dbg='N';

# $repo_url identifies the link to the repository of the available i2b2 webclient plugins
#  offical Repo: https://raw.githubusercontent.com/i2b2plugins/i2b2-catalogs/master/i2b2-wc.repo
$repo_url = "https://raw.githubusercontent.com/i2b2plugins/i2b2-catalogs/master/i2b2-wc.repo";

?>
