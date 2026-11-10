import { HttpResponse } from 'msw';
import type { ApiErrorCode, ErrorResponse } from '@/types/chat';

/**
 * backend 공통 오류 응답 `{error_code, message, details}` 를 흉내 낸다 (계약 1.2절).
 * `details` 키는 늘 있고, 값이 없으면 null 이다.
 */
export function apiError(
  status: number,
  error_code: ApiErrorCode,
  message: string,
  details: ErrorResponse['details'] = null
) {
  return HttpResponse.json<ErrorResponse>({ error_code, message, details }, { status });
}
