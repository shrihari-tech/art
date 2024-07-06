// import {hardhat,ethers} from "hardhat";
// import pkg from 'hardhat';
// const {hardhat,ethers} = pkg;
const { ethers } = require('hardhat');
// import { expect } from "chai";

const { expect } = require("chai");

describe("SimpleArtMarketplace", function () {
  let SimpleArtMarketplace, simpleArtMarketplace, owner, artist, buyer;

  beforeEach(async function () {
    SimpleArtMarketplace = await ethers.getContractFactory("SimpleArtMarketplace");
    [owner, artist, buyer] = await ethers.getSigners();
    simpleArtMarketplace = await SimpleArtMarketplace.deploy();
    //await simpleArtMarketplace.deployed();
    await simpleArtMarketplace.setOwner(owner.address);
  });

  // it("should set the marketplace owner", async function () {
  //   expect(await simpleArtMarketplace.getOwner()).to.equal(owner.address);
  // });

  it("should create an art piece", async function () {
    const tx = await simpleArtMarketplace.connect(artist).createArt("Mona Lisa", "uri://monalisa", ethers.utils.parseEther("1"));
    await tx.wait();

    const art = await simpleArtMarketplace.artCollection(0);
    expect(art.name).to.equal("Mona Lisa");
    expect(art.uri).to.equal("uri://monalisa");
    expect(art.price).to.equal(ethers.utils.parseEther("1"));
    expect(art.creator).to.equal(artist.address);
    expect(art.forSale).to.be.true;
  });

  it("should list an art piece for sale", async function () {
    await simpleArtMarketplace.connect(artist).createArt("Mona Lisa", "uri://monalisa", ethers.utils.parseEther("1"));
    await simpleArtMarketplace.connect(artist).listArtForSale(1, ethers.utils.parseEther("2"));

    const art = await simpleArtMarketplace.artCollection(0);
    expect(art.forSale).to.be.true;
    expect(art.price).to.equal(ethers.utils.parseEther("2"));
  });

  it("should allow someone to buy an art piece", async function () {
    await simpleArtMarketplace.connect(artist).createArt("Mona Lisa", "uri://monalisa", ethers.utils.parseEther("1"));
    await simpleArtMarketplace.connect(artist).listArtForSale(1, ethers.utils.parseEther("1"));

    await expect(() =>
      simpleArtMarketplace.connect(buyer).buyArt(1, { value: ethers.utils.parseEther("1") })
    ).to.changeEtherBalances([artist, buyer], [ethers.utils.parseEther("1"), ethers.utils.parseEther("-1")]);

    const art = await simpleArtMarketplace.artCollection(0);
    expect(art.creator).to.equal(buyer.address);
    expect(art.forSale).to.be.false;
  });

  it("should fail if someone tries to list art they don't own", async function () {
    await simpleArtMarketplace.connect(artist).createArt("Mona Lisa", "uri://monalisa", ethers.utils.parseEther("1"));

    await expect(simpleArtMarketplace.connect(buyer).listArtForSale(1, ethers.utils.parseEther("2")))
      .to.be.revertedWith("Only the creator can list this art for sale");
  });

  it("should fail if someone tries to buy an art piece with insufficient funds", async function () {
    await simpleArtMarketplace.connect(artist).createArt("Mona Lisa", "uri://monalisa", ethers.utils.parseEther("1"));
    await simpleArtMarketplace.connect(artist).listArtForSale(1, ethers.utils.parseEther("1"));

    await expect(simpleArtMarketplace.connect(buyer).buyArt(1, { value: ethers.utils.parseEther("0.5") }))
      .to.be.revertedWith("Insufficient funds");
  });

  it("should invalidate an art piece", async function () {
    await simpleArtMarketplace.connect(artist).createArt("Mona Lisa", "uri://monalisa", ethers.utils.parseEther("1"));
    await simpleArtMarketplace.connect(owner).invalidateArt(1);

    const art = await simpleArtMarketplace.artCollection(0);
    expect(art.forSale).to.be.false;

    const invalidArt = await simpleArtMarketplace.invalidatedArt(0);
    expect(invalidArt.name).to.equal("Mona Lisa");
  });

  it("should not allow non-creator to invalidate an art piece", async function () {
    await simpleArtMarketplace.connect(artist).createArt("Mona Lisa", "uri://monalisa", ethers.utils.parseEther("1"));

    await expect(simpleArtMarketplace.connect(artist).invalidateArt(1))
      .to.be.revertedWith("Only the owner can perform this action");
  });

  it("should return all valid art pieces", async function () {
    await simpleArtMarketplace.connect(artist).createArt("Mona Lisa", "uri://monalisa", ethers.utils.parseEther("1"));
    await simpleArtMarketplace.connect(artist).createArt("Starry Night", "uri://starrynight", ethers.utils.parseEther("1"));

    const validArts = await simpleArtMarketplace.getValidArt();
    expect(validArts.length).to.equal(2);
    expect(validArts[0].name).to.equal("Mona Lisa");
    expect(validArts[1].name).to.equal("Starry Night");
  });

  it("should return all invalid art pieces", async function () {
    await simpleArtMarketplace.connect(artist).createArt("Mona Lisa", "uri://monalisa", ethers.utils.parseEther("1"));
    await simpleArtMarketplace.connect(owner).invalidateArt(1);

    const invalidArts = await simpleArtMarketplace.getInvalidatedArt();
    expect(invalidArts.length).to.equal(1);
    expect(invalidArts[0].name).to.equal("Mona Lisa");
  });
});