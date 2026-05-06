import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeMovement } from '../dist/src/input/movement.js';

describe('normalizeMovement', () => {
  it('returns zero when no movement keys are pressed', () => {
    assert.deepEqual(normalizeMovement({}), { x: 0, y: 0 });
  });

  it('maps WASD-style cardinal movement to unit vectors', () => {
    assert.deepEqual(normalizeMovement({ up: true }), { x: 0, y: -1 });
    assert.deepEqual(normalizeMovement({ left: true }), { x: -1, y: 0 });
    assert.deepEqual(normalizeMovement({ down: true }), { x: 0, y: 1 });
    assert.deepEqual(normalizeMovement({ right: true }), { x: 1, y: 0 });
  });

  it('normalizes diagonal movement so it is not faster than cardinal movement', () => {
    const vector = normalizeMovement({ up: true, right: true });

    assert.equal(Math.abs(vector.x - Math.SQRT1_2) < 0.000001, true);
    assert.equal(Math.abs(vector.y + Math.SQRT1_2) < 0.000001, true);
    assert.equal(Math.abs(Math.hypot(vector.x, vector.y) - 1) < 0.000001, true);
  });

  it('cancels opposite directions', () => {
    assert.deepEqual(normalizeMovement({ left: true, right: true }), { x: 0, y: 0 });
    assert.deepEqual(normalizeMovement({ up: true, down: true }), { x: 0, y: 0 });
  });
});
