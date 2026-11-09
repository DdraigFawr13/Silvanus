// Soak: seed 1, a bot that changes foragers at random, 10,000 ticks (J8).
import { content } from '@silvanus/content';
import { newGame, nextU32, step } from '@silvanus/sim';
import type { Command, LogEntry } from '@silvanus/sim';

const TICKS = 10_000;
let state = newGame(1, content);
let bot = 99;
let produced = 0;
let lost = 0;

function fail(message: string): never {
  console.error(`soak failed at tick ${state.tick}: ${message}`);
  process.exit(1);
}

const started = process.hrtime.bigint();
for (let i = 0; i < TICKS; i++) {
  const commands: Command[] = [];
  const first = nextU32(bot);
  bot = first.state;
  if (first.value % 24 === 0) {
    const second = nextU32(bot);
    bot = second.state;
    commands.push({ type: 'setForagers', count: second.value % 4 });
  }
  const before = state.tick;
  const result = step(state, commands, content);
  state = result.state;
  if (state.tick !== before + 1) fail(`tick went from ${before} to ${state.tick}`);
  const food = state.stock.food;
  if (!Number.isInteger(food) || food < 0 || food > content.resources.food.cap) {
    fail(`food ${food} is not a whole number from 0 to ${content.resources.food.cap}`);
  }
  for (const entry of result.log as LogEntry[]) {
    if (entry.type === 'produced') produced += entry.amount;
    if (entry.type === 'lost') lost += entry.amount;
  }
}
const seconds = Number(process.hrtime.bigint() - started) / 1e9;

if (produced <= 0) fail('produced is not above 0');
const perSecond = Math.round(TICKS / Math.max(seconds, 1e-9));
console.log(
  `ticks=${state.tick} food=${state.stock.food} produced=${produced} lost=${lost} ticks_per_s=${perSecond}`,
);
