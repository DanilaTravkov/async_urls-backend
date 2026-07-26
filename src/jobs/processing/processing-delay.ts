export abstract class ProcessingDelay {
  abstract wait(): Promise<void>;
}
