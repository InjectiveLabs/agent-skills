// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Cosmos} from "./CosmosTypes.sol";
import {ExchangeTypes} from "./ExchangeTypes.sol";

interface IExchangeModule {
    /****************************************************************************
     * AUTHZ                                                                    *
     ****************************************************************************/

    /// @dev Authorization is a struct that contains the information about the
    /// authorization granted to a grantee by a granter.
    struct Authorization {
        ExchangeTypes.MsgType method; // the message type URL of the method for which the authorization is granted
        Cosmos.Coin[] spendLimit; // the spend limit - CHAIN FORMAT (token's native decimals, e.g., 1000000 = 1 USDT with 6 decimals)
        uint256 duration; // the time period for which the authorization is valid (in seconds)
    }

    /// @dev Approves a list of Cosmos messages.
    /// @param grantee The account address which will be authorized to spend the origin's funds.
    /// @param authorizations The list of authorizations to grant to the grantee.
    /// @return approved Boolean value to indicate if the approval was successful.
    function approve(
        address grantee,
        Authorization[] calldata authorizations
    ) external returns (bool approved);

    /// @dev Revokes a list of Cosmos messages.
    /// @param grantee The account address which will have its allowances revoked.
    /// @param methods The message type URLs of the methods to revoke.
    /// @return revoked Boolean value to indicate if the revocation was successful.
    function revoke(
        address grantee,
        ExchangeTypes.MsgType[] calldata methods
    ) external returns (bool revoked);

    /// @dev Checks if there is a valid grant from granter to grantee for specified
    /// message type
    /// @param grantee The account address which has the Authorization.
    /// @param granter The account address that grants an Authorization.
    /// @param method The message type URL of the methods for which the approval should be queried.
    /// @return allowed Boolean value to indicatie if the grant exists and is not expired
    function allowance(
        address grantee,
        address granter,
        ExchangeTypes.MsgType method
    ) external view returns (bool allowed);

    /****************************************************************************
     * ACCOUNT QUERIES                                                           *
     ****************************************************************************/

    /// @dev Queries a subaccount's deposits for a given denomination
    /// @param subaccountID The ID of the subaccount
    /// @param denom The coin denomination
    /// @return availableBalance The available balance - CHAIN FORMAT (token's native decimals, e.g., 1000000 = 1 USDT with 6 decimals)
    /// @return totalBalance The total balance - CHAIN FORMAT (token's native decimals, e.g., 1000000 = 1 USDT with 6 decimals)
    function subaccountDeposit(
        string calldata subaccountID,
        string calldata denom
    ) external view returns (uint256 availableBalance, uint256 totalBalance);

    /// @dev Queries all the deposits of a subaccount
    /// @param subaccountID The ID of the subaccount if trader and subaccountNonce are empty
    /// @param trader The address of the subaccount owner
    /// @param subaccountNonce The nonce of the subaccount
    /// @return deposits The array of deposits - CHAIN FORMAT: balances use token's native decimals
    function subaccountDeposits(
        string calldata subaccountID,
        string calldata trader,
        uint32 subaccountNonce
    ) external view returns (SubaccountDepositData[] calldata deposits);

    /// @dev SubaccountDepositData contains the information about a deposit.
    struct SubaccountDepositData {
        string denom;
        uint256 availableBalance; // CHAIN FORMAT (token's native decimals, e.g., 1000000 = 1 USDT with 6 decimals)
        uint256 totalBalance; // CHAIN FORMAT (token's native decimals, e.g., 1000000 = 1 USDT with 6 decimals)
    }

    /// @dev Queries all the derivative positions of a subaccount
    /// @param subaccountID The ID of the subaccount
    /// @return positions The array of positions - API FORMAT: numeric fields are human-readable scaled by 18 decimals
    function subaccountPositions(
        string calldata subaccountID
    ) external view returns (DerivativePosition[] calldata positions);

