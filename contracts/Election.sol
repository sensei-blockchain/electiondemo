pragma solidity ^0.4.24;

contract Election {

    /** @dev Defines a Voter struct with
     * @param registered bool to store the voter's registered status
     * @param voted bool to represent the voting status
     */
    struct Voter {
        bool registered;
        bool voted;
    }


    /** @dev Defines a Candidate struct with
     * @param id uint to store the candidates's identifier
     * @param name string to store the candidates's name
     * @param registered bool to store the candidate's registered status
     * @param voteCount uint to store the candidate's vote count
     */
    struct Candidate {
        uint id;
        string name;
        bool registered;
        uint voteCount;
    }

    // To store the number of candidates
    uint public candidatesCount;
    // To store the address of the chairperson
    address public chairperson;
    // To store the status of the election
    // true if election has started and false if stopped
    bool public votingStarted;

    // Mapping the voter to the unique identifier i.e the address of the voter
    mapping(address => Voter) public voters;
    // Mapping the candidate to the integer identifier
    mapping(uint => Candidate) public candidates;

    // Events
    event VotingToggledEvent (bool status);
    event CandidateAddedEvent (uint indexed candidateId);
    event VoterAddedEvent (address indexed voterAddress);
    event VotedEvent (address indexed voterAddress, uint indexed candidateId);

    /**
     * @dev Constructor
     * Assign the address of the contract deployer to the chairperson
     */
    constructor() public {
        chairperson = msg.sender;
    }

    /**
     * @dev addCandidate, to register a new candidate to the candadates mapping
     * Can only be called by the chairperson and when the election is in stopped state
     * Emits the event CandidateAddedEvent
     * @param candidateName string The name of the candidate
     */
    function addCandidate(string candidateName) public {
        require(msg.sender == chairperson);
        require(!votingStarted);

        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, candidateName, true, 0);

        emit CandidateAddedEvent(candidatesCount);
    }

    /**
     * @dev giveRightToVote, to authorize a voter
     * Can only be called by the chairperson and when the election is in stopped state
     * Throws error if the voter is already registered
     * Emits the event VoterAddedEvent
     * @param voterAddress string The address of the voter
     */
    function giveRightToVote (address voterAddress) public {
        require(msg.sender == chairperson);
        require(!votingStarted);
        require(!voters[voterAddress].registered);

        voters[voterAddress].registered = true;
        emit VoterAddedEvent(voterAddress);
    }

    /**
     * @dev vote, to cast a new vote
     * Can only be called by the registered voter who has not voted yet
     * Throws error if the voting has not started and if the candidate id is invalid
     * Emits the event VotedEvent
     * @param candidateId string The unique identifier of the candidate
     */
    function vote (uint candidateId) public {
        require(votingStarted);
        require(voters[msg.sender].registered && !voters[msg.sender].voted);
        require(candidates[candidateId].registered);

        voters[msg.sender].voted = true;
        candidates[candidateId].voteCount++;

        emit VotedEvent(msg.sender, candidateId);
    }

    /**
     * @dev toggleVoting, to toggle the election status
     * Can only be called by the chairperson
     * Emits the event VotingToggledEvent
     */
    function toggleVoting() public {
        require(msg.sender == chairperson);

        votingStarted = !votingStarted;

        emit VotingToggledEvent(votingStarted);
    }
}
