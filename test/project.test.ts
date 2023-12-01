import { assert } from "chai";
import path from "path";

import { useEnvironment } from "./helpers";

describe("Integration tests examples", function () {
  describe("HardhatConfig extension", function () {
    useEnvironment("hardhat-project");

    it("Should add the sponsoredUrl to the config", function () {
      assert.equal(this.hre.config.networks.localhost.sponsorUrl, "foo");
    });
  });
});
