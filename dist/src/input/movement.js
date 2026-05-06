export function normalizeMovement(keys) {
    const x = Number(Boolean(keys.right)) - Number(Boolean(keys.left));
    const y = Number(Boolean(keys.down)) - Number(Boolean(keys.up));
    if (x === 0 && y === 0) {
        return { x: 0, y: 0 };
    }
    if (x !== 0 && y !== 0) {
        const diagonal = Math.SQRT1_2;
        return { x: x * diagonal, y: y * diagonal };
    }
    return { x, y };
}