    /// @dev DerivativePosition records the conditions under which the trader has
    /// entered into the a derivative contract.
    /// note derivative orders represent intent, while positions represent
    /// possession.
    struct DerivativePosition {
        string subaccountID;
        string marketID;
        bool isLong;
        ExchangeTypes.UFixed256x18 quantity; // API FORMAT: human-readable scaled by 18 decimals (e.g., 5250000000000000000 = 5.25)
        ExchangeTypes.UFixed256x18 entryPrice; // API FORMAT: human-readable scaled by 18 decimals (e.g., 50123450000000000000000 = 50123.45)
        ExchangeTypes.UFixed256x18 margin; // API FORMAT: human-readable scaled by 18 decimals (e.g., 1000750000000000000000 = 1000.75)
        ExchangeTypes.UFixed256x18 cumulativeFundingEntry; // API FORMAT: human-readable scaled by 18 decimals
    }

    /****************************************************************************
     * ACCOUNT TRANSACTIONS                                                      *
     ****************************************************************************/

    /// @dev Transfers coins from the sender's bank balance into the subaccount's
    /// exchange deposit. This will increase both the AvailableBalance and the
    /// TotalBalance of the subaccount's deposit by the provided amount.
    /// @param sender The address of the sender, where the funds will come from
    /// @param subaccountID (optional) The ID of the subaccount to deposit funds
    /// into. If empty, the coins will be deposited into the sender's default
    /// subaccount
    /// @param denom The denomination of the coin to deposit
    /// @param amount The amount of coins to deposit - CHAIN FORMAT (token's native decimals, e.g., 6 for USDT, 18 for INJ)
    /// @return success Whether the transaction was successful or not
    function deposit(
        address sender,
        string calldata subaccountID,
        string calldata denom,
        uint256 amount
    ) external returns (bool success);

    /// @dev Withdraws from a subaccount's deposit to the sender's bank balance.
    /// This will decrement the subaccount's AvailableBalance and TotalBalance by
    /// the specified amount. Note that amount must be less than or equal to the
    /// deposit's AvailableBalance.
    /// @param sender The address of the sender, where coins will be sent to
    /// @param subaccountID The ID of the subaccount to withdraw funds from.
    /// Note the ownership of the subaccount by sender will be verified.
    /// @param denom The denomination of coins to withdraw
    /// @param amount The amount of coins to withdraw - CHAIN FORMAT (token's native decimals, e.g., 6 for USDT, 18 for INJ)
    /// @return success Whether the transaction was successful or not
    function withdraw(
        address sender,
        string calldata subaccountID,
        string calldata denom,
        uint256 amount
    ) external returns (bool success);

    /// @dev Transfers funds between two subaccounts owned by the sender
    /// @param sender The address of the sender
    /// @param sourceSubaccountID The ID of the originating subaccount
    /// @param destinationSubaccountID The ID of the destination subaccount
    /// @param denom The denomination of coins to transfer
    /// @param amount The amount of coins to transfer - CHAIN FORMAT (token's native decimals, e.g., 6 for USDT, 18 for INJ)
    /// @return success Whether the transaction was a success or not
    function subaccountTransfer(
        address sender,
        string calldata sourceSubaccountID,
        string calldata destinationSubaccountID,
        string calldata denom,
        uint256 amount
    ) external returns (bool success);

    /// @dev Transfers funds from one of the sender's subaccounts to an external
    /// subaccount, not necessarily owned by the sender
    /// @param sender The address of the sender
    /// @param sourceSubaccountID The ID of the originating subaccount
    /// @param destinationSubaccountID The ID of the destination subaccount
    /// @param denom The denomination of coins to transfer
    /// @param amount The amount of coins to transfer - CHAIN FORMAT (token's native decimals, e.g., 6 for USDT, 18 for INJ)
    /// @return success Whether the transaction was a success or not
    function externalTransfer(
        address sender,
        string calldata sourceSubaccountID,
        string calldata destinationSubaccountID,
        string calldata denom,
        uint256 amount
    ) external returns (bool success);

    /// @dev allows for the atomic cancellation and creation of spot and derivative
    /// limit orders, along with a new order cancellation mode. Upon execution,
    /// order cancellations (if any) occur first, followed by order creations
    // (if any).
    /// @param sender The address of the sender
    /// @param request cf. BatchUpdateOrdersRequest - API FORMAT: order price/quantity/margin fields are human-readable scaled by 18 decimals
    /// @return response cf. BatchUpdateOrdersResponse
    function batchUpdateOrders(
        address sender,
        BatchUpdateOrdersRequest calldata request
    ) external returns (BatchUpdateOrdersResponse calldata response);

