import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./sentry-logger", () => ({
  logger: { error: vi.fn(), breadcrumb: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import { logger } from "./sentry-logger";
import { ApiError } from "@/lib/api/api-error";
import { sentryApiClient } from "./sentry-api-client";

const apiError = (status: number, isNetworkError = false) =>
  new ApiError({ status, method: "GET", endpoint: "/v2/x", url: "http://t/v2/x", isNetworkError });

beforeEach(() => vi.clearAllMocks());

describe("sentryApiClient expectedStatuses (CC-153)", () => {
  it("keeps an expected 404 as a breadcrumb, not an error, and still rethrows", async () => {
    const err = apiError(404);
    await expect(sentryApiClient(() => Promise.reject(err), { module: "exam-page", expectedStatuses: [403, 404] })).rejects.toBe(err);
    expect(logger.breadcrumb).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("still reports a 500 as an error even when 404 is expected", async () => {
    const err = apiError(500);
    await expect(sentryApiClient(() => Promise.reject(err), { expectedStatuses: [404] })).rejects.toBe(err);
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.breadcrumb).not.toHaveBeenCalled();
  });

  it("without expectedStatuses a 404 is reported exactly as before", async () => {
    await expect(sentryApiClient(() => Promise.reject(apiError(404)), { module: "x" })).rejects.toBeInstanceOf(ApiError);
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.breadcrumb).not.toHaveBeenCalled();
  });

  it("a network failure is still a breadcrumb (unchanged)", async () => {
    await expect(sentryApiClient(() => Promise.reject(apiError(0, true)))).rejects.toBeInstanceOf(ApiError);
    expect(logger.breadcrumb).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("isExpected: an answer the caller handles on purpose is a breadcrumb, anything else is still an error", async () => {
    const handled = new ApiError({ status: 409, method: "POST", endpoint: "/v2/payment/create", url: "http://t/v2/payment/create", responseBody: '{"already_paid":true}' });
    const other409 = new ApiError({ status: 409, method: "POST", endpoint: "/v2/payment/create", url: "http://t/v2/payment/create", responseBody: '{"message":"conflict"}' });
    const isExpected = (e: unknown) => e instanceof ApiError && e.status === 409 && e.responseBody?.includes("already_paid") === true;

    await expect(sentryApiClient(() => Promise.reject(handled), { isExpected })).rejects.toBe(handled);
    expect(logger.breadcrumb).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();

    vi.clearAllMocks();
    await expect(sentryApiClient(() => Promise.reject(other409), { isExpected })).rejects.toBe(other409);
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.breadcrumb).not.toHaveBeenCalled();
  });

  it("isExpected that throws is treated as not expected (reported) and the original error is still rethrown", async () => {
    const err = apiError(409);
    await expect(sentryApiClient(() => Promise.reject(err), { isExpected: () => { throw new Error("boom"); } })).rejects.toBe(err);
    expect(logger.error).toHaveBeenCalledTimes(1);
  });

  it("a success passes the value through and logs nothing", async () => {
    await expect(sentryApiClient(() => Promise.resolve(42), { expectedStatuses: [404] })).resolves.toBe(42);
    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.breadcrumb).not.toHaveBeenCalled();
  });
});
