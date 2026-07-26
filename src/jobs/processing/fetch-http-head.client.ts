import { Injectable } from '@nestjs/common';
import { HttpHeadClient } from './http-head-client';

const HEAD_REQUEST_TIMEOUT_MS = 10_000;

@Injectable()
export class FetchHttpHeadClient extends HttpHeadClient {
  async check(url: string): Promise<number> {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(HEAD_REQUEST_TIMEOUT_MS),
    });

    return response.status;
  }
}