    /// @dev BatchUpdateOrdersRequest encapsulates the parameters of batchUpdateOrders
    struct BatchUpdateOrdersRequest {
        /// the sender's subaccount ID
        string subaccountID;
        /// the list of spot market IDs for which the sender wants to cancel all open orders
        string[] spotMarketIDsToCancelAll;
        /// the specific spot orders the sender wants to cancel
        OrderData[] spotOrdersToCancel;
        /// the spot orders the sender wants to create
        SpotOrder[] spotOrdersToCreate;
        /// the list of derivative market IDs for which the sender wants to cancel all open orders
        string[] derivativeMarketIDsToCancelAll;
        /// the specific derivative orders the sender wants to cancel
        OrderData[] derivativeOrdersToCancel;
        /// the derivative orders the sender wants to create
        DerivativeOrder[] derivativeOrdersToCreate;
    }

    /// @dev BatchUpdateOrdersResponse encapsulates the return values of batchUpdateOrders
    struct BatchUpdateOrdersResponse {
        /// reflects the success of spot order cancellations
        bool[] spotCancelSuccess;
        /// hashes of created spot orders
        string[] spotOrderHashes;
        /// cids of created spot orders
        string[] createdSpotOrdersCids;
        /// cids of failed spot orders
        string[] failedSpotOrdersCids;
        /// reflects the success of derivative order cancellations
        bool[] derivativeCancelSuccess;
        /// hashes of created derivative orders
        string[] derivativeOrderHashes;
        /// cids of created derivative orders
        string[] createdDerivativeOrdersCids;
        /// cids of failed derivative orders
        string[] failedDerivativeOrdersCids;
    }

    /****************************************************************************
     * DERIVATIVE MARKETS QUERIES                                                *
     ****************************************************************************/

    /// @dev retrieves a trader's derivative orders by market ID, subaccount ID,
    /// and order hashes
    /// @param request cf. DerivativeOrdersRequest
    /// @return orders the trader's derivative orders - API FORMAT: numeric fields are human-readable scaled by 18 decimals
    function derivativeOrdersByHashes(
        DerivativeOrdersRequest calldata request
    ) external returns (TrimmedDerivativeLimitOrder[] calldata orders);

    /// @dev encapsulates the parameters for derivativeOrdersByHashes
    struct DerivativeOrdersRequest {
        /// the ID of the market in which to look
        string marketID;
        /// the ID of the subaccount that created the orders
        string subaccountID;
        /// the hashes of orders to look for
        string[] orderHashes;
    }

    /// @dev trimmed representation of a derivative limit order
    struct TrimmedDerivativeLimitOrder {
        ExchangeTypes.UFixed256x18 price; // API FORMAT: human-readable scaled by 18 decimals (e.g., 50123450000000000000000 = 50123.45)
        ExchangeTypes.UFixed256x18 quantity; // API FORMAT: human-readable scaled by 18 decimals (e.g., 5250000000000000000 = 5.25)
        ExchangeTypes.UFixed256x18 margin; // API FORMAT: human-readable scaled by 18 decimals (e.g., 1000750000000000000000 = 1000.75)
        ExchangeTypes.UFixed256x18 fillable; // the amount of the quantity remaining fillable - API FORMAT: human-readable scaled by 18 decimals
        bool isBuy;
        string orderHash;
        string cid;
    }

    /****************************************************************************
     * DERIVATIVE MARKETS TRANSACTIONS                                           *
     ****************************************************************************/

