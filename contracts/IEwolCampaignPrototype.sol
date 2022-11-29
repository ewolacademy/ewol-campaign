// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 < 0.9.0;

/// @title Ewol Campaign Prototype
/// @author heidrian.eth
/// @notice This contract is used as prototype to clone each Ewol Academy Web3 Bootcamp campaign
interface IEwolCampaignPrototype {

  /// @notice Initialize the new campaign
  /// @dev 
  /// @param _targetEwolers       Target quantity of Ewolers to raise funding for
  /// @param _investmentPerEwoler Amount of currency to be raised per Ewoler
  /// @param _currencyToken       Address of the ERC20 token used as campaign currency
  /// @param _weeksOfBootcamp     Number of weeks of the bootcamp
  /// @param _premintAmount       Amount of campaign tokens preminted for the campaign launcher
  function init (
    uint16 _targetEwolers,
    uint256 _investmentPerEwoler,
    address _currencyToken,
    uint8 _weeksOfBootcamp,
    uint256 _premintAmount
  ) public virtual;

  /// @notice Total to invest in this campaign
  /// @dev 
  /// @return Total to invest in this campaign
  function investmentCap () public virtual view returns (uint256);

  /// @notice Deposit tokens to invest in the campaign
  /// @dev The contract will include a list of prevetted tokens
  /// @param _depositToken  Address of the ERC20 token used to fund the investment
  /// @param _amount        Amount to deposit of the `_depositToken`
  function depositInvestment (
    address _depositToken,
    uint256 _amount
  ) public virtual;

  /// @notice Enroll an Ewoler in the campaign
  /// @param _ewolerId          ID for the ewoler
  /// @param _ewolerAddress     Address of the ewoler wallet
  /// @param _weeklyExpenditure Amount of currency tokens to be released per week as expenditure
  function enrollEwoler (
    uint256 _ewolerId,
    address _ewolerAddress,
    uint256 _weeklyExpenditure
  ) public virtual;

  /// @notice Enroll an Ewol Staff Member in the campaign
  /// @param _stafferId         ID for the staffer
  /// @param _stafferAddress    Address of the staffer wallet
  /// @param _weeklyExpenditure Amount of currency tokens to be released per week as expenditure
  /// @param _variableComp      Variable compensation denominated in campaign tokens
  function enrollStaff (
    uint256 _stafferId,
    address _stafferAddress,
    uint256 _weeklyExpenditure,
    uint256 _variableComp
  ) public virtual;

  /// @notice Remove an Ewoler from the campaign
  /// @param _ewolerId          ID for the ewoler
  function removeEwoler (
    uint256 _ewolerId
  ) public virtual;

  /// @notice Remove an Ewol Staff Member from the campaign
  /// @param _stafferId         ID for the staffer
  function removeStaff (
    uint256 _stafferId
  ) public virtual;

  /// @notice Start the Bootcamp period
  function startBootcamp () public virtual;

  /// @notice Withdraw an Ewoler expenditure
  /// @param _ewolerId          ID for the ewoler
  function withdrawEwolerExpenditure (
    uint256 _ewolerId
  ) public virtual;

  /// @notice Withdraw an Ewol Staff Member expenditure
  /// @param _stafferId         ID for the staffer
  function withdrawStaffExpenditure (
    uint256 _stafferId
  ) public virtual;

  /// @notice Finish the Bootcamp period
  function finishBootcamp () public virtual;

  /// @notice Get Ewoler debt amount
  /// @param _ewolerId          ID for the ewoler
  /// @return Amount of ewolr debt denominated in currency tokens
  function ewolerDebt (
    uint256 _ewolerId
  ) public view virtual returns (uint256);

  /// @notice Repay the ewoler debt
  /// @param _ewolerId      ID for the ewoler
  /// @param _amount        Amount to deposit of the `_depositToken`
  function repayDebt (
    uint256 _ewolerId,
    uint256 _amount
  ) public virtual;

  /// @notice Withdraw repayment amount
  /// @dev Amount to withdraw is proportional to campaign tokens holding
  /// @param _claimer Address of the campaign token holder withdrawing a repayment
  function withdrawRepayment (
    address _claimer
  ) public virtual;
}