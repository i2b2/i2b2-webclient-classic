# i2b2 Web Client Installation

The [i2b2 Installation Guide](http://community.i2b2.org/wiki/display/getstarted/i2b2+Installation+Guide) contains detailed information about setting up the i2b2 in your environment. The installation of the i2b2 Web Client is addressed in [Chapter 7. i2b2 Web Client Install](http://community.i2b2.org/wiki/display/getstarted/Chapter+7.+i2b2+Web+Client+Install).

<br />

# i2b2 Admin Module Installation

The i2b2 Admin Module is used by administrators to setup and maintain the i2b2 environment(s). The i2b2 Web Client is installed on your Web Server, however the i2b2 Admin Module is installed on your i2b2 Server. To do this you will need to copy the Web Client source code to your i2b2 Server and rename it to "Admin". The only remaining steps is to make the following edits to the _i2b2\_config\_data.js_ and _i2b2\_loader.js_ files.

1. i2b2\_config\_data.js - Add the following to the list of domains.

        adminOnly: true,


2. i2b2\_loader.js - Comment out each of the following lines in the list of cells to load. 

        { "code: "ONT" },
        { "code: "CRC" },
        { "code: "WORK" },

<br />
To comment out the above lines out you need to add '//' in front of each line. You cannot do a multi-line comment tag.
<br/>

[Chapter 6. i2b2 Administration Module Install](http://community.i2b2.org/wiki/display/getstarted/Chapter+6.+i2b2+Administration+Module+Install) and [Chapter 14. Initial Setup of i2b2 in Admin](http://community.i2b2.org/wiki/display/getstarted/Chapter+6.+i2b2+Administration+Module+Install) of the i2b2 Installation Guide contain additional information on setting up the Admin module in your environment.
