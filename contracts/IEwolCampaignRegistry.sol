// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 < 0.9.0;

/// @title Ewol Campaign Registry
/// @author heidrian.eth
/// @notice This contract is used to launch Ewol Academy Web3 Bootcamp campaigns
interface IEwolCampaignRegistry {

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
  ) external returns (uint256, address);

  /// @notice Update the protype contract address to be cloned on launch
  /// @param _implementation      Prototype contract address
  function updateCampaignPrototype (address _implementation) external;
}