    /// @dev encapsulates fields required to create a derivative order (market or limit)
    struct DerivativeOrder {
        /// the unique ID of the market
        string marketID;
        /// subaccount that placed the order
        string subaccountID;
        /// address that will receive fees for the order
        string feeRecipient;
        /// price of the order - API FORMAT: human-readable scaled by 18 decimals (e.g., 50123450000000000000000 = 50123.45)
        ExchangeTypes.UFixed256x18 price;
        /// quantity of the order - API FORMAT: human-readable scaled by 18 decimals (e.g., 5250000000000000000 = 5.25)
        ExchangeTypes.UFixed256x18 quantity;
        /// order identifier
        string cid;
        /// order type ("buy", "sell", "buyPostOnly", or "sellPostOnly")
        string orderType;
        /// the margin used by the limit order - API FORMAT: human-readable scaled by 18 decimals (e.g., 1000750000000000000000 = 1000.75)
        ExchangeTypes.UFixed256x18 margin;
        /// the trigger price used by stop/take orders - API FORMAT: human-readable scaled by 18 decimals
        ExchangeTypes.UFixed256x18 triggerPrice;
    }

    /// @dev encapsulates the return values of createDerivativeLimitOrder
    struct CreateDerivativeLimitOrderResponse {
        string orderHash;
        string cid;
    }

    /// @dev encapsulates the return values of batchCreateDerivativeLimitOrders
    struct BatchCreateDerivativeLimitOrdersResponse {
        // hashes of created derivative limit orders
        string[] orderHashes;
        // cids of created orders
        string[] createdOrdersCids;
        // cids of failed orders
        string[] failedOrdersCids;
    }

    /// @dev encapsulates the return values of createDerivativeMarketOrderResponse
    struct CreateDerivativeMarketOrderResponse {
        string orderHash;
        string cid;
        ExchangeTypes.UFixed256x18 quantity; // API FORMAT: human-readable scaled by 18 decimals (e.g., 5250000000000000000 = 5.25)
        ExchangeTypes.UFixed256x18 price; // API FORMAT: human-readable scaled by 18 decimals (e.g., 50123450000000000000000 = 50123.45)
        ExchangeTypes.UFixed256x18 fee; // API FORMAT: human-readable scaled by 18 decimals
        ExchangeTypes.UFixed256x18 payout; // API FORMAT: human-readable scaled by 18 decimals
        ExchangeTypes.UFixed256x18 deltaExecutionQuantity; // API FORMAT: human-readable scaled by 18 decimals
        ExchangeTypes.UFixed256x18 deltaExecutionMargin; // API FORMAT: human-readable scaled by 18 decimals
        ExchangeTypes.UFixed256x18 deltaExecutionPrice; // API FORMAT: human-readable scaled by 18 decimals
        bool deltaIsLong;
    }

    /// @dev encapsulates data used to identify an order to cancel
    struct OrderData {
        string marketID;
        string subaccountID;
        string orderHash;
        int32 orderMask;
        string cid;
    }

    /// @dev orderMask values
    ///
    ///      OrderMask_UNUSED        OrderMask = 0
    ///      OrderMask_ANY           OrderMask = 1
    ///      OrderMask_REGULAR       OrderMask = 2
    ///      OrderMask_CONDITIONAL   OrderMask = 4
    ///      OrderMask_BUY_OR_HIGHER OrderMask = 8
    ///      OrderMask_SELL_OR_LOWER OrderMask = 16
    ///      OrderMask_MARKET        OrderMask = 32
    ///      OrderMask_LIMIT         OrderMask = 64

    /// @dev create a derivative limit order
    /// @param sender The address of the sender
    /// @param order The derivative order to create - API FORMAT: numeric fields are human-readable scaled by 18 decimals
    /// @return response cf CreateDerivativeLimitOrderResponse
    function createDerivativeLimitOrder(
        address sender,
        DerivativeOrder calldata order
    ) external returns (CreateDerivativeLimitOrderResponse calldata response);

    /// @dev create a batch of derivative limit orders
    /// @param sender The address of the sender
    /// @param orders The orders to create - API FORMAT: numeric fields are human-readable scaled by 18 decimals
    /// @return response cf. BatchCreateDerivativeLimitOrdersResponse
    function batchCreateDerivativeLimitOrders(
        address sender,
        DerivativeOrder[] calldata orders
    )
        external
        returns (BatchCreateDerivativeLimitOrdersResponse calldata response);

