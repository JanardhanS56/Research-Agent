import { describe, it, expect } from "vitest";
import { isSafeUrl } from "../lib/search";

describe("SSRF & URL Security Validation", () => {
  it("rejects non-HTTP protocols", () => {
    expect(isSafeUrl("file:///etc/passwd")).toBe(false);
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isSafeUrl("ftp://files.example.com/dump.tar")).toBe(false);
    expect(isSafeUrl("gopher://127.0.0.1:70/")).toBe(false);
  });

  it("blocks localhost and loopback IPv4 addresses", () => {
    expect(isSafeUrl("http://localhost/")).toBe(false);
    expect(isSafeUrl("http://localhost:3000/api")).toBe(false);
    expect(isSafeUrl("http://127.0.0.1/")).toBe(false);
    expect(isSafeUrl("http://127.0.0.1:8080/metrics")).toBe(false);
    expect(isSafeUrl("http://127.1.2.3/")).toBe(false);
    expect(isSafeUrl("http://0.0.0.0:5000/")).toBe(false);
  });

  it("blocks cloud metadata services and link-local ranges", () => {
    expect(isSafeUrl("http://169.254.169.254/latest/meta-data/")).toBe(false);
    expect(isSafeUrl("http://169.254.1.1/")).toBe(false);
    expect(isSafeUrl("http://metadata.google.internal/computeMetadata/v1/")).toBe(false);
    expect(isSafeUrl("http://metadata.internal/")).toBe(false);
    expect(isSafeUrl("http://instance-data/")).toBe(false);
  });

  it("blocks private RFC 1918 subnets", () => {
    expect(isSafeUrl("http://10.0.0.1/admin")).toBe(false);
    expect(isSafeUrl("http://10.254.0.1/status")).toBe(false);
    expect(isSafeUrl("http://192.168.1.1/router")).toBe(false);
    expect(isSafeUrl("http://172.16.0.1/")).toBe(false);
    expect(isSafeUrl("http://172.31.255.255/")).toBe(false);
  });

  it("blocks internal and local domain suffixes", () => {
    expect(isSafeUrl("http://service.local/api")).toBe(false);
    expect(isSafeUrl("http://backend.internal:9000/")).toBe(false);
    expect(isSafeUrl("http://database.lan/")).toBe(false);
    expect(isSafeUrl("http://intranet.corp/")).toBe(false);
  });

  it("blocks integer and hex IP evasion attempts", () => {
    expect(isSafeUrl("http://2130706433/")).toBe(false); // 127.0.0.1 as decimal
    expect(isSafeUrl("http://0x7f000001/")).toBe(false); // 127.0.0.1 as hex
  });

  it("blocks IPv6 loopback and private scopes", () => {
    expect(isSafeUrl("http://[::1]/")).toBe(false);
    expect(isSafeUrl("http://[fe80::1]/")).toBe(false);
  });

  it("allows legitimate public web URLs", () => {
    expect(isSafeUrl("https://en.wikipedia.org/wiki/Quantum_computing")).toBe(true);
    expect(isSafeUrl("https://arxiv.org/abs/2301.00001")).toBe(true);
    expect(isSafeUrl("https://developer.nvidia.com/docs")).toBe(true);
    expect(isSafeUrl("http://example.com/page?query=test#section")).toBe(true);
  });
});
