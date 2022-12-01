const {
  expect
} = require("chai");
const hre = require("hardhat");

const registryContractName = "EwolCampaignRegistry";
let registryInstance;
let registryAddress;

let prototypeAddress;

let stablecoinInstance;
let stablecoinAddress;

let campaignId;
let campaignAddress;
let campaignInstance;

const sigInstances = {};
const sigAddrs = {};
const signerRoles = [
  "deployer",
  "nonOwner"
];

describe("EwolCampaign", function () {
  describe("EwolCampaignRegistry", function () {

    it("Should initialize signers", async function () {
      const testSigners = await hre.ethers.getSigners();
      for (let iSigner = 0; iSigner < signerRoles.length; iSigner++) {
        const signerRole = signerRoles[iSigner];
        sigInstances[signerRole] = testSigners[iSigner];
        sigAddrs[signerRole] = await sigInstances[signerRole].getAddress();
      }
    });

    it("Should deploy the stablecoin contract", async function () {
      const stablecoinFactory = await hre.ethers.getContractFactory(
        "Stablecoin",
        sigInstances.deployer
      );
      stablecoinInstance = await stablecoinFactory.deploy(0);
      stablecoinAddress = await stablecoinInstance.address;
      await stablecoinInstance.deployed();

      const stablecoinSupply = await stablecoinInstance.totalSupply();
      expect(stablecoinSupply)
        .to.equal(0);

      const stablecoinOwner = await stablecoinInstance.owner();
      expect(stablecoinOwner)
        .to.equal(sigAddrs.deployer);
    });

    it("Should mint stablecoins for each role", async function () {
      for (let iSigner = 0; iSigner < signerRoles.length; iSigner++) {
        const signerRole = signerRoles[iSigner];
        const mintingTx = await stablecoinInstance.mintTokens(
          sigAddrs[signerRole],
          hre.ethers.utils.parseUnits("1000000.0", 18)
        );
        await mintingTx.wait();
      }
    });

    it("Shall deploy the Registry contract which deploys an initial prototype", async function () {
      const registryFactory = await hre.ethers.getContractFactory(
        registryContractName,
        sigInstances.deployer
      );
      registryInstance = await registryFactory.deploy();

      await registryInstance.deployed();

      registryAddress = registryInstance.address;
      console.log("Registry contract deployed to:", registryAddress);
    });

    it("Shall provide the initial prototype address", async function () {
      prototypeAddress = await registryInstance.prototypeAddress();

      console.log("Initial prototype contract deployed to:", prototypeAddress);

      expect(prototypeAddress)
        .to.be.a.properAddress;
      expect(prototypeAddress)
        .to.not.equal(hre.ethers.constants.AddressZero);
    });

    it("Shall assign the Registry owner role to the contract deployer", async function () {
      const registryOwnerAddr = await registryInstance.owner();

      expect(registryOwnerAddr)
        .to.equal(sigAddrs.deployer);
    });

    it("Shall enable the owner to launch a new campaign", async function () {
      const campaignName = "EWOL Cohorte 1";
      const targetEwolers = 25;
      const investmentPerEwoler = hre.ethers.utils.parseUnits("2000.0", 18);
      const weeksOfBootcamp = 10;
      const premintAmount = hre.ethers.utils.parseUnits("5000.0", 18);

      const launchTx = await registryInstance.launchCampaign(
        campaignName,
        targetEwolers,
        investmentPerEwoler,
        stablecoinAddress,
        weeksOfBootcamp,
        premintAmount
      );
      const launchTxReceipt = await launchTx.wait();

      const campaignLaunchedEvent = launchTxReceipt.events.find(event => event.event === 'CampaignLaunched');
      [campaignId, campaignAddress] = campaignLaunchedEvent.args;

      expect(campaignId)
        .to.equal(0);
      expect(campaignAddress)
        .to.be.a.properAddress;
      expect(campaignAddress)
        .to.not.equal(hre.ethers.constants.AddressZero);

      const campaignFactory = await hre.ethers.getContractFactory(
        'EwolCampaignPrototype',
        sigInstances.deployer
      );
      campaignInstance = campaignFactory.attach(campaignAddress);

      expect(await campaignInstance.name())
        .to.equal(campaignName);
      expect(await campaignInstance.targetEwolers())
        .to.equal(targetEwolers);
      expect(await campaignInstance.investmentPerEwoler())
        .to.equal(investmentPerEwoler);
      expect(await campaignInstance.currencyToken())
        .to.equal(stablecoinAddress);
      expect(await campaignInstance.weeksOfBootcamp())
        .to.equal(weeksOfBootcamp);

      expect(await campaignInstance.totalSupply())
        .to.equal(premintAmount);
      expect(await campaignInstance.balanceOf(sigAddrs.deployer))
        .to.equal(premintAmount);

      expect(await campaignInstance.owner())
        .to.equal(sigAddrs.deployer);

      expect(await campaignInstance.investmentCap())
        .to.equal(investmentPerEwoler.mul(targetEwolers));
    });

    it("Shall prevent a non owner from launching a new campaign", async function () {
      const registryInstanceForNonOwner = registryInstance.connect(sigInstances.nonOwner);
      const failedLaunchTxNonOwner = registryInstanceForNonOwner
        .launchCampaign("", 0, 0, stablecoinAddress, 0, 0);

      expect(failedLaunchTxNonOwner)
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
