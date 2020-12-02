# The Problems With Macros

Clieunk aims for full compatibility with any macro that works in the Delta Tao
client.  This has proven an interesting and oftentimes frustrating challenge,
but in the course of that work I've developed the following thoughts.  The
executive summary: Clan Lord has leaned on the macro system to avoid improving
the user experience of the game, and this is bad for Clan Lord and limits the
chance of a serious revival.

## Creeping Complexity

Part of Clan Lord's strength is its simplicity -- there's a play area that you
click on, and a text box that you type in.  It is extremely easy to pick up and
learn.

However as time goes on and the game gains increasingly complex items and
abilities, the limitations of a command-line interface become more apparent.
At this point it is extremely difficult to effectively play a third-plus-circle
healer or a subclassed fighter without macros.  The daring and heroic chain
rescues that players so enjoy almost always require a macro.  Even mundane
tasks like fixing clothing or armor ends up automated by macros, because the
user interface for those abilities is so unergonomic.

Sometimes this complexity is enough that game features are ignored entirely.  I
have played Clan Lord since before the Sungem was added, and I have used
`/thinkgroup` perhaps twice -- it's simply too hard to use, and the benefit is
low enough that finding or writing a macro seems not worth the trouble.  I know
I'm not alone in this.

## Macros Are a Poor Solution

There are three ways to invoke a macro -- with a keystroke, with a command, or
with the mouse.  All three share some problems.

### Not Automatic

Players must produce or procure their own macros.  It is difficult for
technically-minded people to appreciate how daunting it is for nontechnical
people to download and install a macro file.

Many have observed that a disproportionate percentage of Clan Lord players work
in technical fields.  I submit that this is not coincidence; rather, the game
actively selects for it.

How?  Because macros are mandatory, and because...

### Macros Are Hard

The Clan Lord macro language is impressively permissive -- a non-programmer
modifying a simple macro can usually get it working.  This is an impressive
achievement, and as much as I may complain about the macro engine I
legitimately impressed at how well it succeeds here.

But as easy as *modification* may be, a non-programmer starting from a blank
slate is entirely lost.

And, as a curious corollary to the lax syntax, experienced programmers often
find Clan Lord macros extremely difficult to write -- the syntax is alien and
many of the lexical rules are surprising for people accustomed to modern
languages.

### Not Discoverable

At the end of the day, a set of well-executed macros replaces "a complex
command line interface" with "a different, and hopefully less-complex command
line interface... and also a bunch of keyboard shortcuts and click modifier
keys, all of which you need to memorize".

This is currently the best case for Clan Lord user experience, and *this is an
advanced user interface*.  A pro Starcraft player has all the hotkeys memorized
and never clicks any onscreen buttons... *but the buttons are still there*,
because the non-pro players *need* them to learn.  Clan Lord's *easy mode* is
*hard mode*.

If that statement were about game mechanics it would be defensible -- I may not
agree with it, but it is a design choice that could be made.  But difficulty
generated from an obtuse user interface is the sort of incidental complexity
that is clearly 'frustrating, not fun'.

## Goals

1. It should be possible for a new player to effectively play Clan Lord without
   typing any `/commands` at all.
2. It should be possible for players to assign keyboard shortcuts to items and
   abilities they use frequently, without writing any code.
3. It should be possible for players to create shortcuts for frequently
   performed actions (speaking, `/yell`, `/action`), without writing any code.
4. It should still be possible for advanced players to write macros to handle
   complex behaviors that aren't covered by the above.

## Plans

My vision for Clieunk has three main points.

### Command Buttons

Clieunk should 'know' every item and what commands it exposes, and display a
palette of buttons for those command.  Initially that palette would contain
only commands for currently-equipped items, but there would be a way for
players to 'pin' these command such that they are always visible.  Clicking a
pinned command for an unequipped item would equip it and invoke the command.

* Many of these commands would be straightforward: A bloodblade would expose a
  'Disable' button that simply sends `/use /disable`.  
* Others would be interactive -- clicking the Caduceus's 'Heal Target' button
  might gray out the play area and draw clickable circles around all valid
  targets.
* Others may be far more complex -- a Ranger morphing or a Bloodmage purging a
  single absorbed creature would require selecting from a list; a Mystic
  boosting might require sliders for range and intensity.

In addition to pinning commands, players would also have a GUI-driven means of
assigning keyboard shortcuts to these commands, or assigning click shortcuts to
them.  For click shortcuts, the same knowledge that lets the client
interactively gather parameters could be used to automatically detect and use
click targets or apply without a target.

#### Implementation

The most difficult part of create command buttons is obviously 'figuring out
what commands to display'.  There are two 'extreme' approaches and a variety of
in-between compromises.

##### Extreme: Fine, I'll do it myself

The simplest solution would be for me to build a `client_commands.json`
containing all the items I know about, and try to fake this.

This approach has some glaring weaknesses:

* Only works for items I know about; updating and fixing this client-side
  command database would be an ongoing maintenance cost.
