import { describe, expect, it } from "vitest";
import {
  isDomainApiClientRelative,
  srcRoot,
  toSrcRelative,
  walkFiles
} from "./test-utils";

describe("architecture: api client/response pairing", () => {
  it("api配下の*.client.tsは対応する*.response.tsを持つ", () => {
    const allFiles = walkFiles(srcRoot).map(toSrcRelative);
    const clientFiles = allFiles.filter(isDomainApiClientRelative);

    expect(clientFiles.length).toBeGreaterThan(0);

    const missingPairs = clientFiles.filter((clientPath) => {
      const responsePath = clientPath.replace(".client.ts", ".response.ts");
      return !allFiles.includes(responsePath);
    });

    expect(missingPairs).toEqual([]);
  });
});
