# 20 seconds game jam

## Game mechanics

This is an auction.

The game has objects on sale. There are different collections, and different objects in each collection.

Each game is 20 seconds.

The flow is as follows:

- a "start game" screen
  - shows the player a "shopping list" of 5 items picked randomly among the collections.
  - requires the player to click a button to play

  The tricky bit of the game is that collection items sometimes look alike.

There is a timer on the top.

The scene is a auctioner presenting objects behind a desk and spectators.

The player is presented objects from different collections one by one and has to decide if they buy or not.

While the player is deciding, after a threshold of 800ms, other people in the auction room "spectators" start placing bids too, increasing the price of the object currently on display.

The increase materializes by a text on top of the spectator placing the bid and he, like, jumps a little.

After 5 seconds, someone buys the object and the opportunity is lost. There is no visual cue or timer for that.

The layout is the following:

- auction scene
  - top few pixels: timer.
  - two thirds left: scene
    - third left: auctioner with the price of the object and the object shown.
    - bottom third: spectators.
  - third right: hud (full height)
    - on top: how much money the player has
    - on the rest: each collections, using small items, and highlighting the ones that were bought. use 50% transparency
  - bottom few pixels: yes/no buttons
- results scene
