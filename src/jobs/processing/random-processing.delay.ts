import { Injectable } from '@nestjs/common';
import { setTimeout } from 'node:timers/promises';
import { ProcessingDelay } from './processing-delay';

const MAX_DELAY_MS = 10_000;

@Injectable()
export class RandomProcessingDelay extends ProcessingDelay {
  async wait(): Promise<void> {
    const delayMs = Math.floor(Math.random() * (MAX_DELAY_MS + 1));
    await setTimeout(delayMs);
  }
}
