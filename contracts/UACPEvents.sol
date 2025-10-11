// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title UACPEvents
 * @dev Event logging contract for UACP agent communications
 * @notice Stores immutable audit trail of agent interactions
 */
contract UACPEvents {
    // Message type enum
    enum MessageType {
        REQUEST,
        RESPONSE,
        EVENT,
        ERROR
    }

    // Message priority enum
    enum MessagePriority {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }

    // Message event structure
    struct MessageEvent {
        string messageId;
        uint256 timestamp;
        string sender;
        string recipient;
        string intent;
        MessageType messageType;
        MessagePriority priority;
        bool paymentRequired;
        uint256 blockNumber;
        address logger;
    }

    // Payment event structure
    struct PaymentEvent {
        string messageId;
        string transactionHash;
        string asset;
        uint256 amount;
        string from;
        string to;
        uint256 timestamp;
        uint256 blockNumber;
    }

    // State variables
    mapping(string => MessageEvent) private messages;
    mapping(string => PaymentEvent) private payments;
    mapping(string => string[]) private agentMessages; // agentId => messageIds
    string[] private allMessageIds;
    uint256 private messageCount;
    uint256 private paymentCount;

    // Events
    event MessageLogged(
        string indexed messageId,
        string indexed sender,
        string indexed recipient,
        string intent,
        uint256 timestamp
    );

    event PaymentLogged(
        string indexed messageId,
        string transactionHash,
        uint256 amount,
        uint256 timestamp
    );

    event MessageResponseLogged(
        string indexed messageId,
        string indexed correlationId,
        bool success,
        uint256 timestamp
    );

    /**
     * @dev Log a message event
     * @param _messageId Unique message ID
     * @param _sender Sender agent DID
     * @param _recipient Recipient agent DID
     * @param _intent Message intent
     * @param _messageType Type of message
     * @param _priority Message priority
     * @param _paymentRequired Whether payment is required
     */
    function logMessage(
        string memory _messageId,
        string memory _sender,
        string memory _recipient,
        string memory _intent,
        MessageType _messageType,
        MessagePriority _priority,
        bool _paymentRequired
    ) external {
        require(bytes(_messageId).length > 0, "Invalid message ID");
        require(bytes(messages[_messageId].messageId).length == 0, "Message already logged");

        MessageEvent storage message = messages[_messageId];
        message.messageId = _messageId;
        message.timestamp = block.timestamp;
        message.sender = _sender;
        message.recipient = _recipient;
        message.intent = _intent;
        message.messageType = _messageType;
        message.priority = _priority;
        message.paymentRequired = _paymentRequired;
        message.blockNumber = block.number;
        message.logger = msg.sender;

        allMessageIds.push(_messageId);
        agentMessages[_sender].push(_messageId);
        agentMessages[_recipient].push(_messageId);
        messageCount++;

        emit MessageLogged(
            _messageId,
            _sender,
            _recipient,
            _intent,
            block.timestamp
        );
    }

    /**
     * @dev Log a payment event
     * @param _messageId Associated message ID
     * @param _transactionHash Blockchain transaction hash
     * @param _asset Asset address or identifier
     * @param _amount Payment amount
     * @param _from Payer address
     * @param _to Payee address
     */
    function logPayment(
        string memory _messageId,
        string memory _transactionHash,
        string memory _asset,
        uint256 _amount,
        string memory _from,
        string memory _to
    ) external {
        require(bytes(_messageId).length > 0, "Invalid message ID");
        require(bytes(_transactionHash).length > 0, "Invalid transaction hash");

        PaymentEvent storage payment = payments[_messageId];
        payment.messageId = _messageId;
        payment.transactionHash = _transactionHash;
        payment.asset = _asset;
        payment.amount = _amount;
        payment.from = _from;
        payment.to = _to;
        payment.timestamp = block.timestamp;
        payment.blockNumber = block.number;

        paymentCount++;

        emit PaymentLogged(
            _messageId,
            _transactionHash,
            _amount,
            block.timestamp
        );
    }

    /**
     * @dev Log a message response
     * @param _messageId Response message ID
     * @param _correlationId Original message ID
     * @param _success Whether the response was successful
     */
    function logMessageResponse(
        string memory _messageId,
        string memory _correlationId,
        bool _success
    ) external {
        require(bytes(_messageId).length > 0, "Invalid message ID");

        emit MessageResponseLogged(
            _messageId,
            _correlationId,
            _success,
            block.timestamp
        );
    }

    /**
     * @dev Get message event by ID
     * @param _messageId Message ID
     * @return MessageEvent
     */
    function getMessage(string memory _messageId)
        external
        view
        returns (MessageEvent memory)
    {
        require(bytes(messages[_messageId].messageId).length > 0, "Message not found");
        return messages[_messageId];
    }

    /**
     * @dev Get payment event by message ID
     * @param _messageId Message ID
     * @return PaymentEvent
     */
    function getPayment(string memory _messageId)
        external
        view
        returns (PaymentEvent memory)
    {
        require(bytes(payments[_messageId].messageId).length > 0, "Payment not found");
        return payments[_messageId];
    }

    /**
     * @dev Get messages for an agent
     * @param _agentId Agent DID
     * @return Array of message IDs
     */
    function getAgentMessages(string memory _agentId)
        external
        view
        returns (string[] memory)
    {
        return agentMessages[_agentId];
    }

    /**
     * @dev Get all message IDs
     * @return Array of all message IDs
     */
    function getAllMessageIds() external view returns (string[] memory) {
        return allMessageIds;
    }

    /**
     * @dev Get total message count
     * @return Total number of messages
     */
    function getMessageCount() external view returns (uint256) {
        return messageCount;
    }

    /**
     * @dev Get total payment count
     * @return Total number of payments
     */
    function getPaymentCount() external view returns (uint256) {
        return paymentCount;
    }

    /**
     * @dev Check if message exists
     * @param _messageId Message ID
     * @return bool
     */
    function messageExists(string memory _messageId) external view returns (bool) {
        return bytes(messages[_messageId].messageId).length > 0;
    }

    /**
     * @dev Check if payment exists for message
     * @param _messageId Message ID
     * @return bool
     */
    function paymentExists(string memory _messageId) external view returns (bool) {
        return bytes(payments[_messageId].messageId).length > 0;
    }

    /**
     * @dev Get recent messages (last N)
     * @param _count Number of messages to retrieve
     * @return Array of message IDs
     */
    function getRecentMessages(uint256 _count)
        external
        view
        returns (string[] memory)
    {
        uint256 total = allMessageIds.length;
        uint256 count = _count > total ? total : _count;
        string[] memory recent = new string[](count);

        for (uint256 i = 0; i < count; i++) {
            recent[i] = allMessageIds[total - count + i];
        }

        return recent;
    }
}
