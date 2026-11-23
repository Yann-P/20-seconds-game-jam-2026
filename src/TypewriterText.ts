import Phaser from "phaser";

const DELAY_BETWEEN_LETTERS_MS = 12;

export function addTypewriterText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  fullText: string,
  style: Phaser.Types.GameObjects.Text.TextStyle,
): Phaser.GameObjects.Text {
  const text = scene.add.text(x, y, "", style);
  const fullTextWithLineBreaks = text.getWrappedText(fullText).join("\n");
  let visibleLetterCount = 0;
  scene.time.addEvent({
    delay: DELAY_BETWEEN_LETTERS_MS,
    repeat: fullTextWithLineBreaks.length - 1,
    callback: () => {
      visibleLetterCount += 1;
      text.setText(fullTextWithLineBreaks.slice(0, visibleLetterCount));
    },
  });
  return text;
}
