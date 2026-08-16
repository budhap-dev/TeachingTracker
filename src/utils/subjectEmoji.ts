/**
 * The emoji that stand for a subject — the set the Offerings flip cards have
 * used since REQ-016, and the set the Home chips burst on tap (REQ-051).
 *
 * One source for both: a chip that threw chemistry glassware while the card
 * behind it showed something else would read as a bug, and two copies of a
 * list like this drift the first time a subject is added.
 */
export const subjectEmoji = (name: string): string[] =>
    ({
        Mathematics: ['📐', '📏', '➗', '🔢', '📊'],
        Physics: ['⚛️', '🔭', '🧲', '💡', '🚀'],
        Chemistry: ['🧪', '⚗️', '🧫', '🔬', '💥'],
        Biology: ['🔬', '🧬', '🌱', '🦠', '🧠'],
    })[name] ?? ['📚', '✏️', '🎓', '🗺️', '🔎']
