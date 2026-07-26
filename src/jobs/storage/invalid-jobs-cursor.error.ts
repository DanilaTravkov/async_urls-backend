export class InvalidJobsCursorError extends Error {
  constructor() {
    super('The jobs cursor is invalid or no longer exists');
    this.name = InvalidJobsCursorError.name;
  }
}
