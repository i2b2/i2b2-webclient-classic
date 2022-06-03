<?php

session_start();

$hostname = filter_input(INPUT_SERVER, 'SERVER_NAME', FILTER_SANITIZE_STRING);
$shib_handler = filter_input(INPUT_SERVER, 'AJP_Shib-Handler', FILTER_SANITIZE_STRING);

$url = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]";

unset($_SESSION["eppn"]);
unset($_SESSION["shib-session-id"]);


header("Location: ${shib_handler}/Logout?return=${url}");
