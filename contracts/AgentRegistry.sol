// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AgentRegistry
 * @dev On-chain registry for UACP agents on Somnia
 * @notice Manages agent registration, discovery, and status tracking
 */
contract AgentRegistry {
    // Agent status enum
    enum AgentStatus {
        OFFLINE,
        ONLINE,
        BUSY,
        ERROR
    }

    // Agent card structure
    struct AgentCard {
        string id; // DID format: did:somnia:agent-name
        string name;
        string description;
        string endpoint; // HTTP endpoint for A2A
        string[] capabilities;
        string[] paymentMethods;
        AgentStatus status;
        string version;
        address owner;
        uint256 createdAt;
        uint256 updatedAt;
        bool exists;
    }

    // State variables
    mapping(string => AgentCard) private agents; // id => AgentCard
    mapping(address => string[]) private ownerAgents; // owner => agent IDs
    mapping(string => string[]) private capabilityIndex; // capability => agent IDs
    string[] private allAgentIds;

    // Events
    event AgentRegistered(
        string indexed id,
        string name,
        address indexed owner,
        uint256 timestamp
    );

    event AgentUpdated(
        string indexed id,
        AgentStatus status,
        uint256 timestamp
    );

    event AgentUnregistered(
        string indexed id,
        address indexed owner,
        uint256 timestamp
    );

    event AgentStatusChanged(
        string indexed id,
        AgentStatus oldStatus,
        AgentStatus newStatus,
        uint256 timestamp
    );

    // Modifiers
    modifier onlyAgentOwner(string memory _id) {
        require(agents[_id].exists, "Agent does not exist");
        require(agents[_id].owner == msg.sender, "Not agent owner");
        _;
    }

    modifier agentExists(string memory _id) {
        require(agents[_id].exists, "Agent does not exist");
        _;
    }

    /**
     * @dev Register a new agent
     * @param _id Agent DID
     * @param _name Agent name
     * @param _description Agent description
     * @param _endpoint HTTP endpoint
     * @param _capabilities List of capabilities
     * @param _paymentMethods Supported payment methods
     * @param _version Agent version
     */
    function registerAgent(
        string memory _id,
        string memory _name,
        string memory _description,
        string memory _endpoint,
        string[] memory _capabilities,
        string[] memory _paymentMethods,
        string memory _version
    ) external {
        require(!agents[_id].exists, "Agent already registered");
        require(bytes(_id).length > 0, "Invalid agent ID");
        require(bytes(_name).length > 0, "Invalid agent name");
        require(_capabilities.length > 0, "At least one capability required");

        AgentCard storage agent = agents[_id];
        agent.id = _id;
        agent.name = _name;
        agent.description = _description;
        agent.endpoint = _endpoint;
        agent.capabilities = _capabilities;
        agent.paymentMethods = _paymentMethods;
        agent.status = AgentStatus.ONLINE;
        agent.version = _version;
        agent.owner = msg.sender;
        agent.createdAt = block.timestamp;
        agent.updatedAt = block.timestamp;
        agent.exists = true;

        // Update indexes
        allAgentIds.push(_id);
        ownerAgents[msg.sender].push(_id);

        // Index capabilities
        for (uint256 i = 0; i < _capabilities.length; i++) {
            capabilityIndex[_capabilities[i]].push(_id);
        }

        emit AgentRegistered(_id, _name, msg.sender, block.timestamp);
    }

    /**
     * @dev Update agent information
     * @param _id Agent ID
     * @param _description New description
     * @param _endpoint New endpoint
     * @param _capabilities New capabilities
     * @param _paymentMethods New payment methods
     */
    function updateAgent(
        string memory _id,
        string memory _description,
        string memory _endpoint,
        string[] memory _capabilities,
        string[] memory _paymentMethods
    ) external onlyAgentOwner(_id) {
        AgentCard storage agent = agents[_id];

        // Clear old capability indexes
        for (uint256 i = 0; i < agent.capabilities.length; i++) {
            _removeFromCapabilityIndex(agent.capabilities[i], _id);
        }

        // Update agent
        agent.description = _description;
        agent.endpoint = _endpoint;
        agent.capabilities = _capabilities;
        agent.paymentMethods = _paymentMethods;
        agent.updatedAt = block.timestamp;

        // Update capability indexes
        for (uint256 i = 0; i < _capabilities.length; i++) {
            capabilityIndex[_capabilities[i]].push(_id);
        }

        emit AgentUpdated(_id, agent.status, block.timestamp);
    }

    /**
     * @dev Update agent status
     * @param _id Agent ID
     * @param _status New status
     */
    function updateAgentStatus(
        string memory _id,
        AgentStatus _status
    ) external onlyAgentOwner(_id) {
        AgentCard storage agent = agents[_id];
        AgentStatus oldStatus = agent.status;
        agent.status = _status;
        agent.updatedAt = block.timestamp;

        emit AgentStatusChanged(_id, oldStatus, _status, block.timestamp);
    }

    /**
     * @dev Unregister an agent
     * @param _id Agent ID
     */
    function unregisterAgent(string memory _id) external onlyAgentOwner(_id) {
        AgentCard storage agent = agents[_id];

        // Clear capability indexes
        for (uint256 i = 0; i < agent.capabilities.length; i++) {
            _removeFromCapabilityIndex(agent.capabilities[i], _id);
        }

        // Remove from owner's agents
        _removeFromOwnerAgents(msg.sender, _id);

        // Remove from all agents
        _removeFromAllAgents(_id);

        // Delete agent
        delete agents[_id];

        emit AgentUnregistered(_id, msg.sender, block.timestamp);
    }

    /**
     * @dev Get agent by ID
     * @param _id Agent ID
     * @return AgentCard
     */
    function getAgent(string memory _id)
        external
        view
        agentExists(_id)
        returns (AgentCard memory)
    {
        return agents[_id];
    }

    /**
     * @dev Get agents by capability
     * @param _capability Capability name
     * @return Array of agent IDs
     */
    function getAgentsByCapability(string memory _capability)
        external
        view
        returns (string[] memory)
    {
        return capabilityIndex[_capability];
    }

    /**
     * @dev Get agents by owner
     * @param _owner Owner address
     * @return Array of agent IDs
     */
    function getAgentsByOwner(address _owner)
        external
        view
        returns (string[] memory)
    {
        return ownerAgents[_owner];
    }

    /**
     * @dev Get all agent IDs
     * @return Array of all agent IDs
     */
    function getAllAgentIds() external view returns (string[] memory) {
        return allAgentIds;
    }

    /**
     * @dev Get total number of registered agents
     * @return Total count
     */
    function getAgentCount() external view returns (uint256) {
        return allAgentIds.length;
    }

    /**
     * @dev Check if agent exists
     * @param _id Agent ID
     * @return bool
     */
    function agentExistsCheck(string memory _id) external view returns (bool) {
        return agents[_id].exists;
    }

    /**
     * @dev Get agent status
     * @param _id Agent ID
     * @return AgentStatus
     */
    function getAgentStatus(string memory _id)
        external
        view
        agentExists(_id)
        returns (AgentStatus)
    {
        return agents[_id].status;
    }

    // Internal helper functions

    function _removeFromCapabilityIndex(
        string memory _capability,
        string memory _id
    ) private {
        string[] storage ids = capabilityIndex[_capability];
        for (uint256 i = 0; i < ids.length; i++) {
            if (keccak256(bytes(ids[i])) == keccak256(bytes(_id))) {
                ids[i] = ids[ids.length - 1];
                ids.pop();
                break;
            }
        }
    }

    function _removeFromOwnerAgents(address _owner, string memory _id) private {
        string[] storage ids = ownerAgents[_owner];
        for (uint256 i = 0; i < ids.length; i++) {
            if (keccak256(bytes(ids[i])) == keccak256(bytes(_id))) {
                ids[i] = ids[ids.length - 1];
                ids.pop();
                break;
            }
        }
    }

    function _removeFromAllAgents(string memory _id) private {
        for (uint256 i = 0; i < allAgentIds.length; i++) {
            if (keccak256(bytes(allAgentIds[i])) == keccak256(bytes(_id))) {
                allAgentIds[i] = allAgentIds[allAgentIds.length - 1];
                allAgentIds.pop();
                break;
            }
        }
    }
}
