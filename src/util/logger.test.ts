import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger } from "./logger.js";

describe("logger", () => {
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stderrSpy = vi.spyOn(process.stderr, "write").mockReturnValue(true);
    logger.setLevel("debug"); // Enable all levels for testing
  });

  afterEach(() => {
    stderrSpy.mockRestore();
    logger.setLevel("info"); // Reset to default
  });

  // -------------------------------------------------------------------------
  // Level filtering
  // -------------------------------------------------------------------------

  it("logs at debug level when level is debug", () => {
    logger.debug("debug msg");
    expect(stderrSpy).toHaveBeenCalledOnce();
    expect(stderrSpy.mock.calls[0][0]).toContain("[DEBUG] debug msg");
  });

  it("logs at info level", () => {
    logger.info("info msg");
    expect(stderrSpy).toHaveBeenCalledOnce();
    expect(stderrSpy.mock.calls[0][0]).toContain("[INFO] info msg");
  });

  it("logs at warn level", () => {
    logger.warn("warn msg");
    expect(stderrSpy).toHaveBeenCalledOnce();
    expect(stderrSpy.mock.calls[0][0]).toContain("[WARN] warn msg");
  });

  it("logs at error level", () => {
    logger.error("error msg");
    expect(stderrSpy).toHaveBeenCalledOnce();
    expect(stderrSpy.mock.calls[0][0]).toContain("[ERROR] error msg");
  });

  it("suppresses debug when level is info", () => {
    logger.setLevel("info");
    logger.debug("should not appear");
    expect(stderrSpy).not.toHaveBeenCalled();
  });

  it("suppresses debug and info when level is warn", () => {
    logger.setLevel("warn");
    logger.debug("no");
    logger.info("no");
    expect(stderrSpy).not.toHaveBeenCalled();
    logger.warn("yes");
    expect(stderrSpy).toHaveBeenCalledOnce();
  });

  it("only allows error when level is error", () => {
    logger.setLevel("error");
    logger.debug("no");
    logger.info("no");
    logger.warn("no");
    expect(stderrSpy).not.toHaveBeenCalled();
    logger.error("yes");
    expect(stderrSpy).toHaveBeenCalledOnce();
  });

  // -------------------------------------------------------------------------
  // Output format
  // -------------------------------------------------------------------------

  it("includes ISO timestamp in output", () => {
    logger.info("timestamp test");
    const output = stderrSpy.mock.calls[0][0] as string;
    // ISO format: [2026-03-25T...Z]
    expect(output).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z\]/);
  });

  it("ends output with newline", () => {
    logger.info("newline test");
    const output = stderrSpy.mock.calls[0][0] as string;
    expect(output.endsWith("\n")).toBe(true);
  });

  // -------------------------------------------------------------------------
  // setLevel
  // -------------------------------------------------------------------------

  it("setLevel changes the current log level", () => {
    logger.setLevel("error");
    logger.info("suppressed");
    expect(stderrSpy).not.toHaveBeenCalled();

    logger.setLevel("debug");
    logger.info("visible");
    expect(stderrSpy).toHaveBeenCalledOnce();
  });

  // -------------------------------------------------------------------------
  // withAccount
  // -------------------------------------------------------------------------

  describe("withAccount", () => {
    it("returns a sub-logger that prefixes messages with accountId", () => {
      const accountLogger = logger.withAccount("test-account");
      accountLogger.info("hello");
      expect(stderrSpy).toHaveBeenCalledOnce();
      const output = stderrSpy.mock.calls[0][0] as string;
      expect(output).toContain("[INFO] [test-account] hello");
    });

    it("sub-logger respects current log level", () => {
      logger.setLevel("error");
      const accountLogger = logger.withAccount("test-account");
      accountLogger.debug("no");
      accountLogger.info("no");
      accountLogger.warn("no");
      expect(stderrSpy).not.toHaveBeenCalled();
      accountLogger.error("yes");
      expect(stderrSpy).toHaveBeenCalledOnce();
    });

    it("sub-logger has all four log methods", () => {
      const accountLogger = logger.withAccount("acc");
      accountLogger.debug("d");
      accountLogger.info("i");
      accountLogger.warn("w");
      accountLogger.error("e");
      expect(stderrSpy).toHaveBeenCalledTimes(4);
    });

    it("getLogFilePath returns stderr", () => {
      const accountLogger = logger.withAccount("acc");
      expect(accountLogger.getLogFilePath()).toBe("stderr");
    });
  });
});