    /// @dev create a derivative market order
    /// @param sender The address of the sender
    /// @param order The order to create - API FORMAT: numeric fields are human-readable scaled by 18 decimals
    /// @return response cf. CreateDerivativeMarketOrderResponse - API FORMAT: numeric fields are human-readable scaled by 18 decimals
    function createDerivativeMarketOrder(
        address sender,
        DerivativeOrder calldata order
    ) external returns (CreateDerivativeMarketOrderResponse calldata response);

    /// @dev cancel a derivative order
    /// @param marketID The market the order is in
    /// @param subaccountID The subaccount that placed the order
    /// @param orderHash The order hash
    /// @param orderMask The order mask (use default 0 if you don't know what this is)
    /// @param cid The identifier of the order
    /// @return success Whether the order was successfully cancelled
    function cancelDerivativeOrder(
        address sender,
        string calldata marketID,
        string calldata subaccountID,
        string calldata orderHash,
        int32 orderMask,
        string calldata cid
    ) external returns (bool success);

    /// @dev cancel a batch of derivative orders
    /// @param sender The address of the sender
    /// @param data The data of the orders to cancel
    /// @return success Whether each cancellation succeeded
    function batchCancelDerivativeOrders(
        address sender,
        OrderData[] calldata data
    ) external returns (bool[] calldata success);

    /// @dev increase the margin of a position
    /// @param sender The address of the sender
    /// @param sourceSubaccountID The subaccount to send balance from
    /// @param destinationSubaccountID The subaccount that owns the position
    /// @param marketID The market where position is in
    /// @param amount The amount by which to increase the position margin - API FORMAT: human-readable scaled by 18 decimals (e.g., 1000750000000000000000 = 1000.75)
    /// @return success Whether the operation succeeded or not
    function increasePositionMargin(
        address sender,
        string calldata sourceSubaccountID,
        string calldata destinationSubaccountID,
        string calldata marketID,
        ExchangeTypes.UFixed256x18 amount
    ) external returns (bool success);

    /// @dev defines a request to decrease the margin of a position
    /// @param sender The address of the sender
    /// @param sourceSubaccountID The subaccount that owns the position
    /// @param destinationSubaccountID The subaccount to send balance to
    /// @param marketID The market where position is in
    /// @param amount The amount by which to decrease the position margin - API FORMAT: human-readable scaled by 18 decimals (e.g., 500250000000000000000 = 500.25)
    /// @return success Whether the operation succeeded or not
    function decreasePositionMargin(
        address sender,
        string calldata sourceSubaccountID,
        string calldata destinationSubaccountID,
        string calldata marketID,
        ExchangeTypes.UFixed256x18 amount
    ) external returns (bool success);

    /****************************************************************************
     * SPOT MARKETS QUERIES                                                      *
     ****************************************************************************/

    /// @dev retrieves a trader's spot orders by market ID, subaccount ID,
    /// and order hashes
    /// @param request cf. SpotOrdersRequest
    /// @return orders the trader's spot orders - API FORMAT: numeric fields are human-readable scaled by 18 decimals
    function spotOrdersByHashes(
        SpotOrdersRequest calldata request
    ) external returns (TrimmedSpotLimitOrder[] calldata orders);

    /// @dev encapsulates the parameters for spotOrdersByHashes
    struct SpotOrdersRequest {
        /// the ID of the market in which to look
        string marketID;
        /// the ID of the subaccount that placed the orders
        string subaccountID;
        /// the hashes of orders to look for
        string[] orderHashes;
    }

    /// @dev trimmed representation of a spot limit order
    struct TrimmedSpotLimitOrder {
        ExchangeTypes.UFixed256x18 price; // API FORMAT: human-readable scaled by 18 decimals (e.g., 1050000000000000000 = 1.05)
        ExchangeTypes.UFixed256x18 quantity; // API FORMAT: human-readable scaled by 18 decimals (e.g., 100250000000000000000 = 100.25)
        ExchangeTypes.UFixed256x18 fillable; // the amount of the quantity remaining fillable - API FORMAT: human-readable scaled by 18 decimals
        bool isBuy;
        string orderHash;
        string cid;
    }

