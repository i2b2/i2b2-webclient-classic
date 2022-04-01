<?php

$hostname = filter_input(INPUT_SERVER, 'SERVER_NAME', FILTER_SANITIZE_STRING);
header("Location: https://${hostname}/webclient/");
