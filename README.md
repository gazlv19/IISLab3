# IISLab3
Haptic interaction

A handwriting practice / learn to write game you can feel. Trace a shape on the screen with the mouse while a vibration motor on your finger tells you how you're doing. An ESP32 plays the vibrations, and P5 checks whether you're on the line.

Demo video: https://youtube.com/shorts/lw9Qm7O7snw 

CONTROLS

Hold the mouse down: trace the shape
Space: next shape
R: try the shape again

HOW TO PLAY

Start at the yellow dot and trace the shape, reaching each checkpoint in order. Each shape (L, 7, V, Z, O, star) is a level.

Staying on the line: soft, steady buzz
Reaching a checkpoint: short pulse
Going off the line: sharp, fast vibrations
Completing a level: heartbeat pattern

HOW TO RUN

1. Upload haptic_tracing.ino to the ESP32.
3. Run index.html on a live server.
4. Click "Connect ESP32", pick the serial port, and start tracing.

AI Use:
I used AI to help me learn how to connect VS Code to IDE and make them work together. I also asked questions to jog my memory on stylistic code.
