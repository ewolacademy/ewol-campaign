const {
  expect
} = require("chai");
const hre = require("hardhat");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const {
  weeks,
  days,
} = require("@nomicfoundation/hardhat-network-helpers/dist/src/helpers/time/duration");

const registryContractName = "EwolCampaignRegistry";
let registryInstance;
let registryAddress;

let prototypeAddress;

// const stablecoinAbi = require("./abi/DAI.json");
// const stablecoinAddress = "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063"; // DAI
// const stablecoinInstance = new hre.ethers.Contract(stablecoinAddress, stablecoinAbi, hre.ethers.provider);

// const investmentTokenAddress = "0x82E64f49Ed5EC1bC6e43DAD4FC8Af9bb3A2312EE"; // aPolDAI
// let investmentPoolAddress;

let campaignId;
let campaignAddress;
let campaignInstance;

const wmaticAbi = require("./abi/WMatic.json");
const wmaticAddress = "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270";

const routerV3Abi = require("./abi/SwapRouter.json");
const routerV3Address = "0xe592427a0aece92de3edee1f18e0157c05861564";

const stablecoinAbi = require("./abi/WMatic.json");
const stablecoinAddress = "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270"; // WMATIC used as a fake stablecoin
const stablecoinInstance = new hre.ethers.Contract(stablecoinAddress, stablecoinAbi, hre.ethers.provider);

const investmentTokenAbi = require("./abi/aPolWMatic.json");
const investmentTokenAddress = "0x6d80113e533a2C0fe82EaBD35f1875DcEA89Ea97"; // aPolWMATIC
const investmentTokenInstance = new hre.ethers.Contract(investmentTokenAddress, stablecoinAbi, hre.ethers.provider);
// let investmentPoolAddress;

const sigInstances = {};
const sigAddrs = {};
const signerRoles = [
  "deployer",
  "nonOwner",
  "ewoler",
  "staff",
  "investor",
  "secondInvestor",
  "thirdInvestor",
  "stranger",
];

