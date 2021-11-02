<?php

/**
 * index.php
 * 
 * Processing user registration for local, LDAP, NTLM, and OKTA accounts.
 * 
 * @author Kevin V. Bui
 */
session_start();

require_once('../i2b2.php');

date_default_timezone_set('America/New_York');

function isValid() {
    $hostname = trim(filter_input(INPUT_POST, 'hostName', FILTER_SANITIZE_STRING));
    $firstName = trim(filter_input(INPUT_POST, 'firstName', FILTER_SANITIZE_STRING));
    $lastName = trim(filter_input(INPUT_POST, 'lastName', FILTER_SANITIZE_STRING));
    $email = trim(filter_input(INPUT_POST, 'email', FILTER_SANITIZE_STRING));
    $username = trim(filter_input(INPUT_POST, 'username', FILTER_SANITIZE_STRING));
    $password = trim(filter_input(INPUT_POST, 'password', FILTER_SANITIZE_STRING));
    $confirmPassword = trim(filter_input(INPUT_POST, 'confirmPassword', FILTER_SANITIZE_STRING));
    $agree = filter_input(INPUT_POST, 'agree', FILTER_SANITIZE_STRING);

    $valid = true;

    // make sure all inputs are there
    if (strlen($hostname) == 0) {
        $_SESSION['error_msg'] = "Hostname is required.";
        $valid = false;
    } else if (strlen($firstName) == 0) {
        $_SESSION['error_msg'] = "First name is required.";
        $valid = false;
    } else if (strlen($lastName) == 0) {
        $_SESSION['error_msg'] = "Last name is required.";
        $valid = false;
    } else if (strlen($email) == 0) {
        $_SESSION['error_msg'] = "Email is required.";
        $valid = false;
    } else if (strlen($username) == 0) {
        $_SESSION['error_msg'] = "Username is required.";
        $valid = false;
    } else if (strlen($password) == 0) {
        $_SESSION['error_msg'] = "Password is required.";
        $valid = false;
    } else if (strlen($confirmPassword) == 0) {
        $_SESSION['error_msg'] = "Confirm Password is required.";
        $valid = false;
    } else if (!$agree) {
        $_SESSION['error_msg'] = "You must accept the terms and conditions.";
        $valid = false;
    }

    // make sure email is valid
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $_SESSION['error_msg'] = "Invalid email format.";
        $valid = false;
    }

    // make sure password and confirm password are equal
    if (strcmp($password, $confirmPassword) !== 0) {
        $_SESSION['error_msg'] = "Confirm password does not match the password.";
        $valid = false;
    }

    return $valid;
}

$postData = file_get_contents("php://input");
if (!empty($postData) && isValid()) {
    $hostname = trim(filter_input(INPUT_POST, 'hostName', FILTER_SANITIZE_STRING));
    $firstName = trim(filter_input(INPUT_POST, 'firstName', FILTER_SANITIZE_STRING));
    $lastName = trim(filter_input(INPUT_POST, 'lastName', FILTER_SANITIZE_STRING));
    $email = trim(filter_input(INPUT_POST, 'email', FILTER_SANITIZE_STRING));
    $username = trim(filter_input(INPUT_POST, 'username', FILTER_SANITIZE_STRING));
    $password = trim(filter_input(INPUT_POST, 'password', FILTER_SANITIZE_STRING));

    $full_name = "$firstName $lastName";

    $user_exists = userExists($username, getUser($username));
    if ($user_exists) {
        $_SESSION['error_msg'] = "The username has already been taken.  Please try another.";
    } else {
        $authMethod = strtoupper(trim(getAuthenticationMethod($hostname)));

        // generate secure, random default password of lenght 256*2=512 for NTLM,LDAP,OKTA accounts
        if (!empty($authMethod)) {
            $password = bin2hex(openssl_random_pseudo_bytes(256));
        }

        $result_status_error = hasErrorStatus(setUser($full_name, $email, $username, $password));
        if ($result_status_error) {
            $_SESSION['error_msg'] = "Sorry.  We are unable to sign you up at this time.  Please contact the admin.";
        } else {
            if (!empty($authMethod)) {
                addLoginAuthenticationMethod($username, $authMethod);
            }

            $_SESSION['success_msg'] = "Thank you for signing up!  We will contact you after your registration has been reviewed.";
        }
    }
}

$hostname = filter_input(INPUT_SERVER, 'SERVER_NAME', FILTER_SANITIZE_STRING);
$url = "https://${hostname}/webclient/";
header("Location: ${url}");
