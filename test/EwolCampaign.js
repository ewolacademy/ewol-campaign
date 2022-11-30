const {
  expect
} = require("chai");
const hre = require("hardhat");

const registryContractName = 'EwolCampaignRegistry';
const ewolTokenContractName = 'EwolERC20Token'
let registryInstance;
let registryAddress;

let prototypeAddress;
let ewolTokenInstance;
let ewolTokenAddress;

const sigInstances = {};
const sigAddrs = {};
const signerRoles = [
  'deployer',
  'nonOwner',
  'firstInvestor',
  'secondInvestor'
];

describe("EwolCampaign", function () {

  describe("EwolCampaignRegistry", function () {

    it('Should initialize signers', async function () {
      const testSigners = await hre.ethers.getSigners();
      for (let iSigner = 0; iSigner < signerRoles.length; iSigner++) {
        const signerRole = signerRoles[iSigner];
        sigInstances[signerRole] = testSigners[iSigner];
        sigAddrs[signerRole] = await sigInstances[signerRole].getAddress();
      }
    });

    it("Shall deploy the Registry contract which deploys an initial prototype", async function () {
      const registryFactory = await hre.ethers.getContractFactory(registryContractName, sigInstances.deployer);
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

    // TEST HECHO POR MI
    it("Shall deploy Ewol ERC20 Token", async function () {
      const ewolTokenFactory = await hre.ethers.getContractFactory(ewolTokenContractName, sigInstances.deployer);
      ewolTokenInstance = await ewolTokenFactory.deploy(1000);
      
      await ewolTokenInstance.deployed();
      ewolTokenAddress = ewolTokenInstance.address
      console.log("ERC20 Ewol Token Contract deployed to:", ewolTokenAddress);

      const totalSupply = await ewolTokenInstance.totalSupply()
      console.log("ERC20 Ewol Token Total Supply:", totalSupply.toNumber());

      expect(ewolTokenAddress)
        .to.be.a.properAddress;
      expect(ewolTokenAddress)
        .to.not.equal(hre.ethers.constants.AddressZero);
    });

    it("Shall return the balance owned by the ERC20 contract at the initial mint", async function() {
      const ERC20contractBalance = await ewolTokenInstance.balanceOf(ewolTokenInstance.address)
      console.log("ERC20 Contract Balance of EWTK:",ERC20contractBalance.toNumber())
      const totalSupply = await ewolTokenInstance.totalSupply()
      expect(ERC20contractBalance).to.equal(totalSupply);
    })

    it("Shall mint Tokens to an specific address & return the correct balance", async function() {
      const firstInvestorAddress = sigInstances.firstInvestor.address;
      const newMintTx = await ewolTokenInstance._mintTokens(firstInvestorAddress, 200)
      await newMintTx.wait();
      const totalSupply = await ewolTokenInstance.totalSupply()
      expect(totalSupply).to.equal("1200")

      const investorBalance = await ewolTokenInstance.balanceOf(firstInvestorAddress);
      expect(investorBalance).to.equal(200)
      
    })    

    it("Shall burn Tokens of an specific address & return the correct balance", async function() {
      const firstInvestorAddress = sigInstances.firstInvestor.address;
      const newBurnTx = await ewolTokenInstance._burnTokens(firstInvestorAddress, 100)
      await newBurnTx.wait();
      const totalSupply = await ewolTokenInstance.totalSupply()
      expect(totalSupply).to.equal("1100")

      const investorBalance = await ewolTokenInstance.balanceOf(firstInvestorAddress);
      expect(investorBalance).to.equal(100)
      
    })   

    it("Shall assign the Registry owner role to the contract deployer", async function () {
      const registryOwnerAddr = await registryInstance.owner();

      expect(registryOwnerAddr)
        .to.equal(sigAddrs.deployer);
    });

    it("Shall enable the owner to launch a new campaign", async function () {
      const campaignName = "EWOL Cohorte 1";
      const targetEwolers = 25;
      const investmentPerEwoler = hre.ethers.utils.parseUnits("2000.0", 18);

      const currencyToken = hre.ethers.constants.AddressZero; ////////////////////////// TO BE REPLACED

      const weeksOfBootcamp = 10;
      const premintAmount = hre.ethers.utils.parseUnits("5000.0", 18);

      const launchTx = await registryInstance.launchCampaign(
        campaignName,
        targetEwolers,
        investmentPerEwoler,
        currencyToken,
        weeksOfBootcamp,
        premintAmount
      );
      await launchTx.wait();
    });

    // it("Shall prevent a non owner from launching a new campaign", async function () {

    // });

    // TODO for tomorrow
    // Code a stablecoin contract:
    //  ERC20
    //  Ownable
    //  Mint method for owner
    //  Burn method for owner
    //  Add stablecoin deploy to tests initialization and store the address
  });
});