const PERIODS = Object.freeze({
  INVESTMENT: 0,
  BOOTCAMP: 1,
  REPAYMENT: 2,
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

    it("Should convert 10,000 MATIC of each signers balance in WMATIC to use as fake stablecoins", async function () {
      for (signerRole of signerRoles) {
        const wmaticInstanceForSigner = new hre.ethers.Contract(wmaticAddress, wmaticAbi, sigInstances[signerRole]);

        const balanceWMaticBefore = await wmaticInstanceForSigner.balanceOf(sigAddrs[signerRole])

        const wrappingTx = await wmaticInstanceForSigner.deposit({
          value: hre.ethers.utils.parseEther("10000.0")
        });
        await wrappingTx.wait();

        const balanceWMaticAfter = await wmaticInstanceForSigner.balanceOf(sigAddrs[signerRole])
        expect(balanceWMaticAfter.sub(balanceWMaticBefore))
          .to.equal(hre.ethers.utils.parseEther("10000.0"));
      };
    });

    // it("Should convert 10,000 WMATIC to DAI for each signer", async function () {
    //   console.log("Code at", routerV3Address, await hre.ethers.provider.getCode(routerV3Address));
    //   console.log("Storage at pos 0 of", routerV3Address, await hre.ethers.provider.getStorageAt(routerV3Address, 0));
    //   for (signerRole of signerRoles) {
    //     const wmaticInstanceForSigner = new hre.ethers.Contract(wmaticAddress, wmaticAbi, sigInstances[signerRole]);

    //     const approvalTx = await wmaticInstanceForSigner.approve(routerV3Address, hre.ethers.utils.parseEther("10000.0"));
    //     await approvalTx.wait()

    //     const balanceWMaticBefore = await wmaticInstanceForSigner.balanceOf(sigAddrs[signerRole])
    //     const balanceStablecoinBefore = await stablecoinInstance.balanceOf(sigAddrs[signerRole])

    //     console.log("beforeSwap");

    //     const lastBlock = await hre.ethers.provider.getBlock(await hre.ethers.provider.getBlockNumber())

    //     console.log(lastBlock);

    //     const routerV3InstanceForSigner = new hre.ethers.Contract(routerV3Address, routerV3Abi, sigInstances[signerRole]);

    //     const swapTx = await routerV3InstanceForSigner.exactInputSingle({
    //       tokenIn: wmaticAddress,
    //       tokenOut: stablecoinAddress,
    //       fee: 3000,
    //       recipient: sigAddrs[signerRole],
    //       deadline: lastBlock.timestamp + 100,
    //       amountIn: hre.ethers.utils.parseEther("10000.0"),
    //       amountOutMinimum: 0,
    //       sqrtPriceLimitX96: 0
    //     });
    //     console.log("afterSwapTx");
    //     await swapTx.wait();

    //     console.log("afterSwapWait");

    //     const balanceWMaticAfter = await wmaticInstanceForSigner.balanceOf(sigAddrs[signerRole])
    //     const balanceStablecoinAfter = await stablecoinInstance.balanceOf(sigAddrs[signerRole])

    //     const stablecoinsReceived = balanceStablecoinAfter.sub(balanceStablecoinBefore);
    //     const stablecoinsReceivedText = hre.ethers.utils.formatUnits(stablecoinsReceived, 18);

    //     console.log(`Swap for '${signerRole}' got us ${stablecoinsReceivedText} DAI in exchange for 10,000 WMATIC`);
    //   }
    // });

    // it("Should deploy the stablecoin contract", async function () {
    //   const stablecoinFactory = await hre.ethers.getContractFactory(
    //     "Stablecoin",
    //     sigInstances.deployer
    //   );
    //   stablecoinInstance = await stablecoinFactory.deploy(0);
    //   await stablecoinInstance.deployed();

    //   stablecoinAddress = stablecoinInstance.address;

    //   const stablecoinSupply = await stablecoinInstance.totalSupply();
    //   expect(stablecoinSupply)
    //     .to.equal(0);

    //   const stablecoinOwner = await stablecoinInstance.owner();
    //   expect(stablecoinOwner)
    //     .to.equal(sigAddrs.deployer);
    // });

    // it("Should mint stablecoins for each role", async function () {
    //   for (let iSigner = 0; iSigner < signerRoles.length; iSigner++) {
    //     const signerRole = signerRoles[iSigner];
    //     const mintingTx = await stablecoinInstance.mintTokens(
    //       sigAddrs[signerRole],
    //       hre.ethers.utils.parseUnits("1000000.0", 18)
    //     );
    //     await mintingTx.wait();
    //   }
    // });
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
      const costForEwoler = hre.ethers.utils.parseUnits("2700.0", 18);
      const weeksOfBootcamp = 10;
      const premintAmount = hre.ethers.utils.parseUnits("5000.0", 18);

      const launchTx = await registryInstance.launchCampaign(
        campaignName,
        targetEwolers,
        investmentPerEwoler,
        costForEwoler,
        stablecoinAddress,
        investmentTokenAddress,
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
      expect(await campaignInstance.costForEwoler())
        .to.equal(costForEwoler);
      expect((await campaignInstance.currencyToken())
          .toLowerCase())
        .to.equal(
          stablecoinAddress.toLowerCase()
        );
      expect((await campaignInstance.investmentToken())
          .toLowerCase())
        .to.equal(
          investmentTokenAddress.toLowerCase()
        );
      // expect((await campaignInstance.investmentPool()).toLowerCase())
      //   .to.equal(
      //     investmentPoolAddress.toLowerCase()
      //   );
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
        0,
        stablecoinAddress,
        investmentTokenAddress,
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

    describe("Investment Period", function () {

      it("Should allow the owner to enroll an ewoler", async function () {
        const totalWeeklyExpenditureBefore =
          await campaignInstance.totalWeeklyExpenditure();

        const createEwolerTx = await campaignInstance.enrollEwoler(
          0,
          sigAddrs.ewoler,
          hre.ethers.utils.parseUnits("750.0", 18)
        );
        createEwolerTx.wait();

        const totalWeeklyExpenditureAfter =
          await campaignInstance.totalWeeklyExpenditure();

        expect(await campaignInstance.ewolerAddress(0))
          .to.equal(sigAddrs.ewoler);
        expect(await campaignInstance.ewolerWeeklyExpenditure(0))
          .to.equal(
            hre.ethers.utils.parseUnits("750.0", 18)
          );
        expect(
            totalWeeklyExpenditureAfter.sub(totalWeeklyExpenditureBefore)
          )
          .to.equal(hre.ethers.utils.parseUnits("750.0", 18));
      });

      it("Should prevent a non owner from enrolling a new ewoler", async function () {
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

      it("Should prevent the enrolling of an ewoler that already exist", async function () {
        const createEwolerTx = campaignInstance.enrollEwoler(
          0,
          sigAddrs.ewoler,
          hre.ethers.utils.parseUnits("74.0", 18)
        );

        expect(createEwolerTx)
          .to.be.revertedWith("Ewoler already enrolled");
      });

      it("Should allow the owner to enroll a staff-member", async function () {
        const totalWeeklyExpenditureBefore =
          await campaignInstance.totalWeeklyExpenditure();

        const enrollStaffTx = await campaignInstance.enrollStaff(
          0,
          sigAddrs.staff,
          hre.ethers.utils.parseUnits("750.0", 18),
          hre.ethers.utils.parseUnits("500.0", 18)
        );
        enrollStaffTx.wait();

        const totalWeeklyExpenditureAfter =
          await campaignInstance.totalWeeklyExpenditure();

        expect(await campaignInstance.stafferAddress(0))
          .to.equal(sigAddrs.staff);
        expect(await campaignInstance.stafferWeeklyExpenditure(0))
          .to.equal(
            hre.ethers.utils.parseUnits("750.0", 18)
          );
        expect(
            totalWeeklyExpenditureAfter.sub(totalWeeklyExpenditureBefore)
          )
          .to.equal(hre.ethers.utils.parseUnits("750.0", 18));

        expect(await campaignInstance.balanceOf(sigAddrs.staff))
          .to.equal(
            hre.ethers.utils.parseUnits("500.0", 18)
          );
      });

      it("Should prevent a non owner from enrolling a new staff-member", async function () {
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

      it("Should prevent the enrolling of a staff-member that already exist", async function () {
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

      it("Should allow an investor to deposit investment", async function () {
        stablecoinBalanceForInvestorBefore = await stablecoinInstance.balanceOf(
          sigAddrs.investor
        );

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

        stablecoinBalanceForInvestorAfter = await stablecoinInstance.balanceOf(
          sigAddrs.investor
        );

        expect(
            stablecoinBalanceForInvestorAfter.sub(
              stablecoinBalanceForInvestorBefore
            )
          )
          .to.equal(hre.ethers.utils.parseUnits("-2000.0", 18));
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

        const investmentToOverflow = investmentCap
          .sub(totalInvestedBefore)
          .add(1);

        const secondInvestorInstance = await campaignInstance.connect(
          sigInstances.secondInvestor
        );
        const secondInvestorStablecoinInstance = await stablecoinInstance.connect(
          sigInstances.secondInvestor
        );
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
        const failedInvestmentTx =
          secondInvestorCampaignInstance.depositInvestment(
            secondStablecoinAddress,
            hre.ethers.utils.parseUnits("200.0", 18)
          );
        expect(failedInvestmentTx)
          .to.be.revertedWith(
            "Deposit token not supported"
          );
      });

      it("Should prevent the inquiry of Pending Expenditure for Ewoler/Staff before transition to Bootcamp period", async function () {
        const failedEwolerPendingExpenditureTx =
          campaignInstance.pendingEwolerExpenditure(0);
        expect(failedEwolerPendingExpenditureTx)
          .to.be.revertedWith(
            "Bootcamp hasn't started"
          );

        const failedStafferPendingExpenditureTx =
          campaignInstance.pendingEwolerExpenditure(0);
        expect(failedStafferPendingExpenditureTx)
          .to.be.revertedWith(
            "Bootcamp hasn't started"
          );
      });

      it("Should prevent the transition to Bootcamp period if weekly expenditure can't be sustained", async function () {
        const totalInvestedBefore = await campaignInstance.totalInvested();

        const totalWeeklyExpenditure =
          await campaignInstance.totalWeeklyExpenditure();
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
          .to.equal(
            totalToSpend.sub(1)
          );

        const failedStartBootcampTx = campaignInstance.startBootcamp();
        expect(failedStartBootcampTx)
          .to.be.revertedWith(
            "Not enough funds to start Bootcamp"
          );
      });

      it("Should allow the transition to Bootcamp period if weekly expenditure can be sustained", async function () {
        const totalWeeklyExpenditure =
          await campaignInstance.totalWeeklyExpenditure();
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
    });

    describe("Bootcamp Period", function () {
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

      it("Should return 0 Pending Expenditure for Ewoler/Staff if bootcamp time < 1 week", async function () {
        await helpers.time.increase(days(2)); // Increase time 2 days

        const ewolerPendingExpenditure =
          await campaignInstance.pendingEwolerExpenditure(0);
        expect(ewolerPendingExpenditure)
          .to.equal(0);

        const staffPendingExpenditure =
          await campaignInstance.pendingEwolerExpenditure(0);
        expect(staffPendingExpenditure)
          .to.equal(0);
      });

      it("Should return Ewoler & Staff pending Expenditure when elapsed time > 1 week", async function () {
        const firstEwolerWeeklyExpenditure =
          await campaignInstance.ewolerWeeklyExpenditure(0);
        const firstStaffWeeklyExpenditure =
          await campaignInstance.stafferWeeklyExpenditure(0);

        //Ewoler - Staffer Pending Expenditure after 1 week
        await helpers.time.increase(days(7)); // Increase time 7 days
        const ewolerPendingExpenditureFirstWeek =
          await campaignInstance.pendingEwolerExpenditure(0);
        expect(ewolerPendingExpenditureFirstWeek)
          .to.equal(
            firstEwolerWeeklyExpenditure
          );

        const staffPendingExpenditureFirstWeek =
          await campaignInstance.pendingStafferExpenditure(0);
        expect(staffPendingExpenditureFirstWeek)
          .to.equal(
            firstStaffWeeklyExpenditure
          );

        //Ewoler - Staffer Pending Expenditure after 2 weeks
        await helpers.time.increase(days(7)); // Increase time another 7 days
        const ewolerPendingExpenditureSecondWeek =
          await campaignInstance.pendingEwolerExpenditure(0);
        expect(ewolerPendingExpenditureSecondWeek)
          .to.equal(
            firstEwolerWeeklyExpenditure.mul(2)
          );

        const staffPendingExpenditureSecondWeek =
          await campaignInstance.pendingEwolerExpenditure(0);
        expect(staffPendingExpenditureSecondWeek)
          .to.equal(
            firstStaffWeeklyExpenditure.mul(2)
          );
      });

      it("Should allow an ewoler to withdraw its Pending Expenditure", async function () {
        const totalExpendituresWithdrawnBefore =
          await campaignInstance.totalExpendituresWithdrawn();
        const ewolerTotalWithdrawalBefore =
          await campaignInstance.ewolerWithdrawals(0);
        const ewolerPendingExpenditure =
          await campaignInstance.pendingEwolerExpenditure(0); // Amount to withdraw
        const stablecoinBalanceOfEwolerBefore =
          await stablecoinInstance.balanceOf(sigAddrs.ewoler);
        const investmentTokenBalanceOfCampaignBefore =
          await investmentTokenInstance.balanceOf(campaignAddress);

        const ewolerWithdrawTx = await campaignInstance.withdrawEwolerExpenditure(
          0
        );
        await ewolerWithdrawTx.wait();

        const ewolerTotalWithdrawalAfter =
          await campaignInstance.ewolerWithdrawals(0);
        const totalExpendituresWithdrawnAfter =
          await campaignInstance.totalExpendituresWithdrawn();
        const stablecoinBalanceOfEwolerAfter = await stablecoinInstance.balanceOf(
          sigAddrs.ewoler
        );
        const investmentTokenBalanceOfCampaignAfter =
          await investmentTokenInstance.balanceOf(campaignAddress);

        // Pending witdrawal after the withdraw tx should be 0 again
        const ewolerPendingExpenditureAfterWithdraw =
          await campaignInstance.pendingEwolerExpenditure(0);
        expect(ewolerPendingExpenditureAfterWithdraw)
          .to.equal(0);

        //Mapping of ewolers whithdraw should sum the new withdraw amount
        expect(
            ewolerTotalWithdrawalAfter.sub(ewolerTotalWithdrawalBefore)
          )
          .to.equal(ewolerPendingExpenditure);

        //Mapping of total whithdraws (ewolers + staff) should sum the new withdraw amount
        expect(
            totalExpendituresWithdrawnAfter.sub(totalExpendituresWithdrawnBefore)
          )
          .to.equal(ewolerPendingExpenditure);

        // Ewoler Stablecoin balance should have increase the withdrawn amount
        expect(
            stablecoinBalanceOfEwolerAfter.sub(stablecoinBalanceOfEwolerBefore)
          )
          .to.equal(ewolerPendingExpenditure);

        // Campaign InvestmentToken balance should have decrease the withdrawn amount less any interests generated
        expect(
            investmentTokenBalanceOfCampaignBefore.sub(investmentTokenBalanceOfCampaignAfter)
          )
          .to.be.at.most(ewolerPendingExpenditure);
        expect(
            investmentTokenBalanceOfCampaignBefore.sub(investmentTokenBalanceOfCampaignAfter)
          )
          .to.be.at.least(ewolerPendingExpenditure.sub(hre.ethers.utils.parseUnits("0.01", 18)));
      });

      it("Should allow a staffer to withdraw its Pending Expenditure", async function () {
        const stablecoinBalanceOfStafferBefore =
          await stablecoinInstance.balanceOf(sigAddrs.staff);
        const totalExpendituresWithdrawnBefore =
          await campaignInstance.totalExpendituresWithdrawn();
        const stafferTotalWithdrawalBefore =
          await campaignInstance.stafferWithdrawals(0);
        const stafferPendingExpenditure =
          await campaignInstance.pendingStafferExpenditure(0); // Amount to whithdraw
        const investmentTokenBalanceOfCampaignBefore =
          await investmentTokenInstance.balanceOf(campaignAddress);

        const stafferWithdrawTx = await campaignInstance.withdrawStaffExpenditure(
          0
        );
        await stafferWithdrawTx.wait();

        const stafferTotalWithdrawalAfter =
          await campaignInstance.stafferWithdrawals(0);
        const totalExpendituresWithdrawnAfter =
          await campaignInstance.totalExpendituresWithdrawn();
        const stablecoinBalanceOfStafferAfter =
          await stablecoinInstance.balanceOf(sigAddrs.staff);
        const investmentTokenBalanceOfCampaignAfter =
          await investmentTokenInstance.balanceOf(campaignAddress);

        // Pending witdrawal after the withdraw tx should be 0 again
        const stafferPendingExpenditureAfterWithdraw =
          await campaignInstance.pendingStafferExpenditure(0);
        expect(stafferPendingExpenditureAfterWithdraw)
          .to.equal(0);

        //Mapping of staffer whithdraw should sum the new withdraw amount
        expect(
            stafferTotalWithdrawalAfter.sub(stafferTotalWithdrawalBefore)
          )
          .to.equal(stafferPendingExpenditure);

        //Mapping of total whithdraws (ewolers + staff) should sum the new withdraw amount
        expect(
            totalExpendituresWithdrawnAfter.sub(totalExpendituresWithdrawnBefore)
          )
          .to.equal(stafferPendingExpenditure);

        // Staffer Stablecoin balance should have increase the withdrawn amount
        expect(
            stablecoinBalanceOfStafferAfter.sub(stablecoinBalanceOfStafferBefore)
          )
          .to.equal(stafferPendingExpenditure);

        // Campaign InvestmentToken balance should have decrease the withdrawn amount
        expect(
            investmentTokenBalanceOfCampaignBefore.sub(investmentTokenBalanceOfCampaignAfter)
          )
          .to.be.at.most(stafferPendingExpenditure);
        expect(
            investmentTokenBalanceOfCampaignBefore.sub(investmentTokenBalanceOfCampaignAfter)
          )
          .to.be.at.least(stafferPendingExpenditure.sub(hre.ethers.utils.parseUnits("0.01", 18)));
      });

      it("Should prevent finishing the Bootcamp if Weeks Elapsed are less than WeeksOfBootcamp", async function () {
        const failedFinishBootcampTx = campaignInstance.finishBootcamp();
        expect(failedFinishBootcampTx)
          .to.be.revertedWith(
            "Bootcamp hasn't been completed"
          );
      });

      it("Should prevent a Non Owner to Finish Bootcamp", async function () {
        const campaignInstanceForNonOwner = campaignInstance.connect(
          sigInstances.nonOwner
        );

        const failedFinishBootcampTxNonOwner = campaignInstance.finishBootcamp();
        expect(failedFinishBootcampTxNonOwner)
          .to.be.revertedWith(
            "Ownable: caller is not the owner"
          );
      });

      it("Should prevent a staffer from transfering tokens before the Repayment period", async function () {
        const campaignInstanceForStaffr = campaignInstance.connect(
          sigInstances.staff
        );

        const staffTx = campaignInstanceForStaffr.transfer(
          sigAddrs.stranger,
          100000
        );
        await expect(staffTx)
          .to.be.revertedWith(
            "Unable to transfer until repayment period"
          );
      });

      it("Should allow an investor to transfer tokens before the Repayment period", async function () {
        const campaignInstanceForInvestor = campaignInstance.connect(
          sigInstances.investor
        );
        const balanceInvestorBeforTx = await campaignInstance.balanceOf(
          sigAddrs.investor
        );
        let value = balanceInvestorBeforTx.div(2);
        const investorTx = await campaignInstanceForInvestor.transfer(
          sigAddrs.stranger,
          value
        );
        investorTx.wait();
        const balanceInvestorAfterTx = await campaignInstance.balanceOf(
          sigAddrs.investor
        );
        expect(balanceInvestorAfterTx)
          .to.equal(
            balanceInvestorBeforTx.sub(value)
          );
      });

      it("Should Finish Bootcamp & Change Period Time to 'REPAYMENT'", async function () {
        await helpers.time.increase(weeks(9)); // Increase time another 9 weeks (2 had passed before)
        const FinishBootcampTx = await campaignInstance.finishBootcamp();

        expect(await campaignInstance.currentPeriod())
          .to.equal(
            PERIODS.REPAYMENT
          );
      });
    });
    describe("Repayment Period", function () {
      it("Should allow a staffer to transfer tokens on Repayment period", async function () {
        const campaignInstanceForStaffr = campaignInstance.connect(
          sigInstances.staff
        );
        const staffBalanceBeforeTx = await campaignInstance.balanceOf(
          sigAddrs.staff
        );
        const value = staffBalanceBeforeTx.div(2);

        const staffTx = await campaignInstanceForStaffr.transfer(
          sigAddrs.stranger,
          value
        );

        staffTx.wait();

        const staffBalanceAfterTx = await campaignInstance.balanceOf(
          sigAddrs.staff
        );

        expect(staffBalanceAfterTx)
          .to.equal(staffBalanceBeforeTx.sub(value));
      });

      it("Should calculates the correct amount of debt for an ewoler", async function () {
        const ewolerDebt = await campaignInstance.ewolerDebt(0);
        const total = (await campaignInstance.costForEwoler())
          .add(await campaignInstance.ewolerWithdrawals(0))
          .sub(await campaignInstance.ewolerRepayments(0));
        expect(ewolerDebt)
          .to.equal(total);
      });

      it("Should decrease debt if ewoler pays", async function () {
        const ewolerInstanceforStablecoin = await stablecoinInstance.connect(
          sigInstances.ewoler
        );
        const ewolerInitalDebt = await campaignInstance.ewolerDebt(0);
        const paymentApprove = await ewolerInstanceforStablecoin.approve(
          campaignAddress,
          ewolerInitalDebt.div(2)
        );
        await paymentApprove.wait();
        // console.log(await stablecoinInstance.balanceOf(sigAddrs.ewoler));
        const ewolerInstance = await campaignInstance.connect(
          sigInstances.ewoler
        );
        const ewolerPayment = await ewolerInstance.repayDebt(
          0,
          ewolerInitalDebt.div(2)
        );
        await ewolerPayment.wait();
        const ewolerFinalDebt = await campaignInstance.ewolerDebt(0);
        expect(ewolerInitalDebt)
          .to.equal(ewolerFinalDebt.mul(2));
      });

      it("Should prevent ewoler from paying more than owed", async function () {
        const ewolerInstanceforStablecoin = await stablecoinInstance.connect(
          sigInstances.ewoler
        );
        const ewolerInitalDebt = await campaignInstance.ewolerDebt(0);
        const paymentApprove = await ewolerInstanceforStablecoin.approve(
          campaignAddress,
          ewolerInitalDebt
        );
        await paymentApprove.wait();
        // console.log(await stablecoinInstance.balanceOf(sigAddrs.ewoler));
        const ewolerInstance = await campaignInstance.connect(
          sigInstances.ewoler
        );
        const ewolerPayment = ewolerInstance.repayDebt(0, ewolerInitalDebt + 1);
        await expect(ewolerPayment)
          .to.be.revertedWith("Paying more than owed");
      });

      it("Should allow campaign token holders to withdraw repayments", async function () {
        const investorReleasable = await campaignInstance.releasableRepayment(
          sigAddrs.investor
        );
        const investmentTokenBalanceOfCampaignBefore =
          await investmentTokenInstance.balanceOf(campaignAddress);
        const balanceStablecoinInvestorBefore =
          await stablecoinInstance.balanceOf(sigAddrs.investor);
        const totalRepaymentsWithdrawnBefore =
          await campaignInstance.totalRepaymentsWithdrawn();
        const repaymentsWithdrawnByInvestorBefore =
          await campaignInstance.repaymentsWithdrawn(sigAddrs.investor);

        const investorWithdrawal = await campaignInstance.withdrawRepayment(
          sigAddrs.investor
        );
        await investorWithdrawal.wait();

        const investmentTokenBalanceOfCampaignAfter =
          await investmentTokenInstance.balanceOf(campaignAddress);
        const balanceStablecoinInvestorAfter = await stablecoinInstance.balanceOf(
          sigAddrs.investor
        );
        const totalRepaymentsWithdrawnAfter =
          await campaignInstance.totalRepaymentsWithdrawn();
        const repaymentsWithdrawnByInvestorAfter =
          await campaignInstance.repaymentsWithdrawn(sigAddrs.investor);

        // Campaign InvestmentToken balance should have decrease the withdrawn amount less any interests generated
        expect(
            investmentTokenBalanceOfCampaignBefore.sub(investmentTokenBalanceOfCampaignAfter)
          )
          .to.be.at.most(investorReleasable);
        expect(
            investmentTokenBalanceOfCampaignBefore.sub(investmentTokenBalanceOfCampaignAfter)
          )
          .to.be.at.least(investorReleasable.sub(hre.ethers.utils.parseUnits("0.01", 18)));

        const actualRepayment = balanceStablecoinInvestorAfter.sub(balanceStablecoinInvestorBefore);

        expect(actualRepayment)
          .to.be.at.least(investorReleasable);
        expect(totalRepaymentsWithdrawnAfter.sub(totalRepaymentsWithdrawnBefore))
          .to.equal(actualRepayment);
        expect(repaymentsWithdrawnByInvestorAfter.sub(repaymentsWithdrawnByInvestorBefore))
          .to.equal(actualRepayment);
      });

      // This can't be tested this way because until all funds are completely depleted, 
      //   any remainder will generate interests releasable to all
      // it("Should prevent withdrawal if repayments are in zero ", async function () {
      //   const investorWithdrawal = campaignInstance.withdrawRepayment(
      //     sigAddrs.investor
      //   );
      //   await expect(investorWithdrawal)
      //     .to.be.revertedWith(
      //       "Claimer is not due payment"
      //     );
      // });
    });
  });
});
