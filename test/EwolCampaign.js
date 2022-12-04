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
  "nonOwner",
  "ewoler",
  "staff",
  "investor",
  "secondInvestor",
  "thirdInvestor"
];

const PERIODS = Object.freeze({
  INVESTMENT: 0,
  BOOTCAMP: 1,
  REPAYMENT: 2
});

describe("EwolCampaign", function () {
  describe("Initialization", function () {
    it("Should initialize signers", async function () {
      const testSigners = await hre.ethers.getSigners();
      for (let iSigner = 0; iSigner < signerRoles.length; iSigner++) {
        const signerRole = signerRoles[iSigner];
        sigInstances[signerRole] = testSigners[iSigner];
        sigAddrs[signerRole] = await sigInstances[signerRole].getAddress();
      }
    });


    it("Should deploy the ERC20", async function(){
      const ERC2OFactory = await hre.ethers.getContractFactory("Stablecoin", sigInstances.deployer);
      stablecoinInstance = await ERC2OFactory.deploy(0);
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
        let mintTx = await stablecoinInstance.mintTokens(sigAddrs[signerRole], 10000);
        mintTx.wait()

        expect(await stablecoinInstance.balanceOf(sigAddrs[signerRole])).to.equal(10000);
      }
    })

    
    it("Should deploy the stablecoin contract", async function () {
      const stablecoinFactory = await hre.ethers.getContractFactory(
        "Stablecoin",
        sigInstances.deployer
      );
      stablecoinInstance = await stablecoinFactory.deploy(0);
      await stablecoinInstance.deployed();

      stablecoinAddress = stablecoinInstance.address;

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
  });

  describe("EwolCampaignRegistry", function () {
    it("Should deploy the Registry contract which deploys an initial prototype", async function () {
      const registryFactory = await hre.ethers.getContractFactory(
        registryContractName,
        sigInstances.deployer
      );
      registryInstance = await registryFactory.deploy();

      await registryInstance.deployed();

      registryAddress = registryInstance.address;
      console.log("Registry contract deployed to:", registryAddress);
    });

    it("Should provide the initial prototype address", async function () {
      prototypeAddress = await registryInstance.prototypeAddress();

      console.log("Initial prototype contract deployed to:", prototypeAddress);

      expect(prototypeAddress)
        .to.be.a.properAddress;
      expect(prototypeAddress)
        .to.not.equal(hre.ethers.constants.AddressZero);
    });

    it("Should assign the Registry owner role to the contract deployer", async function () {
      const registryOwnerAddr = await registryInstance.owner();

      expect(registryOwnerAddr)
        .to.equal(sigAddrs.deployer);
    });

    it("Should enable the owner to launch a new campaign", async function () {
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

      const campaignLaunchedEvent = launchTxReceipt.events.find(
        (event) => event.event === "CampaignLaunched"
      );
      [campaignId, campaignAddress] = campaignLaunchedEvent.args;

      expect(campaignId)
        .to.equal(0);
      expect(campaignAddress)
        .to.be.a.properAddress;
      expect(campaignAddress)
        .to.not.equal(hre.ethers.constants.AddressZero);

      const campaignFactory = await hre.ethers.getContractFactory(
        "EwolCampaignPrototype",
        sigInstances.deployer
      );
      campaignInstance = campaignFactory.attach(campaignAddress);

      expect(await campaignInstance.name())
        .to.equal(campaignName);
      expect(await campaignInstance.targetEwolers())
        .to.equal(targetEwolers);
      expect(await campaignInstance.investmentPerEwoler())
        .to.equal(
          investmentPerEwoler
        );
      expect(await campaignInstance.currencyToken())
        .to.equal(
          stablecoinAddress
        );
      expect(await campaignInstance.weeksOfBootcamp())
        .to.equal(
          weeksOfBootcamp
        );

      expect(await campaignInstance.totalSupply())
        .to.equal(premintAmount);
      expect(await campaignInstance.balanceOf(sigAddrs.deployer))
        .to.equal(
          premintAmount
        );

      expect(await campaignInstance.owner())
        .to.equal(sigAddrs.deployer);

      expect(await campaignInstance.investmentCap())
        .to.equal(
          investmentPerEwoler.mul(targetEwolers)
        );
    });

    it("Should prevent a non owner from launching a new campaign", async function () {
      const registryInstanceForNonOwner = registryInstance.connect(
        sigInstances.nonOwner
      );
      const failedLaunchTxNonOwner = registryInstanceForNonOwner.launchCampaign(
        "",
        0,
        0,
        stablecoinAddress,
        0,
        0
      );

      expect(failedLaunchTxNonOwner)
        .to.be.revertedWith(
          "Ownable: caller is not the owner"
        );
    });
  });

  describe("EwolCampaignPrototype", function () {
    it("Should allow the owner to enroll an ewoler", async function () {

      const totalWeeklyExpenditureBefore = await campaignInstance.totalWeeklyExpenditure();

      const createEwolerTx = await campaignInstance.enrollEwoler(
        0,
        sigAddrs.ewoler,
        hre.ethers.utils.parseUnits("750.0", 18)
      );
      createEwolerTx.wait();

      const totalWeeklyExpenditureAfter = await campaignInstance.totalWeeklyExpenditure();

      expect(await campaignInstance.ewolerAddress(0))
        .to.equal(sigAddrs.ewoler);
      expect(await campaignInstance.ewolerWeeklyExpenditure(0))
        .to.equal(hre.ethers.utils.parseUnits("750.0", 18));
      expect(totalWeeklyExpenditureAfter.sub(totalWeeklyExpenditureBefore))
        .to.equal(hre.ethers.utils.parseUnits("750.0", 18));
    });

    it("Should prevent a non owner from create a new ewoler", async function () {
      const campaignInstanceForNonOwner = campaignInstance.connect(
        sigInstances.nonOwner
      );
      const failedEnrollTxNonOwner = campaignInstanceForNonOwner.enrollEwoler(
        1,
        sigAddrs.ewoler,
        hre.ethers.utils.parseUnits("75.0", 18)
      );
      expect(failedEnrollTxNonOwner)
        .to.be.revertedWith(
          "Ownable: caller is not the owner"
        );
    });

    it("Should prevent to enroll an ewoler that already exist", async function () {
      const createEwolerTx = campaignInstance.enrollEwoler(
        0,
        sigAddrs.ewoler,
        hre.ethers.utils.parseUnits("74.0", 18)
      );

      expect(createEwolerTx)
        .to.be.revertedWith("Ewoler already enrolled");
    });

    it("Should allow to enroll a staff-member", async function () {

      const totalWeeklyExpenditureBefore = await campaignInstance.totalWeeklyExpenditure();

      const enrollStaffTx = await campaignInstance.enrollStaff(
        0,
        sigAddrs.staff,
        hre.ethers.utils.parseUnits("750.0", 18),
        hre.ethers.utils.parseUnits("500.0", 18)
      );
      enrollStaffTx.wait();

      const totalWeeklyExpenditureAfter = await campaignInstance.totalWeeklyExpenditure();

      expect(await campaignInstance.stafferAddress(0))
        .to.equal(sigAddrs.staff);
      expect(await campaignInstance.stafferWeeklyExpenditure(0))
        .to.equal(hre.ethers.utils.parseUnits("750.0", 18));
      expect(totalWeeklyExpenditureAfter.sub(totalWeeklyExpenditureBefore))
        .to.equal(hre.ethers.utils.parseUnits("750.0", 18));

      expect(await campaignInstance.balanceOf(sigAddrs.staff))
        .to.equal(hre.ethers.utils.parseUnits("500.0", 18));

    });

    it("Should prevent a non owner from create a new staff-member", async function () {
      const campaignInstanceForNonOwner = campaignInstance.connect(
        sigInstances.nonOwner
      );
      const failedEnrollStaffTxNonOwner =
        campaignInstanceForNonOwner.enrollStaff(
          1,
          sigAddrs.ewoler,
          hre.ethers.utils.parseUnits("75.0", 18),
          hre.ethers.utils.parseUnits("50.0", 18)
        );
      expect(failedEnrollStaffTxNonOwner)
        .to.be.revertedWith(
          "Ownable: caller is not the owner"
        );
    });

    it("Should prevent to enroll a staff-member that already exist", async function () {
      const enrollStaffTx = campaignInstance.enrollStaff(
        0,
        sigAddrs.ewoler,
        hre.ethers.utils.parseUnits("74.0", 18),
        hre.ethers.utils.parseUnits("51.0", 18)
      );

      expect(enrollStaffTx)
        .to.be.revertedWith("Ewoler already enrolled");
      expect();
    });

    it("Should allow to deposit investment", async function () {

      stablecoinBalanceForInvestorBefore = await stablecoinInstance.balanceOf(sigAddrs.investor);

      const firstInvestorInstance = await campaignInstance.connect(
        sigInstances.investor
      );
      const investorStablecoinInstance = await stablecoinInstance.connect(
        sigInstances.investor
      );
      const approveToSpendTx = await investorStablecoinInstance.approve(
        campaignAddress,
        hre.ethers.utils.parseUnits("2000.0", 18)
      );
      await approveToSpendTx.wait();
      const investmentTx = await firstInvestorInstance.depositInvestment(
        stablecoinAddress,
        hre.ethers.utils.parseUnits("2000.0", 18)
      );
      await investmentTx.wait();

      stablecoinBalanceForInvestorAfter = await stablecoinInstance.balanceOf(sigAddrs.investor);

      expect(stablecoinBalanceForInvestorAfter.sub(stablecoinBalanceForInvestorBefore))
        .to.equal(
          hre.ethers.utils.parseUnits("-2000.0", 18)
        );
      expect(await campaignInstance.balanceOf(sigAddrs.investor))
        .to.equal(
          hre.ethers.utils.parseUnits("2000.0", 18)
        );
      expect(await campaignInstance.totalInvested())
        .to.equal(
          hre.ethers.utils.parseUnits("2000.0", 18)
        );
    });

    it("Should prevent the deposit of more than investCap", async function () {
      const totalInvestedBefore = await campaignInstance.totalInvested();
      const investmentCap = await campaignInstance.investmentCap();

      const investmentToOverflow = investmentCap.sub(totalInvestedBefore)
        .add(1);

      const secondInvestorInstance = await campaignInstance.connect(
        sigInstances.secondInvestor
      );
      const secondInvestorStablecoinInstance =
        await stablecoinInstance.connect(sigInstances.secondInvestor);
      const approveToSpend = await secondInvestorStablecoinInstance.approve(
        campaignAddress,
        investmentToOverflow
      );
      await approveToSpend.wait();

      const failedInvestmentTx = secondInvestorInstance.depositInvestment(
        stablecoinAddress,
        investmentToOverflow
      );
      expect(failedInvestmentTx)
        .to.be.revertedWith(
          "Deposit exceeds investment cap"
        );
    });

    it("Should prevent the deposit of an unupported token", async function () {
      const stablecoinFactory = await hre.ethers.getContractFactory(
        "Stablecoin",
        sigInstances.secondInvestor
      );
      const secondStablecoinInstance = await stablecoinFactory.deploy(
        hre.ethers.utils.parseUnits("200.0", 18)
      );
      await secondStablecoinInstance.deployed();
      const secondStablecoinAddress = await secondStablecoinInstance.address;

      const approveToSpend = await secondStablecoinInstance.approve(
        campaignAddress,
        hre.ethers.utils.parseUnits("200.0", 18)
      );
      await approveToSpend.wait();

      const secondInvestorCampaignInstance = await campaignInstance.connect(
        sigInstances.secondInvestor
      );
      const failedInvestmentTx = secondInvestorCampaignInstance.depositInvestment(
        secondStablecoinAddress,
        hre.ethers.utils.parseUnits("200.0", 18)
      );
      expect(failedInvestmentTx)
        .to.be.revertedWith("Deposit token not supported");
    });

    it("Should prevent the transition to Bootcamp period if weekly expenditure can't be sustained", async function () {

      const totalInvestedBefore = await campaignInstance.totalInvested();

      const totalWeeklyExpenditure = await campaignInstance.totalWeeklyExpenditure();
      const weeksOfBootcamp = await campaignInstance.weeksOfBootcamp();

      const totalToSpend = totalWeeklyExpenditure.mul(weeksOfBootcamp);

      const investmentNeeded = totalToSpend.sub(totalInvestedBefore);

      const thirdInvestorInstance = await campaignInstance.connect(
        sigInstances.thirdInvestor
      );
      const thirdInvestorStablecoinInstance = await stablecoinInstance.connect(
        sigInstances.thirdInvestor
      );
      const approveToSpendTx = await thirdInvestorStablecoinInstance.approve(
        campaignAddress,
        investmentNeeded.sub(1)
      );
      await approveToSpendTx.wait();
      const investmentTx = await thirdInvestorInstance.depositInvestment(
        stablecoinAddress,
        investmentNeeded.sub(1)
      );
      await investmentTx.wait();

      expect(await campaignInstance.totalInvested())
        .to.equal(totalToSpend.sub(1));

      const failedStartBootcampTx = campaignInstance.startBootcamp();
      expect(failedStartBootcampTx)
        .to.be.revertedWith("Not enough funds to start Bootcamp");
    });

    it("Should allow the transition to Bootcamp period if weekly expenditure can be sustained", async function () {

      const totalWeeklyExpenditure = await campaignInstance.totalWeeklyExpenditure();
      const weeksOfBootcamp = await campaignInstance.weeksOfBootcamp();

      const totalToSpend = totalWeeklyExpenditure.mul(weeksOfBootcamp);

      const thirdInvestorInstance = await campaignInstance.connect(
        sigInstances.thirdInvestor
      );
      const thirdInvestorStablecoinInstance = await stablecoinInstance.connect(
        sigInstances.thirdInvestor
      );
      const approveToSpendTx = await thirdInvestorStablecoinInstance.approve(
        campaignAddress,
        1
      );
      await approveToSpendTx.wait();
      const investmentTx = await thirdInvestorInstance.depositInvestment(
        stablecoinAddress,
        1
      );
      await investmentTx.wait();

      expect(await campaignInstance.totalInvested())
        .to.equal(totalToSpend);

      const startBootcampTx = await campaignInstance.startBootcamp();
      await startBootcampTx.wait();

      expect(await campaignInstance.currentPeriod())
        .to.equal(PERIODS.BOOTCAMP);
    });

    it("Should prevent investment deposit after the Investment period ", async function () {
      const investorInstance = await campaignInstance.connect(
        sigInstances.investor
      );
      const investorStablecoinInstance = await stablecoinInstance.connect(
        sigInstances.investor
      );
      const approveToSpend = await investorStablecoinInstance.approve(
        campaignAddress,
        hre.ethers.utils.parseUnits("2000.0", 18)
      );
      await approveToSpend.wait();
      const failedInvestmentTx = investorInstance.depositInvestment(
        stablecoinAddress,
        hre.ethers.utils.parseUnits("2000.0", 18)
      );
      expect(failedInvestmentTx)
        .to.be.revertedWith(
          "Method not available for this period"
        );
    });
  });

});
