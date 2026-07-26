export abstract class HttpHeadClient {
  abstract check(url: string): Promise<number>;
}
