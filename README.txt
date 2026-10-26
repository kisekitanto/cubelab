CubeLab - Rubik's Cube 3x3 toolkit
==================================

Files
  index.html   page skeleton (header, menu, the Watch pop-up)
  style.css    all colors and layout
  app.js       everything else (timer, algorithms, trainer, 3D cube)

Run it
  Put the three files in the same folder and open index.html in your browser.
  No internet or server needed. After you edit a file, refresh the page
  (Ctrl+F5 / Cmd+Shift+R if you still see the old version).

Where to change things
  Colors / theme ....... top of style.css (the :root variables, light and dark)
  Beginner steps ....... app.js, the LS array ("beginner lessons"). Each step is
                         [title, text, [[name, algorithm, repeat]], [[demo...]]]
  OLL (57 cases) ....... app.js, the OLLS array (case N = Nth string)
  PLL (21 cases) ....... app.js, M.CFOP.sets.PLL = [["Aa","..."], ...]
  F2L (41 cases) ....... app.js, the F2 array: ["algorithm", groupNumber]
  Roux / ZZ sets ....... app.js, between /*ADV-START*/ and /*ADV-END*/
                         (CM42 = 42 CMLL, COL = 42 COLL, EOA = LSE edge orientation)
  Blindfold page ....... app.js, section BLINDFOLD (setup tables BES = edges,
                         BCS = corners; algorithms BT, BY, BP)
  Timer / scramble ..... app.js, sections TIMER and the scr() function
  Menu names ........... app.js, the TABS array

Notation in algorithms: U D L R F B (turns), ' = other way, 2 = half turn,
M E S slices, r l u d f b wide turns, x y z whole-cube rotations. Separate
moves with spaces.

Notes
  - Your solves, saved scrambles and edited algorithms are stored in the
    browser (localStorage), not in the files.
  - Edited/added algorithms are remembered by the ORIGINAL algorithm text.
    If you change an algorithm directly in app.js, your saved edits for the
    old text will no longer attach to it.