* It's very difficult for this approach to be dynamic:
  * A Gossamer should not have a 'Study' button for non-rangers
  * A button for Rangers to change shape would require the client to send a
	`/useitem belt /reflect` command and catch and parse the output.
  * I believe there exist items where commands become available based on
    training; this may be solvable by having the client periodically issue a
	`/useitem <shoulder> /help` command, but it will become prohibitive.
* Without coordination, newly-added items would be 'broken' for GUI-reliant
  players until the client-side command database were refreshed.
* Without coordination, changed items would be 'broken' until the database were
  refreshed.

##### Other Extreme: Server-side control

The ideal implementation of this would be driven from the server side.  Imagine
a `/be-item-actions` command that informed the client of what actions are
available for currently-equipped items:

* Text label
* Associated item ID/sequence (for pinning and grouping)
* Image ID for button
* Command string (`/useitem belt /shape {morphtarget}`)
* Metadata needed to prompt for required parameters:
  * {morphtarget} /onefromlist 'Bat' 'Vermine' 'Rat'

Preferably items would be updated to support this new system, and proactively
push updates to the client as needed; after a ranger finishes studying a new
creature, the information above would be sent anew with a revised list of
targets.

The 'prompt mechanism' -- `/onefromlist` in the example above -- would
obviously need to be understood by the client, however it's likely that
eventually the client will have a library of known prompts and not require
further extension.

Driving this from the server side has some nice properties:

* It keeps commands secret from players inspecting data files
* It enables a fully dynamic interface as player characters unlock abilities
* It allows content-creators to work on a different iteration cycle than client
  developers.
* It potentially gives GMs a powerful new tool:
  * You walk into the new item-storage area; a script for the area sends you a
    new 'Take out of storage' button, which presents a menu of everything you
	have in storage.  The button may generate a `/storage /remove
	<number>`command that only works in this location, or speak a message in
	the proper format for an NPC to 'hear', or speak something in a coded
	format for an are script to 'hear' and which said script will mute.
	  
It also has a few downsides:

* The 'available command' messages may become quite large
* The server will likely need to maintain some state for identifying what
  commands a character currently sees
* This would probably require some degree of retrofitting to all existing items.

> I believe the above could be executed without changes to the CL server or the
> protocol.  If the 'visible commands list' is sent as text data with a `¬dd`
> prefix I suspect most clients that don't support these new features will
> simply ignore it.
>
> Alternatively, this could be implemented as a new segment of the Clan Lord
> UDP packet

##### In the middle

* Add a `/be-use` command that calls `/use` but wraps the response in `dd` tags
  so the client can capture and hide it.  Improve the tagging in `/use /help`
  responses to enable  the client to 'guess' what prompt mechanism is needed.
  * For some items ('no special use') it may work immediately.
  * I'm not sure how feasible this is technically.
* Add 'commands' as a new resource type in the `CL_Images` file.  The server
  indicates which commands are enabled.
  * This would save some network traffic, at the cost of making it possible for
    some players to uncover secrets in advance.


### 'QuickTalk'

> I'm not married to this name, but naming it makes it easier to discuss.

There is a 'Manage QuickTalk' window where players can provide some number of
'things they say or do often' and assign triggers to them.

> For Skirwan, one 'QuickTalk item' might be `/yell BEER!`.  I might assign a
> shortcut command like `/yb`, or a keystroke like `cmd-escape`.

If players want to create dances, they can expand the input field into a
multiline editor and input a sequence of `/pose` commands.  It may be useful to
put a 'pause after this line' checkbox on the right right of each such line.

QuickTalk should cover the vast majority of 'social macros'.

> In the future, QuickTalk will be extremely important for an iPad client;
> instead of displaying the keyboard (which covers half the screen and either
> shrinks or obscures the play area) players could tap a button to show a
> scrollable list of their QuickTalk items.

### True Macros

For everything else, there will still be macros.  Eventually, I'd like for them
to be managed by the client instead of sourced from a text file that users
manage; the current model doesn't work well with modern sandboxed macOS.

My primary goal here is to 're-scope' things so that true macros are really an
advanced feature for advanced players instead of a mandatory feature for every
player.

Beyond making Clan Lord more accessible to new players, I'm interested here
because I suspect a macro-enabled Clan Lord client would not be permitted into
the iPad App Store.

#### Corollary: Sharecads

The `/sharecads` macro exists because manually managing shares during a large
hunt is frustrating and un-fun for players.  It is widely used and generally
assumed to be ubiquitous.  There clearly exists a 'weak spot' in the game when
almost every player wishes to automate something.

It would be trivial to break `/sharecads` if the GM community so desired -
don't embed the name of the healer in the sidebar message, or always send two
sidebar messages with the healer name in the first.  Non-objection for a decade
constitutes tacit permission.

But the current situation is actively harmful to new players:

* They need to learn of `sharecads` and learn how to install it (no mean feet
  for non-technical players);
* If they are playing a healer, they will be a second-class citizen until they
  earn a Caduceus
  * An obvious corollary here is that healers who specialize in Moonstones,
    burst healing, or radius healing are seriously devalued.

It is well past time to build a `sharecads` alternative into the game.  I'm
sure every GM can think of a dozen designs for this.  I know I certainly have
thought.  I'm sure it's hard, but it is most emphatically worth it.
