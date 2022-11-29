// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 < 0.9.0;

/// @title Ewol Campaign Factory
/// @author heidrian.eth
/// @notice This contract is used to launch Ewol Academy Web3 Bootcamp campaigns
interface IEwolCampaignFactory {

  /// @notice Launch a new campaign
  /// @dev 
  /// @param _targetEwolers       Target quantity of Ewolers to raise funding for
  /// @param _investmentPerEwoler Amount of currency to be raised per Ewoler
  /// @param _currencyToken       Address of the ERC20 token used as campaign currency
  /// @param _weeksOfBootcamp     Number of weeks of the bootcamp
  /// @param _premintAmount       Amount of campaign tokens preminted for the campaign launcher
  /// @return _campaignId         ID of the campaign
  ///         _campaignAddress    Campaign contract address
  function launchCampaign (
    uint16 _targetEwolers,
    uint256 _investmentPerEwoler,
    address _currencyToken,
    uint8 _weeksOfBootcamp,
    uint256 _premintAmount
  ) external virtual returns (uint256, address);

  /// @notice Get campaign information
  /// @param _campaignId          ID of the campaign
  /// @return _campaignAddress    Campaign contract address
  ///         _launchTimestamp    Timestamp when campaign was launched
  ///         _campaignLauncher   Address of campaign launcher
  function getCampaign (uint256 _campaignId) returns (address, uint64, address);
}