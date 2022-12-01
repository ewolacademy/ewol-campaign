const {
  expect
} = require("chai");
const hre = require("hardhat");

const registryContractName = 'EwolCampaignRegistry';
let registryInstance;
let registryAddress;

let prototypeAddress;

let stablecoinInstance;
let stablecoinAddress;

const sigInstances = {};
const sigAddrs = {};
const signerRoles = [
  'deployer',
  'nonOwner'
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


    it("Should deploy the ERC20", async function(){
      const ERC2OFactory = await hre.ethers.getContractFactory("ERC20Prototype", sigInstances.deployer);
      stablecoinInstance = await ERC2OFactory.deploy();
      await stablecoinInstance.deployed();

      stablecoinAddress = stablecoinInstance.address;
      console.log("ERC20StableCoin deployed to: ", stablecoinAddress);
    })


    it("Shall mint stablecoins for each role", async function(){
      const testSigners = await hre.ethers.getSigners();
      for (let iSigner = 0; iSigner < signerRoles.length; iSigner++) {
        const signerRole = signerRoles[iSigner];
        sigInstances[signerRole] = testSigners[iSigner];
        sigAddrs[signerRole] = await sigInstances[signerRole].getAddress();
        let mintTx = await stablecoinInstance.freeMint(sigAddrs[signerRole], 10000);
        mintTx.wait()

        expect(await stablecoinInstance.balanceOf(sigAddrs[signerRole])).to.equal(10000);
      }
    })

    
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
        stablecoinAddress,
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
