# ChatApp

ChatApp provides an interface for user login and a standard template for
chat rooms with unlimited users. Using the ChatApp, users can.

1.  Sign in creating their own unique user name.
2.  Join an existing chat room or define a new one for personal use.
3.  Send and receive public messages on the chat room message board.
4.  Share their own personal location to the group with a clickable link
    to google maps.
5.  An administrative notice is given to room users when a new user joins
    the room.
6.  Administrative notice is also given to the chat room when users
    disconnect from the room.

On the server side, the application uses noje.js, express, and socket.io.  
In addition to socket.io, client support incorporates the Mustache npm
package for rendering chat room users and messages.

This application was orignally developed as part of the following course:
"The complete node.js developer course" by Andrew Mead which can be found
at: https://www.udemy.com/course/the-complete-nodejs-developer-course-2/
