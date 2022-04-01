<?php

session_start();

$hostname = filter_input(INPUT_SERVER, 'SERVER_NAME', FILTER_SANITIZE_STRING);
$shib_handler = filter_input(INPUT_SERVER, 'AJP_Shib-Handler', FILTER_SANITIZE_STRING);

$url = "${shib_handler}/Logout?return=https://${hostname}/webclient/";

unset($_SESSION["eppn"]);
unset($_SESSION["shib-session-id"]);

header("Location: ${url}");