    /****************************************************************************
     * SPOT MARKETS TRANSACTIONS                                                 *
     ****************************************************************************/

    /// @dev encapsulates fields required to create a spot order (market or limit)
    struct SpotOrder {
        /// the unique ID of the market
        string marketID;
        /// subaccount that creates the order
        string subaccountID;
        /// address that will receive fees for the order
        string feeRecipient;
        /// price of the order - API FORMAT: human-readable scaled by 18 decimals (e.g., 1050000000000000000 = 1.05)
        ExchangeTypes.UFixed256x18 price;
        /// quantity of the order - API FORMAT: human-readable scaled by 18 decimals (e.g., 100250000000000000000 = 100.25)
        ExchangeTypes.UFixed256x18 quantity;
        /// order identifier
        string cid;
        /// order type ( "buy", "sell", "buyPostOnly", or "sellPostOnly")
        string orderType;
        /// the trigger price used by stop/take orders - API FORMAT: human-readable scaled by 18 decimals
        ExchangeTypes.UFixed256x18 triggerPrice;
    }

    /// @dev encapsulates the return values of createSpotLimitOrder
    struct CreateSpotLimitOrderResponse {
        string orderHash;
        string cid;
    }

    /// @dev encapsulates the return values of batchCreateSpotLimitOrders
    struct BatchCreateSpotLimitOrdersResponse {
        /// hashes of created spot orders
        string[] orderHashes;
        /// cids of created spot orders
        string[] createdOrdersCids;
        /// cids of failed spot orders
        string[] failedOrdersCids;
    }

    /// @dev encapsulates the return values of createSpotMarketOrder
    struct CreateSpotMarketOrderResponse {
        string orderHash;
        string cid;
        ExchangeTypes.UFixed256x18 quantity; // API FORMAT: human-readable scaled by 18 decimals (e.g., 100250000000000000000 = 100.25)
        ExchangeTypes.UFixed256x18 price; // API FORMAT: human-readable scaled by 18 decimals (e.g., 1050000000000000000 = 1.05)
        ExchangeTypes.UFixed256x18 fee; // API FORMAT: human-readable scaled by 18 decimals
    }

    /// @dev create a spot limit order
    /// @param sender The address of the sender
    /// @param order The spot order to create - API FORMAT: numeric fields are human-readable scaled by 18 decimals
    /// @return response cf. CreateSpotLimitOrderResponse
    function createSpotLimitOrder(
        address sender,
        SpotOrder calldata order
    ) external returns (CreateSpotLimitOrderResponse calldata response);

    /// @dev create a batch of spot limit orders
    /// @param sender The address of the sender
    /// @param orders The orders to create - API FORMAT: numeric fields are human-readable scaled by 18 decimals
    /// @return response cf. BatchCreateSpotOrdersResponse
    function batchCreateSpotLimitOrders(
        address sender,
        SpotOrder[] calldata orders
    ) external returns (BatchCreateSpotLimitOrdersResponse calldata response);

    /// @dev create a spot market order
    /// @param sender The address of the sender
    /// @param order The order to create - API FORMAT: numeric fields are human-readable scaled by 18 decimals
    /// @return response cf. batchCreateSpotMarketOrderResponse - API FORMAT: numeric fields are human-readable scaled by 18 decimals
    function createSpotMarketOrder(
        address sender,
        SpotOrder calldata order
    ) external returns (CreateSpotMarketOrderResponse calldata response);

    /// @dev cancel a spot order
    /// @param marketID The market the order is in
    /// @param subaccountID The subaccount that created the order
    /// @param orderHash The order hash
    /// @param cid The identifier of the order
    /// @return success Whether the order was successfully cancelled
    function cancelSpotOrder(
        address sender,
        string calldata marketID,
        string calldata subaccountID,
        string calldata orderHash,
        string calldata cid
    ) external returns (bool success);

    /// @dev cancel a batch of spot orders
    /// @param sender The address of the sender
    /// @param data The data of the orders to cancel
    /// @return success Whether each cancellation succeeded
    function batchCancelSpotOrders(
        address sender,
        OrderData[] calldata data
    ) external returns (bool[] calldata success);
}
