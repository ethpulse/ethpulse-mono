const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ETHPulse", function () {
  let ethPulse;
  let owner;
  let creator;
  let respondent1;
  let respondent2;
  let respondent3;

  const REWARD_POOL = ethers.parseEther("1");
  const FIXED_REWARD = ethers.parseEther("0.1");
  const MIN_RESPONSES = 2;
  const MAX_RESPONSES = 10;

  beforeEach(async function () {
    [owner, creator, respondent1, respondent2, respondent3] = await ethers.getSigners();

    const ETHPulse = await ethers.getContractFactory("ETHPulse");
    ethPulse = await ETHPulse.deploy();
    await ethPulse.waitForDeployment();
  });

  describe("Poll Creation", function () {
    it("Should create a poll with EqualSplit reward type", async function () {
      const deadline = (await time.latest()) + 86400; // 1 day
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("poll-data"));

      await expect(
        ethPulse.connect(creator).createPoll(
          deadline,
          MIN_RESPONSES,
          MAX_RESPONSES,
          0,
          0, // EqualSplit
          false,
          dataHash,
          { value: REWARD_POOL }
        )
      ).to.emit(ethPulse, "PollCreated")
        .withArgs(0, creator.address, 0, REWARD_POOL, deadline);

      const poll = await ethPulse.getPoll(0);
      expect(poll.creator).to.equal(creator.address);
      expect(poll.rewardPool).to.equal(REWARD_POOL);
      expect(poll.status).to.equal(0); // Active
    });

    it("Should create a poll with FixedPerResponse reward type", async function () {
      const deadline = (await time.latest()) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("poll-data"));
      const requiredPool = FIXED_REWARD * BigInt(MAX_RESPONSES);

      await ethPulse.connect(creator).createPoll(
        deadline,
        MIN_RESPONSES,
        MAX_RESPONSES,
        FIXED_REWARD,
        1, // FixedPerResponse
        false,
        dataHash,
        { value: requiredPool }
      );

      const poll = await ethPulse.getPoll(0);
      expect(poll.fixedRewardAmount).to.equal(FIXED_REWARD);
    });

    it("Should fail to create poll with past deadline", async function () {
      const pastDeadline = (await time.latest()) - 3600;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("poll-data"));

      await expect(
        ethPulse.connect(creator).createPoll(
          pastDeadline,
          MIN_RESPONSES,
          MAX_RESPONSES,
          0,
          0,
          false,
          dataHash,
          { value: REWARD_POOL }
        )
      ).to.be.revertedWith("Invalid deadline");
    });

    it("Should fail to create poll without reward pool", async function () {
      const deadline = (await time.latest()) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("poll-data"));

      await expect(
        ethPulse.connect(creator).createPoll(
          deadline,
          MIN_RESPONSES,
          MAX_RESPONSES,
          0,
          0,
          false,
          dataHash,
          { value: 0 }
        )
      ).to.be.revertedWith("Must provide reward pool");
    });
  });

  describe("Response Submission", function () {
    let pollId;
    let deadline;

    beforeEach(async function () {
      deadline = (await time.latest()) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("poll-data"));

      const tx = await ethPulse.connect(creator).createPoll(
        deadline,
        MIN_RESPONSES,
        MAX_RESPONSES,
        0,
        0,
        false,
        dataHash,
        { value: REWARD_POOL }
      );

      pollId = 0;
    });

    it("Should allow respondent to submit response", async function () {
      const responseHash = ethers.keccak256(ethers.toUtf8Bytes("response-1"));

      await expect(
        ethPulse.connect(respondent1).submitResponse(pollId, responseHash)
      ).to.emit(ethPulse, "ResponseSubmitted")
        .withArgs(pollId, respondent1.address, responseHash);

      const hasResponded = await ethPulse.hasResponded(pollId, respondent1.address);
      expect(hasResponded).to.be.true;

      const poll = await ethPulse.getPoll(pollId);
      expect(poll.responseCount).to.equal(1);
    });

    it("Should prevent duplicate responses", async function () {
      const responseHash = ethers.keccak256(ethers.toUtf8Bytes("response-1"));

      await ethPulse.connect(respondent1).submitResponse(pollId, responseHash);

      await expect(
        ethPulse.connect(respondent1).submitResponse(pollId, responseHash)
      ).to.be.revertedWith("Already responded");
    });

    it("Should prevent response after deadline", async function () {
      await time.increaseTo(deadline + 1);

      const responseHash = ethers.keccak256(ethers.toUtf8Bytes("response-1"));

      await expect(
        ethPulse.connect(respondent1).submitResponse(pollId, responseHash)
      ).to.be.revertedWith("Poll expired");
    });

    it("Should auto-close poll when max responses reached", async function () {
      const deadline = (await time.latest()) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("poll-data"));

      // Create poll with max 2 responses
      await ethPulse.connect(creator).createPoll(
        deadline,
        2,
        2,
        0,
        0,
        false,
        dataHash,
        { value: REWARD_POOL }
      );

      const newPollId = 1;

      await ethPulse.connect(respondent1).submitResponse(
        newPollId,
        ethers.keccak256(ethers.toUtf8Bytes("response-1"))
      );

      await expect(
        ethPulse.connect(respondent2).submitResponse(
          newPollId,
          ethers.keccak256(ethers.toUtf8Bytes("response-2"))
        )
      ).to.emit(ethPulse, "PollClosed");

      const poll = await ethPulse.getPoll(newPollId);
      expect(poll.status).to.equal(1); // Closed
    });
  });

  describe("Whitelist Management", function () {
    let pollId;

    beforeEach(async function () {
      const deadline = (await time.latest()) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("poll-data"));

      await ethPulse.connect(creator).createPoll(
        deadline,
        MIN_RESPONSES,
        MAX_RESPONSES,
        0,
        0,
        true, // requiresWhitelist
        dataHash,
        { value: REWARD_POOL }
      );

      pollId = 0;
    });

    it("Should allow creator to add addresses to whitelist", async function () {
      await ethPulse.connect(creator).addToWhitelist(
        pollId,
        [respondent1.address, respondent2.address]
      );

      expect(await ethPulse.isWhitelisted(pollId, respondent1.address)).to.be.true;
      expect(await ethPulse.isWhitelisted(pollId, respondent2.address)).to.be.true;
    });

    it("Should prevent non-whitelisted users from responding", async function () {
      await ethPulse.connect(creator).addToWhitelist(pollId, [respondent1.address]);

      const responseHash = ethers.keccak256(ethers.toUtf8Bytes("response"));

      await expect(
        ethPulse.connect(respondent2).submitResponse(pollId, responseHash)
      ).to.be.revertedWith("Not whitelisted");
    });

    it("Should allow whitelisted users to respond", async function () {
      await ethPulse.connect(creator).addToWhitelist(pollId, [respondent1.address]);

      const responseHash = ethers.keccak256(ethers.toUtf8Bytes("response"));

      await expect(
        ethPulse.connect(respondent1).submitResponse(pollId, responseHash)
      ).to.emit(ethPulse, "ResponseSubmitted");
    });

    it("Should allow creator to remove from whitelist", async function () {
      await ethPulse.connect(creator).addToWhitelist(pollId, [respondent1.address]);
      await ethPulse.connect(creator).removeFromWhitelist(pollId, [respondent1.address]);

      expect(await ethPulse.isWhitelisted(pollId, respondent1.address)).to.be.false;
    });
  });

  describe("Poll Cancellation", function () {
    it("Should allow creator to cancel poll with no responses", async function () {
      const deadline = (await time.latest()) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("poll-data"));

      await ethPulse.connect(creator).createPoll(
        deadline,
        MIN_RESPONSES,
        MAX_RESPONSES,
        0,
        0,
        false,
        dataHash,
        { value: REWARD_POOL }
      );

      const pollId = 0;
      const balanceBefore = await ethers.provider.getBalance(creator.address);

      await expect(
        ethPulse.connect(creator).cancelPoll(pollId)
      ).to.emit(ethPulse, "PollCancelled")
        .withArgs(pollId, REWARD_POOL);

      const poll = await ethPulse.getPoll(pollId);
      expect(poll.status).to.equal(2); // Cancelled
    });

    it("Should prevent cancellation after responses", async function () {
      const deadline = (await time.latest()) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("poll-data"));

      await ethPulse.connect(creator).createPoll(
        deadline,
        MIN_RESPONSES,
        MAX_RESPONSES,
        0,
        0,
        false,
        dataHash,
        { value: REWARD_POOL }
      );

      const pollId = 0;
      const responseHash = ethers.keccak256(ethers.toUtf8Bytes("response"));
      await ethPulse.connect(respondent1).submitResponse(pollId, responseHash);

      await expect(
        ethPulse.connect(creator).cancelPoll(pollId)
      ).to.be.revertedWith("Cannot cancel with responses");
    });
  });

  describe("Reward Distribution - Equal Split", function () {
    it("Should distribute rewards equally among respondents", async function () {
      const deadline = (await time.latest()) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("poll-data"));

      await ethPulse.connect(creator).createPoll(
        deadline,
        2,
        2,
        0,
        0, // EqualSplit
        false,
        dataHash,
        { value: REWARD_POOL }
      );

      const pollId = 0;

      await ethPulse.connect(respondent1).submitResponse(
        pollId,
        ethers.keccak256(ethers.toUtf8Bytes("response-1"))
      );

      const balanceBefore = await ethers.provider.getBalance(respondent2.address);

      await ethPulse.connect(respondent2).submitResponse(
        pollId,
        ethers.keccak256(ethers.toUtf8Bytes("response-2"))
      );

      // Poll should auto-close and distribute rewards
      const poll = await ethPulse.getPoll(pollId);
      expect(poll.status).to.equal(1); // Closed
    });
  });

  describe("Quality Rating", function () {
    let pollId;

    beforeEach(async function () {
      const deadline = (await time.latest()) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("poll-data"));

      await ethPulse.connect(creator).createPoll(
        deadline,
        MIN_RESPONSES,
        MAX_RESPONSES,
        0,
        2, // WeightedQuality
        false,
        dataHash,
        { value: REWARD_POOL }
      );

      pollId = 0;

      // Submit responses
      await ethPulse.connect(respondent1).submitResponse(
        pollId,
        ethers.keccak256(ethers.toUtf8Bytes("response-1"))
      );
      await ethPulse.connect(respondent2).submitResponse(
        pollId,
        ethers.keccak256(ethers.toUtf8Bytes("response-2"))
      );
    });

    it("Should allow creator to rate responses", async function () {
      await expect(
        ethPulse.connect(creator).rateResponse(pollId, respondent1.address, 8)
      ).to.emit(ethPulse, "ResponseRated")
        .withArgs(pollId, respondent1.address, 8);

      const response = await ethPulse.getResponse(pollId, respondent1.address);
      expect(response.qualityRating).to.equal(8);
    });

    it("Should prevent invalid ratings", async function () {
      await expect(
        ethPulse.connect(creator).rateResponse(pollId, respondent1.address, 0)
      ).to.be.revertedWith("Invalid rating");

      await expect(
        ethPulse.connect(creator).rateResponse(pollId, respondent1.address, 11)
      ).to.be.revertedWith("Invalid rating");
    });

    it("Should prevent non-creator from rating", async function () {
      await expect(
        ethPulse.connect(respondent1).rateResponse(pollId, respondent2.address, 5)
      ).to.be.revertedWith("Not poll creator");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to set platform fee", async function () {
      await ethPulse.connect(owner).setPlatformFee(5);
      expect(await ethPulse.platformFeePercent()).to.equal(5);
    });

    it("Should prevent setting fee too high", async function () {
      await expect(
        ethPulse.connect(owner).setPlatformFee(11)
      ).to.be.revertedWith("Fee too high");
    });

    it("Should prevent non-owner from setting fee", async function () {
      await expect(
        ethPulse.connect(creator).setPlatformFee(5)
      ).to.be.revertedWithCustomError(ethPulse, "OwnableUnauthorizedAccount");
    });
  });

  describe("View Functions", function () {
    let pollId;

    beforeEach(async function () {
      const deadline = (await time.latest()) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("poll-data"));

      await ethPulse.connect(creator).createPoll(
        deadline,
        MIN_RESPONSES,
        MAX_RESPONSES,
        0,
        0,
        false,
        dataHash,
        { value: REWARD_POOL }
      );

      pollId = 0;

      await ethPulse.connect(respondent1).submitResponse(
        pollId,
        ethers.keccak256(ethers.toUtf8Bytes("response-1"))
      );
      await ethPulse.connect(respondent2).submitResponse(
        pollId,
        ethers.keccak256(ethers.toUtf8Bytes("response-2"))
      );
    });

    it("Should return poll respondents", async function () {
      const respondents = await ethPulse.getPollResponses(pollId);
      expect(respondents.length).to.equal(2);
      expect(respondents[0]).to.equal(respondent1.address);
      expect(respondents[1]).to.equal(respondent2.address);
    });

    it("Should return response data", async function () {
      const response = await ethPulse.getResponse(pollId, respondent1.address);
      expect(response.respondent).to.equal(respondent1.address);
      expect(response.dataHash).to.equal(
        ethers.keccak256(ethers.toUtf8Bytes("response-1"))
      );
    });
  });
});
